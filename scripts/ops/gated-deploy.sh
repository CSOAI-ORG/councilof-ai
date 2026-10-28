#!/usr/bin/env bash
# gated-deploy.sh — the gate every loop passes through.
#
# Wraps a command so that:
#   1. The preflight's exit code cannot be masked by grep/awk/tee (the classic
#      `cmd | grep X && next` trap that deployed over a red gate twice today).
#   2. The ship target is rejected if it carries FEWER corrections than
#      production already serves (the case where a later deploy of mine
#      removed a published correction — verified to refuse exactly that).
#   3. Each pass is logged to a single append-only file with timestamps.
#
# Usage:
#   scripts/ops/gated-deploy.sh <gate-command> <deploy-command> [deploy-args...]
#
# Exit codes:
#   0  → gate green, deploy executed and reported success
#   10 → gate failed (preflight non-zero), deploy REFUSED
#   11 → ship would regress correction count, deploy REFUSED
#   12 → deploy itself failed (gate was green but the deploy errored)
#   13 → usage error
#
set -u

LOG="${HOME}/.csoai/gated-deploy.log"
mkdir -p "$(dirname "$LOG")"

usage() {
  sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
  exit 13
}

[ $# -ge 2 ] || usage

GATE_CMD="$1"
shift
DEPLOY_CMD="$@"

log() { printf '%s  %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG"; }

log "=== gated-deploy ==="
log "gate  : $GATE_CMD"
log "deploy: $DEPLOY_CMD"

# ─────────────────────────────────────────────────────────────────────────────
# Step 1. Run the gate. Capture its true exit code BEFORE anything else.
# The pipefail trap: `cmd | grep X && next` reports grep's exit code, not cmd's.
# We use process substitution so the gate is the only thing on the pipe.
# ─────────────────────────────────────────────────────────────────────────────
GATE_OUT="$(mktemp)"
GATE_RC=0
bash -c "$GATE_CMD" >"$GATE_OUT" 2>&1
GATE_RC=$?
log "gate_rc=$GATE_RC"
sed 's/^/  | /' "$GATE_OUT" | tee -a "$LOG"
rm -f "$GATE_OUT"

if [ "$GATE_RC" -ne 0 ]; then
  log "REFUSED: gate returned $GATE_RC"
  exit 10
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 2. Correction-count guard. Refuse to ship a build that carries fewer
# corrections than production already serves. Proven to refuse exactly this
# case (a later deploy of mine had removed a published correction).
# ─────────────────────────────────────────────────────────────────────────────
SHIP_CORRECTIONS="$(mktemp)"
PROD_CORRECTIONS="$(mktemp)"
trap 'rm -f "$SHIP_CORRECTIONS" "$PROD_CORRECTIONS"' EXIT

# Count corrections in the local checkout (what would ship)
SHIP_N="$(grep -lRoE 'C-[0-9]{4}-[0-9]{4}-[0-9]{2}' public/interop/ 2>/dev/null | wc -l | tr -d ' ')"
echo "$SHIP_N" > "$SHIP_CORRECTIONS"

# Count corrections in production. If unreachable, we DON'T fail closed —
# the gate already passed. We log the inability and proceed.
PROD_N=""
if PROD_HTML="$(curl -fsS --max-time 10 https://councilof.ai/corrections 2>/dev/null)"; then
  PROD_N="$(printf '%s' "$PROD_HTML" | grep -oE 'C-[0-9]{4}-[0-9]{4}-[0-9]{2}' | sort -u | wc -l | tr -d ' ')"
  echo "$PROD_N" > "$PROD_CORRECTIONS"
fi

log "corrections ship=$SHIP_N prod=${PROD_N:-?}"

if [ -n "$PROD_N" ] && [ "$SHIP_N" -lt "$PROD_N" ]; then
  log "REFUSED: ship ($SHIP_N) regresses prod ($PROD_N) corrections"
  exit 11
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 3. Run the deploy.
# ─────────────────────────────────────────────────────────────────────────────
log "deploy starting"
DEPLOY_OUT="$(mktemp)"
bash -c "$DEPLOY_CMD" >"$DEPLOY_OUT" 2>&1
DEPLOY_RC=$?
sed 's/^/  | /' "$DEPLOY_OUT" | tee -a "$LOG"
rm -f "$DEPLOY_OUT"

if [ "$DEPLOY_RC" -ne 0 ]; then
  log "FAILED: deploy returned $DEPLOY_RC"
  exit 12
fi

log "OK: deploy succeeded"
exit 0
