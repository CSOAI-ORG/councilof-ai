#!/usr/bin/env python3
"""mcp_wire_audit.py - classify MCP servers by protocol wire era.

Stdlib-only CLI.  Scans a directory tree for MCP server source and emits one
JSONL record per discovered server::

    {"server": "...", "path": "...", "era": "...", "signals": [...], "migration": "..."}

Eras
----
pre-2025-06   pinned a pre-2025-06-18 protocol version (2024-11-05 / 2025-03-26)
2025-06       pinned 2025-06-18 (batching removed era)
2025-11       pinned 2025-11-25 (last pre-stateless era, the "old wire")
2026-07       pinned 2026-07-28 or shows stateless-wire structure
              (server/discover, Mcp-Method / Mcp-Name headers)
unknown       MCP server with no decisive version evidence (SDK-mediated code)

Migration classes
-----------------
none              already speaks 2026-07-28 with mandatory headers, no handshake code
header-add        only the Mcp-Method / Mcp-Name headers are missing
handshake-removal headers are fine, but raw initialize / session code remains
full              needs both (or is pinned pre-2025-06)

Scan rules (depth-capped on purpose - this runs against a 1200-entry estate root)
-------------------------------------------------------------------------------
* traversal stops at --depth levels below the scan root (default 3)
* a directory is scanned when it matches --name-filter (default "mcp"), when an
  ancestor below the root matched, or when the root itself is eligible
* the scan root is only read when it matches the filter, carries a package
  entry marker (pyproject.toml / package.json / ...), or --include-root is set -
  this keeps a container directory such as ~/clawd from being reported as a
  server of its own
* signals found in a package sub-directory roll up to the nearest ancestor that
  holds an entry marker, so one package == one record
* a bare protocol-version literal is not enough to call a directory a server:
  it must be corroborated by a core MCP signal (SDK import, raw handshake,
  ``server/discover`` or the mandatory ``Mcp-Method`` / ``Mcp-Name`` headers)
* this tool's own sources are never read (self-classification guard)

Usage
-----
    mcp_wire_audit.py audit --local DIR [--local DIR2] [--depth 3] \
        [--name-filter mcp] [--out records.jsonl]
    mcp_wire_audit.py report [--in records.jsonl] [--json]

Exit codes: 0 ok, 1 runtime error, 2 usage error.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple

TOOL_NAME = "mcp_wire_audit"
TOOL_VERSION = "1.0.0"

CANONICAL_ERAS: Tuple[str, ...] = (
    "pre-2025-06",
    "2025-06",
    "2025-11",
    "2026-07",
    "unknown",
)
MIGRATIONS: Tuple[str, ...] = ("none", "header-add", "handshake-removal", "full")
RECORD_KEYS: Tuple[str, ...] = ("server", "path", "era", "signals", "migration")

DEFAULT_DEPTH = 3
DEFAULT_NAME_FILTER = "mcp"
DEFAULT_MAX_BYTES = 1_048_576

# Files that must never be read: the audit tool, the shim and their tests.
SELF_FILES = frozenset(
    {"mcp_wire_audit.py", "mcp2026_shim.py", "test_mcp_wire.py"}
)

# Package entry markers: a directory holding one of these is a package root and
# absorbs the signals of its sub-directories.
ENTRY_MARKERS = (
    "pyproject.toml",
    "setup.py",
    "setup.cfg",
    "package.json",
    "Cargo.toml",
    "go.mod",
    "composer.json",
)

SCAN_EXTS = frozenset(
    {
        ".py",
        ".pyi",
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".go",
        ".rs",
        ".rb",
        ".java",
        ".kt",
        ".toml",
        ".json",
        ".yaml",
        ".yml",
        ".cfg",
        ".ini",
    }
)

SKIP_DIR_NAMES = frozenset(
    {
        ".git",
        ".hg",
        ".svn",
        "node_modules",
        "__pycache__",
        "dist",
        "build",
        "target",
        "site-packages",
        ".venv",
        "venv",
        ".tox",
        ".mypy_cache",
        ".pytest_cache",
        ".ruff_cache",
        ".cache",
        ".idea",
        ".vscode",
    }
)

SKIP_FILE_NAMES = frozenset(
    {
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "poetry.lock",
        "Cargo.lock",
        "composer.lock",
    }
)

# --------------------------------------------------------------------------- #
# signal extraction
# --------------------------------------------------------------------------- #

# (signal code, compiled pattern).  Order does not matter: signals are stored
# as a set and emitted sorted.
_SIGNAL_SPECS: Tuple[Tuple[str, "re.Pattern[str]"], ...] = (
    ("protocol-2024-11-05", re.compile(r"2024-11-05")),
    ("protocol-2025-03-26", re.compile(r"2025-03-26")),
    ("protocol-2025-06-18", re.compile(r"2025-06-18")),
    ("protocol-2025-11-25", re.compile(r"2025-11-25")),
    ("protocol-2026-07-28", re.compile(r"2026-07-28")),
    ("server-discover", re.compile(r"server\s*/\s*discover", re.I)),
    ("mcp-method-header", re.compile(r"mcp[-_]method", re.I)),
    ("mcp-name-header", re.compile(r"mcp[-_]name", re.I)),
    ("session-id", re.compile(r"mcp[-_]session[-_]id", re.I)),
    (
        "initialize-handshake",
        re.compile(
            r"""(?xi)
               ( ["']initialize["'] \s* [:,)] )   # quoted method key / case label
             | ( notifications\s*/\s*initialized )  # client handshake ack
             | ( Initializ(?:e|ed)Request )         # TS SDK schema names
             | ( initialize_request | handle_initialize )
            """
        ),
    ),
    ("sdk-fastmcp", re.compile(r"\bfastmcp\b", re.I)),
    (
        "sdk-mcp-import",
        re.compile(
            r"""(?xi)
               from \s+ mcp \b
             | import \s+ mcp \b
             | @modelcontextprotocol
             | mcp \s* [>~]=            # pyproject dependency pin
             | ["'] mcp ["'] \s* :      # package.json dependency
            """
        ),
    ),
)

_RESULTTYPE_RE = re.compile(r"result[_-]?type", re.I)
_INPUT_REQUIRED_RE = re.compile(r"input[_-]?required", re.I)

# Signals that prove the 2026-07-28 (stateless) wire.
SIGNALS_2026 = frozenset(
    {"protocol-2026-07-28", "server-discover", "mcp-method-header", "mcp-name-header"}
)
# Signals that prove a pre-2025-06-18 pin.
SIGNALS_PRE_2025_06 = frozenset({"protocol-2024-11-05", "protocol-2025-03-26"})
# Signals that mean the server itself implements / depends on the handshake.
SIGNALS_HANDSHAKE = frozenset({"initialize-handshake", "session-id"})
# Signals that are MCP-specific enough to prove this directory really is an MCP
# server.  A bare protocol-version literal is NOT enough on its own: those
# dates show up in docs, registry manifests and unrelated JSON.  Corroboration
# (SDK import, raw handshake, discovery RPC or the mandatory headers) is
# required before a directory is recorded as a server.
SIGNALS_MCP_CORE = frozenset(
    {
        "sdk-fastmcp",
        "sdk-mcp-import",
        "initialize-handshake",
        "session-id",
        "server-discover",
        "mcp-method-header",
        "mcp-name-header",
    }
)


def file_signals(text: str) -> Set[str]:
    """Return the wire signals present in one text file."""
    found: Set[str] = set()
    for code, pattern in _SIGNAL_SPECS:
        if pattern.search(text):
            found.add(code)
    if _RESULTTYPE_RE.search(text) and _INPUT_REQUIRED_RE.search(text):
        found.add("mrtr-input-required")
    return found


def classify(signals: Iterable[str]) -> Tuple[Optional[str], Optional[str]]:
    """Map a signal set to ``(era, migration)``.

    Returns ``(None, None)`` when the input is not provably an MCP server:
    either there are no signals at all, or there is no corroborating core
    signal (SDK import / raw handshake / discovery RPC / mandatory headers).
    Such directories must not be recorded.
    """
    sig = set(signals)
    if not sig or not (sig & SIGNALS_MCP_CORE):
        return None, None
    era = era_of(sig)
    return era, migration_of(era, sig)


def era_of(signals: Set[str]) -> str:
    """Decide the era: the newest decisive evidence wins."""
    if signals & SIGNALS_2026:
        return "2026-07"
    if "protocol-2025-11-25" in signals:
        return "2025-11"
    if "protocol-2025-06-18" in signals:
        return "2025-06"
    if signals & SIGNALS_PRE_2025_06:
        return "pre-2025-06"
    # No version literal.  The wire is MCP but the pin is untraceable (the
    # usual case for FastMCP / SDK-mediated servers).
    return "unknown"


def migration_of(era: str, signals: Set[str]) -> str:
    """Decide which of the four migration classes applies."""
    needs_headers = not {"mcp-method-header", "mcp-name-header"} <= signals
    needs_handshake_removal = bool(signals & SIGNALS_HANDSHAKE) or era == "pre-2025-06"
    if needs_headers and needs_handshake_removal:
        return "full"
    if needs_handshake_removal:
        return "handshake-removal"
    if needs_headers:
        return "header-add"
    return "none"


# --------------------------------------------------------------------------- #
# tree scanning
# --------------------------------------------------------------------------- #


def _is_skipped_dir(name: str) -> bool:
    lowered = name.lower()
    if lowered in SKIP_DIR_NAMES or lowered.endswith(".egg-info"):
        return True
    if lowered.startswith(".git") or lowered == ".git":
        return True
    return False


def _is_scannable_file(name: str) -> bool:
    if name in SELF_FILES or name in SKIP_FILE_NAMES:
        return False
    if name.endswith(".min.js") or name.endswith(".map"):
        return False
    _, ext = os.path.splitext(name)
    return ext.lower() in SCAN_EXTS


def _has_entry_marker(directory: str) -> bool:
    try:
        entries = set(os.listdir(directory))
    except OSError:
        return False
    for marker in ENTRY_MARKERS:
        if marker in entries:
            return True
    return any(name.endswith(".gemspec") for name in entries)


def _read_signals(directory: str, max_bytes: int, stats: Dict[str, int]) -> Set[str]:
    """Signals from the files directly inside *directory* (non-recursive)."""
    aggregated: Set[str] = set()
    try:
        names = sorted(os.listdir(directory))
    except OSError:
        return aggregated
    for name in names:
        if not _is_scannable_file(name):
            continue
        path = os.path.join(directory, name)
        try:
            if not os.path.isfile(path):
                continue
            size = os.stat(path).st_size
        except OSError:
            continue
        if size > max_bytes:
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as handle:
                text = handle.read()
        except OSError:
            continue
        if "\x00" in text[:4096]:
            continue  # binary in disguise
        stats["files_read"] += 1
        aggregated |= file_signals(text)
    return aggregated


def scan_tree(
    root: str,
    depth: int = DEFAULT_DEPTH,
    name_filter: str = DEFAULT_NAME_FILTER,
    max_bytes: int = DEFAULT_MAX_BYTES,
    include_root: bool = False,
) -> Tuple[List[dict], Dict[str, int]]:
    """Scan *root* (depth-capped) and return ``(records, stats)``.

    ``records`` are raw dicts keyed by nothing in particular - ordering is
    discovery order.  Directories without MCP signals are dropped; directories
    whose signals belong to a package roll up to that package's root.
    """
    root = os.path.abspath(root)
    if not os.path.isdir(root):
        raise NotADirectoryError(root)

    stats = {"dirs_seen": 0, "dirs_scanned": 0, "files_read": 0, "servers": 0}
    name_filter = (name_filter or "").strip()

    def matches(name: str) -> bool:
        if not name_filter:
            return True
        return name_filter.lower() in name.lower()

    root_marker = _has_entry_marker(root)
    # An empty name filter means "no name filtering" for descendants, but it
    # must not make the container directory itself eligible: an estate root
    # such as ~/clawd is not a server just because its files mention a wire.
    root_eligible = (
        root_marker
        or include_root
        or (bool(name_filter) and matches(os.path.basename(root)))
    )

    # (path, depth, in_scope) - in_scope means "read this directory's files".
    stack: List[Tuple[str, int, bool]] = [(root, 0, root_eligible)]
    signals_by_dir: Dict[str, Set[str]] = {}

    while stack:
        directory, level, in_scope = stack.pop()
        stats["dirs_seen"] += 1
        if in_scope:
            stats["dirs_scanned"] += 1
            found = _read_signals(directory, max_bytes, stats)
            if found:
                signals_by_dir[directory] = found
        if level >= depth:
            continue
        try:
            children = sorted(os.listdir(directory))
        except OSError:
            continue
        for name in children:
            child = os.path.join(directory, name)
            try:
                if os.path.islink(child) or not os.path.isdir(child):
                    continue
            except OSError:
                continue
            if _is_skipped_dir(name):
                continue
            child_scope = in_scope or matches(name)
            stack.append((child, level + 1, child_scope))

    if not signals_by_dir:
        return [], stats

    # Roll every signal directory up to its package root, THEN classify the
    # merged evidence - a package whose pyproject pins the wire and whose
    # sub-package holds the handshake must be judged as one server.
    package_signals: Dict[str, Set[str]] = {}
    for directory, signals in signals_by_dir.items():
        package_root = _package_root(directory, root, root_marker)
        package_signals.setdefault(package_root, set()).update(signals)

    records_by_path: Dict[str, dict] = {}
    for package_root, signals in package_signals.items():
        era, migration = classify(signals)
        if era is None:
            continue  # not provably an MCP server
        records_by_path[package_root] = {
            "server": os.path.basename(package_root.rstrip(os.sep)) or package_root,
            "path": package_root,
            "era": era,
            "signals": sorted(signals),
            "migration": migration,
        }

    records = list(records_by_path.values())
    records.sort(key=lambda rec: (rec["path"], rec["server"]))
    stats["servers"] = len(records)
    return records, stats


def _package_root(directory: str, root: str, root_has_marker: bool) -> str:
    """Nearest ancestor (or *directory* itself) holding a package entry marker.

    The scan root participates only when it holds a marker, so an estate
    container without a package manifest never swallows every server below it.
    """
    if _has_entry_marker(directory):
        return directory
    current = directory
    while current != root:
        parent = os.path.dirname(current)
        if parent == current:
            break
        if parent == root and not root_has_marker:
            break
        if _has_entry_marker(parent):
            return parent
        current = parent
    return directory


def _newer_era(current: str, candidate: Optional[str]) -> str:
    """Pick the newest of two eras (kept for external callers / reports)."""
    if candidate is None:
        return current
    # "unknown" is the weakest evidence (it is the no-version fallback), so a
    # concrete era always wins when two sub-directories of one package disagree.
    order = {"unknown": -1, "pre-2025-06": 0, "2025-06": 1, "2025-11": 2, "2026-07": 3}
    if order.get(candidate, -1) > order.get(current, -1):
        return candidate
    return current


# --------------------------------------------------------------------------- #
# report
# --------------------------------------------------------------------------- #


def build_report(records: Sequence[dict]) -> dict:
    """Aggregate records into era / migration counts (zero-filled)."""
    report: dict = {
        "total": 0,
        "by_era": {era: 0 for era in CANONICAL_ERAS},
        "by_migration": {name: 0 for name in MIGRATIONS},
        "by_era_migration": {
            era: {name: 0 for name in MIGRATIONS} for era in CANONICAL_ERAS
        },
        "invalid_records": 0,
    }
    for record in records:
        if not isinstance(record, dict) or not all(k in record for k in RECORD_KEYS):
            report["invalid_records"] += 1
            continue
        era = record["era"]
        migration = record["migration"]
        report["total"] += 1
        report["by_era"][era] = report["by_era"].get(era, 0) + 1
        report["by_migration"][migration] = report["by_migration"].get(migration, 0) + 1
        bucket = report["by_era_migration"].setdefault(era, {})
        bucket[migration] = bucket.get(migration, 0) + 1
    return report


def format_report(report: dict) -> str:
    """Human-readable rendering of :func:`build_report` output."""
    lines: List[str] = []
    lines.append("MCP wire-era audit report")
    lines.append("=" * 44)
    lines.append(f"records         : {report['total']}")
    if report.get("invalid_records"):
        lines.append(f"invalid records : {report['invalid_records']}")
    lines.append("")
    lines.append("era             count")
    lines.append("-" * 26)
    for era in CANONICAL_ERAS:
        lines.append(f"{era:<15} {report['by_era'].get(era, 0):>5}")
    lines.append("")
    lines.append("migration       count")
    lines.append("-" * 26)
    for name in MIGRATIONS:
        lines.append(f"{name:<15} {report['by_migration'].get(name, 0):>5}")
    lines.append("")
    lines.append("era x migration")
    lines.append("-" * 44)
    for era in CANONICAL_ERAS:
        bucket = report["by_era_migration"].get(era, {})
        parts = ", ".join(
            f"{name}={bucket.get(name, 0)}" for name in MIGRATIONS if bucket.get(name, 0)
        )
        lines.append(f"{era:<15} {parts or '-'}")
    return "\n".join(lines)


def read_jsonl(path: Optional[str]) -> List[dict]:
    """Read JSONL records from *path* or stdin when ``path`` is ``None``/``-``."""
    if path in (None, "-"):
        handle = sys.stdin
        close = False
    else:
        handle = open(path, "r", encoding="utf-8")
        close = True
    records: List[dict] = []
    try:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                records.append({"_malformed": line})
    finally:
        if close:
            handle.close()
    return records


def write_jsonl(records: Iterable[dict], out: Optional[str]) -> int:
    """Write records as JSONL to *out* (or stdout); returns the count."""
    handle = sys.stdout if out in (None, "-") else open(out, "w", encoding="utf-8")
    count = 0
    try:
        for record in records:
            handle.write(json.dumps(record, sort_keys=True) + "\n")
            count += 1
    finally:
        if handle is not sys.stdout:
            handle.close()
    return count


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=TOOL_NAME,
        description="Classify MCP servers by protocol wire era (stdlib only).",
    )
    parser.add_argument("--version", action="version", version=f"{TOOL_NAME} {TOOL_VERSION}")
    sub = parser.add_subparsers(dest="command")

    audit = sub.add_parser("audit", help="scan a directory and emit JSONL records")
    audit.add_argument(
        "--local",
        action="append",
        required=True,
        metavar="DIR",
        help="directory to scan (repeatable)",
    )
    audit.add_argument(
        "--depth", type=int, default=DEFAULT_DEPTH, help="max depth below each root (default 3)"
    )
    audit.add_argument(
        "--name-filter",
        default=DEFAULT_NAME_FILTER,
        help='only scan directories whose name contains this string (default "mcp"; "" = all)',
    )
    audit.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES, help="skip files larger than this")
    audit.add_argument(
        "--include-root",
        action="store_true",
        help="read the scan root's own files even without a package marker / name match",
    )
    audit.add_argument("--out", default=None, metavar="FILE", help="write JSONL here (default stdout)")
    audit.add_argument("--stats", action="store_true", help="print scan statistics to stderr")

    report = sub.add_parser("report", help="summarise JSONL records by era and migration")
    report.add_argument("--in", dest="infile", default=None, metavar="FILE", help="JSONL input (default stdin)")
    report.add_argument("--json", action="store_true", help="emit JSON instead of a text table")
    return parser


def cmd_audit(args: argparse.Namespace) -> int:
    records: Dict[str, dict] = {}
    totals = {"dirs_seen": 0, "dirs_scanned": 0, "files_read": 0, "servers": 0}
    for target in args.local:
        found, stats = scan_tree(
            target,
            depth=args.depth,
            name_filter=args.name_filter,
            max_bytes=args.max_bytes,
            include_root=args.include_root,
        )
        for record in found:
            existing = records.get(record["path"])
            if existing is None:
                records[record["path"]] = record
                continue
            # The same package scanned through two roots: merge the evidence
            # and keep the newest era rather than letting the last root win.
            merged = set(existing["signals"]) | set(record["signals"])
            era = _newer_era(existing["era"], record["era"])
            existing["signals"] = sorted(merged)
            existing["era"] = era
            existing["migration"] = migration_of(era, merged)
        for key in totals:
            totals[key] += stats.get(key, 0)
    ordered = [records[path] for path in sorted(records)]
    count = write_jsonl(ordered, args.out)
    if args.stats:
        sys.stderr.write(
            "[{tool}] roots={roots} dirs_seen={ds} dirs_scanned={dn} "
            "files_read={fr} servers={sv} emitted={em}\n".format(
                tool=TOOL_NAME,
                roots=len(args.local),
                ds=totals["dirs_seen"],
                dn=totals["dirs_scanned"],
                fr=totals["files_read"],
                sv=totals["servers"],
                em=count,
            )
        )
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    records = read_jsonl(args.infile)
    # Malformed JSONL lines are surfaced as invalid records, never as servers.
    report = build_report(records)
    if args.json:
        json.dump(report, sys.stdout, indent=2, sort_keys=True)
        sys.stdout.write("\n")
    else:
        sys.stdout.write(format_report(report) + "\n")
    return 0


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "command", None):
        parser.print_help(sys.stderr)
        return 2
    try:
        if args.command == "audit":
            return cmd_audit(args)
        if args.command == "report":
            return cmd_report(args)
        parser.error(f"unknown command {args.command!r}")
    except NotADirectoryError as exc:
        sys.stderr.write(f"{TOOL_NAME}: not a directory: {exc}\n")
        return 1
    except OSError as exc:
        sys.stderr.write(f"{TOOL_NAME}: {exc}\n")
        return 1
    return 2


if __name__ == "__main__":
    sys.exit(main())
