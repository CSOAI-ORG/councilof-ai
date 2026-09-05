"""csoai-gspc — read the live GSPC board and verify its signed measurement cards.

The live board at https://councilof.ai/api/gspc is the authority. This library is a reader:
it never caches a verdict, never prints a score the board did not return, and reports three
states and only three — VALID, INVALID, UNCHECKABLE. "Could not check" is a different claim
from "forged", and this library never collapses the two.

Why Python. The published preimage rule is CPython's own serialiser:

    json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")

CPython renders a float of integral value as ``0.0``; ECMAScript, Go and RFC 8785 render it
as ``0``. A naive verifier in those languages computes a different preimage and reports a
false failure on roughly a third of the published set. In Python the rule reproduces exactly.
"""
from .board import (
    BOARD_URL, ROOT_URL, DID_URL, PINNED_KEY_ID,
    fetch_board, totals, axes, get_axis, check_totals, fetch_root, pinned_key,
)
from .card import (
    Verdict, VALID, INVALID, UNCHECKABLE,
    preimage, card_id, verify_card, fetch_card, verify_card_id,
)

__version__ = "0.1.0"
__all__ = [
    "BOARD_URL", "ROOT_URL", "DID_URL", "PINNED_KEY_ID",
    "fetch_board", "totals", "axes", "get_axis", "check_totals", "fetch_root", "pinned_key",
    "Verdict", "VALID", "INVALID", "UNCHECKABLE",
    "preimage", "card_id", "verify_card", "fetch_card", "verify_card_id",
    "__version__",
]
