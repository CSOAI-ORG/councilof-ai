#!/usr/bin/env bash
#
# verify.sh — the SHELL entry point for DEFONEOS regulator-facing verification.
#
# A thin wrapper around `python3 verify_command.py`. Suitable for inclusion
# in regulator toolkits that prefer a shell entrypoint. Prints human output
# by default; pass `--json` for machine output.
#
# Usage:
#   ./verify.sh MEOK_SYSTEM_CARD.md
#   ./verify.sh MEOK_OSCAL_COMPONENT.json
#   ./verify.sh MEOK_OSCAL_COMPONENT.json.sig.json
#   ./verify.sh --json receipt.json
#
# Exit codes: 0 = accept · 1 = reject · 2 = error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
    echo "verify.sh: python3 not found in PATH" >&2
    exit 2
fi

# Confirm the cryptography library is present (Ed25519)
if ! python3 -c "import cryptography; from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey" 2>/dev/null; then
    echo "verify.sh: Python 'cryptography' library is required (pip install cryptography)" >&2
    exit 2
fi

# Two flavours: forward everything to the python entrypoint
if [ "${1:-}" = "--json" ]; then
    shift
    exec python3 "$SCRIPT_DIR/verify_command.py" --output json "$@"
else
    exec python3 "$SCRIPT_DIR/verify_command.py" "$@"
fi