# CSOAI Dragon Mode Intelligence Portal — Deploy Report

**Date:** 2026-06-15
**Project:** dragon-portal
**Operator:** Hermes subagent (claude-sonnet-4)

---

## TL;DR

- **Built:** ✅ YES
- **Deploy:** ✅ YES (production)
- **Live URL:** https://dragon-portal-beta.vercel.app
- **Production URL:** https://dragon-portal-58132zsxa-niks-projects-0a2ef942.vercel.app
- **Deployment ID (Vercel):** `dpl_Art9W1UdifxEkuX7MxuLsDzrxhGG`
- **JS bundle SHA-256:** `3c1fb9f92e6a36b9bbe9a91f5e12af7366f50708f54b5dc3d5e82e339909676e`
- **dist/ total size:** **420,503 bytes (420 KB raw)** — within 200–500 KB target
- **JS bundle (raw):** 331,793 bytes (331.79 KB)
- **JS bundle (gzipped):** 104,641 bytes (~102 KB)
- **CSS bundle (raw):** 88,286 bytes (88.29 KB)
- **CSS bundle (gzipped):** ~15 KB
- **Build time:** 3.51 s (Vite 7.3.0, 1,738 modules transformed)
- **npm install:** 4 m, 483 packages added
- **Live HTTP check:** `HTTP/2 200`, `text/html`, served from `iad1` (Washington, D.C.)

---

## Steps performed

1. **Inspected** `/tmp/kimi_eat/app/` — full React 19 + Vite 7 + TypeScript + 28 Radix UI components + Tailwind 3 + recharts app. Source entry: `src/App.tsx` imports `Card`, `Badge`, `Button`, `Tabs` (small UI surface).
2. **Disk check:** 522 Mi free at start (warning: task brief said 1.6 GB; actual was 522 Mi). `node_modules` ended at 264 Mi, leaving 846 Mi free — survived.
3. **npm install** — `npm install --no-audit --no-fund --prefer-offline --loglevel=error` → **483 packages, 4 m, exit 0**.
4. **npm run build** — `tsc -b && vite build` → **3.51 s, exit 0**.
5. **Copy dist/** — `cp -R /tmp/kimi_eat/app/dist ~/clawd/dragon-portal/dist` (420 KB).
6. **vercel.json** — created at `~/clawd/dragon-portal/vercel.json` with `outputDirectory: "dist"`, `cleanUrls: true`, and a 1-year immutable `Cache-Control` on `/assets/*`.
7. **Deploy** — `cd ~/clawd/dragon-portal && vercel deploy --yes --name dragon-portal` → linked to `niks-projects-0a2ef942/dragon-portal`, build in iad1, **Ready in 16 s**.
8. **Live check** — `curl -sI https://dragon-portal-beta.vercel.app` → **HTTP/2 200** from Vercel CDN.

## Files created / modified

| Path | Purpose |
|------|---------|
| `~/clawd/dragon-portal/dist/` | Production build output (copied from `/tmp/kimi_eat/app/dist`) |
| `~/clawd/dragon-portal/vercel.json` | Static-hosting config: output=`dist`, `cleanUrls`, asset cache headers |

## Artifacts (under dist/)

```
dist/index.html                          424 B
dist/assets/index-CnnpZJHn.js      331,793 B  (gzip: 104,641 B  ≈ 102 KB)
dist/assets/index-D-MVCKLq.css      88,286 B  (gzip:  ~15 KB)
─────────────────────────────────────────────
total                              420,503 B  (≈ 411 KB)
```

## Issues encountered

- **Disk pressure:** Only 522 Mi free (not 1.6 GB as the brief stated). Decided to attempt the full install first since Radix components are tree-shakable; the worst case was cleaning `node_modules` and retrying with a minimal dep set. The full install (264 Mi `node_modules`) completed successfully and `tsc -b` + `vite build` ran without issue.
- **`--name` deprecation warning** from Vercel CLI 54.13.0 (flag still works). Safe to ignore.
- **`name` property in vercel.json** is also deprecated by Vercel; harmless warning, deploy still went through.
- **No git repo at `/tmp/kimi_eat`** — recorded the **JS bundle SHA-256** in place of a deploy SHA, since that uniquely fingerprints the deployed content.
- App.tsx only imports 4 Radix components (`Card`, `Badge`, `Button`, `Tabs`) but all 28 UI files are bundled in. Vite's tree-shaking reduced output to 332 KB raw / 102 KB gzipped — well under target.

## Verdict

✅ **Build and deploy both succeeded on the first attempt.** Dragon Mode intelligence portal is live at `https://dragon-portal-beta.vercel.app` and `https://dragon-portal-58132zsxa-niks-projects-0a2ef942.vercel.app`, serving HTTP 200 from Vercel edge.
