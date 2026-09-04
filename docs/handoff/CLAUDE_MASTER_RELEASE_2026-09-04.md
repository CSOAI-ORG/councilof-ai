# Claude master — integration and release lane

**Date:** 2026-09-04
**Candidate branch:** `codex/council-release-candidate`
**Checkpoint:** reviewed current-master checkpoint with lane ports in progress
**Owner:** Claude master release operator

## Outcome

Integrate the reviewed frontend and backend lanes into one reproducible release,
show the production-shaped preview, obtain owner approval and make the single
controlled production write through the repository workflow.

**Current state:** the unified dashboard integration is present. The frozen
candidate client build is green, the shell E2E reports 27 passed with one
intentional conditional skip, and desktop/mobile preview evidence was captured.
The exact staged-path manifest and owner deploy approval remain pending. Release is currently blocked by
evidence-integrity and current-root witness guards, so the local preview is not
a deployment candidate yet and nothing here establishes production.

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

Frozen-candidate checkpoint: client build succeeded over 8,337 modules, the
unit suite passed **1,383/1,383**, and shell E2E reported **27 passed, 1 skipped**. The current TypeScript
ratchet passes at its explicit **210-error / 116-file legacy baseline** (not zero
type debt). The evidence-integrity guard currently blocks **2 contaminated
roots**, and the root/witness release guard currently reports **49 deduplicated
issues**: the schema mismatch, stale 50-leaf witness pointer, missing current
witnesses, invalid OTS inventory and downstream archive references. Do not
weaken either guard to release.

## Non-goals

No direct Wrangler deployment, broad staging, silent test-baseline update,
provider inference from configuration, manual edits to generated truth,
financial transaction, external outreach or certification claim.

## Handoff gates

Require TUI 1 visual/E2E evidence, TUI 2 contract/negative-test evidence and
Hermes claim/secret review. Stop for exposed credentials, private transcripts,
unreviewed generated files, fabricated witness material, ambiguous ownership,
missing owner approval or a failed production-pipeline health check.
