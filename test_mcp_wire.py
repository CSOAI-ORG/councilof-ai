#!/usr/bin/env python3
"""test_mcp_wire.py - unit + CLI tests for mcp_wire_audit / mcp2026_shim.

Run with::

    /opt/homebrew/bin/python3.11 test_mcp_wire.py

Covers: audit classification on synthetic fixtures, audit depth/name capping,
JSONL shape, report aggregation, CLI end-to-end, shim request/response
translation in both directions, ``server/discover``, MRTR passthrough, and the
ASGI/WSGI wrappers.  Standard library only - no network, no third-party test
runner.
"""

from __future__ import annotations

import asyncio
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from typing import Dict, List, Optional, Sequence

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import mcp_wire_audit as audit  # noqa: E402
import mcp2026_shim as shim  # noqa: E402

AUDIT_CLI = os.path.join(HERE, "mcp_wire_audit.py")
PY = sys.executable

# Source snippets carrying one era's worth of evidence each.
OLD_HANDSHAKE = (
    'def handle(msg):\n'
    '    if msg.get("method") == "initialize":\n'
    '        return {"protocolVersion": "2024-11-05"}\n'
    '    if msg.get("method") == "notifications/initialized":\n'
    '        return None\n'
)
WIRE_2025_06 = (
    "from mcp.server.fastmcp import FastMCP\n"
    'SUPPORTED = "2025-06-18"\nPROTOCOL = "2025-06-18"\n'
)
WIRE_2025_11 = (
    "from mcp.server.fastmcp import FastMCP\n"
    'SUPPORTED = "2025-11-25"\nPROTOCOL = "2025-11-25"\n'
)
WIRE_2026 = (
    '# stateless wire\n'
    'MCP_METHOD = "Mcp-Method"\nMCP_NAME = "Mcp-Name"\n'
    'SUPPORTED = "2026-07-28"\n'
    'def discover():\n    return {"protocolVersion": "2026-07-28"}\n'
)
SDK_ONLY = (
    "try:\n    from mcp.server.fastmcp import FastMCP\n"
    "except ImportError:\n    raise\n"
    'mcp = FastMCP("demo")\n'
)
NON_MCP = 'def add(a, b):\n    return a + b\n'


def make_tree(files: Dict[str, str], prefix: str = "mcpwire-fixture-") -> str:
    """Materialise ``{relative path: content}`` under a fresh temp directory.

    The default prefix contains "mcp" so the scan root is eligible on its own
    (name-filter match), matching how the tool treats a real server directory.
    """
    root = tempfile.mkdtemp(prefix=prefix)
    for rel, content in files.items():
        path = os.path.join(root, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(content)
    return root


def record_for(records: Sequence[dict], server: str) -> Optional[dict]:
    for record in records:
        if record["server"] == server:
            return record
    return None


# --------------------------------------------------------------------------- #
# 1. classification (pure functions)
# --------------------------------------------------------------------------- #


class ClassifyTests(unittest.TestCase):
    def test_pre_2025_06_era(self):
        era, _ = audit.classify({"protocol-2024-11-05", "initialize-handshake"})
        self.assertEqual(era, "pre-2025-06")

    def test_classify_2025_06_era(self):
        era, _ = audit.classify({"protocol-2025-06-18", "sdk-mcp-import"})
        self.assertEqual(era, "2025-06")

    def test_classify_2025_11_era(self):
        era, _ = audit.classify({"protocol-2025-11-25", "sdk-fastmcp"})
        self.assertEqual(era, "2025-11")

    def test_2026_07_era(self):
        era, _ = audit.classify({"protocol-2026-07-28", "mcp-method-header", "mcp-name-header"})
        self.assertEqual(era, "2026-07")

    def test_unknown_era_for_sdk_only_server(self):
        era, migration = audit.classify({"sdk-fastmcp", "sdk-mcp-import"})
        self.assertEqual(era, "unknown")
        self.assertEqual(migration, "header-add")

    def test_structural_2026_signals_without_version_literal(self):
        era, _ = audit.classify({"server-discover"})
        self.assertEqual(era, "2026-07")

    def test_empty_signal_set_is_not_a_server(self):
        self.assertEqual(audit.classify(set()), (None, None))

    def test_protocol_literal_alone_needs_corroboration(self):
        # Dates leak into docs, manifests and unrelated JSON: without a core
        # MCP signal the directory must not be recorded as a server.
        self.assertEqual(audit.classify({"protocol-2025-11-25"}), (None, None))
        self.assertEqual(audit.classify({"protocol-2026-07-28"}), (None, None))
        self.assertEqual(audit.classify({"mrtr-input-required"}), (None, None))

    def test_protocol_literal_with_core_signal_is_recorded(self):
        era, migration = audit.classify({"protocol-2025-06-18", "sdk-fastmcp"})
        self.assertEqual((era, migration), ("2025-06", "header-add"))

    def test_newest_evidence_wins(self):
        era, _ = audit.classify({"protocol-2025-11-25", "protocol-2026-07-28", "mcp-method-header"})
        self.assertEqual(era, "2026-07")

    def test_migration_none(self):
        era, migration = audit.classify(
            {"protocol-2026-07-28", "mcp-method-header", "mcp-name-header"}
        )
        self.assertEqual((era, migration), ("2026-07", "none"))

    def test_migration_header_add(self):
        era, migration = audit.classify({"protocol-2025-11-25", "sdk-mcp-import"})
        self.assertEqual((era, migration), ("2025-11", "header-add"))

    def test_migration_handshake_removal(self):
        era, migration = audit.classify(
            {
                "protocol-2026-07-28",
                "mcp-method-header",
                "mcp-name-header",
                "initialize-handshake",
            }
        )
        self.assertEqual((era, migration), ("2026-07", "handshake-removal"))

    def test_migration_full_for_pre_2025(self):
        era, migration = audit.classify({"protocol-2024-11-05", "session-id"})
        self.assertEqual((era, migration), ("pre-2025-06", "full"))

    def test_migration_full_when_both_works_needed(self):
        # Old pin + raw handshake code + no mandatory-header handling.
        era, migration = audit.classify({"protocol-2025-06-18", "initialize-handshake"})
        self.assertEqual((era, migration), ("2025-06", "full"))


class FileSignalTests(unittest.TestCase):
    def test_detects_mandatory_headers(self):
        self.assertIn("mcp-method-header", audit.file_signals(WIRE_2026))
        self.assertIn("mcp-name-header", audit.file_signals(WIRE_2026))

    def test_detects_session_header(self):
        self.assertIn("session-id", audit.file_signals('sid = headers.get("Mcp-Session-Id")'))

    def test_detects_quoted_initialize_but_not_prose(self):
        self.assertIn("initialize-handshake", audit.file_signals('case "initialize": pass'))
        self.assertNotIn("initialize-handshake", audit.file_signals("the initialize handshake"))

    def test_detects_mrtr_pair(self):
        self.assertIn("mrtr-input-required", audit.file_signals('{"resultType": "input_required"}'))
        self.assertNotIn(
            "mrtr-input-required", audit.file_signals('{"resultType": "other"}')
        )

    def test_detects_discover_rpc(self):
        self.assertIn("server-discover", audit.file_signals("rpc server/discover ->"))

    def test_detects_ts_sdk(self):
        self.assertIn("sdk-mcp-import", audit.file_signals('from "@modelcontextprotocol/sdk"'))


# --------------------------------------------------------------------------- #
# 2. tree scanning (synthetic fixtures)
# --------------------------------------------------------------------------- #


class ScanTests(unittest.TestCase):
    def test_scan_classifies_pre_2025_fixture(self):
        root = make_tree({"mcp-old/server.py": OLD_HANDSHAKE})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, stats = audit.scan_tree(root)
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["era"], "pre-2025-06")
        self.assertEqual(records[0]["migration"], "full")
        self.assertGreater(stats["files_read"], 0)

    def test_scan_classifies_2026_fixture(self):
        root = make_tree({"mcp-new/server.py": WIRE_2026})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, _ = audit.scan_tree(root)
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["era"], "2026-07")
        self.assertEqual(records[0]["migration"], "none")

    def test_scan_records_have_exactly_the_documented_keys(self):
        root = make_tree({"mcp-x/server.py": WIRE_2025_11})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, _ = audit.scan_tree(root)
        self.assertEqual(list(records[0].keys()), list(audit.RECORD_KEYS))
        self.assertIsInstance(records[0]["signals"], list)
        self.assertEqual(records[0]["signals"], sorted(records[0]["signals"]))

    def test_scan_ignores_directories_without_mcp_signals(self):
        root = make_tree({"mcp-plain/server.py": NON_MCP})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, stats = audit.scan_tree(root)
        self.assertEqual(records, [])
        self.assertEqual(stats["servers"], 0)

    def test_scan_ignores_bare_version_literals(self):
        # A manifest that merely mentions a protocol date is not a server.
        root = make_tree(
            {"mcp-manifest/server.json": '{"protocolVersion": "2025-11-25", "name": "x"}'}
        )
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, _ = audit.scan_tree(root)
        self.assertEqual(records, [])

    def test_container_root_is_not_reported_as_a_server(self):
        # An estate container holding wire references in its own files must
        # not be emitted as a server of its own, with or without a filter.
        root = make_tree(
            {
                "wire_notes.py": WIRE_2026,
                "mcp-child/server.py": WIRE_2025_11,
            },
            prefix="wire-fixture-",
        )
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        for name_filter in ("mcp", ""):
            records, _ = audit.scan_tree(root, name_filter=name_filter)
            self.assertEqual(
                [rec["server"] for rec in records],
                ["mcp-child"],
                f"name_filter={name_filter!r}",
            )

    def test_scan_name_filter_excludes_non_matching_dirs(self):
        # Root deliberately does NOT match the filter and carries no package
        # marker, so only children matching "mcp" are read.
        root = make_tree(
            {
                "mcp-old/server.py": WIRE_2025_11,
                "other-plain/server.py": WIRE_2026,
            },
            prefix="wire-fixture-",
        )
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, _ = audit.scan_tree(root, name_filter="mcp")
        servers = sorted(rec["server"] for rec in records)
        self.assertEqual(servers, ["mcp-old"])

    def test_scan_empty_name_filter_scans_everything(self):
        root = make_tree(
            {"mcp-old/server.py": WIRE_2025_11, "other-plain/server.py": WIRE_2026},
            prefix="wire-fixture-",
        )
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, _ = audit.scan_tree(root, name_filter="")
        self.assertEqual(len(records), 2)

    def test_scan_depth_cap_hides_deep_servers(self):
        deep = "d1/d2/d3/mcp-deep/server.py"
        shallow = "mcp-shallow/server.py"
        files = {deep: WIRE_2026, shallow: WIRE_2025_11}
        root = make_tree(files)
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)

        capped, _ = audit.scan_tree(root, depth=2)
        self.assertEqual([rec["server"] for rec in capped], ["mcp-shallow"])

        deeper, _ = audit.scan_tree(root, depth=4)
        self.assertEqual(sorted(rec["server"] for rec in deeper), ["mcp-deep", "mcp-shallow"])

    def test_scan_rolls_signals_up_to_package_root(self):
        root = make_tree(
            {
                "pkg-mcp/pyproject.toml": '[project]\nname = "pkg"\ndependencies = ["mcp>=1.0.0"]\n',
                "pkg-mcp/src/engine.py": SDK_ONLY + WIRE_2025_11,
            }
        )
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, _ = audit.scan_tree(root)
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["server"], "pkg-mcp")
        self.assertEqual(records[0]["path"], root + os.sep + "pkg-mcp")
        self.assertEqual(records[0]["era"], "2025-11")

    def test_scan_merges_and_upgrades_era_across_subdirs(self):
        root = make_tree(
            {
                "pkg-mcp/pyproject.toml": '[project]\nname = "pkg"\ndependencies = ["mcp>=1.0.0"]\n',
                "pkg-mcp/old_engine/server.py": WIRE_2025_11,
                "pkg-mcp/new_engine/server.py": WIRE_2026,
            }
        )
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, _ = audit.scan_tree(root)
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["era"], "2026-07")
        self.assertIn("protocol-2025-11-25", records[0]["signals"])
        self.assertEqual(records[0]["migration"], "none")

    def test_scan_never_reads_its_own_sources(self):
        root = make_tree({"mcp-selfy/mcp_wire_audit.py": WIRE_2026, "mcp-selfy/server.py": NON_MCP})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, stats = audit.scan_tree(root)
        # mcp_wire_audit.py is excluded from reading; server.py is read but
        # carries no MCP evidence, so nothing is recorded.
        self.assertEqual(records, [])
        self.assertEqual(stats["files_read"], 1)

    def test_scan_skips_oversized_files(self):
        root = make_tree({"mcp-big/server.py": WIRE_2026})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, stats = audit.scan_tree(root, max_bytes=8)
        self.assertEqual(records, [])
        self.assertEqual(stats["files_read"], 0)

    def test_scan_prunes_node_modules_and_git(self):
        root = make_tree(
            {
                "mcp-app/server.py": WIRE_2025_11,
                "mcp-app/node_modules/dep/index.js": WIRE_2026,
                "mcp-app/.git/hooks/x.py": WIRE_2026,
            }
        )
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        records, _ = audit.scan_tree(root)
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["era"], "2025-11")

    def test_scan_missing_directory_raises(self):
        with self.assertRaises(NotADirectoryError):
            audit.scan_tree(os.path.join(tempfile.gettempdir(), "definitely-not-here-xyz"))

    def test_scan_is_deterministic(self):
        root = make_tree({"mcp-a/server.py": WIRE_2025_06, "mcp-b/server.py": WIRE_2026})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        first, _ = audit.scan_tree(root)
        second, _ = audit.scan_tree(root)
        self.assertEqual(first, second)


# --------------------------------------------------------------------------- #
# 3. report aggregation
# --------------------------------------------------------------------------- #


def _record(server: str, era: str, migration: str) -> dict:
    return {
        "server": server,
        "path": "/estate/" + server,
        "era": era,
        "signals": ["protocol-2025-11-25"],
        "migration": migration,
    }


class ReportTests(unittest.TestCase):
    def test_counts_by_era(self):
        records = [
            _record("a", "2025-11", "header-add"),
            _record("b", "2025-11", "full"),
            _record("c", "2026-07", "none"),
        ]
        report = audit.build_report(records)
        self.assertEqual(report["total"], 3)
        self.assertEqual(report["by_era"]["2025-11"], 2)
        self.assertEqual(report["by_era"]["2026-07"], 1)
        self.assertEqual(report["by_era"]["pre-2025-06"], 0)

    def test_counts_by_migration(self):
        records = [
            _record("a", "2025-11", "header-add"),
            _record("b", "2025-11", "header-add"),
            _record("c", "pre-2025-06", "full"),
            _record("d", "2026-07", "handshake-removal"),
        ]
        report = audit.build_report(records)
        self.assertEqual(report["by_migration"]["header-add"], 2)
        self.assertEqual(report["by_migration"]["full"], 1)
        self.assertEqual(report["by_migration"]["handshake-removal"], 1)
        self.assertEqual(report["by_migration"]["none"], 0)

    def test_cross_tabulation(self):
        records = [_record("a", "2025-06", "full"), _record("b", "2025-06", "full")]
        report = audit.build_report(records)
        self.assertEqual(report["by_era_migration"]["2025-06"]["full"], 2)
        self.assertEqual(report["by_era_migration"]["2025-06"]["header-add"], 0)

    def test_zero_filled_for_empty_input(self):
        report = audit.build_report([])
        self.assertEqual(report["total"], 0)
        for era in audit.CANONICAL_ERAS:
            self.assertIn(era, report["by_era"])
        for name in audit.MIGRATIONS:
            self.assertIn(name, report["by_migration"])

    def test_invalid_records_are_counted_not_crashed(self):
        report = audit.build_report([{"server": "x"}, {"_malformed": "{oops"}])
        self.assertEqual(report["total"], 0)
        self.assertEqual(report["invalid_records"], 2)

    def test_format_report_mentions_every_era(self):
        text = audit.format_report(audit.build_report([]))
        for era in audit.CANONICAL_ERAS:
            self.assertIn(era, text)
        for name in audit.MIGRATIONS:
            self.assertIn(name, text)


# --------------------------------------------------------------------------- #
# 4. CLI end-to-end
# --------------------------------------------------------------------------- #


class CliTests(unittest.TestCase):
    def setUp(self):
        self.workdir = tempfile.mkdtemp(prefix="mcpwire-cli-")
        self.addCleanup(shutil.rmtree, self.workdir, ignore_errors=True)

    def _run(self, args: Sequence[str], stdin: Optional[str] = None):
        return subprocess.run(
            [PY, AUDIT_CLI, *args],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=60,
        )

    def test_audit_writes_jsonl_file(self):
        root = make_tree({"mcp-cli/server.py": WIRE_2025_11})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        out = os.path.join(self.workdir, "records.jsonl")
        proc = self._run(["audit", "--local", root, "--out", out, "--stats"])
        self.assertEqual(proc.returncode, 0, proc.stderr)
        with open(out, encoding="utf-8") as handle:
            records = [json.loads(line) for line in handle if line.strip()]
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["era"], "2025-11")
        self.assertEqual(records[0]["migration"], "header-add")
        self.assertIn("servers=1", proc.stderr)

    def test_audit_emits_jsonl_to_stdout(self):
        root = make_tree({"mcp-out/server.py": WIRE_2026})
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        proc = self._run(["audit", "--local", root])
        self.assertEqual(proc.returncode, 0, proc.stderr)
        lines = [line for line in proc.stdout.splitlines() if line.strip()]
        self.assertEqual(len(lines), 1)
        self.assertEqual(json.loads(lines[0])["era"], "2026-07")

    def test_report_reads_file_and_emits_json(self):
        path = os.path.join(self.workdir, "in.jsonl")
        rows = [
            _record("a", "2025-11", "header-add"),
            _record("b", "pre-2025-06", "full"),
        ]
        with open(path, "w", encoding="utf-8") as handle:
            for row in rows:
                handle.write(json.dumps(row) + "\n")
        proc = self._run(["report", "--in", path, "--json"])
        self.assertEqual(proc.returncode, 0, proc.stderr)
        payload = json.loads(proc.stdout)
        self.assertEqual(payload["total"], 2)
        self.assertEqual(payload["by_era"]["2025-11"], 1)
        self.assertEqual(payload["by_migration"]["full"], 1)

    def test_report_reads_stdin_text_table(self):
        rows = [_record("a", "2025-06", "full")]
        stdin = "\n".join(json.dumps(row) for row in rows) + "\n"
        proc = self._run(["report"], stdin=stdin)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("2025-06", proc.stdout)
        self.assertIn("full", proc.stdout)

    def test_report_skips_malformed_lines(self):
        stdin = "{not json\n" + json.dumps(_record("a", "2025-11", "header-add")) + "\n"
        proc = self._run(["report", "--json"], stdin=stdin)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        payload = json.loads(proc.stdout)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["invalid_records"], 1)

    def test_audit_missing_directory_fails_cleanly(self):
        proc = self._run(["audit", "--local", os.path.join(self.workdir, "nope")])
        self.assertEqual(proc.returncode, 1)
        self.assertIn("not a directory", proc.stderr)

    def test_version_flag(self):
        proc = self._run(["--version"])
        self.assertEqual(proc.returncode, 0)
        self.assertIn(audit.TOOL_VERSION, proc.stdout)

    def test_no_command_prints_usage(self):
        proc = self._run([])
        self.assertEqual(proc.returncode, 2)
        self.assertIn("usage", proc.stderr.lower())

    def test_full_pipeline_audit_then_report(self):
        root = make_tree(
            {
                "mcp-one/server.py": WIRE_2025_11,
                "mcp-two/server.py": WIRE_2026,
                "mcp-three/server.py": OLD_HANDSHAKE,
            }
        )
        self.addCleanup(shutil.rmtree, root, ignore_errors=True)
        out = os.path.join(self.workdir, "estate.jsonl")
        self.assertEqual(self._run(["audit", "--local", root, "--out", out]).returncode, 0)
        proc = self._run(["report", "--in", out, "--json"])
        payload = json.loads(proc.stdout)
        self.assertEqual(payload["total"], 3)
        self.assertEqual(payload["by_era"]["2025-11"], 1)
        self.assertEqual(payload["by_era"]["2026-07"], 1)
        self.assertEqual(payload["by_era"]["pre-2025-06"], 1)
        self.assertEqual(payload["by_migration"]["full"], 1)


# --------------------------------------------------------------------------- #
# 5. shim - request direction
# --------------------------------------------------------------------------- #


class ShimRequestTests(unittest.TestCase):
    def test_2026_request_injects_protocol_meta(self):
        body = {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
        _, out, notes = shim.translate_request({"Mcp-Method": "tools/list"}, body)
        self.assertEqual(out["params"]["_meta"]["protocolVersion"], "2026-07-28")
        self.assertIn("meta-protocol-version-injected", notes)
        self.assertIn(shim.NOTE_FORWARD, notes)
        self.assertFalse(shim.is_local_reply(notes))

    def test_2026_request_keeps_existing_meta_keys(self):
        body = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
            "params": {"_meta": {"progressToken": "abc"}},
        }
        _, out, _ = shim.translate_request({"Mcp-Method": "tools/list"}, body)
        self.assertEqual(out["params"]["_meta"]["progressToken"], "abc")
        self.assertEqual(out["params"]["_meta"]["protocolVersion"], "2026-07-28")

    def test_2026_request_is_idempotent(self):
        body = {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
        _, once, _ = shim.translate_request({"Mcp-Method": "tools/list"}, body)
        _, twice, notes = shim.translate_request({"Mcp-Method": "tools/list"}, once)
        self.assertEqual(once, twice)
        self.assertNotIn("meta-protocol-version-injected", notes)

    def test_headers_are_case_insensitive(self):
        body = {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "x"}}
        headers, out, notes = shim.translate_request(
            {"MCP-METHOD": "tools/call", "MCP-NAME": "x"}, body
        )
        self.assertNotIn(shim.NOTE_RESPOND, notes[0])
        self.assertEqual(headers["MCP-NAME"], "x")
        self.assertEqual(out["params"]["_meta"]["protocolVersion"], "2026-07-28")

    def test_method_header_mismatch_is_normalized(self):
        body = {"jsonrpc": "2.0", "id": 3, "method": "tools/list", "params": {}}
        headers, _, notes = shim.translate_request({"Mcp-Method": "prompts/list"}, body)
        self.assertEqual(headers["Mcp-Method"], "tools/list")
        self.assertIn("mcp-method-normalized", notes)

    def test_legacy_initialize_gets_2025_11_25_reply(self):
        body = {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "initialize",
            "params": {"protocolVersion": "2025-06-18", "capabilities": {}},
        }
        headers, out, notes = shim.translate_request({}, body)
        self.assertTrue(shim.is_local_reply(notes))
        self.assertIn("respond-local:initialize", notes)
        self.assertEqual(out["result"]["protocolVersion"], "2025-11-25")
        self.assertIn("capabilities", out["result"])
        self.assertIn("serverInfo", out["result"])
        self.assertEqual(out["id"], 4)

    def test_legacy_initialize_emits_no_session_header(self):
        _, out, notes = shim.translate_request(
            {"Mcp-Session-Id": "srv-1"}, {"jsonrpc": "2.0", "id": 1, "method": "initialize"}
        )
        self.assertNotIn("Mcp-Session-Id", out)
        self.assertIn("session-requirements-stripped", notes)
        # The reply headers must not require a session either.
        headers, _, _ = shim.translate_request({}, {"jsonrpc": "2.0", "id": 1, "method": "initialize"})
        self.assertIsNone(shim.get_header(headers, "Mcp-Session-Id"))

    def test_handshake_ack_is_answered_locally(self):
        _, out, notes = shim.translate_request(
            {}, {"jsonrpc": "2.0", "method": "notifications/initialized"}
        )
        self.assertTrue(shim.is_local_reply(notes))
        self.assertIn("respond-local:notifications/initialized", notes)
        self.assertEqual(out, {})

    def test_server_discover_returns_2026_result(self):
        body = {"jsonrpc": "2.0", "id": 9, "method": "server/discover", "params": {}}
        _, out, notes = shim.translate_request({"Mcp-Method": "server/discover"}, body)
        self.assertTrue(shim.is_local_reply(notes))
        result = out["result"]
        self.assertEqual(result["protocolVersion"], "2026-07-28")
        self.assertIn("capabilities", result)
        self.assertIn("serverInfo", result)
        self.assertEqual(result["serverInfo"]["name"], "mcp2026-shim")

    def test_server_discover_respects_config(self):
        cfg = shim.ShimConfig(server_info={"name": "eu-cra-mcp", "version": "2.0.0"})
        _, out, _ = shim.translate_request(
            {}, {"jsonrpc": "2.0", "id": 1, "method": "server/discover"}, config=cfg
        )
        self.assertEqual(out["result"]["serverInfo"]["name"], "eu-cra-mcp")

    def test_missing_mcp_name_on_tools_call_is_rejected(self):
        body = {"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"arguments": {}}}
        _, out, notes = shim.translate_request({"Mcp-Method": "tools/call"}, body)
        self.assertTrue(shim.is_local_reply(notes))
        self.assertIn("respond-local:missing-mcp-name", notes)
        self.assertEqual(out["error"]["code"], -32602)
        self.assertNotIn("result", out)

    def test_legacy_request_derives_method_and_name_headers(self):
        body = {
            "jsonrpc": "2.0",
            "id": 6,
            "method": "tools/call",
            "params": {"name": "lookup", "arguments": {"q": "x"}},
        }
        headers, out, notes = shim.translate_request({"Mcp-Session-Id": "s1"}, body)
        self.assertEqual(headers.get("Mcp-Method"), "tools/call")
        self.assertEqual(headers.get("Mcp-Name"), "lookup")
        self.assertIsNone(shim.get_header(headers, "Mcp-Session-Id"))
        self.assertIn("mcp-method-header-added", notes)
        self.assertIn("mcp-name-header-derived", notes)
        self.assertIn("session-id-stripped", notes)
        self.assertEqual(out["params"]["_meta"]["protocolVersion"], "2026-07-28")
        self.assertIn("forward", notes)

    def test_legacy_resources_read_derives_name(self):
        body = {
            "jsonrpc": "2.0",
            "id": 7,
            "method": "resources/read",
            "params": {"uri": "file:///x"},
        }
        # No name in params and no header -> the shim must not forward a
        # request the 2026 upstream would reject.
        _, out, notes = shim.translate_request({}, body)
        self.assertTrue(shim.is_local_reply(notes))
        self.assertEqual(out["error"]["code"], -32602)

    def test_resources_read_with_name_header_forwards(self):
        body = {
            "jsonrpc": "2.0",
            "id": 8,
            "method": "resources/read",
            "params": {"uri": "file:///x"},
        }
        _, _, notes = shim.translate_request(
            {"Mcp-Method": "resources/read", "Mcp-Name": "files"}, body
        )
        self.assertIn(shim.NOTE_FORWARD, notes)

    def test_mrtr_result_type_passes_through_request(self):
        body = {
            "jsonrpc": "2.0",
            "id": 10,
            "method": "tools/call",
            "params": {"name": "x", "resultType": "input_required"},
        }
        _, out, notes = shim.translate_request({"Mcp-Method": "tools/call", "Mcp-Name": "x"}, body)
        self.assertEqual(out["params"]["resultType"], "input_required")
        self.assertIn("mrtr-passthrough:input_required", notes)

    def test_batch_body_is_forwarded_untouched(self):
        batch = [{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}]
        headers, out, notes = shim.translate_request({}, batch)
        self.assertEqual(out, batch)
        self.assertIn("unsupported-batch-passthrough", notes)

    def test_response_shaped_body_passthrough(self):
        body = {"jsonrpc": "2.0", "id": 1, "result": {"ok": True}}
        _, out, notes = shim.translate_request({}, body)
        self.assertEqual(out, body)
        self.assertIn("response-body-passthrough", notes)

    def test_malformed_body_passthrough(self):
        _, out, notes = shim.translate_request({}, "not a body")
        self.assertEqual(out, "not a body")
        self.assertIn("malformed-body-passthrough", notes)

    def test_is_local_reply_predicate(self):
        self.assertTrue(shim.is_local_reply(["respond-local:initialize"]))
        self.assertFalse(shim.is_local_reply(["forward"]))
        self.assertFalse(shim.is_local_reply([]))


# --------------------------------------------------------------------------- #
# 6. shim - response direction
# --------------------------------------------------------------------------- #


class ShimResponseTests(unittest.TestCase):
    def test_legacy_response_strips_session_header(self):
        headers, _, notes = shim.translate_response(
            {"Mcp-Session-Id": "s1", "Content-Type": "application/json"},
            {"jsonrpc": "2.0", "id": 1, "result": {"ok": True}},
            client_wire="legacy",
        )
        self.assertIsNone(shim.get_header(headers, "Mcp-Session-Id"))
        self.assertIn("session-id-stripped", notes)

    def test_legacy_response_rewrites_protocol_version(self):
        _, out, notes = shim.translate_response(
            {},
            {"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2026-07-28"}},
            client_wire="legacy",
        )
        self.assertEqual(out["result"]["protocolVersion"], "2025-11-25")
        self.assertIn("protocol-version-rewritten", notes)

    def test_2026_response_keeps_protocol_version(self):
        _, out, notes = shim.translate_response(
            {},
            {"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2026-07-28"}},
            client_wire="2026",
        )
        self.assertEqual(out["result"]["protocolVersion"], "2026-07-28")
        self.assertNotIn("protocol-version-rewritten", notes)
        self.assertIn("response:2026-07-28-wire", notes)

    def test_mrtr_response_is_untouched(self):
        original = {
            "jsonrpc": "2.0",
            "id": 3,
            "result": {
                "content": [{"type": "text", "text": "need more input"}],
                "resultType": "input_required",
            },
        }
        _, out, notes = shim.translate_response({}, original, client_wire="legacy")
        self.assertEqual(out, original)
        self.assertIn("mrtr-passthrough:input_required", notes)
        # The exchange was MRTR: no protocolVersion rewriting happened anywhere.
        self.assertNotIn("protocol-version-rewritten", notes)

    def test_mrtr_response_untouched_on_2026_wire(self):
        original = {"jsonrpc": "2.0", "id": 3, "result": {"resultType": "input_required"}}
        _, out, _ = shim.translate_response({}, original, client_wire="2026")
        self.assertEqual(out, original)

    def test_response_body_not_mutated_in_place(self):
        original = {"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2026-07-28"}}
        shim.translate_response({}, original, client_wire="legacy")
        self.assertEqual(original["result"]["protocolVersion"], "2026-07-28")

    def test_discover_result_rewritten_for_legacy_client(self):
        cfg = shim.ShimConfig()
        _, out, notes = shim.translate_response(
            {}, {"jsonrpc": "2.0", "id": 1, "result": cfg.discover_result()}, client_wire="legacy"
        )
        self.assertEqual(out["result"]["protocolVersion"], "2025-11-25")
        self.assertEqual(set(out["result"]), {"protocolVersion", "capabilities", "serverInfo"})
        self.assertIn("protocol-version-rewritten", notes)

    def test_malformed_response_passthrough(self):
        _, out, notes = shim.translate_response({}, "oops", client_wire="legacy")
        self.assertEqual(out, "oops")
        self.assertIn("malformed-body-passthrough", notes)


# --------------------------------------------------------------------------- #
# 7. shim - WSGI wrapper
# --------------------------------------------------------------------------- #


def _wsgi_environ(raw: bytes, extra: Optional[Dict[str, str]] = None) -> Dict[str, object]:
    environ: Dict[str, object] = {
        "REQUEST_METHOD": "POST",
        "PATH_INFO": "/mcp",
        "CONTENT_TYPE": "application/json",
        "CONTENT_LENGTH": str(len(raw)),
        "wsgi.input": io.BytesIO(raw),
        "wsgi.errors": io.StringIO(),
        "wsgi.url_scheme": "http",
        "SERVER_NAME": "test",
        "SERVER_PORT": "80",
    }
    for key, value in (extra or {}).items():
        environ[key] = value
    return environ


class WsgiShimTests(unittest.TestCase):
    def test_legacy_initialize_answered_without_touching_app(self):
        calls = []

        def app(environ, start_response):  # pragma: no cover - must not run
            calls.append(environ)
            start_response("200 OK", [("Content-Type", "application/json")])
            return [b"{}"]

        wrapped = shim.ShimWSGI(app)
        raw = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "initialize"}).encode()
        captured = {}
        result = wrapped(_wsgi_environ(raw), lambda s, h, e=None: captured.setdefault(s, h))
        payload = json.loads(b"".join(result).decode())
        self.assertEqual(payload["result"]["protocolVersion"], "2025-11-25")
        self.assertEqual(calls, [])  # the wrapped app never ran
        self.assertTrue(list(captured)[0].startswith("200"))

    def test_legacy_request_forwarded_with_synthesized_headers(self):
        seen = {}

        def app(environ, start_response):
            seen["environ"] = dict(environ)
            body = environ["wsgi.input"].read()
            start_response("200 OK", [("Content-Type", "application/json")])
            return [body]

        wrapped = shim.ShimWSGI(app)
        raw = json.dumps(
            {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {"name": "lookup", "arguments": {}},
            }
        ).encode()
        environ = _wsgi_environ(raw, {"HTTP_MCP_SESSION_ID": "sess-1"})
        captured: Dict[str, list] = {}
        result = wrapped(environ, lambda s, h, e=None: captured.setdefault(s, h))
        env = seen["environ"]
        self.assertEqual(env["HTTP_MCP_METHOD"], "tools/call")
        self.assertEqual(env["HTTP_MCP_NAME"], "lookup")
        self.assertNotIn("HTTP_MCP_SESSION_ID", env)
        # The app echoed the request it received, i.e. the translated body.
        forwarded = json.loads(b"".join(result).decode())
        self.assertEqual(forwarded["params"]["_meta"]["protocolVersion"], "2026-07-28")

    def test_discover_answered_locally(self):
        def app(environ, start_response):  # pragma: no cover
            raise AssertionError("app must not run for server/discover")

        wrapped = shim.ShimWSGI(app)
        raw = json.dumps({"jsonrpc": "2.0", "id": 3, "method": "server/discover"}).encode()
        captured: Dict[str, list] = {}
        result = wrapped(_wsgi_environ(raw), lambda s, h, e=None: captured.setdefault(s, h))
        payload = json.loads(b"".join(result).decode())
        self.assertEqual(payload["result"]["protocolVersion"], "2026-07-28")
        self.assertIn("capabilities", payload["result"])


# --------------------------------------------------------------------------- #
# 8. shim - ASGI wrapper
# --------------------------------------------------------------------------- #


def _drive(outer, headers, body_obj, inner_app=None):
    """Run one HTTP exchange through *outer* (an ASGI callable).

    Builds the scope from *headers*, replays *body_obj* as the request body and
    returns the list of ASGI messages *outer* emitted.  ``inner_app`` is the
    application the middleware wraps; tests supply their own to observe what
    actually reaches upstream.
    """
    raw = json.dumps(body_obj).encode()
    scope = {
        "type": "http",
        "asgi": {"version": "3.0", "name": "test"},
        "http_version": "1.1",
        "method": "POST",
        "path": "/mcp",
        "scheme": "http",
        "headers": [
            (key.lower().encode("latin-1"), value.encode("latin-1"))
            for key, value in headers.items()
        ],
    }

    async def receive():
        return {"type": "http.request", "body": raw, "more_body": False}

    sent: List[dict] = []

    async def send(message):
        sent.append(message)

    asyncio.run(outer(scope, receive, send))
    return sent


def _recording_app(seen: dict):
    """ASGI app that records scope headers + body, then echoes the body back."""

    async def app(scope, receive, send):
        seen["headers"] = list(scope.get("headers", []))
        chunks: List[bytes] = []
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                break
            chunks.append(message.get("body", b""))
            if not message.get("more_body", False):
                break
        body = b"".join(chunks)
        seen["body"] = body
        await send(
            {
                "type": "http.response.start",
                "status": 200,
                "headers": [(b"content-type", b"application/json")],
            }
        )
        await send({"type": "http.response.body", "body": body})

    return app


def _local_reply_sentinel(calls: list):
    """ASGI app that fails the test if the shim ever forwards to it."""

    async def app(scope, receive, send):  # pragma: no cover - must not run
        calls.append(scope)
        raise AssertionError("the shim must answer this exchange itself")

    return app


class AsgiShimTests(unittest.TestCase):
    def test_asgi_local_reply_never_reaches_app(self):
        calls: list = []
        outer = shim.ShimASGI(_local_reply_sentinel(calls))
        sent = _drive(outer, {}, {"jsonrpc": "2.0", "id": 1, "method": "initialize"})
        self.assertEqual(calls, [])
        self.assertEqual(sent[0]["type"], "http.response.start")
        self.assertEqual(sent[0]["status"], 200)
        payload = json.loads(sent[1]["body"].decode())
        self.assertEqual(payload["result"]["protocolVersion"], "2025-11-25")
        self.assertNotIn("Mcp-Session-Id", dict(sent[0]["headers"]))

    def test_asgi_forwards_normalized_request(self):
        seen: dict = {}
        outer = shim.ShimASGI(_recording_app(seen))
        body = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "lookup", "arguments": {}},
        }
        sent = _drive(outer, {"Mcp-Session-Id": "sess-1"}, body)

        header_map = {k.decode(): v.decode() for k, v in seen["headers"]}
        self.assertEqual(header_map.get("Mcp-Method"), "tools/call")
        self.assertEqual(header_map.get("Mcp-Name"), "lookup")
        self.assertNotIn("Mcp-Session-Id", header_map)

        forwarded = json.loads(seen["body"].decode())
        self.assertEqual(forwarded["params"]["_meta"]["protocolVersion"], "2026-07-28")

        # The echo came back through the response translator.
        response_payload = json.loads(sent[-1]["body"].decode())
        self.assertEqual(response_payload["params"]["_meta"]["protocolVersion"], "2026-07-28")
        self.assertEqual(sent[0]["status"], 200)

    def test_asgi_translates_2026_response_onto_legacy_wire(self):
        async def app(scope, receive, send):
            while True:
                message = await receive()
                if not message.get("more_body", False):
                    break
            await send(
                {
                    "type": "http.response.start",
                    "status": 200,
                    "headers": [(b"content-type", b"application/json")],
                }
            )
            await send(
                {
                    "type": "http.response.body",
                    "body": json.dumps(
                        {"jsonrpc": "2.0", "id": 3, "result": {"protocolVersion": "2026-07-28"}}
                    ).encode(),
                }
            )

        outer = shim.ShimASGI(app)
        # No Mcp-Method header -> the client spoke the legacy wire.
        sent = _drive(outer, {}, {"jsonrpc": "2.0", "id": 3, "method": "tools/list", "params": {}})
        payload = json.loads(sent[-1]["body"].decode())
        self.assertEqual(payload["result"]["protocolVersion"], "2025-11-25")

    def test_asgi_passthrough_for_non_http_scope(self):
        seen: list = []

        async def inner(scope, receive, send):  # pragma: no cover
            seen.append(scope["type"])

        outer = shim.ShimASGI(inner)

        async def run():
            await outer({"type": "lifespan"}, None, None)

        asyncio.run(run())
        self.assertEqual(seen, ["lifespan"])

    def test_asgi_survives_malformed_json_body(self):
        seen: dict = {}
        outer = shim.ShimASGI(_recording_app(seen))

        async def receive():
            return {"type": "http.request", "body": b"{not json", "more_body": False}

        sent: List[dict] = []

        async def send(message):
            sent.append(message)

        scope = {"type": "http", "headers": [(b"mcp-method", b"tools/list")], "path": "/mcp"}
        asyncio.run(outer(scope, receive, send))
        # An unparsable body must survive byte-for-byte rather than being
        # replaced with "{}", and no exception escapes the middleware.
        self.assertEqual(seen["body"], b"{not json")
        self.assertTrue(sent)


# --------------------------------------------------------------------------- #
# 9. cross-module consistency
# --------------------------------------------------------------------------- #


class ConsistencyTests(unittest.TestCase):
    def test_shim_and_audit_agree_on_wire_constants(self):
        self.assertEqual(shim.WIRE_2026, "2026-07-28")
        self.assertEqual(shim.WIRE_LEGACY, "2025-11-25")
        self.assertIn("protocol-2026-07-28", audit.SIGNALS_2026)

    def test_audit_reports_none_for_shim_clean_traffic(self):
        # A server that emits exactly what the shim forwards is already clean.
        clean = {"protocol-2026-07-28", "mcp-method-header", "mcp-name-header"}
        self.assertEqual(audit.classify(clean), ("2026-07", "none"))

    def test_shim_initializes_handshake_evidence_in_audit(self):
        # Anything the shim answers locally must be an audit migration signal.
        era, migration = audit.classify({"initialize-handshake", "session-id"})
        self.assertEqual(era, "unknown")
        self.assertEqual(migration, "full")

    def test_all_migration_classes_are_reachable(self):
        seen = {
            audit.classify({"protocol-2026-07-28", "mcp-method-header", "mcp-name-header"})[1],
            audit.classify({"protocol-2025-11-25", "sdk-mcp-import"})[1],
            audit.classify(
                {"protocol-2026-07-28", "mcp-method-header", "mcp-name-header", "session-id"}
            )[1],
            audit.classify({"protocol-2024-11-05", "sdk-mcp-import"})[1],
        }
        self.assertEqual(seen, set(audit.MIGRATIONS))


if __name__ == "__main__":
    unittest.main(verbosity=2)
