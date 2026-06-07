# Broken-Source Repair + Republish — 2026-06-07

## What happened
Fleet-wide compile sweep (`python -m py_compile` over all 354 package dirs in
`mcp-marketplace/`) found exactly **6 broken-source packages** — corrupted local
`server.py` that fails on import. The published wheels were older/good, but the
corrupted source had been **silently blocking republishes** (the gate-harness
`republish_mcp.py` skips anything that won't `import server`). One is a TOP EARNER.

### The 6 (all fixed + verified importable)
| package | corruption | fix |
|---|---|---|
| **ai-bom-mcp** (1,829 dl/mo) | merge-conflict markers | kept upstream side (stashed had `STRIPE_1499 == STRIPE_199` copy-paste bug) |
| explainability-report-mcp | 4× merge-conflict markers | kept stashed side (direct Stripe link = fleet standard) |
| yaml-ai-mcp | merge-conflict block | dropped block (defs already existed below) |
| database-universal-mcp | Stripe block injected mid-`try/except` (IndentationError) | relocated block to module top |
| meok-enterprise-compliance-checker | `def main()` contained `async with` | → `async def main()` |
| meok-omnibus-tracker-mcp | triple-corrupted: dup `except`, unindented `def` bodies, orphan string fragments | replaced auth block w/ canonical version + deleted orphans |

Also resolved 3 conflicted `pyproject.toml` (version-only conflicts; kept higher version).

**Re-sweep result: fleet source 100% importable (0 conflict markers, 0 syntax errors).**

## Republish (gate-protected)
`republish_mcp.py` dry-run: all 6 = **DRY ok** (built wheel + `import server` passed
in clean venv). Real publish launched (task byxok2cep). Version bumps:
ai-bom 1.2.12→1.2.13 · explainability 1.0.9→1.0.10 · yaml-ai 1.0.5→1.0.6 ·
database-universal 1.0.8→1.0.9 · enterprise-compliance-checker 1.0.2→1.0.3 ·
omnibus-tracker 1.1.3→1.1.4.

## Distribution win
PR #188 to **tolkonepiu/best-of-mcp-servers** (lists our MEOK compliance MCPs):
failing `yamllint` fixed (re-wrapped over-length line) → check SUCCESS, **MERGEABLE**,
awaiting upstream merge. (Had to unarchive the CSOAI-ORG fork — it was wrongly
archived in the bulk severed-brand hygiene; it's used for outbound directory PRs.)

## ⏭️ NEXT — git-merge tangle (separate task)
5 of the 6 package repos are stuck **mid-merge/rebase** (omnibus literally
"rebasing main") with other half-merged files (server.json, README) still showing
conflict markers. **Pre-existing, not from this session's edits.** The on-disk source
is now correct (which is what the publisher reads), but git history needs untangling:
per repo, resolve remaining conflicted files → `git add` → complete the merge
(`git commit`) or `git rebase --continue`. Lower priority than the live wheels.

Note: the gate-harness reads DISK, not git — so the published wheels are correct
regardless of git state.
