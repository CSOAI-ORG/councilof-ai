# CRA COMPLIANCE — Cyber Resilience Act posture (2026-08-25)

Scope of this note: the estate's **digital products and services sold/used in the EU**
(public measurement surfaces + the licensed/white-label attestation engine). Internal
standards compliance matrix: CRA Regulation (EU) 2024/2847.

## The dates that bite
| Date | Obligation |
|---|---|
| **2026-06-11** | Notified-body provisions (conformity-assessed categories) |
| **2026-09-11** | **Vulnerability/incident reporting to ENISA live** — 24h early warning / 72h notification / 14-day final report |
| **2026-12-11** (…2027-12-11 full conformity) | Conformity obligations by category |
| 2026-07-27 | Commission implementation guidance **ref C(2026) 5252** (~80 pages) |

## What is in scope for us (honest)
1. **Attestation engine (`harness/rwa-attest/`)** — if/when white-labelled or licensed
   into the EU it is a "product with digital elements": SBOM + vuln reporting apply
   (Sept 11 2026 for reporting readiness). **Today:** the engine is Python **stdlib only**
   (verified: `rwa_attest.py` imports json/os/sys/time/hashlib/urllib only) → SBOM is
   trivially small and regenerable.
2. **Public web app** (`client/` + `functions/`, Vite/React) — served globally; EU users
   in scope. SBOM = package.json deps (see `interop/sbom-councilof-ai.json`).
3. **Verify/MCP surfaces** — no third-party runtime code beyond the above.

## The workflow (who runs it)
- **24h:** early-warning to ENISA on first suspicion of exploited vulnerability (scripted
  from incident log `docs/incidents/`).
- **72h:** vulnerability notification (severity, affected products, mitigations).
- **14d:** final report (root cause, remediation, disclosure).
- Duty holder: K3 lane (with on-call rotation noted in `docs/incidents/RUNBOOK.md` — to be
  created before 2026-09-01).

## SBOM regeneration
```
python3 scripts/gen_sbom.py   # writes public/interop/sbom-councilof-ai.json (commit-pinnable)
```
The SBOM records: (a) web runtime components from `package.json` at the pinned commit;
(b) the attestation engine as stdlib-only (no external components); (c) the generator
version. Re-run on every release of a licensed engine build.

## Supply-chain notes (from freshness pass, 2026-08-25)
- xrpl.js CVE-2025-32965 (CVSS 9.3, disclosed 2025-04-22, affected 4.2.1–4.2.4 + 2.14.2,
  fixed 4.2.5 / 2.14.3, current 5.x) — **not in our dependency tree** (engine is stdlib
  python; client has no xrpl dep). Any future JS consumer must pin ≥4.2.5 / 5.x + SCA.
- npm 2FA-token changes (Aug 2026 account changes; Jan 2027 direct-publish restriction):
  prepare automation tokens.
- No LLM judge in the measurement path (CI-hook planned — NEXT-100 #4).
