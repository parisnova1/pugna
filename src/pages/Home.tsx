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

// ─── Marketing surface — editorial paper, boxing first ─────────────────────
// Separate visual language from the dark-glass app surface below (Serus-
// inspired per the product spec): warm canvas, serif display type, dust
// lilac reserved for marketing CTAs only. Never reuse MKT_LILAC/MKT_SERIF
// inside the app views further down this file — the spec is explicit that
// the two surfaces must not mix.
const MKT_CANVAS = '#EFEDE8'
const MKT_INK = '#111114'
const MKT_INK_MUTED = 'rgba(17,17,20,0.62)'
const MKT_NAV_BG = '#0A0A0A'
const MKT_LILAC = '#C5B4E3'
const MKT_LILAC_SOFT = '#DCD1EC'
const MKT_LINE = 'rgba(17,17,20,0.12)'
const MKT_SERIF = "'Newsreader', Georgia, 'Times New Roman', serif"
const MKT_SANS = "'Geist Sans', sans-serif"

function scrollToMarketingId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Home({ nav, onOpenAuth }: { nav: NavFn; onOpenAuth: OpenAuthFn }) {
  return (
    <main style={{ backgroundColor: MKT_CANVAS, color: MKT_INK, minHeight: '100vh' }}>
      <MarketingNav nav={nav} onOpenAuth={onOpenAuth} />
      <MarketingHero />
      <Reveal><MarketingForClubs onOpenAuth={onOpenAuth} /></Reveal>
      <Reveal><MarketingForOrganizers onOpenAuth={onOpenAuth} /></Reveal>
      <MarketingFooter />
    </main>
  )
}

// ─── Marketing nav — floating black pill capsule ───────────────────────────

function MarketingNav({ nav, onOpenAuth }: { nav: NavFn; onOpenAuth: OpenAuthFn }) {
  const { user } = useAuth()

  const goLogin = () => {
    if (user) nav(user.role === 'club' ? '/club-dashboard' : user.role === 'organizer' ? '/organizer' : '/home')
    else onOpenAuth('login')
  }

  const linkStyle: React.CSSProperties = {
    fontFamily: MKT_SANS, fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.75)',
    padding: '8px 14px', whiteSpace: 'nowrap', transition: 'color 0.15s',
  }

  return (
    <div style={{ position: 'sticky', top: '16px', zIndex: 50, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: MKT_NAV_BG,
        borderRadius: '9999px', padding: '6px 8px 6px 20px', maxWidth: '1100px', width: '100%',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}>
        <button onClick={() => nav('/')} style={{ fontFamily: MKT_SANS, fontSize: '15px', fontWeight: 700, letterSpacing: '0.14em', color: '#fff', marginRight: '8px', flexShrink: 0 }}>
          PUGNA
        </button>
        <button className="hidden sm:inline" onClick={() => scrollToMarketingId('mkt-for-clubs')}
          style={linkStyle} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
        >For Clubs</button>
        <button className="hidden sm:inline" onClick={() => scrollToMarketingId('mkt-for-organizers')}
          style={linkStyle} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
        >For Organizers</button>
        <button className="hidden lg:inline" onClick={() => nav('/events')}
          style={linkStyle} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
        >Events</button>
        <button className="hidden lg:inline" onClick={() => scrollToMarketingId('mkt-footer')}
          style={linkStyle} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
        >About</button>
        <div style={{ flex: 1 }} />
        <button onClick={goLogin} style={{ backgroundColor: '#fff', color: MKT_NAV_BG, fontFamily: MKT_SANS, fontSize: '13px', fontWeight: 600, padding: '9px 20px', borderRadius: '9999px', flexShrink: 0 }}>
          Log in
        </button>
      </nav>
    </div>
  )
}

// ─── Marketing hero — one thesis, one photo ────────────────────────────────

function MarketingHero() {
  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 24px 96px' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '56px', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: MKT_SERIF, fontSize: 'clamp(40px, 7vw, 88px)', fontWeight: 400, lineHeight: 1.02, letterSpacing: '-0.01em', margin: 0 }}>
            The card,<br />live.
          </h1>
          <div style={{ width: '56px', height: '3px', backgroundColor: MKT_LILAC, margin: '28px 0' }} />
          <p style={{ fontFamily: MKT_SANS, fontSize: '17px', lineHeight: 1.6, color: MKT_INK_MUTED, maxWidth: '420px', margin: '0 0 28px' }}>
            Pugna is the private network for amateur boxing. Create events. Fill cards. Keep control.
          </p>
          <div style={{ fontFamily: MKT_SANS, fontSize: '12px', fontWeight: 600, letterSpacing: '0.2em', color: MKT_INK, textTransform: 'uppercase' }}>
            Boxing first
          </div>
        </div>
        <div style={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', aspectRatio: '4 / 5', backgroundColor: '#1a1a1a' }}>
          <img src={IMAGES.fighter1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.05)' }} />
        </div>
      </div>
    </section>
  )
}

// ─── For clubs — photo + lilac overlay card (container-query positioned) ──

const MKT_BULLET_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MKT_INK} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  ),
  person: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MKT_INK} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MKT_INK} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
}

function MarketingForClubs({ onOpenAuth }: { onOpenAuth: OpenAuthFn }) {
  const bullets: Array<[keyof typeof MKT_BULLET_ICONS, string]> = [
    ['home', 'Verein anlegen & verwalten'],
    ['person', 'Boxer einladen & organisieren'],
    ['calendar', 'Kämpfe matchen & Karten planen'],
  ]
  return (
    <section id="mkt-for-clubs" style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 24px', borderTop: `1px solid ${MKT_LINE}` }}>
      <style>{`
        .mkt-clubphoto { container-type: inline-size; }
        .mkt-clubphoto .mkt-overlay { position: static; margin-top: 16px; border-radius: 16px; }
        @container (min-width: 420px) {
          .mkt-clubphoto .mkt-overlay { position: absolute; bottom: 16px; right: 16px; left: auto; margin-top: 0; width: min(260px, calc(100% - 32px)); border-radius: 20px; }
        }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '56px', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: MKT_SANS, fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', color: MKT_LILAC, textTransform: 'uppercase', marginBottom: '16px' }}>For clubs</div>
          <h2 style={{ fontFamily: MKT_SERIF, fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 400, lineHeight: 1.1, margin: '0 0 20px' }}>
            More than a roster.<br />A home for your gym.
          </h2>
          <p style={{ fontFamily: MKT_SANS, fontSize: '15px', lineHeight: 1.65, color: MKT_INK_MUTED, marginBottom: '28px', maxWidth: '440px' }}>
            Create your Verein. Manage your boxers. Build your cards. Keep your club in control.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bullets.map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9999px', border: `1px solid ${MKT_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {MKT_BULLET_ICONS[icon]}
                </div>
                <span style={{ fontFamily: MKT_SANS, fontSize: '15px', color: MKT_INK }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mkt-clubphoto" style={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', aspectRatio: '4 / 3', backgroundColor: '#1a1a1a' }}>
          <img src={IMAGES.ring} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.05)' }} />
          <div className="mkt-overlay" style={{ backgroundColor: MKT_LILAC_SOFT, padding: '20px' }}>
            <div style={{ fontFamily: MKT_SERIF, fontSize: '22px', color: MKT_INK, marginBottom: '8px' }}>Verein anlegen</div>
            <p style={{ fontFamily: MKT_SANS, fontSize: '13px', lineHeight: 1.5, color: MKT_INK_MUTED, margin: '0 0 16px' }}>
              Starte deinen Club auf Pugna und lade dein Team ein.
            </p>
            <button onClick={() => onOpenAuth('signup', 'club')} aria-label="Verein anlegen" style={{ width: '36px', height: '36px', borderRadius: '9999px', backgroundColor: MKT_LILAC, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MKT_INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── For organizers — solid lilac panel, no photo ──────────────────────────

function MarketingForOrganizers({ onOpenAuth }: { onOpenAuth: OpenAuthFn }) {
  const checklist = [
    'Event-Vorlagen für jeden Anlass',
    'Einladungen, Wiegen & Kampfpaarungen',
    'Teilen & Teilnehmer managen',
    'Privat, sicher und datenschutzbewusst',
  ]
  return (
    <section id="mkt-for-organizers" style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 24px 96px', borderTop: `1px solid ${MKT_LINE}` }}>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '56px', alignItems: 'stretch' }}>
        <div>
          <div style={{ fontFamily: MKT_SANS, fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', color: MKT_LILAC, textTransform: 'uppercase', marginBottom: '16px' }}>For organizers</div>
          <h2 style={{ fontFamily: MKT_SERIF, fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 400, lineHeight: 1.1, margin: '0 0 20px' }}>
            Templates for events<br />that run themselves.
          </h2>
          <p style={{ fontFamily: MKT_SANS, fontSize: '15px', lineHeight: 1.65, color: MKT_INK_MUTED, marginBottom: '28px', maxWidth: '440px' }}>
            From invitations to weigh-ins to fight cards. Use proven templates. Customize. Publish. Focus on the fights.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {checklist.map(label => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MKT_INK} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 5-5" />
                </svg>
                <span style={{ fontFamily: MKT_SANS, fontSize: '15px', color: MKT_INK }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ backgroundColor: MKT_LILAC_SOFT, borderRadius: '28px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
          <div>
            <h3 style={{ fontFamily: MKT_SERIF, fontSize: '32px', fontWeight: 400, color: MKT_INK, margin: '0 0 16px' }}>Event erstellen.</h3>
            <p style={{ fontFamily: MKT_SANS, fontSize: '15px', lineHeight: 1.6, color: MKT_INK_MUTED, margin: 0, maxWidth: '320px' }}>
              Wähle eine Vorlage, passe sie an und erstelle dein Event in Minuten.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '28px' }}>
            <button onClick={() => onOpenAuth('signup', 'organizer')} style={{ fontFamily: MKT_SANS, fontSize: '14px', fontWeight: 600, color: MKT_INK, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Jetzt Event erstellen <span aria-hidden>→</span>
            </button>
            <div style={{ width: '44px', height: '44px', borderRadius: '9999px', border: `1px solid ${MKT_INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MKT_INK} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Marketing footer — minimal, "Pugna · Boxing first" ────────────────────

function MarketingFooter() {
  return (
    <footer id="mkt-footer" style={{ borderTop: `1px solid ${MKT_LINE}` }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: MKT_SANS, fontSize: '14px', color: MKT_INK }}>Pugna · Boxing first</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontFamily: MKT_SANS, fontSize: '13px', color: MKT_INK_MUTED }}>Datenschutz</span>
          <span style={{ fontFamily: MKT_SANS, fontSize: '13px', color: MKT_INK_MUTED }}>Nutzungsbedingungen</span>
          <span style={{ fontFamily: MKT_SANS, fontSize: '13px', color: MKT_INK_MUTED }}>Kontakt</span>
          <span style={{ fontFamily: MKT_SANS, fontSize: '13px', color: MKT_INK_MUTED }}>© 2026 Pugna</span>
        </div>
      </div>
    </footer>
  )
}

// ─── Featured Fight ───────────────────────────────────────────────────────────

export function FeaturedFight({ nav }: { nav: NavFn }) {
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

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer({ nav }: { nav: NavFn }) {
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
