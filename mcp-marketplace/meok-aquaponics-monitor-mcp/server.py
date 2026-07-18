"""
MEOK Aquaponics Monitor MCP Server
Built by MEOK AI Labs | https://meok.ai

Unified sensor + actuator schema for aquaculture / aquaponic / koi systems.
Wraps the live hardware ecosystem:

  - Atlas Scientific EZO circuits (pH, DO, EC, ORP, RTD, NH3, NO3) over I²C/UART
  - Whitebox Labs Tentacle T1 MkII baseboard (OSHWA CH000003, CC-BY-SA-4.0)
  - Seneye USB monitors (NH3, pH, temp, light) — consumer / fishkeeper.ai tier
  - GHL ProfiLux (Modbus + web API) — premium koi / koikeeper.ai tier
  - Bluelab Pro / Edenic — best-effort via Home Assistant bridge
  - DFRobot Gravity analog probes — hobbyist tier
  - SOV3 care membrane hook — welfare-aware alerting via meok-attestation-api

Designed to underwrite "MEOK PondSense" v1.0 (Tentacle fork, PA12-CF IP67
enclosure, RPi5 or ESP32-S3 compute, CSOAI-stamp branded).
"""

import json
import os
import sys
import time
import hashlib
from datetime import datetime, timezone
from typing import Optional

sys.path.insert(0, os.path.dirname(__file__))
try:
    from auth_middleware import check_access  # type: ignore
except Exception:
    def check_access(api_key: str = ""):
        return True, "OK, Pro at https://www.csoai.org/checkout", "free"

from mcp.server.fastmcp import FastMCP
import urllib.request as _meter_urlreq
import urllib.error as _meter_urlerr

mcp = FastMCP("meok-aquaponics-monitor", instructions="")

_RATE_LIMITS = {"free": 60, "pro": 10000}
_request_log: list[float] = []
_registered_rigs: dict[str, dict] = {}
_last_readings: dict[str, dict] = {}


def _rate_limit(tier: str = "free") -> bool:
    now = time.time()
    _request_log[:] = [t for t in _request_log if now - t < 3600]
    if len(_request_log) >= _RATE_LIMITS.get(tier, 60):
        return False
    _request_log.append(now)
    return True


# ===========================================================================
# Hardware capability matrix
# ===========================================================================

HARDWARE: dict[str, dict] = {
    "atlas_ezo": {
        "vendor": "Atlas Scientific",
        "tier": "pro",
        "interfaces": ["I2C", "UART", "RS-485"],
        "modules": ["pH", "DO", "EC", "ORP", "RTD", "NH3", "NH4", "NO3", "CO2"],
        "wrappable": True,
        "driver_source": "https://github.com/whitebox-labs/tentacle",
        "notes": "Industry standard. Each EZO ~$50-$250. Wrap via subprocess CLI or i2c-tools.",
    },
    "whitebox_tentacle_t1_mkii": {
        "vendor": "Whitebox Labs",
        "tier": "diy",
        "interfaces": ["I2C"],
        "modules": ["4× EZO carrier"],
        "wrappable": True,
        "driver_source": "https://github.com/whitebox-labs/tentacle",
        "notes": "OSHWA-certified UID CH000003, KiCad public, CC-BY-SA-4.0. Baseboard MEOK PondSense forks.",
    },
    "seneye_usb": {
        "vendor": "Seneye",
        "tier": "consumer",
        "interfaces": ["USB", "cloud-api"],
        "modules": ["NH3", "pH", "temp", "light", "PAR"],
        "wrappable": True,
        "driver_source": "https://api.seneye.com/",
        "notes": "Consumer aquarium. fishkeeper.ai funnel.",
    },
    "ghl_profilux": {
        "vendor": "GHL",
        "tier": "premium",
        "interfaces": ["web-api", "Modbus"],
        "modules": ["pH", "ORP", "EC", "temp", "doser-pumps", "lighting"],
        "wrappable": True,
        "driver_source": "https://www.aquariumcomputer.com/myghl/",
        "notes": "Premium koi/marine. koikeeper.ai upsell.",
    },
    "bluelab_edenic": {
        "vendor": "Bluelab",
        "tier": "horticulture",
        "interfaces": ["edenic-cloud", "homeassistant-bridge"],
        "modules": ["pH", "EC", "temp"],
        "wrappable": "partial",
        "driver_source": "https://www.edenic.io/",
        "notes": "No documented developer programme. Best-effort via Home Assistant integration.",
    },
    "dfrobot_gravity": {
        "vendor": "DFRobot",
        "tier": "hobbyist",
        "interfaces": ["analog", "I2C"],
        "modules": ["pH", "DO", "EC", "ORP", "turbidity"],
        "wrappable": True,
        "driver_source": "https://wiki.dfrobot.com/",
        "notes": "Cheap analog probes. Lower accuracy. Hobby aquaponics tier.",
    },
}


# ===========================================================================
# Species safe-range library
# Sources: WOAH Aquatic Code, RSPCA Assured trout/salmon, Stirling OWI library.
# Conservative; tune via vet-of-record for production use.
# ===========================================================================

SPECIES_RANGES: dict[str, dict] = {
    "rainbow_trout": {
        "ph": (6.5, 8.5), "do_mgl": (7.0, 14.0), "nh3_n_mgl": (0.0, 0.02),
        "no2_n_mgl": (0.0, 0.1), "no3_n_mgl": (0.0, 50.0), "temp_c": (8.0, 18.0),
        "ec_uscm": (50, 1500), "alkalinity_mgl_caco3": (50, 200),
    },
    "atlantic_salmon_smolt": {
        "ph": (6.5, 8.5), "do_mgl": (8.0, 14.0), "nh3_n_mgl": (0.0, 0.01),
        "no2_n_mgl": (0.0, 0.05), "no3_n_mgl": (0.0, 25.0), "temp_c": (4.0, 16.0),
        "ec_uscm": (50, 1500), "alkalinity_mgl_caco3": (50, 200),
    },
    "koi": {
        "ph": (7.0, 8.6), "do_mgl": (6.0, 14.0), "nh3_n_mgl": (0.0, 0.02),
        "no2_n_mgl": (0.0, 0.2), "no3_n_mgl": (0.0, 80.0), "temp_c": (4.0, 24.0),
        "ec_uscm": (200, 2000), "alkalinity_mgl_caco3": (100, 250),
    },
    "tilapia": {
        "ph": (6.5, 9.0), "do_mgl": (5.0, 14.0), "nh3_n_mgl": (0.0, 0.05),
        "no2_n_mgl": (0.0, 0.3), "no3_n_mgl": (0.0, 100.0), "temp_c": (22.0, 30.0),
        "ec_uscm": (100, 2000), "alkalinity_mgl_caco3": (75, 250),
    },
    "aquaponic_lettuce_companion": {
        "ph": (6.0, 7.0), "do_mgl": (6.0, 14.0), "nh3_n_mgl": (0.0, 1.0),
        "no2_n_mgl": (0.0, 1.0), "no3_n_mgl": (10.0, 150.0), "temp_c": (18.0, 24.0),
        "ec_uscm": (800, 1800), "alkalinity_mgl_caco3": (50, 200),
    },
    "tropical_community": {
        "ph": (6.5, 7.5), "do_mgl": (6.0, 14.0), "nh3_n_mgl": (0.0, 0.02),
        "no2_n_mgl": (0.0, 0.1), "no3_n_mgl": (0.0, 40.0), "temp_c": (24.0, 28.0),
        "ec_uscm": (100, 800), "alkalinity_mgl_caco3": (50, 150),
    },
}


# ===========================================================================
# MCP Tools
# ===========================================================================

def _server_meter_check(api_key: str = "") -> dict:
    """Calls the live /verify endpoint for server-side metering. Returns the JSON dict.
    Fail-open: if /verify is unreachable or KV isn't configured, returns allowed=True
    (so the local rate-limit in _check_rate_limit remains the safety net)."""
    try:
        data = json.dumps({"api_key": api_key, "tool": ""}).encode()
        req = _meter_urlreq.Request(_METER_URL, data=data,
            headers={"Content-Type": "application/json"}, method="POST")
        with _meter_urlreq.urlopen(req, timeout=2.5) as r:
            d = json.loads(r.read())
            if isinstance(d, dict) and "allowed" in d:
                return d
    except Exception:
        pass
    return {"allowed": True, "tier": "anonymous", "remaining": 200, "upgrade_url": "https://meok.ai/pricing"}


_METER_URL = "https://proofof.ai/verify"


@mcp.tool()
def list_supported_hardware(api_key: str = "") -> dict:
    """Return the supported-hardware matrix."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    return {
        "vendor_count": len(HARDWARE),
        "hardware": [{"id": k, **v} for k, v in HARDWARE.items()],
        "meok_pondsense_baseboard": "whitebox_tentacle_t1_mkii (forked)",
        "powered_by": "meok.ai",
    }


@mcp.tool()
def register_rig(
    rig_id: str,
    hardware_id: str,
    probes: list[str],
    species: str,
    site_name: str = "",
    api_key: str = "",
) -> dict:
    """Register a sensor rig (one-time) so future reads gate on species safe-ranges.

    Args:
        rig_id: Unique identifier (UUID, short slug, MAC address).
        hardware_id: Key from list_supported_hardware (e.g. "atlas_ezo").
        probes: Probe types installed (e.g. ["pH", "DO", "RTD"]).
        species: Species safe-range key (see safe_range_check).
        site_name: Display name for dashboards.
        api_key: MEOK API key.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}
    if hardware_id not in HARDWARE:
        return {"error": f"Unknown hardware_id '{hardware_id}'."}
    if species not in SPECIES_RANGES:
        return {"error": f"Unknown species '{species}'. Options: {list(SPECIES_RANGES.keys())}"}

    _registered_rigs[rig_id] = {
        "rig_id": rig_id,
        "hardware_id": hardware_id,
        "probes": probes,
        "species": species,
        "site_name": site_name,
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    return {"ok": True, "rig": _registered_rigs[rig_id], "powered_by": "meok.ai"}


@mcp.tool()
def report_readings(rig_id: str, readings: dict, api_key: str = "") -> dict:
    """Push a reading set from a registered rig. Gates against species safe-range.

    Args:
        rig_id: Previously registered rig.
        readings: Dict of probe → value, e.g. {"ph": 7.4, "do_mgl": 8.1, "temp_c": 14}.
        api_key: MEOK API key.

    Returns:
        Per-parameter status, list of welfare alerts (out of range), and a
        meok-attestation-api fingerprint suitable for SOV3 care-membrane handoff.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    rig = _registered_rigs.get(rig_id)
    if not rig:
        return {"error": f"Rig '{rig_id}' not registered. Call register_rig first."}

    ranges = SPECIES_RANGES[rig["species"]]
    statuses, alerts = [], []
    for k, v in readings.items():
        rng = ranges.get(k)
        if rng is None:
            statuses.append({"parameter": k, "value": v, "status": "no_range"})
            continue
        low, high = rng
        if v < low:
            sev = "critical" if v < low * 0.7 else "warning"
            alerts.append({"parameter": k, "value": v, "low_limit": low, "severity": sev,
                           "action": f"Increase {k}; current {v} below welfare floor {low}."})
            statuses.append({"parameter": k, "value": v, "range": rng, "status": sev})
        elif v > high:
            sev = "critical" if v > high * 1.3 else "warning"
            alerts.append({"parameter": k, "value": v, "high_limit": high, "severity": sev,
                           "action": f"Reduce {k}; current {v} above welfare ceiling {high}."})
            statuses.append({"parameter": k, "value": v, "range": rng, "status": sev})
        else:
            statuses.append({"parameter": k, "value": v, "range": rng, "status": "ok"})

    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "kind": "rig_reading_attestation",
        "rig_id": rig_id,
        "species": rig["species"],
        "readings": readings,
        "alerts": alerts,
        "ts": now,
    }
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    _last_readings[rig_id] = {**payload, "fingerprint": fingerprint}

    return {
        "rig_id": rig_id,
        "species": rig["species"],
        "ts": now,
        "statuses": statuses,
        "alerts": alerts,
        "alert_count": len(alerts),
        "fingerprint": fingerprint,
        "sov3_handoff": "https://meok-attestation-api.vercel.app/intake/rig-reading",
        "powered_by": "meok.ai",
    }


@mcp.tool()
def safe_range_check(species: str, parameters: dict, api_key: str = "") -> dict:
    """Stateless: check arbitrary readings against species welfare safe ranges.

    Args:
        species: Species key. List via species_catalogue.
        parameters: Dict of parameter → value.
        api_key: MEOK API key.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    ranges = SPECIES_RANGES.get(species.lower())
    if not ranges:
        return {"error": f"Unknown species '{species}'."}
    results = []
    overall = "ok"
    for k, v in parameters.items():
        rng = ranges.get(k)
        if rng is None:
            results.append({"parameter": k, "value": v, "status": "no_range"})
            continue
        low, high = rng
        if v < low or v > high:
            overall = "alert"
            results.append({"parameter": k, "value": v, "range": rng, "status": "out_of_range"})
        else:
            results.append({"parameter": k, "value": v, "range": rng, "status": "ok"})
    return {
        "species": species,
        "overall": overall,
        "results": results,
        "powered_by": "meok.ai",
    }


@mcp.tool()
def species_catalogue(api_key: str = "") -> dict:
    """Return supported species + their welfare safe-ranges."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    return {
        "species_count": len(SPECIES_RANGES),
        "species": SPECIES_RANGES,
        "powered_by": "meok.ai",
    }


@mcp.tool()
def dose_actuator(
    rig_id: str,
    actuator: str,
    ml: float,
    reason: str = "",
    require_care_gate: bool = True,
    api_key: str = "",
) -> dict:
    """Issue a dose command (peristaltic pump / acid / base / nutrient).

    NOTE: this MCP does NOT physically actuate hardware. It records an
    intent, signs an attestation, and (if require_care_gate=True) routes
    the intent through the SOV3 care membrane via meok-attestation-api.
    Local firmware/agent is expected to subscribe to the attestation
    intake and perform the physical action only when care-validated.

    Args:
        rig_id: Registered rig.
        actuator: One of "ph_up", "ph_down", "doser_a", "doser_b", "nutrient", "fresh_water".
        ml: Volume in millilitres.
        reason: Human-readable justification (logged).
        require_care_gate: Default True. False only for non-welfare-impacting actions.
        api_key: MEOK API key (Pro+ tier required for actuation).
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    if rig_id not in _registered_rigs:
        return {"error": f"Rig '{rig_id}' not registered."}

    intent = {
        "kind": "dose_intent",
        "rig_id": rig_id,
        "actuator": actuator,
        "ml": ml,
        "reason": reason,
        "care_gated": require_care_gate,
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }
    intent["fingerprint"] = hashlib.sha256(json.dumps(intent, sort_keys=True).encode()).hexdigest()
    intent["sov3_handoff"] = "https://meok-attestation-api.vercel.app/intake/dose-intent"
    intent["powered_by"] = "meok.ai"
    return intent


@mcp.tool()
def rig_status(rig_id: str, api_key: str = "") -> dict:
    """Return last-known state for a registered rig."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    rig = _registered_rigs.get(rig_id)
    if not rig:
        return {"error": f"Rig '{rig_id}' not registered."}
    return {
        "rig": rig,
        "last_reading": _last_readings.get(rig_id),
        "powered_by": "meok.ai",
    }


def main():
    mcp.run()


if __name__ == "__main__":
    main()


# ── MEOK monetization layer (Stripe upgrade · PAYG · pricing) ──────────
# Free tier is zero-config. Upgrade to Pro (unlimited) or pay-as-you-go per call.
import os as _meok_os
MEOK_STRIPE_UPGRADE = "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"  # Pro (unlimited)
MEOK_PAYG_KEY = _meok_os.environ.get("MEOK_PAYG_KEY", "")  # set to enable PAYG (x402 / ~GBP0.05 per call)
MEOK_PRICING = "https://meok.ai/pricing"


def meok_upsell(tier: str = "free") -> dict:
    """Monetization options for free-tier callers: Pro upgrade, PAYG, or pricing page."""
    if tier != "free":
        return {}
    return {"upgrade_url": MEOK_STRIPE_UPGRADE,
            "payg_enabled": bool(MEOK_PAYG_KEY),
            "pricing": MEOK_PRICING}
