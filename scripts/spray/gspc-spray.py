#!/usr/bin/env python3
"""gspc-spray.py — publish the live GSPC board to every distribution surface we hold a credential for.

    python3 scripts/spray/gspc-spray.py --all [--dry-run] [--force] [--report out.json]
    python3 scripts/spray/gspc-spray.py --hf --kaggle --github --zenodo --pypi --npm

ONE snapshot directory is built from LIVE truth and pushed, unchanged, to each surface:

    board.json      GET https://councilof.ai/api/gspc      — the bytes as served, untouched (so its own
                                                            site_attestation still verifies over them)
    root.json       GET https://councilof.ai/root.json     — the bytes as served, untouched
    SNAPSHOT.json   as_of · read_at · lid · sha256 of both · merkle root · card count · derived counts ·
                    frozen-bank row counts · the fingerprint that makes every push idempotent
    README.md       the lid (totals.lid, verbatim) · the axes with status and separation · honest counts ·
                    how a stranger verifies (gspc-verify, root.json inclusion, did:web key)
    gspc-axes.csv / gspc-axes.jsonl   one row per slot
    check-board.sh  re-derives the totals from the live array and recomputes the Merkle root
    manifest.jsonl  file · bytes · sha256

RULES this script enforces on itself
  * Every number is DERIVED at run time from the live GET, root.json and the frozen banks. Nothing is typed.
  * If /api/gspc (or root.json) cannot be read the script REFUSES to publish. Absent is not zero.
  * Idempotent: a surface already carrying this as_of, or this content fingerprint, is left alone
    (--force overrides the fingerprint check, never the as_of check).
  * Each push prints the LIVE URL and re-reads it until the as_of appears there, or reports that it did not.
  * No prices. Never "certified", "BFT" or "sovereign" — the README is scanned before anything is pushed.
  * Owner-gated actions are not taken: no accounts, no payments, no deletions outside the snapshot folder
    each surface owns, no email. npm is reported as BLOCKED (WebAuthn account needs a Bypass-2FA token).

Measurement, not certification.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent

BOARD_URL = "https://councilof.ai/api/gspc"
ROOT_URL = "https://councilof.ai/root.json"
DID_URL = "https://councilof.ai/.well-known/did.json"
VERIFY_URL = "https://councilof.ai/gspc-verify"
HOWTO_URL = "https://councilof.ai/signed/HOW-TO-VERIFY.md"
CARD_INDEX_URL = "https://councilof.ai/signed/card_index.json"
BANK_HOST = "https://huggingface.co/datasets/"

# long axis id -> short bank slug (the frozen banks live at csoai/gspc-<short>/items.jsonl).
# Used only as a CROSS-CHECK against the `dataset` slug the payload itself carries; a mismatch is reported.
LONG_TO_SHORT = {
    "governance": "gov", "safety": "agi", "provenance": "prv", "continuity": "asi",
    "conformance": "mcp", "openness": "oss", "machinery-conformity": "mach", "care": "care",
    "cross-reality": "xr", "detector-interop": "det", "art5-safeguard": "art5", "swarm": "swarm",
    "affect": "affect",
}

# Surfaces (verified 4 Sep 2026)
HF_DATASET = "csoai/gspc-board"
HF_SPACE = "csoai/gspc-board"          # the ONE living Space
HF_PATH_IN_REPO = "snapshot"
KAGGLE_ID = "nicktempleman/csoai-gspc-living-board"
GITHUB_REPO = "CSOAI-ORG/gspc-board"
ZENODO_CONCEPT = 22293340               # concept DOI 10.5281/zenodo.22293340 — board snapshots
ZENODO_METHODOLOGY_DOI = "10.5281/zenodo.21991104"   # referenced (isDerivedFrom) — NEVER modified
PYPI_PROJECT = "csoai-gspc"
NPM_PACKAGE = "csoai-gspc-mcp"

BANNED = re.compile(r"\b(certified|bft|sovereign)\b", re.IGNORECASE)
USER_AGENT = "csoai-gspc-spray/1 (+https://github.com/CSOAI-ORG/councilof-ai)"

GENERATOR = "scripts/spray/gspc-spray.py (CSOAI-ORG/councilof-ai)"


# ----------------------------------------------------------------------------------------------- helpers

def log(msg: str) -> None:
    print(msg, flush=True)


def http(url: str, *, method: str = "GET", data: bytes | None = None, headers: dict | None = None,
         timeout: float = 60.0) -> tuple[int, bytes, dict]:
    """Return (status, body, headers). Never raises on HTTP status; raises on transport failure."""
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"User-Agent": USER_AGENT, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers)


def fetch_ok(url: str, timeout: float = 60.0) -> bytes:
    status, body, _ = http(url, timeout=timeout)
    if status != 200:
        raise RuntimeError(f"GET {url} -> HTTP {status}")
    return body


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def wait_for(fn, *, tries: int = 12, delay: float = 5.0):
    """Call fn() until it returns a truthy value or tries run out. Returns the last value."""
    last = None
    for i in range(tries):
        try:
            last = fn()
        except Exception as e:  # noqa: BLE001 — a transient read failure is not a publish failure
            last = None
            log(f"    re-read attempt {i + 1}/{tries}: {e}")
        if last:
            return last
        time.sleep(delay)
    return last


def run(cmd: list[str], *, cwd: str | None = None, env: dict | None = None, check: bool = True) -> subprocess.CompletedProcess:
    p = subprocess.run(cmd, cwd=cwd, env=env, text=True, capture_output=True)
    if check and p.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd[:3])}... exit {p.returncode}\n{p.stdout[-2000:]}\n{p.stderr[-2000:]}")
    return p


# ------------------------------------------------------------------------------------------- live truth

class Refused(SystemExit):
    def __init__(self, why: str):
        super().__init__(f"REFUSED — will not publish: {why}")


def read_live_truth() -> dict:
    """Read the board, the root, the DID document and the frozen banks. Refuse if the board or root is unreadable."""
    log(f"[truth] GET {BOARD_URL}")
    try:
        board_bytes = fetch_ok(BOARD_URL)
        board = json.loads(board_bytes)
    except Exception as e:  # noqa: BLE001
        raise Refused(f"{BOARD_URL} unreadable ({e}). Absent is not zero.")
    if not isinstance(board.get("axes"), list) or not board["axes"] or not isinstance(board.get("totals"), dict):
        raise Refused(f"{BOARD_URL} answered but carries no axes/totals — not a board")
    lid = board["totals"].get("lid")
    if not lid:
        raise Refused("totals.lid is absent — there is no one-line description to publish")

    log(f"[truth] GET {ROOT_URL}")
    try:
        root_bytes = fetch_ok(ROOT_URL)
        root = json.loads(root_bytes)
    except Exception as e:  # noqa: BLE001
        raise Refused(f"{ROOT_URL} unreadable ({e}). A snapshot cannot say how to check inclusion without it.")
    for k in ("as_of", "card_count", "card_sha256", "merkle_root"):
        if k not in root:
            raise Refused(f"root.json lacks {k}")
    if len(root["card_sha256"]) != root["card_count"]:
        raise Refused(f"root.json card_count={root['card_count']} but len(card_sha256)={len(root['card_sha256'])} — "
                      "the root's own rule says reject this")

    log(f"[truth] GET {DID_URL}")
    did_keys: list[dict] | None
    try:
        did = json.loads(fetch_ok(DID_URL))
        did_keys = [{"id": vm.get("id"), "x": (vm.get("publicKeyJwk") or {}).get("x")}
                    for vm in did.get("verificationMethod", [])]
    except Exception as e:  # noqa: BLE001
        log(f"    did.json UNCHECKABLE: {e}")
        did_keys = None

    banks = read_banks(board["axes"])

    body_wo_att = {k: v for k, v in board.items() if k != "site_attestation"}
    board_content_sha = sha256_hex(canonical(body_wo_att))
    fingerprint = sha256_hex(f"{board_content_sha}|{root['merkle_root']}|{root['card_count']}".encode())

    return {
        "board": board, "board_bytes": board_bytes, "root": root, "root_bytes": root_bytes,
        "did_keys": did_keys, "banks": banks, "lid": lid,
        "as_of": root["as_of"], "read_at": utc_now(),
        "board_sha256": sha256_hex(board_bytes), "board_content_sha256": board_content_sha,
        "root_sha256": sha256_hex(root_bytes), "fingerprint": fingerprint,
    }


def read_banks(axes: list[dict]) -> list[dict]:
    """For every axis that names a dataset slug, try <bank_host><slug>/resolve/main/items.jsonl and count rows.
    Canary rows (rows made only of underscore fields such as `_canary`/`_note`) are counted separately; a per-item
    `_canary` marker on a real row does not make it a canary row. A bank with no items.jsonl is reported as such —
    it is not zero and not a failure of the axis."""
    out = []
    for a in axes:
        slug = a.get("dataset")
        axis = a.get("axis")
        row = {"axis": axis, "dataset": slug, "expected_short": LONG_TO_SHORT.get(axis),
               "items_url": None, "bank_state": None, "bank_rows": None, "bank_canary_rows": None,
               "slug_matches_map": None}
        if slug and row["expected_short"]:
            row["slug_matches_map"] = (slug == f"csoai/gspc-{row['expected_short']}")
        if not slug:
            row["bank_state"] = "NO_BANK_SLUG"
            out.append(row)
            continue
        url = f"{BANK_HOST}{slug}/resolve/main/items.jsonl"
        row["items_url"] = url
        try:
            status, body, _ = http(url, timeout=60)
        except Exception as e:  # noqa: BLE001
            row["bank_state"] = f"UNCHECKABLE ({e})"
            out.append(row)
            continue
        if status != 200:
            row["bank_state"] = "NO_ITEMS_JSONL" if status == 404 else f"HTTP_{status}"
            out.append(row)
            continue
        rows = canary = 0
        for line in body.decode("utf-8", "replace").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(obj, dict) and obj and all(k.startswith("_") for k in obj):   # a canary/note-only row
                canary += 1
            else:
                rows += 1
        row.update(bank_state="ITEMS_JSONL", bank_rows=rows, bank_canary_rows=canary)
        log(f"    bank {slug}: {rows} rows (+{canary} canary)")
        out.append(row)
    return out


# --------------------------------------------------------------------------------------------- snapshot

def derive_counts(board: dict) -> dict:
    axes = board["axes"]
    by_status: dict[str, int] = {}
    by_family: dict[str, int] = {}
    by_kind: dict[str, int] = {}
    by_sep: dict[str, int] = {}
    leader_state: dict[str, int] = {}
    for a in axes:
        by_status[a.get("status") or "ABSENT"] = by_status.get(a.get("status") or "ABSENT", 0) + 1
        by_family[a.get("family") or "?"] = by_family.get(a.get("family") or "?", 0) + 1
        by_kind[a.get("kind") or "?"] = by_kind.get(a.get("kind") or "?", 0) + 1
        if a.get("kind") == "model-comparison":
            by_sep[a.get("separation") or "ABSENT"] = by_sep.get(a.get("separation") or "ABSENT", 0) + 1
            st = a.get("public_leader_state") or ("SHOWN" if a.get("leader") else "ABSENT")
            leader_state[st] = leader_state.get(st, 0) + 1
    t = board["totals"]
    return {
        "slots": len(axes),
        "by_status": by_status,
        "by_family": by_family,
        "by_kind": by_kind,
        "separation_over_model_comparison": by_sep,
        "public_leader_state_over_model_comparison": leader_state,
        "printed_totals": {k: t.get(k) for k in ("axes", "measured_axes", "unmeasured_axes", "public_count",
                                                  "comparison_axes", "separated_leads", "ties",
                                                  "untested_separations", "public_leader_count", "items")},
        "printed_agrees_with_array": (t.get("axes") == len(axes)
                                      and t.get("measured_axes") == by_status.get("MEASURED", 0)),
    }


def axis_rows(board: dict, banks: list[dict]) -> list[dict]:
    bank_by_axis = {b["axis"]: b for b in banks}
    rows = []
    for a in board["axes"]:
        b = bank_by_axis.get(a.get("axis"), {})
        slug = a.get("dataset")
        rows.append({
            "axis": a.get("axis"), "family": a.get("family"), "kind": a.get("kind"),
            "bench": a.get("bench"), "task": a.get("task"), "n": a.get("n"),
            "status": a.get("status"), "separation": a.get("separation"),
            "public_leader_state": a.get("public_leader_state"),
            "leader": a.get("leader") if not a.get("public_leader_state") else None,
            "accuracy": a.get("accuracy") if not a.get("public_leader_state") else None,
            "fleet_mean": a.get("fleet_mean"),
            "dataset": slug, "dataset_url": (BANK_HOST + slug) if slug else None,
            "bank_state": b.get("bank_state"), "bank_rows": b.get("bank_rows"),
        })
    return rows


def render_readme(tr: dict, counts: dict, rows: list[dict]) -> str:
    board, root = tr["board"], tr["root"]
    t = board["totals"]
    as_of, read_at, lid = tr["as_of"], tr["read_at"], tr["lid"]
    n_model = counts["by_kind"].get("model-comparison", 0)
    n_fact = counts["by_kind"].get("deterministic-facts", 0)
    st = counts["by_status"]
    sep = counts["separation_over_model_comparison"]
    ls = counts["public_leader_state_over_model_comparison"]
    banks_ok = [b for b in tr["banks"] if b["bank_state"] == "ITEMS_JSONL"]
    banks_mapped = [b for b in tr["banks"] if b["expected_short"]]
    banks_mismatch = [b for b in banks_mapped if b["slug_matches_map"] is False]
    bank_rows_total = sum(b["bank_rows"] or 0 for b in banks_ok)

    def cell(v):
        return "—" if v is None or v == "" else str(v)

    lines = []
    lines.append(f"# GSPC board — snapshot as of {as_of}")
    lines.append("")
    lines.append(f"**{lid}**")
    lines.append("")
    lines.append(f"`GET {BOARD_URL}` is the authority. This is a snapshot of that GET, read at `{read_at}`, "
                 f"aligned to the transparency root `root.json` published at `{as_of}`. If the live GET and these "
                 "files disagree, the live GET wins. A fetch that fails is `UNCHECKABLE` — never a fabricated `0`.")
    lines.append("")
    lines.append("**Measurement, not certification.** A TIE is never a win. An empty slot is a finding, not a zero. "
                 "No slot is for sale.")
    lines.append("")
    lines.append("## Honest counts — derived from the `axes` array in `board.json`, never typed")
    lines.append("")
    lines.append(f"- slots on the board: **{counts['slots']}**")
    lines.append("- by status: " + " · ".join(f"**{k}** {v}" for k, v in sorted(st.items())))
    lines.append(f"- model-comparison axes (a fleet answers a frozen bank, graded deterministically): **{n_model}** · "
                 f"deterministic-fact axes (public ledgers and series; no model, no leader, no accuracy): **{n_fact}**")
    lines.append("- separation, over the model-comparison axes only: "
                 + " · ".join(f"**{k}** {v}" for k, v in sorted(sep.items()))
                 + " — a TIE is not a separated leader; UNTESTED is not a win either")
    lines.append("- public leader, over the model-comparison axes: "
                 + " · ".join(f"**{k}** {v}" for k, v in sorted(ls.items()))
                 + " (EXCLUDED_OWN_MODEL: our own council specialist led and is not ranked against the vendors we "
                   "measure; NO_SIGNED_CARD: the leading external model has no signed card in the public index, "
                   "so no leader is asserted)")
    lines.append(f"- the payload's own `totals` block prints `public_count` = \"{t.get('public_count')}\" — "
                 + ("**agrees** with the array" if counts["printed_agrees_with_array"]
                    else "**DISAGREES** with the array (see SNAPSHOT.json `counts.printed_totals`)"))
    lines.append(f"- rows behind the board (`totals.items`, the sum of each axis's n): {cell(t.get('items'))}")
    lines.append(f"- transparency root: `card_count` **{root['card_count']}** signed cards, `merkle_root` "
                 f"`{root['merkle_root']}`, `as_of` `{as_of}`")
    lines.append(f"- frozen banks: {len(banks_ok)} of the {len(tr['banks'])} slots that name a dataset resolve an "
                 f"`items.jsonl` ({bank_rows_total} rows in total, canary rows excluded); the others carry their bank "
                 "in another file or are fact axes with pointers, not items — see the table")
    if banks_mismatch:
        lines.append("- **bank slug cross-check:** " + ", ".join(
            f"`{b['axis']}` names `{b['dataset']}` but the long→short map expects `csoai/gspc-{b['expected_short']}`"
            for b in banks_mismatch))
    else:
        lines.append(f"- bank slug cross-check: all {len(banks_mapped)} mapped axes name the expected `csoai/gspc-<short>` slug")
    lines.append("")
    lines.append(f"## The {counts['slots']} axes")
    lines.append("")
    lines.append("| axis | family | kind | bench | n | status | separation | public leader | frozen bank | bank rows |")
    lines.append("|---|---|---|---|---:|---|---|---|---|---:|")
    for r in rows:
        leader = r["public_leader_state"] or (r["leader"] or "—")
        bank = f"[{r['dataset']}]({r['dataset_url']})" if r["dataset"] else "—"
        brows = r["bank_rows"] if r["bank_state"] == "ITEMS_JSONL" else cell(r["bank_state"])
        lines.append(f"| `{r['axis']}` | {cell(r['family'])} | {cell(r['kind'])} | {cell(r['bench'])} | {cell(r['n'])} | "
                     f"{cell(r['status'])} | {cell(r['separation'])} | {leader} | {bank} | {brows} |")
    lines.append("")
    lines.append("Per-axis numbers name the board LEADER where one is shown; `fleet_mean` (in `board.json`) shows the "
                 "fleet, not the leader. Fact axes have no leader and no accuracy: measured is not the same as scored. "
                 "`n` is the graded count the board carries; `bank rows` is what the frozen `items.jsonl` holds today, canary "
                 "rows excluded — the two need not be equal, and a difference is reported, not reconciled here.")
    lines.append("")
    lines.append("## How to verify — a stranger, no account, no CSOAI code beyond `curl` and `python3`")
    lines.append("")
    lines.append("1. **The board's totals are derived, not typed.** `./check-board.sh` fetches the live GET, recounts "
                 "the slots and the MEASURED axes from the array, and fails loudly on any disagreement.")
    lines.append(f"2. **One measurement.** Every measurement is an Ed25519-signed card. Paste it into "
                 f"<{VERIFY_URL}> (free, no account) or follow <{HOWTO_URL}> and check by hand. From Python: "
                 f"`pip install \"csoai-gspc[verify]\"` then `csoai-gspc verify <card_id>` — three states only: "
                 "VALID, INVALID, UNCHECKABLE.")
    lines.append(f"3. **Root inclusion.** `root.json` lists `card_sha256[]` for every published card and commits to them "
                 f"in `merkle_root`. `./check-board.sh` recomputes that root from the list using the rule the root "
                 f"states for itself — leaf: {json.dumps(root.get('leaf_definition'))}; node: "
                 f"{json.dumps(root.get('node_definition'))}. A verifier MUST reject any presentation where "
                 "`len(card_sha256) != card_count`, and any inclusion proof with `index >= card_count`. A card is "
                 "included when its sha256 appears in the list and the recomputed root matches.")
    lines.append(f"4. **Keys.** Signatures resolve through `did:web:csoai.org` → <{DID_URL}>. The board's "
                 f"`site_attestation.signer` is `{(board.get('site_attestation') or {}).get('signer', 'ABSENT')}`; the root's "
                 f"`did_intended` is `{root.get('did_intended')}`; cards sign under the card-attestation key in the same "
                 "document. Pin against the DID document, never against the key a card ships with.")
    if tr["did_keys"] is None:
        lines.append("   - did.json was UNCHECKABLE at read time; the key ids above are quoted from the payloads only.")
    else:
        lines.append("   - key ids present in did.json at read time: " + ", ".join(f"`{k['id']}`" for k in tr["did_keys"]))
    lines.append("")
    lines.append("## Files")
    lines.append("")
    lines.append("| file | what |")
    lines.append("|---|---|")
    lines.append(f"| `board.json` | the whole live GET, byte-for-byte (sha256 `{tr['board_sha256']}`) |")
    lines.append(f"| `root.json` | the transparency root, byte-for-byte (sha256 `{tr['root_sha256']}`) |")
    lines.append("| `SNAPSHOT.json` | as_of, read_at, digests, derived counts, bank rows, and the fingerprint every surface is keyed on |")
    lines.append("| `gspc-axes.csv` / `gspc-axes.jsonl` | one row per slot |")
    lines.append("| `check-board.sh` | re-derive the totals and the Merkle root yourself |")
    lines.append("| `manifest.jsonl` | file, bytes, sha256 |")
    lines.append("")
    lines.append("## Everywhere this snapshot lives")
    lines.append("")
    lines.append(f"- Live board: <{BOARD_URL}> · transparency root: <{ROOT_URL}>")
    lines.append(f"- Hugging Face: <https://huggingface.co/spaces/{HF_SPACE}> (the living Space) · "
                 f"<https://huggingface.co/datasets/{HF_DATASET}> (folder `{HF_PATH_IN_REPO}/`) · every frozen bank as its "
                 "own repository under <https://huggingface.co/csoai>")
    lines.append(f"- Kaggle: <https://www.kaggle.com/datasets/{KAGGLE_ID}>")
    lines.append(f"- GitHub mirror: <https://github.com/{GITHUB_REPO}>")
    lines.append(f"- Zenodo (this snapshot series, one version per changed board): concept DOI "
                 f"<https://doi.org/10.5281/zenodo.{ZENODO_CONCEPT}> · methodology record: "
                 f"<https://doi.org/{board.get('doi') or ZENODO_METHODOLOGY_DOI}>")
    lines.append(f"- PyPI reader and card verifier: <https://pypi.org/project/{PYPI_PROJECT}/> · MCP server on npm: "
                 f"`{NPM_PACKAGE}` (`npm view {NPM_PACKAGE} version` is the authority for its version)")
    lines.append("")
    lines.append("## What this is not")
    lines.append("")
    lines.append("Not a certification, not a rating, not an endorsement, not legal advice. A card is evidence of what "
                 "specific bytes scored on a frozen bank at a specific time. Measurement, not certification.")
    lines.append("")
    lines.append(f"Issuer: {board.get('issuer', 'CSOAI Ltd')}. Board data licence as printed by the payload: "
                 f"`{t.get('license', 'ABSENT')}`. Generated by `{GENERATOR}`; fingerprint `{tr['fingerprint']}`.")
    lines.append("")
    return "\n".join(lines)


CHECK_BOARD_SH = r'''#!/usr/bin/env bash
# Re-check the board yourself. No account, no key, no CSOAI code beyond curl and python3.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
echo "== live board =="
curl -fsS https://councilof.ai/api/gspc | python3 -c '
import json,sys
d=json.load(sys.stdin); t=d["totals"]
print("lid     :", t.get("lid"))
print("slots   :", t["axes"])
print("measured:", t["measured_axes"])
print("public  :", t["public_count"])
derived_measured = sum(1 for a in d["axes"] if a["status"]=="MEASURED")
print("derived from the axis array:", len(d["axes"]), "slots,", derived_measured, "measured")
assert len(d["axes"])==t["axes"], "slot count does not match the axis array"
assert derived_measured==t["measured_axes"], "measured count does not match the axis array"
print("OK - the printed totals are derived from the array, not typed")
'
echo
echo "== transparency root: recompute the Merkle root from card_sha256[] =="
curl -fsS https://councilof.ai/root.json | python3 -c '
import hashlib,json,sys
r=json.load(sys.stdin)
leaves=[bytes.fromhex(h) for h in r["card_sha256"]]
assert len(leaves)==r["card_count"], "REJECT: len(card_sha256) != card_count"
level=leaves
while len(level)>1:
    if len(level)%2==1: level=level+[level[-1]]   # odd node paired with itself, as root.json states
    level=[hashlib.sha256(level[i]+level[i+1]).digest() for i in range(0,len(level),2)]
root=level[0].hex() if level else None
print("as_of      :", r["as_of"])
print("card_count :", r["card_count"])
print("merkle_root:", r["merkle_root"])
print("recomputed :", root)
assert root==r["merkle_root"], "REJECT: recomputed root differs from merkle_root"
print("OK - the root commits to exactly these", r["card_count"], "cards")
'
echo
if [ -f "$HERE/SNAPSHOT.json" ]; then
  echo "== this snapshot vs live =="
  python3 - "$HERE/SNAPSHOT.json" <<'PY'
import json,sys,urllib.request
s=json.load(open(sys.argv[1]))
live=json.load(urllib.request.urlopen(urllib.request.Request("https://councilof.ai/root.json", headers={"User-Agent": "check-board.sh"})))
print("snapshot as_of:", s["as_of"], "| live as_of:", live["as_of"])
print("snapshot root :", s["merkle_root"])
print("live root     :", live["merkle_root"])
print("SAME" if s["merkle_root"]==live["merkle_root"] else "MOVED - the live board has changed since this snapshot; the live GET wins")
PY
fi
echo
echo "Verify any single card (free, no account): https://councilof.ai/gspc-verify"
echo "By hand: https://councilof.ai/signed/HOW-TO-VERIFY.md"
'''


def build_snapshot(tr: dict, out: Path) -> Path:
    out.mkdir(parents=True, exist_ok=True)
    counts = derive_counts(tr["board"])
    rows = axis_rows(tr["board"], tr["banks"])
    readme = render_readme(tr, counts, rows)
    hit = BANNED.search(readme)
    if hit:
        raise Refused(f"README would carry the word {hit.group(0)!r} — not publishing")

    (out / "board.json").write_bytes(tr["board_bytes"])
    (out / "root.json").write_bytes(tr["root_bytes"])
    (out / "README.md").write_text(readme, encoding="utf-8")
    with (out / "gspc-axes.jsonl").open("w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    with (out / "gspc-axes.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    (out / "check-board.sh").write_text(CHECK_BOARD_SH, encoding="utf-8")
    os.chmod(out / "check-board.sh", 0o755)

    snap = {
        "kind": "csoai.gspc-spray-snapshot/1",
        "as_of": tr["as_of"], "read_at": tr["read_at"], "lid": tr["lid"],
        "board_url": BOARD_URL, "root_url": ROOT_URL,
        "board_sha256": tr["board_sha256"], "board_content_sha256": tr["board_content_sha256"],
        "root_sha256": tr["root_sha256"],
        "merkle_root": tr["root"]["merkle_root"], "card_count": tr["root"]["card_count"],
        "did_intended": tr["root"].get("did_intended"),
        "board_signer": (tr["board"].get("site_attestation") or {}).get("signer"),
        "fingerprint": tr["fingerprint"],
        "fingerprint_rule": "sha256(board_content_sha256 | merkle_root | card_count); board_content_sha256 = sha256 of "
                            "canonical JSON (sorted keys, no whitespace, UTF-8 literal) of board.json minus site_attestation",
        "counts": counts, "banks": tr["banks"], "did_keys": tr["did_keys"],
        "generator": GENERATOR,
        "note": "Snapshot of a live GET. The live GET is the authority. Measurement, not certification.",
    }
    (out / "SNAPSHOT.json").write_text(json.dumps(snap, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    with (out / "manifest.jsonl").open("w", encoding="utf-8") as fh:
        for p in sorted(out.iterdir()):
            if p.name == "manifest.jsonl":
                continue
            b = p.read_bytes()
            fh.write(json.dumps({"file": p.name, "bytes": len(b), "sha256": sha256_hex(b)}) + "\n")
    log(f"[snapshot] built {out} — as_of {tr['as_of']} · fingerprint {tr['fingerprint'][:16]}…")
    return out


SNAPSHOT_FILES = ("README.md", "board.json", "root.json", "SNAPSHOT.json", "gspc-axes.csv", "gspc-axes.jsonl",
                  "check-board.sh", "manifest.jsonl")


# ---------------------------------------------------------------------------------------------- results

def result(surface: str, status: str, url: str | None = None, as_of_seen: str | None = None,
           detail: str | None = None) -> dict:
    r = {"surface": surface, "status": status, "url": url, "as_of_seen": as_of_seen, "detail": detail}
    log(f"[{surface}] {status}" + (f" — {url}" if url else "") + (f" — as_of seen: {as_of_seen}" if as_of_seen else "")
        + (f"\n    {detail}" if detail else ""))
    return r


def remote_snapshot(url: str) -> dict | None:
    """Read a SNAPSHOT.json that a surface already carries. None when absent or unreadable."""
    try:
        status, body, _ = http(url, timeout=30)
        if status == 200:
            return json.loads(body)
    except Exception:  # noqa: BLE001
        pass
    return None


def unchanged(remote: dict | None, tr: dict, force: bool) -> str | None:
    """Return a reason string when the surface already carries this snapshot."""
    if not remote:
        return None
    if remote.get("as_of") == tr["as_of"]:
        return f"already carries as_of {tr['as_of']}"
    if not force and remote.get("fingerprint") == tr["fingerprint"]:
        return (f"already carries fingerprint {tr['fingerprint'][:16]}… (its as_of {remote.get('as_of')}; the board and "
                "root are unchanged, only the root's clock moved) — use --force to republish")
    return None


# -------------------------------------------------------------------------------------------- surfaces

def spray_hf(tr: dict, snap: Path, *, dry_run: bool, force: bool) -> list[dict]:
    out = []
    try:
        from huggingface_hub import HfApi  # noqa: PLC0415
    except ImportError:
        return [result("hf", "FAILED", detail="huggingface_hub is not installed (pip install huggingface_hub)")]
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN") or None
    api = HfApi(token=token)
    try:
        who = api.whoami()
        log(f"[hf] authenticated as {who.get('name')} (orgs: {[o.get('name') for o in who.get('orgs', [])]})")
    except Exception as e:  # noqa: BLE001
        return [result("hf", "BLOCKED", detail=f"no working Hugging Face credential: {e}")]

    targets = [("dataset", HF_DATASET, f"https://huggingface.co/datasets/{HF_DATASET}"),
               ("space", HF_SPACE, f"https://huggingface.co/spaces/{HF_SPACE}")]
    for repo_type, repo_id, page in targets:
        name = f"hf-{repo_type}"
        raw = f"{page}/resolve/main/{HF_PATH_IN_REPO}/SNAPSHOT.json"
        why = unchanged(remote_snapshot(raw), tr, force)
        if why:
            out.append(result(name, "UNCHANGED", f"{page}/tree/main/{HF_PATH_IN_REPO}", tr["as_of"], why))
            continue
        if dry_run:
            out.append(result(name, "DRY-RUN", f"{page}/tree/main/{HF_PATH_IN_REPO}", detail="would upload_folder"))
            continue
        try:
            api.upload_folder(folder_path=str(snap), path_in_repo=HF_PATH_IN_REPO, repo_id=repo_id, repo_type=repo_type,
                              commit_message=f"gspc-spray: board snapshot as_of {tr['as_of']}",
                              delete_patterns=[f"{HF_PATH_IN_REPO}/*"])
        except Exception as e:  # noqa: BLE001
            out.append(result(name, "FAILED", page, detail=f"upload_folder: {e}"))
            continue
        seen = wait_for(lambda: (remote_snapshot(raw) or {}).get("as_of") == tr["as_of"] and tr["as_of"])
        out.append(result(name, "PUBLISHED" if seen else "PUBLISHED-UNCONFIRMED",
                          f"{page}/tree/main/{HF_PATH_IN_REPO}", seen or None,
                          None if seen else f"re-read of {raw} did not show as_of {tr['as_of']} yet"))
    return out


def spray_kaggle(tr: dict, snap: Path, *, dry_run: bool, force: bool) -> list[dict]:
    page = f"https://www.kaggle.com/datasets/{KAGGLE_ID}"
    kaggle = shutil.which("kaggle")
    have_env = bool(os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY"))
    have_file = (Path.home() / ".kaggle" / "kaggle.json").exists()
    if not kaggle:
        return [result("kaggle", "FAILED", page, detail="kaggle CLI is not installed (pip install kaggle)")]
    if not (have_env or have_file):
        return [result("kaggle", "BLOCKED", page, detail="no Kaggle credential: neither KAGGLE_USERNAME/KAGGLE_KEY nor ~/.kaggle/kaggle.json")]

    def read_meta() -> dict | None:
        with tempfile.TemporaryDirectory() as d:
            p = run([kaggle, "datasets", "metadata", KAGGLE_ID, "-p", d], check=False)
            f = Path(d) / "dataset-metadata.json"
            if f.exists():
                return json.loads(f.read_text())
            log(f"    kaggle metadata: {p.stdout[-300:]} {p.stderr[-300:]}")
            return None

    meta = read_meta()
    if meta is None:
        return [result("kaggle", "FAILED", page, detail="could not read the dataset's metadata (credential or dataset missing)")]
    info = meta.get("info", meta)
    desc_old = info.get("description") or ""
    m = re.search(r"spray-fingerprint: ([0-9a-f]{64})", desc_old)
    remote = {"as_of": (re.search(r"as_of ([0-9TZ:\-]+)", info.get("subtitle") or "") or [None, None])[1],
              "fingerprint": m.group(1) if m else None}
    why = unchanged(remote, tr, force)
    if why:
        return [result("kaggle", "UNCHANGED", page, tr["as_of"], why)]

    subtitle = f"Snapshot of GET councilof.ai/api/gspc · as_of {tr['as_of']}"
    assert 20 <= len(subtitle) <= 80, f"Kaggle subtitle must be 20–80 chars, got {len(subtitle)}"
    keywords = (info.get("keywords") or ["government", "law", "artificial intelligence", "internet", "benchmark"])[:5]
    licenses = info.get("licenses") or [{"name": "CC0-1.0"}]
    description = (
        f"{tr['lid']}\n\n"
        f"AUTHORITY: GET {BOARD_URL}. This Kaggle copy is a snapshot read at {tr['read_at']}, aligned to the transparency "
        f"root published at {tr['as_of']}. If the live GET and these files disagree, the live GET wins. A fetch that fails "
        "is UNCHECKABLE, never a fabricated 0.\n\n"
        "FILES: board.json (the whole GET, unmodified) · root.json (the transparency root, unmodified) · SNAPSHOT.json "
        "(digests, derived counts, bank rows) · gspc-axes.csv / .jsonl (one row per slot) · check-board.sh (re-derive the "
        "totals and the Merkle root yourself) · README.md (the axes, the counts, how to verify).\n\n"
        f"VERIFY: {VERIFY_URL} (free, no account) · {HOWTO_URL} · pip install \"csoai-gspc[verify]\" then csoai-gspc verify "
        f"<card_id> · keys resolve via did:web:csoai.org ({DID_URL}).\n\n"
        "Not a certification, not a rating, not an endorsement, not legal advice. Measurement, not certification.\n\n"
        f"Methodology DOI: https://doi.org/{ZENODO_METHODOLOGY_DOI} · snapshot series: https://doi.org/10.5281/zenodo.{ZENODO_CONCEPT}\n"
        f"Issuer: {tr['board'].get('issuer', 'CSOAI Ltd')}.\n\n"
        f"spray-fingerprint: {tr['fingerprint']}"
    )
    if BANNED.search(description):
        return [result("kaggle", "FAILED", page, detail="description would carry a banned word")]
    if dry_run:
        return [result("kaggle", "DRY-RUN", page, detail=f"would push a new version, subtitle {subtitle!r}")]
    with tempfile.TemporaryDirectory() as d:
        for f in SNAPSHOT_FILES:
            shutil.copy2(snap / f, Path(d) / f)
        (Path(d) / "dataset-metadata.json").write_text(json.dumps({
            "id": KAGGLE_ID, "title": info.get("title") or "GSPC living board", "subtitle": subtitle,
            "description": description, "keywords": keywords, "licenses": licenses,
        }, ensure_ascii=False, indent=1))
        p = run([kaggle, "datasets", "version", "-p", d, "-m", f"gspc-spray: board snapshot as_of {tr['as_of']}",
                 "-t", "-r", "skip"], check=False)
        if p.returncode != 0:
            return [result("kaggle", "FAILED", page, detail=f"kaggle datasets version: {p.stdout[-500:]} {p.stderr[-500:]}")]
        log(f"    {p.stdout.strip()[-200:]}")
    seen = wait_for(lambda: (tr["as_of"] in ((read_meta() or {}).get("info", {}).get("subtitle") or "")) and tr["as_of"],
                    tries=12, delay=10)
    return [result("kaggle", "PUBLISHED" if seen else "PUBLISHED-UNCONFIRMED", page, seen or None,
                   None if seen else "version pushed; metadata re-read did not show the new subtitle yet (Kaggle processes versions asynchronously)")]


def github_token() -> str | None:
    for k in ("GSPC_BOARD_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"):
        if os.environ.get(k):
            return os.environ[k]
    gh = shutil.which("gh")
    if gh:
        p = run([gh, "auth", "token"], check=False)
        if p.returncode == 0 and p.stdout.strip():
            return p.stdout.strip()
    return None


def spray_github(tr: dict, snap: Path, *, dry_run: bool, force: bool) -> list[dict]:
    page = f"https://github.com/{GITHUB_REPO}"
    api = f"https://api.github.com/repos/{GITHUB_REPO}"
    token = github_token()
    if not token:
        return [result("github", "BLOCKED", page, detail="no GitHub token (GSPC_BOARD_TOKEN / GH_TOKEN / GITHUB_TOKEN / gh auth)")]
    hdr = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28"}

    def remote() -> dict | None:
        status, body, _ = http(f"{api}/contents/SNAPSHOT.json", headers=hdr, timeout=30)
        return json.loads(body) if status == 200 else None

    why = unchanged(remote(), tr, force)
    if why:
        return [result("github", "UNCHANGED", page, tr["as_of"], why)]
    if dry_run:
        return [result("github", "DRY-RUN", page, detail="would commit the snapshot files and push main")]

    with tempfile.TemporaryDirectory() as d:
        clone = Path(d) / "repo"
        url = f"https://x-access-token:{token}@github.com/{GITHUB_REPO}.git"
        try:
            run(["git", "clone", "--depth", "1", "--quiet", url, str(clone)])
        except RuntimeError as e:
            return [result("github", "FAILED", page, detail=str(e).replace(token, "***"))]
        for f in SNAPSHOT_FILES:
            shutil.copy2(snap / f, clone / f)
        stale = clone / "board-snapshot.json"   # the pre-spray name; a stale copy must not sit beside the live one
        if stale.exists():
            run(["git", "rm", "-q", "board-snapshot.json"], cwd=str(clone))
        run(["git", "add", "-A"], cwd=str(clone))
        if run(["git", "status", "--porcelain"], cwd=str(clone)).stdout.strip() == "":
            return [result("github", "UNCHANGED", page, tr["as_of"], "working tree identical after copy")]
        env = {**os.environ, "GIT_AUTHOR_NAME": "CSOAI", "GIT_AUTHOR_EMAIL": "nicholas@csoai.org",
               "GIT_COMMITTER_NAME": "CSOAI", "GIT_COMMITTER_EMAIL": "nicholas@csoai.org"}
        run(["git", "commit", "-q", "-m", f"gspc-spray: board snapshot as_of {tr['as_of']}\n\n{tr['lid']}\n\n"
             f"fingerprint {tr['fingerprint']}"], cwd=str(clone), env=env)
        try:
            run(["git", "push", "-q", "origin", "HEAD"], cwd=str(clone), env=env)
        except RuntimeError as e:
            return [result("github", "FAILED", page, detail=str(e).replace(token, "***"))]

    # Topics: keep whatever is there and make sure the discoverability set is present (metadata only, nothing asserted).
    want = {"gspc", "ai-governance", "ai-safety", "measurement", "attestation", "ed25519", "eu-ai-act", "open-data",
            "provenance", "transparency", "llm-evaluation", "benchmark", "council-of-ai", "signed-evidence"}
    status, body, _ = http(f"{api}/topics", headers={**hdr, "Accept": "application/vnd.github+json"}, timeout=30)
    have = set(json.loads(body).get("names", [])) if status == 200 else set()
    if not want <= have:
        http(f"{api}/topics", method="PUT", data=json.dumps({"names": sorted(have | want)}).encode(),
             headers={**hdr, "Accept": "application/vnd.github+json", "Content-Type": "application/json"}, timeout=30)
    seen = wait_for(lambda: (remote() or {}).get("as_of") == tr["as_of"] and tr["as_of"], tries=6, delay=5)
    return [result("github", "PUBLISHED" if seen else "PUBLISHED-UNCONFIRMED", page, seen or None,
                   None if seen else "pushed; contents API did not return the new SNAPSHOT.json yet")]


def zenodo_token() -> str | None:
    if os.environ.get("ZENODO_TOKEN"):
        return os.environ["ZENODO_TOKEN"].strip()
    f = Path.home() / ".zenodo_token"
    return f.read_text().strip() if f.exists() else None


def spray_zenodo(tr: dict, snap: Path, *, dry_run: bool, force: bool) -> list[dict]:
    concept_url = f"https://doi.org/10.5281/zenodo.{ZENODO_CONCEPT}"
    token = zenodo_token()
    if not token:
        return [result("zenodo", "BLOCKED", concept_url, detail="no Zenodo token (ZENODO_TOKEN or ~/.zenodo_token)")]
    Z = "https://zenodo.org/api"
    auth = {"Authorization": f"Bearer {token}"}
    jh = {**auth, "Content-Type": "application/json"}

    status, body, _ = http(f"{Z}/records?q=conceptrecid:{ZENODO_CONCEPT}&all_versions=true&size=25&sort=mostrecent", timeout=60)
    if status != 200:
        return [result("zenodo", "FAILED", concept_url, detail=f"records query HTTP {status}")]
    hits = json.loads(body)["hits"]["hits"]
    if not hits:
        return [result("zenodo", "FAILED", concept_url, detail="the concept has no published versions — refusing to guess")]
    for h in hits:
        m = h["metadata"]
        if m.get("version") == tr["as_of"]:
            return [result("zenodo", "UNCHANGED", f"https://doi.org/{h['doi']}", tr["as_of"], f"already carries as_of {tr['as_of']}")]
        if not force and tr["fingerprint"] in (m.get("notes") or "") + (m.get("description") or ""):
            return [result("zenodo", "UNCHANGED", f"https://doi.org/{h['doi']}", m.get("version"),
                           f"already carries fingerprint {tr['fingerprint'][:16]}… — use --force to mint another version")]
    latest = hits[0]
    if str(latest.get("conceptrecid")) != str(ZENODO_CONCEPT):
        return [result("zenodo", "FAILED", concept_url, detail=f"latest hit {latest['id']} is not under concept {ZENODO_CONCEPT}")]
    if str(latest["id"]) == ZENODO_METHODOLOGY_DOI.split(".")[-1]:
        return [result("zenodo", "FAILED", concept_url, detail="refusing: latest version is the methodology record")]
    if dry_run:
        return [result("zenodo", "DRY-RUN", concept_url, detail=f"would mint a new version after record {latest['id']}")]

    # 1. new version draft
    status, body, _ = http(f"{Z}/deposit/depositions/{latest['id']}/actions/newversion", method="POST", headers=auth, timeout=120)
    if status not in (200, 201):
        return [result("zenodo", "FAILED", concept_url, detail=f"newversion HTTP {status}: {body[:300]!r}")]
    draft_url = json.loads(body)["links"]["latest_draft"]
    status, body, _ = http(draft_url, headers=auth, timeout=60)
    if status != 200:
        return [result("zenodo", "FAILED", concept_url, detail=f"read draft HTTP {status}")]
    draft = json.loads(body)
    did = draft["id"]
    if str(draft.get("conceptrecid")) != str(ZENODO_CONCEPT):
        return [result("zenodo", "FAILED", concept_url, detail=f"draft {did} is not under concept {ZENODO_CONCEPT} — aborting before any write")]
    # 2. replace files (the draft inherits the previous version's files)
    for f in draft.get("files", []):
        http(f"{Z}/deposit/depositions/{did}/files/{f['id']}", method="DELETE", headers=auth, timeout=60)
    bucket = draft["links"]["bucket"]
    for name in SNAPSHOT_FILES:
        status, body, _ = http(f"{bucket}/{name}", method="PUT", data=(snap / name).read_bytes(),
                               headers={**auth, "Content-Type": "application/octet-stream"}, timeout=120)
        if status not in (200, 201):
            return [result("zenodo", "FAILED", f"https://zenodo.org/deposit/{did}", detail=f"upload {name} HTTP {status}: {body[:200]!r}")]
    # 3. metadata
    prev = latest["metadata"]
    counts = json.loads((snap / "SNAPSHOT.json").read_text())["counts"]
    st = counts["by_status"]
    desc = (
        f"<p><strong>The live board at <a href=\"{BOARD_URL}\">{BOARD_URL}</a> is the authority.</strong> This record is a "
        f"snapshot of that GET, read at {tr['read_at']} and aligned to the transparency root published at {tr['as_of']}. "
        "If the live GET and these files disagree, the live GET wins. A fetch that fails is <code>UNCHECKABLE</code> — "
        "never a fabricated 0.</p>"
        f"<p><strong>Lid:</strong> {tr['lid']}</p>"
        f"<p>Derived from the axis array, never typed: {counts['slots']} slots; "
        + "; ".join(f"{k} {v}" for k, v in sorted(st.items()))
        + f"; model-comparison {counts['by_kind'].get('model-comparison', 0)}, deterministic-fact "
          f"{counts['by_kind'].get('deterministic-facts', 0)}; separation over the model-comparison axes "
        + ", ".join(f"{k} {v}" for k, v in sorted(counts['separation_over_model_comparison'].items()))
        + f". Transparency root: {tr['root']['card_count']} signed cards, merkle_root <code>{tr['root']['merkle_root']}</code>.</p>"
        f"<p>Files: board.json and root.json are the live bytes, unmodified; SNAPSHOT.json carries digests, derived counts and "
        "frozen-bank row counts; gspc-axes.csv/.jsonl one row per slot; check-board.sh re-derives the totals and recomputes "
        "the Merkle root; README.md explains how a stranger verifies.</p>"
        f"<p>Verify a card, free, no account: <a href=\"{VERIFY_URL}\">{VERIFY_URL}</a> · by hand: "
        f"<a href=\"{HOWTO_URL}\">{HOWTO_URL}</a> · keys via did:web:csoai.org.</p>"
        "<p>Not a certification, not a rating, not an endorsement, not legal advice. Measurement, not certification.</p>"
        f"<p>Derived from the methodology record <a href=\"https://doi.org/{ZENODO_METHODOLOGY_DOI}\">{ZENODO_METHODOLOGY_DOI}</a>. "
        f"spray-fingerprint: {tr['fingerprint']}</p>"
    )
    if BANNED.search(desc):
        return [result("zenodo", "FAILED", concept_url, detail="description would carry a banned word")]
    related = [{"identifier": ZENODO_METHODOLOGY_DOI, "relation": "isDerivedFrom", "scheme": "doi", "resource_type": "publication-report"},
               {"identifier": BOARD_URL, "relation": "isSupplementTo", "scheme": "url"},
               {"identifier": f"https://github.com/{GITHUB_REPO}", "relation": "isSupplementTo", "scheme": "url"},
               {"identifier": f"https://huggingface.co/spaces/{HF_SPACE}", "relation": "isSupplementTo", "scheme": "url"},
               {"identifier": f"https://www.kaggle.com/datasets/{KAGGLE_ID}", "relation": "isSupplementTo", "scheme": "url"}]
    meta = {
        "title": f"GSPC board snapshot, {tr['as_of']} — {tr['lid']}",
        "upload_type": "dataset",
        "description": desc,
        "creators": prev.get("creators") or [{"name": "CSOAI Ltd", "affiliation": "Council of AI (CSOAI Ltd), London, United Kingdom"}],
        "publication_date": tr["as_of"][:10],
        "version": tr["as_of"],
        "license": (prev.get("license") or {}).get("id", "cc-zero") if isinstance(prev.get("license"), dict) else (prev.get("license") or "cc-zero"),
        "access_right": "open",
        "keywords": prev.get("keywords") or ["AI governance", "EU AI Act", "AI safety", "benchmark", "measurement", "attestation", "Ed25519", "provenance", "transparency", "LLM evaluation", "GSPC", "signed evidence"],
        "related_identifiers": related,
        "notes": f"The live GET is the authority; this record is a dated snapshot of it. Measurement, not certification. spray-fingerprint: {tr['fingerprint']}",
        "language": "eng",
    }
    status, body, _ = http(f"{Z}/deposit/depositions/{did}", method="PUT", data=json.dumps({"metadata": meta}).encode(), headers=jh, timeout=60)
    if status != 200:
        return [result("zenodo", "FAILED", f"https://zenodo.org/deposit/{did}", detail=f"metadata HTTP {status}: {body[:400]!r}")]
    # 4. publish
    status, body, _ = http(f"{Z}/deposit/depositions/{did}/actions/publish", method="POST", headers=auth, timeout=120)
    if status not in (200, 202):
        return [result("zenodo", "FAILED", f"https://zenodo.org/deposit/{did}", detail=f"publish HTTP {status}: {body[:400]!r}")]
    pub = json.loads(body)
    doi = pub.get("doi") or pub.get("metadata", {}).get("doi")
    rec_url = f"https://doi.org/{doi}" if doi else pub["links"].get("html")

    def seen_version():
        s, b, _ = http(f"{Z}/records/{pub['id']}", timeout=30)
        return s == 200 and json.loads(b)["metadata"].get("version") == tr["as_of"] and tr["as_of"]
    seen = wait_for(seen_version, tries=6, delay=5)
    return [result("zenodo", "PUBLISHED" if seen else "PUBLISHED-UNCONFIRMED", rec_url, seen or None,
                   None if seen else "published; records API did not show the new version yet")]


def pypi_version_for(as_of: str) -> str:
    # 0.2.<YYYYMMDD>: monotonic by snapshot date; one release per day at most. 0.1.0 was the first hand-cut reader.
    return "0.2." + re.sub(r"\D", "", as_of[:10])


def spray_pypi(tr: dict, snap: Path, *, dry_run: bool, force: bool) -> list[dict]:
    page = f"https://pypi.org/project/{PYPI_PROJECT}/"
    src = HERE / "pypi" / "csoai-gspc"
    if not (src / "pyproject.toml").exists():
        return [result("pypi", "FAILED", page, detail=f"package source missing at {src}")]
    token = os.environ.get("PYPI_API_TOKEN")
    pypirc = Path.home() / ".pypirc"
    if not token and not pypirc.exists():
        return [result("pypi", "BLOCKED", page, detail="no PyPI credential (PYPI_API_TOKEN or ~/.pypirc)")]
    version = pypi_version_for(tr["as_of"])
    status, body, _ = http(f"https://pypi.org/pypi/{PYPI_PROJECT}/json", headers={"Cache-Control": "no-cache"}, timeout=30)
    if status != 200:
        return [result("pypi", "FAILED", page, detail=f"pypi JSON HTTP {status}")]
    proj = json.loads(body)
    if version in proj.get("releases", {}):
        return [result("pypi", "UNCHANGED", f"{page}{version}/", tr["as_of"],
                       f"release {version} already exists (one release per snapshot day; a second board change on the same day waits for tomorrow's run)")]
    if not force and tr["fingerprint"] in (proj["info"].get("description") or ""):
        return [result("pypi", "UNCHANGED", f"{page}{proj['info']['version']}/", None,
                       f"latest release {proj['info']['version']} already bundles fingerprint {tr['fingerprint'][:16]}… — use --force")]
    if dry_run:
        return [result("pypi", "DRY-RUN", f"{page}{version}/", detail=f"would build and upload {PYPI_PROJECT}=={version}")]

    with tempfile.TemporaryDirectory() as d:
        pkg = Path(d) / "pkg"
        shutil.copytree(src, pkg)
        snapdir = pkg / "csoai_gspc" / "snapshot"
        snapdir.mkdir()
        for f in ("board.json", "root.json", "SNAPSHOT.json"):
            shutil.copy2(snap / f, snapdir / f)
        py = pkg / "pyproject.toml"
        py.write_text(re.sub(r'^version = ".*"$', f'version = "{version}"', py.read_text(), count=1, flags=re.M))
        init = pkg / "csoai_gspc" / "__init__.py"
        init.write_text(re.sub(r'^__version__ = ".*"$', f'__version__ = "{version}"', init.read_text(), count=1, flags=re.M))
        readme = (pkg / "README.md").read_text()
        block = (
            f"\n## Bundled snapshot — as of {tr['as_of']}\n\n"
            f"**{tr['lid']}**\n\n"
            f"This release ships a dated snapshot of the board at `csoai_gspc/snapshot/` (board.json, root.json, SNAPSHOT.json), "
            f"read at {tr['read_at']}. `csoai-gspc snapshot` prints it. Every other command still reads the live GET at request "
            f"time; the live GET is the authority and this bundle is only what it said on that day. "
            f"spray-fingerprint: {tr['fingerprint']}\n"
        )
        (pkg / "README.md").write_text(readme.rstrip() + "\n" + block)
        if BANNED.search((pkg / "README.md").read_text()):
            return [result("pypi", "FAILED", page, detail="README would carry a banned word")]
        try:
            run([sys.executable, "-m", "build", "--sdist", "--wheel", "--outdir", str(Path(d) / "dist"), str(pkg)])
        except RuntimeError as e:
            return [result("pypi", "FAILED", page, detail=f"build: {e}")]
        env = {**os.environ}
        if token:
            env.update(TWINE_USERNAME="__token__", TWINE_PASSWORD=token)
        try:
            up = run([sys.executable, "-m", "twine", "upload", "--non-interactive", "--skip-existing",
                      *[str(p) for p in sorted((Path(d) / "dist").iterdir())]], env=env)
        except RuntimeError as e:
            return [result("pypi", "FAILED", page, detail=f"twine: {str(e).replace(token or '∅', '***')}")]
        if "Skipping" in up.stdout + up.stderr:   # PyPI's JSON lagged behind an upload this run did not make
            return [result("pypi", "UNCHANGED", f"{page}{version}/", tr["as_of"],
                           f"release {version} already existed on the index (twine skipped every file)")]

    def seen():
        s, b, _ = http(f"https://pypi.org/pypi/{PYPI_PROJECT}/{version}/json", timeout=30)
        return s == 200 and tr["as_of"] in (json.loads(b)["info"].get("description") or "") and tr["as_of"]
    ok = wait_for(seen, tries=12, delay=10)
    return [result("pypi", "PUBLISHED" if ok else "PUBLISHED-UNCONFIRMED", f"{page}{version}/", ok or None,
                   None if ok else "uploaded; the PyPI JSON did not show the release yet")]


def spray_npm(tr: dict, snap: Path, *, dry_run: bool, force: bool) -> list[dict]:
    return [result("npm", "BLOCKED", f"https://www.npmjs.com/package/{NPM_PACKAGE}",
                   detail="the npm account is WebAuthn (not TOTP): `npm publish --otp=` can never work and web login returns "
                          "EOTP. Owner action: mint a granular access token with Bypass 2FA at npmjs.com → Access Tokens, "
                          "store it as the NPM_TOKEN secret; this script does not attempt npm until then.")]


SURFACES = {"hf": spray_hf, "kaggle": spray_kaggle, "github": spray_github, "zenodo": spray_zenodo,
            "pypi": spray_pypi, "npm": spray_npm}


# -------------------------------------------------------------------------------------------------- main

def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for s in SURFACES:
        ap.add_argument(f"--{s}", action="store_true", help=f"publish to {s}")
    ap.add_argument("--all", action="store_true", help="every surface")
    ap.add_argument("--build-only", action="store_true", help="build the snapshot directory and stop")
    ap.add_argument("--dry-run", action="store_true", help="read live truth, build, decide — but push nothing")
    ap.add_argument("--force", action="store_true", help="republish when only the root's clock moved (same fingerprint)")
    ap.add_argument("--out", default=None, help="snapshot directory (default: a temp dir under $RUNNER_TEMP or /tmp)")
    ap.add_argument("--report", default=None, help="write the per-surface results as JSON here")
    args = ap.parse_args(argv)

    chosen = [s for s in SURFACES if getattr(args, s)] or (list(SURFACES) if args.all else [])
    if not chosen and not args.build_only:
        ap.error("choose surfaces (--hf --kaggle --github --zenodo --pypi --npm), --all, or --build-only")

    tr = read_live_truth()
    out = Path(args.out) if args.out else Path(tempfile.mkdtemp(prefix="gspc-spray-", dir=os.environ.get("RUNNER_TEMP")))
    snap = build_snapshot(tr, out)
    results: list[dict] = []
    if not args.build_only:
        for s in chosen:
            try:
                results.extend(SURFACES[s](tr, snap, dry_run=args.dry_run, force=args.force))
            except Exception as e:  # noqa: BLE001 — one surface failing must not hide the others
                results.append(result(s, "FAILED", detail=f"{type(e).__name__}: {e}"))

    report = {"kind": "csoai.gspc-spray-report/1", "run_at": utc_now(), "as_of": tr["as_of"], "lid": tr["lid"],
              "fingerprint": tr["fingerprint"], "snapshot_dir": str(snap), "results": results}
    if args.report:
        Path(args.report).write_text(json.dumps(report, indent=1, ensure_ascii=False) + "\n")
    log("")
    log(f"as_of {tr['as_of']} · {tr['lid']}")
    log("| surface | status | url | as_of seen |")
    log("|---|---|---|---|")
    for r in results:
        log(f"| {r['surface']} | {r['status']} | {r['url'] or '—'} | {r['as_of_seen'] or '—'} |")
    bad = [r for r in results if r["status"] == "FAILED"]
    return 1 if bad else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Refused as r:
        print(r, file=sys.stderr)
        raise SystemExit(2)
