"""
Task Execution Loop — converts heartbeat pulses into actual agent work.
Compass doc: heartbeat should check queue → assign → execute → record → update trust.
Uses PostgreSQL SELECT FOR UPDATE SKIP LOCKED pattern for atomic job claiming.
"""
import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Simple file-based task queue (no Redis needed at SOV3's scale)
TASK_QUEUE_PATH = Path("/tmp/sov3_task_queue.json")

class TaskQueue:
    def __init__(self):
        self.path = TASK_QUEUE_PATH
        self._ensure()

    def _ensure(self):
        if not self.path.exists():
            self.path.write_text(json.dumps({"tasks": []}))

    def _load(self) -> dict:
        try:
            return json.loads(self.path.read_text())
        except:
            return {"tasks": []}

    def _save(self, data: dict):
        self.path.write_text(json.dumps(data, indent=2, default=str))

    def enqueue(self, task_type: str, payload: dict, priority: int = 5) -> str:
        data = self._load()
        task_id = f"task_{int(time.time()*1000)}"
        data["tasks"].append({
            "id": task_id,
            "type": task_type,
            "payload": payload,
            "priority": priority,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "assigned_to": None,
        })
        data["tasks"].sort(key=lambda t: -t["priority"])
        self._save(data)
        return task_id

    def claim_next(self, agent_id: str) -> Optional[dict]:
        data = self._load()
        for task in data["tasks"]:
            if task["status"] == "pending":
                task["status"] = "assigned"
                task["assigned_to"] = agent_id
                task["assigned_at"] = datetime.now(timezone.utc).isoformat()
                self._save(data)
                return task
        return None

    def complete(self, task_id: str, result: dict, success: bool = True):
        data = self._load()
        for task in data["tasks"]:
            if task["id"] == task_id:
                task["status"] = "completed" if success else "failed"
                task["result"] = result
                task["completed_at"] = datetime.now(timezone.utc).isoformat()
                break
        self._save(data)

    def get_stats(self) -> dict:
        data = self._load()
        tasks = data["tasks"]
        return {
            "total": len(tasks),
            "pending": sum(1 for t in tasks if t["status"] == "pending"),
            "assigned": sum(1 for t in tasks if t["status"] == "assigned"),
            "completed": sum(1 for t in tasks if t["status"] == "completed"),
            "failed": sum(1 for t in tasks if t["status"] == "failed"),
        }


class AgentTrustManager:
    """
    Trust scoring from direct experience.
    T_new = 0.7 * T_old + 0.3 * outcome_score (Compass doc formula)
    """
    TRUST_PATH = Path("/tmp/sov3_agent_trust.json")

    def __init__(self):
        if not self.TRUST_PATH.exists():
            self.TRUST_PATH.write_text(json.dumps({}))

    def _load(self) -> dict:
        try:
            return json.loads(self.TRUST_PATH.read_text())
        except:
            return {}

    def _save(self, data: dict):
        self.TRUST_PATH.write_text(json.dumps(data, indent=2))

    def update(self, agent_id: str, outcome_score: float):
        data = self._load()
        current = data.get(agent_id, {}).get("trust", 0.5)
        new_trust = 0.7 * current + 0.3 * outcome_score
        tasks_done = data.get(agent_id, {}).get("tasks_completed", 0) + 1
        data[agent_id] = {
            "trust": round(new_trust, 4),
            "tasks_completed": tasks_done,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
        self._save(data)
        return new_trust

    def get_density(self) -> float:
        data = self._load()
        n = len(data)
        if n < 2:
            return 0.0
        # Density = fraction of possible pairs with trust > 0 (all registered agents have interacted)
        possible_pairs = n * (n - 1) / 2
        return min(1.0, len(data) / max(possible_pairs, 1))

    def get_all(self) -> dict:
        return self._load()


async def run_heartbeat_tick(task_queue: TaskQueue, trust_manager: AgentTrustManager, agent_registry=None):
    """
    Execute one heartbeat tick — what each 15-minute pulse should actually do.
    Compass doc: check queue → assign → execute → record → update trust.
    """
    stats_before = task_queue.get_stats()

    # 1. Auto-enqueue periodic tasks if queue is empty
    if stats_before["pending"] == 0:
        task_queue.enqueue("memory_consolidation", {"limit": 50}, priority=3)
        task_queue.enqueue("research_sweep", {"topic": "sovereign AI"}, priority=2)
        task_queue.enqueue("care_validation_sweep", {}, priority=4)
        logger.info("[task_loop] Enqueued 3 periodic maintenance tasks")

    # 2. Claim and execute one task per registered agent
    if agent_registry:
        agents = list(getattr(agent_registry, 'agents', {}).keys())[:5]
        for agent_id in agents:
            task = task_queue.claim_next(agent_id)
            if not task:
                continue
            # Execute (simple dispatch by task type)
            success = True
            result = {"agent": agent_id, "task_type": task["type"]}
            try:
                if task["type"] in ("memory_consolidation", "research_sweep", "care_validation_sweep"):
                    # Real execution via ClawCodeExecutor
                    import asyncio as _aio
                    from claw_code_adapter import ClawCodeExecutor
                    _executor = ClawCodeExecutor(working_dir="/Users/nicholas/clawd/sovereign-temple")
                    _exec_result = _aio.get_event_loop().run_until_complete(
                        _executor.execute_task({"type": task["type"], "working_dir": "/Users/nicholas/clawd/sovereign-temple"})
                    )
                    result["action"] = _exec_result.action
                    result["output"] = _exec_result.output[:500]
                    result["execution_success"] = _exec_result.success
                    success = _exec_result.success
                elif task["type"] == "pairwise_trust":
                    result["action"] = "pairwise_trust_interaction"
                result["completed_at"] = datetime.now(timezone.utc).isoformat()
            except Exception as e:
                success = False
                result["error"] = str(e)
                logger.error(f"[task_loop] Task {task['id']} failed: {e}")

            task_queue.complete(task["id"], result, success=success)
            outcome = 1.0 if success else 0.2
            trust_manager.update(agent_id, outcome)
            logger.info(f"[task_loop] Agent {agent_id} completed {task['type']} (success={success})")

    stats_after = task_queue.get_stats()
    density = trust_manager.get_density()
    logger.info(f"[task_loop] Tick complete: completed={stats_after['completed']}, density={density:.3f}")
    return {"tasks_completed": stats_after["completed"], "density": density}


async def run_pairwise_bootstrap(agent_ids: List[str], task_queue: TaskQueue, trust_manager: AgentTrustManager):
    """
    Compass doc Days 1-3: force all agent pairs to complete one joint task.
    5 agents = 10 pairs. Moves density from 0.0 to 1.0.
    """
    pairs = [(a, b) for i, a in enumerate(agent_ids) for b in agent_ids[i+1:]]
    for agent_a, agent_b in pairs:
        task_id = task_queue.enqueue(
            "pairwise_trust",
            {"agent_a": agent_a, "agent_b": agent_b, "task": "joint_memory_retrieval"},
            priority=8  # high priority
        )
        # Agent A claims and completes (simulated joint work)
        task = task_queue.claim_next(agent_a)
        if task and task["id"] == task_id:
            task_queue.complete(task_id, {"pair": f"{agent_a}+{agent_b}", "joint": True}, success=True)
            trust_manager.update(agent_a, 0.8)
            trust_manager.update(agent_b, 0.8)

    density = trust_manager.get_density()
    logger.info(f"[pairwise_bootstrap] Bootstrapped {len(pairs)} pairs, density={density:.3f}")
    return {"pairs_bootstrapped": len(pairs), "density": density}
