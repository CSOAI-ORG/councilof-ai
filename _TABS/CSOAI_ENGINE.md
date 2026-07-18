# CSOAI Engine — the one runtime under all six pillars (Stage 3 backbone)

> Companion to `SIX_PILLARS.md`. This is the **wiring contract**: the canonical
> endpoints every pillar consumes so CSOAI is the literal runtime, not a shared logo.
> Authored 2026-06-07. Verified-real endpoints are marked ✅ (tested this session).
> The hub wins on ownership; this doc wins on "where does a pillar call for X".

---

## The four engine services + their canonical homes

| Service | Canonical endpoint / artifact | Status |
|---------|-------------------------------|--------|
| **Signing (SIGIL)** | `meok-attestation-api` → `POST /sign` (API-key) | ✅ live (kid v1, v1.2.0) |
| **Verify (public trust anchor)** | `meok-attestation-api` → `POST /verify` + `GET /verify/{id}` + `GET /v/{id}` | ✅ live, **bug fixed this session** (object form now accepted) |
| **Verify (offline client)** | `CSOAI-ORG/meok-attestation-verify` — zero-dep HMAC verifier, pipe a cert → VALID/INVALID | ✅ exists |
| **Audit ledger** | `meok-attestation-api` → `GET /api/audit` — hash-chained, tamper-evident | ✅ live |
| **Identity / auth** | `meok-attestation-api` → `POST /provision` (derives key from Stripe session) + `derive_api_key(email,tier)` | ✅ live |
| **Billing** | `meok-attestation-api` → `POST /webhook` (Stripe `checkout.session.completed`) + `/payg/*` PAYG + the ACP checkout bridge | ✅ live |
| **Models** | CSOAI model routing — Ollama local / GCP VM councils (SOV3) | 🟡 exists, not centrally fronted |
| **Transport** | `meok-compliance-gateway` → streamable-HTTP `/mcp` for any MEOK MCP | ✅ live (smoke-tested `initialize→200`) |

**Key fact for every tab:** you do NOT build signing/verify/billing/audit. They exist
in `meok-attestation-api`. To make a pillar's evidence trustworthy, call `/sign`; to let
anyone check it, point them at `/verify` (or ship them `meok-attestation-verify`).

---

## Per-pillar wiring state → target (the Stage-3 to-do, by tab)

| Pillar | Today | Target | Whose lane |
|--------|-------|--------|-----------|
| SIGIL | IS the signer ✅ | — | CSOAI |
| COMPLIANCE LAYER | serves MCPs ✅ | gateway-served certs verify via the one `/verify` | CSOAI |
| LAW | crosswalk live; certs signed locally? | LAW results emit `/sign`-signed certs w/ `verify_url` | **MEOK ONE** (law*.py) |
| COUNCIL | votes live | council decisions emit SIGIL-signed records | CSOAI + MEOK ONE |
| DOME | renders map | map nodes link to live `/verify` proofs per product | **MEOK ONE** (web/dome) |
| MAP | topology data | feed DOME from registry + `_TOPOLOGY/` as one source | **MCP Fleet** + MEOK ONE |
| Identity | per-surface | one CSOAI account → all surfaces (provision spine exists) | CSOAI + MEOK ONE |
| Billing | 50-link sprawl ⚠️ | one ladder via the webhook/provision spine | CSOAI |

The CSOAI-lane cells are mine to close; the MEOK ONE / Fleet cells are handed off via
`INBOX.md` (they live in those tabs' codebases — touching them from here = the clobber
the hub forbids).

---

## MAP vs DOME — RULED 2026-06-07 (Nick delegated the call)

- **MAP = the terrain data layer** — the ecosystem topology + MCP registry (`_TOPOLOGY/`,
  registry manifests). One canonical graph of products / domains / dependencies.
- **DOME = the rendered World/constellation map surface** (`meok-one/.../web/dome`,
  `meok/ui/.../constellation`) that *draws* MAP and links each node to its live proof.
- One capability, two layers: MAP is the data, DOME is the picture. Build MAP once,
  DOME consumes it. (Reversible if you'd rather collapse them into one.)
