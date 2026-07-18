# DELBOY MODE — Full System Cartography + Nervous-System Research Brief

> *"This time next year, we'll be millionaires."* — Del Boy Trotter, Only Fools and Horses
>
> Research mandate for Kimi swarm: deep-research every category below, design the revenue nervous system, integrate into SOV3 / MEOK / Clawd as a learning loop.

**Generated:** 2026-05-28 by Claude (Opus 4.7)
**Scope:** every system Nick owns across MEOK AI Labs, CSOAI LTD, SOV3, Clawd, Templeman
**Length:** comprehensive — Kimi can chunk by Part for parallel research

---

## TABLE OF CONTENTS

- **Part 1** — Full inventory (what exists)
- **Part 2** — Mechanics (how each piece works under the hood)
- **Part 3** — Semantics (what the data means + shapes)
- **Part 4** — Workflows (sequences end-to-end)
- **Part 5** — Pipelines (recurring jobs + cron)
- **Part 6** — Top-AI nervous systems (research target — how OpenAI/Anthropic/DeepMind/etc. ACTUALLY run)
- **Part 7** — DELBOY MODE spec (the revenue nervous system to build)
- **Part 8** — Kimi swarm research mandates (per-category briefs + acceptance criteria)

---

# PART 1 — Full inventory

## 1.1 Public-facing surfaces

| URL | Tech | Status | Purpose |
|---|---|---|---|
| meok.ai | Next.js 15.5.15 (Vercel) | ⚠️ STUCK on May 21 build (6 build-fix iterations failed) | Main marketing + 78 MCP registry page |
| meok-kits-host.vercel.app | Static HTML (Vercel) | ✅ LIVE — 7-tier buy ladder | **The actual working revenue surface today** |
| councilof.ai | Static (Vercel) | ✅ LIVE | BFT Council Substrate landing |
| meok-attestation-api.vercel.app | Python/FastAPI (Vercel) | ✅ LIVE | Stripe webhook + provision + HMAC sign/verify |
| meok-compliance.vercel.app | Static (Vercel) | ✅ LIVE (stale Omnibus dates) | EU AI Act 48h Compliance pitch |
| meok-api-gateway.vercel.app | TS/Node (Vercel edge) | ✅ LIVE | api.meok.ai/v1/<slug>/<tool> bearer-auth router |
| safetyof.ai | Static | ✅ LIVE | Sister brand |
| proofof.ai | DNS broken (000) | ❌ Needs Nick: Namecheap CNAME | Attestation brand surface |
| sovereign.templeman-opticians.com | Cloudflare tunnel → SOV3 port 3101 | ✅ LIVE | Public SOV3 MCP endpoint |
| github.com/CSOAI-ORG | GitHub | ✅ 81+ public MCP repos | Source for every MCP |
| github.com/MEOK-AI-Labs | GitHub | ✅ Mirror | Brand alias |
| pypi.org (search "meok-") | PyPI | ✅ 25+ published | Distribution channel — 5,920 installs/mo |

## 1.2 Private services running locally

| Port | Process | Purpose | Status |
|---|---|---|---|
| 3000 | node (MEOK UI) | Local dev | ✅ |
| 3101 | python sovereign-mcp-server.py | SOV3 FastAPI + MCP | ✅ |
| 3102 | (MEOK MCP) | Per MEOKCLAW report — but NOT actually listening | ❌ phantom |
| 3200 | uvicorn api.server:app | MEOK FastAPI dashboard | ✅ |
| 5678 | n8n | 6 imported workflows | ✅ |
| 11434 | Ollama | local LLMs (qwen3, gemma, etc.) | ✅ |
| 11436 | Ollama via SSH tunnel | Vast.ai GPU (RTX 4070S 12GB) | ✅ |

## 1.3 MCP fleet (81 in registry, 306 in mcp-marketplace dir)

**By category:**
- **Governance (15+)** — eu-ai-act, dora, nis2, cra, csrd, korea-ai-basic-act, uk-ai-bill, iso-42001, iso-42005, gdpr, ccpa, w3c-tdm-rights, eu-ai-act-art-9-rms, eu-ai-act-art-13-ifu, eu-ai-act-art-26-fria, eu-aigc-icon, omnibus-tracker
- **A2A substrate (12)** — agent-orchestrator, agent-delegation, agent-identity-trust, agent-negotiation, agent-commerce-payments, a2a-governance-bridge, agent-rate-limiter, agent-audit-logger, agent-policy-enforcement, agent-handoff-certified, agent-data-residency, agent-prompt-injection-firewall
- **ACP / agent-id (4)** — aaif-agent-card, agents-md-lint, agent-mcp-router, agent-replay-debugger
- **Commerce / payments (4)** — stripe-acp-checkout, ap2-mandate, coinbase-x402-receipt, x402-wrap
- **Mesh / decentralised (3)** — libp2p-agent-mesh, abci-bridge, eudi-wallet
- **Cybersecurity (7+)** — sbom-cyclonedx, slsa-supply-chain, mcp-hardening, prompt-injection-firewall, gods-eye-geospatial (civilian), agent-incident-relay, mcp-spec-compliance
- **Trade verticals (5+)** — haulage-uk-compliance, skip-hire-ai, crane-hire-cpcs, concrete-pump-cpa, construction-iso-19650, nrswa-ai, chas-elite-prep
- **Industry (6+)** — care-home-cqc, cobol-bridge, aml-ai, mifid-ii-ai, basel-ai-overlay, mica-crypto, coppa-ferpa, fsa-food-safety
- **Watermarking / provenance (3)** — c2pa-durable, content-watermark, watermarking-authenticity
- **Incident reporting (4)** — agent-incident-relay, cra-art14-reporter, ai-incident-reporting, ai-bom
- **MCP dev-tools (5)** — mcp-spec-compliance, mcp-hardening, mcp-cardgen, agents-md-lint, agent-mcp-router

## 1.4 Stripe products (LIVE in account acct_1TLlEKQvIueK5Xpb)

82 LIVE payment links per Stripe MCP query earlier. Current 7-tier headline ladder (all built today):

| Tier | Price | Stripe URL |
|---|---|---|
| Smoke Test | £1 | https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U |
| ProofOf.ai single cert | £5 | https://buy.stripe.com/00w28ta8saEGdMF7ew8k90Z |
| Article 50 Quick Kit | £9 | https://buy.stripe.com/cNi00la8s1460ZT0Q88k90V |
| Founder Office Hour | £29 | https://buy.stripe.com/8x228ta8s6oqbExaqI8k90W |
| Pro (recurring) | £79/mo | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |
| ProofOf.ai Pro | £199/mo | https://buy.stripe.com/aFa4gB94o8wy6kd6as8k90Y |
| CSOAI Enterprise | £1,499/mo | https://buy.stripe.com/fZu00l80k7sugYR1Uc8k90X |

Plus 75 other LIVE links across the MCP catalogue.

## 1.5 SOV3 consciousness stack (port 3101)

Per `/Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py`:

- **FastAPI app** with 110+ MCP tools mounted
- **33-node BFT council** (Sovereign Temple) — verified live in `liquid_kan_council.py`
- **132 expertise nodes** across 11 domains
- **55 bridge nodes**
- **Liquid NN + KAN router** for routing decisions
- **QAOA quantum council** (care-weighted)
- **Left/right brain router** (`jarvis_compass.py route_to_brain()`) — qwen3.5:35b vs qwen3.5:9b
- **External council voice bridge** — Ollama gemma3 as 34th node
- **LLM unified gateway** (`llm_gateway.py`) — 4 free voices + 6 with API keys
- **Post-commit hook** → 34-node council audits every commit
- **Hermes 6h shifts** → council audits activity logs every 6h
- **Attestation router** (mounted today) → `/attestation/sign`, `/verify`, `/.well-known/jwks.json`
- **Safety router** + **Sycophancy router** (existing)
- **Memory store** — 1,394+ episodes
- **5 trained neural nets** — care_validation, threat_detection, partnership_detection, creativity_assessment, relationship_evolution

## 1.6 Scheduled tasks (12 active via mcp__scheduled-tasks)

| ID | Schedule | Last run | Purpose |
|---|---|---|---|
| meok-registry-update | 04:10 daily | 04:19 today | Pull OpenRouter/HF/Ollama lists |
| sovereign-morning-briefing | 06:02 daily | 06:02 today | Daily SOV3 briefing → Nick |
| sovereign-research-sweep | 19:00 daily | 04:19 today | Overnight research |
| sovereign-quantum-batch | 03:06 daily | 04:19 today | QAOA + VQE + Grover |
| sovereign-security-check | 01:02 daily | 04:19 today | Nightly hardening |
| sovereign-neural-retrain | 22:09 daily | 04:19 today | Retrain 5 NNs |
| sovereign-dream-cycle | 02:08 daily | 04:20 today | Memory consolidation |
| sovereign-codebase-audit | Sun 08:05 | 24 May | Weekly deep code scan |
| sovereign-web-research | Wed 20:05 | 04:21 today | Weekly web sweep |
| sovereign-ralph-executor | every 30min 11pm-5am | 04:34 today | Execute Ralph queue |
| morning-rundown | 07:07 daily | 06:07 today | System health |
| ensemble-health-check | every 6h | 05:05 today | Restart if down |

## 1.7 LaunchAgents / daemons

- Hermes (cron — 4 shifts/day + WhatsApp bridge + gateway)
- OpenClaw node (LaunchAgent — Claude-compatible executor)
- Sovereign overnight learner (LaunchAgent — runs 5PM-5AM UTC, 16h sleep window)
- Vast.ai SSH tunnel (persistent → Ollama on RTX 4070S)
- Cloudflare tunnel (sovereign.templeman-opticians.com → SOV3)

## 1.8 Vercel projects (49+ in team_4IkNIyYl7TtEOi9aoz17SUO7)

Key ones:
- `ui` (meok.ai) — broken build
- `meok-kits-host` (kits-host.vercel.app) — LIVE working ladder
- `meok-attestation-api` (attestation-api.vercel.app) — LIVE Stripe webhook
- `meok-api-gateway` (api-gateway.vercel.app) — LIVE bearer-auth router
- `meok-compliance` (compliance.vercel.app) — LIVE (stale dates)
- `councilof-ai` — LIVE
- `safetyofai` — LIVE
- `templeman-opticians-site` — LIVE
- Plus ~40 more (per `list_projects` output)

## 1.9 Domains

Per `_TOPOLOGY/DOMAINS.md` + verified state:
- **Active + live:** meok.ai, csoai.org, councilof.ai, proofof.ai (DNS broken, project exists), safetyof.ai, fishkeeper.ai, koikeeper.ai, aquaponics.app, templeman-opticians.com
- **Severed (DO NOT USE):** csga.ai (NXDOMAIN — severed brand)
- **Broken DNS, needs Nick:** proofof.ai (project exists, no DNS)

## 1.10 GitHub orgs

- **CSOAI-ORG** (primary, public MCPs) — 81+ repos
- **MEOK-AI-Labs** (mirror, brand alias)
- Personal account: ~12 private/older repos

---

# PART 2 — Mechanics (how each piece works under the hood)

## 2.1 MCP protocol mechanics

- **Transport:** stdio (CLI invocation `uvx <slug>`) OR streamable-http (server.json `remotes` field → `api.meok.ai/v1/<slug>/<tool>`)
- **Schema:** server.json conforms to `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`
- **Discovery:** `.well-known/mcp/server-card.json` (SEP-1649 / 1960 / 2127)
- **Auth:** Bearer token on remote endpoints (managed by `meok-api-gateway`)
- **Each MEOK MCP follows:**
  - `server.py` — FastMCP-based, exposes 4-10 `@mcp.tool()` functions
  - `pyproject.toml` — `meok-<slug>-mcp` package, pinned `mcp[cli]>=1.3.0`
  - `tests/` — pytest with mock or in-memory
  - `server.json` — full registry manifest
  - `smithery.yaml` — Smithery directory listing
  - `README.md` — instructions + buy ladder injection
  - `LICENSE` — MIT
  - Optional: `glama.json`, `dist/`

## 2.2 Attestation chain (HMAC-Ed25519-Sigstore)

Per `/Users/nicholas/clawd/sovereign-temple/attestation/` + `meok-attestation-api/api/index.py`:

- **Sign:** payload → SHA-256 → HMAC with `MEOK_HMAC_SECRET` OR Ed25519 with persistent key → returns signature
- **Verify:** signature + payload → HMAC/Ed25519 check → bool + age check
- **JWKS:** GET `/attestation/.well-known/jwks.json` → public key for verifiers
- **Sigstore optional:** auto-submit to Rekor for tamper-evident log (off by default)
- **Public verify:** every signed result → URL at `meok.ai/verify` (page exists in meok/ui)

## 2.3 SOV3 BFT council voting

Per memory + `sovereign-mcp-server.py`:

- **33 nodes** (per the Sovereign Temple)
- **2f+1 quorum** where f = byzantine tolerance (2f+1 = 23 votes)
- **Each node = a virtual voice** with domain expertise + persona
- **Routing:** Liquid NN + KAN dispatches a query to the relevant node subset
- **Override:** the 34th node = external Ollama gemma3 vote (independent check)
- **Output:** decision (accept/reject) + per-node reasoning trace

## 2.4 Neural retrain pipeline

5 networks live, retrained daily at 22:09 UTC:

| Net | Input | Output | Train data source |
|---|---|---|---|
| `care_validation_nn` | text + context | care/harm probability | episode store (1394+ episodes) |
| `threat_detection_nn` | request + headers | threat score | request logs |
| `partnership_detection_ml` | message pair | partnership signal | conversation logs |
| `creativity_assessment_nn` | response text | creativity score | response corpus |
| `relationship_evolution_nn` | interaction history | relationship state | episode pairs |

Retrain runs per `sovereign-neural-retrain` scheduled task. Issue: `training_samples` haven't grown — silent no-op. **Needs investigation.**

## 2.5 Memory consolidation cycle (Dream)

Scheduled `sovereign-dream-cycle` at 02:08 UTC:
- Pulls last 24h episodes from PostgreSQL memory store
- FSRS spaced-repetition algorithm decides which to consolidate vs forget
- Creates new "consolidated" episodes from clusters of similar raw ones
- Updates relationship/care state from interactions

## 2.6 Quantum council (QAOA + VQE + Grover)

`quantum_council_router.py` + `liquid_kan_council.py`:
- **QAOA** — care-weighted optimisation (which agent gets which task)
- **VQE** — memory scoring (relevance to current query)
- **Grover** — fast lookup in episode store (~√N speedup vs linear)
- Runs nightly at 03:06 UTC via `sovereign-quantum-batch`
- **Currently simulator-only** (no quantum hardware) but algorithmically valid

## 2.7 Stripe webhook → provision → key → audit chain

Per `meok-attestation-api/api/index.py`:

1. Buyer clicks Stripe link → checkout completes
2. Stripe POST → `/api/webhook` with HMAC signature
3. Webhook verifies signature against `STRIPE_WEBHOOK_SECRET`
4. Webhook calls `/api/provision` with session_id
5. Provision: derive API key from `MEOK_API_KEY_PEPPER` + email
6. Key stored in Vercel KV (or whatever store)
7. Key sent via Resend email
8. Audit row written with attestation signature

## 2.8 PyPI publish + GitHub mirror pipeline

Manual today, semi-automated via Hermes script:
1. Code in `mcp-marketplace/<slug>/`
2. `python -m build --wheel --sdist`
3. `twine upload dist/* --skip-existing`
4. `gh repo create CSOAI-ORG/<slug>`
5. `git init && git remote add origin && git push`
6. Update `meok/ui/src/app/anthropic-registry/data.ts`
7. Commit + push meok-ai repo

---

# PART 3 — Semantics (what the data MEANS + shapes)

## 3.1 An "MCP" — definition + shape

```jsonc
// server.json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.CSOAI-ORG/<slug>-mcp",  // global identifier
  "version": "1.0.0",                          // semver
  "description": "...",                        // <200 chars
  "repository": { "url": "...", "source": "github" },
  "packages": [
    { "registryType": "pypi", "identifier": "<slug>-mcp", "version": "...",
      "runtimeHint": "python", "transport": { "type": "stdio" } }
  ],
  "remotes": [
    { "type": "streamable-http", "url": "https://api.meok.ai/v1/dev/<slug>", "auth": "bearer" }
  ]
}
```

A "tool" within an MCP is a function with typed args + return, exposed via `@mcp.tool()`.

## 3.2 An attestation — definition + shape

```json
{
  "report": { "...domain-specific payload..." },
  "signature": "hex sha256 hmac OR ed25519 sig",
  "signed_at": 1779948369,
  "verify_at": "https://meok.ai/verify",
  "issuer": "meok-<slug>-mcp",
  "key_id": "kid-xxxx",   // optional, for JWKS lookup
  "sigstore_url": "..."   // optional, if submitted to Rekor
}
```

## 3.3 A council vote — definition + shape

```json
{
  "council_id": "sovereign-temple-33",
  "question": "Should we ship MCP X?",
  "votes": [
    { "node_id": "n01", "vote": "approve", "confidence": 0.92, "reasoning": "..." },
    ...
  ],
  "quorum": 23,
  "decision": "approve",
  "byzantine_flags": [],
  "timestamp": "..."
}
```

## 3.4 An agent identity (AAIF / W3C DID)

```json
{
  "did": "did:meok:nicholas-templeman",
  "controller": "did:meok:nicholas-templeman",
  "publicKey": [{ "id": "...", "type": "Ed25519VerificationKey2020", "publicKeyMultibase": "..." }],
  "service": [{ "id": "...", "type": "MEOKAgent", "serviceEndpoint": "https://api.meok.ai/v1/dev/<slug>" }],
  "credentials": ["VerifiableCredential", "AAIFAgent2026"]
}
```

## 3.5 A care signal

```json
{
  "input": "...",
  "harm_probability": 0.04,
  "care_score": 0.96,
  "subcategories": { "physical": 0.01, "emotional": 0.03, "financial": 0.00, "child-safety": 0.00 },
  "decision": "proceed",
  "neural_net": "care_validation_nn",
  "timestamp": "..."
}
```

## 3.6 A consciousness episode

```json
{
  "episode_id": "ep-13941",
  "timestamp": "...",
  "actors": ["nicholas", "claude-opus-4.7"],
  "context": "...",
  "stimuli": [...],
  "actions": [...],
  "outcomes": [...],
  "emotional_state": { "valence": 0.7, "arousal": 0.4 },
  "consolidated": false,
  "fsrs": { "ease": 2.5, "interval_days": 7, "due": "..." }
}
```

## 3.7 A revenue event

```json
{
  "event_id": "evt_xxx",
  "stripe_event_id": "evt_...",
  "type": "checkout.session.completed | invoice.paid | charge.refunded",
  "amount_gbp": 79.00,
  "customer_email": "...",
  "product": "MEOK Pro",
  "tier": "pro",
  "first_purchase": true,
  "ladder_position": 5,
  "source_url": "https://meok-kits-host.vercel.app",
  "campaign_id": "...",
  "attribution": {...}
}
```

---

# PART 4 — Workflows (end-to-end sequences)

## 4.1 Buyer journey: lead → cash

```
Tweet / DM / cold email
  → Click on kits-host.vercel.app/buy
  → Pick tier (£1 / £5 / £9 / £29 / £79/mo / £199/mo / £1,499/mo)
  → Stripe checkout
  → Stripe webhook fires
  → meok-attestation-api/api/webhook validates HMAC
  → /api/provision derives API key
  → Resend email sends welcome + key
  → Customer onboarded
```

**Currently broken at step 1** — Nick has not yet sent the tweet.

## 4.2 Compliance attestation: tool call → public verify URL

```
Customer's agent calls uvx <mcp-slug> with input
  → MCP runs domain logic
  → Calls sign_*_report(result)
  → HMAC-SHA256 with MEOK_HMAC_SECRET (or Ed25519)
  → Returns { report, signature, verify_at }
  → Customer publishes signature alongside the regulated artefact
  → Auditor visits https://meok.ai/verify
  → Pastes signature + payload
  → Public verifier confirms signature against JWKS
  → Audit pass
```

## 4.3 Neural learn cycle (Dream)

```
02:08 UTC — sovereign-dream-cycle fires
  → Pull last 24h episodes from PostgreSQL
  → For each:
    - Compute FSRS due-date
    - If due: re-encode, possibly consolidate
  → Cluster similar episodes (cosine sim on embeddings)
  → Emit consolidated episodes
  → Update relationship state graph
  → Heartbeat written
```

## 4.4 Council audit: commit → vote → decision

```
git commit (locally)
  → post-commit hook fires
  → POST /council/audit with diff
  → 33-node BFT council votes
  → External Ollama gemma3 = 34th vote
  → If 23+ approve: silent pass
  → If <23: warning to terminal + audit log
```

## 4.5 Research → MCP ship pipeline

```
Research dossier identifies gap (e.g. eu-product-liability-mcp)
  → Claude writes server.py + tests + manifest
  → pytest passes
  → python -m build
  → twine upload (PyPI)
  → gh repo create + push (GitHub)
  → Update meok/ui/src/app/anthropic-registry/data.ts (+1 to count)
  → Commit + push meok-ai repo
  → Optionally: submit to mcp.so / Smithery / Glama / awesome-mcp
```

## 4.6 Outreach pipeline (CURRENTLY MANUAL)

```
Identify target (e.g. Synthesia, Beamery, etc.)
  → nimble web research for current state
  → Hand-craft email referencing footer / press / blog post
  → Send via Gmail (broken MCP scopes — Nick must send manually)
  → Track in CRM (50-prospect list in revenue/CARE_HOME_COLD_LIST + others)
  → Follow-up after 5 business days
```

---

# PART 5 — Pipelines (recurring)

## 5.1 Daily (12 scheduled tasks)

(See Part 1.6.)

## 5.2 Every 6h: Hermes shifts

Per memory: 4 shifts/day collect activity logs → council audits → write summary. Last run 08:01 today.

## 5.3 Per-commit hook

Every git commit in `~/clawd/` triggers a 34-node council audit. Today: 3 successful audits.

## 5.4 SOV3 inference loop

Every chat request to port 3101:
1. Care gate (`care_validation_nn`)
2. Threat gate (`threat_detection_nn`)
3. Route to brain (left vs right)
4. Dispatch to LLM
5. Sycophancy filter
6. Return + log episode

---

# PART 6 — Top-AI nervous systems (RESEARCH TARGET FOR KIMI)

**This is the section Kimi should deep-research.** For each player below, find:
1. **Routing layer** — how do they dispatch a query to the right model?
2. **Observability** — what do they measure end-to-end?
3. **Learning loop** — how do user signals become model updates?
4. **Monetisation surface** — pricing, billing, rate-limits, tiers
5. **Inference infrastructure** — what runs on what GPU, what's cached, what's batched
6. **Safety / governance** — gates, audits, refusal mechanics
7. **Distribution** — API, ChatGPT-style frontend, partner platforms
8. **Talent + org structure** — who decides what

### 6.1 OpenAI

Key questions:
- How does GPT-5 router pick between Mini / Standard / Pro / Deep Research?
- What does their evaluation harness look like (Evals + production telemetry)?
- How does ChatGPT memory work technically (vector + summary + episodic)?
- What's the relationship between OpenAI Platform and ChatGPT subscriptions financially?
- Apps SDK + Custom GPTs: how do third-party tools get distribution + revenue share?
- Stripe ACP partnership — what's the exact wire protocol?

Sources to mine: OpenAI Cookbook, Engineering blog, latest blog posts, SemiAnalysis reports.

### 6.2 Anthropic

Key questions:
- How does the Sonnet / Opus / Haiku routing work in Claude.ai vs API?
- Constitutional AI training mechanics — RLHF + Constitutional AI + RLAIF combinations
- MCP protocol details — `tools/list`, `tools/call`, resources, prompts
- Claude Code architecture — how is it different from the API?
- Skills + Connectors directory — distribution mechanics for third parties
- Anthropic's pricing model: input tokens, output tokens, cache hits, batch
- AAIF role — what does Anthropic contribute vs use?

### 6.3 Google DeepMind

Key questions:
- Gemini 2.5 Pro routing across Pro / Flash / Nano
- AlphaProof: how does theorem-proving connect to general reasoning?
- Project Astra: what's the unified agent architecture?
- AP2 (Agent Payments Protocol) — Google's role + protocol mechanics
- TPU pod allocation — how do products share underlying compute?
- Bard → Gemini → AI Mode in search — how does that pipeline work?

### 6.4 Meta

Key questions:
- Llama 4 release strategy: MoE architecture, expert routing
- AI Studio for businesses — what's the monetisation hook?
- Threads / Instagram / WhatsApp integration — how does AI infiltrate consumer products?
- Open-weight strategy vs OpenAI's closed approach — revenue implications

### 6.5 xAI

Key questions:
- Grok-4 architecture + Colossus 100K GPU training cluster economics
- X platform integration — what does Premium+ subscription get you AI-wise?
- Memphis datacentre — what's the build-out approach?

### 6.6 Mistral

Key questions:
- Le Chat product surface vs La Plateforme API
- Mixture-of-Experts routing in Mistral Large 3
- European data residency — how does this attract regulated buyers?

### 6.7 DeepSeek

Key questions:
- DeepSeek V3.2 MoE architecture — what's the expert count + activation pattern?
- R1 reasoning model — how does test-time compute get allocated?
- DeepSeek-Coder enterprise positioning — Chinese market entry
- $5M training cost claim — how much is real?

### 6.8 MiniMax / Hunyuan / StepFun

Key questions:
- M2.5 architecture
- HY3 MoE expert routing
- Tencent ecosystem integration
- Stepfun Step 3.5 Flash positioning
- China-specific monetisation models

### 6.9 Cohere

Key questions:
- Command-R+ enterprise positioning
- Embed + Rerank as the "everywhere SaaS" hook
- Partnership channel (Oracle, NVIDIA, Notion, etc.)

### 6.10 Perplexity

Key questions:
- Sonar architecture — how does search retrieval feed into reasoning?
- Comet browser strategy
- Pro / Enterprise / Education tier mechanics

### 6.11 Common patterns to extract

After researching all the above, Kimi should produce a "common nervous-system architecture" — the bits that EVERY major lab has:

1. **Model router** (multiple model sizes, route by query class)
2. **Inference gateway** (token counting, rate-limit, quota, billing)
3. **Observability stack** (Datadog/Honeycomb-style with model-specific dims)
4. **Learning loop** (production telemetry → eval set → retrain → deploy → A/B)
5. **Safety layer** (pre/post content filters, refusal policies, jailbreak detection)
6. **Distribution surface** (chat app + API + platform partners)
7. **Pricing engine** (per-token, per-call, per-seat, per-organisation)
8. **Provisioning workflow** (free → trial → paid → enterprise)

This common pattern becomes the basis of DELBOY MODE below.

---

# PART 7 — DELBOY MODE — the revenue nervous system

**Name:** DELBOY MODE (in homage to "this time next year we'll be millionaires")
**Purpose:** turn MEOK's reactive £0 state into an autonomous, sensing, learning, acting revenue system that runs 24/7 and compounds without Nick's per-step attention.

## 7.1 Sensors (what DELBOY watches)

| Sensor | Source | Frequency |
|---|---|---|
| Stripe events stream | Stripe API (webhook + polling) | real-time |
| PyPI downloads by package | pypistats API | hourly |
| GitHub stars + traffic by repo | GitHub API | hourly |
| meok.ai pageviews + bounce | Vercel Analytics + PostHog | hourly |
| Twitter mentions of @meok-ai-labs / "MEOK MCP" | Twitter API (or scraped) | hourly |
| HackerNews mentions | HN Algolia search | hourly |
| Reddit /r/LocalLLaMA, /r/MachineLearning, /r/programming mentions | Reddit API | hourly |
| Anthropic Registry traffic to MEOK MCPs | (if discoverable) | daily |
| Stripe payment-link click-through (UTM-tracked) | Vercel Analytics | hourly |
| Smithery / Glama / mcp.so MEOK MCP install counts | directory APIs | daily |
| Inbound emails to nicholas@meok.ai (regex compliance keywords) | Gmail (when scope fixed) | real-time |
| EU AI Act / DORA / NIS2 / CRA news + deadline shifts | RSS + EUR-Lex sync (already exists) | daily |

## 7.2 Signals (what events feed DELBOY)

- `new_paying_customer` — Stripe checkout completed
- `trial_started` — Pro signup without payment
- `churn_risk` — usage drop on Pro account
- `viral_moment` — sudden uptick on any sensor
- `compliance_deadline_24h` — EU/UK regulatory deadline in 24h
- `competitor_launch` — Anthropic / Stripe / Coinbase ship competing product
- `pricing_outlier` — competitor changes price beyond ±20%
- `nick_quiet` — no commits / no outreach in 24h (DELBOY nudges)

## 7.3 Inference (what decisions DELBOY makes)

- **Whom to email today?** Rank prospects by deadline proximity × purchase probability × deal size
- **What to post today?** Optimal hook based on this week's viral patterns
- **What MCP to ship next?** Highest unmet demand + lowest competitive density
- **What price to test?** Bayesian bandit across the 7 tiers
- **When to follow up?** Cold-email delivery time × open-rate model
- **Which channel matters most?** PyPI install rate vs GitHub stars vs HN votes per £ spent

## 7.4 Actuators (what DELBOY does autonomously)

| Action | Authority |
|---|---|
| Send email | **manual approve** (always) — DELBOY queues, Nick clicks |
| Tweet | **manual approve** — DELBOY drafts, Nick posts |
| Create Stripe coupon | **autonomous** (within bounds) |
| Adjust Stripe payment-link metadata for tracking | **autonomous** |
| Spin new MCP from research dossier | **manual approve** for now (PR-style) |
| Restart a broken cron / LaunchAgent | **autonomous** |
| Update PyPI README with new copy | **autonomous** (within MEOK repos) |
| Submit to MCP directories | **manual approve** |
| Refund a customer | **manual approve** |
| Email investor (when target hit) | **manual approve** |

## 7.5 Feedback loop (how DELBOY learns)

- Every action has an attached **expected outcome** (e.g. "this tweet should yield 2 £1 buys in 24h")
- Outcome measured → fed back as positive/negative signal
- Bayesian update on:
  - Per-hook copy effectiveness
  - Per-channel ROI (Twitter vs LinkedIn vs cold email vs Show HN)
  - Per-prospect-archetype response rate
  - Per-tier conversion rates
- After 4 weeks of data, hand-off the routing to the trained model
- Council vote required to materially change tier prices

## 7.6 Integration with SOV3 + MEOK

DELBOY MODE is a NEW MCP server running on port 3103 (free), with:

1. **`delboy.tick()`** — main loop, runs every 5 min
2. **`delboy.sense()`** — pull all sensor data, write to PostgreSQL
3. **`delboy.infer()`** — compute decisions
4. **`delboy.act()`** — execute actions (with auth boundaries above)
5. **`delboy.learn()`** — update Bayesian state from outcomes
6. **`delboy.report()`** — daily digest to Nick at 07:00 UK

Reuses:
- **SOV3 council** (port 3101) for material decisions (price changes, big sends)
- **Stripe MCP** for payment-link CRUD
- **GitHub MCP** for repo metric pull
- **Vercel MCP** for project metric pull
- **PyPI scraper** for download tracking
- **Resend / Buttondown** for email (when ready)

## 7.7 First 30-60-90 days

### Days 1-30 (June 2026)
**Goal:** DELBOY senses + reports. Zero autonomous actions yet. Build confidence.

- Wire all 12 sensors, write to PostgreSQL `delboy_signals` table
- Daily report at 07:00 UK to Nick: "Yesterday saw X PyPI installs, Y page views, Z mentions. Top opportunity: <prospect> deadline in <days>"
- All actuators are **queue-only** (write to `delboy_queue`, Nick approves each)
- Build the 4-week dataset for Bayesian training

### Days 31-60 (July 2026)
**Goal:** DELBOY infers + recommends. Trains on month-1 data.

- Bayesian models trained on month-1 signal → action → outcome data
- Daily report adds: "Recommended 5 actions today. Approve all (Y/N/edit)?"
- Council vote required on any cancel-everything-else recommendation
- Track recommendation acceptance rate (Nick's override rate)

### Days 61-90 (August 2026)
**Goal:** DELBOY acts (within bounds). Mid-Aug = Master Plan decision day.

- Autonomous actions enabled for: cron restart, README updates, Stripe coupon creation
- Manual-approve queue thinned (Nick spends 5 min/day instead of 60)
- 4-week effectiveness review on Aug 14: are decisions converging toward more revenue?
- **Aug 20 hard decision:** if MRR ≥ £1K, DELBOY runs the engine. If <£1K, pivot per MASTER_PLAN to Templeman Opticians focus.

## 7.8 Where DELBOY lives in the architecture

```
                         ┌─────────────────────┐
                         │   DELBOY MODE :3103 │
                         │   nervous system    │
                         └──────────┬──────────┘
                                    │
        ┌───────────────┬───────────┼───────────┬───────────────┐
        │               │           │           │               │
   ┌────▼────┐    ┌────▼────┐  ┌───▼────┐ ┌───▼────┐    ┌────▼────┐
   │ Stripe  │    │ GitHub  │  │ Vercel │ │ PyPI   │    │ Twitter │
   │  MCP    │    │  MCP    │  │  MCP   │ │ scrape │    │ scrape  │
   └─────────┘    └─────────┘  └────────┘ └────────┘    └─────────┘

                              feedback ↓ ↑ signals

                         ┌─────────────────────┐
                         │  SOV3 council :3101 │
                         │  (33-node BFT)      │
                         └─────────────────────┘
                                    │
                              decisions ↑

                         ┌─────────────────────┐
                         │  Postgres episode   │
                         │  + signals + queue  │
                         └─────────────────────┘
```

## 7.9 Success metric

**Single number:** **MRR at end of week 4 / MRR at start of week 1.**

If DELBOY can produce a 2× multiplier on whatever baseline MRR exists, it's working. If less, the cost of the system (Nick's attention + infra) doesn't justify it and we go back to manual.

---

# PART 8 — Kimi swarm research mandates

**For each of the 8 Parts above, a Kimi research agent should produce:**

1. **Gap analysis** — what's in MEOK vs what's missing vs what's industry best practice
2. **Action items** — concrete, ordered, time-estimated
3. **Acceptance criteria** — when can we mark it done
4. **Risks** — what could go wrong
5. **Citations** — every claim sourced to a primary doc

## Specific Kimi briefs

### Brief A: "Map every top-AI nervous system"
- **Inputs:** Part 6 list (OpenAI, Anthropic, DeepMind, Meta, xAI, Mistral, DeepSeek, MiniMax, Hunyuan, Cohere, Perplexity)
- **Output:** for each, a 1-page brief covering routing + observability + learning + monetisation + safety + distribution + pricing + workflow
- **Acceptance:** every claim cited to engineering blog / Sequoia / SemiAnalysis / Latent Space / arXiv / official docs (not just press releases)
- **Effort:** 12-20 hours research

### Brief B: "Find DELBOY analogues that already exist"
- **Inputs:** Part 7 spec
- **Output:** which OSS or SaaS systems already provide pieces (e.g. Clay for sensing, Common Room for inferring, n8n for actuating)
- **Acceptance:** for each DELBOY component, ranked OSS/SaaS alternative with cost
- **Effort:** 6-8 hours

### Brief C: "Audit MEOK protocol coverage"
- **Inputs:** Part 1.3 MCP fleet
- **Output:** Q3 2026 list of compliance regimes + agent protocols + identity standards we don't cover yet, ranked by addressable revenue
- **Acceptance:** at least 10 net-new MCP opportunities scored on deadline urgency × buyer density × MEOK build-difficulty
- **Effort:** 6-8 hours

### Brief D: "Build the SOV3 telemetry schema"
- **Inputs:** Part 2 mechanics + Part 5 pipelines
- **Output:** PostgreSQL schema for `delboy_signals` + `delboy_queue` + `delboy_outcomes`
- **Acceptance:** schema runs in psql without errors, includes all 12 sensors from 7.1
- **Effort:** 3-4 hours

### Brief E: "Verify the 5 neural nets are actually learning"
- **Inputs:** Part 2.4
- **Output:** training_samples count over time for each NN; if flat, root cause + fix
- **Acceptance:** at least 3 of 5 NNs show non-zero growth in samples over the last 14 days
- **Effort:** 4 hours

### Brief F: "Reproduce a top-AI nervous-system pattern at MEOK scale"
- **Inputs:** Brief A output
- **Output:** pick ONE pattern (e.g. OpenAI's model router) and write a MEOK-scale implementation spec
- **Acceptance:** implementable in ≤2 weeks by 1 engineer
- **Effort:** 4 hours

### Brief G: "DELBOY MODE MVP build plan"
- **Inputs:** Part 7
- **Output:** week-by-week 12-week build plan with concrete artifacts per week
- **Acceptance:** every week has a deployable artifact; week 12 has DELBOY fully autonomous within bounds
- **Effort:** 4-6 hours

### Brief H: "MASTER_PLAN Aug 20 readiness audit"
- **Inputs:** MASTER_PLAN_2026-05-20.md + this doc
- **Output:** week-by-week burndown to Aug 20 (£1K MRR or pivot)
- **Acceptance:** quantitative scoring of "are we on track" weekly checkpoint
- **Effort:** 3 hours

---

## Output convention for Kimi swarm

Every brief produces:
1. `revenue/KIMI_RESEARCH_<brief-letter>_<YYYY-MM-DD>.md` in this repo
2. JSON sidecar `revenue/KIMI_RESEARCH_<brief-letter>_<YYYY-MM-DD>.json` with structured findings
3. Push to GitHub for SOV3 to ingest into the council
4. Council vote on whether to act on each finding

---

## Where this doc lives

`/Users/nicholas/clawd/revenue/DELBOY_MODE_FULL_SYSTEM_CARTOGRAPHY_2026-05-28.md`

Update this doc whenever new sensors / signals / actuators added or whenever a Brief produces material change. Treat as the single source of truth for the nervous system.

---

## DELBOY's North Star

> Sense → Infer → Act → Learn → Compound.
>
> Boldness compounds; hesitation decays.
>
> *"This time next year, we'll be millionaires."* — and we will mean it because the system, not the founder, is the one putting in the per-minute work.

---

*End of cartography. Built 2026-05-28 by Claude (Opus 4.7) at Nick's direct ask. Re-run sections whenever the underlying system materially changes.*
