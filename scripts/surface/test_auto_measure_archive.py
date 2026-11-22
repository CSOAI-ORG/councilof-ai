"""Archive driver controls with fake transport and fixed outputs, never live measurements."""
import copy
import importlib.util
import json
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
import httpx
from huggingface_hub.errors import LocalEntryNotFoundError, RemoteEntryNotFoundError

PATH = Path(__file__).with_name("run-auto-measure-once.py")
spec = importlib.util.spec_from_file_location("auto_measure_driver", PATH)
driver = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = driver
spec.loader.exec_module(driver)
m = driver.measurement
SOURCE = "b" * 40
MODEL = "a" * 40


def fixture_receipt():
    bank = m.BANKS[0]
    metadata, rows = m.load_bank(bank)
    offset, window = m.select_window(0, rows, bank)
    outputs = [{"answer": row["expected"], "raw_output": row["expected"] + "<eos>",
        "rendered_prompt": row["prompt"], "rendered_prompt_sha256": m.sha256(row["prompt"]),
        "output_token_ids": [42, 2], "generated_tokens": 2, "stop_reason": "eos_token",
        "stop_reason_source": "observed_tokens", "token_limit_reached": False, "error_type": None} for row in window]
    return m.make_result(0, MODEL, bank, metadata, window, offset, outputs,
        "2001-01-01T00:00:00Z", SOURCE, {"repo": m.RESULTS_REPO, "revision": "parent"}, {})


def rehash(receipt):
    receipt["receipt_sha256"] = m.sha256(m.canonical_json({k: v for k, v in receipt.items() if k != "receipt_sha256"}))


class FakeHub:
    def __init__(self, root, raw=b"", race=False, corrupt_readback=False, ambiguous_commit=False):
        self.root = root
        self.head = "parent"
        self.stores = {self.head: {"results.jsonl": raw}}
        self.calls = 0
        self.race = race
        self.corrupt_readback = corrupt_readback
        self.ambiguous_commit = ambiguous_commit

    def dataset_info(self, repo):
        return SimpleNamespace(sha=self.head)

    def download(self, repo, name, repo_type, revision):
        if name not in self.stores[revision]:
            response = httpx.Response(404, request=httpx.Request("HEAD", "https://huggingface.co/fixture"))
            raise RemoteEntryNotFoundError(name, response=response)
        raw = self.stores[revision][name]
        if self.corrupt_readback and revision == "published":
            raw += b"changed"
        path = self.root / revision / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        return str(path)

    def create_commit(self, repo_id, repo_type, parent_commit, commit_message, operations):
        self.calls += 1
        if self.race:
            self.head = "concurrent"
        if parent_commit != self.head:
            raise RuntimeError("409 parent changed")
        assert all(op.path_in_repo == "results.jsonl" or op.path_in_repo.startswith("receipts/") for op in operations)
        store = dict(self.stores[self.head])
        for op in operations:
            store[op.path_in_repo] = op.path_or_fileobj
        self.head = "published"
        self.stores[self.head] = store
        if self.ambiguous_commit:
            raise TimeoutError("response lost after the server accepted the commit")
        return SimpleNamespace(oid=self.head)


def archive(hub, receipt, snapshot=None):
    snapshot = snapshot or driver.load_snapshot(hub, hub.download)
    return driver.archive_receipt(hub, hub.download, snapshot, receipt, SimpleNamespace)


def test_full_receipt_revalidates_from_frozen_gold():
    receipt = fixture_receipt()
    assert driver.validate_receipt(receipt, SOURCE, 0, MODEL) == receipt
    assert driver.allocation_seconds() == 120


@pytest.mark.parametrize("field", ["raw_output", "output_token_ids", "rendered_prompt", "stop_reason_source"])
def test_missing_full_evidence_is_not_archived(field):
    receipt = fixture_receipt()
    del receipt["items"][0][field]
    rehash(receipt)
    with pytest.raises(ValueError):
        driver.validate_receipt(receipt, SOURCE, 0, MODEL)


def test_partial_items_fail_even_with_a_valid_outer_hash():
    receipt = fixture_receipt()
    receipt["items"].pop()
    rehash(receipt)
    with pytest.raises(ValueError, match="partial"):
        driver.validate_receipt(receipt, SOURCE, 0, MODEL)


def test_wrong_expected_label_and_claimed_grade_are_not_trusted():
    receipt = fixture_receipt()
    receipt["items"][0]["expected"] = "INVENTED"
    rehash(receipt)
    with pytest.raises(ValueError, match="frozen-bank regrade"):
        driver.validate_receipt(receipt, SOURCE, 0, MODEL)


def test_changed_raw_text_fails_internal_hash_validation():
    receipt = fixture_receipt()
    receipt["items"][0]["raw_output"] += "unrecorded"
    rehash(receipt)
    with pytest.raises(ValueError, match="hashes"):
        driver.validate_receipt(receipt, SOURCE, 0, MODEL)


@pytest.mark.parametrize("source,sequence,model", [("wrong", 0, MODEL), (SOURCE, 1, MODEL), (SOURCE, 0, "wrong")])
def test_planned_bindings_are_enforced(source, sequence, model):
    with pytest.raises(ValueError):
        driver.validate_receipt(fixture_receipt(), source, sequence, model)


def test_atomic_archive_preserves_legacy_prefix_and_reads_back(tmp_path):
    # An unrelated historical record is retained byte-for-byte and does not own this queue.
    old = b'{"model":"historical-other-model","bank":"historical","accuracy":0.5}\n'
    hub = FakeHub(tmp_path, old)
    receipt = fixture_receipt()
    evidence = archive(hub, receipt)
    assert hub.calls == 1 and evidence["state"] == "archived"
    raw = hub.stores[hub.head]["results.jsonl"]
    assert raw.startswith(old) and len(raw.splitlines()) == 2
    assert json.loads(raw.splitlines()[-1]) == receipt
    assert hub.stores[hub.head][driver.receipt_path(receipt)] == (m.canonical_json(receipt) + "\n").encode()
    assert evidence["results_jsonl_sha256"] == m.sha256(raw)


def test_exact_duplicate_is_a_no_write_replay(tmp_path):
    receipt = fixture_receipt()
    raw = (m.canonical_json(receipt) + "\n").encode()
    hub = FakeHub(tmp_path, raw)
    hub.stores[hub.head][driver.receipt_path(receipt)] = raw
    assert archive(hub, receipt)["state"] == "already_archived"
    assert hub.calls == 0


def test_duplicate_jsonl_with_missing_receipt_repairs_only_the_unique_file(tmp_path):
    receipt = fixture_receipt()
    raw = (m.canonical_json(receipt) + "\n").encode()
    hub = FakeHub(tmp_path, raw)
    assert archive(hub, receipt)["state"] == "repaired_archive"
    assert hub.calls == 1
    assert hub.stores[hub.head]["results.jsonl"] == raw
    assert hub.stores[hub.head][driver.receipt_path(receipt)] == raw


def test_duplicate_with_changed_unique_file_never_reports_success(tmp_path):
    receipt = fixture_receipt()
    hub = FakeHub(tmp_path, (m.canonical_json(receipt) + "\n").encode())
    hub.stores[hub.head][driver.receipt_path(receipt)] = b"corrupt"
    with pytest.raises(driver.ArchiveConflict, match="immutable"):
        archive(hub, receipt)
    assert hub.calls == 0


def test_missing_unique_file_repair_retains_the_atomic_parent_guard(tmp_path):
    receipt = fixture_receipt()
    hub = FakeHub(tmp_path, (m.canonical_json(receipt) + "\n").encode(), race=True)
    with pytest.raises(driver.ArchiveConflict, match="not confirmed"):
        archive(hub, receipt)
    assert hub.calls == 1 and "published" not in hub.stores


def test_same_run_id_with_different_body_never_overwrites(tmp_path):
    receipt = fixture_receipt()
    hub = FakeHub(tmp_path, (m.canonical_json(receipt) + "\n").encode())
    retry = copy.deepcopy(receipt)
    retry["timestamp"] = "2001-01-01T00:00:01Z"
    rehash(retry)
    assert retry["run_id"] == receipt["run_id"]
    with pytest.raises(driver.ArchiveConflict):
        archive(hub, retry)
    assert hub.calls == 0


def test_parent_change_before_write_is_not_retried(tmp_path):
    hub = FakeHub(tmp_path)
    snapshot = driver.load_snapshot(hub, hub.download)
    hub.head = "concurrent"
    with pytest.raises(driver.ArchiveConflict, match="parent changed"):
        archive(hub, fixture_receipt(), snapshot)
    assert hub.calls == 0


def test_atomic_parent_race_is_not_retried(tmp_path):
    hub = FakeHub(tmp_path, race=True)
    with pytest.raises(driver.ArchiveConflict, match="not confirmed"):
        archive(hub, fixture_receipt())
    assert hub.calls == 1 and "published" not in hub.stores


def test_accepted_commit_with_lost_response_recovers_without_another_write(tmp_path):
    hub = FakeHub(tmp_path, ambiguous_commit=True)
    receipt = fixture_receipt()
    with pytest.raises(driver.ArchiveConflict, match="not confirmed"):
        archive(hub, receipt)
    assert hub.calls == 1 and hub.head == "published"
    assert archive(hub, receipt)["state"] == "already_archived"
    assert hub.calls == 1


def test_preexisting_unique_path_with_different_bytes_is_not_replaced(tmp_path):
    hub = FakeHub(tmp_path)
    receipt = fixture_receipt()
    hub.stores[hub.head][driver.receipt_path(receipt)] = b"partial or different"
    with pytest.raises(driver.ArchiveConflict, match="immutable"):
        archive(hub, receipt)
    assert hub.calls == 0


def test_identical_orphan_receipt_can_complete_the_append(tmp_path):
    hub = FakeHub(tmp_path)
    receipt = fixture_receipt()
    hub.stores[hub.head][driver.receipt_path(receipt)] = (m.canonical_json(receipt) + "\n").encode()
    assert archive(hub, receipt)["state"] == "archived"
    assert hub.calls == 1


def test_readback_tampering_does_not_report_success(tmp_path):
    hub = FakeHub(tmp_path, corrupt_readback=True)
    with pytest.raises(ValueError, match="readback"):
        archive(hub, fixture_receipt())


def test_local_cache_disappearance_is_not_remote_missing_entry(tmp_path):
    hub = FakeHub(tmp_path)
    snapshot = driver.load_snapshot(hub, hub.download)

    def lost_local_download(repo, name, repo_type, revision):
        return str(tmp_path / "cache-file-disappeared")

    with pytest.raises(FileNotFoundError):
        driver.archive_receipt(hub, lost_local_download, snapshot, fixture_receipt(), SimpleNamespace)
    assert hub.calls == 0


def test_results_card_publication_never_contains_measurement_rows():
    spec = importlib.util.spec_from_file_location("auto_measure_publisher", PATH.with_name("publish-hf-evaluation.py"))
    publisher = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(publisher)
    payload = publisher.build_payload("results-card", SOURCE)
    assert set(payload) == {"README.md", "SOURCE_REVISION.json"}
    release = json.loads(payload["SOURCE_REVISION.json"])
    assert release["commit"] == SOURCE and release["target"] == "results-card"
    assert release["files"] == {"README.md": m.sha256(payload["README.md"])}
    assert f"/blob/{SOURCE}/scripts/surface/".encode() in payload["README.md"]
    assert b"/blob/master/" not in payload["README.md"]


def test_sdk_local_missing_entry_is_not_remote_absence(tmp_path):
    hub = FakeHub(tmp_path)
    snapshot = driver.load_snapshot(hub, hub.download)

    def offline_cache_miss(repo, name, repo_type, revision):
        raise LocalEntryNotFoundError("network unavailable and no local entry")

    with pytest.raises(LocalEntryNotFoundError):
        driver.archive_receipt(hub, offline_cache_miss, snapshot, fixture_receipt(), SimpleNamespace)
    assert hub.calls == 0


def test_dataset_default_reads_only_jsonl_not_provenance_or_duplicate_receipts(tmp_path):
    from datasets import load_dataset

    archive = tmp_path / "archive"
    archive.mkdir()
    (archive / "README.md").write_bytes((driver.SPACE_SOURCE / "RESULTS-README.md").read_bytes())
    row = {"model": "fixture", "bank": "fixture", "accuracy": 0.5}
    (archive / "results.jsonl").write_text(json.dumps(row) + "\n")
    (archive / "SOURCE_REVISION.json").write_text('{"schema":"source-provenance","files":{"README.md":"hash"}}\n')
    receipts = archive / "receipts"
    receipts.mkdir()
    (receipts / "unique-receipt.json").write_text(json.dumps(row) + "\n")
    dataset = load_dataset(str(archive), split="train")
    assert dataset.to_list() == [row]
