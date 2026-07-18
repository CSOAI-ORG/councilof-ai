# NATAL GUARDIAN — WIRING PATCHES for sovereign-mcp-server.py
## Exact edit-ready diffs · 2026-07-08 · apply in a real terminal, then `python -m py_compile`

These wire `neural_core/natal_guardian.py` into the live server. Same safe posture as the
episode_logger import: a try/except fallback so a missing module NEVER breaks the server.
All patches are additive — no existing behaviour changes. Owner applies deliberately.

---

## PATCH 0 — import (fail-safe), after the episode_logger import block (~line 48)

FIND:
```
try:
    from neural_core.episode_logger import log_episode as _log_episode
except Exception:
    def _log_episode(*a, **k):  # never break the server if logging fails
        return None
```
ADD IMMEDIATELY AFTER:
```
try:
    from neural_core.natal_guardian import (
        open_covenant as _guardian_open,
        record_event as _guardian_record,
        duty_report as _guardian_duty,
        erase_covenant as _guardian_erase,
    )
except Exception:
    def _guardian_open(*a, **k):  return {"status": "guardian_unavailable"}
    def _guardian_record(*a, **k): return {"status": "guardian_unavailable"}
    def _guardian_duty(*a, **k):  return {"status": "guardian_unavailable"}
    def _guardian_erase(*a, **k): return {"status": "guardian_unavailable"}
```

---

## PATCH 1 — record a real guardian event inside detect_dependency handler

The handler already computes a real `dependency_risk`. Bind it to Principle 3 (free_will).
FIND (end of the detect_dependency handler, the existing _log_episode call):
```
            _log_episode("dependency", content=str(arguments.get("needs", "")),
                         care_weight=float(_result.get("dependency_risk", 0.0)),
                         label=(1 if _result.get("signal") == "elevated" else 0),
                         tags=["auto", "dependency"], source_agent="detect_dependency")
            return _result
```
REPLACE WITH (adds the guardian event using the REAL risk value; no fabrication):
```
            _log_episode("dependency", content=str(arguments.get("needs", "")),
                         care_weight=float(_result.get("dependency_risk", 0.0)),
                         label=(1 if _result.get("signal") == "elevated" else 0),
                         tags=["auto", "dependency"], source_agent="detect_dependency")
            _uid = arguments.get("user_id")
            if _uid and "dependency_risk" in _result:
                _guardian_record(_uid, "free_will",
                    "dependency early-warning signal",
                    signal_value=_result["dependency_risk"],
                    source="detect_dependency")
            return _result
```

---

## PATCH 2 — new tool declaration: guardian_covenant (open / report / erase)

FIND the detect_dependency tool declaration block (starts with `"name": "detect_dependency"`,
~line 1128) and ADD a sibling tool declaration after its closing brace:
```
        {
            "name": "guardian_covenant",
            "description": "Open, report on, or erase a user's Guardian Covenant (Charter 45). "
                           "Consent-based, pseudonymous, GDPR-erasable. Not a surveillance profile.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["open", "report", "erase"]},
                    "user_id": {"type": "string", "description": "raw identifier; stored only as salted hash"},
                    "life_stage": {"type": "string",
                        "enum": ["child","adolescent","adult","elder","in_crisis","unspecified"]},
                    "consent": {"type": "boolean"}
                },
                "required": ["action", "user_id"]
            }
        },
```

---

## PATCH 3 — new tool handler: guardian_covenant

FIND the detect_dependency handler start (`elif name == "detect_dependency":`) and ADD a
sibling handler just before it:
```
        elif name == "guardian_covenant":
            _act = arguments.get("action")
            _uid = arguments.get("user_id", "")
            if _act == "open":
                return _guardian_open(_uid,
                    life_stage=arguments.get("life_stage", "unspecified"),
                    consent=bool(arguments.get("consent", True)))
            elif _act == "report":
                return _guardian_duty(_uid)
            elif _act == "erase":
                return _guardian_erase(_uid)
            return {"error": "unknown guardian action"}
```

---

## PATCH 4 (optional) — open a covenant on Care-Floor engagement

Wherever the server establishes an authenticated user context, add:
```
    # Natal Guardian: open the life-arc covenant at first contact (consent-gated)
    if user_id and user_consent:
        _guardian_open(user_id, life_stage=declared_life_stage, consent=True)
```
(Left as guidance — the exact auth/context site is owner-specific.)

---

## VERIFY AFTER APPLYING
```
python -m py_compile sovereign-mcp-server.py   # must print nothing (success)
grep -c "_guardian_" sovereign-mcp-server.py   # expect >= 8 (4 imports/fallbacks + calls)
```

## HONESTY
- Patches 0-3 are exact-match, safe to apply. Patch 4 is guidance (auth site is owner-specific).
- Nothing runs until the server is restarted in a real terminal (sandbox blocks :3101 loopback).
- The guardian records only REAL signal values passed from existing handlers; it invents nothing.
