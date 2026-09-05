#!/bin/bash
# ots-upgrade-loop.sh — turn STAMPED proofs into ANCHORED ones, automatically.
#
# A stamp is a request; Bitcoin commits on its own schedule, usually within hours. The
# proof only becomes evidence once a calendar's commitment lands in a block AND the local
# .ots is UPGRADED to carry that attestation. Nothing does that upgrade on its own, so
# proofs sit pending indefinitely and the estate reads as "anchored" when it is not — the
# exact gap that let "N atoms OTS-anchored" be written while nothing was anchored.
#
# Also: scripts/ots-upgrade.py defaults to ONE hardcoded path. Run bare, it upgrades a
# single file and exits 0, which looks like success. This walks every proof in public/.
#
# SAFETY. Upgrading is strictly additive — it adds a BitcoinBlockHeaderAttestation and
# removes nothing. But we re-check COVERAGE after every upgrade and refuse to commit if a
# proof no longer covers its file, because an anchored proof over the wrong bytes is worse
# than a pending one: it reads as settled.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
cd "$HOME/clawd/councilof-ai" || exit 1
LOG="$HOME/clawd/_evacuation/logs/ots-upgrade-loop.log"
mkdir -p "$(dirname "$LOG")"
TS() { date -u +%Y-%m-%dT%H:%M:%SZ; }

BEFORE=$(python3 scripts/ots-coverage-audit.py --served 2>/dev/null | grep -c "COVERS" || echo 0)
mapfile -t PROOFS < <(find public -name "*.ots" 2>/dev/null)
[ ${#PROOFS[@]} -eq 0 ] && { echo "$(TS) no proofs in public/" >> "$LOG"; exit 0; }

python3 scripts/ots-upgrade.py "${PROOFS[@]}" > /tmp/ots-upgrade.out 2>&1
UPGRADED=$(grep -ci "upgraded\|bitcoin" /tmp/ots-upgrade.out 2>/dev/null || echo 0)

# Coverage must still hold. Exit 1 from the audit means a proof disagrees with its file.
if ! python3 scripts/ots-coverage-audit.py --served > /tmp/ots-cov.out 2>&1; then
  echo "$(TS) REFUSING TO COMMIT — coverage audit failed after upgrade:" >> "$LOG"
  sed 's/^/    /' /tmp/ots-cov.out >> "$LOG"
  exit 1
fi

if ! git diff --quiet -- public 2>/dev/null; then
  git add public/**/*.ots public/*.ots 2>/dev/null
  git commit -q -m "ots: upgrade pending stamps to Bitcoin attestations

Automated by scripts/ots-upgrade-loop.sh. Upgrading is additive — it attaches the
BitcoinBlockHeaderAttestation a calendar has now committed, and removes nothing.
Coverage re-audited after the upgrade and still holds; the commit is refused otherwise.

$(grep -iE 'bitcoin|upgraded' /tmp/ots-upgrade.out | head -6)" 2>/dev/null
  git push -q origin master 2>/dev/null && echo "$(TS) pushed upgrades" >> "$LOG"
fi

AFTER=$(grep -oE "[0-9]+  COVERS" /tmp/ots-cov.out | head -1 | awk '{print $1}')
echo "$(TS) walked ${#PROOFS[@]} proofs; covers=${AFTER:-?}; upgrade output lines=$UPGRADED" >> "$LOG"
tail -300 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
