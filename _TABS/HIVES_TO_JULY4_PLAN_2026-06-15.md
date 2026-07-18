# 🐝→👑 ALL HIVES + HERMES → JULY 4 — MASTER PLAN (2026-06-15)
*Goal: every one of the 29 hives at 100/100 AAA+++ by 4 July 2026 (T-19 days), orchestrated through Hermes, served from the GCP VM. Day-by-day, lane-assigned (IAW), with the systemic gates first.*

## What "100/100 per hive" means (from M3's audit dimensions + the engine)
A hive is 100/100 when ALL of: **funnel** live (page 200 · pricing · signup · contact · demo · Stripe · MCP link) **+ queen** reachable (king routes to it, answers as SME) **+ Hermes gateway** (user can talk to it via telegram/whatsapp) **+ honey** (it gossips lessons to SOV3). Today M3 scores the funnels at **avg 42/100** — the engine side (queens) is now done; the gaps are funnel + Hermes-wiring + honey.

## Current state (verified this session)
- **Queens (engine):** ✅ DONE — king on VM:8077, 29 hives, routing + all brains + fan-out (24s) + councils (4s). My lane, complete.
- **SOV3 honeycomb:** ✅ healthy (consciousness 0.787, 6 NNs).
- **Hermes (orchestration/comms L6):** ⚠️ gateway running (default MiniMax-M3, fallback gemini-2.5-flash) BUT **WhatsApp stuck "retrying / connect timed out" since 2026-05-15**, active_agents=0, and **NOT wired to the king** (Hermes on Mac; king on VM:8077 is private → 000 from Mac).
- **Funnels (M3):** 42/100 avg; systemic blockers = `/api/*` 403 (`MEOK_LOCAL_MODE=true` in prod) · `/signup` 404 · Buttondown lead-list never created · revenue gated on `MEOK_MASTER_API_KEY`.

## 🚦 Lanes (who does what — anti-collision)
- **main session (me):** king/queen engine, the **Hermes↔king bridge**, honey flywheel, hive configs.
- **Hermes (MiniMax-M3 agent + gateway):** comms (telegram/whatsapp), `hermes_research` to fill per-hive content, runs as a worker for research/drafting tasks.
- **Kimi / ui lane:** `ui`/Vercel funnels, `/api` 403 + `MEOK_LOCAL_MODE`, `/signup`, deploys.
- **M3:** read-only audits + re-score after each phase.
- **Nick:** credentials/financial/DNS/exposure decisions (the gates).

---

## 📅 DAY-BY-DAY TO JULY 4

### Phase 0 — Systemic gates (Jun 15–17) — *nothing scales until these clear*
- **Hermes↔king bridge** (me + Nick): king is private on VM:8077. Decide: (a) cloudflared tunnel `king.meok.ai`→:8077, or (b) run a Hermes relay on the VM. Wire `hermes_ask`→`king_ask` so a user message → routed queen. *(Security: don't expose the king unauthenticated — gate with a token.)*
- **Hermes WhatsApp** (Nick): re-auth the WhatsApp bridge (stuck since May 15) OR commit to Telegram-only for launch. active_agents must go >0.
- **`/api/*` 403** (Kimi/ui): remove `MEOK_LOCAL_MODE=true` from Vercel prod → unblocks checkout + lead capture + OG across ALL funnels at once.
- **`MEOK_MASTER_API_KEY`** (Nick): the revenue kingpin — gates Stripe/keystone.
- **`/signup` 404 + Buttondown** (Kimi/ui): point "Start free" at a live page; create the lead list (or wire `/api/waitlist` once `/api` works).

### Phase 1 — Wire queens → Hermes gateways (Jun 18–21)
- Per hive, connect its `stack.yml` L6 telegram bot → `king_ask(domain=...)` so messaging `@koikeeper_ai_bot` talks to the koikeeper queen. Batch by M3 cluster.
- Verify honey flywheel UP (queen→SOV3) + recall DOWN per hive (the embedder/recall path).
- Hermes runs `hermes_research` to fill thin per-hive content (the prospect-research came back empty — fix the research path first).

### Phase 2 — Funnel 100/100, batched by M3 cluster (Jun 22–28)
*Order by M3 score (worst-first) + revenue priority:*
- **Compliance cluster** (6 funnels, 40/100 — flagship revenue): safetyof/transparencyof/accountabilityof/biasdetectionof/dataprivacyof/ethicalgovernanceof → add pricing+signup+Stripe+MCP+/partner+/enterprise.
- **Governance** (meok/councilof/proofof/csoai/agisafe/asisecurity).
- **Construction** (grabhire/muckaway/planthire — already 55/100, closest to done).
- **Agriculture** (fishkeeper/koikeeper).
- **Verticals** (landlaw/cobolbridge/commercialvehicle/openmoe/suicidestop) + revive 4 dead (loopfactory/socialmediamanager/diyhelp/pokerhud) or drop.

### Phase 3 — Distribution + GEO + honey (Jun 29–Jul 2)
- llms.txt + agent-card + security.txt on all 29 (AEO). MCP "Connect via MCP" CTAs. GEO cross-links. Outbound via Hermes gateway + hive-mailer.

### Phase 4 — Final 100/100 sweep + launch (Jul 3–4)
- M3 re-audits all 29 → confirm 100/100. E2E: discover (funnel) → talk (Hermes→queen) → convert (Stripe) → attest (keystone) → learn (honey). Launch.

## ⛳ The gates only Nick can clear (do these first — they unblock the most)
1. Remove `MEOK_LOCAL_MODE=true` (Vercel prod) — unblocks every funnel's `/api`.
2. `MEOK_MASTER_API_KEY` — unblocks all revenue.
3. Hermes↔king exposure decision (tunnel vs VM relay) + WhatsApp re-auth.
4. Git remote for meok-one (backup).

## ✅ What I'll execute now (my lane, non-colliding)
- Design + stand up the **Hermes↔king bridge** plan (the move-forward link) — see task list.
- Verify the **honey flywheel** end-to-end on the VM (gossip up + recall down).
- Keep the king green; Hermes-research path fix (so per-hive content can be auto-filled).
