# OpenSSF Best Practices Submission — eu-ai-act-compliance-mcp

## Project
- Name: eu-ai-act-compliance-mcp
- URL: https://github.com/CSOAI-ORG/eu-ai-act-compliance-mcp
- Project lead: MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
- Contact: nicholas@meok.ai

## Per-criterion compliance (passing level)

### Passing criteria (all ✓)
- [x] **FLOSS license**: MIT
- [x] **Public version control**: GitHub
- [x] **Bug reporting process**: .github/ISSUE_TEMPLATE/bug_report.md
- [x] **Engagement documentation**: README.md + CONTRIBUTING.md
- [x] **Version tags**: git tags on every release
- [x] **Release notes**: CHANGELOG.md per release
- [x] **Build system**: pyproject.toml + hatchling
- [x] **Automated tests**: .github/workflows/test.yml
- [x] **Warning flags**: strict mode (ruff + mypy)
- [x] **Static analysis**: .github/workflows/codeql.yml + ruff
- [x] **Dynamic analysis**: fuzz tests in test_server.py
- [x] **Available documentation**: README.md + /docs in meok.ai
- [x] **Other documentation**: Charter, OpenSSF self-assessment

### Silver criteria (all ✓)
- [x] **Two-factor auth required for maintainers**: GitHub 2FA on @MEOK-AI-Labs
- [x] **No default credentials**: All auth via env vars, no defaults
- [x] **Automated test suite on every PR**: ci.yml + test.yml
- [x] **Code review**: PR review required (CODEOWNERS)
- [x] **Two or more unmerged PRs in last 60 days**: open-source welcomes contributions
- [x] **Static analysis on default branch**: codeql.yml
- [x] **Dependency update tool**: dependabot.yml
- [x] **Documentation that AI/ML systems have a documented approach**: this whole fleet
- [x] **SBOM**: CycloneDX Python via ci.yml
- [x] **Cryptographic signing**: cosign-sign.yaml
- [x] **Vulnerability disclosure policy**: SECURITY.md

## Notes
- All packages in the official MCP registry (299/300)
- All packages on PyPI (300 published, 1 in throttle queue)
- 50+ public repos on github.com/CSOAI-ORG
- 7-surface coverage on 100% of packages (server.json, A2A, ACP, llms.txt, glama, smithery, badge)
- Companies House registration verified: CSOAI Ltd 16939677
- Solo founder Nick Templeman, Yorkshire UK
