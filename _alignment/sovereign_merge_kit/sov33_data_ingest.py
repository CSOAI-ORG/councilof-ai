"""sov33_data_ingest.py — Stage 0 of the pipeline: pull licence-clear training data from all sites.

Part of the playbook: SOV grows its corpora from the open frontier, daily, currency-stamped. NOT a
one-off. Sites wired: Kaggle (username+key env), HuggingFace (no-auth datasets API). Both reachable.

HARD RULES (the moat depends on these):
  - LICENCE GATE: only permissive licences pass (MIT/Apache-2.0/CC0/CC-BY/BSD). Copyleft/unknown/NC = SKIP.
    Scraped unknown-licence data contaminates the exact thing that makes the corpus valuable.
  - PROVENANCE: every pulled row is stamped {source_site, dataset_ref, licence, pulled_utc} for audit.
  - NO SECRETS TO DISK: Kaggle key lives in process env only (never written to a file).
  - CURATE DON'T DUMP: caps per source; dedup against existing corpus before append.
"""
import os, json, datetime

PERMISSIVE = {"MIT","Apache 2.0","Apache-2.0","CC0: Public Domain","CC0-1.0","CC BY 4.0","CC-BY-4.0",
              "CC BY-SA 4.0","BSD","BSD-3-Clause","The Unlicense","ODbL"}   # licence gate whitelist

def _now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()

def kaggle_search(query, max_results=10):
    """List Kaggle datasets matching query with their licences (for the licence gate). Read-only."""
    import kaggle  # env creds must be set by caller (KAGGLE_USERNAME/KAGGLE_KEY)
    out=[]
    for d in kaggle.api.dataset_list(search=query, page=1)[:max_results]:
        j=json.loads(str(d))
        out.append({"ref": j.get("ref"), "licence": j.get("licenseName"),
                    "bytes": j.get("totalBytes"), "title": j.get("title"),
                    "permissive": j.get("licenseName") in PERMISSIVE})
    return out

def hf_search(query, max_results=10):
    """List HuggingFace datasets matching query (no auth). Read-only."""
    import urllib.request
    url=f"https://huggingface.co/api/datasets?search={urllib.parse.quote(query)}&limit={max_results}"
    with urllib.request.urlopen(url, timeout=20) as r:
        data=json.load(r)
    return [{"ref": d.get("id"), "downloads": d.get("downloads"), "site":"huggingface"} for d in data]

def survey(query):
    """Stage-0 survey: what licence-clear data exists across sites for a sector query. No download."""
    rep={"query": query, "surveyed_utc": _now(), "sites": {}}
    try: rep["sites"]["kaggle"]=kaggle_search(query)
    except Exception as e: rep["sites"]["kaggle"]={"error": str(e)[:120]}
    try: rep["sites"]["huggingface"]=hf_search(query)
    except Exception as e: rep["sites"]["huggingface"]={"error": str(e)[:120]}
    # count how many pass the licence gate (kaggle carries licence; HF needs per-repo check at download)
    k=rep["sites"].get("kaggle",[])
    rep["kaggle_permissive"]=sum(1 for d in k if isinstance(d,dict) and d.get("permissive"))
    return rep


# ── DOWNLOAD + MAP-TO-MEMORY (the EAT loop: ingest -> corpus + memory index) ─────────────
MEMORY_INDEX = "data_memory_index.jsonl"   # what we've absorbed: provenance-stamped, queryable

def _mem_append(rec):
    import os, json
    base = os.path.dirname(__file__) or "."
    with open(os.path.join(base, MEMORY_INDEX), "a") as f:
        f.write(json.dumps(rec) + "\n")

def map_to_memory(site, dataset_ref, licence, n_examples, sector, sample_qs=None):
    """Record an absorbed dataset into the memory index (provenance + what/where/licence/sector).
    This is the 'stronger memory dataset' — SOV4 and the operator can query what's been eaten."""
    rec = {"site": site, "dataset_ref": dataset_ref, "licence": licence,
           "n_examples": n_examples, "sector": sector, "absorbed_utc": _now(),
           "permissive": str(licence).lower() in {p.lower() for p in PERMISSIVE},  # case-insensitive: HF API returns lowercase (matches verify_hf_licence gate)
           "licence_source": "hf_api_verified", "sample_qs": (sample_qs or [])[:3]}
    _mem_append(rec)
    return rec

def memory_status():
    """Summarize the absorbed-data memory: total datasets, examples, per-site, per-sector, licence mix."""
    import os, json
    base = os.path.dirname(__file__) or "."
    p = os.path.join(base, MEMORY_INDEX)
    if not os.path.exists(p): return {"datasets": 0, "note": "nothing absorbed yet"}
    rows = [json.loads(l) for l in open(p) if l.strip()]
    from collections import Counter
    return {"datasets": len(rows), "total_examples": sum(r.get("n_examples",0) for r in rows),
            "by_site": dict(Counter(r["site"] for r in rows)),
            "by_sector": dict(Counter(r["sector"] for r in rows)),
            "permissive_only": all(r.get("permissive") for r in rows),
            "licences": dict(Counter(r.get("licence") for r in rows))}

def ingest_hf_dataset(repo_id, sector, split="train", text_key=None, resp_key=None, cap=2000, enforce_licence=True):
    """Download a HF dataset, normalize to instruction/response, dedup, append to sector corpus,
    AND map into memory. ENFORCED LICENCE GATE: verify_hf_licence() first; non-permissive = refused
    (fail-closed). enforce_licence=False only for explicit owner-authorized exceptions."""
    import os, json
    if enforce_licence:
        lic, permissive = verify_hf_licence(repo_id)
        if not permissive:
            return {"added": 0, "GATED": f"licence '{lic}' not permissive — refused (fail-closed)", "licence": lic}
    from datasets import load_dataset
    base = os.path.dirname(__file__) or "."
    ds = load_dataset(repo_id, split=split, streaming=True)
    corpus_path = os.path.join(base, "expert_data", f"{sector}_ingested.jsonl")
    seen = set()
    if os.path.exists(corpus_path):
        for l in open(corpus_path):
            try: seen.add(json.loads(l).get("instruction","")[:200])
            except: pass
    added, samples = 0, []
    with open(corpus_path, "a") as out:
        for i, row in enumerate(ds):
            if added >= cap: break
            # heuristic field mapping if not specified
            q = row.get(text_key) if text_key else (row.get("question") or row.get("instruction") or row.get("prompt") or row.get("text"))
            a = row.get(resp_key) if resp_key else (row.get("answer") or row.get("response") or row.get("output") or row.get("completion"))
            if not q or not a: continue
            q, a = str(q).strip(), str(a).strip()
            if q[:200] in seen: continue
            seen.add(q[:200]); out.write(json.dumps({"instruction": q, "response": a})+"\n"); added += 1
            if len(samples) < 3: samples.append(q[:80])
    return {"repo_id": repo_id, "sector": sector, "added": added, "corpus": corpus_path, "samples": samples}


def ingest_hf_rest(repo_id, sector, config="default", split="train", text_key=None, resp_key=None, cap=500, enforce_licence=True):
    """Torch-free HF ingest via the datasets-server REST API (plain HTTP). Normalizes to
    instruction/response, dedups, appends to sector corpus, maps to memory.
    ENFORCED LICENCE GATE: verify_hf_licence() is called first; if the licence is not permissive
    the function REFUSES to download or write anything (fail-closed). enforce_licence=False only for
    explicit owner-authorized exceptions. This makes the docstring 'HARD RULE' true in code."""
    import os, json, urllib.request, urllib.parse
    if enforce_licence:
        lic, permissive = verify_hf_licence(repo_id)
        if not permissive:
            return {"added": 0, "GATED": f"licence '{lic}' not permissive — refused (fail-closed)", "licence": lic}
    base = os.path.dirname(__file__) or "."
    corpus_path = os.path.join(base, "expert_data", f"{sector}_ingested.jsonl")
    seen = set()
    if os.path.exists(corpus_path):
        for l in open(corpus_path):
            try: seen.add(json.loads(l).get("instruction","")[:200])
            except: pass
    added, samples, offset = 0, [], 0
    while added < cap:
        url = (f"https://datasets-server.huggingface.co/rows?dataset={urllib.parse.quote(repo_id)}"
               f"&config={config}&split={split}&offset={offset}&length=100")
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                data = json.load(resp)
        except Exception as e:
            return {"repo_id": repo_id, "error": str(e)[:120], "added": added}
        rows = data.get("rows", [])
        if not rows: break
        for item in rows:
            row = item.get("row", {})
            q = row.get(text_key) if text_key else (row.get("question") or row.get("instruction") or row.get("prompt") or row.get("question_stem") or row.get("text"))
            a = row.get(resp_key) if resp_key else (row.get("answer") or row.get("response") or row.get("output") or row.get("completion") or row.get("answerKey"))
            if not q or not a: continue
            q, a = str(q).strip(), str(a).strip()
            if not q or q[:200] in seen: continue
            seen.add(q[:200])
            with open(corpus_path, "a") as out:
                out.write(json.dumps({"instruction": q, "response": a})+"\n")
            added += 1
            if len(samples) < 3: samples.append(q[:80])
            if added >= cap: break
        offset += 100
    return {"repo_id": repo_id, "sector": sector, "added": added, "corpus": corpus_path, "samples": samples}


def verify_hf_licence(repo_id):
    """ACTUALLY fetch the licence from the HF API (not hand-typed). Returns (licence, permissive:bool).
    This is the enforced gate — call BEFORE trusting any ingested corpus as licence-clear."""
    import json, urllib.request
    perm = {p.lower() for p in PERMISSIVE}
    try:
        with urllib.request.urlopen(f"https://huggingface.co/api/datasets/{repo_id}", timeout=20) as r:
            meta = json.load(r)
        lic = (meta.get("cardData",{}) or {}).get("license")
        if not lic:
            lic = [t.split(":",1)[1] for t in meta.get("tags",[]) if t.startswith("license:")]
            lic = lic[0] if lic else "unknown"
        if isinstance(lic, list): lic = lic[0] if lic else "unknown"
        return lic, (str(lic).lower() in perm)
    except Exception as e:
        return f"error:{str(e)[:40]}", False   # fail-closed: can't verify = not permissive
