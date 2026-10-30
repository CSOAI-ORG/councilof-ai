"""Create-only guard for the card-root build step.

New root + OTS sidecar must be untracked (create-only). The single tracked
discovery pointer public/interop/card-root-latest.json may be modified (or
created), but only when it points at exactly the newly created root bytes.
Anything else -- a modified root/proof, a second modified path, a pointer to a
different file -- is refused.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

POINTER = "public/interop/card-root-latest.json"
ROOT_RE = re.compile(r"public/interop/card-root-[0-9]{4}-[0-9]{2}-[0-9]{2}(?:-[a-f0-9]{12})?\.json")


class GuardError(SystemExit):
    pass


def check(rows: list[str], repo: Path) -> dict | None:
    """Return {'root','proof','pointer'} for a valid change set, None if nothing changed."""
    if not rows:
        return None
    new, pointer = [], None
    for row in rows:
        state, name = row[:2], row[3:]
        if name == POINTER and state in (" M", "??"):
            pointer = name
        elif state == "??":
            new.append(name)
        else:
            raise GuardError(f"refusing to modify an existing card root or OTS proof: {row!r}")
    names = sorted(new)
    roots = [n for n in names if n.endswith(".json")]
    proofs = [n for n in names if n.endswith(".json.ots")]
    if len(roots) != 1 or proofs != [roots[0] + ".ots"] or len(names) != 2:
        raise GuardError(f"expected one new exact root/proof pair, got {names}")
    root = roots[0]
    if not ROOT_RE.fullmatch(root):
        raise GuardError(f"unexpected root path: {root}")
    if pointer is None:
        raise GuardError("new root without an updated discovery pointer")
    doc = json.loads((repo / POINTER).read_bytes())
    name = Path(root).name
    want = {
        "root_url": f"/interop/{name}",
        "root_sha256": hashlib.sha256((repo / root).read_bytes()).hexdigest(),
        "ots_url": f"/interop/{name}.ots",
    }
    if doc.get("schema") != "csoai.card-root-pointer/1" or any(doc.get(k) != v for k, v in want.items()):
        raise GuardError(f"discovery pointer does not point at the new root {root}")
    return {"root": root, "proof": proofs[0], "pointer": pointer}
