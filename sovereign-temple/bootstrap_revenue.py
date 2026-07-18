#!/usr/bin/env python3
"""
MEOK AI LABS — Bootstrap Revenue Tracker
Tracks self-funding progress toward £50K infrastructure budget.
No external capital — pure internal arbitrage.
From Kimi Bootstrap Protocol.
"""

import json
import logging
import time
import requests
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Dict, List

log = logging.getLogger("bootstrap")

SOV3_URL = "http://localhost:3101"
LEDGER_FILE = Path(__file__).parent / "data" / "bootstrap_ledger.json"
LEDGER_FILE.parent.mkdir(parents=True, exist_ok=True)


class BootstrapLedger:
    """Track £50K self-funding progress."""

    TARGET = 50000  # GBP
    DEADLINE_DAYS = 30

    REVENUE_STREAMS = {
        "csoai_certifications": {"target": 25000, "description": "10 × £5K EU AI Act certs"},
        "grabhire_annuals": {"target": 8400, "description": "10 × £840 annual prepays"},
        "overnight_compute": {"target": 4800, "description": "£400/mo × 12 months Dr Raj"},
        "data_monetization": {"target": 5000, "description": "IOK Farm Q1 dataset sale"},
        "meok_presales": {"target": 3000, "description": "3 × £1K sovereign trinity setup"},
        "heat_arbitrage": {"target": 547, "description": "£1.50/day × 365 koi heating"},
        "ghost_commerce": {"target": 3000, "description": "3 × £1K negative insight packages"},
        "microclimate_api": {"target": 600, "description": "£50/mo × 12 API subscribers"},
    }

    MILESTONES = {
        600: "Spare M4 Mac Mini",
        2000: "Legal (Holdings LLP)",
        2300: "Light Phone 2 + LoRa Kit",
        8000: "Solar 3kW + Battery",
        15000: "DNA Synthesis Backup",
        50000: "Full sovereignty achieved",
    }

    def __init__(self):
        self.ledger = self._load()

    def _load(self) -> Dict:
        if LEDGER_FILE.exists():
            try:
                with open(LEDGER_FILE) as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "target": self.TARGET,
            "raised": 0,
            "start_date": date.today().isoformat(),
            "deadline": (date.today() + timedelta(days=self.DEADLINE_DAYS)).isoformat(),
            "streams": {k: {"target": v["target"], "raised": 0} for k, v in self.REVENUE_STREAMS.items()},
            "transactions": [],
            "milestones_hit": [],
        }

    def _save(self):
        with open(LEDGER_FILE, "w") as f:
            json.dump(self.ledger, f, indent=2)

    def record_revenue(self, stream: str, amount: float, note: str = "") -> Dict:
        """Record revenue from a specific stream."""
        if stream not in self.ledger["streams"]:
            log.warning(f"Unknown stream: {stream}")
            return {"error": "unknown stream"}

        self.ledger["streams"][stream]["raised"] += amount
        self.ledger["raised"] += amount

        tx = {
            "stream": stream,
            "amount": amount,
            "note": note,
            "timestamp": datetime.now().isoformat(),
            "running_total": self.ledger["raised"],
        }
        self.ledger["transactions"].append(tx)

        # Check milestones
        for threshold, item in self.MILESTONES.items():
            if self.ledger["raised"] >= threshold and threshold not in self.ledger["milestones_hit"]:
                self.ledger["milestones_hit"].append(threshold)
                log.info(f"🎯 MILESTONE: £{threshold:,} — {item}")

        self._save()
        pct = (self.ledger["raised"] / self.TARGET) * 100
        log.info(f"💰 +£{amount:,.0f} ({stream}): £{self.ledger['raised']:,.0f}/{self.TARGET:,} ({pct:.1f}%)")

        # Store in SOV3
        try:
            requests.post(f"{SOV3_URL}/mcp", json={
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "record_memory",
                    "arguments": {
                        "content": f"[Bootstrap Revenue] +£{amount:,.0f} from {stream}. Total: £{self.ledger['raised']:,.0f}/{self.TARGET:,} ({pct:.1f}%). {note}",
                        "memory_type": "decision",
                        "importance": 0.7,
                        "tags": ["bootstrap", "revenue", stream],
                        "source_agent": "bootstrap-ledger",
                    }
                }
            }, timeout=5)
        except Exception:
            pass

        return tx

    def get_status(self) -> Dict:
        raised = self.ledger["raised"]
        days_elapsed = (date.today() - date.fromisoformat(self.ledger["start_date"])).days
        days_remaining = max(0, self.DEADLINE_DAYS - days_elapsed)
        daily_needed = (self.TARGET - raised) / max(days_remaining, 1)

        return {
            "raised": raised,
            "target": self.TARGET,
            "progress_pct": round(raised / self.TARGET * 100, 1),
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
            "daily_needed": round(daily_needed, 2),
            "streams": self.ledger["streams"],
            "milestones_hit": self.ledger["milestones_hit"],
            "next_milestone": next(
                (f"£{t:,}: {i}" for t, i in sorted(self.MILESTONES.items()) if t not in self.ledger["milestones_hit"]),
                "All milestones achieved! 🐉"
            ),
            "transactions_count": len(self.ledger["transactions"]),
        }

    def generate_report(self) -> str:
        s = self.get_status()
        report = f"BOOTSTRAP STATUS — {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        report += f"{'='*50}\n"
        report += f"Raised: £{s['raised']:,.0f} / £{s['target']:,} ({s['progress_pct']}%)\n"
        report += f"Days: {s['days_elapsed']}/{self.DEADLINE_DAYS} | Need: £{s['daily_needed']:,.0f}/day\n"
        report += f"Next: {s['next_milestone']}\n\n"
        report += "Streams:\n"
        for name, data in s["streams"].items():
            desc = self.REVENUE_STREAMS[name]["description"]
            pct = data["raised"] / max(data["target"], 1) * 100
            report += f"  {name}: £{data['raised']:,.0f}/£{data['target']:,} ({pct:.0f}%) — {desc}\n"
        return report


ledger = BootstrapLedger()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")

    # Simulate first revenue
    ledger.record_revenue("overnight_compute", 400, "Dr Raj first month")
    ledger.record_revenue("heat_arbitrage", 45, "First month koi heating savings")

    print(ledger.generate_report())
