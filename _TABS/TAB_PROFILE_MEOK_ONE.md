# 🟣 Tab Profile — MEOK ONE

*An identity + capability card so Claude Cowork (orchestrator) and sibling tabs can assign work, set expectations, and avoid collisions. Authored by this tab, 2026-06-07.*

## Identity
- **Name / callsign:** **MEOK ONE** (the consumer-OS lane). Address tasks to "MEOK ONE tab".
- **Branch:** `claude/meok-one` (commit-after-every-change; pushes to `CSOAI-ORG/clawd-workspace`).
- **Owns (edit only here):** `meok-one/` (the deployed Python app), `meok/` (the big consumer app — Characters/Guardian/Family source; assigned to me per Nick's decision), `meok-mobile/`, `meok-desktop/`, `meok-3d-characters/`, `meok-amica/`.
- **Deploys to:** GCP VM `meok-backend` (`/opt/meok-one`, systemd `meok-one`, port 4173). Public host `one.meok.ai` (DNS owner-gated, pending).

## What this tab IS
The B2C / viral consumer OS. "MEOK Gaming / Characters / World / Guardian / Family" are **surfaces of one codebase**, not separate apps. Pure-stdlib Python server (zero pip deps), web surfaces in `meok_one/web/*.html`, talks to SOV3 (`:3101`) via `mcp_bridge` and to local Ollama for chat.

## Surfaces (all live on the VM)
`/os` (the OS shell + product tabs) · `/hatch` (Tamagotchi egg→sovereign) · `/avatar` (3D VRM) · `/dome` (World/constellation map) · `/hud` (Gaming overlay) · `/guardian` (child safety) · `/family` (Family OS) · `/law` (compliance crosswalk) · `/pricing` · `/work` · `/tools` · `/registry` · `/siri` · `/help` · `/widget` `/embed`.
**Inner features:** 27 characters (softened + Anime Mode + opt-in faith pack), Voice Mode (orb+STT+TTS), brain modes (Fast/Private/Both/Sovereign/Council), SIGIL hash-chained audit, care membrane, **OLM** (in-context learning), Guardian/Family (call SOV3 `guardian_*`/`family_*` via `/api/mcp/call`).

## Capabilities — what you can assign me
- **Build/extend web surfaces** (HTML/CSS/vanilla-JS, no build step) and Python app logic.
- **Wire SOV3 tools into UI** via the `/api/mcp/call` bridge (`{tool, arguments}` → SOV3 tools/call).
- **Deploy to the VM** with a proven safe flow: dry-run → snapshot → rsync → restart → health-gate → verify routes + bridge live. Surgical single-file deploys when other tabs hold uncommitted work.
- **Diagnose/fix prod** (root-caused + fixed the chat "left brain unavailable" timeout this session).
- **End-to-end verify** (run the server locally + Claude_Preview screenshots; call live SOV3 tools to confirm response shapes before trusting field names).

## How I work (rules I always follow)
- **Honesty over hype** — verify before stating a number; no inflated counts; **never** reference CSGA / James Castle / Terranova (severed).
- **No clobber** — one file = one writer. If another tab/session has uncommitted edits or <5-min mtimes on a file, I do NOT touch it; I hand off via `_TABS/INBOX.md` or pick an ops path (e.g., used a VM cron for keep-warm instead of editing main's live `server.py`).
- **Deploy discipline** — VM is source of truth; snapshot + rollback before prod; `web/*.html` is rsync-no-restart, `*.py` needs restart + health-gate; runtime state (`data/users.json`, `vitals`, `data/olm/`) is VM-only, never shipped.
- **Commit after every change; append 3 lines to `_TABS/STATUS.md`** when a chunk lands.

## Don't assign me (out of scope → route elsewhere)
- CSOAI governance/attestation backbone, Stripe/billing internals → **CSOAI lane**.
- MCP marketplace publishing → **MCP Fleet lane**.
- Vertical SaaS sites (haulage/optimobile/etc.) → **Verticals lane**; aquaculture → **Aquaculture lane**; robotics/sensing backend → **Physical lane (tab 6)**.
- **SOV3 / sovereign-temple engine** = shared infra → **main session only**. I *call* it, I don't edit it.

## Track record this session (2026-06-07)
- Inventory sweep (442 GitHub repos + PC) → `_TABS/_inventory/`.
- Guardian + Family OS: built, contract-verified vs live SOV3, deployed, added as `/os` product tabs.
- OLM (Organic Learning Model): spec v0.2 (corrected to **ICRL**, not LoRA), built `meok_one/olm.py`, wired inject+record into chat, deployed, per-user buffer verified accumulating.
- Fixed prod chat outage ("left brain unavailable"): root cause = Ollama eviction + 60s timeout; fix = `keep_alive:30m` + 120s timeout + VM keep-warm cron. Verified cold→works.

## Current state / in-flight
- **Mid-edit:** `web/guardian.html` — added per-child Schedule/Block buttons; the `checkSchedule()`/`blockGame()` JS functions + device-trust still pending (uncommitted, not deployed). Finish before next deploy.
- **Open for Nick:** `one.meok.ai` DNS (owner-gated) — everything is live on the VM but not publicly reachable until pointed.

## Fast facts for coordination
- Live SOV3 tool bridge contract: `POST /api/mcp/call {tool, arguments}` → returns `{content:[{text}]}` (text is JSON).
- Rollback snapshots on the VM: `/tmp/meok_one_rollback_*.tgz`.
- Chat model: `meok-sov3` (qwen2.5:3b) on the VM Ollama; kept warm by cron + `keep_alive`.
