"""csoai subcommand for meok-cli — query csoai.org data from the terminal.

Commands:
  meok csoai map [region]       — display compliance map
  meok csoai crosswalk [domain] — show framework crosswalk matrix
  meok csoai dome               — show DOME status snapshot
  meok csoai council            — show council voting state
  meok csoai verify <cert_id>  — verify SIGIL certificate
  meok csoai countdown          — show regulatory countdowns
  meok csoai status             — overall system status

Override the API base with CSOAI_API_BASE (default https://csoai.org/api).
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

CSOAI_API_BASE = os.environ.get("CSOAI_API_BASE", "https://csoai.org/api").rstrip("/")
USER_AGENT = "meok-cli/csoai"


class _C:
    """ANSI colour codes — disabled when stdout is not a TTY."""

    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    CYAN = "\033[36m"
    DIM = "\033[2m"


def _c(text, color):
    if sys.stdout.isatty():
        return f"{color}{text}{_C.RESET}"
    return text


def _get(url, timeout=12):
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode()


def _fetch_json(url):
    try:
        return json.loads(_get(url))
    except urllib.error.HTTPError as e:
        return {
            "error": f"HTTP {e.code}",
            "url": url,
            "body": e.read().decode("utf-8", "replace"),
        }
    except urllib.error.URLError as e:
        return {"error": f"Network error: {e.reason}", "url": url}
    except Exception as e:
        return {"error": str(e), "url": url}


def _out(data, args, pretty_fn=None):
    if getattr(args, "json", False):
        print(json.dumps(data, indent=2))
        return
    if pretty_fn:
        pretty_fn(data, args)
    else:
        print(json.dumps(data, indent=2))


# ── Commands ─────────────────────────────────────────────────────────


def cmd_map(args):
    url = f"{CSOAI_API_BASE}/map.json"
    data = _fetch_json(url)
    if "error" in data:
        _out(data, args)
        return 1
    _out(data, args, _pretty_map)
    return 0


def _pretty_map(data, args):
    region = getattr(args, "region", None)
    print(_c("CSOAI Compliance Map", _C.BOLD + _C.CYAN))
    print("=" * 50)
    items = data if isinstance(data, list) else data.get("regions", data.get("map", []))
    if not items:
        print("No map data available.")
        return
    for item in items:
        if isinstance(item, dict):
            name = item.get("region", item.get("name", "Unknown"))
            if region and region.lower() not in name.lower():
                continue
            status = item.get("status", item.get("compliance_status", "N/A"))
            color = _C.GREEN if "compliant" in str(status).lower() else _C.YELLOW
            print(f"  {_c(name, _C.BOLD)}: {_c(status, color)}")
            if item.get("effective_date"):
                print(f"    Effective: {item['effective_date']}")
            if item.get("countdown"):
                print(f"    Countdown: {item['countdown']} days")
        else:
            print(f"  {item}")


def cmd_crosswalk(args):
    url = f"{CSOAI_API_BASE}/crosswalk.json"
    data = _fetch_json(url)
    if "error" in data:
        _out(data, args)
        return 1
    _out(data, args, _pretty_crosswalk)
    return 0


def _pretty_crosswalk(data, args):
    domain = getattr(args, "domain", None)
    print(_c("Framework Crosswalk Matrix", _C.BOLD + _C.CYAN))
    print("=" * 50)
    items = data if isinstance(data, list) else data.get("crosswalk", data.get("frameworks", []))
    if not items:
        print("No crosswalk data available.")
        return
    for item in items:
        if isinstance(item, dict):
            name = item.get("domain", item.get("framework", item.get("name", "Unknown")))
            if domain and domain.lower() not in name.lower():
                continue
            mappings = item.get("mappings", item.get("mapping", []))
            print(f"  {_c(name, _C.BOLD)}")
            if isinstance(mappings, list):
                for m in mappings:
                    print(f"    → {m}")
            elif isinstance(mappings, dict):
                for k, v in mappings.items():
                    print(f"    {k}: {v}")
            else:
                print(f"    {mappings}")
        else:
            print(f"  {item}")


def cmd_dome(args):
    url = f"{CSOAI_API_BASE}/dome/status.json"
    data = _fetch_json(url)
    if "error" in data:
        _out(data, args)
        return 1
    _out(data, args, _pretty_dome)
    return 0


def _pretty_dome(data, args):
    print(_c("DOME Status Snapshot", _C.BOLD + _C.CYAN))
    print("=" * 50)
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, bool):
                color = _C.GREEN if value else _C.RED
                print(f"  {_c(key, _C.BOLD)}: {_c(str(value), color)}")
            else:
                print(f"  {_c(key, _C.BOLD)}: {value}")
    else:
        print(data)


def cmd_council(args):
    url = f"{CSOAI_API_BASE}/council/votes.json"
    data = _fetch_json(url)
    if "error" in data:
        _out(data, args)
        return 1
    _out(data, args, _pretty_council)
    return 0


def _pretty_council(data, args):
    print(_c("Council Voting State", _C.BOLD + _C.CYAN))
    print("=" * 50)
    items = data if isinstance(data, list) else data.get("votes", data.get("proposals", []))
    if not items:
        print("No voting data available.")
        return
    for item in items:
        if isinstance(item, dict):
            title = item.get("proposal", item.get("title", "Unknown"))
            status = item.get("status", item.get("state", "N/A"))
            votes = item.get("votes", {})
            color = _C.GREEN if "pass" in str(status).lower() else _C.YELLOW
            print(f"  {_c(title, _C.BOLD)}: {_c(status, color)}")
            if isinstance(votes, dict):
                for k, v in votes.items():
                    print(f"    {k}: {v}")
            else:
                print(f"    votes: {votes}")
        else:
            print(f"  {item}")


def cmd_verify(args):
    cert_id = args.cert_id
    url = f"{CSOAI_API_BASE}/sigil/verify.json"
    try:
        if cert_id:
            full_url = f"{url}?cert_id={urllib.parse.quote(cert_id)}"
            body = _get(full_url)
        else:
            print("error: cert_id required", file=sys.stderr)
            return 2
        data = json.loads(body)
    except urllib.error.HTTPError as e:
        data = {
            "error": f"HTTP {e.code}",
            "url": url,
            "body": e.read().decode("utf-8", "replace"),
        }
    except Exception as e:
        data = {"error": str(e), "url": url}

    if "error" in data:
        _out(data, args)
        return 1
    _out(data, args, _pretty_verify)
    return 0


def _pretty_verify(data, args):
    valid = data.get("valid", data.get("verified", False))
    color = _C.GREEN if valid else _C.RED
    print(_c("SIGIL Certificate Verification", _C.BOLD + _C.CYAN))
    print("=" * 50)
    print(f"  Status: {_c('VALID' if valid else 'INVALID', color)}")
    for key, value in data.items():
        if key not in ("valid", "verified"):
            print(f"  {key}: {value}")


def cmd_countdown(args):
    url = f"{CSOAI_API_BASE}/map.json"
    data = _fetch_json(url)
    if "error" in data:
        _out(data, args)
        return 1
    _out(data, args, _pretty_countdown)
    return 0


def _pretty_countdown(data, args):
    print(_c("Regulatory Countdowns", _C.BOLD + _C.CYAN))
    print("=" * 50)
    items = data if isinstance(data, list) else data.get("regions", data.get("map", []))
    found = False
    for item in items:
        if isinstance(item, dict):
            countdown = item.get("countdown") or item.get("days_remaining") or item.get("deadline")
            if countdown:
                found = True
                name = item.get("region", item.get("name", "Unknown"))
                print(f"  {_c(name, _C.BOLD)}: {countdown} days remaining")
                if item.get("deadline"):
                    print(f"    Deadline: {item['deadline']}")
                if item.get("effective_date"):
                    print(f"    Effective: {item['effective_date']}")
    if not found:
        print("No countdown data available in map.json.")


def cmd_status(args):
    endpoints = {
        "map": f"{CSOAI_API_BASE}/map.json",
        "crosswalk": f"{CSOAI_API_BASE}/crosswalk.json",
        "dome": f"{CSOAI_API_BASE}/dome/status.json",
        "council": f"{CSOAI_API_BASE}/council/votes.json",
        "sigil": f"{CSOAI_API_BASE}/sigil/verify.json",
    }
    results = {}
    for name, url in endpoints.items():
        try:
            _get(url)
            results[name] = "ok"
        except Exception as e:
            results[name] = f"error: {e}"

    if getattr(args, "json", False):
        print(json.dumps(results, indent=2))
        return 0 if all(v == "ok" for v in results.values()) else 1

    print(_c("CSOAI System Status", _C.BOLD + _C.CYAN))
    print("=" * 50)
    all_ok = True
    for name, status in results.items():
        if status == "ok":
            print(f"  {name:12} {_c('●', _C.GREEN)} {status}")
        else:
            all_ok = False
            print(f"  {name:12} {_c('●', _C.RED)} {status}")
    print("=" * 50)
    print(
        f"  Overall: {_c('HEALTHY', _C.GREEN) if all_ok else _c('DEGRADED', _C.YELLOW)}"
    )
    return 0 if all_ok else 1


# ── Registration ─────────────────────────────────────────────────────


def register(subparsers):
    """Register the `csoai` subcommand with the main meok parser."""
    c = subparsers.add_parser("csoai", help="query csoai.org compliance data")
    csub = c.add_subparsers(dest="csoai_cmd")

    def add_json(p):
        p.add_argument("--json", action="store_true", help="output raw JSON for piping")

    m = csub.add_parser("map", help="display compliance map")
    m.add_argument("region", nargs="?", help="filter by region name")
    add_json(m)
    m.set_defaults(func=cmd_map)

    cw = csub.add_parser("crosswalk", help="show framework crosswalk matrix")
    cw.add_argument("domain", nargs="?", help="filter by domain")
    add_json(cw)
    cw.set_defaults(func=cmd_crosswalk)

    d = csub.add_parser("dome", help="show DOME status snapshot")
    add_json(d)
    d.set_defaults(func=cmd_dome)

    co = csub.add_parser("council", help="show council voting state")
    add_json(co)
    co.set_defaults(func=cmd_council)

    v = csub.add_parser("verify", help="verify a SIGIL certificate")
    v.add_argument("cert_id", help="SIGIL certificate ID")
    add_json(v)
    v.set_defaults(func=cmd_verify)

    cd = csub.add_parser("countdown", help="show regulatory countdowns")
    add_json(cd)
    cd.set_defaults(func=cmd_countdown)

    s = csub.add_parser("status", help="overall csoai.org system status")
    add_json(s)
    s.set_defaults(func=cmd_status)
