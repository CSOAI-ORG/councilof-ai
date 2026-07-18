#!/usr/bin/env python3
"""
sigil — public re-export shim for the api-gateway.

The api-gateway does ``from sigil import build_sigil_for_response,
verify_sigil, SIGIL_KEY_DIR``. In containers the real package is
mounted at ``/opt/_shared/sigil.py`` and ``/opt/openpatent-api/sigil.py``.
For local dev (macOS), this shim re-exports the real implementation
from ``services._shared.sigil`` under the names the gateway expects.

This file is a thin compat layer — all canonical logic lives in
``services/_shared/sigil.py``.
"""
from __future__ import annotations

import os
import sys as _sys

# Ensure the dev hive path resolves ``_shared`` as a package.
_THIS = os.path.dirname(os.path.abspath(__file__))
if _THIS not in _sys.path:
    _sys.path.insert(0, _THIS)

# In dev (macOS), /opt/_shared isn't writable. Redirect the key dir to
# a per-user location. In containers the real /opt/_shared is mounted
# writable, so we keep DEFAULT_KEY_DIR there.
_DEV_KEY_DIR = os.path.expanduser("~/.openpatent/sigil")
os.makedirs(_DEV_KEY_DIR, exist_ok=True)
os.environ.setdefault("SIGIL_KEY_DIR", _DEV_KEY_DIR)

from _shared.sigil import (  # noqa: E402,F401
    DEFAULT_KEY_DIR,
    DEFONEOS_SIG,
    SERVICE_VERSION_DEFAULTS,
    attach_sigil,
    build_sigil,
    fingerprint,
    init_keypair,
    load_keys,
    verify_sigil,
)

# Re-export the constants under the names the gateway imports.
SIGIL_KEY_DIR = os.environ.get("SIGIL_KEY_DIR", DEFAULT_KEY_DIR)


def build_sigil_for_response(
    payload,
    *,
    service: str = "openpatent-api",
    version: str = "1.0.0",
    agent_id: str = "gateway-1",
    action: str = "",
    trace_id: str = "",
    timestamp=None,
    prev_sigil_id: str = "",
):
    """Adapter matching the api-gateway's expected call shape.

    The real ``build_sigil`` already takes ``service``, ``version``,
    ``agent_id``, ``action``, ``trace_id`` and signs a canonical envelope
    over ``payload``. This wrapper just maps the gateway's keyword shape
    to the real implementation.
    """
    return build_sigil(
        payload,
        service=service,
        version=version,
        agent_id=agent_id,
        action=action,
        trace_id=trace_id,
        timestamp=timestamp,
        prev_sigil_id=prev_sigil_id,
    )


__all__ = [
    "build_sigil",
    "build_sigil_for_response",
    "verify_sigil",
    "attach_sigil",
    "init_keypair",
    "load_keys",
    "fingerprint",
    "SIGIL_KEY_DIR",
    "DEFAULT_KEY_DIR",
    "DEFONEOS_SIG",
    "SERVICE_VERSION_DEFAULTS",
]
