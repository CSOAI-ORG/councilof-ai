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
