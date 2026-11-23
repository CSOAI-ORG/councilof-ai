#!/usr/bin/env python3
"""Offline capacity, immutability and negative-control tests for mill HF shards."""
import json
from pathlib import Path
import sys
import pytest

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
from hf.mill_evidence_overflow import (blob_sha1, destination, load_map,
                                       remap_files, source_for)
from hf.verify_mill_evidence_overflow import validate_local_source, verify_mirrors


def test_exact_source_inventory_and_bounded_shards():
    map_path = SCRIPTS / "hf" / "mill_evidence_overflow_map.json"
    raw = json.loads(map_path.read_text())
    entries = load_map(map_path)
    assert raw["source_commit"] == "5b7502e7432da957d59ba93f5b3b603c0db7932c"
    assert len(entries) == 3608
    assert sum(n.endswith(".json") for n in entries) == 2952
    assert sum(n.endswith(".jsonl") for n in entries) == 656
    physical = [destination(n, entries) for n in entries]
    assert len(physical) == len(set(physical))
    shards = {}
    for name in physical:
        assert name.startswith("interop/mill-evidence-shards/v1/")
        shard = name.split("/")[-2]
        shards[shard] = shards.get(shard, 0) + 1
    assert len(shards) == 16
    assert max(shards.values()) < 10000
    for logical in list(entries)[:4]:
        assert source_for(destination(logical, entries), entries) == logical


def test_fail_closed_on_unpinned_change_or_duplicate(tmp_path):
    name = "interop/mill-evidence/admission-0025079a5309.json"
    body = b'{"synthetic":"fixture"}'
    path = tmp_path / "fixture.json"
    path.write_bytes(body)
    entries = {name: blob_sha1(body)}
    mapped = remap_files({name: path}, entries)
    assert list(mapped) == ["interop/mill-evidence-shards/v1/0/admission-0025079a5309.json"]
    path.write_bytes(b"changed")
    with pytest.raises(ValueError, match="OID changed"):
        remap_files({name: path}, entries)


def test_unknown_paths_remain_original_and_manifest_refuses_traversal(tmp_path):
    entries = load_map()
    unknown = "interop/mill-evidence/legacy-signed-proof.json"
    assert destination(unknown, entries) == unknown
    raw = json.loads((SCRIPTS / "hf" / "mill_evidence_overflow_map.json").read_text())
    raw["entries"]["interop/mill-evidence/../../secrets.json"] = "f" * 40
    m = tmp_path / "evil.json"
    m.write_text(json.dumps(raw))
    with pytest.raises(ValueError, match="Invalid overflow-map file"):
        load_map(m)


def test_full_mirror_compare_refuses_missing_and_changed(tmp_path):
    name = "interop/mill-evidence/admission-0025079a5309.json"
    legacy = "interop/mill-evidence/admission-002b38d34e08.json"
    body = b'{"signed":false,"fixture":true}'
    old = b'{"legacy":true}'
    p = tmp_path / "new.json"
    q = tmp_path / "old.json"
    p.write_bytes(body)
    q.write_bytes(old)
    entries = {name: blob_sha1(body)}
    files = {name:p, legacy:q}
    validate_local_source(files, entries)
    overflow = {destination(name, entries):(blob_sha1(body),None)}
    original = {legacy:(blob_sha1(old),None)}
    failures, probes = verify_mirrors(files, entries, original, overflow)
    assert failures == [] and len(probes) == 1
    failures, _ = verify_mirrors(files, entries, original, {})
    assert failures == [name]
    failures, _ = verify_mirrors(files, entries, {legacy:("0" * 40,None)}, overflow)
    assert failures == [legacy]
    p.write_bytes(b"modified")
    with pytest.raises(ValueError, match="source mismatch"):
        validate_local_source(files, entries)
