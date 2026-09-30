#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Regenerate golden files from tests/fixtures/events.jsonl. Run only on purpose; review the diff."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import event as E  # noqa: E402
from render import ocsf, otel, sarif, intoto, ecs_hec, w3c_acr01  # noqa: E402

evs = E.read_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"))
G = os.path.join(HERE, "golden")
os.makedirs(G, exist_ok=True)
dump = lambda o: json.dumps(o, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
open(os.path.join(G, "ocsf.json"), "w").write(dump([ocsf.render(e) for e in evs]))
open(os.path.join(G, "otel.json"), "w").write(dump(otel.render_batch(evs)))
open(os.path.join(G, "sarif.json"), "w").write(dump(sarif.render_batch(evs)))
open(os.path.join(G, "intoto.json"), "w").write(dump([intoto.statement(e) for e in evs]))
open(os.path.join(G, "hec.ndjson"), "w").write("".join(json.dumps(ecs_hec.hec(e), ensure_ascii=False, sort_keys=True) + "\n" for e in evs))
FX = os.path.join(HERE, "fixtures", "safe-pack")
rb = lambda n: open(os.path.join(FX, n), "rb").read()
raw = rb("events.jsonl")
sev = [json.loads(l) for l in raw.decode().splitlines() if l.strip()]
open(os.path.join(G, "w3c_acr01.safe-events.json"), "w").write(w3c_acr01.dump(w3c_acr01.events_report(
    sev, raw, json.loads(rb("causes.json"))["causes"], source_ref="docs/standards/osaia-safe-evidence-pack/events/events.jsonl")))
open(os.path.join(G, "w3c_acr01.safe-signature.json"), "w").write(w3c_acr01.dump(w3c_acr01.signature_report(
    rb("FREEZE.json"), rb("FREEZE.signed.json"), rb("did.json"), "docs/standards/osaia-safe-evidence-pack/FREEZE.json")))
print("golden regenerated")
