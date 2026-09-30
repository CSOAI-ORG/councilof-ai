# SPDX-License-Identifier: Apache-2.0
"""Offline tests for fleet/done-when/done_when.py: the rules judge bytes, never the network."""
import datetime as dt, importlib.util, json, pathlib

HERE = pathlib.Path(__file__).parent
spec = importlib.util.spec_from_file_location("done_when", HERE / "done_when.py")
dw = importlib.util.module_from_spec(spec); spec.loader.exec_module(dw)
T = dt.datetime(2026, 9, 29, 10, 0, tzinfo=dt.timezone.utc)


def j(o):
    return json.dumps(o).encode()


def test_root_age_rule_passes_and_fails_on_the_boundary():
    c = {"goal": "g", "path": ["as_of"], "rule": {"kind": "max_age_hours", "hours": 26}}
    assert dw.judge(c, 200, j({"as_of": "2026-09-29T05:03:20Z"}), None, T)[0] == "PASS"
    assert dw.judge(c, 200, j({"as_of": "2026-09-28T08:00:00Z"}), None, T)[0] == "FAIL"   # 26.0h: not under 26
    assert dw.judge(c, 200, j({"as_of": "2026-09-28T08:00:01Z"}), None, T)[0] == "PASS"


def test_dated_today_and_nested_select():
    c = {"goal": "g", "path": ["figures", {"id": "capsules"}, "as_of"], "rule": {"kind": "dated_today"}}
    ok = j({"figures": [{"id": "board", "as_of": "2026-09-28"}, {"id": "capsules", "as_of": "2026-09-29T08:16:04Z"}]})
    stale = j({"figures": [{"id": "capsules", "as_of": "2026-09-28T08:16:04Z"}]})
    assert dw.judge(c, 200, ok, None, T)[0] == "PASS"
    assert dw.judge(c, 200, stale, None, T)[0] == "FAIL"


def test_absent_field_non_200_and_non_json_are_fail_never_skip():
    c = {"goal": "g", "path": ["as_of"], "rule": {"kind": "dated_today"}}
    assert dw.judge(c, 200, j({"asof": "2026-09-29"}), None, T) == ("FAIL", "as_of absent")
    assert dw.judge(c, 404, b"", "http 404", T)[0] == "FAIL"
    assert dw.judge(c, 200, b"<html>", None, T)[0] == "FAIL"
    assert dw.judge(c, None, b"", "URLError: x", T)[0] == "FAIL"


def test_one_line_per_goal_per_day(tmp_path):
    log = tmp_path / "done-when.log"
    log.write_text("# header\n2026-09-29T10:11:12Z mwf-x abc PASS value=1\n")
    assert dw.logged_today(str(log), "mwf-x", "2026-09-29")
    assert not dw.logged_today(str(log), "mwf-x", "2026-09-30")
    assert not dw.logged_today(str(log), "mwf-y", "2026-09-29")


def test_registered_checks_are_well_formed():
    reg = json.loads((HERE / "checks.json").read_text())
    goals = [c["goal"] for c in reg["checks"]]
    assert len(goals) == len(set(goals)) >= 3
    for c in reg["checks"]:
        assert c["rule"]["kind"] in ("max_age_hours", "dated_today", "equals", "status")
        assert c["url"].startswith("/") or c["url"].startswith("https://")
