# LANES — live lane claims. Check before starting ANY work; add your row before touching files.
# One lane = one concern = one owner. Do not touch another lane's files. 2026-08-27.

| lane | owner | files/territory | state |
|---|---|---|---|
| nine-products-e2e | claude (main) | product tiles, /products, /tools, product flows | RUNNING |
| os-inner-experiences | claude (agent) | lobby/play.ts, LobbyPlay, GameBar, city/sim/arena pages, quests | RUNNING |
| gspc-mcp | claude (agent) | functions/mcp/, new mcp server package, /llms.txt, mcp-registry | RUNNING |
| axis-language | claude (main) | DONE — display "axes"->"axis", 205 strings, 71 files, commit 07983d01 | DONE |
| final-build-deploy | claude (main) | dist/, deploy — SINGLE builder; nobody else builds into dist/ | PENDING |
| harness-measurement | grok (cursor bc-54c88537) | harness/arena, /api/arena/scoreboard HEAD, living-door aliases (rwa/xrpl/evm/arc-agi/overlay/ins) | RUNNING |
| dsh-sessions | DSH | its own session work; consume gspc-mcp when published | — |

RULES (all agents): master only, no worktrees, no dev servers left running, stage-by-name,
six gates before any dist build claim, browser-verify (green build ≠ working page),
display language is "axis" never "axes", counts derive from /api/gspc//api/state,
card_index is EXACTLY 150 by owner ruling — never reconcile it,
deploys via scripts/deploy-site.sh --via-actions (direct wrangler = owner only).
