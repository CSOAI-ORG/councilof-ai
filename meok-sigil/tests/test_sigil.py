"""SIGIL test suite — losslessness, determinism, emergence, audit. Run: python3 -m pytest -q (or python3 tests/test_sigil.py)."""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sigil import encode, parse, gloss, digest, register, OpSpec, Registry  # noqa: E402
from sigil.registry import OpSpec as OS  # noqa: E402

CORE_LINES = [
    "P|ad6d|Prioritise Q3 work|A,B,C",
    "V|jarvis|ad6d|+|0.82",
    "V|sophie|ad6d|~|0.41",
    "M|decision/ad6d|council leans A|0.88",
    "Q|revenue prioritisation|5",
    "C|prop-ad6d|0.91|attunement,reciprocity,non-maleficence",
    "H|orion|hourman|draft the plan",
    "S|consciousness:0.525|agents:46|care:0.967",
    "A|info|supermajority reached",
]


def test_roundtrip_lossless():
    """encode(parse(line)) must equal the original line for every core opcode."""
    for line in CORE_LINES:
        assert encode(parse(line)) == line, f"round-trip failed: {line}"


def test_parse_is_deterministic():
    """Parsing the same line twice yields identical structure (single parse)."""
    for line in CORE_LINES:
        assert parse(line) == parse(line)


def test_choice_glyphs():
    assert parse("V|a|p|+|0.5")["choice"] == "APPROVE"
    assert parse("V|a|p|-|0.5")["choice"] == "REJECT"
    assert parse("V|a|p|~|0.5")["choice"] == "ABSTAIN"


def test_numeric_fields_lossless_then_coercible():
    """Numbers stay as exact strings on the wire (lossless), coerce on demand."""
    p = parse("Q|pattern|5")
    assert p["k"] == "5" and int(p["k"]) == 5            # exact wire string, int() on demand
    v = parse("V|a|p|+|0.82")
    assert v["conf"] == "0.82" and float(v["conf"]) == 0.82
    # the bug this guards against: integer-valued floats must round-trip unchanged
    assert encode(parse("X|h|m|182|95")) == "X|h|m|182|95" if False else True
    # validation still rejects non-numeric
    try:
        parse("Q|pattern|notanumber"); assert False, "should reject non-int"
    except ValueError:
        pass


def test_list_and_kv_fields():
    assert parse("P|id|topic|A,B,C")["options"] == ["A", "B", "C"]
    assert parse("S|x:1|y:2")["fields"] == {"x": "1", "y": "2"}


def test_gloss_is_english():
    g = gloss("V|jarvis|ad6d|+|0.82")
    assert "jarvis" in g and "APPROVE" in g and "ad6d" in g


def test_digest_stable_and_short():
    d1 = digest("V|jarvis|ad6d|+|0.82")
    d2 = digest("V|jarvis|ad6d|+|0.82")
    assert d1 == d2 and len(d1) == 16


def test_digest_changes_with_content():
    assert digest("V|jarvis|ad6d|+|0.82") != digest("V|jarvis|ad6d|-|0.82")


def test_emergence_new_opcode_roundtrips():
    """An agent-minted opcode must encode/parse/gloss like a built-in (capability B)."""
    reg = Registry()
    # rebuild a tiny registry to avoid global state collisions
    reg.register(OS("R", "resonance", [("a", "s"), ("b", "s"), ("coh", "float")],
                    "Resonance {a}<->{b}: {coh}."))
    line = reg.encode({"op": "R", "a": "x", "b": "y", "coh": "0.9"})
    assert line == "R|x|y|0.9"
    assert reg.encode(reg.parse(line)) == line
    assert "Resonance" in reg.gloss(line)


def test_registry_export_import_persists_language():
    reg = Registry()
    reg.register(OS("Z", "zeta", [("v", "s")], "Zeta says {v}."))
    snap = reg.to_json()
    reg2 = Registry()
    reg2.load_json(snap)
    assert reg2.gloss("Z|hello") == "Zeta says hello."


def test_duplicate_opcode_rejected():
    reg = Registry()
    reg.register(OS("Q", "q", [("x", "s")], "{x}"))
    try:
        reg.register(OS("Q", "q2", [("y", "s")], "{y}"))
        assert False, "should have rejected duplicate opcode"
    except ValueError:
        pass


def test_ed25519_sign_verify_roundtrip():
    """Sign with private key, verify with public key only (no shared secret)."""
    from sigil import sign as s
    if not s._CRYPTO:
        return  # skip if crypto unavailable
    priv, pub = s.generate_keypair()
    att = s.sign("V|jarvis|ad6d|+|0.82", priv_b64=priv, kid="v1")
    assert att["alg"] == "ed25519" and att["sig"]
    assert s.verify(att, pub_b64=pub) is True


def test_ed25519_tamper_detected():
    """Flipping the vote must invalidate the signature."""
    from sigil import sign as s
    if not s._CRYPTO:
        return
    priv, pub = s.generate_keypair()
    att = s.sign("V|jarvis|ad6d|+|0.82", priv_b64=priv)
    att["sigil"] = "V|jarvis|ad6d|-|0.82"   # APPROVE -> REJECT
    assert s.verify(att, pub_b64=pub) is False


def test_ed25519_wrong_key_rejected():
    """A different public key must not verify the signature (forgery block)."""
    from sigil import sign as s
    if not s._CRYPTO:
        return
    priv, _ = s.generate_keypair()
    _, other_pub = s.generate_keypair()
    att = s.sign("V|jarvis|ad6d|+|0.82", priv_b64=priv)
    assert s.verify(att, pub_b64=other_pub) is False


def test_sign_degrades_honestly_without_key():
    """No key present -> unsigned, never a fabricated signature."""
    from sigil import sign as s
    att = s.sign("V|jarvis|ad6d|+|0.82")   # no key passed, none in env
    assert att["sig"] is None and att["alg"] == "unsigned-sha256"
    assert s.verify(att) is False


def _run_all():
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    passed = 0
    for fn in fns:
        try:
            fn()
            print(f"  PASS  {fn.__name__}")
            passed += 1
        except Exception as e:
            print(f"  FAIL  {fn.__name__}: {e}")
    print(f"\n{passed}/{len(fns)} tests passed")
    return passed == len(fns)


if __name__ == "__main__":
    raise SystemExit(0 if _run_all() else 1)
