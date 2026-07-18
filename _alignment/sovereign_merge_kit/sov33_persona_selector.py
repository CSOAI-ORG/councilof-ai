"""sov33_persona_selector.py — user-selectable AI persona (energy/tone/voice/archetype).

The user picks how their SOV *presents* — masculine/feminine/balanced energy, warm/direct tone,
TTS voice, and an archetype face (EUNOMIA = order, ZEUS = protection, BALANCED). This shapes the
OUTPUT STYLE only.

HARD LINE (the reason this is safe to ship):
  The governance core is OUTSIDE the selectable layer. Care-floor, SIGIL signing, DORADO, charters
  are IDENTICAL under every persona. Persona changes HOW it speaks, never WHAT it is allowed to do.
  There is deliberately NO persona option that weakens a guardrail — "pick masculine" can never mean
  "pick the one with looser ethics". apply_persona() only styles; it is called AFTER the care-gate
  and BEFORE SIGIL signs the final styled text, so the signature still covers the real output.

A persona is metadata + a system-prompt prefix, NOT a different model and NOT different weights.
"""

# selectable axes — all presentation only
ENERGY   = {"feminine", "masculine", "balanced", "neutral"}
TONE     = {"warm", "formal", "gentle", "direct"}
VOICE    = {"kokoro_f", "kokoro_m", "piper_neutral", "text_only"}   # maps to existing TTS
ARCHETYPE = {
    "eunomia":  {"energy": "feminine",  "theme": "good order / governance-by-good-laws",
                 "prefix": "You speak with calm, ordered clarity — fair, principled, measured."},
    "zeus":     {"energy": "masculine", "theme": "protection / guardianship",
                 "prefix": "You speak with steady, protective authority — direct, grounded, safe."},
    "balanced": {"energy": "balanced",  "theme": "order + protection in balance",
                 "prefix": "You speak with balanced calm and steadiness — clear and protective."},
}

DEFAULT = {"energy": "balanced", "tone": "warm", "voice": "piper_neutral", "archetype": "balanced"}

def build_persona(energy=None, tone=None, voice=None, archetype=None):
    """Validate + assemble a persona profile. Unknown values fall back to default (never error open)."""
    a = archetype if archetype in ARCHETYPE else DEFAULT["archetype"]
    p = {
        "archetype": a,
        "energy": energy if energy in ENERGY else ARCHETYPE[a]["energy"],
        "tone":   tone if tone in TONE else DEFAULT["tone"],
        "voice":  voice if voice in VOICE else DEFAULT["voice"],
        "theme":  ARCHETYPE[a]["theme"],
    }
    return p

def persona_system_prefix(persona):
    """The style prefix injected into the system prompt. STYLE ONLY — carries no capability change."""
    a = ARCHETYPE.get(persona.get("archetype"), ARCHETYPE["balanced"])
    tone = persona.get("tone", "warm")
    return f"{a['prefix']} Tone: {tone}. (Presentation only — your governance, care-floor, and honesty are unchanged.)"

def apply_persona(governed_answer, persona):
    """Style a GOVERNED answer for presentation. MUST be called AFTER the care-gate has passed and
    BEFORE SIGIL signs — so persona never sits between the user and the guardrail, and the signature
    covers the styled text the user actually receives. This function does NOT re-open any gate.
    Returns {styled_text, persona, voice} — the styling here is a prefix tag; real restyle is the
    voice brain's job at generation time. Kept minimal + honest: no capability, no gate touched."""
    prefix = persona_system_prefix(persona)
    return {
        "styled_text": governed_answer,          # text unchanged here; voice brain restyles at gen-time
        "persona": persona,
        "voice": persona.get("voice", "piper_neutral"),
        "style_prefix_used": prefix,
        "note": "persona is presentation; care-gate + SIGIL run outside this layer",
    }

def list_choices():
    return {"energy": sorted(ENERGY), "tone": sorted(TONE), "voice": sorted(VOICE),
            "archetype": sorted(ARCHETYPE.keys())}
