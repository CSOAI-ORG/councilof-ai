#!/usr/bin/env python3
"""build_openapi.py — the ONE producer of public/openapi.json (OpenAPI 3.1.0).

WHAT IT DERIVES, AND FROM WHERE (nothing in the artefact is typed here):
  free read surface   scripts/badger/csoai-openapi-gen.py (the existing walker over functions/api/*.ts,
                      reused as a library — never a second walker). Every operation whose only
                      declared response is 200 gets `security: []`: OpenAPI's way of saying "no
                      authentication", which is what x402scan (@agentcash/discovery) reads as
                      "public, do not probe". 405/501/503 facades stay unclassified and keep their
                      x-csoai-lifecycle marker — they are not public reads and must not be sold as such.
  x402 doors          scripts/fixtures/x402scan/well_known_x402.json  (/.well-known/x402.json resources[])
                      scripts/fixtures/x402scan/api_x402.json         (/api/x402: rail, tiers, deliverables)
                      scripts/fixtures/x402scan/challenges/<door>.json (the door's own live 402, where captured)
                      functions/api/_skus.ts + the door handler        (default amount for an uncaptured door)
  the lid             scripts/fixtures/x402scan/api_gspc_totals.json  (/api/gspc totals.lid — read, never typed;
                      must equal /api/x402 lid or the build fails)
  ownership proofs    scripts/fixtures/x402scan/ownership_proofs.json (optional; owner-signed, see
                      docs/product/X402SCAN-REGISTRATION.md) → x-discovery.ownershipProofs

WHAT x402scan NEEDS (docs/DISCOVERY.md + apps/scan/src/lib/discovery, read 2026-09-06):
  top level      openapi, info.title, info.version, paths  (+ recommended info.x-guidance, info.contact.email)
  per paid op    x-payment-info (presence alone classifies the op as paid), responses.402, an input schema
                 (query `parameters` with schemas; required ones carry const/enum/example so the probe can
                 sample them and reach the 402), an output schema on 200
  per free op    security: []
  NOT here       x-payment-info.price — a decimal-USD price in the document. x402scan treats it as a
                 budgeting hint (info-level warning when absent); the estate publishes amounts ONLY inside
                 a 402 challenge (/api/x402 invariants.no_public_price), so the only amounts in this
                 document are inside each door's documented 402 example.

USAGE
  python3 scripts/build_openapi.py                   # regenerate public/openapi.json from fixtures (offline)
  python3 scripts/build_openapi.py --check           # regenerate in memory, exit 1 on drift
  python3 scripts/build_openapi.py --selftest        # prove --check can go red
  python3 scripts/build_openapi.py --fetch           # refresh the 3 catalog fixtures from live (3 requests)
  python3 scripts/build_openapi.py --fetch --fetch-challenges   # + one GET per door (≤ --max-requests, default 12)
  python3 scripts/build_openapi.py --out PATH        # write elsewhere (tests)

DETERMINISM: no timestamp, no network on the default path, sort_keys=True. info.version is
"<catalog schema version>+<sha256 of the fixture bytes>[:12]" so it moves exactly when a source moves.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
FIX = HERE / "fixtures" / "x402scan"
OUT = REPO / "public" / "openapi.json"
BASE = "https://councilof.ai"
USER_AGENT = "csoai-openapi-builder/0.1 (+https://councilof.ai; nicholas@csoai.org)"
CONTACT = {"name": "CSOAI Ltd", "url": "https://councilof.ai/", "email": "nicholas@csoai.org"}

CATALOG_FIXTURES = {
    "well_known_x402.json": "/.well-known/x402.json",
    "api_x402.json": "/api/x402",
    "api_gspc_totals.json": "/api/gspc",
}


# ───────────────────────────── helpers ─────────────────────────────
def load(p: Path):
    return json.loads(p.read_text())


def load_walker():
    """The existing functions/api walker, imported as a library (its filename has hyphens)."""
    spec = importlib.util.spec_from_file_location("csoai_openapi_gen", HERE / "badger" / "csoai-openapi-gen.py")
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def door_id(path: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", path.removeprefix("/api/").lower()).strip("_")


def split_template(url: str) -> tuple[str, list[tuple[str, str]]]:
    """'https://o/api/x?a=<id>&b=1' → ('/api/x', [('a','<id>'),('b','1')]). Values are kept raw:
    '<a|b>' is an enum placeholder, '<x>' a free placeholder, anything else a literal."""
    u = urllib.parse.urlsplit(url)
    params: list[tuple[str, str]] = []
    if u.query:
        for part in u.query.split("&"):
            if not part:
                continue
            k, _, v = part.partition("=")
            params.append((k, v))
    return u.path, params


def placeholder_kind(v: str) -> str:
    if v.startswith("<") and v.endswith(">"):
        return "enum" if "|" in v and "://" not in v else "placeholder"
    return "literal"


def sha12(*blobs: bytes) -> str:
    h = hashlib.sha256()
    for b in blobs:
        h.update(b)
    return h.hexdigest()[:12]


# ───────────────────────────── source-derived amounts ─────────────────────────────
def sku_default_usd() -> dict[tuple[str, str], float]:
    """{(skuId, tier): usd} from functions/api/_skus.ts default bands. Read, never typed."""
    text = (REPO / "functions" / "api" / "_skus.ts").read_text()
    ids = [(m.start(), m.group(1)) for m in re.finditer(r'\bid:\s*"(\w+)"', text)]
    out: dict[tuple[str, str], float] = {}
    for m in re.finditer(r"(\w+):\s*band\(([\d.]+),", text):
        sku = next((i for pos, i in reversed(ids) if pos < m.start()), None)
        if sku:
            out[(sku, m.group(1))] = float(m.group(2))
    return out


def handler_sku(path: str) -> tuple[str, str] | None | str:
    """(skuId, tier) the door's handler passes to x402Accepts; 'zero' for a door that pins X402_AMOUNT '0'."""
    f = REPO / "functions" / "api" / (path.removeprefix("/api/") + ".ts")
    if not f.exists():
        return None
    text = f.read_text()
    if re.search(r'X402_AMOUNT:\s*"0"', text):
        return "zero"
    consts = dict(re.findall(r'^const\s+(SKU\w*)\s*=\s*"(\w+)"', text, re.M))
    m = re.search(r'x402Accepts\([^;]*?skuId:\s*("?)([\w]+)\1\s*,\s*tier:\s*"(\w+)"', text, re.S)
    if not m:
        return None
    sku = consts.get(m.group(2), m.group(2))
    return sku, m.group(3)


# ───────────────────────────── fetch (owner-run, explicit) ─────────────────────────────
class Budget:
    def __init__(self, limit: int):
        self.limit, self.used = limit, 0

    def take(self, what: str):
        if self.used >= self.limit:
            raise SystemExit(f"probe budget exhausted ({self.limit}) before {what}; raise --max-requests deliberately")
        self.used += 1


def http_get(url: str, budget: Budget) -> tuple[int, dict[str, str], bytes]:
    budget.take(url)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310 — https to our own origin
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, e.read()


def fetch_catalogs(budget: Budget) -> None:
    FIX.mkdir(parents=True, exist_ok=True)
    for name, route in CATALOG_FIXTURES.items():
        status, _, body = http_get(BASE + route, budget)
        if status != 200:
            raise SystemExit(f"{route} answered {status}; fixtures left untouched")
        doc = json.loads(body)
        if name == "api_gspc_totals.json":
            doc = {"_source": BASE + route, "_kept": "totals only — the producer reads totals.lid; the board body drifts hourly", "totals": doc["totals"]}
        (FIX / name).write_text(json.dumps(doc, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
        print(f"  fetched {route} → scripts/fixtures/x402scan/{name}")


def probe_url_for(resource: dict, samples: dict[str, dict[str, str]], index: dict) -> str:
    path, params = split_template(resource["url"])
    did = door_id(path)
    prior = (index.get(did) or {}).get("sampled_query") or {}
    q = []
    for k, v in params:
        kind = placeholder_kind(v)
        if kind == "literal":
            q.append((k, v))
        else:
            val = prior.get(k) or samples.get(did, {}).get(k) or (v[1:-1].split("|")[0] if kind == "enum" else None)
            if val:
                q.append((k, val))
    return BASE + path + ("?" + urllib.parse.urlencode(q) if q else "")


def fetch_challenges(budget: Budget) -> None:
    wk = load(FIX / "well_known_x402.json")
    samples = load(FIX / "probe_samples.json")["samples"]
    idx_path = FIX / "challenge_index.json"
    index = load(idx_path)["doors"] if idx_path.exists() else {}
    (FIX / "challenges").mkdir(exist_ok=True)
    for r in wk["resources"]:
        path, _ = split_template(r["url"])
        did = door_id(path)
        url = probe_url_for(r, samples, index)
        status, headers, body = http_get(url, budget)
        entry = {"url": url, "http_status": status, "fixture": f"challenges/{did}.json",
                 "payment_required_header_bytes": len(headers.get("payment-required", "")),
                 "response_headers_bytes": sum(len(k) + len(v) + 4 for k, v in headers.items())}
        if status == 402:
            try:
                doc = json.loads(body)
            except json.JSONDecodeError:
                doc = None
            if doc and doc.get("accepts"):
                entry["sampled_query"] = (doc.get("extensions", {}).get("bazaar", {}).get("info", {}).get("input", {}).get("queryParams") or {})
                (FIX / "challenges" / f"{did}.json").write_text(json.dumps(doc, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
                index[did] = entry
                print(f"  402 {did}: challenge captured ({entry['payment_required_header_bytes']} B header)")
                continue
        print(f"  {status} {did}: no challenge captured — {url}")
        index[did] = {**entry, "sampled_query": index.get(did, {}).get("sampled_query", {}), "note": "no challenge captured on the last fetch"}
    idx_path.write_text(json.dumps({"_what": "one entry per door whose live 402 was captured by build_openapi.py --fetch-challenges; header bytes matter because x402scan warns above 16 KiB (HEADERS_OVERFLOW)", "doors": index}, indent=2, sort_keys=True) + "\n")


# ───────────────────────────── compose ─────────────────────────────
def compose(fix: Path = FIX) -> dict:
    wk = load(fix / "well_known_x402.json")
    cat = load(fix / "api_x402.json")
    totals = load(fix / "api_gspc_totals.json")["totals"]
    lid = totals["lid"]
    if lid != cat.get("lid"):
        raise SystemExit(f"lid disagrees: /api/gspc totals.lid={lid!r} vs /api/x402 lid={cat.get('lid')!r}")
    rail = cat["rail"]
    index = load(fix / "challenge_index.json")["doors"] if (fix / "challenge_index.json").exists() else {}
    samples = load(fix / "probe_samples.json")["samples"] if (fix / "probe_samples.json").exists() else {}
    proofs_doc = load(fix / "ownership_proofs.json") if (fix / "ownership_proofs.json").exists() else None
    tiers_by_path = {split_template(t["resource"])[0]: t for t in cat["tiers"]}
    free_forever = cat.get("free_forever", [])
    defaults = sku_default_usd()
    decimals = int(rail["asset"]["decimals"])

    # 1. the free read surface, from the existing walker
    walker = load_walker()
    base = walker.build_openapi(walker.discover_endpoints())
    paths: dict[str, dict] = {}
    public_ops = 0
    for p, item in base["paths"].items():
        for op in item.values():
            if list(op["responses"]) == ["200"]:
                op["security"] = []  # explicitly public — x402scan lists, never probes
                public_ops += 1
        paths[p] = item

    # 2. the doors
    shape_donor = None  # the smallest captured challenge lends accepts[0]'s constant fields to uncaptured doors
    for did, e in sorted(index.items(), key=lambda kv: kv[1].get("payment_required_header_bytes", 1 << 30)):
        f = fix / e["fixture"]
        if f.exists():
            shape_donor = (did, load(f))
            break

    door_paths: list[str] = []
    for r in wk["resources"]:
        path, params = split_template(r["url"])
        did = door_id(path)
        method = (r.get("method") or "GET").lower()
        tier = tiers_by_path.get(path)
        entry = index.get(did) or {}
        challenge = load(fix / entry["fixture"]) if entry.get("fixture") and (fix / entry["fixture"]).exists() else None
        sampled = entry.get("sampled_query") or {}
        cap_schema = ((challenge or {}).get("extensions", {}).get("bazaar", {}).get("schema", {})
                      .get("properties", {}).get("input", {}).get("properties", {}).get("queryParams") or {})
        cap_props: dict = cap_schema.get("properties", {}) or {}
        cap_required = set(cap_schema.get("required", []) or [])

        # parameters: template first (const / enum / placeholder), then anything the door itself declares.
        # Required-ness: the door's captured schema wins; without one, a param the catalog's free_preview
        # template omits (request-attestation's `axis`) is optional, everything else required.
        preview_url = r.get("free_preview") or (tier or {}).get("free_preview")
        preview_keys = {k for k, _ in split_template(preview_url)[1]} if preview_url else None
        parameters: list[dict] = []
        seen: set[str] = set()
        for k, v in params:
            kind = placeholder_kind(v)
            schema: dict = dict(cap_props.get(k, {})) or {"type": "string"}
            schema.setdefault("type", "string")
            if kind == "literal":
                schema["const"] = v
            elif kind == "enum" and "enum" not in schema:
                schema["enum"] = v[1:-1].split("|")
            example = sampled.get(k) or samples.get(did, {}).get(k) or (v if kind == "literal" else (schema.get("enum") or [None])[0])
            required = (k in cap_required) if cap_schema else (k in preview_keys if preview_keys is not None else True)
            prm = {"name": k, "in": "query", "required": required, "schema": schema}
            if example is not None:
                prm["example"] = example
            if "description" in schema:
                prm["description"] = schema.pop("description")
            parameters.append(prm)
            seen.add(k)
        for k, s in cap_props.items():
            if k in seen:
                continue
            schema = dict(s)
            prm = {"name": k, "in": "query", "required": k in cap_required, "schema": schema}
            if "description" in schema:
                prm["description"] = schema.pop("description")
            if k in sampled:
                prm["example"] = sampled[k]
            parameters.append(prm)
            seen.add(k)
        if preview_url:
            _, pparams = split_template(preview_url)
            for k, v in pparams:
                if k not in seen and placeholder_kind(v) == "literal":
                    parameters.append({"name": k, "in": "query", "required": False, "schema": {"type": "string", "const": v},
                                       "description": "Free preview: same request, no payment, no signature"})
                    seen.add(k)

        # amount: the door's own captured 402 wins; else the handler's SKU default band from _skus.ts
        accepts0 = None
        amount_source = None
        if challenge and challenge.get("accepts"):
            accepts0 = dict(challenge["accepts"][0])
            amount_source = f"captured live 402 ({entry['fixture']})"
        else:
            hs = handler_sku(path)
            if hs == "zero" or (r.get("amount") == "0"):
                atomic = "0"
                amount_source = "the door pins X402_AMOUNT to 0 and /.well-known/x402.json advertises amount 0"
            elif isinstance(hs, tuple) and hs in defaults:
                atomic = str(round(defaults[hs] * 10**decimals))
                amount_source = f"functions/api/_skus.ts default band {hs[0]}.{hs[1]} (owner env override not visible offline)"
            else:
                atomic = None
                amount_source = "UNKNOWN — no captured challenge and no readable SKU band"
            donor = (shape_donor[1]["accepts"][0] if shape_donor else {})
            accepts0 = {
                "scheme": rail["scheme"], "network": rail["network"], "asset": rail["asset"]["contract"], "payTo": rail["pay_to"],
                "amount": atomic, "maxAmountRequired": atomic,
                "maxTimeoutSeconds": donor.get("maxTimeoutSeconds"),
                "extra": donor.get("extra") or {"decimals": decimals, "symbol": rail["asset"]["symbol"]},
            }
        if accepts0 is not None:
            for k in ("network", "asset", "payTo", "scheme"):
                want = {"network": rail["network"], "asset": rail["asset"]["contract"], "payTo": rail["pay_to"], "scheme": rail["scheme"]}[k]
                if accepts0.get(k) != want:
                    raise SystemExit(f"{did}: challenge {k}={accepts0.get(k)!r} disagrees with /api/x402 rail {want!r}")

        description = (challenge or {}).get("resource", {}).get("description") or (tier or {}).get("deliverable") or r.get("note") or ""
        deliverable = (tier or {}).get("deliverable") or (challenge or {}).get("resource", {}).get("description") or r.get("note") or ""
        summary = (tier or {}).get("name") or (challenge or {}).get("resource", {}).get("serviceName") or f"{r.get('paid_for') or 'free'} door — {path}"
        tags = ["x402", r.get("paid_for") or "free"]
        if challenge:
            example = {k: challenge[k] for k in ("x402Version", "error", "resource", "accepts", "extensions") if k in challenge}
        else:
            example = {"x402Version": 2, "error": "Payment required",
                       "resource": {"url": r["url"], "description": description, "mimeType": "application/json"},
                       "accepts": [accepts0],
                       "extensions": {"bazaar": {"info": {"input": {"type": "http", "method": method.upper(),
                                                                     **({"queryParams": {p["name"]: p["example"] for p in parameters if p.get("required") and "example" in p}} if any(p.get("required") for p in parameters) else {})}}}}}
        free_here = [u for u in free_forever if split_template(u)[0] == path]
        op = {
            "operationId": f"x402_{did}",
            "summary": summary,
            "description": description,
            "tags": tags,
            "x-payment-info": {"protocols": [{"x402": {}}]},
            "parameters": parameters,
            "responses": {
                "402": {
                    "description": "Payment required — the x402 v2 challenge. The same JSON is base64-encoded in the PAYMENT-REQUIRED response header. "
                                   f"Pay accepts[0] (scheme {rail['scheme']}, network {rail['network']}, {rail['asset']['symbol']} {rail['asset']['contract']}, payTo {rail['pay_to']}; "
                                   "amount in atomic units) and retry the same request with the X-PAYMENT header. Verification of the artefact stays free.",
                    "headers": {"PAYMENT-REQUIRED": {"description": "base64(JSON) of this challenge body", "schema": {"type": "string"}}},
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/X402PaymentRequired"}, "example": example}},
                },
                "200": {
                    "description": deliverable,
                    "content": {"application/json": {"schema": {"type": "object", "description": deliverable}}},
                },
            },
            "x-csoai": {
                "door": r["url"],
                "paid_for": r.get("paid_for"),
                **({"tier": tier["id"], "never": tier.get("never", [])} if tier else {}),
                **({"free_preview": preview_url} if preview_url else {}),
                **({"free_forever_on_this_path": free_here} if free_here else {}),
                "challenge": {"captured": bool(challenge), "amount_source": amount_source,
                              **({"payment_required_header_bytes": entry["payment_required_header_bytes"]} if entry.get("payment_required_header_bytes") else {})},
            },
        }
        if r.get("indexed_in"):
            op["x-csoai"]["indexed_in"] = r["indexed_in"]
        paths[path] = {method: op}
        door_paths.append(path)

    # 3. the document
    fixture_bytes = [
        (fix / n).read_bytes() for n in sorted(CATALOG_FIXTURES) if (fix / n).exists()
    ] + [(fix / "challenge_index.json").read_bytes()] * ((fix / "challenge_index.json").exists()) + [
        p.read_bytes() for p in sorted((fix / "challenges").glob("*.json"))
    ]
    version = f"{cat['schema'].rsplit('/', 1)[-1]}+{sha12(*fixture_bytes)}"
    guidance = (
        f"Free board: GET /api/gspc — quote totals.lid verbatim, never compose a count. "
        f"Paid doors are the operations carrying x-payment-info: GET without payment answers HTTP 402 with the x402 v2 challenge "
        f"(accepts[0]: scheme {rail['scheme']}, network {rail['network']}, {rail['asset']['symbol']} {rail['asset']['contract']}, payTo {rail['pay_to']}); "
        f"pay it and retry with the X-PAYMENT header. Required query parameters carry an example that reaches the 402. "
        f"Free previews are named per door under x-csoai.free_preview. Catalog: {rail['well_known']} and {cat['explainer'].rsplit('/', 1)[0]}/api/x402. "
        f"Verify is free: {wk['verify']}. "
        f"Every 402 carries a server-signed offer and every settled 200 a signed receipt, per the x402 "
        f"Offer & Receipt extension (JWS/EdDSA, kid did:web:csoai.org#board-attestation-1, published at "
        f"https://csoai.org/.well-known/did.json). Check either without trusting this document: POST it to "
        f"/api/receipts/verify, or run scripts/verify_receipt.py, which reads did.json and contacts nobody. {lid}"
    )
    spec = {
        "openapi": "3.1.0",
        "info": {
            "title": base["info"]["title"],
            "version": version,
            "description": f"{cat['one_line']} {lid} Operations with security [] are free and unauthenticated. "
                           "Operations with x-payment-info are x402 doors; an amount appears only inside a door's 402 challenge (documented as each door's 402 example).",
            "x-guidance": guidance,
            "contact": CONTACT,
            "license": base["info"]["license"],
        },
        "servers": [{"url": BASE}],
        "tags": [
            {"name": "x402", "description": "HTTP 402 doors on the x402 rail — " + rail["amounts"]},
            {"name": "issuance", "description": "sells issuance of a signed artefact"},
            {"name": "assembly", "description": "sells assembly of already-public evidence"},
            {"name": "free", "description": "a 402 route priced at zero"},
        ],
        "components": {
            "securitySchemes": base["components"]["securitySchemes"],
            "schemas": {
                "X402Accept": {
                    "type": "object",
                    "required": ["scheme", "network", "asset", "payTo", "amount", "maxTimeoutSeconds"],
                    "properties": {
                        "scheme": {"type": "string", "const": rail["scheme"]},
                        "network": {"type": "string", "const": rail["network"], "description": "CAIP-2"},
                        "asset": {"type": "string", "const": rail["asset"]["contract"], "description": f"{rail['asset']['symbol']} contract, {decimals} decimals"},
                        "payTo": {"type": "string", "const": rail["pay_to"]},
                        "amount": {"type": "string", "pattern": "^[0-9]+$", "description": "atomic units (x402 v2)"},
                        "maxAmountRequired": {"type": "string", "pattern": "^[0-9]+$", "description": "atomic units (x402 v1 name for the same figure)"},
                        "maxTimeoutSeconds": {"type": "integer"},
                        "extra": {"type": "object", "properties": {"name": {"type": "string"}, "version": {"type": "string"}}, "description": "EIP-712 domain of the asset"},
                    },
                },
                "X402PaymentRequired": {
                    "type": "object",
                    "required": ["x402Version", "accepts"],
                    "properties": {
                        "x402Version": {"type": "integer", "const": 2},
                        "error": {"type": "string"},
                        "resource": {"type": "object", "properties": {"url": {"type": "string"}, "description": {"type": "string"}, "mimeType": {"type": "string"}, "serviceName": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}}}},
                        "accepts": {"type": "array", "minItems": 1, "items": {"$ref": "#/components/schemas/X402Accept"}},
                        "extensions": {
                            "type": "object",
                            "description": (
                                "extensions.bazaar carries info.input (a sample request) and schema "
                                "(input/output JSON Schema). extensions['offer-receipt'].info.offers[] "
                                "carries one server-signed offer per accepts[] entry, format 'jws' — a "
                                "compact EdDSA JWS whose payload is the offer (x402 Offer & Receipt "
                                "extension \u00a74.1). It is present only when the edge holds its signing "
                                "key; csoai.offer_receipt.signed says which, and why, on every 402."
                            ),
                            "properties": {
                                "offer-receipt": {
                                    "type": "object",
                                    "properties": {
                                        "info": {
                                            "type": "object",
                                            "properties": {
                                                "offers": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "required": ["format", "signature"],
                                                        "properties": {
                                                            "format": {"type": "string", "const": "jws"},
                                                            "acceptIndex": {"type": "integer", "description": "unsigned convenience field; match offers to accepts[] by payload fields, never by index (\u00a74.1.1)"},
                                                            "signature": {"type": "string", "description": "JWS compact serialization containing the offer payload"},
                                                        },
                                                    },
                                                }
                                            },
                                        }
                                    },
                                }
                            },
                        },
                    },
                },
            },
        },
        "paths": paths,
        "x-x402": {
            "offer_receipt": {
                "supported": True,
                "spec": "https://github.com/x402-foundation/x402/blob/69652a69798f0b08f95bef33318896e36e210f7e/specs/extensions/extension-offer-and-receipt.md",
                "spec_commit": "69652a69798f0b08f95bef33318896e36e210f7e",
                "formats_emitted": ["jws"],
                "formats_not_emitted": ["eip712"],
                "why_no_eip712": (
                    "the edge holds one Ed25519 signing key (a Cloudflare Pages secret) and no secp256k1 "
                    "signer; eip712 would require a key nobody has provisioned, so we emit none rather "
                    "than a format we cannot produce"
                ),
                "alg": "EdDSA",
                "kid": "did:web:csoai.org#board-attestation-1",
                "did_document": "https://csoai.org/.well-known/did.json",
                "verify_hosted": f"{BASE}/api/receipts/verify",
                "verify_offline": "scripts/verify_receipt.py",
                "receipts_by_payer": f"{BASE}/api/receipts?payer=0x…",
            },
            "schema_of_source": {"well_known": wk["schema"], "catalog": cat["schema"]},
            "scheme": rail["scheme"],
            "network": rail["network"],
            "asset": rail["asset"],
            "payTo": rail["pay_to"],
            "facilitator": {"configured": rail.get("facilitator_configured"), "url": None,
                            "note": "the facilitator URL is a Cloudflare Pages env var (X402_FACILITATOR_URL) that no public surface publishes; /api/x402 reports only whether one is configured"},
            "mode": rail.get("mode"),
            "mode_note": rail.get("note"),
            "amounts": rail["amounts"],
            "catalog": f"{BASE}/api/x402",
            "well_known": rail["well_known"],
            "mcp": wk.get("mcp", {}).get("url"),
            "not": wk.get("not", []),
            "quarantined": wk.get("quarantined", []),
            "revenue_truth": cat.get("revenue_truth"),
            "doors": door_paths,
            "public_operations": public_ops,
        },
    }
    if proofs_doc and proofs_doc.get("proofs"):
        if proofs_doc.get("origin") != BASE:
            raise SystemExit(f"ownership_proofs.json origin {proofs_doc.get('origin')!r} is not {BASE!r}")
        spec["x-discovery"] = {"ownershipProofs": list(proofs_doc["proofs"]),
                               "signed_message": BASE,
                               "note": "EIP-191 personal_sign of the origin string by the payTo key; x402scan recovers the signer and compares it with accepts[].payTo"}
    return spec


def render(spec: dict) -> str:
    return json.dumps(spec, indent=2, sort_keys=True) + "\n"


# ───────────────────────────── cli ─────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--check", action="store_true", help="regenerate in memory and fail on drift")
    ap.add_argument("--selftest", action="store_true", help="prove --check can go red")
    ap.add_argument("--fetch", action="store_true", help="refresh the catalog fixtures from live (3 requests)")
    ap.add_argument("--fetch-challenges", action="store_true", help="with --fetch: one GET per door, capture each 402")
    ap.add_argument("--max-requests", type=int, default=12, help="hard cap on live requests for --fetch")
    ap.add_argument("--out", type=str, default=str(OUT))
    args = ap.parse_args()
    out = Path(args.out) if Path(args.out).is_absolute() else REPO / args.out

    if args.selftest:
        a = render(compose())
        spec = compose()
        first = spec["x-x402"]["doors"][0]
        op = next(iter(spec["paths"][first].values()))
        op["responses"]["402"]["content"]["application/json"]["example"]["accepts"][0]["amount"] = "1"
        b = render(spec)
        if a == b:
            print("✖ build_openapi selftest: a moved amount did not change the rendered bytes")
            return 1
        print("✓ build_openapi selftest: a moved 402 amount changes the rendered bytes, so --check can go red")
        return 0

    if args.fetch:
        budget = Budget(args.max_requests)
        print(f"=== fetching from {BASE} (cap {args.max_requests}) ===")
        fetch_catalogs(budget)
        if args.fetch_challenges:
            fetch_challenges(budget)
        print(f"  requests used: {budget.used}")

    spec = compose()
    text = render(spec)
    doors = spec["x-x402"]["doors"]
    if args.check:
        if not out.exists():
            print(f"✖ {out.relative_to(REPO)} is missing — run: python3 scripts/build_openapi.py")
            return 1
        current = out.read_text()
        if current == text:
            print(f"✓ openapi: {out.relative_to(REPO)} matches its producer — {len(spec['paths'])} paths, {len(doors)} x402 doors, version {spec['info']['version']}")
            return 0
        try:
            cur = json.loads(current)
            was, now = set(cur.get("paths", {})), set(spec["paths"])
            print(f"✖ openapi DRIFT: {out.relative_to(REPO)} ≠ producer output")
            for p in sorted(now - was):
                print(f"    producer adds   {p}")
            for p in sorted(was - now):
                print(f"    producer drops  {p}")
            if was == now:
                print(f"    same path set; bytes differ (committed version {cur.get('info', {}).get('version')!r}, producer {spec['info']['version']!r})")
        except json.JSONDecodeError:
            print("✖ openapi DRIFT: committed file is not JSON")
        print("  fix: python3 scripts/build_openapi.py && git add public/openapi.json")
        return 1

    out.write_text(text)
    print(f"wrote {out.relative_to(REPO) if out.is_relative_to(REPO) else out} ({len(text)} B): {len(spec['paths'])} paths, {len(doors)} x402 doors, version {spec['info']['version']}")
    for p in doors:
        op = next(iter(spec["paths"][p].values()))
        c = op["x-csoai"]["challenge"]
        print(f"  {p:<34} {'captured 402' if c['captured'] else 'synthesised 402'}  {c['amount_source']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
