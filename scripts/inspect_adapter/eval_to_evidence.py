#!/usr/bin/env python3
"""Turn ONE Inspect AI `.eval` log into a CSOAI evidence bundle. Read-only, offline.

WHAT THIS IS. UKGovernmentBEIS/inspect_ai issue #5444 (opened 16 Sep 2026 by StevenMih)
proposes per-sample content-derived IDs, ~200-byte daily Merkle root checkpoints, IETF SCITT
receipts, and selective disclosure in which withheld samples keep their digests. This script
takes the first, second and fourth of those and runs them against a real Inspect log using the
Merkle rule the CSOAI estate already publishes, so the overlap can be measured instead of
asserted.

STATUS OF #5444 — state it exactly this way and no other way. It is ONE person's issue, days
old. No maintainer response. No labels. No assignee. It is NOT an AISI-adopted design, it is
NOT on any Inspect roadmap, and nothing here should ever be described as implementing an
AISI or Inspect decision. It is a credible interoperability target and nothing more.

WHAT THIS DOES NOT DO. No signing. No witness. No SCITT submission. No network, at build time
or verify time. The board signer is unreachable (GitHub Actions is disabled account-wide) and
signing with any other key we hold would misrepresent who attested this, which is forgery. The
bundle is therefore UNSIGNED and says so in its own bytes: it commits to WHICH BYTES were in
the set, and says nothing about WHO produced them.

We do not modify the `.eval` format. We read the zip, we write nothing back, and we claim no
Inspect compatibility beyond the one file we actually ran (see `source` in the bundle).
"""
import argparse, base64, hashlib, json, pathlib, sys, zipfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from csoai_merkle import (  # noqa: E402
    NODE_DEFINITION, RFC6962_DIVERGENCE, TREE_CAVEAT,
    build_levels, merkle_root, proof_for, verify_proof,
)

SCHEMA = "csoai.inspect-evidence-bundle/0.1"

LEAF_DEFINITION = (
    "sha256(canonical(sample)) where canonical is the estate's OWN declared preimage rule, "
    "copied from public/signed/card_index.json -> verification.preimage_rule: "
    "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8'). "
    "Applied here to the FULL parsed object of the "
    "`.eval` zip member samples/<id>_epoch_<epoch>.json. Nothing is stripped: unlike the "
    "estate card leaf, an Inspect sample carries no signature or self-hash field to remove, "
    "so there is no minus-clause. The digest is content-derived in the sense issue #5444 "
    "asks for: it is a function of the sample's content alone and of no assigned identifier."
)
LEAF_ORDER = (
    "Leaves are ordered by (sample id, epoch) as integers where the id is integral, else "
    "lexically by id then epoch — i.e. the log's own sample order, NOT sorted by digest. "
    "The order is part of what the root commits to and is restated here so a stranger can "
    "rebuild the identical tree. (scripts/measurement_root.py sorts its leaves by digest "
    "instead; that is a different artifact with a different rule, not a contradiction.)"
)

NOT_ESTABLISHED = [
    "This does NOT make an eval honest. A model or a harness can produce whatever samples it "
    "likes and they will hash and commit perfectly.",
    "This does NOT establish that the eval was uncontaminated. Training-set contamination is "
    "invisible to a hash.",
    "This does NOT establish that any score is correct. The scorer's verdict is committed to, "
    "not checked.",
    "This does NOT establish that every action was captured. It commits to the samples that "
    "were written to the log; a sample that was never logged leaves no trace here, and the "
    "root cannot tell you what is missing.",
    "This does NOT establish WHO produced the log. The bundle is unsigned. Inclusion proves "
    "these exact bytes were in this set when the root was computed, and nothing else.",
    "This does NOT prove the root is old. There is no timestamp anchor and no witness in this "
    "bundle; the `as_of` field is a claim by whoever built it, not evidence.",
    "The first four points are the issue author's own caveats about his own proposal. They "
    "apply in exactly the same way to ours, which is the honest reason to record them here.",
]


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _sort_key(entry):
    sid = entry["sample_id"]
    try:
        return (0, int(sid), entry["epoch"])
    except (TypeError, ValueError):
        return (1, str(sid), entry["epoch"])


def read_samples(eval_path: pathlib.Path) -> tuple[list[dict], dict]:
    """Read sample members out of the `.eval` zip. We only read; the file is never rewritten."""
    with zipfile.ZipFile(eval_path) as z:
        names = [n for n in z.namelist() if n.startswith("samples/") and n.endswith(".json")]
        if not names:
            raise SystemExit(f"{eval_path}: no samples/*.json members — not an Inspect .eval log?")
        header = json.loads(z.read("header.json")) if "header.json" in z.namelist() else {}
        entries = []
        for name in names:
            raw = z.read(name)
            obj = json.loads(raw)
            stem = name[len("samples/"):-len(".json")]
            sid, _, epoch = stem.partition("_epoch_")
            pre = canonical(obj)
            # Idempotence: canonical(parse(canonical(x))) == canonical(x). If this ever fails the
            # digest is not reproducible by a third party and the bundle must not be written.
            if canonical(json.loads(pre)) != pre:
                raise SystemExit(f"{name}: canonical form is not idempotent; refusing to publish")
            entries.append({
                "member": name,
                "sample_id": obj.get("id", sid),
                "epoch": int(epoch) if epoch.isdigit() else epoch,
                "digest": sha256_hex(pre),
                "raw_member_sha256": sha256_hex(raw),  # informational: the exact stored bytes
                "_preimage": pre,
            })
    entries.sort(key=_sort_key)
    return entries, header


def build(eval_path: pathlib.Path, withhold: list[str], as_of: str) -> dict:
    entries, header = read_samples(eval_path)
    leaves = [e["digest"] for e in entries]
    levels = build_levels(leaves)
    root = merkle_root(leaves)

    ev = header.get("eval", {}) or {}
    withhold_set = {str(w) for w in withhold}
    samples, n_withheld = [], 0
    for i, e in enumerate(entries):
        proof = proof_for(i, levels)
        if not verify_proof(e["digest"], proof, root):
            raise SystemExit(f"leaf {i} proof does not verify at build time; refusing to write")
        rec = {
            "index": i,
            "sample_id": e["sample_id"],
            "epoch": e["epoch"],
            "member": e["member"],
            "digest": e["digest"],
            "raw_member_sha256": e["raw_member_sha256"],
            "inclusion_proof": proof,
        }
        if str(e["sample_id"]) in withhold_set:
            rec["disclosure"] = "withheld"
            rec["withheld_note"] = (
                "Preimage deliberately omitted. The digest and the inclusion proof remain, so this "
                "sample's membership in the root is still provable without revealing its content. "
                "A verifier CANNOT check that this digest is the hash of anything in particular — "
                "only that a leaf with this value is in the tree."
            )
            n_withheld += 1
        else:
            rec["disclosure"] = "disclosed"
            rec["preimage_b64"] = base64.b64encode(e["_preimage"]).decode("ascii")
        samples.append(rec)

    return {
        "schema": SCHEMA,
        "kind": "inspect-eval-evidence-bundle",
        "as_of": as_of,
        "signed": False,
        "signature_state": (
            "UNSIGNED. No Ed25519 signature, no witness, no SCITT receipt exists over this root. "
            "The board signer is unreachable and signing with any other key would misrepresent "
            "who attested it. A reader cannot tell from this bundle WHO built it."
        ),
        "interop_target": {
            "repo": "UKGovernmentBEIS/inspect_ai",
            "issue": 5444,
            "opened": "2026-09-16",
            "author": "StevenMih",
            "state_observed": "OPEN — no maintainer response, no labels, no assignee",
            "observed_on": "2026-09-17",
            "status_warning": (
                "ONE person's issue, days old. NOT an AISI-adopted design, NOT an Inspect "
                "roadmap item, NOT a decision by anyone. A credible interoperability target "
                "and nothing more. Never cite this as AISI adoption."
            ),
            "inspect_license": "MIT",
        },
        "source": {
            "eval_file": eval_path.name,
            "eval_file_sha256": sha256_hex(eval_path.read_bytes()),
            "eval_file_bytes": eval_path.stat().st_size,
            "inspect_ai_version": (header.get("packages") or {}).get("inspect_ai")
                                  or (ev.get("packages") or {}).get("inspect_ai"),
            "log_format_version": header.get("version"),
            "eval_id": ev.get("eval_id"),
            "run_id": ev.get("run_id"),
            "task": ev.get("task"),
            "model": ev.get("model"),
            "status": header.get("status"),
            "provenance": (
                "GENUINE Inspect output: written by the real inspect_ai writer (see "
                "inspect_ai_version) running fully offline against the mockllm/model provider, "
                "which returns canned strings and makes no network call. The FILE FORMAT is "
                "therefore real and not reconstructed by us. The MODEL RESPONSES are mock "
                "placeholders and carry no evaluative meaning whatsoever — the accuracy in this "
                "log is 0.0 and means nothing. Reproduce with fixtures/demo_task.py."
            ),
            "compatibility_claim": (
                "We ran this adapter against this one file, produced by this one Inspect "
                "version, and claim nothing beyond it. We did not modify the .eval format and "
                "we do not claim general Inspect compatibility."
            ),
        },
        "merkle_root": root,
        "n_samples": len(samples),
        "n_disclosed": len(samples) - n_withheld,
        "n_withheld": n_withheld,
        "leaf_definition": LEAF_DEFINITION,
        "leaf_order": LEAF_ORDER,
        "node_definition": NODE_DEFINITION,
        "node_definition_source": (
            "Copied verbatim from public/root.json. Verified 2026-09-17: this rule reproduces "
            "that file's own merkle_root over its own 305 card_sha256 leaves. We did not invent "
            "a second tree shape."
        ),
        "rfc6962_divergence": RFC6962_DIVERGENCE,
        "tree_caveat": TREE_CAVEAT,
        "checkpoint": {
            "note": (
                "Issue #5444 asks for a ~200-byte daily checkpoint. The minimal commitment here "
                "is the root plus the leaf count; the count is NOT optional decoration, it is "
                "what closes the CVE-2012-2459 ambiguity described in tree_caveat."
            ),
            "merkle_root": root,
            "n_samples": len(samples),
            "bytes": len(canonical({"merkle_root": root, "n_samples": len(samples)})),
        },
        "what_inclusion_proves": (
            "That these exact bytes were in this set when this root was computed. Nothing else."
        ),
        "what_this_does_not_establish": NOT_ESTABLISHED,
        "samples": samples,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Inspect .eval -> CSOAI evidence bundle (offline)")
    ap.add_argument("eval_file")
    ap.add_argument("--out", required=True)
    ap.add_argument("--withhold", default="", help="comma-separated sample ids to withhold")
    ap.add_argument("--as-of", default="2026-09-17T00:00:00Z")
    a = ap.parse_args()

    withhold = [w.strip() for w in a.withhold.split(",") if w.strip()]
    bundle = build(pathlib.Path(a.eval_file), withhold, a.as_of)
    pathlib.Path(a.out).write_text(json.dumps(bundle, indent=2, ensure_ascii=True) + "\n")
    print(f"root {bundle['merkle_root']}")
    print(f"samples {bundle['n_samples']}  disclosed {bundle['n_disclosed']}  "
          f"withheld {bundle['n_withheld']}  -> {a.out}")
    print("UNSIGNED — no signature, no witness, no SCITT receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
