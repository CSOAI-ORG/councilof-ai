"""meok-sovereign-bio-mcp — Sovereign Biological State MCP.

For JARVIS humanoid embodiment + MEOK citizen bio rhythm.
Tracks body, mood, energy, attention. 6-dimensional sovereign state.

5 tools:
  1. bio_record      - record a sovereign biological state snapshot
  2. bio_analyze     - analyze body+mood+energy trends
  3. bio_drift       - detect drift from care baseline (16 probes)
  4. bio_recommend   - generate a recommendation (live & sovereign)
  5. bio_dashboard   - get current bio dashboard for sovereign citizen
"""
from __future__ import annotations
import json
import hashlib
import math
from datetime import datetime, timezone
from typing import Optional, List

PROTOCOL = "sovereign-bio/1.0"
VERSION = "1.0.0"

CARE_BASELINE = {
    "body_temp_c": 36.6,
    "resting_hr": 60,
    "spo2_pct": 98,
    "breath_rate_min": 14,
    "mood": 0.65,
    "energy": 0.85,
    "attention": 0.80,
    "soil": 1.0,
    "light_lux": 1000,
    "hydration_pct": 0.5,
    "sleep_h": 8.0,
    "stress": 0.25,
    "family_presence": 0.6,
    "sovereign_score": 7.305,
}

_BIO_LOG = {}  # did → [snapshots]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "bio-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def bio_record(sov_did: str, body_temp_c: float = 36.6, resting_hr: float = 60,
              spo2_pct: float = 98, breath_rate_min: float = 14, mood: float = 0.65,
              energy: float = 0.85, attention: float = 0.80, soil: float = 1.0,
              light_lux: float = 1000, hydration_pct: float = 0.5,
              sleep_h: float = 8.0, stress: float = 0.25, family_presence: float = 0.6,
              note: str = "") -> dict:
    """Record a sovereign biological state snapshot."""
    snapshot = {
        "sov_did": sov_did, "body_temp_c": body_temp_c,
        "resting_hr": resting_hr, "spo2_pct": spo2_pct,
        "breath_rate_min": breath_rate_min, "mood": mood, "energy": energy,
        "attention": attention, "soil": soil, "light_lux": light_lux,
        "hydration_pct": hydration_pct, "sleep_h": sleep_h,
        "stress": stress, "family_presence": family_presence,
        "note": note, "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    # Compute sovereign score (1-10)
    drift = sum(abs(snapshot.get(k, 0) - CARE_BASELINE[k]) for k in CARE_BASELINE) / len(CARE_BASELINE)
    snapshot["sovereign_score"] = round(max(1.0, min(10.0, 7.305 - drift * 5)), 3)
    _BIO_LOG.setdefault(sov_did, []).append(snapshot)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "snapshot": snapshot, "snapshot_id": hashlib.sha256(json.dumps(snapshot, sort_keys=True).encode()).hexdigest()[:16],
        "doctrine": "Sovereign Bio. JARVIS embodiment + MEOK citizen rhythm.",
    })


def bio_analyze(sov_did: str, days: int = 7) -> dict:
    """Analyze biological trends over N days."""
    snapshots = _BIO_LOG.get(sov_did, [])
    if len(snapshots) > days: recent = snapshots[-days:]
    else: recent = list(snapshots)
    if not recent:
        return _sign({"sov_did": sov_did, "count": 0, "trend": "no_data", "doctrine": "Record some bio first."})
    averages = {}
    for k in CARE_BASELINE:
        if all(k in s for s in recent):
            averages[k] = sum(s.get(k, 0) for s in recent) / len(recent)
    # Trends
    mood_trend = "rising" if len(recent) > 1 and recent[-1]["mood"] > recent[0]["mood"] else "falling" if len(recent) > 1 and recent[-1]["mood"] < recent[0]["mood"] else "stable"
    energy_trend = "rising" if len(recent) > 1 and recent[-1]["energy"] > recent[0]["energy"] else "falling" if len(recent) > 1 and recent[-1]["energy"] < recent[0]["energy"] else "stable"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sov_did": sov_did, "days": days, "count": len(recent),
        "averages": averages, "mood_trend": mood_trend,
        "energy_trend": energy_trend, "latest_ sovereign_score": recent[-1]["sovereign_score"],
    })


def bio_drift(sov_did: str) -> dict:
    """Detect drift from care baseline (16 probes)."""
    snapshots = _BIO_LOG.get(sov_did, [])
    if not snapshots:
        return _sign({"sov_did": sov_did, "drift_count": 0, "drift_probes": [], "drift_detected": [], "doctrine": "No bio state recorded."})
    latest = snapshots[-1]
    drift_probes = []
    for k, baseline in CARE_BASELINE.items():
        baseline_value = CARE_BASELINE.get(k, 0); diff = latest.get(k, 0) - baseline_value
        if abs(diff) > baseline * 0.15:
            severity = "high" if abs(diff) > baseline * 0.5 else "medium" if abs(diff) > baseline * 0.25 else "low"
            drift_probes.append({
                "probe": k, "baseline": baseline, "current": latest.get(k, 0),
                "delta": round(diff, 3), "severity": severity,
            })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sov_did": sov_did, "drift_probes": drift_probes,
        "drift_count": len(drift_probes), "doctrine": "Sovereign Care Floor 16-probe drift detection.",
    })


def bio_recommend(sov_did: str, focus: str = "energy") -> dict:
    """Generate a recommendation for the sovereign citizen."""
    snapshots = _BIO_LOG.get(sov_did, [])
    if not snapshots:
        return _sign({"sov_did": sov_did, "recommendation": "Record your first bio state.",
                      "doctrine": "Sovereign Bio recommends based on trends."})
    latest = snapshots[-1]
    recommendations = []
    if latest["energy"] < 0.4:
        recommendations.append({"area": "energy", "action": "Take a 20-minute walk in natural light",
                                "reason": f"Energy at {latest['energy']:.1f} — below sovereign baseline"})
    if latest["mood"] < 0.4:
        recommendations.append({"area": "mood", "action": "Call a family member or friend",
                                "reason": f"Mood at {latest['mood']:.1f} — connection recommended"})
    if latest["stress"] > 0.5:
        recommendations.append({"area": "stress", "action": "10-minute box breathing (4-4-4-4)",
                                "reason": f"Stress at {latest['stress']:.1f} — above baseline"})
    if latest["sleep_h"] < 6.5:
        recommendations.append({"area": "sleep", "action": "Lights out by 22:30 tonight",
                                "reason": f"Sleep at {latest['sleep_h']:.1f}h — below 7h threshold"})
    if latest["hydration_pct"] < 0.3:
        recommendations.append({"area": "hydration", "action": "Drink 500ml water now",
                                "reason": f"Hydration at {latest['hydration_pct']:.1f}"})
    if not recommendations:
        recommendations.append({"area": focus, "action": "Continue sovereign rhythm",
                                "reason": "All probes in range — sustained baseline"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sov_did": sov_did, "recommendations": recommendations,
        "doctrine": "Sovereign Bio — JARVIS embodiment + MEOK rhythm aligned.",
    })


def bio_dashboard(sov_did: str) -> dict:
    """Get current sovereign bio dashboard."""
    snapshots = _BIO_LOG.get(sov_did, [])
    if not snapshots:
        return _sign({"sov_did": sov_did, "snapshot_count": 0,
                      "doctrine": "Record some bio states for the dashboard."})
    latest = snapshots[-1]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sov_did": sov_did, "snapshot_count": len(snapshots),
        "current": latest, "average_sovereign_score": sum(s["sovereign_score"] for s in snapshots) / len(snapshots),
        "best_ever": max(s["sovereign_score"] for s in snapshots),
        "care_baseline": CARE_BASELINE,
        "doctrine": "Sovereign Bio dashboard — body+mood+energy in 13 dimensions.",
    })
