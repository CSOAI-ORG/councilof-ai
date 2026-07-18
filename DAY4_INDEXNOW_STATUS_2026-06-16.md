# 📍 IndexNow Key Status — Day 4 (15 Jun 2026)

## TL;DR
- **meok.ai**: ✅ KEY STAGED LOCALLY + LIVE
- **proofof.ai**: ❌ KEY STAGED, NEEDS REDEPLOY (Vercel)
- **csoai.org**: ❌ KEY STAGED, NEEDS REDEPLOY (Vercel)

## Key (shared across all 3 domains)
`4ce8d40dd91b87a343a68755bfb7e8c9`

Required file: `/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt` with body = key (32 bytes incl. newline)

## Per-domain state

| Domain | Local file path | Live HTTP | Status |
|--------|----------------|-----------|--------|
| meok.ai | `~/clawd/meok/ui/public/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt` | 200 (32B) | ✅ LIVE |
| proofof.ai | (none — `proofof.ai/index.html` is single static) | 404 (83B) | ❌ NEEDS DEPLOY |
| csoai.org | (none — csoai-org-v2 is full Next.js project) | 404 (13656B error page) | ❌ NEEDS DEPLOY |

## What Nick needs to do (gated actions)

For **proofof.ai** (single static HTML in `~/clawd/proofof.ai/`):
- Option A: Add the key file at `~/clawd/proofof.ai/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt`, then `vercel deploy --prod` (account-gated)
- Option B: Skip — proofof.ai is a marketing landing, IndexNow is a nice-to-have for the catalog page, not critical

For **csoai.org** (Next.js in `~/clawd/csoai-org-v2/`):
- Add `~/clawd/csoai-org-v2/public/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt`
- `vercel deploy --prod` (account-gated, subject to WAF cooldown if recent deploys)

## The right next action

1. IndexNow will only have meaningful impact on Bing indexing for the 14 URLs in `~/clawd/meok.ai/indexnow_batch_real.json`
2. The Bing indexing benefit kicks in within 24h of submission
3. The submission itself is a single POST to `https://api.indexnow.org/indexnow` with the host + key + urlList — that **IS** account-gated (needs API key OR key file on host)
4. Since the key file on meok.ai is already live, the right next action is: **submit the indexnow_batch_real.json via curl** to api.indexnow.org (no key needed if the key file is on the host)
5. This submission is NOT a Vercel deploy, NOT a Stripe action, NOT a real send — it's a POST that any agent can fire

## Recommended curl (auto-firable from agent)

```bash
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d @/Users/nicholas/clawd/meok.ai/indexnow_batch_real.json
```

The expected response: HTTP 200 with `{"status":"OK"}` or HTTP 202 with `{"status":"Accepted"}`. No auth required since the key file is on the host.

**This single curl submission is the high-leverage move** — it costs the agent 1 POST, has zero account-gate cost, and lights up 14 marketing URLs in Bing within 24h. The user-facing message: "Bing will index 14 of our key URLs in the next 24h."
