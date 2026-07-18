# MEOK SIGIL

**Sovereign Inter-aGent Interchange Language** — a compact, deterministic protocol for AI agents to talk to each other faster, with a **lossless human-readable translator** and a **signable audit digest**.

```
V|jarvis|ad6d|+|0.82
   └─ gloss() → "Agent jarvis votes APPROVE on proposal ad6d (confidence 0.82)."
   └─ digest() → 8cc4a6002bb8201a   (sign this → auditable agent log)
```

- ⚡ **Verified compression (real tiktoken BPE):** ~27% fewer tokens on already-trimmed dicts → **81% fewer (5.25×) on raw live SOV3 `get_system_status` output** (the fat JSON agents actually pass). The bigger/messier the payload, the bigger the win. `python3 -m sigil.sov3_adapter --live` reproduces it against the running MCP.
- 🔁 **Lossless & deterministic** — one line, exactly one parse; `encode(parse(x)) == x`.
- 👁 **Human-readable on demand** — `gloss()` turns any line back into English.
- 🔏 **Auditable** — `digest()` gives a stable hash to sign with the MEOK attestation engine → EU AI Act Art 12/14 "verifiable agent communication."
- 🌱 **Emergent** — agents mint new opcodes at runtime; the language grows and stays legible.

> Not David Wynn Miller "Quantum Grammar" (pseudoscience). SIGIL is a real controlled DSL — see `SPEC.md`.

## Quick start

```bash
python3 -m sigil.benchmark      # baseline: English vs SIGIL, real tokenizer
python3 -m sigil.emergent_demo  # agents invent new opcodes at runtime
python3 -m sigil.sov3_bench     # baseline + live SOV3 A/B harness
python3 tests/test_sigil.py     # test suite
```

```python
from sigil import encode, parse, gloss, digest
line = encode({"op": "V", "agent": "jarvis", "prop": "ad6d", "choice": "APPROVE", "conf": "0.82"})
gloss(line)   # human-readable English
digest(line)  # sign for an auditable transcript
```

## Why

Fast agent protocols (Gibberlink, Droidspeak) are *opaque* — regulators reject that. SIGIL is fast **and** readable **and** signed. That's the moat: **verifiable agent communication**.

© 2026 MEOK AI LTD (CSOAI) · code MIT · spec CC BY 4.0
