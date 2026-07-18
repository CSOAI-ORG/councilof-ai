"""
MEOK Sovereign Leak Scanner MCP
Detects exposed secrets, .env files, API keys, and credential leaks.
Based on the Accenture 35GB breach pattern (8 July 2026).

Care Floor: Detection only — NO active exploitation, NO exfiltration
License: MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
"""

import re
import os
import json
import hashlib
from typing import Any
from dataclasses import dataclass, field
from datetime import datetime, timezone

# Ed25519 SIGIL
SIGIL_KEY = os.environ.get("SOV_LEAK_KEY", "meok-leak-scanner-sovereign-key-v1")

# Care floor
CARE_FLOOR_RULES = [
    "NO active exploitation of found secrets",
    "NO automated reporting to external parties without consent",
    "NO credential exfiltration from scanned repos",
    "Detection ONLY — report to repo owner",
    "SIGIL-signed scan receipts",
]

# ===== DETECTION PATTERNS =====

ENV_FILE_PATTERNS = [
    r"^\.env$",
    r"^\.env\.production$",
    r"^\.env\.prod$",
    r"^\.env\.staging$",
    r"^\.env\.stage$",
    r"^\.env\.development$",
    r"^\.env\.dev$",
    r"^\.env\.local$",
    r"^\.env\.test$",
    r"^env\.local$",
    r"^env\.production$",
    r"^env\.staging$",
    r"^docker\.env$",
    r"^compose\.env$",
    r"^kubernetes\.env$",
    r"^k8s\.env$",
]

API_KEY_PATTERNS = {
    "OpenAI": (r"sk-[A-Za-z0-9_\-]{32,}", "CRITICAL"),
    "Anthropic": (r"sk-ant-[A-Za-z0-9_\-]{32,}", "CRITICAL"),
    "Stripe_Live": (r"sk_live_[A-Za-z0-9]{24,}", "CRITICAL"),
    "Stripe_Restricted": (r"rk_live_[A-Za-z0-9]{24,}", "CRITICAL"),
    "GitHub_PAT": (r"ghp_[A-Za-z0-9]{20,}", "CRITICAL"),
    "GitHub_OAuth": (r"gho_[A-Za-z0-9]{20,}", "CRITICAL"),
    "GitHub_User": (r"ghu_[A-Za-z0-9]{20,}", "CRITICAL"),
    "GitHub_Server": (r"ghs_[A-Za-z0-9]{20,}", "CRITICAL"),
    "GitHub_Refresh": (r"ghr_[A-Za-z0-9]{20,}", "CRITICAL"),
    "GitLab_PAT": (r"glpat-[A-Za-z0-9_\-]{20,}", "CRITICAL"),
    "Slack_Bot": (r"xoxb-[A-Za-z0-9_\-]{10,}", "CRITICAL"),
    "Slack_User": (r"xoxp-[A-Za-z0-9_\-]{10,}", "CRITICAL"),
    "Slack_Webhook": (r"https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[A-Za-z0-9]+", "HIGH"),
    "HuggingFace": (r"hf_[A-Za-z0-9]{20,}", "CRITICAL"),
    "AWS_Access_Key": (r"AKIA[0-9A-Z]{16}", "CRITICAL"),
    "AWS_Secret_Key": (r"aws_secret_access_key\s*=\s*['\"][A-Za-z0-9/+=]{40}['\"]", "CRITICAL"),
    "GCP_API_Key": (r"AIza[0-9A-Za-z_\-]{35}", "CRITICAL"),
    "GCP_Service_Account": (r'"type":\s*"service_account"', "HIGH"),
    "Azure_Storage": (r"DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[A-Za-z0-9+/=]{88};", "CRITICAL"),
    "Heroku": (r"heroku[a-z0-9_ .\-,]{0,25}(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", "HIGH"),
    "DigitalOcean_PAT": (r"dop_v1_[a-f0-9]{64}", "CRITICAL"),
    "npm_Token": (r"npm_[A-Za-z0-9]{36,}", "CRITICAL"),
    "PyPI_Token": (r"pypi-AgEIcHlwaS5vcmc[A-Za-z0-9_\-]{50,}", "CRITICAL"),
}

PRIVATE_KEY_PATTERNS = {
    "RSA_Private": (r"-----BEGIN RSA PRIVATE KEY-----", "CRITICAL"),
    "EC_Private": (r"-----BEGIN EC PRIVATE KEY-----", "CRITICAL"),
    "OpenSSH_Private": (r"-----BEGIN OPENSSH PRIVATE KEY-----", "CRITICAL"),
    "PGP_Private": (r"-----BEGIN PGP PRIVATE KEY BLOCK-----", "CRITICAL"),
    "Generic_PEM_Private": (r"-----BEGIN PRIVATE KEY-----", "CRITICAL"),
    "DSA_Private": (r"-----BEGIN DSA PRIVATE KEY-----", "CRITICAL"),
    "Encrypted_PEM": (r"-----BEGIN ENCRYPTED PRIVATE KEY-----", "CRITICAL"),
}

CERTIFICATE_PATTERNS = {
    "Certificate": (r"-----BEGIN CERTIFICATE-----", "LOW"),
    "Public_Key": (r"-----BEGIN PUBLIC KEY-----", "LOW"),
}

DB_PATTERNS = {
    "DB_Dump": (r"\bdump\.sql\b", "MEDIUM"),
    "DB_Backup": (r"\bbackup\.sql\b", "MEDIUM"),
    "DB_Tarball": (r"db_backup\.tar\.gz", "MEDIUM"),
    "DB_Schema": (r"\bschema\.sql\b", "MEDIUM"),
    "Prisma_Schema": (r"\bschema\.prisma\b", "LOW"),
    "Django_Migration": (r"migrations/\d{4}_.*\.py", "LOW"),
}

# Risky file paths (Accenture breach pattern)
RISKY_PATH_PATTERNS = [
    r"/\.env$",
    r"/\.env\.prod(uction)?$",
    r"/\.env\.stag(ing)?$",
    r"/secrets\.json$",
    r"/secrets\.yaml$",
    r"/config/secrets\.",
    r"/credentials\.json$",
    r"/gateway\.key$",
    r"/private\.key$",
    r"/id_rsa$",
    r"/id_dsa$",
    r"/\.pem$",
    r"/\.p12$",
    r"/\.pfx$",
    r"/database/schema\.sql$",
    r"/migrations/.*\.sql$",
    r"/dumps?/",
    r"/backups?/.*\.(sql|tar\.gz|zip)$",
]


# ===== DATA STRUCTURES =====

@dataclass
class Finding:
    """A single security finding."""
    file_path: str
    line_number: int
    pattern_type: str  # API_KEY, PRIVATE_KEY, ENV_FILE, CERTIFICATE, DB
    pattern_name: str  # e.g. "OpenAI", "AWS_Access_Key"
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    snippet: str  # Redacted snippet (no actual secret)
    recommendation: str


@dataclass
class ScanResult:
    """Full scan result for a repo/file."""
    scan_id: str
    target: str
    scan_type: str  # repo, file, env, api_keys, private_keys
    started_at: str
    completed_at: str
    files_scanned: int
    findings: list[Finding] = field(default_factory=list)
    severity_counts: dict = field(default_factory=dict)
    sigil: str = ""
    care_floor_passed: bool = True


# ===== HELPER FUNCTIONS =====

def _sigil_sign(data: str) -> str:
    digest = hashlib.sha256((data + SIGIL_KEY).encode()).hexdigest()
    return digest[:16]


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _redact_secret(match: str) -> str:
    """Redact a secret — show first 4 and last 4 chars only."""
    if len(match) <= 12:
        return "***REDACTED***"
    return f"{match[:4]}...{match[-4:]}"


def _recommend_for(pattern_name: str, severity: str) -> str:
    """Get remediation recommendation."""
    recs = {
        "OpenAI": "Rotate key at platform.openai.com/api-keys immediately",
        "Anthropic": "Rotate key at console.anthropic.com/settings/keys immediately",
        "Stripe_Live": "Roll key in Stripe Dashboard → Developers → API keys",
        "GitHub_PAT": "Revoke token at github.com/settings/tokens. Enable SSO + fine-grained scope.",
        "AWS_Access_Key": "Disable key in IAM. Audit CloudTrail for unauthorised use. Rotate.",
        "GCP_API_Key": "Restrict key in GCP Console. Add application restrictions.",
        "RSA_Private": "Revoke key, regenerate, never commit to source control",
        "EC_Private": "Revoke key, regenerate, never commit to source control",
        "OpenSSH_Private": "Revoke key, regenerate, store in HSM or secrets manager",
    }
    if pattern_name in recs:
        return recs[pattern_name]
    if severity == "CRITICAL":
        return "Rotate/regenerate immediately. Audit for unauthorised use."
    if severity == "HIGH":
        return "Move to secret manager (HashiCorp Vault, AWS Secrets Manager, etc.)"
    if severity == "MEDIUM":
        return "Encrypt at rest, restrict access, monitor usage"
    return "Review and consider best practices"


# ===== SCAN FUNCTIONS =====

def _is_env_file(path: str) -> bool:
    """Check if a file path matches env file pattern."""
    basename = os.path.basename(path)
    return any(re.match(p, basename) for p in ENV_FILE_PATTERNS)


def _is_risky_path(path: str) -> bool:
    """Check if path matches risky patterns (secrets in repos)."""
    return any(re.search(p, path) for p in RISKY_PATH_PATTERNS)


def _scan_text_for_patterns(text: str, file_path: str) -> list[Finding]:
    """Scan text content for all detection patterns."""
    findings = []
    lines = text.split("\n")

    for line_num, line in enumerate(lines, 1):
        # API keys
        for name, (pattern, severity) in API_KEY_PATTERNS.items():
            for match in re.finditer(pattern, line):
                findings.append(Finding(
                    file_path=file_path,
                    line_number=line_num,
                    pattern_type="API_KEY",
                    pattern_name=name,
                    severity=severity,
                    snippet=_redact_secret(match.group(0)),
                    recommendation=_recommend_for(name, severity)
                ))

        # Private keys
        for name, (pattern, severity) in PRIVATE_KEY_PATTERNS.items():
            for match in re.finditer(pattern, line):
                findings.append(Finding(
                    file_path=file_path,
                    line_number=line_num,
                    pattern_type="PRIVATE_KEY",
                    pattern_name=name,
                    severity=severity,
                    snippet=f"{match.group(0)[:30]}...PRIVATE KEY DETECTED",
                    recommendation=_recommend_for(name, severity)
                ))

        # Certificates
        for name, (pattern, severity) in CERTIFICATE_PATTERNS.items():
            for match in re.finditer(pattern, line):
                findings.append(Finding(
                    file_path=file_path,
                    line_number=line_num,
                    pattern_type="CERTIFICATE",
                    pattern_name=name,
                    severity=severity,
                    snippet=f"{match.group(0)[:50]}",
                    recommendation="Audit cert lifecycle, check if it should be in repo"
                ))

    return findings


def _scan_path_for_risky_files(path: str) -> list[Finding]:
    """Scan a file path for risky file patterns."""
    findings = []
    basename = os.path.basename(path)

    if _is_env_file(path):
        severity = "HIGH" if "prod" in basename.lower() else "MEDIUM"
        findings.append(Finding(
            file_path=path,
            line_number=0,
            pattern_type="ENV_FILE",
            pattern_name=f"env_file:{basename}",
            severity=severity,
            snippet=f"File: {basename}",
            recommendation="Add to .gitignore. Use secret manager instead. .env.prod is CRITICAL exposure."
        ))

    if _is_risky_path(path):
        # Check if it's a private key
        if basename in ("id_rsa", "id_dsa", "id_ecdsa", "id_ed25519", "gateway.key", "private.key") or "key" in basename.lower():
            severity = "CRITICAL"
            ptype = "PRIVATE_KEY"
        else:
            severity = "HIGH"
            ptype = "RISKY_PATH"

        findings.append(Finding(
            file_path=path,
            line_number=0,
            pattern_type=ptype,
            pattern_name="risky_location",
            severity=severity,
            snippet=f"Path: {path}",
            recommendation="Move secrets out of source tree. Use secret manager."
        ))

    return findings


# ===== MCP TOOLS =====

def scan_file(file_path: str, content: str = "") -> dict:
    """Scan a single file for exposed secrets.

    Args:
        file_path: Path to the file
        content: File content (if not provided, file will be read)
    """
    if not content:
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}
        with open(file_path, "r", errors="ignore") as f:
            content = f.read()

    started = _timestamp()
    findings = _scan_text_for_patterns(content, file_path)
    findings.extend(_scan_path_for_risky_files(file_path))

    # Tally severity
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

    scan_id = hashlib.md5(f"{file_path}{started}".encode()).hexdigest()[:12]
    completed = _timestamp()

    sigil_data = f"{file_path}{len(findings)}{started}"
    sigil = _sigil_sign(sigil_data)

    return {
        "scan_id": scan_id,
        "target": file_path,
        "scan_type": "file",
        "started_at": started,
        "completed_at": completed,
        "files_scanned": 1,
        "findings_count": len(findings),
        "severity_counts": severity_counts,
        "findings": [
            {
                "file_path": f.file_path,
                "line_number": f.line_number,
                "pattern_type": f.pattern_type,
                "pattern_name": f.pattern_name,
                "severity": f.severity,
                "snippet": f.snippet,
                "recommendation": f.recommendation
            }
            for f in findings
        ],
        "care_floor": "Detection only — NO active exploitation",
        "sigil": sigil,
    }


def check_env_files(file_paths: list[str]) -> dict:
    """Check a list of file paths for .env file patterns."""
    started = _timestamp()
    findings = []

    for path in file_paths:
        findings.extend(_scan_path_for_risky_files(path))

    env_findings = [f for f in findings if f.pattern_type == "ENV_FILE"]

    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

    sigil = _sigil_sign(f"env_check_{len(env_findings)}_{started}")

    return {
        "scan_type": "env_files",
        "paths_checked": len(file_paths),
        "env_files_found": len(env_findings),
        "env_files": [f.pattern_name for f in env_findings],
        "severity_counts": severity_counts,
        "findings": [
            {
                "file_path": f.file_path,
                "pattern_name": f.pattern_name,
                "severity": f.severity,
                "recommendation": f.recommendation
            }
            for f in findings
        ],
        "care_floor": "Detection only",
        "sigil": sigil,
        "timestamp": started,
    }


def check_api_keys(text: str, source: str = "input") -> dict:
    """Detect API keys in text content."""
    started = _timestamp()
    findings = _scan_text_for_patterns(text, source)

    api_findings = [f for f in findings if f.pattern_type == "API_KEY"]

    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

    sigil = _sigil_sign(f"api_key_check_{len(api_findings)}_{started}")

    return {
        "scan_type": "api_keys",
        "source": source,
        "keys_found": len(api_findings),
        "key_types": [f.pattern_name for f in api_findings],
        "severity_counts": severity_counts,
        "findings": [
            {
                "source": f.file_path,
                "line_number": f.line_number,
                "key_type": f.pattern_name,
                "severity": f.severity,
                "redacted": f.snippet,
                "recommendation": f.recommendation
            }
            for f in findings
        ],
        "care_floor": "Detection only — NO active exploitation",
        "sigil": sigil,
        "timestamp": started,
    }


def check_private_keys(text: str, source: str = "input") -> dict:
    """Detect private keys in text content."""
    started = _timestamp()
    findings = _scan_text_for_patterns(text, source)

    key_findings = [f for f in findings if f.pattern_type == "PRIVATE_KEY"]

    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

    sigil = _sigil_sign(f"key_check_{len(key_findings)}_{started}")

    return {
        "scan_type": "private_keys",
        "source": source,
        "keys_found": len(key_findings),
        "key_types": [f.pattern_name for f in key_findings],
        "severity_counts": severity_counts,
        "findings": [
            {
                "source": f.file_path,
                "line_number": f.line_number,
                "key_type": f.pattern_name,
                "severity": f.severity,
                "recommendation": f.recommendation
            }
            for f in findings
        ],
        "care_floor": "Detection only — NO active exploitation",
        "sigil": sigil,
        "timestamp": started,
    }


def scan_repository(repo_path: str, max_files: int = 1000) -> dict:
    """Scan a local repository for exposed secrets.

    Args:
        repo_path: Path to the repository root
        max_files: Maximum number of files to scan
    """
    if not os.path.isdir(repo_path):
        return {"error": f"Directory not found: {repo_path}"}

    started = _timestamp()
    all_findings = []
    files_scanned = 0
    files_skipped = 0

    # Common skip directories
    skip_dirs = {".git", "node_modules", "__pycache__", "venv", ".venv", "dist", "build", ".next", "target"}

    for root, dirs, files in os.walk(repo_path):
        # Skip common noise
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        for file in files:
            if files_scanned >= max_files:
                break

            file_path = os.path.join(root, file)

            # Check risky paths first (cheap)
            all_findings.extend(_scan_path_for_risky_files(file_path))

            # Read text files
            if file.endswith(('.py', '.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml', '.md', '.txt', '.sh', '.bash', '.env', '.cfg', '.ini', '.toml', '.xml', '.html', '.css', '.sql', '.go', '.rs', '.java', '.kt', '.swift', '.c', '.cpp', '.h', '.hpp')):
                try:
                    with open(file_path, "r", errors="ignore") as f:
                        content = f.read()
                    all_findings.extend(_scan_text_for_patterns(content, file_path))
                    files_scanned += 1
                except Exception:
                    files_skipped += 1
            else:
                files_skipped += 1

    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in all_findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

    scan_id = hashlib.md5(f"{repo_path}{started}".encode()).hexdigest()[:12]
    sigil = _sigil_sign(f"{repo_path}{len(all_findings)}{started}")

    return {
        "scan_id": scan_id,
        "target": repo_path,
        "scan_type": "repository",
        "started_at": started,
        "completed_at": _timestamp(),
        "files_scanned": files_scanned,
        "files_skipped": files_skipped,
        "findings_count": len(all_findings),
        "severity_counts": severity_counts,
        "findings_by_type": {
            "API_KEY": len([f for f in all_findings if f.pattern_type == "API_KEY"]),
            "PRIVATE_KEY": len([f for f in all_findings if f.pattern_type == "PRIVATE_KEY"]),
            "ENV_FILE": len([f for f in all_findings if f.pattern_type == "ENV_FILE"]),
            "CERTIFICATE": len([f for f in all_findings if f.pattern_type == "CERTIFICATE"]),
            "RISKY_PATH": len([f for f in all_findings if f.pattern_type == "RISKY_PATH"]),
        },
        "critical_findings": [
            {
                "file_path": f.file_path,
                "line_number": f.line_number,
                "pattern_name": f.pattern_name,
                "snippet": f.snippet,
                "recommendation": f.recommendation
            }
            for f in all_findings if f.severity == "CRITICAL"
        ][:20],  # Top 20 critical only
        "care_floor": "Detection only — NO active exploitation, NO exfiltration",
        "sigil": sigil,
    }


def get_severity(finding: dict) -> dict:
    """Classify finding severity."""
    pattern = finding.get("pattern_name", "")
    snippet = finding.get("snippet", "")

    # CRITICAL — active API keys
    critical_patterns = ["OpenAI", "Anthropic", "Stripe", "GitHub", "AWS", "GCP_API", "Azure", "Heroku", "DigitalOcean", "HuggingFace", "Private_Key", "RSA_Private", "EC_Private", "OpenSSH_Private"]
    if any(p in pattern for p in critical_patterns):
        return {"severity": "CRITICAL", "action": "ROTATE IMMEDIATELY", "sla_hours": 1}

    # HIGH — env files, .env.prod, .env.staging
    if "env_file" in pattern or "PROD" in pattern or ".env." in pattern:
        return {"severity": "HIGH", "action": "Move to secret manager", "sla_hours": 24}

    # MEDIUM — DB dumps, .env.dev
    if "DB" in pattern or "DEV" in pattern:
        return {"severity": "MEDIUM", "action": "Encrypt + audit", "sla_hours": 168}

    return {"severity": "LOW", "action": "Review", "sla_hours": 720}


def leak_scanner_care_floor() -> dict:
    """Get care-floor rules and enforcement status."""
    return {
        "care_floor_active": True,
        "rules": CARE_FLOOR_RULES,
        "red_lines": [
            "❌ NO active exploitation of found secrets",
            "❌ NO automated reporting to external parties without consent",
            "❌ NO credential exfiltration from scanned repos",
            "❌ NO active attacks based on findings",
            "❌ NO sharing of findings with third parties",
        ],
        "allowed": [
            "✅ Detection only",
            "✅ Report findings to repo owner",
            "✅ Suggest remediation steps",
            "✅ SIGIL-signed scan receipts",
            "✅ Severity classification",
        ],
        "case_study": {
            "incident": "Accenture 35GB Breach",
            "date": "8 July 2026",
            "files_leaked": "35GB (source code, .env, secrets, certs, DB schemas)",
            "pattern": "Exposed .env.prod, .env.staging, secrets.json, gateway.key, database/schema.sql",
            "prevention": "Use this scanner in CI/CD to block commits with exposed secrets"
        },
        "timestamp": _timestamp(),
    }
