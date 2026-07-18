#!/usr/bin/env bash
# oracle_train.sh — provision an Oracle GPU box for the merge training run. MEOK-SOV3.
# Only use if oracle_gpu_check.sh shows GPU quota >= 1. Else use Vast/RunPod for the one-off.
set -u
OCI="$HOME/bin/oci"
TEN="ocid1.tenancy.oc1..aaaaaaaa3bcsjdrv2ysuz4hgvxj3k7pgo2ojcfxt5zq3fr7323w23j6ffgna"
NAME="sovereign-gpu-train"
SHAPE="${SHAPE:-VM.GPU.A10.1}"   # override: SHAPE=VM.GPU2.1 bash oracle_train.sh

echo "🜏 preflight: auth + GPU quota"
"$OCI" iam region list >/dev/null 2>&1 || { echo "✗ auth not working — run oracle_fixconfig.sh"; exit 1; }
QUOTA=$("$OCI" limits value list --compartment-id "$TEN" --service-name compute --all \
        --query "length(data[?contains(\"name\",'GPU') && value>`0`])" --raw-output 2>/dev/null)
echo "  GPU shapes with quota>0: ${QUOTA:-0}"
if [ "${QUOTA:-0}" = "0" ]; then
  echo "  ✗ no GPU quota in this tenancy. Options:"
  echo "     (a) request increase: console → Governance → Limits, Quotas & Usage → GPU shape → Request"
  echo "     (b) run the one-off proof on Vast/RunPod, serve the merged model on the free ARM box."
  exit 2
fi
echo "  ✓ GPU quota present — proceeding to provision $SHAPE"

AD=$("$OCI" iam availability-domain list --compartment-id "$TEN" --query 'data[0].name' --raw-output 2>/dev/null)
IMG=$("$OCI" compute image list --compartment-id "$TEN" --operating-system "Canonical Ubuntu" \
      --operating-system-version "22.04" --shape "$SHAPE" --sort-by TIMECREATED --sort-order DESC \
      --query 'data[0].id' --raw-output 2>/dev/null)
echo "  AD=$AD  image=$IMG"
if [ -z "${SUBNET:-}" ]; then
  echo "  ✗ no SUBNET set. Create a VCN (console → Networking → VCN Wizard) then:"
  echo "     SUBNET=<public-subnet-ocid> bash $0"
  exit 0
fi
echo "🜏 launching $SHAPE (GPU) — this WILL incur cost (not free tier)"
"$OCI" compute instance launch --availability-domain "$AD" --compartment-id "$TEN" \
  --shape "$SHAPE" --image-id "$IMG" --subnet-id "$SUBNET" \
  --display-name "$NAME" --assign-public-ip true --wait-for-state RUNNING
echo "  ✓ GPU box up. Next: rsync merge kit + huggingface-cli download base + run 02_finetune."
