#!/usr/bin/env python3
"""agntcy-ai-catalog-census.py - a keyless, read-only census of the public AI Catalog
(https://ai-catalog.outshift.io, powered by the AGNTCY Agent Directory Service).

What it does
  1. Pages GET /v1/agents?page_size=100 (the catalogue's own public JSON API, no key) until
     nextPageToken is empty, throttled 1.5 s per page, and keeps a compact row per record.
  2. For each record's trustManifest, parses every publisher-identity attestation (a Sigstore
     bundle carried inline as a data: URI) and reads the signing certificate's subject and OIDC
     issuer with `openssl x509`. It does NOT verify the signatures: signature_validity is
     reported as UNMEASURED until a Sigstore verifier is run over the bundles.
  3. Joins the concrete remote hosts named by the catalogue's MCP server cards against
     https://councilof.ai/mcp-servers/index.json (our own remote-MCP census, keyed by host).

What it is not
  A measurement. kind = "catalogued": every count is the catalogue's own bytes. Nothing is
  written upstream; no account, no listing, no submission.

Individual e-mail addresses found in certificate subjects are reduced to their domain, so the
output names no private person.

Usage: python3 scripts/intake/agntcy-ai-catalog-census.py OUT.json [--raw rows.jsonl]
"""
import base64, collections, json, re, subprocess, sys, time, urllib.parse, urllib.request
from urllib.parse import urlparse

API = "https://ai-catalog.outshift.io/v1/agents"
OURS = "https://councilof.ai/mcp-servers/index.json"
UA = "Mozilla/5.0 (compatible; csoai-catalog-census/0.1; +https://councilof.ai/)"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    err = None
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read())
        except Exception as e:  # transient network error: back off and retry
            err = e
            time.sleep(5 * (i + 1))
    raise err


def pages(extra=None):
    token = ""
    while True:
        q = {"page_size": "100", **(extra or {})}
        if token:
            q["page_token"] = token
        d = get(API + "?" + urllib.parse.urlencode(q))
        yield d
        token = d.get("nextPageToken") or ""
        if not token:
            return
        time.sleep(1.5)


def cert_subject(der):
    txt = subprocess.run(["openssl", "x509", "-inform", "DER", "-noout", "-text"],
                         input=der, capture_output=True).stdout.decode("utf-8", "replace")
    san = re.search(r"X509v3 Subject Alternative Name:.*?\n\s*(.+)", txt)
    iss = re.search(r"1\.3\.6\.1\.4\.1\.57264\.1\.(?:1|8):\s*\n\s*(.+)", txt)
    s = san.group(1).strip() if san else None
    if s and s.startswith("email:"):
        s = "email:<individual>@" + s.split("@", 1)[-1]
    return s, (iss.group(1).strip().lstrip(".") if iss else None)


def attestation(att, cert_cache):
    uri = att.get("uri") or ""
    f = {"type": att.get("type"), "bundle_media_type": None, "subject": None, "oidc_issuer": None,
         "rekor_inclusion_proof": False, "cert_sha": None}
    if uri.startswith("data:") and ";base64," in uri:
        try:
            b = json.loads(base64.b64decode(uri.split(";base64,", 1)[1]))
        except Exception:
            return f
        f["bundle_media_type"] = b.get("mediaType")
        vm = b.get("verificationMaterial") or {}
        raw = (vm.get("certificate") or {}).get("rawBytes")
        if not raw:
            chain = (vm.get("x509CertificateChain") or {}).get("certificates") or []
            raw = chain[0].get("rawBytes") if chain else None
        tl = vm.get("tlogEntries") or []
        f["rekor_inclusion_proof"] = bool(tl and tl[0].get("inclusionProof"))
        if raw:
            if raw not in cert_cache:
                cert_cache[raw] = cert_subject(base64.b64decode(raw))
            f["cert_sha"] = hash(raw)
            f["subject"], f["oidc_issuer"] = cert_cache[raw]
    return f


def main():
    out_path = sys.argv[1]
    raw_path = sys.argv[sys.argv.index("--raw") + 1] if "--raw" in sys.argv else None
    t0 = time.time()
    rows, total, cert_cache = [], None, {}
    for d in pages():
        total = d.get("totalCount", total)
        for r in d.get("results") or []:
            md = r.get("metadata") or {}
            trust = md.get("agntcy.dir.trust.v1.Status") or {}
            tm = r.get("trustManifest") or {}
            rows.append({
                "cid": r.get("identifier"), "name": r.get("displayName"), "media_type": r.get("mediaType"),
                "trusted": trust.get("trusted"), "verified": trust.get("verified"),
                "scan": "agntcy.dir.security.v1.ScanResult" in md,
                "att": [attestation(a, cert_cache) for a in (tm.get("attestations") or [])],
            })
    as_of = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    if raw_path:
        with open(raw_path, "w") as fh:
            for r in rows:
                fh.write(json.dumps(r) + "\n")

    cards = []
    for kind in ("application/mcp-server-card+json", "application/a2a-agent-card+json"):
        for d in pages({"filter": f"type={kind}"}):
            for r in d.get("results") or []:
                if r.get("mediaType") != kind:
                    continue
                data = r.get("data") or {}
                cards.append({"name": r.get("displayName"), "media_type": kind,
                              "connections": [{"type": c.get("type"), "url": c.get("url")} for c in data.get("connections") or []],
                              "card_url": (data.get("card_data") or {}).get("url")})
    mcp = [c for c in cards if c["media_type"] == "application/mcp-server-card+json"]
    remote = {x["url"] for c in mcp for x in c["connections"] if (x.get("url") or "").startswith("http")}
    templated = {u for u in remote if "{" in u}
    hosts = sorted({urlparse(u).hostname for u in remote - templated} - {None})
    ours = get(OURS)
    our_hosts = {row[0] for row in ours.get("rows") or []}

    A = [a for r in rows for a in r["att"]]
    out = {
        "schema": "csoai/intake-census/v0",
        "kind": "catalogued",
        "note": ("A read of someone else's public catalogue. It signs nothing and measures nothing: every count is "
                 "the catalogue's own bytes, read keyless from the source below. Signature validity of the Sigstore "
                 "bundles is UNMEASURED here: bundles were parsed, not verified."),
        "source": API,
        "operator": "AI Catalog (ai-catalog.outshift.io), powered by the AGNTCY Agent Directory Service",
        "as_of": as_of,
        "total_count_declared": total,
        "rows_read": len(rows),
        "unique_record_cids": len({r["cid"] for r in rows}),
        "unique_display_names": len({r["name"] for r in rows}),
        "media_type": dict(collections.Counter(r["media_type"] for r in rows).most_common()),
        "catalogue_trust_status": {f"trusted={t},verified={v}": n for (t, v), n in
                                   collections.Counter((r["trusted"], r["verified"]) for r in rows).most_common()},
        "records_with_security_scan_metadata": sum(1 for r in rows if r["scan"]),
        "publisher_identity_attestations": {
            "records_by_attestation_count": {str(k): v for k, v in sorted(collections.Counter(len(r["att"]) for r in rows).items())},
            "total": len(A),
            "types": dict(collections.Counter(a["type"] for a in A)),
            "bundle_media_type": dict(collections.Counter(a["bundle_media_type"] for a in A)),
            "with_rekor_inclusion_proof": sum(1 for a in A if a["rekor_inclusion_proof"]),
            "distinct_signing_certificates": len(cert_cache),
            "signing_certificate_oidc_issuer": dict(collections.Counter(v[1] for v in cert_cache.values()).most_common()),
            "attestations_by_certificate_subject": dict(collections.Counter(a["subject"] for a in A).most_common()),
            "signature_validity": "UNMEASURED",
        },
        "mcp_server_cards": {
            "records": len(mcp),
            "distinct_server_names": len({c["name"] for c in mcp}),
            "connection_types": dict(collections.Counter(x["type"] for c in mcp for x in c["connections"]).most_common()),
            "remote_urls": len(remote),
            "templated_remote_urls": len(templated),
            "concrete_remote_hosts": hosts,
            "hosts_already_in_councilof_mcp_census": sorted(set(hosts) & our_hosts),
            "hosts_not_in_councilof_mcp_census": sorted(set(hosts) - our_hosts),
            "councilof_mcp_census": {"url": OURS, "n_hosts": ours.get("n"), "newest_observation": ours.get("newest_observation")},
        },
        "a2a_agent_cards": [{"name": c["name"], "card_url": c["card_url"]} for c in cards if "a2a" in c["media_type"]],
        "elapsed_s": round(time.time() - t0, 1),
        "producer": "scripts/intake/agntcy-ai-catalog-census.py",
    }
    with open(out_path, "w") as fh:
        json.dump(out, fh, indent=1)
        fh.write("\n")
    print(f"{len(rows)}/{total} records, {len(A)} attestations, {len(mcp)} MCP cards, {len(hosts)} concrete MCP hosts -> {out_path}")


if __name__ == "__main__":
    main()
