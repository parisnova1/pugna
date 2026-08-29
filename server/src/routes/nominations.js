import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { createNotification } from '../notifications.js'

const router = Router()
router.use(requireAuth)

const getUserById = db.prepare('SELECT id, role FROM users WHERE id = ?')
const getClubByOwner = db.prepare('SELECT * FROM clubs WHERE owner_id = ?')
const getClubById = db.prepare('SELECT * FROM clubs WHERE id = ?')
const getEventOwned = db.prepare('SELECT * FROM events WHERE id = ? AND organizer_id = ?')
const getEvent = db.prepare('SELECT * FROM events WHERE id = ?')
const getWeightClass = db.prepare('SELECT * FROM weight_classes WHERE id = ?')
const getFighter = db.prepare('SELECT * FROM fighters WHERE id = ?')

const listAvailableClubFighters = db.prepare(`
  SELECT * FROM fighters WHERE club_id = ? AND event_id IS NULL ORDER BY name ASC
`)

const insertNomination = db.prepare(`
  INSERT INTO nominations (event_id, weight_class_id, club_id, fighter_id, note)
  VALUES (?, ?, ?, ?, ?)
`)
const getNomination = db.prepare('SELECT * FROM nominations WHERE id = ?')
const listNominationsForClub = db.prepare(`
  SELECT nominations.*, events.name AS event_name, weight_classes.name AS weight_class_name, fighters.name AS fighter_name
  FROM nominations
  JOIN events ON events.id = nominations.event_id
  JOIN weight_classes ON weight_classes.id = nominations.weight_class_id
  JOIN fighters ON fighters.id = nominations.fighter_id
  WHERE nominations.club_id = ?
  ORDER BY nominations.created_at DESC
`)
const listNominationsForEvent = db.prepare(`
  SELECT nominations.*, clubs.name AS club_name, fighters.name AS fighter_name, fighters.weight AS fighter_weight, fighters.record AS fighter_record, weight_classes.name AS weight_class_name
  FROM nominations
  JOIN clubs ON clubs.id = nominations.club_id
  JOIN fighters ON fighters.id = nominations.fighter_id
  JOIN weight_classes ON weight_classes.id = nominations.weight_class_id
  WHERE nominations.event_id = ?
  ORDER BY nominations.created_at DESC
`)
const setNominationStatus = db.prepare(`
  UPDATE nominations SET status = ?, decided_by = ?, decided_at = datetime('now') WHERE id = ?
`)
const deleteNomination = db.prepare('DELETE FROM nominations WHERE id = ?')

const insertEventFighter = db.prepare(`
  INSERT INTO fighters (organizer_id, event_id, weight_class_id, club_id, source, roster_fighter_id, name, club, weight, record, status, discipline, location)
  VALUES (?, ?, ?, ?, 'roster', ?, ?, ?, ?, ?, 'Unmatched', ?, ?)
`)

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

// ── Club side ────────────────────────────────────────────────────────────

router.get('/events/:eventId/available-club-fighters', (req, res) => {
  const club = requireClub(req, res)
  if (!club) return
  res.json({ fighters: listAvailableClubFighters.all(club.id) })
})

router.post('/events/:eventId/weight-classes/:wcId/nominations', (req, res) => {
  const club = requireClub(req, res)
  if (!club) return

  const event = getEvent.get(req.params.eventId)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  if (event.status !== 'Open') return res.status(400).json({ error: 'This event is not open for nominations.' })

  const wc = getWeightClass.get(req.params.wcId)
  if (!wc || wc.event_id !== event.id) return res.status(404).json({ error: 'Weight class not found.' })
  if (wc.status !== 'open') return res.status(400).json({ error: 'This weight class is closed to new nominations.' })

  const { fighterId, note } = req.body || {}
  const fighter = fighterId && getFighter.get(fighterId)
  if (!fighter || fighter.club_id !== club.id) return res.status(400).json({ error: 'Choose a fighter from your roster.' })

  try {
    const info = insertNomination.run(event.id, wc.id, club.id, fighter.id, note?.trim() || '')
    res.status(201).json({ nomination: getNomination.get(info.lastInsertRowid) })
  } catch {
    res.status(400).json({ error: 'This fighter already has a nomination for this weight class.' })
  }
})

router.get('/clubs/me/nominations', (req, res) => {
  const club = requireClub(req, res)
  if (!club) return
  res.json({ nominations: listNominationsForClub.all(club.id) })
})

router.delete('/nominations/:id', (req, res) => {
  const club = requireClub(req, res)
  if (!club) return

  const nomination = getNomination.get(req.params.id)
  if (!nomination || nomination.club_id !== club.id) return res.status(404).json({ error: 'Nomination not found.' })
  if (nomination.status !== 'pending') return res.status(400).json({ error: 'Only a pending nomination can be withdrawn.' })

  deleteNomination.run(nomination.id)
  res.status(204).end()
})

// ── Host side ────────────────────────────────────────────────────────────

router.get('/events/:eventId/nominations', (req, res) => {
  const event = getEventOwned.get(req.params.eventId, req.userId)
  if (!event) return res.status(404).json({ error: 'Event not found.' })
  res.json({ nominations: listNominationsForEvent.all(event.id) })
})

router.patch('/nominations/:id/accept', (req, res) => {
  const nomination = getNomination.get(req.params.id)
  if (!nomination) return res.status(404).json({ error: 'Nomination not found.' })

  const event = getEventOwned.get(nomination.event_id, req.userId)
  if (!event) return res.status(404).json({ error: 'Nomination not found.' })
  if (nomination.status !== 'pending') return res.status(400).json({ error: 'This nomination has already been decided.' })

  const fighter = getFighter.get(nomination.fighter_id)
  insertEventFighter.run(
    req.userId, event.id, nomination.weight_class_id, nomination.club_id, fighter.id,
    fighter.name, fighter.club, fighter.weight, fighter.record, fighter.discipline || event.discipline,
    fighter.location || event.location,
  )
  setNominationStatus.run('accepted', req.userId, nomination.id)

  const club = getClubById.get(nomination.club_id)
  if (club?.owner_id) {
    createNotification({
      userId: club.owner_id,
      type: 'nomination.accepted',
      title: `${fighter.name} accepted`,
      body: `${event.name} · ${fighter.name} is in.`,
      eventId: event.id,
      data: { nominationId: nomination.id, fighterId: fighter.id },
    })
  }

  res.json({ nomination: getNomination.get(nomination.id) })
})

router.patch('/nominations/:id/reject', (req, res) => {
  const nomination = getNomination.get(req.params.id)
  if (!nomination) return res.status(404).json({ error: 'Nomination not found.' })

  const event = getEventOwned.get(nomination.event_id, req.userId)
  if (!event) return res.status(404).json({ error: 'Nomination not found.' })
  if (nomination.status !== 'pending') return res.status(400).json({ error: 'This nomination has already been decided.' })

  setNominationStatus.run('rejected', req.userId, nomination.id)
  res.json({ nomination: getNomination.get(nomination.id) })
})

export default router
