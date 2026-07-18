#!/bin/bash
# AI Reply Agent — Daemon Launcher
# Uses SMTP credentials from environment
# Usage: ./launch-reply-agent.sh [--auto-send]

set -e

echo "🤖 Launching AI Reply Agent..."
echo "   SMTP: $SMTP_HOST:$SMTP_PORT ($SMTP_USER)"
echo "   CRM: SQLite at ~/clawd/revenue/reply-agent/crm.db"
echo "   Rate limit: 20 replies/hour"
echo "   Auto-send: ${1:+YES}${1:-NO (draft mode)}"
echo ""

# Create reply agent directory
mkdir -p ~/clawd/revenue/reply-agent

# Export configuration
export IMAP_HOST="${IMAP_HOST:-mail.privateemail.com}"
export IMAP_PORT="${IMAP_PORT:-993}"
export IMAP_USER="${IMAP_USER:-}"
export IMAP_PASSWORD="${IMAP_PASSWORD:-}"

export SMTP_HOST="${SMTP_HOST:-mail.privateemail.com}"
export SMTP_PORT="${SMTP_PORT:-587}"
export SMTP_USER="${SMTP_USER:-nicholas@csoai.org}"
export SMTP_PASSWORD="${SMTP_PASSWORD:-}"
export FROM_EMAIL="${FROM_EMAIL:-nicholas@csoai.org}"
export FROM_NAME="${FROM_NAME:-Nicholas Templeman — MEOK AI Labs}"

export CRM_TYPE="sqlite"
export MAX_REPLIES_PER_HOUR="20"
export CONFIDENCE_THRESHOLD="0.7"
export OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
export OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:7b}"

# Check if SMTP credentials are set
if [ -z "$SMTP_PASSWORD" ]; then
    echo "❌ SMTP_PASSWORD not set — agent will run in dry-run mode"
    echo "   Set SMTP_PASSWORD in your environment to enable sending"
fi

# Check if IMAP credentials are set
if [ -z "$IMAP_PASSWORD" ]; then
    echo "⚠️  IMAP_PASSWORD not set — inbox check will be skipped"
    echo "   Set IMAP_USER and IMAP_PASSWORD to enable inbox monitoring"
    echo "   You can still use --mode draft or --mode stats"
fi

# Run the agent
if [ "$1" = "--auto-send" ]; then
    echo "✅ Auto-send ENABLED — replies will be sent automatically"
    python3 ~/clawd/revenue/ai_reply_agent.py --mode daemon --auto-send --interval 300
else
    echo "📝 Draft mode — replies will be generated but NOT sent"
    echo "   Add --auto-send flag to enable automatic sending"
    python3 ~/clawd/revenue/ai_reply_agent.py --mode daemon --interval 300
fi
