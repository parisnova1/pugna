import { useState } from 'react'
import type { NavFn } from '../App'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

const FIGHTER_IMG = 'https://images.unsplash.com/photo-1607702713064-0143212236ae?w=600&h=800&fit=crop&auto=format&q=80'
const ACTION_IMG = 'https://images.unsplash.com/photo-1495555687398-3f50d6e79e1e?w=800&h=500&fit=crop&auto=format'

export default function FighterProfile({ nav }: { nav: NavFn }) {
  const [tab, setTab] = useState<'overview' | 'results' | 'sparring'>('overview')

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#080808' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '48px', alignItems: 'start' }}>
            {/* Photo */}
            <div style={{ position: 'relative' }}>
              <div style={{ height: '360px', backgroundColor: '#111', overflow: 'hidden' }}>
                <img src={FIGHTER_IMG} alt="Marcus Müller" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(15%)' }} />
              </div>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: RED }} />
            </div>

            {/* Info */}
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.25em', color: RED, textTransform: 'uppercase', marginBottom: '8px' }}>
                Boxclub Nürnberg · Professional Fighter
              </div>
              <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(48px, 7vw, 96px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, marginBottom: '20px' }}>
                MARCUS<br />MÜLLER
              </h1>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '0', marginBottom: '32px', border: `1px solid ${BORDER}`, width: 'fit-content' }}>
                {[
                  { label: 'Record', value: '8–2–0' },
                  { label: 'KO/TKO', value: '5' },
                  { label: 'Weight', value: '75 KG' },
                  { label: 'Height', value: '1.82m' },
                  { label: 'Age', value: '26' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '16px 24px', borderRight: i < 4 ? `1px solid ${BORDER}` : 'none', textAlign: 'center' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: i === 0 ? '28px' : '22px', fontWeight: 900, color: i === 0 ? RED : '#fff' }}>{s.value}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
                {['Boxing', 'Amateur', 'Welterweight', 'Orthodox', 'Nürnberg, Bayern'].map(tag => (
                  <span key={tag} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', padding: '4px 12px', border: `1px solid ${BORDER}` }}>{tag}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
                >
                  Contact Club
                </button>
                <button
                  style={{ backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 28px', border: `1px solid ${BORDER}`, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                >
                  Request Sparring
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#080808', position: 'sticky', top: '64px', zIndex: 50 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', display: 'flex' }}>
          {(['overview', 'results', 'sparring'] as const).map(t => (
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
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '48px', alignItems: 'start' }}>
            <div>
              {/* Recent Fights */}
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>Fight History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER, marginBottom: '48px' }}>
                {[
                  { date: '12 Jul 2026', opp: 'Ali Hassan', result: 'W', method: 'TKO R3', event: 'Fight Night Nürnberg' },
                  { date: '15 Mar 2026', opp: 'David Okafor', result: 'W', method: 'PTS', event: 'Open Ring Berlin' },
                  { date: '8 Nov 2025', opp: 'Tobias Lang', result: 'L', method: 'PTS', event: 'Munich Boxing Gala' },
                  { date: '20 Jul 2025', opp: 'Nico Schmidt', result: 'W', method: 'KO R2', event: 'Fight Night Stuttgart' },
                  { date: '14 Feb 2025', opp: 'Luca Ferrari', result: 'W', method: 'TKO R4', event: 'Nürnberg Amateur Cup' },
                ].map((f, i) => (
                  <div key={i} style={{ backgroundColor: CARD, padding: '16px 20px', display: 'grid', gridTemplateColumns: '80px 40px 1fr auto', gap: '16px', alignItems: 'center' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.date}</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, color: f.result === 'W' ? '#4caf50' : f.result === 'L' ? RED : MUTED }}>{f.result}</div>
                    <div>
                      <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase' }}>vs. {f.opp}</div>
                      <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.event}</div>
                    </div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>{f.method}</div>
                  </div>
                ))}
              </div>

              {/* Action photo */}
              <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                <img src={ACTION_IMG} alt="In action" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.4) 0%, transparent 60%)' }} />
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Upcoming Fight</div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>vs. Ali Hassan</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                    23 Aug 2026 · Nürnberg
                  </div>
                  <button
                    onClick={() => nav('event')}
                    style={{ width: '100%', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', transition: 'background-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c9112a')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
                  >
                    View Event
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Sparring Availability</div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4caf50' }} />
                    <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Available</span>
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                    Weekends · 70–80 KG · Nürnberg area
                  </div>
                  <button style={{ width: '100%', backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', border: `1px solid ${BORDER}`, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    Request Sparring
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>Club</div>
                <button onClick={() => nav('club')} style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <div style={{ width: '48px', height: '48px', backgroundColor: '#1a1a1a', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: '16px', fontWeight: 900, color: RED }}>BN</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '16px', fontWeight: 800, textTransform: 'uppercase' }}>Boxclub Nürnberg</div>
                    <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>18 Fighters · Nürnberg</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'results' && (
          <div style={{ fontFamily: DISPLAY, fontSize: '18px', color: MUTED, textTransform: 'uppercase' }}>Full fight results coming soon.</div>
        )}
        {tab === 'sparring' && (
          <div style={{ fontFamily: DISPLAY, fontSize: '18px', color: MUTED, textTransform: 'uppercase' }}>Sparring history coming soon.</div>
        )}
      </div>
    </div>
  )
}
