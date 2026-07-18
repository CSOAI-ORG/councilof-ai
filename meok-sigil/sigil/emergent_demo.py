"""
SIGIL emergence demo (capability B) — agents MINT new opcodes at runtime.

This is the "give SOV3 the ability to use its own language" piece: the core
vocabulary is a starting point, and agents can extend it. Every new opcode is
immediately encodable, parseable, AND human-readable via gloss(), and the whole
evolved language can be exported to JSON so it persists across sessions.
"""

from . import encode, parse, gloss, manifest, export_registry, OpSpec, register


def main():
    print("=" * 70)
    print("SIGIL EMERGENCE — an SOV3 agent invents two new opcodes at runtime")
    print("=" * 70)

    print("\n[1] Language BEFORE emergence:")
    print(manifest())

    # An agent decides the core vocab can't express "resonance between two agents"
    # or "an experiment result", so it mints opcodes R and X. The language grows.
    register(OpSpec(
        code="R", name="resonance", origin="agent:sophie",
        fields=[("a", "s"), ("b", "s"), ("coherence", "float")],
        gloss_template="Resonance between {a} and {b}: coherence {coherence}.",
    ))
    register(OpSpec(
        code="X", name="experiment", origin="agent:orion",
        fields=[("hypo", "s"), ("metric", "s"), ("baseline", "float"), ("result", "float")],
        gloss_template='Experiment "{hypo}": {metric} moved {baseline} -> {result}.',
    ))

    print("\n[2] Language AFTER emergence (R and X are now first-class):")
    print(manifest())

    print("\n[3] The new opcodes work end-to-end — dense, parseable, human-readable:")
    for intent in [
        {"op": "R", "a": "jarvis", "b": "sophie", "coherence": "0.88"},
        {"op": "X", "hypo": "SIGIL beats English on council cost", "metric": "tokens",
         "baseline": "182", "result": "95"},
    ]:
        line = encode(intent)
        assert encode(parse(line)) == line, "emergent opcode must round-trip losslessly"
        print(f"\n  SIGIL  {line}")
        print(f"  gloss  {gloss(line)}")

    print("\n[4] Persist the evolved language (so SOV3 keeps what it invented):")
    snap = export_registry()
    print(f"  exported registry: {len(snap)} bytes of JSON "
          f"({snap.count(chr(34) + 'origin' + chr(34))} opcodes, including agent-minted).")
    print("  -> save to disk / Postgres; import_registry() reloads it next session.")
    print("\n  Emergence is real, deterministic, and stays legible. ✓")


if __name__ == "__main__":
    main()
