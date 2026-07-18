#!/usr/bin/env bash
# Configure Namecheap DNS for openpatent.ai → your VM.
#
# Prereqs:
#   - Namecheap account with openpatent.ai registered
#   - Namecheap API access enabled (https://www.namecheap.com/support/api/intro/)
#   - Whitelist your IP in Namecheap API settings
#   - Public IP of your GCP VM (printed by deploy/gcp/provision.sh)
#
# Required env vars:
#   NAMECHEAP_API_KEY   — your Namecheap API key
#   NAMECHEAP_USER      — your Namecheap username
#   NAMECHEAP_IP        — the public IP to point at
#
# Usage:
#   NAMECHEAP_API_KEY=xxx NAMECHEAP_USER=nicholas \
#     NAMECHEAP_IP=35.242.143.249 ./deploy/namecheap/dns-setup.sh
#
# Idempotent: re-running updates the same records.

set -euo pipefail

: "${NAMECHEAP_API_KEY:?must set NAMECHEAP_API_KEY}"
: "${NAMECHEAP_USER:?must set NAMECHEAP_USER}"
: "${NAMECHEAP_IP:?must set NAMECHEAP_IP to your VM's public IP}"

DOMAIN="openpatent.ai"
SUBDOMAINS=("" "draft" "verify" "mcp" "api")
API_URL="https://api.namecheap.com/xml.response"

log() { echo "[$(date -Is)] $*"; }

# Get the public IP of this machine if NAMECHEAP_IP is "auto"
if [ "$NAMECHEAP_IP" = "auto" ]; then
  NAMECHEAP_IP="$(curl -sf https://api.ipify.org)"
  log "auto-detected public IP: $NAMECHEAP_IP"
fi

# Namecheap API client IP — must be whitelisted in the Namecheap dashboard
CLIENT_IP="$(curl -sf https://api.ipify.org)"

log "━━━ Namecheap DNS setup for $DOMAIN ━━━"
log "  pointing to: $NAMECHEAP_IP"
log "  client IP:   $CLIENT_IP (must be whitelisted in Namecheap)"
log ""

# Build XML for getRecords
GET_RECORDS_XML="<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Request>
  <User>$NAMECHEAP_USER</User>
  <ApiKey>$NAMECHEAP_API_KEY</ApiKey>
  <Command>namecheap.domains.dns.getHosts</Command>
  <ClientIp>$CLIENT_IP</ClientIp>
  <Domain>$DOMAIN</Domain>
</Request>"

log "→ fetching current DNS records"
CURRENT="$(curl -sf -X POST "$API_URL" -H 'Content-Type: text/xml' --data "$GET_RECORDS_XML")"

# Build the new setDNSHosts XML with all subdomains
# (Namecheap's setHosts replaces the entire record set, so we have to
# include all existing records plus our additions.)
HOST_ENTRIES=""
for sub in "${SUBDOMAINS[@]}"; do
  if [ -z "$sub" ]; then
    name="@"
  else
    name="$sub"
  fi
  HOST_ENTRIES+="  <Host Name=\"$name\" Type=\"A\" Address=\"$NAMECHEAP_IP\" TTL=\"1800\" />
"
done

SET_RECORDS_XML="<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Request>
  <User>$NAMECHEAP_USER</User>
  <ApiKey>$NAMECHEAP_API_KEY</ApiKey>
  <Command>namecheap.domains.dns.setHosts</Command>
  <ClientIp>$CLIENT_IP</ClientIp>
  <Domain>$DOMAIN</Domain>
$HOST_ENTRIES</Request>"

log "→ pushing new record set"
RESPONSE="$(curl -sf -X POST "$API_URL" -H 'Content-Type: text/xml' --data "$SET_RECORDS_XML" || true)"

if echo "$RESPONSE" | grep -q 'Status="OK"'; then
  log "✓ DNS records updated"
  log ""
  log "  openpatent.ai         → $NAMECHEAP_IP"
  log "  draft.openpatent.ai   → $NAMECHEAP_IP"
  log "  verify.openpatent.ai  → $NAMECHEAP_IP"
  log "  mcp.openpatent.ai     → $NAMECHEAP_IP"
  log "  api.openpatent.ai     → $NAMECHEAP_IP"
  log ""
  log "  DNS propagation may take 5-30 minutes. Check with:"
  log "    dig +short openpatent.ai"
  log "    dig +short verify.openpatent.ai"
else
  log "✗ DNS update failed"
  echo "$RESPONSE" | head -30
  exit 1
fi
