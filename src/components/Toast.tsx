import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastKind } from '../lib/toastContext'
import { BG, LIVE_RED, TEXT, FONT_BODY as DISPLAY } from '../theme'

type ToastItem = { id: number; message: string; kind: ToastKind }

const AUTO_DISMISS_MS = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, kind: ToastKind = 'error') => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, message, kind }])
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
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
            onClick={() => dismiss(t.id)}
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
    </ToastContext.Provider>
  )
}
