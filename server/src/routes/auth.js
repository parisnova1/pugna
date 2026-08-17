import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { signToken, requireAuth } from '../auth.js'

const router = Router()

const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?')
const getUserById = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?')
const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
const insertClub = db.prepare('INSERT INTO clubs (owner_id, name) VALUES (?, ?)')

const ROLES = new Set(['organizer', 'club', 'viewer'])

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role }
}

router.post('/signup', (req, res) => {
  const { name, email, password, role } = req.body || {}

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
  const info = insertUser.run(name.trim(), normalizedEmail, passwordHash, role || 'viewer')
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

router.get('/me', requireAuth, (req, res) => {
  const row = getUserById.get(req.userId)
  if (!row) return res.status(404).json({ error: 'User not found.' })
  res.json({ user: publicUser(row) })
})

export default router
