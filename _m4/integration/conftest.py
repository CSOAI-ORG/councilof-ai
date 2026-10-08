"""Shared fixtures for the _m4 integration tests.

Each test session gets a fresh, isolated SQLite database for both the
Sovereign DB and the Witness DB. The tests do NOT mock the canonical
modules — they use the real `sovereign_db` and `witness_store` modules,
just pointed at temp files via env vars.
"""
from __future__ import annotations

import importlib
import os
import sys
import shutil
import tempfile
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# 1. Isolate the Sovereign DB + Witness DB under a tempdir
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def _isolate_substrate():
    """Point the sovereign_db and witness_store modules at fresh temp DBs."""
    tmp = Path(tempfile.mkdtemp(prefix="m4_integration_"))
    sov_db = tmp / "sovereign.db"
    wit_db = tmp / "witness.db"

    # Set the env vars BEFORE importing the modules
    os.environ["MEOK_DB_PATH"] = str(sov_db)
    # Witness reads DB_PATH from a module-level constant; we have to override
    os.environ["MEOK_WITNESS_DB_PATH"] = str(wit_db)
    # SIGIL key: a temp key file, never an env key or the developer's ~/.config key
    os.environ.pop("MEOK_SIGIL_SECRET", None)
    os.environ["MEOK_SIGIL_KEY_FILE"] = str(tmp / "sigil.key")

    # Make meok-backend importable
    mb = Path("/Users/nicholas/clawd/meok-backend")
    if str(mb) not in sys.path:
        sys.path.insert(0, str(mb))

    # Make csoai-os/mcp importable (for sovereign33_sdk + watchdog MCP)
    csoai_mcp = Path("/Users/nicholas/clawd/csoai-os/mcp")
    if str(csoai_mcp) not in sys.path:
        sys.path.insert(0, str(csoai_mcp))

    # Make the watchdog package importable
    watchdog_pkg = Path("/Users/nicholas/clawd/csoai-os/mcp/watchdog")
    if str(watchdog_pkg) not in sys.path:
        sys.path.insert(0, str(watchdog_pkg))

    # Reload the witness_store module after pointing its DB_PATH at our temp file
    import witness_store as _wmod
    if "witness_store" in sys.modules:
        importlib.reload(_wmod)
    _wmod.DB_PATH = wit_db
    if hasattr(_wmod, "DB_PATH"):
        # The module also reads DB_PATH elsewhere; force re-init
        _wmod.init_db()

    # Clear sovereign_db cached state too
    import sovereign_db as _smod
    if "sovereign_db" in sys.modules:
        importlib.reload(_smod)
    _smod.DB_PATH = str(sov_db)

    # Pre-init both DBs
    _smod.get_db()  # runs the schema
    _wmod.init_db()

    yield {"sov_db": sov_db, "wit_db": wit_db, "tmp": tmp}

    # Cleanup
    shutil.rmtree(tmp, ignore_errors=True)


# ---------------------------------------------------------------------------
# 2. Convenience fixtures — the canonical modules pre-imported
# ---------------------------------------------------------------------------
@pytest.fixture
def sdb():
    """The sovereign_db module (after isolation)."""
    import sovereign_db
    return sovereign_db


@pytest.fixture
def wstore():
    """The witness_store module."""
    import witness_store
    return witness_store


@pytest.fixture
def witness():
    """A fresh SovereignWitness instance."""
    import witness_store
    return witness_store.SovereignWitness()


@pytest.fixture
def s33():
    """The sovereign33 SDK module."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "sovereign33_sdk",
        "/Users/nicholas/clawd/csoai-os/mcp/sovereign33_sdk.py",
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture
def watchdog_mcp():
    """The sovereign_watchdog_mcp module (note the leading space in filename)."""
    import importlib.util
    src = "/Users/nicholas/clawd/csoai-os/mcp/watchdog/so Sovereign_watchdog_mcp.py"
    spec = importlib.util.spec_from_file_location("sovereign_watchdog_mcp", src)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
