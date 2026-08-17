import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

const listPublicEvents = db.prepare(`
  SELECT events.id, events.name, events.date, events.location, events.discipline,
         events.fights, events.fighters, events.views, users.name AS organizer_name
  FROM events
  JOIN users ON users.id = events.organizer_id
  WHERE events.status = 'Active'
  ORDER BY events.id DESC
`)

const listPublicFighters = db.prepare(`
  SELECT fighters.id, fighters.name, fighters.club, fighters.weight, fighters.record,
         fighters.discipline, fighters.location, users.name AS organizer_name
  FROM fighters
  JOIN users ON users.id = fighters.organizer_id
  ORDER BY fighters.id DESC
`)

const getPublicFighterById = db.prepare(`
  SELECT fighters.id, fighters.name, fighters.club, fighters.weight, fighters.record,
         fighters.discipline, fighters.location, users.name AS organizer_name
  FROM fighters
  JOIN users ON users.id = fighters.organizer_id
  WHERE fighters.id = ?
`)

router.get('/events', (_req, res) => {
  res.json({ events: listPublicEvents.all() })
})

router.get('/fighters', (_req, res) => {
  res.json({ fighters: listPublicFighters.all() })
})

router.get('/fighters/:id', (req, res) => {
  const fighter = getPublicFighterById.get(req.params.id)
  if (!fighter) return res.status(404).json({ error: 'Fighter not found.' })
  res.json({ fighter })
})

// ── Event audience API (no auth) ────────────────────────────────────────────
// Reachable either by plain numeric id (e.g. from the /events/:id detail page)
// or by an event's qr_token (from a scanned QR / the /e/:token audience page)
// — both resolve to the same event row and response shape. Gated on
// status === 'Active' so a Draft event's public page can show a friendly
// "not public yet" message instead of leaking data.

const EVENT_COLUMNS = `
  events.id, events.name, events.date, events.location, events.venue, events.discipline, events.status,
  events.format, events.livestream_url, events.number_of_days, events.ring_count, events.qr_token,
  events.fights, events.fighters, events.views, users.name AS organizer_name
`
const getEventById = db.prepare(`SELECT ${EVENT_COLUMNS} FROM events JOIN users ON users.id = events.organizer_id WHERE events.id = ?`)
const getEventByToken = db.prepare(`SELECT ${EVENT_COLUMNS} FROM events JOIN users ON users.id = events.organizer_id WHERE events.qr_token = ?`)

function resolveEvent(idOrToken) {
  return /^\d+$/.test(idOrToken) ? getEventById.get(idOrToken) : getEventByToken.get(idOrToken)
}

const listWeightClassesForEvent = db.prepare(
  'SELECT * FROM weight_classes WHERE event_id = ? ORDER BY sort_order ASC, id ASC',
)
const listPublicEventFighters = db.prepare(
  'SELECT id, name, club, weight, record, weight_class_id FROM fighters WHERE event_id = ? ORDER BY id ASC',
)
const getWeightClassById = db.prepare('SELECT * FROM weight_classes WHERE id = ?')
const getEventStatusById = db.prepare('SELECT id, status FROM events WHERE id = ?')
// card_position IS NULL excludes card-format bouts, which share a weight_class_id
// (a hidden placeholder row — see cardBouts.js) purely to satisfy the FK constraint.
const listBoutsForWeightClass = db.prepare('SELECT * FROM bouts WHERE weight_class_id = ? AND card_position IS NULL ORDER BY round ASC, slot ASC')
const listCardBoutsForEvent = db.prepare(
  "SELECT * FROM bouts WHERE event_id = ? AND card_position IS NOT NULL ORDER BY sort_order ASC, id ASC",
)

router.get('/events/:idOrToken', (req, res) => {
  const event = resolveEvent(req.params.idOrToken)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  if (event.status !== 'Active') return res.status(403).json({ error: 'This event is not public yet.' })

  const weightClasses = listWeightClassesForEvent.all(event.id)
  res.json({ event, weightClasses })
})

router.get('/events/:idOrToken/fighters', (req, res) => {
  const event = resolveEvent(req.params.idOrToken)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  if (event.status !== 'Active') return res.status(403).json({ error: 'This event is not public yet.' })

  res.json({ fighters: listPublicEventFighters.all(event.id) })
})

router.get('/weight-classes/:id/bracket', (req, res) => {
  const wc = getWeightClassById.get(req.params.id)
  if (!wc) return res.status(404).json({ error: 'Weight class not found.' })

  const event = getEventStatusById.get(wc.event_id)
  if (!event || event.status !== 'Active') return res.status(403).json({ error: 'This event is not public yet.' })

  res.json({ bouts: listBoutsForWeightClass.all(wc.id) })
})

router.get('/events/:idOrToken/card-bouts', (req, res) => {
  const event = resolveEvent(req.params.idOrToken)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  if (event.status !== 'Active') return res.status(403).json({ error: 'This event is not public yet.' })

  res.json({ bouts: listCardBoutsForEvent.all(event.id) })
})

export default router
