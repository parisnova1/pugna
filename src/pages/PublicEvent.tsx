import { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, ApiError } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import { subscribeToEvent } from '../lib/ws'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import BracketView, { type Bout } from '../components/Bracket'
import DaySwitcher, { type EventDay } from '../components/DaySwitcher'
import LoginModal from '../components/LoginModal'

import { ACCENT as RED, ON_ACCENT, CARD, LINE as BORDER, MUTED, TEXT, BG, ACCENT_SOFT, FONT_BODY as DISPLAY } from '../theme'

type PublicEventDetail = {
  id: number
  name: string
  date: string
  location: string
  discipline: string
  status: string
  format: string
  number_of_days: number
  ring_count: number
  qr_token: string
  current_bout_id: number | null
  livestream_url: string
}

type LiveBout = { id: number; weight_class_id: number; fighterRed: { name: string } | null; fighterBlue: { name: string } | null }

type WeightClass = {
  id: number
  name: string
  age_group: string
  gender: string
  rounds_count: number
  round_minutes: number
  rest_minutes: number
  sort_order: number
}

type PublicFighter = {
  id: number
  name: string
  club: string
  weight: string
  record: string
  weight_class_id: number | null
}

function Header() {
  return (
    <header style={{ borderBottom: `1px solid ${BORDER}`, padding: '20px 24px' }}>
      <div style={{ fontFamily: DISPLAY, fontSize: '24px', fontWeight: 900, letterSpacing: '0.12em', color: TEXT, textTransform: 'uppercase' }}>
        PUGNA
      </div>
    </header>
  )
}

function CenteredMessage({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: DISPLAY }}>
      <Header />
      <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>{title}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: '15px', color: MUTED }}>{body}</div>
      </div>
    </div>
  )
}

// Guest-facing audience page for /e/:token — deliberately no marketing chrome,
// no app-wide Header, no BrowserRouter (see App.tsx). Still gets Language +
// Auth context so it can show DE/EN strings and a real Follow/Save CTA.
export default function PublicEvent({ token }: { token: string }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [event, setEvent] = useState<PublicEventDetail | null>(null)
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([])
  const weightClassesRef = useRef(weightClasses)
  weightClassesRef.current = weightClasses
  const [fighters, setFighters] = useState<PublicFighter[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notPublic, setNotPublic] = useState(false)
  const [liveBout, setLiveBout] = useState<LiveBout | null>(null)
  const [days, setDays] = useState<EventDay[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<{ event: PublicEventDetail; weightClasses: WeightClass[] }>(`/api/public/events/${token}`),
      apiFetch<{ fighters: PublicFighter[] }>(`/api/public/events/${token}/fighters`),
    ])
      .then(([detail, f]) => {
        setEvent(detail.event)
        setWeightClasses(detail.weightClasses)
        setFighters(f.fighters)
        // If a bout is already live, defer to the "jump to what's live" effect
        // below instead of defaulting here — setting it now would win the race
        // and the live class would never get selected.
        if (!detail.event.current_bout_id) setSelected(detail.weightClasses[0]?.id ?? null)
      })
      .catch(err => {
        if (err instanceof ApiError && err.message === 'This event is not public yet.') {
          setNotPublic(true)
        } else {
          setError(err instanceof Error ? err.message : 'Could not load this event.')
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (user?.role !== 'viewer' || !event) return
    apiFetch<{ events: { id: number }[] }>('/api/public/events/saved')
      .then(r => setSaved(r.events.some(e => e.id === event.id)))
      .catch(() => {})
  }, [event, user?.role])

  useEffect(() => {
    if (!selected) { setBouts([]); return }
    apiFetch<{ bouts: Bout[] }>(`/api/public/weight-classes/${selected}/bracket`)
      .then(r => setBouts(r.bouts))
      .catch(() => setBouts([]))
  }, [selected])

  useEffect(() => {
    apiFetch<{ days: EventDay[] }>(`/api/public/events/${token}/days`)
      .then(r => { setDays(r.days); setSelectedDay(r.days.find(d => d.status === 'live')?.id ?? r.days[0]?.id ?? null) })
      .catch(() => setDays([]))
  }, [token])

  useEffect(() => {
    if (!event) return
    const unsubscribe = subscribeToEvent(event.qr_token, msg => {
      if (msg.type === 'bracket:update' && msg.weightClassId === selected) {
        apiFetch<{ bouts: Bout[] }>(`/api/public/weight-classes/${msg.weightClassId}/bracket`)
          .then(r => setBouts(r.bouts))
          .catch(() => {})
      }
      if (msg.type === 'bout:live') {
        setEvent(prev => (prev ? { ...prev, current_bout_id: msg.boutId } : prev))
      }
      if (msg.type === 'bout:result' && event.current_bout_id === msg.boutId) {
        setEvent(prev => (prev ? { ...prev, current_bout_id: null } : prev))
      }
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, selected])

  useEffect(() => {
    if (!event?.current_bout_id) { setLiveBout(null); return }
    apiFetch<{ bout: LiveBout }>(`/api/public/bouts/${event.current_bout_id}`)
      .then(r => {
        setLiveBout(r.bout)
        // Jump the weight-class picker to whatever's actually live, so a guest
        // landing on the page sees the live bracket without an extra tap.
        setSelected(prev => prev ?? r.bout.weight_class_id)
      })
      .catch(() => {
        setLiveBout(null)
        // The live-bout lookup failed — fall back to the first class so the
        // picker doesn't stay stuck unselected. Reads via ref (not a
        // dependency) since only event.current_bout_id should re-trigger this.
        setSelected(prev => prev ?? weightClassesRef.current[0]?.id ?? null)
      })
  }, [event?.current_bout_id])

  const fightersById = useMemo(() => Object.fromEntries(fighters.map(f => [f.id, { name: f.name, club: f.club }])), [fighters])
  const fightersByClass = useMemo(() => {
    const map: Record<number, PublicFighter[]> = {}
    for (const f of fighters) {
      if (f.weight_class_id == null) continue
      ;(map[f.weight_class_id] ??= []).push(f)
    }
    return map
  }, [fighters])

  // NEXT is derived, never hardcoded: the earliest still-scheduled bout in the
  // currently viewed weight class, excluding whichever bout is already NOW.
  const nextBout = useMemo(() => {
    return bouts
      .filter(b => b.status === 'scheduled' && b.id !== event?.current_bout_id)
      .sort((a, b) => a.round - b.round || a.slot - b.slot)[0] ?? null
  }, [bouts, event?.current_bout_id])

  const toggleSave = async () => {
    if (!user) { setLoginOpen(true); return }
    if (!event) return
    setSaveBusy(true)
    try {
      if (saved) { await apiFetch(`/api/public/events/${event.id}/save`, { method: 'DELETE' }); setSaved(false) }
      else { await apiFetch(`/api/public/events/${event.id}/save`, { method: 'POST' }); setSaved(true) }
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setSaveBusy(false)
    }
  }

  if (loading) return <CenteredMessage title={t('publicEvent.loading')} body="" />
  if (notPublic) return <CenteredMessage title={t('publicEvent.notPublicTitle')} body={t('publicEvent.notPublicBody')} />
  if (error || !event) return <CenteredMessage title={t('eventDetail.notFoundTitle')} body={error || t('publicEvent.linkIncorrect')} />

  // This live-updating bracket view only applies to tournament/bracket-format
  // events — a simple ordered fight card has its own page at /events/:id.
  if (event.format === 'card') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: DISPLAY }}>
        <Header />
        <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>{event.name}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: '15px', color: MUTED, marginBottom: '24px' }}>{t('publicEvent.viewFightCardBody')}</div>
          <a href={`/events/${event.id}`} style={{ display: 'inline-block', backgroundColor: RED, color: ON_ACCENT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px 28px', borderRadius: '9999px' }}>
            {t('publicEvent.openFightCard')}
          </a>
        </div>
      </div>
    )
  }

  const currentClass = weightClasses.find(wc => wc.id === selected)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: DISPLAY }}>
      <Header />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>{event.name}</h1>
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {formatDisplayDate(event.date)} · {event.location} · {event.discipline}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            {event.livestream_url && (
              <a href={event.livestream_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: RED, color: ON_ACCENT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px', borderRadius: '9999px' }}
              >
                {t('eventDetail.watchLive')} ↗
              </a>
            )}
            <button
              onClick={toggleSave}
              disabled={saveBusy}
              style={{
                fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '10px 18px', borderRadius: '9999px', opacity: saveBusy ? 0.6 : 1, transition: 'all 0.15s',
                backgroundColor: saved ? RED : 'transparent', color: saved ? ON_ACCENT : TEXT, border: `1px solid ${saved ? RED : BORDER}`,
              }}
            >
              {saved ? t('eventDetail.saved') : t('eventDetail.save')}
            </button>
          </div>
        </div>

        {liveBout && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: ACCENT_SOFT, border: `1px solid ${RED}`, padding: '12px 18px', margin: '16px 0', maxWidth: 'fit-content' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: RED }} />
            <span style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.1em', color: RED, textTransform: 'uppercase' }}>{t('publicEvent.liveNow')}</span>
            <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, color: TEXT, textTransform: 'uppercase' }}>
              {liveBout.fighterRed?.name ?? '?'} <span style={{ color: MUTED }}>{t('publicEvent.vs')}</span> {liveBout.fighterBlue?.name ?? '?'}
            </span>
          </div>
        )}
        {nextBout && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${BORDER}`, padding: '12px 18px', margin: '0 0 16px', maxWidth: 'fit-content' }}>
            <span style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{t('publicEvent.next')}</span>
            <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, color: TEXT, textTransform: 'uppercase' }}>
              {fightersById[nextBout.fighter_red_id ?? -1]?.name ?? '?'} <span style={{ color: MUTED }}>{t('publicEvent.vs')}</span> {fightersById[nextBout.fighter_blue_id ?? -1]?.name ?? '?'}
            </span>
          </div>
        )}
        {event.number_of_days > 1 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              {t(event.ring_count === 1 ? 'publicEvent.dayTournament' : 'publicEvent.dayTournamentPlural', { days: event.number_of_days, rings: event.ring_count })}
            </div>
            <DaySwitcher days={days} selectedId={selectedDay} onSelect={setSelectedDay} />
          </div>
        )}

        {weightClasses.length === 0 ? (
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center', marginTop: '24px' }}>
            {t('publicEvent.noWeightClasses')}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '28px 0' }}>
              {weightClasses.map(wc => (
                <button key={wc.id} onClick={() => setSelected(wc.id)}
                  style={{ padding: '10px 16px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${selected === wc.id ? RED : BORDER}`, backgroundColor: selected === wc.id ? ACCENT_SOFT : 'transparent', color: selected === wc.id ? TEXT : MUTED }}
                >
                  {wc.name}
                </button>
              ))}
            </div>

            {currentClass && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>{t('eventDetail.tab.fighters')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(fightersByClass[currentClass.id] ?? []).map(f => (
                    <div key={f.id} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '8px 14px' }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, color: TEXT }}>{f.name}</span>
                      <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}> — {f.club}</span>
                    </div>
                  ))}
                  {(fightersByClass[currentClass.id] ?? []).length === 0 && (
                    <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{t('publicEvent.noFightersInClass')}</div>
                  )}
                </div>
              </div>
            )}

            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '20px' }}>{t('publicEvent.bracket')}</div>
            <BracketView bouts={selectedDay ? bouts.filter(b => b.event_day_id === selectedDay) : bouts} fighters={fightersById} />
          </>
        )}
      </div>

      {loginOpen && (
        <LoginModal initialMode="login" initialRole="viewer" onClose={() => setLoginOpen(false)} />
      )}
    </div>
  )
}
