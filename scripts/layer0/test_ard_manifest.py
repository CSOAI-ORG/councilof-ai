# SPDX-License-Identifier: Apache-2.0
"""/.well-known/ard.json: the MCP entry lists the tool fleet from the lock, never a typed list that drifts."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))


def test_ard_capabilities_equal_the_tool_fleet_lock():
    ard = json.load(open(os.path.join(ROOT, "public", ".well-known", "ard.json")))
    lock = json.load(open(os.path.join(ROOT, "functions", "mcp", "tool-fleet.lock.json")))
    mcp = next(e for e in ard["entries"] if e["type"] == "application/mcp-server-card+json")
    assert sorted(mcp["capabilities"]) == sorted(lock["free"] + lock["paid"])


def test_ard_entries_validate_against_the_ard_entry_schema():
    import pytest
    jsonschema = pytest.importorskip("jsonschema")
    S = json.load(open(os.path.join(HERE, "vendor", "ard-entry.schema.json")))
    ard = json.load(open(os.path.join(ROOT, "public", ".well-known", "ard.json")))
    V = jsonschema.Draft202012Validator({**S, "$ref": "#/$defs/ArdManifest"})
    assert not [e.message for e in V.iter_errors(ard)]
