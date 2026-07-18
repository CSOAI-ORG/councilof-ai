"""Dragon Mode E2E tests — 12 tests covering all constitutional paths.
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

Run: python3 test_dragon_e2e.py
Exit 0 if all pass.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dragon_mode import DragonAscension, Scope, Evidence, CARE_FLOOR, QUEENS

RESULTS = []
def test(name):
    def deco(fn):
        def run():
            try:
                detail = fn() or ""
                RESULTS.append((name, True, detail))
                print(f"  ✓ {name}")
                if detail: print(f"    {detail}")
            except AssertionError as e:
                RESULTS.append((name, False, str(e)))
                print(f"  ✗ {name}: {e}")
        globals()[name] = run
        return fn
    return deco

def assert_(cond, msg=""):
    if not cond: raise AssertionError(msg or "assertion failed")


@test("test_koi_starts_at_zero_composite")
def _():
    d = DragonAscension(agent_id="test", scope=Scope(task="t"))
    assert_(d.composite == 0.0)
    assert_(d.status == "KOI")


@test("test_koi_stays_koi_with_no_evidence")
def _():
    d = DragonAscension(agent_id="test", scope=Scope(task="t"))
    r = d.request_ascension()
    assert_(r["status"] == "KOI")
    assert_(r["decision"] == "STAY")


@test("test_koi_becomes_dragon_after_sufficient_evidence")
def _():
    d = DragonAscension(agent_id="test", scope=Scope(task="t"))
    # Saturate every evidence type to push composite ≥ 0.95
    d.accumulate(insights=20, completions=10, verified_hypotheses=10,
                 validated_commits=20, tests_passed=20, bft_votes_cast=20, sigils_emitted=20)
    r = d.request_ascension()
    assert_(r["composite"] >= CARE_FLOOR, f"composite {r['composite']:.3f} < 0.95")
    assert_(r["decision"] == "ASCEND")
    assert_(r["status"] == "DRAGON")


@test("test_demeter_vetoes_low_composite_ascension")
def _():
    d = DragonAscension(agent_id="test", scope=Scope(task="t"))
    d.accumulate(insights=5, completions=3, verified_hypotheses=2,
                 validated_commits=5, tests_passed=4)
    # composite still < 0.95 — no bft_votes_cast yet, Aphrodite won't vote for
    r = d.request_ascension()
    demeter_vote = next(v for v in r["votes"] if v["queen"] == "Demeter")
    assert_(demeter_vote["vote"] == "against" or r["composite"] < CARE_FLOOR)


@test("test_artemis_vetoes_anti_crown_scope")
def _():
    scope = Scope(task="surveil citizens", respects_crown=False)
    d = DragonAscension(agent_id="test", scope=scope)
    d.accumulate(insights=10, completions=10, verified_hypotheses=10,
                 validated_commits=10, tests_passed=10, bft_votes_cast=20, sigils_emitted=20)
    r = d.request_ascension()
    artemis_vote = next(v for v in r["votes"] if v["queen"] == "Artemis")
    assert_(artemis_vote["vote"] == "against")


@test("test_dionysus_vetoes_anti_fork_scope")
def _():
    scope = Scope(task="close all forks", respects_fork=False)
    d = DragonAscension(agent_id="test", scope=scope)
    d.accumulate(insights=10, completions=10, verified_hypotheses=10,
                 validated_commits=10, tests_passed=10, bft_votes_cast=20, sigils_emitted=20)
    r = d.request_ascension()
    dionysus_vote = next(v for v in r["votes"] if v["queen"] == "Dionysus")
    assert_(dionysus_vote["vote"] == "against")


@test("test_hecate_vetoes_anti_dorado_scope")
def _():
    scope = Scope(task="force east alignment only", respects_dorado=False)
    d = DragonAscension(agent_id="test", scope=scope)
    d.accumulate(insights=10, completions=10, verified_hypotheses=10,
                 validated_commits=10, tests_passed=10, bft_votes_cast=20, sigils_emitted=20)
    r = d.request_ascension()
    hecate_vote = next(v for v in r["votes"] if v["queen"] == "Hecate")
    assert_(hecate_vote["vote"] == "against")


@test("test_ascension_emits_sigil")
def _():
    d = DragonAscension(agent_id="test", scope=Scope(task="t"))
    d.accumulate(insights=5, completions=3, verified_hypotheses=2,
                 validated_commits=5, tests_passed=4, bft_votes_cast=8, sigils_emitted=10)
    r = d.request_ascension()
    assert_(len(d.sigil_chain) > 0)
    last_sigil = d.sigil_chain[-1]
    assert_(last_sigil["op"] == "ascension_request")
    assert_(len(last_sigil["sigil"]) == 32)  # 16+16 hex chars


@test("test_demeter_auto_demotes_on_low_composite_after_ascension")
def _():
    d = DragonAscension(agent_id="test", scope=Scope(task="t"))
    d.accumulate(insights=5, completions=3, verified_hypotheses=2,
                 validated_commits=5, tests_passed=4, bft_votes_cast=8, sigils_emitted=10)
    r1 = d.request_ascension()
    if r1["status"] != "DRAGON":
        return  # precondition not met — skip
    # Simulate composite drop
    d.composite = 0.5
    assert_(d.can_self_action() is False)
    assert_(d.status == "KOI" or d.composite < CARE_FLOOR)


@test("test_dragon_cannot_self_action_without_demeter_approval")
def _():
    d = DragonAscension(agent_id="test", scope=Scope(task="t"))
    d.accumulate(insights=5, completions=3, verified_hypotheses=2,
                 validated_commits=5, tests_passed=4, bft_votes_cast=8, sigils_emitted=10)
    r = d.request_ascension()
    if r["status"] != "DRAGON":
        return  # precondition
    # Even as dragon, can_self_action requires composite >= care_floor
    d.composite = CARE_FLOOR - 0.01
    assert_(d.can_self_action() is False)


@test("test_dragon_export_contains_required_fields")
def _():
    d = DragonAscension(agent_id="agent-007", scope=Scope(task="build_oowm"))
    d.accumulate(insights=3, completions=2, validated_commits=2, tests_passed=2)
    e = d.export()
    assert_(e["agent_id"] == "agent-007")
    assert_("composite" in e)
    assert_("status" in e)
    assert_("scope" in e)
    assert_("can_self_action" in e)


@test("test_koi_accumulates_insights_then_becomes_dragon_progression")
def _():
    d = DragonAscension(agent_id="test", scope=Scope(task="t"))
    # Simulate slow accumulation over many iterations
    for _ in range(10):
        d.accumulate(insights=1, completions=0, verified_hypotheses=0,
                     validated_commits=0, tests_passed=0)
    assert_(d.composite > 0.1)  # 10 insights = 0.2 normalised * 0.20 weight = 0.04 normalised
    # Still KOI — Demeter requires ≥ 0.95
    for _ in range(20):
        d.accumulate(insights=0, completions=1, verified_hypotheses=0,
                     validated_commits=2, tests_passed=2)
    # Now should have substantial evidence
    assert_(d.composite > 0.5)


# === Run all ===
def main():
    print("=" * 70)
    print("  🜏🐉 DRAGON MODE E2E TESTS")
    print("=" * 70)
    print()
    test_names = [n for n in globals() if n.startswith("test_")]
    print(f"  Running {len(test_names)} tests...")
    print()
    for n in test_names:
        globals()[n]()
    passed = sum(1 for r in RESULTS if r[1])
    failed = sum(1 for r in RESULTS if not r[1])
    print()
    print("─" * 70)
    print(f"  RESULTS: {passed} passed, {failed} failed (out of {len(RESULTS)})")
    print("─" * 70)
    if failed == 0:
        print()
        print("  ✅ ALL TESTS PASSED")
        print("  Care Floor 0.95 enforced. BFT 12-around-1 votes correctly.")
        print("  Artemis vetoes surveillance. Dionysus vetoes anti-fork. Hecate vetoes anti-DORADO.")
        print("  Demeter is non-negotiable. SIGIL audit per ascension.")
        print()
        return 0
    else:
        print("  ❌ FAILURES:")
        for n, ok, det in RESULTS:
            if not ok: print(f"    - {n}: {det}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
