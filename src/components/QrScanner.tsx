import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

const SCANNER_ELEMENT_ID = 'pugna-qr-scanner-region'

export default function QrScanner({ onDecode, onClose }: { onDecode: (text: string) => void; onClose: () => void }) {
  const { t } = useLanguage()
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const decodedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const startedRef = { current: false }

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          text => {
            if (decodedRef.current) return
            decodedRef.current = true
            onDecode(text)
          },
          () => {
            /* per-frame "no QR found" — expected on most frames, ignore */
          },
        )
        .then(() => { startedRef.current = true })
        .catch(() => {
          if (!cancelled) setCameraError(t('viewerHome.cameraError'))
        })
    })

    return () => {
      cancelled = true
      const scanner = scannerRef.current
      // start() never resolved (camera denied, no device, or still pending) —
      // html5-qrcode's stop() throws synchronously in that state rather than
      // rejecting, so calling it unconditionally can crash the unmount.
      if (scanner && startedRef.current) {
        scanner.stop().then(() => scanner.clear()).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualValue.trim()) onDecode(manualValue.trim())
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, width: '100%', maxWidth: '420px', padding: '28px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase' }}>{t('viewerHome.scanTitle')}</h2>
          <button onClick={onClose} aria-label={t('common.close')} style={{ color: MUTED, padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {!cameraError && (
          <div id={SCANNER_ELEMENT_ID} style={{ width: '100%', minHeight: '260px', backgroundColor: '#000', border: `1px solid ${BORDER}`, marginBottom: '16px', overflow: 'hidden' }} />
        )}

        {cameraError ? (
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, lineHeight: 1.6, marginBottom: '18px' }}>{cameraError}</div>
            <form onSubmit={submitManual} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t('viewerHome.eventCodeLabel')}</label>
                <input
                  autoFocus
                  value={manualValue}
                  onChange={e => setManualValue(e.target.value)}
                  placeholder="pugna.app/events/14 or event code"
                  style={{ width: '100%', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff', padding: '12px 14px', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none' }}
                />
              </div>
              <button type="submit" style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px' }}>
                {t('viewerHome.goToEvent')}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textAlign: 'center' }}>
            {t('viewerHome.scanPointCamera')}
          </div>
        )}
      </div>
    </div>
  )
}
