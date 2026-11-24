#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Adversarial multiplicity and content-integrity regression on REAL retained OpenShell OTel files."""
from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "examples" / "openshell-otel"
SENT = EXAMPLE / "data" / "openshell.otlp.json"
READBACK = EXAMPLE / "data" / "readback-otelcol-contrib-v0.162.0.jsonl"
CHECKER = EXAMPLE / "check.py"

spec = importlib.util.spec_from_file_location("openshell_readback_check", CHECKER)
check = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = check
spec.loader.exec_module(check)


def write_sent(tmp_path, document):
    path = tmp_path / "sent.json"
    path.write_text(json.dumps(document))
    return path


def write_back(tmp_path, documents):
    path = tmp_path / "readback.jsonl"
    path.write_text("".join(json.dumps(d) + "\n" for d in documents))
    return path


def sent_doc():
    return json.loads(SENT.read_text())


def back_docs():
    return [json.loads(s) for s in READBACK.read_text().splitlines() if s.strip()]


def log_records(doc):
    return doc["resourceLogs"][0]["scopeLogs"][0]["logRecords"]


def event_id_attribute(record):
    return next(x for x in record["attributes"] if x["key"] == "csoai.event_id")


def test_actual_retained_three_records_and_digests_are_exact():
    assert hashlib.sha256(SENT.read_bytes()).hexdigest() == "619aa1ad4b36e8b65e8d61bb73e85b7344ce68b28116a861eb28a7f571dbef20"
    assert hashlib.sha256(READBACK.read_bytes()).hexdigest() == "50f285547fa91384eb722c89f4c33774d664da2cbd1021fa8a79143c31935241"
    x = check.compare(SENT, READBACK)
    assert x["result"] == "IDENTICAL"
    assert x["records_sent"] == x["records_read_back"] == 3
    assert x["unique_sent_event_ids"] == x["unique_readback_event_ids"] == 3
    assert len(x["records"]) == 3
    assert sum(z["state"] == "DIVERGENT" for z in x["records"]) == 1
    assert x["runtime_effectiveness_verified"] is False
    assert x["collector_record_content_independently_verified"] is False


def test_duplicate_entire_readback_is_no_longer_identical(tmp_path):
    p = tmp_path / "duplicated.jsonl"
    p.write_bytes(READBACK.read_bytes() + b"\n" + READBACK.read_bytes())
    x = check.compare(SENT, p)
    assert x["result"] == "MISMATCH"
    assert x["records_read_back"] == 6
    assert len(x["duplicate_readback_event_ids"]) == 3


def test_duplicate_sent_record_is_no_longer_identical(tmp_path):
    d = sent_doc()
    log_records(d).append(copy.deepcopy(log_records(d)[0]))
    x = check.compare(write_sent(tmp_path, d), READBACK)
    assert x["result"] == "MISMATCH"
    assert x["records_sent"] == 4
    assert len(x["duplicate_sent_event_ids"]) == 1


def test_unexpected_extra_readback_record_is_no_longer_identical(tmp_path):
    docs = back_docs()
    extra = copy.deepcopy(docs[0])
    extra["resourceLogs"][0]["scopeLogs"][0]["logRecords"] = [copy.deepcopy(log_records(extra)[0])]
    event_id_attribute(log_records(extra)[0])["value"]["stringValue"] = "sha256:" + "f" * 64
    docs.append(extra)
    x = check.compare(SENT, write_back(tmp_path, docs))
    assert x["result"] == "MISMATCH"
    assert x["records_read_back"] == 4
    assert x["unexpected_event_ids"] == ["sha256:" + "f" * 64]


def test_missing_readback_record_is_not_success(tmp_path):
    docs = back_docs()
    log_records(docs[0]).pop()
    x = check.compare(SENT, write_back(tmp_path, docs))
    assert x["result"] == "MISMATCH"
    assert len(x["missing_event_ids"]) >= 1


@pytest.mark.parametrize("field,replacement", [
    ("eventName", "gen_ai.evaluation.changed"),
    ("timeUnixNano", "999999999"),
])
def test_changed_log_field_is_detected(tmp_path, field, replacement):
    docs = back_docs()
    log_records(docs[0])[0][field] = replacement
    x = check.compare(SENT, write_back(tmp_path, docs))
    assert x["result"] == "MISMATCH"
    assert x["changed_event_ids"]


def test_changed_attribute_detected(tmp_path):
    docs = back_docs()
    r = log_records(docs[0])[0]
    target = next(x for x in r["attributes"] if x["key"] == "gen_ai.evaluation.score.label")
    target["value"]["stringValue"] = "UNKNOWN"
    x = check.compare(SENT, write_back(tmp_path, docs))
    assert x["result"] == "MISMATCH"
    assert x["changed_event_ids"]


def test_duplicate_attribute_key_rejected_as_ambiguous(tmp_path):
    docs = back_docs()
    r = log_records(docs[0])[0]
    r["attributes"].append(copy.deepcopy(r["attributes"][0]))
    with pytest.raises(check.Uncheckable, match="duplicate OTLP attribute key"):
        check.compare(SENT, write_back(tmp_path, docs))


def test_multi_type_attribute_rejected(tmp_path):
    docs = back_docs()
    target = log_records(docs[0])[0]["attributes"][0]["value"]
    target["boolValue"] = True
    with pytest.raises(check.Uncheckable, match="missing/ambiguous OTLP value"):
        check.compare(SENT, write_back(tmp_path, docs))


def test_bad_or_missing_event_id_rejected(tmp_path):
    docs = back_docs()
    event_id_attribute(log_records(docs[0])[0])["value"]["stringValue"] = "invalid!"
    with pytest.raises(check.Uncheckable, match="invalid csoai.event_id"):
        check.compare(SENT, write_back(tmp_path, docs))


def test_missing_timestamp_refused(tmp_path):
    docs = back_docs()
    del log_records(docs[0])[0]["timeUnixNano"]
    with pytest.raises(check.Uncheckable, match="timestamp"):
        check.compare(SENT, write_back(tmp_path, docs))


def test_wrong_shape_is_not_interpreted_as_empty(tmp_path):
    with pytest.raises(check.Uncheckable, match="resourceLogs"):
        check.records({"something": []})


def test_empty_collector_is_uncheckable(tmp_path):
    p = tmp_path / "empty"
    p.write_bytes(b"\n")
    with pytest.raises(check.Uncheckable, match="empty collector"):
        check.compare(SENT, p)


def test_malformed_collector_is_uncheckable(tmp_path):
    p = tmp_path / "corrupt"
    p.write_bytes(b"{invalid\n")
    with pytest.raises(check.Uncheckable, match="malformed collector"):
        check.compare(SENT, p)


def test_reverse_order_preserves_identity(tmp_path):
    docs = list(reversed(back_docs()))
    x = check.compare(SENT, write_back(tmp_path, docs))
    assert x["result"] == "IDENTICAL"
    assert x["records_read_back"] == 3


def test_flat_helper_refuses_duplicates(tmp_path):
    d = sent_doc()
    log_records(d).append(copy.deepcopy(log_records(d)[0]))
    with pytest.raises(check.Uncheckable, match="duplicate csoai.event_id"):
        check.flat(d)


def test_cli_retained_is_green(tmp_path):
    x = subprocess.run([sys.executable, str(CHECKER), str(SENT), str(READBACK)],
                       capture_output=True, text=True)
    assert x.returncode == 0, x.stderr
    assert json.loads(x.stdout)["result"] == "IDENTICAL"


def test_cli_duplicated_is_red(tmp_path):
    p = tmp_path / "dup.jsonl"
    p.write_bytes(READBACK.read_bytes() + b"\n" + READBACK.read_bytes())
    x = subprocess.run([sys.executable, str(CHECKER), str(SENT), str(p)],
                       capture_output=True, text=True)
    assert x.returncode == 1
    assert json.loads(x.stdout)["result"] == "MISMATCH"


def test_cli_malformed_is_explicitly_uncheckable(tmp_path):
    p = tmp_path / "invalid.jsonl"
    p.write_text("invalid json")
    x = subprocess.run([sys.executable, str(CHECKER), str(SENT), str(p)],
                       capture_output=True, text=True)
    assert x.returncode == 2
    assert json.loads(x.stdout)["result"] == "UNCHECKABLE"


def test_no_model_call_or_live_party_conclusion():
    x = check.compare(SENT, READBACK)
    assert x["collector_record_content_independently_verified"] is False
    assert x["source_capture_signature_verified"] is False
    assert x["runtime_effectiveness_verified"] is False
    assert all(z["identical"] is True for z in x["records"])
