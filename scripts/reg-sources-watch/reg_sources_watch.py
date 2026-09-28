#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""reg_sources_watch.py - reaction-loop slice 4: regulatory dockets and standards bodies as watched sources.

  reg_sources_watch.py run         --sources SOURCES_JSON --data DATA_ROOT [--only ID[,ID..]] [--family F] [--now T]
  reg_sources_watch.py show        --sources SOURCES_JSON                        (no network)
  reg_sources_watch.py ca-outcomes --sources SOURCES_JSON --out OUT_JSON [--now T]  (read-only snapshot)
  reg_sources_watch.py selftest                                                   (offline)

A RUN fetches every selected source once (its machine-readable endpoint, 30 s timeout, 2 MiB cap) and reduces it
to ATOMS: a few named public metadata values (a comment-close date, a draft revision, a bill's last action, the
links of the newest items in a feed). It compares them with the pin (the atoms last observed) and appends, under
DATA_ROOT/<sealed_id>/ (the store layout claim_watch.py uses, so claim_events_export.py can read it):

  atom/atoms.jsonl               one line per run: {run_id, phase, at, atoms} for every source that answered
  history/events.jsonl           csoai.claim-watch-event/0.1, append-only; line n carries prev_sha256 = sha256 of
                                 line n-1's bytes and seq = n. One run event (claim_id "*") every run, plus one event
                                 per source that is first seen, changes, becomes unreachable, or recovers.
  history/review-queue.jsonl     one line per CHANGE, for a human (the loop notifies; a human reads)
  history/pin.json               the atoms (and feed item lists) last observed, per source
  observation/raw/<run_id>/      the fetched bytes of CHANGED sources only (the evidence), each capped at 512 KiB

States - all inside the claim-event exporter's STATES_OK:
  first seen                 object_state OBSERVED     change_state null
  record source changed      object_state OBSERVED     change_state QUARANTINED   any claim read from this record (a
                             deadline, a revision, a bill's outcome) is held for review; nothing is rewritten here
  feed source changed        object_state OBSERVED     change_state null          new_items / removed_items listed; a new
                             publication is not a finding about any claim
  unreachable                object_state UNCHECKABLE  change_state null          NEVER a change: the pin is kept
Detection only. It interprets nothing, files nothing, contacts nobody and publishes nothing.
Exit: 0 no change, 2 at least one change recorded, 1 failed.

Keys: regulations.gov takes an api.data.gov key from $REGS_GOV_API_KEY or the file named by $REGS_GOV_API_KEY_FILE
(default ~/.secrets/regs_gov_api_key); DEMO_KEY otherwise (about 10 requests an hour). A key never reaches a log,
an atom, an event or an error message.
"""
import argparse, datetime, hashlib, html, json, os, pathlib, re, sys, tempfile, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET

SCHEMA_EVENT = "csoai.claim-watch-event/0.1"
SCHEMA_REVIEW = "csoai.reg-source-review/0.1"
SCHEMA_PIN = "csoai.reg-sources-pin/0.1"
SCHEMA_CA = "csoai.ca-bill-outcomes/0.1"
MAX_BYTES = 2 * 1024 * 1024
RAW_CAP = 512 * 1024
FEED_KEEP = 25
STATES_OK = {None, "OBSERVED", "UNCHECKABLE", "QUARANTINED", "CONFIRMED"}


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha(b):
    return hashlib.sha256(b).hexdigest()


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def ws(s):
    return re.sub(r"\s+", " ", html.unescape(s or "")).strip()


def append(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(obj, sort_keys=True)
    with open(p, "a") as f:
        f.write(line + "\n")
        f.flush(); os.fsync(f.fileno())
    return line.encode()


def tail_line(p):
    if not p.exists() or p.stat().st_size == 0:
        return None
    raw = p.read_bytes()
    if not raw.endswith(b"\n"):
        raise SystemExit(f"FAILED: {p} ends without a newline (a partial write); refusing to extend it")
    return raw.rstrip(b"\n").rsplit(b"\n", 1)[-1]


# ------------------------------------------------------------------ fetch
def regs_key():
    k = os.environ.get("REGS_GOV_API_KEY", "").strip()
    if k:
        return k, "env"
    f = pathlib.Path(os.environ.get("REGS_GOV_API_KEY_FILE", "~/.secrets/regs_gov_api_key")).expanduser()
    try:
        k = f.read_text().strip()
        if k:
            return k, "file"
    except OSError:
        pass
    return "DEMO_KEY", "demo"


def fetch(src, ua, method="GET", timeout=30):
    url = src["url"]
    key = None
    if src.get("needs_key"):
        key, _ = regs_key()
        url += ("&" if "?" in url else "?") + "api_key=" + key
    hdrs = {"user-agent": ua, "accept": "application/json, application/xml;q=0.9, text/html;q=0.8, */*;q=0.5"}
    if src.get("kind") == "head":
        # a ranged GET, not HEAD: some publishers (nvlpubs.nist.gov) answer HEAD with 404 for a non-browser agent
        hdrs["range"] = "bytes=0-1023"
    req = urllib.request.Request(url, method=method, headers=hdrs)
    t = now()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read(MAX_BYTES + 1) if method == "GET" else b""
            if len(body) > MAX_BYTES:
                return {"status": r.status, "body": b"", "headers": {}, "fetched_at": t, "error": "TOO_LARGE (> 2 MiB)"}
            return {"status": r.status, "body": body, "headers": {k.lower(): v for k, v in r.headers.items()},
                    "fetched_at": t, "error": None}
    except urllib.error.HTTPError as e:
        err = f"HTTP {e.code}"
    except Exception as e:  # noqa: BLE001 - every failure is reported, none is a change
        err = f"{type(e).__name__}: {str(e)[:160]}"
    if key:
        err = err.replace(key, "<key>")
    return {"status": None, "body": b"", "headers": {}, "fetched_at": t, "error": err}


# ------------------------------------------------------------------ normalise: bytes -> atoms (+ feed items)
def dotted(o, path):
    for part in path.split("."):
        if isinstance(o, dict):
            o = o.get(part)
        else:
            return None
    return o


def xml_items(body):
    """RSS <item> or Atom <entry>: [{key, date}] with key = the item's link (or guid/id). Titles and authors are not kept."""
    root = ET.fromstring(body)
    out = []
    for el in root.iter():
        tag = el.tag.rsplit("}", 1)[-1]
        if tag not in ("item", "entry"):
            continue
        link = guid = date = None
        text = []
        for c in el:
            ct = c.tag.rsplit("}", 1)[-1]
            if ct == "link":
                link = link or (c.attrib.get("href") or (c.text or "").strip() or None)
            elif ct in ("guid", "id"):
                guid = (c.text or "").strip() or None
            elif ct in ("pubDate", "updated", "published") and not date:
                date = (c.text or "").strip() or None
            if ct in ("title", "description", "summary"):
                text.append(c.text or "")
        out.append({"key": link or guid, "date": date, "_text": ws(" ".join(text))})
    return out


def leginfo_rows(body):
    x = body.decode("utf-8", "replace")
    rows = re.findall(r"<tr[^>]*>\s*<td[^>]*>\s*(\d\d/\d\d/\d\d)\s*</td>\s*<td[^>]*>(.*?)</td>", x, flags=re.S)
    return [(d, ws(re.sub(r"<[^>]+>", " ", a))) for d, a in rows]


def iso(mmddyy):
    m, d, y = mmddyy.split("/")
    return f"20{y}-{m}-{d}"


def governor_action(rows):
    """Newest-first history rows -> the Governor's action, read from the words of the record, never inferred."""
    for d, a in rows:
        la = a.lower()
        if "approved by the governor" in la:
            return f"APPROVED {iso(d)}"
        if re.search(r"vetoed by (the )?governor", la):
            return f"VETOED {iso(d)}"
        if "without" in la and "governor" in la and "signature" in la:
            return f"BECAME_LAW_WITHOUT_SIGNATURE {iso(d)}"
    for d, a in rows:
        if a.lower().startswith("enrolled and presented to the governor"):
            return f"ON_DESK since {iso(d)}"
    return "NOT_PRESENTED"


def atoms_of(src, r):
    """-> (atoms, items). items is the full current key list of a feed source (kept in the pin for diffing), else None."""
    kind, body = src["kind"], r["body"]
    if kind == "head":
        h = r["headers"]
        cr = h.get("content-range") or ""
        total = cr.rsplit("/", 1)[-1] if "/" in cr else h.get("content-length")
        return {"etag": h.get("etag"), "last_modified": h.get("last-modified"), "total_length": total}, None
    if kind == "json_fields":
        j = json.loads(body)
        return {f: dotted(j, f) for f in src["fields"]}, None
    if kind == "regs_docket":
        a = (json.loads(body).get("data") or {}).get("attributes") or {}
        return {f: a.get(f) for f in src["fields"]}, None
    if kind == "regs_comments":
        j = json.loads(body)
        ids = [d.get("id") for d in j.get("data") or []]
        return {"total": (j.get("meta") or {}).get("totalElements"), "newest_ids": ids}, ids
    if kind == "fr_search":
        j = json.loads(body)
        res = j.get("results") or []
        rows = sorted(f"{x.get('document_number')}|{x.get('type')}|{x.get('publication_date')}|{x.get('comments_close_on')}"
                      for x in res)
        return {"count": j.get("count"), "documents": rows}, [x.get("document_number") for x in res]
    if kind == "ietf_search":
        objs = json.loads(body).get("objects") or []
        rows = sorted(f"{o.get('name')}|{o.get('rev')}|{(o.get('expires') or '')[:10]}" for o in objs)
        return {"count": len(objs), "documents": rows}, None
    if kind == "govuk_search":
        j = json.loads(body)
        links = [x.get("link") for x in j.get("results") or []]
        return {"total": j.get("total"), "newest_links": links}, links
    if kind == "rss_items":
        its = xml_items(body)
        if src.get("match"):
            rx = re.compile(src["match"], re.I)
            its = [i for i in its if rx.search(i["_text"])]
        keys = [i["key"] for i in its][:FEED_KEEP]
        return {"n_items": len(its), "newest": keys[:10]}, keys
    if kind == "sitemap_locs":
        locs = sorted(set(re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", body.decode("utf-8", "replace"))))
        return {"n_locs": len(locs), "locs_sha256": sha(canon(locs))}, locs
    if kind == "html_regex":
        x = body.decode("utf-8", "replace")
        text = ws(re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>|<style.*?</style>", " ", x, flags=re.S)))
        out = {}
        for name, rx in src["regex"].items():
            hits = sorted(set(re.findall(rx, x if name.endswith("links") else text)))
            out[name] = ["|".join(h) if isinstance(h, tuple) else h for h in hits] or "ABSENT"
        return out, None
    if kind == "leginfo_history":
        rows = leginfo_rows(body)
        if not rows:
            raise ValueError("no history rows found (page layout changed or bill id wrong)")
        chap = next((m.group(0) for _, a in rows for m in [re.search(r"Chapter \d+, Statutes of 20\d\d", a)] if m), None)
        x = body.decode("utf-8", "replace")
        t = re.search(r">\s*((?:AB|SB)-\d+ [^<]{2,200}?)\s*<span class=\"bill_title_yr\"", x)
        return {"n_history": len(rows), "last_action": f"{iso(rows[0][0])} {rows[0][1]}",
                "governor": governor_action(rows), "chapter": chap, "title": ws(t.group(1)) if t else None}, None
    raise ValueError(f"unknown kind {kind}")


# ------------------------------------------------------------------ the event log
class Log:
    """history/events.jsonl: append-only; each line carries the sha256 of the previous line's bytes and its seq."""
    def __init__(self, store, base):
        self.p = store / "history" / "events.jsonl"
        self.base = base
        last = tail_line(self.p)
        self.prev = sha(last) if last else None
        self.seq = (json.loads(last)["seq"] + 1) if last else 0
        self.n = 0

    def ev(self, claim_id, **kw):
        for k in ("object_state", "change_state"):
            if kw.get(k) not in STATES_OK:
                raise SystemExit(f"FAILED: refusing unknown {k}={kw.get(k)!r}")
        e = dict(self.base, schema=SCHEMA_EVENT, seq=self.seq, prev_sha256=self.prev, at=now(), claim_id=claim_id, **kw)
        self.prev = sha(append(self.p, e))
        self.seq += 1; self.n += 1
        return e


def diff_items(old, new):
    o, n = set(old or []), set(new or [])
    return sorted(x for x in n - o if x), sorted(x for x in o - n if x)


def run(a):
    cfg = json.loads(pathlib.Path(a.sources).read_text())
    srcs = cfg["sources"]
    if a.only:
        want = set(a.only.split(","))
        srcs = [s for s in srcs if s["id"] in want]
    if a.family:
        srcs = [s for s in srcs if s["family"] == a.family]
    if not srcs:
        print("rc=1 state=FAILED step=select reason=no-sources-selected"); return 1
    store = pathlib.Path(a.data).expanduser() / cfg["sealed_id"]
    T = a.now or now()
    run_id = T.replace("-", "").replace(":", "")
    pin_p = store / "history" / "pin.json"
    pin = json.loads(pin_p.read_text()) if pin_p.exists() else {"schema": SCHEMA_PIN, "sources": {}}
    obs = {}
    for i, s in enumerate(srcs):
        if i and s.get("family") in ("regulations_gov", "california"):
            time.sleep(1.0)  # politeness on the two hosts we read many times per run
        r = fetch(s, cfg["user_agent"])
        if r["error"] is None:
            try:
                at, items = atoms_of(s, r)
                r.update(atoms=at, items=items)
            except Exception as e:  # noqa: BLE001
                r["error"] = f"UNPARSEABLE: {type(e).__name__}: {str(e)[:120]}"
        obs[s["id"]] = r

    # everything is decided before anything is written; the event log is written last
    base = {"run_id": run_id, "date": T[:10], "subject": cfg["subject"], "subject_sealed_id": cfg["sealed_id"],
            "detected_by": cfg["detected_by"]}
    decisions = []
    for s in srcs:
        r, p = obs[s["id"]], pin["sources"].get(s["id"])
        if r["error"]:
            if p and not p.get("unreachable_since"):
                decisions.append((s, "UNREACHABLE", {"error": r["error"]}))
            elif not p:
                decisions.append((s, "UNREACHABLE_FIRST", {"error": r["error"]}))
            continue
        a_now, a_pin = r["atoms"], (p or {}).get("atoms")
        if a_pin is None:
            decisions.append((s, "FIRST_SEEN", {}))
            continue
        changed = sorted(k for k in set(a_now) | set(a_pin) if canon(a_now.get(k)) != canon(a_pin.get(k)))
        rec = {"recovered_from": p["unreachable_since"]} if p.get("unreachable_since") else {}
        if changed:
            added, removed = diff_items(p.get("items"), r.get("items")) if r.get("items") is not None else ([], [])
            if s["kind"] != "sitemap_locs":
                removed = []  # a newest-N window: an item that left the window was not deleted, so it is not reported
            decisions.append((s, "CHANGED", dict(rec, changed=changed, before={k: a_pin.get(k) for k in changed},
                                                 after={k: a_now.get(k) for k in changed},
                                                 new_items=added[:FEED_KEEP], removed_items=removed[:FEED_KEEP])))
        elif rec:
            decisions.append((s, "RECOVERED", rec))

    # atoms line (every source that answered), raw evidence for changed sources, then events, then the pin
    atoms_all = {f"{sid}.{k}": v for sid, r in sorted(obs.items()) if not r["error"] for k, v in sorted(r["atoms"].items())}
    # phase "primary" = every source was selected; "partial" = an --only/--family run. A source that did not answer has
    # no atoms in the line (it was not observed), so a feed reader will list its atoms as changed for that run.
    phase = "partial" if (a.only or a.family) else "primary"
    atoms_line = append(store / "atom" / "atoms.jsonl", {"run_id": run_id, "phase": phase, "at": T, "atoms": atoms_all})
    rawdir = store / "observation" / "raw" / run_id
    for s, kind, _ in decisions:
        if kind == "CHANGED":
            rawdir.mkdir(parents=True, exist_ok=True)
            (rawdir / f"{s['id']}.bin").write_bytes(obs[s["id"]]["body"][:RAW_CAP])
    log = Log(store, base)
    n_changed = 0
    for s, kind, info in decisions:
        r = obs[s["id"]]
        common = {"source_id": s["id"], "family": s["family"], "source_class": s["cls"], "url": s["url"],
                  "http_status": r["status"], "bytes_sha256": sha(r["body"]) if not r["error"] else None}
        if kind in ("UNREACHABLE", "UNREACHABLE_FIRST"):
            log.ev(s["id"], object_state="UNCHECKABLE", change_state=None, error=info["error"], **common,
                   reason="the source did not answer or could not be read; this is not a change and the pin is kept")
        elif kind == "FIRST_SEEN":
            log.ev(s["id"], object_state="OBSERVED", change_state=None, atoms_sha256=sha(canon(r["atoms"])), **common,
                   reason="first observation; pin created")
        elif kind == "RECOVERED":
            log.ev(s["id"], object_state="OBSERVED", change_state="CONFIRMED", **common, **info,
                   reason="reachable again; atoms unchanged against the pin")
        elif kind == "CHANGED":
            n_changed += 1
            record = s["cls"] == "record"
            e = log.ev(s["id"], object_state="OBSERVED", change_state="QUARANTINED" if record else None, **common,
                       changed=info["changed"], before=info["before"], after=info["after"],
                       new_items=info["new_items"], removed_items=info["removed_items"],
                       evidence=f"observation/raw/{run_id}/{s['id']}.bin",
                       reason=("a tracked field of this record changed; any claim read from it is held for review"
                               if record else "the feed's items changed; this is not a finding about any claim"))
            append(store / "history" / "review-queue.jsonl", {
                "schema": SCHEMA_REVIEW, "review_id": f"rev-{cfg['sealed_id']}-{run_id}-{s['id']}",
                "detected_at": T, "detected_by": cfg["detected_by"], "source_id": s["id"], "family": s["family"],
                "source_class": s["cls"], "relation": s.get("relation"), "human_url": s.get("human_url"),
                "changed": info["changed"], "before": info["before"], "after": info["after"],
                "new_items": info["new_items"], "removed_items": info["removed_items"], "event_seq": e["seq"],
                "status": "OPEN - for a human; nothing has been changed anywhere"})
    unreachable = sorted(sid for sid, r in obs.items() if r["error"])
    log.ev("*", object_state="OBSERVED", change_state=None, n_sources=len(srcs), n_answered=len(srcs) - len(unreachable),
           n_changed=n_changed, unreachable=unreachable, atoms_line_sha256=sha(atoms_line),
           key_mode=regs_key()[1] if any(s.get("needs_key") for s in srcs) else None,
           reason="run summary: every selected source was fetched once; unchanged sources are covered by atoms_line_sha256")

    for s in srcs:
        r, p = obs[s["id"]], pin["sources"].get(s["id"]) or {}
        if r["error"]:
            p.setdefault("unreachable_since", T); p["last_error"] = f"{T}: {r['error']}"
        else:
            p = {"atoms": r["atoms"], "observed_at": T, "bytes_sha256": sha(r["body"])}
            if r.get("items") is not None:
                p["items"] = r["items"]
        pin["sources"][s["id"]] = p
    pin["updated_at"] = T
    tmp = pin_p.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(pin, indent=1, sort_keys=True) + "\n")
    os.replace(tmp, pin_p)
    state = "CHANGED" if n_changed else "NO_CHANGE"
    print(f"rc={2 if n_changed else 0} state={state} sources={len(srcs)} answered={len(srcs) - len(unreachable)} "
          f"changed={n_changed} unreachable={len(unreachable)} events=+{log.n} store={store}")
    return 2 if n_changed else 0


def show(a):
    cfg = json.loads(pathlib.Path(a.sources).read_text())
    for s in cfg["sources"]:
        print(f"{s['id']:<48} {s['family']:<17} {s['kind']:<16} {s['cls']:<6} {s.get('relation', ''):<26} {s['human_url']}")
    print(f"{len(cfg['sources'])} sources; sealed_id {cfg['sealed_id']}")
    return 0


def ca_outcomes(a):
    """A read-only snapshot of the Governor's action on every California bill in the source list."""
    cfg = json.loads(pathlib.Path(a.sources).read_text())
    T = a.now or now()
    rows, fails = [], []
    for i, s in enumerate(x for x in cfg["sources"] if x["family"] == "california"):
        if i:
            time.sleep(1.0)
        r = fetch(s, cfg["user_agent"])
        bill = s["id"].split("-")[-1]
        row = {"bill": f"{bill[:2]} {bill[2:]}", "status_page": s["human_url"], "history_source": s["url"],
               "fetched_at": r["fetched_at"], "http_status": r["status"], "listed_as_ai_bill_by": s.get("listed_by", [])}
        if r["error"]:
            row.update(outcome="UNMEASURED", error=r["error"]); fails.append(bill)
        else:
            try:
                at, _ = atoms_of(s, r)
                g = at["governor"]
                row.update(title=at["title"], governor_action=g, outcome=g.split()[0] if g else "UNMEASURED",
                           outcome_date=g.split()[-1] if g.split()[0] in ("APPROVED", "VETOED", "BECAME_LAW_WITHOUT_SIGNATURE") else None,
                           chapter=at["chapter"], last_action=at["last_action"], bytes_sha256=sha(r["body"]))
            except Exception as e:  # noqa: BLE001
                row.update(outcome="UNMEASURED", error=f"UNPARSEABLE: {e}"); fails.append(bill)
        rows.append(row)
    count = {}
    for r in rows:
        count[r["outcome"]] = count.get(r["outcome"], 0) + 1
    doc = {"schema": SCHEMA_CA, "as_of": T, "session": "California Legislature 2025-26 Regular Session",
           "deadline": "2026-09-30: the Governor's last day to sign or veto bills passed before the 2026-08-31 adjournment",
           "method": ("Each bill's full history page on leginfo.legislature.ca.gov (the Legislature's own record) was read "
                      "once at fetched_at. The outcome is taken from the words of the record: 'Approved by the Governor' "
                      "-> APPROVED, 'Vetoed by (the) Governor' -> VETOED, 'Enrolled and presented to the Governor' with "
                      "neither -> ON_DESK. Nothing is inferred from news reports."),
           "selection": ("Bills are included because at least one listed secondary source named them as AI-related bills "
                         "sent to the Governor (listed_as_ai_bill_by). The selection is not exhaustive: reports speak of "
                         "30 or more AI measures, and this list has " + str(len(rows)) + ". Completeness is UNMEASURED."),
           "counts_over_this_list": dict(sorted(count.items())), "unmeasured": fails,
           "not_claimed": ("No status, role or registration under any of these bills is claimed by CSOAI. SB 813 and AB 1405 "
                           "create criteria and a registry that do not yet exist; nothing here says otherwise."),
           "bills": rows}
    pathlib.Path(a.out).write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {a.out}: {len(rows)} bills {dict(sorted(count.items()))}")
    return 0 if not fails else 1


# ------------------------------------------------------------------ selftest (offline: stubbed fetch)
def selftest(_a):
    global fetch
    real = fetch
    feed1 = b"<rss><channel><item><title>AI Act news</title><link>https://x/1</link></item></channel></rss>"
    feed2 = feed1.replace(b"</channel>", b"<item><title>AI Office update</title><link>https://x/2</link></item></channel>")
    hist1 = (b"<table id='billhistory'><tr><td>09/14/26</td><td>Enrolled and presented to the Governor at 1:30 p.m.</td></tr>"
             b"<tr><td>08/31/26</td><td>Senate amendments concurred in.</td></tr></table>")
    hist2 = (b"<table><tr><td>09/29/26</td><td>Vetoed by Governor.</td></tr>" + hist1.split(b">", 1)[1])
    state = {"n": 0}

    def stub(src, ua, method="GET", timeout=30):
        n = state["n"]
        if src["id"] == "t-json":
            body = json.dumps({"comments_close_on": "2026-10-19" if n < 2 else "2026-11-02", "title": "T"}).encode()
        elif src["id"] == "t-feed":
            body = feed1 if n < 2 else feed2
        elif src["id"] == "t-bill":
            body = hist1 if n < 2 else hist2
        else:  # t-down: answers on run 0, fails on run 1, answers again on run 2
            if n == 1:
                return {"status": None, "body": b"", "headers": {}, "fetched_at": now(), "error": "URLError: stub"}
            body = json.dumps({"title": "D"}).encode()
        return {"status": 200, "body": body, "headers": {}, "fetched_at": now(), "error": None}

    fetch = stub
    try:
        with tempfile.TemporaryDirectory() as t:
            t = pathlib.Path(t)
            src = {"schema": "csoai.reg-sources/0.1", "subject": "selftest", "sealed_id": "0000000000000000",
                   "user_agent": "t", "detected_by": "selftest", "sources": [
                       {"id": "t-json", "family": "federal_register", "kind": "json_fields", "cls": "record", "url": "u",
                        "fields": ["comments_close_on", "title"], "human_url": "h"},
                       {"id": "t-feed", "family": "eu_ai_office", "kind": "rss_items", "cls": "feed", "url": "u",
                        "match": r"\bAI\b", "human_url": "h"},
                       {"id": "t-bill", "family": "california", "kind": "leginfo_history", "cls": "record", "url": "u",
                        "human_url": "h"},
                       {"id": "t-down", "family": "w3c", "kind": "json_fields", "cls": "record", "url": "u",
                        "fields": ["title"], "human_url": "h"}]}
            (t / "s.json").write_text(json.dumps(src))
            ns = argparse.Namespace(sources=str(t / "s.json"), data=str(t / "d"), only=None, family=None, now=None)
            rcs = []
            for n in range(4):
                state["n"] = n
                ns.now = f"2026-09-2{n}T00:00:00Z"
                rcs.append(run(ns))
            store = t / "d" / "0000000000000000"
            ev = [json.loads(l) for l in (store / "history" / "events.jsonl").read_text().splitlines()]
            # the chain verifies exactly as claim_events_export.py verifies it
            prev = None
            for i, l in enumerate((store / "history" / "events.jsonl").read_bytes().rstrip(b"\n").split(b"\n")):
                o = json.loads(l)
                assert o["seq"] == i and o["prev_sha256"] == prev, f"chain broken at {i}"
                prev = sha(l)
            assert rcs == [0, 0, 2, 0], rcs
            first = [e for e in ev if e["run_id"] == "20260920T000000Z" and e["claim_id"] != "*"]
            assert len(first) == 4 and all(e["object_state"] == "OBSERVED" and e["change_state"] is None for e in first)
            r1 = [e for e in ev if e["run_id"] == "20260921T000000Z" and e["claim_id"] != "*"]
            assert [(e["claim_id"], e["object_state"]) for e in r1] == [("t-down", "UNCHECKABLE")], r1
            r2 = {e["claim_id"]: e for e in ev if e["run_id"] == "20260922T000000Z" and e["claim_id"] != "*"}
            assert r2["t-json"]["change_state"] == "QUARANTINED" and r2["t-json"]["after"] == {"comments_close_on": "2026-11-02"}
            assert r2["t-feed"]["change_state"] is None and r2["t-feed"]["new_items"] == ["https://x/2"]
            assert r2["t-bill"]["change_state"] == "QUARANTINED" and r2["t-bill"]["after"]["governor"] == "VETOED 2026-09-29"
            assert r2["t-down"]["change_state"] == "CONFIRMED" and r2["t-down"]["recovered_from"] == "2026-09-21T00:00:00Z"
            r3 = [e for e in ev if e["run_id"] == "20260923T000000Z" and e["claim_id"] != "*"]
            assert r3 == [], r3  # nothing moved: only the run event
            q = [json.loads(l) for l in (store / "history" / "review-queue.jsonl").read_text().splitlines()]
            assert sorted(x["source_id"] for x in q) == ["t-bill", "t-feed", "t-json"]
            assert (store / "observation" / "raw" / "20260922T000000Z" / "t-json.bin").exists()
            assert all(e["object_state"] in STATES_OK and e["change_state"] in STATES_OK for e in ev)
            assert governor_action([("09/09/26", "Approved by the Governor.")]) == "APPROVED 2026-09-09"
            assert governor_action([("09/08/26", "Enrolled and presented to the Governor at 4 p.m.")]) == "ON_DESK since 2026-09-08"
            # a key never reaches an error string
            os.environ["REGS_GOV_API_KEY"] = "SECRETKEY123"
            fetch = real
            r = fetch({"url": "http://127.0.0.1:9/x", "needs_key": True}, "t", timeout=2)
            assert r["error"] and "SECRETKEY123" not in r["error"], r["error"]
            del os.environ["REGS_GOV_API_KEY"]
    finally:
        fetch = real
    print("selftest: PASS (chain verifies; first-seen/unreachable/recovered/record-change/feed-change/no-change; key redaction)")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("run"); p.add_argument("--sources", required=True); p.add_argument("--data", required=True)
    p.add_argument("--only"); p.add_argument("--family"); p.add_argument("--now")
    p = sub.add_parser("show"); p.add_argument("--sources", required=True)
    p = sub.add_parser("ca-outcomes"); p.add_argument("--sources", required=True); p.add_argument("--out", required=True)
    p.add_argument("--now")
    sub.add_parser("selftest")
    a = ap.parse_args()
    return {"run": run, "show": show, "ca-outcomes": ca_outcomes, "selftest": selftest}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
