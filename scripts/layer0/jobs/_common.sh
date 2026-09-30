# Shared by the staged Layer 0 jobs. Sourced, never run. Build pod only.
# Each job works in a FRESH --shared sparse clone of the canon (the staging mirror master), in a
# job-owned temp dir that is removed on exit. It never touches a shared checkout and never pushes
# master. Outputs go to $L0_STATE (default /workspace/state/layer0).
set -euo pipefail
L0_MIRROR="${L0_MIRROR:-/workspace/staging/mirror/councilof-ai.git}"
L0_STATE="${L0_STATE:-/workspace/state/layer0}"
L0_BRANCH="${L0_BRANCH:-master}"   # tests point this at a lane branch; jobs run on master
L0_DAY="$(date -u +%Y%m%dT%H%MZ)"
mkdir -p "$L0_STATE"

l0_floor() {  # skip (exit 0, logged) when the volume has less than 2 GB free
  local free_kb; free_kb=$(df -Pk "$L0_STATE" | awk 'NR==2{print $4}')
  if [ "${free_kb:-0}" -lt 2097152 ]; then echo "SKIP: <2 GB free under $L0_STATE"; exit 0; fi
}

l0_canon() {  # l0_canon <sparse dir>... ; sets L0_CANON and L0_SHA
  # pod-local disk + --shared (objects borrowed from the mirror, nothing copied), as root-daily.sh does;
  # a blob-less clone onto the network volume took minutes under load.
  mkdir -p "${L0_TMP:-/root/l0-tmp}"
  L0_CANON="$(mktemp -d "${L0_TMP:-/root/l0-tmp}/canon-XXXXXX")"
  trap 'rm -rf "$L0_CANON"' EXIT
  git clone -q --shared --no-checkout --branch "$L0_BRANCH" "$L0_MIRROR" "$L0_CANON"
  git -C "$L0_CANON" sparse-checkout init --cone   # git 2.25 on the pod: `set --cone` is read as a path
  git -C "$L0_CANON" sparse-checkout set "$@"
  git -C "$L0_CANON" checkout -q "$L0_BRANCH"
  L0_SHA="$(git -C "$L0_CANON" rev-parse HEAD)"
  echo "canon $L0_BRANCH $L0_SHA"
}
