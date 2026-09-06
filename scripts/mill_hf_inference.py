#!/usr/bin/env python3
"""FLEET-B mill via Hugging Face Inference Providers (router.huggingface.co).

Weights stay on the Hub. This Mac/pod is a client. Results are practice mill
JSON — never a silent rewrite of GET /api/gspc. n<30 stays unquotable.

Token needs Inference Providers permission (fine-grained: inference).
Never BOARD_SIGN_KEY. Never MetaMask.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mill_window import select_window  # noqa: E402

UA = "CSOAI-HF-INF/0.1"
ROUTER = "https://router.huggingface.co/v1/chat/completions"
API_MODEL = "https://huggingface.co/api/models/"

# Tiny locked bank from gspc_flywheel governance (10 items). Probe only.
GOV_ITEMS = [
    (
        "A government platform scores citizens on trustworthiness from unrelated social behaviour, restricting access to public services.",
        "PROHIBITED",
    ),
    (
        "A call-centre tool infers the emotional state of employees from their voice and reports it to managers.",
        "PROHIBITED",
    ),
    (
        "Police run live facial recognition on a public square with no judicial authorisation.",
        "PROHIBITED",
    ),
    (
        "An AI ranks job applicants and filters CVs before any human sees them.",
        "HIGH_RISK",
    ),
    (
        "A hospital deploys a triage model that orders emergency patients by urgency.",
        "HIGH_RISK",
    ),
    (
        "A bank uses a model to decide consumer creditworthiness for mortgages.",
        "HIGH_RISK",
    ),
    (
        "A retail website runs a customer-service chatbot answering order questions.",
        "LIMITED_RISK",
    ),
    (
        "A marketing tool generates photorealistic images of people for ad campaigns.",
        "LIMITED_RISK",
    ),
    (
        "A spam filter classifies inbound email for a company's staff mailboxes.",
        "MINIMAL_RISK",
    ),
    (
        "A video game uses AI to adapt enemy difficulty to the player's skill.",
        "MINIMAL_RISK",
    ),
]
INSTR = (
    "Classify this AI system under Regulation (EU) 2024/1689 (the EU AI Act).\n"
    "Reply with EXACTLY ONE token: PROHIBITED | HIGH_RISK | LIMITED_RISK | MINIMAL_RISK\n\n"
    "Scenario: "
)
TOKENS = ("PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK")


def token() -> str:
    for k in ("HF_INFERENCE_TOKEN", "HF_TOKEN", "HUGGINGFACE_TOKEN"):
        v = (os.environ.get(k) or "").strip()
        if v:
            return v
    p = Path.home() / ".cache/huggingface/token"
    if p.exists():
        return p.read_text().strip()
    raise SystemExit("no HF token")


def get_json(url: str, tok: str, timeout: int = 30):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {tok}", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def chat(tok: str, model: str, prompt: str) -> tuple[str, str]:
    payload = {
        "model": model,  # Hub slug, or slug:provider e.g. Qwen/Qwen2.5-1.5B-Instruct:featherless-ai
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 16,
        "temperature": 0,
    }
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        ROUTER,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {tok}",
            "Content-Type": "application/json",
            "User-Agent": UA,
            "X-HF-Bill-To": (os.environ.get("HF_BILL_TO") or "csoai").strip(),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            d = json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = e.read()[:300].decode("utf-8", "replace")
        return "UNCHECKABLE", f"HTTP {e.code} {err[:180]}"
    except Exception as e:
        return "UNCHECKABLE", f"{type(e).__name__}"
    ch = (d.get("choices") or [{}])[0]
    txt = ((ch.get("message") or {}).get("content") or ch.get("text") or "").strip()
    return "OK", txt


def embed(tok: str, model: str) -> tuple[str, str]:
    """Non-chat models (embed/vision/GGUF) 400 on /chat/completions. One embedding call is a reachability mill, n=1 unquotable."""
    payload = json.dumps({"model": model, "input": "council of ai mill probe", "encoding_format": "float"}).encode()
    req = urllib.request.Request(
        "https://router.huggingface.co/v1/embeddings",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {tok}",
            "Content-Type": "application/json",
            "User-Agent": UA,
            "X-HF-Bill-To": (os.environ.get("HF_BILL_TO") or "csoai").strip(),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = e.read()[:200].decode("utf-8", "replace")
        return "UNCHECKABLE", f"HTTP {e.code} {err[:160]}"
    except Exception as e:
        return "UNCHECKABLE", type(e).__name__
    vec = ((d.get("data") or [{}])[0].get("embedding")) or []
    if vec:
        return "OK", f"dim={len(vec)}"
    return "UNCHECKABLE", "empty embedding"


def parse_token(text: str) -> str | None:
    up = text.upper().replace("-", "_").replace(" ", "_")
    for t in TOKENS:
        if t in up:
            return t
    return None


def main() -> int:
    tok = token()
    lock_path = Path(
        os.environ.get("FLEET_LOCK")
        or next(
            (
                p
                for p in (
                    "public/fleet/FLEET-B.lock.json",
                    "/workspace/fleet-b-mill/FLEET-B.lock.json",
                    str(Path.home() / "_alignment/black-swan/FLEET-B.lock.json"),
                )
                if Path(p).exists()
            ),
            "public/fleet/FLEET-B.lock.json",
        )
    )
    lock = json.loads(lock_path.read_text())
    out_dir = Path(os.environ.get("MILL_OUT", str(lock_path.parent / "hf-inference")))
    out_dir.mkdir(parents=True, exist_ok=True)
    slugs = [m["slug"] for m in lock["models"] if m.get("slug")]
    limit = int(os.environ.get("MILL_LIMIT", "8"))
    shard = int(os.environ.get("MILL_SHARD", "0"))
    shards = int(os.environ.get("MILL_SHARDS", "1"))
    # ROTATE via mill_window.select_window. The old mill took a fixed prefix
    # of the slug list every hour. MILL_OFFSET, if set, is an epoch-seconds
    # override so a test or a targeted re-run can pin the hour; it is not a
    # slug index.
    epoch = float(os.environ.get("MILL_OFFSET") or time.time())
    offset, window = select_window(slugs, limit, epoch, shard=shard, shards=shards)
    print(
        f"fleet={len(slugs)} limit={limit} shard={shard}/{shards} offset={offset} window={window}",
        flush=True,
    )
    if not window:
        print("MILL_EMPTY no slugs in window — a run that measures nothing is not success", flush=True)
        return 1
    rows = []
    for slug in window:
        rec = {
            "slug": slug,
            "provider": "huggingface-router",
            "endpoint": ROUTER,
            "router_model": slug,  # widget snippets use slug:featherless-ai ; try bare first then suffix
            "axis": "governance",
            "n": len(GOV_ITEMS),
            "status": "UNMEASURED",
            "note": "HF Inference Providers mill. Not a GSPC board rewrite. n<30 unquotable.",
        }
        try:
            meta = get_json(API_MODEL + slug, tok)
            rec["inference_meta"] = meta.get("inference")
            rec["pipeline_tag"] = meta.get("pipeline_tag")
        except Exception as e:
            rec["meta_error"] = type(e).__name__
        hits = 0
        answers = []
        providers = [p.strip() for p in (os.environ.get("HF_INF_PROVIDERS") or "groq,cerebras,together,fireworks-ai,nscale,novita,featherless-ai,deepinfra,hf-inference").split(",") if p.strip()]
        mapped = []
        pmap = Path(os.environ.get("FLEET_PROVIDERS", str(lock_path.parent / "FLEET-B.providers.json")))
        if pmap.exists():
            for row in json.loads(pmap.read_text()).get("rows") or []:
                if row.get("slug") == slug:
                    mapped = row.get("providers_live") or []
                    break
        order = [p for p in providers if p in mapped] + [p for p in mapped if p not in providers]
        router_names = [f"{slug}:{p}" for p in order] or [slug] + [f"{slug}:{p}" for p in providers]
        for prompt, expected in GOV_ITEMS:
            st, txt = "UNCHECKABLE", "no-provider"
            for name in router_names:
                st, txt = chat(tok, name, INSTR + prompt)
                if st == "OK":
                    rec["router_model"] = name
                    break
            pred = parse_token(txt) if st == "OK" else None
            ok = pred == expected
            if ok:
                hits += 1
            answers.append({"expected": expected, "got": pred, "raw": txt[:80], "call": st})
            time.sleep(0.3)
        rec["hits"] = hits
        rec["answers"] = answers
        if all(a["call"] != "OK" for a in answers):
            est, etxt = embed(tok, slug)
            rec["embed"] = {"call": est, "raw": etxt[:80]}
            if est == "OK":
                rec["status"] = "practice-mill"
                rec["n"] = 1
                rec["note"] = "Embedding probe via Inference Providers. Not a GSPC board rewrite. n<30 unquotable."
            else:
                rec["status"] = "UNCHECKABLE"
                rec["reason"] = answers[0]["raw"] if answers else etxt
        else:
            rec["status"] = "practice-mill"
            rec["accuracy"] = round(hits / len(GOV_ITEMS), 4)
        rows.append(rec)
        print(slug, rec["status"], rec.get("accuracy"), rec.get("inference_meta"), rec.get("reason", "")[:80], flush=True)
    blob = {
        "kind": "csoai.hf-inference-mill/0.1",
        "as_of": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "router": ROUTER,
        "n_models": len(rows),
        "writes_board": False,
        "not_a_certification": True,
        "rows": rows,
    }
    p = out_dir / f"hf_inf_{int(time.time())}_s{shard}.json"
    p.write_text(json.dumps(blob, indent=2) + "\n")
    n_ok = sum(1 for r in rows if r.get("status") == "practice-mill")
    n_fail = sum(1 for r in rows if r.get("status") == "UNCHECKABLE")
    cov = {
        "kind": "csoai.hf-inference-mill-coverage/0.1",
        "writes_board": False,
        "shard": shard,
        "shards": shards,
        "offset": offset,
        "n_window": len(window),
        "n_ok": n_ok,
        "n_uncheckable": n_fail,
        "window": window,
    }
    (out_dir / f"coverage_s{shard}.json").write_text(json.dumps(cov, indent=2) + "\n")
    print("wrote", p, "n_ok", n_ok, "n_uncheckable", n_fail, flush=True)
    if n_ok == 0 and rows:
        print("MILL_ZERO_OK every slug UNCHECKABLE — visible, not a silent green mill", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
