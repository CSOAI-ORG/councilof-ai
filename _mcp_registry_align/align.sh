#!/bin/zsh
# Idempotent, crash-safe registry alignment. Persistent staging under ~/clawd.
ALIGN=$HOME/clawd/_mcp_registry_align
STAGE=$ALIGN/stage; RES=$ALIGN/results
MKT=$HOME/clawd/mcp-marketplace
SCHEMA="https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json"
mkdir -p "$STAGE" "$RES"; rm -f "$RES"/*

# 50 GAP-A (incl cobol) + 22 compliance cluster
TARGETS=(agent-commerce-protocol-mcp agent-content-watermark-mcp agent-cost-allocator-mcp agent-incident-relay-mcp agent-mcp-router-mcp agent-replay-debugger-mcp agent-token-budget-mcp aml-ai-mcp basel-ai-overlay-mcp chas-elite-prep-mcp cobol-bridge-mcp concrete-pump-cpa-mcp crane-hire-cpcs-mcp credential-manager-mcp fda-samd-mcp fsa-food-safety-mcp meok-eu-ai-act-art-13-ifu-mcp meok-eu-ai-act-art-26-fria-mcp mica-crypto-mcp mifid-ii-ai-mcp mitre-atlas-mcp nrswa-ai-mcp stock-analyzer-ai-mcp string-utils-ai-mcp subscription-tracker-ai-mcp summarizer-ai-mcp supply-chain-mcp survey-builder-ai-mcp tax-calculator-ai-mcp test-case-generator-ai-mcp text-stats-ai-mcp time-tracker-ai-mcp tone-rewriter-ai-mcp translation-ai-mcp translator-pro-ai-mcp trust-chain-mcp uk-ai-act-mcp unit-converter-ai-mcp url-ai-mcp uuid-ai-mcp validator-ai-mcp vector-knowledge-graph-mcp video-editing-ai-mcp voice-audio-mcp weather-ai-mcp web-research-mcp webhook-ai-mcp workout-planner-ai-mcp writing-assistant-ai-mcp yaml-ai-mcp meok-governance-engine-mcp meok-fria-generator-mcp ai-incident-reporting-mcp ai-self-audit-mcp soc2-compliance-ai-mcp iso-42001-ai-mcp iso-27001-ai-mcp gdpr-compliance-ai-mcp nist-rmf-ai-mcp canada-aida-ai-mcp healthcare-ai-governance-mcp explainability-report-mcp llm-compliance-comparison-mcp a2a-governance-bridge-mcp mdr-medical-device-mcp risk-assessment-ai-mcp dataprivacy-ai-mcp regulatory-webhook-mcp drone-airspace-governance-mcp patient-safety-ai-mcp scam-detector-mcp deepfake-detector-mcp security-scanner-ai-mcp)

stage_one(){
  python3 - "$1" "$STAGE" "$SCHEMA" <<'PY'
import sys,urllib.request,json,os
pkg,stage,schema=sys.argv[1],sys.argv[2],sys.argv[3]
try: d=json.loads(urllib.request.urlopen(f"https://pypi.org/pypi/{pkg}/json",timeout=10).read())
except Exception: print("NOPYPI"); sys.exit(0)
ver=d["info"]["version"]; desc=(d["info"].get("summary") or f"{pkg} by MEOK AI Labs").strip()[:100]
os.makedirs(f"{stage}/{pkg}",exist_ok=True)
json.dump({"$schema":schema,"name":f"io.github.CSOAI-ORG/{pkg}","description":desc,"version":ver,
 "packages":[{"registryType":"pypi","identifier":pkg,"version":ver,"transport":{"type":"stdio"}}]},
 open(f"{stage}/{pkg}/server.json","w"),indent=2)
print(ver)
PY
}
readme_fix(){
  local pkg=$1 dir="$MKT/$1"; [ ! -d "$dir" ] && return 1
  local rm="$dir/README.md" line="mcp-name: io.github.CSOAI-ORG/$pkg"
  if [ -f "$rm" ] && grep -q "^mcp-name:" "$rm"; then sed -i '' "s|^mcp-name:.*|$line|" "$rm"
  else printf "%s\n\n%s" "$line" "$(cat "$rm" 2>/dev/null)" > "$rm"; fi
  local cur=$(python3 -c "import urllib.request,json;print(json.loads(urllib.request.urlopen('https://pypi.org/pypi/$pkg/json',timeout=8).read())['info']['version'])" 2>/dev/null)
  [ -z "$cur" ] && return 1
  local maj=${cur%%.*} r=${cur#*.}; local min=${r%%.*} pat=${r#*.} nv="$maj.$min.$((pat+1))"
  local ol=$(grep '^version' "$dir/pyproject.toml"|head -1|sed 's/.*"\(.*\)"/\1/')
  sed -i '' "s/version = \"$ol\"/version = \"$nv\"/" "$dir/pyproject.toml"
  cd "$dir" && rm -rf dist build
  python3 -m build --sdist --wheel >/dev/null 2>&1 && python3 -m twine upload dist/* --non-interactive >/dev/null 2>&1
}
auth(){ mcp-publisher login github -token "$(gh auth token)" >/dev/null 2>&1; }
pub(){
  local p=$1; cd "$STAGE/$p" 2>/dev/null || { echo NODIR>"$RES/$p"; return; }
  local o=$(mcp-publisher publish 2>&1)
  if echo "$o"|grep -qi "successfully\|published successfully"; then echo OK>"$RES/$p"
  elif echo "$o"|grep -qi "already exists\|409\|conflict"; then echo OK>"$RES/$p"
  elif echo "$o"|grep -qi "mcp-name"; then echo NEEDNAME>"$RES/$p"
  else echo "FAIL $(echo "$o"|grep -oiE 'status [0-9]+'|head -1)">"$RES/$p"; fi
}
echo "=== STAGE $#TARGETS ==="; for p in $TARGETS; do stage_one "$p" >/dev/null; done
echo "=== ROUND 1 publish ==="; auth
for p in $TARGETS; do [ -f "$STAGE/$p/server.json" ] && { pub "$p" & while (( $(jobs -r|wc -l)>=8 )); do sleep .15; done; }; done; wait
need=(); for p in $TARGETS; do [[ "$(cat $RES/$p 2>/dev/null)" == NEEDNAME ]] && need+=$p; done
echo "Round1 NEEDNAME: $#need -> readme-fix + republish"
for p in $need; do readme_fix "$p" && stage_one "$p" >/dev/null; done
echo "=== ROUND 2 publish ==="; auth
for p in $need; do [ -f "$STAGE/$p/server.json" ] && { pub "$p" & while (( $(jobs -r|wc -l)>=8 )); do sleep .15; done; }; done; wait
ok=0; nn=0; fl=0
for p in $TARGETS; do r=$(cat "$RES/$p" 2>/dev/null); case "$r" in OK) ok=$((ok+1));; NEEDNAME) nn=$((nn+1)); echo "  still-needname: $p";; *) fl=$((fl+1)); echo "  fail: $p ($r)";; esac; done
echo ""
echo "FINAL OK=$ok needname=$nn fail=$fl of $#TARGETS"
