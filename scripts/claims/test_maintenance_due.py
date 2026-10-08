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
    first = [{"claim_id": "A", "url": "https://fixture/page", "changed": True, "http_status": 200, "recorded_hash": "old", "current_hash": "new"},
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
