# CSOAI GSPC outward directory presence — 2026-10-01

Probe window: 2026-10-01T10:32:57Z – 2026-10-01T10:42:26Z (anonymous HTTP only; no forms, no login, no spend, no mail).

Derived from public APIs only:
- `GET https://councilof.ai/api/state` (HTTP 200) → `public_count.value` = **"23 axes · 23 measured"**; `board.measured_axes.value` = **23**; `board.axis_slots.value` = 23; `board.quotable_axes` / `/api/gspc` `totals.quotable_axes` = **23**.
- `GET https://councilof.ai/api/gspc` (HTTP 200) `totals`: axes 23, measured_axes 23, unmeasured_axes 0, public_count "23 axes · 23 measured". `as_of`: behavioural 2026-08-12 · jail 2026-08-18 · financial-fact 2026-08-25.
- Live `POST /mcp` initialize + tools/list (2026-10-01): server `csoai-gspc-mcp` **1.4.4**, **19 tools** (14 free + 5 x402). Sorted tool-name sha256 `8f17c442a39c7a8fb0d6342077335c13319fd38419ebdc9910d1dfd40385a60a` matches `/.well-known/mcp.json`. Listing is discovery, not adoption or revenue.

## N-site board

| # | Site | URL | HTTP | Tools listed | Last-updated visible | State | Next action (kind) |
|---|------|-----|------|--------------|----------------------|-------|--------------------|
| 1 | MCP Registry `io.github.CSOAI-ORG/gspc` | `registry.modelcontextprotocol.io/v0.1/servers?search=gspc` | 200 | 16 (desc on latest) | 2026-09-29 (isLatest 1.4.3) | **STALE** vs live 1.4.4/19 | Owner-gate: publish 1.4.4 or retire alias |
| 1b | MCP Registry `ai.councilof/gspc` | same API | 200 | 19 (desc 14+5) | 2026-09-30T17:17Z isLatest 1.4.4 | **CURRENT** | Permissionless: re-read after each publish |
| 2 | Smithery `csoai/gspc` | `smithery.ai/servers/csoai/gspc` | 200 | 14 names in HTML | ~2026-09-19 | **STALE** (missing 5 new free + evidence_bundle) | Owner-gate: re-submit / refresh listing |
| 2b | Smithery `csoai/gspc-mcp` | `smithery.ai/servers/csoai/gspc-mcp` | 200 | 13 names | ~2026-09-14 | **STALE** | Owner-gate: re-submit |
| 3 | mcp.so | `mcp.so/servers/csoai-gspc-measurement` | 200 | 13 names | server payload 2026-09-25 | **STALE** | Owner-gate: update listing |
| 4a | Glama connector | `glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc` | 200 | 19 (page says "19 tools (14 free, 5 x402-metered)") | crawl stamps 2026-09-28…30 | **CURRENT** | Permissionless: re-crawl watch |
| 4b | Glama servers | `glama.ai/mcp/servers/CSOAI-ORG/councilof-ai` | 200 | 12 | stamps ~2026-09-07…13; page text includes STALE | **STALE** | Owner-gate: refresh GitHub-derived listing |
| 5 | PulseMCP | `pulsemcp.com/servers?q=gspc` | 200 (UA; 403 bare curl = Cloudflare) | 0 | n/a | **MISSING** ("No servers found") | Owner-gate: official submit/crawl bait |
| 6a | HF Space | `huggingface.co/spaces/csoai/gspc-mcp` (+ `/api/spaces/...`) | 200 | n/a (Gradio MCP Space) | 2026-09-29T11:09Z | **CURRENT** | Permissionless: re-read API |
| 6b | HF dataset | `huggingface.co/datasets/csoai/gspc-board` | 200 | n/a | 2026-09-30T05:51Z (3634 downloads) | **CURRENT** | Permissionless: re-read API |
| 7 | Kaggle `nicktempleman/csoai-*` | `kaggle.com/datasets?search=csoai` + API list | 200 | n/a | 19 public datasets; many 2026-10-01 morning; `csoai-gspc-living-board` 2026-09-30 | **CURRENT** (slugs `…/csoai-gspc-board` & `…/csoai-gspc` are 404 MISSING) | Owner-gate: only if those two slugs are required names |
| 8 | x402-list | `x402-list.com/services/council-of-ai` and `…/council-of-ai-gspc` | 200 both | service cards | dates on page 2026-09-07 / 09-22 | **CURRENT** | Permissionless: re-read |
| 9 | x402scan | `x402scan.com/recipient/council-of-ai` and `…/councilof.ai` | 200 shell | 0 (payload says **Not Found**) | n/a | **MISSING** (JS/RSC soft-404; browser confirms same) | Owner-gate: claim/recipient by chain address |
| 10 | a2aregistry | `a2aregistry.org/api/agents` | 200 JSON | A2A agent (not tool list) | agent v1.1.0; `/agents/csoai-gspc` is SPA shell (same 1.1MB HTML) | **CURRENT** for "Council of AI — Measurement Agent" (`/api/a2a`); specific slug path not real | Permissionless: deep-link API URL |
| 11 | npm | `registry.npmjs.org/csoai-gspc-mcp` (www 403 CF) | 200 API | desc says 12 tools | latest **0.2.2** 2026-09-13; `0.2.3-rc.2` 2026-09-29 | **STALE** desc vs live 19 | Owner-gate: publish matching release notes |
| 12 | PyPI ×3 | `langchain-csoai`, `llama-index-tools-csoai`, `crewai-csoai` `/json` | 200 ×3 | wraps `csoai-gspc` | **0.1.3** uploaded 2026-09-30T15:30Z ×3 | **CURRENT** | Permissionless: re-read JSON |
| 13 | councilof.ai/mcp | JSON-RPC initialize + tools/list | 200 | **19** live | server 1.4.4 now | **CURRENT** | Permissionless: hash-check |
| 14 | Well-known | `councilof.ai/.well-known/mcp.json` 200; `mcp/server-card.json` 200; `mcp-card.json`/`ai-plugin.json`/`mcp` 404 | 200/404 | 19 declared, hash matches live | generated from distribution.json | **CURRENT** | Permissionless: diff hash |

Honesty: a listing is discovery, not adoption. No revenue, settlement, or client use is claimed. PulseMCP/npm www and some pages are Cloudflare-gated to plain curl; browser-equivalent UA recovered PulseMCP HTML (server-rendered, said "No servers found"). x402scan pages are RSC shells whose flight payload contains "Not Found" — not a live recipient. a2aregistry deep path `/agents/csoai-gspc` returns the SPA shell identical to `/`; authority is `/api/agents`. JS-only shells are marked; a browser would only reconfirm the same flight payload.

## Top 5 permissionless actions
1. Keep a scheduled read of `registry…/v0.1/servers?search=gspc` + live `tools/list` hash; flag any directory that drifts from `8f17c442…`.
2. Point public sitemaps/llms.txt at `https://councilof.ai/mcp` + `.well-known/mcp.json` so PulseMCP/other crawlers can discover without a submit form.
3. Re-read HF APIs (`/api/spaces/csoai/gspc-mcp`, `/api/datasets/csoai/gspc-board`) and PyPI JSON each day; they already answer anonymous GET.
4. Publish the x402 **recipient address** (not just name slugs) in public machine-readable docs so x402scan-like indexes can match without login.
5. Deep-link a2aregistry to `https://councilof.ai/api/a2a` + `csoai.org/.well-known/agent-card.json` from any public README (no form).

## Owner-gated actions
1. MCP Registry: publish `io.github.CSOAI-ORG/gspc` **1.4.4** (19-tool desc) or mark the alias deprecated in favor of `ai.councilof/gspc`.
2. Refresh Smithery `csoai/gspc` + `csoai/gspc-mcp`, mcp.so, and Glama `servers/CSOAI-ORG/councilof-ai` to the 19-tool inventory.
3. PulseMCP official listing/submit (form/login).
4. x402scan recipient claim/verification (wallet or login).
5. npm: cut a release whose description matches 19 tools (or explicitly says "stdio subset: 12") and drop the 0.2.3 rc → latest.
6. Optional: Kaggle canonical slugs `csoai-gspc-board` / `csoai-gspc` if those names are required (currently 404; 19 other `csoai-*` datasets exist).
