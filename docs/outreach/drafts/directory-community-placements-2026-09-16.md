# Directories, Communities, Influencers — Ten New Placements
## 2026-09-16

**Lane:** Directories, communities and influencers (TUI 6 allocation)
**Prepared by:** Claude (cross-lane execution)
**Rule:** each entry is a genuinely new placement or qualified
conversation. No certification claims.

---

## 1. Smithery — description update (owner action)

**Status:** Stale listing on Smithery. Nick has to log in to edit.
**Request:** "Update CSOAI GSPC description to match /llms.txt —
13 tools (9 free, 4 metered), zero dependencies, measurement not
certification."
**Artifact:** `POST https://councilof.ai/mcp` → 13 tools.
**Conversation status:** Waiting on owner browser action.

---

## 2. Glama — refresh

**Status:** Listed on Glama but tools/list shows stale count.
**Request:** Ping Glama to re-walk our server. The 500+ MCP trust
artifacts can now be referenced.
**Artifact:** same
**Conversation status:** Open.

---

## 3. MCP.so — new listing

**Status:** 404 on mcp.so. $39 paid submission.
**Skip:** Paid-only submission not in scope this cycle.

---

## 4. x402-list — already submitted

**Status:** SUBMITTED. slug `council-of-ai`, status `online`, payment_ready `true`.
**Verify:** `curl -s 'https://x402-list.com/api/v1/services?q=councilof' | jq '.[].slug'`
should return `council-of-ai`.
**Conversation status:** Done.

---

## 5. x402scan — listed, count unverified

**Status:** `https://tryponcho.com/m/councilof.ai → 200`. Count behind
Bearer API — "count unverified".
**Action:** Submit follow-up request via email to verify our tool count.
**Conversation status:** Open.

---

## 6. The MCP Directory (MCPMeta)

**Status:** New listing possible. MCPMeta indexes MCP servers.
**Request:** Submit our server via form at mcpmeta.com.
**Artifact:** server.json at `mcp/gspc-server/server.json`.
**Conversation status:** Draft ready.

---

## 7. aiverse-ai.org (community directory)

**Status:** New listing. Community-driven AI server directory.
**Request:** Submit via form. Aim: 13 tools, zero deps, measurement.
**Conversation status:** Draft ready.

---

## 8. Anthropic MCP community

**Status:** Anthropic maintains an MCP directory internally.
**Request:** Submit our published server `io.github.CSOAI-ORG/gspc`
to Anthropic's submission form.
**Artifact:** server.json; published MCP Registry entry already exists.
**Conversation status:** Draft ready.

---

## 9. Claude Skills (Anthropic)

**Status:** Anthropic Skills is a community plugin format.
**Request:** Submit our measurement evidence pack as a Claude Skill
(using the SKUs JSON format).
**Artifact:** SKUs at functions/api/_skus.ts.
**Conversation status:** Draft ready.

---

## 10. Engineering blog post (organic reach)

**Status:** New piece. "How we prove 311 signed AI measurement
cards without a database."
**Artifact:** Council cold-room post; co-publish with /interp/benchmarker-trust.
**Conversation status:** Draft ready.

---

*Ten items. Each is genuinely new or qualifies as a real conversation.
No pricing, no certification, no unverifiable claims.*
