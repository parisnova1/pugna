import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { boxingTemplate, AGE_GROUPS } from '../weightClassTemplate.js'
import { persistBracket, advanceWinner } from '../bracket.js'
import { broadcastBracketUpdate } from '../ws.js'

const router = Router()
router.use(requireAuth)

const getEventOwned = db.prepare('SELECT * FROM events WHERE id = ? AND organizer_id = ?')
const listWeightClasses = db.prepare('SELECT * FROM weight_classes WHERE event_id = ? ORDER BY sort_order ASC, id ASC')
const getWeightClass = db.prepare('SELECT * FROM weight_classes WHERE id = ?')
const insertWeightClass = db.prepare(`
  INSERT INTO weight_classes (event_id, name, age_group, gender, rounds_count, round_minutes, rest_minutes, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)
const updateWeightClass = db.prepare(`
  UPDATE weight_classes SET name = ?, age_group = ?, gender = ?, rounds_count = ?, round_minutes = ?, rest_minutes = ?, sort_order = ?, status = ?, capacity = ?
  WHERE id = ?
`)
const deleteWeightClass = db.prepare('DELETE FROM weight_classes WHERE id = ?')
const countFightersInClass = db.prepare('SELECT COUNT(*) AS n FROM fighters WHERE weight_class_id = ?')

const listEventFighters = db.prepare('SELECT * FROM fighters WHERE event_id = ? ORDER BY id DESC')
const getEventFighter = db.prepare('SELECT * FROM fighters WHERE id = ? AND event_id = ?')
// Fighters added directly by the host (not via an accepted nomination) are
// tagged 'walkup' — no account required, added straight into the roster.
const insertEventFighter = db.prepare(`
  INSERT INTO fighters (organizer_id, event_id, weight_class_id, source, name, club, weight, record, status, discipline, location)
  VALUES (?, ?, ?, 'walkup', ?, ?, ?, ?, 'Unmatched', ?, ?)
`)
const setFighterWeightClass = db.prepare('UPDATE fighters SET weight_class_id = ? WHERE id = ? AND event_id = ?')

// card_position IS NULL excludes card-format bouts, which share a weight_class_id
// (a hidden placeholder row — see cardBouts.js) purely to satisfy the FK constraint.
const listBoutsForClass = db.prepare('SELECT * FROM bouts WHERE weight_class_id = ? AND card_position IS NULL ORDER BY round ASC, slot ASC')
const listFightersForClass = db.prepare('SELECT id FROM fighters WHERE weight_class_id = ? ORDER BY seed IS NULL, seed ASC, id ASC')
const getBout = db.prepare('SELECT * FROM bouts WHERE id = ?')

const AGE_GROUP_SET = new Set(AGE_GROUPS)
const GENDERS = new Set(['male', 'female', 'mixed'])
const WC_STATUSES = new Set(['open', 'closed'])

function ownedEventOr404(req, res) {
  const event = getEventOwned.get(req.params.eventId, req.userId)
  if (!event) {
    res.status(404).json({ error: 'Event not found.' })
    return null
  }
  return event
}

function ownedWeightClassOr404(req, res) {
  const wc = getWeightClass.get(req.params.id)
  if (!wc) {
    res.status(404).json({ error: 'Weight class not found.' })
    return null
  }
  const event = getEventOwned.get(wc.event_id, req.userId)
  if (!event) {
    res.status(404).json({ error: 'Weight class not found.' })
    return null
  }
  return { wc, event }
}

// ── Event detail: weight classes with fighter counts ─────────────────────
router.get('/events/:eventId/detail', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const weightClasses = listWeightClasses.all(event.id).map(wc => ({
    ...wc,
    fighterCount: countFightersInClass.get(wc.id).n,
  }))
  res.json({ event, weightClasses })
})

// ── Weight classes ────────────────────────────────────────────────────────
function validateWeightClass({ name, ageGroup, gender, roundsCount, roundMinutes, restMinutes }) {
  if (!name?.trim()) return 'Name is required.'
  if (ageGroup && !AGE_GROUP_SET.has(ageGroup)) return 'Invalid age group.'
  if (gender && !GENDERS.has(gender)) return 'Invalid gender.'
  if (roundsCount != null && (!Number.isInteger(roundsCount) || roundsCount < 1)) return 'Rounds must be a positive whole number.'
  if (roundMinutes != null && (!Number.isFinite(roundMinutes) || roundMinutes <= 0)) return 'Round length must be a positive number.'
  if (restMinutes != null && (!Number.isFinite(restMinutes) || restMinutes < 0)) return 'Rest length cannot be negative.'
  return null
}

router.post('/events/:eventId/weight-classes', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const error = validateWeightClass(req.body || {})
  if (error) return res.status(400).json({ error })

  const { name, ageGroup, gender, roundsCount, roundMinutes, restMinutes, sortOrder } = req.body
  const info = insertWeightClass.run(
    event.id, name.trim(), ageGroup || 'adult', gender || 'mixed',
    roundsCount ?? 3, roundMinutes ?? 3, restMinutes ?? 1, sortOrder ?? 0,
  )
  res.status(201).json({ weightClass: getWeightClass.get(info.lastInsertRowid) })
})

router.post('/events/:eventId/weight-classes/template', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const { ageGroup, gender } = req.body || {}
  if (!AGE_GROUP_SET.has(ageGroup)) return res.status(400).json({ error: 'Choose an age group: adult, youth or children.' })

  const classes = boxingTemplate({ ageGroup, gender })
  const existingCount = listWeightClasses.all(event.id).length
  const created = classes.map((c, i) => {
    const info = insertWeightClass.run(event.id, c.name, c.ageGroup, c.gender, c.roundsCount, c.roundMinutes, c.restMinutes, existingCount + i)
    return getWeightClass.get(info.lastInsertRowid)
  })
  res.status(201).json({ weightClasses: created })
})

router.patch('/weight-classes/:id', (req, res) => {
  const owned = ownedWeightClassOr404(req, res)
  if (!owned) return
  const { wc } = owned
  const body = req.body || {}

  const name = body.name ?? wc.name
  const ageGroup = body.ageGroup ?? wc.age_group
  const gender = body.gender ?? wc.gender
  const roundsCount = body.roundsCount ?? wc.rounds_count
  const roundMinutes = body.roundMinutes ?? wc.round_minutes
  const restMinutes = body.restMinutes ?? wc.rest_minutes
  const sortOrder = body.sortOrder ?? wc.sort_order
  const status = body.status ?? wc.status
  const capacity = body.capacity !== undefined ? body.capacity : wc.capacity

  const error = validateWeightClass({ name, ageGroup, gender, roundsCount, roundMinutes, restMinutes })
  if (error) return res.status(400).json({ error })
  if (!WC_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status.' })

  updateWeightClass.run(name.trim(), ageGroup, gender, roundsCount, roundMinutes, restMinutes, sortOrder, status, capacity ?? null, req.params.id)
  res.json({ weightClass: getWeightClass.get(req.params.id) })
})

router.delete('/weight-classes/:id', (req, res) => {
  const owned = ownedWeightClassOr404(req, res)
  if (!owned) return

  deleteWeightClass.run(req.params.id)
  res.status(204).end()
})

// ── Event-scoped fighters ─────────────────────────────────────────────────
router.get('/events/:eventId/fighters', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return
  res.json({ fighters: listEventFighters.all(event.id) })
})

router.post('/events/:eventId/fighters', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const { name, club, weight, record, weightClassId, discipline, location } = req.body || {}
  if (!name?.trim() || !club?.trim() || !weight?.trim()) {
    return res.status(400).json({ error: 'Name, club and weight are required.' })
  }

  const info = insertEventFighter.run(
    req.userId, event.id, weightClassId || null, name.trim(), club.trim(), weight.trim(),
    record?.trim() || '0–0', discipline || event.discipline, location?.trim() || event.location,
  )
  res.status(201).json({ fighter: getEventFighter.get(info.lastInsertRowid, event.id) })
})

router.post('/events/:eventId/fighters/import', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const rows = Array.isArray(req.body?.fighters) ? req.body.fighters : []
  if (rows.length === 0) return res.status(400).json({ error: 'No fighters to import.' })

  const created = []
  for (const row of rows) {
    if (!row.name?.trim() || !row.weight?.trim()) continue
    const info = insertEventFighter.run(
      req.userId, event.id, row.weightClassId || null, row.name.trim(), row.club?.trim() || '—',
      row.weight.trim(), row.record?.trim() || '0–0', event.discipline, row.location?.trim() || event.location,
    )
    created.push(getEventFighter.get(info.lastInsertRowid, event.id))
  }

  if (created.length === 0) return res.status(400).json({ error: 'None of the rows had both a name and a weight.' })
  res.status(201).json({ fighters: created, imported: created.length, skipped: rows.length - created.length })
})

router.patch('/events/:eventId/fighters/:fighterId/weight-class', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const fighter = getEventFighter.get(req.params.fighterId, event.id)
  if (!fighter) return res.status(404).json({ error: 'Fighter not found.' })

  const { weightClassId } = req.body || {}
  if (weightClassId != null) {
    const wc = getWeightClass.get(weightClassId)
    if (!wc || wc.event_id !== event.id) return res.status(400).json({ error: 'Invalid weight class.' })
  }

  setFighterWeightClass.run(weightClassId || null, req.params.fighterId, event.id)
  res.json({ fighter: getEventFighter.get(req.params.fighterId, event.id) })
})

// ── Bracket ────────────────────────────────────────────────────────────────
router.post('/weight-classes/:id/bracket', (req, res) => {
  const owned = ownedWeightClassOr404(req, res)
  if (!owned) return
  const { wc, event } = owned

  const fighterIds = listFightersForClass.all(wc.id).map(f => f.id)
  if (fighterIds.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 fighters in this weight class to generate a bracket.' })
  }

  try {
    const result = persistBracket(db, { eventId: event.id, weightClassId: wc.id, fighterIds })
    res.status(201).json({ ...result, bouts: listBoutsForClass.all(wc.id) })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/weight-classes/:id/bracket', (req, res) => {
  const owned = ownedWeightClassOr404(req, res)
  if (!owned) return

  res.json({ bouts: listBoutsForClass.all(owned.wc.id) })
})

router.patch('/bouts/:id/result', (req, res) => {
  const bout = getBout.get(req.params.id)
  if (!bout) return res.status(404).json({ error: 'Bout not found.' })

  const event = getEventOwned.get(bout.event_id, req.userId)
  if (!event) return res.status(404).json({ error: 'Bout not found.' })

  if (bout.status !== 'scheduled') return res.status(400).json({ error: 'A result has already been recorded for this bout.' })
  if (!bout.fighter_red_id || !bout.fighter_blue_id) {
    return res.status(400).json({ error: 'Both fighters must be set before recording a result.' })
  }

  const { winnerId, method } = req.body || {}
  if (winnerId !== bout.fighter_red_id && winnerId !== bout.fighter_blue_id) {
    return res.status(400).json({ error: 'Winner must be one of the two fighters in this bout.' })
  }

  advanceWinner(db, { boutId: bout.id, winnerId, method: method?.trim() || null })
  broadcastBracketUpdate(event.qr_token, bout.weight_class_id)

  res.json({ bout: getBout.get(bout.id) })
})

export default router
