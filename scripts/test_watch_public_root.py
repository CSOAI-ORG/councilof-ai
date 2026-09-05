import copy
import json
from pathlib import Path

import pytest

from watch_public_root import did_public_key, validate_root


ROOT = Path(__file__).resolve().parents[1]


def test_committed_root_is_semantically_and_cryptographically_valid():
    root = json.loads((ROOT / "public/root.json").read_text())
    did = json.loads((ROOT / "public/.well-known/did.json").read_text())
    assert len(validate_root(root, did_public_key(did))) == 64


def test_leaf_tamper_is_rejected_before_host_convergence():
    root = json.loads((ROOT / "public/root.json").read_text())
    did = json.loads((ROOT / "public/.well-known/did.json").read_text())
    tampered = copy.deepcopy(root)
    tampered["card_sha256"][0] = "00" * 32
    with pytest.raises(ValueError, match="merkle_root"):
        validate_root(tampered, did_public_key(did))
