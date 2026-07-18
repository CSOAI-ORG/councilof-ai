#!/usr/bin/env python3
"""
MEOK AI LABS — Attention Firewall
Protects Nick's cognitive budget from Legion's own notifications.
Tracks decisions, context switches, emotional spikes per day.
Blocks non-critical alerts when budget exhausted.
From Kimi Gap #21.
"""

import json
import logging
import time
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Optional

log = logging.getLogger("attention-firewall")

STATE_FILE = Path(__file__).parent / "data" / "attention_state.json"
STATE_FILE.parent.mkdir(parents=True, exist_ok=True)


class AttentionFirewall:
    """Guards Nick's attention as the scarcest empire resource."""

    DAILY_BUDGET = {
        "decisions": 100,
        "context_switches": 20,
        "emotional_spikes": 3,
        "reading_words": 5000,
    }

    def __init__(self):
        self.today = date.today().isoformat()
        self.spent = self._load_state()

    def _load_state(self) -> Dict:
        if STATE_FILE.exists():
            try:
                with open(STATE_FILE) as f:
                    data = json.load(f)
                if data.get("date") == self.today:
                    return data.get("spent", {k: 0 for k in self.DAILY_BUDGET})
            except Exception:
                pass
        return {k: 0 for k in self.DAILY_BUDGET}

    def _save_state(self):
        with open(STATE_FILE, "w") as f:
            json.dump({"date": self.today, "spent": self.spent}, f, indent=2)

    def should_pass(self, alert: Dict) -> bool:
        """
        Should this alert reach Nick?
        Returns False if cognitive budget exhausted.
        """
        cost = self._calculate_cost(alert)
        severity = alert.get("severity", "low")
        revenue_impact = alert.get("revenue_impact", 0)
        is_dragon_critical = alert.get("dragon_sprint_critical", False)

        # Always pass: hardware emergencies, >£10K revenue, dragon-critical
        if severity == "critical" or revenue_impact > 10000 or is_dragon_critical:
            self._spend(cost)
            log.info(f"🔥 PASS (critical): {alert.get('title', 'untitled')}")
            return True

        # Check budget
        for resource, amount in cost.items():
            if self.spent.get(resource, 0) + amount > self.DAILY_BUDGET.get(resource, 999):
                log.info(f"🛡️ BLOCKED ({resource} exhausted): {alert.get('title', 'untitled')}")
                return False

        self._spend(cost)
        return True

    def _calculate_cost(self, alert: Dict) -> Dict:
        severity = alert.get("severity", "low")
        alert_type = alert.get("type", "notification")

        costs = {
            "notification": {"decisions": 1, "context_switches": 0, "emotional_spikes": 0, "reading_words": 50},
            "decision_required": {"decisions": 3, "context_switches": 1, "emotional_spikes": 0, "reading_words": 200},
            "crisis": {"decisions": 5, "context_switches": 2, "emotional_spikes": 1, "reading_words": 500},
            "report": {"decisions": 0, "context_switches": 0, "emotional_spikes": 0, "reading_words": 1000},
        }
        return costs.get(alert_type, costs["notification"])

    def _spend(self, cost: Dict):
        for k, v in cost.items():
            self.spent[k] = self.spent.get(k, 0) + v
        self._save_state()

    def get_budget_status(self) -> Dict:
        return {
            "date": self.today,
            "budget": self.DAILY_BUDGET,
            "spent": self.spent,
            "remaining": {k: self.DAILY_BUDGET[k] - self.spent.get(k, 0) for k in self.DAILY_BUDGET},
            "utilization": {k: f"{self.spent.get(k, 0)/v*100:.0f}%" for k, v in self.DAILY_BUDGET.items()},
        }

    def reset_daily(self):
        self.today = date.today().isoformat()
        self.spent = {k: 0 for k in self.DAILY_BUDGET}
        self._save_state()


firewall = AttentionFirewall()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")

    # Test: various alerts
    tests = [
        {"title": "Slack msg", "type": "notification", "severity": "low"},
        {"title": "Server down", "type": "crisis", "severity": "high"},
        {"title": "New £50K client", "type": "decision_required", "severity": "medium", "revenue_impact": 50000},
        {"title": "Daily report", "type": "report", "severity": "low"},
    ]

    for alert in tests:
        passed = firewall.should_pass(alert)
        print(f"  {'✅' if passed else '🛡️'} {alert['title']}: {'PASS' if passed else 'BLOCKED'}")

    print(f"\nBudget: {json.dumps(firewall.get_budget_status(), indent=2)}")
