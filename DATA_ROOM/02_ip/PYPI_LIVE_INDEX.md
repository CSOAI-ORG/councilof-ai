# PyPI Live Index — verifiable published IP
**Status: HAVE (partial — flagships verified) · Last live-check: 2026-06-06**

> Proof-over-claims: every package below is installable today. A reviewer verifies any line with `pip install <name>` or by opening `https://pypi.org/pypi/<name>/json` (returns 200 + metadata). **No `meok-`-prefixed marketing names are used — those 404.** Canonical name map: `revenue/CANONICAL_PACKAGE_NAMES_2026-05-29.md`. Full regenerator: `python3 tools/pypi_check.py`.

## Headline count (canonical)
**271 packages published on PyPI / 316 built** (44-name backlog). Verify the live count: `python3 tools/pypi_check.py`. Do **not** cite 264/294/323/"410+" — those are superseded drift.

## Flagship compliance MCPs — live-verified names + versions
| Real published name (`pip install`) | Framework | Version (verify live) | Verify |
|---|---|---|---|
| `eu-ai-act-compliance-mcp` | EU AI Act (€35M/7% penalties) | 1.8.2 | pypi.org/pypi/eu-ai-act-compliance-mcp/json |
| `dora-compliance-mcp` | DORA (EU financial ops resilience) | 1.4.3 | pypi.org/pypi/dora-compliance-mcp/json |
| `nis2-compliance-mcp` | NIS2 Directive | 1.3.1 | pypi.org/pypi/nis2-compliance-mcp/json |
| `cra-compliance-mcp` | EU Cyber Resilience Act | live | pypi.org/pypi/cra-compliance-mcp/json |
| `iso-42001-ai-mcp` | ISO/IEC 42001 AIMS | 1.1.3 | pypi.org/pypi/iso-42001-ai-mcp/json |
| `nist-rmf-ai-mcp` | NIST AI RMF | 1.0.7 | pypi.org/pypi/nist-rmf-ai-mcp/json |
| `bias-detection-mcp` | EU AI Act Art 10 bias | live | pypi.org/pypi/bias-detection-mcp/json |
| `ai-incident-reporting-mcp` | Art 73 / DORA 19 / NIS2 23 incident | live | pypi.org/pypi/ai-incident-reporting-mcp/json |
| `watermarking-authenticity-mcp` | EU AI Act Art 50 / C2PA | 1.2.0 | pypi.org/pypi/watermarking-authenticity-mcp/json |
| `agent-policy-enforcement-mcp` | A2A IAM | 1.0.4 | pypi.org/pypi/agent-policy-enforcement-mcp/json |
| `agent-prompt-injection-firewall-mcp` | OWASP LLM01 firewall | 1.0.6 | pypi.org/pypi/agent-prompt-injection-firewall-mcp/json |
| `agent-handoff-certified-mcp` | A2A provenance handoff | 1.0.6 | pypi.org/pypi/agent-handoff-certified-mcp/json |
| `meok-nis2-de-register-mcp` | German NIS2 register | 1.0.8 | pypi.org/pypi/meok-nis2-de-register-mcp/json |
| `meok-watermark-attest-mcp` | C2PA attestation | 1.3.4 | pypi.org/pypi/meok-watermark-attest-mcp/json |
| `meok-attestation-verify` | signed-attestation verifier | 1.0.3 | pypi.org/pypi/meok-attestation-verify/json |

## Aquaculture vertical MCPs (built; see mcp-marketplace/)
`meok-rspca-aquaculture-mcp`, `meok-uk-fhi-mcp`, `meok-asc-rspca-crosswalk-mcp`, `meok-laia-aquatic-mcp`, `meok-aquaponics-monitor-mcp`, `meok-koikeeper-ai-mcp` (+ `meok-soil-assoc-organic-aqua-mcp` stub). Publish status: verify per-name before citing as installable.

## What a reviewer should do
1. Pick any 3 rows at random → `pip install <name>` → confirms it resolves.
2. `python3 tools/pypi_check.py` → confirms the 271 headline independently.
3. Hit `https://meok-attestation-api.vercel.app` → 200 (the signing spine).

*Honest note: published ≠ adopted. Download/usage metrics live in `04_traction/` and are currently thin — this index proves the IP exists and is real, not that it has traction yet.*
