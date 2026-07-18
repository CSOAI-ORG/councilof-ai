# meok-sovereign-receipt-mcp

**Sovereign Receipt MCP** — Ed25519-signed tamper-evident cryptographic receipts with hash-chained ledger.

Combines:
- [aetherproof/pulkit6732](https://github.com/pulkit6732/aetherproof) (Signet prototype) — Receipt/Signer/Verifier/Log
- [sphragis-oss/sphragis](https://github.com/sphragis-oss/sphragis) (EU AI Act gateway) — 15+ redact kinds + audit log
- CSOAI sovereign substrate — Ed25519 sigil chain, BFT council, proofof.ai

## EU AI Act Alignment

| Article | What | This MCP |
|---|---|---|
| **Art. 12** | Record-keeping | Hash-chained receipt log |
| **Art. 9** | Risk management | Receipt-verified decision trail |
| **Art. 26** | Deployer obligations | Receipt-signed deployer actions |
| **Art. 14** | Human oversight | Receipt-signed human approvals |

## Install

```bash
pip install meok-sovereign-receipt-mcp
```

## Usage (Python)

```python
from meok_sovereign_receipt_mcp import (
    create_receipt, verify_receipt, verify_chain,
    redact_pii, anchor_bitcoin,
)

# 1. Create signed, hash-chained receipt
r1 = create_receipt({"event": "ai_decision", "outcome": "permit"})
r2 = create_receipt({"event": "ai_decision", "outcome": "deny"}, prev_receipt=r1)

# 2. Verify offline
v = verify_receipt(r1)
assert v["valid"]

# 3. Verify entire chain
chain = verify_chain([r1, r2])
assert chain["valid"] and chain["length"] == 2

# 4. Redact PII (15+ kinds)
clean = redact_pii("Email john@example.com or call +1 555 123 4567")
# → {"redacted": "Email <EMAIL> or call <PHONE>",
#    "kinds": ["EMAIL", "PHONE"],
#    "receipt": {...signed audit receipt...}}

# 5. Anchor to Bitcoin (requires `ots` CLI)
anchor = anchor_bitcoin(r1)
```

## Usage (MCP server)

```bash
python -m meok_sovereign_receipt_mcp
# Exposes 5 tools: sov_create_receipt, sov_verify_receipt, sov_verify_chain,
# sov_redact_pii, sov_anchor_bitcoin
```

## PII Kinds Redacted (15+)

EMAIL · PHONE · IBAN · CARD (credit card) · SECRET (base64-shaped) · APIKEY (sk-/pk-/api-/key-) · PRIVATEKEY (PEM) · JWT · SSN · IPV4 · ADDRESS (street) · HEALTH (MRN/SSN/EIN/NPI) · VAT · TAXID · AMKA

## Sovereign Substrate

| Layer | What | Substrate |
|---|---|---|
| Sign | Every receipt | Ed25519, `~/.meok/sov_receipt_key.pem` |
| Chain | Tamper-evident | Each receipt references prev (Genesis if first) |
| Verify | Public URL | `https://proofof.ai/receipt/<id>` |
| Anchor | Bitcoin | OpenTimestamps (OTS CLI required) |
| Council | Pre-clearance | `bft_council_id` field |
| Care | Sensitive events | `care_floor_validated` flag |

## Reference Implementations

- **aetherproof** — github.com/pulkit6732/aetherproof (prototype of Signet)
- **sphragis** — github.com/sphragis-oss/sphragis (Apache 2.0, EU AI Act gateway)
- **Sovereign wrapper** — this package (MIT, CSOAI Ltd UK 16939677)

## License

MIT — CSOAI Ltd (UK 16939677)

---

**The dragon never lies. Every receipt is signed. Every chain is auditable.**
