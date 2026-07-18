# PUBLISH — How Sir Nick Fires the PyPI Upload

**Status:** Owner-gated per EAT directive 2026-07-02.
**Package:** Crown Jewel #1 — `meok-sovereign-aiact-passport` v0.1.0

When ready, run these locally:

```bash
cd /Users/nicholas/clawd/meok-sovereign-aiact-passport-mcp

# 1. Verify build works (sdist + wheel)
source .venv/bin/activate
python -m pip install --upgrade build twine
python -m build
ls dist/  # expect: meok_sovereign_aiact_passport-0.1.0.tar.gz + *.whl

# 2. Run full test suite one final time
python -m pytest tests/ -v --tb=short
# expected: 88 passed, 1 skipped

# 3. TestPyPI dry-run (recommended)
python -m twine upload --repository testpypi dist/*
# (uses TESTPYPI_USERNAME + TESTPYPI_TOKEN env vars)

# 4. If TestPyPI looks good → real PyPI
python -m twine upload dist/*
# (uses PYPI_USERNAME + PYPI_TOKEN env vars)
```

## Post-publish wiring

Once on PyPI, you can install with:

```bash
pip install meok-sovereign-aiact-passport
```

And wire into Claude Desktop by editing `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "meok-sovereign-aiact-passport": {
      "command": "meok-sovereign-aiact-passport"
    }
  }
}
```

## Verification matrix (run after publish)

- [ ] PyPI page live: https://pypi.org/project/meok-sovereign-aiact-passport/
- [ ] `pip install meok-sovereign-aiact-passport` works in fresh venv
- [ ] `meok-sovereign-aiact-passport` installed entry point runs
- [ ] 88 tests still pass on consumer side
- [ ] In Claude Desktop: tools appear after restart

## SIGIL

PUBLISH · meok-sovereign-aiact-passport v0.1.0 · 2026-07-08 · Ed25519
