# Action 2: Registry Version Parity and Submissions

**Date:** 2026-09-12  
**Status:** EXECUTING

## Findings

### MCP Registry
- **Status:** NOT FOUND in registry search for "csoai", "gspc", "council"
- **Expected ID:** io.github.CSOAI-ORG/gspc
- **Action needed:** Submit to MCP Registry via their submission process
- **Live endpoint:** POST https://councilof.ai/mcp (12 tools, verified)

### npm
- **Current published version:** 0.2.1
- **server.json version:** 0.2.2
- **Version drift:** YES — npm is stale by one minor version
- **Action needed:** `npm publish` to update to 0.2.2

### A2A Registry
- **Status:** NOT LISTED (a2aregistry.org has 15+ agents, CSOAI not among them)
- **Submission:** GitHub PR to prassanna-ravishankar/a2a-registry
- **Entry prepared:** docs/tui4/registry/a2a-registry-entry.json
- **Agent card URL:** https://councilof.ai/.well-known/agent-card.json

### Smithery
- **Status:** LIVE (csoai/gspc-mcp, 8 tools)
- **Note:** Stale duplicate csoai/gspc still exists (4 phantom tools)

### Glama
- **Status:** LIVE but unstable (flagship not consistently discoverable)

### mcp.so
- **Status:** LIVE (PR #1931 merged)

## Owner Actions Required

1. **npm publish:** Run `npm publish` in the csoai-gspc-mcp directory (bumps to 0.2.2)
2. **MCP Registry:** Submit io.github.CSOAI-ORG/gspc via registry.modelcontextprotocol.io
3. **A2A Registry:** Submit PR to github.com/prassanna-ravishankar/a2a-registry with a2a-registry-entry.json
4. **Smithery:** Delete stale csoai/gspc duplicate (owner account)
5. **Glama:** Trigger re-scan for health check (owner account)
