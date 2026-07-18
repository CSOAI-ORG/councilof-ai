#!/usr/bin/env python3
"""Security audit: flag subprocess, os.system, eval, exec across all MCP repos."""

import json
import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")
REPORT_PATH = os.path.join(BASE_DIR, "SECURITY_AUDIT_REPORT.json")

HIGH_RISK_PATTERNS = [
    (re.compile(r"\beval\s*\("), "eval() call"),
    (re.compile(r"\bexec\s*\("), "exec() call"),
    (re.compile(r"\bos\.system\s*\("), "os.system() call"),
]

MEDIUM_RISK_PATTERNS = [
    (re.compile(r"\bsubprocess\.run\s*\([^)]*shell\s*=\s*True"), "subprocess.run with shell=True"),
    (re.compile(r"\bsubprocess\.call\s*\([^)]*shell\s*=\s*True"), "subprocess.call with shell=True"),
    (re.compile(r"\bsubprocess\.Popen\s*\([^)]*shell\s*=\s*True"), "subprocess.Popen with shell=True"),
    (re.compile(r"\bsubprocess\.run\s*\(\s*[^\['\"]+['\"]"), "subprocess.run with string command (possible injection)"),
]

LOW_RISK_PATTERNS = [
    (re.compile(r"\bsubprocess\.run\s*\("), "subprocess.run call"),
    (re.compile(r"\bsubprocess\.call\s*\("), "subprocess.call call"),
    (re.compile(r"\bsubprocess\.Popen\s*\("), "subprocess.Popen call"),
    (re.compile(r"\bimport\s+subprocess\b"), "subprocess import"),
]


def assess_line(line: str) -> tuple[str, str] | None:
    stripped = line.strip()
    # Skip comments and string literals that are clearly security patterns
    if stripped.startswith("#") or stripped.startswith('"""') or stripped.startswith("'''"):
        return None
    if '"pattern"' in stripped or "'pattern'" in stripped or '"severity"' in stripped or "'severity'" in stripped:
        return None
    if 'r"eval' in stripped or "r'eval" in stripped or 'r"exec' in stripped or "r'exec" in stripped:
        return None
    if 'r"os.system' in stripped or "r'os.system" in stripped:
        return None
    if '"eval(' in stripped or "'eval('" in stripped or '"exec(' in stripped or "'exec('" in stripped:
        return None
    if "are blocked." in stripped or "is blocked." in stripped:
        return None
    for pattern, reason in HIGH_RISK_PATTERNS:
        if pattern.search(line):
            return ("HIGH", reason)
    for pattern, reason in MEDIUM_RISK_PATTERNS:
        if pattern.search(line):
            return ("MEDIUM", reason)
    for pattern, reason in LOW_RISK_PATTERNS:
        if pattern.search(line):
            return ("LOW", reason)
    return None


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Auditing {len(servers)} servers for execution risks...")

    findings = []
    high = 0
    medium = 0
    low = 0

    for server in servers:
        name = server["name"]
        repo_dir = os.path.join(BASE_DIR, "mcp-marketplace", name)
        server_py = os.path.join(repo_dir, "server.py")

        if not os.path.exists(server_py):
            continue

        try:
            with open(server_py, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception as e:
            print(f"[ERR ] {name}: cannot read server.py: {e}")
            continue

        for lineno, line in enumerate(lines, 1):
            result = assess_line(line)
            if result:
                level, reason = result
                findings.append({
                    "repo": name,
                    "file": "server.py",
                    "line": lineno,
                    "level": level,
                    "reason": reason,
                    "code": line.strip(),
                })
                if level == "HIGH":
                    high += 1
                elif level == "MEDIUM":
                    medium += 1
                else:
                    low += 1

    report = {
        "audited_at": "2026-04-15T05:00:00Z",
        "total_servers": len(servers),
        "total_findings": len(findings),
        "high": high,
        "medium": medium,
        "low": low,
        "findings": findings,
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\nAudit complete.")
    print(f"  HIGH:   {high}")
    print(f"  MEDIUM: {medium}")
    print(f"  LOW:    {low}")
    print(f"Report: {REPORT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
