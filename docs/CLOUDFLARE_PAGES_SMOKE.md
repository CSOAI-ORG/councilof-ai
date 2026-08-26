# Cloudflare Pages — production smoke checklist

**NEXT_300 #371** · ops note · branch work ≠ prod until owner merge (#130, #370)

Binding: `docs/PRODUCTION_CHECKLIST.md` · deploy target: **councilof-ai** Pages project.

## Pre-deploy

```bash
npm run build:client          # honesty lints run in build:client chain
npm run test:pre-deploy       # no uncaught JS on critical routes
```

## Deploy

```bash
cd client && npm run build
npx wrangler pages deploy dist/client --project-name councilof-ai
```

Required env on Pages: `AGUI_WIRE_URL` (lobby Lane 2), `SOV_ARENA_STATE` KV binding — see `docs/PRODUCTION_CHECKLIST.md`.

## Post-deploy smoke (curl)

```bash
BASE=https://councilof.ai

# Core MEASURED board
curl -sS "$BASE/api/gspc" | jq '.axes | length'

# UNMEASURED indices honesty (404 on prod until master merge is OK)
curl -sS "$BASE/api/indices" | jq '.indices[]? | {slug, status, measured_score}'

# HO.2 surfaces
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/products"
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/indices"
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/powered-by"
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/gspc-verify"

# Schema + agent card
curl -sS "$BASE/.well-known/agent-card.json" | jq '.tools | length'
curl -sS "$BASE/.well-known/schemas/agent-measurement-card.schema.json" | jq '.title'

# Oracle fleet — infra status only (not a grade oracle)
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/api/oracle-fleet"
```

## SPA route smoke (expect 200 + JS bundle)

`/engine-axis` · `/instruments` · `/dashboard` · `/compare` · `/battlecards` · `/payg` · `/pricing`

## Rollback

If App truncate or bad deploy: `docs/ROLLBACK_PLAN.md` (move #372). Re-deploy previous Pages build from dashboard or prior `wrangler pages deploy` artifact.

## Honesty checks after smoke

```bash
npm run lint:stripe-grade
npm run lint:demo-play
npm run lint:jmwh
npm run lint:aum
npm run lint:value-ledger
```

Indices on prod must stay **UNMEASURED** (`measured_score: null`) until INDEX-METHOD bank freeze — never invent labour/AUM scores in smoke scripts.
