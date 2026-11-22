#!/usr/bin/env bash
# Called by .github/workflows/hub-fixes.yml from ops/hub-fixes/. Dry run unless APPLY=true.
set -euo pipefail
case "${TASK}" in
  hf-card-prs)
    A="--dry-run"; [ "${APPLY}" = "true" ] && A="--apply"
    L=""; [ "${LIMIT:-0}" != "0" ] && L="--limit ${LIMIT}"
    python3 hf/push_hf_prs.py --bundle hf/bundle --manifest hf/hf_fix_manifest.csv --wave "${WAVE}" $L $A ;;
  kaggle-metadata)
    A=""; [ "${APPLY}" = "true" ] && [ "${CONFIRM}" = "true" ] && A="--confirm-publish"
    python3 kaggle/push_kaggle.py --bundle kaggle --manifest kaggle/kaggle_fix_manifest.csv $A ;;
  collections)
    A=""; [ "${APPLY}" = "true" ] && [ "${CONFIRM}" = "true" ] && A="--confirm"
    python3 collections/apply_collections.py --plan collections/collections_plan.csv $A ;;
  flagship)
    cd flagship
    if [ "${APPLY}" = "true" ] && [ "${CONFIRM}" = "true" ]; then
      python3 build_flagship.py --confirm --create-repo --open-pr
    else
      python3 build_flagship.py --validate
    fi ;;
  *) echo "unknown TASK=${TASK}"; exit 2 ;;
esac
