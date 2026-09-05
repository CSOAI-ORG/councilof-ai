#!/usr/bin/env python3
"""org-readme.py — derive the CSOAI-ORG GitHub profile README, the top block of
councilof-ai/README.md, the personal-profile draft and the public repo inventory
from LIVE endpoints.

Nothing in the emitted markdown is typed. Every count is read at run time from:

  https://councilof.ai/api/gspc                 totals.lid verbatim, the 22-axis board
  https://councilof.ai/api/badge                the board image (200 image/svg+xml, or it is left out)
  https://councilof.ai/badge/board.svg          same — included only if it answers
  https://councilof.ai/root.json                merkle_root, card_count, as_of, sig
  https://councilof.ai/signed/card_index.json   n_cards (the signed-card chain)
  https://councilof.ai/api/hub-cards            third-party Hub cells (measured/unmeasured)
  https://councilof.ai/api/corrections          public corrections ledger + signature_state
  https://councilof.ai/api/revenue              one_number (distinct non-self x402 payers)
  https://councilof.ai/interop/root-witness-pointer.json   Rekor witness + drift
  https://councilof.ai/.well-known/agent.json   A2A agent card
  https://councilof.ai/.well-known/x402.json    x402 manifest (mode, network; never a price)
  https://csoai.org/.well-known/did.json        the pinned Ed25519 keys
  https://pypi.org/pypi/csoai-gspc/json         PyPI version + upload time
  https://registry.npmjs.org/csoai-gspc-mcp     npm version + publish time
  https://zenodo.org/api/records?q=conceptrecid:{21991104,22293340}   latest version under each concept DOI
  https://zenodo.org/api/records/22344048       the board-snapshot version DOI cited on 2026-09-05
  https://huggingface.co/api/{datasets,spaces,models}?author=csoai
  https://huggingface.co/datasets/csoai/gspc-board/resolve/main/snapshot/SNAPSHOT.json   HF read-back
  https://huggingface.co/api/spaces/csoai/gspc-board                                     Space read-back
  https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board                  Kaggle read-back
  https://raw.githubusercontent.com/CSOAI-ORG/gspc-board/main/SNAPSHOT.json              GitHub-mirror read-back

A fetch that fails is printed as UNCHECKABLE — never a fabricated 0. Every output
carries a `derived <ISO-8601>` stamp. Before anything is written the rendered text is
scanned for the words the estate does not use (certified, BFT, sovereign) and for a
price; a hit aborts the run.

Usage:
  org-readme.py --profile            > profile/README.md          (CSOAI-ORG/.github/profile — and the draft below)
  org-readme.py --personal OUT.md                                 (draft for the repo named after the login; never pushed by a lane)
  org-readme.py --councilof README.md                             (splice the top block in place)
  org-readme.py --inventory docs/github/ORG-INVENTORY-YYYY-MM-DD.md   (needs `gh`; probes homepages)
  org-readme.py --json                (dump the derived facts)

Doctrine: measurement, not certification. No prices anywhere in the output.
Brand: white ground, one green (#16a34a), the lid wordmark CS<strong>O</strong>AI, one badge row.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

UA = "csoai-org-readme/1.1 (+https://github.com/CSOAI-ORG/councilof-ai)"
TIMEOUT = 40
GREEN = "16a34a"       # the one green — the owner's word, 2026-09-05
OWNER = "CSOAI-ORG"
WORDMARK = "CS<strong>O</strong>AI"
UNCHECKABLE = "UNCHECKABLE"

URLS = {
    "gspc": "https://councilof.ai/api/gspc",
    "root": "https://councilof.ai/root.json",
    "card_index": "https://councilof.ai/signed/card_index.json",
    "hub": "https://councilof.ai/api/hub-cards",
    "corrections": "https://councilof.ai/api/corrections",
    "revenue": "https://councilof.ai/api/revenue",
    "witness": "https://councilof.ai/interop/root-witness-pointer.json",
    "agent": "https://councilof.ai/.well-known/agent.json",
    "x402": "https://councilof.ai/.well-known/x402.json",
    "did": "https://csoai.org/.well-known/did.json",
    "pypi": "https://pypi.org/pypi/csoai-gspc/json",
    "npm": "https://registry.npmjs.org/csoai-gspc-mcp",
    "zenodo_method_latest": "https://zenodo.org/api/records?q=conceptrecid:21991104&sort=mostrecent&size=1",
    "zenodo_snapshot_latest": "https://zenodo.org/api/records?q=conceptrecid:22293340&sort=mostrecent&size=1",
    "zenodo_snapshot_cited": "https://zenodo.org/api/records/22344048",
    "hf_datasets": "https://huggingface.co/api/datasets?author=csoai&limit=1000",
    "hf_spaces": "https://huggingface.co/api/spaces?author=csoai&limit=1000",
    "hf_models": "https://huggingface.co/api/models?author=csoai&limit=1000",
    "hf_board_dataset": "https://huggingface.co/api/datasets/csoai/gspc-board",
    "hf_board_snapshot": "https://huggingface.co/datasets/csoai/gspc-board/resolve/main/snapshot/SNAPSHOT.json",
    "hf_board_space": "https://huggingface.co/api/spaces/csoai/gspc-board",
    "gh_mirror_snapshot": "https://raw.githubusercontent.com/CSOAI-ORG/gspc-board/main/SNAPSHOT.json",
}
KAGGLE_URL = "https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board"
BADGE_CANDIDATES = ["https://councilof.ai/api/badge", "https://councilof.ai/badge/board.svg"]
ZENODO_METHOD_CONCEPT = "10.5281/zenodo.21991104"
ZENODO_SNAPSHOT_CONCEPT = "10.5281/zenodo.22293340"

# Words the estate does not use about itself, and a price. A rendered page containing one aborts the run.
BANNED = re.compile(r"\bcertified\b|\bBFT\b|\bByzantine\b|(?<![Ss]elf-)\b[Ss]overeign\b(?! Identity)|[£$€]\s?\d", re.I)


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch(url: str, accept: str = "*/*", timeout: int = TIMEOUT):
    """(status, content_type, body). status None = transport failure = UNCHECKABLE. Follows redirects."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, (r.headers.get("Content-Type") or ""), r.read()
    except urllib.error.HTTPError as e:
        return e.code, (e.headers.get("Content-Type") if e.headers else "") or "", b""
    except Exception as e:  # noqa: BLE001
        print(f"[org-readme] {url} -> {type(e).__name__}: {e}", file=sys.stderr)
        return None, "", b""


def fetch_json(url: str):
    """Parsed JSON or None. None means UNCHECKABLE, never 0."""
    st, _ct, body = fetch(url, accept="application/json")
    if st != 200:
        if st is not None:
            print(f"[org-readme] {url} -> HTTP {st}", file=sys.stderr)
        return None
    try:
        return json.loads(body.decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        print(f"[org-readme] {url} -> not JSON: {e}", file=sys.stderr)
        return None


def dig(obj, *path, default=None):
    cur = obj
    for p in path:
        if cur is None:
            return default
        if isinstance(p, int):
            if not isinstance(cur, list) or p >= len(cur) or p < -len(cur):
                return default
            cur = cur[p]
        else:
            if not isinstance(cur, dict):
                return default
            cur = cur.get(p)
    return default if cur is None else cur


def short(h, n=8):
    return f"{h[:n]}…" if isinstance(h, str) and len(h) > n else (h or UNCHECKABLE)


def n_or_unc(v):
    return UNCHECKABLE if v is None else str(v)


# --------------------------------------------------------------------------- facts

def probe_badges() -> list[dict]:
    """Which board-image URLs answer 200 image/svg+xml right now. GET, never HEAD — HEAD lies here."""
    out = []
    for u in BADGE_CANDIDATES:
        st, ct, body = fetch(u, accept="image/svg+xml")
        ok = st == 200 and ct.split(";")[0].strip() == "image/svg+xml" and body.lstrip().startswith(b"<svg")
        title = ""
        if ok:
            m = re.search(rb"<title>(.*?)</title>", body, re.S)
            title = m.group(1).decode("utf-8", "replace").strip() if m else ""
        out.append({"url": u, "status": UNCHECKABLE if st is None else st, "content_type": ct.split(";")[0].strip(), "ok": ok, "title": title})
    return out


def derive() -> dict:
    raw = {k: fetch_json(u) for k, u in URLS.items()}
    f: dict = {"derived": now_iso(), "urls": URLS, "unreachable": [k for k, v in raw.items() if v is None]}

    g = raw["gspc"]
    t = dig(g, "totals", default={})
    f["lid"] = t.get("lid") or UNCHECKABLE
    f["schema"] = dig(g, "schema", default=UNCHECKABLE)
    f["axes_total"] = t.get("axes")
    f["measured_axes"] = t.get("measured_axes")
    f["unmeasured_axes"] = t.get("unmeasured_axes")
    f["public_count"] = t.get("public_count") or UNCHECKABLE
    f["model_fleets"] = t.get("model_fleets")
    f["fact_runs"] = t.get("fact_runs")
    f["public_leader_count"] = t.get("public_leader_count")
    f["separated_leads"] = t.get("separated_leads")
    f["ties"] = t.get("ties")
    f["untested_separations"] = t.get("untested_separations")
    f["board_license"] = t.get("license") or UNCHECKABLE
    f["living_stamp_state"] = dig(g, "measured_on", "living_stamp", "verification_state", default=UNCHECKABLE)
    f["living_stamp_signer"] = dig(g, "measured_on", "living_stamp", "signer", default=UNCHECKABLE)
    axes = []
    for a in dig(g, "axes", default=[]) or []:
        axes.append({
            "axis": a.get("axis"), "family": a.get("family"), "kind": a.get("kind"),
            "n": a.get("n"), "status": a.get("status") or UNCHECKABLE,
            "separation": a.get("separation"), "leader_state": a.get("public_leader_state"),
            "accuracy": a.get("accuracy"),
        })
    f["axes"] = axes
    by_status: dict = {}
    for a in axes:
        by_status[a["status"]] = by_status.get(a["status"], 0) + 1
    f["axes_by_status"] = by_status
    f["axes_array_len"] = len(axes)
    f["counts_agree"] = (len(axes) == f["axes_total"]) if f["axes_total"] is not None and axes else None

    f["badges"] = probe_badges()

    r = raw["root"]
    f["root"] = {
        "merkle_root": dig(r, "merkle_root", default=UNCHECKABLE),
        "card_count": dig(r, "card_count"),
        "as_of": dig(r, "as_of", default=UNCHECKABLE),
        "kind": dig(r, "kind", default=UNCHECKABLE),
        "signed": bool(dig(r, "sig_ed25519")),
        "sha256_list_len": len(dig(r, "card_sha256", default=[]) or []),
    }
    f["root"]["count_matches_list"] = (f["root"]["card_count"] == f["root"]["sha256_list_len"]) if r else None

    ci = raw["card_index"]
    f["card_index"] = {
        "n_cards": dig(ci, "n_cards"), "n_cells": dig(ci, "n_cells"),
        "pubkey": dig(ci, "pubkey", default=UNCHECKABLE),
        "list_len": len(dig(ci, "cards", default=[]) or []),
    }

    h = raw["hub"]
    f["hub"] = {
        "cells": dig(h, "counts", "cells"), "measured": dig(h, "counts", "measured"),
        "unmeasured": dig(h, "counts", "unmeasured"), "complete": dig(h, "counts", "complete"),
        "as_of": dig(h, "as_of", default=UNCHECKABLE),
    }

    c = raw["corrections"]
    entries = dig(c, "corrections", default=None)
    f["corrections"] = {
        "count": len(entries) if isinstance(entries, list) else None,
        "signature_state": dig(c, "signature_state", default=UNCHECKABLE),
        "license": dig(c, "license", default=UNCHECKABLE),
        "latest_id": dig(entries, -1, "id", default=UNCHECKABLE) if isinstance(entries, list) and entries else UNCHECKABLE,
        "latest_date": dig(entries, -1, "date", default=UNCHECKABLE) if isinstance(entries, list) and entries else UNCHECKABLE,
    }

    v = raw["revenue"]
    on = dig(v, "one_number", default={})
    f["one_number"] = {
        "id": on.get("id", UNCHECKABLE), "status": on.get("status", UNCHECKABLE),
        "all_time": on.get("all_time"), "last_30d": on.get("last_30d"),
        "settlements": on.get("settlements"), "present": bool(on),
    }

    w = raw["witness"]
    witnessed_root = dig(w, "drift", "witness_artifact_merkle_root", default=None)
    live_now = f["root"]["merkle_root"]
    f["witness"] = {
        "rekor_status": dig(w, "witnesses", "rekor", default=UNCHECKABLE),
        "ots_status": dig(w, "witnesses", "ots", default=UNCHECKABLE),
        "eas_status": dig(w, "witnesses", "eas_base", default=UNCHECKABLE),
        "drift_recorded": dig(w, "drift", "status", default=UNCHECKABLE),
        "drift_checked_at": dig(w, "drift", "checked_at", default=UNCHECKABLE),
        "witnessed_root": witnessed_root or UNCHECKABLE,
        "witnessed_equals_live_now": (witnessed_root == live_now) if (witnessed_root and live_now != UNCHECKABLE) else None,
        "conflict": dig(w, "conflict", "status", default=UNCHECKABLE),
        "sidecar": dig(w, "witness_sidecar", "url", default="https://councilof.ai/interop/root-witness-latest.json"),
    }

    a = raw["agent"]
    f["a2a"] = {"name": dig(a, "name", default=UNCHECKABLE), "skills": len(dig(a, "skills", default=[]) or [])}
    x = raw["x402"]
    f["x402"] = {"schema": dig(x, "schema", default=UNCHECKABLE), "version": dig(x, "x402Version"),
                 "network": dig(x, "network", default=UNCHECKABLE), "mode": dig(x, "mode", default=UNCHECKABLE),
                 "resources": len(dig(x, "resources", default=[]) or [])}

    d = raw["did"]
    keys = {}
    for vm in dig(d, "verificationMethod", default=[]) or []:
        kid = (vm.get("id") or "").split("#")[-1]
        keys[kid] = dig(vm, "publicKeyJwk", "x", default=UNCHECKABLE)
    f["did"] = {"id": dig(d, "id", default=UNCHECKABLE), "keys": keys}

    p = raw["pypi"]
    pv = dig(p, "info", "version")
    f["pypi"] = {"version": pv or UNCHECKABLE, "license": dig(p, "info", "license", default=UNCHECKABLE),
                 "uploaded": dig(p, "releases", pv, 0, "upload_time", default=UNCHECKABLE) if pv else UNCHECKABLE}
    n = raw["npm"]
    nv = dig(n, "dist-tags", "latest")
    f["npm"] = {"version": nv or UNCHECKABLE, "license": dig(n, "license", default=UNCHECKABLE),
                "published": dig(n, "time", nv, default=UNCHECKABLE) if nv else UNCHECKABLE}

    def zhit(z):
        hit = dig(z, "hits", "hits", 0)
        return {"doi": dig(hit, "doi", default=UNCHECKABLE), "version": dig(hit, "metadata", "version", default=UNCHECKABLE),
                "date": dig(hit, "metadata", "publication_date", default=UNCHECKABLE), "title": dig(hit, "metadata", "title", default=UNCHECKABLE),
                "total_versions": dig(z, "hits", "total")}
    zc = raw["zenodo_snapshot_cited"]
    f["zenodo"] = {
        "method": {"concept": ZENODO_METHOD_CONCEPT, **zhit(raw["zenodo_method_latest"])},
        "snapshot": {"concept": ZENODO_SNAPSHOT_CONCEPT, **zhit(raw["zenodo_snapshot_latest"])},
        "snapshot_cited": {"doi": dig(zc, "doi", default=UNCHECKABLE), "version": dig(zc, "metadata", "version", default=UNCHECKABLE),
                           "conceptdoi": dig(zc, "conceptdoi", default=UNCHECKABLE)},
    }
    f["hf"] = {k: (len(raw[f"hf_{k}"]) if isinstance(raw[f"hf_{k}"], list) else None) for k in ("datasets", "spaces", "models")}

    # ---- where the board is published: read each surface back, compare its as_of with the live root
    root_as_of = f["root"]["as_of"]
    hs = raw["hf_board_snapshot"]
    hd = raw["hf_board_dataset"]
    sp = raw["hf_board_space"]
    gm = raw["gh_mirror_snapshot"]
    kst, _kct, kbody = fetch(KAGGLE_URL, accept="text/html", timeout=30)
    kiso = sorted({m.decode() for m in re.findall(rb"20\d\d-\d\d-\d\dT\d\d:\d\d:\d\dZ", kbody)}) if kst == 200 else []
    zs = f["zenodo"]["snapshot"]

    def cur(as_of):
        return None if (as_of in (None, UNCHECKABLE) or root_as_of == UNCHECKABLE) else (as_of == root_as_of)

    f["surfaces"] = [
        {"surface": "Hugging Face dataset", "id": "csoai/gspc-board", "url": "https://huggingface.co/datasets/csoai/gspc-board",
         "lands": "`snapshot/` — board.json + root.json byte-for-byte, SNAPSHOT.json, check-board.sh, gspc-axes.csv/.jsonl",
         "read_back": (f"as_of `{dig(hs, 'as_of')}` · merkle `{short(dig(hs, 'merkle_root'), 12)}` · {n_or_unc(dig(hs, 'card_count'))} leaves · modified {dig(hd, 'lastModified', default=UNCHECKABLE)}" if hs else UNCHECKABLE),
         "as_of": dig(hs, "as_of"), "current": cur(dig(hs, "as_of"))},
        {"surface": "Hugging Face Space", "id": "csoai/gspc-board", "url": "https://huggingface.co/spaces/csoai/gspc-board",
         "lands": "the same `snapshot/` folder beside the one living Space",
         "read_back": (f"runtime `{dig(sp, 'runtime', 'stage', default=UNCHECKABLE)}` · modified {dig(sp, 'lastModified', default=UNCHECKABLE)}" if sp else UNCHECKABLE),
         "as_of": None, "current": None},
        {"surface": "Kaggle dataset", "id": "nicktempleman/csoai-gspc-living-board", "url": KAGGLE_URL,
         "lands": "a new dataset version per changed fingerprint; the subtitle carries `as_of`",
         "read_back": (f"HTTP {kst} · latest ISO timestamp on the listing page `{kiso[-1]}`" if kiso else (f"HTTP {kst} · no timestamp readable without a login" if kst else UNCHECKABLE)),
         "as_of": kiso[-1] if kiso else None, "current": cur(kiso[-1] if kiso else None)},
        {"surface": "GitHub mirror", "id": f"{OWNER}/gspc-board", "url": f"https://github.com/{OWNER}/gspc-board",
         "lands": "the snapshot files on `main`",
         "read_back": (f"as_of `{dig(gm, 'as_of')}` · merkle `{short(dig(gm, 'merkle_root'), 12)}` · {n_or_unc(dig(gm, 'card_count'))} leaves" if gm else UNCHECKABLE),
         "as_of": dig(gm, "as_of"), "current": cur(dig(gm, "as_of"))},
        {"surface": "Zenodo", "id": ZENODO_SNAPSHOT_CONCEPT, "url": f"https://doi.org/{ZENODO_SNAPSHOT_CONCEPT}",
         "lands": f"a new version under the concept DOI, `isDerivedFrom` the methodology record {ZENODO_METHOD_CONCEPT}",
         "read_back": (f"{n_or_unc(zs['total_versions'])} versions · latest `{zs['doi']}` = as_of `{zs['version']}` ({zs['date']})" if zs["doi"] != UNCHECKABLE else UNCHECKABLE),
         "as_of": zs["version"] if zs["version"] != UNCHECKABLE else None, "current": cur(zs["version"])},
        {"surface": "PyPI", "id": "csoai-gspc", "url": "https://pypi.org/project/csoai-gspc/",
         "lands": "`csoai-gspc==0.2.<YYYYMMDD>` — reader + verifier, snapshot bundled as package data",
         "read_back": f"{f['pypi']['version']} · uploaded {f['pypi']['uploaded']} · {f['pypi']['license']}",
         "as_of": None, "current": None},
        {"surface": "npm", "id": "csoai-gspc-mcp", "url": "https://www.npmjs.com/package/csoai-gspc-mcp",
         "lands": "stdio MCP server over the same endpoints (published by hand — the account is WebAuthn, so the daily spray cannot push here)",
         "read_back": f"{f['npm']['version']} · published {f['npm']['published']} · {f['npm']['license']}",
         "as_of": None, "current": None},
    ]
    return f


# --------------------------------------------------------------------------- render helpers

def board_image_row(f: dict) -> str:
    ok = [b for b in f["badges"] if b["ok"]]
    if not ok:
        return f"_board image {UNCHECKABLE} at derive time — none of {', '.join(b['url'] for b in f['badges'])} answered 200 image/svg+xml._"
    return "\n".join(f"[![{b['title'] or f['lid']}]({b['url']})](https://councilof.ai/api/gspc)" for b in ok)


def badge_row(f: dict) -> str:
    """One row. Every badge links to a thing that exists and is read live by shields or Zenodo."""
    return " ".join([
        f"[![PyPI csoai-gspc](https://img.shields.io/pypi/v/csoai-gspc?style=flat-square&color={GREEN}&label=PyPI%20csoai--gspc)](https://pypi.org/project/csoai-gspc/)",
        f"[![npm csoai-gspc-mcp](https://img.shields.io/npm/v/csoai-gspc-mcp?style=flat-square&color={GREEN}&label=npm%20csoai--gspc--mcp)](https://www.npmjs.com/package/csoai-gspc-mcp)",
        f"[![DOI {ZENODO_METHOD_CONCEPT}](https://zenodo.org/badge/DOI/{ZENODO_METHOD_CONCEPT}.svg)](https://doi.org/{ZENODO_METHOD_CONCEPT})",
        f"[![License MIT](https://img.shields.io/badge/license-MIT-{GREEN}?style=flat-square)](https://github.com/{OWNER}/councilof-ai/blob/master/LICENSE)",
    ])


def board_table(f: dict) -> str:
    rows = ["| # | axis | family | kind | n | status | separation | leader carried? |", "|---|---|---|---|---|---|---|---|"]
    for i, a in enumerate(f["axes"], 1):
        sep = a["separation"] or "—"
        ls = a["leader_state"]
        if a["kind"] == "deterministic-facts":
            lead = "no leader by design (facts run)"
        elif ls == "EXCLUDED_OWN_MODEL":
            lead = "no — own model led, excluded"
        elif ls == "NO_SIGNED_CARD":
            lead = "no — no signed card"
        elif ls is None and a["accuracy"] is not None:
            lead = f"yes — accuracy {a['accuracy']}"
        else:
            lead = "—"
        rows.append(f"| {i} | `{a['axis']}` | {a['family']} | {a['kind']} | {n_or_unc(a['n'])} | **{a['status']}** | {sep} | {lead} |")
    if not f["axes"]:
        rows.append(f"| — | {UNCHECKABLE} | | | | | | |")
    st = ", ".join(f"{k} {v}" for k, v in sorted(f["axes_by_status"].items())) or UNCHECKABLE
    agree = {True: "agrees with `totals.axes`", False: "**DISAGREES with `totals.axes` — read the API**", None: UNCHECKABLE}[f["counts_agree"]]
    trip = (f["separated_leads"], f["ties"], f["untested_separations"])
    comp = n_or_unc(sum(trip) if None not in trip else None)
    foot = (f"\nCounted from the `axes` array at derive time: {f['axes_array_len']} rows — {st} — {agree}. "
            f"Separation over the {comp} model-comparison axes: SEPARATED {n_or_unc(f['separated_leads'])} · TIE {n_or_unc(f['ties'])} · UNTESTED {n_or_unc(f['untested_separations'])}. "
            "A TIE is not a win; UNTESTED is not a win; a facts run has no leader. "
            f"Living stamp: **{f['living_stamp_state']}** (`{f['living_stamp_signer']}`). Board data: {f['board_license']}.")
    return "\n".join(rows) + "\n" + foot


def products_table(index_path: Path | None) -> str:
    """Products from docs/product/_INDEX.json — name + door URL + live door status. No prices."""
    if index_path is None or not index_path.exists():
        return f"_docs/product/_INDEX.json not present at generate time — {UNCHECKABLE}._"
    idx = json.loads(index_path.read_text())
    root = index_path.parent.parent.parent
    rows = ["| product | what you get | door (live status at derive time) |", "|---|---|---|"]
    for sku in idx.get("skus", []):
        md = root / sku["file"]
        title, door = sku["id"], None
        if md.exists():
            txt = md.read_text()
            m = re.search(r"^# (.+)$", txt, re.M)
            if m:
                title = m.group(1).strip()
            m = re.search(r"`(https://councilof\.ai/api/[^`]+)`", txt)
            if m:
                door = m.group(1)
        status = UNCHECKABLE
        if door:
            st, _ct, _b = fetch(door)
            status = UNCHECKABLE if st is None else str(st)
        door_cell = f"[`{door.replace('https://councilof.ai', '')}`]({door}) → **{status}**" if door else "—"
        rows.append(f"| `{sku['id']}` | {title} | {door_cell} |")
    rows.append("")
    rows.append(f"_{len(idx.get('skus', []))} products read from `docs/product/_INDEX.json` (as_of {idx.get('as_of', UNCHECKABLE)}). "
                "A **402** means the door is metered by x402 and the amount appears only in that 402 challenge — never here, never on the board. "
                "Verification of every artefact is free._")
    return "\n".join(rows)


def integrity_table(f: dict) -> str:
    r, ci, w, c = f["root"], f["card_index"], f["witness"], f["corrections"]
    key = f["did"]["keys"].get("card-attestation-1", UNCHECKABLE)
    rows = [
        "| layer | live now | where |",
        "|---|---|---|",
        f"| 1 · Ed25519-signed measurement cards | **{n_or_unc(ci['n_cards'])}** cards (`n_cards == n_cells`: {ci['n_cards'] == ci['n_cells'] if ci['n_cards'] is not None else UNCHECKABLE}), one key `{short(ci['pubkey'], 8)}` = `did:web:csoai.org#card-attestation-1` | [`/signed/card_index.json`](https://councilof.ai/signed/card_index.json) · [how to verify](https://councilof.ai/signed/HOW-TO-VERIFY.md) |",
        f"| 2 · Signed Merkle public root | `{r['kind']}` · root `{short(r['merkle_root'], 12)}` · **{n_or_unc(r['card_count'])}** leaves (`card_count == len(card_sha256)`: {r['count_matches_list'] if r['count_matches_list'] is not None else UNCHECKABLE}) · as_of `{r['as_of']}` · signed: {r['signed']} | [`/root.json`](https://councilof.ai/root.json) · [how to verify the root](https://councilof.ai/signed/HOW-TO-VERIFY-ROOT.md) |",
        f"| 3 · Transparency-log witness | Rekor **{w['rekor_status']}** · OpenTimestamps `{w['ots_status']}` · EAS `{w['eas_status']}` · witnessed root `{short(w['witnessed_root'], 12)}` equals live `root.json` at derive time: **{w['witnessed_equals_live_now'] if w['witnessed_equals_live_now'] is not None else UNCHECKABLE}** · pointer's own last drift check `{w['drift_recorded']}` at `{w['drift_checked_at']}` · conflict `{w['conflict']}` | [`/interop/root-witness-pointer.json`](https://councilof.ai/interop/root-witness-pointer.json) · [sidecar]({w['sidecar']}) |",
        f"| 4 · Corrections ledger | **{n_or_unc(c['count'])}** entries · latest `{c['latest_id']}` ({c['latest_date']}) · signature_state **{c['signature_state']}** · {c['license']} | [`/api/corrections`](https://councilof.ai/api/corrections) |",
        f"| Living board stamp | **{f['living_stamp_state']}** under `{f['living_stamp_signer']}` | [`/api/gspc` → `measured_on.living_stamp`](https://councilof.ai/api/gspc) |",
        f"| Third-party Hub cells | **{n_or_unc(f['hub']['cells'])}** cells: MEASURED {n_or_unc(f['hub']['measured'])} · UNMEASURED {n_or_unc(f['hub']['unmeasured'])} · complete read: {f['hub']['complete']} | [`/api/hub-cards`](https://councilof.ai/api/hub-cards) |",
        f"| Keys (DID) | `{f['did']['id']}` · {len(f['did']['keys'])} verification methods · card key x=`{short(key, 10)}` | [`/.well-known/did.json`](https://csoai.org/.well-known/did.json) |",
        f"| A2A agent card · x402 manifest | `{f['a2a']['name']}`, {f['a2a']['skills']} skills · `{f['x402']['schema']}`, network `{f['x402']['network']}`, mode `{f['x402']['mode']}`, {f['x402']['resources']} metered resources | [`/.well-known/agent.json`](https://councilof.ai/.well-known/agent.json) · [`/.well-known/x402.json`](https://councilof.ai/.well-known/x402.json) |",
    ]
    note = ("\nThree different card numbers appear above on purpose and are never reconciled here: the **signed-card chain** "
            f"({n_or_unc(ci['n_cards'])}), the **public-root leaf count** ({n_or_unc(r['card_count'])}) and the **Hub cells** "
            f"({n_or_unc(f['hub']['cells'])}) are three populations with three source URLs. Quote each with its URL.")
    return "\n".join(rows) + "\n" + note


def revenue_line(f: dict) -> str:
    o = f["one_number"]
    if not o["present"]:
        return f"**Buyers:** {UNCHECKABLE} — `/api/revenue` did not answer at derive time."
    return (f"**Buyers (the one number):** `{o['id']}` = **{n_or_unc(o['all_time'])}** all-time · {n_or_unc(o['last_30d'])} in 30 d · "
            f"{n_or_unc(o['settlements'])} settlements · status {o['status']} — read from [`/api/revenue`](https://councilof.ai/api/revenue). "
            "Published because a measurement body that hides its own zero has no standing to publish anyone else's.")


def surfaces_table(f: dict) -> str:
    rows = ["| surface | what lands there | read back at derive time | carries the live root `as_of`? |", "|---|---|---|---|"]
    for s in f["surfaces"]:
        cur = {True: "**yes**", False: "no — behind", None: "n/a"}[s["current"]]
        rows.append(f"| **{s['surface']}** [`{s['id']}`]({s['url']}) | {s['lands']} | {s['read_back']} | {cur} |")
    rows.append("")
    rows.append(f"_Pushed by `scripts/spray/gspc-spray.py` (daily, idempotent by `as_of` and fingerprint). The live root `as_of` at derive time was `{f['root']['as_of']}`; "
                "a surface that lags is shown lagging, not reconciled. Board data is "
                f"{f['board_license']}; the reader packages are {f['pypi']['license']} / {f['npm']['license']}._")
    return "\n".join(rows)


VERIFY_CURLS = """```bash
# 1. the lid — the one sentence the board is allowed to say about itself
curl -s https://councilof.ai/api/gspc | python3 -c 'import sys,json; print(json.load(sys.stdin)["totals"]["lid"])'

# 2. the signed public root — Merkle root, leaf count, timestamp (card_count MUST equal len(card_sha256))
curl -s https://councilof.ai/root.json | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r["merkle_root"], r["card_count"], len(r["card_sha256"]), r["as_of"])'

# 3. pin the card key from the DID document — never trust the key a card ships with
curl -s https://csoai.org/.well-known/did.json | python3 -c 'import sys,json,base64; k=[v for v in json.load(sys.stdin)["verificationMethod"] if v["id"].endswith("#card-attestation-1")][0]["publicKeyJwk"]["x"]; print(base64.urlsafe_b64decode(k+"="*(-len(k)%4)).hex())'

# 4. verify any card against that pinned key — three states only: VALID · INVALID · UNCHECKABLE
pipx run --spec 'csoai-gspc[verify]' csoai-gspc verify "$(curl -s https://councilof.ai/signed/card_index.json | python3 -c 'import sys,json; print(json.load(sys.stdin)["cards"][0]["card"])')"
```"""

WHO_WE_ARE = (
    f"**{WORDMARK} — Council of AI (CSOAI Ltd) — is an independent AI-measurement body: we run AI systems against frozen, "
    "published instruments, grade them deterministically, and sign every result with Ed25519 so anyone can check it without an account.** "
    "We publish what we cannot yet measure as UNMEASURED, keep a public corrections ledger, and do not certify, sell a rank, or take money from anything we rank."
)


def derived_line(f: dict) -> str:
    return (f"_derived {f['derived']} by [`scripts/github/org-readme.py`](https://github.com/{OWNER}/councilof-ai/blob/master/scripts/github/org-readme.py) — "
            "every number on this page is read live from the URLs in that script; if this page and the API disagree, the API is right._")


def repos_table() -> str:
    # The six that carry the estate; descriptions are the live GitHub descriptions, re-read at derive time.
    six = ["councilof-ai", "gspc-board", "a2a-signed-receipts", "inspect-receipts", "corpus-watch", "carder"]
    rows = ["| repo | what it does |", "|---|---|"]
    for r in six:
        d = fetch_json(f"https://api.github.com/repos/{OWNER}/{r}") if os.environ.get("ORG_README_GH", "1") == "1" else None
        desc = (d or {}).get("description") or UNCHECKABLE
        rows.append(f"| [`{r}`](https://github.com/{OWNER}/{r}) | {desc} |")
    rows.append("")
    rows.append(f"The PyPI reader `csoai-gspc` and the npm MCP server `csoai-gspc-mcp` are built from `councilof-ai` "
                "(`scripts/spray/pypi/csoai-gspc/`, `mcp/gspc-server/`).")
    return "\n".join(rows)


def contributing() -> str:
    return "\n".join([
        "- **Challenge a measurement:** open a [measurement challenge](https://github.com/CSOAI-ORG/.github/issues/new?template=measurement-challenge.yml) — cite the card id and the frozen bank row.",
        "- **Report a defect:** [defect template](https://github.com/CSOAI-ORG/.github/issues/new?template=defect.yml). Accepted defects land in the public [corrections ledger](https://councilof.ai/api/corrections), never in a silent edit.",
        "- **Code:** PRs into [`councilof-ai`](https://github.com/CSOAI-ORG/councilof-ai) run the same gates as a deploy (`pr-gates.yml`). Read [CONTRIBUTING](https://github.com/CSOAI-ORG/.github/blob/main/CONTRIBUTING.md) and [SECURITY](https://github.com/CSOAI-ORG/.github/blob/main/SECURITY.md).",
        "- **What we never do:** certify; sell ratings, ranking position or early sight of a grade; remediate for a fee; or take money from anything we rank.",
    ])


def footer(f: dict) -> str:
    return (f"<sub>{WORDMARK} · CSOAI Ltd · UK Companies House 16939677 · 3rd Floor 86-90 Paul Street, London EC2A 4NE · "
            f"nicholas@csoai.org · [councilof.ai](https://councilof.ai) · derived {f['derived']}</sub>")


def profile_md(f: dict, product_index: Path | None) -> str:
    parts = [
        f"# {WORDMARK} — Council of AI",
        "",
        WHO_WE_ARE,
        "",
        f"> **{f['lid']}**",
        "",
        board_image_row(f),
        "",
        badge_row(f),
        "",
        derived_line(f),
        "",
        "## The board today",
        "",
        f"`GET https://councilof.ai/api/gspc` — schema `{f['schema']}` · `totals.public_count` = **{f['public_count']}** · "
        f"{n_or_unc(f['model_fleets'])} model fleets · {n_or_unc(f['fact_runs'])} fact runs · {n_or_unc(f['public_leader_count'])} public leader scores.",
        "",
        board_table(f),
        "",
        "## What a stranger can verify in four curls",
        "",
        VERIFY_CURLS,
        "",
        "## The integrity stack",
        "",
        "Ed25519 cards → Merkle root → transparency-log witness → corrections ledger. Each layer has a live URL.",
        "",
        integrity_table(f),
        "",
        revenue_line(f),
        "",
        "## Products",
        "",
        "Evidence artefacts behind an x402 door — never a grade, never a price on this page.",
        "",
        products_table(product_index),
        "",
        "## Where the board is published",
        "",
        surfaces_table(f),
        "",
        f"Also on the Hub: [`csoai`](https://huggingface.co/csoai) — {n_or_unc(f['hf']['datasets'])} datasets (frozen banks, hub cards), "
        f"{n_or_unc(f['hf']['spaces'])} Spaces, {n_or_unc(f['hf']['models'])} models. "
        f"Methodology: [{ZENODO_METHOD_CONCEPT}](https://doi.org/{ZENODO_METHOD_CONCEPT}) — latest version `{f['zenodo']['method']['doi']}` ({f['zenodo']['method']['date']}). "
        f"Board snapshot cited on 2026-09-05: `{f['zenodo']['snapshot_cited']['doi']}` = as_of `{f['zenodo']['snapshot_cited']['version']}`, under concept `{f['zenodo']['snapshot_cited']['conceptdoi']}`. "
        "Our own models losing our own arena: [councilof.ai/honesty](https://councilof.ai/honesty/).",
        "",
        "## Repositories that carry the estate",
        "",
        repos_table(),
        "",
        "## How to contribute",
        "",
        contributing(),
        "",
        "---",
        "",
        footer(f),
        "",
    ]
    return "\n".join(parts)


def personal_md(f: dict, product_index: Path | None) -> str:
    note = ("<!-- DRAFT for CSOAI-ORG/csoai-org/README.md — the file github.com/CSOAI-ORG renders as the account profile\n"
            "     (the account is a GitHub user, and that repository is named after the login). No lane pushes it: it is the\n"
            "     owner's personal profile. Copy it across when you decide. The same generator keeps\n"
            "     docs/github/PROFILE-README.md and CSOAI-ORG/.github/profile/README.md fresh daily. -->\n\n")
    return note + profile_md(f, product_index)


BEGIN = "<!-- org-readme:begin (generated by scripts/github/org-readme.py — do not hand-edit; everything below the end marker is hand-maintained) -->"
END = "<!-- org-readme:end -->"


def councilof_top(f: dict, product_index: Path | None) -> str:
    parts = [
        BEGIN,
        f"# {WORDMARK} — Council of AI",
        "",
        f"> **{f['lid']}**",
        "",
        board_image_row(f),
        "",
        badge_row(f),
        "",
        "Independent AI-governance measurement. This repository is the live site, API and signing pipeline behind "
        "[councilof.ai](https://councilof.ai): the 22-axis GSPC board, Ed25519-signed measurement cards, the signed Merkle public root and its transparency-log witness, "
        "the corrections ledger, the A2A agent card, the x402 manifest, and the PyPI / npm readers. **Measurement, not certification.**",
        "",
        derived_line(f),
        "",
        "## The board today",
        "",
        f"`GET https://councilof.ai/api/gspc` — schema `{f['schema']}` · `totals.public_count` = **{f['public_count']}**",
        "",
        board_table(f),
        "",
        "## What a stranger can verify in four curls",
        "",
        VERIFY_CURLS,
        "",
        "## The integrity stack",
        "",
        integrity_table(f),
        "",
        revenue_line(f),
        "",
        "## Install the readers",
        "",
        "```bash",
        f"pip install csoai-gspc          # {f['pypi']['version']} — board, axis, verify, root, snapshot",
        f"npx csoai-gspc-mcp              # {f['npm']['version']} — stdio MCP server over the same endpoints",
        "```",
        "",
        "## Products",
        "",
        products_table(product_index),
        "",
        "## Where the board is published",
        "",
        surfaces_table(f),
        "",
        END,
    ]
    return "\n".join(parts)


def splice_councilof(readme: Path, f: dict, product_index: Path | None) -> None:
    txt = readme.read_text()
    block = councilof_top(f, product_index)
    guard(block, "councilof README top block")
    if BEGIN in txt and END in txt:
        pre = txt[: txt.index(BEGIN)]
        post = txt[txt.index(END) + len(END):]
        new = pre + block + post
    else:
        marker = "## Hosting and deploy"
        if marker not in txt:
            sys.exit("README.md has neither the org-readme markers nor '## Hosting and deploy'; refusing to guess")
        new = block + "\n\n" + txt[txt.index(marker):]
    readme.write_text(new)


def guard(text: str, what: str) -> None:
    """Refuse to emit a page that uses the words the estate does not use, or a price."""
    for i, line in enumerate(text.splitlines(), 1):
        m = BANNED.search(line)
        if m:
            sys.exit(f"[org-readme] REFUSED {what}: line {i} contains {m.group(0)!r}: {line[:120]}")


# --------------------------------------------------------------------------- inventory

CLAIM_PATTERNS = [
    ("100/100", r"100/100"), ("A+++", r"A\+{3,}"), ("world-leading", r"world[- ]leading"),
    ("world's-first/only", r"world'?s (?:first|only)"), ("price", r"[£$€]\s?\d|/mo\b"), ("Stripe-tier", r"Stripe-tier"),
    ("certified", r"\bcertified\b"), ("Compliant", r"EU AI Act[- ]Compliant"), ("BFT", r"\bBFT\b|Byzantine"),
    ("sovereign", r"(?<![Ss]elf-)\b[Ss]overeign\b(?! Identity)"), ("production-ready", r"production-ready"),
]
COUNT_CLAIM = re.compile(r"(\d+)\s*(?:slots?|ax[ei]s)\s*·\s*(\d+)\s*measured", re.I)


def gh_json(args: list[str]):
    p = subprocess.run(["gh", *args], capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip())
    return json.loads(p.stdout)


def probe_homepage(url: str):
    st, _ct, _b = fetch(url, accept="text/html", timeout=20)
    return UNCHECKABLE if st is None else st


def inventory_md(f: dict, readme_sizes: dict | None = None) -> str:
    repos = gh_json(["repo", "list", OWNER, "--limit", "1000", "--visibility", "public", "--json",
                     "name,description,repositoryTopics,stargazerCount,forkCount,pushedAt,licenseInfo,isArchived,isFork,url,primaryLanguage,homepageUrl"])
    now = dt.datetime.now(dt.timezone.utc)
    homepages = {r["name"]: r["homepageUrl"] for r in repos if (r.get("homepageUrl") or "").startswith("http")}
    with ThreadPoolExecutor(8) as ex:
        hp_status = dict(zip(homepages.keys(), ex.map(probe_homepage, homepages.values())))
    rows, lists = [], {"claim": [], "stale-count": [], "homepage": []}
    flags_total = {"no_description": 0, "no_topics": 0, "no_licence": 0, "stale_60d": 0, "readme_missing": 0, "archived": 0, "fork": 0,
                   "claim": 0, "stale_count": 0, "homepage_not_200": 0}
    for r in sorted(repos, key=lambda x: x["pushedAt"], reverse=True):
        pushed = dt.datetime.fromisoformat(r["pushedAt"].replace("Z", "+00:00"))
        age = (now - pushed).days
        topics = [t["name"] for t in (r.get("repositoryTopics") or [])]
        lic = (r.get("licenseInfo") or {}).get("key") or "—"
        rs = (readme_sizes or {}).get(r["name"])
        desc_raw = r.get("description") or ""
        flags = []
        if not desc_raw:
            flags.append("no-description"); flags_total["no_description"] += 1
        if not topics:
            flags.append("no-topics"); flags_total["no_topics"] += 1
        if lic == "—":
            flags.append("no-licence"); flags_total["no_licence"] += 1
        if age > 60:
            flags.append(f"stale-{age}d"); flags_total["stale_60d"] += 1
        if rs == 0:
            flags.append("no-readme"); flags_total["readme_missing"] += 1
        if r["isArchived"]:
            flags.append("archived"); flags_total["archived"] += 1
        if r["isFork"]:
            flags.append("fork"); flags_total["fork"] += 1
        hits = [name for name, pat in CLAIM_PATTERNS if re.search(pat, desc_raw)]
        if hits:
            flags.append("claim:" + "+".join(hits)); flags_total["claim"] += 1; lists["claim"].append((r["name"], hits, desc_raw))
        m = COUNT_CLAIM.search(desc_raw)
        if m and f["axes_total"] is not None and (int(m.group(1)), int(m.group(2))) != (f["axes_total"], f["measured_axes"]):
            tag = f"stale-count:{m.group(1)}·{m.group(2)}≠{f['axes_total']}·{f['measured_axes']}"
            flags.append(tag); flags_total["stale_count"] += 1; lists["stale-count"].append((r["name"], tag, desc_raw))
        if r["name"] in hp_status and hp_status[r["name"]] != 200:
            flags.append(f"homepage-{hp_status[r['name']]}"); flags_total["homepage_not_200"] += 1
            lists["homepage"].append((r["name"], hp_status[r["name"]], homepages[r["name"]]))
        desc = desc_raw.replace("|", "\\|")
        rows.append(f"| [{r['name']}]({r['url']}) | {desc} | {', '.join(topics) or '—'} | {r['stargazerCount']} | {r['pushedAt'][:10]} | "
                    f"{'—' if rs is None else rs} | {lic} | {(r.get('primaryLanguage') or {}).get('name') or '—'} | {' '.join(flags) or '—'} |")
    head = [
        f"# CSOAI-ORG public repository inventory — derived {f['derived']}",
        "",
        f"Account `{OWNER}` is a **user** account (GitHub `type: User`), not an organisation — see `docs/github/README.md`.",
        f"Public repos: **{len(repos)}**. Flags: " + ", ".join(f"{k} {v}" for k, v in flags_total.items()) + ".",
        "README bytes come from `GET /repos/{owner}/{repo}/readme` size (0 = no README file). "
        f"`claim:` = the description still carries a retracted, unmeasurable or priced term. `stale-count:` = a board count in the description that the live API (`{f['axes_total']}·{f['measured_axes']}`) does not say. "
        f"`homepage-<code>` = the repo's homepage URL did not answer 200 on GET ({len(homepages)} homepages probed).",
        "",
        "## Flagged for a person",
        "",
        "**Descriptions asserting something the estate has retracted or cannot measure** (" + str(len(lists["claim"])) + "):",
        "",
        *([f"- `{n}` — {'+'.join(h)} — {d[:160]}" for n, h, d in lists["claim"]] or ["- none"]),
        "",
        "**Descriptions carrying a board count the live API does not say** (" + str(len(lists["stale-count"])) + "):",
        "",
        *([f"- `{n}` — {t} — {d[:160]}" for n, t, d in lists["stale-count"]] or ["- none"]),
        "",
        "**Homepage URLs that did not answer 200** (" + str(len(lists["homepage"])) + "):",
        "",
        *([f"- `{n}` — HTTP {s} — {u}" for n, s, u in lists["homepage"]] or ["- none"]),
        "",
        "## Every public repository",
        "",
        "| repo | description | topics | ★ | last push | README B | licence | lang | flags |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    return "\n".join(head + rows) + "\n"


# --------------------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--profile", action="store_true", help="print the profile README to stdout")
    ap.add_argument("--personal", metavar="OUT.md", help="write the personal-profile draft (never pushed by a lane)")
    ap.add_argument("--councilof", metavar="README", help="splice the generated top block into this councilof-ai README.md")
    ap.add_argument("--inventory", metavar="OUT.md", help="write the public repo inventory (needs gh; probes homepages)")
    ap.add_argument("--readme-sizes", metavar="JSON", help="optional {repo: readme_bytes} map for the inventory")
    ap.add_argument("--json", action="store_true", help="dump derived facts as JSON")
    ap.add_argument("--product-index", default=None, help="path to docs/product/_INDEX.json (default: relative to this repo)")
    args = ap.parse_args()

    here = Path(__file__).resolve()
    repo_root = here.parents[2]
    product_index = Path(args.product_index) if args.product_index else (repo_root / "docs" / "product" / "_INDEX.json")
    if not product_index.exists():
        product_index = None

    f = derive()
    if f["unreachable"]:
        print(f"[org-readme] UNCHECKABLE sources: {f['unreachable']}", file=sys.stderr)
    if args.json:
        print(json.dumps(f, indent=1, ensure_ascii=False))
    if args.profile or args.personal:
        prof = profile_md(f, product_index)
        guard(prof, "profile")
        if args.profile:
            sys.stdout.write(prof)
        if args.personal:
            Path(args.personal).write_text(personal_md(f, product_index))
            print(f"[org-readme] wrote {args.personal}", file=sys.stderr)
    if args.councilof:
        splice_councilof(Path(args.councilof), f, product_index)
        print(f"[org-readme] spliced {args.councilof}", file=sys.stderr)
    if args.inventory:
        sizes = json.loads(Path(args.readme_sizes).read_text()) if args.readme_sizes else None
        Path(args.inventory).write_text(inventory_md(f, sizes))
        print(f"[org-readme] wrote {args.inventory}", file=sys.stderr)


if __name__ == "__main__":
    main()
