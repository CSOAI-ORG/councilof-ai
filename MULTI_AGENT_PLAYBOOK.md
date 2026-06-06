# MEOK Multi-Agent / Multi-TUI Playbook
*2026-06-06. The fleet, how they coordinate, and the SIGIL signed interchange that now ties them together. Supersedes the earlier playbook (lost). "Same playbook" for every new TUI/brain.*

## The fleet (verified running 2026-06-06)
| Brain / TUI | What it is | Role | SOV3-MCP wired? |
|---|---|---|---|
| **Claude Code** (this) | `claude` 2.1.x | Lead builder (Opus) — "opus left" | via project; can add globally |
| **minim3** | `claude --model minimax-m3:cloud` | MiniMax-M3 auditor — "minimax right" | shares `~/.claude` MCP if set |
| **kimi2.6** | Kimi.app + `Kimi Code` + kimi-webbridge | Kimi K2.6 builder/browser hands | needs sov3 MCP added |
| **OpenClaw** | `openclaw … gateway` | gateway/relay | needs sov3 MCP added |
| **OpenCode** | `opencode` | alt coding TUI | ✅ **already wired** (`~/.config/opencode/opencode.json` → `sov3` MCP @ :3101) |
| **Gemini** | Gemini.app | research/vision | external |
| **SOV3** | sovereign-mcp-server :3101 | **the middle** — 110 tools, swarm, curator, worm-guard, SIGIL | n/a (it IS the hub) |

**The hub model:** SOV3's MCP (`http://localhost:3101/mcp`, public via `sovereign.templeman-opticians.com/mcp`) is the shared tool+coordination surface. Any TUI that points its MCP config at it instantly gets the 110 tools **plus** the new fabric: `swarm_orchestrate`, `swarm_review`, `curate_skills`, `sigil_emit`, `sigil_transcript`. That's how all brains "wrap SIGIL" — they emit/read the one signed ledger through the hub.

## SIGIL — the signed interchange (NOW LIVE, both Mac + VM)
- **What:** `sigil.py` (protocol) + `multi_agent/sigil_bus.py` (the bus). Every inter-agent exchange → encode → gloss(English) → digest(sha256) → **HMAC-sign** → **hash-chained ledger** (`data/sigil_ledger.jsonl`).
- **Live tools:** `sigil_emit` (raw `line` like `H|opus|sov3|review the Q3 plan`, or `{op,fields}`) → `{line, gloss, digest, signature}`; `sigil_transcript {n}` → recent signed lines + chain-integrity check.
- **Auto-wired:** `swarm_orchestrate` now signs every Queen→worker handoff onto the ledger (verified: opus→sov3, queen→kimi agent, queen→reviewer all chained, integrity intact).
- **Honesty:** signing is **HMAC-SHA256 = internal tamper-evidence**. External-grade asymmetric signing (**Ed25519**) is the `signer` seam, = task #43. Don't claim external cryptographic non-repudiation yet.
- **Why it matters:** "verifiable agent communication" — a replayable, human-readable, signed transcript of the fleet's decisions = EU AI Act Art 12 (logging) + Art 14 (oversight) evidence, and the moat behind CSOAI's attestation story.

## Coordination discipline (the anti-collision rules — learned the hard way)
1. **One writer at a time.** Before any TUI writes to a shared repo / PyPI / VM, take the lock: `touch ~/clawd/.agent-publish.lock`; remove when done; if fresh (<2h), wait. (The catalogue got broken by parallel writers.)
2. **Handoffs over the ledger.** When one brain hands work to another, emit a SIGIL `H` line (`sigil_emit`) so there's a signed record of who-asked-whom-what.
3. **Reviewer-gate before "done."** No multi-agent task closes without the Aegis gate (`swarm_review`) — it worm-scans + quality-checks the result.
4. **SOV3 is the source of truth** for tools, memory, council. TUIs are clients of the hub, not parallel brains with private state.
5. **Gate-protected publishes only** (`mcp-marketplace/_tooling/sweep_catalogue.py`). No raw twine.

## "Revise the TUIs" — wiring status + next steps
- ✅ **OpenCode**: already points at the `sov3` MCP — gets SIGIL/swarm/curator free. No change needed.
- ⬜ **minim3 (Claude+MiniMax-M3)**: add the `sov3` MCP to `~/.claude` MCP config so M3 can emit/read SIGIL + drive the 110 tools. *(Owner-deliberate: it edits the shared Claude config; do explicitly, not mid-session.)*
- ⬜ **kimi2.6 / Kimi Code**: add the sov3 MCP endpoint to Kimi's MCP config.
- ⬜ **OpenClaw gateway**: route its tool calls through the sov3 MCP.
- Pattern for any new TUI: point MCP at `http://localhost:3101/mcp` (or the public tunnel) → it's in the fleet, speaking SIGIL.

## openmoe.ai — VERDICT: do NOT integrate (unverified)
- `openmoe.ai` fails to load — **broken TLS cert** (`ERR_TLS_CERT_ALTNAME_INVALID`, cert ≠ host) — and has **no product footprint** in search. Cannot verify it's a real service.
- The real **OpenMoE** (`XueFuzhao/OpenMoE`, arXiv:2402.01739) is a **2024 open-MoE *research* project** (650M–34B), explicitly an "early effort" — not a 2026 breakthrough.
- **MoE-as-architecture IS the real 2026 story** (DeepSeek-V3/R1, Llama 4, Mistral Large 3, Gemini all MoE). If the goal is "use MoE," that's already what minim3/kimi/the cloud models ARE under the hood — no new dependency needed.
- **Recommendation:** treat `openmoe.ai` as unverified; don't wire it. If you have a specific source/login for it, share it and I'll re-verify. Otherwise the MoE benefit is already in the fleet's models.

## Status board (2026-06-06)
- SIGIL bus: **LIVE** (Mac + VM), task #61 ✅ · swarm/curator/worm-guard/tool-ops: live both · skill library deduped 1264→288 · delegate_task regression fixed.
- Pending levers: #75 Weaviate→pgvector+FSRS · #76 MCP Registry backfill (£0 fix) · #43 Ed25519 (SIGIL external-grade signing).
