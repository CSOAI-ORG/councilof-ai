#!/usr/bin/env python3
"""meek-sessions-tasks-mcp — server.py (sessions + tasks engine for the L H side)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_sessions_tasks_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def session_create(session_name: str = "Default Session", session_type: str = "regulatory_research") -> dict:
    return {
        "session_id": f"session_{int(datetime.now(timezone.utc).timestamp())}",
        "session_name": session_name,
        "session_type": session_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def session_list_sessions() -> dict:
    return {
        "sessions": [
            {"session_id": "session_001", "name": "EU AI Act Compliance", "type": "regulatory_research", "tasks": 5, "status": "ACTIVE"},
            {"session_id": "session_002", "name": "UK Procurement Bid (DEFONEOS)", "type": "procurement", "tasks": 8, "status": "ACTIVE"},
            {"session_id": "session_003", "name": "Q3 Sovereign Audit", "type": "audit", "tasks": 12, "status": "PLANNING"},
        ],
        "count": 3,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def task_create(task_name: str = "Read EU AI Act Article 50", priority: str = "high") -> dict:
    return {
        "task_id": f"task_{int(datetime.now(timezone.utc).timestamp())}",
        "task_name": task_name,
        "priority": priority,
        "status": "TODO",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def task_list_tasks(status: str = "all") -> dict:
    all_tasks = [
        {"task_id": "task_001", "name": "Read EU AI Act Article 50", "priority": "high", "status": "DONE", "session": "session_001"},
        {"task_id": "task_002", "name": "Map UK procurement compliance", "priority": "high", "status": "IN_PROGRESS", "session": "session_002"},
        {"task_id": "task_003", "name": "Schedule sovereign audit", "priority": "medium", "status": "TODO", "session": "session_003"},
    ]
    if status == "all":
        filtered = all_tasks
    else:
        filtered = [t for t in all_tasks if t["status"].lower() == status.lower()]
    return {"tasks": filtered, "count": len(filtered), "status_filter": status, "ts": datetime.now(timezone.utc).isoformat()}


def sessions_tasks_metrics() -> dict:
    return {
        "total_sessions": 3,
        "active_sessions": 2,
        "total_tasks": 3,
        "tasks_done": 1,
        "tasks_in_progress": 1,
        "tasks_todo": 1,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-sessions-tasks-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("session_create", "Create a new session."),
        ("session_list_sessions", "List all sessions."),
        ("task_create", "Create a new task."),
        ("task_list_tasks", "List tasks (filter by status)."),
        ("sessions_tasks_metrics", "Return the sessions + tasks metrics."),
    ]]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    fn = globals().get(name)
    if fn:
        return [TextContent(type="text", text=json.dumps(fn(**arguments), indent=2))]
    return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]


async def main():
    if not mcp or not stdio_server: raise RuntimeError("mcp package not installed")
    async with stdio_server() as (r, w): await mcp.run(r, w, mcp.create_initialization_options())

if __name__ == "__main__":
    import asyncio; asyncio.run(main())