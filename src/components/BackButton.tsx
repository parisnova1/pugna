import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

export default function BackButton({ style, floating }: { style?: CSSProperties; floating?: boolean }) {
  const navigate = useNavigate()
  const { t } = useLanguage()

  if (floating) {
    return (
      <button
        onClick={() => navigate(-1)}
        aria-label={t('common.back')}
        title={t('common.back')}
        style={{
          position: 'fixed', top: '84px', left: '24px', zIndex: 90,
          width: '44px', height: '44px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(15,15,15,0.85)', border: '1px solid #333333',
          backdropFilter: 'blur(8px)', color: MUTED, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'color 0.15s, border-color 0.15s, transform 0.15s',
          ...style,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#0070f3'; e.currentTarget.style.transform = 'scale(1.06)' }}
        onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = '#333333'; e.currentTarget.style.transform = 'scale(1)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600, color: MUTED,
        textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'color 0.15s',
        ...style,
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
      onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
      {t('common.back')}
    </button>
  )
}
