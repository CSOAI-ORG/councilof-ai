# SPDX-License-Identifier: Apache-2.0
"""Layer 0 AI Catalog: conformance level and the listing-vs-measurement rule (scripts/layer0/ai_catalog.py).

FAIL-FIRST (A): run first against a stub checker that validated the schema only and trusted the declared level;
the "unmeasured entry cannot carry an attestation" and "claimed level must be the computed one" cases failed there
(receipt: scripts/layer0/receipts/ai-catalog.fail-first.txt). They pass on the real checker.

    python3 -m pytest -q scripts/layer0/test_ai_catalog.py
"""
import copy, json, os, sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import ai_catalog as C  # noqa: E402

CAT = json.load(open(os.path.join(ROOT, "public", ".well-known", "ai-catalog.json")))


def entry(doc, ident):
    return next(e for e in doc["entries"] if e["identifier"] == ident)


def test_committed_catalog_has_no_problems_and_claims_exactly_its_level():
    assert C.problems(CAT, ROOT) == []
    assert C.level(CAT, ROOT) == 2
    assert C.claimed_level(CAT) == 2


def test_unmeasured_entry_cannot_carry_an_attestation():
    bad = copy.deepcopy(CAT)
    e = entry(bad, "urn:air:councilof.ai:chat:talk")
    assert C.measurement(e) == "UNMEASURED"
    e["trustManifest"] = {"identity": "https://councilof.ai", "identityType": "https",
                          "attestations": [{"type": "signed-measurement", "uri": "https://councilof.ai/signed/x.json", "mediaType": "application/json"}]}
    assert any("UNMEASURED" in p and "trust" in p for p in C.problems(bad, ROOT))


@pytest.mark.parametrize("field", ["score", "rating", "grade", "quality", "signature"])
def test_unmeasured_entry_carries_no_quality_or_signature_field(field):
    bad = copy.deepcopy(CAT)
    entry(bad, "urn:air:councilof.ai:ag-ui:run")[field] = 1
    assert C.problems(bad, ROOT)


def test_every_entry_states_its_measurement():
    bad = copy.deepcopy(CAT)
    e = entry(bad, "urn:air:councilof.ai:chat:talk")
    e["extensions"].pop("ai.councilof.measurement")
    assert any("measurement" in p for p in C.problems(bad, ROOT))


def test_measured_entry_needs_a_signed_attestation_whose_digest_matches():
    bad = copy.deepcopy(CAT)
    e = entry(bad, "urn:air:councilof.ai:dataset:gspc-board")
    assert C.measurement(e) == "MEASURED"
    e["trustManifest"]["attestations"][0]["digest"] = "sha256:" + "0" * 64
    assert any("digest" in p for p in C.problems(bad, ROOT))
    gone = copy.deepcopy(CAT)
    entry(gone, "urn:air:councilof.ai:dataset:gspc-board").pop("trustManifest")
    assert any("MEASURED" in p for p in C.problems(gone, ROOT))


def test_identity_must_align_with_the_publisher_domain():
    bad = copy.deepcopy(CAT)
    entry(bad, "urn:air:councilof.ai:dataset:gspc-board")["trustManifest"]["identity"] = "did:web:csoai.org"
    assert any("align" in p for p in C.problems(bad, ROOT))


def test_claimed_level_must_equal_the_computed_level():
    bad = copy.deepcopy(CAT)
    C.set_claim(bad, 3)
    assert any("claims Level 3" in p for p in C.problems(bad, ROOT))


def test_level_3_needs_a_verifying_signature_subject_and_issued_at():
    fake = copy.deepcopy(CAT)
    tm = entry(fake, "urn:air:councilof.ai:dataset:gspc-board")["trustManifest"]
    tm.update({"signature": "eyJhbGciOiJFZERTQSJ9..AAAA", "subject": {"type": "application/json", "digest": "sha256:" + "1" * 64}, "issuedAt": "2026-09-30T00:00:00Z"})
    assert C.level(fake, ROOT) == 2          # a signature that does not verify earns nothing


def test_validates_against_the_ard_project_ai_catalog_schema():
    jsonschema = pytest.importorskip("jsonschema")
    S = json.load(open(os.path.join(HERE, "vendor", "ai-catalog.schema.json")))
    doc = {k: v for k, v in CAT.items() if k != "extensions"}   # top-level extensions: AI Catalog 1.0 allows them, this schema does not
    errs = list(jsonschema.Draft202012Validator(S).iter_errors(doc))
    assert not errs, [e.message for e in errs][:3]
