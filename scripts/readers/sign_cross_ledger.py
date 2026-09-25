#!/usr/bin/env python3
"""Sign and timestamp cross-ledger supply records (method copied from
scripts/census/build-mcp-remote-census-record.py, lane census-frame).

    sign_cross_ledger.py sign   FILE.json [FILE.json ...] [--token ~/.secrets/board-sign-pod-token]
    sign_cross_ledger.py ots    FILE.json [FILE.json ...]
    sign_cross_ledger.py verify FILE.json [FILE.json ...]

sign   posts a compact payload pinning FILE.json by sha256 to POST https://councilof.ai/api/board-sign
       with the pod caller token (never printed), verifies the Ed25519 signature against
       did:web:csoai.org#board-attestation-1 from https://csoai.org/.well-known/did.json, and runs two
       altered-preimage controls that MUST fail. FILE.signed.json is written only if all of that holds.
ots    submits sha256(FILE.json) to three OpenTimestamps calendars; writes FILE.json.ots and
       FILE.ots.json. A fresh stamp is a PENDING CALENDAR COMMITMENT, not a Bitcoin attestation.
verify re-verifies FILE.signed.json offline-from-us (fetches only the DID document).
"""
import base64, datetime, hashlib, json, os, pathlib, sys, urllib.request

DID_URL = "https://csoai.org/.well-known/did.json"
SIGN_URL = "https://councilof.ai/api/board-sign"


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def canon(o) -> bytes:
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def site_path(p: pathlib.Path) -> str:
    parts = p.resolve().parts
    return "/" + "/".join(parts[parts.index("public") + 1:]) if "public" in parts else p.name


def board_key():
    from cryptography.hazmat.primitives.asymmetric import ed25519
    did = json.load(urllib.request.urlopen(urllib.request.Request(DID_URL, headers={"user-agent": "Mozilla/5.0"}), timeout=20))
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    return ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))


def payload_for(p: pathlib.Path, raw: bytes, rec: dict) -> dict:
    pl = {"schema": "csoai.signed-artifact/0.1",
          "artifact": {"path": site_path(p), "sha256": sha(raw), "schema": rec.get("schema"),
                       "as_of": rec.get("as_of") or rec.get("started_at")},
          "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
          "not_a_grade": ("The signature proves these bytes were signed by the board key on the date below; it does not "
                          "prove any claim inside beyond what the record's own instruments measured. An on-chain supply "
                          "read is not AUM, NAV, ownership, redeemability or compliance.")}
    if rec.get("schema", "").startswith("csoai.cross-ledger-supply"):
        pl["asset"] = rec.get("asset")
        pl["issuer_list_state"] = (rec.get("issuer_list_evidence") or {}).get("state")
        pl["reconciliation_state"] = rec.get("reconciliation_state", "UNRECONCILED (pilot record predates the field)")
        pl["reads"] = [[r.get("product", rec.get("asset")), r["ledger"], r["supply_decimal"], r["evidence_kind"]]
                       for r in rec.get("per_ledger", [])]
        files = {}
        for r in rec.get("rows", []):
            fl = (r.get("proof") or {}).get("file")
            if fl:
                files[fl["path"]] = fl["sha256"]
        pl["proof_files"] = files
        if rec.get("status", "").startswith("PILOT — unsigned"):
            pl["as_of_note"] = ("record bytes unchanged since the pilot run (started " + str(rec.get("started_at")) + "); its "
                                "internal 'unsigned' status line predates this signature and describes the run, not this file")
    elif rec.get("schema", "").startswith("csoai.institutional-evidence-links"):
        pl["institutions"] = {k: v["state"] for k, v in rec["institutions"].items()}
        pl["records"] = {r["path"]: r["sha256"] for r in rec["records"]}
    return pl


def sign(files, token):
    tok = pathlib.Path(os.path.expanduser(token)).read_text().strip()
    pk = board_key()
    for f in files:
        p = pathlib.Path(f)
        raw = p.read_bytes()
        rec = json.loads(raw)
        payload = payload_for(p, raw, rec)
        c = canon(payload)
        assert len(c) <= 3072, f"{p.name}: payload {len(c)} bytes > 3072"
        req = urllib.request.Request(SIGN_URL, data=json.dumps({"payload": payload}).encode(),
                                     headers={"content-type": "application/json", "authorization": "Bearer " + tok,
                                              "user-agent": "Mozilla/5.0 csoai-pod-signer"})
        r = json.load(urllib.request.urlopen(req, timeout=40))
        assert r["payload_sha256"] == sha(c), "preimage mismatch"
        pk.verify(bytes.fromhex(r["sig_ed25519"]), c)
        controls = {}
        for name, altered in (("trailing byte appended", c + b" "),
                              ("record sha256 altered", c.replace(sha(raw).encode(), ("0" * 64).encode()))):
            assert altered != c
            try:
                pk.verify(bytes.fromhex(r["sig_ed25519"]), altered)
                controls[name] = "VERIFIED (CONTROL FAILED)"
            except Exception:
                controls[name] = "rejected (control holds)"
        if any("FAILED" in v for v in controls.values()):
            sys.exit(f"{p.name}: tamper control failed: {controls}")
        doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
               "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                             "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                             "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
               "local_verification": {"did_document": DID_URL, "result": "VERIFIES", "altered_preimage_controls": controls},
               "verify": ("canonicalise payload (keys sorted, no whitespace, UTF-8); sha256 must equal signature.payload_sha256; "
                          "payload.artifact.sha256 must equal sha256 of the record file; verify sig_ed25519 (hex) with the "
                          "#board-attestation-1 Ed25519 key in https://csoai.org/.well-known/did.json")}
        out = p.with_suffix(".signed.json")
        out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        print(f"SIGNED {p.name} sha256={sha(raw)[:16]} payload={len(c)}B signed_at={r.get('signed_at')} controls={list(controls.values())}")


def verify(files):
    pk = board_key()
    for f in files:
        p = pathlib.Path(f)
        s = json.loads(p.with_suffix(".signed.json").read_text())
        c = canon(s["payload"])
        ok = sha(c) == s["signature"]["payload_sha256"] and sha(p.read_bytes()) == s["payload"]["artifact"]["sha256"]
        pk.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
        try:
            pk.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c[:-1] + b"!")
            ctl = "CONTROL FAILED"
        except Exception:
            ctl = "tamper rejected"
        print(f"VERIFY {p.name}: sha-pins={ok} signature=VERIFIES control={ctl}")


def ots(files):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
    cals = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
            "https://finney.calendar.eternitywall.com"]
    for f in files:
        p = pathlib.Path(f)
        raw = p.read_bytes()
        d = hashlib.sha256(raw).digest()
        ts, got, failed = Timestamp(d), [], {}
        for u in cals:
            try:
                ts.merge(RemoteCalendar(u).submit(d, timeout=30))
                got.append(u)
            except Exception as e:
                failed[u] = f"{type(e).__name__}: {str(e)[:80]}"
        if not got:
            print(f"NOT_STAMPED {p.name}: no calendar accepted the digest")
            continue
        ctx = BytesSerializationContext()
        DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
        proof = ctx.getbytes()
        op = p.with_name(p.name + ".ots")
        op.write_bytes(proof)
        back = DetachedTimestampFile.deserialize(BytesDeserializationContext(op.read_bytes()))
        atts = [type(x[1]).__name__ for x in back.timestamp.all_attestations()]
        assert all(a == "PendingAttestation" for a in atts), atts
        side = {"schema": "csoai.ots-state/0.1", "file": p.name, "sha256": sha(raw), "ots_file": op.name, "ots_sha256": sha(proof),
                "stamped_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "calendars_accepted": got, "calendars_failed": failed, "proof_parses": True,
                "proof_binds_to_file_digest": back.file_digest == d, "attestations": atts,
                "state": "PENDING_CALENDAR_COMMITMENT",
                "state_meaning": ("Calendars accepted this digest and promised future Bitcoin inclusion. This is NOT a Bitcoin "
                                  "attestation and is not described as one. It becomes one only after `ots upgrade` returns a "
                                  "BitcoinBlockHeaderAttestation and `ots verify` checks it against the chain."),
                "signing_is_separate": "the .signed.json says WHO attests to these bytes; this proof, once upgraded, says WHEN they existed."}
        p.with_suffix(".ots.json").write_text(json.dumps(side, indent=1) + "\n")
        print(f"OTS {p.name}: {len(got)} calendars, {len(atts)} pending, binds={side['proof_binds_to_file_digest']}")


if __name__ == "__main__":
    a = sys.argv[1:]
    tok = "~/.secrets/board-sign-pod-token"
    if "--token" in a:
        i = a.index("--token"); tok = a[i + 1]; del a[i:i + 2]
    cmd, files = a[0], a[1:]
    {"sign": lambda: sign(files, tok), "ots": lambda: ots(files), "verify": lambda: verify(files)}[cmd]()
