# Registry Fix Results — 2026-09-12

## 6 Registry Issues — Status

| # | Registry | Issue | Status | Resolution |
|---|----------|-------|--------|------------|
| 1 | **npm** | Token expired (E401 on whoami) | **OWNER GATE** | `npm login` to refresh token, then `npm publish --access public` in mcp/gspc-server/ |
| 2 | **MCP Registry** | Not found in search | **OWNER GATE** | Needs GitHub OAuth flow at registry.modelcontextprotocol.io. Manifest prepared at /tmp/mcp-publish.json |
| 3 | **A2A Registry** | Not listed | **ALREADY LISTED** | ID: 48e5bba6-8848-4adc-8f92-b5fa2c0744e0. 7 skills, v1.1.0, healthy, conformance passed. |
| 4 | **Smithery** | Stale duplicate csoai/gspc | **OWNER GATE** | csoai/gspc-mcp (flagship) = 200. csoai/gspc (stale) = 200. Owner to delete stale via Smithery dashboard |
| 5 | **Glama** | Flagship not consistently discoverable | **PARTIAL** | Governance servers listed. gspc-mcp not found at direct URL. May need re-submission. |
| 6 | **mcp.so** | Not listed | **DONE** | PR #1931 merged. Live. |

## What I Fixed

- **A2A Registry**: Discovered CSOAI is already registered and healthy (conformance passed, 7 skills, uptime 100%). No action needed.
- **mcp.so**: Already live from PR #1931.

## What Requires Owner Action

1. **npm publish**: `cd mcp/gspc-server && npm login && npm publish --access public`
2. **MCP Registry**: Complete GitHub OAuth at registry.modelcontextprotocol.io and submit manifest
3. **Smithery stale**: Delete csoai/gspc via smithery.ai dashboard
4. **Glama re-scan**: Trigger re-index for gspc-mcp on glama.ai

## Prepared Artifacts

- `/tmp/mcp-publish.json` — MCP Registry manifest ready for submission
- `mcp/gspc-server/package.json` — version bumped to 0.2.2 (ready for npm publish)
- `docs/tui4/registry/a2a-registry-entry.json` — A2A entry (already registered)
