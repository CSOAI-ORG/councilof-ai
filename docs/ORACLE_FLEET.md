# Oracle fleet — adjacency note (not a grade oracle)

**Status:** OPERATING substrate · **not** a measurement card source  
**Endpoint:** `GET /api/oracle-fleet` → proxies Always-Free fleet status  
**Canon:** `docs/STACK_HONESTY.md` · `docs/EAT_PLAYBOOK.md` · `docs/RUNPOD_POLICY.md` · `docs/SOVOS/INDEX-METHOD-0.1.md`

Measurement, not certification. Scores never sold. DSH = OS.

## What this endpoint is

An **infra / opinion-substrate status feed**: whether the Oracle Always-Free fleet (supervisor-worker / D1) is reachable and what hostname-only status it last posted.

- **Live** → upstream JSON passthrough (cached ~30s).  
- **Down** → HTTP **502** with `{ error, source: "offline" }` — never a fabricated fleet.

Handler: `functions/api/oracle-fleet.ts`.

## What this endpoint is not

| Claim | Allowed? |
|-------|----------|
| Price feed / market oracle for RWA assets | **No** |
| Grade oracle that invents MEASURED labour / AI-economy scores | **No** |
| Substitute for Ed25519 / SHA-256 GSPC cards | **No** |
| Input into GSPC deterministic grading | **No** |
| Soft “preview grade” for DSH dashboards | **No** |

Labour / AI-economy indices stay **UNMEASURED** until INDEX-METHOD freezes a bank (`/indices`, `GET /api/indices`). RunPod / Oracle GPU capacity does **not** authorize inventing those scores (`docs/RUNPOD_POLICY.md`).

## Opinion vs price feed

- **Opinion / measurement card** (Council OS): signed statement about a public artifact — EAT play; verify offline.  
- **Price feed**: market data product — out of scope for `/api/oracle-fleet`.  
- **Fleet status**: ops telemetry only — adjacency for demos and substrate health, not a grade.

## Operator note

Do not demo `/api/oracle-fleet` as “the board.” Demo `GET /api/gspc` (MEASURED) and `/indices` (UNMEASURED honesty) instead.
