#!/usr/bin/env bash
# Stage the EEE v0.3.0 export of the signed card corpus and validate it. STAGES ONLY: no upload, no PR.
# Needs: a python >= 3.12 venv with every-eval-ever==0.3.0 (--no-deps) + pydantic jsonschema rich requests pyyaml pynacl,
# and the EEE v0.3.0 source tree (for the raw eval.schema.json).
#   VENV=/path/venv EEE_SRC=/path/every_eval_ever-0.3.0 bash harness/eval-export/run.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
PY="${VENV:?set VENV}/bin/python"
SCHEMA="${EEE_SRC:?set EEE_SRC}/every_eval_ever/schemas/eval.schema.json"
OUT="$HERE/eee"
AT="$(date -u +%FT%TZ)"

curl -sS -m 30 -o "$HERE/evidence/did.json" https://csoai.org/.well-known/did.json
python3 -c 'import json,sys; r=sys.argv[1]; i=json.load(open(r+"/public/signed/card_index.json")); print(json.dumps(sorted({json.load(open(r+"/public/signed/cards/"+x["card"]+".json"))["body"]["model"] for x in i["cards"]})))' "$REPO" > "$HERE/evidence/models.json"
python3 "$HERE/ollama_check.py" "$HERE/evidence/models.json" > "$HERE/evidence/ollama-library-check.json"

rm -rf "$OUT"
"$PY" "$HERE/eee_export.py" --repo "$REPO" --did-json "$HERE/evidence/did.json" \
  --ollama-check "$HERE/evidence/ollama-library-check.json" --retrieved-at "$AT" --out "$OUT" > "$HERE/evidence/export-summary.json"

cd "$OUT"
set +e
"$PY" -m every_eval_ever.validate "data/*/*/*/*.json" --format json > "$HERE/evidence/eee-validate.json"; V=$?
"$PY" -m every_eval_ever.validator.check_duplicate_entries data/*/*/*/*.json > "$HERE/evidence/eee-duplicates.txt"; D=$?
set -e
"$PY" - "$SCHEMA" "$V" "$D" "$AT" "$HERE" <<'EOF'
import glob, hashlib, json, sys
import jsonschema
schema_path, v, d, at, here = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
schema = json.load(open(schema_path))
files = sorted(glob.glob("data/*/*/*/*.json"))
raw_errors = sum(len(list(jsonschema.Draft7Validator(schema).iter_errors(json.load(open(f))))) for f in files)
rep = json.load(open(f"{here}/evidence/eee-validate.json"))
summ = json.load(open(f"{here}/evidence/export-summary.json"))
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
man = {
    "schema": "csoai.eee-export-manifest/0.1",
    "produced_at": at,
    "state": "STAGED — not submitted. Submission to huggingface.co/datasets/evaleval/EEE_datastore is HELD for the owner.",
    "eee": {"version": "0.3.0", "eval_schema_sha256": sha(schema_path),
            "source": "https://github.com/evaleval/every_eval_ever/tree/v0.3.0"},
    "inputs": {"card_index_sha256": summ["card_index_sha256"],
               "own_model_register": "public/independence/own-model-disclosure.json",
               "did_json_sha256": sha(f"{here}/evidence/did.json"),
               "ollama_library_check_sha256": sha(f"{here}/evidence/ollama-library-check.json")},
    "counts": {k: summ[k] for k in ("cards_in_index", "cards_verified", "excluded_own_or_unconfirmed", "third_party_cards", "held", "unidentified", "exported")},
    "held_axes": summ["held_axes"], "held_models": summ["held_models"],
    "validation": {
        "eee_cli": {"command": "python -m every_eval_ever.validate 'data/*/*/*/*.json' (semantic checks on)", "exit": v,
                    "files": len(rep), "valid": sum(1 for r in rep if r.get("valid")),
                    "errors": sum(len(r.get("errors") or []) for r in rep), "warnings": sum(len(r.get("warnings") or []) for r in rep)},
        "duplicates": {"command": "python -m every_eval_ever.validator.check_duplicate_entries", "exit": d},
        "raw_json_schema_draft7": {"files": len(files), "errors": raw_errors},
    },
    "files": {f: sha(f) for f in files + sorted(glob.glob("adapter_reports/*.json"))},
}
json.dump(man, open("EXPORT-MANIFEST.json", "w"), indent=1)
print(json.dumps({k: man[k] for k in ("counts", "validation")}, indent=1))
EOF
