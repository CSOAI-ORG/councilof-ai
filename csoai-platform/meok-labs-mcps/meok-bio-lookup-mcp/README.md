# meok-bio-lookup-mcp

> **Biomedical literature + clinical-trial lookup MCP.** Real PubMed
> E-utilities (NCBI) + ClinicalTrials.gov v2. Ed25519-signed receipts.
> Hermetic by default (offline tests, live at call time). MIT.

This is a [Model Context Protocol](https://modelcontextprotocol.io/) server
that wraps two public biomedical APIs and returns every result wrapped in an
**Ed25519-signed envelope** so a downstream regulator / auditor can verify
the response was produced by this build of the server with the public key
in `meok_bio_lookup_mcp.server.ISSUER_PUBLIC_KEY_HEX`.

It does **not** interpret, summarise, or recommend — it returns public records
verbatim. Downstream tools must not present the outputs as medical advice.

## Honesty register (read first)

This MCP is part of **MEOK AI Labs (CSOAI LTD)** research tooling.
What this MCP does:

- wraps the **real, public, free** PubMed E-utilities and ClinicalTrials.gov
  v2 APIs (no mock data);
- signs every result with **Ed25519** (so a downstream auditor can verify
  provenance — this is **not** a certification, an attestation body, or a
  clinical-validity claim);
- emits clear **rate-limit + attribution** notes for the public APIs it wraps.

What this MCP does **not** claim:

- it is **not** certified by any clinical-validity, regulatory, or
  accreditation body;
- it does **not** provide free compute credits, free-tier access, or
  partnership terms of any kind (those are commercial questions for the
  owner of MEOK Labs);
- it is **not** affiliated with, endorsed by, or sponsored by the U.S.
  National Library of Medicine, the National Institutes of Health, or any
  other public health authority;
- it provides **no clinical interpretation** — results are returned verbatim
  from the source API.

## The 5 tools

| # | Tool | Source API | Purpose |
|---|------|-----------|---------|
| 1 | `pubmed_search` | NCBI E-utilities `esearch.fcgi` | Resolve a free-text query into a list of PubMed IDs (PMIDs). |
| 2 | `pubmed_fetch` | NCBI E-utilities `efetch.fcgi` | Fetch full bibliographic records (title, authors, abstract, MeSH) for a list of PMIDs. |
| 3 | `clinicaltrials_search` | CT.gov v2 `/studies` | Search ClinicalTrials.gov by condition, intervention, status, sponsor, or free text. |
| 4 | `clinicaltrials_fetch` | CT.gov v2 `/studies/{NCT}` | Fetch one trial by its NCT ID. |
| 5 | `cross_link_pmid_nct` | both APIs | Given a PMID, find any NCT IDs referenced by the paper; given an NCT ID, find any PMIDs listed as references. |

Every tool returns a signed envelope:

```json
{
  "status": "ok",
  "tool": "pubmed_search",
  "input": {...},
  "data": {...},
  "issued_at": "2026-07-05T10:00:00Z",
  "kid": "meok-issuer-<hex>",
  "issuer": "meok.ai",
  "signature": "<hex Ed25519>"
}
```

Verify offline:

```python
from meok_bio_lookup_mcp.server import verify_envelope, ISSUER_PUBLIC_KEY_HEX
verify_envelope(envelope, envelope["signature"])  # True / False
```

## Install

```bash
cd meok-bio-lookup-mcp
pip install -e ".[dev]"
```

## Run

```bash
# As a stdio MCP server (the typical host):
python -m meok_bio_lookup_mcp.server
```

## Test

```bash
cd meok-bio-lookup-mcp
pytest -q
```

Tests are hermetic — they do not call the public APIs. They exercise the
formatter, the Ed25519 envelope round-trip, the cache behaviour, and the
offline tools. To exercise the live APIs, run `pytest --live`.

## Attribution

This MCP wraps:

- **PubMed E-utilities** — U.S. National Library of Medicine, NIH.
  https://www.ncbi.nlm.nih.gov/books/NBK25500/
- **ClinicalTrials.gov v2 API** — U.S. National Library of Medicine, NIH.
  https://clinicaltrials.gov/data-api/about-api

Per the NCBI terms (https://www.ncbi.nlm.nih.gov/home/about/policies/),
this MCP identifies itself as `meok-bio-lookup-mcp/0.1.0` in the
`User-Agent` / `tool` query-string parameter.

## Rate limits (the honest numbers)

- PubMed E-utilities (no API key): **3 requests/sec, max**.
- ClinicalTrials.gov v2: documented at ~**50 requests/min**, with a
  hard ceiling above which the API returns HTTP 429.

The MCP **respects these limits**: it sleeps between sequential calls and
emits the observed `x-ratelimit-*` headers (when present) into the envelope
metadata so the caller can see the budget.

## License

MIT — see `LICENSE`.