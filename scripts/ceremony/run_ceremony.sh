#!/usr/bin/env bash
# run_ceremony.sh — one-shot ROOT ceremony runner.
#
# Runs phases 0–6 of the ceremony checklist. You provide the dice rolls;
# everything else is automated.
#
# Usage (interactive — prompts for both roll sets):
#   ./scripts/ceremony/run_ceremony.sh
#
# Usage (from files — both required):
#   ./scripts/ceremony/run_ceremony.sh --alpha rolls-alpha.txt --beta rolls-beta.txt
#
# The script creates a disposable ceremony directory, runs all phases,
# and prints the final card SHA-256. The disposable directory is your
# responsibility to physically destroy after Phase 6 distribution.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE="$REPO_ROOT/docs/operations/root-ceremony/card0-genesis.template.json"
CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

red()  { printf '\033[1;31m%s\033[0m\n' "$*" >&2; }
green(){ printf '\033[1;32m%s\033[0m\n' "$*" >&2; }
bold() { printf '\033[1m%s\033[0m\n' "$*" >&2; }

ALPHA_FILE=""
BETA_FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --alpha) ALPHA_FILE="$2"; shift 2 ;;
    --beta)  BETA_FILE="$2"; shift 2 ;;
    *) red "Unknown arg: $1"; exit 1 ;;
  esac
done

# ═══ PHASE 0: SETUP ═══
bold "═══ PHASE 0: SETUP ═══"

python3 -c "import cryptography" 2>/dev/null || {
  red "FAIL: python3 'cryptography' package not installed."
  red "Run: pip install cryptography"
  exit 1
}

CEREMONY_DIR=$(mktemp -d -t ceremony-XXXXXXXXXX)
export TMPDIR="$CEREMONY_DIR"
green "Ceremony directory: $CEREMONY_DIR"
bold "⚠  This directory must be PHYSICALLY DESTROYED after share distribution."
echo "" >&2

bold "Running selftests..."
cd "$REPO_ROOT"
python3 scripts/ceremony/shamir_2of3.py selftest 2>/dev/null
python3 scripts/ceremony/ceremony_selftest.py > /dev/null 2>&1
green "Selftests PASSED"
echo "" >&2

# ═══ PHASE 1: DICE → SEED ═══
bold "═══ PHASE 1: DICE → SEED (ROOT-α) ═══"

if [[ -n "$ALPHA_FILE" ]]; then
  ROLL_INPUT=$(cat "$ALPHA_FILE")
  green "Loaded ROOT-α rolls from $ALPHA_FILE"
else
  echo "" >&2
  bold "Enter your ROOT-α dice rolls (100+ d6 rolls, digits 1-6 only)."
  bold "Paste them all at once, then press Ctrl-D:"
  echo "" >&2
  ROLL_INPUT=$(cat)
fi

python3 "$SCRIPT_DIR/entropy_from_dice.py" "$ROLL_INPUT" --out "$CEREMONY_DIR/root-alpha.seed"
SEED_FP=$(python3 -c "import hashlib; print(hashlib.sha256(open('$CEREMONY_DIR/root-alpha.seed','rb').read()).hexdigest())")
green "ROOT-α seed fingerprint: $SEED_FP"
echo "" >&2

# ═══ PHASE 2: ROOT-α KEY DERIVATION ═══
bold "═══ PHASE 2: ROOT-α KEY DERIVATION ═══"

python3 "$SCRIPT_DIR/ed25519_from_seed.py" derive \
  --seed "$CEREMONY_DIR/root-alpha.seed" \
  --key-out "$CEREMONY_DIR/root-alpha.der"
echo "" >&2

# ═══ PHASE 3: SHAMIR 2-of-3 SPLIT ═══
bold "═══ PHASE 3: SHAMIR 2-of-3 SPLIT ═══"

mkdir -p "$CEREMONY_DIR/shares"
python3 "$SCRIPT_DIR/shamir_2of3.py" split \
  --seed "$CEREMONY_DIR/root-alpha.seed" \
  --out-dir "$CEREMONY_DIR/shares"

python3 "$SCRIPT_DIR/shamir_2of3.py" combine \
  --share "$CEREMONY_DIR/shares/share-1.json" \
  --share "$CEREMONY_DIR/shares/share-2.json" \
  --out "$CEREMONY_DIR/recon-test.seed"

RECON_FP=$(python3 -c "import hashlib; print(hashlib.sha256(open('$CEREMONY_DIR/recon-test.seed','rb').read()).hexdigest())")
if [[ "$RECON_FP" != "$SEED_FP" ]]; then
  red "FATAL: reconstruction fingerprint mismatch!"
  red "  Expected: $SEED_FP"
  red "  Got:      $RECON_FP"
  exit 2
fi
green "Sanity reconstruction verified: $RECON_FP"

python3 "$SCRIPT_DIR/shamir_2of3.py" combine \
  --share "$CEREMONY_DIR/shares/share-1.json" \
  --share "$CEREMONY_DIR/shares/share-3.json" \
  --out "$CEREMONY_DIR/independent.seed"

python3 "$SCRIPT_DIR/shamir_2of3.py" crosscheck \
  --share "$CEREMONY_DIR/shares/share-1.json" \
  --share "$CEREMONY_DIR/shares/share-3.json" \
  --independent-secret "$CEREMONY_DIR/independent.seed" \
  --independent-tool "$SCRIPT_DIR/shamir_2of3.py" \
  --independent-tool-name "shamir_2of3.py (same-impl dry-run)" \
  --out-record "$CEREMONY_DIR/shamir-crosscheck.json"

rm -f "$CEREMONY_DIR/recon-test.seed" "$CEREMONY_DIR/independent.seed"
green "Shamir crosscheck PASS"
echo "" >&2

# ═══ PHASE 4: ROOT-β KEY ═══
bold "═══ PHASE 4: ROOT-β KEY ═══"

if [[ -n "$BETA_FILE" ]]; then
  ROLL_INPUT_B=$(cat "$BETA_FILE")
  green "Loaded ROOT-β rolls from $BETA_FILE"
else
  bold "Enter your ROOT-β dice rolls (a second, independent set of 100+ d6 rolls):"
  echo "" >&2
  ROLL_INPUT_B=$(cat)
fi

python3 "$SCRIPT_DIR/entropy_from_dice.py" "$ROLL_INPUT_B" --out "$CEREMONY_DIR/root-beta.seed"

python3 "$SCRIPT_DIR/ed25519_from_seed.py" derive \
  --seed "$CEREMONY_DIR/root-beta.seed" \
  --key-out "$CEREMONY_DIR/root-beta.der"

BETA_PUB=$(python3 -c "
from cryptography.hazmat.primitives.serialization import load_der_private_key, Encoding, PublicFormat
key = load_der_private_key(open('$CEREMONY_DIR/root-beta.der','rb').read(), password=None)
print(key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw).hex())
")
green "ROOT-β pubkey: $BETA_PUB"
echo "" >&2

# ═══ PHASE 5: CARD #0 FINALIZE + VERIFY ═══
bold "═══ PHASE 5: CARD #0 FINALIZE ═══"

python3 "$SCRIPT_DIR/genesis_card.py" finalize \
  --template "$TEMPLATE" \
  --root-alpha-key "$CEREMONY_DIR/root-alpha.der" \
  --root-beta-pubkey "$BETA_PUB" \
  --created-at "$CREATED_AT" \
  --shamir-crosscheck-record "$CEREMONY_DIR/shamir-crosscheck.json" \
  --out "$CEREMONY_DIR/card0-genesis.json"

bold "Verifying from public key alone..."
python3 "$SCRIPT_DIR/genesis_card.py" verify \
  --card "$CEREMONY_DIR/card0-genesis.json"

CARD_SHA=$(python3 -c "import hashlib; print(hashlib.sha256(open('$CEREMONY_DIR/card0-genesis.json','rb').read()).hexdigest())")
ALPHA_PUB=$(python3 -c "
from cryptography.hazmat.primitives.serialization import load_der_private_key, Encoding, PublicFormat
key = load_der_private_key(open('$CEREMONY_DIR/root-alpha.der','rb').read(), password=None)
print(key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw).hex())
")

echo "" >&2
green "═══ CEREMONY COMPLETE ═══"
bold "Card file:         $CEREMONY_DIR/card0-genesis.json"
bold "Card SHA-256:      $CARD_SHA"
bold "Seed fingerprint:  $SEED_FP"
bold "ROOT-α pubkey:     $ALPHA_PUB"
bold "ROOT-β pubkey:     $BETA_PUB"
echo "" >&2
bold "Share files (distribute to THREE separate holders/USB sticks):"
ls -la "$CEREMONY_DIR/shares/" >&2
echo "" >&2
bold "═══ PHASE 6: YOU MUST NOW ═══"
bold "1. Copy share-{1,2,3}.json to THREE separate USB sticks"
bold "2. Copy card0-genesis.json + shamir-crosscheck.json to handoff medium"
bold "3. PHYSICALLY DESTROY:  $CEREMONY_DIR"
bold "4. Hand card0-genesis.json back to the machine for G4.2/G4.3/G4.6"
echo "" >&2
red "⚠  Do NOT leave $CEREMONY_DIR on disk after distribution."

# Output machine-readable summary to stdout
cat <<EOF
{
  "ceremony_dir": "$CEREMONY_DIR",
  "card_file": "$CEREMONY_DIR/card0-genesis.json",
  "card_sha256": "$CARD_SHA",
  "seed_fingerprint": "$SEED_FP",
  "root_alpha_pubkey": "$ALPHA_PUB",
  "root_beta_pubkey": "$BETA_PUB",
  "created_at": "$CREATED_AT",
  "shares": ["$CEREMONY_DIR/shares/share-1.json", "$CEREMONY_DIR/shares/share-2.json", "$CEREMONY_DIR/shares/share-3.json"]
}
EOF
