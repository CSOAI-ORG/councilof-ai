# Wiring prerender into the Vercel production build (owner decision)

**Status:** prep done, flip is owner-gated (touches production deploy).
**Owner:** Nick / M4.
**Why gated:** changing `buildCommand` has caused prod outages before. This doc makes the flip one-line, reversible, and outage-safe.

## What's already done (safe, shipped)
- `scripts/prerender.mjs` snapshots **41 routes** → static HTML with title + JSON-LD schema for AI crawlers (GPTBot / PerplexityBot / ClaudeBot / Googlebot).
- Verified locally: every money-keyword + jurisdiction + sector + `/vs/*` competitor page renders with 4 JSON-LD blocks.
- **Hardened:** if chromium is absent, prerender **skips gracefully (exit 0)** — it can no longer break a deploy. The SPA still ships as-is.

## The situation
- `vercel.json`: `buildCommand: "npm run build:client"`, `installCommand: "npm install --ignore-scripts"`.
- `--ignore-scripts` means Playwright's browser download is skipped → **chromium is not present in the Vercel build** → prerender currently no-ops in prod. Crawlers get JS shells.

## The flip (when approved)
Change `vercel.json` `buildCommand` to:

```json
"buildCommand": "npm run build:client && npx playwright install chromium && npm run prerender"
```

- Adds ~30–60s + one chromium download (~130MB) per build.
- If the install or prerender fails, the hardened script exits 0 → **deploy still succeeds** with the plain SPA. No outage path.
- Fully reversible: revert the one line to roll back.

### Safer variant (belt-and-suspenders)
Never let prerender touch the exit code at all:
```json
"buildCommand": "npm run build:client && (npx playwright install chromium && npm run prerender || echo 'prerender skipped')"
```

## Verify after flipping
1. Deploy preview.
2. `curl -s https://<preview>/uk-ai-regulation | grep -c application/ld+json` → expect `4`.
3. `curl -s https://<preview>/vs/vanta | grep -oE '<title>[^<]*'` → expect `CSOAI vs Vanta …`.
4. Spot-check the SPA still hydrates (click through 2–3 routes).

## Rollback
Revert `vercel.json` `buildCommand` to `"npm run build:client"`. Instant.
