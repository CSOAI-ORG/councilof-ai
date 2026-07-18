# Manual MCP Package Publish Runbook
**Date:** 2026-06-17  
**Purpose:** Publish queued PyPI/npm packages manually if tokens are not yet in env  

---

## PyPI packages (5)

From `bulk-publish-mcps.py` dry run:

1. meok-annex-iii-impact-mcp
2. meok-eu-code-of-practice-mcp
3. meok-compliance-passport-mcp
4. meok-ai-psych-vuln-audit-mcp
5. openchronicle-mcp

### Steps per package

```bash
cd /Users/nicholas/clawd/meok-annex-iii-impact-mcp
# Update version in pyproject.toml if needed
rm -rf dist build *.egg-info
python3 -m build
python3 -m twine upload dist/*
```

Repeat for each PyPI package directory.

### Auth

Ensure `~/.pypirc` contains:

```ini
[pypi]
username = __token__
password = pypi-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Or set:

```bash
export PYPI_API_TOKEN=pypi-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## npm packages (5)

From `bulk-publish-mcps.py` dry run:

1. agent-commerce-payments-mcp
2. ai-self-audit-mcp
3. agent-orchestrator-mcp
4. agent-negotiation-mcp
5. agent-delegation-mcp

### Steps per package

```bash
cd /Users/nicholas/clawd/agent-commerce-payments-mcp
# Update version in package.json if needed
npm login  # or use npm publish with token
npm publish --access public
```

Repeat for each npm package directory.

### Auth

```bash
npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
# or
npm login
```

---

## Post-publish

1. Verify packages appear on https://pypi.org and https://www.npmjs.com
2. Update `MCP_PUBLISH_REPORT_2026-06-17.json` with actual publish status.
3. Submit package URLs to MCP registries (Smithery, etc.) if applicable.

## Automated alternative (once tokens drop)

```bash
cd /Users/nicholas/clawd
python3 scripts/bulk-publish-mcps.py
```
