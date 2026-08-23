# OpenRouter parity map — Council of AI

OpenRouter is closed SaaS. This map shows **their product flows**, **what we already ship**, **what OSS can accelerate**, and **what only we can add** (measurement, Eunomia, honest registers).

## Layer model

| Layer | OpenRouter | Council equivalent | Status |
|-------|------------|-------------------|--------|
| Public marketing + SEO | openrouter.ai | councilof.ai estate | SHIPPED (large) |
| Model catalog / rankings | Models tab, filters, pricing | `/models` + MeasurementHub + Council OS `models` pane | PARTIAL — GSPC columns live; gateway catalog optional via LiteLLM |
| Route catalog | Provider routing table | `/instruments` Eunomia (291 MCP routes) | SHIPPED |
| Playground / chat | Per-model try, streaming | Council OS dock + `/api/chat` + AG-UI wire | PARTIAL — grounded first; live via SOV_GATE or LiteLLM |
| Compare / arena | Side-by-side blind compare | `/gspc-arena`, openrouter-studio pattern | PARTIAL — board/HvAI; full arena UX not forked |
| API keys + billing | Dashboard, credits, invoices | Dashboard software area | GAP — LiteLLM/RouterX spike for self-hosted keys |
| Admin SaaS | Provider health, spend | LiteLLM `/ui` or RouterX console | SPIKE — `ops/litellm/` |
| Downstream proof | None on-router | Arena harness, receipt-spec, GET /api/gspc | SHIPPED (differentiation) |

## User flow mapping

### 1. Discover models

| OpenRouter step | Our route / surface | Notes |
|-----------------|---------------------|-------|
| Browse all models | `/models` → **Rankings** tab (`ModelsRankings`) | Rows from GET /api/gspc leaders — separated / ties / point leads |
| Filter by provider | LiteLLM `GET /v1/models` when `VITE_LITELLM_PROXY_URL` set | Optional gateway catalog tab |
| Model detail page | `/instrument/:slug` pattern for Eunomia; GSPC via Council OS **Try** | OpenRouter-shaped CTAs on `InstrumentDetail` |
| Leaderboard | Council OS **board** pane, `/gspc-scoreboard` | McNemar-separated leads, not vanity wins |

### 2. Try a model (playground)

| OpenRouter step | Our route / surface | Notes |
|-----------------|---------------------|-------|
| Open playground | Council OS (`openLobby({ pane: "models" })`) | Centre workspace + chat dock |
| Send prompt | AG-UI SSE → `/api/agui` when `AGUI_WIRE_URL` wired | Else POST `/api/chat` |
| Streaming | `useLobbyChat` AG-UI lane | LiteLLM streaming via proxy (future) |
| Pick MCP tool | Council OS **tools** pane | Eunomia cards — no OpenRouter equivalent |

### 3. Get API access

| OpenRouter step | Our route / surface | Notes |
|-----------------|---------------------|-------|
| Create API key | LiteLLM admin `/ui` (self-hosted spike) | Not on public councilof.ai yet |
| OpenAI-compatible endpoint | `LITELLM_PROXY_URL` + `/v1/chat/completions` | See `ops/litellm/README.md` |
| Per-model routing | Eunomia URI on `/instruments` | Governance routes, not LLM providers |

### 4. Routes / providers (their core SaaS)

| OpenRouter step | Our route / surface | Notes |
|-----------------|---------------------|-------|
| Provider list | `/instruments`, Council OS **routes** pane | `RoutesRankings` |
| Route detail | `/instruments/:id` | Compare \| Playground \| MCP \| AG-UI |
| Fallback / health | LiteLLM proxy (spike) | Arena harness thesis: prove routing downstream |

### 5. Account / software dashboard

| OpenRouter step | Our route / surface | Notes |
|-----------------|---------------------|-------|
| Usage dashboard | `/dashboard` | Measurement hub embed |
| Software measurement | `/dashboard/measurement` | Board / models / routes parity |
| Local play gallery | Council OS **play** pane | Honest “opens page” vs “in build” |

## What we add that OpenRouter cannot copy without our data

1. **GSPC board** — GET /api/gspc, Ed25519-signed cells, SEPARATED vs TIE honesty
2. **Eunomia** — MCP routing table for governance instruments, not model markup
3. **Honest registers** — MEASURED / REPORTED / DESIGN chips on every surface
4. **Arena harness** — downstream eval of prompts that passed any router
5. **Receipt-spec** — signed route receipts (proofof.ai lane)

## OSS accelerators (fork vs build)

| Need | Recommended OSS | Use in Council |
|------|-----------------|----------------|
| API gateway + keys + admin | [LiteLLM](https://github.com/BerriAI/litellm) | `ops/litellm/` — self-hosted OpenRouter API |
| Billing-shaped admin | [RouterX](https://github.com/dbcopper/RouterX) | Phase 2 if LiteLLM admin insufficient |
| Playground UI fork | [ai-playground](https://github.com/Worth-Doing/ai-playground) | Borrow compare-lab patterns; keep GSPC columns |
| Model picker widget | [openrouter-model-picker](https://github.com/dannyshmueli/openrouter-model-picker) | Drop into Council OS composer |
| Full “host OpenRouter site” | [llmrooter/router](https://github.com/llmrooter/router) | Alternative if we want Go + React admin wholesale |

## Build order (all three spikes)

1. **Parity map** (this doc) — align product language and gaps
2. **LiteLLM spike** — `ops/litellm/` + `LITELLM_PROXY_URL` on `/api/chat` live lane
3. **Models explorer** — `/models` tabs: By axis \| Rankings \| Gateway catalog (when proxy URL set)

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `LITELLM_PROXY_URL` | Cloudflare Pages / Worker | Server-side OpenAI-compatible proxy for live chat |
| `LITELLM_MASTER_KEY` | Cloudflare (secret) | Virtual key for proxy auth |
| `VITE_LITELLM_PROXY_URL` | Client build | Optional public catalog `GET /v1/models` |
| `AGUI_WIRE_URL` | Cloudflare | AG-UI streaming (RunPod :8785) |
| `SOV_GATE_URL` / `SOV_GATE_TOKEN` | Cloudflare | Existing specialist GPU gate |

## Still GAP after these three spikes

- Unified billing UI on councilof.ai (use LiteLLM admin or Stripe Connect later)
- Blind arena mode (fork openrouter-studio or build in Coliseum)
- Production merge to `master` + Cloudflare deploy (branch `cursor/instruments-catalog-7fb8`)
- Provider marketplace deals (commercial, not code)
