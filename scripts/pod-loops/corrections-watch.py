#!/usr/bin/env python3
"""corrections-watch: the daily re-check behind "Corrections that did not travel".

Runs on oracle-micro-2 (cron 10 6 * * *). No GitHub anywhere in the loop: the row set is READ from the
Hugging Face mirror (v0.2, never edited), every cited page is re-fetched with a browser user-agent, the stale
string and the corrected string are looked for verbatim in the served bytes, and the result is published to
the PUBLIC evidence dataset under public/interop/corrections-watch/ (one dated file per day + latest.json):
    https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/public/interop/corrections-watch/
A copy of the same files goes to the mirror as well. Every public link to the results points at the evidence
dataset, never at the mirror (the mirror was private from 29 Sep 2026 and anonymous readers got 401).

    corrections-watch.py                 # fetch, probe, write, upload
    corrections-watch.py --no-upload     # fetch, probe, write only (dry)
    corrections-watch.py --out DIR       # override the output directory

Measure, never certify. A page is recorded as what its bytes contained at fetch time; nothing here
says why. UNMEASURED / UNCHECKABLE are first-class values: a non-200 or a fetch error is never
counted as "corrected" and never counted as "stale".

Controls: every run first proves the presence predicate can fail and can pass (a nonsense token
must be ABSENT, a known string must be PRESENT) on the same code path used for the rows, and the
same again on the PDF-extraction path. If any control misbehaves the run aborts before writing.
"""
import argparse, datetime as dt, hashlib, html, io, json, os, re, socket, subprocess, sys, time
from pathlib import Path

import requests

MIRROR = "https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/"
REPO_ID = "csoai/councilof-ai-mirror"            # copy only; its visibility has changed (private 29 Sep 2026)
PUBLIC_REPO_ID = "csoai/councilof-ai-evidence"   # public; THE home of the results and of every public link to them
V02_PATH = "public/interop/corrections-that-did-not-travel-2026-09-17-v0.2.json"
V03_PATH = "public/interop/corrections-that-did-not-travel-2026-09-22-v0.3.json"
FOLDER = "public/interop/corrections-watch"
PUBLIC_RESULTS = f"https://huggingface.co/datasets/{PUBLIC_REPO_ID}/resolve/main/{FOLDER}/"
NOTIFICATION_DATE = dt.date(2026, 9, 17)
SCHEMA = "csoai.corrections-watch/0.1"
# 2026-09-28 (lane L1): moved from the 3090 pod (no HF token there since the transfer-mode restart, rc=3 from 25 Sep) to
# oracle-micro-2, which holds the board-sign pod token. Each dated file is signed via POST /api/board-sign (pod caller
# token, venturi_capsule.py sign) and OTS-stamped BEFORE upload; a signing failure uploads nothing and exits 1.
VC = os.path.expanduser("~/lanes/venturi-capsule-20260926/venturi_capsule.py")
SIGNER = "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)"
UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}
TIMEOUT = 90
NONSENSE = "zq7-vortex-plumbago-90311-qxv"  # guaranteed absent from any real page

# Verbatim probe strings per page. Keyed by the v0.2 downstream_url so the row set itself still
# comes from the published file; this table only says WHICH bytes to look for. Where v0.2's
# downstream_value_now is a paraphrase ("the original, superseded index entries on page x") the
# fragments were chosen from the bytes the author saw on 2026-09-17/22 and are recorded per row.
# corrected: None means no single corrected string can exist on that page (withdrawal / ranking
# flip); the reason is recorded and corrected_string_present is null, never false.
PROBES = {
    "https://deploymentsafety.openai.com/gpt-5-5/cybersecurity": {
        "stale": ["1/10 attempts"], "corrected": ["2/10", "2 of 10"], "corrected_rule": "any",
        "page_owner": "OpenAI", "notification": "DELIVERED"},
    "https://arcprize.org/blog/r1-zero-r1-results-analysis": {
        "stale": ["$20", "$3.4K"], "corrected": ["$26", "$4,560"], "corrected_rule": "all",
        "page_owner": "ARC Prize", "notification": "DELIVERED"},
    "https://raw.githubusercontent.com/mlcommons/inference_results_v5.0/main/summary_results.json": {
        "stale": ["573.765", "5.0-0078"], "corrected": None,
        "corrected_reason": "correction is a withdrawal; the corrected state is the ABSENCE of the stale row",
        "page_owner": "MLCommons", "notification": "NOT_NOTIFIED"},
    "https://metr.substack.com/p/2026-01-19-early-work-on-monitorability-evaluations": {
        "stale": ["catch rate is 30%", "88%"], "corrected": ["52%", "80%"], "corrected_rule": "all",
        "page_owner": "METR", "notification": "DELIVERED"},
    "https://arxiv.org/html/2511.23455v2": {
        "stale": ["$3,000 per task"], "corrected": ["$4,560"], "corrected_rule": "all",
        "page_owner": "arXiv 2511.23455 authors", "notification": "NOT_NOTIFIED"},
    "https://techcrunch.com/2025/04/02/openais-o3-model-might-be-costlier-to-run-than-originally-estimated/": {
        "stale": ["$30,000 per task"], "corrected": ["$4,560"], "corrected_rule": "all",
        "page_owner": "TechCrunch", "notification": "NOT_NOTIFIED"},
    "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-2e2025.pdf": {
        "stale": ["NISTAML.013", "NISTAML.015", "NISTAML.018"], "corrected": ["NISTAML.016", "NISTAML.017"], "corrected_rule": "all",
        "page_owner": "NIST", "notification": "NOT_NOTIFIED"},
    "https://www.amd.com/en/blogs/2024/engineering-insights-unveiling-mlperf-results-on.html": {
        "stale": ["4.1-0070"], "corrected": None,
        "corrected_reason": "correction is a withdrawal; the corrected state is the ABSENCE of the submission id",
        "page_owner": "AMD", "notification": "NOT_NOTIFIED"},
    "https://aithority.com/machine-learning/untether-ai-announces-speedai-accelerator-cards-": {
        "stale": ["70,348"], "corrected": None,
        "corrected_reason": "correction is a withdrawal; the corrected state is the ABSENCE of the figure",
        "page_owner": "aithority.com", "notification": "NOT_NOTIFIED"},
    "https://huggingface.co/search/full-text?q=%22DROP+(3-shot)%22&type=model": {
        "stale": ["DROP (3-shot)"], "corrected": None,
        "corrected_reason": "correction is a benchmark withdrawal; the measure is the full-text hit count (see hf_drop_3shot)",
        "page_owner": "Hugging Face", "notification": "DELIVERED"},
    "https://labs.scale.com/leaderboard/mcp_atlas": {
        "stale": ["62.3%"], "corrected": ["69.8"], "corrected_rule": "all",
        "page_owner": "Scale AI", "notification": "BOUNCED"},
    "https://www.vals.ai/": {
        "stale": ["99%", "$8.80"], "corrected": ["100%", "$9.35"], "corrected_rule": "all",
        "page_owner": "Vals AI", "notification": "DELIVERED"},
    "https://livebench.ai/livebench.pdf": {
        "stale": ["Contamination-Free", "110B", "below 65%"], "corrected": ["Contamination-Limited", "405B"], "corrected_rule": "all",
        "page_owner": "LiveBench", "notification": "DELIVERED"},
    "https://huggingface.co/tiiuae/falcon-40b": {
        "stale": ["best open-source model currently available", "Falcon-40B outperforms"], "corrected": None,
        "corrected_reason": "correction is a ranking flip; no single corrected string exists for this page",
        "page_owner": "TII (model card hosted on Hugging Face)", "notification": "NOT_NOTIFIED"},
    "https://sam-solutions.com/blog/falcon-llm-architecture/": {
        "stale": ["Falcon-40B outscored LLaMA-65B"], "corrected": None,
        "corrected_reason": "correction is a ranking flip; no single corrected string exists for this page",
        "page_owner": "SaM Solutions", "notification": "NOT_NOTIFIED"},
}


def utcnow():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def hf_token():
    """HF write token: $HF_TOKEN, else ~/.secrets/hf_token (Oracle), else the pod key helper. Never printed."""
    if os.environ.get("HF_TOKEN"):
        return os.environ["HF_TOKEN"].strip() or None
    try:
        return Path(os.path.expanduser("~/.secrets/hf_token")).read_text().strip() or None
    except Exception:
        pass
    try:
        out = subprocess.run([sys.executable, "/workspace/tools/csoai_keys.py", "--key", "HF_TOKEN"],
                             capture_output=True, text=True, timeout=30)
        return out.stdout.strip() or None
    except Exception:
        return None


def fetch(url):
    """One GET with a browser UA. Returns (response|None, error|None, elapsed_s).
    The HF token is attached ONLY for our own mirror (private since 29 Sep); never for probed pages."""
    t = time.time()
    headers = dict(UA)
    if url.startswith(MIRROR):
        tok = hf_token()
        if tok:
            headers["Authorization"] = f"Bearer {tok}"
    try:
        r = requests.get(url, headers=headers, timeout=TIMEOUT, allow_redirects=True)
        return r, None, round(time.time() - t, 2)
    except Exception as e:
        return None, f"{type(e).__name__}: {str(e)[:200]}", round(time.time() - t, 2)


def extract_text(resp):
    """The text the probes run over, and how it was made. Raw bytes, HTML-unescaped, whitespace
    collapsed for HTML; pypdf page text for PDFs. Never a rendered DOM, never a search summary."""
    ct = (resp.headers.get("content-type") or "").lower()
    if "pdf" in ct or resp.content[:5] == b"%PDF-":
        from pypdf import PdfReader
        rd = PdfReader(io.BytesIO(resp.content))
        text = "\n".join((p.extract_text() or "") for p in rd.pages)
        return re.sub(r"\s+", " ", text), "pdf-text (pypdf, %d pages)" % len(rd.pages)
    text = resp.content.decode(resp.encoding or "utf-8", errors="replace")
    return re.sub(r"\s+", " ", html.unescape(text)), "html (bytes decoded, entities unescaped, whitespace collapsed)"


def present(text, needle):
    """THE predicate. Verbatim substring on the normalised text. Controls exercise exactly this."""
    return re.sub(r"\s+", " ", needle) in text


def run_controls():
    """Abort-worthy checks. Each returns the observed value so the file records what was seen."""
    results = {}
    r, err, _ = fetch("https://example.com/")
    if r is None or r.status_code != 200:
        return {"verdict": "ABORT", "reason": f"control page unreachable: {err or r.status_code}"}, False
    text, how = extract_text(r)
    absent = present(text, NONSENSE)
    pres = present(text, "Example Domain")
    results["html_absent"] = {"page": "https://example.com/", "needle": NONSENSE, "expected": False, "observed": absent}
    results["html_present"] = {"page": "https://example.com/", "needle": "Example Domain", "expected": True, "observed": pres}
    ok = (absent is False) and (pres is True)
    results["verdict"] = "PASS" if ok else "ABORT"
    return results, ok


def pdf_controls(text, source_url):
    """Run on the first PDF fetched in the row loop: nonsense must be absent; a word taken from the
    extraction itself must be present. Proves the predicate, on the PDF path, can fail and can pass."""
    m = re.search(r"[A-Za-z]{5,}", text)
    word = m.group(0) if m else None
    absent = present(text, NONSENSE)
    pres = present(text, word) if word else None
    ok = (absent is False) and (pres is True)
    return {"page": source_url, "absent_needle": NONSENSE, "absent_observed": absent,
            "present_needle": word, "present_observed": pres, "verdict": "PASS" if ok else "ABORT"}, ok


def probe_row(idx, row, today):
    url = row["downstream_url"]
    p = PROBES.get(url)
    if p is None:
        # Row not in the probe table (v0.2 is never edited, so this means a new file shape): fall back
        # to v0.2's own strings, split on " ... ", and say so. Never invent.
        p = {"stale": [s.strip() for s in row["downstream_value_now"].split("...") if s.strip()],
             "corrected": [row["corrected_value"]], "corrected_rule": "all", "page_owner": None,
             "notification": "UNKNOWN", "probe_source": "fallback: v0.2 downstream_value_now split on '...'"}
    out = {
        "row": idx,
        "corrector": row["corrector"],
        "downstream_citer": row["downstream_citer"],
        "page": url,
        "page_owner": p.get("page_owner"),
        "citer_is_the_corrector": row.get("citer_is_the_corrector"),
        "original_value": row["original_value"],
        "corrected_value": row["corrected_value"],
        "correction_date": row["correction_date"],
        "v02_first_observed_utc": row.get("downstream_fetched_utc"),
        "notification_2026_09_17": p.get("notification"),
        "stale_probe": p["stale"],
        "corrected_probe": p.get("corrected"),
        "probe_source": p.get("probe_source", "verbatim fragments of the stale/corrected value as served; chosen from bytes seen 2026-09-17/22"),
    }
    resp, err, elapsed = fetch(url)
    out["fetched_at"] = utcnow()
    out["fetch_seconds"] = elapsed
    if resp is None:
        out.update({"http_status": None, "fetch_error": err, "stale_string_present": None,
                    "corrected_string_present": None, "state": "UNCHECKABLE",
                    "state_reason": "fetch failed; nothing about the page is known from this run"})
        return out, None
    out["http_status"] = resp.status_code
    out["final_url"] = resp.url
    out["content_type"] = resp.headers.get("content-type")
    out["content_length"] = len(resp.content)
    out["last_modified"] = resp.headers.get("last-modified")
    out["etag"] = resp.headers.get("etag")
    out["body_sha256"] = sha256(resp.content)
    if resp.status_code != 200:
        out.update({"stale_string_present": None, "corrected_string_present": None, "state": "UNCHECKABLE",
                    "state_reason": f"HTTP {resp.status_code}; the page was not served, so neither presence nor absence is measured"})
        return out, None
    try:
        text, how = extract_text(resp)
    except Exception as e:
        out.update({"extraction_error": f"{type(e).__name__}: {str(e)[:200]}", "stale_string_present": None,
                    "corrected_string_present": None, "state": "UNCHECKABLE",
                    "state_reason": "bytes were served but could not be turned into text"})
        return out, None
    out["extraction"] = how
    out["extracted_chars"] = len(text)
    stale_each = {s: present(text, s) for s in p["stale"]}
    out["stale_fragments"] = stale_each
    out["stale_string_present"] = all(stale_each.values())
    if p.get("corrected"):
        corr_each = {s: present(text, s) for s in p["corrected"]}
        out["corrected_fragments"] = corr_each
        rule = p.get("corrected_rule", "all")
        out["corrected_rule"] = rule
        out["corrected_string_present"] = all(corr_each.values()) if rule == "all" else any(corr_each.values())
    else:
        out["corrected_string_present"] = None
        out["corrected_string_reason"] = p.get("corrected_reason")
    sp, cp = out["stale_string_present"], out["corrected_string_present"]
    if sp and cp:
        out["state"] = "BOTH_PRESENT"
    elif sp:
        out["state"] = "STALE_STILL_SERVED"
    elif cp:
        out["state"] = "CORRECTED_VALUE_SERVED_STALE_ABSENT"
    elif sp is False and cp is None:
        out["state"] = "STALE_ABSENT"
    else:
        out["state"] = "STALE_ABSENT_CORRECTED_ABSENT"
    out["days_since_v02_observation"] = (today - NOTIFICATION_DATE).days
    if sp and p.get("notification") == "DELIVERED":
        out["days_stale_since_notification"] = (today - NOTIFICATION_DATE).days
    elif sp:
        out["days_stale_since_notification"] = None
        out["days_stale_since_notification_reason"] = {
            "BOUNCED": "notification bounced; no delivery, no clock",
            "NOT_NOTIFIED": "page owner was not notified on 2026-09-17; no clock runs",
        }.get(p.get("notification"), "notification status unknown")
    else:
        out["days_stale_since_notification"] = None
        out["days_stale_since_notification_reason"] = "stale string not present in this fetch"
    if url.startswith("https://huggingface.co/search/full-text"):
        m = re.search(r"totalHits\W+(\d+)", text)
        out["hf_total_hits"] = int(m.group(1)) if m else None
    return out, (text if "pdf" in how else None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.environ.get("CW_OUT", "/workspace/lanes/out/corrections-watch"))
    ap.add_argument("--no-upload", action="store_true")
    a = ap.parse_args()
    outdir = Path(a.out); outdir.mkdir(parents=True, exist_ok=True)
    started = utcnow(); today = dt.datetime.now(dt.timezone.utc).date()

    # 1. Controls first. No file is written if the predicate cannot be trusted.
    controls, ok = run_controls()
    if not ok:
        print("ABORT controls:", json.dumps(controls)); return 2

    # 2. Read the row set from the mirror, never from disk, never from a hardcoded list.
    r, err, _ = fetch(MIRROR + V02_PATH)
    if r is None or r.status_code != 200:
        print("ABORT cannot read v0.2 from mirror:", err or r.status_code); return 3
    v02_bytes = r.content; v02 = json.loads(v02_bytes)
    rows_in = v02["did_not_travel"]
    r3, _, _ = fetch(MIRROR + V03_PATH)
    v03_sha = sha256(r3.content) if (r3 is not None and r3.status_code == 200) else None

    # 3. Re-fetch every page.
    rows, pdf_ctl = [], None
    for i, row in enumerate(rows_in):
        res, pdf_text = probe_row(i, row, today)
        rows.append(res)
        print(f"row {i:2d} {res['state']:<38} http={res.get('http_status')} stale={res.get('stale_string_present')} corr={res.get('corrected_string_present')} {res['page'][:70]}")
        if pdf_text and pdf_ctl is None:
            pdf_ctl, pdf_ok = pdf_controls(pdf_text, res["page"])
            if not pdf_ok:
                print("ABORT pdf controls:", json.dumps(pdf_ctl)); return 2
    controls["pdf"] = pdf_ctl or {"verdict": "UNMEASURED", "reason": "no PDF was served in this run"}

    # 4. The Hugging Face full-text count for "DROP (3-shot)" (the widest single instance in v0.2).
    hf = next((x for x in rows if "hf_total_hits" in x), None)
    hf_drop = {
        "query": 'full-text search "DROP (3-shot)", type=model',
        "url": "https://huggingface.co/search/full-text?q=%22DROP+(3-shot)%22&type=model",
        "fetched_at": hf["fetched_at"] if hf else None,
        "total_hits": hf.get("hf_total_hits") if hf else None,
        "kind": "measured" if (hf and hf.get("hf_total_hits") is not None) else "UNMEASURED",
        "prior": {"2026-09-17": 1332, "2026-09-22": 1334},
        "note": "totalHits as embedded in the served search page; the HF index is theirs, the count is what it reported at fetch time.",
    }

    # 5. Totals with every denominator spelled out.
    n = len(rows)
    served = [x for x in rows if x.get("http_status") == 200 and x.get("stale_string_present") is not None]
    delivered = [x for x in rows if x.get("notification_2026_09_17") == "DELIVERED"]
    totals = {
        "rows_in_v02": n,
        "rows_fetched_http_200": sum(1 for x in rows if x.get("http_status") == 200),
        "rows_measured": len(served),
        "rows_uncheckable": sum(1 for x in rows if x["state"] == "UNCHECKABLE"),
        "stale_still_served": sum(1 for x in served if x["stale_string_present"]),
        "stale_absent": sum(1 for x in served if x["stale_string_present"] is False),
        "both_values_present": sum(1 for x in served if x["state"] == "BOTH_PRESENT"),
        "corrected_value_present_where_a_corrected_string_exists": {
            "present": sum(1 for x in served if x.get("corrected_string_present") is True),
            "of": sum(1 for x in served if x.get("corrected_string_present") is not None)},
        "page_owner_notified_2026_09_17": {"delivered": len(delivered),
                                            "bounced": sum(1 for x in rows if x.get("notification_2026_09_17") == "BOUNCED"),
                                            "not_notified": sum(1 for x in rows if x.get("notification_2026_09_17") == "NOT_NOTIFIED")},
        "of_the_notified_still_stale": {"count": sum(1 for x in delivered if x.get("stale_string_present")), "of": len(delivered)},
        "days_since_notification": (today - NOTIFICATION_DATE).days,
        "states": {s: sum(1 for x in rows if x["state"] == s) for s in sorted({x["state"] for x in rows})},
    }

    doc = {
        "schema": SCHEMA,
        "kind": "measured",
        "signed": True,
        "signature": {"sidecar": "<run_date>.signed.json (latest.signed.json is the same sidecar: latest.json is byte-identical)",
                      "signer": SIGNER, "ots": "<run_date>.json.ots"},
        "title": "Corrections watch: daily re-check of the pages in 'Corrections that did not travel'",
        "run_date": today.isoformat(),
        "started_at": started,
        "generated_at": utcnow(),
        "run_host": {"kind": "Oracle VM", "hostname": socket.gethostname(), "scheduler": "cron 10 6 * * * ~/lanes/corrections-watch-oracle-20260928/run.sh"},
        "source": {
            "rows_from": MIRROR + V02_PATH, "v02_sha256": sha256(v02_bytes), "v02_as_of": v02.get("as_of"),
            "v03": MIRROR + V03_PATH, "v03_sha256": v03_sha,
            "note": "v0.2 and v0.3 are read, never written. This file adds a day, it does not amend them."},
        "notification_date": NOTIFICATION_DATE.isoformat(),
        "what_a_reader_sees": (
            "For each of the 15 pages that served a superseded number on 2026-09-17: what the same URL served today, "
            "whether the exact stale string is still in its bytes, whether the corrected string is, and how many days that "
            "has been true since the page owner was told. A row says what the bytes contained at fetched_at. It does not "
            "say why, and it does not say anyone did anything wrong."),
        "boundary": "measure, never certify. UNCHECKABLE rows are excluded from every numerator AND every denominator that counts presence.",
        "method": {
            "fetch": "one GET per page with a desktop-browser User-Agent, redirects followed, %ds timeout" % TIMEOUT,
            "text": "HTML: bytes decoded, entities unescaped, whitespace collapsed. PDF: pypdf page text. No rendered DOM, no search summaries.",
            "predicate": "verbatim substring of the normalised text; stale_string_present is true only if EVERY stale fragment is present",
            "corrected": "corrected_rule 'all' = every corrected fragment present; 'any' = at least one; null = no corrected string can exist on that page (withdrawal / ranking flip)",
            "days_stale_since_notification": "run_date minus 2026-09-17, populated only where the stale string is present AND the page owner's notification was delivered; otherwise null with a reason",
        },
        "controls": controls,
        "rows": rows,
        "hf_drop_3shot": hf_drop,
        "totals": totals,
        "method_limitations": [
            "A substring in raw bytes is not the same as a string a human sees: text hidden in markup counts as present, text drawn by JavaScript after load counts as absent.",
            "Short fragments ('88%', '100%', '64.2') can match unrelated text; that is why every fragment is reported individually and presence needs all of them.",
            "PDF text comes from pypdf and can split or join tokens; a PDF row reporting a fragment absent should be read alongside its content_length and last_modified.",
            "One fetch from one network location per day. A CDN variant, a geo variant or a login wall could serve different bytes elsewhere.",
            "Notification status is carried from v0.3; this loop does not send or receive mail and cannot see a reply.",
            "15 rows is the whole population of this file. It is not a sample of anything and no rate here generalises beyond these 15 pages.",
        ],
    }

    dated = outdir / f"{today.isoformat()}.json"
    latest = outdir / "latest.json"
    payload = json.dumps(doc, indent=1, ensure_ascii=False) + "\n"
    dated.write_text(payload, encoding="utf-8"); latest.write_text(payload, encoding="utf-8")
    with (outdir / "runs.jsonl").open("a") as f:
        f.write(json.dumps({"run_date": today.isoformat(), "generated_at": doc["generated_at"], "totals": totals,
                            "hf_total_hits": hf_drop["total_hits"], "controls": controls.get("verdict")}) + "\n")
    print("WROTE", dated, "and", latest, "| totals:", json.dumps(totals))
    signed = outdir / f"{today.isoformat()}.signed.json"
    s = subprocess.run([sys.executable, VC, "sign", "--file", str(dated), "--artifact-path", f"{FOLDER}/{today.isoformat()}.json"],
                       capture_output=True, text=True, timeout=120)
    if s.returncode != 0 or not signed.exists():
        doc["signed"] = False; doc.pop("signature", None)
        doc["unsigned_reason"] = f"board-sign failed at {utcnow()} (rc={s.returncode}); nothing uploaded"
        payload = json.dumps(doc, indent=1, ensure_ascii=False) + "\n"
        dated.write_text(payload, encoding="utf-8"); latest.write_text(payload, encoding="utf-8")
        print("ABORT sign failed rc=%d: %s" % (s.returncode, s.stderr[-300:])); return 1
    o = subprocess.run([sys.executable, VC, "ots", "--file", str(dated)], capture_output=True, text=True, timeout=180)
    (outdir / "latest.signed.json").write_bytes(signed.read_bytes())
    print("SIGNED", signed.name, "ots=" + ("STAMPED" if o.returncode == 0 else f"FAILED rc={o.returncode}"))

    if a.no_upload:
        print("NO-UPLOAD requested"); return 0
    tok = hf_token()
    if not tok:
        print("UNCHECKABLE no HF token ($HF_TOKEN, ~/.secrets/hf_token, csoai_keys.py); files stay in", outdir); return 3
    from huggingface_hub import HfApi, CommitOperationAdd
    api = HfApi(token=tok)
    ops = [CommitOperationAdd(path_in_repo=f"{FOLDER}/{today.isoformat()}.json", path_or_fileobj=str(dated)),
           CommitOperationAdd(path_in_repo=f"{FOLDER}/{today.isoformat()}.signed.json", path_or_fileobj=str(signed)),
           CommitOperationAdd(path_in_repo=f"{FOLDER}/latest.json", path_or_fileobj=str(latest)),
           CommitOperationAdd(path_in_repo=f"{FOLDER}/latest.signed.json", path_or_fileobj=str(outdir / "latest.signed.json"))]
    if (outdir / f"{today.isoformat()}.json.ots").exists():
        ops.append(CommitOperationAdd(path_in_repo=f"{FOLDER}/{today.isoformat()}.json.ots",
                                      path_or_fileobj=str(outdir / f"{today.isoformat()}.json.ots")))
    readme = Path(__file__).with_name("corrections-watch-README.md")
    if readme.is_file():
        ops.append(CommitOperationAdd(path_in_repo=f"{FOLDER}/README.md", path_or_fileobj=str(readme)))
    msg = f"corrections-watch {today.isoformat()}: {totals['stale_still_served']}/{totals['rows_measured']} stale still served; hf DROP hits {hf_drop['total_hits']}"
    # 2026-09-29 (FU-2): the public evidence dataset is where the results live and where every public link points.
    # It is written FIRST; if it fails the run fails (rc=4) and says so. The mirror copy is secondary: a failure
    # there is reported on its own line and does not hide a successful public publication.
    try:
        pinfo = api.create_commit(repo_id=PUBLIC_REPO_ID, repo_type="dataset", operations=ops, commit_message=msg)
    except Exception as e:
        print("ABORT public upload failed:", type(e).__name__, str(e)[:200]); return 4
    print("UPLOADED", pinfo.commit_url if hasattr(pinfo, "commit_url") else pinfo, "| read:", PUBLIC_RESULTS + "latest.json")
    try:
        mops = [CommitOperationAdd(path_in_repo=o.path_in_repo, path_or_fileobj=o.path_or_fileobj) for o in ops]
        info = api.create_commit(repo_id=REPO_ID, repo_type="dataset", operations=mops, commit_message=msg)
        print("MIRRORED", info.commit_url if hasattr(info, "commit_url") else info)
    except Exception as e:
        print("MIRROR-COPY-FAILED", type(e).__name__, str(e)[:200])
    return 0


if __name__ == "__main__":
    sys.exit(main())
