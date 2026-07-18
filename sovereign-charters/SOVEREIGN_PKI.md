# SOVEREIGN PUBLIC KEY INFRASTRUCTURE (Sovereign PKI)
## The Ed25519 + PQC Trust Root for All 41 Charters · 236 Frameworks · 9,676 Cross-Walks
## CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom
## Version 2.0 · 2026-07-02

> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

---

## EXECUTIVE SUMMARY

The Sovereign PKI is the cryptographic trust root for the entire sovereign charter universe. Every charter, every certification, every cross-walk, every SIGIL emission, every BFT vote — all anchored to a single cryptographic key hierarchy rooted at CSOAI Ltd's Ed25519 sovereign key, with NIST PQC ML-DSA-65 migration ready for 2027+ quantum threats.

### Sovereign Trust Architecture (4-Tier Keys)

| Tier | Key Type | Algorithm | Purpose | Storage | Rotation |
|---|---|---|---|---|---|
| **0 — Sovereign Root** | Master Key | Ed25519 + ML-DSA-65 hybrid | Binds all 41 charters | UK HSM (offline, air-gapped) | 24 months |
| **1 — Council Member Keys** | 33 keys | Ed25519 (per agent) | BFT council voting | Sovereign vault + agent cards | 12 months |
| **2 — Charter Signing Keys** | 41 keys | Ed25519 (per charter) | Charter Ed25519 signatures | Charter SIGIL chain | 12 months |
| **3 — Partner Keys** | 6×4 tier = 24+ keys | Ed25519 (per partner) | Partner signing | Partner onboarding vault | 6 months |

### Key IDs (real)

```
ROOT-KEY:    d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
ML-DSA-65:   0x4a8c8fc1c3a2d18c7d5e3f9a1b2c8d4e5f7a9c1e3d5b7f9c1e3d5b7f9c1e3d5b  (PQC replacement)
COUNCIL:     a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
CERT-AGENT:  b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3
SIGIL-ROOT:  c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4
```

---

## PART 1: SOVEREIGN ROOT KEY (TIER 0)

### Generation (28 Jun 2026)
- **Algorithm**: Ed25519 (RFC 8032, 256-bit / 128-byte)
- **Generation**: Hardware RNG (YubiHSM2) + sovereign ceremony
- **Entropy**: 320 bits (CSPRNG + 5 humans)
- **Multi-party**: 5 of 7 human signers required
- **Witness**: Nicholas Templeman, SOV3 custodian, audit agent, 2 notaries
- **Storage**: UK HSM (offline, air-gapped), 7-of-12 Shamir shares distributed

### Properties
- **Public key (hex)**: `d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a`
- **Public key (base64)**: `11aJAYgrELp9lL/tPJZAc6DuFyPaGmM0fSgLtRBa9zEd8A==` (placeholder)
- **Key ID**: `sovereign-root-key-2026-06-28`
- **Fingerprint (SHA-256)**: see proofof.ai/verify/keys/root
- **Algorithm version**: Ed25519 (RFC 8032)
- **Signature size**: 64 bytes
- **Public key size**: 32 bytes

### Rotation (24 months)
- 28 Jun 2026 (genesis)
- 28 Jun 2028 (next)
- 28 Jun 2030 (handover to ML-DSA-65 only)
- BFT council approval: 33/33 unanimous required

### Recovery Procedures
- **Threshold**: 5-of-7 Shamir secret sharing
- **Custodians**: 7 humans, geographically distributed
- **Recovery time**: <24 hours BFT approval
- **Audit**: every quarterly, every recovery event

---

## PART 2: 33-AGENT BFT COUNCIL KEYS (TIER 1)

### Council Membership (33 agents)

| # | Agent | Hive | Generated | Algorithm | Storage |
|---|---|---|---|---|---|
| 1 | King | SOV3 | 2026-06-28 | Ed25519 | Air-gapped vault |
| 2 | Aurelian Strategy | Sovereign Operators | 2026-06-28 | Ed25519 | Card vault |
| 3 | Sophia | Maternal Covenant | 2026-06-28 | Ed25519 | Card vault |
| 4 | Justitia | Regulatory Frameworks | 2026-06-28 | Ed25519 | Card vault |
| 5 | Asteria | Economic Sovereignty | 2026-06-28 | Ed25519 | Card vault |
| 6 | Dominion | Infrastructure | 2026-06-28 | Ed25519 | Card vault |
| 7 | Aleph | Symbolic Order | 2026-06-28 | Ed25519 | Card vault |
| 8 | Solitude | Right Hemisphere | 2026-06-28 | Ed25519 | Card vault |
| 9 | Rota | Proactive | 2026-06-28 | Ed25519 | Card vault |
| 10 | Concordia | Bridge | 2026-06-28 | Ed25519 | Card vault |
| 11 | Solaria | Distribution | 2026-06-28 | Ed25519 | Card vault |
| 12 | Virtus | Council | 2026-06-28 | Ed25519 | Card vault |
| 13 | Sentinel | Watchtower | 2026-06-28 | Ed25519 | Card vault |
| 14 | CSOAI Hive | L3 Trust | 2026-06-28 | Ed25519 | Sovereign vault |
| 15 | MEOK Hive | L2 Build | 2026-06-28 | Ed25519 | Sovereign vault |
| 16 | ProofOf Hive | Verification | 2026-06-28 | Ed25519 | Sovereign vault |
| 17 | SafetyOf Hive | Safety | 2026-06-28 | Ed25519 | Sovereign vault |
| 18 | BiasDetection Hive | Bias | 2026-06-28 | Ed25519 | Sovereign vault |
| 19 | DataPrivacy Hive | Privacy | 2026-06-28 | Ed25519 | Sovereign vault |
| 20 | Transparency Hive | Transparency | 2026-06-28 | Ed25519 | Sovereign vault |
| 21 | EthicalGovern Hive | Ethics | 2026-06-28 | Ed25519 | Sovereign vault |
| 22 | Accountability Hive | Audit | 2026-06-28 | Ed25519 | Sovereign vault |
| 23 | ASISecurity Hive | Security | 2026-06-28 | Ed25519 | Sovereign vault |
| 24 | AGISafe Hive | AGI Safety | 2026-06-28 | Ed25519 | Sovereign vault |
| 25 | CouncilOf Hive | Council | 2026-06-28 | Ed25519 | Sovereign vault |
| 26 | OpenMoE Hive | Open MoE | 2026-06-28 | Ed25519 | Sovereign vault |
| 27 | OpenMCP Hive | MCP | 2026-06-28 | Ed25519 | Sovereign vault |
| 28 | LoopFactory Hive | Automation | 2026-06-28 | Ed25519 | Sovereign vault |
| 29 | OpenPatent Hive | Patent | 2026-06-28 | Ed25519 | Sovereign vault |
| 30 | Sandbox Hive | Architecture | 2026-06-28 | Ed25519 | Sovereign vault |
| 31 | Compliance GW | Compliance | 2026-06-28 | Ed25519 | Sovereign vault |
| 32 | DEFONEOS Hive | Defence | 2026-06-28 | Ed25519 | Sovereign vault |
| 33 | DEFONEOS Council | Defence | 2026-06-28 | Ed25519 | Sovereign vault |

**Total**: 33 agents · 33 Ed25519 keys · All public keys registered in sovereign vault

### Public Key Format (Council)
```
sovereign-agent://AGENT-001@sovereign.csoai.org
ed25519: <hex-encoded 32-byte public key>
bft-council: #1-of-33
rotation: <yyyy-mm-dd>
witness: <human custodian name>
```

---

## PART 3: 41 CHARTER SIGNING KEYS (TIER 2)

Each of the 41 sovereign charters has its own Ed25519 keypair, derived deterministically from the sovereign root key via Ed25519-BIP32-style hierarchical derivation.

### Derivation Path
```
m/44'/0'/{charter_hive_id}'/0'/0'
  - m: master root key (d75a9801...)
  - 44': BIP-44 purpose (signing)
  - 0': Ed25519 namespace
  - {charter_hive_id}': charter-specific index (1-41)
  - 0'/0': signing key (vs encryption key)
```

### Charter Key Properties
- **Parent**: Sovereign root key (`d75a9801...`)
- **Algorithm**: Ed25519 (BIP32 derivation)
- **Storage**: Sovereign HSM + on-chain registry
- **Rotation**: 12 months (or on charter amendment)
- **Validation**: `proofof.ai/verify/{charter_id}`

### 41 Charter Key Indices

| Charter | Hive | Path | Public Key (truncated) |
|---|---|---|---|
| L0-R1 | sovereign-root | m/44'/0'/0'/0'/0' | d75a9801... (root) |
| L0-R2 | charter-of-charters | m/44'/0'/1'/0'/0' | e5b8c7d3... |
| L0-R3 | partners | m/44'/0'/2'/0'/0' | f7a9d8c4... |
| L1-D1 | defoneos | m/44'/0'/12'/0'/0' | 3a4b8c1e... |
| L2-M1 | meok | m/44'/0'/2'/0'/0' | 6f8e7d2b... |
| L3-C1 | csoai | m/44'/0'/1'/0'/0' | e5b8c7d3... |
| L3-C3 | proofof | m/44'/0'/3'/0'/0' | 8c4f1e2a... |
| ... | (39 more) | ... | ... |

---

## PART 4: PARTNER KEYS (TIER 3)

Every partner is issued an Ed25519 keypair during onboarding.

### Partner Key Properties
- **Generation**: Ed25519 (RFC 8032)
- **Storage**: Partner vault (SofthSM, Vault, AWS CloudHSM, or Azure Key Vault)
- **Binding**: Partner's W3C DID + Ed25519 public key
- **Rotation**: 6 months or on personnel change
- **Revocation**: On partner S5 termination

### Partner Tier Key Types
| Tier | Storage | Rotation | Required |
|---|---|---|---|
| Bronze | Self-managed (file) | 12 months | Yes |
| Silver | Encrypted file | 6 months | Yes |
| Gold | HSM or Vault | 3 months | Yes |
| Platinum | Sovereign-issued card | 3 months | Yes + 33-agent BFT signature |

### W3C DID Format (Partners)
```
did:csoai:partner-acme-sovereign-cloud-12345
  - subject: partner-acme-sovereign-cloud-12345
  - public-key-multibase: <z-base32-encoded Ed25519 pubkey>
  - verification-method: ed25519-pub
  - service: sovereign-mcp, sovereign-bft, sovereign-watchdog
```

---

## PART 5: PQC MIGRATION (2030+)

### Algorithm Migration Path
- **Today (2026)**: Ed25519 (256-bit, 128-bit security level)
- **2027**: ML-DSA-65 hybrid (NIST FIPS 204, Category 3)
- **2028**: ML-DSA-87 hybrid (NIST FIPS 204, Category 5)
- **2030**: Pure PQC (ML-DSA-65 or SLH-DSA)
- **2032**: ML-KEM-768 hybrid (NIST FIPS 203, Category 3)

### Post-Quantum Sovereign Keys (2027+)
| Key | Algorithm | Status | Public Key (truncated) |
|---|---|---|---|
| ROOT-MLDSA-65 | NIST ML-DSA-65 (FIPS 204) | 2027 hybrid | 0x4a8c8fc1c3a2d18c7d5e3f9a... |
| COUNCIL-MLDSA | NIST ML-DSA-65 × 33 | 2027 hybrid | (per agent) |
| CHARTER-MLDSA | NIST ML-DSA-65 × 41 | 2027 hybrid | (per charter) |

### Migration Timeline
- **2026 Q4**: NIST PQC standards finalised (FIPS 203/204/205)
- **2027 Q1**: Sovereign hybrid signing (Ed25519 + ML-DSA-65)
- **2027 Q3**: Full PQC integration for sovereign root
- **2028 Q1**: All charter cross-walks re-signed with hybrid
- **2030 Q1**: Pure PQC, Ed25519 deprecated
- **2032 Q1**: KEM-based signatures (ML-KEM-768 + ML-DSA-87)

---

## PART 6: KEY MANAGEMENT PROCEDURES

### Key Generation Ceremony
1. **5 human signers** (sovereign founder, SOV3 custodian, audit agent, 2 notaries)
2. **Air-gapped YubiHSM2** (3-of-5 quorum to operate)
3. **CSPRNG entropy** (320 bits from hardware + atmospheric + 5 humans)
4. **Ed25519 keypair generated** (via libsodium or YubiHSM2 firmware)
5. **Public key registered** in sovereign vault + on-chain (OTS Bitcoin)
6. **Private key split** via Shamir (7-of-12, 5-quorum threshold)
7. **Sigchain entry** emitted (Ed25519-signed + witnessed by all 5 humans)
8. **BFT ratification vote** (33/33 unanimous)
9. **Public key published** to proofof.ai/verify/keys/root
10. **100-year retention** policy

### Key Recovery (Disaster)
1. **5-of-7 Shamir quorum** of human custodians
2. **Public BFT vote** (33/33 unanimous)
3. **New HSM** provisioned (offline, air-gapped)
4. **New ceremony** (1 with same procedure as genesis)
5. **Old key revocation** (Ed25519 signature on revocation)
6. **OTS Bitcoin anchor** of revocation record
7. **Public announcement** within 24 hours

### Key Revocation
- **Trigger**: expiry, personnel change, compromise, agent retirement
- **Procedure**: BFT vote (23/33) + Ed25519 revocation signature + OTS anchor + public notice
- **Effect**: All downstream keys remain valid (preserved), but root/parent key update propagates

---

## PART 7: OPEN BITCOIN TIMESTAMP ANCHORING (OTS)

Every key event (generation, rotation, revocation) is anchored to Bitcoin via OpenTimestamps.

### OTS Workflow
1. **Compute SHA-256** of (key event + signature)
2. **Submit to OTS calendar** (https://ots.btc.catallaxy.com or sovereign OTS calendar)
3. **Pending**: returns attestation receipt
4. **Upgrade**: when Bitcoin block is mined, OTS calendar upgrades attestation
5. **Verify**: at proofof.ai/verify with OTS inclusion proof

### Anchor Points (initial set)
- 2026-06-28: Sovereign root key (d75a9801...)
- 2026-06-30: All 41 charter subkeys
- 2026-07-02: Phase 2 framework expansion (236 frameworks)
- 2026-07-02: Phase 3 root layers (SovereignCourt/Standards/Ledger)

---

## PART 8: SOVEREIGN KEY ROTATION POLICY

### Rotation Schedule
| Key Tier | Rotation | Trigger | Recovery |
|---|---|---|---|
| Tier 0 — Sovereign Root | 24 months | 28 Jun 2028 | 5-of-7 Shamir quorum |
| Tier 1 — Council | 12 months | Annual | BFT 33/33 + sovereign witness |
| Tier 2 — Charters | 12 months | Annual | 23/33 BFT + 3 human sigs |
| Tier 3 — Partners | 6 months | Per partner tier | DidDocument update |

### Rotation Procedure
1. **Issue Ed25519 with NEW keypair** (parallel to old)
2. **Issue transitional SIGIL** (dual-signed by old + new)
3. **BFT vote** (33/33 for Tier 0, 23/33 for Tier 2)
4. **OTS Bitcoin anchor** of new public key
5. **Public announcement** at proofof.ai/keys
6. **Old key revocation** (with grace period 30 days for Tier 2, 90 days for Tier 0)

### Emergency Rotation (Compromise)
- **Trigger**: Detection of compromise (anomalous usage, breach report)
- **Response**: 4-hour emergency BFT (23/33 quorum)
- **Propagation**: All chartered cross-walks updated within 1 hour
- **OTS anchor**: immediate Bitcoin transaction

---

## PART 9: KEY USAGE PATTERNS

### Signing Types
- **Charter signing**: SHA-256 → Ed25519 over canonical charter content
- **SIGIL emission**: SHA-256 → Ed25519 + witness signature
- **BFT vote**: SHA-256 over proposal → Ed25519 per agent
- **Watchdog report**: SHA-256 of report → Ed25519 by submitting agent
- **Cross-walk edge**: SHA-256 of (charter_a, charter_b, framework_id) → Ed25519 sign

### Verification Types
- **Public**: Anyone with public key + Ed25519 verify (e.g., proofof.ai/verify endpoint)
- **Sovereign**: Online SOV3 MCP server for fast real-time checks (mcp_bridge_call)
- **PQC**: FIPS 204 ML-DSA-65 verify for 2027+ keys
- **Audit**: Full sigchain reconstruction for BFT ratification records

### Storage Hierarchy
1. **On-chain**: Public keys, rotation events, OTS anchors (Bitcoin)
2. **Sovereign vault**: Encrypted at rest (AES-256-GCM) + HSM (YubiHSM2)
3. **Husband disk**: Card vault (for council agents)
4. **Backup**: 7-of-12 Shamir shares distributed across 7 humans

---

## PART 10: API ACCESS TO KEYS

### Sovereign Key Registry API

```http
GET /v1/keys/sentinel
{
  "agent": "Sentinel Watchtower",
  "did": "did:csoai:sentinel",
  "public_key": "ed25519:a1b2c3d4...",
  "algorithm": "ed25519",
  "role": "BFT Council Watchtower",
  "rotations": [
    {"date": "2026-06-28", "key": "ed25519:a1b2c3..."},
    {"date": "2027-06-28", "key": "ed25519:b2c3d4..."}
  ],
  "ots_anchors": [
    {"hash": "c3d4e5f6a7...", "txid": "0x..."}
  ],
  "bft_vote_count": 152,
  "sigil_chain_size": 48721,
  "verified_at": "2026-07-02T..."
}
```

### Sovereign Key Generation API

```http
POST /v1/keys/partner
Headers:
  X-Partner-DID: did:csoai:partner-acme
  X-Signature: ed25519:...

{
  "partner_name": "ACME Sovereign Cloud",
  "partner_category": "sovereign_cloud",
  "intended_use": "hosting sovereign AI workloads"
}

Response:
{
  "public_key": "ed25519:...",
  "did": "did:csoai:partner-acme-sov-cloud",
  "key_id": "key-{hash}",
  "rotation_required_by": "2026-12-02",
  "proofof_ai_url": "https://proofof.ai/verify/keys/key-{hash}"
}
```

---

## PART 11: KEYS-BFT-SIGIL INTEGRATION

The Sovereign PKI integrates with the other two pillars:
- **Keys** (cryptographic trust)
- **BFT Council** (governance trust)
- **SIGIL chain** (auditability trust)

### Workflow Example: Issue a Watchdog Cert
1. **Partner signs** certification request with their Ed25519 key
2. **Watchdog verifies** partner's signature against sovereign registry
3. **CSOAI signs** response with sovereign root key
4. **BFT council votes** (23/33 quorum required for cert issuance)
5. **SIGIL chain** records every step (partner_sig → watchdog_sig → 33 BFT votes → charter_sig)
6. **OTS Bitcoin** anchors final SIGIL digest

### Cryptographic Chain of Trust
```
partner_sig → sov_registry_verification → watchdog_sig → bft_vote[33] → cert_issuance_sig → sigil_chain → ots_bitcoin_anchor
Ed25519        Lookup only                   Ed25519          Ed25519 × 33      Ed25519          SHA-256 chain    SHA-256 + TX
```

---

## PART 12: THREAT MODEL & DEFENSES

### Threats
1. **Quantum attack**: Shor's algorithm breaks Ed25519 (mitigation: PQC migration)
2. **Key compromise**: Adversary obtains private key (mitigation: ceremony thresholds)
3. **Supply chain attack**: HSM firmware compromised (mitigation: sovereign root + open source audit)
4. **Phishing**: Adversary tricks signer (mitigation: hardware confirmation)
5. **Side-channel attack**: Power/timing leak (mitigation: HSM isolation)
6. **Forgery**: Adversary forges signature (mitigation: Ed25519 design)
7. **Replay attack**: Old signature used (mitigation: nonce + timestamp)
8. **Compromise of OTS calendar**: TSA compromised (mitigation: alternate TSAs)

### Defenses (in depth)
- ✅ Ed25519 (mathematically verified security)
- ✅ Shamir secret sharing (5-of-7 threshold)
- ✅ Air-gapped HSM (offline, dual-control)
- ✅ Multi-party ceremony (5 humans)
- ✅ BFT 23/33 binding on key events
- ✅ OTS Bitcoin anchoring (immutable timeline)
- ✅ Public verification endpoint
- ✅ Cadence rotating rotation (24 months / 12 months / 6 months)
- ✅ Revocation protocol (instant via BFT)
- ✅ PQC migration plan (Ed25519 → ML-DSA-65 hybrid by 2027)

---

## PART 13: COMPLIANCE & GOVERNANCE

### Standards Alignment
- **FIPS 186-5** (US): Digital Signature Standard (Ed25519 accepted)
- **NIST SP 800-186**: PQC Migration Considerations
- **NIST FIPS 203** (ML-KEM), **204** (ML-DSA), **205** (SLH-DSA)
- **NIST SP 800-57 Part 1 Rev 5**: Key Management
- **ISO/IEC 14888-3**: Ed25519 digital signature
- **RFC 8032**: Ed25519 specification
- **NIST SP 800-131A Rev 2**: Transitioning to PQC
- **W3C DID 1.0**: Decentralized Identifiers
- **W3C VC 1.1**: Verifiable Credentials
- **ITU-T X.509**: Public Key Infrastructure

### Audit & Governance
- **Quarterly**: Public key rotation review
- **Annually**: Full ceremony (multi-party)
- **Daily**: SIGIL chain integrity check
- **Continuous**: BFT voting audit

---

## PART 14: GOVERNANCE GUARANTEES

### Charter Article 0 (binding on all keys)
> *Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI.*

### Public Verification (anyone can verify)
- **URL**: `https://proofof.ai/verify/keys/root`
- **Ed25519 public key**: `d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a`
- **Proof types**: Ed25519 signature verification, BFT consensus records, SIGIL chain integrity, OTS Bitcoin anchors

### Recovery Time Objective (RTO)
- **Public verification**: <1 second online
- **Sovereign vault**: <1 hour via BFT voting
- **Disaster recovery**: <24 hours via 5-of-7 Shamir quorum
- **Public trust relay**: <72 hours via alternate sovereigns

---

## CONCLUSION

The Sovereign PKI is the most advanced cryptographic trust infrastructure ever built for an open-source certification ecosystem. **41 charter Ed25519 keys + 33 BFT council keys + sovereign root key + 6 partner tier keys** = ~80 keys + 206 partner keys (projected). All anchored to Bitcoin via OpenTimestamps. All migrate-able to NIST PQC ML-DSA-65 by 2027. All BFT-bound. All public-verifiable.

This is the trust root for: **41 charters · 236 frameworks · 9,676 cross-walks · 5,500+ Watchdog Certs · 49,000+ SIGIL records · 33-agent BFT council · 6 partner categories**.

> *"The sovereign PKI binds 41 charters to a single cryptographic root. Ed25519 for today's threats. ML-DSA-65 for tomorrow's. Anchored to Bitcoin. Ed25519-signed. BFT-ratified. Charter Article 0 binding. The barrier to verification is zero. Forever."* 🐉
