# CSOAI public surface: evidence-first next actions

**Audit time:** 21 September 2026, 17:56–17:59 UTC  
**Scope:** anonymous public readback only. No content was published, sent, or deployed by this audit.

## What is currently public and verified

| Surface | Current observed state | Evidence boundary |
|---|---|---|
| GSPC API | `https://councilof.ai/api/gspc` returned HTTP 200, schema `csoai.gspc-axes/0.5`, **23 declared axes / 22 MEASURED / 1 UNMEASURED**; `Last-Modified: Mon, 21 Sep 2026 17:55:01 GMT`. | The served response is fresh; its underlying behavioural, jail, and financial-fact run dates are 12, 18, and 25 August. A fresh response is not a new measurement run. |
| GSPC signatures | The current `site_attestation` and the `living_stamp` both verified with the published `did:web:csoai.org#board-attestation-1` key over their documented canonical byte preimages. | This proves the stated bytes and signer relation under the published rule. It does not re-measure a subject, establish a current real-world outcome, or certify anything. |
| MCP protocol | `https://councilof.ai/mcp` returned HTTP 200. Anonymous `initialize` and `tools/list` returned HTTP 200 Server-Sent Events and **13** named tools: 9 free readers and 4 x402-metered tools. | This proves unauthenticated discovery and tools-list availability at the check time. It does not prove paid delivery, settlement, downstream use, or revenue. |
| A2A / x402 discovery | The agent card, MCP well-known document, MCP server card, x402 well-known document, `/api/a2a`, `/api/x402`, and all tested Council URLs referenced by those documents returned expected HTTP responses. `GET /api/free-door` returned an intentional x402 402 challenge with `amount: "0"`. | A zero-price 402 challenge is not a payment or a commercial event. |
| New GitHub public identity | Profile main was `fecbe6cca6b91733adfa1d403438369ab47554d3`; evidence-mirror main was `42379b88ce4d386c79b04c4b7bab0879ff4c2ec2`. The four raw files returned HTTP 200 with the hashes recorded in [the publication receipt](/Users/nicholas/clawd/_alignment/CSOAI_PUBLIC_GITHUB_READBACK_2026-09-21.json). | These are public continuity and navigation records, not a deployment or source-code authority. |
| Robots and sitemap | `robots.txt` names the sitemap; `sitemap.xml` parses with 552 URLs. It contains the A2A agent card and `/mcps/`, but not `/mcp`, the MCP well-known records, x402 well-known record, or a canonical RSS URL. | A sitemap listing supports discovery only; it does not prove indexing or traffic. |

## Live inconsistencies that need a controlled source release

| Priority | Exact live fact | Why it matters | Smallest correct fix | Existing starting point |
|---|---|---|---|---|
| P0 | The public home, dashboard, claims register and MCP catalogue still contain generic or per-row links to `github.com/CSOAI-ORG`. Anonymous readback of the organisation, `councilof-ai`, `a2a-governance-bridge-mcp`, and `cobol-bridge-mcp` each returned HTTP 404. | A user following the primary public identity reaches an unavailable location. | Release the focused generic identity/footer/JSON-LD replacement only. Do **not** redirect every historical per-MCP source link to the new profile; retain it as a historical source reference or label the individual row `UNREACHABLE` until a real replacement repository exists. | Reviewed commit `cbe0bc971758afa12640c704d34d572e32c5a564`, with focused tests recorded. It is local-only. |
| P0 | `/.well-known/mcp.json` declares `total_tools: 13`, `free_tools: 9`, and `metered_tools: 4`, while its prose says “eight free readers plus four.” The MCP server card also says “twelve: eight free readers plus four.” The live protocol returned 13 tools. | Machine-readable counts are correct while nearby human-facing prose is false. This creates an avoidable discovery and diligence contradiction. | Generate every count sentence from the same tool manifest used by `tools/list`, or change both prose sentences to **“nine free readers plus four x402-metered evidence tools; 13 total.”** Add a test that rejects inconsistent `total = free + metered` wording. | This is a small metadata correction; it is not included in the current `a42a5d6…` patch and needs a new focused patch. |
| P0 | GET `/mcp` claims `registry_evidence: "evidence/mcp-registry.json in the repo"`, but the corresponding public site path `https://councilof.ai/evidence/mcp-registry.json` returns 404 and the old source account is unavailable. | A stranger cannot retrieve the claimed evidence source. | Release the prepared truthful state object: `{ "public_url": null, "state": "not_separately_published" }`. If a stable public artifact is later selected, add its immutable URL then. | Reviewed commit `a42a5d6a020e7e1afc7d1f5b33936fdf6076b3a5`, with a focused contract test. It is local-only. |
| P1 | `/api/feed.xml`, `/feed.xml`, and `/atom.xml` all return RSS bytes, but the feed self-link currently says `/feed.xml`. `/atom.xml` is therefore an alias rather than Atom, while its self link identifies a different route. | Feed consumers and crawlers cannot identify one canonical route unambiguously. | Keep one canonical RSS route and put **only that route** in the self-link and sitemap. The existing patch chooses `/api/feed.xml`; if that choice stands, retain `/feed.xml`, `/rss.xml`, and `/atom.xml` as documented aliases and keep them out of the sitemap. | Reviewed feed portion of `a42a5d6…`; it still needs a clean deployment and anonymous readback of all four routes. |
| P1 | The MCP catalogue title still says “291+ AI Governance Tools,” while the reviewed release bundle says the catalogue should derive from 292 rows. The catalogue has many old source URLs; four sampled legacy source URLs were 404. | A manual headline and raw links invite an “all tools are live” reading even though the page itself says a catalogue row is not reachability evidence. | Derive the visible count from the catalogue source at build time. Add a per-row `source_state` and render `UNREACHABLE` where a sampled or checked source cannot be reached. Keep `CATALOGUED` distinct from `RUNTIME_OBSERVED`. | The frozen release bundle already has count-derivation work; this requires link-state handling before a broad public claim. |
| P1 | The x402 well-known record and other generated material use `https://councilof.ai/api/receipts?payer=0x…` as a copyable-looking URL. The Unicode ellipsis is not a syntactically usable request URI. | An agent or developer copying it cannot make the stated request. | Define one valid placeholder, such as `0x<40-hex-address>`, and generate the x402 record, OpenAPI, `llms.txt`, and examples from that single value. Confirm real-wallet responses only with a non-sensitive test address or documented 400 contract; do not expose a payer record. | The source currently appears in `functions/api/x402.ts`, generated OpenAPI, `llms.txt`, and related templates, so this must be one generated-source change rather than several manual edits. |
| P2 | The dashboard/API clearly contains the underlying run dates, while its HTTP freshness changed at 17:55 UTC. | Readers can mistake a freshly served cached snapshot for a newly executed benchmark. | Surface two labels wherever the dashboard presents current totals: **“served snapshot updated”** and **“underlying measurement dates.”** Keep the latter linked to `measured_on.date`. | No existing focused patch was verified for this exact UI wording. |

## Release order

1. Create one clean release candidate from the frozen reviewed base; do not use the dirty shared worktree or the unsafe direct publisher.
2. Apply the P0 generic GitHub identity patch, MCP registry-evidence state patch, and 13/9/4 metadata correction as separately reviewable hunks.
3. Run the targeted tests plus a static discovery check that compares `tools/list` against both well-known documents and x402 catalog counts.
4. Apply P1 feed/sitemap, catalogue-state, and placeholder-generation changes only after their focused tests are green.
5. Use one authorised Cloudflare publisher and record the deployment identifier.
6. Perform anonymous served readback after deployment, including the routes below, then preserve a dated receipt with response SHA-256 values.

## Mandatory readback gates

```text
https://councilof.ai/
https://councilof.ai/dashboard/?tab=measured
https://councilof.ai/claims-register/
https://councilof.ai/mcps/
https://councilof.ai/mcp                    # GET, initialize, tools/list
https://councilof.ai/.well-known/mcp.json
https://councilof.ai/.well-known/mcp/server-card.json
https://councilof.ai/.well-known/x402.json
https://councilof.ai/api/feed.xml
https://councilof.ai/feed.xml
https://councilof.ai/rss.xml
https://councilof.ai/atom.xml
https://councilof.ai/sitemap.xml
```

## Explicitly not a next public action

- Do not present the new GitHub profile as the replacement source repository for every historical MCP row.
- Do not submit fresh directory listings or publish a press update until the broken generic identity links and 13/9/4 documentation contradiction are served and read back.
- Do not describe a zero-price x402 challenge, an HTTP 200, a registry listing, or a public signature as settlement, adoption, revenue, or certification.
- Do not change the MCP Registry identifier `io.github.CSOAI-ORG/gspc` until its official current record and ownership path are read back; it may be a legacy registry identifier rather than a claim that the old GitHub organisation remains available.
