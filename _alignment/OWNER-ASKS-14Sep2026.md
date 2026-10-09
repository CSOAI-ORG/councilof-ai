# OWNER ASKS — 2026-09-14
_One line per ask. Exact command/URL._

| Ask | Command/URL | Status |
|-----|-------------|--------|
| Merge #2195 (honesty/products, gates=SUCCESS) | `gh pr merge 2195 -R CSOAI-ORG/councilof-ai --squash` | PENDING |
| Check #2207 mergeable | `gh pr view 2207 -R CSOAI-ORG/councilof-ai --json mergeable` | PENDING |
| Check #2118 mergeable | `gh pr view 2118 -R CSOAI-ORG/councilof-ai --json mergeable` | PENDING |
| Re-check #2204 revert landed | `gh pr diff 2204 -R CSOAI-ORG/councilof-ai` | DONE |
| PyPI defoneos-mcp 1.0.6 live | `curl -s https://pypi.org/pypi/csoai-defoneos-mcp/1.0.6/json` | DONE |
| GitHub seal-verify workflow green | `gh run list -R CSOAI-ORG/csoai-defoneos-mcp --workflow=seal-verify.yml` | DONE |
| Rotate PASSWORD= in mcp-servers/deployment.md | `gh api repos/CSOAI-ORG/mcp-servers/contents/docs/deployment.md` — redact + PR | PENDING (owner gate) |
| Rotate sk- in sovereign-temple/start_chat.sh | `gh api repos/CSOAI-ORG/sovereign-temple/contents/start_chat.sh` — redact + PR | PENDING (owner gate) |
| Check #2207 body for OTS claim | `gh pr view 2207 -R CSOAI-ORG/councilof-ai --json body` | PENDING |
