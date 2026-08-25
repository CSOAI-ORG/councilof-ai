# Dataset freshness cron designs (ops)

**Status:** DESIGN · fifteen jobs sketched · no invented MEASURED scores  
**Canon:** `docs/HF_DATASET_PLAN.md` · `docs/RUNPOD_POLICY.md` · `docs/ORACLE_FLEET.md` · `docs/SOVOS/INDEX-METHOD-0.1.md`

Measurement, not certification. Scores never sold. DSH = OS.

## Principle

Cron refreshes **citations and manifests**, not grades. Labour/economy rows stay `measured_score: null` until INDEX-METHOD freezes a bank.

| # | Job | Cadence | Output register |
|---|-----|---------|-----------------|
| 1 | Probe `GET /api/gspc` stamp + totals | daily | MEASURED (live) |
| 2 | Probe `GET /api/indices` honesty shape | daily | UNMEASURED |
| 3 | Diff INDEX-METHOD file hash vs tip | weekly | SPEC |
| 4 | Refresh REPORTED citation link HTTP status | weekly | REPORTED |
| 5 | HF pack sync dry-run (no invent) | weekly | UNMEASURED/REPORTED |
| 6 | Kaggle mirror private/public policy check | monthly | REPORTED |
| 7 | RWA public-artifact URL liveness | weekly | REPORTED |
| 8 | Corrections ledger signature_state | daily | FACT |
| 9 | Refutation count lint in CI | every build | FACT |
| 10 | Value Ledger publishedCount === 0 | every build | FACT |
| 11 | Oracle fleet 200/502 (not grade) | hourly | infra |
| 12 | Agent-card `/api/indices` skill still listed | weekly | SPEC |
| 13 | Sitemap includes `/indices` `/products` | weekly | ops |
| 14 | RunPod job template still bans RWA churn | monthly | policy |
| 15 | Owner gate checklist (custody/counsel) unchanged | monthly | ⛔ reminder |

## Anti-patterns

- Cron that writes invented TVL/ARR/wage % as MEASURED  
- GPU batch that “fills” labour indices  
- Soft DSH-only scores  

Implement as GitHub Actions / CF cron only after owner approves secrets; until then this doc is the register.
