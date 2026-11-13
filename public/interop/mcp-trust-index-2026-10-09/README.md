# MCP Trust Index — Lite · 2026-10-09

**Measured, never certification.** Six deterministic checks over every row of the official MCP registry walk. A verdict is a measurement of public bytes at an instant — not a certification, endorsement, or warranty of any server. `UNCHECKABLE` is a first-class verdict meaning "the public bytes do not decide"; it is never recorded as `0`, `null`, or `FAIL`.

as_of: **2026-10-09T03:47:42Z** (walk completion + scoring). Counts below are pointers with this as_of, not permanent totals.

## Ecosystem framing (third-party figures — cited and dated, not ours)

| Figure | Value | Source | As reported |
| --- | --- | --- | --- |
| Smithery listed servers | 15,482 | [agentsindex.ai/smithery](https://agentsindex.ai/smithery), citing Smithery's own API | as of 2026-09-18 |
| Smithery **verified-badge** holders | 191 of 15,482 (about 1.2 percent) | [agentsindex.ai/smithery](https://agentsindex.ai/smithery) | as of 2026-09-18 |
| Smithery verified badges — our live cross-check | **191 verified** of 19,156 listed (191 rows enumerated in full; 183 unique qualifiedNames) | [registry.smithery.ai/servers?verified=true](https://registry.smithery.ai/servers?pageSize=100&page=N&verified=true) | measured 2026-10-09T03:47:42Z |
| Arcade ToolBench grade-A rate | 0.5% | [Forbes, 10 Aug 2026](https://www.forbes.com/sites/janakirammsv/2026/08/10/arcade-acquires-smithery-to-own-the-agent-tool-supply-chain); study: [arcade.dev/white-papers/state-of-mcp-tools](https://www.arcade.dev/white-papers/state-of-mcp-tools) (43,400+ servers, 219,069 tools) | 2026-08-10 |
| PulseMCP directory size | 21,809 | [pulsemcp.com/servers](https://www.pulsemcp.com/servers/) | figure as cited in this harvest's framing; live counter read 22,280+ at retrieval 2026-10-09 — a count is a pointer with an as_of |
| Glama registry size | 93,733 | [glama.ai/mcp/servers](https://glama.ai/mcp/servers) | figure as cited in this harvest's framing; live counter read 97,619 ("Last indexed Oct 8, 2026") at retrieval 2026-10-09 |

## Our denominators (this walk)

| Denominator | Count | Pointer |
| --- | --- | --- |
| Registry rows walked (`name:version`) | 139,896 | [registry.modelcontextprotocol.io/v0/servers?search=](https://registry.modelcontextprotocol.io/v0/servers?search=&limit=100), 1,399 cursor pages |
| Unique registry names | 40,922 | same |
| Rows with a public https endpoint | 62,862 | row `remotes[]` bytes |
| Rows declaring a tools list | 759 | `server._meta.io.modelcontextprotocol.registry/publisher-provided.tools` bytes |
| Rows with licence bytes | 704 | row `license`/`licence` keys |

## The six rules (deterministic; public bytes only)

| Rule | Question | PASS | FAIL | UNCHECKABLE |
| --- | --- | --- | --- | --- |
| R1 | `io.github.*` namespace ownership declared | `server.name` or `packages[].identifier` matches `^io\.github\.[A-Za-z0-9-]+/[A-Za-z0-9._-]+$` (GitHub-account-anchored naming) | an identifier is declared outside that namespace | no identifier bytes exist |
| R2 | marketplace verified badge known | row joins to Smithery's **complete** verified set (exact qualifiedName, `io.github`-derived `owner/repo` slug, or normalized homepage/repository URL) | row joins to a Smithery listing entry we fetched and **observed** with `verified:false` | badge state not observable in reachable public bytes |
| R3 | declared-vs-served `tools/list` | declared (row bytes, `publisher-provided.tools`) and served (live JSON-RPC `tools/list` at the row's first public remote endpoint) name-sets match | both sides exist and differ | no declared list (comparison undefined), no public endpoint (`r3:no-ep`), or endpoint not measurable (`r3:denied` / `r3:unreach`) |
| R4 | README/docs link present | non-empty `readme*`/`docs*`/`documentation*` field or `repository.url` in row bytes | none declared | — (row bytes present for every walked row) |
| R5 | licence declared | any `license`/`licence` key with a non-empty string | none declared (absence is checkable from the row bytes) | — |
| R6 | release date recency | `publishedAt` (fallback `updatedAt`, `statusChangedAt`) within 365 days of as_of | older (`r6:age=…`) | no date bytes / unparseable (`r6:parse`) |

Publisher self-declared fields (`verified_on`, `verified_via`, `namespaceVerification` — 9 and 319 rows respectively) are recorded as **evidence only** and are never accepted as marketplace badges: self-attestation is not verification.

## Results (2026-10-09T03:47:42Z)

| Rule | PASS | FAIL | UNCHECKABLE |
| --- | --- | --- | --- |
| R1 io.github.* ownership declared | 102,491 | 37,405 | 0 |
| R2 marketplace verified badge | 472 | 1,331 | 138,093 |
| R3 declared-vs-served tools/list | 146 | 128 | 139,622 |
| R4 README/docs link | 115,768 | 24,128 | 0 |
| R5 licence declared | 704 | 139,192 | 0 |
| R6 release date recency | 138,856 | 1,040 | 0 |

What stands out: **licence metadata is essentially absent from the official registry** (704 / 139,896 rows declare one); **tool drift is unauditable from registry bytes alone** (only 759 rows declare a tools list at all — 138,903 rows make the R3 comparison undefined); and marketplace badge coverage is thin (472 rows join to any of the 191 Smithery verified badges).

## Live probes (evidence, dated 2026-10-09T03:47:42Z)

1,033 endpoints probed (JSON-RPC `tools/list`; stateless attempt, then `initialize` → `tools/list`; 8 s/request; **first remote endpoint per row only; no tool was invoked**):
- verdict-bearing rows (declared tools + endpoint): 533 → 274 measured OK (146 match / 128 mismatch), 242 `DENIED`, 17 `UNREACHABLE`
- evidence sample (first 500 rows in walk order with an endpoint and no declared list): 281 OK / 206 DENIED / 13 UNREACHABLE
- served tool counts where measurable: n=555, min 1, p50 10, max 184

## Files

- **`data.csv`** — 139,896 rows, columns `name,version,r1,r2,r3,r4,r5,r6,reasons`. Verdict codes `P`=PASS, `F`=FAIL, `U`=UNCHECKABLE. Empty `reasons` = the default state per the rule table (see `reason_legend` in index.json). sha256 `1161ecaf6fab0d5b8b0c014531e6fed97eab0178506db34a73c1573d57677ee9`, 7243726 bytes.
- **`index.json`** — machine-readable rubric, counts, framing pointers, probe statistics.

## Method notes and limits

- Walk: `https://registry.modelcontextprotocol.io/v0/servers?search=&limit=100` with cursor pagination (`metadata.nextCursor`, loop-guarded); 1,399 pages. Rows are `name:version` — the walk includes every published version, not only `isLatest`.
- The `{name}` direct shape (`/v0/servers/{name}`) 404s even for rows that exist in the list; **a 404 there is not absence**. The list walk is the authoritative row source here.
- R2 reach: Smithery's unauthenticated listing caps pagination depth at 500 rows (5 × 100). FAIL requires an *observed* unbadged entry in reachable bytes; everything else stays UNCHECKABLE. The verified set itself was enumerated in full (191 rows).
- R3 probes read `tools/list` only. Nothing was executed, invoked, or installed.
- Corrections to this index supersede with dated provenance in the claim feed (`public/interop/claim-feed-2026-10-09/`); nothing here claims a permanent state.
