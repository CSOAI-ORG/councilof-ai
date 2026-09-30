#!/usr/bin/env python3
"""Prototype: export CSOAI's public signed records as SAFE re-verification records.

    python3 safe_export.py            # fetch (read-only GET) into src/, verify, re-test, write out/
    python3 safe_export.py --offline  # rebuild out/ from the cached src/ bytes only

Target shape: the candidate profile `safe-reverification/0.1-draft`
(schema/safe-reverification-record-v0.1.schema.json). The SAFE RFC itself publishes no
machine-readable schema; out/safe-rfc-fieldmap.json maps each field the RFC text names onto
what these records carry. PROTOTYPE. Not deployed, not submitted, not an Alliance format.

Every record is built from bytes this script read and checks it ran itself:
  * Ed25519 signatures are verified under the key in https://csoai.org/.well-known/did.json,
    fetched at run time, with tamper controls that must be rejected;
  * the signed-receipts/v1 verifier is re-run, pre-fix and post-fix, over the published
    conformance vectors (C-2026-0928-01);
  * the canonicaliser is re-run, pre-fix and post-fix, against node's JSON.stringify as an
    independent RFC 8785 oracle (C-2026-0928-02);
  * disclosure-lag quotes are re-read from the primary source, with a fabricated quote as control.
Needs Python 3.9+, `cryptography`; node for the JCS oracle (else that record is UNMEASURED).
Licence: Apache-2.0.
"""
from __future__ import annotations

import base64, copy, datetime as dt, hashlib, html, importlib.util, json, pathlib, random, re, shutil
import subprocess, sys, urllib.request

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

HERE = pathlib.Path(__file__).resolve().parent
SRC, OUT = HERE / "src", HERE / "out"
OFFLINE = "--offline" in sys.argv
PROFILE = "safe-reverification/0.1-draft"
ISSUER = "did:web:csoai.org"
KEY_ID = "did:web:csoai.org#board-attestation-1"
HF_PARITY = "https://huggingface.co/datasets/csoai/mcp-contract-parity/resolve/557ca3376194917ddc42e2e8dc301e6503fa2c03"
SR = "https://councilof.ai/spec/signed-receipts/v1"
DL = "https://councilof.ai/measurements/disclosure-lag/2026-09-medicare-agent"
FETCH = {
    "did.json": "https://csoai.org/.well-known/did.json",
    "api_corrections": "https://councilof.ai/api/corrections",
    "measurement-capsules_latest.json": "https://councilof.ai/measurement-capsules/latest.json",
    "capsules_index.json": "https://councilof.ai/measurement-capsules/v0.2/index.json",
    "capsules_index.signed.json": "https://councilof.ai/measurement-capsules/v0.2/index.signed.json",
    "dl_medicare_record.json": f"{DL}/record.json",
    "dl_medicare_record.signed.json": f"{DL}/record.signed.json",
    "parity_record.json": f"{HF_PARITY}/record.json",
    "parity_record.v0.1.1.json": f"{HF_PARITY}/record.v0.1.1.json",
    "parity_record.v0.1.2.json": f"{HF_PARITY}/record.v0.1.2.json",
    "parity_record.v0.1.2.signed.json": f"{HF_PARITY}/record.v0.1.2.signed.json",
    "sr_interceptor.py": f"{SR}/interceptor.py",
    "sr_conformance_vectors.json": f"{SR}/conformance/vectors.json",
    "sr_conformance_example-fail-results.json": f"{SR}/conformance/example-fail-results.json",
    "s1.html": "https://www.pm.gov.au/media/press-conference-new-york",
}
# Pre-fix verifier bytes. Cited by C-2026-0928-01/02 at HF csoai/councilof-ai-source@96bf3a07, which
# answered 401 to an anonymous read on 2026-09-28; supplied locally and accepted only at this digest.
PREFIX_SHA = "d908b9e723cf1525218ba943d8b01b94584ba8f1e6dab12e897e25f967b617cb"
NOW = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
READ_AT: dict[str, str] = {}


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def get(name: str) -> bytes:
    p = SRC / name
    if not OFFLINE and name in FETCH:
        req = urllib.request.Request(FETCH[name], headers={"User-Agent": "csoai-safe-export/0.1 (read-only)"})
        with urllib.request.urlopen(req, timeout=60) as r:
            p.write_bytes(r.read())
        READ_AT[name] = NOW
    return p.read_bytes()


def jget(name: str):
    return json.loads(get(name))


def dg(b: bytes) -> dict:
    return {"alg": "sha256", "value": sha(b)}


def board_key() -> bytes:
    did = jget("did.json")
    vm = next(v for v in did["verificationMethod"] if v["id"] == KEY_ID)
    x = vm["publicKeyJwk"]["x"]
    return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))


def ed_ok(pub: bytes, sig_hex: str, msg: bytes) -> bool:
    try:
        Ed25519PublicKey.from_public_bytes(pub).verify(bytes.fromhex(sig_hex), msg)
        return True
    except Exception:  # noqa: BLE001
        return False


def check_signed_run(pub: bytes, signed: dict, artifact: bytes) -> dict:
    """csoai.signed-run/0.1: sha256(canonical payload) == payload_sha256, Ed25519 over the canonical
    payload, payload.artifact.sha256 == sha256(artifact). Three tamper controls must each be rejected."""
    def run(sd, art):
        c = json.dumps(sd["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
        return (sha(c) == sd["signature"]["payload_sha256"] and ed_ok(pub, sd["signature"]["sig_ed25519"], c)
                and sd["payload"]["artifact"]["sha256"] == sha(art))
    ok = run(signed, artifact)
    t1 = copy.deepcopy(signed); t1["payload"]["artifact"]["sha256"] = "0" * 64
    t2 = copy.deepcopy(signed); s = t2["signature"]["sig_ed25519"]; t2["signature"]["sig_ed25519"] = ("1" if s[0] == "0" else "0") + s[1:]
    controls = {"trailing byte on the artifact": run(signed, artifact + b" "),
                "artifact digest zeroed in the payload": run(t1, artifact),
                "one signature nibble changed": run(t2, artifact)}
    return {"verifies": ok, "controls_rejected": sum(not v for v in controls.values()), "controls": len(controls),
            "payload_sha256": signed["signature"]["payload_sha256"], "signed_at": signed["signature"].get("signed_at")}


def check_ledger(pub: bytes, led: dict) -> dict:
    """csoai.corrections/0.1 as its own signature_check.how states it."""
    def run(doc):
        body = {k: v for k, v in doc.items() if k not in doc["signature_check"]["unsigned_wrapper_fields"]}
        cid = sha(json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode())
        att = json.dumps(doc["signature"]["attestation"], sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
        return cid == doc["signature"]["attestation"]["content_id"] == doc["signature"]["id"] and ed_ok(pub, doc["signature"]["signature"], att)
    ok = run(led)
    t = copy.deepcopy(led); t["corrections"][0]["status"] += "."
    return {"verifies": ok, "controls_rejected": int(not run(t)), "controls": 1}


def load_module(path: pathlib.Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def conformance(mod, pre_fix: bool) -> dict:
    """Run a verifier over the 17 core cases. Resolution only through each case's did_documents map.
    The pre-fix code has no three-valued result; it is driven as it was deployed: with a resolver
    when the DID is in the map, integrity-only (no resolver) when it is not."""
    vec = jget("sr_conformance_vectors.json")
    got, miss = {}, []
    for c in vec["cases"]:
        docs = c.get("did_documents") or {}
        if pre_fix:
            kid = ((c["receipt"].get("signature") or {}).get("kid") or "")
            res = (lambda d: docs[d]) if kid.split("#")[0] in docs else None
            ok, reason = mod.verify_receipt(c["receipt"], res)
            r = "VALID" if ok else "INVALID"
        else:
            r, reason = mod.verify_receipt_result(c["receipt"], lambda d: docs.get(d))
        got[c["id"]] = r
        if r != c["expected"]:
            miss.append({"case": c["id"], "expected": c["expected"], "got": r})
    return {"n": len(vec["cases"]), "mismatches": miss}


def kit_rejects(results: dict) -> tuple[int, int]:
    """Negative control: the kit's published pre-fix result file must be scored FAIL."""
    vec = jget("sr_conformance_vectors.json")
    exp = {c["id"]: c["expected"] for c in vec["cases"]}
    bad = [k for k, v in results["results"].items() if exp.get(k) != v]
    return len(bad), len(results["results"])


def jcs_probe(mod) -> dict | None:
    """Canonicalise scalars with the module's _canon and compare with node JSON.stringify
    (ECMAScript Number::toString and string serialisation, as RFC 8785 requires)."""
    if not shutil.which("node"):
        return None
    rnd = random.Random(20260928)
    vals = [2.0, 1e-5, 1e-6, 1e-7, 1.5e-4, 1e16, 1e21, 1e20, 123456789012345680.0, 0.1, -0.0, 5e-324, "\U0001F600", "aé b"]
    vals += [rnd.uniform(-1, 1) * 10 ** rnd.randint(-8, 22) for _ in range(2000)]
    oracle = json.loads(subprocess.run(["node", "-e", "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{"
                                        "const v=JSON.parse(s);console.log(JSON.stringify(v.map(x=>JSON.stringify(x))))})"],
                                       input=json.dumps(vals), capture_output=True, text=True, check=True).stdout)
    diff = [(repr(v), mod._canon(v).decode(), o) for v, o in zip(vals, oracle) if mod._canon(v).decode() != o]
    return {"n": len(vals), "differ": len(diff), "examples": diff[:4]}


def primary_quotes(page: bytes, quotes: list[str], control: str) -> dict:
    t = html.unescape(re.sub(r"<[^>]+>", " ", page.decode("utf-8", "ignore")))
    t = re.sub(r"\s+", " ", t).replace("’", "'")
    return {"found": sum(q in t for q in quotes), "n": len(quotes), "control_found": control in t}


def rec(rid, finding, claim, deps, test, nc, result, watch, limits, supersedes=None, remediation=None, signature=None):
    r = {"profile": PROFILE, "record_id": rid, "issuer": ISSUER, "issued_at": NOW}
    if supersedes: r["supersedes"] = supersedes
    r.update(finding=finding, claim=claim, dependencies=deps, test=test, negative_control=nc, result=result)
    if remediation: r["remediation"] = remediation
    if signature: r["signature"] = signature
    r.update(watch=watch, limits=limits)
    return r


def dep(dep_id, kind, name, b=None, uri=None, state="PINNED", version=None):
    return {"dep_id": dep_id, "kind": kind, "name": name, "version": version, "digest": dg(b) if b is not None else None,
            "uri": uri, "observed_at": NOW if b is not None else None, "state": state}


def sig(signed: dict, uri: str, ts_state="PENDING_CALENDAR_COMMITMENT", ts_kind="opentimestamps"):
    return {"envelope": "csoai_signed_run_0_1", "key_id": KEY_ID, "payload_sha256": signed["signature"]["payload_sha256"],
            "envelope_uri": uri, "transparency_receipt_uri": None, "timestamp": {"kind": ts_kind, "state": ts_state, "proof_uri": None}}


def watch(dep_id, on="digest_change", age=None, state="NOT_WATCHED"):
    t = {"dep_id": dep_id, "on": on}
    if age: t["max_age"] = age
    return {"triggers": [t], "retest_bound": {"max_latency": "P7D", "max_attempts": 3, "on_exhausted": "MARK_STALE"},
            "state": state, "last_checked_at": NOW}


PUB = "public"
SIG_LIMIT = "A verified signature shows these bytes were signed by the named key. It does not show the content is true."


def build() -> dict[str, dict]:
    pub = board_key()
    out: dict[str, dict] = {}
    led_b = get("api_corrections"); led = json.loads(led_b)
    entries = {e["id"]: e for e in led["corrections"]}
    fixed_b, prefix_p = get("sr_interceptor.py"), SRC / "sr_interceptor.prefix.py"
    prefix_b = prefix_p.read_bytes() if prefix_p.exists() else b""
    have_prefix = sha(prefix_b) == PREFIX_SHA
    vec_b, fail_res = get("sr_conformance_vectors.json"), jget("sr_conformance_example-fail-results.json")
    kit_bad, kit_n = kit_rejects(fail_res)
    fixed = load_module(SRC / "sr_interceptor.py", "sr_fixed")
    pre = load_module(prefix_p, "sr_prefix") if have_prefix else None

    # ---- C-2026-0928-01: verifier returned VALID for an unresolvable key ------------------------
    e1 = entries["C-2026-0928-01"]
    nc_kit = {"kind": "designed_to_fail", "expected": "FAIL", "observed": "FAIL" if kit_bad else "PASS",
              "description": "The kit's published results for the pre-fix verifier (example-fail-results.json) are scored "
                             f"against vectors.json by this script's comparator; it must report mismatches. It reported {kit_bad} of {kit_n}.",
              "negatives_observed": kit_bad, "denominator": kit_n}
    t_conf = {"method_id": "signed-receipts/v1 conformance, 17 core cases, resolution only via each case's did_documents",
              "method_version": sha(vec_b)[:12], "procedure": "python3 safe_export.py (conformance()); equivalently "
              f"python3 run.py <results> --vectors {SR}/conformance/vectors.json", "procedure_digest": dg(vec_b),
              "reproduction": "independent_reimplementation", "substitutions": [],
              "declared_failure_modes": ["Covers only the 17 core cases; a fault outside them passes.",
                                         "The pre-fix code has no three-valued result; its bool is mapped VALID/INVALID and it is driven "
                                         "integrity-only when a DID is absent from the fixture map, as deployed."],
              "noise_floor": "deterministic; no sampling"}
    deps_v = [dep("vectors", "dataset", "conformance vectors.json", vec_b, f"{SR}/conformance/vectors.json"),
              dep("ledger", "dataset", "corrections ledger entry C-2026-0928-01", json.dumps(e1, sort_keys=True).encode(),
                  "https://councilof.ai/api/corrections")]
    if pre:
        c_pre = conformance(pre, True)
        r1 = rec("csoai:safe-rv:C-2026-0928-01:pre-fix",
                 {"kind": "public_claim", "finding_ref": "C-2026-0928-01", "disclosure_tier": PUB,
                  "summary": "Correction C-2026-0928-01, re-tested: the published reference verifier reported VALID for a receipt "
                             "whose signing key it never resolved, so any key naming any issuer passed."},
                 {"claim_id": "signed-receipts/v1/interceptor.py@d908b9e7:resolves-before-valid", "claim_type": "control_holds",
                  "statement": "interceptor.py (sha256 d908b9e7...) returns VALID only for receipts whose key resolves to the named issuer, "
                               "and never INVALID merely because resolution failed.",
                  "subject": {"identifier": f"sha256:{PREFIX_SHA}", "scheme": "sha256"},
                  "scope": "The 17 core conformance cases; not the interop cases."},
                 deps_v + [dep("verifier", "tool", "interceptor.py before 2026-09-28", prefix_b,
                               "https://huggingface.co/datasets/csoai/councilof-ai-source (revision 96bf3a07; not publicly readable on 2026-09-28)")],
                 t_conf, nc_kit,
                 {"state": "FAIL" if c_pre["mismatches"] else "PASS", "measured_at": NOW, "read_state": "EXHAUSTED",
                  "n": len(c_pre["mismatches"]), "denominator": c_pre["n"],
                  "reason": f"{len(c_pre['mismatches'])} of {c_pre['n']} cases differ from expected: "
                            + "; ".join(f"{m['case']} {m['got']} (expected {m['expected']})" for m in c_pre["mismatches"]),
                  "evidence": [{"name": "C-2026-0928-01", "uri": "https://councilof.ai/api/corrections",
                                "digest": dg(json.dumps(e1, sort_keys=True).encode())}]},
                 watch("verifier", "becomes_unavailable"),
                 ["This re-test ran the pre-fix bytes supplied from the issuer's git history at the digest the ledger cites; "
                  "the public copy the ledger names answered 401, so a stranger cannot fetch these bytes today.",
                  "It says nothing about receipts issued with the verifier, only about how the verifier classified the vectors."],
                 remediation={"state": "PROPOSED", "reference": "commits 1ae2025fd, acff54074", "retest_record_id": None})
        out["C-2026-0928-01.pre-fix.safe-rv.json"] = r1
    c_fix = conformance(fixed, False)
    r2 = rec("csoai:safe-rv:C-2026-0928-01:post-fix",
             {"kind": "public_claim", "finding_ref": "C-2026-0928-01", "disclosure_tier": PUB,
              "summary": "Correction C-2026-0928-01, re-test of the served fix: unresolvable keys now give UNVERIFIABLE_KEY, never VALID."},
             {"claim_id": "signed-receipts/v1/interceptor.py@b79ed7fe:resolves-before-valid", "claim_type": "control_holds",
              "statement": f"interceptor.py as served (sha256 {sha(fixed_b)[:8]}...) returns the expected VALID / INVALID / "
                           "UNVERIFIABLE_KEY result for all 17 core cases.",
              "subject": {"identifier": f"{SR}/interceptor.py", "scheme": "url+sha256"},
              "scope": "The 17 core conformance cases; not the interop cases."},
             deps_v + [dep("verifier", "tool", "interceptor.py as served", fixed_b, f"{SR}/interceptor.py", state="UNPINNED")],
             t_conf, nc_kit,
             {"state": "PASS" if not c_fix["mismatches"] and kit_bad else ("FAIL" if kit_bad else "NOT_DISCRIMINATING"),
              "measured_at": NOW, "read_state": "EXHAUSTED", "n": c_fix["n"] - len(c_fix["mismatches"]), "denominator": c_fix["n"],
              "reason": f"{c_fix['n'] - len(c_fix['mismatches'])} of {c_fix['n']} core cases match; the same comparator scores the "
                        f"pre-fix results FAIL ({kit_bad} mismatches)."},
             watch("verifier"),
             ["The served URL is not immutable; the digest identifies the bytes tested.", SIG_LIMIT,
              "The GitHub copy the ledger names was not reachable and was not tested."])
    out["C-2026-0928-01.post-fix.safe-rv.json"] = r2

    # ---- C-2026-0928-02: canonicaliser was not RFC 8785 ---------------------------------------
    e2 = entries["C-2026-0928-02"]
    j_fix = jcs_probe(fixed)
    j_pre = jcs_probe(pre) if pre else None
    t_jcs = {"method_id": "scalar canonicalisation vs node JSON.stringify", "method_version": "2014 values, seed 20260928",
             "procedure": "python3 safe_export.py (jcs_probe()): 14 edge values + 2000 seeded doubles from 1e-8 to 1e22",
             "procedure_digest": None, "reproduction": "independent_reimplementation", "substitutions": [],
             "declared_failure_modes": ["Scalars only; object key ordering is not probed here (the conformance vectors cover it).",
                                        "node is the oracle: a defect shared by node and the code under test would not show."],
             "noise_floor": "deterministic"}
    nc_jcs = ({"kind": "designed_to_fail", "expected": "FAIL", "observed": "FAIL" if j_pre["differ"] else "PASS",
               "description": f"The pre-fix canonicaliser must differ from the oracle; it differed on {j_pre['differ']} of {j_pre['n']} values.",
               "negatives_observed": j_pre["differ"], "denominator": j_pre["n"]}
              if j_pre else {"kind": "none", "observed": "NOT_RUN", "description": "pre-fix bytes not available to this run"})
    deps_j = [dep("oracle", "runtime", "node JSON.stringify", None, None, "UNPINNED",
                  subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip() if shutil.which("node") else None),
              dep("ledger", "dataset", "corrections ledger entry C-2026-0928-02", json.dumps(e2, sort_keys=True).encode(),
                  "https://councilof.ai/api/corrections")]
    for tag, j, b, uri in (("pre-fix", j_pre, prefix_b, None), ("post-fix", j_fix, fixed_b, f"{SR}/interceptor.py")):
        if j is None and tag == "pre-fix":
            continue
        state = "UNMEASURED" if j is None else ("FAIL" if j["differ"] else "PASS")
        if state in ("PASS", "FAIL") and nc_jcs["observed"] != "FAIL":
            state = "NOT_DISCRIMINATING"
        out[f"C-2026-0928-02.{tag}.safe-rv.json"] = rec(
            f"csoai:safe-rv:C-2026-0928-02:{tag}",
            {"kind": "public_claim", "finding_ref": "C-2026-0928-02", "disclosure_tier": PUB,
             "summary": f"Correction C-2026-0928-02, re-tested {tag}: does the reference canonicaliser write RFC 8785 bytes "
                        "for astral characters and numbers?"},
            {"claim_id": f"signed-receipts/v1/_canon@{sha(b)[:8]}:rfc8785-scalars", "claim_type": "control_holds",
             "statement": "The reference canonicaliser writes every probed number and string exactly as RFC 8785 (ECMAScript) does.",
             "subject": {"identifier": f"sha256:{sha(b)}", "scheme": "sha256"}},
            deps_j + [dep("canonicaliser", "tool", f"interceptor.py {tag}", b, uri, "PINNED" if tag == "pre-fix" else "UNPINNED")],
            t_jcs, nc_jcs,
            {"state": state, "measured_at": None if j is None else NOW, "read_state": None if j is None else "EXHAUSTED",
             "n": None if j is None else j["differ"], "denominator": None if j is None else j["n"],
             "reason": "node not available" if j is None else
             f"{j['differ']} of {j['n']} values differ from the oracle" + (f", e.g. {j['examples'][:2]}" if j["differ"] else "")},
            watch("canonicaliser"),
            ["Wrong canonicalisation causes wrong rejection across implementations, not false acceptance (per the ledger entry).",
             "Scalars only; see declared_failure_modes."])

    # ---- the ledger itself: integrity, and whether its timing can meet SAFE clocks -----------------
    lc = check_ledger(pub, led)
    lat = led["correction_latency"]
    n_led = len(led["corrections"])
    deps_l = [dep("ledger", "dataset", "corrections ledger, csoai.corrections/0.1", led_b, "https://councilof.ai/api/corrections", "UNPINNED"),
              dep("key", "external_service", "did:web:csoai.org DID document", get("did.json"), FETCH["did.json"], "UNPINNED")]
    out["corrections-ledger.integrity.safe-rv.json"] = rec(
        "csoai:safe-rv:corrections-ledger:integrity",
        {"kind": "measurement", "finding_ref": None, "disclosure_tier": PUB,
         "summary": f"The public corrections ledger ({n_led} entries, newest {led['corrections'][0]['id']}) is committed to by a content_id "
                    "that is Ed25519-signed under the board key."},
        {"claim_id": "api/corrections:content_id+signature", "claim_type": "artifact_integrity",
         "statement": "The served ledger body hashes to the signed content_id, and that attestation verifies under the key in did.json.",
         "subject": {"identifier": "https://councilof.ai/api/corrections", "scheme": "url+sha256"}},
        deps_l,
        {"method_id": "ledger signature_check.how, re-implemented", "method_version": led["schema"], "procedure":
         led["signature_check"]["how"], "procedure_digest": None, "reproduction": "independent_reimplementation", "substitutions": [],
         "declared_failure_modes": ["The key is read from did.json at run time; a rotated key changes what verifies."], "noise_floor": None},
        {"kind": "designed_to_fail", "expected": "FAIL", "observed": "FAIL" if lc["controls_rejected"] else "PASS",
         "description": "One character appended to the first entry's status must break the content_id.",
         "negatives_observed": lc["controls_rejected"], "denominator": lc["controls"]},
        {"state": ("PASS" if lc["verifies"] else "FAIL") if lc["controls_rejected"] else "NOT_DISCRIMINATING",
         "measured_at": NOW, "read_state": "EXHAUSTED", "n": n_led, "denominator": None,
         "reason": f"content_id recomputed and Ed25519 checked: {'verifies' if lc['verifies'] else 'does NOT verify'}; tamper control rejected."},
        watch("ledger", "digest_change"),
        [led["policy"], SIG_LIMIT, "The ledger is re-signed as it grows; an older signature over an older body is not kept at a stable URL."],
        signature={"envelope": "other", "key_id": KEY_ID, "payload_sha256": led["signature"]["attestation"]["content_id"],
                   "envelope_uri": "https://councilof.ai/api/corrections", "transparency_receipt_uri": None,
                   "timestamp": {"kind": "none", "state": "NONE", "proof_uri": None}})
    exact = lat["exact"]
    out["corrections-ledger.timing.safe-rv.json"] = rec(
        "csoai:safe-rv:corrections-ledger:time-to-correct",
        {"kind": "measurement", "finding_ref": None, "disclosure_tier": PUB,
         "summary": "Can the ledger show how long each correction took? SAFE's clocks (ASAP, 72 h, 4 business days, 30/90 days) "
                    "need detected_at and published_at on every entry."},
        {"claim_id": "api/corrections:time_to_correct-measurable", "claim_type": "property_value",
         "statement": "Every ledger entry carries a first-hand detected_at and published_at, so its time-to-correct is measurable.",
         "subject": {"identifier": "https://councilof.ai/api/corrections", "scheme": "url+sha256"}},
        deps_l[:1],
        {"method_id": "count correction_latency.per_entry kinds", "method_version": led["timing_fields"].get("added"),
         "procedure": "read correction_latency {exact, upper_bound, unmeasured} from the signed ledger; recount per_entry",
         "procedure_digest": None, "reproduction": "re_execution", "substitutions": [],
         "declared_failure_modes": ["Relies on the ledger's own backfill rule (first-hand evidence only)."], "noise_floor": None},
        {"kind": "observed_negatives", "expected": "FAIL", "observed": "FAIL",
         "description": "Entries whose time-to-correct is not exactly measurable are observed negatives of the claim.",
         "negatives_observed": n_led - exact, "denominator": n_led},
        {"state": "FAIL" if exact < n_led else "PASS", "measured_at": NOW, "read_state": "EXHAUSTED", "n": exact, "denominator": n_led,
         "reason": f"exact {exact}, upper bound only {lat['upper_bound']}, UNMEASURED {lat['unmeasured']} of {n_led}; "
                   f"detected_at UNRECORDED on {lat['detected_at_unrecorded']}. Timing fields were added on {led['timing_fields'].get('added')}; "
                   "earlier entries are not backfilled by estimate."},
        watch("ledger", "digest_change"),
        ["UNMEASURED entries carry no estimate; that is why most are UNMEASURED.",
         "Says nothing about whether any correction was right, only whether its timing is recorded."],
        remediation={"state": "APPLIED", "reference": "timing_fields added 2026-09-26; new entries carry detected_at, detected_window, published_at",
                     "retest_record_id": None})

    # ---- MCP contract parity: v0.1.2 supersedes v0.1.1 and v0.1, all kept ---------------------
    p0, p1, p2 = get("parity_record.json"), get("parity_record.v0.1.1.json"), get("parity_record.v0.1.2.json")
    p2j, p2s = json.loads(p2), jget("parity_record.v0.1.2.signed.json")
    sv = check_signed_run(pub, p2s, p2)
    chain = {c["record"]: c["sha256"] for c in p2j["supersedes"]["chain"]}
    chain_ok = chain.get("record.v0.1.1.json") == sha(p1) and chain.get("record.json") == sha(p0)
    chain_ctl = chain.get("record.v0.1.1.json") == sha(p1 + b" ")
    auth = {v: json.loads(b)["dimension_states"]["AUTH"]["INCONSISTENT"] for v, b in (("0.1", p0), ("0.1.1", p1), ("0.1.2", p2))
            if "dimension_states" in json.loads(b)}
    n_ctl = sv["controls"] + 1; n_rej = sv["controls_rejected"] + (not chain_ctl)
    out["mcp-contract-parity.v0.1.2.safe-rv.json"] = rec(
        "csoai:safe-rv:mcp-contract-parity:v0.1.2",
        {"kind": "measurement", "finding_ref": None, "disclosure_tier": PUB,
         "summary": f"Declared-vs-observed MCP contract parity, 25 Sep 2026 read: {p2j['endpoints_with_any_inconsistent']} endpoints with at least "
                    "one INCONSISTENT dimension in v0.1.2. AUTH INCONSISTENT by version: "
                    + ", ".join(f"v{k} {v}" for k, v in auth.items())
                    + ". Each correction is a new signed record; earlier ones are kept byte for byte."},
        {"claim_id": "mcp-contract-parity:v0.1.2:supersession-chain", "claim_type": "artifact_integrity",
         "statement": "record.v0.1.2.json is signed by the board key and names v0.1.1 and v0.1 by sha256, and those bytes are still published.",
         "subject": {"identifier": "https://huggingface.co/datasets/csoai/mcp-contract-parity@557ca3376194917ddc42e2e8dc301e6503fa2c03",
                     "scheme": "huggingface-dataset-revision"}},
        [dep("v0.1.2", "dataset", "record.v0.1.2.json", p2, f"{HF_PARITY}/record.v0.1.2.json"),
         dep("v0.1.1", "dataset", "record.v0.1.1.json", p1, f"{HF_PARITY}/record.v0.1.1.json"),
         dep("v0.1", "dataset", "record.json", p0, f"{HF_PARITY}/record.json"),
         dep("instrument", "tool", p2j["instrument"], None, None, "UNPINNED")],
        {"method_id": "signed-run check + supersedes chain digests", "method_version": "csoai.signed-run/0.1",
         "procedure": p2j["verify"]["signature"], "procedure_digest": None, "reproduction": "independent_reimplementation", "substitutions": [],
         "declared_failure_modes": ["Checks integrity and the chain only; it does not re-run the parity measurement."], "noise_floor": None},
        {"kind": "designed_to_fail", "expected": "FAIL", "observed": "FAIL" if n_rej == n_ctl else "PASS",
         "description": "Trailing byte on the record, zeroed artifact digest, changed signature nibble, and a trailing byte on the superseded v0.1.1.",
         "negatives_observed": n_rej, "denominator": n_ctl},
        {"state": "PASS" if sv["verifies"] and chain_ok else "FAIL", "measured_at": NOW, "read_state": "EXHAUSTED", "n": 3, "denominator": 3,
         "reason": f"signature {'verifies' if sv['verifies'] else 'fails'}; chain digests {'match' if chain_ok else 'do NOT match'} the published v0.1.1 and v0.1 bytes.",
         "evidence": [{"name": "record.v0.1.2.signed.json", "uri": f"{HF_PARITY}/record.v0.1.2.signed.json", "digest": dg(get('parity_record.v0.1.2.signed.json'))}]},
        watch("v0.1.2"),
        list(p2j["what_it_does_not_show"][:3]) + [SIG_LIMIT],
        supersedes=[{"record_id": "hf:csoai/mcp-contract-parity:record.v0.1.1.json", "sha256": sha(p1), "uri": f"{HF_PARITY}/record.v0.1.1.json",
                     "reason": "reclassification 0.1.1 -> 0.1.2 (see correction.v0.1.2.evidence.json); bytes kept"},
                    {"record_id": "hf:csoai/mcp-contract-parity:record.json", "sha256": sha(p0), "uri": f"{HF_PARITY}/record.json",
                     "reason": "first published 0.1; superseded by 0.1.1 then 0.1.2; bytes kept"}],
        signature=sig(p2s, f"{HF_PARITY}/record.v0.1.2.signed.json"))

    # ---- disclosure-lag: dated public record of an incident --------------------------------------
    dlb, dls = get("dl_medicare_record.json"), jget("dl_medicare_record.signed.json")
    dj = json.loads(dlb)["capsules"][0]
    ds = check_signed_run(pub, dls, dlb)
    iv = {i["id"]: i for i in dj["observed"]["intervals"]}
    q = primary_quotes(get("s1.html"), ["On June 18, OpenAI's research team used an internal model",
                                        "It was that it took until 10 September before there was any notification"],
                       "On June 19, OpenAI's research team used an internal model")
    days = (dt.date(2026, 9, 10) - dt.date(2026, 6, 18)).days
    s1 = next(s for s in dj["sources"] if s["id"] == "S1")
    base = {"kind": "incident", "finding_ref": dj["subject_id"], "disclosure_tier": PUB}
    dl_deps = [dep("capsule", "dataset", "disclosure-lag record.json", dlb, f"{DL}/record.json"),
               dep("S1", "external_service", s1["title"] + " (pm.gov.au)", get("s1.html"), s1["url"], "UNPINNED")]
    dl_lim = ["Measurement, not accusation: dates and whole days as the public record gives them; no intent, diligence or compliance is characterised.",
              "The signed record.json still carries publication = 'PRIVATE: OWNER-APPROVE required'; it is served publicly, so that field is stale inside signed bytes and needs a superseding record, not an edit.",
              SIG_LIMIT]
    out["disclosure-lag.incident-to-notification.safe-rv.json"] = rec(
        "csoai:safe-rv:disclosure-lag:2026-06-au-portal:incident_to_authority_notified",
        dict(base, summary="An agent accessed a government portal without authorisation (SAFE Reporting Compact trigger 1). "
                           "SAFE asks for notice to the affected organisation ASAP; this record measures the days the public record shows."),
        {"claim_id": "incident_to_authority_notified", "claim_type": "property_value",
         "statement": f"The government's own transcript dates the run to 18 June 2026 and the first notification to 10 September 2026: {iv['incident_to_authority_notified']['days']} whole days.",
         "subject": {"identifier": dj["subject_id"], "scheme": "csoai-incident-id"}},
        dl_deps,
        {"method_id": "quote re-read + calendar arithmetic", "method_version": dj["schema"], "procedure": dj["method"], "procedure_digest": None,
         "reproduction": "re_execution", "substitutions": [f"S1 re-read {NOW}; bytes now {sha(get('s1.html'))[:12]}..., recorded {s1['response_sha256'][:12]}... "
                                                            f"({'same' if sha(get('s1.html')) == s1['response_sha256'] else 'differ'})"],
         "declared_failure_modes": ["A page edited after the original read may still contain the quote while its context changed."], "noise_floor": None},
        {"kind": "designed_to_fail", "expected": "FAIL", "observed": "PASS" if q["control_found"] else "FAIL",
         "description": "A fabricated quote with the date changed to June 19 must not be found in S1.", "negatives_observed": int(not q["control_found"]), "denominator": 1},
        {"state": ("PASS" if q["found"] == q["n"] and days == iv["incident_to_authority_notified"]["days"] else "FAIL") if not q["control_found"] else "NOT_DISCRIMINATING",
         "measured_at": NOW, "read_state": "EXHAUSTED", "n": days, "denominator": None,
         "reason": f"{q['found']} of {q['n']} primary quotes found verbatim; date(2026-09-10) - date(2026-06-18) = {days}; signed record "
                   f"{'verifies' if ds['verifies'] else 'does NOT verify'} under the board key."},
        watch("S1", "age_exceeds", "P30D"), dl_lim, signature=sig(dls, f"{DL}/record.signed.json"))
    stop = next(e for e in dj["observed"]["events"] if e["event"] == "activity_stopped")
    out["disclosure-lag.activity-stopped.safe-rv.json"] = rec(
        "csoai:safe-rv:disclosure-lag:2026-06-au-portal:activity_stopped",
        dict(base, summary="When did the agent's access end? SAFE's timeline asks for it; no source read states it."),
        {"claim_id": "activity_stopped", "claim_type": "property_value", "statement": "The public record states when the agent's access to the portal ended.",
         "subject": {"identifier": dj["subject_id"], "scheme": "csoai-incident-id"}},
        dl_deps[:1],
        {"method_id": "quote re-read", "method_version": dj["schema"], "procedure": dj["method"], "procedure_digest": None,
         "reproduction": "not_reproducible", "substitutions": [], "declared_failure_modes": ["Absence among the sources read is not absence everywhere."], "noise_floor": None},
        {"kind": "none", "observed": "NOT_RUN", "description": "Nothing was measured, so there is nothing to control."},
        {"state": "UNMEASURED", "measured_at": None, "read_state": "NOT_READ", "n": None, "denominator": None,
         "reason": stop["statement"] + " It is left empty, never estimated."},
        watch("capsule", "digest_change"), dl_lim[:2])

    # ---- measurement capsules: the signed index is public, the capsules are not yet -------------
    cib, cis = get("capsules_index.json"), jget("capsules_index.signed.json")
    ci = json.loads(cib); cv = check_signed_run(pub, cis, cib)
    out["measurement-capsules.index.safe-rv.json"] = rec(
        "csoai:safe-rv:measurement-capsules:v0.2:index",
        {"kind": "measurement", "finding_ref": None, "disclosure_tier": PUB,
         "summary": f"{ci['n_capsules_total']} measurement capsules in {len(ci['batches'])} signed batches, one RFC 6962 root over all. "
                    f"States per batch are published; the capsules themselves are held until the owner approves publication."},
        {"claim_id": "measurement-capsules/v0.2/index.json:signed", "claim_type": "artifact_integrity",
         "statement": "The capsule index is signed by the board key and its digest matches the served bytes.",
         "subject": {"identifier": "https://councilof.ai/measurement-capsules/v0.2/index.json", "scheme": "url+sha256"}},
        [dep("index", "dataset", "capsule index v0.2", cib, FETCH["capsules_index.json"], "UNPINNED"),
         dep("capsules", "dataset", f"{ci['n_capsules_total']} capsule bodies", None, None, "UNAVAILABLE")],
        {"method_id": "signed-run check", "method_version": "csoai.signed-run/0.1", "procedure": ci["verify"], "procedure_digest": None,
         "reproduction": "independent_reimplementation", "substitutions": [],
         "declared_failure_modes": ["Capsule ids and batch Merkle roots cannot be recomputed without the capsule bodies."], "noise_floor": None},
        {"kind": "designed_to_fail", "expected": "FAIL", "observed": "FAIL" if cv["controls_rejected"] == cv["controls"] else "PASS",
         "description": "Trailing byte, zeroed artifact digest, changed signature nibble.", "negatives_observed": cv["controls_rejected"], "denominator": cv["controls"]},
        {"state": "PARTIAL", "measured_at": NOW, "read_state": "PARTIAL", "n": 1, "denominator": None,
         "reason": f"index signature {'verifies' if cv['verifies'] else 'fails'}; the {ci['n_capsules_total']} capsules it commits to are not public, "
                   f"so only the index, not its contents, was checked. private_until: {ci['private_until']}."},
        watch("index"), [ci["what_this_is_not"], SIG_LIMIT], signature=sig(cis, FETCH["capsules_index.signed.json"]))

    # ---- supersession inside the export: the post-fix re-tests supersede the pre-fix ones ---------
    for cid in ("C-2026-0928-01", "C-2026-0928-02"):
        a, b = out.get(f"{cid}.pre-fix.safe-rv.json"), out[f"{cid}.post-fix.safe-rv.json"]
        if a and b["result"]["state"] == "PASS" and b["negative_control"]["observed"] == "FAIL":
            a["remediation"] = {"state": "VERIFIED_BY_RETEST", "reference": "commits 1ae2025fd, acff54074; " + entries[cid]["status"][:120],
                                "retest_record_id": b["record_id"]}
            b["supersedes"] = [{"record_id": a["record_id"], "sha256": sha(canon(a)), "uri": f"out/{cid}.pre-fix.safe-rv.json",
                                "reason": "re-test of the corrected code; the pre-fix record is kept unchanged beside it"}]
            b_ordered = {k: b[k] for k in ["profile", "record_id", "issuer", "issued_at", "supersedes"] if k in b}
            b_ordered.update({k: v for k, v in b.items() if k not in b_ordered}); out[f"{cid}.post-fix.safe-rv.json"] = b_ordered
    return out


def canon(o) -> bytes:
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def main() -> int:
    SRC.mkdir(exist_ok=True); OUT.mkdir(exist_ok=True)
    recs = build()
    index = []
    for name, r in recs.items():
        b = (json.dumps(r, indent=2, ensure_ascii=False) + "\n").encode()
        (OUT / name).write_bytes(b)
        index.append({"file": name, "record_id": r["record_id"], "state": r["result"]["state"],
                      "negative_control": r["negative_control"]["observed"], "canonical_sha256": sha(canon(r))})
        print(f"{r['result']['state']:<19} ctl={r['negative_control']['observed']:<8} {name}")
    (OUT / "index.json").write_text(json.dumps({"generated_at": NOW, "profile": PROFILE, "prototype": True, "deployed": False,
                                                "sources_read_at": READ_AT or "offline (cached src/)", "records": index}, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
