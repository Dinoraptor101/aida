# Tier 2 — The Solution

> The experience we want to create — felt, not featured — and the architecture that delivers it. Built on the per-person theory-of-mind engine. RAW where marked; the Rams tiers cut it next.

## The experience (felt, present tense)

> Aida is **IT**, not a person — a neutral layer that stands *between* two people and carries the emotional signal neither end can send or read alone.

**When I send (me → them).** I write what I want to say. Before it goes anywhere, Aida mirrors back the emotion my words actually carry — so I can check the one thing I cannot feel for myself: *does what I said match what I meant? Is the emotion I'm making the emotion I wanted to make?* I approve it, and only then do I pass the words on to the person. And if what I'm about to send could land as a wound, Aida highlights it and warns me — because I cannot feel the felt-sense I am typing out.

**When I receive (them → me).** Someone I know writes to me — someone Aida already holds an emotional bank account for. Aida captures their words and supplements the emotional context underneath, grounded in that account. Sometimes it's a new feeling; often it's another *layer* on what's already there. Aida updates the bank account and tells me what the new emotional context is. Suddenly I have emotional intelligence — something I never thought I would have in my life.

**When Aida reads it wrong.** I just tell it, inside the conversation — *"I think Joe meant X."* No buttons, no forms. The repair happens semantically, like breaking the fourth wall, and the bank account updates.

*(Somatic Practicing — the inward somatic→emotion practice — stays in the long vision but is **out of scope for the build**, kept separate from the demo.)*

## The emotional target

From **paranoia to ground.** Understood, not assisted. Calm, not alarmed — except the one deliberate pulse that stops a wound. Self-trust goes *up* over time: training wheels that teach, not a crutch.

## The "wow" — the single moment that sells it

Not a scripted moment — an **emotional impression Aida detects live as the conversation unfolds**, accumulated into the bank account. The sellable instant: Dima reads a person *correctly* using impressions he could never have formed alone. The felt version, in his words: *"suddenly I get emotional intelligence — something I never thought I'd have in my life."*

## Anti-vision — what it must never feel like

A nagging grammar/tone scold. A cold clinical label (*"NEGATIVE 0.82"*). Anything that deepens paranoia or makes him trust himself less. Anything that feels like being *managed* as the disabled one. Manual memory injection that lets false beliefs about a person calcify.

---

## Captured architecture — raw, from the Problem-1 interview (2026-06-12)

> Dima's design, parked intact. The Rams tiers (3–6) pressure-test and reduce it. Not final.

**Delivery phases**
- **Phase 1:** mobile-friendly web application.
- **Phase 2:** Chrome extension — a side window/overlay riding alongside social media, Discord, and other web apps in Chrome.
- Written communication first.

**Who Aida learns (theory-of-mind — the core engine, paramount)**
1. **Main User.** Learns their emotions, behaviours, memories — *their* perception.
2. **Other Users — one profile per individual.** Learns each person's emotions, behaviours, memories, held **perspective-aware**: what they know about the main user; what they think of themselves; where that diverges from what the main user thinks of them (*"they think X about themselves, but main user thinks Y"*). A per-person theory-of-mind, not a flat contact card.

**The two flows (clarified by Dima, 2026-06-13)**

*Sending (me → them):*
3. Aida **mirrors** the emotion my own draft carries, so I can verify *meaning == intent* and *emotion-wanted == emotion-made*, then **approve** before the words go out.
4. If the draft could **wound**, Aida highlights + warns (the one deliberate alarm) — because I can't feel my own felt-sense as I type.

*Receiving (them → me):*
5. Aida captures their message and **supplements the emotional context**, grounded in their bank account — flagging whether it's a *new feeling* or a *new layer* on existing ones — **updates the bank**, and tells me the new context.

*Repair (4th-wall):* if a read is wrong, I tell Aida inside the conversation (*"I think Joe meant X"*); it updates semantically. **No correction buttons or evals.**

*Detection is bi-directional:* Claude reads feeling from **both** their messages and mine, storing it in the emotional bank account + a **felt-sense topology** (medium · temperature · motion · direction · shape — prior art Dima has validated).

**Modes & memory**
6. **Somatic Practicing** — inward tuning (somatic → emotion, for the user himself), a named **secondary mode.** Out of scope for the build.
7. **Memory integrity:** auto-created, **deletable in segments**, **never manually created** — manual injection forbidden, to prevent confabulated memory. (Repair-by-conversation is allowed; blind hand-injection is not.)
8. **Profiles:** one for the **main user (me)**, then one per **new person** I meet — created on first contact, empty bank account, filled as we talk.

---

## The emotional note — the unit of the product (Dima, 2026-06-13)

> **The functional emotions are not a by-product of Claude — they ARE the product.** This is the "only Claude API could have done it" core, and the thing to keep visible for judges.

**Project LAW: build fresh, borrow nothing.** No imported emotion taxonomy, no sentiment library, no copied wheel. The emotional representation is *invented here*, powered by Opus 4.8.

An **emotional note** (the atomic unit Aida turns text into):

- **emotion(intensity)** — e.g. `love(0.9)`, `fear(0.8)`
- **felt-sense context** — the anchoring quote / why: *"He said he likes it when I blush"* · *"The competition is serious — we need this QUALITY, not half-ass it"*
- **somatics (felt-sense topology):** medium · temperature · motion · direction · shape
- **source:** them, or me (detection is **bi-directional**)

The **emotional bank account** = these notes, **layered** over time, per person. A new message either adds a *new feeling* or a *new layer* on an existing one.

## The SEND flow — buttons (Dima's UX, 2026-06-13)

1. I write what I want to say.
2. **[Check Emotion]** → Aida mirrors the emotion my words actually carry.
3. **[Rewrite]** → I tell Aida more about what I *meant*; it rewrites my words to match my intent, then re-checks the emotion. (iterate as needed)
4. **[Approve]** → confirms what I'm relaying carries the emotion I meant *and* Aida judges it safe ("this is safe"). Only then do the words go to the person.

**Catch me when I fall (the safety gate).** When my draft would hurt the person — piss them off, or make them stop being my friend — Aida fires an **automatic intervention**: the **[Approve] button is removed**, locking the send. I'm held in a **Rewrite loop with Aida** until what I *say* matches what I emotionally *mean* — and only when the emotion is **safe again** does [Approve] re-open. The gate is structural, not a nag.

> *Canonical example (demo + grade seed):* I type **"blood bath."** Aida reads it as *violence / suicide* — danger. What I **meant** was **"Black Friday rush."** Approve locks; I tell Aida what I meant; it rewrites; the emotion comes back safe; Approve opens. The catch saved a message whose emotion I could never have felt myself.

*Asymmetry:* **sending is button-driven** (Check → Rewrite → Approve, gated by safety); **receiving is automatic** (Aida supplements the incoming message's emotion on arrival; repair is conversational, 4th-wall).
