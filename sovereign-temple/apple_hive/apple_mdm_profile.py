"""Apple Business Manager MDM Profile Generator."""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone

PROTOCOL = "apple-mdm/1.0"
VERSION = "1.0.0"


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "apple-mdm-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def mdm_profile(organization, force_sovereign=True):
    return _sign({"protocol": PROTOCOL, "version": VERSION,
                  "organization": organization, "force_sovereign": force_sovereign,
                  "restrictions": {"allowAppInstallation": True,
                                   "allowPrivateAppIntents": force_sovereign,
                                   "allowFoundationModelProvider": force_sovereign,
                                   "requireDevicePasscode": True,
                                   "complexPasscodeRequired": True,
                                   "maxFailedAttemptsBeforeLockout": 5},
                  "vpn": {"enabled": force_sovereign, "name": f"{organization}-Sovereign-VPN"},
                  "certificate_signing": {"issuer": "CSOAI Ltd (UK 16939677)",
                                          "algorithm": "ML-DSA-65 (PQC)"}})
