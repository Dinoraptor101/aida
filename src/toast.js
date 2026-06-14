// Tiny floating-notification store. notify() adds a toast; <ToastHost/> reflects
// the current list via useSyncExternalStore (StrictMode-safe). Built fresh, no
// deps. The list lives here so a re-mounting host never loses messages.

let toasts = []
const listeners = new Set()
let seq = 0

function emit() {
  for (const l of listeners) l()
}

export function notify(message, opts = {}) {
  if (!message) return null
  const t = { id: ++seq, message: String(message), type: opts.type || 'info' }
  const ttl = opts.ttl ?? 4500
  toasts = [...toasts, t]
  emit()
  if (ttl > 0) setTimeout(() => dismissToast(t.id), ttl)
  return t.id
}

export function dismissToast(id) {
  const next = toasts.filter((x) => x.id !== id)
  if (next.length !== toasts.length) {
    toasts = next
    emit()
  }
}

export function subscribeToasts(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts() {
  return toasts
}
