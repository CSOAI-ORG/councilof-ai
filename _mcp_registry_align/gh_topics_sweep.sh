#!/bin/zsh
# Additive GitHub topics sweep for AEO/discovery across all CSOAI-ORG MCP repos. Topics only (zero-risk).
repos=$(gh repo list CSOAI-ORG --limit 1000 --json name --jq '.[].name' 2>/dev/null | grep -- '-mcp$')
n=0; ok=0
for r in ${(f)repos}; do
  n=$((n+1))
  base="--add-topic mcp --add-topic model-context-protocol --add-topic claude --add-topic ai-agents --add-topic meok-ai-labs"
  extra=""
  case "$r" in
    *eu-ai-act*|*dora*|*nis2*|*cra*|*gdpr*|*iso-*|*soc2*|*nist*|*compliance*|*governance*|*hipaa*|*pci*|*aml*|*mifid*|*basel*|*aida*|*fria*|*omnibus*|*regulat*|*incident*|*audit*|*risk*) extra="--add-topic compliance --add-topic regtech --add-topic ai-governance" ;;
    *watermark*|*c2pa*|*deepfake*|*provenance*) extra="--add-topic c2pa --add-topic ai-safety" ;;
    *x402*|*acp*|*ap2*|*payment*|*commerce*|*stripe*|*coinbase*) extra="--add-topic agent-payments --add-topic x402" ;;
    *security*|*scam*|*injection*|*mitre*|*cisa*|*sbom*|*sigstore*|*slsa*) extra="--add-topic security --add-topic ai-security" ;;
  esac
  if gh repo edit "CSOAI-ORG/$r" ${=base} ${=extra} >/dev/null 2>&1; then ok=$((ok+1)); fi
done
echo "TOPICS SWEEP DONE — tagged $ok/$n MCP repos"
