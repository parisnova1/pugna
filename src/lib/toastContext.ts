export type ToastKind = 'error' | 'success'
export type ToastItem = { id: number; message: string; kind: ToastKind }

// A plain module-level store rather than React state living in
// ToastProvider — callers can push a toast from anywhere (a promise
// rejection, a plain function, outside any component) without needing a
// hook, and the queue isn't tied to any one component instance's lifetime.
// ToastProvider (Toast.tsx) subscribes via useSyncExternalStore to render it.
let toasts: ToastItem[] = []
let nextId = 0
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function getToasts(): ToastItem[] {
  return toasts
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function dismissToast(id: number) {
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

export function pushToast(message: string, kind: ToastKind = 'error') {
  const id = nextId++
  toasts = [...toasts, { id, message, kind }]
  emit()
  setTimeout(() => dismissToast(id), 5000)
}

// Thin hook wrapper so call sites read `const { showToast } = useToast()` —
// no Context needed since pushToast has no per-instance state to isolate.
export function useToast() {
  return { showToast: pushToast }
}
