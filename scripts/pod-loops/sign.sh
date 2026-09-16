#!/bin/bash
# sign.sh — pod chain slot :25 hourly. Inbox → signed cards, with the pod-resident key.
#
#   inputs   <repo>/public/interop/mill-cards-unsigned/unsigned-*.json
#   key      $BOARD_SIGN_KEY_PKCS8_B64 if already in the environment, else the file
#            $CHAIN_SIGN_KEY_FILE (default $LANES/.secrets/board-sign-key.pkcs8.b64, owner-placed,
#            0600). The value is read into the environment of the python child ONLY — never an
#            argument (ps-visible), never echoed, never logged. No key → logged as NO_KEY, exit 0.
#   step     scripts/sign_mill_cards.py --key-env BOARD_SIGN_KEY_PKCS8_B64
#            (n>=30 → MEASURED, n<30 → UNMEASURED "n<30 unquotable"; content-addressed; supersedes,
#            never overwrites; DID recorded = did:web:csoai.org#board-attestation-1 unless CHAIN_DID)
#   outputs  <repo>/public/interop/mill-cards-signed/signed-*.json (+ SUPERSEDED.jsonl rows)
#   proof    python3 harness/gspc-top100/verify_card.py against the live did.json — root-check's job
#   log      $LOGS/chain.log  one line: <utc> sign <unsigned_seen> <new_signed> <sha256 of new files> <cmd>
#
# Never certifies. Never commits. DRY_RUN=1 prints and writes nothing (and never reads the key).
set -euo pipefail
. "$(dirname "$0")/lib.sh"
chain_slot sign "${1:-}" || exit 0
R=$(chain_repo)
INBOX=$R/public/interop/mill-cards-unsigned
SIGNED=$R/public/interop/mill-cards-signed
KEYFILE=${CHAIN_SIGN_KEY_FILE:-$LANES/.secrets/board-sign-key.pkcs8.b64}
DID=${CHAIN_DID:-did:web:csoai.org#board-attestation-1}
EVIDENCE=$R/public/interop/mill-evidence
# --require-hub-admission: a hub-mill card in the same inbox is signed only with a current
# admission receipt (as on the GHA road); pod cards carry compute_evidence and are exempt.
SIGN_ARGS=(--source-dir "$INBOX" --dest-dir "$SIGNED" --evidence-dir "$EVIDENCE" --require-hub-admission
           --key-env BOARD_SIGN_KEY_PKCS8_B64 --did "$DID")
CMD="sign_mill_cards.py --require-hub-admission --key-env BOARD_SIGN_KEY_PKCS8_B64 --did $DID"

seen=$(ls "$INBOX"/unsigned-*.json 2>/dev/null | wc -l | tr -d ' ')
if chain_dry; then
  src="env"; [ -n "${BOARD_SIGN_KEY_PKCS8_B64:-}" ] || { [ -s "$KEYFILE" ] && src="file $KEYFILE" || src="ABSENT"; }
  chain_log "sign[dry]" "$seen" 0 - "$CMD (inbox=$INBOX key=$src)"
  exit 0
fi

have_key=0
if [ -n "${BOARD_SIGN_KEY_PKCS8_B64:-}" ]; then
  have_key=1
elif [ -s "$KEYFILE" ]; then
  mode=$(stat -c %a "$KEYFILE" 2>/dev/null || stat -f %Lp "$KEYFILE" 2>/dev/null || echo '?')
  [ "$mode" = "600" ] || log sign "WARN key file mode is $mode, expected 600: $KEYFILE"
  have_key=2
fi
if [ "$have_key" = 0 ]; then
  chain_log sign "$seen" 0 - "$CMD NO_KEY (place $KEYFILE, 0600)"
  exit 0
fi
if [ "$seen" = 0 ]; then
  chain_log sign 0 0 - "$CMD (inbox empty)"
  exit 0
fi

before=$(mktemp); after=$(mktemp)
python3 "$CHAIN_TOOLS" manifest "$SIGNED" --glob 'signed-*.json' > "$before" || true
set +e
if [ "$have_key" = 2 ]; then
  BOARD_SIGN_KEY_PKCS8_B64="$(tr -d '[:space:]' < "$KEYFILE")" \
    python3 "$R/scripts/sign_mill_cards.py" "${SIGN_ARGS[@]}" > "$STATE/chain-sign.out" 2>&1
else
  python3 "$R/scripts/sign_mill_cards.py" "${SIGN_ARGS[@]}" > "$STATE/chain-sign.out" 2>&1
fi
rc=$?
set -e
while read -r l; do log sign "$l"; done < "$STATE/chain-sign.out"
python3 "$CHAIN_TOOLS" manifest "$SIGNED" --glob 'signed-*.json' > "$after" || true
read -r new sha < <(python3 "$CHAIN_TOOLS" new "$before" "$after" | head -1)
rm -f "$before" "$after"
chain_log sign "$seen" "$new" "$sha" "$CMD (rc=$rc)"
exit "$rc"
