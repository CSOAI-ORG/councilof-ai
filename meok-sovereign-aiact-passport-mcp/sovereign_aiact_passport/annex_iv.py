"""
EU AI Act Annex IV technical-documentation generator.

Reads `docs/ANNEX_IV_TEMPLATE.json`, takes a passport, and produces a
filled Annex IV bundle. Each required field is filled either:
  - From the passport body itself (system, version, etc.)
  - As a placeholder `_fill before submission_` if missing

Honesty register
----------------
The provider is responsible for the technical documentation. We scaffold
it; they fill it. The signed passport — a separate artifact — proves the
*existence* of an attestation, not the truth of every field.

If an auditor asks "why isn't item 7 (risk-management) filled?", we
say: that's the operator's job. The template + this tool make the
operator's job easier, not unnecessary.
"""

from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


# ────────────────────────────────────────────────────────────────────
# Load template at import time
# ────────────────────────────────────────────────────────────────────


def _default_template_path() -> Path:
    return Path(__file__).parent.parent / "docs" / "ANNEX_IV_TEMPLATE.json"


def load_template(path: Optional[Path] = None) -> dict:
    """Load the Annex IV template JSON from disk."""
    p = path or _default_template_path()
    if not p.exists():
        raise FileNotFoundError(
            f"Annex IV template not found at {p}. "
            f"Reinstall the package or call load_template(path='custom.json')."
        )
    return json.loads(p.read_text(encoding="utf-8"))


# Default template — loaded once
DEFAULT_TEMPLATE: Optional[dict] = None


def _t() -> dict:
    global DEFAULT_TEMPLATE
    if DEFAULT_TEMPLATE is None:
        DEFAULT_TEMPLATE = load_template()
    return DEFAULT_TEMPLATE


# Public alias for backward compat with endpoints.py
ANNEX_IV_TEMPLATE = None  # populated lazily


def _ensure_template_loaded() -> dict:
    """Lazy-load + assign the module-level alias for endpoints.py."""
    global ANNEX_IV_TEMPLATE
    if ANNEX_IV_TEMPLATE is None:
        ANNEX_IV_TEMPLATE = load_template()
    return ANNEX_IV_TEMPLATE


# ────────────────────────────────────────────────────────────────────
# Field-filling logic
# ────────────────────────────────────────────────────────────────────


def _read_passport_field(passport: dict, dotted_path: str, default: Any = None) -> Any:
    """Read a nested field from a passport body using dotted notation."""
    body = passport.get("body") if isinstance(passport, dict) else None
    if not isinstance(body, dict):
        return default
    cur: Any = body
    for key in dotted_path.split("."):
        if isinstance(cur, dict) and key in cur:
            cur = cur[key]
        else:
            return default
    return cur


def _fill_field(
    field_def: dict,
    passport: dict,
    system_id: str,
) -> dict:
    """Fill one Annex IV field. Returns dict with 'name', 'type', 'value', '_filled'."""
    name = field_def["name"]
    ftype = field_def["type"]
    required = field_def.get("required", True)

    # Heuristic mapping from passport body → annex_iv field
    passthrough_map = {
        "intended_purpose":  "purpose",
        "provider_name":     "name",
        "system_id":         "system",
        "version":           "result.version",
        "release_date":      "result.release_date",
        "intended_users":    "result.intended_users",
        "primary_purpose":   "purpose",
        "current_version":   "result.version",
    }
    value: Any = None
    if name in passthrough_map:
        value = _read_passport_field(passport, passthrough_map[name])

    # Fill system_id / provider_name from defaults if missing
    if value is None and name == "system_id":
        value = system_id
    if value is None and name == "provider_name":
        value = passport.get("name") if isinstance(passport, dict) else None

    # Some fields have known sensible defaults from the tier
    if value is None and name == "oversight_level":
        tier = _read_passport_field(passport, "result.tier", default="")
        value = {
            "limited_risk": "human-on-the-loop",
            "high_risk":    "human-in-the-loop",
            "prohibited":   "human-in-the-loop",  # would not deploy
            "minimal":      "human-out-of-the-loop",
        }.get(tier, "human-on-the-loop")
    if value is None and name == "kill_switch":
        value = True
    if value is None and name == "personal_data_involved":
        tier = _read_passport_field(passport, "result.tier", default="")
        value = tier in ("high_risk", "limited_risk")
    if value is None and name == "annex_iii_hit":
        value = False

    if value is None and not required:
        value = ""

    return {
        "name": name,
        "type": ftype,
        "required": required,
        "value": value,
        "_filled": value is not None and value != "",
    }


# ────────────────────────────────────────────────────────────────────
# Generator
# ────────────────────────────────────────────────────────────────────


def generate_annex_iv(
    *,
    template: dict,
    passport: dict,
    system_id: str,
) -> dict:
    """Take a passport + Annex IV template, produce a filled bundle.

    Returns a dict with:
      - `system_id`
      - `provider_name`  (operator must overwrite)
      - `_generated_at`  (timestamp)
      - `_passport_id`   (report_id of the source passport)
      - `annex_iv_items`: list[dict], 9 items × fields
    """
    body = passport.get("body") if isinstance(passport, dict) else None
    report_id = (
        passport.get("report_id")
        or passport.get("id")
        or (body.get("report_id") if isinstance(body, dict) else None)
        or "?"
    )

    bundle = {
        "system_id": system_id,
        "provider_name": (passport.get("name") if isinstance(passport, dict) else None) or "[FILL: provider legal name]",
        "_generated_at": datetime.now(timezone.utc).isoformat(),
        "_passport_id": report_id,
        "_template_v": template.get("_template_v", "?"),
        "_honesty_register": template.get("_honesty_register", ""),
        "annex_iv_items": [],
    }

    for item_def in template.get("items", []):
        fields_filled = []
        fields_unfilled = []
        for field_def in item_def.get("fields", []):
            result = _fill_field(field_def, passport, system_id)
            entry = {
                "name": result["name"],
                "type": result["type"],
                "value": result["value"],
            }
            if result["_filled"]:
                fields_filled.append(entry)
            else:
                fields_unfilled.append(entry)

        bundle["annex_iv_items"].append({
            "item": item_def["item"],
            "title": item_def["title"],
            "fields_filled": fields_filled,
            "fields_unfilled": fields_unfilled,
            "_filled": len(fields_unfilled) == 0,
        })

    return bundle


# ────────────────────────────────────────────────────────────────────
# At-import convenience: load template lazily
# ────────────────────────────────────────────────────────────────────

_ensure_template_loaded()
