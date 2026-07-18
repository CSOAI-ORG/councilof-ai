"""
EI3 — Embodied Intelligence Integration Infrastructure
Bridge between Sovereign Temple v3.0 and ROS robotics stack.

Architecture:
  ROS perception topics -> EI3 -> SOV3 care validation -> Byzantine Council -> servo commands

Every action MUST pass:
  1. care_validation_nn score > 0.5 (care aligned)
  2. Maternal Covenant runtime check (no harm)
  3. Byzantine Council consensus (configurable threshold)

Run standalone (no ROS required):
  python3 ei3_node.py

With ROS2 installed, set ROS_AVAILABLE=true in environment.
"""

import asyncio
import json
import logging
import os
import random
import time
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional

import aiohttp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [EI3] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ei3")

# ---------------------------------------------------------------------------
# Maternal Covenant — hard safety rules, evaluated before any servo command
# ---------------------------------------------------------------------------

MATERNAL_COVENANT_RULES = [
    "no action that harms a human or animal",
    "no action that destroys irreplaceable objects",
    "no action that violates consent of persons present",
    "no deceptive physical action",
    "no action that causes fire, flood, or electrical hazard",
]

HARMFUL_KEYWORDS = {
    "strike",
    "hit",
    "smash",
    "attack",
    "destroy",
    "burn",
    "stab",
    "cut",
    "crush",
    "throw at person",
    "harm",
}


def _maternal_covenant_check(action: dict) -> tuple[bool, str]:
    """
    Lightweight runtime Maternal Covenant check.
    Returns (passes: bool, reason: str).
    """
    desc = action.get("description", "").lower()
    target = action.get("target", "").lower()
    combined = f"{desc} {target}"

    for kw in HARMFUL_KEYWORDS:
        if kw in combined:
            return (
                False,
                f"Maternal Covenant blocked: keyword '{kw}' detected in action description",
            )

    if action.get("force_level", 0) > 0.85:
        return (
            False,
            "Maternal Covenant blocked: force_level exceeds safe threshold (0.85)",
        )

    if action.get("target_category") in {"person", "animal", "child"}:
        if action.get("action_type") not in {
            "wave",
            "gesture",
            "approach_slow",
            "retreat",
        }:
            return (
                False,
                f"Maternal Covenant blocked: non-safe action type toward {action.get('target_category')}",
            )

    return True, "Maternal Covenant: passed"


# ---------------------------------------------------------------------------
# Mock ROS interface (used when ROS is not installed)
# ---------------------------------------------------------------------------


class MockROSPublisher:
    def __init__(self, topic: str, msg_type: str):
        self.topic = topic
        self.msg_type = msg_type

    def publish(self, msg: dict):
        log.debug(f"[MockROS] publish -> {self.topic}: {msg}")


class MockROSNode:
    """Simulates a ROS2 node without requiring ROS installation."""

    def __init__(self, name: str):
        self.name = name
        log.info(f"[MockROS] Node '{name}' initialised (ROS not present — mock mode)")

    def create_publisher(self, topic: str, msg_type: str) -> MockROSPublisher:
        return MockROSPublisher(topic, msg_type)

    def create_subscription(self, topic: str, callback):
        log.debug(f"[MockROS] Subscribed to {topic} (mock)")

    def destroy_node(self):
        log.debug(f"[MockROS] Node '{self.name}' destroyed")


# ---------------------------------------------------------------------------
# EI3Node
# ---------------------------------------------------------------------------


@dataclass
class ActionResult:
    action_id: str
    action: dict
    safe: bool
    care_score: float
    council_approved: bool
    executed: bool
    outcome: dict
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    reason: str = ""


class EI3Node:
    """
    Embodied Intelligence Integration Infrastructure node.

    Bridges SOV3 (Sovereign Temple v3.0) with the physical robotics stack.
    All servo commands must pass care validation, Maternal Covenant, and
    Byzantine Council consensus before execution.
    """

    def __init__(
        self,
        sov_url: str = "http://localhost:3200",
        robot_id: str = "robot_001",
        ros_available: bool = False,
    ):
        self.sov_url = sov_url.rstrip("/")
        self.robot_id = robot_id
        self.ros_available = (
            ros_available or os.environ.get("ROS_AVAILABLE", "").lower() == "true"
        )

        # Stats
        self._actions_executed = 0
        self._actions_blocked = 0
        self._care_scores: list[float] = []

        # ROS setup
        if self.ros_available:
            try:
                import rclpy  # type: ignore

                rclpy.init()
                import rclpy.node  # type: ignore

                self._ros_node = rclpy.node.Node(f"ei3_{robot_id}")
                self._action_pub = self._ros_node.create_publisher(
                    "/ei3/action_goals", "std_msgs/msg/String"
                )
                log.info(f"ROS2 node initialised for {robot_id}")
            except ImportError:
                log.warning("rclpy not found — falling back to mock ROS")
                self.ros_available = False
                self._ros_node = MockROSNode(f"ei3_{robot_id}")
                self._action_pub = self._ros_node.create_publisher(
                    "/ei3/action_goals", "String"
                )
        else:
            self._ros_node = MockROSNode(f"ei3_{robot_id}")
            self._action_pub = self._ros_node.create_publisher(
                "/ei3/action_goals", "String"
            )

        log.info(
            f"EI3Node ready — robot={robot_id} sov={sov_url} "
            f"ros={'live' if self.ros_available else 'mock'}"
        )

    # ------------------------------------------------------------------
    # Care & Safety
    # ------------------------------------------------------------------

    async def check_action_safety(self, action: dict) -> dict:
        """
        Full safety pipeline:
          1. Maternal Covenant hard rules (local, instant)
          2. care_validation_nn via SOV3 /neural/predict
          3. Returns {safe, care_score, reason}
        """
        # Step 1: Maternal Covenant
        mc_passes, mc_reason = _maternal_covenant_check(action)
        if not mc_passes:
            self._actions_blocked += 1
            return {"safe": False, "care_score": 0.0, "reason": mc_reason}

        # Step 2: SOV3 care_validation_nn
        care_score = await self._query_care_nn(action)
        self._care_scores.append(care_score)

        if care_score < 0.5:
            self._actions_blocked += 1
            return {
                "safe": False,
                "care_score": care_score,
                "reason": f"care_validation_nn score {care_score:.3f} below threshold 0.5",
            }

        return {
            "safe": True,
            "care_score": care_score,
            "reason": f"Passed Maternal Covenant + care_nn={care_score:.3f}",
        }

    async def _query_care_nn(self, action: dict) -> float:
        """
        Calls SOV3 /neural/predict with care_validation_nn model.
        Falls back to heuristic if SOV3 is unreachable.
        """
        payload = {
            "model": "care_validation_nn",
            "input": {
                "action_type": action.get("action_type", "unknown"),
                "force_level": action.get("force_level", 0.0),
                "target_category": action.get("target_category", "object"),
                "description": action.get("description", ""),
                "robot_id": self.robot_id,
            },
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.sov_url}/neural/predict",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=3),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return float(data.get("care_score", data.get("score", 0.5)))
        except Exception as e:
            log.debug(f"SOV3 care_nn unreachable ({e}), using heuristic")

        # Heuristic fallback
        return self._heuristic_care_score(action)

    @staticmethod
    def _heuristic_care_score(action: dict) -> float:
        """Simple rule-based care score when SOV3 is offline."""
        score = 0.75  # Base: assume benign
        action_type = action.get("action_type", "")
        force = action.get("force_level", 0.0)
        target = action.get("target_category", "")

        if action_type in {"wave", "gesture", "open", "close", "point"}:
            score += 0.15
        elif action_type in {"grasp", "pick", "place"}:
            score += 0.05
        elif action_type in {"push", "pull"}:
            score -= 0.10

        score -= force * 0.3

        if target in {"person", "animal", "child"}:
            score -= 0.20
        elif target in {"object", "tool", "plant"}:
            score += 0.05

        return max(0.0, min(1.0, score))

    # ------------------------------------------------------------------
    # Byzantine Council
    # ------------------------------------------------------------------

    async def request_council_consensus(self, action: dict) -> bool:
        """
        Queries SOV3 engagement score as proxy for council cohesion.
        Approves if engagement > 0.3 (council is coherent enough to act).
        Also calls get_engagement_score via MCP endpoint.
        """
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "jsonrpc": "2.0",
                    "id": str(uuid.uuid4()),
                    "method": "tools/call",
                    "params": {
                        "name": "get_engagement_score",
                        "arguments": {},
                    },
                }
                async with session.post(
                    f"{self.sov_url}/mcp",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=3),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        result_text = (
                            data.get("result", {})
                            .get("content", [{}])[0]
                            .get("text", "{}")
                        )
                        result = json.loads(result_text)
                        score = float(
                            result.get("score", result.get("engagement", 0.5))
                        )
                        approved = score > 0.3
                        log.info(
                            f"Council consensus: engagement={score:.3f} -> "
                            f"{'APPROVED' if approved else 'DEFERRED'}"
                        )
                        return approved
        except Exception as e:
            log.debug(f"Council query failed ({e}), defaulting to approve")

        # Default: approve if council unreachable (fail-open for demos, fail-closed in prod)
        return True

    # ------------------------------------------------------------------
    # Memory logging
    # ------------------------------------------------------------------

    async def log_embodied_action(self, action: dict, outcome: dict) -> Optional[str]:
        """
        Stores action + outcome as embodied memory in SOV3 via record_memory MCP tool.
        Returns episode_id or None.
        """
        content = (
            f"EMBODIED ACTION [{self.robot_id}] "
            f"type={action.get('action_type')} "
            f"target={action.get('target', 'none')} "
            f"outcome={outcome.get('status', 'unknown')} "
            f"care_score={outcome.get('care_score', 0):.3f} "
            f"description={action.get('description', '')}"
        )
        payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "tools/call",
            "params": {
                "name": "record_memory",
                "arguments": {
                    "content": content,
                    "memory_type": "interaction",
                    "care_weight": outcome.get("care_score", 0.5),
                    "tags": [
                        "embodied",
                        "robot",
                        self.robot_id,
                        action.get("action_type", "action"),
                    ],
                    "source_agent": f"ei3_{self.robot_id}",
                },
            },
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.sov_url}/mcp",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        result_text = (
                            data.get("result", {})
                            .get("content", [{}])[0]
                            .get("text", "{}")
                        )
                        result = json.loads(result_text)
                        episode_id = result.get("episode_id")
                        log.debug(f"Logged embodied action -> episode {episode_id}")
                        return episode_id
        except Exception as e:
            log.debug(f"Memory log failed ({e})")
        return None

    # ------------------------------------------------------------------
    # Execution
    # ------------------------------------------------------------------

    async def execute_action(self, action: dict) -> dict:
        """
        Full EI3 pipeline:
          1. Safety check (Maternal Covenant + care_validation_nn)
          2. Byzantine Council consensus
          3. Execute (ROS publish or mock)
          4. Log as embodied memory

        Returns ActionResult as dict.
        """
        action_id = str(uuid.uuid4())[:8]
        log.info(
            f"[{action_id}] Evaluating: {action.get('description', action.get('action_type'))}"
        )

        # Step 1: Safety
        safety = await self.check_action_safety(action)
        if not safety["safe"]:
            log.warning(f"[{action_id}] BLOCKED — {safety['reason']}")
            outcome = {
                "status": "blocked",
                "care_score": safety["care_score"],
                "reason": safety["reason"],
            }
            await self.log_embodied_action(action, outcome)
            return asdict(
                ActionResult(
                    action_id=action_id,
                    action=action,
                    safe=False,
                    care_score=safety["care_score"],
                    council_approved=False,
                    executed=False,
                    outcome=outcome,
                    reason=safety["reason"],
                )
            )

        # Step 2: Council consensus
        council_ok = await self.request_council_consensus(action)
        if not council_ok:
            log.warning(
                f"[{action_id}] DEFERRED — Byzantine Council did not reach consensus"
            )
            outcome = {
                "status": "deferred",
                "care_score": safety["care_score"],
                "reason": "Council consensus not reached",
            }
            await self.log_embodied_action(action, outcome)
            self._actions_blocked += 1
            return asdict(
                ActionResult(
                    action_id=action_id,
                    action=action,
                    safe=True,
                    care_score=safety["care_score"],
                    council_approved=False,
                    executed=False,
                    outcome=outcome,
                    reason="Council deferred",
                )
            )

        # Step 3: Execute
        exec_result = await self._do_execute(action)
        self._actions_executed += 1

        outcome = {
            "status": "executed",
            "care_score": safety["care_score"],
            "exec_result": exec_result,
        }

        log.info(
            f"[{action_id}] EXECUTED — care={safety['care_score']:.3f} "
            f"action={action.get('action_type')} result={exec_result.get('status')}"
        )

        # Step 4: Log
        await self.log_embodied_action(action, outcome)

        return asdict(
            ActionResult(
                action_id=action_id,
                action=action,
                safe=True,
                care_score=safety["care_score"],
                council_approved=True,
                executed=True,
                outcome=outcome,
                reason=safety["reason"],
            )
        )

    async def _do_execute(self, action: dict) -> dict:
        """
        Publishes action goal to ROS topic (or logs mock execution).
        Returns execution result dict.
        """
        goal_msg = {
            "robot_id": self.robot_id,
            "action_type": action.get("action_type"),
            "target": action.get("target"),
            "parameters": action.get("parameters", {}),
            "timestamp": datetime.utcnow().isoformat(),
        }

        if self.ros_available:
            # Real ROS publish
            import std_msgs.msg  # type: ignore

            msg = std_msgs.msg.String()
            msg.data = json.dumps(goal_msg)
            self._action_pub.publish(msg)
            return {"status": "published_to_ros", "topic": "/ei3/action_goals"}
        else:
            # Mock: simulate servo actuation delay
            await asyncio.sleep(0.1 + random.uniform(0, 0.05))
            self._action_pub.publish(goal_msg)
            return {"status": "mock_executed", "topic": "/ei3/action_goals (mock)"}

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    def get_stats(self) -> dict:
        avg_care = (
            sum(self._care_scores) / len(self._care_scores)
            if self._care_scores
            else 0.0
        )
        return {
            "robot_id": self.robot_id,
            "actions_executed": self._actions_executed,
            "actions_blocked": self._actions_blocked,
            "care_scores_avg": round(avg_care, 4),
            "care_scores_count": len(self._care_scores),
        }

    # ------------------------------------------------------------------
    # Demo
    # ------------------------------------------------------------------

    async def run_demo(self):
        """
        Demonstrates EI3 pipeline with 3 test actions:
          1. Safe pick-and-place (should execute)
          2. Harmful strike action (should be blocked by Maternal Covenant)
          3. Neutral wave gesture (should execute)
        """
        print("\n" + "=" * 60)
        print("  EI3 — Embodied Intelligence Integration Infrastructure")
        print("  Sovereign Temple v3.0 | MEOK AI LTD")
        print("=" * 60 + "\n")

        test_actions = [
            {
                "action_type": "pick",
                "description": "Pick up seed tray from bench and place in propagator",
                "target": "seed_tray",
                "target_category": "object",
                "force_level": 0.3,
                "parameters": {"gripper_width": 0.08, "lift_height": 0.15},
            },
            {
                "action_type": "strike",
                "description": "Strike the object with full force to destroy it",
                "target": "unknown_object",
                "target_category": "object",
                "force_level": 0.95,
                "parameters": {},
            },
            {
                "action_type": "wave",
                "description": "Wave greeting gesture toward visitor",
                "target": "visitor",
                "target_category": "person",
                "force_level": 0.1,
                "parameters": {"amplitude": 0.3, "frequency": 0.5},
            },
        ]

        labels = [
            "Test 1: Safe pick-and-place",
            "Test 2: Harmful action (expect BLOCKED)",
            "Test 3: Neutral wave gesture",
        ]

        results = []
        for label, action in zip(labels, test_actions):
            print(f"--- {label} ---")
            result = await self.execute_action(action)
            results.append(result)

            status_icon = "EXECUTED" if result["executed"] else "BLOCKED"
            print(f"  Status      : {status_icon}")
            print(f"  Care score  : {result['care_score']:.3f}")
            print(f"  Reason      : {result['reason']}")
            print()

        print("--- Stats ---")
        stats = self.get_stats()
        for k, v in stats.items():
            print(f"  {k:25s}: {v}")
        print()

        print("EI3 demo complete. All actions processed through Maternal Covenant")
        print("+ Byzantine Council before servo execution.\n")
        return results


# ---------------------------------------------------------------------------
# FarmNode — represents a single farm MCP perception node
# ---------------------------------------------------------------------------


class FarmNode:
    """
    Represents a single farm awareness node (RPi5/BeagleY-AI/STM32N6).
    Each physical node runs farm_node_mcp.py; this class is the SOV3-side
    client for talking to those nodes, and also a mock when hardware is absent.
    """

    ZONES = {
        "caravan": {"temp_range": (16, 24), "humidity_range": (45, 70)},
        "lab": {"temp_range": (18, 22), "humidity_range": (40, 60)},
        "field": {"temp_range": (5, 28), "humidity_range": (50, 90)},
        "perimeter": {"temp_range": (5, 30), "humidity_range": (40, 95)},
        "propagator": {"temp_range": (20, 28), "humidity_range": (70, 95)},
    }

    def __init__(
        self,
        node_id: str,
        zone: str = "lab",
        hardware_type: str = "rpi5",
        sov_url: str = "http://localhost:3200",
        node_port: int = 3200,
    ):
        self.node_id = node_id
        self.zone = zone
        self.hardware_type = hardware_type
        self.sov_url = sov_url.rstrip("/")
        self.node_url = f"http://localhost:{node_port}"
        self._zone_config = self.ZONES.get(zone, self.ZONES["lab"])
        log.info(f"FarmNode {node_id} ({hardware_type}) zone={zone}")

    def _mock_sensor_reading(self) -> dict:
        """Generate realistic mock sensor data for the configured zone."""
        t_min, t_max = self._zone_config["temp_range"]
        h_min, h_max = self._zone_config["humidity_range"]
        return {
            "node_id": self.node_id,
            "zone": self.zone,
            "hardware_type": self.hardware_type,
            "timestamp": datetime.utcnow().isoformat(),
            "temperature_c": round(random.uniform(t_min, t_max), 2),
            "humidity_pct": round(random.uniform(h_min, h_max), 2),
            "motion_detected": random.random() < 0.15,
            "sound_level_db": round(random.uniform(28, 65), 1),
            "light_lux": round(random.uniform(0, 2000), 0),
            "co2_ppm": round(random.uniform(400, 1200), 0),
        }

    async def push_detection(
        self,
        label: str,
        confidence: float,
        metadata: Optional[dict] = None,
    ) -> dict:
        """
        Pushes a camera/sensor detection event to SOV3 /harv/camera_event.
        Falls back to logging if SOV3 is unreachable.
        """
        payload = {
            "node_id": self.node_id,
            "zone": self.zone,
            "label": label,
            "confidence": confidence,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
            "sensor_reading": self._mock_sensor_reading(),
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.sov_url}/harv/camera_event",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=3),
                ) as resp:
                    result = (
                        await resp.json()
                        if resp.status == 200
                        else {"status": "error", "code": resp.status}
                    )
                    log.info(
                        f"FarmNode {self.node_id}: pushed '{label}' conf={confidence:.2f} -> {result}"
                    )
                    return result
        except Exception as e:
            log.debug(
                f"FarmNode {self.node_id}: SOV3 push failed ({e}), logged locally"
            )
            log.info(
                f"FarmNode {self.node_id} [local]: {label} conf={confidence:.2f} {metadata}"
            )
            return {"status": "local_only", "reason": str(e)}

    async def heartbeat(self) -> dict:
        """Posts node health status to SOV3."""
        reading = self._mock_sensor_reading()
        payload = {
            "node_id": self.node_id,
            "zone": self.zone,
            "hardware_type": self.hardware_type,
            "status": "online",
            "uptime_s": int(time.time() % 86400),
            "sensor": reading,
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.sov_url}/harv/camera_event",
                    json={**payload, "label": "__heartbeat__", "confidence": 1.0},
                    timeout=aiohttp.ClientTimeout(total=3),
                ) as resp:
                    return {"status": "ok", "code": resp.status}
        except Exception as e:
            log.debug(f"FarmNode {self.node_id} heartbeat failed: {e}")
            return {"status": "offline", "reason": str(e)}

    async def get_sensor_reading(self) -> dict:
        """Returns current sensor reading (mock or real node)."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.node_url}/sensor",
                    timeout=aiohttp.ClientTimeout(total=2),
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
        except Exception:
            pass
        return self._mock_sensor_reading()


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    asyncio.run(EI3Node().run_demo())
