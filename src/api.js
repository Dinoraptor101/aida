// Thin client for the Aida API — implements the same-origin JSON contract.
// Field names are EXACT per the build contract. The server is owned by other
// agents; this client is the integration surface the UI depends on.
//
// Types (for reference):
//   Note     = { emotion, intensity(0..1), context, source:"them"|"me" }
//   Baseline = { summary, markers[], baselineTone }
//   Read     = { emotion, intensity, grounded, chargedSpan, read, because, divergence, reasoning? }
//   Check    = { emotion, intensity, mirror, safe, warning, reframe }
//   Perspective = { grounded, selfView, yourView, gap, theyKnow[] }  (the persistent ToM)
//   Message  = { id, from:"them"|"me", text, read?, at }
//   Partner  = { id, name, baseline|null, bank[], thread[] }

const j = async (r) => {
  let data = null
  try {
    data = await r.json()
  } catch {
    // Non-JSON response (e.g. an HTML error page) — surface a clean message.
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
    throw new Error('Unexpected response from the server.')
  }
  if (!r.ok) throw new Error((data && data.error) || r.statusText)
  return data
}

const post = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(j)

export const api = {
  // GET /api/health -> { ok:true, model:string }
  health: () => fetch('/api/health').then(j),

  // GET /api/partners -> [{ id, name, hasBaseline, messageCount }]
  partners: () => fetch('/api/partners').then(j),

  // POST /api/partners {name, seedMessages?} -> Partner
  createPartner: (name, seedMessages) =>
    post('/api/partners', { name, seedMessages }),

  // GET /api/partners/:id -> Partner (full: includes bank[] and thread[])
  partner: (id) => fetch(`/api/partners/${id}`).then(j),

  // GET /api/partners/:id/perspective -> Perspective
  // The persistent theory-of-mind, synthesized on demand from baseline + bank
  // (ToM, not sentiment). No per-message cost — derived only when the panel opens.
  perspective: (id) => fetch(`/api/partners/${id}/perspective`).then(j),

  // POST /api/partners/:id/receive {text} -> Read
  // Server appends the incoming message + read to thread and notes to bank.
  receive: (id, text) => post(`/api/partners/${id}/receive`, { text }),

  // POST /api/partners/:id/check {draft} -> Check
  check: (id, draft) => post(`/api/partners/${id}/check`, { draft }),

  // POST /api/partners/:id/rewrite {draft, intent} -> { rewritten, check }
  rewrite: (id, draft, intent) =>
    post(`/api/partners/${id}/rewrite`, { draft, intent }),

  // POST /api/partners/:id/send {text} -> Message (record my approved sent message)
  send: (id, text) => post(`/api/partners/${id}/send`, { text }),

  // POST /api/partners/:id/repair {note} -> { ok:true, read:Read }
  // Applies my correction to the most-recent incoming read.
  repair: (id, note) => post(`/api/partners/${id}/repair`, { note }),
}

export default api
