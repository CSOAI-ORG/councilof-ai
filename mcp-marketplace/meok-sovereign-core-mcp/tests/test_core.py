"""Tests for meok-sovereign-core-mcp (AB Uno substrate)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_core_test_")
os.environ["SOV_CORE_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_core_mcp import (
    core_status, core_5d_hive, core_sephiroth, core_generals, core_doctrine,
    FIVE_D_HIVE, SEPHIROTH, GENERALS, AB_UNO, DEFENSIVE_DOCTRINE,
)


def test_5_dimensions():
    assert len(FIVE_D_HIVE) == 5


def test_5_dimension_names():
    names = {d["name"] for d in FIVE_D_HIVE}
    assert names == {"spatial", "temporal", "logical", "wavelet", "quantum"}


def test_12_sephiroth():
    assert len(SEPHIROTH) == 12


def test_10_canonical_2_auxiliary():
    canonical = sum(1 for s in SEPHIROTH if not s["auxiliary"])
    auxiliary = sum(1 for s in SEPHIROTH if s["auxiliary"])
    assert canonical == 10
    assert auxiliary == 2


def test_keter_to_dragon():
    """Keter (Crown) is the highest sephirah → Dragon (sovereign)."""
    keter = next(s for s in SEPHIROTH if s["name"] == "Keter")
    assert keter["general"] == "Dragon"
    assert keter["role"] == "sovereign"


def test_12_generals():
    assert len(GENERALS) == 12


def test_generals_have_qowm():
    for g in GENERALS:
        assert "qowm" in g
        assert len(g["qowm"]) > 0


def test_6_traditions():
    assert len(AB_UNO["traditions"]) == 6


def test_tradition_names():
    names = set(AB_UNO["traditions"].keys())
    assert "Kabbalistic" in names
    assert "Neoplatonic" in names
    assert "Vedantic" in names
    assert "Taoist" in names
    assert "Hermetic" in names
    assert "Sufi" in names


def test_defensive_doctrine_6():
    assert len(DEFENSIVE_DOCTRINE) == 6
    assert "Never Offend" in " ".join(DEFENSIVE_DOCTRINE)


def test_status_returns_everything():
    r = core_status()
    assert r["summary"]["dimensions"] == 5
    assert r["summary"]["sephiroth"] == 12
    assert r["summary"]["generals"] == 12
    assert r["summary"]["traditions"] == 6


def test_5d_hive():
    r = core_5d_hive()
    assert r["count"] == 5
    assert "Spatial" in r["doctrine"]


def test_sephiroth_summary():
    r = core_sephiroth()
    assert r["count"] == 12
    assert r["canonical"] == 10
    assert r["auxiliary"] == 2


def test_generals_count():
    r = core_generals()
    assert r["count"] == 12


def test_doctrine():
    r = core_doctrine()
    assert r["traditions_count"] == 6
    assert "Defend" in " ".join(r["defensive_doctrine"])
    assert "dragon" in r["doctrine"].lower()


def test_no_external_deps():
    import meok_sovereign_core_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    for func in [core_status, core_5d_hive, core_sephiroth, core_generals, core_doctrine]:
        r = func()
        assert "kid" in r
        assert "sig" in r
        assert "ts" in r


def test_every_general_in_sephiroth():
    """Every General has a sephirah, and every sephirah has a general."""
    generals_in_seph = {s["general"] for s in SEPHIROTH}
    generals = {g["name"] for g in GENERALS}
    # All 12 generals are represented in sephiroth
    assert generals.issubset(generals_in_seph)


def test_qowm_unique():
    """Each General has a unique QOwm architecture."""
    qowms = [g["qowm"] for g in GENERALS]
    assert len(qowms) == len(set(qowms))


def test_vm_naming():
    for g in GENERALS:
        assert g["vm"].startswith("gen-")
        assert g["name"].lower() in g["vm"]