#!/usr/bin/env bash
# mass_mcp_distribute.sh — turn the public MCP catalogue into a conversion + distribution engine.
#
# What it does, per repo:
#   1. Adds a tasteful conversion banner to the README (idempotent — skips if already present)
#      → every install funnels to the £29 office hour + the platform.
#   2. (--publish) If the repo has a valid server.json, publishes it to the Official MCP Registry
#      (which propagates to PulseMCP + the ecosystem). Requires `mcp-publisher login github` first.
#
# Glama already auto-indexes every public repo for free — this adds the CONVERSION + the registry.
#
# Usage:
#   ./mass_mcp_distribute.sh              # banner the CURATED flagships (recommended — no spam)
#   ./mass_mcp_distribute.sh --all        # banner EVERY public *-mcp repo (218; spam risk — your call)
#   ./mass_mcp_distribute.sh --publish    # also publish server.json repos to the Official Registry
#   ./mass_mcp_distribute.sh --dry-run    # show what it would do, change nothing
#
# Runs locally via the gh CLI (authed as CSOAI-ORG). Cheap, fast, idempotent. Honest: review the
# diff on a couple of repos before unleashing --all.
set -uo pipefail
ORG=CSOAI-ORG
DRY=0; ALL=0; PUBLISH=0
for a in "$@"; do case "$a" in --dry-run) DRY=1;; --all) ALL=1;; --publish) PUBLISH=1;; esac; done

# Curated high-intent flagships (buyer intent: compliance / governance / law). Edit freely.
CURATED="eu-ai-act-compliance-mcp gdpr-compliance-ai-mcp iso-27001-ai-mcp iso-42001-ai-mcp
soc2-compliance-ai-mcp hipaa-compliance-ai-mcp nist-ai-rmf-mcp dora-nis2-crosswalk-mcp
csoai-governance-crosswalk-mcp proofof-ai-mcp watermarking-authenticity-mcp coppa-ferpa-mcp
mitre-attack-mcp meok-law-mcp ai-incident-reporting-mcp"

BANNER='> **⚖️ Built by [MEOK AI Labs](https://meok.ai) / [CSOAI](https://csoai.org).** Need this applied to _your_ system fast? Book a 30-min Founder Office Hour (£29) → **https://meok.ai/work** · Full governance platform → **https://meok.ai**'

# pick the repo set
if [ "$ALL" = 1 ]; then
  REPOS=$(gh repo list "$ORG" --visibility public --limit 400 --json name -q '.[].name' | grep -iE '\-mcp$|\-mcp-')
else
  REPOS="$CURATED"
fi

n=0; bannered=0; published=0; skipped=0
for r in $REPOS; do
  r=$(echo "$r" | tr -d ' '); [ -z "$r" ] && continue; n=$((n+1))
  # fetch README + sha
  rd=$(gh api "repos/$ORG/$r/contents/README.md" --jq '.content' 2>/dev/null | base64 -d 2>/dev/null)
  sha=$(gh api "repos/$ORG/$r/contents/README.md" --jq '.sha' 2>/dev/null)
  if [ -z "$rd" ] || [ -z "$sha" ]; then echo "  ?? $r — no README"; skipped=$((skipped+1)); continue; fi
  if echo "$rd" | grep -q "meok.ai/work"; then echo "  ✓  $r — banner already present"; skipped=$((skipped+1)); continue; fi
  # insert banner after the first line (H1)
  newrd=$(printf '%s\n' "$rd" | awk -v b="$BANNER" 'NR==1{print; print ""; print b; next} {print}')
  if [ "$DRY" = 1 ]; then echo "  → $r — WOULD add banner"; continue; fi
  payload=$(python3 -c "import json,base64,sys;print(json.dumps({'message':'docs: conversion banner (office hour + platform)','content':base64.b64encode(sys.stdin.buffer.read()).decode(),'sha':'$sha'}))" <<<"$newrd")
  if echo "$payload" | gh api -X PUT "repos/$ORG/$r/contents/README.md" --input - >/dev/null 2>&1; then
    echo "  ✅ $r — bannered"; bannered=$((bannered+1))
  else echo "  ✗  $r — commit failed"; fi
  # optional: publish to Official Registry if server.json present
  if [ "$PUBLISH" = 1 ]; then
    if gh api "repos/$ORG/$r/contents/server.json" --jq '.sha' >/dev/null 2>&1; then
      tmp=$(mktemp -d); gh api "repos/$ORG/$r/contents/server.json" --jq '.content' | base64 -d > "$tmp/server.json"
      (cd "$tmp" && mcp-publisher publish >/dev/null 2>&1) && { echo "     ↳ published to Official Registry"; published=$((published+1)); }
      rm -rf "$tmp"
    fi
  fi
done
echo "---"
echo "repos: $n · bannered: $bannered · published: $published · skipped(existing/none): $skipped"
echo "Glama auto-indexes all public repos already; this added the conversion CTA${PUBLISH:+ + registry}."
