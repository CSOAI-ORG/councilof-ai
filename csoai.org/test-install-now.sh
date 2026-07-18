#!/bin/bash
# This is the simulation of: curl -sSL https://sov3.csoai.org/install.sh | bash
# Currently uses local path because sov3.csoai.org is not yet deployed
# Once Nick registers sov3.csoai.org in Vercel, change to:
#   curl -sSL https://sov3.csoai.org/install.sh | bash

echo "🜏 SOV3 Install Verifier — Day 2 of 5"
echo ""
echo "Step 1: Local install (works now)"
bash /Users/nicholas/clawd/csoai.org/install-local.sh

echo ""
echo "Step 2: After Vercel deploy, the same flow becomes:"
echo "  curl -sSL https://sov3.csoai.org/install.sh | bash"
echo ""
echo "Step 3: Verify sov3 command"
which sov3 && echo "✅ sov3 in PATH"
sov3 2>&1 | head -10
