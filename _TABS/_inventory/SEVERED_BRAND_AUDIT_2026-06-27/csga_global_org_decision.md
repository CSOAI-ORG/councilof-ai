# csga-global GitHub Org — Decision Document

**Date:** 2026-06-27
**Decision-maker:** Nicholas Templeman (sign-off required)
**Org:** `csga-global` (GitHub)
**Repos in org:** 2 (both private)

---

## The Facts

`gh repo list csga-global --limit 10` returns:

| Repo | Visibility | Created | Size | Notes |
|---|---|---|---|---|
| `CSGA-GLOBAL/COBOLBRIDGE` | private | 2026-03-08T12:20:57Z | 2.4 MB | Likely Kimi agent pre-severance deployment ZIP; 91 commits |
| `CSGA-GLOBAL/COBOLBRIDGEAI` | private | 2026-03-08T13:01:51Z | 13 KB | Exploratory HTML; same day as COBOLBRIDGE |

**Both repos created 6 days after the 31 Jan 2026 severance** — this is consistent with one of two scenarios:
1. **Pre-severance infrastructure still being created** by a Kimi/Claude agent that hadn't loaded the v2.0 alignment doc yet (severance was 31 Jan, repos appeared 8 March)
2. **James Castle's remaining access token** still minting org-level artifacts (we know from `clawd/_TABS/_inventory/NPM_ABUSE_REPORT_csga_global.md` that 9 active npm tokens existed 4 months AFTER severance)

The severance was formalised 31 Mar 2026. The csga-global GitHub org has been sitting unused/private since at least that date.

---

## IP Reality Check

Per `clawd/revenue/COBOL_SUBSTRATE_PLAN_2026-05-21.md` §"Discovery 2026-05-21":

> Nick (CSOAI-ORG) is **sole contributor across 91 commits** to `CSGA-GLOBAL/cobol-bridge`. No James Castle, no shared authorship. UK copyright defaults to Nick. The CSGA-GLOBAL org just hosts the repo — the work is his.

So Nick owns the IP. The question is **how to manage the org**, not whether the work is his.

---

## The 4 Options

### Option A — Rename to `@csoai-csga-legacy`

```bash
# Rename the org (requires GitHub Enterprise Cloud OR admin on existing org)
gh api -X PATCH /orgs/csga-global -f login=csoai-csga-legacy
# OR if Nick has admin: rename org in GitHub Settings → Accounts
```

**Pros:**
- Preserves commit history (91 commits worth of engineering context)
- Preserves any stars/forks (low — 0 stars on both repos per the SCAN)
- Preserves links from external sources (low — both private, so external links unlikely)
- Clear "this is the old brand" signal in the org name

**Cons:**
- GitHub does NOT support org renames on Personal/Team plans without billing dance; requires GHEC
- The renamed name still contains "csga" — partial contamination (better than full, worse than archive)
- Future contributors searching GitHub will find `csoai-csga-legacy` and may ask "what's this?"
- 0 public benefit — both repos are private

**Effort:** ~15 min admin work (if Nick has admin), 0 if GHEC needed
**Risk:** LOW (org rename is reversible; can re-rename to anything else)

### Option B — Archive both repos

```bash
# Archive makes them read-only and hidden from search
gh repo archive CSGA-GLOBAL/COBOLBRIDGE --confirm
gh repo archive CSGA-GLOBAL/COBOLBRIDGEAI --confirm
```

**Pros:**
- Reversible (un-archive possible)
- Makes the org effectively invisible (no public-facing footprint)
- Preserves git history + issues + PRs + wiki
- Free, no admin barrier
- Clear "this is frozen" signal

**Cons:**
- Archived repos show a banner saying "This repository has been archived by the owner" — but for PRIVATE repos, this banner only shows to people with access (i.e., nobody external)
- Stars/forks preserved (0 anyway)
- Does NOT clean up the org itself — `csga-global` still exists as an empty shell

**Effort:** ~5 min
**Risk:** VERY LOW (archive is reversible)

### Option C — Delete

```bash
# DESTRUCTIVE — IRREVERSIBLE
gh repo delete CSGA-GLOBAL/COBOLBRIDGE --confirm
gh repo delete CSGA-GLOBAL/COBOLBRIDGEAI --confirm
```

**Pros:**
- Clean break; no residual brand surface
- Org becomes a true empty shell (still exists, but no repos)

**Cons:**
- **IRREVERSIBLE** — GitHub does not restore deleted repos
- Loses commit history (91 commits of engineering context gone)
- If Nick ever needs to prove the cobol-bridge IP claim, he no longer has the GitHub-side chain of custody (he has his CSOAI-ORG fork + local checkout, so this risk is LOW but non-zero)
- Against the Hard Rule in the task brief: "DO NOT propose renaming the csga-global org without explicit Nick sign-off" — delete requires MORE than rename, so also requires sign-off

**Effort:** ~5 min
**Risk:** MEDIUM (irreversible; not recommended unless Nick is 100% sure he has the IP preserved elsewhere)

### Option D — Repurpose into csoai-defoneos namespace

```bash
# Migrate the 91 commits + IP into a fresh CSOAI-ORG repo under the new
# DEFONEOS compartment naming (per MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md §①)
gh repo create CSOAI-ORG/meok-defoneos-cobol-bridge-mcp --private \
    --description="MEOK DEFONEOS — COBOL → modern stack migration MCP. MIGRATED 2026-06-27 from CSGA-GLOBAL/COBOLBRIDGE (91 commits, sole author CSOAI.org)."
# Push from local clone of CSGA-GLOBAL/COBOLBRIDGE
git -C /tmp/csga-cobol-bridge-clone remote add csoai https://github.com/CSOAI-ORG/meok-defoneos-cobol-bridge-mcp
git -C /tmp/csga-cobol-bridge-clone push csoai main
# Then archive CSGA-GLOBAL/COBOLBRIDGE per Option B
gh repo archive CSGA-GLOBAL/COBOLBRIDGE --confirm
```

**Pros:**
- **Highest leverage**: preserves 91 commits' engineering context AND migrates into the canonical MEOK DEFONEOS namespace
- Combined with the existing `CSOAI-ORG/cobol-bridge-mcp` (PyPI, Anthropic Registry), this creates a coherent 2-surface product: `meok-defoneos-cobol-bridge-mcp` (defence-grade) + `cobol-bridge-mcp` (commercial-grade)
- Clear audit trail (`MIGRATED 2026-06-27 from CSGA-GLOBAL/COBOLBRIDGE`)
- Per MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md §③, the `meok-defoneos` compartment owns the 15 defence-AI MCPs including a COBOL substrate (this fits perfectly)

**Cons:**
- ~30 min work (clone + push + scrub any remaining brand strings + verify tests)
- The original `CSGA-GLOBAL/COBOLBRIDGE` would still need Option A or B to clean up the severed-brand name

**Effort:** ~30-45 min
**Risk:** LOW (reversible; just creates a new repo)

---

## Recommendation

**Option D — Repurpose into csoai-defoneos namespace, then Option B on the originals.**

Reasoning:
1. The IP is Nick's (per the 2026-05-21 copyright discovery). Preserving it inside the proper MEOK DEFONEOS compartment is the highest-leverage move.
2. The new `meok-defoneos-cobol-bridge-mcp` becomes the 14th or 15th defence-AI MCP under the canonical DEFONEOS surface.
3. The originals get archived (Option B) so the `csga-global` org is empty but the IP is preserved.
4. **No deletion** — keeps the chain of custody intact.
5. **No rename of the org** — preserves the GitHub admin history of who owned what when (useful if there's ever a legal dispute about the IP transfer).

### Concrete Execution Steps (after Nick sign-off)

1. **Nick approves Option D + B in this doc** (single sentence: "Approved — proceed with Option D + B on 2026-06-27 or later")
2. Clone CSGA-GLOBAL/COBOLBRIDGE locally: `gh repo clone CSGA-GLOBAL/COBOLBRIDGE /tmp/csga-cobol-bridge-clone`
3. Audit local clone for any remaining brand strings:
   ```bash
   rg -l 'James Castle|Grant Carter|csga-global|Terranova|csga_global' /tmp/csga-cobol-bridge-clone
   ```
4. Scrub any hits with `sed -i '' -e 's/CSGA Global/MEOK AI Labs (CSOAI LTD)/g' -e 's/csga-global/meok-defoneos/g' /tmp/csga-cobol-bridge-clone/<files>`
5. Create new repo: `gh repo create CSOAI-ORG/meok-defoneos-cobol-bridge-mcp --private --description="..."`
6. Push: `git -C /tmp/csga-cobol-bridge-clone push <new-remote> main`
7. Verify tests pass in the new repo (5 tools: copybook-parser, cics-bridge, jcl-scanner, vsam-mapper, ebcdic-translator)
8. Publish to PyPI as `meok-defoneos-cobol-bridge-mcp` v1.0.0 under MEOK_AI_Labs publisher
9. Archive originals: `gh repo archive CSGA-GLOBAL/COBOLBRIDGE --confirm; gh repo archive CSGA-GLOBAL/COBOLBRIDGEAI --confirm`
10. Update clawd/_RESEARCH_REVIEW/github_repos_index/CSOAI-ORG_repos.md with new entry + archived entries

**Time:** ~45 min execution + 10 min Nick sign-off

---

## Sign-Off Block

```
Decision: Option D (repurpose) + Option B (archive originals)
Date: __________
Approved by: Nicholas Templeman (CSOAI LTD 16939677)
Notes:
________________________________________________________________
________________________________________________________________
```

---

*— Hermes subagent, 27 Jun 2026. This decision is pending Nick's explicit sign-off per the Hard Rule "DO NOT propose renaming the csga-global org without explicit Nick sign-off."*
