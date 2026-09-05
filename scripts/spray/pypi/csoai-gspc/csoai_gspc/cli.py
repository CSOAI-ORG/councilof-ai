"""csoai-gspc — a command-line reader for the live GSPC board."""
from __future__ import annotations

import argparse
import json
import sys

from .board import BOARD_URL, VERIFY_URL, check_totals, fetch_board, fetch_root, get_axis, pinned_key
from .card import VALID, fetch_card, verify_card


def _lid(board: dict) -> str:
    """The board's own one-line description, verbatim. Never a second sentence derived here."""
    return board.get("totals", {}).get("lid") or "UNCHECKABLE — the board carried no lid"


def _board(args) -> int:
    b = fetch_board()
    t = b["totals"]
    print(t["public_count"])
    print(f"slots {t['axes']} · measured {t['measured_axes']} · empty {t['unmeasured_axes']}")
    for a in b["axes"]:
        ds = a.get("dataset") or "—"
        print(f"  {a['axis']:<26} {a['family']:<10} {a.get('bench',''):<22} n={a['n']:<6} {a['status']:<10} {ds}")
    print(f"\nauthority: {BOARD_URL}\nlid: {_lid(b)}")
    return 0


def _check(args) -> int:
    r = check_totals()
    print(json.dumps(r, indent=1, ensure_ascii=False))
    if r["agree"]:
        print("OK — the printed totals are derived from the axis array, not typed.")
        return 0
    print("MISMATCH — the board printed a total its own array does not support.", file=sys.stderr)
    return 1


def _axis(args) -> int:
    a = get_axis(args.name)
    if a is None:
        print(f"no slot named {args.name!r} on the board", file=sys.stderr)
        return 1
    print(json.dumps(a, indent=1, ensure_ascii=False))
    return 0


def _verify(args) -> int:
    if args.card.endswith(".json"):
        with open(args.card, encoding="utf-8") as fh:
            card = json.load(fh)
    else:
        card = fetch_card(args.card)
    v = verify_card(card, pinned_key() if not args.key else args.key)
    print(v)
    return 0 if v.state == VALID else 1


def _root(args) -> int:
    print(json.dumps(fetch_root(), indent=1, ensure_ascii=False))
    return 0


def _snapshot(args) -> int:
    """Print the dated snapshot bundled with this release. It is what the live GET said on that day, not the live GET."""
    from importlib import resources
    try:
        base = resources.files("csoai_gspc") / "snapshot"
        meta = json.loads((base / "SNAPSHOT.json").read_text(encoding="utf-8"))
    except (FileNotFoundError, ModuleNotFoundError):
        print("this release bundles no snapshot; read the live board with `csoai-gspc board`", file=sys.stderr)
        return 1
    if args.file:
        print((base / args.file).read_text(encoding="utf-8"), end="")
        return 0
    print(f"bundled snapshot as_of {meta.get('as_of')} (read at {meta.get('read_at')})")
    print(f"lid: {meta.get('lid')}")
    print(f"merkle_root {meta.get('merkle_root')} over {meta.get('card_count')} cards · fingerprint {meta.get('fingerprint')}")
    print("files: board.json root.json SNAPSHOT.json (use --file NAME to print one)")
    print(f"the live GET at {BOARD_URL} is the authority; this bundle is only what it said on that day.")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="csoai-gspc",
        description=("Read the live GSPC board and verify its signed measurement cards. "
                     f"The GET at {BOARD_URL} is the authority; this tool is a reader. "
                     "Measurement, not certification."),
        epilog=f"Verify in a browser instead, free and with no account: {VERIFY_URL}",
    )
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("board", help="print every slot on the live board").set_defaults(fn=_board)
    sub.add_parser("check", help="re-derive the totals from the axis array and compare").set_defaults(fn=_check)
    a = sub.add_parser("axis", help="print one slot as JSON"); a.add_argument("name"); a.set_defaults(fn=_axis)
    v = sub.add_parser("verify", help="verify a card by id or from a local .json file")
    v.add_argument("card"); v.add_argument("--key", help="pinned public key in hex (default: read the DID document)")
    v.set_defaults(fn=_verify)
    sub.add_parser("root", help="print the Merkle root over the published cards").set_defaults(fn=_root)
    sn = sub.add_parser("snapshot", help="print the dated board snapshot bundled with this release (not the live GET)")
    sn.add_argument("--file", choices=["board.json", "root.json", "SNAPSHOT.json"], help="print one bundled file verbatim")
    sn.set_defaults(fn=_snapshot)
    args = p.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
