---
license: cc-by-4.0
pretty_name: Agent Interop Census — MCP servers, HF Spaces, and open-licence repos
language:
- en
tags:
- mcp
- model-context-protocol
- agent-interoperability
- a2a
- x402
- census
- measurement
- csoai
- council-of-ai
task_categories:
- other
size_categories:
- 10K<n<100K
configs:
- config_name: manifest
  data_files:
  - split: train
    path: manifest.jsonl
  default: true
- config_name: census-frame-summary
  data_files:
  - split: train
    path: census-frame-*/summary.json
- config_name: manifest-json
  data_files:
  - split: train
    path: manifest.json
- config_name: totals
  data_files:
  - split: train
    path: totals.json
---

<!-- csoai-hubcard-v2 -->

# Agent Interop Census

**A census, not a scoreboard.** 46,301 rows indexing what publicly exists in the
agent-interoperability ecosystem: MCP servers in the official registry, Hugging Face Spaces,
and open-licence repositories on GitHub.

**Zero rows carry a measurement.** `graded: false` and `measurement: null` on every single row.
A grade requires a run against a frozen bank; no run was performed here. Each row states, in
the row itself, what it is (*an index entry observed in a public registry*) and what it never
proves (*quality, safety, fitness or compliance*).

## The lid

46,301 rows · 38,300 MCP registry entries ·
6,774 HF Spaces · **0 graded** · not a ranking · not a certification.

## What is counted

| source | rows | derived from |
|---|---|---|
| Official MCP registry | 38,300 | `registry.modelcontextprotocol.io/v0/servers`, cursor-paginated, deduped by `(name, version)` |
| Hugging Face Spaces | 6,774 | `huggingface.co/api/spaces?search=mcp`, Link-header paginated to exhaustion |
| mcp.so | 0 | its published sitemap, 19 pages, deduped |
| Smithery | 262 | `registry.smithery.ai`, capped by the API itself — see limitations |
| awesome-mcp-servers | 0 | `punkpeye/awesome-mcp-servers` README, MIT — **attribution carried on every row** |

GitHub topic totals (aggregate counts, not per-repo rows), from `search/repositories`:

| topic | repos |
|---|---|
| `mcp-server` | 45,248 |
| `model-context-protocol` | 46,053 |
| `a2a` | 2,586 |
| `x402` | 4,643 |

`topic:mcp-server` by licence: mit 27,449 · apache-2.0 4,375 · gpl-3.0 551.

## Honest limitations

- **The MCP registry's cursor pagination intermittently stalls.** A probe on 2026-09-05 saw
  pages 5 and 6 return an identical `nextCursor` and an identical first item. A paginator
  without loop detection silently re-reads one page and reports an inflated total — this
  collector does dedup by `(name, version)` and records why it stopped. Stop reason for this
  build: `page 389: fetch failed after retries (UnicodeEncodeError)`, after 389 pages.
- **Smithery advertises far more than it will serve.** Its API declares
  `totalCount: 20,749` alongside `totalPages: 5`. At its maximum
  `pageSize` of 100 that is 500 rows reachable, and those 500 contain only
  **262 distinct** servers because the pages overlap — a ~43x gap
  between advertised and enumerable. `pageSize=200` and `pageSize=1000` return zero servers.
  `totalCount` also drifts between consecutive calls, so it is a live estimate, not a count.
  This dataset therefore carries 262 Smithery rows, not
  20,749, and says so.
- **This build's registry enumeration is PARTIAL.**
  `mcp_registry_enumeration_complete: false` in
  `totals.json`. A partial enumeration is a floor, never a total.
- **mcp.so rows come from its published sitemap**, so a row means a URL was listed for
  indexing — not that the listing resolves, and not that a server is reachable.
- **Hugging Face exposes no `x-total-count`** and caps pages at 100, so a first page is never
  a total. Space counts here come from paginating to exhaustion.
- **A 919-page walk of a live registry is a smear, not a snapshot.** Publishers push during
  the enumeration. This build counted 14,438 rows flagged `isLatest`
  against 14,439
  distinct names — the gap is one server that released a new version mid-walk, read as latest
  on an early page and superseded by a later one. Re-running will not reproduce the same
  totals to the row, and any collector claiming otherwise is not accounting for this.
- **A search term is not a taxonomy.** HF Spaces rows match the string `mcp`; that is a search
  result, not a verified capability. `exposes_remote_endpoint` is `null` for Spaces because it
  was not probed.
- **Registry presence is not reachability.** 33,162 registry
  entries declare a remote endpoint; none was contacted for this census.

### Licences, checked rather than assumed

- `punkpeye/awesome-mcp-servers` is **MIT** (94k stars). Its entries are included, and every
  row carries `attribution: "curated by punkpeye/awesome-mcp-servers (MIT)"` because that
  licence requires it.
- `modelcontextprotocol/servers` reads **NOASSERTION** on GitHub. That is not missing data: the
  project is **mid-transition from MIT to Apache-2.0, per contribution**, with documentation
  under CC-BY-4.0 and un-relicensed contributions still MIT. Calling it "Apache-2.0" would be
  wrong, so it is described, not simplified.
- **Glama is excluded entirely.** Its API returns 401 without a key, and its Data Licence
  requires visible Glama attribution on every page that displays the data. Not collected.

### Licence is the thing absorption actually depends on — and most rows do not state one

Of the 438 Hugging Face **models** matching `mcp`, only
**176** declare a licence and
**262** do not — **59% UNSTATED**.
Datasets are the other way round: **417** of
527 state one.

That matters more than the row count. "Index every open-licence artefact" sounds like a large
population; measured, the majority of the model half cannot be established as open at all. An
absent tag is **UNSTATED**, never "permissive" — and a declared tag is the publisher's own
claim, not a legal review. Neither is a grade.

### GitHub topics are counts here, not rows — because they cannot be enumerated

`topic:mcp-server` reports `total_count` **27,604**, and GitHub then says *"Only the first 1000
search results are available"*. Star-bucket slicing does not clear it: `stars:0` alone is
**11,562**. So GitHub appears in this dataset as an **aggregate count**, never as rows. A number
we can derive is not a population we can enumerate, and printing 27,604 rows we never saw would
be the same defect as Smithery's 11,664.

## Reachability measurement

**Not run in this build.** `reachability_observation` is `null`; the census contains no endpoint
liveness claim. Registry presence remains distinct from reachability and conformance.


## Who publishes this

Council of AI (CSOAI Ltd, UK Companies House 16939677) — a measurement body.
**We measure. We never certify.** No row here is an endorsement, and nothing in this dataset
writes the public GSPC board.

Live board at the time of this build: **34 axes · 34 measured ·
0 unmeasured** (`csoai.gspc-axes/0.5`) —
re-fetch it, do not quote this line:

```bash
curl -s https://councilof.ai/api/gspc | python3 -c "import json,sys;print(json.load(sys.stdin)['totals'])"
```

The live MCP endpoint carries **54 tools** over HTTP.

## Verify

- Board: <https://councilof.ai/api/gspc>
- Public root: <https://councilof.ai/root.json>
- Verify a card: <https://councilof.ai/gspc-verify>
- Corrections ledger: <https://councilof.ai/api/corrections>
- Org index: <https://huggingface.co/csoai>

`manifest.json` carries a sha256 for every file in this repo; `totals.json` carries every
figure above, derived at build time.

## Citation

```bibtex
@dataset{csoai_agent_interop_census_2026,
  title  = {Agent Interop Census: MCP servers, Hugging Face Spaces, and open-licence repositories},
  author = {{Council of AI}},
  year   = {2026},
  publisher = {Hugging Face},
  url    = {https://huggingface.co/datasets/csoai/agent-interop-census},
  note   = {Census only; zero rows carry a measurement. CC-BY-4.0.}
}
```

Attribute as: Council of AI, CSOAI Ltd 16939677, councilof.ai. Licensed CC-BY-4.0.

Built 2026-11-19T14:23:22Z.

<!-- /csoai-hubcard-v2 -->

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *Agent Interop Census — MCP servers, HF Spaces, and open-licence repos*. 2026. Hugging Face dataset `csoai/agent-interop-census`. https://huggingface.co/datasets/csoai/agent-interop-census

```bibtex
@misc{csoai_agent_interop_census,
  title        = {Agent Interop Census — MCP servers, HF Spaces, and open-licence repos},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/agent-interop-census},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `manifest` (default) | `manifest.jsonl` | 5 |
| `census-frame-summary` | `census-frame-*/summary.json` | 1 |
| `manifest-json` | `manifest.json` | 1 |
| `totals` | `totals.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/agent-interop-census", "manifest", split="train")
```

<!-- csoai-card-fixes:end -->
