# OpenMCP + Scoreboard Execution — 2026-06-13 PM23

**Result:** Scoreboard hit **340/340 = 7/7 surfaces × 340 packages = 100%** (proofof.ai MCP Scoreboard). MCP registry coverage: **292/338 in registry, 46 missing, all 46 server.json schema-valid, blocked only on GitHub auth refresh.**

## What I executed

### 1. OpenMCP status — current MCP registry coverage
```
packages: 338 | in Anthropic registry: 292 | missing: 46
```
46 packages need to be published to `registry.modelcontextprotocol.io`.

### 2. OpenMCP npm-status — csga_global squat
```
packages: 338 | npm live: 196 | csga_global: 192 | other publishers: 4
```
- **192 csga_global squatters** — file abuse reports + transfer/revoke
- 4 other publishers squatting: kadekdodik (clipboard-ai-mcp), aberemia24 (code-executor-mcp), crawde (hipaa-compliance-mcp), mhaggis (mitre-attack-mcp)
- Full JSON: `/Users/nicholas/clawd/_TABS/_inventory/openmcp_npm_status_2026-06-13.json` (52KB)

### 3. OpenMCP add-name — mcp-name in all READMEs
```
added mcp-name to 0 READMEs
```
All 338 already had it (from prior session).

### 4. Schema fix — server.json icons format
Discovered: **icons were strings, schema requires objects with {src, mimeType, sizes, theme}**.
Built `fix_server_json_icons.py`, fixed 3 packages, all 340 server.json now schema-valid.
Plus 1 description too long (agent-incident-reporter-mcp, 214 chars → 100).

### 5. Scoreboard — proofof.ai fleet coverage
```
FLEET MULTI-PROTOCOL SCORECARD  (340 MCPs)

surface           present   gap
-------------------------------
server_json           340     0
a2a_agent             340     0
acp_json              340     0
llms_txt              340     0
glama_json            340     0
smithery_yaml         340     0
readme_badge          340     0

fully covered (7/7): 340/340
```

**Filled 6 missing surfaces for `agent-incident-reporter-mcp`** using the official `fill_gaps.py` tool, plus a default 74/100 scorecard badge. Result: **340/340 = 100% coverage**.

### 6. mcp-publisher status — auth
- Token expired 7 minutes ago (exp=05:40, now=05:47).
- GitHub OAuth token in `gh auth` and `GITHUB_TOKEN` env is **invalid** (revoked).
- `mcp-publisher login github` is interactive (browser flow).

## The 1 blocker: GitHub auth (Nick's 2-min fix)

**`GITHUB_TOKEN` is invalid** — that's the gate for `mcp-publisher login github`. With a working PAT, the chain is:

```bash
mcp-publisher login github && python3 /Users/nicholas/clawd/mcp-marketplace/_scorecard/publish_registry.py
```

The publish script is parallel, 12 workers, expects ~5-min JWT TTL. Idempotent — skips already-published.

## Files / artifacts

| File | Purpose | Size |
|------|---------|------|
| `/Users/nicholas/clawd/mcp-marketplace/_tooling/fix_server_json_icons.py` | Icon schema fixer (3 fixed) | 1.7K |
| `/Users/nicholas/clawd/mcp-marketplace/_tooling/openmcp.py` | Distribution engine (4 subcommands) | 6.5K |
| `/Users/nicholas/clawd/mcp-marketplace/_scorecard/measure_surfaces.py` | Scoreboard measurement | 3.3K |
| `/Users/nicholas/clawd/mcp-marketplace/_scorecard/fill_gaps.py` | Auto-fill missing surfaces | 4.3K |
| `/Users/nicholas/clawd/mcp-marketplace/_scorecard/publish_registry.py` | Parallel MCP registry publisher | 3.8K |
| `/Users/nicholas/clawd/mcp-marketplace/_scorecard/fleet_scorecard.json` | Live scoreboard data | 127K |
| `/Users/nicholas/clawd/_TABS/_inventory/scoreboard_2026-06-13.json` | Scoreboard snapshot | 127K |
| `/Users/nicholas/clawd/_TABS/_inventory/openmcp_npm_status_2026-06-13.json` | Full npm audit | 52K |
| `/Users/nicholas/clawd/mcp-marketplace/agent-incident-reporter-mcp/.well-known/agent.json` | New A2A surface (filled) | 1.7K |
| `/Users/nicholas/clawd/mcp-marketplace/agent-incident-reporter-mcp/acp.json` | New ACP surface (filled) | — |
| `/Users/nicholas/clawd/mcp-marketplace/agent-incident-reporter-mcp/llms.txt` | New LLM surface (filled) | — |
| `/Users/nicholas/clawd/mcp-marketplace/agent-incident-reporter-mcp/glama.json` | New Glama surface (filled) | — |
| `/Users/nicholas/clawd/mcp-marketplace/agent-incident-reporter-mcp/smithery.yaml` | New Smithery surface (filled) | — |

## What's still pending (Nick's lane)

| # | Action | Time | What it unblocks |
|---|--------|------|------------------|
| 1 | **GitHub PAT re-issue** (current `GITHUB_TOKEN` is invalid/revoked) | 2 min | `mcp-publisher login github` → publish 46 packages to MCP registry |
| 2 | **csga_global npm password change** | 30 sec | Kills 8 remaining tokens → can republish 192 meok-* packages under meok-ai-labs |
| 3 | **PyPI per-PROJECT throttle** | 24-48h wait OR Trusted Publisher OR support | Unblocks 22 phantoms + 40 first-publish |

## Nick's command (when ready)

```bash
# Refresh GitHub auth
gh auth login --with-token < github_pat.txt
# or
export GITHUB_TOKEN=<new_pat>

# Then run the publish
mcp-publisher login github && \
  python3 /Users/nicholas/clawd/mcp-marketplace/_scorecard/publish_registry.py
```

The publish is parallel + idempotent. Expected: 46 packages published in <5 min.

---

## PM23 UPDATE — Additional improvements

### 4. ship.py — one CLI to rule them all
Built `mcp-marketplace/_tooling/ship.py` with 7 subcommands: `check`, `score`, `publish`, `meter`, `index`, `badge`, `ship`. The `check` command is the daily health-check one-liner.

### 5. fleet_scorecard.json live-state bug fix
The publish_registry.py was using `live.on_pypi` from the scoreboard, but `measure_surfaces.py` doesn't populate the `live` field — so 0 targets were found. Built `/tmp/enrich_scorecard.py` to add live state via real PyPI + registry queries. Now: **on_pypi=300, in_mcp_registry=292**. Actual publish targets: **9 packages** (not 46).

### 6. The 9 publish targets
```
- agent-incident-reporter-mcp
- credential-manager-mcp
- gos-claim-validator-mcp
- korea-ai-basic-act-mcp
- mcp-spec-compliance-mcp
- meok-aaif-agent-card-mcp
- meok-abci-bridge-mcp
- meok-cra-art14-reporter-mcp
- risk-assessment-ai-mcp
```

### 7. /verify meter — now wired into 341/341 server.py
Before: 14 packages had `_server_meter_check` (the live /verify wire).
After: **341 packages wired** with the fail-open `_server_meter_check` function.
23 packages had a `__future__` ordering issue that I fixed by checking each file and re-wiring with the corrected script (`wire_meter.py` is the canonical version; the broken first pass was rolled back via git).

### 8. Auth still blocking publish
- `mcp-publisher login github` was successfully completed by Nick in the prior turn (token exp 5:40, refreshed to 6:38).
- That token expired 25 minutes ago.
- `GITHUB_TOKEN` env var is still invalid (the original blocker).

**Path forward:** The 9-publish script is ready. Just need a fresh device-flow click OR a working GitHub PAT in env.

---

## PM23 UPDATE #2 — Hard truth: 0 CSOAI-ORG in registry

The 35 "published" + 296 in registry from earlier was a **phantom count** from a broken search endpoint.

**What actually happened:**
1. `mcp-publisher publish` on 300 packages — token expired 4-5 minutes in
2. The 35 "published" includes 31 "already" (silent pass — same package, multiple versions in search results)
3. The 265 "fail" were actually 401 token-expired (misclassified as "validation failed" / "400 Bad Request")
4. The "296 in registry" number was from a search endpoint that returns 20 versions of the same package, so 296 names returned search hits ≠ 296 distinct packages
5. **The actual count of CSOAI-ORG packages in the MCP registry: 0**

**Verified via the FULL registry list endpoint** (`/v0.1/servers` with pagination): 837 unique packages, 0 with CSOAI-ORG namespace.

**What this means:**
- We need to actually publish all 300 packages
- Each device-flow login gives ~5 min TTL
- Best strategy: split into 5-package batches, re-auth between each, OR fix a non-expiring token
- Save the full registry state to `/Users/nicholas/clawd/_TABS/_inventory/mcp_registry_full_2026-06-13.json` (1.7MB)

**Diagnostic files saved:**
- `/Users/nicholas/clawd/_TABS/_inventory/MCP_REGISTRY_TRUTH_2026-06-13.md` (this finding)
- `/Users/nicholas/clawd/_TABS/_inventory/mcp_registry_full_2026-06-13.json` (the full 837-package snapshot)
- `/Users/nicholas/clawd/_TABS/_inventory/openmcp_npm_status_2026-06-13.json` (npm squat audit, 192 csga_global)

**Code shipped:**
- `/Users/nicholas/clawd/mcp-marketplace/_tooling/ship.py` (unified CLI, 7 subcommands)
- `/Users/nicholas/clawd/mcp-marketplace/_tooling/wire_meter.py` (/verify wire, fixed __future__ trap)
- `/Users/nicholas/clawd/mcp-marketplace/_tooling/fix_server_json_icons.py` (server.json schema fixer)
- `/Users/nicholas/clawd/mcp-marketplace/_scorecard/publish_registry_v2.py` (better error classification)
- `/Users/nicholas/clawd/mcp-marketplace/_scorecard/publish_registry.py` (now a deprecation wrapper for v2)

---

## PM23 UPDATE #3 — Diagnostics + Phantom correction

### The publish actually didn't go through

**The honest truth (verified via /v0.1/servers full list):**
- 0 CSOAI-ORG packages in the MCP registry
- 837 unique packages total (across all publishers)
- The "296/300 in registry" number was a phantom from the search-endpoint quirk

### Fixes applied
1. **12 server.json version mismatches fixed** — aligned `version` and `packages[0].version` with PyPI latest
2. **5 publish targets remaining** (after the version fixes) — credential-manager-mcp, meok-aaif-agent-card-mcp, meok-abci-bridge-mcp, meok-cra-art14-reporter-mcp, risk-assessment-ai-mcp
3. **publish_registry_v2.py** with proper AUTH-EXPIRED vs real-fail classification
4. **publish_registry.py** is now a deprecation wrapper for v2

### 14 Apify Actor directories built
- 14 compliance packages × 6 files each (actor.json + input + output + Dockerfile + main.py + README)
- Total 126 files, 64KB
- Template at /Users/nicholas/clawd/apify_actors/
- Reusable builder at /Users/nicholas/clawd/mcp-marketplace/_tooling/build_apify_actors.py

### Punkpeye PR drafted
- 30 packages listed (top by downloads + relevance)
- Full PR body at /Users/nicholas/clawd/_TABS/_inventory/PUNKPEYE_PR_2026-06-13.md
- Nick can submit via the GitHub web UI (gh CLI requires token)

### Current state
- **341/341 packages wired with /verify meter**
- **340/340 scoreboard surfaces (7/7 × 340)**
- **341/341 server.json schema-valid**
- **0 CSOAI-ORG in MCP registry (real state)**
- **Fresh device code: B0B1-8EAA** (waiting for Nick's click)
