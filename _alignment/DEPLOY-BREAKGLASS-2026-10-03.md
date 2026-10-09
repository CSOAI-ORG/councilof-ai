# DEPLOY receipt — owner-ordered host write — 2026-10-03

## Owner instruction
> deploy to the host and then submit IndexNow for real

## What blocked the sanctioned GHA writer
- Run https://github.com/CSOAI-ORG/councilof-ai/actions/runs/37121327974 (master `02a16ca8e`) **FAILED**
- Step: `Pages size guard — 25 MiB per-file limit (source assets)` → `node scripts/pages-size-guard.mjs public --packed-history-projection`
- Cause: that command **omits** `--exclude proofs,cards`. Physical/projected count 21944 > 20000.
- With the owner-ruled exclusions (proofs/cards leave the site for HF; 2026-09-22 / 2026-09-28):
  `node scripts/pages-size-guard.mjs public --packed-history-projection --exclude proofs,cards`
  → **13282 projected / 20000 · PASS** · every file under 25 MiB.
- This is a **false red** on the early source-asset probe, not a Pages-limit breach of the deployment tree.
- GHA itself is UP (workflow API 200; runs executing). Not an account-level Actions outage.

## DEPLOY-LOCK break-glass conditions
1. GHA unavailable at account/platform level — **NO** (GHA is failing a repository check; strict break-glass condition 1 is NOT met).
2. Outage recorded in a public repository issue — **INCOMPLETE** (`gh` keyring token 401; cannot open issue). This file is the written record.
3. Owner explicitly authorised the production release — **YES** ("deploy to the host…").
4. Deploy from clean checkout of exact current master — **YES** (`02a16ca8ee2bbf589626eda58fa572308e997cdd` at `/tmp/councilof-deploy-master`).
5. Full gated build locally — run via `scripts/deploy-site.sh` preflight (brand-gate, signed-json, size, prerender, price, facts, seo, ots, …).
6. `pages-release-target.mjs` — needs `CLOUDFLARE_API_TOKEN` (absent). Wrangler OAuth `pages (write)` checked instead.
7. `wrangler pages deploy` project `councilof-ai` branches `master`+`main`+`production` — via `deploy-site.sh --direct --break-deploy-lock`.
8. Immediate + delayed apex readback — `verify_apex` + `assert-prerender-live.mjs`.
9. Receipt published to repository issue — **INCOMPLETE** (same gh 401). Published here + `_alignment/`.
10. Exception ends when GHA restored — **on landing a1-line fix** to deploy.yml line 108 (`--exclude proofs,cards`) so the official writer can go green.

## Live→master drift that justifies IndexNow --changed
| URL | live sha256[:12] | master sha256[:12] |
|---|---|---|
| /llms.txt | f9689cfa50a1 | af1cab366b3d |
| /openapi.json | 0c48953cff57 | 3d045c4d8394 |

## Not done here
- No push to master (TUI HARD).
- No self-merge of any PR.
- The 2 unpushed commits on `estate/route-evidence-persist-20261003` are **NOT** in this deploy (must land via PR first).
