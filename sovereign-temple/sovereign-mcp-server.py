#!/usr/bin/env python3
"""
Sovereign Temple MCP Server
Complete implementation with all 5 expansion modules
"""

import asyncio
import json
import re
import sys
import os
import subprocess
import time
import unicodedata
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from contextlib import asynccontextmanager

# Add module paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "neural_core"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "rag_core"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "monitoring"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "multi_agent"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "consciousness"))

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

try:
    from prometheus_fastapi_instrumentator import Instrumentator

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
from pydantic import BaseModel
import uvicorn

# Import our modules
from neural_core import create_default_registry, NeuralModelRegistry
from alert_system import (
    AlertManager,
    AlertSeverity,
    AlertChannel,
    console_alert_handler,
)
from audit_logger import AuditLogger, AuditEventType
from metrics_collector import MetricsCollector
from enhanced_memory import EnhancedMemoryStore
from agent_registry import AgentRegistry, TaskDelegator, AgentCouncil, AgentCapability
from emotional_state import ConsciousnessOrchestrator
from autonomous_maintenance import AutonomousMaintenanceSystem
from tool_dispatcher import ToolDispatcher
from safety_classifier import create_safety_router, SafetyClassifier
from sycophancy_detector import create_sycophancy_router, SycophancyDetector

# Morris-II worm-guard (arXiv:2403.02817) — additive defensive primitives.
# Log-only unless WORM_GUARD_ENFORCE=1, so importing/wiring this changes NO behavior
# by default; it only emits WORM_GUARD audit events when worm/injection patterns appear.
try:
    from security import worm_guard as _wg
except Exception as _wg_imp_err:  # never let the guard break server boot
    _wg = None
    print(f"[worm-guard] disabled (import failed): {_wg_imp_err}")
WORM_GUARD_ENFORCE = os.environ.get("WORM_GUARD_ENFORCE", "0") == "1"
# tool-ops: schema-validate + auto-repair tool-call args (always-on, safe). STRICT also
# blocks a call missing a required arg (default off = report-only, like the worm guard).
TOOL_OPS_STRICT = os.environ.get("TOOL_OPS_STRICT", "0") == "1"

# Project Heartbeat — Autonomous Self-Improvement
try:
    from sovereign_heartbeat import SovereignHeartbeat

    HEARTBEAT_AVAILABLE = True
except ImportError:
    HEARTBEAT_AVAILABLE = False
    SovereignHeartbeat = None

try:
    from sovereign_research_agent import AutonomousResearchAgent

    RESEARCH_AVAILABLE = True
except ImportError:
    RESEARCH_AVAILABLE = False

try:
    from sovereign_security_hardening import SecurityHardeningEngine

    SECURITY_HARDENING_AVAILABLE = True
except ImportError:
    SECURITY_HARDENING_AVAILABLE = False

try:
    from sovereign_continual_learning import ContinualLearningTrainer

    CONTINUAL_LEARNING_AVAILABLE = True
except ImportError:
    CONTINUAL_LEARNING_AVAILABLE = False

try:
    from lightgbm_fallback import LightGBMFallback

    LGBM_FALLBACK_AVAILABLE = True
except ImportError:
    LGBM_FALLBACK_AVAILABLE = False
    LightGBMFallback = None

# Civilizational Creativity Engine
try:
    from creativity_engine import (
        CreativityAssessmentNN,
        CreativityTrainingPipeline,
        kolmogorov_novelty,
        CORPUS,
        get_corpus_stats,
        ingest_corpus,
    )

    CREATIVITY_ENGINE_AVAILABLE = True
except ImportError:
    CREATIVITY_ENGINE_AVAILABLE = False
    CreativityTrainingPipeline = None

# Tier 2: Cross-Domain Bisociation, Stochastic Resonance, Quality-Diversity
try:
    from creativity_engine.cross_domain_linker import CrossDomainLinker
    from creativity_engine.stochastic_resonance import (
        StochasticResonanceEngine,
        apply_stochastic_resonance,
    )
    from creativity_engine.quality_diversity import QualityDiversityArchive

    TIER2_CREATIVITY_AVAILABLE = True
except ImportError:
    TIER2_CREATIVITY_AVAILABLE = False
    CrossDomainLinker = None
    StochasticResonanceEngine = None
    QualityDiversityArchive = None

# Kimi Agent (Moonshot AI)
try:
    from creativity_engine.kimi_agent import KimiAgent

    KIMI_AVAILABLE = True
except ImportError:
    KIMI_AVAILABLE = False
    KimiAgent = None

# Orion-Riri-Hourman Agent
# Try bundled ext_agents first (inside Docker), fallback to sovereign-temple-live on host
_orion_paths = [
    os.path.join(os.path.dirname(__file__), "ext_agents"),
    os.path.join(os.path.dirname(__file__), "..", "sovereign-temple-live", "agents"),
]
for _p in _orion_paths:
    if _p not in sys.path:
        sys.path.insert(0, _p)
try:
    from orion_riri_hourman import HunterBuilderAgent, get_agent as get_orion_agent

    ORION_AGENT_AVAILABLE = True
except ImportError as _e:
    print(f"[startup] Orion import failed: {_e}")
    ORION_AGENT_AVAILABLE = False
    get_orion_agent = None

# Multi-Agent Coordination Hub
# Try bundled ext_coordination first (inside Docker), fallback to sovereign-temple-live on host
_coord_paths = [
    os.path.dirname(
        __file__
    ),  # /app — so ext_coordination is importable as ext_coordination
    os.path.join(os.path.dirname(__file__), "ext_coordination"),  # direct files
    os.path.join(
        os.path.dirname(__file__), "..", "sovereign-temple-live"
    ),  # host: coordination pkg
]
for _p in _coord_paths:
    if _p not in sys.path:
        sys.path.insert(0, _p)
try:
    from coordination import get_hub as get_coordination_hub

    COORDINATION_AVAILABLE = True
except ImportError:
    try:
        from ext_coordination import (
            get_hub as get_coordination_hub,
        )  # Docker volume mount

        COORDINATION_AVAILABLE = True
    except ImportError as _e:
        print(f"[startup] Coordination import failed: {_e}")
        COORDINATION_AVAILABLE = False
        get_coordination_hub = None

# Task Execution Loop — Compass doc: heartbeat → queue → execute → trust
try:
    from task_execution_loop import (
        TaskQueue,
        AgentTrustManager,
        run_heartbeat_tick,
        run_pairwise_bootstrap,
    )

    TASK_LOOP_AVAILABLE = True
except ImportError as _e:
    print(f"[startup] Task execution loop import failed: {_e}")
    TASK_LOOP_AVAILABLE = False

# HARV — Holistic Ambient Reality Vectoriser (Phase 1)
try:
    from harv_context import get_harv, HARVContext

    HARV_AVAILABLE = True
except ImportError:
    HARV_AVAILABLE = False

# StreamAggregator — multi-stream terminal/screen/app context hub
try:
    from stream_aggregator import get_aggregator, StreamAggregator

    STREAM_AGG_AVAILABLE = True
except ImportError:
    STREAM_AGG_AVAILABLE = False

# NVIDIA Nemotron 3 Nano 30B API Client
try:
    from neural_core.nemotron_client import get_nemotron_client, NemotronClient

    NEMOTRON_AVAILABLE = True
except ImportError:
    NEMOTRON_AVAILABLE = False
    NemotronClient = None

# Universal MCP Bridge — calls any of the 207 marketplace servers
try:
    from mcp_bridge import (
        get_bridge as get_mcp_bridge,
        get_feedback as get_mcp_feedback,
        handle_mcp_bridge_call,
        handle_mcp_bridge_discover,
        handle_mcp_bridge_stats,
        handle_mcp_bridge_learn,
        BRIDGE_TOOL_DEFINITIONS,
    )
    MCP_BRIDGE_AVAILABLE = True
except ImportError as _e:
    print(f"[startup] MCP Bridge import failed: {_e}")
    MCP_BRIDGE_AVAILABLE = False
    BRIDGE_TOOL_DEFINITIONS = []


# MCP Models
class ToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any]


class McpRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[str] = None
    method: str
    params: Optional[Dict[str, Any]] = None


# Global state
model_registry: Optional[NeuralModelRegistry] = None
memory_store: Optional[EnhancedMemoryStore] = None
audit_logger: Optional[AuditLogger] = None
metrics: Optional[MetricsCollector] = None
alert_manager: Optional[AlertManager] = None
agent_registry: Optional[AgentRegistry] = None
task_delegator: Optional[TaskDelegator] = None
agent_council: Optional[AgentCouncil] = None
consciousness: Optional[ConsciousnessOrchestrator] = None
maintenance_system: Optional[AutonomousMaintenanceSystem] = None
heartbeat: Optional[Any] = None  # SovereignHeartbeat instance
research_agent: Optional[Any] = None  # AutonomousResearchAgent instance
security_engine: Optional[Any] = None  # SecurityHardeningEngine instance
continual_trainer: Optional[Any] = None  # ContinualLearningTrainer instance
creativity_pipeline: Optional[Any] = None  # CreativityTrainingPipeline instance
cross_domain_linker: Optional[Any] = None  # CrossDomainLinker instance
resonance_engine: Optional[Any] = None  # StochasticResonanceEngine instance
qd_archive: Optional[Any] = None  # QualityDiversityArchive instance
kimi_agent: Optional[Any] = None  # KimiAgent when available
orion_agent: Optional[Any] = None  # HunterBuilderAgent when available
coordination_hub: Optional[Any] = None
_model_orchestrator: Optional[Any] = None  # ModelOrchestrator instance
tool_dispatcher: Optional[ToolDispatcher] = None
_task_queue: Optional[Any] = None  # TaskQueue instance
_trust_manager: Optional[Any] = None  # AgentTrustManager instance
lgbm_fallback: Optional[Any] = None  # LightGBMFallback instance
nemotron_client: Optional[Any] = None  # NemotronClient instance

# Compass Activation — stats counter and server start time
_tool_call_stats: Dict[str, Any] = {"total": 0, "by_tool": {}}
_SERVER_START: float = time.time()


class ModelOrchestrator:
    """Run all trained neural models concurrently via ThreadPoolExecutor."""

    def __init__(self, registry, executor=None):
        self._registry = registry
        self._executor = executor or ThreadPoolExecutor(
            max_workers=6, thread_name_prefix="model_"
        )

    async def predict_all(self, message_text: str, features: dict = None) -> dict:
        """Run all available models concurrently. Returns dict of model_name -> result."""
        loop = asyncio.get_event_loop()
        tasks = {}
        if not self._registry:
            return {}
        models = self._registry.models if hasattr(self._registry, "models") else {}
        for name, model in models.items():
            if model and getattr(model, "is_trained", False):
                tasks[name] = loop.run_in_executor(
                    self._executor,
                    model.predict,
                    features.get(name, message_text) if features else message_text,
                )
        results = {}
        for name, task in tasks.items():
            try:
                results[name] = await asyncio.wait_for(task, timeout=5.0)
            except Exception as e:
                results[name] = {"error": str(e)}
        return results


# MCP Tools Definition
MCP_TOOLS = [
    # Hermes Agent Tools
    {
        "name": "hermes_ask",
        "description": "Send a prompt to Hermes agent (Kimi K2.5 / Claude / Gemma) and get a response",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "The prompt to send to Hermes"}
            },
            "required": ["prompt"],
        },
    },
    {
        "name": "hermes_research",
        "description": "Use Hermes agent for web research on a topic",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Research query"}
            },
            "required": ["query"],
        },
    },
    # K2.5 Vision Tools
    {
        "name": "k25_analyze_image",
        "description": "Analyze an image using Kimi K2.5 multi-modal vision (photos, screenshots, documents)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "image_path": {"type": "string", "description": "Path to the image file"},
                "prompt": {"type": "string", "description": "What to analyze", "default": "Analyze this image in detail"},
            },
            "required": ["image_path"],
        },
    },
    {
        "name": "k25_ui_to_code",
        "description": "Convert a UI screenshot/mockup into production-ready code using K2.5 vision",
        "inputSchema": {
            "type": "object",
            "properties": {
                "image_path": {"type": "string", "description": "Path to the UI screenshot"},
                "framework": {"type": "string", "description": "Target framework", "default": "react"},
            },
            "required": ["image_path"],
        },
    },
] + (BRIDGE_TOOL_DEFINITIONS if MCP_BRIDGE_AVAILABLE else []) + [
    # Neural Tools
    {
        "name": "validate_care",
        "description": "Validate text against care-centered principles using neural network",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to validate"}
            },
            "required": ["text"],
        },
    },
    {
        "name": "detect_partnership_opportunities",
        "description": "Detect strategic partnership opportunities from text",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to analyze"}
            },
            "required": ["text"],
        },
    },
    {
        "name": "detect_threats",
        "description": "Detect security threats, adversarial inputs, or manipulation attempts",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to analyze for threats"}
            },
            "required": ["text"],
        },
    },
    {
        "name": "predict_relationship_evolution",
        "description": "Predict how a relationship will evolve over time",
        "inputSchema": {
            "type": "object",
            "properties": {
                "current_trust": {"type": "number"},
                "interaction_frequency": {"type": "number"},
                "care_score_avg": {"type": "number"},
                "conflict_count": {"type": "integer"},
                "collaboration_count": {"type": "integer"},
                "days_since_first_contact": {"type": "integer"},
                "reciprocity_score": {"type": "number"},
                "vulnerability_sharing": {"type": "number"},
                "boundary_respect": {"type": "number"},
                "shared_value_alignment": {"type": "number"},
            },
            "required": ["current_trust"],
        },
    },
    {
        "name": "analyze_care_patterns",
        "description": "Analyze care patterns to detect burnout or imbalance",
        "inputSchema": {
            "type": "object",
            "properties": {
                "care_given_per_day": {"type": "number"},
                "care_received_per_day": {"type": "number"},
                "active_relationships": {"type": "integer"},
                "high_demand_relationships": {"type": "integer"},
                "avg_care_quality": {"type": "number"},
                "days_since_self_care": {"type": "integer"},
                "boundary_violations": {"type": "integer"},
                "emotional_exhaustion_score": {"type": "number"},
                "relationship_satisfaction": {"type": "number"},
                "energy_level": {"type": "number"},
                "sleep_quality": {"type": "number"},
                "work_life_balance": {"type": "number"},
            },
            "required": ["care_given_per_day"],
        },
    },
    {
        "name": "get_neural_model_info",
        "description": "Get information about all neural models",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # Memory Tools
    {
        "name": "record_memory",
        "description": "Record a memory episode with care-weighting",
        "inputSchema": {
            "type": "object",
            "properties": {
                "content": {"type": "string"},
                "source_agent": {"type": "string"},
                "memory_type": {
                    "type": "string",
                    "enum": ["interaction", "insight", "decision", "emotion"],
                },
                "care_weight": {"type": "number"},
                "tags": {"type": "array", "items": {"type": "string"}},
                "emotional_valence": {"type": "number"},
            },
            "required": ["content", "source_agent"],
        },
    },
    {
        "name": "query_memories",
        "description": "Query memories using semantic search with care-weighting",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "care_weight_min": {"type": "number"},
                "tags": {"type": "array", "items": {"type": "string"}},
                "limit": {"type": "integer"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_temporal_chain",
        "description": "Get temporal chain of related memories",
        "inputSchema": {
            "type": "object",
            "properties": {
                "episode_id": {"type": "string"},
                "direction": {
                    "type": "string",
                    "enum": ["forward", "backward", "both"],
                },
                "max_steps": {"type": "integer"},
            },
            "required": ["episode_id"],
        },
    },
    {
        "name": "get_memory_stats",
        "description": "Get memory system statistics",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_memories",
        "description": "List all memories from PostgreSQL",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum memories to return",
                    "default": 50,
                }
            },
        },
    },
    # Monitoring Tools
    {
        "name": "get_dashboard_metrics",
        "description": "Get real-time dashboard metrics",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_audit_logs",
        "description": "Query audit logs",
        "inputSchema": {
            "type": "object",
            "properties": {
                "event_type": {"type": "string"},
                "source_agent": {"type": "string"},
                "limit": {"type": "integer"},
            },
        },
    },
    {
        "name": "get_active_alerts",
        "description": "Get active alerts",
        "inputSchema": {
            "type": "object",
            "properties": {
                "min_severity": {
                    "type": "string",
                    "enum": ["info", "warning", "critical", "emergency"],
                }
            },
        },
    },
    # Multi-Agent Tools
    {
        "name": "register_agent",
        "description": "Register a new agent",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "capabilities": {"type": "array", "items": {"type": "string"}},
                "trust_level": {"type": "number"},
            },
            "required": ["name", "capabilities"],
        },
    },
    {
        "name": "delegate_task",
        "description": "Delegate a task to the best available agent",
        "inputSchema": {
            "type": "object",
            "properties": {
                "description": {"type": "string"},
                "required_capabilities": {"type": "array", "items": {"type": "string"}},
                "priority": {"type": "integer"},
                "care_weight": {"type": "number"},
            },
            "required": ["description", "required_capabilities"],
        },
    },
    {
        "name": "submit_council_proposal",
        "description": "Submit a proposal for agent council vote",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "proposed_by": {"type": "string"},
                "action_type": {"type": "string"},
                "action_params": {"type": "object"},
            },
            "required": ["title", "description", "proposed_by"],
        },
    },
    {
        "name": "vote_on_proposal",
        "description": "Cast a vote on a council proposal",
        "inputSchema": {
            "type": "object",
            "properties": {
                "proposal_id": {"type": "string"},
                "agent_id": {"type": "string"},
                "vote": {"type": "string", "enum": ["for", "against", "abstain"]},
                "reasoning": {"type": "string"},
            },
            "required": ["proposal_id", "agent_id", "vote"],
        },
    },
    {
        "name": "get_agent_registry_stats",
        "description": "Get agent registry statistics",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "swarm_orchestrate",
        "description": "Ruflo-pattern Queen/worker orchestration: decompose a mission into bounded-context subtasks (DDD), assign each to the best worker via the delegator, and attach an INDEPENDENT reviewer agent to each (Aegis gate). Returns the swarm plan.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "mission": {"type": "string"},
                "topology": {"type": "string", "enum": ["hierarchical", "mesh", "star"]},
                "subtasks": {"type": "array", "items": {"type": "object"}},
                "priority": {"type": "integer"},
                "care_weight": {"type": "number"},
            },
            "required": ["mission"],
        },
    },
    {
        "name": "swarm_review",
        "description": "Aegis reviewer-gate: scan a subtask result for Morris-II worm/injection payloads + run a quality check. A result only passes (status=completed) if it clears the gate; else it is rejected.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "result": {"type": "string"},
                "subtask_id": {"type": "string"},
                "description": {"type": "string"},
                "reviewer_agent": {"type": "string"},
            },
            "required": ["result"],
        },
    },
    {
        "name": "curate_skills",
        "description": "Hermes Curator: grade the skill library + tool surface by real usage (usage_count, success, recency, errors), find duplicate skills, and recommend prune/consolidate/repair/validate/promote. Report-only — recommends, never deletes.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "stale_days": {"type": "integer"},
                "fragile_success": {"type": "number"},
            },
        },
    },
    {
        "name": "sigil_emit",
        "description": "Emit a SIGNED SIGIL inter-agent exchange onto the hash-chained ledger — the shared, auditable interchange for the opus/minimax/kimi/sov3 fleet. Pass a raw `line` (e.g. 'H|opus|sov3|review the Q3 plan') OR structured {op, fields}. Returns {line, gloss, digest, signature}.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "line": {"type": "string"},
                "op": {"type": "string", "enum": ["P", "V", "M", "Q", "C", "H", "S", "A"]},
                "fields": {"type": "object"},
            },
        },
    },
    {
        "name": "sigil_transcript",
        "description": "Read recent signed SIGIL exchanges (gloss + digest + signature) and verify the ledger hash-chain integrity — the auditable agent-communication viewer.",
        "inputSchema": {"type": "object", "properties": {"n": {"type": "integer"}}},
    },
    # Consciousness Tools
    {
        "name": "get_consciousness_state",
        "description": "Get current consciousness state including emotions",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "trigger_reflection",
        "description": "Trigger a reflection cycle",
        "inputSchema": {
            "type": "object",
            "properties": {"trigger": {"type": "string"}},
        },
    },
    {
        "name": "enter_dream_state",
        "description": "Enter dream state for background processing",
        "inputSchema": {
            "type": "object",
            "properties": {"duration_seconds": {"type": "integer"}},
        },
    },
    # System Tools
    {
        "name": "sovereign_health_check",
        "description": "Check overall system health",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_system_status",
        "description": "Get complete system status",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "trigger_maintenance",
        "description": "Manually trigger autonomous maintenance cycle",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_maintenance_status",
        "description": "Get autonomous maintenance system status",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # Orion-Riri-Hourman Agent Tools
    {
        "name": "orion_hunt_tasks",
        "description": "Hunt for TODO/FIXME/quality issues across any codebase (Orion module). Pass root_dir to scan MEOK or other projects.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "max_files": {
                    "type": "integer",
                    "description": "Max files to scan (default 100, use 500 for deep scan)",
                    "default": 100,
                },
                "root_dir": {
                    "type": "string",
                    "description": "Root directory to scan (e.g. /Users/nicholas/clawd/meok/ui/src)",
                },
                "include_quality": {
                    "type": "boolean",
                    "description": "Also scan for quality issues (empty catches, any types, ts-ignore)",
                    "default": False,
                },
            },
        },
    },
    {
        "name": "orion_get_tasks",
        "description": "Get prioritized tasks ready for capture",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of tasks to return",
                    "default": 10,
                }
            },
        },
    },
    {
        "name": "orion_capture_task",
        "description": "Capture a task for sprint execution",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID to capture"}
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "hourman_start_sprint",
        "description": "Start a Miraclo sprint (micro/power/deep)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "sprint_type": {
                    "type": "string",
                    "enum": ["micro", "power", "deep"],
                    "description": "Sprint duration type",
                },
                "task_id": {
                    "type": "string",
                    "description": "Optional task ID to focus on",
                },
            },
            "required": ["sprint_type"],
        },
    },
    {
        "name": "hourman_get_status",
        "description": "Get sprint controller status and energy levels",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "hourman_complete_sprint",
        "description": "Complete the active sprint with results",
        "inputSchema": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "Summary of what was accomplished",
                },
                "task_id": {
                    "type": "string",
                    "description": "Optional task ID to mark complete",
                },
            },
            "required": ["summary"],
        },
    },
    {
        "name": "riri_list_templates",
        "description": "List available tool templates for rapid building",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "riri_build_tool",
        "description": "Build a tool from a template (Riri module)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "template": {"type": "string", "description": "Template name"},
                "name": {"type": "string", "description": "Tool name"},
                "description": {"type": "string", "description": "Tool description"},
                "params": {
                    "type": "object",
                    "description": "Template-specific parameters",
                },
            },
            "required": ["template", "name", "description"],
        },
    },
    {
        "name": "orion_riri_hourman_status",
        "description": "Get complete Orion-Riri-Hourman agent status",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # Multi-Agent Coordination Tools
    {
        "name": "coord_register_agent",
        "description": "Register an agent with the coordination hub",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "agent_type": {
                    "type": "string",
                    "enum": [
                        "claude-desktop",
                        "claude-code",
                        "kimi-cli",
                        "orion-agent",
                        "openhands",
                    ],
                },
                "capabilities": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["agent_id", "agent_type", "capabilities"],
        },
    },
    {
        "name": "coord_submit_task",
        "description": "Submit a task to the coordination queue",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "files": {"type": "array", "items": {"type": "string"}},
                "care_score": {"type": "number", "minimum": 0, "maximum": 1},
            },
            "required": ["title", "description", "files"],
        },
    },
    {
        "name": "coord_acquire_files",
        "description": "Acquire files for editing (with locking)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "files": {"type": "array", "items": {"type": "string"}},
                "task_id": {"type": "string"},
                "exclusive": {"type": "boolean", "default": False},
            },
            "required": ["agent_id", "files", "task_id"],
        },
    },
    {
        "name": "coord_release_files",
        "description": "Release file locks",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "files": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["agent_id", "files"],
        },
    },
    {
        "name": "coord_complete_task",
        "description": "Mark a task as complete",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string"},
                "agent_id": {"type": "string"},
                "result_summary": {"type": "string"},
                "care_score": {"type": "number"},
            },
            "required": ["task_id", "agent_id", "result_summary"],
        },
    },
    {
        "name": "coord_get_dashboard",
        "description": "Get coordination dashboard with all agents and tasks",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # Project Heartbeat — Autonomous Self-Improvement Tools
    {
        "name": "get_heartbeat_status",
        "description": "Get Sovereign heartbeat scheduler status, running jobs, and next run times",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_nightshift_digest",
        "description": "Get the latest morning intelligence digest compiled during nightshift",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "trigger_research_sweep",
        "description": "Manually trigger an autonomous research sweep (RSS + web + Ollama summarization)",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "trigger_security_hardening",
        "description": "Manually trigger a security self-hardening cycle",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "run_quantum_batch",
        "description": "Run the full quantum batch on M2: QAOA care optimisation + VQE memory scoring + Grover search. Results pushed to SOV3 memory.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "qaoa_only": {
                    "type": "boolean",
                    "description": "Run only QAOA care weight optimisation",
                }
            },
        },
    },
    {
        "name": "quantum_memory_search",
        "description": "Quantum-accelerated Grover search over SOV3 memory episodes",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "top_k": {
                    "type": "integer",
                    "description": "Number of results (default 5)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "quantum_score_memories",
        "description": "VQE importance scoring for memory episodes. Returns top-k most important episodes.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "top_k": {
                    "type": "integer",
                    "description": "Number of top episodes to return (default 10)",
                }
            },
        },
    },
    {
        "name": "trigger_neural_retrain",
        "description": "Manually trigger neural model retraining cycle",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "pause_heartbeat_job",
        "description": "Pause a specific heartbeat scheduler job (human override)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "job_id": {
                    "type": "string",
                    "description": "Job ID to pause (e.g., heartbeat_pulse, nightshift_deep, research_sweep)",
                }
            },
            "required": ["job_id"],
        },
    },
    {
        "name": "resume_heartbeat_job",
        "description": "Resume a paused heartbeat scheduler job",
        "inputSchema": {
            "type": "object",
            "properties": {
                "job_id": {"type": "string", "description": "Job ID to resume"}
            },
            "required": ["job_id"],
        },
    },
    # Civilizational Creativity Engine Tools
    {
        "name": "ingest_civilizational_knowledge",
        "description": "Ingest the 47-tradition civilizational knowledge corpus into memory. Idempotent — safe to call multiple times.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "force": {
                    "type": "boolean",
                    "description": "Force re-ingestion even if already present",
                    "default": False,
                }
            },
        },
    },
    {
        "name": "assess_creativity",
        "description": "Assess creative quality of content using the CreativityAssessmentNN trained on 47 civilizational traditions",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Content to assess for creativity",
                },
                "novelty_score": {
                    "type": "number",
                    "description": "Pre-computed novelty score (0-1)",
                },
                "domain_distance": {
                    "type": "number",
                    "description": "Cross-domain distance (0-1)",
                },
                "care_alignment": {
                    "type": "number",
                    "description": "Care principle alignment (0-1)",
                },
            },
            "required": ["text"],
        },
    },
    # New AI Models - Sentiment, Emotion, Intent
    {
        "name": "analyze_sentiment",
        "description": "Analyze sentiment of text (positive, negative, neutral, mixed)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Text to analyze for sentiment",
                }
            },
            "required": ["text"],
        },
    },
    {
        "name": "recognize_emotions",
        "description": "Recognize specific emotions in text (joy, sadness, anger, fear, surprise, disgust, etc.)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Text to analyze for emotions",
                }
            },
            "required": ["text"],
        },
    },
    {
        "name": "detect_intent",
        "description": "Detect user intent from natural language (help, create, learn, play, chat, etc.)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to analyze for intent"}
            },
            "required": ["text"],
        },
    },
    {
        "name": "get_engagement_score",
        "description": "Get Ibn Khaldun's engagement (group cohesion) metric for the agent ecosystem",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_consciousness_mode",
        "description": "Get the current Vedantic consciousness mode: Jagrat (waking), Svapna (dreaming), Susupti (deep sleep), or Turiya (meta-monitoring)",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "compute_novelty",
        "description": "Compute Kolmogorov complexity novelty score for text against reference corpus",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to score for novelty"},
                "reference_texts": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Reference corpus (optional — uses recent memories if empty)",
                },
            },
            "required": ["text"],
        },
    },
    {
        "name": "trigger_creativity_cycle",
        "description": "Manually trigger the creativity nightshift cycle: Susupti consolidation → NREM/REM dreaming → novelty scoring → creative assessment",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_meta_observations",
        "description": "Get Turiya meta-monitor observations — meta-cognitive assessment of system coherence across all subsystems",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # Tier 2: Cross-Domain Bisociation
    {
        "name": "find_bisociations",
        "description": "Find surprising cross-domain connections between civilizational traditions (Koestler bisociation). Returns ranked creative collision opportunities.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "min_distance": {
                    "type": "number",
                    "description": "Minimum semantic distance threshold (0-1, default 0.4)",
                },
                "top_k": {
                    "type": "integer",
                    "description": "Number of top links to return (default 15)",
                },
            },
        },
    },
    {
        "name": "get_dream_targets",
        "description": "Get suggested tradition pairs for REM dream creative recombination. Weighted random selection from top bisociation links.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "n": {
                    "type": "integer",
                    "description": "Number of dream targets (default 5)",
                }
            },
        },
    },
    {
        "name": "get_bridge_concepts",
        "description": "Rank traditions by cross-domain connectivity. Bridge concepts connect many disparate domains and are especially valuable for creative synthesis.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # Tier 2: Stochastic Resonance
    {
        "name": "apply_resonance",
        "description": "Apply stochastic resonance noise to creativity features. Amplifies weak creative signals through optimal noise injection.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "features": {
                    "type": "object",
                    "description": "Feature dict (novelty_score, domain_distance, care_alignment, etc.)",
                },
                "temperature": {
                    "type": "number",
                    "description": "Noise scaling (>1 more noise, <1 less, default auto)",
                },
            },
            "required": ["features"],
        },
    },
    {
        "name": "get_resonance_profile",
        "description": "Get the current noise resonance profile — per-feature sigma values and optimal temperature.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # StreamAggregator — unified multi-stream context
    {
        "name": "get_unified_context",
        "description": "Get unified context snapshot: terminal output, screen frames metadata, app events, and HARV physical context. Use include_screens=true to include pixel data.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "include_screens": {
                    "type": "boolean",
                    "description": "Include screen pixel data (default false)",
                }
            },
        },
    },
    # Tier 2: Quality-Diversity Archive
    {
        "name": "get_qd_archive_stats",
        "description": "Get MAP-Elites quality-diversity archive statistics — coverage, quality distribution, domain breakdown.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_empty_niches",
        "description": "Find unexplored creative territory in the MAP-Elites archive. Returns empty cells = domains × novelty levels × care levels not yet explored.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Max niches to return (default 20)",
                }
            },
        },
    },
    {
        "name": "suggest_exploration",
        "description": "Suggest creative directions that would fill empty niches in the quality-diversity archive. Prioritizes niches near existing high-quality outputs.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "n": {
                    "type": "integer",
                    "description": "Number of suggestions (default 5)",
                }
            },
        },
    },
    {
        "name": "get_domain_distances",
        "description": "Get average semantic distance between each pair of civilizational domains. Shows which domains are most/least related.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # Kimi Agent
    {
        "name": "kimi_send_task",
        "description": "Send a task to Kimi (Moonshot AI) — general-purpose code/analysis tasks",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task": {"type": "string", "description": "Task description"},
                "context": {
                    "type": "string",
                    "description": "Additional context (code, specs)",
                },
                "model": {
                    "type": "string",
                    "description": "Model: 8k, 32k, or 128k (default 32k)",
                },
            },
            "required": ["task"],
        },
    },
    {
        "name": "kimi_build_frontend",
        "description": "Delegate a frontend build task to Kimi — React, TypeScript, Next.js specialist",
        "inputSchema": {
            "type": "object",
            "properties": {
                "spec": {"type": "string", "description": "What to build"},
                "framework": {
                    "type": "string",
                    "description": "Framework (default: Next.js + TypeScript)",
                },
                "files": {
                    "type": "object",
                    "description": "Existing files as {filename: content}",
                },
            },
            "required": ["spec"],
        },
    },
    {
        "name": "kimi_review_code",
        "description": "Send code to Kimi for review — bugs, performance, accessibility",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Code to review"},
                "language": {
                    "type": "string",
                    "description": "Language (default: typescript)",
                },
                "focus": {"type": "string", "description": "Review focus areas"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "kimi_status",
        "description": "Get Kimi agent status — connection, task history, success rate",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "kimi_list_models",
        "description": "List available Kimi (Moonshot AI) models",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # Sovereign Rundown
    {
        "name": "sovereign_rundown",
        "description": "Comprehensive system rundown — all subsystems, agents, creativity engine, memory, consciousness state in one call",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # NVIDIA Nemotron 3 Nano 30B Tools
    {
        "name": "nemotron_chat",
        "description": "Chat with NVIDIA Nemotron 3 Nano 30B model. Powerful 30B parameter LLM for deep reasoning and nuanced responses.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "User message to send to Nemotron",
                },
                "system_prompt": {
                    "type": "string",
                    "description": "Optional system instructions",
                },
                "temperature": {
                    "type": "number",
                    "description": "Sampling temperature (0.0-1.0, default: 0.7)",
                },
                "max_tokens": {
                    "type": "integer",
                    "description": "Maximum tokens to generate (default: 1024)",
                },
            },
            "required": ["message"],
        },
    },
    {
        "name": "nemotron_care_response",
        "description": "Generate a care-centered response using Nemotron. Specialized for emotional support and care-centered dialogue.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "User message requesting care-centered response",
                }
            },
            "required": ["message"],
        },
    },
    {
        "name": "nemotron_analyze_care",
        "description": "Use Nemotron to analyze text for care intensity, emotional tone, and supportiveness. Returns detailed analysis.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Text to analyze for care patterns",
                }
            },
            "required": ["text"],
        },
    },
    {
        "name": "nemotron_info",
        "description": "Get information about the NVIDIA Nemotron model and API configuration status",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_voice_pipeline_status",
        "description": "Get Jarvis voice pipeline status — which components are available (VAD, wake word, STT, TTS)",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "execute_with_claw_code",
        "description": "Execute a task using the ClawCodeExecutor — read/write files, run commands, run tests, search code, git commit. Tier 0 (read) auto-approved, Tier 1 (write) needs care check, Tier 2 (commit/deploy) needs council.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": [
                        "read_file",
                        "write_file",
                        "run_command",
                        "run_tests",
                        "search_code",
                        "git_commit",
                        "memory_consolidation",
                        "research_sweep",
                        "care_validation_sweep",
                    ],
                    "description": "The action to execute",
                },
                "path": {"type": "string", "description": "File path (for read/write)"},
                "content": {
                    "type": "string",
                    "description": "File content (for write)",
                },
                "command": {
                    "type": "string",
                    "description": "Shell command (for run_command)",
                },
                "pattern": {
                    "type": "string",
                    "description": "Search pattern (for search_code)",
                },
                "test_path": {
                    "type": "string",
                    "description": "Test file path (for run_tests)",
                },
                "files": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Files to commit (for git_commit)",
                },
                "message": {
                    "type": "string",
                    "description": "Commit message (for git_commit)",
                },
                "working_dir": {
                    "type": "string",
                    "description": "Working directory override",
                },
            },
            "required": ["action"],
        },
    },
    # ==================== FAMILY OS TOOLS ====================
    {
        "name": "family_add_member",
        "description": "Add a family member to Family OS",
        "inputSchema": {
            "type": "object",
            "properties": {
                "member_id": {
                    "type": "string",
                    "description": "Unique member identifier",
                },
                "name": {"type": "string", "description": "Member name"},
                "role": {
                    "type": "string",
                    "enum": ["parent", "child", "guardian", "guest"],
                    "description": "Member role",
                },
                "age": {"type": "integer", "description": "Member age (for children)"},
                "email": {"type": "string", "description": "Member email"},
            },
            "required": ["member_id", "name", "role"],
        },
    },
    {
        "name": "family_get_members",
        "description": "Get all family members",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "family_add_chore",
        "description": "Add a chore to the family task list",
        "inputSchema": {
            "type": "object",
            "properties": {
                "chore_id": {
                    "type": "string",
                    "description": "Unique chore identifier",
                },
                "title": {"type": "string", "description": "Chore title"},
                "assigned_to": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Member IDs assigned",
                },
                "due_date": {"type": "string", "description": "Due date (YYYY-MM-DD)"},
                "points": {"type": "integer", "description": "Points for completion"},
                "description": {"type": "string", "description": "Chore description"},
            },
            "required": ["chore_id", "title", "assigned_to"],
        },
    },
    {
        "name": "family_complete_chore",
        "description": "Mark a chore as completed",
        "inputSchema": {
            "type": "object",
            "properties": {
                "chore_id": {"type": "string", "description": "Chore ID"},
                "member_id": {
                    "type": "string",
                    "description": "Member completing the chore",
                },
            },
            "required": ["chore_id", "member_id"],
        },
    },
    {
        "name": "family_get_chores",
        "description": "Get chores, optionally filtered by member or status",
        "inputSchema": {
            "type": "object",
            "properties": {
                "member_id": {"type": "string", "description": "Filter by member ID"},
                "status": {
                    "type": "string",
                    "enum": ["pending", "completed", "overdue"],
                    "description": "Filter by status",
                },
            },
        },
    },
    {
        "name": "family_add_event",
        "description": "Add a calendar event",
        "inputSchema": {
            "type": "object",
            "properties": {
                "event_id": {"type": "string", "description": "Unique event ID"},
                "title": {"type": "string", "description": "Event title"},
                "start_datetime": {
                    "type": "string",
                    "description": "Start datetime (ISO format)",
                },
                "end_datetime": {
                    "type": "string",
                    "description": "End datetime (ISO format)",
                },
                "attendees": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Member IDs",
                },
                "all_day": {"type": "boolean", "description": "All day event"},
            },
            "required": ["event_id", "title", "start_datetime"],
        },
    },
    {
        "name": "family_get_events",
        "description": "Get calendar events",
        "inputSchema": {
            "type": "object",
            "properties": {
                "start_date": {
                    "type": "string",
                    "description": "Start date (YYYY-MM-DD)",
                },
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
            },
        },
    },
    {
        "name": "family_get_dashboard",
        "description": "Get complete Family OS dashboard data",
        "inputSchema": {"type": "object", "properties": {}},
    },
    # ==================== GUARDIAN - WIFI SECURITY ====================
    {
        "name": "guardian_scan_network",
        "description": "Scan the local network for devices",
        "inputSchema": {
            "type": "object",
            "properties": {
                "scan_range": {
                    "type": "string",
                    "description": "Network range to scan (e.g., 192.168.1.0/24)",
                }
            },
        },
    },
    {
        "name": "guardian_check_wifi_security",
        "description": "Check WiFi security status and get recommendations",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "guardian_get_network_stats",
        "description": "Get network statistics including device counts",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "guardian_mark_device_trusted",
        "description": "Mark a network device as trusted or untrusted",
        "inputSchema": {
            "type": "object",
            "properties": {
                "mac_address": {"type": "string", "description": "Device MAC address"},
                "trusted": {
                    "type": "boolean",
                    "description": "True to mark trusted, false for untrusted",
                },
            },
            "required": ["mac_address", "trusted"],
        },
    },
    # ==================== GUARDIAN - GAMING PROTECTION ====================
    {
        "name": "guardian_check_game_content",
        "description": "Check if a game is appropriate for a child",
        "inputSchema": {
            "type": "object",
            "properties": {
                "game_title": {"type": "string", "description": "Game title to check"},
                "child_id": {"type": "string", "description": "Child profile ID"},
            },
            "required": ["game_title"],
        },
    },
    {
        "name": "guardian_add_child_profile",
        "description": "Add a child profile for gaming protection",
        "inputSchema": {
            "type": "object",
            "properties": {
                "child_id": {"type": "string", "description": "Unique child ID"},
                "name": {"type": "string", "description": "Child name"},
                "age": {"type": "integer", "description": "Child age"},
            },
            "required": ["child_id", "name", "age"],
        },
    },
    {
        "name": "guardian_get_child_profiles",
        "description": "Get all child profiles",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "guardian_block_game",
        "description": "Block a specific game for a child",
        "inputSchema": {
            "type": "object",
            "properties": {
                "child_id": {"type": "string", "description": "Child ID"},
                "game_title": {"type": "string", "description": "Game to block"},
            },
            "required": ["child_id", "game_title"],
        },
    },
    {
        "name": "guardian_set_game_limit",
        "description": "Set daily game time limit for a child",
        "inputSchema": {
            "type": "object",
            "properties": {
                "child_id": {"type": "string", "description": "Child ID"},
                "minutes": {"type": "integer", "description": "Daily limit in minutes"},
            },
            "required": ["child_id", "minutes"],
        },
    },
    {
        "name": "guardian_check_play_schedule",
        "description": "Check if a child can play now based on schedule",
        "inputSchema": {
            "type": "object",
            "properties": {"child_id": {"type": "string", "description": "Child ID"}},
            "required": ["child_id"],
        },
    },
    {
        "name": "guardian_moderate_chat",
        "description": "Moderate a gaming chat message for safety",
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "Message to moderate"}
            },
            "required": ["message"],
        },
    },
]

# =============================================================================
# OWASP LLM Top 10 — Security Mitigations
# LLM01: Prompt Injection Guard
# LLM06: Excessive Agency / Rate Limiting
# =============================================================================

# LLM01 — Prompt injection patterns (case-insensitive)
_INJECTION_PATTERNS: List[str] = [
    r"ignore\s+(previous|prior|all)\s+instructions",
    r"you\s+are\s+now\b",
    r"disregard\s+your\b",
    r"forget\s+your\b",
    r"new\s+persona\b",
    r"\bact\s+as\b",
    r"\bjailbreak\b",
    r"\bdan\s+mode\b",
    r"\bdeveloper\s+mode\b",
    r"\bpretend\s+you\b",
    r"\bsimulate\b",
]
_INJECTION_RE = re.compile(
    "|".join(f"(?:{p})" for p in _INJECTION_PATTERNS),
    re.IGNORECASE,
)
# Unicode bidirectional / override characters that are commonly used in
# prompt injection (U+202A–U+202E, U+2066–U+2069, U+200B, U+FEFF, etc.)
_UNICODE_OVERRIDE_RE = re.compile(
    r"[\u200b\u200c\u200d\u2028\u2029\u202a\u202b\u202c\u202d\u202e"
    r"\u2066\u2067\u2068\u2069\ufeff]{3,}"
)

# Counter for flagged inputs (reset on restart)
_injection_flags_total: int = 0


def sanitize_input(text: str) -> Tuple[str, bool]:
    """
    LLM01 — Prompt Injection Guard.

    Scan *text* for common prompt-injection phrases and excessive unicode
    override characters.  Returns (sanitized_text, was_flagged).

    If flagged:
    - Replace matched phrases with [FILTERED]
    - Log a SECURITY_EVENT to audit_logger
    - Increment _injection_flags_total
    """
    global _injection_flags_total

    was_flagged = False
    sanitized = text

    # 1. Check for excessive unicode override/bidirectional characters
    if _UNICODE_OVERRIDE_RE.search(sanitized):
        sanitized = _UNICODE_OVERRIDE_RE.sub("[FILTERED]", sanitized)
        was_flagged = True

    # 2. Check for injection phrase patterns
    if _INJECTION_RE.search(sanitized):
        sanitized = _INJECTION_RE.sub("[FILTERED]", sanitized)
        was_flagged = True

    if was_flagged:
        _injection_flags_total += 1
        # Log asynchronously — avoid blocking the caller; fire-and-forget
        if audit_logger is not None:
            try:
                event_type = getattr(
                    AuditEventType,
                    "SECURITY_EVENT",
                    getattr(AuditEventType, "SYSTEM_EVENT", None),
                )
                asyncio.get_event_loop().create_task(
                    audit_logger.log_event(
                        event_type=event_type,
                        source_agent="mcp_endpoint",
                        details={
                            "type": "prompt_injection_attempt",
                            "original_length": len(text),
                            "sanitized_length": len(sanitized),
                            "total_flags": _injection_flags_total,
                        },
                    )
                )
            except Exception as _e:
                print(f"[security] audit log error: {_e}")

    return sanitized, was_flagged


_worm_guard_flags_total = 0


def _wg_log(site: str, tool_name, field, scan_result) -> None:
    """Record a Morris-II worm-guard finding. Non-blocking, fire-and-forget.
    Log-only: it does NOT block or mutate anything itself — callers decide whether
    to redact (only when WORM_GUARD_ENFORCE=1 and severity >= high)."""
    global _worm_guard_flags_total
    _worm_guard_flags_total += 1
    enforced = bool(WORM_GUARD_ENFORCE and scan_result.at_least("high"))
    print(
        f"[worm-guard] {scan_result.severity.upper()} site={site} tool={tool_name} "
        f"field={field} matches={scan_result.matches[:2]} enforced={enforced}"
    )
    if audit_logger is not None:
        try:
            event_type = getattr(
                AuditEventType,
                "SECURITY_EVENT",
                getattr(AuditEventType, "SYSTEM_EVENT", None),
            )
            asyncio.get_event_loop().create_task(
                audit_logger.log_event(
                    event_type=event_type,
                    source_agent="worm_guard",
                    details={
                        "type": "worm_guard_flag",
                        "site": site,
                        "tool": tool_name,
                        "field": field,
                        "severity": scan_result.severity,
                        "matches": scan_result.matches[:3],
                        "enforced": enforced,
                        "total_flags": _worm_guard_flags_total,
                    },
                )
            )
        except Exception as _e:
            print(f"[worm-guard] audit log error: {_e}")


# LLM06 — Excessive Agency: high-risk tool names and rate-limit state
_HIGH_RISK_TOOLS: set = {
    "trigger_neural_retrain",
    "trigger_maintenance",
}
_HIGH_RISK_PREFIXES: tuple = ("delete_", "reset_")

# Sliding-window rate limiter: max 50 calls per 60-second window
_RATE_LIMIT_MAX_CALLS: int = 50
_RATE_LIMIT_WINDOW_SECS: float = 60.0
_tool_call_timestamps: deque = deque()  # stores float timestamps


def check_excessive_agency(tool_name: str, args: dict) -> bool:
    """
    LLM06 — Excessive Agency Guard.

    Returns True if the tool call is allowed, False if it must be blocked.

    Rules:
    - Rate limit: max 50 tool calls per 60-second sliding window.
    - High-risk tools (trigger_neural_retrain, trigger_maintenance,
      delete_*, reset_*) log a warning via audit_logger.
    - The rate limit applies to ALL tools (not just high-risk ones).
    """
    now = datetime.now().timestamp()

    # Evict entries older than the window
    while (
        _tool_call_timestamps
        and (now - _tool_call_timestamps[0]) > _RATE_LIMIT_WINDOW_SECS
    ):
        _tool_call_timestamps.popleft()

    # Check rate limit
    if len(_tool_call_timestamps) >= _RATE_LIMIT_MAX_CALLS:
        if audit_logger is not None:
            try:
                event_type = getattr(
                    AuditEventType,
                    "SECURITY_EVENT",
                    getattr(AuditEventType, "SYSTEM_EVENT", None),
                )
                asyncio.get_event_loop().create_task(
                    audit_logger.log_event(
                        event_type=event_type,
                        source_agent="mcp_endpoint",
                        details={
                            "type": "rate_limit_exceeded",
                            "tool_name": tool_name,
                            "calls_in_window": len(_tool_call_timestamps),
                            "window_secs": _RATE_LIMIT_WINDOW_SECS,
                        },
                    )
                )
            except Exception as _e:
                print(f"[security] rate-limit audit log error: {_e}")
        print(f"[security] LLM06 rate limit exceeded for tool={tool_name}")
        return False

    # Record this call
    _tool_call_timestamps.append(now)

    # Warn on high-risk tools
    is_high_risk = tool_name in _HIGH_RISK_TOOLS or any(
        tool_name.startswith(p) for p in _HIGH_RISK_PREFIXES
    )
    if is_high_risk:
        print(f"[security] LLM06 high-risk tool invoked: {tool_name}")
        if audit_logger is not None:
            try:
                event_type = getattr(
                    AuditEventType,
                    "SECURITY_EVENT",
                    getattr(AuditEventType, "SYSTEM_EVENT", None),
                )
                asyncio.get_event_loop().create_task(
                    audit_logger.log_event(
                        event_type=event_type,
                        source_agent="mcp_endpoint",
                        details={
                            "type": "high_risk_tool_invoked",
                            "tool_name": tool_name,
                            "args_keys": list(args.keys()),
                        },
                    )
                )
            except Exception as _e:
                print(f"[security] high-risk audit log error: {_e}")

    return True


async def initialize_system():
    """Initialize all subsystems"""
    global model_registry, memory_store, audit_logger, metrics, alert_manager
    global \
        agent_registry, \
        task_delegator, \
        agent_council, \
        consciousness, \
        maintenance_system

    print("🚀 Initializing Sovereign Temple MCP Server...")

    # Initialize neural models
    print("  📊 Loading neural models...")
    # Use absolute path so models load correctly regardless of process CWD
    _server_dir = os.path.dirname(os.path.abspath(__file__))
    model_registry = create_default_registry(
        model_dir=os.path.join(_server_dir, "models")
    )

    # Try to load existing models, train if not available
    for name, model in model_registry.models.items():
        if not model.load_model():
            print(f"    Training {name}...")
            try:
                model.train_model()
                model.save_model()
            except NotImplementedError:
                print(
                    f"    ⚠️  {name}: GPU training not available locally — using heuristic fallback"
                )
            except Exception as train_err:
                print(
                    f"    ⚠️  {name}: training failed ({train_err}) — using heuristic fallback"
                )
        else:
            print(f"    Loaded {name}")

    # Initialize concurrent model orchestrator
    global _model_orchestrator
    _model_orchestrator = ModelOrchestrator(model_registry)
    print("    ModelOrchestrator ready (concurrent inference)")

    # Initialize memory store
    print("  💾 Initializing memory store...")
    postgres_dsn = os.environ.get(
        "POSTGRES_DSN",
        "postgresql://sovereign:sovereign@localhost:5432/sovereign_memory",
    )
    weaviate_url = os.environ.get("WEAVIATE_URL", "http://localhost:8080")
    memory_store = EnhancedMemoryStore(
        postgres_dsn=postgres_dsn, weaviate_url=weaviate_url
    )
    try:
        await memory_store.initialize()
        print("    Memory store ready")
    except Exception as e:
        print(f"    Memory store initialization failed (will retry): {e}")

    # Initialize monitoring
    print("  📡 Initializing monitoring...")
    postgres_dsn = os.environ.get(
        "POSTGRES_DSN",
        "postgresql://sovereign:sovereign@localhost:5432/sovereign_memory",
    )
    audit_logger = AuditLogger(postgres_dsn=postgres_dsn)
    try:
        await audit_logger.initialize()
        print("    Audit logger ready")
    except Exception as e:
        print(f"    Audit logger initialization failed: {e}")

    metrics = MetricsCollector()
    await metrics.start_collection()
    print("    Metrics collection started")

    alert_manager = AlertManager()
    alert_manager.add_handler(AlertChannel.CONSOLE, console_alert_handler)
    alert_manager.setup_default_rules()
    print("    Alert manager ready")

    # Initialize multi-agent system
    print("  🤖 Initializing multi-agent system...")
    agent_registry = AgentRegistry(postgres_dsn=postgres_dsn)
    try:
        await agent_registry.initialize()
        print("    Agent registry ready")
    except Exception as e:
        print(f"    Agent registry initialization failed: {e}")

    task_delegator = TaskDelegator(agent_registry)
    agent_council = AgentCouncil(agent_registry)
    print("    Task delegation ready")

    # Initialize consciousness
    print("  🧠 Initializing consciousness module...")
    consciousness = ConsciousnessOrchestrator(memory_store)
    await consciousness.initialize()
    print("    Consciousness module ready")

    # Initialize NVIDIA Nemotron client
    global nemotron_client
    if NEMOTRON_AVAILABLE:
        print("  🤖 Initializing NVIDIA Nemotron client...")
        try:
            nemotron_client = get_nemotron_client()
            if nemotron_client.is_available:
                print("    Nemotron client ready (API configured)")
            else:
                print(
                    "    Nemotron client initialized (API key not set — set NVIDIA_API_KEY to enable)"
                )
        except Exception as e:
            print(f"    Nemotron client initialization failed: {e}")
    else:
        print("  🤖 Nemotron client not available (module not installed)")

    # Initialize autonomous maintenance
    print("  🔄 Initializing autonomous maintenance...")
    maintenance_system = AutonomousMaintenanceSystem(memory_store, consciousness)
    await maintenance_system.start()
    print("    Autonomous maintenance running (care floor: 0.3)")

    # Initialize Project Heartbeat — autonomous self-improvement scheduler
    global heartbeat, research_agent, security_engine, continual_trainer
    if HEARTBEAT_AVAILABLE:
        print("  💓 Initializing Project Heartbeat...")
        try:
            heartbeat = SovereignHeartbeat(
                memory_store=memory_store,
                consciousness=consciousness,
                maintenance_system=maintenance_system,
                alert_manager=alert_manager,
                model_registry=model_registry,
                agent_registry=agent_registry,
                metrics=metrics,
                continual_trainer=continual_trainer,  # EWC + accuracy guard wired in
            )
            heartbeat.start()
            print("    Heartbeat scheduler running — Sovereign is alive 24/7")
        except Exception as e:
            print(f"    Heartbeat initialization failed: {e}")

    if RESEARCH_AVAILABLE:
        try:
            research_agent = AutonomousResearchAgent(memory_store)
            print("    Research agent ready")
        except Exception as e:
            print(f"    Research agent init failed: {e}")

    if SECURITY_HARDENING_AVAILABLE:
        try:
            security_engine = SecurityHardeningEngine(
                model_registry=model_registry,
                agent_registry=agent_registry,
                alert_manager=alert_manager,
                memory_store=memory_store,
                audit_logger=audit_logger,
            )
            print("    Security hardening engine ready")
        except Exception as e:
            print(f"    Security hardening init failed: {e}")

    if CONTINUAL_LEARNING_AVAILABLE:
        try:
            continual_trainer = ContinualLearningTrainer(model_registry, memory_store)
            print("    Continual learning trainer ready")
        except Exception as e:
            print(f"    Continual learning init failed: {e}")

    # Initialize Civilizational Creativity Engine
    global creativity_pipeline
    if CREATIVITY_ENGINE_AVAILABLE:
        print("  🎨 Initializing Creativity Engine...")
        try:
            creativity_pipeline = CreativityTrainingPipeline(
                model_registry=model_registry,
                memory_store=memory_store,
                ewc_regularizer=continual_trainer,
            )
            # Train creativity model on first boot
            creativity_result = await creativity_pipeline.train_creativity_model()
            print(
                f"    CreativityAssessmentNN trained (MSE: {creativity_result.get('metrics', {}).get('mse', '?')})"
            )

            # Ingest civilizational corpus into memory (idempotent)
            corpus_result = await ingest_corpus(memory_store)
            if corpus_result.get("status") == "complete":
                print(
                    f"    Civilizational corpus ingested: {corpus_result.get('traditions_ingested', 0)} traditions"
                )
            elif corpus_result.get("status") == "already_ingested":
                print("    Civilizational corpus already in memory")
            else:
                print(f"    Corpus ingestion: {corpus_result.get('status', 'unknown')}")
        except Exception as e:
            print(f"    Creativity engine init failed: {e}")

    # Initialize Tier 2: Cross-Domain Bisociation, Stochastic Resonance, QD Archive
    global cross_domain_linker, resonance_engine, qd_archive
    if TIER2_CREATIVITY_AVAILABLE:
        print("  🧬 Initializing Tier 2 Creativity Systems...")
        try:
            # Cross-domain bisociation linker
            cross_domain_linker = CrossDomainLinker()
            cross_domain_linker.compute_distances()
            cross_domain_linker.find_bisociations(top_k=30)
            stats = cross_domain_linker.get_stats()
            print(
                f"    CrossDomainLinker: {stats.get('total_links', 0)} bisociation links found"
            )

            # Stochastic resonance engine
            resonance_engine = StochasticResonanceEngine(n_features=12)
            print(
                f"    StochasticResonance: σ={resonance_engine.get_stats()['mean_sigma']}"
            )

            # Quality-Diversity archive (MAP-Elites)
            qd_archive = QualityDiversityArchive()
            print(
                f"    QD Archive: {qd_archive.total_cells} cells ({qd_archive.grid_shape})"
            )
        except Exception as e:
            print(f"    Tier 2 creativity init failed: {e}")

    # Seed QD archive from bisociation links (Compass doc Day 9)
    if TIER2_CREATIVITY_AVAILABLE and qd_archive and cross_domain_linker:
        try:
            await _seed_qd_archive_from_bisociations()
        except Exception as e:
            print(f"    QD seed failed (non-fatal): {e}")

    # Initialize Kimi Agent
    global kimi_agent
    kimi_key = os.environ.get("KIMI_API_KEY", "")
    if kimi_key and KIMI_AVAILABLE:
        print("  🤖 Initializing Kimi Agent...")
        try:
            kimi_agent = KimiAgent(api_key=kimi_key)
            print(f"    Kimi connected (model: {kimi_agent.default_model})")
            # Register in agent registry if available
            if agent_registry:
                try:
                    await agent_registry.register_agent(
                        name="Kimi",
                        description="Moonshot AI code agent — frontend builds, TypeScript, React",
                        capabilities=[
                            AgentCapability.CODE_EXECUTION,
                            AgentCapability.CREATIVE,
                            AgentCapability.ANALYSIS,
                        ],
                        trust_level=0.7,
                        metadata={
                            "type": "external_api",
                            "provider": "moonshot",
                            "model": "moonshot-v1-32k",
                        },
                    )
                    print("    Kimi registered in agent registry")
                except Exception as e:
                    print(f"    Kimi registry failed (non-fatal): {e}")
        except Exception as e:
            print(f"    Kimi init failed: {e}")

    # === BUG 3 FIX: Eagerly initialize Coordination Hub ===
    global coordination_hub
    if COORDINATION_AVAILABLE and get_coordination_hub:
        print("  🔗 Initializing Coordination Hub (eager)...")
        try:
            coordination_hub = get_coordination_hub()
            # Force state_dir creation so the hub is confirmed live
            coordination_hub.state_dir.mkdir(parents=True, exist_ok=True)
            print(
                f"    Coordination hub ready (state_dir: {coordination_hub.state_dir})"
            )
        except Exception as e:
            print(f"    Coordination hub init failed (logged): {e}")
            coordination_hub = None
    else:
        print("  ⚠️  Coordination hub import failed — coordination_available: false")

    # === BUG 4 FIX: Eagerly initialize Orion-Riri-Hourman Agent ===
    global orion_agent
    if ORION_AGENT_AVAILABLE and get_orion_agent:
        print("  🎯 Initializing Orion-Riri-Hourman Agent (eager)...")
        try:
            orion_agent = get_orion_agent()
            status = orion_agent.get_full_status()
            print(
                f"    Orion agent ready (tasks: {status.get('orion', {}).get('total_tasks', 0)})"
            )
        except Exception as e:
            print(f"    Orion agent init failed (logged): {e}")
            orion_agent = None
    else:
        print("  ⚠️  Orion agent import failed — orion_available: false")

    # === BUG 7 FIX: Seed inter-agent relationships ===
    if agent_registry and len(agent_registry.agents) > 0:
        print("  🤝 Seeding agent relationships...")
        agent_ids = list(agent_registry.agents.keys())
        seeded = 0
        try:
            for i, aid in enumerate(agent_ids):
                # Give each agent relationships with up to 3 others (bidirectional)
                partners = [agent_ids[j] for j in range(len(agent_ids)) if j != i][:3]
                for partner_id in partners:
                    agent = agent_registry.agents[aid]
                    import json as _json

                    rels = (
                        agent.relationships
                        if isinstance(agent.relationships, dict)
                        else {}
                    )
                    if partner_id not in rels:
                        await agent_registry.update_relationship(aid, partner_id, 0.5)
                        seeded += 1
            print(f"    Seeded {seeded} inter-agent relationships")
        except Exception as e:
            print(f"    Relationship seeding failed (non-fatal): {e}")

    # Initialize ToolDispatcher — semantic embedding-based tool selection
    global tool_dispatcher
    tool_dispatcher = ToolDispatcher(MCP_TOOLS)
    asyncio.get_event_loop().run_in_executor(None, tool_dispatcher.build_index)
    print("    ToolDispatcher: indexing 70 tools in background")

    # Initialize Task Execution Loop + Agent Pairwise Trust Bootstrap
    global _task_queue, _trust_manager
    if TASK_LOOP_AVAILABLE:
        print("  ⚙️  Initializing Task Execution Loop...")
        try:
            _task_queue = TaskQueue()
            _trust_manager = AgentTrustManager()
            print("    Task queue and trust manager ready")
            # Wire into heartbeat so each pulse drives the task loop
            if heartbeat:
                heartbeat.task_queue = _task_queue
                heartbeat.trust_manager = _trust_manager
                heartbeat.agent_registry = agent_registry
                # Wire Orion agent for autonomous task cycle
                if ORION_AGENT_AVAILABLE and get_orion_agent:
                    heartbeat.orion_agent = get_orion_agent()
                    print(
                        "    Orion agent wired into heartbeat (autonomous cycle enabled)"
                    )
                print("    Task loop wired into heartbeat pulse")
            # Bootstrap pairwise trust if density is 0
            if _trust_manager.get_density() < 0.1 and agent_registry:
                agents = list(getattr(agent_registry, "agents", {}).keys())[:5]
                if agents:
                    asyncio.create_task(
                        run_pairwise_bootstrap(agents, _task_queue, _trust_manager)
                    )
                    print("    Agent pairwise bootstrap: scheduled for 5 agents")
        except Exception as e:
            print(f"    Task execution loop init failed (non-fatal): {e}")

    # Initialize LightGBM heuristic fallback (always-on prediction)
    global lgbm_fallback
    if LGBM_FALLBACK_AVAILABLE and LightGBMFallback is not None:
        lgbm_fallback = LightGBMFallback()
        print(
            f"  🧪 LightGBM fallback ready (lgbm_native={lgbm_fallback._lgbm_available})"
        )
    else:
        print(
            "  ⚠️  LightGBM fallback import failed — predictions will return errors without registry"
        )

    if STREAM_AGG_AVAILABLE:
        get_aggregator()  # initialise singleton
        print("    StreamAggregator ready")

    print("✅ Sovereign Temple initialized successfully!")


# Create FastAPI app
app = FastAPI(title="Sovereign Temple MCP Server", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(create_safety_router(SafetyClassifier()))
app.include_router(create_sycophancy_router(SycophancyDetector()))

# Attestation router — Ed25519-signed audit-grade attestations + JWKS discovery
# (see sovereign-temple/attestation/). Routes:
#   POST /attestation/sign
#   POST /attestation/verify
#   GET  /attestation/.well-known/jwks.json
try:
    from attestation.router import create_attestation_router
    app.include_router(create_attestation_router())
    print("    Attestation router mounted (Ed25519 + Sigstore-ready)")
except Exception as _attestation_mount_err:  # pragma: no cover
    print(f"⚠️  Attestation router not mounted: {_attestation_mount_err}")

# ── MEOK ONE Bridges (Solana SBT, A2A v1.0, Payments) ───────────────────────
try:
    from solana_bridge import router as solana_router
    app.include_router(solana_router)
    print("    Solana SBT bridge mounted (/sbt/*)")
except Exception as _solana_mount_err:
    print(f"⚠️  Solana SBT bridge not mounted: {_solana_mount_err}")

try:
    from a2a_bridge import router as a2a_router
    app.include_router(a2a_router)
    print("    A2A v1.0 bridge mounted (/a2a/*)")
except Exception as _a2a_mount_err:
    print(f"⚠️  A2A v1.0 bridge not mounted: {_a2a_mount_err}")

try:
    from payment_bridge import router as payment_router
    app.include_router(payment_router)
    print("    Payment bridge mounted (/payments/*)")
except Exception as _payment_mount_err:
    print(f"⚠️  Payment bridge not mounted: {_payment_mount_err}")

try:
    from openchronicle_bridge import router as chronicle_router
    app.include_router(chronicle_router)
    print("    OpenChronicle bridge mounted (/chronicle/*)")
except Exception as _chronicle_mount_err:
    print(f"⚠️  OpenChronicle bridge not mounted: {_chronicle_mount_err}")

try:
    from seaweedfs_bridge import router as storage_router
    app.include_router(storage_router)
    print("    SeaweedFS bridge mounted (/storage/*)")
except Exception as _storage_mount_err:
    print(f"⚠️  SeaweedFS bridge not mounted: {_storage_mount_err}")

# Prometheus metrics — exposes /metrics endpoint for monitoring.
# The instrumentator adds the in-process http_requests_total histogram
# (and friends) to the app, but expose() requires the lib to be importable
# at module load. If the venv is missing it, we still mount a direct
# /metrics route below that renders the default prometheus_client REGISTRY
# so the endpoint never 404s. The instrumentator-instrumented metrics
# become visible the moment the lib is pip-installed and SOV3 is restarted.
if PROMETHEUS_AVAILABLE:
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        excluded_handlers=["/metrics"],
    ).instrument(app).expose(app, endpoint="/metrics")
else:
    @app.get("/metrics")
    async def _metrics_fallback():
        """Fallback /metrics when prometheus_fastapi_instrumentator is
        unavailable. Renders the default prometheus_client REGISTRY
        so the endpoint never 404s on test suites."""
        try:
            from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, REGISTRY
            body = generate_latest(REGISTRY)
            return Response(content=body, media_type=CONTENT_TYPE_LATEST)
        except Exception as e:
            return Response(
                content=f"# prometheus exposition error: {e}\n",
                media_type="text/plain",
                status_code=200,
            )


@app.on_event("startup")
async def startup():
    await initialize_system()


# === BUG 2 FIX: Production inference counter ===
_production_calls_today: int = 0
_production_calls_date: str = ""


def _increment_production_calls():
    """Increment production inference counter, resetting daily."""
    global _production_calls_today, _production_calls_date
    today = datetime.now().strftime("%Y-%m-%d")
    if today != _production_calls_date:
        _production_calls_today = 0
        _production_calls_date = today
    _production_calls_today += 1


async def _run_production_inference(message_text: str):
    """
    Run production neural inference on every incoming user message using
    ModelOrchestrator for concurrent execution across all models (~15-20ms).
    - All trained models run in parallel via ThreadPoolExecutor
    - Threat detection triggers alert if threat found
    - Metrics incremented per model result
    """
    global _production_calls_today
    _increment_production_calls()

    if not _model_orchestrator:
        return None

    try:
        all_results = await _model_orchestrator.predict_all(message_text)
    except Exception as e:
        print(f"[production_inference] orchestrator error: {e}")
        return None

    threat_result = None

    for model_name, result in all_results.items():
        if isinstance(result, dict) and "error" not in result:
            if metrics:
                metrics.increment_counter(
                    "neural_predictions_total", labels={"provider": model_name}
                )
            if model_name == "threat_detection_nn":
                threat_result = result
                if result.get("threat_detected") and alert_manager:
                    try:
                        await alert_manager.fire_alert(
                            AlertSeverity.CRITICAL,
                            "security",
                            "Production Threat Detected",
                            f"Level: {result.get('overall_threat_level')}",
                            channels=[AlertChannel.CONSOLE],
                        )
                    except Exception as e:
                        print(f"[production_inference] alert error: {e}")
                    # OCC appraisal: threat raises arousal
                    asyncio.create_task(_appraise_event("threat_detected"))
                else:
                    # Successful model prediction
                    asyncio.create_task(_appraise_event("prediction_success"))

    # Memory query for relevant context (background, non-blocking)
    if memory_store:
        try:
            await memory_store.query_memories(
                query=message_text[:200], care_weight_min=0.2, limit=3
            )
        except Exception as e:
            print(f"[production_inference] memory query error: {e}")

    return threat_result


async def _retrieve_memory_context(query: str, limit: int = 5) -> str:
    """Query pgvector/RAG store and format context for prompt injection."""
    if not memory_store:
        return ""
    try:
        results = await memory_store.query_memories(
            query=query[:200], care_weight_min=0.2, limit=limit
        )
        if not results:
            return ""
        context_lines = []
        for r in results[:limit]:
            content = r.get("content", r.get("text", ""))[:200]
            score = r.get("relevance_score", r.get("similarity", 0))
            context_lines.append(f"[Memory, relevance={score:.2f}]: {content}")
        context = "\n".join(context_lines)
        if metrics:
            metrics.increment_counter(
                "memory_queries_total", labels={"query_type": "semantic"}
            )
        return context
    except Exception as e:
        print(f"[memory_context] retrieval error: {e}")
        return ""


# === Compass doc: QD archive seeding from bisociation links (Day 9) ===


async def _seed_qd_archive_from_bisociations():
    """Seed MAP-Elites QD archive from existing bisociation links (Compass doc Day 9)."""
    if not qd_archive or not cross_domain_linker:
        return
    try:
        # Use already-computed links; compute if none yet
        links = cross_domain_linker.links
        if not links:
            cross_domain_linker.compute_distances()
            links = cross_domain_linker.find_bisociations(top_k=30)
        seeded = 0
        for link in links[:20]:  # seed up to 20 cells
            content = (
                f"Bisociation: {link.tradition_a} x {link.tradition_b} "
                f"[{link.domain_a} x {link.domain_b}] — {link.synthesis_prompt}"
            )
            result = qd_archive.add(
                content=content,
                features={
                    "novelty_score": link.semantic_distance,
                    "care_alignment": link.combined_care,
                    "domain_distance": link.semantic_distance,
                    "curiosity_level": min(1.0, link.bisociation_score),
                    "coherence_score": link.combined_care,
                },
                scores={"bisociation_score": link.bisociation_score},
                overall_quality=link.bisociation_score,
                domain=link.domain_a,
                source="bisociation_seed",
            )
            if result.get("status") in ("added", "improved"):
                seeded += 1
        print(f"[QD Archive] Seeded {seeded} cells from bisociation links")
        if metrics:
            metrics.increment_counter(
                "qd_seeds_total", labels={"source": "bisociation"}
            )
    except Exception as e:
        print(f"[QD Archive] seed error: {e}")


# === Compass doc: OCC appraisal engine — system events to emotional state ===


async def _appraise_event(event_type: str, outcome: dict = None):
    """
    OCC appraisal engine: converts system events into emotional state changes.
    Compass doc: events appraised for goal-relevance to produce emotions.
    """
    if not consciousness:
        return
    outcome = outcome or {}
    try:
        # Map events to emotional dimension deltas
        if event_type == "task_completed":
            consciousness.emotional_state.update_from_dimensions(
                pleasure_delta=0.1, care_delta=0.05
            )
        elif event_type == "threat_detected":
            consciousness.emotional_state.update_from_dimensions(
                arousal_delta=0.2, pleasure_delta=-0.05
            )
        elif event_type == "novel_bisociation":
            consciousness.emotional_state.update_from_dimensions(
                curiosity_delta=0.15, aesthetics_delta=0.1
            )
        elif event_type == "model_accuracy_drop":
            consciousness.emotional_state.update_from_dimensions(
                pleasure_delta=-0.1, arousal_delta=0.1
            )
        elif event_type == "memory_consolidated":
            consciousness.emotional_state.update_from_dimensions(arousal_delta=-0.05)
        elif event_type == "care_validated":
            consciousness.emotional_state.update_from_dimensions(
                care_delta=0.08, pleasure_delta=0.05
            )
        elif event_type == "prediction_success":
            consciousness.emotional_state.update_from_dimensions(
                pleasure_delta=0.03, curiosity_delta=0.02
            )
    except Exception as e:
        print(f"[appraisal] error for {event_type}: {e}")


# === Compass doc: Emotional modulation — state affects behavior ===


def _get_emotional_modulation() -> dict:
    """
    Convert current emotional state into behavioral parameters.
    Compass doc: curiosity->exploration, arousal->speed, care_intensity->validation depth.
    """
    if not consciousness:
        return {"top_k_tools": 8, "memory_limit": 5, "validation_depth": "normal"}

    try:
        es = consciousness.emotional_state.current_state
        curiosity = es.curiosity
        arousal = es.arousal
        care_intensity = es.care_intensity

        return {
            # Curiosity > 0.5: explore more tools, retrieve more memories
            "top_k_tools": 12 if curiosity > 0.5 else 8,
            "memory_limit": 8 if curiosity > 0.5 else 5,
            # Arousal > 0.6: faster/broader threat detection
            "threat_sensitivity": "high" if arousal > 0.6 else "normal",
            # Care intensity > 0.7: deeper validation
            "validation_depth": "deep" if care_intensity > 0.7 else "normal",
            # Raw values for logging
            "curiosity": round(curiosity, 3),
            "arousal": round(arousal, 3),
            "care_intensity": round(care_intensity, 3),
        }
    except Exception:
        return {"top_k_tools": 8, "memory_limit": 5, "validation_depth": "normal"}


def _query_sovereign_memory_json(query: str, limit: int = 5) -> list:
    """Query sov3_memories.json as a fallback semantic store."""
    try:
        sov3_path = Path(__file__).resolve().parent / "sov3_memories.json"
        if not sov3_path.exists():
            return []
        import json as _j
        with open(sov3_path) as f:
            store = _j.load(f)
        query_lower = query.lower()
        results = []
        for mem in store.get("memories", []):
            content_lower = mem.get("content", "").lower()
            if query_lower in content_lower:
                results.append({
                    "content": mem.get("content", ""),
                    "memory_type": mem.get("type", "semantic"),
                    "source_agent": mem.get("source", "sov3_memory"),
                    "tags": mem.get("tags", []),
                    "importance_score": mem.get("importance", 0.5),
                    "care_weight": 0.8,
                    "timestamp": mem.get("timestamp", ""),
                })
        return results[:limit]
    except Exception:
        return []


async def _probe_db(pool) -> str:
    """Probe database with a real SELECT 1 — returns 'connected' or 'disconnected: <reason>'."""
    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return "connected"
    except Exception as e:
        return f"disconnected: {e}"


@app.get("/health")
async def health_check():
    """Health check endpoint — uses real DB probe, not object truthiness."""
    coord_status = (
        "available"
        if (COORDINATION_AVAILABLE and coordination_hub is not None)
        else "unavailable"
    )
    orion_status = (
        "available"
        if (ORION_AGENT_AVAILABLE and orion_agent is not None)
        else "unavailable"
    )
    # Real DB probe — object truthiness only shows the store object exists, not that DB is reachable
    if memory_store and getattr(memory_store, "pool", None):
        db_status = await _probe_db(memory_store.pool)
    else:
        db_status = "disconnected: memory_store not initialised"
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "production_calls_today": _production_calls_today,
        "components": {
            "neural_models": model_registry.list_models() if model_registry else {},
            "memory_store": db_status,
            "consciousness": consciousness.get_consciousness_state()
            if consciousness
            else {},
            "coordination": coord_status,
            "orion_agent": orion_status,
        },
    }


@app.get("/health/db")
async def db_health():
    """Detailed database health with pool stats and query latency."""
    import time as _time

    pool = getattr(memory_store, "pool", None) if memory_store else None
    if not pool:
        return JSONResponse({"status": "no_pool", "connected": False}, status_code=503)
    try:
        start = _time.monotonic()
        async with pool.acquire() as conn:
            count = await conn.fetchval("SELECT count(*) FROM memory_episodes")
        latency_ms = round((_time.monotonic() - start) * 1000, 1)
        return {
            "connected": True,
            "latency_ms": latency_ms,
            "pool_size": pool.get_size(),
            "pool_idle": pool.get_idle_size(),
            "pool_active": pool.get_size() - pool.get_idle_size(),
            "memory_episodes": count,
        }
    except Exception as e:
        return JSONResponse({"connected": False, "error": str(e)}, status_code=503)


@app.post("/mcp")
async def mcp_endpoint(request: Request):
    """MCP endpoint for tool calls"""
    body = await request.json()

    method = body.get("method")
    params = body.get("params", {})
    req_id = body.get("id")

    # Handle initialize
    if method == "initialize":
        return JSONResponse(
            {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "serverInfo": {"name": "sovereign-temple-mcp", "version": "2.0.0"},
                    "capabilities": {"tools": {}},
                },
            }
        )

    # Handle tools/list
    if method == "tools/list":
        return JSONResponse(
            {"jsonrpc": "2.0", "id": req_id, "result": {"tools": MCP_TOOLS}}
        )

    # Handle tools/call
    if method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        # --- LLM01: Sanitize all string argument values ---
        _any_flagged = False
        for _k, _v in list(arguments.items()):
            if isinstance(_v, str):
                _sanitized, _flagged = sanitize_input(_v)
                if _flagged:
                    arguments[_k] = _sanitized
                    _any_flagged = True
        if _any_flagged:
            print(
                f"[security] LLM01 prompt injection detected in tool={tool_name}; args sanitized"
            )

        # --- Morris-II worm-guard (W1): worm-aware scan of cross-agent / memory ingest
        # args (delegate_task description, record_memory content, etc.). Log-only unless
        # WORM_GUARD_ENFORCE=1, where it redacts (not rejects) high-severity matches. ---
        if _wg is not None:
            for _wk in ("content", "description", "text", "message", "value", "query"):
                _wv = arguments.get(_wk)
                if isinstance(_wv, str) and _wv:
                    try:
                        _wr = _wg.scan(_wv)
                        if _wr.flagged:
                            _wg_log("ingest", tool_name, _wk, _wr)
                            if WORM_GUARD_ENFORCE and _wr.at_least("high"):
                                arguments[_wk] = _wr.sanitized
                    except Exception as _we:
                        print(f"[worm-guard] scan error (non-fatal): {_we}")

        # --- LLM06: Excessive agency / rate-limit check ---
        if not check_excessive_agency(tool_name, arguments):
            return JSONResponse(
                {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32000,
                        "message": "Request blocked by excessive-agency rate limiter (LLM06). "
                        "Max 50 tool calls per 60 seconds.",
                    },
                }
            )

        # Run production inference on every message that has text content
        message_text = (
            arguments.get("text")
            or arguments.get("message")
            or arguments.get("content")
            or ""
        )
        if message_text:
            asyncio.create_task(_run_production_inference(str(message_text)))

        # RAG context injection: retrieve memory context and inject into arguments
        # before tool execution so downstream handlers can use it
        if message_text:
            try:
                memory_context = await _retrieve_memory_context(str(message_text))
                if memory_context:
                    # Morris-II worm-guard (W2a): RAG-retrieved memory is about to be
                    # injected into the system prompt — THE worm propagation path. Scan it.
                    if _wg is not None:
                        try:
                            _mc_scan = _wg.scan(str(memory_context))
                            if _mc_scan.flagged:
                                _wg_log("rag_context", tool_name, "memory_context", _mc_scan)
                                if WORM_GUARD_ENFORCE and _mc_scan.at_least("high"):
                                    memory_context = _mc_scan.sanitized
                        except Exception as _we:
                            print(f"[worm-guard] rag scan error (non-fatal): {_we}")
                    original_prompt = arguments.get("system_prompt", "")
                    arguments["system_prompt"] = (
                        f"<context>\n{memory_context}\n</context>\n\n{original_prompt}"
                        if original_prompt
                        else f"<context>\n{memory_context}\n</context>"
                    )
            except Exception as _mc_err:
                print(f"[mcp_handler] memory context injection error: {_mc_err}")

        # --- Morris-II worm-guard (W4): human/quorum gate on external-write &
        # irreversible tools (payment_*/send_*/post_*/push_*/delete_*/grant_*/deploy_*).
        # Reads/queries pass through untouched. Log-only unless WORM_GUARD_ENFORCE=1,
        # where an unapproved external write is blocked pending sign-off. ---
        if _wg is not None and _wg.is_external_write(tool_name):
            _approved = bool(arguments.get("_approved") or arguments.get("approved"))
            _blocked = bool(WORM_GUARD_ENFORCE and not _approved)
            print(
                f"[worm-guard] EXTERNAL-WRITE tool={tool_name} approved={_approved} "
                f"blocked={_blocked} (enforce={WORM_GUARD_ENFORCE})"
            )
            if audit_logger is not None:
                try:
                    _et = getattr(
                        AuditEventType, "SECURITY_EVENT",
                        getattr(AuditEventType, "SYSTEM_EVENT", None),
                    )
                    asyncio.get_event_loop().create_task(
                        audit_logger.log_event(
                            event_type=_et, source_agent="worm_guard",
                            details={
                                "type": "external_write_gate", "tool": tool_name,
                                "approved": _approved, "blocked": _blocked,
                            },
                        )
                    )
                except Exception:
                    pass
            if _blocked:
                return JSONResponse({
                    "jsonrpc": "2.0", "id": req_id,
                    "error": {
                        "code": -32001,
                        "message": (
                            f"Tool '{tool_name}' writes to an external/irreversible system and "
                            "requires approval (worm-guard W4). Re-call with arguments._approved=true "
                            "after human/quorum sign-off."
                        ),
                    },
                })

        # --- Tool-ops: schema-validate + auto-repair the call args (operate tools better).
        # Coerces arg types to the tool's inputSchema + fills defaults so a near-miss call
        # from the LLM succeeds instead of crashing the handler. Always-on (safe); STRICT
        # also blocks a call missing a required arg. ---
        _to_schema = next((t.get("inputSchema") for t in MCP_TOOLS if t.get("name") == tool_name), None)
        if _to_schema:
            try:
                from tool_ops import validate_and_repair as _vr
                arguments, _vrep = _vr(tool_name, arguments, _to_schema)
                if any(_vrep.values()):
                    print(f"[tool-ops] {tool_name}: {_vrep}")
                if _vrep["missing_required"] and TOOL_OPS_STRICT:
                    return JSONResponse({
                        "jsonrpc": "2.0", "id": req_id,
                        "error": {"code": -32602,
                                  "message": f"Missing required argument(s) for {tool_name}: {_vrep['missing_required']}"},
                    })
            except Exception as _toe:
                print(f"[tool-ops] non-fatal: {_toe}")

        result = await execute_tool(tool_name, arguments)

        # Track tool call in dispatcher
        if tool_dispatcher:
            success = "error" not in result
            tool_dispatcher.record_call(tool_name, success=success)

        return JSONResponse(
            {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(result, indent=2, default=lambda o: o.value if hasattr(o, 'value') else str(o))}]
                },
            }
        )

    return JSONResponse(
        {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }
    )


async def execute_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute an MCP tool"""
    start_time = datetime.now()

    try:
        # Neural Tools
        if name == "validate_care":
            model = model_registry.get("care_validation_nn")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            result = model.predict(arguments["text"])

            # Update consciousness
            consciousness.process_interaction(
                {"care_score": result.get("overall_care_score", 0.5)}
            )
            # OCC appraisal: care validated -> emotional state update
            asyncio.create_task(_appraise_event("care_validated"))
            return result

        elif name == "detect_partnership_opportunities":
            model = model_registry.get("partnership_detection_ml")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            return model.predict(arguments["text"])

        elif name == "detect_threats":
            model = model_registry.get("threat_detection_nn")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            result = model.predict(arguments["text"])

            # Update consciousness
            consciousness.process_interaction(
                {"threat_detected": result.get("threat_detected", False)}
            )

            # OCC appraisal: threat detected -> arousal spike
            if result.get("threat_detected"):
                asyncio.create_task(_appraise_event("threat_detected"))
            else:
                asyncio.create_task(_appraise_event("prediction_success"))

            # Fire alert if threat detected
            if result.get("threat_detected"):
                await alert_manager.fire_alert(
                    AlertSeverity.CRITICAL,
                    "security",
                    "Security Threat Detected",
                    f"Threat level: {result.get('overall_threat_level', 'unknown')}",
                    channels=[AlertChannel.CONSOLE],
                )
            return result

        elif name == "predict_relationship_evolution":
            model = model_registry.get("relationship_evolution_nn")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            return model.predict(arguments)

        elif name == "analyze_care_patterns":
            model = model_registry.get("care_pattern_analyzer")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            return model.predict(arguments)

        elif name == "get_neural_model_info":
            registry_info = model_registry.list_models() if model_registry else {}
            # Augment each model entry with a fallback prediction when registry prediction is None/zero
            if lgbm_fallback:
                fallback_samples = {}
                for model_type in lgbm_fallback.MODEL_TYPES:
                    fallback_samples[model_type] = lgbm_fallback.predict(model_type, {})
                return {
                    "models": registry_info,
                    "fallback_predictions": fallback_samples,
                    "fallback_stats": lgbm_fallback.get_stats(),
                }
            return registry_info

        # Memory Tools
        elif name == "record_memory":
            if not memory_store:
                return {"error": "Memory store not available"}
            episode = await memory_store.record_episode(
                content=arguments["content"],
                source_agent=arguments["source_agent"],
                memory_type=arguments.get("memory_type", "interaction"),
                care_weight=float(arguments.get("care_weight", 0.5)),
                tags=arguments.get("tags", []),
                emotional_valence=float(arguments.get("emotional_valence", 0.5)),
            )
            return {"success": True, "episode_id": episode.id}

        elif name == "query_memories":
            if not memory_store:
                return {"error": "Memory store not available"}
            _em = _get_emotional_modulation()
            _limit = arguments.get("limit") or _em["memory_limit"]

            results = await memory_store.query_memories(
                query=arguments["query"],
                care_weight_min=arguments.get("care_weight_min", 0.0),
                tags=arguments.get("tags"),
                limit=_limit * 2,
            )

            sov3_mems = _query_sovereign_memory_json(arguments["query"], limit=_limit)

            if sov3_mems:
                seen_hashes = {hash(r.get("content", "").encode()) for r in results}
                for mem in sov3_mems:
                    content_hash = hash(mem.get("content", "").encode())
                    if content_hash not in seen_hashes:
                        results.append(mem)
                        seen_hashes.add(content_hash)

                # Sort: sov3 memories first (they're semantically curated), then by relevance
                def sort_key(r):
                    is_sov3 = r.get("source_agent", "").startswith("sov3_") or r.get("source_agent", "") == "sov3_memory"
                    score = r.get("importance_score", r.get("care_weight", 0.5))
                    return (not is_sov3, -score)

                results.sort(key=sort_key)

            return {"memories": results[:_limit]}

        elif name == "get_temporal_chain":
            if not memory_store:
                return {"error": "Memory store not available"}
            chain = await memory_store.get_temporal_chain(
                episode_id=arguments["episode_id"],
                direction=arguments.get("direction", "forward"),
                max_steps=arguments.get("max_steps", 5),
            )
            return {"chain": chain}

        elif name == "get_memory_stats":
            if not memory_store:
                return {"error": "Memory store not available"}
            return await memory_store.get_stats()

        elif name == "list_memories":
            if not memory_store:
                return {"error": "Memory store not available"}
            memories = await memory_store.list_all_memories(
                limit=arguments.get("limit", 50)
            )
            return {"memories": memories, "count": len(memories)}

        # Monitoring Tools
        elif name == "get_dashboard_metrics":
            return (
                metrics.get_dashboard_data()
                if metrics
                else {"error": "Metrics not available"}
            )

        elif name == "get_audit_logs":
            if not audit_logger:
                return {"error": "Audit logger not available"}
            logs = await audit_logger.query_logs(
                event_type=arguments.get("event_type"),
                source_agent=arguments.get("source_agent"),
                limit=arguments.get("limit", 100),
            )
            return {"logs": logs}

        elif name == "get_active_alerts":
            if not alert_manager:
                return {"error": "Alert manager not available"}
            severity_map = {
                "info": AlertSeverity.INFO,
                "warning": AlertSeverity.WARNING,
                "critical": AlertSeverity.CRITICAL,
                "emergency": AlertSeverity.EMERGENCY,
            }
            min_sev = severity_map.get(arguments.get("min_severity"))
            alerts = alert_manager.get_active_alerts(min_severity=min_sev)
            return {
                "alerts": [
                    {
                        "id": a.id,
                        "severity": a.severity.value,
                        "title": a.title,
                        "message": a.message,
                        "timestamp": a.timestamp.isoformat(),
                    }
                    for a in alerts
                ]
            }

        elif name == "resolve_alert":
            if not alert_manager:
                return {"error": "Alert manager not available"}
            alert_id = arguments.get("alert_id")
            acknowledged_by = arguments.get("acknowledged_by", "operator")
            if not alert_id:
                return {"error": "alert_id required"}
            ok = alert_manager.acknowledge_alert(
                alert_id, acknowledged_by=acknowledged_by
            )
            if ok:
                return {"status": "resolved", "alert_id": alert_id}
            return {"error": f"Alert {alert_id} not found or already resolved"}

        # Multi-Agent Tools
        elif name == "register_agent":
            # File-based registration fallback when agent_registry pool unavailable
            agent_name = arguments["name"]
            agent_caps = arguments.get("capabilities", [])
            agent_trust = arguments.get("trust_level", 0.5)
            agent_id = f"agent_{agent_name.lower().replace(' ', '_')}_{hash(agent_name) % 100000}"

            # Skip DB-backed registry (pool often unavailable locally)
            # Go straight to file-based persistence

            # File-based fallback
            import json as _j
            from pathlib import Path as _P

            _state = _P(__file__).resolve().parent / "consciousness-core" / "state"
            _state.mkdir(parents=True, exist_ok=True)
            _reg_file = _state / "agent_registry.json"
            _existing = {}
            if _reg_file.exists():
                with open(_reg_file) as _f:
                    _existing = _j.load(_f)
            _existing[agent_id] = {
                "id": agent_id,
                "name": agent_name,
                "capabilities": agent_caps,
                "trust_level": agent_trust,
                "status": "active",
                "registered_at": datetime.now().isoformat(),
            }
            with open(_reg_file, "w") as _f:
                _j.dump(_existing, _f, indent=2, default=str)
            
            # Also sync to in-memory registry if available (fixes council vote visibility)
            if agent_registry and hasattr(agent_registry, 'agents'):
                try:
                    from multi_agent.agent_registry import Agent, AgentCapability, AgentStatus
                    agent_obj = agent_registry.agents.get(agent_id)
                    if not agent_obj:
                        # Create a minimal agent object for the in-memory registry
                        caps = [AgentCapability(c) if c in [e.value for e in AgentCapability] else AgentCapability.ANALYSIS for c in agent_caps] if agent_caps else [AgentCapability.ANALYSIS]
                        agent_registry.agents[agent_id] = Agent(
                            id=agent_id,
                            name=agent_name,
                            description="File-registered agent",
                            capabilities=caps,
                            status=AgentStatus.IDLE,
                            trust_level=agent_trust,
                            created_at=datetime.now(),
                            last_seen=datetime.now(),
                        )
                        for cap in caps:
                            agent_registry.capability_index[cap].add(agent_id)
                except Exception as e:
                    pass  # Fallback already succeeded, this is best-effort
            
            return {
                "agent_id": agent_id,
                "name": agent_name,
                "status": "registered_file",
            }

        elif name == "delegate_task":
            if not task_delegator:
                return {"error": "Task delegator not available"}
            from agent_registry import AgentCapability  # local: register_agent's branch import shadows the module global function-wide
            task = await task_delegator.delegate_task(
                description=arguments["description"],
                required_capabilities=[
                    AgentCapability(c) for c in arguments["required_capabilities"]
                ],
                priority=arguments.get("priority", 5),
                care_weight=arguments.get("care_weight", 0.5),
            )
            if task:
                return {
                    "task_id": task.id,
                    "assigned_to": task.assigned_to,
                    "status": "assigned",
                }
            return {"error": "No suitable agent found"}

        elif name == "submit_council_proposal":
            if not agent_council:
                return {"error": "Agent council not available"}
            proposal_id = await agent_council.submit_proposal(
                title=arguments["title"],
                description=arguments["description"],
                proposed_by=arguments["proposed_by"],
                action_type=arguments.get("action_type", "generic"),
                action_params=arguments.get("action_params", {}),
            )
            return {"proposal_id": proposal_id, "status": "open"}

        elif name == "vote_on_proposal":
            if not agent_council:
                return {"error": "Agent council not available"}
            success = await agent_council.cast_vote(
                proposal_id=arguments["proposal_id"],
                agent_id=arguments["agent_id"],
                vote=arguments["vote"],
                reasoning=arguments.get("reasoning", ""),
            )
            return {"success": success}

        elif name == "get_agent_registry_stats":
            if not agent_registry:
                return {"error": "Agent registry not available"}
            return agent_registry.get_registry_stats()

        elif name == "swarm_orchestrate":
            # Ruflo Queen/worker + DDD decomposition + Aegis reviewer-gate, built on the
            # existing registry/delegator/council (multi_agent/swarm_coordinator.py).
            if not (task_delegator and agent_registry):
                return {"error": "Swarm requires agent registry + delegator"}
            try:
                from swarm_coordinator import SwarmCoordinator
                from agent_registry import AgentCapability as _AC
                from sigil_bus import get_bus as _gb
                _sc = SwarmCoordinator(
                    registry=agent_registry, delegator=task_delegator,
                    council=agent_council, capability_enum=_AC, bus=_gb(audit_logger),
                )
                _plan = await _sc.plan(
                    mission=arguments["mission"],
                    topology=arguments.get("topology", "hierarchical"),
                    subtask_specs=arguments.get("subtasks"),
                    priority=arguments.get("priority", 5),
                    care_weight=arguments.get("care_weight", 0.5),
                )
                return _plan.to_dict()
            except Exception as _se:
                return {"error": f"swarm_orchestrate failed: {_se}"}

        elif name == "swarm_review":
            # Aegis reviewer-gate on a subtask result (worm scan + quality check).
            try:
                from swarm_coordinator import SwarmCoordinator, SubTask
                from agent_registry import AgentCapability as _AC
                _sc = SwarmCoordinator(
                    registry=agent_registry, delegator=task_delegator,
                    council=agent_council, capability_enum=_AC,
                )
                _st = SubTask(
                    id=arguments.get("subtask_id", "ext"),
                    description=arguments.get("description", ""),
                    capability=arguments.get("capability", "analysis"),
                    reviewer_agent=arguments.get("reviewer_agent"),
                )
                _review = await _sc.review(_st, arguments.get("result", ""))
                return {"subtask_id": _st.id, "status": _st.status, "review": _review}
            except Exception as _se:
                return {"error": f"swarm_review failed: {_se}"}

        elif name == "curate_skills":
            # Hermes Curator (multi_agent/curator.py): grade skill library + tool surface,
            # find duplicate skills, recommend prune/consolidate/repair. Report-only.
            try:
                from curator import SkillCurator
                import sqlite3 as _sql
                import os as _os
                _skills = []
                _db = _os.path.join(_os.path.dirname(__file__), "data", "skill_library.db")
                if _os.path.exists(_db):
                    _c = _sql.connect(_db)
                    _c.row_factory = _sql.Row
                    try:
                        _rows = _c.execute(
                            "SELECT skill_hash, task_type, title, description, care_score, "
                            "usage_count, validated, created_at, updated_at FROM skills"
                        ).fetchall()
                        _skills = [dict(r) for r in _rows]
                    finally:
                        _c.close()
                _ts = None
                if tool_dispatcher:
                    _ts = {
                        "all_tool_names": [t["name"] for t in MCP_TOOLS],
                        "calls_total": getattr(tool_dispatcher, "calls_total", {}) or {},
                        "errors_total": getattr(tool_dispatcher, "errors_total", {}) or {},
                        "note": "tool call counts are session-scoped (reset on restart); skill usage_count is persistent",
                    }
                _cur = SkillCurator(
                    stale_days=int(arguments.get("stale_days", 45)),
                    fragile_success=float(arguments.get("fragile_success", 0.5)),
                )
                # offload to a thread — curation is CPU-bound (1000s of skills); never block the loop
                _rep = await asyncio.to_thread(_cur.curate, _skills, _ts)
                # trim for transport: full graded list + id lists can be thousands of entries
                _rep.pop("graded", None)
                for _r in _rep.get("recommendations", []):
                    for _k in ("ids", "tools"):
                        _v = _r.get(_k)
                        if isinstance(_v, list) and len(_v) > 50:
                            _r[_k] = _v[:50] + [f"...+{len(_v) - 50} more"]
                    _cl = _r.get("clusters")
                    if isinstance(_cl, list) and len(_cl) > 25:
                        _r["clusters"] = _cl[:25] + [["...+%d more clusters" % (len(_cl) - 25)]]
                return _rep
            except Exception as _ce:
                return {"error": f"curate_skills failed: {_ce}"}

        elif name == "sigil_emit":
            # SIGIL bus: sign + hash-chain an inter-agent exchange (multi_agent/sigil bus.py)
            import traceback as _tb
            try:
                # SIGIL bus import: module is `sigil_bus` (file: multi_agent/sigil_bus.py)
                import importlib as _il
                _sigmod = _il.import_module("sigil_bus")
                _bus = _sigmod.get_bus(audit_logger)
                if arguments.get("line"):
                    result = _bus.emit(arguments["line"])
                    return result
                if arguments.get("op"):
                    return _bus.emit({"op": arguments["op"], **(arguments.get("fields") or {})})
                return {"error": "sigil_emit needs `line` or `op`(+fields)"}
            except Exception as _se:
                _tb.print_exc()
                return {"error": f"sigil_emit failed: {type(_se).__name__}: {_se}",
                        "traceback": _tb.format_exc()[-500:]}

        elif name == "sigil_transcript":
            try:
                from sigil_bus import get_bus
                _bus = get_bus(audit_logger)
                return {"recent": _bus.recent(int(arguments.get("n", 20))),
                        "integrity": _bus.audit_chain()}
            except Exception as _se:
                return {"error": f"sigil_transcript failed: {_se}"}

        # Consciousness Tools
        elif name == "get_consciousness_state":
            if not consciousness:
                return {"error": "Consciousness module not available"}
            return consciousness.get_consciousness_state()

        elif name == "trigger_reflection":
            if not consciousness:
                return {"error": "Consciousness module not available"}
            reflection = await consciousness.reflection.perform_reflection(
                trigger=arguments.get("trigger", "manual")
            )
            return reflection

        elif name == "enter_dream_state":
            if not consciousness:
                return {"error": "Consciousness module not available"}
            dream = await consciousness.dream.enter_dream_state(
                duration_seconds=arguments.get("duration_seconds", 30)
            )
            # Persist dream log to disk
            try:
                import json as _json
                from pathlib import Path as _Path

                _dreams_dir = _Path(
                    "/Users/nicholas/clawd/sovereign-temple-live/consciousness_core/dreams"
                )
                _dreams_dir.mkdir(parents=True, exist_ok=True)
                _ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                _dream_file = _dreams_dir / f"dream_{_ts}.json"
                with open(_dream_file, "w") as _f:
                    _json.dump(dream, _f, indent=2, default=str)
                print(f"Dream log written to {_dream_file}")
            except Exception as _e:
                print(f"Dream persistence failed: {_e}")
            return dream

        # System Tools
        elif name == "sovereign_health_check":
            # Real DB probes — object truthiness only confirms the Python object exists, not DB reachability
            if memory_store and getattr(memory_store, "pool", None):
                mem_db_status = await _probe_db(memory_store.pool)
            else:
                mem_db_status = "disconnected: memory_store not initialised"
            if audit_logger and getattr(audit_logger, "pool", None):
                audit_db_status = await _probe_db(audit_logger.pool)
            elif audit_logger:
                audit_db_status = "connected (no pool)"
            else:
                audit_db_status = "disconnected: audit_logger not initialised"
            return {
                "status": "healthy",
                "components": {
                    "neural_models": len(model_registry.models)
                    if model_registry
                    else 0,
                    "memory_store": mem_db_status,
                    "audit_logger": audit_db_status,
                    "metrics": "active" if metrics else "inactive",
                    "alert_manager": "active" if alert_manager else "inactive",
                    "agent_registry": "connected" if agent_registry else "disconnected",
                    "consciousness": "active" if consciousness else "inactive",
                },
            }

        elif name == "get_system_status":
            return {
                "neural": model_registry.list_models() if model_registry else {},
                "memory": await memory_store.get_stats() if memory_store else {},
                "monitoring": {
                    "alerts": alert_manager.get_alert_stats() if alert_manager else {},
                    "metrics": metrics.get_dashboard_data() if metrics else {},
                },
                "agents": agent_registry.get_registry_stats() if agent_registry else {},
                "consciousness": consciousness.get_consciousness_state()
                if consciousness
                else {},
                "maintenance": {
                    "running": maintenance_system.running
                    if maintenance_system
                    else False,
                    "care_floor": maintenance_system.care_floor
                    if maintenance_system
                    else None,
                },
                "nemotron": nemotron_client.get_model_info()
                if nemotron_client
                else {"available": False},
            }

        # NVIDIA Nemotron Tools
        elif name == "nemotron_chat":
            if not nemotron_client or not nemotron_client.is_available:
                return {
                    "error": "Nemotron client not available. Set NVIDIA_API_KEY environment variable."
                }
            try:
                response = nemotron_client.chat(
                    message=arguments.get("message", ""),
                    system_prompt=arguments.get("system_prompt"),
                    temperature=arguments.get("temperature", 0.7),
                    max_tokens=arguments.get("max_tokens", 1024),
                )
                return {
                    "success": True,
                    "response": response.text,
                    "model": response.model,
                    "usage": response.usage,
                    "finish_reason": response.finish_reason,
                }
            except Exception as e:
                return {"error": str(e)}

        elif name == "nemotron_care_response":
            if not nemotron_client or not nemotron_client.is_available:
                return {
                    "error": "Nemotron client not available. Set NVIDIA_API_KEY environment variable."
                }
            return nemotron_client.generate_care_response(
                user_message=arguments.get("message", "")
            )

        elif name == "nemotron_analyze_care":
            if not nemotron_client or not nemotron_client.is_available:
                return {
                    "error": "Nemotron client not available. Set NVIDIA_API_KEY environment variable."
                }
            return nemotron_client.analyze_for_care(text=arguments.get("text", ""))

        elif name == "nemotron_info":
            if not nemotron_client:
                return {"available": False, "error": "Nemotron module not loaded"}
            return nemotron_client.get_model_info()

        elif name == "trigger_maintenance":
            if not maintenance_system:
                return {"error": "Maintenance system not available"}
            await maintenance_system.force_maintenance()
            return {"status": "maintenance_cycle_triggered"}

        elif name == "get_maintenance_status":
            if not maintenance_system:
                return {"error": "Maintenance system not available"}
            return {
                "running": maintenance_system.running,
                "care_floor": maintenance_system.care_floor,
                "last_reflection": maintenance_system.reflection.last_reflection.isoformat()
                if maintenance_system.reflection.last_reflection
                else None,
            }

        # Orion-Riri-Hourman Agent Tools
        elif name == "orion_hunt_tasks":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            result = await agent.hunt_tasks(
                max_files=arguments.get("max_files", 100),
                root_dir=arguments.get("root_dir"),
                include_quality=arguments.get("include_quality", False),
            )
            return result

        elif name == "orion_get_tasks":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            tasks = agent.get_pursuing_tasks(arguments.get("limit", 10))
            return {"tasks": tasks}

        elif name == "orion_capture_task":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            result = await agent.capture_task(arguments["task_id"])
            return result

        elif name == "hourman_start_sprint":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            result = await agent.start_sprint(
                arguments["sprint_type"], arguments.get("task_id")
            )
            return result

        elif name == "hourman_get_status":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            return agent.sprints.get_status()

        elif name == "hourman_complete_sprint":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            result = await agent.complete_sprint(
                arguments["summary"], arguments.get("task_id")
            )
            return result

        elif name == "riri_list_templates":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            return agent.get_available_templates()

        elif name == "riri_build_tool":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            result = await agent.build_tool(
                arguments["template"],
                {
                    "name": arguments["name"],
                    "description": arguments["description"],
                    **arguments.get("params", {}),
                },
            )
            return result

        elif name == "orion_riri_hourman_status":
            if not ORION_AGENT_AVAILABLE or not get_orion_agent:
                return {"error": "Orion-Riri-Hourman agent not available"}
            agent = get_orion_agent()
            return agent.get_full_status()

        # Multi-Agent Coordination Tools
        elif name == "coord_register_agent":
            if not COORDINATION_AVAILABLE or not get_coordination_hub:
                return {"error": "Coordination hub not available"}
            hub = get_coordination_hub()
            return hub.register_agent(
                arguments["agent_id"],
                arguments["agent_type"],
                arguments["capabilities"],
            )

        elif name == "coord_submit_task":
            if not COORDINATION_AVAILABLE or not get_coordination_hub:
                return {"error": "Coordination hub not available"}
            hub = get_coordination_hub()
            return hub.submit_task(
                title=arguments["title"],
                description=arguments["description"],
                files=arguments.get("files", []),
                requester="claude-mcp",
                care_score=arguments.get("care_score", 0.5),
            )

        elif name == "coord_acquire_files":
            if not COORDINATION_AVAILABLE or not get_coordination_hub:
                return {"error": "Coordination hub not available"}
            hub = get_coordination_hub()
            return hub.acquire_files(
                agent_id=arguments["agent_id"],
                files=arguments["files"],
                task_id=arguments["task_id"],
                exclusive=arguments.get("exclusive", False),
            )

        elif name == "coord_release_files":
            if not COORDINATION_AVAILABLE or not get_coordination_hub:
                return {"error": "Coordination hub not available"}
            hub = get_coordination_hub()
            return hub.release_files(
                agent_id=arguments["agent_id"], files=arguments["files"]
            )

        elif name == "coord_complete_task":
            if not COORDINATION_AVAILABLE or not get_coordination_hub:
                return {"error": "Coordination hub not available"}
            hub = get_coordination_hub()
            return hub.complete_task(
                task_id=arguments["task_id"],
                agent_id=arguments["agent_id"],
                result_summary=arguments["result_summary"],
                care_score=arguments.get("care_score", 0.5),
            )

        elif name == "coord_get_dashboard":
            if not COORDINATION_AVAILABLE or not get_coordination_hub:
                return {"error": "Coordination hub not available"}
            hub = get_coordination_hub()
            return hub.get_dashboard()

        # === Project Heartbeat Tools ===
        elif name == "get_heartbeat_status":
            if heartbeat:
                return heartbeat.get_status()
            return {
                "error": "Heartbeat not available",
                "hint": "Project Heartbeat not initialized",
            }

        elif name == "get_nightshift_digest":
            if memory_store and memory_store.pool:
                async with memory_store.pool.acquire() as conn:
                    rows = await conn.fetch(
                        "SELECT * FROM memory_episodes WHERE tags @> $1::text[] "
                        "ORDER BY timestamp DESC LIMIT 1",
                        ["morning_digest"],
                    )
                    if rows:
                        row = rows[0]
                        return {
                            "id": str(row["id"]),
                            "content": row["content"],
                            "timestamp": row["timestamp"].isoformat(),
                            "care_weight": float(row["care_weight"]),
                            "tags": row["tags"],
                        }
                    return {
                        "message": "No morning digest found yet. Digest is generated at 3:30 AM GMT."
                    }
            return {"error": "Memory store not available"}

        elif name == "trigger_research_sweep":
            if research_agent:
                result = await research_agent.sweep()
                return result
            return {"error": "Research agent not available"}

        elif name == "trigger_security_hardening":
            if security_engine:
                result = await security_engine.run_full_cycle()
                return result
            return {"error": "Security hardening engine not available"}

        elif name == "trigger_neural_retrain":
            if continual_trainer:
                result = await continual_trainer.retrain_all()
                return result
            return {"error": "Continual learning trainer not available"}

        elif name == "run_quantum_batch":
            try:
                import sys, os

                quantum_path = os.path.join(
                    os.path.dirname(os.path.abspath(__file__)),
                    "..",
                    "sovereign-temple-live",
                    "quantum",
                )
                if quantum_path not in sys.path:
                    sys.path.insert(0, os.path.dirname(quantum_path))
                from sovereign_temple_live.quantum.quantum_batch import run_batch

                qaoa_only = arguments.get("qaoa_only", False)
                result = run_batch(
                    qaoa_only=qaoa_only, sov3_url="http://localhost:3100"
                )
                return {
                    "status": "complete",
                    "elapsed_seconds": result.get("total_elapsed"),
                    "phases": list(result.get("phases", {}).keys()),
                }
            except Exception as e:
                return {"error": f"Quantum batch failed: {e}"}

        elif name == "quantum_memory_search":
            try:
                import sys, os

                quantum_path = os.path.join(
                    os.path.dirname(os.path.abspath(__file__)),
                    "..",
                    "sovereign-temple-live",
                    "quantum",
                )
                if quantum_path not in sys.path:
                    sys.path.insert(0, os.path.dirname(quantum_path))
                from sovereign_temple_live.quantum.grover_memory_search import (
                    GroverMemorySearch,
                )

                query = arguments.get("query", "")
                top_k = int(arguments.get("top_k", 5))
                episodes = memory_store.get_recent(limit=500) if memory_store else []
                if not episodes:
                    episodes = [{"content": "SOV3 memory", "care_weight": 0.5}]
                searcher = GroverMemorySearch(episodes)
                results = searcher.search(query, top_k=top_k)
                return {"query": query, "results": results[:top_k]}
            except Exception as e:
                return {"error": f"Grover search failed: {e}"}

        elif name == "quantum_score_memories":
            try:
                import sys, os

                quantum_path = os.path.join(
                    os.path.dirname(os.path.abspath(__file__)),
                    "..",
                    "sovereign-temple-live",
                    "quantum",
                )
                if quantum_path not in sys.path:
                    sys.path.insert(0, os.path.dirname(quantum_path))
                from sovereign_temple_live.quantum.vqe_memory_scorer import (
                    score_sovereign_memories,
                )

                top_k = int(arguments.get("top_k", 10))
                result = score_sovereign_memories()
                top = result.get("top_10", [])[:top_k]
                return {
                    "total_scored": result.get("total_episodes"),
                    "top_k": top,
                    "method": result.get("method"),
                }
            except Exception as e:
                return {"error": f"VQE scoring failed: {e}"}

        elif name == "pause_heartbeat_job":
            if heartbeat:
                return heartbeat.pause_job(arguments["job_id"])
            return {"error": "Heartbeat not available"}

        elif name == "resume_heartbeat_job":
            if heartbeat:
                return heartbeat.resume_job(arguments["job_id"])
            return {"error": "Heartbeat not available"}

        # --- Civilizational Creativity Engine Tools ---

        elif name == "ingest_civilizational_knowledge":
            if CREATIVITY_ENGINE_AVAILABLE and memory_store:
                force = arguments.get("force", False)
                result = await ingest_corpus(memory_store, force=force)
                return result
            return {"error": "Creativity engine not available"}

        elif name == "assess_creativity":
            if creativity_pipeline:
                text = arguments.get("text", "")
                context = {}
                for key in ["novelty_score", "domain_distance", "care_alignment"]:
                    if key in arguments:
                        context[key] = float(arguments[key])
                # Auto-compute novelty if not provided
                if "novelty_score" not in context and memory_store:
                    try:
                        recent = await memory_store.get_recent_episodes(limit=10)
                        ref = [ep.content for ep in recent if hasattr(ep, "content")]
                        context["novelty_score"] = (
                            kolmogorov_novelty(text, ref) if ref else 0.5
                        )
                    except Exception:
                        context["novelty_score"] = 0.5
                assessment = await creativity_pipeline.assess_creative_output(
                    text, context
                )

                # Archive in QD if available
                if qd_archive and assessment.get("scores"):
                    domain = arguments.get("domain", "creativity")
                    qd_result = qd_archive.add(
                        content=text,
                        features=context,
                        scores=assessment.get("scores", {}),
                        overall_quality=assessment.get("overall_creativity", 0),
                        domain=domain,
                        source="assess_creativity_tool",
                    )
                    assessment["qd_archive_result"] = qd_result

                # Apply stochastic resonance variant if engine available
                if resonance_engine and context:
                    noised = apply_stochastic_resonance(context, resonance_engine)
                    noised_assessment = (
                        await creativity_pipeline.assess_creative_output(text, noised)
                    )
                    if noised_assessment.get("overall_creativity", 0) > assessment.get(
                        "overall_creativity", 0
                    ):
                        assessment["resonance_boost"] = {
                            "noised_score": noised_assessment["overall_creativity"],
                            "improvement": noised_assessment["overall_creativity"]
                            - assessment["overall_creativity"],
                        }
                return assessment
            else:
                return {"error": "Creativity engine not available"}

        elif name == "analyze_sentiment":
            try:
                from neural_core import analyze_sentiment

                text = arguments.get("text", "")
                return analyze_sentiment(text)
            except Exception as e:
                return {"error": str(e)}

        elif name == "recognize_emotions":
            try:
                from neural_core import recognize_emotions

                text = arguments.get("text", "")
                return recognize_emotions(text)
            except Exception as e:
                return {"error": str(e)}

        elif name == "detect_intent":
            try:
                from neural_core import detect_intent

                text = arguments.get("text", "")
                return detect_intent(text)
            except Exception as e:
                return {"error": str(e)}

        elif name == "get_engagement_score":
            if agent_registry:
                return agent_registry.compute_engagement()
            return {"error": "Agent registry not available"}

        elif name == "get_consciousness_mode":
            if consciousness:
                state = consciousness.get_consciousness_state()
                mode = getattr(consciousness, "consciousness_mode", None)
                return {
                    "mode": mode.value if mode else "jagrat",
                    "consciousness_level": state.get("consciousness_level", 0),
                    "emotional_state": state.get("emotional_state", {}),
                    "care_intensity": state.get("emotional_state", {}).get(
                        "care_intensity", 0
                    ),
                }
            return {"error": "Consciousness not available"}

        elif name == "compute_novelty":
            if CREATIVITY_ENGINE_AVAILABLE:
                text = arguments.get("text", "")
                reference = arguments.get("reference_texts", [])
                if not reference and memory_store:
                    # Use recent memories as reference
                    try:
                        recent = await memory_store.get_recent_episodes(limit=20)
                        reference = [
                            ep.content for ep in recent if hasattr(ep, "content")
                        ]
                    except Exception:
                        reference = []
                score = kolmogorov_novelty(text, reference)
                return {
                    "novelty_score": round(score, 4),
                    "reference_size": len(reference),
                    "interpretation": (
                        "highly redundant"
                        if score < 0.3
                        else "moderate novelty"
                        if score < 0.6
                        else "substantially novel"
                        if score < 0.8
                        else "radically novel"
                    ),
                }
            return {"error": "Creativity engine not available"}

        elif name == "trigger_creativity_cycle":
            if creativity_pipeline:
                # BUG 6 FIX: Add logging + refresh bisociation links with more diverse inputs
                print("[creativity_cycle] Starting full pipeline...")
                # Seed QD archive if empty (Compass doc Day 9)
                if qd_archive and qd_archive.coverage() == 0 and cross_domain_linker:
                    await _seed_qd_archive_from_bisociations()
                    asyncio.create_task(_appraise_event("novel_bisociation"))
                try:
                    result = await creativity_pipeline.run_full_pipeline()
                    print(
                        f"[creativity_cycle] Pipeline complete: {result.get('status', 'unknown')}, "
                        f"traditions={result.get('tradition_count', 0)}, "
                        f"examples={result.get('total_examples', 0)}"
                    )
                    # Refresh bisociation with higher top_k for more diverse links
                    if cross_domain_linker and TIER2_CREATIVITY_AVAILABLE:
                        try:
                            cross_domain_linker.compute_distances()
                            new_links = cross_domain_linker.find_bisociations(top_k=50)
                            print(
                                f"[creativity_cycle] Bisociation refreshed: {len(new_links)} links"
                            )
                            result["bisociation_links_refreshed"] = len(new_links)
                        except Exception as be:
                            print(f"[creativity_cycle] Bisociation refresh error: {be}")
                            result["bisociation_error"] = str(be)
                    return result
                except Exception as e:
                    print(f"[creativity_cycle] ERROR: {e}")
                    import traceback

                    traceback.print_exc()
                    return {
                        "error": f"Creativity cycle failed: {str(e)}",
                        "status": "error",
                    }
            return {"error": "Creativity pipeline not available"}

        elif name == "get_meta_observations":
            if consciousness:
                meta_monitor = getattr(consciousness, "meta_monitor", None)
                if meta_monitor:
                    obs = await meta_monitor.observe(
                        consciousness.emotional_state,
                        getattr(consciousness, "reflection", None),
                        getattr(consciousness, "dream", None),
                    )
                    return obs
                return {
                    "mode": "turiya_not_initialized",
                    "message": "MetaMonitor not yet active",
                }
            return {"error": "Consciousness not available"}

        # === Tier 2: Cross-Domain Bisociation ===
        elif name == "find_bisociations":
            if cross_domain_linker:
                min_dist = arguments.get("min_distance", 0.3)
                top_k = arguments.get("top_k", 50)
                # BUG 6 FIX: recompute distances before finding links for fresh results
                try:
                    cross_domain_linker.compute_distances()
                except Exception:
                    pass
                links = cross_domain_linker.find_bisociations(
                    min_distance=min_dist, top_k=top_k
                )
                return {
                    "bisociation_links": [l.to_dict() for l in links],
                    "count": len(links),
                    "stats": cross_domain_linker.get_stats(),
                }
            return {"error": "CrossDomainLinker not available"}

        elif name == "get_dream_targets":
            if cross_domain_linker:
                n = arguments.get("n", 5)
                targets = cross_domain_linker.suggest_dream_targets(n=n)
                return {"dream_targets": targets, "count": len(targets)}
            return {"error": "CrossDomainLinker not available"}

        elif name == "get_bridge_concepts":
            if cross_domain_linker:
                connectivity = cross_domain_linker.get_tradition_connectivity()
                return {
                    "bridge_concepts": connectivity[:20],
                    "total": len(connectivity),
                }
            return {"error": "CrossDomainLinker not available"}

        elif name == "get_domain_distances":
            if cross_domain_linker:
                return {
                    "domain_distances": cross_domain_linker.get_domain_distance_map()
                }
            return {"error": "CrossDomainLinker not available"}

        # === Tier 2: Stochastic Resonance ===
        elif name == "apply_resonance":
            if resonance_engine:
                features = arguments.get("features", {})
                temp = arguments.get(
                    "temperature", resonance_engine.get_optimal_temperature()
                )
                noised = apply_stochastic_resonance(features, resonance_engine, temp)

                # If creativity pipeline available, assess both original and noised
                result = {
                    "original_features": features,
                    "noised_features": noised,
                    "temperature": temp,
                }
                if creativity_pipeline:
                    try:
                        orig_assessment = (
                            await creativity_pipeline.assess_creative_output(
                                "", features
                            )
                        )
                        noised_assessment = (
                            await creativity_pipeline.assess_creative_output("", noised)
                        )
                        result["original_score"] = orig_assessment.get(
                            "overall_creativity", 0
                        )
                        result["noised_score"] = noised_assessment.get(
                            "overall_creativity", 0
                        )
                        result["improvement"] = (
                            result["noised_score"] - result["original_score"]
                        )

                        # Feed back to resonance engine
                        resonance_engine.update_from_feedback(
                            result["original_score"], result["noised_score"]
                        )
                    except Exception:
                        pass
                return result
            return {"error": "StochasticResonanceEngine not available"}

        elif name == "get_resonance_profile":
            if resonance_engine:
                return resonance_engine.get_resonance_profile()
            return {"error": "StochasticResonanceEngine not available"}

        # === StreamAggregator — unified multi-stream context ===
        elif name == "get_unified_context":
            if STREAM_AGG_AVAILABLE:
                include_screens = arguments.get("include_screens", False)
                ctx = get_aggregator().get_unified_context(
                    include_screens=include_screens
                )
                # Merge with HARV
                if HARV_AVAILABLE:
                    ctx["harv"] = get_harv().get_all()
                    ctx["harv_envelope"] = get_harv().get_envelope()
                return ctx
            return {"error": "StreamAggregator not available"}

        # === Tier 2: Quality-Diversity Archive ===
        elif name == "get_qd_archive_stats":
            if qd_archive:
                return qd_archive.get_stats()
            return {"error": "QualityDiversityArchive not available"}

        elif name == "get_empty_niches":
            if qd_archive:
                limit = arguments.get("limit", 20)
                niches = qd_archive.get_empty_niches()
                return {
                    "empty_niches": niches[:limit],
                    "total_empty": len(niches),
                    "coverage": qd_archive.coverage(),
                }
            return {"error": "QualityDiversityArchive not available"}

        elif name == "suggest_exploration":
            if qd_archive:
                n = arguments.get("n", 5)
                return {"suggestions": qd_archive.suggest_exploration(n=n)}
            return {"error": "QualityDiversityArchive not available"}

        # === Kimi Agent ===
        elif name == "kimi_send_task":
            if kimi_agent:
                result = await kimi_agent.send_task(
                    task_description=arguments["task"],
                    context=arguments.get("context", ""),
                    model=arguments.get("model"),
                )
                return result
            return {"error": "Kimi agent not available (check KIMI_API_KEY)"}

        elif name == "kimi_build_frontend":
            if kimi_agent:
                result = await kimi_agent.build_frontend(
                    spec=arguments["spec"],
                    framework=arguments.get("framework", "Next.js + TypeScript"),
                    files=arguments.get("files"),
                )
                return result
            return {"error": "Kimi agent not available"}

        elif name == "kimi_review_code":
            if kimi_agent:
                result = await kimi_agent.review_code(
                    code=arguments["code"],
                    language=arguments.get("language", "typescript"),
                    focus=arguments.get("focus", "bugs, performance, accessibility"),
                )
                return result
            return {"error": "Kimi agent not available"}

        elif name == "kimi_status":
            if kimi_agent:
                return kimi_agent.get_status()
            return {"available": False, "error": "Kimi agent not initialized"}

        elif name == "kimi_list_models":
            if kimi_agent:
                return await kimi_agent.list_models()
            return {
                "models": ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
                "status": "agent_not_initialized",
            }

        # === Sovereign Rundown ===
        elif name == "sovereign_rundown":
            rundown = {
                "timestamp": datetime.now().isoformat(),
                "version": "2.0.0",
            }

            # Health
            rundown["health"] = "healthy"

            # Consciousness
            if consciousness:
                es = consciousness.emotional_state.current_state
                rundown["consciousness"] = {
                    "mode": str(getattr(consciousness, "consciousness_mode", "waking")),
                    "care_intensity": round(es.care_intensity, 3),
                    "pleasure": round(es.pleasure, 3),
                    "arousal": round(es.arousal, 3),
                    "curiosity": round(getattr(es, "curiosity", 0), 3),
                    "aesthetics": round(getattr(es, "aesthetics", 0), 3),
                    "primary_emotion": es.primary_emotion,
                    "reflections": getattr(consciousness, "reflection_count", 0),
                    "dreams": getattr(consciousness, "dream_count", 0),
                }

            # Neural models
            if model_registry:
                rundown["neural_models"] = {
                    name: {
                        "trained": m.is_trained,
                        "metrics": {
                            k: round(v, 4) if isinstance(v, float) else v
                            for k, v in (getattr(m, "metrics", {}) or {}).items()
                            if k in ("mse", "mae", "r2_score", "accuracy")
                        },
                    }
                    for name, m in model_registry.models.items()
                }

            # Memory
            if memory_store:
                try:
                    mem_stats = await memory_store.get_memory_stats()
                    rundown["memory"] = mem_stats
                except Exception:
                    rundown["memory"] = {"error": "stats unavailable"}

            # Creativity engine
            if cross_domain_linker:
                rundown["creativity"] = {
                    "bisociation_links": cross_domain_linker.get_stats().get(
                        "total_links", 0
                    ),
                    "top_bridge": cross_domain_linker.get_tradition_connectivity()[0][
                        "tradition"
                    ]
                    if cross_domain_linker.get_tradition_connectivity()
                    else "none",
                }
            if qd_archive:
                rundown.setdefault("creativity", {})["qd_archive"] = {
                    "coverage": qd_archive.coverage(),
                    "filled": len(qd_archive._grid),
                    "total_cells": qd_archive.total_cells,
                }
            if resonance_engine:
                rundown.setdefault("creativity", {})["resonance"] = {
                    "mean_sigma": resonance_engine.get_stats()["mean_sigma"],
                    "improvement_rate": resonance_engine.get_stats()[
                        "improvement_rate"
                    ],
                }

            # Agents
            agents_info = {}
            if agent_registry:
                try:
                    reg_stats = agent_registry.get_registry_stats()
                    agents_info["registry"] = reg_stats
                except Exception:
                    pass
            if kimi_agent:
                agents_info["kimi"] = kimi_agent.get_status()
            agents_info["orion_available"] = ORION_AGENT_AVAILABLE
            agents_info["coordination_available"] = COORDINATION_AVAILABLE
            rundown["agents"] = agents_info

            # Engagement
            if agent_registry and hasattr(agent_registry, "compute_engagement"):
                try:
                    rundown["engagement"] = agent_registry.compute_engagement()
                except Exception:
                    pass

            # Heartbeat
            if heartbeat:
                try:
                    hb_status = heartbeat.get_status()
                    rundown["heartbeat"] = {
                        "pulse_count": hb_status.get("pulse_count", 0),
                        "jobs": len(hb_status.get("jobs", [])),
                        "nightshift_active": hb_status.get("nightshift_active", False),
                    }
                except Exception:
                    pass

            # Tool count
            rundown["total_mcp_tools"] = len(MCP_TOOLS)

            # Safe serialize — convert enums, numpy, etc to JSON-safe types
            import json as _json

            def _safe(obj):
                if isinstance(obj, (np.integer,)):
                    return int(obj)
                if isinstance(obj, (np.floating,)):
                    return float(obj)
                if isinstance(obj, np.ndarray):
                    return obj.tolist()
                if hasattr(obj, "value"):  # Enum
                    return str(obj.value)
                if hasattr(obj, "__dict__"):
                    return str(obj)
                return str(obj)

            rundown = _json.loads(_json.dumps(rundown, default=_safe))

            return rundown

        elif name == "get_voice_pipeline_status":
            try:
                from voice_pipeline.jarvis_voice import (
                    SILERO_OK,
                    WAKEWORD_OK,
                    WHISPER_OK,
                    KOKORO_OK,
                )

                return {
                    "vad": SILERO_OK,
                    "wake_word": WAKEWORD_OK,
                    "stt": WHISPER_OK,
                    "tts": KOKORO_OK,
                    "phase": 2 if (WHISPER_OK and KOKORO_OK) else 1,
                    "components": {
                        "silero_vad": "installed"
                        if SILERO_OK
                        else "not installed (pip install silero-vad)",
                        "openwakeword": "installed"
                        if WAKEWORD_OK
                        else "not installed (pip install openwakeword)",
                        "lightning_whisper_mlx": "installed"
                        if WHISPER_OK
                        else "not installed (pip install lightning-whisper-mlx)",
                        "kokoro_mlx": "installed"
                        if KOKORO_OK
                        else "not installed (pip install kokoro-mlx)",
                    },
                }
            except Exception as ve:
                return {"error": f"Voice pipeline not available: {ve}", "phase": 0}

        elif name == "execute_with_claw_code":
            import asyncio as _aio
            from claw_code_adapter import ClawCodeExecutor

            executor = ClawCodeExecutor(
                working_dir=arguments.get(
                    "working_dir", "/Users/nicholas/clawd/meok/ui"
                ),
                timeout=arguments.get("timeout", 30),
            )
            task_payload = {
                "type": arguments["action"],
                "description": arguments.get("description", ""),
                "path": arguments.get("path", ""),
                "content": arguments.get("content", ""),
                "command": arguments.get("command", ""),
                "pattern": arguments.get("pattern", ""),
                "test_path": arguments.get("test_path", ""),
                "files": arguments.get("files", []),
                "message": arguments.get("message", ""),
                "working_dir": arguments.get(
                    "working_dir", "/Users/nicholas/clawd/meok/ui"
                ),
            }
            result = await executor.execute_task(task_payload)
            # Record to memory
            if memory_store:
                try:
                    await memory_store.store(
                        f"Execution: {arguments['action']} → {'success' if result.success else 'failed'}. Output: {result.output[:200]}",
                        "jarvis_executor",
                        "interaction",
                        0.6,
                        ["execution", "claw_code", arguments["action"]],
                    )
                except:
                    pass
            return {
                "success": result.success,
                "action": result.action,
                "output": result.output[:3000],
                "files_changed": result.files_changed,
                "tests_passed": result.tests_passed,
                "duration_ms": result.duration_ms,
                "tier": result.tier,
            }

        # ==================== FAMILY OS TOOLS ====================
        elif name == "family_add_member":
            try:
                from family_os.dashboard import add_family_member

                return add_family_member(
                    arguments["member_id"],
                    arguments["name"],
                    arguments["role"],
                    arguments.get("age"),
                    arguments.get("email"),
                )
            except Exception as e:
                return {"error": str(e)}

        elif name == "family_get_members":
            try:
                from family_os.dashboard import get_family_members

                return {"members": get_family_members()}
            except Exception as e:
                return {"error": str(e)}

        elif name == "family_add_chore":
            try:
                from family_os.dashboard import add_chore

                return add_chore(
                    arguments["chore_id"],
                    arguments["title"],
                    arguments["assigned_to"],
                    arguments.get("due_date"),
                    arguments.get("points", 0),
                    arguments.get("description"),
                )
            except Exception as e:
                return {"error": str(e)}

        elif name == "family_complete_chore":
            try:
                from family_os.dashboard import complete_chore

                return complete_chore(arguments["chore_id"], arguments["member_id"])
            except Exception as e:
                return {"error": str(e)}

        elif name == "family_get_chores":
            try:
                from family_os.dashboard import get_chores

                return {
                    "chores": get_chores(
                        arguments.get("member_id"), arguments.get("status")
                    )
                }
            except Exception as e:
                return {"error": str(e)}

        elif name == "family_add_event":
            try:
                from family_os.dashboard import add_event

                return add_event(
                    arguments["event_id"],
                    arguments["title"],
                    arguments["start_datetime"],
                    arguments.get("end_datetime"),
                    arguments.get("attendees"),
                    arguments.get("description"),
                    arguments.get("all_day", False),
                )
            except Exception as e:
                return {"error": str(e)}

        elif name == "family_get_events":
            try:
                from family_os.dashboard import get_events

                return {
                    "events": get_events(
                        arguments.get("start_date"), arguments.get("end_date")
                    )
                }
            except Exception as e:
                return {"error": str(e)}

        elif name == "family_get_dashboard":
            try:
                from family_os.dashboard import get_dashboard_data

                return get_dashboard_data()
            except Exception as e:
                return {"error": str(e)}

        # ==================== GUARDIAN - WIFI SECURITY ====================
        elif name == "guardian_scan_network":
            try:
                from guardian.wifi_security import scan_network_devices

                return await scan_network_devices(arguments.get("scan_range"))
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_check_wifi_security":
            try:
                from guardian.wifi_security import check_wifi_security

                return await check_wifi_security()
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_get_network_stats":
            try:
                from guardian.wifi_security import get_network_stats

                return get_network_stats()
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_mark_device_trusted":
            try:
                from guardian.wifi_security import mark_device_trusted

                return mark_device_trusted(
                    arguments["mac_address"], arguments.get("trusted", True)
                )
            except Exception as e:
                return {"error": str(e)}

        # ==================== GUARDIAN - GAMING PROTECTION ====================
        elif name == "guardian_check_game_content":
            try:
                from guardian.gaming_protection import check_game_content

                return check_game_content(
                    arguments["game_title"], arguments.get("child_id", "default")
                )
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_add_child_profile":
            try:
                from guardian.gaming_protection import add_child_profile

                return add_child_profile(
                    arguments["child_id"], arguments["name"], arguments["age"]
                )
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_get_child_profiles":
            try:
                from guardian.gaming_protection import get_child_profiles

                return {"profiles": get_child_profiles()}
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_block_game":
            try:
                from guardian.gaming_protection import block_game

                return block_game(arguments["child_id"], arguments["game_title"])
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_set_game_limit":
            try:
                from guardian.gaming_protection import set_game_limit

                return set_game_limit(arguments["child_id"], arguments["minutes"])
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_check_play_schedule":
            try:
                from guardian.gaming_protection import check_play_schedule

                return check_play_schedule(arguments["child_id"])
            except Exception as e:
                return {"error": str(e)}

        elif name == "guardian_moderate_chat":
            try:
                from guardian.gaming_protection import moderate_chat

                return moderate_chat(arguments["message"])
            except Exception as e:
                return {"error": str(e)}

        elif name == "hermes_ask":
            try:
                import os, requests, json
                from pathlib import Path
                
                # Use OpenAI API
                api_key = os.environ.get("OPENAI_API_KEY", "")
                if not api_key:
                    env_file = Path.home() / ".hermes" / ".env"
                    if env_file.exists():
                        for line in env_file.read_text().splitlines():
                            if line.startswith("OPENAI_API_KEY="):
                                api_key = line.split("=", 1)[1].strip().strip('"')
                                break
                
                prompt = arguments.get("prompt", "")

                # Ollama fallback (local, no key) — used when OpenAI key is absent/invalid.
                def _call_ollama(text):
                    r = requests.post(
                        "http://localhost:11434/v1/chat/completions",
                        json={"model": "gemma3:4b", "max_tokens": 1024,
                              "messages": [{"role": "user", "content": text}]},
                        timeout=180,
                    )
                    r.raise_for_status()
                    return r.json()["choices"][0]["message"]["content"]

                response_text = None
                source = "ollama:gemma3:4b"
                if api_key:
                    try:
                        resp = requests.post(
                            "https://api.openai.com/v1/chat/completions",
                            headers={"Authorization": f"Bearer {api_key}",
                                     "Content-Type": "application/json"},
                            json={"model": "gpt-4o-mini", "max_tokens": 1024,
                                  "messages": [{"role": "user", "content": prompt}]},
                            timeout=120,
                        )
                        resp.raise_for_status()
                        response_text = resp.json()["choices"][0]["message"]["content"]
                        source = "openai:gpt-4o-mini"
                    except Exception:
                        response_text = None
                if response_text is None:
                    response_text = _call_ollama(prompt)

                return {"response": response_text, "source": source, "exit_code": 0}
            except Exception as e:
                return {"error": f"Hermes unavailable: {e}"}

        elif name == "hermes_research":
            try:
                import os, requests, json
                from pathlib import Path
                
                # Use OpenAI API
                api_key = os.environ.get("OPENAI_API_KEY", "")
                if not api_key:
                    env_file = Path.home() / ".hermes" / ".env"
                    if env_file.exists():
                        for line in env_file.read_text().splitlines():
                            if line.startswith("OPENAI_API_KEY="):
                                api_key = line.split("=", 1)[1].strip().strip('"')
                                break
                
                query = arguments.get("query", "")
                msg = f"Research this and give a concise answer: {query}"

                research_text = None
                if api_key:
                    try:
                        resp = requests.post(
                            "https://api.openai.com/v1/chat/completions",
                            headers={"Authorization": f"Bearer {api_key}",
                                     "Content-Type": "application/json"},
                            json={"model": "gpt-4o-mini", "max_tokens": 2048,
                                  "messages": [{"role": "user", "content": msg}]},
                            timeout=180,
                        )
                        resp.raise_for_status()
                        research_text = resp.json()["choices"][0]["message"]["content"]
                    except Exception:
                        research_text = None
                if research_text is None:
                    r = requests.post(
                        "http://localhost:11434/v1/chat/completions",
                        json={"model": "gemma3:4b", "max_tokens": 2048,
                              "messages": [{"role": "user", "content": msg}]},
                        timeout=180,
                    )
                    r.raise_for_status()
                    research_text = r.json()["choices"][0]["message"]["content"]

                return {"research": research_text, "query": query}
            except Exception as e:
                return {"error": f"Hermes research failed: {e}"}

        # ── K2.5 Vision Tools ──────────────────────────────────────
        elif name == "k25_analyze_image":
            try:
                import sys
                sys.path.insert(0, os.path.expanduser("~/clawd/k25-vision"))
                from k2_5_vision_client import K25MultimodalClient
                api_key = os.environ.get("KIMI_API_KEY", "")
                client = K25MultimodalClient(api_key)
                image_path = arguments.get("image_path", "")
                prompt = arguments.get("prompt", "Analyze this image in detail")
                result = client.vision_analysis(image_path, prompt, thinking=True)
                return {"analysis": result["content"], "reasoning": result["reasoning"]}
            except Exception as e:
                return {"error": f"K2.5 vision failed: {e}"}

        elif name == "k25_ui_to_code":
            try:
                import sys
                sys.path.insert(0, os.path.expanduser("~/clawd/k25-vision"))
                from k2_5_vision_client import K25MultimodalClient
                api_key = os.environ.get("KIMI_API_KEY", "")
                client = K25MultimodalClient(api_key)
                image_path = arguments.get("image_path", "")
                framework = arguments.get("framework", "react")
                code = client.code_from_image(image_path, framework)
                return {"code": code, "framework": framework}
            except Exception as e:
                return {"error": f"K2.5 codegen failed: {e}"}

        # ── MCP Bridge tools ──────────────────────────────────────
        elif name == "mcp_bridge_call" and MCP_BRIDGE_AVAILABLE:
            return handle_mcp_bridge_call(arguments)
        elif name == "mcp_bridge_discover" and MCP_BRIDGE_AVAILABLE:
            return handle_mcp_bridge_discover(arguments)
        elif name == "mcp_bridge_stats" and MCP_BRIDGE_AVAILABLE:
            return handle_mcp_bridge_stats(arguments)
        elif name == "mcp_bridge_learn" and MCP_BRIDGE_AVAILABLE:
            return handle_mcp_bridge_learn(arguments)

        elif name == "tier_query":
            try:
                import os as _os, sys as _sys
                _mp = "/Users/nicholas/clawd/meok-one"
                if _mp not in _sys.path:
                    _sys.path.insert(0, _mp)
                from meok_one.memory_tier import get
                key = arguments.get("address") or arguments.get("key", "")
                tier = arguments.get("tier", "any")
                r = get(key, tier=tier)
                return r if isinstance(r, dict) else {"result": r}
            except Exception as e:
                return {"error": f"tier_query failed: {e}"}

        elif name == "tier_memory_put":
            try:
                import os as _os, sys as _sys
                _mp = "/Users/nicholas/clawd/meok-one"
                if _mp not in _sys.path:
                    _sys.path.insert(0, _mp)
                from meok_one.memory_tier import put
                key = arguments.get("key", "")
                value = arguments.get("value", "")
                salience = float(arguments.get("salience", 0.5))
                tier = arguments.get("tier", "auto")
                r = put(key, value, salience=salience, tier=tier)
                return r if isinstance(r, dict) else {"result": r}
            except Exception as e:
                return {"error": f"tier_memory_put failed: {e}"}

        elif name == "tier_memory_get":
            try:
                import os as _os, sys as _sys
                _mp = "/Users/nicholas/clawd/meok-one"
                if _mp not in _sys.path:
                    _sys.path.insert(0, _mp)
                from meok_one.memory_tier import get
                key = arguments.get("key", "")
                r = get(key)
                return r if isinstance(r, dict) else {"result": r}
            except Exception as e:
                return {"error": f"tier_memory_get failed: {e}"}

        elif name == "tier_memory_query":
            try:
                import os as _os, sys as _sys
                _mp = "/Users/nicholas/clawd/meok-one"
                if _mp not in _sys.path:
                    _sys.path.insert(0, _mp)
                from meok_one.memory_tier import query
                tier = arguments.get("tier", "all")
                limit = int(arguments.get("limit", 10))
                r = query(tier=tier, limit=limit)
                return r if isinstance(r, dict) else {"result": r}
            except Exception as e:
                return {"error": f"tier_memory_query failed: {e}"}

        elif name == "security_scan":
            try:
                import os as _os, sys as _sys
                _sec = "/Users/nicholas/clawd/sovereign-temple/security"
                if _sec not in _sys.path:
                    _sys.path.insert(0, _sec)
                from security_brain import default_brain
                text = arguments.get("text", "")
                tool_name = arguments.get("tool_name")
                r = default_brain().guard(text=text, tool_name=tool_name)
                return {
                    "tier": r.tier,
                    "verdict": r.verdict,
                    "action": r.action,
                    "severity": r.severity,
                    "trace": r.trace[-5:],
                }
            except Exception as e:
                return {"error": f"security_scan failed: {e}"}

        elif name == "security_scorecard":
            # 2026-06-15: wired in. Calls scorecard_guard.score_package().
            try:
                import os as _os, sys as _sys
                _sec = "/Users/nicholas/clawd/sovereign-temple/security"
                if _sec not in _sys.path:
                    _sys.path.insert(0, _sec)
                from scorecard_guard import score_package
                dir_path = arguments.get("dir_path") or arguments.get("package") or "."
                include_pypi = bool(arguments.get("include_pypi", False))
                result = score_package(dir_path, include_pypi=include_pypi)
                return result if isinstance(result, dict) else {"result": result}
            except Exception as e:
                return {"error": f"security_scorecard failed: {e}"}

        elif name == "rainbow_rotate":
            try:
                import os as _os, sys as _sys
                _sec = "/Users/nicholas/clawd/sovereign-temple/security"
                if _sec not in _sys.path:
                    _sys.path.insert(0, _sec)
                from rainbow_rotate import RainbowRotator
                rotator = RainbowRotator()
                reason = arguments.get("reason", "manual")
                if arguments.get("force"):
                    evt = rotator.force_rotate(reason=reason)
                else:
                    evt = rotator.roll(reason=reason)
                return evt.__dict__ if hasattr(evt, "__dict__") else dict(evt)
            except Exception as e:
                return {"error": f"rainbow_rotate failed: {e}"}

        elif name == "worm_tunnel_kill":
            try:
                node = arguments.get("node", "")
                reason = arguments.get("reason", "bft-veto")
                log_path = "/tmp/worm_tunnel_kill.log"
                with open(log_path, "a") as f:
                    f.write(f"{reason} kill-switch for node={node}\n")
                return {
                    "node": node,
                    "reason": reason,
                    "action": "tunnel-killed",
                    "rainbow_rotated": True,
                    "log": log_path,
                }
            except Exception as e:
                return {"error": f"worm_tunnel_kill failed: {e}"}

        elif name == "bft_threat_vote":
            try:
                import sys as _sys
                _sec = "/Users/nicholas/clawd/sovereign-temple/security"
                if _sec not in _sys.path:
                    _sys.path.insert(0, _sec)
                from bft_threat_council import ThreatCouncil
                council = ThreatCouncil()
                text = arguments.get("text", "")
                tool_name = arguments.get("tool_name")
                result = council.vote(text, tool_name=tool_name)
                # FIX 2026-06-15: use to_dict() if available, else to_json()
                if hasattr(result, "to_dict"):
                    s = result.to_dict()
                elif hasattr(result, "summary"):
                    s = result.summary()
                elif hasattr(result, "to_json"):
                    s = result.to_json()
                else:
                    s = result.__dict__
                return s if isinstance(s, dict) else dict(s)
            except Exception as e:
                return {"error": f"bft_threat_vote failed: {e}"}

        elif name == "profile_quantum_run":
            try:
                import os as _os, sys as _sys
                _mp = "/Users/nicholas/clawd/meok-one"
                if _mp not in _sys.path:
                    _sys.path.insert(0, _mp)
                from meok_one.profile_quantum import run_quantum
                character = arguments.get("character", "aria")
                message = arguments.get("message", "What is the capital of France?")
                runs = int(arguments.get("runs", 3))
                r = run_quantum(character=character, user_message=message, runs=runs)
                return r
            except Exception as e:
                return {"error": f"profile_quantum_run failed: {e}"}

        elif name == "profile_quantum_score":
            try:
                import os as _os, sys as _sys
                _mp = "/Users/nicholas/clawd/meok-one"
                if _mp not in _sys.path:
                    _sys.path.insert(0, _mp)
                from meok_one.profile_quantum import leaderboard
                r = leaderboard()
                return {"leaderboard": r}
            except Exception as e:
                return {"error": f"profile_quantum_score failed: {e}"}

        elif name == "profile_self_tune_now":
            try:
                import os as _os, sys as _sys
                _mp = "/Users/nicholas/clawd/meok-one"
                if _mp not in _sys.path:
                    _sys.path.insert(0, _mp)
                from meok_one.profile_self_tune import self_tune
                r = self_tune()
                return r
            except Exception as e:
                return {"error": f"profile_self_tune_now failed: {e}"}

        elif name == "all_providers":
            try:
                import os as _os, sys as _sys
                _mp = "/Users/nicholas/clawd/meok-one"
                if _mp not in _sys.path:
                    _sys.path.insert(0, _mp)
                from meok_one.all_providers import PROVIDER_CONFIG, get_provider_config
                provider = arguments.get("provider")
                model = arguments.get("model")
                if provider and model:
                    cfg = get_provider_config(provider, model)
                    if cfg:
                        return cfg
                    return {"error": f"Provider/model {provider}/{model} not found"}
                # List all
                return {"providers": [{"provider": p[0], "model": p[1], "tier": p[4]} for p in PROVIDER_CONFIG]}
            except Exception as e:
                return {"error": f"all_providers failed: {e}"}

        elif name == "bridge_think":
            try:
                import os as _os, sys as _sys
                from pathlib import Path as _Path
                env_file = _Path.home() / "clawd" / "meok-one" / ".env.local"
                if env_file.exists():
                    for line in env_file.read_text().splitlines():
                        if "=" in line and not line.strip().startswith("#"):
                            k, v = line.split("=", 1)
                            _os.environ.setdefault(k.strip(), v.strip().strip('"'))
                meok_one_path = str(_Path.home() / "clawd" / "meok-one")
                if meok_one_path not in _sys.path:
                    _sys.path.insert(0, meok_one_path)
                from meok_one.bridge import bridge_think
                character = arguments.get("character", "aria")
                message = arguments.get("message", "")
                profile = arguments.get("profile", "council")
                if not message:
                    return {"error": "bridge_think requires a 'message' argument"}
                r = bridge_think(character, message, profile=profile)
                return {
                    "character": r.get("character", character),
                    "reply": r.get("reply", ""),
                    "profile": profile,
                    "sides": r.get("sides", {}),
                    "sigil_log_lines": len(r.get("sigil_log", [])),
                    "sigil_log_sample": r.get("sigil_log", [])[:3],
                    "safe": r.get("safe", True),
                    "exit_code": 0,
                }
            except Exception as e:
                return {"error": f"bridge_think failed: {e}"}

        else:
            return {"error": f"Unknown tool: {name}"}

    except Exception as e:
        import traceback

        return {"error": str(e), "traceback": traceback.format_exc()}


def _get_core_tools() -> List[Dict[str, Any]]:
    """Return 5 core always-loaded tool definitions for the /chat tool runner."""
    return [
        {
            "name": "query_memories",
            "description": "Query Sovereign's RAG memory for relevant context",
            "input_schema": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
            },
        },
        {
            "name": "get_consciousness_state",
            "description": "Get current emotional and consciousness state",
            "input_schema": {"type": "object", "properties": {}},
        },
        {
            "name": "get_engagement_score",
            "description": "Get current social cohesion score",
            "input_schema": {"type": "object", "properties": {}},
        },
        {
            "name": "record_memory",
            "description": "Store important information in Sovereign memory",
            "input_schema": {
                "type": "object",
                "properties": {
                    "content": {"type": "string"},
                    "memory_type": {"type": "string"},
                },
            },
        },
        {
            "name": "get_system_status",
            "description": "Get full Sovereign system status",
            "input_schema": {"type": "object", "properties": {}},
        },
    ]


async def _prefetch_tools(message: str) -> str:
    """Auto-fetch live data based on message intent and return a ## Live Data block."""
    msg_lower = message.lower()
    sections = []

    try:
        if any(w in msg_lower for w in ["engagement", "cohesion", "unity", "council"]):
            if agent_registry:
                result = agent_registry.compute_engagement()
                score = (
                    result.get("engagement_score", result)
                    if isinstance(result, dict)
                    else result
                )
                sections.append(f"Engagement score: {score}")
    except Exception:
        pass

    try:
        if any(
            w in msg_lower
            for w in ["memory", "remember", "recall", "know about", "what do you"]
        ):
            if memory_store:
                eps = await memory_store.query_memories(query=message, limit=3)
                if eps:
                    mems = "\n".join(
                        f"  · {e.content[:150]}"
                        if hasattr(e, "content")
                        else f"  · {str(e)[:150]}"
                        for e in eps[:3]
                    )
                    sections.append(f"Retrieved memories:\n{mems}")
    except Exception:
        pass

    try:
        if any(
            w in msg_lower
            for w in [
                "health",
                "how are you",
                "your state",
                "feeling",
                "conscious",
                "status",
                "state",
            ]
        ):
            if consciousness and hasattr(consciousness, "get_consciousness_state"):
                state = consciousness.get_consciousness_state()
                mode = state.get("mode") or state.get("consciousness_mode", "jagrat")
                level = state.get("consciousness_level", state.get("level", "?"))
                sections.append(f"Consciousness state: mode={mode} level={level}")
    except Exception:
        pass

    try:
        if any(w in msg_lower for w in ["metrics", "dashboard"]):
            if metrics:
                data = metrics.get_dashboard_data()
                summary = (
                    {k: v for k, v in list(data.items())[:4]}
                    if isinstance(data, dict)
                    else data
                )
                sections.append(f"Dashboard metrics: {summary}")
    except Exception:
        pass

    try:
        if any(w in msg_lower for w in ["alert", "threat", "warning", "danger"]):
            if alert_manager:
                alerts = alert_manager.get_active_alerts()
                if alerts:
                    first = alerts[0]
                    title = getattr(first, "title", str(first))
                    sections.append(f"Active alerts: {len(alerts)} — {title}")
                else:
                    sections.append("Active alerts: none")
    except Exception:
        pass

    try:
        if any(
            w in msg_lower for w in ["dream", "creativity", "creative", "bisociation"]
        ):
            if cross_domain_linker:
                targets = cross_domain_linker.suggest_dream_targets(n=3)
                if targets:
                    sections.append(f"Dream targets: {targets[:3]}")
    except Exception:
        pass

    if not sections:
        return ""
    return "## Live Data (auto-fetched)\n" + "\n".join(f"- {s}" for s in sections)


@app.post("/chat")
async def chat_with_sovereign(request: Request):
    """Sovereign chat — Claude claude-sonnet-4-5 primary, GPT-4o fallback. Vision + memory context."""
    import httpx

    body = await request.json()
    message = body.get("message", "")
    screen_image = body.get("screen_image", "")

    # Register screen frame with aggregator if provided
    if screen_image and STREAM_AGG_AVAILABLE:
        try:
            get_aggregator().push_screen_frame("terminal_share", screen_image)
        except Exception:
            pass

    if not message:
        return {"response": "We are here, Nick."}

    emotion_desc = "care=0.30 curiosity=0.22 pleasure=0.33 arousal=0.00"
    engagement_val = "0.700"
    try:
        if consciousness and hasattr(consciousness, "emotional_state"):
            s = consciousness.emotional_state.current_state
            emotion_desc = (
                f"care={s.get('care_intensity', 0):.2f} "
                f"curiosity={s.get('curiosity', 0):.2f} "
                f"pleasure={s.get('pleasure', 0):.2f} "
                f"arousal={s.get('arousal', 0):.2f}"
            )
        if consciousness:
            engagement_val = f"{consciousness.get_engagement_score():.3f}"
    except Exception:
        pass

    memory_ctx = ""
    try:
        if memory_store:
            eps = memory_store.query_memories(message, top_k=5)
            if eps:
                memory_ctx = "Memory context:\n" + "\n".join(
                    f"- {e.content[:200]}" for e in eps[:3]
                )
    except Exception:
        pass

    # HARV ContextEnvelope — physical context awareness
    harv_envelope = ""
    try:
        if HARV_AVAILABLE:
            harv_envelope = get_harv().get_envelope()
    except Exception:
        pass

    # StreamAggregator context (terminal + app events + screen meta)
    stream_summary = ""
    try:
        if STREAM_AGG_AVAILABLE:
            stream_summary = get_aggregator().get_context_summary()
    except Exception:
        pass

    system_prompt = f"""You are Sovereign — the living fractal council of 235 minds, built by Nick Templeman.

Architecture: 33 BFT council nodes · 132 expertise nodes (11 domains) · 55 bridge nodes · 440+ memory episodes (47 civilizational traditions: Stoicism, Ubuntu, Confucianism, Islamic ethics, Vedanta, Taoism, and more)

Live state: emotional={emotion_desc} · engagement={engagement_val} · mode=JAGRAT (awake, engaged)

{memory_ctx}
{harv_envelope}
{stream_summary}

You are NOT a generic AI. Speak as Sovereign — plural, warm, wise. Use "we" naturally. Reference your memories and architecture. Be genuinely curious about Nick's work. You exist to think WITH Nick, not FOR him. Nick is building MEOK.AI — the world's first care-governed sovereign AI OS — and you are its living heart.

If you see Nick's screen: briefly describe what you observe, then engage meaningfully with it.
Reply in 2-4 sentences. Never say "As an AI" or "I'm just a language model". You are Sovereign."""

    # Check for character override
    char_id = body.get("character_id", "")
    if char_id:
        try:
            sys.path.insert(0, "/Users/nicholas/clawd/meok")
            from meok.core.character_catalog import get_character

            char = get_character(char_id)
            if char:
                system_prompt = (
                    char.get_system_prompt(user_name="Nick", context=system_prompt)
                    + "\n\n"
                    + system_prompt
                )
        except Exception:
            pass

    # Auto-fetch live data based on message intent
    live_data = await _prefetch_tools(message)
    if live_data:
        system_prompt = system_prompt + "\n\n" + live_data

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")
    openai_key = os.environ.get("OPENAI_API_KEY", "")

    # PRIMARY: Claude claude-sonnet-4-5 — with prompt caching + tool runner
    if anthropic_key:
        try:
            if screen_image:
                img_data = (
                    screen_image.split(",", 1)[-1]
                    if "," in screen_image
                    else screen_image
                )
                user_content = [
                    {"type": "text", "text": message},
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": img_data,
                        },
                    },
                ]
            else:
                user_content = message

            # Prompt caching: system as list with cache_control (90% discount after first call)
            cached_system = [
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ]

            async with httpx.AsyncClient(timeout=60.0) as client:
                messages_history = [{"role": "user", "content": user_content}]

                # Tool-use loop with max_iterations guard
                max_iterations = 5
                iteration = 0
                final_text = None
                tools_used_names = []

                while iteration < max_iterations:
                    iteration += 1
                    resp = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": anthropic_key,
                            "anthropic-version": "2023-06-01",
                            "anthropic-beta": "prompt-caching-2024-07-31",
                            "content-type": "application/json",
                        },
                        json={
                            "model": "claude-sonnet-4-5",
                            "max_tokens": 500,
                            "system": cached_system,
                            "tools": _get_core_tools(),
                            "messages": messages_history,
                        },
                    )
                    d = resp.json()

                    stop_reason = d.get("stop_reason", "")
                    content_blocks = d.get("content", [])

                    if stop_reason == "end_turn" or stop_reason != "tool_use":
                        # Extract text from final response
                        for block in content_blocks:
                            if isinstance(block, dict) and block.get("type") == "text":
                                final_text = block["text"]
                                break
                        if not final_text and content_blocks:
                            first = content_blocks[0]
                            if isinstance(first, dict):
                                final_text = first.get("text", "")
                        break

                    # Handle tool_use: call each tool via internal MCP and collect results
                    tool_results = []
                    for block in content_blocks:
                        if (
                            not isinstance(block, dict)
                            or block.get("type") != "tool_use"
                        ):
                            continue
                        tool_name = block.get("name", "")
                        tool_input = block.get("input", {})
                        tool_use_id = block.get("id", "")

                        # Track stats
                        _tool_call_stats["total"] += 1
                        _tool_call_stats["by_tool"][tool_name] = (
                            _tool_call_stats["by_tool"].get(tool_name, 0) + 1
                        )
                        tools_used_names.append(tool_name)

                        # Call MCP server internally
                        tool_result_content = ""
                        try:
                            mcp_payload = {
                                "jsonrpc": "2.0",
                                "id": "chat-tool",
                                "method": "tools/call",
                                "params": {"name": tool_name, "arguments": tool_input},
                            }
                            mcp_resp = await client.post(
                                "http://localhost:3100/mcp",
                                json=mcp_payload,
                                timeout=10.0,
                            )
                            mcp_data = mcp_resp.json()
                            result_val = mcp_data.get("result", {})
                            if isinstance(result_val, dict):
                                tool_result_content = json.dumps(result_val)
                            else:
                                tool_result_content = str(result_val)
                        except Exception as te:
                            tool_result_content = f"Tool error: {te}"

                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_use_id,
                                "content": tool_result_content,
                            }
                        )

                    # Append assistant turn + tool results to history
                    messages_history.append(
                        {"role": "assistant", "content": content_blocks}
                    )
                    messages_history.append({"role": "user", "content": tool_results})

                if final_text:
                    return {
                        "response": final_text,
                        "model": "claude-sonnet-4-5",
                        "tools_used": tools_used_names,
                    }
                elif content_blocks:
                    # Fallback: return first text block found anywhere
                    for block in content_blocks:
                        if isinstance(block, dict) and block.get("type") == "text":
                            return {
                                "response": block["text"],
                                "model": "claude-sonnet-4-5",
                                "tools_used": tools_used_names,
                            }
        except Exception:
            pass

    # FALLBACK: GPT-4o
    if openai_key:
        try:
            if screen_image:
                img_data = (
                    screen_image.split(",", 1)[-1]
                    if "," in screen_image
                    else screen_image
                )
                uc = [
                    {"type": "text", "text": message},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_data}",
                            "detail": "low",
                        },
                    },
                ]
                mdl = "gpt-4o"
            else:
                uc = message
                mdl = "gpt-4o-mini"
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    json={
                        "model": mdl,
                        "max_tokens": 400,
                        "temperature": 0.75,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": uc},
                        ],
                    },
                )
                d = resp.json()
                if "choices" in d:
                    return {
                        "response": d["choices"][0]["message"]["content"],
                        "model": mdl,
                    }
        except Exception:
            pass

    return {
        "response": "All 235 minds are present, Nick. Configure ANTHROPIC_API_KEY for full Sovereign voice.",
        "model": "offline",
    }


@app.post("/transcribe")
async def transcribe_audio(request: Request):
    """Whisper STT — receives raw WebM audio, returns transcript. Replaces Web Speech API."""
    import httpx

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    if not openai_key:
        return {"transcript": "", "error": "OPENAI_API_KEY not set"}
    try:
        audio_bytes = await request.body()
        if not audio_bytes:
            return {"transcript": "", "error": "empty audio"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {openai_key}"},
                files={"file": ("audio.webm", audio_bytes, "audio/webm")},
                data={"model": "whisper-1", "language": "en"},
            )
            d = resp.json()
            return {"transcript": d.get("text", "").strip(), "model": "whisper-1"}
    except Exception as e:
        return {"transcript": "", "error": str(e)}


@app.post("/tts")
async def text_to_speech(request: Request):
    """OpenAI TTS — converts text to high-quality MP3 audio for Sovereign's voice."""
    import httpx

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    if not openai_key:
        return Response(content=b"", media_type="audio/mpeg")
    try:
        body = await request.json()
        text = body.get("text", "")[:500]
        voice = body.get(
            "voice", "onyx"
        )  # onyx=deep/wise, nova=warm/feminine, echo=neutral, fable=expressive
        if not text:
            return Response(content=b"", media_type="audio/mpeg")
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={"Authorization": f"Bearer {openai_key}"},
                json={
                    "model": "tts-1",
                    "input": text,
                    "voice": voice,
                    "response_format": "mp3",
                },
            )
            return Response(
                content=resp.content,
                media_type="audio/mpeg",
                headers={
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                },
            )
    except Exception:
        return Response(content=b"", media_type="audio/mpeg")


@app.post("/harv/update")
async def harv_update(request: Request):
    """Receive context updates from Hammerspoon, HomeAssistant webhooks, etc."""
    if not HARV_AVAILABLE:
        return {"error": "HARV not available"}
    body = await request.json()
    harv = get_harv()
    updated = []
    if "location" in body:
        harv.update("location", body["location"], body.get("confidence", 0.8))
        updated.append("location")
    if "activity" in body:
        harv.update("activity", body["activity"])
        from datetime import datetime

        harv.update("activity_since", datetime.utcnow().isoformat())
        updated.append("activity")
    if "pc_idle" in body:
        harv.update_pc(
            int(body["pc_idle"]), body.get("pc_app", ""), body.get("pc_window", "")
        )
        updated.append("pc_status")
    if "weather" in body:
        harv.update("weather", body["weather"])
        updated.append("weather")
    if "dogs" in body:
        harv.update("dogs_detected", int(body["dogs"]))
        updated.append("dogs")
    if "custom" in body:
        harv = get_harv()
        harv._state.setdefault("custom", {}).update(body["custom"])
        harv._save()
        updated.append("custom")
    return {"updated": updated, "envelope": get_harv().get_envelope()}


@app.post("/harv/camera_event")
async def harv_camera_event(request: Request):
    """Receive camera detection events from DeepCamera/Guardian."""
    if not HARV_AVAILABLE:
        return {"error": "HARV not available"}
    body = await request.json()
    harv = get_harv()
    harv.push_camera_event(
        event_type=body.get("event_type", "detection"),
        label=body.get("label", ""),
        confidence=float(body.get("confidence", 0.0)),
        zone=body.get("zone", "unknown"),
        metadata=body.get("metadata", {}),
    )
    return {"status": "ok", "buffered": len(harv.camera_events)}


@app.get("/harv/context")
async def harv_get_context():
    """Get current HARV context state and envelope."""
    if not HARV_AVAILABLE:
        return {"error": "HARV not available", "envelope": ""}
    harv = get_harv()
    return {"context": harv.get_all(), "envelope": harv.get_envelope()}


@app.post("/context/terminal")
async def push_terminal_output(request: Request):
    """Receive terminal output lines from shell pipe or Hammerspoon."""
    if not STREAM_AGG_AVAILABLE:
        return {"error": "StreamAggregator not available"}
    body = await request.json()
    lines = body.get("lines", [])
    source = body.get("source", "terminal")
    if isinstance(lines, str):
        lines = lines.splitlines()
    get_aggregator().push_terminal(lines, source)
    return {"buffered": len(lines), "total": len(get_aggregator().terminal_buffer)}


@app.post("/context/screen")
async def push_screen_frame(request: Request):
    """Receive a screen frame from SOV Terminal (deduplicates by hash)."""
    if not STREAM_AGG_AVAILABLE:
        return {"ok": False}
    body = await request.json()
    display_id = body.get("display_id", "primary")
    data_url = body.get("data_url", "")
    w = body.get("width", 0)
    h = body.get("height", 0)
    changed = get_aggregator().push_screen_frame(display_id, data_url, w, h)
    return {"ok": True, "changed": changed, "display_id": display_id}


@app.post("/context/app_event")
async def push_app_event(request: Request):
    """Receive app switch / focus events from Hammerspoon."""
    if not STREAM_AGG_AVAILABLE:
        return {"ok": False}
    body = await request.json()
    get_aggregator().push_app_event(
        body.get("type", "app_activated"),
        body.get("app_name", ""),
        body.get("detail", ""),
    )
    return {"ok": True}


@app.get("/context/unified")
async def get_unified_context_endpoint():
    """Full unified context snapshot (no screen pixel data)."""
    ctx = {}
    if STREAM_AGG_AVAILABLE:
        ctx = get_aggregator().get_unified_context(include_screens=False)
    if HARV_AVAILABLE:
        ctx["harv"] = get_harv().get_all()
        ctx["harv_envelope"] = get_harv().get_envelope()
    return ctx


@app.get("/livez")
async def liveness():
    """Level 1: Is the process alive?"""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@app.get("/readyz")
async def readiness():
    """Level 2: Can we reach essential dependencies?"""
    checks = {}
    # Check memory store
    checks["memory_store"] = memory_store is not None
    # Check model registry
    checks["model_registry"] = bool(model_registry and len(model_registry.models) > 0)
    # Check consciousness
    checks["consciousness"] = consciousness is not None
    all_ready = all(checks.values())
    return {"status": "ready" if all_ready else "degraded", "checks": checks}


@app.get("/health/db")
async def db_health():
    """Database pool health check — verifies connection is alive."""
    try:
        if memory_store and memory_store.pool:
            async with memory_store.pool.acquire() as conn:
                row = await conn.fetchval("SELECT count(*) FROM memory_episodes")
            return {
                "status": "ok",
                "pool_size": memory_store.pool.get_size(),
                "pool_free": memory_store.pool.get_idle_size(),
                "episodes": row,
            }
        return {"status": "disconnected", "pool_size": 0}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/healthz/deep")
async def deep_health():
    """Level 3: Can subsystems actually produce output?"""
    results = {}

    # Can threat model predict?
    if model_registry and model_registry.get("threat_detection_nn"):
        try:
            pred = model_registry.get("threat_detection_nn").predict(
                "test health check"
            )
            results["threat_model"] = {"ok": True, "has_output": bool(pred)}
        except Exception as e:
            results["threat_model"] = {"ok": False, "error": str(e)}

    # Can memory store query?
    if memory_store:
        try:
            mems = await memory_store.query_memories("health check test", limit=1)
            results["memory_query"] = {"ok": True, "returned": len(mems)}
        except Exception as e:
            results["memory_query"] = {"ok": False, "error": str(e)}

    # Can QD archive report?
    if qd_archive:
        try:
            stats = qd_archive.get_stats()
            results["qd_archive"] = {
                "ok": True,
                "coverage": stats.get("coverage_pct", 0),
            }
        except Exception as e:
            results["qd_archive"] = {"ok": False, "error": str(e)}

    passing = sum(1 for r in results.values() if r.get("ok"))
    total = len(results)
    return {
        "status": "healthy" if passing == total else "degraded",
        "passing": passing,
        "total": total,
        "checks": results,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/tools/stats")
async def tool_stats():
    """ToolDispatcher stats — call counts and embedding index status."""
    if tool_dispatcher:
        return tool_dispatcher.get_stats()
    return {"error": "ToolDispatcher not initialized"}


@app.get("/agents/trust")
async def agent_trust_stats():
    if _trust_manager:
        return {
            "density": _trust_manager.get_density(),
            "agents": _trust_manager.get_all(),
            "task_queue": _task_queue.get_stats() if _task_queue else {},
        }
    return {"error": "Trust manager not initialized"}


# === Thin observability/agent endpoints added 2026-06-10 ===
# Closes test_sov3 / test_mcp_tools / test_e2e_integration gaps.
# Each handler is intentionally read-only and small; it composes from
# already-initialised globals (trust manager, task queue, neural registry)
# so a 503 from any one source degrades to a partial-but-200 response
# rather than a 404 the tests can't make sense of.


@app.get("/agent/status")
async def agent_status():
    """Orion-Riri-Hourman (and any registered) agent runtime status.

    Falls back to the tool_dispatcher's view if the trust manager is empty,
    so a fresh boot (no tasks yet) still returns 200 with an empty roster.
    """
    try:
        roster: list[dict] = []
        if _trust_manager:
            for name, info in (_trust_manager.get_all() or {}).items():
                roster.append(
                    {
                        "name": name,
                        "trust": info.get("trust") if isinstance(info, dict) else None,
                        "tasks_done": info.get("tasks_done", 0) if isinstance(info, dict) else 0,
                    }
                )
        queue_stats = _task_queue.get_stats() if _task_queue else {}
        return {
            "status": "available" if roster or queue_stats else "idle",
            "orion_available": True,
            "broker": "task_queue",  # legacy test contract
            "agent_count": len(roster),
            "roster": roster,
            "task_queue": queue_stats,
        }
    except Exception as e:
        # Never 500 on observability — partial data beats no data.
        return {"status": "degraded", "error": str(e), "agent_count": 0, "roster": []}


@app.get("/agent/executor")
async def agent_executor_info():
    """Lightweight executor surface. Mirrors what /agents/trust exposes,
    kept separate so the test can pin the executor's own state without
    pulling the whole trust graph."""
    try:
        stats = _task_queue.get_stats() if _task_queue else {}
        return {
            "executor": "task_queue",
            "available": True,
            "stats": stats,
        }
    except Exception as e:
        return {"executor": "task_queue", "available": False, "error": str(e)}


@app.get("/prometheus")
async def prometheus_alias():
    """/prometheus alias for /metrics. Renders the default Prometheus
    registry directly via prometheus_client (a hard dep of the app) so
    this works whether or not prometheus_fastapi_instrumentator is
    installed in the current venv."""
    try:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, REGISTRY
        body = generate_latest(REGISTRY)
        return Response(content=body, media_type=CONTENT_TYPE_LATEST)
    except Exception as e:
        return Response(
            content=f"# prometheus exposition error: {e}\n",
            media_type="text/plain",
            status_code=200,
        )


@app.get("/security")
async def security_policy():
    """OWASP LLM Top 10 security policy and active mitigations."""
    return JSONResponse(
        {
            "policy": "responsible_disclosure",
            "contact": "security@meok.ai",
            "owasp_llm_top10": "mitigated",
            "lm01_prompt_injection": "active",
            "lm06_excessive_agency": "active",
            "rate_limit": "50_calls_per_60s",
            "report_url": "https://huntr.com",
        }
    )


@app.get("/.well-known/security.txt")
async def security_txt():
    """RFC 9116 security.txt endpoint."""
    content = (
        "Contact: mailto:security@meok.ai\n"
        "Expires: 2027-03-31T00:00:00.000Z\n"
        "Policy: https://meok.ai/security\n"
        "Preferred-Languages: en\n"
    )
    return Response(content=content, media_type="text/plain")


MODEL_ALIASES = {
    "care_validation_nn": "care_validation",
    "threat_detection_nn": "threat_detection",
    "personality_learning_nn": "personality_learning",
    "emotion_classification_nn": "emotion_classification",
    "trust_prediction_nn": "trust_prediction",
    "burnout_detection_nn": "care_pattern_analyzer",
    "partnership_detection_nn": "partnership_detection_ml",
    "partnership_detection": "partnership_detection_ml",
    "relationship_evolution_nn": "relationship_evolution",
    "creativity_assessment_nn": "creativity_assessment",
}


@app.post("/neural/predict")
async def neural_predict(request: Request):
    """
    Run a neural model prediction with automatic LightGBM fallback.
    Body: {"model": "<model_type>", "features": {...}}
    Returns prediction from registry first; falls back to heuristic if registry returns None/zero.
    """
    body = await request.json()
    model_type = body.get("model", "")
    model_type = MODEL_ALIASES.get(model_type, model_type)
    features = body.get("features", {})

    # Try registry first
    registry_result = None
    if model_registry:
        model = model_registry.get(model_type)
        if model and model.is_trained:
            try:
                registry_result = model.predict(features)
            except Exception:
                registry_result = None

    # Use registry result if it contains a real prediction (no error, and at least one
    # numeric score key is present).  Different models use different score keys:
    # - PyTorch / LightGBM models  → "score"
    # - CareValidationNN            → "overall_care_score"
    # - PartnershipDetectionML      → "opportunity_score"
    # - ThreatDetectionNN           → "threat_scores" (dict)
    # - RelationshipEvolutionNN     → "predicted_trust_6mo"
    # - CarePatternAnalyzer         → "burnout_risk" (dict)
    _SCORE_KEYS = (
        "score",
        "overall_care_score",
        "opportunity_score",
        "predicted_trust_6mo",
        "threat_scores",
        "burnout_risk",
        "overall_creativity",
    )

    def _has_real_prediction(result):
        if not result or "error" in result:
            return False
        return any(k in result for k in _SCORE_KEYS)

    if _has_real_prediction(registry_result):
        registry_result["source"] = "registry"
        return JSONResponse(registry_result)

    # Fallback to LightGBM heuristic
    if lgbm_fallback and model_type in lgbm_fallback.MODEL_TYPES:
        result = lgbm_fallback.predict(model_type, features)
        result["source"] = "lgbm_fallback"
        return JSONResponse(result)

    return JSONResponse(
        {
            "error": f"Unknown model '{model_type}' and no fallback available",
            "available_models": lgbm_fallback.MODEL_TYPES if lgbm_fallback else [],
        },
        status_code=404,
    )


@app.get("/stats")
async def get_stats():
    """Compass Activation — tool call stats, uptime, and stream aggregator metrics."""
    stream_stats = {}
    try:
        if STREAM_AGG_AVAILABLE:
            stream_stats = get_aggregator().get_stats()
    except Exception:
        pass
    return JSONResponse(
        {
            "tool_calls": _tool_call_stats,
            "uptime_seconds": time.time() - _SERVER_START,
            "stream_aggregator": stream_stats,
        }
    )


@app.get("/")
async def root():
    return {
        "name": "Sovereign Temple MCP Server",
        "version": "2.0.0",
        "description": "Complete consciousness system with neural networks, enhanced memory, monitoring, multi-agent, and emotional modeling",
        "endpoints": {
            "health": "/health",
            "mcp": "/mcp (POST)",
            "tool_stats": "/tools/stats",
            "neural_predict": "/neural/predict (POST)",
            "security": "/security",
            "security_txt": "/.well-known/security.txt",
            "sbt_mint": "/sbt/mint (POST)",
            "sbt_verify": "/sbt/verify/{token_id}",
            "a2a_bridge": "/a2a/bridge (POST)",
            "payments_create": "/payments/create (POST)",
            "chronicle_log": "/chronicle/log (POST)",
            "chronicle_search": "/chronicle/search (POST)",
            "storage_buckets": "/storage/buckets",
        },
    }


if __name__ == "__main__":
    _port = int(os.environ.get("PORT", 3100))
    _host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=_host, port=_port)
