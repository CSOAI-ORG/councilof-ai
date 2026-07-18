# meok-sequence-lookup-mcp

> **Protein + structure sequence lookup MCP.** Real UniProt REST + RCSB PDB.
> Ed25519-signed receipts. Hermetic by default (offline tests, live at call
> time). MIT.

A [Model Context Protocol](https://modelcontextprotocol.io/) server that wraps
two public bioinformatics APIs and returns every result wrapped in an
**Ed25519-signed envelope** so a downstream auditor can verify the response
was produced by this build of the server with the public key in
`meok_sequence_lookup_mcp.server.ISSUER_PUBLIC_KEY_HEX`.

It does **not** interpret, annotate, or recommend — it returns public records
verbatim. Downstream tools must not present the outputs as scientific advice.

## Honesty register (read first)

This MCP is part of **MEOK AI Labs (CSOAI LTD)** research tooling.
What this MCP does:

- wraps the **real, public, free** UniProt REST API and RCSB PDB Data API
  (no mock data);
- signs every result with **Ed25519** (so a downstream auditor can verify
  provenance — this is **not** a certification, an attestation body, or a
  scientific-validity claim);
- emits clear **rate-limit + attribution** notes for the public APIs it wraps.

What this MCP does **not** claim:

- it is **not** certified by any scientific-validity, regulatory, or
  accreditation body;
- it does **not** provide free compute credits, free-tier access, or
  partnership terms of any kind (those are commercial questions for the
  owner of MEOK Labs);
- it is **not** affiliated with, endorsed by, or sponsored by the UniProt
  Consortium, the RCSB PDB, the Worldwide Protein Data Bank, or any other
  public scientific consortium;
- it provides **no biological / structural interpretation** — results are
  returned verbatim from the source API.

## The 5 tools

| # | Tool | Source API | Purpose |
|---|------|-----------|---------|
| 1 | `uniprot_search` | UniProt REST `/uniprotkb/search` | Search UniProtKB by gene / protein / organism / free-text query. |
| 2 | `uniprot_fetch` | UniProt REST `/uniprotkb/{accession}` | Fetch one UniProtKB entry by accession (e.g. `P04637`). |
| 3 | `pdb_search` | RCSB PDB `/search` (GraphQL-style REST) | Search PDB by text, sequence identity, or structure attributes. |
| 4 | `pdb_fetch` | RCSB PDB Data API `/rest/v1/core/entry/{pdb_id}` | Fetch one PDB entry record (metadata + audit). |
| 5 | `cross_link_uniprot_pdb` | both APIs | Given a UniProt accession, find any PDB IDs in its cross-references; given a PDB ID, find UniProt accessions in `entity_poly` + `rcsb_pdbx_protein_upkb_mapping`. |

Every tool returns a signed envelope:

```json
{
  "status": "ok",
  "tool": "uniprot_search",
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
from meok_sequence_lookup_mcp.server import verify_envelope, ISSUER_PUBLIC_KEY_HEX
verify_envelope(envelope, envelope["signature"])  # True / False
```

## Install

```bash
cd meok-sequence-lookup-mcp
pip install -e ".[dev]"
```

## Run

```bash
# As a stdio MCP server (the typical host):
python -m meok_sequence_lookup_mcp.server
```

## Test

```bash
cd meok-sequence-lookup-mcp
pytest -q
```

Tests are hermetic — they do not call the public APIs. To exercise the live
APIs, run `pytest --live`.

## Attribution

This MCP wraps:

- **UniProt REST API** — UniProt Consortium (EBI / SIB / PIR).
  https://www.uniprot.org/help/programmatic_access
- **RCSB PDB Data API** — RCSB Protein Data Bank.
  https://data.rcsb.org/

Per the providers' terms, this MCP identifies itself as
`meok-sequence-lookup-mcp/0.1.0` in the `User-Agent` header.

## Rate limits (the honest numbers)

- UniProt REST API: no documented hard ceiling, but a polite `User-Agent`
  + non-parallel batch is recommended. The API returns HTTP 429 when
  overloaded.
- RCSB PDB Data API: documented at https://www.rcsb.org/docs/programmatic-access;
  the API returns HTTP 429 when overloaded.

The MCP **respects these limits**: it sleeps between sequential calls and
emits the observed `x-ratelimit-*` headers (when present) into the envelope
metadata.

## License

MIT — see `LICENSE`.