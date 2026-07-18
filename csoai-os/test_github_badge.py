"""Tests for MEOK GitHub README badge generator."""
import sys
import subprocess
from pathlib import Path

PAGE = Path("/Users/nicholas/clawd/csoai-os/meok-home/github-badge.html")


def test_file_exists():
    assert PAGE.exists()
    assert PAGE.stat().st_size > 5000


def test_50_plus_badge_variants():
    """At least 50 badge variants defined in JS array."""
    text = PAGE.read_text()
    assert text.count("{id: '") >= 50, f"only {text.count(chr(123) + 'id: ' + chr(39))} badges"


def test_shields_io_format():
    """All badges use shields.io format."""
    text = PAGE.read_text()
    assert "img.shields.io" in text
    assert "style=for-the-badge" in text
    assert "logo=" in text


def test_master_cluster():
    """Master cluster has sovereign + care + defoneos."""
    text = PAGE.read_text()
    for label in ["MEOK SOVEREIGN", "MEK Care", "MEK Defoneos"]:
        assert f"label: '{label}'" in text, f"missing {label}"


def test_council_cluster():
    """Council cluster has BFT + 13-Queen + VETO."""
    text = PAGE.read_text()
    for label in ["MEK Council BFT", "MEK 13-Queen + King", "MEK VETO Active"]:
        assert f"label: '{label}'" in text


def test_mcp_cluster():
    """MCP cluster has 218 + 484 + 330 + 371."""
    text = PAGE.read_text()
    for label in ["MEK MCPs", "MEK MCP Federation", "MEK SOV3", "MEK Catalog"]:
        assert f"label: '{label}'" in text


def test_cascade_cluster():
    """4-tier cascade cluster."""
    text = PAGE.read_text()
    for label in ["MEK 4-Tier Cascade", "MEK T1", "MEK T2", "MEK T3", "MEK T4"]:
        assert f"label: '{label}'" in text


def test_sigil_cluster():
    """SIGIL audit cluster."""
    text = PAGE.read_text()
    for label in ["MEK SIGIL", "MEK SIGIL Audit", "MEK SIGIL Live"]:
        assert f"label: '{label}'" in text


def test_compliance_cluster():
    """Compliance cluster: EU AI Act + GDPR + DORA + NIS2 + CRA + NIST + ISO + OSCAL."""
    text = PAGE.read_text()
    for label in ["MEK EU AI Act", "MEK GDPR", "MEK DORA", "MEK NIS2", "MEK CRA", "MEK NIST RMF", "MEK ISO 42001", "MEK OSCAL"]:
        assert f"label: '{label}'" in text


def test_identity_cluster():
    """Identity cluster: ichar + 7 + 22 + 13 + OCEAN."""
    text = PAGE.read_text()
    for label in ["MEK i-character", "MEK 7 Archetypes", "MEK 22 Arcanas", "MEK 13-Queen", "MEK OCEAN"]:
        assert f"label: '{label}'" in text


def test_temples_cluster():
    """Temples cluster: 11 + EU + UK + US."""
    text = PAGE.read_text()
    for label in ["MEK 11 Temples", "MEK EU Temple", "MEK UK Temple", "MEK US Temple"]:
        assert f"label: '{label}'" in text


def test_quality_cluster():
    """Quality cluster: tests + fact + launch + smoke + dry."""
    text = PAGE.read_text()
    for label in ["MEK Tests", "MEK Fact-Checked", "MEK launch.sh", "MEK Live Smoke", "MEK DRY"]:
        assert f"label: '{label}'" in text


def test_security_cluster():
    """Security cluster: defoneos + cve + mcp-128."""
    text = PAGE.read_text()
    for label in ["MEK Defoneos", "MEK CVE-Free", "MEK MCP 1.28.1"]:
        assert f"label: '{label}'" in text


def test_international_cluster():
    """6 locales badge."""
    text = PAGE.read_text()
    assert "MEK 6 Locales" in text


def test_performance_cluster():
    """Performance: big-braim + cascade-cheap."""
    text = PAGE.read_text()
    for label in ["MEK 1.39 TB", "MEK Cascade"]:
        assert f"label: '{label}'" in text


def test_launch_cluster():
    """Launch: 4 Jul 2026 + UK 16939677."""
    text = PAGE.read_text()
    for label in ["MEK Launch", "MEK UK 16939677"]:
        assert f"label: '{label}'" in text


def test_avatar_cluster():
    """Avatar cluster: 10 + 8."""
    text = PAGE.read_text()
    for label in ["MEK Avatar", "MEK Social"]:
        assert f"label: '{label}'" in text


def test_family_cluster():
    """OSF: One Sovereign Family."""
    text = PAGE.read_text()
    assert "One Sovereign Family" in text


def test_hives_cluster():
    """33 hives cluster: 33 + 9 + 13."""
    text = PAGE.read_text()
    for label in ["MEK 33 Hives", "MEK 9 Sovereign Hives", "MEK 13 District Hives"]:
        assert f"label: '{label}'" in text


def test_readme_block_exists():
    """README generation block must exist."""
    text = PAGE.read_text()
    assert 'id="readmeBlock"' in text
    assert "renderREADME" in text


def test_8_guarantees():
    """8 sovereign guarantees in README."""
    text = PAGE.read_text()
    for guarantee in ["Defoneos-secured", "SIGIL-signed", "Maternal Covenant", "BFT council", "4-tier cascade", "Care before code", "No foreign surveillance", "100% sovereign"]:
        assert guarantee in text, f"missing {guarantee}"


def test_7_archetypes_in_readme():
    """All 7 archetypes listed in generated README."""
    text = PAGE.read_text()
    for arch in ["Sovereign", "Guardian", "Scout", "Strategist", "Creator", "Companion", "Sage"]:
        assert arch in text


def test_4_tier_cascade_table():
    """4-tier cascade table in README."""
    text = PAGE.read_text()
    for tier in ["T1 Edge", "T2 Tactical", "T3 Operations", "T4 Strategic"]:
        assert tier in text


def test_11_temples_in_readme():
    """11 temples listed in README."""
    text = PAGE.read_text()
    for t in ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "CSOAI"]:
        assert t in text


def test_6_care_dimensions():
    """6 care dimensions in README."""
    text = PAGE.read_text()
    for d in ["Safety", "Honesty", "Privacy", "Fairness", "Growth", "Consent"]:
        assert d in text


def test_social_links():
    """Social links in README."""
    text = PAGE.read_text()
    for link in ["meok.ai", "github.com/csoai-org", "@meok_ai", "LinkedIn"]:
        assert link in text


def test_mit_license():
    """MIT license mentioned."""
    text = PAGE.read_text()
    assert "MIT" in text
    assert "Care before code" in text


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
