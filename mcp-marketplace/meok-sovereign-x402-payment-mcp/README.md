# meok-sovereign-x402-payment-mcp

**Sovereign x402 Payment MCP** — HTTP 402 micropayments for AI agent tool calls.

The **keystone MCP** for the sovereign agent commerce stack. Wraps the x402 ecosystem with CSOAI sovereign substrate.

## Reference Implementations

- [xpaysh/awesome-x402](https://github.com/xpaysh/awesome-x402) — 243⭐ curated list of x402 resources
- [BlockRunAI/blockrun-mcp](https://github.com/BlockRunAI/blockrun-mcp) — 466⭐ pay-per-call via x402
- [Eversmile12/create-8004-agent](https://github.com/Eversmile12/create-8004-agent) — 51⭐ ERC-8004 agent identity
- [Trustdev-eth/x402-erc8004-agent](https://github.com/Trustdev-eth/x402-erc8004-agent) — A2A + x402 + ERC-8004

## Install

```bash
pip install meok-sovereign-x402-payment-mcp
```

## Usage (Python)

```python
from meok_sovereign_x402_payment_mcp import (
    x402_challenge, x402_verify_payment, x402_settle, x402_price_list,
)

# 1. Get price list
prices = x402_price_list()
# {currency: "USDC", tools: [{tool: "sov_create_passport", price_usdc: 0.1}, ...], ...}

# 2. Issue HTTP 402 challenge
challenge = x402_challenge("sov_create_passport", payer_did="did:csoai:agent-1")
# {http_status: 402, price_usdc: 0.1, payment_required_url: "https://proofof.ai/x402/pay/...", ...}

# 3. Settle payment + get signed receipt
receipt = x402_settle(challenge, tx_hash="0xabc123")
# {status: "paid", receipt_id, kid, sig, verify_url}

# 4. Verify the payment receipt
v = x402_verify_payment(receipt, expected_tool="sov_create_passport",
                          expected_payer="did:csoai:agent-1")
assert v["valid"]
```

## Usage (MCP server)

```bash
python -m meok_sovereign_x402_payment_mcp
# Exposes 4 tools: sov_x402_challenge, sov_x402_verify_payment, sov_x402_settle, sov_x402_price_list
```

## The Sovereign Price Sheet (USDC)

| Tool | Price | Notes |
|------|-------|-------|
| sov_create_passport | $0.10 | Ed25519-signed identity |
| sov_verify_passport | $0.01 | Offline verify |
| sov_create_delegation | $0.05 | Narrowing-invariant |
| sov_evaluate_intent | $0.025 | Gateway decision |
| sov_guard | $0.005 | Prompt injection defense |
| sov_redact_pii | $0.01 | 15+ PII kinds |
| sov_scan | $0.05 | Repo poisoning |
| sov_create_receipt | $0.005 | Tamper-evident |
| sov_verify_receipt | $0.005 | Offline |
| sov_verify_chain | $0.02 | Chain integrity |
| sov_redact_pii_signed | $0.01 | Signed redaction |
| sov_anchor_bitcoin | $0.10 | OpenTimestamps |
| sov_policy_evaluate | $0.025 | Policy decision |
| sov_segmentation_zone | $0.005 | Zero-trust zone |
| sov_maturity_assess | $0.05 | Level-up check |
| **sov_incident_killswitch** | **FREE** | Human safety always free |
| sov_sbom | $0.05 | CycloneDX/SPDX |
| sov_attest | $0.10 | SLSA attestation |
| sov_verify_attestation | $0.005 | Offline |
| sov_anchor_bitcoin_attest | $0.10 | OpenTimestamps |

**Discounts:** BFT council pre-cleared = 50% off · Care-floor validated = 10% off

## Sovereign Substrate

| Layer | What | Substrate |
|---|---|---|
| Sign | Every challenge + receipt | Ed25519, `~/.meok/sov_x402_key.pem` |
| Verify | Public URL | `https://proofof.ai/x402/receipt/<id>` |
| Network | Base | USDC micro-units |
| Council | High-value txns | BFT council ID field |

## License

MIT — CSOAI Ltd (UK 16939677)

---

**The dragon never lies. Every payment is signed. Every tool call has a price.**
