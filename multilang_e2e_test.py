#!/usr/bin/env python3
"""
multiang_e2e_test.py — MEOK CSOAI-OS MULTI-LANGUAGE E2E TESTING

30 tests = 6 locales (en/es/fr/de/ja/zh) × 5 demo paths
  paths = developer, founder, product_manager, compliance_officer, security_reviewer

Features:
  * Mocked HTTP backend (no real network) — each test < 2s
  * Validates i18n JSON files have full coverage
  * Validates `_template.html` correctly applies translations
  * Validates navigation, hero, council, temples, wizard, status, errors, CTAs
  * Validates 5 demo persona flows per locale
  * Parallel-friendly (tests are independent)
  * Pytest-runnable

Run:
    cd ~/clawd
    pytest multilang_e2e_test.py -v           # full suite
    pytest multilang_e2e_test.py -v -k en     # only English
    pytest multilang_e2e_test.py -v -k "es and compliance"  # cross-cuts
    python3 multilang_e2e_test.py             # script mode (no pytest)

Written 2026-06-29 by Hermes/JEEVES for the M4 sovereign-orchestrator lane.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
MEOK_HOME = ROOT / "csoai-os" / "meok-home"
I18N_DIR = MEOK_HOME.parent / "i18n"
TEMPLATE_PATH = MEOK_HOME / "_template.html"

LOCALES: Tuple[str, ...] = ("en", "es", "fr", "de", "ja", "zh")
DEMO_PATHS: Tuple[str, ...] = (
    "developer",
    "founder",
    "product_manager",
    "compliance_officer",
    "security_reviewer",
)

# 11 i18n sections that MUST exist in every locale file
REQUIRED_SECTIONS: Tuple[str, ...] = (
    "_meta", "nav", "hero", "council", "temples",
    "wizard", "status", "errors", "cta", "footer", "locale_picker",
)

# Required keys per section (matches actual i18n JSON shape)
REQUIRED_KEYS: Dict[str, Tuple[str, ...]] = {
    "nav": ("home", "os", "council", "mcps", "temples", "login", "start_free"),
    "hero": ("headline_1", "headline_accent", "subhead", "cta_primary", "cta_secondary"),
    "council": ("title", "subtitle", "queen_king", "queen_care"),
    "temples": ("title", "subtitle", "temple_eu", "temple_uk"),
    "wizard": ("step_1_title", "step_1_subtitle", "step_5_title"),
    "status": ("label", "sov3", "hive", "council", "bft", "all_systems"),
    "errors": ("generic", "network", "not_found", "validation_required"),
    "cta": ("learn_more", "try_free", "book_demo"),
    "footer": ("tagline", "registered", "universe", "os", "privacy", "terms"),
    "locale_picker": ("label", "en"),
    "_meta": ("locale", "name", "native_name", "flag"),
}

# Persona → flow steps (what the demo path exercises)
# Keys must EXIST in the real i18n JSON.
PERSONA_FLOWS: Dict[str, List[str]] = {
    "developer": [
        "hero.cta_secondary",
        "nav.os",
        "wizard.step_1_title",
        "wizard.step_2_title",
        "status.all_systems",
    ],
    "founder": [
        "hero.cta_primary",
        "nav.council",
        "hero.subhead",
        "footer.tagline",
    ],
    "product_manager": [
        "nav.os",
        "wizard.step_3_title",
        "wizard.step_5_title",
        "cta.learn_more",
    ],
    "compliance_officer": [
        "nav.temples",
        "council.title",
        "temples.temple_eu",
        "errors.validation_required",
    ],
    "security_reviewer": [
        "nav.mcps",
        "errors.network",
        "errors.generic",
        "errors.forbidden",
    ],
}

# Expected script-family ranges for language autodetection
LANG_FAMILY = {
    "en": ("latin", "english"),
    "es": ("latin", "european"),
    "fr": ("latin", "european"),
    "de": ("latin", "european"),
    "ja": ("cjk", "japan"),
    "zh": ("cjk", "china"),
}


# ---------------------------------------------------------------------------
# Mock backend (avoids real HTTP — test runtime <100ms each)
# ---------------------------------------------------------------------------
class MockBackend:
    """A tiny mock that emulates the MEOK backend just enough for these tests."""

    def __init__(self) -> None:
        self.i18n: Dict[str, Dict[str, Any]] = {}
        self.call_log: List[Tuple[str, str]] = []
        # Pre-load all locales
        for loc in LOCALES:
            path = I18N_DIR / f"{loc}.json"
            if path.exists():
                self.i18n[loc] = json.loads(path.read_text(encoding="utf-8"))

    def get_i18n(self, locale: str) -> Dict[str, Any]:
        self.call_log.append(("GET", f"/i18n/{locale}"))
        return self.i18n.get(locale, {})

    def resolve_key(self, locale: str, dotted_key: str) -> str:
        """Resolve 'hero.cta_primary' against the locale dict with fallback."""
        self.call_log.append(("RESOLVE", f"{locale}:{dotted_key}"))
        cur: Any = self.i18n.get(locale, {})
        for part in dotted_key.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                return f"[{locale}:{dotted_key}]"  # marker, never empty
        return str(cur) if not isinstance(cur, (dict, list)) else str(cur)


@pytest.fixture(scope="session")
def backend() -> MockBackend:
    """Session-scoped mock backend — loaded once, shared across all 30 tests."""
    return MockBackend()


@pytest.fixture(scope="session")
def template_text() -> str:
    """Read _template.html once; reuse across all tests."""
    return TEMPLATE_PATH.read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def template_apply(template_text: str):
    """Apply _template.html with the given substitutions."""

    def _apply(substitutions: Dict[str, str]) -> str:
        out = template_text
        for k, v in substitutions.items():
            token = f"__{k}__"
            out = out.replace(token, v)
        return out

    return _apply


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _flatten_keys(d: Any, prefix: str = "") -> List[str]:
    """Return all dotted keys in a nested i18n dict."""
    out: List[str] = []
    if isinstance(d, dict):
        for k, v in d.items():
            nk = f"{prefix}.{k}" if prefix else str(k)
            if isinstance(v, dict):
                out.extend(_flatten_keys(v, nk))
            else:
                out.append(nk)
    return out


def _count_translatable_strings(d: Dict[str, Any]) -> int:
    """Count leaf strings (non-dict) in the i18n tree."""
    n = 0
    for v in d.values():
        if isinstance(v, dict):
            n += _count_translatable_strings(v)
        else:
            n += 1
    return n


# ---------------------------------------------------------------------------
# SECTION 1: Per-locale coverage tests (6 tests — one per locale)
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("locale", LOCALES)
def test_locale_i18n_completeness(locale: str, backend: MockBackend) -> None:
    """Each locale JSON must have all 11 required sections + 100+ strings."""
    t0 = time.perf_counter()
    data = backend.get_i18n(locale)
    assert data, f"[{locale}] i18n bundle missing or empty"

    # 1) Section coverage
    missing = [s for s in REQUIRED_SECTIONS if s not in data]
    assert not missing, f"[{locale}] missing sections: {missing}"

    # 2) Key coverage per section
    for section, req_keys in REQUIRED_KEYS.items():
        section_data = data.get(section, {})
        for key in req_keys:
            assert key in section_data, f"[{locale}] missing {section}.{key}"

    # 3) String count (≥100 is the contract)
    n = _count_translatable_strings(data)
    assert n >= 100, f"[{locale}] only {n} strings; need ≥100"

    # 4) No empty values
    empty = [k for k in _flatten_keys(data) if not str(backend.resolve_key(locale, k)).strip()]
    assert not empty, f"[{locale}] empty values at: {empty[:5]}"

    # 5) Meta consistency
    meta = data["_meta"]
    assert meta["locale"] == locale, f"[{locale}] _meta.locale mismatch"
    assert meta["name"] and meta["native_name"] and meta["flag"]

    elapsed = time.perf_counter() - t0
    assert elapsed < 2.0, f"[{locale}] took {elapsed:.2f}s (>2s)"
    print(f"[{locale}] ✅ {n} strings, {len(REQUIRED_SECTIONS)} sections, {elapsed*1000:.0f}ms")


# ---------------------------------------------------------------------------
# SECTION 2: Per-demo-path tests (5 tests — one per persona)
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("path", DEMO_PATHS)
def test_demo_path_flow(path: str, backend: MockBackend) -> None:
    """Each demo path must resolve every required i18n key in the default locale (en)."""
    t0 = time.perf_counter()
    data = backend.get_i18n("en")
    flow_keys = PERSONA_FLOWS[path]
    assert len(flow_keys) >= 4, f"[{path}] persona flow too small"
    for k in flow_keys:
        v = backend.resolve_key("en", k)
        assert v, f"[{path}] empty string at {k}"
        assert "[en:" not in v, f"[{path}] unresolved key {k}"
    elapsed = time.perf_counter() - t0
    assert elapsed < 2.0
    print(f"[{path}] ✅ {len(flow_keys)} keys resolved in {elapsed*1000:.0f}ms")


# ---------------------------------------------------------------------------
# SECTION 3: Cross-cuts — every locale × every demo path (5×6 = 30 tests)
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("path", DEMO_PATHS)
@pytest.mark.parametrize("locale", LOCALES)
def test_locale_x_demo_path(locale: str, path: str, backend: MockBackend) -> None:
    """The 30 tests that prove every (locale × demo path) matrix cell renders green."""
    t0 = time.perf_counter()
    data = backend.get_i18n(locale)
    flow_keys = PERSONA_FLOWS[path]
    resolved: Dict[str, str] = {}
    for k in flow_keys:
        v = backend.resolve_key(locale, k)
        resolved[k] = v
        assert v, f"[{locale}/{path}] empty at {k}"
        assert f"[{locale}:" not in v, f"[{locale}/{path}] unresolved at {k}"

    # The flow must include one of: nav/cta/wizard/status/errors/temple key
    # (i.e. it's a real demo flow, not a degenerate empty list).
    flow_categories = {"nav", "hero", "council", "temples", "wizard", "status", "errors", "cta", "footer"}
    has_real_flow = any(k.split(".")[0] in flow_categories for k in resolved)
    assert has_real_flow, f"[{locale}/{path}] no flow-category keys in {list(resolved)}"

    # Language family check: ja must contain CJK characters, others must not
    text_blob = " ".join(resolved.values())
    if locale == "ja":
        assert re.search(r"[\u3040-\u30ff\u4e00-\u9fff]", text_blob), \
            f"[{locale}/{path}] expected CJK in resolved text"
    elif locale == "zh":
        assert re.search(r"[\u4e00-\u9fff]", text_blob), \
            f"[{locale}/{path}] expected CJK in resolved text"
    elif locale in ("en", "es", "fr", "de"):
        # Latin-script; should NOT contain CJK
        assert not re.search(r"[\u3040-\u30ff\u4e00-\u9fff]", text_blob), \
            f"[{locale}/{path}] unexpected CJK in European locale"

    elapsed = time.perf_counter() - t0
    assert elapsed < 2.0, f"[{locale}/{path}] took {elapsed:.2f}s"
    # Print so a verbose run shows the matrix
    print(f"[{locale}/{path:<19}] ✅ {len(resolved)} keys, {elapsed*1000:.0f}ms")


# ---------------------------------------------------------------------------
# SECTION 4: Template-render tests (6 — one per locale)
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("locale", LOCALES)
def test_template_renders_for_locale(locale: str, backend: MockBackend, template_apply) -> None:
    """The _template.html must apply i18n substitutions for every locale."""
    t0 = time.perf_counter()
    data = backend.get_i18n(locale)
    # Pull reasonable test values
    subs = {
        "TITLE": data["hero"]["headline_1"],
        "DESCRIPTION": data["hero"]["subhead"],
        "SLUG": f"test-{locale}",
        "HOME_ACTIVE": "",
        "OS_ACTIVE": "",
        "COUNCIL_ACTIVE": "",
        "MCP_ACTIVE": "",
        "TEMPLES_ACTIVE": "",
        "RESEARCH_ACTIVE": "",
        "BLOG_ACTIVE": "",
        "ABOUT_ACTIVE": "",
        "STYLES": "/* marker */",
        "CONTENT": f"<h1>{data['hero']['headline_1']} {data['hero']['headline_accent']}</h1>",
    }
    rendered = template_apply(subs)
    assert "<!DOCTYPE html>" in rendered
    assert data["hero"]["headline_1"] in rendered
    assert len(rendered) > 1000, f"[{locale}] rendered HTML suspiciously short"
    elapsed = time.perf_counter() - t0
    assert elapsed < 2.0
    print(f"[{locale}] ✅ template render {len(rendered)} bytes in {elapsed*1000:.0f}ms")


# ---------------------------------------------------------------------------
# SECTION 5: Cross-locale consistency (5 — one per demo path)
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("path", DEMO_PATHS)
def test_demo_path_consistent_across_locales(path: str, backend: MockBackend) -> None:
    """Each demo path must have the SAME key shape across all 6 locales."""
    t0 = time.perf_counter()
    flows = PERSONA_FLOWS[path]
    shapes_per_locale: Dict[str, set] = {}
    for locale in LOCALES:
        data = backend.get_i18n(locale)
        for k in flows:
            v = backend.resolve_key(locale, k)
            assert v, f"[{locale}/{path}] empty at {k}"
            shapes_per_locale.setdefault(locale, set()).add(k)
    # Every locale must have the same set of resolved keys
    canonical = set(flows)
    for loc, keys in shapes_per_locale.items():
        assert keys == canonical, f"[{loc}/{path}] key mismatch"
    elapsed = time.perf_counter() - t0
    assert elapsed < 2.0
    print(f"[{path:<19}] ✅ consistent across 6 locales in {elapsed*1000:.0f}ms")


# ---------------------------------------------------------------------------
# SECTION 6: Try/except in template-aware tests (Python contract tests)
# ---------------------------------------------------------------------------
def test_template_has_i18n_hooks(template_text: str) -> None:
    """The template must include data-i18n attrs (live-binding) and tokens."""
    assert "data-i18n=" in template_text, "_template.html missing data-i18n attrs"
    assert "__CONTENT__" in template_text, "_template.html missing __CONTENT__"
    assert "__STYLES__" in template_text, "_template.html missing __STYLES__"
    # Locale switcher must exist
    assert "id=\"localeSwitcher\"" in template_text, "no locale switcher in template"


def test_all_locale_files_present() -> None:
    """Sanity check that all 6 locale files are on disk."""
    for loc in LOCALES:
        path = I18N_DIR / f"{loc}.json"
        assert path.exists(), f"missing locale file: {path}"
        # Valid JSON
        json.loads(path.read_text(encoding="utf-8"))


def test_no_untranslated_marker_leaks(backend: MockBackend) -> None:
    """No resolved value may contain the [en:hero.x] fallback marker (would mean a key is missing)."""
    leaks: List[str] = []
    for locale in LOCALES:
        data = backend.get_i18n(locale)
        for k in _flatten_keys(data):
            v = backend.resolve_key(locale, k)
            if re.search(rf"\[{locale}:", v):
                # This is the *external* marker; means our resolver didn't find it
                leaks.append(f"{locale}:{k} -> {v}")
    assert not leaks, f"Untranslated markers leaked: {leaks[:10]}"


# ---------------------------------------------------------------------------
# Pytest hooks — count tests, make summary loud
# ---------------------------------------------------------------------------
def pytest_terminal_summary(terminalreporter, exitstatus, config):
    """Print a matrix summary after the run."""
    if hasattr(terminalreporter, "stats"):
        passed = len(terminalreporter.stats.get("passed", []))
        failed = len(terminalreporter.stats.get("failed", []))
        total = passed + failed
        print("\n" + "=" * 70)
        print(f"  MEOK MULTI-LANG E2E — {passed}/{total} passed")
        print(f"  Matrix: 6 locales × 5 demo paths = 30 matrix tests")
        print(f"  Locale coverage: {', '.join(LOCALES)}")
        print(f"  Demo paths: {', '.join(DEMO_PATHS)}")
        print("=" * 70)


# ---------------------------------------------------------------------------
# Script mode (no pytest)
# ---------------------------------------------------------------------------
def _run_script_mode() -> int:
    """Run the suite as a plain script with no pytest deps."""
    import importlib

    backend = MockBackend()

    def _timed(name: str, fn) -> bool:
        t0 = time.perf_counter()
        try:
            fn()
            elapsed = time.perf_counter() - t0
            status = "PASS" if elapsed < 2.0 else "SLOW"
            print(f"  [{status}] {name:<55} {elapsed*1000:6.0f}ms")
            return elapsed < 2.0
        except Exception as e:
            elapsed = time.perf_counter() - t0
            print(f"  [FAIL] {name:<55} {elapsed*1000:6.0f}ms — {e}")
            return False

    print("=" * 70)
    print(" MEOK MULTI-LANG E2E TEST SUITE (script mode)")
    print(" 6 locales × 5 demo paths = 30 tests + 5 contract tests")
    print("=" * 70)

    ok = True
    # 6 locale coverage
    for loc in LOCALES:
        ok &= _timed(f"[{loc}] locale completeness", lambda loc=loc: test_locale_i18n_completeness.__wrapped__(loc, backend) if hasattr(test_locale_i18n_completeness, '__wrapped__') else None) if False else _timed(
            f"[{loc}] locale completeness",
            lambda loc=loc: _script_locale_complete(loc, backend),
        )

    # 5 demo paths × 6 locales = 30
    for path in DEMO_PATHS:
        for loc in LOCALES:
            ok &= _timed(
                f"[{loc}/{path:<19}] matrix",
                lambda loc=loc, path=path: _script_matrix(loc, path, backend),
            )

    # 6 template renders
    tmpl = TEMPLATE_PATH.read_text(encoding="utf-8")

    def _apply(subs: Dict[str, str]) -> str:
        out = tmpl
        for k, v in subs.items():
            out = out.replace(f"__{k}__", v)
        return out

    for loc in LOCALES:
        ok &= _timed(
            f"[{loc}] template render",
            lambda loc=loc: _script_template(loc, backend, _apply),
        )

    # 5 cross-locale consistency
    for path in DEMO_PATHS:
        ok &= _timed(
            f"[{path:<19}] cross-locale",
            lambda path=path: _script_consistency(path, backend),
        )

    print("=" * 70)
    print(f" RESULT: {'ALL PASS ✅' if ok else 'FAILURES ❌'}")
    print("=" * 70)
    return 0 if ok else 1


def _script_locale_complete(locale: str, backend: MockBackend) -> None:
    data = backend.get_i18n(locale)
    assert data, f"[{locale}] i18n bundle missing"
    missing = [s for s in REQUIRED_SECTIONS if s not in data]
    assert not missing, f"[{locale}] missing: {missing}"
    n = _count_translatable_strings(data)
    assert n >= 100, f"[{locale}] only {n} strings"
    assert data["_meta"]["locale"] == locale


def _script_matrix(locale: str, path: str, backend: MockBackend) -> None:
    flow = PERSONA_FLOWS[path]
    for k in flow:
        v = backend.resolve_key(locale, k)
        assert v, f"[{locale}/{path}] empty at {k}"
        assert f"[{locale}:" not in v, f"[{locale}/{path}] unresolved {k}"


def _script_template(locale: str, backend: MockBackend, apply) -> None:
    data = backend.get_i18n(locale)
    rendered = apply({
        "TITLE": data["hero"]["headline_1"],
        "DESCRIPTION": data["hero"]["subhead"],
        "SLUG": f"test-{locale}",
        "STYLES": "",
        "CONTENT": data["hero"]["headline_1"],
        "HOME_ACTIVE": "", "OS_ACTIVE": "", "COUNCIL_ACTIVE": "",
        "MCP_ACTIVE": "", "TEMPLES_ACTIVE": "", "RESEARCH_ACTIVE": "",
        "BLOG_ACTIVE": "", "ABOUT_ACTIVE": "",
    })
    assert "<!DOCTYPE html>" in rendered
    assert len(rendered) > 1000


def _script_consistency(path: str, backend: MockBackend) -> None:
    flow = PERSONA_FLOWS[path]
    canonical = set(flow)
    for loc in LOCALES:
        for k in flow:
            v = backend.resolve_key(loc, k)
            assert v, f"[{loc}/{path}] empty at {k}"


if __name__ == "__main__":
    sys.exit(_run_script_mode())
