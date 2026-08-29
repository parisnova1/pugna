import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const RED = '#0070f3'
const BORDER = '#333333'
const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

type NotificationRow = {
  id: number; type: string; title: string; body: string
  event_id: number | null; read_at: string | null; created_at: string
}

export default function NotificationBell({ nav }: { nav: (path: string) => void }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const load = () => apiFetch<{ notifications: NotificationRow[] }>('/api/notifications').then(r => setNotifications(r.notifications)).catch(() => {})

  useEffect(() => { load() }, [])

  const unreadCount = notifications.filter(n => !n.read_at).length

  const openNotification = async (n: NotificationRow) => {
    if (!n.read_at) {
      try { await apiFetch(`/api/notifications/${n.id}/read`, { method: 'POST' }); load() } catch { /* ignore */ }
    }
    setOpen(false)
    if (n.event_id) nav(`/events/${n.event_id}`)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(v => !v); if (!open) load() }}
        aria-label="Notifications"
        style={{ position: 'relative', color: MUTED, transition: 'color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-6px', backgroundColor: RED, color: '#fff', borderRadius: '9999px', fontSize: '10px', fontFamily: DISPLAY, fontWeight: 700, minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '32px', backgroundColor: '#0f0f0f', border: `1px solid ${BORDER}`, width: '340px', maxHeight: '420px', overflowY: 'auto', zIndex: 110 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notifications</span>
            <button onClick={() => { setOpen(false); nav('/notification-settings') }} style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase' }}>Settings</button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px 16px', fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textAlign: 'center' }}>You're all caught up.</div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, backgroundColor: n.read_at ? 'transparent' : 'rgba(0,112,243,0.08)' }}
              >
                <div style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, color: '#fff' }}>{n.title}</div>
                {!!n.body && <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, marginTop: '2px' }}>{n.body}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
