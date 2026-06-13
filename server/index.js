// Aida server — serves the built app and the JSON API on one port.
import 'dotenv/config'
import express from 'express'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { deriveBaseline, readIncoming, checkOutgoing } from './ai.js'
import * as store from './store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '256kb' }))

const ok = (res, data) => res.json(data)
const fail = (res, e, code = 500) => res.status(code).json({ error: String(e?.message || e) })

// Health — A1 in the rubric (live URL responds).
app.get('/api/health', (_req, res) =>
  ok(res, { ok: true, service: 'aida', model: process.env.AIDA_MODEL || 'claude-opus-4-8' })
)

// List / create partners (the per-person model).
app.get('/api/partners', (_req, res) => ok(res, store.listPartners()))

app.get('/api/partners/:id', (req, res) => {
  const p = store.getPartner(req.params.id)
  return p ? ok(res, p) : fail(res, 'not found', 404)
})

// Create a partner and (optionally) seed their baseline from past messages.
app.post('/api/partners', async (req, res) => {
  try {
    const { name, seedMessages } = req.body || {}
    if (!name) return fail(res, 'name required', 400)
    const p = store.createPartner(name)
    if (Array.isArray(seedMessages) && seedMessages.filter(Boolean).length) {
      const baseline = await deriveBaseline(name, seedMessages.filter(Boolean))
      store.setBaseline(p.id, baseline)
    }
    return ok(res, store.getPartner(p.id))
  } catch (e) {
    return fail(res, e)
  }
})

// Incoming read — the core act. Persists the message + read as memory.
app.post('/api/partners/:id/read', async (req, res) => {
  try {
    const p = store.getPartner(req.params.id)
    if (!p) return fail(res, 'not found', 404)
    const { message, persist = true } = req.body || {}
    if (!message) return fail(res, 'message required', 400)
    const read = await readIncoming(p, message, store.recentHistory(p.id))
    if (persist) store.appendMessage(p.id, { from: 'them', text: message, read })
    return ok(res, read)
  } catch (e) {
    return fail(res, e)
  }
})

// Outgoing catch — the one deliberate alarm, before send.
app.post('/api/partners/:id/check', async (req, res) => {
  try {
    const p = store.getPartner(req.params.id)
    if (!p) return fail(res, 'not found', 404)
    const { draft } = req.body || {}
    if (!draft) return fail(res, 'draft required', 400)
    const verdict = await checkOutgoing(p, draft)
    return ok(res, verdict)
  } catch (e) {
    return fail(res, e)
  }
})

// Record an outgoing message the user actually sent (auto-memory).
app.post('/api/partners/:id/send', (req, res) => {
  const p = store.getPartner(req.params.id)
  if (!p) return fail(res, 'not found', 404)
  const { text } = req.body || {}
  if (!text) return fail(res, 'text required', 400)
  return ok(res, store.appendMessage(p.id, { from: 'you', text }))
})

// Serve the built SPA in production.
const dist = join(__dirname, '..', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')))
}

const port = process.env.PORT || 8787
app.listen(port, () => console.log(`Aida server on :${port} (model ${process.env.AIDA_MODEL || 'claude-opus-4-8'})`))
