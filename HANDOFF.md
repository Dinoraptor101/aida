# Aida — Session Handoff (for a fresh / remote session)

> Read this first. It's the cold-start brief: where we are, the rules that keep the
> live demo safe, how to run it, what's built, and what's next. Deeper design
> context is in `docs/00..06` (the 7 planning tiers) and `README.md`.

**Aida** is *closed-captions for emotional subtext* — an accessibility tool for the
neurodivergent spectrum. It reads what people *mean* beneath what they *say*
(RECEIVE), and catches a message that would wound before it sends (SEND). The
functional emotions are **the product**, not a by-product. Built fresh — **borrow
no external emotion taxonomy** (project LAW).

---

## ⚠️ Branch & deploy rules (do not break these)

- **`main`** = the **deployed** branch. Render auto-deploys `main` to
  **https://aida-yxi3.onrender.com**. A push to `main` redeploys AND **wipes the
  store** (ephemeral disk — re-seed partners after any deploy).
- `main` is **protected**: PR required (0 approvals), no force-push, no deletion.
  Land changes via a PR from a feature branch.
- **`dev`** = the working branch (this one). Build here, open a PR to `main` when ready.
- Don't push to `main` casually — coordinate, because it redeploys the live demo.

## Run & test

```bash
npm install
# .env needs: ANTHROPIC_API_KEY=sk-ant-…   (gitignored; a remote session must supply it as a secret)
#             AIDA_MODEL=claude-opus-4-5-20250514
npm run dev      # vite (5173) + express api (8787), HMR
npm run build && npm start   # production: express serves dist + api on 8787
npm test         # 14 node:test unit tests (emotions classify, extractJson, cleanEmotion)
npm run grade    # model-verifiable rubric A1–A6 against a running BASE url
```
CI (GitHub Actions) runs `npm ci + test + build` on push to `main`/`polish` and PRs to `main`.

## Architecture map

- `server/ai.js` — the **Opus 4.5 engine**: deriveBaseline, readIncoming, checkOutgoing,
  rewriteToIntent, readSelf, applyRepair. Tags each read with one of **10 emotion
  families**. Graceful: SDK retries + malformed-JSON retry; routes fall back, never raw 500s.
- `server/store.js` — JSON-file store (`data/store.json`). Per partner: `baseline`,
  `bank[]` (emotional notes, both directions), `thread[]`. `_seq` resumes past stored ids on load.
- `server/index.js` — Express API. Endpoints: `GET /api/health`, `GET/POST /api/partners`,
  `GET /api/partners/:id`, `POST /api/partners/:id/{receive,check,rewrite,send,repair}`.
  `/send` responds instantly; the bank note derives in the background.
- `src/` — React (Vite). `App.jsx`, `components/{PartnerPicker,Thread,Composer,ReadCard,ToastHost,Bits}.jsx`,
  `emotions.js` (the 10 families + colours + classifier), `toast.js`, `api.js`.

## Design rules (enforced — keep them)

- The **composer** (Them/Me toggle + input + buttons) **never moves or resizes**.
  Helper panels (mirror / rewrite) **float above** it; status sits *inside* the input.
- **Floating toasts** for errors/notifications — never inline (no layout shift).
- One **Send** button; checking is implicit (auto 5s after typing + on Send).
- Aesthetic: **Wabi-Sabi × Dieter Rams** — muted, every element earns its place.
- DQ-safe **accessibility** framing only — NOT mental-health / therapy / personality-typing.
  Somatic Practicing stays OUT.

## ✅ Built

- **MVP**: per-person model, RECEIVE (grounded read, divergence, cold-start humility),
  SEND (safety gate), emotional **bank account** (both directions, fed into reads),
  10-family **colours**, conversational **repair**, auto-memory, mobile UI, live deploy, grade harness.
- **Polish** (on `main`): robustness/fallbacks, instant send, panels-float-above-fixed-composer,
  single Send button, per-mode draft preservation, blank-clears-panel, toasts, 3-dot loader,
  tidy labels, colour legend, duplicate-Rewrite fix, CI/CD + branch protection.

## ⬜ Next (in priority order)

1. **Full ToM** — the big one. Today only a one-line inline divergence exists. Build a
   **persistent per-person perspective model**, synthesized **on demand** from the bank
   we already store (no per-message cost): `{ selfView, yourView, gap, theyKnow }`.
   Surface as a calm **"What Aida knows about [Person]"** panel from the thread header,
   leading with the *gap* (e.g. "Joe reads his teasing as affection; you read it as attack").
   This makes the bank **visible** — *"remember THEM, not their words."*
2. **Infra cluster** — host migration (off Render → no cold-start) + **real DB** (replace the
   JSON file; serverless has no disk) + latency (prompt-cache the system prompt + per-person
   baseline; Haiku for the cheap family-classification pre-pass). These pair together.
3. **Cost model** — Haiku pre-passes + caching to make freemium/ad-supported viable.
4. Later — Somatic Practicing (inward), Chrome extension (Telegram/Discord), audio I/O.

## Anchor

Dima is the lived-experience anchor (emotional blindness + TBI memory), **not** the target —
Aida serves the broad neurodivergent spectrum by learning each person deeply (theory-of-mind
is the core engine). Receive first, warmth over rigor; over-engineering is a virtue here.
Use 🦉 / 🦀 for Claude — never 🦊 (that's Renamon's).
