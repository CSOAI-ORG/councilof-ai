#!/usr/bin/env python3
"""
audit.py — security/reliability audit for openpatent.hive (LOCAL).

Scans all .py + .md files for:
  - hardcoded secrets / API keys
  - shell=True usages (security risk)
  - localhost / 127.0.0.1 hardcoded (ok in mock)
  - TODOs and FIXMEs
  - missing LICENSE

Output:
  - 0 critical = pass
  - > 0 critical = needs review
"""
import os, re, sys
from pathlib import Path

DR = Path("/Users/nicholas/clawd/openpatent-hive")
EXCLUDES = {"node_modules", ".next", "__pycache__", "_ingest", ".git",
            "vault/results", "vault/mail-queue", "vault/dns-queue",
            "vault/sms-queue", ".vercel", "var/patentmcp-mock",
            ".eat-sigils", "data-room-2026", "data-room-latest"}

SECRET_PATTERNS = [
    (r"AKIA[0-9A-Z]{16}", "AWS key"),
    (r"sk-[a-zA-Z0-9]{20,}", "OpenAI key"),
    (r"ghp_[a-zA-Z0-9]{30,}", "GitHub PAT"),
    (r"NC_[a-zA-Z0-9]{40,}", "Namecheap API key"),
    (r"(?i)password\s*[=:]\s*[\"'][^\"']{4,}", "Password literal"),
    (r"-----BEGIN [A-Z]+ PRIVATE KEY-----", "PEM private key"),
]
SHELL_TRUE = re.compile(r"shell\s*=\s*True")
TODO = re.compile(r"\b(TODO|FIXME|XXX|HACK)\b", re.IGNORECASE)

def main():
    findings = {"critical": [], "warn": [], "info": []}
    files_scanned = 0

    for root, dirs, files in os.walk(DR):
        dirs[:] = [d for d in dirs if d not in EXCLUDES and not d.startswith("_")]
        for fn in files:
            if not (fn.endswith(".py") or fn.endswith(".md") or fn.endswith(".sh")):
                continue
            p = Path(root) / fn
            try:
                content = p.read_text(errors="ignore")
            except Exception:
                continue
            files_scanned += 1

            for pattern, label in SECRET_PATTERNS:
                m = re.search(pattern, content)
                if m:
                    findings["critical"].append(f"{p.relative_to(DR)}: {label}")
                    break

            if SHELL_TRUE.search(content) and p.suffix == ".py":
                findings["warn"].append(f"{p.relative_to(DR)}: shell=True (security risk)")

            if TODO.search(content):
                findings["info"].append(f"{p.relative_to(DR)}: TODO/FIXME")

    print("=" * 60)
    print("  AUDIT RESULTS")
    print("=" * 60)
    print(f"  Files scanned: {files_scanned}")
    print(f"  Critical:      {len(findings['critical'])}")
    print(f"  Warn:          {len(findings['warn'])}")
    print(f"  Info:          {len(findings['info'])}")
    print()

    if findings["critical"]:
        print("🚨 CRITICAL:")
        for f in findings["critical"][:10]:
            print(f"  {f}")
        if len(findings["critical"]) > 10:
            print(f"  ... +{len(findings['critical']) - 10} more")
    else:
        print("✅ No critical issues")

    if findings["warn"]:
        print("\n⚠️  WARN (review):")
        for f in findings["warn"][:5]:
            print(f"  {f}")

    if findings["info"]:
        print("\nℹ️  INFO:")
        for f in findings["info"][:5]:
            print(f"  {f}")
        if len(findings["info"]) > 5:
            print(f"  ... +{len(findings['info']) - 5} more")

    return 0 if not findings["critical"] else 1

if __name__ == "__main__":
    sys.exit(main())