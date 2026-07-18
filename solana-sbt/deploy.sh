#!/bin/bash
# MEOK SBT Deployment Script
# Run after obtaining devnet SOL

set -e

echo "=== MEOK SBT Deployment ==="
echo "Program ID: $(cat program-keypair.json | solana-keygen pubkey -)"
echo "Payer: $(solana address)"
echo "Network: $(solana config get | grep RPC)"
echo ""

# Check balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Payer balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "ERROR: Need at least 2 SOL for deployment"
    echo "Run: solana airdrop 2"
    exit 1
fi

# Deploy program
echo "Deploying SBT program..."
solana program deploy target/deploy/meok_sbt.so --program-id program-keypair.json --max-len 200000

# Update client with actual program ID
PROGRAM_ID=$(solana-keygen pubkey program-keypair.json)
echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Program ID: $PROGRAM_ID"
echo ""
echo "Update client/sbt_client.ts:"
echo "  export const PROGRAM_ID = new PublicKey('$PROGRAM_ID');"
echo ""
echo "Mint first test SBTs:"
echo "  ts-node client/mint_test.ts"
