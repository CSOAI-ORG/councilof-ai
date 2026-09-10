# MCP HTTP protocol contract

The Pages `/mcp` implementation uses the published official MCP server SDK
`2.0.0`, pinned in the root lockfile. The test client is separately pinned to
`2.0.0`. This replaces mutable, module-global wire-version negotiation with an
SDK server instance for each request. It does not deploy the service or publish
the npm implementation or a registry entry.

## Protocol and identity

- HTTP runtime identity: `csoai-gspc-mcp`, version `1.4.2`. The registry source
  descriptor carries this HTTP version; the npm package has its own release.
- Modern `2026-07-28` clients use `server/discover` and namespaced per-request
  `_meta`. The discovery response describes the modern protocol era.
- Legacy Streamable HTTP remains available through the SDK stateless adapter.
  Tests prove `2025-03-26` initialize, list and call with a real SDK client.
  A request-scoped SSE response is permitted; no persistent session is required.
- Do not infer support for `2024-11-05` HTTP+SSE or every AI platform from these
  tests. The plain GET document is installation information, not MCP discovery.
- Eight free and four paid tools come from the existing two JSON catalogs. The
  historical `verify` alias remains callable but unlisted. `witness_hash` stays
  unadvertised and unsupported. Input validation uses the SDK's no-eval
  Cloudflare JSON Schema adapter, preserving the existing schema authority.

## Mount controls

Host and browser Origin checks run before dispatch. The allowlist covers the
Council domains, local development, ChatGPT/Claude browser origins, and only
the exact configured `CF_PAGES_URL` preview. A server client without Origin is
allowed. These checks are not authentication and do not grant payment authority.

Modern requests must supply the protocol-version, method, and (for tools) name
headers matching their body. Published SDK `2.0.0` accepts a modern body without
`MCP-Protocol-Version`; a local guard closes that observed gap. Do not copy an
option from GitHub main without checking that the locked package implements it.

The mount requires JSON, one valid JSON-RPC envelope, and a request ID for
tool calls. It bounds the actual streamed body to 28 MiB and ten seconds,
including undeclared or understated lengths, and does not await a hostile
cancellation promise. The cap allows the existing 20 MiB base64 artifact path.
It rejects malformed UTF-8, batches, and invalid IDs before dispatch. A local
workerd test accepted a 27,962,302-byte JSON request containing a synthetic
20 MiB artifact and correctly rejected its invalid preview type before tool
dispatch. This tests parsing/validation, not large paid-deliverable completion
or a concurrent-upload capacity guarantee. Load qualification remains separate.

POST responses are HTTP `no-store`, including paid payloads and caller-supplied
verification inputs. Modern discovery/list responses additionally carry public
protocol cache hints; tool results do not invent them. GET/HEAD installation
metadata remains publicly cacheable; HEAD is bodyless. Streaming GET is not
supported in stateless mode. Unknown methods are not forwarded to a fallback.

Payment remains the explicit `x_payment` tool argument. The paid adapter forwards
it once to the fixed same-origin route. A payment challenge is not settlement,
delivery or revenue. Transport failures do not prove that nothing was charged:
delivery and settlement are reported as unknown and callers must reconcile the
receipt before retrying. No test purchases are made by this contract suite.

## Verification and release

`mcp-protocol-contract.yml` runs all three MCP suites and a strict isolated
handler typecheck without production probes or stored credentials. Tests include
official modern and legacy clients, concurrent cross-era isolation, paid
argument validation, cache separation and bounded hostile streams. All business
fetches are mocked. These are transport and behavior tests, not independent
customer adoption or proof of a completed external purchase.

A minimal local Wrangler 4.130.0 Pages/workerd fixture also passed ten HTTP
checks, including parallel modern/legacy requests. That confirms edge-runtime
compatibility for this mount; it is not the full site build or production smoke.
Normal release gates and exact deployed-byte checks are still required.

The fabric status probe, browser tool runner and door probes, capability drift
guard, and Hugging Face tool-count reader must use matching modern metadata and
headers. Merely adding SSE to Accept leaves JSON-only consumers unable to read a
legacy response. Handler-backed tests exercise these internal callers; protocol
unit tests alone do not establish end-to-end compatibility.

The experimental MCP server-card proposal remains separate and withheld. Its
producer must match tested runtime identity and protocol behavior before any
discovery card advertises this implementation.

References: [MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28),
[official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk),
[Streamable HTTP requirements](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).
