import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { DISCIPLINES } from '../constants.js'

const router = Router()

const DISCIPLINE_SET = new Set(DISCIPLINES)
const LEVELS = new Set(['Amateur', 'Intermediate', 'Advanced', 'All Levels'])

const REGISTERED_FIGHTERS_SUBQUERY = `
  COALESCE((SELECT SUM(fighter_count) FROM sparring_registrations WHERE session_id = sparring_sessions.id), 0)
`

const listUpcoming = db.prepare(`
  SELECT sparring_sessions.*, clubs.name AS host_name, ${REGISTERED_FIGHTERS_SUBQUERY} AS registered_fighters
  FROM sparring_sessions
  JOIN clubs ON clubs.id = sparring_sessions.club_id
  WHERE sparring_sessions.date >= date('now')
  ORDER BY sparring_sessions.date ASC, sparring_sessions.time ASC
`)
const listForClub = db.prepare(`
  SELECT sparring_sessions.*, ${REGISTERED_FIGHTERS_SUBQUERY} AS registered_fighters
  FROM sparring_sessions
  WHERE club_id = ?
  ORDER BY date DESC, time DESC
`)
const getSession = db.prepare('SELECT * FROM sparring_sessions WHERE id = ?')
const getClubByOwner = db.prepare('SELECT * FROM clubs WHERE owner_id = ?')
const getUserById = db.prepare('SELECT id, role FROM users WHERE id = ?')
const insertSession = db.prepare(`
  INSERT INTO sparring_sessions (club_id, discipline, location, date, time, weight_range, level, spots)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)
const deleteSession = db.prepare('DELETE FROM sparring_sessions WHERE id = ?')

const listParticipants = db.prepare(`
  SELECT sparring_registrations.*, clubs.name AS club_name
  FROM sparring_registrations
  JOIN clubs ON clubs.id = sparring_registrations.club_id
  WHERE session_id = ?
  ORDER BY created_at ASC
`)
const getRegistration = db.prepare('SELECT * FROM sparring_registrations WHERE session_id = ? AND club_id = ?')
const sumOtherFighters = db.prepare(`
  SELECT COALESCE(SUM(fighter_count), 0) AS n FROM sparring_registrations WHERE session_id = ? AND club_id != ?
`)
const upsertRegistration = db.prepare(`
  INSERT INTO sparring_registrations (session_id, club_id, fighter_count, weight_category)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(session_id, club_id) DO UPDATE SET fighter_count = excluded.fighter_count, weight_category = excluded.weight_category
`)
const deleteRegistration = db.prepare('DELETE FROM sparring_registrations WHERE session_id = ? AND club_id = ?')

function requireClub(req, res) {
  const user = getUserById.get(req.userId)
  if (!user || user.role !== 'club') {
    res.status(403).json({ error: 'Only club accounts can access this.' })
    return null
  }
  const club = getClubByOwner.get(req.userId)
  if (!club) {
    res.status(404).json({ error: 'Club profile not found.' })
    return null
  }
  return club
}

function validate({ discipline, location, date, time, spots, level }) {
  if (!discipline || !DISCIPLINE_SET.has(discipline)) return 'Choose a valid discipline.'
  if (!location?.trim()) return 'Location is required.'
  if (!date?.trim()) return 'Date is required.'
  if (!time?.trim()) return 'Time is required.'
  if (!Number.isInteger(spots) || spots < 1) return 'Spots must be a positive whole number.'
  if (level && !LEVELS.has(level)) return 'Invalid level.'
  return null
}

router.get('/', (_req, res) => {
  res.json({ sessions: listUpcoming.all() })
})

router.get('/me', requireAuth, (req, res) => {
  const club = requireClub(req, res)
  if (!club) return
  res.json({ sessions: listForClub.all(club.id) })
})

router.post('/', requireAuth, (req, res) => {
  const club = requireClub(req, res)
  if (!club) return

  const { discipline, location, date, time, weightRange, level, spots } = req.body || {}
  const error = validate({ discipline, location, date, time, spots, level })
  if (error) return res.status(400).json({ error })

  const info = insertSession.run(
    club.id, discipline, location.trim(), date.trim(), time.trim(),
    weightRange?.trim() || '', level || 'All Levels', spots,
  )
  res.status(201).json({ session: getSession.get(info.lastInsertRowid) })
})

router.delete('/:id', requireAuth, (req, res) => {
  const club = requireClub(req, res)
  if (!club) return

  const session = getSession.get(req.params.id)
  if (!session || session.club_id !== club.id) return res.status(404).json({ error: 'Sparring session not found.' })

  deleteSession.run(session.id)
  res.status(204).end()
})

router.get('/:id/participants', (req, res) => {
  const session = getSession.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Sparring session not found.' })
  res.json({ participants: listParticipants.all(session.id) })
})

router.post('/:id/join', requireAuth, (req, res) => {
  const club = requireClub(req, res)
  if (!club) return

  const session = getSession.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Sparring session not found.' })
  if (session.club_id === club.id) return res.status(400).json({ error: 'You can’t join your own sparring session.' })

  const { fighterCount, weightCategory } = req.body || {}
  if (!Number.isInteger(fighterCount) || fighterCount < 1) {
    return res.status(400).json({ error: 'Number of fighters must be a positive whole number.' })
  }
  if (!weightCategory?.trim()) return res.status(400).json({ error: 'Weight category is required.' })

  const otherFighters = sumOtherFighters.get(session.id, club.id).n
  if (otherFighters + fighterCount > session.spots) {
    const remaining = Math.max(0, session.spots - otherFighters)
    return res.status(400).json({ error: `Only ${remaining} spot${remaining === 1 ? '' : 's'} left in this session.` })
  }

  upsertRegistration.run(session.id, club.id, fighterCount, weightCategory.trim())
  res.status(201).json({ participants: listParticipants.all(session.id) })
})

router.delete('/:id/join', requireAuth, (req, res) => {
  const club = requireClub(req, res)
  if (!club) return

  const session = getSession.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Sparring session not found.' })

  deleteRegistration.run(session.id, club.id)
  res.status(204).end()
})

export default router
