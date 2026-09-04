#!/usr/bin/env python3
"""Does every .ots in the tree cover the file it names?

Written 2026-09-04 after the atom root was found to have been stamping bytes it never
wrote — `<root>.json.ots` committed to sha256(canonical(body minus leaves)) while the
file on disk was the pretty-printed body WITH leaves. Not one atom root's proof had ever
covered its own file, and two of those stamps reached Bitcoin block 965312, producing
genuine attestations over bytes that exist nowhere. An anchor over bytes nobody has is
worse than no anchor, because it reads as proof.

A NOTE ON FALSE ALARMS, because the first version of this audit raised one. A naive run
reports ~1,589 proofs "with no target file" and looks catastrophic. It is not: the estate
uses TWO naming conventions and only one of them implies a sibling file.

  digest-named   012a61feb4e723eb.ots, root-728e8c5e.json.ots
                 The name IS the digest the proof commits to. Self-describing, no file
                 expected, not a defect. 1,580 of them.
  file-named     atom-root-2026-09-04.json.ots
                 Asserts it is a detached proof OF the file beside it. Every OTS tool
                 will compare the two, so this one must cover.

Classifying the first kind as broken is how a guard gets switched off. Check the name
before you judge the proof.

    python3 scripts/ots-coverage-audit.py            # audit the tree
    python3 scripts/ots-coverage-audit.py --served   # only public/, the bytes strangers get
"""
import collections
import hashlib
import pathlib
import re
import sys

from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
from opentimestamps.core.serialize import BytesDeserializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile

FILE_NAMED = re.compile(r"\.(json|jsonl|txt|md|csv|pdf|png)\.ots$")
DIGEST_NAMED = re.compile(r"(^|[-/])[0-9a-f]{8,64}\.(json\.)?ots$")


def classify(ots: pathlib.Path):
    blob = ots.read_bytes()
    try:
        d = DetachedTimestampFile.deserialize(BytesDeserializationContext(blob))
    except Exception:
        # A plain-text "OTS PENDING" marker with a .ots extension is not a proof. 44 of
        # these existed; all were quarantined out of the served tree before this audit.
        return "STUB", None, None
    btc = [a.height for _, a in d.timestamp.all_attestations()
           if isinstance(a, BitcoinBlockHeaderAttestation)]
    anchor = f"btc:{btc[0]}" if btc else "pending"
    if DIGEST_NAMED.search(ots.name):
        return "DIGEST-NAMED", anchor, None
    if not FILE_NAMED.search(str(ots)):
        return "OTHER", anchor, None
    target = pathlib.Path(str(ots)[:-4])
    if not target.exists():
        return "NAMES-ABSENT-FILE", anchor, d.file_digest.hex()
    actual = hashlib.sha256(target.read_bytes()).hexdigest()
    if actual == d.file_digest.hex():
        return "COVERS", anchor, actual
    return "ORPHANED", anchor, f"{actual[:12]}!={d.file_digest.hex()[:12]}"


def main() -> int:
    served_only = "--served" in sys.argv
    base = pathlib.Path("public") if served_only else pathlib.Path(".")
    counts = collections.Counter()
    bad = []
    for ots in sorted(base.rglob("*.ots")):
        p = str(ots)
        if "node_modules" in p or p.startswith("dist/"):
            continue
        state, anchor, note = classify(ots)
        counts[state] += 1
        if state in ("ORPHANED", "STUB", "NAMES-ABSENT-FILE"):
            bad.append((state, p, anchor or "", note or ""))
    scope = "public/ (what strangers get)" if served_only else "the tree"
    print(f"{sum(counts.values())} .ots in {scope}\n")
    for k, v in counts.most_common():
        print(f"  {v:5d}  {k}")
    if bad:
        print()
        for state, p, anchor, note in bad:
            print(f"  {state:18s} {p}  {anchor}  {note}")
    # ORPHANED is the only unambiguous failure: the file is right there and disagrees.
    return 1 if counts["ORPHANED"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
