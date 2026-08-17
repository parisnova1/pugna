import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

export default function BackButton({ style }: { style?: CSSProperties }) {
  const navigate = useNavigate()
  const { t } = useLanguage()

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
