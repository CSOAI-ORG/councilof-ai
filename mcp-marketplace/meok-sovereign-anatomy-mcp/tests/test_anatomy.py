"""Tests for meok-sovereign-anatomy-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_anat_")
os.environ["SOV_ANAT_KEY"] = _TEST + "/k.pem"
from meok_sovereign_anatomy_mcp import (
    anatomy_layer, anatomy_primitive, anatomy_hieroglyph, anatomy_probes, anatomy_full,
    SOVEREIGN_LAYERS, HIEROGLYPHS, CARE_FLOOR_PROBES, ALCHEMICAL_LAYERS,
)


def test_5_alchemical():
    assert len(ALCHEMICAL_LAYERS) == 5


def test_8_sovereign_layers():
    assert len(SOVEREIGN_LAYERS) == 8


def test_22_hieroglyphs():
    assert len(HIEROGLYPHS) == 22


def test_16_probes():
    assert len(CARE_FLOOR_PROBES) == 16


def test_layer_zero():
    r = anatomy_layer(0)
    assert r["layer"]["name"] == "Atoms"


def test_layer_seven():
    r = anatomy_layer(7)
    assert r["layer"]["name"] == "Distribution"


def test_layer_invalid_high():
    r = anatomy_layer(99)
    assert "error" in r


def test_layer_invalid_negative():
    r = anatomy_layer(-1)
    assert "error" in r


def test_layer_string_invalid():
    r = anatomy_layer("0")
    assert "error" in r


def test_primitive_found():
    r = anatomy_primitive("ed25519_keypair")
    assert r["layer"] == "Atoms"


def test_primitive_not_found():
    r = anatomy_primitive("unknown_primitive")
    assert "error" in r


def test_primitive_empty():
    r = anatomy_primitive("")
    assert "error" in r


def test_hieroglyph_no_arg():
    r = anatomy_hieroglyph()
    assert r["total"] == 22


def test_hieroglyph_aleph():
    r = anatomy_hieroglyph("Aleph")
    assert r["hieroglyph"]["letter"] == "Aleph"
    assert "Fool" in r["hieroglyph"]["arcana"]


def test_hieroglyph_tav():
    r = anatomy_hieroglyph("Tav")
    assert r["hieroglyph"]["letter"] == "Tav"


def test_hieroglyph_invalid():
    r = anatomy_hieroglyph("XYZ")
    assert "error" in r


def test_probes():
    r = anatomy_probes()
    assert r["total"] == 16
    assert r["threshold"] == 0.95


def test_probes_have_thresholds():
    r = anatomy_probes()
    for p in r["probes"]:
        assert "threshold" in p
        assert "weight" in p


def test_full_anatomy():
    r = anatomy_full()
    assert r["totals"]["alchemical_layers"] == 5
    assert r["totals"]["sovereign_layers"] == 8
    assert r["totals"]["hieroglyphs"] == 22
    assert r["totals"]["care_floor_probes"] == 16


def test_no_external_deps():
    import meok_sovereign_anatomy_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    for r in [anatomy_layer(0), anatomy_primitive("ed25519_keypair"),
              anatomy_hieroglyph(), anatomy_probes(), anatomy_full()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_all_layers_have_primitives():
    for layer in SOVEREIGN_LAYERS:
        assert "primitives" in layer
        assert len(layer["primitives"]) > 0


def test_all_hieroglyphs_have_letters():
    for h in HIEROGLYPHS:
        assert "letter" in h
        assert "arcana" in h
        assert "sovereign" in h


def test_care_floor_threshold():
    assert all(p["threshold"] >= 0 for p in CARE_FLOOR_PROBES)


def test_layer_primitive_count():
    """Total primitive count across all 8 layers."""
    total = sum(len(l["primitives"]) for l in SOVEREIGN_LAYERS)
    assert total >= 20


def test_full_workflow():
    """Layer 0 → primitive → hieroglyph → probes → full."""
    r1 = anatomy_layer(0)
    assert r1["layer"]["name"] == "Atoms"
    r2 = anatomy_primitive("ed25519_keypair")
    assert r2["layer"] == "Atoms"
    r3 = anatomy_hieroglyph("Aleph")
    assert r3["hieroglyph"]["letter"] == "Aleph"
    r4 = anatomy_probes()
    assert r4["threshold"] == 0.95
    r5 = anatomy_full()
    assert r5["totals"]["sovereign_layers"] == 8
