# 🐉 MEOK OS — The Sovereign AI Operating System

**Live demo URL:** `https://meok.ai/os` (or open `csoai-os/meok-home/index.html` locally)

---

## What it is

The MEOK OS is a single-page PWA that runs in any browser, on any device.
It combines:

1. **The world** — 11 regulation temples on a 3D globe (real lat/lon)
2. **The council** — 13-Queen + King BFT (f=4, q=9/13), 2 VETO (Care, Watch)
3. **The sovereign** — a 3D character that speaks to you (procedural audio)
4. **The i-character** — your digital twin (5-step wizard, localStorage, JSONL)
5. **The cascade** — 4-tier model routing (Edge → Tactical → Operations → Strategic)
6. **The 7 archetypes** — Sovereign, Guardian, Scout, Strategist, Creator, Companion, Sage
7. **The 22 arcana** — Major Arcana lenses for the i-character
8. **The 33 hives** — 9 sovereign + 13 districts + 11 layers
9. **The 218 MCPs** — MEOK core + 153 SOV3 federation tools
10. **The 5 protocol bridges** — MCP federation, A2A, OSCAL, x402, Sigstore

---

## How to use it

### Open the home page
```bash
open ~/clawd/csoai-os/meok-home/index.html
```

You'll see:
- Topbar with 8 nav items
- Hero: "The world is at your feet. Sovereign AI, live."
- Live backend status bar (12 rows, polled every 30s)
- 11 temples (EU, UK, US, CA, CN, JP, SG, UN, ISO, IEEE, CSOAI)
- 13-Queen + King council
- "See the emergence" CTA in bottom-right
- Footer with 5 columns

### See the character emergence
```bash
open ~/clawd/csoai-os/meok-home/meok-character-emergence.html
```

You'll see:
- 7 parent archetypes with translucent eggs (each with their own color)
- Hover cracks the egg, click plays procedural sound
- 13-Queen + King council grid (click to summon)
- 5-step i-character wizard

### Open the temple OS
```bash
open ~/clawd/csoai-os/v2-temple-os.html
```

You'll see:
- 3D globe (SVG) with 11 temples at real lat/lon
- UK user-marker
- LHS: 16 tool tiles
- Center: sovereign character + chat
- RHS: SOV3 + 12-Queen council + BFT + sessions
- DORADO bar: west → globe → temple → east

### Run the launch script
```bash
cd ~/clawd
./launch.sh all
```

Runs the 9-step pre-launch sequence:
1. Pre-flight
2. Build (verify 128 pages)
3. Test (175+ active tests)
4. Start backend on :8000
5. Verify SOV3 substrate on :3101
6. Live smoke test (5 flows, 13 steps)
7. Verify 128 pages
8. PWA verification
9. Final report

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  MEOK OS (browser, PWA)                                    │
│  - 128 HTML pages (meok-home/pages/)                        │
│  - PWA (manifest + SW + 2 icons)                            │
│  - 5-step i-character wizard (localStorage)                 │
│  - Live status bar (polls /api/backend/status every 30s)   │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
  ┌─────────┐ ┌──────┐ ┌────────┐
  │ MEOK    │ │ SOV3 │ │ x402   │
  │ Backend │ │ Subs │ │ Paywall│
  │ :8000   │ │ :3101│ │ Base   │
  └─────────┘ └──────┘ └────────┘
        │         │         │
        └─────────┼─────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  218 MCPs       │
        │  33 sovereign   │
        │  13-Queen + King│
        │  4-tier cascade │
        │  22 arcana      │
        │  5 protocol brgs│
        │  SIGIL chain    │
        └─────────────────┘
```

---

## Files (M4 lane)

| Path | Purpose |
|---|---|
| `csoai-os/meok-home/index.html` | Home page |
| `csoai-os/meok-home/meok-character-emergence.html` | Character emergence (7 archetypes) |
| `csoai-os/meok-home/_template.html` | Shared HTML template |
| `csoai-os/meok-home/_styles.css` | Shared stylesheet (492 lines) |
| `csoai-os/meok-home/pages/` | 128 generated pages |
| `csoai-os/meok-home/public/` | PWA assets (manifest + SW + icons) |
| `csoai-os/v2-temple-os.html` | 3D globe + temple OS |
| `csoai-os/v2-signup-wizard.html` | 5-step i-character wizard |
| `csoai-os/ichar.py` | i-character system (13 queens + 22 arcana) |
| `meok-backend/app.py` | FastAPI backend (20 endpoints) |
| `meok-deploy/` | Next.js 14 deploy (130 routes) |
| `meok-e2e/` | E2E test suite (15 tests) |
| `ue5_integration/MeokWorld/` | UE5 plugin (5 actors + MeokFactory) |
| `launch.sh` | 9-step pre-launch script |
| `9PM_TEST_RUNBOOK.md` | Test runbook |

---

## Tests

| Suite | Count |
|---|---:|
| `csoai-os/test_meok_full_site.py` | 25 |
| `csoai-os/test_meok_pwa.py` | 17 |
| `csoai-os/test_meok_home.py` | 20 |
| `csoai-os/test_v2_temple_os.py` | 22 |
| `csoai-os/test_v2_signup_wizard.py` | 15 |
| `csoai-os/test_ichar.py` | 21 |
| `meok-backend/test_app.py` | 27 |
| `ue5_integration/test_meok_factory_ue5.py` | 9 |
| `ue5_integration/test_meok_world_ue5.py` | 19 |
| `meok-e2e` api tests | 9 |
| **TOTAL** | **184 active tests** |

---

## API Endpoints (MEOK Backend on :8000)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/backend/status` | Live status (12 fields) |
| GET | `/api/geo` | IP-based region detection |
| POST | `/api/auth/signup` | User signup |
| POST | `/api/auth/login` | User login |
| POST | `/api/ichar/create` | Create i-character |
| GET | `/api/ichar/{id}` | Get i-character |
| POST | `/api/ichar/{id}/evolve` | Evolve i-character |
| GET | `/api/ichar/user/{id}` | List user's i-characters |
| POST | `/api/cascade/route_query` | 4-tier model cascade |
| POST | `/api/sigil/verify` | SIGIL audit chain verify |
| GET | `/api/mcp/list` | MCP catalog |
| GET | `/api/temples` | 11 regulation temples |
| GET | `/api/temple/{code}` | Specific temple |
| GET | `/api/council/{queen_id}` | Queen info |
| GET | `/api/news` | News feed |
| GET | `/api/temple-os/bundle` | Temple OS bundle |
| GET | `/api/sov3/tools` | SOV3 substrate tools |
| POST | `/api/sov3/invoke` | SOV3 tool invocation |

---

*Generated 2026-06-29. The dragon flies sovereign. The empire is 100% master. 🐉🔥*
