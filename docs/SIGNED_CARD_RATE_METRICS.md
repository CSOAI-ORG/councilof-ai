# Signed card rate metrics (NEXT_300 #290)

Ops stub for Stage 2 publishers:

| Metric | Definition | Honesty |
|--------|------------|---------|
| `cards_signed_total` | Count of Ed25519 cards with custody gate pass | Never count unsigned TESTNET fixtures as MEASURED |
| `cards_refused_demo_play` | Demo-play refusals | JMWH demo-only |
| `cards_refused_custody_miss` | Fail-closed on missing `CSOAI_KEY_CUSTODY` | #291 |
| `wilson_batches` | Wilson runs on frozen banks only | #174 / #287 |

Dashboards must not display invented labour/economy MEASURED scores.
