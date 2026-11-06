#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Build the Helm chart repository served at https://councilof.ai/helm/ .
#
#   HELM=/path/to/helm bash scripts/helm/build-helm-repo.sh
#
# Every chart directory under packages/helm/<name>/ (one with a Chart.yaml) is linted, packaged into public/helm/,
# and indexed. Other lanes add a chart by committing its directory there -- nothing else to wire.
# Charts already in public/helm/ are kept (a published version is never overwritten: same name+version = refused
# unless the bytes are identical). index.yaml is rebuilt with --merge so existing entries keep their digests.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HELM="${HELM:-helm}"
OUT="$ROOT/public/helm"
URL="https://councilof.ai/helm/"
mkdir -p "$OUT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
n=0
for chart in "$ROOT"/packages/helm/*/; do
  [ -f "$chart/Chart.yaml" ] || continue
  "$HELM" lint --strict "$chart" >/dev/null
  "$HELM" package "$chart" -d "$TMP" >/dev/null
  n=$((n+1))
done
for tgz in "$TMP"/*.tgz; do
  [ -e "$tgz" ] || continue
  base="$(basename "$tgz")"
  if [ -e "$OUT/$base" ]; then
    # helm package embeds file mtimes, so compare the chart CONTENTS, not the archive bytes
    if ! diff -r <(mkdir -p "$TMP/a" && tar xzf "$OUT/$base" -C "$TMP/a" && cd "$TMP/a" && find . -type f -exec sha256sum {} + | sort) \
                 <(mkdir -p "$TMP/b" && tar xzf "$tgz" -C "$TMP/b" && cd "$TMP/b" && find . -type f -exec sha256sum {} + | sort) >/dev/null; then
      echo "REFUSED: $base is already published with different contents; bump the chart version" >&2; exit 1
    fi
    rm -rf "$TMP/a" "$TMP/b"
    continue
  fi
  cp "$tgz" "$OUT/$base"
done
if [ -f "$OUT/index.yaml" ]; then
  cp "$OUT/index.yaml" "$TMP/old-index.yaml"
  "$HELM" repo index "$OUT" --url "$URL" --merge "$TMP/old-index.yaml"
else
  "$HELM" repo index "$OUT" --url "$URL"
fi
echo "charts linted+packaged: $n; published: $(ls "$OUT"/*.tgz | wc -l); index: $OUT/index.yaml"
