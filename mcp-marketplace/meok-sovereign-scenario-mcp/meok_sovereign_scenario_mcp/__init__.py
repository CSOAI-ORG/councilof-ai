"""meok-sovereign-scenario-mcp — Real-World Sovereign Scenario Simulator.

Simulates real-world scenarios that help humanity with data, directions,
rescues, evacuations, etc. The future of abundance, not extraction.
Built on the Sovereignty Charter + Partnership Charter.

Scenarios:
  1. drone_rescue       - Person trapped, drone finds, dispatches rescue
  2. fire_response      - Fire detected, drones + sensors + evacuation routes
  3. flood_evacuation  - Flood warning, optimal evacuation paths
  4. missing_person     - Search & rescue with drones + sensors
  5. medical_emergency  - Medical incident, dispatch + hospital route
  6. crime_in_progress  - Public camera + sensor fusion, dispatch
  7. traffic_accident   - Collision, dispatch + rerouting
  8. weather_warning    - Storm, evacuation, public camera monitoring
  9. power_outage       - Blackout, backup power + sovereign ops
 10. supply_chain       - Sovereign logistics + DORADO 1-click

5 tools:
  1. scenario_run       - run a scenario
  2. scenario_list      - list all 10 scenarios
  3. scenario_step      - take the next step in a scenario
  4. scenario_status    - get scenario status
  5. scenario_history   - get all completed scenarios
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-scenario/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# The 10 sovereign scenarios (the future of abundance)
SCENARIOS = [
    {
        "id": "drone_rescue",
        "name": "Drone Rescue",
        "description": "Person trapped in remote area. Drones scan + dispatch + rescue.",
        "actors": ["drone", "rescue_team", "hospital"],
        "sensors": ["thermal", "lidar", "camera", "sound"],
        "duration_min": 15,
        "doctrine": "The future of abundance: drones save lives with sovereign data.",
    },
    {
        "id": "fire_response",
        "name": "Fire Response",
        "description": "Fire detected. Sensors + drones + optimal evacuation routes.",
        "actors": ["fire_dept", "drones", "public_cameras", "people"],
        "sensors": ["thermal", "camera", "smoke", "air_quality"],
        "duration_min": 30,
        "doctrine": "The future of abundance: fires extinguished with sovereign response.",
    },
    {
        "id": "flood_evacuation",
        "name": "Flood Evacuation",
        "description": "Flood warning. Optimal evacuation paths + shelter coordination.",
        "actors": ["emergency", "people", "shelters", "transit"],
        "sensors": ["weather", "water_level", "gps", "traffic"],
        "duration_min": 60,
        "doctrine": "The future of abundance: floods evacuations are sovereign by data.",
    },
    {
        "id": "missing_person",
        "name": "Missing Person Search",
        "description": "Search & rescue with drones + sensors + AI triangulation.",
        "actors": ["police", "drones", "search_teams", "volunteers"],
        "sensors": ["thermal", "camera", "sound", "gps", "biometric"],
        "duration_min": 120,
        "doctrine": "The future of abundance: missing persons found with sovereign intelligence.",
    },
    {
        "id": "medical_emergency",
        "name": "Medical Emergency",
        "description": "Medical incident. Dispatch + hospital route + real-time vitals.",
        "actors": ["ambulance", "hospital", "drone_supply", "family"],
        "sensors": ["biometric", "gps", "camera", "cellular"],
        "duration_min": 10,
        "doctrine": "The future of abundance: medical care is sovereign and instant.",
    },
    {
        "id": "crime_in_progress",
        "name": "Crime in Progress",
        "description": "Public camera + sensor fusion. AI dispatches + tracks.",
        "actors": ["police", "drones", "cameras", "sensors"],
        "sensors": ["camera", "motion", "sound", "thermal", "facial"],
        "duration_min": 5,
        "doctrine": "The future of abundance: crimes prevented with sovereign watch.",
    },
    {
        "id": "traffic_accident",
        "name": "Traffic Accident",
        "description": "Collision. Dispatch + rerouting + emergency route.",
        "actors": ["emergency", "police", "ambulance", "drones"],
        "sensors": ["camera", "motion", "gps", "cellular"],
        "duration_min": 8,
        "doctrine": "The future of abundance: traffic accidents resolved with sovereign coordination.",
    },
    {
        "id": "weather_warning",
        "name": "Weather Warning",
        "description": "Storm approaching. Public camera monitoring + evacuation + shelter.",
        "actors": ["weather_service", "emergency", "people", "shelters"],
        "sensors": ["weather", "camera", "satellite", "gps"],
        "duration_min": 240,
        "doctrine": "The future of abundance: weather warnings save lives with sovereign data.",
    },
    {
        "id": "power_outage",
        "name": "Power Outage",
        "description": "Blackout. Backup power + sovereign ops + restoration.",
        "actors": ["utility", "sovereign_ops", "drones", "people"],
        "sensors": ["power_grid", "thermal", "drone_patrol"],
        "duration_min": 60,
        "doctrine": "The future of abundance: power restored with sovereign resilience.",
    },
    {
        "id": "supply_chain",
        "name": "Supply Chain Logistics",
        "description": "Sovereign logistics. DORADO 1-click routing. Drone delivery.",
        "actors": ["logistics", "drones", "suppliers", "people"],
        "sensors": ["gps", "cargo_scan", "drone_telemetry"],
        "duration_min": 30,
        "doctrine": "The future of abundance: supply chains are sovereign and instant.",
    },
]

# Active scenarios
_ACTIVE = {}  # id -> {step, log, status}
_COUNTER = [0]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "scn-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def scenario_run(scenario_id: str, location: str = "London, UK") -> dict:
    """Run a sovereign scenario."""
    scen = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scen:
        return _sign({"error": f"unknown scenario: {scenario_id}. Use one of {[s['id'] for s in SCENARIOS]}"})
    _COUNTER[0] += 1
    run_id = f"run-{_COUNTER[0]:04d}"
    _ACTIVE[run_id] = {
        "scenario": scen,
        "location": location,
        "step": 0,
        "log": [],
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "run_id": run_id,
        "scenario": scen,
        "location": location,
        "status": "started",
        "doctrine": f"Sovereign scenario '{scen['name']}' started in {location}.",
    })


def scenario_list() -> dict:
    """List all 10 sovereign scenarios."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total": len(SCENARIOS),
        "scenarios": SCENARIOS,
        "license": LICENSE,
        "doctrine": f"{len(SCENARIOS)} sovereign scenarios. The future of abundance, not extraction.",
    })


def scenario_step(run_id: str) -> dict:
    """Take the next step in a scenario."""
    if run_id not in _ACTIVE:
        return _sign({"error": f"unknown run_id: {run_id}"})
    run = _ACTIVE[run_id]
    run["step"] += 1
    # Generate a step
    step = {
        "step_n": run["step"],
        "action": f"Step {run['step']}: Sovereign response in {run['location']}",
        "actors": run["scenario"]["actors"],
        "sensors_active": run["scenario"]["sensors"],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    run["log"].append(step)
    if run["step"] >= 5:
        run["status"] = "completed"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "run_id": run_id,
        "step": step,
        "status": run["status"],
        "doctrine": f"Step {run['step']} of '{run['scenario']['name']}' taken.",
    })


def scenario_status(run_id: str) -> dict:
    """Get scenario status."""
    if run_id not in _ACTIVE:
        return _sign({"error": f"unknown run_id: {run_id}"})
    run = _ACTIVE[run_id]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "run_id": run_id,
        "scenario_id": run["scenario"]["id"],
        "location": run["location"],
        "step": run["step"],
        "status": run["status"],
        "log_size": len(run["log"]),
        "doctrine": f"Scenario '{run['scenario']['name']}' status: {run['status']} (step {run['step']}).",
    })


def scenario_history() -> dict:
    """Get all completed scenarios."""
    completed = [r for r in _ACTIVE.values() if r["status"] == "completed"]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_active": len([r for r in _ACTIVE.values() if r["status"] == "active"]),
        "total_completed": len(completed),
        "completed": completed,
        "doctrine": f"{len(completed)} sovereign scenarios completed. The future of abundance.",
    })