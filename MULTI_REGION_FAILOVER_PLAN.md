# Multi-region failover — Move #15

## Goal

Aussie fleet auditor at 3 am UK time must not see 502s. EU regulator inspecting an attestation
during peak EU hours must not wait on UK-Vercel cold start. US logistics SaaS embedding our
verifier must not pay trans-Atlantic latency every call.

Target: **3 active regions, sub-200ms p95 from primary user clusters in each.**

## Topology

```
                                ┌── meok-attestation-api ───────────────┐
                                │                                       │
   ▲ Vercel Edge (global)       │   eu-west-2 (London, primary)         │
   │  ──────────────────────►   │   us-east-1 (Washington DC, US)       │
   │  ◄────────────────────────  │   ap-southeast-2 (Sydney, AU + APAC) │
                                │                                       │
                                └───────────────────────────────────────┘
                                         │
                              ┌──────────┴──────────┐
                              │  Upstash Redis      │  ← global replication
                              │  (eu-west-2 primary)│      eventual consistency
                              │  read replicas in   │      (audit ledger + webhook records)
                              │  iad + syd          │
                              └─────────────────────┘
```

## Implementation steps

### 1. Vercel — convert serverless function to Edge runtime

Currently: Python `BaseHTTPRequestHandler` in `api/index.py` runs as a Node-shim serverless
function, single-region (LHR1).

Convert hot-path endpoints (`/verify`, `/health`, `/openapi.json`, `/docs`) to **Edge functions**
that pin to `regions: ["lhr1", "iad1", "syd1"]`.

Sign/provision/webhook stay on Python serverless (need crypto + Stripe SDK).

```jsonc
// vercel.json
{
  "functions": {
    "api/verify-edge.ts": { "runtime": "edge", "regions": ["lhr1", "iad1", "syd1"] }
  }
}
```

### 2. Upstash Redis — global replication

Upgrade `audit_ledger` + `webhook` storage from single-region Upstash to **Upstash Global Database**:

- Writes → primary region (London)
- Reads → nearest replica (DC, Sydney)
- Eventual consistency: ~50ms lag

Cost: ~£15/mo for global tier vs £0 hobby.

### 3. Status page (Move #17)

Add separate uptime monitors per region:

- `https://meok-attestation-api.vercel.app/health` (Vercel-global)
- `https://meok-attestation-api-iad.vercel.app/health` (US deploy alias)
- `https://meok-attestation-api-syd.vercel.app/health` (AU deploy alias)

Better Stack pings each every 60s; SLA report covers per-region.

### 4. Geo-detection for the haulage.app SPA

Vercel Edge config detects request region via `x-vercel-ip-country` header.
Rewrite SPA to set `localStorage.meok_region` on first load + display localised pricing (Move #24
PPP rows) + show region badge.

```ts
// middleware.ts (Vercel Edge Middleware)
export function middleware(request: Request) {
  const country = request.headers.get("x-vercel-ip-country") ?? "GB";
  const response = NextResponse.next();
  response.cookies.set("meok_region", country, { path: "/" });
  return response;
}
```

### 5. Database backups

- Upstash daily snapshots → S3 (Vercel Blob)
- Audit-ledger HMAC chain re-validates on read; any corruption surfaces via `chain_intact: false`

### 6. Failover runbook

- **Primary (London) down:** Vercel automatically routes to next-closest region. Upstash read-replicas
  serve cached audit + webhook data. **Writes pause** until London recovers (within ~5 min) —
  sign + subscribe endpoints return 503; verify keeps working off cache.
- **Catastrophic (Vercel global outage):** dust off the Cloudflare Workers backup we'll build in
  follow-up (deploys same Edge handlers; same Upstash Global as backend).

### 7. SLO definitions (post-multi-region)

| Endpoint | p50 | p95 | p99 | Monthly uptime |
|---|---|---|---|---|
| `/health` | <50ms | <100ms | <200ms | 99.99% |
| `/verify` | <80ms | <200ms | <400ms | 99.95% |
| `/sign` | <120ms | <300ms | <600ms | 99.9% |
| `/api/audit` | <100ms | <250ms | <500ms | 99.9% |

## Cost envelope

| Item | Monthly |
|---|---|
| Vercel Pro (multi-region Edge) | $20 |
| Upstash Global Redis | $15 |
| Better Stack status + monitors | $25 |
| **Total uplift** | **~£50/mo** |

For 99.95% verify SLA across 3 regions, this is far cheaper than the alternative (own Postgres
clusters, own load balancers, own incident-response engineer).

## Implementation order

1. Vercel Pro upgrade (5 min)
2. Convert `/verify` + `/health` to Edge runtime (1 day)
3. Upgrade Upstash to Global (15 min)
4. Add region monitors to Better Stack (15 min)
5. Add geo-detection middleware (1 day)
6. Write the failover runbook (½ day)
7. Run a chaos-test: shut down London region in Vercel, confirm reads continue from US/AU
