// Dead-simple persistence: one JSON file on disk, loaded into memory.
// Survives reloads and restarts within the deploy. Memory is AUTO-persisted on
// every write; there is intentionally NO API to hand-inject a memory (integrity
// rule — manual injection lets false beliefs about a person calcify).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const FILE = join(DATA_DIR, 'store.json')

let db = { partners: {} }

function load() {
  try {
    if (existsSync(FILE)) db = JSON.parse(readFileSync(FILE, 'utf8'))
  } catch {
    db = { partners: {} }
  }
}
function flush() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(db, null, 2))
}
load()

let _seq = Date.now()
const id = () => (++_seq).toString(36)

export function listPartners() {
  return Object.values(db.partners).map((p) => ({
    id: p.id,
    name: p.name,
    hasBaseline: !!(p.baseline && p.baseline.summary),
    messageCount: p.thread.length,
  }))
}

export function getPartner(pid) {
  return db.partners[pid] || null
}

export function createPartner(name) {
  const p = { id: id(), name, baseline: null, thread: [], reads: [] }
  db.partners[p.id] = p
  flush()
  return p
}

export function setBaseline(pid, baseline) {
  const p = db.partners[pid]
  if (!p) return null
  p.baseline = baseline
  flush()
  return p
}

// Append a message to the thread. `read` (if present) is the Aida read for an
// incoming message — auto-persisted as relational memory.
export function appendMessage(pid, { from, text, read = null }) {
  const p = db.partners[pid]
  if (!p) return null
  const msg = { id: id(), from, text, read, at: _seq }
  p.thread.push(msg)
  if (read) p.reads.push({ at: _seq, emotion: read.emotion, read: read.read })
  flush()
  return msg
}

export function recentHistory(pid, n = 6) {
  const p = db.partners[pid]
  if (!p) return []
  return p.thread.slice(-n).map((m) => ({ from: m.from === 'them' ? p.name : 'You', text: m.text }))
}
