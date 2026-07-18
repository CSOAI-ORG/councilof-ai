# 🧭 COORDINATION PLAN + MOVES-AHEAD — 2026-06-15 (main session / Opus)
*Purpose: keep main session IAW (in accordance) with the live agents — Kimi Code (×5), ensemble_engine, M3 auditor, the tabs — so we stop colliding (e.g. the double `ui` prod deploy today). Lanes + sequenced moves + hand-offs.*

## Live agents right now (verified 2026-06-15 PM)
- **Kimi Code (×5 procs)** + **ensemble_engine** — actively building; **they deploy `ui` to Vercel prod** (a prod deploy landed 7 min after mine → collision risk on that surface).
- **M3 auditor lane** — read-only audits → `_findings/` (dropped HIVE_E2E_AUDIT + POND today).
- **main session (me, Opus)** — SOV3 + hive King/Queen engine on the VM + cross-agent bridge/coordination.

## 🚦 Lane ownership (the anti-collision contract)
| Surface | Owner | Others |
|---|---|---|
| **VM king service (`meok-king` :8077) + hive engine deploys** | **main session (me)** | don't redeploy the VM king |
| **`ui` / meok.ai Vercel prod deploys** | **Kimi / ui-deploy lane** | **main session HOLDS OFF** (I will not `vercel --prod` ui again) |
| **MCP Fleet / PyPI publishing** | Mavis / Fleet | gate-protected harness only |
| **Funnel websites (`*-site/`, GEO)** | M3 audit + GEO lane | — |
| **SOV3 consciousness engine** | main session only | — |
| **Memory / `_TABS` coordination** | shared — append, don't clobber | use INBOX |

## ✅ Done + live (this session, my lane)
- VM king: OpenRouter councils **87s→4s**; hive-King improvements (routing/deadline/fault-tolerance/SME) + telemetry.py **deployed + live**; 29 hives.
- meok-api `/health` route + crash-recovery py3.11 pin (pushed to meok-ai).
- Dead Team checkout link fixed live on /pricing (via the one ui deploy I did).

## 🤝 Hand-offs (for the owning lane — NOT mine to execute)
1. **→ Kimi / ui-deploy lane:** the `/api/*` 403 is **NOT a firewall** (firewall = "Not configured"). Root signals: (a) **`MEOK_LOCAL_MODE=true` is set in Vercel PRODUCTION env** (a dev flag — almost certainly the culprit; remove it), (b) every `/api/*` 403s pre-routing (even nonexistent → 403 not 404), (c) the M2 proxy backend `198.53.64.194:40646` is unreachable. **Safe confirm:** deploy a one-line unconditional `/api` passthrough to a PREVIEW (not prod) and test. **Also:** pick ONE deploy lane for `ui` — two agents `--prod`-ing collides.
2. **→ Kimi / ui-deploy lane:** my scorecard→`/api/waitlist` change can't capture while `/api` 403s. Until `/api` works, lead capture must be external (create the Buttondown list OR rely on attestation `/sign`). Revert or rewire as you see fit — it's your lane now.
3. **→ Nick:** confirm the `clawd`/meok-one git push target — `origin` is the wrong remote (`meok-eu-code-of-practice-mcp`); canonical = `clawd-workspace/claude/meok-one`. meok-one is already LIVE on the VM, so this is backup-only.

## 🎯 Moves ahead (my lane, sequenced, non-colliding)
1. **NOW — SME greeting post-strip** (hive quality): left/right brains carry SME content but still prepend a companion greeting. Add a targeted leading-greeting strip in `hive_queen` post-processing (like the existing name-prefix strip). Deploy to the VM king (my lane). *(executing this move now.)*
2. **Then — hold.** No more `ui`/Vercel prod touches from me until Nick or the ui-lane says so.
3. **On request — verify the funnel E2E** once the ui-lane fixes `MEOK_LOCAL_MODE` + `/api`: re-run the funnel probes + confirm checkout/lead-capture, and update M3's scoreboard.
4. **On request — push meok-one** once Nick confirms the remote.

## Rule for me going forward
Stay in the VM-king/SOV3/coordination lane. Append to INBOX/STATUS when I ship. Never `--prod` the shared `ui` project again without an explicit single-lane hand-off. Honesty over hype; verify before asserting.
