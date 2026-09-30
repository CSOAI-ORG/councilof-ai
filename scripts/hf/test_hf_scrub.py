"""--scrub: legacy agent directives and typed counts leave csoai cards; the reader's sentence stays."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("hoc", Path(__file__).with_name("hf-org-card.py"))
hoc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hoc)

CARD = """intro
**SUPERSEDED:** typed Hub triples `LIVE (re-GET /api/hub-cards → counts.*)` (and prior 885/900/937/1113/1182/1185) — do not re-paste. Hub cite = live GET only.
Measurement, never certification. Printer only — no axis mine on ZeroGPU. A100 COLD.
- Hub cite: https://councilof.ai/api/hub-cards — **re-GET**; quote `counts.*` (typed `LIVE (re-GET /api/hub-cards → counts.*)` SUPERSEDED 2026-09-14)
**Lid:** 22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.
**Lid:** Read `totals.lid` from the live board at viewing time; measurement, not certification.
| MCP endpoint — 12 tools, verified 2026-09-04T04:33:29Z | `POST https://councilof.ai/mcp` |
@misc{x,
  doi          = {10.5281/zenodo.21991104},
  year = {2026}
}
"""
LID = "23 axes measured · 14 model comparisons: 0 separated · 7 TIE · 7 UNTESTED · 9 fact runs · TIE is TIE · not a certificate."


def test_scrub_removes_directives_and_updates_typed_numbers():
    out, changes = hoc.scrub_legacy(CARD, LID, 18, "2026-09-30T13:00:00Z")
    assert "A100 COLD" not in out and "Hub cite = live GET only" not in out and "do not re-paste" not in out
    assert "Measurement, never certification." in out
    assert "- Hub cards (read live): https://councilof.ai/api/hub-cards" in out
    assert f"**Lid:** {LID}" in out and "22 axes measured" not in out
    assert "Read `totals.lid` from the live board" in out  # an untyped lid sentence is left alone
    assert "| MCP endpoint — 18 tools, verified 2026-09-30T13:00:00Z | `POST https://councilof.ai/mcp` |" in out
    assert "note         = {DOI record unavailable since 29 Sep 2026" in out
    assert hoc.stale_hits(out) == []


def test_scrub_is_idempotent_and_never_invents_numbers():
    once, _ = hoc.scrub_legacy(CARD, LID, 18, "t")
    twice, changes = hoc.scrub_legacy(once, LID, 18, "t")
    assert twice == once
    unread, _ = hoc.scrub_legacy(CARD, None, None, "t")
    assert "22 axes measured" in unread and "12 tools" in unread  # no live value: typed lines are left, not guessed
