# 🐝 Per-feature hive + queen — the self-improving OS (2026-06-25)
Nick's vision: **every tool/feature gets its own hive with an inner SOV3 queen** — learns from how people use it (OS/app/chat), self-improves, fixes itself, never gets stuck, always aware + ensemble. Here's the honest architecture + the concrete first step now built.

## The model
```
USER interacts (open app · chat · choose · drag · pick brain)
        ↓ track(feature, action, meta)   ← BUILT (telemetry per feature)
Per-FEATURE event stream  (each tool = its own signal)
        ↓ ingest
Per-feature HIVE · inner SOV3 QUEEN  — learns this feature's patterns, retrains, proposes improvements
        ↓ coordinate / vote
KING ensemble (sovereign-temple: ensemble_engine + neural models + crisis_monitor)
        ↓ never-stuck safety net
If a queen is unsure/stuck → escalate to King → fallback to the proven path (the dock already falls back gracefully)
```

## ✅ Built now (the foundation — without this, nothing can learn)
- **`track(feature, action, meta)`** in MEOK_OS — every interaction logs a per-feature event to `meok_events` (always-aware local stream) + a running tally in `meok_feat_counts`. Verified: opening Revenue + MEOK Earth + a chat produced `{app:revenue:1, app:meokearth:1, chat:1}`.
- Wired into **app-opens** and **chat-asks** (highest-signal); extends trivially to mode/signature/drag/brain-pick.
- This is the **learning signal** every per-feature queen consumes.

## ✅ Already exists in SOV3 (the brains the queens run on)
- **`sovereign-temple`**: trainable **neural models** (care_validation_nn etc. — `is_trained:true`), **`ensemble_engine.py`** (the ensemble), **`crisis_monitor.py`** (never-stuck monitoring), the **King hive** + the signed flywheel (every decision attested).
- The dock already **routes to SOV3** + **falls back gracefully** = the "never get stuck" safety net in miniature.

## 🔧 The gap to close (honest — these are real builds, owner/eng work)
1. **SOV3 `/telemetry` ingest endpoint** — a small FastAPI add so the OS `track()` stream POSTs to SOV3 (no endpoint today; all 404). Then events reach the brain.
2. **Per-feature queens** — one learning loop per feature (consume its events → retrain its slice → propose a tweak). SOV3 has the NN-training; this is wiring a loop per feature, not new ML.
3. **King ensemble coordination** — the queens report up; King votes/ratifies (ensemble_engine + the signed council) = "always aware + ensemble."
4. **Self-fix / never-stuck** — on low-confidence, a queen escalates to King → fallback to the last-good behaviour (the pattern the dock already uses).

## Honest read
- **"Learn from user interaction" is now possible** — the telemetry (the missing input) is captured. Before this, there was nothing to learn *from*.
- **"A queen per tool that ASI-evolves" is the north star, not a switch** — but the path is real and incremental: telemetry (✅) → ingest endpoint → per-feature retrain loop → ensemble coordination. SOV3 already has the training + ensemble + monitor pieces; this connects them per-feature.
- I did **not** fake autonomous evolution — I built the **learning signal** and mapped the exact wiring to the brains that already exist.

## ✅ LOOP CLOSED (2026-06-25) — OS interaction now feeds the live brain
- Added **`/telemetry`** POST endpoint to `sovereign-mcp-server.py` (appends per-feature events → `data/os_telemetry.jsonl`, returns by-feature counts).
- OS `track()` → `flushTelemetry()` batches → **POST `http://127.0.0.1:3101/telemetry`** → SOV3 ingests. **Verified end-to-end: log grew 2→9 lines with real OS events** (app:delboy, app:king, chat queries).
- Deployment: the canonical :3101 is a **launchd-managed gunicorn** (`com.meok.sov3-gunicorn`, WorkingDirectory `~/clawd/sovereign-temple`, loads `sovereign-mcp-server:app`, 2 uvicorn workers, bind 127.0.0.1). Applied via `launchctl kickstart -k gui/$(id -u)/com.meok.sov3-gunicorn`.
- ⚠️ **INFRA GOTCHA:** `localhost:3101` resolves to IPv6 `::1` → an **SSH tunnel (pid on [::1]:3101) → a REMOTE hive running OLD code** (404 on new endpoints). The **local** gunicorn is **IPv4 `127.0.0.1`**. Always hit `127.0.0.1:3101` for the local server; `localhost` may go to the remote tunnel. (The dock's `/chat` uses `localhost` — works because remote also has /chat, but consider switching to 127.0.0.1.)

## ✅✅ FULL SELF-IMPROVE LOOP CLOSED (2026-06-25) — the OS now self-modifies from usage
- **Queen** (`per_feature_queen.py`): reads `os_telemetry.jsonl` → per-feature usage → proposals + a **King-ratify gate** (`ratify()`: pin the top APP path if share≥15%) → writes `data/os_directives.json`.
- **SOV3** serves it: `GET /os/directives` (live on the gunicorn, kickstarted).
- **OS self-applies**: `applyDirectives()` fetches `127.0.0.1:3101/os/directives` on load → **moves the ratified app to the front of the tile order** (saveTileOrder+paintTiles) → the sovereign announces it.
- **VERIFIED e2e**: usage made Revenue 22% → queen proposed → King ratified `pin:revenue` → **OS pinned Revenue to the FIRST tile** + dock said *"I learned Revenue is your most-used — I've pinned it to the front. (King-ratified from your usage.)"*
- Dock `/chat` → `127.0.0.1` (local brain, not the ::1 remote tunnel).

The chain is live: **interact → track → /telemetry → SOV3 → queen → King ratify → /os/directives → OS self-reorders + tells you.** The OS genuinely learns from how it's used and improves itself, governed (ratified) by the King.

## Honest scope
- The queen + ratify are **heuristic pilots** (usage stats + a share threshold), not yet SOV3 neural-retrain or the full signed BFT council — but the loop is real, runs on live data, and self-applies.
- `applyDirectives` re-pins on each load from the latest directive; announce fires once per directive-ts.

## Next (deeper)
- Replace the heuristic queen with **SOV3 neural retrain** per feature; replace the heuristic King gate with the **signed BFT council** (attested ratification on the ledger).
- More directive types (demote, add-quick-action, theme) + per-feature queens beyond the pilot.
