import { useEffect, useState } from 'react'
import type { NavFn } from '../App'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import QrScanner from '../components/QrScanner'
import Spinner from '../components/Spinner'
import { FeaturedFight, SparringSection, Footer } from './Home'

import { ACCENT as RED, CARD, LINE as BORDER, MUTED, TEXT, BG, ACCENT_SOFT, FONT_BODY as DISPLAY, POSITIVE_GREEN, CAUTION_AMBER } from '../theme'

// Falls back to the platform's Bayern-first go-to-market region for viewers
// who haven't set a home city (or signed up before this field existed).
const FALLBACK_REGION = 'Bayern'

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string; fights: number }
type FollowedClub = { id: number; name: string; location: string }
type FollowedFighter = { id: number; name: string; club: string; weight: string }

type MyFighter = { id: number; name: string; weight: string; discipline: string; club: string; club_id: number | null } | null
type ClubOption = { id: number; name: string }
type MyNomination = {
  id: number; status: 'pending' | 'accepted' | 'rejected'; fighter_response: 'accepted' | 'declined' | null
  event_id: number; event_name: string; weight_class_name: string
}
type MyBout = {
  id: number; event_id: number; event_name: string; event_date: string; weight_class_name: string
  round: number; status: string
}

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

function EmptyState({ message, ctaLabel, onClick }: { message: string; ctaLabel: string; onClick: () => void }) {
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, marginBottom: '18px' }}>{message}</p>
      <button
        onClick={onClick}
        style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 24px', border: `1px solid ${BORDER}`, color: TEXT, backgroundColor: 'transparent', transition: 'border-color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = TEXT)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
      >
        {ctaLabel}
      </button>
    </div>
  )
}

function FighterWorklist({
  fighter, fighterName, clubOptions, nominations, bouts, loading, onChanged, nav,
}: {
  fighter: MyFighter; fighterName: string; clubOptions: ClubOption[]; nominations: MyNomination[]; bouts: MyBout[]
  loading: boolean; onChanged: () => void; nav: NavFn
}) {
  const { t } = useLanguage()
  const [clubId, setClubId] = useState<string>(fighter?.club_id ? String(fighter.club_id) : '')
  const [weight, setWeight] = useState(fighter?.weight ?? '')
  const [saving, setSaving] = useState(false)
  const [respondingId, setRespondingId] = useState<number | null>(null)
  const [editingClub, setEditingClub] = useState(false)

  const saveProfile = async () => {
    if (!clubId || !weight.trim()) return
    setSaving(true)
    try {
      if (fighter) {
        await apiFetch(`/api/fighters/${fighter.id}`, { method: 'PATCH', body: JSON.stringify({ clubId: Number(clubId), weight: weight.trim() }) })
      } else {
        await apiFetch('/api/fighters', { method: 'POST', body: JSON.stringify({ name: fighterName, weight: weight.trim(), clubId: Number(clubId) }) })
      }
      setEditingClub(false)
      onChanged()
    } catch {
      // best-effort — the form stays open so the fighter can retry
    } finally {
      setSaving(false)
    }
  }

  const respond = async (nominationId: number, response: 'accepted' | 'declined') => {
    setRespondingId(nominationId)
    try {
      await apiFetch(`/api/nominations/${nominationId}/fighter-response`, { method: 'PATCH', body: JSON.stringify({ response }) })
      onChanged()
    } catch {
      // ignore — list just won't reflect the response, fighter can retry
    } finally {
      setRespondingId(null)
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', marginBottom: '40px' }}><Spinner size={14} /> {t('common.loading')}</div>
  }

  const showClubForm = !fighter || editingClub

  return (
    <div style={{ marginBottom: '48px' }}>
      {/* Profile */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px' }}>{t('fighterHome.profileTitle')}</h2>

        {!fighter && <p style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, marginBottom: '16px', lineHeight: 1.5 }}>{t('fighterHome.noClubYet')}</p>}

        {!showClubForm && fighter ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div><div style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('fighterHome.club')}</div><div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700 }}>{fighter.club}</div></div>
            <div><div style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('fighterHome.weightLabel')}</div><div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700 }}>{fighter.weight}</div></div>
            <div><div style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('fighterHome.sport')}</div><div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700 }}>{fighter.discipline}</div></div>
            <button onClick={() => setEditingClub(true)} style={{ fontFamily: DISPLAY, fontSize: '12px', color: RED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: 'auto' }}>{t('fighterHome.changeClub')}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t('fighterHome.chooseClub')}</label>
              <select value={clubId} onChange={e => setClubId(e.target.value)} style={{ width: '100%', backgroundColor: '#F7F5F0', border: `1px solid ${BORDER}`, color: TEXT, padding: '11px 12px', fontFamily: DISPLAY, fontSize: '14px' }}>
                <option value="">—</option>
                {clubOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '0 1 160px' }}>
              <label style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t('fighterHome.weightLabel')}</label>
              <input value={weight} onChange={e => setWeight(e.target.value)} placeholder={t('fighterHome.weightPlaceholder')} style={{ width: '100%', backgroundColor: '#F7F5F0', border: `1px solid ${BORDER}`, color: TEXT, padding: '11px 12px', fontFamily: DISPLAY, fontSize: '14px' }} />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving || !clubId || !weight.trim()}
              style={{ backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px 22px', opacity: saving || !clubId || !weight.trim() ? 0.6 : 1 }}
            >
              {t('fighterHome.saveProfile')}
            </button>
          </div>
        )}
      </div>

      {/* Nominations */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px' }}>{t('fighterHome.nominationsTitle')}</h2>
        {nominations.length === 0 ? (
          <p style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{t('fighterHome.noNominations')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
            {nominations.map(nom => (
              <div key={nom.id} style={{ backgroundColor: CARD, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', cursor: 'pointer' }} onClick={() => nav(`/events/${nom.event_id}`)}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 800 }}>{nom.event_name}</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>{nom.weight_class_name}</div>
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: nom.status === 'accepted' ? POSITIVE_GREEN : nom.status === 'rejected' ? MUTED : CAUTION_AMBER }}>
                  {nom.status === 'accepted' ? t('fighterHome.statusAccepted') : nom.status === 'rejected' ? t('fighterHome.statusRejected') : t('fighterHome.statusPending')}
                </div>
                {nom.fighter_response ? (
                  <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase' }}>
                    {nom.fighter_response === 'accepted' ? t('fighterHome.responseAccepted') : t('fighterHome.responseDeclined')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => respond(nom.id, 'accepted')} disabled={respondingId === nom.id} style={{ backgroundColor: POSITIVE_GREEN, color: '#fff', fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 16px' }}>{t('fighterHome.accept')}</button>
                    <button onClick={() => respond(nom.id, 'declined')} disabled={respondingId === nom.id} style={{ border: `1px solid ${BORDER}`, color: TEXT, fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 16px' }}>{t('fighterHome.decline')}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming bouts */}
      <div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px' }}>{t('fighterHome.upcomingBoutsTitle')}</h2>
        {bouts.length === 0 ? (
          <p style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{t('fighterHome.noUpcomingBouts')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
            {bouts.map(b => (
              <div key={b.id} style={{ backgroundColor: CARD, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => nav(`/events/${b.event_id}`)}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 800 }}>{b.event_name}</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>{formatDisplayDate(b.event_date)} · {b.weight_class_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ViewerHome({ nav }: { nav: NavFn }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [followedClubs, setFollowedClubs] = useState<FollowedClub[]>([])
  const [followedFighters, setFollowedFighters] = useState<FollowedFighter[]>([])
  const [savedEvents, setSavedEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const [myFighter, setMyFighter] = useState<MyFighter>(null)
  const [nominations, setNominations] = useState<MyNomination[]>([])
  const [myBouts, setMyBouts] = useState<MyBout[]>([])
  const [clubOptions, setClubOptions] = useState<ClubOption[]>([])
  const [fighterLoading, setFighterLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<{ events: PublicEvent[] }>('/api/public/events'),
      apiFetch<{ clubs: FollowedClub[] }>('/api/clubs/following'),
      apiFetch<{ events: PublicEvent[] }>('/api/public/events/saved'),
      apiFetch<{ fighters: FollowedFighter[] }>('/api/public/fighters/following'),
    ])
      .then(([e, c, s, f]) => { setEvents(e.events); setFollowedClubs(c.clubs); setSavedEvents(s.events); setFollowedFighters(f.fighters) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const refetchFighter = () => {
    setFighterLoading(true)
    Promise.all([
      apiFetch<{ fighter: MyFighter }>('/api/fighters/me'),
      apiFetch<{ nominations: MyNomination[] }>('/api/fighters/me/nominations'),
      apiFetch<{ bouts: MyBout[] }>('/api/fighters/me/bouts'),
    ])
      .then(([f, n, b]) => { setMyFighter(f.fighter); setNominations(n.nominations); setMyBouts(b.bouts) })
      .catch(() => {})
      .finally(() => setFighterLoading(false))
  }

  useEffect(() => {
    if (user?.role !== 'fighter') return
    refetchFighter()
    apiFetch<{ clubs: ClubOption[] }>('/api/clubs').then(r => setClubOptions(r.clubs)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

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

  const region = user?.home_location || FALLBACK_REGION
  const regionMatches = events
    .filter(e => e.location.toLowerCase().includes(region.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date))
  const rest = events
    .filter(e => !regionMatches.includes(e))
    .sort((a, b) => a.date.localeCompare(b.date))
  const nearYou = [...regionMatches, ...rest].slice(0, 5)

  // Nearest saved event that's today or still upcoming — the single most
  // relevant "your next fight" highlight, or none if nothing qualifies.
  const todayIso = new Date().toISOString().slice(0, 10)
  const upcomingSaved = savedEvents
    .filter(e => e.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null

  if (!user) return null

  return (
    <>
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '76px' : '240px', flexShrink: 0, backgroundColor: BG, borderRight: `1px solid ${BORDER}`,
        padding: '20px 0', position: 'sticky', top: '64px', height: 'calc(100vh - 64px)', overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: '0 12px', marginBottom: '12px' }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color: MUTED, padding: '8px', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <div style={{ padding: '0 24px', marginBottom: '32px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', marginBottom: '4px' }}>{t('viewerHome.welcomeBack')}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>{user.name}</div>
            {user.email && <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, letterSpacing: '0.04em', marginTop: '2px' }}>{user.email}</div>}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ margin: collapsed ? '20px 12px 0' : '24px 24px 0', borderTop: `1px solid ${BORDER}`, paddingTop: collapsed ? '12px' : '20px' }}>
          <button
            onClick={() => { logout(); nav('/') }}
            title={collapsed ? t('header.logOut') : undefined}
            style={{ width: '100%', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, padding: collapsed ? '10px 0' : '10px', border: `1px solid ${BORDER}`, transition: 'color 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = TEXT }}
            onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER }}
          >
            {collapsed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            ) : t('header.logOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, maxWidth: '1200px', padding: '48px 32px 80px' }}>
      <div className="viewer-columns">
      <div>
      {/* Greeting */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
          {t('viewerHome.hey', { name: user.name.split(' ')[0] })}
        </h1>
        <p style={{ color: MUTED, marginTop: '10px', fontSize: '15px' }}>{t('viewerHome.subtitle')}</p>
      </div>

      {user.role === 'fighter' && (
        <FighterWorklist
          fighter={myFighter}
          fighterName={user.name}
          clubOptions={clubOptions}
          nominations={nominations}
          bouts={myBouts}
          loading={fighterLoading}
          onChanged={refetchFighter}
          nav={nav}
        />
      )}

      {/* Discovery entry points */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div
          onClick={() => nav('/events?q=')}
          style={{ textAlign: 'left', backgroundColor: CARD, border: `1px solid ${RED}`, borderLeft: `4px solid ${RED}`, padding: '24px', cursor: 'pointer', transition: 'background-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = ACCENT_SOFT)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ width: '40px', height: '40px', border: `1px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: '19px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>{t('viewerHome.findEvent')}</div>
          <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.5, marginBottom: '14px' }}>{t('viewerHome.findEventBody', { region })}</p>
          <button
            onClick={e => { e.stopPropagation(); setScanError(null); setScannerOpen(true) }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="4" height="10" /><rect x="9" y="4" width="2" height="16" /><rect x="13" y="4" width="4" height="16" /><rect x="19" y="7" width="2" height="10" />
            </svg>
            {t('viewerHome.orScanQr')}
          </button>
        </div>

        <div
          onClick={() => nav('/sparring')}
          style={{ textAlign: 'left', backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '24px', cursor: 'pointer', transition: 'background-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F2F0EA')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ width: '40px', height: '40px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: '19px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>{t('sparring.findSparring')}</div>
          <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.5 }}>{t('viewerHome.findSparringBody', { region })}</p>
        </div>

        <div
          onClick={() => nav('/clubs')}
          style={{ textAlign: 'left', backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '24px', cursor: 'pointer', transition: 'background-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F2F0EA')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ width: '40px', height: '40px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: '19px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>{t('viewerHome.findClub')}</div>
          <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.5 }}>{t('viewerHome.findClubBody', { region })}</p>
        </div>
      </div>

      {/* Your Next Event — nearest saved event that's today or upcoming, if any */}
      {upcomingSaved && (
        <div
          onClick={() => nav(`/events/${upcomingSaved.id}`)}
          style={{ backgroundColor: CARD, border: `1px solid ${RED}`, borderLeft: `4px solid ${RED}`, padding: '28px', marginBottom: '48px', cursor: 'pointer', transition: 'background-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = ACCENT_SOFT)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>{t('viewerHome.yourNextEvent')}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.05, marginBottom: '10px' }}>{upcomingSaved.name}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {formatDisplayDate(upcomingSaved.date)} · {upcomingSaved.location} · {upcomingSaved.organizer_name}
          </div>
        </div>
      )}

      <FeaturedFight nav={nav} />

      {/* Upcoming Near You */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '2px', backgroundColor: RED }} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t('viewerHome.upcomingNearYou')}</h2>
          </div>
          <button onClick={() => nav('/events')} style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {region} · {t('common.seeAll')}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}><Spinner size={14} /> {t('common.loading')}</div>
        ) : nearYou.length === 0 ? (
          <EmptyState message={t('viewerHome.noUpcoming')} ctaLabel={t('viewerHome.browseEvents')} onClick={() => nav('/events?q=')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
            {nearYou.map(ev => {
              const { day, mon } = dateBadge(ev.date)
              return (
                <div key={ev.id} style={{ backgroundColor: CARD, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onClick={() => nav(`/events/${ev.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F2F0EA')}
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
                  <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: TEXT, border: `1px solid ${BORDER}`, padding: '8px 16px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {t('common.viewCard')}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <SparringSection nav={nav} onOpenAuth={() => {}} standalone />
      </div>

      {/* Your List — saved events, followed fighters, followed clubs */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '24px' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '24px' }}>{t('viewerHome.yourList')}</h2>

        <h3 style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, marginBottom: '14px' }}>{t('viewerHome.savedEvents')}</h3>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase' }}><Spinner size={14} /> {t('common.loading')}</div>
        ) : savedEvents.length === 0 ? (
          <EmptyState message={t('viewerHome.noSaved')} ctaLabel={t('viewerHome.browseEvents')} onClick={() => nav('/events?q=')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER, marginBottom: '8px' }}>
            {savedEvents.map(ev => {
              const { day, mon } = dateBadge(ev.date)
              return (
                <div key={ev.id} style={{ backgroundColor: CARD, padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onClick={() => nav(`/events/${ev.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F2F0EA')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
                >
                  <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: '16px', fontWeight: 900, color: RED, lineHeight: 1 }}>{day}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '9px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{mon}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.location}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <h3 style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, margin: '28px 0 14px' }}>{t('viewerHome.fightersYouFollow')}</h3>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase' }}><Spinner size={14} /> {t('common.loading')}</div>
        ) : followedFighters.length === 0 ? (
          <EmptyState message={t('viewerHome.noFightersFollowed')} ctaLabel={t('viewerHome.browseEvents')} onClick={() => nav('/events?q=')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {followedFighters.map(f => {
              const initials = f.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <button key={f.id} onClick={() => nav(`/fighters/${f.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '8px 14px 8px 8px', borderRadius: '30px', textAlign: 'left' }}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: ACCENT_SOFT, color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                    {initials || '?'}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name} <span style={{ color: MUTED }}>· {f.weight}</span></span>
                </button>
              )
            })}
          </div>
        )}

        <h3 style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, margin: '28px 0 14px' }}>{t('viewerHome.clubsYouFollow')}</h3>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase' }}><Spinner size={14} /> {t('common.loading')}</div>
        ) : followedClubs.length === 0 ? (
          <EmptyState message={t('viewerHome.noClubsFollowed')} ctaLabel={t('viewerHome.browseClubs')} onClick={() => nav('/clubs')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {followedClubs.map(c => {
              const initials = c.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <button key={c.id} onClick={() => nav(`/clubs/${c.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '8px 14px 8px 8px', borderRadius: '30px', textAlign: 'left' }}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: ACCENT_SOFT, color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                    {initials || '?'}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
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
              <button onClick={() => setScanError(null)} style={{ flex: 1, padding: '12px', border: `1px solid ${BORDER}`, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('common.tryAgain')}
              </button>
              <button onClick={() => { setScanError(null); nav('/events?q=') }} style={{ flex: 1, padding: '12px', backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('common.searchInstead')}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>

    <Footer nav={nav} />
    </>
  )
}
