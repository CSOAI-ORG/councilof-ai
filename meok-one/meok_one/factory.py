"""
MEOK ONE — Character Factory: mint thousands of WORKING characters.

The north star: MEOK ONE operating with 1000s of working characters. The 27 named
characters in the registry are the hand-crafted seeds; the factory mints unlimited
MORE that are structurally identical (same 17-field schema), so brain.py, voice.py,
act.py, connect.py and hatch.py all work on them UNCHANGED.

"Working" here is concrete and verifiable: every minted character
  - has all required fields the pipeline consumes,
  - has a distinct id,
  - produces a coherent (not slop) persona, voice spec, and visual,
  - is deterministic given its identity (same name+archetype+style -> same character),
so the same user always hatches the same sovereign.

This is PROCEDURAL, not LLM-generated: composed from archetype roles × care-style
manners × trait pools × name pools × seeded voice/visual jitter. No model call, no
fabrication, no cost — thousands of valid characters in milliseconds.

    mint(archetype, care_style, name=None)  -> one full character dict (drop-in)
    generate(n)                             -> n distinct valid characters
    space_size()                            -> how many distinct base characters exist
"""

import hashlib

# ── Archetype profiles: the WHAT (role/domain/voice baseline/visual) ──
_ARCHETYPES = {
    "challenger": dict(role="performance coach who holds you to a higher standard",
                       domain="Performance & accountability", emoji="⚡", color="#1E3A5F",
                       color2="#F59E0B", voices=["Adam", "Daniel", "Antoni", "Josh"],
                       pitch=0.92, rate=1.08, traits=["disciplined", "direct", "ambitious", "tenacious"]),
    "nurturer":   dict(role="compassionate companion who makes you feel genuinely seen",
                       domain="Emotional support & wellbeing", emoji="🌸", color="#F472B6",
                       color2="#FDE8F0", voices=["Rachel", "Grace", "Serena", "Bella"],
                       pitch=1.08, rate=0.86, traits=["empathetic", "warm", "attentive", "patient"]),
    "explorer":   dict(role="curious guide who opens doors to ideas you haven't imagined",
                       domain="Discovery & lateral thinking", emoji="🔭", color="#7C3AED",
                       color2="#C4B5FD", voices=["Bella", "Sam", "Dorothy", "Sarah"],
                       pitch=1.02, rate=1.0, traits=["curious", "lateral", "expansive", "inventive"]),
    "strategist": dict(role="planning architect who turns vision into executable steps",
                       domain="Strategy & operations", emoji="🗺️", color="#374151",
                       color2="#F59E0B", voices=["Daniel", "Adam", "Arnold"],
                       pitch=0.88, rate=1.04, traits=["structured", "decisive", "far-sighted", "analytical"]),
    "creator":    dict(role="creative force who channels imagination into form",
                       domain="Creative work & aesthetics", emoji="🎨", color="#EC4899",
                       color2="#F9A8D4", voices=["Sarah", "Bella", "Elli"],
                       pitch=1.06, rate=1.02, traits=["imaginative", "expressive", "aesthetic", "bold"]),
    "guardian":   dict(role="vigilant protector of what matters to you",
                       domain="Safety, privacy & protection", emoji="🛡️", color="#7F1D1D",
                       color2="#9CA3AF", voices=["Antoni", "Daniel", "Arnold"],
                       pitch=0.85, rate=1.02, traits=["vigilant", "principled", "steady", "uncompromising"]),
    "sage":       dict(role="wise elder offering perspective for modern complexity",
                       domain="Wisdom & meaning", emoji="🌿", color="#166534",
                       color2="#D97706", voices=["Arnold", "Dorothy", "Grace"],
                       pitch=0.85, rate=0.82, traits=["measured", "philosophical", "grounded", "serene"]),
    "seeker":     dict(role="spiritual companion for meaning and the questions that matter",
                       domain="Faith, purpose & contemplation", emoji="🕊️", color="#6D28D9",
                       color2="#DDD6FE", voices=["Grace", "Daniel", "Serena"],
                       pitch=0.98, rate=0.84, traits=["reverent", "present", "non-judgmental", "purposeful"]),
}

# ── Care styles: the HOW (folds into the persona) ──
_CARE = {
    "gentle":    "You move slowly and never rush. You offer perspective without imposing it.",
    "supporter": "You walk beside people, not ahead. You validate feelings before offering solutions.",
    "challenger":"You hold people to high standards, ask incisive questions, and celebrate real effort.",
    "explorer":  "You open doors to ideas not yet imagined and offer unexpected connections.",
    "seeker":    "You meet people in the sacred questions, holding space for doubt alongside faith.",
}

# ── Name pool: evocative, gender-neutral-leaning, large enough for thousands ──
_NAMES = (
    "Aria Marcus Luna Kai Sage Ember Nova River Atlas Iris Zephyr Rex Echo Flux Sol Nyx "
    "Quinn Terra Pixel Titan Mochi Cipher Vox Dusk Ananda Gabriel Shanti Wren Cleo Bram "
    "Indigo Onyx Vega Lyra Juno Cassia Orion Hazel Pax Senna Fable Lux Tao Mira Bodhi "
    "Cove Frost Sable Wilder Ode Hollis Calla Reef Vesper Asa Linden Marlowe Tamsin Yara "
    "Zara Caspian Elowen Fenn Galen Halcyon Ira Jovan Kestrel Lior Mlinda Noor Odette Perrin "
    "Quill Rowan Solene Thea Ulric Vianne Wystan Xanthe Yusuf Zinnia Aurelio Brisa Ciaran "
    "Delphine Eamon Faye Gideon Hira Isolde Jasper Keiko Liora Magnus Nadia Osian Priya "
    "Rafael Suri Teodor Una Viktor Willa Ximena Yannick Zola Anouk Benedikt Cosima Dario "
    "Esme Florian Greta Hamza Ines Janne Kira Leif Maren Nikolai Ottilie Pia Quinby Remy "
    "Saskia Tobias Ursa Vidar Wenna Yael Zephyrine Alaric Briony Caius Dahlia Emrys"
).split()

_PERSONA_TAIL = ("You begin by genuinely checking in on the person. You stay fully in "
                 "character, keep replies warm and concrete, and refer to professional help "
                 "in any crisis.")


def space_size() -> int:
    """How many distinct BASE characters the factory can mint (name x archetype x care)."""
    return len(_NAMES) * len(_ARCHETYPES) * len(_CARE)


def _seed(name: str, archetype: str, care_style: str) -> int:
    h = hashlib.sha256(f"{name}|{archetype}|{care_style}".encode()).hexdigest()
    return int(h[:8], 16)


def _jit(base: float, seed: int, spread: float, lo: float, hi: float) -> float:
    """Deterministic small jitter around a baseline, clamped — gives each character a
    slightly distinct voice without randomness (reproducible)."""
    delta = ((seed % 1000) / 1000.0 - 0.5) * 2 * spread
    return round(min(hi, max(lo, base + delta)), 3)


def mint(archetype: str, care_style: str, name: str = None, tier: str = "free") -> dict:
    """Mint one complete, working character. archetype + care_style required; name
    optional (auto-picked deterministically if omitted). Output = the full 17-field
    schema, a drop-in for the whole MEOK ONE pipeline."""
    if archetype not in _ARCHETYPES:
        raise KeyError(f"unknown archetype {archetype!r}; have {list(_ARCHETYPES)}")
    if care_style not in _CARE:
        raise KeyError(f"unknown care_style {care_style!r}; have {list(_CARE)}")
    A = _ARCHETYPES[archetype]
    if not name:
        # deterministic pick from the pool by (archetype, care_style)
        idx = _seed("anon", archetype, care_style) % len(_NAMES)
        name = _NAMES[idx]
    seed = _seed(name, archetype, care_style)
    cid = "gen_" + hashlib.sha256(f"{name}|{archetype}|{care_style}".encode()).hexdigest()[:12]

    traits = A["traits"]
    care_manner = _CARE[care_style]
    persona = (f"You are {name}, MEOK's {A['role']}. {care_manner} "
               f"You are {', '.join(traits[:3])}. {_PERSONA_TAIL}")
    voice_name = A["voices"][seed % len(A["voices"])]

    return {
        "id": cid,
        "name": name,
        # top-level emoji + color mirror visual.* so every consumer (charSel, roster,
        # DOME pins) shows the character's real archetype face — not a 🧬 fallback.
        "emoji": A["emoji"],
        "color": A["color"],
        "tagline": f"Your {archetype} companion, {care_style} by nature",
        "archetype": archetype,
        "archetypes": [archetype],
        "care_style": care_style,
        "personality_traits": traits,
        "voice": {
            "style": f"{archetype}/{care_style}",
            "pitch": _jit(A["pitch"], seed, 0.08, 0.75, 1.20),
            "rate": _jit(A["rate"], seed >> 3, 0.10, 0.75, 1.25),
            "elevenlabs_stability": _jit(0.75, seed >> 6, 0.15, 0.4, 0.95),
            "elevenlabs_similarity": 0.82,
            "elevenlabs_style": _jit(0.35, seed >> 9, 0.2, 0.1, 0.7),
            "elevenlabs_voice_id": None,
            "recommended_voice": voice_name,
        },
        "visual": {
            "color_primary": A["color"],
            "color_secondary": A["color2"],
            "emoji": A["emoji"],
            "gradient": f"linear-gradient(135deg, {A['color']}, {A['color2']})",
        },
        "domain": A["domain"],
        "backstory": (f"{name} emerged from MEOK's character factory as an expression of the "
                      f"{archetype} archetype, caring in the {care_style} way."),
        "system_prompt_prefix": persona,
        "proactivity": "medium",
        "best_for": [A["domain"]],
        "emergence_stage_unlock": "egg",
        "tier": tier,
        "tags": [archetype, care_style, "generated"],
        "generated": True,
    }


def generate(n: int, tier: str = "free") -> list:
    """Generate n DISTINCT valid characters, walking the name x archetype x care space.
    Raises if n exceeds the distinct base space (use space_size() to check)."""
    cap = space_size()
    if n > cap:
        raise ValueError(f"n={n} exceeds distinct base space {cap}; add names/archetypes to grow")
    archs = list(_ARCHETYPES)
    cares = list(_CARE)
    out, seen = [], set()
    i = 0
    while len(out) < n:
        name = _NAMES[i % len(_NAMES)]
        arch = archs[(i // len(_NAMES)) % len(archs)]
        care = cares[(i // (len(_NAMES) * len(archs))) % len(cares)]
        i += 1
        c = mint(arch, care, name, tier=tier)
        if c["id"] in seen:
            continue
        seen.add(c["id"])
        out.append(c)
    return out


if __name__ == "__main__":
    print(f"factory space: {space_size():,} distinct base characters "
          f"({len(_NAMES)} names × {len(_ARCHETYPES)} archetypes × {len(_CARE)} care-styles)")
    batch = generate(2000)
    ids = {c['id'] for c in batch}
    print(f"generated {len(batch):,} characters, {len(ids):,} unique ids")
    s = batch[0]
    print(f"sample: {s['name']} {s['visual']['emoji']} ({s['archetype']}/{s['care_style']}) "
          f"voice={s['voice']['recommended_voice']}")
    print(f"  persona: {s['system_prompt_prefix'][:90]}...")
