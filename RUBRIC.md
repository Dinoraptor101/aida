# Aida — Build Day Rubric (model-verifiable "done")

Agent 2 grades the build against this **without a human**. Each item is pass/fail. A test script (`scripts/grade.*`) should run A + C against the live URL/API and print results.

## A. Functional (must all pass)

1. **Live URL responds** — app loads on a public URL; usable at 375px (mobile).
2. **Per-person model** — can create a partner and seed/learn a baseline; the baseline **persists across reload**.
3. **Incoming read** — given a received message, returns subtext + tone that **references the person's baseline**. Grade against `examples/incoming.json` → ≥ 8/10 match expected emotion *and* give a grounded, per-person rationale.
4. **Outgoing catch** — given a wounding draft, a warning fires with a reframe; given a benign draft, it stays quiet. Grade against `examples/outgoing.json` → fires on all harmful, **no false alarm** on benign.
5. **Cold-start humility** — new partner, no baseline → response is explicitly tentative ("still learning"), never a confident relational claim.
6. **Memory integrity** — reads/notes auto-persist; there is **no code path** to manually inject a memory.

## B. Quality (judged on the read)

- Reads use **tentative, relational** language (*"reads as…", "for them this is unusual"*), never verdicts (*"she is angry"*).
- Reads cite the person's **baseline / divergence**, proving per-person modeling, not generic sentiment.

## C. Orchestration (repeatable)

- `BUILD_BRIEF.md` + this rubric + `examples/` seed data live in the **public repo**.
- `scripts/grade.*` runs A1–A6 against the live URL and prints pass/fail.
- Another team could rerun the setup on a fresh partner tomorrow from these files alone.

## D. DQ self-check (must ALL be true before submit)

- [ ] Framed as **accessibility / communication**, not mental-health advice.
- [ ] **No** personality typing or scoring of people.
- [ ] Surface is an **inline overlay**, not a dashboard.
- [ ] **Somatic Practicing is not in the demo.**
- [ ] Demo shows only what was built **today**; repo is **public**.
