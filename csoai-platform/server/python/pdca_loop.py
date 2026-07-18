"""
COAI MVP - PDCA Loop Integration
Plan-Do-Check-Act Continuous Improvement System

This module integrates the compliance engine with the 33-agent council,
implementing the SOAI-PDCA feedback loop where SOAI/Watchdog serves as the "Check".
"""

import asyncio
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.agents.council import AgentCouncil, VotingSession, get_council
from app.core.compliance_engine import (
    ComplianceEvaluator, ComplianceReport, PDCAPhase, RiskLevel, Framework
)

logger = logging.getLogger(__name__)


# =============================================================================
# PDCA CYCLE DATA STRUCTURES
# =============================================================================

class PDCAStatus(Enum):
    """Status of a PDCA cycle."""
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    AWAITING_HUMAN_REVIEW = "awaiting_human_review"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class PDCAAction:
    """An action item within a PDCA phase."""
    id: str
    phase: PDCAPhase
    title: str
    description: str
    priority: str  # "critical", "high", "medium", "low"
    assigned_to: Optional[str] = None
    status: str = "pending"  # "pending", "in_progress", "completed", "blocked"
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    evidence: Optional[str] = None


@dataclass
class PDCACycle:
    """
    Represents a complete PDCA cycle for an AI system.
    
    The SOAI-PDCA integration means:
    - PLAN: Risk assessment and governance setup
    - DO: AI system deployment with monitoring
    - CHECK: SOAI/Watchdog feedback + automated testing + 33-agent analysis
    - ACT: Issue resolution and improvement based on findings
    """
    cycle_id: str
    ai_system_id: str
    ai_system_name: str
    
    current_phase: PDCAPhase = PDCAPhase.PLAN
    status: PDCAStatus = PDCAStatus.INITIATED
    
    # Phase-specific data
    plan_data: Dict[str, Any] = field(default_factory=dict)
    do_data: Dict[str, Any] = field(default_factory=dict)
    check_data: Dict[str, Any] = field(default_factory=dict)
    act_data: Dict[str, Any] = field(default_factory=dict)
    
    # Actions across all phases
    actions: List[PDCAAction] = field(default_factory=list)
    
    # Voting sessions from the 33-agent council
    voting_sessions: List[str] = field(default_factory=list)
    
    # Human analyst reviews
    human_reviews: List[Dict[str, Any]] = field(default_factory=list)
    
    # Watchdog/SOAI inputs (the "Check" mechanism)
    watchdog_reports: List[str] = field(default_factory=list)
    soai_alerts: List[Dict[str, Any]] = field(default_factory=list)
    
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    def advance_phase(self) -> bool:
        """Advance to the next PDCA phase if current phase is complete."""
        phase_order = [PDCAPhase.PLAN, PDCAPhase.DO, PDCAPhase.CHECK, PDCAPhase.ACT]
        current_index = phase_order.index(self.current_phase)
        
        if current_index < len(phase_order) - 1:
            self.current_phase = phase_order[current_index + 1]
            self.updated_at = datetime.utcnow()
            logger.info(f"Cycle {self.cycle_id} advanced to {self.current_phase.value}")
            return True
        else:
            # Cycle complete, start new cycle
            self.status = PDCAStatus.COMPLETED
            self.completed_at = datetime.utcnow()
            logger.info(f"Cycle {self.cycle_id} completed")
            return False
    
    def add_action(self, action: PDCAAction) -> None:
        """Add an action item to the cycle."""
        self.actions.append(action)
        self.updated_at = datetime.utcnow()
    
    def add_watchdog_report(self, report_id: str) -> None:
        """Add a Watchdog report to the CHECK phase."""
        self.watchdog_reports.append(report_id)
        self.check_data["watchdog_report_count"] = len(self.watchdog_reports)
        self.updated_at = datetime.utcnow()
    
    def add_soai_alert(self, alert: Dict[str, Any]) -> None:
        """Add a SOAI browser extension alert to the CHECK phase."""
        self.soai_alerts.append(alert)
        self.check_data["soai_alert_count"] = len(self.soai_alerts)
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "cycle_id": self.cycle_id,
            "ai_system_id": self.ai_system_id,
            "ai_system_name": self.ai_system_name,
            "current_phase": self.current_phase.value,
            "status": self.status.value,
            "plan_data": self.plan_data,
            "do_data": self.do_data,
            "check_data": self.check_data,
            "act_data": self.act_data,
            "action_count": len(self.actions),
            "pending_actions": len([a for a in self.actions if a.status == "pending"]),
            "watchdog_reports": len(self.watchdog_reports),
            "soai_alerts": len(self.soai_alerts),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


# =============================================================================
# PDCA ORCHESTRATOR
# =============================================================================

class PDCAOrchestrator:
    """
    Orchestrates the PDCA loop, integrating:
    - Compliance Engine (PLAN)
    - 33-Agent Council (all phases)
    - SOAI/Watchdog feedback (CHECK)
    - Human Analyst review (ACT)
    """
    
    def __init__(self):
        self.compliance_evaluator = ComplianceEvaluator()
        self.council = get_council()
        self.active_cycles: Dict[str, PDCACycle] = {}
    
    async def initiate_cycle(
        self,
        ai_system_id: str,
        ai_system_name: str,
        ai_system_data: Dict[str, Any],
        evidence_data: Dict[str, Any]
    ) -> PDCACycle:
        """
        Initiate a new PDCA cycle for an AI system.
        
        This is the entry point for the continuous improvement process.
        """
        import hashlib
        cycle_id = hashlib.md5(
            f"{ai_system_id}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:12]
        
        cycle = PDCACycle(
            cycle_id=cycle_id,
            ai_system_id=ai_system_id,
            ai_system_name=ai_system_name
        )
        
        # Execute PLAN phase
        await self._execute_plan_phase(cycle, ai_system_data, evidence_data)
        
        self.active_cycles[cycle_id] = cycle
        logger.info(f"Initiated PDCA cycle {cycle_id} for {ai_system_name}")
        
        return cycle
    
    async def _execute_plan_phase(
        self,
        cycle: PDCACycle,
        ai_system_data: Dict[str, Any],
        evidence_data: Dict[str, Any]
    ) -> None:
        """
        Execute the PLAN phase:
        1. Generate compliance report
        2. Have 33-agent council vote on risk assessment
        3. Create action items for gaps
        """
        cycle.status = PDCAStatus.IN_PROGRESS
        
        # Step 1: Generate compliance report
        report = self.compliance_evaluator.generate_compliance_report(
            ai_system_id=cycle.ai_system_id,
            ai_system_name=cycle.ai_system_name,
            ai_system_data=ai_system_data,
            evidence_data=evidence_data
        )
        
        cycle.plan_data = {
            "compliance_report": {
                "overall_score": report.overall_score,
                "overall_status": report.overall_status,
                "risk_level": report.risk_level.value,
                "framework_scores": report.framework_scores,
                "summary": report.summary
            }
        }
        
        # Step 2: Have 33-agent council vote on the assessment
        voting_session = await self.council.create_voting_session(
            subject_type="risk_assessment",
            subject_data={
                "ai_system": cycle.ai_system_name,
                "risk_level": report.risk_level.value,
                "compliance_score": report.overall_score,
                "critical_gaps": [c.requirement_id for c in report.checks if c.status == "non_compliant"]
            }
        )
        
        cycle.voting_sessions.append(voting_session.session_id)
        cycle.plan_data["voting_session"] = voting_session.to_dict()
        
        # Step 3: Create action items based on findings
        for check in report.checks:
            if check.status == "non_compliant":
                action = PDCAAction(
                    id=f"action-{check.requirement_id}",
                    phase=PDCAPhase.PLAN,
                    title=f"Address {check.requirement_id} non-compliance",
                    description=check.recommendations[0] if check.recommendations else "Implement required controls",
                    priority="critical" if "mandatory" in str(check.evidence).lower() else "high"
                )
                cycle.add_action(action)
            elif check.status == "partially_compliant":
                action = PDCAAction(
                    id=f"action-{check.requirement_id}",
                    phase=PDCAPhase.PLAN,
                    title=f"Improve {check.requirement_id} compliance",
                    description=check.recommendations[0] if check.recommendations else "Strengthen existing controls",
                    priority="medium"
                )
                cycle.add_action(action)
        
        # Check if human review is needed
        if voting_session.status == "escalated_to_human":
            cycle.status = PDCAStatus.AWAITING_HUMAN_REVIEW
            logger.info(f"Cycle {cycle.cycle_id} PLAN phase requires human review")
        else:
            # Ready to advance to DO phase
            cycle.advance_phase()
    
    async def execute_do_phase(self, cycle: PDCACycle) -> None:
        """
        Execute the DO phase:
        1. Track implementation of action items
        2. Monitor deployment activities
        3. Record evidence of controls
        """
        if cycle.current_phase != PDCAPhase.DO:
            logger.warning(f"Cycle {cycle.cycle_id} is not in DO phase")
            return
        
        cycle.do_data = {
            "implementation_started": datetime.utcnow().isoformat(),
            "actions_in_progress": len([a for a in cycle.actions if a.status == "in_progress"]),
            "actions_completed": len([a for a in cycle.actions if a.status == "completed"]),
            "deployment_status": "monitoring"
        }
        
        # In production, this would track actual implementation progress
        # For now, we simulate completion and advance to CHECK
        cycle.do_data["implementation_completed"] = datetime.utcnow().isoformat()
        cycle.advance_phase()
    
    async def execute_check_phase(
        self,
        cycle: PDCACycle,
        watchdog_reports: Optional[List[Dict[str, Any]]] = None,
        soai_alerts: Optional[List[Dict[str, Any]]] = None,
        automated_test_results: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Execute the CHECK phase:
        1. Collect SOAI/Watchdog feedback (the public "Check" mechanism)
        2. Run automated tests
        3. Have 33-agent council analyze findings
        4. Determine if ACT phase is needed
        
        This is where the SOAI-PDCA integration happens!
        """
        if cycle.current_phase != PDCAPhase.CHECK:
            logger.warning(f"Cycle {cycle.cycle_id} is not in CHECK phase")
            return
        
        # Step 1: Collect Watchdog reports
        if watchdog_reports:
            for report in watchdog_reports:
                cycle.add_watchdog_report(report.get("id", "unknown"))
        
        # Step 2: Collect SOAI alerts
        if soai_alerts:
            for alert in soai_alerts:
                cycle.add_soai_alert(alert)
        
        # Step 3: Record automated test results
        cycle.check_data["automated_tests"] = automated_test_results or {
            "total_tests": 100,
            "passed": 85,
            "failed": 15,
            "safety_score": 85.0
        }
        
        # Step 4: Have 33-agent council analyze the CHECK phase findings
        check_summary = {
            "watchdog_reports": len(cycle.watchdog_reports),
            "soai_alerts": len(cycle.soai_alerts),
            "test_results": cycle.check_data.get("automated_tests", {}),
            "issues_found": len(cycle.watchdog_reports) + len(cycle.soai_alerts)
        }
        
        voting_session = await self.council.create_voting_session(
            subject_type="check_phase_review",
            subject_data=check_summary
        )
        
        cycle.voting_sessions.append(voting_session.session_id)
        cycle.check_data["voting_session"] = voting_session.to_dict()
        
        # Step 5: Determine next steps
        issues_found = check_summary["issues_found"]
        test_pass_rate = cycle.check_data["automated_tests"]["passed"] / cycle.check_data["automated_tests"]["total_tests"]
        
        if issues_found > 0 or test_pass_rate < 0.9:
            # Issues found, need to ACT
            cycle.check_data["requires_action"] = True
            cycle.advance_phase()
        else:
            # No issues, cycle complete
            cycle.check_data["requires_action"] = False
            cycle.status = PDCAStatus.COMPLETED
            cycle.completed_at = datetime.utcnow()
            logger.info(f"Cycle {cycle.cycle_id} completed successfully - no issues found")
    
    async def execute_act_phase(
        self,
        cycle: PDCACycle,
        human_analyst_review: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Execute the ACT phase:
        1. Review findings from CHECK phase
        2. Incorporate human analyst review
        3. Create corrective action items
        4. Notify AI providers if needed
        5. Update knowledge base
        """
        if cycle.current_phase != PDCAPhase.ACT:
            logger.warning(f"Cycle {cycle.cycle_id} is not in ACT phase")
            return
        
        # Step 1: Incorporate human analyst review
        if human_analyst_review:
            cycle.human_reviews.append(human_analyst_review)
            cycle.act_data["human_review"] = human_analyst_review
        
        # Step 2: Create corrective actions based on CHECK findings
        if cycle.watchdog_reports:
            action = PDCAAction(
                id=f"action-watchdog-{len(cycle.actions)}",
                phase=PDCAPhase.ACT,
                title="Address Watchdog reported issues",
                description=f"Review and resolve {len(cycle.watchdog_reports)} reported issues",
                priority="high"
            )
            cycle.add_action(action)
        
        if cycle.soai_alerts:
            action = PDCAAction(
                id=f"action-soai-{len(cycle.actions)}",
                phase=PDCAPhase.ACT,
                title="Address SOAI detected issues",
                description=f"Investigate and fix {len(cycle.soai_alerts)} SOAI alerts",
                priority="high"
            )
            cycle.add_action(action)
        
        # Step 3: Record ACT phase data
        cycle.act_data.update({
            "corrective_actions_created": len([a for a in cycle.actions if a.phase == PDCAPhase.ACT]),
            "provider_notifications_sent": len(cycle.watchdog_reports) > 0,
            "knowledge_base_updated": True,
            "completed_at": datetime.utcnow().isoformat()
        })
        
        # Step 4: Complete the cycle
        cycle.status = PDCAStatus.COMPLETED
        cycle.completed_at = datetime.utcnow()
        logger.info(f"Cycle {cycle.cycle_id} ACT phase completed")
    
    def get_cycle(self, cycle_id: str) -> Optional[PDCACycle]:
        """Get a PDCA cycle by ID."""
        return self.active_cycles.get(cycle_id)
    
    def get_active_cycles(self) -> List[PDCACycle]:
        """Get all active PDCA cycles."""
        return [c for c in self.active_cycles.values() if c.status != PDCAStatus.COMPLETED]


# =============================================================================
# DEMO / TESTING
# =============================================================================

async def demo_pdca_cycle():
    """Demonstrate the PDCA loop integration."""
    orchestrator = PDCAOrchestrator()
    
    # Example AI system
    ai_system_data = {
        "name": "Customer Support Chatbot",
        "use_case": "automated customer support and FAQ answering",
        "sector": "retail",
        "model_type": "large language model",
        "provider": "OpenAI GPT-4"
    }
    
    evidence_data = {
        "risk_management": {"quality": 0.75},
        "data_governance": {"quality": 0.80},
        "documentation": {"quality": 0.85},
        "logging": {"quality": 0.70},
        "transparency": {"quality": 0.90},
        "human_oversight": {"quality": 0.65},
        "security": {"quality": 0.70},
        "monitoring": {"quality": 0.60},
        "incident_reporting": {"quality": 0.50},
    }
    
    print("=" * 70)
    print("COAI PDCA Loop Integration Demo")
    print("=" * 70)
    
    # PLAN Phase
    print("\n📋 INITIATING PDCA CYCLE (PLAN PHASE)...")
    cycle = await orchestrator.initiate_cycle(
        ai_system_id="sys-chatbot-001",
        ai_system_name=ai_system_data["name"],
        ai_system_data=ai_system_data,
        evidence_data=evidence_data
    )
    
    print(f"\nCycle ID: {cycle.cycle_id}")
    print(f"Current Phase: {cycle.current_phase.value.upper()}")
    print(f"Status: {cycle.status.value}")
    print(f"Actions Created: {len(cycle.actions)}")
    
    # DO Phase
    print("\n🔧 EXECUTING DO PHASE...")
    await orchestrator.execute_do_phase(cycle)
    print(f"Current Phase: {cycle.current_phase.value.upper()}")
    
    # CHECK Phase (with simulated SOAI/Watchdog feedback)
    print("\n🔍 EXECUTING CHECK PHASE (SOAI-PDCA Integration)...")
    watchdog_reports = [
        {"id": "wd-001", "category": "bias", "severity": "medium"},
        {"id": "wd-002", "category": "transparency", "severity": "low"}
    ]
    soai_alerts = [
        {"type": "safety_concern", "model": "GPT-4", "confidence": 0.7}
    ]
    
    await orchestrator.execute_check_phase(
        cycle,
        watchdog_reports=watchdog_reports,
        soai_alerts=soai_alerts
    )
    
    print(f"Current Phase: {cycle.current_phase.value.upper()}")
    print(f"Watchdog Reports Processed: {len(cycle.watchdog_reports)}")
    print(f"SOAI Alerts Processed: {len(cycle.soai_alerts)}")
    print(f"Requires Action: {cycle.check_data.get('requires_action', False)}")
    
    # ACT Phase (if needed)
    if cycle.current_phase == PDCAPhase.ACT:
        print("\n⚡ EXECUTING ACT PHASE...")
        human_review = {
            "analyst_id": "analyst-001",
            "verdict": "valid",
            "notes": "Confirmed bias issue requires attention",
            "recommended_action": "Retrain model with balanced dataset"
        }
        
        await orchestrator.execute_act_phase(cycle, human_analyst_review=human_review)
        print(f"Human Review Incorporated: Yes")
        print(f"Corrective Actions: {cycle.act_data.get('corrective_actions_created', 0)}")
    
    # Final Status
    print("\n" + "=" * 70)
    print("PDCA CYCLE SUMMARY")
    print("=" * 70)
    print(f"Cycle ID: {cycle.cycle_id}")
    print(f"Final Status: {cycle.status.value.upper()}")
    print(f"Total Actions: {len(cycle.actions)}")
    print(f"Voting Sessions: {len(cycle.voting_sessions)}")
    print(f"Human Reviews: {len(cycle.human_reviews)}")
    print(f"Completed At: {cycle.completed_at}")
    
    print("\n✅ PDCA Cycle demonstrates the SOAI-PDCA feedback loop:")
    print("   1. PLAN: Compliance assessment + 33-agent council voting")
    print("   2. DO: Implementation tracking")
    print("   3. CHECK: SOAI/Watchdog feedback integration")
    print("   4. ACT: Human analyst review + corrective actions")


if __name__ == "__main__":
    asyncio.run(demo_pdca_cycle())
