# Deep Funding — real downstream dependents of our two MCP packages

**Measured 2026-09-06. TUI-5. Every number has the query that returns it, and every instrument
was proved against a control before its answer was believed.**

## The answer

**Zero external downstream dependents.** Both packages are published, installable and real; nobody
outside `CSOAI-ORG` depends on them yet.

| Package | Published | deps.dev `dependentCount` | GitHub code hits | of those, outside CSOAI-ORG |
|---|---|---|---|---|
| `csoai-gspc-mcp` | 200, latest **0.2.1**, created 2026-08-28 | **0** (direct 0, indirect 0) | 97 enumerated | **0** |
| `csoai-governance-mcp` | 200, latest **0.1.0**, created 2026-07-07 | **0** (direct 0, indirect 0) | 48 enumerated | **0** |

Queries:

```
https://registry.npmjs.org/<pkg>
https://api.deps.dev/v3alpha/systems/npm/packages/<pkg>/versions/<v>:dependents
gh api -X GET search/code -f q='<pkg>' -f per_page=100 -f page=N   # then group by repo owner
```

## Why each instrument is trusted

A zero is only worth reporting if the instrument can produce a non-zero.

| Instrument | Control | Result |
|---|---|---|
| deps.dev dependents | `express` | **94,255** (direct 15,979) |
| | `left-pad` | **19,156** |
| | `@modelcontextprotocol/sdk` | **125** |
| GitHub code search | a string that cannot exist | **0** |

So `dependentCount: 0` for our packages is a **measured zero**, not an unindexed package.

## The instrument that had to be thrown away

The obvious query is npm's own search with a `depends:` qualifier. **It does not work and it fails
silently:**

```
depends:csoai-gspc-mcp                                total=89,640
depends:csoai-governance-mcp                          total=93,875
depends:csoai-control-pkg-that-cannot-exist-9f3a2b    total=829,171   <-- control
```

The control returns the whole registry, so the qualifier is ignored and every one of those numbers
is meaningless. Reporting 89,640 "dependents" would have been a fabrication with a URL under it.
This is the same failure the workspace already records for `gh api /users/CSOAI-ORG/repos?q=mcp`,
which returns byte-identical output with and without the filter.

## Reading the GitHub number honestly

`total_count` reports **268** and **48**, but enumeration returns **97** and **48** actual items,
and **every one of them is a `CSOAI-ORG` repository**. `total_count` on code search is approximate
and counts matches, not distinct dependents. The number worth quoting is the enumerated one, and
the number worth quoting *to a funder* is the third column: **0**.

## What this means for a Deep Funding application

Deep Funding rewards real dependency graphs. Ours is empty, and saying otherwise would be caught
by the same query anyone can run.

The defensible claims are about **published artefacts and their use surface**, not dependents:

- both packages resolve on the public registry with real versions;
- **354 servers** in the official MCP registry (`registry.modelcontextprotocol.io`, search
  `CSOAI-ORG`, count `isLatest`);
- the buyer's-eye x402 census, which is a **measurement of other people's infrastructure** that
  nobody else has published — 316 hosts paid, 100 delivered, 213 refused
  (<https://huggingface.co/datasets/csoai/x402-settlement-census>).

**Do not claim adoption, users, or downstream dependents.** When the first external dependent
appears, deps.dev will show it and that is the moment the claim becomes available.
