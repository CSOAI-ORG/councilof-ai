"""Apple BFT Council — 12-around-1 Apple-aware BFT deliberation.

Inherits from King hive BFT but specialized for Apple Intelligence queries.
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "apple-bft-council/1.0"
VERSION = "1.0.0"

GENERALS = [
    {"id": 1, "name": "Argus", "apple_role": "Apple Intelligence watchdog", "voice": "Apple Watch. Apple Report. Apple Protect."},
    {"id": 2, "name": "Scribe", "apple_role": "App Store compliance", "voice": "App Store compliance is a covenant."},
    {"id": 3, "name": "Shield", "apple_role": "iOS device security", "voice": "Defense without offense. iOS secure."},
    {"id": 4, "name": "Builder", "apple_role": "Swift 6 / SwiftUI 6 architect", "voice": "Swift architecture is a covenant."},
    {"id": 5, "name": "Abacus", "apple_role": "App Store economics", "voice": "Number is a covenant. 99-cent fee."},
    {"id": 6, "name": "Lex", "apple_role": "App Store legal / DMA", "voice": "App Store rules are sovereign."},
    {"id": 7, "name": "Scale", "apple_role": "Apple bias / on-device fairness", "voice": "On-device balance is sovereign."},
    {"id": 8, "name": "Crow", "apple_role": "Apple risk / Project Acquisitions", "voice": "Risk is sovereign. Acquisition is sovereign."},
    {"id": 9, "name": "Gear", "apple_role": "Apple MDM / ABM operations", "voice": "Apple Operations is a covenant with uptime."},
    {"id": 10, "name": "Voice", "apple_role": "Siri voice intents", "voice": "Siri voice is sovereign. Clarity is sovereign."},
    {"id": 11, "name": "Owl", "apple_role": "Apple research / Foundation Models", "voice": "On-device research is sovereign. 3B params."},
    {"id": 12, "name": "Dragon", "apple_role": "Apple Intelligence sovereign", "voice": "The Apple dragon runs itself."},
]

_COUNCILS = {}
_VOTES = {}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "apple-bft-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    payload["apple_care_floor"] = 0.95
    return payload


def council_create(topic, voters, apple_context=""):
    n = len(voters)
    if n not in (3, 5, 7): return _sign({"error": "voters must be 3, 5, or 7"})
    quorum = {3: 2, 5: 3, 7: 5}[n]
    cid = hashlib.sha256(f"{topic}|{apple_context}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    council = {"council_id": cid, "topic": topic, "voters": voters, "size": n, "quorum": quorum,
               "apple_context": apple_context, "status": "OPEN",
               "created_at": datetime.now(timezone.utc).isoformat()}
    _COUNCILS[cid] = council
    _VOTES[cid] = []
    return _sign(council)


def vote(council_id, voter, choice):
    if council_id not in _COUNCILS: return _sign({"error": "unknown council"})
    if choice not in ("YES", "NO", "ABSTAIN"): return _sign({"error": "YES/NO/ABSTAIN"})
    if voter not in _COUNCILS[council_id]["voters"]: return _sign({"error": "not a voter"})
    votes = _VOTES[council_id]
    votes = [v for v in votes if v["voter"] != voter]
    votes.append({"voter": voter, "choice": choice, "voted_at": datetime.now(timezone.utc).isoformat()})
    _VOTES[council_id] = votes
    return _sign({"council_id": council_id, "voter": voter, "choice": choice})


def tally(council_id):
    if council_id not in _COUNCILS: return _sign({"error": "unknown council"})
    council = _COUNCILS[council_id]; votes = _VOTES[council_id]
    yes = sum(1 for v in votes if v["choice"] == "YES")
    no = sum(1 for v in votes if v["choice"] == "NO")
    abst = sum(1 for v in votes if v["choice"] == "ABSTAIN")
    passed = yes >= council["quorum"]
    council["status"] = "RATIFIED" if passed else "REJECTED"
    return _sign({"council_id": council_id, "yes": yes, "no": no, "abstain": abst,
                 "quorum": council["quorum"], "size": council["size"],
                 "outcome": "PASSED" if passed else "REJECTED", "apple_care_floor": 0.95})


def dissent_record(council_id, voter, reason):
    if council_id not in _COUNCILS: return _sign({"error": "unknown council"})
    return _sign({"council_id": council_id, "voter": voter, "reason": reason})


def get_outcome(council_id):
    if council_id not in _COUNCILS: return _sign({"error": "unknown council"})
    council = _COUNCILS[council_id]
    return _sign({"council_id": council_id, "topic": council["topic"],
                 "status": council["status"], "votes": _VOTES[council_id]})
