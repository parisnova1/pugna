import { useState } from 'react'
import type { NavFn } from '../App'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

const FIGHT_IMG = 'https://images.unsplash.com/photo-1546711076-85a7923432ab?w=1440&h=600&fit=crop&auto=format'
const FIGHT_ACT = 'https://images.unsplash.com/photo-1495555687398-3f50d6e79e1e?w=800&h=500&fit=crop&auto=format'

const FIGHT_CARD = [
  { a: 'Konstantin Braun', b: 'Artur Wisniewski', aRec: '12–2–0', bRec: '15–1–0', weight: 'Super Welterweight 69 KG', rounds: 10, status: 'Main Event', pro: true },
  { a: 'Marcus Müller', b: 'David Okafor', aRec: '8–2–0', bRec: '6–3–0', weight: 'Welterweight 67 KG', rounds: 6, status: 'Co-Main', pro: false },
  { a: 'Julian Reiter', b: 'Emre Yildiz', aRec: '11–1–0', bRec: '9–4–0', weight: 'Middleweight 75 KG', rounds: 4, status: 'Undercard', pro: false },
  { a: 'Tobias Lang', b: 'Ali Hassan', aRec: '7–1–0', bRec: '5–2–0', weight: 'Lightweight 61 KG', rounds: 4, status: 'Undercard', pro: false },
  { a: 'Nico Schmidt', b: 'Luca Ferrari', aRec: '3–0–0', bRec: '4–1–0', weight: 'Junior Welterweight 64 KG', rounds: 4, status: 'Opener', pro: false },
]

export default function EventDetail({ nav }: { nav: NavFn }) {
  const [tab, setTab] = useState<'overview' | 'fightcard' | 'fighters' | 'schedule'>('fightcard')

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '480px', overflow: 'hidden' }}>
        <img src={FIGHT_IMG} alt="Championship Night Berlin" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #080808 0%, rgba(8,8,8,0.6) 50%, rgba(8,8,8,0.1) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '3px', height: '100%', backgroundColor: RED, right: 'auto' }} />

        <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.25em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>
            Boxing · Professional · 14 September 2026
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, marginBottom: '16px' }}>
            CHAMPIONSHIP NIGHT<br />BERLIN
          </h1>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: MUTED }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mercedes-Benz Arena Berlin</span>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: '14px', letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase' }}>Elite Boxing GmbH · 5 Fights</div>
            <button
              style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '10px 24px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
            >
              Get Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#080808', position: 'sticky', top: '64px', zIndex: 50 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', display: 'flex', gap: '0' }}>
          {(['overview', 'fightcard', 'fighters', 'schedule'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '18px 24px', color: tab === t ? '#fff' : MUTED,
                borderBottom: tab === t ? `2px solid ${RED}` : '2px solid transparent',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (tab !== t) (e.currentTarget.style.color = '#ddd') }}
              onMouseLeave={e => { if (tab !== t) (e.currentTarget.style.color = MUTED) }}
            >
              {t === 'fightcard' ? 'Fight Card' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px' }}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'fightcard' && <FightCardTab />}
        {tab === 'fighters' && <FightersTab nav={nav} />}
        {tab === 'schedule' && <ScheduleTab />}
      </div>
    </div>
  )
}

function OverviewTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '48px', alignItems: 'start' }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>About This Event</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '20px' }}>Championship Night Berlin</h2>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#888', marginBottom: '24px' }}>
          One of Germany's most anticipated boxing events of 2026. Championship Night Berlin brings together the best fighters from across Europe for an unforgettable night of championship-level boxing at the iconic Mercedes-Benz Arena.
        </p>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#888' }}>
          The main event features Konstantin Braun defending his unbeaten home record against the undefeated Polish contender Artur Wisniewski in a Super Welterweight clash that has the boxing world watching.
        </p>
      </div>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Event Details</div>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            ['Date', '14 September 2026'],
            ['Time', '19:00 CET'],
            ['Venue', 'Mercedes-Benz Arena'],
            ['City', 'Berlin, Germany'],
            ['Organizer', 'Elite Boxing GmbH'],
            ['Discipline', 'Boxing'],
            ['Fights', '5 Bouts'],
            ['Check-in', 'QR Code'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{k}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button style={{ width: '100%', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px' }}>
            Get Tickets
          </button>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
            QR Code check-in at venue
          </div>
        </div>
      </div>
    </div>
  )
}

function FightCardTab() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '24px', height: '2px', backgroundColor: RED }} />
        <span style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 600, letterSpacing: '0.25em', color: RED, textTransform: 'uppercase' }}>Fight Card · 14 Sep 2026</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
        {FIGHT_CARD.map((f, i) => (
          <div key={i} style={{ backgroundColor: CARD, padding: '0' }}>
            {/* Status bar */}
            <div style={{ padding: '8px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: f.status === 'Main Event' ? RED : MUTED, textTransform: 'uppercase' }}>{f.status}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{f.weight}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{f.rounds} Rounds</span>
              {f.pro && <span style={{ fontFamily: DISPLAY, fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#c9a227', textTransform: 'uppercase', border: '1px solid #c9a227', padding: '2px 8px' }}>PRO</span>}
            </div>

            {/* Fighters */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: f.status === 'Main Event' ? '40px' : '28px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>{f.a}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.aRec}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: f.status === 'Main Event' ? '24px' : '18px', fontWeight: 900, color: RED, letterSpacing: '0.15em' }}>VS</div>
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: f.status === 'Main Event' ? '40px' : '28px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>{f.b}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.bRec}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FightersTab({ nav }: { nav: NavFn }) {
  const fighters = ['Konstantin Braun', 'Artur Wisniewski', 'Marcus Müller', 'David Okafor', 'Julian Reiter', 'Emre Yildiz']
  const imgs = [
    'https://images.unsplash.com/photo-1607702713064-0143212236ae?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1602827113876-839bcf3ccb3a?w=400&h=400&fit=crop',
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
      {fighters.map((name, i) => (
        <div key={name} style={{ backgroundColor: CARD, overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => nav('fighter')}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
        >
          <div style={{ height: '200px', backgroundColor: '#0a0a0a' }}>
            <img src={imgs[i % 2]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(30%)' }} />
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>{name}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Boxing · {65 + i * 3} KG</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScheduleTab() {
  const items = [
    { time: '18:00', label: 'Doors Open' },
    { time: '18:30', label: 'Preliminary Bouts' },
    { time: '19:30', label: 'Undercard Bouts' },
    { time: '20:30', label: 'Co-Main Event' },
    { time: '21:15', label: 'Main Event — Braun vs. Wisniewski' },
    { time: '22:30', label: 'Results & Press Conference' },
  ]
  return (
    <div style={{ maxWidth: '600px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '24px', padding: '20px 0', borderBottom: `1px solid ${BORDER}`, alignItems: 'center' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 800, color: i === 4 ? RED : '#fff' }}>{item.time}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: i === 4 ? 800 : 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: i === 4 ? '#fff' : MUTED }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}
