#!/usr/bin/env bash
# Production-grade SIGIL_SEED setup for os.meok.ai signing backend.
# Idempotent - safe to re-run. Reads existing key OR generates one.

set -euo pipefail

Sovereign_dir="$HOME/.sovereign/keys"

if [ ! -f "$Sovereign_dir/ed25519.key" ]; then
  echo "No existing key at $Sovereign_dir/ed25519.key — generating fresh."
  mkdir -p "$Sovereign_dir"
  /usr/bin/python3 -c "import os; open(os.path.expanduser('~/.sovereign/keys/ed25519.key'),'wb').write(os.urandom(32))"
  chmod 600 "$Sovereign_dir/ed25519.key"
fi

Sigil_seed=$(shasum -a 256 "$Sovereign_dir/ed25519.key" | awk '{print $1}')
echo
echo "Sovereign seed (SHA-256): $Sigil_seed"
echo
echo "Public key fingerprint (first 16 hex): ${Sigil_seed:0:16}..."

if command -v vercel >/dev/null 2>&1; then
  vercel env rm SIGIL_SEED production 2>/dev/null || true
  echo "$Sigil_seed" | vercel env add SIGIL_SEED production >/dev/null
  echo "SIGIL_SEED set on Vercel production."
else
  echo "vercel CLI not installed - manually set SIGIL_SEED in your dashboard."
  echo "Value: $Sigil_seed"
fi
