# Decisions

An append-only log of choices and why we made them. ADR-style. Newest at the bottom. Never delete an entry — if a decision is reversed, add a new entry that supersedes it and link back.

Format:

```
## YYYY-MM-DD — <short title>
**Decision:** what we chose.
**Why:** the reasoning.
**Alternatives considered:** what we rejected and why.
**Supersedes / superseded by:** link, if any.
```

---

## 2026-06-12 — Project named "Aida (間)"
**Decision:** The project is named *Aida* — Japanese 間, "the space between."
**Why:** It sits between two people and reads the interval — the meaning in the gap, not the words.
**Alternatives considered:** *Attune* (from affect attunement — clear but less evocative); *Honne* (the true feeling beneath the social face — apt but loaded).

## 2026-06-12 — Planning repo first, code second
**Decision:** No code until the seven design tiers earn it. The repo holds documents first.
**Why:** Going straight to architecture is what produced the first proposal Dima rejected. Doing it right means understanding the person → vision → working back to engineering, with UX driving.

## 2026-06-13 — Built for the broad neurodivergent spectrum; Dima is the anchor, not the target
**Decision:** Aida solves for the broad neurodivergent population (alexithymia, autism, ADHD, TBI, others), not for Dima specifically. He is the lived-experience anchor that keeps the design honest.
**Why:** Designing to a market loses the moat; designing to one person risks a tool of one. The reconciliation is **breadth through depth** — serve many by learning each individual deeply, never by an "average neurodivergent" persona (a fiction; the conditions diverge hard).

## 2026-06-13 — Theory-of-mind is the core engine (paramount)
**Decision:** A per-person, perspective-aware model is the heart of Aida, not a feature.
**Why:** Subtext is deviation from a person's baseline — unreadable without a per-person model. ToM is also what makes breadth-through-depth possible. It is the position most likely to be attacked at the Rams tier; defend it. (See `.claude/reasoning_ledger.md`.)

## 2026-06-13 — Problem 1 is upstream of Problem 2; translator and memory-harness are one act
**Decision:** Treat emotional translation and memory continuity as a single engine, not two features.
**Why:** Memory encoding is gated by emotional salience; emotional blindness (P1) starves the salience, so memory (P2) never forms. Aida's emotional tag does double duty — the in-the-moment read AND the salience that makes the moment storable.

## 2026-06-13 — 7-tier doc set renamed to match the planning model
**Decision:** docs/ now holds exactly 00 Person · 01 Problem · 02 Solution · 03 Rams Polish · 04 Review · 05 Rams UX · 06 Review Again. Old names (the-vision, vision-to-eng, reduction, ux-vision, ux-eng-loop, polish) removed.
**Why:** The files must match Dima's stated 7-tier process. `docs/STATE.md` added as the living resume point.

## 2026-06-13 — Irreducible core + deferrals (Rams), and two promotions (Review)
**Decision:** Core = {per-person model, incoming read, outgoing wound-catch} + auto-memory. Deferred: Somatic Practicing (secondary mode), full perspective-divergence model, Chrome extension (Phase 2). Promoted to required: cold-start humility, confidence-gating.
**Why:** Remove any core piece and the vision breaks. Deferrals carry named triggers. Cold-start + gating are load-bearing because a wrong read feeds the very paranoia Aida exists to defuse.

## 2026-06-13 — Memory integrity: never manually created
**Decision:** Aida memory is auto-created and deletable in segments, but never hand-injected.
**Why:** Manual injection lets false beliefs about a person calcify — exactly the confabulation risk a memory-harness must avoid.

## 2026-06-13 — Build Day positioning: accessibility tool, not mental-health (DQ safety)
**Decision:** For Build Day, frame Aida exclusively as an **accessibility / assistive-communication tool** ("closed-captions for emotional subtext"). **Cut Somatic Practicing from the demo.** Keep the surface an inline overlay (not a dashboard); never type/score people.
**Why:** The hackathon's banned list includes "AI Mental Health Advisor," "Personality Analyzers," "Basic RAG," and "dashboard as main feature." Aida brushes all four if framed wrong. The accessibility framing dodges every one and is also the strongest Impact story. Build Day artifacts: `BUILD_BRIEF.md`, `RUBRIC.md`.
