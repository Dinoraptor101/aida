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
    // Resilient defaults: the SDK retries transient errors (429 / 5xx / network)
    // with backoff, and a per-call timeout keeps a hung request from wedging.
    _client = new Anthropic({ apiKey, maxRetries: 4, timeout: 60000 })
  }
  return _client
}

// Pull the first balanced JSON object out of a text blob.
export function extractJson(text) {
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
  // The SDK retries transient API errors; here we also retry a malformed-JSON
  // response once (the model occasionally fences it or trails prose).
  let lastErr
  for (let attempt = 0; attempt < 2; attempt++) {
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
    try {
      return { json: extractJson(text), thinking: thinking.trim() }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
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

// The 10 emotion families (Sofroniew et al., 2026). Opus tags each read with one
// so the UI always has a colour; the client keyword classifier is only a fallback.
const FAMILY_LIST = 'joy, sadness, anger, calm, fear, curiosity, disgust, surprise, love, determination'
const FAMILY_SET = new Set(FAMILY_LIST.split(', '))
function cleanFamily(f) {
  const v = String(f || '').toLowerCase().trim()
  return FAMILY_SET.has(v) ? v : null
}

// First clean feeling word(s) only — drops trailing meta so "alarm, intensity"
// or "frustration (mild)" render as a single tidy label.
export function cleanEmotion(s, fallback = '') {
  return String(s || fallback).split(/[,;(]/)[0].trim().slice(0, 24) || fallback
}

// Format the tail of a partner's emotional bank into prompt lines. `withSource`
// prefixes each note with its direction (you→them / them→you). One place so the
// note format can't drift between the read, the send-gate, and the perspective.
function formatBank(bank, { limit = 6, withSource = false } = {}) {
  return (bank || [])
    .slice(-limit)
    .map((n) => {
      const dir = withSource ? `${n.source === 'me' ? 'you→them' : 'them→you'}: ` : ''
      return `${dir}${n.emotion}(${n.intensity}) — ${n.context}`
    })
    .join('\n')
}

// ── RECEIVE: read an incoming message, grounded in the person ──────────────
export async function readIncoming(partner, text, history = []) {
  const hasBaseline = !!(partner?.baseline?.summary)
  const bankNote = formatBank(partner?.bank)
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
    `- "notes" = 1-3 emotional notes to store (the felt emotions in their message).\n` +
    `- "family" = classify the read into EXACTLY ONE of these 10: ${FAMILY_LIST}.\n\n` +
    `Return ONLY JSON: {"emotion":"<1-2 words>","family":"<one of: ${FAMILY_LIST}>","intensity":<0..1>,"grounded":<bool>,` +
    `"chargedSpan":"<exact substring carrying most signal, or "">",` +
    `"read":"<one tentative relational sentence>","because":"<short: what deviates from baseline, or why unsure>",` +
    `"divergence":"<the light ToM line>",` +
    `"notes":[{"emotion":"<word>","intensity":<0..1>,"context":"<short quote/why>"}]}`
  const user = `${ctx}${recent}\n\nNEW incoming message from ${partner?.name || 'them'}:\n"${text}"\n\nRead it.`
  const { json, thinking } = await callJson({ system, user, maxTokens: 1000, think: hasBaseline })
  return {
    emotion: cleanEmotion(json.emotion, 'unclear'),
    family: cleanFamily(json.family),
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

// ── SEND: mirror the emotion of a draft; gate if it would wound — RELATIVE to
// how THIS person communicates. The same words land differently on different
// people: profanity/bluntness/teasing that matches their register is fine; the
// SAME words to someone whose baseline is gentle or formal can wound. Grounded in
// the per-person baseline + emotional history (theory-of-mind, not a flat rule).
export async function checkOutgoing(partner, draft) {
  const hasBaseline = !!(partner?.baseline?.summary)
  const bankNote = formatBank(partner?.bank)
  const ctx = hasBaseline
    ? `The user is about to send this TO ${partner.name}.\n` +
      `${partner.name}'s baseline:\n${partner.baseline.summary}\n` +
      `Resting tone: ${partner.baseline.baselineTone || '—'}\n` +
      `Habits: ${(partner.baseline.markers || []).join('; ') || '—'}` +
      (bankNote ? `\n\nEmotional history (recent notes):\n${bankNote}` : '')
    : `The user is about to send this message. You have NO baseline for ` +
      `${partner?.name || 'this person'} — COLD START.`
  const system =
    `${ACCESS}\n\nThe user cannot feel how their own words land; their directness is ` +
    `often misread as rudeness. Two jobs:\n` +
    `1) MIRROR the emotion the draft actually carries back to them (so they can check ` +
    `it matches what they meant).\n` +
    `2) GATE — set safe:false in EITHER case:\n` +
    `   (a) it would genuinely WOUND **this specific recipient**, judged RELATIVE to how ` +
    `THEY communicate (the baseline + history above), not a universal standard. Language that ` +
    `MATCHES their own register — profanity, bluntness, teasing, sarcasm they use too — is ` +
    `NOT a wound to them; the SAME words sent to someone whose baseline is gentle or formal ` +
    `CAN wound. Ground the call in their norms. (Attacks on their character/identity, contempt, ` +
    `or cruelty wound almost anyone.) OR\n` +
    `   (b) its literal wording carries an alarming/DANGEROUS connotation (violence, death, ` +
    `self-harm, threats) that likely diverges from the user's benign intent and could be badly ` +
    `misread — e.g. "blood bath" literally reads as violence even if they meant a busy sale day ` +
    `(this holds regardless of the person).\n` +
    `   When unsafe, give a gentle warning and a reframe that keeps their INTENT without the wound ` +
    `or the dangerous misread. For a type-(a) wound when you HAVE a baseline, phrase the "warning" ` +
    `RELATIVE to this person — compare it to how they usually communicate (e.g. "for ${partner?.name || 'them'}, ` +
    `this lands harder than how you two usually talk"), not a generic "this is harsh"; on cold start keep the ` +
    `warning generic. Bluntness, disagreement, or bad news is NOT unsafe — those stay safe:true.\n` +
    `   On COLD START (no baseline), don't assume they tolerate strong language — lean cautious.\n\n` +
    `Tentative, never scolding. Classify "family" as EXACTLY ONE of: ${FAMILY_LIST}. ` +
    `Return ONLY JSON: {"emotion":"<1-2 words>","family":"<one of the 10>",` +
    `"intensity":<0..1>,"mirror":"<one sentence: the emotion these words carry>",` +
    `"safe":<bool>,"warning":"<if unsafe: one gentle sentence, else "">",` +
    `"reframe":"<if unsafe: a rewrite preserving intent without the wound, else "">"}`
  const user = `${ctx}\n\nDraft:\n"${draft}"\n\nMirror its emotion and gate it for ${partner?.name || 'them'}.`
  const { json } = await callJson({ system, user, maxTokens: 700 })
  return {
    emotion: cleanEmotion(json.emotion),
    family: cleanFamily(json.family),
    intensity: Math.max(0, Math.min(1, Number(json.intensity) || 0.5)),
    mirror: String(json.mirror || '').slice(0, 400),
    safe: !!json.safe,
    warning: String(json.warning || '').slice(0, 300),
    reframe: String(json.reframe || '').slice(0, 400),
  }
}

// ── SEND: rewrite a draft to match the user's stated intent, then re-check ──
export async function rewriteToIntent(partner, draft, intent) {
  const hasBaseline = !!(partner?.baseline?.summary)
  const ctx = hasBaseline
    ? `The recipient, ${partner.name}, normally writes: ${partner.baseline.summary}` +
      (partner.baseline.baselineTone ? ` (resting tone: ${partner.baseline.baselineTone})` : '')
    : `There is no baseline for the recipient — keep it warm but not over-familiar.`
  const system =
    `${ACCESS}\n\nThe user wrote a draft, but it may not carry the emotion they MEANT. ` +
    `Rewrite the draft so it conveys their stated intent cleanly and without wounding ` +
    `${partner?.name || 'the recipient'} — keep it in the user's own voice, concise, and ` +
    `pitched to how THIS recipient communicates (match their register: don't strip language ` +
    `they'd be comfortable with, don't add formality the user wouldn't use). Then mirror the ` +
    `new emotion and gate it RELATIVE to this person.\n\n` +
    `Classify "family" as EXACTLY ONE of: ${FAMILY_LIST}. ` +
    `Return ONLY JSON: {"rewritten":"<the rewritten message>","emotion":"<1-2 words>","family":"<one of the 10>",` +
    `"intensity":<0..1>,"mirror":"<the emotion it now carries>","safe":<bool>,` +
    `"warning":"<if still unsafe, else "">","reframe":"<if still unsafe, else "">"}`
  const user = `${ctx}\n\nDraft: "${draft}"\n\nWhat the user actually means: "${intent}"\n\nRewrite to match the intent, then check.`
  const { json } = await callJson({ system, user, maxTokens: 800 })
  return {
    rewritten: String(json.rewritten || draft).slice(0, 600),
    check: {
      emotion: cleanEmotion(json.emotion),
      family: cleanFamily(json.family),
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

// ── PERSPECTIVE: the persistent per-person theory-of-mind ──────────────────
// Synthesized ON DEMAND from the baseline + the emotional bank we already store
// (no per-message cost). This is the heart of "ToM, not sentiment": rather than
// scoring a message, it models the PERSON'S mind and surfaces the GAP between how
// they experience their own messages and how the user tends to receive them.
// "Remember THEM, not their words."
export async function synthesizePerspective(partner) {
  const name = partner?.name || 'this person'
  const hasBaseline = !!(partner?.baseline?.summary)
  const bank = partner?.bank || []
  // Not enough learned yet → honest cold start; don't spend a model call.
  if (!hasBaseline && bank.length < 3) {
    return { grounded: false, selfView: '', yourView: '', gap: '', theyKnow: [] }
  }
  const baseline = partner.baseline || {}
  const bankNote = formatBank(bank, { limit: 24, withSource: true })
  const system =
    `${ACCESS}\n\nYou hold a PERSISTENT theory-of-mind for ONE person, ${name}, built ` +
    `only from how they write to the user and the emotional history below. This is NOT ` +
    `a personality score or a verdict about who they ARE — it models how THEY likely ` +
    `experience their own messages versus how the user tends to receive them. The user's ` +
    `default failure is to read ambiguity as a THREAT; your job is to make the GAP between ` +
    `those two minds visible so it can be bridged.\n\n` +
    `RULES:\n` +
    `- Tentative, relational, warm: "reads as…", "${name} likely…", "you tend to…". Never a verdict.\n` +
    `- LEAD with the gap: the concrete difference between their intent and the user's reading ` +
    `(e.g. "${name} reads their own teasing as affection; you read it as an attack").\n` +
    `- Ground every line in the baseline + emotional history below, never generic advice.\n` +
    `- "theyKnow" = 2-4 durable, specific things worth REMEMBERING about ${name} (their patterns, ` +
    `what their tones usually mean for them) — the relationship's memory made visible.\n` +
    `- If the history is thin, say so honestly and keep claims small.\n\n` +
    `Return ONLY JSON: {"selfView":"<1 sentence: how ${name} likely experiences their own way of writing to the user>",` +
    `"yourView":"<1 sentence: how the user tends to read ${name}, naming the threat-default if present>",` +
    `"gap":"<1 sentence: the core space between those two views, the thing to bridge>",` +
    `"theyKnow":["<short durable truth>","..."]}`
  const ctx =
    `BASELINE for ${name}:\n${baseline.summary || '—'}\n` +
    `Resting tone: ${baseline.baselineTone || '—'}\n` +
    `Habits: ${(baseline.markers || []).join('; ') || '—'}\n` +
    (bankNote ? `\nEmotional history (both directions, recent):\n${bankNote}` : '\n(No emotional history yet.)')
  const user = `${ctx}\n\nSynthesize Aida's current theory-of-mind for ${name}.`
  const { json } = await callJson({ system, user, maxTokens: 700 })
  return {
    grounded: true,
    selfView: String(json.selfView || '').slice(0, 300),
    yourView: String(json.yourView || '').slice(0, 300),
    gap: String(json.gap || '').slice(0, 300),
    theyKnow: Array.isArray(json.theyKnow)
      ? json.theyKnow.map((t) => String(t).slice(0, 160)).filter(Boolean).slice(0, 4)
      : [],
  }
}

// ── Repair (4th-wall): apply the user's correction to the last incoming read ─
export async function applyRepair(partner, lastMessageText, note) {
  const system =
    `${ACCESS}\n\nThe user is CORRECTING Aida's read of a message they received — they ` +
    `know this person better. Treat the correction as authoritative and produce a ` +
    `revised read that honors it, plus updated emotional notes.\n\n` +
    `Classify "family" as EXACTLY ONE of: ${FAMILY_LIST}. ` +
    `Return ONLY JSON: {"emotion":"<1-2 words>","family":"<one of the 10>","intensity":<0..1>,"grounded":true,` +
    `"chargedSpan":"","read":"<revised tentative read>","because":"<now reflecting the user's correction>",` +
    `"divergence":"<updated light ToM line>","notes":[{"emotion":"<word>","intensity":<0..1>,"context":"<why>"}]}`
  const user =
    `Message ${partner?.name || 'they'} sent: "${lastMessageText}"\n\n` +
    `The user's correction: "${note}"\n\nRevise the read accordingly.`
  const { json } = await callJson({ system, user, maxTokens: 700 })
  return {
    emotion: cleanEmotion(json.emotion),
    family: cleanFamily(json.family),
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
