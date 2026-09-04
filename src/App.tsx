import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Home, { SparringSection, EventDiscovery, ClubDiscovery } from './pages/Home'
import EventDetail from './pages/EventDetail'
import ClubProfile from './pages/ClubProfile'
import OrganizerDashboard from './pages/OrganizerDashboard'
import FighterProfile from './pages/FighterProfile'
import EventManage from './pages/EventManage'
import PublicEvent from './pages/PublicEvent'
import ClubDashboard from './pages/ClubDashboard'
import SearchResults from './pages/SearchResults'
import ViewerHome from './pages/ViewerHome'
import { AuthProvider, useAuth, type Role } from './auth/AuthContext'
import { LanguageProvider, useLanguage, type Lang } from './i18n/LanguageContext'
import LoginModal from './components/LoginModal'
import CookieBanner from './components/CookieBanner'
import NotificationBell from './components/NotificationBell'
import NotificationSettings from './pages/NotificationSettings'
import { BG, TEXT, MUTED, NAV_BG, ACCENT, ON_ACCENT, FONT_BODY } from './theme'

export type NavFn = (path: string) => void

const PUBLIC_EVENT_MATCH = /\/e\/([^/?#]+)/

export default function App() {
  const publicToken = PUBLIC_EVENT_MATCH.exec(window.location.pathname)?.[1]
  if (publicToken) {
    return <PublicEvent token={publicToken} />
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}

function AppShell() {
  const navigate = useNavigate()
  const nav: NavFn = path => navigate(path)
  const { user } = useAuth()
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null)
  const [authRole, setAuthRole] = useState<Role>('viewer')

  const openAuth = (mode: 'login' | 'signup', role: Role = 'viewer') => {
    setAuthRole(role)
    setAuthModal(mode)
  }

  useEffect(() => {
    if (!user) return
    // Only redirect when this login/signup just happened through the header
    // modal (authModal was open) — not on a silent session restore from a
    // stored token, which should leave the visitor wherever they already are.
    if (authModal) {
      navigate(user.role === 'organizer' ? '/organizer' : user.role === 'club' ? '/club-dashboard' : '/home')
    }
    setAuthModal(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG, color: TEXT, fontFamily: FONT_BODY }}>
      <Header nav={nav} onOpenAuth={openAuth} />
      <div style={{ paddingTop: '64px' }}>
      <Routes>
        <Route path="/" element={<Home nav={nav} onOpenAuth={openAuth} />} />
        <Route path="/home" element={<RequireRole role="viewer"><ViewerHome nav={nav} /></RequireRole>} />
        <Route path="/events" element={<EventDiscovery nav={nav} standalone />} />
        <Route path="/events/:eventId" element={<EventDetail nav={nav} />} />
        <Route path="/fighters/:fighterId" element={<FighterProfile nav={nav} />} />
        <Route path="/clubs" element={<ClubDiscovery nav={nav} onOpenAuth={openAuth} />} />
        <Route path="/clubs/:clubId" element={<ClubProfile nav={nav} />} />
        <Route path="/sparring" element={<SparringSection nav={nav} onOpenAuth={openAuth} standalone />} />
        <Route path="/search" element={<SearchResults nav={nav} />} />
        <Route path="/organizer" element={<RequireRole role="organizer"><OrganizerDashboard nav={nav} /></RequireRole>} />
        <Route path="/organizer/events/:eventId/manage" element={<RequireRole role="organizer"><EventManage nav={nav} /></RequireRole>} />
        <Route path="/club-dashboard" element={<RequireRole role="club"><ClubDashboard nav={nav} /></RequireRole>} />
        <Route path="/notification-settings" element={<NotificationSettings nav={nav} />} />
        <Route path="*" element={<NotFound nav={nav} />} />
      </Routes>
      </div>

      {authModal && (
        <LoginModal
          initialMode={authModal}
          initialRole={authRole}
          onClose={() => setAuthModal(null)}
        />
      )}
      <CookieBanner />
    </div>
  )
}

// Gates a route behind a specific account role. Renders the login modal
// in place (URL stays put) when logged out, so the real content appears
// immediately after a successful login — no redirect flash.
function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  if (!ready) return null

  if (!user) {
    return <LoginModal initialMode="login" initialRole={role} onClose={() => navigate('/')} />
  }

  if (user.role !== role) {
    return (
      <div style={{ maxWidth: '480px', margin: '120px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>
          {t('accessRestricted.title')}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: '14px', color: MUTED, marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('accessRestricted.body', { role: t(`role.${role}`) })}
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ backgroundColor: ACCENT, color: ON_ACCENT, fontFamily: FONT_BODY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px' }}
        >
          {t('common.goHome')}
        </button>
      </div>
    )
  }

  return <>{children}</>
}

function NotFound({ nav }: { nav: NavFn }) {
  const { t } = useLanguage()
  return (
    <div style={{ maxWidth: '480px', margin: '120px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: '64px', fontWeight: 900, color: ACCENT, marginBottom: '8px' }}>{t('notFound.title')}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: '16px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '28px' }}>
        {t('notFound.body')}
      </div>
      <button
        onClick={() => nav('/')}
        style={{ backgroundColor: ACCENT, color: ON_ACCENT, fontFamily: FONT_BODY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px' }}
      >
        {t('common.goHome')}
      </button>
    </div>
  )
}

function LanguageToggle({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage()
  return (
    <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '9999px', overflow: 'hidden', flexShrink: 0 }}>
      {(['de', 'en'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            fontFamily: FONT_BODY, fontSize: compact ? '12px' : '11px', fontWeight: 700, letterSpacing: '0.06em',
            padding: compact ? '8px 12px' : '5px 9px', color: lang === l ? ON_ACCENT : 'rgba(255,255,255,0.6)',
            backgroundColor: lang === l ? ACCENT : 'transparent', textTransform: 'uppercase',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function Header({ nav, onOpenAuth }: { nav: NavFn; onOpenAuth: (mode: 'login' | 'signup', role?: Role) => void }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [accountOpen, setAccountOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const submitSearch = () => {
    if (!searchQuery.trim()) return
    nav(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Sliding red "cover" that tracks whichever primary nav link is hovered —
  // measured off the link's own offsetLeft/offsetWidth so it can smoothly
  // animate between links instead of just fading per-item.
  const navLinkRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [navPill, setNavPill] = useState({ left: 0, width: 0, opacity: 0 })

  useEffect(() => {
    if (!hoveredPath) { setNavPill(p => ({ ...p, opacity: 0 })); return }
    const el = navLinkRefs.current[hoveredPath]
    if (!el) return
    setNavPill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
  }, [hoveredPath])

  const link = (label: string, path: string) => (
    <button
      ref={el => { navLinkRefs.current[path] = el }}
      onClick={() => nav(path)}
      onMouseEnter={() => setHoveredPath(path)}
      onMouseLeave={() => setHoveredPath(null)}
      className="text-sm font-medium tracking-widest uppercase"
      style={{
        position: 'relative', zIndex: 1, padding: '8px 16px', borderRadius: '9999px',
        color: hoveredPath === path ? ON_ACCENT : isActive(path) ? ACCENT : 'rgba(255,255,255,0.65)',
        fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.1em',
        transition: 'color 0.2s ease',
      }}
    >
      {label}
    </button>
  )

  return (
    <header style={{ backgroundColor: 'rgba(10,10,10,0.96)', borderBottom: '1px solid rgba(255,255,255,0.12)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', gap: '40px' }}>
        {/* Logo */}
        <button onClick={() => nav('/')} style={{ fontFamily: FONT_BODY, fontSize: '28px', fontWeight: 900, letterSpacing: '0.12em', color: '#ffffff', textTransform: 'uppercase', flexShrink: 0 }}>
          PUGNA
        </button>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center" style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: navPill.left, width: navPill.width,
            backgroundColor: ACCENT, borderRadius: '9999px', opacity: navPill.opacity,
            transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
            zIndex: 0, pointerEvents: 'none',
          }} />
          {link(t('nav.events'), '/events')}
          {link(t('nav.clubs'), '/clubs')}
          {link(t('nav.sparring'), '/sparring')}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Secondary nav */}
        {!user && (
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => nav('/organizer')}
              style={{ fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
            >
              {t('header.forOrganizers')}
            </button>
            <button
              onClick={() => onOpenAuth('signup', 'club')}
              style={{ fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
            >
              {t('header.forClubs')}
            </button>
          </nav>
        )}

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageToggle />
          {user && <NotificationBell nav={nav} />}
          {searchOpen && (
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitSearch(); if (e.key === 'Escape') setSearchOpen(false) }}
              onBlur={() => { if (!searchQuery.trim()) setSearchOpen(false) }}
              placeholder={t('header.searchPlaceholder')}
              style={{ width: '220px', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', padding: '7px 12px', fontFamily: FONT_BODY, fontSize: '13px', outline: 'none', borderRadius: '9999px' }}
            />
          )}
          <button
            onClick={() => (searchOpen ? submitSearch() : setSearchOpen(true))}
            aria-label={t('header.search')}
            style={{ color: 'rgba(255,255,255,0.55)', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setAccountOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: '13px', fontWeight: 800, color: ACCENT }}>
                    {user.name.trim().charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <span style={{ fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.08em', color: '#fff', textTransform: 'uppercase' }}>
                  {user.name.split(' ')[0]}
                </span>
              </button>
              {accountOpen && (
                <div style={{ position: 'absolute', right: 0, top: '42px', backgroundColor: NAV_BG, border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', overflow: 'hidden', minWidth: '180px', zIndex: 110 }}>
                  <button
                    onClick={() => { setAccountOpen(false); nav(user.role === 'club' ? '/club-dashboard' : user.role === 'organizer' ? '/organizer' : '/home') }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.06em', color: '#ccc', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    {user.role === 'club' ? t('header.clubDashboard') : user.role === 'organizer' ? t('header.organizerDashboard') : t('header.viewerHome')}
                  </button>
                  <button
                    onClick={() => { setAccountOpen(false); logout(); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.06em', color: ACCENT, textTransform: 'uppercase' }}
                  >
                    {t('header.logOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => onOpenAuth('login')} style={{ fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
              >
                {t('header.logIn')}
              </button>
              <button
                onClick={() => onOpenAuth('signup', 'viewer')}
                style={{ backgroundColor: ACCENT, color: ON_ACCENT, fontFamily: FONT_BODY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', borderRadius: '9999px', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {t('header.joinPugna')}
              </button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: 'rgba(255,255,255,0.7)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: NAV_BG }}>
          {([[t('nav.events'), '/events'], [t('nav.clubs'), '/clubs'], [t('nav.sparring'), '/sparring']] as const).map(([label, path]) => (
            <button key={path} onClick={() => { setMenuOpen(false); nav(path) }}
              style={{ fontFamily: FONT_BODY, fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase', textAlign: 'left' }}
            >{label}</button>
          ))}
          <div>
            <LanguageToggle compact />
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '16px', display: 'flex', gap: '12px' }}>
            {user ? (
              <>
                <button onClick={() => { setMenuOpen(false); nav(user.role === 'club' ? '/club-dashboard' : user.role === 'organizer' ? '/organizer' : '/home') }} style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '9999px', fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.08em', color: '#fff', textTransform: 'uppercase' }}>
                  {t('header.dashboard')}
                </button>
                <button onClick={logout} style={{ flex: 1, padding: '10px', backgroundColor: ACCENT, borderRadius: '9999px', fontFamily: FONT_BODY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: ON_ACCENT, textTransform: 'uppercase' }}>
                  {t('header.logOut')}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setMenuOpen(false); onOpenAuth('login') }} style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '9999px', fontFamily: FONT_BODY, fontSize: '13px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                  {t('header.logIn')}
                </button>
                <button onClick={() => { setMenuOpen(false); onOpenAuth('signup', 'viewer') }} style={{ flex: 1, padding: '10px', backgroundColor: ACCENT, borderRadius: '9999px', fontFamily: FONT_BODY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: ON_ACCENT, textTransform: 'uppercase' }}>
                  {t('header.joinPugna')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
