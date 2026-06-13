# Aida — Build Day Brief

**For:** Agent 2 (builder) + judges · **Date:** 2026-06-13, Shack15 · **Window:** 10:30 AM → 5:00 PM submission.

## One line

Aida is **closed-captions for emotional subtext** — an accessibility tool that, in written conversation, reads what people *mean* beneath what they *say*, and catches you before you send something that lands wrong. Built for the neurodivergent spectrum.

## ⚠️ Positioning — read before anything (DQ safety)

Aida is an **accessibility / assistive-communication tool**, in the lineage of captions and screen readers. Frame it ONLY as that, everywhere (demo, repo, video). It must NOT read as any banned/non-competitive category:

- ❌ **NOT a "mental health advisor"** — no wellbeing advice, therapy, or diagnosis; it translates communication. → For Build Day, the inward **Somatic Practicing** mode is **OUT of scope**. Ship only the outward translator.
- ❌ **NOT a "personality analyzer"** — it never types or scores a person. It learns how *one specific person communicates with you*, to translate *their messages*.
- ❌ **NOT "basic RAG"** — the novelty is a per-person **theory-of-mind** model + reading each message as **deviation from that person's baseline**.
- ❌ **NOT a dashboard** — the surface is an **inline overlay on the conversation**, never a dashboard.

## Who it's for (Impact — 35%)

The neurodivergent spectrum — people who can't read emotional subtext and/or can't hold relational memory (alexithymia, autism, TBI, more). Underserved, real, large. The job: **replace a guess that defaults to threat with a grounded read; catch a wound before it's sent.**

## What "done" looks like — Phase-1 MVP (ship today)

A mobile-friendly web app, deployed to a **live URL**, that:

1. **Per-person model** — a profile per conversation partner; learns/seeds their baseline communication style. (Seed by pasting a few of their past messages.)
2. **Incoming read** — for a received message, shows subtext + tone *grounded in that person* (*"for her, this clipped tone is unusual — frustration about the wallet, not at you"*). Ambient marker → tap to expand.
3. **Outgoing catch** — as you draft, if it would land as a wound, the overlay **pulses**, names the tone, offers a reframe — before send.
4. **Memory** — per-person reads/notes auto-persist across sessions. **Never manually injected.**
5. **Cold-start humility** — a new partner with no baseline → Aida says *"still learning how they write,"* never a confident guess.

**Out of scope today:** Somatic Practicing, Chrome extension (Phase 2), group chats, voice/tone audio.

## The demo (Demo — 35%) — ~60 seconds

1. Open a thread with "Sarah"; Aida has learned her baseline.
2. A genuinely-ambiguous message arrives → Aida decodes the subtext correctly, grounded in *her* — a read a generic tool can't produce.
3. You type a reply that would wound → the pulse fires; you fix three words; send.
4. Close: *"Aida remembers Sarah, so tomorrow's read is sharper."*

Use a **real, anonymized** exchange that actually confused a neurodivergent person. (Everything is built today, so all of it is demo-eligible.)

## Opus 4.8 use (15%)

Use **Opus 4.8** for the **per-person subtext read**: reason about a message *against the learned baseline*, surface the **deviation** + the other person's likely perspective (theory-of-mind) — not flat sentiment. Show extended-thinking reasoning: *"for this person, this is unusual because…"*. That's the beyond-basic capability to surface.

## Orchestration (15%)

"Done" is **model-verifiable** — see [RUBRIC.md](RUBRIC.md): a responding URL, an `examples/` test set with expected reads the model grades itself against, and the per-person / outgoing-catch behaviors as pass/fail checks. Repeatable: brief + rubric + seed data let another team rerun tomorrow on a new partner.

## Stack (builder's call — optimize for fastest live URL)

Fastest path to a deployed public URL wins. Suggested: a single deployable web app (Next.js on Vercel, or Vite SPA + serverless fn) calling the Claude API (Opus 4.8 for reads, optionally Haiku for cheap pre-passes). **Aida is a standalone project.** Repo **must be public.**
