#!/usr/bin/env python3
"""
SOV3 Coordination Enabler
==========================
Enables all agents to use task coordination.
Run once to set up, or call via MCP.

Usage:
    python3 enable_coordination.py --register <agent_id>
    python3 enable_coordination.py --submit "<task_description>"
    python3 enable_coordination.py --complete <task_id>
    python3 enable_coordination.py --status
"""

import sys
import os
import json
import time
import argparse
from datetime import datetime
from pathlib import Path

SOV3 = "http://127.0.0.1:3101"
SOV3_MCP = f"{SOV3}/mcp"


def mcp_call(tool: str, arguments: dict = None) -> dict:
    """Call SOV3 MCP tool."""
    import urllib.request

    payload = json.dumps(
        {
            "jsonrpc": "2.0",
            "id": str(int(time.time())),
            "method": "tools/call",
            "params": {"name": tool, "arguments": arguments or {}},
        }
    ).encode()

    req = urllib.request.Request(
        SOV3_MCP,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read())
            result = d.get("result", {})
            if isinstance(result, dict) and "content" in result:
                content = result["content"]
                if isinstance(content, list) and content:
                    return json.loads(content[0].get("text", "{}"))
            return result
    except Exception as e:
        return {"error": str(e)}


def register_agent(agent_id: str, agent_type: str = "cli-agent") -> dict:
    """Register an agent with SOV3 coordination."""
    result = mcp_call(
        "coord_register_agent",
        {
            "agent_id": agent_id,
            "agent_type": agent_type,
            "capabilities": ["code_execution", "file_operations", "coordination"],
        },
    )

    if "error" not in result:
        print(f"✅ Registered: {agent_id}")
        return result
    else:
        print(f"❌ Failed: {result.get('error')}")
        return result


def submit_task(
    task: str,
    agent_id: str = "jeeves-cli",
    priority: str = "medium",
    task_type: str = "general",
) -> dict:
    """Submit a task to the coordination queue."""
    result = mcp_call(
        "coord_submit_task",
        {
            "title": task[:100],  # Limit title length
            "description": task,
            "files": [],  # Optional files
            "care_score": 0.7,
        },
    )

    if "error" not in result:
        task_id = result.get("task_id", "unknown")
        print(f"✅ Task submitted: {task_id}")
        print(f"   Description: {task}")
        print(f"   Assigned to: {agent_id}")
        return result
    else:
        print(f"❌ Failed: {result.get('error')}")
        return result


def complete_task(task_id: str, agent_id: str = "jeeves-cli", result_text: str = "completed") -> dict:
    """Mark a task as complete."""
    result = mcp_call(
        "coord_complete_task", {"task_id": task_id, "agent_id": agent_id, "result_summary": result_text}
    )

    if "error" not in result:
        print(f"✅ Task completed: {task_id}")
        return result
    else:
        print(f"❌ Failed: {result.get('error')}")
        return result


def get_dashboard() -> dict:
    """Get coordination dashboard."""
    result = mcp_call("coord_get_dashboard", {})

    if "error" not in result:
        agents = result.get("agents", {})
        tasks = result.get("tasks", {})

        print("=" * 50)
        print("SOV3 COORDINATION DASHBOARD")
        print("=" * 50)
        print(
            f"Agents: {agents.get('total', 0)} total, {agents.get('active', 0)} active"
        )
        print(
            f"Tasks: {tasks.get('queued', 0)} queued, {tasks.get('completed', 0)} completed"
        )
        print(f"Locks: {result.get('locks', {}).get('active', 0)} active")
        print()

        if tasks.get("queued", 0) > 0:
            print("📋 Queued Tasks:")
            # Would need to query for task list
        else:
            print("📋 No queued tasks")

        print()
        print("Recent Events:")
        for event in result.get("recent_events", [])[:5]:
            print(
                f"  [{event.get('time', '')[:19]}] {event.get('type')}: {event.get('agent')}"
            )

        return result
    else:
        print(f"❌ Failed: {result.get('error')}")
        return result


def get_agent_tasks(agent_id: str = None) -> dict:
    """Get tasks for an agent."""
    result = mcp_call("orion_get_tasks", {"agent_id": agent_id, "status": "pending"})

    if "error" not in result:
        tasks = result.get("tasks", [])
        print(f"📋 Tasks for {agent_id or 'all agents'}: {len(tasks)}")
        for task in tasks[:10]:
            print(f"  [{task.get('id')}] {task.get('description', '')[:50]}...")
        return result
    else:
        print(f"❌ Failed: {result.get('error')}")
        return result


def seed_coordination_tasks():
    """Seed some example coordination tasks."""
    print("Seeding coordination tasks...")

    tasks = [
        ("Verify MEOK_UI health endpoint", "jeeves-cli", "high", "monitoring"),
        (
            "Ensure all agents read shared-knowledge at startup",
            "jeeves-cli",
            "high",
            "coordination",
        ),
        ("Pull Ollama qwen2.5:7b model", "jarvis-cli", "medium", "infrastructure"),
        ("Start Stripe webhook server", "jeeves-cli", "medium", "infrastructure"),
    ]

    for task_desc, agent, priority, task_type in tasks:
        submit_task(task_desc, agent, priority, task_type)


def main():
    parser = argparse.ArgumentParser(description="SOV3 Coordination CLI")
    parser.add_argument("--register", help="Register as agent with ID")
    parser.add_argument("--submit", help="Submit a task")
    parser.add_argument("--complete", help="Complete a task by ID")
    parser.add_argument("--status", action="store_true", help="Show dashboard")
    parser.add_argument("--tasks", help="Get tasks for agent (optional: agent_id)")
    parser.add_argument(
        "--agent-type", default="cli-agent", help="Agent type for registration"
    )
    parser.add_argument(
        "--priority", default="medium", help="Task priority: low/medium/high"
    )
    parser.add_argument(
        "--seed", action="store_true", help="Seed example coordination tasks"
    )

    args = parser.parse_args()

    if args.register:
        register_agent(args.register, args.agent_type)
    elif args.submit:
        submit_task(args.submit, "jeeves-cli", args.priority)
    elif args.complete:
        complete_task(args.complete)
    elif args.status:
        get_dashboard()
    elif args.tasks:
        get_agent_tasks(args.tasks)
    elif args.seed:
        seed_coordination_tasks()
    else:
        get_dashboard()


if __name__ == "__main__":
    main()
