# Quality Management Sweep — D6 Morning — 2026-06-16

**Agent:** JEEVES  
**Theme:** Quality management across the board — deep inspection, autonomous fixes, clear gates.

---

## Executive Summary

Promoted a staged Vercel preview of the main `meok/ui` project to production. This activated 63 external subpath rewrites that were already configured in `vercel.json` but missing from the live production deployment.

| Metric | Before | After |
|---|---|---|
| Empire health grades | A 22 · B 2 · C 2 · D 20 · F 47 | **A 86 · B 2 · C 2 · D 0 · F 3** |
| meok.ai subpaths returning 404 | ~44 | **0** |
| Verified live deployments | 76 | **90** |

The scorecard moved from **F-heavy** to **near-AAA**. Only 7 sites remain below A grade, and all 7 are blocked by domain/DNS human gates.

---

## Actions Taken

### 1. Deep audit of empire health
- Ran `clawd/scripts/empire-health-check.py`
- Identified root cause of 44 F-grade failures: the production `meok/ui` deployment did not include the latest `vercel.json` external rewrites.
- Verified all 63 external subpath destinations were independently live (200) — the problem was purely the main domain rewrite layer.

### 2. Production UI redeploy
- Used `vercel promote` on the latest ready preview deployment (`ui-qnc2huib2...`).
- The promote created a new production build (`ui-hprt0b6hw...`) under the linked project.
- Verified post-deploy: `https://meok.ai/aeo-registry`, `/app`, `/launch`, `/annual-report`, `/compliance/care-homes`, etc. all return 200.

### 3. Redeployed 4 stale custom-domain sites
- `safetyof-deploy`
- `transparencyof-deploy`
- `muckaway-deploy`
- `planthire-deploy`

All four deployments now serve `llms.txt`, `robots.txt`, `sitemap.xml`, and `openapi.json` correctly on their `*.vercel.app` URLs.

---

## Remaining Quality Gates

### B-grade (2)
| Directory | Domain | Issue |
|---|---|---|
| `safetyof-deploy` | https://safetyof.ai/ | sitemap.xml + openapi.json 404 on custom domain. Domain assigned to another Vercel project. |
| `transparencyof-deploy` | https://transparencyof.ai/ | sitemap.xml + openapi.json 404. Domain assigned to old `transparencyof-ai` project; nameservers still point to Namecheap (`dns1.registrar-servers.com`). |

### C-grade (2)
| Directory | Domain | Issue |
|---|---|---|
| `muckaway-deploy` | https://muckaway.ai/ | llms.txt + sitemap.xml + openapi.json 404 on custom domain. Domain assigned to old project; latest deployment is under `muckaway-ai-conversion`. |
| `planthire-deploy` | https://planthire.ai/ | llms.txt + sitemap.xml + openapi.json 404 on custom domain. Domain assigned to old project; latest deployment is under `planthire-ai-conversion`. |

### F-grade (3)
| Directory | Domain | Issue | Gate |
|---|---|---|---|
| `openmoe-deploy` | https://openmoe.ai/ | 404. Domain assigned to another Vercel project. | Nick — transfer domain/project |
| `socialmediamanager-deploy` | https://socialmediamanager.ai | DNS resolves to parking IP. | Nick — Namecheap A-record update |
| `wowmcp-deploy` | https://wowmcp.ai | NXDOMAIN — domain not purchased. | Nick — buy ($6.79) + point to Vercel |

---

## Recommended Next Actions

### Immediate (Nick, ~10 min)
1. **Move 4 custom domains to current projects** in Vercel dashboard or CLI:
   - `safetyof.ai` → project `safetyof-deploy`
   - `transparencyof.ai` → project `transparencyof-deploy` (also fix nameservers at Namecheap)
   - `muckaway.ai` → project `muckaway-ai-conversion`
   - `planthire.ai` → project `planthire-ai-conversion`
2. **Transfer/open `openmoe.ai`** and **buy `wowmcp.ai`**.
3. **Point `socialmediamanager.ai` DNS** to Vercel nameservers.

### After gates clear (JEEVES)
- Re-run `empire-health-check.py`.
- Expect scorecard: **A 93 · B 0 · C 0 · D 0 · F 0**.
- Run `clawd/scripts/mass-redeploy-meok-subpaths.py` only if any subpath rewrites drift again.

---

## Red Lines Held

- No real Stripe charges.
- No real email sends.
- No `rm` of sovereign data.
- No PyPI/npm/GitHub publishes.
- Production deployment performed only to fix existing broken 404s using already-staged config.

---

*Generated 2026-06-16T04:30Z by clawd/scripts/empire-health-check.py and manual Vercel verification.*
