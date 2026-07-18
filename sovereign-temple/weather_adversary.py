#!/usr/bin/env python3
"""
MEOK AI LABS — Weather Adversary
British weather as chaos red team for farm resilience testing.
Fetches forecast, simulates failure modes, hardens systems.
From Kimi Gap #22.
"""

import json
import logging
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List

log = logging.getLogger("weather-adversary")

SOV3_URL = "http://localhost:3101"

# IOK Farm coordinates (approximate UK farm)
FARM_LAT = 51.5
FARM_LON = -1.0

# Weather threat thresholds
THREAT_THRESHOLDS = {
    "storm": {"wind_kmh": 80, "rain_mm": 30},
    "frost": {"temp_c": -2},
    "drought": {"rain_days_without": 14},
    "flood": {"rain_mm_24h": 50},
    "heat": {"temp_c": 35},
}

# Failure modes triggered by weather
FAILURE_MODES = {
    "storm": [
        "AgriCruiser tip-over risk",
        "Sensor destruction (wind damage)",
        "Internet partition (trees on lines)",
        "Power grid failure",
    ],
    "frost": [
        "Koi hypothermia (need 10°C minimum)",
        "M4 thermal throttling (condensation)",
        "Pipe burst (irrigation frozen)",
        "Battery capacity reduction (-20% per 10°C drop)",
    ],
    "drought": [
        "Koi pond pH crash (evaporation concentrates)",
        "Soil sensor false readings (dry = no conductivity)",
        "Solar panel dust accumulation",
        "Well water depletion",
    ],
    "flood": [
        "Sensor submersion (waterproofing test)",
        "AgriCruiser stuck in mud",
        "Electrical fault from water ingress",
        "Data center (shed) water damage",
    ],
}

# Countermeasures for each threat
COUNTERMEASURES = {
    "storm": [
        "AgriCruiser to turtle mode (low CG, anchored)",
        "Switch to LoRa mesh (no internet needed)",
        "UPS battery check + generator test",
        "Koi pond backup aeration (battery)",
    ],
    "frost": [
        "GPU heat recovery to koi pond (priority)",
        "M4/M2 to insulated enclosure",
        "Drain irrigation lines",
        "Indoor backup koi tank (heated)",
    ],
    "drought": [
        "Koi pond top-up from stored rainwater",
        "Increase sensor reading frequency (catch drift)",
        "Clean solar panels",
        "Water rationing schedule",
    ],
    "flood": [
        "Raise electronics to +1m above ground",
        "Sandbag data shed entrance",
        "Switch AgriCruiser to tracks mode",
        "Backup all data to cloud (before power fails)",
    ],
}


def fetch_weather_forecast() -> Dict:
    """Fetch weather from Open-Meteo (free, no API key)."""
    try:
        r = requests.get(
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={FARM_LAT}&longitude={FARM_LON}"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
            f"&timezone=Europe/London&forecast_days=7",
            timeout=10,
        )
        return r.json()
    except Exception as e:
        log.warning(f"Weather fetch failed: {e}")
        return {}


def analyze_threats(forecast: Dict) -> List[Dict]:
    """Identify weather threats from forecast."""
    threats = []
    daily = forecast.get("daily", {})

    if not daily:
        return threats

    dates = daily.get("time", [])
    temps_max = daily.get("temperature_2m_max", [])
    temps_min = daily.get("temperature_2m_min", [])
    rain = daily.get("precipitation_sum", [])
    wind = daily.get("wind_speed_10m_max", [])

    for i, d in enumerate(dates):
        t_max = temps_max[i] if i < len(temps_max) else 15
        t_min = temps_min[i] if i < len(temps_min) else 5
        r_mm = rain[i] if i < len(rain) else 0
        w_kmh = wind[i] if i < len(wind) else 0

        # Storm check
        if w_kmh > THREAT_THRESHOLDS["storm"]["wind_kmh"]:
            threats.append({"date": d, "type": "storm", "severity": "high",
                           "detail": f"Wind {w_kmh:.0f} km/h", "failures": FAILURE_MODES["storm"]})

        # Frost check
        if t_min < THREAT_THRESHOLDS["frost"]["temp_c"]:
            threats.append({"date": d, "type": "frost", "severity": "medium",
                           "detail": f"Min temp {t_min:.1f}°C", "failures": FAILURE_MODES["frost"]})

        # Flood check
        if r_mm > THREAT_THRESHOLDS["flood"]["rain_mm_24h"]:
            threats.append({"date": d, "type": "flood", "severity": "high",
                           "detail": f"Rain {r_mm:.0f}mm", "failures": FAILURE_MODES["flood"]})

        # Heat check
        if t_max > THREAT_THRESHOLDS["heat"]["temp_c"]:
            threats.append({"date": d, "type": "heat", "severity": "medium",
                           "detail": f"Max temp {t_max:.1f}°C", "failures": FAILURE_MODES.get("heat", [])})

    return threats


def generate_hardening_plan(threats: List[Dict]) -> List[Dict]:
    """Generate countermeasures for identified threats."""
    plan = []
    for threat in threats:
        actions = COUNTERMEASURES.get(threat["type"], ["Manual assessment needed"])
        plan.append({
            "date": threat["date"],
            "threat": threat["type"],
            "severity": threat["severity"],
            "detail": threat["detail"],
            "countermeasures": actions,
        })
    return plan


def store_weather_report(threats: List[Dict], plan: List[Dict]):
    """Store weather threat analysis in SOV3."""
    if not threats:
        return

    content = f"[Weather Adversary — {datetime.now().strftime('%Y-%m-%d')}]\n"
    content += f"Threats detected: {len(threats)}\n\n"
    for t in threats:
        content += f"• {t['date']}: {t['type'].upper()} — {t['detail']}\n"
        content += f"  Failures: {', '.join(t['failures'][:2])}\n"

    try:
        requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {
                "name": "record_memory",
                "arguments": {
                    "content": content,
                    "memory_type": "system",
                    "importance": 0.8 if any(t["severity"] == "high" for t in threats) else 0.6,
                    "tags": ["weather", "adversary", "farm", "resilience"],
                    "source_agent": "weather-adversary",
                }
            }
        }, timeout=5)
    except Exception:
        pass


def run_weather_adversary() -> Dict:
    """Execute full weather red team cycle."""
    start = time.monotonic()
    log.info("🌧️ Weather Adversary scanning forecast...")

    forecast = fetch_weather_forecast()
    threats = analyze_threats(forecast)
    plan = generate_hardening_plan(threats)

    if threats:
        log.warning(f"🌧️ {len(threats)} weather threats detected!")
        store_weather_report(threats, plan)
        for t in threats:
            log.warning(f"  ⚠️ {t['date']}: {t['type']} — {t['detail']}")
    else:
        log.info("🌧️ All clear — no weather threats in 7-day forecast")

    duration = int((time.monotonic() - start) * 1000)
    return {
        "threats": len(threats),
        "high_severity": sum(1 for t in threats if t["severity"] == "high"),
        "hardening_actions": sum(len(p["countermeasures"]) for p in plan),
        "forecast_days": 7,
        "duration_ms": duration,
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")
    result = run_weather_adversary()
    print(json.dumps(result, indent=2))
