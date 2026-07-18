#!/bin/bash
# Kimi CLI wrapper for OpenClaw integration
# This allows OpenClaw to use Kimi CLI via subprocess calls

# Check if kimi CLI is available
if ! command -v kimi &> /dev/null; then
    echo "Error: Kimi CLI not found in PATH" >&2
    exit 1
fi

# Function to run Kimi with a prompt
run_kimi() {
    local prompt="$1"
    local thinking="${2:-false}"
    
    if [ "$thinking" = "true" ]; then
        kimi --thinking <<< "$prompt" 2>&1
    else
        kimi <<< "$prompt" 2>&1
    fi
}

# Handle different modes
MODE="${KIMI_MODE:-chat}"

 case "$MODE" in
    chat)
        # Read prompt from stdin or argument
        if [ -n "$1" ]; then
            PROMPT="$1"
        else
            PROMPT=$(cat)
        fi
        run_kimi "$PROMPT" "${KIMI_THINKING:-false}"
        ;;
    code)
        # Coding mode - read file or stdin
        if [ -n "$1" ] && [ -f "$1" ]; then
            PROMPT="Analyze and improve this code:\n\n$(cat "$1")"
        else
            PROMPT=$(cat)
        fi
        KIMI_THINKING=true run_kimi "$PROMPT" "true"
        ;;
    review)
        # Code review mode
        if [ -n "$1" ] && [ -d "$1" ]; then
            # Review a directory
            cd "$1" || exit 1
            PROMPT="Review this codebase and provide suggestions for improvement:\n\n$(find . -type f -name '*.py' -o -name '*.js' -o -name '*.ts' -o -name '*.rs' 2>/dev/null | head -20 | xargs cat 2>/dev/null)"
        else
            PROMPT=$(cat)
        fi
        KIMI_THINKING=true run_kimi "$PROMPT" "true"
        ;;
    *)
        # Default: pass through to kimi
        kimi "$@" 2>&1
        ;;
esac
