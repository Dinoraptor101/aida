import { useState, useEffect } from 'react'
import { Intensity, Working } from './Bits.jsx'
import { emotionStyle } from '../emotions.js'

// The composer with a Them / Me segmented toggle.
//  - THEM (receive): submit a message you RECEIVED → parent calls /receive.
//  - ME (send): [Check Emotion] → mirror; gate decides if [Approve] unlocks;
//    [Rewrite] holds you in a "what did you mean?" loop until safe.
//
// LAYOUT STABILITY: editing the draft never makes panels or buttons disappear —
// that would shift the input vertically and feel jittery. Instead, an edited
// check is marked STALE (the mirror dims, Approve disables), and the action
// buttons live in two fixed slots that only ever enable/disable/relabel.
//
// GATE RULE: [Approve] is enabled ONLY when the latest check is fresh AND safe.
export default function Composer({ onReceive, onCheck, onRewrite, onSend }) {
  const [mode, setMode] = useState('them') // 'them' | 'me'
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false) // 'reading' | 'checking' | 'rewriting' | 'sending' | false
  const [error, setError] = useState('')

  // ME-mode draft state.
  const [check, setCheck] = useState(null) // latest Check for the current draft
  const [stale, setStale] = useState(false) // draft edited since the check → re-check needed
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
    setStale(false)
    setIntent('')
    setShowIntent(false)
  }

  // Editing the draft invalidates a prior check — but we KEEP it on screen and
  // mark it stale, so the composer height doesn't change while typing.
  const onText = (v) => {
    setText(v)
    if (check) setStale(true)
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
      setStale(false)
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
      setStale(false)
      setIntent('')
      if (c && c.safe === true) setShowIntent(false)
    } catch (err) {
      setError(err.message || 'Aida couldn’t rewrite that just now.')
    } finally {
      setBusy(false)
    }
  }

  // ME — approve & send (only reachable when the latest check is fresh + safe).
  const doApprove = async () => {
    const t = text.trim()
    if (!t || busy || !(check && !stale && check.safe === true)) return
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

  const fresh = check && !stale
  const safe = fresh && check.safe === true
  const unsafe = fresh && check.safe === false
  const emo = check ? emotionStyle(check.emotion, check.family) : null

  // Auto re-check: 5s after the last keystroke, when the Me-mode draft is dirty
  // (never checked, or edited since the last check). The manual buttons still
  // give an instant check; this just saves a tap when you pause.
  const autoArmed = mode === 'me' && !!text.trim() && !busy && (!check || stale)
  useEffect(() => {
    if (!autoArmed) return undefined
    const id = setTimeout(() => doCheck(), 5000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoArmed])

  return (
    <div className="composer">
      <div className="segmented" data-mode={mode} role="group" aria-label="Who is this message from">
        <span className="seg-thumb" aria-hidden="true" />
        <button type="button" aria-pressed={mode === 'them'} onClick={() => switchMode('them')}>
          Them
          <span className="seg-hint">a message you got</span>
        </button>
        <button type="button" aria-pressed={mode === 'me'} onClick={() => switchMode('me')}>
          Me
          <span className="seg-hint">a message you’re sending</span>
        </button>
      </div>

      {mode === 'them' ? (
        <form onSubmit={submitReceive}>
          <div className="input-wrap">
            <textarea
              className="textarea"
              value={text}
              onChange={(e) => onText(e.target.value)}
              placeholder="Paste what they sent you…"
              rows={2}
              disabled={busy === 'reading'}
            />
            {busy === 'reading' && (
              <div className="input-status">
                <Working label="Aida is reading this for you…" />
              </div>
            )}
          </div>
          {error && <div className="inline-error">{error}</div>}
          <div className="composer-actions">
            <button className="btn btn-primary" type="submit" disabled={!text.trim() || busy === 'reading'}>
              {busy === 'reading' ? 'Reading…' : 'Read'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="input-wrap">
            <textarea
              className="textarea"
              value={text}
              onChange={(e) => onText(e.target.value)}
              placeholder="Write what you want to send…"
              rows={2}
              disabled={busy === 'sending'}
            />
            {(busy === 'checking' || busy === 'rewriting' || busy === 'sending') && (
              <div className="input-status">
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
          </div>

          {/* Mirror panel — kept on screen once it exists; dims when stale so the
              layout never collapses mid-edit. */}
          {check && (
            <div
              className={`mirror ${check.safe ? 'safe' : 'alarm'} ${stale ? 'stale' : ''}`}
              role={unsafe ? 'alert' : undefined}
              style={emo && emo.color ? { '--emo': emo.color } : undefined}
            >
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

              {stale && <p className="panel-k stale-note">edited — re-checking shortly…</p>}
            </div>
          )}

          {/* Rewrite loop — only when held by a fresh, unsafe gate (and opened). */}
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
                <button className="btn btn-primary btn-sm" type="submit" disabled={!intent.trim() || busy === 'rewriting'}>
                  {busy === 'rewriting' ? '…' : 'Rewrite'}
                </button>
              </div>
            </form>
          )}

          {error && <div className="inline-error">{error}</div>}

          {/* Two FIXED action slots — they only enable/disable/relabel, never
              appear or vanish, so the input never shifts under your cursor. */}
          <div className="composer-actions">
            <button
              className="btn"
              type="button"
              onClick={doCheck}
              disabled={!text.trim() || !!busy}
            >
              {check ? 'Re-check' : 'Check emotion'}
            </button>

            {unsafe && showIntent ? (
              <button
                className="btn"
                type="button"
                onClick={() => setShowIntent(false)}
                disabled={!!busy}
              >
                Cancel
              </button>
            ) : unsafe ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setShowIntent(true)}
                disabled={!!busy}
              >
                Rewrite
              </button>
            ) : (
              <button
                className="btn btn-primary"
                type="button"
                onClick={doApprove}
                disabled={!safe || !!busy}
              >
                {busy === 'sending' ? 'Sending…' : 'Approve & send'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
