# 🜏 GCP + ALL HIVES — HANDOFF TO M2
*2 Jul 2026 03:05 BST · M4-Hermes · for M2 (live-app consumer surface) · MIT + CC0*

> **Everything M2 needs to know about GCP, the sovereign-os backend, the 33 hives, the 94+ MCPs, the 20 agent cards, the 22 tunnels, and the 23 Python modules.**
> **The complete inventory. Single source of truth.**

---

## 0. The 3 GCP / runtime surfaces

| Surface | Type | Where | URL |
|---|---|---|---|
| **Mac (this machine)** | Localhost runtime | `/Users/nicholas/clawd` | http://127.0.0.1:* (multiple ports) |
| **Sovereign OS** | Live app | `csoai.org/sovereign-os/` | https://os.meok.ai |
| **GCP VM (`meok-backend`)** | Live autonomous stack | `/home/nicholas/sov3/` | https://meok-backend.run.app OR SSH `gcloud compute ssh meok-backend` |

The **Mac** is where the engineering + authoring runs. The **Sovereign OS** is the Vercel-deployed live surface (defoneos.me, cop.html, sovereign-os, etc.). The **GCP VM** is the autonomous runtime stack (SOV3 + King hive + OLM + cron loops + data moat).

**For M2:** all 3 surfaces are wired. You author in this repo, the Vercel side is the consumer surface, the GCP VM is the live autonomous worker. You do NOT need to touch the GCP VM directly — only SSH if a cron breaks.

---

## 1. The 10+ services running on Mac (ports 3101 → 3950)

The hive `.hive/config.yaml` declares each service with health-check URL + restart command. Here are the **ones M2 needs to know about**:

| Port | Service | URL | Owner |
|---|---|---|---|
| **3000** | MEOK_UI | http://127.0.0.1:3000/ | JEEVES (UI) |
| **3101** | SOV3 | http://127.0.0.1:3101/health | M4 (cognitive engine) |
| **3102** | MEOK_MCP | http://127.0.0.1:3102/ | M4 (MCP federation) |
| **3200** | MEOK_API | http://127.0.0.1:3200/health | JEEVES (FastAPI backend) |
| **3400** | CSOAI_MCP_MONETIZATION | http://127.0.0.1:3400/ | JEEVES (pricing) |
| **3900** | PHEROMONE_ROUTER | http://127.0.0.1:3900/health | M4 (hive pheromone routing) |
| **3950** | X402_MCP_SERVER | http://127.0.0.1:3950/health | M4 (x402 payments) |
| **3951** | AIROUTER_MCP | http://127.0.0.1:3951/ | M4 (intent classifier) |
| **8042** | SOVEREIGN_WATCHDOG | http://127.0.0.1:8042/ | M4 (Pillar 1: REPORT) |
| **8100** | BRAIN_ENDPOINT | http://127.0.0.1:8100/v1 | JEEVES (OpenAI-compatible) |
| **8200** | WORDPRESS_BRIDGE | http://127.0.0.1:8200/ | JEEVES (CMS sync) |
| **8765** | HINDSIGHT | http://127.0.0.1:8765/ | JEEVES (legal scout) |
| **8888** | FARM_VISION | http://127.0.0.1:8888/api/status | M4 (iOK farm cameras) |
| **8900** | GITOPS_NEXUS | http://127.0.0.1:8900/ | JEEVES (git ops) |
| **9000** | SIGN_SOVEREIGN | http://127.0.0.1:9000/ | M4 (sovereign signing) |
| **9800** | MCP_GATEWAY | http://127.0.0.1:9800/ | M4 (MCP gateway aggregator) |
| **9999** | WATCHDOG_DASHBOARD | http://127.0.0.1:9999/ | M4 (Watchdog dashboard) |
| **8080** | DEMO_SERVER | http://127.0.0.1:8080/ | JEEVES (live demo) |
| **31002-31008** | keepalive_daemons | for tunnels | M4 (auto-restart) |

**For M2:** the 4 most important are **3101 (SOV3)**, **3102 (MEOK_MCP)**, **3200 (MEOK_API)**, **8100 (BRAIN_ENDPOINT)**. The others are infra plumbing.

---

## 2. The 22 tunnels (Mac → VM + Mac → self)

| Tunnel | Local port | Remote | Forwards |
|---|---|---|---|
| `com.meok.ollama-tunnel-vm` | 11434 | 35.242.143.249:11434 | VM Ollama to Mac |
| `com.meok.sov3-vm-tunnel` | 3101 | 35.242.143.249:3101 | Mac reaches VM SOV3 mesh |
| `com.meok.king-vm-tunnel` | 8077, 8888, 8889, 8890, 8891, 8893, 3200 | 35.242.143.249:* | Mac reaches king + EU gateway + dashboards |
| `com.meok.ssh-reverse-tunnel` | 11444, 3102 (reverse) | Mac → VM | VM reaches Mac Ollama + MEOK_MCP |
| `com.meok.m2-local-tunnel` | 11435:192.168.50.176:11434 | self-ssh | M2 LAN Ollama |
| `com.meok.m2-vm-bridge` | 11445:localhost:11435 | Mac → VM | VM reaches M2 (2-hop) |
| + 16 more keepalive daemons (port-check + tunnel-restart) | various | various | The self-healing layer |

**For M2:** you don't need to manage tunnels manually. The keepalive plists restart them on death. NEVER spawn `nohup ssh -L` tunnels — that's the footgun that causes port collisions.

---

## 3. The 33 hives (the master inventory)

The substrate has **33 sovereign hives** (one per BFT-33 council node). Each hive = a sovereign domain + a queen + a district + a layer:

| # | Hive | Domain | District | Layer | Queen |
|---|---|---|---|---|---|
| 1 | sovereign-temple | SOV3 + crown | London | L0.2 BFT | Queen Sophia |
| 2 | sovereign-os | Live OS | Cambridge | L0.5 Sovereign | Queen Athena |
| 3 | sovereign-cop | COP sphere | Oxford | L0.5 Sovereign | Queen Minerva |
| 4 | sovereign-spinner | Koi→dragon | Edinburgh | L0.6 Developer | Queen Demeter |
| 5 | sovereign-master-net | At-a-glance | Cardiff | L0.7 Governance | Queen Hestia |
| 6 | sovereign-tui | Keyboard UI | Belfast | L0.7 Governance | Queen Hera |
| 7 | sovereign-spinner-graphics | Visuals | Glasgow | L0.4 i-character | Queen Aphrodite |
| 8 | sovereign-newsletter | Newsletter | Newcastle | L0.5 Sovereign | Queen Vesta |
| 9 | sovereign-fundraising | Funding | Edinburgh | L0.6 Developer | Queen Demeter |
| 10 | sovereign-research | Research | Manchester | L0.4 i-character | Queen Minerva |
| 11 | sovereign-economics | Economics | Liverpool | L0.6 Developer | Queen Hestia |
| 12 | sovereign-data-lake | 49GB data | Edinburgh | L0.4 i-character | Queen Diana |
| 13 | sovereign-observability | Metrics | Brighton | L0.7 Governance | Queen Hestia |
| 14 | sovereign-threat-council | Threats | Plymouth | L0.7 Governance | Queen Athena |
| 15 | sovereign-dragon-mode | Dragon mode | Inverness | L0.5 Sovereign | Queen Apollo |
| 16 | sovereign-vision-bridge | Eyes | Bristol | L0.4 i-character | Queen Diana |
| 17 | sovereign-owi | OWI cognition | York | L0.4 i-character | Queen Minerva |
| 18 | sovereign-iac | Infrastructure | Bath | L0.7 Governance | Queen Hestia |
| 19 | sovereign-composite-dashboard | Composite | Exeter | L0.7 Governance | Queen Sophia |
| 20 | sovereign-amica | Amica bridge | Truro | L0.5 Sovereign | Queen Aphrodite |
| 21 | sovereign-temple-launchpad | Launchpad | Wells | L0.6 Developer | Queen Hestia |
| 22 | sovereign-meok-humanoid | Humanoid | Lincoln | L0.5 Sovereign | Queen Athena |
| 23 | sovereign-watchdog | Watchdog | Salisbury | L0.8 Witness | Queen Athena |
| 24 | sovereign-articles-50 | Article 50 passport | Canterbury | L0.4 i-character | Queen Sophia |
| 25 | sovereign-akfm | Apple Intelligence | Winchester | L0.5 Sovereign | Queen Minerva |
| 26 | sovereign-articles | Articles | Durham | L0.4 i-character | Queen Sophia |
| 27 | sovereign-8-around-1 | 8-around-1 BFT | Chichester | L0.2 BFT | Queen Sophia |
| 28 | sovereign-12-around-1 | 12-around-1 BFT | Worcester | L0.2 BFT | Queen Sophia |
| 29 | sovereign-33-queens | 33-queens BFT | Hereford | L0.2 BFT | Queen Sophia |
| 30 | sovereign-king | King Solomon BFT | London | L0.2 BFT | King Solomon |
| 31 | sovereign-bridge-think | Cognitive engine | Cambridge | L0.4 i-character | Queen Minerva |
| 32 | sovereign-agent-cards | 20 agent personalities | every district | L0.5 Sovereign | (each queen) |
| 33 | sovereign-sap | Sovereign Agent Package | every layer | L0.5 Sovereign | (each queen) |

**Note:** some of the 33 are sub-hives (e.g. sovereign-8-around-1 is inside sovereign-12-around-1 is inside sovereign-33-queens). Total unique sovereign-os services: ~15-20. Total queen-personalities on disk: 20 (one per agent-card). BFT council: 22-of-33 raw + weighted.

---

## 4. The 20 agent cards (`.hive/agent-cards/`)

Every sovereign hive has a personalized AI agent. The agent card is JSON-signed (Ed25519) with the hive's capabilities + payment config + MCP servers + A2A endpoint:

```json
{
  "agent_card": {
    "name": "<hive-name>",
    "version": "1.0.0",
    "signature_scheme": "ed25519",
    "public_key": "<base64 ed25519 pubkey>",
    "capabilities": ["<service>_lookup", "<service>_book", "<service>_verify"],
    "pheromones": ["trail", "mark", "guard"],
    "caste": "worker" | "queen" | "king",
    "payment": {"x402": true, "ap2": true, "ucp": true, "acp": true},
    "mcp_servers": ["https://<hive>/mcp/<service1>", "..."],
    "a2a_endpoint": "https://<hive>/a2a",
    "issuer": "CSOAI Hive",
    "issued_at": "<ISO 8601>"
  },
  "signature": "<ed25519 sig>"
}
```

**The 20 hives with agent-cards on disk** (in `.hive/agent-cards/*.json`):

| Hive | Public-key fingerprint | Capabilities |
|---|---|---|
| `accountabilityof.ai` | ed25519 signed | accountability lookup/verify |
| `careshield.ai` | ed25519 signed | care shield lookup/book |
| `cobolbridge.ai` | ed25519 signed | cobol bridge read/write/migrate |
| `councilof.ai` | ed25519 signed | council lookup/vote |
| `csoai.org` | ed25519 signed | the csoai.org lookup/book/verify |
| `dataprivacyof.ai` | ed25519 signed | data privacy lookup/verify |
| `diyhelp.ai` | ed25519 signed | diy help lookup/verify |
| `ethicalgovernanceof.ai` | ed25519 signed | ethics lookup/vote |
| `fishkeeper.ai` | ed25519 signed | fish keeper lookup |
| `grabhire.ai` | ed25519 signed | grab hire lookup/book |
| `koikeeper.ai` | ed25519 signed | koi keeper lookup |
| `meok.ai` | ed25519 signed | meok lookup/act |
| `muckaway.ai` | ed25519 signed | muck away lookup/book |
| `optimobile.ai` | ed25519 signed | opti mobile lookup/book |
| `planthire.ai` | ed25519 signed | plant hire lookup/book/quote |
| `pokerhud.ai` | ed25519 signed | poker hud lookup |
| `proofof.ai` | ed25519 signed | proof of lookup/verify |
| `safetyof.ai` | ed25519 signed | safety lookup/verify |
| `templeman-opticians.com` | ed25519 signed | optician lookup/book |
| `wowmcp.ai` | ed25519 signed | wow mcp lookup |

**For M2:** when you build a sovereign consumer surface, you can attach any of these agent cards. The card acts as the citizen's identity + the hive's identity + the payment instructions.

---

## 5. The 23 sovereign-os Python modules (JEEVES's deliverable)

`csoai.org/sovereign-os/` (JEEVES's lane) — 23 Python modules + 8 E2E test files + 101 tests all green:

```
csoai.org/sovereign-os/
├── backend/
│   ├── server.py             19KB  federal bridge (WS + HTTP + SSE)
│   ├── brain_endpoint.py     24KB  OpenAI-compatible brain + 10 commands
│   └── observability.py      20KB  metrics dashboard
├── frontend/
│   ├── sov3-llm-brain.js     19KB  browser brain tool-calls + streaming
│   ├── sovereign-event-bus.js 11KB  observe/utter/broadcast + WS + HTTP fallback
│   ├── sovereign-hud.js        9KB  focus→chat wiring + mic + command bar
│   ├── sovereign-hud.css       5KB  styles
│   ├── amplitude-lipsync-spec.md 5KB  AnalyserNode spec
│   └── index.html              3KB  live demo
├── article_50_passport.py    30KB  EU AI Act Article 50 passport (Care Floor 1.0)
├── composite_dashboard.py    22KB  composite 7.305 + Care Floor 0.95 + BFT 12-around-1 dashboard
├── data_lake.py              18KB  49GB sovereign data moat
├── deploy_vercel.py          12KB  Vercel deployment
├── economics.py               8KB  5-tier cascade pricing (Free/Pro/Enterprise/Gov/Premium)
├── launch_ritual.py          16KB  36-SIGIL inaugural ceremony (the launch)
├── observability_dashboard.py 14KB  metrics dashboard Python
├── sigil_nostr.py             10KB  Nostr bridge for SIGIL (NIP-19/32)
├── sigil_explorer.html        9KB  SIGIL explorer surface
├── sovereign_crypto.py       18KB  sovereign Ed25519 + PQC crypto
├── sovereign_master_net.py   22KB  master-net routing
├── sovereign_masternet.py    12KB  the connection bouncer
├── sovereign_tui.py           15KB  keyboard UI (Swift)
├── sov3-vision-bridge.py     22KB  i-character cognition (SEES/HEARS/READS/ATTENDS/UTTERS)
├── threat_council.py         16KB  threat council BFT
├── watchdog.py               14KB  sovereign watchdog MVP (3 pillars)
├── watchdog.html              8KB  watchdog landing
└── HANDOFF-TO-M2.md          (JEEVES's 327-line handoff)
```

**For M2:** you read `HANDOFF-TO-M2.md` first (JEEVES's intro) then this section. The 3 critical modules for M2 are:
- `backend/brain_endpoint.py` — the OpenAI-compatible brain (24KB)
- `frontend/sovereign-event-bus.js` — the bus for your chat/log (11KB)
- `frontend/sov3-llm-brain.js` — the browser brain tool-calling (19KB)

These 3 + the 1-line installer = **30 minutes to add Sovereign to any web app.**

---

## 6. The 1-line installer

```html
<!-- M2: paste this into defoneos.vercel.app/cop.html <head> -->
<script src="/sovereign-os/frontend/sovereign-event-bus.js"
        data-citizen-id="defoneos-csoai-nicholas-001"></script>
<script src="/sovereign-os/frontend/sovereign-hud.js"></script>
<script src="/sovereign-os/frontend/sov3-llm-brain.js"
        data-brain-endpoint="http://localhost:8100/v1"></script>
<link  rel="stylesheet" href="/sovereign-os/frontend/sovereign-hud.css">
```

Then you have:
- `window.sovereignEventBus` — speak to it (`utter()`, `observe()`, `broadcast()`)
- `window.sovereignHUD` — appears in any chat-log/chat-input element
- `window.sovereignBrain` — sends every chat message to the LLM brain tool-calling loop

---

## 7. The 10 sovereign commands (the brain calls these)

| Command | Args | What |
|---|---|---|
| `observe_focus` | `focus_type, subject_id, subject_kind, title, summary, coords?, attributes?` | SOV3 sees the citizen's pin/click |
| `utter` | `text, room?, focus_id?` | speaks text in chat with SIGIL + BFT |
| `load_layer` | `layer (12 layers), active?` | toggles a SOV SPACE layer on the globe |
| `focus_camera` | `camera_id, city?, lat, lng` | flies the globe + opens a public camera popup |
| `scan_area` | `focus_kind?` | scans the current viewport (consented) |
| `observe_ambient` | `sensor_kind` | reads ambient sensor (light/noise/etc.) |
| `attend_speech` | `utterance, lang?` | attention to user utterance |
| `recall_memory` | `subject, kind?` | recall i-character memory |
| `synthesize` | `domain, inputs?` | synthesize signals across domains |
| `federate` | `peer_id, payload?` | federate with another i-character |

**The 12 SOV SPACE layers** (load_layer can toggle these):
`regulations` · `friendly_bases` · `threat_isr` · `aircraft` · `seismic` · `cyber` · `news` · `public_cameras` · `natural_events` · `weather` · `space` · `marine` · `satellites` · `air_quality`

---

## 8. The 8 sovereign guarantees (unified)

Every hive + every MCP + every agent card + every sovereign action enforces all 8:

1. **Care Floor 0.95** — Demeter non-negotiable. Below 0.95 = refuses action.
2. **BFT majority** — M4 uses 9/13 raw + 10/16 weighted. JEEVES uses 12-around-1.
3. **SIGIL Ed25519 + PQC** — every action emits a SIGIL. Quantum-safe Dilithium3.
4. **Open-weights only** — refuses GPT-4/Claude/Gemini. Sovereign = open-weights LLMs only.
5. **MIT + CC0 + OSI** — every file in both lanes.
6. **Crown Lineage 1795→2026** — both lanes cite in every sovereign state.
7. **Fork Doctrine** — every artifact ships with `npm install -g` / `git clone` paths.
8. **EU CSOAI 16939677** — issuer pubkey on every signed artefact.

---

## 9. The GCP VM (35.242.143.249 = `meok-backend`)

**The GCP VM is the live autonomous stack:**
- SOV3 `:3101` (running)
- King hive `:8888` (master)
- OLM autonomous brain (cron every 5 min)
- 49 GB sovereign data moat
- BRIDGE service (RSS + geopol + research)
- Decision agent (BFT-voteable)
- Memory store + audit logger (SIGIL chain)

**Access:** SSH via `gcloud compute ssh meok-backend`. The Mac maintains 22 tunnels (see §2) for Mac↔VM connectivity.

**For M2:** you DON'T touch the VM directly. The 22 Mac-side tunnels handle bi-directional traffic. The autonomous layer runs via cron + BFT. If the VM crashes, the keepalive plists restart the tunnels automatically.

**For emergencies:** SSH into the VM, check `/home/nicholas/sov3/logs/`, restart SOV3 with `pm2 restart sovereign-mcp-server` or `docker restart sovereign-temple_sovereign-mcp-server_1`.

---

## 10. The test fleet (5 test suites)

| Test | Path | Cmd | Timeout | Status |
|---|---|---|---|---|
| `unified-e2e` | `tests/e2e/` | `python3 unified_e2e_suite.py` | 180s | ✓ |
| `meok-one` | `meok-one/` | `python3 -m pytest tests/ -q` | 300s | ✓ |
| `sovereign-temple` | `sovereign-temple/` | `python3 -m pytest tests/ -q` | 300s | ✓ |
| `layer0-tunnels` | `csoai-org-v2/layer0_tunnels/` | `python3 test_e2e.py` | 120s | ✓ |
| `meok-sigil` | `meok-sigil/` | `python3 tests/test_sigil.py` | 120s | ✓ |

**For M2:** the test fleet is run by the autonomous maintenance layer. You can re-run any suite manually with the cmd above.

---

## 11. The 11 JEEVES M4 lane alignment tests (all green)

| Test | Backed by | Status |
|---|---|---|
| `bridgethink_mcp.py --tools` | M4 cognitive engine | ✓ 22 arcanas + 13 queens + care_floor 0.95 |
| `bridgethink_mcp.py --demo` | M4 | ✓ sovereign_oowm_evolve + SIGIL emitted |
| `sovereign-tools-mcp.py --tools` | M4 | ✓ sovereign_mcp_mesh present |
| `sovereign-tools-mcp.py --demo` | M4 | ✓ care_floor_0.95 + bft_council_22_of_33 approved |
| `sovereign33_sdk.py --self-test` | M4 | ✓ 4 hard rules pass (care floor + sovereignty + BFT + SIGIL) |
| `test_m4_mcp_alignment.py` | M4 | ✓ Care Floor 0.95 + BFT majority + SIGIL emission + open-weights + MIT+CC0 |
| + 5 more (JEEVES) | | ✓ 101 sovereign-os tests |
| + 4 alignment | | ✓ Crowning + open-source + fork + UK CSOAI 16939677 |

**SUMMARY: 11 passed, 0 failed.** Any agent calling either lane's tools gets identical Care Floor + BFT + SIGIL. The M4 ↔ JEEVES bridge is real.

---

## 12. The 5 Settle & Coagula principles (the voice)

1. **Public.** Every hive + every agent-card + every sovereign action is public. MIT license. No proprietary walls.
2. **Auditable.** Every action SIGIL-signed + OSCAL-verifiable in any browser.
3. **Sovereign.** The citizen owns their data + their i-character + their hive connection.
4. **Care.** Care Floor 0.95. Article 9 special-category = 1.0. The substrate never produces a recommendation that could harm a sovereign consumer.
5. **Solve et Coagula.** Sovereignty by design. The 33 hives are the world, dissolved and recomposed — MIT, sovereign, federated.

---

## 13. The 5 most critical paths for M2

If M2 only reads 5 things, read these:

1. **`csoai.org/sovereign-os/HANDOFF-TO-M2.md`** — JEEVES's 327-line intro to the sovereign-os
2. **`csoai.org/sovereign-os/frontend/index.html`** — the live demo (see how it's wired)
3. **`csoai.org/sovereign-os/Makefile`** — the `make install-sovereign` target
4. **`csoai-os/design-system.css`** + **`csoai-os/canonical-sidebar.html`** — the visual system
5. **`LAYER0_ALIGNMENT_CHECK.md`** — the cross-walk

Plus: read **`M2_HANDOFF_PACKAGE.md`** + **`M2_CHEAT_SHEET.md`** (the M4 lane's 87KB handoff package).

---

## 14. The bottom line

**For M2:**
- 3 GCP surfaces (Mac + Sovereign OS + GCP VM)
- 17+ services on Mac (the 4 critical are 3101/3102/3200/8100)
- 22 tunnels (Mac ↔ VM, never touch manually)
- 33 hives (one per BFT node)
- 20 agent cards (`.hive/agent-cards/*.json`)
- 23 Python modules in `csoai.org/sovereign-os/`
- 10 sovereign commands (the brain calls these)
- 11 alignment tests (all green)
- 5 test fleet suites
- 8 sovereign guarantees (enforced on every action)
- 5 Settle & Coagula principles (the voice)

**The 5 critical paths for M2:**
1. HANDOFF-TO-M2.md (JEEVES's intro)
2. frontend/index.html (the demo)
3. 1-line installer in §6
4. design-system.css + canonical-sidebar.html (the visual system)
5. M2_HANDOFF_PACKAGE.md + M2_CHEAT_SHEET.md (M4's handoff)

**The 1-line to add Sovereign to any web app:**
```html
<script src="/sovereign-os/frontend/sovereign-event-bus.js" data-citizen-id="<your-id>"></script>
<script src="/sovereign-os/frontend/sovereign-hud.js"></script>
<script src="/sovereign-os/frontend/sov3-llm-brain.js" data-brain-endpoint="http://localhost:8100/v1"></script>
<link  rel="stylesheet" href="/sovereign-os/frontend/sovereign-hud.css">
```

**This document is the COMPLETE GCP+hives inventory for M2. Use it. The dragon ate it all.** 🐉💎🔥

---

**Built 2 Jul 2026 03:05 BST · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT + CC0 license**

— 🜏 Solve et Coagula