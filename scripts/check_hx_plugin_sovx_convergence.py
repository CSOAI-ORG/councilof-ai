#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "public/interop/hx-plugin-sovx-convergence.json"

def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def require_order(flow, left, right):
    assert flow.index(left) < flow.index(right), f"{left} must precede {right}"

def validate(root: Path = ROOT) -> None:
    manifest = load_json(root / "public/interop/hx-plugin-sovx-convergence.json")
    assert manifest["schema"] == "csoai.hx-plugin-sovx-convergence/0.1"

    for rel in manifest["canonical_dependencies"]:
        assert (root / rel).exists(), f"missing dependency: {rel}"

    plugin = load_json(root / "plugins/gspc/plugin.json")
    sovx = load_json(root / "packages/sovx-wrapped-asset-insight-snap/snap.manifest.json")
    layer = load_json(root / "public/.well-known/layer-o-presence.json")
    claim = load_json(root / "public/spec/claim-maintenance/index.json")
    priority_root = load_json(root / "public/spec/claim-maintenance/priority-root.json")
    harness = load_json(root / "public/interop/master-harness-index-v0.4.json")
    time_code = (root / "functions/api/_gspc_measurement_time.ts").read_text()
    tree_code = (root / "scripts/pod-loops/build_tree_receipt.py").read_text()

    assert "measurement, never certification" in plugin["description"].lower()
    sdesc = sovx["description"].lower()
    for phrase in ("not advice", "not a rating", "not an endorsement"):
        assert phrase in sdesc, f"SovX boundary missing {phrase}"

    assert layer["schema"].startswith("csoai.layer-o-presence/")
    assert claim["name"] == "Claim Maintenance"
    assert priority_root["schema"].startswith("csoai.claim-maintenance-priority-root/")
    assert priority_root["separate_from"]["public_card_root"] == "/root.json"
    assert harness["schema"] == "csoai.master-harness-index/0.4"
    for token in ("EXACT", "DAY", "NOT_AFTER", "UNCHECKABLE", "CURRENT", "STALE"):
        assert token in time_code, f"measurement-time contract missing {token}"
    assert "source_commit" in tree_code and "tree_digest" in tree_code

    joined = "\n".join(manifest["invariants"]).lower()
    for phrase in (
        "producer evidence is not admission",
        "payment never mints trust",
        "unmeasured",
        "signature proves origin",
        "settlement requires settlement evidence",
        "sole production writer",
    ):
        assert phrase in joined, f"missing invariant: {phrase}"

    policy = manifest["action_policy"]
    assert policy["PUBLISH_SIGN_PAY_DELETE_ADMIN"] == "requires explicit authority"
    assert policy["UNKNOWN"] == "INPUT_REQUIRED"
    assert "executor evidence" in policy["completion_rule"].lower()

    flow = manifest["flow"]
    require_order(flow, "produce_evidence", "verify_producer_provenance")
    require_order(flow, "verify_producer_provenance", "admission_decision")
    require_order(flow, "measure_or_preserve_unmeasured", "admission_decision")
    require_order(flow, "admission_decision", "wrap")
    require_order(flow, "deliver", "receipt")
    require_order(flow, "receipt", "watch")

    producer_required = set(manifest["producer_contract"]["required"])
    expected = {
        "host or runner class",
        "model or executable digest where applicable",
        "input or bank pins",
        "per-unit result states",
        "terminal producer state",
        "evidence time",
    }
    assert producer_required == expected

def main() -> int:
    validate()
    manifest = load_json(MANIFEST)
    print("PASS Harness X + Plugin X + SovX convergence")
    print("dependencies", len(manifest["canonical_dependencies"]))
    print("invariants", len(manifest["invariants"]))
    print("flow_steps", len(manifest["flow"]))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
