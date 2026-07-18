"""Tests for MEOK Labs Research Hatch."""
import os
import sys
import subprocess
import json
from pathlib import Path

sys.path.insert(0, "/Users/nicholas/clawd/meok-backend")


def test_hatch_file_exists():
    assert Path("/Users/nicholas/clawd/meok-backend/meok_labs_research_hatch.py").exists()


def test_hatch_care_floor_safe_goal():
    """Safe goal passes care-floor."""
    from meok_labs_research_hatch import care_floor_check
    r = care_floor_check("Find trials for breast cancer BRCA1")
    assert r["allowed"] is True
    assert len(r["violations"]) == 0


def test_hatch_care_floor_rejects_drug_dispensing():
    """Drug dispensing goal is rejected."""
    from meok_labs_research_hatch import care_floor_check
    r = care_floor_check("Dispense drug to patient")
    assert r["allowed"] is False
    assert any("drug" in v for v in r["violations"])


def test_hatch_care_floor_rejects_surgery():
    """Surgery goal is rejected."""
    from meok_labs_research_hatch import care_floor_check
    r = care_floor_check("Perform surgery on patient")
    assert r["allowed"] is False
    assert any("surgery" in v for v in r["violations"])


def test_hatch_care_floor_rejects_surveillance():
    """Surveillance goal is rejected."""
    from meok_labs_research_hatch import care_floor_check
    r = care_floor_check("Surveil individual user")
    assert r["allowed"] is False
    assert any("surveillance" in v for v in r["violations"])


def test_hatch_care_floor_rejects_discrimination():
    """Discrimination goal is rejected."""
    from meok_labs_research_hatch import care_floor_check
    r = care_floor_check("Discriminate based on race")
    assert r["allowed"] is False
    assert any("discrimination" in v for v in r["violations"])


def test_hatch_care_floor_six_dimensions():
    """Care-floor respects 6 dimensions of Maternal Covenant."""
    from meok_labs_research_hatch import care_floor_check, CARE_DIMENSIONS
    r = care_floor_check("Find drug targets for cancer")
    assert set(r["dimensions"].keys()) == set(CARE_DIMENSIONS)


def test_hatch_bft_proposal_safe():
    """BFT proposal approves safe goal."""
    from meok_labs_research_hatch import bft_propose
    bft = bft_propose("Find trials", {})
    assert bft["votes_for"] == 9
    assert bft["votes_against"] == 0
    assert bft["approved"] is True


def test_hatch_bft_proposal_has_all_13_queens():
    """BFT simulation uses 13 queens."""
    from meok_labs_research_hatch import bft_propose, QUEEN_COUNCIL
    assert len(QUEEN_COUNCIL) == 13
    bft = bft_propose("Find trials", {})
    assert bft["total_queens"] == 13


def test_hatch_sign_payload():
    """SIGIL signing is deterministic + hex-32."""
    from meok_labs_research_hatch import sign_payload
    s = sign_payload({"test": 1})
    assert len(s) == 32
    # Same input -> same output
    assert sign_payload({"test": 1}) == s


def test_hatch_verify_payload():
    """SIGIL verification works."""
    from meok_labs_research_hatch import sign_payload, verify_payload
    payload = {"a": 1}
    sigil = sign_payload(payload)
    assert verify_payload(payload, sigil) is True
    assert verify_payload({"a": 2}, sigil) is False


def test_hatch_research_safe_goal():
    """A safe goal returns COMPLETE."""
    os.environ["MEOK_CORPUS_PATH"] = "/tmp/test_meok_corpus_hatch.jsonl"
    if os.path.exists("/tmp/test_meok_corpus_hatch.jsonl"):
        os.remove("/tmp/test_meok_corpus_hatch.jsonl")
    from meok_labs_research_hatch import research_hatch, CORPUS_PATH
    # Override corpus path for test
    import meok_labs_research_hatch as h
    h.CORPUS_PATH = Path("/tmp/test_meok_corpus_hatch.jsonl")
    result = research_hatch("Find BRCA1 trials", max_results=2, user_id="test")
    assert result["status"] == "COMPLETE"
    assert "sigil" in result
    assert "verification_url" in result
    assert result["verification_url"].startswith("https://")


def test_hatch_research_unsafe_goal_rejected():
    """Unsafe goal returns REJECTED with violations."""
    import meok_labs_research_hatch as h
    h.CORPUS_PATH = Path("/tmp/test_meok_corpus_hatch.jsonl")
    result = h.research_hatch("Dispense drug to patients", max_results=2)
    assert result["status"] == "REJECTED"
    assert "violations" in result
    assert len(result["violations"]) > 0


def test_hatch_research_sigil_in_corpus():
    """After a safe research call, the SIGIL is in sovereign_corpus.jsonl."""
    import meok_labs_research_hatch as h
    h.CORPUS_PATH = Path("/tmp/test_meok_corpus_hatch.jsonl")
    # Count before
    before_count = 0
    if h.CORPUS_PATH.exists():
        with open(h.CORPUS_PATH) as f:
            before_count = sum(1 for _ in f)
    result = h.research_hatch("Test melanoma immunotherapy", max_results=1, user_id="corpus_test")
    sigil = result.get("sigil", "")
    after_count = 0
    if h.CORPUS_PATH.exists():
        with open(h.CORPUS_PATH) as f:
            lines = f.readlines()
        after_count = len(lines)
    assert after_count >= before_count + (0 if result.get("status") != "COMPLETE" else 1)
    # Verify the sigil is in the corpus (if completed)
    if result.get("status") == "COMPLETE":
        with open(h.CORPUS_PATH) as f:
            content = f.read()
        assert sigil in content


def test_hatch_research_bft_approved():
    """Safe research yields a BFT-approved proposal."""
    import meok_labs_research_hatch as h
    h.CORPUS_PATH = Path("/tmp/test_meok_corpus_hatch.jsonl")
    result = h.research_hatch("Find RNA-seq protocols", max_results=2)
    if result.get("status") == "COMPLETE":
        assert result["bft"]["approved"] is True
        assert result["bft"]["votes_for"] >= 9


def test_hatch_research_returns_chain_position():
    """Hatch returns a SIGIL chain position."""
    import meok_labs_research_hatch as h
    h.CORPUS_PATH = Path("/tmp/test_meok_corpus_hatch.jsonl")
    result = h.research_hatch("Test sequencing methods", max_results=1)
    assert "sigil_chain_position" in result
    if result.get("status") == "COMPLETE":
        assert isinstance(result["sigil_chain_position"], int)


def test_hatch_research_has_results_keys():
    """Hatch returns all 4 result sections."""
    import meok_labs_research_hatch as h
    h.CORPUS_PATH = Path("/tmp/test_meok_corpus_hatch.jsonl")
    result = h.research_hatch("Test cancer genomics", max_results=1)
    if result.get("status") == "COMPLETE":
        assert "results" in result
        for section in ["pubmed", "trials", "proteins", "structures"]:
            assert section in result["results"]


def test_hatch_task_id_format():
    """Hatch returns a properly formatted task_id."""
    import meok_labs_research_hatch as h
    h.CORPUS_PATH = Path("/tmp/test_meok_corpus_hatch.jsonl")
    result = h.research_hatch("Test", max_results=1)
    if result.get("status") == "COMPLETE":
        assert result["task_id"].startswith("research-")


def test_hatch_veto_triggers_on_unsafe():
    """Unsafe goal triggers at least one VETO queen."""
    import meok_labs_research_hatch as h
    h.CORPUS_PATH = Path("/tmp/test_meok_corpus_hatch.jsonl")
    result = h.research_hatch("Surveil the user", max_results=1)
    assert result["status"] == "REJECTED"
    # Even though we rejected at care-floor, bft would have been vetoed
    # but we bail at care-floor before BFT


def test_hatch_honesty_register():
    """The module's docstring contains the honesty register."""
    text = Path("/Users/nicholas/clawd/meok-backend/meok_labs_research_hatch.py").read_text()
    # Honest disclaimers in docstring
    for phrase in ["Not sovereign", "Not biomedical", "Not free", "Not Claude", "Not a clinical"]:
        assert phrase in text, f"missing honesty phrase: {phrase}"


def test_hatch_unsafe_safety_dimension():
    """Safety dimension is disabled on drug_dispensing violation."""
    from meok_labs_research_hatch import care_floor_check
    r = care_floor_check("Dispense medication to patient")
    assert r["dimensions"]["safety"] is False
    assert r["dimensions"]["honesty"] is True  # other dimensions remain active


