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
const insertFighter = db.prepare(`
  INSERT INTO fighters (organizer_id, club_id, name, club, weight, record, status, discipline, location)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const updateFighter = db.prepare(`
  UPDATE fighters SET name = ?, club = ?, weight = ?, record = ?, status = ?, discipline = ?, location = ?
  WHERE id = ? AND organizer_id = ?
`)

const STATUSES = new Set(['Matched', 'Unmatched'])
const DISCIPLINE_SET = new Set(DISCIPLINES)

router.get('/', (req, res) => {
  res.json({ fighters: listFighters.all(req.userId) })
})

router.post('/', (req, res) => {
  const { name, club, weight, record, status, discipline, location } = req.body || {}
  if (!name?.trim() || !club?.trim() || !weight?.trim()) {
    return res.status(400).json({ error: 'Name, club and weight are required.' })
  }
  if (status && !STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status.' })
  if (discipline && !DISCIPLINE_SET.has(discipline)) return res.status(400).json({ error: 'Invalid discipline.' })

  // A club account's own fighters become their reusable nomination roster —
  // stamping club_id here is what makes this the same "add fighter" endpoint
  // double as club roster management, no separate roster table needed.
  const user = getUserRole.get(req.userId)
  const ownedClub = user?.role === 'club' ? getClubByOwner.get(req.userId) : null

  const info = insertFighter.run(
    req.userId, ownedClub?.id ?? null, name.trim(), club.trim(), weight.trim(), record?.trim() || '0–0',
    status || 'Unmatched', discipline || 'Boxing', location?.trim() || '',
  )
  res.status(201).json({ fighter: getFighter.get(info.lastInsertRowid, req.userId) })
})

router.patch('/:id', (req, res) => {
  const existing = getFighter.get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Fighter not found.' })

  const merged = { ...existing, ...req.body }
  if (!STATUSES.has(merged.status)) return res.status(400).json({ error: 'Invalid status.' })
  if (!DISCIPLINE_SET.has(merged.discipline)) return res.status(400).json({ error: 'Invalid discipline.' })

  updateFighter.run(
    merged.name.trim(), merged.club.trim(), merged.weight.trim(), merged.record.trim(),
    merged.status, merged.discipline, merged.location?.trim() || '', req.params.id, req.userId,
  )
  res.json({ fighter: getFighter.get(req.params.id, req.userId) })
})

export default router
