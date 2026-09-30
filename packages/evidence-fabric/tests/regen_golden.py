#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Regenerate golden files from tests/fixtures/events.jsonl. Run only on purpose; review the diff."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import event as E  # noqa: E402
from render import ocsf, otel, sarif, intoto, ecs_hec  # noqa: E402

evs = E.read_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"))
G = os.path.join(HERE, "golden")
os.makedirs(G, exist_ok=True)
dump = lambda o: json.dumps(o, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
open(os.path.join(G, "ocsf.json"), "w").write(dump([ocsf.render(e) for e in evs]))
open(os.path.join(G, "otel.json"), "w").write(dump(otel.render_batch(evs)))
open(os.path.join(G, "sarif.json"), "w").write(dump(sarif.render_batch(evs)))
open(os.path.join(G, "intoto.json"), "w").write(dump([intoto.statement(e) for e in evs]))
open(os.path.join(G, "hec.ndjson"), "w").write("".join(json.dumps(ecs_hec.hec(e), ensure_ascii=False, sort_keys=True) + "\n" for e in evs))
print("golden regenerated")
