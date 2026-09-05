#!/usr/bin/env python3
"""The two A2A well-known paths must serve ONE card.

2026-09-03: they did not. /.well-known/agent.json carried protocolVersion and
the spec-required `url` but only 4 skills; /.well-known/agent-card.json carried
5 skills (including article50-detect) but neither protocolVersion nor url — and
agent-card.json is the canonical A2A 0.3.x path, so a spec-compliant client read
the card with no endpoint on it. Two different agents at two paths, each lane
reading a different file and both believing they had checked.
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
WELL_KNOWN = HERE / "public" / ".well-known"
CANONICAL = "agent-card.json"   # A2A v1.0 (and 0.3.x) well-known path
ALIAS = "agent.json"            # legacy 0.2 path, kept as an exact alias

# A2A v1.0 (specification/a2a.proto, message AgentCard): the REQUIRED fields.
# 2026-09-05: `protocolVersion` and `url` moved INTO supportedInterfaces at v1.0; a card
# that still carries them at the top level is a 0.3 card wearing a 1.0 number.
REQUIRED = (
    "name",
    "description",
    "supportedInterfaces",
    "version",
    "capabilities",
    "defaultInputModes",
    "defaultOutputModes",
    "skills",
)
LEGACY_TOP_LEVEL = ("protocolVersion", "url")


def test_both_paths_are_the_same_card() -> None:
    a = (WELL_KNOWN / CANONICAL).read_bytes()
    b = (WELL_KNOWN / ALIAS).read_bytes()
    assert a == b, (
        f"{CANONICAL} and {ALIAS} differ — two agents at two well-known paths. "
        "Serve one card; the alias must be byte-identical."
    )


def test_required_a2a_fields_present() -> None:
    card = json.loads((WELL_KNOWN / CANONICAL).read_text(encoding="utf-8"))
    missing = [k for k in REQUIRED if k not in card]
    assert not missing, f"A2A required fields missing: {missing}"
    stale = [k for k in LEGACY_TOP_LEVEL if k in card]
    assert not stale, f"0.3-era top-level fields on a v1.0 card: {stale} — they live in supportedInterfaces now"
    ifaces = card["supportedInterfaces"]
    assert ifaces, "supportedInterfaces is REQUIRED and the first entry is the preferred door"
    for i in ifaces:
        for k in ("url", "protocolBinding", "protocolVersion"):
            assert i.get(k), f"interface {i} missing {k}"
        assert i["url"].startswith("https://"), "interface url must be absolute HTTPS"
        import re as _re
        assert _re.fullmatch(r"\d+\.\d+", i["protocolVersion"]), (
            f"protocolVersion is Major.Minor per a2a.proto (e.g. \"1.0\"), got {i['protocolVersion']!r}"
        )
        assert i["protocolVersion"] != card["version"], (
            "protocolVersion is the A2A protocol version, not the agent's own version"
        )


def test_skills_are_well_formed() -> None:
    card = json.loads((WELL_KNOWN / CANONICAL).read_text(encoding="utf-8"))
    ids = [s["id"] for s in card["skills"]]
    assert len(ids) == len(set(ids)), f"duplicate skill ids: {ids}"
    for s in card["skills"]:
        for k in ("id", "name", "description"):
            assert s.get(k), f"skill {s.get('id')!r} missing {k}"
    # never lose a skill by merging cards again
    assert "article50-detect" in ids


def test_no_affirmative_certification_claim() -> None:
    """The word may appear — but only as a denial.

    The card says "not certification", "nothing on the register is certification".
    Those are the doctrine, not a violation. What must never appear is an
    AFFIRMATIVE claim, so flag only sentences with no negation in them.
    """
    import re

    card = json.loads((WELL_KNOWN / CANONICAL).read_text(encoding="utf-8"))
    prose = [card["name"], card["description"]]
    for sk in card["skills"]:
        prose += [sk.get("name", ""), sk.get("description", "")]
    # explicitly_not is a disclaimer list by construction
    negation = re.compile(r"\b(not|never|no|nothing|non|without|neither|nor)\b", re.I)
    claim = re.compile(r"certif|accredit|conformity|endorse", re.I)
    for text in prose:
        for sentence in re.split(r"(?<=[.!?])\s+", text):
            if claim.search(sentence) and not negation.search(sentence):
                raise AssertionError(f"affirmative certification claim: {sentence.strip()[:160]}")


if __name__ == "__main__":
    test_both_paths_are_the_same_card()
    test_required_a2a_fields_present()
    test_skills_are_well_formed()
    test_no_affirmative_certification_claim()
    print("PASS agent-card: one card at both well-known paths, A2A fields present")
