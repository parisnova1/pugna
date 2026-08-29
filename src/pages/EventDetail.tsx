import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { NavFn } from '../App'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import BracketView, { type Bout } from '../components/Bracket'
import Spinner from '../components/Spinner'
import CopyButton from '../components/CopyButton'
import BackButton from '../components/BackButton'
import { subscribeToEvent } from '../lib/ws'

const RED = '#0070f3'
const CARD = '#0f0f0f'
const BORDER = '#333333'
const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

const HERO_IMG = 'https://images.unsplash.com/photo-1546711076-85a7923432ab?w=1440&h=600&fit=crop&auto=format'

type EventInfo = {
  id: number
  name: string
  date: string
  location: string
  venue: string
  discipline: string
  status: string
  format: 'bracket' | 'card'
  livestream_url: string
  qr_token: string
  fights: number
  fighters: number
  views: number
  organizer_name: string
}

type WeightClass = { id: number; name: string; age_group: string; gender: string; rounds_count: number; round_minutes: number; rest_minutes: number; status?: string }
type EventFighter = { id: number; name: string; club: string; weight: string; record: string; weight_class_id: number | null }

type Tab = 'overview' | 'fightcard' | 'fighters'

const TAB_LABEL_KEYS = {
  overview: 'eventDetail.tab.overview',
  fightcard: 'eventDetail.tab.fightCard',
  fighters: 'eventDetail.tab.fighters',
} as const

// Escapes text per RFC 5545 (backslash, semicolon, comma, newline).
function icsEscape(value: string): string {
  return value.replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n')
}

// The events table only stores a date, not a start time — this generates an
// all-day calendar entry rather than fabricating a specific start time.
function downloadEventIcs(event: EventInfo) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.date)
  if (!match) return
  const [, y, m, d] = match
  const start = `${y}${m}${d}`
  const endDate = new Date(Number(y), Number(m) - 1, Number(d) + 1)
  const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const location = [event.venue, event.location].filter(Boolean).join(', ')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pugna//Event//EN',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@pugna.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(event.name)}`,
    location ? `LOCATION:${icsEscape(location)}` : null,
    `DESCRIPTION:${icsEscape(`${event.discipline} · ${event.organizer_name} · ${window.location.href}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => line !== null).join('\r\n')

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.name.trim().replace(/\s+/g, '-').toLowerCase()}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function EventDetail({ nav }: { nav: NavFn }) {
  const { eventId } = useParams<{ eventId: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState<Tab>('overview')
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([])
  const [fighters, setFighters] = useState<EventFighter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [nominating, setNominating] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      apiFetch<{ event: EventInfo; weightClasses: WeightClass[] }>(`/api/public/events/${eventId}`),
      apiFetch<{ fighters: EventFighter[] }>(`/api/public/events/${eventId}/fighters`),
    ])
      .then(([detail, f]) => {
        setEvent(detail.event)
        setWeightClasses(detail.weightClasses)
        setFighters(f.fighters)
      })
      .catch(err => setError(err instanceof Error ? err.message : t('eventDetail.notFoundBody')))
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => {
    if (user?.role !== 'viewer') return
    apiFetch<{ events: { id: number }[] }>('/api/public/events/saved')
      .then(r => setSaved(r.events.some(e => e.id === Number(eventId))))
      .catch(() => {})
  }, [eventId, user?.role])

  const handleShare = async () => {
    if (!event) return
    if (navigator.share) {
      try {
        await navigator.share({ title: event.name, url: window.location.href })
      } catch {
        /* user cancelled the native share sheet — no-op */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      const el = document.createElement('textarea')
      el.value = window.location.href
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setShareToast(true)
    setTimeout(() => setShareToast(false), 1600)
  }

  const toggleSave = async () => {
    setSaveBusy(true)
    try {
      if (saved) {
        await apiFetch(`/api/public/events/${eventId}/save`, { method: 'DELETE' })
        setSaved(false)
      } else {
        await apiFetch(`/api/public/events/${eventId}/save`, { method: 'POST' })
        setSaved(true)
      }
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setSaveBusy(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 32px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>
        <Spinner size={18} /> {t('common.loading')}
      </div>
    )
  }
  if (error || !event) {
    return (
      <div style={{ maxWidth: '480px', margin: '100px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>{t('eventDetail.notFoundTitle')}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED }}>{error || t('eventDetail.notFoundBody')}</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 32px 0' }}>
        <BackButton />
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
        <img src={HERO_IMG} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.1) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '3px', height: '100%', backgroundColor: RED }} />

        <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.25em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>
            {event.discipline} · {formatDisplayDate(event.date)}
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, marginBottom: '16px' }}>
            {event.name}
          </h1>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: MUTED }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{event.venue ? `${event.venue}, ${event.location}` : event.location}</span>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: '14px', letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase' }}>{event.organizer_name}</div>
            {event.livestream_url && (
              <a href={event.livestream_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 18px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.3"/><circle cx="12" cy="12" r="4"/></svg>
                {t('eventDetail.watchLive')}
              </a>
            )}
            <CopyButton text={window.location.href} style={{ padding: '8px 18px', backgroundColor: 'rgba(0,0,0,0.6)' }} />
            {user?.role === 'viewer' && (
              <button
                onClick={toggleSave}
                disabled={saveBusy}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 18px', opacity: saveBusy ? 0.6 : 1, transition: 'all 0.15s',
                  backgroundColor: saved ? RED : 'rgba(0,0,0,0.6)', color: '#fff', border: `1px solid ${saved ? RED : BORDER}`,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                {saved ? t('eventDetail.saved') : t('eventDetail.save')}
              </button>
            )}
            <button
              onClick={handleShare}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 18px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: `1px solid ${BORDER}` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /></svg>
              {shareToast ? t('eventDetail.linkCopied') : t('eventDetail.share')}
            </button>
            <button
              onClick={() => event && downloadEventIcs(event)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 18px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: `1px solid ${BORDER}` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
              {t('eventDetail.addToCalendar')}
            </button>
            {user?.role === 'club' && event.status === 'Open' && event.format === 'bracket' && (
              <button
                onClick={() => setNominating(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 18px', backgroundColor: RED, color: '#fff' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                {t('eventDetail.nominate')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#000000', position: 'sticky', top: '64px', zIndex: 50 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', display: 'flex', gap: '0' }}>
          {(event.format === 'card' ? (['overview', 'fightcard'] as const) : (['overview', 'fightcard', 'fighters'] as const)).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)}
              style={{
                fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '18px 24px', color: tab === tabKey ? '#fff' : MUTED,
                borderBottom: tab === tabKey ? `2px solid ${RED}` : '2px solid transparent',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (tab !== tabKey) (e.currentTarget.style.color = '#ddd') }}
              onMouseLeave={e => { if (tab !== tabKey) (e.currentTarget.style.color = MUTED) }}
            >
              {t(TAB_LABEL_KEYS[tabKey])}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px' }}>
        {tab === 'overview' && <OverviewTab event={event} weightClasses={weightClasses} />}
        {tab === 'fightcard' && (
          event.format === 'card'
            ? <CardFightCardTab eventId={eventId!} />
            : <FightCardTab weightClasses={weightClasses} fighters={fighters} qrToken={event.qr_token} />
        )}
        {tab === 'fighters' && <FightersTab nav={nav} fighters={fighters} />}
      </div>

      {nominating && (
        <NominateModal eventId={eventId!} weightClasses={weightClasses} onCancel={() => setNominating(false)} onSent={() => setNominating(false)} />
      )}
    </div>
  )
}

type ClubRosterFighter = { id: number; name: string; weight: string; record: string }

function NominateModal({ eventId, weightClasses, onCancel, onSent }: { eventId: string; weightClasses: WeightClass[]; onCancel: () => void; onSent: () => void }) {
  const { t } = useLanguage()
  const openClasses = weightClasses.filter(wc => (wc.status ?? 'open') === 'open')
  const [rosterFighters, setRosterFighters] = useState<ClubRosterFighter[] | null>(null)
  const [weightClassId, setWeightClassId] = useState<number | null>(openClasses[0]?.id ?? null)
  const [fighterId, setFighterId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ fighters: ClubRosterFighter[] }>(`/api/events/${eventId}/available-club-fighters`)
      .then(r => { setRosterFighters(r.fighters); setFighterId(r.fighters[0]?.id ?? null) })
      .catch(() => setRosterFighters([]))
  }, [eventId])

  const submit = async () => {
    if (!weightClassId || !fighterId) return
    setSaving(true)
    setError(null)
    try {
      await apiFetch(`/api/events/${eventId}/weight-classes/${weightClassId}/nominations`, {
        method: 'POST',
        body: JSON.stringify({ fighterId, note: note.trim() }),
      })
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onCancel}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, width: '100%', maxWidth: '480px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '20px' }}>{t('eventDetail.nominateTitle')}</h2>

        {openClasses.length === 0 ? (
          <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{t('eventDetail.nominateNoClasses')}</div>
        ) : (
          <>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginBottom: '8px' }}>{t('eventDetail.nominateWeightClass')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {openClasses.map(wc => (
                <button key={wc.id} type="button" onClick={() => setWeightClassId(wc.id)}
                  style={{ padding: '8px 14px', fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', border: `1px solid ${weightClassId === wc.id ? RED : BORDER}`, backgroundColor: weightClassId === wc.id ? '#071a30' : 'transparent', color: weightClassId === wc.id ? '#fff' : MUTED }}
                >
                  {wc.name}
                </button>
              ))}
            </div>

            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginBottom: '8px' }}>{t('eventDetail.nominateFighter')}</div>
            {rosterFighters === null ? (
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>Loading…</div>
            ) : rosterFighters.length === 0 ? (
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, marginBottom: '20px' }}>{t('eventDetail.nominateNoFighters')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {rosterFighters.map(f => (
                  <button key={f.id} type="button" onClick={() => setFighterId(f.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', border: `1px solid ${fighterId === f.id ? RED : BORDER}`, backgroundColor: fighterId === f.id ? '#071a30' : 'transparent' }}
                  >
                    <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>{f.name}</span>
                    <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>{f.weight} · {f.record}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginBottom: '6px' }}>{t('eventDetail.nominateNote')}</div>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff', padding: '11px 14px', fontFamily: DISPLAY, fontSize: '14px', minHeight: '70px', resize: 'vertical', marginBottom: '20px' }}
            />

            {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, marginBottom: '14px' }}>{error}</div>}
            <button
              type="button"
              onClick={submit}
              disabled={saving || !weightClassId || !fighterId || (rosterFighters?.length ?? 0) === 0}
              style={{ width: '100%', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', opacity: saving ? 0.6 : 1, marginBottom: '10px' }}
            >
              {saving ? 'Sending…' : t('eventDetail.nominate')}
            </button>
          </>
        )}
        <button type="button" onClick={onCancel} style={{ width: '100%', fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', padding: '10px' }}>Cancel</button>
      </div>
    </div>
  )
}

function OverviewTab({ event, weightClasses }: { event: EventInfo; weightClasses: WeightClass[] }) {
  const { t } = useLanguage()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '48px', alignItems: 'start' }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>{t('eventDetail.about')}</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '20px' }}>{event.name}</h2>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#888' }}>
          {t('eventDetail.aboutBody', { discipline: event.discipline.toLowerCase(), organizer: event.organizer_name, location: event.location, date: formatDisplayDate(event.date) })}
          {event.format === 'bracket' && weightClasses.length > 0 && t(weightClasses.length === 1 ? 'eventDetail.weightClassesSuffixOne' : 'eventDetail.weightClassesSuffixMany', { count: weightClasses.length })}
        </p>
      </div>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>{t('eventDetail.details')}</div>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            [t('eventDetail.date'), formatDisplayDate(event.date)],
            [t('eventDetail.location'), event.location],
            ...(event.venue ? [[t('eventDetail.venue'), event.venue]] : []),
            [t('eventDetail.organizer'), event.organizer_name],
            [t('eventDetail.discipline'), event.discipline],
            ...(event.format === 'bracket' ? [[t('eventDetail.weightClasses'), String(weightClasses.length)]] : []),
            [t('eventDetail.views'), String(event.views)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{k}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FightCardTab({ weightClasses, fighters, qrToken }: { weightClasses: WeightClass[]; fighters: EventFighter[]; qrToken: string }) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<number | null>(weightClasses[0]?.id ?? null)
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(false)

  const fightersById = Object.fromEntries(fighters.map(f => [f.id, { name: f.name, club: f.club }]))

  useEffect(() => {
    if (!selected) { setBouts([]); return }
    setLoading(true)
    apiFetch<{ bouts: Bout[] }>(`/api/public/weight-classes/${selected}/bracket`)
      .then(r => setBouts(r.bouts))
      .catch(() => setBouts([]))
      .finally(() => setLoading(false))
  }, [selected])

  // Keeps results live while a viewer sits on this page during an event —
  // mirrors PublicEvent.tsx's audience-page subscription exactly.
  useEffect(() => {
    if (!qrToken) return
    const unsubscribe = subscribeToEvent(qrToken, msg => {
      if (msg.type === 'bracket:update' && msg.weightClassId === selected) {
        apiFetch<{ bouts: Bout[] }>(`/api/public/weight-classes/${msg.weightClassId}/bracket`)
          .then(r => setBouts(r.bouts))
          .catch(() => {})
      }
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrToken, selected])

  if (weightClasses.length === 0) {
    return (
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
        {t('eventDetail.noFightCard')}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {weightClasses.map(wc => (
          <button key={wc.id} onClick={() => setSelected(wc.id)}
            style={{ padding: '10px 18px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${selected === wc.id ? RED : BORDER}`, backgroundColor: selected === wc.id ? '#071a30' : 'transparent', color: selected === wc.id ? '#fff' : MUTED }}
          >
            {wc.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}><Spinner size={14} /> {t('common.loading')}</div>
      ) : (
        <BracketView bouts={bouts} fighters={fightersById} />
      )}
    </div>
  )
}

type CardBoutPublic = {
  id: number
  fighter_a_name: string
  fighter_a_record: string
  fighter_b_name: string
  fighter_b_record: string
  weight_class_text: string
  card_position: 'main' | 'co-main' | 'undercard'
  rounds: number | null
}

function CardFightCardTab({ eventId }: { eventId: string }) {
  const { t } = useLanguage()
  const CARD_POSITION_LABELS: Record<CardBoutPublic['card_position'], string> = {
    main: t('eventDetail.mainEvent'),
    'co-main': t('eventDetail.coMain'),
    undercard: t('eventDetail.undercard'),
  }
  const [bouts, setBouts] = useState<CardBoutPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch<{ bouts: CardBoutPublic[] }>(`/api/public/events/${eventId}/card-bouts`)
      .then(r => setBouts(r.bouts))
      .catch(() => setBouts([]))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>{t('common.loading')}</div>
  }
  if (bouts.length === 0) {
    return (
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
        {t('eventDetail.noFightCard')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
      {bouts.map(b => (
        <div key={b.id} style={{ backgroundColor: CARD, padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '4px 12px', border: `1px solid ${b.card_position === 'main' ? RED : BORDER}`, color: b.card_position === 'main' ? RED : MUTED }}>
              {CARD_POSITION_LABELS[b.card_position]}
            </span>
            <span style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {[b.weight_class_text, b.rounds ? `${b.rounds} ${t('eventDetail.rounds')}` : null].filter(Boolean).join(' · ')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>{b.fighter_a_name}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, marginTop: '4px' }}>{b.fighter_a_record}</div>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, color: RED }}>VS</div>
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>{b.fighter_b_name}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, marginTop: '4px' }}>{b.fighter_b_record}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FightersTab({ nav, fighters }: { nav: NavFn; fighters: EventFighter[] }) {
  const { t } = useLanguage()
  if (fighters.length === 0) {
    return (
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
        {t('eventDetail.noFighters')}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
      {fighters.map(f => (
        <div key={f.id} style={{ backgroundColor: CARD, overflow: 'hidden', cursor: 'pointer', padding: '20px' }}
          onClick={() => nav(`/fighters/${f.id}`)}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>{f.name}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{f.club} · {f.weight}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: '#ccc', marginTop: '8px' }}>{f.record}</div>
        </div>
      ))}
    </div>
  )
}
