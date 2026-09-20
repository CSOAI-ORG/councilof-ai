#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, tempfile
from pathlib import Path
from lib.measurement_bundle import build, canonical_bytes, merkle_root

def main():
    with tempfile.TemporaryDirectory() as td:
        root=Path(td)
        rows=[{"id":"a","value":1},{"id":"b","value":2},{"id":"c","value":3}]
        (root/"rows.json").write_text(json.dumps({"rows":rows}))
        spec={"cohort_id":"test","subject_kind":"fixture","as_of":"2026-09-20T00:00:00Z","status":"PARTIAL_MEASURED",
              "evidence":[{"path":"rows.json","rows_pointer":"rows"}],"unmeasured":["x"],
              "population":{"declared":3},"dispositions":{"MEASURED":3}}
        manifest,compact=build(spec,root)
        leaves=[hashlib.sha256(canonical_bytes(x)).hexdigest() for x in rows]
        assert manifest["atomic_count"]==3
        assert manifest["atomic_merkle_root"]==merkle_root(leaves)
        assert compact["measurement"]["atomic_merkle_root"]==manifest["atomic_merkle_root"]
        assert compact["measurement"]["manifest_sha256"]==manifest["manifest_sha256"]
        assert compact["n"]==3
        assert len(canonical_bytes(compact))<3072
        # Any row mutation changes both atomic root and manifest digest.
        rows[1]["value"]=200
        (root/"rows.json").write_text(json.dumps({"rows":rows}))
        m2,c2=build(spec,root)
        assert m2["atomic_merkle_root"]!=manifest["atomic_merkle_root"]
        assert m2["manifest_sha256"]!=manifest["manifest_sha256"]
        assert c2["measurement"]["manifest_sha256"]!=compact["measurement"]["manifest_sha256"]
    print("measurement bundle tests: PASS")
if __name__=="__main__": main()
