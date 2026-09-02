#!/usr/bin/env python3
"""xrpl_swift_eater.py — SIGNED · ANCHORED · 3KB · XRPL/SWIFT eater (stage-only).

Fetches PUBLIC raw sources NOW, records sha256 + fetched_at + URL for each,
computes deterministic facts, and stages one card-v0 atom per subject as
UNSIGNED (sig_ed25519=null) under public/interop/xrpl-swift-eater-2026-09/.

What it never does: sign, touch a key, stamp MEASURED, fetch behind a login,
bypass a bot gate, or fetch a path robots.txt disallows. Every card <=3072
bytes canonical (sorted keys, compact, ensure_ascii=false). No verdict words.

States on a card payload: PROBED (raw bytes fetched, fact computed) /
DISCOVERED (named by a source whose body could not be fetched) / UNMEASURED
(nothing fetchable). MEASURED is never written here: it exists only after a
VALID Ed25519 signature minted in GitHub Actions (public-root.yml) and
verified by a stranger.

Sign path (the ONE root): scripts/adapters/staged_leaves.py reads this
directory -> scripts/publish_public_root.py (GHA public-root.yml, hourly :07 or
`gh workflow run public-root.yml -f dry_run=false`) signs each new leaf with
BOARD_SIGN_KEY_PKCS8_B64 under did:web:csoai.org#board-attestation-1, folds it
into public/root.json (merkle) and scripts/witness_public_root.py anchors that
ONE root (Rekor + OTS). Per-leaf anchors are never made.

Usage: python3 harness/rwa-attest/xrpl_swift_eater.py [--out DIR]
"""
from __future__ import annotations

import argparse
import hashlib
import html as htmlmod
import json
import re
import ssl
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DEFAULT_OUT = ROOT / "public" / "interop" / "xrpl-swift-eater-2026-09"
UA = "csoai-xrpl-swift-eater/0.1 (+https://councilof.ai; nicholas@csoai.org)"
CTX = ssl.create_default_context()
SCHEMA = "https://councilof.ai/schema/card-v0.json"
DID_INTENDED = "did:web:csoai.org#board-attestation-1"
READER = "https://councilof.ai/api/xrpl"
SWIFT = "https://councilof.ai/api/swift"
XRPSCAN_WELLKNOWN = "https://api.xrpscan.com/api/v1/names/well-known"
RPCS = ("https://xrplcluster.com/", "https://s1.ripple.com:51234/", "https://s2.ripple.com:51234/")
CAP = 3072
SLEEP = 0.5
METHOD_ID = "csoai.eater.xrpl-swift/0.1"

# Verdict vocabulary that must never appear on a card (the vitest gate re-checks).
VERDICT_RE = re.compile(
    r"\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b"
    r"|(?<!UN)MEASURED",
    re.I,
)

# lsf* AccountRoot flags (XRPL ledger format).
LSF = {
    "require_dest_tag": 0x00020000,
    "require_auth": 0x00040000,
    "disallow_xrp": 0x00080000,
    "disable_master": 0x00100000,
    "no_freeze": 0x00200000,
    "global_freeze": 0x00400000,
    "default_ripple": 0x00800000,
    "deposit_auth": 0x01000000,
    "allow_trustline_clawback": 0x80000000,
}

# Issuer disclosure pages: the reader's declared Domain / XRPScan directory domain
# is the only origin used. One primary page per issuer; no invented URLs.
DISCLOSURE_PAGES: dict[str, dict] = {
    "Ripple": {"symbols": ["RLUSD"], "pages": ["https://ripple.com/solutions/stablecoin/transparency/"], "pdf_filter": r"attestation|reserves? report"},
    "Ondo Finance": {"symbols": ["OUSG"], "pages": ["https://app.ondo.finance/legal-documentation/us", "https://ondo.finance/ousg"], "pdf_filter": r"attest|examination|reserve"},
    "Braza Bank": {"symbols": ["USDB", "BBRL"], "pages": ["https://tokens.brazacripto.com.br"], "pdf_filter": r"attest|examination|reserve|lastro"},
    "Circle": {"symbols": ["USDC"], "pages": ["https://www.circle.com/transparency"], "pdf_filter": r"^(?=.*usdc)(?=.*(attest|examination))"},
    "Société Générale-FORGE": {"symbols": ["EURCV"], "pages": ["https://www.sgforge.com/product/coinvertible/"], "pdf_filter": r"attest|examination|reserve"},
    "Schuman Financial": {"symbols": ["EURØP"], "pages": ["https://schuman.io/europ"], "pdf_filter": r"attest|examination|reserve"},
    "Quantoz": {"symbols": ["EURQ", "USDQ"], "pages": ["https://quantoz.com/"], "pdf_filter": r"attest|examination|reserve"},
    "GateHub": {"symbols": ["USD.gh", "EUR.gh", "XAU.gh", "GBP.gh"], "pages": ["https://gatehub.net/"], "pdf_filter": r"attest|examination|reserve"},
    "Bitstamp": {"symbols": ["USD.bs", "EUR.bs"], "pages": ["https://www.bitstamp.net/"], "pdf_filter": r"attest|examination|reserve"},
    "Republic of Palau": {"symbols": ["PSC"], "pages": ["https://www.palaugov.pw/stablecoin"], "pdf_filter": r"attest|examination|reserve"},
}

LEXICON = {
    "reserve_attestation_terms": r"attestation|attested|proof of reserves?|reserve report|examination report",
    "named_accounting_firms": r"deloitte|pricewaterhousecoopers|\bpwc\b|\bkpmg\b|ernst\s*&\s*young|\bbdo\b|grant thornton|mazars|forvis|\bhacken\b",
    "custody_terms": r"custodian|custody|trust company|bny mellon|bank of new york|state street|coinbase custody|anchorage digital",
    "regulatory_terms": r"\bmica\b|e-money token|electronic money|\bnydfs\b|new york department of financial services|regulation d\b|\bucits\b|\bfca\b|\bacpr\b|\bbafin\b|banco central do brasil|\bcvm\b|\bemi\b|\bsec\b|securities and exchange commission",
}
MONTHS = {m: i + 1 for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}

_robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
SKIPLOG: list[str] = []
MANIFEST: list[dict] = []


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def skip(state: str, url: str, reason: str) -> None:
    line = f"{state}\t{url}\t{reason}"
    if line not in SKIPLOG:
        SKIPLOG.append(line)


def robots_allowed(url: str) -> str:
    """allowed | disallowed | no-robots | unreachable. Never fetch a disallowed path."""
    p = urllib.parse.urlparse(url)
    host = f"{p.scheme}://{p.netloc}"
    if p.netloc == "councilof.ai":
        return "first-party"  # our own JSON readers; not a crawl of a third party
    if host not in _robots:
        try:
            req = urllib.request.Request(host + "/robots.txt", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=12, context=CTX) as r:
                body = r.read().decode("utf-8", "replace")
                ct = r.headers.get("content-type", "")
                if r.status == 200 and "html" not in ct:
                    rp = urllib.robotparser.RobotFileParser()
                    rp.parse(body.splitlines())
                    _robots[host] = rp
                else:
                    _robots[host] = None
        except urllib.error.HTTPError:
            _robots[host] = None
        except Exception:
            _robots[host] = "unreachable"  # type: ignore[assignment]
    rp = _robots[host]
    if rp == "unreachable":
        return "unreachable"
    if rp is None:
        return "no-robots"
    return "allowed" if rp.can_fetch("*", url) else "disallowed"


def fetch(url: str, timeout: int = 20, accept: str = "*/*") -> dict:
    """Keyless GET. Returns http, final_url, bytes, content_type, fetched_at, sha256, error."""
    fetched_at = now_iso()
    out = {"url": url, "fetched_at": fetched_at, "http": 0, "final_url": url, "content_type": "", "n_bytes": 0, "sha256": None, "body": b"", "error": None}
    rb = robots_allowed(url)
    out["robots"] = rb
    if rb == "disallowed":
        out["error"] = "robots.txt disallows this path"
        skip("SKIPPED", url, "robots.txt disallows this path")
        return out
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            body = r.read()
            out.update({"http": int(r.status), "final_url": r.geturl(), "content_type": r.headers.get("content-type", ""), "n_bytes": len(body), "sha256": sha256(body), "body": body})
    except urllib.error.HTTPError as e:
        out["http"] = int(e.code)
        out["error"] = f"HTTP {e.code}"
    except Exception as e:  # timeout, DNS, TLS
        out["error"] = f"{type(e).__name__}: {str(e)[:80]}"
    time.sleep(SLEEP)
    MANIFEST.append({k: v for k, v in out.items() if k != "body"})
    return out


def rpc(method: str, params: dict) -> tuple[str | None, dict]:
    body = json.dumps({"method": method, "params": [params], "id": 1}).encode()
    last = "no rpc"
    for r in RPCS:
        try:
            req = urllib.request.Request(r, data=body, headers={"Content-Type": "application/json", "User-Agent": UA})
            with urllib.request.urlopen(req, timeout=20, context=CTX) as resp:
                d = json.loads(resp.read())
            if (d.get("result") or {}).get("status") == "success":
                time.sleep(0.3)
                return r, d["result"]
            last = json.dumps(d)[:80]
        except Exception as e:
            last = f"{type(e).__name__}"
            time.sleep(0.5)
    return None, {"error": last}


def decode_hex_domain(h: str | None) -> str | None:
    if not h:
        return None
    try:
        return bytes.fromhex(h).decode("utf-8", "replace").strip() or None
    except Exception:
        return None


def decode_currency(code: str) -> str:
    if len(code) == 40:
        try:
            return bytes.fromhex(code).rstrip(b"\x00").decode("utf-8", "replace")
        except Exception:
            return code
    return code


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.replace("Ø", "o")).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def text_of(body: bytes) -> str:
    t = body.decode("utf-8", "replace")
    return htmlmod.unescape(re.sub(r"<[^>]+>", " ", t)).lower()


def stage(out_dir: Path, name: str, leaf: dict) -> dict:
    """Write one UNSIGNED card-v0 atom in canonical bytes. Halts loud over the cap."""
    payload = leaf["payload"]
    praw = canonical(payload)
    card = {
        "as_of": leaf["as_of"],
        "did_intended": DID_INTENDED,
        "payload": payload,
        "schema": SCHEMA,
        "sha256": sha256(praw),
        "sig_ed25519": None,
        "source_urls": leaf["source_urls"],
        "subject": leaf["subject"],
        "surface": "public.notice",
        "tags": leaf["tags"],
        "unmeasured": leaf["unmeasured"],
    }
    craw = canonical(card)
    if len(praw) > CAP or len(craw) > CAP:
        raise SystemExit(f"HALT {name}: payload {len(praw)}B card {len(craw)}B > {CAP}B — it is a tape, not a card")
    m = VERDICT_RE.search(craw.decode("utf-8"))
    if m:
        raise SystemExit(f"HALT {name}: verdict word {m.group(0)!r} on card")
    (out_dir / f"card-{name}-unsigned.json").write_bytes(craw)
    return {"file": f"card-{name}-unsigned.json", "sha256": card["sha256"], "bytes": len(craw), "state": payload.get("state"), "axes": payload.get("axes")}


# ------------------------------------------------------------------ XRPL 16
def xrpl_cards(out_dir: Path, reader: dict, wk: dict, mirrors: Path) -> list[dict]:
    idx = {}
    for row in wk.get("rows") or []:
        idx[row.get("account")] = row
    staged = []
    acct_cache: dict[str, dict] = {}
    toml_cache: dict[str, dict] = {}
    for a in reader["assets"]:
        sym, addr = a["symbol"], a["issuer_address"]
        if addr not in acct_cache:
            src, res = rpc("account_info", {"account": addr, "ledger_index": "validated"})
            ad = res.get("account_data") or {}
            gsrc, gres = rpc("gateway_balances", {"account": addr, "ledger_index": "validated"})
            acct_cache[addr] = {"src": src, "ledger_index": res.get("ledger_index"), "ad": ad, "obligations": gres.get("obligations") or {}, "gsrc": gsrc, "err": res.get("error") if not ad else None}
        ac = acct_cache[addr]
        ad = ac["ad"]
        flags_int = ad.get("Flags")
        domain = decode_hex_domain(ad.get("Domain"))
        unmeasured = ["holders (account_lines not paginated this run; reader value cited, not recomputed)"]
        checked = ["account_info.Domain (validated ledger)", "gateway_balances.obligations", "xrpscan well-known directory"]
        absent: list[str] = []
        toml_block = None
        two_way, reason = "UNCHECKABLE", "account_info unreachable"
        if ad:
            if domain:
                dom = domain if domain.startswith("http") else "https://" + domain
                turl = dom.rstrip("/") + "/.well-known/xrp-ledger.toml"
                if turl not in toml_cache:
                    toml_cache[turl] = fetch(turl, accept="application/toml,text/plain,*/*")
                    t = toml_cache[turl]
                    if t["http"] == 200:
                        (mirrors / f"{slug(urllib.parse.urlparse(turl).netloc)}.xrp-ledger.toml").write_bytes(t["body"])
                t = toml_cache[turl]
                checked.append(f"GET {turl}")
                if t["http"] == 200:
                    body = t["body"].decode("utf-8", "replace")
                    is_toml = "html" not in t["content_type"].lower() and not body.lstrip().lower().startswith("<!doctype")
                    listed = sorted(set(re.findall(r'(?:address|issuer)\s*=\s*"(r[1-9A-HJ-NP-Za-km-z]{24,34})"', body)))
                    toml_block = {"url": turl, "http": 200, "content_type": t["content_type"][:40], "n_bytes": t["n_bytes"], "sha256": t["sha256"], "fetched_at": t["fetched_at"], "is_toml": is_toml, "accounts_listed_n": len(listed), "issuer_address_listed": addr in listed}
                    if not is_toml:
                        two_way, reason = "FAIL", "domain answers with HTML, not a TOML document"
                        absent.append("TOML body at .well-known/xrp-ledger.toml")
                    elif addr in listed:
                        two_way, reason = "PASS", "on-ledger Domain -> TOML lists this issuer address"
                    else:
                        two_way, reason = "FAIL", "TOML fetched but does not list this issuer address"
                        absent.append(f"{addr} in TOML [[ACCOUNTS]]/[[TOKENS]]")
                else:
                    toml_block = {"url": turl, "http": t["http"], "error": t["error"], "fetched_at": t["fetched_at"]}
                    two_way, reason = "UNCHECKABLE", f"TOML not retrievable (HTTP {t['http'] or 0}); never counted as FAIL"
                    skip("UNCHECKABLE", turl, t["error"] or f"HTTP {t['http']}")
            else:
                two_way, reason = "FAIL", "no Domain field on the AccountRoot; two-way check has no first leg"
                absent.append("AccountRoot.Domain")
        else:
            skip("UNMEASURED", f"account_info {addr}", ac["err"] or "rpc")
            unmeasured.append("account_root (rpc unreachable this run)")
        # Directory (XRPScan) leg — one-way only; never converts a FAIL into a PASS.
        d = idx.get(addr)
        directory = {"url": XRPSCAN_WELLKNOWN, "sha256": wk.get("sha256"), "fetched_at": wk.get("fetched_at"), "listed": bool(d)}
        if d:
            directory.update({"name": d.get("name"), "domain": d.get("domain")})
        dir_toml = None
        if not domain and d and d.get("domain"):
            ddom = "https://" + d["domain"].split("/")[0]
            durl = ddom + "/.well-known/xrp-ledger.toml"
            if durl not in toml_cache:
                toml_cache[durl] = fetch(durl, accept="application/toml,text/plain,*/*")
            t = toml_cache[durl]
            checked.append(f"GET {durl} (directory domain, one-way probe)")
            if t["http"] == 200:
                body = t["body"].decode("utf-8", "replace")
                is_toml = "html" not in t["content_type"].lower() and not body.lstrip().lower().startswith("<!doctype")
                listed = sorted(set(re.findall(r'(?:address|issuer)\s*=\s*"(r[1-9A-HJ-NP-Za-km-z]{24,34})"', body)))
                dir_toml = {"url": durl, "http": 200, "is_toml": is_toml, "sha256": t["sha256"], "n_bytes": t["n_bytes"], "issuer_address_listed": addr in listed, "fetched_at": t["fetched_at"]}
                if is_toml:
                    (mirrors / f"{slug(urllib.parse.urlparse(durl).netloc)}.xrp-ledger.toml").write_bytes(t["body"])
                else:
                    absent.append(f"TOML body at {durl} (HTML returned)")
            else:
                dir_toml = {"url": durl, "http": t["http"], "error": t["error"], "fetched_at": t["fetched_at"]}
                absent.append(f"TOML at {durl} (HTTP {t['http'] or 0})")
                skip("UNCHECKABLE", durl, t["error"] or f"HTTP {t['http']}")
        # On-chain obligation for this symbol.
        want = {"EURØP": ("EURØP", "EUROP")}.get(sym, (sym.split(".")[0],))
        obligation = None
        for code, val in (ac["obligations"] or {}).items():
            if decode_currency(code) in want:
                obligation = {"currency_code": code, "currency_decoded": decode_currency(code), "value": str(val), "method": "gateway_balances.obligations (validated ledger)", "ledger_index": ac["ledger_index"], "rpc": ac["gsrc"]}
        if obligation is None:
            unmeasured.append("onchain_obligation (currency not present in gateway_balances this run)")
        fetched_at = (toml_block or {}).get("fetched_at") or now_iso()
        payload = {
            "kind": "csoai.eater.xrpl-issuer/0.1",
            "axes": ["xrpl-issuers", "distribution-integrity"],
            "state": "PROBED" if ad else "UNMEASURED",
            "symbol": sym,
            "issuer": a.get("issuer"),
            "issuer_address": addr,
            "two_way_domain": two_way,
            "two_way_reason": reason,
            "checked": checked,
            "absent": absent,
            "account_root": ({"ledger_index": ac["ledger_index"], "rpc": ac["src"], "flags": flags_int, "flags_decoded": {k: bool(flags_int & v) for k, v in LSF.items()} if flags_int is not None else None, "domain_hex": ad.get("Domain"), "domain": domain, "sequence": ad.get("Sequence")} if ad else None),
            "toml": toml_block,
            "directory": directory,
            "directory_domain_toml": dir_toml,
            "onchain_obligation": obligation,
            "reader": {"url": READER, "as_of": reader.get("as_of"), "supply": a.get("supply"), "holders": a.get("holders"), "verified_via": a.get("verified_via"), "sig_ed25519_present": bool(a.get("sig_ed25519")), "unmeasured": a.get("unmeasured") or []},
            "method_id": METHOD_ID,
            "fetched_at": fetched_at,
            "not_a_grade": True,
            "writes_board": False,
            "unmeasured": unmeasured,
        }
        payload["inputs_sha256"] = sha256(canonical({"account_root": payload["account_root"], "toml": toml_block, "directory": directory, "obligation": obligation}))
        srcs = [READER, XRPSCAN_WELLKNOWN] + ([toml_block["url"]] if toml_block else []) + ([dir_toml["url"]] if dir_toml else [])
        leaf = {
            "as_of": fetched_at,
            "subject": f"XRPL {sym} ({a.get('issuer')}) two-way domain {two_way} + on-chain obligation",
            "source_urls": srcs,
            "payload": payload,
            "unmeasured": unmeasured,
            "tags": ["eater:xrpl-swift", "axis:xrpl-issuers", "axis:distribution-integrity", f"two-way:{two_way}", "unsigned"],
        }
        staged.append(stage(out_dir, "xrpl-" + slug(sym), leaf))
    return staged


# ------------------------------------------------------------------ SWIFT 26
def swift_cards(out_dir: Path, census: dict) -> list[dict]:
    bodies: dict[str, dict] = {}
    for sid, s in census["sources"].items():
        f = fetch(s["url"], timeout=25, accept="text/html,*/*")
        bodies[sid] = f
        if f["http"] != 200:
            skip("UNCHECKABLE", s["url"], f["error"] or f"HTTP {f['http']}")
    staged = []
    names = [r["name"] for r in census["rows"]]
    for r in census["rows"]:
        srcs = []
        any_named = False
        any_fetched = False
        for sid in r["source"]:
            s = census["sources"][sid]
            f = bodies[sid]
            entry = {"id": sid, "url": s["url"], "published": s.get("date"), "http": f["http"], "fetched_at": f["fetched_at"]}
            if f["http"] == 200:
                any_fetched = True
                text = text_of(f["body"])
                named = re.search(r"\b" + re.escape(r["name"].lower()) + r"\b", text) is not None
                any_named = any_named or named
                entry.update({"sha256": f["sha256"], "n_bytes": f["n_bytes"], "named_in_body": "PASS" if named else "FAIL"})
            else:
                entry.update({"sha256": None, "n_bytes": None, "named_in_body": "UNCHECKABLE", "error": f["error"]})
            srcs.append(entry)
        state = "PROBED" if any_named else ("DISCOVERED" if not any_fetched else "PROBED")
        fetched_at = max(e["fetched_at"] for e in srcs)
        unmeasured = ["iso20022_message", "settlement_rail_bytes", "on_ledger_object", "transaction_recompute"]
        if not any_fetched:
            unmeasured.append("press_body (all cited bodies unreachable this run)")
        payload = {
            "kind": "csoai.eater.swift-rail/0.1",
            "axes": ["swift-rails"],
            "state": state,
            "bank": r["name"],
            "bank_id": r["id"],
            "census_status": r["status"],
            "census_as_of": census.get("as_of"),
            "event_date": r.get("event_date"),
            "sources": srcs,
            "named_in_fetched_body_n": sum(1 for e in srcs if e["named_in_body"] == "PASS"),
            "match_pattern": "case-insensitive whole-word match of the census bank name in tag-stripped HTML",
            "not_a_client": True,
            "not_a_grade": True,
            "settlement_still_off_chain": True,
            "writes_board": False,
            "method_id": METHOD_ID,
            "fetched_at": fetched_at,
            "unmeasured": unmeasured,
        }
        payload["inputs_sha256"] = sha256(canonical([{k: e.get(k) for k in ("url", "sha256", "named_in_body")} for e in srcs]))
        leaf = {
            "as_of": fetched_at,
            "subject": f"Swift shared-ledger census: {r['name']} — {r['status']}; named in {payload['named_in_fetched_body_n']}/{len(srcs)} fetched notice bodies",
            "source_urls": [SWIFT] + [e["url"] for e in srcs],
            "payload": payload,
            "unmeasured": unmeasured,
            "tags": ["eater:xrpl-swift", "axis:swift-rails", f"census:{r['status'].lower()}", "not-a-client", "unsigned"],
        }
        staged.append(stage(out_dir, "swift-" + slug(r["id"]), leaf))
    return staged


# ------------------------------------------------------------------ issuer disclosure (reserve / cadence / custody / regulatory)
MONTH_RX = r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"


def filename_of(href: str) -> str:
    return urllib.parse.unquote(htmlmod.unescape(href)).rsplit("/", 1)[-1]


def month_of(href: str) -> tuple[int, int] | None:
    """(year, month) parsed from a PDF filename; 2-digit years read as 20yy. None when absent."""
    u = filename_of(href).lower()
    m = re.search(MONTH_RX + r"[^0-9a-z]{0,4}(20\d\d|\d\d)(?![0-9])", u) or re.search(r"(20\d\d)[^0-9a-z]{0,4}" + MONTH_RX + r"(?![a-z])", u)
    if not m:
        return None
    a, b = m.group(1), m.group(2)
    mon, yr = (a, b) if a[:3] in MONTHS else (b, a)
    y = int(yr) if len(yr) == 4 else 2000 + int(yr)
    return (y, MONTHS[mon[:3]])


def parse_months(hrefs: list[str]) -> list[tuple[int, int]]:
    return sorted({d for d in (month_of(h) for h in hrefs) if d})


def disclosure_cards(out_dir: Path) -> list[dict]:
    staged = []
    for issuer, spec in DISCLOSURE_PAGES.items():
        pages = []
        pdf_all: list[str] = []
        attest_pdfs: list[str] = []
        hits = {k: 0 for k in LEXICON}
        fetched_ok = False
        for url in spec["pages"]:
            f = fetch(url, accept="text/html,*/*")
            p = {"url": url, "http": f["http"], "fetched_at": f["fetched_at"], "robots": f["robots"]}
            if f["http"] == 200 and f["n_bytes"] > 0:
                raw = f["body"].decode("utf-8", "replace")
                shell = f["n_bytes"] < 12000 and len(re.sub(r"<[^>]+>", " ", raw).strip()) < 600
                p.update({"sha256": f["sha256"], "n_bytes": f["n_bytes"], "body_state": "SHELL" if shell else "HASHED"})
                if shell:
                    p["note"] = "response is a script shell; content is rendered client-side and was not executed"
                    skip("UNCHECKABLE", url, "HTML shell (client-side rendered); facts not derivable from bytes")
                else:
                    fetched_ok = True
                    text = text_of(f["body"])
                    for k, rx in LEXICON.items():
                        hits[k] += len(re.findall(rx, text, re.I))
                    for h in re.findall(r'href=["\']([^"\']+\.pdf[^"\']*)', raw, re.I):
                        full = urllib.parse.urljoin(f["final_url"], h)
                        if full not in pdf_all:
                            pdf_all.append(full)
                            if re.search(spec["pdf_filter"], filename_of(full), re.I):
                                attest_pdfs.append(full)
            else:
                # 202 + meta refresh = bot gate (not bypassed); 4xx/5xx/timeout = unreachable.
                gate = f["http"] == 202 or b"sgcaptcha" in f["body"][:400]
                p.update({"sha256": None, "n_bytes": f["n_bytes"] if f["http"] else None, "body_state": "BOT_GATE" if gate else "UNREACHABLE", "error": f["error"]})
                skip("UNCHECKABLE", url, "bot gate / captcha challenge (not bypassed)" if gate else (f["error"] or f"HTTP {f['http']}"))
            pages.append(p)
        attest_pdfs.sort(key=lambda h: month_of(h) or (0, 0))
        months = parse_months(attest_pdfs)
        cadence = None
        if months:
            gaps = [(b[0] - a[0]) * 12 + (b[1] - a[1]) for a, b in zip(months, months[1:])]
            cadence = {"dated_reports_n": len(months), "first": f"{months[0][0]}-{months[0][1]:02d}", "last": f"{months[-1][0]}-{months[-1][1]:02d}", "max_gap_months": max(gaps) if gaps else None, "consecutive_monthly": bool(gaps) and max(gaps) == 1, "basis": "year+month parsed from attestation PDF link filenames on the fetched page (2-digit years read as 20yy); bodies not opened"}
        state = "PROBED" if fetched_ok else "UNMEASURED"
        unmeasured = ["attestation_pdf_bodies (not opened)", "reserve_composition", "custodian_confirmation (name presence only)", "regime_confirmation (term presence only)", "risk_verdict (counsel)"]
        if not fetched_ok:
            unmeasured.append("disclosure_page (no readable body this run)")
        fetched_at = max(p["fetched_at"] for p in pages)
        payload = {
            "kind": "csoai.eater.issuer-disclosure/0.1",
            "axes": ["reserve-attestation", "stablecoin-attestation-cadence", "custody-disclosure", "regulatory-framework"],
            "state": state,
            "issuer": issuer,
            "symbols": spec["symbols"],
            "pages": pages,
            "pdf_links_n": len(pdf_all),
            "attestation_pdf_links_n": len(attest_pdfs),
            "attestation_pdf_filter": spec["pdf_filter"],
            "attestation_pdf_latest": attest_pdfs[-3:] if attest_pdfs else [],
            "cadence": cadence,
            "attestation_pdf_undated_n": sum(1 for h in attest_pdfs if month_of(h) is None),
            "term_hits": hits,
            "term_lexicon": {k: v[:80] for k, v in LEXICON.items()},
            "method_id": METHOD_ID,
            "fetched_at": fetched_at,
            "not_a_grade": True,
            "writes_board": False,
            "unmeasured": unmeasured,
        }
        # Keep the latest-links list short enough for the cap.
        while len(canonical(payload)) > CAP - 700 and payload["attestation_pdf_latest"]:
            payload["attestation_pdf_latest"].pop(0)
        payload["inputs_sha256"] = sha256(canonical([{k: p.get(k) for k in ("url", "sha256")} for p in pages]))
        leaf = {
            "as_of": fetched_at,
            "subject": f"{issuer} disclosure page facts: {len(attest_pdfs)} attestation PDF links, term hits, cadence — {state}",
            "source_urls": [p["url"] for p in pages],
            "payload": payload,
            "unmeasured": unmeasured,
            "tags": ["eater:xrpl-swift", "axis:reserve-attestation", "axis:stablecoin-attestation-cadence", "axis:custody-disclosure", "axis:regulatory-framework", "unsigned"],
        }
        staged.append(stage(out_dir, "disclosure-" + slug(issuer), leaf))
    return staged


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    args = ap.parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    mirrors = out_dir / "mirrors"
    mirrors.mkdir(exist_ok=True)
    for old in out_dir.glob("card-*-unsigned.json"):
        old.unlink()

    r = fetch(READER, accept="application/json")
    if r["http"] != 200:
        raise SystemExit(f"HALT reader {READER} HTTP {r['http']} — no roster, no run")
    reader = json.loads(r["body"])
    if reader.get("n") != 16 or len(reader.get("assets") or []) != 16:
        raise SystemExit("HALT reader n != 16 — catalogue drifted, refuse")
    s = fetch(SWIFT, accept="application/json")
    if s["http"] != 200:
        raise SystemExit(f"HALT census {SWIFT} HTTP {s['http']}")
    census = json.loads(s["body"])
    w = fetch(XRPSCAN_WELLKNOWN, accept="application/json")
    wk = {"rows": json.loads(w["body"]) if w["http"] == 200 else [], "sha256": w["sha256"], "fetched_at": w["fetched_at"]}
    if w["http"] != 200:
        skip("UNCHECKABLE", XRPSCAN_WELLKNOWN, f"HTTP {w['http'] or 0}")

    staged = []
    staged += xrpl_cards(out_dir, reader, wk, mirrors)
    staged += swift_cards(out_dir, census)
    staged += disclosure_cards(out_dir)
    skip("SKIPPED", "benji (all chains)", "sibling lane public/interop/benji-onchain-supply-2026-09 already stages 9 unsigned benji.onchain.supply cards; not duplicated here")

    (out_dir / "SKIPLOG.txt").write_text("# state\turl\treason  (one line per source this lane could not turn into a fact)\n" + "\n".join(SKIPLOG) + "\n", encoding="utf-8")
    manifest = {
        "schema": "csoai.eater.artefact-manifest/0.1",
        "lane": "xrpl-swift-eater-2026-09",
        "method_id": METHOD_ID,
        "as_of": now_iso(),
        "writes_board": False,
        "sig_ed25519": None,
        "sign_path": "scripts/adapters/staged_leaves.py -> scripts/publish_public_root.py (GHA public-root.yml) -> public/root.json -> scripts/witness_public_root.py",
        "cards": staged,
        "fetches": MANIFEST,
        "skipped": SKIPLOG,
    }
    (out_dir / "artefact-manifest.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    by_state: dict[str, int] = {}
    for c in staged:
        by_state[c["state"]] = by_state.get(c["state"], 0) + 1
    print(f"staged {len(staged)} cards (max {max(c['bytes'] for c in staged)}B) states={by_state} skipped={len(SKIPLOG)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
