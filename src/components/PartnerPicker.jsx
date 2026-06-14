import { useState } from 'react'
import { initials, Working } from './Bits.jsx'
import { FAMILIES } from '../emotions.js'
import { notify } from '../toast.js'

// Landing view: pick a person, or add a new one by pasting a few of their past
// messages (seed → baseline). Familiar, quiet, no dashboard.
export default function PartnerPicker({ partners, loading, error, onOpen, onCreate }) {
  const [name, setName] = useState('')
  const [seed, setSeed] = useState('')
  const [creating, setCreating] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n || creating) return
    setCreating(true)
    const seedMessages = seed
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    try {
      await onCreate(n, seedMessages)
      setName('')
      setSeed('')
    } catch (err) {
      notify('Couldn’t add this person just now — please try again.', { type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="scroll">
      <div className="pad">
        <div className="section-label">Your people</div>

        {loading ? (
          <div className="empty">
            <Working label="loading…" />
          </div>
        ) : error ? (
          <div className="empty">Couldn’t load your people. {error}</div>
        ) : partners.length === 0 ? (
          <div className="empty">
            No one here yet. Add a person below — paste a few of their past
            messages so Aida can learn how they write.
          </div>
        ) : (
          <ul className="partner-list">
            {partners.map((p) => (
              <li key={p.id}>
                <button className="partner-row" onClick={() => onOpen(p.id)}>
                  <span className="avatar" aria-hidden="true">
                    {initials(p.name)}
                  </span>
                  <span className="partner-meta">
                    <span className="pname">{p.name}</span>
                    <span className="pinfo">
                      {p.hasBaseline ? 'baseline learned' : 'still learning'}
                      {typeof p.messageCount === 'number' && p.messageCount > 0
                        ? ` · ${p.messageCount} message${p.messageCount === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="divider-text">Add a person</div>

        <form className="stack" onSubmit={submit}>
          <label className="field">
            <span className="field-label">Their name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              autoComplete="off"
            />
          </label>

          <label className="field">
            <span className="field-label">A few of their past messages (one per line)</span>
            <textarea
              className="textarea"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder={'hey, running 10 late\nno worries at all!!\nok.'}
            />
            <span className="hint" style={{ marginTop: 6, display: 'block' }}>
              Optional, but it helps. Aida reads each new message as a shift from
              how they normally write.
            </span>
          </label>

          <button className="btn btn-primary btn-block" type="submit" disabled={!name.trim() || creating}>
            {creating ? 'Learning how they write…' : 'Add person'}
          </button>
        </form>

        <details className="legend">
          <summary>What the colours mean</summary>
          <ul>
            {Object.values(FAMILIES).map((f) => (
              <li key={f.label}>
                <span className="swatch" style={{ background: f.color }} aria-hidden="true" />
                {f.label}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}
