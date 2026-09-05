#!/usr/bin/env bash
# Create a THROWAWAY payer wallet for one x402 test payment.
#
# The private key is written to .payer.key (chmod 600) and NEVER printed, so it does not
# land in a terminal transcript, a chat log, or your shell history. Only the address is
# shown — that is the thing you send $1 of USDC to.
#
# This wallet is disposable and should hold a dollar, never more. Do not reuse a wallet
# whose key has ever been pasted anywhere.
set -euo pipefail
cd "$(dirname "$0")/../.."
python3 - <<'PY'
from eth_account import Account
import pathlib, os
a = Account.create()
p = pathlib.Path(".payer.key")
p.write_text(a.key.hex())
os.chmod(p, 0o600)
print("")
print("  SEND $1 OF USDC ON BASE TO THIS ADDRESS:")
print(f"    {a.address}")
print("")
print("  key written to .payer.key (chmod 600, never printed)")
print("  then:  export X402_PAYER_KEY=$(cat .payer.key)")
PY
