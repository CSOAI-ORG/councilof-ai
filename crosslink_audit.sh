#!/bin/bash
# Cross-link audit: Check 15 random multi-URL deployments for live neighbour/sister-hive links.
# Uses curl -s -m 3 for quick HTTP checks. Flags broken links (non-200).

set -euo pipefail

CENSUS="$HOME/clawd/deploy-census-17jun.csv"
REPORT="$HOME/clawd/crosslink-audit-17jun.json"

# 15 deployments with multiple URLs (neighbour/sister-hive links) — picked from census
# These all have pipe-separated URLs in the live_url field
DEPLOYS=(
  "accountabilityof-deploy"
  "agisafe-deploy"
  "annual-report-deploy"
  "asisecurity-deploy"
  "biasdetectionof-deploy"
  "dataprivacyof-deploy"
  "ethicalgovernanceof-deploy"
  "fishkeeper-deploy"
  "haulage-deploy"
  "koikeeper-deploy"
  "landlaw-deploy"
  "loopfactory-deploy"
  "optimobile-deploy"
  "safetyof-deploy"
  "transparencyof-deploy"
)

echo "=== Cross-Link Audit: $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "Checking ${#DEPLOYS[@]} deployments for live neighbour/sister-hive links..."
echo ""

# Initialize JSON report
json_output='{"audit_time":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","total_checked":0,"total_links_checked":0,"broken_links":0,"results":[]}'

TOTAL_LINKS=0
BROKEN=0
RESULTS_JSON=""

for deploy in "${DEPLOYS[@]}"; do
  # Get URLs from census (line with the deploy name)
  line=$(grep "^${deploy}," "$CENSUS" 2>/dev/null || true)
  if [ -z "$line" ]; then
    echo "  ${deploy}: NOT FOUND in census"
    continue
  fi
  
  # Extract live_url field (3rd field)
  urls_field=$(echo "$line" | cut -d',' -f3)
  
  # Skip if no URLs (none/no_index)
  if [ "$urls_field" = "none" ] || [ -z "$urls_field" ]; then
    echo "  ${deploy}: no live URLs (${urls_field})"
    continue
  fi
  
  # Split by pipe
  IFS='|' read -ra URLS <<< "$urls_field"
  
  echo "  ${deploy} (${#URLS[@]} URLs):"
  
  deploy_json="{\"deploy\":\"${deploy}\",\"url_count\":${#URLS[@]},\"urls\":[]}"
  url_entries=""
  deploy_broken=0
  
  for url in "${URLS[@]}"; do
    url=$(echo "$url" | xargs)  # trim whitespace
    TOTAL_LINKS=$((TOTAL_LINKS + 1))
    
    # Quick HTTP check: just get status code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 3 -L "$url" 2>/dev/null || echo "000")
    
    if [ "$http_code" = "200" ]; then
      status="OK"
      icon="✅"
    elif [ "$http_code" = "301" ] || [ "$http_code" = "302" ] || [ "$http_code" = "307" ] || [ "$http_code" = "308" ]; then
      status="REDIRECT"
      icon="↪️ "
    elif [ "$http_code" = "000" ]; then
      status="TIMEOUT/CONN_FAIL"
      icon="❌"
      BROKEN=$((BROKEN + 1))
      deploy_broken=$((deploy_broken + 1))
    else
      status="HTTP_${http_code}"
      icon="⚠️ "
      if [ "$http_code" != "200" ]; then
        BROKEN=$((BROKEN + 1))
        deploy_broken=$((deploy_broken + 1))
      fi
    fi
    
    echo "    ${icon} ${url} -> ${http_code} (${status})"
    
    # JSON entry for this URL
    if [ -n "$url_entries" ]; then url_entries+=","; fi
    url_entries+="{\"url\":\"${url}\",\"http_code\":\"${http_code}\",\"status\":\"${status}\"}"
  done
  
  deploy_json=$(echo "$deploy_json" | sed "s|\"urls\":\[\]|\"urls\":[${url_entries}]|")
  deploy_json=$(echo "$deploy_json" | sed "s/}$/,\"broken\":${deploy_broken}}/")
  
  if [ -n "$RESULTS_JSON" ]; then RESULTS_JSON+=","; fi
  RESULTS_JSON+="$deploy_json"
done

echo ""
echo "=== SUMMARY ==="
echo "  Deployments checked: ${#DEPLOYS[@]}"
echo "  Total links checked: $TOTAL_LINKS"
echo "  Broken/non-200 links: $BROKEN"
echo "  Healthy links: $((TOTAL_LINKS - BROKEN))"

# Write JSON report
full_json='{"audit_time":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","total_checked":'"${#DEPLOYS[@]}"',"total_links_checked":'"$TOTAL_LINKS"',"broken_links":'"$BROKEN"',"results":['"$RESULTS_JSON"']}'
echo "$full_json" | python3 -m json.tool > "$REPORT" 2>/dev/null || echo "$full_json" > "$REPORT"
echo ""
echo "Report saved: $REPORT"
