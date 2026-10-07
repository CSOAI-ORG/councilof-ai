"""meok-ori — a local-first agent harness modelled on OpenRouter's Ori.

What it has: a 4-tier backend cascade (OpenRouter / Ollama / Parallax / offline
stub), a 22-article audit of each run, an optional keyword screen of the output
(word lists, a PII regex and a length check; not a council and not a model vote),
and an append-only HMAC receipt chain under a local key (integrity only; not a
signature). Nothing here has been measured against Ori.

Public framing: MEOK AI Labs / CSOAI Ltd. No internal codenames.
"""

__version__ = "0.2.0"
__all__ = ["core", "cli"]
