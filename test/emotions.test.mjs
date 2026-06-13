import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classify, emotionStyle, FAMILIES } from '../src/emotions.js'

test('classify maps nuanced labels onto the right family', () => {
  assert.equal(classify('withdrawn'), 'sadness')
  assert.equal(classify('frustration'), 'anger')
  assert.equal(classify('cold anger'), 'anger')
  assert.equal(classify('warm pride'), 'joy') // "warm pride" beats "warm"→love
  assert.equal(classify('masked distress'), 'fear')
  assert.equal(classify('calm concern'), 'calm')
  assert.equal(classify('tenderness'), 'love')
  assert.equal(classify('determined'), 'determination')
  assert.equal(classify('contempt'), 'disgust')
  assert.equal(classify('astonished'), 'surprise')
  assert.equal(classify('curious'), 'curiosity')
})

test('classifier covers previously-missed labels (fallback hardening)', () => {
  assert.equal(classify('alarm'), 'fear')
  assert.equal(classify('alarm, intensity'), 'fear')
  assert.equal(classify('uncertain'), 'fear')
  assert.equal(classify('tense'), 'fear')
  assert.equal(classify('dismissive'), 'disgust')
})

test('classify returns null for unknown or empty labels', () => {
  assert.equal(classify('zxqwv'), null)
  assert.equal(classify(''), null)
  assert.equal(classify(undefined), null)
})

test('emotionStyle returns family + label + hex colour for a known emotion', () => {
  const s = emotionStyle('withdrawn')
  assert.equal(s.family, 'sadness')
  assert.equal(s.color, FAMILIES.sadness.color)
  assert.match(s.color, /^#[0-9a-f]{6}$/i)
})

test('emotionStyle prefers an explicit valid family over the text', () => {
  assert.equal(emotionStyle('something vague', 'joy').family, 'joy')
})

test('emotionStyle falls back to classify when the family is invalid', () => {
  assert.equal(emotionStyle('frustration', 'notafamily').family, 'anger')
})

test('emotionStyle returns nulls (graceful) for an unclassifiable label', () => {
  const s = emotionStyle('zxqwv')
  assert.equal(s.family, null)
  assert.equal(s.color, null)
})

test('all 10 families have a 6-digit hex colour and a paired label', () => {
  const keys = Object.keys(FAMILIES)
  assert.equal(keys.length, 10)
  for (const k of keys) {
    assert.match(FAMILIES[k].color, /^#[0-9a-f]{6}$/i, `${k} colour`)
    assert.ok(FAMILIES[k].label.includes('/'), `${k} label is a pair`)
  }
})
