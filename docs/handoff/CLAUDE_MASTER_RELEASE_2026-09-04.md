# Claude handoff — master integration and release lane

**Snapshot:** 2026-09-04  
**Source branch:** `codex/council-master-consolidation`  
**Production branch:** `master`  
**Release state:** not approved; production is unchanged  
**Execution authority:** `docs/blueprints/MASTER_CONSOLIDATION_AND_EXECUTION_2026-09-04.md`

## Current integration warning

The source snapshot is now 41 commits behind local `master` and carries 394
dirty paths. Never wholesale-rebase or copy it. Current master has newer
`DashboardCataloguePane`, `DashboardStandardsPane` and `Dashboard.tsx` work;
the latter deliberately uses an `h2` because the workspace owns the page
`h1`. The stale snapshot still has the old heading and would restore the shell
smoke failure.

Port foundations, leaf panes, then the shell. Manually merge catalogue and
standards, keep current-master `pages/Dashboard.tsx`, preserve `/mcp`
compatibility, and regenerate redirects/sitemap/route manifest on the final
base. Do not copy the generated public tree or the 26 component deletions.

## Mission

Turn the reviewed consolidation branch into one reproducible release without
mixing unrelated lane work or overstating runtime capability. This lane owns
integration, gates, master history and the single production write.

**Primary business outcome:** convert reviewed product work into a reachable,
trustworthy surface from which real measurement/evidence work can be sold. A
merge, deploy log or route count is not revenue.

## Scope and ownership

Own:

- integration diff and conflict resolution against `master`;
- `.github/workflows/deploy.yml`, `DEPLOY-LOCK.md`, `canon.json`;
- build/test/prerender/deploy gates and release evidence;
- generated artifacts only through their canonical generators;
- post-deploy verification and rollback/fix-forward decision.
- one release manifest containing path, lane owner, authored/generated state,
  source revision, tests, public-claim effect and secret-review result.

Do not redesign frontend or backend contracts during release. Return defects to
TUI 1 or TUI 2 with a failing proof.

## Release invariants

1. Production deploys only through GitHub Actions from reviewed `master`.
   Never run a direct `wrangler pages deploy`.
2. The current branch is a large dirty, multi-lane worktree. Stage by explicit
   path only; never use `git add -A`.
3. Preserve one canonical dashboard and the fail-closed evidence lifecycle.
4. Current release truth remains 0 independent admissions, 0 quotable cells,
   0 regulator findings and 1,066 legacy-unadjudicated records.
5. Provider adapters are canaries only. The action ledger is
   `SINGLE_WRITER_STAGING`; execution remains disabled.
6. Local Wrangler observability SQLite/WAL files are preview noise, not product
   changes and not release inputs.
7. Deployment needs the owner's explicit approval. A request to preview or
   “show me first” is not deploy permission.
8. The current snapshot contains 394 dirty paths. Every path must be classified
   `INCLUDE`, `EXCLUDE`, `QUARANTINE` or `UNRELATED` before staging; local
   `.wrangler` SQLite/WAL files are always excluded.
9. The exposed wallet secret, transcript artifacts, private operator runbooks,
   fake/plain-text `.ots` material and quantity-generating EAT scripts are hard
   release stops. Removal from one file does not establish history rotation.

## Executable release sequence

- [ ] First work package: freeze lanes, obtain the 394-path classification and
      produce an exact-path candidate manifest; do not stage before it exists.
- [ ] Freeze incoming edits and record `git status --short` plus the exact
      source commit.
- [ ] Review every deletion and generated-file change; separate local preview
      noise and unrelated lane edits from the intended release.
- [ ] Reconcile the reviewed release manifest against all 394 dirty paths and
      prove the staged path set is identical to the manifest.
- [ ] Verify deploy-pipeline health before merge; a merge or green local build
      is not proof that production can receive the commit.
- [ ] Rebase or merge onto current `master` without broad staging or destructive
      resets.
- [ ] Run the full release gates below and preserve their logs.
- [ ] Show the local production-shaped Pages preview to the owner.
- [ ] Obtain explicit deploy approval.
- [ ] Merge through the reviewed path to `master`; let the GitHub workflow be
      the only writer.
- [ ] Verify the workflow run, custom domain and Pages production alias, then
      re-check after the anti-clobber delay.

## Proof of done before merge

```bash
node scripts/one-door-guard.mjs
node scripts/no-conflict-markers.mjs
node scripts/redirects-guard.mjs --selftest
node scripts/redirects-guard.mjs public/_redirects
node scripts/pages-size-guard.mjs public
npm run ts-ratchet:selftest
npm run ts-ratchet
npm test
npm run build:client
npm run test:e2e:shell
bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350
node scripts/check-prerender.mjs dist/client
node scripts/brand-gate.mjs dist/client
node scripts/signed-json-guard.mjs dist/client
node scripts/price-gate.mjs dist/client
node scripts/facts-gate.mjs dist/client
```

Record exact pass counts and warnings. The earlier consolidation baseline was
1,335 unit tests and 18 shell checks; a changed count must be explained, not
forced back to that number.

Also run `git diff --check`, preserve the full gate logs, scan intended paths
for credentials/private transcripts/internal-only codenames, and classify the
internal blueprints/handoffs before any public prerender or artifact copy.

## Proof of done after approved deploy

- GitHub Actions reports success for the exact `master` commit.
- `/dashboard?tab=home`, `play`, `measured`, `connections`, `watchdog`,
  `training` and `settings` render on desktop and mobile.
- `/api/fabric`, `/api/provider-canary` GET and `/api/action-jobs` GET expose
  their conservative states without secrets.
- Apex and `councilof-ai.pages.dev` serve the same gated build immediately and
  after the anti-clobber interval.
- Matrix/findings counts match the committed signed artifacts exactly.

## Dependencies

- TUI 1 supplies visual/E2E sign-off.
- TUI 2 supplies focused contract tests and schema notes.
- Hermes supplies the claim/evidence and dirty-file audit.
- Owner supplies explicit deploy approval and any required production secrets.

## Do not claim or deploy

- Do not claim this branch is live before the production checks pass.
- Do not call configured providers “working” from GET status alone.
- Do not present staged action jobs as execution or legacy signatures as
  admitted measurements.
- Do not deploy partial output, a thin Vite shell, local SQLite state, secrets,
  or unreviewed generated changes.
