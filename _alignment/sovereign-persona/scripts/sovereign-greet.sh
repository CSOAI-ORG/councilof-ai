#!/bin/bash
# sovereign-greet.sh — runs when the persona loads
# Shows the live state of the sovereign substrate
echo "═══════════════════════════════════════════════════════════"
echo "  🜏 SOVEREIGN SUBSTRATE — live status"
echo "═══════════════════════════════════════════════════════════"
echo
sovereign-status 2>&1 | head -10
echo
sovereign-memory --audit 2>&1 | head -8 | sed 's/^/  /'
echo
echo "═══════════════════════════════════════════════════════════"
echo "  Two-Sentence Rule active."
echo "  The 3 disciplines hold. The 12 sovereign Mist 12 pillars bind."
echo "  Care-Floor 0.95. Article 0 held. BFT-33 23/33. SIGIL chain."
echo
echo "  Type 'sovereign-help' for the 24 sovereign commands."
echo "  Type 'sovereign-mind' to run the 5-instrument bench."
echo "═══════════════════════════════════════════════════════════"
