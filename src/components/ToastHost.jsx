import { useSyncExternalStore } from 'react'
import { subscribeToasts, getToasts, dismissToast } from '../toast.js'

// Renders transient notifications as floating overlays (fixed position) so they
// never shift the layout. Tap a toast to dismiss; otherwise it fades on its own.
// Reads the toast list from the module store — StrictMode-safe, no lost messages.
export default function ToastHost() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts)
  if (!toasts.length) return null

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`toast ${t.type}`}
          onClick={() => dismissToast(t.id)}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
