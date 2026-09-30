# SPDX-License-Identifier: Apache-2.0
import json, os
import event as E
from ingest import sarif_in
from render import sarif as sarif_out

HERE = os.path.dirname(os.path.abspath(__file__))
T = "2026-09-30T12:00:00Z"


def _triples(doc):
    return [(r.get("ruleId"), json.dumps(r.get("locations"), sort_keys=True), r.get("level"))
            for run in doc["runs"] for r in run["results"]]


def test_sarif_roundtrip_lossless_on_rule_location_level():
    raw = open(os.path.join(HERE, "fixtures", "scanner.fixture.sarif"), "rb").read()
    evs = sarif_in.ingest(raw, read_at=T)
    assert len(evs) == 3 and all(E.validate(e) == [] for e in evs)
    back = sarif_in.export_declared(evs)
    assert _triples(back) == _triples(json.loads(raw))


def test_ingested_findings_are_declared_only():
    raw = open(os.path.join(HERE, "fixtures", "scanner.fixture.sarif"), "rb").read()
    for ev in sarif_in.ingest(raw, read_at=T):
        assert ev["state"] == "UNMEASURED" and ev["value"] is None
        assert ev["method"]["holder"] == "third_party:fixture-scanner"
        assert sarif_out.result(ev)["kind"] == "open"   # re-rendered: could not be determined, never a pass


def test_roundtrip_detects_a_changed_location():
    raw = open(os.path.join(HERE, "fixtures", "scanner.fixture.sarif"), "rb").read()
    evs = sarif_in.ingest(raw, read_at=T)
    evs[1]["declared"]["result"]["locations"][0]["physicalLocation"]["region"]["startLine"] = 5
    assert _triples(sarif_in.export_declared(evs)) != _triples(json.loads(raw))


def test_real_skill_scanner_sarif_roundtrip():
    """cisco-ai-skill-scanner 2.1.0, static analyzers, run on OUR OWN gspc skill (30 Sep 2026): one note-level finding."""
    raw = open(os.path.join(HERE, "fixtures", "skill-scanner-2.1.0.our-gspc-skill.sarif"), "rb").read()
    evs = sarif_in.ingest(raw, read_at=T)
    assert [e["declared"]["result"]["ruleId"] for e in evs] == ["MANIFEST_MISSING_LICENSE"]
    assert _triples(sarif_in.export_declared(evs)) == _triples(json.loads(raw))
