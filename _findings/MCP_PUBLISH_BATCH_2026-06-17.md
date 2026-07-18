# MCP Publish Batch — 2026-06-17
**Agent:** JEEVES  
**Status:** Staged; requires PyPI/npm tokens to execute

---

## PyPI Flagship Batch (5 packages)

| # | Package | Local Path | Repo | Action |
|---|---------|------------|------|--------|
| 1 | `meok-annex-iii-impact-mcp` | `~/clawd/meok-annex-iii-impact-mcp` | CSOAI-ORG/meok-annex-iii-impact-mcp | `python -m build && twine upload dist/*` |
| 2 | `meok-eu-code-of-practice-mcp` | `~/clawd/meok-eu-code-of-practice-mcp` | CSOAI-ORG/meok-eu-code-of-practice-mcp | Build + twine upload |
| 3 | `meok-compliance-passport-mcp` | `~/clawd/meok-compliance-passport-mcp` | CSOAI-ORG/meok-compliance-passport-mcp | Build + twine upload |
| 4 | `meok-ai-psych-vuln-audit-mcp` | `~/clawd/meok-ai-psych-vuln-audit-mcp` | CSOAI-ORG/meok-ai-psych-vuln-audit-mcp | Build + twine upload |
| 5 | `openchronicle-mcp` | `~/clawd/openchronicle-mcp` | CSOAI-ORG/openchronicle-mcp | Build + twine upload |

## npm Flagship Batch (10 packages)

| # | Package | Local Path | Scope | Action |
|---|---------|------------|-------|--------|
| 1 | `@csoai-org/care-membrane-mcp` | `~/clawd/mcp-marketplace/...` or GitHub | @csoai-org | `npm publish --access public` |
| 2 | `@csoai-org/eu-ai-act-compliance-mcp` | GitHub | @csoai-org | npm publish |
| 3 | `@csoai-org/proofof-ai-mcp` | GitHub | @csoai-org | npm publish |
| 4 | `@csoai-org/ai-self-audit-mcp` | GitHub | @csoai-org | npm publish |
| 5 | `@csoai-org/web-research-mcp` | GitHub | @csoai-org | npm publish |
| 6 | `@csoai-org/memory-search-mcp` | GitHub | @csoai-org | npm publish |
| 7 | `@csoai-org/code-executor-mcp` | GitHub | @csoai-org | npm publish |
| 8 | `@csoai-org/agent-orchestrator-mcp` | GitHub | @csoai-org | npm publish |
| 9 | `@csoai-org/agent-delegation-mcp` | GitHub | @csoai-org | npm publish |
| 10 | `@csoai-org/meok-ai-treaty-mcp` | `~/clawd/mcp-marketplace/meok-ai-treaty-mcp` | @csoai-org | npm publish |

## Registry Submissions (Glama / Smithery / mcp.so)

Script ready: `~/clawd/submit-all-mcps.py`  
Requires:
- `GLAMA_KEY`
- `SMITHERY_KEY`

Run after GitHub repos are public and npm/PyPI packages are live:
```bash
cd ~/clawd
python3 submit-all-mcps.py
```

## Execution Command (after token drop)
```bash
cd ~/clawd
python3 scripts/bulk-publish-mcps.py --pypi --npm --registries
```

If `scripts/bulk-publish-mcps.py` does not exist, I will generate it on demand.

---

*Batch staged. Tokens required: PYPI_API_TOKEN, npm publish token.*
