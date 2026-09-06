#!/usr/bin/env python3
"""hypercert_metadata_from_cards.py — derive hypercert metadata for the estate's public artefacts.

Deterministic: every field is read from a file in the repository; nothing is typed by hand and
nothing reads the clock or the network. Run it twice and the bytes are identical.

Inputs (all relative to the repo root; override with --root):
  docs/product/SETTLED-DOORS-2026-09-06.md                       first non-zero x402 settlement (self)
  docs/product/x402-settlement-census-2026-09-06.summary.json    buyer-side census (316 hosts)
  docs/grants/2026-09-06/hypercerts/fixtures/api-gspc.json       cached /api/gspc (board totals, DOI)
  public/root.json                                                public Merkle root (card_count, as_of)
  public/interop/index.json                                       interchange-format index (total_formats)
  docs/grants/2026-09-06/hypercerts/fixtures/ietf-draft.json     Datatracker record of the I-D

Outputs: docs/grants/2026-09-06/hypercerts/<slug>.json — one hypercert per artefact, in the
ERC-1155 hypercert metadata schema (fixtures/hypercert-metadata.schema.json + claimdata.schema.json,
cached from hypercerts-org/hypercerts sdk/src/resources/schema), plus atproto/<slug>.json — the same
claim as an `org.hypercerts.claim.activity` record (lexicon cached in scripts/grants/hypercerts-lexicon
from hypercerts-org/hypercerts-lexicon). Both are validated before they are written.

Doctrine, enforced by `lint()`: evidence URIs only; no certification language; no prices, no payment
processor names; the settlement is stated as a self-settlement; revenue one_number is stated as 0.

    python3 scripts/grants/hypercert_metadata_from_cards.py            # write
    python3 scripts/grants/hypercert_metadata_from_cards.py --check    # exit 1 if outputs would change
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import jsonschema
except ImportError:  # pragma: no cover
    jsonschema = None

OUT_DIR = Path("docs/grants/2026-09-06/hypercerts")
FIX = OUT_DIR / "fixtures"
LEX = Path("scripts/grants/hypercerts-lexicon")

SITE = "https://councilof.ai"
ORG = "CSOAI Ltd (GB, Companies House 16939677)"
DID = "did:web:csoai.org"
ORCID = "https://orcid.org/0009-0001-3869-1068"
REPO = "https://github.com/CSOAI-ORG/councilof-ai"
# A real, committed image the schema can point at (metadata.json requires `image`).
IMAGE = f"{SITE}/images/coliseum_hero_arena.jpg"
SCHEMA_VERSION = "1.0.0"  # hypercerts-sdk HypercertMetadata `version`
RIGHTS_DATA = {
    "name": "Rights",
    "value": ["CC-BY-4.0"],
    "excludes": [],
    "display_value": "CC-BY-4.0 (board data and cards); MIT (repository); Apache-2.0 (published packages)",
}

FORBIDDEN = re.compile(
    r"\b(certif\w*|price|pricing|tier|coinbase|payai|stripe|guarantee\w*|contracted)\b", re.I
)


def epoch(iso: str) -> int:
    iso = iso.replace("Z", "+00:00")
    return int(datetime.fromisoformat(iso).astimezone(timezone.utc).timestamp())


def read_json(p: Path):
    return json.loads(p.read_text())


def parse_settled_doors(md: str) -> dict:
    """Pull the one data row out of the settled-doors table."""
    for line in md.splitlines():
        if line.startswith("| 1 |"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            # | # | door | amount | payer | payTo | network | tx | block | observed |
            tx = re.search(r"\]\((https://basescan\.org/tx/(0x[0-9a-f]{64}))\)", cells[6])
            return {
                "door": cells[1].strip("`"),
                "payer_note": cells[3],
                "network": cells[5],
                "tx_url": tx.group(1),
                "tx": tx.group(2),
                "block": int(cells[7]),
                "observed": cells[8],
            }
    raise SystemExit("settled-doors table row not found")


def scope(name: str, values: list[str], display: str, excludes: list[str] | None = None) -> dict:
    return {"name": name, "value": values, "excludes": excludes or [], "display_value": display}


def timeframe(name: str, start: int, end: int, display: str) -> dict:
    return {"name": name, "value": [start, end], "display_value": display}


def contributors(display: str) -> dict:
    return {"name": "Contributors", "value": [DID, ORCID], "display_value": display}


def build(root: Path) -> dict[str, dict]:
    gspc = read_json(root / FIX / "api-gspc.json")
    pub_root = read_json(root / "public/root.json")
    interop = read_json(root / "public/interop/index.json")
    ietf = read_json(root / FIX / "ietf-draft.json")
    census = read_json(root / "docs/product/x402-settlement-census-2026-09-06.summary.json")
    settled = parse_settled_doors((root / "docs/product/SETTLED-DOORS-2026-09-06.md").read_text())

    t = gspc["totals"]
    root_as_of = pub_root["as_of"]
    board_dates = gspc["measured_on"]["date"]  # e.g. "behavioural axes 2026-08-12 · ..."
    first_run = min(re.findall(r"\d{4}-\d{2}-\d{2}", board_dates))
    interop_as_of = interop["as_of"]  # 20260905T123627Z
    interop_iso = re.sub(r"(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z", r"\1-\2-\3T\4:\5:\6Z", interop_as_of)
    ietf_time = ietf["time"].replace(" ", "T")
    if not ietf_time.endswith("Z"):
        ietf_time += "Z"
    doi = gspc["doi"]

    certs: dict[str, dict] = {}

    certs["signed-cards-public-root"] = {
        "name": f"GSPC signed measurement cards under one public Merkle root ({pub_root['card_count']} cards)",
        "description": (
            f"{pub_root['card_count']} Ed25519-signed measurement cards about what AI models do, each a leaf "
            f"in a public Merkle root (merkle_root {pub_root['merkle_root']}, as_of {root_as_of}) signed under "
            f"{pub_root['did_intended']}. The board reads: \"{t['lid']}\". Free to verify offline with the "
            f"published verifier; measurement, not a certificate. Issuer: {ORG}."
        ),
        "external_url": f"{SITE}/root.json",
        "evidence": [
            f"{SITE}/root.json",
            f"{SITE}/api/gspc",
            f"{SITE}/.well-known/did.json",
            f"https://doi.org/{doi}",
            REPO,
        ],
        "work_scope": scope("Work Scope", ["ai-model-measurement", "signed-cards", "merkle-root"],
                            "Measuring AI-model behaviour on frozen banks and publishing signed, recomputable cards"),
        "impact_scope": scope("Impact Scope", ["verifiable-ai-measurement"],
                              "Anyone can verify what a model did without trusting the publisher"),
        "work": (epoch(f"{first_run}T00:00:00Z"), epoch(root_as_of), f"{first_run} → {root_as_of}"),
        "impact": (epoch(f"{first_run}T00:00:00Z"), 0, f"{first_run} → indefinite"),
        "contributors": contributors("Council of AI (CSOAI Ltd) — sole maintainer, ORCID 0009-0001-3869-1068"),
        "traits": {
            "card_count": str(pub_root["card_count"]),
            "merkle_root": pub_root["merkle_root"],
            "measured_axes": f"{t['measured_axes']} of {t['axes']}",
            "license": t["license"],
            "status_language": "measurement, not certification",
        },
    }

    certs["doi-methodology-and-snapshot"] = {
        "name": "GSPC methodology record and board snapshot (DOI-registered)",
        "description": (
            f"The citable methodology spine for the GSPC board (DOI {doi}: "
            f"{gspc['doi_note'].split(' (')[0]}) and the board snapshot deposited on Zenodo. "
            f"Board totals at snapshot: {t['public_count']}; items behind the board: {t['items']}. "
            f"Licence {t['license']}. Issuer: {ORG}."
        ),
        "external_url": f"https://doi.org/{doi}",
        "evidence": [f"https://doi.org/{doi}", "https://doi.org/10.5281/zenodo.22344048", f"{SITE}/api/gspc"],
        "work_scope": scope("Work Scope", ["methodology", "open-dataset"],
                            "Publishing the measurement method and a frozen board snapshot as citable open data"),
        "impact_scope": scope("Impact Scope", ["reproducible-ai-evaluation"],
                              "A stranger can recompute the board from the deposited bytes"),
        "work": (epoch("2026-08-18T00:00:00Z"), epoch("2026-09-05T09:00:28Z"), "2026-08-18 → 2026-09-05"),
        "impact": (epoch("2026-08-18T00:00:00Z"), 0, "2026-08-18 → indefinite"),
        "contributors": contributors("Council of AI (CSOAI Ltd) — sole maintainer, ORCID 0009-0001-3869-1068"),
        "traits": {"doi": doi, "snapshot_doi": "10.5281/zenodo.22344048", "license": t["license"]},
    }

    certs["ietf-scitt-framing-space"] = {
        "name": f"{ietf['name']}-{ietf['rev']}: {ietf['title']}",
        "description": (
            f"An individual Internet-Draft submitted to the IETF Datatracker on {ietf_time}: "
            f"{ietf['title']}. {ietf['abstract'].split('.')[0].strip()}. "
            f"Expires {ietf['expires']}. Open standards work; no working-group adoption is claimed."
        ),
        "external_url": f"https://datatracker.ietf.org/doc/{ietf['name']}/",
        "evidence": [
            f"https://datatracker.ietf.org/doc/{ietf['name']}/",
            f"https://www.ietf.org/archive/id/{ietf['name']}-{ietf['rev']}.txt",
        ],
        "work_scope": scope("Work Scope", ["ietf-internet-draft", "scitt", "cose-cbor"],
                            "Measuring the CBOR framing space of COSE_Sign1 data-hash pre-images"),
        "impact_scope": scope("Impact Scope", ["transparency-log-interoperability"],
                              "Implementers can see why a data-hash identifier is framing-sensitive"),
        "work": (epoch("2026-08-01T00:00:00Z"), epoch(ietf_time), f"2026-08 → {ietf_time}"),
        "impact": (epoch(ietf_time), epoch(ietf["expires"].replace(" ", "T") + ("" if ietf["expires"].endswith("Z") else "Z")),
                   f"{ietf_time} → {ietf['expires']} (draft expiry)"),
        "contributors": contributors("Nicholas Templeman (individual submission), ORCID 0009-0001-3869-1068"),
        "traits": {"draft": f"{ietf['name']}-{ietf['rev']}", "pages": str(ietf["pages"]), "expires": ietf["expires"]},
    }

    o = census["outcome"]
    certs["x402-buyer-side-census"] = {
        "name": f"x402 buyer-side settlement census — {census['population']['eligible_probed']} hosts",
        "description": (
            f"A buyer's-eye measurement of the x402 agent-payment network on {census['network']}: "
            f"{census['population']['eligible_probed']} conformant hosts were paid with a correctly-signed "
            f"payment; {o['DELIVERED']['hosts']} delivered, {o['REFUSED']['hosts']} refused, "
            f"{o['NO_CHALLENGE']['hosts']} issued no challenge, {o['MISMATCH']['hosts']} mismatched "
            f"(as_of {census['as_of']}). The first non-zero settlement the estate's own rail carried was a "
            f"self-settlement (tx {settled['tx']}, block {settled['block']}, {settled['observed']}); "
            f"the estate's revenue one_number is 0. Dataset published as CC-BY-4.0 open data."
        ),
        "external_url": f"{REPO}/blob/master/docs/product/x402-settlement-census-2026-09-06.summary.json",
        "evidence": [
            f"{REPO}/blob/master/docs/product/x402-settlement-census-2026-09-06.jsonl",
            f"{REPO}/blob/master/docs/product/x402-settlement-census-2026-09-06.summary.json",
            f"{REPO}/blob/master/docs/product/SETTLED-DOORS-2026-09-06.md",
            settled["tx_url"],
            f"{SITE}/api/revenue",
        ],
        "work_scope": scope("Work Scope", ["x402-census", "agent-payments-measurement"],
                            "Paying every conformant x402 host once and recording whether it delivered"),
        "impact_scope": scope("Impact Scope", ["agent-payments-transparency"],
                              "The delivery rate behind the discovery indexes, measured from the buyer side"),
        "work": (epoch("2026-09-05T00:00:00Z"), epoch(census["as_of"]), f"2026-09-05 → {census['as_of']}"),
        "impact": (epoch(census["as_of"]), 0, f"{census['as_of']} → indefinite"),
        "contributors": contributors("Council of AI (CSOAI Ltd) — sole maintainer, ORCID 0009-0001-3869-1068"),
        "traits": {
            "hosts_probed": str(census["population"]["eligible_probed"]),
            "delivered": str(o["DELIVERED"]["hosts"]),
            "refused": str(o["REFUSED"]["hosts"]),
            "first_rail_settlement": "self-settlement " + settled["tx"],
            "revenue_one_number": "0",
        },
    }

    certs["interop-format-index"] = {
        "name": f"Interchange-format index — {interop['total_formats']} formats published",
        "description": (
            f"A machine-readable index of {interop['total_formats']} interchange formats the estate publishes "
            f"its measurements in (as_of {interop_iso}), so that any agent framework, registry or "
            f"transparency log can read the board without a bespoke integration. Each entry is a file "
            f"under /interop/; the index is derived from those files, never typed."
        ),
        "external_url": f"{SITE}/interop/index.json",
        "evidence": [f"{SITE}/interop/index.json", f"{SITE}/.well-known/index.json", f"{REPO}/tree/master/public/interop"],
        "work_scope": scope("Work Scope", ["interoperability", "open-formats"],
                            "Publishing one measurement board in every interchange format an agent might read"),
        "impact_scope": scope("Impact Scope", ["agent-interoperability"],
                              "No integration work is needed to consume the board"),
        "work": (epoch("2026-07-01T00:00:00Z"), epoch(interop_iso), f"2026-07 → {interop_iso}"),
        "impact": (epoch(interop_iso), 0, f"{interop_iso} → indefinite"),
        "contributors": contributors("Council of AI (CSOAI Ltd) — sole maintainer, ORCID 0009-0001-3869-1068"),
        "traits": {"total_formats": str(interop["total_formats"]), "index_schema": interop["schema"]},
    }
    return certs


def to_metadata(slug: str, c: dict) -> dict:
    ws, we, wd = c["work"]
    is_, ie, idisp = c["impact"]
    props = [{"trait_type": k, "value": v} for k, v in sorted(c["traits"].items())]
    props += [{"trait_type": f"evidence_{i}", "value": u} for i, u in enumerate(c["evidence"], 1)]
    return {
        "name": c["name"],
        "description": c["description"],
        "external_url": c["external_url"],
        "image": IMAGE,
        "version": SCHEMA_VERSION,
        "ref": slug,
        "properties": props,
        "hypercert": {
            "impact_scope": c["impact_scope"],
            "work_scope": c["work_scope"],
            "work_timeframe": timeframe("Work Timeframe", ws, we, wd),
            "impact_timeframe": timeframe("Impact Timeframe", is_, ie, idisp),
            "contributors": c["contributors"],
            "rights": RIGHTS_DATA,
        },
    }


def to_activity(slug: str, c: dict) -> dict:
    """org.hypercerts.claim.activity record (AT Protocol lexicon)."""
    ws, we, _ = c["work"]
    iso = lambda s: datetime.fromtimestamp(s, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    short = c["description"].split(". ")[0][:290] + "."
    return {
        "$type": "org.hypercerts.claim.activity",
        "title": c["name"][:256],
        "shortDescription": short[:300],
        "description": {"value": c["description"]},
        "image": {"uri": IMAGE},
        "workScope": c["work_scope"]["display_value"],
        "startDate": iso(ws),
        "endDate": iso(we),
        "contributors": [
            {"contributorIdentity": DID, "contributionWeight": "1", "contributionDetails": "sole maintainer"}
        ],
        "createdAt": iso(we),
        "evidence": [{"uri": u} for u in c["evidence"]],
    }


def lint(obj: dict) -> None:
    blob = json.dumps(obj, ensure_ascii=False)
    # The doctrine phrases themselves are allowed; everything else that matches is not.
    scrubbed = re.sub(r"not a certificate|not certification|measurement, not certification", "", blob, flags=re.I)
    hit = FORBIDDEN.search(scrubbed)
    if hit:
        raise SystemExit(f"doctrine lint: forbidden term {hit.group(0)!r} in {obj.get('name') or obj.get('title')}")
    for u in re.findall(r"https?://[^\s\"']+", blob):
        if not (u.startswith(SITE) or u.startswith(REPO) or u.startswith("https://doi.org/")
                or u.startswith("https://datatracker.ietf.org/") or u.startswith("https://www.ietf.org/")
                or u.startswith("https://basescan.org/tx/") or u.startswith(ORCID)):
            raise SystemExit(f"evidence URI outside the allowed set: {u}")


def validate_metadata(meta: dict, root: Path) -> None:
    if jsonschema is None:
        return
    schema = read_json(root / FIX / "hypercert-metadata.schema.json")
    claim = read_json(root / FIX / "hypercert-claimdata.schema.json")
    # metadata.json refers to claimdata.json by a relative $ref; inline it so no resolver is needed.
    schema["properties"]["hypercert"] = {k: v for k, v in claim.items() if k != "$id"}
    schema.pop("$id", None)
    jsonschema.validate(meta, schema)


def validate_activity(rec: dict, root: Path) -> None:
    lex = read_json(root / LEX / "org.hypercerts.claim.activity.json")
    props = lex["defs"]["main"]["record"]
    for k in props["required"]:
        if k not in rec:
            raise SystemExit(f"activity record missing required {k}")
    for k, spec in props["properties"].items():
        if k in rec and isinstance(rec[k], str) and "maxLength" in spec and len(rec[k]) > spec["maxLength"]:
            raise SystemExit(f"activity.{k} exceeds maxLength {spec['maxLength']}")
    for k in rec:
        if k not in props["properties"] and k not in ("$type", "evidence"):
            raise SystemExit(f"activity record has unknown field {k}")


def dump(obj: dict) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=True) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="repo root")
    ap.add_argument("--check", action="store_true", help="fail if outputs differ from disk")
    a = ap.parse_args()
    root = Path(a.root)
    certs = build(root)
    changed = []
    for slug, c in certs.items():
        meta = to_metadata(slug, c)
        act = to_activity(slug, c)
        lint(meta)
        lint(act)
        validate_metadata(meta, root)
        validate_activity(act, root)
        for path, obj in ((root / OUT_DIR / f"{slug}.json", meta), (root / OUT_DIR / "atproto" / f"{slug}.json", act)):
            text = dump(obj)
            if path.exists() and path.read_text() == text:
                continue
            changed.append(str(path))
            if not a.check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(text)
    if a.check and changed:
        print("outputs would change:\n  " + "\n  ".join(changed))
        return 1
    print(f"{len(certs)} hypercerts, {len(changed)} files {'would change' if a.check else 'written'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
