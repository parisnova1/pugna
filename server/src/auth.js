import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Check that server/.env exists and was loaded before this module.')
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not authenticated.' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' })
  }
}
