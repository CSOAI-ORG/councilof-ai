# Query retained research evidence

`research_cycle_query.py` is an optional read-only consumer of the existing
research-cycle packet. It does not replace `research_cycle.py`, its native
`csoai.evidence-event/0.1` records, its changed-source queue, its renderers,
or any policy, approval, grading, signing, publishing or scheduling service.

## Input and verification

Use a cycle created by the existing adapter described in `RESEARCH-CYCLE.md`.
Select its manifest SHA-256 independently of the received packet. The query
reader takes one bounded byte snapshot and passes it through the existing
canonical packet verifier, which rederives the events and carriers. It does
not import code from a packet. It verifies the source again before returning.

An intact manifest is not proof of authenticated authorship. A `CONSISTENT`
repository-pin comparison is not a runtime qualification, a product-quality
judgment or an approval. `UNMEASURED` and `UNCHECKABLE` remain those states;
retrieval never fills their missing measurement values.

## Python integration

```python
from research_cycle_query import query_cycle

result = query_cycle(
    selected_cycle_directory,
    independently_selected_manifest_sha256,
    "UPSTREAM_CHANGED",
    visible_event_ids=existing_authority.current_visible_event_ids,
    states=["DIVERGENT"],
    limit=3,
)
```

`existing_authority.current_visible_event_ids` above is an interface example,
not an implemented or preconfigured authority. The host must authenticate the
caller and bind the callback to that caller, purpose and current source-owner
policy. The callback accepts no query-supplied permission flags and returns an
explicit collection of native event IDs. It must fail rather than invent an
allow-list if the authority is unavailable. An empty collection means no
visible events. Duplicate, malformed and unknown IDs are rejected.

A remote caller must not be allowed to supply a Python callback or a local
scope-file path. This CLI/module is not an unauthenticated HTTP or MCP service.
It is intended for a trusted host that is already permitted to load the
selected cycle. It is not an OS sandbox, cross-tenant storage isolation, or a
constant-time side-channel defence.

## Local inspection

For an operator who is already permitted to read the cycle, prepare a JSON
array of exact event IDs to inspect. The file is a selection, not a credential:

```json
["sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"]
```

```sh
python3 packages/evidence-fabric/research_cycle_query.py /private/cycle \
  --expected-manifest INDEPENDENTLY_SELECTED_MANIFEST_SHA256 \
  --allow-events /private/selected-event-ids.json \
  --query 'UPSTREAM_CHANGED' --state DIVERGENT --limit 3
```

The example ID is illustrative, not an actual event. IDs must exist in the
verified input. Query text is data: it is never evaluated as a command, a tool
request or a model instruction. No network or model calls are made.

## Ranking and output

Visibility and optional native-state filters are applied **before** selecting
the top-k window. ASCII-alphanumeric lowercase BM25 uses k1=1.2, b=0.75 and
statistics from that filtered set only. Event IDs break ties deterministically.
The projection is rebuilt per query; it is not a new persistent database.

Output contains the unchanged native events and ordinal ranks. A rank is not a
confidence, safety or truth score. `cycle_as_of` stays separate from
`queried_at`; a new query does not refresh old observations. `NO_VISIBLE_MATCH`
means this selection has no match, not that no evidence exists anywhere.

The callback is consulted before ranking, before source revalidation and again
before return. Any change fails closed. This deliberately favours refusal over
returning a partially changed selection. Rechecks do not establish atomic
revocation after return, distributed consistency, or source freshness beyond
the retained cycle. The host must supply those separate guarantees.

## Bounds and costs

The existing cycle reader's file, packet and catalogue limits still apply.
Queries are at most 4,096 UTF-8 bytes; k is an integer from 1 to 20. The local
scope file is a bounded regular file (200,000 bytes maximum), and its final
symlink and non-regular file are rejected. This does not protect untrusted
parent directories. Input and source errors return a generic refusal from the
CLI rather than printing paths or arbitrary source/provider messages.

Full packet verification and event rederivation occur twice. That cost is not
assumed free and no throughput, latency or memory advantage is claimed. A
representative authenticated workload must measure the complete lifecycle
before any service integration or production adoption.

## Offline tests

```sh
python3 -B -m unittest discover -s packages/evidence-fabric/tests \
  -p 'test_research_cycle*.py' -v
```

The query-specific controls use synthetic repositories and local visibility
callbacks. They test preservation of canonical states/values, eligibility
before top-k, denied/changed scope, state filters, byte and rehashed-accounting
tampering, changed readers, mutation during retrieval, symlinks, query bounds,
empty matches, literal query handling, packet roundtrip, no-network behaviour
and the CLI's mandatory scope argument. They are not authenticated user tests,
new measurements of upstream projects, or permission to deploy this adapter.

No private catalogue or generated evidence packet belongs in source fixtures.
Integrate through the existing source-owner review and protected release path.
