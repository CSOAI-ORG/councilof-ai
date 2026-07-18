#!/usr/bin/env python3
"""
MEOK AI LABS — MCP Integration for Department Agents
Bridges SOV3 MCP tools → Department Agent execution

This module provides the execution logic for the department agent MCP tools.
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s"
)
log = logging.getLogger("dept-mcp")

# Lazy imports for integrations
_department_agent = None
_vapi_sales = None
_accounting = None
_seo = None
_video = None


def get_department_agent():
    """Lazy load department agent"""
    global _department_agent
    if _department_agent is None:
        try:
            from agent_department import CEOAgent

            _department_agent = CEOAgent()
        except Exception as e:
            log.warning(f"Department agent not available: {e}")
    return _department_agent


def get_vapi_sales():
    """Lazy load Vapi sales"""
    global _vapi_sales
    if _vapi_sales is None:
        try:
            from voice_pipeline.vapi_sales_agent import VapiSalesAgent

            _vapi_sales = VapiSalesAgent()
        except Exception as e:
            log.warning(f"Vapi sales not available: {e}")
    return _vapi_sales


def get_accounting():
    """Lazy load accounting"""
    global _accounting
    if _accounting is None:
        try:
            from accounting_integration import AccountingService

            _accounting = AccountingService()
        except Exception as e:
            log.warning(f"Accounting not available: {e}")
    return _accounting


def get_seo():
    """Lazy load SEO"""
    global _seo
    if _seo is None:
        try:
            from seo_integration import SEOService

            _seo = SEOService()
        except Exception as e:
            log.warning(f"SEO not available: {e}")
    return _seo


def get_video():
    """Lazy load video"""
    global _video
    if _video is None:
        try:
            from video_pipeline import VideoPipeline

            _video = VideoPipeline()
        except Exception as e:
            log.warning(f"Video not available: {e}")
    return _video


# ═══ MCP Tool Implementations ═══


async def delegate_to_department(
    department: str, task: str, priority: int = 5
) -> Dict[str, Any]:
    """Delegate a task to a department"""
    from agent_department import Department

    dept_map = {
        "content": Department.CONTENT,
        "sales": Department.SALES,
        "finance": Department.FINANCE,
        "support": Department.SUPPORT,
        "research": Department.RESEARCH,
        "operations": Department.OPERATIONS,
    }

    dept = dept_map.get(department.lower())
    if not dept:
        return {"error": f"Unknown department: {department}"}

    ceo = get_department_agent()
    if not ceo:
        return {"error": "Department agent not available"}

    result = ceo.delegate_task(dept, task, priority)
    return {"status": "delegated", "task_id": result["id"], "department": department}


async def get_department_status() -> Dict[str, Any]:
    """Get status of all departments"""
    ceo = get_department_agent()
    if not ceo:
        return {"error": "Department agent not available"}
    return ceo.get_department_status()


async def initiate_sales_call(
    phone_number: str, script: str, voice_id: str = "sarah"
) -> Dict[str, Any]:
    """Initiate a sales call via Vapi"""
    vapi = get_vapi_sales()
    if not vapi:
        return {"error": "Vapi not configured - set VAPI_API_KEY"}

    result = vapi.create_outbound_call(phone_number, script, voice_id)
    return result


async def generate_invoice(customer: str, items: list) -> Dict[str, Any]:
    """Generate an invoice"""
    accounting = get_accounting()
    if not accounting or not accounting.xero.connected:
        return {"error": "Xero not connected - set XERO_CLIENT_ID"}

    invoice = accounting.xero.create_invoice(customer, items)
    return invoice


async def get_financial_summary() -> Dict[str, Any]:
    """Get financial summary"""
    accounting = get_accounting()
    if not accounting:
        return {"error": "Accounting not available"}

    return accounting.get_financial_summary()


async def get_seo_analysis() -> Dict[str, Any]:
    """Get SEO + AEO analysis"""
    seo = get_seo()
    if not seo:
        return {"error": "SEO not available"}

    return seo.get_complete_analysis()


async def generate_video_ad(product: str, style: str = "cinematic") -> Dict[str, Any]:
    """Generate a video ad"""
    video = get_video()
    if not video:
        return {"error": "Video pipeline not available"}

    result = video.create_ad(product, style)
    return {
        "status": "created",
        "product": product,
        "job_id": result["video"]["job_id"],
    }


async def triage_support_ticket(ticket_content: str) -> Dict[str, Any]:
    """AI triage a support ticket"""
    # Simple keyword-based triage
    ticket_lower = ticket_content.lower()

    category = "general"
    priority = 3

    if any(w in ticket_lower for w in ["bug", "error", "crash", "broken"]):
        category = "technical"
        priority = 7
    elif any(w in ticket_lower for w in ["refund", "money", "payment", "billing"]):
        category = "billing"
        priority = 8
    elif any(
        w in ticket_lower
        for w in ["feature", "request", "would be nice", "enhancement"]
    ):
        category = "feature_request"
        priority = 3
    elif any(w in ticket_lower for w in ["urgent", "asap", "emergency", "critical"]):
        priority = 10

    return {
        "ticket": ticket_content[:100],
        "category": category,
        "priority": priority,
        "suggested_action": "escalate" if priority >= 8 else "auto_reply",
    }


# ═══ MCP Tool Registry ═══

DEPARTMENT_TOOLS = {
    "delegate_to_department": delegate_to_department,
    "get_department_status": get_department_status,
    "initiate_sales_call": initiate_sales_call,
    "generate_invoice": generate_invoice,
    "get_financial_summary": get_financial_summary,
    "get_seo_analysis": get_seo_analysis,
    "generate_video_ad": generate_video_ad,
    "triage_support_ticket": triage_support_ticket,
}


async def execute_department_tool(
    tool_name: str, arguments: Dict[str, Any]
) -> Dict[str, Any]:
    """Execute a department tool"""
    if tool_name not in DEPARTMENT_TOOLS:
        return {"error": f"Unknown tool: {tool_name}"}

    try:
        func = DEPARTMENT_TOOLS[tool_name]
        result = await func(**arguments)
        return result
    except Exception as e:
        log.error(f"Tool execution error: {e}")
        return {"error": str(e)}


def demo():
    """Demo the department MCP tools"""
    import asyncio

    print("=" * 50)
    print("🛠️  Department MCP Tools Demo")
    print("=" * 50)

    # Test department delegation
    print("\n1. Delegating task to Content department...")
    result = asyncio.run(
        delegate_to_department("content", "Write blog post about AI", priority=8)
    )
    print(f"   Result: {result}")

    # Test department status
    print("\n2. Getting department status...")
    result = asyncio.run(get_department_status())
    print(f"   Departments: {list(result.keys())}")

    # Test support triage
    print("\n3. Triaging support ticket...")
    result = asyncio.run(
        triage_support_ticket(
            "I found a bug in the chat - it's crashing when I send messages!"
        )
    )
    print(f"   Category: {result['category']}, Priority: {result['priority']}")

    # Test SEO
    print("\n4. Getting SEO analysis...")
    result = asyncio.run(get_seo_analysis())
    print(
        f"   Domain Rating: {result.get('domain_rating', {}).get('domain_rating', 'N/A')}"
    )


if __name__ == "__main__":
    demo()
