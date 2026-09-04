import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../lib/api'
import BackButton from '../components/BackButton'

import { ACCENT as RED, CARD, LINE as BORDER, MUTED, TEXT, FONT_BODY as DISPLAY } from '../theme'

const NOTIFICATION_TYPES: Array<[string, string]> = [
  ['event.live', 'Event goes live'],
  ['bout.result', 'Results'],
  ['event.stream', 'Stream started'],
  ['nomination.accepted', 'Nomination accepted'],
  ['nomination.injured', 'Injury / pull-out'],
]

export default function NotificationSettings({ nav }: { nav: (path: string) => void }) {
  const { user, ready } = useAuth()
  const [categories, setCategories] = useState<Record<string, boolean>>({})
  const [quietStart, setQuietStart] = useState('')
  const [quietEnd, setQuietEnd] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<{ categories: Record<string, boolean>; quietHoursStart: string | null; quietHoursEnd: string | null }>('/api/notifications/settings')
      .then(r => { setCategories(r.categories); setQuietStart(r.quietHoursStart ?? ''); setQuietEnd(r.quietHoursEnd ?? '') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = (next: Record<string, boolean>, qStart = quietStart, qEnd = quietEnd) => {
    apiFetch('/api/notifications/settings', { method: 'PATCH', body: JSON.stringify({ categories: next, quietHoursStart: qStart || null, quietHoursEnd: qEnd || null }) }).catch(() => {})
  }

  const toggle = (type: string) => {
    const next = { ...categories, [type]: categories[type] === false ? true : false }
    setCategories(next)
    save(next)
  }

  if (!ready) return null
  if (!user) { nav('/'); return null }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 32px 80px' }}>
      <BackButton />
      <h1 style={{ fontFamily: DISPLAY, fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', margin: '20px 0 8px' }}>Fight Alerts</h1>
      <p style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, marginBottom: '32px' }}>Choose what you hear about, and when.</p>

      {loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER, marginBottom: '32px' }}>
            {NOTIFICATION_TYPES.map(([type, label]) => (
              <button
                key={type}
                onClick={() => toggle(type)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CARD, padding: '16px 18px' }}
              >
                <span style={{ fontFamily: DISPLAY, fontSize: '14px', color: TEXT }}>{label}</span>
                <span style={{
                  width: '40px', height: '22px', borderRadius: '11px', backgroundColor: categories[type] !== false ? RED : BORDER,
                  position: 'relative', transition: 'background-color 0.15s',
                }}>
                  <span style={{
                    position: 'absolute', top: '2px', left: categories[type] !== false ? '20px' : '2px',
                    width: '18px', height: '18px', borderRadius: '9px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.15s',
                  }} />
                </span>
              </button>
            ))}
          </div>

          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginBottom: '10px' }}>Quiet Hours</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              value={quietStart}
              onChange={e => setQuietStart(e.target.value)}
              onBlur={() => save(categories)}
              placeholder="22:00"
              style={{ width: '100px', backgroundColor: '#F7F5F0', border: `1px solid ${BORDER}`, color: TEXT, padding: '10px 12px', fontFamily: DISPLAY, fontSize: '14px', textAlign: 'center' }}
            />
            <span style={{ color: MUTED }}>–</span>
            <input
              value={quietEnd}
              onChange={e => setQuietEnd(e.target.value)}
              onBlur={() => save(categories)}
              placeholder="08:00"
              style={{ width: '100px', backgroundColor: '#F7F5F0', border: `1px solid ${BORDER}`, color: TEXT, padding: '10px 12px', fontFamily: DISPLAY, fontSize: '14px', textAlign: 'center' }}
            />
          </div>
        </>
      )}
    </div>
  )
}
