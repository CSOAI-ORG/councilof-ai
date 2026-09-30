#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Deterministic FIXTURE events, one per state (plus a measured-number one). Synthetic: example.org
locators, labelled as fixtures; they are shape tests, not measurements of anything.

    python3 tests/make_fixtures.py        writes tests/fixtures/events.jsonl
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import event as E  # noqa: E402

T = "2026-09-30T12:00:00Z"
LIM = ["FIXTURE: synthetic event for renderer shape tests; it measures nothing."]


def mk(i, state, value=None, nc=None, kind="mcp_server", holder="csoai"):
    return E.build(
        subject={"kind": kind, "locator": f"https://fixture-{i}.example.org/mcp", "declared_by": "fixture registry row"},
        claim={"text": f"Fixture {i}: the server declares tools/list returns 3 tools.", "source_url": f"https://fixture-{i}.example.org/server.json",
               "source_sha256": "0" * 63 + str(i % 10), "read_at": T},
        method={"id": "fixture-probe", "version": "0.1", "code_sha256": None, "holder": holder},
        declared={"tools": 3}, observed={"tools": 3 if state == "CONSISTENT" else 2 if state == "DIVERGENT" else None},
        state=state, value=value,
        negative_control=nc or {"id": "fixture-control", "expected": "DIVERGENT", "got": "DIVERGENT"},
        limits=LIM, maintenance={"next_read_utc": "2026-10-07T12:00:00Z", "schedule": "d7,d30,d90"})


def events():
    return [
        mk(1, "CONSISTENT"),
        mk(2, "DIVERGENT"),
        mk(3, "PARTIAL"),
        mk(4, "UNMEASURED", nc={"id": None, "expected": None, "got": "NOT_RUN"}),
        mk(5, "UNCHECKABLE", nc={"id": None, "expected": None, "got": "NOT_RUN"}),
        mk(6, "NOT_DISCRIMINATING", nc={"id": "fixture-control", "expected": None, "got": "CONSISTENT"}),
        mk(7, "DIVERGENT", value=0.25, kind="model_run", holder="third_party:fixture"),
    ]


if __name__ == "__main__":
    os.makedirs(os.path.join(HERE, "fixtures"), exist_ok=True)
    E.write_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"), events())
    print("wrote", len(events()))
