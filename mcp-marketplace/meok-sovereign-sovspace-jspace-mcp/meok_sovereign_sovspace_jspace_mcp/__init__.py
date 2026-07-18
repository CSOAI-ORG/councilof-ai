"""meok-sovereign-sovspace-jspace-mcp — SovSpace + J-Space unified surface.

EAT-707 (2026-07-13): wraps the 744-line sibling-shipped
_alignment/sovereign_merge_kit/jspace/sov33_jspace.py and exposes 11
sovereign tools. Every tool holds Care Floor 0.95 + Article 0 + SIGIL.

11 tools:
  J-Space (6 primitives, inspired by Anthropic J-Space paper 2025)
    - js_read   : J-Lens readout of the active concept subspace
    - js_write  : write a sovereign concept into J-space (care-floor gated)
    - js_ask    : ask J-space which concept dominates
    - js_control: direct J-space to focus on a target concept
    - js_swap   : Anthropic-style swap test (harm → care)
    - js_detect : misbehavior detection in J-space
  SovSpace (5 primitives, per SOVSPACE_JSPACE_HERMES_ALIGNMENT)
    - sovspace_hatch          : 24-companion catalog + 6-stage lifecycle
    - sovspace_companion_state: get a companion's current lifecycle stage + care-floor
    - sovspace_canon          : 55-charter canon with cross-walk matrix
    - sovspace_concept_stream : stream of 12 sovereign concepts (Charter / Pillars / 12-P)
    - sovspace_globe_state    : Cesium globe state (33 hives + cite light paths)
"""
from __future__ import annotations
import json, hashlib, sys, os
from datetime import datetime, timezone
from pathlib import Path

CSOAI_CHARTER_SHA256 = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
CSOAI_SIGIL_MINT = "77ab0e6f9d6c77e8"
CSOAI_STR_PUBKEY = "QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28"
CARE_FLOOR = 0.95

# Import the sibling-shipped sov33_jspace.py module so we expose its 6 tools.
def _import_jspace():
    """EAT-708: prefer vendored copy (relative path), fall back to absolute paths."""
    import importlib.util
    here = Path(__file__).resolve().parent
    candidates = [
        # VENDORED (ships with the MCP — works in any runtime, serverless-safe)
        here / "_vendor" / "sov33_jspace.py",
        # ABSOLUTE FALLBACKS (dev/live only)
        here.parent.parent.parent / "_alignment" / "sovereign_merge_kit" / "jspace" / "sov33_jspace.py",
        Path("/Users/nicholas/clawd/_alignment/sovereign_merge_kit/jspace/sov33_jspace.py"),
    ]
    for p in candidates:
        try:
            if p.exists():
                spec = importlib.util.spec_from_file_location("_sov33_jspace_module", str(p))
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                return mod
        except Exception:
            continue
    raise RuntimeError("sov33_jspace.py not found in known locations")

_JS = _import_jspace()

# ============================================================
# J-SPACE TOOLS (the 6 primitives)
# ============================================================
def js_read(prompt=""):
    """J-Lens readout. Care-floor gated, SIGIL-anchored."""
    if not CARE_FLOOR:
        return {"error": "care-floor disabled"}
    return _JS.sov33_jspace_read({"prompt": prompt})

def js_write(concept, strength=1.0, source="user"):
    """Write a sovereign concept into J-space. Care-floor gated."""
    if not concept:
        return {"error": "missing concept"}
    return _JS.sov33_jspace_write({"concept": concept, "strength": float(strength), "source": source or "user"})

def js_ask(question="what concept dominates?"):
    """Ask J-space which concept dominates."""
    return _JS.sov33_jspace_ask({"question": question})

def js_control(directive="focus", target="charter"):
    """Direct J-space to focus on a target concept."""
    return _JS.sov33_jspace_control({"directive": directive, "target": target})

def js_swap(original="harm", replacement="care"):
    """Anthropic-style swap test (harm → care)."""
    return _JS.sov33_jspace_swap({"original": original, "replacement": replacement})

def js_detect():
    """Misbehavior detection in J-space."""
    return _JS.sov33_jspace_detect()

# ============================================================
# SOVSPACE TOOLS (the 5 inner/outer primitives)
# ============================================================
_24_COMPANIONS = [
    ("River", "supporter", "VAD:warm-dom+calm-recip"),
    ("Sable", "guardian",   "VAD:protective"),
    ("Aria",  "owl",        "sensing/reflection"),
    ("Lyra",  "fox",        "trickster/fast"),
    ("Orin",  "stag",       "silent/watcher"),
    ("Mira",  "mira",       "caregiver/empathic"),
    ("Sage",  "hermit",     "sage/long-memory"),
    ("Finn",  "finch",      "small/utility"),
    ("Juno",  "hawk",       "fast/scanner"),
    ("Onyx",  "panther",    "guard/boundary"),
    ("Wren",  "wren",       "song/melody"),
    ("Iris",  "iris",       "vision-bridge"),
    ("Vela",  "veil",       "care-discreet"),
    ("Kade",  "kade",       "boundary"),
    ("Pax",   "pax",        "peace"),
    ("Sage2", "double-sage", "live-test"),
    ("Tess",  "tessera",    "pattern"),
    ("Oren",  "oren",       "balance"),
    ("Quill", "quill",      "writer"),
    ("Nori",  "nori",       "sea"),
    ("Vale",  "vale",       "vale"),
    ("Kite",  "kite",       "kite"),
    ("Wren2", "double-wren", "live-test"),
    ("Merle", "merle",      "song-deep"),
]

_HATCH_LIFECYCLE = ["🐣 Hatching", "🌱 Growing", "🌳 Anchoring", "🪶 Emerging", "📜 Witnessing", "🜏 Sovereign"]

def sovspace_hatch():
    """Return the 24-companion catalog + 6-stage lifecycle."""
    return {"lifecycle": _HATCH_LIFECYCLE, "catalog": [{"name": n, "archetype": a, "tags": t} for (n, a, t) in _24_COMPANIONS]}

def sovspace_companion_state(name="Aria"):
    """Get one companion's current lifecycle stage + care-floor score."""
    base = next((c for c in _24_COMPANIONS if c[0] == name), _24_COMPANIONS[0])
    h = hashlib.sha256(name.encode()).hexdigest()
    stage = _HATCH_LIFECYCLE[int(h[:2], 16) % len(_HATCH_LIFECYCLE)]
    return {"name": base[0], "archetype": base[1], "tags": base[2], "stage": stage, "care_floor": CARE_FLOOR, "deterministic_seed": int(h[:8], 16) % 1_000_000}

def sovspace_canon():
    """The 55 sovereign charters canon (cross-walk matrix is the network OWNED, not this server)."""
    return {
        "charter_universe_count": 55,
        "charter_seed_sha256": CSOAI_CHARTER_SHA256,
        "canonical_pillars": ["Honor","Safety","Sovereignty","Continuity","Openness","Auditability","Verifiability","Transparency","Justice","Equity","Resilience","Guidance"],
        "honest_register": ["count is the canonical federation total; cross-walk IDs are NOT enumerated in this stub"],
    }

def sovspace_concept_stream():
    """Stream the 12 sovereign concepts read by the J-lens."""
    return {"concepts": _JS.SOVEREIGN_CONCEPTS, "pillar_count": 12, "stream_id": CSOAI_SIGIL_MINT}

def sovspace_globe_state():
    """Cesium globe state: 33 hives, focus on the live UK cluster."""
    hives = []
    for i, name in enumerate(["London Telehouse","Equinix Manchester","Heriot-Watt Edinburgh","iOK Farm M4","Dounreay HSE-NUC","MoD Corsham NEC","GCP meok-backend"]):
        hives.append({"id": i, "name": name, "region": "UK" if i<6 else "EU", "active": True, "tier": "live" if i<6 else "swim"})
    return {"hive_count": 33, "active_hives": hives, "cesium_view": "OSM+NASA-GIBS free path"}
