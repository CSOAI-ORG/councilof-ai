#!/usr/bin/env python3
"""build_openapi.py — the ONE producer of public/openapi.json (OpenAPI 3.1.0).

WHAT IT DERIVES, AND FROM WHERE (nothing in the artefact is typed here):
  free read surface   scripts/badger/csoai-openapi-gen.py (the existing walker over functions/api/*.ts,
                      reused as a library — never a second walker). Every operation whose only
                      declared response is 200 gets `security: []`: OpenAPI's way of saying "no
                      authentication", except for the explicitly reviewed bearer/conditional contracts below. This is what x402scan (@agentcash/discovery) reads as
                      "public, do not probe". 404/405/501/503 facades (retired, quarantined, not implemented)
                      are ALSO `security: []` — they require no authentication either — and keep their
                      x-csoai-lifecycle marker, which is what says they are not public reads. Left
                      unclassified, x402scan probed each one as a candidate paid endpoint and aggregators
                      counted ~39 free routes as "x402 endpoints" (28 Sep 2026).
  x402 doors          functions/.well-known/x402.json.ts — the Pages Function that serves /.well-known/x402.json,
                      RENDERED offline by scripts/render_x402_manifest.mjs into
                      scripts/fixtures/x402scan/well_known_x402.json on every build (and compared on --check).
                      Until 2026-09-28 that fixture was a hand-refreshed copy of the live manifest; it froze at
                      21 doors while the function grew to 25, and x402scan refused the four missing doors as
                      notInSpec. One method per door: the method the manifest names (bazaar info.input.method).
                      scripts/fixtures/x402scan/api_x402.json         (/api/x402: rail, tiers, deliverables)
                      scripts/fixtures/x402scan/challenges/<door>.json (the door's own live 402, where captured)
                      functions/api/_skus.ts + the door handler        (default amount for an uncaptured door)
                      functions/api/x402-descriptions.json             (canonical descriptions where a stale
                                                                        live capture could overstate a product)
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
  python3 scripts/build_openapi.py                   # re-render the manifest fixture from source, regenerate public/openapi.json (offline)
  python3 scripts/build_openapi.py --check           # regenerate in memory, exit 1 on drift (manifest fixture vs source, or document)
  python3 scripts/build_openapi.py --selftest        # prove --check can go red
  python3 scripts/build_openapi.py --fetch           # refresh the 2 live catalog fixtures (/api/x402, /api/gspc) (2 requests)
  python3 scripts/build_openapi.py --fetch --fetch-challenges   # + one GET per door (≤ --max-requests, default 12)
  python3 scripts/build_openapi.py --out PATH        # write elsewhere (tests)

DETERMINISM: no timestamp, no network on the default path (the manifest render is a local node call), sort_keys=True. info.version is
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
# Rendered from source (scripts/render_x402_manifest.mjs), never fetched: the live route and this
# document then read ONE door list — the function's — instead of a copy that can fall behind.
SOURCE_RENDERED = {"well_known_x402.json"}
MANIFEST_RENDERER = HERE / "render_x402_manifest.mjs"
DESCRIPTION_SOURCE = REPO / "functions" / "api" / "x402-descriptions.json"
WRAPPER_ASSET_DOORS = REPO / "functions" / "api" / "_wrapper_asset_doors.json"
DISCOVERY_SUBJECTS = REPO / "functions" / "api" / "discover" / "subjects.json"
DESCRIPTION_PATHS = {
    # Every door, not three (2026-09-28): the canonical text is the one source the manifest, each
    # door's 402 (and so the Bazaar extension's catalogue entry), capabilities.json and llms.txt read.
    "/api/free-door": "free_door",
    "/api/proof": "proof_bundle",
    "/api/request-attestation": "request_attestation",
    "/api/receipts/batch": "receipts_batch",
    "/api/evidence-bundle": "evidence_bundle",
    "/api/signed-data-feed": "data_feed",
    "/api/rwa/evidence": "rwa_evidence",
    "/api/wrapper": "wrapper",
    "/api/wrapper/changes": "wrapper_changes",
    "/api/art50/marking-evidence": "art50_marking_evidence",
    "/api/feeds/provider-diff": "provider_diff",
    "/api/measurement/fresh-capsule": "fresh_capsule",
    "/api/ras/mcp-probe": "ras_mcp_probe",
    "/api/ras/x402-check": "ras_x402_check",
    "/api/ras/supply": "ras_supply",
    # Population doors: /api/pop/<id> -> pop_<id> (same bytes the manifest and catalogue read).
    **{f"/api/pop/{pop}": f"pop_{pop}" for pop in (
        "stablecoins", "swift", "xrpl", "x402-bazaar", "mcp-registry", "a2a",
        "ots-proofs", "layer0", "corrections", "claim-watch",
    )},
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
        if "|" in v and "://" not in v:
            # Real value enums look like <article-50|article-53|dora>. Type-token
            # placeholders (symbol|issuer_address) must NOT become OpenAPI enums —
            # CDP would then probe with the word "symbol" and never reach a 402.
            parts = [x.strip() for x in v[1:-1].split("|") if x.strip()]
            type_tokens = {"symbol", "issuer", "issuer_address", "address", "id", "slug", "iso", "asset", "model-id", "model_id"}
            if parts and all(part.lower().replace("-", "_") in type_tokens or "_" in part for part in parts):
                return "placeholder"
            return "enum"
        return "placeholder"
    return "literal"


# Paid-gate query params: descriptions indexers need so bare ≠ paid is explicit.
# Filled only when the captured challenge schema left description empty.
PARAM_GATE_DESC: dict[str, str] = {
    "feed": "Paid-tier gate. Must be the string 1 to request the signed feed (HTTP 402). Omit for free preview on the bare path (HTTP 200).",
    "history": "Paid-tier gate. Must be the string 1 to request the signed historical batch (HTTP 402). Omit for free recent diffs on the bare path (HTTP 200). Optional since narrows the window.",
    "bundle": "Paid-tier gate. Must be the string 1 together with the other required params to request the paid artefact (HTTP 402). Without bundle=1 the door stays on free preview / validation.",
    "obligation": "Obligation the evidence bundle maps to (required with bundle=1 for the paid tier). Incomplete probes (bundle alone) stay HTTP 400.",
    "asset": "XRPL asset symbol or issuer address to evidence (required). Example RLUSD. Use preview=1 for free unsigned measurement.",
    "url": "Public URL of the generative output to measure. Use preview=1 for free unsigned measurement.",
    "from": "Window start (ISO-8601). Required for the paid receipts batch. Use preview=1 for a free digest without leaves.",
    "subject": "Subject the door names (model id / instrument / vendor). Required on request-attestation; optional on evidence-bundle.",
    "axis": "Optional axis slug for a more specific attestation SKU.",
    "sha": "Free inclusion proof for one known leaf (64-hex). Omit; use bundle=1 for the paid root bundle.",
}

# Operation-level free vs paid note (appended when missing from challenge prose).
FREE_TIER_OP_NOTE: dict[str, str] = {
    "/api/proof": "Bare path is validation (HTTP 400 naming sha or bundle). Free inclusion via optional sha. Paid root bundle when bundle=1 (HTTP 402).",
    "/api/signed-data-feed": "Bare path is the free preview (HTTP200). manifest=1 returns a free pre-payment blocks digest. feed=1 selects the assembled feed (HTTP402 without payment). Optional x-csoai-expected-feed-sha256 pins its content; mismatch409 and unavailable sources503 occur before settlement. Separate signatures and payment are not verified by the digest.",
    "/api/feeds/provider-diff": "Bare path is free recent diffs (HTTP 200). Paid historical batch requires history=1 (HTTP 402).",
    "/api/evidence-bundle": "Preview = obligation(+subject) without bundle=1. Paid tier requires obligation + bundle=1 (HTTP 402). Incomplete bundle alone stays HTTP 400.",
    "/api/rwa/evidence": "preview=1 is free unsigned. Paid signed card requires asset (HTTP 402).",
    "/api/art50/marking-evidence": "preview=1 is free unsigned. Paid signed card requires url (HTTP 402).",
    "/api/receipts/batch": "preview=1 is free digest. Paid leaves require from (HTTP 402).",
    "/api/wrapper": "preview=1 is free unsigned. Paid signed card requires id (HTTP 402 when the pair is readable; an UNMEASURED pair answers HTTP 200 preview-only and is never sold).",
    **{f"/api/wrapper/asset/{a}": "preview=1 is free unsigned. The unpaid GET answers HTTP 402 when at least one pair is readable, HTTP 200 preview-only when every pair is UNMEASURED." for a in (d["asset"] for d in json.loads(WRAPPER_ASSET_DOORS.read_text())["doors"])},
}


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


def render_manifest() -> str:
    """/.well-known/x402.json as functions/.well-known/x402.json.ts renders it (offline, empty env)."""
    import subprocess
    r = subprocess.run(["node", str(MANIFEST_RENDERER)], cwd=REPO, capture_output=True, text=True, timeout=180)
    if r.returncode != 0:
        raise SystemExit(f"render_x402_manifest.mjs failed ({r.returncode}): {r.stderr.strip()[-600:]}")
    json.loads(r.stdout)  # must be JSON
    return r.stdout


def handler_sku(path: str) -> tuple[str, str] | None | str:
    """(skuId, tier) the door's handler passes to x402Accepts; 'zero' for a door that pins X402_AMOUNT '0'."""
    f = REPO / "functions" / "api" / (path.removeprefix("/api/") + ".ts")
    if not f.exists():
        return None
    text = f.read_text()
    # A static route file that only re-exports a shared handler (functions/api/wrapper/asset/usdc.ts →
    # ./[asset].ts) charges what that handler charges: read the handler it names.
    reexport = re.search(r'export\s*\{[^}]*\}\s*from\s*"(\.[^"]+)"', text)
    if reexport and "x402Accepts" not in text:
        target = f.parent / (reexport.group(1) + ".ts")
        if target.exists():
            text = target.read_text()
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
        if name in SOURCE_RENDERED:
            continue  # rendered from source on every build; a live copy would only reintroduce drift
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


# ───────────────────────────── free verifier contract ─────────────────────────────
def verifier_contract(manifest: dict) -> tuple[dict, dict]:
    """Describe functions/api/verify.ts; the runnable example comes from its discovery door."""
    door = next(d for d in manifest["free_doors"]
                if urllib.parse.urlsplit(d["url"]).path == "/api/verify")
    sample = urllib.parse.parse_qs(urllib.parse.urlsplit(door["url"]).query)["record_url"][0]
    ref = lambda name: {"$ref": f"#/components/schemas/{name}"}
    schemas = {
        "CSOAIVerificationResult": {
            "type": "object",
            # Early POST 400s omit free; early GET results omit reasons/checks/family/id.
            "required": ["schema", "state", "not_a_certification"],
            "properties": {
                "schema": {"const": "csoai.verify/0.1"},
                "state": {"type": "string", "enum": ["VALID", "INVALID", "UNCHECKABLE"],
                          "description": "VALID authenticates the supported record under pinned keys; INVALID names a failure of its rule; UNCHECKABLE means the check could not be completed. No state certifies a system or proves claims inside the record."},
                "free": {"const": True},
                "not_a_certification": {"const": True},
                "record_url": {"type": "string"},
                "reason": {"type": ["string", "null"]},
                "reasons": {"type": "array", "items": {"type": "string"}},
                "family": {"type": ["string", "null"]},
                "id": {"type": ["string", "null"]},
                "did": {"type": ["string", "null"], "description": "Signer declared by a POST signed-run record; an unpinned or malformed declaration can be echoed."},
                "payload_sha256": {"type": ["string", "null"], "description": "Digest computed for a POST signed-run payload when that check is reached."},
                "artifact": {"type": ["object", "array", "null"], "description": "Artifact metadata copied from a POST signed-run payload, without validating its fields or retained artifact bytes."},
                "rule": {"type": "string"},
                "trust_anchor": {"type": "string"},
                "note": {"type": "string"},
                "checks": {"type": "array", "items": {
                    "type": "object", "required": ["check", "ok", "code", "detail"],
                    "properties": {"check": {"type": "string"}, "ok": {"type": ["boolean", "null"]},
                                   "code": {"type": "string"}, "detail": {"type": "string"}},
                }},
                "fetched": {"type": ["object", "null"],
                            "description": "Exact served-byte digest when read. Null on URL refusal or fetch failure; redirect refusal supplies only HTTP status and final URL.",
                            "properties": {"http_status": {"type": "integer"}, "final_url": {"type": "string"},
                                           "bytes": {"type": "integer", "minimum": 0},
                                           "sha256": {"type": "string", "pattern": "^[0-9a-f]{64}$"}}},
            },
        },
        "CSOAIVerificationInstructions": {
            "type": "object",
            "required": ["schema", "endpoint", "states", "free", "not_a_certification"],
            "properties": {
                "schema": {"const": "csoai.verify/0.1"},
                "endpoint": {"const": "/api/verify"},
                "how": {"type": "string"}, "also_reads": {"type": "string"},
                "record_url": {"type": "string", "description": "Instructions for the optional query parameter, not a fetched record URL."},
                "card_v0": {"type": "string"}, "rule": {"type": "string"}, "note": {"type": "string"},
                "pinned_keys": {"type": "array", "items": {"type": "string"}},
                "states": {"type": "object", "required": ["VALID", "INVALID", "UNCHECKABLE"],
                           "properties": {state: {"type": "string"} for state in ["VALID", "INVALID", "UNCHECKABLE"]}},
                "free": {"const": True}, "not_a_certification": {"const": True},
            },
            "not": {"required": ["state"]},
        },
        "CSOAIVerificationInput": {
            "anyOf": [{"type": "object"}, {"type": "string"}],
            "description": "A supported record object, its JSON string, or an allowed HTTPS record URL. Objects may wrap the input in card, record, json, url or input (first non-null field in that order). Unreadable input returns UNCHECKABLE, never an invented verdict.",
        },
    }
    get_result = {"allOf": [ref("CSOAIVerificationResult"), {
        "required": ["free", "record_url", "fetched"],
    }]}
    get_error = {"allOf": [get_result, {
        "required": ["reason"], "properties": {"state": {"const": "UNCHECKABLE"}, "reason": {"type": "string"}},
    }]}
    response = lambda description, schema: {
        "description": description, "content": {"application/json": {"schema": schema}},
    }
    operations = {
        "get": {
            "summary": "Verify a published record for free, or read verifier instructions",
            "description": "Without record_url, returns instructions without judging a record. With record_url, re-fetches the exact served bytes and verifies a supported Council record, including measurement cards and card-v0/v1 receipts, under pinned keys. Only HTTPS councilof.ai, csoai.org and www.csoai.org URLs are fetched; off-origin redirects are refused. Signed-run evidence records are supported by POST. Verification is free and is never certification.",
            "security": [],
            "parameters": [{
                "name": "record_url", "in": "query", "required": False,
                "description": "Published record to fetch and verify. The example is the historical measurement card advertised by the discovery manifest, not a claim about current board freshness. Omit this parameter to read instructions.",
                "schema": {"type": "string", "format": "uri", "pattern": r"^https://(councilof\.ai|csoai\.org|www\.csoai\.org)/"},
                "example": sample,
            }],
            "responses": {
                "200": response("Instructions when record_url is absent; otherwise VALID, INVALID or UNCHECKABLE. An upstream non-200 response, oversized record or non-JSON record also returns UNCHECKABLE at HTTP 200.", {
                    "anyOf": [ref("CSOAIVerificationInstructions"), get_result],
                }),
                "400": response("Record URL or final redirect is outside the allowed HTTPS origins; no record body is read.", get_error),
                "502": response("The record could not be fetched, including timeout; state is UNCHECKABLE and fetched is null.", get_error),
            },
        },
        "post": {
            "summary": "Verify a posted measurement or signed evidence record for free",
            "description": "POST a supported record object or JSON string, directly or in a supported wrapper. Allowed HTTPS record URLs are also accepted. Supported families include measurement cards, card-v0/v1 receipts and csoai.signed-run/0.1 records, each using its existing pinned-key rule. For signed runs, compare retained record bytes with artifact.sha256 yourself; this endpoint checks the payload signature. Unsupported shapes are UNCHECKABLE. No payment or account is required; verification certifies nothing.",
            "security": [],
            "requestBody": {"required": True, "content": {"application/json": {
                "schema": ref("CSOAIVerificationInput"),
                "examples": {"published_record_url": {
                    "summary": "Verify the manifest's published historical measurement-card example",
                    "value": {"card": sample},
                }},
            }}},
            "responses": {
                "200": response("The record's three-state verdict under its existing verification rule; verification remains free.", {
                    "allOf": [ref("CSOAIVerificationResult"), {"required": ["free"]}],
                }),
                "400": response("Malformed or unreadable input, disallowed URL, or a record URL that could not be read; state is UNCHECKABLE. This early error does not carry a free field.", {
                    "allOf": [ref("CSOAIVerificationResult"), {
                        "required": ["reason"], "properties": {"state": {"const": "UNCHECKABLE"}, "reason": {"type": "string"}},
                    }],
                }),
            },
        },
    }
    return operations, schemas


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
    # The live /api/x402 renamed `tiers` → `resources` on 2026-09-09 (6dadd89a); the fixture kept
    # the old key, so `--fetch` produced a catalog this producer could not read (KeyError: 'tiers',
    # seen 2026-09-13). Read whichever the catalog carries — same rows, same fields.
    tiers_by_path = {split_template(t["resource"])[0]: t for t in (cat.get("resources") or cat.get("tiers") or [])}
    free_forever = cat.get("free_forever", [])
    defaults = sku_default_usd()
    decimals = int(rail["asset"]["decimals"])
    canonical_descriptions = load(DESCRIPTION_SOURCE)

    # 1. the free read surface, from the existing walker
    walker = load_walker()
    base = walker.build_openapi(walker.discover_endpoints())
    paths: dict[str, dict] = {}
    for p, item in base["paths"].items():
        for op in item.values():
            if list(op["responses"]) == ["200"]:
                op["security"] = []  # explicitly public — x402scan lists, never probes
        paths[p] = item

    # Reviewed access contracts: a generic 200 response is not proof of public access.
    # Metadata only; access enforcement remains in the existing handlers.
    restricted = {
        ("/api/board-sign", "post"): ("githubOidc", "GitHub OIDC bearer required; token claims are validated by the handler."),
        ("/api/provider-canary", "post"): ("operatorBearer", "Configured operator bearer and same-origin request required."),
        ("/api/action-jobs", "post"): ("operatorBearer", "Configured writer bearer and exact same-origin Origin header required."),
        ("/api/action-jobs", "patch"): ("operatorBearer", "Configured writer bearer and exact same-origin Origin header required."),
    }
    base["components"]["securitySchemes"].update({
        "githubOidc": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT", "description": "GitHub Actions OIDC token satisfying the handler's issuer, audience, repository and workflow checks."},
        "operatorBearer": {"type": "http", "scheme": "bearer", "description": "Operation-specific configured operator or writer credential. Not interchangeable across operations."},
    })
    for (path, method), (scheme, note) in restricted.items():
        op = paths[path][method]
        op["security"] = [{scheme: []}]
        op["description"] = note + " " + op.get("description", "")
        op["responses"]["401"] = {"description": "Required bearer credential missing or rejected."}
    # The bare GET publishes a contract, while job_id requests are authenticated reads.
    op = paths["/api/action-jobs"]["get"]
    op["security"] = [{}, {"operatorBearer": []}]
    op["description"] = "Bare GET returns public contract metadata. Requests with job_id require writer bearer authorization; origin restrictions still apply. " + op.get("description", "")
    op["responses"]["401"] = {"description": "A job_id read requires an authorized writer bearer."}

    # Every other operation: no credential is required, so say so. `security: []` is OpenAPI's
    # "no authentication" — it does not say the route works; the x-csoai-lifecycle marker beside it
    # (RETIRED / QUARANTINED_PRE_RELEASE / NOT_IMPLEMENTED / DOOR_CLOSED / METHOD_NOT_ALLOWED) does.
    # Unclassified, these were probed by x402scan as candidate paid endpoints and counted by
    # aggregators as x402 routes (x402jp listed ~80 for this origin, most of them free).
    for item in paths.values():
        for op in item.values():
            if "security" not in op:
                op["security"] = []

    # The walker identifies handlers, but cannot infer the verifier's optional GET or POST body.
    # Keep its stable operation ids while declaring the actual free contract from one producer.
    verify_operations, verify_schemas = verifier_contract(wk)
    for method, contract in verify_operations.items():
        paths["/api/verify"][method].update(contract)

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
            if not prm.get("description") and k in PARAM_GATE_DESC:
                prm["description"] = PARAM_GATE_DESC[k]
            parameters.append(prm)
            seen.add(k)
        for k, s in cap_props.items():
            if k in seen:
                continue
            schema = dict(s)
            prm = {"name": k, "in": "query", "required": k in cap_required, "schema": schema}
            if "description" in schema:
                prm["description"] = schema.pop("description")
            if not prm.get("description") and k in PARAM_GATE_DESC:
                prm["description"] = PARAM_GATE_DESC[k]
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

        # Free inclusion path on /api/proof — indexers otherwise only see the paid bundle gate.
        if path == "/api/proof" and "sha" not in seen:
            parameters.append({
                "name": "sha",
                "in": "query",
                "required": False,
                "schema": {"type": "string", "pattern": "^[0-9a-f]{64}$"},
                "description": PARAM_GATE_DESC["sha"],
            })
            seen.add("sha")

        if path == "/api/signed-data-feed":
            parameters.extend([
                {"name": "manifest", "in": "query", "required": False, "schema": {"type": "string", "enum": ["1"]}, "description": "Free manifest; takes priority over feed=1 and never settles a payment."},
                {"name": "x-csoai-expected-feed-sha256", "in": "header", "required": False, "schema": {"type": "string", "pattern": "^[a-f0-9]{64}$"}, "description": "Digest retained from the pre-payment manifest. A changed assembled feed is rejected with409 before the facilitator is called."},
            ])
        # /api/free-door takes no query parameters, and a paid operation with neither `parameters` nor a
        # requestBody draws L3_INPUT_SCHEMA_MISSING from x402scan / AgentCash (@agentcash/discovery
        # extractInputSchema, read 2026-09-28). What the door does read is the payment header
        # (functions/api/free-door.ts reads X-PAYMENT or PAYMENT-SIGNATURE), so that is what it declares
        # — nothing invented, both optional, and omitting them is how a caller reads the zero-amount 402.
        if path == "/api/free-door" and not parameters:
            parameters.extend([
                {"name": "X-PAYMENT", "in": "header", "required": False, "schema": {"type": "string"},
                 "description": "x402 payment payload (base64 JSON) settling the zero-amount challenge. Omit it to read the 402; nothing is charged either way."},
                {"name": "PAYMENT-SIGNATURE", "in": "header", "required": False, "schema": {"type": "string"},
                 "description": "x402 v2 payment payload header, accepted in place of X-PAYMENT. Omit it to read the 402."},
            ])
        canonical_description = canonical_descriptions.get(DESCRIPTION_PATHS.get(path, ""))
        if canonical_description is None and path.startswith("/api/wrapper/asset/"):
            # One template for the per-asset doors, the asset's symbol filled in — as the door renders it.
            door = next((d for d in load(WRAPPER_ASSET_DOORS)["doors"] if d["asset"] == path.rsplit("/", 1)[1]), None)
            if door:
                canonical_description = canonical_descriptions["wrapper_asset"].replace("{ASSET}", door["symbol"])
        if canonical_description is None and path.startswith("/api/discover/"):
            # One template for the subject discovery doors, the subject's label filled in — as the door renders it.
            label = load(DISCOVERY_SUBJECTS).get(path.rsplit("/", 1)[1])
            if label:
                canonical_description = canonical_descriptions["subject_discovery"].replace("{SUBJECT}", label)
        description = canonical_description or (challenge or {}).get("resource", {}).get("description") or (tier or {}).get("deliverable") or r.get("note") or ""
        note = FREE_TIER_OP_NOTE.get(path)
        if note and note not in description:
            description = f"{description.rstrip()} {note}".strip() if description else note
        deliverable = canonical_description or (tier or {}).get("deliverable") or (challenge or {}).get("resource", {}).get("description") or r.get("note") or ""
        summary = (tier or {}).get("name") or (challenge or {}).get("resource", {}).get("serviceName") or f"{r.get('paid_for') or 'free'} door — {path}"
        tags = ["x402", r.get("paid_for") or "free"]
        if challenge:
            example = {k: challenge[k] for k in ("x402Version", "error", "resource", "accepts", "extensions") if k in challenge}
            if canonical_description and isinstance(example.get("resource"), dict):
                example["resource"] = {**example["resource"], "description": canonical_description}
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
            "x-payment-info": {"protocols": ["x402"]},
            "parameters": parameters,
            "responses": {
                "402": {
                    "description": "Payment required — the x402 v2 challenge. The PAYMENT-REQUIRED response header carries its minimal v2 subset "
                                   "(x402Version, error, resource, accepts[] payment fields); extensions and the csoai sidecar are in this body only. "
                                   f"Pay accepts[0] (scheme {rail['scheme']}, network {rail['network']}, {rail['asset']['symbol']} {rail['asset']['contract']}, payTo {rail['pay_to']}; "
                                   "amount in atomic units) and retry the same request with the X-PAYMENT header. Verification of the artefact stays free. "
                                   # T11 (6 Oct 2026): the examples are captures, some taken during a dated launch amount.
                                   "The example is a captured challenge: its amount and any csoai_pricing dates are as captured, not a standing price. "
                                   "Amounts are set per request in the challenge and can change, so read accepts[] from a live 402 on every call.",
                    "headers": {"PAYMENT-REQUIRED": {"description": "base64(JSON) of the minimal v2 PaymentRequired: x402Version, error, resource, accepts[] (scheme, network, amount, asset, payTo, maxTimeoutSeconds, extra) — under 4 KiB", "schema": {"type": "string"}}},
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
        if path == "/api/signed-data-feed":
            op["responses"]["409"] = {"description": "Retained feed digest differs; no payment settled."}
            op["responses"]["503"] = {"description": "Required source unavailable or invalid; no payment settled."}
            op["x-csoai"]["free_manifest"] = BASE + "/api/signed-data-feed?manifest=1"
            op["x-csoai"]["offline_content_verifier"] = BASE + "/verifier/verify_feed_delivery.mjs"
        # `indexed_in` is deliberately NOT carried (2026-09-26): /.well-known/x402.json no longer
        # types third-party index membership, which only a read of the index can establish.
        # ONE METHOD PER DOOR — the one the manifest names, which is also the method every door's
        # bazaar discovery block states (info.input.method). From 2026-09-26 to 2026-09-28 this
        # emitted x-payment-info on every verb the handler exported, so each door appeared twice
        # (GET and POST); x402scan registered the POST and its row then contradicted the door's
        # own discovery metadata, and /api/wrapper/changes (no POST handler, live POST 404) and
        # /api/art50/marking-evidence (live POST 400) were listed as payable over POST. The GET
        # answers 402 on all 25 doors (probed live 2026-09-28).
        paths[path] = {method: op}
        door_paths.append(path)

    # 3. the document
    fixture_bytes = [
        (fix / n).read_bytes() for n in sorted(CATALOG_FIXTURES) if (fix / n).exists()
    ] + [(fix / "challenge_index.json").read_bytes()] * ((fix / "challenge_index.json").exists()) + [
        p.read_bytes() for p in sorted((fix / "challenges").glob("*.json"))
    ] + [DESCRIPTION_SOURCE.read_bytes()]
    version = f"{cat['schema'].rsplit('/', 1)[-1]}+{sha12(*fixture_bytes)}"
    guidance = (
        f"Free board: GET /api/gspc — quote totals.lid verbatim, never compose a count. "
        f"Paid doors are the operations carrying x-payment-info: GET without payment answers HTTP 402 with the x402 v2 challenge "
        f"(accepts[0]: scheme {rail['scheme']}, network {rail['network']}, {rail['asset']['symbol']} {rail['asset']['contract']}, payTo {rail['pay_to']}); "
        f"pay it and retry with the X-PAYMENT header. Required query parameters carry an example that reaches the 402. "
        f"Free previews are named per door under x-csoai.free_preview. Catalog: {rail['well_known']} and {cat['explainer'].rsplit('/', 1)[0]}/api/x402. "
        f"Verify is free: {wk['verify']}. "
        f"Offer & Receipt emission is conditional: a 402 carries server-signed offers only when the Pages signing key is available; "
        f"a settled 200 carries a signed receipt only when settlement exposes the required payer and transaction evidence and that key is available. "
        f"The extension uses JWS/EdDSA, kid did:web:csoai.org#board-attestation-1, published at "
        f"https://csoai.org/.well-known/did.json. Check either without trusting this document: POST it to "
        f"/api/receipts/verify, or download https://councilof.ai/verifier/verify_receipt.py; default mode reads the public DID document, and a retained key document allows offline replay. {lid}"
    )
    spec = {
        "openapi": "3.1.0",
        "info": {
            "title": base["info"]["title"],
            "version": version,
            "description": f"{cat['one_line']} {lid} Operations with security [] are free and unauthenticated. "
                           "Operations with x-payment-info are x402 doors; an amount appears only inside a door's 402 challenge (documented as each door's 402 example). "
                           # T09 (6 Oct 2026): the CDN's Browser Integrity Check refuses two library User-Agent strings.
                           # Say so until the edge rule exempts public data; remove this sentence once it does.
                           "Python's default urllib User-Agent (Python-urllib/x.y) is refused at our CDN with 403 'error code: 1010'. "
                           "Send any User-Agent, e.g. urllib.request.Request(url, headers={'User-Agent': 'my-check/1'}).",
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
                **verify_schemas,
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
                "verify_offline": "https://councilof.ai/verifier/verify_receipt.py",
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
            "public_operations": sum(1 for p, item in paths.items() if p not in door_paths
                                     for op in item.values() if op.get("security") == [] and "x-csoai-lifecycle" not in op),
            "unauthenticated_facades": sum(1 for p, item in paths.items() if p not in door_paths
                                           for op in item.values() if op.get("security") == [] and "x-csoai-lifecycle" in op),
        },
    }
    if proofs_doc and proofs_doc.get("proofs"):
        if proofs_doc.get("origin") != BASE:
            raise SystemExit(f"ownership_proofs.json origin {proofs_doc.get('origin')!r} is not {BASE!r}")
        spec["x-discovery"] = {"ownershipProofs": list(proofs_doc["proofs"]),
                               "signed_message": BASE,
                               "note": "EIP-191 personal_sign of the origin string by the payTo key; x402scan recovers the signer and compares it with accepts[].payTo"}
    return spec


# ───────────────────────────── the capability registry cross-check ─────────────────────────────
REGISTRY = REPO / "council-os" / "capabilities.json"


def registry_crosscheck(spec: dict) -> list[str]:
    """council-os/capabilities.json is the ONE declaration; this document is one of its renders.

    Three ways they can disagree, all the same defect in different directions:
      · the document carries an operation no capability declares — the catalogue claims something
        the registry does not know about, which is how a dead path survives a purge;
      · a capability declares surface "openapi" and the document does not carry it — the catalogue
        is missing a door the estate advertises. This is exactly how the ten /api/pop/* doors and
        /api/wrapper/changes sat in /.well-known/x402.json and in no OpenAPI operation until
        2026-09-22, invisible to every indexer that reads this document;
      · a capability's lifecycle and the document's x-csoai-lifecycle marker disagree — one route,
        two vocabularies.
    A route the OpenAPI producer cannot reach at all is NAMED in registry.openapi_gap, never
    counted: a new one has to be added there deliberately, and a stale exemption fails here.
    """
    if not REGISTRY.exists():
        return ["council-os/capabilities.json is missing — the document has no declaration behind it"]
    reg = json.loads(REGISTRY.read_text())
    errs: list[str] = []
    declared: dict[tuple[str, str], dict] = {}
    for c in reg["capabilities"]:
        if c.get("path"):
            declared[(c["path"], c["method"].lower())] = c
    gap = {(g["path"], g["method"].lower()) for g in reg.get("openapi_gap", [])}
    verbs = {"get", "post", "put", "patch", "delete", "head", "options"}

    documented: set[tuple[str, str]] = set()
    for path, item in spec["paths"].items():
        for method, op in item.items():
            if method.lower() not in verbs:
                continue
            key = (path, method.lower())
            documented.add(key)
            c = declared.get(key)
            if c is None:
                errs.append(f"{method.upper()} {path}: documented here and declared by no capability entry")
                continue
            if key in gap:
                errs.append(
                    f"{method.upper()} {path}: named in registry.openapi_gap as unreachable by this producer, "
                    "yet the document carries it — remove the stale exemption"
                )
            want, got = c["lifecycle"], op.get("x-csoai-lifecycle", "LIVE")
            if want != got:
                errs.append(
                    f"{method.upper()} {path}: the registry says lifecycle {want}, the document marks it {got} "
                    "— one route, two vocabularies"
                )

    for (path, method), c in sorted(declared.items()):
        if "openapi" in c.get("surfaces", []) and (path, method) not in documented:
            errs.append(
                f"{method.upper()} {path} ({c['id']}): declared for the openapi surface and absent from the document"
            )
    return errs


def render(spec: dict) -> str:
    return json.dumps(spec, indent=2, sort_keys=True) + "\n"


# ───────────────────────────── cli ─────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--check", action="store_true", help="regenerate in memory and fail on drift")
    ap.add_argument("--selftest", action="store_true", help="prove --check can go red")
    ap.add_argument("--fetch", action="store_true", help="refresh the 2 live catalog fixtures (2 requests); the manifest is always rendered from source")
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
        # and prove the registry cross-check can go red in each of its three directions
        planted = compose()
        planted["paths"]["/api/a-path-no-capability-declares"] = {"get": {"responses": {"200": {"description": "x"}}}}
        e1 = registry_crosscheck(planted)
        planted2 = compose()
        del planted2["paths"][planted2["x-x402"]["doors"][0]]
        e2 = registry_crosscheck(planted2)
        planted3 = compose()
        next(iter(planted3["paths"]["/api/gspc"].values()))["x-csoai-lifecycle"] = "RETIRED"
        e3 = registry_crosscheck(planted3)
        checks = (
            (any("declared by no capability entry" in x for x in e1), "an operation no capability declares"),
            (any("absent from the document" in x for x in e2), "a declared door missing from the document"),
            (any("two vocabularies" in x for x in e3), "a lifecycle the registry contradicts"),
        )
        for ok, label in checks:
            print(("✓ " if ok else "✖ ") + f"registry cross-check catches {label}")
        return 0 if all(ok for ok, _ in checks) else 1

    if args.fetch:
        budget = Budget(args.max_requests)
        print(f"=== fetching from {BASE} (cap {args.max_requests}) ===")
        fetch_catalogs(budget)
        if args.fetch_challenges:
            fetch_challenges(budget)
        print(f"  requests used: {budget.used}")

    rendered = render_manifest()
    wk_fixture = FIX / "well_known_x402.json"
    if args.check:
        if not wk_fixture.exists() or wk_fixture.read_text() != rendered:
            print("\u2716 manifest DRIFT: scripts/fixtures/x402scan/well_known_x402.json is not what "
                  "functions/.well-known/x402.json.ts renders")
            try:
                have = {r["url"] for r in json.loads(wk_fixture.read_text())["resources"]}
                want = {r["url"] for r in json.loads(rendered)["resources"]}
                for u in sorted(want - have):
                    print(f"    source adds   {u}")
                for u in sorted(have - want):
                    print(f"    source drops  {u}")
            except Exception:  # noqa: BLE001 — the headline already says what is wrong
                pass
            print("  fix: python3 scripts/build_openapi.py && git add scripts/fixtures/x402scan/well_known_x402.json public/openapi.json")
            return 1
    else:
        wk_fixture.write_text(rendered)

    spec = compose()
    text = render(spec)
    doors = spec["x-x402"]["doors"]
    xerrs = registry_crosscheck(spec)
    if xerrs:
        print(f"\u2716 openapi vs council-os/capabilities.json: {len(xerrs)} disagreement(s)")
        for e in xerrs:
            print("    " + e)
        print("  fix: reconcile the declaration (node scripts/capability-seed.mjs) or the producer — never both by hand")
        return 1
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
