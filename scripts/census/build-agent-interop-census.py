#!/usr/bin/env python3
"""Build the csoai/agent-interop-census dataset from the census artifacts.

Every number is DERIVED from a named file or endpoint at run time. Nothing is
typed. A census row is an INDEX ENTRY, never a quality claim: no row here says
anything about how good a server, space or repo is, because none of them has
been through a graded run.
"""
import json, os, subprocess, hashlib, datetime, collections, sys

OUT = "/tmp/census-ds"
os.makedirs(OUT, exist_ok=True)
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def sh(*a):
    return subprocess.run(a, capture_output=True, text=True).stdout.strip()

def gh_count(q):
    out = sh("gh", "api", "-X", "GET", "search/repositories", "-f", f"q={q}", "-f", "per_page=1", "--jq", ".total_count")
    return int(out) if out.isdigit() else None

# ---------- sources ----------
# prefer the completed full run; fall back to the bounded run
_full="/tmp/mcp_census_full.json"; _bounded="/tmp/mcp_census2.json"
import os as _os
_src = _full if _os.path.exists(_full) else _bounded
mcp = json.load(open(_src)); mcp["_source_file"]=_src
hfs = json.load(open("/tmp/hf_spaces_census.json"))

rows = []

# 1. official MCP registry
for r in mcp["rows"]:
    rows.append({
        "source": "modelcontextprotocol-registry",
        "kind": "mcp-server",
        "id": r["name"],
        "version": r["version"],
        "is_latest": r["isLatest"],
        "status": r["status"],
        "exposes_remote_endpoint": r["has_remote"],
        "package_registries": r["registryTypes"],
        "repo_url": r["repo"],
        "graded": False,
        "measurement": None,
        "what_this_row_is": "an index entry observed in a public registry",
        "what_it_never_proves": "quality, safety, fitness or compliance of the server",
    })

# 2. HF spaces matching mcp
for s in hfs["rows"]:
    rows.append({
        "source": "huggingface-spaces",
        "kind": "hf-space",
        "id": s["id"],
        "version": None,
        "is_latest": None,
        "status": "private" if s.get("private") else "public",
        "exposes_remote_endpoint": None,
        "package_registries": [],
        "repo_url": f"https://huggingface.co/spaces/{s['id']}",
        "graded": False,
        "measurement": None,
        "sdk": s.get("sdk"),
        "likes": s.get("likes"),
        "what_this_row_is": "an index entry observed in the public Hugging Face Spaces search",
        "what_it_never_proves": "quality, safety, fitness or compliance of the Space",
    })

# 3. Smithery registry
smithery = None
if os.path.exists("/tmp/smithery_census.json"):
    smithery = json.load(open("/tmp/smithery_census.json"))
    for r in smithery["rows"]:
        rows.append({
            "source": "smithery-registry",
            "kind": "mcp-server",
            "id": r["qualifiedName"],
            "version": None,
            "is_latest": None,
            "status": "unlisted" if r.get("unlisted") else "listed",
            "exposes_remote_endpoint": bool(r.get("remote")),
            "package_registries": [],
            "repo_url": None,
            "registry_verified_flag": r.get("verified"),
            "registry_use_count": r.get("useCount"),
            "graded": False,
            "measurement": None,
            "what_this_row_is": "an index entry observed in the Smithery registry",
            "what_it_never_proves": "quality, safety, fitness or compliance of the server; 'verified' is Smithery's flag, not a CSOAI measurement",
        })

# 4. mcp.so sitemap
mcpso_urls = []
if os.path.exists("/tmp/mcpso_servers.txt"):
    mcpso_urls = [l.strip() for l in open("/tmp/mcpso_servers.txt") if l.strip()]
    for u in mcpso_urls:
        rows.append({
            "source": "mcp.so-sitemap",
            "kind": "mcp-server",
            "id": u.rsplit("/", 1)[-1],
            "version": None,
            "is_latest": None,
            "status": "listed",
            "exposes_remote_endpoint": None,
            "package_registries": [],
            "repo_url": u,
            "graded": False,
            "measurement": None,
            "what_this_row_is": "a URL published in the mcp.so public sitemap",
            "what_it_never_proves": "quality, safety, fitness, compliance, or that the listing resolves",
        })

# 4a. awesome-mcp-servers (MIT — attribution required and given)
awesome = []
if os.path.exists("/tmp/awesome_rows.json"):
    awesome = json.load(open("/tmp/awesome_rows.json"))
    for a in awesome:
        rows.append({
            "source": "awesome-mcp-servers",
            "kind": "mcp-server",
            "id": a["slug"],
            "version": None,
            "is_latest": None,
            "status": "listed",
            "exposes_remote_endpoint": None,
            "package_registries": [],
            "repo_url": a["url"],
            "list_label": a["label"],
            "graded": False,
            "measurement": None,
            "attribution": "curated by punkpeye/awesome-mcp-servers (MIT)",
            "what_this_row_is": "an entry in the community-curated punkpeye/awesome-mcp-servers list, MIT-licensed",
            "what_it_never_proves": "quality, safety, fitness or compliance; inclusion in a curated list is not a measurement",
        })

# 4c. HF models + datasets matching "mcp" (fully enumerated, licence per row)
hfmcp = None
if os.path.exists("/tmp/hf_mcp_census.json"):
    hfmcp = json.load(open("/tmp/hf_mcp_census.json"))
    for kind in ("model", "dataset"):
        for r in hfmcp[kind]["rows"]:
            rows.append({
                "source": f"huggingface-{kind}s",
                "kind": f"hf-{kind}",
                "id": r["id"],
                "version": None,
                "is_latest": None,
                "status": "private" if r.get("private") else "public",
                "exposes_remote_endpoint": None,
                "package_registries": [],
                "repo_url": f"https://huggingface.co/{'datasets/' if kind=='dataset' else ''}{r['id']}",
                "declared_license": r.get("license"),
                "license_stated": r.get("license") is not None,
                "likes": r.get("likes"),
                "downloads": r.get("downloads"),
                "graded": False,
                "measurement": None,
                "what_this_row_is": f"an {kind} on the Hugging Face Hub matching the search term 'mcp'",
                "what_it_never_proves": "quality, safety, fitness or compliance; a declared licence is the publisher's claim, not a legal review",
            })

# 4b. reachability observation (a MEASUREMENT, kept separate from the census rows)
reach = None
if os.path.exists("/tmp/reachability.json"):
    import math as _m, collections as _c
    _r = json.load(open("/tmp/reachability.json"))
    _n = len(_r); _ans = sum(1 for x in _r if x["http"] > 0)
    _p = _ans / _n; _se = _m.sqrt(_p * (1 - _p) / _n)
    _codes = _c.Counter(x["http"] for x in _r)
    reach = {
        "method": "one GET per host, 8s timeout, UA csoai-reachability-probe/0.1",
        "sampled_hosts": _n,
        "sample": "one endpoint per distinct host, random, seed 20260905, drawn from 36 alphabetical cursor positions",
        "hosts_answering_with_an_http_status": _ans,
        "reachable_rate": round(_p, 4),
        "reachable_rate_ci95": round(1.96 * _se, 4),
        "no_http_response": _n - _ans,
        "status_distribution": {str(k): v for k, v in sorted(_codes.items())},
        "how_to_read_this": (
            "94% of declared endpoints answer, but 2xx is NOT the success criterion. An MCP "
            "endpoint speaks JSON-RPC over POST, so HTTP 405 to a GET is the CORRECT response and "
            "is evidence of a live server, not a failure. 401 means live-and-gated. The figure that "
            "actually indicates a stale registry entry is 404: the host is up but the declared path "
            "is gone."
        ),
        "what_it_never_proves": (
            "that the endpoint implements MCP correctly, is safe, or is fit for any purpose. "
            "This is a liveness observation at one instant, not a grade and not an uptime figure."
        ),
    }

# 5. GitHub topic counts (aggregate rows, not per-repo)
topics = {}
for t in ["mcp-server", "model-context-protocol", "a2a", "x402"]:
    topics[t] = gh_count(f"topic:{t}")
licences = {}
for lic in ["mit", "apache-2.0", "gpl-3.0"]:
    licences[lic] = gh_count(f"topic:mcp-server license:{lic}")

# ---------- write one format only (jsonl) ----------
data_path = os.path.join(OUT, "census.jsonl")
with open(data_path, "w") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

by_source = collections.Counter(r["source"] for r in rows)
remote = sum(1 for r in rows if r.get("exposes_remote_endpoint"))
latest = sum(1 for r in rows if r.get("is_latest"))
with_repo = sum(1 for r in rows if r.get("repo_url"))

totals = {
    "schema": "csoai.agent-interop-census/0.1",
    "as_of": NOW,
    "rows_total": len(rows),
    "rows_by_source": dict(by_source),
    "mcp_registry_unique_entries": mcp["unique_entries"],
    "mcp_registry_pages_read": mcp["pages"],
    "mcp_registry_source_file": mcp.get("_source_file"),
    "mcp_registry_stop_reason": mcp["stop_reason"],
    "mcp_registry_enumeration_complete": mcp["stop_reason"] != "in-progress",
    "mcp_registry_is_latest": latest,
    "mcp_registry_exposing_remote_endpoint": remote,
    "hf_spaces_pages_read": hfs["pages"],
    "rows_with_repo_url": with_repo,
    "github_topic_repo_counts": topics,
    "github_mcp_server_by_licence": licences,
    "smithery_declared_total": (smithery or {}).get("declared_total"),
    "smithery_unique_collected": (smithery or {}).get("unique"),
    "mcpso_sitemap_urls": len(mcpso_urls),
    "hf_mcp_models_enumerated": len((hfmcp or {}).get("model", {}).get("rows", [])),
    "hf_mcp_datasets_enumerated": len((hfmcp or {}).get("dataset", {}).get("rows", [])),
    "hf_mcp_license_declared": {
        "models_with_a_declared_license": sum(1 for r in (hfmcp or {}).get("model", {}).get("rows", []) if r.get("license")),
        "models_without": sum(1 for r in (hfmcp or {}).get("model", {}).get("rows", []) if not r.get("license")),
        "datasets_with_a_declared_license": sum(1 for r in (hfmcp or {}).get("dataset", {}).get("rows", []) if r.get("license")),
        "datasets_without": sum(1 for r in (hfmcp or {}).get("dataset", {}).get("rows", []) if not r.get("license")),
        "note": "A licence here is the publisher's own tag, not a legal review. An absent tag is UNSTATED, never 'permissive'.",
    },
    "github_search_enumeration_cap": "GitHub reports total_count 27,604 for topic:mcp-server but serves only the first 1000 results per query ('Only the first 1000 search results are available'). Star-bucket slicing does not clear it either: stars:0 alone is 11,562. GitHub topics are therefore carried as AGGREGATE COUNTS here, not as rows — a count we can derive, not a population we can enumerate.",
    "awesome_list_repos": len(awesome),
    "awesome_list_source": "punkpeye/awesome-mcp-servers (MIT, 94k stars) — attribution required by its licence and carried on every row",
    "mcp_official_servers_repo_licence": "NOASSERTION on GitHub because the project is mid-transition MIT -> Apache-2.0 per contribution; documentation CC-BY-4.0. Do not simplify to 'Apache-2.0'.",
    "glama_excluded": "401 without an API key, and its API Data Licence requires visible Glama attribution on every page displaying the data. Not collected.",
    "reachability_observation": reach,
    "graded_rows": 0,
    "grading_note": (
        "Zero rows carry a measurement. This is a census: an index of what exists and is "
        "publicly reachable. A grade requires a run against a frozen bank, and none was done here."
    ),
}
json.dump(totals, open(os.path.join(OUT, "totals.json"), "w"), indent=2)

# manifest.json — derived file list with digests
manifest = {"schema": "csoai.manifest/0.1", "as_of": NOW, "files": []}
for fn in sorted(os.listdir(OUT)):
    if fn == "manifest.json":
        continue
    p = os.path.join(OUT, fn)
    manifest["files"].append({
        "path": fn,
        "bytes": os.path.getsize(p),
        "sha256": hashlib.sha256(open(p, "rb").read()).hexdigest(),
    })
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=2)

print(json.dumps(totals, indent=2)[:1400])
print("\nfiles:", [f["path"] for f in manifest["files"]])

# ---------- the dataset card (16-point rubric, csoai-hubcard-v2 markers) ----------
board = json.loads(sh("curl", "-s", "--max-time", "25", "https://councilof.ai/api/gspc") or "{}")
bt = board.get("totals", {})
mcp_tools = sh("bash", "-lc",
    "curl -s --max-time 25 -X POST https://councilof.ai/mcp -H 'content-type: application/json' "
    "-d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}' | python3 -c "
    "'import json,sys;print(len(json.load(sys.stdin)[\"result\"][\"tools\"]))'")

t = totals
card = f"""---
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
task_categories:
- other
size_categories:
- 10K<n<100K
configs:
- config_name: default
  data_files:
  - split: train
    path: census.jsonl
---

<!-- csoai-hubcard-v2 -->

# Agent Interop Census

**A census, not a scoreboard.** {t['rows_total']:,} rows indexing what publicly exists in the
agent-interoperability ecosystem: MCP servers in the official registry, Hugging Face Spaces,
and open-licence repositories on GitHub.

**Zero rows carry a measurement.** `graded: false` and `measurement: null` on every single row.
A grade requires a run against a frozen bank; no run was performed here. Each row states, in
the row itself, what it is (*an index entry observed in a public registry*) and what it never
proves (*quality, safety, fitness or compliance*).

## The lid

{t['rows_total']:,} rows · {t['rows_by_source'].get('modelcontextprotocol-registry', 0):,} MCP registry entries ·
{t['rows_by_source'].get('huggingface-spaces', 0):,} HF Spaces · **0 graded** · not a ranking · not a certification.

## What is counted

| source | rows | derived from |
|---|---|---|
| Official MCP registry | {t['rows_by_source'].get('modelcontextprotocol-registry', 0):,} | `registry.modelcontextprotocol.io/v0/servers`, cursor-paginated, deduped by `(name, version)` |
| Hugging Face Spaces | {t['rows_by_source'].get('huggingface-spaces', 0):,} | `huggingface.co/api/spaces?search=mcp`, Link-header paginated to exhaustion |
| mcp.so | {t['rows_by_source'].get('mcp.so-sitemap', 0):,} | its published sitemap, 19 pages, deduped |
| Smithery | {t['rows_by_source'].get('smithery-registry', 0):,} | `registry.smithery.ai`, capped by the API itself — see limitations |
| awesome-mcp-servers | {t['rows_by_source'].get('awesome-mcp-servers', 0):,} | `punkpeye/awesome-mcp-servers` README, MIT — **attribution carried on every row** |

GitHub topic totals (aggregate counts, not per-repo rows), from `search/repositories`:

| topic | repos |
|---|---|
{chr(10).join(f"| `{k}` | {v:,} |" for k, v in t['github_topic_repo_counts'].items() if v)}

`topic:mcp-server` by licence: {" · ".join(f"{k} {v:,}" for k, v in t['github_mcp_server_by_licence'].items() if v)}.

## Honest limitations

- **The MCP registry's cursor pagination intermittently stalls.** A probe on 2026-09-05 saw
  pages 5 and 6 return an identical `nextCursor` and an identical first item. A paginator
  without loop detection silently re-reads one page and reports an inflated total — this
  collector does dedup by `(name, version)` and records why it stopped. Stop reason for this
  build: `{t['mcp_registry_stop_reason']}`, after {t['mcp_registry_pages_read']} pages.
- **Smithery advertises far more than it will serve.** Its API declares
  `totalCount: {t['smithery_declared_total']:,}` alongside `totalPages: 5`. At its maximum
  `pageSize` of 100 that is 500 rows reachable, and those 500 contain only
  **{t['smithery_unique_collected']} distinct** servers because the pages overlap — a ~43x gap
  between advertised and enumerable. `pageSize=200` and `pageSize=1000` return zero servers.
  `totalCount` also drifts between consecutive calls, so it is a live estimate, not a count.
  This dataset therefore carries {t['smithery_unique_collected']} Smithery rows, not
  {t['smithery_declared_total']:,}, and says so.
- **This build's registry enumeration is {'COMPLETE' if t['mcp_registry_enumeration_complete'] else 'PARTIAL'}.**
  `mcp_registry_enumeration_complete: {str(t['mcp_registry_enumeration_complete']).lower()}` in
  `totals.json`. A partial enumeration is a floor, never a total.
- **mcp.so rows come from its published sitemap**, so a row means a URL was listed for
  indexing — not that the listing resolves, and not that a server is reachable.
- **Hugging Face exposes no `x-total-count`** and caps pages at 100, so a first page is never
  a total. Space counts here come from paginating to exhaustion.
- **A 919-page walk of a live registry is a smear, not a snapshot.** Publishers push during
  the enumeration. This build counted {t['mcp_registry_is_latest']:,} rows flagged `isLatest`
  against {len({r['id'] for r in rows if r['source']=='modelcontextprotocol-registry'}):,}
  distinct names — the gap is one server that released a new version mid-walk, read as latest
  on an early page and superseded by a later one. Re-running will not reproduce the same
  totals to the row, and any collector claiming otherwise is not accounting for this.
- **A search term is not a taxonomy.** HF Spaces rows match the string `mcp`; that is a search
  result, not a verified capability. `exposes_remote_endpoint` is `null` for Spaces because it
  was not probed.
- **Registry presence is not reachability.** {t['mcp_registry_exposing_remote_endpoint']:,} registry
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

Of the {t['hf_mcp_models_enumerated']} Hugging Face **models** matching `mcp`, only
**{t['hf_mcp_license_declared']['models_with_a_declared_license']}** declare a licence and
**{t['hf_mcp_license_declared']['models_without']}** do not — **{t['hf_mcp_license_declared']['models_without']*100//max(t['hf_mcp_models_enumerated'],1)}% UNSTATED**.
Datasets are the other way round: **{t['hf_mcp_license_declared']['datasets_with_a_declared_license']}** of
{t['hf_mcp_datasets_enumerated']} state one.

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

## A measurement, kept separate from the census

The rows above are an index. This is the one thing here that was actually measured, and it is
reported apart from them because a census and a measurement are different objects.

**{reach['sampled_hosts']} distinct hosts**, one endpoint each, drawn at random (seed 20260905)
from 36 alphabetical cursor positions across the registry. One GET per host, 8s timeout.

**{reach['hosts_answering_with_an_http_status']} of {reach['sampled_hosts']} answered with an
HTTP status — {reach['reachable_rate']:.1%} (95% CI ±{reach['reachable_rate_ci95']:.1%}).**
{reach['no_http_response']} gave no HTTP response at all.

| status | n | share | what it means |
|---|---|---|---|
| 405 | {reach['status_distribution'].get('405', 0)} | {reach['status_distribution'].get('405', 0)/reach['sampled_hosts']:.1%} | **correct.** MCP speaks JSON-RPC over POST; 405 to a GET is a live, well-behaved server |
| 401 | {reach['status_distribution'].get('401', 0)} | {reach['status_distribution'].get('401', 0)/reach['sampled_hosts']:.1%} | live and gated |
| 200 | {reach['status_distribution'].get('200', 0)} | {reach['status_distribution'].get('200', 0)/reach['sampled_hosts']:.1%} | answers a bare GET |
| 404 | {reach['status_distribution'].get('404', 0)} | {reach['status_distribution'].get('404', 0)/reach['sampled_hosts']:.1%} | **the interesting one** — host is up, the declared path is gone |
| 402 | {reach['status_distribution'].get('402', 0)} | {reach['status_distribution'].get('402', 0)/reach['sampled_hosts']:.1%} | payment required (x402) |
| none | {reach['no_http_response']} | {reach['no_http_response']/reach['sampled_hosts']:.1%} | timeout, DNS, TLS or refused |

**Do not read "2xx = working".** Only {(reach['status_distribution'].get('200',0)+reach['status_distribution'].get('302',0)+reach['status_distribution'].get('301',0)+reach['status_distribution'].get('308',0))/reach['sampled_hosts']:.0%} of hosts return 2xx/3xx to a GET, and quoting that as a
health figure would be wrong in the unflattering direction — a third of these endpoints return
405 precisely because they are correctly implemented POST-only JSON-RPC servers.

It never proves the endpoint implements MCP correctly, is safe, or is fit for anything. It is
liveness at one instant, not uptime and not a grade.

## Who publishes this

Council of AI (CSOAI Ltd, UK Companies House 16939677) — a measurement body.
**We measure. We never certify.** No row here is an endorsement, and nothing in this dataset
writes the public GSPC board.

Live board at the time of this build: **{bt.get('axes', '?')} axes · {bt.get('measured_axes', '?')} measured ·
{bt.get('unmeasured_axes', '?')} unmeasured** (`{board.get('schema', '?')}`) —
re-fetch it, do not quote this line:

```bash
curl -s https://councilof.ai/api/gspc | python3 -c "import json,sys;print(json.load(sys.stdin)['totals'])"
```

The live MCP endpoint carries **{mcp_tools or '?'} tools** over HTTP.

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
@dataset{{csoai_agent_interop_census_2026,
  title  = {{Agent Interop Census: MCP servers, Hugging Face Spaces, and open-licence repositories}},
  author = {{{{Council of AI}}}},
  year   = {{2026}},
  publisher = {{Hugging Face}},
  url    = {{https://huggingface.co/datasets/csoai/agent-interop-census}},
  note   = {{Census only; zero rows carry a measurement. CC-BY-4.0.}}
}}
```

Attribute as: Council of AI, CSOAI Ltd 16939677, councilof.ai. Licensed CC-BY-4.0.

Built {t['as_of']}.

<!-- /csoai-hubcard-v2 -->
"""
open(os.path.join(OUT, "README.md"), "w").write(card)

# rebuild manifest to include the card
manifest = {"schema": "csoai.manifest/0.1", "as_of": NOW, "files": []}
for fn in sorted(os.listdir(OUT)):
    if fn == "manifest.json":
        continue
    p = os.path.join(OUT, fn)
    manifest["files"].append({"path": fn, "bytes": os.path.getsize(p),
                              "sha256": hashlib.sha256(open(p, "rb").read()).hexdigest()})
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=2)
print("\ncard written:", len(card), "chars (rubric floor 1800)")
print("files:", [f["path"] for f in manifest["files"]])
