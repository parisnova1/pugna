import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { DISCIPLINES } from '../constants.js'

const router = Router()
router.use(requireAuth)

const listFighters = db.prepare('SELECT * FROM fighters WHERE organizer_id = ? ORDER BY id DESC')
const getFighter = db.prepare('SELECT * FROM fighters WHERE id = ? AND organizer_id = ?')
const getUserRole = db.prepare('SELECT role FROM users WHERE id = ?')
const getClubByOwner = db.prepare('SELECT id FROM clubs WHERE owner_id = ?')
const getClubById = db.prepare('SELECT id, name FROM clubs WHERE id = ?')
const insertFighter = db.prepare(`
  INSERT INTO fighters (organizer_id, club_id, name, club, weight, record, status, discipline, location)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const updateFighter = db.prepare(`
  UPDATE fighters SET name = ?, club = ?, weight = ?, record = ?, status = ?, discipline = ?, location = ?, club_id = ?
  WHERE id = ? AND organizer_id = ?
`)

// 'Withdrawn' is written by the injury-result path in tournament.js, not
// settable directly here — included so a later unrelated PATCH to an
// already-withdrawn event fighter doesn't fail validation.
const STATUSES = new Set(['Matched', 'Unmatched', 'Withdrawn'])
const DISCIPLINE_SET = new Set(DISCIPLINES)

const getMyFighterRow = db.prepare('SELECT * FROM fighters WHERE organizer_id = ? ORDER BY id DESC LIMIT 1')
const listMyBouts = db.prepare(`
  SELECT bouts.*, events.id AS event_id, events.name AS event_name, events.date AS event_date,
         weight_classes.name AS weight_class_name
  FROM bouts
  JOIN weight_classes ON weight_classes.id = bouts.weight_class_id
  JOIN events ON events.id = bouts.event_id
  JOIN fighters AS f ON f.id = bouts.fighter_red_id OR f.id = bouts.fighter_blue_id
  WHERE f.source = 'roster' AND f.roster_fighter_id = ?
  ORDER BY events.date ASC
`)

router.get('/', (req, res) => {
  res.json({ fighters: listFighters.all(req.userId) })
})

// A fighter account's own profile row — created lazily via POST / once they
// join a club, so "no row yet" is a valid, common state (not a 404).
router.get('/me', (req, res) => {
  const user = getUserRole.get(req.userId)
  if (!user || user.role !== 'fighter') return res.status(403).json({ error: 'Only fighter accounts can access this.' })
  res.json({ fighter: getMyFighterRow.get(req.userId) ?? null })
})

router.get('/me/bouts', (req, res) => {
  const user = getUserRole.get(req.userId)
  if (!user || user.role !== 'fighter') return res.status(403).json({ error: 'Only fighter accounts can access this.' })

  const myFighter = getMyFighterRow.get(req.userId)
  if (!myFighter) return res.json({ bouts: [] })
  res.json({ bouts: listMyBouts.all(myFighter.id) })
})

// A fighter account joining an existing club (self-serve, no invite/approval
// step in v1) resolves the same club_id a club admin already sees through
// `available-club-fighters` — nothing on the nomination side needs to know
// this fighter row belongs to a real login rather than club-typed roster entry.
function resolveClubId(role, userId, requestedClubId) {
  if (role === 'club') return getClubByOwner.get(userId)?.id ?? null
  if (role === 'fighter' && requestedClubId != null) {
    const club = getClubById.get(requestedClubId)
    return club ? club.id : null
  }
  return null
}

router.post('/', (req, res) => {
  const { name, club, weight, record, status, discipline, location, clubId } = req.body || {}
  const user = getUserRole.get(req.userId)
  const resolvedClubId = resolveClubId(user?.role, req.userId, clubId)
  // A fighter joining a club takes that club's name as their `club` text field
  // (the legacy free-text column every other query still reads); everyone
  // else must type it.
  const clubText = resolvedClubId && user?.role === 'fighter' ? getClubById.get(resolvedClubId).name : club

  if (!name?.trim() || !clubText?.trim() || !weight?.trim()) {
    return res.status(400).json({ error: 'Name, club and weight are required.' })
  }
  if (status && !STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status.' })
  if (discipline && !DISCIPLINE_SET.has(discipline)) return res.status(400).json({ error: 'Invalid discipline.' })

  const info = insertFighter.run(
    req.userId, resolvedClubId, name.trim(), clubText.trim(), weight.trim(), record?.trim() || '0–0',
    status || 'Unmatched', discipline || 'Boxing', location?.trim() || '',
  )
  res.status(201).json({ fighter: getFighter.get(info.lastInsertRowid, req.userId) })
})

router.patch('/:id', (req, res) => {
  const existing = getFighter.get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Fighter not found.' })

  const user = getUserRole.get(req.userId)
  const merged = { ...existing, ...req.body }
  if (!STATUSES.has(merged.status)) return res.status(400).json({ error: 'Invalid status.' })
  if (!DISCIPLINE_SET.has(merged.discipline)) return res.status(400).json({ error: 'Invalid discipline.' })

  let clubId = existing.club_id
  let clubText = merged.club
  if (user?.role === 'fighter' && req.body?.clubId !== undefined) {
    const club = req.body.clubId == null ? null : getClubById.get(req.body.clubId)
    clubId = club ? club.id : null
    clubText = club ? club.name : merged.club
  }

  updateFighter.run(
    merged.name.trim(), clubText.trim(), merged.weight.trim(), merged.record.trim(),
    merged.status, merged.discipline, merged.location?.trim() || '', clubId, req.params.id, req.userId,
  )
  res.json({ fighter: getFighter.get(req.params.id, req.userId) })
})

export default router
