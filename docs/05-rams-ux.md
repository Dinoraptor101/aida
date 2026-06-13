# Tier 5 — Dieter Rams UX Simplify

> The interaction, reduced. Mobile-first (375px). The tool disappears into use.

## The single screen

A conversation view that looks like a familiar messages thread — trust comes from familiarity, and the product should disappear into the chat. **Aida is a layer *on* the conversation, not a separate app you visit.**

## Reading incoming

When Aida has a grounded read, the message carries a quiet marker (a soft tint / underline on the charged span). Tap → a calm card: the subtext + tone in plain, relational language — *"for her this is unusually clipped — frustration about the wallet, not at you"* — with a sense of confidence. **Default state is silent.** It speaks only when it has ground *and* the read matters. Silence is the most common, correct state.

## Checking outgoing

As you type, the same engine reads your draft. Neutral/positive → a faint, ignorable tint. Harmful → the overlay **pulses** (the one deliberate alarm), names the tone, offers a reframe you can accept or dismiss. The pulse fires *before* send, never after.

## How subtext is shown without harm

- Language is **tentative and relational**: *"reads as…", "for them this is unusual"* — a hypothesis, never a verdict (*"she is angry"*). This is what keeps the user trusting themselves.
- **Ambient first, detail on tap.** Never a popup — except the outgoing pulse.
- **Cold start shows honesty, not a guess:** *"still learning how they write."*
- A tiny, legible emotion vocabulary — not a clinical rainbow.

## Secondary mode: Somatic Practicing

A separate, deliberately-entered space (not on the main thread). Describe the somatic feeling; Aida reflects possible emotion-names over time, building *his personal somatic dictionary.* **A practice, not a label-printer.** *(OUT of the build — DQ: reads as mental-health. See Tier 3.)*

---

## ✅ Blessed UX (2026-06-13, walked with Dima)

**One screen — a mobile chat thread, per person.** Familiar on purpose; it disappears into use.

- **Compose has a Them / Me toggle** (option B). Mobile real estate is precious, and it lets several messages be entered without forced turn-taking.
- **RECEIVE** (toggle = Them): message lands → quiet marker on the charged words → **tap** → calm card: `emotion(intensity)` · the tentative read · the light-divergence line (*"they likely mean X, though it may read as Y"*) · the *because* (deviation from baseline). Cold start → *"still learning how they write."* Bank updates silently.
- **SEND** (toggle = Me): **[Check Emotion]** mirrors what the words carry → **[Rewrite]** (tell Aida what you meant → it rewrites → re-check) → **[Approve]** sends.
- **Safety gate:** if it would wound, **[Approve] locks**; held in Rewrite until safe; then re-opens. The one loud moment.
- **Repair:** inline, conversational (*"I think Joe meant X"*). No buttons.
- **Defaults:** silent by default · tentative language always · tiny legible emotion vocabulary (no clinical rainbow).

### Design language — Wabi-Sabi × Dieter Rams

> Comfortable and natural, but nothing that doesn't serve. Every element earns its place or is removed.

| Element | Rule |
|---|---|
| **Palette** | Muted, natural, warm — paper & ink, one restrained accent. No vibrance. |
| **Decoration** | None. If it doesn't serve, remove it. |
| **Borders** | Only to separate meaning. Hairline. Else none. |
| **Shadows** | Only to show *state* (pressed, locked, active). Never ambient. |
| **Tints / faded bg** | Only when they aid readability or mark the charged span. |
| **Buttons** | Look like buttons — honest affordance. |
| **Space** | Generous, calm, quiet. Comfort over density. |
| **Imperfection** | Soft, natural — wabi-sabi, not clinical grid. |
