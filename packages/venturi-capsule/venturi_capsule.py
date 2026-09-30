#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""Measurement capsule v0.2: one small deterministic record per claim, declared vs observed.

("Venturi" is the internal architecture name of this throat only; every public schema string is
csoai.measurement-capsule*.) Whatever the source (a mill card, a registry row, a ledger read),
it is reduced to the same capsule grammar. The underlying evidence stays content-addressed
and is never discarded; the capsule carries only its digests. Measurement only: a capsule
never carries a decision about anyone's action and grants no execution authority.

  venturi_capsule.py build  --adapter NAME --src PATH --out DIR [--aux PATH]
                                                    # capsules.jsonl.gz + record.json from any adapter in adapters/
  venturi_capsule.py sign   --out DIR | --file F    # board-sign record.json / an index (did:web:csoai.org#board-attestation-1)
  venturi_capsule.py ots    --out DIR | --file F    # OpenTimestamps calendar commitment
  venturi_capsule.py verify --out DIR | --file F    # recompute every capsule id, the Merkle root(s), record sha, signature
  venturi_capsule.py index  --file F --batches DIR... [--pending NAME=why ...]
                                                    # one index + one root over every batch

v0.2 (2026-09-26) versus v0.1:
  * schema strings csoai.measurement-capsule/0.2, csoai.measurement-capsule-batch/0.2,
    csoai.measurement-capsule-index/0.2 (v0.1: csoai.venturi-capsule/0.1, csoai.venturi-capsule-batch/0.1,
    csoai.venturi-index/0.1);
  * Merkle tree hash with RFC 6962 domain separation (MERKLE_V02 below); v0.1 records keep the v0.1 rule;
  * every capsule's bytes must equal its RFC 8785 (JCS) serialisation, or the build fails.
verify reads the record's schema and applies the matching rule.
"""
import argparse, base64, datetime, glob, gzip, hashlib, json, os, pathlib, re, sys, urllib.request

SCHEMA = "csoai.measurement-capsule/0.2"
RECORD_SCHEMA = "csoai.measurement-capsule-batch/0.2"
INDEX_SCHEMA = "csoai.measurement-capsule-index/0.2"
SCHEMA_V01 = "csoai.venturi-capsule/0.1"
RECORD_SCHEMA_V01 = "csoai.venturi-capsule-batch/0.1"
INDEX_SCHEMA_V01 = "csoai.venturi-index/0.1"
UA = {"user-agent": "Mozilla/5.0 csoai-measurement-capsule/0.2"}
MERKLE_V01 = "binary sha256 over sorted capsule_id leaves; odd leaf promoted"
MERKLE_V02 = ("RFC 6962 Merkle Tree Hash over the capsule_id leaves (32 bytes each) sorted ascending: "
              "leaf = SHA-256(0x00 || capsule_id), node = SHA-256(0x01 || left || right); for n > 1 leaves the split is at "
              "k = the largest power of two smaller than n (RFC 6962 section 2.1), so no leaf is promoted or duplicated; "
              "one leaf = its leaf hash; empty = SHA-256 of the empty string")
CANON_RULE = ("JSON, object keys sorted, no insignificant whitespace, UTF-8, non-ASCII unescaped; every capsule's bytes "
              "are checked byte-equal to its RFC 8785 (JCS) serialisation at build and at verify")


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha(b):
    return hashlib.sha256(b).hexdigest()


def capsule_id(c):
    return sha(canon({k: v for k, v in c.items() if k != "capsule_id"}))


def merkle_root_v01(ids):
    """v0.1 rule, kept only to verify v0.1 records. Binary Merkle over sorted leaf ids (hex); odd leaf promoted.
    No domain separation: an interior node can be presented as a leaf. Superseded by merkle_root (v0.2)."""
    level = [bytes.fromhex(i) for i in sorted(ids)]
    if not level:
        return sha(b"")
    while len(level) > 1:
        nxt = []
        for i in range(0, len(level), 2):
            nxt.append(hashlib.sha256(level[i] + level[i + 1]).digest() if i + 1 < len(level) else level[i])
        level = nxt
    return level[0].hex()


def _mth(leaves, lo, hi):
    n = hi - lo
    if n == 1:
        return hashlib.sha256(b"\x00" + leaves[lo]).digest()
    k = 1
    while k * 2 < n:
        k *= 2
    return hashlib.sha256(b"\x01" + _mth(leaves, lo, lo + k) + _mth(leaves, lo + k, hi)).digest()


def merkle_root(ids):
    """v0.2 rule (MERKLE_V02): RFC 6962 Merkle Tree Hash over the sorted 32-byte capsule_id leaves.
    Ordering is not change: leaves are sorted. A leaf of any other length is refused."""
    leaves = [bytes.fromhex(i) for i in sorted(ids)]
    if any(len(x) != 32 for x in leaves):
        raise ValueError("a leaf must be a 32-byte capsule_id")
    if not leaves:
        return sha(b"")
    return _mth(leaves, 0, len(leaves)).hex()


def jcs_divergence(c, b=None):
    """None if canon(c) is byte-equal to RFC 8785 (JCS) of c, else a short reason. Needs the rfc8785 package."""
    import rfc8785
    b = canon(c) if b is None else b
    try:
        j = rfc8785.dumps(c)
    except Exception as e:
        return f"JCS refuses the value: {type(e).__name__}: {str(e)[:120]}"
    return None if j == b else f"bytes differ from JCS (canon {len(b)} B, jcs {len(j)} B)"


def jcs_checker_id():
    import rfc8785, importlib.metadata
    return f"rfc8785 {importlib.metadata.version('rfc8785')} (independent RFC 8785 implementation)"


def state_of(n_items, grade_equal, aggregate_equal):
    if grade_equal == n_items:
        return "REPRODUCED_ITEMWISE"
    if aggregate_equal:
        return "REPRODUCED_AGGREGATE_ONLY"
    return "NOT_REPRODUCED"


def capsule_from_mill_decl(d, observed_at):
    base = d["baseline_runtime"]["runs"][0]
    par = d["parity"]["per_item_cross_hardware"]
    rt = d["runtime"]
    diff_ids = sorted(x["item_id"] for x in par["differing_items"] if x["rtx3090"].get("grade") != x["t4"].get("grade"))
    raw_diff = sorted(x["item_id"] for x in par["differing_items"])
    agg_eq = bool(d["parity"]["aggregate_equal_to_3090"])
    c = {
        "schema": SCHEMA,
        "kind": "measurement.cross_runtime_reproduction",
        "subject_id": d["subject"],
        "claim": {"axis": d["axis"], "card_id": d["card_id"], "card_file": d["card_file"],
                  "statement": "the signed card's result is a property of model + instrument + bank, independent of the runtime it ran on"},
        "declared": {"runtime": "rtx3090 (pod fpowppss5ngtkw)", "run_id": base.get("run_id"), "counts": base["counts"],
                     "accuracy": base.get("accuracy"), "bundle_sha256": base.get("bundle_sha256")},
        "observed": {"runtime": "kaggle 2xT4", "run_id": d["run_id"], "counts": d["counts"], "accuracy": d["accuracy"],
                     "intake_bundle_sha256": d["intake_bundle_sha256"]},
        "differential": {"n_items": par["n_items"], "grade_equal_items": par["grade_equal"],
                         "grade_differing_item_ids": diff_ids, "raw_output_differing_item_ids": raw_diff,
                         "aggregate_equal": agg_eq},
        "sources": {"instrument_sha256": d["instrument_sha256"], "bank_sha256": rt.get("bank_sha256"),
                    "model_manifest_sha256": rt.get("model_manifest_file_sha256"), "items_sha256": d["items_sha256"],
                    "per_item_results_sha256": d["per_item_results_sha256"], "code_commit": rt.get("code_commit")},
        "runtime_observed": {k: rt.get(k) for k in ("gpu", "cuda_driver", "docker_image", "ollama", "decode") if k in rt},
        "runtime_declared": {"ollama": d["baseline_runtime"].get("ollama"), "driver": d["baseline_runtime"].get("driver")},
        "measurement_state": state_of(par["n_items"], par["grade_equal"], agg_eq),
        "authority_state": "NONE: measurement only; this capsule grants and records no execution authority",
        "effect_reference": None,
        "observed_at": observed_at,
        "correction_pointer": None,
        "limitations": [l for l in [
            "3090 ollama version at run time not recorded; client 0.33.0 read on 2026-09-26" if "not separately recorded" in str(d["baseline_runtime"].get("ollama")) else None,
            "3090 GPU driver UNRECORDED" if d["baseline_runtime"].get("driver") == "UNRECORDED" else None,
            "two runtimes only; a third runtime would separate hardware from software-stack effects",
        ] if l],
    }
    c["capsule_id"] = capsule_id(c)
    return c




AUTHORITY_STATE = "NONE: measurement only; this capsule grants and records no execution authority"
# Keys and values a capsule may never carry: a capsule measures; it never decides, admits or authorises.
FORBIDDEN_KEYS = {"decision", "decisions", "decided", "allow", "allowed", "allowlist", "hold", "held", "reject", "rejection",
                  "approve", "approved", "approval", "admit", "admitted", "admission", "authority", "authorisation",
                  "authorization", "authorized_action", "permit", "permitted", "permission", "grant", "granted",
                  "enforce", "enforcement", "action", "recommended_action", "gate", "gate_result"}
FORBIDDEN_VALUES = {"ALLOW", "HOLD", "REJECT", "DENY", "APPROVE", "APPROVED", "ADMIT", "ADMITTED", "BLOCK", "PERMIT", "GRANT"}
DIGEST_RE = re.compile(r"^(sha256:)?[0-9a-f]{40,128}$")
TOP_KEYS_OK = {"authority_state"}


def authority_violations(o, path="", top=True):
    """Every place a capsule carries a decision/authority key or an ALLOW/HOLD/REJECT-style value."""
    out = []
    if isinstance(o, dict):
        for k, v in o.items():
            if not (top and k in TOP_KEYS_OK) and str(k).lower() in FORBIDDEN_KEYS:
                out.append(f"{path}/{k} (key)")
            out += authority_violations(v, f"{path}/{k}", False)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            out += authority_violations(v, f"{path}[{i}]", False)
    elif isinstance(o, str) and o.strip().upper() == o.strip() and o.strip() in FORBIDDEN_VALUES:
        out.append(f"{path}={o!r} (value)")
    return out


def non_digest_sources(o, path="sources"):
    """sources carries digests only (the evidence stays content-addressed where it already lives)."""
    out = []
    if isinstance(o, dict):
        for k, v in o.items():
            out += non_digest_sources(v, f"{path}/{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            out += non_digest_sources(v, f"{path}[{i}]")
    elif o is not None and not (isinstance(o, str) and DIGEST_RE.match(o)):
        out.append(f"{path}={str(o)[:60]!r}")
    return out


def make_capsule(kind, subject_id, claim, declared, observed, differential, sources, measurement_state, limitations,
                 observed_at, correction_pointer=None, effect_reference=None, runtime_declared=None, runtime_observed=None):
    """The one generic constructor every adapter goes through. Refuses authority fields and non-digest sources."""
    c = {"schema": SCHEMA, "kind": kind, "subject_id": subject_id, "claim": claim, "declared": declared,
         "observed": observed, "differential": differential, "sources": sources,
         "measurement_state": measurement_state, "authority_state": AUTHORITY_STATE,
         "effect_reference": effect_reference, "observed_at": observed_at,
         "correction_pointer": correction_pointer, "limitations": [l for l in limitations if l]}
    if runtime_declared is not None:
        c["runtime_declared"] = runtime_declared
    if runtime_observed is not None:
        c["runtime_observed"] = runtime_observed
    bad = authority_violations(c)
    if bad:
        raise ValueError(f"AUTHORITY_FIELD_REFUSED {bad[:5]}")
    bad = non_digest_sources(sources)
    if bad:
        raise ValueError(f"NON_DIGEST_SOURCE_REFUSED {bad[:5]}")
    if not isinstance(measurement_state, str) or not measurement_state:
        raise ValueError("measurement_state must be a non-empty string")
    c["capsule_id"] = capsule_id(c)
    return c


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def file_sha(p, chunk=1 << 20):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(chunk), b""):
            h.update(b)
    return h.hexdigest()


_DID_KEY = []


def did_key_cached():
    if not _DID_KEY:
        _DID_KEY.append(did_key())
    return _DID_KEY[0]


def verify_sidecar(record_path, signed_path):
    """A source record's own signature, checked the way its verify field says. Returns a small state dict."""
    record_path, signed_path = pathlib.Path(record_path), pathlib.Path(signed_path)
    if not signed_path.exists():
        return {"state": "ABSENT"}
    s = json.loads(signed_path.read_text())
    c = canon(s["payload"])
    if sha(c) != s["signature"]["payload_sha256"]:
        return {"state": "FAILS", "why": "payload sha256 != signature.payload_sha256"}
    if s["payload"]["artifact"]["sha256"] != file_sha(record_path):
        return {"state": "FAILS", "why": "payload does not pin these record bytes"}
    try:
        did_key_cached().verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
    except Exception:
        return {"state": "FAILS", "why": "Ed25519 signature does not verify"}
    return {"state": "VERIFIES", "payload_sha256": sha(c), "did": s["signature"].get("did"),
            "signed_at": s["signature"].get("signed_at")}


def write_batch(out, adapter, kind, caps, meta):
    """capsules.jsonl.gz (deterministic gzip, sorted by capsule_id) + record.json. Holds only (id, bytes) pairs."""
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    items, states = [], {}
    for c in caps:
        if c["kind"] != kind:
            raise ValueError(f"adapter {adapter} emitted kind {c['kind']} != {kind}")
        b = canon(c)
        why = jcs_divergence(c, b)
        if why:
            raise SystemExit(f"JCS_DIVERGENCE {adapter} {c['capsule_id']}: {why}")
        items.append((c["capsule_id"], b))
        states[c["measurement_state"]] = states.get(c["measurement_state"], 0) + 1
    if not items:
        sys.exit(f"NO_INPUT: adapter {adapter} produced no capsules")
    items.sort()
    ids = [i for i, _ in items]
    if len(set(ids)) != len(ids):
        sys.exit(f"DUPLICATE_CAPSULE_IDS in {adapter}: {len(ids) - len(set(ids))}")
    tmp = out / "capsules.jsonl.gz.tmp"
    h, n_bytes = hashlib.sha256(), 0
    with open(tmp, "wb") as f:
        with gzip.GzipFile(filename="", mode="wb", fileobj=f, mtime=0, compresslevel=9) as g:
            for _, b in items:
                g.write(b + b"\n"); h.update(b + b"\n"); n_bytes += len(b) + 1
    os.replace(tmp, out / "capsules.jsonl.gz")
    del items
    built = utcnow()
    rec = {"schema": RECORD_SCHEMA, "as_of": built, "capsule_schema": SCHEMA, "adapter": adapter, "kind": kind,
           "n_capsules": len(ids), "states": dict(sorted(states.items())),
           "merkle_root": merkle_root(ids), "merkle": MERKLE_V02,
           "canonicalisation": {"rule": CANON_RULE, "jcs_byte_equal": f"{len(ids)}/{len(ids)}", "checked_with": jcs_checker_id()},
           "capsules_file": {"path": "capsules.jsonl.gz", "sha256": file_sha(out / "capsules.jsonl.gz"),
                             "bytes": (out / "capsules.jsonl.gz").stat().st_size,
                             "uncompressed_sha256": h.hexdigest(), "uncompressed_bytes": n_bytes,
                             "format": "gzip (mtime 0, no filename, level 9) of canonical JSON lines sorted by capsule_id"},
           "authority_state": AUTHORITY_STATE}
    rec.update(meta() if callable(meta) else meta)  # callable: adapters fill their stats while being consumed
    rec["private_until"] = "owner approves publication"
    (out / "record.json").write_bytes(json.dumps(rec, indent=1, ensure_ascii=False).encode() + b"\n")
    return rec


def build(a):
    import adapters
    mod = adapters.get(a.adapter or "mill_cross_runtime")
    stats = {}
    try:
        caps = mod.capsules(a.src, stats, aux=getattr(a, "aux", None))
        rec = write_batch(a.out, mod.NAME, mod.KIND, caps, lambda: mod.meta(a.src, stats))
    except adapters.PendingSource as e:
        print(json.dumps({"adapter": a.adapter, "state": "PENDING_SOURCE", "why": str(e)}))
        sys.exit(3)
    print(json.dumps({"adapter": rec["adapter"], "n": rec["n_capsules"], "states": rec["states"], "merkle_root": rec["merkle_root"],
                      "gz_bytes": rec["capsules_file"]["bytes"], "raw_bytes": rec["capsules_file"]["uncompressed_bytes"]}))


def did_key():
    did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers=UA), timeout=20))
    from cryptography.hazmat.primitives.asymmetric import ed25519
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    return ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))


def sidecars(a):
    """(file to sign/stamp, signed path, ots path) for a batch dir (--out) or a single JSON file (--file)."""
    if getattr(a, "file", None):
        p = pathlib.Path(a.file)
        return p, p.with_name(p.stem + ".signed.json"), p.with_name(p.name + ".ots")
    out = pathlib.Path(a.out)
    return out / "record.json", out / "record.signed.json", out / "record.json.ots"


def sign_payload(payload, pins, tok_path):
    """POST the payload to /api/board-sign, verify locally, run altered-preimage controls. Token never printed."""
    c = canon(payload)
    if len(c) > 3072:
        raise ValueError(f"PAYLOAD_TOO_LARGE {len(c)}")
    tok = pathlib.Path(os.path.expanduser(tok_path)).read_text().strip()
    req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok, **UA})
    r = json.load(urllib.request.urlopen(req, timeout=40))
    del tok
    assert r["payload_sha256"] == sha(c), "preimage mismatch"
    pk = did_key_cached(); pk.verify(bytes.fromhex(r["sig_ed25519"]), c)
    controls = {}
    alts = [("trailing byte", c + b" ")] + [(name, c.replace(v.encode(), (b"0" if i % 2 == 0 else b"f") * len(v)))
                                            for i, (name, v) in enumerate(pins)]
    for name, alt in alts:
        if alt == c:
            controls[name] = "NOT_APPLIED (pinned value absent from payload)"
            continue
        try:
            pk.verify(bytes.fromhex(r["sig_ed25519"]), alt); controls[name] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            controls[name] = "rejected (control holds)"
    if any("FAILED" in v or "NOT_APPLIED" in v for v in controls.values()):
        sys.exit(f"CONTROL FAILED {controls}")
    return r, controls


def sign(a):
    target, signed_path, _ = sidecars(a)
    raw = target.read_bytes(); rec = json.loads(raw)
    common = {"schema": "csoai.signed-artifact/0.1",
              "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
              "not_a_grade": "The signature proves these bytes were signed by the board key; it does not prove any claim beyond what the capsules' own instruments measured."}
    if rec.get("schema") in (INDEX_SCHEMA_V01, RECORD_SCHEMA_V01):
        sys.exit("v0.1 artifacts are frozen; they are verified, never re-signed")
    if rec.get("schema") == INDEX_SCHEMA:
        payload = dict(common, artifact={"path": "measurement-capsules/v0.2/index.json", "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
                       index_root=rec["index_root"], root_over_batch_merkle_roots=rec["root_over_batch_merkle_roots"],
                       n_batches=len(rec["batches"]), n_capsules_total=rec["n_capsules_total"],
                       batches=[[b["adapter"], b["n_capsules"], b["merkle_root"], b["record_sha256"]] for b in rec["batches"]])
        pins = [("record sha altered", sha(raw)), ("index root altered", rec["index_root"])]
    else:
        path = f"measurement-capsules/v0.2/{rec['adapter']}/record.json"
        payload = dict(common, artifact={"path": path, "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
                       merkle_root=rec["merkle_root"], n_capsules=rec["n_capsules"], states=rec["states"],
                       capsules_sha256=rec["capsules_file"]["sha256"])
        if rec.get("adapter"):
            payload.update(adapter=rec["adapter"], kind=rec["kind"])
        pins = [("record sha altered", sha(raw)), ("merkle root altered", rec["merkle_root"])]
    if len(canon(payload)) > 3072:  # compact payload: pin the record sha (which pins everything else)
        for k in ("batches", "states"):
            payload.pop(k, None)
        payload["compact"] = "payload exceeded 3072 bytes; the record sha256 pins the full content"
    r, controls = sign_payload(payload, pins, a.token)
    doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                         "signed_at": r.get("signed_at")},
           "local_verification": {"result": "VERIFIES", "altered_preimage_controls": controls}}
    signed_path.write_text(json.dumps(doc, indent=1) + "\n")
    print(json.dumps({"verifies": True, "controls": controls, "signed_at": r.get("signed_at"), "payload_bytes": len(canon(payload))}))


def ots(a):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext
    target, _, ots_path = sidecars(a)
    d = hashlib.sha256(target.read_bytes()).digest()
    ts = Timestamp(d); got = []
    for u in ("https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
              "https://finney.calendar.eternitywall.com"):
        try:
            ts.merge(RemoteCalendar(u).submit(d, timeout=30)); got.append(u)
        except Exception:
            pass
    if not got:
        sys.exit("NOT_STAMPED")
    ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
    ots_path.write_bytes(ctx.getbytes())
    print(json.dumps({"calendars": len(got), "state": "PENDING_CALENDAR_COMMITMENT (not yet a Bitcoin attestation)"}))


def ots_state(target, ots_path):
    """Parse a detached .ots: does it bind to the file's sha256, and what attestations does it carry?"""
    if not pathlib.Path(ots_path).exists():
        return {"state": "NOT_STAMPED"}
    from opentimestamps.core.timestamp import DetachedTimestampFile
    from opentimestamps.core.serialize import BytesDeserializationContext
    dt = DetachedTimestampFile.deserialize(BytesDeserializationContext(pathlib.Path(ots_path).read_bytes()))
    binds = dt.file_digest == hashlib.sha256(pathlib.Path(target).read_bytes()).digest()
    atts = sorted(type(att).__name__ for _, att in dt.timestamp.all_attestations())
    state = ("BITCOIN_ATTESTED" if any(x == "BitcoinBlockHeaderAttestation" for x in atts)
             else "PENDING_CALENDAR_COMMITMENT" if atts else "NO_ATTESTATION")
    return {"state": state if binds else "DOES_NOT_BIND", "binds_to_file_sha256": binds,
            "attestations": {x: atts.count(x) for x in sorted(set(atts))}, "ots_sha256": file_sha(ots_path)}


def iter_capsule_lines(out, rec):
    """Stream the capsules file of a batch; yields (line bytes). Checks the file sha256 first."""
    p = pathlib.Path(out) / rec["capsules_file"]["path"]
    assert file_sha(p) == rec["capsules_file"]["sha256"], "capsules file sha mismatch"
    if p.suffix == ".gz":
        with gzip.open(p, "rb") as g:
            for l in g:
                yield l
    else:
        with open(p, "rb") as f:
            for l in f:
                yield l


def verify_batch(out, check_signature=True):
    out = pathlib.Path(out)
    raw = (out / "record.json").read_bytes(); rec = json.loads(raw)
    if rec["schema"] == RECORD_SCHEMA_V01:
        root_fn, jcs = merkle_root_v01, False
    elif rec["schema"] == RECORD_SCHEMA:
        root_fn, jcs = merkle_root, True
    else:
        raise AssertionError(f"unknown batch schema {rec['schema']}")
    ids, bad, auth_bad, jcs_bad, h, n_raw = [], [], [], [], hashlib.sha256(), 0
    for l in iter_capsule_lines(out, rec):
        h.update(l); n_raw += len(l)
        if not l.strip():
            continue
        c = json.loads(l)
        if jcs and jcs_divergence(c, l.rstrip(b"\n")):
            jcs_bad.append(c["capsule_id"])
        if capsule_id(c) != c["capsule_id"]:
            bad.append(c["capsule_id"])
        if authority_violations(c):
            auth_bad.append(c["capsule_id"])
        ids.append(c["capsule_id"])
    assert not bad, f"capsule id mismatch {bad[:5]}"
    assert not auth_bad, f"authority field in capsules {auth_bad[:5]}"
    assert not jcs_bad, f"capsule bytes differ from JCS {jcs_bad[:5]}"
    if "uncompressed_sha256" in rec["capsules_file"]:
        assert h.hexdigest() == rec["capsules_file"]["uncompressed_sha256"], "uncompressed sha mismatch"
    assert len(ids) == rec["n_capsules"], "n_capsules mismatch"
    assert ids == sorted(ids), "capsules file not sorted by capsule_id"
    assert root_fn(ids) == rec["merkle_root"], "merkle root mismatch"
    res = {"schema": rec["schema"], "capsules": len(ids), "ids": "all recompute",
           "merkle_root": f"recomputes ({'v0.1 rule' if root_fn is merkle_root_v01 else 'v0.2 RFC 6962 rule'})",
           "record_sha256": sha(raw), "no_authority_fields": True}
    if jcs:
        res["jcs_byte_equal"] = f"{len(ids)}/{len(ids)}"
    sf = out / "record.signed.json"
    if check_signature and sf.exists():
        s = json.loads(sf.read_text())
        assert s["payload"]["artifact"]["sha256"] == sha(raw), "signed payload does not pin this record"
        assert s["payload"]["merkle_root"] == rec["merkle_root"], "signed payload merkle root differs"
        did_key_cached().verify(bytes.fromhex(s["signature"]["sig_ed25519"]), canon(s["payload"]))
        res["signature"] = "VERIFIES under did:web:csoai.org#board-attestation-1"
    elif check_signature:
        res["signature"] = "UNSIGNED"
    res["ots"] = ots_state(out / "record.json", out / "record.json.ots")["state"]
    return res, rec, ids


def verify(a):
    if getattr(a, "file", None):
        return verify_index(a)
    res, _, _ = verify_batch(a.out)
    print(json.dumps(res))


def index(a):
    batches, all_ids, roots = [], [], []
    for d in a.batches:
        res, rec, ids = verify_batch(d)
        if rec["schema"] != RECORD_SCHEMA:
            sys.exit(f"index v0.2 takes v0.2 batches only: {d} is {rec['schema']}")
        sig = res.get("signature", "UNSIGNED")
        o = ots_state(pathlib.Path(d) / "record.json", pathlib.Path(d) / "record.json.ots")
        batches.append({"dir": str(pathlib.Path(d).resolve()), "adapter": rec.get("adapter", "mill_cross_runtime"),
                        "kind": rec.get("kind", "measurement.cross_runtime_reproduction"), "n_capsules": rec["n_capsules"],
                        "states": rec["states"], "merkle_root": rec["merkle_root"], "record_sha256": res["record_sha256"],
                        "capsules_sha256": rec["capsules_file"]["sha256"],
                        "signature_state": "VERIFIES" if sig.startswith("VERIFIES") else sig,
                        "signed_at": (json.loads((pathlib.Path(d) / "record.signed.json").read_text())["signature"].get("signed_at")
                                      if sig.startswith("VERIFIES") else None),
                        "ots_state": o["state"], "ots_attestations": o.get("attestations"),
                        "source": rec.get("source")})
        all_ids += ids
        roots.append(rec["merkle_root"])
    if len(set(all_ids)) != len(all_ids):
        sys.exit("DUPLICATE capsule ids across batches")
    doc = {"schema": INDEX_SCHEMA, "as_of": utcnow(),
           "what_this_is": "One index over every signed measurement-capsule batch: each batch's own Merkle root, record sha256, signature and OTS state, and one root over all of them.",
           "what_this_is_not": "Not a grade, ranking, admission or approval of anything. The capsules measure declared vs observed; this index only binds them together.",
           "authority_state": AUTHORITY_STATE,
           "batches": sorted(batches, key=lambda b: b["adapter"]),
           "n_capsules_total": len(all_ids),
           "index_root": merkle_root(all_ids),
           "index_root_rule": "the batch rule (merkle) over the sorted capsule_id leaves of ALL batches together",
           "merkle": MERKLE_V02, "capsule_schema": SCHEMA, "batch_schema": RECORD_SCHEMA,
           "root_over_batch_merkle_roots": merkle_root(roots),
           "pending_source": [dict(zip(("adapter", "why"), p.split("=", 1))) for p in (a.pending or [])],
           "verify": "for each batch: recompute every capsule_id and the batch Merkle root, check record sha256 and its board signature; "
                     "then recompute index_root over the union of capsule ids; the index itself is signed (.signed.json) and OTS-stamped (.json.ots)",
           "private_until": "owner approves publication"}
    pathlib.Path(a.file).write_bytes(json.dumps(doc, indent=1, ensure_ascii=False).encode() + b"\n")
    print(json.dumps({"batches": len(batches), "n_capsules_total": len(all_ids), "index_root": doc["index_root"]}))


def verify_index(a):
    p = pathlib.Path(a.file)
    raw = p.read_bytes(); doc = json.loads(raw)
    root_fn = merkle_root_v01 if doc["schema"] == INDEX_SCHEMA_V01 else merkle_root
    all_ids = []
    for b in doc["batches"]:
        res, rec, ids = verify_batch(b["dir"])
        assert res["record_sha256"] == b["record_sha256"] and rec["merkle_root"] == b["merkle_root"], f"batch changed: {b['adapter']}"
        all_ids += ids
    assert root_fn(all_ids) == doc["index_root"], "index root mismatch"
    res = {"batches": len(doc["batches"]), "n_capsules_total": len(all_ids), "index_root": "recomputes", "index_sha256": sha(raw)}
    _, sf, of = sidecars(a)
    if sf.exists():
        s = json.loads(sf.read_text())
        assert s["payload"]["artifact"]["sha256"] == sha(raw), "signed payload does not pin this index"
        did_key_cached().verify(bytes.fromhex(s["signature"]["sig_ed25519"]), canon(s["payload"]))
        res["signature"] = "VERIFIES under did:web:csoai.org#board-attestation-1"
    res["ots"] = ots_state(p, of)["state"]
    print(json.dumps(res))


if __name__ == "__main__":
    p = argparse.ArgumentParser(); sp = p.add_subparsers(dest="cmd", required=True)
    for n in ("build", "sign", "ots", "verify"):
        q = sp.add_parser(n)
        if n == "build":
            q.add_argument("--out", required=True)
            q.add_argument("--src", required=True)
            q.add_argument("--adapter", default=None, help="adapter name (see adapters/); omitted = mill_cross_runtime")
            q.add_argument("--aux", default=None, help="adapter-specific auxiliary input")
        else:
            g = q.add_mutually_exclusive_group(required=True)
            g.add_argument("--out"); g.add_argument("--file")
        if n == "sign": q.add_argument("--token", default="~/.secrets/board-sign-pod-token")
    q = sp.add_parser("index"); q.add_argument("--file", required=True); q.add_argument("--batches", nargs="+", required=True)
    q.add_argument("--pending", nargs="*", help="ADAPTER=why for adapters with no source yet")
    a = p.parse_args(); {"build": build, "sign": sign, "ots": ots, "verify": verify, "index": index}[a.cmd](a)
