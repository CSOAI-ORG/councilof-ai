# Correction: `csoai/agent-interop-census` claims a complete MCP registry read from 2 pages

**Status: OPEN. The dataset must be republished. This note does not republish it.**
Until it is republished, do not quote any `mcp_registry_*` figure from it as a total.

## The published claim

`totals.json` in the Hugging Face dataset `csoai/agent-interop-census`, revision
`cc1dcf041b9a1f61807e434759bd700be3007b2d` (lastModified 2026-09-14T10:48:18Z, `as_of`
2026-09-14T10:48:11Z), read on 2026-09-25:

| field | published value |
|---|---|
| `mcp_registry_unique_entries` | `100` |
| `mcp_registry_pages_read` | `2` |
| `mcp_registry_stop_reason` | `"cursor exhausted — clean end of registry"` |
| `mcp_registry_enumeration_complete` | **`true`** |
| `rows_by_source.modelcontextprotocol-registry` | `100` |

The dataset card built from it also says "This build's registry enumeration is COMPLETE".

## What was measured

| read | when (UTC) | pages | rows | read_state |
|---|---|---|---|---|
| survey walk, `version=latest` | 2026-09-25 05:24 to 05:31 | 359 | 35,870 | cursor exhausted |
| `scripts/census/frame.py`, `version=latest` | 2026-09-25, run of `/evac-bulk/census-frame-2026-09-25/` | 359 | **35,873** | **EXHAUSTED** (every page HTTP 200 with `servers[]` and `metadata{}`; `nextCursor` absent on page 359) |

The frame run's page set digest is `60482de9b0b1121b6532d24721d2f2911393816466427bb734d11c5333d52ffb`
(sha256 of the 359 page sha256s, one per line, in order). The raw pages are kept on
oracle-micro-2 under `/evac-bulk/census-frame-2026-09-25/raw/mcp-registry/`.

**The units differ, so this note does not state a ratio.** The published figure counts
`(name, version)` pairs across all versions. The measured figure counts latest-version servers.
The all-versions population was **not** re-measured here. Every latest server is one
`(name, version)` pair, so that population is at least 35,873. That is a floor, not a total.
What the measurement does settle is that a 2-page, 100-entry read was not a complete read of
the registry.

## The producer, and the fix

The published case comes from the collector, `scripts/census/collect-mcp-registry.py`:
it parsed any JSON body as a page, never checked the HTTP status or the page shape, and
recorded "no `metadata.nextCursor`" as `cursor exhausted — clean end of registry`. Page 2 added
no new rows and carried no `nextCursor`. The collector kept no response bodies, so whether page 2
was an error object or an empty page cannot be recovered. Either way it was not the end.

The builder, `scripts/census/build-agent-interop-census.py`, then set
`mcp_registry_enumeration_complete = stop_reason != "in-progress"`. Under that test every
non-checkpoint stop counts as complete: a fetch failure, a repeated cursor, or the bounded
fallback file `/tmp/mcp_census2.json`.

Fixed on lane `census-frame-20260925`. Both fixes fail closed:

- `collect-mcp-registry.py`: a response counts as a page only if it is HTTP 200, complete
  JSON, and has `servers[]` and `metadata{}`. Anything else stops the walk as PARTIAL. The
  collector now writes `read_state` and `pages_valid` explicitly.
- `read_state.py` (new): `walk_read_state()` returns EXHAUSTED only if the collector wrote
  `read_state: EXHAUSTED` and `pages_valid == pages`. Legacy files without `read_state`,
  including the one behind the published figures, are PARTIAL. So is the bounded fallback file.
- `build-agent-interop-census.py` now publishes `mcp_registry_read_state` and derives
  `mcp_registry_enumeration_complete` from it. `mcp_registry_population_total` is null
  unless the read is EXHAUSTED. The same applies to `hf_spaces_read_state`.
- `collect-hf-spaces.py` had the same failure mode: a non-JSON body or an error object ended
  the loop silently, and a 400-page cap was never reported. It now writes `read_state` too.
- Tests: `scripts/census/test_frame.py` → `CensusReadState` (the published legacy document
  evaluates to PARTIAL), plus `RegistryWalk.test_error_object_is_not_an_end`.

## Other published figures this does not re-measure

- `huggingface-spaces: 6,588` came from `search=mcp`. That query differs from the frame's
  `filter=mcp-server` (10,822, EXHAUSTED), so the two numbers are not comparable. The old HF
  collector recorded no read state, so treat 6,588 as a read count, not a population.
- `smithery_unique_collected: 272` against `smithery_declared_total: 14,625` was already
  labelled as capped. The frame reads the same cap (500 rows served, 264 distinct, declared
  17,186) and records it as PARTIAL.

## To close this note

Rebuild with the fixed collector and builder, confirm that `mcp_registry_read_state` is
`EXHAUSTED`, and republish with this note linked from the card. Every row stays an index
entry: DISCOVERED and UNMEASURED.
