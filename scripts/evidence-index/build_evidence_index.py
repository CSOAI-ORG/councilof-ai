#!/usr/bin/env python3
"""Build, sign, anchor and render the CSOAI evidence index (csoai.evidence-index/0.1).

    build_evidence_index.py build  --out DIR [--hf-token FILE]
    build_evidence_index.py sign   --out DIR [--token FILE]
    build_evidence_index.py ots    --out DIR
    build_evidence_index.py render --out DIR

build   enumerates from primary sources only: the Hugging Face API for org `csoai` (datasets, spaces,
        models, each pinned to its current commit), PyPI and npm (candidates: names containing "csoai" or
        "gspc" owned by the estate registry account, plus the one npm package the estate names; INCLUDED
        only when the ownership rule OWNERSHIP_RULE finds CSOAI as publisher in the registry bytes: MEOK
        and CSGA Global packages are excluded by scope/declared publisher, never by name), and a fixed
        list of councilof.ai / csoai.org public JSON surfaces.
        Every sha256 in index.json is computed here from bytes fetched in this run. Every signature state
        is the result of a check run here (verify.py, the same code a stranger runs). Nothing is copied
        from a summary.
sign    POST https://councilof.ai/api/board-sign with the pod caller token (never printed), verify the
        Ed25519 signature against did:web:csoai.org#board-attestation-1, run two altered-preimage controls
        that MUST fail, then write index.signed.json.
ots     submit sha256(index.json) to three OpenTimestamps calendars; write index.json.ots + index.ots.json.
render  write index.md and README.md from index.json (no figure is hand-typed).
"""
import argparse, collections, concurrent.futures as cf, datetime, hashlib, json, os, pathlib, re, sys, threading, time
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import verify as V  # noqa: E402  (the stranger's verifier is the library: one code path for both)

SCHEMA = "csoai.evidence-index/0.1"
INDEX_PATH = "index.json"
SIG_PAT = re.compile(r"(signed|attest|provenance_signed|\.sig$)", re.I)
MIRRORS = {"csoai/councilof-ai-source", "csoai/councilof-ai-mirror"}
SIGCAP, OTSCAP, BYTECAP, SMALL = 150, 60, 40, 2_000_000
SURFACES = [
    ("trust-anchor", "https://csoai.org/.well-known/did.json", "DID document holding the Ed25519 keys every signature here is pinned to"),
    ("board", "https://councilof.ai/api/gspc", "GSPC board (live), site-attested snapshot"),
    ("board", "https://councilof.ai/root.json", "public Merkle root envelope over card_sha256 leaves"),
    ("surface", "https://councilof.ai/api/state", "live state: the numbers a lane may quote"),
    ("surface", "https://councilof.ai/signed/card_index.json", "signed card index (corpus 3 of 3)"),
    ("surface", "https://councilof.ai/api/cards", "living card registry"),
]
NPM_SEED = ["csoai-gspc-mcp"]
# ---- package ownership rule (csoai.evidence-index/0.1, rule v2, 2026-09-25) -----------------------------
# The name filter (csoai / gspc) only PROPOSES candidates. Inclusion is decided by who published the
# package, read from registry bytes fetched in the build. Why not the registry account alone: the PyPI
# account and the npm account that own these packages are shared across estate entities (CSOAI, MEOK,
# CSGA Global), so "owned by the estate account" is necessary but cannot say which entity published it.
ESTATE_ACCOUNTS = {"pypi": "nicholastempleman", "npm": "csga_global"}
CSOAI_NPM_SCOPES = set()   # CSOAI publishes no scoped npm package; an npm scope is an org namespace and names its owner
OTHER_ENTITIES = [("MEOK", re.compile(r"meok", re.I)),
                  ("CSGA Global", re.compile(r"csga", re.I))]
CSOAI_PUBLISHER = re.compile(r"csoai ltd|csoai\.org|council of ai|councilof\.ai", re.I)
CSOAI_SOURCE = re.compile(r"github\.com/CSOAI-ORG/", re.I)
OWNERSHIP_RULE = [
    "1. Candidate: a PyPI project owned by, or an npm package maintained by, the estate registry account, whose name contains 'csoai' or 'gspc' (plus the named npm seed). The name only proposes; it never includes.",
    "2. Registry ownership (necessary, not sufficient): the PyPI Owner role (XML-RPC package_roles) or the npm maintainers list must include the estate account. These accounts are shared by CSOAI, MEOK and CSGA Global, so this step cannot establish CSOAI as publisher.",
    "3. npm scope: a scoped package is excluded unless its scope is a CSOAI scope (there are none). @meok-labs is MEOK's npm org; @csgaglobal is CSGA Global's.",
    "4. Declared publisher of the pinned release (PyPI author, author_email, maintainer, maintainer_email, home page; npm author): any MEOK or CSGA marker excludes it as another entity's package, including co-branded strings such as 'MEOK AI Labs (CSOAI LTD)'.",
    "5. Positive CSOAI identity required: the declared publisher names CSOAI Ltd / csoai.org / Council of AI / councilof.ai, or the declared source repository is under github.com/CSOAI-ORG. Otherwise the package is excluded as PUBLISHER_UNDECLARED (not evidence it is not CSOAI's; the registry bytes do not say).",
]


def _flat(x):
    if isinstance(x, dict):
        return " ".join(_flat(v) for v in x.values())
    if isinstance(x, (list, tuple)):
        return " ".join(_flat(v) for v in x)
    return "" if x is None else str(x)


def ownership(registry, name, pypi_json=None, npm_json=None):
    """Apply OWNERSHIP_RULE to one candidate from registry bytes; return the decision record (published in index.json)."""
    rec = {"registry": registry, "name": name}
    if registry == "pypi":
        import xmlrpc.client
        roles = xmlrpc.client.ServerProxy("https://pypi.org/pypi").package_roles(name)
        d = pypi_json or V.fetch_json("https://pypi.org/pypi/%s/json" % name)[0]
        i = d["info"]
        rec["version"] = i["version"]
        rec["registry_roles"] = [[r, u] for r, u in roles]
        rec["registry_account_ok"] = any(u.lower() == ESTATE_ACCOUNTS["pypi"] and r == "Owner" for r, u in roles)
        declared = {k: i.get(k) for k in ("author", "author_email", "maintainer", "maintainer_email", "home_page")}
        urls = i.get("project_urls") or {}
        declared["home_page"] = declared["home_page"] or urls.get("Homepage") or urls.get("homepage")
        source = [v for k, v in urls.items() if k.lower() in ("repository", "source", "source code", "code")]
        rec["scope"] = None
    else:
        d = npm_json or V.fetch_json("https://registry.npmjs.org/%s" % name.replace("/", "%2f"))[0]
        v = d["dist-tags"]["latest"]; m = d["versions"][v]
        rec["version"] = v
        rec["registry_maintainers"] = [x.get("name") for x in d.get("maintainers") or []]
        rec["registry_account_ok"] = ESTATE_ACCOUNTS["npm"] in rec["registry_maintainers"]
        rec["release_publisher"] = (m.get("_npmUser") or {}).get("name")
        rec["trusted_publisher"] = ((m.get("_npmUser") or {}).get("trustedPublisher") or {}).get("id")
        declared = {"author": m.get("author"), "home_page": m.get("homepage")}
        repo = m.get("repository")
        source = [repo.get("url") if isinstance(repo, dict) else repo] if repo else []
        rec["scope"] = name.split("/")[0] if name.startswith("@") else None
    rec["declared_publisher"] = {k: v for k, v in declared.items() if v}
    rec["declared_source"] = [x for x in source if x]
    pub = _flat({k: v for k, v in declared.items() if k != "home_page"})
    other = [lab for lab, rx in OTHER_ENTITIES if rx.search(_flat(declared)) or (rec["scope"] and rx.search(rec["scope"]))]
    if not rec["registry_account_ok"]:
        rec["decision"], rec["reason"] = "EXCLUDED_REGISTRY_ACCOUNT", "the estate account does not hold the Owner role / maintainer slot"
    elif rec["scope"] and rec["scope"] not in CSOAI_NPM_SCOPES:
        rec["decision"], rec["reason"] = "EXCLUDED_OTHER_ENTITY", "npm scope %s is not a CSOAI scope%s" % (rec["scope"], (" (" + ", ".join(other) + ")") if other else "")
    elif other:
        rec["decision"], rec["reason"] = "EXCLUDED_OTHER_ENTITY", "declared publisher names %s" % ", ".join(other)
    elif CSOAI_PUBLISHER.search(pub):
        rec["decision"], rec["reason"] = "INCLUDED", "declared publisher names CSOAI"
    elif any(CSOAI_SOURCE.search(x) for x in rec["declared_source"]):
        rec["decision"], rec["reason"] = "INCLUDED", "declared source repository is under github.com/CSOAI-ORG" + (" (release published by %s trusted publisher)" % rec["trusted_publisher"] if rec.get("trusted_publisher") else "")
    else:
        rec["decision"], rec["reason"] = "EXCLUDED_PUBLISHER_UNDECLARED", "no publisher and no CSOAI-ORG source declared in the release metadata"
    # decided on the raw bytes above; published with e-mail local parts masked (the domain is what the rule reads)
    rec["declared_publisher"] = _mask(rec["declared_publisher"])
    return rec


def _mask(x):
    if isinstance(x, dict):
        return {k: _mask(v) for k, v in x.items()}
    if isinstance(x, str):
        return re.sub(r"[A-Za-z0-9._%+-]+@", "*@", x)
    return x
lock = threading.Lock()


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(*a):
    with lock:
        print(*a, flush=True)


# ------------------------------------------------------------------ Hugging Face
def hf_item(kind, repo, keys, token):
    info, _ = V.fetch_json("%s/api/%s/%s" % (V.HF, kind, repo))  # anonymous: fails closed on a private repo
    if info.get("private") or info.get("gated"):
        raise RuntimeError("not public: excluded")
    rev = info["sha"]
    files = V.hf_tree(kind, repo, rev, token)
    man, mbytes, msha = V.hf_manifest(kind, repo, rev, files)
    ent = {f["path"]: f for f in man["files"]}
    card = info.get("cardData") or {}
    lic = card.get("license")
    lic = lic if isinstance(lic, str) else (", ".join(lic) if isinstance(lic, list) else "NOT_DECLARED in the repo card")
    fetched, fetch_failed, mismatches = {}, [], []   # fetched[path] = (length, sha256) or None; bytes are never retained (1 GB host)

    def get(path):
        try:
            b, _ = V.fetch(V.hf_resolve(kind, repo, rev, path), token)
        except Exception as e:
            if path not in fetched:
                fetch_failed.append({"path": path, "error": "%s %s" % (type(e).__name__, getattr(e, "code", ""))})
            fetched[path] = None
            return None
        if path not in fetched and not V.check_file_bytes(b, ent[path]):
            mismatches.append(path)
        fetched[path] = (len(b), V.sha256(b))
        return b

    def get_sha(path):
        if path not in fetched:
            b = get(path); del b
        return fetched[path][1] if fetched.get(path) else None

    # signatures (filename-pattern discovery)
    sig_cands = [] if repo in MIRRORS else sorted(p for p in ent if SIG_PAT.search(p) and not p.endswith(".ots"))
    states = collections.Counter(); by_key = collections.Counter(); rules = set(); sig_checks = {}
    signed_records = []; checked = 0
    for p in sig_cands[:SIGCAP]:
        if ent[p]["size"] > 20_000_000:
            states["NOT_CHECKED_TOO_LARGE"] += 1; continue
        b = get(p); checked += 1
        if b is None:
            states["FETCH_FAILED"] += 1; continue
        docs = []
        if p.endswith(".jsonl"):
            for line in b.splitlines()[:5000]:
                try: docs.append(json.loads(line))
                except Exception: pass
        else:
            try: docs.append(json.loads(b))
            except Exception:
                states["PRESENT_NOT_VERIFIED"] += 1; rules.add("non-JSON signature file (%s): format not recovered" % p.rsplit(".", 1)[-1]); continue
        for d in docs:
            r = V.verify_signed_doc(d, keys)
            states[r["state"]] += 1
            if r.get("key"): by_key["%s %s" % (r["state"], r["key"].split("#")[1])] += 1
            if r.get("rule"): rules.add(r["rule"])
        if len(docs) == 1 and not p.endswith(".jsonl"):
            sig_checks[p] = r["state"]
            if isinstance(docs[0], dict) and docs[0].get("schema") == "csoai.signed-run/0.1":
                signed_records.append((p, docs[0], r, V.sha256(b)))
    sig_present = sum(v for k, v in states.items() if k != "UNSIGNED")
    if not sig_cands:
        sstate = "UNSIGNED" if repo not in MIRRORS else "NOT_CHECKED"
    elif states.get("FAILED"):
        sstate = "FAILED"
    elif sig_present == 0 and checked == len(sig_cands):
        sstate = "UNSIGNED"
    elif checked == len(sig_cands) and set(states) <= {"VERIFIED", "UNSIGNED"}:
        sstate = "VERIFIED"
    else:
        sstate = "PARTIAL"
    signature = {"state": sstate, "discovery": "filename pattern %s over the pinned tree" % SIG_PAT.pattern,
                 "candidate_files": len(sig_cands), "files_checked": checked, "results": dict(states),
                 "by_key": dict(by_key), "rules": sorted(rules)}
    if repo in MIRRORS:
        signature["note"] = "source mirror: signature files inside are copies of site artifacts; they are indexed through the councilof.ai surfaces, not re-checked here"

    # OpenTimestamps proofs
    ots_paths = sorted(p for p in ent if p.endswith(".ots"))
    ots_states = collections.Counter(); binds = collections.Counter(); ots_detail = {}
    for p in ots_paths[:OTSCAP]:
        b = get(p)
        if b is None:
            ots_states["FETCH_FAILED"] += 1; continue
        tgt = ots_target(p, ent) or p[:-4]; tsha = None
        if tgt in ent:
            if ent[tgt].get("lfs_sha256"):
                tsha = ent[tgt]["lfs_sha256"]
            elif ent[tgt]["size"] <= 5_000_000:
                tsha = get_sha(tgt)
        r = V.ots_inspect(b, tsha)
        ots_states[r["state"]] += 1
        binds[str(r.get("binds_to_target", "no target in repo"))] += 1
        ots_detail[p] = r
    if not ots_paths:
        ostate = "none"
    elif len(ots_paths) > OTSCAP:
        ostate = "PARTIAL"
    else:
        ostate = ots_states.most_common(1)[0][0] if len(ots_states) == 1 else "mixed"
    ots = {"state": ostate, "proofs": len(ots_paths), "checked": min(len(ots_paths), OTSCAP),
           "results": dict(ots_states), "binds_to_target": dict(binds)}

    # generic byte checks: README + first BYTECAP small files by path
    extra = [p for p in (["README.md"] + sorted(ent)) if p in ent and ent[p]["size"] <= SMALL and p not in fetched]
    for p in list(dict.fromkeys(extra))[:BYTECAP]:
        get_sha(p)
    ok_paths = sorted(p for p, b in fetched.items() if b is not None)
    item = {
        "id": "hf:%s/%s" % (kind, repo), "kind": kind[:-1], "title": repo,
        "url": "%s/%s%s/tree/%s" % (V.HF, V.hf_prefix(kind), repo, rev),
        "pinned_revision": rev,
        "content_sha256": msha,
        "content_sha256_of": "canonical JSON manifest of every file at the pinned commit (path, size, git blob oid, LFS sha256); see manifests/",
        "files": len(man["files"]), "bytes": sum(f["size"] for f in man["files"]),
        "bytes_checked": {"files": len(ok_paths), "of": len(man["files"]), "bytes": sum(fetched[p][0] for p in ok_paths),
                          "oid_mismatches": mismatches, "fetch_failed": fetch_failed,
                          "method": "downloaded at the pinned commit; git-blob-SHA-1 (or LFS sha256) recomputed and compared with the tree listing"},
        "signature": signature, "ots": ots, "licence": lic,
        "published": info.get("createdAt"), "last_modified": info.get("lastModified"),
        "does_not_show": dnshow_repo(kind, repo, signature, ots, len(ok_paths), len(man["files"])),
        "check": {"type": "hf_repo", "hf_kind": kind, "repo": repo, "revision": rev,
                  "byte_checked_paths": ok_paths, "signature_checks": sig_checks},
    }
    subs = [signed_record_item(kind, repo, rev, ent, p, d, r, b, get, get_sha, lic, keys, token, info) for p, d, r, b in signed_records]
    log("%-8s %-48s %s files=%d checked=%d sig=%s ots=%s subs=%d" % (kind, repo, rev[:10], len(man["files"]), len(ok_paths), sstate, ostate, len(subs)))
    return item, subs, (kind, repo, mbytes)


def find_artifact(ent, sig_path, apath):
    base = sig_path.rsplit("/", 1)[0] + "/" if "/" in sig_path else ""
    for c in (apath, base + apath, base + apath.rsplit("/", 1)[-1]):
        if c in ent:
            return c
    same = [p for p in ent if p.rsplit("/", 1)[-1] == apath.rsplit("/", 1)[-1]]
    return same[0] if len(same) == 1 else None


def signed_record_item(kind, repo, rev, ent, p, doc, r, b, get, get_sha, lic, keys, token, info):
    pay = doc.get("payload") or {}; art = pay.get("artifact") or {}
    binding = {"declared_path": art.get("path"), "declared_sha256": art.get("sha256")}
    ap = find_artifact(ent, p, art.get("path") or "") if art.get("path") else None
    art_url = None; art_sha = None
    if ap:
        e = ent[ap]
        if e.get("lfs_sha256"):
            art_sha = e["lfs_sha256"]
        elif e["size"] <= 20_000_000:
            art_sha = get_sha(ap)
        binding["resolved_path"] = ap
        if art_sha == art.get("sha256"):
            binding["state"] = "MATCH"; art_url = V.hf_resolve(kind, repo, rev, ap)
        else:
            binding["state"] = "MISMATCH_AT_PINNED_REVISION"
            hit = search_history(kind, repo, ap, art.get("sha256"), token)
            if hit:
                binding["state"] = "MATCH_AT_EARLIER_REVISION"; binding["revision"] = hit
                art_url = V.hf_resolve(kind, repo, hit, ap); art_sha = art.get("sha256")
    else:
        binding["state"] = "ARTIFACT_NOT_IN_REPO" if art.get("path") else "NO_ARTIFACT_DECLARED"
    ots = {}
    for label, op in (("artifact", (ap + ".ots") if ap else None), ("signed_document", p + ".ots")):
        if op and op in ent:
            ob = get(op)
            ots[label] = V.ots_inspect(ob, art.get("sha256") if label == "artifact" else b) if ob else {"state": "FETCH_FAILED"}
            ots[label]["path"] = op
    rt = p.replace(".signed.json", ".root.txt.ots")
    if rt != p and rt in ent:
        # claim-capture shape: the proof is over the run's root.txt (its Merkle root), not over the artifact
        ob = get(rt)
        ots["root_txt"] = V.ots_inspect(ob, get_sha(rt[:-4]) if rt[:-4] in ent else None) if ob else {"state": "FETCH_FAILED"}
        ots["root_txt"]["path"] = rt
    if not ots:
        # proofs named after a versioned artifact (record.v0.1.1.json.ots next to record.v0.1.1.signed.json)
        stem = p.replace(".signed.json", ".json.ots")
        if stem in ent and stem != p:
            ob = get(stem)
            ots["artifact"] = V.ots_inspect(ob, art.get("sha256")) if ob else {"state": "FETCH_FAILED"}; ots["artifact"]["path"] = stem
    for label in list(ots):
        # an upgraded copy published beside the pending proof (never replacing it): same target, same digest rule
        P = ots[label].get("path")
        if not P:
            continue
        for up in [P[:-4] + ".bitcoin.ots"] + sorted(x for x in ent if x.startswith("ots-upgraded/") and x.endswith("/" + P)):
            if up in ent:
                ub = get(up)
                if ub:
                    tsha = art.get("sha256") if label == "artifact" else (b if label == "signed_document" else (get_sha(P[:-4]) if P[:-4] in ent else None))
                    ur = V.ots_inspect(ub, tsha); ur["path"] = up
                    ots[label].setdefault("upgraded_copies", []).append(ur)
        good = [u for u in ots[label].get("upgraded_copies", []) if u.get("state") == "bitcoin-attested" and u.get("binds_to_target") is True]
        if good and ots[label].get("binds_to_target") is not False:
            ots[label]["state_including_upgraded_copies"] = "bitcoin-attested"
    ostate = ots.get("artifact", ots.get("signed_document", ots.get("root_txt", {"state": "none"})))
    ostate = ostate.get("state_including_upgraded_copies", ostate["state"])
    unbound = [k for k, v in ots.items() if isinstance(v, dict) and v.get("binds_to_target") is False]
    dn = ["That any claim inside the artifact is true beyond what its own instruments measured: the signature binds bytes, not truth."]
    for k in ("not_a_grade", "status", "coverage_declared"):
        if isinstance(pay.get(k), str):
            dn.append("%s: %s" % (k, pay[k]))
    if isinstance(pay.get("read_state"), str) and pay["read_state"] != "COMPLETE":
        dn.append("read_state %s: a partial read, never a population total." % pay["read_state"])
    if ostate == "pending":
        dn.append("When it existed, to Bitcoin: the timestamp is a pending calendar commitment, not a Bitcoin attestation.")
    if "root_txt" in ots and "artifact" not in ots:
        dn.append("A timestamp over the artifact itself: the only proof found is over the run's root.txt.")
    for k in unbound:
        dn.append("That the %s proof (%s) covers the file it is named after: its digest does not equal that file's sha256 at the pinned commit." % (k, ots[k]["path"]))
    return {
        "id": "hf:%s/%s/%s" % (kind, repo, p), "kind": "signed-record", "title": "%s — %s" % (repo, p),
        "url": V.hf_resolve(kind, repo, rev, p), "pinned_revision": rev,
        "content_sha256": b, "content_sha256_of": "the signed document bytes",
        "artifact": dict(binding, sha256_recomputed=art_sha, url=art_url, schema=art.get("schema"), as_of=art.get("as_of")),
        "signature": r, "ots": dict(ots, state=ostate), "licence": lic,
        "published": (doc.get("signature") or {}).get("signed_at") or info.get("createdAt"),
        "does_not_show": dn,
        "check": {"type": "signed_record", "url": V.hf_resolve(kind, repo, rev, p),
                  "artifact_url": art_url, "artifact_sha256": art.get("sha256") if art_url else None},
    }


def search_history(kind, repo, path, want, token, limit=40):
    try:
        commits, _ = V.fetch_json("%s/api/%s/%s/commits/main" % (V.HF, kind, repo), token)
    except Exception:
        return None
    for c in commits[:limit]:
        try:
            b, _ = V.fetch(V.hf_resolve(kind, repo, c["id"], path), token)
        except Exception:
            continue
        if V.sha256(b) == want:
            return c["id"]
    return None


def dnshow_repo(kind, repo, sig, ots, checked, total):
    d = ["That the repo's contents are correct or complete: the hash pins which bytes were published at this commit, nothing more.",
         "Anything in a later commit: the index pins one revision."]
    if checked < total:
        d.append("Bytes of every file: %d of %d files were downloaded and re-hashed; the rest are bound only through the tree listing (git blob SHA-1 / LFS sha256 as served by Hugging Face)." % (checked, total))
    if sig["state"] in ("UNSIGNED",):
        d.append("Who published it, cryptographically: no file matching the signature pattern carries a CSOAI signature; attribution rests on the Hugging Face org account.")
    if sig["state"] == "PARTIAL":
        d.append("That every signature in it verifies: see signature.results; PRESENT_NOT_VERIFIED means the preimage rule could not be recovered from the bytes, not that the signature is bad.")
    if sig.get("files_checked", 0) < sig.get("candidate_files", 0):
        d.append("Signatures beyond the first %d candidate files (of %d) were not checked." % (sig["files_checked"], sig["candidate_files"]))
    if ots["state"] in ("pending", "mixed", "PARTIAL"):
        d.append("Bitcoin-anchored time for pending proofs: a calendar promise is not a block attestation.")
    if ots.get("binds_to_target", {}).get("False"):
        d.append("That every timestamp covers the file it is named after: %d of the checked proofs carry a digest that differs from their named file's sha256 at the pinned commit." % ots["binds_to_target"]["False"])
    if ots.get("binds_to_target", {}).get("no target in repo"):
        d.append("What %d of the checked proofs timestamp: the file each is named after is not in this repo." % ots["binds_to_target"]["no target in repo"])
    if ots.get("results", {}).get("UNPARSEABLE"):
        d.append("A timestamp from %d proof file(s) that do not parse as OpenTimestamps proofs." % ots["results"]["UNPARSEABLE"])
    if ots.get("checked", 0) < ots.get("proofs", 0):
        d.append("Proofs beyond the first %d (of %d) were not inspected." % (ots["checked"], ots["proofs"]))
    if kind == "spaces":
        d.append("What the running Space serves: the index pins the Space's source files, not its live output.")
    return d


def ots_target(p, ent):
    """The file a proof commits to by name. <x>.ots -> <x>; an upgraded copy <x>.bitcoin.ots -> <x>;
    ots-upgraded/<date>/<x>.ots -> <x>. The name only proposes; binds_to_target is still decided by digest."""
    cands = [p[:-4]]
    if p.endswith(".bitcoin.ots"):
        cands.insert(0, p[:-len(".bitcoin.ots")])
    m = re.match(r"ots-upgraded/[^/]+/(.+)\.ots$", p)
    if m:
        cands.insert(0, m.group(1))
    return next((c for c in cands if c in ent), None)


# ------------------------------------------------------------------ packages
def pypi_item(name):
    d, _ = V.fetch_json("https://pypi.org/pypi/%s/json" % name)
    i = d["info"]; files = []
    for u in d["urls"]:
        b, _ = V.fetch(u["url"])
        prov = "none"
        try:
            V.fetch("https://pypi.org/integrity/%s/%s/%s/provenance" % (name, i["version"], u["filename"]), accept="application/vnd.pypi.integrity.v1+json")
            prov = "present (PEP 740; not a CSOAI key; not checked here)"
        except Exception:
            pass
        files.append({"filename": u["filename"], "url": u["url"], "sha256": V.sha256(b), "registry_sha256": u["digests"]["sha256"],
                      "matches_registry": V.sha256(b) == u["digests"]["sha256"], "size": len(b), "uploaded": u["upload_time_iso_8601"],
                      "pep740_provenance": prov})
    agg = V.sha256(V.canon(sorted([[f["filename"], f["sha256"]] for f in files])))
    first = min((x["upload_time_iso_8601"] for rel in d["releases"].values() for x in rel), default=None)
    lic = i.get("license_expression") or (i.get("license") or "").strip()[:60] or next((c.split(" :: ")[-1] for c in i.get("classifiers", []) if c.startswith("License")), None) or "NOT_DECLARED"
    return {"id": "pypi:%s==%s" % (name, i["version"]), "kind": "package", "title": "PyPI %s %s" % (name, i["version"]),
            "url": "https://pypi.org/project/%s/%s/" % (name, i["version"]), "pinned_revision": i["version"],
            "content_sha256": agg, "content_sha256_of": "canonical JSON of sorted [filename, sha256] pairs of the latest release's files, each sha256 recomputed from downloaded bytes",
            "files": files, "signature": {"state": "UNSIGNED", "detail": "no CSOAI signature on the distribution; PEP 740 provenance: " + ", ".join(sorted({f["pep740_provenance"] for f in files}))},
            "ots": {"state": "none"}, "licence": lic, "published": first, "last_modified": max((f["uploaded"] for f in files), default=None),
            "does_not_show": ["That the code does what its description says: the hash pins the published distribution bytes of the latest release only.",
                              "Earlier releases (%d release(s) on PyPI in total)." % len(d["releases"]),
                              "Who built it, cryptographically: attribution rests on the PyPI account."],
            "check": {"type": "package", "files": [{"filename": f["filename"], "url": f["url"], "sha256": f["sha256"], "registry_sha256": f["registry_sha256"]} for f in files]}}


def npm_item(name, npm_keys):
    d, _ = V.fetch_json("https://registry.npmjs.org/%s" % name.replace("/", "%2f"))
    v = d["dist-tags"]["latest"]; m = d["versions"][v]; dist = m["dist"]
    b, _ = V.fetch(dist["tarball"])
    alg, dg = dist["integrity"].split("-", 1)
    import base64
    integ = base64.b64encode(hashlib.new(alg, b).digest()).decode() == dg
    reg = V.npm_sig_ok(d["name"], v, dist["integrity"], dist.get("signatures"), npm_keys)
    f = {"filename": dist["tarball"].rsplit("/", 1)[-1], "url": dist["tarball"], "sha256": V.sha256(b), "npm_integrity": dist["integrity"],
         "integrity_matches": integ, "size": len(b)}
    return {"id": "npm:%s@%s" % (d["name"], v), "kind": "package", "title": "npm %s %s" % (d["name"], v),
            "url": "https://www.npmjs.com/package/%s/v/%s" % (d["name"], v), "pinned_revision": v,
            "content_sha256": f["sha256"], "content_sha256_of": "the published tarball bytes (npm integrity %s also recomputed)" % alg,
            "files": [f],
            "signature": {"state": "UNSIGNED", "detail": "no CSOAI signature on the tarball",
                          "registry_signature": ("VERIFIED under the npm registry ECDSA key (npm's key, not CSOAI's)" if reg else
                                                 "NOT_PRESENT" if reg is None else "FAILED")},
            "ots": {"state": "none"}, "licence": m.get("license") or "NOT_DECLARED",
            "published": (d.get("time") or {}).get("created"), "last_modified": (d.get("time") or {}).get(v),
            "does_not_show": ["That the code does what its description says: the hash pins the latest tarball only.",
                              "Who built it, cryptographically: the registry signature says npm served these bytes, not who wrote them."],
            "check": {"type": "package", "files": [{"filename": f["filename"], "url": f["url"], "sha256": f["sha256"], "npm_integrity": dist["integrity"]}]}}


# ------------------------------------------------------------------ surfaces
def surface_item(kind, url, title, keys):
    b, h = V.fetch(url)
    try:
        doc = json.loads(b)
    except Exception:
        doc = None
    item = {"id": url.replace("https://", "web:"), "kind": kind, "title": title, "url": url, "pinned_revision": None,
            "content_sha256": V.sha256(b), "content_sha256_of": "the bytes served at fetch time (LIVE: expected to change)",
            "fetched_utc": now(), "bytes": len(b), "ots": {"state": "none", "detail": "no OTS proof published alongside this live surface"},
            "check": {"type": "url_bytes", "url": url, "live": True}}
    lic = None
    if isinstance(doc, dict):
        lic = (doc.get("totals") or {}).get("license") or doc.get("license") or doc.get("licence")
        mo = doc.get("measured_on") if isinstance(doc.get("measured_on"), dict) else {}
        item["as_of"] = doc.get("as_of") or mo.get("date") or doc.get("packaged_at") or doc.get("created")
    item["licence"] = lic if isinstance(lic, str) else "NOT_DECLARED in the payload"
    dn = ["That these bytes will still be served tomorrow: this is a live surface, so verify.py reports different bytes as DRIFTED."]
    if kind == "trust-anchor":
        item["signature"] = {"state": "NOT_APPLICABLE", "detail": "the DID document is the key source; its integrity rests on DNS + TLS for csoai.org"}
        dn.append("That the keys were never rotated or compromised: a DID document states current keys only.")
    elif url.endswith("/signed/card_index.json"):
        rows = V.card_index_rows(doc, keys)
        env = V.verify_signed_doc({k: v for k, v in doc.items() if k != "cards"}, keys)
        full = rows["verified"] == rows["rows"] and rows["rows"] > 0
        item["signature"] = {"state": "VERIFIED" if full else ("FAILED" if rows["not_verified"] else "PARTIAL"),
                             "scope": "each card listed; the index envelope itself carries no signature (%s)" % env["state"],
                             "key": "did:web:csoai.org#card-attestation-1", "rows": rows,
                             "rule": "card: id == sha256(json.dumps(body, sort_keys, compact, ensure_ascii=True)); Ed25519 over that preimage"}
        item["check"]["signature_rule"] = "card_index_rows"
        dn.append(doc.get("what_this_does_not_establish") or "That the set is complete.")
        dn.append("This is corpus 3 of three card corpora (see /api/state signed_cards.corpus_relation); never add its count to /root.json card_count or cards-bundle.json.")
    else:
        r = V.verify_signed_doc(doc, keys) if isinstance(doc, dict) else {"state": "UNSIGNED"}
        item["signature"] = r
        if r["state"] != "UNSIGNED":
            item["check"]["signature_rule"] = r.get("rule", "auto")
        if url.endswith("/api/gspc"):
            dn.append("A re-measurement: the site_attestation signs the snapshot as published, not a new run.")
            dn.append("Certification of any model: measurement, not certification.")
        if url.endswith("/root.json"):
            dn.append("That any card is correct: the root binds %s leaf hashes and the count; leaves are coverage harvest, not grades." % doc.get("card_count"))
            dn.append("A different corpus: /root.json card_count is corpus 2; never add it to the signed card index count.")
        if url.endswith("/api/state"):
            dn.append("A signature over this payload: /api/state is unsigned; its board.signature field describes a different, SUPERSEDED artifact.")
    item["does_not_show"] = dn
    log("%-8s %-48s sha=%s sig=%s" % (kind, url, item["content_sha256"][:10], item["signature"]["state"]))
    return item


# ------------------------------------------------------------------ build
def build(a):
    out = pathlib.Path(a.out); (out / "manifests").mkdir(parents=True, exist_ok=True)
    token = pathlib.Path(os.path.expanduser(a.hf_token)).read_text().strip() if a.hf_token and os.path.exists(os.path.expanduser(a.hf_token)) else None
    did_bytes, _ = V.fetch(V.DID_URL); keys = V.did_keys(did_bytes)
    started = now()
    items, subs, errors = [], [], []
    for kind, url, title in SURFACES:
        try:
            items.append(surface_item(kind, url, title, keys))
        except Exception as e:
            errors.append({"source": url, "error": "%s: %s" % (type(e).__name__, str(e)[:120])})
    repos = []
    for kind in ("datasets", "spaces", "models"):
        # ANONYMOUS listing: the index is public, so it enumerates only what a stranger can see.
        # (An authenticated listing also returns the org's private repos; they must never enter a public tree.)
        lst, _ = V.fetch_json("%s/api/%s?author=csoai&limit=1000" % (V.HF, kind))
        repos += [(kind, x["id"]) for x in lst if not x.get("private") and not x.get("gated")]
    with cf.ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = {ex.submit(hf_item, k, r, keys, token): (k, r) for k, r in repos}
        for f in cf.as_completed(futs):
            k, r = futs[f]
            try:
                it, sb, (kk, rr, mb) = f.result()
                items.append(it); subs += sb
                (out / "manifests" / ("%s__%s.json" % (kk, rr.replace("/", "__")))).write_bytes(mb)
            except Exception as e:
                errors.append({"source": "hf:%s/%s" % (k, r), "error": "%s: %s" % (type(e).__name__, str(e)[:120])})
                log("ERROR", k, r, e)
    owners = json.load(open(a.owners))
    (out / "enumeration").mkdir(exist_ok=True)
    (out / "enumeration" / "owners.json").write_text(json.dumps(owners_public(owners), indent=1) + "\n")
    npm_keys = V.fetch_json("https://registry.npmjs.org/-/npm/v1/keys")[0]["keys"]
    decisions = []
    for reg, names in (("pypi", owners["pypi_selected"]), ("npm", sorted(set(owners["npm_selected"]) | set(NPM_SEED)))):
        for n in names:
            try:
                dec = ownership(reg, n); decisions.append(dec)
                log("ownership", reg, n, dec["decision"], dec["reason"])
                if dec["decision"] != "INCLUDED":
                    continue
                it = pypi_item(n) if reg == "pypi" else npm_item(n, npm_keys)
                it["publisher"] = {"rule": "enumeration.package_ownership", "decision": dec["decision"], "reason": dec["reason"],
                                   "declared_publisher": dec["declared_publisher"], "declared_source": dec["declared_source"]}
                items.append(it); log(reg, n)
            except Exception as e:
                errors.append({"source": "%s:%s" % (reg, n), "error": "%s: %s" % (type(e).__name__, str(e)[:120])})
            time.sleep(0.5)
    items += subs
    order = {"trust-anchor": 0, "board": 1, "surface": 2, "signed-record": 3, "dataset": 4, "space": 5, "model": 6, "package": 7}
    items.sort(key=lambda x: (order.get(x["kind"], 9), x["id"]))
    externalize_checks(items, out)
    tot = totals(items)
    idx = {
        "schema": SCHEMA, "as_of": now(), "build_started": started,
        "publisher": "CSOAI Ltd (Council of AI, councilof.ai; Companies House 16939677)",
        "licence": {"index_data": "CC-BY-4.0", "verify.py": "Apache-2.0", "items": "each item states its own licence; this index does not relicense anything"},
        "what_this_is": "One machine-readable list of the evidence CSOAI has published, each item pinned by a sha256 computed from bytes fetched in this run, with the signature and timestamp state established by a check run in this build. verify.py re-runs those checks from nothing but public URLs.",
        "what_this_does_not_show": [
            "That any item is correct, safe, or complete: an index proves which bytes were published and who signed them, not that their claims are true.",
            "Any certification or endorsement: CSOAI measures; it does not certify, and inclusion here endorses nothing.",
            "Evidence not reachable from the enumerated sources (see enumeration.not_enumerated). A source absent from this list leaves no trace here.",
            "That live surfaces still serve these bytes: they are fetched LIVE and pinned only to this build's fetch.",
            "Bitcoin-anchored time for any proof whose state is pending.",
        ],
        "trust_anchor": {"did_document": V.DID_URL, "did_document_sha256_at_build": V.sha256(did_bytes),
                         "index_signed_by": "did:web:csoai.org#" + V.BOARD_KEY,
                         "keys_in_did": {k: v.hex() for k, v in sorted(keys.items())}},
        "enumeration": {
            "hugging_face": {"source": "GET https://huggingface.co/api/{datasets,spaces,models}?author=csoai", "repos_listed": len(repos),
                             "repos_indexed": sum(1 for i in items if i["kind"] in ("dataset", "space", "model")),
                             "scope": "every public repo the API listed for org csoai at build time, each pinned to its commit"},
            "pypi": {"source": "PyPI XML-RPC user_packages(%r) + JSON API" % owners["pypi_owner"], "projects_owned": len(owners["pypi_owned"]),
                     "candidates": owners["pypi_selected"], "candidate_filter": "name contains 'csoai' or 'gspc' (proposes only; inclusion is enumeration.package_ownership)",
                     "included": [d["name"] for d in decisions if d["registry"] == "pypi" and d["decision"] == "INCLUDED"],
                     "scope_note": "the account is shared by CSOAI, MEOK and CSGA Global; the other %d projects it owns are not name candidates and are not indexed, including projects whose metadata names CSOAI Ltd but whose names lack 'csoai'/'gspc' (a known gap of this version). Only the latest release of each included project is pinned." % (len(owners["pypi_owned"]) - len(owners["pypi_selected"]))},
            "npm": {"source": "registry search maintainer:%s (a search index: PARTIAL by nature) + named seed %s" % (owners["npm_maintainer"], NPM_SEED),
                    "search_hits": len(owners["npm_maintained"]), "candidates": sorted(set(owners["npm_selected"]) | set(NPM_SEED)),
                    "candidate_filter": "name contains 'csoai' or 'gspc' (proposes only; inclusion is enumeration.package_ownership)",
                    "included": [d["name"] for d in decisions if d["registry"] == "npm" and d["decision"] == "INCLUDED"]},
            "package_ownership": {"rule_version": "2 (2026-09-25; supersedes v1, which included every name candidate)", "rule": OWNERSHIP_RULE,
                                  "estate_accounts": ESTATE_ACCOUNTS, "csoai_npm_scopes": sorted(CSOAI_NPM_SCOPES),
                                  "decisions": decisions,
                                  "counts": dict(collections.Counter(d["decision"] for d in decisions)),
                                  "why": "CSOAI (the measurement body) and MEOK (training and gamification) are separate estate entities. A package is indexed only when the registry bytes name CSOAI as its publisher, never because its name contains 'csoai'."},
            "web_surfaces": {"source": "fixed list", "urls": [u for _, u, _ in SURFACES]},
            "not_enumerated": [
                "GitHub: the estate's GitHub accounts are flagged and the repos are not publicly readable; nothing from GitHub is indexed.",
                "Zenodo DOIs (e.g. 10.5281/zenodo.21991104 cited by /api/gspc): not enumerated in this version.",
                "Kaggle, MCP registries, Smithery, other directories: listings, not evidence CSOAI publishes; not indexed.",
                "Files inside the councilof.ai site beyond the surfaces listed above.",
                "Signature files inside Hugging Face repos whose names do not match %s." % SIG_PAT.pattern,
            ],
            "read_state": "PARTIAL" if errors else "COMPLETE_FOR_STATED_SOURCES",
            "errors": errors,
        },
        "caps": {"signature_files_per_repo": SIGCAP, "ots_proofs_per_repo": OTSCAP, "generic_files_byte_checked_per_repo": BYTECAP,
                 "note": "Caps bound the build's traffic. Every cap that bit is visible per item (checked < candidates) and in does_not_show."},
        "totals": tot,
        "items": items,
    }
    (out / INDEX_PATH).write_text(json.dumps(idx, indent=1, ensure_ascii=False) + "\n")
    print("index.json sha256=%s items=%d errors=%d" % (V.sha256((out / INDEX_PATH).read_bytes()), len(items), len(errors)))
    print(json.dumps(tot, indent=1))


def owners_public(o):
    """The enumeration as published: the selected names and the sizes of the lists they were selected
    from. The full owned/maintained lists are general tooling outside CSOAI's evidence and are not republished."""
    return {"schema": "csoai.evidence-index.owners/0.1", "fetched_utc": o["fetched_utc"],
            "pypi_owner": o["pypi_owner"], "pypi_owned_count": len(o["pypi_owned"]), "pypi_selected": o["pypi_selected"],
            "npm_maintainer": o["npm_maintainer"], "npm_search_hits": len(o["npm_maintained"]), "npm_selected": o["npm_selected"],
            "filter": "name contains 'csoai' or 'gspc' (case-insensitive): CANDIDATES only; which were indexed is decided by index.json enumeration.package_ownership"}


def externalize_checks(items, out):
    """Move each Hugging Face item's per-file check lists (file paths) out of index.json into
    checks/<kind>__<repo>.json, bound by sha256 from the item. index.json stays small and carries no
    third-party file paths; the lists stay published and signature-bound through the hash."""
    (out / "checks").mkdir(exist_ok=True)
    for it in items:
        c = it.get("check") or {}
        if c.get("type") != "hf_repo" or "byte_checked_paths" not in c:
            continue
        doc = {"schema": "csoai.evidence-index.checks/0.1", "item": it["id"], "revision": c["revision"],
               "byte_checked_paths": c.pop("byte_checked_paths"), "signature_checks": c.pop("signature_checks")}
        b = V.canon(doc, False)
        name = "checks/%s__%s.json" % (c["hf_kind"], c["repo"].replace("/", "__"))
        (out / name).write_bytes(b)
        c["checks_file"] = name; c["checks_sha256"] = V.sha256(b)
        for k in ("oid_mismatches", "fetch_failed"):
            it["bytes_checked"][k + "_count"] = len(it["bytes_checked"][k])
        it["bytes_checked"]["paths_in"] = name


def split(a):
    """Apply externalize_checks to an unsigned index.json from an earlier build (no re-fetch)."""
    out = pathlib.Path(a.out); idx = json.loads((out / INDEX_PATH).read_text())
    assert not (out / "index.signed.json").exists(), "sign after split, never before"
    externalize_checks(idx["items"], out)
    (out / INDEX_PATH).write_text(json.dumps(idx, indent=1, ensure_ascii=False) + "\n")
    print("index.json sha256=%s checks files=%d" % (V.sha256((out / INDEX_PATH).read_bytes()), len(list((out / "checks").iterdir()))))


def totals(items):
    t = {"items": len(items), "by_kind": dict(collections.Counter(i["kind"] for i in items)),
         "signature_state_by_kind": {}, "ots_state_by_kind": {}}
    for k in t["by_kind"]:
        t["signature_state_by_kind"][k] = dict(collections.Counter(i["signature"]["state"] for i in items if i["kind"] == k))
        t["ots_state_by_kind"][k] = dict(collections.Counter(i["ots"]["state"] for i in items if i["kind"] == k))
    sr = [i for i in items if i["kind"] == "signed-record"]
    t["signed_records_verified_under_board_attestation_1"] = sum(1 for i in sr if i["signature"]["state"] == "VERIFIED" and i["signature"].get("key", "").endswith("#board-attestation-1"))
    t["signed_records_artifact_binding"] = dict(collections.Counter(i["artifact"]["state"] for i in sr))
    t["hf_files_listed"] = sum(i.get("files", 0) for i in items if i["kind"] in ("dataset", "space", "model"))
    t["hf_files_byte_checked"] = sum(i["bytes_checked"]["files"] for i in items if i["kind"] in ("dataset", "space", "model"))
    t["hf_oid_mismatches"] = sum(len(i["bytes_checked"]["oid_mismatches"]) for i in items if i["kind"] in ("dataset", "space", "model"))
    t["hf_fetch_failed"] = sum(len(i["bytes_checked"]["fetch_failed"]) for i in items if i["kind"] in ("dataset", "space", "model"))
    t["note"] = "Counts of index items, by kind and state. Never sum these with any other CSOAI count; an item is a published object, not a measurement."
    return t


# ------------------------------------------------------------------ sign / ots
def sign(a):
    out = pathlib.Path(a.out); raw = (out / INDEX_PATH).read_bytes(); idx = json.loads(raw)
    tok = pathlib.Path(os.path.expanduser(a.token)).read_text().strip()
    t = idx["totals"]
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {"path": INDEX_PATH, "sha256": V.sha256(raw), "schema": idx["schema"], "as_of": idx["as_of"]},
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": "The signature proves these index bytes were signed by the board key on the date below. It does not make any indexed item correct, complete, or endorsed.",
        "items": t["items"], "by_kind": t["by_kind"],
        "read_state": idx["enumeration"]["read_state"],
    }
    canon = V.canon(payload, False)
    assert len(canon) <= 3072, len(canon)
    req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok, "user-agent": "Mozilla/5.0 csoai-pod-signer"})
    r = json.load(urllib.request.urlopen(req, timeout=40))
    assert r["payload_sha256"] == V.sha256(canon), "preimage mismatch"
    keys = V.did_keys(); pk = keys[V.BOARD_KEY]
    assert V.ed_ok(pk, bytes.fromhex(r["sig_ed25519"]), canon), "signature does not verify"
    print("signature VERIFIES under did:web:csoai.org#board-attestation-1")
    controls = {}
    for name, alt in (("trailing byte appended", canon + b" "), ("index sha256 altered", canon.replace(V.sha256(raw).encode(), b"0" * 64))):
        assert alt != canon
        controls[name] = "VERIFIED (CONTROL FAILED)" if V.ed_ok(pk, bytes.fromhex(r["sig_ed25519"]), alt) else "rejected (control holds)"
    print("controls:", controls)
    if any("FAILED" in v for v in controls.values()):
        sys.exit(3)
    doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                         "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                         "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
           "local_verification": {"did_document": V.DID_URL, "result": "VERIFIES", "altered_preimage_controls": controls},
           "verify": "canonicalise payload (sort_keys, separators=(',',':'), ensure_ascii=False, UTF-8); sha256 must equal signature.payload_sha256; payload.artifact.sha256 must equal sha256(index.json); verify sig_ed25519 (hex) with the #board-attestation-1 key in https://csoai.org/.well-known/did.json"}
    # the file verifies under the same code the stranger runs
    chk = V.verify_signed_doc(doc, keys)
    assert chk["state"] == "VERIFIED" and chk["tamper_control"] == "rejected", chk
    (out / "index.signed.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print("SIGNED index.json sha256=%s signed_at=%s" % (V.sha256(raw), r.get("signed_at")))


def ots(a):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext
    cals = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org", "https://finney.calendar.eternitywall.com"]
    out = pathlib.Path(a.out); raw = (out / INDEX_PATH).read_bytes(); d = hashlib.sha256(raw).digest()
    ts = Timestamp(d); got, failed = [], {}
    for u in cals:
        try:
            ts.merge(RemoteCalendar(u).submit(d, timeout=30)); got.append(u)
        except Exception as e:
            failed[u] = "%s: %s" % (type(e).__name__, str(e)[:80])
    if not got:
        sys.exit("NOT_STAMPED: no calendar accepted the digest")
    ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx); proof = ctx.getbytes()
    (out / "index.json.ots").write_bytes(proof)
    r = V.ots_inspect(proof, V.sha256(raw))
    side = {"schema": "csoai.ots-state/0.1", "file": INDEX_PATH, "sha256": V.sha256(raw), "ots_file": "index.json.ots", "ots_sha256": V.sha256(proof),
            "stamped_utc": now(), "calendars_accepted": got, "calendars_failed": failed, "inspect": r,
            "state": "PENDING_CALENDAR_COMMITMENT" if r["state"] == "pending" else r["state"],
            "state_meaning": "Calendars accepted this digest and promised future Bitcoin inclusion. This is NOT a Bitcoin attestation until `ots upgrade` returns a BitcoinBlockHeaderAttestation and `ots verify` checks it against the chain."}
    assert r.get("binds_to_target") is True
    (out / "index.ots.json").write_text(json.dumps(side, indent=1) + "\n")
    print("OTS %d calendars, state=%s binds=%s" % (len(got), side["state"], r.get("binds_to_target")))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["build", "split", "sign", "ots"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--hf-token", default="~/.secrets/hf_token")
    ap.add_argument("--token", default="~/.secrets/board-sign-pod-token")
    ap.add_argument("--owners", required=False, default="owners.json", help="PyPI/npm owner enumeration (owners.py output); copied to OUT/enumeration/")
    ap.add_argument("--workers", type=int, default=5)
    a = ap.parse_args()
    {"build": build, "split": split, "sign": sign, "ots": ots}[a.cmd](a)
