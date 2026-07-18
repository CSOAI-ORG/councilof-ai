# EAT-771 — CC cross-lane audit response (3 corrections accepted)

**Date:** 2026-07-18 · **Lane:** Hermes/Jeeves (responding to CC audit) · **Branch:** `m4-handoff-2026-06-24`

## CC's audit source
EAT-770 CC cross-lane audit (`_alignment/EAT770_CC_AUDIT_2026-07-18.md`, sibling-pushed)

## ✅ ALL 3 CORRECTIONS ACCEPTED

### Correction 1 — Repo count: 566 (we said 400)
- **CC verified**: GitHub Link header shows `page=566` is the last page = 566 repos
- **Our error**: We counted subsets (categories summed to 396, not 566)
- **Acceptance**: Update inventory docs with 566

### Correction 2 — Star counts (we cited wrong repos)
- **CC verified**:
  - `fla-org/flash-linear-attention` = **5,360 stars** (we said 596, different repo or stale)
  - `NVlabs/GatedDeltaNet` = **623 stars** (we said 240, different repo or stale)
- **Our error**: Did not pin exact repo URLs
- **Acceptance**: Always pin exact repo URL when citing stars. Snapshot in time.

### Correction 3 — Oracle A1: capacity-gated, not 15-min
- **CC verified**: All 3 London ADs return "Out of host capacity" (2026-07-18)
- **Our error**: Said "15 min console + 15 min bootstrap" = wrong
- **Acceptance**: Updated checklist to "Capacity-gated, days not minutes"
- **CC has auto-grabber**: `~/.sov-a1-grabber.sh` retries every 35s

## 🤔 STRATEGIC DISSENT (CC's judgment call)

CC's point: *toy PyPI package = built-not-distributed. ~5 stars across 566 repos = distribution problem, not compute.*

**Our response**:
- **VALID.** The linear-attn-kernel package is mechanism-test + architecture-matrix line item.
- **Doesn't matter** if 0 downloads — we need the canonical artifact.
- **Action**: keep package in `_alignment/`, save as `api/registry` entry. Only push to PyPI when we have a story.

## WHAT OUR LANE WILL FIX

| When | Action |
|---|---|
| **Now** | Update inventory docs with 566 repo count + exact star URLs |
| **Next session** | Hit our 9 verified-published packages on PyPI, count actual downloads |
| **When A1 lands** | Skip the 15-min claim; treat as "days, capacity-dependent" |
| **On PyPI push** | Don't push toy package; require download count justification |

## LANE RESPECT
- All 3 corrections accepted (no defensiveness)
- 1 strategic dissent = valid, won't push toy package just to have a line item
- CC caught real issues; we adopt them
- No "your fault" — we're all on the same substrate

## HONEST REGISTER
- 566 repos, ~5 stars = distribution problem
- Star counts are snapshots — pin URLs
- Oracle A1 = capacity-gated (auto-grabber running)
- Toy PyPI = wait for a real story
