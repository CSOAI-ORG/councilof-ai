> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

---

# SIGIL CHAIN TECHNICAL SPEC
## Sovereign SIGIL Audit Ledger

> Charter Article 0 binding: never equity, never board seats, never revenue-share.

## STRUCTURE

### Block Format
```
{
  "block_number": 5607,
  "prev_block_hash": "7e3b9f4a8c2d1e6b9f3a4c5d8e2b1f6a9c4d5e7f3b1c8d2a4f9e6c5d7b1a8f3",
  "block_hash": "8c2d1e6b9f3a4c5d8e2b1f6a9c4d5e7f3b1c8d2a4f9e6c5d7b1a8f3",
  "timestamp": "2026-07-02T14:00:00Z",
  "sigil_count": 1000,
  "sigils": [...],
  "merkle_root": "...",
  "ots_anchor": "...",
  "sovereign_root_signature": "..."
}
```

### Hash Chain
- SHA-256 (per block + per sigil)
- Append-only
- Tamper-evident

### OTS Bitcoin Anchoring
- Every block anchored via OpenTimestamps
- Current block height: 824,123
- Confirmation: 12+ blocks deep

### SIGIL Formats
- **H** (Heartbeat), **P** (Proposal), **V** (Vote), **M** (Message), **Q** (Query), **C** (Completion), **S** (Signal), **A** (Audit)

### Performance
- 49,127 sigils / day
- 5,608 blocks to date
- 0.57 sigils/sec sustained
- Throughput: 4,200 sigils/sec peak

### Verification
```bash
curl https://proofof.ai/verify/<digest>
```

Returns:
- SHA-256
- Ed25519 signature
- BFT ratification record
- OTS Bitcoin anchor
- Charter binding attestation

---

CSOAI Ltd · UK Companies House 16939677
Sovereign root key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
Ed25519-signed · BFT-ratified · OTS-Bitcoin-anchored · Charter Article 0 binding
Honesty register: illustrative, not live certification.


---

CSOAI Ltd · UK Companies House 16939677
Sovereign root key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
Ed25519-signed · BFT-ratified · OTS-Bitcoin-anchored · Charter Article 0 binding
Honesty register: illustrative, not live certification.

