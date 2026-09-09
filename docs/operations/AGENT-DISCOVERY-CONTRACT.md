# Public agent discovery contract

The homepage's `Link: <https://councilof.ai/.well-known/api-catalog>; rel="api-catalog"`
points to an extensionless Pages Function. It returns an RFC 9727 JSON Linkset:

| API entry point | Existing description |
| --- | --- |
| `/api/gspc` | `/api/openapi.json` |
| `/mcp` | `/.well-known/mcp/server-card.json` |
| `/api/a2a` | `/.well-known/agent-card.json` |
| `/api/x402` | `/openapi.json`, with `/.well-known/x402.json` as service metadata |

This lists four API entry points, not four new products. The referenced contracts remain
responsible for operations, input schemas, prices and availability. Discovery does not
prove a purchase, deployment, signature, Bitcoin timestamp or regulatory outcome.

## Routing and identity

- GET returns `application/linkset+json` with the RFC 9727 profile. HEAD returns the same
  headers without a body. OPTIONS is empty; unsupported verbs return JSON 405.
- Catalog URLs use the canonical public origin and never reflect request credentials,
  query strings or an arbitrary host. Serving the catalog invokes no downstream service.
- The catalog is a Function, not an invented static `api-catalog.json` alias or SPA page.
  Its own handler supplies cache, CORS and nosniff headers. Static `_headers` adds only
  the homepage discovery Link and exact-path browser CORS for the public MCP server card.
- This patch does not replace the existing legacy MCP card or change the MCP runtime.
  The RFC 9727 catalog is generic API discovery, not an implementation of the separate,
  experimental MCP AI Catalog discovery proposal. Browser-readable JSON alone does not
  establish MCP protocol conformance or approval by any AI platform.

## Withheld MCP follow-up

A proposed experimental MCP card was held during independent review: the runtime declares
`2026-07-28`, but gates `server/discover` behind legacy initialization and uses module-global
wire state. The current protocol requires request-scoped negotiation; merely copying a
version constant into a card would propagate an unproven interoperability claim.
Nor is `2024-11-05` a proven fallback for a `streamable-http` declaration: Streamable HTTP
was introduced in `2025-03-26`.

Before that separate follow-up is released, test an official client against the complete
transport, correct request metadata and response envelopes, resolve the card/runtime
identity distinction, and implement the experimental AI Catalog/media/CORS contract if
advertising that extension. Do not add a `supportedProtocolVersions` list until tested.

## Offline checks

```sh
npx --no-install vitest run functions/.well-known/api-catalog.test.ts --maxWorkers=1 --minWorkers=1
npx --no-install tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext --moduleResolution bundler functions/.well-known/api-catalog.ts
```

The path-scoped `agent-discovery-contract` workflow runs on pull requests to any base,
including stacked candidates. It needs no production credentials, payments or live
self-probes. This does not replace full release gates or compiled Pages-route tests.

After an approved deployment, check the actual public catalog/card bytes and headers
with normal anonymous clients. A local pass is not a promise that an external scanner
will pass: zone security rules, deployed revision and scanner implementations are
separate observations. Do not weaken authentication, bot policy or payment verification
to improve a scanner score.

Sources: [RFC 9727](https://datatracker.ietf.org/doc/html/rfc9727),
[experimental MCP server card](https://github.com/modelcontextprotocol/ext-server-card),
[MCP server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover),
[MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http),
[Pages routing](https://developers.cloudflare.com/pages/functions/routing/).
