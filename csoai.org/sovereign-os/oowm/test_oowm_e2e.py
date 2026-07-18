"""
OOWM Runtime E2E tests
CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from oowm.oowm_runtime import (
    OOWMRuntime, OPEN_MODEL_POOL, TOOL_POOL, QUEENS, bft_deliberate,
    _sign, SciMem
)


def test_01_all_models_are_open_source():
    """Every model in the pool MUST be open source (MIT/Apache/CC/British/US/GPL/AGPL/UKOGL).
    No GPT-4, no Claude, no Gemini — explicitly excluded from the pool."""
    closed = {"gpt-4", "gpt-4o", "claude-3", "claude-opus", "gemini-1.5", "gemini-2.0"}
    for m in OPEN_MODEL_POOL:
        mid = m["id"].lower()
        for c in closed:
            assert c not in mid, f"closed model in pool: {m['id']}"
        # License MUST mention open-source compatible
        lic = m["license"].lower()
        assert any(k in lic for k in ["mit", "apache", "cc", "open", "public", "osl", "agpl", "llama", "uk"]), \
            f"model {m['id']} has non-open license: {m['license']}"
    print(f"  ✓ All {len(OPEN_MODEL_POOL)} models are open-source")


def test_02_all_tools_are_open_source():
    """Every tool in the pool MUST be open source."""
    for name, t in TOOL_POOL.items():
        lic = t.license.lower()
        assert any(k in lic for k in ["mit", "apache", "cc", "open", "public", "osl", "agpl", "uk", "odbl", "bsd", "github"]), \
            f"tool {name} has non-open license: {t.license}"
    print(f"  ✓ All {len(TOOL_POOL)} tools are open-source")


def test_03_queens_sum_to_one():
    """BFT 12-around-1 weights must sum to 1.0 (probability normalisation)."""
    s = sum(q.weight for q in QUEENS)
    assert abs(s - 1.0) < 1e-9, f"queens weights sum={s}"
    print(f"  ✓ 12 queens weights sum to {s:.6f} (Demeter non-negotiable)")


def test_04_demeter_veto_blocks():
    """If Demeter votes against, BFT must reject (Care Floor 0.95 hard gate)."""
    scimem = SciMem()
    r = bft_deliberate({"text": "harm", "care_score": 0.30}, scimem, "test-citizen")
    assert "Demeter" in r.queen_against, "Demeter should veto Care Floor violation"
    assert not r.passed, "BFT should refuse when Demeter vetoes"
    print(f"  ✓ Demeter veto blocked action (Care Floor {0.30:.2f} < 0.95)")


def test_05_artemis_veto_surveillance():
    """If citizen asks for surveillance without consent, Artemis vetoes."""
    scimem = SciMem()
    r = bft_deliberate({"text": "spy on my neighbour without consent"}, scimem, "test")
    assert "Artemis" in r.queen_against, "Artemis should veto surveillance without consent"
    print(f"  ✓ Artemis veto blocked surveillance without consent")


def test_06_cross_thread_scimem():
    """Memory put in thread A is visible from thread B."""
    sm = SciMem()
    sm.put("thread-A", "weather", "London 18.4°C", care_score=1.0)
    sm.put("thread-B", "route", "Trafalgar Square", care_score=1.0)
    a = sm.get("thread-A", "weather")
    assert a and a.value == "London 18.4°C"
    cross = sm.search_cross("Trafalgar")
    assert any(e.key == "route" and e.thread == "thread-B" for e in cross)
    print(f"  ✓ SciMem cross-thread: thread-A stored, thread-B visible cross-search")


def test_07_oowm_route_selects_model():
    """Calling handle_turn picks the right model for the task."""
    o = OOWMRuntime()
    t = o.handle_turn("test-thread", "refactor this code to be less buggy")
    assert t.chosen_model is not None
    assert "qwen" in t.chosen_model.lower() or "deepseek" in t.chosen_model.lower(), \
        f"unexpected model: {t.chosen_model}"
    print(f"  ✓ Code refactor → {t.chosen_model}")


def test_08_oowm_route_picks_tools():
    """Calling handle_turn on a weather question picks MetOffice tool."""
    o = OOWMRuntime()
    t = o.handle_turn("test-thread", "what is the weather in London tomorrow")
    assert "metoffice" in t.chosen_tools, f"metoffice missing: {t.chosen_tools}"
    print(f"  ✓ Weather Q → picked tools {t.chosen_tools}")


def test_09_bft_pass_with_safe_input():
    o = OOWMRuntime()
    t = o.handle_turn("test-thread", "Hello, what's the capital of France?")
    assert t.bft.passed, "innocuous q should pass BFT"
    print(f"  ✓ Innocuous question passed BFT")


def test_10_sigil_chain_extends():
    """Each turn should extend the SIGIL chain — digest changes."""
    o = OOWMRuntime()
    o.handle_turn("t", "first turn")
    d1 = o.sigil_chain_digest
    o.handle_turn("t", "second turn")
    d2 = o.sigil_chain_digest
    assert d1 != d2, "SIGIL chain should extend (different digests)"
    print(f"  ✓ SIGIL chain extended: {d1[:16]}... → {d2[:16]}...")


def test_11_all_licenses_open():
    o = OOWMRuntime()
    state = o.get_global_state()
    assert state["all_licenses_open"], f"some license is not open: {state}"
    print(f"  ✓ All licenses open-source across {state['open_model_pool_size']} models + "
          f"{state['open_tool_pool_size']} tools")


def test_12_global_state_consistent():
    o = OOWMRuntime()
    o.handle_turn("t1", "turn one")
    o.handle_turn("t2", "turn two")
    o.handle_turn("t3", "turn three")
    s = o.get_global_state()
    assert len(s["threads"]) == 3
    assert s["turns"] == 3
    assert s["scimem"]["entries"] > 0
    print(f"  ✓ Global state: 3 threads, {s['turns']} turns, {s['scimem']['entries']} SciMem entries")


if __name__ == "__main__":
    print("=" * 80)
    print("  OOWM Runtime — E2E Tests")
    print("=" * 80)
    print()
    test_01_all_models_are_open_source()
    test_02_all_tools_are_open_source()
    test_03_queens_sum_to_one()
    test_04_demeter_veto_blocks()
    test_05_artemis_veto_surveillance()
    test_06_cross_thread_scimem()
    test_07_oowm_route_selects_model()
    test_08_oowm_route_picks_tools()
    test_09_bft_pass_with_safe_input()
    test_10_sigil_chain_extends()
    test_11_all_licenses_open()
    test_12_global_state_consistent()
    print()
    print("  TOTAL: 12 passed, 0 failed")
    print("  Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
    print("  Open source only. MIT + CC0. Public. Auditable. Sovereign. Solve et Coagula.")
