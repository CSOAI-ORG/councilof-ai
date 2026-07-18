# MEOK — Complete-All Master Plan (2026-06-06)
*The powerhouse stack as it stands + the sequenced path to "done." Source-of-truth roadmap.*

## 1. What's LIVE now (the sovereign fabric)
**SOV3 (Mac + VM, 115 MCP tools, non-preemptible VM):**
- `swarm_orchestrate` / `swarm_review` — ruflo-pattern Queen/worker + DDD decomposition + Aegis reviewer-gate.
- `curate_skills` — Hermes Curator (graded the library; deduped 1264→288 skills).
- `worm_guard` — Morris-II prompt-injection/worm defense (W1/W2a/W4 wired, **log-only** — soak then enforce).
- `tool_ops` — schema-validate + auto-repair every tool call (reliability).
- `sigil_emit` / `sigil_transcript` — **Ed25519-signed, hash-chained agent ledger** (one MEOK identity `d4cb0eaa…`, externally verifiable, HMAC fallback).
**MEOK ONE:** i18n (EN/ES/FR/DE + switcher) LIVE; OS **Tools panel** surfacing all 115 tools LIVE; SIGIL endpoints.
**MCP catalogue:** 12 revenue flagships **registry-ready + validated** (server.json synced + mcp-name injected).

## 2. The agent fleet — hub wiring status
All brains share the SOV3 hub (`sovereign.templeman-opticians.com/mcp`, always-on VM) so they speak one signed fabric:
| Brain / TUI | Status | How |
|---|---|---|
| Claude Code (opus) | ✅ wired | claude.ai SOV3 connector (✓ Connected) |
| minim3 (MiniMax-M3) | ✅ wired | shares `~/.claude` |
| OpenCode | ✅ wired | `~/.config/opencode/opencode.json` → sov3 |
| Kimi (K2.6) | ✅ wired | `~/.kimi/config.toml` `[mcp.servers.sov3]` (added today; confirm it appears in Kimi's tool list) |
| OpenClaw | ⚠️ teed-up | mcporter skill **enabled**, but the `mcporter` CLI is a broken symlink → `npm i -g mcporter` then `mcporter add sov3 <hub>` |
| Gemini.app | ➖ external | desktop app; no custom-MCP path — use via its own surface |

## 3. Complete-all roadmap (sequenced)

### PHASE 1 — Owner unlocks (fast, highest-value; only you can do these)
1. **`mcp-publisher login github`** (30 sec, device flow for CSOAI-ORG) → I run `_tooling/registry_publish.sh` → 12 flagships live in the **official MCP Registry** = the **£0 discoverability fix** (upstream feed for Glama/PulseMCP/Cursor/VS Code/Claude). **DO THIS FIRST.**
2. **Fire the Show HN** (`revenue/SHOW_HN_FINAL_2026-06-06.md`) — biggest free-traffic lever.
3. **Send C1 + C2** to warm trade clients (£350 mini-audit → SMM retainers → £4,950 done-with-you).
4. **Roll the `rk_live` Stripe key** (security) + free disk headroom (Ollama models ~8GB).
5. (Optional) `npm i -g mcporter` to finish OpenClaw; confirm Kimi shows sov3 tools.

### PHASE 2 — Autonomous builds (I can do; say go)
1. **#75 Weaviate-v3 → pgvector + FSRS** — kills the EOL/security liability + upgrades memory (the #1 risk-reduction). Careful, additive, soak-tested.
2. **Publish SIGIL pubkey + /verify** — makes the Ed25519 moat externally usable (capstone on #43).
3. **Flip worm_guard to enforce** after reading a soak of WORM_GUARD_FLAG events; deploy to VM.
4. **OSCAL output + RFC-3161 timestamps** on the attestation engine (the "evidence artifact" upgrade).

### PHASE 3 — Product / revenue (real builds, ladder to cash)
1. **C2PA marking engine** (`c2pa-python`) for the 2 Dec 2026 watermarking cliff — the Article-50 product.
2. **COBOL "estate-understanding + equivalence-testing" offer** (clearest near-term cash; rides Feb-2026 Anthropic-vs-IBM).
3. **Care-home DSPT/MODS pack** (1 Jul 2026 deadline; Templeman = captive first customer = fastest pound).
4. **Microgreens Phase-0 pilot** (3 crops + IoT logging + 2 B2B LOIs) — de-risks the 24,000 sqft build + grant evidence.
5. **Governance-membrane (#79)** — the research-backed agent product (wraps CrewAI/LangGraph/OpenAI-SDK, enforces EU-AI-Act policy + signed attestations). Coin an ownable name (not OpenSIGIL/OpenMoE).

## 4. Owner-gated (consolidated — the things I can't do)
- `mcp-publisher login github` (Phase-1 #1 — THE unlock).
- Stripe products/keys (C2 tiers, key roll), DNS/domain buys (opensigil.ai/.dev if pursuing), sending email/DMs (Show HN, C1/C2 outreach), GitHub org perms, disk cleanup of personal data.

## 5. The one move that matters most right now
**`mcp-publisher login github`** → I publish the 12 flagships to the registry → MEOK is finally *discoverable where buyers look*. Everything else is built and waiting.
