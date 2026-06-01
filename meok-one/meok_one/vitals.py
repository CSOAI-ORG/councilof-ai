"""
MEOK ONE — Vitals: the Tamagotchi life layer (Stage 1).

Wraps the REAL emotional state machine from meok/core/emotional_states.py (tested working
2026-05-31) and persists per-character bond/mood/stage to disk so the character LIVES —
it remembers you, its mood evolves, the bond grows across sessions.

    vitals(character_id)              -> current {bond, level, stage, mood, emoji, greeting}
    on_interaction(character_id, msg) -> bumps bond, infers mood from msg, persists, returns vitals
    decay(character_id)               -> applies time-based mood decay since last seen

Persistence: a single JSON file (no DB). Soul-vault encryption is a later hardening step;
for launch, plain JSON keyed by character_id is enough and keeps it dependency-free.

Bond → evolution stage (the Tamagotchi growth):
    egg(0) → hatchling(5) → child(15) → companion(40) → sovereign(100)
Bond rises with positive interaction, dips with neglect (decay). Stage is derived from bond.
"""

import json
import os
import sys
import time
from pathlib import Path

# Wire in the REAL emotion machine (meok/core) — import-path safe, falls back gracefully.
_CORE = Path(__file__).resolve().parents[2] / "meok" / "core"
if str(_CORE) not in sys.path:
    sys.path.insert(0, str(_CORE))
try:
    import emotional_states as _ES  # the tested-real PAD/transition machine
    _HAVE_ES = True
except Exception:
    _HAVE_ES = False

_STORE = Path(os.environ.get("MEOK_VITALS_FILE",
                             Path(__file__).resolve().parent / "data" / "vitals.json"))

# bond threshold -> evolution stage (the growth ladder)
_STAGES = [(0, "egg", "🥚"), (5, "hatchling", "🐣"), (15, "child", "🌱"),
           (40, "companion", "🌸"), (100, "sovereign", "👑")]


def _load() -> dict:
    try:
        return json.loads(_STORE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save(data: dict) -> None:
    _STORE.parent.mkdir(parents=True, exist_ok=True)
    tmp = _STORE.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    tmp.replace(_STORE)


def _stage_for(bond: float) -> tuple:
    s = _STAGES[0]
    for thresh, name, emoji in _STAGES:
        if bond >= thresh:
            s = (thresh, name, emoji)
    return s


def _mood_from(msg: str, machine) -> dict:
    """Infer mood from the message using the real core machine; degrade gracefully."""
    if _HAVE_ES and machine is not None:
        try:
            ctx = _ES.EmotionalContext(user_input=msg or "")
            _ES.apply_context(machine, ctx)
            d = machine.get_state_def()
            return {"mood": machine.current_state.value, "emoji": d.emoji,
                    "color": d.color, "greeting": machine.greeting()}
        except Exception:
            pass
    # fallback: tiny keyword mood
    low = (msg or "").lower()
    if any(w in low for w in ("sad", "down", "tired", "hurt", "lonely", "anxious")):
        return {"mood": "caring", "emoji": "💗", "color": "#f472b6", "greeting": "I'm here with you."}
    if any(w in low for w in ("thank", "love", "great", "amazing", "happy")):
        return {"mood": "joyful", "emoji": "✨", "color": "#fbbf24", "greeting": "That makes me happy."}
    return {"mood": "calm", "emoji": "🌸", "color": "#a78bfa", "greeting": "I'm listening."}


def _new_record(character_id: str) -> dict:
    return {"bond": 0.0, "interactions": 0, "mood": "calm", "emoji": "🌸",
            "first_seen": time.time(), "last_seen": time.time(), "name": None}


def _key(user_id: str, character_id: str) -> str:
    """Per-user, per-character state key. The bond is between THIS user and THIS character,
    so it follows the user across devices (same user_id) — never shared between users."""
    return f"{user_id or 'web'}::{character_id}"


def vitals(character_id: str, user_id: str = "web") -> dict:
    """Current life-state of this character for this user (read-only)."""
    rec = _load().get(_key(user_id, character_id)) or _new_record(character_id)
    thresh, stage, stage_emoji = _stage_for(rec["bond"])
    nxt = next((t for t, _, _ in _STAGES if t > rec["bond"]), None)
    return {
        "character": character_id,
        "bond": round(rec["bond"], 1),
        "level": int(rec["bond"] // 10) + 1,
        "interactions": rec["interactions"],
        "stage": stage,
        "stage_emoji": stage_emoji,
        "next_stage_at": nxt,
        "mood": rec.get("mood", "calm"),
        "mood_emoji": rec.get("emoji", "🌸"),
        "name": rec.get("name"),
        "engine": "emotional_states(core)" if _HAVE_ES else "fallback",
    }


def on_interaction(character_id: str, message: str = "", name: str = None,
                   user_id: str = "web") -> dict:
    """Record an interaction: grow the bond, update mood from the message, persist (per user)."""
    data = _load()
    k = _key(user_id, character_id)
    rec = data.get(k) or _new_record(character_id)

    # bond growth: +1 per interaction, +0.5 bonus for warm messages, cap 200
    low = (message or "").lower()
    warm = any(w in low for w in ("thank", "love", "great", "good", "happy", "miss", "care"))
    rec["bond"] = min(200.0, rec["bond"] + 1.0 + (0.5 if warm else 0.0))
    rec["interactions"] = rec.get("interactions", 0) + 1
    rec["last_seen"] = time.time()
    if name:
        rec["name"] = name

    machine = _ES.EmotionalStateMachine() if _HAVE_ES else None
    mood = _mood_from(message, machine)
    rec["mood"] = mood["mood"]
    rec["emoji"] = mood["emoji"]

    data[k] = rec
    _save(data)
    out = vitals(character_id, user_id)
    out.update({"mood_color": mood["color"], "mood_greeting": mood["greeting"]})
    return out


def decay(character_id: str, user_id: str = "web") -> dict:
    """Apply gentle bond decay for time away (the Tamagotchi 'needs you' pull)."""
    data = _load()
    k = _key(user_id, character_id)
    rec = data.get(k)
    if not rec:
        return vitals(character_id, user_id)
    hours_away = (time.time() - rec.get("last_seen", time.time())) / 3600.0
    if hours_away >= 24:
        rec["bond"] = max(0.0, rec["bond"] - min(5.0, hours_away / 24.0))  # ~1/day, capped
        data[k] = rec
        _save(data)
    return vitals(character_id, user_id)


if __name__ == "__main__":
    cid = sys.argv[1] if len(sys.argv) > 1 else "aria"
    print("engine:", "core emotional_states" if _HAVE_ES else "fallback")
    print("start:", vitals(cid))
    print("after 'thank you so much!':", on_interaction(cid, "thank you so much!"))
    print("after 'i feel really low':", on_interaction(cid, "i feel really low today"))
