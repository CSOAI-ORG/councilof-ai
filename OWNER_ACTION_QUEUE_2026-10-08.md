# OWNER ACTION QUEUE — staged drafts, one-click each
*8 Oct 2026 00:42 UTC · M4 lane · Nicholas Templeman*
*Rule: every item below is OWNER-EXECUTED. Lane work = drafts only.*

> The 7 owner-only moves from `MEOK_MIGRATION_CLIENT_EVIDENCE_RECONCILIATION_2026-10-07.md`,
> each pre-staged with the exact click path, exact text, and exact verification.
> M4 lane stops here. These are your moves.

---

## 1. Glama OAuth claim (D3 + D4)

**What this unlocks:** upstream PR #15904 eligible on a 29k-star list (`punkpeye/awesome-mcp-servers`).
**Time:** 5 min. **Reversible:** yes (claim edit, no code change).

**Click path:** `https://glama.ai/mcp/servers` → "Add your server" → sign in (GitHub OAuth) → form.

**Pre-filled form (paste):**

```
Server name:        csoai-mcp-wire-kit
Repository URL:     https://github.com/CSOAI-ORG/csoai-mcp-wire-kit
Description:        MCP 2026-07-28 stateless wire migration kit. 7/7 selftest,
                    both wires (HTTP+SSE+stdio), real stdio round-trip verified.
                    Includes Dockerfile (python:3.12-slim, py_compile gate),
                    example server, mcp_wire_audit.py, test_mcp_wire.py (91 tests).
License:            MIT
Categories:         developer-tools, infrastructure, governance
Badge:              ![MCP Server](https://glama.ai/mcp/badge/github/CSOAI-ORG/csoai-mcp-wire-kit)
```

**Pre-filled PR comment to post on #15904** (in reply to the glama-check bot):

```
Following the maintainer's Glama-gate feedback, I've shipped the server
requirements in #1 of csoai-mcp-wire-kit:
- Both wires (HTTP+SSE+stdio) implemented in mcp_wire_server.py
- 7/7 selftest passes (see selftest output)
- Dockerfile with py_compile gate included
- Glama listing claim: https://glama.ai/mcp/servers/...
Ready for re-review on the awesome-mcp-servers list.
```

**Verify post-click:** M4 lane runs `gh pr view 15904` and `glama_check` bot reply.

---

## 2. Merge the 7 APPROVED migration PRs

**What this unlocks:** 7 → 0 in the unmerged queue. Post-merge re-audit unblocks for M4.
**Time:** 30 min (sequential, 4 min/PR). **Reversible:** yes (revert).

**Exact sequence (ordered by lowest risk first):**

| # | PR | Repo | Branch | Commit pre-merge check |
|---|---|---|---|---|
| 1 | #7 | acord-bridge-mcp | patch-1 | `gh pr checks 7` all green |
| 2 | #7 | as400-bridge-mcp | patch-1 | same |
| 3 | #1 | mmoagent-mcp | main | same |
| 4 | #1 | blizzard-wow-mcp | main | same |
| 5 | #22 | gdpr-compliance-ai-mcp | main | same |
| 6 | #1 | mcp-spec-compliance-mcp | main | same |
| 7 | #1 | csoai-mcp-dist | defoneos-sign-mcp | `class=full` — merge last, has handshake removal |

**Click path (per PR):** `https://github.com/CSOAI-ORG/<repo>/pull/<n>` → "Merge pull request" → "Confirm merge" (squash default).

**3 pending reviews first** (D6 — must be done before merge, blocks items 8-10 below):
- #1 csoai-defoneos-mcp (review + approve)
- #20 dora-compliance-mcp (review + approve)
- #28 eu-ai-act-compliance-mcp (review + approve)

**Verify post-merge:** M4 lane runs `mcp_wire_audit.py` against each of 10 repos → produces signed receipt.

---

## 3. hummingbot-api decision (D2)

**What this unlocks:** `launch.sh` step 4 can complete → 9/9 launch green.
**Time:** 30 sec. **Reversible:** yes (restart).

**Click path:** terminal:
```bash
docker stop hummingbot-api   # OR: repoint launch.sh step 4 to a different port
```

**Decision matrix:**
- If you actively use hummingbot for trading → repoint `launch.sh` step 4 to `:9999` (edit one line)
- If it's an old container you forgot → `docker stop hummingbot-api && docker rm hummingbot-api`
- If unsure → `docker ps | grep hummingbot` first

**Verify post-decision:** `PYTHONPATH= /opt/homebrew/bin/python3.11 /Users/nicholas/clawd/scripts/launch.sh` → 9/9 green.

---

## 4. Kaggle visibility flip (D8)

**What this unlocks:** public evidence visible to investors, partners, regulators.
**Time:** 30 sec. **Reversible:** yes (flip back).

**Click path:** `https://www.kaggle.com/datasets/nicholastempleman/csoai-sovereign-corpus` → "Settings" → "Visibility" → "Public" → "Save".

**Files (verified intact today, 7 Oct):**
- `csoai-sovereign-corpus.csv` (1,189,255 bytes)
- `csoai-sovereign-charters.csv` (171,490 bytes)
- `csoai-sovereign-law.csv` (25,107 bytes)

**Verify post-click:** `kaggle datasets files nicholastempleman/csoai-sovereign-corpus` from a fresh account shows the 3 files publicly.

---

## 5. PyPI `twine upload` (D9)

**What this unlocks:** `meok-ori` installable as `pip install meok-ori` from PyPI.
**Time:** 2 min. **Reversible:** NO (yank requires `--yank` reason, not silent). **Already install-proven locally.**

**Click path:** terminal:
```bash
cd /Users/nicholas/clawd/meok-ori
ls dist/  # confirm wheel exists: meok_ori-0.2.0-py3-none-any.whl
# Staged command (DO NOT run unattended — confirm each line):
twine upload dist/meok_ori-0.2.0-py3-none-any.whl \
  --username __token__ \
  --password $(keystone get PYPI_TOKEN) \
  --verbose
```

**Pre-flight (M4 verified today):**
- Wheel: `meok_ori-0.2.0-py3-none-any.whl` exists in `dist/`
- Fresh-venv install: ✅ works
- Constitution CLI: ✅ `meok-ori constitution` returns expected text
- SHA-256: captured in M4 receipts (matches)

**Verify post-upload:** `pip install meok-ori --index-url https://pypi.org/simple/ --force-reinstall` in a fresh venv.

---

## 6. SOV3 re-enable (D10)

**What this unlocks:** live SOV3 substrate on :3101 → MCP proxy tests can run integration (not just unit).
**Time:** 60 sec. **Reversible:** yes (`launchctl unload`).

**Why it was disabled 17 Jun:** kept off to free port during sibling lane activity.
**Decision:** if you need MCP proxy live integration tests, re-enable; if not, hold.

**Click path:** terminal:
```bash
launchctl load ~/Library/LaunchAgents/com.sov3.substrate.plist   # if exists
# OR: docker start sov3-substrate
# OR: cd /Users/nicholas/clawd/sov3 && docker compose up -d
```

**Verify post-enable:** `curl -s http://127.0.0.1:3101/health` returns 200 with `{"ok":true}`.

**Live integration tests ready to fire (in `meok/mcp/tests/test_proxy_path.py`):**
- `test_live_pulse`
- `test_live_tools_list_has_sov3_tools`
- `test_live_proxy_call_consciousness`

These currently SKIP because the server is down. Post-enable they go green and the suite becomes **93/90** (3 added).

---

## 7. OPENROUTER_API_KEY export (D11)

**What this unlocks:** meok-ori can call frontier models (Claude, GPT-4, etc.) instead of local Ollama only.
**Time:** 30 sec. **Reversible:** yes.

**Click path:** terminal:
```bash
keystone set OPENROUTER_API_KEY "sk-or-..."  # the value from your OpenRouter dashboard
export OPENROUTER_API_KEY=$(keystone get OPENROUTER_API_KEY)
# verify
meok-ori probe --provider openrouter --model anthropic/claude-3.5-sonnet --prompt "ping"
```

**Verify post-export:** `meok-ori probe --provider openrouter` returns a model response in <5s.

---

## What M4 lane executes the moment ANY of items 1-7 lands

1. **Re-run post-merge re-audit** on the affected repos (after item 2)
2. **Re-run MCP proxy-path live integration tests** (after item 6)
3. **Pull Glama claim confirmation** + update `MEOK_MIGRATION_CLIENT_EVIDENCE_RECONCILIATION_2026-10-07.md` row D3 (after item 1)
4. **Update YEAR_1_FORECAST.md** with the live $MRR signal from each landed item
5. **Re-run `mcp_wire_audit.py` fleet-wide** (after items 1+2) → signed receipt attached to investor packet

---

## The single-lane move M4 can execute without you (drafts only)

**The 438-repo `header-add` migration class** — generate:
- The exact `MCP_HTTP` header text per repo
- A draft PR body per repo (title + body + checklist)
- The verification script (`mcp_wire_audit.py --repo <name>`)
- A `fleet_header_wave_2026-10-08.jsonl` manifest (438 rows)

Then you (or your batch) push the PRs. M4 cannot push 438 PRs to repos you own — that's a protected-owner merge operation.

If you want the 438 draft PRs, say "stage the 438 header wave" and I write the manifest in one shot. Otherwise this queue is the 1-click set.

---

**Built 8 Oct 2026 00:42 UTC · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula
