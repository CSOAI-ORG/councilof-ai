# PyPI + MCP Registry Submission

## PyPI publish (5 min)

```bash
cd /Users/nicholas/clawd/meok-compliance-passport-mcp
python3 -m venv /tmp/passport-publish
/tmp/passport-publish/bin/pip install -q build twine
/tmp/passport-publish/bin/python -m build
/tmp/passport-publish/bin/twine upload dist/*  # uses ~/.pypirc (MEOK_AI_Labs account)
```

## MCP Registry submission (5 min)

```bash
# Create the .mcp.json manifest
cat > .mcp.json <<'EOF'
{
  "name": "meok-compliance-passport-mcp",
  "version": "1.0.0",
  "description": "Ed25519-signed, offline-verifiable agent compliance passports covering EU AI Act, Article 50, GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF, CRA, DORA, NIS2, GPAI CoP",
  "author": "MEOK AI Labs (CSOAI LTD)",
  "repository": "https://github.com/CSOAI-ORG/meok-compliance-passport-mcp",
  "license": "MIT",
  "tools": [
    {"name": "issue_passport", "description": "Issue an Ed25519-signed compliance passport for an AI agent"},
    {"name": "verify_passport", "description": "Verify a passport signature offline (no network call)"},
    {"name": "exchange_credentials", "description": "A2A handshake — two agents authorise each other via passport exchange"}
  ]
}
EOF

# Submit to the registry
mcp-publisher publish . --token $(gh auth token)
```

## git tag + release (2 min)

```bash
cd /Users/nicholas/clawd/meok-compliance-passport-mcp
git init
git add .
git commit -m "feat: agent compliance passport MCP v1.0.0 (Article 50 wedge)"
gh repo create CSOAI-ORG/meok-compliance-passport-mcp --public --source=. --push
git tag v1.0.0
git push --tags
```

## Total time: 12 minutes
