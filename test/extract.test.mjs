import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractJson, cleanEmotion } from '../server/ai.js'

// extractJson is the load-bearing parse between Opus and the app — if it's
// brittle, reads come back blank. These pin its real-world cases.

test('reads a bare JSON object', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 })
})

test('reads a ```json fenced block', () => {
  assert.deepEqual(extractJson('```json\n{"a":2}\n```'), { a: 2 })
})

test('reads an object embedded in prose', () => {
  assert.deepEqual(
    extractJson('Here you go: {"emotion":"calm","intensity":0.4} — hope that helps'),
    { emotion: 'calm', intensity: 0.4 }
  )
})

test('handles nested braces correctly', () => {
  assert.deepEqual(extractJson('{"a":{"b":2},"c":[1,2]}'), { a: { b: 2 }, c: [1, 2] })
})

test('throws when there is no JSON object', () => {
  assert.throws(() => extractJson('no json here'))
})

test('reads a bare ``` fenced block (no json language tag)', () => {
  assert.deepEqual(extractJson('```\n{"a":3}\n```'), { a: 3 })
})

test('returns the first complete object when more text trails it', () => {
  assert.deepEqual(extractJson('{"a":1} {"b":2}'), { a: 1 })
})

test('throws on an unbalanced/truncated object', () => {
  assert.throws(() => extractJson('{"a":1, "b":'))
})

test('cleanEmotion drops trailing meta and trims', () => {
  assert.equal(cleanEmotion('alarm, intensity'), 'alarm')
  assert.equal(cleanEmotion('frustration (mild)'), 'frustration')
  assert.equal(cleanEmotion('  warm pride '), 'warm pride')
  assert.equal(cleanEmotion('', 'unclear'), 'unclear')
})
