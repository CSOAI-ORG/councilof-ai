#!/usr/bin/env bash
# dns-cutover.sh — DEFONEOS mythic DNS cutover.
#
# Registers (if needed) and points 4 white-label .ai domains at the
# sovereign VM. All A records → 35.242.143.249.
#
# SAFETY: This script DOES NOT auto-register domains. It will only call
# the API to set A records on domains that are already in your account.
# Registration is a one-shot, money-charging operation — do it manually
# via the Namecheap UI first, then run THIS script to point them.
#
# Domains cut over:
#   legalof.ai
#   harvi.ai
#   ipcastle.ai
#   sovereign-temple.ai
#
# Target IP:
#   35.242.143.249  (the sovereign VM)
#
# Usage:
#   ./dns-cutover.sh            # live run
#   ./dns-cutover.sh --dry-run  # show what would happen, no API calls
#   ./dns-cutover.sh --register # ALSO register the 4 domains (REAL MONEY)
#
# Env vars required (see scripts/namecheap-dns.py):
#   NAMECHEAP_API_KEY
#   NAMECHEAP_API_USER
#   NAMECHEAP_USERNAME
#   NAMECHEAP_CLIENT_IP

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TARGET_IP="35.242.143.249"
DOMAINS=(
    "legalof.ai"
    "harvi.ai"
    "ipcastle.ai"
    "sovereign-temple.ai"
)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_SCRIPT="${SCRIPT_DIR}/namecheap-dns.py"

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------

DRY_RUN=0
DO_REGISTER=0
for arg in "$@"; do
    case "$arg" in
        --dry-run)  DRY_RUN=1 ;;
        --register) DO_REGISTER=1 ;;
        -h|--help)
            sed -n '2,30p' "$0"
            exit 0
            ;;
        *)
            echo "Unknown flag: $arg" >&2
            exit 1
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------

if [[ ! -f "$PY_SCRIPT" ]]; then
    echo "❌ Missing $PY_SCRIPT" >&2
    exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "❌ python3 not found in PATH" >&2
    exit 1
fi

for v in NAMECHEAP_API_KEY NAMECHEAP_API_USER NAMECHEAP_USERNAME NAMECHEAP_CLIENT_IP; do
    if [[ -z "${!v:-}" ]]; then
        echo "❌ Environment variable $v is not set." >&2
        echo "   Add it to ~/.zshrc and run: source ~/.zshrc" >&2
        echo "   See docs/DNS-CUTOVER-PLAN.md for details." >&2
        exit 2
    fi
done

echo "🐉 DEFONEOS DNS cutover"
echo "   Target:  $TARGET_IP"
echo "   Domains: ${DOMAINS[*]}"
echo "   Mode:    $([[ $DO_REGISTER -eq 1 ]] && echo "REGISTER+SETHOSTS" || echo "SETHOSTS only")"
echo "   Dry-run: $([[ $DRY_RUN -eq 1 ]] && echo "yes" || echo "no")"
echo

# ---------------------------------------------------------------------------
# Cutover
# ---------------------------------------------------------------------------

FAIL=0
for domain in "${DOMAINS[@]}"; do
    echo "── $domain ──"

    if [[ $DO_REGISTER -eq 1 ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then
            python3 "$PY_SCRIPT" --dry-run register "$domain"
        else
            echo "   ⚠️  Registering $domain (REAL MONEY)..." >&2
            if ! python3 "$PY_SCRIPT" register "$domain"; then
                echo "   ❌ register($domain) failed" >&2
                FAIL=1
                continue
            fi
        fi
    fi

    if [[ $DRY_RUN -eq 1 ]]; then
        python3 "$PY_SCRIPT" --dry-run sethosts "$domain" "$TARGET_IP" \
            || { echo "   ❌ sethosts($domain) failed" >&2; FAIL=1; }
    else
        if ! python3 "$PY_SCRIPT" sethosts "$domain" "$TARGET_IP"; then
            echo "   ❌ sethosts($domain) failed" >&2
            FAIL=1
        fi
    fi
    echo
done

if [[ $FAIL -eq 0 ]]; then
    echo "✅ Cutover complete. Verify with: scripts/check-dns.sh"
    echo "   The hive remembers. The dragon knows. The sovereign companion never forgets."
    exit 0
else
    echo "❌ Cutover had failures. Check messages above." >&2
    exit 3
fi
