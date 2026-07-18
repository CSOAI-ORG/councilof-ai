#!/usr/bin/env bash
# oracle_provision.sh — provision the FREE ARM A1 (serving box) end-to-end. MEOK-SOV3 2026-07-10.
# Now auto-creates a VCN + public subnet via CLI (no console click needed). Idempotent.
set -u
OCI="$HOME/bin/oci"
TEN="ocid1.tenancy.oc1..aaaaaaaa3bcsjdrv2ysuz4hgvxj3k7pgo2ojcfxt5zq3fr7323w23j6ffgna"  # from console config paste 2026-07-10 11:58; proven live (region list + VCN create succeeded). NOT the old catapult tenancy (...jyluwrdhqfgf6...) which 401'd.
NAME="sovereign-substrate"

echo "🜏 preflight: auth"
"$OCI" iam region list >/dev/null 2>&1 || { echo "✗ auth broken — run oracle_fixconfig.sh"; exit 1; }
echo "  ✓ auth OK"

AD=$("$OCI" iam availability-domain list --compartment-id "$TEN" --query 'data[0].name' --raw-output 2>/dev/null)
echo "🜏 AD: ${AD:-<none>}"
[ -z "$AD" ] && { echo "✗ no availability domain returned"; exit 1; }

echo "🜏 VCN + subnet (auto-create if absent)"
VCN=$("$OCI" network vcn list --compartment-id "$TEN" --display-name "sovereign-vcn" \
      --query 'data[0].id' --raw-output 2>/dev/null)
if [ -z "$VCN" ] || [ "$VCN" = "null" ]; then
  echo "  creating VCN sovereign-vcn (10.0.0.0/16)..."
  VCN=$("$OCI" network vcn create --compartment-id "$TEN" --display-name "sovereign-vcn" \
        --cidr-blocks '["10.0.0.0/16"]' --wait-for-state AVAILABLE \
        --query 'data.id' --raw-output 2>/dev/null)
  # internet gateway + route + default subnet
  IG=$("$OCI" network internet-gateway create --compartment-id "$TEN" --vcn-id "$VCN" \
       --is-enabled true --display-name "sovereign-ig" --wait-for-state AVAILABLE \
       --query 'data.id' --raw-output 2>/dev/null)
  RT=$("$OCI" network vcn get --vcn-id "$VCN" --query 'data."default-route-table-id"' --raw-output 2>/dev/null)
  "$OCI" network route-table update --rt-id "$RT" --force \
    --route-rules "[{\"cidrBlock\":\"0.0.0.0/0\",\"networkEntityId\":\"$IG\"}]" >/dev/null 2>&1
fi
echo "  VCN: $VCN"
SUBNET=$("$OCI" network subnet list --compartment-id "$TEN" --vcn-id "$VCN" \
         --query 'data[0].id' --raw-output 2>/dev/null)
if [ -z "$SUBNET" ] || [ "$SUBNET" = "null" ]; then
  echo "  creating public subnet..."
  SUBNET=$("$OCI" network subnet create --compartment-id "$TEN" --vcn-id "$VCN" \
           --display-name "sovereign-subnet" --cidr-block "10.0.1.0/24" \
           --prohibit-public-ip-on-vnic false --wait-for-state AVAILABLE \
           --query 'data.id' --raw-output 2>/dev/null)
fi
echo "  SUBNET: $SUBNET"
[ -z "$SUBNET" ] && { echo "✗ subnet creation failed — check console Networking"; exit 1; }

echo "🜏 idempotency: is $NAME already running?"
EXIST=$("$OCI" compute instance list --compartment-id "$TEN" \
        --query "data[?\"display-name\"=='$NAME' && \"lifecycle-state\"=='RUNNING'].id | [0]" --raw-output 2>/dev/null)
if [ -n "${EXIST:-}" ] && [ "$EXIST" != "null" ]; then
  echo "  ✓ already RUNNING ($EXIST) — done."; exit 0
fi

IMG=$("$OCI" compute image list --compartment-id "$TEN" --operating-system "Canonical Ubuntu" \
      --operating-system-version "22.04" --shape "VM.Standard.A1.Flex" \
      --sort-by TIMECREATED --sort-order DESC --query 'data[0].id' --raw-output 2>/dev/null)
echo "🜏 launching FREE ARM A1 (4 OCPU/24GB, \$0/mo), image=$IMG"
"$OCI" compute instance launch --availability-domain "$AD" --compartment-id "$TEN" \
  --shape "VM.Standard.A1.Flex" --shape-config '{"ocpus":4,"memoryInGBs":24}' \
  --image-id "$IMG" --subnet-id "$SUBNET" --display-name "$NAME" --assign-public-ip true \
  --wait-for-state RUNNING
echo "  ✓ FREE serving box up. Next: rsync OWEM + charters + serve on :3101."
