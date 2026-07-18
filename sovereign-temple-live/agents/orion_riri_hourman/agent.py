"""
Orion-Riri-Hourman Hunter-Builder Agent
Main orchestrator combining all three modules
"""

import asyncio
import json
from dataclasses import asdict
from datetime import datetime
from typing import Dict, List, Optional

from .hunter import TaskHunter, get_hunter, TaskPriority
from .inventor import RapidInventor, get_inventor
from .sprint import SprintController, get_sprint_controller, SprintType


class HunterBuilderAgent:
    """
    The Orion-Riri-Hourman agent: hunts tasks, builds tools in time-boxed sprints.
    
    Combines:
    - Orion (Hunter): Finds and prioritizes tasks
    - Riri (Inventor): Rapid tool generation
    - Hourman (Sprinter): Time-boxed execution
    """

    AGENT_ID = "orion-riri-hourman"
    AGENT_NAME = "Orion-Riri-Hourman"
    DESCRIPTION = "Task Hunter-Builder with Time-Boxed Sprint Execution"

    def __init__(self):
        self.hunter = get_hunter()
        self.inventor = get_inventor()
        self.sprints = get_sprint_controller()
        
        self.care_validated = True  # All actions go through care membrane
        self.session_log: List[Dict] = []

    async def hunt_tasks(self, max_files: int = 100, root_dir: str = None,
                         include_quality: bool = False) -> Dict:
        """
        Hunt for tasks across the codebase.
        Returns prioritized list of tasks ready for capture.
        """
        result = await self.hunter.hunt(max_files=max_files, root_dir=root_dir,
                                         include_quality=include_quality)
        
        self._log_action("hunt", result)
        
        return {
            "agent": self.AGENT_ID,
            "action": "hunt",
            "summary": {
                "files_scanned": result["files_scanned"],
                "new_tasks": result["new_tasks_found"],
                "total_tasks": result["total_tasks"],
                "ready_to_capture": len(result["top_pursuing"])
            },
            "top_tasks": result["top_pursuing"],
            "status": self.get_full_status()
        }

    async def capture_task(self, task_id: str) -> Dict:
        """
        Capture a task for sprint execution.
        Task must be in PURSUING state.
        """
        task = self.hunter.capture_task(task_id)
        
        if not task:
            return {
                "success": False,
                "error": f"Task {task_id} not found or not ready for capture",
                "available_tasks": [
                    asdict(t) for t in self.hunter.get_pursuing_tasks()
                ]
            }
        
        self._log_action("capture", {"task_id": task_id, "task_title": task.title})
        
        return {
            "success": True,
            "captured_task": asdict(task),
            "next_step": "Start a sprint with hourman_start_sprint()",
            "status": self.get_full_status()
        }

    async def start_sprint(self, sprint_type_str: str, 
                          target_task_id: Optional[str] = None) -> Dict:
        """
        Start a Miraclo sprint.
        
        Args:
            sprint_type_str: "micro" (15min), "power" (1hr), or "deep" (4hr)
            target_task_id: Optional task to focus on
        """
        # Parse sprint type
        try:
            sprint_type = SprintType(sprint_type_str.lower())
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid sprint type: {sprint_type_str}",
                "valid_types": [t.value for t in SprintType]
            }
        
        # Get target task if specified
        target_task = None
        if target_task_id:
            target_task = self.hunter.get_task(target_task_id)
            if not target_task:
                return {
                    "success": False,
                    "error": f"Task not found: {target_task_id}"
                }
        
        # Validate care alignment
        if not self.care_validated:
            return {
                "success": False,
                "error": "Agent not validated through care membrane"
            }
        
        # Start sprint
        target_desc = target_task.title if target_task else "General development"
        result = await self.sprints.start_sprint(
            sprint_type=sprint_type,
            target_task=target_desc,
            care_validated=self.care_validated
        )
        
        if result["success"]:
            self._log_action("sprint_start", result)
        
        return {
            **result,
            "agent": self.AGENT_ID,
            "target_task": asdict(target_task) if target_task else None,
            "status": self.get_full_status()
        }

    async def complete_sprint(self, result_summary: str, 
                             completed_task_id: Optional[str] = None) -> Dict:
        """Complete the active sprint"""
        result = await self.sprints.complete_sprint(result_summary)
        
        if result["success"] and completed_task_id:
            self.hunter.complete_task(completed_task_id)
        
        self._log_action("sprint_complete", result)
        
        return {
            **result,
            "completed_task": completed_task_id,
            "status": self.get_full_status()
        }

    async def abort_sprint(self, reason: str) -> Dict:
        """Abort active sprint (emergency)"""
        result = await self.sprints.abort_sprint(reason)
        self._log_action("sprint_abort", result)
        return {**result, "status": self.get_full_status()}

    async def build_tool(self, template_name: str, params: Dict) -> Dict:
        """
        Rapidly build a tool from template.
        
        Args:
            template_name: Template to use (shell_automation, python_cli, etc.)
            params: Template parameters
        """
        # Check if in active sprint
        sprint_status = self.sprints.get_status()
        if sprint_status["status"] != "running":
            return {
                "success": False,
                "error": "Must be in active sprint to build tools",
                "hint": "Start a sprint first with start_sprint()"
            }
        
        result = self.inventor.build_tool(
            template_name=template_name,
            params=params,
            care_validated=self.care_validated
        )
        
        if result["success"]:
            self._log_action("build", {
                "tool_name": result["tool"]["name"],
                "template": template_name
            })
        
        return {
            **result,
            "sprint_context": sprint_status.get("active_sprint", {}),
            "status": self.get_full_status()
        }

    async def save_tool(self, tool_id: str, subdirectory: Optional[str] = None) -> Dict:
        """Save a built tool to the file system"""
        result = self.inventor.save_to_file(tool_id, subdirectory)
        
        if result["success"]:
            self._log_action("save_tool", {"tool_id": tool_id, "path": result["file_path"]})
        
        return result

    def get_full_status(self) -> Dict:
        """Get complete agent status"""
        return {
            "agent": {
                "id": self.AGENT_ID,
                "name": self.AGENT_NAME,
                "description": self.DESCRIPTION,
                "care_validated": self.care_validated
            },
            "hunter": self.hunter.get_hunt_summary(),
            "sprints": self.sprints.get_status(),
            "inventor": self.inventor.get_inventor_stats(),
            "session_actions": len(self.session_log)
        }

    def get_available_templates(self) -> Dict:
        """Get list of available tool templates"""
        return self.inventor.get_available_templates()

    def get_pursuing_tasks(self, limit: int = 10) -> List[Dict]:
        """Get tasks ready for capture"""
        return [asdict(t) for t in self.hunter.get_pursuing_tasks(limit)]

    def get_sprint_history(self, limit: int = 10) -> List[Dict]:
        """Get recent sprint history"""
        return [asdict(s) for s in self.sprints.sprint_history[-limit:]]

    def _log_action(self, action: str, details: Dict):
        """Log an action to session history"""
        self.session_log.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details
        })

    async def execute_workflow(self, workflow_type: str = "hunt_and_build") -> Dict:
        """
        Execute a complete workflow.
        
        Workflows:
        - "hunt_and_build": Hunt tasks, pick top, start micro sprint, build tool
        - "maintenance": Hunt TODOs, categorize, report
        - "creative": Start power sprint, build multiple tools
        """
        if workflow_type == "hunt_and_build":
            return await self._workflow_hunt_and_build()
        elif workflow_type == "maintenance":
            return await self._workflow_maintenance()
        elif workflow_type == "creative":
            return await self._workflow_creative()
        else:
            return {
                "success": False,
                "error": f"Unknown workflow: {workflow_type}",
                "available": ["hunt_and_build", "maintenance", "creative"]
            }

    async def _workflow_hunt_and_build(self) -> Dict:
        """Hunt tasks, capture best, start sprint"""
        # 1. Hunt
        hunt_result = await self.hunt_tasks(max_files=50)
        
        # 2. Capture top task
        top_tasks = self.hunter.get_pursuing_tasks(1)
        if not top_tasks:
            return {
                "success": False,
                "stage": "capture",
                "error": "No tasks ready for capture",
                "hunt_result": hunt_result
            }
        
        task = top_tasks[0]
        capture_result = await self.capture_task(task.id)
        
        # 3. Start micro sprint
        sprint_result = await self.start_sprint("micro", task.id)
        
        return {
            "success": sprint_result["success"],
            "workflow": "hunt_and_build",
            "stages": {
                "hunt": hunt_result["summary"],
                "capture": capture_result.get("captured_task", {}),
                "sprint": sprint_result.get("sprint", {})
            },
            "status": self.get_full_status()
        }

    async def _workflow_maintenance(self) -> Dict:
        """Scan codebase, categorize TODOs, report"""
        hunt_result = await self.hunt_tasks(max_files=200)
        
        summary = self.hunter.get_hunt_summary()
        
        return {
            "success": True,
            "workflow": "maintenance",
            "report": {
                "total_tasks": summary["total_tasks"],
                "stalking": summary["stalking"],
                "pursuing": summary["pursuing"],
                "captured": summary["captured"],
                "completed": summary["completed"],
                "high_care_ready": summary["high_care_ready"]
            },
            "recommendations": self._generate_recommendations(summary)
        }

    async def _workflow_creative(self) -> Dict:
        """Start creative power session"""
        sprint_result = await self.start_sprint("power")
        
        return {
            "success": sprint_result["success"],
            "workflow": "creative",
            "sprint": sprint_result.get("sprint", {}),
            "message": "Power sprint active. Build as many tools as possible!",
            "status": self.get_full_status()
        }

    def _generate_recommendations(self, summary: Dict) -> List[str]:
        """Generate maintenance recommendations"""
        recs = []
        
        if summary["stalking"] > 20:
            recs.append(f"Many tasks ({summary['stalking']}) need prioritization review")
        
        if summary["high_care_ready"] > 5:
            recs.append(f"{summary['high_care_ready']} high-care tasks ready for capture")
        
        if summary["total_tasks"] > 50:
            recs.append("Consider a 'deep' sprint for comprehensive cleanup")
        
        if not recs:
            recs.append("Codebase is well-maintained")
        
        return recs


# Singleton instance
_agent: Optional[HunterBuilderAgent] = None


def get_agent() -> HunterBuilderAgent:
    """Get or create agent singleton"""
    global _agent
    if _agent is None:
        _agent = HunterBuilderAgent()
    return _agent


# Convenience functions for MCP integration
async def hunt_tasks(max_files: int = 100) -> Dict:
    """MCP: Hunt for tasks"""
    return await get_agent().hunt_tasks(max_files)


async def capture_task(task_id: str) -> Dict:
    """MCP: Capture a task"""
    return await get_agent().capture_task(task_id)


async def start_sprint(sprint_type: str, task_id: Optional[str] = None) -> Dict:
    """MCP: Start a sprint"""
    return await get_agent().start_sprint(sprint_type, task_id)


async def complete_sprint(summary: str, task_id: Optional[str] = None) -> Dict:
    """MCP: Complete active sprint"""
    return await get_agent().complete_sprint(summary, task_id)


async def build_tool(template: str, params: Dict) -> Dict:
    """MCP: Build a tool"""
    return await get_agent().build_tool(template, params)


async def execute_workflow(workflow: str = "hunt_and_build") -> Dict:
    """MCP: Execute a workflow"""
    return await get_agent().execute_workflow(workflow)


def get_status() -> Dict:
    """MCP: Get agent status"""
    return get_agent().get_full_status()


def get_templates() -> Dict:
    """MCP: Get available templates"""
    return get_agent().get_available_templates()


if __name__ == "__main__":
    async def test():
        agent = HunterBuilderAgent()
        
        print("=== Orion-Riri-Hourman Agent Test ===\n")
        
        # Test hunt
        print("1. Hunting tasks...")
        hunt = await agent.hunt_tasks(max_files=30)
        print(json.dumps(hunt["summary"], indent=2))
        
        # Test status
        print("\n2. Agent Status:")
        print(json.dumps(agent.get_full_status(), indent=2))
        
        # Test templates
        print("\n3. Available Templates:")
        print(json.dumps(agent.get_available_templates(), indent=2))
    
    asyncio.run(test())
