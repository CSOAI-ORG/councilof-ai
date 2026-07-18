"""
Multi-Agent System for Sovereign Temple
Agent registry, task delegation, and collective voting
"""

import asyncio
import asyncpg
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Set, Callable
from dataclasses import dataclass, field, asdict
from enum import Enum
import json
import uuid


class AgentCapability(Enum):
    """Agent capabilities"""
    NEURAL_INFERENCE = "neural_inference"
    MEMORY_OPERATIONS = "memory_operations"
    WEB_SEARCH = "web_search"
    CODE_EXECUTION = "code_execution"
    ANALYSIS = "analysis"
    CREATIVE = "creative"
    COMMUNICATION = "communication"
    MONITORING = "monitoring"
    SECURITY = "security"
    PLANNING = "planning"


class AgentStatus(Enum):
    """Agent status"""
    ACTIVE = "active"
    BUSY = "busy"
    IDLE = "idle"
    OFFLINE = "offline"
    ERROR = "error"


@dataclass
class Agent:
    """Agent data structure"""
    id: str
    name: str
    description: str
    capabilities: List[AgentCapability]
    status: AgentStatus
    trust_level: float  # 0.0 to 1.0
    created_at: datetime
    last_seen: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    relationships: Dict[str, float] = field(default_factory=dict)  # agent_id -> trust
    performance_score: float = 0.5  # Historical performance
    tasks_completed: int = 0
    tasks_failed: int = 0
    current_task: Optional[str] = None
    # Ma (間) — strategic emptiness: deliberate pause between communications
    # From Japanese aesthetics: meaningful silence improves decision quality
    ma_interval_seconds: float = 0.0


@dataclass
class Task:
    """Task data structure"""
    id: str
    description: str
    required_capabilities: List[AgentCapability]
    priority: int  # 1-10, higher = more important
    created_at: datetime
    deadline: Optional[datetime] = None
    assigned_to: Optional[str] = None
    status: str = "pending"  # pending, assigned, in_progress, completed, failed
    result: Optional[Any] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    care_weight: float = 0.5  # Importance from care perspective


class AgentRegistry:
    """
    Central registry for all agents in the Sovereign ecosystem
    """
    
    def __init__(self, postgres_dsn: str = "postgresql://sovereign:sovereign@localhost:5432/sovereign_memory"):
        self.postgres_dsn = postgres_dsn
        self.pool: Optional[asyncpg.Pool] = None
        self.agents: Dict[str, Agent] = {}
        self.capability_index: Dict[AgentCapability, Set[str]] = {
            cap: set() for cap in AgentCapability
        }
    
    async def initialize(self):
        """Initialize the registry"""
        self.pool = await asyncpg.create_pool(self.postgres_dsn)
        await self._create_tables()
        await self._load_agents()
    
    async def _create_tables(self):
        """Create database tables"""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    capabilities TEXT[] NOT NULL,
                    status TEXT NOT NULL,
                    trust_level FLOAT NOT NULL DEFAULT 0.5,
                    created_at TIMESTAMP NOT NULL,
                    last_seen TIMESTAMP NOT NULL,
                    metadata JSONB DEFAULT '{}',
                    relationships JSONB DEFAULT '{}',
                    performance_score FLOAT DEFAULT 0.5,
                    tasks_completed INTEGER DEFAULT 0,
                    tasks_failed INTEGER DEFAULT 0
                )
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS agent_tasks (
                    id TEXT PRIMARY KEY,
                    description TEXT NOT NULL,
                    required_capabilities TEXT[] NOT NULL,
                    priority INTEGER NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    deadline TIMESTAMP,
                    assigned_to TEXT,
                    status TEXT NOT NULL,
                    result JSONB,
                    metadata JSONB DEFAULT '{}',
                    care_weight FLOAT DEFAULT 0.5,
                    FOREIGN KEY (assigned_to) REFERENCES agents(id)
                )
            """)
    
    async def _load_agents(self):
        # Fixed: asyncpg JSONB deserialization — field may arrive as string or dict depending on query path
        """Load agents from database"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM agents")

        for row in rows:
            # Ensure relationships is always a dict (DB may return string)
            raw_relationships = row["relationships"]
            if isinstance(raw_relationships, str):
                try:
                    raw_relationships = json.loads(raw_relationships)
                except (json.JSONDecodeError, TypeError):
                    raw_relationships = {}
            if not isinstance(raw_relationships, dict):
                raw_relationships = {}

            # Ensure metadata is always a dict
            raw_metadata = row["metadata"]
            if isinstance(raw_metadata, str):
                try:
                    raw_metadata = json.loads(raw_metadata)
                except (json.JSONDecodeError, TypeError):
                    raw_metadata = {}
            if not isinstance(raw_metadata, dict):
                raw_metadata = {}

            agent = Agent(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                capabilities=[AgentCapability(c) for c in row["capabilities"]],
                status=AgentStatus(row["status"]),
                trust_level=row["trust_level"],
                created_at=row["created_at"],
                last_seen=row["last_seen"],
                metadata=raw_metadata,
                relationships=raw_relationships,
                performance_score=row["performance_score"],
                tasks_completed=row["tasks_completed"],
                tasks_failed=row["tasks_failed"]
            )
            self.agents[agent.id] = agent
            
            # Index capabilities
            for cap in agent.capabilities:
                self.capability_index[cap].add(agent.id)
    
    async def register_agent(self,
                           name: str,
                           description: str,
                           capabilities: List[AgentCapability],
                           trust_level: float = 0.5,
                           metadata: Optional[Dict[str, Any]] = None) -> Agent:
        """Register a new agent"""
        
        agent_id = f"agent_{name.lower().replace(' ', '_')}_{uuid.uuid4().hex[:8]}"
        now = datetime.now()
        
        agent = Agent(
            id=agent_id,
            name=name,
            description=description,
            capabilities=capabilities,
            status=AgentStatus.IDLE,
            trust_level=trust_level,
            created_at=now,
            last_seen=now,
            metadata=metadata or {}
        )
        
        # Store in memory
        self.agents[agent_id] = agent
        for cap in capabilities:
            self.capability_index[cap].add(agent_id)
        
        # Store in database (with file fallback)
        try:
            if self.pool:
                async with self.pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO agents
                        (id, name, description, capabilities, status, trust_level,
                         created_at, last_seen, metadata, relationships)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (id) DO UPDATE SET last_seen = $8, status = $5
                    """, agent_id, name, description,
                        [c.value for c in capabilities],
                        agent.status.value, trust_level, now, now,
                        json.dumps(metadata or {}), json.dumps({}))
        except Exception:
            pass  # Fall through to file persistence

        # File-based persistence fallback
        try:
            from pathlib import Path
            state_dir = Path(__file__).resolve().parent.parent / "consciousness_core" / "state"
            if not state_dir.exists():
                state_dir = Path(__file__).resolve().parent.parent / "consciousness-core" / "state"
            state_dir.mkdir(parents=True, exist_ok=True)
            reg_file = state_dir / "agent_registry.json"
            existing = {}
            if reg_file.exists():
                with open(reg_file) as f:
                    existing = json.load(f)
            existing[agent_id] = {
                "id": agent_id, "name": name, "description": description,
                "capabilities": [c.value for c in capabilities],
                "trust_level": trust_level, "status": agent.status.value,
                "last_seen": now.isoformat(),
            }
            with open(reg_file, "w") as f:
                json.dump(existing, f, indent=2, default=str)
        except Exception:
            pass

        return agent
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        return self.agents.get(agent_id)
    
    def find_agents_by_capability(self, capability: AgentCapability, 
                                  min_trust: float = 0.0) -> List[Agent]:
        """Find agents with a specific capability"""
        agent_ids = self.capability_index.get(capability, set())
        agents = [self.agents[aid] for aid in agent_ids if aid in self.agents]
        return [a for a in agents if a.trust_level >= min_trust and a.status != AgentStatus.OFFLINE]
    
    def find_agents_by_capabilities(self, capabilities: List[AgentCapability],
                                    min_trust: float = 0.0) -> List[Agent]:
        """Find agents with all specified capabilities"""
        if not capabilities:
            return []
        
        # Start with agents having first capability
        candidate_ids = self.capability_index[capabilities[0]].copy()
        
        # Intersect with agents having other capabilities
        for cap in capabilities[1:]:
            candidate_ids &= self.capability_index[cap]
        
        agents = [self.agents[aid] for aid in candidate_ids if aid in self.agents]
        return [a for a in agents if a.trust_level >= min_trust and a.status != AgentStatus.OFFLINE]
    
    async def update_agent_status(self, agent_id: str, status: AgentStatus):
        """Update agent status"""
        if agent_id not in self.agents:
            return False
        
        self.agents[agent_id].status = status
        self.agents[agent_id].last_seen = datetime.now()
        
        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE agents SET status = $1, last_seen = $2 WHERE id = $3
            """, status.value, datetime.now(), agent_id)
        
        return True
    
    async def update_relationship(self, agent_id: str, other_agent_id: str, trust_delta: float):
        # Fixed: asyncpg JSONB deserialization — field may arrive as string or dict depending on query path
        """Update trust relationship between agents"""
        if agent_id not in self.agents:
            return False

        # Safety: ensure relationships is a dict
        if not isinstance(self.agents[agent_id].relationships, dict):
            if isinstance(self.agents[agent_id].relationships, str):
                try:
                    self.agents[agent_id].relationships = json.loads(self.agents[agent_id].relationships)
                except (json.JSONDecodeError, TypeError):
                    self.agents[agent_id].relationships = {}
            else:
                self.agents[agent_id].relationships = {}

        current_trust = self.agents[agent_id].relationships.get(other_agent_id, 0.5)
        new_trust = max(0.0, min(1.0, current_trust + trust_delta))
        
        self.agents[agent_id].relationships[other_agent_id] = new_trust
        
        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE agents SET relationships = $1 WHERE id = $2
            """, json.dumps(self.agents[agent_id].relationships), agent_id)
        
        return True
    
    async def record_task_result(self, agent_id: str, success: bool):
        """Record task completion result"""
        if agent_id not in self.agents:
            return
        
        agent = self.agents[agent_id]
        if success:
            agent.tasks_completed += 1
        else:
            agent.tasks_failed += 1
        
        # Update performance score
        total = agent.tasks_completed + agent.tasks_failed
        if total > 0:
            agent.performance_score = agent.tasks_completed / total

        if self.pool is not None:
            try:
                async with self.pool.acquire() as conn:
                    await conn.execute("""
                        UPDATE agents SET
                            tasks_completed = $1,
                            tasks_failed = $2,
                            performance_score = $3
                        WHERE id = $4
                    """, agent.tasks_completed, agent.tasks_failed, agent.performance_score, agent_id)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning("record_task_result: DB write failed: %s", e)
    
    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics"""
        total = len(self.agents)
        by_status = {}
        by_capability = {}

        for agent in self.agents.values():
            by_status[agent.status.value] = by_status.get(agent.status.value, 0) + 1
            for cap in agent.capabilities:
                by_capability[cap.value] = by_capability.get(cap.value, 0) + 1

        avg_trust = sum(a.trust_level for a in self.agents.values()) / total if total > 0 else 0
        avg_performance = sum(a.performance_score for a in self.agents.values()) / total if total > 0 else 0

        return {
            "total_agents": total,
            "by_status": by_status,
            "by_capability": by_capability,
            "average_trust": round(avg_trust, 3),
            "average_performance": round(avg_performance, 3),
            "total_tasks_completed": sum(a.tasks_completed for a in self.agents.values()),
            "total_tasks_failed": sum(a.tasks_failed for a in self.agents.values()),
            "engagement": self.compute_engagement()
        }

    def compute_engagement(self) -> Dict[str, Any]:
        """
        Ibn Khaldun's engagement — group feeling/social cohesion as a first-class metric.

        Measures the collective bonding strength of the agent ecosystem.
        Cyclic dynamics: strong cohesion → success → complacency → weakened cohesion.
        Predates Durkheim's "social solidarity" by 500 years.

        Components (weighted):
        - Mean inter-agent trust (0.30) — direct relationship quality
        - Task success ratio (0.25) — shared achievement history
        - Relationship density (0.25) — how interconnected agents are
        - Care alignment (0.20) — variance of care scores, inverted (low variance = high alignment)
        """
        agents = list(self.agents.values())
        total = len(agents)

        if total == 0:
            return {"score": 0.0, "components": {}, "phase": "dormant", "agent_count": 0}

        # 1. Mean inter-agent trust across all relationships
        all_trust_values = []
        for agent in agents:
            rels = agent.relationships
            if isinstance(rels, str):
                try:
                    rels = json.loads(rels)
                except (json.JSONDecodeError, TypeError):
                    rels = {}
            if isinstance(rels, dict):
                all_trust_values.extend(rels.values())

        mean_trust = sum(all_trust_values) / len(all_trust_values) if all_trust_values else 0.5

        # 2. Task success ratio across all agents
        total_completed = sum(a.tasks_completed for a in agents)
        total_failed = sum(a.tasks_failed for a in agents)
        total_tasks = total_completed + total_failed
        success_ratio = total_completed / total_tasks if total_tasks > 0 else 0.5

        # 3. Relationship density: actual relationships / possible relationships
        possible_relationships = total * (total - 1) if total > 1 else 1
        actual_relationships = len(all_trust_values)
        relationship_density = min(1.0, actual_relationships / possible_relationships)

        # 4. Care alignment: inverse of trust variance (low variance = high alignment)
        trust_values = [a.trust_level for a in agents]
        if len(trust_values) > 1:
            mean_tl = sum(trust_values) / len(trust_values)
            variance = sum((t - mean_tl) ** 2 for t in trust_values) / len(trust_values)
            care_alignment = max(0.0, 1.0 - variance * 4)  # Scale: variance 0.25 → alignment 0
        else:
            care_alignment = 1.0

        # Weighted combination
        score = (
            mean_trust * 0.30 +
            success_ratio * 0.25 +
            relationship_density * 0.25 +
            care_alignment * 0.20
        )
        score = round(min(1.0, max(0.0, score)), 4)

        # Khaldunian phase detection (cyclic dynamics)
        if score >= 0.8:
            phase = "peak_cohesion"       # Strong — watch for complacency
        elif score >= 0.6:
            phase = "building"            # Growing solidarity
        elif score >= 0.4:
            phase = "stable"              # Functional baseline
        elif score >= 0.2:
            phase = "weakening"           # Declining — needs intervention
        else:
            phase = "crisis"              # Khaldunian collapse imminent

        return {
            "score": score,
            "phase": phase,
            "agent_count": total,
            "components": {
                "mean_inter_agent_trust": round(mean_trust, 4),
                "task_success_ratio": round(success_ratio, 4),
                "relationship_density": round(relationship_density, 4),
                "care_alignment": round(care_alignment, 4),
            },
            "khaldunian_warning": phase in ("weakening", "crisis"),
        }


class TaskDelegator:
    """
    Delegates tasks to the most suitable agents
    """
    
    def __init__(self, registry: AgentRegistry):
        self.registry = registry
        self.delegation_strategies = {
            "capability_match": self._capability_match_strategy,
            "trust_weighted": self._trust_weighted_strategy,
            "load_balanced": self._load_balanced_strategy,
            "care_aware": self._care_aware_strategy,
        }
    
    async def delegate_task(self,
                          description: str,
                          required_capabilities: List[AgentCapability],
                          priority: int = 5,
                          deadline: Optional[datetime] = None,
                          care_weight: float = 0.5,
                          strategy: str = "care_aware",
                          excluded_agents: Optional[List[str]] = None) -> Optional[Task]:
        # Fixed: asyncpg JSONB deserialization — field may arrive as string or dict depending on query path
        """Delegate a task to the best available agent"""
        
        # Create task record
        task_id = f"task_{uuid.uuid4().hex[:12]}"
        task = Task(
            id=task_id,
            description=description,
            required_capabilities=required_capabilities,
            priority=priority,
            created_at=datetime.now(),
            deadline=deadline,
            care_weight=care_weight
        )
        
        # Find candidate agents
        candidates = self.registry.find_agents_by_capabilities(required_capabilities)
        if excluded_agents:
            candidates = [a for a in candidates if a.id not in excluded_agents]
        
        if not candidates:
            return None
        
        # Apply delegation strategy
        strategy_fn = self.delegation_strategies.get(strategy, self._care_aware_strategy)
        selected_agent = strategy_fn(candidates, task)
        
        if not selected_agent:
            return None
        
        # Assign task
        task.assigned_to = selected_agent.id
        task.status = "assigned"
        
        # Update agent status
        await self.registry.update_agent_status(selected_agent.id, AgentStatus.BUSY)
        selected_agent.current_task = task_id
        
        # Store task (skip DB write if pool unavailable — task still returned in-memory)
        if self.registry.pool is not None:
            try:
                async with self.registry.pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO agent_tasks
                        (id, description, required_capabilities, priority, created_at,
                         deadline, assigned_to, status, care_weight)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    """, task_id, description, [c.value for c in required_capabilities],
                        priority, task.created_at, deadline, selected_agent.id, "assigned", care_weight)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning("delegate_task: DB write failed: %s", e)

        return task
    
    def _capability_match_strategy(self, candidates: List[Agent], task: Task) -> Optional[Agent]:
        """Select agent with best capability match"""
        # Prioritize agents with fewer but sufficient capabilities (specialists)
        scored = []
        for i, agent in enumerate(candidates):
            if agent.status == AgentStatus.IDLE:
                # Score by having just the required capabilities + performance
                extra_caps = len(agent.capabilities) - len(task.required_capabilities)
                score = agent.performance_score - (extra_caps * 0.05)
                scored.append((score, i, agent))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][2] if scored else None

    def _trust_weighted_strategy(self, candidates: List[Agent], task: Task) -> Optional[Agent]:
        """Select agent based on trust level"""
        scored = []
        for i, agent in enumerate(candidates):
            if agent.status == AgentStatus.IDLE:
                score = agent.trust_level * 0.7 + agent.performance_score * 0.3
                scored.append((score, i, agent))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][2] if scored else None

    def _load_balanced_strategy(self, candidates: List[Agent], task: Task) -> Optional[Agent]:
        """Select agent with lowest load"""
        scored = []
        for i, agent in enumerate(candidates):
            if agent.status == AgentStatus.IDLE:
                # Prefer agents with fewer completed tasks (distribute load)
                score = 1.0 / (1 + agent.tasks_completed)
                scored.append((score, i, agent))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][2] if scored else None
    
    def _care_aware_strategy(self, candidates: List[Agent], task: Task) -> Optional[Agent]:
        # Fixed: asyncpg JSONB deserialization — field may arrive as string or dict depending on query path
        """Select agent considering care weight and trust"""
        scored = []
        for i, agent in enumerate(candidates):
            if agent.status in [AgentStatus.IDLE, AgentStatus.ACTIVE]:
                # Safety: ensure relationships is a dict before calling .get()
                relationships = agent.relationships
                if not isinstance(relationships, dict):
                    if isinstance(relationships, str):
                        try:
                            relationships = json.loads(relationships)
                        except (json.JSONDecodeError, TypeError):
                            relationships = {}
                    else:
                        relationships = {}
                    agent.relationships = relationships

                # Weighted combination
                trust_component = agent.trust_level * 0.3
                performance_component = agent.performance_score * 0.3
                care_component = (relationships.get("sovereign", 0.5) * 0.2)
                availability_component = 0.2 if agent.status == AgentStatus.IDLE else 0.1
                
                # For high-care tasks, boost trust component
                if task.care_weight > 0.7:
                    trust_component *= 1.5
                
                score = trust_component + performance_component + care_component + availability_component
                scored.append((score, i, agent))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][2] if scored else None
    
    async def complete_task(self, task_id: str, result: Any, success: bool = True):
        """Mark a task as completed"""
        if self.registry.pool is None:
            # In-memory fallback: find task and update agent count without DB
            for task in self.active_tasks.values() if hasattr(self, 'active_tasks') else []:
                if task.id == task_id and task.assigned_to:
                    await self.registry.record_task_result(task.assigned_to, success)
                    agent = self.registry.get_agent(task.assigned_to)
                    if agent:
                        agent.current_task = None
                        agent.status = AgentStatus.IDLE
            return True
        async with self.registry.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT assigned_to FROM agent_tasks WHERE id = $1
            """, task_id)
            
            if not row:
                return False
            
            await conn.execute("""
                UPDATE agent_tasks 
                SET status = $1, result = $2
                WHERE id = $3
            """, "completed" if success else "failed", json.dumps(result), task_id)
            
            # Update agent
            if row["assigned_to"]:
                await self.registry.update_agent_status(row["assigned_to"], AgentStatus.IDLE)
                await self.registry.record_task_result(row["assigned_to"], success)
                
                agent = self.registry.get_agent(row["assigned_to"])
                if agent:
                    agent.current_task = None
        
        return True


class AgentCouncil:
    """
    Council system for collective agent decision-making

    Incorporates Ma (間) — strategic emptiness — as a silence_budget:
    a deliberate pause between receiving a proposal and opening voting,
    allowing agents time for internal consolidation before reactive response.
    """

    def __init__(self, registry: AgentRegistry, silence_budget: float = 0.0):
        self.registry = registry
        self.proposals: Dict[str, Dict[str, Any]] = {}
        self.votes: Dict[str, Dict[str, str]] = {}  # proposal_id -> {agent_id: vote}
        # Ma (間): seconds of deliberate silence before voting opens
        # Higher values → more reflective council, better for high-care decisions
        self.silence_budget = silence_budget
    
    async def submit_proposal(self,
                            title: str,
                            description: str,
                            proposed_by: str,
                            action_type: str,
                            action_params: Dict[str, Any],
                            quorum: int = 3,
                            deadline_hours: int = 24) -> str:
        """Submit a proposal for council vote.

        If silence_budget > 0, introduces a Ma (間) pause before
        the proposal becomes votable — strategic emptiness that allows
        agents to process internally before reacting.
        """
        # Ma (間) — strategic emptiness before voting opens
        if self.silence_budget > 0:
            await asyncio.sleep(min(self.silence_budget, 10.0))  # Cap at 10s

        proposal_id = f"proposal_{uuid.uuid4().hex[:12]}"

        proposal = {
            "id": proposal_id,
            "title": title,
            "description": description,
            "proposed_by": proposed_by,
            "action_type": action_type,
            "action_params": action_params,
            "quorum": quorum,
            "deadline": datetime.now() + timedelta(hours=deadline_hours),
            "status": "open",
            "created_at": datetime.now(),
            "votes": {},
            "result": None
        }
        
        self.proposals[proposal_id] = proposal
        self.votes[proposal_id] = {}
        
        return proposal_id
    
    async def cast_vote(self, proposal_id: str, agent_id: str, vote: str, reasoning: str = "") -> bool:
        """Cast a vote on a proposal"""
        if proposal_id not in self.proposals:
            return False
        
        proposal = self.proposals[proposal_id]
        
        if proposal["status"] != "open":
            return False
        
        if datetime.now() > proposal["deadline"]:
            proposal["status"] = "expired"
            return False
        
        # Verify agent is eligible to vote
        agent = self.registry.get_agent(agent_id)
        if not agent or agent.trust_level < 0.3:
            return False
        
        self.votes[proposal_id][agent_id] = {
            "vote": vote,  # "for", "against", "abstain"
            "reasoning": reasoning,
            "timestamp": datetime.now(),
            "trust_level": agent.trust_level
        }
        
        # Check if quorum reached
        if len(self.votes[proposal_id]) >= proposal["quorum"]:
            await self._tally_votes(proposal_id)
        
        return True
    
    # Tiered governance — not all decisions need full council vote
    GOVERNANCE_TIERS = {
        0: {"threshold": 0.0,  "name": "auto-approved",    "types": ["scan", "report", "heartbeat", "memory_consolidation", "research_sweep"]},
        1: {"threshold": 0.50, "name": "quick-consensus",  "types": ["shared_resource", "tool_build", "sprint_start"]},
        2: {"threshold": 0.67, "name": "council-majority",  "types": ["config_change", "agent_register", "memory_delete"]},
        3: {"threshold": 0.91, "name": "supermajority",    "types": ["architecture", "covenant_change", "shutdown"]},
    }

    async def _tally_votes(self, proposal_id: str):
        """Tally votes and determine outcome using tiered governance."""
        proposal = self.proposals[proposal_id]
        votes = self.votes[proposal_id]

        # Determine governance tier from action_type
        action_type = proposal.get("action_type", "")
        tier = 2  # Default: council majority
        for t, config in self.GOVERNANCE_TIERS.items():
            if action_type in config["types"]:
                tier = t
                break

        # Tier 0: auto-approve without voting
        if tier == 0:
            proposal["status"] = "approved"
            proposal["result"] = {"outcome": "approved", "tier": 0, "tier_name": "auto-approved", "for": 1, "against": 0}
            return

        weighted_for = sum(
            v["trust_level"] for v in votes.values() if v["vote"] == "for"
        )
        weighted_against = sum(
            v["trust_level"] for v in votes.values() if v["vote"] == "against"
        )

        total_voting_power = weighted_for + weighted_against

        if total_voting_power == 0:
            proposal["status"] = "tied"
            proposal["result"] = {"outcome": "no_quorum", "for": 0, "against": 0}
            return

        for_ratio = weighted_for / total_voting_power
        threshold = self.GOVERNANCE_TIERS[tier]["threshold"]

        if for_ratio > threshold:
            outcome = "approved"
        elif for_ratio < (1.0 - threshold):
            outcome = "rejected"
        else:
            outcome = "tied"
        
        proposal["status"] = outcome
        proposal["result"] = {
            "outcome": outcome,
            "for": weighted_for,
            "against": weighted_against,
            "abstain": sum(1 for v in votes.values() if v["vote"] == "abstain"),
            "for_ratio": round(for_ratio, 3)
        }
    
    def get_proposal(self, proposal_id: str) -> Optional[Dict[str, Any]]:
        """Get proposal details"""
        return self.proposals.get(proposal_id)
    
    def list_open_proposals(self) -> List[Dict[str, Any]]:
        """List all open proposals"""
        now = datetime.now()
        open_proposals = []
        
        for proposal in self.proposals.values():
            if proposal["status"] == "open" and proposal["deadline"] > now:
                open_proposals.append(proposal)
        
        return sorted(open_proposals, key=lambda p: p["deadline"])
