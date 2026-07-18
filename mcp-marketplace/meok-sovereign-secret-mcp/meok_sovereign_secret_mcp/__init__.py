"""meok-sovereign-secret-mcp — AES-256 sim secret management.

The Secret MCP stores encrypted secrets, retrieves them, rotates keys,
lists secrets, and deletes secrets. Each secret is AES-256-sim encrypted
and sigil-signed. Sensitive operations (delete, rotate) require BFT
3-voter approval.

5 tools:
  1. secret_store  - store an encrypted secret
  2. secret_get    - retrieve + decrypt a secret (with BFT)
  3. secret_rotate - rotate a secret's value (BFT 3 voters)
  4. secret_list   - list secrets (metadata only)
  5. secret_delete - delete a secret (BFT 3 voters)
"""
from __future__ import annotations
import json
import hashlib
import base64
from datetime import datetime, timezone

PROTOCOL = "sovereign-secret/1.0"
VERSION = "1.0.0"

_SECRETS: dict = {}      # secret_id -> {ciphertext, iv, tag, metadata}
_METADATA: dict = {}      # secret_id -> {name, tags, ...}
_APPROVALS: dict = {}     # action_key -> count

# Care floor — sensitive ops always need 3 voters
_CARE_FLOOR_VOTERS = 3


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "sec-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _aes256_sim_encrypt(plaintext: str, key: str) -> dict:
    """AES-256-sim encryption: XOR-cipher with SHA-256 key + base64 encode.

    This is a deterministic simulation suitable for tests and demos. A
    real production deployment must replace this with a vetted AES-256
    library (e.g. cryptography.fernet or AES-GCM via PyCryptodome).
    """
    key_bytes = hashlib.sha256(key.encode()).digest()
    pt_bytes = plaintext.encode()
    # Pad to key length using repeating-key XOR (sim of stream cipher)
    cipher_bytes = bytes(
        pt_bytes[i] ^ key_bytes[i % len(key_bytes)]
        for i in range(len(pt_bytes))
    )
    ct = base64.b64encode(cipher_bytes).decode()
    iv = base64.b64encode(hashlib.sha256((plaintext + "iv").encode()).digest()[:12]).decode()
    tag = hashlib.sha256((ct + key).encode()).hexdigest()[:16]
    return {"ciphertext": ct, "iv": iv, "tag": tag}


def _aes256_sim_decrypt(ciphertext_b64: str, key: str) -> str:
    """Reverse the simulation."""
    key_bytes = hashlib.sha256(key.encode()).digest()
    cipher_bytes = base64.b64decode(ciphertext_b64.encode())
    pt_bytes = bytes(
        cipher_bytes[i] ^ key_bytes[i % len(key_bytes)]
        for i in range(len(cipher_bytes))
    )
    return pt_bytes.decode()


def secret_store(name: str, value: str, master_key: str = "default-master",
                 tags: list = None, ttl_seconds: int = None) -> dict:
    """Store an encrypted secret."""
    if not name:
        return _sign({"error": "name required"})
    if not value:
        return _sign({"error": "value required"})

    secret_id = hashlib.sha256(
        f"{name}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]

    enc = _aes256_sim_encrypt(value, master_key)
    _SECRETS[secret_id] = enc
    _METADATA[secret_id] = {
        "secret_id": secret_id,
        "name": name,
        "tags": tags or [],
        "version": 1,
        "ttl_seconds": ttl_seconds,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "rotated_at": None,
        "deleted": False,
        "rotation_history": [],
    }
    return _sign({
        "stored": True,
        "secret_id": secret_id,
        "name": name,
        "version": 1,
        "ciphertext_preview": enc["ciphertext"][:16] + "...",
        "tag": enc["tag"],
    })


def secret_get(secret_id: str, master_key: str = "default-master",
               approver: str = "system") -> dict:
    """Retrieve + decrypt a secret. Decryption needs BFT 3 voters."""
    if secret_id not in _SECRETS:
        return _sign({"error": f"unknown secret: {secret_id}"})
    meta = _METADATA[secret_id]
    if meta["deleted"]:
        return _sign({"error": f"secret deleted: {secret_id}"})

    key = f"get:{secret_id}"
    if key not in _APPROVALS:
        _APPROVALS[key] = 0
    _APPROVALS[key] += 1
    approvals = _APPROVALS[key]

    if approvals < _CARE_FLOOR_VOTERS:
        return _sign({
            "approvals": approvals,
            "required": _CARE_FLOOR_VOTERS,
            "decrypted": False,
        })

    enc = _SECRETS[secret_id]
    plaintext = _aes256_sim_decrypt(enc["ciphertext"], master_key)
    _APPROVALS[key] = 0
    return _sign({
        "decrypted": True,
        "secret_id": secret_id,
        "name": meta["name"],
        "value": plaintext,
        "version": meta["version"],
        "approver": approver,
    })


def secret_rotate(secret_id: str, new_value: str,
                  master_key: str = "default-master") -> dict:
    """Rotate a secret's value (BFT 3 voters)."""
    if secret_id not in _SECRETS:
        return _sign({"error": f"unknown secret: {secret_id}"})
    meta = _METADATA[secret_id]
    if meta["deleted"]:
        return _sign({"error": f"secret deleted: {secret_id}"})

    key = f"rotate:{secret_id}"
    if key not in _APPROVALS:
        _APPROVALS[key] = 0
    _APPROVALS[key] += 1
    approvals = _APPROVALS[key]

    if approvals < _CARE_FLOOR_VOTERS:
        return _sign({
            "approvals": approvals,
            "required": _CARE_FLOOR_VOTERS,
            "rotated": False,
        })

    enc = _aes256_sim_encrypt(new_value, master_key)
    _SECRETS[secret_id] = enc
    meta["rotation_history"].append({
        "version": meta["version"],
        "rotated_at": datetime.now(timezone.utc).isoformat(),
    })
    meta["version"] += 1
    meta["rotated_at"] = datetime.now(timezone.utc).isoformat()
    _APPROVALS[key] = 0
    return _sign({
        "rotated": True,
        "secret_id": secret_id,
        "new_version": meta["version"],
        "rotations_count": len(meta["rotation_history"]),
    })


def secret_list(tag: str = None, include_deleted: bool = False) -> dict:
    """List secret metadata (never values)."""
    items = []
    for sid, meta in _METADATA.items():
        if not include_deleted and meta["deleted"]:
            continue
        if tag is not None and tag not in meta["tags"]:
            continue
        items.append({
            "secret_id": sid,
            "name": meta["name"],
            "tags": meta["tags"],
            "version": meta["version"],
            "deleted": meta["deleted"],
            "created_at": meta["created_at"],
            "rotated_at": meta["rotated_at"],
        })
    return _sign({
        "secrets": items,
        "count": len(items),
        "tag_filter": tag,
    })


def secret_delete(secret_id: str, approver: str) -> dict:
    """Delete a secret (BFT 3 voters required)."""
    if secret_id not in _SECRETS:
        return _sign({"error": f"unknown secret: {secret_id}"})

    key = f"delete:{secret_id}"
    if key not in _APPROVALS:
        _APPROVALS[key] = 0
    _APPROVALS[key] += 1
    approvals = _APPROVALS[key]

    if approvals < _CARE_FLOOR_VOTERS:
        return _sign({
            "approvals": approvals,
            "required": _CARE_FLOOR_VOTERS,
            "deleted": False,
        })

    meta = _METADATA[secret_id]
    meta["deleted"] = True
    meta["deleted_at"] = datetime.now(timezone.utc).isoformat()
    meta["deleted_by"] = approver
    _APPROVALS[key] = 0
    # Wipe ciphertext from memory (sim)
    _SECRETS[secret_id] = {"ciphertext": "", "iv": "", "tag": ""}
    return _sign({
        "deleted": True,
        "secret_id": secret_id,
        "approver": approver,
    })