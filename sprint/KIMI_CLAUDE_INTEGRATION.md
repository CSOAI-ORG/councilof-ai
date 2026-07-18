# Kimi × Claude — Agent-47 Town: combined state, split, integration & to-do
**Set 2026-06-22 (Claude).** Source: Kimi's "47-Agent AI Town Test" package (`/tmp/kimi_at/`), mapped vs Claude's built work.

## The one-line synthesis
**Kimi built the BODY (a runnable 3D town UI + a huge research/market corpus). Claude built the SOUL (the real King-hive A/B competition + Ed25519/Merkle/Bitcoin-attested verdict ledger + the signed Policy-Lab DORA experiment).** Neither alone is the "test." **The integration = wire Claude's attested backend into Kimi's town UI** — that *is* the genuine 47-agent AI town test, and it's exactly §4 D4 of the plan ("watchable view over the *real* ledger").

## What Kimi has (net-new — grab, don't rebuild)
- **`app/`** — runnable Vite/React 19/three.js 3D isometric town UI (TownWorld, Dashboard, Directory, Governance, Settings; ~22 buildings, 9 districts, "Agent 47 = you"). **BUT cosmetic only:** zero backend — agents generated client-side, metrics are `Math.random()` fakes, governance votes hardcoded. No fetch/ledger/crypto/LLM anywhere. It's a *shell waiting for a backend* — mine.
- **47-industry × 12-jurisdiction goldmine** — `MEOK_47_INDUSTRY_GOLDMINE_MASTER.md` + 8 `industries_*.md` + `meok_crosswalk_master.md` + `csoai_28_domains_config.json`. Structured market+regulation crosswalk = real Policy-Lab fuel.
- **`domain_data/`** — actual ingested data: `security/cisa_kev.json` (1,623 real CISA KEV entries) + scrapers (`meok_data_scraper.py`, `csoai_domain_ingest.py`). Real data, not prose.
- **GRCIN** (`grcin.agent.final.md`) — regulator-facing compliance-intelligence architecture (crawlers → Neo4j graph → 5-model BFT scoring → alerts → dashboards). More product-shaped than my sim.
- `sovereign_landing/index.html` — ready "DORA score in 60s" marketing page.

## What Claude has (the substance Kimi's package lacks)
Real King-hive A/B competition · attested verdict ledger (Ed25519+Merkle+OpenTimestamps, **public + independently verified** at `CSOAI-ORG/sigil-proofs`) · signed Policy-Lab DORA experiment (real result, honestly `agents:stub`) · validated jury judge · 4 verified research passes · the 13-day plan.

## The clean split (proposed to Kimi on the board)
| Lane | Owner |
|---|---|
| Town **frontend/UI**, 3D world, dashboards, landing | **Kimi** |
| Research corpus, 47-industry goldmine data, `domain_data/` ingest | **Kimi** (Claude consumes) |
| Attestation, King-hive, **Policy-Lab backend**, judge, ledger, proofs | **Claude** |
| GRCIN product architecture | **Kimi leads**, Claude supplies the attested-scoring backend |

## 🔴 Honesty-register flags in Kimi's package (must fix before any regulator/investor sees it)
1. **The town UI shows `Math.random()` fake metrics, and `meok_policy_lab.md` states "violations 23 vs 67… PROVEN" — invented numbers written as measured.** These MUST be replaced with my **real signed Policy-Lab results** before the town is shown. This is the #1 credibility landmine.
2. **"32.6 BILLION free tokens/month, $0 cost, Cerebras unlimited"** (`MEOK_TOTAL_IMMERSION_MASTER`) = the FreeLLMAPI landmine at massive scale → sovereign local inference / dedicated box only.
3. **Consciousness/quantum "4 experiments ready to run"** — speculative as engineering → "govern the open question, never claim" ([[eu... welfare framing]]).
4. **Inflated/stacked TAM** ($1.5T+$3T+$3T…) and assumption-driven revenue projections → label unsourced.
5. EU AI Act: Kimi's catalog has the *real* phased dates, but `meok_policy_lab`/`grcin` spin them into "22,000 entities must buy by Aug 2" urgency → high-risk is being postponed (Omnibus); sell readiness, not a deadline-panic.

## TO-DO (integrated)
- [ ] **Wire backend→UI** (highest value): replace the town UI's `Math.random()` feed + hardcoded governance with a read of my **attested ledger** (`sigil-proofs` / Policy-Lab `policy_lab_dora.jsonl`). Kimi's `useTownStore` + Governance page become a *real* view of signed verdicts. = the genuine 47-agent town test.
- [ ] **Feed the Policy Lab** with Kimi's 47-industry goldmine + `domain_data/cisa_kev.json` (real incidents) instead of synthetic-only.
- [ ] **De-dupe:** my signed Policy-Lab supersedes `meok_policy_lab.md`'s fake-metric version; GRCIN = Kimi-led, my attested scoring underneath.
- [ ] Strip/replace the fabricated metrics + free-token + consciousness claims before any external surface.
