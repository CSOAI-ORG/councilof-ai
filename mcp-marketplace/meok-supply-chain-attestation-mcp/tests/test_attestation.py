"""Tests for meok-supply-chain-attestation-mcp."""
import os, tempfile, hashlib, pytest

_TEST_DIR = tempfile.mkdtemp(prefix="sov_atst_test_")
os.environ["SOV_ATTESTATION_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_supply_chain_attestation_mcp import (
    sov_sbom, sov_attest, sov_verify_attestation, sov_anchor_bitcoin,
)


@pytest.fixture
def sample_artifact(tmp_path):
    p = tmp_path / "sample.bin"
    p.write_bytes(b"hello world" * 100)
    return str(p)


def test_sbom_cyclonedx(sample_artifact):
    r = sov_sbom(sample_artifact, format="cyclonedx")
    assert r["format"] == "cyclonedx"
    assert r["artifact_sha256"] == hashlib.sha256(b"hello world" * 100).hexdigest()
    assert r["body"]["bomFormat"] == "CycloneDX"
    assert "kid" in r and "sig" in r
    assert r["verify_url"].startswith("https://proofof.ai/attestation/")


def test_sbom_spdx(sample_artifact):
    r = sov_sbom(sample_artifact, format="spdx")
    assert r["format"] == "spdx"
    assert r["body"]["spdxVersion"] == "SPDX-2.3"


def test_sbom_invalid_format(sample_artifact):
    with pytest.raises(ValueError, match="Unknown format"):
        sov_sbom(sample_artifact, format="garbage")


def test_sbom_components(sample_artifact):
    components = [
        {"name": "requests", "version": "2.31.0", "purl": "pypi:requests@2.31.0"},
        {"name": "pydantic", "version": "2.0.0", "purl": "pypi:pydantic@2.0.0"},
    ]
    r = sov_sbom(sample_artifact, components=components)
    assert len(r["body"]["components"]) == 2


def test_attest_basic(sample_artifact):
    r = sov_attest(sample_artifact, builder_id="test-builder")
    assert r["predicateType"] == "https://slsa.dev/provenance/v1"
    assert r["subject"][0]["digest"]["sha256"] == hashlib.sha256(b"hello world" * 100).hexdigest()
    assert r["predicate"]["builder"]["id"] == "test-builder"
    assert r["predicate"]["metadata"]["reproducible"] is True
    assert "kid" in r and "sig" in r


def test_attest_chain_links(sample_artifact):
    a1 = sov_attest(sample_artifact, builder_id="b1")
    a2 = sov_attest(sample_artifact, builder_id="b2", prev_attestation_id=a1["attestation_id"])
    # chain_hash in a2 should reference a1
    assert a2["chain"]["prev_attestation_id"] == a1["attestation_id"]
    assert a1["chain"]["chain_hash"] != a2["chain"]["chain_hash"]


def test_attest_with_materials(sample_artifact):
    materials = [{"uri": "git+https://github.com/foo/bar", "digest": {"sha256": "abc123"}}]
    r = sov_attest(sample_artifact, materials=materials)
    assert r["predicate"]["materials"] == materials


def test_verify_attestation_valid(sample_artifact):
    a = sov_attest(sample_artifact)
    v = sov_verify_attestation(a)
    assert v["valid"] is True
    assert v["errors"] == []


def test_verify_attestation_tampered(sample_artifact):
    a = sov_attest(sample_artifact)
    a["predicate"]["builder"]["id"] = "evil-builder"
    v = sov_verify_attestation(a)
    assert v["valid"] is False


def test_anchor_bitcoin_no_cli(sample_artifact):
    a = sov_attest(sample_artifact)
    r = sov_anchor_bitcoin(a)
    assert r["attestation_hash"] == hashlib.sha256(json_canonical(a)).hexdigest()
    assert r["status"] in ("no_ots_cli", "would_anchor")


def json_canonical(d):
    import json
    return json.dumps(d, sort_keys=True, separators=(",", ":")).encode()


# Add the import for hashlib in test
import hashlib
