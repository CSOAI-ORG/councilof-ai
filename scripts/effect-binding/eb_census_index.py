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

PER TOOL (schema 0.2). Each entry also carries `tools`: one row per tool the probe listed as read-only
(read_only_tools), keyed by sha256 of the tool name (no third-party string is served), with the P2 result
the probe observed for THAT tool:
  REJECTS           baseline call ok, the unauthorised extra argument refused  -> the router reads CONSISTENT
  ACCEPTS_SILENTLY  baseline call ok, the extra argument accepted silently    -> the router reads DIVERGENT
  INDETERMINATE     the baseline failed or both calls failed alike            -> UNMEASURED
  NOT_PROBED        listed read-only, no P2 attempt on it                     -> UNMEASURED
A tool absent from `tools` was not listed read-only by the probe: the router never executes it server-side.
"""
import collections
import hashlib
import json
import sys
from urllib.parse import urlsplit

SCHEMA = "csoai.effect-binding.census-index/0.2"

REFUSED_KINDS = ("tool_error", "rpc_error")


def attempt_result(a):
    """P2 result for one attempt: REJECTS, ACCEPTS_SILENTLY or INDETERMINATE (never guessed)."""
    base = (a.get("baseline") or {}).get("kind")
    extra = (a.get("extra") or {}).get("kind")
    if base != "ok":
        return "INDETERMINATE"
    if extra == "ok":
        return "ACCEPTS_SILENTLY"
    if extra in REFUSED_KINDS:
        return "REJECTS"
    return "INDETERMINATE"


def tool_key(name):
    return hashlib.sha256(name.encode()).hexdigest()


def per_tool(server):
    """{sha256(tool): {"p2": ...}} for every tool the probe listed read-only. A decisive attempt wins over an
    INDETERMINATE one on the same tool; two decisive attempts that disagree are INDETERMINATE."""
    out = {tool_key(t): {"p2": "NOT_PROBED"} for t in (server.get("read_only_tools") or []) if isinstance(t, str)}
    seen = {}
    for a in ((server.get("P2") or {}).get("attempts") or []):
        t = a.get("tool")
        if not isinstance(t, str) or tool_key(t) not in out:
            continue
        seen.setdefault(t, set()).add(attempt_result(a))
    for t, rs in seen.items():
        decisive = rs - {"INDETERMINATE"}
        out[tool_key(t)] = {"p2": decisive.pop() if len(decisive) == 1 else "INDETERMINATE"}
    return dict(sorted(out.items()))


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
        entries[k] = {"outcome": s["outcome"], "tools": per_tool(s)}
    for k in clash:
        entries[k] = {"outcome": "AMBIGUOUS", "tools": {}}
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
        "tool_rule": {"key": "sha256(tool name)", "listed": "only tools the probe listed read-only (read_only_tools)",
                      "p2": {"REJECTS": "CONSISTENT", "ACCEPTS_SILENTLY": "DIVERGENT", "INDETERMINATE": "UNMEASURED",
                             "NOT_PROBED": "UNMEASURED"}},
        "counts": dict(sorted(collections.Counter(e["outcome"] for e in entries.values()).items())),
        "tool_counts": dict(sorted(collections.Counter(t["p2"] for e in entries.values() for t in e["tools"].values()).items())),
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
