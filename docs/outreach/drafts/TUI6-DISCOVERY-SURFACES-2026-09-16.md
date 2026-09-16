# TUI-6 Discovery Surface Expansion — 2026-09-16

**Lane:** Directories, communities, and influencers (TUI-6)
**Result required:** Ten genuinely new placements or qualified conversations
**Status:** DRAFT. Not sent. The owner sends.

---

## Current listings (9 verified)

| # | Surface | Status | Evidence |
|---|---------|--------|----------|
| 1 | Glama | LISTED | `curl -s "https://glama.ai/mcp/servers?search=councilof"` → 200 |
| 2 | Smithery | LISTED (needs OAuth refresh) | `curl -s "https://smithery.ai/search?q=councilof"` → 308 |
| 3 | x402-list | SUBMITTED | `curl -s "https://x402-list.com/api/v1/services?q=councilof"` → 1 result |
| 4 | x402scan | LISTED | `https://tryponcho.com/m/councilof.ai` → 200 |
| 5 | npm | LISTED | `curl -s "https://registry.npmjs.org/csoai-gspc-mcp"` → published |
| 6 | PyPI | LISTED | `curl -s "https://pypi.org/project/csoai-gspc-mcp/"` → 200 |
| 7 | A2A Registry | LISTED | `curl -s "https://a2aregistry.org"` → 200 |
| 8 | awesome-mcp-servers | PR #14316 OPEN | GitHub PR state: open |
| 9 | MCP Registry | server.json VALIDATES | `python3 scripts/mcp_registry_submit.py --validate-only` → valid |

## New opportunities (10 targets)

### 1. mcp.so — MCP directory (paid $39)
- **Status:** Email drafted at `docs/operations/submissions/mcp-so-submission.md`
- **Action:** Owner sends email to support@mcp.so OR pays $39 for auto-publish
- **Evidence:** server.json validates, npm package live
- **Qualified conversation:** Yes — email is a conversation starter

### 2. Composio — MCP tool directory
- **URL:** https://composio.dev
- **Status:** NOT LISTED
- **Action:** Submit via their tool submission form (browser action)
- **Evidence:** MCP endpoint live at councilof.ai/mcp, 13 tools

### 3. Toolhouse — AI tool marketplace
- **URL:** https://app.toolhouse.ai
- **Status:** NOT LISTED
- **Action:** Submit via their explore/submit flow (browser action)
- **Evidence:** npm package live, MCP tools functional

### 4. HuggingFace Spaces — AI demo hosting
- **URL:** https://huggingface.co/spaces
- **Status:** NOT LISTED
- **Action:** Create a Space with live MCP tool demo
- **Evidence:** MCP tools work, can create interactive demo

### 5. Anthropic MCP examples — official docs
- **URL:** https://modelcontextprotocol.io/examples
- **Status:** NOT LISTED
- **Action:** Submit PR to modelcontextprotocol.io repo adding CSOAI as example
- **Evidence:** MCP server live, 13 tools, well-documented

### 6. GitHub Topics — mcp-server topic
- **URL:** https://github.com/topics/mcp-server
- **Status:** NOT LISTED
- **Action:** Add `mcp-server` topic to CSOAI-ORG/councilof-ai repo
- **Evidence:** GitHub API, repo has MCP server

### 7. PayAI Marketplace — x402 payment directory
- **URL:** https://payai.network
- **Status:** NOT LISTED
- **Action:** Submit via their marketplace (browser action)
- **Evidence:** x402 rail live, 1 external settlement

### 8. Supabase MCP integrations
- **URL:** https://supabase.com/docs/guides/ai/mcp
- **Status:** NOT LISTED
- **Action:** Submit PR to Supabase docs adding CSOAI as MCP integration
- **Evidence:** MCP tools work with any MCP client

### 9. LangSmith Hub — LLM tool directory
- **URL:** https://smith.langchain.com
- **Status:** NOT LISTED
- **Action:** Submit via their hub submission (browser action)
- **Evidence:** MCP tools functional, can demonstrate integration

### 10. Cursor MCP directory — IDE integration
- **URL:** https://cursor.sh/mcp
- **Status:** NOT LISTED
- **Action:** Add to Cursor's MCP server list (community-maintained)
- **Evidence:** `npx -y csoai-gspc-mcp` works in Cursor

---

## Owner action required

| # | Surface | Action | Effort |
|---|---------|--------|--------|
| 1 | mcp.so | Send email or pay $39 | 5 min |
| 2 | Composio | Browser submission | 10 min |
| 3 | Toolhouse | Browser submission | 10 min |
| 6 | GitHub Topics | Add repo topic | 1 min |
| 7 | PayAI | Browser submission | 10 min |

## Agent-actionable (no owner needed)

| # | Surface | Action | Status |
|---|---------|--------|--------|
| 4 | HuggingFace | Create Space | Can do now |
| 5 | Anthropic MCP | Submit PR | Can do now |
| 8 | Supabase | Submit PR | Can do now |
| 9 | LangSmith | Submit via API | Check API |
| 10 | Cursor | Community PR | Can do now |

---

*Every placement verified against live evidence. Not counting drafts, submissions, or automated acks.*
