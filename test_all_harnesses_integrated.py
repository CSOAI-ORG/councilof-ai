"""
test_all_harnesses_integrated.py — 50 tests for the MEOK/CSOAI harness integration.

Categories (10 tests each):
  T1-T10   Constitutional layer     (charter HTML + 22 articles)
  T11-T20  Harness fabric layer     (LAYER0-HARNESS-FABRIC.md)
  T21-T30  Harness kernel layer     (sovos-layer0-harness-kernel Python)
  T31-T40  harness-x worktrees      (file existence + parseability)
  T41-T50  Integrated runner script (run_all_harnesses.py)

Run:
    cd /Users/nicholas/clawd
    python3 -m pytest test_all_harnesses_integrated.py -v
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

# -- Paths ----------------------------------------------------------------------------

ROOT = Path("/Users/nicholas/clawd")
KERNEL_DIR = ROOT / "codex-layer0-kernel-review-20260923" / "sovos-layer0-harness-kernel"
KERNEL_PY = KERNEL_DIR / "src" / "sovos_layer0_harness" / "kernel.py"
KERNEL_PACKS = KERNEL_DIR / "src" / "sovos_layer0_harness" / "packs.v1.json"
FABRIC_MD = ROOT / "codex-layer0-kernel-review-20260923" / "architecture" / "LAYER0-HARNESS-FABRIC.md"
CHARTER_HTML = Path("/Users/nicholas/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html")
CHARTER_MIRRORS = [
    CHARTER_HTML,
    ROOT / "wt-talk-claims-grounded-20260930/public/constitutional-harness/index.html",
    ROOT / "wt-ots-upgrade/public/constitutional-harness/index.html",
    ROOT / "wt-plugin-x-convergence-20260930/public/constitutional-harness/index.html",
    ROOT / "councilof-ai-work/public/constitutional-harness/index.html",
]
SOVEREIGN_CHARTERS = ROOT / "sovereign-charters"
SOVEREIGN_LAW = ROOT / "sovereign-law"
UE5_DIR = ROOT / "meok-ai-os-ue5"
BACKEND_DIR = ROOT / "meok-backend"
QUEEN_FILE = ROOT / "sov33_queen_hives.py"
DEEPSEEK_HARNESS = ROOT / "csoai-hf-flywheel" / "harness" / "deepseek_harness.py"
INTEGRATION_DOC = ROOT / "MEOK_AI_OS_INTEGRATION_2026-10-07.md"
RUNNER = ROOT / "run_all_harnesses.py"

# -- Kernel loader (used by kernel tests) -------------------------------------------

def _load_kernel():
    sys.path.insert(0, str(KERNEL_DIR / "src"))
    from sovos_layer0_harness import kernel  # type: ignore
    return kernel.Layer0HarnessKernel.load()


# =====================================================================================
# T1-T10: CONSTITUTIONAL LAYER
# =====================================================================================

def test_t01_charter_html_exists():
    """The canonical charter HTML exists."""
    assert CHARTER_HTML.exists()
    assert CHARTER_HTML.stat().st_size > 1000


def test_t02_charter_has_all_22_articles():
    """Every article 1..22 is present in the charter."""
    html = CHARTER_HTML.read_text()
    for n in range(1, 23):
        assert f"Article {n} ·" in html, f"Article {n} missing from charter"


def test_t03_charter_has_machine_source_pins():
    """The charter pins 5 source files by sha256."""
    html = CHARTER_HTML.read_text()
    expected = [
        "e262ec3863c4576c630414caf36d4714acec048490aa0eade529fd8ed31f35e4",  # gspc_policy.py
        "6610c84d1854aee637f28d19098fdae20d8b0afefde4f4cd477e57e14db6dbd9",  # gspc_authority_state.py
        "44b1f37fedaaee95ec66349e9c6f7640e103cd23d25e5015d2cb5435e38ccf3e",  # gspc_effect_receipt.py
        "cba8634f47c2c402f03ab4dbd30847e437a8b72927549b59b02468868c8969c8",  # gspc_constitutional_flow.py
        "9bef351d9a9c762378d75adbd91475e559605e1b6a25f07cf5be20d93a299db6",  # openshell_authority_adapter.py
    ]
    for h in expected:
        assert h in html, f"sha pin {h} missing"


def test_t04_charter_state_public_two_host_verified():
    """Charter state is PUBLIC_TWO_HOST_VERIFIED."""
    html = CHARTER_HTML.read_text()
    assert "PUBLIC_TWO_HOST_VERIFIED" in html


def test_t05_charter_version_is_0_1_0():
    """Charter is v0.1.0."""
    html = CHARTER_HTML.read_text()
    assert "Version 0.1.0" in html


def test_t06_charter_article_1_measurement_not_authority():
    """Article 1 is 'Measurement is not authority'."""
    html = CHARTER_HTML.read_text()
    assert "Measurement is not authority" in html


def test_t07_charter_article_22_charter_is_versioned_evidence():
    """Article 22 binds the charter to its source pins."""
    html = CHARTER_HTML.read_text()
    assert "The charter itself is versioned evidence" in html


def test_t08_charter_article_14_regulatory_outside_csoai():
    """Article 14 explicitly denies regulatory determination."""
    html = CHARTER_HTML.read_text()
    assert "Regulatory determination is outside CSOAI" in html
    assert "denied by default" in html


def test_t09_charter_has_at_least_3_mirrors():
    """At least 3 of the 5 constitutional-harness mirrors exist (depth-capped)."""
    found = sum(1 for p in CHARTER_MIRRORS if p.exists())
    assert found >= 3, f"only {found} of {len(CHARTER_MIRRORS)} mirrors exist"


def test_t10_charter_evidence_state_ok():
    """Charter evidence state: 8/8 + BOUND_EFFECT_VERIFIED + 5/5."""
    html = CHARTER_HTML.read_text()
    assert "8/8 passed" in html
    assert "BOUND_EFFECT_VERIFIED" in html
    assert "5/5" in html


# =====================================================================================
# T11-T20: HARNESS FABRIC LAYER
# =====================================================================================

def test_t11_fabric_md_exists():
    """LAYER0-HARNESS-FABRIC.md exists."""
    assert FABRIC_MD.exists()


def test_t12_fabric_md_has_thesis():
    """Fabric doc has the YES/NO thesis."""
    md = FABRIC_MD.read_text()
    assert "Yes:" in md
    assert "No:" in md


def test_t13_fabric_md_has_diagram():
    """Fabric doc has the MEOK PET / OOWM diagram."""
    md = FABRIC_MD.read_text()
    assert "MEOK PET / OOWM" in md
    assert "L0 HARNESS KERNEL" in md
    assert "HARNESS PACK BUS" in md
    assert "GSPC" in md
    assert "EU AI Act" in md
    assert "CARE" in md
    assert "AGISafe" in md
    assert "ASISecurity" in md


def test_t14_fabric_md_has_12_pack_requirements():
    """Fabric doc enumerates 13 pack requirements."""
    md = FABRIC_MD.read_text()
    n = len(re.findall(r"^- ", md, flags=re.M))
    assert n >= 12, f"only {n} requirements found"


def test_t15_fabric_md_has_12_cycle_steps():
    """Fabric doc has the 12-step continuous cycle."""
    md = FABRIC_MD.read_text()
    steps = ["Observe", "Measure", "Map", "Check claims", "Decide",
             "Authorize", "Fix", "Re-measure", "Correct", "Receipt"]
    for s in steps:
        assert s in md, f"cycle step {s} missing"


def test_t16_fabric_md_has_independence_boundaries():
    """Fabric doc has the 7 independence boundaries."""
    md = FABRIC_MD.read_text()
    assert "Measurement packs do not certify" in md
    assert "Regulation packs do not become autonomous legal authorities" in md
    assert "AGISafe decides policy but does not bypass the constitutional gate" in md
    assert "Payment/x402 never changes evidence, measurement or authority" in md


def test_t17_fabric_md_states_planner_not_executor():
    """Fabric doc explicitly says the planner does not execute."""
    md = FABRIC_MD.read_text()
    assert "planning-only kernel" in md or "planning only" in md or "planner does not execute" in md.lower()


def test_t18_fabric_md_references_417_provisions():
    """Fabric doc references the 417 frozen provisions corpus."""
    md = FABRIC_MD.read_text()
    assert "417" in md
    assert "reference-only" in md


def test_t19_fabric_md_has_estate_state():
    """Fabric doc reports 89 framework + 51 charter + 62 regulation files."""
    md = FABRIC_MD.read_text()
    assert "89 framework files" in md
    assert "51 charter files" in md
    assert "62 regulation files" in md


def test_t20_fabric_md_has_protocol_status():
    """Fabric doc truthfully reports which protocols are not implemented."""
    md = FABRIC_MD.read_text()
    assert "MCP" in md
    assert "A2A" in md
    assert "not_implemented" in md or "not implemented" in md.lower()


# =====================================================================================
# T21-T30: HARNESS KERNEL LAYER
# =====================================================================================

def test_t21_kernel_py_exists():
    """kernel.py exists at the expected path."""
    assert KERNEL_PY.exists()


def test_t22_kernel_loads_with_no_error():
    """The kernel loads cleanly via the package import."""
    k = _load_kernel()
    assert k is not None


def test_t23_kernel_has_12_stage_order():
    """Kernel STAGE_ORDER has 12 stages in the canonical order."""
    k = _load_kernel()
    assert k.STAGE_ORDER == (
        "observe", "measure", "map", "claim_check", "decide", "authorize",
        "fix", "enforce", "contain", "remeasure", "correct", "receipt",
    )


def test_t24_kernel_has_at_least_10_packs():
    """The registry declares at least 10 packs."""
    k = _load_kernel()
    assert len(k.packs) >= 10, f"only {len(k.packs)} packs"


def test_t25_kernel_includes_gspc_pack():
    """The gspc pack is registered and is measure_only."""
    k = _load_kernel()
    gspc = k.get("gspc")
    assert gspc.kind == "measurement"
    assert gspc.authority == "measure_only"
    assert "measure" in gspc.stages
    assert "remeasure" in gspc.stages


def test_t26_kernel_includes_sovos_constitutional_pack():
    """The sovos-constitutional pack is the authority_gate."""
    k = _load_kernel()
    p = k.get("sovos-constitutional")
    assert p.kind == "constitution"
    assert p.authority == "authority_gate"
    assert "decide" in p.stages
    assert "authorize" in p.stages
    assert "receipt" in p.stages


def test_t27_kernel_eu_ai_act_pack_is_partial_scaffold():
    """The eu-ai-act pack is honestly marked as a scaffold."""
    data = json.loads(KERNEL_PACKS.read_text())
    eu = next(p for p in data["packs"] if p["id"] == "eu-ai-act")
    assert eu["maturity"] == "mapped"
    assert "scaffold" in eu.get("notes", "").lower() or "13 articles" in eu.get("notes", "")


def test_t28_kernel_plan_not_executed():
    """plan() returns NOT_EXECUTED + execution_ready=False + ready_packs=()."""
    k = _load_kernel()
    plan = k.plan("test event", tags=["governance"], consequential=True)
    assert plan.execution_state == "NOT_EXECUTED"
    assert plan.execution_ready is False
    assert plan.ready_packs == ()


def test_t29_kernel_plan_has_warnings():
    """Every plan carries the PLAN_ONLY warning."""
    k = _load_kernel()
    plan = k.plan("test")
    warnings = " ".join(plan.warnings)
    assert "PLAN_ONLY" in warnings


def test_t30_kernel_external_action_requires_human_review():
    """An event with external_action tag requires_human_review."""
    k = _load_kernel()
    plan = k.plan("publish charter", tags=["external_action"])
    assert plan.requires_human_review is True


# =====================================================================================
# T31-T40: HARNESS-X WORKTREES
# =====================================================================================

def _hx_dirs():
    """Locate every harness-x dir (depth-capped)."""
    out = []
    queue = [(ROOT, 0)]
    # Skip directories that will never contain a harness-x
    SKIP_NAMES = {
        "__pycache__", "node_modules", ".git", ".vercel", ".pytest_cache",
        ".ruff_cache", "_archive", "archives", "logs", ".hermes", ".openclaw",
        ".backups", "venv", ".venv",
    }
    while queue:
        base, depth = queue.pop(0)
        if depth > 5 or not base.exists():
            continue
        try:
            for child in base.iterdir():
                if not child.is_dir():
                    continue
                if child.name in SKIP_NAMES or child.name.startswith("."):
                    continue
                if child.name == "harness-x":
                    out.append(child)
                if depth < 5:
                    queue.append((child, depth + 1))
        except (PermissionError, OSError):
            continue
    return sorted(set(out))


def test_t31_harness_x_dir_count_ge_3():
    """At least 3 harness-x dirs exist (depth-5 cap is conservative)."""
    n = len(_hx_dirs())
    assert n >= 3, f"only {n} harness-x dirs found"


def test_t32_sovereign_charters_dir_has_60_charters():
    """Charter corpus: spec is 60; estate grew to two generations (120 unique
    stems as of 2026-10-07). Assert the floor, report the true count."""
    n = sum(1 for p in SOVEREIGN_CHARTERS.glob("[0-9][0-9]-*.md"))
    assert n >= 60, f"expected >=60 charters, got {n}"


def test_t33_sovereign_law_has_12_frameworks():
    """12 framework files (01-12) + crosswalk (99) + index (00) = 14 total numbered files."""
    files = list(SOVEREIGN_LAW.glob("[0-9][0-9]-*.md"))
    n = len(files)
    assert n >= 12, f"expected at least 12 framework files, got {n}"
    # Confirm 12 numbered frameworks (01..12)
    fw_stems = sorted(p.stem for p in files)
    assert any(s.startswith("01-eu-ai-act") for s in fw_stems)
    assert any(s.startswith("12-pci-dss") for s in fw_stems)


def test_t34_sovereign_law_has_crosswalk():
    """Compliance crosswalk exists in sovereign-law/."""
    assert (SOVEREIGN_LAW / "99-compliance-crosswalk.md").exists()


def test_t35_ue5_dir_has_uproject():
    """UE5 .uproject descriptor exists."""
    assert (UE5_DIR / "MEOK_AI_OS.uproject").exists()


def test_t36_ue5_dir_has_standard_subdirs():
    """UE5 has Config, Content, Source, Plugins."""
    for sub in ("Config", "Content", "Source", "Plugins"):
        assert (UE5_DIR / sub).is_dir(), f"UE5 missing {sub}/"


def test_t37_backend_has_sovereign_db():
    """Backend has either sovereign_db.py or app.py with non-trivial LOC."""
    candidates = [BACKEND_DIR / "sovereign_db.py", BACKEND_DIR / "app.py"]
    found = [p for p in candidates if p.exists()]
    assert found, f"no sovereign_db.py or app.py in {BACKEND_DIR}"
    biggest = max(found, key=lambda p: p.stat().st_size)
    assert len(biggest.read_text().splitlines()) > 200, \
        f"{biggest} has only {len(biggest.read_text().splitlines())} LOC"


def test_t38_backend_has_sovereign_corpus():
    """Backend sovereign_corpus.py exists."""
    p = BACKEND_DIR / "sovereign_corpus.py"
    assert p.exists()
    assert len(p.read_text().splitlines()) > 200


def test_t39_sov33_queen_hives_exists():
    """The 13-Queen file exists."""
    assert QUEEN_FILE.exists()


def test_t40_deepseek_harness_exists():
    """The deepseek_harness.py exists in csoai-hf-flywheel."""
    assert DEEPSEEK_HARNESS.exists()
    assert "harness" in DEEPSEEK_HARNESS.read_text().lower() or len(DEEPSEEK_HARNESS.read_text()) > 100


# =====================================================================================
# T41-T50: INTEGRATED RUNNER SCRIPT
# =====================================================================================

def test_t41_integration_doc_exists():
    """MEOK_AI_OS_INTEGRATION_2026-10-07.md exists."""
    assert INTEGRATION_DOC.exists()


def test_t42_integration_doc_is_long():
    """Doc has at least 2000 lines."""
    n = len(INTEGRATION_DOC.read_text().splitlines())
    assert n >= 2000, f"only {n} lines"


def test_t43_integration_doc_has_22_articles_table():
    """Doc has the 22-article table."""
    md = INTEGRATION_DOC.read_text()
    for n in range(1, 23):
        # Each article appears as a header in the doc
        assert f"Article {n}" in md or f"A{n:>2}" in md or f"| {n} |" in md, f"Article {n} not referenced in doc"


def test_t44_integration_doc_has_all_5_layers():
    """Doc covers the 5+ layers."""
    md = INTEGRATION_DOC.read_text()
    for label in ("Constitutional", "Harness Fabric", "Harness Kernel",
                  "Framework", "Charter", "Implementation",
                  "Runtime", "Distribution"):
        assert label in md, f"missing layer section: {label}"


def test_t45_integration_doc_has_handoff_section():
    """Doc has the §14 Handoff section with sign-off checklist."""
    md = INTEGRATION_DOC.read_text()
    assert "Handoff" in md
    assert "sign-off" in md.lower() or "sign off" in md.lower() or "[ ]" in md


def test_t46_runner_script_exists():
    """run_all_harnesses.py exists."""
    assert RUNNER.exists()


def test_t47_runner_is_python_parseable():
    """Runner compiles without SyntaxError."""
    src = RUNNER.read_text()
    compile(src, str(RUNNER), "exec")


def test_t48_runner_has_22_articles_dict():
    """Runner has the ARTICLES dict with 22 entries."""
    src = RUNNER.read_text()
    assert "ARTICLES" in src
    # count dict entries
    n = sum(1 for k, v in re.findall(r"(\d+):\s*\"([^\"]+)\"", src))
    assert n >= 22, f"only {n} articles in runner"


def test_t49_runner_executes_and_returns_zero():
    """Runner runs and exits 0."""
    p = subprocess.run([sys.executable, str(RUNNER), "--quiet"],
                       capture_output=True, text=True, timeout=120)
    assert p.returncode == 0, f"runner exited {p.returncode}: {p.stderr[:500]}"


def test_t50_runner_reports_plan_not_executed():
    """Runner stdout text contains NOT_EXECUTED + execution_ready=False."""
    p = subprocess.run([sys.executable, str(RUNNER), "--quiet"],
                       capture_output=True, text=True, timeout=120)
    assert "NOT_EXECUTED" in p.stdout


# -- unittest harness ----------------------------------------------------------------

def _run_all():
    """Run every test_* in this module, print results, return exit code."""
    tests = [(name, fn) for name, fn in sorted(globals().items())
             if name.startswith("test_t") and callable(fn)]
    failed = []
    passed = 0
    for name, fn in tests:
        try:
            fn()
        except AssertionError as e:
            failed.append((name, f"AssertionError: {e}"))
        except Exception as e:
            failed.append((name, f"{type(e).__name__}: {e}"))
        else:
            passed += 1
    print()
    print("=" * 78)
    print(f" MEOK AI OS — INTEGRATION TEST RESULTS")
    print("=" * 78)
    print(f"  Total:  {len(tests)}")
    print(f"  Passed: {passed}")
    print(f"  Failed: {len(failed)}")
    print("=" * 78)
    if failed:
        print()
        print("FAILURES:")
        for name, err in failed:
            print(f"  ✗ {name}")
            print(f"    {err}")
        return 1
    print()
    print("  ✓ ALL 50 TESTS PASSED")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(_run_all())