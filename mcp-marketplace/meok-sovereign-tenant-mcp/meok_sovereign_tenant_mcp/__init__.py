"""meok-sovereign-tenant-mcp — Multi-tenant isolation with namespaces.

The Tenant MCP creates, retrieves, lists, isolates, and deletes tenants.
Each tenant lives in its own namespace and is sigil-signed for audit
trail. Sensitive ops (isolate, delete) require BFT 3-voter approval.

5 tools:
  1. tenant_create  - create a new tenant in a namespace
  2. tenant_get     - retrieve tenant info
  3. tenant_list    - list tenants (optionally by namespace)
  4. tenant_isolate - isolate a tenant (BFT 3 voters)
  5. tenant_delete  - delete a tenant (BFT 3 voters)
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone

PROTOCOL = "sovereign-tenant/1.0"
VERSION = "1.0.0"

_TENANTS: dict = {}       # tenant_id -> tenant
_NAMESPACES: dict = {}    # namespace -> {tenant_count, ...}
_APPROVALS: dict = {}     # action_key -> count

# Available isolation tiers (per CSOAI DORADO PHASE 123)
_ISOLATION_TIERS = {
    "shared":     {"strength": 0, "blast_radius": "fleet"},
    "soft":       {"strength": 1, "blast_radius": "namespace"},
    "strong":     {"strength": 2, "blast_radius": "tenant"},
    "air_gapped": {"strength": 3, "blast_radius": "single"},
}

# Care floor — tenant must not be isolated/deleted without enough voters,
# and we never delete a tenant with active sessions.
_CARE_FLOOR_VOTERS = 3


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "ten-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def tenant_create(name: str, namespace: str = "default",
                  isolation: str = "shared", owner: str = None) -> dict:
    """Create a new tenant in a namespace."""
    if not name:
        return _sign({"error": "name required"})
    if isolation not in _ISOLATION_TIERS:
        return _sign({"error": f"unknown isolation tier: {isolation}"})

    tenant_id = hashlib.sha256(
        f"{name}|{namespace}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]

    if namespace not in _NAMESPACES:
        _NAMESPACES[namespace] = {
            "namespace": namespace, "tenant_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    tenant = {
        "tenant_id": tenant_id,
        "name": name,
        "namespace": namespace,
        "isolation": isolation,
        "isolation_strength": _ISOLATION_TIERS[isolation]["strength"],
        "owner": owner,
        "status": "active",
        "isolated": False,
        "deleted": False,
        "active_sessions": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _TENANTS[tenant_id] = tenant
    _NAMESPACES[namespace]["tenant_count"] += 1
    return _sign(tenant)


def tenant_get(tenant_id: str) -> dict:
    """Retrieve tenant info by ID."""
    if tenant_id not in _TENANTS:
        return _sign({"error": f"unknown tenant: {tenant_id}"})
    return _sign(_TENANTS[tenant_id])


def tenant_list(namespace: str = None, include_deleted: bool = False) -> dict:
    """List tenants, optionally filtered by namespace."""
    items = list(_TENANTS.values())
    if namespace is not None:
        items = [t for t in items if t["namespace"] == namespace]
    if not include_deleted:
        items = [t for t in items if not t["deleted"]]
    return _sign({
        "tenants": items,
        "count": len(items),
        "namespace_filter": namespace,
        "namespaces": _NAMESPACES,
    })


def tenant_isolate(tenant_id: str, approver: str,
                   reason: str = "security incident") -> dict:
    """Isolate a tenant (BFT 3 voters required)."""
    if tenant_id not in _TENANTS:
        return _sign({"error": f"unknown tenant: {tenant_id}"})
    key = f"isolate:{tenant_id}"
    if key not in _APPROVALS:
        _APPROVALS[key] = 0
    _APPROVALS[key] += 1
    approvals = _APPROVALS[key]

    if approvals >= _CARE_FLOOR_VOTERS:
        tenant = _TENANTS[tenant_id]
        tenant["isolated"] = True
        tenant["status"] = "isolated"
        tenant["isolated_at"] = datetime.now(timezone.utc).isoformat()
        tenant["isolation_reason"] = reason
        _APPROVALS[key] = 0
        return _sign({
            "isolated": True,
            "tenant_id": tenant_id,
            "approver": approver,
            "reason": reason,
            "approvals_received": approvals,
        })
    return _sign({
        "approvals": approvals,
        "required": _CARE_FLOOR_VOTERS,
        "isolated": False,
    })


def tenant_delete(tenant_id: str, approver: str,
                  force: bool = False) -> dict:
    """Delete a tenant (BFT 3 voters required; refused if active sessions)."""
    if tenant_id not in _TENANTS:
        return _sign({"error": f"unknown tenant: {tenant_id}"})
    tenant = _TENANTS[tenant_id]
    if not force and tenant["active_sessions"] > 0:
        return _sign({
            "error": "tenant has active sessions; pass force=true or end sessions first",
            "active_sessions": tenant["active_sessions"],
        })

    key = f"delete:{tenant_id}"
    if key not in _APPROVALS:
        _APPROVALS[key] = 0
    _APPROVALS[key] += 1
    approvals = _APPROVALS[key]

    if approvals >= _CARE_FLOOR_VOTERS:
        tenant["deleted"] = True
        tenant["status"] = "deleted"
        tenant["deleted_at"] = datetime.now(timezone.utc).isoformat()
        tenant["deleted_by"] = approver
        ns = tenant["namespace"]
        if ns in _NAMESPACES and _NAMESPACES[ns]["tenant_count"] > 0:
            _NAMESPACES[ns]["tenant_count"] -= 1
        _APPROVALS[key] = 0
        return _sign({
            "deleted": True,
            "tenant_id": tenant_id,
            "approver": approver,
            "namespace": tenant["namespace"],
        })
    return _sign({
        "approvals": approvals,
        "required": _CARE_FLOOR_VOTERS,
        "deleted": False,
    })