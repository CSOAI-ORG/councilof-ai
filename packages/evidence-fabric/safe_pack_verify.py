#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Read a SAFE evidence pack offline without editing its frozen bytes.

    python3 safe_pack_verify.py --offline --pack PATH

Treats the selected pack as data: never runs its validate.py or imports its lib.
Checks sums, the pinned record schema/reader-side negative controls, derived
events/renders using pinned reader-side implementations, and the freeze
signature. Missing inputs or dependencies are UNCHECKABLE (exit 2); a confirmed
failed check is INVALID (exit 1). A valid supplied-DID signature is reported as
SELF_CONSISTENT_UNAUTHENTICATED_KEY (exit 2), never issuer authentication.
Unsupported schemas or missing trusted reader implementations are UNCHECKABLE.
Needs Python 3.9+, jsonschema (validation), cryptography (signature). Network: none.
Interpreter isolation is not an operating-system sandbox.
"""
import argparse, copy, errno, hashlib, io, json, os, stat, subprocess, sys, contextlib

SOURCE_DIR = os.path.dirname(os.path.abspath(__file__))
HERE = SOURCE_DIR
sys.path.insert(0, SOURCE_DIR)
RECORD_SCHEMA_SHA256 = '4ae3befcf78b027f9f72e99c71602b4310de64f9fb299674f3621984007ff94d'
READER_CODE_SHA256 = {'safe_pack.py': '7fc46f2bfe0d5c08390058d1c9e3a98f4a18120a284c7d2bf539c747ea24bd72', 'event.py': 'ea62aecba02fe25ebcfed5da774695318bedeaca810428872f41f0d08b622849', 'ingest/__init__.py': '1b6a0e1d1bb588ed344515b762d5a37ae429e31793998d7c6c58e6313e967459', 'ingest/safe_in.py': '8e6c98bcd17f114fe17d54176477a45b910e3e595d52bb7f5841b7ca34f6343b', 'render/__init__.py': '3268a50b4874018ad982b81db643a9f67ed7378d4ee08227698feeec592d2e03', 'render/ocsf.py': '98b767e9a2be9ee3df6083580c2dccc47c55ebf42abfb1af3c3d4f5159c1d20f', 'render/otel.py': 'b69cece4bbeae61e84a8b2af597f44757c767925020a32c80874cd94c2a52cce', 'render/sarif.py': 'be8d00f7e792a3ac2a021bee51c440ad4ed31e0e23a6e3178cf7b95748f4b375', 'render/intoto.py': 'e85c9dcbc2e0bc44b3d361ff642446704c1e16167b345a4f1cc65efde6a0a65a', 'render/ecs_hec.py': '5be743d87653447a45c949e07fce5a0a9d6731962795e7e089cfaea42952f839'}

UNKNOWN_ERRORS = (OSError, ImportError, ValueError, TypeError, KeyError, RecursionError)


def sha(b):
    return hashlib.sha256(b).hexdigest()


class InvalidPack(ValueError):
    """A confirmed unsafe pack path or non-regular member."""


_READ_CACHE = {}
_FILES_CACHE = {}


def _parts(relative):
    if (not isinstance(relative, str) or not relative or "\\" in relative or "\0" in relative
            or relative.startswith("/") or any(part in ("", ".", "..") for part in relative.split("/"))):
        raise InvalidPack(f"unsafe pack member path: {relative!r}")
    return relative.split("/")


def _open_directory(name, parent, expected=None):
    qualified = expected or os.stat(name, dir_fd=parent, follow_symlinks=False)
    if not stat.S_ISDIR(qualified.st_mode):
        raise InvalidPack(f"unsafe pack directory: {name}")
    try:
        descriptor = os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
    except OSError as exc:
        if exc.errno in (errno.ELOOP, errno.ENOTDIR):
            raise InvalidPack(f"unsafe pack directory changed type: {name}") from exc
        raise
    actual = os.fstat(descriptor)
    if (actual.st_dev, actual.st_ino) != (qualified.st_dev, qualified.st_ino):
        os.close(descriptor)
        raise InvalidPack(f"unsafe pack directory changed identity: {name}")
    return descriptor


def _root():
    # Anchor every component from '/', never traverse ancestors by pathname.
    descriptor = os.open(os.sep, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for part in os.path.abspath(HERE).split(os.sep):
            if not part:
                continue
            child = _open_directory(part, descriptor)
            os.close(descriptor)
            descriptor = child
        return descriptor
    except BaseException:
        os.close(descriptor)
        raise


def rd(relative):
    """Read a contained regular file once; later checks use the same approved bytes."""
    parts = _parts(relative)
    key = (os.path.abspath(HERE), relative)
    if key in _READ_CACHE:
        return _READ_CACHE[key]
    directory = _root()
    descriptor = None
    try:
        for part in parts[:-1]:
            next_directory = _open_directory(part, directory)
            os.close(directory)
            directory = next_directory
        qualified = os.stat(parts[-1], dir_fd=directory, follow_symlinks=False)
        if not stat.S_ISREG(qualified.st_mode):
            raise InvalidPack(f"unsafe pack member: {relative} is not a regular file")
        descriptor = os.open(parts[-1], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
        actual = os.fstat(descriptor)
        if not stat.S_ISREG(actual.st_mode):
            raise InvalidPack(f"unsafe pack member: {relative} changed type")
        if (actual.st_dev, actual.st_ino) != (qualified.st_dev, qualified.st_ino):
            raise InvalidPack(f"unsafe pack member: {relative} changed identity")
        with os.fdopen(descriptor, "rb") as stream:
            descriptor = None
            body = stream.read()
        _READ_CACHE[key] = body
        return body
    finally:
        if descriptor is not None:
            os.close(descriptor)
        os.close(directory)


def _pack_files():
    root = os.path.abspath(HERE)
    if root in _FILES_CACHE:
        return _FILES_CACHE[root]
    files = []
    def scan(directory, parent):
        # scandir(fd) stays attached to the qualified directory if its name moves.
        with os.scandir(directory) as entries:
            for entry in entries:
                relative = parent + "/" + entry.name if parent else entry.name
                _parts(relative)
                qualified = entry.stat(follow_symlinks=False)
                if stat.S_ISDIR(qualified.st_mode):
                    child = _open_directory(entry.name, directory, qualified)
                    try:
                        scan(child, relative)
                    finally:
                        os.close(child)
                elif stat.S_ISREG(qualified.st_mode):
                    files.append(relative)
                else:
                    raise InvalidPack(f"unsafe pack member: {relative} is not a regular file or directory")
    directory = _root()
    try:
        scan(directory, "")
    finally:
        os.close(directory)
    _FILES_CACHE[root] = sorted(files)
    return _FILES_CACHE[root]


def check_sums():
    sums = rd("SHA256SUMS")
    fr = json.loads(rd("FREEZE.json"))
    if fr["sha256sums_sha256"] != sha(sums):
        return False, "SHA256SUMS differs from FREEZE.json"
    listed = {}
    for line in sums.decode().splitlines():
        h, rel = line.split("  ", 1)
        _parts(rel)
        if rel in listed:
            raise InvalidPack(f"unsafe pack manifest: duplicate member {rel}")
        listed[rel] = h
    missing = []
    files = _pack_files()
    for rel, digest in listed.items():
        try:
            member = rd(rel)
        except FileNotFoundError:
            missing.append(rel)
            continue
        if sha(member) != digest:
            return False, f"{rel}: sha256 differs from SHA256SUMS"
    for relative in files:
        if relative in ("SHA256SUMS", "FREEZE.json") or relative.startswith("FREEZE.") or relative == "did.json" or "__pycache__" in relative:
            continue
        if relative not in listed:
            return False, f"{relative}: in the pack but not in SHA256SUMS"
    if missing:
        return None, f"{', '.join(missing)}: NOT_PRESENT (listed files unavailable)"
    return True, f"{len(listed)} files match"


def _cross_errors(records):
    by_id = {record["record_id"]: record for record in records.values()}
    errors = []
    for name, record in records.items():
        for prior in record.get("supersedes", []):
            if prior["record_id"] in by_id and _canonical_record_sha(by_id[prior["record_id"]]) != prior["sha256"]:
                errors.append(f"{name}: supersedes digest differs")
        remediation = record.get("remediation") or {}
        if remediation.get("state") == "VERIFIED_BY_RETEST":
            retest = by_id.get(remediation.get("retest_record_id"))
            if not retest or retest["result"]["state"] != "PASS" or retest["negative_control"]["observed"] != "FAIL":
                errors.append(f"{name}: VERIFIED_BY_RETEST lacks a PASS record with a failed-as-designed control")
    return errors


def _canonical_record_sha(record):
    return sha(json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode())


def check_validate():
    # The supplied schema is data, accepted only for this reviewed fixed profile.
    raw = rd("schema/safe-reverification-record-v0.1.schema.json")
    if sha(raw) != RECORD_SCHEMA_SHA256:
        return None, "unsupported record schema; selected-pack validator is never executed"
    from jsonschema import Draft7Validator
    validator = Draft7Validator(json.loads(raw))
    records = {relative.split("/")[-1]: json.loads(rd(relative))
               for relative in _pack_files() if relative.startswith("records/")
               and relative.count("/") == 1 and relative.endswith(".safe-rv.json")}
    if not records:
        return None, "NOT_PRESENT (records unavailable for schema and negative controls)"
    for name, record in records.items():
        errors = list(validator.iter_errors(record))
        if errors:
            return False, f"{name}: record schema rejects input: {errors[0].message}"
    cross_errors = _cross_errors(records)
    if cross_errors:
        return False, cross_errors[0]
    # These nine reader-side controls preserve the existing profile validation.
    try:
        p = next(name for name, record in records.items() if record["result"]["state"] == "PASS")
        u = next(name for name, record in records.items() if record["result"]["state"] == "UNMEASURED")
        f = next(name for name, record in records.items() if record["result"]["state"] == "FAIL")
        ids = {record["record_id"] for record in records.values()}
        supersession = next(name for name, record in records.items()
                            if any(prior["record_id"] in ids for prior in record.get("supersedes", [])))
        retest = next(name for name, record in records.items()
                      if (record.get("remediation") or {}).get("state") == "VERIFIED_BY_RETEST")
    except StopIteration:
        return None, "required negative-control source records unavailable"
    def mutate(name, change):
        record = copy.deepcopy(records[name])
        change(record)
        return record
    schema_controls = [
        mutate(p, lambda d: d["negative_control"].update(kind="none", observed="NOT_RUN")),
        mutate(p, lambda d: d["negative_control"].update(observed="PASS")),
        mutate(u, lambda d: d["result"].update(n=84)),
        mutate(f, lambda d: (d["claim"].update(claim_type="population_count"),
                             d["result"].update(read_state="PARTIAL", state="PASS", denominator=78))),
        mutate(f, lambda d: d.update(remediation={"state": "VERIFIED_BY_RETEST",
                                                 "reference": None, "retest_record_id": None})),
        mutate(p, lambda d: d.update(limits=[])),
        mutate(p, lambda d: d["result"].update(state="CERTIFIED")),
    ]
    if any(not list(validator.iter_errors(control)) for control in schema_controls):
        return False, "reader-side schema negative control was accepted"
    altered = copy.deepcopy(records)
    digest = altered[supersession]["supersedes"][0]["sha256"]
    altered[supersession]["supersedes"][0]["sha256"] = ("0" if digest[0] != "0" else "1") + digest[1:]
    if not _cross_errors(altered):
        return False, "reader-side supersession negative control was accepted"
    altered = copy.deepcopy(records)
    altered[retest]["remediation"]["retest_record_id"] = "csoai:safe-rv:does-not-exist"
    if not _cross_errors(altered):
        return False, "reader-side retest negative control was accepted"
    return True, f"{len(records)} records, cross-record rules and 9 reader-side negative controls hold"


def _reader_code_ready():
    for relative, expected in READER_CODE_SHA256.items():
        try:
            with open(os.path.join(SOURCE_DIR, relative), "rb") as stream:
                raw = stream.read()
        except OSError:
            return None, f"trusted reader implementation unavailable: {relative}"
        if sha(raw) != expected:
            return None, f"unsupported trusted reader implementation: {relative}"
    return True, "reader-side implementations match reviewed bytes"


def _check_derived_data(data):
    # All selected-pack inputs arrive as approved bytes, not paths or modules.
    sys.dont_write_bytecode = True
    import safe_pack as SP
    import event as E
    events, index = [], []
    for member in data["records"]:
        raw = bytes.fromhex(member["bytes"])
        record = json.loads(raw)
        event = SP.safe_in.to_event(record, member["name"])
        events.append(event)
        index.append({"record_file": member["name"], "record_id": record["record_id"],
                      "record_sha256_canonical": SP.safe_in.record_sha256(record),
                      "record_file_sha256": sha(raw), "event_id": event["event_id"], "state": event["state"]})
    targets = {relative: bytes.fromhex(body) for relative, body in data["targets"].items()}
    body = "".join(json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n" for event in events).encode()
    if body != targets["events/events.jsonl"]:
        return False, "events.jsonl does not re-derive from records/"
    if json.loads(targets["events/event-ids.json"])["records"] != index:
        return False, "event-ids.json does not re-derive"
    for event in events:
        if E.validate(event):
            return False, f"event {event['event_id']} invalid"
    renders = SP.renders(events)
    for name, body in renders.items():
        if body.encode() != targets["render/" + name]:
            return False, f"render/{name} does not re-render"
    return True, f"{len(events)} events and {len(renders)} renders re-derived byte-identical"


def check_derived():
    ready, reason = _reader_code_ready()
    if ready is not True:
        return ready, reason
    records = [relative for relative in _pack_files()
               if relative.startswith("records/") and relative.count("/") == 1 and relative.endswith(".safe-rv.json")]
    if not records:
        return None, "NOT_PRESENT (records unavailable for trusted derivation)"
    targets = ["events/events.jsonl", "events/event-ids.json",
               "render/ocsf.jsonl", "render/otel.json", "render/evidence.sarif",
               "render/intoto.jsonl", "render/hec.ndjson"]
    data = {"records": [{"name": relative.split("/")[-1], "bytes": rd(relative).hex()} for relative in records],
            "targets": {relative: rd(relative).hex() for relative in targets}}
    worker = """
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("_safe_pack_verifier", sys.argv[1])
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)
sys.path.insert(0, verifier.SOURCE_DIR)
ready, reason = verifier._reader_code_ready()
if ready is not True:
    print(json.dumps((ready, reason)))
    sys.exit(0)
try:
    result = verifier._check_derived_data(json.load(sys.stdin))
except verifier.UNKNOWN_ERRORS as exc:
    result = (None, type(exc).__name__ + ": " + str(exc))
print(json.dumps(result))
"""
    result = subprocess.run([sys.executable, "-I", "-B", "-c", worker, os.path.abspath(__file__)],
                            input=json.dumps(data), capture_output=True, text=True)
    if result.returncode != 0:
        return None, "derivation could not complete: " + result.stderr.strip()[-200:]
    return tuple(json.loads(result.stdout))


def check_signature():
    # Reuse the reviewed external signature consumer, also copied into future pack/lib.
    from safe_freeze_v2 import check_signature as check
    def optional(rel):
        try:
            return rd(rel)
        except FileNotFoundError:
            return None
    return check(rd("FREEZE.json"), optional("FREEZE.signed.json"), optional("did.json"))


def main(argv=None):
    global HERE, _READ_CACHE, _FILES_CACHE
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="required; no network is used")
    parser.add_argument("--pack", default=SOURCE_DIR, help="pack directory (default: beside this verifier)")
    args = parser.parse_args(argv)
    if not args.offline:
        parser.print_usage()
        return 2
    HERE = os.path.abspath(args.pack)
    _READ_CACHE, _FILES_CACHE = {}, {}
    results = {}
    for name, fn in (("sums", check_sums), ("validate", check_validate),
                     ("derived", check_derived), ("signature", check_signature)):
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                ok, why = fn()
        except InvalidPack as ex:
            ok, why = False, str(ex)
        except UNKNOWN_ERRORS as ex:
            ok, why = None, f"{type(ex).__name__}: {ex}"
        results[name] = {"holds": ok, "reason": why}
    for name, result in results.items():
        ok = result["holds"]
        print(f"{'OK  ' if ok else ('FAIL' if ok is False else 'N/A ')} {name}: {result['reason']}")
    if any(result["holds"] is False for result in results.values()):
        state, rc = "INVALID", 1
    elif any(result["holds"] is not True for result in results.values()):
        state, rc = "UNCHECKABLE", 2
    else:
        state, rc = "SELF_CONSISTENT_UNAUTHENTICATED_KEY", 2
    print(json.dumps({"verifier_profile": "csoai.safe-pack-readback/3", "state": state,
                      "pack": HERE, "signature_valid": results["signature"]["holds"],
                      "issuer_authenticated": None, "checks": results,
                      "scope": "data-only offline pack integrity with qualified reader-side code and supplied-DID-key consistency; no issuer authentication"}))
    return rc

if __name__ == "__main__":
    sys.exit(main())
