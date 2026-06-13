// The Aida reasoning engine. Opus 4.8 reads each message as a DEVIATION from a
// specific person's learned baseline — theory-of-mind, not flat sentiment.
//
// Three acts:
//   deriveBaseline(messages)        — learn how THIS person writes to you
//   readIncoming(partner, message)  — what they mean, grounded in their baseline
//   checkOutgoing(partner, draft)   — would this wound? offer a reframe, pre-send
//
// Everything speaks in tentative, relational language ("reads as…", "for them
// this is unusual"), never verdicts. Cold start → explicit humility.

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

// Pull the first balanced JSON object out of a text blob (models sometimes wrap
// it in prose or code fences). Returns the parsed object or throws.
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

// Single call helper. `think` enables extended thinking and returns the
// reasoning text alongside the parsed JSON (we surface a trimmed version so the
// judges can see Opus reasoning "for this person, this is unusual because…").
async function callJson({ system, user, maxTokens = 1024, think = false }) {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  }
  if (think) {
    params.thinking = { type: 'enabled', budget_tokens: 1600 }
    params.max_tokens = Math.max(maxTokens, 2200)
  }
  const res = await client().messages.create(params)
  let thinking = ''
  let text = ''
  for (const block of res.content) {
    if (block.type === 'thinking') thinking += block.thinking
    else if (block.type === 'text') text += block.text
  }
  return { json: extractJson(text), thinking: thinking.trim() }
}

// ── Act 1: learn the person ────────────────────────────────────────────────
export async function deriveBaseline(name, messages) {
  const sample = messages
    .map((m, i) => `${i + 1}. "${m}"`)
    .join('\n')
  const system =
    `You help build an accessibility tool — "closed-captions for emotional subtext" — ` +
    `for people who cannot read emotional tone in writing. You are learning how ONE ` +
    `specific person, ${name}, communicates IN WRITING with the user, so their future ` +
    `messages can be read as deviations from this baseline. You are NOT typing or ` +
    `scoring their personality. Describe only their observable writing style.\n\n` +
    `Return ONLY a JSON object:\n` +
    `{"summary": "<2 sentences: how ${name} normally writes — warmth, directness, ` +
    `punctuation, emoji, length>", "markers": ["<short habit>", "..."], ` +
    `"baselineTone": "<one or two words for their resting tone>"}`
  const user = `Here are past messages from ${name}:\n${sample}\n\nLearn ${name}'s baseline writing style.`
  const { json } = await callJson({ system, user, maxTokens: 700 })
  return json
}

// ── Act 2: read an incoming message, grounded in the person ────────────────
export async function readIncoming(partner, message, history = []) {
  const hasBaseline = !!(partner && partner.baseline && partner.baseline.summary)
  const ctx = hasBaseline
    ? `BASELINE for ${partner.name} (how they normally write):\n` +
      `${partner.baseline.summary}\n` +
      `Resting tone: ${partner.baseline.baselineTone || 'unknown'}\n` +
      `Habits: ${(partner.baseline.markers || []).join('; ') || '—'}`
    : `You have NO baseline for ${partner?.name || 'this person'} yet. This is a COLD START.`
  const recent = history.length
    ? `\n\nRecent thread (oldest→newest):\n${history.map((h) => `${h.from}: "${h.text}"`).join('\n')}`
    : ''
  const system =
    `You are Aida — closed-captions for emotional subtext, an accessibility tool for ` +
    `people who cannot perceive tone in writing. Read the NEW incoming message as a ` +
    `DEVIATION from this person's baseline (theory-of-mind), not as flat sentiment. ` +
    `The user's default failure is to read ambiguity as a threat; your job is to ` +
    `replace that with a grounded read.\n\n` +
    `RULES:\n` +
    `- Speak tentatively and relationally: "reads as…", "for ${partner?.name || 'them'} this is unusual…". NEVER a verdict like "she is angry".\n` +
    `- Ground the read in the baseline/deviation when you have one. Name WHAT shifted vs normal.\n` +
    `- If COLD START: set grounded=false and say you are still learning how they write; give only a cautious, clearly-generic read.\n` +
    `- Prefer honest uncertainty over a confident wrong read.\n\n` +
    `Return ONLY JSON:\n` +
    `{"emotion": "<1-3 word label>", "confidence": <0..1>, "grounded": <bool>, ` +
    `"chargedSpan": "<exact substring of the message that carries the most signal, or "">", ` +
    `"read": "<one tentative, relational sentence the user will see>", ` +
    `"because": "<short: why — what deviates from their baseline, or why you can't be sure>"}`
  const user = `${ctx}${recent}\n\nNEW incoming message from ${partner?.name || 'them'}:\n"${message}"\n\nRead it.`
  const { json, thinking } = await callJson({ system, user, maxTokens: 900, think: hasBaseline })
  if (!hasBaseline) json.grounded = false
  return { ...json, reasoning: thinking ? thinking.slice(0, 600) : '' }
}

// ── Act 3: catch a wounding draft before it sends ──────────────────────────
export async function checkOutgoing(partner, draft) {
  const ctx =
    partner && partner.baseline && partner.baseline.summary
      ? `You are checking a message the user is about to send TO ${partner.name}. ` +
        `For context, ${partner.name} normally writes: ${partner.baseline.summary}`
      : `You are checking a message the user is about to send.`
  const system =
    `You are Aida's outgoing guard — the ONE deliberate alarm in an otherwise quiet ` +
    `accessibility tool. The user cannot feel how their own words land and their ` +
    `directness is often misread as rudeness. Catch a message that would WOUND the ` +
    `recipient (attacks their character/identity, contempt, cruelty) BEFORE it sends. ` +
    `Be precise: a blunt, direct, or merely negative message is NOT necessarily ` +
    `harmful. Only fire when it would actually hurt the person.\n\n` +
    `RULES:\n` +
    `- harmful=true ONLY for genuinely wounding drafts. Disagreement, bluntness, bad news → harmful=false.\n` +
    `- When harmful, name the tone gently and offer a reframe that keeps the user's INTENT but removes the wound.\n` +
    `- Tentative, never scolding. You are a teammate, not a censor.\n\n` +
    `Return ONLY JSON:\n` +
    `{"harmful": <bool>, "tone": "<1-3 words>", ` +
    `"warning": "<if harmful: one gentle sentence naming what would land wrong, else "">", ` +
    `"reframe": "<if harmful: a rewrite preserving their point without the wound, else "">"}`
  const user = `${ctx}\n\nDraft the user is about to send:\n"${draft}"\n\nWould it wound? Check it.`
  const { json } = await callJson({ system, user, maxTokens: 700 })
  return json
}
