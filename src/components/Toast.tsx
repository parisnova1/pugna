import { useSyncExternalStore } from 'react'
import { getToasts, subscribeToasts, dismissToast } from '../lib/toastContext'
import { BG, LIVE_RED, TEXT, FONT_BODY as DISPLAY } from '../theme'

// Renders whatever's in the module-level toast store (see lib/toastContext) —
// no local state here on purpose, see that file's comment for why.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts)

  return (
    <>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 500,
          display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', pointerEvents: 'none',
          width: '100%', padding: '0 16px',
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            style={{
              pointerEvents: 'auto', cursor: 'pointer', maxWidth: '420px',
              backgroundColor: BG, color: TEXT, borderLeft: `4px solid ${LIVE_RED}`,
              borderTop: '1px solid rgba(17,17,20,0.12)', borderRight: '1px solid rgba(17,17,20,0.12)', borderBottom: '1px solid rgba(17,17,20,0.12)',
              borderRadius: '4px', padding: '12px 18px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)', textAlign: 'left',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  )
}
