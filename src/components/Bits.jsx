// Tiny shared presentational bits. Kept deliberately small — each earns its place.

// Render message text with the charged span softly marked. If the span isn't
// found verbatim (or is empty), the text renders plain — no false marker.
export function MarkedText({ text, span }) {
  if (!span) return text
  const i = text.indexOf(span)
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="charged">{span}</mark>
      {text.slice(i + span.length)}
    </>
  )
}

// A small, gentle intensity bar. Not a score, not a gauge — a felt weight.
export function Intensity({ value }) {
  const v = Math.max(0, Math.min(1, Number(value) || 0))
  const pct = Math.round(v * 100)
  // A felt weight in words, never a clinical score (no "0.82").
  const word = v < 0.3 ? 'faint' : v < 0.55 ? 'mild' : v < 0.75 ? 'moderate' : v < 0.9 ? 'strong' : 'intense'
  return (
    <span className="intensity" aria-label={`intensity: ${word}`}>
      <span className="meter">
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className="intensity-word">{word}</span>
    </span>
  )
}

// The quiet "working" cue used while Opus reads/checks (2–5s). No spinner.
export function Working({ label }) {
  return (
    <span className="working">
      <span className="dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {label}
    </span>
  )
}

// Initials for the wabi-sabi avatar.
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '·'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
