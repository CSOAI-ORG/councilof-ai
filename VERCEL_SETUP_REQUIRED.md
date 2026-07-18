# Vercel — CLI Authentication Required

## Current Status
- Vercel CLI auth: ❌ Token expired (`VERCEL_TOKEN` env var is rejected)
- Project config found: `/Users/nicholas/clawd/meok/.vercel/project.json`
  - `projectId: prj_nnxvKjfuBMIDdjGNmedkJuCPKzoL`
  - `projectName: meok`
  - `orgId: team_4IkNIyYl7TtEOi9aoz17SUO7`
- `vercel ls` fails with: "Your codebase isn't linked to a project"

## What Blocks Revenue
Without valid Vercel CLI auth, we cannot:
1. Confirm Stripe LIVE env vars are deployed to production
2. Deploy or update Vercel apps
3. Run `vercel env ls` to audit production environment

## Fix (2 minutes)

Run this command in your terminal:

```bash
vercel login
```

This opens a browser. Authenticate with your Vercel account (nicholastempleman).

After login, confirm:
```bash
vercel env ls
```

Expected: list of env vars including `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.

## What We Know About Stripe Env Vars

| Location | Status |
|----------|--------|
| `~/.secrets/stripe_live.env` | ✅ Live key exists: `<REDACTED-ROTATE-2026-06-07>` |
| `meok/ui/.env.local` | ✅ Same key |
| Vercel production | ❓ Unknown — `vercel env ls` cannot run without auth |

## Vercel Projects Found Locally
50+ `.vercel/` directories across `/Users/nicholas/` including:
- `clawd/meok/.vercel` ← primary project
- `clawd/meok-ai-frontend/.vercel`
- `clawd/meok-attestation-api/.vercel`
- `clawd/meok-verify/.vercel`
- `clawd/council-ai-storefront/.vercel`
- `clawd/meok-ai-landing/.vercel`
- Plus 44 more across `cobol-bridge`, `fishkeeper-ai`, `koikeeper-ai`, `safetyof-ai`, etc.
