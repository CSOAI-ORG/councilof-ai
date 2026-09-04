#!/usr/bin/env python3
"""Derive the GSPC axis register for Hugging Face from the LIVE board — one true master.

THE PROBLEM THIS SOLVES. csoai/gspc-board/axis-register.json on the Hub described itself as
"Static from GSPC_AXIS_REGISTRY.json (ruled source of truth)" and published:

    "gspc_registry_axes": 13, "of_14": true,
    "counting_rule": "Say '13 GSPC axes (registry)' ... Never a bare '16 axes'."
    axes: gov, prv, agi, asi, mcp, oss, mach, care, xr, det, art5, swarm, affect

while https://councilof.ai/api/gspc (csoai.gspc-axes/0.5) serves 22 axes, 22 measured, 0
unmeasured, under LONG ids — governance, provenance, cross-reality, detector-interop,
art5-safeguard and so on. Two divergences at once, both material:

  1. A SUPERSEDED CANON. The board ruling moved to 22 axes; the Hub still published the
     13-of-14 counting rule, and called itself the ruled source of truth while doing it.
  2. A DIFFERENT ID VOCABULARY. `gov` vs `governance`, `xr` vs `cross-reality`, `det` vs
     `detector-interop`. Anything joining Hub data to board data on the id silently misses.

The register was evidently built from the DATASET-BACKED axes rather than from the board,
which is exactly where "13 of 14" came from: 14 of the 22 axes carry an `axes[].dataset`,
and 8 do not. That is a real and interesting fact — it says which axes have a public Hub
corpus — but it is not the axis count, and publishing it as one made the Hub disagree with
the board it claims to serve.

So this script DERIVES the register instead of restating it. Counts come from the axis array,
never typed — the same rule the board states about itself. Both divergences above are the kind
that a human keeps re-introducing by editing a static file, and the only durable fix is to stop
having a static file.

  python3 scripts/hf_axis_register.py --out axis-register.json   # derive
  python3 scripts/hf_axis_register.py --check <url|path>         # MATCH / DRIFTED / UNCHECKABLE

--check is the half that matters over time: it compares what the Hub PUBLISHES against what
the board says right now, so drift is detected instead of discovered months later. Like the
root witness pointer, UNCHECKABLE is a distinct third state — a failed fetch says nothing
about drift and must never collapse into MATCH.
"""
from __future__ import annotations
import argparse, hashlib, json, sys, urllib.error, urllib.request
from datetime import datetime, timezone

BOARD_URL = "https://councilof.ai/api/gspc"
ROOT_URL = "https://councilof.ai/root.json"
# Cloudflare 403s the default Python-urllib UA on this zone (Error 1010), which would turn
# every derivation into an UNCHECKABLE for a reason unrelated to the data.
UA = "csoai-axis-register/1.0"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def derive() -> dict:
    board_raw = fetch(BOARD_URL)
    board = json.loads(board_raw)
    root_raw = fetch(ROOT_URL)
    root = json.loads(root_raw)

    axes = board["axes"]
    entries = []
    for a in axes:
        entries.append({
            "axis": a["axis"],                      # the board's id, verbatim — never a short alias
            "status": a.get("status"),
            "bench": a.get("bench"),
            "task": a.get("task"),
            "n": a.get("n"),
            "dataset": a.get("dataset"),            # null where no public Hub corpus exists
        })
    measured = [e for e in entries if e["status"] == "MEASURED"]
    with_ds = [e for e in entries if e["dataset"]]

    return {
        "schema": "csoai.gspc-axis-register/0.2",
        "as_of": now(),
        "issuer": "councilof.ai",
        # DERIVED, never typed — the board states this rule about itself and the Hub copy
        # must not be the place it stops being true.
        "axes_total": len(entries),
        "axes_measured": len(measured),
        "axes_unmeasured": len(entries) - len(measured),
        "axes_with_hub_dataset": len(with_ds),
        "counting_rule": (
            f"{len(entries)} axis on the board, {len(measured)} measured. "
            f"{len(with_ds)} of them carry a public Hub dataset and "
            f"{len(entries) - len(with_ds)} do not — that is a statement about Hub coverage, "
            "never the axis count. Both numbers are derived from the axis array."
        ),
        "supersedes": (
            "csoai.gspc-axis-register/0.1, which published 'gspc_registry_axes: 13, of_14: true' "
            "with short ids (gov, prv, agi, asi, mcp, oss, mach, care, xr, det, art5, swarm, "
            "affect). That count was the DATASET-BACKED axes, not the board, and the short ids "
            "never matched the board's. Do not join on them."
        ),
        "id_vocabulary": "the board's long ids verbatim (governance, cross-reality, detector-interop, …); short aliases are retired",
        "provenance": {
            "board": {"url": BOARD_URL, "schema": board.get("schema"), "sha256": hashlib.sha256(board_raw).hexdigest(), "bytes": len(board_raw)},
            "signed_root": {"url": ROOT_URL, "merkle_root": root.get("merkle_root"), "sha256": hashlib.sha256(root_raw).hexdigest(), "card_count": root.get("card_count"), "as_of": root.get("as_of")},
            "how": "derived by scripts/hf_axis_register.py from the two documents above; not hand-maintained",
        },
        "axes": entries,
        "never": [
            "a rank", "a grade", "a certificate",
            "a MEASURED status invented here — status is copied from the board, never decided",
        ],
    }


def compare(published: dict, derived: dict) -> dict:
    """Drift between what the Hub publishes and what the board says right now."""
    pub_axes = [a.get("axis") for a in (published.get("axes") or [])]
    der_axes = [a.get("axis") for a in derived["axes"]]
    pub_status = {a.get("axis"): a.get("status") for a in (published.get("axes") or [])}
    der_status = {a["axis"]: a["status"] for a in derived["axes"]}
    missing = [a for a in der_axes if a not in pub_axes]
    extra = [a for a in pub_axes if a not in der_axes]
    changed = sorted(a for a in der_axes if a in pub_status and pub_status[a] != der_status[a])
    ok = not (missing or extra or changed)
    return {
        "status": "MATCH" if ok else "DRIFTED",
        "checked_at": now(),
        "published_axis_count": len(pub_axes),
        "board_axis_count": len(der_axes),
        "missing_from_published": missing,
        "not_on_the_board": extra,
        "status_changed": changed,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", help="write the derived register here")
    ap.add_argument("--check", help="url or path of a published register to compare against the board")
    args = ap.parse_args()

    try:
        d = derive()
    except Exception as e:
        print(f"UNCHECKABLE: could not derive from the live board ({type(e).__name__}: {e})")
        return 2

    if args.check:
        try:
            raw = fetch(args.check) if args.check.startswith("http") else open(args.check, "rb").read()
            published = json.loads(raw)
        except Exception as e:
            print(f"UNCHECKABLE: could not read the published register ({type(e).__name__}: {e}) — this says nothing about drift")
            return 2
        r = compare(published, d)
        print(f"  {r['status']}: published {r['published_axis_count']} axes, board has {r['board_axis_count']}")
        for k in ("missing_from_published", "not_on_the_board", "status_changed"):
            if r[k]:
                print(f"    {k}: {', '.join(map(str, r[k]))[:400]}")
        return 0 if r["status"] == "MATCH" else 1

    out = json.dumps(d, indent=1, ensure_ascii=False) + "\n"
    if args.out:
        open(args.out, "w").write(out)
        print(f"  wrote {args.out}: {d['axes_total']} axes, {d['axes_measured']} measured, "
              f"{d['axes_with_hub_dataset']} with a Hub dataset")
    else:
        sys.stdout.write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
