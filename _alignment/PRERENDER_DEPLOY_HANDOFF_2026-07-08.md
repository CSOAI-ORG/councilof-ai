# 🚀 Phase 1 — Make prerender LIVE (handoff for M2, the Vercel owner)

**The gap (verified 2026-07-08):** the prerender script is merged in master, but the live
`vercel.json` buildCommand is `npm run build:client` only — so it never runs. Live `/crosswalk`
and `/compare` raw HTML have **0 schema** and the generic site `<title>`. AI crawlers still get
the thin SPA shell → yesterday's whole GEO effort earns nothing until this ships.

The prerender OUTPUT is already verified (16 routes → static HTML with Dataset/FAQPage schema +
titles + content, hydrates clean). Only the **where-chromium-runs** question remains.

## The one blocker: headless chromium in the build
Playwright needs chromium + system libs. Vercel's build image (Amazon Linux) may lack them, and
`--with-deps` uses apt (Debian) → won't work there. Two reliable fixes, pick one:

### ✅ Option A (recommended, bulletproof) — prerender in a GitHub Action, deploy the result
GitHub `ubuntu-latest` fully supports Playwright. Action: build → `npx playwright install --with-deps
chromium` → prerender → `vercel deploy --prebuilt` (or push dist to a deploy branch Vercel serves).
Zero risk to Vercel's own build. Needs a `VERCEL_TOKEN` secret (owner). Draft workflow:
```yaml
# .github/workflows/prerender-deploy.yml
on: { push: { branches: [master] } }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020  # v4.4.0
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:client
      - run: npx playwright install --with-deps chromium
      - run: npm run prerender
      - run: npx vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Option B (simplest, try first) — @sparticuz/chromium in the Vercel build
`npm i -D @sparticuz/chromium playwright-core`, point `prerender.mjs` at
`chromium.executablePath()` when `process.env.VERCEL`, and set
`vercel.json` → `"buildCommand": "npm run build:client && npm run prerender"`.
This runs chromium inside Vercel's build with a bundled serverless binary (no system deps).

## Verify after deploy (the acceptance test)
```bash
curl -s https://www.csoai.org/crosswalk | grep -c Dataset      # expect >0 (was 0)
curl -s https://www.csoai.org/compare  | grep -c FAQPage       # expect >0
curl -s https://www.csoai.org/compare  | grep -oE '<title>[^<]*'  # expect the compare-specific title
```
When those flip from 0 → present, GEO is live and every citable page (crosswalk, compare, /vs/*,
llms.txt) is finally working for AI crawlers.

**M4 recommendation:** Option A. It's the reliable one, it's isolated from your normal Vercel build,
and it composes with the SHA-pinned-actions posture already in the repo. Ping me and I'll write the
full workflow + wire `prerender.mjs` for whichever option you pick.
