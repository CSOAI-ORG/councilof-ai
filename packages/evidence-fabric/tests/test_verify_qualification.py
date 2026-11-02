"""Receiver checks over actual retained evidence; no SDK, provider or human key."""
import copy
import json
from pathlib import Path
import shutil
import socket
import xml.etree.ElementTree as ET

import pytest

import event as E
import verify_qualification as V

ROOT = Path(__file__).resolve().parents[3]
RECEIPT = ROOT / "harness/authority_adapters/receipts/2026-10-29"
PIN = "fa013956862c27a4c645cc156a8aee44296dad9a223703e5aaedbeac9b275b46"


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    def blocked(*args, **kwargs):
        raise AssertionError("receiver verification must remain offline")
    monkeypatch.setattr(socket.socket, "connect", blocked)
    monkeypatch.setattr(socket, "create_connection", blocked)


@pytest.fixture
def pack(tmp_path):
    path = tmp_path / "pack"
    shutil.copytree(RECEIPT, path)
    return path


def check(pack, pin=PIN, **kwargs):
    return V.verify(pack, expected_manifest_sha256=pin, **kwargs)


def manifest(pack):
    return json.loads((pack / "run-manifest.json").read_text())


def event(pack):
    return json.loads((pack / "evidence-events.jsonl").read_text())


def seal_event(pack, value):
    value["event_id"] = E.compute_event_id(value)
    (pack / "evidence-events.jsonl").write_text(json.dumps(value) + "\n")


def reseal(pack, value):
    """A test receiver deliberately selects new bytes; semantic checks still apply."""
    raw = (json.dumps(value, indent=2) + "\n").encode()
    (pack / "run-manifest.json").write_bytes(raw)
    ev = event(pack)
    ev["observed"]["manifest_sha256"] = V.digest(raw)
    seal_event(pack, ev)
    return V.digest(raw)


def replace_xml(pack, name, edit):
    path = pack / (name + ".xml")
    root = ET.fromstring(path.read_bytes())
    edit(root)
    raw = ET.tostring(root)
    path.write_bytes(raw)
    m = manifest(pack)
    key = "bypass_control" if name == "bypass-control" else name
    m[key]["junit_sha256"] = V.digest(raw)
    m[key]["cases"] = V.xml_cases(raw)
    return m


def test_original_retained_bundle_matches_with_explicit_limits():
    r = check(RECEIPT, source_root=ROOT)
    assert r["status"] == "MATCHED_EXPECTATION"
    assert r["qualification_state"] == "CONSISTENT"
    assert r["source_files"] == "LISTED_BYTES_MATCH"
    assert r["signature"] == "NOT_VERIFIED"
    assert r["human_authority"] == r["production_acceptance"] == "NOT_ESTABLISHED"


def test_source_check_is_explicitly_optional():
    assert check(RECEIPT)["source_files"] == "NOT_CHECKED"


@pytest.mark.parametrize("pin", [None, "", "A" * 64, True])
def test_no_receiver_expectation_cannot_become_a_positive_result(pin):
    assert check(RECEIPT, pin)["status"] == "UNCHECKABLE"


def test_wrong_expected_pin_rejects_even_self_consistent_bundle():
    assert check(RECEIPT, "0" * 64)["status"] == "MISMATCH"


@pytest.mark.parametrize("name", ["acceptance.log", "acceptance.xml", "bypass-control.log", "bypass-control.xml"])
def test_changed_retained_bytes_are_detected(pack, name):
    with (pack / name).open("ab") as stream:
        stream.write(b"changed")
    assert check(pack)["status"] == "MISMATCH"


def test_missing_artifact_stays_uncheckable(pack):
    (pack / "acceptance.log").unlink()
    assert check(pack)["status"] == "UNCHECKABLE"


def test_resealed_event_cannot_change_bound_state(pack):
    ev = event(pack); ev["state"] = "DIVERGENT"; seal_event(pack, ev)
    assert check(pack)["status"] == "MISMATCH"


@pytest.mark.parametrize("field", ["source_sha256", "manifest_sha256"])
def test_resealed_event_cannot_change_evidence_binding(pack, field):
    ev = event(pack); ev["observed"][field] = "0" * 64 if field == "manifest_sha256" else {}
    seal_event(pack, ev)
    assert check(pack)["status"] == "MISMATCH"


def test_resealed_event_cannot_change_method(pack):
    ev = event(pack); ev["method"]["code_sha256"] = "0" * 64; seal_event(pack, ev)
    assert check(pack)["status"] == "MISMATCH"


def test_resealed_event_cannot_change_target(pack):
    ev = event(pack); ev["declared"]["targets"] = []; seal_event(pack, ev)
    assert check(pack)["status"] == "MISMATCH"


def test_boolean_alias_is_not_a_real_control_flag(pack):
    m = manifest(pack); m["control_detected"] = 1
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_reversed_window_is_rejected(pack):
    m = manifest(pack); m["observed_start"], m["observed_end"] = m["observed_end"], m["observed_start"]
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_case_deleted_from_both_junit_and_manifest_is_not_complete(pack):
    m = replace_xml(pack, "acceptance", lambda r:r.find("testsuite").remove(r.find(".//testcase")))
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_failure_relabelled_as_import_error_is_not_discrimination(pack):
    def edit(root):
        root.find(".//failure").tag = "error"
    m = replace_xml(pack, "bypass-control", edit)
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_bypass_without_reported_effect_cannot_claim_detection(pack):
    m = manifest(pack); m["bypass_effect_readback"] = []
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_duplicate_junit_case_rejected_even_with_updated_digest(pack):
    path = pack / "acceptance.xml"; root = ET.fromstring(path.read_bytes())
    root.find("testsuite").append(copy.deepcopy(root.find(".//testcase")))
    raw = ET.tostring(root); path.write_bytes(raw)
    m = manifest(pack); m["acceptance"]["junit_sha256"] = V.digest(raw)
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_duplicate_json_keys_are_rejected(pack):
    raw = (pack / "run-manifest.json").read_text().replace('{', '{"state":"CONSISTENT",', 1).encode()
    (pack / "run-manifest.json").write_bytes(raw)
    assert check(pack, V.digest(raw))["status"] == "MISMATCH"


def test_multiple_events_are_rejected(pack):
    p = pack / "evidence-events.jsonl"; p.write_bytes(p.read_bytes() * 2)
    assert check(pack)["status"] == "MISMATCH"


def test_source_inventory_is_required(pack):
    m = manifest(pack); del m["source_sha256"][V.PREFIX + "core.py"]
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_runtime_version_inventory_is_required(pack):
    m = manifest(pack); del m["versions"]["openai-agents"]
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_manifest_case_identity_must_match_junit(pack):
    m = manifest(pack); m["acceptance"]["cases"][0]["name"] = "a_different_test"
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_source_escape_rejected_without_reading_outside(pack):
    m = manifest(pack); m["source_sha256"]["../secret"] = "0" * 64
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_symlink_artifact_rejected(pack):
    p = pack / "acceptance.log"; raw = p.read_bytes(); p.unlink()
    other = pack.parent / "outside.log"; other.write_bytes(raw); p.symlink_to(other)
    assert check(pack)["status"] == "MISMATCH"


def test_size_bound_applies_before_parsing(pack, monkeypatch):
    monkeypatch.setattr(V, "MAX_BYTES", 16)
    assert check(pack)["status"] == "MISMATCH"


def test_xml_entities_rejected_even_with_updated_digest(pack):
    path = pack / "acceptance.xml"; raw = b'<!DOCTYPE x [<!ENTITY y "foo">]><testsuite/>'
    path.write_bytes(raw); m = manifest(pack); m["acceptance"]["junit_sha256"] = V.digest(raw)
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_utf16_cannot_bypass_xml_declaration_check(pack):
    raw = '<!DOCTYPE x [<!ENTITY y "foo">]><testsuite/>'.encode("utf-16-le")
    path = pack / "acceptance.xml"; path.write_bytes(raw)
    m = manifest(pack); m["acceptance"]["junit_sha256"] = V.digest(raw)
    assert check(pack, reseal(pack, m))["status"] == "MISMATCH"


def test_source_comparison_reads_but_never_imports_received_code(pack, tmp_path):
    source = tmp_path / "source"
    m = manifest(pack)
    for relative in m["source_sha256"]:
        path = source / relative; path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / relative, path)
    target = source / (V.PREFIX + "core.py")
    target.write_text('raise AssertionError("received code was executed")\n')
    r = check(pack, source_root=source)
    assert r["status"] == "MISMATCH" and "source file differs" in r["reason"]


def test_false_event_id_fails_without_normalizing_it_away(pack):
    ev = event(pack); ev["event_id"] = "sha256:" + "0" * 64
    (pack / "evidence-events.jsonl").write_text(json.dumps(ev))
    assert check(pack)["status"] != "MATCHED_EXPECTATION"


def test_cli_exit_codes_match_integrity_not_permission(capsys):
    assert V.main([str(RECEIPT), "--expected-manifest-sha256", PIN]) == 0
    assert json.loads(capsys.readouterr().out)["human_authority"] == "NOT_ESTABLISHED"
    assert V.main([str(RECEIPT)]) == 2
