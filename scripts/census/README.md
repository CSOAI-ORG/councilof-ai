# Speed 0 Hub census

Cursor-preserving collector for a complete Hugging Face listing walk.
Metadata only. No weight download. No GPU. Every row is `DISCOVERED` /
`UNMEASURED`. A listing is not a grade.

```text
source listing
-> immutable source revision
-> artefact-manifest digest
-> lineage
-> runtime variant
-> GSPC measurement
```

## Commands

```bash
# 10,000-record restart test against the in-process Hub stand-in
python3 scripts/census/hub_census.py restart-test \
  --out-dir /tmp/hub-census-restart --total 10000

# Live 10,000-record restart test (authenticated Hub API)
python3 scripts/census/hub_census.py restart-test \
  --out-dir /tmp/hub-census-live-10k --total 10000 --live --page-size 1000

# Resume or start the complete baseline (do not stamp MEASURED)
python3 scripts/census/hub_census.py collect \
  --out-dir /tmp/hub-census-baseline --mode baseline --resume --page-size 1000

# Daily overlapping changed-model sweep
python3 scripts/census/hub_census.py collect \
  --out-dir /tmp/hub-census-delta --mode delta \
  --since 2026-08-30T00:00:00Z --overlap-hours 6

# Rewrite SUMMARY.json + sha256 of listings.jsonl (census digest, not a GSPC cell)
python3 scripts/census/hub_census.py digest --out-dir /tmp/hub-census-baseline

# Counts-only 22-axis buckets + lab/org register (synthetic Hub, no probes)
python3 scripts/census/hub_census.py collect \
  --out-dir /tmp/hub-census-counts --fresh --synthetic --synthetic-total 32 --limit 32 \
  --publish-dir public/interop/hf-census
```

Counts-only artifacts (`axis-sources.json`, `org-register.json`, `SUMMARY.json`)
live at `public/interop/hf-census/`. `n` is the unique id count of the fetch
that wrote the file. `n_measured` is 0. The org register is who-runs-what
(card links), never a lab grade. Agent-facing copy:

- https://councilof.ai/api/gspc
- https://councilof.ai/interop/x402-trust/latest.json
- https://councilof.ai/signed/HOW-TO-VERIFY.md

`cursor.json` stores the exact Hub `rel=next` URL after every page. A crash
re-fetches the current page; the seen-set skips ids already written.

The 31 Aug 2026 baseline digest is committed as
`public/signed/hub-census-baseline.json` (quoted by `/api/state` and
`/api/compute`) and `spaces/gspc-board/census-manifest.json`. Operator copy:
`scripts/census/baseline-2026-08-31.SUMMARY.json`. Do not commit `listings.jsonl`.

Hub webhooks are limited to 1,000 events/day and cannot replace this census.
SOV3 registration is out of band (port 3101).

## Census frame (`frame.py`) — every public agent-endpoint catalogue, read to exhaustion or labelled

```bash
python3 scripts/census/frame.py --out /evac-bulk/census-frame-YYYY-MM-DD   # ~10 min, 1 req/s
python3 scripts/census/frame.py --top20 --frame /evac-bulk/census-frame-YYYY-MM-DD   # plan only
python3 scripts/census/frame.py --self-test        # offline: truncated page -> null totals
python3 -m unittest scripts/census/test_frame.py scripts/census/test_reach.py   # offline
```

Sources: official MCP registry (`version=latest`, cursor), HF Spaces `filter=mcp-server`
(Link header), a2aregistry.org (offset, declared total), docker/mcp-registry (tree + tarball
of one commit), Smithery (anonymous cap: always PARTIAL). x402 bazaars are read by
`x402-bazaar-conformance.py`, not here.

Each source ends `EXHAUSTED`, `PARTIAL` or `FAILED`; `population_total` is `null` unless
`EXHAUSTED`, and the union total is `null` unless every source is. An error body, a non-200,
a cut page or a repeated cursor is never an end. Raw pages are kept gzipped under `raw/<source>/`
with per-page sha256 and a `page_set_sha256`. Outputs: `summary.json`, `endpoints.jsonl.gz`
(one row per canonical endpoint, with every catalogue that lists it), `entries.jsonl.gz`.
Every row is DISCOVERED / UNMEASURED. `--top20` joins every keyless reach signal
(`reach.py`: npm weekly downloads, PyPI 7-day downloads via pepy.tech, Docker Hub all-time
`pull_count` for docker.io images, Smithery `useCount` for the rows the anonymous API served)
and writes `plan-top20.json(l.gz)`; it contacts no endpoint. Signals are different units and are
never added: each endpoint is ordered by its standing within its own signal (`reach_pct`) and
`ranked_by` names the signal. Endpoints with no signal keep MCP-registry listing order and are
labelled `registry_order:*`. GitHub stars are not used (60 unauthenticated requests/hour; the
plan records how many hours that would take).

## Remote probe (`mcp-remote-probe.py`) — initialize + tools/list, nothing else

```bash
python3 scripts/census/mcp-remote-probe.py --plan DIR/plan-top20.jsonl.gz \
    --out /evac-bulk/census-probe-YYYY-MM-DD --budget-s 3600 --workers 32
python3 scripts/census/mcp-remote-probe.py --self-test   # fixtures + a broken grader that must FAIL
python3 -m unittest scripts/census/test_mcp_remote_probe.py   # 127.0.0.1 fixture servers only
```

Sends robots.txt (once per host), `initialize`, `notifications/initialized`, `tools/list`
(<= 5 pages) and a session `DELETE`; never `tools/call`, never a credential, never a payment,
never a `*.hf.space` request. One connection and >= 1 s between requests per host; one retry at
most (429/503 after Retry-After, or a reset). States: `RESPONDED`, `AUTH_REQUIRED`, `MCP_ERROR`,
`SSE_ENDPOINT_ONLY` (legacy SSE: a session would need a second connection, so initialize is not
sent), `NOT_MCP`, `UNREACHABLE`, `TIMEOUT`. `summary.json` is `PARTIAL` unless every planned
endpoint was attempted; its counts are over the attempted endpoints, never frame or population
totals. P1 of the effect-binding server probe (binding field names in tools/list schemas) is
reused read-only; its P2-P4 call tools and are not.

## HF Spaces (`hf-spaces-mcp-probe.py`) — runtime stage first; only RUNNING Spaces are contacted

```bash
python3 scripts/census/hf-spaces-mcp-probe.py --frame /evac-bulk/census-frame-YYYY-MM-DD \
    --out /evac-bulk/census-hf-spaces-YYYY-MM-DD --budget-s 3300 --workers 8
python3 -m unittest scripts/census/test_hf_spaces_mcp_probe.py   # fake Hub + fake Spaces on 127.0.0.1
```

`mcp-remote-probe.py` refuses `*.hf.space` because a request wakes a sleeping Space. This one reads
`runtime.stage` from the Hub API first (one `filter=mcp-server&expand[]=runtime` walk, then
`/api/spaces/<id>` again immediately before any contact) and sends the `mcp-remote-probe.py`
exchange only to a Space whose last read said `RUNNING` and whose sdk is `gradio`, at
`<host>/gradio_api/mcp/` (legacy fallback `/gradio_api/mcp/sse`), host from the API's
`host`/`subdomain` field. Every other stage (`SLEEPING`, `PAUSED`, `BUILD_ERROR`, ...) is the row's
state and the Space gets no request. The suite's control (a run without the stage check) must wake
the sleeping fixture; otherwise the never-wake assertions would be vacuous. Hub API paced at
<= 1.4 req/s and its `ratelimit` header obeyed.

## A2A cards (`a2a-card-probe.py`) — GET the card, check its signatures, send nothing else

```bash
python3 scripts/census/a2a-card-probe.py --frame /evac-bulk/census-frame-YYYY-MM-DD \
    --out /evac-bulk/census-a2a-YYYY-MM-DD
python3 -m unittest scripts/census/test_a2a_card_probe.py   # fixtures + per-run generated keys
```

For each a2aregistry listing: GET the listing's `wellKnownURI`, then `/.well-known/agent-card.json`
and the legacy `/.well-known/agent.json` at the origin, stopping at the first card. Hosts that
resolve to non-global addresses (loopback, RFC 1918, CGNAT/tailnet, link-local) are never contacted
(`NON_PUBLIC_ADDRESS`). Signatures: detached JWS over JCS(card without `signatures`); `VERIFIED` only
under a key the card itself points to (`jku`, embedded `jwk` = integrity only, or a `did:web` kid);
no pointer, an unreachable key, or a symmetric alg is `UNCHECKABLE`, never `VERIFIED`. No task,
message or JSON-RPC call is ever sent to an agent.

`read_state.py` is the shared fail-closed predicate; `build-agent-interop-census.py` uses it
(see `docs/measurement/CORRECTION-agent-interop-census-2026-09-25.md`).

## Rights gate (`rights_gate.py`): what we may do with each row, before any adapter or runner

```bash
python3 scripts/census/rights_gate.py --frame /evac-bulk/census-frame-YYYY-MM-DD \
    --out /evac-bulk/rights-gate-YYYY-MM-DD          # --github-sample <=50, --oci-sample 40
python3 -m unittest scripts/census/test_rights_gate.py   # fixtures only
```

This is the stage between Discovery and Adapter/Runner. Each frame row gets one decision for
each purpose. `MEASURE_PUBLIC` (probing a publicly advertised endpoint's discovery surface) does
not depend on the licence. `REUSE_CODE`, `VENDOR` and `TRAIN` follow the most restrictive
licence category found in the evidence. Every decision is `ALLOWED`, `RESTRICTED(reason)` or
`UNKNOWN(reason)`, and **UNKNOWN never counts as ALLOWED**. Non-commercial licences are
RESTRICTED for reuse, vendoring and training. Licence evidence comes from the package
registries' declared licences (npm `license`, PyPI `license_expression`/`license`/classifiers,
the NuGet nuspec, crates.io) and from HF Space cards. OCI `org.opencontainers.image.licenses`
labels are read for a capped sample. GitHub's keyless licence API (60 requests an hour) is used
only for a seeded sample of at most 50 repositories. That sample also measures how often a
repository's licence file disagrees with its package metadata. Catalogue terms are recorded
beside the decisions; they govern the listing text, not the listed code. The runner keeps its
own exclusions (the probe never requests `*.hf.space`). The gate is a declared-licence policy,
not legal advice.
