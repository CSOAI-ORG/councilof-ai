#!/usr/bin/env python3
"""Offline tests for hf_card_metadata.render (no network)."""
import importlib.util, pathlib, sys
spec = importlib.util.spec_from_file_location("m", pathlib.Path(__file__).with_name("hf_card_metadata.py"))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

card = "---\nlicense: cc-by-4.0\n# TODO configs: name the existing data file(s)\nconfigs:\n- config_name: default\n  data_files:\n  - a.json\n---\n\n# T\n\nbody\n"
out = m.render("csoai/x", card, m.NO_VIEWER, None)
assert "# TODO" not in out and "configs:" not in out and "viewer: false" in out, out
out2 = m.render("csoai/x", card, m.cfg("items.jsonl"), None)
assert 'path: "items.jsonl"' in out2 and "a.json" not in out2, out2
assert m.render("csoai/x", out2, m.cfg("items.jsonl"), None) == out2, "not idempotent"

block = m.START + "\n- **Board axes:** 23 measured of 23\n" + m.END
board = ("---\nlicense: cc-by-4.0\n---\n\n# B\n\n**Totals:** 335 signed cards · 16 card_index axes\n\n"
         "- **Dated card root:** [root](https://councilof.ai/interop/card-root-2026-09-24-abc.json)\n\n## Next\n")
b = m.render("csoai/gspc-board", board, {}, block)
assert "16 card_index axes" not in b and "card-root-2026-09" not in b and b.count(m.START) == 1, b
assert m.render("csoai/gspc-board", b, {}, block) == b, "board not idempotent"
assert not m.BANNED.search(block)
print("hf_card_metadata: all tests passed")
