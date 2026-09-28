#!/usr/bin/env python3
"""EAT Rights Gate: the stage between Discovery (frame.py) and Adapter/Runner (the probe).

For every row a census frame discovered, record what we are allowed to DO with it, per purpose:

    MEASURE_PUBLIC  probe the discovery surface of a publicly advertised endpoint
                    (initialize / tools/list / agent card). Allowed for any publicly advertised
                    endpoint. Licence-independent: reading what a server advertises to every
                    caller is not a use of its code.
    REUSE_CODE      incorporate the subject's code into our own code.
    VENDOR          copy the subject's code or artefact into a repository or distribution we ship.
    TRAIN           use the subject's code or content as training data.

Each decision is exactly one of
    ALLOWED
    RESTRICTED(reason)   the licence or the listing restricts this purpose
    UNKNOWN(reason)      no licence could be read. UNKNOWN BLOCKS REUSE_CODE, VENDOR and TRAIN:
                         it is never read as ALLOWED.

Licence evidence, cheapest first (the GitHub licence API serves 60 anonymous requests an hour,
so it is a SAMPLE, never the pass):
    npm      registry.npmjs.org/<pkg>/latest      `license` / legacy `licenses`
    PyPI     pypi.org/pypi/<pkg>/json             `license_expression`, then `license`, then
                                                  License :: classifiers
    NuGet    nuspec <license type="expression">   (flat container)
    crates   crates.io versions[].license
    HF Space cardData.license (one re-walk of the same filtered listing)
    OCI      org.opencontainers.image.licenses label -- a capped sample (Docker Hub allows
             anonymous callers very few manifest reads an hour)
    GitHub   /repos/{o}/{r}/license -- a seeded sample of <= 50 repositories

This is a policy gate, not legal advice. It reads DECLARED licences; a declaration can be wrong,
and a repository file can differ from the package metadata (the GitHub sample measures how often).
Catalogue terms (the catalogue's own ToS / data licence) are recorded beside every decision; they
govern the LISTING text, not the listed code.

Usage:
  rights_gate.py --frame /evac-bulk/census-frame-2026-09-25 --out /evac-bulk/rights-gate-2026-09-25
  rights_gate.py --self-test
"""
from __future__ import annotations

import argparse
import collections
import datetime
import gzip
import hashlib
import importlib.util
import ipaddress
import json
import os
import random
import re
import sys
import tarfile
import threading
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
_SPEC = importlib.util.spec_from_file_location("census_frame", os.path.join(HERE, "frame.py"))
frame = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(frame)
Fetcher, FetchError, UA = frame.Fetcher, frame.FetchError, frame.UA

SCHEMA = "csoai.rights-gate/0.1"
PURPOSES = ("MEASURE_PUBLIC", "REUSE_CODE", "VENDOR", "TRAIN")
ALLOWED, RESTRICTED, UNKNOWN = "ALLOWED", "RESTRICTED", "UNKNOWN"

NPM = "https://registry.npmjs.org/"
PYPI = "https://pypi.org/pypi/"
NUGET = "https://api.nuget.org/v3-flatcontainer/"
CRATES = "https://crates.io/api/v1/crates/"
HF_SPACES_LICENCE = ("https://huggingface.co/api/spaces?filter=mcp-server&limit=1000"
                     "&expand[]=cardData&expand[]=private")
GITHUB_API = "https://api.github.com/repos/"


def pep503(name):
    return re.sub(r"[-_.]+", "-", str(name)).lower()


def utcnow() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ================================================================ licence categories
# Category decides the gate. An id that is valid SPDX but absent from this table is
# UNRECOGNISED (-> UNKNOWN): the table is the gate's knowledge, and it says so.
PERMISSIVE, PUBLIC_DOMAIN = "permissive", "public_domain"
WEAK, STRONG, NETWORK = "weak_copyleft", "strong_copyleft", "network_copyleft"
SHARE_ALIKE, NON_COMMERCIAL, NO_DERIV = "share_alike", "non_commercial", "no_derivatives"
SOURCE_AVAILABLE, USE_RESTRICTED, PROPRIETARY = "source_available", "use_restricted", "proprietary"

_CATS = {
    PERMISSIVE: """MIT MIT-0 Apache-2.0 Apache-1.1 BSD-2-Clause BSD-3-Clause BSD-3-Clause-Clear
        BSD-4-Clause 0BSD ISC Zlib BSL-1.0 PSF-2.0 Python-2.0 X11 Artistic-2.0 UPL-1.0 NCSA
        PostgreSQL Unicode-DFS-2016 Unicode-3.0 BlueOak-1.0.0 AFL-3.0 MulanPSL-2.0 WTFPL
        CC-BY-4.0 CC-BY-3.0 CC-BY-2.0 ECL-2.0 MS-PL curl JSON
        LicenseRef-BSD-unspecified""",
    PUBLIC_DOMAIN: "Unlicense CC0-1.0 LicenseRef-public-domain",
    WEAK: """LGPL-2.0 LGPL-2.0-only LGPL-2.0-or-later LGPL-2.1 LGPL-2.1-only LGPL-2.1-or-later
        LGPL-3.0 LGPL-3.0-only LGPL-3.0-or-later MPL-1.1 MPL-2.0 EPL-1.0 EPL-2.0 CDDL-1.0
        CDDL-1.1 MS-RL LicenseRef-LGPL-unspecified""",
    STRONG: """GPL-2.0 GPL-2.0-only GPL-2.0-or-later GPL-3.0 GPL-3.0-only GPL-3.0-or-later
        EUPL-1.1 EUPL-1.2 OSL-3.0 LicenseRef-GPL-unspecified""",
    NETWORK: "AGPL-1.0 AGPL-3.0 AGPL-3.0-only AGPL-3.0-or-later LicenseRef-AGPL-unspecified",
    SHARE_ALIKE: "CC-BY-SA-4.0 CC-BY-SA-3.0 CC-BY-SA-2.0 OFL-1.1 ODbL-1.0",
    NON_COMMERCIAL: """CC-BY-NC-4.0 CC-BY-NC-3.0 CC-BY-NC-2.0 CC-BY-NC-SA-4.0 CC-BY-NC-SA-3.0
        CC-BY-NC-SA-2.0 CC-BY-NC-ND-4.0 CC-BY-NC-ND-3.0 PolyForm-Noncommercial-1.0.0""",
    NO_DERIV: "CC-BY-ND-4.0 CC-BY-ND-3.0",
    SOURCE_AVAILABLE: """BUSL-1.1 SSPL-1.0 Elastic-2.0 PolyForm-Shield-1.0.0
        PolyForm-Small-Business-1.0.0 LicenseRef-Commons-Clause""",
    USE_RESTRICTED: """LicenseRef-hf-openrail LicenseRef-hf-openrail++ LicenseRef-hf-creativeml-openrail-m
        LicenseRef-hf-bigscience-openrail-m LicenseRef-hf-bigscience-bloom-rail-1.0
        LicenseRef-hf-llama2 LicenseRef-hf-llama3 LicenseRef-hf-llama3.1 LicenseRef-hf-llama3.2
        LicenseRef-hf-llama3.3 LicenseRef-hf-llama4 LicenseRef-hf-gemma""",
    PROPRIETARY: "LicenseRef-proprietary",
}
CATEGORY = {i: c for c, ids in _CATS.items() for i in ids.split()}
_CI = {k.lower(): k for k in CATEGORY}
# how restrictive a category is: an AND takes the max, an OR (licensee's choice) the min
RANK = {PERMISSIVE: 0, PUBLIC_DOMAIN: 0, WEAK: 2, SHARE_ALIKE: 3, STRONG: 3, NETWORK: 4,
        USE_RESTRICTED: 4, SOURCE_AVAILABLE: 5, NON_COMMERCIAL: 5, NO_DERIV: 5, PROPRIETARY: 6}

ALIASES = {
    "mit": "MIT", "mit license": "MIT", "the mit license": "MIT", "mit licence": "MIT", "expat": "MIT",
    "mit-license": "MIT", "mit/x11": "MIT",
    "apache 2.0": "Apache-2.0", "apache-2": "Apache-2.0", "apache 2": "Apache-2.0", "apache2": "Apache-2.0",
    "apache license 2.0": "Apache-2.0", "apache license, version 2.0": "Apache-2.0",
    "apache license version 2.0": "Apache-2.0", "apache-2.0 license": "Apache-2.0",
    "apache software license 2.0": "Apache-2.0", "apache software license": "Apache-2.0",
    "apache license": "Apache-2.0", "apache": "Apache-2.0", "asl 2.0": "Apache-2.0", "apache2.0": "Apache-2.0",
    "apache license (2.0)": "Apache-2.0", "apache 2.0 license": "Apache-2.0",
    "bsd": "LicenseRef-BSD-unspecified", "bsd license": "LicenseRef-BSD-unspecified",
    "bsd-3": "BSD-3-Clause", "bsd 3-clause": "BSD-3-Clause", "3-clause bsd": "BSD-3-Clause",
    "new bsd": "BSD-3-Clause", "bsd-3-clause license": "BSD-3-Clause", "bsd 3-clause license": "BSD-3-Clause",
    "bsd-2": "BSD-2-Clause", "2-clause bsd": "BSD-2-Clause", "simplified bsd": "BSD-2-Clause",
    "isc license": "ISC",
    "gpl": "LicenseRef-GPL-unspecified", "gplv2": "GPL-2.0", "gpl-2": "GPL-2.0", "gpl v2": "GPL-2.0",
    "gplv3": "GPL-3.0", "gpl-3": "GPL-3.0", "gpl v3": "GPL-3.0", "gnu gpl v3": "GPL-3.0", "gpl3": "GPL-3.0",
    "gnu general public license v3.0": "GPL-3.0", "gnu gplv3": "GPL-3.0",
    "agpl": "LicenseRef-AGPL-unspecified", "agplv3": "AGPL-3.0", "agpl-3": "AGPL-3.0", "agpl v3": "AGPL-3.0",
    "lgpl": "LicenseRef-LGPL-unspecified", "lgplv3": "LGPL-3.0", "lgplv2.1": "LGPL-2.1",
    "mpl 2.0": "MPL-2.0", "mpl-2": "MPL-2.0", "mpl2": "MPL-2.0", "mozilla public license 2.0": "MPL-2.0",
    "unlicense": "Unlicense", "the unlicense": "Unlicense",
    "public domain": "LicenseRef-public-domain", "public-domain": "LicenseRef-public-domain",
    "cc0": "CC0-1.0", "cc0 1.0": "CC0-1.0", "cc-0": "CC0-1.0",
    "cc by 4.0": "CC-BY-4.0", "cc-by 4.0": "CC-BY-4.0", "cc by-nc 4.0": "CC-BY-NC-4.0",
    "cc by-nc-sa 4.0": "CC-BY-NC-SA-4.0",
    "proprietary": "LicenseRef-proprietary", "commercial": "LicenseRef-proprietary",
    "all rights reserved": "LicenseRef-proprietary", "private": "LicenseRef-proprietary",
    "closed source": "LicenseRef-proprietary",
    # npm: "UNLICENSED" means NOT licensed (all rights reserved). Not "Unlicense".
    "unlicensed": "LicenseRef-proprietary",
    "commons clause": "LicenseRef-Commons-Clause",
    "polyform noncommercial": "PolyForm-Noncommercial-1.0.0",
}

CLASSIFIERS = {
    "MIT License": "MIT", "MIT No Attribution License (MIT-0)": "MIT-0",
    "Apache Software License": "Apache-2.0",  # classifier carries no version; almost always 2.0
    "BSD License": "LicenseRef-BSD-unspecified", "ISC License (ISCL)": "ISC",
    "GNU General Public License (GPL)": "LicenseRef-GPL-unspecified",
    "GNU General Public License v2 (GPLv2)": "GPL-2.0-only",
    "GNU General Public License v2 or later (GPLv2+)": "GPL-2.0-or-later",
    "GNU General Public License v3 (GPLv3)": "GPL-3.0-only",
    "GNU General Public License v3 or later (GPLv3+)": "GPL-3.0-or-later",
    "GNU Affero General Public License v3": "AGPL-3.0-only",
    "GNU Affero General Public License v3 or later (AGPLv3+)": "AGPL-3.0-or-later",
    "GNU Lesser General Public License v2 (LGPLv2)": "LGPL-2.0-only",
    "GNU Lesser General Public License v2 or later (LGPLv2+)": "LGPL-2.0-or-later",
    "GNU Lesser General Public License v3 (LGPLv3)": "LGPL-3.0-only",
    "GNU Lesser General Public License v3 or later (LGPLv3+)": "LGPL-3.0-or-later",
    "GNU Library or Lesser General Public License (LGPL)": "LicenseRef-LGPL-unspecified",
    "Mozilla Public License 2.0 (MPL 2.0)": "MPL-2.0", "Mozilla Public License 1.1 (MPL 1.1)": "MPL-1.1",
    "Eclipse Public License 2.0 (EPL-2.0)": "EPL-2.0", "Eclipse Public License 1.0 (EPL-1.0)": "EPL-1.0",
    "The Unlicense (Unlicense)": "Unlicense", "Python Software Foundation License": "PSF-2.0",
    "zlib/libpng License": "Zlib", "Boost Software License 1.0 (BSL-1.0)": "BSL-1.0",
    "European Union Public Licence 1.2 (EUPL 1.2)": "EUPL-1.2",
    "Universal Permissive License (UPL)": "UPL-1.0", "Academic Free License (AFL)": "AFL-3.0",
    "Public Domain": "LicenseRef-public-domain",
    "CC0 1.0 Universal (CC0 1.0) Public Domain Dedication": "CC0-1.0",
    "Other/Proprietary License": "LicenseRef-proprietary",
}

# full licence texts pasted into a metadata field (PyPI `license` does this a lot)
TEXT_MARKERS = (
    (re.compile(r"permission is hereby granted, free of charge", re.I), "MIT"),
    (re.compile(r"apache license\s*,?\s*version 2\.0", re.I), "Apache-2.0"),
    (re.compile(r"redistribution and use in source and binary forms", re.I), "LicenseRef-BSD-unspecified"),
    (re.compile(r"gnu affero general public license", re.I), "LicenseRef-AGPL-unspecified"),
    (re.compile(r"gnu lesser general public license", re.I), "LicenseRef-LGPL-unspecified"),
    (re.compile(r"gnu general public license", re.I), "LicenseRef-GPL-unspecified"),
    (re.compile(r"mozilla public license,? v(ersion)? ?\.?\s*2\.0", re.I), "MPL-2.0"),
    (re.compile(r"this is free and unencumbered software released into the public domain", re.I), "Unlicense"),
    (re.compile(r"permission to use, copy, modify, and(/or)? distribute this software", re.I), "ISC"),
)
_HF_ID = re.compile(r"^(openrail\+*|creativeml-openrail-m|bigscience-openrail-m|bigscience-bloom-rail-1\.0|"
                    r"llama[0-9.]*|gemma)$")


def licence_fact(spdx, status, raw=None, source=None):
    """One piece of licence evidence. category None = the gate cannot use it."""
    cat = category_of(spdx) if spdx else None
    return {"spdx": spdx, "category": cat, "status": status,
            "raw": (str(raw)[:160] if raw is not None else None), "source": source}


def category_of(spdx):
    """Category of an id or of an expression; None if any needed leaf is unknown."""
    if spdx is None:
        return None
    try:
        tree = _parse_expr(spdx)
    except ValueError:
        return None
    return _eval_cat(tree)


# ---- SPDX expression parser: or := and (OR and)* ; and := atom (AND atom)* ; atom := ( or ) | id [WITH id]
_TOK = re.compile(r"\(|\)|[A-Za-z0-9.+\-:]+")


def _parse_expr(s):
    toks = _TOK.findall(s)
    if not toks or "".join(toks).replace(" ", "") != re.sub(r"\s+", "", s):
        raise ValueError("not an SPDX expression")
    pos = [0]

    def peek():
        return toks[pos[0]] if pos[0] < len(toks) else None

    def take():
        t = toks[pos[0]]
        pos[0] += 1
        return t

    def p_or():
        node = [p_and()]
        while peek() and peek().upper() == "OR":
            take()
            node.append(p_and())
        return node[0] if len(node) == 1 else ("OR", node)

    def p_and():
        node = [p_atom()]
        while peek() and peek().upper() == "AND":
            take()
            node.append(p_atom())
        return node[0] if len(node) == 1 else ("AND", node)

    def p_atom():
        t = peek()
        if t is None:
            raise ValueError("unexpected end")
        if t == "(":
            take()
            n = p_or()
            if peek() != ")":
                raise ValueError("unbalanced")
            take()
            return n
        if t.upper() in ("AND", "OR", "WITH") or t == ")":
            raise ValueError("operator where an id belongs")
        take()
        if peek() and peek().upper() == "WITH":
            take()
            if peek() is None:
                raise ValueError("WITH needs an exception id")
            take()  # the exception narrows obligations; the base licence decides the category
        return ("ID", t)

    tree = p_or()
    if pos[0] != len(toks):
        raise ValueError("trailing tokens")
    return tree


def _canon_id(t):
    if t.endswith("+"):
        base = _CI.get(t[:-1].lower())
        if base and (base + "-or-later") in CATEGORY:
            return base + "-or-later"
        return base
    return _CI.get(t.lower())


def _eval_cat(node):
    if node[0] == "ID":
        cid = _canon_id(node[1])
        return CATEGORY.get(cid) if cid else None
    cats = [_eval_cat(c) for c in node[1]]
    if node[0] == "OR":
        known = [c for c in cats if c]
        return min(known, key=RANK.get) if known else None
    if any(c is None for c in cats):
        return None
    return max(cats, key=RANK.get)


def _canon_expr(node):
    if node[0] == "ID":
        return _canon_id(node[1]) or node[1]
    inner = f" {node[0]} ".join(
        (f"({_canon_expr(c)})" if c[0] != "ID" else _canon_expr(c)) for c in node[1])
    return inner


def normalise(raw, source=None):
    """A declared licence string -> licence_fact. Never guesses beyond the tables above."""
    if raw is None or (isinstance(raw, (list, dict, str)) and not raw):
        return licence_fact(None, "MISSING", raw, source)
    if isinstance(raw, dict):
        raw = raw.get("type") or raw.get("name") or ""
        if not raw:
            return licence_fact(None, "MISSING", None, source)
    s = str(raw)
    if len(s) > 200 or "\n" in s.strip():
        for rx, spdx in TEXT_MARKERS:
            if rx.search(s):
                return licence_fact(spdx, "TEXT", s, source)
        return licence_fact(None, "UNRECOGNISED", s, source)
    c = re.sub(r"\s+", " ", s).strip()
    low = c.lower().strip(" .;")
    if low.startswith("see license in") or low.startswith("see licence in") or low == "see license":
        return licence_fact(None, "SEE_FILE", c, source)
    if c in CATEGORY:
        return licence_fact(c, "SPDX", c, source)
    if low in ("unlicensed",):
        return licence_fact("LicenseRef-proprietary", "ALIAS", c, source)
    if low in ALIASES:
        return licence_fact(ALIASES[low], "ALIAS", c, source)
    try:
        tree = _parse_expr(c)
        cat = _eval_cat(tree)
        if cat:
            return licence_fact(_canon_expr(tree), "SPDX", c, source)
    except ValueError:
        pass
    low2 = re.sub(r"\s*licen[cs]e$", "", low).strip()
    if low2 in ALIASES:
        return licence_fact(ALIASES[low2], "ALIAS", c, source)
    if _HF_ID.match(low):
        return licence_fact("LicenseRef-hf-" + low, "HF_ID", c, source)
    return licence_fact(None, "UNRECOGNISED", c, source)


# ---------------------------------------------------------------- per-registry extractors
def npm_licence(doc, source="npm"):
    if not isinstance(doc, dict):
        return licence_fact(None, "MISSING", None, source)
    lic = doc.get("license")
    if lic:
        return normalise(lic, source)
    legacy = doc.get("licenses")
    if isinstance(legacy, list) and legacy:
        parts = [normalise(x, source) for x in legacy]
        if all(p["spdx"] for p in parts):
            expr = " OR ".join(sorted({p["spdx"] for p in parts}))  # legacy array = dual licence
            return licence_fact(expr, "SPDX", json.dumps(legacy)[:160], source)
        return licence_fact(None, "UNRECOGNISED", json.dumps(legacy)[:160], source)
    return licence_fact(None, "MISSING", None, source)


def pypi_licence(doc, source="pypi"):
    info = (doc or {}).get("info") or {}
    expr = info.get("license_expression")
    if expr:
        f = normalise(expr, source)
        if f["spdx"]:
            f["status"] = "SPDX"
            return f
    text = info.get("license")
    tf = normalise(text, source) if text else None
    if tf and tf["spdx"]:
        return tf
    cls = [c.split("::")[-1].strip() for c in info.get("classifiers") or [] if c.startswith("License ::")]
    mapped = [CLASSIFIERS.get(c) for c in cls if c != "OSI Approved"]
    if mapped and all(mapped):
        uniq = sorted(set(mapped))
        # several License classifiers: read conservatively as all applying (AND)
        spdx = uniq[0] if len(uniq) == 1 else " AND ".join(uniq)
        return licence_fact(spdx, "CLASSIFIER", "; ".join(cls), source)
    if tf:
        return tf  # UNRECOGNISED / SEE_FILE text, kept verbatim
    if cls:
        return licence_fact(None, "UNRECOGNISED", "; ".join(cls), source)
    return licence_fact(None, "MISSING", None, source)


_NUSPEC_EXPR = re.compile(r"<license[^>]*type=\"expression\"[^>]*>([^<]+)</license>", re.I)
_NUSPEC_FILE = re.compile(r"<license[^>]*type=\"file\"[^>]*>([^<]+)</license>", re.I)
_NUSPEC_URL = re.compile(r"<licenseUrl>([^<]+)</licenseUrl>", re.I)


def nuget_licence(nuspec, source="nuget"):
    m = _NUSPEC_EXPR.search(nuspec or "")
    if m:
        return normalise(m.group(1).strip(), source)
    m = _NUSPEC_FILE.search(nuspec or "")
    if m:
        return licence_fact(None, "SEE_FILE", m.group(1).strip(), source)
    m = _NUSPEC_URL.search(nuspec or "")
    if m:
        u = m.group(1).strip()
        mm = re.match(r"https?://licenses\.nuget\.org/(.+)$", u)
        if mm:
            return normalise(urllib.parse.unquote(mm.group(1)), source)
        return licence_fact(None, "SEE_FILE", u, source)
    return licence_fact(None, "MISSING", None, source)


def crates_licence(doc, source="cargo"):
    crate = (doc or {}).get("crate") or {}
    want = crate.get("max_stable_version") or crate.get("newest_version") or crate.get("max_version")
    vers = (doc or {}).get("versions") or []
    pick = next((v for v in vers if v.get("num") == want), vers[0] if vers else None)
    lic = (pick or {}).get("license")
    return normalise(lic.replace("/", " OR ") if lic else lic, source)


# ================================================================ gates
def measure_gate(endpoints, listing_private=False):
    if listing_private:
        return {"state": RESTRICTED, "reason": "private listing: not publicly advertised"}
    usable, nonpublic, templated = 0, 0, 0
    for e in endpoints or []:
        if e.get("reject"):
            continue
        if e.get("templated"):
            templated += 1
            continue
        host = urllib.parse.urlsplit(e.get("canonical") or "").hostname
        if host and public_host(host):
            usable += 1
        else:
            nonpublic += 1
    if usable:
        return {"state": ALLOWED, "reason": f"publicly advertised endpoint ({usable}); discovery surface only"}
    if nonpublic:
        return {"state": RESTRICTED, "reason": "advertised address is not public (loopback/private/local)"}
    if templated:
        return {"state": RESTRICTED, "reason": "templated endpoint: needs a caller-supplied value"}
    return {"state": RESTRICTED, "reason": "no advertised endpoint: nothing to probe"}


def public_host(host):
    h = host.strip("[]").lower()
    try:
        return ipaddress.ip_address(h).is_global
    except ValueError:
        pass
    if "." not in h or h == "localhost":
        return False
    return not h.endswith((".localhost", ".local", ".internal", ".lan", ".home.arpa", ".test",
                           ".example", ".invalid", ".localdomain", ".intranet", ".corp"))


_REASON = {
    WEAK: "weak copyleft ({id}): modified files stay under {id}; not relicensable into Apache-2.0 code",
    STRONG: "strong copyleft ({id}): derivative works must be {id}",
    NETWORK: "network copyleft ({id}): derivative works, including served ones, must be {id}",
    SHARE_ALIKE: "share-alike ({id}): derivatives must carry the same licence",
    NON_COMMERCIAL: "non-commercial ({id}): no commercial use",
    NO_DERIV: "no-derivatives ({id})",
    SOURCE_AVAILABLE: "source-available, not open source ({id}): use restrictions",
    USE_RESTRICTED: "use-based restrictions ({id})",
    PROPRIETARY: "proprietary / not licensed ({id})",
}


def licence_gates(facts):
    """facts: licence evidence for one subject -> {REUSE_CODE, VENDOR, TRAIN: decision} + effective."""
    known = [f for f in facts if f.get("category")]
    if not known:
        why = _unknown_reason(facts)
        d = {"state": UNKNOWN, "reason": why}
        return {p: dict(d) for p in ("REUSE_CODE", "VENDOR", "TRAIN")}, {
            "spdx": None, "category": None, "conflict": False, "basis": [f["source"] for f in facts]}
    spdxs = sorted({f["spdx"] for f in known})
    cat = max((f["category"] for f in known), key=RANK.get)  # disagreeing evidence: most restrictive
    conflict = len({RANK[f["category"]] for f in known}) > 1
    ids = " | ".join(spdxs)
    eff = {"spdx": ids, "category": cat, "conflict": conflict,
           "basis": sorted({f["source"] for f in known})}
    if cat in (PERMISSIVE, PUBLIC_DOMAIN):
        ok = {"state": ALLOWED, "reason": f"{cat} ({ids})"}
        out = {"REUSE_CODE": dict(ok), "VENDOR": dict(ok), "TRAIN": dict(ok)}
        if cat == PERMISSIVE:
            out["VENDOR"]["obligations"] = ["retain licence text and copyright/NOTICE"]
            out["REUSE_CODE"]["obligations"] = ["retain licence text and copyright/NOTICE"]
        return out, eff
    r = {"state": RESTRICTED, "reason": _REASON[cat].format(id=ids)}
    out = {p: dict(r) for p in ("REUSE_CODE", "VENDOR", "TRAIN")}
    if cat in (STRONG, NETWORK, WEAK, SHARE_ALIKE):
        out["TRAIN"]["reason"] += "; whether training triggers the licence's conditions is unsettled - held for counsel"
    return out, eff


def _unknown_reason(facts):
    if not facts:
        return "licence missing: no package or repository licence was read for this row"
    st = collections.Counter(f["status"] for f in facts)
    if st.get("SEE_FILE"):
        return "licence missing: declared only as a file that was not read"
    if st.get("UNRECOGNISED"):
        return "licence unrecognised: declared text not in the gate's SPDX table"
    if st.get("NOT_FOUND"):
        return "licence missing: package not found in its registry"
    if st.get("ERROR"):
        return "licence missing: registry lookup failed"
    return "licence missing: none declared in the metadata read (package registry or Space card)"


# ================================================================ reading the frame
def _jl(path):
    with gzip.open(path, "rt") as fh:
        for line in fh:
            if line.strip():
                yield json.loads(line)


def registry_index(frame_dir):
    """name -> {"repo": url|None, "packages": [(type, identifier, version)]} from raw mcp-registry pages."""
    out = {}
    for d in _iter_raw(frame_dir, "mcp-registry"):
        for s in (d.get("servers") or []) if isinstance(d, dict) else []:
            srv = (s or {}).get("server") or {}
            name = srv.get("name")
            if not name:
                continue
            repo = (srv.get("repository") or {}).get("url") or None
            pk = []
            for p in srv.get("packages") or []:
                t = p.get("registryType") or p.get("registry_type")
                i = p.get("identifier")
                if t and i:
                    pk.append((t, i, p.get("version")))
            out[name] = {"repo": repo, "packages": pk}
    return out


def _iter_raw(frame_dir, source):
    import glob
    for p in sorted(glob.glob(os.path.join(frame_dir, "raw", source, "*.json.gz"))):
        try:
            with gzip.open(p, "rt") as fh:
                yield json.load(fh)
        except (ValueError, OSError, EOFError):
            continue


def docker_index(frame_dir):
    """dir -> {"image", "project"} from the docker/mcp-registry tarball the frame kept; + catalogue LICENSE text."""
    import glob
    out, licence_text = {}, None
    paths = sorted(glob.glob(os.path.join(frame_dir, "raw", "docker-mcp-registry", "*.tar.gz.gz")))
    if not paths:
        return out, None
    try:
        import yaml  # noqa
    except ImportError:
        yaml = None
    with gzip.open(paths[-1], "rb") as outer, tarfile.open(fileobj=outer, mode="r|gz") as tf:
        for m in tf:
            parts = m.name.split("/")
            if len(parts) == 2 and parts[1] in ("LICENSE", "LICENSE.md", "LICENSE.txt") and m.isfile():
                licence_text = tf.extractfile(m).read().decode("utf-8", "replace")
            if len(parts) == 4 and parts[1] == "servers" and parts[3] == "server.yaml" and m.isfile():
                txt = tf.extractfile(m).read().decode("utf-8", "replace")
                img = proj = None
                if yaml:
                    try:
                        y = yaml.safe_load(txt) or {}
                        img, proj = y.get("image"), (y.get("source") or {}).get("project")
                    except Exception:
                        pass
                if proj is None:
                    mm = re.search(r"^source:\s*\n(?:\s+.*\n)*?\s+project:\s*(\S+)", txt, re.M)
                    proj = mm.group(1) if mm else None
                if img is None:
                    mm = re.search(r"^image:\s*(\S+)", txt, re.M)
                    img = mm.group(1) if mm else None
                out[parts[2]] = {"image": img, "project": proj}
    return out, licence_text


def github_repo(url):
    if not url:
        return None
    m = re.match(r"^(?:git\+)?https?://(?:www\.)?github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?(?:[/#?].*)?$",
                 url.strip())
    return f"{m.group(1)}/{m.group(2)}".lower() if m else None


def subjects(frame_dir):
    reg = registry_index(frame_dir)
    dock, _ = docker_index(frame_dir)
    for row in _jl(os.path.join(frame_dir, "entries.jsonl.gz")):
        src, rid, meta = row["source"], row["id"], row.get("meta") or {}
        s = {"source": src, "id": rid, "order": row.get("order"), "endpoints": row.get("endpoints") or [],
             "packages": [], "repo": None, "private": bool(meta.get("private")), "oci": []}
        if src == "mcp-registry":
            r = reg.get(rid) or {}
            s["repo"] = r.get("repo")
            s["packages"] = [list(p) for p in r.get("packages", [])]
            if not r and row.get("npm"):
                s["packages"] = [["npm", n, None] for n in row["npm"]]
        elif src == "docker-mcp-registry":
            d = dock.get(meta.get("dir") or rid) or {}
            s["repo"] = d.get("project")
            img = d.get("image") or meta.get("image")
            if img:
                s["packages"] = [["oci", img, None]]
        elif src == "hf-spaces":
            s["hf_space"] = rid
        yield s


# ================================================================ lookups
def _pool(keys, fn, workers, make_fetcher, cache, cache_path, lock, progress=None):
    """Run fn(fetcher, key) for every key not cached, `workers` threads, one polite Fetcher each."""
    todo = sorted(k for k in keys if k not in cache)
    if not todo:
        return cache
    slices = [todo[i::workers] for i in range(workers)]
    done = [0]

    def save():
        if cache_path:
            tmp = cache_path + ".tmp"
            with open(tmp, "w") as fh:
                json.dump(cache, fh, sort_keys=True)
            os.replace(tmp, cache_path)

    def run(sl):
        f = make_fetcher()
        for k in sl:
            try:
                res = fn(f, k)
            except (FetchError, ValueError, KeyError, TypeError, AttributeError) as e:
                res = licence_fact(None, "ERROR", f"{type(e).__name__}: {e}"[:160], None)
            with lock:
                cache[k] = res
                done[0] += 1
                if done[0] % 250 == 0:
                    save()
                    if progress:
                        progress(done[0], len(todo))

    ts = [threading.Thread(target=run, args=(sl,), daemon=True) for sl in slices if sl]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    with lock:
        save()
    return cache


def _get_json(f, url):
    st, _h, body = f.get(url)
    if st == 404:
        return 404, None
    if st != 200:
        return st, None
    return 200, json.loads(body)


def lookup_npm(f, name):
    st, d = _get_json(f, NPM + urllib.parse.quote(name, safe="@/") + "/latest")
    if st == 404:
        return licence_fact(None, "NOT_FOUND", None, "npm")
    if d is None:
        return licence_fact(None, "ERROR", f"HTTP {st}", "npm")
    return npm_licence(d)


def lookup_pypi(f, name):
    st, d = _get_json(f, PYPI + urllib.parse.quote(name, safe="") + "/json")
    if st == 404:
        return licence_fact(None, "NOT_FOUND", None, "pypi")
    if d is None:
        return licence_fact(None, "ERROR", f"HTTP {st}", "pypi")
    return pypi_licence(d)


def lookup_nuget(f, key):
    name, ver = key.split("@@", 1) if "@@" in key else (key, "")
    lid = name.lower()
    st, idx = _get_json(f, NUGET + urllib.parse.quote(lid) + "/index.json")
    if st == 404:
        return licence_fact(None, "NOT_FOUND", None, "nuget")
    if idx is None:
        return licence_fact(None, "ERROR", f"HTTP {st}", "nuget")
    vers = idx.get("versions") or []
    v = ver.lower() if ver and ver.lower() in vers else (vers[-1] if vers else None)
    if not v:
        return licence_fact(None, "NOT_FOUND", "no versions", "nuget")
    st, _h, body = f.get(f"{NUGET}{urllib.parse.quote(lid)}/{urllib.parse.quote(v)}/{urllib.parse.quote(lid)}.nuspec",
                         accept="application/xml")
    if st != 200:
        return licence_fact(None, "ERROR", f"HTTP {st}", "nuget")
    return nuget_licence(body.decode("utf-8", "replace"))


def lookup_crates(f, name):
    st, d = _get_json(f, CRATES + urllib.parse.quote(name, safe=""))
    if st == 404:
        return licence_fact(None, "NOT_FOUND", None, "cargo")
    if d is None:
        return licence_fact(None, "ERROR", f"HTTP {st}", "cargo")
    return crates_licence(d)


def hf_space_licences(f, url=HF_SPACES_LICENCE, max_pages=100):
    """One re-walk of the frame's HF listing with cardData. -> ({space id: fact}, read_state)."""
    out, pages, state = {}, 0, "EXHAUSTED"
    while url and pages < max_pages:
        st, h, body = f.get(url)
        pages += 1
        if st != 200:
            state = f"PARTIAL (HTTP {st} on page {pages})"
            break
        try:
            rows = json.loads(body)
        except ValueError:
            state = f"PARTIAL (page {pages} not JSON)"
            break
        for r in rows:
            lic = (r.get("cardData") or {}).get("license")
            if isinstance(lic, list):
                lic = " AND ".join(str(x) for x in lic) if lic else None
            fct = normalise(lic, "hf-card") if lic else licence_fact(None, "MISSING", None, "hf-card")
            if lic and str(lic).lower() == "other":
                fct = licence_fact(None, "UNRECOGNISED", lic, "hf-card")
            out[r.get("id")] = fct
        m = re.search(r"<([^>]+)>;\s*rel=\"next\"", h.get("link") or "")
        url = m.group(1) if m else None
    if url:
        state = "PARTIAL (page cap)"
    return out, {"read_state": state, "pages": pages, "spaces": len(out)}


def github_sample(f, repos, n, seed):
    """Seeded sample of <= n repositories through the keyless licence API. Stops on the rate limit."""
    pool = sorted(set(r for r in repos if r))
    pick = random.Random(seed).sample(pool, min(n, len(pool)))
    res, state = {}, "COMPLETE"
    for r in pick:
        st, h, body = f.get(GITHUB_API + r + "/license", accept="application/vnd.github+json")
        rem = h.get("x-ratelimit-remaining")
        if st == 200:
            d = json.loads(body)
            sid = ((d.get("license") or {}).get("spdx_id"))
            if sid and sid != "NOASSERTION":
                res[r] = normalise(sid, "github")
            else:
                res[r] = licence_fact(None, "UNRECOGNISED", "NOASSERTION (licence file present, not matched)",
                                      "github")
        elif st == 404:
            res[r] = licence_fact(None, "NOT_FOUND", "404: no licence file detected, or repository not public",
                                  "github")
        elif st in (403, 429) and rem == "0":
            state = f"PARTIAL (rate limit after {len(res)} of {len(pick)})"
            break
        else:
            res[r] = licence_fact(None, "ERROR", f"HTTP {st}", "github")
        if rem == "0":
            state = f"PARTIAL (rate limit after {len(res)} of {len(pick)})"
            break
    return pick, res, state


# ---- OCI labels (sample)
OCI_ACCEPT = ", ".join((
    "application/vnd.oci.image.index.v1+json", "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.oci.image.manifest.v1+json", "application/vnd.docker.distribution.manifest.v2+json"))


class _StripAuthRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        new = super().redirect_request(req, fp, code, msg, headers, newurl)
        if new is not None and urllib.parse.urlsplit(newurl).netloc != urllib.parse.urlsplit(req.full_url).netloc:
            new.remove_header("Authorization")
        return new


_OPENER = urllib.request.build_opener(_StripAuthRedirect())


def oci_transport(url, headers, timeout, method="GET"):
    req = urllib.request.Request(url, headers=headers, method=method)
    try:
        with _OPENER.open(req, timeout=timeout) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in (e.headers or {}).items()}, b""


def parse_oci(ident):
    s = ident.strip()
    ref = None
    if "@" in s:
        s, ref = s.split("@", 1)
    parts = s.split("/")
    if len(parts) > 1 and ("." in parts[0] or ":" in parts[0] or parts[0] == "localhost"):
        reg, rest = parts[0], "/".join(parts[1:])
    else:
        reg, rest = "docker.io", s
    last = rest.rsplit("/", 1)[-1]
    tag = "latest"
    if ":" in last:
        rest, tag = rest.rsplit(":", 1)
    if reg in ("docker.io", "index.docker.io", "registry-1.docker.io"):
        reg = "docker.io"
        if "/" not in rest:
            rest = "library/" + rest
    return reg, rest.lower(), ref or tag


def oci_label(ident, transport=oci_transport):
    reg, repo, ref = parse_oci(ident)
    if reg == "docker.io":
        tok_url = f"https://auth.docker.io/token?service=registry.docker.io&scope=repository:{repo}:pull"
        api = "https://registry-1.docker.io"
    elif reg == "ghcr.io":
        tok_url, api = f"https://ghcr.io/token?scope=repository:{repo}:pull", "https://ghcr.io"
    else:
        return {"registry": reg, "status": "skipped: registry not supported by the sampler"}
    st, _h, body = transport(tok_url, {"User-Agent": UA}, 30)
    if st != 200:
        return {"registry": reg, "status": f"token HTTP {st}"}
    hdr = {"User-Agent": UA, "Authorization": "Bearer " + json.loads(body)["token"], "Accept": OCI_ACCEPT}
    st, _h, body = transport(f"{api}/v2/{repo}/manifests/{ref}", hdr, 30)
    if st != 200:
        return {"registry": reg, "status": f"manifest HTTP {st}"}
    m = json.loads(body)
    if "manifests" in m:
        ms = m["manifests"]
        pick = next((x for x in ms if (x.get("platform") or {}).get("os") == "linux"
                     and (x.get("platform") or {}).get("architecture") == "amd64"), ms[0] if ms else None)
        if not pick:
            return {"registry": reg, "status": "empty index"}
        st, _h, body = transport(f"{api}/v2/{repo}/manifests/{pick['digest']}", hdr, 30)
        if st != 200:
            return {"registry": reg, "status": f"platform manifest HTTP {st}"}
        m = json.loads(body)
    cfg = (m.get("config") or {}).get("digest")
    if not cfg:
        return {"registry": reg, "status": "no config digest"}
    st, _h, body = transport(f"{api}/v2/{repo}/blobs/{cfg}", hdr, 60)
    if st != 200:
        return {"registry": reg, "status": f"config HTTP {st}"}
    labels = (json.loads(body).get("config") or {}).get("Labels") or {}
    lic = labels.get("org.opencontainers.image.licenses")
    return {"registry": reg, "status": "ok", "label": lic,
            "fact": normalise(lic, "oci-label") if lic else licence_fact(None, "MISSING", None, "oci-label")}


def dockerhub_remaining(transport=oci_transport):
    """Anonymous Docker Hub pulls left (HEAD on the documented preview repo does not count)."""
    try:
        st, _h, body = transport("https://auth.docker.io/token?service=registry.docker.io"
                                 "&scope=repository:ratelimitpreview/test:pull", {"User-Agent": UA}, 30)
        tok = json.loads(body)["token"]
        st, h, _b = transport("https://registry-1.docker.io/v2/ratelimitpreview/test/manifests/latest",
                              {"User-Agent": UA, "Authorization": "Bearer " + tok, "Accept": OCI_ACCEPT}, 30,
                              method="HEAD")
        rem = h.get("ratelimit-remaining")
        return int(rem.split(";")[0]) if rem else None
    except Exception:
        return None


# ================================================================ catalogue terms
CATALOGUE_TERMS = {
    "mcp-registry": {
        "catalogue": "Official MCP Registry (registry.modelcontextprotocol.io)",
        "access": "anonymous public API, cursor pagination; the frame read it to exhaustion keylessly",
        "data_licence_stated_in_responses": None,
        "constraints_observed": [],
        "listing_text_note": "server descriptions are publisher-written; no data licence was stated in the "
                             "API responses read, so republishing listing text beyond facts (URL, state) is "
                             "not cleared by this gate",
    },
    "hf-spaces": {
        "catalogue": "Hugging Face Hub Spaces listing (filter=mcp-server)",
        "access": "anonymous public API; Link rel=next pagination",
        "terms_url": "https://huggingface.co/terms-of-service",
        "constraints_observed": ["per-Space licence lives in the Space card (cardData.license); read by this gate",
                                 "private Spaces are excluded from MEASURE_PUBLIC"],
    },
    "a2aregistry": {
        "catalogue": "a2aregistry.org",
        "access": "anonymous public API; declared total honoured",
        "data_licence_stated_in_responses": None,
        "constraints_observed": ["agent cards carry no licence field; code licence is UNKNOWN by construction"],
    },
    "docker-mcp-registry": {
        "catalogue": "docker/mcp-registry (GitHub repository)",
        "access": "one tarball of a pinned commit, kept by the frame",
        "constraints_observed": ["catalogue repository licence read from the LICENSE file in the frame's tarball"],
    },
    "smithery": {
        "catalogue": "Smithery registry (registry.smithery.ai)",
        "access": "anonymous API",
        "constraints_observed": [
            "anonymous API served 5 pages x 100 (264 distinct of a declared 17,186); reading further needs an "
            "API key (frame summary, read_state PARTIAL)",
            "the listing carries no endpoint URL and no licence field"],
        "terms_read_by_this_run": False,
    },
    "glama": {
        "catalogue": "Glama MCP directory",
        "in_this_frame": False,
        "constraints_observed": [],
        "constraints_from_brief_unverified": ["requires attribution when its listing data is reused "
                                              "(from the lane brief; not verified against Glama's published "
                                              "terms by this run)"],
    },
}


# ================================================================ run
def run(frame_dir, out, github_n=50, oci_n=40, seed=20260925, transport=None, oci_tx=None,
        workers=None, intervals=None, log=print):
    os.makedirs(os.path.join(out, "cache"), exist_ok=True)
    started = utcnow()
    workers = workers or {"npm": 3, "pypi": 2, "nuget": 1, "cargo": 1}
    intervals = intervals or {"npm": 0.3, "pypi": 0.4, "nuget": 0.5, "cargo": 1.0, "hf": 1.0, "github": 1.0}
    tx = transport or frame.urllib_transport
    sleep = (lambda s: None) if transport else None

    def mk(kind):
        kw = {"transport": tx, "min_interval": intervals[kind] if not transport else 0}
        if sleep:
            kw["sleep"] = sleep
        return lambda: Fetcher(**kw)

    log(f"[{utcnow()}] reading subjects")
    subs = list(subjects(frame_dir))
    want = collections.defaultdict(set)
    for s in subs:
        for t, i, v in s["packages"]:
            if t == "npm":
                want["npm"].add(i)
            elif t == "pypi":
                want["pypi"].add(pep503(i))
            elif t == "nuget":
                want["nuget"].add(f"{i}@@{v or ''}")
            elif t == "cargo":
                want["cargo"].add(i)
    log(f"[{utcnow()}] subjects={len(subs)} " + " ".join(f"{k}={len(v)}" for k, v in sorted(want.items())))

    lock = threading.Lock()
    caches = {}
    fns = {"npm": lookup_npm, "pypi": lookup_pypi, "nuget": lookup_nuget, "cargo": lookup_crates}
    threads = []
    for kind, fn in fns.items():
        cp = os.path.join(out, "cache", f"{kind}.json")
        caches[kind] = _load(cp) if os.path.exists(cp) else {}
        t = threading.Thread(target=_pool, daemon=True, args=(
            want[kind], fn, workers[kind], mk(kind), caches[kind], cp, lock,
            (lambda d, n, k=kind: log(f"[{utcnow()}] {k} {d}/{n}"))))
        threads.append(t)
        t.start()

    # HF card licences and the GitHub sample run beside the registry pool (different hosts)
    hf_cp = os.path.join(out, "cache", "hf.json")
    if os.path.exists(hf_cp):
        hf, hf_read = _load(hf_cp)
    else:
        hf, hf_read = hf_space_licences(mk("hf")())
        _dump([hf, hf_read], hf_cp)
    log(f"[{utcnow()}] hf {hf_read}")

    gh_cp = os.path.join(out, "cache", "github.json")
    repos = [github_repo(s["repo"]) for s in subs]
    if os.path.exists(gh_cp):
        gh_pick, gh, gh_state = _load(gh_cp)
    else:
        gh_pick, gh, gh_state = github_sample(mk("github")(), repos, github_n, seed)
        _dump([gh_pick, gh, gh_state], gh_cp)
    log(f"[{utcnow()}] github sample {len(gh)}/{len(gh_pick)} {gh_state}")

    oci_cp = os.path.join(out, "cache", "oci.json")
    if os.path.exists(oci_cp):
        oci_res, oci_meta = _load(oci_cp)
    else:
        oci_res, oci_meta = oci_sample(subs, oci_n, seed, oci_tx or (oci_transport if not transport else None))
        _dump([oci_res, oci_meta], oci_cp)
    log(f"[{utcnow()}] oci sample {oci_meta}")

    for t in threads:
        t.join()
    log(f"[{utcnow()}] registry lookups done")

    # docker catalogue licence (bytes the frame kept)
    _d, cat_licence_text = docker_index(frame_dir)
    terms = json.loads(json.dumps(CATALOGUE_TERMS))
    if cat_licence_text:
        f = normalise(cat_licence_text, "catalogue-LICENSE")
        terms["docker-mcp-registry"]["repository_licence"] = f["spdx"] or f["status"]
        terms["docker-mcp-registry"]["repository_licence_sha256"] = hashlib.sha256(
            cat_licence_text.encode()).hexdigest()

    # ---- decide
    by = collections.defaultdict(collections.Counter)
    per_source = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    reasons = collections.defaultdict(collections.Counter)
    subj_spdx, subj_cat, evidence_kinds = collections.Counter(), collections.Counter(), collections.Counter()
    gh_changed = 0
    dec_path = os.path.join(out, "decisions.jsonl.gz")
    with gzip.open(dec_path + ".tmp", "wt") as fh:
        for s in subs:
            facts = []
            for t, i, v in s["packages"]:
                key = {"npm": i, "pypi": pep503(i),
                       "nuget": f"{i}@@{v or ''}", "cargo": i}.get(t)
                if t in caches and key in caches[t]:
                    fct = dict(caches[t][key])
                    fct["package"] = f"{t}:{i}"
                    facts.append(fct)
                elif t == "oci" and i in oci_res and oci_res[i].get("fact"):
                    fct = dict(oci_res[i]["fact"])
                    fct["package"] = f"oci:{i}"
                    facts.append(fct)
            if s.get("hf_space") and s["hf_space"] in hf:
                facts.append(dict(hf[s["hf_space"]], package=f"hf-space:{s['hf_space']}"))
            base_gates, base_eff = licence_gates(facts)
            rp = github_repo(s["repo"])
            if rp and rp in gh:
                facts.append(dict(gh[rp], package=f"github:{rp}"))
            gates, eff = licence_gates(facts)
            if rp and rp in gh and gates["REUSE_CODE"]["state"] != base_gates["REUSE_CODE"]["state"]:
                gh_changed += 1
            gates["MEASURE_PUBLIC"] = measure_gate(s["endpoints"], s["private"])
            for p in PURPOSES:
                by[p][gates[p]["state"]] += 1
                per_source[s["source"]][p][gates[p]["state"]] += 1
                reasons[p][f"{gates[p]['state']}: {_reason_key(gates[p]['reason'])}"] += 1
            subj_spdx[eff["spdx"] or "(no licence read)"] += 1
            subj_cat[eff["category"] or "unknown"] += 1
            for k in sorted({f["source"] for f in facts if f.get("category")}) or ["none"]:
                evidence_kinds[k] += 1
            fh.write(json.dumps({"source": s["source"], "id": s["id"], "order": s["order"],
                                 "repo": s["repo"], "packages": [f"{t}:{i}" for t, i, _v in s["packages"]],
                                 "licence_evidence": facts, "effective_licence": eff,
                                 "catalogue_terms": s["source"],
                                 "gates": {p: gates[p] for p in PURPOSES}}, sort_keys=True) + "\n")
    os.replace(dec_path + ".tmp", dec_path)

    n = len(subs)
    pkg_spdx = {}
    for kind in fns:
        c = collections.Counter()
        for k in want[kind]:
            fct = caches[kind].get(k)
            c[(fct["spdx"] or f"({fct['status']})") if fct else "(not looked up)"] += 1
        pkg_spdx[kind] = dict(c.most_common())
    with gzip.open(os.path.join(out, "package-licences.jsonl.gz"), "wt") as fh:
        for kind in fns:
            for k in sorted(caches[kind]):
                fh.write(json.dumps({"registry": kind, "package": k.split("@@")[0], **caches[kind][k]},
                                    sort_keys=True) + "\n")

    # GitHub sample vs the registries' declared licences for the same subjects
    agree = collections.Counter()
    disagree = []
    decl = {}
    for s in subs:
        rp = github_repo(s["repo"])
        if rp in gh:
            for t, i, v in s["packages"]:
                key = {"npm": i, "pypi": pep503(i)}.get(t)
                if t in ("npm", "pypi") and key in caches[t] and caches[t][key].get("spdx"):
                    decl.setdefault(rp, set()).add(caches[t][key]["spdx"])
    for rp, fct in gh.items():
        if rp not in decl:
            agree["no registry-declared licence to compare"] += 1
        elif not fct.get("spdx"):
            agree["github gave no licence id"] += 1
        elif fct["spdx"] in decl[rp]:
            agree["agree"] += 1
        else:
            agree["disagree"] += 1
            disagree.append({"repo": rp, "github": fct["spdx"], "registry": sorted(decl[rp])})

    unk = {p: {"unknown": by[p][UNKNOWN], "n": n, "share": round(by[p][UNKNOWN] / n, 4) if n else None}
           for p in PURPOSES}
    frame_summary = _load(os.path.join(frame_dir, "summary.json"))
    summary = {
        "schema": SCHEMA, "run_started": started, "run_finished": utcnow(),
        "frame": {"dir": frame_dir, "run_started": frame_summary.get("run_started"),
                  "files": frame_summary.get("files"),
                  "read_states": {k: v.get("read_state") for k, v in frame_summary.get("sources", {}).items()}},
        "what_a_row_is": "one catalogue row of the frame (entries.jsonl.gz), with a decision per purpose",
        "n_subjects": n,
        "population_total": None,
        "population_total_null_because": "the frame's union total is null (smithery PARTIAL); counts are over "
                                         "the rows the frame read",
        "decisions": {p: dict(sorted(by[p].items())) for p in PURPOSES},
        "unknown_share": unk,
        "decision_reasons": {p: dict(reasons[p].most_common()) for p in PURPOSES},
        "decisions_by_source": {src: {p: dict(sorted(c.items())) for p, c in d.items()}
                                for src, d in sorted(per_source.items())},
        "effective_licence_by_spdx_subjects": dict(subj_spdx.most_common()),
        "effective_licence_by_category_subjects": dict(subj_cat.most_common()),
        "subjects_by_licence_evidence_kind": dict(evidence_kinds.most_common()),
        "packages_by_spdx": pkg_spdx,
        "packages_looked_up": {k: len(want[k]) for k in fns},
        "package_lookup_status": {k: dict(collections.Counter(v["status"] for v in caches[k].values()))
                                  for k in fns},
        "hf_space_cards": {**hf_read, "by_spdx": dict(collections.Counter(
            (v["spdx"] or f"({v['status']})") for v in hf.values()).most_common())},
        "github_sample": {"n_requested": github_n, "seed": seed, "picked": len(gh_pick), "read": len(gh),
                          "read_state": gh_state, "pool": len({r for r in repos if r}),
                          "by_spdx": dict(collections.Counter((v["spdx"] or f"({v['status']})")
                                                              for v in gh.values()).most_common()),
                          "vs_registry_declared": dict(agree), "disagreements": disagree,
                          "subjects_whose_REUSE_state_github_changed": gh_changed},
        "oci_label_sample": oci_meta,
        "catalogue_terms": terms,
        "rules": {
            "MEASURE_PUBLIC": "ALLOWED for a non-templated endpoint on a public address in a public listing; "
                              "licence-independent",
            "REUSE_CODE/VENDOR/TRAIN": "from the most restrictive licence category among the evidence; "
                                       "UNKNOWN when no licence was read, and UNKNOWN is never ALLOWED",
            "non_commercial": "RESTRICTED for REUSE_CODE, VENDOR and TRAIN (e.g. CC-BY-NC-4.0)",
            "not_legal_advice": "a declared-licence policy gate; formal positions need counsel",
        },
        "normalisation_notes": [
            "PyPI 'Apache Software License' classifier carries no version; counted as Apache-2.0",
            "npm 'UNLICENSED' = not licensed (proprietary), distinct from 'Unlicense'",
            "several PyPI License classifiers are read as all applying (AND)",
            "an SPDX id absent from the gate's category table is UNRECOGNISED -> UNKNOWN",
        ],
        "files": {},
    }
    for fn_ in ("decisions.jsonl.gz", "package-licences.jsonl.gz"):
        summary["files"][fn_] = _sha(os.path.join(out, fn_))
    with open(os.path.join(out, "summary.json"), "w") as fh:
        json.dump(summary, fh, indent=1, sort_keys=False)
    return summary


def _load(p):
    with open(p) as fh:
        return json.load(fh)


def _dump(obj, p):
    with open(p + ".tmp", "w") as fh:
        json.dump(obj, fh, sort_keys=True)
    os.replace(p + ".tmp", p)


def _reason_key(reason):
    return re.sub(r"\([^)]*\)", "(..)", reason.split(";")[0])[:90]


def _sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for b in iter(lambda: fh.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def oci_sample(subs, n, seed, tx):
    idents = sorted({i for s in subs for t, i, _v in s["packages"] if t == "oci"})
    meta = {"pool": len(idents), "n_requested": n, "seed": seed}
    if not tx or n <= 0:
        meta["read_state"] = "NOT_RUN"
        return {}, meta
    by_reg = collections.defaultdict(list)
    for i in idents:
        by_reg[parse_oci(i)[0]].append(i)
    rng = random.Random(seed)
    dh_left = dockerhub_remaining(tx)
    meta["dockerhub_anonymous_remaining_at_start"] = dh_left
    # Docker Hub counts every manifest GET against a small anonymous allowance shared by this IP:
    # take at most 6, and never more than a third of what is left.
    dh_cap = 0 if dh_left is None else max(0, min(6, dh_left // 3, n))
    dh_pool, gh_pool = by_reg.get("docker.io", []), by_reg.get("ghcr.io", [])
    dh_picks = rng.sample(dh_pool, min(dh_cap, len(dh_pool)))
    gh_picks = rng.sample(gh_pool, min(max(0, n - len(dh_picks)), len(gh_pool)))
    picks = dh_picks + gh_picks
    res = {}
    for i in picks:
        try:
            res[i] = oci_label(i, tx)
        except Exception as e:
            res[i] = {"status": f"error: {type(e).__name__}"}
    meta.update({"read_state": "SAMPLE", "picked": {"docker.io": len(dh_picks), "ghcr.io": len(gh_picks)},
                 "pool_by_registry": {k: len(v) for k, v in sorted(by_reg.items())},
                 "status": dict(collections.Counter(r.get("status") for r in res.values())),
                 "with_licence_label": sum(1 for r in res.values() if r.get("label")),
                 "labels_by_spdx": dict(collections.Counter(
                     (r["fact"]["spdx"] or f"({r['fact']['status']})") for r in res.values()
                     if r.get("fact")).most_common())})
    return res, meta


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--frame")
    ap.add_argument("--out")
    ap.add_argument("--github-sample", type=int, default=50)
    ap.add_argument("--oci-sample", type=int, default=40)
    ap.add_argument("--seed", type=int, default=20260925)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        import unittest
        suite = unittest.defaultTestLoader.discover(HERE, pattern="test_rights_gate.py")
        return 0 if unittest.TextTestRunner(verbosity=1).run(suite).wasSuccessful() else 1
    if not (a.frame and a.out):
        ap.error("--frame DIR --out DIR, or --self-test")
    if a.github_sample > 50:
        ap.error("the GitHub pass is a sample of at most 50 (keyless API: 60 requests an hour)")
    s = run(a.frame, a.out, github_n=a.github_sample, oci_n=a.oci_sample, seed=a.seed,
            log=lambda m: print(m, flush=True))
    print(json.dumps({k: s[k] for k in ("n_subjects", "decisions", "unknown_share")}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
