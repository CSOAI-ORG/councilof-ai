# OAuth 2.1 + RFC 8707 + CIMD — build vs buy spike (2026-06-07)

Per research finding #6: MCP standardised on OAuth 2.1 + RFC 8707 Resource Indicators + CIMD (Client ID Metadata Documents). We need this on `meok-attestation-api` so a customer signs in once on the web dashboard and the same identity authorizes their locally-installed MCP server.

## Vendor matrix

| Vendor | Pricing (MEOK scale) | OAuth 2.1 ✓ | RFC 8707 ✓ | CIMD ✓ | Streamable HTTP ✓ | Notes |
|---|---|---|---|---|---|---|
| **WorkOS** | $125/mo (1k MAU) + $0.05/MAU | ✅ Full | ✅ | ✅ | ✅ Native MCP support | Has explicit MCP docs ("AuthKit for MCP"). Strong choice. |
| **Auth0** (Okta) | ~$240/mo (1k MAU) Pro | ✅ | ✅ | Partial | Via Actions | Industry standard. Pricier. |
| **Clerk** | $25/mo + $0.02/MAU after 10k | ✅ | ❓ | ❓ | Via webhooks | Dev-friendly. MCP integration newer. |
| **Stytch** | $99/mo (5k MAU) Growth | ✅ | ✅ | ✅ | ✅ Has MCP guide | M2M flows strong. |
| **Logto** | Free self-host or $16/mo cloud | ✅ | ✅ | Roadmap | Manual | Open-source. Cheaper but more glue. |
| **Self-host (Hydra, Keycloak, Authentik)** | $0 + ops | ✅ | ✅ | Manual | Manual | Time + ops cost > vendor pricing at MEOK scale. |

## Recommended path

**WorkOS** — for these reasons:

1. **Explicit MCP support.** Their AuthKit docs cover OAuth 2.1 + Resource Indicators + CIMD specifically for MCP servers as Resource Servers. We avoid reinventing.
2. **Pricing fits.** $125/mo flat at our scale; predictable.
3. **Token-on-checkout flow** maps cleanly. Stripe webhook → WorkOS user create + WorkOS-issued OAuth client.
4. **Single identity primitive** for the SaaS dashboard (haulage.app), the locally-installed MCPs (each acts as OAuth resource server), and downstream third-party agent runtimes (Claude/ChatGPT/Copilot/Goose) acting as OAuth clients.
5. **Migration off** is straightforward if needed (export users + tokens, swap provider).

## 7-day implementation plan

### Day 1 — WorkOS setup
- Create WorkOS account (free tier allows full integration test)
- Configure Organization for MEOK
- Add `https://meok-attestation-api.vercel.app` as Resource Server
- Add `https://haulage.app/auth/callback` as redirect URI

### Day 2-3 — meok-attestation-api integration
- New `/oauth/authorize` + `/oauth/token` Python handlers in api/index.py
- Validate WorkOS-issued tokens via JWKS
- Enforce RFC 8707 Resource Indicator validation
- Map WorkOS user-id → MEOK derived API key (deterministic HMAC of user-id + tier)

### Day 4 — haulage.app dashboard sign-in
- Add `/auth/signin` route — kicks WorkOS hosted login
- Add `/auth/callback` route — exchanges code for token, sets HttpOnly cookie
- `/dashboard` route gated on cookie

### Day 5 — Stripe webhook → WorkOS user provision
- `checkout.session.completed` → POST to WorkOS User create
- Email = Stripe email; tier from price-id metadata
- Set custom claim `meok_tier: pro|starter|fleet|free`

### Day 6 — Per-tool scope grants
- WorkOS OAuth consent screen lists per-MCP scopes (`tacho.read`, `tacho.sign`, `bs7121.read`, etc.)
- Tokens carry scope; MCP server enforces

### Day 7 — Migration + cutover
- Existing customers: derive WorkOS user from current Stripe email
- Backward-compat: derived API keys still work for 90-day deprecation window
- Update CLI + SDKs to prefer OAuth flow over raw API key

## Cost envelope

- **WorkOS**: $125/mo at launch
- **Dev time**: 7 days (one engineer; can compress with WorkOS templates)
- **Stripe integration glue**: existing webhook handler — minor extension

## What we lose if we don't ship this

Per finding #6, the MCP spec (2025-11-25) requires OAuth 2.1 + RFC 8707 (MUST). Without this:
- Customers can't use MEOK MCPs via Claude/ChatGPT/Copilot OAuth flows
- Each MCP install requires manual API-key copy-paste (high-friction onboarding)
- No per-MCP scope granularity (customers granted "all or nothing" — bad for procurement)
- We're out of step with the spec; reduces credibility with enterprise procurement

## Decision

**Recommendation:** spike WorkOS in Day 1-2 (free tier), validate the MCP integration works as documented. If it does (high confidence given their explicit MCP support), commit. If it doesn't, fall back to Stytch or Logto.

## Open questions to clear before commit

1. Does WorkOS' MCP-as-Resource-Server flow work with our existing Python `BaseHTTPRequestHandler` API, or does it require FastAPI/Starlette?
2. How does WorkOS handle the **CIMD vs DCR** migration — do existing dynamic clients keep working during cutover?
3. What's the max-token-lifetime + refresh-token strategy for long-running MCP server installs?

Email Nick to authorise the spike + WorkOS account creation.
