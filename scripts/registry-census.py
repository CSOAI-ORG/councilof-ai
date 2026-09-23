#!/usr/bin/env python3
"""Measure our own presence in the official MCP registry, and re-measure it on demand.

WHAT THIS IS FOR. We published 354 servers to registry.modelcontextprotocol.io under
`io.github.CSOAI-ORG/*`. We cannot edit or remove any of them: the registry builds a
publishing token's permissions from the verified identity alone, names are identity, and
published versions are immutable. So the only honest move available to us is to MEASURE what
we put there and publish the measurement. This script is that measurement, and it is the
producer of public/interop/mcp-registry-2026-09-23/census.json — so the numbers in the
published record and the numbers a reader can reproduce come from the same code.

WHAT IT MEASURES, AND WHAT EACH NUMBER IS NOT.

  servers            distinct server names under the namespace, walked to cursor exhaustion
                     with `version=latest`. NOT the number of rows in the registry.
  version_rows       the sum of every version of every one of those servers, one API call per
                     server. A server with nine versions contributes nine. These two numbers
                     are never summed and never substituted for one another.
  remote_endpoints   how many servers declare a remote, and which host each remote names. A
                     declared endpoint is a claim about a machine; whether it answers is a
                     separate measurement (`--probe-dns`).
  repository_probe   the declared source-code link, fetched ANONYMOUSLY. This is the whole
                     point of the probe: a GitHub 404 to a signed-out reader means either
                     "absent" or "hidden from you", and those are the same bytes. We therefore
                     do not claim the repositories are absent — we claim, and can only claim,
                     that a stranger following the link we published gets a 404.

THE CONTROL. A 404 sweep that hits a rate limit reports every URL as broken and looks like a
finding. So the probe always fetches two URLs it did not publish — one public repository that
must answer 200 and one path under the same host that must answer 404 — and refuses to write
an artifact if the controls do not come back as expected. Without that, this script cannot
tell "our links are dead" from "GitHub stopped talking to us for five minutes".

Absence is never inferred from a guessed URL: every name and URL read here came out of the
registry's own paginated API, not from a pattern we made up.

Usage:
    registry-census.py --out public/interop/mcp-registry-2026-09-23/census.json
    registry-census.py --namespace io.github.CSOAI-ORG --no-repo-probe   # fast, no GitHub
"""
from __future__ import annotations

import argparse
import collections
import concurrent.futures as futures
import json
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REGISTRY = "https://registry.modelcontextprotocol.io"
UA = "csoai-registry-census/1.0 (+https://councilof.ai)"

# Controls for the anonymous repository probe. The first MUST answer 200 and the second MUST
# answer 404 or the sweep's verdicts mean nothing. Neither is ours.
CONTROL_PRESENT = "https://github.com/modelcontextprotocol/registry"
CONTROL_ABSENT = "https://github.com/modelcontextprotocol/this-repository-does-not-exist-csoai-control"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def get_json(url: str, attempts: int = 5) -> dict:
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=45) as resp:
                return json.load(resp)
        except Exception as exc:  # noqa: BLE001 - retried, then surfaced
            last = exc
            if attempt < attempts - 1:
                time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"GET {url} failed after {attempts} attempts: {last}")


def list_namespace(namespace: str) -> list[dict]:
    """Every latest-version entry whose name begins with the namespace, cursor-exhausted.

    The registry's `search` is a substring match, so the prefix is re-checked locally: a
    substring hit on someone else's name must never be counted as ours.
    """
    rows: list[dict] = []
    cursor = None
    while True:
        query = {"search": namespace, "limit": "100", "version": "latest"}
        if cursor:
            query["cursor"] = cursor
        page = get_json(f"{REGISTRY}/v0/servers?" + urllib.parse.urlencode(query))
        rows.extend(page.get("servers", []))
        cursor = (page.get("metadata") or {}).get("nextCursor")
        if not cursor:
            break
    prefix = namespace if namespace.endswith("/") else namespace + "/"
    return [r for r in rows if r["server"]["name"].startswith(prefix)]


def count_versions(name: str) -> tuple[str, int | None]:
    url = f"{REGISTRY}/v0/servers/{urllib.parse.quote(name, safe='')}/versions"
    try:
        return name, len(get_json(url, attempts=4).get("servers", []))
    except Exception:  # noqa: BLE001 - a failure is reported as None, never as zero
        return name, None


def probe_url(url: str) -> int | str:
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception:  # noqa: BLE001 - a transport failure is not a status code
        return "ERROR"


def resolves(host: str) -> bool | None:
    try:
        socket.getaddrinfo(host, None)
        return True
    except socket.gaierror:
        return False
    except Exception:  # noqa: BLE001
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--namespace", default="io.github.CSOAI-ORG")
    ap.add_argument("--out", default=None)
    ap.add_argument("--no-repo-probe", action="store_true")
    ap.add_argument("--no-version-count", action="store_true")
    args = ap.parse_args()

    started = now_iso()
    rows = list_namespace(args.namespace)
    if not rows:
        print(f"HALT: no servers found under {args.namespace}", file=sys.stderr)
        return 2

    names = [r["server"]["name"] for r in rows]
    statuses = collections.Counter(
        r["_meta"]["io.modelcontextprotocol.registry/official"]["status"] for r in rows
    )

    # --- remotes -------------------------------------------------------------------------
    remote_hosts: collections.Counter = collections.Counter()
    remote_types: collections.Counter = collections.Counter()
    servers_with_remote = 0
    for r in rows:
        remotes = r["server"].get("remotes") or []
        if remotes:
            servers_with_remote += 1
        for remote in remotes:
            remote_types[remote.get("type")] += 1
            remote_hosts[urllib.parse.urlparse(remote.get("url", "")).hostname] += 1
    host_dns = {host: resolves(host) for host in remote_hosts if host}

    # --- packages ------------------------------------------------------------------------
    package_types: collections.Counter = collections.Counter()
    for r in rows:
        for pkg in r["server"].get("packages") or []:
            package_types[pkg.get("registryType")] += 1

    # --- versions ------------------------------------------------------------------------
    version_rows: int | None = None
    version_failures: list[str] = []
    if not args.no_version_count:
        total = 0
        with futures.ThreadPoolExecutor(8) as pool:
            for name, count in pool.map(count_versions, names):
                if count is None:
                    version_failures.append(name)
                else:
                    total += count
        # A partial read totalled as a population understates the truth. If any server's
        # version list could not be read, the total is not published as the total.
        version_rows = total if not version_failures else None

    # --- repositories --------------------------------------------------------------------
    declared_repos = [
        (r["server"]["name"], (r["server"].get("repository") or {}).get("url"))
        for r in rows
    ]
    with_repo = [(n, u) for n, u in declared_repos if u]
    no_repo_field = len(declared_repos) - len(with_repo)
    repo_owners: collections.Counter = collections.Counter()
    for _, url in with_repo:
        parts = urllib.parse.urlparse(url).path.strip("/").split("/")
        repo_owners[parts[0] if parts and parts[0] else "?"] += 1

    repo_probe: dict | None = None
    if not args.no_repo_probe:
        control_present = probe_url(CONTROL_PRESENT)
        control_absent = probe_url(CONTROL_ABSENT)
        if control_present != 200 or control_absent != 404:
            print(
                "HALT: probe controls failed "
                f"(present={control_present} expected 200, absent={control_absent} expected 404). "
                "Refusing to write an artifact: this sweep cannot tell a dead link from a "
                "throttled client.",
                file=sys.stderr,
            )
            return 3
        with futures.ThreadPoolExecutor(10) as pool:
            results = list(pool.map(lambda t: (t[0], t[1], probe_url(t[1])), with_repo))
        by_status: collections.Counter = collections.Counter(str(s) for _, _, s in results)
        repo_probe = {
            "note": (
                "Anonymous GET of every declared repository URL. A GitHub 404 to a signed-out "
                "reader means EITHER absent OR hidden; these bytes cannot tell them apart. The "
                "only claim made is about what a stranger following our published link receives."
            ),
            "controls": {
                "public_repo_we_do_not_own": {"url": CONTROL_PRESENT, "status": control_present, "expected": 200},
                "known_absent_path": {"url": CONTROL_ABSENT, "status": control_absent, "expected": 404},
            },
            "probed": len(results),
            "by_status": dict(by_status),
            "reachable_anonymously": [
                {"server": n, "url": u} for n, u, s in results if s == 200
            ],
        }

    artifact = {
        "schema": "csoai.mcp-registry-census/0.1",
        "kind": "measurement",
        "registry": REGISTRY,
        "namespace": args.namespace,
        "measured_utc": started,
        "completed_utc": now_iso(),
        "method": (
            "Walked GET /v0/servers?search=<namespace>&version=latest to cursor exhaustion, "
            "re-checked the namespace prefix locally, then GET "
            "/v0/servers/<name>/versions once per server. Every name and URL below came from "
            "the registry's own API; none was guessed."
        ),
        "servers": len(rows),
        "servers_note": (
            "Distinct server names. This is NOT the number of rows in the registry — see "
            "version_rows — and the two are never added together."
        ),
        "version_rows": version_rows,
        "version_rows_note": (
            "Total versions across every server above. null means at least one server's "
            "version list could not be read, and a partial sum is not published as a total."
        ),
        "version_read_failures": version_failures,
        "status_counts": dict(statuses),
        "remotes": {
            "servers_declaring_a_remote": servers_with_remote,
            "transport_types": dict(remote_types),
            "hosts": dict(remote_hosts),
            "host_dns_resolves": host_dns,
            "note": (
                "A declared endpoint is a claim about a machine. host_dns_resolves records "
                "whether the host has any DNS answer at measurement time; false means the name "
                "does not resolve at all, so nothing behind it can be reached by anyone."
            ),
        },
        "packages": {"registry_types": dict(package_types)},
        "repositories": {
            "declaring_a_url": len(with_repo),
            "no_repository_field": no_repo_field,
            "owners": dict(repo_owners),
            "anonymous_probe": repo_probe,
        },
    }

    text = json.dumps(artifact, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"wrote {out}", file=sys.stderr)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
