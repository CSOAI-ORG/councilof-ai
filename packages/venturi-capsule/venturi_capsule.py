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
                                [--token FILE | --token github-oidc]   # caller: a static token file, or the Actions job's OIDC token
  venturi_capsule.py ots    --out DIR | --file F    # OpenTimestamps calendar commitment
  venturi_capsule.py verify --out DIR | --file F    # recompute every capsule id, the Merkle root(s), record sha, signature
  venturi_capsule.py index  --file F --batches DIR... [--pending NAME=why ...] [--date D] [--prev auto|none|PATH]
                             [--supersedes OLD_INDEX --supersedes-now-at PATH]
                                                    # one index + one root over every batch, chained to the previous day
  venturi_capsule.py verify-chain [--dir /evac-bulk] [--deep] [--bitcoin]
                                                    # walk every daily index back to genesis (see chain.py)
  venturi_capsule.py chain-genesis --file INDEX     # the signed genesis record for a pre-chain (0.2) index
  venturi_capsule.py chain-head --date D [--dir /evac-bulk]
                                                    # the weekly signed chain-head record + prepared (unsubmitted) anchors

v0.2 (2026-09-26) versus v0.1:
  * schema strings csoai.measurement-capsule/0.2, csoai.measurement-capsule-batch/0.2,
    csoai.measurement-capsule-index/0.2 (v0.1: csoai.venturi-capsule/0.1, csoai.venturi-capsule-batch/0.1,
    csoai.venturi-index/0.1);
  * Merkle tree hash with RFC 6962 domain separation (MERKLE_V02 below); v0.1 records keep the v0.1 rule;
  * every capsule's bytes must equal its RFC 8785 (JCS) serialisation, or the build fails.
verify reads the record's schema and applies the matching rule.

capsule 0.3 (2026-09-27, proposed): one OPTIONAL field, provisions, binds a capsule to entries of the frozen provision
manifest (https://councilof.ai/interop/frozen-provision-hashes.json): [{provision_id, provision_sha256, corpus_root,
relation}], relation PREDICATE (the capsule's check tests an observable the provision names) or RELEVANT_TO (an
informative pointer). A capsule with provisions carries schema csoai.measurement-capsule/0.3; a capsule without it is
byte-for-byte the v0.2 capsule it always was (schema 0.2, no provisions key), so every v0.2 batch, index and verifier is
unchanged. Same capsule_id rule, same JCS rule, same Merkle rule; a batch may hold both. A binding says which frozen text
a measurement concerns. It never says that anything complies with it.

index 0.3 (2026-09-26): the daily index is hash-chained. Each day's index commits to the final version of the
previous day's index (prev_date, prev_index_sha256, prev_index_root), states gap_days (calendar days with no index
between the two) and, when it re-issues a day, the version it supersedes. The chain starts at the 2026-09-26 index
(schema 0.2, bytes unchanged), pinned by a signed genesis record. chain.py holds the chain verifier.
"""
import argparse, base64, datetime, glob, gzip, hashlib, json, os, pathlib, re, sys, urllib.parse, urllib.request
# The committed capsule-provision map and frozen manifest (module provision_binding.py). Imported under another name
# because this module's own provision_binding(manifest, pairs) builds a provisions field from (id, relation) pairs.
# The sibling module is found from this file's own folder, so loading this client by path (scripts/daily-report
# loads it with importlib.util.spec_from_file_location) works as well as running it from its folder.
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)
import provision_binding as provision_files

SCHEMA = "csoai.measurement-capsule/0.2"
SCHEMA_V03 = "csoai.measurement-capsule/0.3"  # 0.2 + the optional provisions binding (only when present)
CAPSULE_SCHEMAS = (SCHEMA, SCHEMA_V03)  # capsule schemas a 0.2 batch may carry
PROVISION_RELATIONS = ("PREDICATE", "RELEVANT_TO")
PROVISION_KEYS = ("corpus_root", "provision_id", "provision_sha256", "relation")
PROVISION_ID_RE = re.compile(r"^3\d{4}[RLD]\d{4}:-?\d+$")
HEX64_RE = re.compile(r"^[0-9a-f]{64}$")
RECORD_SCHEMA = "csoai.measurement-capsule-batch/0.2"
INDEX_SCHEMA = "csoai.measurement-capsule-index/0.3"
INDEX_SCHEMA_V02 = "csoai.measurement-capsule-index/0.2"
SCHEMA_V01 = "csoai.venturi-capsule/0.1"
RECORD_SCHEMA_V01 = "csoai.venturi-capsule-batch/0.1"
INDEX_SCHEMA_V01 = "csoai.venturi-index/0.1"
INDEX_SCHEMAS = (INDEX_SCHEMA, INDEX_SCHEMA_V02, INDEX_SCHEMA_V01)
CHAIN_GENESIS_SCHEMA = "csoai.measurement-index-chain-genesis/0.1"
CHAIN_HEAD_SCHEMA = "csoai.measurement-index-chain-head/0.1"
PUBLICATION_SCHEMA = "csoai.measurement-publication/0.1"
PUBLICATION_ERRATUM_SCHEMA = "csoai.measurement-publication-erratum/0.1"
# the owner's recorded approval to publish the daily index (the same file gates the public HF copy)
PUBLICATION_APPROVAL_FILE = "~/.config/csoai/approvals/measurement-index-hf-publish.APPROVED"
# the chain fields of an index 0.3 (and of the genesis record); all are also copied into the signed payload
CHAIN_KEYS = ("date", "chain_seq", "prev_date", "prev_index_sha256", "prev_index_root", "gap_days")
INDEX_NAME_RE = re.compile(r"^measurement-index-v0\.2-(\d{4}-\d{2}-\d{2})\.json$")
CHAIN_RULE = ("each day's index names the FINAL version of the previous day's index on disk "
              "(measurement-index-v0.2-<prev_date>.json): prev_index_sha256 = sha256 of its bytes, prev_index_root = its index_root; "
              "gap_days = calendar days strictly between prev_date and date that have no index (0 = consecutive); "
              "a re-issue of a day names the version it replaces in supersedes; the first day (genesis) has prev = null")
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


# the reproduction side's key in differing_items -> the observed runtime label (a declaration names its own side)
OBSERVED_RUNTIME_LABEL = {"t4": "kaggle 2xT4", "p100": "kaggle 1xP100"}
THREE_WAY_STATES = ("REPRODUCED_3_RUNTIMES", "REPRODUCED_2_OF_3", "NOT_REPRODUCED")


def repro_side(d):
    """'t4' for every declaration written before the third runtime; a declaration with parity.three_way_item_level
    names its side in the differing items (e.g. 'p100'), else by its three-way runtimes map."""
    par = d["parity"]["per_item_cross_hardware"]
    for x in par["differing_items"]:
        for k in x:
            if k not in ("item_id", "sequence", "rtx3090"):
                return k
    tw = d["parity"].get("three_way_item_level")
    return "p100" if tw else "t4"


def capsule_from_mill_decl(d, observed_at):
    base = d["baseline_runtime"]["runs"][0]
    par = d["parity"]["per_item_cross_hardware"]
    rt = d["runtime"]
    side = repro_side(d)
    diff_ids = sorted(x["item_id"] for x in par["differing_items"] if x["rtx3090"].get("grade") != x[side].get("grade"))
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
        "observed": {"runtime": OBSERVED_RUNTIME_LABEL.get(side, side), "run_id": d["run_id"], "counts": d["counts"], "accuracy": d["accuracy"],
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
    tw = d["parity"].get("three_way_item_level")
    if tw:  # a third runtime: the capsule's state is the three-way item-level agreement (3090 vs T4 vs this runtime)
        if tw["state"] not in THREE_WAY_STATES:
            raise ValueError(f"unknown three-way state {tw['state']!r}")
        c["differential"]["three_way"] = {
            "runtimes": sorted(tw["runtimes"]), "state": tw["state"], "differing_runtime": tw["differing_runtime"],
            "n_items": tw["n_items"], "grade_equal_all_three": tw["grade_equal_all_three"],
            "raw_output_equal_all_three": tw["raw_output_equal_all_three"], "counts_equal_all_three": tw["counts_equal_all_three"],
            "grade_differing_items": [{"item_id": x["item_id"], "differs": x["differs"], "grades": x["grades"]}
                                      for x in tw["grade_differing_items"]]}
        c["sources"]["t4_per_item_results_sha256"] = tw["t4_declaration"]["per_item_results_sha256"]
        c["sources"]["t4_declaration_sha256"] = tw["t4_declaration"]["sha256"]
        c["measurement_state"] = tw["state"]
        c["limitations"] = [l for l in c["limitations"] if not l.startswith("two runtimes only")] + [
            "three runtimes (Ampere, Turing, Pascal) that also differ in software stack (CUDA library build, driver, ollama's "
            "VRAM-based default context; see runtime_observed); agreement across them is evidence of runtime independence, "
            "a difference is not attributed to hardware alone"]
        for k in ("ollama_gpu_backend", "ollama_default_context", "model_residency"):
            if rt.get(k) is not None:
                c["runtime_observed"][k] = rt[k]
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


def corpus_root_of(anchors):
    """The frozen manifest's root: sha256 over the concatenation of sorted (provision_id + provision_sha256)."""
    return sha("".join(k + anchors[k] for k in sorted(anchors)).encode())


def load_provision_manifest(path):
    """Read the frozen provision manifest and refuse it unless its corpus_root recomputes."""
    m = json.loads(pathlib.Path(path).read_bytes())
    anchors = m.get("anchors") or {}
    if len(anchors) != m.get("provisions"):
        raise ValueError(f"PROVISION_MANIFEST_COUNT {len(anchors)} anchors vs provisions={m.get('provisions')}")
    if corpus_root_of(anchors) != m.get("corpus_root"):
        raise ValueError("PROVISION_MANIFEST_ROOT_MISMATCH")
    return m


def provision_binding(manifest, pairs):
    """[(provision_id, relation)] -> the provisions field, each entry pinned to the manifest's hash and root."""
    out = []
    for pid, rel in pairs:
        h = manifest["anchors"].get(pid)
        if h is None:
            raise ValueError(f"PROVISION_NOT_IN_MANIFEST {pid}")
        out.append({"corpus_root": manifest["corpus_root"], "provision_id": pid, "provision_sha256": h, "relation": rel})
    return out


def provision_violations(provisions):
    """Everything wrong with a provisions field (empty list = well formed). Structure only; the manifest check is
    provision_binding's job at build, and a verifier's who holds the manifest."""
    if not isinstance(provisions, list) or not provisions:
        return ["provisions must be a non-empty list"]
    bad, seen = [], set()
    for i, e in enumerate(provisions):
        if not isinstance(e, dict) or tuple(sorted(e)) != PROVISION_KEYS:
            bad.append(f"provisions[{i}] keys must be exactly {PROVISION_KEYS}")
            continue
        if not PROVISION_ID_RE.match(str(e["provision_id"])):
            bad.append(f"provisions[{i}].provision_id {e['provision_id']!r} is not CELEX:number")
        for k in ("provision_sha256", "corpus_root"):
            if not HEX64_RE.match(str(e[k])):
                bad.append(f"provisions[{i}].{k} is not sha256 hex")
        if e["relation"] not in PROVISION_RELATIONS:
            bad.append(f"provisions[{i}].relation {e['relation']!r} not in {PROVISION_RELATIONS}")
        key = (e["provision_id"], e["relation"])
        if key in seen:
            bad.append(f"provisions[{i}] duplicates {key}")
        seen.add(key)
    if len({e.get("corpus_root") for e in provisions if isinstance(e, dict)}) > 1:
        bad.append("provisions name more than one corpus_root")
    return bad


def make_capsule(kind, subject_id, claim, declared, observed, differential, sources, measurement_state, limitations,
                 observed_at, correction_pointer=None, effect_reference=None, runtime_declared=None, runtime_observed=None,
                 provisions=None):
    """The one generic constructor every adapter goes through. Refuses authority fields and non-digest sources.
    provisions (optional, capsule 0.3): see provision_binding. Omitted, the capsule is exactly the v0.2 capsule.
    When the committed frozen manifest is present, every row must also be pinned to it. Adapters do not pass it:
    write_batch binds from the committed capsule-provision map."""
    c = {"schema": SCHEMA, "kind": kind, "subject_id": subject_id, "claim": claim, "declared": declared,
         "observed": observed, "differential": differential, "sources": sources,
         "measurement_state": measurement_state, "authority_state": AUTHORITY_STATE,
         "effect_reference": effect_reference, "observed_at": observed_at,
         "correction_pointer": correction_pointer, "limitations": [l for l in limitations if l]}
    if runtime_declared is not None:
        c["runtime_declared"] = runtime_declared
    if runtime_observed is not None:
        c["runtime_observed"] = runtime_observed
    if provisions is not None:
        bad = provision_violations(provisions)
        if bad:
            raise ValueError(f"PROVISIONS_REFUSED {bad[:5]}")
        c["schema"] = SCHEMA_V03
        c["provisions"] = sorted(provisions, key=lambda e: (e["provision_id"], e["relation"]))
        _, manifest = provision_files.load()
        if manifest is not None:
            state, problems = provision_files.check_binding(c["provisions"], c["schema"], manifest)
            if state != "PINNED":
                raise ValueError(f"PROVISION_BINDING_{state} {problems[:3]}")
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


def bind_capsule(c, bindings, manifest):
    """A new capsule: c with schema 0.3 and the provisions binding, capsule_id recomputed. c itself is not changed.
    Refuses a capsule that already carries a binding and any binding that is not PINNED to the manifest."""
    if "provisions" in c:
        raise ValueError(f"PROVISIONS_ALREADY_BOUND {c.get('capsule_id')}")
    b = dict(c)
    b.pop("capsule_id", None)
    b["schema"] = provision_files.SCHEMA_03
    b["provisions"] = [dict(r) for r in bindings]
    state, problems = provision_files.check_binding(b["provisions"], b["schema"], manifest)
    if state != "PINNED":
        raise ValueError(f"PROVISION_BINDING_{state} {problems[:3]}")
    bad = authority_violations(b)
    if bad:
        raise ValueError(f"AUTHORITY_FIELD_REFUSED {bad[:5]}")
    b["capsule_id"] = capsule_id(b)
    return b


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


def write_batch(out, adapter, kind, caps, meta, provision_map=None):
    """capsules.jsonl.gz (deterministic gzip, sorted by capsule_id) + record.json. Holds only (id, bytes) pairs.
    Every capsule the committed capsule-provision map maps (by adapter, or by kind for a route mapping) is bound
    here, so a new batch of a mapped producer carries provision ids; an unmapped adapter's capsules are unchanged.
    provision_map: (map, manifest) to use instead of the repo's committed files (tests)."""
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    pmap, manifest = provision_map if provision_map is not None else provision_files.load()
    bindings = provision_files.bindings_for(adapter, kind, pmap, manifest)
    items, states, schemas = [], {}, set()
    for c in caps:
        if c["kind"] != kind:
            raise ValueError(f"adapter {adapter} emitted kind {c['kind']} != {kind}")
        if bindings and "provisions" not in c:
            c = bind_capsule(c, bindings, manifest)
        if c.get("schema") not in CAPSULE_SCHEMAS:
            raise ValueError(f"adapter {adapter} emitted capsule schema {c.get('schema')!r}")
        if c["schema"] == SCHEMA_V03:
            bad = provision_violations(c.get("provisions"))
            if bad:
                raise ValueError(f"PROVISIONS_REFUSED {c['capsule_id']}: {bad[:3]}")
        elif "provisions" in c:
            raise ValueError(f"PROVISIONS_REFUSED {c['capsule_id']}: a 0.2 capsule carries no provisions field")
        schemas.add(c["schema"])
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
    # capsule_schema stays the single string it always was for a batch of 0.2 capsules (byte-identical records);
    # a batch holding 0.3 capsules names its schema, or the sorted list when it holds both
    cs = sorted(schemas)
    rec = {"schema": RECORD_SCHEMA, "as_of": built, "capsule_schema": cs[0] if len(cs) == 1 else cs, "adapter": adapter, "kind": kind,
           "n_capsules": len(ids), "states": dict(sorted(states.items())),
           "merkle_root": merkle_root(ids), "merkle": MERKLE_V02,
           "canonicalisation": {"rule": CANON_RULE, "jcs_byte_equal": f"{len(ids)}/{len(ids)}", "checked_with": jcs_checker_id()},
           "capsules_file": {"path": "capsules.jsonl.gz", "sha256": file_sha(out / "capsules.jsonl.gz"),
                             "bytes": (out / "capsules.jsonl.gz").stat().st_size,
                             "uncompressed_sha256": h.hexdigest(), "uncompressed_bytes": n_bytes,
                             "format": "gzip (mtime 0, no filename, level 9) of canonical JSON lines sorted by capsule_id"},
           "authority_state": AUTHORITY_STATE}
    rec.update(meta() if callable(meta) else meta)  # callable: adapters fill their stats while being consumed
    if bindings and SCHEMA_V03 in schemas:  # the map bound this batch's capsules
        rec["provision_binding"] = {
            "map": provision_files.MAP_PATH, "manifest": provision_files.MANIFEST_PATH,
            "corpus_root": manifest["corpus_root"], "provision_ids": sorted({b["provision_id"] for b in bindings}),
            "note": "Each capsule names these provisions of the frozen manifest. Not a finding that the capsule "
                    "measures what a provision requires, and never a compliance determination."}
    pub = publication_state()
    if pub:  # owner approval recorded: the batch record says PUBLIC (was private_until before 27 Sep 2026)
        rec["publication"] = pub
    else:
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


# --token github-oidc (22 Nov 2026): the caller is a GitHub Actions job. The bearer is the job's own short-lived OIDC
# token for this audience, requested from the runner when the signature is requested and held in memory only. The
# board signer admits it only for the workflow files it lists (functions/api/board-sign.ts). Any other --token value is
# the path of a static caller-token file, as on the index host before.
OIDC = "github-oidc"
BOARD_SIGN_URL = "https://councilof.ai/api/board-sign"


def signer_text(tok_path):
    """The `signer` line of a signed payload: names the caller route that really signed it."""
    if tok_path != OIDC:
        return "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)"
    ref = os.environ.get("GITHUB_WORKFLOW_REF", "")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/\.github/workflows/[A-Za-z0-9_.-]+\.ya?ml@refs/[A-Za-z0-9_./-]+", ref):
        sys.exit("NO_OIDC: --token github-oidc runs only inside a GitHub Actions job (GITHUB_WORKFLOW_REF unset or malformed)")
    return f"did:web:csoai.org#board-attestation-1 via POST /api/board-sign (GitHub Actions OIDC, {ref})"


def github_oidc_token(audience=BOARD_SIGN_URL):
    """The job's OIDC token for `audience` (needs `permissions: id-token: write`). Never printed or written."""
    url, req_tok = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL"), os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN")
    if not url or not req_tok:
        sys.exit("NO_OIDC: ACTIONS_ID_TOKEN_REQUEST_URL/TOKEN absent (a job without id-token: write, or not GitHub Actions)")
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(url + sep + "audience=" + urllib.parse.quote(audience, safe=""),
                                 headers={"authorization": "Bearer " + req_tok, "accept": "application/json", **UA})
    tok = json.load(urllib.request.urlopen(req, timeout=30)).get("value") or ""
    if tok.count(".") != 2:
        sys.exit("NO_OIDC: the runner returned no JWT")
    return tok


def sign_payload(payload, pins, tok_path):
    """POST the payload to /api/board-sign, verify locally, run altered-preimage controls. Token never printed."""
    c = canon(payload)
    if len(c) > 3072:
        raise ValueError(f"PAYLOAD_TOO_LARGE {len(c)}")
    tok = github_oidc_token() if tok_path == OIDC else pathlib.Path(os.path.expanduser(tok_path)).read_text().strip()
    req = urllib.request.Request(BOARD_SIGN_URL, data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok, **UA})
    r = json.load(urllib.request.urlopen(req, timeout=40))
    del tok
    assert r["payload_sha256"] == sha(c), "preimage mismatch"
    if tok_path == OIDC and r.get("signer_auth") != "github-oidc":
        sys.exit(f"SIGNER_AUTH_MISMATCH: asked by OIDC, the signer answered signer_auth={r.get('signer_auth')!r}")
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


BATCH_DIR_RE = re.compile(r"^measurement-capsules-v0\.2-(\d{4}-\d{2}-\d{2})-(.+)$")


def artifact_path_for(out_dir):
    """The signed artifact path of a batch: unique per batch directory (a signed batch dir is never reused or overwritten),
    so two batches of one adapter on one day (e.g. mill_cross_runtime and mill_cross_runtime-batch2, or a .r2 revision)
    can never name the same published path."""
    n = pathlib.Path(out_dir).resolve().name
    m = BATCH_DIR_RE.match(n)
    return f"measurement-capsules/v0.2/{m.group(1)}/{m.group(2)}/record.json" if m else f"measurement-capsules/v0.2/unfiled/{n}/record.json"


def sign(a):
    target, signed_path, _ = sidecars(a)
    raw = target.read_bytes(); rec = json.loads(raw)
    common = {"schema": "csoai.signed-artifact/0.1",
              "signer": signer_text(a.token),
              "not_a_grade": "The signature proves these bytes were signed by the board key; it does not prove any claim beyond what the capsules' own instruments measured."}
    if rec.get("schema") in (INDEX_SCHEMA_V01, RECORD_SCHEMA_V01):
        sys.exit("v0.1 artifacts are frozen; they are verified, never re-signed")
    if rec.get("schema") in (INDEX_SCHEMA, INDEX_SCHEMA_V02):
        path = ("measurement-capsules/v0.2/index.json" if rec["schema"] == INDEX_SCHEMA_V02
                else f"measurement-capsules/v0.2/index/{rec['date']}.json")  # 0.3: one signed path per day
        payload = dict(common, artifact={"path": path, "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
                       index_root=rec["index_root"], root_over_batch_merkle_roots=rec["root_over_batch_merkle_roots"],
                       n_batches=len(rec["batches"]), n_capsules_total=rec["n_capsules_total"],
                       batches=[[b["adapter"], b["n_capsules"], b["merkle_root"], b["record_sha256"]] for b in rec["batches"]])
        pins = [("record sha altered", sha(raw)), ("index root altered", rec["index_root"])]
        if rec["schema"] == INDEX_SCHEMA:
            payload["chain"] = {k: rec[k] for k in CHAIN_KEYS}
            payload["chain"]["supersedes_sha256"] = (rec.get("supersedes") or {}).get("sha256")
            if rec.get("prev_index_sha256"):
                pins.append(("prev index sha altered", rec["prev_index_sha256"]))
    elif rec.get("schema") in (CHAIN_GENESIS_SCHEMA, CHAIN_HEAD_SCHEMA, PUBLICATION_SCHEMA, PUBLICATION_ERRATUM_SCHEMA):
        path = ("measurement-capsules/v0.2/chain/genesis.json" if rec["schema"] == CHAIN_GENESIS_SCHEMA
                else f"measurement-capsules/v0.2/publication/{rec['date']}.json" if rec["schema"] == PUBLICATION_SCHEMA
                else f"measurement-capsules/v0.2/publication/{rec['date']}-erratum.json" if rec["schema"] == PUBLICATION_ERRATUM_SCHEMA
                else f"measurement-capsules/v0.2/chain/head-{rec['record_date']}.json")
        payload = dict(common, artifact={"path": path, "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
                       chain={k: rec[k] for k in rec["signed_fields"]})
        pins = [("record sha altered", sha(raw)), ("index sha altered", rec.get("head_index_sha256") or rec["index_sha256"])]
    elif rec.get("schema") != RECORD_SCHEMA:  # a source record signed at its producer (e.g. public-signals)
        if not getattr(a, "artifact_path", None):
            sys.exit(f"SOURCE_RECORD schema {rec.get('schema')!r}: pass --artifact-path (the path the producer publishes it under)")
        as_of = rec.get("as_of") or rec.get("date")
        payload = dict(common, artifact={"path": a.artifact_path, "sha256": sha(raw), "schema": rec.get("schema"), "as_of": as_of},
                       not_a_grade="The signature proves these bytes were signed by the board key; it does not prove any claim beyond what the record's own instruments measured.")
        pins = [("record sha altered", sha(raw)), ("as_of altered" if as_of else "schema altered", as_of or rec.get("schema"))]
    else:
        path = artifact_path_for(a.out)
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
    bound, unpinned, manifest = 0, [], None
    for l in iter_capsule_lines(out, rec):
        h.update(l); n_raw += len(l)
        if not l.strip():
            continue
        c = json.loads(l)
        if jcs and jcs_divergence(c, l.rstrip(b"\n")):
            jcs_bad.append(c["capsule_id"])
        if capsule_id(c) != c["capsule_id"]:
            bad.append(c["capsule_id"])
        if jcs and (c.get("schema") not in CAPSULE_SCHEMAS or
                    (c.get("schema") == SCHEMA_V03 and provision_violations(c.get("provisions"))) or
                    (c.get("schema") == SCHEMA and "provisions" in c)):
            bad.append(c["capsule_id"])
        if authority_violations(c):
            auth_bad.append(c["capsule_id"])
        if "provisions" in c:
            bound += 1
            if manifest is None:
                _, manifest = provision_files.load()
            if manifest is not None:
                state, _ = provision_files.check_binding(c["provisions"], c.get("schema"), manifest)
                if state != "PINNED":
                    unpinned.append(c["capsule_id"])
        ids.append(c["capsule_id"])
    assert not bad, f"capsule id mismatch {bad[:5]}"
    assert not auth_bad, f"authority field in capsules {auth_bad[:5]}"
    assert not jcs_bad, f"capsule bytes differ from JCS {jcs_bad[:5]}"
    assert not unpinned, f"provision binding not pinned to the frozen manifest {unpinned[:5]}"
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
    if bound:
        res["provisions"] = f"{bound}/{len(ids)} capsules bind a provision; " + (
            "every binding PINNED to the frozen manifest" if manifest is not None else "UNCHECKED: frozen manifest absent")
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
        sch = json.loads(pathlib.Path(a.file).read_bytes()).get("schema")
        if sch in (CHAIN_GENESIS_SCHEMA, CHAIN_HEAD_SCHEMA, PUBLICATION_SCHEMA, PUBLICATION_ERRATUM_SCHEMA):
            import chain
            return chain.verify_chain_doc_cli(a)
        return verify_index(a) if sch in INDEX_SCHEMAS else verify_signed_file(a)
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
    link = chain_link(a)
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
    doc.update(link)
    pub = publication_state()
    if pub:  # owner approval recorded: the index says PUBLIC instead of private_until
        doc.pop("private_until", None)
        doc["publication"] = pub
    doc["freshness"] = freshness(batches, doc["date"], doc["pending_source"])
    pathlib.Path(a.file).write_bytes(json.dumps(doc, indent=1, ensure_ascii=False).encode() + b"\n")
    print(json.dumps({"batches": len(batches), "n_capsules_total": len(all_ids), "index_root": doc["index_root"],
                      **{k: doc[k] for k in ("date", "chain_seq", "prev_date", "gap_days")}}))


DAILY_ADAPTERS = ("self_parity", "tool_drift", "cross_ledger", "public_signals", "claim_watch")  # expected to have a new source every day
FRESHNESS_RULE = ("per adapter: FRESH = a batch dated this index's date; NOT_UPDATED = a daily adapter (" + ", ".join(DAILY_ADAPTERS) +
                  ") whose newest batch is older (last_good_date = that batch's date; the older batch is carried); CARRIED = a "
                  "weekly/static adapter or sibling batch included by reference; ABSENT = named in pending_source with no batch")


def freshness(batches, D, pending):
    """Per-adapter freshness of one day's index, from the batch directory dates (not from the plan: what is indexed)."""
    out = {}
    for b in batches:
        m = BATCH_DIR_RE.match(pathlib.Path(b["dir"]).name)
        bd = m.group(1) if m else None
        name = m.group(2).split(".r")[0] if m else b["adapter"]
        if bd == D:
            st = "FRESH"
        elif b["adapter"] in DAILY_ADAPTERS and name == b["adapter"]:
            st = "NOT_UPDATED"
        else:
            st = "CARRIED"
        out[name] = {"state": st, "last_good_date": bd}
    for p in pending or []:
        a = p.get("adapter", "")
        if a in DAILY_ADAPTERS + ("contract_parity", "a2a_card", "mill_cross_runtime") and a not in out:
            out[a] = {"state": "ABSENT", "last_good_date": None}
    return {"rule": FRESHNESS_RULE, "adapters": dict(sorted(out.items())),
            "not_updated": sorted(f"{k}@{x['last_good_date']}" for k, x in out.items() if x["state"] == "NOT_UPDATED")}


def publication_state(approval_file=None):
    """{"state": "PUBLIC", "approved": <date>} when the owner's publication approval is recorded, else None (the index then
    keeps private_until). The approval date is the file's recorded_at (or its mtime)."""
    p = pathlib.Path(os.path.expanduser(approval_file or PUBLICATION_APPROVAL_FILE))
    if not p.is_file():
        return None
    m = re.search(r"recorded_at:\s*(\d{4}-\d{2}-\d{2})", p.read_text(errors="replace"))
    day = m.group(1) if m else datetime.datetime.fromtimestamp(p.stat().st_mtime, datetime.timezone.utc).date().isoformat()
    return {"state": "PUBLIC", "approved": day,
            "note": "published daily by the owner's approval (recorded " + day + "); copies: HF csoai/evidence-index measurement-index/<date>/"}


def index_days(dirpath):
    """{date: path} of the FINAL daily indexes in a directory (superseded versions carry another name)."""
    out = {}
    for p in pathlib.Path(dirpath).iterdir():
        m = INDEX_NAME_RE.match(p.name)
        if m:
            out[m.group(1)] = p
    return dict(sorted(out.items()))


def chain_link(a):
    """The chain fields of a new daily index for date D (see CHAIN_RULE). Refuses when a later day already exists:
    re-issuing or back-filling a day under a chained later day would orphan that day's link (a missed day stays a
    declared gap in the day after it)."""
    f = pathlib.Path(a.file)
    D = getattr(a, "date", None)
    if not D:
        m = re.search(r"(\d{4}-\d{2}-\d{2})", f.name)
        if not m:
            sys.exit(f"CHAIN: no --date and no date in {f.name}")
        D = m.group(1)
    day = datetime.date.fromisoformat(D)
    idx_dir = pathlib.Path(getattr(a, "index_dir", None) or f.parent)
    days = index_days(idx_dir)
    later = [d for d in days if d > D]
    if later:
        sys.exit(f"CHAIN_LATER_DAY_EXISTS: {idx_dir} holds indexes for {later[:3]}; a new index for {D} would not be on the chain")
    prev_arg = getattr(a, "prev", None) or "auto"
    if prev_arg == "none":
        prev = None
    elif prev_arg == "auto":
        earlier = [d for d in days if d < D]
        prev = days[earlier[-1]] if earlier else None
    else:
        prev = pathlib.Path(prev_arg)
    link = {"date": D, "chain_rule": CHAIN_RULE}
    if prev is None:
        link.update(chain_seq=0, prev_date=None, prev_index_sha256=None, prev_index_root=None, gap_days=0, missing_dates=[],
                    genesis=("GENESIS: the first day of this chain; there is no earlier index, so prev_date, prev_index_sha256 "
                             "and prev_index_root are null by construction, not by omission"))
    else:
        raw = prev.read_bytes(); pd = json.loads(raw)
        if pd.get("schema") not in INDEX_SCHEMAS:
            sys.exit(f"CHAIN: {prev} is not a measurement-capsule index ({pd.get('schema')})")
        m = re.search(r"(\d{4}-\d{2}-\d{2})", prev.name)
        p_date = pd.get("date") or (m.group(1) if m else None)
        if not p_date or p_date >= D:
            sys.exit(f"CHAIN: previous index date {p_date} is not before {D}")
        pday = datetime.date.fromisoformat(p_date)
        missing = [(pday + datetime.timedelta(days=i)).isoformat() for i in range(1, (day - pday).days)]
        link.update(chain_seq=int(pd.get("chain_seq", 0)) + 1, prev_date=p_date, prev_index_sha256=sha(raw),
                    prev_index_root=pd["index_root"], gap_days=len(missing), missing_dates=missing, genesis=None)
    sup = getattr(a, "supersedes", None)
    if sup:
        sp = pathlib.Path(sup); sraw = sp.read_bytes(); sd = json.loads(sraw)
        link["supersedes"] = {"sha256": sha(sraw), "index_root": sd.get("index_root"), "as_of": sd.get("as_of"),
                              "schema": sd.get("schema"), "was_at": str(sp),
                              "now_at": getattr(a, "supersedes_now_at", None) or str(sp),
                              "rule": "the same date's previous version; its bytes are kept at now_at, and the chain follows this version"}
    else:
        link["supersedes"] = None
    return link


def verify_signed_file(a):
    """A source record signed at its producer: the sidecar pins these bytes and verifies; OTS state reported."""
    p = pathlib.Path(a.file)
    _, sf, of = sidecars(a)
    s = verify_sidecar(p, sf)
    assert s["state"] == "VERIFIES", f"source record signature {s}"
    print(json.dumps({"file": str(p), "sha256": file_sha(p), "signature": "VERIFIES under did:web:csoai.org#board-attestation-1",
                      "ots": ots_state(p, of)["state"]}))


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
        if n == "sign":
            q.add_argument("--token", default="~/.secrets/board-sign-pod-token",
                           help="a static caller-token file, or github-oidc inside a GitHub Actions job")
            q.add_argument("--artifact-path", default=None, help="for a source record (--file, not a batch or index): its published path")
    q = sp.add_parser("index"); q.add_argument("--file", required=True); q.add_argument("--batches", nargs="+", required=True)
    q.add_argument("--pending", nargs="*", help="ADAPTER=why for adapters with no source yet")
    q.add_argument("--date", default=None, help="the index date (default: the date in --file's name)")
    q.add_argument("--prev", default="auto", help="auto (the newest final index before --date in the same dir) | none (genesis) | PATH")
    q.add_argument("--index-dir", default=None, help="where the daily indexes live (default: --file's dir)")
    q.add_argument("--supersedes", default=None, help="the same date's current index, which this one replaces")
    q.add_argument("--supersedes-now-at", default=None, help="where the replaced index's bytes are moved to")
    sys.modules.setdefault("venturi_capsule", sys.modules[__name__])  # chain.py imports this module: one copy, not two
    import chain
    chain.add_cli(sp)
    a = p.parse_args()
    cmds = {"build": build, "sign": sign, "ots": ots, "verify": verify, "index": index}
    cmds.update(chain.CLI)
    cmds[a.cmd](a)
