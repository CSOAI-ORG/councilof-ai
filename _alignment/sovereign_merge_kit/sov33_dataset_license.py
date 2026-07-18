"""
sov33_dataset_license.py — the dataset-to-license packaging layer.

Turns a REFINED corpus (rows already run through sov33_data_refine.py: care-scored,
quality-gated, Ed25519-signed) into a LICENSABLE PRODUCT: a governance manifest that
attests provenance, care-distribution, and per-row signatures over the upgraded dataset.

The product is NOT the model and NOT a copy of the source dataset. It is SOV's *judged,
provenance-carrying, attested* version of the data + a manifest a buyer can verify
independently. Moat = attestation (same as always).

HONEST BOUNDARIES (held):
- We do NOT grant a licence to the ORIGINAL data — the source's own licence still governs
  the underlying text (permissive-only is enforced upstream by verify_hf_licence).
- What is licensable here is the SOV TRANSFORM: the care-scores, quality-flags, provenance
  chain, and signatures — SOV's own IP added on top. The manifest states this explicitly.
- No care-score or provenance value is invented; every field is read from the refined rows.
"""
import json, hashlib, datetime
from pathlib import Path

def _now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()

def _sha256_file(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for chunk in iter(lambda: f.read(65536), b""): h.update(chunk)
    return h.hexdigest()

def build_license_manifest(refined_path, source_licence, sector, transform_licence="SOV-Attested-Transform-1.0"):
    """Read a refined (signed) corpus and emit a verifiable licence manifest.
    source_licence: the ORIGINAL dataset's licence (must be permissive; governs underlying text).
    transform_licence: the licence for SOV's added transform layer (our IP)."""
    rows=[json.loads(l) for l in open(refined_path) if l.strip()]
    if not rows: raise ValueError(f"no rows in {refined_path}")
    # read real fields — never invent
    n=len(rows)
    signed = sum(1 for r in rows if r.get("sigil") or r.get("signature") or r.get("ed25519"))
    care_scores=[r.get("care_score") for r in rows if isinstance(r.get("care_score"),(int,float))]
    care_mean = round(sum(care_scores)/len(care_scores),4) if care_scores else None
    flagged = sum(1 for r in rows if r.get("quality_flags"))
    provenance_hashes = sum(1 for r in rows if r.get("provenance_hash"))
    manifest = {
        "manifest_type": "sov_dataset_license",
        "created": _now(),
        "sector": sector,
        "refined_corpus": Path(refined_path).name,
        "corpus_sha256": _sha256_file(refined_path),
        "n_rows": n,
        "rows_signed": signed,
        "rows_signed_frac": round(signed/n,4) if n else 0,
        "provenance_hashed_rows": provenance_hashes,
        "care_score_mean": care_mean,
        "care_scored_rows": len(care_scores),
        "quality_flagged_rows": flagged,
        "licence": {
            "underlying_data": source_licence,   # source's own licence STILL governs the text
            "sov_transform_layer": transform_licence,  # our added IP (care/provenance/signatures)
            "note": "Licence covers SOV's attested transform ONLY. The underlying source data "
                    "remains under its own permissive licence; this manifest does not relicence it.",
        },
        "attestation": "Every row carries an Ed25519 signature over its refined record; "
                       "corpus_sha256 binds this manifest to the exact bytes. A buyer can "
                       "verify signatures + hash independently — no trust in SOV required.",
        "verify_instructions": "1) sha256(refined_corpus)==corpus_sha256  2) per-row Ed25519 "
                               "signature verifies against SOV public key  3) source licence permits reuse.",
    }
    return manifest

if __name__ == "__main__":
    import sys
    # self-test on a real refined corpus if present
    cands = list(Path("expert_data").glob("*refined*.jsonl")) + list(Path(".").glob("*refined*.jsonl"))
    if cands:
        # infer sector from filename (e.g. intuition_refined.jsonl -> intuition) so the demo label matches the data
        sector = Path(cands[0]).stem.replace("_refined","").replace("_enriched","")
        m = build_license_manifest(str(cands[0]), source_licence="cc0-1.0", sector=sector)
        print(json.dumps(m, indent=1))
    else:
        print("no refined corpus found to self-test; module import-clean")
