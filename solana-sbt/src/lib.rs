use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
    system_instruction,
};
use borsh::{BorshDeserialize, BorshSerialize};

// ---------------------------------------------------------------------------
// MEOK SBT — Soulbound Token Smart Contract
// Implements minimal soulbound NFT standard on Solana
// Maps to CSOAI Charter Articles for governance credentials
// ---------------------------------------------------------------------------

entrypoint!(process_instruction);

/// SBT Types mapped to CSOAI Charter Articles
#[repr(u8)]
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub enum SbtType {
    /// Article 2 — Safety Case Requirements
    AgentIdentity,
    /// Article 10.2 — Risk-Based Licensing Tiers
    SafetyCertification,
    /// Article 11 — Byzantine Council Review
    VerifierReputation,
    /// Article 6 — Material Covenant Bond
    CharacterGenesis,
    /// Article 8 — Prosperity Fund
    EnterpriseTrust,
}

/// SBT Account Data
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
pub struct SbtAccount {
    /// The wallet this SBT is bound to (non-transferable)
    pub owner: Pubkey,
    /// The issuer (MEOK ONE | Proof registry)
    pub issuer: Pubkey,
    /// SBT type (AgentIdentity, SafetyCertification, etc.)
    pub sbt_type: SbtType,
    /// Unique identifier within type
    pub token_id: u64,
    /// Creation timestamp (Unix seconds)
    pub created_at: i64,
    /// Expiry timestamp (0 = never)
    pub expires_at: i64,
    /// Revocation status
    pub revoked: bool,
    /// IPFS/Arweave hash of attestation data
    pub metadata_uri: String,
    /// Charter article reference (e.g., "10.2.3")
    pub charter_reference: String,
    /// Risk tier (for SafetyCertification SBTs): Low=0, Medium=1, High=2, Critical=3
    pub risk_tier: u8,
    /// Verification hours (for VerifierReputation SBTs)
    pub verification_hours: u64,
    /// Reserved for future fields
    pub _reserved: [u8; 64],
}

/// Instruction types
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
pub enum SbtInstruction {
    /// Mint a new SBT (issuer only)
    Mint {
        sbt_type: SbtType,
        token_id: u64,
        metadata_uri: String,
        charter_reference: String,
        risk_tier: u8,
        expires_at: i64,
    },
    /// Revoke an SBT (issuer only)
    Revoke { token_id: u64 },
    /// Renew an SBT (extends expiry)
    Renew {
        token_id: u64,
        new_expires_at: i64,
    },
    /// Update verification hours (VerifierReputation SBTs)
    UpdateHours {
        token_id: u64,
        additional_hours: u64,
    },
}

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = SbtInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        SbtInstruction::Mint {
            sbt_type,
            token_id,
            metadata_uri,
            charter_reference,
            risk_tier,
            expires_at,
        } => process_mint(
            program_id,
            accounts,
            sbt_type,
            token_id,
            metadata_uri,
            charter_reference,
            risk_tier,
            expires_at,
        ),
        SbtInstruction::Revoke { token_id } => process_revoke(program_id, accounts, token_id),
        SbtInstruction::Renew {
            token_id,
            new_expires_at,
        } => process_renew(program_id, accounts, token_id, new_expires_at),
        SbtInstruction::UpdateHours {
            token_id,
            additional_hours,
        } => process_update_hours(program_id, accounts, token_id, additional_hours),
    }
}

fn process_mint(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    sbt_type: SbtType,
    token_id: u64,
    metadata_uri: String,
    charter_reference: String,
    risk_tier: u8,
    expires_at: i64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let sbt_account = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let issuer = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    // Only the program issuer can mint
    if !issuer.is_signer {
        msg!("Error: Issuer must sign the mint transaction");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Derive PDA for SBT account: ["sbt", owner_pubkey, sbt_type, token_id]
    let sbt_type_byte = sbt_type.clone() as u8;
    let (expected_pda, bump_seed) = Pubkey::find_program_address(
        &[
            b"sbt",
            owner.key.as_ref(),
            &[sbt_type_byte],
            &token_id.to_le_bytes(),
        ],
        program_id,
    );

    if expected_pda != *sbt_account.key {
        msg!("Error: Invalid SBT account address");
        return Err(ProgramError::InvalidAccountData);
    }

    // Calculate rent-exempt balance
    let rent = Rent::get()?;
    let sbt_data = SbtAccount {
        owner: *owner.key,
        issuer: *issuer.key,
        sbt_type: sbt_type.clone(),
        token_id,
        created_at: Clock::get()?.unix_timestamp,
        expires_at,
        revoked: false,
        metadata_uri: metadata_uri.clone(),
        charter_reference: charter_reference.clone(),
        risk_tier,
        verification_hours: 0,
        _reserved: [0; 64],
    };
    let sbt_data_len = borsh::to_vec(&sbt_data)?.len();
    let required_lamports = rent.minimum_balance(sbt_data_len + 128);

    // Create SBT account via CPI
    invoke_signed(
        &system_instruction::create_account(
            issuer.key,
            sbt_account.key,
            required_lamports,
            (sbt_data_len + 128) as u64,
            program_id,
        ),
        &[issuer.clone(), sbt_account.clone(), system_program.clone()],
        &[&[
            b"sbt",
            owner.key.as_ref(),
            &[sbt_type_byte],
            &token_id.to_le_bytes(),
            &[bump_seed],
        ]],
    )?;

    // Serialize and store SBT data
    sbt_data.serialize(&mut &mut sbt_account.data.borrow_mut()[..])?;

    msg!("SBT minted successfully:");
    msg!("  Owner: {}", owner.key);
    msg!("  Type: {:?}", sbt_data.sbt_type);
    msg!("  Token ID: {}", token_id);
    msg!("  Charter Ref: {}", charter_reference);
    msg!("  Metadata: {}", metadata_uri);

    Ok(())
}

fn process_revoke(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    token_id: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let sbt_account = next_account_info(account_info_iter)?;
    let issuer = next_account_info(account_info_iter)?;

    if !issuer.is_signer {
        msg!("Error: Issuer must sign the revoke transaction");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut sbt_data = SbtAccount::try_from_slice(&sbt_account.data.borrow())?;

    if sbt_data.issuer != *issuer.key {
        msg!("Error: Only the original issuer can revoke");
        return Err(ProgramError::IllegalOwner);
    }

    sbt_data.revoked = true;
    sbt_data.serialize(&mut &mut sbt_account.data.borrow_mut()[..])?;

    msg!("SBT revoked: Token ID {}", token_id);
    Ok(())
}

fn process_renew(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    token_id: u64,
    new_expires_at: i64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let sbt_account = next_account_info(account_info_iter)?;
    let issuer = next_account_info(account_info_iter)?;

    if !issuer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut sbt_data = SbtAccount::try_from_slice(&sbt_account.data.borrow())?;

    if sbt_data.issuer != *issuer.key {
        return Err(ProgramError::IllegalOwner);
    }

    sbt_data.expires_at = new_expires_at;
    sbt_data.serialize(&mut &mut sbt_account.data.borrow_mut()[..])?;

    msg!(
        "SBT renewed: Token ID {} → expires at {}",
        token_id,
        new_expires_at
    );
    Ok(())
}

fn process_update_hours(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    token_id: u64,
    additional_hours: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let sbt_account = next_account_info(account_info_iter)?;
    let issuer = next_account_info(account_info_iter)?;

    if !issuer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut sbt_data = SbtAccount::try_from_slice(&sbt_account.data.borrow())?;

    if sbt_data.issuer != *issuer.key {
        return Err(ProgramError::IllegalOwner);
    }

    if sbt_data.sbt_type != SbtType::VerifierReputation {
        msg!("Error: UpdateHours only valid for VerifierReputation SBTs");
        return Err(ProgramError::InvalidInstructionData);
    }

    sbt_data.verification_hours = sbt_data
        .verification_hours
        .saturating_add(additional_hours);
    sbt_data.serialize(&mut &mut sbt_account.data.borrow_mut()[..])?;

    msg!(
        "Verifier hours updated: Token ID {} → {} hours",
        token_id,
        sbt_data.verification_hours
    );
    Ok(())
}



#[cfg(test)]
mod test;
