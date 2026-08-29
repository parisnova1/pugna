import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { DISCIPLINES as DISCIPLINE_LIST } from '../constants.js'
import { notifyEventAudience } from '../notifications.js'

const router = Router()
router.use(requireAuth)

const listEvents = db.prepare('SELECT * FROM events WHERE organizer_id = ? ORDER BY id DESC')
const getEvent = db.prepare('SELECT * FROM events WHERE id = ? AND organizer_id = ?')
const insertEvent = db.prepare(`
  INSERT INTO events (organizer_id, name, date, location, venue, discipline, format, livestream_url, status, fights, fighters, views, number_of_days, ring_count, qr_token)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const updateEvent = db.prepare(`
  UPDATE events SET name = ?, date = ?, location = ?, venue = ?, discipline = ?, livestream_url = ?, status = ?, number_of_days = ?, ring_count = ?
  WHERE id = ? AND organizer_id = ?
`)

const DISCIPLINES = new Set(DISCIPLINE_LIST)
const STATUSES = new Set(['Draft', 'Open', 'Active'])
const FORMATS = new Set(['bracket', 'card'])

function validate(body) {
  const { name, date, location, discipline, status, format, numberOfDays, ringCount } = body || {}
  if (!name?.trim() || !date?.trim() || !location?.trim()) {
    return 'Name, date and location are required.'
  }
  if (discipline && !DISCIPLINES.has(discipline)) return 'Invalid discipline.'
  if (status && !STATUSES.has(status)) return 'Invalid status.'
  if (format && !FORMATS.has(format)) return 'Invalid format.'
  if (numberOfDays != null && (!Number.isInteger(numberOfDays) || numberOfDays < 1)) return 'Number of days must be a positive whole number.'
  if (ringCount != null && (!Number.isInteger(ringCount) || ringCount < 1)) return 'Ring count must be a positive whole number.'
  return null
}

router.get('/', (req, res) => {
  res.json({ events: listEvents.all(req.userId) })
})

router.post('/', (req, res) => {
  const error = validate(req.body)
  if (error) return res.status(400).json({ error })

  const { name, date, location, venue, discipline, format, livestreamUrl, status, numberOfDays, ringCount } = req.body
  const info = insertEvent.run(
    req.userId, name.trim(), date.trim(), location.trim(), venue?.trim() || '',
    discipline || 'Boxing', format || 'bracket', livestreamUrl?.trim() || '',
    status || 'Draft', 0, 0, 0, numberOfDays || 1, ringCount || 1, randomBytes(8).toString('hex'),
  )
  res.status(201).json({ event: getEvent.get(info.lastInsertRowid, req.userId) })
})

router.patch('/:id', (req, res) => {
  const existing = getEvent.get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Event not found.' })

  const merged = {
    ...existing,
    ...req.body,
    numberOfDays: req.body.numberOfDays ?? existing.number_of_days,
    ringCount: req.body.ringCount ?? existing.ring_count,
  }
  const error = validate(merged)
  if (error) return res.status(400).json({ error })

  const newLivestreamUrl = merged.livestreamUrl?.trim() ?? merged.livestream_url ?? ''
  updateEvent.run(
    merged.name.trim(), merged.date.trim(), merged.location.trim(), merged.venue?.trim() || '',
    merged.discipline, newLivestreamUrl, merged.status,
    merged.numberOfDays, merged.ringCount, req.params.id, req.userId,
  )
  const updated = getEvent.get(req.params.id, req.userId)

  if (existing.status !== 'Active' && updated.status === 'Active') {
    notifyEventAudience({ eventId: updated.id, type: 'event.live', title: `${updated.name} is live`, body: `${updated.name} just went live.` })
  }
  if (updated.status === 'Active' && !existing.livestream_url && newLivestreamUrl) {
    notifyEventAudience({ eventId: updated.id, type: 'event.stream', title: `${updated.name} stream started`, body: 'Watch now.' })
  }

  res.json({ event: updated })
})

// ── Duplicate as template ───────────────────────────────────────────────────
// Copies the event's core fields into a new Draft event, always resetting
// stats/QR/status. For 'card' format events, also copies the full bout list
// (fighter names/records are freeform text, so nothing fighter-account-bound
// is dragged along). 'bracket' format events duplicate just the event shell —
// weight classes reference real registered fighters, so re-running that setup
// per event is left to the organizer rather than guessed at.
const listCardBoutsForEvent = db.prepare(
  "SELECT * FROM bouts WHERE event_id = ? AND card_position IS NOT NULL ORDER BY sort_order ASC, id ASC",
)
const insertCardBout = db.prepare(`
  INSERT INTO bouts (event_id, weight_class_id, round, slot, fighter_a_name, fighter_a_record, fighter_b_name, fighter_b_record, weight_class_text, card_position, sort_order, rounds, status)
  VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
`)
const insertPlaceholderWeightClass = db.prepare(
  "INSERT INTO weight_classes (event_id, name, age_group, gender) VALUES (?, '(card format)', 'adult', 'mixed')",
)

router.post('/:id/duplicate', (req, res) => {
  const source = getEvent.get(req.params.id, req.userId)
  if (!source) return res.status(404).json({ error: 'Event not found.' })

  const info = insertEvent.run(
    req.userId, `${source.name} (Copy)`, source.date, source.location, source.venue,
    source.discipline, source.format, source.livestream_url,
    'Draft', 0, 0, 0, source.number_of_days, source.ring_count, randomBytes(8).toString('hex'),
  )
  const newEventId = info.lastInsertRowid

  if (source.format === 'card') {
    const bouts = listCardBoutsForEvent.all(source.id)
    if (bouts.length > 0) {
      const wcId = insertPlaceholderWeightClass.run(newEventId).lastInsertRowid
      bouts.forEach((b, i) => {
        insertCardBout.run(
          newEventId, wcId, i, b.fighter_a_name, b.fighter_a_record, b.fighter_b_name,
          b.fighter_b_record, b.weight_class_text, b.card_position, b.sort_order, b.rounds,
        )
      })
    }
  }

  res.status(201).json({ event: getEvent.get(newEventId, req.userId) })
})

export default router
