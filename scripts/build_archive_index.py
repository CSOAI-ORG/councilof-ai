#!/usr/bin/env python3
"""Provable-archive index: name and index the hourly signed history already in git.

Every hour `public-root.yml` commits public/root.json (Ed25519-signed envelope),
public/cards/<sha16>.json (one card-v0 leaf + its inclusion proof) and, since
2 Sep 2026, a Rekor rekord + OpenTimestamps witness of that exact root. The git
history of those files IS a signed archive of the leaves — unnamed and
unindexed until now. This script makes it a surface:

  public/archive/index.json                        every subject, counts, latest entry
  public/archive/<dir>/index.json                  append-only entries for one subject
  public/archive/<dir>/<YYYY-MM>.jsonl             the full bytes: card, proof, root refs, witness

A "subject" is a time series: `xrpl:<SYMBOL>` for the locked-16 XRPL leaves,
`evm:<SYMBOL>:<chain>` for the EVM permission-state leaves (each carrying the
block hash and the sha256 of its EIP-1186 proof, whose bytes sit at
/archive/proofs/eip1186/<sha16>.json), `evm-events:<SYMBOL>:<chain>` for the
permission-event history leaves and `evm-events:scan` for the per-run coverage
leaf. Notices and other one-off leaves are not series and are not indexed
here (they stay under /cards and /root.json like before).

An entry is {as_of, block, block_hash, block_time, sha256, card_url,
proof_index, eip1186_proof_sha256, eip1186_proof_url, root_merkle,
root_sha256, root_signed, rekor_logIndex, rekor_url, ots_path, commit}.
Dedupe key = (root_as_of, sha256). Entries are only ever appended; this
script never rewrites or drops one.

Modes:
  python scripts/build_archive_index.py               index the working tree (HEAD root + cards + witness)
  python scripts/build_archive_index.py --backfill    walk `git log -- public/root.json` and index every root
  python scripts/build_archive_index.py --prune-cards delete public/cards + public/proofs files that are
                                                       not in the current root AND already archived in a
                                                       .jsonl (bytes are never lost; Cloudflare Pages caps a
                                                       deploy at 20,000 files)
No key. No network. Bytes only. Never MEASURED. Not a certificate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
ARCHIVE = PUB / "archive"
INTEROP = PUB / "interop"
EVM_SCHEMA = "csoai.evm.permission-state/0.1"
EVM_EVENT_SCHEMA = "csoai.evm.permission-event/0.1"
EVM_SCAN_SCHEMA = "csoai.evm.permission-scan/0.1"
SERIES_SCHEMAS = {EVM_SCHEMA, EVM_EVENT_SCHEMA, EVM_SCAN_SCHEMA}
INDEX_KIND = "csoai.provable-archive-index/0.1"
SUBJECT_KIND = "csoai.provable-archive-subject/0.1"
METHOD_URL = "https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/PROVABLE-ARCHIVE-METHOD.md"
REKOR = "https://rekor.sigstore.dev"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def subject_of(card: dict[str, Any]) -> str | None:
    """The archive series a card belongs to, or None if it is not a series."""
    payload = card.get("payload") or {}
    if card.get("surface") == "xrpl.asset.state" and payload.get("symbol"):
        return f"xrpl:{payload['symbol']}"
    if payload.get("schema") in SERIES_SCHEMAS and isinstance(payload.get("subject"), str):
        return payload["subject"]
    return None


def dir_of(subject: str) -> str:
    return re.sub(r"[^a-z0-9.-]+", "-", subject.lower()).strip("-")


def entry_of(card: dict[str, Any], proof: list[str] | None, root: dict[str, Any], root_sha: str | None,
             witness: dict[str, Any] | None, commit: str | None) -> dict[str, Any]:
    payload = card.get("payload") or {}
    shas = list(root.get("card_sha256") or [])
    sha = card["sha256"]
    rek = (witness or {}).get("witnesses", {}).get("rekor", {}) if witness else {}
    ots = (witness or {}).get("witnesses", {}).get("ots", {}) if witness else {}
    head = payload.get("head") if isinstance(payload.get("head"), dict) else {}
    p1186 = payload.get("proof") if isinstance(payload.get("proof"), dict) else {}
    rng = payload.get("range") if isinstance(payload.get("range"), dict) else None
    return {
        "as_of": root.get("as_of"),
        "block": payload.get("block", head.get("block")),
        "block_hash": payload.get("block_hash", head.get("block_hash")),
        "block_time": payload.get("block_time", head.get("block_time")),
        "range": rng,
        "n_events": payload.get("n_events"),
        "leaf_as_of": card.get("as_of"),
        "sha256": sha,
        "card_url": f"/cards/{sha[:16]}.json",
        "proof_index": shas.index(sha) if sha in shas else None,
        "proof_len": len(proof) if isinstance(proof, list) else None,
        "eip1186_proof_sha256": p1186.get("sha256") if p1186 else None,
        "eip1186_proof_url": p1186.get("url") if p1186 else None,
        "leaf_signed": bool(card.get("sig_ed25519")),
        "root_merkle": root.get("merkle_root"),
        "root_sha256": root_sha,
        "root_signed": bool(root.get("sig_ed25519")),
        "rekor_logIndex": rek.get("logIndex"),
        "rekor_url": f"{REKOR}/api/v1/log/entries?logIndex={rek['logIndex']}" if rek.get("logIndex") is not None else None,
        "ots_path": ots.get("path"),
        "commit": commit,
    }


# ----------------------------------------------------------------------------- sources
def git(*args: str, binary: bool = False) -> bytes | str:
    out = subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True)
    return out.stdout if binary else out.stdout.decode("utf-8")


def load_witnesses_at(commit: str | None) -> dict[str, dict[str, Any]]:
    """root as_of -> witness sidecar. Witness files are committed beside the root they name."""
    out: dict[str, dict[str, Any]] = {}
    names: list[str]
    if commit:
        try:
            listing = git("ls-tree", "-r", "--name-only", commit, "public/interop")
        except subprocess.CalledProcessError:
            return out
        names = [n for n in listing.split("\n") if re.search(r"/root-witness-\d{4}-\d{2}-\d{2}(-[0-9a-f]{8})?\.json$", n) or n.endswith("/root-witness-latest.json")]
    else:
        names = [str(p.relative_to(ROOT)) for p in INTEROP.glob("root-witness-*.json")]
    for n in names:
        try:
            raw = git("show", f"{commit}:{n}") if commit else (ROOT / n).read_text(encoding="utf-8")
            w = json.loads(raw)
        except Exception:
            continue
        art = w.get("artifact") or {}
        if art.get("as_of") and art.get("merkle_root"):
            out[art["as_of"]] = w
    return out


def cards_at(commit: str | None, shas: list[str]) -> dict[str, tuple[dict[str, Any], list[str] | None]]:
    """sha -> (card, proof) for the given root, from the tree at `commit` or the working tree."""
    out: dict[str, tuple[dict[str, Any], list[str] | None]] = {}
    if commit:
        paths = [f"public/cards/{s[:16]}.json" for s in shas]
        proc = subprocess.run(
            ["git", "cat-file", "--batch"], cwd=ROOT, input="\n".join(f"{commit}:{p}" for p in paths).encode() + b"\n",
            capture_output=True, check=True,
        )
        data = proc.stdout
        i = 0
        for s in shas:
            nl = data.index(b"\n", i)
            header = data[i:nl].decode()
            i = nl + 1
            if header.endswith(" missing"):
                continue
            size = int(header.split()[-1])
            blob = data[i:i + size]
            i += size + 1
            try:
                wrapped = json.loads(blob.decode("utf-8"))
            except Exception:
                continue
            card = wrapped.get("card") or wrapped
            if card.get("sha256") == s:
                out[s] = (card, wrapped.get("proof"))
    else:
        for s in shas:
            p = PUB / "cards" / f"{s[:16]}.json"
            if not p.is_file():
                continue
            try:
                wrapped = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                continue
            card = wrapped.get("card") or wrapped
            if card.get("sha256") == s:
                out[s] = (card, wrapped.get("proof"))
    return out


def root_at(commit: str | None) -> tuple[dict[str, Any], str]:
    raw = git("show", f"{commit}:public/root.json", binary=True) if commit else (PUB / "root.json").read_bytes()
    return json.loads(raw.decode("utf-8")), sha256_hex(raw)


def root_commits() -> list[str]:
    log = git("log", "--format=%H", "--", "public/root.json")
    return [c for c in log.split("\n") if c]


# ----------------------------------------------------------------------------- store
class Store:
    """public/archive on disk. Append-only by construction."""

    def __init__(self, base: Path = ARCHIVE):
        self.base = base
        self.subjects: dict[str, dict[str, Any]] = {}
        self.appended: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._load()

    def _load(self) -> None:
        if not self.base.is_dir():
            return
        for p in sorted(self.base.glob("*/index.json")):
            try:
                doc = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                continue
            if doc.get("kind") == SUBJECT_KIND and doc.get("subject"):
                self.subjects[doc["subject"]] = doc

    def _doc(self, subject: str, surface: str) -> dict[str, Any]:
        if subject not in self.subjects:
            self.subjects[subject] = {
                "kind": SUBJECT_KIND,
                "subject": subject,
                "dir": dir_of(subject),
                "surface": surface,
                "method": METHOD_URL,
                "note": (
                    "Append-only history of one signed leaf series under the ONE public root. Each entry "
                    "names the root (merkle, sha256, signature) and its witnesses (Rekor logIndex, OTS path) "
                    "so the bytes can be re-verified by a stranger. Point-in-time. Not a rate. Not a grade. "
                    "Not MEASURED. Not a certificate."
                ),
                "entries": [],
            }
        return self.subjects[subject]

    def has(self, subject: str, root_as_of: str, sha: str) -> bool:
        doc = self.subjects.get(subject)
        if not doc:
            return False
        return any(e.get("as_of") == root_as_of and e.get("sha256") == sha for e in doc["entries"])

    def append(self, subject: str, surface: str, entry: dict[str, Any], record: dict[str, Any]) -> bool:
        if self.has(subject, entry["as_of"], entry["sha256"]):
            return False
        doc = self._doc(subject, surface)
        doc["entries"].append(entry)
        self.appended[subject].append(record)
        return True

    def archived_shas(self) -> set[str]:
        """Every leaf sha that already sits in a .jsonl (eligible to prune from /cards)."""
        out: set[str] = set()
        for doc in self.subjects.values():
            for e in doc["entries"]:
                out.add(e["sha256"])
        return out

    def write(self) -> dict[str, Any]:
        self.base.mkdir(parents=True, exist_ok=True)
        top_subjects = []
        roots: set[str] = set()
        witnessed: set[str] = set()
        for subject, doc in sorted(self.subjects.items()):
            doc["entries"].sort(key=lambda e: (e.get("as_of") or "", e.get("sha256") or ""))
            doc["n"] = len(doc["entries"])
            doc["first_as_of"] = doc["entries"][0]["as_of"] if doc["entries"] else None
            doc["last_as_of"] = doc["entries"][-1]["as_of"] if doc["entries"] else None
            doc["as_of"] = now_iso()
            d = self.base / doc["dir"]
            d.mkdir(parents=True, exist_ok=True)
            (d / "index.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
            for rec in self.appended.get(subject, []):
                month = (rec["root_as_of"] or "0000-00")[:7]
                with (d / f"{month}.jsonl").open("a", encoding="utf-8") as fh:
                    fh.write(json.dumps(rec, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n")
            for e in doc["entries"]:
                if e.get("as_of"):
                    roots.add(e["as_of"])
                    if e.get("rekor_logIndex") is not None:
                        witnessed.add(e["as_of"])
            last = doc["entries"][-1] if doc["entries"] else None
            top_subjects.append({
                "subject": subject,
                "dir": doc["dir"],
                "surface": doc["surface"],
                "n": doc["n"],
                "first_as_of": doc["first_as_of"],
                "last_as_of": doc["last_as_of"],
                "latest": {k: last.get(k) for k in ("as_of", "block", "block_hash", "sha256", "eip1186_proof_sha256", "root_merkle", "rekor_logIndex", "ots_path", "root_signed")} if last else None,
                "url": f"/archive/{doc['dir']}/index.json",
            })
        top = {
            "kind": INDEX_KIND,
            "as_of": now_iso(),
            "method": METHOD_URL,
            "root": "https://councilof.ai/root.json",
            "witness_pointer": "https://councilof.ai/interop/root-witness-pointer.json",
            "note": (
                "Provable archive: the hourly signed history of permission-state leaves under the ONE "
                "public root, indexed from git. Discrete, point-in-time entries with inclusion proofs and "
                "third-party witnesses. Not a rate, not a reference value, not a grade. Use-restriction: "
                "not for use in or as a financial instrument; no composite or continuous series is published."
            ),
            "roots_indexed": len(roots),
            "roots_witnessed": len(witnessed),
            "subjects": top_subjects,
        }
        (self.base / "index.json").write_text(json.dumps(top, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        return top


# ----------------------------------------------------------------------------- index one root
def index_root(store: Store, commit: str | None, witnesses_head: dict[str, dict[str, Any]]) -> int:
    root, root_sha = root_at(commit)
    shas = list(root.get("card_sha256") or [])
    cards = cards_at(commit, shas)
    witnesses = dict(witnesses_head)
    witnesses.update(load_witnesses_at(commit))
    witness = witnesses.get(str(root.get("as_of")))
    if witness and witness.get("artifact", {}).get("merkle_root") != root.get("merkle_root"):
        witness = None
    n = 0
    for sha in shas:
        got = cards.get(sha)
        if not got:
            continue
        card, proof = got
        subject = subject_of(card)
        if not subject:
            continue
        entry = entry_of(card, proof, root, root_sha, witness, commit)
        record = {
            "root_as_of": root.get("as_of"),
            "commit": commit,
            "root": {k: root.get(k) for k in ("as_of", "merkle_root", "card_count", "sig_ed25519", "did_intended")},
            "root_sha256": root_sha,
            "card": card,
            "proof": proof,
            "witness": {
                "rekor_logIndex": entry["rekor_logIndex"],
                "rekor_url": entry["rekor_url"],
                "ots_path": entry["ots_path"],
                "sidecar": (witness or {}).get("artifact", {}).get("sha256"),
            },
        }
        if store.append(subject, card.get("surface") or "", entry, record):
            n += 1
    return n


def prune_cards(store: Store, dry_run: bool = False) -> dict[str, int]:
    root, _ = root_at(None)
    keep = {s[:16] for s in root.get("card_sha256") or []}
    archived16 = {s[:16] for s in store.archived_shas()}
    removed = 0
    kept_unarchived = 0
    for sub in ("cards", "proofs"):
        d = PUB / sub
        if not d.is_dir():
            continue
        for p in d.glob("*.json"):
            s16 = p.stem
            if s16 in keep:
                continue
            if s16 not in archived16:
                kept_unarchived += 1
                continue
            if not dry_run:
                p.unlink()
            removed += 1
    return {"removed": removed, "kept_unarchived": kept_unarchived, "current": len(keep)}


def main() -> int:
    ap = argparse.ArgumentParser(description="Index the signed hourly history into public/archive")
    ap.add_argument("--backfill", action="store_true", help="walk git history of public/root.json")
    ap.add_argument("--prune-cards", action="store_true", help="remove archived, non-current card/proof files")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    store = Store()
    head_witnesses = load_witnesses_at(None)
    added = 0
    if args.backfill:
        commits = root_commits()
        for c in reversed(commits):  # oldest first, so entries append in time order
            try:
                added += index_root(store, c, head_witnesses)
            except Exception as e:
                print(f"skip {c[:12]}: {type(e).__name__}: {e}", file=sys.stderr)
        print(f"backfill: {len(commits)} root commits walked, {added} entries appended")
    else:
        try:
            head = git("rev-parse", "HEAD").strip()
        except Exception:
            head = None
        added += index_root(store, None, head_witnesses)
        # Working-tree entries carry the commit that will contain them only after
        # the GHA commit step; record the parent for provenance.
        for recs in store.appended.values():
            for r in recs:
                r["commit"] = None
                r["parent_commit"] = head
        print(f"working tree: {added} entries appended")

    if args.dry_run:
        print("dry-run: nothing written")
        return 0
    top = store.write()
    print(f"wrote public/archive: {len(top['subjects'])} subjects, {top['roots_indexed']} roots, {top['roots_witnessed']} witnessed")
    if args.prune_cards:
        res = prune_cards(store)
        print(f"prune: removed={res['removed']} kept_unarchived={res['kept_unarchived']} current={res['current']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
