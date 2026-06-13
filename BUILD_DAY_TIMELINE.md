# Aida — Build Day Timeline (remaining hours)

**Now:** 1:05 PM · **Submit by:** 5:00 PM sharp · **Real working time:** ~3h40m (hold 4:45–5:00 as submission buffer).

**Golden rule:** protect the **demo path** above feature-completeness. A small thing that works live beats a big thing that half-works. Deploy early, deploy often.

| Time | Block | Goal | Done when |
|------|-------|------|-----------|
| **1:05–1:30** (25m) | **Skeleton + deploy** | Scaffold app, push **public** repo, deploy hello-world to a **live URL**, wire Claude API (Opus 4.8) with a smoke test. | A public URL responds; one Opus call returns. **De-risk deployment NOW, not at 4:45.** |
| **1:30–2:15** (45m) | **Incoming read (the core)** | Message → per-person read: subtext + tone, grounded in baseline, via Opus 4.8. Build `examples/incoming.json` (doubles as demo script + rubric data). | A received message returns a grounded, tentative read referencing the person. |
| **2:15–2:45** (30m) | **Per-person model + memory** | Create a partner; seed baseline by pasting past messages; auto-persist reads. Cold-start humility ("still learning how they write"). | Baseline persists across reload; new partner stays tentative. |
| **2:45–3:30** (45m) | **Outgoing catch** | Draft → pulse warning + reframe on harmful; quiet on benign. Build `examples/outgoing.json`. | Pulse fires on a wounding draft, silent on a benign one. |
| **3:30–4:00** (30m) | **UI polish (mobile 375px)** | Conversation view + ambient marker + tap-to-expand + the pulse. Make the **demo path** beautiful, ignore the rest. | The 4-beat demo flows on a phone screen. |
| **4:00–4:20** (20m) | **Grade + final deploy** | Run `scripts/grade` vs `RUBRIC.md`; fix breaks; redeploy. Run the **DQ self-check** (accessibility framing, no dashboard, only today's work). | Rubric A-items pass on the live URL. |
| **4:20–4:45** (25m) | **Record + submit** | Record ≤1-min video (the 4-beat). Confirm repo **public**, demo link works, **all team members added**. Submit on the CV portal. | Submission confirmed before 4:45. |
| **4:45–5:00** | **Buffer** | Breathing room for the inevitable last glitch. | — |

## If you fall behind (cut in this order)
1. Drop UI polish to bare-minimum; keep the demo path working.
2. Drop the outgoing catch; demo **incoming read only** — it's still the wow.
3. Seed the per-person baseline manually (hardcode one rich partner) instead of a learn-flow.
4. Never cut: a **live URL**, the **per-person grounded read**, and **public repo**.

## Keep visible for judges
- **Opus 4.8** doing the read *against a baseline* (show its reasoning — "for this person, this is unusual because…").
- A moment Claude **caught and fixed its own failure** (grade script catching a break, then passing) — Round-2 judges specifically ask for this.

## The 4-beat demo (record this)
1. Open thread with a known person → Aida shows it learned their baseline.
2. Ambiguous message arrives → Aida decodes the real subtext, grounded in them.
3. Type a wounding reply → pulse fires → fix 3 words → send.
4. "It remembers them, so tomorrow's read is sharper."
