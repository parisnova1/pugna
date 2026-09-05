import { createContext, useContext } from 'react'

export type ToastKind = 'error' | 'success'

export type ToastContextValue = {
  // Default kind is 'error' since that's by far the most common call —
  // surfacing the many previously-silent apiFetch failures across the app.
  showToast: (message: string, kind?: ToastKind) => void
}

// Split from Toast.tsx's ToastProvider component on purpose: a module mixing
// a component export with a hook export confuses Vite's Fast Refresh (it
// can't establish a clean refresh boundary), which was causing spurious
// mount/unmount cycles — and toasts silently disappearing — on every dev
// edit to that file.
export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
