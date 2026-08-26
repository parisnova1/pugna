import { Router } from 'express'

const router = Router()

// Proxies OpenStreetMap's free Nominatim geocoder. Proxying (rather than
// calling it from the browser) lets us send a proper identifying User-Agent,
// as Nominatim's usage policy requires.
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim()
  if (q.length < 2) return res.json({ results: [] })

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'PUGNA-Combat-Sports-App/1.0 (local dev)' },
    })
    if (!upstream.ok) throw new Error(`Nominatim responded ${upstream.status}`)

    const data = await upstream.json()
    const results = data.map(d => ({ label: d.display_name, lat: d.lat, lon: d.lon }))
    res.json({ results })
  } catch (err) {
    console.error('Geocoding lookup failed:', err)
    res.status(502).json({ error: 'Location search is temporarily unavailable.' })
  }
})

// Reverse geocode: device coordinates (from expo-location) -> a city label,
// for onboarding's "use my location" button. Same Nominatim proxy pattern
// and User-Agent requirement as forward search above.
router.get('/reverse', async (req, res) => {
  const lat = Number(req.query.lat)
  const lon = Number(req.query.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon query params are required.' })
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'PUGNA-Combat-Sports-App/1.0 (local dev)' },
    })
    if (!upstream.ok) throw new Error(`Nominatim responded ${upstream.status}`)

    const data = await upstream.json()
    const addr = data.address || {}
    // Prefer the most city-like field Nominatim gives us, falling back down
    // to whatever's available for rural/edge-case coordinates.
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || data.display_name
    if (!city) return res.status(404).json({ error: 'Could not resolve a city for these coordinates.' })
    res.json({ label: city, lat, lon })
  } catch (err) {
    console.error('Reverse geocoding lookup failed:', err)
    res.status(502).json({ error: 'Location search is temporarily unavailable.' })
  }
})

export default router
