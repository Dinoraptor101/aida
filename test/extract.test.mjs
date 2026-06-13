import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractJson } from '../server/ai.js'

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
