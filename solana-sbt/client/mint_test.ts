import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { MeokSbtClient, SbtType } from "./sbt_client.ts";
import * as fs from "fs";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  // Load issuer keypair (payer)
  const issuerSecret = JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/id.json", "utf-8"));
  const issuer = Keypair.fromSecretKey(new Uint8Array(issuerSecret));
  
  // Load program keypair
  const programSecret = JSON.parse(fs.readFileSync("../program-keypair.json", "utf-8"));
  const programKeypair = Keypair.fromSecretKey(new Uint8Array(programSecret));
  const programId = programKeypair.publicKey;
  
  const client = new MeokSbtClient(connection, programId);
  
  console.log("MEOK SBT Test Mint");
  console.log("Issuer:", issuer.publicKey.toBase58());
  console.log("Program:", programId.toBase58());
  console.log("");
  
  // Mint 7 Character Genesis SBTs (one per archetype)
  const archetypes = [
    "sovereign", "guardian", "scout", "strategist", 
    "creator", "companion", "sage"
  ];
  
  for (let i = 0; i < archetypes.length; i++) {
    const archetype = archetypes[i];
    const metadataUri = `ipfs://meok-character-${archetype}`;
    
    try {
      const sig = await client.mint(
        issuer,
        issuer.publicKey, // Mint to self for testing
        SbtType.CharacterGenesis,
        BigInt(i + 1),
        metadataUri,
        0, // risk tier
        BigInt(0) // never expires
      );
      console.log(`✅ ${archetype}: ${sig}`);
    } catch (err) {
      console.error(`❌ ${archetype}:`, err);
    }
  }
  
  // Mint 1 Agent Identity SBT
  try {
    const sig = await client.mint(
      issuer,
      issuer.publicKey,
      SbtType.AgentIdentity,
      BigInt(1),
      "ipfs://meok-agent-001",
      2, // High risk tier
      BigInt(0)
    );
    console.log(`✅ Agent Identity: ${sig}`);
  } catch (err) {
    console.error(`❌ Agent Identity:`, err);
  }
  
  // Mint 1 Verifier Reputation SBT
  try {
    const sig = await client.mint(
      issuer,
      issuer.publicKey,
      SbtType.VerifierReputation,
      BigInt(1),
      "ipfs://meok-verifier-001",
      0,
      BigInt(0)
    );
    console.log(`✅ Verifier Reputation: ${sig}`);
  } catch (err) {
    console.error(`❌ Verifier Reputation:`, err);
  }
}

main().catch(console.error);
