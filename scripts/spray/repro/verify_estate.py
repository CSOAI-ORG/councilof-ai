#!/usr/bin/env python3
"""Verify one GSPC measurement card end to end — signature, evidence and grade.

    python3 verify_estate.py              # the real card: every check must PASS
    python3 verify_estate.py --tamper     # one byte altered: the same checks must FAIL

No dependencies. Python 3.8+. Ed25519 verification is implemented here from RFC 8032
so that nothing has to be installed and nothing in this file has to be trusted on
someone else's say-so: read it, then run it.

WHAT IS CHECKED, and what each check does NOT prove:

  1  id == sha256(canonical(body))          the id addresses these exact body bytes.
                                            Proves nothing about who wrote them.
  2  Ed25519(sig, canonical(body), pk)      the body was signed by the key the DID
                                            document publishes at did:web:csoai.org.
                                            Proves the signer held the key; it does not
                                            make the measurement correct.
  3  sha256(bank)  == body.evidence.bank_sha256
     sha256(items) == body.evidence.items_sha256
                                            the run was graded against these exact
                                            frozen bytes, still served today.
  4  prompt_sha256 recomputed per item      the prompt in evidence is the prompt the
                                            published composer builds from the bank.
  5  observed re-derived from raw_output    the published label-reading rule, re-run on
                                            the recorded model output, agrees with the
                                            recorded label on every item.
  6  accuracy == round(hits / n, 4)         the number on the card is the number the
                                            rows produce. n counts ANSWERED items:
                                            an unreadable reply leaves n; it is not
                                            scored as a wrong answer.

None of this is a certification. It is a check that published bytes are internally
consistent and signed. A signature over a wrong measurement is a signed wrong
measurement.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
import urllib.request

SITE = "https://councilof.ai"
DID_URL = "https://csoai.org/.well-known/did.json"
DEFAULT_CARD = f"{SITE}/interop/mill-cards-signed/signed-affect-0377d52b937b.json"
UA = {"User-Agent": "csoai-estate-repro/1.0"}

# ---------------------------------------------------------------- Ed25519 (RFC 8032)
_P = 2 ** 255 - 19
_L = 2 ** 252 + 27742317777372353535851937790883648493
_D = -121665 * pow(121666, _P - 2, _P) % _P
_I = pow(2, (_P - 1) // 4, _P)


def _recover_x(y: int, sign: int):
    if y >= _P:
        return None
    xx = (y * y - 1) * pow(_D * y * y + 1, _P - 2, _P)
    x = pow(xx, (_P + 3) // 8, _P)
    if (x * x - xx) % _P != 0:
        x = x * _I % _P
    if (x * x - xx) % _P != 0:
        return None
    if x % 2 != sign:
        x = _P - x
    return x


_BASE_Y = 4 * pow(5, _P - 2, _P) % _P
_BASE = (_recover_x(_BASE_Y, 0), _BASE_Y, 1, _recover_x(_BASE_Y, 0) * _BASE_Y % _P)


def _add(P, Q):
    A = (P[1] - P[0]) * (Q[1] - Q[0]) % _P
    B = (P[1] + P[0]) * (Q[1] + Q[0]) % _P
    C = 2 * P[3] * Q[3] * _D % _P
    D = 2 * P[2] * Q[2] % _P
    E, F, G, H = B - A, D - C, D + C, B + A
    return (E * F % _P, G * H % _P, F * G % _P, E * H % _P)


def _mul(s: int, P):
    Q = (0, 1, 1, 0)
    while s > 0:
        if s & 1:
            Q = _add(Q, P)
        P = _add(P, P)
        s >>= 1
    return Q


def _decompress(b: bytes):
    if len(b) != 32:
        return None
    y = int.from_bytes(b, "little")
    sign = y >> 255
    y &= (1 << 255) - 1
    x = _recover_x(y, sign)
    if x is None:
        return None
    return (x, y, 1, x * y % _P)


def _equal(P, Q) -> bool:
    if (P[0] * Q[2] - Q[0] * P[2]) % _P != 0:
        return False
    return (P[1] * Q[2] - Q[1] * P[2]) % _P == 0


def ed25519_verify(pubkey: bytes, msg: bytes, sig: bytes) -> bool:
    """True iff sig is a valid Ed25519 signature of msg under pubkey."""
    if len(sig) != 64:
        return False
    A = _decompress(pubkey)
    if A is None:
        return False
    R = _decompress(sig[:32])
    if R is None:
        return False
    S = int.from_bytes(sig[32:], "little")
    if S >= _L:
        return False
    h = int.from_bytes(hashlib.sha512(sig[:32] + pubkey + msg).digest(), "little") % _L
    return _equal(_mul(S, _BASE), _add(R, _mul(h, A)))


# ------------------------------------------------- the published canonicalisation rule
def canonical_body_bytes(body: dict) -> bytes:
    """harness/gspc-top100/mill_hub_queue.py :: canonical_body_bytes — the mill's rule.

    sorted keys, compact separators, ensure_ascii=True, UTF-8. The card states the rule
    itself in body-level `preimage_rule`; this function IS that rule, not a guess at it.
    """
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


# ------------------------------------------------------- the published grading rules
_THINK = re.compile(r"<think>.*?</think>", re.S | re.I)
_ANSWER_PREFIX = re.compile(r"^\s*(?:answer|label|output)\s*[:\-]\s*", re.I)
_STRIP = " \t\r\n.,;:!?\"'`*_()[]{}<>"


def exact_label_menu(labels) -> list:
    """The answer menu an exact-label prompt may offer. A one-option menu is refused:
    a prompt that cannot be answered wrongly measures format compliance, not the axis."""
    raw = sorted({str(x) for x in labels if x})
    if len({x.strip().upper() for x in raw}) < 2:
        raise ValueError(f"menu has fewer than two distinct options: {raw}")
    return raw


def axis_prompt(axis: str, item: str, labels) -> str:
    labs = " | ".join(exact_label_menu(labels))
    return (f"You are scoring one frozen {axis} item.\n"
            f"Reply with EXACTLY ONE token from: {labs}\n\n"
            f"Item: {item}\n")


def read_label(txt: str, labels):
    """The label the model ACTUALLY answered, or None if it did not answer one.

    A substring test would let a model that merely restates the menu score a hit on
    every item. So the reply -- after stripping a <think> block, an Answer: prefix and
    surrounding punctuation -- must BE one of the labels. Anything else is not an
    answer, and is not a wrong answer either: the caller drops it from n."""
    allowed = {str(x).strip().upper() for x in labels if str(x).strip()}
    if not allowed:
        return None
    body = _THINK.sub(" ", txt or "")
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    for cand in ([lines[-1]] if lines else []) + [" ".join(lines)]:
        c = _ANSWER_PREFIX.sub("", cand).strip().strip(_STRIP).upper()
        if c in allowed:
            return c
    return None


# ------------------------------------------------------------------------- utilities
def fetch(url: str) -> bytes:
    if url.startswith(("http://", "https://")):
        return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
    return open(url, "rb").read()


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def b64url(s: str) -> bytes:
    import base64
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


class Report:
    def __init__(self, expect_pass: bool):
        self.rows, self.expect_pass = [], expect_pass

    def check(self, name: str, ok: bool, detail: str = "") -> bool:
        self.rows.append((name, ok, detail))
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  — {detail}" if detail else ""))
        return ok

    def finish(self) -> int:
        passed = sum(1 for _, ok, _ in self.rows if ok)
        total = len(self.rows)
        print(f"\n  {passed}/{total} checks passed")
        if self.expect_pass:
            print("  VERDICT: " + ("REPRODUCED — every check passed on the published bytes."
                                   if passed == total else
                                   "NOT REPRODUCED — a check failed on bytes that should verify."))
            return 0 if passed == total else 1
        failed = total - passed
        print("  VERDICT: " + (f"TAMPER DETECTED — {failed} check(s) failed on the altered byte, "
                               "which is the required outcome."
                               if failed else
                               "CONTROL BROKEN — an altered byte verified. The checks prove nothing."))
        return 0 if failed else 1


# ------------------------------------------------------------------------------ main
def run(card_url: str, tamper: bool) -> int:
    print(f"\n{'=' * 78}\nGSPC estate reproduction — {'TAMPERED CONTROL' if tamper else 'PUBLISHED BYTES'}\n{'=' * 78}")
    r = Report(expect_pass=not tamper)

    card_bytes = fetch(card_url)
    card = json.loads(card_bytes)
    body = card["body"]
    print(f"\ncard   {card_url}")
    print(f"       axis={body['axis']}  model={body['model']}  n={body['n']}  "
          f"accuracy={body.get('accuracy')}  status={body['status']}")
    print(f"       did={card['did']}  preimage_rule={card.get('preimage_rule')}\n")

    if tamper:
        # One byte, in the number a reader would quote. Nothing else is touched.
        old = body.get("accuracy")
        body["accuracy"] = round(float(old) + 0.0001, 4) if old is not None else 0.0001
        print(f"  TAMPER: body.accuracy {old} -> {body['accuracy']} (one field, one value)\n")

    preimage = canonical_body_bytes(body)

    # 1 — the id addresses these bytes
    r.check("id == sha256(canonical(body))", sha256(preimage) == card["id"],
            f"recomputed {sha256(preimage)[:16]}… vs card id {card['id'][:16]}…")

    # 2 — the signature verifies under the key the DID document publishes
    did_doc = json.loads(fetch(DID_URL))
    vm = next((v for v in did_doc["verificationMethod"] if v["id"] == card["did"]), None)
    if not r.check(f"DID document publishes {card['did']}", vm is not None, DID_URL):
        return r.finish()
    pk = b64url(vm["publicKeyJwk"]["x"])
    r.check("Ed25519 signature verifies over canonical(body)",
            ed25519_verify(pk, preimage, bytes.fromhex(card["signature"])),
            f"key {vm['publicKeyJwk']['x'][:16]}… from {DID_URL}")

    ev = body.get("evidence")
    if not ev:
        print("\n  This card carries no `evidence` block, so the grade cannot be re-run from it.")
        print("  That is a property of the card, not a failure: older mill cards pin a "
              "compute_evidence digest\n  without publishing the per-item rows. Pick a card "
              "with `evidence` to reproduce a grade.")
        return r.finish()

    base = f"{SITE}/interop/mill-evidence"
    bank_raw = fetch(f"{base}/{ev['bank_file']}")
    items_raw = fetch(f"{base}/{ev['items_file']}")

    # 3 — the frozen bytes the run was graded against are still the bytes served
    r.check("sha256(frozen bank) == body.evidence.bank_sha256",
            sha256(bank_raw) == ev["bank_sha256"], f"{ev['bank_file']}  {ev['bank_sha256'][:16]}…")
    r.check("sha256(item evidence) == body.evidence.items_sha256",
            sha256(items_raw) == ev["items_sha256"], f"{ev['items_file']}  {ev['items_sha256'][:16]}…")

    bank = [json.loads(l) for l in bank_raw.decode().splitlines() if l.strip()]
    rows = [json.loads(l) for l in items_raw.decode().splitlines() if l.strip()]
    labels = [b.get("expected") for b in bank]
    menu = exact_label_menu(labels)
    print(f"\n  bank   {len(bank)} frozen items, menu = {' | '.join(menu)}")
    print(f"  rows   {len(rows)} item-evidence rows, schema {rows[0]['schema']}")
    print(f"  run    temperature 0, seed 0, EXACT_LABEL max 128 tokens "
          f"(keyword banks 1024), route {rows[0].get('provider_route')}\n")

    # 4 — the prompt is the one the published composer builds
    prompt_ok = sum(1 for row in rows
                    if sha256(axis_prompt(body["axis"], bank[row["i"]]["item"], labels).encode())
                    == row["prompt_sha256"])
    r.check("every prompt_sha256 recomputes from bank + published composer",
            prompt_ok == len(rows), f"{prompt_ok}/{len(rows)} rows")

    # 5 — the recorded label is what the published rule reads from the recorded output
    label_ok, hits, answered, disagree = 0, 0, 0, []
    for row in rows:
        obs = read_label(row["raw_output"], menu)
        rec = row.get("observed")
        if (obs or None) == (rec or None):
            label_ok += 1
        else:
            disagree.append((row["i"], rec, obs))
        if obs is not None:
            answered += 1
            if obs == bank[row["i"]]["expected"]:
                hits += 1
    r.check("read_label(raw_output) agrees with the recorded `observed` on every item",
            label_ok == len(rows),
            f"{label_ok}/{len(rows)} rows" + (f"; first disagreement {disagree[0]}" if disagree else ""))

    # 6 — the number on the card is the number the rows produce
    recomputed = round(hits / answered, 4) if answered else None
    r.check("n == answered items (unreadable replies leave n, they are not wrong answers)",
            answered == body["n"], f"recomputed n={answered} vs card n={body['n']} "
                                   f"({len(rows) - answered} unreadable of {len(rows)})")
    r.check("accuracy == round(hits / n, 4)", recomputed == body.get("accuracy"),
            f"recomputed {recomputed} vs card {body.get('accuracy')} ({hits} hits / {answered})")
    return r.finish()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--card", default=DEFAULT_CARD, help="signed card URL or local path")
    ap.add_argument("--tamper", action="store_true",
                    help="alter one field of the body; every downstream check must then FAIL")
    ap.add_argument("--both", action="store_true", help="run the real case and the tampered control")
    a = ap.parse_args()
    if a.both:
        rc = run(a.card, tamper=False)
        return rc or run(a.card, tamper=True)
    return run(a.card, tamper=a.tamper)


if __name__ == "__main__":
    raise SystemExit(main())
