#!/bin/zsh
# Combined Phase 1 (align 72 GAP-A+compliance) + Phase 2 (publish 30 GAP-B rails).
# Token passed via $MEOK_TOK (captured in a working/keyring-unlocked context) — no gh call inside.
ALIGN=$HOME/clawd/_mcp_registry_align
STAGE=$ALIGN/stage; RES=$ALIGN/results; MKT=$HOME/clawd/mcp-marketplace
SCHEMA="https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json"
TOK="$MEOK_TOK"
mkdir -p "$STAGE" "$RES"; rm -f "$RES"/*

GAPA=(agent-commerce-protocol-mcp agent-content-watermark-mcp agent-cost-allocator-mcp agent-incident-relay-mcp agent-mcp-router-mcp agent-replay-debugger-mcp agent-token-budget-mcp aml-ai-mcp basel-ai-overlay-mcp chas-elite-prep-mcp cobol-bridge-mcp concrete-pump-cpa-mcp crane-hire-cpcs-mcp credential-manager-mcp fda-samd-mcp fsa-food-safety-mcp meok-eu-ai-act-art-13-ifu-mcp meok-eu-ai-act-art-26-fria-mcp mica-crypto-mcp mifid-ii-ai-mcp mitre-atlas-mcp nrswa-ai-mcp stock-analyzer-ai-mcp string-utils-ai-mcp subscription-tracker-ai-mcp summarizer-ai-mcp supply-chain-mcp survey-builder-ai-mcp tax-calculator-ai-mcp test-case-generator-ai-mcp text-stats-ai-mcp time-tracker-ai-mcp tone-rewriter-ai-mcp translation-ai-mcp translator-pro-ai-mcp trust-chain-mcp uk-ai-act-mcp unit-converter-ai-mcp url-ai-mcp uuid-ai-mcp validator-ai-mcp vector-knowledge-graph-mcp video-editing-ai-mcp voice-audio-mcp weather-ai-mcp web-research-mcp webhook-ai-mcp workout-planner-ai-mcp writing-assistant-ai-mcp yaml-ai-mcp)
COMP=(meok-governance-engine-mcp meok-fria-generator-mcp ai-incident-reporting-mcp ai-self-audit-mcp soc2-compliance-ai-mcp iso-42001-ai-mcp iso-27001-ai-mcp gdpr-compliance-ai-mcp nist-rmf-ai-mcp canada-aida-ai-mcp healthcare-ai-governance-mcp explainability-report-mcp llm-compliance-comparison-mcp a2a-governance-bridge-mcp mdr-medical-device-mcp risk-assessment-ai-mcp dataprivacy-ai-mcp regulatory-webhook-mcp drone-airspace-governance-mcp patient-safety-ai-mcp scam-detector-mcp deepfake-detector-mcp security-scanner-ai-mcp)
GAPB=(agent-x402-paywall-mcp bft-progress-council-mcp care-home-cqc-mcp cisa-kev-mcp coppa-ferpa-mcp eudi-wallet-mcp iso-42005-impact-mcp korea-ai-basic-act-mcp mcp-spec-compliance-mcp meok-aaif-agent-card-mcp meok-abci-bridge-mcp meok-agents-md-lint-mcp meok-ap2-mandate-mcp meok-c2pa-durable-mcp meok-coinbase-x402-receipt-mcp meok-cra-art14-reporter-mcp meok-eu-aia-art-9-rms-mcp meok-eu-aigc-icon-mcp meok-libp2p-agent-mesh-mcp meok-mcp-cardgen-mcp meok-mcp-hardening-mcp meok-mcp-test-mcp meok-nis2-nl-register-mcp meok-stripe-acp-checkout-mcp meok-w3c-tdm-rights-mcp meok-x402-wrap-mcp mitre-attack-mcp oasf-agent-directory-mcp sigstore-cosign-mcp slsa-supply-chain-mcp)

stage_from_pypi(){ python3 - "$1" "$STAGE" "$SCHEMA" <<'PY'
import sys,urllib.request,json,os
pkg,stage,schema=sys.argv[1],sys.argv[2],sys.argv[3]
try: d=json.loads(urllib.request.urlopen(f"https://pypi.org/pypi/{pkg}/json",timeout=12).read())
except Exception: print("NOPYPI"); sys.exit(0)
ver=d["info"]["version"]; desc=(d["info"].get("summary") or f"{pkg} by MEOK AI Labs").strip()[:100]
os.makedirs(f"{stage}/{pkg}",exist_ok=True)
json.dump({"$schema":schema,"name":f"io.github.CSOAI-ORG/{pkg}","description":desc,"version":ver,"packages":[{"registryType":"pypi","identifier":pkg,"version":ver,"transport":{"type":"stdio"}}]},open(f"{stage}/{pkg}/server.json","w"),indent=2)
print(ver)
PY
}
add_name(){ local d="$MKT/$1" line="mcp-name: io.github.CSOAI-ORG/$1" rm
  rm="$d/README.md"
  if [ -f "$rm" ] && grep -q "^mcp-name:" "$rm"; then sed -i '' "s|^mcp-name:.*|$line|" "$rm"
  else printf "%s\n\n%s" "$line" "$(cat "$rm" 2>/dev/null)" > "$rm"; fi }
republish_pypi(){ local d="$MKT/$1"; [ ! -d "$d" ] && return 1
  add_name "$1"
  local cur=$(python3 -c "import urllib.request,json;print(json.loads(urllib.request.urlopen('https://pypi.org/pypi/$1/json',timeout=8).read())['info']['version'])" 2>/dev/null)
  [ -z "$cur" ] && return 1
  local maj=${cur%%.*} r=${cur#*.}; local min=${r%%.*} pat=${r#*.} nv="$maj.$min.$((pat+1))"
  local ol=$(grep '^version' "$d/pyproject.toml"|head -1|sed 's/.*"\(.*\)"/\1/')
  sed -i '' "s/version = \"$ol\"/version = \"$nv\"/" "$d/pyproject.toml"
  cd "$d" && rm -rf dist build && python3 -m build --sdist --wheel >/dev/null 2>&1 && python3 -m twine upload dist/* --non-interactive >/dev/null 2>&1 }
firstpub(){ local d="$MKT/$1"; [ ! -d "$d" ] && return 1
  add_name "$1"
  cd "$d" && rm -rf dist build
  python3 -m build --sdist --wheel >/dev/null 2>&1 && python3 -m twine upload dist/* --non-interactive >/dev/null 2>&1 || return 1
  local ver=$(grep '^version' "$d/pyproject.toml"|head -1|sed 's/.*"\(.*\)"/\1/')
  local desc=$(grep -m1 '^description' "$d/pyproject.toml"|sed 's/.*"\(.*\)"/\1/'); [ -z "$desc" ] && desc="$1 by MEOK AI Labs"
  mkdir -p "$STAGE/$1"
  python3 -c "import json;dd='''$desc'''.strip()[:100];json.dump({'\$schema':'$SCHEMA','name':'io.github.CSOAI-ORG/$1','description':dd,'version':'$ver','packages':[{'registryType':'pypi','identifier':'$1','version':'$ver','transport':{'type':'stdio'}}]},open('$STAGE/$1/server.json','w'),indent=2)" }
auth(){ mcp-publisher login github -token "$TOK" >/dev/null 2>&1; }
pub(){ local p=$1; cd "$STAGE/$p" 2>/dev/null||{ echo NODIR>"$RES/$p";return;}
  local o=$(mcp-publisher publish 2>&1)
  if echo "$o"|grep -qi "successfully\|published successfully\|already exists\|409"; then echo OK>"$RES/$p"
  elif echo "$o"|grep -qi "mcp-name"; then echo NEEDNAME>"$RES/$p"
  else echo "FAIL $(echo "$o"|grep -oiE 'status [0-9]+'|head -1)">"$RES/$p"; fi }
parpub(){ for p in $@; do [ -f "$STAGE/$p/server.json" ] && { pub "$p" & while (( $(jobs -r|wc -l)>=8 )); do sleep .15; done; }; done; wait; }

echo "=== PHASE 1: stage $#GAPA GAP-A + $#COMP compliance ==="
for p in $GAPA $COMP; do stage_from_pypi "$p" >/dev/null; done
auth; echo "round1 publish..."; parpub $GAPA $COMP
need=(); for p in $GAPA $COMP; do [[ "$(cat $RES/$p 2>/dev/null)" == NEEDNAME ]] && need+=$p; done
echo "round1 NEEDNAME: $#need -> readme-fix + republish + restage"
for p in $need; do republish_pypi "$p" && stage_from_pypi "$p" >/dev/null; done
auth; echo "round2 publish..."; parpub $need

echo "=== PHASE 2: first-publish $#GAPB GAP-B rails ==="
for p in $GAPB; do firstpub "$p" && echo "  built $p" || echo "  BUILDFAIL $p"; done
sleep 25
auth; echo "register GAP-B..."; parpub $GAPB
needb=(); for p in $GAPB; do [[ "$(cat $RES/$p 2>/dev/null)" == NEEDNAME ]] && needb+=$p; done
[ $#needb -gt 0 ] && { echo "GAP-B NEEDNAME retry: $#needb"; sleep 15; auth; parpub $needb; }

echo ""; echo "=== FINAL REPORT ==="
ok=0; nn=0; fl=0
for p in $GAPA $COMP $GAPB; do r=$(cat "$RES/$p" 2>/dev/null); case "$r" in OK) ok=$((ok+1));; NEEDNAME) nn=$((nn+1)); echo "  needname: $p";; *) fl=$((fl+1)); echo "  fail: $p ($r)";; esac; done
echo ""; echo "REGISTRY ALIGN COMPLETE — OK=$ok needname=$nn fail=$fl of $(( $#GAPA + $#COMP + $#GAPB ))"
