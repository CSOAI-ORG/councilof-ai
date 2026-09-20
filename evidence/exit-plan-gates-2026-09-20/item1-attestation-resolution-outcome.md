# Item 1 outcome — GSPC attestation defect resolution path

Date: 2026-09-20. Verdict: **FIX MERGED; DEPLOY BLOCKED — owner-side account action required.**

## What was done

| Step | State | Evidence |
|---|---|---|
| Defect found (live `site_attestation` INVALID under published rule) | DONE | `evidence/reconciliation-2026-09-20/` (RECON-2026-0920-01) |
| Root cause (`leader: undefined`: canonical() emits literally, JSON.stringify drops) | DONE | in-repo harness proof; served bytes byte-equivalent after fix |
| Fix + proof + 16/16 vitest + tsc clean | DONE | PR #2657, merged as `1cf29374` on master |
| Correction ledger entry C-2026-0920-01 | DONE | PR #2658, merged as `05d3d263` on master |
| Deploy via GHA on master | **BLOCKED** | see below |
| Post-deploy live re-verification | PENDING | current live still INVALID (expected pre-deploy; re-checked 2026-09-20T03:40Z) |

## Why the deploy is blocked (direct evidence)

- `gh api .../actions/runs?created>=2026-09-19` → **0 runs**; latest run of any kind is
  2026-09-15T08:06Z. Push, schedule (cron `20 */3 * * *`), and dispatch triggers all silent
  for ~5 days.
- `gh workflow run "Build + deploy site (gated production branch)" --ref master` →
  **HTTP 422: "Actions has been disabled for this user."** (2026-09-20T03:5xZ)
- Repo-level Actions permissions report `enabled: true`, all workflows `active` — so the
  disablement is at the account/user level (billing, spending limit, or account flag).
  Org-level permission endpoints return 404 to this token (not determinate — no org-admin scope).
- The master `deploy.yml` itself is correctly configured (push paths cover `functions/**`,
  `public/**`; schedule present; follower coupling repaired in the same squash merge by a
  concurrent lane's trigger-coupling fix).

## What restores it

Owner-side only: resolve the GitHub account Actions disablement (billing/spending/account
flag), or use the owner-only direct deploy path per DEPLOY-LOCK.md. After any deploy, run the
one-file live check in `evidence/reconciliation-2026-09-20/README.md` ("site_attestation must
verify from served bytes") and update C-2026-0920-01 with the readback.

## Explicitly not done

No direct wrangler deploy (owner-only per DEPLOY-LOCK.md). No DNS, secret, identity, or
external-account changes. No migration steps from the input plan.
