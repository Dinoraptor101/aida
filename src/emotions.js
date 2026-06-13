// The 10 emotion families (Sofroniew et al., 2026) + one MUTED, wabi-sabi hue
// each — so a detected emotion is shown as a colour, never neon. Built fresh
// (LAW: borrow nothing): a hand-written classifier maps Aida's nuanced free-text
// label onto exactly one family, then to its colour. Runs entirely client-side,
// so it can never break a read or a send.

export const FAMILIES = {
  joy:           { label: 'Joy / Excitement',        color: '#c2972f' }, // dusty gold
  sadness:       { label: 'Sadness / Grief',         color: '#6f83a0' }, // muted slate blue
  anger:         { label: 'Anger / Frustration',     color: '#b1543d' }, // brick
  calm:          { label: 'Calm / Serenity',         color: '#7c8a72' }, // sage
  fear:          { label: 'Fear / Anxiety',          color: '#8a7ba3' }, // muted violet
  curiosity:     { label: 'Curiosity / Interest',    color: '#3f8a86' }, // muted teal
  disgust:       { label: 'Disgust / Contempt',      color: '#85813f' }, // olive
  surprise:      { label: 'Surprise / Wonder',       color: '#cf9a63' }, // apricot
  love:          { label: 'Love / Tenderness',       color: '#b56f88' }, // dusty rose
  determination: { label: 'Determination / Resolve', color: '#9c6b46' }, // clay / sienna
}

// Longest-cue-wins keyword map. Order-independent; specific phrases beat short
// ones (so "warm pride" → joy, not "warm" → love).
const CUES = {
  joy: ['joy', 'happy', 'happi', 'excit', 'delight', 'glee', 'cheer', 'elat', 'pleased', 'glad', 'upbeat', 'enthus', 'playful', 'warm pride', 'proud', 'pride', 'satisf'],
  sadness: ['sad', 'grief', 'sorrow', 'down', 'hurt', 'wound', 'disappoint', 'let down', 'dejected', 'melancholy', 'withdraw', 'withdrawn', 'closed-off', 'closed off', 'pulling back', 'shut down', 'shutdown', 'flat', 'numb', 'resign', 'despond', 'lonely', 'gloom', 'deflate'],
  anger: ['anger', 'angry', 'frustrat', 'annoy', 'irritat', 'furious', 'rage', 'resent', 'exasper', 'indign', 'agitat', 'terse', 'clipped', 'displeasure', 'impatient', 'fed up', 'hostil', 'snippy', 'cold anger'],
  calm: ['calm', 'serene', 'seren', 'settled', 'peace', 'relaxed', 'content', 'steady', 'even-keeled', 'neutral', 'matter-of-fact', 'matter of fact', 'composed', 'at ease', 'grounded', 'reassur', 'measured', 'businesslike', 'routine'],
  fear: ['fear', 'afraid', 'anxi', 'anxious', 'worry', 'worried', 'nervous', 'scared', 'dread', 'panic', 'unease', 'apprehens', 'distress', 'overwhelm', 'insecure', 'vulnerab', 'masked distress', 'alarm', 'uncertain', 'unsure', 'tense', 'on edge', 'hesitant', 'wary'],
  curiosity: ['curio', 'interest', 'intrigu', 'inquisit', 'engaged', 'keen', 'attentive', 'exploring', 'wondering why', 'questioning'],
  disgust: ['disgust', 'contempt', 'revuls', 'repuls', 'scorn', 'disdain', 'sneer', 'derisi', 'distaste', 'aversion', 'condescen', 'dismiss'],
  surprise: ['surprise', 'surprised', 'shock', 'astonish', 'startle', 'wonder', 'amaze', 'taken aback', 'unexpected', 'stunned', 'disbelief'],
  love: ['love', 'tender', 'affection', 'fond', 'adore', 'warmth', 'warm', 'caring', 'care', 'devotion', 'intimacy', 'cherish', 'gentle', 'grateful', 'gratitude', 'thank', 'appreciat'],
  determination: ['determin', 'resolve', 'resolute', 'driven', 'commit', 'focused', 'firm', 'assert', 'convict', 'persist', 'steadfast', 'decisive', 'motivated', 'urgen'],
}

// Classify a free-text emotion label onto one of the 10 families (or null).
export function classify(text = '') {
  const t = String(text).toLowerCase()
  if (!t) return null
  let best = null
  let bestLen = 0
  for (const [fam, cues] of Object.entries(CUES)) {
    for (const c of cues) {
      if (t.includes(c) && c.length > bestLen) {
        bestLen = c.length
        best = fam
      }
    }
  }
  return best
}

// Resolve an emotion label (+ optional explicit family) to {family,label,color}.
export function emotionStyle(emotionText, explicitFamily) {
  const fam = explicitFamily && FAMILIES[explicitFamily] ? explicitFamily : classify(emotionText)
  if (!fam) return { family: null, label: null, color: null }
  return { family: fam, ...FAMILIES[fam] }
}
