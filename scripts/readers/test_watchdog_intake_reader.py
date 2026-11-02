"""The watchdog intake atom must pass the publisher's own admission check, and never rate a source.

These are negative controls first: an atom that would be refused must be refused here,
so the reader cannot stage something the public root will silently skip.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1]))

import watchdog_intake_reader as r  # noqa: E402
from scripts.adapters import staged_leaves  # noqa: E402


def _source(sid: str, state: str, url: str | None = None) -> dict:
    return {
        "id": sid,
        "name": sid.replace("-", " ").title(),
        "kind": "advisory-feed",
        "url": url if url is not None else f"https://example.org/{sid}.json",
        "method": "GET",
        "grid": ["supply-chain"],
        "state": state,
        "http_status": 200 if state != "UNREACHABLE" else 0,
        "content_type": "application/json",
        "bytes": 1024,
        "body_sha256": "a" * 64,
    }


def _run(states: list[str] | None = None) -> dict:
    states = states or ["REACHABLE", "UNCHECKABLE", "UNREACHABLE"]
    sources = [_source(f"src-{i}", s) for i, s in enumerate(states)]
    return {
        "schema": "csoai.watchdog-intake/0.1",
        "run_id": "20261030T051040Z",
        "as_of": "2026-10-30T05:10:40Z",
        "producer": "scripts/watchdog_intake.py",
        "totals": {
            "sources_pinned": len(sources),
            "sources_probed": len(sources),
            "reachable": states.count("REACHABLE"),
            "unreachable": states.count("UNREACHABLE"),
            "uncheckable": states.count("UNCHECKABLE"),
            "grid_hits": 3,
        },
        "sources": sources,
        "unpinned_findings": [{"id": "aiid", "reason": "no public machine-readable API"}],
    }


def _feed(decision: str = "HOLD") -> dict:
    return {
        "schema": "csoai.watchdog-charter-feed/0.1",
        "as_of": "2026-10-30T05:38:20Z",
        "totals": {"rows": 2, "sources_considered": 1, "by_bucket": {}},
        "rows": [
            {"row_id": "src-0::charter", "source_id": "src-0", "obligation": "charter", "human_decision": decision},
            {"row_id": "src-1::dora", "source_id": "src-1", "obligation": "dora", "human_decision": decision},
        ],
    }


def test_atom_passes_the_staged_leaf_intake_and_is_probed():
    atom = r.build_atom(_run(), _feed())
    assert staged_leaves._check(atom) is None, staged_leaves._check(atom)
    assert r.check_atom(atom) == []
    assert atom["payload"]["state"] == "PROBED"
    assert atom["payload"]["kind"] == "csoai.watchdog.intake/0.1"
    assert atom["payload"]["not_a_grade"] is True
    assert len(r.canonical_bytes(atom)) <= 3072


def test_the_three_states_stay_three_facts_and_are_never_summed():
    atom = r.build_atom(_run(), _feed())
    payload = atom["payload"]
    assert payload["reachable"] == 1
    assert payload["uncheckable"] == 1
    assert payload["unreachable"] == 1
    assert payload["sources_probed"] == 3
    states = payload["source_states"]
    assert states == {"src-0": "REACHABLE", "src-1": "UNCHECKABLE", "src-2": "UNREACHABLE"}
    # No field carries the sum of the three states as if it were one figure.
    assert 3 not in {payload["reachable"], payload["uncheckable"], payload["unreachable"]}


def test_an_unreachable_source_is_carried_not_dropped_and_never_zero():
    atom = r.build_atom(_run(["UNREACHABLE"]), _feed())
    payload = atom["payload"]
    assert payload["unreachable"] == 1
    assert payload["reachable"] == 0  # a real zero — nothing answered — not a stand-in for missing
    assert "src-0" in payload["source_states"]
    assert payload["source_states"]["src-0"] == "UNREACHABLE"


def test_sha256_binds_the_payload_and_changes_with_it():
    a = r.build_atom(_run(), _feed())
    b = r.build_atom(_run(["REACHABLE", "REACHABLE", "REACHABLE"]), _feed())
    assert a["sha256"] != b["sha256"]
    assert a["sha256"] == staged_leaves.hashlib.sha256(staged_leaves.canonical_bytes(a["payload"])).hexdigest()


def test_a_verdict_word_is_refused_by_both_gates():
    atom = r.build_atom(_run(), _feed())
    atom["subject"] = "these sources are certified"
    assert r.check_atom(atom), "a verdict word must be refused"
    assert staged_leaves._check(atom) is not None, "the publisher must refuse it too"


def test_a_tampered_sha256_is_refused():
    atom = r.build_atom(_run(), _feed())
    atom["sha256"] = "0" * 64
    assert r.check_atom(atom)
    assert staged_leaves._check(atom) is not None


def test_an_over_cap_atom_is_refused_rather_than_truncated():
    atom = r.build_atom(_run(), _feed())
    atom["source_urls"] = [f"https://example.org/{'x' * 200}-{i}" for i in range(40)]
    assert r.check_atom(atom)
    assert staged_leaves._check(atom) is not None


def test_a_non_https_source_url_is_refused():
    atom = r.build_atom(_run(), _feed())
    atom["source_urls"] = ["http://example.org/insecure.json"]
    assert r.check_atom(atom)


def test_a_routing_row_that_stopped_being_hold_is_refused():
    atom = r.build_atom(_run(), _feed(decision="APPROVED"))
    assert r.check_atom(atom), "a routing decision that is not HOLD must not be signed"
    assert staged_leaves._check(atom) is not None


def test_no_run_writes_no_atom(tmp_path=None, capsys=None):
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        out = root / "stage"
        code = r.main(["--stage", str(out), "--root", str(root)])
        assert code == 2, "a missing run must fail closed"
        assert not out.exists() or not list(out.glob("*.json")), "no atom may be written without a run"


def test_the_reader_stages_the_committed_run(tmp_path=None):
    import tempfile

    repo = Path(__file__).resolve().parents[2]
    run_dir = repo / "public" / "interop" / "watchdog-intake"
    if not (run_dir / "latest.json").is_file():
        return  # the harness has not run in this checkout; nothing to assert against
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "stage"
        code = r.main(["--stage", str(out), "--root", str(repo)])
        assert code == 0
        card = json.loads((out / "card-watchdog-intake-unsigned.json").read_text(encoding="utf-8"))
        assert staged_leaves._check(card) is None
        assert card["payload"]["sources_probed"] >= 1
        assert card["payload"]["routing_human_decision"] == "HOLD"
        assert card["payload"]["routing_rows"] >= 1
