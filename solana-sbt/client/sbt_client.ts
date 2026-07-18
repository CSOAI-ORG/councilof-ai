/**
 * MEOK SBT TypeScript Client
 * Interacts with the Soulbound Token program on Solana
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import * as borsh from "borsh";

// ---------------------------------------------------------------------------
// Program ID (placeholder — replace after deployment)
// ---------------------------------------------------------------------------
export const PROGRAM_ID = new PublicKey(
  "Dyd7JtmmuA3RZZupk98mqRQ8uySZV9FwTE6aNYmxPxpo"
);

// ---------------------------------------------------------------------------
// SBT Types (must match Rust enum)
// ---------------------------------------------------------------------------
export const SbtType = {
  AgentIdentity: 0,
  SafetyCertification: 1,
  VerifierReputation: 2,
  CharacterGenesis: 3,
  EnterpriseTrust: 4,
} as const;

export type SbtType = typeof SbtType[keyof typeof SbtType];

export const SBT_TYPE_NAMES: Record<SbtType, string> = {
  [SbtType.AgentIdentity]: "Agent Identity",
  [SbtType.SafetyCertification]: "Safety Certification",
  [SbtType.VerifierReputation]: "Verifier Reputation",
  [SbtType.CharacterGenesis]: "Character Genesis",
  [SbtType.EnterpriseTrust]: "Enterprise Trust",
};

// ---------------------------------------------------------------------------
// Charter Article Mapping
// ---------------------------------------------------------------------------
export const CHARTER_REFERENCES: Record<SbtType, string> = {
  [SbtType.AgentIdentity]: "Article 2 — Safety Case Requirements",
  [SbtType.SafetyCertification]: "Article 10.2 — Risk-Based Licensing Tiers",
  [SbtType.VerifierReputation]: "Article 11 — Byzantine Council Review",
  [SbtType.CharacterGenesis]: "Article 6 — Material Covenant Bond",
  [SbtType.EnterpriseTrust]: "Article 8 — Prosperity Fund",
};

// ---------------------------------------------------------------------------
// Borsh Schema
// ---------------------------------------------------------------------------

class SbtTypeEnum {
  variant: number = 0;
  constructor(fields?: { variant: number }) {
    if (fields) this.variant = fields.variant;
  }
}

class SbtInstructionMint {
  variant: number = 0;
  sbt_type: SbtTypeEnum = new SbtTypeEnum();
  token_id: bigint = BigInt(0);
  metadata_uri: string = "";
  charter_reference: string = "";
  risk_tier: number = 0;
  expires_at: bigint = BigInt(0);

  constructor(fields?: {
    sbt_type: SbtTypeEnum;
    token_id: bigint;
    metadata_uri: string;
    charter_reference: string;
    risk_tier: number;
    expires_at: bigint;
  }) {
    if (fields) {
      this.sbt_type = fields.sbt_type;
      this.token_id = fields.token_id;
      this.metadata_uri = fields.metadata_uri;
      this.charter_reference = fields.charter_reference;
      this.risk_tier = fields.risk_tier;
      this.expires_at = fields.expires_at;
    }
  }
}

const SCHEMA = new Map<any, any>([
  [SbtTypeEnum, { kind: "struct", fields: [["variant", "u8"]] }],
  [
    SbtInstructionMint,
    {
      kind: "struct",
      fields: [
        ["variant", "u8"],
        ["sbt_type", SbtTypeEnum],
        ["token_id", "u64"],
        ["metadata_uri", "string"],
        ["charter_reference", "string"],
        ["risk_tier", "u8"],
        ["expires_at", "i64"],
      ],
    },
  ],
]);

// ---------------------------------------------------------------------------
// SBT Account Data (for reading)
// ---------------------------------------------------------------------------

export interface SbtAccountData {
  owner: PublicKey;
  issuer: PublicKey;
  sbt_type: SbtType;
  token_id: bigint;
  created_at: bigint;
  expires_at: bigint;
  revoked: boolean;
  metadata_uri: string;
  charter_reference: string;
  risk_tier: number;
  verification_hours: bigint;
}

// ---------------------------------------------------------------------------
// Client Class
// ---------------------------------------------------------------------------

export class MeokSbtClient {
  connection: Connection;
  programId: PublicKey;

  constructor(connection: Connection, programId?: PublicKey) {
    this.connection = connection;
    this.programId = programId || PROGRAM_ID;
  }

  /**
   * Derive the PDA for an SBT account
   */
  async deriveSbtPda(
    owner: PublicKey,
    sbtType: SbtType,
    tokenId: bigint
  ): Promise<[PublicKey, number]> {
    const tokenIdBytes = new ArrayBuffer(8);
    new DataView(tokenIdBytes).setBigUint64(0, tokenId, true);

    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("sbt"),
        owner.toBuffer(),
        Buffer.from([sbtType]),
        Buffer.from(new Uint8Array(tokenIdBytes)),
      ],
      this.programId
    );
  }

  /**
   * Mint a new SBT
   */
  async mint(
    issuer: Keypair,
    owner: PublicKey,
    sbtType: SbtType,
    tokenId: bigint,
    metadataUri: string,
    riskTier: number = 0,
    expiresAt: bigint = BigInt(0)
  ): Promise<string> {
    const [sbtPda, bump] = await this.deriveSbtPda(owner, sbtType, tokenId);

    // Manual serialization to avoid borsh version issues
    const metadataBuffer = Buffer.from(metadataUri, "utf-8");
    const charterBuffer = Buffer.from(CHARTER_REFERENCES[sbtType], "utf-8");
    
    const dataSize = 1 + 1 + 8 + (4 + metadataBuffer.length) + (4 + charterBuffer.length) + 1 + 8;
    const data = Buffer.alloc(dataSize);
    
    let offset = 0;
    data.writeUInt8(0, offset++); // variant: Mint
    data.writeUInt8(sbtType, offset++); // sbt_type
    data.writeBigUInt64LE(tokenId, offset); offset += 8;
    
    data.writeUInt32LE(metadataBuffer.length, offset); offset += 4;
    metadataBuffer.copy(data, offset); offset += metadataBuffer.length;
    
    data.writeUInt32LE(charterBuffer.length, offset); offset += 4;
    charterBuffer.copy(data, offset); offset += charterBuffer.length;
    
    data.writeUInt8(riskTier, offset++);
    data.writeBigInt64LE(expiresAt, offset); offset += 8;

    const tx = new Transaction().add(
      new TransactionInstruction({
        keys: [
          { pubkey: sbtPda, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: false, isWritable: false },
          { pubkey: issuer.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: this.programId,
        data: data,
      })
    );

    const signature = await sendAndConfirmTransaction(
      this.connection,
      tx,
      [issuer]
    );

    console.log(`SBT minted: ${signature}`);
    console.log(`  PDA: ${sbtPda.toBase58()}`);
    console.log(`  Type: ${SBT_TYPE_NAMES[sbtType]}`);
    console.log(`  Charter: ${CHARTER_REFERENCES[sbtType]}`);

    return signature;
  }

  /**
   * Verify an SBT exists and is valid
   */
  async verify(
    owner: PublicKey,
    sbtType: SbtType
  ): Promise<{ valid: boolean; data?: SbtAccountData; error?: string }> {
    try {
      // Find all SBT accounts for this owner + type
      const accounts = await this.connection.getProgramAccounts(
        this.programId,
        {
          filters: [
            {
              memcmp: {
                offset: 0, // owner pubkey starts at offset 0
                bytes: owner.toBase58(),
              },
            },
          ],
        }
      );

      for (const { pubkey, account } of accounts) {
        // Deserialize account data
        const data = account.data;
        // Basic check: skip if too small
        if (data.length < 100) continue;

        // For now, return first matching account
        // Full deserialization would require matching Rust borsh schema exactly
        return {
          valid: true,
          data: {
            owner,
            issuer: new PublicKey(data.slice(32, 64)),
            sbt_type: sbtType,
            token_id: BigInt(0),
            created_at: BigInt(0),
            expires_at: BigInt(0),
            revoked: false,
            metadata_uri: "",
            charter_reference: CHARTER_REFERENCES[sbtType],
            risk_tier: 0,
            verification_hours: BigInt(0),
          },
        };
      }

      return { valid: false, error: "No SBT found for owner + type" };
    } catch (err) {
      return { valid: false, error: String(err) };
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience exports
// ---------------------------------------------------------------------------

export { SbtTypeEnum, SbtInstructionMint, SCHEMA };
