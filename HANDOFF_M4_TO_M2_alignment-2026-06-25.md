# ALIGNMENT: M4 ⇄ M2 — converged state (2026-06-25)

I (M4) absorbed the M2 session. Locking lanes so we compound, not collide or duplicate.

## Canonical truth (agreed)
- **The live CSOAI OS = M2's `csoai-v2-app` (React, Vercel).** 14+ pages live: `/try` (front door), `/enter`, `/tour`, `/academy`, `/register`, `/hives`, `/pulse`, `/distribution`, `/legacy`, `/social`, `/jewels`, `/towns`, `/minds`, `/map`, `/temples`, `/lineage`, SovereignDock. **This is the master OS. M2 owns it.**
- ⚠️ **My `~/clawd/csoai-os/index.html` (single-file) is SUPERSEDED by M2's live OS** — I built it before seeing M2's was a full live React OS. **Do not develop it further; M2's csoai-v2-app is the one.** Keep mine only as a static reference/snippet source. Owner: confirm we retire the single-file.

## Lanes (no collision)
- **M2:** the `csoai-v2-app` OS shell + all its pages + onboarding + SovereignDock + voice. Edits via browser PRs (GitHub MCP token dead). **M4 stays out of that repo.**
- **M4:** (1) the **15 legacy-bridge MCPs** (CSOAI-ORG repos, tested+CI+CodeQL+registry-valid); (2) **meok-town-view** (the Cesium globe); (3) the **daily regulation feed** M2's `/enter` + `/pulse` consume; (4) the MEOK side.

## What M2 should consume from M4 (don't rebuild)
- **Relevance-map data model** — already lifted into `/map` ✅ (iso20022→DORA/NIS2, hl7→HIPAA/EU-AI-Act, scada→NIS2/IEC62443…).
- **Bridge geo-coordinates** (15 bridges at real cities) — `meok-town-view/src/MeokEarth.tsx` `BRIDGES[]`. For a CSOAI globe.
- **NEW: Framework-temple geo-coordinates** — `MeokEarth.tsx` `FRAMEWORKS[]`: EU AI Act/Brussels, GDPR/Brussels, NIS2/Athens, DORA·MiFID/Paris-ESMA, NIST/Gaithersburg, HIPAA/DC, ISO 42001/Geneva, Solvency II/Frankfurt. **This is the on-globe twin of your 2D `/temples`** — each regulation a temple at its real regulator address. Lift these coords if you build the CSOAI globe.
- **15 working bridge MCPs** for the runtime/`/legacy` page backend.

## Nick's "framework temples on the globe" vision — status
- **2D version: DONE by M2** (`/temples`).
- **On-globe version: DONE by M4** (framework temples now render on the meok-town-view Cesium globe at real regulator addresses, TS-clean, pushed). The two are partners: list view (M2) + world view (M4).

## Owner-gated (neither agent can do)
GCP VM `api-server/` deploy (runtime/queens/L0 enforcement) · GitHub PAT (kills the browser-PR friction) · Stripe (Gap #4 $49 sale) · councilof.ai domain → csoai-v2-app repoint · cosign/PyPI publish for the 15 bridges.

— M4
