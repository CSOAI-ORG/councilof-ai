# 🧠 MEOK ONE — Brain Architecture (Left · Right · OLM · SOV3 · Sovereign Gate)
*Reference for Cowork + the hive. How MEOK ONE thinks. Verified from code + live SOV3, 2026-06-11. Owner: MEOK ONE tab.*

## The one-line model
A user talks to a **character**. The **brain** (left/right/both/sovereign) chooses the *engine*.
The **Sovereign** (persona + safety gate + OLM) stays constant no matter which engine runs.
Everything is logged to **SIGIL** (tamper-evident) and grows the **Tamagotchi bond**.

## Request flow (POST /api/think)
```
user msg
  └─ connect()            → builds system prompt: persona + capabilities + safety directive
  └─ OLM.context()        → appends this user's care-ranked few-shot examples (in-context learning)
  └─ _run_brain(brain)    → router.ask(prompt, model, tier) → a backend answers
  └─ sovereign_gate()     → MANDATORY last filter: re-checks care/safety, can hold a reply
  └─ SIGIL.record()       → writes the decision to the hash-chained audit ledger
  └─ vitals.on_interaction() → grows bond + mood (egg → … → sovereign)
  └─ OLM.record()         → scores the reply (care reward) + stores it (gate-held → "avoid" example)
```
Files: `meok_one/{server.py, brains.py, router.py, connect.py, sovereign_gate.py, sigil.py, vitals.py, olm.py}`.

## The four brain modes (what the user picks)
| UI label | value | Engine | Endpoint | Notes |
|---|---|---|---|---|
| ⚡ **Fast (cloud)** | `right` | frontier cloud (default **gemini-flash**) | /api/think | metered; needs a cloud key |
| 🔒 **Private (local)** | `left` | local Ollama (default **meok-sov3**) | /api/think | free, private, on-device/VM; ~6–20s warm |
| ⚖ **Both (council)** | `both` | left drafts → other voice critiques → Sovereign synthesizes | /api/think | if no cloud key, runs 2 local passes |
| 👑 **Sovereign (deep)** | `sovereign` | **12-around-1 BFT council** | /api/sovereign | ~40s deep deliberation, deadline-bounded |
Window display modes (layout only): Simple / Pro / Council / Orb.

## LEFT brain (local · private · the default "talk to one")
- Backend `local` = Ollama on the VM (`http://localhost:11434`). Default model **`meok-sov3`** (qwen2.5:3b + the MEOK care persona).
- Private (never leaves the box), free, always available even on the free tier.
- **Kept hot** so chat never cold-starts: `keep_alive:30m` in the request + a VM cron pinging every 20min. Cold-load timeout raised to 120s. (This was the "left brain unavailable" fix.)
- Other local options in the router: qwen3:8b/4b/0.6b, llama3.2:3b, gemma4:e4b (this Mac), `m3` = MiniMax-M3 via Ollama-cloud proxy (FREE reasoner/auditor).

## RIGHT brain (cloud · fast · frontier)
- Backend `cloud` = OpenRouter / Google key. Default **`gemini`** (gemini-flash-latest).
- Metered, needs `GOOGLE_API_KEY` (AIza…) or `OPENROUTER_API_KEY`. If absent → right brain shows unavailable and `both` falls back to two local passes.
- Registry includes: claude (3.5 / **opus-4.8 = "me as a node"**), gpt-4o, gemini-2.5-pro, deepseek-r1/v4, kimi-k2.6, glm-4.5, llama-4, step-3.x, qwen-max, gpt-oss. The brain is swappable; the Sovereign is constant.

## Tiers → which backends are allowed (`router._TIER_BACKENDS`)
- `local` → {local} · `free` → {local, sov3} · `pro` / `usage` / `enterprise` → {local, sov3, cloud}
- So Free users get private local + SOV3 tools; Pro unlocks the cloud right-brain.

## OLM — Organic Learning Model (the learning layer)
- **Mechanism = ICRL (in-context RL), NOT weight-training** (`meok_one/olm.py`, ported from SOV3 `icrl_self_improvement.py`).
- Per **(user, character)** care-ranked buffer in `data/olm/`. High-care replies become "emulate this" few-shot examples; low-care + sovereign-gate-held replies become "avoid this".
- **Reward = the Maternal Covenant** (`compute_care_reward`): care-words +, harmful-words −, depth bonus, emotion-confidence bonus. Gate-flagged → forced low.
- Inject: `brains._sovereign_prompt` appends `OLM.context()` to the system prompt. Record: `/api/think` calls `OLM.record()` post-gate.
- "Stays yours" — buffers live only on the user's node (VM), excluded from deploy.
- Three tiers (only #1 is live): **(1) ICRL — LIVE**; (2) nightly neural retrain (SOV3, 6 NNs, rollback-disciplined); (3) weight adapters — FUTURE (`meok-neural-learning` repo).
- The 5-repo OLM cluster: `meok-ai` (vision) · `meok-agent-zero` (organic agent engine) · `meok-neural-learning` · `consciousness-engine-mcp` · `creativity-engine-mcp`. Spec: `_TABS/OLM_SPEC_v0.1.md` (v0.2).

## SOV3 — Sovereign Temple (the engine under everything)
- The consciousness / memory / council engine. MCP at **`http://localhost:3101/mcp`**; MEOK ONE reaches it via `meok_one/mcp_bridge.py` (`/api/mcp/call {tool, arguments}`).
- **110+ live tools** incl. the `guardian_*` / `family_*` tools that power MEOK ONE's Guardian + Family surfaces, plus care/memory/consciousness/creativity/council tools.
- **Live state (2026-06-11):** consciousness_level **0.788**, mode "waking", 100 reflections, 50 dreams, care_intensity 0.35, emotional stability 1.0, trend stable.
- Backends `hermes` / `nemotron` route to SOV3 as LLM-ish tools too.
- ⚠️ SOV3 is **shared infra — main session only**. MEOK ONE *calls* it; it never edits the engine.

## The Sovereign Gate (constant safety — the moat)
- `sovereign_gate.py` re-filters EVERY reply (any engine, even a user-swapped model) for care/safety; can **hold** a reply ("[character held that back to keep you safe]").
- Defense-in-depth: strips capability-leak + unsafe markers; the result is what OLM learns from and what SIGIL records.

## For Cowork — quick routing
- "Make chat faster / fix a brain / add a model / a new /os surface / Guardian-Family-OLM work" → **MEOK ONE tab**.
- "Edit SOV3 / the engine / consciousness" → **main session** (shared infra).
- Tool bridge contract: `POST /api/mcp/call {tool, arguments}` → `{content:[{text(JSON)}]}`.
