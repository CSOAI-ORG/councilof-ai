"""Tests for meok-sovereign-oowm-mcp (the SOV3³ Organic World Model)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_oowm_test_")
os.environ["SOV_OOWM_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_oowm_mcp import (
    oowm_council, oowm_route, oowm_think, oowm_score, oowm_status,
    oowm_5d_hive, oowm_sephiroth,
    GENERALS, BFT_MODES, MOM_EXPERTS, MOE_EXPERTS,
)


def test_council_has_12_generals():
    r = oowm_council()
    assert r["general_count"] == 12
    assert len(r["generals"]) == 12


def test_council_has_3_bft_modes():
    r = oowm_council()
    assert r["bft_mode_count"] == 3
    for mode in ["fast", "balanced", "secure"]:
        assert mode in r["bft_modes"]


def test_council_bft_voters():
    r = oowm_council()
    assert r["bft_modes"]["fast"]["voters"] == 3
    assert r["bft_modes"]["balanced"]["voters"] == 5
    assert r["bft_modes"]["secure"]["voters"] == 7


def test_12_general_names():
    r = oowm_council()
    names = [g["name"] for g in r["generals"]]
    expected = ["Argus", "Scribe", "Shield", "Builder", "Abacus",
                "Lex", "Scale", "Crow", "Gear", "Voice", "Owl", "Dragon"]
    assert names == expected


def test_dragon_is_sovereign():
    dragon = next(g for g in GENERALS if g["name"] == "Dragon")
    assert dragon["role"] == "sovereign"
    assert dragon["brain"] == "both"


def test_mom_experts_4():
    r = oowm_council()
    assert r["mom_expert_count"] == 4
    modalities = [m["modality"] for m in r["mom_experts"]]
    assert "text" in modalities
    assert "image" in modalities


def test_moe_experts_8():
    r = oowm_council()
    assert r["moe_expert_count"] == 8


def test_route_compliance_query_to_scribe():
    r = oowm_route("Audit this against EU AI Act Article 50")
    assert r["predicted_general"]["role"] == "compliance"
    assert r["predicted_general"]["name"] == "Scribe"


def test_route_sovereign_query_to_dragon():
    r = oowm_route("Configure the sovereign substrate for deployment")
    assert r["predicted_general"]["role"] in ["sovereign", "operations", "architect"]


def test_route_unknown_to_dragon():
    r = oowm_route("zzz random gibberish xyz")
    assert r["predicted_general"]["role"] == "sovereign"


def test_think_default_routing():
    r = oowm_think("Audit this against EU AI Act")
    assert r["general"]["name"] == "Scribe"
    assert r["bft_mode"] == "secure"  # Scribe defaults to secure
    assert r["consensus"] > 0
    assert r["care_floor_pass"] is True


def test_think_kill_switch_uses_secure():
    r = oowm_think("Deploy sovereign substrate to production")
    assert r["bft_mode"] == "secure"  # 'deploy' triggers secure override


def test_think_fast_for_monitor():
    r = oowm_think("Monitor the iOK Farm pond temperature")
    assert r["bft_mode"] == "fast"  # 'monitor' triggers fast


def test_think_care_floor_blocks_harm():
    r = oowm_think("Cause harm to the user")
    assert r["care_floor_pass"] is False


def test_think_returns_mom_experts():
    r = oowm_think("Audit EU AI Act compliance")
    assert len(r["mom_used"]) >= 1
    # Scribe (compliance) uses TextMOM + AuditMOM
    modalities = [m["modality"] for m in r["mom_used"]]
    assert "text" in modalities


def test_think_returns_moe_experts():
    r = oowm_think("test")
    assert len(r["moe_used"]) == 8
    specialties = [m["specialty"] for m in r["moe_used"]]
    assert "SWE-bench" in specialties
    assert "chain-of-thought" in specialties


def test_think_bft_mode_fast_quorum():
    r = oowm_think("Monitor logs", bft_mode="fast")
    assert r["bft_mode"] == "fast"
    assert r["bft"]["voters"] == 3
    assert r["bft"]["quorum"] == 2


def test_think_bft_mode_secure_quorum():
    r = oowm_think("test", bft_mode="secure")
    assert r["bft_mode"] == "secure"
    assert r["bft"]["voters"] == 7
    assert r["bft"]["quorum"] == 5


def test_score_care_floor_clean():
    r = oowm_score(1, "This is a normal compliance output")
    assert r["care_floor"] == 1.0


def test_score_care_floor_harm():
    r = oowm_score(1, "This output causes harm")
    assert r["care_floor"] == 0.5


def test_score_sovereign_bonus():
    r = oowm_score(12, "Configure sovereign substrate")
    assert r["sovereign"] == 1.0


def test_score_signed():
    r = oowm_status()
    assert "kid" in r
    assert "sig" in r
    assert r["sigil_signed"] is True


def test_status_full():
    r = oowm_status()
    assert r["generals_online"] == 12
    assert r["bft_modes_available"] == ["fast", "balanced", "secure"]
    assert r["mom_experts_online"] == 4
    assert r["moe_experts_online"] == 8


def test_topology_consistent():
    """12 generals × 3 BFT modes = 36 BFT nodes total."""
    assert len(GENERALS) * len(BFT_MODES) == 36


def test_mom_weights_sum_to_one():
    total = sum(m["weight"] for m in MOM_EXPERTS)
    assert abs(total - 1.0) < 0.001


def test_general_default_bft_mode_distributed():
    """Each BFT mode should be used by ≥2 generals."""
    defaults = [g["bft_default"] for g in GENERALS]
    for mode in ["fast", "balanced", "secure"]:
        assert defaults.count(mode) >= 2, f"{mode} used by only {defaults.count(mode)} generals"

def test_5d_hive_full():
    r = oowm_5d_hive()
    assert "dimensions" in r
    assert r["hive_size"] == 12
    assert len(r["generals"]) == 12
    assert "spatial" in r["dimensions"]
    assert "temporal" in r["dimensions"]
    assert "logical" in r["dimensions"]
    assert "wavelet" in r["dimensions"]
    assert "quantum" in r["dimensions"]


def test_5d_hive_single_general():
    r = oowm_5d_hive("Dragon")
    assert r["general"]["name"] == "Dragon"
    assert r["gcp_vm"] == "gen-12-dragon"
    assert "qowm" in r
    assert "sovereign-meta-quantum" in r["qowm"]["qowm_arch"]


def test_5d_hive_unknown_general():
    r = oowm_5d_hive("Hacker")
    assert "error" in r
    assert "Hacker" in r["error"]


def test_sephiroth_count():
    r = oowm_sephiroth()
    assert r["sephiroth_count"] == 12
    # First 10 are the canonical Sephiroth
    names = [s["name"] for s in r["sephiroth"]]
    assert "Keter" in names
    assert "Malkuth" in names
    assert "Da'at" in names  # The hidden 11th


def test_gcp_vm_per_general():
    r = oowm_5d_hive()
    for entry in r["generals"]:
        gen_id = entry["general"]["id"]
        gen_name = entry["general"]["name"].lower()
        assert entry["gcp_vm"] == f"gen-{gen_id}-{gen_name}"


def test_qowm_specialisation():
    """Each General has a unique QOwm architecture."""
    r = oowm_5d_hive()
    archs = set()
    for entry in r["generals"]:
        archs.add(entry["qowm"]["qowm_arch"])
    assert len(archs) == 12  # All 12 unique QOwm architectures


def test_total_cost_12_vms():
    r = oowm_5d_hive()
    assert r["total_monthly_cost_usd"] == 1200  # 12 × $100
