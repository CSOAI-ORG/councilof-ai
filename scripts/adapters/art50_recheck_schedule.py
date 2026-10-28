"""Compact public-root leaf for the Art 50 dated re-check schedule.

Pure file reader of public/interop/art50-recheck-schedule-2026-10/schedule.json.
No network. Never raises: a missing file yields an ABSENT sidecar, a malformed
file an INVALID one, and in both cases zero leaves.

What this is: a schedule of DETECTION READINGS. "Due" means a reading is due.
It never means an obligation is met or unmet, and the leaf draws no conclusion
about any provider. The reading itself is point-in-time — a C2PA manifest
carries a validity window and IPTC metadata is stripped when a file is
re-saved — so a detection reading without a date is a claim about no particular
moment. The schedule says when the reading is due and what changes would make
it due early.

The schedule pins the census it schedules. If the pinned census digest stops
matching the bytes on disk, a reading is due whatever the calendar says: the
thing being scheduled has changed under the schedule.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

REL = Path("public/interop/art50-recheck-schedule-2026-10/schedule.json")
CENSUS_REL = Path("public/interop/art50-census-2026-09/census.json")
ENDPOINT = "/interop/art50-recheck-schedule-2026-10/schedule.json"
RELEASE_ID = "art50-recheck-schedule-2026-10"
PAYLOAD_CAP = 3072

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
POINT_ID_RE = re.compile(r"^[a-z0-9-]{1,64}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _canonical(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def collect(repo_root: Path) -> dict[str, Any]:
    try:
        path = Path(repo_root) / REL
        if not path.is_file():
            return {"leaves": [], "sidecar": {"status": "ABSENT", "path": str(REL)}}
        raw = path.read_bytes()
        schedule = json.loads(raw)
        if not str(schedule.get("schema", "")).startswith("csoai.art50-recheck-schedule/"):
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "schedule contract"}}

        points = schedule.get("points")
        triggers = schedule.get("triggers")
        inputs = schedule.get("inputs")
        law = schedule.get("law")
        if not isinstance(points, list) or not points:
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "points contract"}}
        if not isinstance(triggers, list) or not triggers:
            # A schedule with no trigger declares no way for a reading to come
            # due early. That is a contract violation, not an empty schedule.
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "triggers contract"}}
        if not isinstance(inputs, dict) or not isinstance(law, dict):
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "schedule contract"}}
        if not (isinstance(schedule.get("release_id"), str) and schedule["release_id"]):
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "release_id contract"}}
        for date_key in ("regulation_applies_from", "pre_existing_systems_until"):
            if not (isinstance(law.get(date_key), str) and DATE_RE.fullmatch(law[date_key])):
                return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "law date contract"}}

        # The schedule's contract with its input: the pinned census digest must
        # be a real digest, and the census must actually be on disk to compare
        # against. A schedule that pins an absent input is invalid, not empty.
        pinned = inputs.get("census_sha256")
        if not isinstance(pinned, str) or not SHA256_RE.fullmatch(pinned):
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "pinned census digest contract"}}
        census_path = Path(repo_root) / inputs.get("census_path", str(CENSUS_REL))
        if not census_path.is_file():
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "pinned census absent"}}
        census_now = _sha256(census_path.read_bytes())
        inputs_changed = census_now != pinned

        compact_points = []
        for p in points:
            if not isinstance(p, dict):
                return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "point contract"}}
            pid, due, note = p.get("id"), p.get("due"), p.get("note")
            if not (isinstance(pid, str) and POINT_ID_RE.fullmatch(pid)):
                return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "point id contract"}}
            if not (isinstance(due, str) and DATE_RE.fullmatch(due)):
                return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "point date contract"}}
            if not (isinstance(note, str) and note):
                return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "point note contract"}}
            item = {"id": pid, "due": due, "note": note}
            if p.get("recurs"):
                item["recurs"] = p["recurs"]
            compact_points.append(item)

        compact_triggers = []
        for t in triggers:
            if not isinstance(t, dict) or not isinstance(t.get("id"), str) or not isinstance(t.get("rule"), str):
                return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "trigger contract"}}
            compact_triggers.append({"id": t["id"], "rule": t["rule"]})

        limitations = schedule.get("limitations")
        if not isinstance(limitations, list) or not limitations:
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "limitations contract"}}

        payload = {
            "kind": "csoai.art50-recheck-schedule/0.1",
            "status": "PROBED",
            "release_id": RELEASE_ID,
            "schedule_generated_at": schedule.get("generated_at"),
            "schedule_sha256": _sha256(raw),
            "n_points": len(compact_points),
            "points": compact_points,
            "n_triggers": len(compact_triggers),
            "triggers": compact_triggers,
            "inputs": {
                "census_release_id": inputs.get("census_release_id"),
                "census_sha256_pinned": pinned,
                "census_sha256_now": census_now,
                "inputs_changed": inputs_changed,
            },
            "law": {
                "applies_from": law.get("regulation_applies_from"),
                "pre_existing_systems_until": law.get("pre_existing_systems_until"),
                "pre_existing_systems_basis": law.get("pre_existing_systems_basis"),
            },
            "first_reading_taken": False,
            "not_a_compliance_calendar": True,
            "endpoint": ENDPOINT,
            "unmeasured": list(limitations),
        }
        size = len(_canonical(payload))
        if size > PAYLOAD_CAP:
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "payload cap", "bytes": size}}

        leaf = {
            "surface": "public.notice",
            "subject": "Art 50 marking detection re-check schedule",
            "as_of": schedule.get("generated_at"),
            "source_urls": ["https://councilof.ai" + ENDPOINT],
            "payload": payload,
            "unmeasured": list(limitations),
            "tags": ["public-notice", "art50", "recheck-schedule"],
        }
        return {
            "leaves": [leaf],
            "sidecar": {
                "status": "PROBED",
                "n_points": len(compact_points),
                "n_triggers": len(compact_triggers),
                "inputs_changed": inputs_changed,
                "payload_bytes": size,
            },
        }
    except Exception as exc:  # never raise into the publisher
        return {"leaves": [], "sidecar": {"status": "INVALID", "reason": type(exc).__name__}}
