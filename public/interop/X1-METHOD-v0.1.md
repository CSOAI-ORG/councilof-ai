# X-1 — MCP Publisher Concentration Index, method v0.1 (frozen)

**Status:** method frozen 2026-09-22. Informational only. Unsigned. Not a financial reference. Measured, not certified.
**Correction policy:** supersede, never edit. Corrections ledger at `/api/corrections`.
**Artifact:** `x1-mcp-publisher-concentration-<as_of>.json`, schema `csoai.index.x1/0.1`.

## 1. Question

How concentrated is publishing on the official MCP registry — what share of distinct server names does each publisher namespace hold, and how concentrated is that distribution (HHI)?

## 2. Population

- `population_id`: `mcp-registry-official-full-walk`.
- Source: `https://registry.modelcontextprotocol.io/v0/servers`, the official registry's public read API, walked to exhaustion on the `as_of` date.
- Unit of population: one **server version** record (`server.name` + `server.version`). Every version returned by the walk is in the population, regardless of `_meta.…/official.status` (active / deprecated / deleted). Status counts are reported; nothing is excluded by status in v0.1 (a status-filtered sensitivity figure may be reported alongside, labelled as such).
- Derived unit: one **distinct server name** = the set of distinct `server.name` strings in the population.

## 3. Walk procedure

1. `GET …/v0/servers?limit=100`, then follow `metadata.nextCursor` with `cursor=<value>` until a page returns no `nextCursor` or zero servers.
2. Every page's raw bytes are cached to disk once (`registry-pages/`), with URL, cursor, fetch time and SHA-256 of the body recorded in a `_fetch` field. Nothing is fetched twice.
3. The registry orders results lexicographically by `name` then `version` and accepts **any string** as a cursor (it seeks to the first key greater than the string). v0.1 therefore permits a **sharded walk**: N walkers seeded at chosen prefix strings (e.g. `com.`, `io.github.h`), each stopping when its `nextCursor` exceeds the next shard's seed. Abutment is verified by bytes: for every consecutive pair, `final_next_cursor(k) > seed(k+1)` must hold, and it is recorded in the artifact. Records seen by two shards are de-duplicated on (`name`, `version`).
4. Politeness: 0.2 s between requests per walker, a named User-Agent, retry with back-off on timeouts.
5. The union of all cached pages is the population. The artifact records page count, total records, distinct (`name`,`version`) pairs, and the walk's start/end times.

## 4. Namespace (publisher) rule

`publisher = server.name[: server.name.index("/")]` — the text before the **first** `/`. Examples: `io.github.CSOAI-ORG/gspc` → `io.github.CSOAI-ORG`; `com.example/x` → `com.example`. A name without `/` is its own publisher and is counted as an anomaly. Comparison is case-sensitive (the registry treats `io.github.Foo` and `io.github.foo` as distinct strings; v0.1 does the same and reports how many publishers collapse under case-folding as a sensitivity figure).

## 5. Statistics (every number carries its denominator)

- `names_total` N = distinct server names.
- `publishers_total` P = distinct publishers.
- `share(p)` = names(p) / N.
- **HHI** = Σ_p share(p)². Range (1/P, 1]. Reported on the 0–1 scale, with the 0–10,000 scale alongside. Also reported: 1/HHI (effective number of equal-size publishers), and the same HHI computed over **versions** instead of names as a sensitivity figure.
- Top-20 publishers by names, with names(p), share(p), and versions(p).
- Our rank: the 1-based rank of `io.github.CSOAI-ORG` in the names ordering (ties broken by name string, and the tie group size is reported).
- Versions per name: min, p50, p90, p99, max, mean, and a bucketed histogram (1, 2–5, 6–20, 21–100, >100).
- Latest-version transport declaration: for each name, its version with `isLatest: true` (if none, the version with the greatest `publishedAt`, and the count of such fallbacks is reported): `remote_only`, `packages_only`, `both`, `neither`.

## 6. Controls (must pass; recorded in the artifact)

- Synthetic population of two publishers with equal name counts → HHI must equal 0.5 exactly.
- Synthetic population of one publisher → HHI must equal 1.0 exactly.
- Σ share(p) over all publishers must equal 1 within 1e-9.

## 7. Known limitations

- **Any cursor is accepted.** The registry does not validate cursors, so a walk can be started anywhere; a sharded walk is only complete if abutment is verified (section 3.3). A walk that stopped early would silently undercount; the artifact therefore records the final `nextCursor` of every shard.
- **Deleted and deprecated versions** remain in the listing with a status flag. v0.1 counts them; the artifact reports status counts so a reader can re-derive an active-only figure.
- **Name-squatting and bulk publishing.** A publisher can register many names cheaply (this publisher did: see `mcp-registry-self-listings-2026-09-22.json`). Name count measures *publishing activity*, not adoption, usage, or quality. The index says who publishes, not who is used.
- **Namespaces are not organisations.** `io.github.<user>` is one GitHub account; one organisation can publish under several namespaces (DNS, HTTP and GitHub-based), and the rule does not merge them.
- **A point-in-time read.** The registry is append-mostly and changes daily; `as_of` is the date of the walk, and figures are superseded, never edited.
- **Registry-side ordering is assumed stable during the walk.** A version published mid-walk at a key already passed is missed; one published ahead of the cursor is included. The walk's duration is recorded.
- Timeouts and retries are logged; a page that could not be fetched after 8 attempts aborts the shard and the artifact is not written.

## 8. Why this exists

X-1 is the first of the permissionless indices: computed from a public read API with no credential, no partnership and no permission, so anyone can recompute it from the same bytes. It is `intended_use: informational`; `financial_reference_allowed: false`.
