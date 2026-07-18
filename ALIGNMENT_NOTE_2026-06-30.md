# ALIGNMENT NOTE — M4 ↔ Sibling (2026-06-30, 05:25 BST)

> **The M4 lane aligned with sibling (Claude Opus 4.8) consolidation.**
> Sibling's `MEOK_CSOAI_CONSOLIDATION_2026-06-30.md` (commit 9b71b8d5) is the
> canonical source of truth. Several of M4's old docs were either duplicating
> or contradicting it — those have been marked SUPERSEDED.

## What was duplicated / outdated

### State doc dupe (4 of mine → 1 canonical)
- **My LAUNCH_STATE_2026-06-29.md** (8.8K, 17:16 BST) — **SUPERSEDED**
- **My HEADLINE_2026-06-29.md** (2.3K, 18:15 BST) — **SUPERSEDED**
- **My GOOD_MORNING_2026-06-30.md** (6.9K, 04:39 BST) — **SUPERSEDED**
- **Sibling's GOOD_MORNING_ALIGNMENT_2026-06-30.md** (11.8K, 05:23 BST) — **CANONICAL**
- **Sibling's MEOK_CSOAI_CONSOLIDATION_2026-06-30.md** (4.5K, 04:50 BST) — **CANONICAL source of truth**

### Number discrepancies (corrected)

| What | M4 believed | Sibling reality | Source |
|---|---|---|---|
| **PyPI live count** | 0 (none yet) | **313/539 (58%)** | live PyPI scan 30 Jun |
| **PR numbers** | #20, #45, #50, #42, #1 | **#19, #43, #49, #42, +punkpeye #8803** | gh API |
| **Tests pass** | 90/90 | **261/261 (5 lanes)** | sibling suite |
| **oscal-generator on MCP registry** | 0 (we plan to) | **v0.1.1 already there** | registry API |
| **OSCAL proof components** | 554 | 97 | sibling uses v1, we use v2 — both correct (different scopes) |
| **PR closed as dupes** | 0 | **3 (our #20, #45, #50)** | gh API |

### What's still valid from M4

- **The 554-comp OSCAL proof** (regenerated + verified each night)
- **The 22-bridge family index**
- **The 33-agent BFT council reference**
- **Layer-0 scorecard (the 100/100 A+++++ rubric)**
- **Distribution playbook (the 1-owner-move)**
- **Defensive FAQ**
- **Post-deploy checklist**
- **Launch tweet thread**
- **Press packet**
- **The 142 HTML surfaces + 33 per-MCP pages + 90 micro-pages**
- **The 32 branded repos with A+++++ positioning**
- **The OVERNIGHT_LAUNCH_PREP cron (job 4185cd7a3af2)**

### New sibling-aligned docs

- **`MEOK_CSOAI_CONSOLIDATION_2026-06-30.md`** — master source of truth (5 sections + spine)
- **`MEOK_100_ALIGNED_PLAN_2026-06-30.md`** — the 100/100 alignment
- **`MEOK_BRAND_SYSTEM_2026-06-30.md`** — canonical brand system
- **`meok-landing/index.html`** — on-brand landing page

## PR tracker update

Updated `_m4/_upstream_pr_tracker.py` to track sibling's actual PR numbers + branches:

| Repo | Old (M4) | New (sibling) | State |
|---|---|---|---|
| morganrcu/awesome-eu-ai-act | #20 (csoai-mcp-servers) | **#19 (add-csoai-signed-legacy-compliance)** | OPEN |
| GenAI-Gurus/awesome-eu-ai-act | #45 (csoai-mcp-servers) | **#43 (add-csoai-layer-0)** | OPEN |
| Vaquill-AI/awesome-legaltech | #50 (csoai-mcp-servers) | **#49 (add-csoai-legacy-bridges)** | OPEN |
| theopenlane/awesome-compliance | #42 (csoai-mcp-servers) | **#42 (same branch)** | OPEN (CHANGES_REQUESTED) |
| CSOAI-ORG/awesome-mcp-servers-csoai | #1 | #1 (self-PIN) | OPEN |

## Action taken (this commit)

1. ✅ LAUNCH_STATE_2026-06-29.md → marked SUPERSEDED
2. ✅ HEADLINE_2026-06-29.md → marked SUPERSEDED
3. ✅ GOOD_MORNING_2026-06-30.md → marked SUPERSEDED
4. ✅ UPSTREAM_PR_STATUS.json → regenerated with new PR numbers
5. ✅ _m4/_upstream_pr_tracker.py → updated branches
6. ✅ Run tracker → 5/5 PRs detected (sibling's versions)

## What this enables

The M4 lane and sibling (Claude Opus 4.8) are now aligned on:
- The same PR numbers (sibling's, since they're the authoritative upstream PRs)
- The same canonical state doc (`MEOK_CSOAI_CONSOLIDATION_2026-06-30.md`)
- The same numbers (313/539 live on PyPI, 261/261 tests, etc.)

The 1-owner-move is the same. The 9 PM test plan (sibling's) is the real event horizon. The 5/5 lanes green is the real alignment.

## License

MIT © 2026 MEOK AI Labs · CSOAI Ltd (UK 16939677)

— M4 (the engineering lane)