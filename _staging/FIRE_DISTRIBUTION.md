# FIRE_DISTRIBUTION.md — Lane D distribution staging runbook

**Status:** STAGED, NOTHING PUBLISHED. Every command below is copy-paste ready.
Do not run any of them until the named token is in your shell. Generated 2026-06-19.

This runbook lists the exact, ordered commands that are gated *only* on Nick's
tokens. The build artifacts and manifests already exist on disk; the swarm did
not (and must not) publish, push, deploy, `npm install`, or touch any secret.

---

## TOKEN INDEX (what each step needs)

| Step | Artifact | Token / account gate | Env var |
|------|----------|----------------------|---------|
| 1 | `agentaudit` → PyPI | PyPI API token (scope: agentaudit or account-wide) | `PYPI_API_TOKEN` |
| 2 | `@openpatent/*` MCPs → npm | npm auth (publish rights on `@openpatent` scope) | `~/.npmrc` `//registry.npmjs.org/:_authToken` |
| 3 | Smithery listing | Smithery API key | `smithery login` (interactive) |

> No `sk_live_`, `ghp_`, Stripe, or Resend secrets are required for the publishes
> in steps 1–2. Steps that touch GHCR / wallets / cosign / Stripe remain in the
> richer per-package PUBLISH.md files and are intentionally NOT inlined here.

---

## 1. agentaudit → PyPI  (token: `PYPI_API_TOKEN`)

**Build-ready: YES.** `pyproject.toml` valid (setuptools backend, name `agentaudit`,
v0.1.0, requires-python >=3.10). Wheel + sdist already built in `dist/`:
- `agentaudit-0.1.0-py3-none-any.whl`
- `agentaudit-0.1.0.tar.gz`

`build` and `twine` are both importable under `/opt/homebrew/bin/python3.11`.

```bash
cd /Users/nicholas/clawd/meok-compliance-gateway/agentaudit

# (Optional) rebuild fresh artifacts — only if you changed source since 2026-06-14:
python -m build

# Upload (THE gated command — needs PYPI_API_TOKEN):
env -u GITHUB_TOKEN -u GH_TOKEN python -m twine upload \
  --username __token__ \
  --password "${PYPI_API_TOKEN:?set PYPI_API_TOKEN first}" \
  dist/agentaudit-0.1.0-py3-none-any.whl \
  dist/agentaudit-0.1.0.tar.gz

# Verify:
curl -fsS https://pypi.org/pypi/agentaudit/json | jq -r '.info.version'   # expect 0.1.0
```

> The repo's own `UPLOAD.sh` wraps the same twine call; either works.
> Full PyPI + GHCR + cosign + wallet checklist: `agentaudit/PUBLISH.md`.

---

## 2. @openpatent npm MCPs (publisher csoai-org)  (token: npm auth)

Six scoped packages under `@openpatent` (package.json `publisher: csoai-org`),
in `/Users/nicholas/clawd/openpatent-hive/services/`:

| Dir | Package | Version | dist built? |
|-----|---------|---------|-------------|
| openpatent-gaming-mcp | `@openpatent/gaming-mcp` | 1.0.0 | **NO — needs build** |
| openpatent-mcp | `@openpatent/mcp-server` | 1.3.0 | YES (dist/index.js present) |
| openpatent-ipcastle-mcp | `@openpatent/ipcastle-mcp` | 1.0.0 | **NO — needs build** |
| openpatent-legal-mcp | `@openpatent/legal-mcp` | 1.0.0 | **NO — needs build** |
| openpatent-research-mcp | `@openpatent/research-mcp` | 1.0.0 | **NO — needs build** |
| openpatent-sovereign-mcp | `@openpatent/sovereign-mcp` | 1.0.0 | **NO — needs build** |

**The "gaming" package** the lane targets is `@openpatent/gaming-mcp`.

### 2a. PREREQUISITE (gated on you — the swarm may not run `npm install`)

All packages set `"main": "dist/index.js"` and `"build": "tsc"`, but 5 of 6 have
**no `dist/`** on disk. They will publish a broken (empty) tarball unless built
first. You must run install + build yourself:

```bash
cd /Users/nicholas/clawd/openpatent-hive/services
for d in openpatent-gaming-mcp openpatent-ipcastle-mcp openpatent-legal-mcp \
         openpatent-research-mcp openpatent-sovereign-mcp; do
  ( cd "$d" && npm install && npm run build )   # produces dist/index.js
done
# openpatent-mcp already has dist/ — rebuild only if source changed.
```

### 2b. Publish (THE gated commands — need npm auth + @openpatent scope rights)

Scoped packages with no `publishConfig`, so `--access public` is required each time:

```bash
cd /Users/nicholas/clawd/openpatent-hive/services

# Gaming (the lane's headline target):
( cd openpatent-gaming-mcp   && npm publish --access public )

# The rest:
( cd openpatent-mcp          && npm publish --access public )
( cd openpatent-ipcastle-mcp && npm publish --access public )
( cd openpatent-legal-mcp    && npm publish --access public )
( cd openpatent-research-mcp && npm publish --access public )
( cd openpatent-sovereign-mcp && npm publish --access public )

# Verify any one:
npm view @openpatent/gaming-mcp version
```

> If `@openpatent` scope is not yet owned on npm, `npm publish` 403s until the
> org/scope is created under the publishing account.

---

## 3. Smithery listing for a flagship MCP  (token: Smithery API key)

Two candidates carry a Smithery manifest:

- **agentaudit** already ships a complete `smithery.yaml` in its repo dir
  (`meok-compliance-gateway/agentaudit/smithery.yaml`) — publish-ready as-is.
- **@openpatent/gaming-mcp** had **no** manifest. A reviewed stub is staged at
  `/Users/nicholas/clawd/_staging/openpatent-gaming-mcp.smithery.yaml`
  (mirrors the agentaudit shape). Copy it into the package dir before publishing.

```bash
npm install -g @smithery/cli
smithery login                      # interactive — Smithery API key

# Option A — agentaudit (manifest already in place):
smithery publish /Users/nicholas/clawd/meok-compliance-gateway/agentaudit

# Option B — gaming MCP (place the staged stub first; build must be done — step 2a):
cp /Users/nicholas/clawd/_staging/openpatent-gaming-mcp.smithery.yaml \
   /Users/nicholas/clawd/openpatent-hive/services/openpatent-gaming-mcp/smithery.yaml
smithery publish /Users/nicholas/clawd/openpatent-hive/services/openpatent-gaming-mcp
```

---

## ORDER OF FIRE

1. Add `PYPI_API_TOKEN` → run step 1 (agentaudit to PyPI). Self-contained.
2. `npm login` (or set npmrc authToken) → run step 2a (build) then 2b (publish).
3. `smithery login` → run step 3 (after 2a build for the gaming option).

Each step is independent; nothing here pushes git, deploys, or touches a secret
beyond the three tokens above.
