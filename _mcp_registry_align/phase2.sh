#!/bin/zsh
# Phase 2: first-publish 30 GAP-B rails to PyPI + register. Self-gates behind Phase 1 (align.sh).
ALIGN=$HOME/clawd/_mcp_registry_align
STAGE=$ALIGN/stage2; RB=$ALIGN/res_build; RR=$ALIGN/res_reg
MKT=$HOME/clawd/mcp-marketplace
SCHEMA="https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json"
mkdir -p "$STAGE" "$RB" "$RR"; rm -f "$RB"/* "$RR"/*
GAPB=(agent-x402-paywall-mcp bft-progress-council-mcp care-home-cqc-mcp cisa-kev-mcp coppa-ferpa-mcp eudi-wallet-mcp iso-42005-impact-mcp korea-ai-basic-act-mcp mcp-spec-compliance-mcp meok-aaif-agent-card-mcp meok-abci-bridge-mcp meok-agents-md-lint-mcp meok-ap2-mandate-mcp meok-c2pa-durable-mcp meok-coinbase-x402-receipt-mcp meok-cra-art14-reporter-mcp meok-eu-aia-art-9-rms-mcp meok-eu-aigc-icon-mcp meok-libp2p-agent-mesh-mcp meok-mcp-cardgen-mcp meok-mcp-hardening-mcp meok-mcp-test-mcp meok-nis2-nl-register-mcp meok-stripe-acp-checkout-mcp meok-w3c-tdm-rights-mcp meok-x402-wrap-mcp mitre-attack-mcp oasf-agent-directory-mcp sigstore-cosign-mcp slsa-supply-chain-mcp)

echo "=== GATE: wait for Phase 1 (align.sh) ==="
for i in {1..200}; do pgrep -f "align.sh" >/dev/null 2>&1 || break; sleep 5; done
echo "Phase 1 clear -> Phase 2 begins"

echo "=== BUILD + FIRST-PUBLISH 30 GAP-B to PyPI (with mcp-name) ==="
for p in $GAPB; do
  d="$MKT/$p"; [ ! -d "$d" ] && { echo NODIR>"$RB/$p"; continue; }
  rmf="$d/README.md"; line="mcp-name: io.github.CSOAI-ORG/$p"
  if [ -f "$rmf" ] && grep -q "^mcp-name:" "$rmf"; then sed -i '' "s|^mcp-name:.*|$line|" "$rmf"
  else printf "%s\n\n%s" "$line" "$(cat "$rmf" 2>/dev/null)" > "$rmf"; fi
  cd "$d" && rm -rf dist build
  if python3 -m build --sdist --wheel >/dev/null 2>&1 && python3 -m twine upload dist/* --non-interactive >/dev/null 2>&1; then
    ver=$(grep '^version' "$d/pyproject.toml"|head -1|sed 's/.*"\(.*\)"/\1/')
    desc=$(grep -m1 '^description' "$d/pyproject.toml"|sed 's/.*"\(.*\)"/\1/'); [ -z "$desc" ] && desc="$p by MEOK AI Labs"
    mkdir -p "$STAGE/$p"
    python3 -c "import json;d='''$desc'''.strip()[:100];json.dump({'\$schema':'$SCHEMA','name':'io.github.CSOAI-ORG/$p','description':d,'version':'$ver','packages':[{'registryType':'pypi','identifier':'$p','version':'$ver','transport':{'type':'stdio'}}]},open('$STAGE/$p/server.json','w'),indent=2)"
    echo "OK v$ver">"$RB/$p"
  else echo BUILDFAIL>"$RB/$p"; fi
done

echo "=== wait for PyPI index, then REGISTER ==="
sleep 25
mcp-publisher login github -token "$(gh auth token)" >/dev/null 2>&1
for p in $GAPB; do
  [ -f "$STAGE/$p/server.json" ] || { echo SKIP>"$RR/$p"; continue; }
  cd "$STAGE/$p"; o=$(mcp-publisher publish 2>&1)
  if echo "$o"|grep -qi "successfully\|published successfully\|already exists"; then echo OK>"$RR/$p"
  elif echo "$o"|grep -qi "mcp-name"; then echo NEEDNAME>"$RR/$p"
  else echo "FAIL $(echo "$o"|grep -oiE 'status [0-9]+'|head -1)">"$RR/$p"; fi
done

echo ""; echo "=== PHASE 2 RESULT ==="
bok=0; rok=0
printf "%-38s %-10s %s\n" "PACKAGE" "BUILD" "REGISTRY"
for p in $GAPB; do
  b=$(cat "$RB/$p" 2>/dev/null); r=$(cat "$RR/$p" 2>/dev/null)
  printf "%-38s %-10s %s\n" "$p" "$b" "$r"
  [[ "$b" == OK* ]] && bok=$((bok+1)); [[ "$r" == OK ]] && rok=$((rok+1))
done
echo ""; echo "PHASE 2 DONE — built+published to PyPI: $bok/30   registered: $rok/30"
