#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""card_v01_validate.py — card-v0.1 validator: schema shape + id recompute per the card's own rule.

Standalone on purpose (stdlib; `jsonschema` used when installed), so a stranger can copy this
one file. It checks two things and reports each separately:

  schema  the envelope/body against gspc-measurement-card-0.1 (the schema published at
          /verifier/gspc-measurement-card.schema.json, source packages/gspc-card-verifier/schema/)
          PASS | FAIL | NOT_APPLICABLE (a did-keyed card: the 0.1 schema requires `pubkey`)
  id      sha256(preimage) == card.id, with the preimage built by the rule the card declares
          MATCH | MISMATCH | UNCHECKABLE (a rule this file does not implement — it stops, it
          never canonicalises best-effort)

Verdict: FAIL if schema FAIL or id MISMATCH; UNCHECKABLE if the id could not be recomputed;
otherwise PASS. PASS is NOT a signature check — a schema-valid, id-consistent card can still be
a forgery. Signature: tools/verify/csoai_verify.py (or packages/gspc-card-verifier).

Rules implemented (the two in the published corpora):
  RULE_PY  json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
           — also the default when a card declares no rule (card_index.json → verification)
  RULE_JS  "sha256(canonical body)" — sorted compact JSON, strings UTF-8 literal, integral
           floats rendered as integers (ECMAScript Number::toString), exponent forms refused

Exit: 0 all PASS · 1 any FAIL (or a tamper control that was not detected) · 2 any UNCHECKABLE / usage.

  python3 card_v01_validate.py card.json [...]
  python3 card_v01_validate.py --index https://councilof.ai/signed/card_index.json [--limit N]
  python3 card_v01_validate.py --index ... --tamper-control   # each card mutated must FAIL
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

RULE_PY = "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')"
RULE_JS = "sha256(canonical body)"
UA = "csoai-card-v01-validate/0.1 (+https://councilof.ai/verify)"
HERE = Path(__file__).resolve().parent
LOCAL_SCHEMA = HERE.parents[1] / "packages" / "gspc-card-verifier" / "schema" / "gspc-measurement-card.schema.json"
REMOTE_SCHEMA = "https://councilof.ai/verifier/gspc-measurement-card.schema.json"


class Uncheckable(Exception):
    pass


def fetch(src: str) -> bytes:
    if src.startswith(("https://", "http://")):
        req = urllib.request.Request(src, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()
    return Path(src).read_bytes()


def preimage_py(body) -> bytes:
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def preimage_js(body) -> bytes:
    def emit(v) -> bytes:
        if v is None:
            return b"null"
        if v is True:
            return b"true"
        if v is False:
            return b"false"
        if isinstance(v, str):
            return json.dumps(v, ensure_ascii=False).encode("utf-8")
        if isinstance(v, int):
            return str(v).encode("ascii")
        if isinstance(v, float):
            if v != v or v in (float("inf"), float("-inf")):
                raise Uncheckable("non-finite number has no canonical form")
            if v == 0 or (v.is_integer() and abs(v) < 1e21):
                return str(int(v)).encode("ascii")
            r = repr(v)
            if "e" in r.lower():
                raise Uncheckable("exponent-form number: Python and ECMAScript formatting may disagree")
            return r.encode("ascii")
        if isinstance(v, list):
            return b"[" + b",".join(emit(x) for x in v) + b"]"
        if isinstance(v, dict):
            return b"{" + b",".join(emit(k) + b":" + emit(v[k]) for k in sorted(v)) + b"}"
        raise Uncheckable(f"unsupported JSON type {type(v).__name__}")

    return emit(body)


def preimage_for(card: dict) -> tuple[bytes, str, bool]:
    """(preimage bytes, rule used, rule_declared). Raises Uncheckable for unknown rules."""
    declared = "preimage_rule" in card
    rule = card.get("preimage_rule", RULE_PY)
    if rule == RULE_PY:
        return preimage_py(card["body"]), rule, declared
    if rule == RULE_JS:
        return preimage_js(card["body"]), rule, declared
    raise Uncheckable(f"preimage_rule not implemented here: {rule!r}")


def load_schema():
    try:
        return json.loads(LOCAL_SCHEMA.read_text(encoding="utf-8")), str(LOCAL_SCHEMA)
    except OSError:
        return json.loads(fetch(REMOTE_SCHEMA)), REMOTE_SCHEMA


def schema_check(card: dict, schema: dict) -> tuple[str, list[str]]:
    if "pubkey" not in card and "did" in card:
        return "NOT_APPLICABLE", ["did-keyed card: gspc-measurement-card-0.1 requires a raw `pubkey`; id is still recomputed"]
    try:
        import jsonschema  # type: ignore

        errs = sorted(jsonschema.Draft202012Validator(schema).iter_errors(card), key=lambda e: list(e.path))
        msgs = [f"{'/'.join(str(p) for p in e.path) or '$'}: {e.message[:160]}" for e in errs]
        return ("FAIL" if msgs else "PASS"), msgs
    except ImportError:
        pass
    # Fallback without jsonschema: the load-bearing subset (required keys, hex shapes, body kind).
    import re

    msgs = []
    for k in schema.get("required", []):
        if k not in card:
            msgs.append(f"$: missing required {k}")
    for k, pat in (("id", r"^[0-9a-f]{64}$"), ("pubkey", r"^[0-9a-f]{64}$"), ("signature", r"^[0-9a-f]{128}$")):
        if k in card and not (isinstance(card[k], str) and re.match(pat, card[k])):
            msgs.append(f"{k}: does not match {pat}")
    body = card.get("body")
    if not isinstance(body, dict):
        msgs.append("body: not an object")
    else:
        for k in schema["$defs"]["body"].get("required", []):
            if k not in body:
                msgs.append(f"body: missing required {k}")
        if body.get("kind") != "gspc.measurement-card":
            msgs.append("body/kind: not gspc.measurement-card")
    return ("FAIL" if msgs else "PASS"), msgs


def validate(card, schema: dict) -> dict:
    out = {"schema": None, "schema_errors": [], "id": None, "rule": None, "rule_declared": None, "verdict": None}
    if not isinstance(card, dict) or not isinstance(card.get("body"), dict):
        out.update(schema="FAIL", schema_errors=["not a card: no object `body`"], id="UNCHECKABLE", verdict="UNCHECKABLE")
        return out
    out["schema"], out["schema_errors"] = schema_check(card, schema)
    try:
        pre, rule, declared = preimage_for(card)
        out["rule"], out["rule_declared"] = rule, declared
        out["recomputed_id"] = hashlib.sha256(pre).hexdigest()
        out["id"] = "MATCH" if out["recomputed_id"] == card.get("id") else "MISMATCH"
    except Uncheckable as e:
        out["id"], out["id_reason"] = "UNCHECKABLE", str(e)
    if out["schema"] == "FAIL" or out["id"] == "MISMATCH":
        out["verdict"] = "FAIL"
    elif out["id"] == "UNCHECKABLE":
        out["verdict"] = "UNCHECKABLE"
    else:
        out["verdict"] = "PASS"
    return out


def tamper(card: dict) -> dict:
    """Return a copy with one body value changed — the control that MUST fail."""
    t = copy.deepcopy(card)
    body = t["body"]
    for k in sorted(body):
        v = body[k]
        if isinstance(v, bool):
            continue
        if isinstance(v, (int, float)):
            body[k] = v + 1
            return t
    for k in sorted(body):
        if isinstance(body[k], str):
            body[k] = body[k] + " "
            return t
    body["tampered"] = True
    return t


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="card-v0.1 validator (schema + id recompute). Not a signature check.")
    ap.add_argument("cards", nargs="*", help="card files or URLs")
    ap.add_argument("--index", help="card_index.json path or URL; validates every listed card_url")
    ap.add_argument("--limit", type=int, default=0, help="only the first N index entries")
    ap.add_argument("--tamper-control", action="store_true", help="also mutate each card; the mutation must FAIL")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)

    schema, schema_src = load_schema()
    targets: list[tuple[str, str | None]] = [(c, None) for c in a.cards]
    if a.index:
        idx = json.loads(fetch(a.index))
        base = a.index if a.index.startswith("http") else "https://councilof.ai/signed/card_index.json"
        entries = idx.get("cards", [])
        if idx.get("n_cards") is not None and idx["n_cards"] != len(entries):
            print(f"index: n_cards {idx['n_cards']} != cards[] {len(entries)}", file=sys.stderr)
            return 1
        for e in entries[: a.limit or None]:
            targets.append((urljoin(base, e["card_url"]), e.get("card")))
    if not targets:
        ap.print_usage(sys.stderr)
        return 2

    results, worst = [], 0
    counts = {"PASS": 0, "FAIL": 0, "UNCHECKABLE": 0}
    tamper_undetected = 0
    for src, listed_id in targets:
        try:
            card = json.loads(fetch(src))
        except Exception as e:  # unreadable is not a verdict on the card
            r = {"src": src, "verdict": "UNCHECKABLE", "reason": f"unreadable: {type(e).__name__}"}
        else:
            r = {"src": src, **validate(card, schema)}
            if listed_id is not None and card.get("id") != listed_id:
                r["verdict"], r["index_mismatch"] = "FAIL", f"index lists {listed_id}, card id is {card.get('id')}"
            if a.tamper_control and isinstance(card, dict) and isinstance(card.get("body"), dict):
                tv = validate(tamper(card), schema)
                r["tamper_control"] = "DETECTED" if tv["verdict"] == "FAIL" else f"NOT_DETECTED({tv['verdict']})"
                tamper_undetected += r["tamper_control"] != "DETECTED"
        counts[r["verdict"]] += 1
        results.append(r)
        if not a.json:
            extra = f" tamper={r['tamper_control']}" if "tamper_control" in r else ""
            why = "; ".join(r.get("schema_errors", [])[:2]) or r.get("id_reason") or r.get("index_mismatch") or r.get("reason") or ""
            print(f"{r['verdict']:<11} schema={r.get('schema')} id={r.get('id')}{extra} {src}" + (f"  — {why}" if why and r["verdict"] != "PASS" else ""))

    summary = {"schema_source": schema_src, "counts": counts, "total": len(results), "tamper_undetected": tamper_undetected if a.tamper_control else None,
               "not_established": "A PASS is shape + id consistency only. It is not a signature check and not a statement that the measurement is correct."}
    if a.json:
        print(json.dumps({"summary": summary, "results": results}, indent=1))
    else:
        print(f"\nPASS {counts['PASS']} · FAIL {counts['FAIL']} · UNCHECKABLE {counts['UNCHECKABLE']} of {len(results)}"
              + (f" · tamper controls undetected {tamper_undetected}" if a.tamper_control else "") + f"  (schema: {schema_src})")
    if counts["FAIL"] or tamper_undetected:
        return 1
    return 2 if counts["UNCHECKABLE"] else 0


if __name__ == "__main__":
    sys.exit(main())
