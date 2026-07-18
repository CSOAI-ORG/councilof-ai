# MEOK SBT Program Specification
## Soulbound Token Smart Contract — Technical Reference

---

## Program Details

| Field | Value |
|-------|-------|
| **Program ID** | `Dyd7JtmmuA3RZZupk98mqRQ8uySZV9FwTE6aNYmxPxpo` |
| **Network** | Solana Devnet (Mainnet TBD) |
| **Language** | Rust |
| **Solana Program Version** | 2.0.0 |
| **Borsh Version** | 1.5.0 |
| **Build Tool** | cargo-build-sbf v4.0.0 |
| **Status** | Built, tested, ready to deploy |

---

## SBT Types (Charter Mapping)

| ID | Enum Variant | Charter Article | Use Case |
|----|-------------|-----------------|----------|
| 0 | `AgentIdentity` | Article 2 — Safety Case Requirements | AI agent origin + training data hash |
| 1 | `SafetyCertification` | Article 10.2 — Risk-Based Licensing | Post-audit compliance credential |
| 2 | `VerifierReputation` | Article 11 — Byzantine Council Review | Human verifier work history |
| 3 | `CharacterGenesis` | Article 6 — Material Covenant Bond | Character archetype origin proof |
| 4 | `EnterpriseTrust` | Article 8 — Prosperity Fund | KYC/compliance enterprise badge |

---

## Account Structure

```rust
pub struct SbtAccount {
    pub owner: Pubkey,              // Bound wallet (non-transferable)
    pub issuer: Pubkey,             // MEOK ONE | Proof registry
    pub sbt_type: SbtType,          // One of 5 types
    pub token_id: u64,              // Unique within type
    pub created_at: i64,            // Unix timestamp
    pub expires_at: i64,            // 0 = never
    pub revoked: bool,              // Issuer can revoke
    pub metadata_uri: String,       // IPFS/Arweave hash
    pub charter_reference: String,  // e.g., "10.2.3"
    pub risk_tier: u8,              // Low=0, Medium=1, High=2, Critical=3
    pub verification_hours: u64,    // For VerifierReputation SBTs
    pub _reserved: [u8; 64],        // Future fields
}
```

**Account size:** ~300 bytes (variable due to strings)

---

## Instructions

### Mint (`variant: 0`)
```
Accounts: [sbt_pda, owner, issuer, system_program]
Data: { sbt_type, token_id, metadata_uri, charter_reference, risk_tier, expires_at }
```
- Only issuer can mint
- PDA derived from: `["sbt", owner_pubkey, sbt_type_byte, token_id_bytes]`

### Revoke (`variant: 1`)
```
Accounts: [sbt_account, issuer]
Data: { token_id }
```
- Only original issuer can revoke
- Sets `revoked = true`

### Renew (`variant: 2`)
```
Accounts: [sbt_account, issuer]
Data: { token_id, new_expires_at }
```
- Extends expiry timestamp

### UpdateHours (`variant: 3`)
```
Accounts: [sbt_account, issuer]
Data: { token_id, additional_hours }
```
- Only valid for `VerifierReputation` SBTs
- Accumulates verification work hours

---

## Verification Logic

An SBT is **VALID** when:
1. Owner matches query
2. SBT type matches query
3. `revoked == false`
4. `expires_at == 0` OR `expires_at > now()`

An SBT is **INVALID** when any of the above fail.

**Verification flow:**
```
Enterprise queries proofof.ai
    → Registry checks Solana account
    → Returns YES/NO in <200ms
    → Includes charter reference + risk tier
```

---

## Deployment Checklist

- [x] Contract written
- [x] Unit tests passing (3/3)
- [x] BPF build successful
- [x] Program keypair generated
- [x] Payer keypair generated
- [x] Devnet configured
- [ ] SOL airdrop received
- [ ] `solana program deploy`
- [ ] Verify on Solana Explorer
- [ ] Mint first 7 Character Genesis SBTs
- [ ] Mint first Agent Identity SBT
- [ ] Mint first Verifier Reputation SBT
- [ ] Update Trust Registry API with program ID

---

*Specification version: 1.0.0*  
*Last updated: 2026-05-29*
