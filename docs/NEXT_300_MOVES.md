# NEXT 300 MOVES — ownership register (101–400)

**CSOAI + MEOK + SovOS** · Continues `docs/SOVOS/OWNERSHIP-100-MOVES-2026-08-23.md`  
Measurement, not certification · UNMEASURED is honest · scores never sold · DSH = OS  
Playbook: `docs/EAT_PLAYBOOK.md` · Crosswalk: `docs/ESTATE_CROSSWALK.md`

Status legend: ✅ done · 🔄 in flight · ☐ open · ⛔ owner gate

---

## Phase 6 — Honesty surfaces (101–130) · *name the gaps*

| # | Move | Asset | Status |
|---|------|-------|--------|
| 101 | Ship labour/economy data module | `client/src/data/labourIndices.ts` | ✅ |
| 102 | Indices hub page | `/indices` | ✅ |
| 103 | AI Economy Index UNMEASURED page | `/indices/ai-economy` | ✅ |
| 104 | Human Labour Index UNMEASURED page | `/indices/human-labour` | ✅ |
| 105 | Humanoid Labour Index UNMEASURED page | `/indices/humanoid-labour` | ✅ |
| 106 | Indices JSON catalog API | `GET /api/indices` | ✅ |
| 107 | Per-slug index API | `GET /api/indices/:slug` | ✅ |
| 108 | Products catalog page (HO.2) | `/products` | ✅ |
| 109 | Wire Measure menu → indices | `masterMenu.ts` | ✅ |
| 110 | Wire Solutions → products + powered-by | `siteNavigation.ts` | ✅ |
| 111 | Product tabs: Products + Indices | `productNav.ts` | ✅ |
| 112 | App routes: indices + products + powered-by | `App.tsx` / AppRoutesA | ✅ |
| 113 | Route manifest entries | `route-manifest.ts` | ✅ |
| 114 | Engine-axis candidacy block | `engine-axis.ts` | ✅ |
| 115 | EAT playbook doc | `docs/EAT_PLAYBOOK.md` | ✅ |
| 116 | This register | `docs/NEXT_300_MOVES.md` | ✅ |
| 117 | Update ESTATE_CROSSWALK gap table → surfaces live | `docs/ESTATE_CROSSWALK.md` | ✅ |
| 118 | Lobby measured-tool card for indices | `measuredToolCards.ts` | ✅ |
| 119 | MCP stub `indices_catalog` UNMEASURED | `functions/api/mcp*` | ✅ |
| 120 | Agent-card lists `/api/indices` | `public/.well-known/agent-card.json` | ✅ |
| 121 | README links playbook + indices | `README.md` | ✅ |
| 122 | Surface-hit paths for new pages | already POST from pages | ✅ |
| 123 | Footer sitemap Measure links | `FooterSiteMap` / siteNav | ✅ |
| 124 | Homepage strip: “3 indices UNMEASURED” | `NewHomeV3` | ✅ |
| 125 | Competitors CTA → indices + products | `Competitors.tsx` | ✅ |
| 126 | Payg links → products catalog | `Payg.tsx` | ✅ |
| 127 | DSH dashboard tile for indices | `/dashboard/measurement` | ✅ |
| 128 | E2E smoke: /indices /products /powered-by | `e2e/tests/` | ✅ |
| 129 | Vitest: labourIndices firewall constants | unit test | ✅ |
| 130 | Merge-gate note: branch ≠ master prod | owner | ⛔ |

---

## Phase 7 — Method before score (131–160) · *INDEX-METHOD*

| # | Move | Field |
|---|------|-------|
| 131 | Draft INDEX-METHOD-0.1 skeleton | `docs/SOVOS/INDEX-METHOD-0.1.md` · ✅ |
| 132 | AI-economy input whitelist (org density ≠ score) | method § · ✅ |
| 133 | Human-labour input whitelist (ILO/AEI as context IDs only) | method § · ✅ |
| 134 | Humanoid-labour input whitelist (MachBench tasks) | method § · ✅ |
| 135 | Freeze “never fuse into GSPC” normative clause | method § · ✅ |
| 136 | n≥ threshold for any future Wilson on indices | method § · ✅ |
| 137 | JSON Schema for index snapshot | `/.well-known/schemas/labour-economy-index.schema.json` · ✅ |
| 138 | Empty snapshot fixtures (all null scores) | `scripts/index-fixtures/` · ✅ |
| 139 | HF dataset stub `csoai/labour-economy-unmeasured` | HF · fixture ✅ · verify ✅ `npm run verify:staged-hf` · upload 🔄 |
| 140 | HF README: UNMEASURED doctrine | `datasets/labour-economy-unmeasured/README.md` · ✅ staged |
| 141 | Kaggle mirror policy (REPORTED only) | docs · ✅ in HF plan |
| 142 | Oracle-fleet adjacency note (not grade oracle) | `docs/ORACLE_FLEET.md` · ✅ |
| 143 | RunPod job template: **do not** use for RWA churn | `docs/RUNPOD_POLICY.md` · ✅ |
| 144 | Cursor skill: refuse inventing MEASURED labour scores | `.claude/skills/refuse-measured-labour` · ✅ |
| 145 | Value Ledger remains publishedCount 0 | `scripts/value-ledger-lint.mjs` · ✅ |
| 146 | Corrections path for index method errata | `C-2026-0825-01` · ✅ |
| 147 | Refutation ledger row type for index claims | `kind: index-claim` · ✅ |
| 148 | Public FAQ: why empty indices | `/indices` FaqBlock · ✅ |
| 149 | Regulator-facing one-pager PDF | markdown ✅ · print HTML ✅ `/regulator-indices-one-pager.html` · print PDF ✅ `/regulator-indices-one-pager.pdf` · bespoke design ☐ optional |
| 150 | Counsel review of index disclaimers | ⛔ |
| 151–160 | Ten REPORTED citation captures (dated, linked, no scores) | `docs/REPORTED_CITATIONS_LABOUR_ECONOMY.md` · ✅ |

---

## Phase 8 — RWA × XRPL × Wilson scale (161–200) · *Stage 2 prep*

| # | Move | Field |
|---|------|-------|
| 161 | Expand clean-play adapters to all clean corpus rows | `adapters/` · ✅ |
| 162 | Ondo OUSG adapter harden | `adapters/xrpl/ondo-ousg` | ✅ |
| 163 | RLUSD adapter stub | adapters | ✅ |
| 164 | BUIDL adapter stub | adapters | ✅ |
| 165 | BENJI adapter stub | adapters | ✅ |
| 166 | Aviva-on-ledger gate check | corpus · ✅ |
| 167 | Demo-play hard refuse in publisher | publishers | ✅ |
| 168 | Publisher `--publish` requires `CSOAI_KEY_CUSTODY` | publishers | ✅ |
| 169 | Custody decision: KMS vs Turnkey chosen | ⛔ |
| 170 | KMS both-curves or Turnkey wired | ⛔ |
| 171 | Testnet Memo pointer format frozen | RECEIPT-SPEC | ✅ |
| 172 | EAS indexer compose (read-only) | infra · ✅ |
| 173 | W3C VC 2.0 mapping draft for cards | `docs/W3C_VC_2_0_MEASUREMENT_CARD_MAPPING.md` · ✅ |
| 174 | Wilson only on frozen RWA banks | harness | ✅ |
| 175 | Eight RWA × contact matrix spreadsheet | ops | ✅ |
| 176 | Contact = public artifact URL/address only | doctrine | ✅ |
| 177 | No AUM invented as MEASURED | `scripts/aum-not-measured-lint.mjs` · ✅ |
| 178 | Option A child API keys design | `/powered-by` | ✅ |
| 179 | White-label badge SVG | public | ✅ |
| 180 | Securities counsel pack sent | ⛔ |
| 181 | Counsel written OK for named securities | ⛔ |
| 182 | First testnet signed RWA card | Stage 2 · unsigned TESTNET fixture ✅ · signed card ⛔ custody |
| 183 | Verify path for RWA pack | `/gspc-verify` · ✅ |
| 184 | OS Lobby card for RWA tool | MeasuredToolCard | ✅ |
| 185 | DSH same card | dashboard | ✅ |
| 186 | HF dump of testnet cards (labeled TESTNET) | HF · local pack ✅ · verify ✅ · upload 🔄 |
| 187 | Agent-card RWA tool entry | well-known | ✅ |
| 188 | MCP `rwa_attestation_catalog` | mcp | ✅ |
| 189 | JMWH remains demo-only in CI assert | test | ✅ |
| 190 | CRA SBOM path for Option A SKU | compliance | ✅ |
| 191–200 | Ten issuer public-artifact refreshes | corpus · ✅ |

---

## Phase 9 — Tooling · tabs · nav · homepage (201–230)

| # | Move | Field |
|---|------|-------|
| 201 | Header Measure: Indices | masterMenu · ✅ |
| 202 | Header Measure: Products | masterMenu · ✅ |
| 203 | Header Solutions: Powered-by | siteNav · ✅ |
| 204 | PRODUCT_TABS add Products | productNav · ✅ |
| 205 | PRODUCT_TABS add Indices | productNav · ✅ |
| 206 | Bottom estate bar includes new links | BottomEstateNav · ✅ |
| 207 | Lobby sidebar + AG-UI Control rail | councilOsSideMenu · `LobbySideRail` Control chips seed Ask (consent lock, no auto-nav) · ✅ |
| 208 | GlobalSearch entries | GlobalSearch · ✅ |
| 209 | Homepage hero CTA unchanged; below-fold indices strip | NewHomeV3 · ✅ |
| 210 | MarketingHome alignment check | MarketingHome | ✅ |
| 211 | Instruments catalog links RWA + indices | InstrumentsCatalog · ✅ |
| 212 | API docs page lists /api/indices | ApiDocs · ✅ |
| 213 | Agent runbook curl examples | agent-runbook · ✅ |
| 214 | OpenAPI stub fragment | `public/openapi/indices.yaml` · ✅ |
| 215 | Sitemap.xml new paths | generate-sitemap · ✅ |
| 216 | robots allow | robots.txt · ✅ |
| 217 | OG cards for /indices /products | setOgMeta · ✅ |
| 218 | i18n keys if used | i18n · N/A OpenGridWorks-scoped · `docs/I18N_INDICES_NOTE.md` ✅ |
| 219 | Accessibility pass on new pages | a11y · ✅ |
| 220 | Mobile nav smoke | e2e | ✅ |
| 221–230 | Ten broken-link crawls fixed | QA · ✅ |

---

## Phase 10 — Legal · custody · HO.2 (231–250)

| # | Move | Field |
|---|------|-------|
| 231 | Keep attestation language template current | compliance | ✅ |
| 232 | Custody decision doc owner-signed | ⛔ |
| 233 | No Stripe-as-grade assert in CI | `scripts/no-stripe-as-grade-lint.mjs` · ✅ |
| 234 | Payg/products copy audit HO.2 | copy | ✅ |
| 235 | Privacy: surface-hits path-only | already · ✅ |
| 236 | DPA mention of measurement cards | legal · ✅ |
| 237 | Terms: opinion not advice | legal · ✅ |
| 238 | NRSRO / CRA disclaimer footer shared component | NrsroDisclaimer · ✅ |
| 239 | UK 16939677 on products footer | Products · ✅ |
| 240 | Export control note if any | legal · ✅ |
| 241–250 | Counsel Qs 1–4 cleared (template §) | ⛔ |

---

## Phase 11 — HF · Kaggle · RunPod · Oracle · Cursor DSH (251–280)

| # | Move | Field |
|---|------|-------|
| 251 | HF org `csoai` dataset index page | HF · org live ✅ (`csoai/*` datasets) |
| 252 | Upload GSPC MEASURED snapshot (existing) | HF · ✅ existing `csoai/gspc-boards` (MEASURED boards) |
| 253 | Upload indices UNMEASURED manifest | HF · local fixture ✅ · verify ✅ · upload 🔄 `docs/HF_UPLOAD_RUNBOOK.md` |
| 254 | Upload RWA corpus REPORTED (no fake scores) | HF · ✅ existing `csoai/rwa-attest` (REPORTED corpus) |
| 255 | Kaggle notebook: verify Ed25519 offline | `notebooks/kaggle/ed25519_offline_verify.py` · ✅ |
| 256 | Kaggle: refuse labour MEASURED claims | `notebooks/kaggle/refuse_labour_measured.md` · ✅ |
| 257 | RunPod template: GSPC model axes only | RunPod · ✅ policy |
| 258 | RunPod: ban RWA attestation GPU jobs | policy · ✅ |
| 259 | Oracle-fleet docs: opinion vs price feed | `docs/ORACLE_FLEET.md` · ✅ |
| 260 | DSH parity checklist for every new card | `DSH_PARITY_NEW_SURFACES.md` · ✅ |
| 261 | Cursor cloud env: docs paths in README | README · ✅ · fleet paste `docs/MASTER_CONNECT.md` · ✅ |
| 262 | cursor-guide / agent-runbook sync | docs · ✅ · harmony `docs/COUNCIL_OS_HARMONY.md` · ✅ |
| 263 | Stack honesty row for three indices | STACK_HONESTY · ✅ |
| 264 | Production checklist tick new surfaces | PRODUCTION_CHECKLIST · ✅ |
| 265 | Demo readiness: indices = empty OK | DEMO_READINESS · ✅ |
| 266–280 | Fifteen dataset freshness cron designs | `docs/DATASET_FRESHNESS_CRONS.md` · ✅ |

---

## Phase 12 — Scale contacts × axes (281–320) · *after gates*

| # | Move | Field |
|---|------|-------|
| 281 | Public contact registry schema | schema · ✅ |
| 282 | Import ecosystem contacts as REPORTED | hive · ✅ |
| 283 | Map each contact → axis touch list | matrix · ✅ |
| 284 | Map each contact → RWA adjacency | matrix · ✅ |
| 285 | Map each contact → index context (not grade) | matrix · ✅ |
| 286 | Batch signal dry-run (no publish) | scripts · ✅ |
| 287 | Wilson batch only MEASURED banks | harness · ✅ |
| 288 | Parallel archive RPC workers (CPU) | infra · ✅ |
| 289 | No GPU for contract churn | assert · ✅ |
| 290 | Signed card rate metrics (ops) | metrics · ✅ |
| 291 | Fail closed on custody miss | publishers | ✅ |
| 292 | Fail closed on demo play | publishers | ✅ |
| 293 | Public corrections for any bad card | ledger · ✅ |
| 294 | Mainnet first clean play (post-counsel) | ⛔ |
| 295–320 | Twenty-six clean-play refreshes | Stage 3 · catalog #303–308 ✅ · ops #313–314/#318 N/A ✅ · signed mainnet ☐ custody+counsel |

---

## Phase 13 — Product polish · estate (321–360)

| # | Move | Field |
|---|------|-------|
| 321 | Products page linked from Payg + Pricing | nav · ✅ |
| 322 | Pricing page: no grade SKUs | HO.2 | ✅ |
| 323 | Enterprise page cites Option A | copy | ✅ |
| 324 | Insurers page cites RWA input posture | copy | ✅ |
| 325 | Government page: regulators free forever | copy · `/government` → OS `regulator-brief` ✅ · brief HTML/PDF ✅ |
| 326 | Academy: measurement credential language | copy | ✅ |
| 327 | Live training outcomes ≠ certificates | already · ✅ |
| 328 | Compare page vs incumbents (Wilson moat) | /compare | ✅ |
| 329 | Battlecards sync competitors | /battlecards | ✅ |
| 330 | RAS naming on /products | copy | ✅ |
| 331–340 | Ten MCP tools parity OS=DSH | tools · ✅ |
| 341–350 | Ten Lobby task IDs for new surfaces | lobbyLink · ✅ |
| 351–360 | Ten e2e regressions green | CI · ✅ |

---

## Phase 14 — Distribution · standards · tip (361–400)

| # | Move | Field |
|---|------|-------|
| 361 | Cite INDEX-METHOD in SCITT profile when ready | standards | ✅ |
| 362 | Zenodo method DOI when frozen | standards · gate ✅ `docs/METHOD_FREEZE_GATE.md` · DOI ☐ freeze |
| 363 | IETF differentiation note vs other receipts | standards | ✅ |
| 364 | Press kit: UNMEASURED honesty | `docs/PRESS_KIT_UNMEASURED.md` · ✅ |
| 365 | HF paper card for methodology | HF · draft ✅ `docs/HF_METHOD_PAPER_CARD_DRAFT.md` · publish ☐ freeze |
| 366 | Kaggle competition? only if method frozen | later · gate ✅ `docs/METHOD_FREEZE_GATE.md` · competition ☐ freeze |
| 367 | Partner Option A first design partner | sales ⛔ |
| 368 | Child keys issued | eng ⛔ |
| 369 | Public status page: indices UNMEASURED | StatusPage · ✅ |
| 370 | Branch merge to master (owner) | ⛔ |
| 371 | Cloudflare Pages prod smoke | ops | ✅ |
| 372 | Rollback plan if App truncate | ops | ✅ |
| 373 | MCP push_files size discipline | AGENT_COORDINATION · ✅ |
| 374 | Single-writer tip policy | AGENT_COORDINATION · ✅ |
| 375–390 | Sixteen contact outreach (public artifacts only) | distro · template ✅ · tracker ✅ `docs/CONTACT_OUTREACH_TRACKER.md` · human send ☐ |
| 391–399 | Nine quarterly freshness reviews | ops · ✅ |
| 400 | Re-open next-300 when 101–399 ≥80% ✅ | meta · ✅ code/docs ≥80%; remainder ⛔/🔄/human |

---

## Tipping moves (do not skip)

1. **UNMEASURED pages live** before any fake scores (#101–106).  
2. **Custody + counsel** before mainnet (#169–181, #294).  
3. **DSH = OS** for every new card (#184–185, #260).  
4. **HO.2** on every monetization surface (#108, #233–234).  
5. **Merge to master** is an owner gate (#130, #370) — branch work is not prod.
