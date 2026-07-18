# CSOAI / MEOK Scripts

Operational and automation scripts for the empire.

## Coordination

| Script | Purpose | Key Env / Args |
|--------|---------|----------------|
| `enable_coordination.py` | Submit/complete SOV3 tasks, check dashboard | `SOV3=http://127.0.0.1:3101` |
| `coordination-status.sh` | Quick SOV3 dashboard | — |
| `cron-wrapper.sh` | Wrap launchd crons and emit SOV3 tasks | Called by `com.meok.ops.*` plists |

## Empire Health & SEO

| Script | Purpose | Usage |
|--------|---------|-------|
| `empire-health-check.py` | Grades all `*-deploy/` dirs on HTTP + AEO/SEO files | `python3 scripts/empire-health-check.py` |
| `bulk-aeo-fix.py` | Generates missing `llms.txt`, `robots.txt`, `sitemap.xml`, `openapi.json` | `python3 scripts/bulk-aeo-fix.py` |
| `optimize-mcp-readme.py` | Standardizes MCP package READMEs | `python3 scripts/optimize-mcp-readme.py --all --limit 10` |

## Monitoring

| Script | Purpose | Usage |
|--------|---------|-------|
| `uptime-monitor.py` | Checks critical endpoints every run | `python3 scripts/uptime-monitor.py --submit-sov3` |
| `disk-health.py` | Reports disk usage and large log dirs | `python3 scripts/disk-health.py` |

## Distribution & Revenue

| Script | Purpose | Key Env / Args |
|--------|---------|----------------|
| `bulk-publish-mcps.py` | Publishes MCP packages to PyPI/npm | `PYPI_API_TOKEN`, `NPM_TOKEN` |
| `indexnow-submit.py` | Submits URLs to Bing IndexNow | `BING_INDEXNOW_KEY` |
| `sync-vercel-env.py` | Syncs env vars to known Vercel projects | Values from `~/clawd/.env.local` |
| `execute-credential-drop.py` | One-shot executor after Nick drops credentials | All revenue env vars |

## Outreach

| Script | Purpose | Usage |
|--------|---------|-------|
| `outreach-system/send_all.py` | Sends staged `.txt` emails | `EMAIL_ADDRESS`, `EMAIL_PASSWORD` |
| `outreach-system/test_send_all.py` | Unit tests for email parser | `python3 outreach-system/test_send_all.py` |

## Common Env Vars

Most scripts read from `~/clawd/.env.local` and fall back to environment variables:

```bash
MEOK_MASTER_API_KEY=mk_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
EMAIL_ADDRESS=...
EMAIL_PASSWORD=...
EMAIL_SMTP_HOST=smtp.privatemail.com
EMAIL_SMTP_PORT=587
PYPI_API_TOKEN=pypi-...
NPM_TOKEN=...
BUFFER_ACCESS_TOKEN=...
BING_INDEXNOW_KEY=...
```
