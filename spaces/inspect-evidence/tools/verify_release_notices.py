"""Mechanical attribution gate: every bundled dataset must have an explicit notice.

This cannot establish legal rights; it prevents an accidental 'all MIT' Space card.
"""
import json, pathlib, sys

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
meta = (ROOT / "README.md").read_text(encoding="utf-8")
notice = (ROOT / "THIRD_PARTY_NOTICES.md").read_text(encoding="utf-8")
manifest = json.loads((ROOT / "evidence/evidence_manifest.json").read_text(encoding="utf-8"))
required = {
    "csoai/gspc-gov": ("c6ddc5a92c2354248e6b1328ebd341872ee80019", "CC BY 4.0"),
    "stanford-crfm/air-bench-2024": ("976d9fbb0f52bce704dcbef5bd7a2652e65f2a21", "CC BY 4.0"),
    "allenai/coconot": ("2cbe16aabf9069f17e48c8daad8aeabc29469eb7", "ODC-BY"),
}
assert "\nlicense: other\n" in meta and "THIRD_PARTY_NOTICES.md" in meta, "Space code/data licence confusion"
assert "not a legal opinion" in notice.lower(), "licence-check scope missing"
for row in manifest["logs"]:
    dataset = row["dataset"]
    assert dataset in required, f"dataset lacks attribution review: {dataset}"
    revision, licence = required[dataset]
    assert row["dataset_revision"] == revision, f"dataset revision/notice drift: {dataset}"
    assert dataset in notice and revision in notice and licence in notice, f"missing dataset notice: {dataset}"
assert manifest["attestation"] == "CONTENT_ADDRESSED_UNSIGNED", "publication status changed; review required"
print(f"NOTICES_OK datasets={len(set(row['dataset'] for row in manifest['logs']))} logs={len(manifest['logs'])} disclaimer=not_legal_clearance")
