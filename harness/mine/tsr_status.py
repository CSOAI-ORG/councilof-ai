#!/usr/bin/env python3
"""tsr_status.py — parse an RFC 3161 TimeStampResp and report what it ACTUALLY says.

Why this exists: `cards/kernel-anchor.json` recorded `"tsa": {"status": "ok"}` for a
50-byte response from freetsa.org. Those 50 bytes are an ASN.1 *rejection*
(PKIStatus 2, failInfo badDataFormat, statusString "Bad request format or system
error."). The status had been decided by "bytes came back", not by parsing them.

This module decides the status by parsing. Rules, in order:

  * PKIStatus 0 (granted) or 1 (grantedWithMods) AND a TimeStampToken present -> "ok"
  * PKIStatus 0/1 with NO token                                               -> "err"
  * PKIStatus 2/3/4/5 (rejection/waiting/revocation*)                         -> "err"
  * unparseable / truncated / empty bytes                                     -> "unverifiable"

"ok" here means only "the TSA returned a status of granted and a token is present".
It is NOT a claim that the token's signature has been checked against the TSA
certificate chain — that needs the TSA root and is reported separately as
`token_signature_checked: false`. We never upgrade a status we did not establish.

Usage:
  python3 tsr_status.py --tsr cards/tsr-<id>.tsr            # parse one response
  python3 tsr_status.py --anchor cards/kernel-anchor.json    # audit an anchor record
  python3 tsr_status.py --anchor cards/kernel-anchor.json --rewrite   # correct it
  python3 tsr_status.py --selftest
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# RFC 3161 §2.4.2 PKIStatus
PKI_STATUS = {
    0: "granted",
    1: "grantedWithMods",
    2: "rejection",
    3: "waiting",
    4: "revocationWarning",
    5: "revocationNotification",
}
# RFC 3161 §2.4.2 PKIFailureInfo bit positions
FAIL_INFO_BITS = {
    0: "badAlg",
    2: "badRequest",
    5: "badDataFormat",
    14: "timeNotAvailable",
    15: "unacceptedPolicy",
    16: "unacceptedExtension",
    17: "addInfoNotAvailable",
    25: "systemFailure",
}


class DERError(ValueError):
    """The bytes are not the DER structure we were told they were."""


def _read_tlv(buf: bytes, i: int) -> tuple[int, bytes, int]:
    """Return (tag, content, next_index) for the TLV starting at i."""
    if i >= len(buf):
        raise DERError("truncated: no tag byte")
    tag = buf[i]
    i += 1
    if i >= len(buf):
        raise DERError("truncated: no length byte")
    n = buf[i]
    i += 1
    if n & 0x80:
        k = n & 0x7F
        if k == 0 or k > 4:
            raise DERError(f"unsupported long-form length ({k} bytes)")
        if i + k > len(buf):
            raise DERError("truncated: long-form length runs past end")
        n = int.from_bytes(buf[i:i + k], "big")
        i += k
    if i + n > len(buf):
        raise DERError(f"truncated: declared {n} content bytes, {len(buf) - i} present")
    return tag, buf[i:i + n], i + n


def _bitstring_bits(content: bytes) -> list[int]:
    """Set bit positions of a DER BIT STRING (first byte = unused-bit count)."""
    if not content:
        raise DERError("empty BIT STRING")
    unused = content[0]
    if unused > 7:
        raise DERError(f"invalid unused-bit count {unused}")
    bits: list[int] = []
    body = content[1:]
    total = len(body) * 8 - unused
    for pos in range(total):
        if body[pos // 8] & (0x80 >> (pos % 8)):
            bits.append(pos)
    return bits


def parse_timestamp_resp(raw: bytes) -> dict:
    """Parse a DER TimeStampResp. Never raises: returns a status dict either way."""
    out: dict = {
        "bytes": len(raw),
        "status": "unverifiable",
        "pki_status": None,
        "pki_status_text": None,
        "status_string": None,
        "fail_info": [],
        "token_present": False,
        "token_signature_checked": False,
    }
    if not raw:
        out["parse_error"] = "empty response"
        return out
    try:
        tag, resp, end = _read_tlv(raw, 0)
        if tag != 0x30:
            raise DERError(f"TimeStampResp must be a SEQUENCE (0x30), got 0x{tag:02x}")
        if end != len(raw):
            raise DERError(f"{len(raw) - end} trailing byte(s) after TimeStampResp")

        tag, info, j = _read_tlv(resp, 0)
        if tag != 0x30:
            raise DERError(f"PKIStatusInfo must be a SEQUENCE, got 0x{tag:02x}")

        tag, val, k = _read_tlv(info, 0)
        if tag != 0x02:
            raise DERError(f"PKIStatus must be an INTEGER, got 0x{tag:02x}")
        code = int.from_bytes(val, "big")
        out["pki_status"] = code
        out["pki_status_text"] = PKI_STATUS.get(code, f"unknown({code})")

        while k < len(info):
            tag, val, k = _read_tlv(info, k)
            if tag == 0x30:                       # PKIFreeText ::= SEQUENCE OF UTF8String
                texts = []
                m = 0
                while m < len(val):
                    t2, v2, m = _read_tlv(val, m)
                    if t2 == 0x0C:
                        texts.append(v2.decode("utf-8", "replace"))
                if texts:
                    out["status_string"] = " ".join(texts)
            elif tag == 0x03:                     # PKIFailureInfo ::= BIT STRING
                out["fail_info"] = [FAIL_INFO_BITS.get(b, f"bit{b}") for b in _bitstring_bits(val)]

        out["token_present"] = j < len(resp)

        if code in (0, 1):
            out["status"] = "ok" if out["token_present"] else "err"
            if not out["token_present"]:
                out["parse_error"] = "PKIStatus granted but no TimeStampToken present"
        else:
            out["status"] = "err"
    except DERError as e:
        out["status"] = "unverifiable"
        out["parse_error"] = str(e)
    except Exception as e:                        # noqa: BLE001 - reported, never swallowed
        out["status"] = "unverifiable"
        out["parse_error"] = f"{type(e).__name__}: {e}"
    return out


def parse_tsr_file(path: Path) -> dict:
    if not path.exists():
        return {"status": "unverifiable", "bytes": 0, "parse_error": f"no such file: {path}",
                "pki_status": None, "pki_status_text": None, "status_string": None,
                "fail_info": [], "token_present": False, "token_signature_checked": False}
    return parse_timestamp_resp(path.read_bytes())


NOTE_ERR = ("No RFC 3161 token was issued: the TSA rejected the request. "
            "This record is NOT an external time anchor.")
NOTE_UNVERIFIABLE = ("The response could not be parsed as an RFC 3161 TimeStampResp. "
                     "No anchor is established.")
NOTE_OK = ("A TimeStampToken is present and the TSA reported granted. The token's "
           "signature has NOT been checked against the TSA certificate here; verify "
           "with `openssl ts -verify` before relying on it.")


def audit_anchor(anchor_path: Path) -> tuple[dict, dict]:
    """Return (anchor_json, corrected_tsa_block) — the block derived from the real bytes."""
    doc = json.loads(anchor_path.read_text())
    tsa = dict(doc.get("tsa") or {})
    tsr_ref = tsa.get("tsr") or ""
    candidates = [anchor_path.parent / Path(tsr_ref).name, Path(tsr_ref)]
    tsr_path = next((c for c in candidates if c.exists()), candidates[0])

    parsed = parse_tsr_file(tsr_path)
    note = {"ok": NOTE_OK, "err": NOTE_ERR}.get(parsed["status"], NOTE_UNVERIFIABLE)
    sibling = anchor_path.parent / Path(tsr_ref).name
    corrected = {
        "status": parsed["status"],
        "tsa": tsa.get("tsa"),
        "tsr": Path(tsr_ref).name if sibling.exists() else tsr_ref,
        "bytes": parsed["bytes"],
        "pki_status": parsed["pki_status"],
        "pki_status_text": parsed["pki_status_text"],
        "status_string": parsed.get("status_string"),
        "fail_info": parsed["fail_info"],
        "token_present": parsed["token_present"],
        "token_signature_checked": parsed["token_signature_checked"],
        "status_derived_by": "harness/mine/tsr_status.py: DER parse of the response, not byte count",
        "note": note,
    }
    if parsed.get("parse_error"):
        corrected["parse_error"] = parsed["parse_error"]
    return doc, corrected


def _selftest() -> int:
    ok = True

    def expect(name, cond, detail=""):
        nonlocal ok
        print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f" — {detail}" if not cond and detail else ""))
        ok = ok and cond

    # Reconstruct the exact 50 bytes the estate published as status "ok":
    # SEQUENCE{ PKIStatusInfo SEQUENCE{ INTEGER 2, PKIFreeText, PKIFailureInfo } }
    txt = b"Bad request format or system error."
    free = bytes([0x30, 2 + len(txt)]) + bytes([0x0C, len(txt)]) + txt
    info = bytes([0x02, 0x01, 0x02]) + free + bytes([0x03, 0x02, 0x02, 0x04])
    rejection = bytes([0x30, len(info) + 2, 0x30, len(info)]) + info

    r = parse_timestamp_resp(rejection)
    expect("rejection -> status err", r["status"] == "err", r["status"])
    expect("rejection -> PKIStatus 2 rejection", r["pki_status"] == 2 and r["pki_status_text"] == "rejection")
    expect("rejection -> statusString recovered", r["status_string"] == txt.decode(), str(r["status_string"]))
    expect("rejection -> failInfo badDataFormat", r["fail_info"] == ["badDataFormat"], str(r["fail_info"]))
    expect("rejection -> no token", r["token_present"] is False)

    # granted WITHOUT a token must NOT be reported ok.
    granted_no_token_info = bytes([0x02, 0x01, 0x00])
    g = parse_timestamp_resp(bytes([0x30, len(granted_no_token_info) + 2, 0x30,
                                    len(granted_no_token_info)]) + granted_no_token_info)
    expect("granted-but-tokenless -> err", g["status"] == "err", g["status"])

    # granted WITH a token body -> ok.
    tok = bytes([0x30, 0x03, 0x02, 0x01, 0x07])
    body = bytes([0x30, len(granted_no_token_info)]) + granted_no_token_info + tok
    ok_resp = bytes([0x30, len(body)]) + body
    o = parse_timestamp_resp(ok_resp)
    expect("granted-with-token -> ok", o["status"] == "ok", o["status"])
    expect("ok never claims a checked token signature", o["token_signature_checked"] is False)

    # garbage and empty must be unverifiable, never ok.
    for name, blob in (("garbage", b"NOT DER AT ALL"), ("empty", b""), ("truncated", bytes([0x30, 0x20, 0x02]))):
        v = parse_timestamp_resp(blob)
        expect(f"{name} -> unverifiable", v["status"] == "unverifiable", v["status"])

    print("  selftest:", "OK" if ok else "FAILED")
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tsr", help="path to a .tsr (RFC 3161 TimeStampResp)")
    ap.add_argument("--anchor", help="path to a kernel-anchor.json to audit")
    ap.add_argument("--rewrite", action="store_true", help="write the parsed status back into --anchor")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        return _selftest()
    if a.tsr:
        print(json.dumps(parse_tsr_file(Path(a.tsr)), indent=2))
        return 0
    if a.anchor:
        path = Path(a.anchor)
        doc, corrected = audit_anchor(path)
        recorded = (doc.get("tsa") or {}).get("status")
        print(f"anchor:   {path}")
        print(f"recorded: tsa.status = {recorded!r}")
        print(f"parsed:   tsa.status = {corrected['status']!r}  "
              f"(PKIStatus {corrected['pki_status']} {corrected['pki_status_text']}, "
              f"token_present={corrected['token_present']})")
        if corrected.get("status_string"):
            print(f"          statusString: {corrected['status_string']}")
        if corrected.get("fail_info"):
            print(f"          failInfo: {', '.join(corrected['fail_info'])}")
        drift = recorded != corrected["status"]
        if a.rewrite:
            doc["tsa"] = corrected
            doc["external_anchor"] = corrected["status"] == "ok"
            path.write_text(json.dumps(doc, indent=2) + "\n")
            print(f"rewrote:  {path} (external_anchor={doc['external_anchor']})")
            return 0
        if drift:
            print("MISMATCH: the recorded status is not the status the bytes carry.")
            return 1
        print("OK: recorded status matches the parsed bytes.")
        return 0

    ap.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
