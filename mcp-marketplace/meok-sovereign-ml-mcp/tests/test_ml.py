"""Tests for meok-sovereign-ml-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_ml_")
os.environ["SOV_ML_KEY"] = _TEST + "/k.pem"
from meok_sovereign_ml_mcp import (
    ml_train, ml_infer, ml_evaluate, ml_export, ml_status,
    _MODELS, SOVEREIGN_MINDS, SOVEREIGN_MOE, LICENSE,
)


def reset():
    _MODELS.clear()


def test_12_mindsets():
    assert len(SOVEREIGN_MINDS) == 12


def test_8_moe():
    assert len(SOVEREIGN_MOE) == 8


def test_96_combinations():
    assert len(SOVEREIGN_MINDS) * len(SOVEREIGN_MOE) == 96


def test_license_mit_cc0():
    assert "MIT" in LICENSE and "CC0" in LICENSE


def test_ml_train_basic():
    reset()
    r = ml_train("Crown", "Code", "ds-001", epochs=10)
    assert r["mindset"] == "Crown"
    assert r["moe_expert"] == "Code"
    assert r["epochs"] == 10
    assert r["sovereign_score"] > 0
    assert r["model_id"].startswith("sov-")


def test_ml_train_invalid_mindset():
    reset()
    r = ml_train("Unknown", "Code")
    assert "error" in r


def test_ml_train_invalid_moe():
    reset()
    r = ml_train("Crown", "Unknown")
    assert "error" in r


def test_ml_train_invalid_epochs():
    reset()
    r = ml_train("Crown", "Code", epochs=0)
    assert "error" in r
    r = ml_train("Crown", "Code", epochs=2000)
    assert "error" in r


def test_ml_train_increments():
    reset()
    ml_train("Crown", "Code")
    ml_train("Maternal", "Compliance")
    assert len(_MODELS) == 2


def test_ml_infer():
    reset()
    tr = ml_train("Dragon", "Care", epochs=5)
    r = ml_infer(tr["model_id"], "Hello sovereign world")
    assert "Sovereign" in r["output"] or "sovereign" in r["output"]
    assert r["input"] == "Hello sovereign world"


def test_ml_infer_unknown():
    reset()
    r = ml_infer("sov-99-99-999999", "x")
    assert "error" in r


def test_ml_evaluate():
    reset()
    tr = ml_train("Defensive", "Defence", epochs=20)
    r = ml_evaluate(tr["model_id"])
    assert "accuracy" in r["metrics"]
    assert "precision" in r["metrics"]
    assert "recall" in r["metrics"]
    assert "f1_score" in r["metrics"]


def test_ml_evaluate_unknown():
    reset()
    r = ml_evaluate("sov-99-99-999999")
    assert "error" in r


def test_ml_export_summary():
    reset()
    tr = ml_train("BFT", "Reason", epochs=5)
    r = ml_export(tr["model_id"], format="summary")
    assert r["format"] == "summary"
    assert "model" in r


def test_ml_export_safetensors():
    reset()
    tr = ml_train("Sigil", "Sigil", epochs=5)
    r = ml_export(tr["model_id"], format="safetensors")
    assert r["format"] == "safetensors"


def test_ml_export_invalid_format():
    reset()
    tr = ml_train("Care Floor", "Care", epochs=5)
    r = ml_export(tr["model_id"], format="xml")
    assert "error" in r


def test_ml_status():
    reset()
    ml_train("Crown", "Code")
    ml_train("Maternal", "Care")
    r = ml_status()
    assert r["models_trained"] == 2
    assert r["total_combinations"] == 96
    assert len(r["mindsets"]) == 12
    assert len(r["moe_experts"]) == 8


def test_no_external_deps():
    import meok_sovereign_ml_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset()
    tr = ml_train("Crown", "Code", epochs=5)
    for r in [ml_status(), ml_infer(tr["model_id"], "x"), ml_evaluate(tr["model_id"])]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_all_96_combinations_unique():
    """Each mindset × expert pair should produce a distinct model."""
    reset()
    seen = set()
    for m in SOVEREIGN_MINDS:
        for e in SOVEREIGN_MOE:
            r = ml_train(m, e, epochs=1)
            mid = r["model_id"].rsplit("-", 1)[0]  # The sov-MM-XX prefix should be unique per (mindset, expert)
            assert mid not in seen, f"Duplicate model ID prefix: {mid}"
            seen.add(mid)
    assert len(seen) == 96


def test_full_lifecycle():
    """Train → Infer → Evaluate → Export."""
    reset()
    tr = ml_train("Dragon", "Care", epochs=10)
    model_id = tr["model_id"]
    inf = ml_infer(model_id, "Test sovereign")
    assert "Dragon" in inf["output"]
    ev = ml_evaluate(model_id)
    assert ev["metrics"]["f1_score"] > 0
    ex = ml_export(model_id, format="summary")
    assert ex["format"] == "summary"
    st = ml_status()
    assert st["models_trained"] == 1
