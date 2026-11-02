# SPDX-License-Identifier: Apache-2.0
"""The existing retained capture must carry policy provenance through the new export."""
import copy
import json
from pathlib import Path
import subprocess
import sys

import pytest
import event as E
from render import openshell_otel, otel

ROOT = Path(__file__).resolve().parents[1]
EVENTS = E.read_jsonl(ROOT / "examples/openshell-otel/data/openshell.events.jsonl")


def records(batch):
    return batch["resourceLogs"][0]["scopeLogs"][0]["logRecords"]


def attributes(record):
    return {item["key"]: item["value"] for item in record["attributes"]}


def test_legacy_renderer_golden_remains_byte_identical():
    evs = E.read_jsonl(ROOT / "tests/fixtures/events.jsonl")
    rendered = (json.dumps(otel.render_batch(evs), ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()
    assert rendered == (ROOT / "tests/golden/otel.json").read_bytes()


def test_retained_capture_preserves_policy_and_every_existing_attribute():
    source = copy.deepcopy(EVENTS)
    old = records(otel.render_batch(source))
    new = records(json.loads(json.dumps(openshell_otel.render_batch(source))))
    assert len(new) == 3
    for ev, before, after in zip(source, old, new):
        a = attributes(after)
        assert attributes(before).items() <= a.items()
        assert a["csoai.policy.input_sha256"]["stringValue"] == ev["subject"]["declared_by"].split(":", 1)[1]
        assert a["csoai.source.sha256"]["stringValue"] == ev["claim"]["source_sha256"]
        assert a["csoai.export.profile"]["stringValue"] == openshell_otel.PROFILE
        assert {k: v for k, v in before.items() if k != "attributes"} == {k: v for k, v in after.items() if k != "attributes"}
        assert "csoai.policy.effective_sha256" not in a
        assert "gen_ai.evaluation.score.value" not in a
    assert source == EVENTS


@pytest.mark.parametrize("reference", [None, "policy sha256:None", "policy sha256:" + "a" * 63, "a" * 64])
def test_missing_or_malformed_policy_cannot_be_exported_as_bound(reference):
    ev = copy.deepcopy(EVENTS[0])
    ev["subject"]["declared_by"] = reference
    ev["event_id"] = E.compute_event_id(ev)
    with pytest.raises(ValueError):
        openshell_otel.render_batch([ev])


def test_a_policy_edit_without_reidentifying_the_event_is_rejected():
    ev = copy.deepcopy(EVENTS[0])
    ev["subject"]["declared_by"] = "policy sha256:" + "a" * 64
    with pytest.raises(E.DoctrineError, match="event_id"):
        openshell_otel.render_batch([ev])


def test_reidentified_policy_change_is_visible_without_changing_effect_digest():
    ev = copy.deepcopy(EVENTS[0])
    before = attributes(records(openshell_otel.render_batch([ev]))[0])
    ev["subject"]["declared_by"] = "policy sha256:" + "b" * 64
    ev["event_id"] = E.compute_event_id(ev)
    after = attributes(records(openshell_otel.render_batch([ev]))[0])
    assert before["csoai.policy.input_sha256"] != after["csoai.policy.input_sha256"]
    assert before["csoai.event_id"] != after["csoai.event_id"]
    assert before["csoai.declared_sha256"] == after["csoai.declared_sha256"]


def test_wrong_instrument_and_missing_report_digest_are_rejected():
    for section, field, value in [("method", "id", "sarif-in"), ("claim", "source_sha256", None)]:
        ev = copy.deepcopy(EVENTS[0])
        ev[section][field] = value
        ev["event_id"] = E.compute_event_id(ev)
        with pytest.raises(ValueError):
            openshell_otel.render_batch([ev])


def test_cli_rejects_invalid_later_row_without_partial_output(tmp_path):
    evs = copy.deepcopy(EVENTS)
    evs[-1]["subject"]["declared_by"] = "policy sha256:None"
    evs[-1]["event_id"] = E.compute_event_id(evs[-1])
    path = tmp_path / "events.jsonl"
    E.write_jsonl(path, evs)
    result = subprocess.run([sys.executable, str(ROOT / "render/openshell_otel.py"), str(path)], capture_output=True, text=True)
    assert result.returncode == 2
    assert result.stdout == ""
    assert "policy sha256" in result.stderr
