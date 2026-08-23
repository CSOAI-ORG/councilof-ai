/**
 * LiteLLM spike — self-hosted OpenRouter API layer

OpenRouter's product is closed. [LiteLLM](https://github.com/BerriAI/litellm) is the usual open-source substitute: one OpenAI-compatible endpoint, virtual keys, model list, and an admin UI at `/ui`.

Council uses this as the **routing toll road** layer. Measurement (GSPC), Eunomia MCP routes, and arena proof stay on councilof.ai.

## Quick start (local)

```bash
cd ops/litellm
export LITELLM_MASTER_KEY=sk-council-local-dev
export OPENAI_API_KEY=sk-...   # optional — add models you have keys for
docker compose up -d
```

- **API:** `http://127.0.0.1:4000/v1/chat/completions`
- **Models:** `http://127.0.0.1:4000/v1/models`
- **Admin UI:** `http://127.0.0.1:4000/ui`

Test:

```bash
curl http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"ping"}]}'
```

## Wire Council of AI

### Server (Cloudflare Pages functions)

Set secrets on the Pages project:

| Secret | Example |
|--------|---------|
| `LITELLM_PROXY_URL` | `https://your-litellm.example.com` |
| `LITELLM_MASTER_KEY` | virtual key from LiteLLM admin |

`functions/api/chat.ts` uses these on the **live** lane (after grounded handlers miss, alongside `SOV_GATE_URL`). Priority: SOV_GATE → LiteLLM → grounded → refuse.

### Client (optional gateway catalog on `/models`)

Build-time env:

```
VITE_LITELLM_PROXY_URL=http://127.0.0.1:4000
VITE_LITELLM_MASTER_KEY=sk-council-local-dev
```

The **Gateway catalog** tab on `/models` calls `GET /v1/models` and overlays GSPC separated-lead counts when model IDs match board leaders.

**Do not** commit real keys. Use `.env.local` for dev only.

## What this does not replace

- Council OS workspace UX (we own that)
- GET /api/gspc measurement board
- Eunomia `/instruments` governance routing
- AG-UI wire (`AGUI_WIRE_URL`) for MCP + HITL chat

See [docs/OPENROUTER-PARITY-MAP.md](../docs/OPENROUTER-PARITY-MAP.md) for the full flow map.
