# SPDX-License-Identifier: Apache-2.0
"""Synthetic wire fixtures; these tests perform no scanner run or remote tool call."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import pytest
import event as E
from ingest import cisco_mcp_in

BASE = {"server_url": "https://example.invalid/mcp", "requested_analyzers": ["yara", "llm"],
        "scan_results": [{"item_type": "tool", "tool_name": "owned_fixture", "status": "completed",
                          "is_safe": False, "findings": {"yara_analyzer": {"severity": "HIGH", "total_findings": 1,
                          "threats": {"items": [{"technique_id": "fixture-technique"}]}}}}]}


def ingest(doc):
    return cisco_mcp_in.ingest(json.dumps(doc).encode(), read_at="2026-10-29T00:00:00Z", scanner_version="fixture-version")


@pytest.mark.parametrize("safe,status", [(True, "completed"), (False, "completed"), (True, "error"), (False, "skipped")])
def test_scanner_flags_and_status_never_become_permission_or_measurement(safe, status):
    doc = copy.deepcopy(BASE)
    doc["scan_results"][0].update(is_safe=safe, status=status)
    ev = ingest(doc)[0]
    assert ev["state"] == "UNMEASURED" and ev["value"] is None
    assert ev["observed"] == {"re_observed": False}
    assert ev["negative_control"]["got"] == "NOT_RUN"
    assert ev["declared"]["result"] == doc["scan_results"][0]
    assert E.validate(ev) == []


def test_nested_findings_requested_analyzers_and_source_bytes_are_retained():
    doc = copy.deepcopy(BASE)
    raw = json.dumps(doc).encode()
    ev = cisco_mcp_in.ingest(raw, read_at="2026-10-29T00:00:00Z", scanner_version="fixture-version")[0]
    assert ev["claim"]["source_sha256"] == hashlib.sha256(raw).hexdigest()
    assert ev["declared"]["requested_analyzers"] == ["yara", "llm"]
    assert ev["declared"]["result"]["findings"] == BASE["scan_results"][0]["findings"]
    assert doc == BASE


def test_tool_prompt_resource_and_empty_results_keep_their_scope():
    doc = copy.deepcopy(BASE)
    doc["scan_results"] += [{"item_type": "prompt", "prompt_name": "fixture", "status": "completed", "is_safe": True, "findings": {}},
                            {"item_type": "resource", "resource_uri": "file://fixture", "status": "completed", "is_safe": True, "findings": {}}]
    events = ingest(doc)
    assert [e["declared"]["result"]["item_type"] for e in events] == ["tool", "prompt", "resource"]
    assert len({e["event_id"] for e in events}) == 3
    doc["scan_results"] = []
    empty = ingest(doc)
    assert len(empty) == 1 and empty[0]["state"] == "UNMEASURED"
    assert empty[0]["declared"]["result"] is None and empty[0]["declared"]["result_count"] == 0


@pytest.mark.parametrize("doc", [[], {"/private/config": []}, {"scan_results": []},
                                {**BASE, "scan_results": {}}, {**BASE, "requested_analyzers": "yara"},
                                {**BASE, "server_url": ""}])
def test_wrong_envelope_is_rejected(doc):
    with pytest.raises(ValueError):
        ingest(doc)


@pytest.mark.parametrize("field,value", [("is_safe", "true"), ("is_safe", 1), ("findings", []), ("status", None)])
def test_malformed_results_are_not_silently_skipped(field, value):
    doc = copy.deepcopy(BASE)
    doc["scan_results"][0][field] = value
    with pytest.raises(ValueError):
        ingest(doc)


def test_version_cannot_be_invented():
    with pytest.raises(ValueError):
        cisco_mcp_in.ingest(json.dumps(BASE).encode(), read_at="2026-10-29T00:00:00Z", scanner_version="")


def test_cli_invalid_later_result_emits_nothing(tmp_path):
    doc = copy.deepcopy(BASE)
    doc["scan_results"].append({"status": "completed", "findings": {}})
    path = tmp_path / "report.json"
    path.write_text(json.dumps(doc))
    script = Path(__file__).resolve().parents[1] / "ingest/cisco_mcp_in.py"
    result = subprocess.run([sys.executable, str(script), str(path), "--read-at", "2026-10-29T00:00:00Z",
                             "--scanner-version", "fixture-version"], capture_output=True, text=True)
    assert result.returncode == 2 and result.stdout == ""
