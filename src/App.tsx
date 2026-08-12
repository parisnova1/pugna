import { useState } from 'react'
import Home from './pages/Home'
import EventDetail from './pages/EventDetail'
import FighterProfile from './pages/FighterProfile'
import ClubProfile from './pages/ClubProfile'
import OrganizerDashboard from './pages/OrganizerDashboard'
import Marketplace from './pages/Marketplace'

export type Page = 'home' | 'event' | 'fighter' | 'club' | 'organizer' | 'marketplace' | 'sparring'
export type NavFn = (p: Page) => void

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const nav: NavFn = (p) => { setPage(p); setMenuOpen(false); window.scrollTo(0, 0) }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <Header page={page} nav={nav} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {page === 'home' && <Home nav={nav} />}
      {page === 'event' && <EventDetail nav={nav} />}
      {page === 'fighter' && <FighterProfile nav={nav} />}
      {page === 'club' && <ClubProfile nav={nav} />}
      {page === 'organizer' && <OrganizerDashboard nav={nav} />}
      {page === 'marketplace' && <Marketplace nav={nav} />}
    </div>
  )
}

function Header({ page, nav, menuOpen, setMenuOpen }: { page: Page; nav: NavFn; menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const link = (label: string, target: Page) => (
    <button
      onClick={() => nav(target)}
      className="text-sm font-medium tracking-widest uppercase transition-colors duration-150"
      style={{ color: page === target ? '#e5172b' : '#aaaaaa', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', letterSpacing: '0.1em' }}
      onMouseEnter={e => { if (page !== target) (e.target as HTMLElement).style.color = '#ffffff' }}
      onMouseLeave={e => { if (page !== target) (e.target as HTMLElement).style.color = '#aaaaaa' }}
    >
      {label}
    </button>
  )

  return (
    <header style={{ backgroundColor: 'rgba(8,8,8,0.96)', borderBottom: '1px solid #1c1c1c', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', gap: '40px' }}>
        {/* Logo */}
        <button onClick={() => nav('home')} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '28px', fontWeight: 900, letterSpacing: '0.12em', color: '#ffffff', textTransform: 'uppercase', flexShrink: 0 }}>
          PUGNA
        </button>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-8">
          {link('Events', 'event')}
          {link('Fighters', 'fighter')}
          {link('Clubs', 'club')}
          {link('Sparring', 'sparring')}
          {link('Marketplace', 'marketplace')}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Secondary nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => nav('organizer')}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#888'}
          >
            For Organizers
          </button>
          <button
            onClick={() => nav('club')}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#888'}
          >
            For Clubs
          </button>
        </nav>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-4">
          <button style={{ color: '#888', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#888'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#888'}
          >
            Log In
          </button>
          <button
            style={{ backgroundColor: '#e5172b', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', transition: 'background-color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#c9112a'}
            onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = '#e5172b'}
          >
            Join Pugna
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: '#aaa' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid #1c1c1c', padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#080808' }}>
          {(['Events', 'Fighters', 'Clubs', 'Sparring', 'Marketplace'] as const).map((label, i) => {
            const targets: Page[] = ['event', 'fighter', 'club', 'sparring', 'marketplace']
            return (
              <button key={label} onClick={() => nav(targets[i])}
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase', textAlign: 'left' }}
              >{label}</button>
            )
          })}
          <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: '16px', display: 'flex', gap: '12px' }}>
            <button style={{ flex: 1, padding: '10px', border: '1px solid #1c1c1c', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase' }}>
              Log In
            </button>
            <button style={{ flex: 1, padding: '10px', backgroundColor: '#e5172b', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#fff', textTransform: 'uppercase' }}>
              Join Pugna
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
