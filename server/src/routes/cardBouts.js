import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

const getEventOwned = db.prepare('SELECT * FROM events WHERE id = ? AND organizer_id = ?')
const listCardBouts = db.prepare(
  "SELECT * FROM bouts WHERE event_id = ? AND card_position IS NOT NULL ORDER BY sort_order ASC, id ASC",
)
const getCardBout = db.prepare("SELECT * FROM bouts WHERE id = ? AND card_position IS NOT NULL")
const maxSortOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM bouts WHERE event_id = ?')
const getWeightClassForEvent = db.prepare('SELECT id FROM weight_classes WHERE event_id = ? LIMIT 1')
const insertPlaceholderWeightClass = db.prepare(
  "INSERT INTO weight_classes (event_id, name, age_group, gender) VALUES (?, '(card format)', 'adult', 'mixed')",
)
const insertBout = db.prepare(`
  INSERT INTO bouts (event_id, weight_class_id, round, slot, fighter_a_name, fighter_a_record, fighter_b_name, fighter_b_record, weight_class_text, card_position, sort_order, rounds, status)
  VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
`)
const updateBout = db.prepare(`
  UPDATE bouts SET fighter_a_name = ?, fighter_a_record = ?, fighter_b_name = ?, fighter_b_record = ?,
    weight_class_text = ?, card_position = ?, rounds = ?
  WHERE id = ?
`)
const setSortOrder = db.prepare('UPDATE bouts SET sort_order = ? WHERE id = ? AND event_id = ?')
const deleteBout = db.prepare('DELETE FROM bouts WHERE id = ?')

const CARD_POSITIONS = new Set(['main', 'co-main', 'undercard'])

// Bouts require a weight_class_id FK (used for real weight-class categories
// in the bracket system) — card-format events get one invisible placeholder
// row per event to satisfy that constraint, never surfaced in any UI.
function ensurePlaceholderWeightClass(eventId) {
  const existing = getWeightClassForEvent.get(eventId)
  if (existing) return existing.id
  return insertPlaceholderWeightClass.run(eventId).lastInsertRowid
}

function ownedEventOr404(req, res) {
  const event = getEventOwned.get(req.params.eventId, req.userId)
  if (!event) {
    res.status(404).json({ error: 'Event not found.' })
    return null
  }
  return event
}

function ownedBoutOr404(req, res) {
  const bout = getCardBout.get(req.params.id)
  if (!bout) {
    res.status(404).json({ error: 'Bout not found.' })
    return null
  }
  const event = getEventOwned.get(bout.event_id, req.userId)
  if (!event) {
    res.status(404).json({ error: 'Bout not found.' })
    return null
  }
  return { bout, event }
}

function validate({ fighterAName, fighterBName, cardPosition, rounds }) {
  if (!fighterAName?.trim() || !fighterBName?.trim()) return 'Both fighter names are required.'
  if (cardPosition && !CARD_POSITIONS.has(cardPosition)) return 'Invalid card position.'
  if (rounds != null && (!Number.isInteger(rounds) || rounds < 1)) return 'Rounds must be a positive whole number.'
  return null
}

router.get('/events/:eventId/card-bouts', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return
  res.json({ bouts: listCardBouts.all(event.id) })
})

router.post('/events/:eventId/card-bouts', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const error = validate(req.body || {})
  if (error) return res.status(400).json({ error })

  const { fighterAName, fighterARecord, fighterBName, fighterBRecord, weightClassText, cardPosition, rounds } = req.body
  const wcId = ensurePlaceholderWeightClass(event.id)
  const nextOrder = maxSortOrder.get(event.id).m + 1

  const info = insertBout.run(
    event.id, wcId, nextOrder, fighterAName.trim(), fighterARecord?.trim() || '',
    fighterBName.trim(), fighterBRecord?.trim() || '', weightClassText?.trim() || '',
    cardPosition || 'undercard', nextOrder, rounds || null,
  )
  res.status(201).json({ bout: getCardBout.get(info.lastInsertRowid) })
})

router.patch('/card-bouts/:id', (req, res) => {
  const owned = ownedBoutOr404(req, res)
  if (!owned) return
  const { bout } = owned
  const body = req.body || {}

  const merged = {
    fighterAName: body.fighterAName ?? bout.fighter_a_name,
    fighterARecord: body.fighterARecord ?? bout.fighter_a_record,
    fighterBName: body.fighterBName ?? bout.fighter_b_name,
    fighterBRecord: body.fighterBRecord ?? bout.fighter_b_record,
    weightClassText: body.weightClassText ?? bout.weight_class_text,
    cardPosition: body.cardPosition ?? bout.card_position,
    rounds: body.rounds !== undefined ? body.rounds : bout.rounds,
  }
  const error = validate(merged)
  if (error) return res.status(400).json({ error })

  updateBout.run(
    merged.fighterAName.trim(), merged.fighterARecord?.trim() || '', merged.fighterBName.trim(),
    merged.fighterBRecord?.trim() || '', merged.weightClassText?.trim() || '', merged.cardPosition,
    merged.rounds || null, bout.id,
  )
  res.json({ bout: getCardBout.get(bout.id) })
})

router.delete('/card-bouts/:id', (req, res) => {
  const owned = ownedBoutOr404(req, res)
  if (!owned) return
  deleteBout.run(owned.bout.id)
  res.status(204).end()
})

router.post('/events/:eventId/card-bouts/reorder', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const order = Array.isArray(req.body?.order) ? req.body.order : null
  if (!order) return res.status(400).json({ error: 'order must be an array of bout ids.' })

  order.forEach((id, i) => setSortOrder.run(i, id, event.id))
  res.json({ bouts: listCardBouts.all(event.id) })
})

export default router
