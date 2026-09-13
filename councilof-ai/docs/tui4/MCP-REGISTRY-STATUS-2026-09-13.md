
## MCP Registry Publish Attempt (2026-09-13T14:30Z)

**Attempted:** `POST /v0.1/publish` with GitHub OIDC JWT
**Result:** 400 Bad Request — "Expected mcpName 'io.github.CSOAI-ORG/csoai-gspc-mcp', got 'io.github.CSOAI-ORG/gspc'"
**Cause:** npm package `csoai-gspc-mcp@0.2.2` has `mcpName: "io.github.CSOAI-ORG/gspc"` in package.json. Registry expects `io.github.CSOAI-ORG/csoai-gspc-mcp`.
**Fix needed:** Update `mcpName` in package.json to `io.github.CSOAI-ORG/csoai-gspc-mcp`, republish to npm at v0.2.3, then retry MCP Registry publish.
**Auth note:** GitHub OIDC JWT exchange works correctly. Registry JWT is obtained from `POST /v0.1/auth/github-at` with `{"github_token": "gho_..."}`.

## Progress
- ✅ GitHub OIDC JWT exchange: WORKING
- ✅ NPM package 0.2.2: PUBLISHED
- ❌ MCP Registry publish: BLOCKED on mcpName mismatch (owner fix: update package.json + republish)

## MCP Registry Publish SUCCESS (2026-09-13T17:42Z)

**Published as:** `io.github.CSOAI-ORG/gspc` v0.2.2
**Status:** ACTIVE
**Verified:** Search for "gspc" in registry returns our server at the top

### What Was Done
1. ✅ GitHub OIDC JWT exchange: WORKING (`POST /v0.1/auth/github-at`)
2. ✅ Registry JWT obtained and used for publish
3. ✅ Server published using the **existing** npm package (`csoai-gspc-mcp@0.2.2`)
4. ✅ Server name `io.github.CSOAI-ORG/gspc` **matches** the `mcpName` in package.json

### Key Discovery
The MCP Registry validates that the server name must match the `mcpName` in package.json.
- Original attempt used `io.github.CSOAI-ORG/csoai-gspc-mcp` — REJECTED
- Successful publish used `io.github.CSOAI-ORG/gspc` — MATCHES package.json

### What Could Not Be Done
- ❌ Publish 0.2.3 (mcpName update): BLOCKED on npm 2FA (owner gate)
- ❌ Publish to GHCR or OIDC-provenance: npm token not OIDC-enabled
