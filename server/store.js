// Persistence: one JSON file on disk, mirrored in memory. Survives reloads and
// restarts within the deploy. Memory is AUTO-persisted on every write; there is
// intentionally NO path to hand-inject a bank note (integrity rule — manual
// injection lets false beliefs calcify). Corrections flow through repair, which
// re-reads via the model, not blind insertion.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const FILE = join(DATA_DIR, 'store.json')

let db = { partners: {} }
let _seq = 1700000000000

function load() {
  try {
    if (existsSync(FILE)) db = JSON.parse(readFileSync(FILE, 'utf8'))
  } catch {
    db = { partners: {} }
  }
  // Resume the id counter past anything already stored, so a restart never
  // reuses an id and clobbers an existing partner or message.
  for (const p of Object.values(db.partners)) {
    const n = parseInt(p.id, 36)
    if (Number.isFinite(n) && n > _seq) _seq = n
    for (const m of p.thread || []) if ((m.at || 0) > _seq) _seq = m.at
    for (const b of p.bank || []) if ((b.at || 0) > _seq) _seq = b.at
  }
}
function flush() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(db, null, 2))
}
load()

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
  const p = { id: id(), name: String(name).slice(0, 80), baseline: null, bank: [], thread: [] }
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

function pushNotes(p, notes) {
  if (!Array.isArray(notes)) return
  for (const n of notes) p.bank.push({ ...n, at: ++_seq })
  if (p.bank.length > 100) p.bank = p.bank.slice(-100)
}

// Incoming message + its read; notes (source 'them') flow into the bank.
export function appendIncoming(pid, { text, read }) {
  const p = db.partners[pid]
  if (!p) return null
  const msg = { id: id(), from: 'them', text, read, at: ++_seq }
  p.thread.push(msg)
  if (read && read.notes) pushNotes(p, read.notes)
  flush()
  return msg
}

// My approved outgoing message; notes (source 'me') flow into the bank.
export function appendSent(pid, { text, notes }) {
  const p = db.partners[pid]
  if (!p) return null
  const msg = { id: id(), from: 'me', text, at: ++_seq }
  p.thread.push(msg)
  pushNotes(p, notes)
  flush()
  return msg
}

export function lastIncoming(pid) {
  const p = db.partners[pid]
  if (!p) return null
  for (let i = p.thread.length - 1; i >= 0; i--) if (p.thread[i].from === 'them') return p.thread[i]
  return null
}

// Repair: replace the last incoming message's read and fold in the new notes.
export function updateLastRead(pid, read) {
  const p = db.partners[pid]
  if (!p) return null
  const msg = lastIncoming(pid)
  if (!msg) return null
  msg.read = read
  if (read && read.notes) pushNotes(p, read.notes)
  flush()
  return msg
}

export function recentHistory(pid, n = 6) {
  const p = db.partners[pid]
  if (!p) return []
  return p.thread.slice(-n).map((m) => ({ from: m.from === 'them' ? p.name : 'You', text: m.text }))
}
