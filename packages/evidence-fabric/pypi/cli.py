# SPDX-License-Identifier: Apache-2.0
"""csoai-evidence: one command for the evidence fabric.

    csoai-evidence validate EVENTS.jsonl
    csoai-evidence payload MEMBER EVENTS.jsonl --as-of <UTC>
    csoai-evidence verify BATCH.json BATCH.signed.json EVENTS.jsonl --did did.json [--tamper-control]
    csoai-evidence verify --structure RECORD.json|EVENTS.jsonl
    csoai-evidence verify-safe-freeze FREEZE.json --signed FREEZE.signed.json --did did.json
    csoai-evidence render {ocsf,otel,sarif,intoto,ecs-hec,w3c-acr01} EVENTS.jsonl [...]
    csoai-evidence ingest {sarif,garak,safe,openshell} INPUT [...]
    csoai-evidence batch DIR --member NAME --as-of <UTC>
"""
import importlib, sys

RENDER = {"ocsf": "ocsf", "otel": "otel", "sarif": "sarif", "intoto": "intoto", "ecs-hec": "ecs_hec", "w3c-acr01": "w3c_acr01"}
INGEST = {"sarif": "sarif_in", "garak": "garak_in", "safe": "safe_in", "openshell": "openshell_in"}


def _run(mod, argv):
    rc = importlib.import_module("csoai_evidence_fabric." + mod).main(argv)
    return rc if isinstance(rc, int) else 0


def main(argv=None):
    a = list(sys.argv[1:] if argv is None else argv)
    if not a or a[0] in ("-h", "--help"):
        print(__doc__); return 0 if a else 2
    if a[0] == "--version":
        from csoai_evidence_fabric import __version__
        print(__version__); return 0
    cmd, rest = a[0], a[1:]
    if cmd in ("validate", "payload"):
        return _run("event", a)
    if cmd == "verify":
        return _run("verify", rest)
    if cmd == "verify-safe-freeze":
        return _run("safe_freeze_v2", rest)
    if cmd == "batch":
        return _run("batch", rest)
    table = RENDER if cmd == "render" else INGEST if cmd == "ingest" else None
    if table is None or not rest or rest[0] not in table:
        print(__doc__); return 2
    sub = "render." if cmd == "render" else "ingest."
    return _run(sub + table[rest[0]], rest[1:])


if __name__ == "__main__":
    sys.exit(main())
