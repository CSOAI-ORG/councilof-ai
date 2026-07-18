"""
COAI MVP - Multi-Framework Compliance Engine
Maps and evaluates compliance across EU AI Act, NIST AI RMF, TC260, and other frameworks.

This module implements the core compliance logic that makes COAI the "Western TC260".
"""

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


# =============================================================================
# FRAMEWORK DEFINITIONS
# =============================================================================

class Framework(Enum):
    """Supported regulatory frameworks."""
    EU_AI_ACT = "eu_ai_act"
    NIST_AI_RMF = "nist_ai_rmf"
    TC260 = "tc260"
    UK_AI = "uk_ai"
    CANADA_AIDA = "canada_aida"
    AUSTRALIA_AI = "australia_ai"


class RiskLevel(Enum):
    """EU AI Act risk classification levels."""
    UNACCEPTABLE = "unacceptable"
    HIGH = "high"
    LIMITED = "limited"
    MINIMAL = "minimal"


class PDCAPhase(Enum):
    """PDCA continuous improvement phases."""
    PLAN = "plan"
    DO = "do"
    CHECK = "check"
    ACT = "act"


# =============================================================================
# REQUIREMENT DEFINITIONS
# =============================================================================

@dataclass
class Requirement:
    """A single compliance requirement from a framework."""
    id: str
    framework: Framework
    reference: str  # e.g., "Article 14", "GOVERN-1.1", "Section 5.9"
    title: str
    description: str
    category: str  # e.g., "human_oversight", "transparency", "data_governance"
    risk_levels: List[RiskLevel]  # Which risk levels this applies to
    mandatory: bool
    pdca_phase: PDCAPhase
    
    # Cross-framework mappings
    mapped_requirements: List[str] = field(default_factory=list)


@dataclass
class ComplianceCheck:
    """Result of checking a single requirement."""
    requirement_id: str
    status: str  # "compliant", "partially_compliant", "non_compliant", "not_applicable"
    score: float  # 0.0 to 1.0
    evidence: str
    findings: List[str]
    recommendations: List[str]
    checked_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ComplianceReport:
    """Complete compliance report for an AI system."""
    ai_system_id: str
    ai_system_name: str
    frameworks_evaluated: List[Framework]
    risk_level: RiskLevel
    overall_score: float
    overall_status: str
    pdca_phase: PDCAPhase
    
    framework_scores: Dict[str, float] = field(default_factory=dict)
    checks: List[ComplianceCheck] = field(default_factory=list)
    summary: str = ""
    
    created_at: datetime = field(default_factory=datetime.utcnow)


# =============================================================================
# REQUIREMENT DATABASE
# =============================================================================

class RequirementDatabase:
    """
    Database of all compliance requirements across frameworks.
    
    This is the heart of COAI's multi-framework compliance capability.
    """
    
    def __init__(self):
        self.requirements: Dict[str, Requirement] = {}
        self._load_eu_ai_act_requirements()
        self._load_nist_requirements()
        self._load_tc260_requirements()
        logger.info(f"Loaded {len(self.requirements)} compliance requirements")
    
    def _load_eu_ai_act_requirements(self) -> None:
        """Load EU AI Act requirements (key articles for high-risk AI)."""
        eu_requirements = [
            Requirement(
                id="EU-ART-9",
                framework=Framework.EU_AI_ACT,
                reference="Article 9",
                title="Risk Management System",
                description="High-risk AI systems shall have a risk management system established, implemented, documented and maintained.",
                category="risk_management",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.PLAN,
                mapped_requirements=["NIST-GOVERN-1", "TC260-5.1"]
            ),
            Requirement(
                id="EU-ART-10",
                framework=Framework.EU_AI_ACT,
                reference="Article 10",
                title="Data and Data Governance",
                description="High-risk AI systems shall be developed using training, validation and testing data sets that meet quality criteria.",
                category="data_governance",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["NIST-MAP-1", "TC260-5.5"]
            ),
            Requirement(
                id="EU-ART-11",
                framework=Framework.EU_AI_ACT,
                reference="Article 11",
                title="Technical Documentation",
                description="Technical documentation shall be drawn up before the AI system is placed on the market.",
                category="documentation",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["NIST-GOVERN-4", "TC260-5.14"]
            ),
            Requirement(
                id="EU-ART-12",
                framework=Framework.EU_AI_ACT,
                reference="Article 12",
                title="Record-keeping",
                description="High-risk AI systems shall technically allow for automatic recording of events (logs).",
                category="logging",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["NIST-MEASURE-2", "TC260-5.10"]
            ),
            Requirement(
                id="EU-ART-13",
                framework=Framework.EU_AI_ACT,
                reference="Article 13",
                title="Transparency and Information",
                description="High-risk AI systems shall be designed to ensure their operation is sufficiently transparent.",
                category="transparency",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["NIST-MAP-3", "TC260-5.6"]
            ),
            Requirement(
                id="EU-ART-14",
                framework=Framework.EU_AI_ACT,
                reference="Article 14",
                title="Human Oversight",
                description="High-risk AI systems shall be designed to be effectively overseen by natural persons.",
                category="human_oversight",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.CHECK,
                mapped_requirements=["NIST-GOVERN-3", "TC260-5.12"]
            ),
            Requirement(
                id="EU-ART-15",
                framework=Framework.EU_AI_ACT,
                reference="Article 15",
                title="Accuracy, Robustness and Cybersecurity",
                description="High-risk AI systems shall achieve appropriate levels of accuracy, robustness and cybersecurity.",
                category="security",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["NIST-MEASURE-1", "TC260-5.3"]
            ),
            Requirement(
                id="EU-ART-50",
                framework=Framework.EU_AI_ACT,
                reference="Article 50",
                title="Transparency for AI Interacting with Persons",
                description="AI systems intended to interact with natural persons shall inform that they are interacting with an AI.",
                category="transparency",
                risk_levels=[RiskLevel.LIMITED, RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["NIST-MAP-3", "TC260-5.6"]
            ),
            Requirement(
                id="EU-ART-72",
                framework=Framework.EU_AI_ACT,
                reference="Article 72",
                title="Post-market Monitoring",
                description="Providers shall establish and document a post-market monitoring system.",
                category="monitoring",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.CHECK,
                mapped_requirements=["NIST-MANAGE-2", "TC260-6.3"]
            ),
            Requirement(
                id="EU-ART-73",
                framework=Framework.EU_AI_ACT,
                reference="Article 73",
                title="Incident Reporting",
                description="Providers shall report serious incidents to market surveillance authorities.",
                category="incident_reporting",
                risk_levels=[RiskLevel.HIGH],
                mandatory=True,
                pdca_phase=PDCAPhase.ACT,
                mapped_requirements=["NIST-MANAGE-4", "TC260-5.9"]
            ),
        ]
        
        for req in eu_requirements:
            self.requirements[req.id] = req
    
    def _load_nist_requirements(self) -> None:
        """Load NIST AI RMF requirements (key categories)."""
        nist_requirements = [
            # GOVERN Function
            Requirement(
                id="NIST-GOVERN-1",
                framework=Framework.NIST_AI_RMF,
                reference="GOVERN 1",
                title="Policies and Procedures",
                description="Policies, processes, procedures, and practices are in place to map, measure, and manage AI risks.",
                category="governance",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.PLAN,
                mapped_requirements=["EU-ART-9", "TC260-5.1"]
            ),
            Requirement(
                id="NIST-GOVERN-2",
                framework=Framework.NIST_AI_RMF,
                reference="GOVERN 2",
                title="Accountability Structures",
                description="Accountability structures are in place so that the appropriate teams and individuals are empowered.",
                category="accountability",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.PLAN,
                mapped_requirements=["EU-ART-14", "TC260-5.12"]
            ),
            Requirement(
                id="NIST-GOVERN-3",
                framework=Framework.NIST_AI_RMF,
                reference="GOVERN 3",
                title="Workforce Diversity and Training",
                description="Workforce diversity, equity, inclusion, and accessibility processes are prioritized.",
                category="human_oversight",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.PLAN,
                mapped_requirements=["EU-ART-14", "TC260-5.12"]
            ),
            Requirement(
                id="NIST-GOVERN-4",
                framework=Framework.NIST_AI_RMF,
                reference="GOVERN 4",
                title="Organizational Documentation",
                description="Organizational teams document AI system requirements and risks.",
                category="documentation",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.PLAN,
                mapped_requirements=["EU-ART-11", "TC260-5.14"]
            ),
            # MAP Function
            Requirement(
                id="NIST-MAP-1",
                framework=Framework.NIST_AI_RMF,
                reference="MAP 1",
                title="Context Establishment",
                description="Context is established and understood for AI system design and deployment.",
                category="context",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.PLAN,
                mapped_requirements=["EU-ART-10", "TC260-5.5"]
            ),
            Requirement(
                id="NIST-MAP-3",
                framework=Framework.NIST_AI_RMF,
                reference="MAP 3",
                title="AI Capabilities and Limitations",
                description="AI capabilities, targeted usage, goals, and expected benefits are understood.",
                category="transparency",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.PLAN,
                mapped_requirements=["EU-ART-13", "TC260-5.6"]
            ),
            # MEASURE Function
            Requirement(
                id="NIST-MEASURE-1",
                framework=Framework.NIST_AI_RMF,
                reference="MEASURE 1",
                title="Risk Measurement Approaches",
                description="Appropriate methods and metrics are identified and applied.",
                category="measurement",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.CHECK,
                mapped_requirements=["EU-ART-15", "TC260-5.3"]
            ),
            Requirement(
                id="NIST-MEASURE-2",
                framework=Framework.NIST_AI_RMF,
                reference="MEASURE 2",
                title="AI System Evaluation",
                description="AI systems are evaluated for trustworthy characteristics.",
                category="evaluation",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.CHECK,
                mapped_requirements=["EU-ART-12", "TC260-5.10"]
            ),
            # MANAGE Function
            Requirement(
                id="NIST-MANAGE-2",
                framework=Framework.NIST_AI_RMF,
                reference="MANAGE 2",
                title="Risk Treatment Strategies",
                description="Strategies to maximize AI benefits and minimize negative impacts are planned.",
                category="risk_treatment",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.ACT,
                mapped_requirements=["EU-ART-72", "TC260-6.3"]
            ),
            Requirement(
                id="NIST-MANAGE-4",
                framework=Framework.NIST_AI_RMF,
                reference="MANAGE 4",
                title="Risk Treatment and Response",
                description="Incidents and errors are communicated to relevant AI actors.",
                category="incident_response",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.ACT,
                mapped_requirements=["EU-ART-73", "TC260-5.9"]
            ),
        ]
        
        for req in nist_requirements:
            self.requirements[req.id] = req
    
    def _load_tc260_requirements(self) -> None:
        """Load TC260 AI Safety Governance Framework requirements."""
        tc260_requirements = [
            Requirement(
                id="TC260-5.1",
                framework=Framework.TC260,
                reference="Section 5.1",
                title="AI Safety Strategy",
                description="Establish comprehensive AI safety governance strategy and organizational structure.",
                category="governance",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.PLAN,
                mapped_requirements=["EU-ART-9", "NIST-GOVERN-1"]
            ),
            Requirement(
                id="TC260-5.3",
                framework=Framework.TC260,
                reference="Section 5.3",
                title="Model Security Assessment",
                description="Conduct security assessment of AI models including adversarial robustness.",
                category="security",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED],
                mandatory=False,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["EU-ART-15", "NIST-MEASURE-1"]
            ),
            Requirement(
                id="TC260-5.5",
                framework=Framework.TC260,
                reference="Section 5.5",
                title="Data Security Management",
                description="Implement data security measures throughout the AI lifecycle.",
                category="data_governance",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["EU-ART-10", "NIST-MAP-1"]
            ),
            Requirement(
                id="TC260-5.6",
                framework=Framework.TC260,
                reference="Section 5.6",
                title="Transparency and Explainability",
                description="Ensure AI system decisions are transparent and explainable to users.",
                category="transparency",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED],
                mandatory=False,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["EU-ART-13", "NIST-MAP-3"]
            ),
            Requirement(
                id="TC260-5.9",
                framework=Framework.TC260,
                reference="Section 5.9",
                title="Threat Intelligence Sharing",
                description="Participate in AI safety threat intelligence sharing mechanisms.",
                category="incident_reporting",
                risk_levels=[RiskLevel.HIGH],
                mandatory=False,
                pdca_phase=PDCAPhase.ACT,
                mapped_requirements=["EU-ART-73", "NIST-MANAGE-4"]
            ),
            Requirement(
                id="TC260-5.10",
                framework=Framework.TC260,
                reference="Section 5.10",
                title="Audit and Logging",
                description="Maintain comprehensive audit trails and logging for AI operations.",
                category="logging",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED],
                mandatory=False,
                pdca_phase=PDCAPhase.CHECK,
                mapped_requirements=["EU-ART-12", "NIST-MEASURE-2"]
            ),
            Requirement(
                id="TC260-5.12",
                framework=Framework.TC260,
                reference="Section 5.12",
                title="Human-Machine Collaboration",
                description="Establish effective human oversight and intervention mechanisms.",
                category="human_oversight",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED],
                mandatory=False,
                pdca_phase=PDCAPhase.CHECK,
                mapped_requirements=["EU-ART-14", "NIST-GOVERN-3"]
            ),
            Requirement(
                id="TC260-5.14",
                framework=Framework.TC260,
                reference="Section 5.14",
                title="Compliance Documentation",
                description="Maintain documentation demonstrating compliance with safety requirements.",
                category="documentation",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED, RiskLevel.MINIMAL],
                mandatory=False,
                pdca_phase=PDCAPhase.DO,
                mapped_requirements=["EU-ART-11", "NIST-GOVERN-4"]
            ),
            Requirement(
                id="TC260-6.3",
                framework=Framework.TC260,
                reference="Section 6.3",
                title="Continuous Monitoring",
                description="Implement continuous monitoring of AI system performance and safety.",
                category="monitoring",
                risk_levels=[RiskLevel.HIGH, RiskLevel.LIMITED],
                mandatory=False,
                pdca_phase=PDCAPhase.CHECK,
                mapped_requirements=["EU-ART-72", "NIST-MANAGE-2"]
            ),
        ]
        
        for req in tc260_requirements:
            self.requirements[req.id] = req
    
    def get_requirements_for_framework(
        self,
        framework: Framework,
        risk_level: Optional[RiskLevel] = None
    ) -> List[Requirement]:
        """Get all requirements for a specific framework, optionally filtered by risk level."""
        reqs = [r for r in self.requirements.values() if r.framework == framework]
        if risk_level:
            reqs = [r for r in reqs if risk_level in r.risk_levels]
        return reqs
    
    def get_requirements_for_pdca_phase(self, phase: PDCAPhase) -> List[Requirement]:
        """Get all requirements for a specific PDCA phase."""
        return [r for r in self.requirements.values() if r.pdca_phase == phase]
    
    def get_cross_framework_mapping(self, requirement_id: str) -> Dict[str, List[str]]:
        """Get cross-framework mappings for a requirement."""
        req = self.requirements.get(requirement_id)
        if not req:
            return {}
        
        mapping = {req.framework.value: [req.reference]}
        for mapped_id in req.mapped_requirements:
            mapped_req = self.requirements.get(mapped_id)
            if mapped_req:
                fw = mapped_req.framework.value
                if fw not in mapping:
                    mapping[fw] = []
                mapping[fw].append(mapped_req.reference)
        
        return mapping


# =============================================================================
# COMPLIANCE EVALUATOR
# =============================================================================

class ComplianceEvaluator:
    """
    Evaluates AI systems against compliance requirements.
    
    This is the core evaluation engine that powers COAI's compliance assessments.
    """
    
    def __init__(self):
        self.requirement_db = RequirementDatabase()
    
    def classify_risk_level(self, ai_system_data: Dict[str, Any]) -> RiskLevel:
        """
        Classify the risk level of an AI system according to EU AI Act Annex III.
        
        This is a simplified implementation. In production, this would involve
        detailed analysis of the AI system's use case, sector, and potential impacts.
        """
        # Extract relevant fields
        use_case = ai_system_data.get("use_case", "").lower()
        sector = ai_system_data.get("sector", "").lower()
        model_type = ai_system_data.get("model_type", "").lower()
        
        # Check for unacceptable risk (Article 5 prohibitions)
        unacceptable_keywords = [
            "social scoring", "subliminal manipulation", "exploitation of vulnerabilities",
            "real-time biometric identification", "emotion recognition workplace"
        ]
        if any(kw in use_case for kw in unacceptable_keywords):
            return RiskLevel.UNACCEPTABLE
        
        # Check for high-risk (Annex III categories)
        high_risk_sectors = [
            "biometric", "critical infrastructure", "education", "employment",
            "essential services", "law enforcement", "migration", "justice",
            "democratic processes"
        ]
        high_risk_uses = [
            "recruitment", "credit scoring", "insurance", "medical diagnosis",
            "legal interpretation", "border control", "evidence evaluation"
        ]
        
        if any(s in sector for s in high_risk_sectors) or any(u in use_case for u in high_risk_uses):
            return RiskLevel.HIGH
        
        # Check for limited risk (transparency obligations)
        limited_risk_keywords = [
            "chatbot", "deepfake", "emotion recognition", "biometric categorization",
            "content generation"
        ]
        if any(kw in use_case or kw in model_type for kw in limited_risk_keywords):
            return RiskLevel.LIMITED
        
        # Default to minimal risk
        return RiskLevel.MINIMAL
    
    def evaluate_requirement(
        self,
        requirement: Requirement,
        ai_system_data: Dict[str, Any],
        evidence_data: Dict[str, Any]
    ) -> ComplianceCheck:
        """
        Evaluate a single compliance requirement.
        
        This is a simplified implementation. In production, this would involve
        the 33-agent council analyzing the evidence and voting on compliance.
        """
        # Simulate evaluation based on evidence
        has_evidence = requirement.category in evidence_data
        evidence_quality = evidence_data.get(requirement.category, {}).get("quality", 0)
        
        findings = []
        recommendations = []
        
        if has_evidence and evidence_quality >= 0.8:
            status = "compliant"
            score = evidence_quality
        elif has_evidence and evidence_quality >= 0.5:
            status = "partially_compliant"
            score = evidence_quality
            findings.append(f"Evidence for {requirement.title} is incomplete.")
            recommendations.append(f"Strengthen documentation for {requirement.category}.")
        else:
            status = "non_compliant"
            score = evidence_quality if has_evidence else 0.0
            findings.append(f"No adequate evidence for {requirement.title}.")
            recommendations.append(f"Implement controls for {requirement.reference}: {requirement.description}")
        
        return ComplianceCheck(
            requirement_id=requirement.id,
            status=status,
            score=score,
            evidence=str(evidence_data.get(requirement.category, {})),
            findings=findings,
            recommendations=recommendations
        )
    
    def evaluate_framework(
        self,
        framework: Framework,
        ai_system_data: Dict[str, Any],
        evidence_data: Dict[str, Any],
        risk_level: RiskLevel
    ) -> Tuple[float, List[ComplianceCheck]]:
        """Evaluate all requirements for a specific framework."""
        requirements = self.requirement_db.get_requirements_for_framework(framework, risk_level)
        
        checks = []
        total_score = 0.0
        mandatory_count = 0
        
        for req in requirements:
            check = self.evaluate_requirement(req, ai_system_data, evidence_data)
            checks.append(check)
            
            if req.mandatory:
                total_score += check.score
                mandatory_count += 1
            else:
                total_score += check.score * 0.5  # Optional requirements weighted less
        
        # Calculate average score
        if mandatory_count > 0:
            avg_score = total_score / (mandatory_count + (len(requirements) - mandatory_count) * 0.5)
        else:
            avg_score = total_score / len(requirements) if requirements else 0.0
        
        return avg_score, checks
    
    def generate_compliance_report(
        self,
        ai_system_id: str,
        ai_system_name: str,
        ai_system_data: Dict[str, Any],
        evidence_data: Dict[str, Any],
        frameworks: Optional[List[Framework]] = None
    ) -> ComplianceReport:
        """
        Generate a comprehensive compliance report for an AI system.
        
        This is the main entry point for compliance evaluation.
        """
        # Default to all major frameworks
        if frameworks is None:
            frameworks = [Framework.EU_AI_ACT, Framework.NIST_AI_RMF, Framework.TC260]
        
        # Classify risk level
        risk_level = self.classify_risk_level(ai_system_data)
        logger.info(f"AI System {ai_system_name} classified as {risk_level.value} risk")
        
        # Evaluate each framework
        all_checks = []
        framework_scores = {}
        
        for framework in frameworks:
            score, checks = self.evaluate_framework(
                framework, ai_system_data, evidence_data, risk_level
            )
            framework_scores[framework.value] = round(score * 100, 2)
            all_checks.extend(checks)
        
        # Calculate overall score
        overall_score = sum(framework_scores.values()) / len(framework_scores)
        
        # Determine overall status
        if overall_score >= 80:
            overall_status = "compliant"
        elif overall_score >= 50:
            overall_status = "partially_compliant"
        else:
            overall_status = "non_compliant"
        
        # Determine PDCA phase based on current state
        non_compliant_checks = [c for c in all_checks if c.status == "non_compliant"]
        if len(non_compliant_checks) > len(all_checks) * 0.5:
            pdca_phase = PDCAPhase.PLAN  # Need to plan improvements
        elif len(non_compliant_checks) > 0:
            pdca_phase = PDCAPhase.ACT  # Need to act on issues
        else:
            pdca_phase = PDCAPhase.CHECK  # Monitoring phase
        
        # Generate summary
        summary = self._generate_summary(
            ai_system_name, risk_level, overall_score, overall_status,
            framework_scores, all_checks
        )
        
        return ComplianceReport(
            ai_system_id=ai_system_id,
            ai_system_name=ai_system_name,
            frameworks_evaluated=frameworks,
            risk_level=risk_level,
            overall_score=round(overall_score, 2),
            overall_status=overall_status,
            pdca_phase=pdca_phase,
            framework_scores=framework_scores,
            checks=all_checks,
            summary=summary
        )
    
    def _generate_summary(
        self,
        ai_system_name: str,
        risk_level: RiskLevel,
        overall_score: float,
        overall_status: str,
        framework_scores: Dict[str, float],
        checks: List[ComplianceCheck]
    ) -> str:
        """Generate a human-readable summary of the compliance report."""
        non_compliant = [c for c in checks if c.status == "non_compliant"]
        partial = [c for c in checks if c.status == "partially_compliant"]
        
        summary = f"""
COMPLIANCE ASSESSMENT SUMMARY
=============================
AI System: {ai_system_name}
Risk Classification: {risk_level.value.upper()}
Overall Compliance Score: {overall_score:.1f}%
Status: {overall_status.upper().replace('_', ' ')}

FRAMEWORK SCORES:
"""
        for fw, score in framework_scores.items():
            summary += f"  - {fw.upper()}: {score:.1f}%\n"
        
        summary += f"""
KEY FINDINGS:
  - Total requirements evaluated: {len(checks)}
  - Compliant: {len(checks) - len(non_compliant) - len(partial)}
  - Partially compliant: {len(partial)}
  - Non-compliant: {len(non_compliant)}
"""
        
        if non_compliant:
            summary += "\nCRITICAL GAPS:\n"
            for check in non_compliant[:5]:  # Top 5 issues
                summary += f"  - {check.requirement_id}: {check.findings[0] if check.findings else 'Non-compliant'}\n"
        
        if partial:
            summary += "\nAREAS FOR IMPROVEMENT:\n"
            for check in partial[:3]:  # Top 3 areas
                summary += f"  - {check.requirement_id}: {check.recommendations[0] if check.recommendations else 'Needs improvement'}\n"
        
        return summary.strip()


# =============================================================================
# DEMO / TESTING
# =============================================================================

def demo_compliance_evaluation():
    """Demonstrate the compliance evaluation engine."""
    evaluator = ComplianceEvaluator()
    
    # Example AI system
    ai_system_data = {
        "name": "HR Recruitment Assistant",
        "use_case": "automated recruitment screening and candidate ranking",
        "sector": "employment",
        "model_type": "large language model",
        "provider": "Internal"
    }
    
    # Example evidence (simulated)
    evidence_data = {
        "risk_management": {"quality": 0.85, "documents": ["risk_assessment.pdf"]},
        "data_governance": {"quality": 0.70, "documents": ["data_policy.pdf"]},
        "documentation": {"quality": 0.90, "documents": ["technical_docs.pdf"]},
        "logging": {"quality": 0.60, "documents": []},
        "transparency": {"quality": 0.75, "documents": ["user_guide.pdf"]},
        "human_oversight": {"quality": 0.80, "documents": ["oversight_policy.pdf"]},
        "security": {"quality": 0.65, "documents": []},
        "monitoring": {"quality": 0.50, "documents": []},
        "incident_reporting": {"quality": 0.40, "documents": []},
    }
    
    print("=" * 60)
    print("COAI Multi-Framework Compliance Engine Demo")
    print("=" * 60)
    
    report = evaluator.generate_compliance_report(
        ai_system_id="sys-001",
        ai_system_name=ai_system_data["name"],
        ai_system_data=ai_system_data,
        evidence_data=evidence_data
    )
    
    print(report.summary)
    print("\n" + "=" * 60)
    print(f"PDCA Phase Recommendation: {report.pdca_phase.value.upper()}")
    print("=" * 60)
    
    # Show cross-framework mapping example
    print("\nCROSS-FRAMEWORK MAPPING EXAMPLE:")
    print("EU AI Act Article 14 (Human Oversight) maps to:")
    mapping = evaluator.requirement_db.get_cross_framework_mapping("EU-ART-14")
    for fw, refs in mapping.items():
        print(f"  - {fw}: {', '.join(refs)}")


if __name__ == "__main__":
    demo_compliance_evaluation()
