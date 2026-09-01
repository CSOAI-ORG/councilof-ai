# AX doctrine — agent-native CouncilOS — 1 Sep 2026

**Status:** owner AX leftover. Docs + thin UI chrome only. No new products. No second root writer. No wrangler. No Cloud Agents.

## Thesis

CouncilOS is **agent-native**. Agents are first-class consumers of the same public GETs the human UI uses:

| Endpoint | Role |
|---|---|
| `GET /api/gspc` | Living board (**22 · 15 · 7**) |
| `GET /root.json` | Public merkle root + leaf digests |
| `GET /api/xrpl` | XRPL attest reader over the committed public root |

Human UI is a **thin shell** over those GETs. AG-UI / City host (`/os`, via `AgUiBridge` → `/os`) presents live GSPC inside streams via `GspcStreamCard` — presentation only, **not** a seventh evidence atom.

## Six arms only

`board` · `verify` · `cards` · `space` · `assess` · `harness`

No fill-empty. No second board. No MEASURED-from-listing. No certify.

## Plugin surfaces (additive)

Master plugin grammar remains **card-v0**. Surfaces add:

- `owasp.control` — informative ASI01–ASI10 crosswalk leaf (cite only; no endorsement)
- `cobol.legacy` — COBOL Bridge (`CSOAI-ORG/cobol-bridge-mcp`) Layer-0 leaf on the **same** root

## Clients

Microsoft Agent Framework + Channels = supported **MCP client**, not competitor. Harness authority stays ours.

## Cite-only externals

- OWASP Agentic Top 10 (ASI01–ASI10) — map only; no endorsement
- W3C Agent Conformance and Benchmarking Community Group — Nick joins; cite only; **no "we conform"**

*End.*
