# 📡 CSOAI/MEOK — Full Distribution Channel Map (2026-06-27)

The macrocosm plan. **Central fact:** the official MCP registry (`registry.modelcontextprotocol.io`) is the **upstream** that the big directories ETL-pull from. **Publish once to the registry → auto-propagate to Glama, PulseMCP, Smithery, and the VS Code/GitHub `@mcp` gallery.** So the lever is: max the registry, then a few cheap batched manual submissions.

## Channel table
| Channel | How listed | File needed | Auto-pulls registry | Effort | Our status |
|---|---|---|:---:|---|---|
| **Official MCP Registry** | `mcp-publisher publish` per `server.json` (GitHub-auth namespace `io.github.CSOAI-ORG/*`) | `server.json` | — (the source) | Med (scripted) | 🟢 **firing** (10 live, fleet in prep) |
| **Glama** (glama.ai) | auto-crawl + registry ETL; claim via GitHub OAuth | `glama.json` only to *claim* | ✅ YES | Low | ⏳ auto after registry |
| **PulseMCP** | auto-crawl + registry ETL (~weekly) | none | ✅ YES | Low | ⏳ auto after registry |
| **VS Code / GitHub `@mcp` gallery** | GitHub MCP Registry pulls official; curates featured | `server.json` (upstream) | ✅ YES | Low | ⏳ auto after registry |
| **Smithery** (smithery.ai) | auto-crawl + registry ETL; claim to control | `smithery.yaml` only to host | ✅ YES | Low | ⏳ auto after registry |
| **GitHub search / topics** | crawls repo topics (`mcp`, `mcp-server`, `model-context-protocol`) | repo topics | feeds crawlers | Low | 🟢 **firing** (542 repos tagging) |
| **punkpeye/awesome-mcp-servers** (+ mcpservers.org frontend) | one PR to README, categorized | Markdown entry | No | Low | 🔨 **firing this PR** (2 channels) |
| **mcp.so** | manual submit (form / GH issue on chatmcp/mcpso) | none | No | Med | ⏭️ batch issues |
| **Cursor** (cursor.directory + deeplinks) | "Add to Cursor" deeplink in README (base64 mcp.json) | none | No | Low | ⏭️ deeplink sweep |
| **Docker MCP Catalog** | PR `servers/<n>/server.yaml`, Docker review | `server.yaml` | No | Med/High | ⏭️ flagships only |
| **Cline marketplace / Claude `.mcpb`** | per-server issue + 400×400 logo / bundle + review | manifest/logo | No | High | ⏭️ top revenue servers only |
| **PyPI** | keywords + `mcp-name:` README marker | pyproject keywords | n/a | Low | 🟢 **firing** (markers + republish) |

### Skip (dead ends, verified): mcp-get.com (archived), `Framework :: MCP` trove classifier (doesn't exist), modelcontextprotocol/servers README (reference-only now).

## Load-bearing facts
- **PyPI ownership gate:** registry validation reads the published PyPI README for `<!-- mcp-name: io.github.CSOAI-ORG/<server> -->` matching server.json `name`. No marker → publish fails. *(We add it + republish in the prep job.)*
- **server.json minimal:** `name` (reverse-DNS), `description` (≤100 chars), `version`, `packages[]` {registryType:"pypi", identifier, version, transport.type:"stdio"}. Schema **2025-12-11**.
- **glama.json (to claim):** `{"$schema":"https://glama.ai/mcp/schemas/server.json","maintainers":["<gh-user>"]}`.

## Prioritized execution (leverage order)
1. ✅ **PyPI marker + republish all** (unblocks registry) — *running*.
2. 🟢 **Registry publish all** → auto-propagates to Glama/PulseMCP/Smithery/VS-Code — *firing; needs token refresh between bursts*.
3. 🟢 **GitHub topics on all public repos** (crawler feed) — *running, 542 repos*.
4. 🔨 **One batched PR to punkpeye/awesome-mcp-servers** (= mcpservers.org too) — *this session*.
5. ⏭️ **glama.json sweep** to claim org listings (batch into a commit).
6. ⏭️ **"Add to Cursor" deeplinks** in flagship READMEs.
7. ⏭️ **mcp.so** batch GH issues.
8. ⏭️ Flagship-only: Docker MCP Catalog, Cline, Claude `.mcpb` (logo/bundle per server — top 5–10 wedges only).

*Research: multi-source verified 2026-06-27. The registry is the multiplier; everything else is cheap propagation.*
