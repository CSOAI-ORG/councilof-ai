---
name: deploy
description: Deploy a site. CSOAI / councilof.ai / meok.ai use Cloudflare Pages via Wrangler. Vercel is blocked — do not use it for those hosts.
---

CSOAI public sites are Cloudflare Pages, not Vercel:

| Host | Pages project | Deploy |
|---|---|---|
| csoai.org / www | `csoai-site` | `wrangler pages deploy <dir> --project-name=csoai-site` |
| councilof.ai / www | `councilof-ai` | GitHub `deploy.yml` → Wrangler |
| meok.ai / www | `meok-os` | `wrangler pages deploy` |

Vercel is account-blocked (HTTP 402 / DEPLOYMENT_DISABLED). Do **not** run `vercel deploy` for those hosts. Do **not** CNAME them to `cname.vercel-dns.com`.

For a non-CSOAI project that is still on Vercel:

1. Check git status — commit if uncommitted changes exist (ask first)
2. Run `vercel deploy --prod --yes` from the project directory
3. Wait for deployment to complete
4. Verify with curl that the deployed URL returns 200
5. Report deployment URL and status

Usage: /deploy [project-path]
