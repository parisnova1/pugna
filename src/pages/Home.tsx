import { useState } from 'react'
import type { NavFn } from '../App'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

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

export default function Home({ nav }: { nav: NavFn }) {
  return (
    <main>
      <HeroSection nav={nav} />
      <StatsBar />
      <FeaturedFight nav={nav} />
      <EventDiscovery nav={nav} />
      <FighterDiscovery nav={nav} />
      <MatchmakingFeature nav={nav} />
      <SparringSection nav={nav} />
      <ClubDiscovery nav={nav} />
      <BrandsSection />
      <MarketplacePreview nav={nav} />
      <ProFights nav={nav} />
      <ForClubs nav={nav} />
      <ForOrganizers nav={nav} />
      <AdvertiseCTA />
      <Footer nav={nav} />
    </main>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function HeroSection({ nav }: { nav: NavFn }) {
  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: '640px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
      <img src={IMAGES.hero} alt="Boxing ring" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #080808 0%, rgba(8,8,8,0.7) 40%, rgba(8,8,8,0.2) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.6) 0%, transparent 60%)' }} />

      {/* Red accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: RED }} />

      <div style={{ position: 'relative', maxWidth: '1440px', margin: '0 auto', padding: '0 32px 80px', width: '100%' }}>
        <div style={{ maxWidth: '740px' }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '2px', backgroundColor: RED }} />
            <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600, letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>
              DACH · Boxing · Kickboxing · MMA · BJJ
            </span>
          </div>

          <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(64px, 10vw, 120px)', fontWeight: 900, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: '28px' }}>
            WHERE<br />
            <span style={{ color: RED }}>COMBAT</span><br />
            SPORTS<br />
            CONNECT.
          </h1>

          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#aaaaaa', maxWidth: '520px', marginBottom: '40px' }}>
            Discover fights, find fighters, connect with clubs, organize events and shop combat sports equipment — all in one place.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => nav('event')}
              style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
            >
              Explore Events
            </button>
            <button
              style={{ backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.3)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
            >
              Join Pugna
            </button>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: 'absolute', bottom: '32px', right: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', writingMode: 'vertical-rl' }}>Scroll</span>
        <div style={{ width: '1px', height: '40px', backgroundColor: MUTED }} />
      </div>
    </section>
  )
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '100+', label: 'Clubs' },
    { value: '1,000+', label: 'Fighters' },
    { value: '50+', label: 'Events' },
    { value: 'DACH', label: 'Region' },
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
    <section style={{ padding: '80px 0', backgroundColor: '#080808' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <SectionLabel text="Featured Fight" />

        <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <img src={IMAGES.fight1} alt="Championship Night Berlin" style={{ width: '100%', height: '480px', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.95) 40%, rgba(8,8,8,0.4) 100%)' }} />

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
                  onClick={() => nav('event')}
                  style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
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

const EVENTS = [
  { img: IMAGES.fight2, name: 'Fight Night Nürnberg', date: '23 Aug 2026', location: 'Nürnberg, Bayern', discipline: 'Boxing', fights: 8, organizer: 'FC Boxring Nürnberg' },
  { img: IMAGES.ring, name: 'Open Ring Berlin', date: '6 Sep 2026', location: 'Berlin', discipline: 'Kickboxing', fights: 12, organizer: 'Kampfsport Berlin e.V.' },
  { img: IMAGES.crowd, name: 'Championship Night Berlin', date: '14 Sep 2026', location: 'Berlin', discipline: 'Boxing', fights: 10, organizer: 'Elite Boxing GmbH' },
  { img: IMAGES.venue, name: 'Vienna Combat Night', date: '28 Sep 2026', location: 'Wien, Österreich', discipline: 'MMA', fights: 9, organizer: 'MMA Austria GmbH' },
  { img: IMAGES.fight1, name: 'Zürich Fight League', date: '11 Oct 2026', location: 'Zürich, Schweiz', discipline: 'Muay Thai', fights: 7, organizer: 'Fight League CH' },
  { img: IMAGES.sparring, name: 'Munich Boxing Gala', date: '18 Oct 2026', location: 'München, Bayern', discipline: 'Boxing', fights: 11, organizer: 'Boxclub München' },
]

function EventDiscovery({ nav }: { nav: NavFn }) {
  const [active, setActive] = useState('All')
  const filtered = active === 'All' ? EVENTS : EVENTS.filter(e => e.discipline === active)

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#080808' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <SectionLabel text="Events" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              FIGHTS & EVENTS<br /><span style={{ color: RED }}>NEAR YOU</span>
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, padding: '10px 16px', color: MUTED }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontFamily: DISPLAY, fontSize: '14px', letterSpacing: '0.08em' }}>Nürnberg, Germany</span>
          </div>
        </div>

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
              {d}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
          {filtered.map((ev, i) => (
            <div key={i} style={{ backgroundColor: CARD, transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
            >
              <div style={{ position: 'relative', overflow: 'hidden', height: '180px', backgroundColor: '#111' }}>
                <img src={ev.img} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                  <span style={{ backgroundColor: RED, fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: '#fff', padding: '4px 10px', textTransform: 'uppercase' }}>{ev.discipline}</span>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase', marginBottom: '6px' }}>{ev.date} · {ev.location}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '12px' }}>{ev.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{ev.fights} Fights · {ev.organizer}</div>
                  </div>
                  <button
                    onClick={() => nav('event')}
                    style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: RED, textTransform: 'uppercase', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = RED)}
                  >
                    View →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button
            onClick={() => nav('event')}
            style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 40px', border: `1px solid ${BORDER}`, color: '#fff', backgroundColor: 'transparent', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
          >
            View All Events
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Fighter Discovery ────────────────────────────────────────────────────────

const FIGHTERS = [
  { name: 'Marcus Müller', club: 'Boxclub Nürnberg', discipline: 'Boxing', weight: '75 KG', record: '8–2', location: 'Nürnberg', img: IMAGES.fighter1 },
  { name: 'David Okafor', club: 'FC Ring Fürth', discipline: 'Boxing', weight: '74 KG', record: '6–3', location: 'Fürth', img: IMAGES.fighter2 },
  { name: 'Julian Reiter', club: 'Kampfsport Berlin', discipline: 'Kickboxing', weight: '70 KG', record: '11–1', location: 'Berlin', img: IMAGES.fighter1 },
  { name: 'Emre Yildiz', club: 'MMA Stuttgart', discipline: 'MMA', weight: '77 KG', record: '9–4', location: 'Stuttgart', img: IMAGES.fighter2 },
]

function FighterDiscovery({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '80px 0', backgroundColor: '#060606' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px', alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: '80px' }}>
            <SectionLabel text="Fighters" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '20px' }}>
              DISCOVER<br /><span style={{ color: RED }}>FIGHTERS</span>
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#888', marginBottom: '32px' }}>
              Find fighters by discipline, weight class, experience and location.
            </p>

            {/* Search filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[['Sport', 'Boxing'], ['Weight', '70–80 KG'], ['Experience', 'Amateur'], ['Location', 'Bayern']].map(([label, val]) => (
                <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 600, color: '#fff' }}>{val}</span>
                </div>
              ))}
              <button
                onClick={() => nav('club')}
                style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px', marginTop: '8px', transition: 'background-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
              >
                Find Fighters
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', backgroundColor: BORDER }}>
            {FIGHTERS.map((f, i) => (
              <div key={i} style={{ backgroundColor: CARD, overflow: 'hidden' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
              >
                <div style={{ position: 'relative', height: '260px', backgroundColor: '#111' }}>
                  <img src={f.img} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(20%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 60%)' }} />
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
                    onClick={() => nav('club')}
                    style={{ width: '100%', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', border: `1px solid ${BORDER}`, color: '#fff', backgroundColor: 'transparent', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = RED)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    View Fighter →
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
    <section style={{ padding: '100px 0', backgroundColor: '#080808', borderTop: `1px solid ${BORDER}` }}>
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
              onClick={() => nav('organizer')}
              style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
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

const SPARRING_SESSIONS = [
  { location: 'Nürnberg', day: 'Saturday', time: '14:00', weight: '70–80 KG', level: 'Amateur', spots: 8, discipline: 'Boxing', host: 'Boxclub Nürnberg' },
  { location: 'München', day: 'Sunday', time: '10:00', weight: '65–75 KG', level: 'All Levels', spots: 12, discipline: 'Kickboxing', host: 'Fight Academy München' },
  { location: 'Berlin', day: 'Wednesday', time: '19:00', weight: '80–90 KG', level: 'Intermediate', spots: 6, discipline: 'Boxing', host: 'Kampfsport Berlin' },
  { location: 'Hamburg', day: 'Saturday', time: '11:00', weight: '60–70 KG', level: 'Amateur', spots: 10, discipline: 'Muay Thai', host: 'Thai Boxing HH' },
]

function SparringSection({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '80px 0', backgroundColor: '#060606', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <SectionLabel text="Sparring" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              FIND YOUR NEXT<br /><span style={{ color: RED }}>SPARRING SESSION.</span>
            </h2>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#888', maxWidth: '320px' }}>
            Clubs can host sparring events and connect with suitable fighters from nearby clubs.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', backgroundColor: BORDER, marginBottom: '40px' }}>
          {SPARRING_SESSIONS.map((s, i) => (
            <div key={i} style={{ backgroundColor: CARD, padding: '24px' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <Tag text={s.discipline} />
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: '#4caf50', textTransform: 'uppercase' }}>
                  {s.spots} spots
                </div>
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: '26px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '4px' }}>{s.location}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                {s.day} · {s.time}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                <Tag text={s.weight} />
                <Tag text={s.level} />
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                Hosted by {s.host}
              </div>
              <button
                style={{ width: '100%', backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', border: `1px solid ${BORDER}`, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = RED; e.currentTarget.style.borderColor = RED }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = BORDER }}
              >
                Join Sparring
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => nav('sparring')}
          style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 40px', border: `1px solid ${BORDER}`, color: '#fff', backgroundColor: 'transparent', transition: 'border-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
        >
          Find Sparring
        </button>
      </div>
    </section>
  )
}

// ─── Club Discovery ───────────────────────────────────────────────────────────

const CLUBS = [
  { name: 'ABC Boxing Nürnberg', disciplines: ['Boxing'], location: 'Nürnberg', fighters: 18, events: 3, img: IMAGES.ring },
  { name: 'XYZ Fight Academy', disciplines: ['Boxing', 'Kickboxing'], location: 'Fürth', fighters: 32, events: 5, img: IMAGES.fight2 },
  { name: 'Kampfsport Berlin', disciplines: ['MMA', 'BJJ'], location: 'Berlin', fighters: 45, events: 7, img: IMAGES.venue },
  { name: 'München Fight Club', disciplines: ['Muay Thai', 'Boxing'], location: 'München', fighters: 27, events: 4, img: IMAGES.crowd },
]

function ClubDiscovery({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '80px 0', backgroundColor: '#080808', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <SectionLabel text="Clubs" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              DISCOVER COMBAT<br /><span style={{ color: RED }}>SPORTS CLUBS</span>
            </h2>
            <button
              onClick={() => nav('club')}
              style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', backgroundColor: 'transparent', color: '#fff', border: `1px solid ${BORDER}`, transition: 'border-color 0.15s', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              Create Club Profile
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
          {CLUBS.map((c, i) => (
            <div key={i} style={{ backgroundColor: CARD, overflow: 'hidden' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
            >
              <div style={{ position: 'relative', height: '160px', backgroundColor: '#111' }}>
                <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,15,0.9) 0%, transparent 60%)' }} />
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '8px' }}>{c.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {c.disciplines.map(d => <Tag key={d} text={d} />)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {c.location} · {c.fighters} Fighters · {c.events} Events
                  </div>
                  <button
                    onClick={() => nav('club')}
                    style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = RED)}
                  >
                    View →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
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

// ─── Marketplace Preview ──────────────────────────────────────────────────────

const PRODUCTS = [
  { name: 'Pro Boxing Gloves', brand: 'Rival', price: '€179', category: 'Boxing Gloves', img: IMAGES.sparring },
  { name: 'Head Guard Pro', brand: 'Fairtex', price: '€89', category: 'Headgear', img: IMAGES.fighter1 },
  { name: 'Competition Shorts', brand: 'Venum', price: '€59', category: 'Apparel', img: IMAGES.fighter2 },
  { name: 'Hand Wraps 4.5m', brand: 'Everlast', price: '€14', category: 'Hand Wraps', img: IMAGES.ring },
]

function MarketplacePreview({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '80px 0', backgroundColor: '#080808', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <SectionLabel text="Marketplace" />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              PUGNA<br /><span style={{ color: RED }}>MARKETPLACE</span>
            </h2>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#888', maxWidth: '320px' }}>Equipment, apparel and everything you need to train and compete.</p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {['Boxing Gloves', 'Hand Wraps', 'Headgear', 'Shoes', 'Apparel', 'Training Equipment', 'Club Merchandise'].map(cat => (
            <button key={cat} onClick={() => nav('event')}
              style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 14px', border: `1px solid ${BORDER}`, color: MUTED, backgroundColor: 'transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
            >{cat}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1px', backgroundColor: BORDER, marginBottom: '40px' }}>
          {PRODUCTS.map((p, i) => (
            <div key={i} style={{ backgroundColor: CARD, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => nav('event')}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
            >
              <div style={{ height: '200px', backgroundColor: '#0a0a0a' }}>
                <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }} />
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase', marginBottom: '4px' }}>{p.brand} · {p.category}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>{p.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900 }}>{p.price}</div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(s => <div key={s} style={{ width: '8px', height: '8px', backgroundColor: RED, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => nav('event')}
            style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 40px', border: `1px solid ${BORDER}`, color: '#fff', backgroundColor: 'transparent', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
          >
            Explore Marketplace
          </button>
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
              onClick={() => nav('event')}
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

function ForClubs({ nav }: { nav: NavFn }) {
  return (
    <section style={{ padding: '100px 0', backgroundColor: '#080808', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div style={{ position: 'relative', height: '420px', backgroundColor: '#111', overflow: 'hidden' }}>
            <img src={IMAGES.ring} alt="Boxing ring" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(229,23,43,0.15) 0%, transparent 60%)' }} />
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
                onClick={() => nav('club')}
                style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 28px', transition: 'background-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
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
                onClick={() => nav('organizer')}
                style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px', transition: 'background-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
              >
                Create an Event
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', height: '420px', backgroundColor: '#111', overflow: 'hidden' }}>
            <img src={IMAGES.crowd} alt="Event crowd" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, transparent 60%, rgba(8,8,8,0.8) 100%)' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Advertise CTA ────────────────────────────────────────────────────────────

function AdvertiseCTA() {
  return (
    <section style={{ padding: '100px 0', backgroundColor: '#080808', borderTop: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden' }}>
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
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
        >
          Advertise With PUGNA
        </button>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ nav }: { nav: NavFn }) {
  const col = (title: string, links: Array<[string, Page?]>) => (
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
          {col('Discover', [['Events', 'event'], ['Clubs', 'club'], ['Sparring', 'sparring']])}
          {col('For Clubs', [['Create Club', 'club'], ['Promote Fighters', 'club'], ['Host Sparring', 'sparring']])}
          {col('For Organizers', [['Create Event', 'organizer'], ['Matchmaking', 'organizer'], ['Tournaments', 'organizer']])}
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
