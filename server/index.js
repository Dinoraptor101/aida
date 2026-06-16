// Aida server — serves the built app and the JSON API on one port.
import 'dotenv/config'
import express from 'express'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import {
  deriveBaseline,
  readIncoming,
  checkOutgoing,
  rewriteToIntent,
  readSelf,
  applyRepair,
  synthesizePerspective,
} from './ai.js'
import * as store from './store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '256kb' }))

const ok = (res, data) => res.json(data)
const fail = (res, e, code = 500) => res.status(code).json({ error: String(e?.message || e) })
const need = (res, p) => (p ? false : (fail(res, 'partner not found', 404), true))

// Graceful fallbacks — if an Opus call ultimately fails (after SDK retries), the
// user must NEVER see a raw error. Return a humble, usable response instead.
const FALLBACK = {
  read: () => ({
    emotion: 'unclear', family: null, intensity: 0.5, grounded: false,
    chargedSpan: '', read: "Aida couldn't read this one just now — please try again in a moment.",
    because: '', divergence: '', notes: [],
  }),
  check: () => ({
    emotion: '', family: null, intensity: 0.5,
    mirror: "Aida couldn't check this one just now — send it with care.",
    safe: true, warning: '', reframe: '',
  }),
  perspective: () => ({
    grounded: false, error: true, selfView: '', yourView: '', gap: '', theyKnow: [],
  }),
}

const MODEL = process.env.AIDA_MODEL || 'claude-opus-4-5-20250514'

// A1 — live URL responds.
app.get('/api/health', (_req, res) => ok(res, { ok: true, service: 'aida', model: MODEL }))

// The per-person model.
app.get('/api/partners', (_req, res) => ok(res, store.listPartners()))

app.get('/api/partners/:id', (req, res) => {
  const p = store.getPartner(req.params.id)
  if (need(res, p)) return
  ok(res, p)
})

// PERSPECTIVE — the persistent per-person theory-of-mind, synthesized on demand
// from the stored baseline + bank (no per-message cost). Powers the
// "What Aida knows about [Person]" panel; leads with the gap between two minds.
app.get('/api/partners/:id/perspective', async (req, res) => {
  try {
    const p = store.getPartner(req.params.id)
    if (need(res, p)) return
    ok(res, await synthesizePerspective(p))
  } catch (e) {
    console.error('[aida] perspective failed:', e?.message)
    ok(res, FALLBACK.perspective())
  }
})

// Create a partner; seed their baseline from pasted past messages if provided.
app.post('/api/partners', async (req, res) => {
  try {
    const { name, seedMessages } = req.body || {}
    if (!name) return fail(res, 'name required', 400)
    const p = store.createPartner(name)
    const seeds = Array.isArray(seedMessages) ? seedMessages.map((s) => String(s).trim()).filter(Boolean) : []
    if (seeds.length) {
      try {
        const baseline = await deriveBaseline(name, seeds)
        store.setBaseline(p.id, baseline)
      } catch (e) {
        console.error('[aida] baseline failed (partner kept, cold-start):', e?.message)
      }
    }
    ok(res, store.getPartner(p.id))
  } catch (e) {
    fail(res, e)
  }
})

// RECEIVE — the core read. Persists message + read; notes flow into the bank.
app.post('/api/partners/:id/receive', async (req, res) => {
  try {
    const p = store.getPartner(req.params.id)
    if (need(res, p)) return
    const { text } = req.body || {}
    if (!text) return fail(res, 'text required', 400)
    const read = await readIncoming(p, text, store.recentHistory(p.id))
    store.appendIncoming(p.id, { text, read })
    ok(res, read)
  } catch (e) {
    console.error('[aida] receive failed:', e?.message)
    ok(res, FALLBACK.read())
  }
})

// SEND — mirror the draft's emotion and gate it (the one deliberate alarm).
app.post('/api/partners/:id/check', async (req, res) => {
  try {
    const p = store.getPartner(req.params.id)
    if (need(res, p)) return
    const { draft } = req.body || {}
    if (!draft) return fail(res, 'draft required', 400)
    ok(res, await checkOutgoing(p, draft))
  } catch (e) {
    console.error('[aida] check failed:', e?.message)
    ok(res, FALLBACK.check())
  }
})

// SEND — rewrite the draft to match the user's stated intent, then re-check.
app.post('/api/partners/:id/rewrite', async (req, res) => {
  try {
    const p = store.getPartner(req.params.id)
    if (need(res, p)) return
    const { draft, intent } = req.body || {}
    if (!draft || !intent) return fail(res, 'draft and intent required', 400)
    ok(res, await rewriteToIntent(p, draft, intent))
  } catch (e) {
    console.error('[aida] rewrite failed:', e?.message)
    ok(res, { rewritten: (req.body && req.body.draft) || '', check: FALLBACK.check() })
  }
})

// SEND — record an approved outgoing message; notes flow into the bank.
app.post('/api/partners/:id/send', (req, res) => {
  const p = store.getPartner(req.params.id)
  if (need(res, p)) return
  const { text } = req.body || {}
  if (!text) return fail(res, 'text required', 400)
  // Record + respond INSTANTLY — sending must never wait on an Opus call.
  ok(res, store.appendSent(p.id, { text, notes: [] }))
  // Derive the emotional note for the bank in the BACKGROUND (bi-directional memory).
  readSelf(p, text)
    .then((notes) => {
      if (notes && notes.length) store.addNotes(p.id, notes)
    })
    .catch((e) => console.error('[aida] background readSelf failed:', e?.message))
})

// REPAIR (4th-wall) — apply the user's correction to the last incoming read.
app.post('/api/partners/:id/repair', async (req, res) => {
  try {
    const p = store.getPartner(req.params.id)
    if (need(res, p)) return
    const { note } = req.body || {}
    if (!note) return fail(res, 'note required', 400)
    const last = store.lastIncoming(p.id)
    if (!last) return fail(res, 'no incoming message to repair', 400)
    const read = await applyRepair(p, last.text, note)
    store.updateLastRead(p.id, read)
    ok(res, { ok: true, read })
  } catch (e) {
    console.error('[aida] repair failed:', e?.message)
    const prev = store.lastIncoming(req.params.id)
    ok(res, { ok: false, read: (prev && prev.read) || FALLBACK.read() })
  }
})

// Serve the built SPA in production.
const dist = join(__dirname, '..', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')))
}

const port = process.env.PORT || 8787
app.listen(port, () => console.log(`Aida server on :${port} (model ${MODEL})`))
