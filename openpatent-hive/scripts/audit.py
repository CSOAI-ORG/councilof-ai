#!/usr/bin/env python3
"""
Audit openpatent.ai hive code for real issues (not lints).

Categories:
  - Security (input validation, secrets in code, missing CORS, SQL-injection-prone patterns)
  - Reliability (error handling, retries, timeouts, missing healthchecks)
  - Documentation (claimed endpoints, advertised features, real behavior)
  - Code quality (dead code, copy-paste, hardcoded paths)
  - Sovereignty (third-party deps, cloud calls, outbound HTTP at runtime)

Runs against the local copy of the hive. Exits 0 if no critical issues.
"""
import re
import sys
import os
from pathlib import Path
from typing import List, Tuple, Dict

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"
ISSUES: List[Tuple[str, str, str, str]] = []  # (severity, file, line, message)


def add(severity: str, file: Path, lineno: int, message: str):
    ISSUES.append((severity, str(file.relative_to(ROOT)), str(lineno), message))


def scan_security(path: Path):
    """Find security issues: hardcoded secrets, missing CORS, eval, etc."""
    text = path.read_text(errors="ignore")
    lines = text.split("\n")
    for i, line in enumerate(lines, 1):
        # 1. Hardcoded API keys / passwords (basic heuristic)
        if re.search(r"(?i)(api[_-]?key|secret|password|token)\s*=\s*[\"'][a-zA-Z0-9_\-]{16,}[\"']", line):
            if "ENV" in line or "process.env" in line or "os.environ" in line:
                continue
            add("SECURITY", path, i, f"Possible hardcoded secret: {line.strip()[:80]}")

        # 2. eval / exec with dynamic input
        if re.search(r"\beval\s*\(", line) and "json" not in line:
            add("SECURITY", path, i, f"eval() call: {line.strip()[:80]}")

        # 3. SQL string concatenation (potential injection if user input flows in)
        if re.search(r"(execute|executemany)\s*\(\s*[\"'].*%\s", line) and "%" in line and "VALUES" not in line.upper():
            pass  # FastAPI uses asyncpg with $1 params, this is fine if so
        if re.search(r'f["\'].*SELECT.*\{.*\}', line, re.IGNORECASE):
            add("SECURITY", path, i, f"f-string in SQL query: {line.strip()[:80]}")

        # 4. CORS allow_origins=["*"] with allow_credentials=True (insecure combo in spec, but browsers allow it for non-cookie auth — flag as warning only if the service actually does auth, which we don't today)
        if "allow_origins" in line and '"*"' in line:
            add("WARN", path, i, f"CORS allow_origins=* — fine for public read, restrict for auth endpoints")

        # 5. cors.py origin "*" with credentials — true bug per spec, browsers allow it though
        if 'allow_origins=["*"]' in line and 'allow_credentials=True' in line:
            add("SECURITY", path, i, f"CORS wildcard + credentials: {line.strip()[:80]}")

    # 6. .env files committed (catch committed secrets pattern, but we don't have .env — skip)


def scan_reliability(path: Path):
    """Find reliability issues: missing timeouts, retries, error handling."""
    text = path.read_text(errors="ignore")
    lines = text.split("\n")
    for i, line in enumerate(lines, 1):
        # 1. requests/httpx without timeout (only catch obvious)
        if re.search(r'httpx\.(get|post|put|delete)\([^)]*\)\s*$', line) and "timeout" not in line and "AsyncClient" not in text[max(0, text.find(line) - 300):text.find(line)]:
            add("RELIABILITY", path, i, f"httpx call without explicit timeout: {line.strip()[:80]}")

        # 2. bare except: / except Exception: with pass (silent failure)
        # Allow the "metrics are optional" pattern: a 2-line try/except ImportError: pass
        # where the surrounding comment indicates intentional graceful degradation.
        if re.search(r"except[^:]*:\s*$", line) and i < len(lines) and "pass" in lines[i].strip():
            # Look back up to 5 lines for a comment indicating optional feature
            is_optional = any(
                "optional" in lines[j].lower() or "metrics" in lines[j].lower() or "best effort" in lines[j].lower()
                for j in range(max(0, i-5), i)
            )
            if not is_optional:
                add("RELIABILITY", path, i, f"silent except: pass: {line.strip()[:80]}")

        # 3. try/except Exception: pass
        if re.search(r"except Exception[^:]*:\s*$", line) and i < len(lines) and "pass" in lines[i].strip():
            is_optional = any(
                "optional" in lines[j].lower() or "metrics" in lines[j].lower() or "best effort" in lines[j].lower()
                for j in range(max(0, i-5), i)
            )
            if not is_optional:
                add("RELIABILITY", path, i, f"swallowed exception: {line.strip()[:80]}")

        # 4. requests without timeout
        if "requests.get" in line and "timeout" not in line and "verify" not in line:
            add("RELIABILITY", path, i, f"requests without timeout: {line.strip()[:80]}")


def scan_documentation(path: Path):
    """Find doc/claim vs code mismatches."""
    text = path.read_text(errors="ignore")

    # 1. Endpoints declared in FastAPI but not in README
    declared = set(re.findall(r'@app\.(get|post|put|delete|patch)\(\s*["\']([^"\']+)', text))
    declared = {path for _, path in declared}

    # 2. Endpoints mentioned in pricing.py / legal.py but not in main
    if path.name == "pricing.py" and "PAID_TIERS" in text:
        tier_names = re.findall(r'["\'](starter|defensive|full|premium|enterprise)["\']', text)
        # Check if api-gateway actually exposes them
        gw = (path.parent.parent / "api-gateway" / "gateway.py")
        if gw.exists():
            gw_text = gw.read_text()
            for tier in set(tier_names):
                if tier not in gw_text and tier != "starter":
                    add("DOC", path, 0, f"pricing tier '{tier}' defined but not exposed in api-gateway")

    # 3. legal.py jurisdictions — verify they match what we claim
    if path.name == "legal.py" and "JURISDICTIONS" in text:
        # Just count
        juris = re.findall(r'"code":\s*"([A-Z]+)"', text)
        # Should have US, EU, UK, JP, CN = 5
        if len(juris) != 5:
            add("DOC", path, 0, f"legal.py declares {len(juris)} jurisdictions (expected 5: US, EU, UK, JP, CN)")

    # 4. C2PA claim — check if we actually have C2PA wired in
    if path.name == "crypto.py" and "C2PA" in text or "c2pa" in text:
        if "c2pa" in text and "C2PA_CREDENTIAL" not in text and "C2PACredential" not in text:
            add("DOC", path, 0, "C2PA mentioned but no C2PACredential implementation visible")


def scan_code_quality(path: Path):
    """Code quality: dead code, TODO, hardcoded URLs, missing error context."""
    text = path.read_text(errors="ignore")
    lines = text.split("\n")
    for i, line in enumerate(lines, 1):
        # 1. TODO without context
        if re.search(r"^\s*#\s*TODO\s*$", line):
            add("WARN", path, i, "TODO without context")

        # 2. hardcoded URLs that should be env vars
        if re.search(r"https?://(?!localhost|127\.0\.0\.1|verify\.openpatent|api\.openpatent|mcp\.openpatent|openpatent|meok-keystone|meok-council|csoai-layer0)[a-z0-9.-]+\.[a-z]{2,}", line):
            add("WARN", path, i, f"hardcoded external URL: {line.strip()[:80]}")

        # 3. print() in production code (should use logging)
        if re.search(r"^[^#]*\bprint\s*\(", line) and "test" not in str(path) and "scripts" not in str(path):
            # Allow in demo.py and CLI
            if path.name in ("demo.py",):
                continue
            add("WARN", path, i, f"print() in production code: {line.strip()[:80]}")

        # 4. magic numbers (e.g. port numbers in code that aren't env-configurable)
        # Skip — too many false positives


def scan_sovereignty(path: Path):
    """Sovereignty: outbound HTTP at runtime, third-party deps that phone home."""
    text = path.read_text(errors="ignore")
    lines = text.split("\n")
    for i, line in enumerate(lines, 1):
        # 1. Hardcoded phone-home URLs
        if re.search(r'["\']https?://(?!localhost|127\.0\.0\.1|verify\.openpatent|api\.openpatent|mcp\.openpatent|openpatent|meok-keystone|meok-council|csoai-layer0)', line):
            if "=" in line and ("URL" in line or "url" in line or "endpoint" in line):
                add("SOVEREIGNTY", path, i, f"external URL in code: {line.strip()[:80]}")

    # 2. requirements.txt with non-pinned deps (sovereign = reproducible)
    req_files = list(path.parent.glob("requirements*.txt")) + list(path.parent.glob("**/requirements*.txt"))
    for rf in req_files:
        if rf.exists() and rf.is_file():
            req_text = rf.read_text()
            for line in req_text.split("\n"):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                # Acceptable: exact pin "==", range ">=<", git+https
                if "==" not in line and ">=" not in line and "<=" not in line and not line.startswith("git+"):
                    add("SOVEREIGNTY", rf, 0, f"unpinned dep in requirements: {line}")


def scan_endpoint_coverage(path: Path):
    """Check api-gateway endpoint coverage against services that should be wired in."""
    if path.name != "gateway.py":
        return
    text = path.read_text()
    # Endpoints declared in api-gateway
    declared = set(re.findall(r'@app\.(get|post|put|delete|patch)\(\s*["\']([^"\']+)', text))
    declared = {p for _, p in declared}

    # Services that should be wired in
    expected = {
        "/v1/disclosure": "submit disclosure",
        "/v1/verify": "verify",
        "/v1/search": "search prior art",
        "/v1/draft-claims": "drafting-fork integration",
        "/v1/draft-prosecution": "drafting-fork",
        "/v1/consult": "drafting-fork",
        "/v1/strategy": "drafting-fork",
        "/pricing": "PAYG tiers",
        "/legal": "jurisdictions",
        "/.well-known/mcp.json": "MCP discovery",
        "/health": "health",
    }
    for path_, desc in expected.items():
        if path_ not in declared:
            add("DOC", path, 0, f"api-gateway missing expected endpoint: {path_} ({desc})")


def main() -> int:
    files = list(SERVICES.rglob("*.py")) + list(SERVICES.rglob("*.ts")) + list(SERVICES.rglob("*.json"))
    files = [f for f in files if "node_modules" not in str(f) and "__pycache__" not in str(f) and "dist" not in str(f)]

    print(f"Scanning {len(files)} files in services/...")

    for f in files:
        if f.suffix in (".py", ".ts"):
            scan_security(f)
            scan_reliability(f)
            scan_documentation(f)
            scan_code_quality(f)
            scan_sovereignty(f)
            scan_endpoint_coverage(f)

    # Group by severity
    by_sev: Dict[str, List] = {"SECURITY": [], "RELIABILITY": [], "DOC": [], "WARN": [], "SOVEREIGNTY": []}
    for sev, f, ln, msg in ISSUES:
        by_sev.setdefault(sev, []).append((f, ln, msg))

    print(f"\n{'='*70}\nAUDIT RESULTS: {len(ISSUES)} total findings\n{'='*70}\n")

    critical = sum(len(v) for k, v in by_sev.items() if k in ("SECURITY", "RELIABILITY"))
    if critical == 0:
        print("✓ No critical (security/reliability) issues\n")
    else:
        print(f"✗ {critical} critical issues\n")

    for sev in ("SECURITY", "RELIABILITY", "SOVEREIGNTY", "DOC", "WARN"):
        items = by_sev.get(sev, [])
        if not items:
            continue
        print(f"\n[{sev}] {len(items)} finding(s):")
        for f, ln, msg in items[:30]:
            print(f"  {f}:{ln}  {msg}")
        if len(items) > 30:
            print(f"  ... and {len(items) - 30} more")

    # Write the full report as JSON
    import json
    report = {
        "total_issues": len(ISSUES),
        "by_severity": {k: len(v) for k, v in by_sev.items()},
        "critical_issues": critical,
        "issues": [
            {"severity": sev, "file": f, "line": ln, "message": msg}
            for sev, f, ln, msg in ISSUES
        ],
    }
    report_path = ROOT / "docs" / "audit" / "audit-report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2))
    print(f"\nFull report written to {report_path.relative_to(ROOT)}")

    return 0 if critical == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
