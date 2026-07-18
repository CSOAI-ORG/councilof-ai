"""Tests for meok-sovereign-hive-network-mcp (33 hives + 8 BIG BRAIM)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_hive_test_")
os.environ["SOV_HIVE_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_hive_network_mcp import (
    hive_list, hive_get, big_braim, route_query, hive_health,
    HIVES, BIG_BRAIM,
)


def test_list_all_33():
    r = hive_list()
    assert r["count"] == 33
    assert len(r["hives"]) == 33


def test_list_filtered_sovereign():
    r = hive_list(tier="sovereign")
    assert r["count"] == 2  # London + Tokyo
    for h in r["hives"]:
        assert h["tier"] == "sovereign"


def test_list_filtered_enterprise():
    r = hive_list(tier="enterprise")
    assert r["count"] >= 5


def test_list_filtered_smb():
    r = hive_list(tier="smb")
    assert r["count"] >= 15


def test_list_filtered_region():
    r = hive_list(region="UK")
    assert r["count"] >= 3
    for h in r["hives"]:
        assert h["region"] == "UK"


def test_get_by_id():
    r = hive_get(1)
    assert r["id"] == 1
    assert r["name"] == "London"


def test_get_by_name():
    r = hive_get("Tokyo")
    assert r["name"] == "Tokyo"
    assert r["id"] == 21


def test_get_unknown():
    r = hive_get("UnknownCity")
    assert "error" in r


def test_big_braim_8_winners():
    r = big_braim()
    assert r["count"] == 8
    assert r["total_size_tb"] > 1.0  # 1.39 TB


def test_big_braim_tiers():
    r = big_braim()
    tiers = set(b["tier"] for b in r["winners"])
    assert "online" in tiers
    assert "edge" in tiers


def test_route_code_query():
    r = route_query("implement a function")
    assert r["routed_to"]["moe"] in [b["name"] for b in BIG_BRAIM]


def test_route_audio_query():
    r = route_query("speak this text")
    assert r["routed_to"]["hive"] in ["Cambridge", "London", "Dublin"]  # Voice general


def test_route_compliance_query():
    r = route_query("audit compliance")
    assert r["routed_to"]["hive"] in ["Cambridge", "London"]


def test_route_general_query():
    r = route_query("hello world")
    assert "moe" in r["routed_to"]
    assert "hive" in r["routed_to"]


def test_health_summary():
    r = hive_health()
    assert r["total_hives"] == 33
    assert r["by_tier"]["sovereign"] == 2
    assert r["by_tier"]["enterprise"] >= 5
    assert r["by_tier"]["smb"] >= 15


def test_health_12_generals():
    r = hive_health()
    assert len(r["by_general"]) == 12


def test_no_external_deps():
    import meok_sovereign_hive_network_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    r1 = hive_list()
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = hive_get(1)
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = big_braim()
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = route_query("test")
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = hive_health()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_33_hives_match_5_continents():
    r = hive_list()
    regions = set(h["region"] for h in r["hives"])
    # UK, IE, FR, DE, NL, SE, FI, ES, IT, AT (Europe)
    # US, CA, MX, CO, PE, CL, AR (Americas)
    # JP, SG, AU, IN, AE, HK, KR, ID (Asia)
    # ZA, KE, EG, NG (Africa)
    # IS (Atlantic/Arctic)
    assert "UK" in regions
    assert "US" in regions
    assert "JP" in regions
    assert "SG" in regions
    assert "ZA" in regions


def test_doctrine():
    r = hive_health()
    assert "33 hives" in r["doctrine"]