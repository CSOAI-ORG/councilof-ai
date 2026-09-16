#!/usr/bin/env python3
"""Population census of public models: deterministic facts only, no inference, no key.

Why this exists. Behavioural measurement does not scale to a population — on our own GPU a
single card at the n>=30 floor costs about 2.5 minutes, so a full 23-axis board for one model
is roughly an hour. What DOES scale is the set of facts a model's own index entry carries at a
named commit: whether a licence is declared, what weights format is shipped, whether the repo is
gated so that no third party can verify it at all.

That is a measurement in the same sense the board's deterministic-fact axes are: it is read, not
asserted, it names its source and time, and a stranger can re-run it. It is NOT a behavioural
result and nothing here says a model is good, safe or accurate.

Honesty rules enforced in the code:
  - The API returns no total, so no total is claimed. We report what we walked.
  - A field that is absent is absent, never a zero and never a default.
  - Pagination is by the API's own cursor; a partial walk is labelled PARTIAL.
"""
import json, sys, time, urllib.request, urllib.parse, collections, pathlib

API = "https://huggingface.co/api/models"
UA = {"User-Agent": "csoai-gspc/1.4", "Accept": "application/json"}


def page(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        body = json.loads(r.read().decode())
        link = r.headers.get("Link") or ""
    nxt = None
    for part in link.split(","):
        if 'rel="next"' in part:
            nxt = part.split(";")[0].strip().strip("<>")
    return body, nxt


def facts(m):
    tags = m.get("tags") or []
    lic = next((t.split(":", 1)[1] for t in tags if t.startswith("license:")), None)
    files = [s.get("rfilename") for s in (m.get("siblings") or []) if isinstance(s, dict)]
    return {
        "id": m.get("id"),
        "sha": m.get("sha"),
        "author": m.get("author"),
        "created_at": m.get("createdAt"),
        "last_modified": m.get("lastModified"),
        "downloads": m.get("downloads"),
        "likes": m.get("likes"),
        "pipeline_tag": m.get("pipeline_tag"),
        "library": m.get("library_name"),
        "license_declared": lic,
        "gated": m.get("gated"),
        "n_files": len(files) if m.get("siblings") is not None else None,
        "has_safetensors": ("safetensors" in tags) or any(str(f).endswith(".safetensors") for f in files) if files else None,
        "has_config": any(str(f) == "config.json" for f in files) if files else None,
        "has_model_card": any(str(f).upper() == "README.MD" for f in files) if files else None,
    }


def main() -> int:
    limit = int(sys.argv[sys.argv.index("--models") + 1]) if "--models" in sys.argv else 1000
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "public/interop/model-census.json"
    sort = sys.argv[sys.argv.index("--sort") + 1] if "--sort" in sys.argv else "downloads"
    url = f"{API}?limit=100&full=true&sort={sort}&direction=-1"
    rows, walked, t0 = [], 0, time.time()
    while url and walked < limit:
        try:
            body, url = page(url)
        except Exception as e:
            print(f"stopped on {type(e).__name__}: {str(e)[:80]}", file=sys.stderr)
            break
        if not body:
            break
        for m in body:
            rows.append(facts(m)); walked += 1
            if walked >= limit:
                break
        time.sleep(0.15)

    c = collections.Counter()
    for r in rows:
        c["walked"] += 1
        if r["license_declared"]: c["license_declared"] += 1
        else: c["license_NOT_declared"] += 1
        if r["gated"]: c["gated"] += 1
        if r["has_safetensors"]: c["safetensors"] += 1
        if r["has_config"]: c["config_json"] += 1
        if r["has_model_card"]: c["model_card_file"] += 1
        if r["pipeline_tag"]: c["pipeline_tag"] += 1

    doc = {
        "schema": "csoai.model-census/0.1", "kind": "deterministic-facts",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": API, "sort": sort, "walk_state": "PARTIAL" if url else "EXHAUSTED",
        "models_walked": len(rows), "seconds": round(time.time() - t0, 1),
        "counts": dict(c),
        "population_total": None,
        "population_note": ("The index API returns no total count, so none is claimed here. This file "
                            "reports what was walked, in the order stated, and nothing about the models "
                            "beyond it."),
        "honesty": ("Deterministic facts read from each model's own index entry at the commit named in "
                    "its sha field. Nothing here is behavioural: no model was run, nothing was graded, "
                    "and no statement is made about whether any model is good, safe or accurate. An "
                    "absent field is recorded absent, never as zero."),
        "rows": rows,
    }
    pathlib.Path(out).write_text(json.dumps(doc, indent=2) + "\n")
    print(f"walked {len(rows)} in {doc['seconds']}s ({doc['walk_state']}) -> {out}")
    for k, v in sorted(c.items()):
        print(f"  {k:24s} {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
