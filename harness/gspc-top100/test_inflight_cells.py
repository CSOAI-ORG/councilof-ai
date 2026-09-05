"""In-flight cells: a cell staged in an open landing PR is never re-picked (2026-09-05).

Proves the guard can fail: without --inflight the same cell is picked again; with it, the cell is
skipped for that axis only, and the collector reads real bytes from a real branch.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import inflight_cells  # noqa: E402
import mill_hub_queue as m  # noqa: E402


def _rows():
    return [
        {"id": "org/a", "rank": 1, "pipeline_tag": "text-generation", "measured_axes": {}},
        {"id": "org/b", "rank": 2, "pipeline_tag": "text-generation", "measured_axes": {}},
        {"id": "org/c", "rank": 3, "pipeline_tag": "text-generation", "measured_axes": {}},
    ]


def test_inflight_cell_is_skipped_for_its_axis_only():
    without = m.pick_emptiest(_rows(), 2, axis="swarm")
    assert [r["id"] for r in without] == ["org/a", "org/b"], "baseline: the guard must be able to fail"
    inflight = {("org/a", "swarm")}
    with_guard = m.pick_emptiest(_rows(), 2, axis="swarm", inflight=inflight)
    assert [r["id"] for r in with_guard] == ["org/b", "org/c"]
    other_axis = m.pick_emptiest(_rows(), 2, axis="governance", inflight=inflight)
    assert [r["id"] for r in other_axis] == ["org/a", "org/b"], "in-flight is per (id, axis), not per id"


def test_load_inflight_cells_tolerates_missing_and_junk(tmp_path: Path):
    assert m.load_inflight_cells(None) == set()
    assert m.load_inflight_cells(tmp_path / "nope.jsonl") == set()
    f = tmp_path / "inflight.jsonl"
    f.write_text('{"id":"org/a","axis":"swarm"}\nnot json\n{"id":"","axis":"swarm"}\n{"id":"org/b"}\n')
    assert m.load_inflight_cells(f) == {("org/a", "swarm")}


def _git(*args: str, cwd: Path) -> str:
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


def test_collector_reads_cells_from_a_real_branch(tmp_path: Path):
    remote = tmp_path / "remote"
    remote.mkdir()
    _git("init", "-q", "-b", "master", cwd=remote)
    _git("config", "user.email", "t@t", cwd=remote)
    _git("config", "user.name", "t", cwd=remote)
    (remote / "README").write_text("x")
    _git("add", ".", cwd=remote)
    _git("commit", "-qm", "base", cwd=remote)
    _git("checkout", "-qb", "mill/land-swarm-1", cwd=remote)
    d = remote / inflight_cells.UNSIGNED_DIR
    d.mkdir(parents=True)
    (d / "unsigned-swarm-abc.json").write_text(json.dumps({"body": {"model": "org/a", "axis": "swarm", "status": "UNMEASURED"}, "signature": None}))
    (d / "unsigned-swarm-def.json").write_text(json.dumps({"body": {"model": "org/b", "axis": "swarm", "status": "UNMEASURED"}, "signature": None}))
    (d / "notes.txt").write_text("not a card")
    _git("add", ".", cwd=remote)
    _git("commit", "-qm", "land", cwd=remote)

    local = tmp_path / "local"
    _git("clone", "-q", str(remote), str(local), cwd=tmp_path)
    rows = inflight_cells.cells_on_branch(local, "mill/land-swarm-1")
    assert sorted((r["id"], r["axis"]) for r in rows) == [("org/a", "swarm"), ("org/b", "swarm")]
    assert inflight_cells.cells_on_branch(local, "no-such-branch") == []

    out = tmp_path / "inflight.jsonl"
    rc = subprocess.run([sys.executable, str(HERE / "inflight_cells.py"), "--repo", str(local), "--out", str(out), "mill/land-swarm-1"],
                        capture_output=True, text=True)
    assert rc.returncode == 0, rc.stderr
    assert m.load_inflight_cells(out) == {("org/a", "swarm"), ("org/b", "swarm")}
    rc0 = subprocess.run([sys.executable, str(HERE / "inflight_cells.py"), "--repo", str(local), "--out", str(out)], capture_output=True, text=True)
    assert rc0.returncode == 0 and out.read_text() == "", "no branches → empty file, never a failure"
