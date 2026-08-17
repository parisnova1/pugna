import { useState } from 'react'
import { useAuth, type Role } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0a0a0a',
  border: `1px solid ${BORDER}`,
  color: '#fff',
  padding: '12px 14px',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  outline: 'none',
}

export default function LoginModal({ initialMode = 'login', initialRole = 'viewer', onClose }: { initialMode?: 'login' | 'signup'; initialRole?: Role; onClose: () => void }) {
  const { login, signup } = useAuth()
  const { t } = useLanguage()
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const role = initialRole
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('login.errorEmail'))
      return
    }
    if (password.length < 6) {
      setError(t('login.errorPassword'))
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setError(t('login.errorName'))
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(name, email, password, role)
      // Don't call onClose() here — it also clears pendingPage (used to redirect
      // after a gated login). The parent closes the modal reactively once its
      // `user` state updates, via the effect in App.tsx.
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, width: '100%', maxWidth: '420px', padding: '36px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '6px' }}>
              {mode === 'login' ? t('login.welcomeBack') : t('login.joinPugna')}
            </div>
            <h2 style={{ fontFamily: DISPLAY, fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
              {mode === 'login' ? t('login.logIn') : t('login.createAccount')}
            </h2>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} style={{ color: MUTED, padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{role === 'club' ? t('login.clubName') : t('login.name')}</label>
              <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} placeholder={role === 'club' ? t('login.clubNamePlaceholder') : t('login.namePlaceholder')} autoComplete="name" />
            </div>
          )}
          <div>
            <label style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t('login.email')}</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t('login.password')}</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {error && (
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, letterSpacing: '0.02em' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '8px', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px', opacity: loading ? 0.6 : 1, transition: 'background-color 0.15s' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#c9112a' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = RED }}
          >
            {loading ? t('login.pleaseWait') : mode === 'login' ? t('login.logIn') : t('login.createAccount')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}
          <button
            type="button"
            onClick={() => { setError(null); setMode(mode === 'login' ? 'signup' : 'login') }}
            style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}
          >
            {mode === 'login' ? t('login.signUp') : t('login.logInLink')}
          </button>
        </div>
      </div>
    </div>
  )
}
