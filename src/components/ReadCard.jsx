import { useState } from 'react'
import { Intensity, Working } from './Bits.jsx'

// The calm "read card" for an incoming message. Tentative + relational by
// design. When grounded===false (cold start) it shows humble framing and makes
// no confident relational claim. Repair is the only correction affordance.
export default function ReadCard({ read, onRepair, repairing }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')

  if (!read) return null
  const grounded = read.grounded === true

  const submitRepair = (e) => {
    e.preventDefault()
    const n = note.trim()
    if (!n || repairing) return
    onRepair(n)
    setNote('')
    setOpen(false)
  }

  return (
    <div className="card them-card">
      <div className="card-emotion">
        <span className="emo">{read.emotion || 'unclear'}</span>
        <Intensity value={read.intensity} />
      </div>

      {grounded ? (
        <>
          {read.read && <p className="read-line">{read.read}</p>}
          {read.divergence && (
            <div className="read-sub">
              <span className="k">they likely mean</span>
              {read.divergence}
            </div>
          )}
          {read.because && (
            <div className="read-sub">
              <span className="k">because</span>
              {read.because}
            </div>
          )}
        </>
      ) : (
        <p className="learning-note">
          {read.read
            ? read.read
            : `Aida is still learning how they write — not enough yet to read this with confidence.`}
        </p>
      )}

      {read.reasoning ? (
        <details className="reasoning">
          <summary>How Aida got here</summary>
          <div className="body">{read.reasoning}</div>
        </details>
      ) : null}

      <div className="repair">
        {open ? (
          <form className="repair-form" onSubmit={submitRepair}>
            <input
              className="input"
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did they actually mean?"
              aria-label="Tell Aida what they actually meant"
            />
            <button className="btn btn-sm" type="submit" disabled={!note.trim() || repairing}>
              {repairing ? '…' : 'Tell'}
            </button>
          </form>
        ) : repairing ? (
          <Working label="rethinking…" />
        ) : (
          <button type="button" className="repair-open" onClick={() => setOpen(true)}>
            Tell Aida if this is off
          </button>
        )}
      </div>
    </div>
  )
}
