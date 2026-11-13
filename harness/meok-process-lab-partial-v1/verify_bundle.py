"""Offline integrity and leakage checks for the MEOK partial-observation package."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((R/"BUNDLE-MANIFEST.json").read_text())
for name,want in manifest.items():
    p=R/name
    assert p.is_file(),f"missing bundle file: {name}"
    assert sha(p)==want,f"bundle hash mismatch: {name}"
release_manifest=json.loads((R/"release/manifest.json").read_text())
for name,want in release_manifest.items():
    p=R/"release"/name
    assert p.is_file() and sha(p)==want,f"release hash mismatch: {name}"
expected={"train":(1600,1000,1199),"validation":(400,1200,1249),"test":(560,1250,1319)}
episode_sets={}
for split,(count,lo,hi) in expected.items():
    rows=[json.loads(x) for x in (R/"release"/f"{split}.jsonl").read_text().splitlines()]
    assert len(rows)==count,(split,len(rows))
    assert all(r["split"]==split and lo<=r["episode"]<=hi for r in rows)
    assert all(len(r["features"])==12 and len(r["target"])==4 for r in rows)
    assert all("privileged_features" not in r and "profile_0" not in r for r in rows)
    episode_sets[split]={r["episode"] for r in rows}
assert not (episode_sets["train"]&episode_sets["validation"])
assert not (episode_sets["train"]&episode_sets["test"])
assert not (episode_sets["validation"]&episode_sets["test"])
pred=[json.loads(x) for x in (R/"release/test-predictions.jsonl").read_text().splitlines()]
assert len(pred)==560
weights=json.loads((R/"release/weights.json").read_text())
report=json.loads((R/"release/training-report.json").read_text())
assert weights["format"]=="meok.partial-observation-process-ensemble/1"
assert len(weights["ensemble"])==3
assert not any("profile_" in x for x in weights["features"])
assert report["selected_model"]=="top3_output_ensemble"
assert report["metrics"]["top3_output_ensemble"]["test_hybrid"]["mae"] < report["metrics"]["partial_best"]["test_hybrid"]["mae"]
assert report["gspc_admitted"] is False and report["cosmos_weights_changed"] is False
print(json.dumps({"state":"PACKAGE_INTEGRITY_AND_NO_PRIVILEGED_INPUT_LEAKAGE_PASSED","bundle_files":len(manifest),"release_files":len(release_manifest),"split_rows":{k:v[0] for k,v in expected.items()},"episode_disjoint":True,"public_features":12,"privileged_inputs_excluded":True,"ensemble_members":3,"selected_model":report["selected_model"],"test_prediction_rows":len(pred)},separators=(",",":")))