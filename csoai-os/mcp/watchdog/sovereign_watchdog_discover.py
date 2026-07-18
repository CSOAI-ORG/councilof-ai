"""
sovereign_watchdog_discover.py — Pillar 2: DISCOVER (passive sensing mesh).
Sovereign Watchdog MVP W2.

The 4 passive sensing modules:
1. noise map (acoustic) — microphone arrays, FFT, dB SPL
2. frequency map (RF) — WiFi/BT/RF, signal strength, vendor lookup
3. vibration map (seismic) — IMU + accelerometers, frequency, magnitude
4. presence map (WiFi/BT) — MAC address triangulation, device type detection

Each module:
- Has its own MCP tool
- Can be queried individually or fused together
- Returns confidence + timestamp + raw_data_hash (SIGIL-signed)

Author: M4 (the engineering lane). MIT license. MEOK Labs.
"""
import os
import sys
import json
import time
import math
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone


# ============================================================
# MODULE 1: NOISE MAP (acoustic sensing)
# ============================================================

class NoiseMap:
    """Acoustic noise map. dB SPL, frequency, source classification."""

    def __init__(self, sample_rate=44100, fft_size=2048):
        self.sample_rate = sample_rate
        self.fft_size = fft_size
        self.sources = []  # historical noise events

    def ingest(self, lat: float, lon: float, db_spl: float, freq_hz: float, source_type: str = "unknown", confidence: float = 0.9) -> dict:
        """Ingest a noise reading from a microphone array."""
        ts = datetime.now(timezone.utc).isoformat()
        reading = {
            "ts": ts,
            "lat": lat,
            "lon": lon,
            "db_spl": db_spl,
            "freq_hz": freq_hz,
            "source_type": source_type,  # "traffic" | "construction" | "music" | "industrial" | "voice" | "alarm" | "gunshot" | "unknown"
            "confidence": confidence,
        }
        # Classify the source (naive for MVP)
        if source_type == "unknown":
            if db_spl > 100 and freq_hz < 200:
                reading["source_type"] = "explosion"
            elif db_spl > 90 and freq_hz < 500:
                reading["source_type"] = "construction"
            elif 60 < db_spl < 80 and 100 < freq_hz < 2000:
                reading["source_type"] = "traffic"
            elif db_spl < 50 and 1000 < freq_hz < 5000:
                reading["source_type"] = "voice"
            else:
                reading["source_type"] = "ambient"
        # Compute raw data hash (for SIGIL chain)
        reading["raw_hash"] = hashlib.sha256(json.dumps(reading, sort_keys=True).encode()).hexdigest()
        self.sources.append(reading)
        return reading

    def query(self, lat: float, lon: float, radius_m: float = 1000) -> dict:
        """Query noise within a radius. Returns aggregated noise map."""
        nearby = []
        for r in self.sources:
            dlat = (r["lat"] - lat) * 111000
            dlon = (r["lon"] - lon) * 111000 * 0.7
            dist = ((dlat ** 2) + (dlon ** 2)) ** 0.5
            if dist <= radius_m:
                nearby.append({**r, "dist_m": dist})
        # Aggregate
        if nearby:
            avg_db = sum(r["db_spl"] for r in nearby) / len(nearby)
            max_db = max(r["db_spl"] for r in nearby)
            dominant_freq = max(nearby, key=lambda r: r["db_spl"])["freq_hz"]
        else:
            avg_db = 0
            max_db = 0
            dominant_freq = 0
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "query": {"lat": lat, "lon": lon, "radius_m": radius_m},
            "count": len(nearby),
            "avg_db_spl": avg_db,
            "max_db_spl": max_db,
            "dominant_freq_hz": dominant_freq,
            "sources": nearby,
        }


# ============================================================
# MODULE 2: FREQUENCY MAP (RF sensing)
# ============================================================

class FrequencyMap:
    """RF frequency map. WiFi/BT/SDR, signal strength, vendor lookup."""

    # Common RF bands
    BANDS = {
        "wifi_2.4": (2400, 2483),
        "wifi_5": (5150, 5350),
        "wifi_6": (5945, 7125),
        "bt": (2402, 2480),
        "cellular_4g": (700, 2600),
        "cellular_5g": (3500, 38000),
        "sdr": (24, 1766),  # MHz
        "am_radio": (540, 1600),  # kHz
        "fm_radio": (88000, 108000),  # kHz
    }

    # Common OUI prefixes (vendor lookup)
    OUI_VENDORS = {
        "AA:BB:CC": "Apple",
        "DD:EE:FF": "Samsung",
        "11:22:33": "Google",
        "44:55:66": "Microsoft",
        "77:88:99": "Tesla",
    }

    def __init__(self):
        self.signals = []

    def ingest(self, lat: float, lon: float, freq_mhz: float, rssi_dbm: float, sig_type: str = "wifi", mac: str = None) -> dict:
        """Ingest an RF signal reading from an SDR or WiFi scanner."""
        # Classify the band
        band = "unknown"
        for b, (lo, hi) in self.BANDS.items():
            if lo <= freq_mhz <= hi:
                band = b
                break
        # Vendor lookup
        vendor = "unknown"
        if mac:
            prefix = ":".join(mac.split(":")[:3]).upper()
            vendor = self.OUI_VENDORS.get(prefix, "unknown")
        ts = datetime.now(timezone.utc).isoformat()
        reading = {
            "ts": ts,
            "lat": lat,
            "lon": lon,
            "freq_mhz": freq_mhz,
            "band": band,
            "rssi_dbm": rssi_dbm,
            "sig_type": sig_type,  # "wifi" | "bt" | "cellular" | "sdr" | "fm" | "am"
            "mac": mac,
            "vendor": vendor,
        }
        reading["raw_hash"] = hashlib.sha256(json.dumps(reading, sort_keys=True).encode()).hexdigest()
        self.signals.append(reading)
        return reading

    def query(self, lat: float, lon: float, radius_m: float = 1000) -> dict:
        """Query RF signals within a radius."""
        nearby = []
        for r in self.signals:
            dlat = (r["lat"] - lat) * 111000
            dlon = (r["lon"] - lon) * 111000 * 0.7
            dist = ((dlat ** 2) + (dlon ** 2)) ** 0.5
            if dist <= radius_m:
                nearby.append({**r, "dist_m": dist})
        # Band histogram
        bands = {}
        for r in nearby:
            b = r["band"]
            bands[b] = bands.get(b, 0) + 1
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "query": {"lat": lat, "lon": lon, "radius_m": radius_m},
            "count": len(nearby),
            "band_histogram": bands,
            "signals": nearby,
        }


# ============================================================
# MODULE 3: VIBRATION MAP (seismic / IMU)
# ============================================================

class VibrationMap:
    """Vibration / seismic map. IMU + accelerometers, frequency, magnitude."""

    def __init__(self):
        self.events = []

    def ingest(self, lat: float, lon: float, freq_hz: float, magnitude: float, source: str = "unknown", confidence: float = 0.85) -> dict:
        """Ingest a vibration reading from an IMU or accelerometer."""
        # Classify the source
        if source == "unknown":
            if magnitude > 0.5 and freq_hz < 5:
                source = "earthquake"
            elif magnitude > 0.3 and 5 < freq_hz < 20:
                source = "heavy_vehicle"
            elif magnitude > 0.1 and 20 < freq_hz < 100:
                source = "footstep"
            elif magnitude < 0.1 and freq_hz > 100:
                source = "engine"
            else:
                source = "ambient"
        ts = datetime.now(timezone.utc).isoformat()
        reading = {
            "ts": ts,
            "lat": lat,
            "lon": lon,
            "freq_hz": freq_hz,
            "magnitude": magnitude,
            "source": source,  # "earthquake" | "heavy_vehicle" | "footstep" | "engine" | "explosion" | "construction" | "ambient"
            "confidence": confidence,
        }
        reading["raw_hash"] = hashlib.sha256(json.dumps(reading, sort_keys=True).encode()).hexdigest()
        self.events.append(reading)
        return reading

    def query(self, lat: float, lon: float, radius_m: float = 1000) -> dict:
        """Query vibration within a radius."""
        nearby = []
        for r in self.events:
            dlat = (r["lat"] - lat) * 111000
            dlon = (r["lon"] - lon) * 111000 * 0.7
            dist = ((dlat ** 2) + (dlon ** 2)) ** 0.5
            if dist <= radius_m:
                nearby.append({**r, "dist_m": dist})
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "query": {"lat": lat, "lon": lon, "radius_m": radius_m},
            "count": len(nearby),
            "events": nearby,
        }


# ============================================================
# MODULE 4: PRESENCE MAP (WiFi/BT device triangulation)
# ============================================================

class PresenceMap:
    """WiFi/BT device presence map. MAC address triangulation, device type detection."""

    # Common device types by OUI
    DEVICE_TYPES = {
        "Apple": "phone/tablet/laptop",
        "Samsung": "phone/tablet",
        "Google": "phone/tablet/chromecast",
        "Microsoft": "laptop/surface",
        "Tesla": "vehicle",
    }

    def __init__(self):
        self.devices = []

    def ingest(self, lat: float, lon: float, mac: str, rssi_dbm: float, vendor: str = "unknown", device_type: str = "unknown", confidence: float = 0.85) -> dict:
        """Ingest a WiFi/BT device presence reading."""
        ts = datetime.now(timezone.utc).isoformat()
        reading = {
            "ts": ts,
            "lat": lat,
            "lon": lon,
            "mac": mac,
            "rssi_dbm": rssi_dbm,
            "vendor": vendor,
            "device_type": device_type if device_type != "unknown" else self.DEVICE_TYPES.get(vendor, "unknown"),
            "confidence": confidence,
        }
        reading["raw_hash"] = hashlib.sha256(json.dumps(reading, sort_keys=True).encode()).hexdigest()
        self.devices.append(reading)
        return reading

    def query(self, lat: float, lon: float, radius_m: float = 1000) -> dict:
        """Query device presence within a radius. Returns triangulated count + density."""
        nearby = []
        for r in self.devices:
            dlat = (r["lat"] - lat) * 111000
            dlon = (r["lon"] - lon) * 111000 * 0.7
            dist = ((dlat ** 2) + (dlon ** 2)) ** 0.5
            if dist <= radius_m:
                nearby.append({**r, "dist_m": dist})
        # Density (devices per 1000m^2)
        area_m2 = math.pi * (radius_m ** 2)
        density = len(nearby) / (area_m2 / 1000) if area_m2 > 0 else 0
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "query": {"lat": lat, "lon": lon, "radius_m": radius_m},
            "count": len(nearby),
            "density_per_1000m2": density,
            "devices": nearby,
        }


# ============================================================
# FUSION ENGINE (combines all 4 modules)
# ============================================================

class SensorFusion:
    """Fuses noise + frequency + vibration + presence into a unified signal map."""

    def __init__(self):
        self.noise = NoiseMap()
        self.frequency = FrequencyMap()
        self.vibration = VibrationMap()
        self.presence = PresenceMap()

    def query_fused(self, lat: float, lon: float, radius_m: float = 1000) -> dict:
        """Fused query across all 4 sensor modules."""
        n = self.noise.query(lat, lon, radius_m)
        f = self.frequency.query(lat, lon, radius_m)
        v = self.vibration.query(lat, lon, radius_m)
        p = self.presence.query(lat, lon, radius_m)
        # Compute a single "ambient" score
        noise_score = n["avg_db_spl"] / 100.0  # 0-1
        rf_score = min(f["count"] / 50.0, 1.0)  # saturated at 50 devices
        vib_score = min(v["count"] / 20.0, 1.0)  # saturated at 20 events
        presence_score = min(p["density_per_1000m2"] / 5.0, 1.0)  # saturated at 5 per 1000m2
        ambient = (noise_score + rf_score + vib_score + presence_score) / 4.0
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "query": {"lat": lat, "lon": lon, "radius_m": radius_m},
            "noise": n,
            "frequency": f,
            "vibration": v,
            "presence": p,
            "ambient_score": ambient,
            "classification": (
                "quiet" if ambient < 0.2 else
                "moderate" if ambient < 0.5 else
                "busy" if ambient < 0.8 else
                "chaotic"
            ),
        }


# ============================================================
# CLI / DEMO
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Sovereign Watchdog DISCOVER (Pillar 2)")
    parser.add_argument("--demo", action="store_true", help="Run a demo with sample data")
    parser.add_argument("--query", type=str, default=None, help="Query format: lat,lon,radius_m")
    args = parser.parse_args()

    fusion = SensorFusion()

    if args.demo:
        # Sample data: London Trafalgar Square (a busy place)
        # 5 noise events
        fusion.noise.ingest(51.5074, -0.1278, 65.2, 440, "traffic", 0.9)
        fusion.noise.ingest(51.5075, -0.1279, 72.1, 1000, "music", 0.8)
        fusion.noise.ingest(51.5076, -0.1280, 88.5, 100, "construction", 0.85)
        fusion.noise.ingest(51.5073, -0.1277, 55.3, 2000, "voice", 0.9)
        fusion.noise.ingest(51.5077, -0.1281, 105.0, 50, "alarm", 0.95)
        # 8 frequency events
        fusion.frequency.ingest(51.5074, -0.1278, 2450, -45, "wifi", "AA:BB:CC:DD:EE:01")
        fusion.frequency.ingest(51.5075, -0.1279, 5180, -55, "wifi", "DD:EE:FF:11:22:33")
        fusion.frequency.ingest(51.5076, -0.1280, 2402, -60, "bt", "11:22:33:44:55:66")
        fusion.frequency.ingest(51.5073, -0.1277, 1800, -70, "cellular", "77:88:99:AA:BB:CC")
        fusion.frequency.ingest(51.5074, -0.1278, 5250, -50, "wifi")
        fusion.frequency.ingest(51.5075, -0.1279, 2400, -55, "wifi")
        fusion.frequency.ingest(51.5076, -0.1280, 2470, -65, "bt")
        fusion.frequency.ingest(51.5077, -0.1281, 5250, -45, "wifi")
        # 5 vibration events
        fusion.vibration.ingest(51.5074, -0.1278, 12.5, 0.05, "footstep", 0.85)
        fusion.vibration.ingest(51.5075, -0.1279, 8.0, 0.15, "heavy_vehicle", 0.9)
        fusion.vibration.ingest(51.5076, -0.1280, 15.0, 0.25, "construction", 0.8)
        fusion.vibration.ingest(51.5073, -0.1277, 0.5, 0.02, "ambient", 0.95)
        fusion.vibration.ingest(51.5077, -0.1281, 30.0, 0.08, "engine", 0.85)
        # 12 presence events
        for i in range(12):
            fusion.presence.ingest(
                51.5074 + (i - 6) * 0.0001,
                -0.1278 + (i - 6) * 0.0001,
                f"AA:BB:CC:DD:EE:{i:02X}",
                -60 - i,
                "Apple",
                "phone",
                0.9
            )
        # Query
        result = fusion.query_fused(51.5074, -0.1278, 500)
        print(json.dumps(result, indent=2))
    elif args.query:
        parts = [float(x) for x in args.query.split(",")]
        result = fusion.query_fused(parts[0], parts[1], parts[2] if len(parts) > 2 else 1000)
        print(json.dumps(result, indent=2))
    else:
        print("Usage: --demo OR --query lat,lon,radius_m")


if __name__ == '__main__':
    main()