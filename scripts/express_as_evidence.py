#!/usr/bin/env python3
"""One evidence object. Four producers. No invented fields.

Every defect found in this estate on 2026-09-17 was the same defect wearing different
clothes: ONE CONCEPT WITH MORE THAN ONE SPELLING.

  * three card corpora, three counts, one word ("cards");
  * a signed index using axis ids the board does not use, so eight MEASURED axes read
    as missing cards;
  * `graded_n` meaning one thing on the pod path and nothing on the hub path;
  * `n` appearing TWICE in the same mill card, at body.n and at top level;
  * MEASURED decided by `n >= 30` and nothing else, so a card that discarded 75.4% of
    its attempts published as MEASURED;
  * a public root re-derived rather than appended.

This is the cure, and it is deliberately NOT a new surface. It adds no endpoint, no
server and no route. It is a reader: thin adapters at the edges, one vocabulary in the
middle. Each adapter maps ONE producer's spelling onto the shared object and is forbidden
to invent anything the producer does not emit.

THE TWO RULES THAT MAKE IT HONEST

  1. ABSENCE IS RECORDED, NEVER FILLED. A producer that does not emit a run id gets
     {"state": "ABSENT", ...} with the reason. It never gets null, "", 0, or "unknown"
     dressed up as a value. Zero-filling is how `graded_n` came to mean nothing.

  2. AN UNCHECKABLE ADMISSION IS REFUSED, NOT RECORDED. If an artifact asserts an
     admission decision (MEASURED) but omits the quantity that decision is made from,
     the object is REFUSED. Recording it would launder an unverifiable claim into a
     clean schema, which is worse than not having the schema.

FOUR KINDS OF TIME, NEVER COLLAPSED
  observed_at   — when the run happened
  published_at  — when the bytes appeared on a surface
  read_at       — when THIS object was built (the only one this script can know first-hand)
  witnessed_at  — when an independent party cosigned. Always ABSENT today: no witness
                  exists, and the public root is re-derived rather than appended, so
                  there is nothing for a witness to be consistent with.

Usage:
  python3 scripts/express_as_evidence.py --samples          # express all four live
  python3 scripts/express_as_evidence.py --self-test        # the refusal controls
  python3 scripts/express_as_evidence.py --url /signed/cards/<id>.json
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import urllib.request

BASE = "https://councilof.ai"
SCHEMA = "csoai.evidence-object/0.1"


class Refused(Exception):
    """Raised when an artifact cannot be expressed without inventing a binding."""


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get(path: str):
    req = urllib.request.Request(
        path if path.startswith("http") else BASE + path,
        headers={"User-Agent": "csoai-evidence-fabric"},  # the zone 403s urllib's default
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def absent(reason: str, would_be: str | None = None) -> dict:
    """The only legal way to not have something."""
    out = {"state": "ABSENT", "reason": reason}
    if would_be:
        out["would_be_called"] = would_be
    return out


def present(value, source: str) -> dict:
    return {"state": "PRESENT", "value": value, "source": source}


# ── the object ───────────────────────────────────────────────────────────────
REQUIRED = ("subject", "instrument", "run", "observation", "admission",
            "signature", "corpus_inclusion", "witness", "publication", "time")


def evidence(**parts) -> dict:
    missing = [k for k in REQUIRED if k not in parts]
    if missing:
        raise Refused(f"evidence object missing required bindings: {', '.join(missing)}")

    adm = parts["admission"]
    if adm.get("state") == "PRESENT":
        decision = adm["value"].get("decision")
        inputs = adm["value"].get("decided_from") or {}
        unavailable = [k for k, v in inputs.items()
                       if isinstance(v, dict) and v.get("state") == "ABSENT"]
        if decision and unavailable:
            raise Refused(
                f"artifact asserts admission decision {decision!r} but the quantity it is "
                f"decided from is not published: {', '.join(unavailable)}. Recording this "
                f"would launder an unverifiable claim — refused rather than filled in."
            )
    return {"schema": SCHEMA, **{k: parts[k] for k in REQUIRED},
            "not_a_certificate": True,
            "what_this_is_not": (
                "This object restates what a producer published, in one vocabulary. It "
                "does not re-measure, does not verify signatures, and does not grade. An "
                "ABSENT field means the producer did not publish it — not that it is zero."
            )}


def times(observed=None, published=None, witnessed=None) -> dict:
    return {
        "observed_at": observed or absent("producer publishes no run timestamp"),
        "published_at": published or absent("surface publishes no per-artifact publication time"),
        "read_at": present(now(), "this process"),
        "witnessed_at": absent(
            "no independent witness exists; the public root is re-derived rather than "
            "appended, so there is nothing for a witness to be consistent with "
            "(docs/reconciliation/PUBLIC-ROOT-IS-NOT-A-LOG-2026-09-17.md)"),
    }


# ── adapters: one per producer spelling, each forbidden to invent ────────────
def from_mill_card(doc: dict, src: str) -> dict:
    """public/interop/mill-cards-signed/signed-<axis>-<short>.json"""
    b = doc.get("body") or {}
    ce = b.get("compute_evidence") or {}
    n_admitted = b.get("n")
    parse_ex = ce.get("parse_errors_excluded")
    transport_ex = ce.get("transport_errors_excluded")
    attempted = (n_admitted + parse_ex + transport_ex
                 if None not in (n_admitted, parse_ex, transport_ex) else None)

    # One concept, two spellings, in one file: n at body.n AND at top level.
    n_top = doc.get("n")
    dup = ({"field": "n", "spellings": ["body.n", "n"],
            "agree": n_top == n_admitted} if n_top is not None else None)

    return evidence(
        subject=present({"axis": b.get("axis"), "model": b.get("model")}, f"{src} → body.axis, body.model"),
        instrument=present({
            "instrument_sha256": ce.get("instrument_sha256"),
            "bank_sha256": ce.get("bank_sha256"),
            "items_sha256": ce.get("items_sha256"),
            "model_manifest_digest": ce.get("model_manifest_digest"),
        }, f"{src} → body.compute_evidence") if ce else absent("card carries no compute_evidence"),
        run=present({"run_id": ce.get("run_id")}, f"{src} → body.compute_evidence.run_id")
            if ce.get("run_id") else absent("card carries no run id"),
        observation=present({
            "accuracy": b.get("accuracy"),
            "n_admitted": n_admitted,
            "n_attempted": attempted if attempted is not None else "UNDERIVABLE",
            "excluded": {"parse_errors": parse_ex, "transport_errors": transport_ex},
            "discarded_fraction": (round(1 - n_admitted / attempted, 4)
                                   if attempted else "UNDERIVABLE"),
        }, f"{src} → body.accuracy, body.n, body.compute_evidence"),
        admission=present({
            "decision": b.get("status"),
            "rule": "n >= 30",
            "rule_source": "scripts/sign_mill_cards.py:192 — the ONLY predicate; the "
                           "exclusion ratio is never consulted",
            "decided_from": {"n_admitted": present(n_admitted, f"{src} → body.n")
                             if n_admitted is not None
                             else absent("card asserts a status but publishes no n")},
            "rule_does_not_consider": ["exclusion ratio", "n_attempted", "parse errors"],
        }, f"{src} → body.status"),
        signature=present({
            "alg": doc.get("alg"), "did": doc.get("did"),
            "signature": (doc.get("signature") or "")[:32] + "…",
            "authority_state": "BOARD_KEY_CLAIMED_did:web:csoai.org#board-attestation-1",
            "authority_note": "this object does not verify the signature; it records what "
                              "the artifact claims",
        }, f"{src} → alg, did, signature"),
        corpus_inclusion=present({
            "corpus": "mill card-root", "root": "public/interop/card-root-2026-09-14.json",
            "note": "a SEPARATE corpus from the public root and from the signed card index; "
                    "never add the three",
        }, "public/interop/card-root-2026-09-14.json → leaves[]"),
        witness=absent("no witness protocol exists for any CSOAI corpus"),
        publication=present({"path": src}, "this fetch"),
        time=times(observed=absent("mill card carries no observation timestamp; run_id "
                                   "embeds one but the card does not publish it as a time")),
    ) | ({"one_concept_two_spellings": dup} if dup else {})


def from_chain_card(doc: dict, src: str) -> dict:
    """/signed/cards/<sha>.json — the signed card index corpus."""
    b = doc.get("body") or {}
    return evidence(
        subject=present({"axis": b.get("axis"), "model": b.get("model")}, f"{src} → body.axis, body.model"),
        instrument=absent("chain card publishes no instrument, bank or items digest",
                          would_be="compute_evidence"),
        run=absent("chain card publishes no run id", would_be="run_id"),
        observation=present({
            "accuracy": b.get("accuracy"),
            "n_admitted": "ABSENT — this corpus does not publish n",
            "n_attempted": "ABSENT",
            "excluded": "ABSENT",
        }, f"{src} → body.accuracy"),
        # No per-card admission decision is asserted, so nothing is refused here.
        # body.public_framing is a BOARD-level claim, not this card's admission.
        admission=absent(
            "chain card asserts no per-card admission decision. body.public_framing says "
            f"{b.get('public_framing')!r}, which is a board-level claim the live board now "
            "supersedes (23 axis · 22 measured) — and it is signed, so it cannot be edited"),
        signature=present({
            "alg": doc.get("alg"), "key": doc.get("pubkey"),
            "preimage_rule": doc.get("preimage_rule"),
            "authority_state": "CARD_ATTESTATION_KEY_CLAIMED",
            "authority_note": "kid card-attestation-1 per the index; not verified here",
        }, f"{src} → alg, pubkey, preimage_rule"),
        corpus_inclusion=present({
            "corpus": "signed card index", "root": "/signed/card_index.json",
            "leaf": doc.get("id"),
            "note": "SEPARATE corpus; identifier overlap with the public root is 0",
        }, "/signed/card_index.json"),
        witness=absent("no witness protocol exists for any CSOAI corpus"),
        publication=present({"path": src}, "this fetch"),
        time=times(observed=present(b.get("created"), f"{src} → body.created")
                   if b.get("created") else None),
    )


def from_root_card(doc: dict, src: str) -> dict:
    """/cards/<prefix>.json — a public-root leaf (financial-fact style)."""
    card = doc.get("card") or doc
    payload = card.get("payload") or {}
    return evidence(
        subject=present({"subject": card.get("subject"), "surface": card.get("surface"),
                         "tags": card.get("tags")}, f"{src} → card.subject, card.surface, card.tags"),
        instrument=present({"source_urls": card.get("source_urls")}, f"{src} → card.source_urls")
                   if card.get("source_urls") else absent("card publishes no source urls"),
        run=absent("financial-fact cards are deterministic reads, not runs",
                   would_be="run_id"),
        observation=present({"payload": payload,
                             "unmeasured": card.get("unmeasured")},
                            f"{src} → card.payload"),
        admission=absent("card asserts no admission decision; it is a coverage harvest, "
                         "and root.json says so: 'Leaves MAY carry attestations — coverage "
                         "harvest, not grades. Not MEASURED.'"),
        signature=present({
            "did": card.get("did"), "sig_covers": card.get("sig_covers"),
            "digest_covers": card.get("digest_covers"),
            "authority_state": "BOARD_KEY_CLAIMED_did:web:csoai.org#board-attestation-1",
            "authority_note": "not verified here",
        }, f"{src} → card.did, card.sig_covers"),
        corpus_inclusion=present({
            "corpus": "public root", "root": "/root.json", "leaf": card.get("sha256"),
            "root_caveat": "the public root is RE-DERIVED on each publish, not appended: "
                           "0 of 27 transitions are append-only and roughly a quarter of "
                           "leaves are dropped per publish. Inclusion is valid only against "
                           "the root it names.",
        }, "/root.json → card_sha256[]"),
        witness=absent("no witness protocol exists for any CSOAI corpus"),
        publication=present({"path": src}, "this fetch"),
        time=times(observed=present(card.get("as_of"), f"{src} → card.as_of")
                   if card.get("as_of") else None),
    )


def from_board_axis(axis: dict, src: str) -> dict:
    """/api/gspc → axes[] — the board's own row for an axis."""
    return evidence(
        subject=present({"axis": axis.get("axis"), "family": axis.get("family"),
                         "kind": axis.get("kind")}, f"{src} → axes[].axis"),
        instrument=present({"bench": axis.get("bench"), "task": axis.get("task"),
                            "dataset": axis.get("dataset")}, f"{src} → axes[].bench, task, dataset"),
        run=absent("the board row carries no run id; measured_on is board-wide prose",
                   would_be="run_id"),
        observation=present({
            "n_admitted": axis.get("n"),
            "n_attempted": "ABSENT — the board publishes the numerator only",
            "fleet_mean": axis.get("fleet_mean"), "mean_harm": axis.get("mean_harm"),
            "separation": axis.get("separation"),
        }, f"{src} → axes[].n, fleet_mean, mean_harm, separation"),
        admission=present({
            "decision": axis.get("status"),
            "rule": "board ruling; not a per-row predicate published on the row",
            "rule_source": "ABSENT on the row itself",
            "decided_from": {"n_admitted": present(axis.get("n"), f"{src} → axes[].n")
                             if axis.get("n") is not None
                             else absent("row asserts a status but publishes no n")},
        }, f"{src} → axes[].status"),
        signature=present({
            "signer": "did:web:csoai.org#board-attestation-1",
            "scope": "integrity of the board snapshot as published — NOT a re-measurement",
            "authority_state": "BOARD_SNAPSHOT_ATTESTATION_CLAIMED",
        }, f"{src} → site_attestation"),
        corpus_inclusion=absent(
            "a board row is not a card and is in no card corpus. This is the binding that "
            "does not exist: the board asserts MEASURED for 22 axes while 9 of them have no "
            "card in either corpus (docs/reconciliation/axis-corpus-reconciliation-2026-09-17.json)"),
        witness=absent("no witness protocol exists for any CSOAI corpus"),
        publication=present({"path": src}, "this fetch"),
        time=times(observed=present(
            (axis.get("historical_measurement_record") or {}).get("date")
            if isinstance(axis.get("historical_measurement_record"), dict) else None,
            f"{src} → axes[].historical_measurement_record") if isinstance(
                axis.get("historical_measurement_record"), dict) else None),
    )


# ── dispatch ─────────────────────────────────────────────────────────────────
def express(doc: dict, src: str) -> dict:
    """Pick the adapter by SHAPE, never by guessing from the path."""
    if isinstance(doc, dict) and "card" in doc and isinstance(doc.get("card"), dict):
        return from_root_card(doc, src)
    body = doc.get("body") if isinstance(doc, dict) else None
    if isinstance(body, dict):
        if "compute_evidence" in body or "status" in body:
            return from_mill_card(doc, src)
        return from_chain_card(doc, src)
    raise Refused(f"no adapter for this shape: keys={sorted(doc)[:8]}")


SAMPLES = {
    "mill_card (pod/hub mill, worst-case exclusion)":
        "/interop/mill-cards-signed/signed-care-26e1f64e1436.json",
    "chain_card (signed card index)": None,   # resolved from the live index
    "root_card (financial fact)": None,       # resolved from the live root
    "board_axis": None,                       # resolved from /api/gspc
}


def run_samples() -> dict:
    out, refused = {}, {}

    # 1. mill card — served from the repo path under /interop/
    try:
        src = "/interop/mill-cards-signed/signed-care-26e1f64e1436.json"
        out["mill_card"] = express(get(src), src)
    except Refused as e:
        refused["mill_card"] = str(e)
    except Exception as e:  # noqa: BLE001
        refused["mill_card"] = f"{type(e).__name__}: {e}"

    # 2. chain card — first entry of the live signed index
    try:
        idx = get("/signed/card_index.json")
        src = idx["cards"][0]["card_url"]
        out["chain_card"] = express(get(src), src)
    except Refused as e:
        refused["chain_card"] = str(e)

    # 3. root card — first leaf of the live public root
    try:
        root = get("/root.json")
        src = f"/cards/{root['card_sha256'][0][:16]}.json"
        out["root_card"] = express(get(src), src)
    except Refused as e:
        refused["root_card"] = str(e)

    # 4. board axis — the first MEASURED row
    try:
        board = get("/api/gspc")
        axis = next(a for a in board["axes"] if a.get("status") == "MEASURED")
        out["board_axis"] = from_board_axis(axis, "/api/gspc")
    except Refused as e:
        refused["board_axis"] = str(e)

    return {"expressed": out, "refused": refused}


def self_test() -> int:
    """The controls. Each must REFUSE, and each must refuse for the stated reason."""
    failures = []

    def must_refuse(name: str, doc: dict, src: str, expect: str):
        try:
            express(doc, src)
        except Refused as e:
            if expect in str(e):
                print(f"PASS  {name}: refused — {str(e)[:96]}…")
                return
            failures.append(f"{name}: refused for the wrong reason: {e}")
            return
        failures.append(f"{name}: EXPRESSED an artifact it should have refused")

    # Control 1 — the load-bearing one. A card that asserts MEASURED but publishes no n.
    # This is not hypothetical: the chain corpus publishes no n at all, and if a status
    # were ever added to it without an n, this is the shape that would arrive.
    live = get("/interop/mill-cards-signed/signed-care-26e1f64e1436.json")
    stripped = json.loads(json.dumps(live))
    stripped["body"].pop("n", None)
    stripped.pop("n", None)
    must_refuse("admission without its input", stripped, "<mutated>",
                "the quantity it is decided from is not published")

    # Control 2 — an unknown shape is refused, not guessed at.
    must_refuse("unknown shape", {"hello": "world"}, "<synthetic>", "no adapter")

    # Control 3 — proof the refusal is not unconditional: the UNMUTATED card expresses.
    try:
        ok = express(live, "<live>")
        assert ok["schema"] == SCHEMA
        assert ok["admission"]["value"]["decision"] == "MEASURED"
        print("PASS  control: the unmutated card still expresses (refusal is conditional)")
    except Refused as e:
        failures.append(f"unmutated card was refused: {e}")

    # Control 4 — absence is never zero-filled.
    idx = get("/signed/card_index.json")
    chain = express(get(idx["cards"][0]["card_url"]), "<live chain card>")
    if chain["run"]["state"] != "ABSENT":
        failures.append("chain card run should be ABSENT")
    elif "reason" not in chain["run"]:
        failures.append("ABSENT without a reason")
    else:
        print("PASS  absence recorded with a reason, not zero-filled")

    # Control 5 — the four times never collapse into one.
    t = chain["time"]
    if not all(k in t for k in ("observed_at", "published_at", "read_at", "witnessed_at")):
        failures.append("the four times are not all present as separate fields")
    elif t["witnessed_at"]["state"] != "ABSENT":
        failures.append("witnessed_at must be ABSENT — no witness exists")
    else:
        print("PASS  four kinds of time kept separate; witnessed_at ABSENT")

    for f in failures:
        print(f"FAIL  {f}")
    print(f"\n{5 - len(failures)}/5 controls passed")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--samples", action="store_true", help="express the four live artifacts")
    ap.add_argument("--self-test", action="store_true", help="run the refusal controls")
    ap.add_argument("--url", help="express one artifact by path")
    ap.add_argument("--out", help="write the samples here")
    args = ap.parse_args()

    if args.self_test:
        return self_test()
    if args.url:
        try:
            print(json.dumps(express(get(args.url), args.url), indent=2, ensure_ascii=False))
        except Refused as e:
            print(f"REFUSED: {e}", file=sys.stderr)
            return 1
        return 0
    if args.samples:
        result = run_samples()
        doc = {
            "schema": "csoai.evidence-fabric-samples/0.1",
            "built_at": now(),
            "what_this_proves": (
                "four producers with four different vocabularies, expressed in ONE object "
                "without inventing a field any of them lacks"
            ),
            "adds_no_surface": "this is a reader. No endpoint, route or server was added.",
            **result,
        }
        text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
        if args.out:
            import pathlib
            pathlib.Path(args.out).write_text(text)
            print(f"wrote {args.out}")
        else:
            print(text)
        for name, obj in result["expressed"].items():
            n_absent = sum(1 for k in REQUIRED if obj[k].get("state") == "ABSENT")
            print(f"  {name:<12} expressed · {n_absent} of {len(REQUIRED)} bindings ABSENT")
        for name, why in result["refused"].items():
            print(f"  {name:<12} REFUSED · {why[:80]}")
        return 0

    ap.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
