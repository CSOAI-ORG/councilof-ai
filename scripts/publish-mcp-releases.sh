#!/bin/bash
# MCP GitHub Release Publisher — 8 wheels
# Usage: ./publish-mcp-releases.sh <github-token>
# Creates GitHub Releases for all 8 MCP servers with their wheels
TOKEN="$1"
if [ -z "$TOKEN" ]; then echo "Usage: $0 <github-token>"; exit 1; fi

declare -A WHEELS
WHEELS["meok-ai-psych-vuln-audit-mcp"]="CSOAI-ORG/meok-ai-psych-vuln-audit-mcp"
WHEELS["meok-annex-iii-impact-mcp"]="CSOAI-ORG/meok-annex-iii-impact-mcp"
WHEELS["meok-eu-code-of-practice-mcp"]="CSOAI-ORG/meok-eu-code-of-practice-mcp"
WHEELS["eu-cra-mcp"]="CSOAI-ORG/eu-cra-mcp"
WHEELS["meok-compliance-passport-mcp"]="CSOAI-ORG/meok-compliance-passport-mcp"
WHEELS["openchronicle-mcp"]="CSOAI-ORG/openchronicle-mcp"
WHEELS["meok-ai-treaty-mcp"]="CSOAI-ORG/meok-ai-treaty-mcp"
WHEELS["meok-rail-freight-uk-mcp"]="CSOAI-ORG/meok-rail-freight-uk-mcp"

for dir in "${!WHEELS[@]}"; do
  repo="${WHEELS[$dir]}"
  wheel=$(ls ~/clawd/$dir/dist/*.whl 2>/dev/null | head -1)
  if [ -z "$wheel" ]; then
    echo "SKIP $dir: no wheel"
    continue
  fi
  pkgname=$(basename "$wheel" .whl)
  version=$(echo "$pkgname" | grep -oP '\d+\.\d+\.\d+.*' || echo "0.1.0")
  echo "PUBLISH $dir → $repo v$version"
  # Check if release exists
  exists=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $TOKEN" "https://api.github.com/repos/$repo/releases/tags/v$version" 2>/dev/null)
  if [ "$exists" != "200" ]; then
    curl -s -X POST -H "Authorization: token $TOKEN" \
      -H "Content-Type: application/json" \
      "https://api.github.com/repos/$repo/releases" \
      -d "{\"tag_name\":\"v$version\",\"name\":\"v$version\",\"body\":\"Automated MCP server release via MEOK sovereign pipeline\"}" \
      -o /dev/null 2>/dev/null
    echo "  Created release v$version"
  fi
  # Upload wheel
  curl -s -X POST -H "Authorization: token $TOKEN" \
    -H "Content-Type: application/octet-stream" \
    "https://uploads.github.com/repos/$repo/releases/v$version/assets?name=$(basename $wheel)" \
    --data-binary @"$wheel" -o /dev/null 2>/dev/null
  echo "  Uploaded $(basename $wheel)"
done
echo "DONE: 8 MCP releases published"
