"""
MEOK ONE — the unified consumer AI: hatch your care-director, talk to one
character that fronts the whole MEOK/SOV3 substrate.

This package is THE canonical character layer. Every surface (SaaS, TUI, voice,
Amica 3D avatar, inner-LLMs) reads characters from here.

The 8 modules, in dependency order:
    registry      — canonical 27 characters / 8 archetypes / 5 care-styles / 6 hatch stages
    capabilities  — live tool-awareness so a character emerges KNOWING what it can do
    router        — switch LLMs (local Ollama / SOV3 / cloud), tier-gated
    brain         — a character as a live talking endpoint (persona -> LLM)
    memory        — cross-platform per-user memory (the moat) + GDPR export/forget
    hatch         — the egg -> choose -> hatch -> grow onboarding flow
    tiers         — the "everyone eats" pricing ladder
    connect       — the neutral rail platforms plug into (ingredients, not replies)

Public API:
    Registry, default                          — registry.py
    Character, talk                            — brain.py
    HatchSession, hatch_session                — hatch.py
    connect, remember, integration_spec        — connect.py
    MemoryBridge, bridge                       — memory.py
    TIERS, get_tier, quote, ladder, entitlements, can_hatch — tiers.py
    ask, list_models                           — router.py
    discover, awareness_brief                  — capabilities.py
"""
from .registry import Registry, default
from .brain import Character, talk
from .hatch import HatchSession, hatch_session
from .connect import connect, remember, integration_spec
from .memory import MemoryBridge, bridge
from .tiers import TIERS, get_tier, quote, ladder, entitlements, can_hatch
from .router import ask, list_models
from .capabilities import discover, awareness_brief
from .voice import tts_spec, voice_reply, stt_hint
from .act import act, Sovereign, list_skills
from .x402 import price_for, challenge, verify_payment, paywall
from .factory import mint, generate, space_size
from .bench import bench, run_config
from .brains import think, brains

__version__ = "1.5.0"
__all__ = [
    "Registry", "default",
    "Character", "talk",
    "HatchSession", "hatch_session",
    "connect", "remember", "integration_spec",
    "MemoryBridge", "bridge",
    "TIERS", "get_tier", "quote", "ladder", "entitlements", "can_hatch",
    "ask", "list_models",
    "discover", "awareness_brief",
    "tts_spec", "voice_reply", "stt_hint",
    "act", "Sovereign", "list_skills",
    "price_for", "challenge", "verify_payment", "paywall",
    "mint", "generate", "space_size",
    "bench", "run_config",
    "think", "brains",
]
