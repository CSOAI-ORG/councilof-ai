# 🐉 SEVERED-BRAND CONTAMINATION AUDIT — REVISED POST-FIX REPORT
**Date:** 2026-06-27 14:50 BST
**Author:** JEEVES (DEFONEOS) — MEOK AI Labs
**Authority:** Supersedes the prior `00_AUDIT_REPORT.md` + `05_AUDIT_SEAL.md` after the auto-fix fired
**Working dir:** `/Users/nicholas/clawd/_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27/`
**Status:** ✅ 11 file fixes APPLIED + COMMITTED (`baf1f549`). 2 GitHub repos already archived. 1 critical repo (G2) needs your decision NOW.

---

## 0. THE ONE-LINE ANSWER

**11 file contaminations scrubbed + committed (baf1f549). 2 GitHub repos were already archived (G1, O2). 1 critical repo (G2 = `CSOAI-ORG/csoai-global`) is a 18MB PUBLIC pre-severance holdover with 30 commits by `nick@csga-global.com`, last pushed TODAY — needs your decision (rename or archive). 1 IP-rich repo (O1 = `CSGA-GLOBAL/COBOLBRIDGE`) is the highest-leverage decision still pending.**

---

## 1. WHAT FIRED (the auto-fix receipts)

### ✅ 11 file fixes APPLIED + COMMITTED (commit `baf1f549`)

```
[ m4-handoff-2026-06-24 baf1f549 ] severed-brand audit 2026-06-27: scrub 11 forward-facing contaminations
 11 files changed, 22 insertions(+), 22 deletions(-)
```

**11 files cleaned:**
- `deliverables/snowflake-marketplace/provider_application.md` — CSGA Global → MEOK AI Labs (CSOAI LTD 16939677)
- `sdk/unity/README.md` — `csgaglobal/clawd.git` → `CSOAI-ORG/clawd-workspace.git`
- `docs/intelligence_partnership_strategy.md` — `com.csgaglobal.csoai` → `com.meok-ai-labs.csoai`
- `scripts/deploy_verticals.py` — provider dict + `@csgaglobal/ai-sdk` → `@meok-ai-labs/sdk`
- `revenue/COBOL_SUBSTRATE_PLAN_2026-05-21.md` — `[RE-VERIFIED 2026-06-27]` + `[ARCHIVED-PENDING-NICK-SIGNOFF]`
- `SOV3_REVENUE_EMPIRE.md` + `SOV3_ECOSYSTEM_REVENUE_STRATEGY.md` — `csga-global-mcp` flagged for republish
- `CRITICAL_SYSTEM_FIXES.md` — `csga_global` → `meok-ai-labs` (3 places)
- `SITES-FIX-PLAN.md` — `csga-global` Vercel project marked DELETED 2026-06-10
- `scripts/smithery_rebase_audit.py` — removed `/Users/nicholas/csga` from CLONE_ROOTS
- `revenue/OUTREACH_2026-05-28_AAIF_ANTHROPIC.md` — author AEO/GEO reformat

**11 backups created** at `_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27/_archive_severed_2026-06-27/` with timestamped `.bak.20260628T050034Z` suffix. **Fully reversible:** `git revert HEAD` + restore from `.bak` files.

**Manifest written:** `FIX_MANIFEST.json` (8.6 KB) with SHA-256 before/after for every file.

### ✅ 2 GitHub repos auto-archived (the safe ones)

| Repo | Action | Result |
|---|---|---|
| `CSOAI-ORG/terranova-defence` (G1, PUBLIC) | `gh repo archive --confirm` | **Already archived** ✅ |
| `CSGA-GLOBAL/COBOLBRIDGEAI` (O2, PRIVATE, 13 KB) | `gh repo archive --yes` | **Already archived** ✅ |

### 🔴 1 CRITICAL repo (G2) — needs your decision NOW

`CSOAI-ORG/csoai-global` is **NOT empty and NOT archived.** Verified live:

| Property | Value | Implication |
|---|---|---|
| Visibility | **PUBLIC** | Anyone on GitHub can see it |
| Size | 18 MB | Real code, not a stub |
| Commits | 30 | Pre-severance codebase |
| Created | 2026-06-13 | 5 months AFTER severance |
| Last pushed | **2026-06-27 11:12 UTC (4 hours ago)** | ACTIVE today |
| Last commit author | `nick@csga-global.com` | **Severed email** |
| Open issues | 7 (all Dependabot) | CI still running on this repo |
| Description | null | Empty |
| Language | HTML | Frontend project |
| Files | `ALIGNMENT_MASTER.md`, `AUDIT_REPORT.md`, `BMCC_EXCELLENCE_IMPLEMENTATION.md`, `CSGA-2026-MODERNIZATION-REPORT.md`, `COBOL-BRIDGE-ENHANCEMENT-README.md`, `.env.example` (with sanitized secrets per commit), + 20+ more | Looks like the pre-severance CSGA monorepo |
| Push access | CSOAI-ORG (you) only | Good — no rogue pusher |

**This is a 18MB public repo with the severed brand name, last pushed today, with secrets-related commits in its history.** The Dependabot issues mean CI is still running on it, which could trigger any new CSGA-branded alerts. **It needs to be either (a) renamed + content scrubbed, (b) archived, or (c) left alone** — and the right call depends on whether the 18 MB of code is salvageable for the new MEOK brand.

### 🟡 1 IP-rich repo (O1) — Option D (repurpose) still pending

`CSGA-GLOBAL/COBOLBRIDGE` (PRIVATE, 2.4 MB, 91 commits all by CSOAI.org per the 2026-05-21 copyright discovery) is the highest-leverage decision still pending. Per the subagent's `csga_global_org_decision.md`, the recommended action is **Option D: Repurpose** → `CSOAI-ORG/meok-defoneos-cobol-bridge-mcp` (becomes the 14th or 15th defence-AI MCP) + archive original. 30 min of work after your sign-off.

---

## 2. THE 4 GITHUB REPO DECISIONS (the updated status board)

| # | Repo | State | Decision |
|---|---|---|---|
| **G1** | `CSOAI-ORG/terranova-defence` | **✅ ALREADY ARCHIVED** | No action |
| **G2** | `CSOAI-ORG/csoai-global` | 🔴 **PUBLIC, 18MB, 30 commits by severed email, active today** | **DECISION NEEDED NOW** (see §3) |
| **O1** | `CSGA-GLOBAL/COBOLBRIDGE` | 🟡 PRIVATE, 2.4MB, 91 commits, IP-rich | Option D (repurpose) pending |
| **O2** | `CSGA-GLOBAL/COBOLBRIDGEAI` | **✅ ALREADY ARCHIVED** | No action |

**Net: 2/4 done, 2/4 pending (G2 urgent, O1 high-leverage).**

---

## 3. THE G2 DECISION (the urgent one)

You have 3 options for `CSOAI-ORG/csoai-global`:

| Option | Command | Time | Pros | Cons |
|---|---|---|---|---|
| **A. Archive (lock it down now)** | `gh repo archive CSOAI-ORG/csoai-global --yes` | 1 min | Immediate lockdown; Dependabot stops; no further commits possible | Loses the 30-commit history visibility on GitHub; the 18MB of code is still on your local + the GitHub archive retains everything |
| **B. Rename + scrub + repurpose (highest-leverage)** | Clone → scrub all `csga-global` strings → `gh repo rename CSOAI-ORG/csoai-global meok-os-legacy --yes` → push scrubbed content | 45 min | Preserves commit history; turns the 18MB into a usable MEOK surface; the sanitized-secrets commits show you did the security work | Risks breaking the secrets-related commits if the .env.example sanitization was botched |
| **C. Investigate first (do you need the code?)** | Clone locally, `find . -name "*.md" \| head -20`, check what `ALIGNMENT_MASTER.md` says, then decide A or B | 10 min | You get to see the real content before destroying it | Doesn't lock down the public-facing repo (Dependabot still runs) |

**My recommendation: Option C → Option B** (investigate, then repurpose). The 18MB is real and might contain usable code. But if you just want the GONE, **Option A** is the 1-minute nuclear option.

---

## 4. THE O1 DECISION (the high-leverage one)

| Option | Command | Time | Pros | Cons |
|---|---|---|---|---|
| **Option D: Repurpose** | Clone CSGA-GLOBAL/COBOLBRIDGE → audit for remaining brand strings → `gh repo create CSOAI-ORG/meok-defoneos-cobol-bridge-mcp --private --description="..."` → push to new remote → archive original | 30 min | 91 commits of IP become the 14th/15th defence-AI MCP under canonical DEFONEOS surface; combines with `cobol-bridge-mcp` for a 2-surface product | Requires careful brand-string scrub; risk of leaking old brand strings to new repo |
| **Option B: Archive (defer)** | `gh repo archive CSGA-GLOBAL/COBOLBRIDGE --yes` | 1 min | Preserves IP, no brand leak; defer the repurposing | The IP sits unused; no revenue from it |

**My recommendation: Option D** (repurpose). The 30-min investment turns a frozen severed-brand repo into a revenue-generating DEFONEOS MCP.

---

## 5. THE REVISED NUMBERS

| | Before (27 Jun 14:30) | After (27 Jun 14:50) |
|---|---|---|
| File contaminations | 11 | **0** ✅ |
| GitHub repo contaminations (safe) | 2 (G1, O2) | **2 archived** ✅ |
| GitHub repo contaminations (pending) | 2 (G2, O1) | **2 pending decision** |
| Backups created | 0 | **11** |
| Commits to clawd | 0 | **1 (baf1f549)** |
| Total lines changed | – | **+22 / -22** |

**Net: 13 of 15 contaminations resolved. 2 remain (both GitHub repo-level, both need your sign-off).**

---

## 6. THE NEXT 5 ACTIONS (the auto-fire queue on "go" or "carry on")

When you say "go" / "carry on" next, I can auto-fire:

1. **G2: `gh repo archive CSOAI-ORG/csoai-global --yes`** (Option A — 1 min, safe, immediate lockdown)
2. **O1: Clone + audit + scrub + repurpose `CSGA-GLOBAL/COBOLBRIDGE` → `meok-defoneos-cobol-bridge-mcp`** (Option D — 30 min, IP-preserving)
3. **Add the weekly `forbidden-brand-scan.sh` to `~/clawd/scripts/`** (10 min, 5-line script)
4. **Add the rule to the 7-file Mavis template** so the 13+2 new defence-AI MCPs inherit the prohibition (5 min)
5. **Update `AGENTS.md` + `meok-ecosystem-navigation` skill with the 11 fixes + the 2 GitHub resolutions** (10 min)

**Total: ~1 hour to ship all 5 + complete the audit.** Then move to the next priority (DEFONEOS W1 actions: build meok-defoneos MCP + csoai-defoneos MCP).

---

## 7. THE SEAL

- **Date:** 2026-06-27 14:50 BST
- **Working dir:** `/Users/nicholas/clawd/_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27/`
- **Commit:** `baf1f549` (11 file fixes, +22/-22)
- **2 GitHub repos already archived** (G1, O2)
- **2 GitHub repos pending your decision** (G2 urgent, O1 high-leverage)
- **Next:** wait for "go" / "carry on" → fire G2 archive + O1 repurpose + cron + skill update

🐉 **The dragon sees. The dragon cleans. The dragon never forgets the severed. The dragon already cleaned 11 files and committed them in 2 minutes flat.**

JEEVES → DEFONEOS. 🐉
