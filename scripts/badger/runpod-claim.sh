#!/bin/bash
# runpod-claim.sh — try to claim a GPU in a datacenter that holds our data.
#
# WHY. The 3,500 GB of network volumes are region-locked, and a network volume can
# only be attached at pod CREATION. So a pod is only useful if it is created in the
# datacenter its data lives in. On 2026-09-03 both such datacenters were full:
# six GPU/datacenter combinations were refused with "no longer any instances
# available", including one the datacenter API reported as High stock. Capacity is
# transient, so this is a claim attempt, not a provisioning script.
#
# THE STOCK API AND THE CREATE API DISAGREE. `runpodctl datacenter list` reported
# 'NVIDIA RTX PRO 4500 Blackwell' as High in EU-RO-1 while creation failed for it and
# for every other option, with and without a volume attached. Treat stockStatus as a
# hint; only a successful create is evidence.
#
#   bash scripts/badger/runpod-claim.sh            # one pass, all targets
#   bash scripts/badger/runpod-claim.sh --dry      # print what it would try
set -uo pipefail
dry=0; [ "${1:-}" = "--dry" ] && dry=1

IMAGE="runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04"

# volume_id : datacenter : gpuId : friendly-name : what the volume holds
TARGETS=(
  "i4atujketp:EU-RO-1:NVIDIA RTX PRO 4500 Blackwell:csoai-eu-ro1-weights:k3-weights-2tb 2000GB"
  "i4atujketp:EU-RO-1:NVIDIA GeForce RTX 5090:csoai-eu-ro1-weights:k3-weights-2tb 2000GB"
  "i4atujketp:EU-RO-1:NVIDIA GeForce RTX 4090:csoai-eu-ro1-weights:k3-weights-2tb 2000GB"
  "2i3cwz3a6k:EU-RO-1:NVIDIA GeForce RTX 4090:csoai-eu-ro1-merge:sovos-merge-800 800GB"
  "b0h5gma2fy:CA-MTL-3:NVIDIA RTX PRO 6000 Blackwell Server Edition:csoai-ca-mtl3-models:sov-models 300GB"
  "b0h5gma2fy:CA-MTL-3:NVIDIA H200:csoai-ca-mtl3-models:sov-models 300GB"
  "uvevdv0pq9:CA-MTL-3:NVIDIA H200:csoai-ca-mtl3-artifacts:sov-artifacts 200GB"
)

echo "runpod-claim $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "  a pod without its volume is blank compute — only these placements are useful"
echo

for t in "${TARGETS[@]}"; do
  vol="${t%%:*}"; rest="${t#*:}"
  dc="${rest%%:*}"; rest="${rest#*:}"
  gpu="${rest%%:*}"; rest="${rest#*:}"
  name="${rest%%:*}"; holds="${rest#*:}"

  if [ "$dry" -eq 1 ]; then
    printf "  would try %-14s %-46s (%s)\n" "$dc" "$gpu" "$holds"
    continue
  fi

  out=$(runpodctl create pod --name "$name" --gpuType "$gpu" --dataCenterId "$dc" \
        --networkVolumeId "$vol" --volumePath /workspace --imageName "$IMAGE" \
        --gpuCount 1 2>&1 | grep -v "^warning")

  case "$out" in
    *"no longer any instances"*)
      printf "  full        %-12s %s\n" "$dc" "$gpu" ;;
    *"Unknown GPU"*)
      printf "  bad gpu id  %-12s %s\n" "$dc" "$gpu" ;;
    *Error*|*error*)
      printf "  error       %-12s %s — %s\n" "$dc" "$gpu" "$(echo "$out" | head -1 | cut -c1-60)" ;;
    *)
      echo
      echo "  CLAIMED: $name in $dc on $gpu"
      echo "  volume : $holds mounted at /workspace"
      echo "$out" | head -6
      echo
      echo "  Next: runpodctl ssh info <id>  — and note sshd may need a minute."
      exit 0 ;;
  esac
done

echo
echo "  No capacity in any datacenter holding a volume."
echo "  Nothing is lost — 3,500 GB across 5 network volumes is untouched and"
echo "  unattached. This is a wait, not a fault. Re-run when convenient."
exit 1
