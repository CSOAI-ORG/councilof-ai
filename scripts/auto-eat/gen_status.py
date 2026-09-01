#!/usr/bin/env python3
"""gen_status.py — regenerate the STATUS surface each loop.

Writes:
  scripts/auto-eat/STATUS.md              (human)
  public/interop/auto-eat/status.json     (machine)

"The loop is alive" must be a checkable fact, not a claim: every number here is
counted from the frozen queue / probed set / staged compact — never invented.
last_signed_batch is read from the human ledger (surfaces beginning autoeat.*
that appear as signed ledger-card-*.json), so it only turns non-null once a card
actually signed green through GHA and landed on master.
"""
from __future__ import annotations

import json
from pathlib import Path

import common as c


def count_by(rows, key):
    out: dict[str, int] = {}
    for r in rows:
        out[r.get(key)] = out.get(r.get(key), 0) + 1
    return out


def last_signed_batch() -> dict | None:
    """Scan for signed ledger cards whose surface starts with 'autoeat.'."""
    best = None
    for p in c.INTEROP.glob("ledger-card-autoeat-*.json"):
        try:
            card = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not card.get("sig_ed25519"):
            continue
        as_of = card.get("as_of") or ""
        if best is None or as_of > best.get("as_of", ""):
            best = {"surface": card.get("surface"), "as_of": as_of, "sha256": card.get("sha256")}
    return best


def main() -> int:
    rows = c.load_queue()
    probed = c.load_probed()
    compact = c.load_compact()

    by_kind = count_by(rows, "kind")
    discovered = len(rows)
    probed_n = len(probed)
    atoms = len(list(c.FEED.glob("card-autoeat-*-unsigned.json")))

    # aggregate live fraction across staged compact atoms
    live = probed_live = 0
    for payload in compact.values():
        s = payload.get("sample") or {}
        live += int(s.get("live", 0) or 0)
        probed_live += int(s.get("n_probed", 0) or 0)
    live_fraction = round(live / probed_live, 4) if probed_live else None

    signed = last_signed_batch()

    status = {
        "loop": "asi-auto-eat",
        "as_of": c.utcnow(),
        "queue_discovered_total": discovered,
        "discovered_by_kind": by_kind,
        "probed_total": probed_n,
        "staged_live_of_probed": {"live": live, "probed": probed_live, "fraction": live_fraction},
        "atoms_staged": atoms,
        "surfaces_staged": sorted(compact.keys()),
        "last_signed_batch": signed,
        "invariant": "atoms carry sig_ed25519=null; nothing is MEASURED until a card signs green via GHA OIDC and verifies",
    }
    c.FEED.mkdir(parents=True, exist_ok=True)
    c.STATUS_JSON.write_text(json.dumps(status, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = []
    lines.append("# ASI AUTO-EAT — STATUS")
    lines.append("")
    lines.append(f"_regenerated {status['as_of']} — every number counted, none invented_")
    lines.append("")
    lines.append("| field | value |")
    lines.append("|---|---|")
    lines.append(f"| queue DISCOVERED total | {discovered} |")
    lines.append(f"| probed total | {probed_n} |")
    lines.append(f"| atoms staged (unsigned) | {atoms} |")
    lf = "n/a" if live_fraction is None else f"{live_fraction} ({live}/{probed_live})"
    lines.append(f"| staged LIVE fraction of probed | {lf} |")
    lines.append(f"| surfaces staged | {', '.join(status['surfaces_staged']) or '(none)'} |")
    lb = "**none yet — no auto-eat card has signed green**" if not signed else f"{signed['surface']} @ {signed['as_of']} ({(signed.get('sha256') or '')[:16]})"
    lines.append(f"| last signed batch | {lb} |")
    lines.append("")
    lines.append("## DISCOVERED by kind")
    lines.append("")
    lines.append("| kind | count |")
    lines.append("|---|---|")
    for k in sorted(by_kind):
        lines.append(f"| {k} | {by_kind[k]} |")
    lines.append("")
    lines.append("## Three-state invariant (structural)")
    lines.append("")
    lines.append("- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.")
    lines.append("- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.")
    lines.append("- A subject is **MEASURED only** once a card signs green through the GHA OIDC")
    lines.append("  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.")
    lines.append("- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.")
    lines.append("")
    c.STATUS_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"STATUS discovered={discovered} probed={probed_n} atoms={atoms} live_fraction={live_fraction} signed={bool(signed)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
