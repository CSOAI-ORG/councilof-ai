# SPDX-License-Identifier: Apache-2.0
"""Framework-free core: verify a signed batch and read one event's state. Imported by the NAT evaluator and by tests.

A bundle is JSON: {"batch": <batch.json text>, "signed": <batch.signed.json text>, "events": <events.jsonl text>,
"event_id": "sha256:..."}. Verification is offline against a pinned DID document (did.json). The result is:
  verification  VALID | INVALID | UNVERIFIABLE_KEY | UNCHECKABLE
  state         the event's own state word when verification is VALID; otherwise the verification word
  otel          the gen_ai.evaluation.result attributes for that event (no score.value unless one was measured)
There is no score. NAT's average_score over these items is therefore None.
"""
import base64, hashlib, json

NO_NUMBER = {"UNMEASURED", "UNCHECKABLE"}


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def _key(did, kid):
    frag = kid.split("#")[-1] if "#" in kid else None
    for m in did.get("verificationMethod", []):
        if frag and m.get("id", "").endswith("#" + frag):
            x = (m.get("publicKeyJwk") or {}).get("x")
            if x:
                return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    return None


def verify_bundle(bundle, did):
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    except ImportError:
        return "UNCHECKABLE", "cryptography not installed", None
    try:
        b = json.loads(bundle) if isinstance(bundle, str) else bundle
        braw, sraw, eraw = b["batch"].encode(), b["signed"], b["events"].encode()
        signed = json.loads(sraw); batch = json.loads(braw); pay, sg = signed["payload"], signed["signature"]
    except Exception as ex:
        return "INVALID", f"unparseable bundle: {type(ex).__name__}", None
    if hashlib.sha256(canon(pay)).hexdigest() != sg.get("payload_sha256"):
        return "INVALID", "payload digest differs", None
    if pay.get("artifact", {}).get("sha256") != hashlib.sha256(braw).hexdigest():
        return "INVALID", "batch bytes differ from the signed digest", None
    k = _key(did, sg.get("did", ""))
    if k is None:
        return "UNVERIFIABLE_KEY", f"key {sg.get('did')!r} not pinned", None
    try:
        Ed25519PublicKey.from_public_bytes(k).verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay))
    except Exception:
        return "INVALID", "Ed25519 signature does not verify", None
    if batch.get("events_file", {}).get("sha256") != hashlib.sha256(eraw).hexdigest():
        return "INVALID", "events bytes differ from the signed batch", None
    evs = {json.loads(l)["event_id"]: json.loads(l) for l in eraw.decode().splitlines() if l.strip()}
    ev = evs.get(b.get("event_id"))
    if ev is None or b.get("event_id") not in batch.get("event_ids", []):
        return "INVALID", "event_id not in the signed batch", None
    return "VALID", f"signed by {sg.get('did')} at {sg.get('signed_at')}", ev


def otel_attributes(ev):
    a = {"gen_ai.evaluation.name": ev["method"]["id"], "gen_ai.evaluation.score.label": ev["state"],
         "gen_ai.evaluation.explanation": ev["claim"]["text"], "csoai.event_id": ev["event_id"]}
    if ev["state"] not in NO_NUMBER and isinstance(ev.get("value"), (int, float)) and not isinstance(ev.get("value"), bool):
        a["gen_ai.evaluation.score.value"] = float(ev["value"])
    return a


def evaluate_bundle(bundle, did):
    ver, why, ev = verify_bundle(bundle, did)
    state = ev["state"] if ver == "VALID" else ver
    return {"verification": ver, "state": state, "reason": why,
            "otel": otel_attributes(ev) if ev is not None else {"gen_ai.evaluation.name": "csoai-evidence", "gen_ai.evaluation.score.label": ver}}
