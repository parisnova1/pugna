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
  INSERT INTO sparring_sessions (club_id, discipline, location, date, time, weight_range, level, spots, message)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const deleteSession = db.prepare('DELETE FROM sparring_sessions WHERE id = ?')
const setAcceptingRequests = db.prepare('UPDATE sparring_sessions SET accepting_requests = ? WHERE id = ?')

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

function validate({ discipline, location, date, time, spots, levels }) {
  if (!discipline || !DISCIPLINE_SET.has(discipline)) return 'Choose a valid discipline.'
  if (!location?.trim()) return 'Location is required.'
  if (!date?.trim()) return 'Date is required.'
  if (!time?.trim()) return 'Time is required.'
  // 0 means unlimited — spots is optional, not required to be positive.
  if (!Number.isInteger(spots) || spots < 0) return 'Spots must be a non-negative whole number.'
  if (!Array.isArray(levels) || levels.length === 0) return 'Choose at least one level.'
  if (levels.some(l => !LEVELS.has(l))) return 'Invalid level.'
  return null
}

// "All Levels" is exclusive — if it's among the selected levels, it replaces
// the rest rather than combining with them.
function normalizeLevels(levels) {
  return levels.includes('All Levels') ? ['All Levels'] : levels
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

  const { discipline, location, date, time, weightRange, levels, spots, message } = req.body || {}
  const normalizedLevels = normalizeLevels(Array.isArray(levels) ? levels : [])
  const spotsValue = spots === undefined || spots === null || spots === '' ? 0 : Number(spots)
  const error = validate({ discipline, location, date, time, spots: spotsValue, levels: normalizedLevels })
  if (error) return res.status(400).json({ error })

  const info = insertSession.run(
    club.id, discipline, location.trim(), date.trim(), time.trim(),
    weightRange?.trim() || '', normalizedLevels.join(','), spotsValue, message?.trim() || '',
  )
  res.status(201).json({ session: getSession.get(info.lastInsertRowid) })
})

router.patch('/:id', requireAuth, (req, res) => {
  const club = requireClub(req, res)
  if (!club) return

  const session = getSession.get(req.params.id)
  if (!session || session.club_id !== club.id) return res.status(404).json({ error: 'Sparring session not found.' })

  const { acceptingRequests } = req.body || {}
  if (typeof acceptingRequests !== 'boolean') return res.status(400).json({ error: 'acceptingRequests must be a boolean.' })

  setAcceptingRequests.run(acceptingRequests ? 1 : 0, session.id)
  res.json({ session: getSession.get(session.id) })
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
  if (!session.accepting_requests) return res.status(400).json({ error: 'This session is no longer accepting requests.' })

  const { fighterCount, weightCategory } = req.body || {}
  if (!Number.isInteger(fighterCount) || fighterCount < 1) {
    return res.status(400).json({ error: 'Number of fighters must be a positive whole number.' })
  }
  if (!weightCategory?.trim()) return res.status(400).json({ error: 'Weight category is required.' })

  // spots === 0 means unlimited — skip the capacity check entirely.
  if (session.spots > 0) {
    const otherFighters = sumOtherFighters.get(session.id, club.id).n
    if (otherFighters + fighterCount > session.spots) {
      const remaining = Math.max(0, session.spots - otherFighters)
      return res.status(400).json({ error: `Only ${remaining} spot${remaining === 1 ? '' : 's'} left in this session.` })
    }
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
