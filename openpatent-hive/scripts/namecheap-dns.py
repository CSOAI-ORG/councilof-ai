#!/usr/bin/env python3
"""
namecheap-dns.py — DEFONEOS mythic DNS forge.

Calls the Namecheap API to:
  1. Register a domain (namecheap.domains.create)
  2. Set A records (namecheap.domains.dns.setHosts)

Uses xml.dom.minidom for XML parsing (no external deps).
Has retry with exponential backoff and clear error messages.

USAGE
-----
  # Register a domain
  python3 namecheap-dns.py register legalof.ai

  # Set A records (root + www) to a target IP
  python3 namecheap-dns.py sethosts legalof.ai 35.242.143.249

  # Dry-run (prints request, no API call)
  python3 namecheap-dns.py --dry-run sethosts legalof.ai 35.242.143.249

ENV VARS REQUIRED
-----------------
  NAMECHEAP_API_KEY     — API key from Namecheap dashboard
  NAMECHEAP_API_USER    — API user (often same as username)
  NAMECHEAP_USERNAME    — Account username
  NAMECHEAP_CLIENT_IP   — Whitelisted IP for API access
                          (the IP that will be making the request)

OPTIONAL
--------
  NAMECHEAP_SANDBOX=1   — Use sandbox endpoint instead of production

SAFETY
------
This script will register domains (REAL MONEY via Namecheap).
Confirm twice before running `register`.
"""

import os
import sys
import time
import urllib.parse
import urllib.request
import xml.dom.minidom
from typing import List, Tuple, Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ENDPOINT_PROD = "https://api.namecheap.com/xml.response"
ENDPOINT_SANDBOX = "https://api.sandbox.namecheap.com/xml.response"

API_COMMANDS = {
    "register": "namecheap.domains.create",
    "sethosts": "namecheap.domains.dns.setHosts",
}

MAX_RETRIES = 3
BACKOFF_BASE = 2  # seconds; 2, 4, 8


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class NamecheapError(Exception):
    """Base error for Namecheap API failures."""


class AuthError(NamecheapError):
    """Missing or invalid credentials."""


class APIError(NamecheapError):
    """API returned an error status or unexpected payload."""

    def __init__(self, message: str, errors: Optional[List[str]] = None):
        super().__init__(message)
        self.errors = errors or []


# ---------------------------------------------------------------------------
# Credentials
# ---------------------------------------------------------------------------

def load_credentials() -> Tuple[str, str, str, str]:
    """Load Namecheap credentials from environment.

    Returns: (api_key, api_user, username, client_ip)

    Raises AuthError if any are missing.
    """
    api_key = os.environ.get("NAMECHEAP_API_KEY", "").strip()
    api_user = os.environ.get("NAMECHEAP_API_USER", "").strip()
    username = os.environ.get("NAMECHEAP_USERNAME", "").strip()
    client_ip = os.environ.get("NAMECHEAP_CLIENT_IP", "").strip()

    missing = []
    if not api_key:
        missing.append("NAMECHEAP_API_KEY")
    if not api_user:
        missing.append("NAMECHEAP_API_USER")
    if not username:
        missing.append("NAMECHEAP_USERNAME")
    if not client_ip:
        missing.append("NAMECHEAP_CLIENT_IP")

    if missing:
        raise AuthError(
            "Missing required environment variables: "
            + ", ".join(missing)
            + "\n\nSet them in ~/.zshrc and `source ~/.zshrc`, e.g.:\n"
            + '  export NAMECHEAP_API_KEY="your-api-key"\n'
            + '  export NAMECHEAP_API_USER="your-username"\n'
            + '  export NAMECHEAP_USERNAME="your-username"\n'
            + '  export NAMECHEAP_CLIENT_IP="1.2.3.4"\n\n'
            + "Get the API key from: https://ap.www.namecheap.com/settings/tools/api"
        )

    return api_key, api_user, username, client_ip


def endpoint() -> str:
    """Return the production or sandbox endpoint."""
    if os.environ.get("NAMECHEAP_SANDBOX") == "1":
        return ENDPOINT_SANDBOX
    return ENDPOINT_PROD


# ---------------------------------------------------------------------------
# HTTP + XML
# ---------------------------------------------------------------------------

def call_api(command: str, params: dict, dry_run: bool = False) -> str:
    """Call the Namecheap API and return the raw XML response string.

    Retries on network errors with exponential backoff.
    Raises APIError on non-200 responses or malformed XML.
    """
    creds = load_credentials()
    api_key, api_user, username, client_ip = creds

    query = {
        "ApiUser": api_user,
        "ApiKey": api_key,
        "UserName": username,
        "ClientIp": client_ip,
        "Command": command,
    }
    query.update(params)

    url = endpoint() + "?" + urllib.parse.urlencode(query)

    if dry_run:
        print(f"[DRY-RUN] {url}")
        return "<ApiResponse Status=\"OK\"></ApiResponse>"

    last_err: Optional[Exception] = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "namecheap-dns.py/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8")
                if resp.status != 200:
                    raise APIError(f"HTTP {resp.status}: {body[:500]}")
                return body
        except urllib.error.HTTPError as e:
            last_err = APIError(f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')[:500]}")
        except urllib.error.URLError as e:
            last_err = NamecheapError(f"URL error: {e.reason}")
        except Exception as e:
            last_err = NamecheapError(f"{type(e).__name__}: {e}")

        if attempt < MAX_RETRIES:
            wait = BACKOFF_BASE ** attempt
            print(f"[retry {attempt}/{MAX_RETRIES}] {last_err} — sleeping {wait}s", file=sys.stderr)
            time.sleep(wait)

    raise APIError(f"Failed after {MAX_RETRIES} attempts: {last_err}")


def parse_response(xml_text: str) -> Tuple[str, List[str], str]:
    """Parse a Namecheap XML response.

    Returns: (status, errors, raw_inner)
      status — "OK", "ERROR", or "UNKNOWN"
      errors — list of human-readable error strings
      raw_inner — pretty-printed inner XML (for debugging)
    """
    try:
        doc = xml.dom.minidom.parseString(xml_text)
    except xml.dom.minidom.ExpatError as e:
        raise APIError(f"Malformed XML from API: {e}\n--- body ---\n{xml_text[:1000]}")

    api_resp = doc.getElementsByTagName("ApiResponse")
    if not api_resp:
        raise APIError(f"No <ApiResponse> in body:\n{xml_text[:1000]}")

    node = api_resp[0]
    status = node.getAttribute("Status") or "UNKNOWN"
    errors: List[str] = []

    if status == "ERROR":
        for err in doc.getElementsByTagName("Error"):
            num = err.getAttribute("Number") or "?"
            text = "".join(child.data for child in err.childNodes if child.nodeType == child.TEXT_NODE).strip()
            errors.append(f"[{num}] {text}")
    elif status != "OK":
        errors.append(f"Unexpected status: {status}")

    raw_inner = api_resp[0].toxml()
    return status, errors, raw_inner


# ---------------------------------------------------------------------------
# High-level operations
# ---------------------------------------------------------------------------

def register_domain(domain: str, years: int = 1, dry_run: bool = False) -> str:
    """Register a domain via namecheap.domains.create.

    NOTE: This costs real money. The caller is responsible for confirmation.
    """
    parts = domain.split(".")
    if len(parts) < 2:
        raise APIError(f"Invalid domain: {domain!r}")

    params = {
        "DomainName": domain,
        "Years": str(years),
    }
    xml_text = call_api(API_COMMANDS["register"], params, dry_run=dry_run)
    status, errors, _ = parse_response(xml_text)
    if status != "OK":
        raise APIError(f"register({domain}) failed", errors=errors)
    return f"Registered: {domain} ({years}y)"


def set_hosts(
    domain: str,
    target_ip: str,
    hosts: Optional[List[Tuple[str, str]]] = None,
    dry_run: bool = False,
) -> str:
    """Set DNS A records for a domain via namecheap.domains.dns.setHosts.

    Args:
        domain: e.g. "legalof.ai"
        target_ip: e.g. "35.242.143.249"
        hosts: list of (subdomain, record_type) pairs.
               Defaults to [("", "A"), ("www", "A")]
               meaning root + www both get A records.
    """
    sld, tld = domain.split(".", 1)
    if hosts is None:
        hosts = [("", "A"), ("www", "A")]

    params = {
        "SLD": sld,
        "TLD": "." + tld,
    }
    for idx, (host_name, rec_type) in enumerate(hosts, start=1):
        params[f"HostName{idx}"] = host_name
        params[f"RecordType{idx}"] = rec_type
        params[f"Address{idx}"] = target_ip
        params[f"TTL{idx}"] = "300"

    xml_text = call_api(API_COMMANDS["sethosts"], params, dry_run=dry_run)
    status, errors, _ = parse_response(xml_text)
    if status != "OK":
        raise APIError(f"sethosts({domain}) failed", errors=errors)

    host_summary = ", ".join(f"{h or '@'}/{t}" for h, t in hosts)
    return f"Set {host_summary} → {target_ip} for {domain}"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def usage() -> str:
    return (
        "Usage:\n"
        "  namecheap-dns.py register <domain> [--years N] [--dry-run]\n"
        "  namecheap-dns.py sethosts <domain> <ip> [--dry-run]\n"
        "\n"
        "Example:\n"
        "  namecheap-dns.py sethosts legalof.ai 35.242.143.249"
    )


def main(argv: List[str]) -> int:
    if "--help" in argv or "-h" in argv or len(argv) < 2:
        print(usage())
        return 0 if len(argv) >= 2 else 1

    dry_run = "--dry-run" in argv
    argv = [a for a in argv if a != "--dry-run"]

    action = argv[1]
    try:
        if action == "register":
            if len(argv) < 3:
                print("register requires a domain", file=sys.stderr)
                return 1
            domain = argv[2]
            years = 1
            if "--years" in argv:
                idx = argv.index("--years")
                years = int(argv[idx + 1])
            if not dry_run:
                print(
                    f"⚠️  About to REGISTER {domain} for {years} year(s).\n"
                    f"    This will charge your Namecheap account.\n"
                    f"    Press Ctrl-C within 5 seconds to abort...",
                    file=sys.stderr,
                )
                time.sleep(5)
            result = register_domain(domain, years=years, dry_run=dry_run)
            print(result)
            return 0

        elif action == "sethosts":
            if len(argv) < 4:
                print("sethosts requires <domain> <ip>", file=sys.stderr)
                return 1
            domain = argv[2]
            ip = argv[3]
            result = set_hosts(domain, ip, dry_run=dry_run)
            print(result)
            return 0

        else:
            print(f"Unknown action: {action!r}\n\n{usage()}", file=sys.stderr)
            return 1

    except AuthError as e:
        print(f"❌ Auth: {e}", file=sys.stderr)
        return 2
    except APIError as e:
        print(f"❌ API: {e}", file=sys.stderr)
        for err in e.errors:
            print(f"   • {err}", file=sys.stderr)
        return 3
    except NamecheapError as e:
        print(f"❌ {e}", file=sys.stderr)
        return 4


if __name__ == "__main__":
    sys.exit(main(sys.argv))
