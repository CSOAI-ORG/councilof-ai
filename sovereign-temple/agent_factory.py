#!/usr/bin/env python3
"""
MEOK AI LABS — Agent Factory
Creates, manages, and coordinates sub-agents.
Each agent has skills, tasks, and persistent state.
Integrates with SOV3 via record_memory MCP tool.
"""

import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import requests

log = logging.getLogger("agent-factory")

SOV3_URL = "http://localhost:3101"
AGENTS_DIR = Path(__file__).parent / "data" / "agents"
AGENTS_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class AgentConfig:
    agent_id: str
    name: str
    role: str
    skills: List[str]
    status: str = "idle"
    created_at: str = ""
    tasks_completed: int = 0
    current_task: Optional[str] = None

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()


class AgentFactory:
    """Creates and manages sovereign sub-agents."""

    def __init__(self):
        self.agents: Dict[str, AgentConfig] = {}
        self._load_agents()

    def _load_agents(self):
        """Load existing agents from disk."""
        for path in AGENTS_DIR.glob("*.json"):
            try:
                with open(path) as f:
                    data = json.load(f)
                agent = AgentConfig(**data)
                self.agents[agent.agent_id] = agent
            except Exception as e:
                log.warning(f"Failed to load agent {path}: {e}")

    def _persist(self, agent: AgentConfig):
        """Save agent to disk."""
        path = AGENTS_DIR / f"{agent.agent_id}.json"
        with open(path, "w") as f:
            json.dump(asdict(agent), f, indent=2)

    def _register_in_sov3(self, agent: AgentConfig):
        """Register agent in SOV3 memory."""
        try:
            requests.post(f"{SOV3_URL}/mcp", json={
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "record_memory",
                    "arguments": {
                        "content": f"[Agent Spawned] {agent.name} (ID: {agent.agent_id}), "
                                   f"role: {agent.role}, skills: {', '.join(agent.skills)}",
                        "memory_type": "system",
                        "importance": 0.6,
                        "tags": ["agent", "spawn", agent.role],
                        "source_agent": "agent-factory",
                    }
                }
            }, timeout=5)
        except Exception:
            pass

    def spawn_agent(self, name: str, role: str, skills: List[str]) -> AgentConfig:
        """Create a new agent with given role and skills."""
        agent_id = f"{role}_{uuid.uuid4().hex[:8]}"
        agent = AgentConfig(
            agent_id=agent_id,
            name=name,
            role=role,
            skills=skills,
        )
        self.agents[agent_id] = agent
        self._persist(agent)
        self._register_in_sov3(agent)
        log.info(f"🤖 Spawned: {name} ({agent_id}) — role={role}, skills={skills}")
        return agent

    def list_agents(self) -> List[Dict]:
        """Return all agents as dicts."""
        return [asdict(a) for a in self.agents.values()]

    def assign_task(self, agent_id: str, task_description: str) -> bool:
        """Assign a task to an agent."""
        agent = self.agents.get(agent_id)
        if not agent:
            log.warning(f"Agent {agent_id} not found")
            return False

        agent.status = "working"
        agent.current_task = task_description
        self._persist(agent)
        log.info(f"📋 Assigned to {agent.name}: {task_description[:60]}...")
        return True

    def complete_task(self, agent_id: str) -> bool:
        """Mark agent's current task as complete."""
        agent = self.agents.get(agent_id)
        if not agent:
            return False

        agent.status = "idle"
        agent.current_task = None
        agent.tasks_completed += 1
        self._persist(agent)
        log.info(f"✅ {agent.name} completed task ({agent.tasks_completed} total)")
        return True

    def get_agent_status(self, agent_id: str) -> Optional[Dict]:
        """Get agent's current state."""
        agent = self.agents.get(agent_id)
        return asdict(agent) if agent else None

    def get_stats(self) -> Dict:
        """Factory-wide statistics."""
        return {
            "total_agents": len(self.agents),
            "by_role": {},
            "working": sum(1 for a in self.agents.values() if a.status == "working"),
            "idle": sum(1 for a in self.agents.values() if a.status == "idle"),
            "total_tasks_completed": sum(a.tasks_completed for a in self.agents.values()),
        }


# Global factory instance
factory = AgentFactory()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")

    # Test: spawn 3 agents
    a1 = factory.spawn_agent("Orion Research", "researcher", ["deep_research", "memory_synthesis"])
    a2 = factory.spawn_agent("Riri Coder", "coder", ["code_review", "generate_python"])
    a3 = factory.spawn_agent("Guardian Auditor", "auditor", ["safety_audit", "care_validation"])

    # Assign a task
    factory.assign_task(a1.agent_id, "Research EU AI Act compliance requirements for MEOK AI Labs")
    factory.complete_task(a1.agent_id)

    print(f"\nFactory Stats: {json.dumps(factory.get_stats(), indent=2)}")
    print(f"All agents: {len(factory.list_agents())}")
