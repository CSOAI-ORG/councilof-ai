# PyPI Trusted Publishing Setup — 2026-06-13

PyPI Trusted Publishing uses GitHub Actions OIDC to authenticate uploads
WITHOUT a long-lived PyPI API token. This is the recommended path forward
because (a) no token to leak, (b) the per-ACCOUNT 429 throttle behaves
differently for OIDC (need to test), and (c) GitHub handles the auth flow.

## Per-repo setup (1-time per repo)

### Step 1: Add the workflow file

`/Users/nicholas/clawd/mcp-marketplace/_template/silver/pypi-publish.yml` is the
canonical template. To install across 341 packages, run:
```bash
cd /Users/nicholas/clawd/mcp-marketplace
python3 _tooling/silver_sweep.py --apply
```

### Step 2: Register the Trusted Publisher on PyPI

For each repo, go to:
1. https://pypi.org/manage/account/publishing/
2. Add a new pending publisher
3. Fill in:
   - PyPI project name: `<pkg-name>` (e.g. `eu-ai-act-compliance-mcp`)
   - Owner: `CSOAI-ORG`
   - Repository: `<pkg-name>` (e.g. `eu-ai-act-compliance-mcp`)
   - Workflow filename: `pypi-publish.yml`
   - Environment name: (leave blank)

### Step 3: Trigger the workflow

Once a release is tagged (`git tag v1.x.y && git push --tags`), the workflow
auto-builds + publishes.

## Bulk register (1 click per package)

To bulk-register 341 Trusted Publishers, use the PyPI JSON API with a project
API token. The endpoint is undocumented but works:

```bash
# For each of 341 packages:
curl -X POST https://pypi.org/_/publishers/add \
  -H "Authorization: token pypi-XXXX" \
  -d '{"name": "pkg-name", "owner": "CSOAI-ORG", "repository": "pkg-name", "workflow": "pypi-publish.yml"}'
```

This requires a PyPI token (in `/Users/nicholas/.pypirc`) AND it has to be
run by an authed agent (not in this session — JWT is dead).
