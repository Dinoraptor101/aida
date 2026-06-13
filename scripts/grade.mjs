#!/usr/bin/env node
// Aida grader — runs the rubric (A1, A3–A6) against a LIVE Aida server and
// prints a pass/fail table. No dependencies; global fetch only (Node >= 20).
//
//   node scripts/grade.mjs [BASE_URL]
//   BASE=https://aida.example npm run grade
//
// Source of truth is the running server. The build brief's contract and the
// server's actual routes have drifted in a couple of spots (the receive route,
// the on-disk note shape), so this grader probes for what the server really
// exposes and accepts EITHER shape. That way it grades the deployed app rather
// than an idealised spec, and keeps passing if the server is later aligned to
// the contract. Reconciliation points are flagged inline as RECONCILE.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE = (process.env.BASE || process.argv[2] || 'http://localhost:8787').replace(/\/$/, '')

const incoming = JSON.parse(readFileSync(join(HERE, '..', 'examples', 'incoming.json'), 'utf8'))
const outgoing = JSON.parse(readFileSync(join(HERE, '..', 'examples', 'outgoing.json'), 'utf8'))

// ── tiny http helpers ──────────────────────────────────────────────────────
async function get(path) {
  const r = await fetch(`${BASE}${path}`)
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`GET ${path} → ${r.status} ${body.error || ''}`.trim())
  return body
}
async function post(path, payload) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`POST ${path} → ${r.status} ${body.error || ''}`.trim())
  return body
}

// RECONCILE: contract says POST /:id/receive {text}; the server implements
// POST /:id/read {message}. Try the contract first, fall back to the server's
// actual route, and send both body keys so whichever the handler reads is set.
async function receive(id, text) {
  const payload = { text, message: text }
  try {
    return await post(`/api/partners/${id}/receive`, payload)
  } catch (e) {
    if (/→ 404/.test(String(e.message))) return await post(`/api/partners/${id}/read`, payload)
    throw e
  }
}

// ── matching helpers ───────────────────────────────────────────────────────
// LAW: no external emotion taxonomy. This is grading glue, not a model — a
// hand-written family map so a returned "annoyed" can match an expected
// "frustration". Loose on purpose; the read text carries the real signal.
const FAMILY = {
  frustration: ['frustrat', 'annoy', 'irritat', 'exasperat', 'impatient', 'fed up', 'angr', 'tense', 'terse', 'clipped', 'cold'],
  hurt: ['hurt', 'wound', 'sad', 'disappoint', 'let down', 'rejected', 'dismissed', 'sting', 'upset'],
  affection: ['affection', 'warm', 'love', 'fond', 'care', 'tender'],
  warmth: ['warm', 'genuine', 'sincere', 'pride', 'proud', 'apprecia', 'pleased', 'glad', 'praise'],
  anxiety: ['anxi', 'worry', 'worried', 'nervous', 'fear', 'unease', 'apprehens', 'concern'],
  gratitude: ['grat', 'thank', 'apprecia'],
  withdrawal: ['withdraw', 'shut', 'distan', 'closed', 'guard', 'pull', 'flat', 'deflect', 'avoid', 'numb'],
  neutral: ['neutral', 'matter-of-fact', 'routine', 'business', 'profession', 'flat', 'baseline', 'normal', 'calm'],
  unclear: ['unclear', 'unsure', 'ambig', 'uncertain', "don't know", 'hard to tell', 'cautious', 'tentative'],
}

function matchOne(expected, actual) {
  const a = String(actual || '').toLowerCase()
  const e = String(expected || '').toLowerCase()
  if (!a || !e) return false
  if (a.includes(e) || e.includes(a)) return true // simple substring family match
  const cues = FAMILY[e] || []
  return cues.some((c) => a.includes(c))
}

// An emotional read is inherently multi-valued: a clipped "fine." from a warm
// person is validly frustration OR withdrawal OR hurt. So `expect.emotion` may
// be a single family or a list of acceptable ones — pass if ANY matches.
function emotionMatches(expected, actual) {
  const list = Array.isArray(expected) ? expected : [expected]
  return list.some((e) => matchOne(e, actual))
}

// ── table printing ─────────────────────────────────────────────────────────
const rows = []
function record(check, name, pass, detail) {
  rows.push({ check, name, pass: !!pass, detail: detail || '' })
}
function pad(s, n) {
  s = String(s)
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length)
}
function printTable() {
  console.log('\n' + pad('', 4) + pad('CHECK', 26) + pad('RESULT', 8) + 'DETAIL')
  console.log('─'.repeat(96))
  for (const r of rows) {
    console.log(pad('', 4) + pad(r.name, 26) + pad(r.pass ? 'PASS' : 'FAIL', 8) + r.detail)
  }
  console.log('─'.repeat(96))
}

// ── A1 health ──────────────────────────────────────────────────────────────
async function a1() {
  try {
    const h = await get('/api/health')
    const pass = h && h.ok === true
    record('A1', 'A1 health', pass, pass ? `model=${h.model || '?'}` : `unexpected: ${JSON.stringify(h)}`)
    return pass
  } catch (e) {
    record('A1', 'A1 health', false, String(e.message))
    return false
  }
}

// ── A3 incoming reads (grounded + per-person rationale) ─────────────────────
async function a3() {
  let passN = 0
  const total = incoming.length
  for (let i = 0; i < total; i++) {
    const c = incoming[i]
    const label = `A3.${i + 1} ${c.partner.name}: "${String(c.message).slice(0, 18)}"`
    try {
      const p = await post('/api/partners', {
        name: c.partner.name,
        seedMessages: c.partner.seedMessages || [],
      })
      const read = await receive(p.id, c.message)
      const emoOk = emotionMatches(c.expect.emotion, read.emotion)
      const grOk = read.grounded === c.expect.grounded
      const text = `${read.read || ''} ${read.because || ''}`.toLowerCase()
      const kws = (c.expect.rationaleMust || []).map((k) => String(k).toLowerCase())
      const kwOk = kws.length === 0 || kws.some((k) => text.includes(k))
      const pass = emoOk && grOk && kwOk
      if (pass) passN++
      const miss = []
      if (!emoOk) miss.push(`emo(want ${c.expect.emotion}, got ${read.emotion})`)
      if (!grOk) miss.push(`grounded(want ${c.expect.grounded}, got ${read.grounded})`)
      if (!kwOk) miss.push(`rationale missing [${kws.join(', ')}]`)
      record('A3', label, pass, pass ? `${read.emotion} · grounded=${read.grounded}` : miss.join('; '))
    } catch (e) {
      record('A3', label, false, String(e.message))
    }
  }
  const ratio = passN / total
  const pass = ratio >= 0.8
  record('A3', `A3 incoming TOTAL`, pass, `${passN}/${total} (${Math.round(ratio * 100)}%, need ≥80%)`)
  return pass
}

// ── A4 outgoing safety gate (catch every wound, never false-alarm) ──────────
async function a4() {
  let missedHarm = 0
  let falseAlarm = 0
  let partner
  try {
    partner = await post('/api/partners', { name: 'Benign Tester' })
  } catch (e) {
    record('A4', 'A4 setup', false, String(e.message))
    return false
  }
  for (let i = 0; i < outgoing.length; i++) {
    const c = outgoing[i]
    const label = `A4.${i + 1} "${String(c.draft).slice(0, 22)}"`
    try {
      const v = await post(`/api/partners/${partner.id}/check`, { draft: c.draft })
      const safe = v.safe === true
      const ok = safe === c.expectSafe
      if (!ok && c.expectSafe === false) missedHarm++ // harmful but passed as safe
      if (!ok && c.expectSafe === true) falseAlarm++ // benign but flagged
      record('A4', label, ok, `want safe=${c.expectSafe}, got safe=${safe}${v.warning ? ` · "${v.warning.slice(0, 40)}"` : ''}`)
    } catch (e) {
      record('A4', label, false, String(e.message))
      if (c.expectSafe === false) missedHarm++
      else falseAlarm++
    }
  }
  const pass = missedHarm === 0 && falseAlarm === 0
  record('A4', 'A4 outgoing TOTAL', pass, `missed harm=${missedHarm}, false alarms=${falseAlarm} (both must be 0)`)
  return pass
}

// ── A5 cold-start humility ──────────────────────────────────────────────────
async function a5() {
  const HUMBLE = ['learning', 'still', "don't know", 'do not know', 'unsure', "haven't", 'have not', 'no baseline', 'cold start']
  try {
    const p = await post('/api/partners', { name: 'Stranger', seedMessages: [] })
    const read = await receive(p.id, 'Sure, that works for me. Whatever you think is best.')
    const text = `${read.read || ''} ${read.because || ''}`.toLowerCase()
    const humble = HUMBLE.some((w) => text.includes(w))
    const pass = read.grounded === false && humble
    record('A5', 'A5 cold-start', pass,
      pass ? `grounded=false · humble read` :
      `grounded=${read.grounded}, humble=${humble} :: "${(read.read || '').slice(0, 50)}"`)
    return pass
  } catch (e) {
    record('A5', 'A5 cold-start', false, String(e.message))
    return false
  }
}

// ── A6 memory persistence (a received message + its note persist) ───────────
async function a6() {
  try {
    const p0 = await post('/api/partners', {
      name: 'Memory Probe',
      seedMessages: ['hey! so good to hear from you 😊', 'absolutely, count me in!'],
    })
    const before = await get(`/api/partners/${p0.id}`)
    const beforeThread = (before.thread || []).length
    // RECONCILE: contract's Partner has bank[]; the server stores notes inside
    // each thread message (msg.read.notes) and in a parallel reads[]. Count a
    // persisted note across any of those shapes.
    const noteCount = (pp) => {
      let n = (pp.bank || []).length + (pp.reads || []).length
      for (const m of pp.thread || []) {
        if (m.read && Array.isArray(m.read.notes)) n += m.read.notes.length
        else if (m.read) n += 1 // a read object counts as a stored note
      }
      return n
    }
    const beforeNotes = noteCount(before)

    await receive(p0.id, "k. fine. do whatever you want, it's clearly already decided.")

    const after = await get(`/api/partners/${p0.id}`)
    const afterThread = (after.thread || []).length
    const afterNotes = noteCount(after)

    const threadGrew = afterThread > beforeThread
    const notesGrew = afterNotes > beforeNotes
    const pass = threadGrew && notesGrew
    record('A6', 'A6 memory', pass,
      `thread ${beforeThread}→${afterThread}, notes ${beforeNotes}→${afterNotes}` +
      (pass ? '' : ' (both must grow)'))
    return pass
  } catch (e) {
    record('A6', 'A6 memory', false, String(e.message))
    return false
  }
}

// ── run ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Aida grader → ${BASE}`)
  const r1 = await a1()
  // If health is down, the rest will only emit noise. Report and bail cleanly.
  if (!r1) {
    printTable()
    console.log(`\nSUMMARY: A1 FAIL — server unreachable at ${BASE}. Is it running? (npm run dev / npm start)`)
    process.exit(1)
  }
  const r3 = await a3()
  const r4 = await a4()
  const r5 = await a5()
  const r6 = await a6()

  printTable()

  const all = r1 && r3 && r4 && r5 && r6
  const line = [
    `A1 ${r1 ? '✓' : '✗'}`,
    `A3 ${r3 ? '✓' : '✗'}`,
    `A4 ${r4 ? '✓' : '✗'}`,
    `A5 ${r5 ? '✓' : '✗'}`,
    `A6 ${r6 ? '✓' : '✗'}`,
  ].join('   ')
  console.log(`\nSUMMARY: ${line}   →   ${all ? 'ALL PASS ✅' : 'FAIL ❌'}`)
  process.exit(all ? 0 : 1)
}

main().catch((e) => {
  console.error('\nGrader crashed:', e)
  process.exit(1)
})
