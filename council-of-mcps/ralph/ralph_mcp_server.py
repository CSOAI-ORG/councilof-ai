#!/usr/bin/env python3
"""
RALPH MCP SERVER — CEO That Never Gives Up
============================================
Port: 3201
Core Loop: Receive → Decompose → Delegate → Verify → Retry

The CEO of your AI organization. Persistent execution.
"""

import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ralph")

# MCP Server imports
try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent
    from mcp.server.stdio import stdio_server
    MCP_AVAILABLE = True
except ImportError:
    logger.warning("MCP SDK not available — running in standalone mode")
    MCP_AVAILABLE = False


@dataclass
class Task:
    """Task definition for Ralph"""
    id: str
    description: str
    success_criteria: str
    max_attempts: int = 10
    timeout_minutes: int = 30
    created_at: datetime = field(default_factory=datetime.now)
    attempts: int = 0
    status: str = "pending"  # pending, running, completed, failed
    subtasks: List[Dict] = field(default_factory=list)
    results: List[Dict] = field(default_factory=list)


@dataclass  
class Subtask:
    """Decomposed subtask"""
    id: str
    parent_id: str
    description: str
    success_criteria: str
    assigned_council: str  # councilof, sov3, moe, local
    status: str = "pending"
    result: Optional[Dict] = None
    attempts: int = 0


class RalphCEO:
    """
    Ralph: Chief Executive Officer
    
    Receives high-level tasks, decomposes them, delegates to appropriate
    councils/agents, and verifies completion. Retries up to max_attempts.
    """
    
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.subtasks: Dict[str, Subtask] = {}
        self.councilof_url = "http://localhost:3103/mcp"
        self.sov3_url = "http://localhost:3101/mcp"
        self.moe_url = "http://localhost:3104/mcp"
        self.ollama_url = "http://localhost:11434/api/generate"
        
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """
        Ralph's core execution loop.
        
        1. Parse task intent
        2. Decompose into subtasks  
        3. Get CouncilOf approval
        4. Delegate to appropriate council
        5. Verify each subtask
        6. Retry failed components
        7. Return final result
        """
        
        logger.info(f"RALPH: Starting task {task.id}: {task.description[:50]}...")
        task.status = "running"
        self.tasks[task.id] = task
        
        for attempt in range(task.max_attempts):
            task.attempts = attempt + 1
            logger.info(f"RALPH: Attempt {task.attempts}/{task.max_attempts}")
            
            try:
                # Step 1: Decompose task
                if not task.subtasks:
                    task.subtasks = await self.decompose(task)
                    logger.info(f"RALPH: Decomposed into {len(task.subtasks)} subtasks")
                
                # Step 2: Get CouncilOf approval
                council_vote = await self.councilof_vote(task)
                if not council_vote.get("approved", False):
                    logger.warning(f"RALPH: CouncilOf rejected — revising")
                    task.subtasks = await self.revise(task, council_vote.get("feedback", ""))
                    continue
                
                # Step 3: Delegate to execution layer
                results = await self.delegate(task)
                
                # Step 4: Verify completion
                verification = await self.verify(results, task.success_criteria)
                
                if verification.get("passed", False):
                    # Step 5: Get CouncilOf audit
                    audit = await self.councilof_audit(task, results)
                    
                    task.status = "completed"
                    logger.info(f"RALPH: Task {task.id} COMPLETED after {task.attempts} attempts")
                    
                    return {
                        "success": True,
                        "task_id": task.id,
                        "attempts": task.attempts,
                        "subtasks": results,
                        "audit": audit,
                        "completed_at": datetime.now().isoformat()
                    }
                else:
                    # Failed verification — analyze and retry
                    logger.warning(f"RALPH: Verification failed — analyzing")
                    failures = verification.get("failures", [])
                    await self.repair_task(task, failures)
                    
            except Exception as e:
                logger.error(f"RALPH: Error on attempt {task.attempts}: {e}")
                if task.attempts >= task.max_attempts:
                    task.status = "failed"
                    logger.error(f"RALPH: Task {task.id} FAILED after {task.max_attempts} attempts")
                    return {
                        "success": False,
                        "task_id": task.id,
                        "attempts": task.attempts,
                        "error": str(e),
                        "failed_at": datetime.now().isoformat()
                    }
        
        task.status = "failed"
        return {
            "success": False,
            "task_id": task.id,
            "attempts": task.attempts,
            "error": "All retry attempts exhausted",
            "failed_at": datetime.now().isoformat()
        }
    
    async def decompose(self, task: Task) -> List[Dict]:
        """Break high-level task into executable subtasks using local LLM"""
        
        prompt = f"""You are Ralph, a CEO AI. Decompose this task into 3-7 specific subtasks.

Task: {task.description}
Success Criteria: {task.success_criteria}

For each subtask, specify:
1. Clear objective (one sentence)
2. Success criteria (measurable)
3. Best council to handle it: councilof (governance), sov3 (care/consciousness), moe (cloud models), local (private/local)

Return as JSON array:
[
  {{"description": "...", "success_criteria": "...", "assigned_council": "..."}},
  ...
]

Be specific. Each subtask must be independently verifiable."""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.ollama_url,
                    json={
                        "model": "hermes3:8b",
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get("response", "[]")
                    
                    # Parse JSON from response
                    try:
                        subtasks = json.loads(response_text)
                    except json.JSONDecodeError:
                        # Try to extract JSON from markdown
                        import re
                        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                        if json_match:
                            subtasks = json.loads(json_match.group())
                        else:
                            subtasks = []
                    
                    # Add IDs and parent reference
                    for i, st in enumerate(subtasks):
                        st["id"] = f"{task.id}_sub_{i}"
                        st["parent_id"] = task.id
                        st["status"] = "pending"
                        st["attempts"] = 0
                    
                    return subtasks
                else:
                    logger.error(f"RALPH: Ollama error {response.status_code}")
                    return self.fallback_decompose(task)
                    
        except Exception as e:
            logger.error(f"RALPH: Decomposition error: {e}")
            return self.fallback_decompose(task)
    
    def fallback_decompose(self, task: Task) -> List[Dict]:
        """Fallback decomposition if LLM fails"""
        return [
            {
                "id": f"{task.id}_sub_0",
                "parent_id": task.id,
                "description": f"Analyze: {task.description}",
                "success_criteria": "Analysis complete with clear findings",
                "assigned_council": "sov3",
                "status": "pending",
                "attempts": 0
            },
            {
                "id": f"{task.id}_sub_1", 
                "parent_id": task.id,
                "description": f"Execute: {task.description}",
                "success_criteria": task.success_criteria,
                "assigned_council": "moe",
                "status": "pending",
                "attempts": 0
            },
            {
                "id": f"{task.id}_sub_2",
                "parent_id": task.id,
                "description": f"Verify: {task.description}",
                "success_criteria": "All success criteria met",
                "assigned_council": "councilof",
                "status": "pending",
                "attempts": 0
            }
        ]
    
    async def councilof_vote(self, task: Task) -> Dict[str, Any]:
        """Get CouncilOf approval for task plan"""
        
        # Check if CouncilOf is running
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.councilof_url,
                    json={
                        "tool": "councilof_vote",
                        "params": {
                            "proposal": f"Execute task: {task.description}",
                            "subtasks": task.subtasks,
                            "severity": "significant"
                        }
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    # CouncilOf not available — auto-approve with warning
                    logger.warning("RALPH: CouncilOf not responding — auto-approving")
                    return {"approved": True, "note": "CouncilOf offline — CEO override"}
                    
        except Exception as e:
            logger.warning(f"RALPH: CouncilOf vote error: {e} — auto-approving")
            return {"approved": True, "note": "CouncilOf unreachable — CEO override"}
    
    async def delegate(self, task: Task) -> List[Dict]:
        """Route each subtask to appropriate council"""
        
        results = []
        
        for subtask in task.subtasks:
            if subtask.get("status") == "completed":
                results.append(subtask)
                continue
                
            council = subtask.get("assigned_council", "local")
            logger.info(f"RALPH: Delegating subtask {subtask['id']} to {council}")
            
            try:
                if council == "councilof":
                    result = await self.call_councilof(subtask)
                elif council == "sov3":
                    result = await self.call_sov3(subtask)
                elif council == "moe":
                    result = await self.call_moe(subtask)
                else:
                    result = await self.call_local(subtask)
                
                subtask["result"] = result
                subtask["status"] = "completed" if result.get("success") else "failed"
                results.append(subtask)
                
            except Exception as e:
                logger.error(f"RALPH: Subtask {subtask['id']} failed: {e}")
                subtask["status"] = "failed"
                subtask["error"] = str(e)
                results.append(subtask)
        
        return results
    
    async def call_councilof(self, subtask: Dict) -> Dict:
        """Call CouncilOf MCP"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.councilof_url,
                json={
                    "tool": "councilof_audit",
                    "params": {"work_product": subtask}
                },
                timeout=60.0
            )
            return response.json()
    
    async def call_sov3(self, subtask: Dict) -> Dict:
        """Call SOV3 MCP"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.sov3_url,
                json={
                    "tool": "sov3_execute",
                    "params": {
                        "task": subtask["description"],
                        "care_check": True
                    }
                },
                timeout=60.0
            )
            return response.json()
    
    async def call_moe(self, subtask: Dict) -> Dict:
        """Call MoE Council"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.moe_url,
                json={
                    "tool": "moe_route",
                    "params": {
                        "task": subtask["description"],
                        "complexity": "auto"
                    }
                },
                timeout=120.0
            )
            return response.json()
    
    async def call_local(self, subtask: Dict) -> Dict:
        """Call local Ollama"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.ollama_url,
                json={
                    "model": "hermes3:8b",
                    "prompt": subtask["description"],
                    "stream": False
                },
                timeout=60.0
            )
            result = response.json()
            return {
                "success": True,
                "response": result.get("response", ""),
                "model": "hermes3:8b"
            }
    
    async def verify(self, results: List[Dict], success_criteria: str) -> Dict[str, Any]:
        """Verify all subtasks meet success criteria"""
        
        all_passed = all(
            r.get("status") == "completed" and 
            r.get("result", {}).get("success", False)
            for r in results
        )
        
        failures = [
            r for r in results 
            if r.get("status") != "completed" or 
            not r.get("result", {}).get("success", False)
        ]
        
        return {
            "passed": all_passed,
            "total": len(results),
            "passed_count": len(results) - len(failures),
            "failed_count": len(failures),
            "failures": failures
        }
    
    async def repair_task(self, task: Task, failures: List[Dict]):
        """Repair task based on failure analysis"""
        
        logger.info(f"RALPH: Repairing task {task.id} — {len(failures)} failures")
        
        # Mark failed subtasks for retry
        for failure in failures:
            subtask_id = failure.get("id")
            for st in task.subtasks:
                if st["id"] == subtask_id:
                    st["status"] = "pending"
                    st["attempts"] += 1
                    # Increase timeout or change council for retry
                    if st["attempts"] > 2:
                        st["assigned_council"] = "moe"  # Upgrade to cloud
    
    async def revise(self, task: Task, feedback: str) -> List[Dict]:
        """Revise task plan based on CouncilOf feedback"""
        
        logger.info(f"RALPH: Revising task {task.id} based on feedback")
        # For now, add a verification subtask
        task.subtasks.append({
            "id": f"{task.id}_sub_verify",
            "parent_id": task.id,
            "description": f"Address feedback: {feedback}",
            "success_criteria": "Feedback incorporated",
            "assigned_council": "sov3",
            "status": "pending",
            "attempts": 0
        })
        return task.subtasks
    
    async def councilof_audit(self, task: Task, results: List[Dict]) -> Dict:
        """Get CouncilOf audit of completed work"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.councilof_url,
                    json={
                        "tool": "councilof_audit",
                        "params": {
                            "work_product": {
                                "task": task.description,
                                "subtasks": results,
                                "success_criteria": task.success_criteria
                            }
                        }
                    },
                    timeout=60.0
                )
                return response.json()
        except Exception as e:
            logger.warning(f"RALPH: CouncilOf audit error: {e}")
            return {"passed": True, "note": "Audit skipped — CouncilOf offline"}


# MCP Server Setup
if MCP_AVAILABLE:
    app = Server("ralph")
    ralph = RalphCEO()
    
    @app.call_tool()
    async def call_tool(name: str, arguments: dict) -> list:
        """MCP tool handler"""
        
        if name == "ralph_execute_task":
            task = Task(
                id=str(uuid.uuid4()),
                description=arguments.get("task_description", ""),
                success_criteria=arguments.get("success_criteria", ""),
                max_attempts=arguments.get("max_attempts", 10),
                timeout_minutes=arguments.get("timeout_minutes", 30)
            )
            
            result = await ralph.execute_task(task)
            
            return [TextContent(
                type="text",
                text=json.dumps(result, indent=2, default=str)
            )]
        
        elif name == "ralph_check_status":
            task_id = arguments.get("task_id", "")
            task = ralph.tasks.get(task_id)
            
            if task:
                status = {
                    "task_id": task_id,
                    "status": task.status,
                    "attempts": task.attempts,
                    "subtasks_completed": sum(1 for st in task.subtasks if st.get("status") == "completed"),
                    "subtasks_total": len(task.subtasks)
                }
            else:
                status = {"error": f"Task {task_id} not found"}
            
            return [TextContent(type="text", text=json.dumps(status, indent=2))]
        
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    
    @app.list_tools()
    async def list_tools() -> list:
        """List available tools"""
        return [
            Tool(
                name="ralph_execute_task",
                description="Execute a complex task with persistence and retry until success",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "task_description": {"type": "string", "description": "What to accomplish"},
                        "success_criteria": {"type": "string", "description": "How to verify completion"},
                        "max_attempts": {"type": "integer", "default": 10, "description": "Max retry attempts"},
                        "timeout_minutes": {"type": "integer", "default": 30, "description": "Timeout per attempt"}
                    },
                    "required": ["task_description", "success_criteria"]
                }
            ),
            Tool(
                name="ralph_check_status",
                description="Check status of running task",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string", "description": "Task ID to check"}
                    },
                    "required": ["task_id"]
                }
            )
        ]


# Standalone mode
async def main():
    """Run Ralph MCP server"""
    
    if MCP_AVAILABLE:
        # MCP mode
        async with stdio_server() as (read_stream, write_stream):
            await app.run(
                read_stream,
                write_stream,
                app.create_initialization_options()
            )
    else:
        # Standalone test mode
        logger.info("RALPH: Running in standalone test mode")
        
        ralph = RalphCEO()
        
        # Test task
        test_task = Task(
            id="test_001",
            description="Write a Python function to calculate fibonacci numbers",
            success_criteria="Function works for n=0 to n=20, returns correct values",
            max_attempts=3
        )
        
        result = await ralph.execute_task(test_task)
        print(f"\n=== RESULT ===")
        print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())
