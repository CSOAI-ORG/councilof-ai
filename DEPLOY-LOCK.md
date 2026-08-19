# DEPLOY-LOCK — councilof.ai production write convention

**One lane owns production writes. Everyone else opens a PR. No exceptions.**

## The rule
councilof.ai (Cloudflare Pages project `councilof-ai`) is deployed **only** by GitHub Actions on push
to `master` — the pipeline that runs the brand-gate, the cold prerender, sitemap/redirect generation,
and ships the result. **Direct `wrangler pages deploy … --project-name=councilof-ai` is prohibited.**

## Why
The trust surface is the product. When a second lane runs a direct `wrangler pages deploy`, it silently
overwrites the gated build **without** the brand-gate or prerender — that is exactly how an ungated
`/api/gspc` serving `totals.axes: 17` and a de-branded regression shipped over the ruled 14-slot build,
and clobbered `/library`, `/honesty` and the per-page schema. A funder or regulator loading the site
during that window sees a build that contradicts the signed board. That cannot happen on the trust
surface of a measurement body.

## How it's enforced
- **Single source of truth:** [`canon.json`](canon.json) holds the ruled public invariants (title, axis
  count, `public_count` string, required routes, forbidden strings). Change a value **there**, never on
  the live site.
- **Drift-guard:** [`scripts/drift-guard.mjs`](scripts/drift-guard.mjs) fetches the live site and asserts
  it matches `canon.json`. It runs on a schedule (`.github/workflows/drift-guard.yml`) and on demand, and
  goes **RED** within minutes of any clobber — so a direct-deploy is visible immediately, not at diligence.
- **To deploy:** commit to `master` (or PR → merge). The GHA `Build + deploy site` workflow is the only
  writer. If you must hotfix, fix-forward through the repo; never `wrangler pages deploy` this project.

## If the guard is RED
1. Run `node scripts/drift-guard.mjs` to see which invariant drifted.
2. It almost always means a direct `wrangler pages deploy` landed. Re-run the `Build + deploy site`
   workflow (or push an empty commit) to restore the gated build.
3. Tell the lane that ran the direct deploy to stop and PR instead.

## Lane ownership
- **Mac / CI lane** owns production writes to `councilof-ai`.
- **All other lanes** (pod, K3, grok, front-door) contribute via PR against `master`.
- The `csoai-site` Pages project carries the councilof-ai master surface too — same rule, never push a
  static `_site` over it (it wipes the `/api/*` Functions routing).
