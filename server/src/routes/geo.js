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

export default router
