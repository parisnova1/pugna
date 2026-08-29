import './env.js'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import fightersRoutes from './routes/fighters.js'
import publicRoutes from './routes/public.js'
import geoRoutes from './routes/geo.js'
import tournamentRoutes from './routes/tournament.js'
import cardBoutsRoutes from './routes/cardBouts.js'
import clubsRoutes from './routes/clubs.js'
import sparringRoutes from './routes/sparring.js'
import templatePacksRoutes from './routes/templatePacks.js'
import nominationsRoutes from './routes/nominations.js'
import notificationsRoutes from './routes/notifications.js'
import { attachWebSocketServer } from './ws.js'
import { seedIfEmpty } from './seed.js'

seedIfEmpty()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/fighters', fightersRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/geo', geoRoutes)
app.use('/api/clubs', clubsRoutes)
app.use('/api/sparring', sparringRoutes)
app.use('/api', templatePacksRoutes)
app.use('/api', nominationsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api', tournamentRoutes)
app.use('/api', cardBoutsRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error.' })
})

const httpServer = createServer(app)
attachWebSocketServer(httpServer)

httpServer.listen(PORT, () => {
  console.log(`PUGNA API listening on http://localhost:${PORT}`)
})
