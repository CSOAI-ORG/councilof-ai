#!/usr/bin/env bash
# Build the good bundle, verify it, then run three TAMPERED bundles that MUST be rejected.
# A verifier that only ever says VALID is worthless, so this script is part of the artifact.
# Strictly offline: nothing here opens a socket.
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:-./out}"
mkdir -p "$OUT"
EVAL=fixtures/demo-mockllm.eval

echo "=============================================================="
echo "BUILD — withholding sample 3; its digest stays in the bundle"
echo "=============================================================="
python3 eval_to_evidence.py "$EVAL" --out "$OUT/bundle.json" --withhold 3

echo
echo "=============================================================="
echo "GOOD BUNDLE — must be VALID (bundle alone, no .eval, no network)"
echo "=============================================================="
python3 verify_bundle.py "$OUT/bundle.json" --expect valid

echo
echo "=============================================================="
echo "GOOD BUNDLE + optional cross-check against the source .eval"
echo "=============================================================="
python3 verify_bundle.py "$OUT/bundle.json" --eval "$EVAL" --expect valid

echo
echo "=============================================================="
echo "CONTROL C1 — alter the WITHHELD sample's preimage, then disclose it."
echo "This is the control the task demands: the withheld sample's content is"
echo "changed and re-presented. The digest in the bundle is the honest one, so"
echo "sha256(tampered preimage) no longer matches it and the bundle must fail."
echo "=============================================================="
python3 - "$OUT/bundle.json" "$OUT/c1-tampered-withheld-preimage.json" <<'PY'
import base64, json, sys
src, dst = sys.argv[1], sys.argv[2]
b = json.load(open(src))
# Recover the withheld sample's true preimage from the source .eval, alter one character of the
# model's answer, and present the result as if it were the genuine disclosed content.
import zipfile
w = next(s for s in b["samples"] if s["disclosure"] == "withheld")
with zipfile.ZipFile("fixtures/demo-mockllm.eval") as z:
    obj = json.loads(z.read(w["member"]))
raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
# A MEANINGFUL forgery, not a cosmetic one: rewrite what the model said so the withheld
# sample looks as though it answered the target correctly. This is the exact abuse selective
# disclosure invites — withhold a sample, then later "reveal" a flattering version of it.
tampered = raw.replace('"content":"Default output from mockllm/model"', '"content":"blue"', 1)
assert tampered != raw, "tamper did not change anything — control would be vacuous"
w["disclosure"] = "disclosed"
w.pop("withheld_note", None)
w["preimage_b64"] = base64.b64encode(tampered.encode()).decode()
json.dump(b, open(dst, "w"), indent=2)
print(f"wrote {dst}: withheld sample id={w['sample_id']} preimage altered by 1 character")
PY
python3 verify_bundle.py "$OUT/c1-tampered-withheld-preimage.json" --expect reject

echo
echo "=============================================================="
echo "CONTROL C2 — flip one bit of one digest. The root must stop recomputing."
echo "=============================================================="
python3 - "$OUT/bundle.json" "$OUT/c2-tampered-digest.json" <<'PY'
import json, sys
b = json.load(open(sys.argv[1]))
s = b["samples"][0]
old = s["digest"]
s["digest"] = ("0" if old[0] != "0" else "1") + old[1:]
json.dump(b, open(sys.argv[2], "w"), indent=2)
print(f"wrote {sys.argv[2]}: digest {old[:16]}… -> {s['digest'][:16]}…")
PY
python3 verify_bundle.py "$OUT/c2-tampered-digest.json" --expect reject

echo
echo "=============================================================="
echo "CONTROL C3 — CVE-2012-2459. Duplicate the tail leaf. Because odd nodes are"
echo "paired with themselves, the root is UNCHANGED while the leaf set is DIFFERENT."
echo "The root check alone therefore PASSES. Only the declared-count guard catches it."
echo "This is why public/root.json puts card_count inside the signed preimage."
echo "=============================================================="
python3 - "$OUT/bundle.json" "$OUT/c3-cve-2012-2459.json" <<'PY'
import copy, json, sys
sys.path.insert(0, ".")
from csoai_merkle import merkle_root
b = json.load(open(sys.argv[1]))
leaves = [s["digest"] for s in sorted(b["samples"], key=lambda s: s["index"])]
extra = copy.deepcopy(b["samples"][-1])
extra["index"] = len(b["samples"])
extra["sample_id"] = f"{extra['sample_id']}-forged-duplicate"
b["samples"].append(extra)          # leaf set changed; n_samples deliberately left stale
print("root over original leaves :", merkle_root(leaves))
print("root over padded leaves   :", merkle_root(leaves + [leaves[-1]]))
print("IDENTICAL ROOT, DIFFERENT LEAF SET" if merkle_root(leaves) == merkle_root(leaves + [leaves[-1]])
      else "roots differ")
json.dump(b, open(sys.argv[2], "w"), indent=2)
PY
python3 verify_bundle.py "$OUT/c3-cve-2012-2459.json" --expect reject

echo
echo "=============================================================="
echo "ALL CONTROLS BEHAVED AS REQUIRED: 1 bundle accepted, 3 tampered bundles rejected."
echo "=============================================================="
