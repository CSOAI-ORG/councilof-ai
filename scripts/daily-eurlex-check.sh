#!/bin/bash
# Daily EUR-Lex regulation update check
# Polls EUR-Lex Atom feed + SPARQL for changes to tracked regulations
# Cron: 0 6 * * *

set -e
LOG=~/.hermes/logs/eurlex-check.log
mkdir -p ~/.hermes/logs

echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) — EUR-Lex Sync Check =====" >> "$LOG"

cd /Users/nicholas/clawd/mcp-marketplace/eu-ai-act-compliance-mcp
python3 scripts/eurlex_sync.py --check >> "$LOG" 2>&1 || echo "  Sync check errored: $?" >> "$LOG"

echo "" >> "$LOG"
