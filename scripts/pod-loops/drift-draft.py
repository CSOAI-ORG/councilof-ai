#!/usr/bin/env python3
"""drift-draft: hourly  DRIFT? -> corrections AUTO-DRAFT -> owner approve-queue.  Never publishes.

Runs on the pod at :40 (scheduler.sh passes --now; the scheduler owns the hour stamp). Section C of
CSOAI_SELF_INDEXING_MACHINE_BUILD_SPEC_2026-09-22.md.

    drift-draft.py                    snapshot -> diff -> drafts -> branch corrections/draft-<hour> -> HF mirror
    drift-draft.py --no-upload        same, no HF upload (drafts and branch still written)
    drift-draft.py --no-push          same, no branch push
    drift-draft.py --selftest         hermetic: identical snapshots => 0 drift; a planted drift => a draft
                                      citing two byte-sources; a planted banned token => redacted. No network
                                      writes, no branch, no upload. Output under <out>/selftest/<ts>/.
    drift-draft.py --promote <id> --clone DIR
                                      used ONLY by promote-draft.sh (the owner's approve path, below).

WHAT A DRIFT IS. A typed claim surface that now disagrees with a measured surface, or a measured
surface that moved between two hourly snapshots in a way a reader must be told about:
  typed_claim_disagrees     client/src/data/facts.json counts.axis_count.observed, canon.json api.*,
                            public/corrections/*.json current-state fields, and typed literals in
                            public/**/*.md, docs/**, client/src/** (board grammar "N axis · M measured",
                            "N measured axes" [facts-gate MEASURED_RE, ported], "N·M·K", "N signed cards")
                            vs GET /api/gspc totals and GET /api/state card corpora (three corpora, kept apart).
  board_totals_changed      /api/gspc totals moved between snapshots.
  axis_status_changed       an axis row's status moved (n moving alone is a new run, a signal not a draft).
  corpus_count_changed      one of the three card counts moved (never added together).
  door_flipped              a /api/pop/{id} preview changed state or n (HTTP status change is a signal).
  as_of_regressed           any as_of went backwards between snapshots.
  artifact_silent_edit      a door's artifact bytes changed in the repo while its as_of did not.
Signals (recorded in diffs/<hour>.json and the receipt, NOT drafted): n moved on an axis, a door's HTTP
status changed, artifact bytes changed with a new as_of, local artifact != served artifact (deploy lag),
ledger entry count changed.

EVERY DRAFT cites the two byte-sources compared (locator + sha256 + as_of) and the exact field that
moved (was -> now). No number in a draft is typed: each is read from one of the two sources. Drafts
are deduplicated by fingerprint (kind|subject|field|was|now) in <out>/queue/index.json, so an
unchanged disagreement is drafted once and counted as "open" afterwards, and two identical snapshots
produce "no drift".

BRAND GATE. Draft text is passed through the same forbidden-token classes scripts/brand-gate.mjs
enforces (the ledger's own REDACTION RULE: describe the token, never reproduce it). A quoted line that
carries one has the token replaced by "[token redacted: brand-gate]" and the draft records the count.

WHAT THIS LOOP NEVER DOES. It never edits functions/api/corrections.ts or public/corrections/, never
merges, never deploys, never assigns a ledger id (ids here are D-<hour>-<nn>; the C-YYYY-MMDD-NN id is
minted by the promote step from the ledger's own bytes), never edits a signed artifact.

APPROVE PATH (owner, one command, NOT run by this loop):
    bash /workspace/lanes/loops/promote-draft.sh D-2026-09-22T14-01
  -> clone /workspace/ci/corrections-lane, branch corrections/D-2026-09-22T14-01 from origin/master
  -> next ledger id from functions/api/corrections.ts bytes (C-<today>-<max+1>)
  -> entry inserted at the top of LEDGER.corrections (ledger fields + evidence[])
  -> public/corrections/<slug>-<date>[-SUPERSEDES].md written from the draft note; SUPERSESSIONS.md row
     added when the subject is itself a public/corrections file
  -> the draft moved to council-os/corrections-drafts/promoted/ ; commit ; push the branch
  -> the owner opens the PR and merges. GET /api/corrections will serve signature_state STALE until the
     ledger signature is re-issued (owner-gated) — a stale signature is a published defect, never a silent edit.

Measure, never grade-as-mark. UNMEASURED is first-class: a surface that could not be read is recorded
as UNCHECKABLE with the reason and is never compared, never counted as drift, never counted as agreement.
"""
import argparse, copy, datetime as dt, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time
from pathlib import Path

try:
    import requests
except ImportError:  # the pod has it (corrections-watch.py); named so the receipt says why
    requests = None

HOST = os.environ.get("DRIFT_HOST", "https://councilof.ai")
LANES = Path(os.environ.get("LANES", "/workspace/lanes"))
LOOPS = LANES / "loops"
BARE = Path(os.environ.get("DRIFT_BARE", "/workspace/git/councilof-ai.git"))
CLONE_DEFAULT = Path(os.environ.get("DRIFT_CLONE", "/workspace/ci/corrections-lane"))
DRAFT_DIR_IN_REPO = "council-os/corrections-drafts"   # verified: not under public/, client/ or functions/
HF_REPO = "csoai/corrections-watch"
HF_PREFIX = "drift-draft"
SCHEMA_SNAP = "csoai.drift-draft.snapshot/0.1"
SCHEMA_DIFF = "csoai.drift-draft.diff/0.1"
SCHEMA_DRAFT = "csoai.corrections/0.1"
PUBLISHER = "Council of AI (CSOAI Ltd, UK Companies House 16939677)"
UA = {"User-Agent": "Mozilla/5.0 (compatible; csoai-drift-draft/0.1; +https://councilof.ai/api/corrections)",
      "Accept": "application/json,*/*;q=0.8"}
TIMEOUT = 60
POP_IDS_FALLBACK = ["stablecoins", "swift", "xrpl", "x402-bazaar", "mcp-registry", "a2a", "ots-proofs", "layer0", "corrections", "claim-watch"]

# The forbidden DISPLAY classes from scripts/brand-gate.mjs (ids kept), plus the blanket certif* the
# spec asks for in drafts. Applied to every string a draft carries.
BANNED = [
    ("retracted_fault_tolerance", re.compile(r"\bbyzantine\b|\bBFT\b|fault[\s-]?toleran(?:t|ce)", re.I)),
    ("sovereign_brand", re.compile(r"\bsovereign\b", re.I)),
    ("internal_codenames", re.compile(r"\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b", re.I)),
    ("defoneos_codename", re.compile(r"(?<![A-Za-z0-9-])defoneos(?:-seal)?(?![A-Za-z0-9-])", re.I)),
    ("cert_overclaim", re.compile(r"\bCEASAI", re.I)),
    ("certif_any", re.compile(r"certif\w*", re.I)),
    ("internal_strategy_codename", re.compile(r"crown[\s-]?jewels?|goldmines|black swans|\bOWEM\b|\bSIGIL\b", re.I)),
    ("measured_index_sticker", re.compile(r"MEASURED-INDEX-v0\.1", re.I)),
    ("infra_leak", re.compile(r"localhost:\d+|os\.meok\.ai|oracle-micro", re.I)),
]
REDACTED = "[token redacted: brand-gate]"

# Typed-literal grammar. P_MEASURED is scripts/facts-gate.mjs MEASURED_RE ported verbatim.
P_BOARD = re.compile(r"\b(\d{1,3})\s*(?:axes|axis)\s*(?:·|,|-|—|/)\s*(\d{1,3})\s*measured\b", re.I)
P_MEASURED = re.compile(r"\b(\d{1,3})\s+(?:of\s+(\d{1,3})\s+)?(?:measured\s+(?:axes|axis|slots)|(?:axes|axis|slots)\s+measured)\b", re.I)
P_ALL_MEASURED = re.compile(r"\ball\s+(\d{1,3})\s+(?:axes|axis|slots)\s+(?:are|were|have\s+been)\s+measured\b", re.I)
P_TRIPLE = re.compile(r"\b(\d{1,2})·(\d{1,2})·(\d{1,2})\b")
P_SIGNED_CARDS = re.compile(r"\b(\d{2,4})\s+signed\s+(?:measurement\s+)?cards\b", re.I)
# A line in the past tense or marked as history is a record, not a current claim (facts-gate's
# negation/history exoneration, reduced to the markers that recur in this repo's prose).
HISTORY = re.compile(r"\b(?:was|were|until|superseded|historical|previously|prior|earlier|at the time|then|"
                     r"old|stale|dated|retract\w*|forbidden|wrong|no longer|before|pre-|used to|read|"
                     r"went|became|has since|since then|had|formerly|as of 2026-0[1-8]|20260[1-8]\d\d)\b|→|->|—>", re.I)
SKIP_PATH = re.compile(r"(^|/)(?:public/(?:interop|signed|cards|corrections|six-axes|proofs|claims|clan|evidence)|"
                       r"evidence|node_modules|dist|_alignment|_quarantine|archive|history|corrections|refut|retract|"
                       r"CHECKPOINT|BACKLOG|CHANGELOG|LEDGER|ADR-|\.test\.|fixtures|__tests__|counters\.json|canon\.json|facts\.json)", re.I)
TYPED_GLOBS = ["public/*.md", "public/**/*.md", "docs/**", "client/src/**"]
TYPED_EXT = re.compile(r"\.(?:md|mdx|txt|tsx?|jsx?|json|html?)$", re.I)
SKIP_BASENAME = re.compile(r"\.(?:test|spec)\.[a-z]+$|(^|/)__tests__/", re.I)
CODE_EXT = re.compile(r"\.(?:tsx?|jsx?|mjs)$", re.I)
CODE_COMMENT = re.compile(r"^\s*(?://|/\*|\*)")   # a comment in shipped code is not a reader-visible claim
MAX_TYPED_DRAFTS = 40


# ── small helpers ─────────────────────────────────────────────────────────────────────────────────
def utcnow():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def hour_key(ts=None):
    return (ts or dt.datetime.now(dt.timezone.utc)).strftime("%Y-%m-%dT%H")


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def jdump(o):
    return json.dumps(o, indent=1, sort_keys=True, ensure_ascii=False) + "\n"


def parse_iso(s):
    if not isinstance(s, str):
        return None
    m = re.match(r"^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?)?\s*(Z|[+-]\d{2}:?\d{2})?", s)
    if not m:
        return None
    d, hh, mm, ss, tz = m.groups()
    try:
        t = dt.datetime.fromisoformat(d + "T" + (hh or "00") + ":" + (mm or "00") + ":" + (ss or "00").split(".")[0])
    except ValueError:
        return None
    return t.replace(tzinfo=dt.timezone.utc)


def git(clone, *args, check=True):
    r = subprocess.run(["git", "-C", str(clone), *args], capture_output=True, text=True, timeout=600)
    if check and r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}: {r.stderr.strip()[:300]}")
    return r.stdout.strip()


def fetch(url):
    """One live read: status, sha256 of the served bytes, parsed JSON (or None), fetched_at. Never raises."""
    at = utcnow()
    if requests is None:
        return {"url": url, "status": None, "sha256": None, "json": None, "fetched_at": at, "error": "python requests missing"}
    try:
        r = requests.get(url, headers=UA, timeout=TIMEOUT)
        body = r.content
        js = None
        try:
            js = json.loads(body.decode("utf-8"))
        except Exception:
            js = None
        return {"url": url, "status": r.status_code, "sha256": sha256(body), "json": js, "fetched_at": at, "error": None}
    except Exception as e:
        return {"url": url, "status": None, "sha256": None, "json": None, "fetched_at": at, "error": f"{type(e).__name__}: {str(e)[:160]}"}


def redact(s):
    """Return (text, n_redactions). Applies the brand-gate classes to one string."""
    n = 0
    for _id, rx in BANNED:
        s, k = rx.subn(REDACTED, s)
        n += k
    return s, n


def redact_tree(o):
    """Redact every string in a JSON-able tree; returns (tree, count)."""
    total = 0
    if isinstance(o, str):
        s, n = redact(o)
        return s, n
    if isinstance(o, list):
        out = []
        for x in o:
            y, n = redact_tree(x); out.append(y); total += n
        return out, total
    if isinstance(o, dict):
        out = {}
        for k, v in o.items():
            y, n = redact_tree(v); out[k] = y; total += n
        return out, total
    return o, 0


def banned_hits(text):
    return [i for i, rx in BANNED if rx.search(text)]


# ── the repo clone (one per purpose; never the deploy checkout) ───────────────────────────────────
def ensure_clone(clone, bare):
    if not (clone / ".git").is_dir():
        clone.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "-q", str(bare), str(clone)], check=True, timeout=1800)
    git(clone, "fetch", "-q", "origin", "master")
    git(clone, "checkout", "-q", "--detach", "origin/master")
    return {"master": git(clone, "rev-parse", "origin/master"), "committed_at": git(clone, "log", "-1", "--format=%cI", "origin/master")}


def file_source(clone, rel, master):
    p = clone / rel
    b = p.read_bytes()
    return {"role": "typed", "locator": f"{rel} @ {master[:12]}", "path": rel, "commit": master, "sha256": sha256(b),
            "as_of": git(clone, "log", "-1", "--format=%cI", "origin/master", "--", rel) or None, "as_of_field": "last commit touching the file"}


def population_registry(clone):
    """ids and artifact paths, parsed from functions/api/_population.ts so the list follows the code."""
    p = clone / "functions/api/_population.ts"
    if not p.is_file():
        return POP_IDS_FALLBACK, [], "fallback: functions/api/_population.ts absent in the clone"
    t = p.read_text(encoding="utf-8")
    ids = re.findall(r'^\s*id:\s*"([a-z0-9-]+)",\s*$', t, re.M)
    paths = re.findall(r'^const [A-Z0-9_]+ = "(/[^"]+)";', t, re.M)
    paths += re.findall(r'^const [A-Z0-9_]+ = \["(/[^"]+)"', t, re.M)
    if not ids:
        return POP_IDS_FALLBACK, paths, "fallback: no id: lines matched in _population.ts"
    return ids, sorted(set(paths)), "functions/api/_population.ts"


# ── snapshot ──────────────────────────────────────────────────────────────────────────────────────
def take_snapshot(clone, repo, out_dir):
    hour = hour_key()
    snap = {"schema": SCHEMA_SNAP, "hour": hour, "taken_at": utcnow(), "host": HOST, "repo": repo,
            "surfaces": {}, "artifacts": {}, "typed": {}, "uncheckable": []}
    S = snap["surfaces"]

    g = fetch(f"{HOST}/api/gspc")
    row = {"url": g["url"], "status": g["status"], "sha256": g["sha256"], "fetched_at": g["fetched_at"]}
    if isinstance(g["json"], dict) and isinstance(g["json"].get("totals"), dict):
        t = g["json"]["totals"]
        row["totals"] = {k: t.get(k) for k in ["axes", "measured_axes", "unmeasured_axes", "quotable_axes", "public_count"]}
        row["as_of"] = (g["json"].get("measured_on") or {}).get("date")
        row["as_of_field"] = "measured_on.date (prose, not compared as a timestamp)"
        row["axes"] = [{"axis": a.get("axis"), "status": a.get("status"), "n": a.get("n"), "kind": a.get("kind")} for a in g["json"].get("axes", []) if isinstance(a, dict)]
    else:
        row["uncheckable"] = g["error"] or f"HTTP {g['status']} / not JSON"
        snap["uncheckable"].append(f"/api/gspc: {row['uncheckable']}")
    S["/api/gspc"] = row

    s = fetch(f"{HOST}/api/state")
    row = {"url": s["url"], "status": s["status"], "sha256": s["sha256"], "fetched_at": s["fetched_at"]}
    if isinstance(s["json"], dict):
        j = s["json"]
        def pick(*ks):
            o = j
            for k in ks:
                o = o.get(k) if isinstance(o, dict) else None
            if isinstance(o, dict) and "value" in o:
                return {"value": o.get("value"), "kind": o.get("kind"), "as_of": o.get("as_of"), "as_of_field": o.get("as_of_field")}
            return None
        row["corpora"] = {   # THREE corpora, kept apart; never summed
            "signed_card_index.count": pick("signed_cards", "count"),
            "card_chain.bodies_verified_valid": pick("card_chain", "bodies_verified_valid"),
            "public_root.card_count": pick("public_root", "card_count"),
        }
        row["public_count"] = (j.get("public_count") or {}).get("value")
        row["public_root_merkle_root"] = (pick("public_root", "merkle_root") or {}).get("value")
    else:
        row["uncheckable"] = s["error"] or f"HTTP {s['status']} / not JSON"
        snap["uncheckable"].append(f"/api/state: {row['uncheckable']}")
    S["/api/state"] = row

    c = fetch(f"{HOST}/api/corrections")
    row = {"url": c["url"], "status": c["status"], "sha256": c["sha256"], "fetched_at": c["fetched_at"]}
    if isinstance(c["json"], dict) and isinstance(c["json"].get("corrections"), list):
        ents = c["json"]["corrections"]
        row["n_entries"] = len(ents)
        row["ids"] = [e.get("id") for e in ents if isinstance(e, dict)]
        row["signature_state"] = c["json"].get("signature_state")
        dates = sorted(e.get("date") for e in ents if isinstance(e, dict) and isinstance(e.get("date"), str))
        row["as_of"] = dates[-1] if dates else None
        row["as_of_field"] = "max corrections[].date"
    else:
        row["uncheckable"] = c["error"] or f"HTTP {c['status']} / not JSON"
        snap["uncheckable"].append(f"/api/corrections: {row['uncheckable']}")
    S["/api/corrections"] = row

    pop_ids, art_paths, pop_src = population_registry(clone)
    snap["population_registry_source"] = pop_src
    for pid in pop_ids:
        p = fetch(f"{HOST}/api/pop/{pid}")
        row = {"url": p["url"], "status": p["status"], "sha256": p["sha256"], "fetched_at": p["fetched_at"]}
        j = p["json"] if isinstance(p["json"], dict) else {}
        if p["status"] == 200 and j:
            pv = j.get("preview") if isinstance(j.get("preview"), dict) else j
            row.update({"state": pv.get("state"), "n": pv.get("n"), "n_unit": pv.get("n_unit"), "as_of": pv.get("as_of"),
                        "source": pv.get("source"), "reason": pv.get("reason")})
        elif p["status"] == 404:
            row["state"] = "ABSENT_FROM_DEPLOY"
        elif p["status"] == 402:
            row["state"] = "PAYWALLED_NO_PREVIEW"
            row["as_of"] = ((j.get("accepts") or [{}])[0].get("as_of") if isinstance(j.get("accepts"), list) else None)
        else:
            row["state"] = "UNCHECKABLE"; row["uncheckable"] = p["error"] or f"HTTP {p['status']}"
            snap["uncheckable"].append(f"/api/pop/{pid}: {row['uncheckable']}")
        S[f"/api/pop/{pid}"] = row

    for ap in art_paths:
        rel = "public" + ap
        loc = {"path": rel, "exists": (clone / rel).is_file()}
        if loc["exists"]:
            b = (clone / rel).read_bytes(); loc["sha256"] = sha256(b)
            try:
                jj = json.loads(b.decode("utf-8")); loc["as_of"] = jj.get("as_of") if isinstance(jj, dict) else None
            except Exception:
                loc["as_of"] = None; loc["not_json"] = True
        live = fetch(f"{HOST}{ap}")
        lv = {"status": live["status"], "sha256": live["sha256"], "fetched_at": live["fetched_at"],
              "as_of": live["json"].get("as_of") if isinstance(live["json"], dict) else None}
        if live["error"]:
            lv["uncheckable"] = live["error"]
        snap["artifacts"][ap] = {"local": loc, "live": lv}

    # typed surfaces with named fields
    T = snap["typed"]
    fj = clone / "client/src/data/facts.json"
    if fj.is_file():
        try:
            obs = json.loads(fj.read_text(encoding="utf-8"))["counts"]["axis_count"]["observed"]
            T["client/src/data/facts.json#counts.axis_count.observed"] = {**file_source(clone, "client/src/data/facts.json", repo["master"]),
                "values": {k: obs.get(k) for k in ["value", "axes", "measured_axes", "unmeasured_axes", "quotable_axes"]}, "observed_at": obs.get("observed_at")}
        except Exception as e:
            snap["uncheckable"].append(f"facts.json observed block unreadable: {type(e).__name__}")
    cj = clone / "canon.json"
    if cj.is_file():
        try:
            api = json.loads(cj.read_text(encoding="utf-8"))["api"]
            T["canon.json#api"] = {**file_source(clone, "canon.json", repo["master"]),
                "values": {"axes": api.get("axes_total"), "measured_axes": api.get("measured_axes"), "unmeasured_axes": api.get("unmeasured_axes"),
                           "quotable_axes": api.get("quotable_axes"), "public_count": api.get("public_count_contains")}}
        except Exception as e:
            snap["uncheckable"].append(f"canon.json api block unreadable: {type(e).__name__}")
    for f in sorted((clone / "public/corrections").glob("*.json")) if (clone / "public/corrections").is_dir() else []:
        try:
            jj = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue
        rel = str(f.relative_to(clone))
        vals = {}
        if isinstance(jj.get("unmeasured_slots_unchanged"), list):
            vals["unmeasured_slots_unchanged"] = jj["unmeasured_slots_unchanged"]
        cards = [m.group(1) for m in re.finditer(r"\b(\d{2,4})\s+measurement\s+cards\b", json.dumps(jj.get("attestations_that_do_verify", "")))]
        if cards:
            vals["attestations_that_do_verify.measurement_cards"] = [int(x) for x in cards]
        if vals:
            T[rel] = {**file_source(clone, rel, repo["master"]), "values": vals}

    snap["typed_literals"] = scan_typed_literals(clone, repo["master"])
    return snap


def scan_typed_literals(clone, master):
    """Typed board/corpus literals in the named trees. Records hits only (comparison happens in detect)."""
    files = git(clone, "ls-files", "-z", "--", *TYPED_GLOBS).split("\0")
    hits = {}; ambiguous = []
    for rel in files:
        if not rel or not TYPED_EXT.search(rel) or SKIP_PATH.search(rel) or SKIP_BASENAME.search(rel):
            continue
        is_code = bool(CODE_EXT.search(rel))
        p = clone / rel
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        if len(text) > 2_000_000:
            continue
        fh = []
        for ln, line in enumerate(text.splitlines(), 1):
            if HISTORY.search(line) or (is_code and CODE_COMMENT.match(line)):
                continue
            for m in P_BOARD.finditer(line):
                fh.append({"line": ln, "grammar": "board", "axes": int(m.group(1)), "measured_axes": int(m.group(2)), "text": line.strip()[:200]})
            for m in P_TRIPLE.finditer(line):
                fh.append({"line": ln, "grammar": "triple", "axes": int(m.group(1)), "measured_axes": int(m.group(2)), "unmeasured_axes": int(m.group(3)), "text": line.strip()[:200]})
            for m in P_MEASURED.finditer(line):
                fh.append({"line": ln, "grammar": "measured", "measured_axes": int(m.group(1)), "axes": int(m.group(2)) if m.group(2) else None, "text": line.strip()[:200]})
            for m in P_ALL_MEASURED.finditer(line):
                fh.append({"line": ln, "grammar": "all-measured", "measured_axes": int(m.group(1)), "text": line.strip()[:200]})
            # "N signed cards" names ONE of three corpora without saying which (CARD-CORPORA.md); it is
            # recorded as an ambiguous phrase and never compared against a corpus it may not mean.
            for m in P_SIGNED_CARDS.finditer(line):
                ambiguous.append({"file": rel, "line": ln, "signed_cards": int(m.group(1)), "text": line.strip()[:160]})
        if fh:
            hits[rel] = {"sha256": sha256(p.read_bytes()), "hits": fh}
    return {"scanned_globs": TYPED_GLOBS, "files_with_hits": len(hits), "files": hits, "commit": master,
            "ambiguous_corpus_phrases": ambiguous, "ambiguous_note": "'N signed cards' does not say which of the three corpora it means; not compared, not drafted"}


# ── diff ──────────────────────────────────────────────────────────────────────────────────────────
def src_live(snap, key):
    r = snap["surfaces"].get(key) or {}
    return {"role": "measured", "locator": r.get("url", HOST + key), "sha256": r.get("sha256"), "as_of": r.get("as_of") or r.get("fetched_at"),
            "as_of_field": r.get("as_of_field") or ("payload as_of" if r.get("as_of") else "fetched_at (payload carries no as_of)"), "http_status": r.get("status")}


def src_prev(prev, prev_path):
    return {"role": "previous_snapshot", "locator": str(prev_path), "sha256": prev.get("_file_sha256"), "as_of": prev.get("taken_at"), "as_of_field": "taken_at", "hour": prev.get("hour")}


def src_typed(entry, field=None):
    return {"role": "typed", "locator": entry["locator"] + (f"#{field}" if field else ""), "path": entry.get("path"), "commit": entry.get("commit"),
            "sha256": entry["sha256"], "as_of": entry.get("as_of"), "as_of_field": entry.get("as_of_field")}


def drift(kind, subject, field, was, now, a, b, severity="draft", summary=None, extra=None):
    fp = sha256(json.dumps([kind, subject, field, was, now], sort_keys=True, default=str).encode())[:16]
    d = {"kind": kind, "subject": subject, "field": field, "was": was, "now": now, "sources": [a, b], "severity": severity,
         "fingerprint": fp, "summary": summary or f"{subject}: {field} {was!r} -> {now!r}"}
    if extra:
        d.update(extra)
    return d


def detect(prev, snap, prev_path=None):
    """All drifts + signals between prev (may be None) and snap, plus typed-vs-live on snap alone."""
    out = []
    S = snap["surfaces"]
    g = S.get("/api/gspc", {}); st = S.get("/api/state", {})
    live_tot = g.get("totals"); live_corp = st.get("corpora") or {}
    live_axes = {a["axis"]: a for a in g.get("axes", [])} if g.get("axes") else {}
    A_g = src_live(snap, "/api/gspc"); A_s = src_live(snap, "/api/state")

    # 1. snapshot-vs-previous
    if prev:
        P = prev["surfaces"]; B = src_prev(prev, prev_path)
        pg = P.get("/api/gspc", {})
        if live_tot and pg.get("totals"):
            for k, v in live_tot.items():
                if pg["totals"].get(k) != v:
                    out.append(drift("board_totals_changed", "/api/gspc", f"totals.{k}", pg["totals"].get(k), v, B, A_g))
            pax = {a["axis"]: a for a in pg.get("axes", [])}
            for name, a in live_axes.items():
                p = pax.get(name)
                if p is None:
                    out.append(drift("axis_status_changed", "/api/gspc", f"axes[{name}]", None, a.get("status"), B, A_g, summary=f"axis {name} appeared with status {a.get('status')}"))
                    continue
                if p.get("status") != a.get("status"):
                    out.append(drift("axis_status_changed", "/api/gspc", f"axes[{name}].status", p.get("status"), a.get("status"), B, A_g))
                elif p.get("n") != a.get("n"):
                    out.append(drift("axis_n_moved", "/api/gspc", f"axes[{name}].n", p.get("n"), a.get("n"), B, A_g, severity="signal"))
            for name in set(pax) - set(live_axes):
                out.append(drift("axis_status_changed", "/api/gspc", f"axes[{name}]", pax[name].get("status"), None, B, A_g, summary=f"axis {name} disappeared from the board"))
        pc = P.get("/api/state", {}).get("corpora") or {}
        for k, v in live_corp.items():
            if v and pc.get(k) and pc[k].get("value") != v.get("value"):
                out.append(drift("corpus_count_changed", "/api/state", f"{k}.value", pc[k]["value"], v["value"], B, A_s,
                                 extra={"corpus_note": "one of three separate card corpora; never add it to the other two"}))
        for key, row in S.items():
            if not key.startswith("/api/pop/"):
                continue
            prow = P.get(key)
            if not prow:
                continue
            A = src_live(snap, key)
            if prow.get("status") != row.get("status"):
                out.append(drift("door_http_changed", key, "http_status", prow.get("status"), row.get("status"), B, A, severity="signal"))
            for f in ["state", "n"]:
                if prow.get(f) != row.get(f) and not (prow.get("status") != row.get("status") and (prow.get(f) is None or row.get(f) is None)):
                    out.append(drift("door_flipped", key, f, prow.get(f), row.get(f), B, A))
        # as_of regressions on every surface + artifact that carries one
        for key, row in S.items():
            prow = P.get(key) or {}
            a0, a1 = parse_iso(prow.get("as_of")), parse_iso(row.get("as_of"))
            if a0 and a1 and a1 < a0:
                out.append(drift("as_of_regressed", key, "as_of", prow.get("as_of"), row.get("as_of"), B, src_live(snap, key)))
        for k, v in live_corp.items():
            a0 = parse_iso((pc.get(k) or {}).get("as_of")); a1 = parse_iso((v or {}).get("as_of"))
            if a0 and a1 and a1 < a0:
                out.append(drift("as_of_regressed", "/api/state", f"{k}.as_of", pc[k]["as_of"], v["as_of"], B, A_s))
        pa = prev.get("artifacts", {})
        for ap, row in snap.get("artifacts", {}).items():
            p = pa.get(ap)
            if not p:
                continue
            loc, ploc = row["local"], p["local"]
            A_loc = {"role": "typed", "locator": f"{loc['path']} @ {snap['repo']['master'][:12]}", "path": loc["path"], "commit": snap["repo"]["master"], "sha256": loc.get("sha256"),
                     "as_of": loc.get("as_of"), "as_of_field": "artifact as_of" if loc.get("as_of") else "last commit touching the file"}
            if loc.get("sha256") and ploc.get("sha256") and loc["sha256"] != ploc["sha256"]:
                if loc.get("as_of") == ploc.get("as_of"):
                    out.append(drift("artifact_silent_edit", loc["path"], "sha256 (as_of unchanged)", ploc["sha256"], loc["sha256"], B, A_loc,
                                     summary=f"{loc['path']} bytes changed while as_of stayed {loc.get('as_of')!r}: a signed/dated artifact must be superseded, never edited"))
                else:
                    out.append(drift("artifact_bytes_changed", loc["path"], "sha256", ploc["sha256"], loc["sha256"], B, A_loc, severity="signal"))
            a0, a1 = parse_iso(ploc.get("as_of")), parse_iso(loc.get("as_of"))
            if a0 and a1 and a1 < a0:
                out.append(drift("as_of_regressed", loc["path"], "as_of", ploc.get("as_of"), loc.get("as_of"), B, A_loc))
            a0, a1 = parse_iso(p["live"].get("as_of")), parse_iso(row["live"].get("as_of"))
            if a0 and a1 and a1 < a0:
                out.append(drift("as_of_regressed", ap, "served as_of", p["live"].get("as_of"), row["live"].get("as_of"), B,
                                 {"role": "measured", "locator": HOST + ap, "sha256": row["live"].get("sha256"), "as_of": row["live"].get("as_of"), "as_of_field": "artifact as_of"}))
        pcor, cor = P.get("/api/corrections", {}), S.get("/api/corrections", {})
        if pcor.get("n_entries") is not None and cor.get("n_entries") is not None and pcor["n_entries"] != cor["n_entries"]:
            out.append(drift("ledger_changed", "/api/corrections", "n_entries", pcor["n_entries"], cor["n_entries"], B, src_live(snap, "/api/corrections"), severity="signal"))

    # 2. typed-vs-live on this snapshot alone
    if live_tot:
        for name, entry in snap.get("typed", {}).items():
            vals = entry.get("values") or {}
            if name.endswith("#counts.axis_count.observed") or name.endswith("#api"):
                for k in ["axes", "measured_axes", "unmeasured_axes", "quotable_axes"]:
                    if vals.get(k) is not None and live_tot.get(k) is not None and vals[k] != live_tot[k]:
                        out.append(drift("typed_claim_disagrees", name, k, vals[k], live_tot[k], src_typed(entry, k), A_g))
                if vals.get("public_count") and live_tot.get("public_count") and vals["public_count"] not in live_tot["public_count"]:
                    out.append(drift("typed_claim_disagrees", name, "public_count", vals["public_count"], live_tot["public_count"], src_typed(entry, "public_count"), A_g))
            if "unmeasured_slots_unchanged" in vals and live_axes:
                now_un = sorted(a for a, r in live_axes.items() if r.get("status") == "UNMEASURED")
                claimed = sorted(vals["unmeasured_slots_unchanged"])
                still = [s for s in claimed if s in now_un]
                if still != claimed:
                    out.append(drift("typed_claim_disagrees", name, "unmeasured_slots_unchanged", claimed, now_un, src_typed(entry, "unmeasured_slots_unchanged"), A_g,
                                     summary=f"{name} lists {len(claimed)} slots as UNMEASURED; the live board carries {len(now_un)} UNMEASURED axes"))
            if "attestations_that_do_verify.measurement_cards" in vals:
                lv = (live_corp.get("card_chain.bodies_verified_valid") or {}).get("value")
                for n in vals["attestations_that_do_verify.measurement_cards"]:
                    if lv is not None and n != lv:
                        out.append(drift("typed_claim_disagrees", name, "attestations_that_do_verify (measurement cards)", n, lv, src_typed(entry, "attestations_that_do_verify"), A_s,
                                         extra={"corpus": "card_chain.bodies_verified_valid (corpus 3 of 3, kind measured)"}))
        # typed literals: one drift per shipped file (public/, client/src/); docs/** collapsed into ONE draft
        tl = snap.get("typed_literals", {}).get("files", {})
        docs_group = []
        for rel, info in sorted(tl.items()):
            bad = []
            for h in info["hits"]:
                m = h.get("measured_axes"); ax = h.get("axes"); un = h.get("unmeasured_axes")
                wrong = (m is not None and live_tot.get("measured_axes") is not None and m != live_tot["measured_axes"]) or \
                        (ax is not None and live_tot.get("axes") is not None and ax != live_tot["axes"]) or \
                        (un is not None and live_tot.get("unmeasured_axes") is not None and un != live_tot["unmeasured_axes"])
                if wrong:
                    bad.append(h)
            if not bad:
                continue
            was = sorted({json.dumps({k: v for k, v in h.items() if k in ("axes", "measured_axes", "unmeasured_axes")}, sort_keys=True) for h in bad})
            now = {k: live_tot.get(k) for k in ["axes", "measured_axes", "unmeasured_axes"]}
            if rel.startswith("docs/"):
                docs_group.append({"file": rel, "sha256": info["sha256"], "lines": [h["line"] for h in bad][:12], "was": was, "first": bad[0]["text"]})
                continue
            entry = {"locator": f"{rel} @ {snap['repo']['master'][:12]}", "path": rel, "commit": snap["repo"]["master"], "sha256": info["sha256"], "as_of": None, "as_of_field": "last commit touching the file"}
            out.append(drift("typed_claim_disagrees", rel, "typed literal(s) line " + ",".join(str(h["line"]) for h in bad[:12]), was, now, src_typed(entry), A_g,
                             extra={"lines": bad[:12], "n_lines": len(bad)}, summary=f"{rel}: {len(bad)} typed literal(s) disagree with the live board"))
        if docs_group:
            now = {k: live_tot.get(k) for k in ["axes", "measured_axes", "unmeasured_axes"]}
            was = sorted({w for g in docs_group for w in g["was"]})
            tree_sha = sha256("".join(g["file"] + g["sha256"] for g in docs_group).encode())
            entry = {"locator": f"docs/** ({len(docs_group)} files) @ {snap['repo']['master'][:12]}", "path": None, "commit": snap["repo"]["master"], "sha256": tree_sha,
                     "as_of": snap["repo"]["committed_at"], "as_of_field": "origin/master commit date; sha256 = sha256 over (path+file sha256) of the listed files"}
            lines = [{"line": g["lines"][0], "grammar": "docs", "text": f"{g['file']}:{','.join(map(str, g['lines']))} {g['first'][:110]}"} for g in docs_group]
            out.append(drift("typed_claim_disagrees", f"docs/** ({len(docs_group)} files)", "typed board literals in internal docs", was, now, src_typed(entry), A_g,
                             extra={"lines": lines[:12], "n_lines": len(docs_group), "files": [g["file"] for g in docs_group]},
                             summary=f"docs/**: {len(docs_group)} internal documents carry typed board literals that disagree with the live board (one grouped draft; docs are not served)"))
    # shipped surfaces first, docs last; snapshot-vs-previous drifts keep their place before typed ones
    rank = lambda d: (0 if d["kind"] != "typed_claim_disagrees" else 1 if "#" in d["subject"] or d["subject"].startswith("public/corrections/") else 2 if d["subject"].startswith("public/") else 3 if d["subject"].startswith("client/") else 4)
    out.sort(key=rank)
    return out


# ── drafts ────────────────────────────────────────────────────────────────────────────────────────
WHY = {
    "typed_claim_disagrees": "A number typed on a static surface. The endpoint derives its count from the axis array (or the card index) at request time, so a typed copy goes stale the moment the measured surface moves. This loop records the disagreement; it does not establish why the copy was typed.",
    "board_totals_changed": "The board moved between two hourly snapshots. Every surface that quotes the previous sentence is now stale until it is superseded or re-derived from GET /api/gspc.",
    "axis_status_changed": "An axis row changed status between two hourly snapshots. Anything that names the previous status is a stale claim about the board.",
    "corpus_count_changed": "One of the three card corpora changed size between snapshots. Each corpus is quoted on its own; a surface that quotes the previous size of this corpus is stale.",
    "door_flipped": "A population door's preview changed between snapshots. A door reads its artifact at request time, so the change is in the artifact or in the reader; whichever it is, a surface that quotes the previous value is stale.",
    "as_of_regressed": "An as_of moved backwards. Either an older artifact was deployed over a newer one, or a dated field was edited; both are the class of defect the estate publishes rather than hides.",
    "artifact_silent_edit": "The artifact's bytes changed while its as_of did not. Dated and signed artifacts are superseded beside the original, never edited in place; an in-place edit breaks any signature or proof over the earlier bytes.",
}


def render_draft(d, snap, prev, hour, seq, clone=None):
    did = f"D-{hour}-{seq:02d}"
    a, b = d["sources"]
    for s_ in (a, b):   # a typed source always cites a date: the last commit touching the file when the bytes carry none
        if s_.get("role") == "typed" and s_.get("as_of") is None and clone is not None and s_.get("path"):
            try:
                s_["as_of"] = git(clone, "log", "-1", "--format=%cI", "origin/master", "--", s_["path"]) or None
            except Exception:
                pass
    def cite(s):
        return f"{s['locator']} (sha256 {s.get('sha256') or 'UNCHECKABLE'}; as_of {s.get('as_of') or 'none'}{' = ' + s['as_of_field'] if s.get('as_of_field') else ''})"
    public = d["subject"].startswith("/") or d["subject"].startswith("public/") or d["subject"].startswith("client/src/")
    what_wrong = (f"{d['subject']} reads {d['field']} = {json.dumps(d['was'], ensure_ascii=False, default=str)} while the compared surface reads "
                  f"{json.dumps(d['now'], ensure_ascii=False, default=str)}. Source A: {cite(a)}. Source B: {cite(b)}. Compared at {snap['taken_at']} (snapshot {hour}).")
    if d.get("lines"):
        what_wrong += " Lines: " + " | ".join(f"L{h['line']}: {h['text']}" for h in d["lines"][:6])
    entry = {
        "id": did,
        "date": snap["taken_at"][:10],
        "first_observed_at": snap["taken_at"],
        "what_was_wrong": what_wrong,
        "why_it_was_wrong": WHY.get(d["kind"], "Recorded disagreement between two byte-sources; cause not established by this loop."),
        "what_changed": ("PROPOSED, nothing has changed yet: supersede the stale surface with one that derives the value from the measured surface "
                         f"(or a dated note beside it naming the value at {snap['taken_at']}); never edit signed or dated bytes in place. "
                         "The owner decides the remedy on promotion; this draft records the disagreement only."),
        "reached_the_public": bool(public),
        "note": (f"DRAFT - owner approval required. Auto-drafted by drift-draft.py on the pod; kind {d['kind']}; fingerprint {d['fingerprint']}; "
                 f"snapshot {hour} sha256 {snap.get('_file_sha256') or 'written after this draft'}"
                 + (f" vs previous snapshot {prev['hour']} sha256 {prev.get('_file_sha256')}" if prev else " (no previous snapshot)")
                 + ". No ledger id is assigned until promote-draft.sh runs. Nothing here is a grade or a mark; it is a recorded disagreement between two byte-sources."),
        "evidence": [a["locator"], b["locator"], f"{HF_PREFIX}/snapshots/{hour}.json"],
    }
    draft = {"schema": SCHEMA_DRAFT, "DRAFT": True, "status": "DRAFT - owner approval required", "draft_id": did,
             "not_published": "never merged or published by drift-draft; promote-draft.sh <id> is the owner's approve step",
             "publisher": PUBLISHER, "license": "CC-BY-4.0", "generated_at": utcnow(), "generator": "drift-draft.py (pod, hourly :40)",
             "drift": {k: d[k] for k in ["kind", "subject", "field", "was", "now", "sources", "severity", "fingerprint", "summary"]},
             "corrections": [entry]}
    if d.get("lines"):
        draft["drift"]["lines"] = d["lines"]; draft["drift"]["n_lines"] = d.get("n_lines")
    draft, n_red = redact_tree(draft)
    draft["brand_gate_redactions"] = n_red
    md = [f"# DRAFT correction {did}: {redact(d['summary'])[0]}", "",
          f"**Status: DRAFT - owner approval required.** Generated {draft['generated_at']} by drift-draft.py on the pod. Not published, not merged, no ledger id.",
          "", f"Kind: `{d['kind']}` - fingerprint `{d['fingerprint']}`", "",
          "## The two byte-sources compared", "",
          f"- **A** ({a.get('role')}): `{a['locator']}`  ", f"  sha256 `{a.get('sha256') or 'UNCHECKABLE'}` - as_of `{a.get('as_of') or 'none'}` ({a.get('as_of_field') or ''})",
          f"- **B** ({b.get('role')}): `{b['locator']}`  ", f"  sha256 `{b.get('sha256') or 'UNCHECKABLE'}` - as_of `{b.get('as_of') or 'none'}` ({b.get('as_of_field') or ''})", "",
          "## The field that moved", "", f"`{d['field']}`", "", "```", f"A: {json.dumps(d['was'], ensure_ascii=False, indent=1, default=str)}", f"B: {json.dumps(d['now'], ensure_ascii=False, indent=1, default=str)}", "```", ""]
    if d.get("lines"):
        md += ["## Lines", ""] + [f"- L{h['line']}: `{redact(h['text'])[0]}`" for h in d["lines"][:12]] + [""]
    md += ["## Why it matters", "", entry["why_it_was_wrong"], "", "## Proposed remedy (owner decides)", "", entry["what_changed"], "",
           "## Reproduce", "", "```bash"]
    for s in (a, b):
        if s["locator"].startswith("http"):
            md.append(f"curl -sS '{s['locator']}' | sha256sum   # expect {s.get('sha256')}")
        elif s.get("path"):
            md.append(f"git show {(s.get('commit') or 'origin/master')[:12]}:{s['path']} | sha256sum   # expect {s.get('sha256')}")
        else:
            md.append(f"sha256sum '{s['locator']}'   # expect {s.get('sha256')}")
    md += ["```", "", "Measurement, not a mark of conformity. UNMEASURED and UNCHECKABLE stay first-class; nothing here is a grade.", ""]
    md_text, n2 = redact("\n".join(md))
    draft["brand_gate_redactions"] += n2
    return did, draft, md_text


# ── branch + upload ───────────────────────────────────────────────────────────────────────────────
HF_README = """---
license: cc-by-4.0
pretty_name: CSOAI corrections-watch (drift-draft mirror)
---
# corrections-watch: drift-draft mirror

Hourly snapshots of the live councilof.ai measured surfaces (GET /api/gspc, /api/state, /api/pop/*), the diff
against the previous hour, and the DRAFT corrections the pod's drift-draft loop queued for owner approval.
`drift-draft/queue/*` are DRAFTS: never published, never merged, no ledger id. The published ledger is
https://councilof.ai/api/corrections. Measurement, not a mark of conformity. Council of AI (CSOAI Ltd).
"""

README = """# corrections-drafts (owner approve-queue)

Auto-drafted corrections from the hourly `drift-draft` loop on the pod. **Every file here is a DRAFT:**
not a ledger entry, not published, no ledger id. The deploy does not ship this directory (it is outside
`public/`, `client/` and `functions/`; the Vite build's publicDir is `../public`).

Approve one: `bash /workspace/lanes/loops/promote-draft.sh <draft-id>` on the pod, then merge the
`corrections/<draft-id>` branch it pushes. Reject one: delete the pair on a branch, or leave it.

Each draft cites the two byte-sources it compared (locator + sha256 + as_of) and the exact field that moved.
Nothing in a draft is typed from memory. Measurement, not a mark of conformity.
"""


def push_branch(clone, hour, new_files, master):
    if not new_files:
        return "-", "-"
    for part in ("public/", "client/", "functions/"):
        assert not DRAFT_DIR_IN_REPO.startswith(part), "draft dir would ship"
    branch = f"corrections/draft-{hour}"
    git(clone, "checkout", "-q", "-B", branch, "origin/master")
    dst = clone / DRAFT_DIR_IN_REPO
    dst.mkdir(parents=True, exist_ok=True)
    if not (dst / "README.md").is_file():
        (dst / "README.md").write_text(README, encoding="utf-8")
    for f in new_files:
        shutil.copy2(f, dst / f.name)
    git(clone, "add", DRAFT_DIR_IN_REPO)
    if not git(clone, "status", "--porcelain", "--", DRAFT_DIR_IN_REPO):
        return branch, "NOTHING_TO_COMMIT"
    ids = sorted({f.stem for f in new_files})
    subprocess.run(["git", "-C", str(clone), "-c", "user.name=CSOAI", "-c", "user.email=nicholas@csoai.org", "commit", "-q", "-m",
                    f"corrections drafts {hour}: {len(ids)} draft(s) for owner approval ({', '.join(ids[:6])}{'...' if len(ids) > 6 else ''}); never auto-published"],
                   check=True, capture_output=True, text=True, timeout=120)
    r = subprocess.run(["git", "-C", str(clone), "push", "-q", "origin", branch], capture_output=True, text=True, timeout=300)
    commit = git(clone, "rev-parse", "--short", "HEAD")
    git(clone, "checkout", "-q", "--detach", "origin/master")
    return branch, (commit if r.returncode == 0 else f"PUSH_FAILED:{r.stderr.strip()[:80]}")


def hf_upload(files_with_paths):
    """[(local_path, path_in_repo)] -> summary string via hf_upload.py (queues when no token)."""
    res = {"UPLOADED": 0, "UNCHECKABLE": 0, "FAILED": 0}
    for local, pir in files_with_paths:
        r = subprocess.run([sys.executable, str(LOOPS / "hf_upload.py"), "--repo", HF_REPO, "--file", str(local), "--path-in-repo", pir,
                            "--create", "--private", "--readme-if-absent", str(LANES / "out" / "drift-draft" / "HF-README.md")],
                           capture_output=True, text=True, timeout=600)
        first = (r.stdout.strip().splitlines() or [""])[0]
        key = "UPLOADED" if first.startswith("UPLOADED") else ("UNCHECKABLE" if first.startswith("UNCHECKABLE") else "FAILED")
        res[key] += 1
        print(f"HF {first[:200] or r.stderr.strip()[:200]}")
    return "hf=" + ",".join(f"{k}:{v}" for k, v in res.items() if v)


# ── promote (owner path; invoked by promote-draft.sh only) ────────────────────────────────────────
def promote(did, clone, out):
    q = out / "queue"
    jf, mf = q / f"{did}.json", q / f"{did}.md"
    if not jf.is_file():
        print(f"ABORT no draft {jf}"); return 2
    draft = json.loads(jf.read_text(encoding="utf-8"))
    entry = draft["corrections"][0]
    ledger = clone / "functions/api/corrections.ts"
    t = ledger.read_text(encoding="utf-8")
    today = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m%d")
    nums = [int(m) for m in re.findall(rf'id:\s*"C-{today}-(\d{{2}})"', t)]
    real = f"C-{today}-{(max(nums) + 1) if nums else 1:02d}"
    entry = {**entry, "id": real}
    entry["note"] = entry["note"].replace("DRAFT - owner approval required. ", f"Promoted from draft {did} by the owner. ")
    entry["what_changed"] = entry["what_changed"].replace("PROPOSED, nothing has changed yet: ", "")
    subject = draft["drift"]["subject"]
    slug = re.sub(r"[^a-z0-9]+", "-", subject.lower()).strip("-")[:60] or "drift"
    supersedes = subject.startswith("public/corrections/")
    note_name = f"{slug}-{entry['date']}{'-SUPERSEDES' if supersedes else ''}.md"
    m = re.search(r"^(\s*)corrections:\s*\[\s*$", t, re.M)
    if not m:
        print("ABORT could not find `corrections: [` in functions/api/corrections.ts"); return 2
    ind = m.group(1) + "  "
    block = json.dumps(entry, indent=2, ensure_ascii=False)
    block = "\n".join(ind + l for l in block.splitlines()) + ","
    t = t[:m.end()] + "\n" + block + t[m.end():]
    ledger.write_text(t, encoding="utf-8")
    md = mf.read_text(encoding="utf-8") if mf.is_file() else f"# Correction {real}\n"
    md = md.replace(f"# DRAFT correction {did}:", f"# Correction {real}:").replace("**Status: DRAFT - owner approval required.**", f"**Register id {real}. Promoted from draft {did}.**")
    notes = clone / "public/corrections"; notes.mkdir(parents=True, exist_ok=True)
    (notes / note_name).write_text(md, encoding="utf-8")
    if supersedes:
        sup = notes / "SUPERSESSIONS.md"
        orig = subject.split("/")[-1]
        row = f"| `{orig}` | `{note_name}` | {real} | {redact(draft['drift']['summary'])[0]} |\n"
        sup.write_text((sup.read_text(encoding="utf-8").rstrip("\n") + "\n" + row) if sup.is_file() else row, encoding="utf-8")
    prom = clone / DRAFT_DIR_IN_REPO / "promoted"; prom.mkdir(parents=True, exist_ok=True)
    for f in (jf, mf):
        if f.is_file():
            shutil.copy2(f, prom / f.name)
            src_in_repo = clone / DRAFT_DIR_IN_REPO / f.name
            if src_in_repo.is_file():
                src_in_repo.unlink()
    qp = q / "promoted"; qp.mkdir(exist_ok=True)
    for f in (jf, mf):
        if f.is_file():
            shutil.move(str(f), qp / f.name)
    idx = q / "index.json"
    if idx.is_file():
        ix = json.loads(idx.read_text()); fp = draft["drift"]["fingerprint"]
        if fp in ix:
            ix[fp]["status"] = "promoted"; ix[fp]["ledger_id"] = real
        idx.write_text(jdump(ix))
    print(f"PROMOTED {did} -> {real}; note public/corrections/{note_name}; ledger entry inserted at the top of LEDGER.corrections; "
          f"{'SUPERSESSIONS.md row added; ' if supersedes else ''}GET /api/corrections will serve signature_state STALE until the owner re-issues the ledger signature")
    return 0


# ── selftest ──────────────────────────────────────────────────────────────────────────────────────
def synthetic_snapshot():
    return {"schema": SCHEMA_SNAP, "hour": "2026-01-01T00", "taken_at": "2026-01-01T00:40:00Z", "host": HOST,
            "repo": {"master": "0" * 40, "committed_at": "2026-01-01T00:00:00+00:00"},
            "surfaces": {
                "/api/gspc": {"url": HOST + "/api/gspc", "status": 200, "sha256": "a" * 64, "fetched_at": "2026-01-01T00:40:00Z", "as_of": "synthetic",
                              "totals": {"axes": 23, "measured_axes": 23, "unmeasured_axes": 0, "quotable_axes": 23, "public_count": "23 axis · 23 measured"},
                              "axes": [{"axis": "jail", "status": "MEASURED", "n": 71, "kind": "model-comparison"}, {"axis": "effect-binding", "status": "MEASURED", "n": 261, "kind": "deterministic-facts"}]},
                "/api/state": {"url": HOST + "/api/state", "status": 200, "sha256": "b" * 64, "fetched_at": "2026-01-01T00:40:00Z",
                               "corpora": {"signed_card_index.count": {"value": 335, "kind": "catalogued", "as_of": "2026-08-19T09:24:39+00:00"},
                                           "card_chain.bodies_verified_valid": {"value": 335, "kind": "measured", "as_of": "2026-08-19T09:24:39+00:00"},
                                           "public_root.card_count": {"value": 305, "kind": "catalogued", "as_of": "2026-09-22T08:54:02Z"}}},
                "/api/corrections": {"url": HOST + "/api/corrections", "status": 200, "sha256": "c" * 64, "fetched_at": "2026-01-01T00:40:00Z", "n_entries": 59, "as_of": "2026-09-22"},
                "/api/pop/stablecoins": {"url": HOST + "/api/pop/stablecoins", "status": 200, "sha256": "d" * 64, "fetched_at": "2026-01-01T00:40:00Z", "state": "INDEXED", "n": 427, "as_of": "2026-09-16T00:00:00Z"},
            },
            "artifacts": {"/interop/swift-census.json": {"local": {"path": "public/interop/swift-census.json", "exists": True, "sha256": "e" * 64, "as_of": "2026-09-16T00:00:00Z"},
                                                          "live": {"status": 200, "sha256": "e" * 64, "as_of": "2026-09-16T00:00:00Z", "fetched_at": "2026-01-01T00:40:00Z"}}},
            "typed": {}, "typed_literals": {"files": {}}, "uncheckable": []}


def selftest(out, real_latest=None):
    ts = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    sd = out / "selftest" / ts; sd.mkdir(parents=True, exist_ok=True)
    base = copy.deepcopy(real_latest) if real_latest else synthetic_snapshot()
    base_src = "copy of the latest real snapshot" if real_latest else "embedded synthetic snapshot"
    base.setdefault("_file_sha256", sha256(jdump(base).encode()))
    ok = True
    def check(cond, msg):
        nonlocal ok
        print(("PASS " if cond else "FAIL ") + msg); ok = ok and cond
    # control 1: identical snapshots => no snapshot-vs-previous drift, and the typed set is byte-identical
    # (typed disagreements are a property of ONE snapshot; the real run dedupes them by fingerprint, so an
    # identical typed set means 0 NEW drafts — the "no new drift" receipt)
    same = copy.deepcopy(base); same["hour"] = "9999-12-31T23"
    d0 = [d for d in detect(base, same, sd / "prev.json") if d["severity"] == "draft" and d["kind"] != "typed_claim_disagrees"]
    check(len(d0) == 0, f"control: identical snapshots produce 0 snapshot-vs-previous drafts (got {len(d0)}) [base = {base_src}]")
    fp_base = sorted(d["fingerprint"] for d in detect(None, base) if d["kind"] == "typed_claim_disagrees")
    fp_same = sorted(d["fingerprint"] for d in detect(None, same) if d["kind"] == "typed_claim_disagrees")
    check(fp_base == fp_same, f"control: typed disagreements carry identical fingerprints on identical snapshots ({len(fp_base)} open, 0 new)")
    clone = CLONE_DEFAULT if (CLONE_DEFAULT / ".git").is_dir() else None
    # planted drift in a COPY of the snapshot
    mut = copy.deepcopy(base); mut["hour"] = "9999-12-31T23"; mut["taken_at"] = "9999-12-31T23:40:00Z"
    g = mut["surfaces"]["/api/gspc"]; g["sha256"] = "f" * 64
    g["totals"]["measured_axes"] = g["totals"]["measured_axes"] - 1; g["totals"]["unmeasured_axes"] = (g["totals"].get("unmeasured_axes") or 0) + 1
    if g.get("axes"):
        g["axes"][0]["status"] = "UNMEASURED"
    door = next((k for k in mut["surfaces"] if k.startswith("/api/pop/") and mut["surfaces"][k].get("n") is not None), None)
    if door:
        mut["surfaces"][door]["n"] = mut["surfaces"][door]["n"] + 1; mut["surfaces"][door]["sha256"] = "9" * 64
    corp = mut["surfaces"]["/api/state"].get("corpora", {}).get("public_root.card_count")
    if corp and corp.get("as_of"):
        corp["as_of"] = "2020-01-01T00:00:00Z"
    ap = next(iter(mut.get("artifacts", {})), None)
    if ap and mut["artifacts"][ap]["local"].get("sha256"):
        mut["artifacts"][ap]["local"]["sha256"] = "1" * 64   # bytes moved, as_of unchanged => silent edit
    # planted banned token in a subject (must be redacted in the draft)
    tokens = "sov3-planted BFT sov33-x"
    (sd / "prev.json").write_text(jdump(base)); (sd / "mutated.json").write_text(jdump(mut))
    drifts = detect(base, mut, sd / "prev.json")
    drafts = [d for d in drifts if d["severity"] == "draft"]
    kinds = sorted({d["kind"] for d in drafts})
    check(any(d["kind"] == "board_totals_changed" for d in drafts), f"planted totals change detected (kinds: {kinds})")
    check(any(d["kind"] == "axis_status_changed" for d in drafts) or not g.get("axes"), "planted axis status flip detected")
    check((not door) or any(d["kind"] == "door_flipped" for d in drafts), "planted door n change detected")
    check((not corp) or any(d["kind"] == "as_of_regressed" for d in drafts), "planted as_of regression detected")
    check((not ap) or any(d["kind"] == "artifact_silent_edit" for d in drafts), "planted silent artifact edit detected")
    drafts.append(drift("typed_claim_disagrees", f"docs/{tokens}.md", "typed literal(s) line 1", ["{\"measured_axes\": 22}"], {"axes": 23, "measured_axes": 23, "unmeasured_axes": 0},
                        {"role": "typed", "locator": f"docs/{tokens}.md @ 000000000000", "path": None, "commit": "0" * 40, "sha256": "2" * 64, "as_of": "2026-01-01T00:00:00+00:00", "as_of_field": "synthetic"},
                        src_live(mut, "/api/gspc"), extra={"lines": [{"line": 1, "grammar": "measured", "measured_axes": 22, "text": f"we ship {tokens} with 22 measured axes"}]}))
    qd = sd / "queue"; qd.mkdir()
    n_ok = 0
    for i, d in enumerate(drafts, 1):
        did, draft, md = render_draft(d, mut, base, mut["hour"], i, clone)
        (qd / f"{did}.json").write_text(jdump(draft)); (qd / f"{did}.md").write_text(md)
        srcs = draft["drift"]["sources"]
        two = len(srcs) == 2 and all(s.get("locator") and s.get("sha256") and s.get("as_of") for s in srcs) and bool(draft["drift"]["field"])
        n_ok += two
        if not two:
            print(f"FAIL {did} does not cite two sources with sha256+as_of and a field: {json.dumps(srcs)[:300]}")
    check(n_ok == len(drafts) and len(drafts) > 0, f"every draft ({len(drafts)}) cites two byte-sources (locator+sha256+as_of) and the field that moved")
    txt = "".join(f.read_text() for f in qd.iterdir())
    check(not banned_hits(txt), f"brand-gate: no forbidden token in any draft text (planted '{tokens}' was redacted)")
    check(REDACTED in txt, "brand-gate: the planted token was replaced by the redaction marker")
    (sd / "RESULT.txt").write_text(("PASS" if ok else "FAIL") + f" drafts={len(drafts)} kinds={kinds}\n")
    print(f"SELFTEST {'PASS' if ok else 'FAIL'} out={sd} drafts={len(drafts)} kinds={kinds} (no push, no upload)")
    return 0 if ok else 1


# ── main ──────────────────────────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(LANES / "out" / "drift-draft"))
    ap.add_argument("--clone", default=str(CLONE_DEFAULT))
    ap.add_argument("--no-upload", action="store_true"); ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--selftest", action="store_true"); ap.add_argument("--promote")
    ap.add_argument("--now", action="store_true", help="accepted for symmetry; the stamp is the scheduler's, never this script's")
    a = ap.parse_args()
    out = Path(a.out); snaps = out / "snapshots"; queue = out / "queue"; diffs = out / "diffs"
    for d in (snaps, queue, diffs):
        d.mkdir(parents=True, exist_ok=True)
    if not (out / "HF-README.md").is_file():
        (out / "HF-README.md").write_text(HF_README, encoding="utf-8")
    if a.promote:
        return promote(a.promote, Path(a.clone), out)
    if a.selftest:
        latest = sorted(snaps.glob("*.json"))
        real = None
        if latest:
            real = json.loads(latest[-1].read_text()); real["_file_sha256"] = sha256(latest[-1].read_bytes())
        return selftest(out, real)

    t0 = time.time(); clone = Path(a.clone)
    repo = ensure_clone(clone, BARE)
    snap = take_snapshot(clone, repo, out)
    hour = snap["hour"]
    prevs = [p for p in sorted(snaps.glob("*.json")) if p.stem < hour]
    prev, prev_path = None, None
    if prevs:
        prev_path = prevs[-1]; prev = json.loads(prev_path.read_text()); prev["_file_sha256"] = sha256(prev_path.read_bytes())
    snap_path = snaps / f"{hour}.json"
    snap_path.write_text(jdump(snap)); snap["_file_sha256"] = sha256(snap_path.read_bytes())
    (out / "latest.json").write_text(snap_path.read_text())

    drifts = detect(prev, snap, prev_path)
    idx_path = queue / "index.json"
    index = json.loads(idx_path.read_text()) if idx_path.is_file() else {}
    new_files, new_ids, open_fps, signals, typed_overflow = [], [], [], [], 0
    seq = 1 + sum(1 for k in index.values() if k.get("hour") == hour)
    n_typed = 0
    for d in drifts:
        if d["severity"] != "draft":
            signals.append(d); continue
        fp = d["fingerprint"]
        if fp in index:
            index[fp]["last_seen"] = snap["taken_at"]; open_fps.append(fp); continue
        if d["kind"] == "typed_claim_disagrees":
            n_typed += 1
            if n_typed > MAX_TYPED_DRAFTS:
                typed_overflow += 1; continue
        did, draft, md = render_draft(d, snap, prev, hour, seq, clone); seq += 1
        jf, mf = queue / f"{did}.json", queue / f"{did}.md"
        jf.write_text(jdump(draft)); mf.write_text(md)
        assert not banned_hits(jf.read_text() + mf.read_text()), f"brand-gate token survived redaction in {did}"
        index[fp] = {"id": did, "kind": d["kind"], "subject": d["subject"], "field": d["field"], "hour": hour, "first_seen": snap["taken_at"], "last_seen": snap["taken_at"], "status": "open"}
        new_files += [jf, mf]; new_ids.append(did)
    idx_path.write_text(jdump(index))
    diff_doc = {"schema": SCHEMA_DIFF, "hour": hour, "previous": prev["hour"] if prev else None, "snapshot_sha256": snap["_file_sha256"],
                "previous_sha256": prev.get("_file_sha256") if prev else None, "drafted": new_ids, "already_open": open_fps, "signals": signals,
                "typed_overflow_not_drafted": typed_overflow, "uncheckable": snap["uncheckable"], "all": drifts}
    (diffs / f"{hour}.json").write_text(jdump(diff_doc))

    branch, commit = ("-", "-")
    if new_files and not a.no_push:
        try:
            branch, commit = push_branch(clone, hour, new_files, repo["master"])
        except Exception as e:
            branch, commit = f"corrections/draft-{hour}", f"PUSH_FAILED:{type(e).__name__}:{str(e)[:80]}"
    hf = "hf=skipped"
    if not a.no_upload:
        ups = [(snap_path, f"{HF_PREFIX}/snapshots/{hour}.json"), (out / "latest.json", f"{HF_PREFIX}/latest.json"), (diffs / f"{hour}.json", f"{HF_PREFIX}/diffs/{hour}.json")]
        ups += [(f, f"{HF_PREFIX}/queue/{f.name}") for f in new_files]
        try:
            hf = hf_upload(ups)
        except Exception as e:
            hf = f"hf=FAILED:{type(e).__name__}"
    tot = (snap["surfaces"].get("/api/gspc") or {}).get("totals") or {}
    doors = [k for k in snap["surfaces"] if k.startswith("/api/pop/")]
    d200 = sum(1 for k in doors if snap["surfaces"][k].get("status") == 200)
    board = f"{tot.get('axes')}·{tot.get('measured_axes')}·{tot.get('unmeasured_axes')}" if tot else "UNCHECKABLE"
    corp = (snap["surfaces"].get("/api/state") or {}).get("corpora") or {}
    corp_s = "/".join(str((corp.get(k) or {}).get("value")) for k in ["signed_card_index.count", "card_chain.bodies_verified_valid", "public_root.card_count"])
    verdict = "no drift" if not new_ids and not open_fps else (f"no new drift (open={len(open_fps)})" if not new_ids else f"drift new={len(new_ids)} open={len(open_fps)}")
    print(f"RECEIPT {hour} {verdict} signals={len(signals)} board={board} corpora(idx/chain/root)={corp_s} doors200={d200}/{len(doors)} "
          f"typed_files={snap['typed_literals']['files_with_hits']} uncheckable={len(snap['uncheckable'])} snapshot={snap['_file_sha256'][:12]} "
          f"prev={prev['hour'] if prev else 'none'} drafts={','.join(new_ids) or '-'} branch={branch} commit={commit} {hf} {int(time.time() - t0)}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
