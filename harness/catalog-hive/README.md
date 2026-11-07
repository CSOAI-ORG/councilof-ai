# Catalog Hive intake

The hive makes heterogeneous public directories searchable through one
provenance-preserving candidate contract. It does **not** merge source code,
trust scores, or execution rights.

## Implemented snapshot adapters

- `ard_manifest`: Cisco AI Catalog / Agent Directory Service ARD `entries`.
- `mcp_registry`: official MCP Registry `servers` page; preserves its opaque
  `metadata.nextCursor` for the page orchestrator.
- `huggingface_hub`: public Hub model, dataset, or Space API JSON page.

All adapters consume saved JSON snapshots. This makes the exact source bytes,
fetch time, and page digest reviewable before the index changes. Fetchers should
be source-specific, rate-limited, host-pinned and incremental; never dereference
card-provided URLs during ingestion.

## Source inventory and source classes

`catalog-sources.json` is the onboarding register. It separates three states:

1. `ingest_ready`: public source + implemented parser. This does **not** mean
   fetched or populated in a live board.
2. `catalogued_not_ingest_ready`: source exists, but the public interface,
   access scope, or record semantics still need validation. This includes
   NVIDIA NGC, Red Hat Ecosystem Catalog, Oracle Marketplace, and public
   discovery pages; Palantir, Google Cloud, Oracle tenant assets, JFrog, and
   CrowdStrike operations are explicitly tenant-scoped where applicable.
3. `regulatory_sources`: official frameworks, policy indexes, and legal
   information. These must be versioned as documents/policy records, not
   normalized as runnable agents.

The hive intentionally does not add a generic scraper for every vendor page.
Each adapter needs a documented public API/export or a reviewed bounded page
capture, stable identifiers, pagination/rate-limit behavior, attribution, and
fixtures. A product marketplace, an AI model catalog, a public agent directory,
and an organization's private runtime inventory are different resource types.
Combining them without those distinctions would produce inflated counts and
false claims.

## Layer 0 / Harness X path

`catalog observation -> byte/source receipt -> normalized candidate ->
quarantine -> bounded, explicitly scoped test -> evidence review -> Layer 0
admission -> eligible GSPC observation`

Discovery does not call an endpoint. No credentials are harvested. Tenant
catalogs require owner-authorized, least-privilege connectors. A directory
listing, vendor certification, uptime badge, or source count is not itself a
GSPC measurement, safety verdict, or endorsement.

## Run

```sh
python3 intake.py mcp_registry page-0001.json \
  --source-uri 'https://registry.modelcontextprotocol.io/v0.1/servers?limit=100' \
  --out candidates.jsonl --receipt receipt.json
```

The resulting rows stay `QUARANTINED_DISCOVERY_ONLY`. Descriptions and metadata
are untrusted content; a separate operator-approved Harness X run may probe a
bounded sample. Only that run can create execution evidence, and only Layer 0's
admission process may decide whether any resulting observation is eligible for
GSPC. Catalogs overlap, so the merge step creates a unified discovery index and
links exact shared locators as review hints. It keeps each source observation
and digest; it never merges identity or trust:

```sh
python3 merge.py source-a.jsonl source-b.jsonl --out catalog-index.json
```

The merger fails closed if any row claims execution or GSPC measurement and
refuses to overwrite an input snapshot. Output is a local discovery artifact;
publication and Layer 0/SOV-X/GSPC integration are separate release gates.

The Cisco catalog's 3,087-card figure is now directly observed in the page UI,
but is not an observed manifest count from this intake run. On 28 September 2026 the Cisco page itself
displayed “3,087 AI cards indexed” and “3,087 results”; the pinned JSON manifest
fetch then failed at local DNS resolution, so no records were ingested. This is
a first-party UI observation, not a reconciled snapshot or CSOAI verification.

`../ard-intake/` is the Cisco-specific fetch and normalization path. Its
`event_projection.py` bridges matching fetch/intake receipts into the existing
Condor/GSPC CloudEvents contract as `SOURCE_CHANGED` only. It emits no
measurement, does not call catalog entries, and leaves admission, signing and
anchoring unattempted. The bridge is local and fixture-tested; it is not a live
SOV-X write, scheduled feed, or public dashboard integration.
