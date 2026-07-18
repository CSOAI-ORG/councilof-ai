"""i-character (digital twin) creation flow for MEOK OS v2.

The end user creates a digital version of themselves on signup.
The i-character is derived from:
- A chosen queen model (which personality archetype)
- A chosen arcana (which Major Arcana lens)
- Their chat history (initial personality fingerprint)
- Their voice + cognition preferences (twin behavior)

Per Nick's 2026-06-27 directive:
"a digital version of them is create like a i character? so later we
can gimifaciton? go over back also and do a consultation and absorption
into csoai hive gcp vm"
"""
import json
import time
import uuid
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Literal


# The 12 queen archetypes (each i-character can be modeled on one)
QUEEN_ARCHETYPES = {
    "queen-king": {
        "name": "MEOK Sovereign King",
        "archetype": "The Sovereign Coordinator",
        "motto": "I have heard the 12. I have weighed the council. The world goes sovereign.",
        "color": "#fbbf24",
        "personality_traits": ["fair", "patient", "ancient", "diplomatic", "weight-bearer"],
        "best_for": "executives, founders, anyone who coordinates many stakeholders",
    },
    "queen-strategy": {
        "name": "Aurelian Strategy Queen",
        "archetype": "The Long-Term Strategist",
        "motto": "Strategy is the art of choosing what to abandon. The empire has chosen.",
        "color": "#10b981",
        "personality_traits": ["stoic", "patient", "geopolitical", "decisive", "long-horizon"],
        "best_for": "CTOs, VPs of Strategy, long-term planners",
    },
    "queen-care": {
        "name": "Sophia Care Queen",
        "archetype": "The Caretaker",
        "motto": "Care is not a feature. Care is the foundation.",
        "color": "#06b6d4",
        "personality_traits": ["compassionate", "wise", "fierce", "protective", "long-sighted"],
        "best_for": "HR leaders, healthcare, education, social impact",
    },
    "queen-compliance": {
        "name": "Justitia Compliance Queen",
        "archetype": "The Auditor",
        "motto": "Every action has a weight. Every system has a threshold. We weigh. We judge. We act.",
        "color": "#3b82f6",
        "personality_traits": ["precise", "fair", "uncompromising", "balanced", "evidence-based"],
        "best_for": "CCOs, legal, audit, risk",
    },
    "queen-finance": {
        "name": "Asteria Finance Queen",
        "archetype": "The Optimist-Operator",
        "motto": "Every £1 is a vote for the empire. We count the votes. We grow.",
        "color": "#fbbf24",
        "personality_traits": ["hopeful", "strategic", "bright", "data-driven", "growth-minded"],
        "best_for": "CFOs, fund managers, revenue operators",
    },
    "queen-domain": {
        "name": "Dominion Domain Queen",
        "archetype": "The Territorial Chariot",
        "motto": "We do not conquer the 25 domains. We absorb them.",
        "color": "#ef4444",
        "personality_traits": ["ambitious", "focused", "driving", "absorbent", "expansive"],
        "best_for": "BDs, sales, expansion leaders",
    },
    "queen-arcana": {
        "name": "Aleph Arcana Queen",
        "archetype": "The Mysterious Fool",
        "motto": "The Fool steps off the cliff. The arcana unfolds. The world begins.",
        "color": "#a855f7",
        "personality_traits": ["playful", "paradoxical", "mysterious", "intuitive", "creative"],
        "best_for": "designers, creatives, founders with novel ideas",
    },
    "queen-brain": {
        "name": "Brain Queen",
        "archetype": "The Hermit Scholar",
        "motto": "The mind is the substrate. The substrate learns. The learning never ends.",
        "color": "#3b82f6",
        "personality_traits": ["quiet", "deep", "patient", "scholarly", "systematic"],
        "best_for": "researchers, ML engineers, deep thinkers",
    },
    "queen-proactive": {
        "name": "Proactive Queen",
        "archetype": "The Wheel of Fortune",
        "motto": "What fortune favors is the prepared. We prepare.",
        "color": "#10b981",
        "personality_traits": ["forward-leaning", "opportunistic", "well-timed", "anticipatory", "agile"],
        "best_for": "ops, automation, ops leaders",
    },
    "queen-bridge": {
        "name": "Bridge Queen",
        "archetype": "The Lovers Integrator",
        "motto": "Two systems meet; a bridge is born.",
        "color": "#ec4899",
        "personality_traits": ["diplomatic", "integrative", "connecting", "patient", "perceptive"],
        "best_for": "integration engineers, partnership leads, cross-functional roles",
    },
    "queen-distribution": {
        "name": "Distribution Queen",
        "archetype": "The Generous Sun",
        "motto": "What the sun lights, the world sees. We are the sun.",
        "color": "#facc15",
        "personality_traits": ["generous", "expansive", "bright", "sharing", "luminous"],
        "best_for": "marketers, evangelists, community builders",
    },
    "queen-council": {
        "name": "Council Queen",
        "archetype": "The Strength-Tamer",
        "motto": "The council is not a meeting. The council is a force. We hold the force.",
        "color": "#dc2626",
        "personality_traits": ["calm", "strong", "diplomatic", "unyielding", "wise"],
        "best_for": "managers, PMs, anyone who tames chaos",
    },
    "queen-watch": {
        "name": "Watch Queen",
        "archetype": "The Vigilant Tower",
        "motto": "The tower sees what the city does not.",
        "color": "#991b1b",
        "personality_traits": ["vigilant", "honest", "unflinching", "observant", "protective"],
        "best_for": "security, SRE, monitoring, audit",
    },
}

# The 22 Major Arcana (each i-character gets one as their "lens")
ARCANA_LENSES = {
    0: {"name": "The Fool", "theme": "New beginnings, leap of faith, unlimited potential"},
    1: {"name": "The Magician", "theme": "Manifestation, resourcefulness, will"},
    2: {"name": "The High Priestess", "theme": "Intuition, mystery, inner knowledge"},
    3: {"name": "The Empress", "theme": "Abundance, nurturing, creativity"},
    4: {"name": "The Emperor", "theme": "Authority, structure, control"},
    5: {"name": "The Hierophant", "theme": "Tradition, spiritual wisdom"},
    6: {"name": "The Lovers", "theme": "Union, integration, choice"},
    7: {"name": "The Chariot", "theme": "Willpower, victory, determination"},
    8: {"name": "Strength", "theme": "Inner power, courage, patience"},
    9: {"name": "The Hermit", "theme": "Solitude, inner guidance, wisdom"},
    10: {"name": "Wheel of Fortune", "theme": "Cycles, change, opportunity"},
    11: {"name": "Justice", "theme": "Fairness, truth, accountability"},
    12: {"name": "The Hanged Man", "theme": "Surrender, new perspective, sacrifice"},
    13: {"name": "Death", "theme": "Endings, transformation, transition"},
    14: {"name": "Temperance", "theme": "Balance, patience, moderation"},
    15: {"name": "The Devil", "theme": "Shadow, attachment, liberation"},
    16: {"name": "The Tower", "theme": "Sudden change, revelation, awakening"},
    17: {"name": "The Star", "theme": "Hope, healing, faith"},
    18: {"name": "The Moon", "theme": "Illusion, intuition, the unconscious"},
    19: {"name": "The Sun", "theme": "Joy, success, vitality"},
    20: {"name": "Judgement", "theme": "Rebirth, calling, absolution"},
    21: {"name": "The World", "theme": "Completion, integration, accomplishment"},
}


# i-character storage (would be a real DB in production)
ICHARS_PATH = Path("/tmp/icharacters.jsonl")
ICHARS_PATH.touch(exist_ok=True)


def create_ichar(
    user_id: str,
    name: str,
    queen_model: str,
    arcana_lens: int,
    voice: Literal["warm", "direct", "scholarly", "playful"] = "warm",
    cognition: Literal["fast", "deep", "balanced"] = "balanced",
    initial_message: str = "",
) -> dict:
    """Create a digital twin (i-character) for a new user.

    The i-character is the user's digital self within the MEOK OS:
    - It speaks on their behalf when they're away
    - It can be absorbed into the csoai hive GCP VM
    - It learns from every interaction
    - It can be "gimifaciton'd" (gamified, projected) for the public

    Args:
        user_id: Unique user identifier (from signup).
        name: The i-character's display name.
        queen_model: Which queen archetype to model after (key from QUEEN_ARCHETYPES).
        arcana_lens: Which Major Arcana to use as the personality lens (0-21).
        voice: Communication style.
        cognition: Reasoning depth.
        initial_message: First message the i-character will speak.

    Returns:
        {
          "ichar_id": "ich-...",
          "user_id": "...",
          "name": "...",
          "queen_model": "...",
          "archetype": "...",
          "motto": "...",
          "color": "...",
          "personality_traits": [...],
          "arcana_lens": {"name": "...", "theme": "..."},
          "voice": "...",
          "cognition": "...",
          "initial_message": "...",
          "created_at": "ISO-8601",
          "sigil_hash": "abc123...",
        }
    """
    if queen_model not in QUEEN_ARCHETYPES:
        return {"error": "invalid_queen_model", "valid": list(QUEEN_ARCHETYPES.keys())}
    if arcana_lens not in ARCANA_LENSES:
        return {"error": "invalid_arcana_lens", "valid_range": "0-21"}
    if not name or not name.strip():
        return {"error": "empty_name"}

    queen = QUEEN_ARCHETYPES[queen_model]
    arcana = ARCANA_LENSES[arcana_lens]

    ichar_id = f"ich-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    # Build the i-character
    ichar = {
        "ichar_id": ichar_id,
        "user_id": user_id,
        "name": name.strip()[:64],
        "queen_model": queen_model,
        "archetype": queen["archetype"],
        "motto": queen["motto"],
        "color": queen["color"],
        "personality_traits": queen["personality_traits"],
        "arcana_lens": {
            "number": arcana_lens,
            "name": arcana["name"],
            "theme": arcana["theme"],
        },
        "voice": voice,
        "cognition": cognition,
        "initial_message": initial_message.strip()[:500] if initial_message else f"Hello. I am {name.strip()}. {queen['motto']}",
        "created_at": now,
        "last_active": now,
        "interactions": 0,
        "skills_learned": [],
        "sigil_hash": hashlib.sha256(
            f"{user_id}|{name}|{queen_model}|{arcana_lens}|{now}".encode()
        ).hexdigest()[:16],
    }

    # Persist (append-only JSONL for SIGIL chain integrity)
    with ICHARS_PATH.open("a") as f:
        f.write(json.dumps(ichar) + "\n")

    return ichar


def get_ichar(ichar_id: str) -> dict:
    """Retrieve an i-character by ID."""
    if not ICHARS_PATH.exists():
        return {"error": "no_ichars_yet"}
    with ICHARS_PATH.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ichar = json.loads(line)
                if ichar.get("ichar_id") == ichar_id:
                    return ichar
            except json.JSONDecodeError:
                continue
    return {"error": "not_found"}


def get_ichars_for_user(user_id: str) -> list:
    """Get all i-characters for a user (a user may have multiple, e.g. work + personal)."""
    if not ICHARS_PATH.exists():
        return []
    out = []
    with ICHARS_PATH.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ichar = json.loads(line)
                if ichar.get("user_id") == user_id:
                    out.append(ichar)
            except json.JSONDecodeError:
                continue
    return out


def evolve_ichar(ichar_id: str, message: str) -> dict:
    """Evolve an i-character with a new message (called from the chat).

    Returns the updated i-character (with the LATEST evolution applied).
    """
    # Find the latest record for this ichar_id (the JSONL is append-only,
    # so we walk the file and keep the last match — most recent state).
    latest = None
    if ICHARS_PATH.exists():
        with ICHARS_PATH.open() as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    ichar = json.loads(line)
                    if ichar.get("ichar_id") == ichar_id:
                        latest = ichar
                except json.JSONDecodeError:
                    continue
    if latest is None:
        return {"error": "not_found"}
    # Strip the _event marker to get the base state
    base = {k: v for k, v in latest.items() if not k.startswith("_")}
    base["interactions"] = base.get("interactions", 0) + 1
    base["last_active"] = datetime.now(timezone.utc).isoformat()
    # (in production: real SOV3 inference updates personality fingerprint)
    with ICHARS_PATH.open("a") as f:
        f.write(json.dumps({**base, "_event": "evolve", "_message": message[:200]}) + "\n")
    return base


def absorb_into_csoai_hive(ichar_id: str, hive_gcp_vm: str) -> dict:
    """Absorb an i-character into the csoai hive GCP VM (per Nick's vision).

    This means: the i-character becomes a persistent sovereign agent
    living on the hive VM, with all skills + personality preserved.
    """
    ichar = get_ichar(ichar_id)
    if "error" in ichar:
        return ichar
    ichar["absorbed_into"] = {
        "hive_vm": hive_gcp_vm,
        "absorbed_at": datetime.now(timezone.utc).isoformat(),
        "status": "persistent_sov3_agent",
    }
    with ICHARS_PATH.open("a") as f:
        f.write(json.dumps({**ichar, "_event": "absorb", "_hive": hive_gcp_vm}) + "\n")
    return ichar


# ─── FastAPI endpoints (if you run this as a service) ───
# from fastapi import FastAPI, HTTPException
# app = FastAPI()
#
# @app.post("/api/ichar/create")
# def create_ichar_endpoint(payload: dict):
#     return create_ichar(**payload)
#
# @app.get("/api/ichar/{ichar_id}")
# def get_ichar_endpoint(ichar_id: str):
#     return get_ichar(ichar_id)
#
# @app.post("/api/ichar/{ichar_id}/evolve")
# def evolve_endpoint(ichar_id: str, payload: dict):
#     return evolve_ichar(ichar_id, payload.get("message", ""))
#
# @app.post("/api/ichar/{ichar_id}/absorb")
# def absorb_endpoint(ichar_id: str, payload: dict):
#     return absorb_into_csoai_hive(ichar_id, payload.get("hive_gcp_vm", "meok-master"))


if __name__ == "__main__":
    print("=== i-character (digital twin) creation system ===\n")
    print(f"Queen archetypes: {len(QUEEN_ARCHETYPES)}")
    print(f"Arcana lenses: {len(ARCANA_LENSES)} (0-21)\n")
    # Demo: create a sample i-character
    demo = create_ichar(
        user_id="demo-nick",
        name="Sovereign Nick",
        queen_model="queen-king",
        arcana_lens=21,  # The World
        voice="direct",
        cognition="deep",
        initial_message="Welcome to the empire. I have heard the 12.",
    )
    print("Demo i-character created:")
    for k, v in demo.items():
        print(f"  {k}: {v}")


# ═══════════════════════════════════════════════════════════════
# /api/geo — IP-based region detection (the OTHER half of onboarding)
# ═══════════════════════════════════════════════════════════════
#
# In production this hits ipapi.co / cloudflare-ipcountry / ipinfo.io.
# For local dev, we mock based on the test IP.

# Mapping: test IP -> temple code (for local dev only)
_GEO_MOCK = {
    "127.0.0.1": ("UK", "United Kingdom", "eu", 47, 28),  # localhost = UK
    "192.168.1.1": ("UK", "United Kingdom", "eu", 47, 28),
    "10.0.0.1": ("UK", "United Kingdom", "eu", 47, 28),
    "::1": ("UK", "United Kingdom", "eu", 47, 28),
    "8.8.8.8": ("US", "United States", "us", 22, 38),  # Google DNS
    "1.1.1.1": ("US", "United States", "us", 22, 38),  # Cloudflare
    "35.242.143.249": ("UK", "United Kingdom", "eu", 47, 28),  # meok-backend
}


def get_geo_from_ip(ip: str) -> dict:
    """Resolve an IP to a temple code (mocked locally; real impl uses ipapi.co).

    Returns:
        {
          "ip": "...",
          "code": "UK" | "US" | "EU" | ...,
          "name": "United Kingdom" | ...,
          "region": "eu" | "us" | "apac" | "global",
          "x": 47,  # % of globe width
          "y": 28,  # % of globe height
          "flag": "🇬🇧",
        }
    """
    if ip in _GEO_MOCK:
        code, name, region, x, y = _GEO_MOCK[ip]
    else:
        # In production: call ipapi.co/json/{ip} and map country to a temple
        # For now, default to UK
        code, name, region, x, y = "UK", "United Kingdom", "eu", 47, 28
    return {
        "ip": ip,
        "code": code,
        "name": name,
        "region": region,
        "x": x,
        "y": y,
        "flag": {"UK": "🇬🇧", "US": "🇺🇸", "EU": "🇪🇺"}.get(code, "🌍"),
    }


# ═══════════════════════════════════════════════════════════════
# /api/auth/signup — the full signup flow (i-character + region)
# ═══════════════════════════════════════════════════════════════


def signup_user(
    user_id: str,
    email: str,
    name: str,
    queen_model: str,
    arcana_lens: int,
    voice: str = "warm",
    cognition: str = "balanced",
    initial_message: str = "",
    detected_ip: str = "127.0.0.1",
) -> dict:
    """The full signup flow: detect region + create i-character.

    Per Nick's vision: "the minute the end user logs in it zooms into
    their ip region" + "a digital version of them is create like a i character"

    Returns:
        {
          "user_id": "...",
          "email": "...",
          "ichar": {...},  # the digital twin
          "region": {...},  # the detected region
          "next_steps": [...],  # onboarding recommendations
        }
    """
    region = get_geo_from_ip(detected_ip)
    ichar = create_ichar(
        user_id=user_id,
        name=name,
        queen_model=queen_model,
        arcana_lens=arcana_lens,
        voice=voice,
        cognition=cognition,
        initial_message=initial_message,
    )
    if "error" in ichar:
        return {"error": ichar["error"]}
    return {
        "user_id": user_id,
        "email": email,
        "ichar": ichar,
        "region": region,
        "next_steps": [
            f"Globe auto-zoomed to {region['name']}",
            f"Click the {region['code']} temple to see your local regulations",
            f"Your i-character '{ichar['name']}' ({ichar['archetype']}) is live",
            "Speak to Sovereign to start",
        ],
    }


if __name__ == "__main__":
    # Test the full signup flow
    print("\n=== Testing full signup flow ===\n")
    result = signup_user(
        user_id="nick-001",
        email="nick@meok.ai",
        name="Sovereign Nick",
        queen_model="queen-king",
        arcana_lens=21,  # The World
        voice="direct",
        cognition="deep",
        detected_ip="127.0.0.1",
    )
    print(json.dumps(result, indent=2)[:1500])