import { useEffect, useState } from 'react'
import type { NavFn } from '../App'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch } from '../lib/api'
import QrScanner from '../components/QrScanner'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

// No per-viewer profile location exists yet (only clubs/sparring sessions have
// geo data) — default to the platform's Bayern-first go-to-market region.
// Swap this for the viewer's saved location once that field exists.
const DEFAULT_REGION = 'Bayern'

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string; fights: number }
type FollowedClub = { id: number; name: string; location: string }

function extractEventIdentifier(raw: string): string {
  const trimmed = raw.trim()
  const pathMatch = trimmed.match(/\/(?:events|e)\/([^/?#]+)/)
  if (pathMatch) return pathMatch[1]
  return trimmed
}

function dateBadge(iso: string): { day: string; mon: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return { day: '—', mon: '' }
  const date = new Date(`${iso}T00:00:00`)
  return { day: match[3], mon: new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date) }
}

export default function ViewerHome({ nav }: { nav: NavFn }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [followedClubs, setFollowedClubs] = useState<FollowedClub[]>([])
  const [loading, setLoading] = useState(true)

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<{ events: PublicEvent[] }>('/api/public/events'),
      apiFetch<{ clubs: FollowedClub[] }>('/api/clubs/following'),
    ])
      .then(([e, c]) => { setEvents(e.events); setFollowedClubs(c.clubs) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDecode = async (raw: string) => {
    const identifier = extractEventIdentifier(raw)
    try {
      const { event } = await apiFetch<{ event: { id: number } }>(`/api/public/events/${encodeURIComponent(identifier)}`)
      setScannerOpen(false)
      nav(`/events/${event.id}`)
    } catch {
      setScannerOpen(false)
      setScanError(t('viewerHome.unrecognizedBody'))
    }
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    nav(searchQuery.trim() ? `/events?q=${encodeURIComponent(searchQuery.trim())}` : '/events?q=')
  }

  const regionMatches = events
    .filter(e => e.location.toLowerCase().includes(DEFAULT_REGION.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date))
  const rest = events
    .filter(e => !regionMatches.includes(e))
    .sort((a, b) => a.date.localeCompare(b.date))
  const nearYou = [...regionMatches, ...rest].slice(0, 5)

  if (!user) return null

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px 80px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '8px' }}>{t('viewerHome.welcomeBack')}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
          {t('viewerHome.hey', { name: user.name.split(' ')[0] })}
        </h1>
        <p style={{ color: MUTED, marginTop: '10px', fontSize: '15px' }}>{t('viewerHome.subtitle')}</p>
      </div>

      {/* Primary actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '56px' }}>
        <button
          onClick={() => { setScanError(null); setScannerOpen(true) }}
          style={{ textAlign: 'left', backgroundColor: CARD, border: `1px solid ${RED}`, borderLeft: `4px solid ${RED}`, padding: '28px', cursor: 'pointer', transition: 'background-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#181010')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ width: '44px', height: '44px', border: `1px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="4" height="10" /><rect x="9" y="4" width="2" height="16" /><rect x="13" y="4" width="4" height="16" /><rect x="19" y="7" width="2" height="10" />
            </svg>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>{t('viewerHome.scanEvent')}</div>
          <p style={{ color: MUTED, fontSize: '14px', lineHeight: 1.5 }}>{t('viewerHome.scanEventBody')}</p>
          <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '16px' }}>{t('viewerHome.opensCamera')}</div>
        </button>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '28px' }}>
          <div style={{ width: '44px', height: '44px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>{t('viewerHome.searchEvents')}</div>
          <p style={{ color: MUTED, fontSize: '14px', lineHeight: 1.5, marginBottom: '16px' }}>{t('viewerHome.searchEventsBody')}</p>
          <form onSubmit={submitSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('viewerHome.searchEventsPlaceholder')}
              style={{ flex: 1, backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff', padding: '11px 14px', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none' }}
            />
            <button type="submit" style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 18px' }}>
              {t('common.go')}
            </button>
          </form>
        </div>
      </div>

      {/* Upcoming Near You */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '2px', backgroundColor: RED }} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t('viewerHome.upcomingNearYou')}</h2>
          </div>
          <button onClick={() => nav('/events')} style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {DEFAULT_REGION} · {t('common.seeAll')}
          </button>
        </div>

        {loading ? (
          <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>{t('common.loading')}</div>
        ) : nearYou.length === 0 ? (
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '28px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
            {t('viewerHome.noUpcoming')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
            {nearYou.map(ev => {
              const { day, mon } = dateBadge(ev.date)
              return (
                <div key={ev.id} style={{ backgroundColor: CARD, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onClick={() => nav(`/events/${ev.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
                >
                  <div style={{ width: '52px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, color: RED, lineHeight: 1 }}>{day}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{mon}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: '11px', color: RED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '4px' }}>{ev.discipline}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '17px', fontWeight: 800, textTransform: 'uppercase' }}>{ev.name}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{ev.location} · {ev.organizer_name}</div>
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: '#fff', border: '1px solid #3a3a3a', padding: '8px 16px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {t('common.viewCard')}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Clubs You Follow */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '2px', backgroundColor: RED }} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t('viewerHome.clubsYouFollow')}</h2>
          </div>
        </div>

        {loading ? (
          <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>{t('common.loading')}</div>
        ) : followedClubs.length === 0 ? (
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '20px', fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>
            {t('viewerHome.noClubsFollowed')}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {followedClubs.map(c => {
              const initials = c.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <button key={c.id} onClick={() => nav(`/clubs/${c.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '8px 16px 8px 8px', borderRadius: '30px' }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2a1414', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {initials || '?'}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{c.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {scannerOpen && (
        <QrScanner onDecode={handleDecode} onClose={() => setScannerOpen(false)} />
      )}

      {scanError && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setScanError(null)}>
          <div style={{ backgroundColor: CARD, border: `1px solid ${RED}`, width: '100%', maxWidth: '380px', padding: '32px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>{t('viewerHome.unrecognizedCode')}</div>
            <p style={{ color: MUTED, fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>{scanError}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setScanError(null)} style={{ flex: 1, padding: '12px', border: `1px solid ${BORDER}`, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('common.tryAgain')}
              </button>
              <button onClick={() => { setScanError(null); nav('/events?q=') }} style={{ flex: 1, padding: '12px', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('common.searchInstead')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
