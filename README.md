# Aida — closed-captions for emotional subtext

Aida is an **accessibility tool** for written conversation. It reads what people *mean* beneath what they *say*, and it catches a wounding message before you send it.

The name (間, *aida*) is Japanese for "the space between" — the interval between two people, where meaning lives but words don't. Aida sits in that space and reads it aloud.

If captions make sound legible and screen readers make pixels legible, Aida makes **emotional subtext** legible. That is the whole of it.

**Live demo:** https://aida-yxi3.onrender.com — a working sample. (Free hosting, so the first request after idle takes a few seconds to wake; the in-memory store resets on each deploy, so add a person and a couple of their messages to see Aida learn them.)

---

## What it is

- An assistive layer for **written** human-to-human conversation, in the lineage of captions and screen readers.
- A reader of **subtext** — the emotion under the surface words — grounded in the specific person you are talking to.
- A **safety gate** on what you send: it mirrors the emotion your own draft carries, and stops you before a message lands as a wound.
- An **inline overlay** on the conversation. A quiet marker you tap to expand; a pulse only when it matters.

## What it is NOT

- **Not mental-health or therapy.** No wellbeing advice, no diagnosis, no treatment. It translates communication; it does not counsel you.
- **Not personality-typing.** It never types, scores, or labels a person. It learns how *one specific person communicates with you*, only to translate *their messages*.
- **Not basic RAG.** It does not retrieve and paraphrase documents. It builds a per-person **theory-of-mind** and reads each message as a **deviation from that person's baseline**.
- **Not a dashboard.** No charts, no scores, no "NEGATIVE 0.82." The surface is the conversation, with one line of help on top.

## Who it is for

The **neurodivergent spectrum** — people whose wiring makes emotional subtext and/or relational memory hard to reach:

- **Alexithymia** — difficulty identifying and naming felt emotion, in others and in oneself.
- **Autism** — where tone, sarcasm, and implication don't surface from the literal words.
- **ADHD** — where the emotional weight of a message is easy to miss or misjudge in the moment.
- **TBI / memory loss** — where you cannot hold who a person *is* from one conversation to the next.

The default failure these share: ambiguity gets read as a **threat**. A clipped "fine." becomes an attack. Aida replaces that guess with a grounded read — and remembers the person, so tomorrow's read is sharper.

---

## How it works

### The emotional note — the unit of the product

Aida turns text into **emotional notes**, and the notes *are* the product — not a by-product. Each note is:

- **emotion(intensity)** — e.g. `frustration(0.7)`, `affection(0.9)`
- **felt-sense context** — the anchoring quote and the *why* ("for her, this clipped tone is unusual")
- **source** — them, or you (Aida reads both directions)

**Project law: the model is built fresh.** No imported emotion taxonomy, no sentiment library, no borrowed wheel. The representation is invented here, powered by Opus 4.8 — which reads emotion as *the task*, not as a side-effect of classification.

### A per-person emotional bank account

Aida keeps one profile per conversation partner. You seed it by pasting a few of their past messages; from those it learns their **baseline** — warmth, directness, punctuation, length. Every new message is read as a **deviation** from that baseline, and the notes layer up over time into a per-person emotional history. The same flat "k." means something different from a person who usually writes paragraphs than from one who always writes "k."

Memory is **built automatically and never hand-injected** — repair happens by conversation ("I think Joe meant X"), never by editing a person's record directly. That integrity rule keeps false beliefs from calcifying.

### The RECEIVE flow (automatic)

A message arrives. Aida reads it against the person's baseline and surfaces, tentatively and relationally:

- the **emotion** and intensity it carries,
- a one-line **read** ("reads as frustration — for Sarah this clipped tone is unusual"),
- the **because** (what deviated from her normal),
- a light **divergence** line — theory-of-mind: how *they* likely mean it versus how *you* might take it.

On a **cold start** — a new person with no baseline — Aida stays humble. It says it is *still learning how they write* and offers only a cautious, generic read. Honest uncertainty over a confident wrong guess.

### The SEND flow (you drive it)

You cannot feel how your own words land. So before anything goes out:

1. **Check Emotion** — Aida mirrors the emotion your draft actually carries, so you can verify *what you said* matches *what you meant*.
2. **Rewrite** — tell Aida what you meant; it rewrites in your voice and re-checks. Iterate.
3. **Approve** — only when the emotion is right do the words go to the person.

**The safety gate.** If a draft would genuinely wound — an attack on character or identity, contempt, cruelty — Aida fires the one deliberate alarm: **Approve locks**, and you stay in the Rewrite loop until the message is safe again. Bluntness, disagreement, and bad news are **not** wounds; those pass straight through. The gate is structural, not a nag.

> The canonical catch: you type **"blood bath."** You meant *the Black Friday rush.* Read literally, it's violence. Approve locks; you tell Aida what you meant; it rewrites; the emotion comes back safe; Approve re-opens. The catch saved a message whose landing you could never have felt yourself.

---

## Run it locally

Requires Node ≥ 20.

```bash
npm install

# one-time: configure your key
cp .env.example .env
# then edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# development (Vite + API, hot reload)
npm run dev

# or production (build the SPA, serve it + the API on one port)
npm run build && npm start
```

The API and the app are served same-origin. Default port is `8787`.

## Grade it

"Done" is **model-verifiable** — no human in the loop. The grader runs the rubric against a live server and prints a pass/fail table.

```bash
# against a locally running server
npm run grade

# or against the live demo (or any deployed URL)
node scripts/grade.mjs https://aida-yxi3.onrender.com
# (BASE=https://aida-yxi3.onrender.com npm run grade also works)
```

It checks: **A1** health, **A3** incoming reads (≥ 80% match expected emotion *and* give a grounded, per-person rationale, graded against [`examples/incoming.json`](examples/incoming.json)), **A4** the outgoing gate (fires on every wound, false-alarms on none, graded against [`examples/outgoing.json`](examples/outgoing.json)), **A5** cold-start humility, and **A6** memory persistence. Exit code `0` only if all pass.

The seed sets are deliberately **ambiguous** — the right read depends on the *person*, not the surface sentiment (a normally-warm Sarah sending a clipped "fine."), so a generic sentiment tool would miss them.

---

## Status

This is a **sample** — a complete, working slice of the idea, now paused. What it does today:

- **Per-person theory-of-mind** — a persistent perspective model (`selfView` / `yourView` / `gap`), synthesized on demand from each person's baseline and their emotional history. Tap a person's name to see *"What Aida knows about them,"* led by the gap between how they mean their words and how you read them.
- **Emotional bank account** — bi-directional notes (them→you and you→them), auto-kept and fed back into every read, the send-gate, and the perspective model.
- **Grounded RECEIVE + person-relative SEND gate**, 10-family colours, conversational repair, cold-start humility.

If picked back up, the natural next steps are a Chrome extension (Telegram/Discord overlay), audio in/out, and real persistence + faster hosting — all out of scope for this sample.

---

## Planning

Aida was planned before it was built. The reasoning lives in the docs, in order:

| Tier | Doc | Question it answers |
|------|-----|---------------------|
| 0 | [docs/00-the-person.md](docs/00-the-person.md) | Who is this for, and what is their lived experience? |
| 1 | [docs/01-the-problem.md](docs/01-the-problem.md) | What is the problem, stated precisely? |
| 2 | [docs/02-the-solution.md](docs/02-the-solution.md) | What is the solution — the felt experience and the architecture? |
| 3 | [docs/03-rams-polish.md](docs/03-rams-polish.md) | **Rams:** simplify until nothing is left to remove. |
| 4 | [docs/04-review.md](docs/04-review.md) | Does the simplification still deliver the vision? |
| 5 | [docs/05-rams-ux.md](docs/05-rams-ux.md) | **Rams UX:** the interaction, reduced to essence. |
| 6 | [docs/06-review-again.md](docs/06-review-again.md) | Does the UX hold? Convergence. |

Build brief: [BUILD_BRIEF.md](BUILD_BRIEF.md) · Rubric: [RUBRIC.md](RUBRIC.md) · Principles & the bar: [PRINCIPLES.md](PRINCIPLES.md)
