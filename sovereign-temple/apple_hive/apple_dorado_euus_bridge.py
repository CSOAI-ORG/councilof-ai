"""Apple DORADO EU/US Sovereignty Bridge."""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone

PROTOCOL = "apple-dorado-bridge/1.0"
VERSION = "1.0.0"

PROFILES = {
    "EU": {"region": "eu-west-1", "data_residency": "EU", "icloud_eu": True, "gdpr": True},
    "US": {"region": "us-east-1", "data_residency": "US", "icloud_us": True, "ccpa": True},
    "UK": {"region": "uk-gb-1", "data_residency": "UK", "icloud_uk": True, "uk_gdpr": True},
    "APAC": {"region": "ap-southeast-1", "data_residency": "APAC", "icloud_asia": True, "pdpa": True},
    "SOVEREIGN_UK": {"region": "meok-uk-1", "data_residency": "UK-CSOAI", "uk_16939677": True,
                    "icloud_csoai": True, "app_store_csoai": True, "siri_csoai": True},
}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "apple-do-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def list_profiles():
    return _sign({"protocol": PROTOCOL, "version": VERSION, "profiles": PROFILES, "count": len(PROFILES)})


def switch_to(region):
    if region not in PROFILES: return _sign({"error": f"unknown region: {region}"})
    return _sign({"protocol": PROTOCOL, "version": VERSION, "current_region": region,
                 "profile": PROFILES[region]})


def current():
    return _sign({"protocol": PROTOCOL, "version": VERSION, "current": "EU"})
