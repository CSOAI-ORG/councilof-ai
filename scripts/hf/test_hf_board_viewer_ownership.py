"""The standalone viewer builder must not compete with the atomic HF publisher."""

import importlib.util
from pathlib import Path

import pytest


SPEC = importlib.util.spec_from_file_location("hf_org_card_viewer", Path(__file__).with_name("hf-org-card.py"))
assert SPEC and SPEC.loader
card = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(card)


def test_viewer_preview_is_dynamic_and_push_refuses_without_upload(monkeypatch, tmp_path):
    monkeypatch.setattr(card, "render", lambda d: "Derived board state.\n")
    monkeypatch.setattr(card, "hf_upload", lambda *args: pytest.fail("HF upload forbidden"))
    data = {"state": "DERIVED", "as_of": "2026-09-24T09:00:00Z", "lid": "3 axes measured",
            "axes": [{"axis": "a", "status": "MEASURED"},
                     {"axis": "b", "status": "MEASURED"},
                     {"axis": "c", "status": "MEASURED"}]}
    with pytest.raises(RuntimeError, match="published atomically"):
        card.dataset_board(data, True, tmp_path)
    assert "3 derived rows" in (tmp_path / "README.md").read_text()
