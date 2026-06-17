import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatBank, cleanNotes, cleanFamily } from '../server/ai.js'

// formatBank turns a partner's emotional bank into prompt lines. It's the one
// place the note format is defined, shared by the read, the send-gate, and the
// perspective panel — so its shape can't be allowed to drift.

test('formatBank renders one line per note: emotion(intensity) — context', () => {
  const out = formatBank([
    { emotion: 'warmth', intensity: 0.7, context: 'thanked you first' },
  ])
  assert.equal(out, 'warmth(0.7) — thanked you first')
})

test('formatBank joins multiple notes with newlines, in order', () => {
  const out = formatBank([
    { emotion: 'calm', intensity: 0.4, context: 'short reply' },
    { emotion: 'joy', intensity: 0.9, context: 'made a plan' },
  ])
  assert.equal(out, 'calm(0.4) — short reply\njoy(0.9) — made a plan')
})

test('formatBank keeps only the most recent `limit` notes (the tail)', () => {
  const bank = Array.from({ length: 10 }, (_, i) => ({
    emotion: `e${i}`, intensity: 0.5, context: `c${i}`,
  }))
  const out = formatBank(bank, { limit: 3 })
  assert.equal(out.split('\n').length, 3)
  assert.match(out, /e7\(.*e8\(.*e9\(/s) // the last three, not the first
})

test('formatBank withSource prefixes each note with its direction', () => {
  const out = formatBank(
    [
      { emotion: 'hurt', intensity: 0.6, context: 'went quiet', source: 'them' },
      { emotion: 'pride', intensity: 0.8, context: 'owned it', source: 'me' },
    ],
    { withSource: true }
  )
  assert.equal(out, 'them→you: hurt(0.6) — went quiet\nyou→them: pride(0.8) — owned it')
})

test('formatBank is graceful on empty / missing bank', () => {
  assert.equal(formatBank([]), '')
  assert.equal(formatBank(undefined), '')
  assert.equal(formatBank(null), '')
})

// cleanNotes clamps and shapes whatever the model returns into storable notes.

test('cleanNotes clamps intensity into 0..1 and stamps the source', () => {
  const out = cleanNotes(
    [
      { emotion: 'Anger', intensity: 5, context: 'too hot' },
      { emotion: 'calm', intensity: -2, context: 'too cold' },
    ],
    'them'
  )
  assert.equal(out[0].intensity, 1)
  assert.equal(out[1].intensity, 0)
  assert.equal(out[0].source, 'them')
  assert.equal(out[0].emotion, 'anger') // lowercased
})

test('cleanNotes defaults a non-numeric intensity to 0.5', () => {
  const [n] = cleanNotes([{ emotion: 'unsure', intensity: 'lots', context: '' }], 'me')
  assert.equal(n.intensity, 0.5)
})

test('cleanNotes drops entries without an emotion and caps at 4', () => {
  const arr = [
    { emotion: '', context: 'no feeling' },
    { context: 'also none' },
    ...Array.from({ length: 6 }, () => ({ emotion: 'joy', intensity: 0.5, context: 'x' })),
  ]
  const out = cleanNotes(arr, 'me')
  assert.equal(out.length, 4)
  assert.ok(out.every((n) => n.emotion === 'joy'))
})

test('cleanNotes returns [] for non-array input', () => {
  assert.deepEqual(cleanNotes(null, 'me'), [])
  assert.deepEqual(cleanNotes(undefined, 'me'), [])
  assert.deepEqual(cleanNotes('nope', 'me'), [])
})

// cleanFamily gates the model's family tag to the 10 known families, or null.

test('cleanFamily accepts a known family, case/space-insensitive', () => {
  assert.equal(cleanFamily('joy'), 'joy')
  assert.equal(cleanFamily('  Determination '), 'determination')
})

test('cleanFamily returns null for an unknown or empty family', () => {
  assert.equal(cleanFamily('melancholy'), null)
  assert.equal(cleanFamily(''), null)
  assert.equal(cleanFamily(undefined), null)
})
