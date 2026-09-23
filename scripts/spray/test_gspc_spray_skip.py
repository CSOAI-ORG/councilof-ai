import importlib.util
import base64
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


# ------------------------------------------------------------------------------------ claim maintenance

def spec_copy(tmp_path):
    """A writable copy of the committed specification tree, so tampering can be tested on real bytes."""
    import shutil
    dst = tmp_path / "claim-maintenance"
    shutil.copytree(HERE.parent.parent / "public" / "spec" / "claim-maintenance", dst)
    return dst


def test_claim_maintenance_reads_the_committed_specification_and_its_own_as_of():
    """The spray carries the register; it never regenerates it, so the date it publishes is the
    register's own instant and not the clock of whichever board run happened to pick it up."""
    import json
    cm = spray.read_claim_maintenance()
    assert set(cm["files"]) == set(spray.SPEC_FILES)
    # the document is carried byte-for-byte: its digest is the one its own record declares
    assert spray.sha256_hex(cm["files"][spray.SPEC_DOC_NAME]) == cm["spec"]["document_sha256"]
    register = json.loads(cm["files"][spray.SPEC_REGISTER_NAME])
    assert cm["register_as_of"] == register["as_of"] != spray.utc_now()
    assert cm["spec"]["canonical_url"] and cm["spec"]["doi_url"] and cm["spec"]["doi"]


def test_claim_maintenance_refuses_a_document_that_does_not_match_its_own_digest(monkeypatch, tmp_path):
    dst = spec_copy(tmp_path)
    doc = dst / "v0.1" / "claim-maintenance-v0.1.md"
    doc.write_bytes(doc.read_bytes() + b"\nan edit nobody re-hashed\n")
    monkeypatch.setattr(spray, "SPEC_DIR", dst)
    with pytest.raises(spray.Refused, match="document of record hashes to"):
        spray.read_claim_maintenance()


def test_claim_maintenance_refuses_a_register_whose_digest_does_not_bind_its_bytes(monkeypatch, tmp_path):
    import json
    dst = spec_copy(tmp_path)
    register = json.loads((dst / "register.json").read_text())
    register["totals"]["claims"] += 1           # a hand-edit that the generator would never have made
    (dst / "register.json").write_text(json.dumps(register, indent=2) + "\n")
    monkeypatch.setattr(spray, "SPEC_DIR", dst)
    with pytest.raises(spray.Refused, match="register_digest does not bind"):
        spray.read_claim_maintenance()


def test_claim_maintenance_refuses_a_register_generated_against_another_version(monkeypatch, tmp_path):
    """A register that names a different specification is not this specification's register."""
    import json
    dst = spec_copy(tmp_path)
    register = json.loads((dst / "register.json").read_text())
    register["specification"] = "https://councilof.ai/spec/claim-maintenance/v0.9/"
    register["register_digest"] = spray.sha256_hex(
        spray.canonical({k: v for k, v in register.items() if k != "register_digest"}))
    (dst / "register.json").write_text(json.dumps(register, indent=2) + "\n")
    monkeypatch.setattr(spray, "SPEC_DIR", dst)
    with pytest.raises(spray.Refused, match="was generated against"):
        spray.read_claim_maintenance()


def test_claim_maintenance_refuses_an_absent_file(monkeypatch, tmp_path):
    """Absent is not zero, and it is not 'publish the rest'."""
    dst = spec_copy(tmp_path)
    (dst / "register.json").unlink()
    monkeypatch.setattr(spray, "SPEC_DIR", dst)
    with pytest.raises(spray.Refused, match="register is unreadable"):
        spray.read_claim_maintenance()


def test_claim_maintenance_follows_a_renamed_document_without_a_code_change(monkeypatch, tmp_path):
    """The document's filename is read from spec.json, so a v0.2 that renames it is followed."""
    import json
    dst = spec_copy(tmp_path)
    version_dir = dst / "v0.1"
    (version_dir / "claim-maintenance-v0.1.md").rename(version_dir / "renamed.md")
    record = json.loads((version_dir / "spec.json").read_text())
    record["document_of_record"] = record["canonical_url"] + "renamed.md"
    (version_dir / "spec.json").write_text(json.dumps(record, indent=2) + "\n")
    monkeypatch.setattr(spray, "SPEC_DIR", dst)
    cm = spray.read_claim_maintenance()
    assert cm["files"][spray.SPEC_DOC_NAME] == (version_dir / "renamed.md").read_bytes()


def test_claim_maintenance_refuses_a_document_url_outside_the_specification(monkeypatch, tmp_path):
    import json
    dst = spec_copy(tmp_path)
    version_dir = dst / "v0.1"
    record = json.loads((version_dir / "spec.json").read_text())
    record["document_of_record"] = "https://example.invalid/etc/passwd"
    (version_dir / "spec.json").write_text(json.dumps(record, indent=2) + "\n")
    monkeypatch.setattr(spray, "SPEC_DIR", dst)
    with pytest.raises(spray.Refused, match="not under its own canonical_url"):
        spray.read_claim_maintenance()


def test_register_counts_reports_a_disagreement_rather_than_reconciling_it():
    register = {
        "subjects": [{"subject": "a", "claim_count": 2, "states": {"CLAIM_MEASURED": 2}},
                     {"subject": "b", "claim_count": 1, "states": {"UNMEASURED": 1}}],
        "registries": [{"status": "LIVE"}, {"status": "SUPERSEDED"}],
        "totals": {"subjects": 2, "claims": 9, "by_state": {"CLAIM_MEASURED": 2, "UNMEASURED": 1},
                   "registries": 1, "registries_superseded": 1},
    }
    counts = spray.register_counts(register)
    assert counts["counted"]["claims"] == 3            # counted from the array, not read off totals
    assert counts["printed_agrees_with_arrays"] is False
    assert counts["printed_disagrees_on"] == ["claims"]
    register["totals"]["claims"] = 3
    assert spray.register_counts(register)["printed_agrees_with_arrays"] is True


def test_register_counts_refuses_a_count_that_is_not_a_number():
    with pytest.raises(spray.Refused, match="not an integer"):
        spray.register_counts({"subjects": [{"subject": "a", "claim_count": 1, "states": {"UNMEASURED": None}}],
                               "registries": []})


def test_readme_section_names_the_category_and_links_the_canonical_url_and_the_doi():
    cm = spray.read_claim_maintenance()
    text = "\n".join(spray.render_claim_maintenance(cm))
    assert cm["spec"]["name"] in text
    assert cm["spec"]["canonical_url"] in text and cm["spec"]["doi_url"] in text and cm["spec"]["doi"] in text
    assert cm["register_as_of"] in text and cm["document_sha256"] in text
    assert spray.BANNED.search(text) is None


def test_the_carried_bundle_moves_the_fingerprint_when_only_the_register_moves(monkeypatch, tmp_path):
    """A register that moved and a board that did not is a changed dataset. The fingerprint every
    surface is keyed on binds the carried bytes, so an unchanged root cannot mask a changed register."""
    import json
    before = spray.read_claim_maintenance()["bundle_sha256"]
    dst = spec_copy(tmp_path)
    register = json.loads((dst / "register.json").read_text())
    register["as_of"] = "2099-01-01T00:00:00Z"
    register["register_digest"] = spray.sha256_hex(
        spray.canonical({k: v for k, v in register.items() if k != "register_digest"}))
    (dst / "register.json").write_text(json.dumps(register, indent=2) + "\n")
    monkeypatch.setattr(spray, "SPEC_DIR", dst)
    assert spray.read_claim_maintenance()["bundle_sha256"] != before


def test_snapshot_files_carries_the_specification_bundle():
    assert set(spray.SPEC_FILES) <= set(spray.SNAPSHOT_FILES)
    assert spray.SNAPSHOT_FILES[-1] == "manifest.jsonl"


def _truth():
    return {"as_of": "2026-09-14T03:12:56Z", "read_at": "2026-09-14T04:44:14Z", "fingerprint": "9" * 64,
            "lid": "22 axes measured · not a certificate.", "board": {"issuer": "CSOAI Ltd"},
            "claim_maintenance": spray.read_claim_maintenance()}


def test_kaggle_page_text_is_derived_from_the_truth_only():
    truth = _truth()
    subtitle, description = spray.kaggle_page_text(truth)
    assert "2026-09-14T03:12:56Z" in subtitle
    cm = truth["claim_maintenance"]
    # the page names the category and links it, at the register's own as_of — not this run's clock
    assert cm["spec"]["name"] in description and cm["spec"]["canonical_url"] in description
    assert cm["spec"]["doi_url"] in description and cm["register_as_of"] in description
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
