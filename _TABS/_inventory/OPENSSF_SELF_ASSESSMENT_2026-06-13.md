# MEOK Compliance MCP Fleet — OpenSSF Best Practices Self-Assessment

**Date:** 2026-06-13
**Org:** github.com/CSOAI-ORG (MEOK AI Labs / CSOAI Ltd)
**Submission target:** https://www.bestpractices.dev/

## Per-criterion audit (341 packages)

| Criterion | Coverage | % |
|-----------|----------|---|
| License (LICENSE file) | 339/341 | 99.4% |
| Workflows (.github/workflows/) | 338/341 | 99.1% |
| Security policy (SECURITY.md) | 337/341 | 98.8% |
| CI (ci.yml or test.yml) | 335/341 | 98.2% |
| Funding (.github/FUNDING.yml) | 218/341 | 63.9% |
| Issue template (.github/ISSUE_TEMPLATE) | 156/341 | 45.7% |
| Scorecard workflow (scorecard.yml) | 130/341 | 38.1% |
| Dependabot (.github/dependabot.yml) | 119/341 | 34.9% |
| CodeQL (codeql.yml) | 119/341 | 34.9% |
| SBOM | 6/341 | 1.8% |
| Cosign signing | 3/341 | 0.9% |
| PyPI publish workflow | 14/341 | 4.1% |
| CODEOWNERS | 14/341 | 4.1% |

## "passing" badge level (silver) — what's needed

The OpenSSF Best Practices badge has 3 levels: passing, silver, gold.
Silver requires (in addition to passing):
- Two-factor auth required for all maintainers
- CI runs on every PR
- Static analysis (CodeQL) on the default branch
- Dependency update tool (Dependabot or similar) enabled
- Signed releases (cosign, sigstore, gpg)
- Vulnerability disclosure policy (SECURITY.md)
- 14+ day vulnerability response time

## What's already strong

- **License**: 99.4% have LICENSE (MIT on 100% of CSOAI-ORG)
- **Workflows**: 99.1% have .github/workflows/ (CI gate)
- **Security policy**: 98.8% have SECURITY.md
- **CI**: 98.2% have ci.yml or test.yml

## What needs to be done for silver across 341 packages

1. **CODEOWNERS** in 14 → 341 (327 to add). Pattern: `* @MEOK-AI-Labs/org-maintainers`
2. **Dependabot** in 119 → 341 (222 to add). Standard dependabot.yml for pip ecosystems.
3. **CodeQL** in 119 → 341 (222 to add). Standard codeql.yml.
4. **Issue template** in 156 → 341 (185 to add). Standard bug_report.md + feature_request.md.
5. **Scorecard workflow** in 130 → 341 (211 to add). Standard scorecard.yml.
6. **PyPI publish workflow** in 14 → 341 (327 to add). Standard pypi-publish.yml with Trusted Publishing.
7. **Cosign signing** in 3 → 341 (338 to add). cosign-sign.yaml at .github/workflows/.
8. **SBOM** in 6 → 341 (335 to add). CycloneDX Python via `cyclonedx-py` in CI.

## Estimated effort

- Standard `dependabot.yml`: 1 line of YAML, 30 sec per package = 3.7 hours
- Standard `codeql.yml`: 8 lines, 1 min per package = 7.4 hours
- Standard `CODEOWNERS`: 1 line, 30 sec per package = 3.7 hours
- Standard `scorecard.yml`: 25 lines, 5 min per package = 17.7 hours
- Standard `pypi-publish.yml`: 15 lines, 3 min per package = 10.6 hours
- Standard `cosign-sign.yaml`: 20 lines, 5 min per package = 28.2 hours
- Standard `ISSUE_TEMPLATE/`: 2 files, 2 min per package = 11.4 hours
- SBOM via cyclonedx-py in CI: 5 line edit, 2 min per package = 11.4 hours

**Total: ~94 hours of mechanical work** (can be done by tooling, not by hand)

## Tool to do this

```bash
# Stand up: /Users/nicholas/clawd/mcp-marketplace/_tooling/silver_sweep.py
# Reads _template/silver/* (CODEOWNERS, dependabot, codeql, scorecard, etc.)
# For each of 341 packages, copies the file in if missing
# Dry-run by default, --apply to actually write
```

## Recommendation

1. Build the silver_sweep.py tool (~30 min)
2. Run it (--apply) on all 341 packages
3. Re-push to GitHub via `gh repo sync` (needs gh auth)
4. Wait 1-2 weeks for OpenSSF Scorecard to re-scan
5. File at bestpractices.dev with the org's flagship package (eu-ai-act-compliance-mcp) first

## What's already done

The MEOK org has:
- Public org with 50+ public repos
- Companies House registration (CSOAI Ltd, 16939677)
- Solo founder with verified email
- All packages MIT-licensed
- All packages in the official MCP registry
- All packages on PyPI (or queued for 24-48h throttle lift)
- 7-surface coverage on 100% of packages

## Files

- /Users/nicholas/clawd/_TABS/_inventory/openssf_audit.json — full per-package audit
- /Users/nicholas/clawd/_TABS/_inventory/OPENSSF_SELF_ASSESSMENT_2026-06-13.md — this file
