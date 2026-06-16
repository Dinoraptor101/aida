import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { Working } from './Bits.jsx'

// "What Aida knows about [Person]" — the persistent theory-of-mind made visible.
// Synthesized on demand from the bank (no per-message cost). It LEADS with the
// gap between how they experience their own messages and how you tend to read
// them — ToM, not sentiment. "Remember THEM, not their words."
export default function PerspectivePanel({ partnerId, partnerName, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const panelRef = useRef(null)
  const reqId = useRef(0) // guards against a stale/raced response landing late

  // Synthesize (on open, on partner change, or on a manual retry).
  const load = useCallback(() => {
    const my = ++reqId.current
    setState({ loading: true, error: '', data: null })
    api
      .perspective(partnerId)
      .then((d) => {
        if (my === reqId.current) setState({ loading: false, error: '', data: d })
      })
      .catch((e) => {
        if (my === reqId.current)
          setState({ loading: false, error: e.message || 'Could not reach Aida just now.', data: null })
      })
  }, [partnerId])

  useEffect(() => {
    load()
    return () => {
      reqId.current++ // invalidate any in-flight request on unmount / partner change
    }
  }, [load])

  // Move focus into the dialog on open (the close button is always present).
  useEffect(() => {
    panelRef.current?.querySelector('.tom-close')?.focus()
  }, [])

  // Escape closes; Tab is trapped within the panel (it's a modal dialog).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && panelRef.current) {
        const f = Array.from(
          panelRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.disabled)
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { loading, error, data } = state
  // A network reject OR a server-side fallback (grounded:false + error:true) is a
  // transient failure — distinct from a genuine cold start, and offers a retry.
  const failed = !!error || (data && data.error === true)
  const grounded = data && data.grounded === true

  return (
    <div className="tom-scrim" onClick={onClose}>
      <div
        className="tom-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`What Aida knows about ${partnerName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tom-head">
          <span className="tom-title">What Aida knows about {partnerName}</span>
          <button className="tom-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loading ? (
          <div className="tom-body">
            <Working label="gathering what Aida has learned…" />
          </div>
        ) : failed ? (
          <div className="tom-body">
            <p className="learning-note">
              {error || `Aida couldn't gather this just now — please try again in a moment.`}
            </p>
            <button className="btn btn-sm tom-retry" onClick={load}>
              Try again
            </button>
          </div>
        ) : grounded ? (
          <div className="tom-body">
            {data.gap && (
              <div className="tom-gap">
                <span className="panel-k">the space between you</span>
                <p>{data.gap}</p>
              </div>
            )}

            <div className="tom-views">
              {data.selfView && (
                <div className="tom-view">
                  <span className="panel-k">how {partnerName} likely sees it</span>
                  <p>{data.selfView}</p>
                </div>
              )}
              {data.yourView && (
                <div className="tom-view">
                  <span className="panel-k">how you tend to read it</span>
                  <p>{data.yourView}</p>
                </div>
              )}
            </div>

            {data.theyKnow && data.theyKnow.length > 0 && (
              <div className="tom-remember">
                <span className="panel-k">worth remembering</span>
                <ul>
                  {data.theyKnow.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="tom-foot">
              Aida builds this only from how {partnerName} writes to you — it sharpens as you talk.
            </p>
          </div>
        ) : (
          <div className="tom-body">
            <p className="learning-note">
              Aida is still learning how {partnerName} writes — not enough yet to show how they see
              things. Read a few of their messages and this will fill in.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
