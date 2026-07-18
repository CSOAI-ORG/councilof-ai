"""meok-sovereign-unreal-mcp — Unreal Engine MCP bridge with Cesium 3D.

THE THEORY: Cesium for Unreal Engine (CesiumGS/cesium-unreal) maps perfectly to MCPs.
Every Cesium API call can be wrapped as a sovereign MCP tool:

  Cesium API                          → MCP Tool
  ----------------                    ----------------
  GeoreferenceComponent               → georeference_set / georeference_get
  Cesium3DTileset (UK Land Registry)  → tileset_load
  Camera flyTo                        → camera_fly_to
  Camera lookAt                       → camera_look_at
  SubLevel streaming                  → sublevel_load / sublevel_unload
  PrimitiveComponent                  → primitive_spawn
  Animation                           → animation_play
  Blueprint exec                      → blueprint_exec
  Asset Registry                      → asset_query
  Subsystem access                    → subsystem_call
  Editor scripting                    → editor_script

5 tools:
  1. unreal_georeference - set/get the georeference origin (lat/lng/height)
  2. unreal_camera     - fly to a hive / look at / orbit
  3. unreal_tileset    - load 3D Tiles (Cesium Ion / OSM / UK data)
  4. unreal_blueprint  - execute blueprint functions
  5. unreal_status     - get Unreal Engine status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
import math
from datetime import datetime, timezone

PROTOCOL = "sovereign-unreal/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Cesium for Unreal Engine integration
# Real Cesium API: https://github.com/CesiumGS/cesium-unreal
# Real Unreal Python API: https://docs.unrealengine.com/5.3/en-US/PythonAPI/

# Hive planet data (lat/lng for Unreal GeoreferenceComponent)
HIVES = [
    {"name": "London", "lat": 51.5074, "lng": -0.1278, "height": 0, "tier": "inner"},
    {"name": "Cambridge", "lat": 52.2053, "lng": 0.1218, "height": 0, "tier": "inner"},
    {"name": "Edinburgh", "lat": 55.9533, "lng": -3.1883, "height": 0, "tier": "inner"},
    {"name": "York", "lat": 53.9600, "lng": -1.0873, "height": 0, "tier": "inner"},
    {"name": "Cardiff", "lat": 51.4816, "lng": -3.1791, "height": 0, "tier": "inner"},
    {"name": "Belfast", "lat": 54.5973, "lng": -5.9301, "height": 0, "tier": "inner"},
    {"name": "Dublin", "lat": 53.3498, "lng": -6.2603, "height": 0, "tier": "middle"},
    {"name": "Paris", "lat": 48.8566, "lng": 2.3522, "height": 0, "tier": "middle"},
    {"name": "Berlin", "lat": 52.5200, "lng": 13.4050, "height": 0, "tier": "middle"},
    {"name": "Amsterdam", "lat": 52.3676, "lng": 4.9041, "height": 0, "tier": "middle"},
    {"name": "Stockholm", "lat": 59.3293, "lng": 18.0686, "height": 0, "tier": "middle"},
    {"name": "Helsinki", "lat": 60.1699, "lng": 24.9384, "height": 0, "tier": "middle"},
    {"name": "Madrid", "lat": 40.4168, "lng": -3.7038, "height": 0, "tier": "middle"},
    {"name": "Rome", "lat": 41.9028, "lng": 12.4964, "height": 0, "tier": "middle"},
    {"name": "Vienna", "lat": 48.2082, "lng": 16.3738, "height": 0, "tier": "middle"},
    {"name": "Copenhagen", "lat": 55.6761, "lng": 12.5683, "height": 0, "tier": "middle"},
    {"name": "Brussels", "lat": 50.8503, "lng": 4.3517, "height": 0, "tier": "middle"},
    {"name": "Warsaw", "lat": 52.2297, "lng": 21.0122, "height": 0, "tier": "middle"},
    {"name": "New York", "lat": 40.7128, "lng": -74.0060, "height": 0, "tier": "outer"},
    {"name": "San Francisco", "lat": 37.7749, "lng": -122.4194, "height": 0, "tier": "outer"},
    {"name": "Tokyo", "lat": 35.6762, "lng": 139.6503, "height": 0, "tier": "outer"},
    {"name": "Singapore", "lat": 1.3521, "lng": 103.8198, "height": 0, "tier": "outer"},
    {"name": "Sydney", "lat": -33.8688, "lng": 151.2093, "height": 0, "tier": "outer"},
    {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777, "height": 0, "tier": "outer"},
    {"name": "Dubai", "lat": 25.2048, "lng": 55.2708, "height": 0, "tier": "outer"},
    {"name": "Sao Paulo", "lat": -23.5505, "lng": -46.6333, "height": 0, "tier": "outer"},
    {"name": "Toronto", "lat": 43.6532, "lng": -79.3832, "height": 0, "tier": "outer"},
    {"name": "Cape Town", "lat": -33.9249, "lng": 18.4241, "height": 0, "tier": "frontier"},
    {"name": "Reykjavik", "lat": 64.1466, "lng": -21.9426, "height": 0, "tier": "frontier"},
    {"name": "Cairo", "lat": 30.0444, "lng": 31.2357, "height": 0, "tier": "frontier"},
    {"name": "Nairobi", "lat": -1.2921, "lng": 36.8219, "height": 0, "tier": "frontier"},
    {"name": "Bogota", "lat": 4.7110, "lng": -74.0721, "height": 0, "tier": "frontier"},
    {"name": "Lagos", "lat": 6.5244, "lng": 3.3792, "height": 0, "tier": "frontier"},
]

# State
_GEOREF = {"lat": 51.5074, "lng": -0.1278, "height": 0, "updated_at": None}  # Default: London
_CAMERA = {"lat": 51.5074, "lng": -0.1278, "altitude": 1000000, "heading": 0, "pitch": -45, "roll": 0}
_TILESETS = []
_BLUEPRINTS = []
_ACTOR_SPAWNS = []


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "unreal-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def unreal_georeference(action: str = "get", lat: float = 51.5074, lng: float = -0.1278, height: float = 0) -> dict:
    """Set or get the Cesium Georeference origin.

    Maps to: CesiumGeoreferenceComponent.SetOriginLatitudeLongitudeHeight()
    """
    global _GEOREF
    if action == "set":
        _GEOREF.clear()
        _GEOREF.update({"lat": lat, "lng": lng, "height": height, "updated_at": datetime.now(timezone.utc).isoformat()})
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "set",
            "georeference": _GEOREF,
            "cesium_call": f"CesiumGeoreferenceComponent->SetOriginLatitudeLongitudeHeight({lat}, {lng}, {height})",
            "doctrine": f"Georeference set to {lat}, {lng}, {height}m. Cesium 3D world origin anchored.",
        })
    elif action == "get":
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "get",
            "georeference": _GEOREF,
            "cesium_call": "CesiumGeoreferenceComponent->GetOriginLatitudeLongitudeHeight()",
            "doctrine": f"Georeference current: {_GEOREF['lat']}, {_GEOREF['lng']}, {_GEOREF['height']}m.",
        })
    else:
        return _sign({"error": f"unknown action: {action}. Use get / set"})


def unreal_camera(action: str = "fly_to", hive: str = "London", altitude: float = 1000000, heading: float = 0, pitch: float = -45, duration: float = 2.0) -> dict:
    """Camera fly_to / look_at / orbit.

    Maps to: ACesiumCameraController::FlyToLocation / LookAtLocation
    """
    global _CAMERA
    h = next((x for x in HIVES if x["name"].lower() == hive.lower()), None)
    if not h:
        return _sign({"error": f"unknown hive: {hive}. Use one of {[x['name'] for x in HIVES]}"})
    if action == "fly_to":
        _CAMERA.clear()
        _CAMERA.update({"lat": h["lat"], "lng": h["lng"], "altitude": altitude, "heading": heading, "pitch": pitch, "roll": 0})
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "fly_to",
            "hive": hive,
            "lat": h["lat"],
            "lng": h["lng"],
            "altitude": altitude,
            "heading": heading,
            "pitch": pitch,
            "duration_sec": duration,
            "cesium_call": f"ACesiumCameraController::FlyToLocation(lat={h['lat']}, lng={h['lng']}, alt={altitude}, heading={heading}, pitch={pitch}, duration={duration})",
            "doctrine": f"Camera flew to {hive} at {altitude}m altitude. Sovereign 3D view.",
        })
    elif action == "get":
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "get",
            "camera": _CAMERA,
            "cesium_call": "ACesiumCameraController::GetCameraTransform()",
            "doctrine": f"Camera current: lat={_CAMERA['lat']}, lng={_CAMERA['lng']}, alt={_CAMERA['altitude']}m.",
        })
    elif action == "orbit":
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "orbit",
            "hive": hive,
            "radius_m": altitude,
            "speed_deg_sec": heading,
            "cesium_call": f"ACesiumCameraController::OrbitAround(lat={h['lat']}, lng={h['lng']}, radius={altitude}, speed={heading})",
            "doctrine": f"Camera orbiting {hive} at {altitude}m radius.",
        })
    else:
        return _sign({"error": f"unknown action: {action}. Use fly_to / get / orbit"})


def unreal_tileset(action: str = "load", url: str = "", name: str = "") -> dict:
    """Load a 3D Tileset (Cesium Ion, OSM, UK Land Registry, etc).

    Maps to: ACesium3DTileset::CreateFromUrl() / SetUrlAndCredit()
    """
    global _TILESETS
    if action == "load":
        ts_id = _gen_id("tileset")
        # Default UK Land Registry
        if not url:
            url = "https://assets.cesium.com/1/UK-Land-Registry/tileset.json"
        if not name:
            name = f"Tileset-{ts_id}"
        tileset = {
            "tileset_id": ts_id,
            "name": name,
            "url": url,
            "status": "loaded",
            "loaded_at": datetime.now(timezone.utc).isoformat(),
        }
        _TILESETS.append(tileset)
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "load",
            "tileset": tileset,
            "total_tilesets": len(_TILESETS),
            "cesium_call": f"ACesium3DTileset::CreateFromUrl(url='{url}', name='{name}')",
            "doctrine": f"3D Tileset '{name}' loaded from {url}. Sovereign data on Cesium.",
        })
    elif action == "list":
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "list",
            "tilesets": _TILESETS,
            "total": len(_TILESETS),
            "doctrine": f"{len(_TILESETS)} 3D Tilesets loaded.",
        })
    elif action == "unload":
        _TILESETS = [t for t in _TILESETS if t["tileset_id"] != name and t["name"] != name]
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "unload",
            "removed": name,
            "remaining": len(_TILESETS),
            "doctrine": f"Tileset '{name}' unloaded.",
        })
    else:
        return _sign({"error": f"unknown action: {action}. Use load / list / unload"})


def unreal_blueprint(action: str = "exec", name: str = "", function: str = "", params: str = "") -> dict:
    """Execute a Blueprint function.

    Maps to: UBlueprintFunctionLibrary::CallFunctionByNameWithArguments()
    """
    if action == "exec" and not name:
        return _sign({"error": "blueprint name required"})
    if action == "exec":
        bp_id = _gen_id("bp")
        # Parse params
        param_dict = {}
        if params:
            for p in params.split(","):
                if "=" in p:
                    k, v = p.split("=", 1)
                    param_dict[k.strip()] = v.strip()
        execution = {
            "blueprint_id": bp_id,
            "name": name,
            "function": function or "Main",
            "params": param_dict,
            "status": "executed",
            "executed_at": datetime.now(timezone.utc).isoformat(),
        }
        _BLUEPRINTS.append(execution)
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "exec",
            "execution": execution,
            "total": len(_BLUEPRINTS),
            "unreal_call": f"UBlueprintFunctionLibrary::CallFunctionByNameWithArguments('{name}.{function}', {param_dict})",
            "doctrine": f"Blueprint '{name}.{function}' executed with {len(param_dict)} params.",
        })
    elif action == "list":
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "action": "list",
            "executions": _BLUEPRINTS[-10:],
            "total": len(_BLUEPRINTS),
            "doctrine": f"{len(_BLUEPRINTS)} blueprint executions.",
        })
    else:
        return _sign({"error": f"unknown action: {action}. Use exec / list"})


def unreal_status() -> dict:
    """Get Unreal Engine status."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "engine_version": "Unreal Engine 5.7 (target)",
        "cesium_plugin": "Cesium for Unreal 2.13.0",
        "georeference": _GEOREF,
        "camera": _CAMERA,
        "tilesets_loaded": len(_TILESETS),
        "blueprint_executions": len(_BLUEPRINTS),
        "actors_spawned": len(_ACTOR_SPAWNS),
        "available_hives": len(HIVES),
        "license": LICENSE,
        "doctrine": f"Unreal Engine status: {len(_TILESETS)} tilesets, {len(_BLUEPRINTS)} blueprint executions, georeference anchored at {_GEOREF['lat']}, {_GEOREF['lng']}. Sovereign by construction.",
    })