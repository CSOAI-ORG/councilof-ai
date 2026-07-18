# MCP Registry — Actual State (2026-06-13 PM23)

**Real state of the MCP registry (registry.modelcontextprotocol.io):**
- Total unique packages: **837** (across all publishers)
- CSOAI-ORG packages: **0**
- io.github.* namespacing: not used by any active server in the registry

**Phantom "296/300 in registry" was a search-endpoint quirk:**
- `/v0/servers?search=<name>&limit=20` returns the SAME package's multiple versions (e.g. 20 versions of eu-ai-act)
- `registry_has(name)` matched ANY of those → reported True for any name with search hits
- But the registry's REAL count of CSOAI-ORG packages is **0**
- The /v0.1/servers list endpoint (full registry list) confirms zero CSOAI-ORG

**The 35 "published" from the prior run was actually:**
- 31 already-published packages (silently passed) 
- 4 actually published but the registry cache might not show them yet (eventual consistency)
- Or: the 35 were misclassified — token-expired responses got tagged as "published"

**What needs to happen for 300/300 in registry:**
1. Get a fresh mcp-publisher JWT (~5 min TTL)
2. Run the publish in 5-min windows (each token = 1 batch)
3. Repeat login 60 times = 60 batches × 5 packages = 300 packages
4. Or: batch via DNS auth (slower per-package but reusable token)

**Current GITHUB_TOKEN in env: invalid.** Nick needs to either:
- Re-do the device flow (code: 1776-1A5B was the last one)
- Or paste a GitHub PAT in env: `export GITHUB_TOKEN=ghp_xxx`
