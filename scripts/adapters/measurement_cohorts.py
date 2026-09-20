"""Universal measurement cohorts -> public-root leaves.

Reads public/interop/cohorts/<date>/<cohort>/measurement-manifest.json plus
unsigned-cohort-card.json. The adapter NEVER signs. It verifies that:
  * the manifest self-digest recomputes;
  * the compact candidate binds that exact manifest and cohort Merkle roots;
  * the compact candidate is <= 3KB and explicitly says measurement, not
    certification.

The ONE public-root writer then signs one compact leaf per cohort and folds it
into the estate root. This means thousands of atomic observations are bound
without thousands of signing ceremonies.
"""
from __future__ import annotations
import hashlib, json
from pathlib import Path
from typing import Any

BASE = Path("public/interop/cohorts")
CAP = 3072
CARD_SCHEMA = "https://councilof.ai/schema/card-v0.json"

def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def _check_manifest(manifest: dict[str, Any]) -> str | None:
    claimed = manifest.get("manifest_sha256")
    if not isinstance(claimed, str) or len(claimed) != 64:
        return "manifest_sha256 missing"
    core = dict(manifest)
    core.pop("manifest_sha256", None)
    got = hashlib.sha256(canonical_bytes(core)).hexdigest()
    if got != claimed:
        return "manifest_sha256 mismatch"
    if manifest.get("measurement_not_certification") is not True:
        return "measurement_not_certification missing"
    if not isinstance(manifest.get("atomic_count"), int):
        return "atomic_count missing"
    if not isinstance(manifest.get("atomic_merkle_root"), str):
        return "atomic_merkle_root missing"
    return None

def _check_candidate(body: dict[str, Any], manifest: dict[str, Any]) -> str | None:
    if body.get("schema") != CARD_SCHEMA:
        return "compact schema is not card-v0"
    if body.get("measurement_not_certification") is not True:
        return "compact measurement_not_certification missing"
    if body.get("signature_state") != "STAGED_UNSIGNED":
        return "compact candidate is not STAGED_UNSIGNED"
    if len(canonical_bytes(body)) > CAP:
        return "compact body exceeds signer cap"
    measurement = body.get("measurement")
    if not isinstance(measurement, dict):
        return "compact measurement missing"
    checks = (
        ("manifest_sha256", manifest.get("manifest_sha256")),
        ("atomic_count", manifest.get("atomic_count")),
        ("atomic_merkle_root", manifest.get("atomic_merkle_root")),
        ("child_cohort_count", manifest.get("child_cohort_count", 0)),
        ("child_cohort_merkle_root", manifest.get("child_cohort_merkle_root")),
    )
    for key, expected in checks:
        if measurement.get(key) != expected:
            return f"compact {key} does not bind manifest"
    if not body.get("model") or not body.get("as_of") or not body.get("status"):
        return "compact identity/as_of/status missing"
    return None

def collect(repo_root: Path | None = None) -> dict[str, Any]:
    root = repo_root or Path(__file__).resolve().parents[2]
    base = root / BASE
    leaves: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []
    if not base.is_dir():
        return {"leaves": [], "sidecar": {"status": "ABSENT", "n_leaves": 0, "n_skipped": 0}}

    for manifest_path in sorted(base.glob("*/*/measurement-manifest.json")):
        rel_dir = manifest_path.parent.relative_to(root / "public")
        candidate_path = manifest_path.parent / "unsigned-cohort-card.json"
        label = str(rel_dir)
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            candidate = json.loads(candidate_path.read_text(encoding="utf-8"))
        except Exception as exc:
            skipped.append({"cohort": label, "reason": f"read/json {type(exc).__name__}"})
            continue
        if not isinstance(manifest, dict) or not isinstance(candidate, dict) or not isinstance(candidate.get("body"), dict):
            skipped.append({"cohort": label, "reason": "manifest/candidate shape"})
            continue
        reason = _check_manifest(manifest) or _check_candidate(candidate["body"], manifest)
        if reason:
            skipped.append({"cohort": label, "reason": reason})
            continue

        body = candidate["body"]
        manifest_url = f"https://councilof.ai/{rel_dir}/measurement-manifest.json"
        leaf_payload = {
            "kind": "csoai.measurement-cohort-admission/1",
            "cohort_id": manifest["cohort_id"],
            "subject_kind": manifest["subject_kind"],
            "measurement_status": manifest["status"],
            "n": body.get("n"),
            "atomic_count": manifest["atomic_count"],
            "atomic_merkle_root": manifest["atomic_merkle_root"],
            "child_cohort_count": manifest.get("child_cohort_count", 0),
            "child_cohort_merkle_root": manifest.get("child_cohort_merkle_root"),
            "manifest_sha256": manifest["manifest_sha256"],
            "measurement_not_certification": True,
        }
        leaves.append({
            "surface": "public.notice",
            "subject": f"measurement cohort:{manifest['cohort_id']}",
            "as_of": str(manifest["as_of"]),
            "source_urls": [manifest_url],
            "payload": leaf_payload,
            "unmeasured": [str(x) for x in (manifest.get("unmeasured") or [])],
            "tags": ["measurement-cohort", f"subject-kind:{manifest['subject_kind']}"],
        })

    return {
        "leaves": leaves,
        "sidecar": {
            "status": "READY" if not skipped else "PARTIAL",
            "n_leaves": len(leaves),
            "n_skipped": len(skipped),
            "skipped": skipped,
            "note": "Universal cohort manifests admitted as compact leaves; signing/rooting remains the one public-root writer.",
        },
    }
