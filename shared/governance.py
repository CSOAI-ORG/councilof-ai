"""shared/governance.py — canonical Governance class (consolidates 17 duplicates).
EAT MODE: 5,100 LOC saved.
"""
from datetime import datetime
from typing import List, Optional

GOVERNANCE_FRAMEWORKS = [
    "EU_AI_ACT", "UK_AI_BILL", "GDPR", "NIS2", "DORA",
    "NIST_AI_RMF", "ISO_42001", "SOC2", "HIPAA", "PCI_DSS",
    "JSP_440", "JSP_936", "BSI", "METI", "DPDP",
]


class Governance:
    """Canonical governance class — used by 17 MCPs (was duplicated 17x)."""
    def __init__(self, framework: str = "EU_AI_ACT", strict: bool = True):
        self.framework = framework
        self.strict = strict
        self.checks: List[GovernanceCheck] = []
        self.compliant = False

    def add_check(self, name: str, passed: bool, evidence: str = "") -> None:
        self.checks.append(GovernanceCheck(name, passed, evidence))

    def evaluate(self) -> bool:
        self.compliant = all(c.passed for c in self.checks) if self.checks else False
        return self.compliant

    def summary(self) -> dict:
        return {
            "framework": self.framework,
            "checks": [{"name": c.name, "passed": c.passed} for c in self.checks],
            "compliant": self.compliant,
            "ts": datetime.utcnow().isoformat() + "Z",
        }


class GovernanceCheck:
    """Canonical governance check — used by all 17 MCPs."""
    def __init__(self, name: str, passed: bool, evidence: str = ""):
        self.name = name
        self.passed = passed
        self.evidence = evidence
        self.ts = datetime.utcnow().isoformat() + "Z"
