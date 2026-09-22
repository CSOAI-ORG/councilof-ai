#!/usr/bin/env python3
"""Resolve a named secret through the estate's own resolver, or fail out loud.

Order, first non-empty wins:

  1. the process environment;
  2. the pod resolver, `python3 /workspace/tools/csoai_keys.py --key NAME`
     (override the path with CSOAI_KEYS_TOOL);
  3. the keystone file `~/.csoai-keys.env` (override with CSOAI_KEYS_ENV),
     which must be mode 0600.

There is no fourth step.  If none of them holds the key, `resolve_secret`
raises, the caller fails closed, and the run stops with a message naming every
place that was searched.  It never falls back to a different parser: a card that
says it was made with Jev and was in fact made with a keyword match is a card
that lies about how it was made, and that is the one thing these artifacts are
not allowed to do.

Nothing here ever logs, prints, or embeds a secret value.  `probe()` returns a
length and a source name so an operator can verify a key is installed without
the value crossing a terminal.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import NamedTuple

from .base import MissingCredentialError

__all__ = ["SecretProbe", "resolve_secret", "probe_secret", "DEFAULT_KEYS_TOOL"]

DEFAULT_KEYS_TOOL = "/workspace/tools/csoai_keys.py"
DEFAULT_KEYS_ENV = "~/.csoai-keys.env"


class SecretProbe(NamedTuple):
    """Whether a secret is installed -- never the secret."""

    name: str
    present: bool
    source: str | None
    length: int
    searched: tuple[str, ...]


def _from_env(name: str) -> str | None:
    value = (os.environ.get(name) or "").strip()
    return value or None


def _from_tool(name: str) -> tuple[str | None, str]:
    tool = os.environ.get("CSOAI_KEYS_TOOL", DEFAULT_KEYS_TOOL)
    where = f"resolver {tool} --key {name}"
    if not Path(tool).exists():
        return None, where + " (resolver not present)"
    try:
        done = subprocess.run(
            [sys.executable, tool, "--key", name],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as error:
        return None, f"{where} (resolver failed: {type(error).__name__})"
    if done.returncode != 0:
        detail = (done.stderr or "").strip().splitlines()
        return None, f"{where} (exit {done.returncode}: {detail[0] if detail else ''})"
    value = (done.stdout or "").strip()
    return (value or None), where


def _from_keystone(name: str) -> tuple[str | None, str]:
    raw = os.environ.get("CSOAI_KEYS_ENV", DEFAULT_KEYS_ENV)
    path = Path(raw).expanduser()
    where = f"keystone {path}"
    if not path.exists():
        return None, where + " (absent)"
    mode = path.stat().st_mode & 0o777
    if mode != 0o600:
        return None, where + f" (refused: mode {mode:o}, must be 600)"
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            if key.strip() != name:
                continue
            value = value.strip().strip("'\"")
            if value:
                return value, where
    except OSError as error:
        return None, f"{where} (unreadable: {type(error).__name__})"
    return None, where + " (no such key)"


def probe_secret(name: str) -> SecretProbe:
    """Report whether `name` resolves, with its length and source -- not its value."""
    searched: list[str] = []
    value = _from_env(name)
    searched.append(f"environment ${name}")
    if value:
        return SecretProbe(name, True, searched[-1], len(value), tuple(searched))
    for loader in (_from_tool, _from_keystone):
        value, where = loader(name)
        searched.append(where)
        if value:
            return SecretProbe(name, True, where, len(value), tuple(searched))
    return SecretProbe(name, False, None, 0, tuple(searched))


def resolve_secret(name: str) -> str:
    """Return the secret, or raise MissingCredentialError naming where it looked."""
    found = probe_secret(name)
    if found.present:
        value = _from_env(name)
        if value:
            return value
        for loader in (_from_tool, _from_keystone):
            value, _ = loader(name)
            if value:
                return value
    raise MissingCredentialError(
        f"{name} is not installed. Searched, in order:\n  "
        + "\n  ".join(f"- {where}" for where in found.searched)
        + f"\n\nInstall it in the pod keystone and nowhere else:\n"
        f"  printf '{name}=%s\\n' \"$SECRET\" >> ~/.csoai-keys.env"
        f" && chmod 600 ~/.csoai-keys.env\n"
        f"Then verify WITHOUT printing it:\n"
        f"  python3 -c \"from harness.typed_output.keys import probe_secret;"
        f" p=probe_secret('{name}'); print(p.present, p.length, p.source)\"\n"
        "No fallback parser was substituted; this run stops here on purpose."
    )
