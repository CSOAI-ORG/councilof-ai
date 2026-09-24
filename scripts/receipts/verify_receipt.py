#!/usr/bin/env python3
"""verify_receipt.py - reference verifier for a delegation ("hire") receipt, v0.1 DRAFT.

    python3 scripts/receipts/verify_receipt.py RECEIPT.json --did-doc did.json
    python3 scripts/receipts/verify_receipt.py RECEIPT.json --pubkey <64 hex>
    python3 scripts/receipts/verify_receipt.py RECEIPT.json --did-url https://csoai.org/.well-known/did.json
    python3 scripts/receipts/verify_receipt.py RECEIPT.json --compute-id     # print sha256(preimage(body))

Spec: public/spec/delegation-receipt/README.md (CC0-1.0). Not to be confused with
scripts/verify_receipt.py, which checks x402 Offer/Receipt JWS objects - a different artefact.

WHAT IT CHECKS, AND REPORTS SEPARATELY (one failure never hides another):

  PARSE_ERROR / DUPLICATE_KEY   the file is not one JSON object with unique keys
  SCHEMA_INVALID                a required field is missing, mistyped or out of its enum
  ENVELOPE_INCONSISTENT         `signed` disagrees with kid/pubkey/signature being present
  INCOHERENT_EVIDENCE_STATE     a section's evidence state contradicts its own fields
                                (e.g. ABSENT with a reference filled in; UNCHECKED with a checker)
  PERSONAL_DATA_SUSPECTED       an e-mail address appears anywhere in the body
  ID_MISMATCH                   id != sha256(preimage(body)) - the body is not the one that was sealed
  BAD_SIGNATURE                 the Ed25519 signature does not verify over the preimage under
                                the envelope's own pubkey
  SIGNER_NOT_RECORDER           kid is not a key of body.recorder.did
  UNTRUSTED_SIGNER              the signature verifies, but the key is not the one published
                                for `kid` in the supplied DID document (or the supplied --pubkey)

A bad signature and an untrusted signer are different findings: the first says the bytes and
the signature do not match; the second says they match and the key is not one you pinned.

Verdicts: VALID (exit 0) - INVALID (exit 1) - UNSIGNED or SIGNER_UNPINNED (exit 2: nothing is
wrong with the record, but a signature check against a pinned key did not happen). An
UNSIGNED record is not a failed record; it is a record nobody has put a key behind yet.

A VALID verdict means: the named key signed these exact bytes, the key is the one the supplied
DID document publishes, and the record is internally coherent. It does NOT mean any claim in
the record is true, that the work was good, that the agent is safe, or that the key is still
unrevoked today. Each section's evidence state says how far that section is evidenced.

Dependencies: cryptography (pip install cryptography). Standard library otherwise. If the
`jsonschema` package is installed it is used as a second, independent schema check.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[2]
DEFAULT_SCHEMA = REPO / "public" / "spec" / "delegation-receipt" / "schema-v0.1.json"

STATES = ("EVIDENCED_BY_THIRD_PARTY", "SELF_ASSERTED", "ABSENT")
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


# --------------------------------------------------------------------------- canonical form
def preimage(body: Any) -> bytes:
    """The ONE preimage rule (same as the published measurement cards, 'Rule A')."""
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def content_id(body: Any) -> str:
    return hashlib.sha256(preimage(body)).hexdigest()


class DuplicateKey(ValueError):
    pass


def _no_dupes(pairs):
    out = {}
    for k, v in pairs:
        if k in out:
            raise DuplicateKey(k)
        out[k] = v
    return out


def load_json_strict(text: str) -> Any:
    return json.loads(text, object_pairs_hook=_no_dupes)


# --------------------------------------------------------------------------- mini schema check
def _resolve(schema_root: dict, node: dict) -> dict:
    while "$ref" in node:
        ref = node["$ref"]
        if not ref.startswith("#/"):
            raise ValueError(f"unsupported $ref {ref}")
        cur: Any = schema_root
        for part in ref[2:].split("/"):
            cur = cur[part]
        node = cur
    return node


_TYPES = {
    "object": lambda v: isinstance(v, dict),
    "array": lambda v: isinstance(v, list),
    "string": lambda v: isinstance(v, str),
    "boolean": lambda v: isinstance(v, bool),
    "null": lambda v: v is None,
    "integer": lambda v: isinstance(v, int) and not isinstance(v, bool),
    "number": lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
}


def mini_validate(root: dict, node: dict, value: Any, path: str, errs: list[str]) -> None:
    """The subset of JSON Schema 2020-12 that schema-v0.1.json uses. Interprets the schema
    file itself, so the file stays the single source of truth."""
    node = _resolve(root, node)
    if "const" in node and value != node["const"]:
        errs.append(f"{path}: expected const {node['const']!r}")
        return
    if "enum" in node and value not in node["enum"]:
        errs.append(f"{path}: {value!r} not in {node['enum']}")
        return
    t = node.get("type")
    if t is not None:
        ts = t if isinstance(t, list) else [t]
        if not any(_TYPES[x](value) for x in ts):
            errs.append(f"{path}: expected type {t}, got {type(value).__name__}")
            return
    if isinstance(value, str):
        if "minLength" in node and len(value) < node["minLength"]:
            errs.append(f"{path}: shorter than {node['minLength']}")
        if "maxLength" in node and len(value) > node["maxLength"]:
            errs.append(f"{path}: longer than {node['maxLength']}")
        if "pattern" in node and not re.search(node["pattern"], value):
            errs.append(f"{path}: does not match {node['pattern']}")
    if isinstance(value, list):
        if "minItems" in node and len(value) < node["minItems"]:
            errs.append(f"{path}: fewer than {node['minItems']} items")
        if "items" in node:
            for i, item in enumerate(value):
                mini_validate(root, node["items"], item, f"{path}[{i}]", errs)
    if isinstance(value, dict):
        props = node.get("properties", {})
        for req in node.get("required", []):
            if req not in value:
                errs.append(f"{path}: missing required field '{req}'")
        if node.get("additionalProperties") is False:
            for k in value:
                if k not in props:
                    errs.append(f"{path}: field '{k}' is not in the schema")
        for k, sub in props.items():
            if k in value:
                mini_validate(root, sub, value[k], f"{path}.{k}", errs)


def schema_errors(receipt: Any, schema: dict) -> list[str]:
    errs: list[str] = []
    mini_validate(schema, schema, receipt, "$", errs)
    try:  # optional independent second opinion
        import jsonschema  # type: ignore

        v = jsonschema.Draft202012Validator(schema)
        for e in v.iter_errors(receipt):
            loc = "$" + "".join(f"[{p}]" if isinstance(p, int) else f".{p}" for p in e.absolute_path)
            msg = f"{loc}: {e.message} (jsonschema)"
            if not any(x.startswith(loc + ":") for x in errs):
                errs.append(msg)
    except ImportError:
        pass
    return errs


# --------------------------------------------------------------------------- coherence rules
def coherence_errors(body: dict) -> list[str]:
    """README section 3.2. Only called on a schema-valid body."""
    errs: list[str] = []

    def section(name: str, sec: dict, ref_fields: list[str], populated: bool) -> None:
        st, ev = sec["state"], sec["evidence"]
        if st == "ABSENT":
            if ev:
                errs.append(f"{name}: ABSENT but carries evidence")
            if populated:
                errs.append(f"{name}: ABSENT but {', '.join(ref_fields)} not all empty")
        else:
            if not ev:
                errs.append(f"{name}: {st} with no evidence entry")
            if not populated:
                errs.append(f"{name}: {st} but nothing is referenced")
            third = any(e["party"] == "THIRD_PARTY" for e in ev)
            if st == "EVIDENCED_BY_THIRD_PARTY" and not third:
                errs.append(f"{name}: EVIDENCED_BY_THIRD_PARTY with no THIRD_PARTY evidence")
            if st == "SELF_ASSERTED" and third:
                errs.append(f"{name}: SELF_ASSERTED but lists THIRD_PARTY evidence - state understated or evidence mislabelled")

    p = body["principal"]
    section("principal", p, ["ref", "ref_sha256"], p["ref"] is not None or p["ref_sha256"] is not None)
    if (p["kind"] == "UNSTATED") != (p["state"] == "ABSENT"):
        errs.append("principal: kind UNSTATED if and only if state ABSENT")

    a = body["agent"]
    a_pop = any(a[k] is not None for k in ("a2a_agent_card_url", "a2a_agent_card_sha256", "erc8004"))
    section("agent", a, ["a2a_agent_card_url", "a2a_agent_card_sha256", "erc8004"], a_pop)
    if (a["a2a_agent_card_url"] is None) != (a["a2a_agent_card_sha256"] is None):
        errs.append("agent: a2a_agent_card_url and a2a_agent_card_sha256 come together")
    if (a["a2a_agent_card_sha256"] is None) != (a["card_observed_at"] is None):
        errs.append("agent: a card hash needs card_observed_at (and only then)")

    pay = body["payment"]
    money = ("network", "asset", "amount_units", "pay_to", "tx_hash", "settlement_ref")
    pay_pop = any(pay[k] is not None for k in money)
    if pay["kind"] == "UNPAID":
        if pay_pop:
            errs.append("payment: UNPAID but payment fields are filled")
        if pay["state"] != "SELF_ASSERTED":
            errs.append("payment: UNPAID is an assertion - state must be SELF_ASSERTED")
        if not pay["evidence"]:
            errs.append("payment: UNPAID with no evidence entry naming who asserted it")
    else:
        section("payment", pay, list(money), pay_pop)
        if (pay["kind"] == "UNSTATED") != (pay["state"] == "ABSENT"):
            errs.append("payment: kind UNSTATED if and only if state ABSENT")
        if pay["kind"] == "X402" and pay["state"] != "ABSENT":
            for k in ("network", "asset", "amount_units", "pay_to"):
                if pay[k] is None:
                    errs.append(f"payment: X402 without {k}")
            if pay["tx_hash"] is None and pay["settlement_ref"] is None:
                errs.append("payment: X402 with neither tx_hash nor settlement_ref")
    pc = pay["payer_class"]
    if (pc["value"] == "UNKNOWN") != (pc["state"] == "ABSENT"):
        errs.append("payment.payer_class: value UNKNOWN if and only if state ABSENT")

    d = body["delivery"]
    section("delivery", d, ["artifacts"], bool(d["artifacts"]))
    if (d["binding"] == "NONE") != (d["state"] == "ABSENT"):
        errs.append("delivery: binding NONE if and only if state ABSENT")

    o = body["outcome_check"]
    o_pop = any(o[k] is not None for k in ("checker_ref", "check_id", "method_url", "finding"))
    section("outcome_check", o, ["checker_ref", "check_id", "method_url", "finding"], o_pop)
    unchecked = o["result"] == "UNCHECKED"
    if unchecked != (o["state"] == "ABSENT") or unchecked != (o["checker_kind"] == "NONE"):
        errs.append("outcome_check: result UNCHECKED iff state ABSENT iff checker_kind NONE")
    if o["checker_kind"] == "HUMAN_PSEUDONYMOUS" and o["checker_ref"] is None:
        errs.append("outcome_check: a human check needs a pseudonymous checker_ref")

    for ev_name, ts in body["timestamps"].items():
        st = ts["state"]
        has_a, has_o = ts["asserted_at"] is not None, ts["observed_at"] is not None
        if (ts["asserted_at"] is None) != (ts["asserted_by"] is None):
            errs.append(f"timestamps.{ev_name}: asserted_at and asserted_by come together")
        if (ts["observed_at"] is None) != (ts["observed_via"] is None):
            errs.append(f"timestamps.{ev_name}: observed_at and observed_via come together")
        if st == "ABSENT" and (has_a or has_o):
            errs.append(f"timestamps.{ev_name}: ABSENT but a time is given")
        if st == "SELF_ASSERTED" and (not has_a or has_o):
            errs.append(f"timestamps.{ev_name}: SELF_ASSERTED means asserted_at only (an independent observation would be EVIDENCED_BY_THIRD_PARTY)")
        if st == "EVIDENCED_BY_THIRD_PARTY" and not has_o:
            errs.append(f"timestamps.{ev_name}: EVIDENCED_BY_THIRD_PARTY needs observed_at from a third party")
    return errs


# --------------------------------------------------------------------------- keys
def b64url(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def key_from_did_doc(doc: dict, kid: str) -> tuple[bytes | None, str]:
    """Raw Ed25519 key published for `kid`, or (None, reason)."""
    did, _, frag = kid.partition("#")
    if not frag:
        return None, f"kid {kid!r} has no #fragment"
    if doc.get("id") != did:
        return None, f"DID document is for {doc.get('id')!r}, kid names {did!r}"
    am = doc.get("assertionMethod")
    if isinstance(am, list):
        listed = {x if isinstance(x, str) else (x or {}).get("id") for x in am}
        if kid not in listed and f"#{frag}" not in listed:
            return None, f"{kid} is not listed in assertionMethod"
    for vm in doc.get("verificationMethod") or []:
        if vm.get("id") not in (kid, f"#{frag}"):
            continue
        jwk = vm.get("publicKeyJwk") or {}
        if jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519" and jwk.get("x"):
            return b64url(jwk["x"]), "published"
        return None, f"{kid} is not an Ed25519 publicKeyJwk"
    return None, f"{kid} is not in the DID document"


def ed25519_ok(pub: bytes, msg: bytes, sig: bytes) -> bool:
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

    try:
        Ed25519PublicKey.from_public_bytes(pub).verify(sig, msg)
        return True
    except (InvalidSignature, ValueError):
        return False


# --------------------------------------------------------------------------- verify
def verify(receipt_text: str, schema: dict, did_doc: dict | None = None, pinned_pubkey_hex: str | None = None) -> dict:
    out: dict[str, Any] = {"failures": [], "details": {}, "signature": "NOT_CHECKED", "signer": "NOT_CHECKED"}

    def fail(code: str, detail: Any) -> None:
        if code not in out["failures"]:
            out["failures"].append(code)
        out["details"].setdefault(code, [])
        out["details"][code] += detail if isinstance(detail, list) else [detail]

    try:
        r = load_json_strict(receipt_text)
    except DuplicateKey as e:
        fail("DUPLICATE_KEY", f"key {e} appears twice")
        out["verdict"] = "INVALID"
        return out
    except ValueError as e:
        fail("PARSE_ERROR", str(e))
        out["verdict"] = "INVALID"
        return out

    s_errs = schema_errors(r, schema)
    if s_errs:
        fail("SCHEMA_INVALID", s_errs)
    if not isinstance(r, dict) or not isinstance(r.get("body"), dict):
        out["verdict"] = "INVALID"
        return out
    body = r["body"]

    if not s_errs:
        c_errs = coherence_errors(body)
        if c_errs:
            fail("INCOHERENT_EVIDENCE_STATE", c_errs)

    hits = sorted(set(EMAIL_RE.findall(json.dumps(body))))
    if hits:
        fail("PERSONAL_DATA_SUSPECTED", [f"e-mail-shaped value: {h}" for h in hits])

    computed = content_id(body)
    out["computed_id"] = computed
    if r.get("id") != computed:
        fail("ID_MISMATCH", f"id {r.get('id')} != sha256(preimage(body)) {computed}")

    parts = (r.get("kid"), r.get("pubkey"), r.get("signature"))
    signed = r.get("signed")
    if signed is True and any(x is None for x in parts):
        fail("ENVELOPE_INCONSISTENT", "signed:true but kid/pubkey/signature missing")
    if signed is False and any(x is not None for x in parts):
        fail("ENVELOPE_INCONSISTENT", "signed:false but kid/pubkey/signature present")

    if signed is True and all(isinstance(x, str) for x in parts):
        kid, pub_hex, sig_hex = parts
        try:
            pub, sig = bytes.fromhex(pub_hex), bytes.fromhex(sig_hex)
        except ValueError:
            pub, sig = b"", b""
        if len(pub) == 32 and len(sig) == 64 and ed25519_ok(pub, preimage(body), sig):
            out["signature"] = "VALID"
        else:
            out["signature"] = "BAD_SIGNATURE"
            fail("BAD_SIGNATURE", "Ed25519 over preimage(body) does not verify under the envelope pubkey")

        rec_did = (body.get("recorder") or {}).get("did")
        if rec_did is not None and kid.partition("#")[0] != rec_did:
            fail("SIGNER_NOT_RECORDER", f"kid {kid} is not a key of recorder {rec_did}")

        if pinned_pubkey_hex is not None:
            if pinned_pubkey_hex.lower() == pub_hex.lower():
                out["signer"] = "TRUSTED"
            else:
                out["signer"] = "UNTRUSTED"
                fail("UNTRUSTED_SIGNER", "envelope pubkey is not the pinned --pubkey")
        elif did_doc is not None:
            key, why = key_from_did_doc(did_doc, kid)
            if key is not None and key.hex() == pub_hex.lower():
                out["signer"] = "TRUSTED"
            else:
                out["signer"] = "UNTRUSTED"
                fail("UNTRUSTED_SIGNER", why if key is None else f"{kid} publishes a different key")
        else:
            out["signer"] = "NO_TRUST_ANCHOR"
    elif signed is False:
        out["signature"] = "UNSIGNED"
        out["signer"] = "NOT_APPLICABLE"

    if out["failures"]:
        out["verdict"] = "INVALID"
    elif out["signature"] == "UNSIGNED":
        out["verdict"] = "UNSIGNED"
    elif out["signer"] == "NO_TRUST_ANCHOR":
        out["verdict"] = "SIGNER_UNPINNED"
    else:
        out["verdict"] = "VALID"
    out["evidence_states"] = evidence_table(body) if not s_errs else None
    return out


def evidence_table(body: dict) -> dict:
    """Per-section states, side by side. Deliberately NOT summed, averaged or ranked."""
    t = {k: body[k]["state"] for k in ("principal", "agent", "payment", "delivery", "outcome_check")}
    t["payment.payer_class"] = body["payment"]["payer_class"]["state"]
    for k, v in body["timestamps"].items():
        t[f"timestamps.{k}"] = v["state"]
    return t


EXIT = {"VALID": 0, "INVALID": 1, "UNSIGNED": 2, "SIGNER_UNPINNED": 2}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("receipt")
    ap.add_argument("--schema", default=str(DEFAULT_SCHEMA))
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--did-doc", help="local DID document JSON to pin the signer against")
    g.add_argument("--did-url", help="fetch the DID document (explicit user-agent; a 403 is UNCHECKABLE, not INVALID)")
    g.add_argument("--pubkey", help="pin exactly this 32-byte Ed25519 key (hex)")
    ap.add_argument("--compute-id", action="store_true", help="print sha256(preimage(body)) and exit")
    a = ap.parse_args(argv)

    text = Path(a.receipt).read_text(encoding="utf-8")
    if a.compute_id:
        print(content_id(load_json_strict(text)["body"]))
        return 0
    schema = json.loads(Path(a.schema).read_text(encoding="utf-8"))
    did_doc = None
    if a.did_doc:
        did_doc = json.loads(Path(a.did_doc).read_text(encoding="utf-8"))
    elif a.did_url:
        try:
            req = urllib.request.Request(a.did_url, headers={"User-Agent": "delegation-receipt-verify/0.1", "accept": "application/json"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                did_doc = json.loads(resp.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001 - any fetch failure is UNCHECKABLE
            print(json.dumps({"verdict": "UNCHECKABLE", "reason": f"could not fetch DID document: {e}"}, indent=2))
            return 2
    res = verify(text, schema, did_doc=did_doc, pinned_pubkey_hex=a.pubkey)
    print(json.dumps(res, indent=2, sort_keys=True))
    return EXIT[res["verdict"]]


if __name__ == "__main__":
    sys.exit(main())
