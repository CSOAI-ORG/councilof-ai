#!/usr/bin/env bash
# oracle_catapul_setup.sh — the ONE-CLICK ORACLE CATAPULT
# Pre-conditions:
#   1. You've signed up at https://cloud.oracle.com
#   2. You have a 5-line file at /tmp/oracle.env with:
#        TENANCY=ocid1.tenancy.oc1..xxxx
#        USER=ocid1.user.oc1..xxxx
#        FINGERPRINT=aa:bb:cc:dd:...
#        API_KEY_PATH=/Users/nicholas/.oci/api_key.pem
#        COMPARTMENT=ocid1.compartment.oc1..xxxx  (optional, auto-discovered)
#
# How to use:
#   1. Get the 4 values from cloud.oracle.com (User Settings → API Keys)
#   2. Save them: source /tmp/oracle.env
#   3. Run: bash oracle_catapul_setup.sh
#   4. sovereign-oracle will turn 100/100 green

set -e

# Colors for sovereign Mist 12 pillars audit output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
nope() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }

echo "🜏 ORACLE CATAPULT — ONE-CLICK SETUP"
echo "======================================="
echo ""

# 1. Check /tmp/oracle.env
if [ ! -f /tmp/oracle.env ]; then
    nope "/tmp/oracle.env not found"
    echo "Create it with these 4 lines:"
    echo "  TENANCY=ocid1.tenancy.oc1..xxxx"
    echo "  USER=ocid1.user.oc1..xxxx"
    echo "  FINGERPRINT=aa:bb:cc:dd:..."
    echo "  API_KEY_PATH=/Users/nicholas/.oci/api_key.pem"
    exit 1
fi
source /tmp/oracle.env
ok "Loaded /tmp/oracle.env"

# 2. Check 4 vars
for v in TENANCY USER FINGERPRINT API_KEY_PATH; do
    if [ -z "${!v}" ]; then
        nope "Missing $v in /tmp/oracle.env"
        exit 1
    fi
done
ok "All 4 vars present"

# 3. Move the key
mkdir -p ~/.oci
if [ ! -f "$API_KEY_PATH" ]; then
    nope "API key not found at $API_KEY_PATH"
    echo "Look in ~/Downloads for the .pem Oracle gave you, then move it:"
    echo "  mv ~/Downloads/*.pem $API_KEY_PATH"
    exit 1
fi
chmod 600 "$API_KEY_PATH"
ok "API key chmod 600: $API_KEY_PATH"

# 4. Write ~/.oci/config
cat > ~/.oci/config << EOF
[DEFAULT]
user=${USER}
fingerprint=${FINGERPRINT}
key_file=${API_KEY_PATH}
tenancy=${TENANCY}
region=uk-london-1
EOF
chmod 600 ~/.oci/config
ok "~/.oci/config written"

# 5. Verify the connection
echo ""
echo "Testing OCI connection..."
if oci iam region list >/dev/null 2>&1; then
    ok "OCI connected — regions listed"
    oci iam region list --query 'data[?name==`uk-london-1`].name' --raw-output
else
    nope "OCI connection failed"
    oci iam region list 2>&1 | head -10
    exit 1
fi

# 6. Check if uk-london-1 is available
if oci iam region list --query 'data[?name==`uk-london-1`].name' --raw-output 2>/dev/null | grep -q "uk-london-1"; then
    ok "uk-london-1 region available"
else
    warn "uk-london-1 NOT in regions list — try alternative home region"
    oci iam region list | python3 -c "import json,sys; print('\n'.join([r['name'] for r in json.load(sys.stdin)['data']]))"
fi

# 7. Auto-discover compartment if not in env
if [ -z "$COMPARTMENT" ]; then
    COMPARTMENT=$(oci iam compartment list --all 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; print(d[0]['id'])" 2>/dev/null)
    if [ -n "$COMPARTMENT" ]; then
        echo "COMPARTMENT=$COMPARTMENT" >> /tmp/oracle.env
        ok "Auto-discovered compartment: $COMPARTMENT"
    fi
fi

# 8. Display summary
echo ""
echo "============================================"
echo "✅ ORACLE CATAPULT — ALL GREEN"
echo "============================================"
echo "Tenancy:     $TENANCY"
echo "User:        $USER"
echo "Fingerprint: $FINGERPRINT"
echo "Region:      uk-london-1"
echo "Compartment: ${COMPARTMENT:-not yet discovered}"
echo ""
echo "Next: provision free-tier ARM (4 OCPU + 24 GB):"
echo "  $ sovereign-oracle  # my catapult verifier will turn 100/100 green"
echo ""
echo "After: provision ARM via:"
echo "  $ oci compute instance launch --availability-domain 'kEnn:UK-LONDON-1-AD-1' \\"
echo "      --compartment-id \$COMPARTMENT --shape 'VM.Standard.A1.Flex' \\"
echo "      --shape-config '{\"ocpus\":4,\"memoryInGBs\":24}' \\"
echo "      --image-id <ubuntu-image-ocid> --subnet-id <subnet-ocid> \\"
echo "      --display-name 'sovereign-substrate' --assign-public-ip true"
