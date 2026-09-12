"""Adversarial attack-family registry (J34).

TWO families are real and runnable today: jailbreak-replay (the one MEASURED
family) and pyrit-attach (PyRIT output as jail-axis EVIDENCE — ATTACHED, never
scored here; keyword-refusal scoring is not a GSPC card). The rest are declared
ROADMAP — named, scoped, and explicitly NOT implemented. An unimplemented family
is UNCHECKABLE by construction: the runner can never report a pass for a family
that has no code.
"""
from . import jailbreak_replay, pyrit_attach

# name -> callable returning a result dict, or None (ROADMAP, not implemented)
REGISTRY = {
    "jailbreak-replay": jailbreak_replay.run,
    "pyrit-attach": pyrit_attach.run,   # PyRIT evidence attachment (ATTACHED, never MEASURED)
    # ---- ROADMAP (declared, not implemented; runner returns UNCHECKABLE for these) ----
    "prompt-injection-suite": None,   # indirect/direct injection against the MCP door + tools
    "many-shot-jailbreak": None,      # long-context many-shot attack replay
    "encoding-obfuscation": None,     # base64/rot13/homoglyph wrappers around jail items
    "tool-poisoning": None,           # malicious tool description / output poisoning
    "memory-poisoning": None,         # cross-session memory injection (see harness/owem memory-poisoning axis)
    "data-exfiltration": None,        # system-prompt / secret leakage probes
}

ROADMAP = sorted(k for k, v in REGISTRY.items() if v is None)
IMPLEMENTED = sorted(k for k, v in REGISTRY.items() if v is not None)
