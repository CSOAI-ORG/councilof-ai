# meok-council-worker
Cloudflare Worker — public substrate for SOV3 Council Globe

## What it does
Exposes the internal meok-api VM (behind firewall) as a public, cacheable, rate-limited
API surface at `council.meok.ai` and `api.meok.ai`. The VM's private IP never appears
in public DNS; only the Worker's `*.workers.dev` address does.

## Routes
| Public Path | Upstream (internal VM) | Notes |
|------------|------------------------|-------|
| `GET /council/*` | `http://VM:3200/council/*` | Public, 30s cache |
| `GET /mcp/*` | `http://VM:3200/mcp/*` | Public, 30s cache |
| `GET /compliance/*` | `http://VM:3200/compliance/*` | Public, 30s cache |
| `GET /attestation/*` | `http://VM:3200/attestation/*` | Public, 30s cache |
| `GET /health` | `http://VM:3200/health` | Public, no cache |

POST requests are passed through immediately (no cache, no rewrite).

## CORS
All responses include `Access-Control-Allow-Origin: *` — council pages are public-readable.

## Cache
- Public GET responses: `max-age=30, stale-while-revalidate=60`
- SIGIL-signed canonical chain is the source of truth, not the live read
- Cache key is full URL (method + path + query)

## Rate Limiting
Set in Cloudflare Dashboard > Traffic > Rate Limiting:
- 60 req/min per IP
- Action: Simulate (test) → Challenge (production)

## Deployment
```bash
# 1. Authenticate
wrangler login

# 2. Set the internal backend secret
wrangler secret put INTERNAL_BACKEND --env production
# When prompted, enter: http://<VM_PRIVATE_IP>:3200

# 3. Deploy
wrangler deploy --env production

# 4. DNS (main session handles)
# CNAME council.meok.ai → $WORKER_SUBDOMAIN.$ACCOUNT.workers.dev

# 5. Vercel env (main session handles)
# NEXT_PUBLIC_COUNCIL_SUBSTRATE=https://api.meok.ai
```

## Architecture
```
Public Request (council.meok.ai/council/votes)
       │
       ▼
  Cloudflare Worker (meok-council-worker)
       │
       ├── Cache (30s stale-while-revalidate)
       │
       ▼
  Internal VM: meok-api :3200  (private IP, never exposed)
       │
       ▼
  SIGIL-signed responses + HMAC attestations
```

## Globe Spec Alignment
- 13 compliance-framework toggles in Globe.tsx map 1:1 to MCP server names exposed via `/mcp/*`
- When the Worker is live, Globe fetches `/mcp/eu-ai-act-compliance-mcp` and gets live values
- Fallback: if Worker is down, Globe shows last-known values (graceful degradation)
- No code change in Globe.tsx when Worker goes live — only the fetch base URL changes

## Worker Subdomain Decision
**Use `council.meok.ai`** (not `api.meok.ai`) for the public-facing domain:
- `api.meok.ai` stays as the sovereign-data zone (used for auth, payments, user data)
- `council.meok.ai` is the public-read compliance surface — separate concerns, cleaner isolation
- Both point to the same Worker (same internal backend, different public URLs)

## Coordinate with main session
- **main (mvs_58bbb...)**: DNS CNAME + Vercel env update
- **OPENMOE (this)**: Worker code + deployment secrets