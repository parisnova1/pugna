import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { ACCENT as RED, TEXT, LINE as BORDER, POSITIVE_GREEN, FONT_BODY as DISPLAY } from '../theme'

export default function CopyButton({ text, label, style }: { text: string; label?: string; style?: React.CSSProperties }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fall back to a
      // hidden textarea + execCommand so the button still works.
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      onClick={copy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        border: `1px solid ${copied ? POSITIVE_GREEN : BORDER}`, color: copied ? POSITIVE_GREEN : TEXT,
        backgroundColor: 'transparent', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px', borderRadius: '9999px', transition: 'all 0.15s',
        ...style,
      }}
      onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED } }}
      onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT } }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      )}
      {copied ? t('common.copied') : (label ?? t('common.copyLink'))}
    </button>
  )
}
