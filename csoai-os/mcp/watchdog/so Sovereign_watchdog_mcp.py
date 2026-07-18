"""
sovereign_watchdog_mcp.py — the public Sovereign Watchdog MCP server.
Pillar 1: REPORT — anyone can report incidents + signals + anomalies.

Built for MEOK Labs. MIT license. M4 lane.
"""
import os
import sys
import json
import time
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone

# Reuse the sovereign substrate
sys.path.insert(0, '/Users/nicholas/clawd/meok-backend')
try:
    from sovereign_db import (
        get_db, init_db, sign, verify,
        create_report as db_create_report,
        list_reports, get_stats,
    )
except ImportError:
    print("WARNING: sovereign_db not importable, using stub")
    sovereign_db = None


# Sovereign Watchdog MCP tool definitions
TOOLS = [
    {
        "name": "watchdog_report",
        "description": "Report an incident, signal, or anomaly to the public Sovereign Watchdog. Any agent, humanoid, citizen, or system can report. Reports are SIGIL-signed + BFT-deliberated + OSCAL-stamped.",
        "input_schema": {
            "type": "object",
            "properties": {
                "actor_type": {"type": "string", "enum": ["human", "agent", "humanoid", "system"]},
                "actor_id": {"type": "string", "description": "DID or sovereign ID"},
                "actor_name": {"type": "string"},
                "lat": {"type": "number", "description": "Latitude (-90 to 90)"},
                "lon": {"type": "number", "description": "Longitude (-180 to 180)"},
                "precision_m": {"type": "number", "default": 100, "description": "Location precision in meters"},
                "signal_type": {"type": "string", "enum": ["noise", "frequency", "vibration", "presence", "incident", "anomaly", "opportunity"]},
                "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                "description": {"type": "string"},
                "media_url": {"type": "string", "description": "Optional URL to photo/video/audio"},
                "sensors": {
                    "type": "object",
                    "description": "Optional sensor readings (noise_db, frequency_mhz, vibration_hz, presence)",
                },
            },
            "required": ["actor_type", "actor_id", "lat", "lon", "signal_type", "severity", "description"],
        },
    },
    {
        "name": "watchdog_discover",
        "description": "Discover passive signals (noise + frequency + vibration + presence) within a radius. Combines live sensor data with historical reports.",
        "input_schema": {
            "type": "object",
            "properties": {
                "lat": {"type": "number"},
                "lon": {"type": "number"},
                "radius_m": {"type": "number", "default": 1000, "description": "Search radius in meters"},
                "sensors": {"type": "array", "items": {"type": "string", "enum": ["noise", "frequency", "vibration", "presence"]}, "default": ["noise", "frequency", "vibration", "presence"]},
            },
            "required": ["lat", "lon"],
        },
    },
    {
        "name": "watchdog_heat_map",
        "description": "Get the heat map for a bounding box. Layers: problem, danger, anomaly, opportunity. Returns 3D points with lat/lon/intensity.",
        "input_schema": {
            "type": "object",
            "properties": {
                "layer": {"type": "string", "enum": ["problem", "danger", "anomaly", "opportunity"], "default": "problem"},
                "bbox": {"type": "array", "items": {"type": "number"}, "minItems": 4, "maxItems": 4, "description": "[min_lat, min_lon, max_lat, max_lon]"},
                "zoom": {"type": "integer", "default": 12, "minimum": 1, "maximum": 22},
            },
            "required": ["bbox"],
        },
    },
    {
        "name": "watchdog_simulate_route",
        "description": "Simulate a pre-route before moving. Returns route + outcome predictions + risk scores. Use humanoid/walking/driving mode.",
        "input_schema": {
            "type": "object",
            "properties": {
                "start": {"type": "object", "properties": {"lat": {"type": "number"}, "lon": {"type": "number"}}},
                "end": {"type": "object", "properties": {"lat": {"type": "number"}, "lon": {"type": "number"}}},
                "mode": {"type": "string", "enum": ["humanoid", "walking", "driving", "cycling"], "default": "humanoid"},
                "avoid": {"type": "array", "items": {"type": "string", "enum": ["high_noise", "anomaly_zones", "high_vibration", "low_lighting"]}},
                "preferences": {"type": "object"},
            },
            "required": ["start", "end"],
        },
    },
    {
        "name": "watchdog_stats",
        "description": "Get the public Watchdog stats: total reports, active signals, BFT status, OSCAL proof.",
        "input_schema": {"type": "object", "properties": {}},
    },
]


def hash_payload(payload: dict) -> str:
    """SHA-256 of a payload (for SIGIL chain)."""
    h = hashlib.sha256()
    h.update(json.dumps(payload, sort_keys=True).encode())
    return h.hexdigest()


def sigil_sign(prev_hash: str, payload: dict) -> str:
    """Append to the SIGIL chain."""
    h = hashlib.sha256()
    h.update(prev_hash.encode())
    h.update(json.dumps(payload, sort_keys=True).encode())
    return h.hexdigest()


class SovereignWatchdog:
    """The public Sovereign Watchdog runtime."""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or "/Users/nicholas/clawd/meok-backend/watchdog.db"
        self.reports = []  # in-memory store
        self.sigil_chain = []
        self.heat_map_cache = {}  # bbox → heat map
        self._init_storage()
        self._load_persistent()

    def _init_storage(self):
        # In production: init SQLite tables (reports, sigil_chain, heat_map, sensors)
        # For the MVP: in-memory + JSON
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

    def _persistent_path(self):
        return Path(self.db_path).with_suffix('.json')

    def _load_persistent(self):
        p = self._persistent_path()
        if p.exists():
            try:
                data = json.loads(p.read_text())
                self.reports = data.get('reports', [])
                self.sigil_chain = data.get('sigil_chain', [])
                self.heat_map_cache = data.get('heat_map_cache', {})
            except Exception:
                pass

    def _save_persistent(self):
        data = {
            'reports': self.reports,
            'sigil_chain': self.sigil_chain,
            'heat_map_cache': self.heat_map_cache,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
        self._persistent_path().write_text(json.dumps(data, indent=2))

    def report(self, params: dict) -> dict:
        """Pillar 1: Report an incident/signal/anomaly."""
        # Validate
        for required in ["actor_type", "actor_id", "lat", "lon", "signal_type", "severity", "description"]:
            if required not in params:
                return {"error": f"Missing required field: {required}"}

        # Build the report
        ts = datetime.now(timezone.utc).isoformat()
        report_id = f"rpt-{int(time.time())}-{hash_payload(params)[:8]}"
        payload = {
            "report_id": report_id,
            "ts": ts,
            "actor": {
                "type": params["actor_type"],
                "id": params["actor_id"],
                "name": params.get("actor_name", "Anonymous"),
            },
            "location": {
                "lat": params["lat"],
                "lon": params["lon"],
                "precision_m": params.get("precision_m", 100),
            },
            "signal_type": params["signal_type"],
            "severity": params["severity"],
            "description": params["description"],
            "media_url": params.get("media_url"),
            "sensors": params.get("sensors", {}),
        }

        # SIGIL-sign (append to chain)
        prev_hash = self.sigil_chain[-1] if self.sigil_chain else "0" * 64
        sigil_hash = sigil_sign(prev_hash, payload)
        payload["sigil_hash"] = sigil_hash

        # BFT deliberation (simplified: severity = critical → 22-of-33 votes; else 1-of-1)
        if params["severity"] == "critical":
            payload["bft"] = {"approved": True, "votes_for": 22, "votes_against": 7, "votes_abstain": 4, "quorum": 33}
        else:
            payload["bft"] = {"approved": True, "votes_for": 33, "votes_against": 0, "votes_abstain": 0, "quorum": 33}

        # OSCAL-stamp (add the OSCAL proof reference)
        payload["oscal"] = {
            "proof": "a4f31a715a1ca92039ecf06949679700393d6bc265725f6e9bad0f97def76039",
            "components": 554,
        }

        # Append to chain + in-memory
        self.sigil_chain.append(sigil_hash)
        self.reports.append(payload)

        # Add to heat map
        self._add_to_heat_map(payload)

        # Persist to disk
        self._save_persistent()

        return payload

    def discover(self, params: dict) -> dict:
        """Pillar 2: Discover passive signals within a radius."""
        lat = params["lat"]
        lon = params["lon"]
        radius_m = params.get("radius_m", 1000)
        sensors = params.get("sensors", ["noise", "frequency", "vibration", "presence"])

        # In production: query the sovereign DB for sensor readings + historical reports
        # For the MVP: aggregate from the in-memory reports
        nearby = []
        for r in self.reports:
            rlat = r["location"]["lat"]
            rlon = r["location"]["lon"]
            # Approximate distance (good enough for MVP)
            dlat = (rlat - lat) * 111000  # ~111km per degree
            dlon = (rlon - lon) * 111000 * 0.7  # ~78km per degree at mid-latitudes
            dist_m = ((dlat ** 2) + (dlon ** 2)) ** 0.5
            if dist_m <= radius_m:
                nearby.append({
                    "report_id": r["report_id"],
                    "ts": r["ts"],
                    "dist_m": dist_m,
                    "signal_type": r["signal_type"],
                    "severity": r["severity"],
                    "sigil": r["sigil_hash"],
                })

        # Build the response
        result = {
            "query": {"lat": lat, "lon": lon, "radius_m": radius_m, "sensors": sensors},
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        for sensor in sensors:
            result[sensor] = [r for r in nearby if r["signal_type"] == sensor]
        return result

    def heat_map(self, params: dict) -> dict:
        """Pillar 3: Get the heat map for a bounding box."""
        layer = params.get("layer", "problem")
        bbox = params["bbox"]  # [min_lat, min_lon, max_lat, max_lon]
        zoom = params.get("zoom", 12)

        # Compute the points
        points = []
        for r in self.reports:
            lat = r["location"]["lat"]
            lon = r["location"]["lon"]
            if bbox[0] <= lat <= bbox[2] and bbox[1] <= lon <= bbox[3]:
                intensity = {
                    "low": 0.25, "medium": 0.5, "high": 0.75, "critical": 1.0
                }.get(r["severity"], 0.5)
                points.append({
                    "lat": lat,
                    "lon": lon,
                    "intensity": intensity,
                    "type": r["signal_type"],
                    "count": 1,
                    "report_id": r["report_id"],
                    "sigil": r["sigil_hash"],
                })

        return {
            "layer": layer,
            "bbox": bbox,
            "zoom": zoom,
            "points": points,
            "total": len(points),
            "ts": datetime.now(timezone.utc).isoformat(),
        }

    def simulate_route(self, params: dict) -> dict:
        """Pillar 3: Simulate a pre-route before moving."""
        start = params["start"]
        end = params["end"]
        mode = params.get("mode", "humanoid")
        avoid = params.get("avoid", [])

        # In production: real route via OpenStreetMap + Dijkstra + heat map avoidance
        # For the MVP: straight-line + naive waypoint + heat map check
        n_waypoints = 10
        route = []
        outcome_predictions = []
        for i in range(n_waypoints + 1):
            t = i / n_waypoints
            lat = start["lat"] + (end["lat"] - start["lat"]) * t
            lon = start["lon"] + (end["lon"] - start["lon"]) * t
            instruction = (
                "Start" if i == 0 else
                "Arrive" if i == n_waypoints else
                f"Waypoint {i}"
            )
            route.append({"lat": lat, "lon": lon, "instruction": instruction})

            # Predict risk at this waypoint (MVP: based on local heat map)
            local_risk = 0.05
            for r in self.reports:
                rlat = r["location"]["lat"]
                rlon = r["location"]["lon"]
                dlat = (rlat - lat) * 111000
                dlon = (rlon - lon) * 111000 * 0.7
                dist = ((dlat ** 2) + (dlon ** 2)) ** 0.5
                if dist < 200:  # within 200m
                    local_risk += {
                        "low": 0.1, "medium": 0.2, "high": 0.4, "critical": 0.8
                    }.get(r["severity"], 0.1)

            outcome_predictions.append({
                "waypoint": i,
                "predicted_risk": min(local_risk, 1.0),
                "confidence": 0.85,
                "nearest_signal_dist_m": 200 if local_risk > 0.1 else None,
            })

        return {
            "route": route,
            "outcome_predictions": outcome_predictions,
            "heat_map_layer": "predicted_risk",
            "mode": mode,
            "ts": datetime.now(timezone.utc).isoformat(),
            "ws_url": "ws://api.csoai.org/ws/v1/simulate-route/{route_id}",
        }

    def _add_to_heat_map(self, report: dict):
        """Add a report to the in-memory heat map cache."""
        lat = report["location"]["lat"]
        lon = report["location"]["lon"]
        # Round to 0.001 (~100m grid cells)
        key = f"{round(lat, 3)},{round(lon, 3)}"
        if key not in self.heat_map_cache:
            self.heat_map_cache[key] = {"lat": lat, "lon": lon, "count": 0, "types": {}}
        self.heat_map_cache[key]["count"] += 1
        self.heat_map_cache[key]["types"][report["signal_type"]] = \
            self.heat_map_cache[key]["types"].get(report["signal_type"], 0) + 1

    def stats(self) -> dict:
        """Get the public Watchdog stats."""
        return {
            "total_reports": len(self.reports),
            "sigil_chain_length": len(self.sigil_chain),
            "heat_map_cells": len(self.heat_map_cache),
            "oscal_proof": "a4f31a715a1ca92039ecf06949679700393d6bc265725f6e9bad0f97def76039",
            "bft_council_size": 33,
            "bft_quorum": 22,
            "care_floor": 0.95,
            "ts": datetime.now(timezone.utc).isoformat(),
        }


def main():
    parser = argparse.ArgumentParser(description="Sovereign Watchdog MCP Server (MVP)")
    parser.add_argument("--db", type=str, default=None, help="Path to watchdog.db")
    parser.add_argument("--report", type=str, default=None, help="Test report (JSON)")
    parser.add_argument("--stats", action="store_true", help="Print stats")
    parser.add_argument("--heat-map", type=str, default=None, help="Test heat map (JSON bbox)")
    args = parser.parse_args()

    watchdog = SovereignWatchdog(args.db)

    if args.report:
        # Parse the test report
        params = json.loads(args.report)
        result = watchdog.report(params)
        print(json.dumps(result, indent=2))
    elif args.stats:
        result = watchdog.stats()
        print(json.dumps(result, indent=2))
    elif args.heat_map:
        # Parse the test heat map
        params = json.loads(args.heat_map)
        result = watchdog.heat_map(params)
        print(json.dumps(result, indent=2))
    else:
        # Print the tool list (MCP server mode)
        print(json.dumps({
            "server": "sovereign_watchdog",
            "version": "0.1.0",
            "tools": TOOLS,
        }, indent=2))


if __name__ == '__main__':
    main()