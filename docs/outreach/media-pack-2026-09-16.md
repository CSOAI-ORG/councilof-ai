# CSOAI Media Pack — 2026-09-16

**Prepared by:** Editorial conversion lane (Claude)
**Verified against:** live endpoints at councilof.ai, 2026-09-16 UTC
**Rule:** every number below is fetchable; none are typed.

---

## One-line description

CSOAI independently measures public AI claims and system behaviour,
publishes signed machine-readable evidence, preserves corrections, and
makes the evidence reusable through web, MCP, A2A and x402 interfaces.

---

## Key numbers (all live, all fetchable)

| Fact | Value | How to verify |
|---|---|---|
| Signed measurement cards | 305 | `curl -s https://councilof.ai/root.json \| jq .card_count` |
| GSPC axes measured | 22 | `curl -s https://councilof.ai/api/gspc \| jq .totals` |
| MCP servers probed | 500 | `curl -s https://councilof.ai/interop/mcp-trust/latest.json \| jq .counts.total` |
| x402 Bazaar hosts probed | 100 | `curl -s https://councilof.ai/interop/x402-trust/latest.json \| jq .counts.total` |
| MCP tools served | 13 (9 free, 4 metered) | `curl -s -X POST https://councilof.ai/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \| jq '.result.tools \| length'` |
| Card root as_of | 2026-09-15 | `curl -s https://councilof.ai/root.json \| jq .as_of` |
| Verification | Free, loginless | `python3 tools/verify/csoai_verify.py <card-url>` |
| Entity | CSOAI Ltd, UK Companies House 16939677 | https://find-and-update.company-information.service.gov.uk/company/16939677 |

---

## What CSOAI does

1. **Measures** AI systems against frozen, published instruments drawn from statute.
2. **Signs** every result with Ed25519 under a published DID.
3. **Publishes** the evidence — signed cards, Merkle root, correction ledger.
4. **Discloses** what it cannot measure — UNMEASURED cells stay visible.
5. **Never certifies** — measurement is not a grade, pass/fail, or compliance verdict.

---

## What CSOAI does NOT do

- Certify, accredit, or issue conformity assessments
- Sell grades, scores, or pass/fail verdicts
- Claim "first," "only," or "independently proven adoption" without evidence
- Name non-conformant parties in public artifacts (counts only by doctrine)

---

## Available evidence artifacts

| Artifact | URL | What it proves |
|---|---|---|
| Live board | GET /api/gspc | 22 axes, measured/slot counts, per-axis accuracy |
| Signed cards | /signed/cards/*.json | Ed25519-signed measurement per model × axis |
| Public root | /root.json | Merkle root over 305 cards, OTS-anchored |
| MCP trust census | /interop/mcp-trust/latest.json | 500 MCP servers probed, auth posture counts |
| x402 Bazaar census | /interop/x402-trust/latest.json | 100 x402 hosts, conformance probe |
| Refutation ledger | /refutation-ledger | Corrections, append-only, starting with our own |
| Verification | /gspc-verify | Free, loginless card verification |

---

## Quotable

> "We did not invent AI governance. We rediscovered it — and built it in digital form."

> "Measurement, not certification. Empty cells stay empty."

> "A 401 is a term sheet, not a failure. UNREACHABLE is never FAIL."

---

## Boilerplate (50 words)

Council of AI (CSOAI Ltd, UK Companies House 16939677) is an independent
measurement body for AI behaviour. We run systems against frozen, published
tests drawn from statute, sign the result, and publish what cannot be
measured. We do not certify or remediate. Verify free at councilof.ai/gspc-verify.

---

## Contact

- **Press:** press@councilof.ai
- **Disputes:** disputes@councilof.ai
- **General:** nicholas@csoai.org
- **Website:** https://councilof.ai

---

## Logo and assets

- Icon: https://councilof.ai/csoai-icon.svg
- OG image: https://councilof.ai/og-image.png
- Site: https://councilof.ai

---

*Measurement, not certification. Every number above is fetchable.*
