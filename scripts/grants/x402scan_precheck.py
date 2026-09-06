#!/usr/bin/env python3
"""x402scan_precheck.py — would x402scan register councilof.ai from its /openapi.json?

Ports the classification rules of @agentcash/discovery 1.7.5 (the library x402scan calls in
apps/scan/src/services/discovery/fetch-discovery.ts) and the registration rules in
apps/scan/src/lib/discovery/register-origin.ts, read 2026-09-06, and applies them to OUR
document. It never registers anything and never signs anything.

  python3 scripts/grants/x402scan_precheck.py                      # live: https://councilof.ai/openapi.json
  python3 scripts/grants/x402scan_precheck.py --file public/openapi.json   # the local artefact
  python3 scripts/grants/x402scan_precheck.py --probe --max-requests 10    # also GET each door the way x402scan does

Three verdict classes, and the exit code follows only the first:
  REQUIRED     x402scan cannot register without it (exit 1 on any failure)
  RECOMMENDED  x402scan warns or lowers the trust tier
  UNVERIFIED   what this script cannot know without x402scan running (a real probe, its DB, its UI)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BASE = "https://councilof.ai"
USER_AGENT = "csoai-x402scan-precheck/0.1 (+https://councilof.ai; nicholas@csoai.org)"
HEADER_WARN_BYTES = 16 * 1024  # x402scan HEADERS_OVERFLOW threshold (Node's default header limit)
METHODS = ("get", "post", "put", "patch", "delete", "head", "options", "trace")


class Report:
    def __init__(self):
        self.rows: list[tuple[str, bool | None, str]] = []

    def req(self, ok: bool, msg: str):
        self.rows.append(("REQUIRED", ok, msg))

    def rec(self, ok: bool, msg: str):
        self.rows.append(("RECOMMENDED", ok, msg))

    def unv(self, msg: str):
        self.rows.append(("UNVERIFIED", None, msg))

    def print(self) -> int:
        failed = 0
        for cls in ("REQUIRED", "RECOMMENDED", "UNVERIFIED"):
            rows = [r for r in self.rows if r[0] == cls]
            if not rows:
                continue
            print(f"\n{cls}")
            for _, ok, msg in rows:
                mark = "?" if ok is None else ("✓" if ok else "✗")
                print(f"  {mark} {msg}")
                if cls == "REQUIRED" and ok is False:
                    failed += 1
        print()
        if failed:
            print(f"✗ x402scan pre-check: {failed} required condition(s) unmet")
            return 1
        print("✓ x402scan pre-check: every required condition holds (read RECOMMENDED and UNVERIFIED before registering)")
        return 0


def fetch(url: str) -> tuple[int, dict[str, str], bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, e.read()


def normalize_path(p: str) -> str:
    p = p.split("?")[0].split("#")[0]
    p = p if p.startswith("/") else "/" + p
    p = re.sub(r"/+", "/", p)
    return p.rstrip("/") or "/"


def infer_auth_mode(op: dict, doc: dict) -> str | None:
    """Port of inferAuthMode(): x-payment-info alone means paid; security [] alone means unprotected."""
    has_pi = bool(op.get("x-payment-info"))
    sec = op.get("security")
    if isinstance(sec, list) and len(sec) == 0 and not has_pi:
        return "unprotected"
    effective = sec if sec is not None else (doc.get("security") or [])
    schemes = (doc.get("components") or {}).get("securitySchemes") or {}
    has_api_key = has_siwx = False
    for entry in effective:
        for name in entry:
            d = schemes.get(name) or {}
            if name == "siwx" or d.get("x-auth-kind") == "siwx":
                has_siwx = True
            elif name == "apiKey" or d.get("type") == "apiKey":
                has_api_key = True
    if has_pi and has_api_key:
        return "apiKey+paid"
    if has_pi:
        return "paid"
    if has_api_key:
        return "apiKey"
    if has_siwx:
        return "siwx"
    return None


def sample_value(schema: dict, example) -> str | None:
    """Port of sampleValue(): const > default > example > examples[0] > enum[0] > type default."""
    if example is not None:
        return str(example)
    for key in ("const", "default", "example"):
        if key in schema:
            return str(schema[key])
    if schema.get("examples"):
        return str(schema["examples"][0])
    if schema.get("enum"):
        return str(schema["enum"][0])
    fmt = schema.get("format")
    if schema.get("type") == "string":
        return {"uri": "https://placehold.co/1x1.png", "url": "https://placehold.co/1x1.png", "date-time": "2025-01-01T00:00:00Z", "date": "2025-01-01"}.get(fmt, "test")
    return "test"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--url", default=f"{BASE}/openapi.json")
    ap.add_argument("--file", help="check a local artefact instead of fetching")
    ap.add_argument("--well-known", default=str(REPO / "scripts/fixtures/x402scan/well_known_x402.json"),
                    help="the door list the document must match (fixture path or URL)")
    ap.add_argument("--probe", action="store_true", help="GET each paid door with sampled required params, expect 402 + accepts[]")
    ap.add_argument("--max-requests", type=int, default=10)
    args = ap.parse_args()
    rep = Report()
    requests_used = 0

    # 1. the document
    if args.file:
        raw = Path(args.file).read_bytes()
        rep.unv(f"read the LOCAL artefact {args.file}; the live /openapi.json is what x402scan reads — rerun without --file once deployed")
    else:
        status, headers, raw = fetch(args.url)
        requests_used += 1
        rep.req(status == 200, f"GET {args.url} → {status} (x402scan requires the document at exactly {{origin}}/openapi.json)")
        ct = headers.get("content-type", "")
        rep.rec("json" in ct, f"content-type is {ct!r}")
        if status != 200:
            return rep.print()
    try:
        doc = json.loads(raw)
    except json.JSONDecodeError as e:
        rep.req(False, f"document is not JSON: {e}")
        return rep.print()

    # 2. top level (DISCOVERY.md 'Required top-level fields')
    rep.req(isinstance(doc.get("openapi"), str) and doc["openapi"].startswith("3."), f"openapi = {doc.get('openapi')!r}")
    info = doc.get("info") or {}
    rep.req(isinstance(info.get("title"), str) and bool(info["title"]), f"info.title = {info.get('title')!r}")
    rep.req(isinstance(info.get("version"), str) and bool(info["version"]), f"info.version = {info.get('version')!r}")
    rep.req(isinstance(doc.get("paths"), dict) and bool(doc["paths"]), f"paths: {len(doc.get('paths') or {})} entries")
    rep.rec(isinstance(info.get("x-guidance"), str), "info.x-guidance present (agent-readable guidance; x402scan warns without it)")
    rep.rec(bool((info.get("contact") or {}).get("email")), f"info.contact.email = {(info.get('contact') or {}).get('email')!r} (ownership contact, merchant page)")
    servers = doc.get("servers") or []
    origin = urllib.parse.urlsplit(args.url).scheme + "://" + urllib.parse.urlsplit(args.url).netloc if not args.file else BASE
    s0 = (servers[0].get("url") if servers else None)
    rep.req(s0 == origin, f"servers[0].url = {s0!r} equals the origin {origin!r} (a foreign origin makes every resolved endpoint cross-origin → dropped)")
    base_path = urllib.parse.urlsplit(s0 or "").path.rstrip("/") if s0 else ""
    rep.rec(base_path == "", f"servers[0] has no base path ({base_path!r}) — a base path is prepended to every route")

    # 3. per operation
    paid, public, unclassified, siwx = [], [], [], []
    invocable: list[str] = []
    seen_paths: dict[str, list[str]] = {}
    for raw_path, item in doc["paths"].items():
        if "?" in raw_path:
            rep.req(False, f"path key {raw_path!r} contains a query string — OpenAPI forbids it and x402scan strips it")
        norm = normalize_path(base_path + raw_path)
        seen_paths.setdefault(norm, []).append(raw_path)
        for m in METHODS:
            op = item.get(m)
            if not isinstance(op, dict):
                continue
            mode = infer_auth_mode(op, doc)
            loc = f"{m.upper()} {raw_path}"
            if mode in ("paid", "apiKey+paid"):
                paid.append((raw_path, m, op))
                pi = op.get("x-payment-info") or {}
                protos = pi.get("protocols") if isinstance(pi, dict) else None
                has_x402 = isinstance(protos, list) and any((isinstance(p, dict) and "x402" in p) or p == "x402" for p in protos)
                rep.req("402" in (op.get("responses") or {}), f"{loc}: responses.402 declared")
                rep.rec(has_x402, f"{loc}: x-payment-info.protocols names x402")
                price = pi.get("price") if isinstance(pi, dict) else None
                rep.rec(isinstance(price, dict), f"{loc}: x-payment-info.price present (budgeting hint; ABSENT BY ESTATE RULE — amounts live only in the 402)" if not isinstance(price, dict) else f"{loc}: x-payment-info.price present")
                params = [p for p in (op.get("parameters") or []) if isinstance(p, dict)]
                body = (op.get("requestBody") or {}).get("content", {}).get("application/json", {}).get("schema")
                # Per-op this is a WARNING (L3_INPUT_SCHEMA_MISSING); the hard 'skipped' verdict comes from
                # the door's own 402 body lacking extensions.bazaar.schema…input.queryParams/body. A door
                # skipped that way does not block registration — the aggregate rule below does.
                rep.rec(bool(params) or bool(body), f"{loc}: input schema (parameters or requestBody) — without one x402scan marks the door 'non-invocable, skipped'")
                if params or body:
                    invocable.append(loc)
                req_q = [p for p in params if p.get("in") == "query" and p.get("required")]
                samplable = all(("example" in p) or any(k in (p.get("schema") or {}) for k in ("const", "default", "example", "examples", "enum")) for p in req_q)
                rep.rec(samplable, f"{loc}: every required query param carries const/enum/example so the probe reaches the 402 (required: {[p['name'] for p in req_q]})")
                ok200 = (op.get("responses") or {}).get("200", {}).get("content", {}).get("application/json", {}).get("schema")
                rep.rec(bool(ok200), f"{loc}: 200 response carries an output schema")
                if "security" in op and op["security"] == []:
                    rep.req(False, f"{loc}: security [] together with x-payment-info — still 'paid' in code, but contradicts the public/paid split")
            elif mode == "unprotected":
                public.append(loc)
            elif mode == "siwx":
                siwx.append(loc)
            else:
                unclassified.append((loc, list((op.get("responses") or {}).keys())))
    for norm, raws in seen_paths.items():
        if len(raws) > 1:
            rep.req(False, f"paths {raws} collapse to {norm!r} after normalisation")

    rep.req(len(paid) >= 1, f"{len(paid)} paid operation(s) — registration needs ≥1 paid resource that passes its probe (register-origin returns 422 'no_valid_resources' otherwise)")
    rep.req(len(invocable) >= 1, f"{len(invocable)} of {len(paid)} paid operation(s) carry an input schema and can be registered as invocable; the rest would be 'skipped'")
    rep.rec(True, f"{len(public)} operation(s) declare security [] (public); {len(siwx)} SIWX")
    if unclassified:
        rep.rec(False, f"{len(unclassified)} unclassified operation(s) (no security, no x-payment-info) — x402scan PROBES these and records each as failed 'Expected 402, got …': "
                       + ", ".join(f"{l} ({'/'.join(c)})" for l, c in unclassified[:6]) + (" …" if len(unclassified) > 6 else ""))
    else:
        rep.rec(True, "no unclassified operations")

    # 4. the paid set must be exactly the well-known door set
    try:
        wk = json.loads(fetch(args.well_known)[2]) if args.well_known.startswith("http") else json.loads(Path(args.well_known).read_text())
        if args.well_known.startswith("http"):
            requests_used += 1
        want = {normalize_path(urllib.parse.urlsplit(r["url"]).path) for r in wk["resources"]}
        have = {normalize_path(p) for p, _, _ in paid}
        rep.req(want == have, f"paid operations == /.well-known/x402.json resources ({len(have)} vs {len(want)})"
                + ("" if want == have else f"; only in document: {sorted(have - want)}; only in well-known: {sorted(want - have)}"))
    except Exception as e:  # noqa: BLE001
        rep.unv(f"could not compare against the well-known door list: {e}")

    # 5. ownership + rail
    proofs = ((doc.get("x-discovery") or {}).get("ownershipProofs")) or []
    rep.rec(bool(proofs), f"x-discovery.ownershipProofs: {len(proofs)} — without one the server's trust tier is not 'ownership_verified' (owner signs the origin string with the payTo key; see docs/product/X402SCAN-REGISTRATION.md)")
    xx = doc.get("x-x402") or {}
    rep.rec(bool(xx.get("payTo")) and xx.get("network", "").startswith("eip155:"), f"x-x402 vendor block: payTo {xx.get('payTo')!r}, network {xx.get('network')!r}, mode {xx.get('mode')!r}")
    idx = REPO / "scripts/fixtures/x402scan/challenge_index.json"
    if idx.exists():
        for did, e in json.loads(idx.read_text())["doors"].items():
            b = e.get("payment_required_header_bytes") or 0
            if b:
                rep.rec(b < HEADER_WARN_BYTES, f"{did}: PAYMENT-REQUIRED header {b} B ({'under' if b < HEADER_WARN_BYTES else 'OVER'} the 16 KiB x402scan HEADERS_OVERFLOW threshold; over it the library's fetch fails and x402scan falls back to a raw probe + warning)")

    # 6. optional live probe — what x402scan's registration actually does
    if args.probe:
        for raw_path, m, op in paid:
            if requests_used >= args.max_requests:
                rep.unv(f"probe budget ({args.max_requests}) exhausted before {m.upper()} {raw_path}")
                break
            q = {}
            for p in op.get("parameters") or []:
                if p.get("in") == "query" and p.get("required"):
                    q[p["name"]] = sample_value(p.get("schema") or {}, p.get("example"))
            url = origin + raw_path + ("?" + urllib.parse.urlencode(q) if q else "")
            status, headers, body = fetch(url)
            requests_used += 1
            try:
                j = json.loads(body)
            except json.JSONDecodeError:
                j = {}
            accepts = j.get("accepts") if isinstance(j, dict) else None
            hdr = len(headers.get("payment-required", ""))
            rep.req(status == 402 and bool(accepts), f"probe {m.upper()} {url} → {status}, accepts[] {len(accepts) if accepts else 0}, PAYMENT-REQUIRED {hdr} B")
            if status == 402 and accepts:
                a0 = accepts[0]
                rep.req(bool(re.fullmatch(r"[0-9]+", str(a0.get("amount", a0.get("maxAmountRequired", ""))))), f"  amount {a0.get('amount', a0.get('maxAmountRequired'))!r} is atomic units (x402scan rejects decimal dollars)")
                schema_in = (((j.get("extensions") or {}).get("bazaar") or {}).get("schema") or {}).get("properties", {}).get("input")
                rep.req(bool(schema_in), "  extensions.bazaar.schema.properties.input present (SCHEMA_INPUT_MISSING otherwise → skipped)")
    else:
        rep.unv(f"no live probe run (--probe): x402scan will GET each of the {len(paid)} doors with sampled required params and needs 402 + non-empty accepts[] + extensions.bazaar.schema input — the fixtures under scripts/fixtures/x402scan/challenges/ are the last observed answers")

    rep.unv("the /resources/register page is a JS shell to a plain fetch; the form fields were read from the source (apps/scan) and the API (POST /api/x402/registry/register-origin, SIWX-gated), not from a rendered page")
    rep.unv("whether x402scan LISTS security [] operations as 'Public' catalog rows (register-origin.ts registers them alongside a paid success) or skips them (integration-spec page says 'Skipped entirely') — code and page disagree")
    rep.unv("x402scan's own rate limits and probe concurrency (6) against councilof.ai")
    print(f"(requests used against {origin}: {requests_used})")
    return rep.print()


if __name__ == "__main__":
    sys.exit(main())
