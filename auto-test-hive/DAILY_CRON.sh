#!/bin/bash
# Auto-test hive daily cron for 4 Jul launch prep
# Run daily 08:00 BST from 26 JUN to 3 JUL, then every 6 hours after launch
# Logs to /tmp/auto-test-hive-cron.log

set -e
echo "=== Auto-test hive daily run: $(date) ===" >> /tmp/auto-test-hive-cron.log

# T1 smoke
python3 /Users/nicholas/clawd/auto-test-hive/auto_test_hive.py smoke >> /tmp/auto-test-hive-cron.log 2>&1

# T2 unit
python3 /Users/nicholas/clawd/auto-test-hive/auto_test_hive.py unit >> /tmp/auto-test-hive-cron.log 2>&1

# T3 integration
python3 /Users/nicholas/clawd/auto-test-hive/auto_test_hive.py integration >> /tmp/auto-test-hive-cron.log 2>&1

# Cross-hive (full)
python3 /Users/nicholas/clawd/auto-test-hive/cross_hive_tests.py >> /tmp/auto-test-hive-cron.log 2>&1

# SIGIL emit
curl -s --max-time 5 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"C|jeeves-cli|daily-auto-test-$(date +%Y-%m-%d)|All 3 tiers + cross-hive PASS. Sovereign. Execute.\"}}}" > /dev/null 2>&1

echo "=== Daily auto-test complete: $(date) ===" >> /tmp/auto-test-hive-cron.log
