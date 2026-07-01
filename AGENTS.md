# CSOAI Sovereign OS — agent & contributor rundown

> A full, machine-readable understanding of this repo for humans **and** AI agents inspecting or testing it.
> Public front-end brand: **CSOAI / Sovereign / Layer 0**. (Substrate codenames stay out of the public UI.)

## What this is
CSOAI is an **AI-governance operating system**: an agent-first web app where an end user speaks or types to
their **Sovereign**, which answers with live world data *and acts* — opening tools, mapping jurisdictions,
running simulations, signing decisions. It targets governments, Fortune 100/500 CISOs, regulators (e.g. NIST),
and everyone who needs to govern, comply, prove, and stay safe around AI.

## Architecture
- **Front-end:** Vite + React + TypeScript, router = `wouter`. Source in `client/`. Build: `npm run build:client` → `dist/client`. Deploys to Vercel (`csoai-v2-app.vercel.app`), config in `vercel.json` (SPA rewrite).
- **Sovereign brain (shared, keyless):** `https://os.meok.ai/api` — the live reasoning + signing backend. Endpoints used by the UI:
  - `POST /chat` — natural-language answer (`{message}` → `{response}`)
  - `GET /govern?q=` — industry → framework stack
  - `POST /orchestrate` — `{message,context}` → `{say, actions}` (aware + capable; drives navigation)
  - `GET /health` — Layer 0 protocol surface, care-floor, ed25519 sigil, tool count
  - `GET /systemcard` — issues an Ed25519-signed AI System Card (JSP 936 assurance)
  - `POST /sign` + `POST /verify` — sign any message / verify offline (VALID vs REJECTED on tamper)
- **Layer 0:** the trust floor — Ed25519 signing, care-floor 0.95, 33-agent BFT council, offline verification.
- **Globe:** `public/globe3d.html` (CesiumJS, keyless) is driven by the app via `postMessage`:
  `{cmd:'flyTo',lng,lat,height,pitch,heading}`, `{cmd:'layer',tag,on}`, `{cmd:'neutralize'|'rearm'|'home'|'spin'}`.
  An early buffer queues commands before Cesium finishes loading, then flushes (`window.__sovReady`).

## Key surfaces / routes (all under `/`)
| Route | What it is |
|---|---|
| `/demo`, `/tour` | Immersive auto-starting tour — Sovereign flies the globe, narrates, opens tools in a right-hand browser-in-chat, speak/tap to interrupt |
| `/os` | The OS launcher — every app as a card |
| `/graph` | Governance Graph — jurisdiction + live framework stack + reasoned read |
| `/try` | BFT Council — describe an AI system, 5 agents deliberate, signed verdict |
| `/sov-space` | Run a governance simulation, sealed with a Layer 0 ledger hash |
| `/hive`, `/hive/:slug` | **Framework Hive** — click any framework → everything collected (obligations, penalties, sectors, threats, crosswalks, deadline clock) + real open-source MCP tools |
| `/system-card` | **Signed AI System Card** — issue → verify offline (VALID) → tamper (REJECTED), live Ed25519 |
| `/protect` | **Personal Protection** — deepfake/impersonation shield (sign as you → a deepfake fails). proofof.ai |
| `/ontology` | The semantic layer (Palantir-style): Objects · Links · Actions |
| `/safe-space` | One safe space for all AI governance — law, cyber, standards, AI-lab specs, open-source commons |
| `/watchdog-map` | Public AI Watchdog — humans/agents/humanoids/systems report; world heat-maps |
| `/poc` | ONE OS for agents & humanoids — rogue-swarm stop via cameras + WiFi sensing + Rainbow Stack, signed |
| `/world` | 2D SVG sovereign globe with framework pins, watchdog heat, rogue-stop, ontology overlay |
| `/pricing` | Plans incl. the defence-grade **Operator** tier; funnel → `/signup` (plan-aware) → `/welcome` |

## Globe data layers (14, toggle by HUD chip or by asking the Sovereign)
`nodes` (sovereign nodes), `frameworks`, `ontology` (relationship web), `arcs` (mesh), `gov` (governments),
`fortune` (Fortune 500/100), `cyber` (CNI/threat hubs), `robotics` (R&D hubs), `intel` (AI-security/trending),
`threat` (rogue swarm), `humanoids`, `sats`, `plants`, `swarm`. The demo also opens live public cams (`/livecam.html`).

## Real governed tools (open source)
30+ published MCP compliance servers live at **github.com/CSOAI-ORG** (e.g. `eu-ai-act-compliance-mcp`,
`gdpr-compliance-ai-mcp`, `iso-42001-ai-mcp`, `dora-nis2-crosswalk-mcp`, `oscal-generator-mcp`,
`bias-detection-mcp`, `healthcare-ai-governance-mcp`, `csoai-governance-crosswalk-mcp`). The Hive links each
framework to its real repo(s). Framework content: `client/src/data/frameworks-content.ts` (22+ crosswalks),
`client/src/data/hive-frameworks.ts` (structured hive data).

## Build / run / test (for agents)
```bash
npm install --ignore-scripts
npm run build:client                 # vite build → dist/client
npx vite preview --config client/vite.config.ts --port 4173 --host
# E2E (headless Playwright, run against preview or production):
node scripts/e2e-smoke.mjs           # 163-route health sweep (baseline 153/163; 10 are backend-tRPC pages)
node scripts/e2e-sovereign.mjs       # persona-driven flows against the LIVE brain (dock/graph/council/…)
node scripts/e2e-adversarial.mjs     # mobile viewport, malformed/injection inputs, offline-brain fallback
```
Notes: `esbuild` tolerates pre-existing TS type warnings. The 10 "flagged" smoke routes are tRPC-backed
(`/dashboard`, `/ai-systems`, …) that 500 only under static preview; they are served on production.

## How the Sovereign works (the pitch, in one paragraph)
A sandwich: a **left brain** (reasoning, tools, BFT compliance) and a **right brain** (perception, vision/VLM).
Route ANY model underneath — MoE, mixture-of-models, world model, VLM — and the Sovereign wraps it in the
33-agent **BFT council** + **Layer 0** so whatever you plug in stays compliant and every decision is signed.
Offline / Hosted / PAYG.

## Public relevance / why it matters
The assurance regimes (EU AI Act, UK JSP 936, NIST, ISO 42001, cyber CRA/NIS2/DORA) all demand *proof* that an
AI system was governed. The missing primitive — an independent, tamper-evident, offline-verifiable record — is
the **Signed AI System Card**, live here. "Don't trust us — verify it yourself, and watch tampering fail."

_© CSOAI Ltd (UK). MIT-licensed core. EU AI Act Article 50 transparent._
