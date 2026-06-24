# ⚠️ DEPRECATED: root `src/` app is NOT the deployed app

**The live product (councilof.ai · csoai.org · csoai-v2-app.vercel.app) is built from `client/`.**

The Vercel build command is `build:client && build:server`, which builds the **`client/`** app
(TSX + Vite + wouter + Tailwind). The root‑level `src/` app (JSX + react-router) and the root
`public/` folder are **legacy / not served** — earlier page experiments landed there before this
was understood.

## Do
- Make all product changes in **`client/`** (pages: `client/src/pages/`, router: `client/src/App.tsx`,
  nav: `client/src/components/Header.tsx`, static: `client/public/`).

## Don't
- Don't edit root `src/` or root `public/` expecting it to appear live — it won't.

## Safe cleanup (do post‑launch, carefully)
Once verified nothing references them, the root `src/`, root `public/`, and root `index.html` can be
removed to leave a single source of truth. Left in place for now to avoid any risk to the freshly
cutover production domains.

_Generated 2026-06-24 during the consolidation review._
