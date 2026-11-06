#!/usr/bin/env python3
"""Restore the committed OTS manifest when the only thing that moved was its own as_of.

The manifest producer stamps the time it ran. That makes the file differ on every hourly run even
when not one proof, count or row changed - so the loop would commit and push an empty change every
hour, and its "nothing changed" receipt, the line that says the loop ran and found the estate
already true, could never appear. Absence of a real diff is a fact worth printing.

Compares the rebuilt manifest with the committed one, as_of removed from both. Identical: put the
committed bytes back. Different in any other way: leave the rebuild alone, it is the truth.
"""
import json, pathlib, subprocess, sys

repo = pathlib.Path(sys.argv[1])
rel = "public/interop/ots/manifest.json"
r = subprocess.run(["git", "-C", str(repo), "show", f"HEAD:{rel}"], capture_output=True, text=True)
if r.returncode:
    print("no committed manifest to compare against")
    raise SystemExit(0)
new, old = json.loads((repo / rel).read_text()), json.loads(r.stdout)
new.pop("as_of", None)
old.pop("as_of", None)
if new == old:
    subprocess.run(["git", "-C", str(repo), "checkout", "--", rel], check=True)
    print("manifest identical apart from as_of; committed bytes restored")
else:
    print("manifest changed for a real reason; the rebuild stands")
