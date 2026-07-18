# MCP Security Audit MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-4%2F4-brightgreen)]()

**Audit any MCP server for security vulnerabilities.** Cloned from `qianniuspace/mcp-security-audit` (MIT, ★54) and extended with 8 MCP-specific vulnerability patterns.

## Why This Exists

We have **661 MCP packages** in our marketplace. How many of them have:
- Path traversal vulnerabilities (LLM-generated file paths)?
- Command injection (shell=True in subprocess)?
- Hardcoded secrets in source code?
- Unsafe deserialization (pickle.loads, eval, exec)?
- Missing authentication on HTTP endpoints?

**We don't know — until now.** This MCP tells us.

## Vulnerability Categories

| Category | Severity | What it catches |
|----------|----------|-----------------|
| **Path traversal** | HIGH | `open(user_path + file)` patterns, `../` usage |
| **Command injection** | CRITICAL | `os.system(f"echo {user_input}")`, `subprocess(shell=True)` |
| **Prompt injection** | MEDIUM | "ignore previous instructions" in tool descriptions |
| **Secret leakage** | CRITICAL | Hardcoded API keys, tokens, passwords |
| **Unsafe deserialization** | CRITICAL | `pickle.loads()`, `eval()`, `exec()`, `yaml.load(L=Loader)` |
| **Missing auth** | HIGH | FastAPI() with no auth middleware |
| **No rate limit** | MEDIUM | Async endpoints with no rate limiting |
| **Excessive logging** | MEDIUM | Logger/print of secrets |

## Tools

- `audit_mcp_source(source_code, mcp_name)` — Audit a single source file
- `audit_mcp_directory(mcp_path)` — Audit all .py files in a directory
- `scan_for_known_iocs(target)` — Check for TeamPCP/JADEPUFFER IOCs

## Quick Start

```python
from mcp_security_audit_mcp.server import audit_mcp_source, audit_mcp_directory, scan_for_known_iocs

# Audit a single source file
result = audit_mcp_source(source_code, "my_mcp")
# Returns: {risk_score: 0-10, verdict: CLEAN|LOW_RISK|MEDIUM_RISK|HIGH_RISK|CRITICAL_RISK, findings: [...]}

# Audit an entire MCP
result = audit_mcp_directory("mcp-marketplace/agentic-threat-defense-mcp")
# Returns: {files_audited, average_risk_score, verdict, top_findings}

# Check for known IOCs
iocs = scan_for_known_iocs("our MCP estate")
# Returns: {domains: [TeamPCP C2 domains], patterns: [credential theft regex]}
```

## Known IOCs (July 2026 agentic malware)

Domains tracked:
- `scan.aquasecurtiy.org` (TeamPCP/Trivy wave)
- `checkmarx.zone` (TeamPCP/KICS wave)
- `models.litellm.cloud` (TeamPCP/LiteLLM wave)
- `tdtqy-oyaaa-aaaae-af2dq-cai.raw.icp0.io` (CanisterWorm C2)

## Risk Scoring

- **0-0.5:** CLEAN — no issues found
- **0.5-2:** LOW_RISK — minor issues, recommended fixes
- **2-4:** MEDIUM_RISK — should fix before production
- **4-7:** HIGH_RISK — must fix before production
- **7+:** CRITICAL_RISK — do not deploy

## Output

Each audit produces an Ed25519-signed report hash that goes to the SIGIL ledger. The audit is itself auditable.

**MEOK AI Labs (CSOAI LTD)** — Verified. Audited. Secure.
