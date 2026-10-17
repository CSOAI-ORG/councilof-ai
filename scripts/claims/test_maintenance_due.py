"""pytest wrapper: scripts/claims/maintenance_due.py selftest (schedule, classification, chain, candidate ids).

The selftest plants its own controls: a SUPERSEDED registry must never be scheduled; a second read that
disagrees with the first is UNCONFIRMED, never a change; a failed fetch stays due; an edited or reordered
outcome row breaks the chain; a candidate id must match the corrections ledger's CANDIDATE_ID rule.
"""
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent


def _mod():
    spec = importlib.util.spec_from_file_location("maintenance_due", HERE / "maintenance_due.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def test_selftest_passes():
    assert _mod().selftest() == 0


def test_candidate_id_matches_ledger_rule():
    import re
    ts = (HERE.parent.parent / "functions/api/corrections.ts").read_text(encoding="utf-8")
    m = re.search(r"export const CANDIDATE_ID = /(.+)/;", ts)
    assert m, "CANDIDATE_ID not found in functions/api/corrections.ts"
    rule = re.compile(m.group(1))
    assert rule.match(_mod().candidate_id("claimreg-x-2026-09-22-rev2", "20260929T075500Z", "CL-1"))


def test_schedule_is_day_7_30_90_plus_signed_read():
    M = _mod()
    reg = {"registries": [{"registry_id": "r", "status": "LIVE", "created": "2026-09-23T00:00:00Z", "url": "https://x/r.json"}],
           "subjects": [{"registry_id": "r", "next_scheduled_read": "2026-09-28T09:20:00Z"}]}
    assert [(r["check"], r["due"]) for r in M.schedule(reg)] == [
        ("scheduled-read", "2026-09-28"), ("day-7", "2026-09-30"), ("day-30", "2026-10-23"), ("day-90", "2026-12-22")]


def test_confirmed_change_does_not_complete_failed_sibling_claim():
    m = _mod()
    first = [{"claim_id": "A", "changed": True, "http_status": 200, "recorded_hash": "old", "current_hash": "new"},
             {"claim_id": "B", "changed": None, "http_status": 503}]
    outcome, changed, unconfirmed, failed = m.classify(first, {"A": {"changed": True, "current_hash": "new"}})
    assert outcome == "CHANGED_CONFIRMED" and changed[0]["claim_id"] == "A"
    row = {"registry_id": "r", "check": "day-7", "due": "2026-10-01"}
    last = {"r|day-7": {**row, "outcome": outcome, "claims_fetch_failed": failed, "claims_unconfirmed": unconfirmed, "row_sha256": "0" * 64}}
    assert m.state_of(row, last, "2026-10-08") == "FETCH_FAILED"
    assert m.due_now([row], last, "2026-10-08") == [row]
    view = m.build_latest([row], list(last.values()), "2026-10-08", "2026-10-08T00:00:00Z")
    assert view["checks"][0]["producer_outcome"] == "CHANGED_CONFIRMED"


def test_confirmed_change_does_not_complete_unconfirmed_sibling_claim():
    m = _mod()
    row = {"registry_id": "r", "check": "day-7", "due": "2026-10-01"}
    last = {"r|day-7": {"outcome": "CHANGED_CONFIRMED", "claims_unconfirmed": ["B"]}}
    assert m.state_of(row, last, "2026-10-08") == "UNCONFIRMED"
    assert m.due_now([row], last, "2026-10-08") == [row]


def test_retry_preserves_candidate_and_new_transition_does_not_reuse_it():
    m = _mod()
    change = {"claim_id": "A", "recorded_hash": "old", "current_hash": "new"}
    prior = {"candidate_id": "cand-existing", "registry_id": "r", "registry_sha256": "registry-sha", **change}
    assert m.existing_candidate([prior], "r", "registry-sha", change) == "cand-existing"
    assert m.existing_candidate([prior], "r", "other-registry-sha", change) is None
    assert m.existing_candidate([prior], "r", "registry-sha", {**change, "current_hash": "next"}) is None


def test_two_partial_runs_append_outcomes_without_duplicating_confirmed_candidate():
    import json
    import tempfile
    from types import SimpleNamespace
    from unittest.mock import patch

    m = _mod()
    register = {"registries": [{"registry_id": "r", "status": "LIVE", "created": "2026-09-23T00:00:00Z", "url": "https://fixture/r.json"}],
                "subjects": [{"registry_id": "r", "next_scheduled_read": "2026-09-28T09:20:00Z"}]}
    first = [{"claim_id": "A", "url": "https://fixture/page", "changed": True, "http_status": 200, "recorded_hash": "old", "current_hash": "new",
              "claim_present": False, "claim_presence": {"mode": "NOT_LOCATED", "claim_sha256": "1111111111111111111111111111111111111111111111111111111111111111",
              "extractor": "csoai-visible-text/2", "search_surface": "VISIBLE_TEXT", "source_content_sha256": "2222222222222222222222222222222222222222222222222222222222222222"}},
             {"claim_id": "B", "changed": None, "http_status": 503}]
    with tempfile.TemporaryDirectory() as tmp:
        tools, data = Path(tmp) / "tools", Path(tmp) / "data"
        reader = tools / "scripts/claims/reread.mjs"
        reader.parent.mkdir(parents=True)
        reader.write_text("// bounded fixture; never executed\n")
        a = SimpleNamespace(data=str(data), tools=str(tools), register="https://fixture/register", today="2026-10-08", confirm_gap=605, no_upload=True)
        def get(url):
            return json.dumps(register if url == a.register else {"registry_id": "r"}).encode()
        def reread(_tools, _registry, only=None):
            return first if only is None else [first[0]]
        with patch.object(m, "get", get), patch.object(m, "reread", reread), patch.object(m.time, "sleep"), \
             patch.object(m, "utcnow", side_effect=["2026-10-08T00:00:00Z", "2026-10-08T00:20:00Z"]):
            assert m.run(a) == 0
            original = (data / "candidates.jsonl").read_bytes()
            assert m.run(a) == 0
        assert (data / "candidates.jsonl").read_bytes() == original
        candidate = json.loads(original)
        rows = [json.loads(l) for l in (data / "outcomes.jsonl").read_text().splitlines()]
        assert len(rows) == 4 and m.verify_chain(rows) == []
        assert all(row["outcome"] == "CHANGED_CONFIRMED" and row["claims_fetch_failed"] == ["B"] for row in rows)
        assert all(candidate["candidate_id"] in row["correction_status"] for row in rows)
        latest = json.loads((data / "latest.json").read_text())
        assert latest["counts"]["FETCH_FAILED"] == 2


def _presence_reading(present, mode=None, quote_sha="1111111111111111111111111111111111111111111111111111111111111111", source_sha="2222222222222222222222222222222222222222222222222222222222222222"):
    return {"claim_id": "A", "url": "https://fixture/page", "changed": True, "http_status": 200,
            "recorded_hash": "old", "current_hash": "new", "claim_present": present,
            "claim_presence": {"mode": mode or ("EXACT" if present else "NOT_LOCATED"),
                               "claim_sha256": quote_sha, "extractor": "csoai-visible-text/2",
                               "search_surface": "VISIBLE_TEXT", "source_content_sha256": source_sha}}


def _run_presence_fixture(first, second):
    import json
    import tempfile
    from types import SimpleNamespace
    from unittest.mock import patch
    m = _mod()
    register = {"registries": [{"registry_id": "r", "status": "LIVE", "created": "2026-09-23T00:00:00Z", "url": "https://fixture/r.json"}],
                "subjects": [{"registry_id": "r", "next_scheduled_read": "2026-09-28T09:20:00Z"}]}
    with tempfile.TemporaryDirectory() as tmp:
        tools, data = Path(tmp) / "tools", Path(tmp) / "data"
        reader = tools / "scripts/claims/reread.mjs"
        reader.parent.mkdir(parents=True)
        reader.write_text("// bounded fixture; never executed\n")
        a = SimpleNamespace(data=str(data), tools=str(tools), register="https://fixture/register", today="2026-10-08", confirm_gap=605, no_upload=True)
        def get(url):
            return json.dumps(register if url == a.register else {"registry_id": "r"}).encode()
        with patch.object(m, "get", get), patch.object(m, "reread", side_effect=[first, second] if any(r.get("changed") is True for r in first) else [first]), \
             patch.object(m.time, "sleep"), patch.object(m, "utcnow", return_value="2026-10-08T00:00:00Z"):
            assert m.run(a) == 0
        rows = [json.loads(l) for l in (data / "outcomes.jsonl").read_text().splitlines()]
        candidates = [json.loads(l) for l in (data / "candidates.jsonl").read_text().splitlines()] if (data / "candidates.jsonl").exists() else []
        assert m.verify_chain(rows) == []
        assert all(r["schema"] == "csoai.claim-maintenance-check/0.2" for r in rows)
        return m, rows, candidates


def test_page_noise_retained_without_claim_absence_candidate():
    reading = _presence_reading(True)
    _, rows, candidates = _run_presence_fixture([reading], [reading])
    assert not candidates
    assert all(r["outcome"] == "CHANGED_CONFIRMED" and r["claims_changed"][0]["claim_present"] is True
               and r["claims_changed"][0]["claim_absence_confirmed"] is False for r in rows)


def test_two_comparable_quote_misses_create_one_bounded_candidate():
    reading = _presence_reading(False)
    _, rows, candidates = _run_presence_fixture([reading], [reading])
    assert len(candidates) == 1
    assert candidates[0]["kind"] == "EXACT_QUOTE_NOT_LOCATED_TWICE"
    assert "not a finding of retraction" in candidates[0]["boundary"]
    assert all(r["claims_changed"][0]["claim_absence_confirmed"] is True for r in rows)


def test_failed_read_remains_due_without_absence_candidate():
    reading = {"claim_id": "A", "changed": None, "http_status": 503, "claim_present": None,
               "claim_presence": {"mode": "READ_INCONCLUSIVE"}}
    m, rows, candidates = _run_presence_fixture([reading], [])
    assert not candidates and all(r["outcome"] == "FETCH_FAILED" for r in rows)
    plan = [{"registry_id": "r", "check": "scheduled-read", "due": "2026-09-28"}]
    assert m.due_now(plan, m.latest_outcomes(rows), "2026-10-08") == plan


def test_unknown_quote_or_different_presence_instrument_cannot_be_confirmed_absence():
    m = _mod()
    missing = {"claim_id": "A", "changed": True, "current_hash": "new"}
    assert m.classify([missing], {"A": missing})[1][0]["claim_absence_confirmed"] is False
    first = _presence_reading(False)
    second = _presence_reading(False, source_sha="different-presence-bytes")
    assert m.classify([first], {"A": second})[1][0]["claim_absence_confirmed"] is False
    assert m.classify([first], {"A": _presence_reading(True)})[1][0]["claim_absence_confirmed"] is False
    malformed = _presence_reading(False, quote_sha="not-a-digest")
    assert m.classify([malformed], {"A": malformed})[1][0]["claim_absence_confirmed"] is False
    malformed["claim_presence"] = ["unrecognized shape"]
    assert m.classify([malformed], {"A": malformed})[1][0]["claim_absence_confirmed"] is False
