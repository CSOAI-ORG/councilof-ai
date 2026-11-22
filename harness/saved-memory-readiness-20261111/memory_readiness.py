"""Read-only availability hint for the existing saved-conversation service.

This never authenticates, writes, mounts storage, configures a service, or grants
permission. Each real operation still uses its existing current-request checks.
An accessible mount is not a completed persistence or durability qualification.
"""
from __future__ import annotations

import os
from pathlib import PurePosixPath
from typing import Callable, Mapping, Any

_MESSAGES = {
    "NOT_CONFIGURED": "Saved copies are unavailable: persistent storage is not configured. Chat and device exports remain available.",
    "INVALID_CONFIGURATION": "Saved copies are unavailable: the storage configuration needs operator review. Chat and device exports remain available.",
    "MOUNT_UNAVAILABLE": "Saved copies are unavailable: the configured mount could not be checked. Chat and device exports remain available.",
    "MOUNT_READ_ONLY": "Saved copies are unavailable: the configured mount is read-only. Chat and device exports remain available.",
    "MOUNT_ACCESSIBLE_UNQUALIFIED": "A writable-mode mount is present. Sign in before using saved copies; each operation still verifies your account and confirms its own result. This availability check did not test a write or restart durability.",
}


def _result(state: str) -> dict[str, Any]:
    return {
        "state": state,
        "can_attempt": state == "MOUNT_ACCESSIBLE_UNQUALIFIED",
        "message": _MESSAGES[state],
        "identity_verified": False,
        "write_performed": False,
        "durability_qualified": False,
        "execution_authority": False,
        "gspc_admitted": False,
    }


def assess_storage(*, environ: Mapping[str, str] | None = None,
                   store_factory: Callable[[], Any] | None = None) -> dict[str, Any]:
    """Inspect only trusted server configuration and the existing root opener.

    `environ` and `store_factory` are host/test injection seams, never user API
    parameters. Reuse SnapshotStore._root() so its ancestor/symlink validation
    stays controlling. Do not inspect account records or expose configuration.
    """
    config = os.environ if environ is None else environ
    root = config.get("MEOK_MEMORY_ROOT", "")
    if root is None or root == "":
        return _result("NOT_CONFIGURED")
    if (not isinstance(root, str) or "\x00" in root
            or not PurePosixPath(root).is_absolute()
            or ".." in PurePosixPath(root).parts):
        return _result("INVALID_CONFIGURATION")
    try:
        if store_factory is None:
            from memory_store import configured_store
            store_factory = configured_store
        store = store_factory()
        # Do not let a testing backend with require_mount=False appear qualified.
        if getattr(store, "require_mount", None) is not True:
            return _result("INVALID_CONFIGURATION")
        if PurePosixPath(str(store.root)) != PurePosixPath(root):
            return _result("INVALID_CONFIGURATION")
        with store._root() as fd:
            flags = os.fstatvfs(fd).f_flag
            if flags & os.ST_RDONLY:
                return _result("MOUNT_READ_ONLY")
        return _result("MOUNT_ACCESSIBLE_UNQUALIFIED")
    except Exception:
        # Paths, credentials and raw transport/backend errors stay private.
        return _result("MOUNT_UNAVAILABLE")
