#!/usr/bin/env python3
"""provider_watch.py — hash-only change watcher over AI-provider public documents.

What it does, once a day (GHA provider-watch.yml) or on dispatch:
  for each curated target in scripts/watch/targets.json
    1. read the host's robots.txt with our UA; record allow / disallow / unreadable
    2. if allowed, GET the URL once with our UA (no retries, no header games,
       no cookies, no JS, no login, no paywall, no CAPTCHA — an anti-bot
       challenge is recorded as UNCHECKABLE and left alone)
    3. store ONLY: sha256 of the response bytes, sha256 of the normalised
       text (normaliser below, versioned and hashed into the record), byte
       length, HTTP status, etag / last-modified, content-type, final URL,
       fetched_at.  Never the content.  Not one line of it.
    4. diff = the normalised sha256 differs from the previous OK capture of
       the same target.  Emit one card-v0 public.notice leaf per change
       (kind csoai.diff.provider-terms/0.1, <= 3072 bytes canonical) and one
       daily summary leaf.  Leaves are UNSIGNED here; scripts/adapters/
       provider_diff.py hands them to scripts/publish_public_root.py, which
       signs in GHA or halts.  Nothing here signs, nothing here can.
    5. append to public/feeds/provider-diff/state.json (history is append-
       only: past entries are never rewritten) and rebuild index.json (the
       free surface: latest state per target + the last N diffs).

Three states, taken from corpus-watch (CSOAI-ORG/corpus-watch), where the
lesson was learned: a watcher that reports "unchanged" when it could not
fetch is lying about the document when the fact was about the request.
  OK           — HTTP 200 with a body; hashed; diffable.
  UNCHECKABLE  — we chose not to fetch or not to trust the bytes: robots.txt
                 disallow, robots.txt unreadable (fail closed), or an anti-bot
                 challenge page.  Never bypassed.
  UNKNOWN      — we tried and got no usable document: non-200, network error,
                 timeout, empty body.  Never "unchanged".

What a leaf attests: "the bytes at this URL changed between the two times
shown — nothing about what changed or why".  No grade.  No verdict word.
Backfill: none.  The first capture of a target is FIRST_CAPTURE, not a diff.

Exit codes: 0 ran; 2 every target was UNCHECKABLE/UNKNOWN (fail closed — the
run is visibly not an all-clear; state is still written so the record is
honest).  Never raises on a bad target.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from adapters.staged_leaves import _check as check_leaf  # noqa: E402  (the one leaf validator)

NORMALISER = "csoai-norm-v1"
LEAF_KIND = "csoai.diff.provider-terms/0.1"
DAILY_KIND = "csoai.diff.provider-terms.daily/0.1"
STATE_SCHEMA = "csoai.provider-diff.state/0.1"
INDEX_SCHEMA = "csoai.provider-diff.index/0.1"
CARD_SCHEMA = "https://councilof.ai/schema/card-v0.json"
SURFACE = "public.notice"
CAP = 3072
RECENT_N = 50
MAX_BYTES = 8 * 1024 * 1024
TIMEOUT_S = 30
PER_HOST_PAUSE_S = 0.6
DEFAULT_UA = "csoai-provider-watch/0.1 (+https://councilof.ai/feeds/provider-diff; hash-only change watcher)"
ATTESTS = "the bytes at this URL changed between the two times shown — nothing about what changed or why"
DAILY_ATTESTS = (
    "for each target listed as unchanged, the normalised sha256 of this capture equals the previous OK "
    "capture — an observation of two captures, nothing about the document between them"
)

STATE_OK = "OK"
STATE_UNCHECKABLE = "UNCHECKABLE"
STATE_UNKNOWN = "UNKNOWN"

KIND_FIRST = "FIRST_CAPTURE"
KIND_UNCHANGED = "UNCHANGED"
KIND_CHANGED = "CHANGED"
KIND_BYTES_ONLY = "BYTES_ONLY"  # raw bytes moved, normalised text did not (scripts/nonces/whitespace)

# Signs of an anti-bot interstitial. We record UNCHECKABLE and stop; we never "solve" it.
_CHALLENGE_MARKERS = (
    "just a moment",
    "attention required",
    "enable javascript and cookies to continue",
    "checking your browser",
    "px-captcha",
    "captcha",
    "errors.edgesuite.net",
    "access denied",
    "verify you are human",
)


# ─────────────────────────────────────────────────────────────────────────────
# normaliser — FROZEN as csoai-norm-v1. Changing it = new version string, which
# changes every hash, which is itself recorded (the version is hashed in).
# ─────────────────────────────────────────────────────────────────────────────
_BLOCK_RE = re.compile(r"<(script|style|noscript|svg|template|iframe)\b[^>]*>.*?</\1\s*>", re.S | re.I)
_COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def normalise(body: bytes, content_type: str | None = None) -> str:
    """Bytes -> the text a reader would see, whitespace-collapsed.

    HTML: drop comments; drop script/style/noscript/svg/template/iframe blocks
    (nonces, build hashes, analytics ids live there); drop every tag (hidden
    inputs, meta, link — CSRF/asset-hash carriers); unescape entities.
    Everything else (JSON, XML, plain): as-is.  Then NBSP -> space, collapse
    all whitespace, strip.  Case is KEPT — a case edit in a policy is an edit.
    """
    text = body.decode("utf-8", errors="replace")
    ct = (content_type or "").lower()
    head = text.lstrip()[:256].lower()
    is_html = "html" in ct or head.startswith("<!doctype") or head.startswith("<html")
    if is_html:
        text = _COMMENT_RE.sub(" ", text)
        text = _BLOCK_RE.sub(" ", text)
        text = _TAG_RE.sub(" ", text)
        text = html.unescape(text)
    text = text.replace("\xa0", " ")
    return _WS_RE.sub(" ", text).strip()


def norm_sha256(text: str) -> str:
    return hashlib.sha256((NORMALISER + "\x00" + text).encode("utf-8")).hexdigest()


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ─────────────────────────────────────────────────────────────────────────────
# fetch — one GET, our UA, follow redirects, cap bytes. Returns facts, never raises.
# ─────────────────────────────────────────────────────────────────────────────
class FetchResult(dict):
    """{status:int|None, body:bytes, headers:dict, final_url:str, error:str|None}"""


def http_get(url: str, ua: str, timeout: int = TIMEOUT_S) -> FetchResult:
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "*/*"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read(MAX_BYTES + 1)
            hdrs = {k.lower(): v for k, v in r.headers.items()}
            return FetchResult(status=r.status, body=body[:MAX_BYTES], headers=hdrs, final_url=r.geturl(), error=None)
    except urllib.error.HTTPError as e:
        try:
            body = e.read(MAX_BYTES)
        except Exception:
            body = b""
        hdrs = {k.lower(): v for k, v in (e.headers.items() if e.headers else [])}
        return FetchResult(status=e.code, body=body, headers=hdrs, final_url=e.geturl() or url, error=None)
    except Exception as e:  # DNS, TLS, timeout, refused — UNKNOWN, never "unchanged"
        return FetchResult(status=None, body=b"", headers={}, final_url=url, error=f"{type(e).__name__}")


Fetcher = Callable[[str], FetchResult]


def looks_like_challenge(res: FetchResult) -> bool:
    status = res.get("status")
    hdrs = res.get("headers") or {}
    if "cf-mitigated" in hdrs:
        return True
    if status in (403, 429, 503):
        server = (hdrs.get("server") or "").lower()
        if "cloudflare" in server or "akamai" in server:
            return True
    body = res.get("body") or b""
    if len(body) < 64_000:
        low = body[:64_000].decode("utf-8", errors="replace").lower()
        if status in (403, 429, 503) or "<title>" in low[:4000]:
            for m in _CHALLENGE_MARKERS:
                if m in low:
                    return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# robots — read with our UA, parse, decide. 404 = allow (the convention);
# anything else unreadable = fail closed.
# ─────────────────────────────────────────────────────────────────────────────
class RobotsCache:
    def __init__(self, fetch: Fetcher, ua: str):
        self.fetch = fetch
        self.ua = ua
        self._by_host: dict[str, dict[str, Any]] = {}

    def _load(self, origin: str) -> dict[str, Any]:
        if origin in self._by_host:
            return self._by_host[origin]
        robots_url = origin + "/robots.txt"
        res = self.fetch(robots_url)
        status = res.get("status")
        entry: dict[str, Any] = {"robots_url": robots_url, "http_status": status, "parser": None, "readable": False}
        if status == 200:
            rp = urllib.robotparser.RobotFileParser()
            try:
                rp.parse((res.get("body") or b"").decode("utf-8", errors="replace").splitlines())
                entry["parser"] = rp
                entry["readable"] = True
            except Exception:
                entry["readable"] = False
        elif status == 404:
            entry["readable"] = True  # no robots.txt = nothing disallowed
        self._by_host[origin] = entry
        return entry

    def decide(self, url: str) -> dict[str, Any]:
        p = urllib.parse.urlsplit(url)
        origin = f"{p.scheme}://{p.netloc}"
        entry = self._load(origin)
        out = {"robots_url": entry["robots_url"], "http_status": entry["http_status"]}
        if not entry["readable"]:
            out["status"] = "unreadable"
            return out
        rp = entry["parser"]
        if rp is None:
            out["status"] = "allow"
            return out
        try:
            allowed = rp.can_fetch(self.ua, url)
        except Exception:
            out["status"] = "unreadable"
            return out
        out["status"] = "allow" if allowed else "disallow"
        return out


# ─────────────────────────────────────────────────────────────────────────────
# capture — one target, one record. Hash-only.
# ─────────────────────────────────────────────────────────────────────────────
def capture(target: dict[str, str], fetch: Fetcher, robots: RobotsCache, fetched_at: str | None = None) -> dict[str, Any]:
    url = target["url"]
    rec: dict[str, Any] = {
        "fetched_at": fetched_at or now_iso(),
        "url": url,
        "normaliser": NORMALISER,
        "state": STATE_UNKNOWN,
        "reason": None,
        "robots": None,
        "http_status": None,
        "final_url": None,
        "redirected": False,
        "content_type": None,
        "etag": None,
        "last_modified": None,
        "byte_length": None,
        "bytes_sha256": None,
        "norm_sha256": None,
    }
    rb = robots.decide(url)
    rec["robots"] = rb["status"]
    rec["robots_http_status"] = rb["http_status"]
    if rb["status"] == "disallow":
        rec["state"] = STATE_UNCHECKABLE
        rec["reason"] = "robots.txt disallow for our UA; not fetched"
        return rec
    if rb["status"] == "unreadable":
        rec["state"] = STATE_UNCHECKABLE
        rec["reason"] = f"robots.txt unreadable (HTTP {rb['http_status']}); fail closed, not fetched"
        return rec

    res = fetch(url)
    rec["http_status"] = res.get("status")
    rec["final_url"] = res.get("final_url") or url
    rec["redirected"] = (rec["final_url"] or url) != url
    hdrs = res.get("headers") or {}
    rec["content_type"] = hdrs.get("content-type")
    rec["etag"] = hdrs.get("etag")
    rec["last_modified"] = hdrs.get("last-modified")
    body = res.get("body") or b""
    rec["byte_length"] = len(body) if res.get("status") is not None else None

    if res.get("error"):
        rec["state"] = STATE_UNKNOWN
        rec["reason"] = f"fetch failed: {res['error']}"
        return rec
    if looks_like_challenge(res):
        rec["state"] = STATE_UNCHECKABLE
        rec["reason"] = f"anti-bot challenge (HTTP {res.get('status')}); not bypassed"
        return rec
    if res.get("status") != 200:
        rec["state"] = STATE_UNKNOWN
        rec["reason"] = f"HTTP {res.get('status')}"
        return rec
    if not body:
        rec["state"] = STATE_UNKNOWN
        rec["reason"] = "empty body"
        return rec
    rec["bytes_sha256"] = sha256_hex(body)
    rec["norm_sha256"] = norm_sha256(normalise(body, rec["content_type"]))
    rec["state"] = STATE_OK
    return rec


def classify(prev_ok: dict[str, Any] | None, new: dict[str, Any]) -> str | None:
    """Diff kind for an OK capture against the previous OK capture; None when new is not OK."""
    if new.get("state") != STATE_OK:
        return None
    if not prev_ok:
        return KIND_FIRST
    if new["norm_sha256"] != prev_ok["norm_sha256"]:
        return KIND_CHANGED
    if new["bytes_sha256"] != prev_ok["bytes_sha256"]:
        return KIND_BYTES_ONLY
    return KIND_UNCHANGED


# ─────────────────────────────────────────────────────────────────────────────
# leaves — card-v0, public.notice, unsigned, validated by the ONE validator.
# ─────────────────────────────────────────────────────────────────────────────
def _fit(payload: dict[str, Any], list_keys: tuple[str, ...], cap: int = CAP) -> dict[str, Any]:
    """Trim named list fields until the canonical payload fits `cap`. Never drops facts silently: a
    trimmed list gets '+N more' as its last element; the n_* counts are never touched."""
    p = json.loads(json.dumps(payload))
    dropped = {k: 0 for k in list_keys}
    while len(canonical_bytes(p)) > cap:
        k = max(list_keys, key=lambda key: len(p.get(key) or []))
        lst = list(p.get(k) or [])
        if dropped[k]:
            lst = lst[:-1]  # take the '+N more' marker off before trimming
        if not lst:
            break
        lst = lst[:-1]
        dropped[k] += 1
        p[k] = lst + [f"+{dropped[k]} more"]
    return p


def make_card(subject: str, as_of: str, source_urls: list[str], payload: dict[str, Any], unmeasured: list[str], tags: list[str]) -> dict[str, Any]:
    return {
        "schema": CARD_SCHEMA,
        "surface": SURFACE,
        "subject": subject,
        "as_of": as_of,
        "source_urls": source_urls,
        "payload": payload,
        "sha256": sha256_hex(canonical_bytes(payload)),
        "sig_ed25519": None,
        "unmeasured": unmeasured,
        "tags": tags,
    }


def diff_leaf(target: dict[str, str], prev_ok: dict[str, Any], new: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "kind": LEAF_KIND,
        "state": "PROBED",
        "provider": target["provider"],
        "surface": target["surface"],
        "url": target["url"],
        "prev_sha256": prev_ok["norm_sha256"],
        "new_sha256": new["norm_sha256"],
        "prev_bytes_sha256": prev_ok["bytes_sha256"],
        "new_bytes_sha256": new["bytes_sha256"],
        "prev_fetched_at": prev_ok["fetched_at"],
        "fetched_at": new["fetched_at"],
        "http_status": new["http_status"],
        "robots": new["robots"],
        "normaliser": NORMALISER,
        "byte_length": {"prev": prev_ok["byte_length"], "new": new["byte_length"]},
        "etag": {"prev": prev_ok.get("etag"), "new": new.get("etag")},
        "last_modified": {"prev": prev_ok.get("last_modified"), "new": new.get("last_modified")},
        "attests": ATTESTS,
        "not_a_grade": True,
        "writes_board": False,
        "content_stored": False,
    }
    date = new["fetched_at"][:10]
    subject = f"{target['provider_name']} — {target['surface']}: bytes changed {date}"
    unmeasured = [
        "what changed (content is never stored)",
        "why it changed",
        "whether the change is material to anyone",
        "sig_ed25519 against #board-attestation-1 (signed in GHA public-root or not at all)",
    ]
    tags = ["provider-diff", f"provider:{target['provider']}", f"surface:{target['surface']}", "hash-only"]
    return make_card(subject, new["fetched_at"], [target["url"]], payload, unmeasured, tags)


def daily_leaf(run: dict[str, Any]) -> dict[str, Any]:
    date = run["run_at"][:10]
    subject = f"provider-diff daily capture {date}: {run['changed']} changed, {run['uncheckable']} uncheckable, {run['unknown']} unknown of {run['n_targets']}"
    unmeasured = [
        "targets listed as uncheckable/unknown (nothing observed; never 'unchanged')",
        "what changed on any changed target",
        "sig_ed25519 against #board-attestation-1 (signed in GHA public-root or not at all)",
    ]
    tags = ["provider-diff", "daily", "hash-only"]
    srcs = ["https://councilof.ai/feeds/provider-diff/index.json"]
    # The validator caps BOTH the payload and the whole card at CAP; budget the payload for the envelope.
    overhead = len(canonical_bytes(make_card(subject, run["run_at"], srcs, {}, unmeasured, tags))) - 2
    payload = _fit(
        {
            "kind": DAILY_KIND,
            "state": "PROBED",
            "run_at": run["run_at"],
            "normaliser": NORMALISER,
            "n_targets": run["n_targets"],
            "n_ok": run["ok"],
            "n_unchanged": run["unchanged"],
            "n_changed": run["changed"],
            "n_bytes_only": run["bytes_only"],
            "n_first_capture": run["first"],
            "n_uncheckable": run["uncheckable"],
            "n_unknown": run["unknown"],
            "changed": list(run["changed_ids"]),
            "uncheckable": list(run["uncheckable_ids"]),
            "unknown": list(run["unknown_ids"]),
            "attests": DAILY_ATTESTS,
            "not_a_grade": True,
            "writes_board": False,
            "content_stored": False,
        },
        ("unknown", "uncheckable", "changed"),
        cap=CAP - overhead - 8,
    )
    return make_card(subject, run["run_at"], srcs, payload, unmeasured, tags)


def leaf_filename(kind: str, target_id: str | None, at: str) -> str:
    stamp = at.replace("-", "").replace(":", "")
    if kind == "daily":
        return f"card-daily-{stamp}-unsigned.json"
    return f"card-{target_id.replace('/', '-')}-{stamp}-unsigned.json"


# ─────────────────────────────────────────────────────────────────────────────
# targets + state
# ─────────────────────────────────────────────────────────────────────────────
def load_targets(path: Path) -> tuple[list[dict[str, str]], str]:
    doc = json.loads(path.read_text(encoding="utf-8"))
    ua = doc.get("user_agent") or DEFAULT_UA
    out: list[dict[str, str]] = []
    for prov in doc.get("providers") or []:
        for surface, url in (prov.get("targets") or {}).items():
            if not isinstance(url, str) or not url.startswith("https://"):
                continue
            out.append({"id": f"{prov['id']}/{surface}", "provider": prov["id"], "provider_name": prov.get("name") or prov["id"], "surface": surface, "url": url})
    return out, ua


def empty_state() -> dict[str, Any]:
    t = now_iso()
    return {"schema": STATE_SCHEMA, "normaliser": NORMALISER, "created_at": t, "updated_at": t, "targets": {}, "runs": []}


def load_state(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return empty_state()
    try:
        st = json.loads(path.read_text(encoding="utf-8"))
        if st.get("schema") == STATE_SCHEMA:
            st.setdefault("targets", {})
            st.setdefault("runs", [])
            return st
    except Exception:
        pass
    return empty_state()


def _event(kind: str, cap: dict[str, Any], prev_ok: dict[str, Any] | None, leaf: str | None) -> dict[str, Any]:
    ev: dict[str, Any] = {
        "at": cap["fetched_at"],
        "kind": kind,
        "state": cap["state"],
        "http_status": cap["http_status"],
        "robots": cap["robots"],
        "bytes_sha256": cap["bytes_sha256"],
        "norm_sha256": cap["norm_sha256"],
    }
    if cap.get("reason"):
        ev["reason"] = cap["reason"]
    if prev_ok and kind in (KIND_CHANGED, KIND_BYTES_ONLY):
        ev["prev_norm_sha256"] = prev_ok["norm_sha256"]
        ev["prev_bytes_sha256"] = prev_ok["bytes_sha256"]
        ev["prev_fetched_at"] = prev_ok["fetched_at"]
    if leaf:
        ev["leaf"] = leaf
    return ev


def run_once(
    targets: list[dict[str, str]],
    state: dict[str, Any],
    fetch: Fetcher,
    ua: str,
    leaves_dir: Path | None,
    run_at: str | None = None,
    pause: float = PER_HOST_PAUSE_S,
    log: Callable[[str], None] = lambda s: None,
) -> dict[str, Any]:
    """Capture every target, mutate `state` (append-only history), write leaves. Returns the run row."""
    run_at = run_at or now_iso()
    robots = RobotsCache(fetch, ua)
    run = {
        "run_at": run_at, "n_targets": len(targets), "ok": 0, "unchanged": 0, "changed": 0, "bytes_only": 0,
        "first": 0, "uncheckable": 0, "unknown": 0, "changed_ids": [], "uncheckable_ids": [], "unknown_ids": [], "leaves": [],
    }
    last_host = None
    for t in targets:
        host = urllib.parse.urlsplit(t["url"]).netloc
        if pause and last_host == host:
            time.sleep(pause)
        last_host = host
        cap = capture(t, fetch, robots, fetched_at=run_at)
        entry = state["targets"].setdefault(
            t["id"], {"provider": t["provider"], "surface": t["surface"], "url": t["url"], "latest": None, "last_ok": None, "history": [], "n_runs": 0, "n_changed": 0},
        )
        entry["url"] = t["url"]
        prev_ok = entry.get("last_ok")
        prev_latest = entry.get("latest")
        kind = classify(prev_ok, cap)
        leaf_name = None
        if cap["state"] == STATE_OK:
            run["ok"] += 1
            if kind == KIND_FIRST:
                run["first"] += 1
            elif kind == KIND_UNCHANGED:
                run["unchanged"] += 1
            elif kind == KIND_BYTES_ONLY:
                run["bytes_only"] += 1
            elif kind == KIND_CHANGED:
                run["changed"] += 1
                run["changed_ids"].append(t["id"])
                entry["n_changed"] = int(entry.get("n_changed") or 0) + 1
                card = diff_leaf(t, prev_ok, cap)
                reason = check_leaf(card)
                if reason:
                    log(f"leaf skipped {t['id']}: {reason}")
                elif leaves_dir is not None:
                    leaf_name = leaf_filename("diff", t["id"], run_at)
                    (leaves_dir / leaf_name).write_text(json.dumps(card, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
                    run["leaves"].append(leaf_name)
        elif cap["state"] == STATE_UNCHECKABLE:
            run["uncheckable"] += 1
            run["uncheckable_ids"].append(t["id"])
        else:
            run["unknown"] += 1
            run["unknown_ids"].append(t["id"])

        # append-only history: every non-UNCHANGED outcome, plus any state transition
        transition = (prev_latest or {}).get("state") != cap["state"]
        if kind != KIND_UNCHANGED or transition:
            entry["history"].append(_event(kind or cap["state"], cap, prev_ok, leaf_name))
        entry["latest"] = cap
        if cap["state"] == STATE_OK:
            entry["last_ok"] = {k: cap[k] for k in ("fetched_at", "bytes_sha256", "norm_sha256", "byte_length", "etag", "last_modified", "http_status")}
        entry["n_runs"] = int(entry.get("n_runs") or 0) + 1
        log(f"{t['id']:<32} {cap['state']:<12} http={cap['http_status']} robots={cap['robots']} kind={kind or '-'} {cap.get('reason') or ''}")

    if leaves_dir is not None:
        card = daily_leaf(run)
        reason = check_leaf(card)
        if reason:
            log(f"daily leaf skipped: {reason}")
        else:
            name = leaf_filename("daily", None, run_at)
            (leaves_dir / name).write_text(json.dumps(card, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
            run["leaves"].append(name)
    state["runs"].append(run)
    state["updated_at"] = run_at
    return run


# ─────────────────────────────────────────────────────────────────────────────
# index — the free surface
# ─────────────────────────────────────────────────────────────────────────────
def build_index(state: dict[str, Any], targets: list[dict[str, str]], recent_n: int = RECENT_N) -> dict[str, Any]:
    by_id = {t["id"]: t for t in targets}
    rows = []
    diffs = []
    # Every curated target gets a row (state null until its first capture), plus any target that
    # was captured in the past and has since left the list (in_target_list: false) — history is kept.
    entries: dict[str, dict[str, Any]] = {tid: {"provider": t["provider"], "surface": t["surface"], "url": t["url"], "latest": None, "last_ok": None, "history": [], "n_runs": 0} for tid, t in by_id.items()}
    entries.update(state["targets"])
    for tid, entry in entries.items():
        t = by_id.get(tid, {"provider": entry["provider"], "provider_name": entry["provider"], "surface": entry["surface"], "url": entry["url"]})
        latest = entry.get("latest") or {}
        last_ok = entry.get("last_ok") or {}
        hist = entry.get("history") or []
        changes = [h for h in hist if h.get("kind") == KIND_CHANGED]
        recent_hist = hist[-7:]
        churn = sum(1 for h in recent_hist if h.get("kind") in (KIND_CHANGED, KIND_BYTES_ONLY)) >= 3
        rows.append(
            {
                "id": tid,
                "provider": t["provider"],
                "provider_name": t.get("provider_name") or t["provider"],
                "surface": t["surface"],
                "url": t["url"],
                "state": latest.get("state"),
                "reason": latest.get("reason"),
                "http_status": latest.get("http_status"),
                "robots": latest.get("robots"),
                "fetched_at": latest.get("fetched_at"),
                "norm_sha256": last_ok.get("norm_sha256"),
                "bytes_sha256": last_ok.get("bytes_sha256"),
                "byte_length": last_ok.get("byte_length"),
                "last_ok_at": last_ok.get("fetched_at"),
                "last_change_at": changes[-1]["at"] if changes else None,
                "n_changes": len(changes),
                "n_runs": entry.get("n_runs", 0),
                "churn_suspect": churn,
                "in_target_list": tid in by_id,
            }
        )
        for h in changes:
            diffs.append(
                {
                    "id": tid,
                    "provider": t["provider"],
                    "surface": t["surface"],
                    "url": t["url"],
                    "prev_sha256": h.get("prev_norm_sha256"),
                    "new_sha256": h.get("norm_sha256"),
                    "prev_fetched_at": h.get("prev_fetched_at"),
                    "fetched_at": h["at"],
                    "leaf": f"/feeds/provider-diff/leaves/{h['leaf']}" if h.get("leaf") else None,
                    "attests": ATTESTS,
                }
            )
    rows.sort(key=lambda r: r["id"])
    diffs.sort(key=lambda d: d["fetched_at"], reverse=True)
    last_run = state["runs"][-1] if state.get("runs") else None
    counts = {s: sum(1 for r in rows if r["state"] == s) for s in (STATE_OK, STATE_UNCHECKABLE, STATE_UNKNOWN)}
    return {
        "schema": INDEX_SCHEMA,
        "as_of": state.get("updated_at"),
        "normaliser": NORMALISER,
        "one_line": "Hash-only, robots-honouring daily capture of AI-provider public documents. A diff is a change of normalised sha256 between two captures. Nothing about what changed or why. Content is never stored.",
        "n_targets": len(rows),
        "n_runs": len(state.get("runs") or []),
        "counts": counts,
        "last_run": last_run,
        "targets": rows,
        "recent_diffs": diffs[:recent_n],
        "n_diffs_total": len(diffs),
        "free": {
            "this_index": "/feeds/provider-diff/index.json",
            "api": "/api/feeds/provider-diff",
            "state_history": "/feeds/provider-diff/state.json",
            "leaves": "/feeds/provider-diff/leaves/",
            "verify": "each leaf's sha256 is sha256(canonical payload); signed copies land in /cards/<sha256>.json with a proof to /root.json",
        },
        "paid": {
            "rail": "x402-or-invoice",
            "what": "the signed historical batch (every diff leaf + proofs, assembled) and a bespoke per-partner target list on the same method",
            "how": "/api/feeds/provider-diff?history=1 (402 states the amount) or ?invoice=gbp&commissioned_by=<org>",
            "never": ["a grade", "a verdict on any change", "the content of any page"],
        },
        "doctrine": {
            "states": {STATE_OK: "200 with body; hashed", STATE_UNCHECKABLE: "robots disallow / robots unreadable / anti-bot challenge — not fetched or not trusted, never bypassed", STATE_UNKNOWN: "non-200, network error, empty — never reported as unchanged"},
            "attests": ATTESTS,
            "backfill": "none; the first capture of a target is FIRST_CAPTURE, not a diff",
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="hash-only provider document change watcher")
    ap.add_argument("--targets", default=str(HERE / "targets.json"))
    ap.add_argument("--state-dir", default=str(ROOT / "public" / "feeds" / "provider-diff"))
    ap.add_argument("--dry-run", action="store_true", help="fetch + classify, write nothing")
    ap.add_argument("--limit", type=int, default=0, help="only the first N targets (smoke)")
    ap.add_argument("--only", default="", help="substring filter on target id")
    args = ap.parse_args(argv)

    targets, ua = load_targets(Path(args.targets))
    if args.only:
        targets = [t for t in targets if args.only in t["id"]]
    if args.limit:
        targets = targets[: args.limit]
    state_dir = Path(args.state_dir)
    leaves_dir = state_dir / "leaves"
    state = load_state(state_dir / "state.json")
    if not args.dry_run:
        leaves_dir.mkdir(parents=True, exist_ok=True)

    fetch: Fetcher = lambda u: http_get(u, ua)  # noqa: E731
    run = run_once(targets, state, fetch, ua, None if args.dry_run else leaves_dir, log=lambda s: print(s, flush=True))
    summary = {k: v for k, v in run.items() if k not in ("changed_ids", "uncheckable_ids", "unknown_ids")}
    print(json.dumps(summary, sort_keys=True, ensure_ascii=False))

    if not args.dry_run:
        (state_dir / "state.json").write_text(json.dumps(state, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        (state_dir / "index.json").write_text(json.dumps(build_index(state, targets), indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {state_dir / 'state.json'} and index.json; {len(run['leaves'])} leaves")
    else:
        print("dry-run: nothing written")

    if run["n_targets"] and run["ok"] == 0:
        print("FAIL-CLOSED: no target was OK — this run is not an all-clear", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
