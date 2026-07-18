# Empire Scorecard Blockers — 2026-06-17

## Current Score
**A 89 · B 2 · C 2 · D 1 · F 2** (was A 88 · D 2 · F 3)

### Improvement made
- `for-regulators-deploy` canonical corrected from `https://meok.ai/for-regulators` (404) to `https://for-regulators-deploy.vercel.app` and redeployed → now **A**.

## Remaining Blockers

| Dir | Grade | Live URL | Issue | Blocker |
|-----|-------|----------|-------|---------|
| `openmoe-deploy` | D | https://openmoe.ai/ | sitemap.xml, openapi.json 404 | Domain not under current Vercel team; `vercel domains inspect openmoe.ai` returns access denied |
| `safetyof-deploy` | B | https://safetyof.ai/ | sitemap.xml, openapi.json 404 | Custom domain points to old/other Vercel project; latest deployment files available on `safetyof-deploy.vercel.app` |
| `transparencyof-deploy` | B | https://transparencyof.ai/ | sitemap.xml, openapi.json 404 | Same as above |
| `muckaway-deploy` | C | https://muckaway.ai/ | llms.txt, sitemap.xml, openapi.json 404 | Same as above |
| `planthire-deploy` | C | https://planthire.ai/ | llms.txt, sitemap.xml, openapi.json 404 | Same as above |
| `socialmediamanager-deploy` | F | https://socialmediamanager.ai/ | NXDOMAIN | Namecheap DNS config needed |
| `wowmcp-deploy` | F | https://wowmcp.ai/ | NXDOMAIN | Namecheap DNS config needed |

## Evidence

```bash
$ vercel domains inspect safetyof.ai
Error: You don't have access to the domain safetyof.ai under niks-projects-0a2ef942.

$ vercel projects list
# returns zero projects under team niks-projects-0a2ef942
```

Latest deployments **do** contain all AEO/SEO files on their `*.vercel.app` aliases:
- https://safetyof-deploy.vercel.app/sitemap.xml ✅ 200
- https://transparencyof-deploy.vercel.app/openapi.json ✅ 200
- https://muckaway-ai-conversion.vercel.app/llms.txt ✅ 200
- https://planthire-ai-conversion.vercel.app/robots.txt ✅ 200

## Path to A 93
1. Regain Vercel domain access / transfer `*.ai` domains to current team `niks-projects-0a2ef942`.
2. Re-link custom domains to latest `*-deploy` projects.
3. Fix Namecheap DNS for `socialmediamanager.ai` and `wowmcp.ai`.
4. Re-run `empire-health-check.py`.

## Recommendation
Do **not** change canonicals to `*.vercel.app` solely to game the scorecard. Keep canonicals pointing at the intended live domains so the scorecard continues to surface the real domain/routing problem.
