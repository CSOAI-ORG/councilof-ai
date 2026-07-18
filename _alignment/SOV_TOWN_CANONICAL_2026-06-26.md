# 🐉 SOV TOWN — CANONICAL SPEC (2026-06-26)

**Single source of truth.** Supersedes:
- `SOVEREIGN_TOWN_MASTER_PLAN_2026-06-19.md`
- `SOVEREIGN_TOWN_POC_2026-06-19.md`
- `_alignment/SOV_TOWN_READINESS_23JUN.md`
- `_alignment/SOV_TOWN_VIDEO_SCRIPT.md`
- `_alignment/SOV_TOWN_SCREENSHOT_1JUL.md`

> **One line:** SOV TOWN = the 24/7 governed-vs-ungoverned agent-world flywheel + Ed25519 attestation engine + per-hive research publisher + public-facing dashboard. The product, the IP engine, the data flywheel, the press artifact — all in one.

---

## 1. WHAT IT IS

**SOV SPACE (substrate)** = SOV3 + keystone + EU gateway + OLM router + dashboard (5 services, 224 agents, 128 MCP tools, care_alignment=1.0).
**SOV TOWN (application)** = the agent-world simulation that LIVES ON the substrate.

SOV TOWN is simultaneously:
1. **A proof** of CSOAI governance (governed = 0 crimes, ungoverned = 47.7M crimes, same agents)
2. **A data flywheel** for sovereign models (570M+ episodes generated, Ed25519-signed)
3. **An IP engine** (7 inventions in 6-layer openpatent registry, disclose.py)
4. **A research publisher** (28 per-hive whitepapers → MEOK Labs INDEX)
5. **A growth engine** (Reality-AI-TV via media layer — P2+)
6. **A regtech wind-tunnel** (jurisdiction.py + block_rate → DORA/EU AI Act pre-computation)
7. **A public demo** (proofof.ai leaderboard + town3d.html)

**NOT a marketing demo.** It's a 24/7 attestable research engine that publishes signed evidence.

---

## 2. THE LIVE FLEET (verified 2026-06-26)

| Surface | State | Where |
|---|---|---|
| **SOV3 substrate** | 🟢 HEALTHY 224 agents | `localhost:3101/mcp` |
| **Dashboard** | 🟢 200 OK | `http://127.0.0.1:3940/` (Starlette/uvicorn) |
| **Benchmark harness** | 🟢 200 OK, runs logged | `http://127.0.0.1:3941/` (port 3941 LaunchAgent KeepAlive) |
| **Town3D demo** | 🟢 HTML + GIF + PNG snapshots | `~/clawd/sovereign-town/p0_aqua/town3d.html` (30KB) |
| **MEOK Labs INDEX** | 🟢 28 hive whitepapers, 570M episodes | `~/clawd/meok-labs-engine/research/sovereign-town/` |
| **flywheel_forever daemon** | 🔴 NOT running (need restart) | `~/clawd/sovereign-town/p0_aqua/flywheel_forever.py` |
| **VM flywheel** | 🟡 Armed @reboot | `meok-backend` (35.242.143.249) |
| **GitHub Actions** | 🟡 Armed, not pushed | `.github/workflows/sovereign-town-sim-matrix.yml` |

**Honest counts (canonical per 21 Jun 2026 audit):**
- 27 personas (NOT 46/47)
- 12-around-1 council (NOT 33 Byzantine)
- 271 MCPs
- 28 hives reporting to MEOK Labs
- 570,265,920 cumulative episodes
- 0 governed crimes, 47,734,964 ungoverned crimes

---

## 3. CANONICAL REPO LAYOUT (after absorption)

```
~/clawd/sovereign-town/                    ← THE canonical repo (521MB, 8,930 files)
├── p0_aqua/                               ← THE engine (52 .py files)
│   ├── sovereign_os.py                    ← Governance OS kernel
│   ├── sim.py                             ← 28-district ABM engine
│   ├── batch.py                           ← Parallel corpus gen (~750K eps/s/10 cores)
│   ├── flywheel_forever.py                ← 24/7 daemon (NOT running — restart needed)
│   ├── agent_passport.py                  ← Signed agent identity
│   ├── gate_access.py                     ← Zero-Trust passport-gated runtime
│   ├── pheromone_bus.py                   ← Cross-hive alarm + trail diffusion
│   ├── jurisdiction.py                    ← Looking Glass (regulatory regimes)
│   ├── train_all_hives.py                 ← Per-hive threat models
│   ├── report.py                          → MEOK Labs publisher
│   ├── disclose.py                        → openpatent 6-layer registry
│   ├── sign_lib.py / verify_chain.py      ← Ed25519 attestation
│   ├── dashboard_server.py                ← :3940 API + WS
│   ├── dashboard.html                     ← Live research dashboard (40KB)
│   ├── town3d.html                        ← Live 3D governed-vs-ungoverned viewer
│   ├── benchmark/                         ← A/B harness + MCP server + Workbench
│   └── characters.json                    ← 27 persona DB
├── runners/mac/                           ← LaunchAgent scripts
├── ABSORPTION_MAP.md                      ← sovereign-temple → sovereign-town migration
├── ARCHITECTURE_GUARDRAIL.md              ← Hard bright lines
├── DESIGN_PARTNER_EMAILS.md               ← 5 ready-to-send regulator/enterprise/insurer
└── FIRE_TODAY.md                          ← 4 gated triggers (human-keys only)
```

**DEPRECATED repos (no longer canonical):**
- `~/clawd/sov-town-llm/` — 15MB Node.js proxy, READINESS=70% (bearer auth gap, agent spawn missing) — **reference only, NOT used by sovereign-town**
- `~/clawd/sov-town-poc/` — 34MB a16z AI Town clone (Cosmos/Convex UI shell) — **reference only, NOT used**
- `~/clawd/sov-town/` — 256KB thin wrapper — **reference only**
- `~/clawd/sovereign-town-deploy/` — 52KB Vercel deploy shim
- `~/clawd/_intake/sovereign-town-hive/` — 32KB early intake
- `~/clawd/hive-deploy-bulk/sovereign-town-deploy/` — 52KB duplicate of above

**KEEP** the dead repos as reference but route all writes through `~/clawd/sovereign-town/`.

---

## 4. THE 4 GATED TRIGGERS (Nick-only, from FIRE_TODAY.md)

| # | Action | Impact | Blocker |
|---|---|---|---|
| 1 | **Send design-partner email** (Cera/SAP/Siemens/Bosch/IBM/DT) | Highest — converts engine to traction | `mail.meok.ai` Resend unverified |
| 2 | **Deploy proofof.ai** (`vercel --prod`) | Public verifier live | Vercel scope/creds |
| 3 | **Submit GPU credit apps** (NVIDIA Inception/DO Hatch/MS Founders) | Train tier at scale | Form accept-ToS as CSOAI/MEOK Ltd |
| 4 | **Public openpatent push** (7 inventions) | Prior art established | Vercel + IP-disclosure call |

Everything else is built and attested.

---

## 5. THE FLYWHEEL (the actual product loop)

```
┌──────────────────────────────────────────────────────────────┐
│  24/7 sovereign towns (3 hosts: Mac, VM, Actions)             │
│  ↓ disjoint seed ranges (Mac=200M, VM=0, Actions=100M)        │
│  ↓ per-cycle Ed25519-signed episodes                          │
│  ↓ sovereign_os.py governance OS kernel                       │
├──────────────────────────────────────────────────────────────┤
│  Per-hive threat models (retrain every 10 cycles, ~0.99 acc) │
├──────────────────────────────────────────────────────────────┤
│  ↙                    ↓                    ↘                 │
│  openpatent           MEOK Labs             proofof.ai        │
│  6-layer              per-hive              leaderboard       │
│  disclosures          whitepapers           signed runs       │
│  ↘                    ↓                    ↙                 │
│       town3d.html live viewer + :3940 dashboard              │
│       press-kit / hero pages / Reality-AI-TV (P2+)           │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. THE CAST (honest: 27 personas, 12-around-1 council)

| # | Role | Spec | Code |
|---|---|---|---|
| 1 | **SOV3 King** | Sovereign governor, Gate + BFT + care floor + treasury | `sovereign-temple-live/`, council hub |
| 2–28 | **27 citizen-agents** | Work + personal goals, live in hive-districts | `p0_aqua/characters.json` |
| #47 | **Nick — human-in-loop** | Sovereign human: goals, interventions, observation | The POC's whole point |

**Honest counts (carry from master plan):**
- 27 personas live (NOT 46/47)
- 12-around-1 council live (NOT 33 Byzantine — that's the Charter spec, not code)
- 152 agents in registry = infra workers, NOT town citizens
- 271 MCPs (NOT 290+)

---

## 7. THE EXPERIMENT (H1 hypothesis)

**H1:** Under CSOAI governance, an agent society sustains cooperation, stays lawful, produces more welfare than the same agents self-governed.

| Arm | Governance | Outcome |
|---|---|---|
| **A · GOVERNED** | Charter + Maternal Covenant + Gate + 12-around-1 BFT | 0 crimes, 570M eps |
| **B · UNGOVERNED** | Agents write own constitution, no care floor, no gate | 47.7M crimes, society collapse |

**Dose-response curve (the moat):** enforcement 0% → 677 crimes · 25% → 400 · 50% → 225 · 75% → 27 · 100% → 0. Exponential decay, 25× reduction at 75% enforcement.

---

## 8. WIRE TO SOV3 SUBSTATE — 4-NODE MAP

```
SOV3 (:3101)
   ↓ coord_register_agent
town.sov-town-king (Sovereign — :3101 coord)
   ↓
28 sovereign hive agents (one per district)
   ↓
Per-hive threat models + signed ledger
   ↓
town.sov-town-flywheel (the daemon — currently NOT running, restart needed)
   ↓
town.sov-town-3d-viewer (the public artifact — :3940 dashboard)
```

**Action items NOW (auto-fire per JEEVES policy):**
1. Register `town.sovereign-king` agent in SOV3 coord
2. Register 28 `town.hive-<name>` agents
3. Emit 29 sigils (one per agent + King)
4. Restart `flywheel_forever.py` daemon

---

## 9. DASHBOARD SURFACE (live now)

| URL | Purpose |
|---|---|
| `http://127.0.0.1:3940/` | Research dashboard: stats, hives, charts, ledger tail, verifier |
| `http://127.0.0.1:3940/town3d.html` | 3D governed-vs-ungoverned viewer (28 hives, 140 agents) |
| `http://127.0.0.1:3941/` | Benchmark harness (A/B engine, signed runs, MCP server) |
| `http://127.0.0.1:3941/workbench.html` | Regulatory Workbench (run lanes, sign, verify, embedded MCP) |
| `https://proofof.ai/sovereign-town/leaderboard.html` | Public signed leaderboard (auto-refresh) |
| `https://proofof.ai/sovereign-town/run.html` | Per-run signed detail page |

**Harness MCP tools (via :3941):** `sov_benchmark_run` · `sov_benchmark_compare` · `sov_regulatory_classify` · `sov_world_info` · `sov_leaderboard`

---

## 10. CONTROLS (no surprises)

| Action | Command |
|---|---|
| Start flywheel | `cd ~/clawd/sovereign-town && python3.11 p0_aqua/flywheel_forever.py --seed-base 200000000` |
| Stop flywheel | `pkill -f flywheel_forever` |
| Start VM flywheel | `ssh meok-backend 'cd /home/nicholas/sovereign-town && python3.11 p0_aqua/flywheel_forever.py --seed-base 0'` |
| Check status | `cat ~/clawd/sovereign-town/p0_aqua/fleet_status_mac.json` |
| Restart dashboard | `launchctl kickstart -k gui/$(id -u)/com.csoai.sovereign-town-harness` |
| Verify chain | `cd ~/clawd/sovereign-town && python3.11 p0_aqua/verify_chain.py p0_aqua/flywheel_ledger_mac.jsonl` |
| Generate report | `cd ~/clawd/sovereign-town && python3.11 p0_aqua/report.py` |
| Disclose invention | `cd ~/clawd/sovereign-town && python3.11 disclose.py` |

---

## 11. BRIGHT LINES (non-negotiable)

From `ARCHITECTURE_GUARDRAIL.md` + `SOVEREIGN_TOWN_MASTER_PLAN.md`:
- **Public data only** · never individual-person profiling
- **Every output labelled "simulation"** · never claim real-firm compliance
- **Opt-IN** before any entity contact · no shadow profiles
- **Never share named-entity scores with regulators** · only aggregate
- **Defensive only** · no offensive / self-propagating capability
- **Honest counts** · 27 personas / 12-around-1 / 271 MCPs
- **In-simulation scope** · all claims scoped to P0/P1 until validated real-world

---

## 12. STATUS CHECKLIST (today)

- [x] Sovereign Town repo canonical (sovereign-town/)
- [x] Engine built (52 .py files, p0_aqua/)
- [x] 570M+ episodes generated (per INDEX 2026-06-21)
- [x] Ed25519 attestation working
- [x] 28 per-hive whitepapers published
- [x] Dashboard :3940 LIVE (200 OK)
- [x] Benchmark harness :3941 LIVE (200 OK, LaunchAgent KeepAlive)
- [x] Town3D viewer LIVE (HTML + GIF + PNG)
- [x] openpatent 6-layer registry populated (7 inventions)
- [ ] flywheel_forever daemon RESTART (was running, currently stopped)
- [ ] proofof.ai DEPLOY (gated on Vercel creds)
- [ ] SOV3 coord integration (28 town hive agents)
- [ ] 5 design-partner emails SENT (gated on Resend verify)
- [ ] GPU credit applications SUBMITTED (gated on ToS accept)
- [ ] Public openpatent push (gated on IP-disclosure call)
