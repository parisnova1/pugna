import { useEffect, useMemo, useState } from 'react'
import { apiFetch, ApiError } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import { subscribeToEvent } from '../lib/ws'
import BracketView, { type Bout } from '../components/Bracket'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

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
}

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
      <div style={{ fontFamily: DISPLAY, fontSize: '24px', fontWeight: 900, letterSpacing: '0.12em', color: '#fff', textTransform: 'uppercase' }}>
        PUGNA
      </div>
    </header>
  )
}

function CenteredMessage({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080808', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <Header />
      <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>{title}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: '15px', color: MUTED }}>{body}</div>
      </div>
    </div>
  )
}

export default function PublicEvent({ token }: { token: string }) {
  const [event, setEvent] = useState<PublicEventDetail | null>(null)
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([])
  const [fighters, setFighters] = useState<PublicFighter[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notPublic, setNotPublic] = useState(false)

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
        setSelected(detail.weightClasses[0]?.id ?? null)
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
    if (!selected) { setBouts([]); return }
    apiFetch<{ bouts: Bout[] }>(`/api/public/weight-classes/${selected}/bracket`)
      .then(r => setBouts(r.bouts))
      .catch(() => setBouts([]))
  }, [selected])

  useEffect(() => {
    if (!event) return
    const unsubscribe = subscribeToEvent(event.qr_token, weightClassId => {
      if (weightClassId === selected) {
        apiFetch<{ bouts: Bout[] }>(`/api/public/weight-classes/${weightClassId}/bracket`)
          .then(r => setBouts(r.bouts))
          .catch(() => {})
      }
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, selected])

  const fightersById = useMemo(() => Object.fromEntries(fighters.map(f => [f.id, { name: f.name, club: f.club }])), [fighters])
  const fightersByClass = useMemo(() => {
    const map: Record<number, PublicFighter[]> = {}
    for (const f of fighters) {
      if (f.weight_class_id == null) continue
      ;(map[f.weight_class_id] ??= []).push(f)
    }
    return map
  }, [fighters])

  if (loading) return <CenteredMessage title="Loading…" body="" />
  if (notPublic) return <CenteredMessage title="Not Public Yet" body="This event's audience page isn't live yet — check back once the organizer opens it up." />
  if (error || !event) return <CenteredMessage title="Event Not Found" body={error || 'This link may be incorrect.'} />

  // This live-updating bracket view only applies to tournament/bracket-format
  // events — a simple ordered fight card has its own page at /events/:id.
  if (event.format === 'card') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#080808', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
        <Header />
        <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>{event.name}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: '15px', color: MUTED, marginBottom: '24px' }}>View the fight card on the event page.</div>
          <a href={`/events/${event.id}`} style={{ display: 'inline-block', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px 28px' }}>
            Open Fight Card
          </a>
        </div>
      </div>
    )
  }

  const currentClass = weightClasses.find(wc => wc.id === selected)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080808', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>{event.name}</h1>
        <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          {formatDisplayDate(event.date)} · {event.location} · {event.discipline}
        </div>
        {event.number_of_days > 1 && (
          <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
            {event.number_of_days}-day tournament · {event.ring_count} ring{event.ring_count === 1 ? '' : 's'} · day-by-day schedule coming soon
          </div>
        )}

        {weightClasses.length === 0 ? (
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center', marginTop: '24px' }}>
            No weight classes published yet.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '28px 0' }}>
              {weightClasses.map(wc => (
                <button key={wc.id} onClick={() => setSelected(wc.id)}
                  style={{ padding: '10px 16px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${selected === wc.id ? RED : BORDER}`, backgroundColor: selected === wc.id ? '#1a0507' : 'transparent', color: selected === wc.id ? '#fff' : MUTED }}
                >
                  {wc.name}
                </button>
              ))}
            </div>

            {currentClass && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>Fighters</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(fightersByClass[currentClass.id] ?? []).map(f => (
                    <div key={f.id} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '8px 14px' }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, color: '#fff' }}>{f.name}</span>
                      <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}> — {f.club}</span>
                    </div>
                  ))}
                  {(fightersByClass[currentClass.id] ?? []).length === 0 && (
                    <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>No fighters assigned yet.</div>
                  )}
                </div>
              </div>
            )}

            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '20px' }}>Bracket</div>
            <BracketView bouts={bouts} fighters={fightersById} />
          </>
        )}
      </div>
    </div>
  )
}
