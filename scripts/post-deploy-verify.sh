#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
#
# post-deploy-verify.sh — measure what the APEX serves after a deploy.
#
# Every line here is a measurement; nothing assumes the deploy worked. It reads only public
# URLs plus canon.json (the ruled invariants) and dist/client/index.html (the bundle we
# built), and it changes nothing. deploy-site.sh --direct runs it last and exits 6 when it
# fails; it is equally the thing to run by hand after --via-actions.
#
#   bash scripts/post-deploy-verify.sh                       # apex, dist/client
#   bash scripts/post-deploy-verify.sh --host https://... --dist dist/client
#   bash scripts/post-deploy-verify.sh --no-dist             # skip the bundle == dist check
#                                                            # (say so explicitly; it is never skipped silently)
#
# Checks (each can FAIL, and the exit code says so):
#   1. GET /api/gspc totals vs canon.json api.{axes_total,measured_axes,unmeasured_axes,public_count_contains}
#      + the UNMEASURED rows on the board must number exactly totals.unmeasured_axes
#   2. GET /api/state board.axis_slots.value / board.measured_axes.value == /api/gspc totals
#   3. GET /badge/axes.json message == "<measured> of <axes>" (the badge derives it that way)
#   4. node scripts/drift-guard.mjs --host HOST (canon vs live, the guard that catches a clobber)
#   5. the /assets/index.*.js the apex homepage references == the one in dist/client/index.html
#
# NOT done here, on purpose: regenerating public/llms*.txt. That reads the LIVE board, so it
# is only valid after this script passes, and it is its own committed step. A reminder is
# printed instead.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

HOST="https://councilof.ai"
DIST="dist/client"
NO_DIST=""
while [ $# -gt 0 ]; do
  case "$1" in
    --host) HOST="${2:?--host needs a value}"; shift 2 ;;
    --dist) DIST="${2:?--dist needs a value}"; shift 2 ;;
    --no-dist) NO_DIST=1; shift ;;
    -h|--help) sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "FATAL: unknown argument '$1'" >&2; exit 2 ;;
  esac
done
HOST="${HOST%/}"
UA="csoai-research/1.0 (+https://councilof.ai)"

command -v curl >/dev/null 2>&1 || { echo "FATAL: curl not found" >&2; exit 2; }
command -v node >/dev/null 2>&1 || { echo "FATAL: node not found" >&2; exit 2; }
[ -f canon.json ] || { echo "FATAL: canon.json missing at repo root" >&2; exit 2; }

say()  { printf '\n\033[1m== %s\033[0m\n' "$*"; }
ok()   { printf '   \033[32mok\033[0m   %s\n' "$*"; }
bad()  { printf '   \033[31mFAIL\033[0m %s\n' "$*"; FAILS=$((FAILS + 1)); }
FAILS=0

get() { curl -sS --max-time 25 -L -A "$UA" -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' "$HOST$1?verify=$(date +%s%N)"; }
# jq-less JSON read: prints EXPR evaluated with `d` = parsed stdin. Empty on parse failure.
jnode() { node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{let d;try{d=JSON.parse(s)}catch{process.exit(0)}try{const v=(()=>{return eval(process.argv[1])})();process.stdout.write(v===undefined||v===null?"":String(v))}catch{}})' "$1"; }

echo "POST-DEPLOY VERIFY — $HOST vs canon.json"

# canon (the guard's EXPECTED values, read from the one file allowed to hold them)
C_AXES="$(jnode 'd.api.axes_total' < canon.json)"
C_MEAS="$(jnode 'd.api.measured_axes' < canon.json)"
C_UNM="$(jnode 'd.api.unmeasured_axes' < canon.json)"
C_PC="$(jnode 'd.api.public_count_contains' < canon.json)"
echo "   canon.json api: axes_total=$C_AXES measured_axes=$C_MEAS unmeasured_axes=$C_UNM public_count_contains=\"$C_PC\""

# ── 1. live board vs canon ───────────────────────────────────────────────────
say "1. GET /api/gspc totals vs canon"
GSPC="$(get /api/gspc || true)"
L_AXES="$(printf '%s' "$GSPC" | jnode 'd.totals.axes')"
L_MEAS="$(printf '%s' "$GSPC" | jnode 'd.totals.measured_axes')"
L_UNM="$(printf '%s' "$GSPC" | jnode 'd.totals.unmeasured_axes')"
L_PC="$(printf '%s' "$GSPC" | jnode 'd.totals.public_count')"
L_UNM_ROWS="$(printf '%s' "$GSPC" | jnode 'd.axes.filter(a=>a.status==="UNMEASURED").map(a=>a.axis+"("+a.kind+",n="+a.n+")").join(" ")')"
L_UNM_N="$(printf '%s' "$GSPC" | jnode 'd.axes.filter(a=>a.status==="UNMEASURED").length')"
if [ -z "$L_AXES" ]; then
  bad "/api/gspc did not return JSON with totals.axes (HTML clobbered the Function?)"
else
  echo "   live: axes=$L_AXES measured_axes=$L_MEAS unmeasured_axes=$L_UNM public_count=\"$L_PC\""
  echo "   live UNMEASURED rows: ${L_UNM_ROWS:-none}"
  [ "$L_AXES" = "$C_AXES" ]       && ok "totals.axes $L_AXES"            || bad "totals.axes $L_AXES ≠ canon $C_AXES"
  [ "$L_MEAS" = "$C_MEAS" ]       && ok "totals.measured_axes $L_MEAS"   || bad "totals.measured_axes $L_MEAS ≠ canon $C_MEAS"
  [ "$L_UNM" = "$C_UNM" ]         && ok "totals.unmeasured_axes $L_UNM"  || bad "totals.unmeasured_axes $L_UNM ≠ canon $C_UNM"
  case "$L_PC" in *"$C_PC"*)         ok "public_count carries \"$C_PC\"" ;; *) bad "public_count \"$L_PC\" lost \"$C_PC\"" ;; esac
  [ "$L_UNM_N" = "$L_UNM" ]       && ok "$L_UNM_N UNMEASURED row(s) on the board == totals.unmeasured_axes" \
                                  || bad "board has $L_UNM_N UNMEASURED row(s) but totals.unmeasured_axes says $L_UNM"
fi

# ── 2. /api/state agrees with /api/gspc ──────────────────────────────────────
say "2. GET /api/state board.* agrees with /api/gspc (no cross-endpoint drift)"
STATE="$(get /api/state || true)"
S_SLOTS="$(printf '%s' "$STATE" | jnode 'd.board.axis_slots.value')"
S_MEAS="$(printf '%s' "$STATE" | jnode 'd.board.measured_axes.value')"
if [ -z "$S_SLOTS" ]; then
  bad "/api/state did not return JSON with board.axis_slots.value"
else
  echo "   /api/state board.axis_slots=$S_SLOTS measured_axes=$S_MEAS"
  [ "$S_SLOTS" = "$L_AXES" ] && ok "board.axis_slots $S_SLOTS == gspc totals.axes"        || bad "board.axis_slots $S_SLOTS ≠ gspc totals.axes $L_AXES"
  [ "$S_MEAS" = "$L_MEAS" ]  && ok "board.measured_axes $S_MEAS == gspc totals.measured_axes" || bad "board.measured_axes $S_MEAS ≠ gspc totals.measured_axes $L_MEAS"
fi

# ── 3. badge ─────────────────────────────────────────────────────────────────
say "3. GET /badge/axes.json message"
BADGE="$(get /badge/axes.json || true)"
B_MSG="$(printf '%s' "$BADGE" | jnode 'd.message')"
B_COL="$(printf '%s' "$BADGE" | jnode 'd.color')"
if [ -z "$B_MSG" ]; then
  bad "/badge/axes.json did not return JSON with message"
else
  echo "   badge: \"$B_MSG\" | $B_COL"
  WANT_MSG="$L_MEAS of $L_AXES"
  [ "$B_MSG" = "$WANT_MSG" ] && ok "message \"$B_MSG\"" || bad "message \"$B_MSG\" ≠ \"$WANT_MSG\" (functions/badge/axes.json.ts derives \`\${measured} of \${total}\`)"
  if [ "$L_MEAS" = "$L_AXES" ]; then WANT_COL=brightgreen; else WANT_COL=orange; fi
  [ "$B_COL" = "$WANT_COL" ] && ok "color $B_COL" || bad "color $B_COL ≠ $WANT_COL (brightgreen iff measured == total)"
fi

# ── 4. drift-guard ───────────────────────────────────────────────────────────
say "4. drift-guard (canon vs live)"
if node scripts/drift-guard.mjs --host "$HOST" >/tmp/post-deploy-verify.drift.log 2>&1; then
  ok "drift-guard green"
  grep -E '✓|✗' /tmp/post-deploy-verify.drift.log | sed 's/^/     /' | head -12
else
  bad "drift-guard RED"
  sed 's/^/     /' /tmp/post-deploy-verify.drift.log | tail -20
fi

# ── 5. apex bundle == dist bundle ────────────────────────────────────────────
say "5. apex homepage bundle == $DIST/index.html bundle"
APEX_B="$(get / | grep -oE '/assets/index\.[A-Za-z0-9._-]+\.js' | sort -u | tr '\n' ' ')"
echo "   apex: ${APEX_B:-<none>}"
if [ -n "$NO_DIST" ]; then
  echo "   --no-dist: bundle comparison SKIPPED at the caller's request (not verified)"
elif [ ! -f "$DIST/index.html" ]; then
  bad "$DIST/index.html missing — cannot compare (pass --no-dist to skip on purpose)"
else
  DIST_B="$(grep -oE '/assets/index\.[A-Za-z0-9._-]+\.js' "$DIST/index.html" | sort -u | tr '\n' ' ')"
  echo "   dist: ${DIST_B:-<none>}"
  if [ -n "$APEX_B" ] && [ "$APEX_B" = "$DIST_B" ]; then ok "apex serves the bundle in $DIST"; else bad "apex bundle ≠ dist bundle"; fi
fi

# ── reminder, not a step ─────────────────────────────────────────────────────
say "Not done here: llms.txt"
echo "   public/llms.txt + llms-full.txt are DERIVED FROM LIVE. Only after this script passes:"
echo "     node scripts/llms-txt.mjs && node scripts/llms-txt.mjs --check"
echo "   then commit the two files on a branch. This script never regenerates them."

echo ""
if [ "$FAILS" -ne 0 ]; then
  echo "POST-DEPLOY VERIFY: FAIL — $FAILS check(s) failed against $HOST. Do not report this deploy as done."
  exit 1
fi
echo "POST-DEPLOY VERIFY: PASS — $HOST agrees with canon.json and with itself."
exit 0
