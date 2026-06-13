// The Aida reasoning engine. Opus 4.8 turns text into structured EMOTIONAL NOTES
// and reads each message as a deviation from a specific person's baseline —
// theory-of-mind, not flat sentiment. The functional emotions are the product.
//
// LAW: build fresh, borrow nothing. No external emotion taxonomy. The
// representation (emotion + intensity + felt-sense context) is invented here.
//
// Everything speaks tentatively and relationally ("reads as…", "for them this is
// unusual"), never verdicts. Cold start → explicit humility.

import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.AIDA_MODEL || 'claude-opus-4-8'

let _client = null
function client() {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

// Pull the first balanced JSON object out of a text blob.
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  if (start === -1) throw new Error('no JSON object in model output')
  let depth = 0
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1))
    }
  }
  throw new Error('unbalanced JSON in model output')
}

async function callJson({ system, user, maxTokens = 900 }) {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  })
  let thinking = ''
  let text = ''
  for (const block of res.content) {
    if (block.type === 'thinking') thinking += block.thinking
    else if (block.type === 'text') text += block.text
  }
  return { json: extractJson(text), thinking: thinking.trim() }
}

const ACCESS =
  `Aida is an accessibility tool — "closed-captions for emotional subtext" — for ` +
  `people who cannot perceive emotional tone in writing (neurodivergent spectrum). ` +
  `It is NOT therapy, diagnosis, or personality-typing; it translates communication.`

// Clamp + shape a note the model returns.
function cleanNotes(arr, source) {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((n) => n && n.emotion)
    .slice(0, 4)
    .map((n) => ({
      emotion: String(n.emotion).toLowerCase().slice(0, 24),
      intensity: Math.max(0, Math.min(1, Number(n.intensity) || 0.5)),
      context: String(n.context || '').slice(0, 240),
      source,
    }))
}

// ── Learn the person ───────────────────────────────────────────────────────
export async function deriveBaseline(name, messages) {
  const sample = messages.map((m, i) => `${i + 1}. "${m}"`).join('\n')
  const system =
    `${ACCESS}\n\nYou are learning how ONE person, ${name}, communicates IN WRITING ` +
    `with the user, so their future messages can be read as deviations from this ` +
    `baseline. Describe only observable writing style — not their personality.\n\n` +
    `Return ONLY JSON: {"summary":"<2 sentences: warmth, directness, punctuation, ` +
    `emoji, length>","markers":["<short habit>","..."],"baselineTone":"<1-2 words>"}`
  const user = `Past messages from ${name}:\n${sample}\n\nLearn ${name}'s baseline.`
  const { json } = await callJson({ system, user, maxTokens: 600 })
  return {
    summary: String(json.summary || '').slice(0, 600),
    markers: Array.isArray(json.markers) ? json.markers.slice(0, 6) : [],
    baselineTone: String(json.baselineTone || '').slice(0, 40),
  }
}

// ── RECEIVE: read an incoming message, grounded in the person ──────────────
export async function readIncoming(partner, text, history = []) {
  const hasBaseline = !!(partner?.baseline?.summary)
  const bankNote = (partner?.bank || [])
    .slice(-6)
    .map((n) => `${n.emotion}(${n.intensity}) — ${n.context}`)
    .join('\n')
  const ctx = hasBaseline
    ? `BASELINE for ${partner.name}:\n${partner.baseline.summary}\n` +
      `Resting tone: ${partner.baseline.baselineTone || '—'}\n` +
      `Habits: ${(partner.baseline.markers || []).join('; ') || '—'}\n` +
      (bankNote ? `\nEmotional history (recent notes):\n${bankNote}` : '')
    : `You have NO baseline for ${partner?.name || 'this person'} — COLD START.`
  const recent = history.length
    ? `\n\nRecent thread:\n${history.map((h) => `${h.from}: "${h.text}"`).join('\n')}`
    : ''
  const system =
    `${ACCESS}\n\nRead the NEW incoming message as a DEVIATION from this person's ` +
    `baseline (theory-of-mind), not flat sentiment. The user's default failure is to ` +
    `read ambiguity as a THREAT; replace that with a grounded read.\n\n` +
    `RULES:\n` +
    `- Tentative, relational: "reads as…", "for ${partner?.name || 'them'} this is unusual…". NEVER "she is angry".\n` +
    `- Ground in the baseline/deviation; name WHAT shifted vs normal.\n` +
    `- "divergence" = a light theory-of-mind line: how THEY likely see it vs how the user might read it ("they likely mean X, though it may read as Y").\n` +
    `- COLD START → grounded:false; say you're still learning how they write; cautious generic read only.\n` +
    `- Prefer honest uncertainty over a confident wrong read.\n` +
    `- "notes" = 1-3 emotional notes to store (the felt emotions in their message).\n\n` +
    `Return ONLY JSON: {"emotion":"<1-2 words>","intensity":<0..1>,"grounded":<bool>,` +
    `"chargedSpan":"<exact substring carrying most signal, or "">",` +
    `"read":"<one tentative relational sentence>","because":"<short: what deviates from baseline, or why unsure>",` +
    `"divergence":"<the light ToM line>",` +
    `"notes":[{"emotion":"<word>","intensity":<0..1>,"context":"<short quote/why>"}]}`
  const user = `${ctx}${recent}\n\nNEW incoming message from ${partner?.name || 'them'}:\n"${text}"\n\nRead it.`
  const { json, thinking } = await callJson({ system, user, maxTokens: 1000, think: hasBaseline })
  return {
    emotion: String(json.emotion || 'unclear').slice(0, 24),
    intensity: Math.max(0, Math.min(1, Number(json.intensity) || 0.5)),
    grounded: hasBaseline ? !!json.grounded : false,
    chargedSpan: String(json.chargedSpan || '').slice(0, 200),
    read: String(json.read || '').slice(0, 400),
    because: String(json.because || '').slice(0, 300),
    divergence: String(json.divergence || '').slice(0, 300),
    reasoning: thinking ? thinking.slice(0, 600) : '',
    notes: cleanNotes(json.notes, 'them'),
  }
}

// ── SEND: mirror the emotion of a draft; gate if it would wound ────────────
export async function checkOutgoing(partner, draft) {
  const ctx = partner?.baseline?.summary
    ? `The user is about to send this TO ${partner.name}, who normally writes: ${partner.baseline.summary}`
    : `The user is about to send this message.`
  const system =
    `${ACCESS}\n\nThe user cannot feel how their own words land; their directness is ` +
    `often misread as rudeness. Two jobs:\n` +
    `1) MIRROR the emotion the draft actually carries back to them (so they can check ` +
    `it matches what they meant).\n` +
    `2) GATE: if the draft would genuinely WOUND the recipient (attacks their ` +
    `character/identity, contempt, cruelty), set safe:false with a gentle warning and a ` +
    `reframe that keeps their INTENT without the wound. Bluntness, disagreement, or bad ` +
    `news is NOT a wound — those stay safe:true.\n\n` +
    `Tentative, never scolding. Return ONLY JSON: {"emotion":"<1-2 words>",` +
    `"intensity":<0..1>,"mirror":"<one sentence: the emotion these words carry>",` +
    `"safe":<bool>,"warning":"<if unsafe: one gentle sentence, else "">",` +
    `"reframe":"<if unsafe: a rewrite preserving intent without the wound, else "">"}`
  const user = `${ctx}\n\nDraft:\n"${draft}"\n\nMirror its emotion and gate it.`
  const { json } = await callJson({ system, user, maxTokens: 700 })
  return {
    emotion: String(json.emotion || '').slice(0, 24),
    intensity: Math.max(0, Math.min(1, Number(json.intensity) || 0.5)),
    mirror: String(json.mirror || '').slice(0, 400),
    safe: !!json.safe,
    warning: String(json.warning || '').slice(0, 300),
    reframe: String(json.reframe || '').slice(0, 400),
  }
}

// ── SEND: rewrite a draft to match the user's stated intent, then re-check ──
export async function rewriteToIntent(partner, draft, intent) {
  const system =
    `${ACCESS}\n\nThe user wrote a draft, but it may not carry the emotion they MEANT. ` +
    `Rewrite the draft so it conveys their stated intent cleanly and without wounding ` +
    `the recipient — keep it in the user's own voice, concise. Then mirror the new ` +
    `emotion and gate it.\n\n` +
    `Return ONLY JSON: {"rewritten":"<the rewritten message>","emotion":"<1-2 words>",` +
    `"intensity":<0..1>,"mirror":"<the emotion it now carries>","safe":<bool>,` +
    `"warning":"<if still unsafe, else "">","reframe":"<if still unsafe, else "">"}`
  const user = `Draft: "${draft}"\n\nWhat the user actually means: "${intent}"\n\nRewrite to match the intent, then check.`
  const { json } = await callJson({ system, user, maxTokens: 800 })
  return {
    rewritten: String(json.rewritten || draft).slice(0, 600),
    check: {
      emotion: String(json.emotion || '').slice(0, 24),
      intensity: Math.max(0, Math.min(1, Number(json.intensity) || 0.5)),
      mirror: String(json.mirror || '').slice(0, 400),
      safe: !!json.safe,
      warning: String(json.warning || '').slice(0, 300),
      reframe: String(json.reframe || '').slice(0, 400),
    },
  }
}

// ── Derive the emotional note(s) my own sent message carries (bi-directional) ─
export async function readSelf(partner, text) {
  const system =
    `${ACCESS}\n\nName the emotion(s) the user's OWN message carries, to store in the ` +
    `relationship's emotional history (the impression they are leaving). Return ONLY ` +
    `JSON: {"notes":[{"emotion":"<word>","intensity":<0..1>,"context":"<short why>"}]}`
  const user = `The user just sent ${partner?.name || 'them'}: "${text}"\n\nWhat emotion does it carry?`
  try {
    const { json } = await callJson({ system, user, maxTokens: 400 })
    return cleanNotes(json.notes, 'me')
  } catch {
    return []
  }
}

// ── Repair (4th-wall): apply the user's correction to the last incoming read ─
export async function applyRepair(partner, lastMessageText, note) {
  const system =
    `${ACCESS}\n\nThe user is CORRECTING Aida's read of a message they received — they ` +
    `know this person better. Treat the correction as authoritative and produce a ` +
    `revised read that honors it, plus updated emotional notes.\n\n` +
    `Return ONLY JSON: {"emotion":"<1-2 words>","intensity":<0..1>,"grounded":true,` +
    `"chargedSpan":"","read":"<revised tentative read>","because":"<now reflecting the user's correction>",` +
    `"divergence":"<updated light ToM line>","notes":[{"emotion":"<word>","intensity":<0..1>,"context":"<why>"}]}`
  const user =
    `Message ${partner?.name || 'they'} sent: "${lastMessageText}"\n\n` +
    `The user's correction: "${note}"\n\nRevise the read accordingly.`
  const { json } = await callJson({ system, user, maxTokens: 700 })
  return {
    emotion: String(json.emotion || '').slice(0, 24),
    intensity: Math.max(0, Math.min(1, Number(json.intensity) || 0.5)),
    grounded: true,
    chargedSpan: String(json.chargedSpan || '').slice(0, 200),
    read: String(json.read || '').slice(0, 400),
    because: String(json.because || '').slice(0, 300),
    divergence: String(json.divergence || '').slice(0, 300),
    reasoning: '',
    notes: cleanNotes(json.notes, 'them'),
  }
}
