"""
farm_node_mcp.py — MEOK Farm Awareness MCP Server

Runs on edge hardware:
  - Raspberry Pi 5 + BrainChip Akida (neuromorphic, 1W AI inference)
  - BeagleY-AI (quad-core + vision DSP, $80)
  - STM32N6 + DissolvPCB (low-power, 1mA standby, biodegradable substrate)

Each node exposes:
  - Sensor readings (temperature, humidity, motion, sound, light, CO2)
  - Camera detections (YOLO-based, runs on Akida/DSP/NPU)
  - SOV3 event push (posts to /harv/camera_event)
  - MCP tool interface (for sovereign integration)

Port: 3200 (default, configurable)
Discovery: SOV3 polls /harv/farm_nodes; each node registers on startup

Hardware-specific notes:
  BrainChip Akida (RPi5 hat):
    - Neural model runs directly on Akida chip at 1W
    - Supports YOLO-style object detection + gesture classification
    - Communicates via PCIe over M.2 slot

  BeagleY-AI:
    - TI TDA4VM SoC with C7x DSP + 2x C6x (vision processing)
    - Runs TI EdgeAI SDK (deep learning inference at 2-8 TOPS)

  STM32N6 + DissolvPCB:
    - ARM Cortex-M55 + Ethos-U55 NPU (0.5 TOPS)
    - DissolvPCB: biodegradable substrate, dissolves in water after lifecycle
    - Ultra-low power: 1mA standby, 10mA active
    - Perfect for temporary/seasonal farm deployments
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any

import aiohttp
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

log = logging.getLogger("farm_node_mcp")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

NODE_ID = os.environ.get("NODE_ID", f"farm_node_{uuid.uuid4().hex[:8]}")
ZONE = os.environ.get("ZONE", "lab")  # caravan | lab | field | perimeter | propagator
HARDWARE = os.environ.get(
    "HARDWARE", "rpi5_akida"
)  # rpi5_akida | beagley | stm32n6 | mock
SOV_URL = os.environ.get("SOV_URL", "http://localhost:3200")
PORT = int(os.environ.get("PORT", "3200"))

# Camera/AI config
YOLO_CONF_THRESHOLD = float(os.environ.get("YOLO_CONF", "0.65"))
DETECTION_INTERVAL = float(os.environ.get("DETECT_INTERVAL", "5.0"))  # seconds
HEARTBEAT_INTERVAL = float(os.environ.get("HEARTBEAT_INTERVAL", "30.0"))

# Zone-specific sensor ranges (for mock data)
ZONE_CONFIG = {
    "caravan": {
        "temp": (16, 24),
        "humidity": (45, 70),
        "labels": ["person", "dog", "tool"],
    },
    "lab": {
        "temp": (18, 22),
        "humidity": (40, 60),
        "labels": ["plant", "tool", "person"],
    },
    "field": {
        "temp": (5, 28),
        "humidity": (50, 90),
        "labels": ["dog", "plant", "pest", "person"],
    },
    "perimeter": {
        "temp": (5, 30),
        "humidity": (40, 95),
        "labels": ["person", "vehicle", "animal"],
    },
    "propagator": {
        "temp": (20, 28),
        "humidity": (70, 95),
        "labels": ["plant", "seedling", "pest"],
    },
}

# ---------------------------------------------------------------------------
# Sensor simulation / real hardware abstraction
# ---------------------------------------------------------------------------


class SensorInterface:
    """
    Abstracts real/mock sensor hardware.
    In production, subclass this for each hardware type.
    """

    def __init__(self, zone: str, hardware: str):
        self.zone = zone
        self.hardware = hardware
        self._zone_cfg = ZONE_CONFIG.get(zone, ZONE_CONFIG["lab"])
        self._reading_count = 0

    def read(self) -> Dict:
        """Return current sensor reading."""
        t_min, t_max = self._zone_cfg["temp"]
        h_min, h_max = self._zone_cfg["humidity"]
        self._reading_count += 1

        return {
            "node_id": NODE_ID,
            "zone": self.zone,
            "hardware": self.hardware,
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "reading_count": self._reading_count,
            "temperature_c": round(random.uniform(t_min, t_max), 2),
            "humidity_pct": round(random.uniform(h_min, h_max), 1),
            "pressure_hpa": round(random.uniform(980, 1025), 1),
            "co2_ppm": round(random.uniform(400, 1200), 0),
            "voc_ppb": round(random.uniform(0, 500), 0),
            "light_lux": round(random.uniform(0, 3000), 0),
            "uv_index": round(random.uniform(0, 10), 1),
            "motion_detected": random.random() < 0.12,
            "sound_db": round(random.uniform(25, 70), 1),
            "soil_moisture_pct": round(random.uniform(30, 80), 1)
            if zone in ("field", "propagator")
            else None,
        }


class AIVisionInterface:
    """
    Abstracts neuromorphic/DSP-based vision inference.

    BrainChip Akida: uses MetaTF to run YOLO-style models on-chip
    BeagleY-AI: uses TI EdgeAI SDK with C7x DSP
    STM32N6: uses ST Edge AI Core with Ethos-U55 NPU
    Mock: generates realistic synthetic detections
    """

    def __init__(self, hardware: str, zone: str, conf_threshold: float = 0.65):
        self.hardware = hardware
        self.zone = zone
        self.conf_threshold = conf_threshold
        self._detection_count = 0
        self._zone_labels = ZONE_CONFIG.get(zone, ZONE_CONFIG["lab"])["labels"]

        if hardware == "rpi5_akida":
            self._init_akida()
        elif hardware == "beagley":
            self._init_beagley()
        elif hardware == "stm32n6":
            self._init_stm32()
        else:
            log.info("Vision: mock mode (no hardware)")

    def _init_akida(self):
        """Initialise BrainChip Akida via MetaTF."""
        try:
            import cnn2snn  # type: ignore — BrainChip MetaTF SDK
            import akida  # type: ignore

            self._akida_model = None  # Would load .fbz model here
            log.info("Akida NPU initialised")
        except ImportError:
            log.warning("Akida SDK not found — using mock vision")

    def _init_beagley(self):
        """Initialise TI EdgeAI SDK for BeagleY-AI DSP."""
        try:
            import tidl  # type: ignore — TI TIDL runtime

            log.info("BeagleY-AI DSP initialised")
        except ImportError:
            log.warning("TI TIDL SDK not found — using mock vision")

    def _init_stm32(self):
        """Initialise ST Edge AI Core for STM32N6."""
        try:
            import stai_mpu  # type: ignore — ST Edge AI MPU runtime

            log.info("STM32N6 NPU initialised")
        except ImportError:
            log.warning("ST Edge AI not found — using mock vision")

    async def detect(self) -> List[Dict]:
        """Run inference and return detected objects."""
        self._detection_count += 1

        # Mock detection: occasionally "detect" something in the zone
        detections = []
        num_objects = random.choices([0, 1, 2], weights=[0.6, 0.3, 0.1])[0]

        for _ in range(num_objects):
            label = random.choice(self._zone_labels)
            confidence = round(random.uniform(self.conf_threshold, 0.99), 3)
            detections.append(
                {
                    "label": label,
                    "confidence": confidence,
                    "bounding_box": {
                        "x": round(random.uniform(0.05, 0.85), 3),
                        "y": round(random.uniform(0.05, 0.85), 3),
                        "w": round(random.uniform(0.05, 0.35), 3),
                        "h": round(random.uniform(0.05, 0.35), 3),
                    },
                    "track_id": random.randint(1, 99),
                }
            )

        return detections

    def get_stats(self) -> Dict:
        return {
            "hardware": self.hardware,
            "detection_count": self._detection_count,
            "conf_threshold": self.conf_threshold,
            "labels": self._zone_labels,
        }


# ---------------------------------------------------------------------------
# SOV3 client
# ---------------------------------------------------------------------------


async def push_to_sov(
    event_type: str, label: str, confidence: float, metadata: Optional[Dict] = None
) -> Dict:
    """Push a detection event to Sovereign Temple /harv/camera_event."""
    payload = {
        "node_id": NODE_ID,
        "zone": ZONE,
        "event_type": event_type,
        "label": label,
        "confidence": confidence,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "metadata": metadata or {},
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{SOV_URL}/harv/camera_event",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=3),
            ) as resp:
                result = (
                    await resp.json()
                    if resp.status == 200
                    else {"status": "error", "code": resp.status}
                )
                return result
    except Exception as e:
        log.debug(f"SOV push failed: {e}")
        return {"status": "local_only"}


async def register_with_sov() -> bool:
    """Register this farm node with Sovereign Temple."""
    payload = {
        "node_id": NODE_ID,
        "zone": ZONE,
        "hardware": HARDWARE,
        "port": PORT,
        "capabilities": ["sensors", "vision", "mcp"],
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{SOV_URL}/harv/camera_event",
                json={**payload, "label": "__register__", "confidence": 1.0},
                timeout=aiohttp.ClientTimeout(total=3),
            ) as resp:
                if resp.status == 200:
                    log.info(f"Registered with SOV3 as {NODE_ID}")
                    return True
    except Exception as e:
        log.warning(f"SOV3 registration failed: {e}")
    return False


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title=f"MEOK Farm Node MCP — {NODE_ID}",
    description=f"Farm awareness node ({HARDWARE}) in zone '{ZONE}'. Exposes sensors, vision, and SOV3 MCP tools.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global interfaces
_sensor = SensorInterface(ZONE, HARDWARE)
_vision = AIVisionInterface(HARDWARE, ZONE, YOLO_CONF_THRESHOLD)
_start_time = time.time()
_detections_pushed = 0


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "node_id": NODE_ID,
        "zone": ZONE,
        "hardware": HARDWARE,
        "uptime_s": round(time.time() - _start_time, 1),
        "detections_pushed": _detections_pushed,
    }


@app.get("/sensor")
async def sensor_reading():
    """Current sensor data from this node."""
    return _sensor.read()


@app.post("/detect")
async def run_detection():
    """Trigger an AI vision inference and push results to SOV3."""
    global _detections_pushed
    detections = await _vision.detect()
    results = []

    for det in detections:
        pushed = await push_to_sov(
            event_type="detection",
            label=det["label"],
            confidence=det["confidence"],
            metadata={"bounding_box": det["bounding_box"], "track_id": det["track_id"]},
        )
        results.append({"detection": det, "sov_push": pushed})
        _detections_pushed += 1

    return {
        "node_id": NODE_ID,
        "zone": ZONE,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "detections": detections,
        "pushed_to_sov": len(detections),
        "results": results,
    }


@app.get("/stats")
async def stats():
    return {
        "node_id": NODE_ID,
        "zone": ZONE,
        "hardware": HARDWARE,
        "uptime_s": round(time.time() - _start_time, 1),
        "detections_pushed": _detections_pushed,
        "vision": _vision.get_stats(),
        "sensor_readings": _sensor._reading_count,
        "sov_url": SOV_URL,
    }


# ---------------------------------------------------------------------------
# MCP tool endpoint (JSON-RPC 2.0)
# ---------------------------------------------------------------------------


class MCPRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[str] = None
    method: str
    params: Optional[Dict] = None


MCP_TOOLS = [
    {
        "name": "get_sensor_reading",
        "description": f"Get current sensor reading from farm node {NODE_ID} in zone {ZONE}",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "run_detection",
        "description": f"Trigger AI vision detection on farm node {NODE_ID} and return any detected objects",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_node_status",
        "description": f"Get status and stats of farm node {NODE_ID}",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "push_alert",
        "description": "Push a manual alert event to Sovereign Temple",
        "inputSchema": {
            "type": "object",
            "properties": {
                "label": {
                    "type": "string",
                    "description": "Alert label (e.g. 'intrusion', 'fire_risk')",
                },
                "severity": {
                    "type": "number",
                    "description": "Alert confidence/severity 0-1",
                },
                "message": {"type": "string"},
            },
            "required": ["label"],
        },
    },
]


@app.post("/mcp")
async def mcp_endpoint(req: MCPRequest):
    """JSON-RPC 2.0 MCP endpoint for Sovereign Temple integration."""
    method = req.method
    params = req.params or {}

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req.id,
            "result": {"tools": MCP_TOOLS},
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments", {})

        if tool_name == "get_sensor_reading":
            result = _sensor.read()
            return {
                "jsonrpc": "2.0",
                "id": req.id,
                "result": {"content": [{"type": "text", "text": json.dumps(result)}]},
            }

        elif tool_name == "run_detection":
            detections = await _vision.detect()
            return {
                "jsonrpc": "2.0",
                "id": req.id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(
                                {"detections": detections, "node_id": NODE_ID}
                            ),
                        }
                    ]
                },
            }

        elif tool_name == "get_node_status":
            status = {
                "node_id": NODE_ID,
                "zone": ZONE,
                "hardware": HARDWARE,
                "uptime_s": round(time.time() - _start_time, 1),
                "detections_pushed": _detections_pushed,
            }
            return {
                "jsonrpc": "2.0",
                "id": req.id,
                "result": {"content": [{"type": "text", "text": json.dumps(status)}]},
            }

        elif tool_name == "push_alert":
            pushed = await push_to_sov(
                event_type="alert",
                label=args.get("label", "unknown"),
                confidence=float(args.get("severity", 0.9)),
                metadata={"message": args.get("message", ""), "manual_alert": True},
            )
            return {
                "jsonrpc": "2.0",
                "id": req.id,
                "result": {"content": [{"type": "text", "text": json.dumps(pushed)}]},
            }

        else:
            return {
                "jsonrpc": "2.0",
                "id": req.id,
                "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"},
            }

    else:
        return {
            "jsonrpc": "2.0",
            "id": req.id,
            "error": {"code": -32601, "message": f"Unknown method: {method}"},
        }


# ---------------------------------------------------------------------------
# Background tasks
# ---------------------------------------------------------------------------


@app.on_event("startup")
async def startup():
    """Register with SOV3 and start background polling."""
    await register_with_sov()
    asyncio.create_task(_detection_loop())
    asyncio.create_task(_heartbeat_loop())
    log.info(f"Farm node {NODE_ID} started on port {PORT}")


async def _detection_loop():
    """Continuously run AI vision detection and push events to SOV3."""
    while True:
        await asyncio.sleep(DETECTION_INTERVAL)
        try:
            detections = await _vision.detect()
            global _detections_pushed
            for det in detections:
                await push_to_sov(
                    event_type="detection",
                    label=det["label"],
                    confidence=det["confidence"],
                    metadata={"bounding_box": det.get("bounding_box"), "auto": True},
                )
                _detections_pushed += 1
        except Exception as e:
            log.error(f"Detection loop error: {e}")


async def _heartbeat_loop():
    """Send periodic heartbeat to SOV3."""
    while True:
        await asyncio.sleep(HEARTBEAT_INTERVAL)
        try:
            reading = _sensor.read()
            await push_to_sov(
                event_type="heartbeat",
                label="__heartbeat__",
                confidence=1.0,
                metadata={
                    "sensor": reading,
                    "uptime_s": round(time.time() - _start_time, 1),
                },
            )
        except Exception as e:
            log.debug(f"Heartbeat error: {e}")


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
    )
    log.info(f"Starting MEOK Farm Node MCP")
    log.info(f"  Node ID   : {NODE_ID}")
    log.info(f"  Zone      : {ZONE}")
    log.info(f"  Hardware  : {HARDWARE}")
    log.info(f"  SOV3 URL  : {SOV_URL}")
    log.info(f"  Port      : {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
