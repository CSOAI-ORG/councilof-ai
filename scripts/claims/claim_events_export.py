#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""claim_events_export.py - the producer of the public claim-event feed (/api/claims/events).

  claim_events_export.py export --data DATA_ROOT --register REGISTER_JSON --out FEED_DIR [--date D] [--as-of T]
  claim_events_export.py sign   --out FEED_DIR --date D --vc VC_PY [--token PATH]

WHAT IT READS. The claim-watch stores (claim_watch.py) under DATA_ROOT/<sealed_id>/:
  history/events.jsonl  append-only, hash-linked: line n carries prev_sha256 = sha256(line n-1 bytes)
  atom/atoms.jsonl      the normalised atoms of each observation run
Nothing else. It never fetches, never measures and never rewrites a source line.

WHAT IT WRITES (FEED_DIR, committed and served as-is by functions/api/claims/events/):
  events.jsonl          the feed. APPEND-ONLY: an existing feed is verified, kept byte-for-byte, and only source lines
                        not yet exported are appended. Line n carries prev_sha256 = sha256(line n-1 bytes, no newline);
                        line 0 carries null. Every line names the source line it projects by (store, line, sha256).
  heads/<D>.json        the daily head: n_lines, sha256 of the whole feed, sha256 of the last line, the previous
                        head's sha256, and each source log's own head. `sign` board-signs it (<D>.signed.json).
  head.json, head.signed.json   byte copies of the newest SIGNED dated head (what the Function serves); written by
                        `sign`, never by `export`.

DISCLOSURE FOLLOWS PUBLICATION. A subject is DISCLOSED (name, claim ids, atom names in the feed) only when its
registry_id is a LIVE row of the published claim-maintenance register (public/spec/claim-maintenance/register.json).
Anything else is SEALED: the subject is its sealed id, claims are c1..cN and atoms a1..aN in order of first appearance
in the private source (stable, and they reveal no name), and no free text, URL, observation digest or atom value is
copied. A sealed line still commits to the private source line by its sha256, so the feed can be checked against the
private log by anyone who later holds it, and the projection cannot drift silently.

Fails closed (exit 1, nothing written): a broken source chain, a source line that no longer matches the digest the
feed recorded for it, a feed whose own chain does not verify, or a banned internal name in any line about to be written.
"""
import argparse, datetime, hashlib, json, os, pathlib, re, shutil, subprocess, sys

SCHEMA_LINE = "csoai.claim-event/0.1"
SCHEMA_HEAD = "csoai.claim-event-head/0.1"
FEED_PATH = "/claims/events/v0.1/events.jsonl"
ARTIFACT_PREFIX = "claims/events/v0.1/heads"
STORES = (("event", "history/events.jsonl"), ("atoms", "atom/atoms.jsonl"))
KIND_RANK = {"event": 0, "atoms": 1}
# Internal names that must never reach a public byte (scripts/brand-gate.mjs is the authority; this is the local stop).
BANNED = re.compile(r"venturi|laputa|pontius|\bSOV-|sov3|sov34|oracle-micro|/evac-bulk|~/lanes|/workspace/", re.I)
# Structured fields copied from a source event. Free text (reason, why, notes) is never copied.
EVENT_FIELDS_STATE = ("object_state", "change_state", "recorded_state")
# FETCH_FAILED / UNCONFIRMED: claim_watch.py's change-detection states since 29 Sep 2026 (harness-router-20260929 winner):
# a failed fetch and a change seen on one fetch only are recorded as such, never as a change.
STATES_OK = {None, "OBSERVED", "MEASURED", "REPRODUCED", "SIGNED", "ROOTED", "WITNESSED", "CONFIRMED", "CORRECTED",
             "QUARANTINED", "SUPERSEDED", "CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE",
             "FETCH_FAILED", "UNCONFIRMED"}


def _ms_key(x):
    """claim-diff winner (harness-router-20260929): multiset canonical form - lists order-free with multiplicity at every
    depth, types kept apart. Same function as claim_watch.py, whose selftest proves it equals DeepDiff(ignore_order=True,
    report_repetition=True) on the router's 26 fixtures."""
    if x is None:
        return ("n",)
    if isinstance(x, bool):
        return ("b", x)
    if isinstance(x, int):
        return ("i", x)
    if isinstance(x, float):
        return ("f", x)
    if isinstance(x, str):
        return ("s", x)
    if isinstance(x, dict):
        return ("d", tuple(sorted((_ms_key(k), _ms_key(v)) for k, v in x.items())))
    if isinstance(x, (list, tuple)):
        return ("l" if isinstance(x, list) else "t", tuple(sorted(_ms_key(e) for e in x)))
    return ("r", type(x).__name__, repr(x))
HEX64 = re.compile(r"^[0-9a-f]{64}$")


def sha(b):
    return hashlib.sha256(b).hexdigest()


def line_bytes(obj):
    # Compact, key-sorted, UTF-8. The chain hashes these exact bytes (no trailing newline).
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def die(msg):
    sys.stderr.write(f"claim_events_export: {msg}\n")
    raise SystemExit(1)


def read_lines(p):
    if not p.exists() or p.stat().st_size == 0:
        return []
    raw = p.read_bytes()
    if not raw.endswith(b"\n"):
        die(f"{p}: last line has no newline (a partial write); refusing to read a half-written log")
    return raw[:-1].split(b"\n")


def verify_source_chain(lines, label):
    """history/events.jsonl carries its own chain. A source that does not verify is not exported."""
    prev = None
    for i, b in enumerate(lines):
        e = json.loads(b)
        if e.get("prev_sha256") != prev:
            die(f"SOURCE_CHAIN_BROKEN {label} line {i}: prev_sha256 {e.get('prev_sha256')} != {prev}")
        if e.get("seq") != i:
            die(f"SOURCE_CHAIN_BROKEN {label} line {i}: seq {e.get('seq')}")
        prev = sha(b)


def verify_feed(lines):
    prev = None
    for i, b in enumerate(lines):
        o = json.loads(b)
        if b != line_bytes(o):
            die(f"FEED_NOT_CANONICAL line {i}")
        if o.get("seq") != i or o.get("prev_sha256") != prev:
            die(f"FEED_CHAIN_BROKEN line {i}")
        prev = sha(b)
    return prev


def live_registry_ids(register_path):
    reg = json.loads(pathlib.Path(register_path).read_text())
    return {r["registry_id"] for r in reg.get("registries", []) if r.get("status") == "LIVE"}


def subject_meta(store_dir, subjects_dir):
    """The subject's name and registry_id come from its subject.json when it is available; the sealed id alone
    otherwise (a store with no subject file can only ever be SEALED)."""
    sid = store_dir.name
    if subjects_dir:
        for sj in pathlib.Path(subjects_dir).glob("*/subject.json"):
            d = json.loads(sj.read_text())
            if d.get("sealed_id") == sid:
                return {"subject": d.get("subject"), "registry_id": d.get("registry_id")}
    return {"subject": None, "registry_id": None}


class Refs:
    """Opaque, stable references for a sealed subject: c1.. / a1.. in order of first appearance in the private
    source. Recomputed from the source on every run, so they never depend on the feed."""
    def __init__(self, ev_lines, at_lines):
        self.c, self.a = {}, {}
        for b in ev_lines:
            o = json.loads(b)
            checks = o.get("checks") if isinstance(o.get("checks"), dict) else {}
            for cid in [o.get("claim_id")] + sorted(checks):
                if cid not in (None, "*") and cid not in self.c:
                    self.c[cid] = f"c{len(self.c) + 1}"
        for b in at_lines:
            for name in sorted((json.loads(b).get("atoms") or {}).keys()):
                if name not in self.a:
                    self.a[name] = f"a{len(self.a) + 1}"

    def claim(self, cid, disclosed):
        return cid if (disclosed or cid in (None, "*")) else self.c[cid]

    def atom(self, name, disclosed):
        return name if disclosed else self.a[name]


def project(kind, idx, b, sid, meta, disclosed, refs, prev_atoms):
    o = json.loads(b)
    rec = {"schema": SCHEMA_LINE, "kind": kind, "at": o.get("at"), "run_id": o.get("run_id"),
           "subject_sealed_id": sid, "subject": meta["subject"] if disclosed else None,
           "disclosure": "DISCLOSED" if disclosed else "SEALED",
           "source": {"store": dict(STORES)[kind], "line": idx, "line_sha256": sha(b)}}
    if kind == "event":
        if o.get("subject_sealed_id") not in (None, sid):
            die(f"SOURCE_MISFILED {sid} line {idx}: event names sealed id {o.get('subject_sealed_id')}")
        rec["date"] = o.get("date")
        rec["claim"] = refs.claim(o.get("claim_id"), disclosed)
        for k in EVENT_FIELDS_STATE:
            if k in o:
                if o[k] not in STATES_OK:
                    die(f"UNKNOWN_STATE {k}={o[k]!r} at {sid} line {idx}")
                rec[k] = o[k]
        if "all_pass" in o:
            rec["checks_all_pass"] = bool(o["all_pass"])
        if "checks" in o and isinstance(o["checks"], dict):
            rec["checks"] = {refs.claim(k, disclosed): bool(v) for k, v in sorted(o["checks"].items())}
        if isinstance(o.get("receipt_sha256"), str) and HEX64.match(o["receipt_sha256"]):
            # A digest of the private signed receipt: it reveals nothing without the receipt, and lets a later reader
            # who is given the receipt (or finds it in the capsule chain) match it to this line.
            rec["receipt_sha256"] = o["receipt_sha256"]
        if o.get("fix"):
            rec["fixed"] = True
    else:
        atoms = o.get("atoms") or {}
        # multiset digest: a reordered list is not an atom change (was sha(line_bytes(v)), list-order sensitive)
        digests = {k: sha(repr(_ms_key(v)).encode()) for k, v in atoms.items()}
        if prev_atoms is None:
            changed, rec["baseline"] = sorted(digests), True
        else:
            changed = sorted(k for k in set(digests) | set(prev_atoms) if digests.get(k) != prev_atoms.get(k))
            rec["baseline"] = False
        rec["n_atoms"] = len(digests)
        rec["atoms_changed"] = sorted((refs.atom(k, disclosed) for k in changed), key=lambda r: (len(r), r))
        rec["phase"] = o.get("phase")
        return rec, digests
    return rec, prev_atoms


def cmd_export(a):
    data = pathlib.Path(a.data).expanduser()
    out = pathlib.Path(a.out)
    live = live_registry_ids(a.register)
    feed_p = out / "events.jsonl"
    feed = read_lines(feed_p)
    head_sha = verify_feed(feed)
    exported = {}  # (sid, store, line) -> line_sha256 already in the feed
    for b in feed:
        o = json.loads(b)
        exported[(o["subject_sealed_id"], o["source"]["store"], o["source"]["line"])] = o["source"]["line_sha256"]

    new, subjects = [], []
    for store in sorted(p for p in data.iterdir() if p.is_dir()):
        sid = store.name
        ev = read_lines(store / "history/events.jsonl")
        at = read_lines(store / "atom/atoms.jsonl")
        verify_source_chain(ev, f"{sid}/history/events.jsonl")
        meta = subject_meta(store, a.subjects)
        disclosed = bool(meta["registry_id"]) and meta["registry_id"] in live
        refs = Refs(ev, at)
        prev_atoms = None
        for kind, lines in (("event", ev), ("atoms", at)):
            for i, b in enumerate(lines):
                rec, nxt = project(kind, i, b, sid, meta, disclosed, refs, prev_atoms)
                if kind == "atoms":
                    prev_atoms = nxt
                key = (sid, dict(STORES)[kind], i)
                if key in exported:
                    if exported[key] != sha(b):
                        die(f"SOURCE_REWRITTEN {sid} {key[1]} line {i}: the feed recorded {exported[key][:16]}..., "
                            f"the source now hashes {sha(b)[:16]}...")
                    continue
                new.append(((rec["at"] or "", sid, KIND_RANK[kind], i), rec))
        subjects.append({"subject_sealed_id": sid, "disclosure": "DISCLOSED" if disclosed else "SEALED",
                         "source_events": {"n_lines": len(ev), "head_line_sha256": sha(ev[-1]) if ev else None},
                         "source_atoms": {"n_lines": len(at), "head_line_sha256": sha(at[-1]) if at else None}})
    # Every exported line must still exist in its source (a truncated source is a rewrite too).
    have = {(s["subject_sealed_id"], "history/events.jsonl"): s["source_events"]["n_lines"] for s in subjects}
    have.update({(s["subject_sealed_id"], "atom/atoms.jsonl"): s["source_atoms"]["n_lines"] for s in subjects})
    for (sid, st, i) in exported:
        if i >= have.get((sid, st), 0):
            die(f"SOURCE_TRUNCATED {sid} {st}: the feed exported line {i}, the source now has {have.get((sid, st), 0)}")

    new.sort(key=lambda t: t[0])
    add = []
    prev, seq = head_sha, len(feed)
    for _, rec in new:
        rec = dict(rec, seq=seq, prev_sha256=prev)
        b = line_bytes(rec)
        if BANNED.search(b.decode()):
            die(f"BANNED_NAME in line {seq} (source {rec['source']}); nothing written")
        add.append(b); prev = sha(b); seq += 1

    all_lines = feed + add
    out.mkdir(parents=True, exist_ok=True)
    body = b"".join(x + b"\n" for x in all_lines)
    D = a.date or now()[:10]
    heads = out / "heads"
    heads.mkdir(exist_ok=True)
    prior = sorted(p for p in heads.glob("????-??-??.json") if p.stem < D)
    prior_n = json.loads(prior[-1].read_text())["feed"]["n_lines"] if prior else 0
    first = json.loads(all_lines[0]) if all_lines else {}
    last = json.loads(all_lines[-1]) if all_lines else {}
    head = {
        "schema": SCHEMA_HEAD, "date": D, "as_of": a.as_of or now(),
        "feed": {"path": FEED_PATH, "n_lines": len(all_lines), "bytes_sha256": sha(body),
                 "head_line_sha256": sha(all_lines[-1]) if all_lines else None, "head_seq": len(all_lines) - 1,
                 "first_at": first.get("at"), "last_at": last.get("at"), "lines_added_since_prev_head": len(all_lines) - prior_n},
        "prev_head": ({"date": prior[-1].stem, "sha256": sha(prior[-1].read_bytes())} if prior else None),
        "subjects": subjects,
        "totals": {"subjects": len(subjects), "sealed": sum(s["disclosure"] == "SEALED" for s in subjects),
                   "disclosed": sum(s["disclosure"] == "DISCLOSED" for s in subjects)},
        "rules": {
            "chain": "line n carries prev_sha256 = sha256 of line n-1's bytes without its newline; line 0 carries null; "
                     "seq = n. Lines are compact key-sorted UTF-8 JSON.",
            "append_only": "an existing feed is kept byte-for-byte; a head commits to the whole file by bytes_sha256 and "
                           "to the previous head by prev_head.sha256",
            "disclosure": "a subject is DISCLOSED only when its registry_id is a LIVE row of "
                          "/spec/claim-maintenance/register.json; otherwise SEALED: sealed id, claims c1..cN and atoms "
                          "a1..aN by first appearance in the private source, no names, text, URLs or values",
            "source": "each line names the private source line it projects by store, line index and sha256",
        },
        "what_this_is": "The append-only log of what the claim maintenance loop observed, measured and decided about the "
                        "claims it watches, with a head that commits to every byte of it.",
        "what_this_is_not": [
            "not a verdict on any subject, and not certification: CONFIRMED means no change was detected against the "
            "pinned observation and the checks reproduced",
            "a QUARANTINED line records a proposal for the owner's review, not a correction",
            "no score, rank or index may be derived from these states; they describe the evidence, never the claimant",
        ],
        "producer": {"script": "scripts/claims/claim_events_export.py", "sha256": sha(pathlib.Path(__file__).read_bytes())},
        "verify": "node scripts/claims/claim-events-rederive.mjs --dir public/claims/events/v0.1",
    }
    hb = (json.dumps(head, indent=1, sort_keys=True, ensure_ascii=False) + "\n").encode()
    if BANNED.search(hb.decode()):
        die("BANNED_NAME in head; nothing written")
    tmp = feed_p.with_suffix(".jsonl.tmp")
    tmp.write_bytes(body); os.replace(tmp, feed_p)
    hp = heads / f"{D}.json"
    if hp.exists() and hp.read_bytes() != hb and (heads / f"{D}.signed.json").exists():
        die(f"HEAD_ALREADY_SIGNED {hp.name}: a signed head is never overwritten; pass a later --date")
    hp.write_bytes(hb)
    print(json.dumps({"ok": True, "n_lines": len(all_lines), "added": len(add), "bytes_sha256": sha(body),
                      "head": hp.name, "head_sha256": sha(hb)}))


def cmd_sign(a):
    out = pathlib.Path(a.out)
    hp = out / "heads" / f"{a.date}.json"
    if not hp.exists():
        die(f"no head {hp}")
    s = subprocess.run([sys.executable, a.vc, "sign", "--file", str(hp), "--artifact-path", f"{ARTIFACT_PREFIX}/{a.date}.json",
                        "--token", a.token], capture_output=True, text=True, timeout=180)
    if s.returncode != 0:
        die(f"sign failed rc={s.returncode}: {s.stderr.strip()[-300:]}")
    sp = hp.with_name(hp.stem + ".signed.json")
    doc = json.loads(sp.read_text())
    if doc["payload"]["artifact"]["sha256"] != sha(hp.read_bytes()):
        die("signed envelope does not pin the head bytes")
    if BANNED.search(sp.read_text()):
        die("BANNED_NAME in the signed envelope")
    # head.json / head.signed.json move together, and only once the head is signed: the Function serves the feed only
    # when feed, head and signature agree, so an unsigned head is never the served one.
    shutil.copyfile(hp, out / "head.json")
    shutil.copyfile(sp, out / "head.signed.json")

    # The reaction index is a derived view of the served, signed claim-event head.
    # Refresh it only for the canonical public feed; fixture/temp sign operations stay isolated.
    repo = pathlib.Path(__file__).resolve().parents[2]
    canonical_out = (repo / "public/claims/events/v0.1").resolve()
    reaction_script = repo / "scripts/claims/claim_maintenance_reaction.py"
    reaction_output = repo / "public/spec/claim-maintenance/reaction-index.json"
    if out.resolve() == canonical_out and reaction_script.is_file() and reaction_output.parent.is_dir():
        rr = subprocess.run(
            [sys.executable, str(reaction_script), "--events-dir", str(out), "--output", str(reaction_output)],
            capture_output=True, text=True, timeout=60,
        )
        if rr.returncode != 0:
            die(f"reaction refresh failed rc={rr.returncode}: {(rr.stderr or rr.stdout).strip()[-300:]}")

    print(json.dumps({"ok": True, "signed": sp.name, "payload_sha256": doc["signature"]["payload_sha256"]}))


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    e = sp.add_parser("export")
    e.add_argument("--data", required=True); e.add_argument("--register", required=True); e.add_argument("--out", required=True)
    e.add_argument("--subjects", default=None, help="dir of <subject>/subject.json (claim-watch subjects/)")
    e.add_argument("--date", default=None); e.add_argument("--as-of", dest="as_of", default=None)
    s = sp.add_parser("sign")
    s.add_argument("--out", required=True); s.add_argument("--date", required=True); s.add_argument("--vc", required=True)
    s.add_argument("--token", default="~/.secrets/board-sign-pod-token")
    a = ap.parse_args()
    (cmd_export if a.cmd == "export" else cmd_sign)(a)


if __name__ == "__main__":
    main()
