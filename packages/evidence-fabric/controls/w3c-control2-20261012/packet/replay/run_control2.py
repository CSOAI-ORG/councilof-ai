#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Portable reproduction candidate; derived from the recorded private helper.
Modified 12 October 2026: operator paths and unsupported personal attribution
removed; checker logic, fixtures, selectors and expected answers unchanged.
This portable derivative has not been executed.
"""
import base64, copy, datetime, hashlib, importlib, json, os, platform, re, socket, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PIN = "a730cd2f4ddc65ea72e53d44577d929db45f9e38"
PYTHON = sys.executable
COMMAND = "PYTHONHASHSEED=0 python3 -B run_control2.py"
RULES = ("payload-digest", "artifact-digest", "ed25519-signature")
PINNED_GIT_BLOBS = {"source/packages/evidence-fabric/render/__init__.py":{"bytes":1813,"git_blob_sha1":"ae9acc8771a16462147675e1bdb542aa65dbc487"},"source/packages/evidence-fabric/render/w3c_acr01.py":{"bytes":25530,"git_blob_sha1":"0fbb4f3c3295785d8842e7edf2069babc3128b4f"},"source/packages/evidence-fabric/event.py":{"bytes":10777,"git_blob_sha1":"e2709a0de317e3a36b6248b6175bc73ea9c69b24"},"source/packages/evidence-fabric/tests/test_w3c_acr01.py":{"bytes":11281,"git_blob_sha1":"134001dac5bc2afe5f38e44e8b727e083011274d"},"inputs/FREEZE.json":{"bytes":425,"git_blob_sha1":"a74763de163b4db707f00365cea20b01815ed817"},"inputs/FREEZE.signed.json":{"bytes":2039,"git_blob_sha1":"c0d36656f1cdeb8885af09d8b53c913e2a7ab505"},"inputs/did.json":{"bytes":5502,"git_blob_sha1":"977a92030640487039d63b188615cc7bb6812d37"}}
def sha(b):
    return hashlib.sha256(b).hexdigest()
def blob_sha(b):
    return hashlib.sha1(b"blob " + str(len(b)).encode("ascii") + b"\0" + b).hexdigest()
def encode(o):
    return (json.dumps(o, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")
def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
def raw_payload(raw):
    text = raw.decode("utf-8")
    match = re.search(r'"payload"\s*:\s*', text)
    if match is None:
        raise ValueError("No payload member")
    _, end = json.JSONDecoder().raw_decode(text, match.end())
    return text[match.end():end].encode("utf-8")
def manifest(paths):
    return {str(p.relative_to(ROOT)): {"bytes": len(p.read_bytes()), "sha256": sha(p.read_bytes()), "git_blob_sha1": blob_sha(p.read_bytes())} for p in paths}

# Exclusive marker makes an accidental second execution fail before any checker call.
with (ROOT / "RUN_STARTED.json").open("x", encoding="utf-8") as f:
    f.write(json.dumps({"started_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "source_pin": PIN}) + "\n")
sources = sorted((ROOT / "source").rglob("*.py"))
originals = sorted((ROOT / "inputs").glob("*"))
immutable = sources + originals + [ROOT / "run_control2.py"]
before = manifest(immutable)
assert os.environ.get("PYTHONHASHSEED") == "0", "Run exactly the declared fixed-seed command"
for name, expected in PINNED_GIT_BLOBS.items():
    assert before[name]["git_blob_sha1"] == expected["git_blob_sha1"] and before[name]["bytes"] == expected["bytes"], "Pinned source/input mismatch: " + name
# No external lookup, endpoint, tool, settlement or payment is part of this run.
def blocked_network(*args, **kwargs):
    raise RuntimeError("Network disabled for this private offline checker run")
socket.socket = blocked_network
socket.create_connection = blocked_network
sys.dont_write_bytecode = True
sys.path.insert(0, str(ROOT / "source/packages/evidence-fabric"))
import cryptography
from render import w3c_acr01 as W

a = (ROOT / "inputs/FREEZE.json").read_bytes()
s = (ROOT / "inputs/FREEZE.signed.json").read_bytes()
db = (ROOT / "inputs/did.json").read_bytes()
d = json.loads(db)
parsed = json.loads(s)
failures = []
def require(condition, label):
    if not condition:
        failures.append(label)

# Byte-preserving changes: exactly one hexadecimal ASCII character in the named field.
def flip_named_hex(raw, field, width):
    pattern = rb'"' + field.encode("ascii") + rb'"\s*:\s*"([0-9a-fA-F]{' + str(width).encode("ascii") + rb'})"'
    matches = list(re.finditer(pattern, raw))
    if len(matches) != 1:
        raise ValueError("Expected exactly one valid hex field: " + field)
    index = matches[0].start(1)
    replacement = b"0" if raw[index:index+1] != b"0" else b"1"
    changed = raw[:index] + replacement + raw[index+1:]
    require(len(changed) == len(raw), field + ": same length")
    require(sum(x != y for x, y in zip(raw, changed)) == 1, field + ": exactly one changed byte")
    return changed, {"byte_offset": index, "before_ascii": chr(raw[index]), "after_ascii": replacement.decode("ascii")}

metadata, metadata_edit = flip_named_hex(s, "payload_sha256", 64)
sigflip, signature_edit = flip_named_hex(s, "sig_ed25519", 128)
newline = a + b"\n"
old = W._alter_artifact_digest(s)  # Preserve the original signed-payload, multi-guard negative.
mp = json.loads(metadata)
sp = json.loads(sigflip)
require(mp["payload"] == parsed["payload"], "metadata fixture: payload object unchanged")
require(canon(mp["payload"]) == canon(parsed["payload"]), "metadata fixture: canonical signed payload unchanged")
require(raw_payload(metadata) == raw_payload(s), "metadata fixture: exact raw signed payload bytes unchanged")
require(raw_payload(sigflip) == raw_payload(s), "signature fixture: exact raw signed payload bytes unchanged")
require(mp["signature"]["sig_ed25519"] == parsed["signature"]["sig_ed25519"], "metadata fixture: signature bytes unchanged")
m_without = copy.deepcopy(mp)
m_without["signature"]["payload_sha256"] = parsed["signature"]["payload_sha256"]
require(m_without == parsed, "metadata fixture: only unsigned declared digest value changed")
s_without = copy.deepcopy(sp)
s_without["signature"]["sig_ed25519"] = parsed["signature"]["sig_ed25519"]
require(s_without == parsed, "signature fixture: only signature hex value changed")
require(re.fullmatch("[0-9a-fA-F]{128}", sp["signature"]["sig_ed25519"]) is not None, "signature fixture: valid hex format")
require(json.loads(old)["payload"] != parsed["payload"], "old control still changes the signed payload")
require(newline[:-1] == a and len(newline) == len(a)+1, "artifact fixture: one appended newline")

fixtures = [
    {"id": "baseline", "artifact": a, "signed": s, "did": db, "target": None, "change": "No change"},
    {"id": "unsigned-declared-payload-digest", "artifact": a, "signed": metadata, "did": db, "target": "payload-digest", "change": "One valid hex character only in signature.payload_sha256", "edit": metadata_edit},
    {"id": "artifact-newline", "artifact": newline, "signed": s, "did": db, "target": "artifact-digest", "change": "One appended LF byte in artifact only"},
    {"id": "signature-hex-nibble", "artifact": a, "signed": sigflip, "did": db, "target": "ed25519-signature", "change": "One valid hex character only in signature.sig_ed25519", "edit": signature_edit},
    {"id": "original-signed-payload-multi-guard", "artifact": a, "signed": old, "did": db, "target": None, "change": "Unchanged original W._alter_artifact_digest(s) mutator"},
]
# Separate availability boundary, deliberately under a different DID configuration.
missing = copy.deepcopy(d)
missing["verificationMethod"] = []
missing_db = encode(missing)
fixtures.append({"id": "missing-key", "artifact": a, "signed": s, "did": missing_db, "target": None, "change": "Empty verificationMethod in a separate copied DID document"})

require(all(f["artifact"] == a and f["did"] == db for f in (fixtures[1], fixtures[3])), "metadata/signature fixtures: artifact and DID bytes unchanged")
require(fixtures[2]["signed"] == s and fixtures[2]["did"] == db, "newline fixture: signed record and DID bytes unchanged")
selected_cases = [{"case_id": f["id"] + "--" + (r or "unrelaxed"), "fixture_id": f["id"], "relax": [] if r is None else [r]} for f in fixtures[:5] for r in [None] + list(RULES)]
selected_cases.append({"case_id": "missing-key--unrelaxed", "fixture_id": "missing-key", "relax": []})
require(len(selected_cases) == 21 and len({c["case_id"] for c in selected_cases}) == 21, "closed inventory is exactly21 unique selected cases")
observations = []
def observe(fixture, relaxed=None):
    got = W.check_signed_artifact(fixture["artifact"], fixture["signed"], json.loads(fixture["did"]),
                                  relax=frozenset() if relaxed is None else frozenset({relaxed}))
    row = {"case_id": fixture["id"] + "--" + (relaxed or "unrelaxed"), "fixture_id": fixture["id"], "relax": [] if relaxed is None else [relaxed], "state": got[0], "reason": got[1], "native_return": list(got),
           "evidence_disposition": {"artifact": "carried", "signed_record": "carried", "did_document": "carried", "native_result": "carried"},
           "input_packet_refs": {k: "fixture_bytes_base64." + fixture["id"] + "." + k for k in ("artifact", "signed", "did")}}
    observations.append(row)
    return got

for f in fixtures[:5]:
    modes = [None] + list(RULES)
    for relaxed in modes:
        got = observe(f, relaxed)
        if f["id"] == "baseline":
            expected = ("pass", None)
        elif f["target"] is not None:
            expected = ("pass", None) if relaxed == f["target"] else ("fail", f["target"])
        else:
            expected = ("fail", "artifact-digest") if relaxed == "payload-digest" else ("fail", "payload-digest")
        require(got == expected, f["id"] + "/" + str(relaxed) + ": native result " + repr(got) + " != " + repr(expected))
        require(got[0] != "inconclusive", f["id"] + "/" + str(relaxed) + ": no inconclusive substitution")
got_missing = observe(fixtures[5])
require(got_missing == ("inconclusive", "key-not-in-did-document"), "missing-key preserves native inconclusive and reason")

case_recount = {c["case_id"]: sum(o["case_id"] == c["case_id"] for o in observations) for c in selected_cases}
outside_inventory = [o["case_id"] for o in observations if o["case_id"] not in case_recount]
require(all(n == 1 for n in case_recount.values()) and not outside_inventory, "each selected case observed once; no outside-inventory case")
require(len(observations) == sum(case_recount.values()) == 21, "per-case recount equals declared/displayed21")
state_recount = {state: sum(o["state"] == state for o in observations) for state in ("pass", "fail", "inconclusive", "void", "not-exercised")}

derived = ROOT / "derived-fixtures"
derived.mkdir(mode=0o700)
for f in fixtures[1:]:
    out = derived / f["id"]
    out.mkdir(mode=0o700)
    for key, name in (("artifact","FREEZE.json"), ("signed","FREEZE.signed.json"), ("did","did.json")):
        (out / name).write_bytes(f[key])
after = manifest(immutable)
require(before == after, "all source, original fixture and helper bytes unchanged after run")
fixture_inventory = []
for f in fixtures:
    row = {k:v for k,v in f.items() if k not in ("artifact","signed","did")}
    row["input_digests"] = {k: {"bytes": len(f[k]), "sha256": sha(f[k])} for k in ("artifact","signed","did")}
    row["raw_payload_sha256"] = sha(raw_payload(f["signed"]))
    row["canonical_payload_sha256"] = sha(canon(json.loads(f["signed"])["payload"]))
    row["signature_hex_sha256"] = sha(json.loads(f["signed"])["signature"]["sig_ed25519"].encode("ascii"))
    row["config_digest"] = W.config_digest(f["did"])
    fixture_inventory.append(row)

result = {
    "schema": "csoai.private-w3c-control2-run/0.1",
    "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source_revision": PIN, "pinned_source_bindings": PINNED_GIT_BLOBS, "command": COMMAND,
    "python": sys.version, "python_executable": "selected python3 interpreter; absolute path omitted",
    "platform": "omitted in public derivative", "cryptography_version": cryptography.__version__,
    "network": "blocked before source import and checker calls",
    "checker_revision": W.checker_revision(), "baseline_config_digest": W.config_digest(db),
    "immutable_files_before": before, "immutable_files_after": after,
    "fixture_corpus": fixture_inventory, "closed_unique_case_inventory": selected_cases, "observations": observations,
    "displayed_total": 21, "per_case_recount": case_recount, "recounted_total": sum(case_recount.values()), "state_recount": state_recount, "outside_inventory": outside_inventory,
    "serialization": "Checker native (state, rule) tuples are carried as JSON arrays and named fields, without result coercion. Packet/result: json.dumps(ensure_ascii=False, sort_keys=True, indent=2) plus LF; summary: sort_keys=True. This is our operator packet format, not a declared upstream nativeCaseArray wire format.",
    "hashseed": {"PYTHONHASHSEED": os.environ.get("PYTHONHASHSEED"), "scope": "One run at seed0 only; no multi-seed reproducibility claim"},
    "intake": "Closed inventory, explicit corpus+selectors, per-case recount, per-observation carried evidence and expected-answer exposure. This run does not reproduce external reader findings.",
    "native_checker_calls": len(observations),
    "expected_answer_exposure": "Operator has source, fixture values, expected states/reasons and assertions. This is not a blind or independent evaluation.",
    "synthetic_key": "No synthetic signing key is generated or used; verification uses the frozen public DID fixture, and no private key is present.",
    "goldens": "Original golden reports are not copied, edited, regenerated, or used to claim a fresh independent reproduction.",
    "failures": failures, "criteria_passed": not failures,
    "limitations": [
        "Private operator fixture/result candidate for existing Source review; no code adoption or publication.",
        "Same CSOAI checker implementation over historical 30 September 2026 fixtures, not an independent implementation or new measurement.",
        "Signature verification uses the frozen DID document; no fresh DID lookup, present authority/revocation or key-control claim.",
        "Named-rule isolation establishes these controlled input differences only; not full specification conformance, outside use or acceptance.",
    ],
}
(ROOT / "result.json").write_bytes(encode(result))
packet = {
    "result": result,
    "retained_source_and_helper_utf8": {str(p.relative_to(ROOT)):p.read_text(encoding="utf-8") for p in sources+[ROOT/"run_control2.py"]},
    "fixture_bytes_base64": {f["id"]:{k:base64.b64encode(f[k]).decode("ascii") for k in ("artifact","signed","did")} for f in fixtures},
}
packet_bytes = encode(packet)
packet_path = ROOT / "packet.json"
packet_path.write_bytes(packet_bytes)
print(json.dumps({"packet_path":str(packet_path), "packet_bytes":len(packet_bytes), "packet_sha256":sha(packet_bytes),
                  "result_path":str(ROOT/"result.json"), "result_sha256":sha((ROOT/"result.json").read_bytes()),
                  "checker_fullfile":before["source/packages/evidence-fabric/render/w3c_acr01.py"],
                  "test_fullfile":before["source/packages/evidence-fabric/tests/test_w3c_acr01.py"],
                  "checker_revision":result["checker_revision"], "config_digest":result["baseline_config_digest"],
                  "helper_fullfile":before["run_control2.py"], "criteria_passed":result["criteria_passed"], "failures":failures,
                  "displayed_total":21, "recounted_total":sum(case_recount.values()), "state_recount":state_recount,
                  "observations":observations},sort_keys=True))
sys.exit(0 if not failures else 1)
