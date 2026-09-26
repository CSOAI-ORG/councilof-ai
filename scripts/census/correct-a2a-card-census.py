#!/usr/bin/env python3
"""Correction 0.1.1 of csoai.a2a-card-census/0.1: signature verdicts re-judged against the A2A spec
version each card declares (a2a-card-probe.py: 8.4.3 default-value removal for 1.x; served bytes for 0.x).

    correct-a2a-card-census.py build   --run DIR --v01 DIR --keys FILE --out DIR
    correct-a2a-card-census.py sign    --out DIR [--token FILE]
    correct-a2a-card-census.py ots     --out DIR
    correct-a2a-card-census.py publish --out DIR [--hf-token FILE]

build: re-runs the 0.1 row projection over the stored run and REFUSES unless it reproduces the published
0.1 rows byte for byte; re-checks with the current prober every signed card whose payload the rule
change can alter (all others keep their 0.1 verdict by construction: same signing input under both
rules), using key documents from --keys only (no network; a missing key URL fails closed); recomputes
every signature figure from the new rows. sign: board-sign (did:web:csoai.org#board-attestation-1), local
Ed25519 verification and three altered-preimage controls that MUST be rejected. ots: OpenTimestamps
calendars (pending commitment). publish: NEW files into the EXISTING dataset csoai/a2a-card-census plus
an appended README Corrections section; refuses to overwrite; checks every old file byte-identical.
"""
import argparse, base64, collections, copy, gzip, hashlib, importlib.util, json, os, pathlib, subprocess, sys
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
_s = importlib.util.spec_from_file_location("a2a_card_probe", HERE / "a2a-card-probe.py")
A = importlib.util.module_from_spec(_s); _s.loader.exec_module(A)
_b = importlib.util.spec_from_file_location("bucr", HERE / "build-universes-census-records.py")
B = importlib.util.module_from_spec(_b); _b.loader.exec_module(B)

HF_REPO = "csoai/a2a-card-census"
V01_SHA = "b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662176c"
REC = "record.v0.1.1.json"
ROWS = "data/cards.v0.1.1.jsonl.gz"
EVID = "correction.v0.1.1.evidence.json"
NEW_FILES = [REC, "record.v0.1.1.signed.json", "record.v0.1.1.json.ots", "record.v0.1.1.ots.json", ROWS, EVID]
RECORD_PATH = "/interop/a2a-card-census-2026-09-25/record.v0.1.1.json"
SCHEMA = "csoai.a2a-card-census/0.1.1"
PUBLIC_KEYS = B.A2A_PUBLIC_KEYS + ["canonicalisation_rule", "declared_major", "sig_state_under_1x_rules", "note", "sig_state_0_1"]
sha, fsha = B.sha, B.fsha


def pub_row_01(r):  # byte-for-byte the 0.1 projection (build-universes-census-records.py build_a2a.pub_row)
    sc = r.get("signature_check") or {}
    sigs = sc.get("signatures") or []
    return {"order": r["order"], "id": r["id"], "host": r["host"], "state": r["state"], "reason": B.public_reason(r.get("reason")),
            "card_url": r.get("card_fetched_url") or r.get("listed_wellKnownURI"), "card_source": r.get("card_source"),
            "card_sha256": r.get("card_sha256"),
            "card_protocolVersion": (r.get("card") or {}).get("protocolVersion"), "listed_protocolVersion": r.get("listed_protocolVersion"),
            "signed": ((sc.get("n_signatures") or 0) > 0) if sc else None, "n_signatures": sc.get("n_signatures"),
            "sig_state": sc.get("sig_state"), "verify_results": [d.get("result") for d in sigs],
            "key_source_kinds": [d.get("key_source") for d in sigs], "algs": [d.get("alg") for d in sigs]}


def build(a):
    run, v01, out = pathlib.Path(a.run), pathlib.Path(a.v01), pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    rec01_raw = (v01 / "record.json").read_bytes()
    assert sha(rec01_raw) == V01_SHA, "not the published 0.1 record"
    rec01 = json.loads(rec01_raw)
    for n in ("summary.json", "results.jsonl.gz", "cards.jsonl.gz"):
        assert fsha(run / n) == rec01["inputs"][n], f"input {n} differs from the 0.1 record"
    rows01_raw = (v01 / "data/cards.jsonl.gz").read_bytes()
    assert sha(rows01_raw) == rec01["published_files"]["data/cards.jsonl.gz"]["sha256"]
    rows = sorted(B.jl(run / "results.jsonl.gz"), key=lambda r: r["order"])
    repro = B.gz_bytes([pub_row_01(r) for r in rows])
    if repro != rows01_raw:
        sys.exit("REFUSING: the 0.1 projection over the stored run does not reproduce the published 0.1 rows")
    cards = {c["id"]: json.loads(c["body"]) for c in B.jl(run / "cards.jsonl.gz")}
    keys = json.load(open(a.keys))
    used = {}

    def fetch(url):
        if url not in keys:
            raise RuntimeError(f"key URL not in --keys (fail closed): {url}")
        used[url] = keys[url]["sha256"]
        k = keys[url]
        return (k["doc"], None) if k["doc"] is not None else (None, k["why"])

    new_rows, changed, rechecked, evidence = [], [], [], []
    for r in rows:
        p = pub_row_01(r)
        p.update(canonicalisation_rule=None, declared_major=None, sig_state_under_1x_rules=None, note=None, sig_state_0_1=p["sig_state"])
        if r["state"] == "CARD_SERVED":
            card = cards[r["id"]]
            _decl, major = A.declared_protocol(card)
            p["declared_major"] = major
            sc01 = r["signature_check"]
            if sc01["n_signatures"]:
                body = {k: v for k, v in card.items() if k != "signatures"}
                sb, _ = A.spec_payload_body(card)
                if sb != body:  # step 3 alters the payload: the verdict can depend on the rule -> re-check
                    sc = A.check_signatures(card, fetch)
                    old_rule = A._check(card, fetch, A.RULE_0X)["sig_state"]
                    assert old_rule == sc01["sig_state"], (r["id"], "0.1 rule on these keys does not reproduce 0.1")
                    rechecked.append(r["id"])
                    p.update(sig_state=sc["sig_state"], verify_results=[d.get("result") for d in sc["signatures"]],
                             key_source_kinds=[d.get("key_source") for d in sc["signatures"]], algs=[d.get("alg") for d in sc["signatures"]],
                             canonicalisation_rule=sc["rule"], sig_state_under_1x_rules=sc.get("sig_state_under_1x_rules"), note=sc.get("note"))
                    r = dict(r, signature_check=sc)
                    evidence.append({"id": p["id"], "card_sha256": p["card_sha256"], "declared": sc["declared_protocolVersion"],
                                     "rule": sc["rule"], "sig_state_0_1": p["sig_state_0_1"], "sig_state_0_1_1": sc["sig_state"],
                                     "sig_state_0_1_rule_same_keys": old_rule, "sig_state_under_1x_rules": sc.get("sig_state_under_1x_rules"),
                                     "note": sc.get("note"), "signatures": [{k: d.get(k) for k in ("result", "alg", "key_source", "key_url", "reason", "alt_serialisations_verifying")} for d in sc["signatures"]]})
                else:  # same signing input under both rules: the 0.1 verdict stands
                    p["canonicalisation_rule"] = A.RULE_0X if major == "0.x" else A.RULE_1X
                if p["sig_state"] != p["sig_state_0_1"]:
                    changed.append({"id": p["id"], "host": p["host"], "declared_major": major, "from": p["sig_state_0_1"], "to": p["sig_state"],
                                    "why": ("declares 1.x: A2A 8.4.3 step 3 (remove default values) applied; "
                                            + ("the signature was made over the served bytes WITH default values, so it no longer verifies"
                                               if p["sig_state"] == "FAILED" else
                                               "the signature was made over the card with default values removed, as 8.4.1-8.4.2 require, and now verifies"))})
        new_rows.append((r, p))
    pub = [p for _r, p in new_rows]
    assert all(set(x) == set(PUBLIC_KEYS) for x in pub)
    blob = B.gz_bytes(pub)
    (out / "data").mkdir(exist_ok=True); (out / ROWS).write_bytes(blob)

    served = [r for r, _p in new_rows if r["state"] == "CARD_SERVED"]
    ns = len(served)
    pct = lambda n: round(100.0 * n / ns, 2)
    sig = collections.Counter(r["signature_check"]["sig_state"] for r in served)
    signed = [r for r in served if r["signature_check"]["n_signatures"] > 0]
    ver_src = collections.Counter(x for r in served if r["signature_check"]["sig_state"] == "VERIFIED" for x in r["signature_check"].get("verified_key_sources", []))
    unc = collections.Counter(d.get("reason", "")[:80] for r in served for d in r["signature_check"].get("signatures", []) if d.get("result") == "UNCHECKABLE")
    ks = collections.Counter(f"{d.get('key_source')} / {d.get('result')}" for r in served for d in r["signature_check"].get("signatures", []))
    alt_failed = sorted(r["id"] for r in served for d in r["signature_check"].get("signatures", []) if d.get("result") == "FAILED" and d.get("alt_serialisations_verifying"))
    notes = sorted(p["id"] for p in pub if p["note"])
    by_rule = collections.Counter(p["canonicalisation_rule"] for p in pub if p["signed"])
    s01 = rec01["signatures"]
    trans = collections.Counter(f"{c['from']} -> {c['to']}" for c in changed)
    checks = {
        "0.1 projection over the stored run reproduces the published 0.1 rows byte for byte": repro == rows01_raw,
        "run inputs == the 0.1 record's inputs (sha256)": True,
        "rows == 0.1 rows (count, ids, order)": [p["id"] for p in pub] == [json.loads(l)["id"] for l in gzip.decompress(rows01_raw).decode().splitlines()],
        "listing states unchanged": dict(collections.Counter(p["state"] for p in pub)) == rec01["states"],
        "sig_state counts == counts over the new rows": dict(collections.Counter(p["sig_state"] for p in pub if p["state"] == "CARD_SERVED")) == {k: v for k, v in sig.items()},
        "signed count unchanged (33 in 0.1)": len(signed) == s01["signed"],
        "0.1 rule on the same key documents reproduces every re-checked 0.1 verdict": True,
        "every changed row was re-checked": all(c["id"] in rechecked for c in changed),
        "rows not re-checked keep their 0.1 verdict": all(p["sig_state"] == p["sig_state_0_1"] for p in pub if p["id"] not in rechecked),
        "changed rows are exactly those whose sig_state differs": sorted(c["id"] for c in changed) == sorted(p["id"] for p in pub if p["sig_state"] != p["sig_state_0_1"]),
        "no 0.x card changed verdict": all(c["declared_major"] != "0.x" for c in changed),
        "verified + failed + uncheckable == signed": sig.get("VERIFIED", 0) + sig.get("FAILED", 0) + sig.get("UNCHECKABLE", 0) == len(signed),
    }
    B.refuse_if_bad(checks)

    rec = copy.deepcopy(rec01)
    rec["schema"] = SCHEMA
    rec["record_version"] = "0.1.1"
    rec["corrected_utc"] = B.utcnow()
    rec["supersedes"] = {"record": "record.json", "schema": rec01["schema"], "sha256": V01_SHA,
                         "rows": "data/cards.jsonl.gz", "rows_sha256": sha(rows01_raw),
                         "kept": "record.json, record.signed.json, record.json.ots, record.ots.json, data/cards.jsonl.gz and every other 0.1 file stay published byte for byte: superseded, not deleted, not edited"}
    rec["producer"] = {**rec01["producer"], "correction_commit": B.git("rev-parse", "HEAD"),
                       "correction_files": B.producers(["scripts/census/a2a-card-probe.py", "scripts/census/a2a-spec/a2a.proto",
                                                        "scripts/census/correct-a2a-card-census.py"])}
    rec["summary_cross_checks_0_1_1"] = checks
    sg = rec["signatures"]
    sg.update({"signed": len(signed), "pct_signed": pct(len(signed)), "verified": sig.get("VERIFIED", 0), "pct_verified": pct(sig.get("VERIFIED", 0)),
               "failed": sig.get("FAILED", 0), "uncheckable": sig.get("UNCHECKABLE", 0), "no_signatures": sig.get("NO_SIGNATURES", 0),
               "verified_by_key_source": dict(ver_src), "key_source_by_result": dict(ks.most_common()), "uncheckable_reasons": dict(unc.most_common()),
               "failed_that_verify_under_a_non_spec_serialisation": len(alt_failed),
               "signed_cards_by_rule": dict(by_rule),
               "declared_0x_where_1x_rules_give_another_verdict": notes,
               "canonicalisation": ("per the spec version the card declares: 1.x (or nothing recognisable declared) = A2A spec 8.4.3 @ "
                                    + A.A2A_SPEC_COMMIT[:7] + " (default values removed per a2a.proto sha256 " + A.A2A_PROTO_SHA256[:12]
                                    + ", `signatures` excluded, JCS RFC 8785); 0.x = JCS of the card with `signatures` excluded (the v0.3.0 spec defines no canonicalisation step); detached JWS (RFC 7515)"),
               "failed_note": ("FAILED = no verification under the key the card points to over the payload of the card's declared version; "
                               "alt_serialisations_verifying (in correction.v0.1.1.evidence.json) is a diagnostic, never a pass")})
    sg["state_meanings"]["FAILED"] = "a key was found and a signature did not verify under it over the payload the card's declared spec version defines"
    rec["correction"] = {
        "record_version": "0.1.1",
        "trigger": ("A2A spec 8.4.3 (Signature Verification) step 3 - 'Remove properties with default values from the received Agent Card' - "
                    "was not applied by the 0.1 prober, which verified every card over JCS(card as served, minus signatures)."),
        "rule": "judge each card against the spec version it declares (ruling 2026-09-26)",
        "fix": {"file": "scripts/census/a2a-card-probe.py", "commits": ["96959268d529922e0cc4fafa8ded229f47ae1eb3", "33d0dfa64779f27fe256df50f4b47dab5ae05d61"],
                "tests": "scripts/census/test_a2a_card_probe.py class SpecDefaultRemoval: the spec's 8.4.1 example verbatim, a card carrying defaults, a 0.3 card judged under 0.3, must-fail control without step 3"},
        "rows_changed": {"n": len(changed), "transitions": dict(trans), "rows": changed},
        "declared_0x_kept_with_note": [{"id": p["id"], "host": p["host"], "sig_state": p["sig_state"], "sig_state_under_1x_rules": p["sig_state_under_1x_rules"], "note": p["note"]} for p in pub if p["note"]],
        "counts_before_after": {k: {"0.1": s01[k], "0.1.1": sg[k]} for k in ("verified", "failed", "uncheckable", "no_signatures", "signed", "pct_verified")},
        "rechecked": {"n": len(rechecked), "ids": rechecked,
                      "rule": "every signed card whose payload 8.4.3 step 3 alters; every other card has the same signing input under both rules, so its 0.1 verdict stands",
                      "key_documents": {"source": "re-fetched 2026-09-26 03:39Z (GET only, the prober's key path); the 0.1 rule on these documents reproduces every re-checked 0.1 verdict, so no change is a key rotation",
                                        "sha256_of_canonical_json": used}},
        "not_changed": "listing states, card bytes, the frame, every row not in rows_changed (verdict), and all 0.1 files",
        "original_stays_published": True,
    }
    evid = {"schema": "csoai.a2a-card-census-correction-evidence/0.1.1", "rechecked": evidence}
    (out / EVID).write_text(json.dumps(evid, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    rec["published_files"] = {**{k: v for k, v in rec01["published_files"].items()},
                              ROWS: {"sha256": sha(blob), "bytes": len(blob), "rows": len(pub)},
                              EVID: {"sha256": fsha(out / EVID), "bytes": (out / EVID).stat().st_size}}
    rec["verify"] = {**B.verify_block(), "signature": B.verify_block()["signature"].replace("record.signed.json", "record.v0.1.1.signed.json").replace("sha256(record.json)", "sha256(record.v0.1.1.json)"),
                     "timestamp": B.verify_block()["timestamp"].replace("record.json.ots", "record.v0.1.1.json.ots").replace("sha256(record.json)", "sha256(record.v0.1.1.json)").replace("ots verify record.json.ots", "ots verify record.v0.1.1.json.ots")}
    (out / REC).write_text(json.dumps(rec, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({"record": fsha(out / REC), "rows": sha(blob), "rechecked": len(rechecked), "transitions": dict(trans),
                      "notes_0x": notes, "checks_hold": all(checks.values())}))


def sign(a):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    out = pathlib.Path(a.out)
    raw = (out / REC).read_bytes(); rec = json.loads(raw)
    assert rec["schema"] == SCHEMA
    tok = pathlib.Path(os.path.expanduser(a.token)).read_text().strip()
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {"path": RECORD_PATH, "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
        "supersedes_sha256": rec["supersedes"]["sha256"],
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": "The signature proves these bytes were signed by the board key; it does not prove any claim inside beyond what the record's own instrument measured.",
        "read_state": rec["read"]["read_state"], "n_planned": rec["read"]["n_planned"], "states": rec["states"],
        "sig_state": {k: rec["signatures"][k] for k in ("verified", "failed", "uncheckable", "no_signatures")},
        "rows_changed": [c["id"] for c in rec["correction"]["rows_changed"]["rows"]],
        "summary_cross_checks_hold": all(rec["summary_cross_checks_0_1_1"].values()),
        "published_files": {k: v["sha256"] for k, v in rec["published_files"].items() if k in (ROWS, EVID)},
    }
    canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert len(canon) <= 3072, f"payload {len(canon)} bytes > 3072"
    req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok,
                                          "user-agent": "Mozilla/5.0 csoai-pod-signer"})
    r = json.load(urllib.request.urlopen(req, timeout=40))
    assert r["payload_sha256"] == sha(canon), "preimage mismatch"
    did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"user-agent": "Mozilla/5.0"}), timeout=20))
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
    pk.verify(bytes.fromhex(r["sig_ed25519"]), canon)
    print("signature VERIFIES under did:web:csoai.org#board-attestation-1")
    controls = {}
    for name, altered in (("trailing byte appended", canon + b" "),
                          ("record sha256 altered", canon.replace(sha(raw).encode(), ("0" * 64).encode())),
                          ("supersedes altered", canon.replace(V01_SHA.encode(), ("f" * 64).encode()))):
        assert altered != canon, name
        try:
            pk.verify(bytes.fromhex(r["sig_ed25519"]), altered); controls[name] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            controls[name] = "rejected (control holds)"
    print("controls:", controls)
    if any("FAILED" in v for v in controls.values()):
        sys.exit(3)
    doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                         "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                         "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
           "local_verification": {"did_document": "https://csoai.org/.well-known/did.json", "result": "VERIFIES", "altered_preimage_controls": controls},
           "verify": "canonicalise payload as above, sha256 must equal signature.payload_sha256, verify sig_ed25519 (hex) with the #board-attestation-1 key in https://csoai.org/.well-known/did.json"}
    (out / "record.v0.1.1.signed.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"SIGNED {REC} sha256={sha(raw)} signed_at={r.get('signed_at')}")


def ots(a):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
    cals = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
            "https://finney.calendar.eternitywall.com"]
    out = pathlib.Path(a.out); raw = (out / REC).read_bytes(); d = hashlib.sha256(raw).digest()
    ts = Timestamp(d); got = []; failed = {}
    for u in cals:
        try:
            ts.merge(RemoteCalendar(u).submit(d, timeout=30)); got.append(u)
        except Exception as e:
            failed[u] = f"{type(e).__name__}: {str(e)[:80]}"
    if not got:
        sys.exit("NOT_STAMPED: no calendar accepted the digest; no .ots written")
    ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx); proof = ctx.getbytes()
    (out / "record.v0.1.1.json.ots").write_bytes(proof)
    back = DetachedTimestampFile.deserialize(BytesDeserializationContext((out / "record.v0.1.1.json.ots").read_bytes()))
    atts = [type(x[1]).__name__ for x in back.timestamp.all_attestations()]
    assert back.file_digest == d and all(x == "PendingAttestation" for x in atts), atts
    side = {"schema": "csoai.ots-state/0.1", "file": REC, "sha256": sha(raw), "ots_file": "record.v0.1.1.json.ots",
            "ots_sha256": sha(proof), "stamped_utc": B.utcnow(), "calendars_accepted": got, "calendars_failed": failed,
            "proof_parses": True, "proof_binds_to_file_digest": True, "attestations": atts, "state": "PENDING_CALENDAR_COMMITMENT",
            "state_meaning": ("Calendars accepted this digest and promised future Bitcoin inclusion. This is NOT a Bitcoin attestation "
                              "and is not described as one. It becomes one only after `ots upgrade` returns a BitcoinBlockHeaderAttestation "
                              "and `ots verify` checks it against the chain.")}
    (out / "record.v0.1.1.ots.json").write_text(json.dumps(side, indent=1) + "\n")
    print(f"OTS {len(got)} calendars, {len(atts)} pending attestations, binds=True")


def corrections_md(out):
    rec = json.loads((out / REC).read_text()); c = rec["correction"]; sg = rec["signatures"]
    signed = json.loads((out / "record.v0.1.1.signed.json").read_text())
    side = json.loads((out / "record.v0.1.1.ots.json").read_text())
    rows = "\n".join(f"| `{x['id']}` | {x['host']} | {x['declared_major']} | {x['from']} | {x['to']} | {x['why']} |" for x in c["rows_changed"]["rows"])
    kept = "\n".join(f"| `{x['id']}` | {x['host']} | {x['sig_state']} | {x['sig_state_under_1x_rules']} | {x['note']} |" for x in c["declared_0x_kept_with_note"])
    cb = "\n".join(f"| {k} | {v['0.1']} | {v['0.1.1']} |" for k, v in c["counts_before_after"].items())
    return f"""

## Corrections

### 0.1.1 — 26 September 2026 (supersedes `record.json` 0.1; the 0.1 files stay published unchanged)

`{REC}` (sha256 `{fsha(out / REC)}`) supersedes `record.json` (sha256 `{rec['supersedes']['sha256']}`). The rows are
`{ROWS}`; `data/cards.jsonl.gz`, `record.json`, `record.signed.json`, `record.json.ots`, `record.ots.json` and every other
0.1 file are kept byte for byte: superseded, not deleted, not edited.

**Why.** {c['trigger']} **Rule now:** {c['rule']}. A card declaring 1.x (or nothing recognisable) is verified over the
8.4.3 payload (default values removed per the A2A proto, `signatures` excluded, JCS). A card declaring 0.x is verified over
JCS of its served bytes: protocol 0.3 defines no canonicalisation step. Fix: `{c['fix']['file']}` commits
{', '.join('`' + x[:9] + '`' for x in c['fix']['commits'])}.

**Check.** The 0.1 row projection over the stored run reproduces the published 0.1 rows byte for byte. {c['rechecked']['n']} signed
cards (those whose payload step 3 alters) were re-checked on their stored bytes; key documents were re-fetched 2026-09-26 and the 0.1
rule on them reproduces every 0.1 verdict, so no change below is a key rotation. Every other card has the same signing input under both rules.

**Agents whose verdict changes: {c['rows_changed']['n']}** ({', '.join(f'{k}: {v}' for k, v in c['rows_changed']['transitions'].items())})

| agent id (a2aregistry) | host | declares | 0.1 | 0.1.1 | why |
|---|---|---|---|---|---|
{rows}

**Cards declaring 0.3 that keep their verdict, with a note:**

| agent id | host | verdict (declared 0.3) | under 1.x rules | note |
|---|---|---|---|---|
{kept}

**Signature counts, 0.1 → 0.1.1** (denominator: {sg['cards_served']} cards served):

| | 0.1 | 0.1.1 |
|---|---|---|
{cb}

**Verify.** `record.v0.1.1.signed.json`: Ed25519 under did:web:csoai.org#board-attestation-1 (signed_at {signed['signature'].get('signed_at')});
its payload carries `supersedes_sha256`. `record.v0.1.1.json.ots`: {len(side['attestations'])} pending calendar attestations at publication —
a pending calendar commitment, not a Bitcoin attestation. Per-card evidence: `{EVID}`.
"""


def publish(a):
    from huggingface_hub import HfApi, hf_hub_download, CommitOperationAdd
    out = pathlib.Path(a.out)
    api = HfApi(token=pathlib.Path(os.path.expanduser(a.hf_token)).read_text().strip())
    tok = api.token
    info = api.dataset_info(HF_REPO)
    have = {x.rfilename for x in info.siblings}
    assert not (set(NEW_FILES) & have), ("would overwrite", set(NEW_FILES) & have)
    keep = sorted(have - {".gitattributes", "README.md"})

    def hashes(rev):
        return {f: sha(pathlib.Path(hf_hub_download(HF_REPO, f, repo_type="dataset", token=tok, revision=rev, force_download=True)).read_bytes()) for f in keep}
    before = hashes(info.sha)
    assert before["record.json"] == V01_SHA
    old = pathlib.Path(hf_hub_download(HF_REPO, "README.md", repo_type="dataset", token=tok, revision=info.sha, force_download=True)).read_text()
    assert "## Corrections" not in old
    new = old.rstrip("\n") + "\n" + corrections_md(out)
    assert new.startswith(old.rstrip("\n"))
    (out / "README.corrected.md").write_text(new)
    ops = [CommitOperationAdd(path_in_repo=f, path_or_fileobj=str(out / f)) for f in NEW_FILES]
    ops.append(CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=str(out / "README.corrected.md")))
    ci = api.create_commit(HF_REPO, operations=ops, repo_type="dataset", parent_commit=info.sha,
                           commit_message="correction 0.1.1: record.v0.1.1 supersedes record.json 0.1 (kept byte for byte); verdicts judged against each card's declared A2A version; README Corrections")
    after = hashes(ci.oid)
    assert after == before, "a 0.1 file changed"
    for f in NEW_FILES:
        got = sha(pathlib.Path(hf_hub_download(HF_REPO, f, repo_type="dataset", token=tok, revision=ci.oid, force_download=True)).read_bytes())
        assert got == fsha(out / f), f
    rm = pathlib.Path(hf_hub_download(HF_REPO, "README.md", repo_type="dataset", token=tok, revision=ci.oid, force_download=True)).read_text()
    assert rm == new
    res = {"hf_commit": ci.oid, "parent": info.sha, "added": {f: fsha(out / f) for f in NEW_FILES},
           "unchanged_byte_identical": before, "readme": "Corrections section appended; prior content byte-identical as prefix"}
    (out / "publish-correction.json").write_text(json.dumps(res, indent=1) + "\n")
    print(json.dumps(res, indent=1))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("cmd", choices=["build", "sign", "ots", "publish"])
    ap.add_argument("--run"); ap.add_argument("--v01"); ap.add_argument("--keys"); ap.add_argument("--out", required=True)
    ap.add_argument("--token", default="~/.secrets/board-sign-pod-token"); ap.add_argument("--hf-token", default="~/.secrets/hf_token")
    a = ap.parse_args(argv)
    {"build": build, "sign": sign, "ots": ots, "publish": publish}[a.cmd](a)


if __name__ == "__main__":
    main()
