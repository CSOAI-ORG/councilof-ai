# meok-supply-chain-attestation-mcp

**Sovereign Supply-Chain Attestation MCP** — Ed25519-signed SDLC attestation policy engine with hash-chained Sigil Chain and optional Bitcoin anchoring.

Inspired by:
- [chainloop-dev/chainloop](https://github.com/chainloop-dev/chainloop) (SDLC evidence store + policy engine)
- [ogulcanaydogan/LLM-Supply-Chain-Attestation](https://github.com/ogulcanaydogan/LLM-Supply-Chain-Attestation) (LLM-specific)

Four tools:
- ✅ **`sov_sbom`** — generate signed SBOM (CycloneDX or SPDX)
- ✅ **`sov_attest`** — create a SLSA-style attestation for an artifact
- ✅ **`sov_verify_attestation`** — verify a sovereign attestation
- ✅ **`sov_anchor_bitcoin`** — anchor to Bitcoin via OpenTimestamps (optional)

All attestations are **Ed25519-signed** and **hash-chained** to a Sigil Chain. Optional **Bitcoin anchoring** via OpenTimestamps when `ots` CLI is available.

## Install

```bash
pip install meok-supply-chain-attestation-mcp
```

## Usage (Python)

```python
from meok_supply_chain_attestation_mcp import (
    sov_sbom, sov_attest, sov_verify_attestation, sov_anchor_bitcoin,
)

# 1. Generate signed SBOM
sbom = sov_sbom("/path/to/artifact.tar.gz", format="cyclonedx",
                components=[
                    {"name": "requests", "version": "2.31.0", "purl": "pypi:requests@2.31.0"},
                ])
# → {"format": "cyclonedx", "body": {...CycloneDX 1.5...},
#    "artifact_sha256": "...", "kid": "...", "sig": "...",
#    "verify_url": "https://proofof.ai/attestation/abc123..."}

# 2. Create SLSA-style attestation (chain-linked)
a1 = sov_attest("/path/to/artifact.tar.gz", builder_id="meok-builder-v1")
a2 = sov_attest("/path/to/artifact.tar.gz", builder_id="meok-builder-v2",
                prev_attestation_id=a1["attestation_id"])
# a2["chain"]["chain_hash"] is hash of a1["attestation_id"]

# 3. Verify attestation
v = sov_verify_attestation(a1)
assert v["valid"]

# 4. Anchor to Bitcoin (requires `ots` CLI)
anchor = sov_anchor_bitcoin(a1)
# → {"status": "no_ots_cli", "attestation_hash": "...", "pending": True}
```

## Usage (MCP server)

```bash
python -m meok_supply_chain_attestation_mcp
# Exposes 4 tools: sov_sbom, sov_attest, sov_verify_attestation, sov_anchor_bitcoin
```

## Sovereign Substrate

| Layer | What | Substrate |
|---|---|---|
| Sign | Every attestation | Ed25519, `~/.meok/sov_attestation_key.pem` |
| Chain | Link attestations | hash(prev_attestation_id) |
| Verify | Public URL | `https://proofof.ai/attestation/<id>` |
| Anchor | Bitcoin | OpenTimestamps (OTS CLI required) |

## Reference Implementations

- **chainloop** — github.com/chainloop-dev/chainloop (Apache 2.0)
- **LLM-Supply-Chain-Attestation** — github.com/ogulcanaydogan/LLM-Supply-Chain-Attestation
- **in-toto attestation** — github.com/in-toto/attestation
- **SLSA Provenance** — slsa.dev/provenance/
- **OpenTimestamps** — github.com/opentimestamps/opentimestamps-client
- **Sovereign wrapper** — this package (MIT)

## License

MIT — CSOAI Ltd (UK 16939677)

---

**The dragon never lies. Every artifact is signed. Every chain is auditable.**
