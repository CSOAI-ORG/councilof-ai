
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
