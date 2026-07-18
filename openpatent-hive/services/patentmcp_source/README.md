# PatentMCP

**The Decentralized Invention Disclosure System**

MCP-Mediated, Blockchain-Anchored, HMAC-Signed Prior Art Engine

Built on CSOAI/MEOK's infrastructure: blockchain-ai-mcp, blockchain-verification-mcp, agent-audit-logger-mcp, agent-content-watermark-mcp, Ed25519 signing, HMAC attestation, x402 payments.

---

## What It Does

PatentMCP creates **6 independent cryptographic proofs** of invention:

| Layer | Proof | Technology |
|-------|-------|------------|
| 1 | Document Integrity | SHA-3/512 hash |
| 2 | Witness Attestation | HMAC-SHA256 (CSOAI) |
| 3 | Inventor Authorship | Ed25519 signature |
| 4 | Permanent Timestamp | Bitcoin blockchain (OpenTimestamps) |
| 5 | Machine Provenance | C2PA Content Credential |
| 6 | Tamper Evidence | Hash-chained audit log |

**Cost: $10-$50 per disclosure. Protection: cryptographically irrefutable.**

---

## Quick Start

```bash
# Install
pip install -e .

# Run demo
python demo.py

# Run tests
python -m pytest tests/ -v

# Start MCP server
python -m patentmcp.server --storage ./data
```

## Python API

```python
from patentmcp import PatentMCP

pm = PatentMCP()

result = pm.disclose_invention(
    title="My Novel Invention",
    description="A method for...",
    inventor_did="did:key:z6Mk...",
    document_bytes=b"...",
    disclosure_type="full"  # $50
)

print(result["attestation_url"])
print(result["bitcoin_transaction"])
print(result["verification"]["all_checks_pass"])  # True
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `patentmcp.disclose` | Submit invention disclosure |
| `patentmcp.verify` | Verify prior disclosure |
| `patentmcp.search` | Search prior art registry |
| `patentmcp.get_statistics` | System stats |

## Pricing

| Type | Price | What's Included |
|------|------:|-----------------|
| Defensive | $10 | Timestamp + hash + Bitcoin anchor |
| Full | $50 | Complete 6-layer proof + prior art registry |
| Premium | $100 | Full + expedited + claim strategy consult |

## License

MIT License - see [CSOAI LTD (UK 16939677)](https://csoai.org)
