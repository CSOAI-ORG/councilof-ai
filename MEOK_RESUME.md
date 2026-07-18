# 🐉 MEOK — RESUME KIT (2026-06-07)

## ✅ RESOLVED 2026-06-07 — VM→Mac resync DONE (was a data-loss hazard)
The crash-reverted files were recovered FROM the live VM and committed (branch `claude/meok-one`,
commits 6b3a154 resync + 037d920 os.html merge). Verified: `grep -c FREE_DAILY_CAP meok_one/auth.py`=4,
`grep -c cap_reached meok_one/server.py`=2, `web/help.html` restored (79 lines). portability.py +
import_bundle.py were already in sync. **Mac repo now == VM for the Python/help + carries the responsive
web work on top → `deploy/deploy.sh` from the Mac is SAFE again.**

Also done same day: the 3 responsive web surfaces (dome/law/os.html) were selectively deployed to the
VM (rsync web/ only, no restart — `_html` reads files per-request, health 200 throughout) and the branch
pushed to GitHub. The os.html cap_reached funnel JS was merged INTO the responsive version before deploy,
so the live funnel was never at risk.

**Still owner-gated:** MEOK ONE is live on the VM (127.0.0.1:4173, Caddy block ready) but NOT public —
`one.meok.ai` is NXDOMAIN. Needs a DNS A-record `one.meok.ai → 35.242.143.249` (registrar/DNS login).
**Commit after every change — uncommitted edits were being lost to crashes.**

## State
- **VM (prod) = source of truth, healthy**: MEOK ONE 36/36 live, funnel BUILT+secure, /help live, warmup live,
  sovereign_search live, SOV3 (ruflo+Aegis+Hermes+kimi+telemetry), MCP Scorecard (338 scored). Disk 17 GB free, RAM 53%.
- **Mac repo = RECONCILED** with VM (resync done 2026-06-07) + responsive web surfaces live on VM.
- Crashes are **session-size**, not Mac resources — work in fresh, focused sessions; commit often.

## Key docs (source of truth)
- `MEOK_MASTER_PLAN_2026-06-07.md` · `MEOK_33_MOVES.md` (moves 1–47) · `MEOK_FUNNEL_GO_LIVE_2026-06-07.md`
- `MEOK_GEO_AUTHORITY_2026-06-07.md` · `MEOK_INTEL_INTEGRATION_2026-06-07.md`

## Open ⬜ moves (after re-sync): 3 usage-indicator · 5 pricing buttons · 6 stripe-return unlock ·
## 41 character-factory verify · 42 moat-story page · 44–47 GEO (schema/constellation/vertical/registry)

## The one needle: Stripe (Nick) — £9 link + `whsec_` → `data/.env` on VM → first £ on the board.
