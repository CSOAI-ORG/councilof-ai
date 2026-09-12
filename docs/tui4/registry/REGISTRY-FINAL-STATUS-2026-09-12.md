# Registry Fix — Final Status (2026-09-12)

## 6 Registry Issues — Resolution

| # | Registry | Status | Resolution |
|---|----------|--------|------------|
| 1 | **npm** | OWNER GATE | Token expired (E401). `npm login` + `npm publish --access public` in mcp/gspc-server/ |
| 2 | **MCP Registry** | OWNER GATE | Needs `mcp-publisher login github` (device OAuth). CLI installed (v0.4.2). |
| 3 | **A2A Registry** | **ALREADY LIVE** | ID: 48e5bba6-8848-4adc-8f92-b5fa2c0744e0. 7 skills, v1.1.0, healthy, conformance passed. |
| 4 | **Smithery** | OWNER GATE | GitHub OAuth denied (idp_access_denied). Owner to authorize Smithery app. |
| 5 | **Glama** | PENDING | Governance servers listed. Flagship gspc-mcp needs re-submission. |
| 6 | **mcp.so** | **DONE** | PR #1931 merged. Live. |

## Browser Automation Attempted

- npm: Logged in via browser, confirmed package exists (v0.2.1). Token refresh requires 2FA.
- MCP Registry: Read publishing docs. Requires mcp-publisher CLI + GitHub device OAuth.
- Smithery: Attempted GitHub OAuth. Denied (idp_access_denied).
- A2A Registry: API submission discovered already registered.

## Owner Actions Required

1. `cd mcp/gspc-server && npm login && npm publish --access public`
2. `mcp-publisher login github` then `mcp-publisher publish`
3. Authorize Smithery GitHub app, then delete stale csoai/gspc
4. Re-submit gspc-mcp to glama.ai
