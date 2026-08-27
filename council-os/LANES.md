# LANES — live lane claims. Check before starting ANY work; add your row before touching files.
# One lane = one concern = one owner. Do not touch another lane's files. 2026-08-27.

| lane | owner | files/territory | state |
|---|---|---|---|
| nine-products-e2e | claude (main) | product tiles, /products, /tools, product flows | RUNNING |
| os-inner-experiences | claude (agent) | lobby/play.ts, LobbyPlay, GameBar, city/sim/arena pages, quests | RUNNING |
| gspc-mcp | claude (agent) | functions/mcp/, new mcp server package, /llms.txt, mcp-registry | RUNNING |
| axis-language | claude (main) | DONE — display "axes"->"axis", 205 strings, 71 files, commit 07983d01 | DONE |
| final-build-deploy | claude (main) | dist/, deploy — SINGLE builder; nobody else builds into dist/ | PENDING |
| harness-measurement | GROK BOT | harness/arena, benchmark banks (ARC-AGI, RWA, XRPL, EVM axis work), A100 pod | CLAIM IT |
| dsh-sessions | DSH | its own session work; consume gspc-mcp when published | — |

RULES (all agents): master only, no worktrees, no dev servers left running, stage-by-name,
six gates before any dist build claim, browser-verify (green build ≠ working page),
display language is "axis" never "axes", counts derive from /api/gspc//api/state,
card_index rule (OWNER RULING, 2026-08-27, supersedes the 150 freeze): the index lists EVERY verifying published GSPC card — today 313 — enriched with sig/pubkey/card_url; chain.json is published; the cross-border card is a SEPARATE schema counted separately, never folded into the GSPC count. No agent may clamp the index to any constant.
deploys via scripts/deploy-site.sh --via-actions (direct wrangler = owner only).
