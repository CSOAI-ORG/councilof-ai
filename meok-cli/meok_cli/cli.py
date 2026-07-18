#!/usr/bin/env python3
"""
meok — the MEOK AI Labs CLI.

Stdlib-only, zero-dep command line over the MEOK Attestation API.

Commands:
  meok verify <cert_id>      — verify a signed cert by id (HTML page)
  meok verify --json <file>  — verify a JSON cert from disk
  meok docs                  — open Swagger UI for the API in your browser
  meok openapi               — print the OpenAPI 3.1 spec as JSON
  meok mcp list              — list MEOK MCP servers (full 32-MCP catalogue)
  meok mcp search <term>     — search the catalogue by keyword
  meok health                — check that the verifier API is up
  meok csoai map [region]    — display compliance map
  meok csoai crosswalk [domain] — show framework crosswalk matrix
  meok csoai dome            — show DOME status snapshot
  meok csoai council         — show council voting state
  meok csoai verify <cert_id> — verify SIGIL certificate
  meok csoai countdown       — show regulatory countdowns
  meok csoai status          — overall csoai.org system status
  meok version

Override the API base with MEOK_API_BASE (default https://meok-attestation-api.vercel.app).

© CSOAI LTD (trading as MEOK AI Labs) · MIT
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

try:
    from meok_cli import csoai
except ImportError:
    import csoai

# Single source of truth — overridable for local-dev + edge.
API_BASE = os.environ.get("MEOK_API_BASE", "https://meok-attestation-api.vercel.app").rstrip("/")
VERIFY_URL = os.environ.get("MEOK_VERIFY_URL", f"{API_BASE}/verify")
__version__ = "0.2.0"
USER_AGENT = f"meok-cli/{__version__}"

# Full 32-MCP catalogue (trade-compliance subset of the wider 271-on-PyPI ecosystem).
# Order matches haulage.app/catalogue.json. ✅ = pip-installable today.
CATALOGUE = [
    # ── UK trade core (live on PyPI) ───────────────────────────────
    ("haulage-uk-compliance-mcp",          True,  "DVSA, tachograph, drivers' hours, vehicle safety, road-user levy"),
    ("skip-hire-ai-mcp",                   True,  "Waste-carrier reg, EWC codes, consignment notes, duty-of-care"),
    ("nrswa-ai-mcp",                       True,  "S50 licence, works classification, S74 overrun, noticing timeline"),
    ("meok-tacho-audit-mcp",               True,  "DVSA OCRS 90-day forecast + Smart Tachograph 2 + Public Inquiry brief"),
    ("meok-bs7121-mcp",                    True,  "Crane/hiab lift plan + LOLER scheduling + CPA Contract-Lift triage"),
    ("meok-vehicle-handover-mcp",          True,  "Pre-delivery inspection + handover chain"),
    ("meok-ev-recall-transport-mcp",       True,  "UN R100/R136 EV battery + recall transport"),
    # ── UK trade extended (pending PyPI quota) ─────────────────────
    ("meok-haulage-governance-bridge-mcp", False, "Auto-bridge attestations to EU AI Act + UK AI Bill + NIST + ISO 42001"),
    ("meok-fors-clocs-mcp",                False, "FORS Bronze→Silver→Gold + CLOCS evidence pack"),
    ("meok-allmi-hiab-mcp",                False, "ALLMI hiab operator certification + magic-button SMS"),
    ("meok-dvsa-olicence-mcp",             False, "O-licence application + variation + repute checks"),
    ("meok-cpa-contract-lift-mcp",         False, "CPA Hire vs Contract Lift triage + Baldwins £951k case avoidance"),
    # ── EU + cross-border ──────────────────────────────────────────
    ("meok-eu-mobility-package-mcp",       False, "EU driver detachment, posting rules, Smart Tachograph 2"),
    ("meok-iru-tir-international-mcp",     False, "IRU TIR carnets cross-border + 78 contracting parties"),
    ("meok-iata-dgr-air-cargo-mcp",        False, "IATA DGR — dangerous goods air cargo, UN 38.3 batteries"),
    ("meok-imo-marpol-marine-mcp",         False, "IMO MARPOL marine — Annex I/II/V/VI sulphur/CO₂"),
    # ── International road ─────────────────────────────────────────
    ("meok-fmcsa-hours-of-service-mcp",    False, "US FMCSA HOS + ELD + DOT compliance"),
    ("meok-nhvr-australia-mcp",            False, "AU NHVR Chain of Responsibility + mass/dimension/loading"),
    ("meok-transport-canada-hos-mcp",      False, "Canada Transport HOS cycle 1/2 + ELD"),
    ("meok-uae-rta-transport-mcp",         False, "UAE RTA transport licensing + Salik tolls + Mawaqif"),
    # ── Rail + specialist ──────────────────────────────────────────
    ("meok-rail-freight-uk-mcp",           False, "ORR, ROGS, RID dangerous goods rail"),
    ("meok-cold-chain-pharma-mcp",         False, "GDP cold-chain pharma — temp excursion + qualified person"),
    ("meok-livestock-welfare-transport-mcp", False, "Livestock welfare in transit (>8h journey + species rules)"),
    ("meok-uas-commercial-drone-mcp",      False, "UAS commercial drone — open/specific/certified categories"),
    ("meok-uk-phv-tfl-mcp",                False, "TfL PHV licensing + driver vetting + medical"),
    ("meok-eu-platform-worker-mcp",        False, "EU Platform Work Directive — algorithmic management + transparency"),
]


def _get(url, timeout=12, accept="application/json"):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode()


def _post(url, body, timeout=12):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode()


# ── Commands ────────────────────────────────────────────────────────


def cmd_verify(args):
    cid = args.cert_id
    json_file = getattr(args, "json_file", None)

    # JSON-payload mode: POST a full cert to /verify
    if json_file:
        try:
            with open(json_file, encoding="utf-8") as f:
                cert = json.load(f)
        except OSError as e:
            print(json.dumps({"error": f"cannot read {json_file}: {e}"}))
            return 1
        try:
            body = _post(f"{API_BASE}/verify", cert)
            print(body)
            result = json.loads(body)
            return 0 if result.get("valid") else 1
        except urllib.error.HTTPError as e:
            print(json.dumps({"error": f"verify HTTP {e.code}", "body": e.read().decode("utf-8", errors="replace")}))
            return 1
        except Exception as e:
            print(json.dumps({"error": str(e), "endpoint": f"{API_BASE}/verify"}))
            return 1

    # cert-id mode: GET /v/<id> for the HTML verify page
    if not cid:
        print("error: pass either a cert_id or --json <file>", file=sys.stderr)
        return 2
    try:
        url = f"{API_BASE}/v/{urllib.parse.quote(cid)}"
        print(_get(url, accept="text/html"))
        return 0
    except urllib.error.HTTPError as e:
        print(json.dumps({"error": f"verify HTTP {e.code}", "cert_id": cid, "endpoint": url}))
        return 1
    except Exception as e:
        print(json.dumps({"error": str(e), "cert_id": cid, "endpoint": url}))
        return 1


def cmd_docs(args):
    url = f"{API_BASE}/docs"
    print(f"opening {url} …")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"  (could not open browser: {e})")
        print(f"  visit manually: {url}")
    return 0


def cmd_openapi(args):
    try:
        print(_get(f"{API_BASE}/openapi.json"))
        return 0
    except Exception as e:
        print(json.dumps({"error": str(e), "endpoint": f"{API_BASE}/openapi.json"}))
        return 1


def cmd_health(args):
    try:
        body = _get(f"{API_BASE}/health")
        print(body)
        result = json.loads(body)
        return 0 if result.get("ok") or result.get("status") == "ok" else 1
    except Exception as e:
        print(json.dumps({"error": str(e), "endpoint": f"{API_BASE}/health"}))
        return 1


def cmd_mcp_list(args):
    live = sum(1 for _, ok, _ in CATALOGUE if ok)
    print(f"MEOK Trade-Compliance MCP catalogue — {len(CATALOGUE)} servers ({live} live on PyPI today):\n")
    for name, ok, desc in CATALOGUE:
        marker = "🟢" if ok else "🟡"
        print(f"  {marker} {name:42} {desc}")
    print(f"\n  install live ones: pip install <name>")
    print(f"  full catalogue (JSON): {API_BASE.replace('meok-attestation-api', 'haulage.app').replace('/api', '')}/catalogue.json")
    print("  interactive docs:  https://haulage.app/docs/quickstart")
    return 0


def cmd_mcp_search(args):
    term = args.term.lower()
    hits = [(n, ok, d) for n, ok, d in CATALOGUE if term in n.lower() or term in d.lower()]
    if not hits:
        print(f"no catalogue match for '{args.term}' (try: dvsa, tacho, fors, eu, iata, fmcsa, cold-chain)")
        return 1
    for n, ok, d in hits:
        marker = "🟢" if ok else "🟡"
        print(f"  {marker} {n:42} {d}")
    return 0


def cmd_version(args):
    print(f"meok {__version__} — CSOAI LTD (trading as MEOK AI Labs)")
    print(f"  API base:    {API_BASE}")
    print(f"  verify URL:  {VERIFY_URL}")
    return 0


def build_parser():
    p = argparse.ArgumentParser(prog="meok", description="MEOK AI Labs CLI")
    sub = p.add_subparsers(dest="cmd")

    v = sub.add_parser("verify", help="verify a signed cert (by id or JSON file)")
    v.add_argument("cert_id", nargs="?", help="cert_id to verify (uses /v/<id>)")
    v.add_argument("--json", dest="json_file", metavar="FILE",
                   help="POST a full JSON cert to /verify and exit non-zero if invalid")
    v.set_defaults(func=cmd_verify)

    sub.add_parser("docs", help="open Swagger UI in your browser").set_defaults(func=cmd_docs)
    sub.add_parser("openapi", help="print OpenAPI 3.1 spec").set_defaults(func=cmd_openapi)
    sub.add_parser("health", help="check that the verifier API is up").set_defaults(func=cmd_health)

    m = sub.add_parser("mcp", help="MCP catalogue")
    msub = m.add_subparsers(dest="mcpcmd")
    msub.add_parser("list", help="list 32 trade-compliance MCPs").set_defaults(func=cmd_mcp_list)
    msr = msub.add_parser("search", help="search the catalogue by keyword")
    msr.add_argument("term")
    msr.set_defaults(func=cmd_mcp_search)

    sub.add_parser("version", help="show version").set_defaults(func=cmd_version)

    csoai.register(sub)
    return p


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        parser.print_help()
        return 0
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
