#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Build the effect-binding census index the GSPC Route floor reads (functions/_lib/route/census.ts).

    eb_census_index.py <run_artifact.json> <run.signed.json> <out.json>

Input is ONE signed effect-binding server-probe run: the artifact and its signed companion. The companion's
payload.artifact.sha256 must equal the artifact's bytes, or nothing is written. Output keys every THIRD-PARTY
server of the run by sha256 of its normalised endpoint URL (no name or URL is written, so the index serves no
third-party string) and carries the raw outcome. SELF rows are never indexed. Two servers whose URLs normalise
to the same key with different outcomes become AMBIGUOUS, which the router reads as UNMEASURED.

The router maps BINDS -> CONSISTENT and DOES_NOT_BIND -> DIVERGENT; everything else is UNMEASURED.
"""
import collections
import hashlib
import json
import sys
from urllib.parse import urlsplit

SCHEMA = "csoai.effect-binding.census-index/0.1"


def normalise(url):
    """Same rule as normaliseEndpointUrl in functions/_lib/route/census.ts."""
    if not url or url.startswith("local:"):
        return None
    try:
        u = urlsplit(url.strip())
        port = u.port
    except ValueError:
        return None
    scheme = u.scheme.lower()
    if scheme not in ("https", "http") or not u.hostname:
        return None
    keep = port is not None and not ((scheme == "https" and port == 443) or (scheme == "http" and port == 80))
    return f"{scheme}://{u.hostname.lower()}{':%d' % port if keep else ''}{u.path.rstrip('/')}"


def key(url):
    n = normalise(url)
    return hashlib.sha256(n.encode()).hexdigest() if n else None


def build(art_bytes, signed):
    art = json.loads(art_bytes)
    sha = hashlib.sha256(art_bytes).hexdigest()
    if signed["payload"]["artifact"]["sha256"] != sha:
        raise SystemExit("REFUSED: the signed companion does not pin this artifact (sha256 differs)")
    entries, clash = {}, set()
    for s in art["third_party"]["servers"]:
        k = key(s.get("url"))
        if not k:
            continue
        if k in entries and entries[k]["outcome"] != s["outcome"]:
            clash.add(k)
        entries[k] = {"outcome": s["outcome"]}
    for k in clash:
        entries[k] = {"outcome": "AMBIGUOUS"}
    return {
        "schema": SCHEMA,
        "what": "Effect-binding outcome per public MCP endpoint, from one signed server-probe run, for the GSPC Route floor "
                "(floor:effect-binding-divergent). Keyed by sha256 of the normalised endpoint URL; no names or URLs are served.",
        "key_rule": "sha256(scheme://host[:non-default-port]/path), host lower-cased, query/fragment/credentials dropped, trailing '/' removed",
        "state_rule": {"BINDS": "CONSISTENT", "DOES_NOT_BIND": "DIVERGENT", "*": "UNMEASURED (PARTIAL, UNCHECKABLE, UNREACHABLE, NO_TOOLS, "
                       "NO_READONLY_TOOL, AMBIGUOUS, and any endpoint not in this index)"},
        "source": {
            "artifact": signed["payload"]["artifact"]["path"],
            "artifact_sha256": sha,
            "signed_companion": signed["payload"]["artifact"]["path"].replace(".json", ".signed.json"),
            "signed_payload_sha256": signed["signature"]["payload_sha256"],
            "signer": signed["signature"]["did"],
            "as_of": art["as_of"],
            "n": art["n"],
        },
        "counts": dict(sorted(collections.Counter(e["outcome"] for e in entries.values()).items())),
        "limits": [
            "One deterministic probe of one public endpoint on one day from one vantage point; not a grade, a rank or a security claim.",
            "P2 observes the server boundary, not its backend: DOES_NOT_BIND means an unauthorised argument was not refused, not that it was used.",
            "Authenticated servers are UNCHECKABLE by rule and therefore UNMEASURED here.",
        ],
        "entries": dict(sorted(entries.items())),
    }


if __name__ == "__main__":
    a, sgn, out = sys.argv[1:4]
    doc = build(open(a, "rb").read(), json.load(open(sgn)))
    with open(out, "w") as fh:
        json.dump(doc, fh, indent=1)
        fh.write("\n")
    print(out, len(doc["entries"]), doc["counts"])
