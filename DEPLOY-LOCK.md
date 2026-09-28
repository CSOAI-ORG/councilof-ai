[Reading 65 lines from start (total: 65 lines, 0 remaining)]

# DEPLOY-LOCK — councilof.ai production write convention

**One lane owns production writes. Everyone else opens a PR. No exceptions.**

## The rule
councilof.ai (Cloudflare Pages project `councilof-ai`) is deployed **only** by GitHub Actions on push
to `master` — the pipeline that runs the brand-gate, the cold prerender, sitemap/redirect generation,
and ships the result to **both** `--branch=master` and `--branch=main` so the custom domain
(production alias) cannot stay on a thin Vite shell while a hash preview holds the prerender.
**Direct `wrangler pages deploy … --project-name=councilof-ai` is prohibited.**

Custom domain `councilof.ai` and `https://councilof-ai.pages.dev` follow the Pages **PRODUCTION**
alias — not `master.councilof-ai.pages.dev` and not a hash preview. `main.councilof-ai.pages.dev`
has 404'd (2026-08-22) even after `--branch=main`; that alias is not proof of production.

## Why
The trust surface is the product. When a second lane runs a direct `wrangler pages deploy`, it silently
overwrites the gated build **without** the brand-gate or prerender — that is exactly how an ungated
`/api/gspc` serving `totals.axes: 17` and a de-branded regression shipped over the ruled 14-slot build,
and clobbered `/library`, `/honesty` and the per-page schema. A funder or regulator loading the site
during that window sees a build that contradicts the signed board. That cannot happen on the trust
surface of a measurement body.

## The trailing-clobber pattern (2026-08-22)
Official GHA went green: apex homepage **212889** bytes, `/os/` and `/gspc-verify/` 200, hash
previews fat (`895e1c9a`, `f544bb7a`, later `91225aff`). Two to four minutes later the production
alias was a **thin Vite `index.html` (~7KB)** with a *different* `assets/index.r2-*.js` than the
official build. `/` is `no-cache`, so it flipped immediately. `/os/` stayed fat because directory
indexes missed `/*.html` and inherited Pages' `s-maxage=604800`.

Do not treat a fat `/os/` as proof the homepage is the gated tree. Assert `/` **and**
`https://councilof-ai.pages.dev/` **and** re-check ~2 minutes later
(`scripts/assert-prerender-live.mjs`).

Likely second writers (in order):
1. **Cloudflare Pages Git integration** auto-building `master` with Vite only (no Playwright
   prerender) and winning the production-alias race after GHA.
2. **Mac / direct `wrangler pages deploy`** of a local `dist/client` (DEPLOY-LOCK history).

Dashboard-only (this pod cannot do it): on the `councilof-ai` Pages project, **disable automatic
Git deployments** (or disconnect the repo). Builds belong to `.github/workflows/deploy.yml`.
See [Disable automatic deployments](https://developers.cloudflare.com/pages/configuration/git-integration/#disable-automatic-deployments).

## How it's enforced
- **Single source of truth:** [`canon.json`](canon.json) holds the ruled public invariants (title, axis
  count, `public_count` string, required routes, forbidden strings, `min_homepage_bytes`). Change a
  value **there**, never on the live site.
- **Drift-guard:** [`scripts/drift-guard.mjs`](scripts/drift-guard.mjs) fetches the live site and asserts
  it matches `canon.json`. It runs on a schedule (`.github/workflows/drift-guard.yml`) and on demand, and
  goes **RED** within minutes of any clobber — so a direct-deploy is visible immediately, not at diligence.
- **To deploy:** commit to `master` (or PR → merge). The GHA `Build + deploy site` workflow is the only
  writer. If you must hotfix, fix-forward through the repo; never `wrangler pages deploy` this project.

## Emergency break-glass lane — account-level CI outage only

A direct Pages write remains prohibited during normal operation. One narrow emergency exception is allowed only when **all** of the following are true:

1. GitHub Actions is unavailable at the account/platform level, not merely failing a repository check.
2. The outage is recorded in a public repository issue with the exact API error and current master SHA.
3. The owner has explicitly authorised completing the production release.
4. The deploy is from a clean checkout of the exact current master commit.
5. The full gated build has passed locally, including capability/OpenAPI, evidence, regulatory, redirect, sitemap, wallet-secret, TypeScript and Pages size gates.
6. scripts/review/pages-release-target.mjs (or an equivalent read-only Cloudflare project/production-branch check when CI secrets are unavailable) confirms project councilof-ai and production branch master.
7. The same dist/client tree is deployed with wrangler pages deploy using project councilof-ai and branch master.
8. Immediate apex + councilof-ai.pages.dev readback is performed, followed by a delayed anti-clobber readback. Any mismatch fails closed and is recorded.
9. The emergency release receipt, master SHA, deployed artifact hashes and readback result are published back to the repository issue/release.
10. The exception ends as soon as GitHub Actions is restored; normal deployments return to the single GHA writer.

This is a **break-glass continuity path**, not a second routine writer. It exists so an external CI-account suspension cannot make the governed production surface permanently unavailable while preserving the same build, target and readback controls.

## If the guard is RED
1. Run `node scripts/drift-guard.mjs` to see which invariant drifted.
2. It almost always means a direct `wrangler pages deploy` (or a Pages Git Vite build) landed. Re-run
   the `Build + deploy site` workflow (or push an empty commit) to restore the gated build.
3. Tell the lane that ran the direct deploy to stop and PR instead. If it recurs after every official
   deploy, disable Pages Git automatic deployments on the project.

## Lane ownership
- **Mac / CI lane** owns production writes to `councilof-ai`.
- **All other lanes** (pod, K3, grok, front-door) contribute via PR against `master`.
- The `csoai-site` Pages project carries the councilof-ai master surface too — same rule, never push a
  static `_site` over it (it wipes the `/api/*` Functions routing).

[executed on device: NICHOLASs-MacBook-Air-2.local (95c03167-6c81-48cd-83ce-e3a5c3d4b91f)]