# Option A — child API keys for partners

**Scope:** white-label / “Powered by Council OS” (Option A). Not tokenization (Option B) or issuer role (Option C).

## Principles

1. **Never sell grades** — child keys meter machine access and signed verdict consumption; they do not unlock rankings, placements, or `measured_score` SKUs.
2. **Verify free forever** — any card our key signs must remain independently verifiable at `/gspc-verify` without the partner key.
3. **Attestation ≠ tokenization ≠ ownership** — keys authorize measurement API calls, not minting or custody of underlying assets.
4. **Child keys are scoped** — per-partner namespace, rate limits, and allowed surfaces (e.g. `gspc_board`, `instruments_catalog`); no blanket admin.

## Proposed shape (design only — not live)

| Field | Intent |
|-------|--------|
| `parent_key_id` | Council OS root (custody-held) |
| `child_key_id` | Partner-scoped UUID |
| `allowed_tools` | Explicit MCP tool allowlist |
| `badge` | Optional `powered-by-council-os` embed |
| `environment` | `staging` \| `production` (production gated on counsel + custody) |

## Hard refuses

- Issue a child key that implies MEASURED labour/economy indices (`measured_score` must stay `null`).
- Issue a child key that publishes demo-play targets (e.g. JMWH demo-only) as production MEASURED mainnet.
- Price a key tier as “grade access” — HO.2 violation.

## Surfaces

- Product: `/powered-by`
- Badge: `/badges/powered-by-council-os.svg`
- Runbook: `docs/agent-runbook.md` · MCP: `POST /api/mcp`
