# care-membrane-mcp v1.0.11

Release for Smithery publication via the `.github/workflows/mcp-smithery-publish.yml`
GitHub Action. This release re-tags the v1.0.11 line that is already live on PyPI.

## Source version state
- `pyproject.toml` -> `1.0.11`
- `server.json` -> `1.0.11`
- PyPI: https://pypi.org/project/care-membrane-mcp/ (1.0.11)

## What's included vs v1.0.7 (last documented in CHANGELOG.md)
- v1.0.8 .. v1.0.10: incremental version bumps, dep updates (actions/checkout 4->6,
  actions/setup-python 5->6, actions/setup-node 4.4.0->6.4.0, github/codeql-action 3->4,
  sigstore/gh-action-sigstore-python 3.0.0->3.4.0).
- v1.0.11:
  - Added Smithery publish workflow: `.github/workflows/mcp-smithery-publish.yml`
    (triggers on `release: published`, requires `SMITHERY_API_KEY` repo secret).
  - Added Dependabot auto-merge workflow.
  - Added Smithery / MCP publish artifacts on disk: `smithery.yaml`, `server.json`,
    `glama-ready.json`, `llms.txt`, `Dockerfile.glama`.
  - README: added `mcp-name: io.github.CSOAI-ORG/care-membrane-mcp` header and a
    "See also" link to the MEOK compliance MCP fleet.
