# DEFONEOS — full rundown (for agent inspection & audit)

**What it is:** a sovereign defence-AI **Common Operating Picture** — a CesiumJS 3D globe where a
governed AI ("the Sovereign") drives every live layer, and every action is Ed25519-signed on-device.
Live at **https://defoneos.vercel.app** (root → clean landing → `cop.html` = the dome).

**Honesty register (read first):** this repo is built to an explicit honesty standard. Anything labelled
"simulation", "illustrative", "demo data", or "gated" is exactly that. The **hard half is real**
(Cesium globe, live free feeds, on-device Ed25519/SIGIL signing, the signed System Card). The
**reasoning brain and real enforcement run on the SOV3 node** (off-box) — the public mirror shows the
*governed decision* made visible + signed, and says so. Do not read demo choreography as production
autonomy.

---

## Architecture (one mind · pluggable bodies · one seam)
- **Mind:** the Sovereign — a tool-calling reasoning loop. Default sight is **symbolic** (`getScreenContext`);
  optional **on-demand pixel vision** via the `look` tool (`/api/vlm`, gated). Voice is two-way (TTS + Web Speech).
- **Bodies:** the **globe** (default, near-free, `cop.html`) and an optional **Unreal** photoreal body
  (`/api/unreal` + `tunnelIn()`, gated on `UNREAL_STREAM_URL`) reached through the same Layer-0/MCP seam.
- **Governance (Layer-0):** every action → Ed25519 sign (on-device `@noble/ed25519`) → hash-chained SIGIL
  ledger → independently verifiable at `/verify.html`. Sensitive actions are BFT-gated (33-agent, quorum 23/33,
  care-floor ≥ 0.30) — **modelled + signed on the mirror; enforced on the node.**

## Serverless API (all `/api/*.js`, CORS-open, honest-gated)
| Endpoint | Purpose | Key / gate |
|---|---|---|
| `cameras` | public cameras (TfL/511 keyless; Windy global) | `WINDY_KEY` (✅ set) for global |
| `space` | live ISS position + upcoming launches | keyless |
| `places` | OSM POIs by bbox — biz/health/edu/energy/food/finance/gov + **comms/wifi/power/water** | keyless |
| `powerplants` `airports` `aircraft` `marine` `signals` `events` `airquality` `sensors` `cyber` `threats` `intel` `forecast` `status` `stats` `mcps` `firms` `radiation` | live free layers / governed feeds | `firms` needs `FIRMS_KEY`; rest keyless |
| `simulate` | governed scenario (deterministic **illustrative** council vote; scenarios incl. counter-drone, isr-sweep, medevac, swarm-patrol, cyber-intrusion, flood-999, eod-clearance, comms-relay, **humanitarian-corridor**) | keyless |
| `brain` | server-side LLM proxy (key stays server-side) | `SOV3_BRAIN_ENDPOINT`/`_KEY`/`_MODEL` ⬜ |
| `vlm` | on-demand pixel vision for the `look` tool | `VLM_ENDPOINT`/`_KEY`/`_MODEL` ⬜ |
| `learn` | export the signed learning-queue to the node | `SOV3_LEARN_ENDPOINT` ⬜ |
| `systemcard` | **Ed25519-signed AI System Card** (JSP 936 assurance proof point; synthetic data, real signing) | `DEFONEOS_SIGN_SK` ⬜ (ephemeral until set) |
| `g3dkey` | serves Google Map-Tiles key for photoreal-3D | `G3D_KEY` (✅ set; needs Maps billing) |
| `unreal` | Unreal Pixel-Streaming body | `UNREAL_STREAM_URL` ⬜ |
| `badge` `verify-seal` | embeddable verifiable seal / integrity check | keyless |
All gated endpoints return `{gated:true, reason}` until their env var is set — **never fabricate**. See `SETUP_KEYS.md`.

## The dome (`cop.html`, single file) — key subsystems
- **Cinematic arrival** (`_cinematicArrival`): space → clouds → satellites → plunge to the user's IP
  location → 3-mile scan + top-9-USP teaser → 9 miles → the demo runs (interruptible).
- **Guided tour** (`FULL_STEPS`/`DEMO_STEPS`, `_tourRun`) — a full deep-dive tour plus a shorter demo
  path, both interruptible barge-in (voice + brain), auto-resume; per-step cinematic scan-sweep accent (`_tourFx`).
- **Defence interop (table-stakes)** — **Cursor-on-Target (CoT)** import/export (`cotImport`/`cotExport`,
  the TAK/ATAK lingua franca) + **MIL-STD-2525 / APP-6** symbology via the open `milsymbol` lib (`cotDemo`).
  OSINT/demo-tier over public tracks; classified feeds (Link-16/STANAG) bind on the sovereign node.
- **Fusion analytics** — cross-source **convergence early-warning** + open-signal **hotspot** ranking
  (`convergenceScan`): real, on-device correlation over the live layers, **Ed25519-signed** to the ledger.
  Transparent event-density, not a classified score. Plus **maritime chokepoints** (`toggleChokepoints`,
  public geography + live AIS exposure) and **energy infrastructure** (`toggleEnergyInfra`, curated
  major pipelines + LNG/storage).
- **Layers/commands** — aircraft·ADS-B, vessels·AIS, weather radar, seismic·USGS, news·GDELT, natural
  events·EONET/GDACS, air quality, orbital/ISS/satellites, public cameras (global), living clouds·MODIS,
  power plants, airports, rail, finance, **comms/wifi/power/water infrastructure**, **aurora·NOAA OVATION**,
  God's-Eye NASA imagery. Natural-language command router (`command()`).
- **Grid** — lat/lon graticule + MGRS military grid + sub-square labels, measure (range/bearing),
  waypoint mark (MGRS + clipboard), coordinate readout.
- **SOV SPACE sims** — `runSim` flies into the theatre and **animates** sense→fuse→detect→gate→act→sign
  on the globe, with a **live code-trace console** (`_openSimConsole`), council-gated + SIGIL-signed.
- **Guardian** (`sovStopThreat`) — a rogue agent starts to act → BFT 28/33 + care-floor → **STOPPED
  before it moved**, signed. The "can it stop a bad actor?" capability (decision real+signed; actuation on node).
- **Rainbow Security ASI** (`openRainbow`) — 7 colour-teams (red/orange/yellow/green/blue/purple/white),
  any can propose, nothing acts without the BFT gate.
- **Ontology on the globe** (`drawOntology`) — 28 sector nodes + hub; the industries→data→MCP→law map.
- **Brain setup** — the OOWM **sandwich** picker (Edge/Balanced/Deep/Creative) + **one-tap provider connect**
  (OpenRouter/Groq/OpenAI/DeepSeek/Mistral/Gemini/Together/xAI/Ollama/SOV3-node) with device-only key box.
- **Voice** — audible "Sovereign online" on entry; a **watchdog** self-heals the Chrome speechSynthesis
  wedge and guides the user; mic loading spinner; tour-safe barge-in.
- **Ambient/alive** — after 2 unanswered prompts, autonomous data-collection + sims with **lowered voice**;
  exits on any interaction.

## Verifiability (the moat, and how to audit it)
1. Open `/verify.html` → it re-checks each SIGIL Ed25519 signature **in your browser**, no server trusted.
2. Open `/systemcard.html` → **Verify offline** passes; **Tamper test** flips a byte → rejected.
   (Independently re-verified with Python `cryptography` — signing is real; card content is synthetic.)
3. `curl https://defoneos.vercel.app/api/<brain|vlm|learn|systemcard|companies|unreal>` → honest `gated` states.

## What is NOT in this repo (kept private / node-side)
- `os-console-private.html` (internal ops console + VM IP) — **excluded from this repo & from deploy**.
- Real API keys / signing secrets — **only in Vercel env**, never committed.
- The SOV3 node (reasoning brain, real enforcement, hives, RL/fine-tune) — off-box.

## Deploy
`vercel deploy /path/to/defoneos-com --prod --yes --scope niks-projects-0a2ef942`
(absolute path — `.` can resolve to $HOME). Root routing: `landing.html`→`index.html` (clean),
console excluded via `.vercelignore`.

## Auditor quick-start
- `cop.html` is the whole dome (one file). `api/*.js` are the connectors. `RUNDOWN.md` (this) + `SETUP_KEYS.md`
  are the map. `_csoai-cam-pack/` is the portable cam widget for CSOAI.
- Everything claimed "signed" is `@noble/ed25519` (browser) or Node `crypto` Ed25519 (systemcard) — verify it yourself.
- Flag any string that overclaims vs what the code does — that's a defect here, not a feature.
