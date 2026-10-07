import copy, json, pathlib, sys
try:
    import jsonschema
except Exception as e:
    print("SKIP jsonschema unavailable:", e); sys.exit(2)
ROOT=pathlib.Path(__file__).resolve().parent
S=json.loads((ROOT/"hitl-authority-effect-v0.1.schema.json").read_text())
E=json.loads((ROOT/"hitl-authority-effect.example.json").read_text())
jsonschema.Draft202012Validator.check_schema(S)
jsonschema.validate(E,S)
bad=copy.deepcopy(E); bad["authority"]["decision"]="DENY"
try: jsonschema.validate(bad,S); raise SystemExit("FAIL deny+executed accepted")
except jsonschema.ValidationError: pass
bad=copy.deepcopy(E); bad["effect"]["effect_digest"]=None
try: jsonschema.validate(bad,S); raise SystemExit("FAIL observed effect without digest accepted")
except jsonschema.ValidationError: pass
bad=copy.deepcopy(E); bad["verification"]["evidence_refs"]=[]
try: jsonschema.validate(bad,S); raise SystemExit("FAIL verified without evidence accepted")
except jsonschema.ValidationError: pass
print("PASS 4/4 HITL authority-effect controls")

[executed on device: IOKs-MacBook-Air.local (3a313181-9802-49ab-b57a-b58a3fd4466a)]