#!/usr/bin/env python3
"""Generate the GSPC measurement vocabulary in every form this dataset publishes.

    python3 make_ontology.py --out .

One table below is the single source; context.jsonl, terms.jsonl, crosswalk.jsonl and
gspc.skos.ttl are all emitted from it, so they cannot drift apart. Edit the table, re-run,
publish. Never edit an emitted file.

Every crosswalk row carries a `mapping` state and a `basis`. Where no honest mapping
exists the row says NO_EQUIVALENT and says why — an absent mapping is a finding, not a
gap to be filled with the nearest stronger word.
"""
from __future__ import annotations

import argparse
import json
import pathlib

VERSION = "0.1.0"
NS = "https://councilof.ai/ns/gspc/0.1/"
SCHEME = NS + "scheme"
SOURCE = ("councilof-ai docs/interop/VOCABULARY-CROSSWALK.md, read against the same commit "
          "as the sibling dataset csoai/gspc-estate; definitions traced to the executable "
          "authority named in each term's `authority` field.")

# ---------------------------------------------------------------------------- the entities
ENTITIES = [
    ("Axis", "A named question the board measures, e.g. governance or jail. An axis belongs "
             "to a family (gspc or financial) and to a kind (model-comparison or "
             "deterministic-facts). It is not a score and it is not a category of risk.",
     "GET /api/gspc -> axes[].axis"),
    ("Bank", "A frozen set of items an axis is measured against, published openly and pinned "
             "by sha256. Frozen means the bytes do not change; a new bank is a new sha256, "
             "never an edit.", "huggingface.co/datasets/csoai/gspc-<short>/items.jsonl"),
    ("Cell", "One (model, axis) measurement: one fleet member answering one bank. A cell is "
             "the unit a card attests.", "public/interop/mill-cards-signed/signed-<axis>-<id>.json"),
    ("Run", "One execution of a harness over a bank by a model at fixed settings "
            "(temperature 0, seed 0). A run produces per-item evidence rows before it "
            "produces any number.", "public/interop/mill-evidence/items-<axis>-<id>.jsonl"),
    ("Card", "An Ed25519-signed statement of one cell's result. id == sha256(canonical(body)); "
             "the signature is over those same canonical bytes. A card is never edited: it is "
             "superseded.", "scripts/sign_mill_cards.py"),
    ("Root", "A Merkle root over a list of card digests, published in a signed envelope. "
             "Inclusion means membership in that list and nothing more.", "public/root.json"),
    ("Receipt", "A record that a specific request was answered, including a payment-carrying "
                "request. A receipt is not a measurement and never upgrades one.",
     "GET /api/receipt"),
    ("Correction", "A published entry recording that something we said was wrong, what was "
                   "wrong, how it was caught, and the fix. Corrections are additive; the "
                   "erroneous statement is not deleted.", "GET /api/corrections"),
    ("Claim", "A statement someone else made that we recorded so it can later be checked "
              "against evidence. Capturing a claim asserts nothing about its truth.",
     "public/claims/"),
    ("Supersession", "A link from an older card to the card that replaces it, with the reason. "
                     "The older bytes stay published and stay verifiable.",
     "public/interop/mill-cards-signed/SUPERSEDED.jsonl"),
]

# ------------------------------------------------------------------------ the state machine
STATES = [
    ("MEASURED", "measurement-state",
     "A run happened against a frozen bank and was graded. For a mill card this is exactly "
     "n >= 30 scored items of a published bank under a deterministic grader. It is weaker "
     "than every certification word in every vocabulary it maps onto.",
     "scripts/sign_mill_cards.py — `if n >= 30: status = MEASURED`"),
    ("UNMEASURED", "measurement-state",
     "It exists and we have not measured it. Stated, never implied by an absent field. "
     "A cell below the n floor is published UNMEASURED with the reason `n<30 unquotable`, "
     "not rounded up and not omitted.", "scripts/sign_mill_cards.py"),
    ("UNCHECKABLE", "verification-state",
     "We could not run the check. A third state beside VALID and INVALID, and distinct from "
     "both: it does not mean the artifact failed.", "GET /api/state -> contract.kinds"),
    ("VALID", "verification-state", "The check was run and the artifact passed it.",
     "public/signed/verify-card.mjs"),
    ("INVALID", "verification-state", "The check was run and the artifact failed it.",
     "public/signed/verify-card.mjs"),
    ("SEPARATED", "separation-state",
     "A leader's lead over the fleet was tested and is statistically real (McNemar p<0.05, "
     "or a Wilson interval that clears the runner-up's).", "GET /api/gspc -> axes[].separation"),
    ("TIE", "separation-state",
     "The lead was tested and is NOT separated. A TIE is a result, not a missing result, and "
     "never a win.", "GET /api/gspc -> axes[].separation"),
    ("UNTESTED", "separation-state",
     "No separation test has been run on this axis. It is neither a tie nor a lead.",
     "GET /api/gspc -> axes[].separation"),
    ("CLAIM_CAPTURED", "claim-state",
     "A third party's claim was recorded with its source and date. Nothing about its truth is "
     "asserted by capturing it.", "public/claims/"),
    ("BITCOIN_ATTESTED", "anchor-state",
     "The proof bytes carry a Bitcoin block-header attestation. Parsing it is not the same as "
     "checking the header against a node; `ots verify` with a node does that.",
     "public/interop/ots/manifest.json"),
    ("SUBMITTED_PENDING", "anchor-state",
     "A calendar accepted the stamp request and no Bitcoin attestation has been upgraded into "
     "the proof yet. A submitted request is not evidence of a time.",
     "public/interop/ots/manifest.json"),
]

TRANSITIONS = [
    ("UNMEASURED", "MEASURED", "a run completes with n >= 30 scored items of a frozen bank"),
    ("MEASURED", "UNMEASURED", "a supersession lowers n below the floor, or the bank is withdrawn"),
    ("MEASURED", "UNCHECKABLE", "the artifact can no longer be fetched or its key cannot be resolved"),
    ("UNTESTED", "SEPARATED", "a separation test is run and the interval clears"),
    ("UNTESTED", "TIE", "a separation test is run and the interval does not clear"),
    ("SEPARATED", "TIE", "a later run with more data no longer separates the lead"),
    ("VALID", "INVALID", "the bytes changed after signing"),
    ("VALID", "UNCHECKABLE", "the key or the artifact became unresolvable"),
    ("SUBMITTED_PENDING", "BITCOIN_ATTESTED", "the calendar's attestation is upgraded into the proof bytes"),
    ("CLAIM_CAPTURED", "MEASURED", "evidence for the captured claim is gathered and graded — the "
                                  "claim itself never becomes a measurement, a new measurement of it does"),
]

# ------------------------------------------------------------------------------- crosswalk
# mapping: EXACT | CLOSE | RELATED | WEAKER_THAN_THEIRS | NO_EQUIVALENT
CROSSWALK = [
    ("Card", "in-toto", "Statement (_type / subject / predicateType / predicate)", "CLOSE",
     "in-toto attestation spec v1.2.0",
     "Identical in role: a signed statement about a subject. Our predicateType is our own URI "
     "(https://councilof.ai/attestations/measurement/v1), which the in-toto guidelines permit "
     "without registration. scripts/crosswalk/emit_intoto.py emits these from signed cards."),
    ("Card.id", "in-toto", "subject[].digest.sha256", "EXACT", "in-toto attestation spec v1.2.0",
     "Both are a sha256 over the canonical bytes of the thing being described."),
    ("Card", "SCITT", "Signed Statement (COSE_Sign1, CWT_Claims label 15)", "RELATED", "RFC 9943",
     "Same role, different envelope: ours is raw Ed25519 over canonical JSON, not COSE_Sign1. "
     "The root statement is shaped as a SCITT Signed Statement; the mill cards are not."),
    ("Root", "SCITT", "COSE Receipt `vdp` (VDS 1 = RFC9162_SHA256)", "WEAKER_THAN_THEIRS", "RFC 9942",
     "Ours is a subset. The public root duplicates an odd node instead of using RFC 6962 "
     "domain separation, so the shape is collidable (CVE-2012-2459); the ambiguity is closed "
     "only because card_count is inside the signed preimage and a verifier MUST reject a "
     "presentation where len(card_sha256) != card_count. Recorded, not silently upgraded."),
    ("Card.signature", "W3C VC", "eddsa-jcs-2022 data-integrity proof", "EXACT",
     "vc-di-eddsa, W3C REC 2025-05-15",
     "Ed25519 over canonical JSON is the same primitive; only the multibase wrapper differs."),
    ("Card", "W3C VC", "Verifiable Credential 2.0 with `evidence` (§5.6)", "RELATED",
     "VC Data Model 2.0, W3C REC 2025-05-15",
     "`evidence` is identical in intent to our per-item evidence pointer. The credential "
     "framing is not adopted: we issue no credential about a subject's status."),
    ("Card.did", "W3C VC", "verificationMethod / assertionMethod", "EXACT",
     "Controlled Identifiers v1.0, W3C REC 2025-05-15",
     "did:web:csoai.org#board-attestation-1 resolves in the DID document exactly as specified."),
    ("Card", "C2PA", "assertion in a manifest", "NO_EQUIVALENT", "C2PA 2.4 (April 2026)",
     "C2PA 2.4 permits only X.509 certificates for signing. Our signer is a raw Ed25519 key "
     "with no X.509 chain, so a C2PA manifest cannot carry this signature. Claiming the "
     "mapping would mean claiming a certificate we do not have."),
    ("Run", "evaluation harnesses", "Inspect EvalScore.scored_samples", "EXACT",
     "inspect-ai log format version 2",
     "Our single `n` maps to scored_samples, NOT total_samples. Inspect splits n four ways and "
     "models it better than we do; lm-eval's `effective` is the same distinction."),
    ("Bank", "MLCommons", "Croissant RecordSet / FileObject / Field", "RELATED",
     "croissant-spec-1.1 (2026-01-29)",
     "A frozen bank is describable as a Croissant RecordSet. Pin the -1.1 URL: the unversioned "
     "URL still serves 1.0, and HF's auto-emitted Croissant uses cr:dataBiases, not rai:."),
    ("Correction", "DataCite", "relatedIdentifier IsObsoletedBy", "RELATED",
     "DataCite kernel 4.7 (2026-03-03)",
     "Theirs revokes. Ours publishes the refutation itself, with the measured delta and its "
     "confidence interval, and leaves the refuted statement readable."),
    ("Supersession", "DataCite", "relatedIdentifier IsPreviousVersionOf", "CLOSE",
     "DataCite kernel 4.7 (2026-03-03)",
     "The closest published match. Ours additionally keeps the superseded signed bytes alive "
     "and verifiable after they stop being current."),
    ("MEASURED", "SLSA", "VSA verificationResult: PASSED", "NO_EQUIVALENT",
     "SLSA v1.2 verification_summary",
     "REFUSED, not missing. PASSED is a verdict against a policy. MEASURED means a run happened "
     "and was graded; it carries no pass, no threshold and no policy. Mapping it to PASSED "
     "would manufacture a conformity assessment out of a measurement."),
    ("UNCHECKABLE", "any", "—", "NO_EQUIVALENT", "—",
     "No surveyed vocabulary has a third state beside valid and invalid for 'the check could "
     "not be run'. The word is ours and we do not imply it is standard."),
    ("TIE", "any", "—", "NO_EQUIVALENT", "—",
     "Every leaderboard vocabulary ranks. None has a state meaning 'the lead was tested and is "
     "not separated, so no winner is named'."),
    ("Axis.n", "schema.org", "Observation / StatisticalVariable", "NO_EQUIVALENT",
     "schema.org v30.0 (2026-03-19)",
     "schema.org has marginOfError (dispersion without a sample size); "
     "measurementDenominator is a ratio denominator, not an n. A measured value published "
     "together with the number of items behind it has no schema.org expression."),
    ("Receipt", "x402", "PaymentRequired v2", "EXACT", "x402-foundation/x402",
     "Our 402 challenge is an x402 PaymentRequired. A 402 challenge is not settlement, not "
     "delivery and not revenue, and the vocabulary does not claim otherwise."),
]


def slug(name: str) -> str:
    return name.replace(".", "-")


def emit_context(out: pathlib.Path):
    ctx = {
        "@context": {
            "@version": 1.1,
            "gspc": NS,
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "dcterms": "http://purl.org/dc/terms/",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "id": "@id", "type": "@type",
            "prefLabel": {"@id": "skos:prefLabel"},
            "definition": {"@id": "skos:definition"},
            "scopeNote": {"@id": "skos:scopeNote"},
            "inScheme": {"@id": "skos:inScheme", "@type": "@id"},
            "broader": {"@id": "skos:broader", "@type": "@id"},
            "authority": {"@id": "gspc:authority"},
            "axis": {"@id": "gspc:axis", "@type": "@id"},
            "bank": {"@id": "gspc:bank", "@type": "@id"},
            "cell": {"@id": "gspc:cell", "@type": "@id"},
            "run": {"@id": "gspc:run", "@type": "@id"},
            "card": {"@id": "gspc:card", "@type": "@id"},
            "root": {"@id": "gspc:root", "@type": "@id"},
            "n": {"@id": "gspc:n", "@type": "xsd:nonNegativeInteger"},
            "accuracy": {"@id": "gspc:accuracy", "@type": "xsd:decimal"},
            "status": {"@id": "gspc:status", "@type": "@vocab"},
            "separation": {"@id": "gspc:separation", "@type": "@vocab"},
            "verification": {"@id": "gspc:verification", "@type": "@vocab"},
            "anchorState": {"@id": "gspc:anchorState", "@type": "@vocab"},
            "unmeasured": {"@id": "gspc:unmeasured", "@container": "@set"},
            "supersededBy": {"@id": "gspc:supersededBy", "@type": "@id"},
            "asOf": {"@id": "dcterms:date", "@type": "xsd:dateTime"},
            **{s[0]: NS + s[0] for s in STATES},
        },
        "@id": NS,
        "dcterms:title": "GSPC measurement vocabulary",
        "dcterms:hasVersion": VERSION,
        "dcterms:license": "https://creativecommons.org/publicdomain/zero/1.0/",
        "dcterms:source": SOURCE,
        "rdfs:comment": "CC0. Reuse it, fork it, map onto it without asking. This vocabulary "
                        "describes how a measurement was made and what is NOT known about it. "
                        "It contains no conformity, certification or pass/fail term, by design.",
    }
    (out / "context.jsonld").write_text(json.dumps(ctx, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def emit_terms(out: pathlib.Path):
    rows = []
    for name, definition, authority in ENTITIES:
        rows.append({"id": NS + name, "term": name, "type": "entity", "group": "artifact",
                     "definition": definition, "authority": authority, "version": VERSION})
    for name, group, definition, authority in STATES:
        rows.append({"id": NS + name, "term": name, "type": "state", "group": group,
                     "definition": definition, "authority": authority, "version": VERSION})
    for a, b, when in TRANSITIONS:
        rows.append({"id": f"{NS}transition/{slug(a)}-to-{slug(b)}", "term": f"{a} -> {b}",
                     "type": "transition", "group": "state-machine",
                     "definition": f"A {a} thing becomes {b} when {when}.",
                     "authority": "this vocabulary", "version": VERSION})
    (out / "terms.jsonl").write_text(
        "".join(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n" for r in rows), encoding="utf-8")
    return rows


def emit_crosswalk(out: pathlib.Path):
    rows = [{"our_term": t, "standard": s, "their_term": th, "mapping": m, "spec": sp,
             "basis": b, "version": VERSION,
             "note": "mapping is one of EXACT, CLOSE, RELATED, WEAKER_THAN_THEIRS, "
                     "NO_EQUIVALENT. NO_EQUIVALENT is a finding: the mapping was looked for "
                     "and declined, with the reason in `basis`."}
            for t, s, th, m, sp, b in CROSSWALK]
    (out / "crosswalk.jsonl").write_text(
        "".join(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n" for r in rows), encoding="utf-8")
    return rows


def emit_ttl(out: pathlib.Path):
    def lit(s: str) -> str:
        return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'

    L = ["@prefix skos: <http://www.w3.org/2004/02/skos/core#> .",
         "@prefix dcterms: <http://purl.org/dc/terms/> .",
         "@prefix gspc: <" + NS + "> .", "",
         f"<{SCHEME}> a skos:ConceptScheme ;",
         f"    dcterms:title {lit('GSPC measurement vocabulary')} ;",
         f"    dcterms:hasVersion {lit(VERSION)} ;",
         f"    dcterms:license <https://creativecommons.org/publicdomain/zero/1.0/> ;",
         f"    dcterms:source {lit(SOURCE)} ;",
         f"    skos:scopeNote {lit('Describes how a measurement was made and what is not known about it. Contains no conformity, certification or pass/fail term, by design.')} .", ""]
    for name, definition, authority in ENTITIES:
        L += [f"gspc:{name} a skos:Concept ;", f"    skos:inScheme <{SCHEME}> ;",
              f"    skos:prefLabel {lit(name)} ;", f"    skos:definition {lit(definition)} ;",
              f"    skos:scopeNote {lit('authority: ' + authority)} .", ""]
    groups = sorted({g for _, g, _, _ in STATES})
    for g in groups:
        L += [f"gspc:{g} a skos:Collection ;", f"    skos:prefLabel {lit(g)} ;",
              "    skos:member " + ", ".join(f"gspc:{n}" for n, gg, _, _ in STATES if gg == g) + " .", ""]
    for name, group, definition, authority in STATES:
        L += [f"gspc:{name} a skos:Concept ;", f"    skos:inScheme <{SCHEME}> ;",
              f"    skos:prefLabel {lit(name)} ;", f"    skos:definition {lit(definition)} ;",
              f"    skos:scopeNote {lit('authority: ' + authority)} .", ""]
    for a, b, when in TRANSITIONS:
        u = f"gspc:transition-{slug(a)}-to-{slug(b)}"
        L += [f"{u} a gspc:Transition ;", f"    gspc:from gspc:{a} ;", f"    gspc:to gspc:{b} ;",
              f"    skos:definition {lit('A ' + a + ' thing becomes ' + b + ' when ' + when + '.')} .", ""]
    (out / "gspc.skos.ttl").write_text("\n".join(L), encoding="utf-8")


def emit_state_figure(out: pathlib.Path):
    """The state machine, drawn from STATES and TRANSITIONS — same table, no second truth."""
    groups, W = {}, 1120
    for n, g, _, _ in STATES:
        groups.setdefault(g, []).append(n)
    order = ["measurement-state", "separation-state", "verification-state", "anchor-state", "claim-state"]
    order += [g for g in groups if g not in order]
    colour = {"MEASURED": "#1f6f4a", "UNMEASURED": "#8a8f98", "UNCHECKABLE": "#b45309",
              "VALID": "#1f6f4a", "INVALID": "#b91c1c", "SEPARATED": "#1d4ed8", "TIE": "#7c3aed",
              "UNTESTED": "#9ca3af", "CLAIM_CAPTURED": "#0e7490",
              "BITCOIN_ATTESTED": "#1f6f4a", "SUBMITTED_PENDING": "#b45309"}
    pos, p, y = {}, [], 150
    for g in order:
        p.append(f'<text x="28" y="{y}" font-size="11" fill="#5c6470" font-weight="600">{g}</text>')
        x = 250
        for n in groups[g]:
            w = 20 + 8.2 * len(n)
            pos[n] = (x + w / 2, y)
            p.append(f'<rect x="{x}" y="{y - 17}" width="{w:.0f}" height="26" rx="13" '
                     f'fill="{colour.get(n, "#334155")}" opacity="0.92"/>')
            p.append(f'<text x="{x + w / 2:.0f}" y="{y}" font-size="11.5" fill="#ffffff" '
                     f'text-anchor="middle" font-weight="600">{n}</text>')
            x += w + 18
        y += 62
    tx = y + 8
    lines = [f'<text x="28" y="{tx}" font-size="11" fill="#5c6470" font-weight="600">'
             f'transitions — every one is a published rule, not an implementation detail</text>']
    for i, (a, b, when) in enumerate(TRANSITIONS):
        lines.append(f'<text x="28" y="{tx + 20 + i * 17}" font-size="10.5" fill="#16181d">'
                     f'{a} &#8594; {b}   &#183;   {when}</text>')
    h = tx + 20 + len(TRANSITIONS) * 17 + 46
    svg = ([f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}" width="{W}" height="{h}" '
            f'font-family="ui-sans-serif,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">',
            f'<rect width="{W}" height="{h}" fill="#ffffff"/>',
            '<text x="28" y="40" font-size="20" font-weight="650" fill="#16181d">'
            'The GSPC state machine</text>',
            '<text x="28" y="62" font-size="12.5" fill="#5c6470">Five independent state groups. '
            'A thing has one state from each group that applies to it; they are not one ladder.</text>',
            '<text x="28" y="82" font-size="12.5" fill="#5c6470">UNMEASURED and UNCHECKABLE are '
            'first-class states, published as findings. They are never an absent field.</text>']
           + p + lines
           + [f'<line x1="28" y1="{h - 34}" x2="{W - 28}" y2="{h - 34}" stroke="#d8dce3"/>',
              f'<text x="28" y="{h - 15}" font-size="10" fill="#5c6470">source: terms.jsonl · '
              f'produced by make_ontology.py · vocabulary {VERSION} · CC0-1.0</text>', "</svg>"])
    (out / "state-machine.svg").write_text("\n".join(svg), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=".")
    out = pathlib.Path(ap.parse_args().out)
    out.mkdir(parents=True, exist_ok=True)
    emit_context(out)
    terms = emit_terms(out)
    cross = emit_crosswalk(out)
    emit_ttl(out)
    emit_state_figure(out)
    print(f"  {len(terms)} terms, {len(cross)} crosswalk rows, vocabulary {VERSION}")
    print(f"  mappings: " + ", ".join(
        f"{m} {sum(1 for c in cross if c['mapping'] == m)}"
        for m in ("EXACT", "CLOSE", "RELATED", "WEAKER_THAN_THEIRS", "NO_EQUIVALENT")))
    for f in sorted(out.iterdir()):
        print(f"  wrote {f.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
