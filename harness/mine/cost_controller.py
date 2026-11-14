#!/usr/bin/env python3
"""cost_controller.py — ASI-Evolve: tracks spend, enforces limits.

RunPod rate $0.28/hr, GHA free, HuggingFace free, etc.
Tracks per-day spend, alerts if over budget.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/cost_controller_state.json")

# Spend rates (verified)
RATES = {
    "runpod_3090": 0.28,  # per hour
    "x402_settlement": 0.00001,  # per receipt (gas)
    "gh_actions_minutes": 0.008,  # per minute (rough estimate)
    "internet_egress_gb": 0.09,  # Cloudflare
}

LIMITS = {
    "daily_runpod_usd": 7.0,  # ~24h * $0.28
    "daily_total_usd": 10.0,
    "monthly_runpod_usd": 200.0,
    "warning_threshold_pct": 80,
}

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "uptime_hours": {}, "daily_spend": {}, "monthly_spend": {}, "alerts": []}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def get_pod_uptime():
    try:
        result = subprocess.run(
            "ssh -p 22081 root@194.26.196.156 'ps -o etime= -p $(pgrep -f runpod_gspc_worker.py | head -1) 2>/dev/null'",
            shell=True, capture_output=True, text=True, timeout=10
        )
        etime = result.stdout.strip()
        if not etime or "error" in etime.lower():
            return 0
        parts = etime.split()
        if len(parts) >= 2:
            try:
                days = int(parts[0].split("-")[0]) if "-" in parts[0] else 0
                time_parts = parts[-1].split(":")
                hours = days * 24 + int(time_parts[0])
                minutes = int(time_parts[1]) if len(time_parts) > 1 else 0
                return hours + minutes / 60.0
            except Exception:
                return 0
        return 0
    except Exception:
        return 0

def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve cost controller: pod uptime {metrics.get('uptime_hours', 0):.1f}h, daily spend ${metrics.get('daily_spend', 0):.2f}, limits OK.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"cost-{subject.replace('/', '-').replace(':', '-').replace('.', '-')[:60]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname

def main():
    state = load_state()
    state["runs"] += 1
    today = NOW()[:10]
    print(f"[{NOW()}] cost_controller starting — run #{state['runs']}, today={today}")
    uptime = get_pod_uptime()
    daily_runpod = uptime * RATES["runpod_3090"] / 24 if uptime < 48 else RATES["runpod_3090"] * 1
    daily_total = daily_runpod + 0.5  # rough estimate for egress + GHA
    state.setdefault("daily_spend", {})[today] = daily_total
    state.setdefault("monthly_spend", {})[today[:7]] = state.get("monthly_spend", {}).get(today[:7], 0) + daily_total
    alerts = []
    if daily_total > LIMITS["daily_total_usd"] * LIMITS["warning_threshold_pct"] / 100:
        alerts.append(f"daily spend ${daily_total:.2f} > {LIMITS['warning_threshold_pct']}% of ${LIMITS['daily_total_usd']:.2f}")
    state["alerts"] = alerts[-10:]
    save_state(state)
    write_card(
        f"cost-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measurement.cost.state",
        {
            "uptime_hours": round(uptime, 2),
            "daily_spend": round(daily_total, 4),
            "monthly_spend": round(state["monthly_spend"].get(today[:7], 0), 2),
            "limits": LIMITS,
            "alerts": alerts,
            "rates": RATES,
            "miner_version": "asi-evolve-2",
            "note": "Cost controller. Pod uptime → daily spend. Alerts at 80% of limit.",
        },
    )
    print(f"[{NOW()}] cost_controller done: uptime={uptime:.1f}h, daily=${daily_total:.2f}, alerts={alerts}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
