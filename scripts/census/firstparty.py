#!/usr/bin/env python3
"""First-party provider tier for the census probe plan: a coverage fix, not a member list.

The top-20% plan (reach.py) ranks endpoints by package-download signals. A provider's own hosted
server usually has no package to download (it is a URL, not an npm/pypi/oci artifact), so a
download-ranked plan systematically misses the first-party remote servers of large providers.
This tier adds them back by a rule that reads only the frame's own bytes.

RULE (measured, deterministic; every match records its basis):
  An endpoint is FIRST-PARTY when its host is operated by the organisation that publishes the
  registry entry listing it, read as a domain match between the publisher identity and the
  endpoint host, compared at the REGISTRABLE DOMAIN (Public Suffix List, ICANN + private
  sections, so foo.workers.dev and bar.vercel.app are distinct registrable domains):

  namespace_domain   the entry's MCP-registry name is reverse-DNS `tld.domain[.sub]/name` (any
                     namespace except io.github.*): reverse it, and registrable(namespace) ==
                     registrable(endpoint host). The registry's publishing rules require the
                     publisher to prove control of that domain (DNS or HTTP challenge) before it
                     may publish under the namespace - that proof is the registry's, not ours.
  github_owner_label the entry is io.github.<owner>/... (registry: GitHub-authenticated) OR its
                     repository.url is github.com/<owner>/..., and <owner> equals the leftmost
                     label of registrable(endpoint host), compared lower-case with '-' and '_'
                     removed, owner length >= 3. A string match, weaker than namespace_domain,
                     labelled as such.

  Not eligible: templated paths, IP-literal / localhost hosts, hosts with no registrable domain,
  endpoints listed only by the Docker catalogue (its entries carry no publisher namespace in the
  frame), and catalogues that are not MCP remote catalogues (HF Space base URLs, A2A) - the same
  candidate set the top-20% plan starts from.

  Known false negatives, by construction: a provider whose GitHub org name differs from its
  domain label (e.g. an org publishing under io.github.<org> but serving from a product domain).
  Known true-by-rule rows that are NOT 'large providers': hosting platforms that publish entries
  for servers they host (the platform is both publisher and operator, so the rule holds). The
  summary lists the top registrable domains so these are visible, never silently dropped.

Usage:
  firstparty.py --frame DIR --psl public_suffix_list.dat --top20 PLAN.jsonl.gz --out DIR
  firstparty.py --summarise DIR     # after mcp-remote-probe.py --plan DIR/plan-firstparty.jsonl.gz --out DIR
"""
from __future__ import annotations

import argparse
import collections
import datetime
import glob
import gzip
import hashlib
import ipaddress
import json
import os
import re
import urllib.parse

SCHEMA = "csoai.census-frame/0.1/plan-firstparty"
MCP_REMOTE_CATALOGUES = ("mcp-registry", "docker-mcp-registry")


# ---------------------------------------------------------------- Public Suffix List
class PSL:
    def __init__(self, text):
        self.rules, self.exceptions, self.wild = set(), set(), set()
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            rule = line.split()[0].lower()
            if rule.startswith("!"):
                self.exceptions.add(rule[1:])
            elif rule.startswith("*."):
                self.wild.add(rule[2:])
            else:
                self.rules.add(rule)

    def suffix_len(self, labels):
        """Number of labels in the longest matching public suffix (RFC-less PSL algorithm)."""
        best = 1  # the implicit '*' rule
        n = len(labels)
        for i in range(n):
            cand = ".".join(labels[i:])
            if cand in self.exceptions:
                return n - i - 1
            if cand in self.rules:
                best = max(best, n - i)
            if i + 1 < n and ".".join(labels[i + 1:]) in self.wild:
                best = max(best, n - i)
        return best

    def registrable(self, host):
        host = (host or "").lower().rstrip(".")
        if not host or is_ip_or_local(host):
            return None
        labels = host.split(".")
        k = self.suffix_len(labels)
        if len(labels) <= k:
            return None
        return ".".join(labels[-(k + 1):])


def is_ip_or_local(host):
    h = host.split(":")[0].strip("[]")
    if h in ("localhost",) or h.endswith(".localhost") or h.endswith(".local"):
        return True
    try:
        ipaddress.ip_address(h)
        return True
    except ValueError:
        return False


# ---------------------------------------------------------------- publisher identity
def namespace_of(name):
    """'com.example.sub/server' -> ('sub.example.com', None); 'io.github.alice/x' -> (None, 'alice')."""
    ns = str(name or "").split("/", 1)[0].lower()
    parts = [p for p in ns.split(".") if p]
    if len(parts) >= 3 and parts[0] == "io" and parts[1] == "github":
        return None, parts[2]
    if len(parts) < 2:
        return None, None
    return ".".join(reversed(parts)), None


def github_owner(repo_url):
    m = re.match(r"^(?:https?://|git\+https?://|git@)?(?:www\.)?github\.com[/:]([^/]+)/", str(repo_url or ""), re.I)
    return m.group(1).lower() if m else None


def norm_label(s):
    return re.sub(r"[-_]", "", str(s or "").lower())


def match(psl, host, name, repo_url):
    """-> list of basis dicts (empty = not first-party). Pure; tested offline."""
    reg = psl.registrable(host)
    if reg is None:
        return []
    out = []
    ns_domain, gh_ns_owner = namespace_of(name)
    if ns_domain:
        ns_reg = psl.registrable(ns_domain)
        if ns_reg and ns_reg == reg:
            out.append({"basis": "namespace_domain", "publisher": ns_domain, "registrable": reg})
    label = norm_label(reg.split(".")[0])
    for owner, src in ((gh_ns_owner, "io.github namespace"), (github_owner(repo_url), "repository.url")):
        if owner and len(owner) >= 3 and norm_label(owner) == label:
            out.append({"basis": "github_owner_label", "publisher": f"github:{owner} ({src})", "registrable": reg})
            break
    return out


# ---------------------------------------------------------------- frame readers
def registry_servers(frame):
    """-> {name: {"repo": url, "remotes": [urls]}} from the frame's raw MCP-registry pages."""
    out = {}
    for p in sorted(glob.glob(os.path.join(frame, "raw", "mcp-registry", "*.json.gz"))):
        try:
            with gzip.open(p, "rt") as fh:
                d = json.load(fh)
        except (ValueError, OSError, EOFError):
            continue
        for s in (d.get("servers") or []) if isinstance(d, dict) else []:
            srv = (s or {}).get("server") or {}
            if not srv.get("name"):
                continue
            out[srv["name"]] = {"repo": (srv.get("repository") or {}).get("url") or None}
    return out


def iter_candidates(frame):
    """Same candidate set as the top-20% plan: listed by an MCP remote catalogue, not templated."""
    with gzip.open(os.path.join(frame, "endpoints.jsonl.gz"), "rt") as fh:
        for line in fh:
            r = json.loads(line)
            if r.get("templated"):
                continue
            if not set(r.get("catalogues") or []) & set(MCP_REMOTE_CATALOGUES):
                continue
            yield r


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def build(frame, psl_path, top20_path, out):
    with open(psl_path, encoding="utf-8") as fh:
        psl = PSL(fh.read())
    servers = registry_servers(frame)
    top20 = set()
    with gzip.open(top20_path, "rt") as fh:
        for line in fh:
            top20.add(json.loads(line)["endpoint"])
    n_cand, rows, basis_ct, inelig = 0, [], collections.Counter(), collections.Counter()
    for r in iter_candidates(frame):
        n_cand += 1
        host = r.get("host") or urllib.parse.urlsplit(r["endpoint"]).hostname or ""
        hostname = host.split(":")[0]
        if psl.registrable(hostname) is None:
            inelig["no registrable domain (IP literal, localhost, or bare suffix)"] += 1
            continue
        reg_listings = [l for l in r.get("listings") or [] if l.get("source") == "mcp-registry"]
        if not reg_listings:
            inelig["listed only by the Docker catalogue: no publisher namespace in the frame"] += 1
            continue
        bases, publishers = [], []
        for l in reg_listings:
            srv = servers.get(l["id"]) or {}
            for b in match(psl, hostname, l["id"], srv.get("repo")):
                bases.append(b["basis"])
                publishers.append({"registry_name": l["id"], **b})
        if not bases:
            continue
        best = "namespace_domain" if "namespace_domain" in bases else "github_owner_label"
        basis_ct[best] += 1
        transports = sorted({l.get("transport") for l in r.get("listings") or [] if l.get("transport")})
        rows.append({"endpoint": r["endpoint"], "host": hostname, "registrable": publishers[0]["registrable"],
                     "basis": best, "publishers": publishers[:10], "in_top20_plan": r["endpoint"] in top20,
                     "transports": transports,
                     "registry_order": min(l.get("order") or 10**9 for l in reg_listings)})
    # rank: strongest basis first, then registry listing order (a deterministic tie-break, not reach)
    rows.sort(key=lambda x: (x["basis"] != "namespace_domain", x["registry_order"], x["endpoint"]))
    for i, x in enumerate(rows, 1):
        x["rank"] = i
        x["ranked_by"] = f"first_party:{x['basis']}"
    os.makedirs(out, exist_ok=True)
    plan_path = os.path.join(out, "plan-firstparty.jsonl.gz")
    with gzip.open(plan_path, "wt") as fh:
        for x in rows:
            fh.write(json.dumps(x, sort_keys=True) + "\n")
    added = [x for x in rows if not x["in_top20_plan"]]
    regs = collections.Counter(x["registrable"] for x in rows)
    meta = {
        "schema": SCHEMA,
        "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "frame": {"dir": frame, "endpoints_sha256": sha256_file(os.path.join(frame, "endpoints.jsonl.gz"))},
        "psl": {"source": "https://publicsuffix.org/list/public_suffix_list.dat", "sha256": sha256_file(psl_path),
                "sections": "ICANN + PRIVATE"},
        "top20_plan": {"path": top20_path, "sha256": sha256_file(top20_path), "n": len(top20)},
        "candidates": n_cand,
        "ineligible": dict(inelig),
        "tier_n": len(rows),
        "tier_by_basis": dict(basis_ct),
        "tier_already_in_top20_plan": len(rows) - len(added),
        "tier_added_to_plan": len(added),
        "tier_added_by_basis": dict(collections.Counter(x["basis"] for x in added)),
        "tier_hosts": len({x["host"] for x in rows}),
        "tier_registrable_domains": len(regs),
        "top_registrable_domains": regs.most_common(25),
        "rule": ("first-party = the endpoint host's registrable domain (PSL, ICANN+private) equals the "
                 "registrable domain of the publishing entry's reverse-DNS registry namespace "
                 "[namespace_domain], or the entry's GitHub owner (io.github namespace or repository.url) "
                 "equals that domain's leftmost label, '-'/'_' removed, owner >= 3 chars [github_owner_label]"),
        "why": ("the top-20% plan is ranked by package-download signals; a provider's own hosted server has "
                "no package, so the plan under-covered first-party remote servers. A coverage fix to the "
                "census plan."),
        "what_a_row_is": "a candidate endpoint whose host the rule reads as operated by the entry's publisher. DISCOVERED, UNMEASURED.",
        "what_it_never_proves": "who actually operates a host; that a server is official, endorsed, safe, or good",
        "probing": "none. This is a plan; no endpoint was contacted.",
    }
    with open(os.path.join(out, "plan-firstparty.json"), "w") as fh:
        json.dump(meta, fh, indent=1)
    return meta


def summarise_probe(d):
    """Re-label the prober's summary for this tier and split the states by basis and by overlap with
    the top-20% plan. The prober's own summary is kept beside it as summary.prober.json."""
    import shutil
    sp, pp = os.path.join(d, "summary.json"), os.path.join(d, "summary.prober.json")
    if not os.path.exists(pp):
        shutil.copyfile(sp, pp)
    with open(pp) as fh:
        s = json.load(fh)
    with open(os.path.join(d, "plan-firstparty.json")) as fh:
        meta = json.load(fh)
    plan = {}
    with gzip.open(os.path.join(d, "plan-firstparty.jsonl.gz"), "rt") as fh:
        for line in fh:
            r = json.loads(line)
            plan[r["endpoint"]] = r
    res = []
    with gzip.open(os.path.join(d, "results.jsonl.gz"), "rt") as fh:
        for line in fh:
            res.append(json.loads(line))
    C = collections.Counter
    s["plan"] = {"path": os.path.join(os.path.abspath(d), "plan-firstparty.jsonl.gz"),
                 "sha256": sha256_file(os.path.join(d, "plan-firstparty.jsonl.gz")),
                 "schema": meta["schema"], "as_of": meta["as_of"], "rule": meta["rule"],
                 "tier_n": meta["tier_n"], "tier_added_to_plan": meta["tier_added_to_plan"],
                 "tier_already_in_top20_plan": meta["tier_already_in_top20_plan"]}
    s.pop("states_by_rank_tier", None)
    s["states_by_basis"] = {b: dict(C(r["state"] for r in res if plan.get(r["endpoint"], {}).get("basis") == b))
                            for b in ("namespace_domain", "github_owner_label")}
    s["states_by_overlap_with_top20_plan"] = {
        "added_by_this_tier": dict(C(r["state"] for r in res if not plan.get(r["endpoint"], {}).get("in_top20_plan"))),
        "also_in_top20_plan": dict(C(r["state"] for r in res if plan.get(r["endpoint"], {}).get("in_top20_plan"))),
        "note": "also_in_top20_plan rows were probed again in this run; the 2026-09-25 top-20% run is a separate record"}
    s["population_note"] = ("counts are over the attempted endpoints of the FIRST-PARTY tier plan (endpoints whose "
                            "host the rule reads as operated by the publishing registry entry's owner). They are "
                            "not frame totals, not population totals, and not a list of any organisation's servers.")
    s["what_the_tier_never_proves"] = meta["what_it_never_proves"]
    with open(sp, "w") as fh:
        json.dump(s, fh, indent=2)
    return s


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--frame")
    ap.add_argument("--psl")
    ap.add_argument("--top20")
    ap.add_argument("--out")
    ap.add_argument("--summarise", metavar="DIR")
    a = ap.parse_args(argv)
    if a.summarise:
        s = summarise_probe(a.summarise)
        print(json.dumps({k: s[k] for k in ("n_planned", "n_attempted", "read_state", "states",
                                             "states_by_basis", "states_by_overlap_with_top20_plan")}, indent=1))
        return 0
    if not (a.frame and a.psl and a.top20 and a.out):
        ap.error("--frame --psl --top20 --out, or --summarise DIR")
    m = build(a.frame, a.psl, a.top20, a.out)
    print(json.dumps({k: m[k] for k in ("candidates", "ineligible", "tier_n", "tier_by_basis",
                                         "tier_already_in_top20_plan", "tier_added_to_plan",
                                         "tier_added_by_basis", "tier_hosts", "tier_registrable_domains")},
                     indent=1))
    print(m["top_registrable_domains"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
