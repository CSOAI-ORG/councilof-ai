"""card_v0 checker — written from the schema, stdlib only. Is one CSOAI card
entry well-formed? Returns {conforms, failed}. No CSOAI import."""
import re
HEX64=re.compile(r"^[0-9a-f]{64}$")
ISO=re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$")
def check(entry):
    failed=[]
    if not isinstance(entry,dict):
        return {"conforms":False,"failed":["top_level_object"]}
    if not (isinstance(entry.get("card"),str) and HEX64.match(entry["card"])): failed.append("card_hash_format")
    if "axis" not in entry: failed.append("axis_present")
    if not (isinstance(entry.get("ts"),str) and ISO.match(entry.get("ts",""))): failed.append("ts_iso8601")
    if entry.get("signed") is not True: failed.append("signed_true")
    if "kid" not in entry: failed.append("kid_present")
    return {"conforms":len(failed)==0,"failed":failed}
