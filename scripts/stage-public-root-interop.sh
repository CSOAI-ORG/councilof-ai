#!/usr/bin/env bash
# Stage the public-root witness products without letting one absent optional
# receipt cancel a whole `git add` invocation. Run from the repository root.
set -euo pipefail

required=(
  public/interop/root-witness-latest.json
  public/interop/root-witness-pointer.json
)
for path in "${required[@]}"; do
  if [ ! -f "$path" ]; then
    echo "HALT: required public-root witness output is missing: $path" >&2
    exit 1
  fi
done

shopt -s nullglob
dated_witnesses=(public/interop/root-witness-[0-9]*.json)
if [ "${#dated_witnesses[@]}" -eq 0 ]; then
  echo "HALT: required dated public-root witness output is missing" >&2
  exit 1
fi

git add -- "${required[@]}" "${dated_witnesses[@]}"

# Rekor, OpenTimestamps, EAS and per-request witness mirrors are independent:
# any one can honestly be absent on a run. Stage each group that exists so a
# missing pathspec can never discard receipts produced by the other groups.
stage_if_present() {
  if [ "$#" -gt 0 ]; then
    git add -- "$@"
  fi
}

rekor_receipts=(public/interop/rekor-root-*.json)
ots_receipts=(public/interop/*.ots)
witness_mirrors=(public/interop/witness/*.json)
stage_if_present "${rekor_receipts[@]}"
stage_if_present "${ots_receipts[@]}"
if [ -f public/interop/eas-root-attestations.json ]; then
  git add -- public/interop/eas-root-attestations.json
fi
stage_if_present "${witness_mirrors[@]}"
