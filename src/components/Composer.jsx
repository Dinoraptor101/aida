import { useState } from 'react'
import { Intensity, Working } from './Bits.jsx'

// The composer with a Them / Me segmented toggle.
//  - THEM (receive): submit a message you RECEIVED → parent calls /receive.
//  - ME (send): [Check Emotion] → mirror; gate decides if [Approve] unlocks;
//    [Rewrite] holds you in a "what did you mean?" loop until safe.
//
// UI GATE RULE: [Approve] shows ONLY when the latest Check.safe === true.
export default function Composer({ onReceive, onCheck, onRewrite, onSend }) {
  const [mode, setMode] = useState('them') // 'them' | 'me'
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false) // 'reading' | 'checking' | 'rewriting' | 'sending' | false
  const [error, setError] = useState('')

  // ME-mode draft state.
  const [check, setCheck] = useState(null) // latest Check for the current draft
  const [intent, setIntent] = useState('')
  const [showIntent, setShowIntent] = useState(false)

  const switchMode = (m) => {
    if (m === mode) return
    setMode(m)
    setText('')
    setError('')
    resetDraft()
  }

  const resetDraft = () => {
    setCheck(null)
    setIntent('')
    setShowIntent(false)
  }

  // Any edit to the draft invalidates a prior check (so the gate can't go stale).
  const onText = (v) => {
    setText(v)
    if (check) resetDraft()
    if (error) setError('')
  }

  // THEM — receive an incoming message.
  const submitReceive = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || busy) return
    setBusy('reading')
    setError('')
    try {
      await onReceive(t)
      setText('')
    } catch (err) {
      setError(err.message || 'Aida couldn’t read that just now.')
    } finally {
      setBusy(false)
    }
  }

  // ME — mirror what the draft carries (and gate it).
  const doCheck = async () => {
    const t = text.trim()
    if (!t || busy) return
    setBusy('checking')
    setError('')
    try {
      const c = await onCheck(t)
      setCheck(c)
      if (c && c.safe === false) setShowIntent(false)
    } catch (err) {
      setError(err.message || 'Aida couldn’t check that just now.')
    } finally {
      setBusy(false)
    }
  }

  // ME — rewrite toward stated intent, then re-check (loop until safe).
  const doRewrite = async (e) => {
    e.preventDefault()
    const t = text.trim()
    const want = intent.trim()
    if (!t || !want || busy) return
    setBusy('rewriting')
    setError('')
    try {
      const { rewritten, check: c } = await onRewrite(t, want)
      if (rewritten) setText(rewritten)
      setCheck(c)
      setIntent('')
      if (c && c.safe === true) setShowIntent(false)
    } catch (err) {
      setError(err.message || 'Aida couldn’t rewrite that just now.')
    } finally {
      setBusy(false)
    }
  }

  // ME — approve & send (only reachable when the latest check is safe).
  const doApprove = async () => {
    const t = text.trim()
    if (!t || busy || !(check && check.safe === true)) return
    setBusy('sending')
    setError('')
    try {
      await onSend(t)
      setText('')
      resetDraft()
    } catch (err) {
      setError(err.message || 'Couldn’t send just now.')
    } finally {
      setBusy(false)
    }
  }

  const safe = check && check.safe === true
  const unsafe = check && check.safe === false

  return (
    <div className="composer">
      <div className="segmented" role="group" aria-label="Who is this message from">
        <button
          type="button"
          aria-pressed={mode === 'them'}
          onClick={() => switchMode('them')}
        >
          Them
          <span className="seg-hint">a message you got</span>
        </button>
        <button
          type="button"
          aria-pressed={mode === 'me'}
          onClick={() => switchMode('me')}
        >
          Me
          <span className="seg-hint">a message you’re sending</span>
        </button>
      </div>

      {mode === 'them' ? (
        <form onSubmit={submitReceive}>
          <div className="composer-row">
            <textarea
              className="textarea"
              value={text}
              onChange={(e) => onText(e.target.value)}
              placeholder="Paste what they sent you…"
              rows={1}
              disabled={busy === 'reading'}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!text.trim() || busy === 'reading'}
            >
              {busy === 'reading' ? 'Reading…' : 'Read'}
            </button>
          </div>
          {busy === 'reading' && (
            <div style={{ marginTop: 9 }}>
              <Working label="Aida is reading this for you…" />
            </div>
          )}
          {error && <div className="inline-error">{error}</div>}
        </form>
      ) : (
        <div>
          <textarea
            className="textarea"
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder="Write what you want to send…"
            rows={2}
            disabled={busy === 'sending'}
          />

          {/* Mirror panel — what the draft carries; the gate's verdict. */}
          {check && (
            <div className={`mirror ${safe ? 'safe' : 'alarm'}`} role={unsafe ? 'alert' : undefined}>
              <div className="card-emotion" style={{ marginBottom: 8 }}>
                <span className="emo">{check.emotion || '—'}</span>
                <Intensity value={check.intensity} />
              </div>
              {check.mirror && <p className="mirror-line">{check.mirror}</p>}

              {safe && (
                <span className="settled">
                  <span className="cue-dot" aria-hidden="true" />
                  This reads the way you mean it.
                </span>
              )}

              {unsafe && (
                <>
                  {check.warning && <p className="warn">{check.warning}</p>}
                  {check.reframe && (
                    <div className="reframe">
                      <span className="k">a softer way</span>
                      {check.reframe}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Rewrite loop — only when held by the gate (and opened). */}
          {unsafe && showIntent && (
            <form className="rewrite" onSubmit={doRewrite}>
              <label className="field-label" htmlFor="intent">
                What did you mean to say?
              </label>
              <div className="rewrite-row">
                <textarea
                  id="intent"
                  className="textarea"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="e.g. I’m frustrated about the deadline, not at you"
                  rows={2}
                  autoFocus
                  disabled={busy === 'rewriting'}
                />
                <button
                  className="btn btn-primary btn-sm"
                  type="submit"
                  disabled={!intent.trim() || busy === 'rewriting'}
                >
                  {busy === 'rewriting' ? '…' : 'Rewrite'}
                </button>
              </div>
            </form>
          )}

          {/* Working cue for me-mode actions. */}
          {(busy === 'checking' || busy === 'rewriting' || busy === 'sending') && (
            <div style={{ marginTop: 10 }}>
              <Working
                label={
                  busy === 'checking'
                    ? 'Aida is checking how this lands…'
                    : busy === 'rewriting'
                    ? 'Aida is rewriting in your voice…'
                    : 'Sending…'
                }
              />
            </div>
          )}

          {error && <div className="inline-error">{error}</div>}

          {/* Actions. */}
          <div className="composer-actions">
            {!check && (
              <button
                className="btn"
                type="button"
                onClick={doCheck}
                disabled={!text.trim() || busy === 'checking'}
              >
                Check emotion
              </button>
            )}

            {check && (
              <button
                className="btn"
                type="button"
                onClick={doCheck}
                disabled={!text.trim() || !!busy}
              >
                Re-check
              </button>
            )}

            {/* GATE: Approve only when latest check is safe. */}
            {safe && (
              <button
                className="btn btn-primary"
                type="button"
                onClick={doApprove}
                disabled={!!busy}
              >
                {busy === 'sending' ? 'Sending…' : 'Approve & send'}
              </button>
            )}

            {/* Held by the gate → the path forward is Rewrite. */}
            {unsafe && !showIntent && (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setShowIntent(true)}
                disabled={!!busy}
              >
                Rewrite
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
