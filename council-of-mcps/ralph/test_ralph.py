#!/usr/bin/env python3
"""
RALPH MCP — Quick Test
======================
Test Ralph CEO without full MCP setup
"""

import asyncio
import sys
sys.path.insert(0, '/Users/nicholas/clawd/council-of-mcps/ralph')

from ralph_mcp_server import RalphCEO, Task

async def test():
    print("🚀 RALPH CEO — Persistence Test")
    print("=" * 50)
    
    ralph = RalphCEO()
    
    # Test task: Something achievable
    task = Task(
        id="test_001",
        description="Generate a 5-item todo list for building an AI startup",
        success_criteria="List has exactly 5 items, each actionable",
        max_attempts=2
    )
    
    print(f"\nTask: {task.description}")
    print(f"Success criteria: {task.success_criteria}")
    print(f"Max attempts: {task.max_attempts}")
    
    result = await ralph.execute_task(task)
    
    print(f"\n{'='*50}")
    print(f"Status: {'✅ COMPLETED' if result.get('success') else '❌ FAILED'}")
    print(f"Attempts: {result.get('attempts')}")
    print(f"Subtasks: {len(result.get('subtasks', []))}")
    
    if result.get('subtasks'):
        print(f"\nSubtask breakdown:")
        for st in result['subtasks']:
            status = "✅" if st.get('status') == 'completed' else "❌"
            print(f"  {status} {st.get('assigned_council', 'unknown')}: {st.get('description', 'N/A')[:40]}...")
    
    return result

if __name__ == "__main__":
    result = asyncio.run(test())
    print(f"\n{'='*50}")
    print("Test complete. Ralph CEO persistence engine running.")
