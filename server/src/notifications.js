import { db } from './db.js'

// Interruption level tiers, mirroring the sprint spec's iOS categorization
// (time-sensitive / active / passive). Device push is deferred — these
// levels are persisted now so a future push sprint can read them off
// existing rows without another migration.
const INTERRUPTION_LEVELS = {
  'event.live': 'time-sensitive',
  'bout.live': 'time-sensitive',
  'nomination.injured': 'time-sensitive',
  'bout.result': 'active',
  'event.stream': 'active',
  'nomination.accepted': 'active',
}

const getSettings = db.prepare('SELECT categories FROM notification_settings WHERE user_id = ?')
const getMute = db.prepare('SELECT 1 FROM event_mutes WHERE user_id = ? AND event_id = ?')
const insertNotification = db.prepare(`
  INSERT INTO notifications (user_id, type, interruption_level, title, body, event_id, data)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)
const listAudienceForEvent = db.prepare(`
  SELECT user_id FROM event_saves WHERE event_id = ?
  UNION
  SELECT club_follows.user_id FROM club_follows
  JOIN clubs ON clubs.id = club_follows.club_id
  JOIN events ON events.organizer_id = clubs.owner_id
  WHERE events.id = ?
`)

// Inserts one notification unless the recipient muted this event or turned
// this category off — checked here so every call site gets it for free.
export function createNotification({ userId, type, title, body = '', eventId = null, data = {} }) {
  if (eventId != null && getMute.get(userId, eventId)) return null

  const settingsRow = getSettings.get(userId)
  if (settingsRow) {
    const categories = JSON.parse(settingsRow.categories || '{}')
    if (categories[type] === false) return null
  }

  const interruptionLevel = INTERRUPTION_LEVELS[type] || 'active'
  const info = insertNotification.run(userId, type, interruptionLevel, title, body, eventId, JSON.stringify(data))
  return info.lastInsertRowid
}

// Audience = anyone who saved the event, plus anyone following the host's
// club when the host is a club account — the same two tables the public
// event page and club-follow feature already use.
export function notifyEventAudience({ eventId, type, title, body = '', data = {} }) {
  const userIds = listAudienceForEvent.all(eventId, eventId).map(r => r.user_id)
  for (const userId of userIds) {
    createNotification({ userId, type, title, body, eventId, data })
  }
}
