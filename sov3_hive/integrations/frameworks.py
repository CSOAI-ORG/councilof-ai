"""
frameworks.py — 30-framework compliance library (13 live + 14 new + 3 closing).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class FrameworkStatus(str, Enum):
    LIVE = "live"
    SPEC = "spec"
    DRAFT = "draft"
    ASPIRATIONAL = "aspirational"


@dataclass
class ComplianceFramework:
    id: str
    name: str
    jurisdiction: str
    status: FrameworkStatus
    effective: str = ""
    source_url: str = ""
    articles: List[str] = field(default_factory=list)
    required_articles: int = 0
    notes: str = ""


LIVE_13: List[ComplianceFramework] = [
    ComplianceFramework("eu-ai-act",     "EU AI Act",                  "EU",         FrameworkStatus.LIVE, "2026-08-02", "https://eur-lex.europa.eu/eli/reg/2024/1689", 113, 50, "The 50-day cliff. Primary regulation."),
    ComplianceFramework("nist-ai-rmf",   "NIST AI RMF 1.0",            "US",         FrameworkStatus.LIVE, "2023-01-26", "https://www.nist.gov/itl/ai-risk-management-framework",  0,  7, "Voluntary, but the US federal de-facto baseline."),
    ComplianceFramework("iso-42001",     "ISO/IEC 42001:2023",         "GLOBAL",     FrameworkStatus.LIVE, "2023-12-18", "https://www.iso.org/standard/81270.html",  0, 10, "First global AI management system standard."),
    ComplianceFramework("iso-27001",     "ISO/IEC 27001:2022",         "GLOBAL",     FrameworkStatus.LIVE, "2022-10-25", "https://www.iso.org/standard/27001", 0, 10, "Information security baseline."),
    ComplianceFramework("soc2",          "AICPA SOC 2 Type II",        "US",         FrameworkStatus.LIVE, "2018-05-01", "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2", 0, 5, "Service-organization trust."),
    ComplianceFramework("hipaa",         "HIPAA Security Rule",        "US",         FrameworkStatus.LIVE, "2003-04-21", "https://www.hhs.gov/hipaa/for-professionals/security", 0, 4, "Healthcare PHI baseline."),
    ComplianceFramework("gdpr",          "GDPR (EU 2016/679)",         "EU",         FrameworkStatus.LIVE, "2018-05-25", "https://eur-lex.europa.eu/eli/reg/2016/679", 99, 0, "Personal data baseline."),
    ComplianceFramework("nis2",          "NIS2 Directive (EU 2022/2555)","EU",        FrameworkStatus.LIVE, "2024-10-17", "https://eur-lex.europa.eu/eli/dir/2022/2555",  0, 4, "Cybersecurity for essential entities."),
    ComplianceFramework("dora",          "DORA (EU 2022/2554)",        "EU",         FrameworkStatus.LIVE, "2025-01-17", "https://eur-lex.europa.eu/eli/reg/2022/2554",  0, 5, "Financial services operational resilience."),
    ComplianceFramework("cra",           "Cyber Resilience Act (EU)","EU",           FrameworkStatus.LIVE, "2027-12-11", "https://eur-lex.europa.eu/eli/reg/2024/2847",  0, 3, "Product cybersecurity baseline."),
    ComplianceFramework("pci-dss",       "PCI-DSS v4.0",               "GLOBAL",     FrameworkStatus.LIVE, "2024-04-01", "https://www.pcisecuritystandards.org/standards/pci-dss/", 0, 6, "Card payment data."),
    ComplianceFramework("sox",           "Sarbanes-Oxley (US 2002)",   "US",         FrameworkStatus.LIVE, "2002-07-30", "https://www.sec.gov/spotlight/sarbanes-oxley.htm",  0, 3, "Public-company financial reporting."),
    ComplianceFramework("tc260",         "TC260 WG8 AI Standards",     "China",      FrameworkStatus.LIVE, "2024-07-01", "http://www.tc260.org.cn/",  0, 4, "China's AI safety standards."),
]

# 14 missing frameworks — added today
NEW_14: List[ComplianceFramework] = [
    ComplianceFramework("pipl",          "Personal Information Protection Law", "China",    FrameworkStatus.LIVE, "2021-11-01", "http://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_311005.html", 74, 0, "PIPL — China's GDPR."),
    ComplianceFramework("mas-trmg",      "MAS TRMG (Singapore)",       "Singapore",  FrameworkStatus.LIVE, "2019-01-01", "https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines", 0, 4, "MAS technology risk — financial sector."),
    ComplianceFramework("appi",          "APPI (Japan)",               "Japan",      FrameworkStatus.LIVE, "2022-04-01", "https://www.ppc.go.jp/en/legal/", 0, 3, "Act on Protection of Personal Information."),
    ComplianceFramework("sk-ai-basic",   "AI Basic Act (South Korea)", "South Korea", FrameworkStatus.LIVE, "2026-01-26", "https://www.law.go.kr/", 0, 4, "Korea's first comprehensive AI law."),
    ComplianceFramework("india-dpdp",    "DPDP Act 2023 (India)",      "India",      FrameworkStatus.LIVE, "2023-08-11", "https://www.meity.gov.in/content/data-protection-framework", 0, 4, "Digital Personal Data Protection."),
    ComplianceFramework("fda-samd",      "FDA SaMD Guidance",          "US",         FrameworkStatus.LIVE, "2021-09-22", "https://www.fda.gov/medical-devices/software-medical-device-samd", 0, 4, "Software as a Medical Device."),
    ComplianceFramework("fda-ai-ml",     "FDA AI/ML Action Plan",      "US",         FrameworkStatus.LIVE, "2021-01-12", "https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-software-medical-device", 0, 3, "AI/ML in medical devices lifecycle."),
    ComplianceFramework("eu-mdr",        "EU MDR 2017/745",            "EU",         FrameworkStatus.LIVE, "2021-05-26", "https://eur-lex.europa.eu/eli/reg/2017/745", 0, 3, "Medical Device Regulation."),
    ComplianceFramework("owasp-agentic", "OWASP Agentic AI Top 10",    "GLOBAL",     FrameworkStatus.LIVE, "2024-12-01", "https://owasp.org/www-project-top-10-for-large-language-model-applications/", 0, 10, "OWASP's top 10 risks for LLM/agent systems."),
    ComplianceFramework("aisi-uk",       "UK AISI Inspect",            "UK",         FrameworkStatus.LIVE, "2024-02-09", "https://www.aisi.gov.uk/", 0, 4, "UK AI Safety Institute evaluation framework."),
    ComplianceFramework("nist-cyber",    "NIST CSF 2.0",               "US",         FrameworkStatus.LIVE, "2024-02-26", "https://www.nist.gov/cyberframework", 0, 6, "Cybersecurity Framework — applies to AI infra."),
    ComplianceFramework("ftc-section-5", "FTC Section 5 (US)",         "US",         FrameworkStatus.LIVE, "1914-09-26", "https://www.ftc.gov/enforcement/statutes/federal-trade-commission-act", 0, 2, "Unfair/deceptive practices — AI marketed falsely."),
    ComplianceFramework("ada-2024",      "ADA Title III (US)",         "US",         FrameworkStatus.LIVE, "1990-07-26", "https://www.ada.gov/", 0, 2, "Disability access — AI must not discriminate."),
    ComplianceFramework("wp29-aiact",    "WP29 AI Guidelines (legacy)","GLOBAL",     FrameworkStatus.LIVE, "2019-04-08", "https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-artificial-intelligence_en", 0, 3, "Predecessor to EU AI Act — still cited."),
]

EXTRA_3: List[ComplianceFramework] = [
    ComplianceFramework("ccpa-cpra",     "CCPA + CPRA (California)",   "US",         FrameworkStatus.LIVE, "2023-01-01", "https://oag.ca.gov/privacy/ccpa", 0, 3, "California privacy + AI amendments."),
    ComplianceFramework("fedramp",       "FedRAMP (US Federal Cloud)", "US",         FrameworkStatus.LIVE, "2011-12-08", "https://www.fedramp.gov/", 0, 3, "Federal cloud authorization — AI workloads."),
    ComplianceFramework("ieee-7000",     "IEEE 7000-2021",             "GLOBAL",     FrameworkStatus.LIVE, "2021-09-17", "https://standards.ieee.org/ieee/7000/7191/", 0, 3, "Ethical concerns in system design."),
]


def all_frameworks() -> List[ComplianceFramework]:
    return LIVE_13 + NEW_14 + EXTRA_3


def by_id(fid: str) -> Optional[ComplianceFramework]:
    for f in all_frameworks():
        if f.id == fid:
            return f
    return None


def live_count() -> int:
    return sum(1 for f in all_frameworks() if f.status == FrameworkStatus.LIVE)


def frameworks_live_count() -> int:
    """Alias for live_count() — named for explicit imports."""
    return live_count()


# ---------------------------------------------------------------------------
# the 14 missing-framework MCPs
# ---------------------------------------------------------------------------

@dataclass
class FrameworkEval:
    framework_id: str
    score: float
    passed: int
    total: int
    blockers: List[str] = field(default_factory=list)
    notes: str = ""


def _eval_simple(fid: str, evidence: Dict[str, Any], required: int) -> FrameworkEval:
    if not evidence:
        return FrameworkEval(fid, 0.0, 0, required, [f"{fid}-main"])
    present = sum(1 for k, v in evidence.items() if v)
    denom = max(required, len(evidence), 1)
    score = round(min(100.0, 100.0 * present / denom), 2)
    blockers = [k for k, v in evidence.items() if not v and "blocker" in str(k).lower()]
    return FrameworkEval(fid, score, present, len(evidence), blockers, "default-eval")


class PIPLMCP:
    id = "pipl"; name = "PIPL (China)"
    def evaluate(self, e): return _eval_simple(self.id, e, 8)

class MAS_TRMGMCP:
    id = "mas-trmg"; name = "MAS TRMG (Singapore)"
    def evaluate(self, e): return _eval_simple(self.id, e, 6)

class APPIMCP:
    id = "appi"; name = "APPI (Japan)"
    def evaluate(self, e): return _eval_simple(self.id, e, 5)

class SkaibaMCP:
    id = "sk-ai-basic"; name = "AI Basic Act (South Korea)"
    def evaluate(self, e): return _eval_simple(self.id, e, 5)

class IndiaDPDPMCP:
    id = "india-dpdp"; name = "DPDP Act 2023 (India)"
    def evaluate(self, e): return _eval_simple(self.id, e, 6)

class FDASaMDMCP:
    id = "fda-samd"; name = "FDA SaMD"
    def evaluate(self, e): return _eval_simple(self.id, e, 5)

class FDA_AIMLMCP:
    id = "fda-ai-ml"; name = "FDA AI/ML Action Plan"
    def evaluate(self, e): return _eval_simple(self.id, e, 4)

class EUMDRMCP:
    id = "eu-mdr"; name = "EU MDR"
    def evaluate(self, e): return _eval_simple(self.id, e, 4)

class OWSPAgenticMCP:
    id = "owasp-agentic"; name = "OWASP Agentic AI Top 10"
    def evaluate(self, e): return _eval_simple(self.id, e, 10)

class AISIUKMCP:
    id = "aisi-uk"; name = "UK AISI"
    def evaluate(self, e): return _eval_simple(self.id, e, 5)

class NISTCyberMCP:
    id = "nist-cyber"; name = "NIST CSF 2.0"
    def evaluate(self, e): return _eval_simple(self.id, e, 6)

class FTCSection5MCP:
    id = "ftc-section-5"; name = "FTC Section 5"
    def evaluate(self, e): return _eval_simple(self.id, e, 3)

class ADAMCP:
    id = "ada-2024"; name = "ADA Title III"
    def evaluate(self, e): return _eval_simple(self.id, e, 3)

class WP29AIActMCP:
    id = "wp29-aiact"; name = "WP29 AI Guidelines (legacy)"
    def evaluate(self, e): return _eval_simple(self.id, e, 4)


REGISTRY_NEW_14 = {
    "pipl":          PIPLMCP,
    "mas-trmg":      MAS_TRMGMCP,
    "appi":          APPIMCP,
    "sk-ai-basic":   SkaibaMCP,
    "india-dpdp":    IndiaDPDPMCP,
    "fda-samd":      FDASaMDMCP,
    "fda-ai-ml":     FDA_AIMLMCP,
    "eu-mdr":        EUMDRMCP,
    "owasp-agentic": OWSPAgenticMCP,
    "aisi-uk":       AISIUKMCP,
    "nist-cyber":    NISTCyberMCP,
    "ftc-section-5": FTCSection5MCP,
    "ada-2024":      ADAMCP,
    "wp29-aiact":    WP29AIActMCP,
}
