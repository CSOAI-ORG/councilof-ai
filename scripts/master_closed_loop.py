#!/usr/bin/env python3
"""Closed-loop integrity stage v0.2 (NOT a model-evaluation or FIX executor).

Explicit migration from v0.1. Never rewrites historical/public cards. Imports
source declarations, stores immutable exact-byte records, optionally signs with
an explicitly supplied harvest key, builds verifiable inclusion proofs, and
prepares a real Rekor entry. Network witness submission is separate and disabled
here. Use a maintained external witness worker for public submission/verification.

The payload, signature, proof, and witness receipt are separate files. A new
receipt can never change bytes already signed or timestamped. Default output is
private staging, not the public website. All JSON output is a new local format,
NOT an implicit change to the existing board/COSE/3KB credential contract.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import math
import os
import pathlib
import re
import stat
import sys
import tempfile
from dataclasses import dataclass
from typing import Any, Iterable

GOALS = frozenset((
    'asset_classification', 'actor_identity', 'jurisdiction', 'disclosure',
    'custody', 'transaction_integrity', 'market_integrity',
    'customer_protection', 'reserves_collateral', 'settlement',
    'agent_authority', 'provenance', 'assurance', 'change',
))
SCHEME = 'csoai-rfc6962-sha256-batch-v2'
MAX_RECORD_BYTES = 2_000_000
MAX_RECORDS = 10_000
COMPACT_LIMIT = 3_000  # bytes, intentionally not an assumed existing COSE limit


class IntegrityError(ValueError):
    pass


def _check_json(value: Any) -> None:
    if isinstance(value, dict):
        if not all(isinstance(k, str) for k in value):
            raise IntegrityError('JSON object keys must be strings')
        for item in value.values():
            _check_json(item)
    elif isinstance(value, (list, tuple)):
        for item in value:
            _check_json(item)
    elif isinstance(value, float) and not math.isfinite(value):
        raise IntegrityError('non-finite numeric value')
    elif value is not None and not isinstance(value, (str, bool, int, float)):
        raise IntegrityError(f'unsupported JSON value: {type(value).__name__}')


def encoded(value: Any) -> bytes:
    """Local encoding profile; NOT advertised as RFC 8785/JCS.

    Sign and verify these exact bytes, rather than reserializing in another
    language. Reject non-finite numbers and non-string keys before serialization.
    """
    _check_json(value)
    return json.dumps(value, sort_keys=True, separators=(',', ':'),
                      ensure_ascii=False, allow_nan=False).encode('utf-8')


def strict_load(raw: bytes) -> Any:
    if len(raw) > 32_000_000:
        raise IntegrityError('input exceeds 32 MB cap')
    def unique(items):
        result = {}
        for key, value in items:
            if key in result:
                raise IntegrityError(f'duplicate JSON key: {key}')
            result[key] = value
        return result
    def bad_constant(value):
        raise IntegrityError(f'invalid JSON constant: {value}')
    result = json.loads(raw, object_pairs_hook=unique, parse_constant=bad_constant)
    _check_json(result)
    return result


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def require_digest(value: str) -> str:
    if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{64}', value):
        raise IntegrityError('expected lowercase SHA-256 digest')
    return value


def first_present(mapping: dict, *keys: str, default=None):
    """Preserve a real zero, false, empty list, or empty measurement object."""
    for key in keys:
        if key in mapping and mapping[key] is not None:
            return mapping[key]
    return default


def immutable_write(path: pathlib.Path, raw: bytes) -> bool:
    """Atomic no-overwrite publication on one local filesystem.

    Returns False on an identical replay. Refuses conflicting content. This is
    not a distributed queue or a network-filesystem transaction implementation.
    The staging root must be owned by the operating account, not an attacker.
    """
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if any(p.is_symlink() for p in (path, *path.parents)):
        raise IntegrityError('symlink in immutable artifact path')
    fd, tmp = tempfile.mkstemp(prefix='.csoai-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as out:
            out.write(raw)
            out.flush()
            os.fsync(out.fileno())
        try:
            os.link(tmp, path)  # atomic create-if-absent, never os.replace
            if os.name == 'posix':
                dfd = os.open(path.parent, os.O_RDONLY | getattr(os, 'O_DIRECTORY', 0))
                try:
                    os.fsync(dfd)
                finally:
                    os.close(dfd)
            return True
        except FileExistsError:
            if path.is_symlink() or path.read_bytes() != raw:
                raise IntegrityError(f'immutable-content conflict: {path.name}')
            return False
    finally:
        os.unlink(tmp)


def leaf_hash(raw: bytes) -> bytes:
    return hashlib.sha256(b'\x00' + raw).digest()


def parent_hash(left: bytes, right: bytes) -> bytes:
    return hashlib.sha256(b'\x01' + left + right).digest()


def merkle_root(leaves: list[bytes]) -> tuple[bytes, list[list[bytes]]]:
    """New v2 format: input order and RFC 6962 domain separation; promote odd node.

    This deliberately does NOT recompute or replace any old-format root.
    """
    if not leaves:
        return hashlib.sha256(b'').digest(), []
    layer = [leaf_hash(raw) for raw in leaves]
    layers = [layer]
    while len(layer) > 1:
        layer = [parent_hash(layer[i], layer[i+1]) if i+1 < len(layer) else layer[i]
                 for i in range(0, len(layer), 2)]
        layers.append(layer)
    return layer[0], layers


def inclusion_proof(index: int, layers: list[list[bytes]]) -> dict:
    if type(index) is not int or not layers or not 0 <= index < len(layers[0]):
        raise IntegrityError('leaf index out of range')
    original = index
    siblings = []
    for layer in layers[:-1]:  # siblings belong to the CURRENT level
        j = index ^ 1
        if j < len(layer):
            siblings.append(layer[j].hex())
        index //= 2
    return {'scheme': SCHEME, 'leaf_index': original,
            'tree_size': len(layers[0]), 'siblings': siblings}


def verify_inclusion(raw: bytes, proof: dict, root_hex: str) -> bool:
    try:
        require_digest(root_hex)
        if proof.get('scheme') != SCHEME:
            return False
        i, n = proof['leaf_index'], proof['tree_size']
        siblings = proof['siblings']
        if type(i) is not int or type(n) is not int or n < 1 or not 0 <= i < n:
            return False
        if not isinstance(siblings, list) or len(siblings) > 64:
            return False
        h = leaf_hash(raw)
        pos = 0
        while n > 1:
            if i & 1 or i + 1 < n:
                if pos >= len(siblings):
                    return False
                s = bytes.fromhex(require_digest(siblings[pos]))
                pos += 1
                h = parent_hash(s, h) if i & 1 else parent_hash(h, s)
            i //= 2
            n = (n + 1) // 2
        return pos == len(siblings) and h.hex() == root_hex
    except (KeyError, TypeError, ValueError, AttributeError):
        return False


@dataclass(frozen=True)
class HarvestSigner:
    private_key: Any

    @classmethod
    def from_file(cls, path: pathlib.Path):
        """No key creation, no HOME scanning, and no production-key discovery."""
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        path = pathlib.Path(path)
        if path.is_symlink():
            raise IntegrityError('key path must not be a symlink')
        fd = os.open(path, os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0))
        with os.fdopen(fd, 'rb') as stream:
            info = os.fstat(stream.fileno())
            if not stat.S_ISREG(info.st_mode):
                raise IntegrityError('key must be a regular file')
            if os.name == 'posix' and (info.st_mode & 0o077):
                raise IntegrityError('key permissions must exclude group and others')
            data = stream.read(32_769)
        if len(data) > 32_768:
            raise IntegrityError('oversized key')
        key = serialization.load_pem_private_key(data, password=None)
        if not isinstance(key, Ed25519PrivateKey):
            raise IntegrityError('explicit harvest key must be Ed25519')
        return cls(key)

    @property
    def public_pem(self) -> bytes:
        from cryptography.hazmat.primitives import serialization
        return self.private_key.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)

    @property
    def key_id(self) -> str:
        from cryptography.hazmat.primitives import serialization
        der = self.private_key.public_key().public_bytes(
            serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
        return 'sha256:' + sha256(der)

    def sign(self, raw: bytes) -> dict:
        return {'schema': 'csoai.detached-harvest-signature/0.2',
                'scope': 'harvest-stage-not-board', 'algorithm': 'Ed25519',
                'artifact_sha256': sha256(raw), 'artifact_bytes': len(raw),
                'key_id': self.key_id,
                'public_key_pem': self.public_pem.decode('ascii'),
                'signature_b64': base64.b64encode(self.private_key.sign(raw)).decode('ascii')}


def verify_signature(raw: bytes, receipt: dict, trusted_key_ids: Iterable[str] = ()) -> dict:
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    try:
        if (receipt.get('schema') != 'csoai.detached-harvest-signature/0.2'
            or receipt.get('algorithm') != 'Ed25519'
            or receipt.get('scope') != 'harvest-stage-not-board'
            or receipt.get('artifact_sha256') != sha256(raw)
            or receipt.get('artifact_bytes') != len(raw)):
            raise IntegrityError('signature binding mismatch')
        pub = serialization.load_pem_public_key(receipt['public_key_pem'].encode('ascii'))
        if not isinstance(pub, Ed25519PublicKey):
            raise IntegrityError('wrong public-key algorithm')
        der = pub.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
        key_id = 'sha256:' + sha256(der)
        if receipt['key_id'] != key_id:
            raise IntegrityError('key identifier mismatch')
        pub.verify(base64.b64decode(receipt['signature_b64'], validate=True), raw)
        return {'signature': 'VALID', 'signer_authority':
                'ALLOWLISTED_HARVEST_KEY' if key_id in set(trusted_key_ids)
                else 'NOT_ESTABLISHED', 'scope': 'harvest-stage-not-board'}
    except (IntegrityError, InvalidSignature, ValueError, TypeError, KeyError, UnicodeError):
        return {'signature': 'INVALID', 'signer_authority': 'NOT_ESTABLISHED'}



def verify_record_bundle(raw: bytes, batch_raw: bytes, proof: dict,
                         artifact_signature: dict | None = None,
                         batch_signature: dict | None = None,
                         trusted_key_ids: Iterable[str] = ()) -> dict:
    """Verify bindings across payload, batch, indexed proof and optional signatures.

    Hash/proof validity is not operator identity or evidence of model behaviour.
    A caller obtains the trusted key allowlist out of band, not from this bundle.
    """
    try:
        batch = strict_load(batch_raw)
        if (not isinstance(batch, dict)
            or batch.get('schema') != 'csoai.harvest-batch/0.2'
            or batch.get('merkle_scheme') != SCHEME):
            raise IntegrityError('unsupported batch schema')
        root_hex = require_digest(batch['root'])
        hashes = batch['artifact_sha256s']
        if not isinstance(hashes, list) or not all(isinstance(h, str) for h in hashes):
            raise IntegrityError('invalid artifact hash list')
        for h in hashes:
            require_digest(h)
        if len(set(hashes)) != len(hashes) or hashes != sorted(hashes):
            raise IntegrityError('batch must contain sorted distinct artifact hashes')
        i = proof['leaf_index']
        if (type(i) is not int or not 0 <= i < len(hashes)
            or type(batch['tree_size']) is not int
            or batch['tree_size'] != len(hashes)
            or proof['tree_size'] != batch['tree_size']
            or proof['artifact_sha256'] != sha256(raw)
            or hashes[i] != sha256(raw)
            or proof['batch_sha256'] != sha256(batch_raw)
            or proof['root'] != root_hex
            or not verify_inclusion(raw, proof, root_hex)):
            raise IntegrityError('bundle binding mismatch')
        trusted = tuple(trusted_key_ids)
        unsigned = {'signature': 'UNSIGNED', 'signer_authority': 'NOT_ESTABLISHED'}
        return {'binding': 'VALID',
                'artifact_signature': verify_signature(raw, artifact_signature, trusted) if artifact_signature else unsigned,
                'batch_signature': verify_signature(batch_raw, batch_signature, trusted) if batch_signature else unsigned,
                'external_timestamp': 'NOT_VERIFIED', 'factual_truth': 'NOT_DETERMINED'}
    except (KeyError, TypeError, ValueError, AttributeError, RecursionError):
        return {'binding': 'INVALID', 'external_timestamp': 'NOT_VERIFIED',
                'factual_truth': 'NOT_DETERMINED'}

def prepare_rekor_entry(raw: bytes, receipt: dict) -> dict:
    """Prepare a v1 rekord entry; do NOT send it or claim log inclusion.

    Ed25519 signs exact message bytes. It is not the original fabricated
    hashedrekord entry. Use supported DSSE/v2 tooling for a future migration.
    """
    if verify_signature(raw, receipt)['signature'] != 'VALID':
        raise IntegrityError('refusing to prepare Rekor entry for an invalid signature')
    return {'apiVersion': '0.0.1', 'kind': 'rekord', 'spec': {
        'data': {'content': base64.b64encode(raw).decode('ascii')},
        'signature': {'format': 'x509', 'content': receipt['signature_b64'],
                      'publicKey': {'content': base64.b64encode(
                          receipt['public_key_pem'].encode('ascii')).decode('ascii')}}}}


def observe_witness_attempt(kind: str, raw: bytes, transport_state: str,
                            receipt: bytes | None = None) -> dict:
    """Transport response is never promoted to cryptographic proof.

    The supported transports are NOT implemented in this stage. A separate
    worker must retain/verify actual Rekor checkpoints or actual OTS proofs.
    """
    if kind not in ('ots', 'rekor') or transport_state not in (
            'NOT_REQUESTED', 'SUBMITTED', 'FAILED', 'RECEIVED'):
        raise IntegrityError('unknown witness state')
    if transport_state == 'RECEIVED' and not receipt:
        raise IntegrityError('received state requires receipt bytes')
    return {'witness': kind, 'artifact_sha256': sha256(raw),
            'transport_state': transport_state,
            'receipt_sha256': sha256(receipt) if receipt is not None else None,
            'cryptographic_state': 'UNCHECKED', 'bitcoin_confirmation': 'NOT_ESTABLISHED'}


def compact_reference(record_hash: str, batch_hash: str, root_hex: str,
                      signed: bool, limit: int = COMPACT_LIMIT) -> bytes:
    for value in (record_hash, batch_hash, root_hex):
        require_digest(value)
    view = {'schema': 'csoai.compact-evidence-pointer/0.2',
            'artifact': 'sha256:' + record_hash, 'batch': 'sha256:' + batch_hash,
            'root': root_hex, 'merkle_scheme': SCHEME,
            'signature': 'DETACHED_RECEIPT_AVAILABLE' if signed else 'UNSIGNED',
            'signer_authority': 'NOT_ESTABLISHED',
            'external_witness': 'NOT_REQUESTED',
            'is_new_model_measurement': False,
            'note': 'Pointer only; fetch full record, signature and inclusion proof to verify.'}
    raw = encoded(view)
    if type(limit) is not int or limit < 1 or len(raw) > limit:
        raise IntegrityError('compact pointer exceeds byte limit; evidence was not truncated')
    return raw


def records_from_harness(harness: dict) -> list[dict]:
    """Import declarations, not invented executions or model scores.

    Preserve full source mapping and zero values. Do not silently interpret an
    unknown goal as a new goal or merge two distinct sources named '?'.
    """
    if not isinstance(harness, dict):
        raise IntegrityError('harness must be an object')
    sources = harness.get('sources_bound_to_harness')
    if not isinstance(sources, list) or len(sources) > MAX_RECORDS:
        raise IntegrityError('sources list missing or too large')
    records = []
    for i, source in enumerate(sources):
        if not isinstance(source, dict):
            raise IntegrityError(f'source {i} is not an object')
        name = first_present(source, 'source', 'name', 'id')
        if not isinstance(name, str) or not name.strip() or name.strip() == '?':
            raise IntegrityError(f'source {i} has no stable name')
        goals = source.get('goal_objects', [])
        if not isinstance(goals, list) or not all(isinstance(g, str) for g in goals):
            raise IntegrityError(f'source {i} has invalid goals')
        unknown = sorted(set(goals) - GOALS)
        if unknown:
            raise IntegrityError(f'source {i} mixes unknown goal IDs: {unknown}')
        records.append({'schema': 'csoai.harvest-declaration/0.2',
                        'observation_kind': 'source-declaration',
                        'measurement_performed': False,
                        'source_name': name,
                        'source_snapshot_sha256': sha256(encoded(source)),
                        'source_declared_as_of': first_present(source, 'as_of', default=harness.get('generated_at')),
                        'declared_value': first_present(source, 'measurement', 'enumerated_count', 'axis_state'),
                        'source_record': source})
    return records


def run_loop(records: list[dict], outdir: pathlib.Path,
             signer: HarvestSigner | None = None) -> dict:
    """Idempotent immutable local integrity stage. No publishing/network calls."""
    if not records or len(records) > MAX_RECORDS:
        raise IntegrityError('empty or oversized batch')
    raws = [encoded(r) for r in records]
    if any(len(r) > MAX_RECORD_BYTES for r in raws):
        raise IntegrityError('oversized record')
    # Dedupe exact copies; multiple references do not become extra observations.
    pairs = sorted({sha256(raw): raw for raw in raws}.items())
    hashes = [h for h, _ in pairs]
    ordered = [r for _, r in pairs]
    root, layers = merkle_root(ordered)
    batch = {'schema': 'csoai.harvest-batch/0.2', 'merkle_scheme': SCHEME,
             'root': root.hex(), 'tree_size': len(ordered), 'artifact_sha256s': hashes,
             'scope': 'exact-byte inclusion; neither factual truth nor a timestamp'}
    batch_raw = encoded(batch)
    batch_id = sha256(batch_raw)
    created = 0
    for i, (digest, raw) in enumerate(pairs):
        created += int(immutable_write(outdir / 'objects' / (digest + '.json'), raw))
        proof = inclusion_proof(i, layers)
        if not verify_inclusion(raw, proof, root.hex()):
            raise IntegrityError('self-verification failed before storing proof')
        proof.update(artifact_sha256=digest, batch_sha256=batch_id, root=root.hex())
        immutable_write(outdir / 'proofs' / batch_id / (digest + '.json'), encoded(proof))
        if signer is not None:
            sig = signer.sign(raw)
            if verify_signature(raw, sig)['signature'] != 'VALID':
                raise IntegrityError('local signature self-check failed')
            immutable_write(outdir / 'signatures' / signer.key_id.split(':')[1] / (digest + '.json'), encoded(sig))
        immutable_write(outdir / 'views' / batch_id / (digest + ('.signed' if signer else '.unsigned') + '.json'),
                        compact_reference(digest, batch_id, root.hex(), signer is not None))
    immutable_write(outdir / 'batches' / (batch_id + '.json'), batch_raw)
    if signer is not None:
        sig = signer.sign(batch_raw)
        key = signer.key_id.split(':')[1]
        immutable_write(outdir / 'batch-signatures' / key / (batch_id + '.json'), encoded(sig))
        # Raw aggregate is public-only after a separate disclosure gate.
        immutable_write(outdir / 'prepared-rekor' / key / (batch_id + '.json'),
                        encoded(prepare_rekor_entry(batch_raw, sig)))
    # Attempt metadata is returned, not spliced into any signed/timestamped file.
    return {'schema': 'csoai.integrity-stage-result/0.2', 'batch_sha256': batch_id,
            'root': root.hex(), 'records_received': len(records),
            'distinct_records': len(pairs), 'new_objects': created,
            'artifact_hashes_verified': len(pairs), 'inclusion_proofs_verified': len(pairs),
            'local_signatures_verified': len(pairs) if signer else 0,
            'board_signatures': 0, 'model_evaluations_executed': 0,
            'fixes_executed': 0, 'rekor': 'PREPARED_NOT_SUBMITTED' if signer else 'NOT_REQUESTED',
            'ots': 'NOT_REQUESTED', 'publications': 0}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--harness', default='public/interop/master-harness-index-v0.4.json')
    ap.add_argument('--out', default='var/csoai/closed-loop-v0.2')
    ap.add_argument('--harvest-key', help='explicit local Ed25519 PKCS8 PEM, never created automatically')
    args = ap.parse_args(argv)
    try:
        out = pathlib.Path(args.out)
        if 'public' in out.parts:
            raise IntegrityError('this format is staging-only; publish through the existing reviewed adapter')
        source = pathlib.Path(args.harness)
        if source.stat().st_size > 32_000_000:
            raise IntegrityError('harness file exceeds input limit')
        records = records_from_harness(strict_load(source.read_bytes()))
        signer = HarvestSigner.from_file(pathlib.Path(args.harvest_key)) if args.harvest_key else None
        result = run_loop(records, out, signer)
        print(json.dumps(result, indent=2))
        return 0
    except (OSError, ValueError, ImportError, RecursionError) as exc:
        print(json.dumps({'state': 'BLOCKED', 'error': str(exc)[:400],
                          'network_calls': 0, 'publications': 0}), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
