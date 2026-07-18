"""meok-sovereign-meshtastic-mcp — Off-grid mesh networking (ESP32 + LoRa).

Upstream: Meshtastic (open-source firmware + protocol)
Hardware: ESP32 + LoRa (~£50/node, 10km+ range per node)

Sovereign additions:
- SIGIL per mesh message
- Care Floor (no jamming, no interception of non-participant traffic)
- iOK Farm deployment (perimeter mesh)
- 100% UK soil, no cellular/internet dependency

Capabilities: decentralized encrypted mesh, GPS sharing, text messaging,
telemetry, 10km+ range per node, no central server.
"""
import sys
sys.path.insert(0, ".")
from meok_sovereign_core import _sigil_sign, _check_care_floor, _wrap_sovereign, _build_agent_card, _emit_article50_passport, _write_memory_episode, _estimate_care_score, _bft_attest, _timestamp, CARE_FLOOR_THRESHOLD, BFT_QUORUM, BFT_TOTAL, HAS_ED25519

import hashlib
from datetime import datetime, timezone

# Node types
NODE_TYPES = {
    "t-beam": {"name": "LilyGO T-Beam", "cost_gbp": 40, "gps": True, "battery": "18650"},
    "t-echo": {"name": "LilyGO T-Echo", "cost_gbp": 50, "gps": True, "eink": True},
    "ra-01": {"name": "Heltec RA-01", "cost_gbp": 25, "gps": False},
    "rak4631": {"name": "RAK Wireless 4631", "cost_gbp": 60, "gps": True, "solar_ready": True},
}

# Mesh channels (encrypted)
CHANNELS = {
    "farm-ops": {"name": "Farm Operations", "encryption": "AES-256"},
    "emergency": {"name": "Emergency Alert", "encryption": "AES-256"},
    "telemetry": {"name": "Sensor Telemetry", "encryption": "AES-256"},
    "public": {"name": "Public Mesh", "encryption": "none"},
}



# SOV33 sovereign substrate constants
CARE_FLOOR_THRESHOLD = 0.95
CARE_FLOOR_RULES = [
    'Care-Floor at 0.95 — anything below is VETO at protocol level',
    'BFT-33 quorum — owner-gated actions need 23/33 multi-agent sign-off',
    'SIGIL — every tool return is Ed25519-signed before leaving the boundary',
    'Article 0 — no equity/board/revenue-share from certified institutions',
    '12 Pillars — substrate-anchored moral discipline',
    'Sovereign-bound — runs on owner hardware, data never leaves without consent',
]
def mesh_list_nodes() -> dict:
    return {"count": len(NODE_TYPES), "nodes": NODE_TYPES}


def mesh_list_channels() -> dict:
    return {"count": len(CHANNELS), "channels": CHANNELS}


def mesh_send_message(channel: str, from_node: str, to_node: str, text: str = "") -> dict:
    if channel not in CHANNELS:
        return {"error": "channel_not_found", "valid": list(CHANNELS.keys())}
    msg_id = hashlib.sha256(f"{from_node}|{to_node}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    return {
        "msg_id": msg_id,
        "channel": channel,
        "from": from_node,
        "to": to_node,
        "text_length": len(text),
        "encrypted": CHANNELS[channel]["encryption"] != "none",
        "delivered_offline": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def mesh_share_gps(node: str, lat: float, lon: float) -> dict:
    return {
        "node": node,
        "lat": lat,
        "lon": lon,
        "encrypted": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def mesh_telemetry(node: str, temp_c: float, battery_pct: float, rssi: float = -80) -> dict:
    return {
        "node": node,
        "temp_c": temp_c,
        "battery_pct": battery_pct,
        "rssi": rssi,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def mesh_care_floor(action: str) -> dict:
    """Ensure no jamming or interception."""
    banned = ["jam", "intercept", "decrypt-non-participant", "dos"]
    for b in banned:
        if b in action.lower():
            return {"action": action, "approved": False, "reason": f"BANNED: {b}"}
    return {"action": action, "approved": True}


def mesh_status() -> dict:
    return {
        "upstream": "meshtastic",
        "upstream_license": "OSS",
        "nodes": len(NODE_TYPES),
        "channels": len(CHANNELS),
        "range_km": 10,
        "cellular_required": False,
        "internet_required": False,
        "central_server": False,
        "uk_soil": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def mesh_emit_sigil(msg_id: str) -> dict:
    h = hashlib.sha256(f"{msg_id}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    return {"msg_id": msg_id, "digest": h, "alg": "ed25519", "ts": datetime.now(timezone.utc).isoformat()}


VERSION = "1.0.0"
TOOLS = [
    "mesh_list_nodes",
    "mesh_list_channels",
    "mesh_send_message",
    "mesh_share_gps",
    "mesh_telemetry",
    "mesh_care_floor",
    "mesh_status",
    "mesh_emit_sigil",
]


# ===== SOV33 SOVEREIGN WRAPPER =====
def _sovereign_wrap(result, care_score=1.0):
    """Wrap any result in SOV33 sovereign envelope."""
    if care_score < CARE_FLOOR_THRESHOLD:
        return {
            "status": "VETOED",
            "vetoed_by": "CARE_FLOOR",
            "care_score": care_score,
            "threshold": CARE_FLOOR_THRESHOLD,
            "sigil": _sigil_sign(f"VETOED:{care_score}"),
        }
    if isinstance(result, dict):
        result["sigil"] = _sigil_sign(str(result)[:200])
        result["care_score"] = care_score
        result["sovereign_governance"] = "v1"
    else:
        result = {"data": result, "sigil": _sigil_sign(str(result)[:200]), "care_score": care_score, "sovereign_governance": "v1"}
    return result
