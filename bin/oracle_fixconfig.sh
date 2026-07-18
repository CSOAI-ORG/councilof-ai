#!/usr/bin/env bash
# oracle_fixconfig.sh — rewrite ~/.oci/config DEFAULT to the REAL console identity. MEOK-SOV3 2026-07-10.
# Cause of the 401: config DEFAULT had stale catapult OCIDs/fingerprint (f9:27...) that don't match
# the key uploaded to Oracle (fd:70:91:a6...). These values are the ones Oracle's console generated.
set -u
CFG="$HOME/.oci/config"
KEY="$HOME/.oci/api_key.pem"
OCI="$HOME/bin/oci"

# --- real identity from the Oracle console (identifiers, not secrets) ---
USER_OCID="ocid1.user.oc1..aaaaaaaaewgeauianxrwtnfb5fyfuxrskzs6x3twm4oiohtjbp4ysx36ioda"
TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaa3bcsjdrv2ysuz4hgvxj3k7pgo2ojcfxt5zq3fr7323w23j6ffgna"
FINGERPRINT="fd:70:91:a6:18:7a:18:11:f8:32:dc:15:e8:dc:34:84"

echo "🜏 step A: verify the LOCAL key matches the fingerprint Oracle expects"
LOCAL_FP=$(openssl rsa -pubout -outform DER -in "$KEY" 2>/dev/null | openssl md5 -c | awk '{print $2}')
echo "   local api_key.pem fingerprint: $LOCAL_FP"
echo "   console/uploaded fingerprint : $FINGERPRINT"
if [ "$LOCAL_FP" != "$FINGERPRINT" ]; then
  echo "   ✗ MISMATCH — the key on disk is NOT the one uploaded. Stop: we'd just 401 again."
  echo "     (This means api_key.pem was regenerated after upload. Re-run oracle_finish.sh and"
  echo "      upload THIS key's public block, or restore the .pem that matches $FINGERPRINT.)"
  exit 1
fi
echo "   ✓ key matches — safe to fix config"

echo "🜏 step B: back up existing config, then write correct DEFAULT profile"
[ -f "$CFG" ] && cp "$CFG" "$CFG.bak.$(date +%s)" && echo "   backed up old config"
cat > "$CFG" << CFGEOF
[DEFAULT]
user=$USER_OCID
fingerprint=$FINGERPRINT
tenancy=$TENANCY_OCID
region=uk-london-1
key_file=$KEY
CFGEOF
chmod 600 "$CFG"
echo "   wrote clean DEFAULT profile"

echo "🜏 step C: THE TEST — list regions (should now succeed)"
"$OCI" iam region list --output table
