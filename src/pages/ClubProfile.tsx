import { useState } from 'react'
import type { NavFn } from '../App'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

const COVER = 'https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?w=1440&h=500&fit=crop&auto=format'

export default function ClubProfile({ nav }: { nav: NavFn }) {
  const [tab, setTab] = useState<'overview' | 'fighters' | 'events' | 'sparring'>('overview')

  return (
    <div>
      {/* Cover */}
      <div style={{ position: 'relative', height: '360px', overflow: 'hidden' }}>
        <img src={COVER} alt="Boxclub Nürnberg" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #080808 0%, rgba(8,8,8,0.5) 60%, rgba(8,8,8,0.1) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: RED }} />
      </div>

      {/* Club header */}
      <div style={{ backgroundColor: '#080808', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 32px', display: 'flex', alignItems: 'flex-end', gap: '32px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
            {/* Logo */}
            <div style={{ width: '80px', height: '80px', backgroundColor: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, color: RED }}>BN</span>
            </div>
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '4px' }}>Nürnberg, Bayern</div>
              <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '8px' }}>
                Boxclub Nürnberg
              </h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Boxing', 'Amateur', 'Professional'].map(t => (
                  <span key={t} style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', padding: '3px 8px', border: `1px solid #2a2a2a` }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
            >
              Contact Club
            </button>
            <button style={{ backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', border: `1px solid ${BORDER}`, transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              Follow Club
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', display: 'flex', gap: '0', borderTop: `1px solid ${BORDER}` }}>
          {[
            { v: '18', l: 'Fighters' }, { v: '3', l: 'Upcoming Events' }, { v: '47', l: 'Total Fights' }, { v: '12', l: 'Coaches' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 32px', borderRight: i < 3 ? `1px solid ${BORDER}` : 'none', paddingLeft: i === 0 ? '0' : '32px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900 }}>{s.v}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#080808', position: 'sticky', top: '64px', zIndex: 50 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', display: 'flex' }}>
          {(['overview', 'fighters', 'events', 'sparring'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '18px 24px', color: tab === t ? '#fff' : MUTED,
                borderBottom: tab === t ? `2px solid ${RED}` : '2px solid transparent', transition: 'color 0.15s',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px' }}>
        {tab === 'overview' && <ClubOverview nav={nav} />}
        {tab === 'fighters' && <ClubFighters nav={nav} />}
        {tab === 'events' && <ClubEvents nav={nav} />}
        {tab === 'sparring' && <div style={{ fontFamily: DISPLAY, fontSize: '18px', color: MUTED, textTransform: 'uppercase' }}>Sparring sessions coming soon.</div>}
      </div>
    </div>
  )
}

function ClubOverview({ nav }: { nav: NavFn }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '48px' }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>About</div>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#888', marginBottom: '32px' }}>
          Boxclub Nürnberg is one of Bavaria's most established boxing clubs, founded in 1982. We train fighters of all levels from beginners to professional competitors. Our coaches include former national champions and licensed trainers with decades of experience.
        </p>

        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>Training Schedule</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER, marginBottom: '40px' }}>
          {[
            ['Monday', '18:00–20:00', 'Amateur Training'],
            ['Tuesday', '09:00–11:00', 'Strength & Conditioning'],
            ['Wednesday', '18:00–20:00', 'Amateur Training'],
            ['Thursday', '18:00–20:00', 'Advanced / Pro Training'],
            ['Saturday', '10:00–13:00', 'Open Gym + Sparring'],
          ].map(([day, time, type]) => (
            <div key={day} style={{ backgroundColor: CARD, padding: '14px 20px', display: 'grid', gridTemplateColumns: '120px 140px 1fr' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{day}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '15px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{time}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{type}</span>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>Coaches</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: BORDER }}>
          {[
            { name: 'Klaus Weber', role: 'Head Coach', exp: '25 years' },
            { name: 'Sandra Berger', role: 'S&C Coach', exp: '12 years' },
            { name: 'Ahmed Karim', role: 'Youth Coach', exp: '8 years' },
          ].map((c, i) => (
            <div key={i} style={{ backgroundColor: CARD, padding: '20px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#1a1a1a', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <span style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, color: RED }}>{c.name[0]}</span>
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>{c.name}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.role} · {c.exp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Club Details</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              ['Founded', '1982'],
              ['Location', 'Nürnberg, Bayern'],
              ['Disciplines', 'Boxing'],
              ['Members', '80+'],
              ['Fighters', '18'],
              ['Status', 'PUGNA Verified'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{k}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600, color: k === 'Status' ? '#4caf50' : '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '20px' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>Next Event</div>
          <button onClick={() => nav('event')} style={{ display: 'block', width: '100%', textAlign: 'left', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '4px' }}>Fight Night Nürnberg</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>23 Aug 2026 · 8 Fights</div>
            <span style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>View Event →</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ClubFighters({ nav }: { nav: NavFn }) {
  const imgs = [
    'https://images.unsplash.com/photo-1607702713064-0143212236ae?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1602827113876-839bcf3ccb3a?w=400&h=400&fit=crop',
  ]
  const fighters = [
    { name: 'Marcus Müller', weight: '75 KG', record: '8–2', level: 'Amateur' },
    { name: 'Tobias Lang', weight: '76 KG', record: '7–1', level: 'Amateur' },
    { name: 'Jonas Fischer', weight: '69 KG', record: '4–0', level: 'Amateur' },
    { name: 'Leon Braun', weight: '60 KG', record: '5–2', level: 'Youth' },
    { name: 'Kai Hoffmann', weight: '81 KG', record: '11–3', level: 'Professional' },
    { name: 'Ben Krause', weight: '67 KG', record: '3–1', level: 'Amateur' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
      {fighters.map((f, i) => (
        <div key={i} style={{ backgroundColor: CARD, overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => nav('fighter')}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ height: '180px', backgroundColor: '#0a0a0a' }}>
            <img src={imgs[i % 2]} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(20%)' }} />
          </div>
          <div style={{ padding: '14px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>{f.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.weight} · {f.level}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '16px', fontWeight: 800 }}>{f.record}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClubEvents({ nav }: { nav: NavFn }) {
  const imgs = [
    'https://images.unsplash.com/photo-1495555687398-3f50d6e79e1e?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1564097147829-44f8c74a8549?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?w=600&h=300&fit=crop',
  ]
  const events = [
    { name: 'Fight Night Nürnberg', date: '23 Aug 2026', fights: 8, status: 'Upcoming' },
    { name: 'Nürnberg Amateur Cup', date: '18 Oct 2026', fights: 16, status: 'Upcoming' },
    { name: 'Club Championship 2026', date: '12 Dec 2026', fights: 12, status: 'Planned' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: BORDER }}>
      {events.map((e, i) => (
        <div key={i} style={{ backgroundColor: CARD, overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => nav('event')}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ height: '160px', backgroundColor: '#0a0a0a' }}>
            <img src={imgs[i]} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }} />
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: e.status === 'Upcoming' ? '#4caf50' : MUTED, textTransform: 'uppercase' }}>{e.status}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{e.fights} Fights</span>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '4px' }}>{e.name}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{e.date}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
