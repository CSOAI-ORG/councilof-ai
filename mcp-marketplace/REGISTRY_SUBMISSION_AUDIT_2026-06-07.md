# MCP Registry Submission Audit + Action Plan — 2026-06-07

Per the deep-research finding (#7 in `MEOK_RESEARCH_REPORT_2026-06-07.md`): AI Overviews killed organic clicks 50-60%; the new SEO strategy is **be present across LLM-citation surfaces**. MCP registries are the primary discovery channel for AI agents (Claude, ChatGPT, etc.) so registry presence = LLM-citation surface.

## Registry checklist — submit MEOK MCPs to each

### Tier 1 — primary discovery (submit immediately)

| Registry | URL | Submission method | Status |
|---|---|---|---|
| **modelcontextprotocol.io official** | https://modelcontextprotocol.io/ + https://github.com/modelcontextprotocol/registry | PR to registry repo | ⏳ Not yet submitted |
| **mcp.so** | https://mcp.so | GitHub issue or web form | 🟡 Partial — 4 LIVE MCPs submitted earlier (see Wave 7b). 21 more pending |
| **Smithery** | https://smithery.ai/ | Web form per server | ⏳ Not yet submitted |
| **Anthropic MCP directory** | https://www.anthropic.com/news/model-context-protocol | Via Anthropic submissions | ⏳ Not yet submitted |

### Tier 2 — agent runtimes with built-in MCP marketplaces

| Registry | URL | Submission method | Status |
|---|---|---|---|
| **Cline marketplace** | https://cline.bot/ | GitHub PR to Cline-extension repo | ⏳ Not yet submitted |
| **Continue.dev** | https://continue.dev/ | Their config registry | ⏳ Not yet submitted |
| **Goose (Block) directory** | https://block.github.io/goose/ | Their toolkit registry | ⏳ Not yet submitted |
| **Postman MCP gallery** | https://www.postman.com/ | Postman developer publishing | ⏳ Not yet submitted |
| **wong2/awesome-mcp-servers** | https://github.com/wong2/awesome-mcp-servers | PR — already drafted (see ~/clawd/revenue/LAUNCH_OUTREACH_2026-06-07.md) | ⏳ PR queued |

### Tier 3 — community curations

| Registry | URL | Submission method | Status |
|---|---|---|---|
| **awesome-mcp-clients/servers** | various community awesome-lists | GitHub PRs | ⏳ |
| **MCP.run** | https://mcp.run/ | Their publishing flow | ⏳ |
| **Pulse MCP** | https://pulsemcp.com | Web form per MCP | ⏳ |

## Bulk-submission script

`tools/submit_to_registries.sh` — generates one GitHub-PR-ready entry per (MCP, registry) pair from the catalogue.json.

```bash
#!/usr/bin/env bash
# Pseudo-code — wire to actual GitHub API + curl forms per registry
set -euo pipefail
CATALOGUE=https://haulage.app/catalogue.json
curl -s "$CATALOGUE" | jq -c '.mcps[]' | while read -r mcp; do
  name=$(echo "$mcp" | jq -r .name)
  tagline=$(echo "$mcp" | jq -r .tagline)
  pypi=$(echo "$mcp" | jq -r .pypi)
  install=$(echo "$mcp" | jq -r .install)
  published=$(echo "$mcp" | jq -r .published)
  # Skip pending — registries reject 404 PyPI links
  [ "$published" != "true" ] && continue
  # Emit a YAML block per registry, write to PR files
  cat <<EOF >> "out/wong2-PR.md"
- **[$name]($pypi)** — $tagline
EOF
  # … repeat for mcp.so issue body, Cline registry, etc.
done
```

## What to track

Per LLM-discovery best practice, instrument referrer + UTM:
- `?utm_source=mcp.so&utm_medium=registry&utm_campaign=launch`
- `?utm_source=smithery&utm_medium=registry&utm_campaign=launch`
- Track in Vercel Analytics: which registry drives signups?

## 30-day target

- 7 LIVE MCPs listed in 8 registries × 7 = **56 listings**
- Bare minimum target: 28 listings (7 × 4 primary registries)

## Open question

The deep research raised open-question #2: **does MEOK's existing 32-MCP catalogue actually appear in mcp.so / modelcontextprotocol.io / Smithery / Cline / Continue today?**

Quick audit script — run before submitting:

```bash
for slug in meok-tacho-audit meok-bs7121 meok-vehicle-handover meok-ev-recall-transport \
            haulage-uk-compliance skip-hire-ai nrswa-ai; do
  for reg in mcp.so smithery.ai pulsemcp.com; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "https://$reg/server/$slug" 2>/dev/null)
    printf "  %s on %s -> %s\n" "$slug" "$reg" "$code"
  done
done
```

Run, see what's already indexed, fill the gaps.

## Why this matters more than SEO right now

Per the BrightEdge / Ahrefs / Seer / Pew / Semrush / Kevin Indig / Authoritas data confirmed in the research workflow, **organic search clicks dropped 50-60% post-AI-Overviews**. The traffic source for B2B compliance SaaS in 2026 is increasingly LLM-citation surface, not Google rank.

MCP registries ARE that LLM-citation surface. Submit aggressively.
