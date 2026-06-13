# Tier 6 — Review Again (UX)

> Final review. Does the UX serve the vision, and does it send anything back to be re-cut? UX drives; engineering serves.

## Checks

- **Disappears into use?** YES — a layer on a familiar thread, silent by default. ✓
- **Replaces threat-default with ground?** YES — the incoming read is the whole point; cold-start humility stops it manufacturing a false read. ✓
- **Prevents wounds?** YES — the outgoing pulse, the single intentional alarm. ✓
- **Doesn't deepen paranoia / erode self-trust?** Guarded by tentative language + confidence-gating + cold-start honesty. ✓

## Sent back to engineering (UX wins)

- Reads must **compute on message arrival** (so the marker exists before tap) — not lazily on tap. Pre-compute + cache.
- **Confidence-gating set conservatively:** prefer silence over a wrong read. *Cost:* some real subtext goes unflagged. **Accepted** — a missed read is recoverable; a false read feeds paranoia.

## Convergence

Converged architecture:

> **[per-person model]** → **[on-arrival read, gated by confidence + cold-start humility]** → **[ambient marker + tap-to-expand card]** for incoming; **[faint tint, or deliberate pulse + reframe]** for outgoing.
> Somatic Practicing as a separate mode. Memory auto-built, segment-deletable, never injected.

**Nothing left to remove without breaking the vision. Plan converged.**
