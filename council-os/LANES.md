# LANES — live lane claims. Check before starting ANY work; add your row before touching files.
# One lane = one concern = one owner. Do not touch another lane's files. 2026-08-27.

| lane | owner | files/territory | state |
|---|---|---|---|
| home-films | grok (tui-2) | homepage films from NotebookLM Downloads + demo loop | RUNNING |
| epic-home | grok (tui-2) | restore mega-menu + OS + HeroSlides + 9-product ToolStack + LivingStages on home | RUNNING |
| weekend-must | grok (tui-2) | MUST 1–25 lean surface: OS FAB, products four lines, assess insurer, mcp four tools | RUNNING |
| eighty-twenty | grok (tui-2) | home composer+board, footer Product, legal certify/rank copy, brand-gate nearAllow | RUNNING |
| nine-products-e2e | claude (main) | product tiles, /products, /tools, product flows | RUNNING |
| os-inner-experiences | claude (agent) | lobby/play.ts, LobbyPlay, GameBar, city/sim/arena pages, quests | RUNNING |
| gspc-mcp | claude (agent) | functions/mcp/, new mcp server package, /llms.txt, mcp-registry | RUNNING |
| axis-language | claude (main) | DONE — display "axes"->"axis", 205 strings, 71 files, commit 07983d01 | DONE |
| final-build-deploy | claude (main) | dist/, deploy — SINGLE builder; nobody else builds into dist/ | PENDING |
| harness-measurement | grok (cursor bc-54c88537) | harness/arena, /api/arena/scoreboard HEAD, living-door aliases (rwa/xrpl/evm/arc-agi/overlay/ins) | RUNNING |
| dsh-sessions | DSH | its own session work; consume gspc-mcp when published | — |
| reach-funnel | claude (agent) | /get-listed page + PRIMARY_PATHS entry + docs/OUTREACH-PACK + docs/ANCHORS-TRUTH-TABLE; committed, NOT pushed (another lane mid-flight) | COMMITTED |

RULES (all agents): master only, no worktrees, no dev servers left running, stage-by-name,
six gates before any dist build claim, browser-verify (green build ≠ working page),
display language is "axis" never "axes", counts derive from /api/gspc//api/state,
card_index rule (OWNER RULING, 2026-08-27, supersedes the 150 freeze): the index lists EVERY verifying published GSPC card — today 313 — enriched with sig/pubkey/card_url; chain.json is published; the cross-border card is a SEPARATE schema counted separately, never folded into the GSPC count. No agent may clamp the index to any constant.
deploys via scripts/deploy-site.sh --via-actions (direct wrangler = owner only).

## lane/os-unify-home-board — Claude (2 Sep 2026) — PR #1093
Writer: Claude (one writer). Files: client/src/App.tsx (/os route → OsRoute), components/DashboardLayout.tsx, components/DashboardPane.tsx (new), components/Header.tsx, components/HeaderNav.tsx, components/HeroSlides.tsx, components/home/{HeroBoard,HomeCinematicWorlds,HomeWorlds,HomeGspcBoard(new)}.tsx, pages/{Dashboard,HomeVerify}.tsx, functions/api/gspc.ts (totals.public_leader_count/model_fleets/fact_runs, derived), public/llms.txt (lid line).
Ruling executed (owner, 2 Sep): Dashboard IS Council OS · tabs render in-shell, never navigate out · /os?lobby=X → /dashboard?tab=X (embed=1 keeps AG-UI pane) · home board = living HF Space csoai/gspc-board + derived lid + 22-axis strip. Other lanes: do not re-point CTAs back to /os; do not add a second board.
