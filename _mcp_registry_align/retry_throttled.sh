#!/bin/zsh
# Throttled, backoff-aware mop-up for PyPI 429. Cools down, then re-uploads slowly.
# Idempotent. Token via $MEOK_TOK. Prioritises GAP-B rails, then NEEDNAME tail.
ALIGN=$HOME/clawd/_mcp_registry_align
STAGE=$ALIGN/stage; MKT=$HOME/clawd/mcp-marketplace
SCHEMA="https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json"
TOK="$MEOK_TOK"
OUT=$ALIGN/retry.out

COOLDOWN=${COOLDOWN:-1200}
echo "cooldown ${COOLDOWN}s for PyPI 429 to reset..." ; sleep $COOLDOWN

# GAP-B first (monetization rails), then NEEDNAME tail
GAPB=(meok-x402-wrap-mcp agent-x402-paywall-mcp meok-stripe-acp-checkout-mcp meok-coinbase-x402-receipt-mcp meok-ap2-mandate-mcp meok-abci-bridge-mcp meok-libp2p-agent-mesh-mcp meok-aaif-agent-card-mcp oasf-agent-directory-mcp sigstore-cosign-mcp slsa-supply-chain-mcp meok-c2pa-durable-mcp meok-cra-art14-reporter-mcp meok-eu-aia-art-9-rms-mcp meok-eu-aigc-icon-mcp meok-w3c-tdm-rights-mcp meok-nis2-nl-register-mcp meok-mcp-hardening-mcp meok-mcp-cardgen-mcp meok-mcp-test-mcp meok-agents-md-lint-mcp mcp-spec-compliance-mcp iso-42005-impact-mcp korea-ai-basic-act-mcp coppa-ferpa-mcp eudi-wallet-mcp cisa-kev-mcp mitre-attack-mcp bft-progress-council-mcp care-home-cqc-mcp)
NEEDNAME=(credential-manager-mcp trust-chain-mcp supply-chain-mcp uk-ai-act-mcp dataprivacy-ai-mcp llm-compliance-comparison-mcp deepfake-detector-mcp vector-knowledge-graph-mcp web-research-mcp stock-analyzer-ai-mcp subscription-tracker-ai-mcp survey-builder-ai-mcp translator-pro-ai-mcp video-editing-ai-mcp voice-audio-mcp webhook-ai-mcp workout-planner-ai-mcp writing-assistant-ai-mcp summarizer-ai-mcp tax-calculator-ai-mcp test-case-generator-ai-mcp text-stats-ai-mcp time-tracker-ai-mcp tone-rewriter-ai-mcp translation-ai-mcp unit-converter-ai-mcp url-ai-mcp uuid-ai-mcp validator-ai-mcp weather-ai-mcp yaml-ai-mcp string-utils-ai-mcp)

add_name(){ local d="$MKT/$1" line="mcp-name: io.github.CSOAI-ORG/$1" rm="$MKT/$1/README.md"
  if [ -f "$rm" ] && grep -q "^mcp-name:" "$rm"; then sed -i '' "s|^mcp-name:.*|$line|" "$rm"
  else printf "%s\n\n%s" "$line" "$(cat "$rm" 2>/dev/null)" > "$rm"; fi }
# upload with backoff on 429; spacing between every upload to stay under throttle
upload_bo(){ local d=$1 t=0
  while (( t<5 )); do
    o=$(cd "$d" && python3 -m twine upload dist/* --non-interactive 2>&1)
    echo "$o" | grep -qi "429\|too many" && { t=$((t+1)); echo "  429 backoff $((t*60))s ($1)"; sleep $((t*60)); continue; }
    echo "$o" | grep -qi "already exists\|view at\|uploading" && return 0
    return 1
  done; return 1 }
stage_pypi(){ python3 - "$1" "$STAGE" "$SCHEMA" <<'PY'
import sys,urllib.request,json,os
pkg,stage,schema=sys.argv[1:4]
try: d=json.loads(urllib.request.urlopen(f"https://pypi.org/pypi/{pkg}/json",timeout=12).read())
except Exception: print("NOPYPI"); sys.exit(0)
ver=d["info"]["version"]; desc=(d["info"].get("summary") or pkg).strip()[:100]
os.makedirs(f"{stage}/{pkg}",exist_ok=True)
json.dump({"$schema":schema,"name":f"io.github.CSOAI-ORG/{pkg}","description":desc,"version":ver,"packages":[{"registryType":"pypi","identifier":pkg,"version":ver,"transport":{"type":"stdio"}}]},open(f"{stage}/{pkg}/server.json","w"),indent=2)
print(ver)
PY
}

echo "=== UPLOAD PHASE (throttled, 15s spacing) ==="
for p in $GAPB $NEEDNAME; do
  d="$MKT/$p"; [ ! -d "$d" ] && { echo "$p NODIR"; continue; }
  add_name "$p"
  # bump only for already-published (NEEDNAME); GAP-B publish at local version
  if python3 -c "import urllib.request;urllib.request.urlopen('https://pypi.org/pypi/$p/json',timeout=8)" 2>/dev/null; then
    cur=$(python3 -c "import urllib.request,json;print(json.loads(urllib.request.urlopen('https://pypi.org/pypi/$p/json',timeout=8).read())['info']['version'])")
    maj=${cur%%.*} r=${cur#*.}; min=${r%%.*} pat=${r#*.} nv="$maj.$min.$((pat+1))"
    ol=$(grep '^version' "$d/pyproject.toml"|head -1|sed 's/.*"\(.*\)"/\1/'); sed -i '' "s/version = \"$ol\"/version = \"$nv\"/" "$d/pyproject.toml"
  fi
  cd "$d" && rm -rf dist build && python3 -m build --sdist --wheel >/dev/null 2>&1
  upload_bo "$d" && echo "  uploaded $p" || echo "  UPLOAD-FAIL $p"
  sleep 15
done

echo "=== wait for PyPI index, then REGISTER all ==="
sleep 45
mcp-publisher login github -token "$TOK" >/dev/null 2>&1
ok=0; fail=0
for p in $GAPB $NEEDNAME; do
  stage_pypi "$p" >/dev/null
  [ -f "$STAGE/$p/server.json" ] || { fail=$((fail+1)); continue; }
  o=$(cd "$STAGE/$p" && mcp-publisher publish 2>&1)
  echo "$o"|grep -qi "successfully\|already exists" && { ok=$((ok+1)); } || { fail=$((fail+1)); echo "  reg-fail $p"; }
done
echo ""
echo "RETRY MOP-UP COMPLETE — registered OK=$ok  fail=$fail of $(( $#GAPB + $#NEEDNAME ))"
