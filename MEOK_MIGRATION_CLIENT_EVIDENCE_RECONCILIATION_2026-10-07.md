# MEOK Migration & Client Evidence Reconciliation — 2026-10-07

**Lane:** M4 sovereign-orchestrator · **Requested by:** Nicholas Templeman ("Reconcile
current MEOK migration and client evidence through existing owners today")
**Rule:** existing owners only — no new ownership is created by this document.
Every open item below is routed to an owner that already exists in the estate.

---

## 1. Migration state — one source of truth

### 1.1 Pull-request matrix (re-read live, 2026-10-07 ~09:45 BST)

| # | Repo | PR | State | Review | Merged |
|---|---|---|---|---|---|
| 1 | csoai-mcp-dist | #1 (base `defoneos-sign-mcp`) | OPEN | **APPROVED** | no |
| 2 | mcp-spec-compliance-mcp | #1 | OPEN | **APPROVED** | no |
| 3 | csoai-defoneos-mcp | #1 | OPEN | — pending | no |
| 4 | blizzard-wow-mcp | #1 | OPEN | **APPROVED** | no |
| 5 | mmoagent-mcp | #1 | OPEN | **APPROVED** | no |
| 6 | dora-compliance-mcp | #20 | OPEN | — pending | no |
| 7 | eu-ai-act-compliance-mcp | #28 | OPEN | — pending | no |
| 8 | gdpr-compliance-ai-mcp | #22 | OPEN | **APPROVED** | no |
| 9 | acord-bridge-mcp | #7 | OPEN | **APPROVED** | no |
| 10 | as400-bridge-mcp | #7 | OPEN | **APPROVED** | no |

**Totals: 10/10 open · 7 approved · 3 awaiting review · 0 merged.**
Merge is an owner act; approval is not merge.

### 1.2 The four migration denominators (numbers reconciled — definitions fixed)

The estate quotes four different "server counts". They measure different sets;
none is wrong, but claims must name which:

| Number | Definition | Authoritative for |
|---:|---|---|
| **371** | Estate claim: 218 MEOK core + 153 SOV3 federation (documented estate inventory) | "how many servers do we operate" |
| **754 → 516 → 422** | All CSOAI-ORG repos → name/desc MCP candidates → owned non-fork confirmed MCP servers | "what surface must migrate on GitHub" (census) |
| **132** | Local worktree server roots (package-manifest deduped) | "what we can audit offline today" (local baseline) |
| **421 + 1** | Owned-repo classes: header-add 421, full 1 (csoai-mcp-dist) | the per-class work queue |

Overlap is carried per-record in the census JSONL (`local_baseline` field).
The kit README's public claim — "audit of 422 production MCP servers found 0 on
the new wire" — matches the census exactly (re-checked today).

### 1.3 Known caveat (kept on the record)

Wave-1 after-verify rows are **note-text-driven**: `mcp_wire_audit.py` excludes
its own shim and does not scan `.md`, so `era 2026-07 / migration none` after a
patch comes from MIGRATION_NOTE.md, not code. **Do not quote post-migration
`none` until the post-merge re-audit.** Stated in the report and in every PR body.

---

## 2. Client evidence — claim ↔ live state (every row verified today)

| # | Claim (where a client sees it) | Live verification today | Result |
|---|---|---|---|
| 1 | "91 tests" (wire-kit README) | `test_mcp_wire.py` rerun from kit dir | ✅ OK |
| 2 | "7/7 PASS live proofs" (kit README) | `mcp2026_proxy_proof.py` rerun | ✅ ALL PASS |
| 3 | Kit is a working MCP server (Glama gate) | NEW: `mcp_wire_server.py` selftest + real stdio round-trip: init→2026-07-28, tools/list (3 tools), wire_status→294 days to deadline | ✅ shipped today |
| 4 | Kaggle dataset 3 files (public evidence) | `kaggle datasets files` read-back — 25,107 / 171,490 / 1,189,255 bytes exact | ✅ intact (private) |
| 5 | Patent batch Bitcoin anchor | OTS deserialize: file_digest == composite sha256, 1 PendingAttestation | ✅ re-verified |
| 6 | meok-ori wheel "built" | fresh-venv `pip install` → 0.2.0 → constitution + run | ✅ install-proven |
| 7 | "468 green" estate tests | components re-run today (kit 91, csoai-os+backend 343, meok-ori 34) | ✅ still green |
| 8 | 10 migration PRs exist | `gh pr view` all 10 (matrix §1.1) | ✅ 10/10 open |
| 9 | Upstream listing PR | #15904 OPEN, 2 commits; glama-check bot comment read | ⚠️ steps mapped (§3) |
| 10 | wire-kit repo | 12 files, 0 stars/0 forks/0 issues (honest — not yet discovered) | ✅ as-claimed |

---

## 3. Discrepancies found → resolution → **existing owner**

| # | Discrepancy | Resolution (done today) | Existing owner of what remains |
|---|---|---|---|
| D1 | `launch.sh` health run died at step 3 | Root-caused: py3.14 venv on PYTHONPATH poisoned py3.11 pytest. **Fixed**: `export PYTHONPATH=""` in launch.sh. Suite re-run clean (468) | — (closed) |
| D2 | `launch.sh` full 9-step green | Blocked at step 4: curls `127.0.0.1:8000` where **OrbStack container `hummingbot-api`** listens (running, unresponsive, trading-adjacent) | **Nicholas Templeman** — his Mac/Docker estate; decision: `docker stop hummingbot-api` or repoint step 4 |
| D3 | Glama check step 1 (bot comment on #15904): server must be listed | **Shipped**: `mcp_wire_server.py` (both wires, 7/7 selftest) + `Dockerfile` (python:3.12-slim, py_compile gate) — all build+introspection requirements satisfied | **Nicholas Templeman** — Glama claim requires **GitHub OAuth in his browser** (platform rule: submitter must hold write access); one step at glama.ai/mcp/servers |
| D4 | Glama check step 2 (badge format) | **Pushed**: badge added to PR entry in required format (`c20113cb..4a5183be`) — resolves when D3 lands | — (waits on D3) |
| D5 | After-rows note-driven (§1.3) | Caveat recorded in report + PR bodies | **Nicholas Templeman** merges → then **M4 lane** performs post-merge re-audit and only then claims `migration: none` |
| D6 | 3 PRs awaiting review | none — reported | **Nicholas Templeman** (review/merge queue) |
| D7 | June PR #8803 closed-unmerged | Superseded by #15904 (utility-first framing) | **Nicholas Templeman** — watch/respond to #15904 (1 bot comment so far, no human replies) |
| D8 | Kaggle dataset is private | Files verified intact | **Nicholas Templeman** — 1-click visibility flip (staged URL in action queue) |
| D9 | PyPI publish not done | Wheel staged + install-proven | **Nicholas Templeman** — irreversible by policy (`twine upload` staged in queue) |
| D10 | SOV3 :3101 down | launchd keeper deliberately disabled 2026-06-17; venv missing | **Nicholas Templeman** — re-enable decision + confirm |
| D11 | `OPENROUTER_API_KEY` absent | meok-ori works local-first (live Ollama) | **Nicholas Templeman** — export to go frontier-live |
| D12 | Count confusion 371/422/516/132 | §1.2 definitions table is now the canonical mapping | — (closed; doc is the fix) |

**No new owners were created.** Owner universe used: Nicholas Templeman
(operator), M4 lane (execution + re-audit), platform owners external to the
estate (Glama platform, punkpeye/awesome-mcp-servers maintainers).

---

## 4. What each owner is holding TODAY

**Nicholas Templeman (7 items, ordered by leverage):**
1. Glama OAuth claim → unblocks D3+D4 → keeps upstream #15904 eligible on a 29k-star list
2. Merge the 7 APPROVED migration PRs (+ review the 3 pending) → M4 re-audits post-merge
3. `hummingbot-api` on 127.0.0.1:8000 decision → unblocks `launch.sh` full green
4. Kaggle visibility click (staged URL)
5. PyPI `twine upload` for meok-ori 0.2.0 (staged)
6. SOV3 re-enable confirm (disabled 17 Jun)
7. `OPENROUTER_API_KEY` export

**M4 lane (queued, no owner needed):** post-merge re-audit of all 10 repos;
`csoai-mcp-dist` handshake-removal wave (class `full` debt); remaining 411-repo
migration classes; Wave-3 EAT items.

**External:** Glama platform (auto-scrapes public MCP-shaped repos — the kit may
appear before the claim; claim unlocks admin), punkpeye maintainers (#15904).

---

## 5. Evidence index (everything above is re-derivable)

| Artifact | Path / locator |
|---|---|
| Census (516 records) | `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` |
| Local baseline (132) | `MCP_WIRE_AUDIT_BASELINE_2026-10-07.jsonl` |
| Migration plan + runbooks | `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` |
| Wave-1 report (10 PR links) | `MCP_HEADER_ADD_WAVE1_2026-10-07.md` |
| EAT evidence (SIGIL digest `4e0f1c62ba32ed69` pre-this-doc) | `_alignment/EAT_MODE_EVIDENCE_2026-10-07.json` |
| Action queue (shared with sibling lanes) | `_alignment/EAT_MODE_ACTION_QUEUE_2026-10-07.json` |
| Public kit | `github.com/CSOAI-ORG/mcp-2026-wire-kit` (12 files) |
| Upstream PR | `punkpeye/awesome-mcp-servers#15904` (2 commits) |
| Kaggle | `kaggle.com/datasets/nicktempleman/sovereign-estate-eat-20261007` |
| Patent anchor | `csoai.org/patents/PATENT_BATCH_COMPOSITE_2026-10-07.txt.ots` |
| Server introspection proof | `mcp_wire_server.py --selftest` (7/7) |

*Reconciled by M4 lane, 2026-10-07. Measurement, not certification.*
