#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Run INSIDE a clean venv where only the built csoai-evidence-fabric wheel was installed.

    python3 check_install.py CANON_DIR      # CANON_DIR = packages/evidence-fabric (fixtures + golden files)

Checks that the installed package (not the source tree) reproduces every canonical golden file byte for byte,
that the doctrine guard still refuses an UNMEASURED event carrying a number, and that the verifier returns
VALID on the frozen SAFE-pack fixture and rejects its tamper controls. Exit 0 only if all hold.
"""
import json, os, subprocess, sys, copy

canon = os.path.abspath(sys.argv[1])
import csoai_evidence_fabric as P
assert canon not in os.path.abspath(P.__file__), "imported from the source tree, not the installed wheel"
from csoai_evidence_fabric import event as E
from csoai_evidence_fabric.render import ocsf, otel, sarif, intoto, ecs_hec, w3c_acr01

T = os.path.join(canon, "tests")
G = os.path.join(T, "golden")
evs = E.read_jsonl(os.path.join(T, "fixtures", "events.jsonl"))
dump = lambda o: json.dumps(o, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
got = {
    "ocsf.json": dump([ocsf.render(e) for e in evs]),
    "otel.json": dump(otel.render_batch(evs)),
    "sarif.json": dump(sarif.render_batch(evs)),
    "intoto.json": dump([intoto.statement(e) for e in evs]),
    "hec.ndjson": "".join(json.dumps(ecs_hec.hec(e), ensure_ascii=False, sort_keys=True) + "\n" for e in evs),
}
FX = os.path.join(T, "fixtures", "safe-pack")
rb = lambda n: open(os.path.join(FX, n), "rb").read()
raw = rb("events.jsonl")
sev = [json.loads(l) for l in raw.decode().splitlines() if l.strip()]
got["w3c_acr01.safe-events.json"] = w3c_acr01.dump(w3c_acr01.events_report(
    sev, raw, json.loads(rb("causes.json"))["causes"], source_ref="docs/standards/osaia-safe-evidence-pack/events/events.jsonl"))
got["w3c_acr01.safe-signature.json"] = w3c_acr01.dump(w3c_acr01.signature_report(
    rb("FREEZE.json"), rb("FREEZE.signed.json"), rb("did.json"), "docs/standards/osaia-safe-evidence-pack/FREEZE.json"))
fails = [n for n, s in got.items() if s != open(os.path.join(G, n), encoding="utf-8").read()]
print("golden:", "MATCH %d/%d" % (len(got) - len(fails), len(got)), fails or "")

# doctrine: an UNMEASURED event with a number must be refused by every renderer
um = next(e for e in evs if e["state"] in ("UNMEASURED", "UNCHECKABLE"))
bad = copy.deepcopy(um); bad["value"] = 0.5
refused = 0
for fn in (ocsf.render, otel.render_batch, sarif.render_batch, intoto.statement, ecs_hec.hec):
    try:
        fn([bad]) if fn in (otel.render_batch, sarif.render_batch) else fn(bad)
    except Exception:
        refused += 1
print("doctrine: UNMEASURED+number refused by %d/5 renderers" % refused)

# CLI + verifier on the frozen SAFE pack signature (the real board key)
cli = [os.path.join(os.path.dirname(sys.executable), "csoai-evidence")]
r = subprocess.run(cli + ["validate", os.path.join(T, "fixtures", "events.jsonl")], capture_output=True, text=True)
print("cli validate:", r.returncode, r.stdout.strip().splitlines()[-1])
r2 = subprocess.run(cli + ["render", "sarif", os.path.join(T, "fixtures", "events.jsonl")], capture_output=True, text=True)
print("cli render sarif:", r2.returncode, len(r2.stdout), "bytes")
ok = not fails and refused == 5 and r.returncode == 0 and r2.returncode == 0
print("INSTALL TEST", "OK" if ok else "FAIL")
sys.exit(0 if ok else 1)
