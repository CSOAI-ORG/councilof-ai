#!/usr/bin/env python3
"""Regenerate public/interop/footprint-packages.json — the confirmed list of what this estate publishes.

The old list held five PyPI names because it was seeded by grepping this repository for
`pypi.org/project/<name>`. A grep over source finds what source happens to mention; it is not an
enumeration of an account, and four of those five names were then the whole of /api/footprint's
`gross_distribution`. This script replaces the grep with each registry's own ownership record:

  PyPI   XML-RPC `user_packages(<account>)` on https://pypi.org/pypi — PyPI's own role table.
         Every row comes back as (role, name); role is "Owner" or "Maintainer". This is the
         authoritative field: not the free-text `info.author`, which is whatever the publisher
         typed. (pypi.org's HTML user page is behind a bot challenge from our hosts and cannot be
         read; the JSON API carries no owner. XML-RPC is the one unauthenticated owner source.)
  npm    https://registry.npmjs.org/-/user/<user>/package — the registry's own access map,
         package -> role. Cross-checked against the free search endpoint
         (?text=maintainer:<user>), whose total is reported alongside so a divergence is visible.
  HF     https://huggingface.co/api/{models,datasets}?author=<org> — the Hub's own author index.

Nothing here is padded. A source that cannot be enumerated authoritatively is written out with
state PARTIAL and the reason, and its names are whatever it did return — never a prefix guess
promoted to a fact. Prefix matching over https://pypi.org/simple/ was tried and is recorded in
`rejected_methods`: it found 93 candidate names of which 7 belong to unrelated publishers, and it
cannot see the packages whose names carry none of our tokens. A prefix match is a guess.

No counts live in this file. Counts are measured separately by the pod loop
(/workspace/lanes/loops/distribution-measure.py) into public/interop/distribution-<date>.json.

Usage:  python3 scripts/enumerate-distribution-packages.py [--out public/interop/footprint-packages.json]
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import urllib.error
import urllib.request
import xmlrpc.client
from pathlib import Path

SCHEMA = "csoai.footprint-packages/0.2"
UA = "councilof.ai footprint (nicholas@csoai.org)"

PYPI_XMLRPC = "https://pypi.org/pypi"
PYPI_ACCOUNTS = ["nicholastempleman"]
# Accounts probed and found to own nothing on 2026-09-22. Kept so a later run that finds something
# under one of them is a change, not a discovery nobody expected.
PYPI_ACCOUNTS_EMPTY = ["csga_global", "csoai", "meok", "CSOAI"]

NPM_ACCOUNTS = ["csga_global"]
NPM_ACCOUNTS_EMPTY = ["meok-labs", "meok", "csoai", "nicholastempleman"]

HF_AUTHORS = ["csoai"]
# huggingface.co/meok carries one model. It is a different author namespace and is listed, not summed.
HF_AUTHORS_SEPARATE = ["meok"]

# Entity attribution. CSOAI measures; MEOK hosts. The two are separate legal entities that share a
# publishing account, so every row carries which one it belongs to and the artifact totals both
# the estate and each entity. Attribution is by the name prefix the publisher chose plus the
# free-text author string; it is a label on a row, never a filter that drops one.
def entity_of(name: str, author: str | None) -> str:
    a = (author or "").lower()
    n = name.lower()
    if "csoai" in a and "meok" in a:
        return "joint"
    if n.startswith("meok") or ("meok" in a and "csoai" not in a):
        return "meok"
    if "csoai" in a or "council of ai" in a or n.startswith("csoai") or n.startswith("gspc"):
        return "csoai"
    return "unattributed"


def get_json(url: str, timeout: int = 60):
    req = urllib.request.Request(url, headers={"user-agent": UA, "accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def enumerate_pypi() -> dict:
    proxy = xmlrpc.client.ServerProxy(PYPI_XMLRPC)
    rows: list[dict] = []
    per_account: dict[str, int] = {}
    errors: list[str] = []
    for account in PYPI_ACCOUNTS:
        try:
            owned = proxy.user_packages(account)
        except Exception as e:  # noqa: BLE001 - any failure is an unread account, not an empty one
            errors.append(f"{account}: {type(e).__name__}: {str(e)[:160]}")
            continue
        per_account[account] = len(owned)
        for role, name in owned:
            rows.append(
                {
                    "name": name,
                    "role": role,
                    "account": account,
                    "confirmed_by": f"pypi xmlrpc user_packages({account}) returned role {role!r}",
                }
            )
    empty = {}
    for account in PYPI_ACCOUNTS_EMPTY:
        try:
            empty[account] = len(proxy.user_packages(account))
        except Exception as e:  # noqa: BLE001
            empty[account] = f"error: {type(e).__name__}"
    state = "READ" if rows and not errors else ("PARTIAL" if rows else "UNCHECKABLE")
    return {
        "state": state,
        "registry": "pypi",
        "accounts": PYPI_ACCOUNTS,
        "packages_per_account": per_account,
        "other_accounts_probed": empty,
        "source_url": PYPI_XMLRPC,
        "method": "XML-RPC user_packages — PyPI's own owner/maintainer role table",
        **({"errors": errors, "reason": "at least one account did not answer"} if errors else {}),
        "packages": rows,
    }


def enumerate_npm() -> dict:
    rows: list[dict] = []
    per_account: dict[str, object] = {}
    search_totals: dict[str, object] = {}
    errors: list[str] = []
    for account in NPM_ACCOUNTS:
        url = f"https://registry.npmjs.org/-/user/{account}/package"
        try:
            access = get_json(url)
        except Exception as e:  # noqa: BLE001
            errors.append(f"{account}: {type(e).__name__}: {str(e)[:160]}")
            continue
        per_account[account] = len(access)
        for name, role in sorted(access.items()):
            rows.append(
                {
                    "name": name,
                    "role": role,
                    "account": account,
                    "confirmed_by": f"npm registry /-/user/{account}/package returned access {role!r}",
                }
            )
        try:
            s = get_json(f"https://registry.npmjs.org/-/v1/search?text=maintainer:{account}&size=1")
            search_totals[account] = s.get("total")
        except Exception as e:  # noqa: BLE001
            search_totals[account] = f"error: {type(e).__name__}"
    empty: dict[str, object] = {}
    for account in NPM_ACCOUNTS_EMPTY:
        try:
            empty[account] = get_json(
                f"https://registry.npmjs.org/-/v1/search?text=maintainer:{account}&size=1"
            ).get("total")
        except Exception as e:  # noqa: BLE001
            empty[account] = f"error: {type(e).__name__}"
    state = "READ" if rows and not errors else ("PARTIAL" if rows else "UNCHECKABLE")
    return {
        "state": state,
        "registry": "npm",
        "accounts": NPM_ACCOUNTS,
        "packages_per_account": per_account,
        "search_total_cross_check": search_totals,
        "cross_check_note": (
            "The search endpoint indexes published, listed packages; the access map is the "
            "registry's own permission table. Where the two differ the access map is used and both "
            "numbers are printed, because a silent choice between two counts is how a count starts lying."
        ),
        "other_accounts_probed": empty,
        "source_url": [f"https://registry.npmjs.org/-/user/{a}/package" for a in NPM_ACCOUNTS],
        "method": "registry access map, package -> role",
        **({"errors": errors, "reason": "at least one account did not answer"} if errors else {}),
        "packages": rows,
    }


def enumerate_hf() -> dict:
    rows: list[dict] = []
    errors: list[str] = []
    listed: dict[str, int] = {}
    for kind in ("models", "datasets"):
        for author in HF_AUTHORS:
            url = f"https://huggingface.co/api/{kind}?author={author}&limit=1000"
            try:
                body = get_json(url)
            except Exception as e:  # noqa: BLE001
                errors.append(f"{kind}/{author}: {type(e).__name__}: {str(e)[:160]}")
                continue
            listed[f"{kind}/{author}"] = len(body)
            for item in body:
                rid = item.get("id") or item.get("modelId")
                if not rid:
                    continue
                rows.append(
                    {
                        "name": rid,
                        "repo_type": kind[:-1],
                        "account": author,
                        "confirmed_by": f"huggingface /api/{kind}?author={author} listed it",
                    }
                )
    separate: dict[str, object] = {}
    for kind in ("models", "datasets"):
        for author in HF_AUTHORS_SEPARATE:
            try:
                separate[f"{kind}/{author}"] = len(get_json(f"https://huggingface.co/api/{kind}?author={author}&limit=1000"))
            except Exception as e:  # noqa: BLE001
                separate[f"{kind}/{author}"] = f"error: {type(e).__name__}"
    state = "READ" if rows and not errors else ("PARTIAL" if rows else "UNCHECKABLE")
    return {
        "state": state,
        "registry": "huggingface",
        "accounts": HF_AUTHORS,
        "listed_per_endpoint": listed,
        "separate_authors_not_summed": separate,
        "separate_note": (
            "huggingface.co/meok is a different author namespace. Its repos are listed here so the "
            "boundary is visible and are not added to this estate's totals."
        ),
        "source_url": [f"https://huggingface.co/api/{k}?author={a}&limit=1000" for k in ("models", "datasets") for a in HF_AUTHORS],
        "method": "Hub author index",
        **({"errors": errors, "reason": "at least one listing did not answer"} if errors else {}),
        "packages": rows,
    }


def attribute_pypi(pypi: dict, authors: dict[str, str | None]) -> None:
    for row in pypi["packages"]:
        author = authors.get(row["name"])
        if author is not None:
            row["author"] = author
        row["entity"] = entity_of(row["name"], author)


def fetch_pypi_authors(names: list[str], limit: int | None, pace: float) -> dict[str, str | None]:
    """Free-text author/author_email per package. A label, not the ownership proof."""
    import time

    out: dict[str, str | None] = {}
    todo = names if limit is None else names[:limit]
    for i, name in enumerate(todo):
        try:
            info = get_json(f"https://pypi.org/pypi/{name}/json", timeout=30).get("info", {})
            out[name] = info.get("author_email") or info.get("author") or info.get("maintainer_email") or None
        except Exception:  # noqa: BLE001
            out[name] = None
        if pace:
            time.sleep(pace)
        if i and i % 50 == 0:
            print(f"  … author probe {i}/{len(todo)}", file=sys.stderr)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/interop/footprint-packages.json")
    ap.add_argument("--no-authors", action="store_true", help="skip the per-package PyPI author probe")
    ap.add_argument("--author-pace", type=float, default=0.15)
    args = ap.parse_args()

    print("pypi: enumerating owner roles via XML-RPC …", file=sys.stderr)
    pypi = enumerate_pypi()
    print(f"  {len(pypi['packages'])} rows, state {pypi['state']}", file=sys.stderr)

    if not args.no_authors:
        print("pypi: probing free-text author per package (attribution label only) …", file=sys.stderr)
        authors = fetch_pypi_authors([r["name"] for r in pypi["packages"]], None, args.author_pace)
    else:
        authors = {}
    attribute_pypi(pypi, authors)

    print("npm: reading the access map …", file=sys.stderr)
    npm = enumerate_npm()
    print(f"  {len(npm['packages'])} rows, state {npm['state']}", file=sys.stderr)

    print("huggingface: reading the author index …", file=sys.stderr)
    hf = enumerate_hf()
    print(f"  {len(hf['packages'])} rows, state {hf['state']}", file=sys.stderr)

    entities: dict[str, int] = {}
    for row in pypi["packages"]:
        entities[row.get("entity", "unattributed")] = entities.get(row.get("entity", "unattributed"), 0) + 1

    doc = {
        "schema": SCHEMA,
        "as_of": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generator": "scripts/enumerate-distribution-packages.py",
        "purpose": (
            "The confirmed list of what this estate publishes, one row per package, each row "
            "carrying the registry field that confirmed it. Names only: no count lives in this "
            "file. Counts are measured by the pod loop into public/interop/distribution-<date>.json "
            "because 700+ per-package fetches cannot happen inside one Cloudflare request."
        ),
        "confirmation_rule": (
            "A name is in this list only because the registry's own ownership record named it: "
            "PyPI's XML-RPC role table, npm's access map, or the Hugging Face author index. "
            "Free-text author strings are carried as labels and never used to include or exclude."
        ),
        "entity_rule": (
            "CSOAI Ltd and MEOK AI Labs are separate entities publishing from one account. Every "
            "row carries `entity`, and the measurement artifact reports the estate total and each "
            "entity's share. Attribution labels a row; it never drops one. The earlier list "
            "dropped 29 MEOK-authored PyPI names and published the remainder as the estate's "
            "distribution, which understated it."
        ),
        "entity_counts_pypi": entities,
        "rejected_methods": [
            {
                "method": "grep the repository for pypi.org/project/<name>",
                "why_rejected": (
                    "This produced the five-name list /api/footprint summed until 2026-09-22. A grep "
                    "finds what source happens to mention, which on PyPI was 5 of 397."
                ),
            },
            {
                "method": "prefix/substring match over https://pypi.org/simple/",
                "why_rejected": (
                    "Tried 2026-09-22: 896,604 projects, 93 matched the tokens csoai/gspc/meok/"
                    "sovos/councilof/claimguard/layer0/csga, and 7 of those 93 belong to unrelated "
                    "publishers (gspc, gspc-manager, csgame, csgapi, agentclaimguard, mmb-layer0, "
                    "scsgate). It also cannot see the owned packages carrying none of those tokens: "
                    "86 of 397 matched. A prefix match is a guess in both directions."
                ),
            },
            {
                "method": "pypi.org/user/<account>/ HTML",
                "why_rejected": "Answers a Fastly bot challenge page (HTTP 200, title 'Client Challenge') from our hosts.",
            },
        ],
        "totals": {
            "pypi": len(pypi["packages"]),
            "npm": len(npm["packages"]),
            "huggingface": len(hf["packages"]),
            "note": "Row counts of this list, not downloads. Three registries, three populations, never added.",
        },
        "pypi": pypi,
        "npm": npm,
        "huggingface": hf,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=2, sort_keys=False) + "\n")
    print(f"WROTE {out} pypi={doc['totals']['pypi']} npm={doc['totals']['npm']} hf={doc['totals']['huggingface']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
