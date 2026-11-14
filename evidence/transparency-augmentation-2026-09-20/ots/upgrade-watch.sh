#!/bin/bash
# upgrade-watch.sh — experiment-local OTS upgrade watcher (NO git, NO public/ writes).
# Retries ots-upgrade.py on the fixture proof every 15 min for up to 6h. Stops on
# the first Bitcoin attestation, then records a transition transcript and a
# machine-readable result JSON. Exit 0 = confirmed; exit 1 = still pending at cutoff.
set -uo pipefail
B="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$B/../.." && pwd)"
PROOF="$B/ots/card-00a52180-measurement-card.json.ots"
FIXTURE="$B/fixtures/card-00a52180-measurement-card.json"
PY="$B/.venv/bin/python"
OTS="$B/.venv/bin/ots"
TS() { date -u +%Y-%m-%dT%H:%M:%SZ; }

echo "$(TS) watcher start; proof=$PROOF"
for i in $(seq 1 24); do
  echo "$(TS) attempt $i/24"
  "$PY" "$REPO/scripts/ots-upgrade.py" "$PROOF"
  if "$OTS" info "$PROOF" | grep -q BitcoinBlockHeaderAttestation; then
    echo "$(TS) UPGRADED — Bitcoin attestation present"
    {
      echo '# OTS UPGRADE SUCCESS — pending -> confirmed transition transcript'
      date -u +confirmed_at=%Y-%m-%dT%H:%M:%SZ
      echo '$ ots info (attestations)'; "$OTS" info "$PROOF" | grep -E 'verify|File sha256'
      HEIGHT=$("$OTS" info "$PROOF" | grep -oE 'BitcoinBlockHeaderAttestation\(([0-9]+)\)' | head -1 | grep -oE '[0-9]+')
      echo "block height: $HEIGHT"
      HASH=$(curl -s "https://blockstream.info/api/block-height/$HEIGHT")
      H1=$(curl -s "https://blockstream.info/api/block/$HASH/header")
      H2=$(curl -s "https://mempool.space/api/block/$HASH/header")
      echo "block hash        : $HASH"
      echo "header blockstream: $H1"
      echo "header mempool    : $H2"
      [ -n "$H1" ] && [ "$H1" = "$H2" ] && echo "two-source header agreement: BYTE_IDENTICAL" || echo "two-source header agreement: MISMATCH_OR_UNREACHABLE"
      echo '$ ots verify (needs local Bitcoin node; expected to fail without one — F3)'
      "$OTS" verify -f "$FIXTURE" "$PROOF"; echo "exit=$?"
    } 2>&1 | tee "$B/ots/ots-upgrade-success.txt"
    "$PY" - "$PROOF" <<'PYEOF'
import json, sys, re, subprocess, hashlib
proof = sys.argv[1]
info = subprocess.run([proof.replace("card-00a52180-measurement-card.json.ots", "../.venv/bin/ots"), "info", proof],
                      capture_output=True, text=True).stdout
heights = sorted(set(int(h) for h in re.findall(r"BitcoinBlockHeaderAttestation\((\d+)\)", info)))
state = "CONFIRMED_BITCOIN" if heights else "PENDING_CALENDAR_COMMITMENT"
out = {"state": state, "bitcoin_blocks": heights,
       "proof_sha256": hashlib.sha256(open(proof, "rb").read()).hexdigest(),
       "note": "Derived from proof bytes. Bitcoin timestamp = these exact digest bytes existed no later than the named block(s). Not correctness, not completeness, not certification."}
json.dump(out, open(proof + ".result.json", "w"), indent=1)
print("wrote", proof + ".result.json", "->", state, heights)
PYEOF
    exit 0
  fi
  [ "$i" -lt 24 ] && sleep 900
done
echo "$(TS) cutoff reached; proof still PENDING_CALENDAR_COMMITMENT (calendars have not committed yet)"
exit 1
