#!/usr/bin/env python3
"""Build DEPTH_AUDIT_TESTRUN_2026-06-26.md from the JSON."""
import json
from pathlib import Path

clawd = Path.home() / "clawd"
data = json.loads((clawd / "DEPTH_AUDIT_TESTRUN_2026-06-26.json").read_text())
agg = data["aggregate"]

md = []
md.append("# CSOAI MCP Depth-Audit Test Run — 2026-06-26")
md.append("")
md.append("> Upgrades the depth-audit fidelity from **'tests file present'** to **'tests collected + pass rate'** on a curated high-value sample.")
md.append("> Source: `DEPTH_AUDIT_TESTRUN_2026-06-26.json` (raw pytest output per-MCP).")
md.append("> Re-run: `cd ~/clawd && python3 _m4/_depth_audit_testrun.py`")
md.append("")
md.append("## Aggregate")
md.append("")
md.append(f"- **Sample size:** {agg['sample_size']} MCPs (curated: A2A substrate + reg MCPs + signing backbone + bridges + top by tool count).")
md.append(f"- **Tests collected:** {agg['total_tests_collected']}")
md.append(f"- **Passing:** {agg['total_passed']} ({100*agg['total_passed']/agg['total_tests_collected']:.1f}%)")
md.append(f"- **Failing:** {agg['total_failed']} ({100*agg['total_failed']/agg['total_tests_collected']:.1f}%)")
md.append(f"- **Skipped:** {agg['total_skipped']}")
md.append(f"- **Errors:** {agg['total_errors']}")
md.append(f"- **Wall clock:** {agg['wall_clock_s']}s")
md.append("")
md.append("## Status breakdown")
md.append("")
md.append("| Status | MCPs |")
md.append("|---|---|")
for k, v in agg["by_status"].items():
    md.append(f"| {k} | {v} |")
md.append("")
md.append("## Failing MCPs (real — needs attention)")
md.append("")
md.append("| MCP | Pass | Fail | Skip |")
md.append("|---|---|---|---|")
for r in data["results"]:
    if r["status"] == "fail":
        md.append(f"| `{r['slug']}` | {r['passed']} | {r['failed']} | {r['skipped']} |")
md.append("")
md.append("## Top 10 by test count")
md.append("")
md.append("| MCP | Total | Pass | Fail |")
md.append("|---|---|---|---|")
for r in sorted(data["results"], key=lambda x: -x["tests"])[:10]:
    md.append(f"| `{r['slug']}` | {r['tests']} | {r['passed']} | {r['failed']} |")
md.append("")
md.append("## A2A substrate detail (the strategic prize — 20 MCPs)")
md.append("")
md.append("| MCP | Total | Pass | Fail | Skip |")
md.append("|---|---|---|---|---|")
A2A = ["agent-orchestrator-mcp", "agent-identity-trust-mcp", "agent-x402-paywall-mcp", "agent-prompt-injection-firewall-mcp", "agent-policy-enforcement-mcp", "agent-incident-relay-mcp", "agent-handoff-certified-mcp", "agent-audit-logger-mcp", "agent-rate-limiter-mcp", "agent-mcp-router-mcp", "agent-data-residency-mcp", "agent-cost-allocator-mcp", "agent-token-budget-mcp", "agent-content-watermark-mcp", "agent-replay-debugger-mcp", "agent-delegation-mcp", "agent-negotiation-mcp", "agent-incident-reporter-mcp", "bft-progress-council-mcp", "agent-commerce-protocol-mcp"]
for r in data["results"]:
    if r["slug"] in A2A:
        md.append(f"| `{r['slug']}` | {r['tests']} | {r['passed']} | {r['failed']} | {r['skipped']} |")
md.append("")
md.append("## Bridges detail (22 governed legacy gateways)")
md.append("")
md.append("| MCP | Total | Pass | Fail | Skip |")
md.append("|---|---|---|---|---|")
B = ["cobol-bridge-mcp", "as400-bridge-mcp", "cics-bridge-mcp", "acord-bridge-mcp", "a2a-governance-bridge-mcp", "meok-abci-bridge-mcp", "meok-haulage-governance-bridge-mcp"]
for r in data["results"]:
    if r["slug"] in B:
        md.append(f"| `{r['slug']}` | {r['tests']} | {r['passed']} | {r['failed']} | {r['skipped']} |")
md.append("")
md.append("## Missing MCPs (in the sample list but not in this checkout)")
md.append("")
md.append("| MCP | Note |")
md.append("|---|---|")
MISSING_NOTES = {
    "meok-dora-tlpt-planner-mcp": "exists in CSOAI-ORG but not in local `mcp-marketplace` clone",
    "meok-nis2-nl-register-mcp": "exists in CSOAI-ORG but not in local `mcp-marketplace` clone",
    "risk-assessment-mcp": "exists in CSOAI-ORG but not in local `mcp-marketplace` clone",
    "compliance-passport-mcp": "exists in CSOAI-ORG but not in local `mcp-marketplace` clone (rebranded to meok-compliance-passport-mcp)",
}
for r in data["results"]:
    if r["status"] == "missing":
        md.append(f"| `{r['slug']}` | {MISSING_NOTES.get(r['slug'], '')} |")
md.append("")
md.append("## Honesty caveats")
md.append("")
md.append("- **Sample, not census.** 67 of 369 MCPs. The remaining ~302 may pass at a similar rate, or not — this audit does not claim otherwise.")
md.append("- **'Missing'** = the MCPs we named in the SAMPLE list that are NOT in the local `mcp-marketplace` clone. They exist in the CSOAI-ORG account but not in this checkout.")
md.append("- **Per-test verification:** the 5 failing MCPs are **real failures**, not parsing artifacts. Investigating them is the next step (not done in Phase A).")
md.append("- **Skipped tests** are likely platform/optional-dep guards (e.g. 'skip if no API key') — they are not failures.")
md.append("- **Headline:** 640/686 = **93.3% pass rate** on the curated sample. The earlier '99% ship-ready' claim (from the file-presence audit) is **downgraded** to '93.3% tests pass on a 67-MCP sample, with 5 MCPs needing fixes'.")
md.append("")

(clawd / "DEPTH_AUDIT_TESTRUN_2026-06-26.md").write_text("\n".join(md))
print("Wrote: DEPTH_AUDIT_TESTRUN_2026-06-26.md")
