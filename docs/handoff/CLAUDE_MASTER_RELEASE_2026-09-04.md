# Claude master — post-release integration and verification lane

**Date:** 2026-09-04

**Base:** fetch, resolve and record the latest `origin/master` commit at the start of every pass; never reuse a branch or SHA from an older handoff

**Owner:** Claude master integration/release operator

## Outcome

Verify the released surface, integrate only reviewed follow-up manifests, show a
production-shaped preview and prepare the next change set without writing to
production. Claude Master is the sole integration owner, but this post-release
job order does not authorise a merge, workflow dispatch, deployment, external
publication, email or spend.

## Truth checkpoint to preserve

- The exact current public-root candidate has **154 coverage leaves**,
  `root.json` SHA-256
  `9b426735bc7c0e94d32ce64ccd87605880c531350ca957ecccde5046bde505cd`
  and Merkle root
  `2fe2a76f310ea79268c73a94543c91125fa7acc3bbf11ed489afdfeb845ea745`.
- Ed25519 and Rekor verify. OTS is `STAMPED_PENDING_BITCOIN`; it is not a
  confirmed Bitcoin timestamp. PQC remains planned.
- The **335-card signed-card catalogue is a separate corpus**. The historical
  union is **25 roots / 937 entries**, with **904** individually signed and
  **33** unsigned wrappers.
- The Council is a 33-member design with a 23-member quorum target, not a live
  BFT runtime. The latest independence experiment is `rho=1`, `n_eff=1`.
- Games, quests, training and Coliseum runs are `PRACTICE_ONLY`. General
  agentic repair and live two-model battle remain fail-closed.

These values identify this checkpoint only. Read the artifacts and gates again
before reporting a later release.

## Bounded post-release deliverables

1. **Revenue evidence artifact:** verify that request, scope, measure,
   fix-proposal, retest and receipt states are reachable or explicitly
   unavailable in the same shell. Produce a local evidence report only; do not
   claim customers, settlement or revenue.
2. **Growth evidence artifact:** verify one canonical dashboard front door and
   the generated protocol/discovery surfaces with zero duplicate applications
   or dead advertised routes. Reachability is not adoption.
3. **IP artifact:** produce an exact-path provenance/licence/secret review for
   the proposed integration, preserving the evidence-state vocabulary and
   canonicalization boundaries.
4. **GSPC artifact:** prove the UI, API, signed-card catalogue, public root and
   witness pointer state their separate scopes consistently. Do not regenerate
   signed truth outside its authorised workflow.

## Exclusive path boundary

Own integration and release control in:

- `client/src/App.tsx`, `client/src/pages/Dashboard.tsx` and
  `client/src/pages/ContentReviewNotice.tsx`
- `package.json`, `.github/workflows/deploy.yml`, `DEPLOY-LOCK.md` and
  `canon.json`
- release-only guards, route generators and prerender orchestration under
  `scripts/**` that are not assigned to TUI 2
- generated `public/**` and `dist/**` output only through their canonical
  generators
- the hand-authored `public/AGENT-ONBOARDING.md` coordination contract
- this release handoff, the master execution order and exact-path release
  manifest

Do not redesign TUI 1 components or routed truth pages, or TUI 2 evidence
contracts. Return defects to their owner with a failing test or reproducible
trace.

## Required work

1. Fetch current `origin/master`, record its resolved commit in the run log and
   verify the current served commit before opening a new change set.
2. Accept only frozen, exact-path manifests from TUI 1, TUI 2 and Hermes.
   Classify each path `INCLUDE`, `EXCLUDE`, `QUARANTINE` or `UNRELATED`.
3. Review every deletion and generated change independently. Regenerate route,
   redirect, sitemap and signed indexes only through canonical scripts.
4. Run the current `.github/workflows/deploy.yml` gate sequence locally. The
   workflow is authoritative; if it changes, update this brief before relying
   on the command list below.
5. Show the owner the production-shaped desktop/mobile preview and gate logs.
6. Prepare a PR only if a bounded follow-up is necessary. Stop before commit,
   push, PR creation, merge, workflow dispatch or deploy under this job order.
7. Record existing production state by read-only served-commit and endpoint
   checks. Never describe a local build or merged commit as deployed.

## Release gate chain

```bash
node scripts/one-door-guard.mjs
node scripts/no-conflict-markers.mjs
node scripts/wallet-credential-gate.mjs --selftest
node scripts/wallet-credential-gate.mjs
npm run guard:evidence-integrity
npm run guard:council-truth
node scripts/redirects-guard.mjs --selftest
node scripts/redirects-guard.mjs public/_redirects
node scripts/pages-size-guard.mjs public
npm ci --no-audit --no-fund
python3 -m pip install -q cryptography opentimestamps-client
python3 scripts/root-witness-release-gate.py --selftest
python3 scripts/root-witness-release-gate.py --phase candidate
npm run ts-ratchet:selftest
npm run ts-ratchet
npm run build:client
npx playwright install --with-deps chromium
npm run prerender:dashboard
npm run test:e2e:shell
npx playwright install --with-deps chromium
bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350
node scripts/check-prerender.mjs dist/client
rm -f dist/client/gspc-scoreboard.html
node scripts/place-end-user-aliases.mjs dist/client
for b in carebench conductbench defbench detbench mcpbench machbench ossbench pqcbench provbench swarmbench xrbench arena govbench agibench paper-district claimguard; do
  if [ -f "client/public/$b.html" ]; then
    cp "client/public/$b.html" "dist/client/$b.html"
    mkdir -p "dist/client/$b"
    cp "client/public/$b.html" "dist/client/$b/index.html"
  fi
done
npm run workspace-launcher:selftest
npm run workspace-launcher
npm run workspace-launcher:check
node scripts/brand-gate.mjs --selftest
node scripts/brand-gate.mjs dist/client
node scripts/signed-json-guard.mjs dist/client
node scripts/price-gate.mjs --selftest
node scripts/price-gate.mjs dist/client
node scripts/facts-gate.mjs dist/client
set -euo pipefail
for p in sov-os/index.html api-docs/index.html os/index.html gspc-verify/index.html; do
  if [ ! -f "dist/client/$p" ]; then
    echo "MISSING dist/client/$p — prerender did not snapshot this route"
    exit 1
  fi
  echo "ok dist/client/$p ($(wc -c < dist/client/$p) bytes)"
done
for fn in functions/api/receipts/latest.ts functions/api/east-west-bench.ts functions/api/evidence-pack.ts functions/api/cards.ts functions/api/axis-register.ts functions/api/auth/[[path]].ts functions/api/dashboard/stats.ts functions/api/_authCrypto.ts functions/api/challenge.ts functions/api/wave-dashboard.ts functions/api/counters.ts functions/api/state.ts functions/api/eunomia-data.ts functions/api/_chatLobby.ts functions/enterprise.ts functions/enterprises.ts functions/chat.ts functions/pricing.ts; do
  test -f "$fn" || (echo "missing $fn" && exit 1)
done
node scripts/pages-size-guard.mjs dist/client
git diff --check
```

The generated-artifact removal and copy loop above mirrors the workflow's
post-prerender placement step; run it only against disposable `dist/client`.
The following loops reproduce the workflow's exact required dist-file/function
inventory. A later, separately authorised deployment must additionally pass the immediate,
anti-clobber and hold checks, the bounded witness recheck and
`root-witness-release-gate.py --phase live` against the actual deployed bytes.

## Acceptance evidence and metrics

Supply the resolved base commit, exact changed-path classification, complete
gate logs, desktop/mobile preview evidence and current read-only production
probe. Required metrics are:

- every workflow gate above passes on one unchanged tree;
- zero secrets, unreviewed generated files or unexpected deletions;
- zero duplicate shell routes and zero advertised quarantined routes;
- local root/card/witness statements match their artifact scopes exactly;
- no production or external write, email, publication or spend.

## Non-goals and handoff gates

No direct Wrangler deployment, broad staging, silent baseline update, provider
inference from configuration, manual signed-output edit, financial transaction,
email, outreach or certification claim. Stop for exposed credentials, private
transcripts, fabricated witness material, ambiguous ownership or any gate that
does not pass on the exact reviewed tree. A future production write requires a
separate explicit owner approval and must run only through GitHub Actions from
reviewed `master`.
