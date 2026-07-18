# MEOK OS — E2E test matrix

Full end-to-end coverage of the live product. Every layer is a re-runnable suite; CI runs them
(`.github/workflows/meok-e2e.yml`): API smoke on every push, the Playwright matrix nightly + on demand.

## Run everything
```bash
# one-time setup for the Playwright suites
npm i playwright && npx playwright install chromium webkit firefox

# whole matrix against live prod (or pass a preview URL)
bash e2e/all.sh                     # → smoke + visual + responsive + apps + xbrowser
bash e2e/all.sh https://preview...  # against any base URL
```

## The suites
| File | Layer | What it asserts |
|---|---|---|
| `smoke.sh` | **API / security** | 14 pages + 12 APIs up · OWEM tiers route to real models · sign→verify + **tamper rejection** · **care-floor refuses harm** · malformed robustness · MCP protocol edges · CORS. (curl + python3, no browser) |
| `visual.cjs` | **interaction** | signup click-through (Explore→Type→Personal) · workspace runs a goal (twin brains + router spawns a surface) · council 6 voices · integrations cards · **0 console errors** · mobile no-overflow |
| `responsive.cjs` | **responsive** | 15 pages × mobile(375) + tablet(768) — **no horizontal overflow anywhere** |
| `apps.cjs` | **all 39 OS apps** | opens every app in a real browser — each renders content, throws no non-local console error |
| `xbrowser.cjs` | **cross-browser** | 8 key pages in **WebKit (Safari) + Firefox** — no errors, no overflow, rendered |

## Last full run (live os.meok.ai)
- smoke: **44/44**
- visual: **ALL PASSED**
- responsive: **30/30, zero overflow**
- apps: **39/39 clean**
- xbrowser: **clean in WebKit + Firefox**

Screenshots land in `e2e/shots/` (git-ignored). Exit code is non-zero on any failure, so CI fails loud.
