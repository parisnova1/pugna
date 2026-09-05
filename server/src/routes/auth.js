import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { db } from '../db.js'
import { signToken, requireAuth } from '../auth.js'

const router = Router()

const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?')
const getUserByGoogleId = db.prepare('SELECT * FROM users WHERE google_id = ?')
const getUserById = db.prepare('SELECT id, name, email, role, home_location FROM users WHERE id = ?')
const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role, home_location) VALUES (?, ?, ?, ?, ?)')
const insertGoogleUser = db.prepare('INSERT INTO users (name, email, password_hash, role, home_location, google_id) VALUES (?, ?, ?, ?, ?, ?)')
const linkGoogleId = db.prepare('UPDATE users SET google_id = ? WHERE id = ?')
const insertClub = db.prepare('INSERT INTO clubs (owner_id, name) VALUES (?, ?)')

// Same client IDs the mobile app has as EXPO_PUBLIC_GOOGLE_CLIENT_ID_* —
// the server needs the plain (non-EXPO_PUBLIC_) versions since it's never
// bundled into a client. All configured IDs are accepted as valid audiences
// since a single sign-in flow may have been issued by any one of them
// (web/iOS/Android each get their own Google Cloud OAuth client).
const googleClient = new OAuth2Client()
const GOOGLE_AUDIENCES = [
  process.env.GOOGLE_CLIENT_ID_WEB,
  process.env.GOOGLE_CLIENT_ID_IOS,
  process.env.GOOGLE_CLIENT_ID_ANDROID,
].filter(Boolean)

const ROLES = new Set(['organizer', 'club', 'viewer', 'fighter'])

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role, home_location: row.home_location || '' }
}

router.post('/signup', (req, res) => {
  const { name, email, password, role, homeLocation } = req.body || {}

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' })
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }
  if (role && !ROLES.has(role)) {
    return res.status(400).json({ error: 'Invalid account type.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (getUserByEmail.get(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const info = insertUser.run(name.trim(), normalizedEmail, passwordHash, role || 'viewer', (homeLocation || '').trim())
  const user = publicUser(getUserById.get(info.lastInsertRowid))

  if (user.role === 'club') {
    insertClub.run(user.id, name.trim())
  }

  res.status(201).json({ token: signToken(user), user })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const row = getUserByEmail.get(email.trim().toLowerCase())
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  const user = publicUser(row)
  res.json({ token: signToken(user), user })
})

router.post('/google', async (req, res) => {
  const { idToken, role, homeLocation } = req.body || {}
  if (!idToken) {
    return res.status(400).json({ error: 'Missing Google credential.' })
  }
  if (GOOGLE_AUDIENCES.length === 0) {
    return res.status(500).json({ error: 'Google sign-in is not configured on the server.' })
  }

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_AUDIENCES })
    payload = ticket.getPayload()
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential.' })
  }
  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ error: 'Invalid Google credential.' })
  }

  const email = payload.email.toLowerCase()
  const name = payload.name || email.split('@')[0]

  let row = getUserByGoogleId.get(payload.sub)
  if (!row) {
    const existingByEmail = getUserByEmail.get(email)
    if (existingByEmail) {
      // Link rather than reject or fork a second account — same email means
      // same person, whether they signed up with a password before or not.
      linkGoogleId.run(payload.sub, existingByEmail.id)
      row = existingByEmail
    } else {
      // No real password to check against — a random hash means email/password
      // login can never succeed for this account, only Google sign-in can.
      const passwordHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 10)
      const chosenRole = role && ROLES.has(role) ? role : 'viewer'
      const info = insertGoogleUser.run(name, email, passwordHash, chosenRole, (homeLocation || '').trim(), payload.sub)
      row = getUserById.get(info.lastInsertRowid)
      if (chosenRole === 'club') {
        insertClub.run(row.id, name)
      }
    }
  }

  const user = publicUser(row)
  res.json({ token: signToken(user), user })
})

router.get('/me', requireAuth, (req, res) => {
  const row = getUserById.get(req.userId)
  if (!row) return res.status(404).json({ error: 'User not found.' })
  res.json({ user: publicUser(row) })
})

export default router
