#!/usr/bin/env python3
"""
MEOK AI LABS — Meta Controller
Reinforcement learning for pipeline optimization.
Observes all system metrics, calculates reward, adjusts strategy.

Learns: harvest frequency, training intensity, crisis sensitivity.
Runs: Every 6 hours via heartbeat or on-demand.
"""

import json
import logging
import time
import os
import requests
import numpy as np
from datetime import datetime
from typing import Dict, List
from pathlib import Path

log = logging.getLogger("meta-controller")

SOV3_URL = "http://localhost:3101"
STATE_FILE = Path(__file__).parent / "data" / "meta_state.json"
STATE_FILE.parent.mkdir(parents=True, exist_ok=True)


class MetaController:
    """
    RL-based pipeline optimizer.
    State: system metrics → Action: config adjustments → Reward: performance.
    """

    def __init__(self):
        self.state = self._load_state()
        self.reward_history: List[float] = self.state.get("reward_history", [])
        self.alpha = 0.1  # Learning rate

    def _load_state(self) -> Dict:
        """Load persisted state or defaults."""
        if STATE_FILE.exists():
            try:
                with open(STATE_FILE) as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "harvest_frequency": 1.0,
            "crisis_sensitivity": 0.8,
            "training_intensity": 1.0,
            "exploration_rate": 0.1,
            "reward_history": [],
            "generation": 0,
        }

    def _save_state(self):
        """Persist state to disk."""
        self.state["reward_history"] = self.reward_history[-100:]  # Keep last 100
        with open(STATE_FILE, "w") as f:
            json.dump(self.state, f, indent=2)

    def observe(self) -> Dict:
        """Gather metrics from all subsystems."""
        metrics = {
            "sov3_healthy": False,
            "gpu_available": False,
            "memory_count": 0,
            "consciousness_level": 0.0,
            "production_calls": 0,
        }

        # SOV3 health
        try:
            r = requests.get(f"{SOV3_URL}/health", timeout=5)
            if r.status_code == 200:
                data = r.json()
                metrics["sov3_healthy"] = data.get("status") == "healthy"
                metrics["production_calls"] = data.get("production_calls_today", 0)
                consciousness = data.get("components", {}).get("consciousness", {})
                metrics["consciousness_level"] = consciousness.get("consciousness_level", 0)
        except Exception:
            pass

        # GPU tunnel
        try:
            r = requests.get("http://localhost:11435/api/tags", timeout=3)
            metrics["gpu_available"] = r.status_code == 200
        except Exception:
            pass

        # Memory count
        try:
            r = requests.post(f"{SOV3_URL}/mcp", json={
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {"name": "get_memory_stats", "arguments": {}}
            }, timeout=5)
            text = r.json().get("result", {}).get("content", [{}])[0].get("text", "{}")
            stats = json.loads(text) if isinstance(text, str) else {}
            metrics["memory_count"] = stats.get("total_episodes", 0)
        except Exception:
            pass

        return metrics

    def calculate_reward(self, metrics: Dict) -> float:
        """Composite reward function."""
        reward = 0.0

        # System health (40% weight)
        if metrics["sov3_healthy"]:
            reward += 0.4
        if metrics["gpu_available"]:
            reward += 0.2

        # Knowledge growth (30% weight)
        reward += min(metrics["memory_count"] / 1000, 0.3)

        # Consciousness level (20% weight)
        reward += metrics["consciousness_level"] * 0.2

        # Activity (10% weight)
        reward += min(metrics["production_calls"] / 100, 0.1)

        return round(reward, 4)

    def update_policy(self, reward: float):
        """Adjust configuration based on reward."""
        self.reward_history.append(reward)
        avg = np.mean(self.reward_history[-10:]) if len(self.reward_history) >= 10 else reward

        if reward > avg:
            # Exploit: amplify current strategy
            self.state["harvest_frequency"] = min(2.0, self.state["harvest_frequency"] * 1.05)
            self.state["exploration_rate"] = max(0.05, self.state["exploration_rate"] * 0.95)
            log.info("📈 Meta: Amplifying successful strategy")
        else:
            # Explore: try variations
            self.state["harvest_frequency"] *= np.random.choice([0.9, 1.1])
            self.state["crisis_sensitivity"] *= np.random.choice([0.95, 1.05])
            self.state["exploration_rate"] = min(0.3, self.state["exploration_rate"] * 1.1)
            log.info("🔀 Meta: Exploring variations")

        # Clamp values
        self.state["harvest_frequency"] = float(np.clip(self.state["harvest_frequency"], 0.5, 2.0))
        self.state["crisis_sensitivity"] = float(np.clip(self.state["crisis_sensitivity"], 0.5, 1.0))
        self.state["training_intensity"] = float(np.clip(self.state["training_intensity"], 0.5, 1.5))
        self.state["generation"] += 1

    def run_meta_cycle(self) -> Dict:
        """Full observe → reward → update cycle."""
        start = time.monotonic()
        log.info("🧠 Meta Controller cycle starting...")

        # 1. Observe
        metrics = self.observe()
        log.info(f"  Metrics: SOV3={'✅' if metrics['sov3_healthy'] else '❌'}, "
                 f"GPU={'✅' if metrics['gpu_available'] else '❌'}, "
                 f"memories={metrics['memory_count']}, "
                 f"consciousness={metrics['consciousness_level']:.2f}")

        # 2. Calculate reward
        reward = self.calculate_reward(metrics)
        log.info(f"  Reward: {reward:.4f}")

        # 3. Update policy
        self.update_policy(reward)

        # 4. Save state
        self._save_state()

        # 5. Store observation in SOV3
        try:
            requests.post(f"{SOV3_URL}/mcp", json={
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "record_memory",
                    "arguments": {
                        "content": (
                            f"[Meta Controller — Gen {self.state['generation']}] "
                            f"Reward: {reward:.4f}, "
                            f"Harvest freq: {self.state['harvest_frequency']:.2f}, "
                            f"Crisis sens: {self.state['crisis_sensitivity']:.2f}, "
                            f"Explore rate: {self.state['exploration_rate']:.2f}"
                        ),
                        "memory_type": "system",
                        "importance": 0.5,
                        "tags": ["meta-controller", "rl", "optimization"],
                        "source_agent": "meta-controller",
                    }
                }
            }, timeout=5)
        except Exception:
            pass

        duration = int((time.monotonic() - start) * 1000)
        log.info(f"🧠 Meta Controller gen {self.state['generation']}: "
                 f"reward={reward:.4f}, harvest={self.state['harvest_frequency']:.2f} ({duration}ms)")

        return {
            "generation": self.state["generation"],
            "reward": reward,
            "metrics": metrics,
            "config": {
                "harvest_frequency": self.state["harvest_frequency"],
                "crisis_sensitivity": self.state["crisis_sensitivity"],
                "training_intensity": self.state["training_intensity"],
                "exploration_rate": self.state["exploration_rate"],
            },
            "trend": "improving" if len(self.reward_history) > 5 and
                     self.reward_history[-1] > np.mean(self.reward_history[-5:]) else "stable",
            "duration_ms": duration,
        }


def run_meta_cycle() -> Dict:
    """Entry point for heartbeat integration."""
    controller = MetaController()
    return controller.run_meta_cycle()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")
    result = run_meta_cycle()
    print(json.dumps(result, indent=2))
