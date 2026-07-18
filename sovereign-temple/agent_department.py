#!/usr/bin/env python3
"""
MEOK AI LABS — Autonomous Department Agents
CEO Ralph → Department Heads → Task Agents

Architecture from Kimi Research:
- CEO Agent (Ralph) orchestrates everything
- 6 Department Heads manage their domains
- Each dept has specialized task agents

Run: python3 agent_department.py
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s"
)
log = logging.getLogger("dept-agents")


class Department(Enum):
    CONTENT = "content"
    SALES = "sales"
    FINANCE = "finance"
    SUPPORT = "support"
    RESEARCH = "research"
    OPERATIONS = "operations"


class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class DepartmentAgent:
    """Base class for department agents"""

    def __init__(self, dept: Department):
        self.dept = dept
        self.tasks: List[Dict[str, Any]] = []
        self.llm = os.getenv("DEFAULT_LLM", "qwen3.5:9b")

    def add_task(self, task: str, priority: int = 5) -> Dict[str, Any]:
        """Add a task to the queue"""
        task_obj = {
            "id": f"{self.dept.value}_{len(self.tasks) + 1}",
            "task": task,
            "priority": priority,
            "status": TaskStatus.PENDING.value,
            "created_at": datetime.now().isoformat(),
            "result": None,
        }
        self.tasks.append(task_obj)
        log.info(f"📝 [{self.dept.value.upper()}] Task added: {task}")
        return task_obj

    def get_next_task(self) -> Optional[Dict[str, Any]]:
        """Get highest priority pending task"""
        pending = [t for t in self.tasks if t["status"] == TaskStatus.PENDING.value]
        if not pending:
            return None
        return max(pending, key=lambda t: t["priority"])

    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task (placeholder - would connect to actual LLM)"""
        log.info(f"⚙️  Executing: {task['task']}")

        # Simulate task execution
        result = {
            "task_id": task["id"],
            "output": f"Result for: {task['task']}",
            "executed_at": datetime.now().isoformat(),
        }

        task["status"] = TaskStatus.COMPLETED.value
        task["result"] = result

        return result


class ContentDepartment(DepartmentAgent):
    """Content Department - Blog, Social, PR, Newsletter"""

    def __init__(self):
        super().__init__(Department.CONTENT)
        self.sub_agents = ["Blog Writer", "Social Media", "PR Writer", "Newsletter"]

    def write_blog_post(self, topic: str) -> Dict[str, Any]:
        """Generate a blog post"""
        task = f"Write blog post about: {topic}"
        return self.add_task(task, priority=7)

    def schedule_social_post(self, platform: str, content: str) -> Dict[str, Any]:
        """Schedule social media post"""
        task = f"Post to {platform}: {content[:50]}..."
        return self.add_task(task, priority=5)

    def write_press_release(self, announcement: str) -> Dict[str, Any]:
        """Write press release"""
        task = f"Write press release: {announcement}"
        return self.add_task(task, priority=8)


class SalesDepartment(DepartmentAgent):
    """Sales Department - Leads, Calls, Demos"""

    def __init__(self):
        super().__init__(Department.SALES)
        self.sub_agents = ["Lead Researcher", "Caller", "Demo Bookings", "Follow-up"]
        self.vapi_available = bool(os.getenv("VAPI_API_KEY"))

    def research_leads(self, criteria: str) -> Dict[str, Any]:
        """Research potential leads"""
        task = f"Research leads: {criteria}"
        return self.add_task(task, priority=8)

    def initiate_call(self, phone: str, script: str) -> Dict[str, Any]:
        """Make sales call (uses Vapi)"""
        if not self.vapi_available:
            log.warning("VAPI_API_KEY not set - cannot make calls")
            return {"error": "VAPI not configured"}

        task = f"Call {phone}: {script[:30]}..."
        return self.add_task(task, priority=9)

    def schedule_demo(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule demo with lead"""
        task = f"Schedule demo for {lead_info.get('name', 'unknown')}"
        return self.add_task(task, priority=10)


class FinanceDepartment(DepartmentAgent):
    """Finance Department - Bookkeeping, Invoicing, Reporting"""

    def __init__(self):
        super().__init__(Department.FINANCE)
        self.sub_agents = [
            "Bookkeeper",
            "Invoice Generator",
            "VAT Returns",
            "Financial Reports",
        ]
        self.xero_connected = bool(os.getenv("XERO_CLIENT_ID"))

    def generate_invoice(self, customer: str, items: List[Dict]) -> Dict[str, Any]:
        """Generate invoice"""
        task = f"Generate invoice for {customer}"
        return self.add_task(task, priority=8)

    def get_monthly_report(self, month: str) -> Dict[str, Any]:
        """Get monthly financial report"""
        task = f"Financial report for {month}"
        return self.add_task(task, priority=7)

    def reconcile_payments(self) -> Dict[str, Any]:
        """Reconcile Stripe payments with accounting"""
        task = "Reconcile payments"
        return self.add_task(task, priority=9)


class SupportDepartment(DepartmentAgent):
    """Support Department - Triage, FAQ, Escalation"""

    def __init__(self):
        super().__init__(Department.SUPPORT)
        self.sub_agents = [
            "Triage",
            "FAQ Resolver",
            "Escalation Manager",
            "Feedback Collector",
        ]
        self.intercom_available = bool(os.getenv("INTERCOM_ACCESS_TOKEN"))

    def triage_ticket(self, ticket: str) -> Dict[str, Any]:
        """Categorize support ticket"""
        task = f"Triage ticket: {ticket[:50]}..."
        return self.add_task(task, priority=8)

    def generate_faq_response(self, question: str) -> Dict[str, Any]:
        """Generate FAQ response"""
        task = f"FAQ response for: {question}"
        return self.add_task(task, priority=6)

    def escalate_issue(self, ticket_id: str, reason: str) -> Dict[str, Any]:
        """Escalate to Nick"""
        task = f"Escalate {ticket_id}: {reason}"
        return self.add_task(task, priority=10)


class ResearchDepartment(DepartmentAgent):
    """Research Department - Market, Competitors, Trends"""

    def __init__(self):
        super().__init__(Department.RESEARCH)
        self.sub_agents = [
            "Market Analyst",
            "Competitor Tracker",
            "Trend Scanner",
            "Opportunity Finder",
        ]

    def analyze_market(self, industry: str) -> Dict[str, Any]:
        """Analyze market"""
        task = f"Market analysis: {industry}"
        return self.add_task(task, priority=7)

    def track_competitor(self, competitor: str) -> Dict[str, Any]:
        """Track competitor activity"""
        task = f"Track {competitor}"
        return self.add_task(task, priority=6)

    def scan_trends(self) -> Dict[str, Any]:
        """Scan for industry trends"""
        task = "Scan industry trends"
        return self.add_task(task, priority=5)


class OperationsDepartment(DepartmentAgent):
    """Operations Department - Scheduling, Tasks, Reminders"""

    def __init__(self):
        super().__init__(Department.OPERATIONS)
        self.sub_agents = ["Scheduler", "Task Manager", "Reminder Bot", "Daily Digest"]

    def schedule_meeting(self, attendees: List[str], topic: str) -> Dict[str, Any]:
        """Schedule meeting"""
        task = f"Schedule meeting: {topic} with {len(attendees)} people"
        return self.add_task(task, priority=7)

    def generate_daily_digest(self) -> Dict[str, Any]:
        """Generate daily operations digest"""
        task = "Generate daily digest"
        return self.add_task(task, priority=8)

    def send_reminder(self, recipient: str, message: str) -> Dict[str, Any]:
        """Send reminder"""
        task = f"Remind {recipient}: {message}"
        return self.add_task(task, priority=6)


class CEOAgent:
    """CEO Agent (Ralph) - Orchestrates all departments"""

    def __init__(self):
        self.departments = {
            Department.CONTENT: ContentDepartment(),
            Department.SALES: SalesDepartment(),
            Department.FINANCE: FinanceDepartment(),
            Department.SUPPORT: SupportDepartment(),
            Department.RESEARCH: ResearchDepartment(),
            Department.OPERATIONS: OperationsDepartment(),
        }

    def delegate_task(
        self, dept: Department, task: str, priority: int = 5
    ) -> Dict[str, Any]:
        """Delegate task to department"""
        log.info(f"👑 CEO delegating to {dept.value}: {task}")
        return self.departments[dept].add_task(task, priority)

    def get_department_status(self) -> Dict[str, Any]:
        """Get status of all departments"""
        status = {}
        for dept, agent in self.departments.items():
            pending = len([t for t in agent.tasks if t["status"] == "pending"])
            in_progress = len([t for t in agent.tasks if t["status"] == "in_progress"])
            completed = len([t for t in agent.tasks if t["status"] == "completed"])

            status[dept.value] = {
                "pending": pending,
                "in_progress": in_progress,
                "completed": completed,
                "sub_agents": agent.sub_agents,
            }
        return status

    def run_daily_standup(self) -> Dict[str, Any]:
        """Run daily standup - check all departments"""
        status = self.get_department_status()

        report = {
            "timestamp": datetime.now().isoformat(),
            "departments": status,
            "total_tasks": sum(
                s["pending"] + s["in_progress"] + s["completed"]
                for s in status.values()
            ),
            "action_items": [],
        }

        # Find high priority items
        for dept, agent in self.departments.items():
            for task in agent.tasks:
                if task["priority"] >= 8 and task["status"] == "pending":
                    report["action_items"].append(
                        {
                            "department": dept.value,
                            "task": task["task"],
                            "priority": task["priority"],
                        }
                    )

        return report


def demo():
    """Demo the department system"""

    # Create CEO
    ceo = CEOAgent()

    print("=" * 50)
    print("🤖 MEOK Autonomous Business - Department Agents")
    print("=" * 50)

    # Add tasks to different departments
    ceo.delegate_task(
        Department.CONTENT, "Write blog post about AI consciousness", priority=8
    )
    ceo.delegate_task(Department.CONTENT, "Schedule social media posts", priority=5)

    ceo.delegate_task(Department.SALES, "Research AI companies in UK", priority=8)
    ceo.delegate_task(Department.SALES, "Call lead about demo", priority=9)

    ceo.delegate_task(
        Department.FINANCE, "Generate March invoice for Acme Corp", priority=8
    )

    ceo.delegate_task(
        Department.SUPPORT, "Triage support ticket about billing", priority=7
    )

    ceo.delegate_task(
        Department.RESEARCH, "Analyze competitors in AI companion space", priority=6
    )

    ceo.delegate_task(Department.OPERATIONS, "Generate daily digest", priority=8)

    # Get status
    print("\n📊 Department Status:")
    status = ceo.get_department_status()
    for dept, stat in status.items():
        print(f"\n{dept.upper()}:")
        print(
            f"  Pending: {stat['pending']}, In Progress: {stat['in_progress']}, Done: {stat['completed']}"
        )
        print(f"  Sub-agents: {', '.join(stat['sub_agents'][:2])}...")

    # Run standup
    print("\n👑 Daily Standup Report:")
    standup = ceo.run_daily_standup()
    print(f"Total tasks: {standup['total_tasks']}")
    print(f"Action items: {len(standup['action_items'])}")

    for item in standup["action_items"]:
        print(f"  - [{item['department']}] {item['task']} (P{item['priority']})")


if __name__ == "__main__":
    demo()
