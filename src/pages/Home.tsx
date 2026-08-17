import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { NavFn } from '../App'
import { useAuth, type Role } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import LocationInput from '../components/LocationInput'
import Spinner from '../components/Spinner'
import Reveal from '../components/Reveal'

const RED = '#0070f3'
const CARD = '#0f0f0f'
const BORDER = '#333333'
const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?w=1920&h=1080&fit=crop&auto=format',
  fight1: 'https://images.unsplash.com/photo-1546711076-85a7923432ab?w=800&h=600&fit=crop&auto=format',
  fight2: 'https://images.unsplash.com/photo-1495555687398-3f50d6e79e1e?w=800&h=600&fit=crop&auto=format',
  venue: 'https://images.unsplash.com/photo-1575747515871-2e323827539e?w=1200&h=600&fit=crop&auto=format',
  crowd: 'https://images.unsplash.com/photo-1564097147829-44f8c74a8549?w=800&h=500&fit=crop&auto=format',
  ring: 'https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?w=800&h=500&fit=crop&auto=format',
  fighter1: 'https://images.unsplash.com/photo-1607702713064-0143212236ae?w=400&h=500&fit=crop&auto=format',
  fighter2: 'https://images.unsplash.com/photo-1602827113876-839bcf3ccb3a?w=400&h=500&fit=crop&auto=format',
  sparring: 'https://images.unsplash.com/photo-1620123449946-30d6efd4b8ba?w=600&h=400&fit=crop&auto=format',
}

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; fights: number; fighters: number; views: number; organizer_name: string }
type PublicFighter = { id: number; name: string; club: string; weight: string; record: string; discipline: string; location: string; organizer_name: string }
type PublicClub = { id: number; name: string; location: string; disciplines: string[]; founded_year: number | null; member_count: number; description: string; logo_url: string; cover_url: string; distance_km?: number }

type OpenAuthFn = (mode: 'login' | 'signup', role?: Role) => void

export default function Home({ nav, onOpenAuth }: { nav: NavFn; onOpenAuth: OpenAuthFn }) {
  return (
    <main>
      <HeroSection nav={nav} onOpenAuth={onOpenAuth} />
      <Reveal><StatsBar /></Reveal>
      <Reveal><FeaturedFight nav={nav} /></Reveal>
      <Reveal><EventDiscovery nav={nav} /></Reveal>
      <Reveal><MatchmakingFeature nav={nav} /></Reveal>
      <Reveal><SparringSection nav={nav} onOpenAuth={onOpenAuth} /></Reveal>
      <Reveal><ClubDiscovery nav={nav} onOpenAuth={onOpenAuth} /></Reveal>
      <Reveal><BrandsSection /></Reveal>
      <Reveal><ProFights nav={nav} /></Reveal>
      <Reveal><ForClubs onOpenAuth={onOpenAuth} /></Reveal>
      <Reveal><ForOrganizers nav={nav} /></Reveal>
      <Reveal><AdvertiseCTA /></Reveal>
      <Reveal><FaqSection /></Reveal>
      <Footer nav={nav} />
    </main>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function HeroSection({ nav, onOpenAuth }: { nav: NavFn; onOpenAuth: OpenAuthFn }) {
  const { t } = useLanguage()
  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: '640px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
      <img src={IMAGES.hero} alt="Boxing ring" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

      {/* Red accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: RED }} />

      <div style={{ position: 'relative', maxWidth: '1440px', margin: '0 auto', padding: '0 32px 80px', width: '100%' }}>
        <div style={{ maxWidth: '740px' }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '2px', backgroundColor: RED }} />
            <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600, letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>
              {t('hero.eyebrow')}
            </span>
          </div>

          <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(64px, 10vw, 120px)', fontWeight: 900, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: '28px' }}>
            {t('hero.title1')}<br />
            <span style={{ color: RED }}>{t('hero.title2')}</span><br />
            {t('hero.title3')}<br />
            {t('hero.title4')}
          </h1>

          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#aaaaaa', maxWidth: '520px', marginBottom: '40px' }}>
            {t('hero.subtitle')}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => nav('/events')}
              style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0058cc')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
            >
              {t('hero.exploreEvents')}
            </button>
            <button
              onClick={() => onOpenAuth('signup', 'viewer')}
              style={{ backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.3)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
            >
              {t('hero.joinPugna')}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: 'absolute', bottom: '32px', right: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', writingMode: 'vertical-rl' }}>{t('hero.scroll')}</span>
        <div style={{ width: '1px', height: '40px', backgroundColor: MUTED }} />
      </div>
    </section>
  )
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar() {
  const { t } = useLanguage()
  const stats = [
    { value: '100+', label: t('stats.clubs') },
    { value: '1,000+', label: t('stats.fighters') },
    { value: '50+', label: t('stats.events') },
    { value: 'DACH', label: t('stats.region') },
  ]
  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0a0a0a' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '24px 0', borderRight: i < 3 ? `1px solid ${BORDER}` : 'none', paddingLeft: i > 0 ? '32px' : '0' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '36px', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff' }}>{s.value}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Featured Fight ───────────────────────────────────────────────────────────

function FeaturedFight({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '80px 0', backgroundColor: '#000000' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <SectionLabel text="Featured Fight" />

        <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <img src={IMAGES.fight1} alt="Championship Night Berlin" style={{ width: '100%', height: '480px', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.4) 100%)' }} />

          {/* Red top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: RED }} />

          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px' }}>
            <div style={{ maxWidth: '560px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.25em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>
                Championship Night Berlin · 14 September 2026
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '52px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>Konstantin<br />Braun</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '13px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', marginTop: '4px' }}>GER · 12–2–0</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, color: RED, letterSpacing: '0.15em' }}>VS</div>
                  <div style={{ width: '1px', height: '40px', backgroundColor: BORDER, margin: '8px auto' }} />
                  <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>Super Welterweight</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '52px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>Artur<br />Wisniewski</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '13px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', marginTop: '4px' }}>POL · 15–1–0</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <Tag text="Boxing" />
                <Tag text="69 KG" />
                <Tag text="Professional" />
                <Tag text="10 Rounds" />
              </div>

              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '28px' }}>
                Mercedes-Benz Arena Berlin · Promoted by Elite Boxing GmbH
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => nav('/events')}
                  style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0058cc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
                >
                  View Fight Card
                </button>
                <button
                  style={{ backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', border: `1px solid ${BORDER}`, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                >
                  Get Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Event Discovery ──────────────────────────────────────────────────────────

const DISCIPLINES = ['All', 'Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']
const EVENT_IMAGE_POOL = [IMAGES.fight2, IMAGES.ring, IMAGES.crowd, IMAGES.venue, IMAGES.fight1, IMAGES.sparring]

export function EventDiscovery({ nav, standalone }: { nav: NavFn; standalone?: boolean }) {
  const { t } = useLanguage()
  const DISCIPLINE_LABELS: Record<string, string> = {
    All: t('events.discipline.all'), Boxing: t('events.discipline.boxing'), Kickboxing: t('events.discipline.kickboxing'),
    'Muay Thai': t('events.discipline.muayThai'), MMA: t('events.discipline.mma'), BJJ: t('events.discipline.bjj'), Wrestling: t('events.discipline.wrestling'),
  }
  const [searchParams] = useSearchParams()
  const initialQuery = standalone ? searchParams.get('q') ?? '' : ''
  const arrivedViaSearch = standalone && searchParams.has('q')
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState(initialQuery)
  const filtered = events
    .filter(e => active === 'All' || e.discipline === active)
    .filter(e => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return e.name.toLowerCase().includes(q) || e.organizer_name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
    })

  useEffect(() => {
    apiFetch<{ events: PublicEvent[] }>('/api/public/events').then(r => setEvents(r.events)).catch(() => {})
  }, [])

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#000000' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <SectionLabel text={t('events.label')} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              {t('events.heading1')}<br /><span style={{ color: RED }}>{t('events.heading2')}</span>
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, padding: '10px 16px', color: MUTED }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontFamily: DISPLAY, fontSize: '14px', letterSpacing: '0.08em' }}>Nürnberg, Germany</span>
          </div>
        </div>

        {standalone && (
          <div style={{ marginBottom: '24px' }}>
            <input
              autoFocus={arrivedViaSearch}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('events.searchPlaceholder')}
              style={{ width: '100%', maxWidth: '520px', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff', padding: '13px 16px', fontFamily: "'Geist Sans', sans-serif", fontSize: '14px', outline: 'none' }}
            />
          </div>
        )}

        {/* Discipline filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {DISCIPLINES.map(d => (
            <button
              key={d}
              onClick={() => setActive(d)}
              style={{
                fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '8px 16px', border: `1px solid ${active === d ? RED : BORDER}`,
                backgroundColor: active === d ? RED : 'transparent', color: active === d ? '#fff' : MUTED,
                transition: 'all 0.15s',
              }}
            >
              {DISCIPLINE_LABELS[d] ?? d}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
          {filtered.length === 0 && (
            <div style={{ backgroundColor: CARD, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>
              {events.length === 0 ? t('events.loading') : t('events.noMatch')}
            </div>
          )}
          {filtered.map((ev, i) => (
            <div key={ev.id} style={{ backgroundColor: CARD, transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
            >
              <div style={{ position: 'relative', overflow: 'hidden', height: '180px', backgroundColor: '#111' }}>
                <img src={EVENT_IMAGE_POOL[i % EVENT_IMAGE_POOL.length]} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                  <span style={{ backgroundColor: RED, fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: '#fff', padding: '4px 10px', textTransform: 'uppercase' }}>{DISCIPLINE_LABELS[ev.discipline] ?? ev.discipline}</span>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase', marginBottom: '6px' }}>{formatDisplayDate(ev.date)} · {ev.location}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '12px' }}>{ev.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{ev.fights} {t('events.fights')} · {ev.organizer_name}</div>
                  </div>
                  <button
                    onClick={() => nav(`/events/${ev.id}`)}
                    style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: RED, textTransform: 'uppercase', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = RED)}
                  >
                    {t('common.viewArrow')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!standalone && (
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button
              onClick={() => nav('/events')}
              style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 40px', border: `1px solid ${BORDER}`, color: '#fff', backgroundColor: 'transparent', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              {t('events.viewAllEvents')}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Fighter Discovery ────────────────────────────────────────────────────────

const FIGHTER_IMAGE_POOL = [IMAGES.fighter1, IMAGES.fighter2]

export function FighterDiscovery({ nav, standalone }: { nav: NavFn; standalone?: boolean }) {
  const { t } = useLanguage()
  const [fighters, setFighters] = useState<PublicFighter[]>([])

  useEffect(() => {
    apiFetch<{ fighters: PublicFighter[] }>('/api/public/fighters').then(r => setFighters(r.fighters)).catch(() => {})
  }, [])

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#060606' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px', alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: '80px' }}>
            <SectionLabel text={t('fighters.label')} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '20px' }}>
              {t('fighters.heading1')}<br /><span style={{ color: RED }}>{t('fighters.heading2')}</span>
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#888', marginBottom: '32px' }}>
              {t('fighters.subtitle')}
            </p>

            {/* Search filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[[t('fighters.filterSport'), t('events.discipline.boxing')], [t('fighters.filterWeight'), '70–80 KG'], [t('fighters.filterExperience'), 'Amateur'], [t('fighters.filterLocation'), 'Bayern']].map(([label, val]) => (
                <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 600, color: '#fff' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', backgroundColor: BORDER }}>
            {fighters.length === 0 && (
              <div style={{ backgroundColor: CARD, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>
                {t('fighters.loading')}
              </div>
            )}
            {fighters.map((f, i) => (
              <div key={f.id} style={{ backgroundColor: CARD, overflow: 'hidden' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
              >
                <div style={{ position: 'relative', height: '260px', backgroundColor: '#111' }}>
                  <img src={FIGHTER_IMAGE_POOL[i % FIGHTER_IMAGE_POOL.length]} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(20%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>{f.name}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{f.club}</div>
                  </div>
                </div>
                <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Tag text={f.discipline} />
                    <Tag text={f.weight} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 800, color: '#fff' }}>{f.record}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{f.location}</div>
                  </div>
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  <button
                    onClick={() => nav(`/fighters/${f.id}`)}
                    style={{ width: '100%', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', border: `1px solid ${BORDER}`, color: '#fff', backgroundColor: 'transparent', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = RED)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    {t('fighters.viewFighter')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Matchmaking ──────────────────────────────────────────────────────────────

function MatchmakingFeature({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '100px 0', backgroundColor: '#000000', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <SectionLabel text="Matchmaking" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, marginBottom: '24px' }}>
              FIND THE RIGHT<br /><span style={{ color: RED }}>OPPONENT.</span>
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#888', maxWidth: '440px', marginBottom: '36px' }}>
              Organizers can enter their event requirements and discover suitable fighters from clubs across the PUGNA network.
            </p>
            <button
              onClick={() => nav('/organizer')}
              style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0058cc')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
            >
              Find Fighters
            </button>
          </div>

          {/* Matchmaking UI mock */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: RED }} />
              <span style={{ fontFamily: DISPLAY, fontSize: '13px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>Matchmaking Engine</span>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase', marginBottom: '12px' }}>Requirements</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '24px' }}>
                {[['Sport', 'Boxing'], ['Weight', '75 KG'], ['Level', 'Amateur'], ['Fights', '5–10'], ['Distance', '≤ 150 km']].map(([k, v]) => (
                  <div key={k} style={{ backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
                    <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, color: '#fff' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase', marginBottom: '12px' }}>Top Matches</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {[
                  { match: 92, name: 'Marcus Müller', weight: '75 KG', record: '8–2', location: 'Nürnberg' },
                  { match: 88, name: 'David Okafor', weight: '74 KG', record: '6–3', location: 'Fürth' },
                  { match: 81, name: 'Tobias Lang', weight: '76 KG', record: '7–1', location: 'Erlangen' },
                ].map((m, i) => (
                  <div key={i} style={{ backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'center', minWidth: '52px' }}>
                      <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, color: i === 0 ? RED : '#fff' }}>{m.match}%</div>
                      <div style={{ fontFamily: DISPLAY, fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Match</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase' }}>{m.name}</div>
                      <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.weight} · {m.record} · {m.location}</div>
                    </div>
                    <button style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: RED, textTransform: 'uppercase' }}>Select</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Sparring ─────────────────────────────────────────────────────────────────

type SparringSession = { id: number; club_id: number; location: string; date: string; time: string; weight_range: string; level: string; spots: number; discipline: string; host_name: string; registered_fighters: number }

const DAY_KEYS = ['day.0', 'day.1', 'day.2', 'day.3', 'day.4', 'day.5', 'day.6'] as const

function dayLabel(isoDate: string, t: ReturnType<typeof useLanguage>['t']): string {
  const d = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(d.getTime()) ? isoDate : t(DAY_KEYS[d.getDay()])
}

export function SparringSection({ nav, onOpenAuth, standalone }: { nav: NavFn; onOpenAuth: OpenAuthFn; standalone?: boolean }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [sessions, setSessions] = useState<SparringSession[]>([])
  const [ownClubId, setOwnClubId] = useState<number | null>(null)
  const [joinTarget, setJoinTarget] = useState<SparringSession | null>(null)

  const load = () => apiFetch<{ sessions: SparringSession[] }>('/api/sparring').then(r => setSessions(r.sessions)).catch(() => {})

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (user?.role !== 'club') { setOwnClubId(null); return }
    apiFetch<{ club: { id: number } }>('/api/clubs/me').then(r => setOwnClubId(r.club.id)).catch(() => setOwnClubId(null))
  }, [user])

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#060606', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <SectionLabel text={t('sparring.label')} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              {t('sparring.heading1')}<br /><span style={{ color: RED }}>{t('sparring.heading2')}</span>
            </h2>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#888', maxWidth: '320px' }}>
            {t('sparring.subtitle')}
          </p>
        </div>

        {sessions.length === 0 ? (
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center', marginBottom: '40px' }}>
            {t('sparring.noSessions')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', backgroundColor: BORDER, marginBottom: '40px' }}>
            {sessions.map(s => {
              const remaining = Math.max(0, s.spots - s.registered_fighters)
              const isOwn = ownClubId !== null && s.club_id === ownClubId
              return (
                <div key={s.id} style={{ backgroundColor: CARD, padding: '24px' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <Tag text={s.discipline} />
                    <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: remaining > 0 ? '#4caf50' : MUTED, textTransform: 'uppercase' }}>
                      {remaining > 0 ? `${remaining} ${t('sparring.spotsLeft')}` : t('sparring.full')}
                    </div>
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '26px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '4px' }}>{s.location}</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                    {dayLabel(s.date, t)} · {s.time}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {s.weight_range && <Tag text={s.weight_range} />}
                    <Tag text={s.level} />
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                    {t('sparring.hostedBy')} {s.host_name}
                  </div>
                  {isOwn ? (
                    <div style={{ width: '100%', textAlign: 'center', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', border: `1px solid ${BORDER}`, color: MUTED }}>
                      {t('sparring.yourSession')}
                    </div>
                  ) : user && user.role !== 'club' ? (
                    <div style={{ width: '100%', textAlign: 'center', fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px', color: MUTED }}>
                      {t('sparring.clubAccountsOnly')}
                    </div>
                  ) : (
                    <button
                      disabled={remaining === 0}
                      onClick={() => (user ? setJoinTarget(s) : onOpenAuth('login', 'club'))}
                      style={{ width: '100%', backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', border: `1px solid ${BORDER}`, transition: 'all 0.15s', opacity: remaining === 0 ? 0.5 : 1 }}
                      onMouseEnter={e => { if (remaining > 0) { e.currentTarget.style.backgroundColor = RED; e.currentTarget.style.borderColor = RED } }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = BORDER }}
                    >
                      {remaining === 0 ? t('sparring.full') : t('sparring.join')}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!standalone && (
          <button
            onClick={() => nav('/sparring')}
            style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 40px', border: `1px solid ${BORDER}`, color: '#fff', backgroundColor: 'transparent', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
          >
            {t('sparring.findSparring')}
          </button>
        )}
      </div>

      {joinTarget && (
        <JoinSparringModal
          session={joinTarget}
          onCancel={() => setJoinTarget(null)}
          onJoined={() => { setJoinTarget(null); load() }}
        />
      )}
    </section>
  )
}

function JoinSparringModal({ session, onCancel, onJoined }: { session: SparringSession; onCancel: () => void; onJoined: () => void }) {
  const { t } = useLanguage()
  const [fighterCount, setFighterCount] = useState(1)
  const [weightCategory, setWeightCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fieldInputStyle: React.CSSProperties = {
    width: '100%', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff',
    padding: '11px 14px', fontFamily: "'Geist Sans', sans-serif", fontSize: '14px', outline: 'none',
  }
  const fieldLabelStyle: React.CSSProperties = {
    fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px',
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weightCategory.trim()) { setError(t('sparring.errorWeightCategory')); return }
    setError(null)
    setSaving(true)
    try {
      await apiFetch(`/api/sparring/${session.id}/join`, {
        method: 'POST',
        body: JSON.stringify({ fighterCount, weightCategory: weightCategory.trim() }),
      })
      onJoined()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sparring.errorJoin'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onCancel}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, width: '100%', maxWidth: '420px', padding: '32px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase' }}>{t('sparring.join')}</h2>
          <button onClick={onCancel} aria-label={t('common.close')} style={{ color: MUTED, padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
          {session.host_name} · {session.location} · {dayLabel(session.date, t)} · {session.time}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={fieldLabelStyle}>{t('sparring.numberOfFighters')}</label>
            <input type="number" min={1} style={fieldInputStyle} value={fighterCount} onChange={e => setFighterCount(Number(e.target.value))} />
          </div>
          <div>
            <label style={fieldLabelStyle}>{t('sparring.weightCategory')}</label>
            <input style={fieldInputStyle} value={weightCategory} onChange={e => setWeightCategory(e.target.value)} placeholder="70–80 KG" />
          </div>
          {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
          <button type="submit" disabled={saving}
            style={{ marginTop: '8px', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? t('sparring.joining') : t('common.confirm')}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Club Discovery ───────────────────────────────────────────────────────────

const CLUB_IMAGES = [IMAGES.ring, IMAGES.fight2, IMAGES.venue, IMAGES.crowd]

const RADIUS_OPTIONS = [10, 25, 50, 100, 200]

export function ClubDiscovery({ nav, onOpenAuth }: { nav: NavFn; onOpenAuth: OpenAuthFn }) {
  const { t } = useLanguage()
  const [clubs, setClubs] = useState<PublicClub[]>([])
  const [loading, setLoading] = useState(false)
  const [area, setArea] = useState('')
  const [areaCoords, setAreaCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState(50)
  const [searched, setSearched] = useState(false)

  const loadAll = () => {
    setLoading(true)
    apiFetch<{ clubs: PublicClub[] }>('/api/clubs').then(r => setClubs(r.clubs)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const search = () => {
    if (!areaCoords) return
    setLoading(true)
    setSearched(true)
    apiFetch<{ clubs: PublicClub[] }>(`/api/clubs?lat=${areaCoords.lat}&lng=${areaCoords.lng}&radiusKm=${radiusKm}`)
      .then(r => setClubs(r.clubs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const clearSearch = () => {
    setArea('')
    setAreaCoords(null)
    setSearched(false)
    loadAll()
  }

  const fieldInputStyle: React.CSSProperties = {
    width: '100%', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff',
    padding: '11px 14px', fontFamily: "'Geist Sans', sans-serif", fontSize: '14px', outline: 'none',
  }

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#000000', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <SectionLabel text={t('clubs.label')} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              {t('clubs.heading1')}<br /><span style={{ color: RED }}>{t('clubs.heading2')}</span>
            </h2>
            <button
              onClick={() => onOpenAuth('signup', 'club')}
              style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', backgroundColor: 'transparent', color: '#fff', border: `1px solid ${BORDER}`, transition: 'border-color 0.15s', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              {t('clubs.createProfile')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '40px', backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '20px' }}>
          <div style={{ flex: '1 1 260px', minWidth: '220px' }}>
            <label style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t('clubs.area')}</label>
            <LocationInput
              inputStyle={fieldInputStyle}
              value={area}
              onChange={v => { setArea(v); setAreaCoords(null) }}
              onSelect={r => setAreaCoords({ lat: r.lat, lng: r.lon })}
              placeholder={t('clubs.searchPlaceholder')}
            />
          </div>
          <div style={{ width: '140px' }}>
            <label style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t('clubs.radius')}</label>
            <select style={fieldInputStyle} value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))}>
              {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r} km</option>)}
            </select>
          </div>
          <button
            onClick={search}
            disabled={!areaCoords}
            style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 24px', opacity: areaCoords ? 1 : 0.5 }}
          >
            {t('clubs.search')}
          </button>
          {searched && (
            <button
              onClick={clearSearch}
              style={{ backgroundColor: 'transparent', color: MUTED, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 20px', border: `1px solid ${BORDER}` }}
            >
              {t('clubs.clearSearch')}
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}><Spinner size={14} /> {t('common.loading')}</div>
        ) : clubs.length === 0 ? (
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
            {searched ? t('clubs.noClubsRadius', { radius: radiusKm, area }) : t('clubs.noClubs')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
            {clubs.map((c, i) => (
              <div key={c.id} style={{ backgroundColor: CARD, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => nav(`/clubs/${c.id}`)}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
              >
                <div style={{ position: 'relative', height: '160px', backgroundColor: '#111' }}>
                  <img src={c.cover_url || CLUB_IMAGES[i % CLUB_IMAGES.length]} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,15,0.9) 0%, transparent 60%)' }} />
                  {c.distance_km != null && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.85)', border: `1px solid ${BORDER}`, padding: '3px 9px', fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, color: RED, textTransform: 'uppercase' }}>
                      {c.distance_km} km
                    </div>
                  )}
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '8px' }}>{c.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {c.disciplines.map(d => <Tag key={d} text={d} />)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {c.location} · {c.member_count} {t('clubs.members')}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); nav(`/clubs/${c.id}`) }}
                      style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color = RED)}
                    >
                      {t('common.viewArrow')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Brands / Advertising ─────────────────────────────────────────────────────

function BrandsSection() {
  return (
    <section style={{ padding: '100px 0', backgroundColor: '#060606', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <SectionLabel text="For Brands" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, marginBottom: '24px' }}>
              BUILT FOR THE<br />COMBAT SPORTS<br /><span style={{ color: RED }}>INDUSTRY.</span>
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#888', marginBottom: '36px' }}>
              Brands, products, clubs, promoters and professional fights can reach a highly targeted combat-sports audience across DACH.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {['Featured Brand', 'Featured Event', 'Featured Fighter', 'Professional Fight Campaign', 'Sponsorship'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: '4px', height: '4px', backgroundColor: RED, flexShrink: 0 }} />
                  <span style={{ fontFamily: DISPLAY, fontSize: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Featured brand card */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Featured Brand</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>Sponsored</span>
            </div>
            <div style={{ position: 'relative', height: '220px', backgroundColor: '#111', overflow: 'hidden' }}>
              <img src={IMAGES.sparring} alt="Rival Boxing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,15,1) 0%, rgba(15,15,15,0.3) 60%, transparent 100%)' }} />
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', marginBottom: '8px' }}>Boxing Equipment</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>RIVAL BOXING</div>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '16px' }}>Professional Boxing Gloves — 12 oz / 14 oz / 16 oz</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 800 }}>€179</div>
                <button
                  style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '10px 24px', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0058cc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
                >
                  Shop Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Professional Fights ──────────────────────────────────────────────────────

const PRO_FIGHTS = [
  { a: 'Braun', b: 'Wisniewski', event: 'Championship Night Berlin', date: '14 Sep 2026', weight: 'Super Welterweight', promo: 'Elite Boxing GmbH', img: IMAGES.fight1 },
  { a: 'Rodriguez', b: 'Schäfer', event: 'Fight Night Hamburg', date: '21 Sep 2026', weight: 'Middleweight', promo: 'Top Rank DE', img: IMAGES.fight2 },
  { a: 'Hamed', b: 'Petrov', event: 'Vienna Grand Prix', date: '5 Oct 2026', weight: 'Heavyweight', promo: 'MMA Austria', img: IMAGES.venue },
]

function ProFights({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '80px 0', backgroundColor: '#060606', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <SectionLabel text="Professional Fights" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              THE BIG <span style={{ color: RED }}>FIGHTS</span>
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: BORDER }}>
          {PRO_FIGHTS.map((f, i) => (
            <div key={i} style={{ backgroundColor: CARD, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
              onClick={() => nav('/events')}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
            >
              <div style={{ position: 'relative', height: '240px' }}>
                <img src={f.img} alt={`${f.a} vs ${f.b}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,15,1) 0%, rgba(15,15,15,0.4) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', backgroundColor: RED }} />
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: RED, textTransform: 'uppercase', marginBottom: '8px' }}>
                  {f.weight} · {f.date}
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '4px' }}>
                  {f.a} <span style={{ color: MUTED }}>vs</span> {f.b}
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {f.event} · {f.promo}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── For Clubs ────────────────────────────────────────────────────────────────

function ForClubs({ onOpenAuth }: { onOpenAuth: OpenAuthFn }) {
  return (
    <section style={{ padding: '100px 0', backgroundColor: '#000000', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div style={{ position: 'relative', height: '420px', backgroundColor: '#111', overflow: 'hidden' }}>
            <img src={IMAGES.ring} alt="Boxing ring" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,112,243,0.15) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: RED }} />
          </div>
          <div>
            <SectionLabel text="For Clubs" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, marginBottom: '24px' }}>
              PUT YOUR CLUB<br /><span style={{ color: RED }}>ON THE MAP.</span>
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#888', marginBottom: '32px' }}>
              Create your PUGNA club profile, showcase your fighters, promote your events and connect with other combat-sports clubs across DACH.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '36px' }}>
              {['Club Profile', 'Fighter Profiles', 'Promote Events', 'Host Sparring', 'Find Opponents', 'Reach New Members'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: RED, flexShrink: 0 }} />
                  <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa' }}>{b}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => onOpenAuth('signup', 'club')}
                style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 28px', transition: 'background-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0058cc')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
              >
                Create Club Profile
              </button>
              <button
                style={{ backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 28px', border: `1px solid ${BORDER}`, transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── For Organizers ───────────────────────────────────────────────────────────

function ForOrganizers({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '100px 0', backgroundColor: '#060606', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <SectionLabel text="For Organizers" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, marginBottom: '24px' }}>
              RUN YOUR NEXT<br />EVENT WITH<br /><span style={{ color: RED }}>PUGNA.</span>
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#888', marginBottom: '32px' }}>
              The complete platform for running amateur and professional combat sports events across Germany, Austria and Switzerland.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {['Create Tournaments', 'Register Fighters', 'Find Opponents via Matchmaking', 'Build Fight Cards', 'Publish Events', 'Track Results & Analytics'].map((b, i) => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, minWidth: '24px', fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</div>
                  <span style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ddd' }}>{b}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '36px' }}>
              <button
                onClick={() => nav('/organizer')}
                style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px', transition: 'background-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0058cc')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
              >
                Create an Event
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', height: '420px', backgroundColor: '#111', overflow: 'hidden' }}>
            <img src={IMAGES.crowd} alt="Event crowd" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, transparent 60%, rgba(0,0,0,0.8) 100%)' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Advertise CTA ────────────────────────────────────────────────────────────

function AdvertiseCTA() {
  return (
    <section style={{ padding: '100px 0', backgroundColor: '#000000', borderTop: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <img src={IMAGES.venue} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08 }} />
      </div>
      <div style={{ position: 'relative', maxWidth: '1440px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
        <SectionLabel text="Advertising" centered />
        <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, marginBottom: '24px' }}>
          REACH THE COMBAT<br /><span style={{ color: RED }}>SPORTS COMMUNITY.</span>
        </h2>
        <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#888', maxWidth: '560px', margin: '0 auto 48px' }}>
          Promote your brand, product, club, professional fight or event to a highly targeted combat-sports audience.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' }}>
          {['Featured Product', 'Featured Brand', 'Featured Fighter', 'Fight Campaign', 'Sponsorship'].map(opt => (
            <div key={opt} style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', border: `1px solid ${BORDER}`, color: MUTED }}>
              {opt}
            </div>
          ))}
        </div>
        <button
          style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '16px 48px', transition: 'background-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0058cc')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
        >
          Advertise With PUGNA
        </button>
      </div>
    </section>
  )
}

// ─── FAQ ────────────────────────────────────────────────────────────────────

const FAQ_KEYS = ['faq.q1', 'faq.q2', 'faq.q3', 'faq.q4', 'faq.q5', 'faq.q6'] as const
const FAQ_ANSWER_KEYS = ['faq.a1', 'faq.a2', 'faq.a3', 'faq.a4', 'faq.a5', 'faq.a6'] as const

function FaqSection() {
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#000000', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <SectionLabel text={t('faq.label')} centered />
          <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
            {t('faq.heading1')} <span style={{ color: RED }}>{t('faq.heading2')}</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER, border: `1px solid ${BORDER}` }}>
          {FAQ_KEYS.map((qKey, i) => {
            const isOpen = openIndex === i
            return (
              <div key={qKey} style={{ backgroundColor: CARD }}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    padding: '22px 24px', textAlign: 'left', backgroundColor: 'transparent', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontFamily: DISPLAY, fontSize: '17px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {t(qKey)}
                  </span>
                  <span style={{
                    flexShrink: 0, width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isOpen ? RED : MUTED, transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s, color 0.15s',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </span>
                </button>
                <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, padding: '0 24px 22px', fontSize: '14px', lineHeight: 1.7, color: '#999' }}>
                      {t(FAQ_ANSWER_KEYS[i])}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ nav }: { nav: NavFn }) {
  const col = (title: string, links: Array<[string, string?]>) => (
    <div key={title}>
      <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', marginBottom: '16px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {links.map(([label, target]) => (
          <button key={label}
            onClick={() => target && nav(target)}
            style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 500, color: '#666', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666')}
          >{label}</button>
        ))}
      </div>
    </div>
  )

  return (
    <footer style={{ backgroundColor: '#060606', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '64px 32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '48px', marginBottom: '64px' }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: '36px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>PUGNA</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', marginBottom: '24px' }}>Where Combat Sports Connect.</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['instagram', 'twitter', 'youtube', 'tiktok'].map(s => (
                <button key={s} style={{ width: '36px', height: '36px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="2" stroke="currentColor" fill="none"/></svg>
                </button>
              ))}
            </div>
          </div>
          {col('Discover', [['Events', '/events'], ['Clubs', '/clubs'], ['Sparring', '/sparring']])}
          {col('For Clubs', [['Create Club', '/clubs'], ['Promote Fighters', '/clubs'], ['Host Sparring', '/sparring']])}
          {col('For Organizers', [['Create Event', '/organizer'], ['Matchmaking', '/organizer'], ['Tournaments', '/organizer']])}
          {col('Company', [['About'], ['Contact'], ['Careers'], ['Privacy'], ['Terms']])}
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase' }}>
            © 2026 PUGNA GmbH · All rights reserved
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase' }}>
            Germany · Austria · Switzerland
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────

function SectionLabel({ text, centered }: { text: string; centered?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', justifyContent: centered ? 'center' : 'flex-start' }}>
      <div style={{ width: '24px', height: '2px', backgroundColor: RED }} />
      <span style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 600, letterSpacing: '0.25em', color: RED, textTransform: 'uppercase' }}>
        {text}
      </span>
    </div>
  )
}

function Tag({ text }: { text: string }) {
  return (
    <span style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', padding: '3px 8px', border: `1px solid #2a2a2a`, backgroundColor: '#0f0f0f' }}>
      {text}
    </span>
  )
}
