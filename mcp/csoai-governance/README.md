# CSOAI Governance MCP

An MCP client for the CSOAI governance API. Source availability, npm publication,
callable endpoints and independently used evidence are separate states.

## Source and release

This checkout declares `csoai-governance-mcp` version `0.1.1` and defaults to
`https://councilof.ai/api`. `CSOAI_GATEWAY` can select a compatible backend.
The retired `https://os.meok.ai/api` is not this source default.

The merged gateway repair does not itself publish npm or update an existing MCP
process. Check the published version before using the package:

```bash
npm view csoai-governance-mcp version
```

At the 2026-10-08 release audit, npm `latest` was still `0.1.0`, whose default
is the retired MEOK gateway. Its catalog call returned an explicit HTTP 404
error. Version `0.1.1` remains a source version until the release owner publishes
it. This change does not publish npm, restart clients or deploy any endpoint.

## Tool contracts

| Tool | Contract and limits |
|------|---------------------|
| `csoai_catalog` | Reads `/api/tools?q=…`. Returns matching probed server-tool rows: `total`, up to 25 displayed `matches`, and `showing`. An empty search stays empty. Catalog inventory and distinct tool names are not substitute matches. Non-OK or malformed responses return an explicit error. |
| `csoai_govern` | Sends a governance/cyber question to `/api/chat`. Model text is guidance, not a compliance finding, certification or measured GSPC result. Endpoint availability must be checked separately. |
| `csoai_verify` | Sends the supplied artifact, signature and public key to `/api/verify`. This client uses a network request; it does **not** verify offline. Signature validity alone does not establish issuer identity, independent use or Bitcoin anchoring. |
| `csoai_sign` | Requests `/api/sign`. The source reports sealing unavailable when that route returns 404. An advertised tool is not evidence that sealing is deployed; do not describe its output as anchored without separate proof. |

The published `/api/tools` contract defines `total` as `tools.length` after query
filtering. `catalogue_total` counts all probed server-tool rows;
`distinct_tools` is a separate set of names. Two implementations of one tool can
contribute two rows. This client neither combines those rows nor substitutes
unfiltered inventory when no row matches. The probe's own timestamp remains the
evidence date; fetching it later does not create a new measurement.

## Client setup

The npm setup below uses the **published** package, not an unmerged or unpublished
checkout. Confirm its version and gateway against the release note above first.

```json
{
  "mcpServers": {
    "csoai-governance": {
      "command": "npx",
      "args": ["-y", "csoai-governance-mcp"]
    }
  }
}
```

To review this source directly, install its existing dependencies in this
package directory and point a stdio client at its absolute `index.mjs` path.
The Council GSPC remote MCP is a separate entry point:
`https://councilof.ai/mcp`. Its board, verification and paid evidence contracts
must be inspected independently; they are not the four governance tools above.

## Read-only regression check

From the repository root:

```bash
npx vitest run scripts/governance-catalog.test.mjs
```

The suite uses synthetic controls and a retained public zero-match JSON
response. It does not contact a gateway, request a signature, pay, or call a
model. `smoke.mjs` exercises several live tools, including signing and model
queries; it is not the read-only regression command.

Source references: [`/api/tools` handler](../../functions/api/tools.ts),
[merged gateway repair #2922](https://github.com/CSOAI-ORG/councilof-ai/pull/2922),
[npm package metadata](https://registry.npmjs.org/csoai-governance-mcp).
