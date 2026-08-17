import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { NavFn } from '../App'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import BracketView, { type Bout } from '../components/Bracket'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

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
  fights: number
  fighters: number
  views: number
  organizer_name: string
}

type WeightClass = { id: number; name: string; age_group: string; gender: string; rounds_count: number; round_minutes: number; rest_minutes: number }
type EventFighter = { id: number; name: string; club: string; weight: string; record: string; weight_class_id: number | null }

type Tab = 'overview' | 'fightcard' | 'fighters'

const TAB_LABEL_KEYS = {
  overview: 'eventDetail.tab.overview',
  fightcard: 'eventDetail.tab.fightCard',
  fighters: 'eventDetail.tab.fighters',
} as const

export default function EventDetail({ nav }: { nav: NavFn }) {
  const { eventId } = useParams<{ eventId: string }>()
  const { t } = useLanguage()
  const [tab, setTab] = useState<Tab>('overview')
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([])
  const [fighters, setFighters] = useState<EventFighter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 32px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>{t('common.loading')}</div>
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
      {/* Hero */}
      <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
        <img src={HERO_IMG} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #080808 0%, rgba(8,8,8,0.6) 50%, rgba(8,8,8,0.1) 100%)' }} />
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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#080808', position: 'sticky', top: '64px', zIndex: 50 }}>
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
            : <FightCardTab weightClasses={weightClasses} fighters={fighters} />
        )}
        {tab === 'fighters' && <FightersTab nav={nav} fighters={fighters} />}
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

function FightCardTab({ weightClasses, fighters }: { weightClasses: WeightClass[]; fighters: EventFighter[] }) {
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
            style={{ padding: '10px 18px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${selected === wc.id ? RED : BORDER}`, backgroundColor: selected === wc.id ? '#1a0507' : 'transparent', color: selected === wc.id ? '#fff' : MUTED }}
          >
            {wc.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>{t('common.loading')}</div>
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
