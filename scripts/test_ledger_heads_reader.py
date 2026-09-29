"""pytest wrapper: scripts/readers/ledger_heads_reader.py selftest.

Controls: an unchanged ledger yields the same payload digest (no new root leaf); an equal-size swap of ids
changes ids_sha256; a failed read is UNMEASURED with no count; an unrecognised shape is UNMEASURED; a withdrawn
row is never admitted; every atom passes the staged_leaves gate; the 3072-byte cap drops name lists, not digests.
"""
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent


def test_selftest_passes():
    spec = importlib.util.spec_from_file_location("ledger_heads_reader", HERE / "readers" / "ledger_heads_reader.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    assert m.selftest() == 0


def test_staged_dir_is_admitted_by_the_root_writer():
    import sys
    sys.path.insert(0, str(HERE / "adapters"))
    import staged_leaves
    assert "ledger-heads-2026-09" in staged_leaves.STAGED_DIRS
