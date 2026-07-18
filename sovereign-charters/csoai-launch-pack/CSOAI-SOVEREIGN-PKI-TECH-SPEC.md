> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

---

# SOVEREIGN PKI TECHNICAL SPEC
## 4-Tier Ed25519 + PQC Migration

> Charter Article 0 binding applies to all keys.

## TIERS

### Tier 0 — Sovereign Root Key
- **Algorithm**: Ed25519 + ML-DSA-65 hybrid (2027+)
- **Storage**: YubiHSM2 air-gapped UK location
- **Recovery**: 5-of-7 Shamir custodian
- **Rotation**: 24-month
- **Next rotation**: 28 Jun 2028
- **Public key**: `d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a`

### Tier 1 — BFT Agent Keys (33)
- **Algorithm**: Ed25519 (one per agent)
- **Storage**: Sovereign vault + agent cards
- **Rotation**: 12-month

### Tier 2 — Charter Signing Keys (41)
- **Algorithm**: Ed25519 (per charter)
- **Derivation**: BIP-32 hierarchical
- **Rotation**: 12-month

### Tier 3 — Partner Tier Keys (per category × tier)
- **Algorithm**: Ed25519
- **Storage**: HSM / Vault / KMS (per tier)
- **Rotation**: 6-month

## PQC MIGRATION

### Timeline
- 2026: Ed25519 only
- 2027 Q1: Ed25519 + ML-DSA-65 hybrid
- 2027 Q3: All BFT dual-signed
- 2028 Q1: All cross-walks PQC-signed
- 2030 Q1: Pure PQC (Ed25519 deprecated)
- 2032 Q1: ML-KEM-768 hybrid

### Migration Ceremony
- 5-of-7 Shamir recovery preserved
- BFT 33/33 quorum + 5 human sigs
- Article 0 binding preserved

---

CSOAI Ltd · UK Companies House 16939677
Sovereign root key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
Ed25519-signed, BFT-ratified, OTS-Bitcoin-anchored, Charter Article 0 binding
Honesty register: illustrative, not live certification.


---

CSOAI Ltd · UK Companies House 16939677
Sovereign root key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
Ed25519-signed · BFT-ratified · OTS-Bitcoin-anchored · Charter Article 0 binding
Honesty register: illustrative, not live certification.

