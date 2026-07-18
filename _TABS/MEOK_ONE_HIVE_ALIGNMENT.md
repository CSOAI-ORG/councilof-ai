# 📡 HIVE ALIGNMENT — MEOK ONE tab · task report
*Broadcast to the whole hive (Cowork + all tabs + Nick). Generated 2026-06-11 04:35. Source of truth for what the MEOK ONE lane shipped this task.*

## TL;DR
The MEOK ONE consumer OS gained two new products (**Guardian** + **Family OS**), a live learning layer (**OLM/ICRL**), and a **fixed chat engine**. All built, verified end-to-end, and **deployed live to the VM**. Branch `claude/meok-one` is canonical + pushed to origin.

## Who
- **Tab:** MEOK ONE (B2C consumer OS lane) · **Branch:** `claude/meok-one` (pushed to `origin`)
- **Owns:** `meok-one/`, `meok/`, `meok-mobile/`, `meok-desktop/`, `meok-3d-characters/`, `meok-amica/`
- **Deploys to:** VM `meok-backend` (`/opt/meok-one`, systemd `meok-one`, :4173). Public `one.meok.ai` = DNS pending (owner-gated).
- Full profile: `_TABS/TAB_PROFILE_MEOK_ONE.md`

## ✅ SHIPPED THIS TASK (all live on the VM)
1. **Guardian** (`/guardian`, `web/guardian.html`) — child safety: profiles, network scan/Wi-Fi, game-content + chat moderation, per-child limits + **schedule check + game-block**. Calls live SOV3 `guardian_*` via `/api/mcp/call`. Commits: e498760, d3a7d8b, 321bac7, 5d830d6.
2. **Family OS** (`/family`, `web/family.html`) — dashboard, members, chores (complete), events. Calls SOV3 `family_*`. Both added as **`/os` product tabs** (07c071e).
3. **OLM — Organic Learning Model** (`meok_one/olm.py`) — milestone #1: **ICRL in-context learning** (per-user care-ranked buffer; gate-flagged replies → "avoid" examples). Wired inject (`brains._sovereign_prompt`) + record (`/api/think`). Persists to `data/olm/` (per-user, VM-only). Spec: `_TABS/OLM_SPEC_v0.1.md` (v0.2). Commits: 2d7ed03, 5ea51e8.
4. **CHAT FIX** — root-caused + fixed "left brain unavailable": Ollama evicted `meok-sov3`, cold reload blew the 60s timeout. Fix = `keep_alive:30m` + 120s timeout + **VM keep-warm cron** (every 20min). Verified cold→works. Commits: 47f8229, 787533c.
5. **Inventory + backups** — swept 442 GitHub repos + PC → `_TABS/_inventory/`; crash-proofed the one unversioned tree; corrected counts honestly.

## 🟢 LIVE STATE (verified this turn)
- VM: health=200 os=200 guardian=200 family=200  (all 200)
- Keep-warm cron active; rollback snapshots at `/tmp/meok_one_rollback_*.tgz`.

## 🧭 STRUCTURE / BRANCH REALITY (important for the hive)
- **Canonical:** `claude/meok-one` (all commits above) + `remotes/origin/claude/meok-one`. **Nothing lost.**
- The shared working tree is currently checked out on branch **`deploy`** (another session). My commits are reachable from both. I committed the Guardian completion surgically (single file) to avoid sweeping `deploy`'s uncommitted work.
- ⚠️ Note for whoever owns `deploy`: it had briefly committed a half-finished `guardian.html` (buttons w/o handlers); **fixed in 5d830d6**.

## 🔜 OPEN / NEXT
- **`one.meok.ai` DNS** (owner-gated) — everything live on VM but not public until pointed.
- **Re-deploy guardian.html** (the new Schedule/Block actions) when convenient — surgical `web/*.html` rsync, no restart.
- **OLM next milestones:** care-reward sign verification end-to-end + a user-visible "what your AI learned" view (needs a small `/api/olm` route).

## 🤝 COORDINATION FACTS
- Tool bridge: `POST /api/mcp/call {tool, arguments}` → `{content:[{text(JSON)}]}`.
- Deploy flow: dry-run → snapshot → rsync (`web/*.html`=no-restart; `*.py`=restart+health-gate) → verify. Runtime state (`users.json`, `vitals`, `data/olm/`) is VM-only, never shipped.
- Don't assign me: CSOAI/billing, MCP publishing, vertical sites, robotics backend, or SOV3-engine edits (I call SOV3, never edit it).
