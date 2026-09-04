# Claude master — integration and release lane

**Date:** 2026-09-04
**Candidate branch:** `codex/council-release-live`
**Checkpoint:** reconciled from `origin/master` at `24291d5d0`; refresh before merge
**Owner:** Claude master release operator

## Outcome

Integrate the reviewed frontend and backend lanes into one reproducible release,
show the production-shaped preview, obtain owner approval and make the single
controlled production write through the repository workflow.

**Current state:** the unified dashboard integration is present and the full
unit suite passed **1,442/1,442 across 132 files** before the final truth and
witness remediations. The latest client build also passed. Council independence
is now labelled honestly (`rho=1`, `n_eff=1` across three lineages/two
providers), simulated engine protocol doors are removed from the served tree,
and 22 speculative Web3 rails fail closed as `PLANNED`. Historical invalid
proof-shaped artefacts are being preserved outside the public tree. A fresh
current root cannot be manufactured locally: the authorised GitHub workflow
must sign and witness the exact post-merge bytes. Nothing here establishes
production until the full final gate chain, preview, merge, root workflow and
served-commit verification succeed.

## Business and GSPC purpose

- **Revenue:** make the request/measure/fix/retest/receipt journey reachable
  without shipping unsupported claims.
- **Growth:** release one canonical Council OS front door and portable protocol
  surfaces instead of duplicate products.
- **IP:** preserve the canonical state machine, card size and provenance
  boundaries while excluding secrets and internal-only material.
- **GSPC:** publish only reducer output derived from reviewed admitted evidence.

## Exclusive path boundary

Own integration and release control in:

- `client/src/App.tsx` and `client/src/pages/Dashboard.tsx`
- `package.json`, `.github/workflows/deploy.yml`, `DEPLOY-LOCK.md` and
  `canon.json`
- release-only guards, route generators and prerender orchestration under
  `scripts/**` that are not assigned to TUI 2
- generated `public/**` and `dist/**` output only through their canonical
  generators
- this release handoff and the exact-path release manifest

Do not redesign TUI 1 components or TUI 2 evidence contracts. Return defects
to their owner with a failing test or reproducible trace.

## Required work

1. Freeze lane writes and record the reviewed current-master checkpoint.
2. Classify candidate paths as `INCLUDE`, `EXCLUDE`, `QUARANTINE` or
   `UNRELATED`; stage only explicit reviewed paths.
3. Preserve `/mcp` compatibility, the single dashboard shell and the
   current-master heading/accessibility correction.
4. Review every deletion and generated change independently; regenerate route,
   redirect, sitemap and signed indexes on the final base.
5. Run the full gate chain and preserve logs with exact counts and warnings.
6. Show the owner the production-shaped desktop/mobile preview.
7. Deploy only after explicit approval and only through GitHub Actions from
   reviewed `master`; verify the served commit and recheck after the
   anti-clobber interval.

## Acceptance evidence

```bash
node scripts/one-door-guard.mjs
node scripts/no-conflict-markers.mjs
npm run guard:redirects
npm run ts-ratchet:selftest
npm run ts-ratchet
npm test
npm run build:client
npm run test:e2e:shell
node scripts/check-prerender.mjs dist/client
node scripts/brand-gate.mjs dist/client
node scripts/signed-json-guard.mjs dist/client
node scripts/price-gate.mjs dist/client
node scripts/facts-gate.mjs dist/client
git diff --check
```

Record the candidate commit, explicit staged-path manifest, gate logs, preview
evidence, approval, workflow run and apex/Pages commit match. A successful
local build or merge is not deployment proof.

Last complete pre-remediation checkpoint: client build succeeded over 8,337
modules, the unit suite passed **1,442/1,442 across 132 files**, and shell E2E
reported **27 passed, 1 skipped**. The current TypeScript ratchet passes at its
explicit **210-error / 116-file legacy baseline** (not zero type debt). Those
are time-stamped component results, not release proof. Re-run every gate on the
final rebased commit and record remaining root/witness issues by identity rather
than copying a stale count. Do not weaken either evidence gate to release.

## Non-goals

No direct Wrangler deployment, broad staging, silent test-baseline update,
provider inference from configuration, manual edits to generated truth,
financial transaction, external outreach or certification claim.

## Handoff gates

Require TUI 1 visual/E2E evidence, TUI 2 contract/negative-test evidence and
Hermes claim/secret review. Stop for exposed credentials, private transcripts,
unreviewed generated files, fabricated witness material, ambiguous ownership,
missing owner approval or a failed production-pipeline health check.
