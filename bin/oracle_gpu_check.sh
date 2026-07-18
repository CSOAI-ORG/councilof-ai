#!/usr/bin/env bash
# oracle_gpu_check.sh — does this tenancy have ANY GPU quota? Paginates properly. MEOK-SOV3.
set -u
OCI="$HOME/bin/oci"
TEN="ocid1.tenancy.oc1..aaaaaaaa3bcsjdrv2ysuz4hgvxj3k7pgo2ojcfxt5zq3fr7323w23j6ffgna"
echo "🜏 GPU quota scan (all pages, all GPU shapes)"
# --all auto-paginates; then filter for GPU shapes with limit >= 1
"$OCI" limits value list --compartment-id "$TEN" --service-name compute --all \
  --query "data[?contains(\"name\",'GPU')].{shape:name,limit:value}" --output table 2>/dev/null
echo
echo "🜏 also check service-limit (the approved ceiling, not just current value):"
"$OCI" limits definition list --compartment-id "$TEN" --service-name compute --all \
  --query "data[?contains(\"name\",'GPU')].name" --output table 2>/dev/null | head -30
echo
echo "  READING: if both are empty/zero → no GPU quota (normal for free tenancy) → request an"
echo "  increase in the console (Governance → Limits, Quotas & Usage → request) OR use Vast/RunPod"
echo "  for the one-off proof run, and keep the free ARM box for serving."
