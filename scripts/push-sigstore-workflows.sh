#!/bin/bash
cd /Users/nicholas/clawd/mcp-marketplace

flagships=("care-membrane-mcp" "eu-ai-act-compliance-mcp" "dora-compliance-mcp" "nis2-compliance-mcp" "gdpr-compliance-ai-mcp" "iso-42001-ai-mcp" "pci-dss-mcp" "hipaa-compliance-mcp" "agent-audit-logger-mcp" "mcp-scorecard-mcp" "meok-mcp-test-mcp" "soc2-compliance-ai-mcp" "haulage-uk-compliance-mcp" "risk-assessment-ai-mcp")

for repo in "${flagships[@]}"; do
    if [ -d "$repo/.git" ]; then
        echo "Pushing workflow to $repo..."
        cd "$repo"
        git add .github/workflows/pypi-publish.yml
        git commit -m "ci: add PyPI Trusted Publishing + Sigstore signing"
        git push
        cd ..
    fi
done

cd /Users/nicholas/clawd/meok-sdk-python
if [ -d ".git" ]; then
    echo "Pushing workflow to meok-sdk-python..."
    git add .github/workflows/pypi-publish.yml
    git commit -m "ci: add PyPI Trusted Publishing + Sigstore signing"
    git push
fi
