# Canonical PyPI Package Names — use these EXACTLY (404 map)
**2026-05-29 · verified live against pypi.org/pypi/<name>/json**

Docs/emails referenced `meok-`-prefixed names that 404. A prospect running `pip install <404>` from outreach hits a dead end = lost install + lost trust. Below: the WRONG name → the REAL published name. **Always cite the real name.**

| ❌ Wrong (404) | ✅ Real published name | Version |
|---|---|---|
| `meok-eu-ai-act` | **`eu-ai-act-compliance-mcp`** | 1.5.3 |
| `meok-dora` | **`dora-compliance-mcp`** | live |
| `meok-nis2` | **`nis2-compliance-mcp`** | live |
| `meok-cra` | **`cra-compliance-mcp`** | live |
| `meok-iso-42001` / `meok-iso-42001-mcp` | **`iso-42001-ai-mcp`** | 1.0.7 |
| `meok-nist-ai-rmf` | **`nist-rmf-ai-mcp`** | 1.0.7 |
| `meok-bias-detection` | **`bias-detection-mcp`** | live |
| `meok-ai-incident-reporting` | **`ai-incident-reporting-mcp`** | live |
| `meok-policy-enforcement` | **`agent-policy-enforcement-mcp`** | 1.0.4 |
| `meok-prompt-injection-firewall` | **`agent-prompt-injection-firewall-mcp`** | 1.0.6 |
| `meok-handoff-certified` | **`agent-handoff-certified-mcp`** | 1.0.6 |
| `meok-mcp-injection-scan-mcp` | **`agent-prompt-injection-firewall-mcp`** (or `mcp-injection-scanner-mcp` if shipped) | check |
| `meok-watermark-attest` | **`meok-watermark-attest-mcp`** (suffix needed) OR `watermarking-authenticity-mcp` 1.2.0 | 1.3.4 |
| `meok-nis2-de-register` | **`meok-nis2-de-register-mcp`** (suffix needed) | 1.0.8 |
| `meok-attestation-verify` | ✅ already correct | 1.0.3 |

**Pattern:** most are `<topic>-compliance-mcp` or `<topic>-mcp` or `agent-<topic>-mcp` — NOT `meok-<topic>`. Two genuinely keep the `meok-` prefix but need the `-mcp` suffix.

**Rule going forward:** before any doc cites `pip install X`, verify `pypi.org/pypi/X/json` returns 200. Full list of all 264 published: `revenue/_mcp_pypi_map.txt`.
