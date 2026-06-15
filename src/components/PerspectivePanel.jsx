import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Working } from './Bits.jsx'

// "What Aida knows about [Person]" — the persistent theory-of-mind made visible.
// Synthesized on demand from the bank (no per-message cost). It LEADS with the
// gap between how they experience their own messages and how you tend to read
// them — ToM, not sentiment. "Remember THEM, not their words."
export default function PerspectivePanel({ partnerId, partnerName, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', data: null })

  // Synthesize when the panel opens (or the partner changes).
  useEffect(() => {
    let alive = true
    setState({ loading: true, error: '', data: null })
    api
      .perspective(partnerId)
      .then((d) => alive && setState({ loading: false, error: '', data: d }))
      .catch(
        (e) =>
          alive &&
          setState({ loading: false, error: e.message || 'Could not reach Aida just now.', data: null })
      )
    return () => {
      alive = false
    }
  }, [partnerId])

  // Close on Escape — calm, keyboard-reachable.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { loading, error, data } = state
  const grounded = data && data.grounded === true

  return (
    <div className="tom-scrim" onClick={onClose}>
      <div
        className="tom-panel"
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
        ) : error ? (
          <div className="tom-body">
            <p className="learning-note">{error}</p>
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
