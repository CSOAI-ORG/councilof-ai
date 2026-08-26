# Parallel archive RPC workers — CPU (NEXT_300 #288)

Stage 2 prep design: fan-out **read-only** archive / explorer RPC on **CPU** workers.

## Goals

- Parallelize public-artifact reads (XRPScan, Etherscan, EAS query) for corpus refresh.
- Feed REPORTED rows into ClaimGuard / RWA matrix — never invent MEASURED scores.

## Non-goals

- No GPU for contract churn (#289 · `scripts/no-gpu-contract-churn-lint.mjs`).
- No inventing MEASURED scores from partial RPC responses.
- No publish without custody (`CSOAI_KEY_CUSTODY`) — fail closed (#291).

## Sketch

```
CPU workers (N) → archive RPC pool → normalize public facts → REPORTED fixture write
                                                         ↘ never Wilson on live churn
```

Rate-limit per upstream; backoff on 429; adapters under `adapters/xrpl/` stay unsigned until Stage gates clear.
