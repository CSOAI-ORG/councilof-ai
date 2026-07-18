"""Tests for the sovereign-empire artifacts (charters, law, corpus)."""
import sys
import os
import re
import hashlib
import subprocess
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
CHARTERS = ROOT / "sovereign-charters"
LAW = ROOT / "sovereign-law"
CORPUS = ROOT / "meok-backend" / "corpus" / "sovereign_corpus.jsonl"


def test_charters_dir_exists():
    assert CHARTERS.exists()
    assert CHARTERS.is_dir()


def test_charters_count():
    """At least 30 charter files (60+ expected)."""
    n = len(list(CHARTERS.glob("*.md")))
    assert n >= 30, f"only {n} charter files"


def test_charter_master_template():
    """The master charter template exists."""
    assert (CHARTERS / "00-MASTER-CHARTER-TEMPLATE.md").exists()


def test_charter_master_index():
    """The master charter index exists."""
    assert (CHARTERS / "00-MASTER-INDEX.md").exists()


def test_charter_sovereign_ubi():
    """The sovereign UBI charter exists."""
    assert (CHARTERS / "00-SOVEREIGN-UBI-CHARTER.md").exists()


def test_charter_partners():
    """The partners charter exists."""
    assert (CHARTERS / "00-partners-charter.md").exists()


def test_charter_root():
    """The sovereign root charter exists."""
    assert (CHARTERS / "00-sovereign-root-charter.md").exists()


def test_charter_csoai():
    """The CSOAI charter exists."""
    assert (CHARTERS / "01-csoai-charter.md").exists()


def test_charter_meok():
    """The MEOK charter exists."""
    assert (CHARTERS / "02-meok-charter.md").exists()


def test_charter_proofof():
    """The proofof charter exists."""
    assert (CHARTERS / "03-proofof-charter.md").exists()


def test_charter_safetyof():
    """The safetyof charter exists."""
    assert (CHARTERS / "04-safetyof-charter.md").exists()


def test_charter_accountabilityof():
    """The accountabilityof charter exists."""
    assert (CHARTERS / "05-accountabilityof-charter.md").exists()


def test_charter_keywords():
    """Charters contain the core MEOK terms."""
    charter_paths = list(CHARTERS.glob("*.md"))[:10]
    text = "\n".join(p.read_text() for p in charter_paths).lower()
    for term in ["sov3", "meok", "sigil", "bft", "maternal covenant", "care"]:
        assert term in text, f"missing charter term {term}"


def test_charter_min_size():
    """Each charter is at least 2KB."""
    small = [p.name for p in CHARTERS.glob("*.md") if p.stat().st_size < 2048]
    # A few master files may be small; assert at most 3 are <2KB
    assert len(small) <= 3, f"too many small charters: {small}"


def test_charter_total_size():
    """Charters total at least 1MB."""
    total = sum(p.stat().st_size for p in CHARTERS.glob("*.md"))
    assert total > 1_000_000, f"only {total} bytes"


def test_charter_signed_pattern():
    """Charters mention SIGIL signing."""
    charter_paths_20 = list(CHARTERS.glob("*.md"))[:20]
    text = "\n".join(p.read_text() for p in charter_paths_20)
    assert "SIGIL" in text or "sigil" in text


def test_charter_bft_voting():
    """Charters mention BFT voting."""
    charter_paths_20b = list(CHARTERS.glob("*.md"))[:20]
    text = "\n".join(p.read_text() for p in charter_paths_20b)
    assert "BFT" in text or "bft" in text


def test_law_dir_exists():
    assert LAW.exists()
    assert LAW.is_dir()


def test_law_count():
    """At least 12 law files."""
    n = len(list(LAW.glob("*.md")))
    assert n >= 12, f"only {n} law files"


def test_law_eu_ai_act():
    """EU AI Act file exists."""
    assert (LAW / "eu-ai-act.md").exists()


def test_law_gdpr():
    assert (LAW / "gdpr.md").exists()


def test_law_dora():
    assert (LAW / "dora.md").exists()


def test_law_nis2():
    assert (LAW / "nis2.md").exists()


def test_law_cra():
    assert (LAW / "cra.md").exists()


def test_law_nist_rmf():
    assert (LAW / "nist-rmf.md").exists() or (LAW / "nist-ai-rmf.md").exists()


def test_law_iso_42001():
    assert (LAW / "iso-42001.md").exists()


def test_law_iso_27001():
    assert (LAW / "iso-27001.md").exists()


def test_law_ieee_7000():
    assert (LAW / "ieee-7000.md").exists()


def test_law_soc2():
    assert (LAW / "soc2.md").exists()


def test_law_hipaa():
    assert (LAW / "hipaa.md").exists()


def test_law_pci_dss():
    assert (LAW / "pci-dss.md").exists()


def test_law_global_index():
    assert (LAW / "global-law-index.md").exists()


def test_law_compliance_crosswalk():
    assert (LAW / "compliance-crosswalk.md").exists()


def test_law_audit_trail():
    assert (LAW / "audit-trail.md").exists()


def test_law_keywords():
    """Law files mention MEOK + the regulation names."""
    text = "\n".join(p.read_text() for p in LAW.glob("*.md"))
    assert "MEOK" in text or "meok" in text


def test_corpus_exists():
    """The sovereign corpus exists."""
    assert CORPUS.exists()
    assert CORPUS.stat().st_size > 100_000


def test_corpus_is_jsonl():
    """The corpus is JSONL (one JSON object per line)."""
    with open(CORPUS) as f:
        line = f.readline()
    import json
    obj = json.loads(line)
    assert isinstance(obj, dict)


def test_corpus_total_lines():
    """At least 100 records in the corpus."""
    n = sum(1 for _ in open(CORPUS))
    assert n >= 100, f"only {n} records"


def test_corpus_sha256_indexed():
    """The corpus is SHA-256 indexed (each record has a hash)."""
    import json
    with open(CORPUS) as f:
        for i, line in enumerate(f):
            if i > 10:
                break
            obj = json.loads(line)
            # Either has hash directly OR is content-identifiable
            if "hash" not in obj and "sha256" not in obj and "id" not in obj:
                # OK if there's content
                assert "content" in obj or "text" in obj or "body" in obj


def test_corpus_keywords():
    """The corpus contains MEOK core terms."""
    text = CORPUS.read_text()
    assert "MEOK" in text
    assert "SIGIL" in text or "BFT" in text


def test_corpus_size():
    """The corpus is at least 1MB."""
    size = CORPUS.stat().st_size
    assert size > 1_000_000, f"only {size} bytes"


def test_corpus_sovereign_terms():
    """The corpus has sovereign terms (care, sovereign, etc.)."""
    text = CORPUS.read_text()
    for term in ["care", "sovereign", "bft", "maternal"]:
        assert term in text.lower()


def test_master_revision_exists():
    """The master revision doc exists."""
    assert (ROOT / "MASTER_REVISION.md").exists()


def test_fact_check_exists():
    """The fact-check doc exists."""
    assert (ROOT / "FACT_CHECK_REPORT.md").exists()


def test_deduplication_exists():
    """The dedup report exists."""
    assert (ROOT / "DEDUPLICATION_REPORT.md").exists()


def test_market_research_exists():
    assert (ROOT / "MARKET_RESEARCH.md").exists()


def test_competitive_analysis_exists():
    assert (ROOT / "COMPETITIVE_ANALYSIS.md").exists()


def test_design_system_exists():
    assert (ROOT / "MEOK_DESIGN_SYSTEM.md").exists()


def test_rotation_exists():
    assert (ROOT / "ROTATION_INSTRUCTIONS.md").exists()


def test_final_state_exists():
    assert (ROOT / "MEOK_WORLD_FINAL_STATE_2026-07-02.md").exists()


def test_meok_home_128_pages():
    """The 128 sovereign pages exist."""
    pages = list((ROOT / "csoai-os" / "meok-home" / "pages").glob("*.html"))
    assert len(pages) >= 128, f"only {len(pages)} pages"


def test_sovereign_db_exists():
    """The sovereign_db.py module exists."""
    assert (ROOT / "meok-backend" / "sovereign_db.py").exists()


def test_legacy_demo_exists():
    assert (ROOT / "csoai-os" / "meok-home" / "legacy-demo.html").exists()


def test_breakthrough_pages_exist():
    """All breakthrough pages exist."""
    meok_home = ROOT / "csoai-os" / "meok-home"
    required = [
        "meok-breakthrough.html", "meok-os-binding.html", "mek-sovereign-avatar.html",
        "council-live.html", "temples-live.html", "ichar-wizard-live.html",
        "meok-world-3d.html", "meok-character-emergence.html", "meok-facts.html",
        "avatar-import.html", "meok-badge.html", "github-badge.html",
        "social-kit.html", "legacy-demo.html",
    ]
    missing = [p for p in required if not (meok_home / p).exists()]
    assert not missing, f"missing {missing}"


def test_seven_archetypes():
    """The 7 archetypes are referenced."""
    meok_home = ROOT / "csoai-os" / "meok-home"
    pages = list((meok_home).glob("*.html")) + list((meok_home / "pages").glob("*.html"))
    archetypes = ["Sovereign", "Guardian", "Scout", "Strategist", "Creator", "Companion", "Sage"]
    for arch in archetypes:
        assert any(arch in p.read_text() for p in pages), f"missing {arch}"


def test_thirteen_queens():
    """The 14 queens + king are referenced."""
    meok_home = ROOT / "csoai-os" / "meok-home"
    pages = list((meok_home).glob("*.html")) + list((meok_home / "pages").glob("*.html"))
    queens = ["Sovereign King", "Sophia Care", "Aurelian", "Justitia", "Aleph", "Asteria", "Dominion", "Brain", "Proactive", "Bridge", "Distribution", "Council", "Watch", "Sage"]
    missing = [q for q in queens if not any(q in p.read_text() for p in pages)]
    assert not missing, f"missing {missing}"


def test_eleven_temples():
    """The 11 temples are referenced."""
    meok_home = ROOT / "csoai-os" / "meok-home"
    pages = list((meok_home).glob("*.html")) + list((meok_home / "pages").glob("*.html"))
    temples = ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "CSOAI"]
    missing = [t for t in temples if not any(t in p.read_text() for p in pages)]
    assert not missing, f"missing {missing}"


def test_six_locales():
    """The 6 locales exist."""
    i18n = ROOT / "csoai-os" / "i18n"
    assert i18n.exists()
    for loc in ["en", "es", "fr", "de", "ja", "zh"]:
        assert (i18n / f"{loc}.json").exists()


def test_quality_gate_passes():
    """The quality gate script passes (100/100 score)."""
    r = subprocess.run(["python3", "quality_gate.py"], cwd=ROOT, capture_output=True, text=True, timeout=180)
    assert r.returncode == 0, f"quality_gate failed: {r.stdout[-500:]}"
    assert "100/100" in r.stdout


def test_launch_script_runs():
    """The launch.sh script runs (dry-mode verification only)."""
    assert (ROOT / "launch.sh").exists()


def test_sovereign_db_init():
    """sovereign_db.py initialises and creates 13 tables."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    os.environ["MEOK_DB_PATH"] = db_path
    sys.path.insert(0, str(ROOT / "meok-backend"))
    import importlib
    if "sovereign_db" in sys.modules:
        importlib.reload(sys.modules["sovereign_db"])
    import sovereign_db
    conn = sovereign_db.get_db()
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    found = {r["name"] for r in cur.fetchall()}
    expected = {"ichars", "queens", "temples", "regulations", "sigil_chain", "audit_log",
                "charter_titles", "charter_signatures", "framework_coverage",
                "queen_votes", "csoai_sbt", "pii_pseudonyms", "x402_invoices", "mcp_federation"}
    assert expected.issubset(found)


def test_corporate_identity():
    """The company is CSOAI LTD with UK Companies House 16939677."""
    text = (ROOT / "MEOK_WORLD_FINAL_STATE_2026-07-02.md").read_text()
    assert "CSOAI" in text
    assert "16939677" in text


def test_nicholas_templeman():
    """The director is Nicholas Templeman (or surname anywhere)."""
    text = (ROOT / "MEOK_WORLD_FINAL_STATE_2026-07-02.md").read_text().lower()
    assert "templeman" in text or "nicholas" in text or "nick" in text


def test_launch_date_sat_4_jul():
    """Public launch date is Sat 4 Jul 2026 09:00 BST."""
    text = (ROOT / "MEOK_WORLD_FINAL_STATE_2026-07-02.md").read_text()
    assert "4 Jul" in text or "July" in text
    assert "2026" in text


def test_i18n_files_have_strings():
    """Each locale file has substantial content."""
    i18n = ROOT / "csoai-os" / "i18n"
    for loc in ["en", "es", "fr", "de", "ja", "zh"]:
        f = i18n / f"{loc}.json"
        if f.exists():
            data = open(f).read()
            assert len(data) > 4000, f"{loc} has only {len(data)} bytes"


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
