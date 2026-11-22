# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""The optional capsule 0.3 `provisions` binding, taken from the committed backfill map and nothing else.

A capsule is bound only when public/mechanism/capsule-provision-map.json maps its producer: a mapping with
source "adapter" matches the adapter name (held in the mapping's `kind`, as the map's own test reads it), and a
mapping with source "route" matches the capsule's `kind`. An adapter the map lists as unmapped, or does not
list at all, yields no binding, and its capsules stay byte-for-byte 0.2 capsules.

Each binding pins the provision of the frozen manifest (public/interop/frozen-provision-hashes.json): its id,
the manifest anchor and the manifest's corpus root. check_binding() repeats the shape rules of
public/measurement-capsules/capsule-provisions-0.3.schema.json and the pin rules of
functions/_lib/provisionBinding.ts (checkProvisionBinding). A pinned binding names a provision; it is not a
finding that the capsule measures what the provision requires, and never a compliance determination.
"""
import json
import pathlib
import re

SCHEMA_02 = "csoai.measurement-capsule/0.2"
SCHEMA_03 = "csoai.measurement-capsule/0.3"
REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
MAP_PATH = "public/mechanism/capsule-provision-map.json"
MANIFEST_PATH = "public/interop/frozen-provision-hashes.json"
PROVISION_ID_RE = re.compile(r"^3\d{4}[RLD]\d{4}:-?\d+$")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
RELATIONS = ("PREDICATE", "RELEVANT_TO")
BINDING_KEYS = ("corpus_root", "provision_id", "provision_sha256", "relation")
MAX_BINDINGS = 64


def load(root=None):
    """(map, manifest) from the repo, or (None, None) when the map is not present (a standalone install)."""
    root = pathlib.Path(root) if root else REPO_ROOT
    mp, mf = root / MAP_PATH, root / MANIFEST_PATH
    if not mp.exists() or not mf.exists():
        return None, None
    pmap, manifest = json.loads(mp.read_text()), json.loads(mf.read_text())
    if pmap.get("corpus_root") != manifest.get("corpus_root"):
        raise ValueError("PROVISION_MAP_NOT_PINNED: map corpus_root is not the frozen manifest's root")
    for m in pmap.get("mappings", []):
        if manifest["anchors"].get(m["provision_id"]) != m["provision_sha256"]:
            raise ValueError(f"PROVISION_MAP_NOT_PINNED: {m['provision_id']} hash is not the manifest anchor")
    return pmap, manifest


def classify(adapter, pmap):
    """MAPPED, UNMAPPED (listed with a reason) or UNCLASSIFIED (the map does not name the adapter)."""
    if pmap is None:
        return "MAP_ABSENT"
    if any(m["source"] == "adapter" and m["kind"] == adapter for m in pmap.get("mappings", [])):
        return "MAPPED"
    if any(u["adapter"] == adapter for u in pmap.get("unmapped_adapters", [])):
        return "UNMAPPED"
    return "UNCLASSIFIED"


def bindings_for(adapter, kind, pmap, manifest):
    """The binding rows the map gives a capsule of this adapter and kind, sorted; [] when none."""
    if pmap is None:
        return []
    rows = {}
    for m in pmap.get("mappings", []):
        if (m["source"] == "adapter" and m["kind"] == adapter) or (m["source"] == "route" and m["kind"] == kind):
            anchor = manifest["anchors"].get(m["provision_id"])
            if anchor is None:
                raise ValueError(f"PROVISION_MAP_NOT_PINNED: {m['provision_id']} is not in the frozen manifest")
            row = {"corpus_root": manifest["corpus_root"], "provision_id": m["provision_id"],
                   "provision_sha256": anchor, "relation": m["relation"]}
            rows[(row["provision_id"], row["relation"])] = row
    return [rows[k] for k in sorted(rows)]


def check_binding(provisions, capsule_schema, manifest):
    """(state, problems): PINNED, NOT_PINNED, MALFORMED or SCHEMA_MISMATCH, as checkProvisionBinding answers."""
    if capsule_schema != SCHEMA_03:
        return "SCHEMA_MISMATCH", [f"a provisions binding is defined only for {SCHEMA_03}, not {capsule_schema}"]
    if not isinstance(provisions, list) or not provisions:
        return "MALFORMED", ["provisions must be a non-empty list"]
    if len(provisions) > MAX_BINDINGS:
        return "MALFORMED", [f"provisions holds more than {MAX_BINDINGS} entries"]
    shape, pin, seen = [], [], set()
    for i, b in enumerate(provisions):
        at = f"provisions[{i}]"
        if not isinstance(b, dict):
            shape.append(f"{at} is not an object")
            continue
        if tuple(sorted(b)) != BINDING_KEYS:
            shape.append(f"{at} must carry exactly {', '.join(BINDING_KEYS)}")
        pid = b.get("provision_id")
        if not isinstance(pid, str) or not PROVISION_ID_RE.match(pid):
            shape.append(f"{at}.provision_id is not CELEX:number")
            continue
        for k in ("provision_sha256", "corpus_root"):
            if not isinstance(b.get(k), str) or not HEX64.match(b[k]):
                shape.append(f"{at}.{k} is not 64 lowercase hex")
        if b.get("relation") not in RELATIONS:
            shape.append(f"{at}.relation must be PREDICATE or RELEVANT_TO")
        key = (pid, b.get("relation"))
        if key in seen:
            shape.append(f"{at} repeats {pid} with relation {b.get('relation')}")
        seen.add(key)
        if manifest["anchors"].get(pid) is None:
            pin.append(f"{at}: {pid} is not in the frozen manifest")
        elif b.get("provision_sha256") != manifest["anchors"][pid]:
            pin.append(f"{at}: provision_sha256 is not the manifest anchor for {pid}")
        if b.get("corpus_root") != manifest["corpus_root"]:
            pin.append(f"{at}: corpus_root is not the manifest's root")
    if shape:
        return "MALFORMED", shape + pin
    if pin:
        return "NOT_PINNED", pin
    return "PINNED", []
