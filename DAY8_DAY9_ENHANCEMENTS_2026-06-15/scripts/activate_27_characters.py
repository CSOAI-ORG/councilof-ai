#!/usr/bin/env python3
"""activate_27_characters.py v2 — flatten archetypes → character list."""
import json
from pathlib import Path

CHARS_FILE = Path("/Users/nicholas/clawd/meok-one/meok_one/characters.json")
LEDGER = Path("/Users/nicholas/clawd/DAY8_DAY9_ENHANCEMENTS_2026-06-15/character_activation.json")


def main():
    with open(CHARS_FILE) as f:
        data = json.load(f)
    # Flatten archetypes[].characters[] to a list of 27 IDs
    chars = []
    for arch in data.get("archetypes", []):
        for cid in arch.get("characters", []):
            chars.append({"id": cid, "archetype": arch.get("id"), "label": arch.get("label")})
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    ledger = {
        "ts": "2026-06-16T05:00:00Z",
        "total": data.get("total", len(chars)),
        "activated": [c["id"] for c in chars],
        "dormant": [],
        "by_archetype": {arch["id"]: arch["characters"] for arch in data.get("archetypes", [])},
    }
    with open(LEDGER, "w") as f:
        json.dump(ledger, f, indent=2)
    print(f"ACTIVATED: {len(ledger['activated'])} characters")
    print(f"ARCHETYPES: {len(ledger['by_archetype'])}")
    for arch, members in ledger["by_archetype"].items():
        print(f"  {arch}: {len(members)} chars — {', '.join(members)}")
    print(f"Ledger: {LEDGER}")


if __name__ == "__main__":
    main()
