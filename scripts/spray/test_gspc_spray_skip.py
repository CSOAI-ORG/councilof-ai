import importlib.util
import base64
import io
import json
from pathlib import Path

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


HERE = Path(__file__).resolve().parent
SPRAY_SPEC = importlib.util.spec_from_file_location("gspc_spray", HERE / "gspc-spray.py")
assert SPRAY_SPEC and SPRAY_SPEC.loader
spray = importlib.util.module_from_spec(SPRAY_SPEC)
SPRAY_SPEC.loader.exec_module(spray)


def signed_root():
    key = Ed25519PrivateKey.generate()
    leaves = ["00" * 32, "11" * 32]
    root = {
        "kind": "csoai.public-root/v1",
        "schema": "https://councilof.ai/schema/public-root-v1.json",
        "as_of": "2026-09-14T03:12:56Z",
        "merkle_root": spray.merkle_root(leaves),
        "card_count": len(leaves),
        "card_sha256": leaves,
        "did_intended": "did:web:csoai.org#board-attestation-1",
    }
    preimage = {name: root[name] for name in spray.ROOT_PREIMAGE_KEYS}
    root["sig_ed25519"] = key.sign(spray.canonical(preimage)).hex()
    raw_public = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    did = {
        "id": "did:web:csoai.org",
        "verificationMethod": [{
            "id": root["did_intended"],
            "publicKeyJwk": {
                "kty": "OKP", "crv": "Ed25519",
                "x": base64.urlsafe_b64encode(raw_public).decode().rstrip("="),
            },
        }],
    }
    return root, did


def test_public_root_signature_accepts_the_declared_live_did_key():
    root, did = signed_root()
    spray.verify_public_root(root, did)


def test_public_root_signature_fails_closed_on_tampering_or_a_different_live_key():
    root, did = signed_root()
    root["sig_ed25519"] = "00" * 64
    with pytest.raises(ValueError, match="does not verify"):
        spray.verify_public_root(root, did)

    root, _ = signed_root()
    _, different_did = signed_root()
    with pytest.raises(ValueError, match="does not verify"):
        spray.verify_public_root(root, different_did)


def test_public_root_signature_fails_closed_when_the_leaf_list_does_not_bind_the_root():
    root, did = signed_root()
    root["card_sha256"][0] = "22" * 32
    with pytest.raises(ValueError, match="merkle_root does not bind"):
        spray.verify_public_root(root, did)


def test_kaggle_download_uses_the_newest_ready_version(monkeypatch):
    import io
    import json
    import zipfile

    metadata = {"currentVersionNumber": 24, "versions": [{"versionNumber": 26, "status": "Ready"}]}
    body = io.BytesIO()
    with zipfile.ZipFile(body, "w") as archive:
        archive.writestr("SNAPSHOT.json", "{}")
    seen = []

    def fake_fetch(url, timeout=60):
        seen.append(url)
        return json.dumps(metadata).encode() if "/view/" in url else body.getvalue()

    monkeypatch.setattr(spray, "fetch_ok", fake_fetch)
    assert spray.kaggle_public_files()["SNAPSHOT.json"] == b"{}"
    assert seen[-1].endswith("?datasetVersionNumber=26")


def test_byte_parity_exact_match_skips():
    built = {"a.json": b"1", "b.json": b"2"}
    remote = {"a.json": b"1", "b.json": b"2", "dataset-metadata.json": b"{}"}
    assert spray.byte_parity_reason(built, remote) is None


def test_byte_parity_catches_read_at_only_drift():
    """The 2026-09-13 live failure: same root, different build clock — must NOT skip."""
    built = {"SNAPSHOT.json": b'{"as_of":"X","read_at":"10:04"}'}
    remote = {"SNAPSHOT.json": b'{"as_of":"X","read_at":"08:15"}'}
    reason = spray.byte_parity_reason(built, remote)
    assert reason is not None and "bytes differ" in reason


def test_byte_parity_catches_missing_file():
    built = {"a.json": b"1", "b.json": b"2"}
    remote = {"a.json": b"1"}
    reason = spray.byte_parity_reason(built, remote)
    assert reason is not None and "remote lacks" in reason


def test_built_files_reads_the_snapshot_dir(tmp_path):
    (tmp_path / "x.json").write_bytes(b"xx")
    (tmp_path / "y.json").write_bytes(b"yy")
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "ignored.json").write_bytes(b"no")
    built = spray.built_files(tmp_path)
    assert built == {"x.json": b"xx", "y.json": b"yy"}


def _viewer_truth():
    axes = [
        {"axis": "swarm", "family": "agent", "kind": "model-comparison", "status": "MEASURED",
         "n": 16, "separation": "UNTESTED", "public_leader_state": "NO_SIGNED_CARD", "dataset": "csoai/gspc-swarm"},
        {"axis": "payments", "family": "finance", "kind": "deterministic-facts", "status": "MEASURED",
         "n": 4, "separation": None, "dataset": "csoai/gspc-payments"},
    ]
    board = {"axes": axes, "totals": {"axes": 2, "measured_axes": 2}}
    board_bytes = json.dumps(board, separators=(",", ":")).encode()
    return {"as_of": "2026-09-23T10:00:00Z", "read_at": "2026-09-23T10:01:00Z",
            "fingerprint": "f" * 64, "board_bytes": board_bytes,
            "board_sha256": spray.sha256_hex(board_bytes), "board": board}


def test_hf_viewer_preserves_eight_columns_and_unverified_states():
    import pyarrow.parquet as pq

    files = spray.hf_viewer_files(_viewer_truth())
    table = pq.read_table(io.BytesIO(files["board.parquet"]))
    assert table.schema.names == list(spray.VIEWER_COLUMNS)
    assert [str(field.type) for field in table.schema] == [
        "large_string", "large_string", "large_string", "large_string", "int64",
        "large_string", "large_string", "large_string",
    ]
    rows = [json.loads(line) for line in files["board.jsonl"].decode().splitlines()]
    assert rows == table.to_pylist()
    assert rows[0]["separation"] == "UNTESTED"
    assert rows[0]["leader"] == "withheld — no signed card"
    assert rows[1]["leader"] == "none by design (facts run)"


def test_hf_viewer_refuses_inconsistent_printed_totals():
    truth = _viewer_truth()
    truth["board"]["totals"]["measured_axes"] = 3
    with pytest.raises(spray.Refused, match="totals do not agree"):
        spray.hf_viewer_files(truth)


def test_hf_dataset_companions_refresh_only_bounded_provenance_and_inventory():
    tr = _viewer_truth()
    paragraph = "The default viewer files (`board.parquet` and `board.jsonl`) were old."
    readme = f"---\nconfigs: []\n---\n\n# Board\n\n{paragraph}\n\n## Other work\nKeep me.\n".encode()
    manifest = (json.dumps({"file": "board.jsonl", "sha256": "0" * 64, "bytes": 1, "blob_id": "old"}) + "\n"
                + json.dumps({"file": "snapshot/board.json", "sha256": "1" * 64, "bytes": 1, "blob_id": "old"}) + "\n").encode()
    changed = {"board.jsonl": b"new", "snapshot/board.json": b"source"}
    files = spray.hf_dataset_companions(readme, manifest, tr, changed)
    card = files["README.md"].decode()
    assert "## Other work\nKeep me." in card
    assert "records 2 axes" in card
    assert "not a new measurement or signature" in card
    rows = [json.loads(line) for line in files["manifest.jsonl"].decode().splitlines()]
    assert rows[0]["sha256"] == spray.sha256_hex(b"new")
    assert rows[1]["sha256"] == spray.sha256_hex(b"source")
    assert rows[0]["blob_id"] is None
    with pytest.raises(spray.Refused, match="manual review"):
        spray.hf_dataset_companions(readme.replace(paragraph.encode(), b"new card"), manifest, tr, changed)


def test_hf_dataset_card_removes_stale_counts_and_alias_inventory():
    tr = _viewer_truth()
    readme = (
        "# GSPC Board Export\n\n"
        "The default viewer files (`board.parquet` and `board.jsonl`) were old.\n\n"
        "At the dated snapshot read, the board had **23 declared slots and 23 measured axes**.\n"
        "For current counts, separation states and withheld leader fields, a past viewer was stale.\n"
        "## What is in this repository\n| file | bytes | rows | what |\n|---|---:|---:|---|\n"
        "| `snapshot/board.json` | 71889 |  | old |\n"
        "| `board.json` | old alias |\n| `living-board.json` | old alias |\n"
        "| `board.parquet` | 5775 | 23 | old viewer |\n"
        "| `manifest.jsonl` | — | 3 | file inventory |\n"
        "`manifest.jsonl` was updated from this repository's file tree at 2026-09-22T17:14:17Z; "
        "it lists every file with its\nsize, its blob hash and a direct URL.\n"
        "## Citation\n**Lid:** this dated export records 23 axis rows.\n"
        "Card refreshed 2026-09-22T17:14:17Z.\n"
    ).encode()
    changed = {"snapshot/board.json": tr["board_bytes"], "board.json": tr["board_bytes"],
               "living-board.json": tr["board_bytes"], "board.parquet": b"parquet"}
    manifest = "".join(json.dumps({"file": path, "bytes": 1, "sha256": "0" * 64}) + "\n"
                       for path in changed).encode()
    files = spray.hf_dataset_companions(readme, manifest, tr, changed)
    text = files["README.md"].decode()
    assert "2 declared slots and 2 measured axes" in text
    assert "23 declared slots" not in text
    assert f"| `board.json` | {len(tr['board_bytes'])} |" in text
    assert f"| `living-board.json` | {len(tr['board_bytes'])} |" in text
    assert "| `board.parquet` | 7 | 2 |" in text
    assert "| `manifest.jsonl` | — | 4 |" in text
    assert "Card refreshed" not in text
    assert "was updated from this repository's file tree at" not in text
    assert "`manifest.jsonl` lists every other file with its\nsize, its blob hash" in text
    assert spray.hf_dataset_companions(files["README.md"], files["manifest.jsonl"], tr, changed) == files
    rows = [json.loads(line) for line in files["manifest.jsonl"].decode().splitlines()]
    assert rows[1]["sha256"] == spray.sha256_hex(tr["board_bytes"])


def test_hf_dataset_snapshot_and_viewer_are_one_optimistic_commit(monkeypatch, tmp_path):
    import huggingface_hub

    tr = _viewer_truth()
    for name in spray.SNAPSHOT_FILES:
        (tmp_path / name).write_bytes(tr["board_bytes"] if name == "board.json" else b"snapshot")
    old = {"as_of": "2026-09-22T10:00:00Z"}
    readme = ("# Board\n\nThe default viewer files (`board.parquet` and `board.jsonl`) "
              "were old.\n\n## Other work\nKeep me.\n").encode()
    paths = ([f"snapshot/{name}" for name in spray.SNAPSHOT_FILES]
             + ["board.parquet", "board.jsonl", "board.json", "living-board.json"])
    manifest = "".join(json.dumps({"file": path, "sha256": None, "bytes": None, "blob_id": None}) + "\n"
                       for path in paths).encode()
    public = {"snapshot/SNAPSHOT.json": json.dumps(old).encode(), "README.md": readme,
              "manifest.jsonl": manifest}
    calls = []

    class FakeApi:
        def __init__(self, token=None):
            pass

        def whoami(self):
            return {"name": "test", "orgs": []}

        def repo_info(self, repo_id, repo_type):
            assert (repo_id, repo_type) == (spray.HF_DATASET, "dataset")
            return type("Repo", (), {"sha": "parent-sha"})()

        def create_commit(self, **kwargs):
            assert kwargs["parent_commit"] == "parent-sha"
            assert kwargs["repo_type"] == "dataset"
            operations = kwargs["operations"]
            assert {op.path_in_repo for op in operations} == set(paths + ["README.md", "manifest.jsonl"])
            public.update({op.path_in_repo: op.path_or_fileobj for op in operations})
            calls.append("dataset-atomic")

        def upload_folder(self, **kwargs):
            assert kwargs["repo_type"] == "space"
            calls.append("space")

    monkeypatch.setattr(huggingface_hub, "HfApi", FakeApi)
    monkeypatch.setattr(spray, "remote_snapshot", lambda url: None)
    monkeypatch.setattr(spray, "_hf_snapshot_bytes_match", lambda page, built: True)

    def fake_fetch(url, timeout=60):
        path = url.split("/resolve/", 1)[1].split("/", 1)[1].split("?", 1)[0]
        return public[path]

    monkeypatch.setattr(spray, "fetch_ok", fake_fetch)
    results = spray.spray_hf(tr, tmp_path, dry_run=False, force=False)
    assert calls == ["dataset-atomic", "space"]
    assert [r["status"] for r in results] == ["PUBLISHED", "PUBLISHED"]
    assert public["board.jsonl"].count(b"\n") == 2
    assert public["board.json"] == public["living-board.json"] == public["snapshot/board.json"] == tr["board_bytes"]


def test_hf_snapshot_bytes_match_compares_bytes_not_as_of(monkeypatch):
    built = {"SNAPSHOT.json": b'{"as_of":"X","read_at":"10:26"}'}
    monkeypatch.setattr(spray, "fetch_ok", lambda url, timeout=60: built["SNAPSHOT.json"])
    assert spray._hf_snapshot_bytes_match("https://huggingface.co/datasets/x/y", built) is True
    monkeypatch.setattr(spray, "fetch_ok", lambda url, timeout=60: b'{"as_of":"X","read_at":"08:15"}')
    assert spray._hf_snapshot_bytes_match("https://huggingface.co/datasets/x/y", built) is False
    def boom(url, timeout=60):
        raise RuntimeError("net down")
    monkeypatch.setattr(spray, "fetch_ok", boom)
    assert spray._hf_snapshot_bytes_match("https://huggingface.co/datasets/x/y", built) is False


def test_adopt_remote_read_at_reproduces_published_bytes_for_an_unchanged_root():
    tr = {"fingerprint": "f" * 64, "as_of": "2026-09-13T06:03:55Z", "read_at": "2026-09-13T15:00:00Z"}
    remote = {"fingerprint": "f" * 64, "as_of": "2026-09-13T06:03:55Z", "read_at": "2026-09-13T06:05:10Z"}
    assert spray.adopt_remote_read_at(tr, remote) is True
    assert tr["read_at"] == "2026-09-13T06:05:10Z"


def test_adopt_remote_read_at_keeps_a_fresh_clock_when_the_root_changed_or_remote_is_absent():
    tr = {"fingerprint": "f" * 64, "as_of": "2026-09-13T06:03:55Z", "read_at": "2026-09-13T15:00:00Z"}
    assert spray.adopt_remote_read_at(tr, {"fingerprint": "e" * 64, "as_of": "2026-09-13T06:03:55Z", "read_at": "x"}) is False
    assert spray.adopt_remote_read_at(tr, {"fingerprint": "f" * 64, "as_of": "2026-09-12T19:21:56Z", "read_at": "x"}) is False
    assert spray.adopt_remote_read_at(tr, None if False else {}) is False
    assert tr["read_at"] == "2026-09-13T15:00:00Z"


def _truth():
    return {"as_of": "2026-09-14T03:12:56Z", "read_at": "2026-09-14T04:44:14Z", "fingerprint": "9" * 64,
            "lid": "22 axes measured · not a certificate.", "board": {"issuer": "CSOAI Ltd"}}


def test_kaggle_page_text_is_derived_from_the_truth_only():
    subtitle, description = spray.kaggle_page_text(_truth())
    assert "2026-09-14T03:12:56Z" in subtitle
    assert description.startswith("22 axes measured · not a certificate.")
    assert description.endswith("spray-fingerprint: " + "9" * 64)
    assert not spray.BANNED.search(description)


def test_kaggle_metadata_drift_is_none_when_the_page_matches_modulo_whitespace():
    subtitle, description = spray.kaggle_page_text(_truth())
    info = {"subtitle": subtitle, "description": description.replace("\n\n", "\n")}
    assert spray.kaggle_metadata_drift(info, subtitle, description) is None


def test_kaggle_metadata_drift_catches_the_2026_09_14_live_page():
    """Bytes carried 2026-09-14T03:12:56Z; the visible page still said 2026-09-12 and carried a
    hand-typed legacy Hub triple in place of the fingerprint line. UNCHANGED bytes must not hide that."""
    subtitle, description = spray.kaggle_page_text(_truth())
    stale = {
        "subtitle": "Snapshot of GET councilof.ai/api/gspc · as_of 2026-09-12T13:27:43Z · 22·22 · cit",
        "description": description.rsplit("spray-fingerprint:", 1)[0]
        + "Hub cards: GET https://councilof.ai/api/hub-cards → cells/measured/unmeasured = 1191/1191/0",
    }
    reason = spray.kaggle_metadata_drift(stale, subtitle, description)
    assert reason is not None and "subtitle" in reason and "description" in reason
    appended = {"subtitle": subtitle, "description": description + "\nA100 COLD."}
    assert "description" in (spray.kaggle_metadata_drift(appended, subtitle, description) or "")


WORKFLOWS = HERE.parent.parent / ".github" / "workflows"


def _workflow_name(path: Path) -> str:
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("name:"):
            return line[len("name:"):].strip().strip('"').strip("'")
    raise AssertionError(f"{path.name} has no top-level name:")


def test_spray_follows_the_deploy_workflow_by_its_exact_name():
    """workflow_run couples two files by the producer's `name:` STRING and nothing else checks it:
    rename deploy.yml and every follow-the-deploy spray stops with no red anywhere (2026-09-15 — the
    surfaces sat one root tick behind the apex because only a daily clock re-read it). Pin the
    coupling, and pin the guard that a cancelled or failed deploy — which moved nothing at the apex —
    is skipped."""
    deploy_name = _workflow_name(WORKFLOWS / "deploy.yml")
    # Every workflow whose workflow_run trigger follows the deploy by its `name:` string — a rename
    # of deploy.yml silently stops all of them (2026-09-15: spray; 2026-09-20 audit found the other
    # four had been dead since the 'gated production branch' rename). Pin them all.
    followers = [
        "gspc-spray.yml",
        "post-deploy-verify.yml",
        "claims-e2e.yml",
        "sov-stack-e2e.yml",
        "hf-gspc-surface-sync.yml",
    ]
    for follower in followers:
        text = (WORKFLOWS / follower).read_text(encoding="utf-8")
        assert "workflow_run:" in text, follower
        assert f'- "{deploy_name}"' in text or f'workflows: ["{deploy_name}"]' in text, follower
        # Failing control: the coupling is byte-exact — one extra character and the trigger is a miss.
        assert f'- "{deploy_name}x"' not in text, follower
    spray_text = (WORKFLOWS / "gspc-spray.yml").read_text(encoding="utf-8")
    assert "github.event.workflow_run.conclusion == 'success'" in spray_text
    assert _workflow_name(WORKFLOWS / "gspc-spray.yml") == "gspc-spray"



def test_hf_same_root_second_tick_reuses_read_at_and_does_not_change_dataset_bundle():
    first = _viewer_truth()
    second = _viewer_truth()
    second["read_at"] = "2026-09-23T11:01:00Z"
    viewer = spray.hf_viewer_files(first)
    changed = {"snapshot/SNAPSHOT.json": json.dumps({"as_of": first["as_of"],
                "fingerprint": first["fingerprint"], "read_at": first["read_at"]}).encode(), **viewer}
    initial_readme = ("# Board\n\nThe default viewer files (`board.parquet` and `board.jsonl`) "
                      "were old.\n\n## Other work\nKeep me.\n").encode()
    initial_manifest = "".join(json.dumps({"file": path, "sha256": None, "bytes": None,
                                           "blob_id": None}) + "\n" for path in changed).encode()
    first_companions = spray.hf_dataset_companions(initial_readme, initial_manifest, first, changed)
    remote_snapshot = {"as_of": first["as_of"], "fingerprint": first["fingerprint"],
                       "read_at": first["read_at"]}
    assert spray.adopt_remote_read_at(second, remote_snapshot)
    second_changed = {"snapshot/SNAPSHOT.json": json.dumps({"as_of": second["as_of"],
                      "fingerprint": second["fingerprint"], "read_at": second["read_at"]}).encode(),
                      **spray.hf_viewer_files(second)}
    second_companions = spray.hf_dataset_companions(first_companions["README.md"],
                                                     first_companions["manifest.jsonl"],
                                                     second, second_changed)
    assert spray.byte_parity_reason({**changed, **first_companions},
                                    {**second_changed, **second_companions}) is None



def test_board_site_attestation_accepts_live_did_key_and_rejects_tamper():
    key = Ed25519PrivateKey.generate()
    raw = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    key_x = base64.urlsafe_b64encode(raw).decode().rstrip("=")
    did = {"id": "did:web:csoai.org", "verificationMethod": [{"id": spray.ROOT_DID,
           "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": key_x}}]}
    board = {"axes": [{"axis": "swarm", "status": "MEASURED"}], "totals": {"axes": 1}}
    board["site_attestation"] = {"signer": spray.ROOT_DID, "alg": "Ed25519",
                                  "public_key_x": key_x, "sig": key.sign(spray.canonical(board)).hex()}
    spray.verify_board_site_attestation(board, did)
    board["axes"][0]["status"] = "UNMEASURED"
    with pytest.raises(ValueError, match="does not verify"):
        spray.verify_board_site_attestation(board, did)
    board["site_attestation"]["sig"] = None
    with pytest.raises(ValueError, match="no 64-byte signature"):
        spray.verify_board_site_attestation(board, did)


def _proj(latest, description=""):
    return {"info": {"version": latest, "description": description}, "releases": {latest: [{}]}}


def test_pypi_refuses_a_stale_package_source_the_2026_09_28_case():
    # 0.2.20260928 went out from a source still declaring 0.2.20260912 while PyPI served 0.2.20260922
    why = spray.pypi_stale_source_refusal("0.2.20260912", "0.2.20260928", _proj("0.2.20260922"))
    assert why and "older than the source PyPI already serves (0.2.20260922" in why


def test_pypi_accepts_the_current_source_over_a_marker_less_release():
    assert spray.pypi_stale_source_refusal("0.2.20260928.1", "0.2.20260929", _proj("0.2.20260928")) is None


def test_pypi_reads_the_source_version_a_spray_release_names():
    served = _proj("0.2.20260929", "spray-fingerprint: ab\n\nspray-source-version: 0.2.20260928.1 (the package source")
    assert spray.pypi_stale_source_refusal("0.2.20260928.1", "0.2.20260930", served) is None
    assert "older" in spray.pypi_stale_source_refusal("0.2.20260926", "0.2.20260930", served)


def test_pypi_refuses_a_snapshot_version_below_its_own_source():
    why = spray.pypi_stale_source_refusal("0.2.20260928.1", "0.2.20260928", _proj("0.2.20260922"))
    assert why and "sorts below" in why
    assert spray.pypi_stale_source_refusal(None, "0.2.20260929", _proj("0.2.20260922"))
