# MEOK MCP — PyPI truth (2026-06-02, live-verified)

Ends the recurring count trap (26 / 264 / 294 / 323 / "410+" were all wrong at some point).
Verified live this date by `tools/pypi_check.py` (curls pypi.org/pypi/<name>/json for every
package name in `mcp-marketplace/*/pyproject.toml`).

| Metric | Count |
|---|---|
| Named packages on disk (mcp-marketplace/*/pyproject.toml) | 315 |
| **PUBLISHED on PyPI (200)** | **271** |
| Built but NOT published | 44 |

**Canonical number to use everywhere: 271 published / 316 built.** NOT "410+", NOT "345 published".

Re-verify anytime: `python3 tools/pypi_check.py`

## The 44 built-but-unpublished (publish backlog)
agent-x402-paywall-mcp
bft-progress-council-mcp
care-home-cqc-mcp
care-home-scheduling-mcp
cisa-kev-mcp
coppa-ferpa-mcp
cqc-compliance-mcp
dispense-record-mcp
domiciliary-care-mcp
eudi-wallet-mcp
firmware-attestation-mcp
gos-claim-validator-mcp
iso-42005-impact-mcp
korea-ai-basic-act-mcp
mcp-spec-compliance-mcp
meok-aaif-agent-card-mcp
meok-abci-bridge-mcp
meok-agents-md-lint-mcp
meok-ap2-mandate-mcp
meok-c2pa-durable-mcp
meok-coinbase-x402-receipt-mcp
meok-cra-art14-reporter-mcp
meok-drcf-agent-crosswalk-mcp
meok-eu-aia-art-9-rms-mcp
meok-eu-aigc-icon-mcp
meok-koikeeper-ai-mcp
meok-libp2p-agent-mesh-mcp
meok-mcp-cardgen-mcp
meok-mcp-hardening-mcp
meok-mcp-test-mcp
meok-nis2-nl-register-mcp
meok-stripe-acp-checkout-mcp
meok-uk-adm-article22c-mcp
meok-w3c-tdm-rights-mcp
meok-x402-wrap-mcp
mhra-samd-optometry-mcp
mitre-attack-mcp
nhs-gos-claims-mcp
oasf-agent-directory-mcp
optical-care-home-bridge-mcp
optometry-patient-mcp
sigstore-cosign-mcp
slsa-supply-chain-mcp
{{package_name}}
