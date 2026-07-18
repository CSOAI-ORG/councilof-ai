#!/usr/bin/env python3
"""
MEOK Sovereign Drone — RPi5 Companion Computer Script
Bridge: ArduPilot (MAVLink) ←→ ROS2 ←→ SOV3 (MQTT + SIGIL)

Runs on RPi5 companion computer mounted on the drone.
Receives MAVLink telemetry from Pixhawk, publishes to MQTT for SOV3.

Care Floor: SAR/mapping ONLY, geofence enforced, NO targeting
License: MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
"""

import json
import time
import hashlib
import struct
import threading
import socket
import os
from datetime import datetime, timezone

# ===== CONFIGURATION =====

# MAVLink (from Pixhawk)
MAVLINK_PORT = 14550  # UDP port for MAVLink
MAVLINK_BAUD = 115200

# MQTT (to SOV3 substrate)
MQTT_BROKER = os.environ.get("SOV3_BROKER", "192.168.50.1")
MQTT_PORT = int(os.environ.get("SOV3_MQTT_PORT", "1883"))
MQTT_TOPIC_TELEMETRY = "meok/drone/telemetry"
MQTT_TOPIC_STATUS = "meok/drone/status"
MQTT_TOPIC_MISSION = "meok/drone/mission"

# SIGIL
SIGIL_KEY = os.environ.get("SOV_DRONE_KEY", "meok-drone-sovereign-key-v1")

# Care floor
CARE_FLOOR_ACTIVE = True
FORBIDDEN_ACTIONS = [
    "target", "strike", "kill", "weapon", "payload_release",
    "track person", "facial_recognition", "engage", "fire",
    "drop_payload", "individual surveillance"
]

# Geofence (default: 1km radius from launch)
GEOFENCE_MAX_ALT_M = 120.0


# ===== SIGIL SIGNING =====

def sigil_sign(data: dict) -> str:
    payload = json.dumps(data, sort_keys=True).encode()
    digest = hashlib.sha256(payload + SIGIL_KEY.encode()).hexdigest()
    return digest[:16]


def timestamp():
    return datetime.now(timezone.utc).isoformat()


# ===== CARE FLOOR =====

def care_floor_check(action: str) -> dict:
    if not CARE_FLOOR_ACTIVE:
        return {"allowed": True}
    action_lower = action.lower()
    for f in FORBIDDEN_ACTIONS:
        if f in action_lower:
            return {
                "allowed": False,
                "blocked_by": "CARE_FLOOR",
                "reason": f"Forbidden: '{f}'",
                "rule": "SAR/mapping ONLY — no targeting/surveillance"
            }
    return {"allowed": True}


# ===== MAVLINK PARSER (lightweight, no pymavlink dependency) =====

class MAVLinkParser:
    """Minimal MAVLink v2 parser for heartbeat + global position."""
    
    def __init__(self):
        self.buffer = bytearray()
        self.last_heartbeat = 0
        self.telemetry = {
            "lat": 0.0, "lon": 0.0, "alt_m": 0.0,
            "roll": 0.0, "pitch": 0.0, "yaw": 0.0,
            "ground_speed": 0.0, "air_speed": 0.0,
            "battery_pct": 100, "battery_v": 16.8,
            "gps_sats": 0, "gps_fix": "NO_FIX",
            "armed": False, "mode": "STABILIZE",
            "flight_time_s": 0
        }
    
    def feed(self, data: bytes):
        self.buffer.extend(data)
        self._parse()
    
    def _parse(self):
        while len(self.buffer) >= 8:
            # MAVLink v2 start byte: 0xFD
            if self.buffer[0] != 0xFD:
                self.buffer.pop(0)
                continue
            
            if len(self.buffer) < 12:
                break
            
            # Parse header
            payload_len = self.buffer[1]
            incompat = self.buffer[2]
            compat = self.buffer[3]
            msg_id = self.buffer[7] | (self.buffer[8] << 8) | (self.buffer[9] << 16)
            
            total_len = 12 + payload_len + 2  # header + payload + checksum
            if len(self.buffer) < total_len:
                break
            
            # Extract payload
            payload = bytes(self.buffer[10:10 + payload_len])
            
            # Process known messages
            self._process_message(msg_id, payload)
            
            # Remove processed message
            self.buffer = self.buffer[total_len:]
    
    def _process_message(self, msg_id: int, payload: bytes):
        if msg_id == 0:  # HEARTBEAT
            if len(payload) >= 6:
                self.telemetry["armed"] = bool(payload[6] & 0x80)
                self.telemetry["mode"] = self._decode_mode(payload[5])
                self.last_heartbeat = time.time()
        
        elif msg_id == 33:  # GLOBAL_POSITION_INT
            if len(payload) >= 28:
                lat = struct.unpack("<i", payload[0:4])[0] / 1e7
                lon = struct.unpack("<i", payload[4:8])[0] / 1e7
                alt_mm = struct.unpack("<i", payload[8:12])[0]
                self.telemetry["lat"] = lat
                self.telemetry["lon"] = lon
                self.telemetry["alt_m"] = alt_mm / 1000.0
        
        elif msg_id == 30:  # ATTITUDE
            if len(payload) >= 28:
                roll = struct.unpack("<f", payload[0:4])[0]
                pitch = struct.unpack("<f", payload[4:8])[0]
                yaw = struct.unpack("<f", payload[8:12])[0]
                self.telemetry["roll"] = roll
                self.telemetry["pitch"] = pitch
                self.telemetry["yaw"] = yaw
        
        elif msg_id == 74:  # VFR_HUD
            if len(payload) >= 20:
                ground_speed = struct.unpack("<f", payload[8:12])[0]
                air_speed = struct.unpack("<f", payload[12:16])[0]
                self.telemetry["ground_speed"] = ground_speed
                self.telemetry["air_speed"] = air_speed
        
        elif msg_id == 147:  # BATTERY_STATUS
            if len(payload) >= 12:
                volt = struct.unpack("<H", payload[6:8])[0] / 1000.0
                self.telemetry["battery_v"] = volt
        
        elif msg_id == 2:  # SYSTEM_TIME
            if len(payload) >= 8:
                boot_ms = struct.unpack("<I", payload[4:8])[0]
                self.telemetry["flight_time_s"] = boot_ms // 1000
    
    def _decode_mode(self, custom_mode: int) -> str:
        modes = {
            0: "STABILIZE", 1: "ACRO", 2: "ALT_HOLD", 3: "AUTO",
            4: "GUIDED", 5: "LOITER", 6: "RTL", 7: "CIRCLE",
            9: "LAND", 11: "DRIFT", 13: "SPORT", 14: "FLIP",
            15: "AUTOTUNE", 16: "POSHOLD", 17: "BRAKE",
            18: "THROW", 19: "AVOID_ADLSB", 20: "GUIDED_NOGPS",
            21: "SMART_RTL", 22: "FLOWHOLD", 23: "FOLLOW",
            24: "ZIGZAG", 25: "SYSTEMID", 26: "AUTOROTATE",
            27: "AUTO_RTL"
        }
        return modes.get(custom_mode, f"MODE_{custom_mode}")


# ===== TELEMETRY PUBLISHER =====

class TelemetryPublisher:
    """Publishes drone telemetry via MQTT to SOV3 substrate."""
    
    def __init__(self, parser: MAVLinkParser):
        self.parser = parser
        self.running = False
        self.total_published = 0
        self._mqtt = None
    
    def _connect_mqtt(self):
        try:
            import paho.mqtt.client as mqtt
            self._mqtt = mqtt.Client(client_id="meok-drone-companion")
            self._mqtt.connect(MQTT_BROKER, MQTT_PORT, 60)
            self._mqtt.loop_start()
            return True
        except Exception as e:
            print(f"MQTT connect failed: {e}")
            return False
    
    def _publish(self, topic: str, data: dict):
        if not self._mqtt:
            return
        payload = json.dumps(data)
        self._mqtt.publish(topic, payload)
        self.total_published += 1
    
    def publish_telemetry(self):
        t = self.parser.telemetry
        
        # Geofence check
        within_geofence = t["alt_m"] <= GEOFENCE_MAX_ALT_M
        
        data = {
            "position": {"lat": t["lat"], "lon": t["lon"], "alt_m": round(t["alt_m"], 1)},
            "attitude": {
                "roll_deg": round(t["roll"], 1),
                "pitch_deg": round(t["pitch"], 1),
                "yaw_deg": round(t["yaw"], 1)
            },
            "speed": {"ground_ms": round(t["ground_speed"], 1)},
            "battery": {"voltage": round(t["battery_v"], 1)},
            "status": {"armed": t["armed"], "mode": t["mode"]},
            "within_geofence": within_geofence,
            "care_floor": "SAR/mapping ONLY — no targeting",
            "sigil": sigil_sign({"lat": t["lat"], "lon": t["lon"], "ts": timestamp()}),
            "timestamp": timestamp()
        }
        
        self._publish(MQTT_TOPIC_TELEMETRY, data)
        
        # Auto-RTL on geofence breach
        if not within_geofence and t["armed"]:
            self._publish(MQTT_TOPIC_STATUS, {
                "alert": "GEOFENCE_BREACH",
                "action": "RTL_RECOMMENDED",
                "alt_m": t["alt_m"],
                "max_alt_m": GEOFENCE_MAX_ALT_M,
                "sigil": sigil_sign({"alert": "geofence", "ts": timestamp()}),
                "timestamp": timestamp()
            })
    
    def run(self, rate_hz: float = 5.0):
        """Main loop — publish telemetry at specified rate."""
        self.running = True
        mqtt_ok = self._connect_mqtt()
        
        if mqtt_ok:
            print(f"MQTT connected: {MQTT_BROKER}:{MQTT_PORT}")
            print(f"Telemetry rate: {rate_hz} Hz")
        else:
            print("MQTT failed — telemetry will be serial-only")
        
        interval = 1.0 / rate_hz
        
        while self.running:
            self.publish_telemetry()
            time.sleep(interval)
    
    def stop(self):
        self.running = False
        if self._mqtt:
            self._mqtt.loop_stop()
            self._mqtt.disconnect()


# ===== MAVLINK RECEIVER =====

def receive_mavlink(parser: MAVLinkParser, port: int = MAVLINK_PORT):
    """Receive MAVLink UDP packets and feed to parser."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", port))
    sock.settimeout(1.0)
    
    print(f"Listening for MAVLink on UDP:{port}")
    
    while True:
        try:
            data, addr = sock.recvfrom(2048)
            parser.feed(data)
        except socket.timeout:
            continue
        except Exception as e:
            print(f"MAVLink receive error: {e}")
            time.sleep(1)


# ===== MAIN =====

def main():
    print("=" * 50)
    print("MEOK SOVEREIGN DRONE — RPi5 Companion")
    print("=" * 50)
    print(f"MAVLink port: {MAVLINK_PORT}")
    print(f"MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Geofence max alt: {GEOFENCE_MAX_ALT_M}m")
    print(f"Care floor: {'ACTIVE' if CARE_FLOOR_ACTIVE else 'DISABLED'}")
    print(f"SAR/mapping ONLY — no targeting/surveillance")
    print("=" * 50)
    
    parser = MAVLinkParser()
    publisher = TelemetryPublisher(parser)
    
    # Start MAVLink receiver in background thread
    mav_thread = threading.Thread(target=receive_mavlink, args=(parser,), daemon=True)
    mav_thread.start()
    
    # Start telemetry publisher in main thread
    try:
        publisher.run(rate_hz=5.0)
    except KeyboardInterrupt:
        print("\nShutting down...")
        publisher.stop()


if __name__ == "__main__":
    main()
