#!/usr/bin/env bash
# tui4-owner-actions.sh — Owner-gated actions for TUI 4 completion
#
# Run each section after the corresponding prerequisite is met.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== TUI 4 Owner Actions ==="
echo ""

# Action 1: Fund the throwaway wallet and execute the x402 test
echo "--- Action 1: Execute x402 0.01 USDC test ---"
echo "Prerequisites:"
echo "  1. Create a burner wallet: bash scripts/badger/make-payer-wallet.sh"
echo "  2. Send0.01 USDC on Base to the printed address"
echo "  3. export X402_PAYER_KEY=\$(cat .payer.key)"
echo "  4. bash scripts/tui4-execute-x402-test.sh"
echo ""
echo "OR use the existing funded wallet (0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7):"
echo "  export X402_PAYER_KEY=<private-key-from-wallet-manager>"
echo "  bash scripts/tui4-execute-x402-test.sh"
echo ""

# Action 2: Publish MCP Registry update
echo "--- Action 2: Publish MCP Registry v1.4.2 ---"
echo "Prerequisites:"
echo "  1. GitHub OAuth token for mcp-publisher"
echo "  2. Run:"
echo "     cd mcp/gspc-server && mcp-publisher publish"
echo ""
echo "This fixes:"
echo "  - Registry version 1.4.0 ->1.4.2"
echo "  - Tool count '7 free,5 x402' -> '8 free,4 x402'"
echo ""

# Action 3: Withdraw broken registry entries
echo "--- Action 3: Withdraw54 broken registry entries ---"
echo "See docs/tui4/REGISTRY-SUPERSEDED-2026-09-11.json for the full manifest."
echo ""
echo "Repointable (11): fix repository URLs"
echo "  mcp-publisher publish  # with corrected server.json for each"
echo ""
echo "Withdraw-or-publish (23): owner decision"
echo "  # For each: either publish the repo, or withdraw the entry"
echo "  mcp-publisher withdraw <server-name>"
echo ""
echo "Bad batch (19): repos never created"
echo "  mcp-publisher withdraw meek_3d-print-toolchain-mcp"
echo "  mcp-publisher withdraw meek_antenna-triangle-mcp"
echo "  # ... (full list in REGISTRY-SUPERSEDED-2026-09-11.json)"
echo ""

# Action 4: Fix Smithery
echo "--- Action 4: Fix Smithery listing ---"
echo "1. Sign in to smithery.ai"
echo "2. Update csoai/gspc connection to https://councilof.ai/mcp"
echo "3. Let it re-scan tools"
echo "4. Retire stale csoai/gspc duplicate"
echo ""

# Action 5: Fix Glama
echo "--- Action 5: Fix Glama health ---"
echo "1. Sign in to glama.ai"
echo "2. Update connector URLs to https://councilof.ai/mcp"
echo "3. Re-trigger health check"
echo ""

# Action 6: Submit to mcp.so
echo "--- Action 6: Submit to mcp.so ---"
echo "1. Open https://mcp.so/submit"
echo "2. Enter repo: https://github.com/CSOAI-ORG/councilof-ai"
echo "3. Save draft"
echo ""

echo "=== End ==="
