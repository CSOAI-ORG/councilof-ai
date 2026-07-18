# 🚨 CSGA-GLOBAL NPM SQUAT — FULL AUDIT REPORT
**Date:** 2026-06-12 · **Tool:** `/tmp/multi_registry_audit.py` + `openmcp.py npm-status`
**Raw data:** `clawd/_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl`
**Auditor:** Mavis root orchestrator (mvs_1318b92a77e54d7592c8d57a60346063)

---

## 1. ONE-LINE FINDING

**The severed brand `csga_global` (maintainer email `Nicholastempleman@gmail.com`) has published
192 of our 341 PyPI package names on npmjs.org as competing packages — including the two most
user-facing ones, `meok-sdk-ts@3.1.0` (118 downloads/week) and `meok-setup@1.1.0` (9 dl/wk).**
**Public web surfaces (csoai.org, meok.ai, proofof.ai) are clean (0 CSGA references).**
**Contamination is npm-only.**

---

## 2. NUMBERS

| Metric | Count |
|---|---|
| Local PyPI packages audited | **341** |
| Live on PyPI | 298 (87%) |
| Missing on PyPI (drip publisher backlog) | 43 (13%) |
| **Live on npm (any publisher)** | **197 (58%)** |
| **Live on npm by `csga_global` (squat)** | **192 (56%)** |
| Live on npm by other publishers (legit forks) | 5 (1.5%) |
| **csga_global weekly downloads (all 192 squats)** | **135** |
| **`meok-sdk-ts@3.1.0` weekly downloads** | **118** |
| `meok-setup@1.1.0` weekly downloads | 9 |
| CSGA references on csoai.org, meok.ai, proofof.ai, csoai-org-v2.vercel.app, csoai-platform.vercel.app | **0 (all clean)** |
| CSGA references in `delboy/*` source files | 4 (all are "scrub this" guardrails — intentional) |

---

## 3. THE TWO PRODUCTS YOU CARE ABOUT

### A. `meok-sdk-ts@3.1.0` (118 dl/wk — actively harming us)

| Field | Value |
|---|---|
| npm package | https://www.npmjs.com/package/meok-sdk-ts |
| Publisher (npm) | `csga_global <Nicholastempleman@gmail.com>` ❌ wrong identity |
| Local source author | `Nicholas Templeman <nicholas@meok.ai>` ✓ correct |
| Homepage (npm) | `https://haulage.app` ❌ wrong (haulage was an old project) |
| Homepage (local source, FIXED) | `https://meok.ai` ✓ |
| Local git history | `b6f68f5 release: v3.1.0 published to npm` |
| License | MIT |
| Description | Official TypeScript SDK for the MEOK Attestation API — sign + verify HMAC-signed compliance attestations across the MEOK trade-compliance ecosystem. |
| CSGA in source/README | No |

**This is your real product** — the local copy at `/Users/nicholas/clawd/meok-sdk-typescript/` is yours, but the **npm token used to publish it was the `csga_global` account** (which now is severed from you). Anyone doing `npm install meok-sdk-ts` gets the csga-published version.

### B. `meok-setup@1.1.0` (9 dl/wk)

Publisher: `csga_global` · Description: "Install MEOK AI compliance MCP servers for Claude Desktop, Cursor, VS Code, and more" · Repo: `CSOAI-ORG/meok-setup` (exists, ours).

### C. 190 other PyPI-name squatters (most with 0 dl/wk)

Each is `csga_global <Nicholastempleman@gmail.com>` at version 1.0.0 (or 1.0.1), each with a generic `*-ai-mcp` description. **They squat our names but get no real traction** — the harm is supply-chain (users might install the wrong package) + brand (a search for "proofof-ai-mcp" on npm returns csga_global first).

---

## 4. HIGH-VALUE COMPLIANCE SQUATS (5/20 top-PyPI)

| PyPI name | npm squat? | npm dl/wk |
|---|---|---|
| `eu-ai-act-compliance-mcp` (2,810 dl/mo on PyPI) | 🚨 YES | 0 |
| `dora-compliance-mcp` (2,690 dl/mo) | ✓ not squatted | — |
| `cra-compliance-mcp` (1,898) | ✓ not squatted | — |
| `ai-bom-mcp` (1,846) | ✓ not squatted | — |
| `gdpr-compliance-ai-mcp` (1,794) | 🚨 YES | 0 |
| `iso-42001-ai-mcp` (1,714) | 🚨 YES | 0 |
| `agent-identity-trust-mcp` (941) | 🚨 YES | 5 |
| `care-membrane-mcp` (609) | 🚨 YES | 0 |

(Other 12 of top-20 not squatted — good news.)

---

## 5. ROOT-CAUSE: HOW DID THIS HAPPEN?

Most likely scenario (from evidence):
1. Pre-sever, you published these npm packages under the `csga_global` account (with email `Nicholastempleman@gmail.com` — different casing/auth than `nicholas@meok.ai`).
2. The sever happened (Jan 2026 per the user profile). The npm account is technically still active but you no longer have access (csga_global ≠ your new meok-ai-labs identity).
3. The local copy in `clawd/meok-sdk-typescript/` is yours (correct author in package.json), but the *publish step* uses the csga_global token that's now severed from you.
4. Someone (or automation) is still using that token — possibly Kilo's older pipeline, or a leftover CI config.

**This is not a hack.** It's an account-cleanup gap from the sever: npm was never migrated to the new identity.

---

## 6. REMEDIATION (4 steps, ranked by £-leverage)

### Step 1 — ROLL THE EXPOSED NPM TOKEN (do first, security)
- The `csga_global` npm token is on a machine somewhere (Kilo's old CI, or your old laptop, or a CI secret).
- **Revoke via `npm token revoke`** or by logging into the csga_global npm account and changing the password (forces all sessions to re-auth).
- Time: 2 minutes, do it from the csga_global account.

### Step 2 — FILE NPM ABUSE REPORTS FOR THE 192 SQUATS
- I can draft a templated complaint. The report form is at https://www.npmjs.com/support (use "Report abuse" → "Trademark or copyright infringement" → claim CSOAI is the brand owner).
- Alternative (faster): `npm owner add meok-ai-labs <pkg>` after the csga_global account is yours OR you have transfer rights. npm allows adding a new owner to a package without taking over.
- Time: 30-60 min for 192 packages (the abuse form is one-at-a-time, but you can use the npm CLI's bulk transfer via `npm owner add` for all 192 once you have access).

### Step 3 — RE-PUBLISH THE TWO REAL PRODUCTS UNDER THE CORRECT IDENTITY
- For `meok-sdk-ts`: bump to `3.2.0`, homepage already fixed locally (haulage.app → meok.ai), keywords updated, then `npm publish` from your new `meok-ai-labs` account. **Do NOT unpublish v3.1.0** (breaks dependents) — just publish 3.2.0 with the right metadata.
- For `meok-setup`: same — bump to `1.2.0`, publish.
- Time: 10 min once token is fixed.

### Step 4 — ADD NPM COVERAGE TO `openmcp.py` (I already did this)
- I added `python3 openmcp.py npm-status` to the existing `mcp-marketplace/_tooling/openmcp.py` (the auto-lister). It now reports npm coverage + flags csga_global squatters on every audit run.
- Run `python3 openmcp.py npm-status` from now on; it returns `🚨 CSGA-GLOBAL SQUAT: 192 packages` and the full list.

---

## 7. ONGOING AUDIT — RUN ANYTIME

```bash
# Full audit (all 341 packages, PyPI + npm)
python3 /tmp/multi_registry_audit.py
# Output: clawd/_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl

# Quick audit (just npm coverage, surfaces csga_global squatters)
python3 clawd/mcp-marketplace/_tooling/openmcp.py npm-status \
  --out clawd/_TABS/_inventory/OPENMCP_NPM_SQUAT_<date>.json
```

---

## 8. VERIFIED-NOT-CLAIMED (the agent-memory discipline)

Every number above is from a live HTTP request (PyPI JSON, npm registry, npm downloads API) on
2026-06-12 between 13:50 and 14:05 BST. Not from a stale memo. The audit JSONL is the durable
artifact — re-running the script produces the same numbers (modulo npm download volume which
drifts daily).

**The cleanest signal of CSGA contamination: 192/197 npm live packages are by the same severed
publisher. That's a single-actor pattern — not organic 3rd-party publishings.**

---

## 9. WHAT I SHIPPED THIS SESSION (not just findings)

1. **Full multi-registry audit tool** — `/tmp/multi_registry_audit.py` (PyPI + npm + downloads)
2. **`openmcp.py npm-status` extension** — `clawd/mcp-marketplace/_tooling/openmcp.py` (now flags CSGA squats)
3. **meok-sdk-ts homepage fix** — `clawd/meok-sdk-typescript/package.json` (haulage.app → meok.ai, keywords updated)
4. **Audit JSONL on disk** — `clawd/_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl`
5. **STATUS.md updated** — PM16 (this finding) + PM15 (canon watcher + meok-council live) + PM14 (canon in hives) + PM14b (top-hive alignment)
6. **Memory saved** — agent memory `CSGA-global npm squat: 192 packages (2026-06-12)`

The remediation steps (revoke token, file abuse reports, re-publish) need Nick because they touch
accounts only he has access to. I can draft the abuse report emails + re-publish commands when
ready.

---

*— Mavis root orchestrator · 2026-06-12 · mvs_1318b92a77e54d7592c8d57a60346063*
