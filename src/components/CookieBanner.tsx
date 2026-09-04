import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { ACCENT as RED, ON_ACCENT, CARD, LINE as BORDER, TEXT, MUTED, FONT_BODY as DISPLAY } from '../theme'

const STORAGE_KEY = 'pugna_cookie_consent'

export default function CookieBanner() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  const decide = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label={t('cookie.heading')}
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 300,
        backgroundColor: CARD, borderTop: `1px solid ${BORDER}`,
        animation: 'pugna-slide-up 0.35s ease-out',
      }}
    >
      <div style={{
        maxWidth: '1440px', margin: '0 auto', padding: '20px 32px',
        display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'space-between',
      }}>
        <div style={{ flex: '1 1 420px', minWidth: '260px' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT, marginBottom: '4px' }}>
            {t('cookie.heading')}
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: MUTED, margin: 0 }}>
            {t('cookie.message')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={() => decide('declined')}
            style={{ border: `1px solid ${BORDER}`, borderRadius: '9999px', color: MUTED, backgroundColor: 'transparent', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '11px 22px', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >
            {t('cookie.decline')}
          </button>
          <button
            onClick={() => decide('accepted')}
            style={{ border: `1px solid ${RED}`, borderRadius: '9999px', color: ON_ACCENT, backgroundColor: RED, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '11px 22px', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
