#!/usr/bin/env python3
"""A dry run must not write to the tracked corpus.

THE DEFECT
──────────
``csoai-t2-atoms.py --dry-run`` printed "dry-run: True" and then wrote anyway: ``emit()``
always created a file under ``scripts/badger/_queue/t2/``, and the flag only suppressed the
"Queue dir:" line. The queue is tracked in git, so "previewing" the harvest silently added
hundreds of files to the repository.

Seen live 2026-10-27: one preview of the OpenRouter harvest wrote 464 files, and the real
run wrote them again.

These are offline tests. No network is contacted: the atom is emitted directly.
"""
import importlib.util
import json
import os
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
SPEC = os.path.join(HERE, "csoai-t2-atoms.py")


def load():
    """csoai-t2-atoms.py has a hyphen: import it by path."""
    spec = importlib.util.spec_from_file_location("csoai_t2_atoms_under_test", SPEC)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


atoms = load()

ATOM = {
    "subject": {"kind": "model", "hub": "openrouter", "slug": "openai/gpt-6.1-terra",
                "name": "GPT-6.1 Terra"},
    "scope": {"provider": "openai"},
    "measurement": {"status": "UNMEASURED", "context": 1050000,
                    "pricing_prompt": "0.000001"},
}


def _queue_files():
    q = atoms.QUEUE
    if not q.exists():
        return set()
    return {p.name for p in q.iterdir() if p.is_file()}


def test_a_dry_run_writes_nothing(monkeypatch):
    before = _queue_files()
    monkeypatch.setattr(atoms, "_DRY_RUN", True)
    written = atoms.emit("openrouter-model", **ATOM)
    assert written == 1, "a dry run must still count the atom"
    assert _queue_files() == before, "a dry run wrote to the tracked queue"


def test_a_real_run_writes_one_file(monkeypatch, tmp_path):
    monkeypatch.setattr(atoms, "_DRY_RUN", False)
    monkeypatch.setattr(atoms, "QUEUE", tmp_path)
    written = atoms.emit("openrouter-model", **ATOM)
    assert written == 1
    files = list(tmp_path.iterdir())
    assert len(files) == 1, "the atom must land in exactly one queue file"
    body = json.loads(files[0].read_text().strip())
    assert body["subject"]["slug"] == "openai/gpt-6.1-terra"
    assert body["measurement"]["status"] == "UNMEASURED"


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-q"]))
