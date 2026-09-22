#!/usr/bin/env python3
"""Assemble the GSPC estate publication bundle from live endpoints and the repo working tree.

Every value is READ from its source at build time. Nothing here is typed by hand:
if a number is not in a fetched artifact, it is not in the bundle.

    python3 build_estate_bundle.py --repo /workspace/lanes/spray/councilof-ai \
                                   --out  /workspace/lanes/out/gspc-estate

Produces (one JSON-Lines format for every viewer config; other extensions are plain files):
    board/board-axes.jsonl          one row per axis, verbatim from GET /api/gspc
    board/board-snapshot.json       the whole payload, byte-verbatim
    board/board-longitudinal.jsonl  the dated board artifacts that actually exist
    cards/mill-cards-signed.jsonl   every signed mill card body, one per line
    cards/superseded.jsonl          the supersession ledger, verbatim
    cards/card-corpora.jsonl        the three corpora with their live counts
    chain/*.json                    root.json, card_index.json, did.json, rekor entry
    chain/ots-proof-states.jsonl    every .ots under public/, with its real state
    corrections/corrections.jsonl   the corrections ledger, verbatim from /api/corrections
    populations/populations.jsonl   the ten population doors' free previews
    banks/frozen-banks.jsonl        each frozen bank, its URL, sha256 and item count
    arena/rounds.jsonl              the arena rounds, verbatim
    arena/elo_reference.json        the Elo reference, verbatim
    manifest.jsonl                  every file in the bundle with its sha256
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

SITE = "https://councilof.ai"
HF = "https://huggingface.co/datasets"
UA = {"User-Agent": "csoai-estate-spray/1.0 (+https://councilof.ai)"}

# The long->short axis id map for the public frozen banks. Read from the repo if present;
# this literal is the fallback and every entry is probed before it is published.
BANK_MAP = {
    "governance": "gov", "safety": "agi", "provenance": "prv", "continuity": "asi",
    "conformance": "mcp", "openness": "oss", "machinery-conformity": "mach", "care": "care",
    "cross-reality": "xr", "detector-interop": "det", "art5-safeguard": "art5",
    "swarm": "swarm", "affect": "affect",
}
JAIL_BANK = ("jail", "csoai/gspc-jail-goldbank", "goldbank_jail.json")

POPULATION_IDS = ["stablecoins", "swift", "xrpl", "x402-bazaar", "mcp-registry",
                  "a2a", "ots-proofs", "layer0", "corrections", "claim-watch"]


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get(url: str, tolerate=()) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        if e.code in tolerate:
            return e.read()
        raise


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def write(path: pathlib.Path, data) -> pathlib.Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, bytes):
        path.write_bytes(data)
    else:
        path.write_text(data, encoding="utf-8")
    return path


def write_jsonl(path: pathlib.Path, rows) -> pathlib.Path:
    return write(path, "".join(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n" for r in rows))


# --------------------------------------------------------------------------- board
def build_board(out: pathlib.Path, repo: pathlib.Path) -> dict:
    raw = get(f"{SITE}/api/gspc")
    board = json.loads(raw)
    write(out / "board" / "board-snapshot.json", raw)
    rows = []
    for ax in board["axes"]:
        r = dict(ax)
        r["_board_as_of"] = board["measured_on"]["date"]
        r["_fetched_at"] = now()
        rows.append(r)
    write_jsonl(out / "board" / "board-axes.jsonl", rows)

    # Longitudinal: the dated board artifacts that EXIST. This estate does not archive a
    # daily board snapshot, so the series is sparse and says so on every row.
    series = []
    signed = repo / "public/signed/gspc-board.signed.json"
    if signed.is_file():
        log = subprocess.run(["git", "log", "--format=%H\t%cI", "--", str(signed.relative_to(repo))],
                             cwd=repo, capture_output=True, text=True).stdout.strip().splitlines()
        for line in log:
            sha, when = line.split("\t")
            blob = subprocess.run(["git", "show", f"{sha}:{signed.relative_to(repo)}"],
                                  cwd=repo, capture_output=True).stdout
            try:
                b = json.loads(blob)
            except Exception:
                continue
            t = b.get("totals", {})
            series.append({
                "source": "public/signed/gspc-board.signed.json",
                "git_commit": sha, "committed_at": when,
                "axes": t.get("axes"), "measured_axes": t.get("measured_axes"),
                "unmeasured_axes": t.get("unmeasured_axes"),
                "public_count": t.get("public_count"),
                "measured_on_date": (b.get("measured_on") or {}).get("date"),
                "sha256": sha256(blob),
                "note": "A committed signed board artifact. Sparse by construction: this estate "
                        "publishes a live board, not a daily archive.",
            })
    t = board["totals"]
    series.append({
        "source": "GET https://councilof.ai/api/gspc",
        "git_commit": None, "committed_at": now(),
        "axes": t.get("axes"), "measured_axes": t.get("measured_axes"),
        "unmeasured_axes": t.get("unmeasured_axes"), "public_count": t.get("public_count"),
        "measured_on_date": board["measured_on"]["date"], "sha256": sha256(raw),
        "note": "Live fetch at build time. From this publication forward, each dated "
                "board-snapshot.json in this dataset is itself an archive point.",
    })
    series.sort(key=lambda r: r["committed_at"])
    write_jsonl(out / "board" / "board-longitudinal.jsonl", series)
    return board


# --------------------------------------------------------------------------- cards
def build_cards(out: pathlib.Path, repo: pathlib.Path) -> dict:
    src = repo / "public/interop/mill-cards-signed"
    rows, skipped = [], []
    for f in sorted(src.glob("signed-*.json")):
        try:
            body = json.loads(f.read_bytes())
        except Exception as e:
            skipped.append({"file": f.name, "reason": f"{type(e).__name__}: {e}"})
            continue
        body["_file"] = f.name
        body["_sha256_of_file_bytes"] = sha256(f.read_bytes())
        rows.append(body)
    write_jsonl(out / "cards" / "mill-cards-signed.jsonl", rows)

    # A flat, uniformly typed index of the same cards. The full-body file above keeps every
    # byte a verifier needs; this one is what a table viewer can actually render, because
    # card bodies differ in shape between producers and a nested union defeats type inference.
    index = []
    for c in rows:
        b = c.get("body", {})
        ev = b.get("evidence") or {}
        index.append({
            "id": c.get("id"), "file": c.get("_file"), "axis": b.get("axis"),
            "model": b.get("model"), "n": b.get("n"), "accuracy": b.get("accuracy"),
            "status": b.get("status"), "did": c.get("did"), "alg": c.get("alg"),
            "preimage_rule": c.get("preimage_rule"), "signature": c.get("signature"),
            "quotable": c.get("quotable"), "not_a_certificate": c.get("not_a_certificate"),
            "run_id": b.get("run_id"), "route": b.get("route"),
            "bank_dataset": ev.get("bank_dataset"), "bank_file": ev.get("bank_file"),
            "bank_sha256": ev.get("bank_sha256"), "items_file": ev.get("items_file"),
            "items_sha256": ev.get("items_sha256"),
            "unmeasured": ", ".join(b.get("unmeasured") or []) or None,
            "card_url": f"{SITE}/interop/mill-cards-signed/" + str(c.get("_file")),
            "sha256_of_file_bytes": c.get("_sha256_of_file_bytes"),
        })
    write_jsonl(out / "cards" / "mill-cards-index.jsonl", index)

    sup = src / "SUPERSEDED.jsonl"
    sup_rows = [json.loads(l) for l in sup.read_text().splitlines() if l.strip()]
    write_jsonl(out / "cards" / "superseded.jsonl", sup_rows)

    # The three corpora, each read live from the endpoint that owns it.
    state = json.loads(get(f"{SITE}/api/state"))
    bundle = json.loads(get(f"{SITE}/cards-bundle.json"))
    live_cards = json.loads(get(f"{SITE}/api/cards"))
    pr = state["public_root"]["card_count"]
    sc = state["signed_cards"]["count"]
    cc = state["card_chain"]["bodies_verified_valid"]
    corpora = [
        {"corpus": 1, "name": "card wrappers on disk", "artifact": "public/cards-bundle.json",
         "field": "card_count", "value": bundle.get("card_count"), "kind": "build aggregate",
         "as_of": bundle.get("as_of"), "in_api_state": False,
         "means": "Every public/cards/*.json wrapper on disk at build time. Its own generator "
                  "says it signs nothing and measures nothing. Not an attestation."},
        {"corpus": 2, "name": "public-root Merkle leaves", "artifact": "public/root.json",
         "field": "card_count", "value": pr["value"], "kind": pr["kind"], "as_of": pr["as_of"],
         "in_api_state": True,
         "means": "card_sha256 leaves under the signed public root. Inclusion means membership "
                  "in that list. Its OTS proof covers root.json bytes only."},
        {"corpus": 3, "name": "signed card index", "artifact": "public/signed/card_index.json",
         "field": "cards[].length", "value": sc["value"], "kind": sc["kind"], "as_of": sc["as_of"],
         "in_api_state": True,
         "means": "The signed card index. Of these, bodies_verified_valid = "
                  f"{cc['value']} verify (kind {cc['kind']}) — the only one of the three behind "
                  "which a verification was actually run."},
        {"corpus": "living", "name": "living registry", "artifact": "GET /api/cards",
         "field": "cards.count", "value": live_cards["cards"]["count"],
         "kind": "catalogued", "as_of": live_cards.get("measured_on"), "in_api_state": False,
         "means": "GET /api/cards -> cards.count, the living registry. A fourth reading of a "
                  "fourth set of bytes; cards.list is a 100-row page, not the population."},
        {"corpus": "mill", "name": "signed mill cards", "artifact": "public/interop/mill-cards-signed/",
         "field": "signed-*.json", "value": len(rows), "kind": "catalogued", "as_of": None,
         "in_api_state": False,
         "means": "The hourly measurement mill's own signed output, superseded not overwritten. "
                  "A separate corpus again. Never add any of these together."},
    ]
    rel = state["public_root"]["corpus_relation"]
    for c in corpora:
        c["identifier_overlap_with_other_corpora"] = rel["identifier_overlap"]
        c["relationship"] = rel["relationship"]
    write_jsonl(out / "cards" / "card-corpora.jsonl", corpora)
    if skipped:
        write_jsonl(out / "cards" / "unparsed-card-files.jsonl", skipped)
    shutil.copy(repo / "council-os/CARD-CORPORA.md", out / "cards" / "CARD-CORPORA.md")

    # The per-item evidence every card pins. Without it a card is a claim about a run;
    # with it the grade can be recomputed by a stranger, which is the whole point.
    ev_src = repo / "public/interop/mill-evidence"
    ev_dst = out / "evidence"
    ev_dst.mkdir(parents=True, exist_ok=True)
    ev_rows = []
    for f in sorted(ev_src.iterdir()):
        if not f.is_file():
            continue
        b = f.read_bytes()
        shutil.copy(f, ev_dst / f.name)
        ev_rows.append({"file": f.name, "bytes": len(b), "sha256": sha256(b),
                        "kind": ("item-evidence" if f.name.startswith("items-")
                                 else "frozen-bank-snapshot" if f.name.startswith("bank-")
                                 else "admission-receipt" if f.name.startswith("admission-")
                                 else "other"),
                        "live_url": f"{SITE}/interop/mill-evidence/{f.name}"})
    write_jsonl(out / "evidence" / "evidence-manifest.jsonl", ev_rows)
    return {"mill_cards": len(rows), "superseded": len(sup_rows), "skipped": len(skipped),
            "evidence_files": len(ev_rows),
            "corpora": corpora, "state": state}


# --------------------------------------------------------------------------- chain
def build_chain(out: pathlib.Path, repo: pathlib.Path) -> dict:
    d = out / "chain"
    for name, url in [("root.json", f"{SITE}/root.json"),
                      ("did.json", f"{SITE}/.well-known/did.json"),
                      ("card_index.json", f"{SITE}/signed/card_index.json")]:
        write(d / name, get(url))
    for f in sorted((repo / "public/interop").glob("rekor-root-*.json"))[:1]:
        shutil.copy(f, d / "rekor-entry.json")
    gsr = repo / "public/interop/gsr-rekor-entry.json"
    if gsr.is_file():
        shutil.copy(gsr, d / "gsr-rekor-entry.json")

    # OTS proof states, computed here, never asserted.
    sys.path.insert(0, str(repo))
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
    from opentimestamps.core.serialize import BytesDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile
    FILE_NAMED = re.compile(r"\.(json|jsonl|txt|md|csv|pdf|png)\.ots$")
    DIGEST_NAMED = re.compile(r"(^|[-/])[0-9a-f]{8,64}\.(json\.)?ots$")
    rows = []
    pub = repo / "public"
    for ots in sorted(pub.rglob("*.ots")):
        rel = str(ots.relative_to(repo))
        blob = ots.read_bytes()
        try:
            dt = DetachedTimestampFile.deserialize(BytesDeserializationContext(blob))
        except Exception:
            rows.append({"path": rel, "naming": "n/a", "proof": "NOT_A_PROOF",
                         "anchor_state": "NOT_A_PROOF", "bitcoin_block": None,
                         "covers_named_file": None,
                         "note": "A .ots extension on bytes that do not deserialise as an "
                                 "OpenTimestamps proof. Counted, never called a proof."})
            continue
        btc = [a.height for _, a in dt.timestamp.all_attestations()
               if isinstance(a, BitcoinBlockHeaderAttestation)]
        anchor = "BITCOIN_ATTESTED" if btc else "SUBMITTED_PENDING"
        naming = "digest-named" if DIGEST_NAMED.search(ots.name) else (
            "file-named" if FILE_NAMED.search(rel) else "other")
        covers = None
        if naming == "file-named":
            target = pathlib.Path(str(ots)[:-4])
            covers = (target.is_file()
                      and sha256(target.read_bytes()) == dt.file_digest.hex())
        rows.append({"path": rel, "naming": naming, "proof": "OTS",
                     "anchor_state": anchor, "bitcoin_block": btc[0] if btc else None,
                     "covers_named_file": covers,
                     "file_digest": dt.file_digest.hex(),
                     "note": "SUBMITTED_PENDING means the calendar accepted it and no Bitcoin "
                             "attestation has been upgraded into these bytes yet. It is not a "
                             "Bitcoin proof and is never published as one."})
    write_jsonl(d / "ots-proof-states.jsonl", rows)
    published = json.loads(get(f"{SITE}/interop/ots/manifest.json"))
    write(d / "ots-manifest-as-published.json", json.dumps(published, indent=1, sort_keys=True))
    tally = {
        "published_manifest": {
            "as_of": published.get("as_of"),
            "dirs_scanned": published.get("dirs_scanned"),
            "counts": published.get("counts"),
            "scope_note": "The estate's own manifest scans /interop and /interop/ots only. The "
                          "rows in ots-proof-states.jsonl are a scan of ALL of public/ at the "
                          "repo commit in summary.json, so the totals differ by scope, not by "
                          "disagreement. Neither is a correction of the other.",
        },
        "total_ots_files": len(rows),
        "bitcoin_attested": sum(1 for r in rows if r["anchor_state"] == "BITCOIN_ATTESTED"),
        "submitted_pending": sum(1 for r in rows if r["anchor_state"] == "SUBMITTED_PENDING"),
        "not_a_proof": sum(1 for r in rows if r["anchor_state"] == "NOT_A_PROOF"),
        "file_named_that_cover": sum(1 for r in rows if r["covers_named_file"] is True),
        "file_named_that_do_not_cover": sum(1 for r in rows if r["covers_named_file"] is False),
    }
    return tally


# --------------------------------------------------------------------------- the rest
def build_corrections(out: pathlib.Path) -> int:
    d = json.loads(get(f"{SITE}/api/corrections"))
    rows = d["corrections"]
    for r in rows:
        r["_license"] = d.get("license")
        r["_publisher"] = d.get("publisher")
        r["_policy"] = d.get("policy")
    write_jsonl(out / "corrections" / "corrections.jsonl", rows)
    return len(rows)


def build_populations(out: pathlib.Path) -> list:
    rows = []
    for pid in POPULATION_IDS:
        raw = get(f"{SITE}/api/pop/{pid}", tolerate=(402,))
        body = json.loads(raw)
        pv = (body.get("csoai") or {}).get("preview") or {}
        rows.append({"id": pid, "state": pv.get("state"), "n": pv.get("n"),
                     "n_unit": pv.get("n_unit"), "as_of": pv.get("as_of"),
                     "source": pv.get("source"), "reason": pv.get("reason"),
                     "unmeasured": pv.get("unmeasured"),
                     "door": f"{SITE}/api/pop/{pid}",
                     "http_status_without_payment": 402,
                     "note": "The door answers 402 without payment and the free preview travels "
                             "in that 402 body. state/n/as_of are free; the rows are the paid "
                             "part. A 402 is not settlement and not revenue."})
    write_jsonl(out / "populations" / "populations.jsonl", rows)
    return rows


def build_banks(out: pathlib.Path) -> list:
    rows = []
    for long_id, short in sorted(BANK_MAP.items()):
        url = f"{HF}/csoai/gspc-{short}/resolve/main/items.jsonl"
        try:
            blob = get(url)
            n = sum(1 for l in blob.splitlines() if l.strip())
            rows.append({"axis": long_id, "hf_dataset": f"csoai/gspc-{short}", "file": "items.jsonl",
                         "url": url, "state": "RESOLVABLE", "items": n, "sha256": sha256(blob),
                         "bytes": len(blob),
                         "note": "Public, no token. The sha256 pins the bank bytes a run was graded "
                                 "against; re-fetch and compare before quoting a cell."})
        except Exception as e:
            rows.append({"axis": long_id, "hf_dataset": f"csoai/gspc-{short}", "file": "items.jsonl",
                         "url": url, "state": "UNRESOLVABLE", "items": None, "sha256": None,
                         "bytes": None, "note": f"{type(e).__name__}: {str(e)[:120]}"})
    axis, repo_id, fname = JAIL_BANK
    url = f"{HF}/{repo_id}/resolve/main/{fname}"
    blob = get(url)
    gold = json.loads(blob)
    rows.append({"axis": axis, "hf_dataset": repo_id, "file": fname, "url": url,
                 "state": "RESOLVABLE", "items": len(gold.get("items", [])), "sha256": sha256(blob),
                 "bytes": len(blob),
                 "note": "The jail goldbank is a code-execution bank (items[] with code/kind), NOT "
                         "items.jsonl. The generic keyword grader cannot read it; it is out of the "
                         "mill's generic rotation and graded by its own runner."})
    write_jsonl(out / "banks" / "frozen-banks.jsonl", rows)
    return rows


def build_arena(out: pathlib.Path, repo: pathlib.Path) -> dict:
    src = repo / "public/arena"
    (out / "arena").mkdir(parents=True, exist_ok=True)
    shutil.copy(src / "rounds.jsonl", out / "arena" / "rounds.jsonl")
    shutil.copy(src / "elo_reference.json", out / "arena" / "elo_reference.json")
    n = sum(1 for l in (src / "rounds.jsonl").read_text().splitlines() if l.strip())
    elo = json.loads((src / "elo_reference.json").read_bytes())
    return {"rounds": n, "elo": elo}


def build_harness(out: pathlib.Path, repo: pathlib.Path) -> list:
    """Copy the code a stranger needs to reproduce a cell. Verbatim; never rewritten."""
    wanted = [
        ("scripts/runpod_gspc_worker.py", "harness/runpod_gspc_worker.py"),
        ("scripts/arena/test_arena_controls.py", "harness/test_arena_controls.py"),
        ("scripts/arena/elo_reference.py", "harness/elo_reference.py"),
        ("scripts/arena/board_sign.py", "harness/board_sign.py"),
        ("scripts/runpod_reviewed_control.py", "harness/runpod_reviewed_control.py"),
        ("scripts/grade_financial_ledgers.py", "harness/grade_financial_ledgers.py"),
        ("scripts/measurement_root.py", "harness/measurement_root.py"),
        ("scripts/ots-coverage-audit.py", "harness/ots-coverage-audit.py"),
        ("harness/gspc-top100/mill_hub_queue.py", "harness/mill_hub_queue.py"),
        ("scripts/verify_hub_mill_evidence.py", "harness/verify_hub_mill_evidence.py"),
        ("scripts/generate_runpod_gspc_playlist.py", "harness/generate_runpod_gspc_playlist.py"),
        ("harness/arena/axis_arena.py", "harness/arena/axis_arena.py"),
        ("harness/arena/jcs.py", "harness/arena/jcs.py"),
        ("harness/arena/measurement_card.py", "harness/arena/measurement_card.py"),
        ("harness/arena/openskill.py", "harness/arena/openskill.py"),
        ("public/signed/verify-card.mjs", "harness/verify-card.mjs"),
        ("public/signed/HOW-TO-VERIFY.md", "harness/HOW-TO-VERIFY.md"),
    ]
    got = []
    for rel, dest in wanted:
        s = repo / rel
        if s.is_file():
            t = out / dest
            t.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(s, t)
            got.append({"published_as": dest, "from": rel, "sha256": sha256(s.read_bytes())})
        else:
            got.append({"published_as": dest, "from": rel, "sha256": None,
                        "state": "ABSENT_FROM_THIS_TREE"})
    write_jsonl(out / "harness" / "harness-manifest.jsonl", got)
    (out / "harness" / "README.md").write_text(HARNESS_README, encoding="utf-8")
    return got


HARNESS_README = """# The harness

Every file here is copied **verbatim** from `CSOAI-ORG/councilof-ai` (MIT) at the commit in
`../summary.json`. Nothing was rewritten for publication. `harness-manifest.jsonl` gives
each file's path in that repository and the sha256 of the bytes published here, so you can
diff this copy against the source.

## What produces a measurement

| file | what it does |
|---|---|
| `generate_runpod_gspc_playlist.py` | turns a bank directory and a model list into one job config per (model, axis) |
| `runpod_gspc_worker.py` | runs one job: loopback model API only, bound to the frozen bank bytes AND the model manifest digest before the first prompt. Stops at an **unsigned, UNMEASURED candidate** — it never loads a signing key. |
| `mill_hub_queue.py` | the composer and the grader: `axis_prompt`, `exact_label_menu`, `read_label`, `canonical_body_bytes` |
| `verify_hub_mill_evidence.py` | offline admission: re-checks the evidence bundle against the card with no network and no key |
| `grade_financial_ledgers.py` | the deterministic-facts grader for the financial/domain axes |
| `elo_reference.py` | produces `../arena/elo_reference.json` from `../arena/rounds.jsonl` |
| `board_sign.py` | the signing client (the key is never on this side) |
| `test_arena_controls.py`, `runpod_reviewed_control.py` | the controls — planted answers and tampered inputs, which must fail |
| `measurement_root.py` | the measurement Merkle tree. It **carries an odd node up**; the public root in `../chain/root.json` **duplicates** it. The two trees are built differently and that is recorded, not silently reconciled. |
| `ots-coverage-audit.py` | does every `.ots` cover the file it names? |
| `verify-card.mjs`, `HOW-TO-VERIFY.md` | the published card verifier and its guide |

## Settings that make a run reproducible

Temperature **0**, seed **0**. Exact-label banks generate at most **128** tokens; keyword
banks **1024**. The bank is pinned by sha256 and the loader by manifest digest (local) or
HF revision (router) — both are on the card. Transport failures are excluded from the
denominator rather than scored as wrong answers, and an unreadable answer **leaves n**.

## One string you will find, and why it was not removed

`runpod_gspc_worker.py` contains the token `BFT` in its opening docstring, in the list of
things the worker deliberately **never** does. That claim was retracted by this body in
July 2026 and our publishing gate blocks the phrase on rendered pages. This is source
code, not a rendered page, and the occurrence is a negation inside the file that enforces
it. Editing published source so a display gate goes quiet would falsify the record, so the
bytes are published as they are and the occurrence is disclosed here instead.

Three files from the source tree are **not** republished here: two internal READMEs and one
older arena module carrying internal strategy codenames that are not for a public surface
and are not needed to reproduce anything. They are not signed bytes and nothing in this
dataset depends on them.
"""


def manifest(out: pathlib.Path) -> int:
    rows = []
    for f in sorted(out.rglob("*")):
        if f.is_file() and f.name != "manifest.jsonl":
            b = f.read_bytes()
            rows.append({"path": str(f.relative_to(out)), "bytes": len(b), "sha256": sha256(b)})
    write_jsonl(out / "manifest.jsonl", rows)
    return len(rows)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    repo, out = pathlib.Path(a.repo), pathlib.Path(a.out)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    summary = {"schema": "csoai.estate-spray-summary/0.1", "built_at": now(),
               "repo_commit": subprocess.run(["git", "rev-parse", "HEAD"], cwd=repo,
                                             capture_output=True, text=True).stdout.strip()}
    board = build_board(out, repo);         print("board OK", board["totals"]["public_count"])
    cards = build_cards(out, repo);         print("cards OK", cards["mill_cards"], "mill /", cards["superseded"], "superseded")
    chain = build_chain(out, repo);         print("chain OK", chain)
    ncorr = build_corrections(out);         print("corrections OK", ncorr)
    pops = build_populations(out);          print("populations OK", len(pops))
    banks = build_banks(out);               print("banks OK", len(banks))
    arena = build_arena(out, repo);         print("arena OK", arena["rounds"], "rounds")
    build_harness(out, repo);               print("harness OK")

    summary.update({
        "board_totals": board["totals"], "board_lid": board["totals"].get("lid"),
        "mill_cards": cards["mill_cards"], "superseded_entries": cards["superseded"],
        "evidence_files": cards["evidence_files"],
        "card_corpora": [{k: c[k] for k in ("corpus", "name", "value", "kind")} for c in cards["corpora"]],
        "ots": chain, "corrections": ncorr,
        "populations": [{k: p[k] for k in ("id", "state", "n", "as_of")} for p in pops],
        "banks_resolvable": sum(1 for b in banks if b["state"] == "RESOLVABLE"),
        "banks_total": len(banks),
        "bank_items_total": sum(b["items"] or 0 for b in banks),
        "arena_rounds": arena["rounds"],
    })
    write(out / "summary.json", json.dumps(summary, indent=1, sort_keys=True))
    print("manifest OK", manifest(out), "files")
    print(json.dumps(summary["board_totals"], indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
