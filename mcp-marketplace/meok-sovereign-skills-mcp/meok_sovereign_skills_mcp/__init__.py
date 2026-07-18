"""meok_sovereign_skills_mcp — Sovereign Skills MCP.

Lifecycle governance for agent skills (CREATE→EVAL→EDIT→REVIEW→PACKAGE).
5 tools:
  1. sov_skill_create - create a new skill (CREATE)
  2. sov_skill_evaluate - score a skill (EVAL)
  3. sov_skill_edit - edit a skill (EDIT)
  4. sov_skill_review - sign a review (REVIEW)
  5. sov_skill_package - package + export signed bundle (PACKAGE)
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-skills/0.1"

_SKILLS: dict = {}  # skill_id → skill dict


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_SKILLS_KEY") or os.path.expanduser("~/.meok/sov_skills_key.pem")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    priv = Ed25519PrivateKey.generate()
    with open(path, "wb") as f:
        f.write(priv.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return priv


def _sign(payload):
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "verify_url")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


def sov_skill_create(name: str, content: str, *, author: str = "sovereign", tags: Optional[list] = None) -> dict:
    """CREATE a new skill."""
    skill_id = hashlib.sha256(f"{name}|{author}".encode()).hexdigest()[:12]
    version = "0.1.0"
    skill = {
        "skill_id": skill_id,
        "name": name,
        "version": version,
        "author": author,
        "content": content,
        "tags": tags or [],
        "score": None,
        "reviews": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "stage": "created",
    }
    _SKILLS[skill_id] = skill

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "skill_id": skill_id,
        "name": name,
        "version": version,
        "author": author,
        "tags": skill["tags"],
        "stage": "created",
        "ts": skill["created_at"],
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/skills/{skill_id}"
    return signed


def sov_skill_evaluate(skill_id: str, *, score: float, criteria: Optional[dict] = None) -> dict:
    """EVAL a skill (0.0-1.0)."""
    if skill_id not in _SKILLS:
        return {"error": f"unknown skill: {skill_id}"}
    if not (0.0 <= score <= 1.0):
        return {"error": f"score must be 0-1, got {score}"}

    skill = _SKILLS[skill_id]
    skill["score"] = score
    skill["score_criteria"] = criteria or {}
    skill["stage"] = "evaluated"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "skill_id": skill_id,
        "score": score,
        "criteria": criteria or {},
        "stage": "evaluated",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/skills/{skill_id}/eval"
    return signed


def sov_skill_edit(skill_id: str, new_content: str, *, editor: str = "sovereign") -> dict:
    """EDIT a skill (creates a new version)."""
    if skill_id not in _SKILLS:
        return {"error": f"unknown skill: {skill_id}"}

    old = _SKILLS[skill_id]
    major, minor, patch = map(int, old["version"].split("."))
    new_version = f"{major}.{minor + 1}.{patch}"

    old["content"] = new_content
    old["version"] = new_version
    old["stage"] = "edited"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "skill_id": skill_id,
        "new_version": new_version,
        "editor": editor,
        "stage": "edited",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/skills/{skill_id}/edit"
    return signed


def sov_skill_review(skill_id: str, reviewer: str, verdict: str, *, comment: str = "") -> dict:
    """REVIEW a skill: approve | reject | needs_changes."""
    if skill_id not in _SKILLS:
        return {"error": f"unknown skill: {skill_id}"}
    if verdict not in ("approve", "reject", "needs_changes"):
        return {"error": f"invalid verdict: {verdict} (must be approve|reject|needs_changes)"}

    skill = _SKILLS[skill_id]
    skill["reviews"].append({
        "reviewer": reviewer,
        "verdict": verdict,
        "comment": comment,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    skill["stage"] = "reviewed"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "skill_id": skill_id,
        "reviewer": reviewer,
        "verdict": verdict,
        "review_count": len(skill["reviews"]),
        "stage": "reviewed",
        "ts": skill["reviews"][-1]["ts"],
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/skills/{skill_id}/review"
    return signed


def sov_skill_package(skill_id: str) -> dict:
    """PACKAGE: final signed bundle ready for distribution."""
    if skill_id not in _SKILLS:
        return {"error": f"unknown skill: {skill_id}"}

    skill = _SKILLS[skill_id]
    skill["stage"] = "packaged"

    pkg_id = hashlib.sha256(
        json.dumps({"skill": skill_id, "version": skill["version"]}, sort_keys=True).encode()
    ).hexdigest()[:12]

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "package_id": pkg_id,
        "skill_id": skill_id,
        "skill_version": skill["version"],
        "skill_name": skill["name"],
        "content_hash": hashlib.sha256(skill["content"].encode()).hexdigest(),
        "reviews_count": len(skill["reviews"]),
        "approved": any(r["verdict"] == "approve" for r in skill["reviews"]),
        "stage": "packaged",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/skills/{skill_id}/package/{pkg_id}"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_skill_create", description="CREATE a new skill.")(sov_skill_create)
    mcp.tool(name="sov_skill_evaluate", description="EVAL a skill (score 0-1).")(sov_skill_evaluate)
    mcp.tool(name="sov_skill_edit", description="EDIT a skill (bumps minor version).")(sov_skill_edit)
    mcp.tool(name="sov_skill_review", description="REVIEW: approve | reject | needs_changes.")(sov_skill_review)
    mcp.tool(name="sov_skill_package", description="PACKAGE: signed bundle for distribution.")(sov_skill_package)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-skills")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
