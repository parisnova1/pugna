import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

const getEventOwned = db.prepare('SELECT * FROM events WHERE id = ? AND organizer_id = ?')
const deleteDaysForEvent = db.prepare('DELETE FROM event_days WHERE event_id = ?')
const insertDay = db.prepare('INSERT INTO event_days (event_id, day_index, date, label) VALUES (?, ?, ?, ?)')
const listDaysForEvent = db.prepare('SELECT * FROM event_days WHERE event_id = ? ORDER BY day_index ASC')
const getDay = db.prepare('SELECT * FROM event_days WHERE id = ?')
const updateDay = db.prepare('UPDATE event_days SET date = ?, label = ?, status = ? WHERE id = ?')

const DAY_STATUSES = new Set(['scheduled', 'live', 'completed'])

function addDays(dateStr, n) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!match) return dateStr
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Regenerates the day list from the event's current number_of_days —
// idempotent, safe to call again after changing the count in Setup.
// Existing per-day edits (custom labels/dates) are intentionally discarded
// on regenerate, since day count changing invalidates the old shape anyway.
router.post('/events/:id/days', (req, res) => {
  const event = getEventOwned.get(req.params.id, req.userId)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  if (event.number_of_days <= 1) return res.status(400).json({ error: 'This event is not a multi-day tournament.' })

  deleteDaysForEvent.run(event.id)
  for (let i = 0; i < event.number_of_days; i++) {
    insertDay.run(event.id, i + 1, addDays(event.date, i), `Day ${i + 1}`)
  }

  res.status(201).json({ days: listDaysForEvent.all(event.id) })
})

router.get('/events/:id/days', (req, res) => {
  const event = getEventOwned.get(req.params.id, req.userId)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  res.json({ days: listDaysForEvent.all(event.id) })
})

router.patch('/events/:eventId/days/:dayId', (req, res) => {
  const event = getEventOwned.get(req.params.eventId, req.userId)
  if (!event) return res.status(404).json({ error: 'Event not found.' })

  const day = getDay.get(req.params.dayId)
  if (!day || day.event_id !== event.id) return res.status(404).json({ error: 'Day not found.' })

  const date = req.body?.date ?? day.date
  const label = req.body?.label ?? day.label
  const status = req.body?.status ?? day.status
  if (!DAY_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status.' })

  updateDay.run(date, label, status, day.id)
  res.json({ day: getDay.get(day.id) })
})

export default router
