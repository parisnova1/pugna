import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

const listNotifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
const getNotification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?')
const markRead = db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ?")
const markAllRead = db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL")

const getSettings = db.prepare('SELECT * FROM notification_settings WHERE user_id = ?')
const upsertSettings = db.prepare(`
  INSERT INTO notification_settings (user_id, categories, quiet_hours_start, quiet_hours_end)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET categories = excluded.categories, quiet_hours_start = excluded.quiet_hours_start, quiet_hours_end = excluded.quiet_hours_end
`)

router.get('/', (req, res) => {
  res.json({ notifications: listNotifications.all(req.userId) })
})

router.post('/:id/read', (req, res) => {
  const notification = getNotification.get(req.params.id, req.userId)
  if (!notification) return res.status(404).json({ error: 'Notification not found.' })
  markRead.run(notification.id)
  res.json({ notification: getNotification.get(notification.id, req.userId) })
})

router.post('/read-all', (req, res) => {
  markAllRead.run(req.userId)
  res.status(204).end()
})

router.get('/settings', (req, res) => {
  const row = getSettings.get(req.userId)
  res.json({
    categories: row ? JSON.parse(row.categories || '{}') : {},
    quietHoursStart: row?.quiet_hours_start ?? null,
    quietHoursEnd: row?.quiet_hours_end ?? null,
  })
})

router.patch('/settings', (req, res) => {
  const { categories, quietHoursStart, quietHoursEnd } = req.body || {}
  upsertSettings.run(req.userId, JSON.stringify(categories || {}), quietHoursStart || null, quietHoursEnd || null)
  const row = getSettings.get(req.userId)
  res.json({
    categories: JSON.parse(row.categories || '{}'),
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
  })
})

export default router
