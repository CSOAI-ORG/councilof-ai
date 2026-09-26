"""The live board, and the totals re-derived from it rather than trusted."""
from __future__ import annotations

import base64
import json
import urllib.request
from typing import Any

BOARD_URL = "https://councilof.ai/api/gspc"
ROOT_URL = "https://councilof.ai/root.json"
DID_URL = "https://councilof.ai/.well-known/did.json"
VERIFY_URL = "https://councilof.ai/gspc-verify"
PINNED_KEY_ID = "did:web:csoai.org#card-attestation-1"

_UA = "csoai-gspc (+https://github.com/CSOAI-ORG/gspc-board)"


def _get_json(url: str, timeout: float = 30.0) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": _UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_board(url: str = BOARD_URL, timeout: float = 30.0) -> dict:
    """Fetch the live board. The GET is the authority; nothing here is cached."""
    return _get_json(url, timeout)


def axes(board: dict | None = None) -> list[dict]:
    return (board or fetch_board())["axes"]


def totals(board: dict | None = None) -> dict:
    return (board or fetch_board())["totals"]


def _load_aliases() -> dict:
    """THE ONE axis alias table, shipped byte-identical to functions/mcp/axis-aliases.json."""
    try:
        from importlib.resources import files  # Python >= 3.9
        return json.loads(files(__package__).joinpath("axis_aliases.json").read_text(encoding="utf-8"))["axes"]
    except Exception:  # a broken install must not break reading the board; names then match exactly
        return {}


AXIS_ALIASES: dict = _load_aliases()
_CANON = {}
for _canonical, _aliases in AXIS_ALIASES.items():
    _CANON[_canonical.lower()] = _canonical
    for _a in _aliases:
        _CANON[_a.lower()] = _canonical


def canonical_axis(name: str) -> str:
    """The board's own id for an axis name or alias, case-insensitive ("GOV" -> "governance").

    An unknown name comes back trimmed and lowercased, and simply matches nothing on the board.
    """
    k = str(name or "").strip().lower()
    return _CANON.get(k, k)


def get_axis(name: str, board: dict | None = None) -> dict | None:
    """One slot by name or alias (case-insensitive), or None. None is the honest answer for an absent slot."""
    want = canonical_axis(name)
    for a in axes(board):
        if canonical_axis(a.get("axis", "")) == want:
            return a
    return None


def check_totals(board: dict | None = None) -> dict:
    """Re-derive the headline counts from the axis array and compare with what was printed.

    Returns a dict with ``agree`` True or False plus both sets of numbers, so a caller can
    show the disagreement rather than a bare boolean. A board that prints a total its own
    array does not support is the failure this function exists to catch.
    """
    b = board or fetch_board()
    arr = b["axes"]
    t = b["totals"]
    derived_slots = len(arr)
    derived_measured = sum(1 for a in arr if a.get("status") == "MEASURED")
    return {
        "agree": derived_slots == t.get("axes") and derived_measured == t.get("measured_axes"),
        "printed_slots": t.get("axes"),
        "printed_measured": t.get("measured_axes"),
        "derived_slots": derived_slots,
        "derived_measured": derived_measured,
        "public_count": t.get("public_count"),
        "source": BOARD_URL,
    }


def fetch_root(timeout: float = 30.0) -> dict:
    """The Merkle root over the published cards."""
    return _get_json(ROOT_URL, timeout)


def pinned_key(key_id: str = PINNED_KEY_ID, timeout: float = 30.0) -> str:
    """The card-attestation public key, as hex, read from the DID document.

    Pin against this. A card carries its own ``pubkey``; verifying a card against the key it
    ships with proves only that the file is self-consistent, which is not authenticity.
    """
    did = _get_json(DID_URL, timeout)
    for vm in did.get("verificationMethod", []):
        if vm.get("id") == key_id or vm.get("id", "").endswith(key_id.split("#")[-1]):
            x = vm["publicKeyJwk"]["x"]
            return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)).hex()
    raise LookupError(f"{key_id} is not in {DID_URL}")
