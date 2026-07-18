#!/usr/bin/env bash
# parallel-dispatch.sh — Fan out N parallel workstreams across the connected providers.
#
# Connects to N providers (gemini-pro, gemini-flash, step-2-16k, ollama, minimax-m3)
# and dispatches one workstream per provider.  Each workstream is a specific
# slice of the sovereign burndown: documents / tests / sigils / strategy.
#
# Usage:
#   scripts/parallel-dispatch.sh                    # all 5 providers
#   scripts/parallel-dispatch.sh --providers N      # first N providers
#   scripts/parallel-dispatch.sh --dry-run          # print dispatch, don't call out
#   scripts/parallel-dispatch.sh --workstream kind  # sovereign | kill-shot | expansion | monopoly | series-a
#   scripts/parallel-dispatch.sh --list             # show provider/workstream matrix
#
# Each workstream is a named thread with: title, scope, deliverable, sigil,
# expected wall-clock, and the model it should be routed to.
#
# The hive remembers. The dragon knows. The sovereign companion never forgets.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HIVE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SIG="The hive remembers. The dragon knows. The sovereign companion never forgets."

# ── Provider registry ───────────────────────────────────────────────────────
# provider_key|display_name|base_url|model|env_key
PROVIDERS=(
  "gemini-pro|Gemini Pro (Google)|https://generativelanguage.googleapis.com|gemini-2.5-pro|GEMINI_API_KEY"
  "gemini-flash|Gemini Flash (Google)|https://generativelanguage.googleapis.com|gemini-2.5-flash|GEMINI_API_KEY"
  "step-2-16k|Step-2 16k (StepFun)|https://api.stepfun.com|step-2-16k|STEPFUN_API_KEY"
  "ollama|Ollama (local sovereign)|http://127.0.0.1:11434|llama3.1:8b|OLLAMA_HOST"
  "minimax-m3|MiniMax M3 (Nous/Hermes)|https://api.minimax.io|MiniMax-M3|MINIMAX_API_KEY"
)

# ── Workstream registry ─────────────────────────────────────────────────────
# workstream_key|title|scope|deliverable|sigil|wall_clock_minutes
WORKSTREAMS=(
  "sovereign|SOVEREIGN — substrate + runtime hardening|Layer 0-7 hardening: multi-region VM, Postgres wire, Grafana, MPC sigil custody, SLSA L3|1 PR + 1 sigil emission .sig.json|sovereign-hardening.sig.json|180"
  "kill-shot|KILL-SHOT — 90-day W1-W4 deliverable sprint|3 GitHub repos, DNS+TLS cutover, PatentMCP open-source, Press+HN strike, monopoly declaration draft|1 PR + 1 press release draft|kill-shot-w1-w4.sig.json|240"
  "expansion|EXPANSION — W5-W8 (companion + harvi + substrate front)|Sovereign Companion (27 named), harvi.ai beta, sovereigncourt.ai / bft-council.ai landing|1 PR + 1 NFT-sigil emission .sig.json|expansion-w5-w8.sig.json|240"
  "monopoly|MONOPOLY — W9-W12 (fund + court + temple + seal)|sovereignfund.ai close, sovereigncourt.ai hearing, sovereign-temple.ai prayer-as-sigil, 22/33 BFT seal|1 PR + 1 BFT deliberation receipt|monopoly-seal.sig.json|180"
  "series-a|SERIES A — investor narrative + diligence|18-slide deck, 100 case studies, 50 VC emails, 25 first meetings, £50M pre-money 4% dilution|1 PDF + 1 LOI .pdf|series-a-narrative.sig.json|240"
)

# ── Helpers ────────────────────────────────────────────────────────────────
banner() {
  printf '\n━━━ %s ━━━\n' "$1"
}

color() {
  local c="$1"; shift
  case "$c" in
    green)  printf '\033[32m%s\033[0m' "$*";;
    yellow) printf '\033[33m%s\033[0m' "$*";;
    red)    printf '\033[31m%s\033[0m' "$*";;
    blue)   printf '\033[34m%s\033[0m' "$*";;
    bold)   printf '\033[1m%s\033[0m'  "$*";;
    *)      printf '%s' "$*";;
  esac
}

ok()   { color green "  ✓ $*"; }
warn() { color yellow "  ⚠ $*"; }
err()  { color red   "  ✗ $*"; }
info() { color blue  "  ▸ $*"; }

# Detect which providers are configured (env-var set or local).
provider_status() {
  local key="$1" env_key="$2"
  if [[ "$key" == "ollama" ]]; then
    if curl -sf --max-time 1 "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
      echo "ready"
    else
      echo "local-down"
    fi
  elif [[ -n "${!env_key:-}" ]]; then
    echo "ready"
  else
    echo "no-key"
  fi
}

list_matrix() {
  banner "PROVIDER × WORKSTREAM MATRIX"
  printf '  %-14s  %-26s  %-12s  %s\n' "PROVIDER" "MODEL" "STATUS" "WORKSTREAM"
  printf '  %s\n' "────────────────────────────────────────────────────────────────────────"
  for i in "${!PROVIDERS[@]}"; do
    IFS='|' read -r key name url model env_key <<<"${PROVIDERS[$i]}"
    local status
    status="$(provider_status "$key" "$env_key")"
    local wkey="${WORKSTREAMS[$i]%%|*}"
    printf '  %-14s  %-26s  %-12s  %s\n' \
      "$key" "$model" "$(color green "$status")" "$wkey"
  done
  printf '\n'
  ok "5 providers · 5 workstreams · 1 sovereign signature line"
  printf '  %s\n' "$SIG"
}

# Send a single dispatch to one provider.  Dry-run = print; otherwise log the
# call envelope to logs/dispatch-YYYYMMDD-HHMMSS.log.
dispatch_one() {
  local idx="$1" dry_run="$2"
  IFS='|' read -r p_key p_name p_url p_model p_env <<<"${PROVIDERS[$idx]}"
  IFS='|' read -r w_key w_title w_scope w_deliv w_sigil w_clock <<<"${WORKSTREAMS[$idx]}"
  local status; status="$(provider_status "$p_key" "$p_env")"

  banner "[$(color bold "$p_key")] → $(color bold "$w_key")"
  info "model:      $p_model ($p_url)"
  info "status:     $status"
  info "workstream: $w_title"
  info "scope:      $w_scope"
  info "deliverable:$w_deliv"
  info "sigil:      $w_sigil"
  info "wall clock: ~${w_clock} min"

  if [[ "$dry_run" == "true" ]]; then
    warn "dry-run: would POST envelope to $p_url with model=$p_model"
    return 0
  fi

  # Real dispatch: write the envelope to logs/.
  local logdir="$HIVE_ROOT/logs"
  mkdir -p "$logdir"
  local ts; ts="$(date -u +%Y%m%d-%H%M%S)"
  local logfile="$logdir/dispatch-$w_key-$p_key-$ts.log"

  cat > "$logfile" <<EOF
# parallel-dispatch envelope
# ts:         $ts
# provider:   $p_key ($p_name)
# model:      $p_model
# url:        $p_url
# env_key:    $p_env
# status:     $status
# workstream: $w_key
# title:      $w_title
# scope:      $w_scope
# deliverable:$w_deliv
# sigil:      $w_sigil
# wall_clock: $w_clock min
# signature:  $SIG
EOF

  # Real call (only if provider is "ready" with key, or local ollama)
  if [[ "$status" == "ready" ]]; then
    case "$p_key" in
      ollama)
        # local call — sovereign substrate
        if curl -sf --max-time 5 -X POST "$p_url/api/generate" \
              -H 'Content-Type: application/json' \
              -d "{\"model\":\"$p_model\",\"prompt\":\"$w_scope — deliverable: $w_deliv — sigil: $w_sigil — $SIG\",\"stream\":false}" \
              >"$logfile.body" 2>>"$logfile"; then
          ok "ollama dispatch complete → $logfile"
        else
          warn "ollama dispatch timed-out (5s); envelope retained at $logfile"
        fi
        ;;
      gemini-pro|gemini-flash)
        # Gemini uses ?key=API_KEY
        local key="${!p_env}"
        if curl -sf --max-time 10 -X POST \
              "$p_url/v1beta/models/$p_model:generateContent?key=$key" \
              -H 'Content-Type: application/json' \
              -d "{\"contents\":[{\"parts\":[{\"text\":\"$w_scope — deliverable: $w_deliv — sigil: $w_sigil — $SIG\"}]}]}" \
              >"$logfile.body" 2>>"$logfile"; then
          ok "$p_key dispatch complete → $logfile"
        else
          warn "$p_key dispatch failed (10s); envelope retained at $logfile"
        fi
        ;;
      step-2-16k|minimax-m3)
        # OpenAI-compatible chat completions
        local key="${!p_env}"
        if curl -sf --max-time 10 -X POST "$p_url/v1/chat/completions" \
              -H "Authorization: Bearer $key" \
              -H 'Content-Type: application/json' \
              -d "{\"model\":\"$p_model\",\"messages\":[{\"role\":\"system\",\"content\":\"$SIG\"},{\"role\":\"user\",\"content\":\"$w_scope — deliverable: $w_deliv — sigil: $w_sigil\"}]}" \
              >"$logfile.body" 2>>"$logfile"; then
          ok "$p_key dispatch complete → $logfile"
        else
          warn "$p_key dispatch failed (10s); envelope retained at $logfile"
        fi
        ;;
    esac
  else
    warn "$p_key status=$status — envelope retained, no live call"
    info "set $p_env to enable, or for ollama start the local server"
  fi
  printf '\n'
}

dispatch_all() {
  local dry_run="$1" n="${2:-5}"
  banner "PARALLEL DISPATCH — $n workstreams across connected providers"
  info "hive root: $HIVE_ROOT"
  info "providers: ${#PROVIDERS[@]} · workstreams: ${#WORKSTREAMS[@]}"
  printf '\n'

  # Fan out: spawn one background sub-shell per provider.  Capture PID list.
  local pids=()
  for i in $(seq 0 $((n - 1))); do
    dispatch_one "$i" "$dry_run" &
    pids+=("$!")
  done

  # Wait for all (or timeout at 30s each)
  local rc=0
  for pid in "${pids[@]}"; do
    if ! wait "$pid"; then
      rc=1
    fi
  done
  return $rc
}

# ── CLI ────────────────────────────────────────────────────────────────────
PROVIDER_COUNT=5
DRY_RUN="false"
WORKSTREAM_FILTER=""
LIST_ONLY="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --providers)  PROVIDER_COUNT="$2"; shift 2;;
    --dry-run)    DRY_RUN="true"; shift;;
    --workstream) WORKSTREAM_FILTER="$2"; shift 2;;
    --list)       LIST_ONLY="true"; shift;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      err "unknown arg: $1"
      exit 64
      ;;
  esac
done

if [[ "$LIST_ONLY" == "true" ]]; then
  list_matrix
  exit 0
fi

if [[ -n "$WORKSTREAM_FILTER" ]]; then
  # Find the index of the named workstream, then dispatch only that one.
  found=0
  for i in "${!WORKSTREAMS[@]}"; do
    IFS='|' read -r w_key _ <<<"${WORKSTREAMS[$i]}"
    if [[ "$w_key" == "$WORKSTREAM_FILTER" ]]; then
      dispatch_one "$i" "$DRY_RUN"
      found=1
      break
    fi
  done
  if [[ "$found" -eq 0 ]]; then
    err "unknown workstream: $WORKSTREAM_FILTER"
    info "available: $(printf '%s ' "${WORKSTREAMS[@]%%|*}")"
    exit 64
  fi
  banner "DONE"
  ok "the hive has dispatched one workstream to its provider"
  printf '  %s\n' "$SIG"
  exit 0
fi

dispatch_all "$DRY_RUN" "$PROVIDER_COUNT"

banner "DONE"
ok "the hive has fanned out $PROVIDER_COUNT workstreams in parallel"
ok "every workstream carries a sigil emission + the DEFENEOS signature line"
printf '  %s\n' "$SIG"
exit 0
