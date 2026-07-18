use crate::{SbtType, SbtAccount, SbtInstruction};
use solana_program::pubkey::Pubkey;

#[test]
fn test_sbt_type_serialization() {
    let agent = SbtType::AgentIdentity;
    let serialized = borsh::to_vec(&agent).unwrap();
    let deserialized: SbtType = borsh::from_slice(&serialized).unwrap();
    assert_eq!(agent, deserialized);
    assert_eq!(agent as u8, 0);

    let verifier = SbtType::VerifierReputation;
    assert_eq!(verifier as u8, 2);
}

#[test]
fn test_sbt_account_serialization() {
    let owner = Pubkey::new_unique();
    let issuer = Pubkey::new_unique();
    let account = SbtAccount {
        owner, issuer,
        sbt_type: SbtType::CharacterGenesis,
        token_id: 1,
        created_at: 1716912000,
        expires_at: 0,
        revoked: false,
        metadata_uri: "ipfs://QmTest123".to_string(),
        charter_reference: "Article 6 — Material Covenant Bond".to_string(),
        risk_tier: 0,
        verification_hours: 0,
        _reserved: [0; 64],
    };
    let serialized = borsh::to_vec(&account).unwrap();
    let deserialized: SbtAccount = borsh::from_slice(&serialized).unwrap();
    assert_eq!(account.owner, deserialized.owner);
    assert_eq!(account.sbt_type, deserialized.sbt_type);
    assert_eq!(account.token_id, deserialized.token_id);
    assert_eq!(account.charter_reference, deserialized.charter_reference);
}

#[test]
fn test_instruction_serialization() {
    let mint = SbtInstruction::Mint {
        sbt_type: SbtType::SafetyCertification,
        token_id: 42,
        metadata_uri: "ipfs://QmSafety".to_string(),
        charter_reference: "Article 10.2.3".to_string(),
        risk_tier: 2,
        expires_at: 0,
    };
    let serialized = borsh::to_vec(&mint).unwrap();
    let deserialized: SbtInstruction = borsh::from_slice(&serialized).unwrap();
    match deserialized {
        SbtInstruction::Mint { sbt_type, token_id, risk_tier, .. } => {
            assert_eq!(sbt_type, SbtType::SafetyCertification);
            assert_eq!(token_id, 42);
            assert_eq!(risk_tier, 2);
        }
        _ => panic!("Wrong instruction type"),
    }
}
