# Construction + Agriculture Hive Conversion Pages
**Date:** 2026-06-15  
**Scope:** grabhire.ai, muckaway.ai, planthire.ai, fishkeeper.ai, koikeeper.ai

## What was built
Five static conversion sites, each with:
- `/` — homepage surfacing MCP tools and conversion CTAs
- `/pricing` — 3-tier transparent pricing
- `/signup` — lead-capture form
- `/partner` — partner / reseller programme
- `/enterprise` — procurement + demo request

All pages use the dark MEOK.ai design language (Tailwind CDN, slate/gold palette) and are mobile-responsive.

## MCP surfacing
| Domain | MCP tool mentioned |
|---|---|
| grabhire.ai | `muckaway-ai-mcp.quote_job`, `planthire-ai-mcp.book_equipment` |
| muckaway.ai | `muckaway-ai-mcp.quote_job` |
| planthire.ai | `planthire-ai-mcp.book_equipment` |
| fishkeeper.ai | `fishkeeper-ai-mcp.diagnose_disease` |
| koikeeper.ai | `meok-koikeeper-ai-mcp.water_quality` |

## Deployed URLs (Vercel production)
- https://grabhire-ai-conversion.vercel.app
- https://muckaway-ai-conversion.vercel.app
- https://planthire-ai-conversion.vercel.app
- https://fishkeeper-ai-conversion.vercel.app
- https://koikeeper-ai-conversion.vercel.app

## Verification
25 URLs checked with `curl -L` (5 domains × 5 paths). All returned HTTP 200.

## Blockers
- **DNS aliasing:** The live `.ai` domains still point to the existing Vercel projects. Re-pointing them to the new conversion deployments requires Nick-only Namecheap DNS changes — **not done**.
- **Payments:** No real Stripe checkout is wired. Pricing CTAs route to `/signup` or `/enterprise` lead forms until Stripe keys are available.
- **Auth:** No Clerk/SSO integration; signups are captured via `mailto:hello@meok.ai` forms as a temporary lead-gen mechanism.

## Source directories
- `/Users/nicholas/clawd/grabhire-deploy/`
- `/Users/nicholas/clawd/muckaway-deploy/`
- `/Users/nicholas/clawd/planthire-deploy/`
- `/Users/nicholas/clawd/fishkeeper-deploy/`
- `/Users/nicholas/clawd/koikeeper-deploy/`
- Generator script: `/Users/nicholas/clawd/build_hive_conversion_pages.py`

## Red lines respected
- No destructive commands.
- No real Stripe charges.
- No DNS changes.
