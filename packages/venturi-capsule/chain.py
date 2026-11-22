# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""The daily measurement-index chain: tamper-evident (no day can be rewritten or backdated without breaking a
signed link) and gap-evident (a missed day is a declared gap_days in the next day; a removed day is a dangling link).

  venturi_capsule.py verify-chain  [--dir /evac-bulk] [--head DATE] [--deep] [--bitcoin] [--summary]
      walk every daily index from the head back to genesis. Per day: the board signature
      (did:web:csoai.org#board-attestation-1) pins the index bytes; the prev link names the final version of the
      previous day (sha256 + index_root); gap_days is recomputed; the day's re-issues (supersedes /
      supersession.jsonl) are checked; the OTS proof must bind to the bytes and its state is reported (Bitcoin block
      height where upgraded; --bitcoin checks each attestation against the block header from public Esplora APIs).
      --deep also recomputes every capsule id, batch Merkle root and the index root (needs the batch dirs).
      Exit 0 = CHAIN_INTACT (declared gaps are reported, not errors), 1 = CHAIN_BROKEN.
  venturi_capsule.py chain-genesis --file INDEX [--no-sign]
      the signed genesis record for a pre-chain index (schema 0.2): prev = null, with the genesis note.
  venturi_capsule.py chain-head --date D [--dir /evac-bulk] [--no-sign]
      the weekly chain-head record (head root, head sha256, chain length, gaps), signed and OTS-stamped, plus the
      Rekor rekord body and the unsigned XRPL memo draft for it. PREPARED ONLY: nothing is submitted.
  venturi_capsule.py rekor-anchor --file INDEX_OR_HEAD [--dry-run]
      submit the prepared `rekord` entry (the exact Ed25519 preimage the board signed) to Rekor, read it back by
      logIndex, check the body hash == the preimage sha256, the signature and the inclusion proof (RFC 9162 path to the
      checkpoint root), and save <base>.rekor-entry.json + <base>.rekor-receipt.json. Idempotent: an entry already
      saved, or already in Rekor for the same preimage hash, is never submitted again. GATED (REKOR_APPROVAL_FILE).
  venturi_capsule.py publish-hf --date D [--dir /evac-bulk] [--dry-run]
      DATE's chained index (+ .signed.json, .json.ots), its re-issue history, the genesis record on the genesis day and
      the chain head of DATE, as NEW files under measurement-index/DATE/ of the public dataset csoai/evidence-index.
      GATED: uploads nothing unless the owner-approval file exists (APPROVAL_FILE); refuses a broken chain, refuses to
      overwrite any existing path whose bytes differ (identical = skipped), refuses any file carrying an internal name.

Nothing here publishes or submits anything.
"""
import argparse, base64, datetime, hashlib, json, os, pathlib, re, sys, time, urllib.error, urllib.request

import venturi_capsule as v

BOARD_DID = "did:web:csoai.org#board-attestation-1"
# Pinned in functions/_lib/cardVerify.ts PINNED_ANCHORS and in scripts/measurement_anchor_prepare.py; the verifier
# itself reads the key from https://csoai.org/.well-known/did.json and reports whether the two agree.
BOARD_PUB_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170"
REKOR = "https://rekor.sigstore.dev"
ESPLORA = ["https://blockstream.info/api", "https://mempool.space/api"]
GENESIS_NAME = "measurement-index-chain-genesis.json"
VERIFIER_NAME = "verify-chain (the reference chain verifier, chain.py, Apache-2.0)"
HF_REPO = "csoai/evidence-index"
HF_PREFIX = "measurement-index"
# Publication gate: every index carries private_until = "owner approves publication". Nothing is uploaded unless the
# OWNER has created this file (one line: who approved, when). An agent's instruction is not that approval.
APPROVAL_FILE = "~/.config/csoai/approvals/measurement-index-hf-publish.APPROVED"
# Rekor: a new public transparency-log entry per final index / weekly head. Same gate: the owner's recorded approval.
REKOR_APPROVAL_FILE = "~/.config/csoai/approvals/measurement-index-rekor-submit.APPROVED"
BANNED_PUBLIC = [re.compile(r"venturi", re.I)]  # internal architecture name: never on a public surface
HEAD_RE = re.compile(r"^measurement-index-chain-head-(\d{4}-\d{2}-\d{2})\.json$")
GENESIS_NOTE = ("GENESIS: the measurement-index chain starts at this day's index. There is no earlier index, so "
                "prev_date, prev_index_sha256 and prev_index_root are null by construction, not by omission. The genesis "
                "index predates the chained schema (0.3) and its bytes are unchanged; this signed record pins them.")


def canon(o):
    return v.canon(o)


def sha(b):
    return v.sha(b)


def utcnow():
    return v.utcnow()


def _dates_between(a, b):
    """Calendar dates strictly between two ISO dates."""
    da, db = datetime.date.fromisoformat(a), datetime.date.fromisoformat(b)
    return [(da + datetime.timedelta(days=i)).isoformat() for i in range(1, (db - da).days)]


# ----------------------------------------------------------------------------- signatures and OTS
def sig_check(target, signed_path=None):
    """The board signature over an artifact: the payload pins these bytes, the payload hash matches, Ed25519 verifies
    under the did:web key, the signer is the board DID. Returns (state dict, payload or None)."""
    target = pathlib.Path(target)
    sp = pathlib.Path(signed_path) if signed_path else target.with_name(target.stem + ".signed.json")
    if not sp.exists():
        return {"state": "UNSIGNED", "why": f"no {sp.name}"}, None
    try:
        s = json.loads(sp.read_text())
        payload, sig = s["payload"], s["signature"]
    except Exception as e:
        return {"state": "FAILS", "why": f"unreadable sidecar: {type(e).__name__}"}, None
    c = canon(payload)
    if sha(c) != sig.get("payload_sha256"):
        return {"state": "FAILS", "why": "payload sha256 != signature.payload_sha256"}, payload
    if payload.get("artifact", {}).get("sha256") != v.file_sha(target):
        return {"state": "FAILS", "why": "the signed payload does not pin these bytes"}, payload
    if sig.get("did") != BOARD_DID:
        return {"state": "FAILS", "why": f"signer {sig.get('did')!r} is not {BOARD_DID}"}, payload
    try:
        v.did_key_cached().verify(bytes.fromhex(sig["sig_ed25519"]), c)
    except Exception:
        return {"state": "FAILS", "why": "Ed25519 signature does not verify under the board key"}, payload
    return {"state": "VERIFIES", "did": sig["did"], "signed_at": sig.get("signed_at"), "payload_sha256": sha(c)}, payload


class Headers:
    """Bitcoin block headers (merkle root) by height from two public Esplora APIs; memory cache only."""

    def __init__(self):
        self.c = {}

    def merkle_root(self, height):
        if height in self.c:
            return self.c[height]
        for base in ESPLORA:
            try:
                h = urllib.request.urlopen(urllib.request.Request(f"{base}/block-height/{height}", headers=v.UA), timeout=20).read().decode().strip()
                b = json.load(urllib.request.urlopen(urllib.request.Request(f"{base}/block/{h}", headers=v.UA), timeout=20))
                if b.get("height") == height and b.get("id") == h:
                    self.c[height] = {"block_hash": h, "merkle_root": b["merkle_root"], "source": base, "time": b.get("timestamp")}
                    return self.c[height]
            except Exception:
                time.sleep(1)
        return None


def ots_detail(target, ots_path, headers=None):
    """v.ots_state plus the Bitcoin block height of every Bitcoin attestation; with headers, each attestation's
    commitment (reversed) is compared with the block's merkle_root."""
    st = v.ots_state(target, ots_path)
    if st["state"] in ("NOT_STAMPED",):
        return st
    from opentimestamps.core.timestamp import DetachedTimestampFile
    from opentimestamps.core.serialize import BytesDeserializationContext
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
    dt = DetachedTimestampFile.deserialize(BytesDeserializationContext(pathlib.Path(ots_path).read_bytes()))
    btc = []
    for msg, att in dt.timestamp.all_attestations():
        if isinstance(att, BitcoinBlockHeaderAttestation):
            row = {"height": att.height}
            if headers is not None:
                hdr = headers.merkle_root(att.height)
                if hdr is None:
                    row["header_check"] = "HEADER_UNREAD"
                else:
                    row.update(block_hash=hdr["block_hash"], block_time=hdr.get("time"), header_source=hdr["source"],
                               header_check="MATCHES_HEADER" if bytes(msg)[::-1].hex() == hdr["merkle_root"] else "DOES_NOT_MATCH_HEADER")
            btc.append(row)
    if btc:
        st["bitcoin_block_heights"] = sorted({r["height"] for r in btc})
        st["bitcoin"] = btc
    return st


# ----------------------------------------------------------------------------- one day
def _supersession(dirpath, date, doc, h, errors):
    """The day's re-issue history: the signed `supersedes` link (0.3) and the loop's supersession.jsonl.
    Both must end at the final version, and every replaced version must still be on disk with its pinned sha256."""
    out = {}
    d = pathlib.Path(dirpath)
    sup = doc.get("supersedes")
    if sup:
        p = pathlib.Path(sup.get("now_at") or "")
        if not p.is_absolute():
            p = d / p.name
        elif not p.exists():  # the chain was copied elsewhere: look beside the index
            p = d / p.name
        if not p.exists():
            errors.append(f"{date}: SUPERSEDED_VERSION_MISSING the replaced version {sup.get('sha256', '')[:16]} is not at {sup.get('now_at')}")
            out["supersedes"] = "MISSING"
        elif v.file_sha(p) != sup.get("sha256"):
            errors.append(f"{date}: SUPERSEDED_VERSION_ALTERED {p.name} does not have the pinned sha256")
            out["supersedes"] = "ALTERED"
        else:
            out["supersedes"] = f"OK ({p.name})"
    jl = d / f"measurement-index-v0.2-{date}.supersession.jsonl"
    if jl.exists():
        lines = [json.loads(x) for x in jl.read_text().splitlines() if x.strip()]
        bad = []
        for i, r in enumerate(lines):
            p = pathlib.Path(r["superseded"]["now_at"])
            p = p if p.exists() else d / p.name
            if not p.exists():
                bad.append(f"re-issue {i + 1}: replaced version missing ({p.name})")
            elif v.file_sha(p) != r["superseded"]["sha256"]:
                bad.append(f"re-issue {i + 1}: replaced version altered ({p.name})")
            if i and lines[i - 1]["by"]["sha256"] != r["superseded"]["sha256"]:
                bad.append(f"re-issue {i + 1}: does not continue re-issue {i}")
        if lines and lines[-1]["by"]["sha256"] != h:
            bad.append("the last re-issue does not name the final version (the final index was replaced without a record)")
        if sup and lines and lines[-1]["superseded"]["sha256"] != sup.get("sha256"):
            bad.append("the signed supersedes link and supersession.jsonl disagree on the replaced version")
        for b in bad:
            errors.append(f"{date}: SUPERSESSION {b}")
        out["reissues"] = len(lines)
        out["supersession_jsonl"] = "OK" if not bad else "BROKEN"
    elif sup:
        out["supersession_jsonl"] = "ABSENT (the signed supersedes link stands on its own)"
    return out


def _deep(doc, cache):
    """Recompute every capsule id, batch Merkle root and the index root (batch results cached across days)."""
    root_fn = v.merkle_root_v01 if doc["schema"] == v.INDEX_SCHEMA_V01 else v.merkle_root
    all_ids = []
    for b in doc["batches"]:
        key = b["dir"]
        if key not in cache:
            res, rec, ids = v.verify_batch(b["dir"])
            cache[key] = (res["record_sha256"], rec["merkle_root"], ids, res.get("signature"))
        rs, mr, ids, sig = cache[key]
        assert rs == b["record_sha256"] and mr == b["merkle_root"], f"batch changed: {b['adapter']} {b['dir']}"
        assert sig is None or str(sig).startswith("VERIFIES"), f"batch signature {sig}: {b['dir']}"
        all_ids += ids
    assert root_fn(all_ids) == doc["index_root"], "index root does not recompute"
    return f"recomputes ({len(all_ids)} capsule ids, {len(doc['batches'])} batches)"


def load_genesis(dirpath):
    p = pathlib.Path(dirpath) / GENESIS_NAME
    if not p.exists():
        return None
    raw = p.read_bytes(); g = json.loads(raw)
    st, payload = sig_check(p)
    problems = []
    if g.get("schema") != v.CHAIN_GENESIS_SCHEMA:
        problems.append(f"schema {g.get('schema')}")
    if any(g.get(k) is not None for k in ("prev_date", "prev_index_sha256", "prev_index_root")) or g.get("gap_days") != 0 or g.get("chain_seq") != 0:
        problems.append("a genesis record must have prev = null, gap_days 0, chain_seq 0")
    if not str(g.get("genesis") or "").startswith("GENESIS"):
        problems.append("no genesis note")
    if payload and payload.get("chain") != {k: g.get(k) for k in g.get("signed_fields", [])}:
        problems.append("the signed payload's chain fields differ from the record")
    return {"path": str(p), "sha256": sha(raw), "doc": g, "signature": st, "problems": problems}


# ----------------------------------------------------------------------------- the walk
def verify_chain(dirpath="/evac-bulk", head=None, deep=False, bitcoin=False, today=None):
    d = pathlib.Path(dirpath)
    days = v.index_days(d)
    errors, warnings, gaps, walked, visited = [], [], [], [], set()
    headers = Headers() if bitcoin else None
    cache = {}
    key_note = None
    try:
        from cryptography.hazmat.primitives import serialization
        raw_pub = v.did_key_cached().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw).hex()
        key_note = "did.json key == pinned board key" if raw_pub == BOARD_PUB_HEX else f"did.json key {raw_pub[:16]}.. differs from the pinned {BOARD_PUB_HEX[:16]}.."
    except Exception as e:
        key_note = f"key not read: {type(e).__name__}"
    gen = load_genesis(d)
    if gen:
        if gen["signature"]["state"] != "VERIFIES":
            errors.append(f"GENESIS_RECORD signature {gen['signature']['state']}: {gen['signature'].get('why')}")
        for pr in gen["problems"]:
            errors.append(f"GENESIS_RECORD {pr}")
    rep = {"schema": "csoai.measurement-index-chain-verification/0.1", "at": utcnow(), "dir": str(d),
           "verifier": VERIFIER_NAME, "key": key_note,
           "deep": bool(deep), "bitcoin_header_check": bool(bitcoin)}
    if not days:
        errors.append("NO_INDEX: no measurement-index-v0.2-<date>.json in the directory")
        rep.update(result="CHAIN_BROKEN", errors=errors, chain_length=0)
        return rep
    head = head or max(days)
    if head not in days:
        errors.append(f"HEAD_ABSENT: no index for {head}")
        rep.update(result="CHAIN_BROKEN", errors=errors, chain_length=0)
        return rep
    cur, genesis_reached, next_doc = head, None, None
    while cur is not None:
        if cur in visited:
            errors.append(f"{cur}: CYCLE"); break
        p = days[cur]
        raw = p.read_bytes(); h = sha(raw)
        try:
            doc = json.loads(raw)
        except Exception:
            errors.append(f"{cur}: UNREADABLE index"); break
        visited.add(cur)
        e = {"date": cur, "path": p.name, "sha256": h, "index_root": doc.get("index_root"), "schema": doc.get("schema"),
             "chain_seq": doc.get("chain_seq"), "n_capsules_total": doc.get("n_capsules_total"), "as_of": doc.get("as_of")}
        st, payload = sig_check(p)
        e["signature"] = st["state"] if st["state"] != "FAILS" else f"FAILS: {st['why']}"
        if st["state"] != "VERIFIES":
            errors.append(f"{cur}: SIGNATURE {st['state']} {st.get('why', '')}".rstrip())
        chained = doc.get("schema") == v.INDEX_SCHEMA
        if chained:
            if doc.get("date") != cur:
                errors.append(f"{cur}: DATE_MISMATCH the file for {cur} says date {doc.get('date')}")
            if payload is not None and st["state"] == "VERIFIES":
                want = {k: doc.get(k) for k in v.CHAIN_KEYS}
                want["supersedes_sha256"] = (doc.get("supersedes") or {}).get("sha256")
                if payload.get("chain") != want:
                    errors.append(f"{cur}: SIGNED_CHAIN_FIELDS differ from the index's chain fields")
        o = ots_detail(p, p.with_name(p.name + ".ots"), headers)
        e["ots"] = {k: o[k] for k in ("state", "attestations", "bitcoin_block_heights", "bitcoin") if k in o}
        if o["state"] == "DOES_NOT_BIND":
            errors.append(f"{cur}: OTS proof does not bind to these bytes")
        elif o["state"] == "NOT_STAMPED":
            warnings.append(f"{cur}: no OTS proof")
        for r in o.get("bitcoin", []):
            if r.get("header_check") == "DOES_NOT_MATCH_HEADER":
                errors.append(f"{cur}: OTS Bitcoin attestation at height {r['height']} does not match the block header")
        e["supersession"] = _supersession(d, cur, doc, h, errors)
        e["rekor"] = rekor_state(p, errors, cur)
        e["publication"] = publication_report(d, cur, doc, h, errors)
        fr = doc.get("freshness")
        if fr:
            e["freshness"] = {"not_updated": fr.get("not_updated", []),
                              "states": {k: x["state"] for k, x in fr.get("adapters", {}).items()}}
            bad = [k for k, x in fr.get("adapters", {}).items() if x["state"] == "FRESH" and x.get("last_good_date") != cur]
            if bad:
                errors.append(f"{cur}: FRESHNESS says FRESH for {bad} but their batch is not dated {cur}")
        else:
            e["freshness"] = "NOT_RECORDED (index before freshness)"
        if deep:
            try:
                e["deep"] = _deep(doc, cache)
            except (AssertionError, FileNotFoundError, KeyError) as x:
                e["deep"] = f"FAILS: {x}"
                errors.append(f"{cur}: DEEP {x}")
        walked.append(e)
        # ---- the link to the previous day
        if not chained or doc.get("prev_date") is None:
            if chained:
                ok = (str(doc.get("genesis") or "").startswith("GENESIS") and doc.get("chain_seq") == 0 and doc.get("gap_days") == 0
                      and doc.get("prev_index_sha256") is None and doc.get("prev_index_root") is None)
                if not ok:
                    errors.append(f"{cur}: prev = null without a genesis note (a chain cannot just stop)")
                if gen and gen["doc"].get("date") == cur and gen["doc"].get("index_sha256") != h:
                    errors.append(f"{cur}: the genesis record pins another version of this day")
                e["link"] = "GENESIS"
            else:
                if not gen:
                    errors.append(f"{cur}: PRE_CHAIN_INDEX ({doc.get('schema')}) and no genesis record pins it")
                    e["link"] = "UNANCHORED"
                elif gen["doc"].get("date") != cur or gen["doc"].get("index_sha256") != h:
                    errors.append(f"{cur}: PRE_CHAIN_INDEX is not the one the genesis record pins "
                                  f"({gen['doc'].get('date')} {str(gen['doc'].get('index_sha256'))[:16]})")
                    e["link"] = "UNANCHORED"
                else:
                    e["link"] = "GENESIS (pinned by the signed genesis record)"
            genesis_reached = cur
            break
        pd = doc["prev_date"]
        if not (isinstance(pd, str) and pd < cur):
            errors.append(f"{cur}: prev_date {pd!r} is not an earlier date"); e["link"] = "BROKEN"; break
        missing = _dates_between(pd, cur)
        if doc.get("gap_days") != len(missing) or doc.get("missing_dates") != missing:
            errors.append(f"{cur}: GAP_FIELDS gap_days={doc.get('gap_days')} but {len(missing)} calendar days lie between {pd} and {cur}")
        if missing:
            gaps.append({"dates": missing, "between": [pd, cur], "declared": True,
                         "why": "no index was written on these days; the next day's index says so (gap_days)"})
        skipped = [x for x in days if pd < x < cur]
        if skipped:
            errors.append(f"{cur}: FORK the link to {pd} skips the index(es) on disk for {skipped}")
        pp = days.get(pd)
        if pp is None:
            e["link"] = "DANGLING (the previous day's index is absent)"
            errors.append(f"{cur}: REMOVED_DAY the index for {pd} is named by this day's link but absent")
            gaps.append({"dates": [pd], "between": [pd, cur], "declared": False,
                         "why": "named by the next day's prev link (sha256 " + str(doc.get("prev_index_sha256"))[:16] + "..) but not on disk"})
            earlier = [x for x in days if x < pd]
            cur = earlier[-1] if earlier else None
            if cur:
                warnings.append(f"walk resumed at {cur}, below the removed day {pd}; the link across it cannot be checked")
            continue
        praw = pp.read_bytes(); pdoc = json.loads(praw)
        if sha(praw) != doc.get("prev_index_sha256"):
            sup_names = [q.name for q in d.glob(f"measurement-index-v0.2-{pd}.superseded-*.json")
                         if not q.name.endswith(".signed.json") and v.file_sha(q) == doc.get("prev_index_sha256")]
            if sup_names:
                errors.append(f"{cur}: PREV_LINK_TO_SUPERSEDED the link names {sup_names[0]}, not the final {pd} index "
                              "(the day was re-issued after this day chained to it)")
            else:
                errors.append(f"{cur}: PREV_SHA_MISMATCH the {pd} index on disk is not the one this day's link names")
            e["link"] = "BROKEN"
        elif pdoc.get("index_root") != doc.get("prev_index_root"):
            errors.append(f"{cur}: PREV_ROOT_MISMATCH"); e["link"] = "BROKEN"
        else:
            e["link"] = f"OK -> {pd}"
        if int(pdoc.get("chain_seq", 0)) + 1 != doc.get("chain_seq"):
            errors.append(f"{cur}: CHAIN_SEQ {doc.get('chain_seq')} does not follow {pd}'s {pdoc.get('chain_seq', 0)}")
        cur = pd
    orphans = [x for x in days if x not in visited and (genesis_reached is None or x > genesis_reached)]
    for x in orphans:
        errors.append(f"{x}: ORPHAN an index on disk that the chain from {head} does not reach")
    pre = [x for x in days if genesis_reached and x < genesis_reached]
    if genesis_reached is None:
        errors.append("GENESIS_NOT_REACHED")
    today = today or datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    open_gap = _dates_between(head, today)
    heads = []
    for hp in sorted(q for q in d.iterdir() if HEAD_RE.match(q.name)):
        hs, _ = sig_check(hp)
        hdoc = json.loads(hp.read_bytes())
        hrow = {"record_date": HEAD_RE.match(hp.name).group(1), "sha256": v.file_sha(hp), "signature": hs["state"],
                "head_date": hdoc.get("head_date"), "chain_length": hdoc.get("chain_length"),
                "ots": v.ots_state(hp, hp.with_name(hp.name + ".ots"))["state"], "rekor": rekor_state(hp, errors, hp.name)}
        if hs["state"] != "VERIFIES":
            errors.append(f"{hp.name}: SIGNATURE {hs['state']}")
        dp = days.get(hdoc.get("head_date"))
        if dp is not None and v.file_sha(dp) != hdoc.get("head_index_sha256"):
            sup = [q.name for q in d.glob(f"measurement-index-v0.2-{hdoc.get('head_date')}.superseded-*.json")
                   if not q.name.endswith(".signed.json") and v.file_sha(q) == hdoc.get("head_index_sha256")]
            if sup:
                warnings.append(f"{hp.name}: pins {sup[0]}, a version of {hdoc.get('head_date')} re-issued after the head was written")
            else:
                errors.append(f"{hp.name}: pins a head index that is on disk neither as the final nor as a replaced version")
        heads.append(hrow)
    rep.update({
        "result": "CHAIN_INTACT" if not errors else "CHAIN_BROKEN",
        "heads": heads,
        "publication_summary": {s: sum(1 for w in walked if str(w.get("publication", {}).get("state")) == s)
                                for s in sorted({str(w.get("publication", {}).get("state")) for w in walked})},
        "not_updated": [{"date": w["date"], "adapters": w["freshness"]["not_updated"]} for w in walked
                        if isinstance(w.get("freshness"), dict) and w["freshness"]["not_updated"]],
        "rekor_summary": {"days_included": sum(1 for w in walked if str(w.get("rekor", {}).get("state")).startswith("INCLUDED")),
                          "heads_included": sum(1 for x in heads if str(x["rekor"].get("state")).startswith("INCLUDED"))},
        "head": {"date": head, "sha256": walked[0]["sha256"], "index_root": walked[0]["index_root"], "chain_seq": walked[0].get("chain_seq")},
        "genesis": {"date": genesis_reached, "record": (gen or {}).get("path"), "record_sha256": (gen or {}).get("sha256"),
                    "index_sha256": (gen or {}).get("doc", {}).get("index_sha256")},
        "chain_length": len(walked),
        "gaps": gaps, "gap_days_declared": sum(len(g["dates"]) for g in gaps if g["declared"]),
        "gap_days_undeclared": sum(len(g["dates"]) for g in gaps if not g["declared"]),
        "open_days_since_head": open_gap,
        "ots_summary": {s: sum(1 for w in walked if w["ots"]["state"] == s) for s in sorted({w["ots"]["state"] for w in walked})},
        "pre_genesis_indexes": pre,
        "errors": errors, "warnings": warnings, "days": walked})
    return rep


# ----------------------------------------------------------------------------- records
def make_genesis(index_path, dirpath=None):
    ip = pathlib.Path(index_path)
    d = pathlib.Path(dirpath or ip.parent)
    out = d / GENESIS_NAME
    if out.exists():
        sys.exit(f"GENESIS_EXISTS {out} (a genesis record is written once)")
    raw = ip.read_bytes(); doc = json.loads(raw)
    m = v.INDEX_NAME_RE.match(ip.name)
    if not m:
        sys.exit(f"not a daily index name: {ip.name}")
    st, payload = sig_check(ip)
    if st["state"] != "VERIFIES":
        sys.exit(f"the genesis index's own signature {st}")
    earlier = [x for x in v.index_days(d) if x < m.group(1)]
    if earlier:
        sys.exit(f"indexes before {m.group(1)} exist ({earlier[:3]}): genesis must be the first day")
    g = {"schema": v.CHAIN_GENESIS_SCHEMA, "as_of": utcnow(),
         "what_this_is": "The genesis of the daily measurement-index chain: it pins the first day's index (its bytes are unchanged) "
                         "and states that it has no predecessor.",
         "what_this_is_not": "Not a grade, ranking, admission or approval of anything.",
         "date": m.group(1), "chain_seq": 0, "prev_date": None, "prev_index_sha256": None, "prev_index_root": None, "gap_days": 0,
         "genesis": GENESIS_NOTE,
         "index_path": ip.name, "index_sha256": sha(raw), "index_root": doc["index_root"], "index_schema": doc["schema"],
         "index_signed_payload_sha256": st["payload_sha256"], "index_signed_at": st.get("signed_at"),
         "chain_rule": v.CHAIN_RULE,
         "signed_fields": ["date", "chain_seq", "prev_date", "prev_index_sha256", "prev_index_root", "gap_days", "index_sha256", "index_root"]}
    _publication_field(g)
    out.write_bytes(json.dumps(g, indent=1, ensure_ascii=False).encode() + b"\n")
    return out


def _publication_field(doc):
    """publication {state: PUBLIC} once the owner's approval is recorded (from 27 Sep 2026); before it, private_until."""
    pub = v.publication_state()
    if pub:
        doc["publication"] = pub
    else:
        doc["private_until"] = "owner approves publication"
    return doc


def make_head(dirpath, record_date, rep):
    d = pathlib.Path(dirpath)
    out = d / f"measurement-index-chain-head-{record_date}.json"
    if out.exists():
        sys.exit(f"HEAD_EXISTS {out} (a signed head is never overwritten)")
    heads = sorted((HEAD_RE.match(p.name).group(1), p) for p in d.iterdir() if HEAD_RE.match(p.name) and HEAD_RE.match(p.name).group(1) < record_date)
    prev = heads[-1] if heads else None
    hd = rep["head"]
    st, _ = sig_check(d / f"measurement-index-v0.2-{hd['date']}.json")
    y, w, _ = datetime.date.fromisoformat(record_date).isocalendar()
    doc = {"schema": v.CHAIN_HEAD_SCHEMA, "as_of": utcnow(),
           "what_this_is": "The weekly head of the daily measurement-index chain: the newest day's index (sha256 + index_root) and the "
                           "number of days on the chain back to genesis, after the whole chain verified.",
           "what_this_is_not": "Not a grade, ranking, admission or approval of anything. It anchors WHEN these bytes existed, not what they measure.",
           "record_date": record_date, "iso_week": f"{y}-W{w:02d}",
           "head_date": hd["date"], "head_index_sha256": hd["sha256"], "head_index_root": hd["index_root"],
           "head_chain_seq": hd.get("chain_seq") or 0, "head_index_signed_payload_sha256": st.get("payload_sha256"),
           "chain_length": rep["chain_length"],
           "genesis_date": rep["genesis"]["date"], "genesis_index_sha256": rep["days"][-1]["sha256"],
           "genesis_record_sha256": rep["genesis"]["record_sha256"],
           "declared_gap_days_total": rep["gap_days_declared"], "gap_dates": sorted(x for g in rep["gaps"] for x in g["dates"]),
           "ots_summary": rep["ots_summary"],
           "bitcoin_attested_days": [{"date": x["date"], "heights": x["ots"].get("bitcoin_block_heights")} for x in rep["days"]
                                     if x["ots"].get("bitcoin_block_heights")],
           "prev_head_date": prev[0] if prev else None, "prev_head_sha256": v.file_sha(prev[1]) if prev else None,
           "verification": {"result": rep["result"], "at": rep["at"], "deep": rep["deep"], "verifier": rep["verifier"],
                            "errors": len(rep["errors"])},
           "signed_fields": ["record_date", "head_date", "head_index_sha256", "head_index_root", "head_chain_seq", "chain_length",
                             "genesis_date", "genesis_index_sha256", "declared_gap_days_total", "prev_head_sha256"]}
    _publication_field(doc)
    out.write_bytes(json.dumps(doc, indent=1, ensure_ascii=False).encode() + b"\n")
    return out


def verify_chain_doc(p):
    p = pathlib.Path(p)
    raw = p.read_bytes(); doc = json.loads(raw)
    st, payload = sig_check(p)
    res = {"file": str(p), "schema": doc.get("schema"), "sha256": sha(raw), "signature": st["state"]}
    assert st["state"] == "VERIFIES", f"signature {st}"
    assert payload.get("chain") == {k: doc.get(k) for k in doc["signed_fields"]}, "signed chain fields differ from the record"
    if doc["schema"] == v.CHAIN_HEAD_SCHEMA:
        ip = p.parent / f"measurement-index-v0.2-{doc['head_date']}.json"
        if ip.exists():
            assert v.file_sha(ip) == doc["head_index_sha256"], "the head index on disk is not the one this head pins"
            res["head_index"] = "pinned bytes on disk"
    res["ots"] = v.ots_state(p, p.with_name(p.name + ".ots"))["state"]
    return res


def verify_chain_doc_cli(a):
    print(json.dumps(verify_chain_doc(a.file)))


# ----------------------------------------------------------------------------- prepared anchors (never submitted)
def _load_signed(record_path):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.hazmat.primitives import serialization
    rp = pathlib.Path(record_path)
    raw = rp.read_bytes(); rec = json.loads(raw)
    sp = rp.with_name(rp.stem + ".signed.json")
    s = json.loads(sp.read_text())
    payload, sig = s["payload"], s["signature"]
    pre = canon(payload)
    checks = {"payload_sha256_matches": sha(pre) == sig["payload_sha256"],
              "payload_pins_head_record_bytes": payload["artifact"]["sha256"] == sha(raw),
              "payload_chain_fields_match_record": payload.get("chain") == {k: rec.get(k) for k in rec["signed_fields"]},
              "signer_is_board_key": sig.get("did") == BOARD_DID}
    pk = Ed25519PublicKey.from_public_bytes(bytes.fromhex(PUB_HEX_FOR_ANCHORS[0]))
    try:
        pk.verify(bytes.fromhex(sig["sig_ed25519"]), pre); checks["ed25519_verifies_under_pinned_board_key"] = True
    except Exception:
        checks["ed25519_verifies_under_pinned_board_key"] = False
    for name, alt in (("trailing byte", pre + b" "), ("head index root altered", pre.replace(rec["head_index_root"].encode(), b"0" * 64)),
                      ("chain length altered", pre.replace(b'"chain_length":%d' % rec["chain_length"], b'"chain_length":%d' % (rec["chain_length"] + 1)))):
        if alt == pre:
            checks[f"control_{name}"] = "NOT_APPLIED (CONTROL FAILED)"
            continue
        try:
            pk.verify(bytes.fromhex(sig["sig_ed25519"]), alt); checks[f"control_{name}"] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            checks[f"control_{name}"] = "rejected (control holds)"
    pem = pk.public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
    if not all(x is True for k, x in checks.items() if not k.startswith("control_")) or any("FAILED" in str(x) for x in checks.values()):
        sys.exit(f"REFUSED: local checks failed {checks}")
    return rp, raw, rec, sp, s, pre, pem, checks


PUB_HEX_FOR_ANCHORS = [BOARD_PUB_HEX]  # tests point this at their own key


def prepare_rekor(record_path, out):
    rp, raw, rec, sp, s, pre, pem, checks = _load_signed(record_path)
    body = {"apiVersion": "0.0.1", "kind": "rekord", "spec": {
        "data": {"content": base64.b64encode(pre).decode()},
        "signature": {"format": "x509", "content": base64.b64encode(bytes.fromhex(s["signature"]["sig_ed25519"])).decode(),
                      "publicKey": {"content": base64.b64encode(pem).decode()}}}}
    out = pathlib.Path(out)
    entry_out = str(out).replace(".rekor-submission.PREPARED.json", ".rekor-entry.json")
    doc = {
        "schema": "csoai.rekor-submission-prepared/0.1",
        "status": "PREPARED_NOT_SUBMITTED",
        "prepared_at": utcnow(),
        "prepared_by": "venturi_capsule.py chain-head (chain.prepare_rekor; no key, no network, no submission)",
        "why_not_submitted": "A Rekor entry is a new public transparency-log entry; creating one is reserved for the owner.",
        "subject": {"chain_head": str(rp), "chain_head_sha256": sha(raw), "chain_head_schema": rec["schema"],
                    "head_date": rec["head_date"], "head_index_sha256": rec["head_index_sha256"], "head_index_root": rec["head_index_root"],
                    "chain_length": rec["chain_length"], "genesis_date": rec["genesis_date"], "signed_sidecar": str(sp),
                    "signed_at": s["signature"].get("signed_at")},
        "method": "rekord (x509 PEM) over the exact Ed25519 preimage the board signed, the same method as "
                  "measurement-index-v0.2-2026-09-26.rekor-submission.PREPARED.json (scripts/measurement_anchor_prepare.py) and "
                  "scripts/witness_public_root.py rekor_upload(); hashedrekord is not used because it does not accept a pure-Ed25519 "
                  "signature over the message",
        "preimage": {"what": "canonical JSON of the signed payload (sort_keys, separators , :, UTF-8)", "sha256": sha(pre), "bytes": len(pre),
                     "pins": {"chain_head_sha256": s["payload"]["artifact"]["sha256"], **s["payload"]["chain"]}},
        "public_key": {"did": BOARD_DID, "raw_hex": PUB_HEX_FOR_ANCHORS[0], "pem_sha256": sha(pem)},
        "local_checks": checks,
        "what_rekor_would_record": "the sha256 of the preimage, the signature and the public key, with an inclusion proof and integrated time. "
                                   "Rekor does not retain the preimage content for rekord entries; the chain stays private until published.",
        "body": body,
        "owner_command": (f"python3 -c \"import json,sys;json.dump(json.load(open(sys.argv[1]))['body'],sys.stdout)\" {out} | "
                          f"curl -sS -X POST {REKOR}/api/v1/log/entries -H 'Content-Type: application/json' -H 'Accept: application/json' "
                          f"--data-binary @- | tee {entry_out}"),
        "after_submission_verify": [
            "a 201 returns {<uuid>: entry}; a 409 means the same entry already exists (Location names it); both mean WITNESSED",
            f"curl -sS {REKOR}/api/v1/log/entries/<uuid> and check: body.spec.data.hash.value == {sha(pre)}",
            "and the entry's verification.inclusionProof / signedEntryTimestamp verify with rekor-cli verify --uuid <uuid>",
        ],
        "limits": "Rekor proves these bytes and this signature existed no later than the integrated time. It says nothing about what the "
                  "capsules measured, and it is not a certification.",
    }
    out.write_text(json.dumps(doc, indent=1) + "\n")
    return out


def prepare_xrpl(record_path, out, fee_drops=12):
    rp, raw, rec, sp, s, pre, pem, checks = _load_signed(record_path)
    hx = lambda t: t.encode().hex().upper()
    memos = [("csoai/measurement-index-chain-head-sha256", sha(raw)),
             ("csoai/measurement-capsule-index-sha256", rec["head_index_sha256"]),
             ("csoai/measurement-capsule-index-root", rec["head_index_root"])]
    tx = {"TransactionType": "AccountSet", "Account": "OWNER_ACCOUNT", "Fee": str(fee_drops),
          "Memos": [{"Memo": {"MemoType": hx(t), "MemoFormat": hx("application/octet-stream"), "MemoData": x.upper()}} for t, x in memos]}
    out = pathlib.Path(out)
    doc = {"_draft": {
        "schema": "csoai.xrpl-memo-anchor-draft/0.2",
        "status": "UNSIGNED_DRAFT_NOT_BROADCAST",
        "prepared_at": utcnow(),
        "prepared_by": "venturi_capsule.py chain-head (chain.prepare_xrpl; no key, no signing, no submission)",
        "spec_followed": "scripts/anchors/xrpl_memo_anchor.py (AccountSet + hex Memo fields, MemoData = 32-byte sha256 uppercase hex), "
                         "as in measurement-index-v0.2-2026-09-26.xrpl-memo.unsigned.json",
        "owner_action": "Replace OWNER_ACCOUNT with the owner's r-address; let the owner's own client autofill Sequence and "
                        "LastLedgerSequence; review; sign; submit. Nothing is on-ledger until then.",
        "fee": {"drops": fee_drops, "xrp": fee_drops / 1_000_000, "note": "reference base fee is 10 drops; 12 leaves headroom for load"},
        "subject": {"chain_head": str(rp), "chain_head_schema": rec["schema"], "chain_head_sha256": sha(raw),
                    "chain_head_signed_payload_sha256": s["signature"]["payload_sha256"], "head_date": rec["head_date"],
                    "head_index_sha256": rec["head_index_sha256"], "head_index_root": rec["head_index_root"],
                    "chain_length": rec["chain_length"], "genesis_date": rec["genesis_date"]},
        "memo_fields": [{"MemoType": t, "MemoFormat": "application/octet-stream", "MemoData": x} for t, x in memos],
        "local_checks": checks,
        "memo_semantics": "An XRPL memo proves only that these 32-byte digests were included in a validated ledger no later than that "
                          "ledger's close time. The chain-head record they pin names the head index and the chain length; the memo says "
                          "nothing about what the capsules measured.",
        "verification_recipe": [
            "1. Recompute: sha256sum <chain-head.json> == memo csoai/measurement-index-chain-head-sha256; sha256sum <head index.json> == "
            "memo csoai/measurement-capsule-index-sha256; `venturi_capsule.py verify-chain --dir <dir>` walks the chain to genesis and "
            "reports the same head index_root (== memo csoai/measurement-capsule-index-root) and chain_length.",
            "2. Fetch the transaction from two independent servers and require agreement: "
            "curl -s -X POST https://xrplcluster.com/ -d '{\"method\":\"tx\",\"params\":[{\"transaction\":\"<TX_HASH>\"}]}' and the same against https://s1.ripple.com:51234/.",
            "3. Require validated == true and meta.TransactionResult == tesSUCCESS; Account == the owner's published r-address.",
            "4. Hex-decode each Memo.MemoType; MemoData (uppercase hex) must equal the recomputed digests from step 1.",
            "5. The ledger close_time bounds WHEN; the board signature in the .signed.json sidecar bounds WHO. Neither is a grade.",
        ]}, "tx_json": tx}
    out.write_text(json.dumps(doc, indent=1) + "\n")
    return out


# ----------------------------------------------------------------------------- CLI
def _sign_and_stamp(path, token, no_sign):
    if no_sign:
        return "not signed (--no-sign)"
    ns = argparse.Namespace(file=str(path), out=None, token=token, artifact_path=None)
    v.sign(ns); v.ots(ns)
    return "signed + OTS"


def cli_verify_chain(a):
    rep = verify_chain(a.dir, head=a.head, deep=a.deep, bitcoin=a.bitcoin, today=a.today)
    if a.json_out:
        pathlib.Path(a.json_out).write_text(json.dumps(rep, indent=1) + "\n")
    if a.summary:
        print(json.dumps({k: rep.get(k) for k in ("result", "head", "genesis", "chain_length", "gap_days_declared", "gap_days_undeclared",
                                                   "open_days_since_head", "ots_summary", "rekor_summary", "not_updated", "errors", "warnings")}))
    else:
        print(json.dumps(rep, indent=1))
    sys.exit(0 if rep["result"] == "CHAIN_INTACT" else 1)


def cli_genesis(a):
    out = make_genesis(a.file, a.dir)
    state = _sign_and_stamp(out, a.token, a.no_sign)
    print(json.dumps({"genesis": str(out), "sha256": v.file_sha(out), "state": state}))


def cli_head(a):
    rep = verify_chain(a.dir, deep=a.deep)
    if rep["result"] != "CHAIN_INTACT":
        print(json.dumps({"refused": "the chain does not verify; no head is signed over a broken chain", "errors": rep["errors"][:20]}))
        sys.exit(1)
    out = make_head(a.dir, a.date, rep)
    state = _sign_and_stamp(out, a.token, a.no_sign)
    res = {"head_record": str(out), "sha256": v.file_sha(out), "head_date": rep["head"]["date"], "head_index_root": rep["head"]["index_root"],
           "chain_length": rep["chain_length"], "state": state}
    if not a.no_sign:
        base = str(out)[:-5]
        res["rekor"] = str(prepare_rekor(out, base + ".rekor-submission.PREPARED.json"))
        res["xrpl"] = str(prepare_xrpl(out, base + ".xrpl-memo.unsigned.json"))
    print(json.dumps(res))


def add_cli(sp):
    add_rekor_cli(sp)
    add_publication_cli(sp)
    add_publication_erratum_cli(sp)
    add_anchors_cli(sp)
    q = sp.add_parser("verify-chain", help="walk every daily index back to genesis")
    q.add_argument("--dir", default="/evac-bulk"); q.add_argument("--head", default=None)
    q.add_argument("--deep", action="store_true", help="also recompute every capsule id and Merkle root (needs the batch dirs)")
    q.add_argument("--bitcoin", action="store_true", help="check each OTS Bitcoin attestation against the block header (public Esplora)")
    q.add_argument("--today", default=None); q.add_argument("--summary", action="store_true"); q.add_argument("--json-out", default=None)
    q = sp.add_parser("chain-genesis", help="the signed genesis record for a pre-chain index")
    q.add_argument("--file", required=True); q.add_argument("--dir", default=None)
    q.add_argument("--token", default="~/.secrets/board-sign-pod-token"); q.add_argument("--no-sign", action="store_true")
    q = sp.add_parser("chain-head", help="the weekly signed chain-head record + prepared (unsubmitted) Rekor and XRPL anchors")
    q.add_argument("--date", required=True); q.add_argument("--dir", default="/evac-bulk"); q.add_argument("--deep", action="store_true")
    q.add_argument("--token", default="~/.secrets/board-sign-pod-token"); q.add_argument("--no-sign", action="store_true")


    q = sp.add_parser("publish-hf", help="publish DATE's chain files to the public evidence-index dataset (owner-gated)")
    q.add_argument("--date", required=True); q.add_argument("--dir", default="/evac-bulk"); q.add_argument("--repo", default=HF_REPO)
    q.add_argument("--token-file", default="~/.secrets/hf_token"); q.add_argument("--approval-file", default=APPROVAL_FILE)
    q.add_argument("--dry-run", action="store_true")


CLI = {"verify-chain": cli_verify_chain, "chain-genesis": cli_genesis, "chain-head": cli_head}


# ----------------------------------------------------------------------------- public copy (owner-gated)
def git_blob_sha1(b):
    return hashlib.sha1(b"blob %d\0" % len(b) + b).hexdigest()


def publish_set(dirpath, date, strict=True):
    """(repo path, local path) for everything DATE contributes to the public chain: the final index and its sidecars,
    the day's re-issue history (every replaced version stays verifiable), the genesis record on the genesis day and
    DATE's chain head. Prepared anchors (Rekor body, XRPL draft) and the NOTE are not published."""
    d = pathlib.Path(dirpath)
    base = f"measurement-index-v0.2-{date}"
    want = [d / f"{base}.json", d / f"{base}.signed.json", d / f"{base}.json.ots"]
    jl = d / f"{base}.supersession.jsonl"
    if jl.exists():
        want.append(jl)
        for x in sorted(d.glob(f"{base}.superseded-*")):
            if x.name.endswith((".json", ".json.ots")) and not x.name.endswith(".NOTE.txt"):
                want.append(x)
    gen = load_genesis(d)
    if gen and gen["doc"].get("date") == date:
        want += [d / GENESIS_NAME, d / GENESIS_NAME.replace(".json", ".signed.json"), d / (GENESIS_NAME + ".ots")]
    h = d / f"measurement-index-chain-head-{date}.json"
    if h.exists():
        want += [h, h.with_name(h.stem + ".signed.json"), h.with_name(h.name + ".ots")]
    for pr in (d / f"{base}.publication.json", d / f"{base}.publication-erratum.json"):
        if pr.exists():
            want += [pr, pr.with_name(pr.stem + ".signed.json"), pr.with_name(pr.name + ".ots")]
    for stem in (base, h.stem, base + ".publication"):  # Rekor entries (when anchored): the log's entry + our receipt
        for suf in (".rekor-entry.json", ".rekor-receipt.json"):
            if (d / (stem + suf)).exists():
                want.append(d / (stem + suf))
    missing = [str(p) for p in want if not p.exists()]
    if not strict:
        want = [p for p in want if p.exists()]
    elif missing:
        sys.exit(f"PUBLISH_REFUSED missing local files: {missing}")
    return [(f"{HF_PREFIX}/{date}/{p.name}", p) for p in want]


PUBLIC_README = """# Measurement-index chain

The files in this folder are CSOAI's daily measurement indexes, one folder per day. Each index binds together every signed
measurement-capsule batch that was current that day. Since 26 September 2026 each index also commits to the one before it,
so the folders form a hash chain.

- **No rewriting.** Changing any byte of a past day breaks that day's board signature. It also breaks the next day's link,
  which names the old bytes by SHA-256.
- **No back-filling.** A day can only link to the newest index that already existed. Once a later day has linked past a
  date, no index is written for that date.
- **No quiet gaps.** If a day has no index, the next index says so in `gap_days` and `missing_dates`. If an index is
  deleted afterwards, the next day's link points at a file that no longer exists, and the verifier reports an undeclared gap.

This is a measurement record. It is not a grade, a certification or an approval of anything. The capsule batches that the
indexes name are not in this dataset; their Merkle roots and record hashes are.

## Files per day (`measurement-index/<date>/`)

| file | what |
|---|---|
| `measurement-index-v0.2-<date>.json` | the day's index. Schema `csoai.measurement-capsule-index/0.3` from 27 Sep 2026 on (chain fields `date`, `chain_seq`, `prev_date`, `prev_index_sha256`, `prev_index_root`, `gap_days`, `missing_dates`, `supersedes`); the 26 Sep genesis index is schema 0.2 |
| `….signed.json` | Ed25519 signature over a payload that pins the index's SHA-256 (and, for 0.3, repeats the chain fields), `did:web:csoai.org#board-attestation-1` |
| `….json.ots` | OpenTimestamps proof over SHA-256 of the index, upgraded to a Bitcoin attestation once one exists |
| `….supersession.jsonl`, `….superseded-<ts>.*` | the day's re-issues. When a day's index was replaced the same day, every replaced version is kept with its signature, and the final version names the one it replaced |
| `measurement-index-chain-genesis.json` (26 Sep only) | the signed genesis record. It pins the 26 Sep index (its bytes were never changed) and states `prev = null` |
| `measurement-index-chain-head-<date>.json` (Sundays) | the weekly chain head: head index SHA-256 and root, chain length, gaps and the previous head. Signed and OTS-stamped |
| `….rekor-entry.json`, `….rekor-receipt.json` | the Rekor entry (https://rekor.sigstore.dev) that records the signed payload of the index or head, and our check of it: body hash = the payload's SHA-256, the signature, and the inclusion proof to the log's checkpoint |
| `….publication.json`, `….publication-erratum.json` (26 Sep) | signed records that the owner approved publication on 26 Sep 2026. The 26 Sep files were written with `private_until = "owner approves publication"` before that approval. Their signed bytes are unchanged, and these records supersede that one field. From 27 Sep 2026 on, indexes, batch records and chain heads carry `publication: {state: PUBLIC}` instead |

## Verify: index, then prev, then genesis

Put every day's files into one folder:

```bash
huggingface-cli download csoai/evidence-index --repo-type dataset --include "measurement-index/*" --local-dir ei
mkdir chain && cp ei/measurement-index/*/* chain/
```

Then walk from the newest day back to 26 Sep 2026:

1. **Signature.** In `<index>.signed.json`, `payload.artifact.sha256` must equal SHA-256 of `<index>.json`. The SHA-256
   of the canonical payload (sorted keys, separators `,` and `:`, UTF-8) must equal `signature.payload_sha256`. And
   `sig_ed25519` must verify over those bytes under the `#board-attestation-1` key published at
   https://csoai.org/.well-known/did.json (raw Ed25519 key `9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170`).
2. **Prev.** SHA-256 of `measurement-index-v0.2-<prev_date>.json` must equal `prev_index_sha256`, its `index_root` must
   equal `prev_index_root`, and `chain_seq` must go up by one per link.
3. **Gaps.** `gap_days` must equal the number of calendar days strictly between `prev_date` and `date`, with those dates
   in `missing_dates`, and no index may exist for any of them.
4. **Re-issues.** If `supersedes` is set, the replaced version must be in the folder with the SHA-256 it names.
5. **Timestamp.** Each `.json.ots` must commit to its file's SHA-256: run `ots verify <file>.ots`. A Bitcoin attestation
   binds to a block, and its commitment, byte-reversed, must equal that block's `merkle_root`.
6. **Genesis.** The walk ends at the 26 Sep index. The signed genesis record must pin its SHA-256 with `prev = null`.

Every daily index in the folder must be on the walk. An index the walk never reaches is a fork.

Each final daily index and each weekly head is also recorded in Rekor, the Sigstore transparency log. The 26 Sep 2026
index is Rekor log index 2968539665 and the 26 Sep chain head is log index 2968539944
(https://search.sigstore.dev/?logIndex=2968539665, https://search.sigstore.dev/?logIndex=2968539944); each entry's
body hash equals the SHA-256 of the signed payload in the matching `.signed.json`. The 26 Sep index's OpenTimestamps
proof carries a Bitcoin attestation at block 968674. XRP Ledger memos are prepared but have not been submitted. These
anchors show when the bytes existed. The signature shows who signed them. Neither says what the capsules measured.

Limit: someone holding the board key could re-sign every day from some point to the head. That rewrite becomes detectable
once any later-dated anchor exists (a Bitcoin-attested OTS proof, a weekly head, a Rekor or XRPL entry). So check the
anchors, not just the signatures.
"""

README_POINTER = ("<!-- measurement-index-chain:begin -->\n## Measurement-index chain\n\n"
                  "`measurement-index/<date>/` holds CSOAI's daily measurement index as a hash chain: every day's index commits to "
                  "the previous day's (SHA-256 and root) and declares any missed day. Each index is signed "
                  "(`did:web:csoai.org#board-attestation-1`) and OpenTimestamps-stamped, and the chain starts at a signed genesis "
                  "record (26 Sep 2026). How to verify it: [measurement-index/README.md](measurement-index/README.md).\n"
                  "<!-- measurement-index-chain:end -->\n")


def publish_hf(dirpath, date, repo=HF_REPO, token_file="~/.secrets/hf_token", approval_file=APPROVAL_FILE, dry_run=False, api=None):
    """Owner-gated, create-only publication of DATE's chain files. Returns a result dict; never prints the token."""
    rep = verify_chain(dirpath, head=None)
    if rep["result"] != "CHAIN_INTACT":
        return {"state": "REFUSED", "why": "the chain does not verify", "errors": rep["errors"][:10]}
    files = publish_set(dirpath, date)
    for rp, lp in files:
        txt = lp.read_bytes().decode("utf-8", "replace")
        if any(b.search(txt) for b in BANNED_PUBLIC):
            return {"state": "REFUSED", "why": f"{lp.name} carries an internal name; not published", "file": str(lp)}
    approved = pathlib.Path(os.path.expanduser(approval_file)).is_file()
    if api is None:
        from huggingface_hub import HfApi
        tok = None
        if approved and not dry_run:  # HF_TOKEN in the environment (a GitHub Actions secret) wins over the token file
            tok = os.environ.get("HF_TOKEN", "").strip() or pathlib.Path(os.path.expanduser(token_file)).read_text().strip()
        api = HfApi(token=tok)
    paths = [rp for rp, _ in files] + [f"{HF_PREFIX}/README.md", "README.md"]
    remote = {x.path: x for x in api.get_paths_info(repo, paths, repo_type="dataset")}
    ops, skipped, refused = [], [], []
    for rp, lp in files:
        b = lp.read_bytes()
        r = remote.get(rp)
        if r is None:
            ops.append((rp, lp))
        else:
            same = (r.lfs.sha256 == sha(b)) if getattr(r, "lfs", None) else (r.blob_id == git_blob_sha1(b))
            (skipped if same else refused).append(rp)
    if refused:
        return {"state": "REFUSED", "why": "these paths already exist with other bytes; published files are never overwritten",
                "paths": refused}
    readme_ops = []
    rr = remote.get(f"{HF_PREFIX}/README.md")
    if rr is None:
        readme_ops.append(("add", f"{HF_PREFIX}/README.md", PUBLIC_README.encode()))
    elif rr.blob_id != git_blob_sha1(PUBLIC_README.encode()):  # documentation only: kept in step with this file
        readme_ops.append(("update", f"{HF_PREFIX}/README.md", PUBLIC_README.encode()))
    top = None
    if "README.md" in remote:
        from huggingface_hub import hf_hub_download
        top = pathlib.Path(hf_hub_download(repo, "README.md", repo_type="dataset", token=api.token)).read_text()
        if "<!-- measurement-index-chain:begin -->" not in top:
            new = top.rstrip("\n") + "\n\n" + README_POINTER
            readme_ops.append(("update", "README.md", new.encode()))
    res = {"repo": repo, "date": date, "approved": approved, "to_add": [rp for rp, _ in ops], "identical_skipped": skipped,
           "readme": [f"{k} {p}" for k, p, _ in readme_ops], "head": rep["head"], "chain_length": rep["chain_length"]}
    if not approved:
        return dict(res, state="GATED", why=("no owner approval: every index says private_until = 'owner approves publication'. "
                                             f"The owner enables publication by creating {approval_file}; nothing was uploaded."))
    if dry_run:
        return dict(res, state="DRY_RUN")
    if not ops and not readme_ops:
        return dict(res, state="ALREADY_PUBLISHED")
    from huggingface_hub import CommitOperationAdd
    co = [CommitOperationAdd(path_in_repo=rp, path_or_fileobj=str(lp)) for rp, lp in ops]
    co += [CommitOperationAdd(path_in_repo=p, path_or_fileobj=b) for _, p, b in readme_ops]
    info = api.create_commit(repo, co, repo_type="dataset",
                             commit_message=f"measurement-index {date}: chained daily index (signed, OTS){' + chain head' if any('chain-head' in rp for rp, _ in ops) else ''}",
                             commit_description="New dated files only; no existing file changed except the README pointer. "
                                                "Verify: measurement-index/README.md.",
                             parent_commit=api.dataset_info(repo).sha)
    return dict(res, state="PUBLISHED", commit=getattr(info, "oid", None), commit_url=getattr(info, "commit_url", None))


def cli_publish(a):
    os.environ.setdefault("HF_HOME", "/evac-bulk/.capsule-daily/hf-home")  # the root disk is nearly full
    r = publish_hf(a.dir, a.date, a.repo, a.token_file, a.approval_file, a.dry_run)
    print(json.dumps(r))
    sys.exit(0 if r["state"] in ("PUBLISHED", "ALREADY_PUBLISHED", "GATED", "DRY_RUN") else 1)


CLI["publish-hf"] = cli_publish



# ----------------------------------------------------------------------------- Rekor (submission owner-gated)
def _H(b):
    return hashlib.sha256(b).digest()


def verify_inclusion(leaf_hash, index, size, proof, root):
    """RFC 9162 section 2.1.3.2: the audit path from a leaf to the tree root."""
    if index >= size:
        return False
    fn, sn, r = index, size - 1, leaf_hash
    for p in proof:
        if sn == 0:
            return False
        if fn & 1 or fn == sn:
            r = _H(b"\x01" + p + r)
            if not fn & 1:
                while not (fn & 1) and fn != 0:
                    fn >>= 1; sn >>= 1
        else:
            r = _H(b"\x01" + r + p)
        fn >>= 1; sn >>= 1
    return sn == 0 and r == root


def check_rekor_entry(entry_doc, preimage_sha, sig_hex=None):
    """A saved Rekor entry ({uuid: entry}) against our preimage: kind rekord, spec.data.hash == sha256(preimage), the same
    signature, and the inclusion proof recomputes to its checkpoint root. (The checkpoint's own signature by the Rekor
    log key is not checked here; the log serves it at /api/v1/log/publicKey.) Returns (ok, detail dict)."""
    uuid, e = next(iter(entry_doc.items()))
    body_raw = base64.b64decode(e["body"]); body = json.loads(body_raw)
    ip = (e.get("verification") or {}).get("inclusionProof") or {}
    det = {"uuid": uuid, "logIndex": e.get("logIndex"), "integratedTime": e.get("integratedTime"), "logID": e.get("logID"),
           "kind": body.get("kind"), "body_hash": ((body.get("spec") or {}).get("data") or {}).get("hash", {}).get("value")}
    problems = []
    if body.get("kind") != "rekord":
        problems.append("not a rekord entry")
    if det["body_hash"] != preimage_sha:
        problems.append("the logged hash is not our preimage's sha256")
    if sig_hex and base64.b64decode(body.get("spec", {}).get("signature", {}).get("content", "")).hex() != sig_hex:
        problems.append("the logged signature is not the board signature")
    if not ip:
        problems.append("no inclusion proof")
    else:
        ok = verify_inclusion(_H(b"\x00" + body_raw), int(ip["logIndex"]), int(ip["treeSize"]),
                              [bytes.fromhex(x) for x in ip["hashes"]], bytes.fromhex(ip["rootHash"]))
        det.update(inclusion_proof="VERIFIES" if ok else "FAILS", tree_size=ip["treeSize"], root_hash=ip["rootHash"])
        if not ok:
            problems.append("the inclusion proof does not recompute to its root")
    det["problems"] = problems
    return not problems, det


def _stem(p):
    p = pathlib.Path(p)
    return p.with_name(p.name[:-5])  # strip .json


def rekor_state(target, errors, label):
    """verify-chain's per-artifact Rekor report: NOT_ANCHORED (no entry saved), INCLUDED, or an error."""
    target = pathlib.Path(target)
    ep = pathlib.Path(str(_stem(target)) + ".rekor-entry.json")
    if not ep.exists():
        return {"state": "NOT_ANCHORED"}
    sp = target.with_name(target.stem + ".signed.json")
    try:
        s = json.loads(sp.read_text())
        ok, det = check_rekor_entry(json.loads(ep.read_text()), sha(canon(s["payload"])), s["signature"]["sig_ed25519"])
    except Exception as x:
        errors.append(f"{label}: REKOR entry unreadable ({type(x).__name__})")
        return {"state": "ERROR"}
    if not ok:
        errors.append(f"{label}: REKOR {'; '.join(det['problems'])}")
        return {"state": "MISMATCH", **{k: det.get(k) for k in ("logIndex", "uuid")}}
    return {"state": "INCLUDED (inclusion proof verifies)", "logIndex": det["logIndex"], "uuid": det["uuid"],
            "integratedTime": det["integratedTime"]}


def prepare_rekor_any(target, out):
    """The rekord body for any board-signed artifact (daily index or head): the exact preimage the board signed."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.hazmat.primitives import serialization
    target = pathlib.Path(target)
    st, payload = sig_check(target)
    if st["state"] != "VERIFIES":
        sys.exit(f"REFUSED: {target.name} signature {st}")
    s = json.loads(target.with_name(target.stem + ".signed.json").read_text())
    pre = canon(s["payload"])
    pk = Ed25519PublicKey.from_public_bytes(bytes.fromhex(PUB_HEX_FOR_ANCHORS[0]))
    pk.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), pre)
    pem = pk.public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
    body = {"apiVersion": "0.0.1", "kind": "rekord", "spec": {
        "data": {"content": base64.b64encode(pre).decode()},
        "signature": {"format": "x509", "content": base64.b64encode(bytes.fromhex(s["signature"]["sig_ed25519"])).decode(),
                      "publicKey": {"content": base64.b64encode(pem).decode()}}}}
    doc = {"schema": "csoai.rekor-submission-prepared/0.1", "status": "PREPARED", "prepared_at": utcnow(),
           "prepared_by": "chain.prepare_rekor_any", "subject": {"file": target.name, "sha256": v.file_sha(target),
                                                                  "signed_at": s["signature"].get("signed_at")},
           "method": "rekord (x509 PEM) over the exact Ed25519 preimage the board signed",
           "preimage": {"sha256": sha(pre), "bytes": len(pre)}, "public_key": {"did": BOARD_DID, "raw_hex": PUB_HEX_FOR_ANCHORS[0]},
           "body": body}
    pathlib.Path(out).write_text(json.dumps(doc, indent=1) + "\n")
    return pathlib.Path(out)


def _http(method, url, body=None, timeout=40):
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), method=method,
                                 headers={"Content-Type": "application/json", "Accept": "application/json", **v.UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers), json.loads(r.read() or b"null")
    except urllib.error.HTTPError as x:
        raw = x.read()
        try:
            j = json.loads(raw)
        except Exception:
            j = None
        return x.code, dict(x.headers), j


def rekor_anchor(target, approval_file=REKOR_APPROVAL_FILE, dry_run=False, http=None, rekor=REKOR):
    """Submit (once) the rekord entry for a board-signed artifact; read back; check; save entry + receipt."""
    target = pathlib.Path(target)
    base = str(_stem(target))
    entry_p, receipt_p = pathlib.Path(base + ".rekor-entry.json"), pathlib.Path(base + ".rekor-receipt.json")
    prep_p = pathlib.Path(base + ".rekor-submission.PREPARED.json")
    s = json.loads(target.with_name(target.stem + ".signed.json").read_text())
    pre_sha, sig_hex = sha(canon(s["payload"])), s["signature"]["sig_ed25519"]
    res = {"file": target.name, "preimage_sha256": pre_sha}

    def save(entry_doc, how):
        ok, det = check_rekor_entry(entry_doc, pre_sha, sig_hex)
        if not ok:
            return dict(res, state="REKOR_FAILED", why="; ".join(det["problems"]), logIndex=det.get("logIndex"))
        entry_p.write_text(json.dumps(entry_doc, indent=1) + "\n")
        receipt = {"schema": "csoai.rekor-receipt/0.1", "subject": target.name, "subject_sha256": v.file_sha(target),
                   "preimage_sha256": pre_sha, "rekor": rekor, "uuid": det["uuid"], "logIndex": det["logIndex"],
                   "integratedTime": det["integratedTime"], "logID": det["logID"], "inclusion_proof": det.get("inclusion_proof"),
                   "tree_size": det.get("tree_size"), "root_hash": det.get("root_hash"), "how": how, "checked_at": utcnow(),
                   "verify": f"curl -s '{rekor}/api/v1/log/entries?logIndex={det['logIndex']}' and check body -> spec.data.hash.value == "
                             f"preimage_sha256 (sha256 of the canonical payload in {target.stem}.signed.json)",
                   "limits": "Rekor bounds WHEN these bytes and this signature existed (integratedTime). It says nothing about what was measured."}
        receipt_p.write_text(json.dumps(receipt, indent=1) + "\n")
        return dict(res, state="ANCHORED", how=how, logIndex=det["logIndex"], uuid=det["uuid"])

    if entry_p.exists():  # idempotent without the network
        ok, det = check_rekor_entry(json.loads(entry_p.read_text()), pre_sha, sig_hex)
        if ok:
            if not receipt_p.exists():
                return save(json.loads(entry_p.read_text()), "saved entry (receipt rebuilt)")
            return dict(res, state="ALREADY_ANCHORED", logIndex=det["logIndex"], uuid=det["uuid"])
        return dict(res, state="REKOR_FAILED", why="a saved entry does not match this artifact: " + "; ".join(det["problems"]))
    if not pathlib.Path(os.path.expanduser(approval_file)).is_file():
        return dict(res, state="GATED", why=f"no owner approval recorded at {approval_file}")
    if dry_run:
        return dict(res, state="DRY_RUN")
    http = http or _http
    try:
        if prep_p.exists() and json.loads(prep_p.read_text()).get("body", {}).get("spec", {}).get("data", {}).get("content") and \
                sha(base64.b64decode(json.loads(prep_p.read_text())["body"]["spec"]["data"]["content"])) == pre_sha:
            body = json.loads(prep_p.read_text())["body"]
        else:
            body = json.loads(prepare_rekor_any(target, prep_p).read_text())["body"]
        # never twice: look the preimage hash up first
        st, _, uuids = http("POST", f"{rekor}/api/v1/index/retrieve", {"hash": "sha256:" + pre_sha})
        how = None
        if st == 200 and uuids:
            uuid = uuids[0]; how = "found in Rekor by preimage hash (not resubmitted)"
        else:
            st, hdr, j = http("POST", f"{rekor}/api/v1/log/entries", body)
            if st == 201 and isinstance(j, dict) and j:
                uuid = next(iter(j)); how = "submitted (201)"
            elif st == 409:
                loc = hdr.get("Location") or hdr.get("location") or ""
                uuid = loc.rstrip("/").split("/")[-1]; how = "already in Rekor (409)"
            else:
                return dict(res, state="REKOR_FAILED", why=f"submit HTTP {st}")
        st, _, got = http("GET", f"{rekor}/api/v1/log/entries/{uuid}")
        if st != 200 or not got:
            return dict(res, state="REKOR_FAILED", why=f"read-back by uuid HTTP {st}")
        li = next(iter(got.values()))["logIndex"]
        st, _, got2 = http("GET", f"{rekor}/api/v1/log/entries?logIndex={li}")
        if st != 200 or not got2:
            return dict(res, state="REKOR_FAILED", why=f"read-back by logIndex HTTP {st}")
        return save(got2, how)
    except Exception as x:
        return dict(res, state="REKOR_FAILED", why=f"{type(x).__name__}: {str(x)[:160]}")


def cli_rekor(a):
    r = rekor_anchor(a.file, a.approval_file, a.dry_run)
    print(json.dumps(r))
    sys.exit(0 if r["state"] in ("ANCHORED", "ALREADY_ANCHORED", "GATED", "DRY_RUN") else 1)


def add_rekor_cli(sp):
    q = sp.add_parser("rekor-anchor", help="submit (once, owner-gated) and verify the Rekor entry of a signed index or head")
    q.add_argument("--file", required=True); q.add_argument("--approval-file", default=REKOR_APPROVAL_FILE)
    q.add_argument("--dry-run", action="store_true")


CLI["rekor-anchor"] = cli_rekor



# ----------------------------------------------------------------------------- publication state
def publication_report(d, date, doc, h, errors):
    """PUBLIC (the index says so: publication.state), PUBLIC by a signed publication record (for an index whose signed bytes
    still say private_until), or PRIVATE_UNTIL_OWNER_APPROVES. A record that does not verify or pins other bytes is an error."""
    rp = pathlib.Path(d) / f"measurement-index-v0.2-{date}.publication.json"
    rec = None
    if rp.exists():
        st, payload = sig_check(rp)
        r = json.loads(rp.read_bytes())
        if st["state"] != "VERIFIES":
            errors.append(f"{date}: PUBLICATION record signature {st['state']} {st.get('why', '')}".rstrip())
        elif r.get("index_sha256") != h:
            errors.append(f"{date}: PUBLICATION record pins another index version ({str(r.get('index_sha256'))[:16]})")
        elif payload.get("chain") != {k: r.get(k) for k in r["signed_fields"]}:
            errors.append(f"{date}: PUBLICATION record's signed fields differ from the record")
        else:
            rec = r
    ep = pathlib.Path(d) / f"measurement-index-v0.2-{date}.publication-erratum.json"
    if ep.exists():
        st, payload = sig_check(ep)
        r = json.loads(ep.read_bytes())
        if st["state"] != "VERIFIES":
            errors.append(f"{date}: PUBLICATION erratum signature {st['state']} {st.get('why', '')}".rstrip())
        elif payload.get("chain") != {k: r.get(k) for k in r["signed_fields"]}:
            errors.append(f"{date}: PUBLICATION erratum's signed fields differ from the record")
        elif r.get("files_sha256") != sha(canon([[f["file"], f["sha256"]] for f in r.get("files", [])])):
            errors.append(f"{date}: PUBLICATION erratum's files_sha256 does not match its file list")
    if isinstance(doc.get("publication"), dict):
        return {"state": doc["publication"].get("state"), "approved": doc["publication"].get("approved"), "by": "the index itself"}
    if rec:
        return {"state": rec["publication"]["state"], "approved": rec["publication"]["approved"],
                "by": f"signed publication record {rp.name} (the index's private_until predates the approval)"}
    return {"state": "PRIVATE_UNTIL_OWNER_APPROVES" if doc.get("private_until") else "UNSTATED"}


def _live_sha(url):
    try:
        return sha(urllib.request.urlopen(urllib.request.Request(url, headers=v.UA), timeout=30).read())
    except Exception as x:
        return f"UNREAD ({type(x).__name__})"


def make_publication(dirpath, date, approved, approval_evidence, locations, check=True):
    """The signed publication record for one day's index whose own bytes predate the owner's approval."""
    d = pathlib.Path(dirpath)
    ip = d / f"measurement-index-v0.2-{date}.json"
    out = d / f"measurement-index-v0.2-{date}.publication.json"
    if out.exists():
        sys.exit(f"PUBLICATION_EXISTS {out}")
    raw = ip.read_bytes(); doc = json.loads(raw)
    st, _ = sig_check(ip)
    if st["state"] != "VERIFIES":
        sys.exit(f"the index's own signature {st}")
    locs = []
    for u in locations:
        row = {"url": u}
        if check and u.startswith("http"):
            row.update(sha256_at_check=_live_sha(u), checked_at=utcnow())
            row["same_bytes"] = row["sha256_at_check"] == sha(raw)
        locs.append(row)
    if check and not any(x.get("same_bytes") for x in locs):
        sys.exit(f"PUBLICATION_REFUSED: no location serves these bytes: {locs}")
    r = {"schema": v.PUBLICATION_SCHEMA, "as_of": utcnow(),
         "what_this_is": "The publication state of one day's measurement index. The index's signed bytes cannot change; they were "
                         "written with private_until = 'owner approves publication' before the owner approved. This record says that "
                         "approval was given and where the same bytes are published.",
         "what_this_is_not": "Not a grade, ranking, admission or approval of anything the index measures.",
         "date": date, "index_file": ip.name, "index_sha256": sha(raw), "index_root": doc["index_root"],
         "index_schema": doc["schema"], "index_signed_payload_sha256": st["payload_sha256"],
         "index_field_superseded": {"private_until": doc.get("private_until"),
                                    "reads_as": "not yet approved; superseded by this record, the index bytes unchanged"},
         "publication": {"state": "PUBLIC", "approved": approved, "approved_by": "owner", "approval_evidence": approval_evidence},
         "published_at": locs,
         "signed_fields": ["date", "index_sha256", "index_root", "publication"]}
    out.write_bytes(json.dumps(r, indent=1, ensure_ascii=False).encode() + b"\n")
    return out


def cli_publication(a):
    locs = [x for x in (a.location or []) if x]
    out = make_publication(a.dir, a.date, a.approved, a.evidence, locs, check=not a.no_check)
    state = _sign_and_stamp(out, a.token, a.no_sign)
    print(json.dumps({"publication_record": str(out), "sha256": v.file_sha(out), "state": state}))


def add_publication_cli(sp):
    q = sp.add_parser("publication-record", help="signed publication record for an index whose bytes predate the approval")
    q.add_argument("--date", required=True); q.add_argument("--dir", default="/evac-bulk"); q.add_argument("--approved", required=True)
    q.add_argument("--evidence", required=True); q.add_argument("--location", action="append")
    q.add_argument("--token", default="~/.secrets/board-sign-pod-token"); q.add_argument("--no-sign", action="store_true")
    q.add_argument("--no-check", action="store_true")


CLI["publication-record"] = cli_publication


ERRATUM_TEXT = ("The field private_until = 'owner approves publication' in each file listed here is obsolete. The owner approved "
                "publication of the measurement index and everything it binds on {approved}; every file listed is public. The files' "
                "bytes are unchanged, because they are signed and anchored: this record supersedes that one field and nothing else. "
                "Read it as publication = {{state: PUBLIC, approved: {approved}}}.")


def _erratum_files(d, date, doc):
    """(file path, role, [public urls]) for every published file of DATE that still carries private_until."""
    base = f"measurement-index-v0.2-{date}"
    hf = f"https://huggingface.co/datasets/{HF_REPO}/resolve/main/{HF_PREFIX}/{date}/"
    out = []
    for rp, lp in publish_set(d, date, strict=False):
        if lp.suffix != ".json" or lp.name.endswith((".signed.json", ".rekor-entry.json", ".rekor-receipt.json")):
            continue
        try:
            j = json.loads(lp.read_bytes())
        except Exception:
            continue
        if isinstance(j, dict) and "private_until" in j:
            role = ("chain genesis" if j.get("schema") == v.CHAIN_GENESIS_SCHEMA else "weekly chain head" if j.get("schema") == v.CHAIN_HEAD_SCHEMA
                    else "daily index (final)" if lp.name == base + ".json" else "daily index (superseded same-day version)")
            urls = [hf + lp.name]
            if lp.name == base + ".json" and j.get("schema") == v.INDEX_SCHEMA_V02:
                urls.append("https://councilof.ai/measurement-capsules/v0.2/index.json")
            out.append((lp, role, urls))
    for b in doc.get("batches") or []:
        rp = pathlib.Path(b["dir"]) / "record.json"
        if not rp.exists():
            continue
        j = json.loads(rp.read_bytes())
        if "private_until" not in j:
            continue
        sp = rp.with_name("record.signed.json")
        apath = json.loads(sp.read_text())["payload"]["artifact"]["path"] if sp.exists() else None
        # candidates: the signed artifact path, and the site layout (one dir per adapter; <adapter>-<root[:12]> when an
        # adapter has several batches). With --check only the locations that serve these bytes are recorded.
        site = "https://councilof.ai/measurement-capsules/v0.2/"
        urls = [f"https://councilof.ai/{apath}"] if apath else []
        urls += [site + f"{b['adapter']}/record.json", site + f"{b['adapter']}-{j['merkle_root'][:12]}/record.json"]
        out.append((rp, f"batch record ({b['adapter']})", list(dict.fromkeys(urls))))
    return out


def make_publication_erratum(dirpath, date, approved, approval_evidence, check=True):
    """The signed, dated erratum for every published file of DATE whose signed bytes still say private_until."""
    d = pathlib.Path(dirpath)
    ip = d / f"measurement-index-v0.2-{date}.json"
    out = d / f"measurement-index-v0.2-{date}.publication-erratum.json"
    if out.exists():
        sys.exit(f"ERRATUM_EXISTS {out} (a signed record is never overwritten)")
    raw = ip.read_bytes(); doc = json.loads(raw)
    files = []
    for lp, role, urls in _erratum_files(d, date, doc):
        b = lp.read_bytes(); j = json.loads(b)
        row = {"file": lp.name if lp.parent == d else f"{lp.parent.name}/{lp.name}", "role": role, "schema": j.get("schema"),
               "sha256": sha(b), "private_until": j.get("private_until"), "public_at": []}
        for u in urls:
            loc = {"url": u}
            if check:
                loc["sha256_at_check"] = _live_sha(u); loc["checked_at"] = utcnow(); loc["same_bytes"] = loc["sha256_at_check"] == sha(b)
            row["public_at"].append(loc)
        if check:
            served = [x for x in row["public_at"] if x["same_bytes"]]
            row["public_at"] = served or row["public_at"]
        files.append(row)
    if not files:
        sys.exit(f"ERRATUM_NOT_NEEDED: no published file of {date} carries private_until")
    if check:
        unserved = [f["file"] for f in files if f["public_at"] and not any(x.get("same_bytes") for x in f["public_at"])]
        if unserved:
            sys.exit(f"ERRATUM_REFUSED: no listed location serves the recorded bytes of {unserved}")
    idx_pub = d / f"measurement-index-v0.2-{date}.publication.json"
    pub = {"state": "PUBLIC", "approved": approved, "approved_by": "owner", "approval_evidence": approval_evidence}
    r = {"schema": v.PUBLICATION_ERRATUM_SCHEMA, "as_of": utcnow(),
         "what_this_is": "A dated erratum to one field. Every file listed was published with private_until = 'owner approves "
                         "publication', written before the owner approved publication. The field is obsolete; the files are public.",
         "what_this_is_not": "Not a re-issue: no listed file is changed, re-signed or replaced, and no measurement changes. Not a grade, "
                             "ranking, admission or approval of anything the files measure.",
         "date": date, "index_file": ip.name, "index_sha256": sha(raw), "index_root": doc["index_root"],
         "erratum": ERRATUM_TEXT.format(approved=approved),
         "field_superseded": {"private_until": "owner approves publication"},
         "publication": pub,
         "index_publication_record": ({"file": idx_pub.name, "sha256": v.file_sha(idx_pub)} if idx_pub.exists() else None),
         "from_now_on": "batch records, daily indexes and chain heads written after the approval carry publication {state: PUBLIC} "
                        "in place of private_until (producer change of 27 Sep 2026)",
         "n_files": len(files), "files": files,
         "files_sha256": sha(canon([[f["file"], f["sha256"]] for f in files])),
         "files_sha256_rule": "sha256 of the canonical JSON (sorted keys, separators , and :) of [[file, sha256], ...] in the order listed",
         "signed_fields": ["date", "index_sha256", "publication", "n_files", "files_sha256"]}
    out.write_bytes(json.dumps(r, indent=1, ensure_ascii=False).encode() + b"\n")
    return out


def cli_publication_erratum(a):
    out = make_publication_erratum(a.dir, a.date, a.approved, a.evidence, check=not a.no_check)
    state = _sign_and_stamp(out, a.token, a.no_sign)
    print(json.dumps({"publication_erratum": str(out), "sha256": v.file_sha(out), "state": state}))


def add_publication_erratum_cli(sp):
    q = sp.add_parser("publication-erratum", help="signed erratum: DATE's published files' private_until field is obsolete")
    q.add_argument("--date", required=True); q.add_argument("--dir", default="/evac-bulk"); q.add_argument("--approved", required=True)
    q.add_argument("--evidence", required=True)
    q.add_argument("--token", default="~/.secrets/board-sign-pod-token"); q.add_argument("--no-sign", action="store_true")
    q.add_argument("--no-check", action="store_true")


CLI["publication-erratum"] = cli_publication_erratum


# ----------------------------------------------------------------------------- anchors.json (the site layout's --anchors)
ANCHORS_SCHEMA = "csoai.measurement-anchors/0.1"


def make_anchors(dirpath, date, headers=None):
    """The anchor states of DATE's final index, read from the files beside it (nothing inferred): its OpenTimestamps
    proof (Bitcoin heights, each checked against the block header when headers are given), the saved Rekor entries of
    the index, the weekly head and the publication record (each re-checked: body hash = signed payload sha256,
    inclusion proof), the XRPL state, and the publication state. Input to measurement_capsule_layout.py --anchors."""
    d = pathlib.Path(dirpath)
    ip = d / f"measurement-index-v0.2-{date}.json"
    raw = ip.read_bytes(); doc = json.loads(raw)
    errors = []
    o = ots_detail(ip, ip.with_name(ip.name + ".ots"), headers)
    ots = {"file": ip.name + ".ots", "proof_sha256": v.file_sha(ip.with_name(ip.name + ".ots")) if ip.with_name(ip.name + ".ots").exists() else None,
           "state": o["state"], "bitcoin_block_heights": o.get("bitcoin_block_heights", []),
           "bitcoin": [{k: r[k] for k in ("height", "block_hash", "header_check") if k in r} for r in o.get("bitcoin", [])],
           "meaning": "a Bitcoin attestation dates the index bytes no later than that block; a calendar commitment alone dates nothing"}
    rek = []
    for label, target in (("daily index", ip), ("weekly chain head", d / f"measurement-index-chain-head-{date}.json"),
                          ("publication record", d / f"measurement-index-v0.2-{date}.publication.json")):
        if not target.exists():
            continue
        st = rekor_state(target, errors, label)
        if st["state"] == "NOT_ANCHORED":
            continue
        s = json.loads(target.with_name(target.stem + ".signed.json").read_text())
        rek.append({"subject": label, "file": target.name, "subject_sha256": v.file_sha(target),
                    "signed_payload_sha256": s["signature"]["payload_sha256"], "state": st["state"],
                    "logIndex": st.get("logIndex"), "uuid": st.get("uuid"), "integratedTime": st.get("integratedTime"),
                    "entry_url": f"{REKOR}/api/v1/log/entries?logIndex={st.get('logIndex')}",
                    "search_url": f"https://search.sigstore.dev/?logIndex={st.get('logIndex')}"})
    if errors:
        sys.exit(f"ANCHORS_REFUSED: {errors}")
    pubrep = publication_report(d, date, doc, sha(raw), errors)
    er = d / f"measurement-index-v0.2-{date}.publication-erratum.json"
    return {"schema": ANCHORS_SCHEMA, "as_of": utcnow(), "date": date,
            "what_this_is": "Where the index's bytes are anchored, read from the anchor files themselves. Anchors show WHEN bytes "
                            "existed; the signature shows who signed them; neither says what the capsules measured.",
            "index": {"file": ip.name, "sha256": sha(raw), "index_root": doc["index_root"]},
            "opentimestamps": ots, "rekor": rek,
            "xrpl": {"state": "PREPARED_NOT_SUBMITTED", "note": "memo drafts exist; nothing has been submitted to the XRP Ledger"},
            "publication": dict(pubrep, erratum=({"file": er.name, "sha256": v.file_sha(er)} if er.exists() else None)),
            "copies": {"hf_dataset": f"https://huggingface.co/datasets/{HF_REPO}/tree/main/{HF_PREFIX}/{date}"}}


def cli_anchors(a):
    doc = make_anchors(a.dir, a.date, Headers() if a.bitcoin else None)
    txt = json.dumps(doc, indent=1, ensure_ascii=False) + "\n"
    if a.out:
        pathlib.Path(a.out).write_text(txt)
    print(txt if not a.out else json.dumps({"anchors": a.out, "rekor": len(doc["rekor"]), "ots": doc["opentimestamps"]["state"]}))


def add_anchors_cli(sp):
    q = sp.add_parser("anchors", help="anchors.json for DATE's index (input to measurement_capsule_layout.py --anchors)")
    q.add_argument("--date", required=True); q.add_argument("--dir", default="/evac-bulk"); q.add_argument("--out", default=None)
    q.add_argument("--bitcoin", action="store_true", help="check each Bitcoin attestation against the block header")


CLI["anchors"] = cli_anchors
