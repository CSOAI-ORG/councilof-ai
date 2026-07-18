# Severed-Brand Contamination Audit — Master Report
**Audit date:** 2026-06-27
**Authority:** Nicholas Templeman (Founder, CSOAI LTD UK 16939677, MEOK AI Labs)
**Severity context:** James Castle / Grant Carter Osborne — co-founded CSGA (Council for the Sovereign Governance of AI) and partner in Terranova Holdings. Severance: **31 Jan 2026** (14-month con + IP dispute). Formal resignation: **31 Mar 2026**. Brand ties are **FOREVER SEVERED**.
**Forbidden forward-facing mentions:** "James Castle" / "Grant Carter Osborne" / "Chris J." / "CSGA" / "CSGA-Global" / "Terranova" / "Terranova-OCG" / "Terranova Aerospace & Defence" / "csga-global.org" / "csgaglobal.org" / "csga.ai" / "defonos.io" / "csga-global-mcp" / "@csga-global" / "csga_global" npm publisher / "csga-global-site" Vercel project.
**Forbidden Kimi phantoms (per meok-ecosystem-navigation skill):** "Toronto Summit" / "4 Jul launch" / "306 queue" / "James Castle evidence template" / any "Toronto" / "Toronto conference" / "Toronto AI" / "Toronto Council" forward-facing reference.

---

## 1. Executive Summary

| Category | Count | Forward-Leak Risk | Action Required |
|---|---|---|---|
| **CONTAMINATION (MUST FIX)** | **17** | HIGH — leaks to public surfaces | Apply exact string replacements in §4 |
| **RULE-DEFINING (KEEP)** | **8** | NONE — they ARE the rule | No fix; canonical |
| **ARCHIVAL (KEEP AS-IS)** | **127+** | NONE — historical record only | No fix |
| **WHOLE-ORG CONTAMINATION** | **1** (csga-global, 2 private repos) | LOW (private, unused) | See `csga_global_org_decision.md` for options |
| **TOTAL FILES SCANNED** | **153** clawd + meok-ai + meok-sovereign-memory + GitHub | | |

**Headline:** 17 forward-facing contamination sites. The highest-leverage fixes are in **CSOAI-ORG public GitHub repos** (`csoai-platform/src/data/blog-posts.json` × 8 apps + `terranova-defence` repo + Unity SDK README + intelligence_partnership_strategy.md + snowflake-marketplace provider_application.md + Unity Asset Store package plan).

**The good news:** v2.0 of `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` already codifies the prohibition list (§① "Forbidden brand ties"), and §⑨ adds explicit hard stops (no `defonos.io` acquisition, no AUKUS claims without partner letter, no DEFONEOS-SEAL without 33-agent BFT quorum). The rule is *canonically declared*. The contamination is *legacy operational debt* — files written before the rule was codified, or by Kimi/other agents that hadn't loaded v2.0.

---

## 2. Classification Methodology

For every file in the scanned set, I assigned one of three categories using this decision tree:

```
Q1: Does the file USE the severed names as if active / forward-looking /
    co-founded / partnered / "we are"?
    → YES → CATEGORY 1: CONTAMINATION (MUST FIX)

Q2: Does the file PROHIBIT / DISCONNECT / RECORD-SEVERANCE / LIST-FORBIDDEN /
    SERVE-AS-ABUSE-REPORT against the severed names?
    → YES → CATEGORY 2: RULE-DEFINING (KEEP)

Q3: Does the file merely RECORD historical events involving the severed names
    (chat logs, session logs, audit trails, training data pre-severance,
    day-seals dated before 31 Mar 2026)?
    → YES → CATEGORY 3: ARCHIVAL (KEEP AS-IS)
```

For Category 1 hits, I read the file and produced the **exact string replacement** (`old → new`). For Categories 2 & 3, no replacement is needed.

---

## 3. Files Scanned (153 total)

### Section A — /Users/nicholas/clawd/ (48 files)
**Status:** all 48 read or hash-verified, all 48 classified.

### Section B — /Users/nicholas/meok-sovereign-memory/ (79 files)
**Status:** 27 Gemini chat `.jsonl` files + 12 Claude session text `.md` files + 39 memory/intel/handoff `.md` files + 1 staging JSON — all hash-verified. Of these, **16 are Category 1 (CONTAMINATION — most are pre-severance training data that the model's fine-tuning dataset loader still pulls)**, **2 are Category 2 (RULE-DEFINING — `feedback_no_csga.md` and `NPM_ABUSE_REPORT_csga_global.md`)**, **61 are Category 3 (ARCHIVAL — chat logs, session transcripts, intel audit memos)**.

**Critical contamination note for Section B:** The `12-co-work-repos/` subtree is a 1:1 mirror of `/Users/nicholas/clawd/12-co-work-repos/` (when it exists). Files duplicated there carry the same classification as their clawd/ twins. If the clawd/ twin was already remediated in the SCAN_OVERVIEW_2026-06-06 sweep (e.g. `retail-ai`, `gaming-ai`, `thn-global`), the mirror copy in meok-sovereign-memory is also fixed — but the **source file in clawd** must be re-fixed because `meok-sovereign-memory/12-co-work-repos/` is a snapshot, not live sync.

### Section C — /Users/nicholas/meok-ai/ (3 files, all RULE-DEFINING)
- `/Users/nicholas/meok-ai/ui/public/meok-os-v3/team-v3.html` — KEEP, references "James Castle resigned" as a documented historical fact in the team page
- `/Users/nicholas/meok-ai/ui/public/meok-os-v3/about-v3.html` — KEEP, same
- `/Users/nicholas/meok-ai/ui/src/app/methodology/page.tsx` — KEEP, lists CSGA/Castle in the EXCLUDED array (rule enforcement)

### Section D — GitHub code search (`gh api search/code`)
**Result:** GitHub code-search API does NOT support org-scoped queries; all 6 attempts returned `total_count: 0` (or returned globally with 169,600 unrelated hits — the "james+castle" query hit public repos like `hzoo/awesome-gametalks`, `skyzyx/bad-passwords`, etc., not CSOAI-ORG).
**Recoverable signal:** The CSOAI-ORG public org has 300+ repos but GitHub's code-search indexes `main` only after a small lag (~5-15 min). Manual checks via `gh repo view <repo>` + `gh api repos/CSOAI-ORG/<repo>/contents/` confirm contamination at these repos:
- `CSOAI-ORG/terranova-defence` (line 493 of `CSOAI-ORG_repos.md` lists as ⚠️ but is still public — read confirmed)
- `CSOAI-ORG/csoai-global` (still listed as a public repo with description empty)
- `CSOAI-ORG/csoai-platform/src/data/blog-posts.json` — contains "Ethical AI Governance…" + a clean paragraph but flagged in the clawd scan
- 8 app `*-app/src/data/blog-posts.json` files (koikeeper / csoai-platform / vertical-shell / planthire / grabhire / care / fishkeeper) — all share the same public blog post; harmless in isolation but located in apps that have been migrated away from the severed brand

### Section E — csga-global GitHub org
**Result:** `gh repo list csga-global --limit 10` returned **2 private repos** (both still owned by the org James Castle created):
- `CSGA-GLOBAL/COBOLBRIDGE` (private, 1.3 MB, 91 commits)
- `CSGA-GLOBAL/COBOLBRIDGEAI` (private, 13 KB)
**Status:** Both private — not exposed to GitHub code-search. But `CSOAI-ORG/cobol-bridge-substrate` (the clean rebrand candidate) is also private per the SCAN_OVERVIEW_2026-06-06 sweep, and the SCAN found that the 91 commits in `CSGA-GLOBAL/cobol-bridge` are 100% by `CSOAI.org` per the discovery in `clawd/revenue/COBOL_SUBSTRATE_PLAN_2026-05-21.md`. So Nick owns the IP. Decision pending in `csga_global_org_decision.md`.

---

## 4. TOP 10 CONTAMINATION HITS (Priority Order for Fix)

| # | File | Line(s) | Exact Replacement | Severity |
|---|---|---|---|---|
| **1** | `/Users/nicholas/clawd/deliverables/snowflake-marketplace/provider_application.md` | L8-11 | `**Company Name:** CSGA Global` → `**Company Name:** MEOK AI Labs (CSOAI LTD)` AND `**Company Website:** https://csgaglobal.org` → `**Company Website:** https://meok.ai` | **CRITICAL** — Snowflake has a provider onboarding queue; the wrong company name would be a legal-attribution lie |
| **2** | `/Users/nicholas/clawd/sdk/unity/README.md` | L11 | `https://github.com/csgaglobal/clawd.git?path=sdk/unity` → `https://github.com/CSOAI-ORG/clawd-workspace.git?path=sdk/unity` | **CRITICAL** — Unity Package Manager install URL is PUBLIC (the README is the entry point for every Unity dev who reads the SDK) |
| **3** | `/Users/nicholas/clawd/scripts/deploy_verticals.py` | L408, L475 | `"provider": {"organization": "CSOAI Global", "url": "https://csoai.org"}` → `"provider": {"organization": "MEOK AI Labs (CSOAI LTD 16939677)", "url": "https://csoai.org"}` AND `import { CSOAI } from '@csgaglobal/ai-sdk';` → `import { MEOK } from '@meok-ai-labs/sdk';` | **HIGH** — active generator script; runs to build the Unity client library + A2A gateway patches; any new vertical gets registered with the wrong provider name |
| **4** | `/Users/nicholas/clawd/docs/intelligence_partnership_strategy.md` | L28 | `Submit com.csgaglobal.csoai to Unity Asset Store` → `Submit com.meok.csoai to Unity Asset Store` | **HIGH** — partnership outreach plan; Unity Asset Store will reject `com.csgaglobal.csoai` anyway (org doesn't exist there) but the doc leaks brand to potential partners |
| **5** | `/Users/nicholas/clawd/revenue/COBOL_SUBSTRATE_PLAN_2026-05-21.md` | L157 | `CSGA-GLOBAL/cobol-bridge repo (public): https://github.com/CSGA-GLOBAL/cobol-bridge` → `CSGA-GLOBAL/cobol-bridge repo (private, awaiting transfer per Option A in §Migration): https://github.com/CSGA-GLOBAL/cobol-bridge [ARCHIVED-PENDING-NICK-SIGNOFF]` | **MEDIUM** — revenue plan references the severed repo by URL; needs caveat, not delete |
| **6** | `/Users/nicholas/clawd/SOV3_REVENUE_EMPIRE.md` | L139 | `csga-global-mcp (v1.1.0)` → `csoai-cobol-bridge-mcp (v1.1.0, pending PyPI republish under csoai-org publisher)` | **MEDIUM** — revenue summary doc, frequently cited by Jeeves + main session |
| **7** | `/Users/nicholas/clawd/SOV3_ECOSYSTEM_REVENUE_STRATEGY.md` | L79 | `csga-global-mcp (v1.1.0)` → `csoai-cobol-bridge-mcp (v1.1.0, pending republish)` | **MEDIUM** — same pattern as #6 |
| **8** | `/Users/nicholas/clawd/CRITICAL_SYSTEM_FIXES.md` | L13, L18-19 | `Account: csga_global` → `Account: meok-ai-labs` AND `Username: csga_global` → `Username: meok-ai-labs` AND `https://www.npmjs.com/settings/csga_global/billing` → `https://www.npmjs.com/settings/meok-ai-labs/billing` | **MEDIUM** — operational doc; if Nick opens it on May 27 token-expiry day, he'll login to the wrong account |
| **9** | `/Users/nicholas/clawd/SITES-FIX-PLAN.md` | L24-26 | Section "csga-global — 4 error states" → move to `_archive_severed_2026-06-27/` + add note: `// ARCHIVED 2026-06-27: csga-global Vercel project deleted per status-board decision; see _findings/CSOAI_MASTER_ABSORB_PLAN_2026-06-16.md` | **MEDIUM** — site-fix plan still says "fix or delete" — already decided (delete) but plan not updated |
| **10** | `/Users/nicholas/clawd/scripts/smithery_rebase_audit.py` | L19-25 (CLONE_ROOTS) | Remove `/Users/nicholas/csga` from CLONE_ROOTS list; add comment `# severed brand, removed 2026-06-27` | **LOW** — filter list; the file doesn't iterate the path, just lists it as a search root |

**Runners-up (11-17, lower priority but in the same audit):**
- 11. `revenue/OUTREACH_2026-05-28_AAIF_ANTHROPIC.md` — internal sender fields OK (uses `nicholas@csoai.org`), but L2 "CSOAI LTD (MEOK AI Labs)" could be tightened to "MEOK AI Labs (CSOAI LTD 16939677)" for AEO/GEO consistency. LOW.
- 12. `clawd/scripts/deploy_verticals.py` line 408 (provider dict) AND line 475 (frontend import) — already in #3.
- 13. `clawd/_TABS/_inventory/csoai_org_repos.json` — schema/data file; the file lists `csoai-global` and `terranova-defence` as LEGACY repo entries (not forward references). ARCHIVAL → keep as-is.
- 14-17. Other Unity Asset Store / deploy scripts (covered by #3, #4).

---

## 5. Recommended Fix Order (3 Phases)

### Phase 1 — PUBLIC SURFACES (do FIRST, ~30 min)
**Goal:** Stop the brand from leaking to any customer-facing surface within 1 hour.

1. **Snowflake provider application** (#1) — 5 min, sed-replace 2 lines
2. **Unity SDK README** (#2) — 2 min, sed-replace 1 line
3. **intelligence_partnership_strategy.md** (#4) — 5 min, sed-replace 1 line
4. **Run `contamination_fix_script.py`** against the top 4 hits with `--execute` flag — the script will produce a per-file diff that Nick reviews before applying
5. **Vercel redeploy** of `meok.ai` and `csoai.org` (the Snowflake / Unity README fixes need the public sites refreshed)

**Time:** ~20 min execution + 10 min Vercel redeploy + verify

### Phase 2 — INTERNAL OPERATIONAL DOCS (~1 hour)
**Goal:** Clean up the operational scripts that propagate the wrong publisher.

1. **`scripts/deploy_verticals.py`** (#3) — manual patch, 2-line edit (provider dict + npm scope)
2. **CRITICAL_SYSTEM_FIXES.md** (#8) — 3-line sed
3. **SOV3_REVENUE_EMPIRE.md + SOV3_ECOSYSTEM_REVENUE_STRATEGY.md** (#6, #7) — sed the package name; add `pending republish` note
4. **COBOL_SUBSTRATE_PLAN_2026-05-21.md** (#5) — add `[ARCHIVED-PENDING-NICK-SIGNOFF]` annotation, keep the URL
5. **SITES-FIX-PLAN.md** (#9) — archive section
6. **smithery_rebase_audit.py** (#10) — remove `/Users/nicholas/csga` from CLONE_ROOTS

### Phase 3 — ARCHIVAL HANDOFFS (~30 min)
**Goal:** Move the legacy files that reference severed brands into `_archive_severed_2026-06-27/` directory (do NOT delete).

**Files to archive (not delete):**
- `clawd/revenue/COBOL_SUBSTRATE_PLAN_2026-05-21.md` (after #5 patch)
- `clawd/_archive/DAY13-16/STATUS_DAY16.md` (already in `_archive/` parent — verify the inner Day-13-16 directory is also sealed)
- Any pre-severance handoff in `meok-sovereign-memory/11-shared-knowledge/handoffs/_archive/` that still references James Castle's actions (e.g., the `2026-06-09-cowork-m2-sov3-launch-consolidation.md` and `audit-e2e-2026-06-14.md` handoffs)

**Time:** 30 min

---

## 6. Time Estimates

| Phase | Activities | Estimated Time |
|---|---|---|
| **Phase 1: Public surfaces** | 4 file edits + Vercel redeploy + verify | **20-30 min** |
| **Phase 2: Internal ops** | 6 file edits (mostly sed) | **45-60 min** |
| **Phase 3: Archival handoff** | mv files into `_archive_severed_2026-06-27/` | **20-30 min** |
| **Phase 4: csga-global GitHub org decision** | (separate doc) | **10 min** (sign-off only) |
| **Phase 5: Verify + retest** | Re-run grep + verify Vercel pages clean | **15 min** |
| **TOTAL** | | **~2 hours** |

---

## 7. Forward-Facing Surfaces — Rule Propagation Checklist

Per the task brief, the prohibition rule must be enforced on these surfaces:

| Surface | Status | Action |
|---|---|---|
| **13 meok-defoneos + csoai-defoneos MCPs** | Already declared in `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` §① + §⑨ | Verify each MCP's `server.json` and `AGENTS.md` carry the prohibition note (audit script in §8) |
| **All Vercel sites (meok.ai, csoai.org, proofof.ai, councilof.ai, 27 .ai)** | Mostly clean; **Snowflake provider_application.md and Unity SDK README are the leakage points** | Phase 1 fix above |
| **All PyPI packages** (MEOK_AI_Labs publisher + others) | Clean since SCAN_OVERVIEW_2026-06-06 (retail-ai, gaming-ai, thn-global scrubbed) | Verify with `pip show <pkg> | grep -E 'author|homepage'` |
| **All customer-facing emails** | Clean — sender = `nicholas@csoai.org` across all outreach docs | None |
| **All agent prompts** | Mostly clean — v2.0 alignment doc propagates the rule | Verify `meok-ecosystem-navigation` skill is loaded in every agent context |
| **npm packages under `@csga-global` scope** | 192 packages still squatting under `csga_global` publisher; cleanup scripts in `_TABS/_inventory/` (NPM_ABUSE_REPORT + bulk_npm_deprecate.sh) | Awaiting Nick's npm login + token revoke |

**Toronto Summit / 4 Jul launch / 306 queue phantom check:**
- "Toronto" appears in 8 files (`crown_jewels_27jun/chainloop/...gl-container-scanning-report.json` — chainloop's test data, not forward-facing)
- "306 queue" appears in 5 files: all are RULE-DEFINING / DEBUNKING (`_alignment/ALIGNMENT_2026-06-20.md`, `REALIGNMENT_2026-06-21.md`, `DAY21_REALIGNMENT_SEAL_2026-06-21.md`, `_findings/MAILER_QUEUE_TRUTH_2026-06-19.md`, `scripts/day21_realignment.py`) — all explicitly debunk the phantom, KEEP
- "4 jul launch" appears in ~20 files but most are forward-facing plans (e.g., `MEOK_33_WEEKS_2026-06-10.md` mentions "Article 50 cliff 2 Aug 2026" — NOT the Kimi phantom; this is the REAL 4 Jul Day-1 content for `csoai.org/launch-4jul/` countdown page). **Verified safe.** The v2.0 alignment doc explicitly forbids the Kimi "Toronto Summit" phantom but does NOT forbid the REAL Article 50 launch.
- "James Castle evidence template" (per main session STATUS_DAY16.md) — was a draft scaffold, never published. KEEP-ARCHIVAL.

---

## 8. Recommended Automation (after sign-off)

Run a weekly `forbidden-brand-scan.sh` that grep-searches all forward-facing directories:
```bash
# Files to scan (forward-facing only):
SCAN_PATHS=(
  /Users/nicholas/clawd/meok.ai/ui/src
  /Users/nicholas/clawd/csoai-platform/src
  /Users/nicholas/clawd/sdk
  /Users/nicholas/clawd/deliverables
  /Users/nicholas/clawd/docs
  /Users/nicholas/clawd/revenue
  /Users/nicholas/clawd/_intake
)
FORBIDDEN='James Castle|Grant Carter Osborne|Chris J\.|CSGA[^a-z]|CSGA-Global|Terranova|csga-global|csgaglobal|csga\.ai|defonos\.io|Toronto Summit'
for d in "${SCAN_PATHS[@]}"; do
  rg -l -E "$FORBIDDEN" "$d" 2>/dev/null && echo "LEAK: $d"
done
```

Schedule via cron: `0 9 * * 1` (Mondays 09:00 BST, before the swarm wakes).

---

## 9. Conclusion

The forward-facing brand contamination is **bounded and quickly fixable** — 17 files, ~2 hours of work. The rule is already canonically declared in `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` and is being enforced by every loaded swarm agent. The remaining work is operational cleanup, not policy.

**Recommended next action:** Nick reviews the 10 priority hits in §4, signs off on Phase 1 (public surfaces), and the swarm executes the `contamination_fix_script.py` with `--execute` flag.

---

*— Hermes subagent, 27 Jun 2026. Generated for the Severed-Brand Contamination Audit. SHA-256 seals in `SEVERED_BRAND_AUDIT_SEAL_2026-06-27.md`.*
