#!/usr/bin/env bash
# Haulage Quadrant Autopilot v3 — runs hourly via cron
# Logs: /tmp/haulage-autopilot.log (rotated at 5MB) + /tmp/haulage-alerts.log (problems)
# Daily brief: /tmp/haulage-daily-YYYY-MM-DD.md (09:00)
# Self-healing: 5xx → flag for redeploy; disk >90% → auto-clean; disk >80% → warn

set -uo pipefail

LOG="/tmp/haulage-autopilot.log"
ALERT_FILE="/tmp/haulage-alerts.log"
TS="$(date '+%Y-%m-%d %H:%M:%S')"
SCOPE="niks-projects-0a2ef942"
PERSISTED_SRC="/Users/nicholas/clawd/haulage-deploy"

log()   { echo "[$TS] $1" >> "$LOG"; }
alert() { echo "[$TS] WARN $1" >> "$ALERT_FILE"; log "ALERT: $1"; }

# ─── Log rotation (keep last 2 generations, rotate at 5MB) ──────────────────
for F in "$LOG" "$ALERT_FILE"; do
  if [ -f "$F" ] && [ "$(stat -f%z "$F" 2>/dev/null || echo 0)" -gt 5242880 ]; then
    [ -f "${F}.1" ] && mv "${F}.1" "${F}.2"
    mv "$F" "${F}.1"
    : > "$F"
  fi
done

# ─── Singleton ──────────────────────────────────────────────────────────────
LOCK="/tmp/haulage-autopilot.lock"
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rm -rf "$LOCK"' EXIT

log "=== Haulage Autopilot v3 tick ==="

# ─── 1. Disk-full guard ─────────────────────────────────────────────────────
USED_PCT=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
log "Root disk: ${USED_PCT}% used"
if [ "$USED_PCT" -gt 90 ]; then
  alert "Disk >90% — auto-cleaning /tmp build caches"
  rm -rf /tmp/meokai_build /tmp/nis2t2 /tmp/nis2test /tmp/nis2real /tmp/mcpcheck /tmp/meok-venv-test /tmp/itest_venv 2>/dev/null
  rm -rf /tmp/u_*-mcp /tmp/v_*-mcp /tmp/pub_*_mcp 2>/dev/null
  rm -rf /tmp/e2e /tmp/e2ebuyer /tmp/hipaaverify 2>/dev/null
  rm -rf /tmp/x402src /tmp/openclaw 2>/dev/null
  rm -rf /tmp/haulage-deploy 2>/dev/null
  rm -rf ~/Library/Caches/npm 2>/dev/null
  npm cache clean --force >/dev/null 2>&1
  log "After cleanup: $(df / | tail -1 | awk '{print $5}') used"
elif [ "$USED_PCT" -gt 80 ]; then
  alert "Disk >80% — early warning. Top /tmp offenders:"
  du -sh /tmp/* 2>/dev/null | sort -h | tail -5 >> "$ALERT_FILE"
fi

# ─── 2. Health checks (indexed arrays — bash 3.2 compatible) ─────────────────
SITE_BASES=(
  "https://haulage-app-umbrella.vercel.app"
  "https://muckaway-saas.vercel.app"
  "https://grabhire-ai-uk.vercel.app"
  "https://planthire-ai-uk.vercel.app"
)
SITE_ROUTES=(
  "/ /mcps /about /contact"
  "/"
  "/"
  "/"
)
NEEDS_REDEPLOY=()
for i in "${!SITE_BASES[@]}"; do
  BASE="${SITE_BASES[$i]}"
  ROUTES="${SITE_ROUTES[$i]}"
  HEALTHY=1
  for R in $ROUTES; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "${BASE}${R}")
    if [ "$CODE" = "200" ]; then
      log "OK  $CODE  ${BASE}${R}"
    elif [ "${CODE:0:1}" = "5" ] || [ "$CODE" = "000" ]; then
      alert "${BASE}${R} returned HTTP $CODE — flagged for self-heal"
      HEALTHY=0
    else
      log "MEH $CODE  ${BASE}${R}"
    fi
  done
  [ "$HEALTHY" = "0" ] && NEEDS_REDEPLOY+=("$BASE")
done

# ─── 3. Self-healing redeploy (default: log-only; uncomment to enable) ───────
if [ ${#NEEDS_REDEPLOY[@]} -gt 0 ] && [ -d "$PERSISTED_SRC" ]; then
  for U in "${NEEDS_REDEPLOY[@]}"; do
    PROJECT=$(echo "$U" | sed 's|https://||;s|.vercel.app||')
    alert "SELF-HEAL candidate: $PROJECT — run: cd $PERSISTED_SRC && vercel --prod --yes --scope $SCOPE"
    # Uncomment to auto-execute:
    # (cd "$PERSISTED_SRC" && vercel --prod --yes --scope "$SCOPE" >> "$LOG" 2>&1) &
  done
fi

# ─── 4. DNS check on the .ai/.app domains ────────────────────────────────────
for D in haulage.app muckaway.ai grabhire.ai planthire.ai; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 15 "https://$D" 2>/dev/null || echo "000")
  TITLE=$(curl -s --max-time 5 "https://$D" 2>/dev/null | grep -i -m1 -o "<title>[^<]*</title>" | sed 's/<[^>]*>//g' | head -c 80)
  log "DNS: $D → HTTP $CODE [$TITLE]"
done

# ─── 5. Stripe checkout reachability ─────────────────────────────────────────
SCODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836")
if [ "$SCODE" = "200" ]; then
  log "OK Stripe Pro link reachable (HTTP 200)"
else
  alert "Stripe Pro link HTTP $SCODE — payment funnel DOWN"
fi

# ─── 6. Stripe revenue probe (if API key available) ──────────────────────────
STRIPE_KEY_FILE="/Users/nicholas/clawd/revenue/.stripe_key"
if [ -f "$STRIPE_KEY_FILE" ]; then
  STRIPE_KEY=$(cat "$STRIPE_KEY_FILE")
  SINCE=$(( $(date +%s) - 86400 ))
  RESP=$(curl -s --max-time 15 -u "$STRIPE_KEY:" "https://api.stripe.com/v1/charges?created[gte]=$SINCE&limit=100" 2>/dev/null || echo "")
  COUNT=$(echo "$RESP" | grep -c '"object": "charge"' 2>/dev/null || echo 0)
  AMOUNT=$(echo "$RESP" | grep -o '"amount": [0-9]*' | awk '{sum+=$2} END {printf "%.2f", sum/100}')
  [ -z "$AMOUNT" ] && AMOUNT="0.00"
  log "Stripe (24h): $COUNT charges, £$AMOUNT"
  [ "$COUNT" -gt 0 ] && alert "REVENUE: $COUNT new charges totalling £$AMOUNT in last 24h"
fi

# ─── 7. Persisted-source guard ───────────────────────────────────────────────
if [ ! -d "$PERSISTED_SRC/src" ]; then
  alert "PERSISTED SOURCE MISSING at $PERSISTED_SRC/src"
fi

# ─── 8. Daily summary at 09:00 ──────────────────────────────────────────────
HOUR=$(date +%H)
if [ "$HOUR" = "09" ] || [ "${1:-}" = "--force-summary" ]; then
  SUMMARY="/tmp/haulage-daily-$(date +%Y-%m-%d).md"
  {
    echo "# Haulage Autopilot — $(date '+%A %d %B %Y')"
    echo ""
    echo "## Site health (last 24h)"
    grep -E "^\[" "$LOG" | tail -200 | grep -E "OK|ALERT|WARN|MEH" | tail -30
    echo ""
    echo "## Alerts (last 24h)"
    [ -f "$ALERT_FILE" ] && tail -10 "$ALERT_FILE" || echo "_no alerts_"
    echo ""
    echo "## Disk"; df -h / | tail -1
    echo ""
    echo "## Next actions"
    echo "- ~/clawd/_TOPOLOGY/HAULAGE_OUTBOUND_PLAYBOOK_2026-06-03.md"
    echo "- Click-test one Stripe Pro link"
    echo "- DNS-swap a domain: ~/clawd/scripts/haulage-dns-swap.sh DOMAIN PROJECT"
  } > "$SUMMARY"
  log "Daily summary written to $SUMMARY"
fi

log "=== tick done ==="
