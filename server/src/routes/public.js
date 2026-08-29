import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

// An event is publicly visible once it's Open (for nominations) or Active
// (fight night) — only Draft stays hidden from viewers/clubs.
const PUBLIC_STATUSES = new Set(['Open', 'Active'])

const listPublicEvents = db.prepare(`
  SELECT events.id, events.name, events.date, events.location, events.discipline,
         events.fights, events.fighters, events.views, users.name AS organizer_name
  FROM events
  JOIN users ON users.id = events.organizer_id
  WHERE events.status IN ('Open', 'Active')
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

const listSavedEvents = db.prepare(`
  SELECT events.id, events.name, events.date, events.location, events.discipline,
         events.fights, events.fighters, events.views, users.name AS organizer_name
  FROM event_saves
  JOIN events ON events.id = event_saves.event_id
  JOIN users ON users.id = events.organizer_id
  WHERE event_saves.user_id = ?
  ORDER BY event_saves.created_at DESC
`)
const getEventForSave = db.prepare('SELECT id FROM events WHERE id = ?')
const insertEventSave = db.prepare('INSERT OR IGNORE INTO event_saves (user_id, event_id) VALUES (?, ?)')
const deleteEventSave = db.prepare('DELETE FROM event_saves WHERE user_id = ? AND event_id = ?')
const insertEventMute = db.prepare('INSERT OR IGNORE INTO event_mutes (user_id, event_id) VALUES (?, ?)')
const deleteEventMute = db.prepare('DELETE FROM event_mutes WHERE user_id = ? AND event_id = ?')
const listMutedEvents = db.prepare('SELECT event_id FROM event_mutes WHERE user_id = ?')

router.get('/events', (_req, res) => {
  res.json({ events: listPublicEvents.all() })
})

// Keep before `/events/:idOrToken` — otherwise Express matches "saved" as the
// :idOrToken param (same ordering hazard noted in clubs.js above its `/:id`).
router.get('/events/saved', requireAuth, (req, res) => {
  res.json({ events: listSavedEvents.all(req.userId) })
})

router.post('/events/:id/save', requireAuth, (req, res) => {
  const event = getEventForSave.get(req.params.id)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  insertEventSave.run(req.userId, event.id)
  res.status(204).end()
})

router.delete('/events/:id/save', requireAuth, (req, res) => {
  deleteEventSave.run(req.userId, req.params.id)
  res.status(204).end()
})

// Keep before `/events/:idOrToken` for the same ordering reason as `/saved`.
router.get('/events/muted', requireAuth, (req, res) => {
  res.json({ eventIds: listMutedEvents.all(req.userId).map(r => r.event_id) })
})

router.post('/events/:id/mute', requireAuth, (req, res) => {
  const event = getEventForSave.get(req.params.id)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  insertEventMute.run(req.userId, event.id)
  res.status(204).end()
})

router.delete('/events/:id/mute', requireAuth, (req, res) => {
  deleteEventMute.run(req.userId, req.params.id)
  res.status(204).end()
})

const listFollowedFighters = db.prepare(`
  SELECT fighters.id, fighters.name, fighters.club, fighters.weight, fighters.record,
         fighters.discipline, fighters.location, users.name AS organizer_name
  FROM fighter_follows
  JOIN fighters ON fighters.id = fighter_follows.fighter_id
  JOIN users ON users.id = fighters.organizer_id
  WHERE fighter_follows.user_id = ?
  ORDER BY fighter_follows.created_at DESC
`)
const getFighterForFollow = db.prepare('SELECT id FROM fighters WHERE id = ?')
const insertFighterFollow = db.prepare('INSERT OR IGNORE INTO fighter_follows (user_id, fighter_id) VALUES (?, ?)')
const deleteFighterFollow = db.prepare('DELETE FROM fighter_follows WHERE user_id = ? AND fighter_id = ?')

router.get('/fighters', (_req, res) => {
  res.json({ fighters: listPublicFighters.all() })
})

// Keep before `/fighters/:id` — otherwise Express matches "following" as the
// :id param (same ordering hazard noted in clubs.js above its `/:id`).
router.get('/fighters/following', requireAuth, (req, res) => {
  res.json({ fighters: listFollowedFighters.all(req.userId) })
})

router.post('/fighters/:id/follow', requireAuth, (req, res) => {
  const fighter = getFighterForFollow.get(req.params.id)
  if (!fighter) return res.status(404).json({ error: 'Fighter not found.' })
  insertFighterFollow.run(req.userId, fighter.id)
  res.status(204).end()
})

router.delete('/fighters/:id/follow', requireAuth, (req, res) => {
  deleteFighterFollow.run(req.userId, req.params.id)
  res.status(204).end()
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
// status Open or Active so a Draft event's public page can show a friendly
// "not public yet" message instead of leaking data.

const EVENT_COLUMNS = `
  events.id, events.name, events.date, events.location, events.venue, events.discipline, events.status,
  events.format, events.livestream_url, events.number_of_days, events.ring_count, events.qr_token,
  events.fights, events.fighters, events.views, events.current_bout_id, users.name AS organizer_name
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
  if (!PUBLIC_STATUSES.has(event.status)) return res.status(403).json({ error: 'This event is not public yet.' })

  const weightClasses = listWeightClassesForEvent.all(event.id)
  res.json({ event, weightClasses })
})

router.get('/events/:idOrToken/fighters', (req, res) => {
  const event = resolveEvent(req.params.idOrToken)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  if (!PUBLIC_STATUSES.has(event.status)) return res.status(403).json({ error: 'This event is not public yet.' })

  res.json({ fighters: listPublicEventFighters.all(event.id) })
})

const listPublicDaysForEvent = db.prepare('SELECT id, day_index, date, label, status FROM event_days WHERE event_id = ? ORDER BY day_index ASC')

router.get('/events/:idOrToken/days', (req, res) => {
  const event = resolveEvent(req.params.idOrToken)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  if (!PUBLIC_STATUSES.has(event.status)) return res.status(403).json({ error: 'This event is not public yet.' })

  res.json({ days: listPublicDaysForEvent.all(event.id) })
})

router.get('/weight-classes/:id/bracket', (req, res) => {
  const wc = getWeightClassById.get(req.params.id)
  if (!wc) return res.status(404).json({ error: 'Weight class not found.' })

  const event = getEventStatusById.get(wc.event_id)
  if (!event || !PUBLIC_STATUSES.has(event.status)) return res.status(403).json({ error: 'This event is not public yet.' })

  res.json({ bouts: listBoutsForWeightClass.all(wc.id) })
})

// Powers the "Live Now" pinned-bout display: looks up one bout by id plus
// its two fighters' names, gated the same way as every other public
// endpoint (event must be Open/Active).
const getBoutById = db.prepare('SELECT * FROM bouts WHERE id = ?')
const getFighterNameById = db.prepare('SELECT id, name, club FROM fighters WHERE id = ?')

router.get('/bouts/:id', (req, res) => {
  const bout = getBoutById.get(req.params.id)
  if (!bout) return res.status(404).json({ error: 'Bout not found.' })

  const event = getEventStatusById.get(bout.event_id)
  if (!event || !PUBLIC_STATUSES.has(event.status)) return res.status(403).json({ error: 'This event is not public yet.' })

  res.json({
    bout: {
      ...bout,
      fighterRed: bout.fighter_red_id ? getFighterNameById.get(bout.fighter_red_id) : null,
      fighterBlue: bout.fighter_blue_id ? getFighterNameById.get(bout.fighter_blue_id) : null,
    },
  })
})

router.get('/events/:idOrToken/card-bouts', (req, res) => {
  const event = resolveEvent(req.params.idOrToken)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  if (!PUBLIC_STATUSES.has(event.status)) return res.status(403).json({ error: 'This event is not public yet.' })

  res.json({ bouts: listCardBoutsForEvent.all(event.id) })
})

export default router
