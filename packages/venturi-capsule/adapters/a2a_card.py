# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""a2a_card: csoai.a2a-card-census v0.1.1 -> one capsule per SIGNED agent card.

declared = "this card is signed by the key it references": each signature's protected header (alg, kid, jku,
did in kid, embedded jwk present) read from the card bytes as served; observed = the v0.1.1 verification result
under the canonicalisation of the protocol version the card declares (A2A 8.4.3 for 1.x; served bytes for 0.x).
The differential carries the 0.1 -> 0.1.1 change and, for 0.x cards, what the 1.x rules would have said.
Source: --src = the v0.1.1 record dir (record.v0.1.1.json + data/cards.v0.1.1.jsonl.gz, signed);
--aux = the census card-bodies file (cards.jsonl.gz), pinned by the record's inputs sha256.
"""
import base64, collections, gzip, json, pathlib
import venturi_capsule as v
from adapters import PendingSource

NAME = "a2a_card"
KIND = "measurement.a2a_card_signature"
DEFAULT_BODIES = "/evac-bulk/census-a2a-2026-09-25/cards.jsonl.gz"
LIMITS = ["VERIFIED proves only that the key the card points to signed these bytes; it is not proof of identity",
          "FAILED or UNCHECKABLE is not evidence of malice; it may be a canonicalisation or key-publication mistake",
          "key documents were fetched once from one network location"]


def b64json(s):
    try:
        return json.loads(base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)))
    except Exception:
        return None


def declared_signatures(card_body):
    """What each signature on the served card says about its own key. Keys are described, never copied."""
    out = []
    for s in (card_body.get("signatures") or []):
        if not isinstance(s, dict):
            out.append({"shape": type(s).__name__}); continue
        ph = b64json(s["protected"]) if isinstance(s.get("protected"), str) else None
        hdr = s.get("header") if isinstance(s.get("header"), dict) else {}
        d = {"protected_header_parses": ph is not None}
        src = ph or {}
        for k in ("alg", "kid", "jku", "typ", "x5u"):
            if src.get(k) is not None:
                d[k] = src[k]
        kid = d.get("kid") or ""
        if isinstance(kid, str) and kid.startswith("did:"):
            d["did"] = kid.split("#")[0]
        jwk = src.get("jwk") or hdr.get("jwk")
        d["embedded_jwk"] = bool(jwk)
        if jwk:
            d["embedded_jwk_sha256"] = v.sha(v.canon(jwk))
        if ph is None:
            d["unprotected_fields"] = sorted(k for k in s if k != "signature")
        out.append(d)
    return out


def capsule_for(row, body, ev, ctx):
    rid = row["id"]
    changed = ctx["changes"].get(rid)
    sigs = declared_signatures(body) if body is not None else [{"card_body": "NOT_IN_BODIES_FILE"}]
    diff = {"sig_state_0_1": row.get("sig_state_0_1"), "sig_state_0_1_1": row["sig_state"],
            "changed_in_0_1_1": row.get("sig_state_0_1") != row["sig_state"],
            "declared_major": row.get("declared_major"), "rule_applied": row.get("canonicalisation_rule")}
    if row.get("declared_major") == "0.x":
        diff["note_0x"] = ("declares 0.x: the v0.3.0 spec defines no canonicalisation step, so the card is judged over "
                           "JCS(served card minus signatures); under the 1.x (8.4.3) rules the result would be "
                           f"{row.get('sig_state_under_1x_rules')}")
        diff["sig_state_under_1x_rules"] = row.get("sig_state_under_1x_rules")
    if ev:
        diff["alt_serialisations_verifying"] = [s.get("alt_serialisations_verifying") for s in ev.get("signatures") or []]
        diff["alt_serialisations_note"] = "diagnostic only, never a pass"
    observed = {"sig_state": row["sig_state"], "verify_results": row.get("verify_results"),
                "key_source_kinds": row.get("key_source_kinds"), "algs": row.get("algs"),
                "canonicalisation_rule": row.get("canonicalisation_rule")}
    if ev:
        observed["per_signature"] = [{k: s.get(k) for k in ("key_source", "key_url", "result", "reason")} for s in ev.get("signatures") or []]
    lim = list(LIMITS)
    if "embedded_jwk" in (row.get("key_source_kinds") or []):
        lim.append("embedded_jwk: the card vouches for its own key - integrity, not identity")
    cp = None
    if changed:
        cp = {"record_schema": ctx["record_schema"], "record_version": ctx["record_version"], "record_sha256": ctx["record_sha256"],
              "supersedes_record_sha256": ctx["supersedes_sha256"], "corrected_utc": ctx["corrected_utc"],
              "from": changed.get("from"), "to": changed.get("to"), "why": changed.get("why")}
    return v.make_capsule(
        kind=KIND, subject_id=row.get("card_url") or f"a2aregistry:{rid}",
        claim={"statement": "the agent card is signed by the key it references", "listing_id": rid, "host": row.get("host"),
               "card_source": row.get("card_source")},
        declared={"signatures": sigs, "n_signatures": row.get("n_signatures"),
                  "card_protocolVersion": row.get("card_protocolVersion"), "listed_protocolVersion": row.get("listed_protocolVersion")},
        observed=observed, differential=diff,
        sources={"card_sha256": row.get("card_sha256"), "card_bodies_file_sha256": ctx["bodies_sha256"],
                 "rows_file_sha256": ctx["rows_sha256"], "record_sha256": ctx["record_sha256"],
                 "record_signature_payload_sha256": ctx["sig_payload_sha256"], "correction_evidence_sha256": ctx["evidence_sha256"]},
        measurement_state=row["sig_state"], limitations=lim, observed_at=ctx["as_of"], correction_pointer=cp)


def capsules(src, stats, aux=None):
    d = pathlib.Path(src)
    rec_p, sig_p = d / "record.v0.1.1.json", d / "record.v0.1.1.signed.json"
    rows_p, ev_p = d / "data" / "cards.v0.1.1.jsonl.gz", d / "correction.v0.1.1.evidence.json"
    if not (rec_p.exists() and rows_p.exists()):
        raise PendingSource(f"no A2A census v0.1.1 record/rows under {d}")
    sig = v.verify_sidecar(rec_p, sig_p)
    if sig["state"] != "VERIFIES":
        raise SystemExit(f"SOURCE_SIGNATURE {sig}")
    rec = json.loads(rec_p.read_bytes())
    rows_sha = v.file_sha(rows_p)
    if rec["published_files"]["data/cards.v0.1.1.jsonl.gz"]["sha256"] != rows_sha:
        raise SystemExit("ROWS_NOT_PINNED")
    bodies_p = pathlib.Path(aux or DEFAULT_BODIES)
    bodies_sha = v.file_sha(bodies_p)
    if bodies_sha != rec["inputs"]["cards.jsonl.gz"]:
        raise SystemExit(f"BODIES_NOT_PINNED {bodies_sha}")
    ev = json.loads(ev_p.read_bytes()) if ev_p.exists() else {"rechecked": []}
    ev_by = {r["id"]: r for r in ev.get("rechecked") or []}
    ctx = {"record_schema": rec["schema"], "record_version": rec.get("record_version"), "record_sha256": v.file_sha(rec_p),
           "rows_sha256": rows_sha, "bodies_sha256": bodies_sha, "sig_payload_sha256": sig["payload_sha256"],
           "evidence_sha256": v.file_sha(ev_p) if ev_p.exists() else None,
           "supersedes_sha256": (rec.get("supersedes") or {}).get("sha256"), "corrected_utc": rec.get("corrected_utc"),
           "as_of": rec.get("as_of"),
           "changes": {r["id"]: r for r in rec["correction"]["rows_changed"]["rows"]}}
    signed = []
    with gzip.open(rows_p, "rt", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            stats.setdefault("listing_states", collections.Counter())[r.get("state")] += 1
            if r.get("n_signatures"):
                signed.append(r)
            elif r.get("state") == "CARD_SERVED":
                stats["served_unsigned"] = stats.get("served_unsigned", 0) + 1
    want = {r["id"] for r in signed}
    bodies = {}
    with gzip.open(bodies_p, "rt", encoding="utf-8") as f:
        for line in f:
            b = json.loads(line)
            if b["id"] in want:
                bodies[b["id"]] = (b["card_sha256"], json.loads(b["body"]))
    stats["source"] = {"record": str(rec_p), "record_version": rec.get("record_version"), "record_sha256": ctx["record_sha256"],
                       "record_signature": sig["state"], "record_signature_payload_sha256": sig["payload_sha256"],
                       "rows_file": str(rows_p), "rows_sha256": rows_sha, "card_bodies_file": str(bodies_p),
                       "card_bodies_sha256": bodies_sha, "hf_dataset": rec.get("hf_dataset"),
                       "hf_commit_of_v0_1_1": "4b6789fa20cfa256e62c8db59d03e62f026c4cc9"}
    for r in signed:
        cs, body = bodies.get(r["id"], (None, None))
        if cs is not None and cs != r.get("card_sha256"):
            raise SystemExit(f"CARD_SHA_MISMATCH {r['id']}")
        stats.setdefault("by_rule", collections.Counter())[f"{r.get('canonicalisation_rule')}:{r['sig_state']}"] += 1
        yield capsule_for(r, body, ev_by.get(r["id"]), ctx)


def meta(src, stats):
    return {"what_this_is": "A2A agent-card signatures: one capsule per signed card in the 2026-09-25 a2aregistry census (v0.1.1), "
                            "declared key reference vs the verification result under the card's declared protocol version.",
            "what_this_is_not": "Not identity, endorsement, ranking or approval of any agent. A VERIFIED card proves only that the key it "
                                "points to signed its bytes.",
            "source": stats.get("source"),
            "listing_states": dict(stats.get("listing_states") or {}),
            "served_unsigned_not_capsuled": stats.get("served_unsigned", 0),
            "capsules_by_rule_state": dict(sorted((stats.get("by_rule") or {}).items())),
            "observed_at_rule": "the census record's as_of (verification re-run over the same key documents in the v0.1.1 correction)"}
