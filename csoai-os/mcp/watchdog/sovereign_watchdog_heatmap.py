"""
sovereign_watchdog_heatmap.py — Pillar 3: SIMULATE (the heat map engine + pre-route simulator).
Sovereign Watchdog MVP W3.

Builds the global heat map engine with multiple layers + the pre-route simulator
that uses noise + frequency + vibration + presence data to predict outcomes
before a humanoid / agent / citizen moves.

Author: M4 (the engineering lane). MIT license. MEOK Labs.
"""
import os
import sys
import json
import math
import time
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone

import importlib.util
import sys

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

WD = load_module('sovereign_watchdog_mcp', '/Users/nicholas/clawd/csoai-os/mcp/watchdog/so Sovereign_watchdog_mcp.py').SovereignWatchdog
FusionMod = load_module('sovereign_watchdog_discover', '/Users/nicholas/clawd/csoai-os/mcp/watchdog/sovereign_watchdog_discover.py')
SensorFusion = FusionMod.SensorFusion


# Major cities (lat, lon)
MAJOR_CITIES = {
    "london": (51.5074, -0.1278),
    "new_york": (40.7128, -74.0060),
    "tokyo": (35.6762, 139.6503),
    "paris": (48.8566, 2.3522),
    "berlin": (52.5200, 13.4050),
    "sydney": (-33.8688, 151.2093),
    "singapore": (1.3521, 103.8198),
    "san_francisco": (37.7749, -122.4194),
    "rome": (41.9028, 12.4964),
    "madrid": (40.4168, -3.7038),
}


class HeatMapEngine:
    """Builds heat maps from reports + sensor readings with multi-layer support."""

    LAYERS = ["problem", "danger", "anomaly", "opportunity"]

    def __init__(self):
        self.reports = []  # imported from SovereignWatchdog
        self.sensors = SensorFusion()
        self.bbox_default = [51.5, -0.2, 51.6, 0.0]  # Greater London

    def build_layer(self, layer: str = "problem", bbox: list = None) -> dict:
        """Build a single heat map layer."""
        bbox = bbox or self.bbox_default
        points = []
        for r in self.reports:
            lat = r["location"]["lat"]
            lon = r["location"]["lon"]
            if bbox[0] <= lat <= bbox[2] and bbox[1] <= lon <= bbox[3]:
                # Compute intensity based on layer + severity
                severity_score = {
                    "low": 0.25, "medium": 0.5, "high": 0.75, "critical": 1.0
                }.get(r["severity"], 0.5)
                # Layer-specific filtering
                if layer == "problem" and r["signal_type"] in ["incident", "noise", "frequency", "vibration"]:
                    intensity = severity_score
                elif layer == "danger" and r["severity"] in ["high", "critical"]:
                    intensity = severity_score
                elif layer == "anomaly" and r["signal_type"] == "anomaly":
                    intensity = severity_score
                elif layer == "opportunity" and r["signal_type"] in ["opportunity"]:
                    intensity = severity_score
                else:
                    continue
                points.append({
                    "lat": round(lat, 5),
                    "lon": round(lon, 5),
                    "intensity": intensity,
                    "type": r["signal_type"],
                    "severity": r["severity"],
                    "ts": r["ts"],
                    "report_id": r["report_id"],
                    "sigil": r["sigil_hash"],
                    "actor_type": r["actor"]["type"],
                })
        return {
            "layer": layer,
            "bbox": bbox,
            "ts": datetime.now(timezone.utc).isoformat(),
            "points": points,
            "total": len(points),
        }

    def build_all_layers(self, bbox: list = None) -> dict:
        """Build all 4 layers at once."""
        return {layer: self.build_layer(layer, bbox) for layer in self.LAYERS}

    def render_html(self, bbox: list = None) -> str:
        """Render an HTML 3D-look heat map (Canvas + JS fallback)."""
        layers = self.build_all_layers(bbox)
        bbox = bbox or self.bbox_default
        # Build the cell grid (0.001 ≈ 100m grid)
        grid = {}
        for layer, data in layers.items():
            for p in data["points"]:
                cell = f"{round(p['lat'], 3)},{round(p['lon'], 3)}"
                if cell not in grid:
                    grid[cell] = {"lat": p["lat"], "lon": p["lon"], "layers": {}}
                grid[cell]["layers"][layer] = max(grid[cell]["layers"].get(layer, 0), p["intensity"])

        # Generate the cells for HTML rendering
        cells_html = ""
        for cell, data in grid.items():
            layer_colors = []
            intensity = 0
            for layer in self.LAYERS:
                v = data["layers"].get(layer, 0)
                if v > 0:
                    intensity = max(intensity, v)
                    color = {
                        "problem": "rgba(220,38,38," + str(v) + ")",
                        "danger": "rgba(249,115,22," + str(v) + ")",
                        "anomaly": "rgba(168,85,247," + str(v) + ")",
                        "opportunity": "rgba(16,185,129," + str(v) + ")",
                    }[layer]
                    layer_colors.append((layer, color))
            cell_color = layer_colors[0][1] if layer_colors else "rgba(255,255,255,0)"
            cells_html += f'<div class="cell" style="left:{data["lon"] * 10}px;top:{-data["lat"] * 10}px;background:{cell_color};width:8px;height:8px;" title="lat={data["lat"]}, lon={data["lon"]}, intensity={intensity:.2f}"></div>'

        return f'''
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Sovereign Watchdog — Global Heat Map</title>
<style>
body{{margin:0;padding:0;background:#0a0e1a;color:#e5e7eb;font:13px Inter,sans-serif;overflow:hidden;height:100vh}}
.map{{position:relative;width:100%;height:100vh;background:radial-gradient(circle at 50% 50%, #1e3a8a 0%, #0a0e1a 100%)}}
.cell{{position:absolute;width:8px;height:8px;border-radius:50%;}}
.legend{{position:fixed;top:20px;left:20px;background:rgba(0,0,0,.6);padding:14px;border-radius:6px;font-size:12px;border:1px solid #fbbf24}}
.legend h3{{color:#fbbf24;margin:0 0 8px 0}}
.legend p{{margin:2px 0}}
.legend .row{{display:flex;align-items:center;margin:2px 0}}
.legend .dot{{width:10px;height:10px;border-radius:50%;margin-right:8px}}
</style></head>
<body>
<div class="map">{cells_html}</div>
<div class="legend">
  <h3>🦉 Sovereign Watchdog</h3>
  <p>Global Heat Map · BBox: {bbox}</p>
  <p>Total cells: <b style="color:#fbbf24">{len(grid)}</b></p>
  <hr style="border-color:#1f2937;margin:6px 0">
  <div class="row"><div class="dot" style="background:rgba(220,38,38,.7)"></div>Problem (incidents)</div>
  <div class="row"><div class="dot" style="background:rgba(249,115,22,.7)"></div>Danger (high + critical)</div>
  <div class="row"><div class="dot" style="background:rgba(168,85,247,.7)"></div>Anomaly</div>
  <div class="row"><div class="dot" style="background:rgba(16,185,129,.7)"></div>Opportunity</div>
  <hr style="border-color:#1f2937;margin:6px 0">
  <p style="color:#10b981">● LIVE</p>
</div>
</body></html>'''


class PreRouteSimulator:
    """Pre-route simulator using noise + frequency + vibration + presence data."""

    def __init__(self, watchdog: 'WD' = None, fusion: 'SensorFusion' = None):
        self.watchdog = watchdog or WD()
        self.fusion = fusion or SensorFusion()
        self.routes_simulated = 0

    def simulate(self, start: dict, end: dict, mode: str = "humanoid", avoid: list = None, preferences: dict = None) -> dict:
        """Simulate a pre-route. Returns route + outcome predictions + risk scores."""
        avoid = avoid or []
        preferences = preferences or {"fastest": True, "safest": True}

        # Naive waypoint generation (10 evenly-spaced waypoints)
        n_waypoints = 10
        route = []
        predictions = []
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

            # Compute local risk based on nearby reports + sensors
            local_risk = 0.05  # baseline
            nearby_reports = []
            for r in self.watchdog.reports:
                rlat = r["location"]["lat"]
                rlon = r["location"]["lon"]
                dlat = (rlat - lat) * 111000
                dlon = (rlon - lon) * 111000 * 0.7
                dist = ((dlat ** 2) + (dlon ** 2)) ** 0.5
                if dist < 200:  # within 200m
                    severity_weight = {
                        "low": 0.1, "medium": 0.2, "high": 0.4, "critical": 0.8
                    }.get(r["severity"], 0.1)
                    # Apply avoidance filters
                    if "high_noise" in avoid and r["signal_type"] == "noise":
                        continue
                    if "anomaly_zones" in avoid and r["signal_type"] == "anomaly":
                        continue
                    if "high_vibration" in avoid and r["signal_type"] == "vibration":
                        continue
                    local_risk += severity_weight
                    nearby_reports.append({
                        "report_id": r["report_id"],
                        "dist_m": round(dist, 1),
                        "severity": r["severity"],
                        "signal_type": r["signal_type"],
                    })

            # Query local sensors at this waypoint
            local_sensors = self.fusion.query_fused(lat, lon, 100)
            sensor_risk = local_sensors["ambient_score"] * 0.3
            local_risk += sensor_risk

            predictions.append({
                "waypoint": i,
                "lat": lat,
                "lon": lon,
                "predicted_risk": min(local_risk, 1.0),
                "predicted_safety": max(1.0 - local_risk, 0.0),
                "confidence": 0.85,
                "nearest_reports": nearby_reports,
                "ambient_score": local_sensors["ambient_score"],
                "ambient_class": local_sensors["classification"],
            })

        self.routes_simulated += 1
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "start": start,
            "end": end,
            "mode": mode,
            "avoid": avoid,
            "preferences": preferences,
            "route": route,
            "outcome_predictions": predictions,
            "total_risk": sum(p["predicted_risk"] for p in predictions) / (n_waypoints + 1),
            "overall_safety": 1.0 - sum(p["predicted_risk"] for p in predictions) / (n_waypoints + 1),
            "heat_map_layer": "predicted_risk",
            "ws_url": "ws://api.csoai.org/ws/v1/simulate-route/{route_id}",
            "routes_simulated": self.routes_simulated,
        }


def main():
    parser = argparse.ArgumentParser(description="Sovereign Watchdog SIMULATE (Pillar 3)")
    parser.add_argument("--demo", action="store_true", help="Run a demo with sample data")
    parser.add_argument("--heatmap", type=str, default=None, help="Render heat map HTML for bbox (lat1,lon1,lat2,lon2)")
    parser.add_argument("--simulate", type=str, default=None, help="Simulate a route (start_lat,start_lon,end_lat,end_lon,mode)")
    args = parser.parse_args()

    wd = WD()
    fusion = SensorFusion()
    heat_engine = HeatMapEngine()
    heat_engine.reports = wd.reports  # share data
    sim = PreRouteSimulator(wd, fusion)

    if args.demo:
        # Add reports from all 4 actor types
        wd.report({
            "actor_type": "human", "actor_id": "did:csoai:sarah-001",
            "actor_name": "Sarah Jones",
            "lat": 51.5074, "lon": -0.1278,
            "signal_type": "noise", "severity": "high",
            "description": "Loud crash",
        })
        wd.report({
            "actor_type": "humanoid", "actor_id": "sovereign33-robot-001",
            "actor_name": "Sovereign33 Alpha",
            "lat": 51.5080, "lon": -0.1280,
            "signal_type": "anomaly", "severity": "critical",
            "description": "Anomalous vibration",
        })
        wd.report({
            "actor_type": "agent", "actor_id": "did:csoai:agent-monitor-001",
            "actor_name": "A2A Monitor Agent",
            "lat": 51.5090, "lon": -0.1260,
            "signal_type": "frequency", "severity": "medium",
            "description": "Unusual RF",
        })
        wd.report({
            "actor_type": "system", "actor_id": "iot-traffic-001",
            "actor_name": "Smart Traffic System",
            "lat": 51.5077, "lon": -0.1281,
            "signal_type": "presence", "severity": "low",
            "description": "High device density",
        })
        # Simulate a route
        result = sim.simulate(
            {"lat": 51.5074, "lon": -0.1278},
            {"lat": 51.5174, "lon": -0.1378},
            mode="humanoid",
            avoid=["high_noise", "anomaly_zones"],
        )
        print(json.dumps({
            "demo": "Sovereign Watchdog SIMULATE — Pillar 3",
            "reports": len(wd.reports),
            "route_length": len(result["route"]),
            "avg_risk": result["total_risk"],
            "overall_safety": result["overall_safety"],
            "first_3_predictions": result["outcome_predictions"][:3],
        }, indent=2))
    elif args.heatmap:
        bbox = [float(x) for x in args.heatmap.split(",")]
        print(heat_engine.render_html(bbox))
    elif args.simulate:
        parts = args.simulate.split(",")
        result = sim.simulate(
            {"lat": float(parts[0]), "lon": float(parts[1])},
            {"lat": float(parts[2]), "lon": float(parts[3])},
            mode=parts[4] if len(parts) > 4 else "humanoid",
        )
        print(json.dumps(result, indent=2))
    else:
        print("Usage: --demo OR --heatmap 'lat1,lon1,lat2,lon2' OR --simulate 'start_lat,start_lon,end_lat,end_lon,mode'")


if __name__ == '__main__':
    main()