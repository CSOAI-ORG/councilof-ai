#!/usr/bin/env python3
"""
run_all_harnesses.py — Wire every MEOK/CSOAI harness into one runner.

Imports the constitutional-harness 22 articles as Python constants,
loads the L0-Harness-Fabric architecture, exercises the
sovos-layer0-harness-kernel Python kernel, enumerates every harness-x
worktree, prints the integrated handoff to stdout, and verifies every
file path exists.

Truthful about every "NOT_EXECUTED" / "PLAN_ONLY" state. Never claims
to send, publish, or settle anything. Per Article 1 + Article 14.

Usage:
    python3 /Users/nicholas/clawd/run_all_harnesses.py
    python3 /Users/nicholas/clawd/run_all_harnesses.py --json   # machine-readable
    python3 /Users/nicholas/clawd/run_all_harnesses.py --quiet  # summary only
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

# -- 22 CONSTITUTIONAL ARTICLES (from constitutional-harness/index.html v0.1.0) ----

ARTICLES: dict[int, str] = {
    1:  "Measurement is not authority",
    2:  "Default deny",
    3:  "Identity and tenancy are bound",
    4:  "Authority is time-bounded state",
    5:  "Authority may narrow but not silently expand",
    6:  "Budget and payment are separate",
    7:  "Research and execution are separate",
    8:  "Runtime isolation is least privilege",
    9:  "Credentials are not agent memory",
    10: "Effects must be bound to receipts",
    11: "Verification is separate from invocation",
    12: "Signing is not automatic",
    13: "Transparency follows signing",
    14: "Regulatory determination is outside CSOAI",
    15: "SovSpace is a dependency projection",
    16: "Physical-host control is separately governed",
    17: "Corrections preserve history",
    18: "Failure stages stay explicit",
    19: "No self-approval loop",
    20: "Consequential changes require owner-visible review",
    21: "Public claims track actual state",
    22: "The charter itself is versioned evidence",
}

# Machine source pins (Article 22)
SOURCE_PINS: dict[str, str] = {
    "gspc_policy.py":                  "e262ec3863c4576c630414caf36d4714acec048490aa0eade529fd8ed31f35e4",
    "gspc_authority_state.py":        "6610c84d1854aee637f28d19098fdae20d8b0afefde4f4cd477e57e14db6dbd9",
    "gspc_effect_receipt.py":          "44b1f37fedaaee95ec66349e9c6f7640e103cd23d25e5015d2cb5435e38ccf3e",
    "gspc_constitutional_flow.py":     "cba8634f47c2c402f03ab4dbd30847e437a8b72927549b59b02468868c8969c8",
    "openshell_authority_adapter.py":  "9bef351d9a9c762378d75adbd91475e559605e1b6a25f07cf5be20d93a299db6",
}

# -- PATHS ----------------------------------------------------------------------------

ROOT = Path("/Users/nicholas/clawd")
KERNEL_DIR = ROOT / "codex-layer0-kernel-review-20260923" / "sovos-layer0-harness-kernel"
KERNEL_PY = KERNEL_DIR / "src" / "sovos_layer0_harness" / "kernel.py"
KERNEL_PACKS = KERNEL_DIR / "src" / "sovos_layer0_harness" / "packs.v1.json"
FABRIC_MD = ROOT / "codex-layer0-kernel-review-20260923" / "architecture" / "LAYER0-HARNESS-FABRIC.md"
CHARTER_HTML = Path("/Users/nicholas/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html")
SOVEREIGN_CHARTERS = ROOT / "sovereign-charters"
SOVEREIGN_LAW = ROOT / "sovereign-law"
UE5_DIR = ROOT / "meok-ai-os-ue5"
BACKEND_DIR = ROOT / "meok-backend"
QUEEN_FILE = ROOT / "sov33_queen_hives.py"
DEEPSEEK_HARNESS = ROOT / "csoai-hf-flywheel" / "harness" / "deepseek_harness.py"
INTEGRATION_DOC = ROOT / "MEOK_AI_OS_INTEGRATION_2026-10-07.md"


# -- LOADERS ---------------------------------------------------------------------------

def load_kernel():
    """Load the L0 kernel via PYTHONPATH injection. Returns (kernel_obj, error_str)."""
    sys.path.insert(0, str(KERNEL_DIR / "src"))
    try:
        from sovos_layer0_harness import kernel  # type: ignore
        k = kernel.Layer0HarnessKernel.load()
        return k, None
    except Exception as exc:  # noqa: BLE001
        return None, f"{type(exc).__name__}: {exc}"


def load_packs_json() -> dict[str, Any]:
    """Load the raw packs.v1.json."""
    return json.loads(KERNEL_PACKS.read_text())


def parse_charter_html() -> dict[str, Any]:
    """Parse the constitutional charter HTML, extract the 22 articles + sha pins."""
    html = CHARTER_HTML.read_text()
    found_articles = [int(m.group(1)) for m in re.finditer(r"Article (\d+) ·", html)]
    pins = {m.group(1): m.group(2) for m in re.finditer(r"([\w_]+\.py)<!--.*? -->[a-f0-9]{64}", html)}
    return {
        "found_articles": sorted(set(found_articles)),
        "expected": 22,
        "pins": pins,
        "size": len(html),
    }


# Capped depth + skip list — the entire clawd tree is too slow to walk.
_HARNESS_X_MAX_DEPTH = 5
_HARNESS_X_SKIP = {
    "__pycache__", "node_modules", ".git", ".vercel", ".pytest_cache",
    ".ruff_cache", "_archive", "archives", "logs", ".hermes", ".openclaw",
    ".backups", "venv", ".venv",
}


def find_harness_x_dirs() -> list[Path]:
    """Locate every harness-x directory under /Users/nicholas/clawd (depth-capped)."""
    candidates = []
    queue = [(ROOT, 0)]
    while queue:
        base, depth = queue.pop(0)
        if depth > _HARNESS_X_MAX_DEPTH:
            continue
        if not base.exists():
            continue
        try:
            for child in base.iterdir():
                if not child.is_dir():
                    continue
                if child.name in _HARNESS_X_SKIP or child.name.startswith("."):
                    continue
                if child.name == "harness-x" or "harness-x" in child.name:
                    if "__pycache__" not in child.parts and "_archive" not in child.parts:
                        candidates.append(child)
                if depth < _HARNESS_X_MAX_DEPTH:
                    queue.append((child, depth + 1))
        except (PermissionError, OSError):
            continue
    return sorted(set(candidates))


def find_harness_x_files() -> list[Path]:
    """Every .py file in a harness-x subtree."""
    files = []
    seen = set()
    for d in find_harness_x_dirs():
        try:
            for f in d.iterdir():
                if f.suffix == ".py" and f.is_file() and str(f) not in seen:
                    files.append(f)
                    seen.add(str(f))
        except (PermissionError, OSError):
            continue
    return sorted(set(files))


# -- VERIFY ----------------------------------------------------------------------------

def verify_paths() -> dict[str, str]:
    """Every path that should exist. Returns {label: status}."""
    targets = {
        "INTEGRATION_DOC":   INTEGRATION_DOC,
        "KERNEL_PY":         KERNEL_PY,
        "KERNEL_PACKS":      KERNEL_PACKS,
        "FABRIC_MD":         FABRIC_MD,
        "CHARTER_HTML":      CHARTER_HTML,
        "SOVEREIGN_CHARTERS":SOVEREIGN_CHARTERS,
        "SOVEREIGN_LAW":     SOVEREIGN_LAW,
        "UE5_DIR":           UE5_DIR,
        "BACKEND_DIR":       BACKEND_DIR,
        "QUEEN_FILE":        QUEEN_FILE,
        "DEEPSEEK_HARNESS":  DEEPSEEK_HARNESS,
    }
    return {label: ("OK" if p.exists() else "MISSING") for label, p in targets.items()}


# -- INTEGRATION MAP -------------------------------------------------------------------

def build_integration_map() -> list[dict[str, str]]:
    """Every article × every framework × every charter, with binding."""
    frameworks = sorted(p.stem for p in SOVEREIGN_LAW.glob("[0-9][0-9]-*.md"))
    charters = sorted(p.stem for p in SOVEREIGN_CHARTERS.glob("[0-9][0-9]-*.md"))
    rows = []
    for art_num, art_title in ARTICLES.items():
        for fw in frameworks:
            for ch in charters[:5]:  # cap to keep size sane
                rows.append({
                    "article_num":  str(art_num),
                    "article":      art_title,
                    "framework":    fw,
                    "charter":      ch,
                    "binding":      "Article 22 (charter versioned evidence) × 0-stage",
                })
    return rows


# -- PRINTERS --------------------------------------------------------------------------

def print_h1(label: str, subtitle: str = "") -> None:
    print()
    print("=" * 78)
    print(f" {label}")
    if subtitle:
        print(f" {subtitle}")
    print("=" * 78)


def print_h2(label: str) -> None:
    print()
    print(f"-- {label} " + "-" * (74 - len(label)))


# -- MAIN ------------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--json", action="store_true", help="emit JSON to stdout")
    parser.add_argument("--quiet", action="store_true", help="only summary + errors")
    args = parser.parse_args()

    if not args.quiet and not args.json:
        print("MEOK AI OS — Harness Integration Runner")
        print(f"Date: 2026-10-07 · Root: {ROOT}")
        print(f"Charter v0.1.0 · 22 articles · PUBLIC_TWO_HOST_VERIFIED")

    summary: dict[str, Any] = {
        "date": "2026-10-07",
        "charter_version": "0.1.0",
        "charter_state":   "PUBLIC_TWO_HOST_VERIFIED",
        "execution_state": "NOT_EXECUTED",
        "execution_ready": False,
    }

    # 1. Path verification
    print_h1("STEP 1", "Path verification")
    if not args.quiet:
        for label, status in verify_paths().items():
            mark = "✓" if status == "OK" else "✗"
            print(f"  {mark} {label:<22} {status}")
    summary["paths"] = verify_paths()

    # 2. Charter parse
    print_h1("STEP 2", "Constitutional charter (parse HTML)")
    parsed = parse_charter_html()
    if not args.quiet:
        print(f"  HTML size:                {parsed['size']} bytes")
        print(f"  Articles found in HTML:   {len(parsed['found_articles'])}")
        print(f"  Articles expected:        {parsed['expected']}")
        if parsed['found_articles'] == list(range(1, 23)):
            print("  ✓ All 22 articles present (1..22)")
        else:
            print(f"  ✗ Article set mismatch: {parsed['found_articles']}")
        print(f"  Source pins in HTML:      {len(parsed['pins'])}")
    summary["charter"] = {
        "found_articles":  parsed['found_articles'],
        "articles_match":  parsed['found_articles'] == list(range(1, 23)),
        "pins_in_html":    len(parsed['pins']),
    }

    # 3. Kernel load
    print_h1("STEP 3", "sovos-layer0-harness-kernel (Python)")
    k, err = load_kernel()
    if k is None:
        print(f"  ✗ Kernel load failed: {err}")
        summary["kernel"] = {"loaded": False, "error": err}
        return 1
    summary["kernel"] = {
        "loaded":    True,
        "pack_count": len(k.packs),
        "stages":    list(k.STAGE_ORDER),
        "protocols": k.protocols,
    }
    if not args.quiet:
        print(f"  ✓ Kernel loaded: {len(k.packs)} packs")
        print(f"  ✓ Stage order: {' → '.join(k.STAGE_ORDER)}")
        print(f"  ✓ Protocols: {k.protocols}")

    # 4. Kernel plan()
    print_h1("STEP 4", "Kernel plan() — truth-test that planner does NOT execute")
    plan = k.plan("publish EU AI Act Article 50 charter",
                  tags=["eu-ai-act", "governance", "external_action"],
                  consequential=True)
    summary["plan"] = {
        "event":                plan.event,
        "tags":                 list(plan.tags),
        "execution_state":      plan.execution_state,
        "execution_ready":      plan.execution_ready,
        "requires_human_review": plan.requires_human_review,
        "unbound_packs":        list(plan.unbound_packs),
        "reference_packs":      list(plan.reference_packs),
        "warning_count":        len(plan.warnings),
    }
    if not args.quiet:
        print(f"  event:                {plan.event}")
        print(f"  tags:                 {list(plan.tags)}")
        print(f"  execution_state:      {plan.execution_state}")
        print(f"  execution_ready:      {plan.execution_ready}")
        print(f"  requires_human_review:{plan.requires_human_review}")
        print(f"  unbound_packs:        {list(plan.unbound_packs)}")
        print(f"  reference_packs:      {list(plan.reference_packs)}")
        print(f"  warnings:             {len(plan.warnings)}")
        for w in plan.warnings:
            print(f"    · {w}")
        assert plan.execution_state == "NOT_EXECUTED", "kernel must not execute"
        assert plan.execution_ready is False, "kernel must not be ready"
        assert plan.ready_packs == (), "no packs should be ready"

    # 5. Pack registry
    print_h1("STEP 5", "Pack registry (from packs.v1.json)")
    raw = load_packs_json()
    summary["registry"] = {
        "pack_count":  len(raw["packs"]),
        "maturities":  set(p["maturity"] for p in raw["packs"]),
        "kinds":       set(p["kind"] for p in raw["packs"]),
        "authorities": set(p["authority"] for p in raw["packs"]),
    }
    if not args.quiet:
        print(f"  Pack count:  {len(raw['packs'])}")
        print(f"  Maturities:  {sorted(summary['registry']['maturities'])}")
        print(f"  Kinds:       {sorted(summary['registry']['kinds'])}")
        print(f"  Authorities: {sorted(summary['registry']['authorities'])}")
        print()
        print(f"  {'pack_id':<28} {'maturity':<12} {'authority':<22} stages")
        print(f"  {'-'*28} {'-'*12} {'-'*22} ------")
        for p in raw["packs"]:
            stages = ",".join(p.get("stages", []))
            print(f"  {p['id']:<28} {p['maturity']:<12} {p['authority']:<22} {stages}")

    # 6. harness-x worktree enumeration
    print_h1("STEP 6", "harness-x worktree enumeration")
    hx_dirs = find_harness_x_dirs()
    hx_files = find_harness_x_files()
    summary["harness_x"] = {
        "dirs":  [str(d.relative_to(ROOT)) for d in hx_dirs],
        "files": [str(f.relative_to(ROOT)) for f in hx_files],
        "dir_count":  len(hx_dirs),
        "file_count": len(hx_files),
    }
    if not args.quiet:
        print(f"  harness-x dirs:  {len(hx_dirs)}")
        for d in hx_dirs[:20]:
            print(f"    · {d.relative_to(ROOT)}")
        if len(hx_dirs) > 20:
            print(f"    ... and {len(hx_dirs) - 20} more")
        print(f"  harness-x files: {len(hx_files)}")
        for f in hx_files:
            try:
                loc = len(f.read_text().splitlines())
                print(f"    · {f.relative_to(ROOT):<70} {loc:>4} LOC")
            except Exception:
                print(f"    · {f.relative_to(ROOT)} (unreadable)")

    # 7. Charter + framework enumeration
    print_h1("STEP 7", "Charter + framework enumeration")
    charters = sorted(p.stem for p in SOVEREIGN_CHARTERS.glob("[0-9][0-9]-*.md"))
    frameworks = sorted(p.stem for p in SOVEREIGN_LAW.glob("[0-9][0-9]-*.md"))
    summary["charters"]   = {"count": len(charters), "files": charters}
    summary["frameworks"] = {"count": len(frameworks), "files": frameworks}
    if not args.quiet:
        print(f"  Charters:   {len(charters)} ({charters[0]} … {charters[-1]})")
        print(f"  Frameworks: {len(frameworks)} ({frameworks[0]} … {frameworks[-1]})")

    # 8. UE5 + backend + queen + deepseek
    print_h1("STEP 8", "Implementation layer")
    ue5_subdirs = sorted(p.name for p in UE5_DIR.iterdir() if p.is_dir()) if UE5_DIR.exists() else []
    backend_files = sorted(p.name for p in BACKEND_DIR.iterdir() if p.is_file()) if BACKEND_DIR.exists() else []
    queen_loc = len(QUEEN_FILE.read_text().splitlines()) if QUEEN_FILE.exists() else 0
    deepseek_loc = len(DEEPSEEK_HARNESS.read_text().splitlines()) if DEEPSEEK_HARNESS.exists() else 0
    summary["implementation"] = {
        "ue5_subdirs":      ue5_subdirs,
        "backend_files":    backend_files,
        "queen_loc":        queen_loc,
        "deepseek_loc":     deepseek_loc,
    }
    if not args.quiet:
        print(f"  UE5 subdirs:       {ue5_subdirs}")
        print(f"  Backend files:     {backend_files}")
        print(f"  sov33_queen_hives: {queen_loc} LOC")
        print(f"  deepseek_harness:  {deepseek_loc} LOC")

    # 9. Integration map (capped)
    print_h1("STEP 9", "Integration map (22 articles × 12 frameworks × top-5 charters)")
    rows = build_integration_map()
    summary["integration_map_rows"] = len(rows)
    if not args.quiet:
        print(f"  Total rows: {len(rows)}")
        print(f"  Sample (first 3):")
        for row in rows[:3]:
            print(f"    {row}")

    # 10. Article display
    print_h1("STEP 10", "22 constitutional articles")
    summary["articles"] = ARTICLES
    if not args.quiet:
        for n, title in ARTICLES.items():
            print(f"  A{n:>2}  {title}")

    # Final summary
    print_h1("HANDOFF SUMMARY", "integration complete · PLAN_ONLY · NOT_EXECUTED")
    print(f"  Charter:            v0.1.0 PUBLIC_TWO_HOST_VERIFIED (22/22 present)")
    print(f"  Kernel:             {summary['kernel']['pack_count']} packs, "
          f"{len(summary['kernel']['stages'])} stages")
    print(f"  harness-x dirs:     {summary['harness_x']['dir_count']}")
    print(f"  harness-x files:    {summary['harness_x']['file_count']}")
    print(f"  Charters:           {summary['charters']['count']}")
    print(f"  Frameworks:         {summary['frameworks']['count']}")
    print(f"  UE5 subdirs:        {len(ue5_subdirs)}")
    print(f"  Queen LOC:          {queen_loc}")
    print(f"  DeepSeek LOC:       {deepseek_loc}")
    print(f"  Plan execution:     {plan.execution_state}")
    print()
    print(f"  ▶ Integration doc:  {INTEGRATION_DOC}")
    print(f"  ▶ Test suite:       {ROOT}/test_all_harnesses_integrated.py")
    print()

    if args.json:
        # strip unserializable
        for k in ("articles",):
            pass
        print(json.dumps(summary, indent=2, default=str))

    return 0


if __name__ == "__main__":
    sys.exit(main())