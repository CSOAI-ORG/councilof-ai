# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""Venturi adapters: each turns one existing CSOAI declared-vs-observed record into capsules.

Interface (every module):
  NAME, KIND
  capsules(src, stats, aux=None) -> iterable of capsules built with venturi_capsule.make_capsule
  meta(src, stats) -> dict merged into the batch record (source pins, skipped counts, what_this_is[_not])
Adapters stream their sources and never rewrite them; the evidence stays where it already lives.
"""
import importlib


class PendingSource(Exception):
    """The adapter's source record does not exist yet; nothing is built and nothing is invented."""


NAMES = ("mill_cross_runtime", "contract_parity", "a2a_card", "cross_ledger", "self_parity", "public_signals", "tool_drift")


def get(name):
    if name not in NAMES:
        raise SystemExit(f"UNKNOWN_ADAPTER {name}; known: {', '.join(NAMES)}")
    return importlib.import_module(f"adapters.{name}")
