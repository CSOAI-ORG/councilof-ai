#!/usr/bin/env python3
"""org-readme.py — derive the CSOAI-ORG GitHub profile README, the top block of
councilof-ai/README.md, and the org repo inventory from LIVE endpoints.

Nothing in the emitted markdown is typed. Every count is read at run time from:

  https://councilof.ai/api/gspc                 totals.lid verbatim, the 22-axis board
  https://councilof.ai/root.json                merkle_root, card_count, as_of, sig
  https://councilof.ai/signed/card_index.json   n_cards (the 335 signed-card chain)
  https://councilof.ai/api/hub-cards            third-party Hub cells (measured/unmeasured)
  https://councilof.ai/api/corrections          public corrections ledger + signature_state
  https://councilof.ai/api/revenue              one_number (distinct non-self x402 payers)
  https://councilof.ai/interop/root-witness-pointer.json   Rekor witness + drift
  https://councilof.ai/.well-known/agent.json   A2A agent card
  https://councilof.ai/.well-known/x402.json    x402 manifest (mode, network; never a price)
  https://csoai.org/.well-known/did.json        the pinned Ed25519 keys
  https://pypi.org/pypi/csoai-gspc/json         PyPI version
  https://registry.npmjs.org/csoai-gspc-mcp     npm version
  https://zenodo.org/api/records/{21991104,22344048}
  https://huggingface.co/api/{datasets,spaces,models}?author=csoai

A fetch that fails is printed as UNCHECKABLE — never a fabricated 0. Every output
carries a `derived <ISO-8601>` stamp.

Usage:
  org-readme.py --profile            > profile/README.md          (org / account profile)
  org-readme.py --councilof README.md                             (splice the top block in place)
  org-readme.py --inventory docs/github/ORG-INVENTORY-YYYY-MM-DD.md   (needs `gh`)
  org-readme.py --json                (dump the derived facts)

Doctrine: measurement, not certification. No prices anywhere in the output.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

UA = "csoai-org-readme/1.0 (+https://github.com/CSOAI-ORG/councilof-ai)"
TIMEOUT = 40
GREEN = "10b981"       # emerald — one colour, everywhere
GREY = "9ca3af"
OWNER = "CSOAI-ORG"

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
    "zenodo_method": "https://zenodo.org/api/records/21991104",
    "zenodo_snapshot": "https://zenodo.org/api/records/22344048",
    "hf_datasets": "https://huggingface.co/api/datasets?author=csoai&limit=1000",
    "hf_spaces": "https://huggingface.co/api/spaces?author=csoai&limit=1000",
    "hf_models": "https://huggingface.co/api/models?author=csoai&limit=1000",
}

UNCHECKABLE = "UNCHECKABLE"


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_json(url: str):
    """Return parsed JSON or None. None means UNCHECKABLE, never 0."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            if r.status != 200:
                return None
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        print(f"[org-readme] {url} -> {type(e).__name__}: {e}", file=sys.stderr)
        return None


def dig(obj, *path, default=None):
    cur = obj
    for p in path:
        if cur is None:
            return default
        if isinstance(p, int):
            if not isinstance(cur, list) or p >= len(cur):
                return default
            cur = cur[p]
        else:
            if not isinstance(cur, dict):
                return default
            cur = cur.get(p)
    return default if cur is None else cur


def short(h, n=8):
    return f"{h[:n]}…" if isinstance(h, str) and len(h) > n else (h or UNCHECKABLE)


# --------------------------------------------------------------------------- facts

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
    f["living_stamp_state"] = dig(g, "measured_on", "living_stamp", "verification_state", default=UNCHECKABLE)
    f["living_stamp_signer"] = dig(g, "measured_on", "living_stamp", "signer", default=UNCHECKABLE)
    f["grading"] = dig(g, "measured_on", "grading", default="")
    axes = []
    for a in dig(g, "axes", default=[]) or []:
        axes.append({
            "axis": a.get("axis"), "family": a.get("family"), "kind": a.get("kind"),
            "n": a.get("n"), "status": a.get("status") or UNCHECKABLE,
            "separation": a.get("separation"), "bench": a.get("bench"),
            "dataset": a.get("dataset"), "leader_state": a.get("public_leader_state"),
            "accuracy": a.get("accuracy"),
        })
    f["axes"] = axes
    # derived, never typed: counts recomputed from the axis array and cross-checked
    by_status: dict = {}
    for a in axes:
        by_status[a["status"]] = by_status.get(a["status"], 0) + 1
    f["axes_by_status"] = by_status
    f["axes_array_len"] = len(axes)
    f["counts_agree"] = (len(axes) == f["axes_total"]) if f["axes_total"] is not None and axes else None

    r = raw["root"]
    f["root"] = {
        "merkle_root": dig(r, "merkle_root", default=UNCHECKABLE),
        "card_count": dig(r, "card_count"),
        "as_of": dig(r, "as_of", default=UNCHECKABLE),
        "kind": dig(r, "kind", default=UNCHECKABLE),
        "did": dig(r, "did_intended", default=UNCHECKABLE),
        "signed": bool(dig(r, "sig_ed25519")),
        "sha256_list_len": len(dig(r, "card_sha256", default=[]) or []),
    }
    f["root"]["count_matches_list"] = (f["root"]["card_count"] == f["root"]["sha256_list_len"]) if r else None

    ci = raw["card_index"]
    f["card_index"] = {
        "n_cards": dig(ci, "n_cards"), "n_cells": dig(ci, "n_cells"),
        "pubkey": dig(ci, "pubkey", default=UNCHECKABLE), "packaged_at": dig(ci, "packaged_at", default=UNCHECKABLE),
        "list_len": len(dig(ci, "cards", default=[]) or []),
    }

    h = raw["hub"]
    f["hub"] = {
        "cells": dig(h, "counts", "cells"), "measured": dig(h, "counts", "measured"),
        "unmeasured": dig(h, "counts", "unmeasured"), "complete": dig(h, "counts", "complete"),
        "as_of": dig(h, "as_of", default=UNCHECKABLE), "population": dig(h, "population", default=""),
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
        "settlements": on.get("settlements"), "definition": on.get("definition", ""),
        "present": bool(on),
    }

    w = raw["witness"]
    witnessed_root = dig(w, "drift", "witness_artifact_merkle_root", default=None)
    live_now = f["root"]["merkle_root"]
    f["witness"] = {
        "as_of": dig(w, "as_of", default=UNCHECKABLE),
        "rekor_status": dig(w, "witnesses", "rekor", default=UNCHECKABLE),
        "ots_status": dig(w, "witnesses", "ots", default=UNCHECKABLE),
        "eas_status": dig(w, "witnesses", "eas_base", default=UNCHECKABLE),
        "drift_recorded": dig(w, "drift", "status", default=UNCHECKABLE),
        "drift_checked_at": dig(w, "drift", "checked_at", default=UNCHECKABLE),
        "witnessed_root": witnessed_root or UNCHECKABLE,
        # recomputed here, never copied: does the root the witness covers equal root.json as fetched now?
        "witnessed_equals_live_now": (witnessed_root == live_now) if (witnessed_root and live_now != UNCHECKABLE) else None,
        "conflict": dig(w, "conflict", "status", default=UNCHECKABLE),
        "sidecar": dig(w, "witness_sidecar", "url", default="https://councilof.ai/interop/root-witness-latest.json"),
    }

    a = raw["agent"]
    f["a2a"] = {"name": dig(a, "name", default=UNCHECKABLE), "skills": len(dig(a, "skills", default=[]) or []),
                "protocol_version": dig(a, "protocolVersion", default=None),
                "extensions": len(dig(a, "capabilities", "extensions", default=[]) or [])}

    x = raw["x402"]
    f["x402"] = {"schema": dig(x, "schema", default=UNCHECKABLE), "version": dig(x, "x402Version"),
                 "network": dig(x, "network", default=UNCHECKABLE), "mode": dig(x, "mode", default=UNCHECKABLE),
                 "resources": len(dig(x, "resources", default=[]) or []), "one_line": dig(x, "one_line", default="")}

    d = raw["did"]
    keys = {}
    for vm in dig(d, "verificationMethod", default=[]) or []:
        kid = (vm.get("id") or "").split("#")[-1]
        keys[kid] = dig(vm, "publicKeyJwk", "x", default=UNCHECKABLE)
    f["did"] = {"id": dig(d, "id", default=UNCHECKABLE), "keys": keys}

    p = raw["pypi"]
    f["pypi"] = {"version": dig(p, "info", "version", default=UNCHECKABLE), "license": dig(p, "info", "license", default=UNCHECKABLE)}
    n = raw["npm"]
    f["npm"] = {"version": dig(n, "dist-tags", "latest", default=UNCHECKABLE), "license": dig(n, "license", default=UNCHECKABLE)}

    zm, zs = raw["zenodo_method"], raw["zenodo_snapshot"]
    f["zenodo"] = {
        "method": {"doi": dig(zm, "doi", default=UNCHECKABLE), "title": dig(zm, "metadata", "title", default=UNCHECKABLE),
                   "date": dig(zm, "metadata", "publication_date", default=UNCHECKABLE), "concept": "10.5281/zenodo.21991104"},
        "snapshot": {"doi": dig(zs, "doi", default=UNCHECKABLE), "title": dig(zs, "metadata", "title", default=UNCHECKABLE),
                     "date": dig(zs, "metadata", "publication_date", default=UNCHECKABLE), "concept": "10.5281/zenodo.22344048"},
    }
    f["hf"] = {k: (len(raw[f"hf_{k}"]) if isinstance(raw[f"hf_{k}"], list) else None) for k in ("datasets", "spaces", "models")}
    return f


# --------------------------------------------------------------------------- render helpers

def n_or_unc(v):
    return UNCHECKABLE if v is None else str(v)


def badge(label: str, msg: str, link: str, colour: str = GREEN, logo: str | None = None) -> str:
    def enc(s: str) -> str:
        return str(s).replace("-", "--").replace("_", "__").replace(" ", "%20").replace("·", "%C2%B7")
    lg = f"&logo={logo}&logoColor=white" if logo else ""
    return f"[![{label}: {msg}](https://img.shields.io/badge/{enc(label)}-{enc(msg)}-{colour}?style=flat-square{lg})]({link})"


def badge_cluster(f: dict) -> str:
    b = [
        f"[![GSPC board — {f['lid']}](https://councilof.ai/badge/gspc.svg)](https://councilof.ai/api/gspc)",
        "",
        f"[![PyPI csoai-gspc](https://img.shields.io/pypi/v/csoai-gspc?style=flat-square&color={GREEN}&label=PyPI%20csoai--gspc)](https://pypi.org/project/csoai-gspc/)",
        f"[![npm csoai-gspc-mcp](https://img.shields.io/npm/v/csoai-gspc-mcp?style=flat-square&color={GREEN}&label=npm%20csoai--gspc--mcp)](https://www.npmjs.com/package/csoai-gspc-mcp)",
        "[![DOI methodology](https://zenodo.org/badge/DOI/10.5281/zenodo.21991104.svg)](https://doi.org/10.5281/zenodo.21991104)",
        "[![DOI board snapshot](https://zenodo.org/badge/DOI/10.5281/zenodo.22344048.svg)](https://doi.org/10.5281/zenodo.22344048)",
        badge("HF datasets", n_or_unc(f["hf"]["datasets"]), "https://huggingface.co/csoai", logo="huggingface"),
        badge("signed cards", n_or_unc(f["card_index"]["n_cards"]), "https://councilof.ai/signed/card_index.json"),
        badge("merkle root", short(f["root"]["merkle_root"]), "https://councilof.ai/root.json"),
        badge("Rekor witness", f["witness"]["rekor_status"], "https://councilof.ai/interop/root-witness-pointer.json",
              GREEN if f["witness"]["rekor_status"] == "WITNESSED" else GREY),
        badge("corrections ledger", n_or_unc(f["corrections"]["count"]), "https://councilof.ai/api/corrections"),
        badge("A2A agent card", f"{f['a2a']['skills']} skills", "https://councilof.ai/.well-known/agent.json"),
        badge("x402 manifest", f"v{n_or_unc(f['x402']['version'])} · {f['x402']['mode']}", "https://councilof.ai/.well-known/x402.json"),
        badge("License", "MIT", "https://github.com/CSOAI-ORG/councilof-ai/blob/master/LICENSE"),
    ]
    return "\n".join(b)


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
    foot = (f"\nCounted from the `axes` array at derive time: {f['axes_array_len']} rows — {st} — {agree}. "
            f"Separation over the {n_or_unc(f['separated_leads'] + f['ties'] + f['untested_separations'] if None not in (f['separated_leads'], f['ties'], f['untested_separations']) else None)} "
            f"model-comparison axes: SEPARATED {n_or_unc(f['separated_leads'])} · TIE {n_or_unc(f['ties'])} · UNTESTED {n_or_unc(f['untested_separations'])}. "
            "A TIE is not a win; UNTESTED is not a win; a facts run has no leader. "
            f"Living stamp: **{f['living_stamp_state']}** (`{f['living_stamp_signer']}`).")
    return "\n".join(rows) + "\n" + foot


def products_table(index_path: Path | None) -> str:
    """Products from docs/product/_INDEX.json — name + door URL + live door status. No prices."""
    if index_path is None or not index_path.exists():
        return f"_docs/product/_INDEX.json not present at generate time — {UNCHECKABLE}._"
    idx = json.loads(index_path.read_text())
    root = index_path.parent.parent.parent
    rows = ["| product | what you get | 402 door (live status at derive time) |", "|---|---|---|"]
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
            try:
                req = urllib.request.Request(door, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                    status = str(r.status)
            except urllib.error.HTTPError as e:  # 402 lands here
                status = str(e.code)
            except Exception:  # noqa: BLE001
                status = UNCHECKABLE
        door_cell = f"[`{door.replace('https://councilof.ai', '')}`]({door}) → **{status}**" if door else "—"
        rows.append(f"| `{sku['id']}` | {title} | {door_cell} |")
    rows.append("")
    rows.append(f"_{len(idx.get('skus', []))} SKUs read from `docs/product/_INDEX.json` (as_of {idx.get('as_of', UNCHECKABLE)}). "
                "A **402** means the door is metered by x402 and the amount appears only in that 402 challenge — never here, never on the board. "
                "Verification of every artefact is free._")
    return "\n".join(rows)


def integrity_table(f: dict) -> str:
    r, ci, w, c = f["root"], f["card_index"], f["witness"], f["corrections"]
    key = f["did"]["keys"].get("card-attestation-1", UNCHECKABLE)
    rows = [
        "| layer | live now | where |",
        "|---|---|---|",
        f"| Ed25519-signed measurement cards | **{n_or_unc(ci['n_cards'])}** cards (`n_cards == n_cells`: {ci['n_cards'] == ci['n_cells'] if ci['n_cards'] is not None else UNCHECKABLE}), one key `{short(ci['pubkey'], 8)}` = `did:web:csoai.org#card-attestation-1` | [`/signed/card_index.json`](https://councilof.ai/signed/card_index.json) · [how to verify](https://councilof.ai/signed/HOW-TO-VERIFY.md) |",
        f"| Signed public root (Merkle) | `{r['kind']}` · root `{short(r['merkle_root'], 12)}` · **{n_or_unc(r['card_count'])}** leaves (`card_count == len(card_sha256)`: {r['count_matches_list'] if r['count_matches_list'] is not None else UNCHECKABLE}) · as_of `{r['as_of']}` · signed: {r['signed']} | [`/root.json`](https://councilof.ai/root.json) · [how to verify the root](https://councilof.ai/signed/HOW-TO-VERIFY-ROOT.md) |",
        f"| Transparency-log witness | Rekor **{w['rekor_status']}** · OpenTimestamps `{w['ots_status']}` · EAS `{w['eas_status']}` · witnessed root `{short(w['witnessed_root'], 12)}` — equals live `root.json` at derive time: **{w['witnessed_equals_live_now'] if w['witnessed_equals_live_now'] is not None else UNCHECKABLE}** · pointer's own last drift check `{w['drift_recorded']}` at `{w['drift_checked_at']}` · conflict `{w['conflict']}` | [`/interop/root-witness-pointer.json`](https://councilof.ai/interop/root-witness-pointer.json) · [sidecar]({w['sidecar']}) |",
        f"| Living board stamp | **{f['living_stamp_state']}** under `{f['living_stamp_signer']}` | [`/api/gspc` → `measured_on.living_stamp`](https://councilof.ai/api/gspc) |",
        f"| Corrections ledger | **{n_or_unc(c['count'])}** entries · latest `{c['latest_id']}` ({c['latest_date']}) · signature_state **{c['signature_state']}** · {c['license']} | [`/api/corrections`](https://councilof.ai/api/corrections) |",
        f"| Third-party Hub cells | **{n_or_unc(f['hub']['cells'])}** cells: MEASURED {n_or_unc(f['hub']['measured'])} · UNMEASURED {n_or_unc(f['hub']['unmeasured'])} · complete read: {f['hub']['complete']} | [`/api/hub-cards`](https://councilof.ai/api/hub-cards) |",
        f"| Keys (DID) | `{f['did']['id']}` · {len(f['did']['keys'])} verification methods · card key x=`{short(key, 10)}` | [`/.well-known/did.json`](https://csoai.org/.well-known/did.json) |",
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


def header(f: dict) -> str:
    return (
        "# Council of AI — an independent AI-measurement body\n\n"
        f"> **{f['lid']}**\n>\n"
        "> We run AI systems against frozen, published instruments; grade deterministically; sign every result with Ed25519; "
        "publish a Merkle root and witness it in a public transparency log; and keep a public corrections ledger. "
        "**Measurement, not certification.** Verification is free and loginless. Nothing ranked pays us; we exclude our own models from public leader positions.\n\n"
        f"_derived {f['derived']} — every number on this page is read live from the URLs in "
        "[`scripts/github/org-readme.py`](https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/github/org-readme.py); "
        "if this file and the API disagree, the API is right._\n"
    )


def repos_table() -> str:
    # The six that carry the estate; descriptions are the live GitHub descriptions, re-read at derive time.
    six = ["councilof-ai", "gspc-board", "a2a-signed-receipts", "inspect-receipts", "corpus-watch", "carder"]
    rows = ["| repo | what it does |", "|---|---|"]
    for r in six:
        d = fetch_json(f"https://api.github.com/repos/{OWNER}/{r}") if os.environ.get("ORG_README_GH", "1") == "1" else None
        desc = (d or {}).get("description") or UNCHECKABLE
        rows.append(f"| [`{r}`](https://github.com/{OWNER}/{r}) | {desc} |")
    return "\n".join(rows)


def profile_md(f: dict, product_index: Path | None) -> str:
    parts = [
        header(f),
        badge_cluster(f),
        "",
        "## The board today",
        "",
        f"`GET https://councilof.ai/api/gspc` — schema `{f['schema']}` · `totals.public_count` = **{f['public_count']}** · "
        f"{n_or_unc(f['model_fleets'])} model fleets · {n_or_unc(f['fact_runs'])} fact runs · {n_or_unc(f['public_leader_count'])} public leader scores.",
        "",
        board_table(f),
        "",
        "## Integrity stack — every layer has a live URL",
        "",
        integrity_table(f),
        "",
        revenue_line(f),
        "",
        "## Verify in 4 curls",
        "",
        VERIFY_CURLS,
        "",
        "## Products (evidence artefacts behind an x402 door — never a grade, never a price on this page)",
        "",
        products_table(product_index),
        "",
        "## Repositories that carry the estate",
        "",
        repos_table(),
        "",
        "## Elsewhere",
        "",
        f"- **Hugging Face** [`csoai`](https://huggingface.co/csoai) — {n_or_unc(f['hf']['datasets'])} datasets (frozen banks, hub cards), {n_or_unc(f['hf']['spaces'])} Spaces, {n_or_unc(f['hf']['models'])} models",
        f"- **Zenodo** — methodology [{f['zenodo']['method']['concept']}](https://doi.org/{f['zenodo']['method']['concept']}) (this version `{f['zenodo']['method']['doi']}`, {f['zenodo']['method']['date']}) · board snapshot [{f['zenodo']['snapshot']['concept']}](https://doi.org/{f['zenodo']['snapshot']['concept']}) (this version `{f['zenodo']['snapshot']['doi']}`, {f['zenodo']['snapshot']['date']})",
        f"- **PyPI** [`csoai-gspc`](https://pypi.org/project/csoai-gspc/) {f['pypi']['version']} ({f['pypi']['license']}) · **npm** [`csoai-gspc-mcp`](https://www.npmjs.com/package/csoai-gspc-mcp) {f['npm']['version']} ({f['npm']['license']}) — stdio MCP server over the same endpoints",
        f"- **A2A** agent card [`/.well-known/agent.json`](https://councilof.ai/.well-known/agent.json) — `{f['a2a']['name']}`, {f['a2a']['skills']} skills · **x402** manifest [`/.well-known/x402.json`](https://councilof.ai/.well-known/x402.json) — `{f['x402']['schema']}`, network `{f['x402']['network']}`, mode `{f['x402']['mode']}`, {f['x402']['resources']} metered resources",
        "- **Honesty page** [councilof.ai/honesty](https://councilof.ai/honesty/) — our own models losing our own arena, published",
        "",
        "## Contributing",
        "",
        "- **Challenge a measurement:** open a [measurement challenge](https://github.com/CSOAI-ORG/.github/issues/new?template=measurement-challenge.yml) — cite the card id and the frozen bank row.",
        "- **Report a defect:** [defect template](https://github.com/CSOAI-ORG/.github/issues/new?template=defect.yml). Accepted defects land in the public [corrections ledger](https://councilof.ai/api/corrections), never in a silent edit.",
        "- **Code:** PRs into [`councilof-ai`](https://github.com/CSOAI-ORG/councilof-ai) run the same gates as a deploy (`pr-gates.yml`). Read [CONTRIBUTING](https://github.com/CSOAI-ORG/.github/blob/main/CONTRIBUTING.md) and [SECURITY](https://github.com/CSOAI-ORG/.github/blob/main/SECURITY.md).",
        "- **What we never do:** certify, sell a rank or early sight of a grade, remediate for a fee, or take money from anything we rank.",
        "",
        "---",
        "",
        f"<sub>CSOAI Ltd · UK Companies House 16939677 · 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · derived {f['derived']}</sub>",
        "",
    ]
    return "\n".join(parts)


BEGIN = "<!-- org-readme:begin (generated by scripts/github/org-readme.py — do not hand-edit; everything below the end marker is hand-maintained) -->"
END = "<!-- org-readme:end -->"


def councilof_top(f: dict, product_index: Path | None) -> str:
    parts = [
        BEGIN,
        "# Council of AI",
        "",
        f"> **{f['lid']}**",
        "",
        badge_cluster(f),
        "",
        "Independent AI-governance measurement. This repository is the live site, API and signing pipeline behind "
        "[councilof.ai](https://councilof.ai): the 22-axis GSPC board, Ed25519-signed measurement cards, the signed Merkle public root and its transparency-log witness, "
        "the corrections ledger, the A2A agent card, the x402 manifest, and the PyPI / npm readers. **Measurement, not certification.**",
        "",
        f"_derived {f['derived']} by `scripts/github/org-readme.py` — quote the API, not this file; if they disagree, the API is right._",
        "",
        "## The board today",
        "",
        f"`GET https://councilof.ai/api/gspc` — schema `{f['schema']}` · `totals.public_count` = **{f['public_count']}**",
        "",
        board_table(f),
        "",
        "## Integrity stack",
        "",
        integrity_table(f),
        "",
        revenue_line(f),
        "",
        "## Verify in 4 curls",
        "",
        VERIFY_CURLS,
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
        END,
    ]
    return "\n".join(parts)


def splice_councilof(readme: Path, f: dict, product_index: Path | None) -> None:
    txt = readme.read_text()
    block = councilof_top(f, product_index)
    if BEGIN in txt and END in txt:
        pre = txt[: txt.index(BEGIN)]
        post = txt[txt.index(END) + len(END):]
        new = pre + block + post
    else:
        # first run: everything from the top down to the hand-maintained "## Hosting and deploy" is replaced
        marker = "## Hosting and deploy"
        if marker not in txt:
            sys.exit("README.md has neither the org-readme markers nor '## Hosting and deploy'; refusing to guess")
        new = block + "\n\n" + txt[txt.index(marker):]
    readme.write_text(new)


# --------------------------------------------------------------------------- inventory

def gh_json(args: list[str]):
    p = subprocess.run(["gh", *args], capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip())
    return json.loads(p.stdout)


def inventory_md(f: dict, readme_sizes: dict | None = None) -> str:
    repos = gh_json(["repo", "list", OWNER, "--limit", "1000", "--visibility", "public", "--json",
                     "name,description,repositoryTopics,stargazerCount,forkCount,pushedAt,licenseInfo,isArchived,isFork,url,primaryLanguage,homepageUrl"])
    now = dt.datetime.now(dt.timezone.utc)
    rows = []
    flags_total = {"no_description": 0, "no_topics": 0, "no_licence": 0, "stale_60d": 0, "readme_missing": 0, "archived": 0, "fork": 0}
    for r in sorted(repos, key=lambda x: x["pushedAt"], reverse=True):
        pushed = dt.datetime.fromisoformat(r["pushedAt"].replace("Z", "+00:00"))
        age = (now - pushed).days
        topics = [t["name"] for t in (r.get("repositoryTopics") or [])]
        lic = (r.get("licenseInfo") or {}).get("key") or "—"
        rs = (readme_sizes or {}).get(r["name"])
        flags = []
        if not r.get("description"):
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
        desc = (r.get("description") or "").replace("|", "\\|")
        rows.append(f"| [{r['name']}]({r['url']}) | {desc} | {', '.join(topics) or '—'} | {r['stargazerCount']} | {r['pushedAt'][:10]} | "
                    f"{'—' if rs is None else rs} | {lic} | {(r.get('primaryLanguage') or {}).get('name') or '—'} | {' '.join(flags) or '—'} |")
    head = [
        f"# CSOAI-ORG public repository inventory — derived {f['derived']}",
        "",
        f"Account `{OWNER}` is a **user** account (GitHub `type: User`), not an organisation — see the note in `docs/github/`.",
        f"Public repos: **{len(repos)}**. Flags: {', '.join(f'{k} {v}' for k, v in flags_total.items())}.",
        "README bytes come from `GET /repos/{owner}/{repo}/readme` size (0 = no README file).",
        "",
        "| repo | description | topics | ★ | last push | README B | licence | lang | flags |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    return "\n".join(head + rows) + "\n"


# --------------------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--profile", action="store_true", help="print the profile README to stdout")
    ap.add_argument("--councilof", metavar="README", help="splice the generated top block into this councilof-ai README.md")
    ap.add_argument("--inventory", metavar="OUT.md", help="write the public repo inventory (needs gh)")
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
    if args.profile:
        sys.stdout.write(profile_md(f, product_index))
    if args.councilof:
        splice_councilof(Path(args.councilof), f, product_index)
        print(f"[org-readme] spliced {args.councilof}", file=sys.stderr)
    if args.inventory:
        sizes = json.loads(Path(args.readme_sizes).read_text()) if args.readme_sizes else None
        Path(args.inventory).write_text(inventory_md(f, sizes))
        print(f"[org-readme] wrote {args.inventory}", file=sys.stderr)


if __name__ == "__main__":
    main()
