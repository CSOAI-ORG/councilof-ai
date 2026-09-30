# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""mill_cross_runtime: the existing path, unchanged. Runtime declarations -> capsule_from_mill_decl.

The first signed batch (v0.1, /evac-bulk/venturi-capsules-2026-09-26, merkle d70de242...) was built by the v0.1
`build --src` path; capsule_from_mill_decl serialises exactly as it did then, only the schema string is v0.2.
"""
import datetime, glob, json, pathlib
import venturi_capsule as v

NAME = "mill_cross_runtime"
KIND = "measurement.cross_runtime_reproduction"


def capsules(src, stats, aux=None):
    observed_at = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    files = sorted(glob.glob(str(pathlib.Path(src) / "decl" / "runtime-declaration-*.json")))
    stats["n_declarations"] = len(files)
    stats["decl_sha256"] = {pathlib.Path(f).name: v.file_sha(f) for f in files}
    for f in files:
        with open(f) as fh:
            yield v.capsule_from_mill_decl(json.load(fh), observed_at)


def meta(src, stats):
    return {"what_this_is": "Cross-runtime reproduction of signed mill cards: same model digest, instrument and bank on two runtimes.",
            "what_this_is_not": "Not a grade of the model or of any runtime vendor. It measures whether each card's result survived a change of runtime, item by item.",
            "source": {"declarations_dir": str(pathlib.Path(src) / "decl"), "declarations": stats.get("n_declarations"),
                       "declarations_sha256": stats.get("decl_sha256")}}
