import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { DISCIPLINES } from '../constants.js'

const router = Router()

const DISCIPLINE_SET = new Set(DISCIPLINES)

const listClubs = db.prepare('SELECT * FROM clubs ORDER BY member_count DESC, id ASC')
const getClub = db.prepare('SELECT * FROM clubs WHERE id = ?')
const getClubByOwner = db.prepare('SELECT * FROM clubs WHERE owner_id = ?')
const getUserById = db.prepare('SELECT id, role FROM users WHERE id = ?')
const updateClub = db.prepare(`
  UPDATE clubs SET name = ?, location = ?, disciplines = ?, founded_year = ?, member_count = ?, description = ?, logo_url = ?, cover_url = ?, lat = ?, lng = ?
  WHERE id = ?
`)

function serialize(club) {
  return { ...club, disciplines: club.disciplines ? club.disciplines.split(',').filter(Boolean) : [] }
}

// Great-circle distance in km between two lat/lng points.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isValidImageUrl(value) {
  return !value || /^https?:\/\/\S+$/.test(value)
}

function validate({ name, location, disciplines, foundedYear, memberCount, description, logoUrl, coverUrl }) {
  if (!name?.trim()) return 'Club name is required.'
  if (disciplines && (!Array.isArray(disciplines) || disciplines.some(d => !DISCIPLINE_SET.has(d)))) {
    return 'Invalid discipline selected.'
  }
  if (foundedYear != null && foundedYear !== '' && (!Number.isInteger(foundedYear) || foundedYear < 1800 || foundedYear > new Date().getFullYear())) {
    return 'Enter a valid founding year.'
  }
  if (memberCount != null && (!Number.isInteger(memberCount) || memberCount < 0)) {
    return 'Member count must be a non-negative whole number.'
  }
  if (!isValidImageUrl(logoUrl?.trim())) return 'Logo URL must be a valid http(s) link.'
  if (!isValidImageUrl(coverUrl?.trim())) return 'Cover photo URL must be a valid http(s) link.'
  return null
}

router.get('/', (req, res) => {
  const clubs = listClubs.all().map(serialize)

  const lat = Number(req.query.lat)
  const lng = Number(req.query.lng)
  const radiusKm = Number(req.query.radiusKm)
  if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radiusKm) && radiusKm > 0) {
    const withinRadius = clubs
      .filter(c => c.lat != null && c.lng != null)
      .map(c => ({ ...c, distance_km: Math.round(haversineKm(lat, lng, c.lat, c.lng) * 10) / 10 }))
      .filter(c => c.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
    return res.json({ clubs: withinRadius })
  }

  res.json({ clubs })
})

router.get('/me', requireAuth, (req, res) => {
  const user = getUserById.get(req.userId)
  if (!user || user.role !== 'club') return res.status(403).json({ error: 'Only club accounts can access this.' })

  const club = getClubByOwner.get(req.userId)
  if (!club) return res.status(404).json({ error: 'Club profile not found.' })
  res.json({ club: serialize(club) })
})

router.patch('/me', requireAuth, (req, res) => {
  const user = getUserById.get(req.userId)
  if (!user || user.role !== 'club') return res.status(403).json({ error: 'Only club accounts can access this.' })

  const club = getClubByOwner.get(req.userId)
  if (!club) return res.status(404).json({ error: 'Club profile not found.' })

  const body = req.body || {}
  const name = body.name ?? club.name
  const location = body.location ?? club.location
  const disciplines = body.disciplines ?? (club.disciplines ? club.disciplines.split(',').filter(Boolean) : [])
  const foundedYear = body.foundedYear !== undefined ? body.foundedYear : club.founded_year
  const memberCount = body.memberCount ?? club.member_count
  const description = body.description ?? club.description
  const logoUrl = body.logoUrl ?? club.logo_url
  const coverUrl = body.coverUrl ?? club.cover_url
  // Coordinates only change when the club picks a new geocoded suggestion
  // (LocationInput's onSelect) — typing without selecting leaves them as-is.
  const lat = body.lat !== undefined ? body.lat : club.lat
  const lng = body.lng !== undefined ? body.lng : club.lng

  const error = validate({ name, location, disciplines, foundedYear, memberCount, description, logoUrl, coverUrl })
  if (error) return res.status(400).json({ error })

  updateClub.run(
    name.trim(), location.trim(), disciplines.join(','), foundedYear === '' ? null : foundedYear,
    memberCount, description.trim(), logoUrl.trim(), coverUrl.trim(), lat, lng, club.id,
  )
  res.json({ club: serialize(getClub.get(club.id)) })
})

// Events this club's fighters are competing in, powering the mobile app's
// Home "LIVE NOW" section and My Events list. Stubbed to an empty list until
// fighters.club_id exists (Club Command Center plan, Slice 3) — referencing
// it now would error since the column doesn't exist yet. Once it lands, this
// becomes a single JOIN (fighters.club_id = this club) with a computed
// has_live_bout flag, not a fan-out.
router.get('/me/events', requireAuth, (req, res) => {
  const user = getUserById.get(req.userId)
  if (!user || user.role !== 'club') return res.status(403).json({ error: 'Only club accounts can access this.' })

  const club = getClubByOwner.get(req.userId)
  if (!club) return res.status(404).json({ error: 'Club profile not found.' })

  res.json({ events: [] })
})

// ── Follow / unfollow ───────────────────────────────────────────────────────
const listFollowedClubs = db.prepare(`
  SELECT clubs.* FROM club_follows
  JOIN clubs ON clubs.id = club_follows.club_id
  WHERE club_follows.user_id = ?
  ORDER BY club_follows.created_at DESC
`)
const insertFollow = db.prepare('INSERT OR IGNORE INTO club_follows (user_id, club_id) VALUES (?, ?)')
const deleteFollow = db.prepare('DELETE FROM club_follows WHERE user_id = ? AND club_id = ?')

router.get('/following', requireAuth, (req, res) => {
  res.json({ clubs: listFollowedClubs.all(req.userId).map(serialize) })
})

router.post('/:id/follow', requireAuth, (req, res) => {
  const club = getClub.get(req.params.id)
  if (!club) return res.status(404).json({ error: 'Club not found.' })
  insertFollow.run(req.userId, club.id)
  res.status(204).end()
})

router.delete('/:id/follow', requireAuth, (req, res) => {
  deleteFollow.run(req.userId, req.params.id)
  res.status(204).end()
})

// Keep last — otherwise `/me` and `/following` would be captured by `/:id`.
router.get('/:id', (req, res) => {
  const club = getClub.get(req.params.id)
  if (!club) return res.status(404).json({ error: 'Club not found.' })
  res.json({ club: serialize(club) })
})

export default router
