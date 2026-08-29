import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

const getEventOwned = db.prepare('SELECT * FROM events WHERE id = ? AND organizer_id = ?')
const listPacks = db.prepare('SELECT * FROM template_packs WHERE discipline = ? ORDER BY name ASC')
const getPackBySlug = db.prepare('SELECT * FROM template_packs WHERE slug = ?')
const listPackClasses = db.prepare('SELECT * FROM template_pack_classes WHERE pack_id = ? ORDER BY sort_order ASC, id ASC')
const listWeightClasses = db.prepare('SELECT * FROM weight_classes WHERE event_id = ? ORDER BY sort_order ASC, id ASC')
const insertWeightClass = db.prepare(`
  INSERT INTO weight_classes (event_id, name, age_group, gender, rounds_count, round_minutes, rest_minutes, sort_order)
  VALUES (?, ?, 'adult', ?, ?, ?, ?, ?)
`)
const getWeightClass = db.prepare('SELECT * FROM weight_classes WHERE id = ?')
const setEventTemplatePack = db.prepare('UPDATE events SET template_pack_slug = ? WHERE id = ?')

function ownedEventOr404(req, res) {
  const event = getEventOwned.get(req.params.eventId, req.userId)
  if (!event) {
    res.status(404).json({ error: 'Event not found.' })
    return null
  }
  return event
}

// Only Boxing has a pack this sprint — other disciplines get an empty list
// rather than a 400, so the picker can render a "no packs yet" state instead
// of erroring, while the discipline gate stays server-enforced too.
router.get('/template-packs', (req, res) => {
  const discipline = req.query.discipline
  if (!discipline) return res.status(400).json({ error: 'discipline is required.' })

  const packs = listPacks.all(discipline).map(pack => ({
    ...pack,
    classes: listPackClasses.all(pack.id),
  }))
  res.json({ packs })
})

router.post('/events/:eventId/weight-classes/from-pack', (req, res) => {
  const event = ownedEventOr404(req, res)
  if (!event) return

  const { packSlug } = req.body || {}
  const pack = packSlug && getPackBySlug.get(packSlug)
  if (!pack) return res.status(400).json({ error: 'Unknown template pack.' })

  // Copies rows into the event's own weight_classes table rather than
  // referencing the pack live, so later edits to the master pack never
  // retroactively change an already-published event.
  const classes = listPackClasses.all(pack.id)
  const existingCount = listWeightClasses.all(event.id).length
  const created = classes.map((c, i) => {
    const info = insertWeightClass.run(event.id, c.name, c.gender, c.rounds_count, c.round_minutes, c.rest_minutes, existingCount + i)
    return getWeightClass.get(info.lastInsertRowid)
  })

  setEventTemplatePack.run(pack.slug, event.id)
  res.status(201).json({ weightClasses: created })
})

export default router
