#!/usr/bin/env python3
"""
meek-hybrid-roadmap-mcp — server.py

The 21st MEOK MCP. The hybrid roadmap orchestrator:
- MOD existing open source (12 paths, 25 candidate repos)
- BUILD only the unique differentiators (5 paths)
- 20-week timeline for the sovereign capillary humanoid

Tools (5):
  1. mod_or_build_decision      — decide MOD vs BUILD for a component
  2. estimate_mod_time           — estimate the time saved by MODing
  3. list_mod_targets            — list the 25 candidate MOD repos
  4. list_build_targets          — list the 5 BUILD-from-scratch items
  5. generate_timeline           — generate the 20-week MOD-first timeline
"""
from __future__ import annotations

import math
import re
import json
import logging
from datetime import datetime, timezone

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("meek_hybrid_roadmap_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


# The 12 MOD paths
MOD_PATHS = {
    "physics_sim_mujoco": {"repo": "google-deepmind/mujoco", "license": "Apache 2.0", "weeks": 4, "lines_of_code": 500},
    "physics_sim_drake": {"repo": "RobotLocomotion/drake", "license": "BSD", "weeks": 4, "lines_of_code": 800},
    "ros2_capillary_msgs": {"repo": "ros2/ros2", "license": "Apache 2.0", "weeks": 6, "lines_of_code": 200},
    "moveit2_capillary_planning": {"repo": "moveit/moveit2", "license": "BSD", "weeks": 4, "lines_of_code": 1500},
    "pinocchio_dynamics": {"repo": "stack-of-tasks/pinocchio", "license": "BSD", "weeks": 2, "lines_of_code": 400},
    "dm_control_rl": {"repo": "google-deepmind/dm_control", "license": "Apache 2.0", "weeks": 4, "lines_of_code": 600},
    "libsodium_sigil": {"repo": "jedisct1/libsodium", "license": "ISC", "weeks": 1, "lines_of_code": 300},
    "tendermint_bft": {"repo": "cometbft/cometbft", "license": "Apache 2.0", "weeks": 6, "lines_of_code": 100},
    "mcp_sdk": {"repo": "modelcontextprotocol/python-sdk", "license": "MIT", "weeks": 1, "lines_of_code": 200},
    "whisper_piper": {"repo": "openai/whisper + rhasspy/piper", "license": "MIT", "weeks": 2, "lines_of_code": 200},
    "yolov8_orbslam3": {"repo": "ultralytics/ultralytics + UZ-SLAMLab/ORB_SLAM3", "license": "AGPL-3.0", "weeks": 4, "lines_of_code": 500},
    "pytorch_transformers": {"repo": "pytorch/pytorch + huggingface/transformers", "license": "BSD + Apache 2.0", "weeks": 2, "lines_of_code": 300},
}

# The 5 BUILD-from-scratch
BUILD_TARGETS = {
    "mcmb_muscle_orb": {"weeks": 6, "cost_gbp": 43, "description": "25mm PVA/PDMS bladder + 10000 capillaries + Pt electrodes"},
    "spine_bus": {"weeks": 4, "cost_gbp": 1000, "description": "CFRP + copper with 4 channels (coolant + power + EO + SIGIL)"},
    "meok_os_body_controller": {"weeks": 8, "cost_gbp": 0, "description": "200 muscle groups + IK + spine bus + energy budget"},
    "sigil_signing_infra": {"weeks": 4, "cost_gbp": 0, "description": "Ed25519 SIGIL chain for every muscle command + sensor reading"},
    "skywater_chip_bft_council": {"weeks": 0, "cost_gbp": 0, "description": "SkyWater 130nm chip + MEOK OS + 33-hive BFT council (already built)"},
}


def mod_or_build_decision(
    component: str = "mcmb_muscle_orb",
    has_open_source: bool = False,
    is_unique_to_capillary: bool = True,
    maturity_required_months: int = 3,
) -> dict:
    """Decide MOD vs BUILD for a component."""
    if is_unique_to_capillary:
        decision = "BUILD"
        reason = "Unique to capillary (no open source exists)"
        time_weeks = BUILD_TARGETS.get(component, {}).get("weeks", 6)
        cost_gbp = BUILD_TARGETS.get(component, {}).get("cost_gbp", 0)
        time_saved_weeks = 0
    elif has_open_source and maturity_required_months >= 6:
        decision = "MOD"
        reason = "Open source exists + we need it mature"
        mod_path = list(MOD_PATHS.keys())[hash(component) % len(MOD_PATHS)]
        time_weeks = MOD_PATHS[mod_path]["weeks"]
        cost_gbp = 5000  # typical MOD cost
        time_saved_weeks = 24  # 6 months saved vs BUILD
    else:
        decision = "MOD_FIRST_BUILD_IF_NEEDED"
        reason = "MOD first, then BUILD only if MOD doesn't work"
        time_weeks = 4
        cost_gbp = 3000
        time_saved_weeks = 12

    return {
        "component": component,
        "decision": decision,
        "reason": reason,
        "time_weeks": time_weeks,
        "cost_gbp": cost_gbp,
        "time_saved_weeks_vs_build_from_scratch": time_saved_weeks,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def estimate_mod_time(
    num_mod_paths: int = 12,
    avg_weeks_per_path: float = 3.5,
    parallel_engineers: int = 3,
) -> dict:
    """Estimate the time saved by MODing (parallelization considered)."""
    total_weeks_serial = num_mod_paths * avg_weeks_per_path
    total_weeks_parallel = math.ceil(total_weeks_serial / parallel_engineers)
    build_from_scratch_weeks = 48  # 1 year to build from scratch
    time_saved_weeks = build_from_scratch_weeks - total_weeks_parallel
    cost_saved_gbp = time_saved_weeks * 15000  # £15k/engineer/week

    return {
        "num_mod_paths": num_mod_paths,
        "avg_weeks_per_path": avg_weeks_per_path,
        "parallel_engineers": parallel_engineers,
        "total_weeks_serial": total_weeks_serial,
        "total_weeks_parallel": total_weeks_parallel,
        "build_from_scratch_weeks": build_from_scratch_weeks,
        "time_saved_weeks": time_saved_weeks,
        "cost_saved_gbp": cost_saved_gbp,
        "speedup_factor": build_from_scratch_weeks / total_weeks_parallel,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def list_mod_targets() -> dict:
    """List the 12 MOD paths + 25 candidate MOD repos."""
    candidate_repos = {
        "google-deepmind/mujoco": "Physics sim (Apache 2.0)",
        "RobotLocomotion/drake": "Robotics dynamics (BSD)",
        "ros2/ros2": "Robot control (Apache 2.0)",
        "moveit/moveit2": "Motion planning (BSD)",
        "stack-of-tasks/pinocchio": "Rigid body dynamics (BSD)",
        "google-deepmind/dm_control": "RL for MuJoCo (Apache 2.0)",
        "jedisct1/libsodium": "Ed25519 crypto (ISC)",
        "cometbft/cometbft": "BFT consensus (Apache 2.0)",
        "modelcontextprotocol/python-sdk": "MCP framework (MIT)",
        "openai/whisper": "STT (MIT)",
        "rhasspy/piper": "TTS (MIT)",
        "opencv/opencv": "Computer vision (Apache 2.0)",
        "ultralytics/ultralytics": "YOLOv8 object detection (AGPL-3.0)",
        "UZ-SLAMLab/ORB_SLAM3": "Visual SLAM (GPLv3)",
        "bulletphysics/bullet3": "Physics sim (Zlib)",
        "gazebosim/gz-sim": "Robot sim (Apache 2.0)",
        "huggingface/lerobot": "Robot learning (Apache 2.0)",
        "pytorch/pytorch": "Deep learning (BSD)",
        "huggingface/transformers": "LLMs (Apache 2.0)",
        "huggingface/diffusers": "Diffusion models (Apache 2.0)",
        "microsoft/onnxruntime": "Model inference (MIT)",
        "numpy/numpy": "Numerical computing (BSD)",
        "pyvista/pyvista": "3D viz (MIT)",
        "state-spaces/mamba": "State space models (Apache 2.0)",
        "vllm-project/vllm": "LLM serving (Apache 2.0)",
    }
    return {
        "mod_paths": MOD_PATHS,
        "candidate_repos": candidate_repos,
        "total_paths": len(MOD_PATHS),
        "total_repos": len(candidate_repos),
        "all_licenses_open_source": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def list_build_targets() -> dict:
    """List the 5 BUILD-from-scratch items (the unique differentiators)."""
    total_weeks = sum(t.get("weeks", 0) for t in BUILD_TARGETS.values())
    total_cost_gbp = sum(t.get("cost_gbp", 0) for t in BUILD_TARGETS.values())
    return {
        "build_targets": BUILD_TARGETS,
        "total_count": len(BUILD_TARGETS),
        "total_weeks": total_weeks,
        "total_cost_gbp": total_cost_gbp,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def generate_timeline(
    start_week: int = 1,
    parallel_engineers: int = 3,
) -> dict:
    """Generate the 20-week MOD-first timeline for the sovereign capillary humanoid."""
    timeline = [
        {"week": 1, "task": "Clone MuJoCo + Drake + ROS 2 + MoveIt 2 + Tendermint + libsodium", "type": "MOD"},
        {"week": 2, "task": "Set up the build environment + write the spec", "type": "BUILD"},
        {"week": 3, "task": "Build MCMB muscle dynamics plugin for MuJoCo", "type": "MOD"},
        {"week": 4, "task": "Continue MuJoCo + first muscle orb prototype", "type": "BUILD"},
        {"week": 5, "task": "Build capillary muscle control messages for ROS 2", "type": "MOD"},
        {"week": 6, "task": "Continue ROS 2 + spine bus design", "type": "BUILD"},
        {"week": 7, "task": "Build motion planning plugin for MoveIt 2", "type": "MOD"},
        {"week": 8, "task": "Continue MoveIt + IK solver", "type": "BUILD"},
        {"week": 9, "task": "Build 33-hive BFT council using Tendermint", "type": "MOD"},
        {"week": 10, "task": "Continue Tendermint + SIGIL signing", "type": "BUILD"},
        {"week": 11, "task": "Build SIGIL signing infrastructure using libsodium", "type": "MOD"},
        {"week": 12, "task": "Continue SIGIL + audit chain", "type": "BUILD"},
        {"week": 13, "task": "Integrate Whisper + Piper TTS for speech", "type": "MOD"},
        {"week": 14, "task": "Continue speech integration", "type": "BUILD"},
        {"week": 15, "task": "Integrate YOLOv8 + ORB-SLAM3 for vision", "type": "MOD"},
        {"week": 16, "task": "Continue vision integration", "type": "BUILD"},
        {"week": 17, "task": "Test the full MOD integration + first full-body sim", "type": "TEST"},
        {"week": 18, "task": "First full-body sim + first sovereign BFT vote", "type": "TEST"},
        {"week": 19, "task": "First sovereign capillary humanoid prototype!", "type": "MILESTONE"},
        {"week": 20, "task": "Pilot deployment + first sovereign decision", "type": "DEPLOY"},
    ]

    return {
        "timeline": timeline,
        "total_weeks": len(timeline),
        "parallel_engineers": parallel_engineers,
        "mod_tasks": sum(1 for t in timeline if t["type"] == "MOD"),
        "build_tasks": sum(1 for t in timeline if t["type"] == "BUILD"),
        "test_tasks": sum(1 for t in timeline if t["type"] == "TEST"),
        "milestones": sum(1 for t in timeline if t["type"] == "MILESTONE"),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-hybrid-roadmap-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="mod_or_build_decision", description="Decide MOD vs BUILD for a component.", inputSchema={"type": "object", "properties": {"component": {"type": "string", "default": "mcmb_muscle_orb"}, "has_open_source": {"type": "boolean", "default": False}, "is_unique_to_capillary": {"type": "boolean", "default": True}, "maturity_required_months": {"type": "integer", "default": 3}}, "required": []}),
        Tool(name="estimate_mod_time", description="Estimate the time saved by MODing.", inputSchema={"type": "object", "properties": {"num_mod_paths": {"type": "integer", "default": 12}, "avg_weeks_per_path": {"type": "number", "default": 3.5}, "parallel_engineers": {"type": "integer", "default": 3}}, "required": []}),
        Tool(name="list_mod_targets", description="List the 12 MOD paths + 25 candidate MOD repos.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="list_build_targets", description="List the 5 BUILD-from-scratch items.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="generate_timeline", description="Generate the 20-week MOD-first timeline.", inputSchema={"type": "object", "properties": {"parallel_engineers": {"type": "integer", "default": 3}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "mod_or_build_decision":
        result = mod_or_build_decision(**arguments)
    elif name == "estimate_mod_time":
        result = estimate_mod_time(**arguments)
    elif name == "list_mod_targets":
        result = list_mod_targets()
    elif name == "list_build_targets":
        result = list_build_targets()
    elif name == "generate_timeline":
        result = generate_timeline(**arguments)
    else:
        return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def main():
    if not mcp or not stdio_server:
        raise RuntimeError("mcp package not installed")
    async with stdio_server() as (read_stream, write_stream):
        await mcp.run(read_stream, write_stream, mcp.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())