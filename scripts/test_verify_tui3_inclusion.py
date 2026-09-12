#!/usr/bin/env python3
"""Regression tests for cryptographic TUI-3 card verification."""
from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = ROOT / "scripts" / "verify_tui3_inclusion.py"
spec = importlib.util.spec_from_file_location("verify_tui3_inclusion", MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def main() -> None:
    public_key = module.board_public_key()
    families = module.find_family_cards(public_key)
    card_file = next(iter(next(iter(families.values()))))["file"]
    wrapper = module.json.loads((module.CARDS / card_file).read_bytes())
    card = wrapper.get("card", wrapper)
    assert module.signature_state(card, public_key) == "VALID"

    changed_body = copy.deepcopy(card)
    changed_body["subject"] = str(changed_body.get("subject", "")) + " tampered"
    assert module.signature_state(changed_body, public_key) == "INVALID"

    changed_signature = copy.deepcopy(card)
    changed_signature["sig_ed25519"] = "00" * 64
    assert module.signature_state(changed_signature, public_key) == "INVALID"

    missing_signature = copy.deepcopy(card)
    missing_signature["sig_ed25519"] = None
    assert module.signature_state(missing_signature, public_key) == "INVALID"
    print("PASS test_verify_tui3_inclusion")


if __name__ == "__main__":
    main()
