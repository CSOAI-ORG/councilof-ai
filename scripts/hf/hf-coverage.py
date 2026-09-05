#!/usr/bin/env python3
"""hf-coverage: measure the CEILING of the hub-queue mill — which queue models the
router can actually grade today, through which Inference Providers, and which
providers (owner-enableable in HF account settings) would unlock the most.

Every number is derived at run time from three public/live sources:
  1. the queue lock   https://huggingface.co/datasets/csoai/hub-queue/resolve/main/queue.jsonl
  2. the Hub API      GET /api/models/<id>?expand[]=inferenceProviderMapping   (no grade spent)
  3. the router       GET  https://router.huggingface.co/v1/models             (what the token can see)
                      POST https://router.huggingface.co/v1/chat/completions   (--probe-router: ONE request
                      per (model, provider) pair, max_tokens=1 — the same door the mill uses, nothing hand-rolled)

Absent is never zero: a model with no mapping is "no live inference provider", a probe that could not
run is "not probed", a 429 is "rate-limited (not dead)". Nothing here stages or signs a card, and nothing
here writes the queue. The output is a dated, derived table for public/interop/hf-coverage.json.

  python3 scripts/hf/hf-coverage.py --out public/interop/hf-coverage.json --probe-router
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
try:
    from mill_hub_queue import HF_PROVIDER_SUFFIX, MODEL_AXES, SERVABLE_TAGS, load_dead_slugs  # noqa: E402
except Exception:  # sparse checkouts without the harness still get a correct answer
    HF_PROVIDER_SUFFIX = ("", ":featherless-ai", ":hf-inference", ":together", ":fireworks-ai", ":groq")
    SERVABLE_TAGS = frozenset({"text-generation", "text2text-generation", "conversational"})
    MODEL_AXES = ("governance", "safety", "provenance", "continuity", "conformance", "openness",
                  "machinery-conformity", "care", "cross-reality", "detector-interop",
                  "art5-safeguard", "swarm", "affect", "jail")

    def load_dead_slugs(path):  # type: ignore[no-redef]
        return set()

QUEUE_URL = "https://huggingface.co/datasets/csoai/hub-queue/resolve/main/queue.jsonl"
HF_MODEL_API = "https://huggingface.co/api/models/"
ROUTER_MODELS = "https://router.huggingface.co/v1/models"
ROUTER_CHAT = "https://router.huggingface.co/v1/chat/completions"
UA = "csoai-hf-coverage/0.1 (+https://councilof.ai)"
# jail is a code-execution bank with no generic reader; the mill rotation excludes it (hub-queue-mill.yml).
ROTATION_AXES = tuple(a for a in MODEL_AXES if a != "jail")
MILL_SUFFIX_PROVIDERS = tuple(s.lstrip(":") for s in HF_PROVIDER_SUFFIX if s)
PROBE_PROMPT = "Reply with one token: PING"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def hf_token() -> str:
    for n in ("HF_TOKEN", "HF_INFERENCE_TOKEN", "HUGGINGFACE_TOKEN", "HUGGINGFACE_HUB_TOKEN"):
        v = (os.environ.get(n) or "").strip()
        if v:
            return v
    p = Path.home() / ".cache/huggingface/token"
    return p.read_text().strip() if p.is_file() else ""


def get_json(url: str, token: str, timeout: int = 60) -> tuple[int, object]:
    hdr = {"User-Agent": UA}
    if token:
        hdr["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=hdr)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            body = e.read()[:300].decode("utf-8", "replace")
        except Exception:
            body = ""
        return e.code, body
    except Exception as e:  # network blip: not a fact about the model
        return 0, type(e).__name__


def load_queue(src: str, token: str) -> list[dict]:
    if src.startswith("http"):
        st, body = 0, ""
        req = urllib.request.Request(src, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=120) as r:
            text = r.read().decode("utf-8")
    else:
        text = Path(src).read_text(encoding="utf-8")
    return [json.loads(l) for l in text.splitlines() if l.strip()]


def mapping_for(model_id: str, token: str) -> dict:
    """Live chat-capable providers from the Hub's inferenceProviderMapping. Shape is a dict
    {provider: {status, providerId, task}} today and was a list before; both are read."""
    st, d = get_json(f"{HF_MODEL_API}{model_id}?expand[]=inferenceProviderMapping", token)
    out = {"http": st, "live": [], "all": [], "gated": None, "error": None}
    if st != 200 or not isinstance(d, dict):
        out["error"] = f"HTTP {st}" if st else str(d)
        return out
    out["gated"] = d.get("gated")
    m = d.get("inferenceProviderMapping")
    entries: list[dict] = []
    if isinstance(m, list):
        entries = [x for x in m if isinstance(x, dict)]
    elif isinstance(m, dict):
        entries = [dict(v, provider=k) for k, v in m.items() if isinstance(v, dict)]
    for e in entries:
        p = str(e.get("provider") or "")
        out["all"].append({"provider": p, "status": e.get("status"), "task": e.get("task")})
        if str(e.get("status") or "live") == "live" and str(e.get("task") or "") in ("conversational", "text-generation"):
            out["live"].append(p)
    return out


def hub_list(token: str, pipeline_tag: str = "text-generation", page: int = 1000, max_pages: int = 20) -> list[dict]:
    """Every Hub model with pipeline_tag=<tag> that ANY Inference Provider maps (inference_provider=all),
    by downloads, with its mapping in the same response. Pages by the Link: rel=next cursor."""
    url = (f"https://huggingface.co/api/models?pipeline_tag={pipeline_tag}&inference_provider=all&sort=downloads"
           f"&direction=-1&limit={page}&expand[]=inferenceProviderMapping&expand[]=downloads&expand[]=pipeline_tag&expand[]=gated")
    out: list[dict] = []
    for _ in range(max_pages):
        hdr = {"User-Agent": UA}
        if token:
            hdr["Authorization"] = f"Bearer {token}"
        req = urllib.request.Request(url, headers=hdr)
        with urllib.request.urlopen(req, timeout=120) as r:
            out.extend(json.loads(r.read()))
            link = r.headers.get("Link") or ""
        nxt = ""
        for part in link.split(","):
            if 'rel="next"' in part:
                nxt = part.split(";")[0].strip().strip("<>")
        if not nxt:
            break
        url = nxt
    return out


def mapping_from_listed(m: dict) -> dict:
    """Same shape as mapping_for(), read from a list_models row (list-shaped mapping)."""
    out = {"http": 200, "live": [], "all": [], "gated": m.get("gated"), "error": None}
    entries = m.get("inferenceProviderMapping")
    if isinstance(entries, dict):
        entries = [dict(v, provider=k) for k, v in entries.items() if isinstance(v, dict)]
    for e in entries or []:
        if not isinstance(e, dict):
            continue
        p = str(e.get("provider") or "")
        out["all"].append({"provider": p, "status": e.get("status"), "task": e.get("task")})
        if str(e.get("status") or "live") == "live" and str(e.get("task") or "") in ("conversational", "text-generation"):
            out["live"].append(p)
    return out


def router_models(token: str) -> dict:
    st, d = get_json(ROUTER_MODELS, token)
    if st != 200 or not isinstance(d, dict):
        return {"http": st, "models": {}, "providers": Counter()}
    models: dict[str, list[str]] = {}
    provs: Counter = Counter()
    for m in d.get("data") or []:
        mid = str(m.get("id") or "")
        ps = [str(p.get("provider")) for p in (m.get("providers") or []) if isinstance(p, dict) and str(p.get("status") or "live") == "live"]
        models[mid] = ps
        provs.update(ps)
    return {"http": st, "models": models, "providers": provs}


def probe_router(target: str, token: str) -> dict:
    """One cheapest-possible chat call (max_tokens=1). Returns {http, code, detail}."""
    payload = json.dumps({"model": target, "messages": [{"role": "user", "content": PROBE_PROMPT}], "max_tokens": 1, "temperature": 0}).encode()
    req = urllib.request.Request(ROUTER_CHAT, data=payload, method="POST",
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": UA})
    for attempt, wait in enumerate((0, 5, 12, 25)):
        if wait:
            time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                d = json.loads(r.read())
            model_answered = str(d.get("model") or "")
            return {"http": 200, "code": "ok", "detail": f"answered as {model_answered}"[:120]}
        except urllib.error.HTTPError as e:
            try:
                body = e.read()[:300].decode("utf-8", "replace")
            except Exception:
                body = ""
            code = ""
            try:
                code = str((json.loads(body).get("error") or {}).get("code") or "")
            except Exception:
                pass
            cf_block = e.code == 403 and body.lstrip().lower().startswith("<!doctype html")
            if cf_block:
                # featherless-ai's Cloudflare edge answers a burst with a 403 HTML page (measured
                # 2026-09-05: 16 parallel probes → 10 × 403 HTML, then 200 on a quiet retry).
                # That is a statement about our burst, not about the model.
                code = "cf-block"
            if (e.code == 429 or cf_block) and attempt < 3:
                continue
            return {"http": e.code, "code": code or f"http{e.code}", "detail": " ".join(body.split())[:160] if not cf_block else "403 HTML block page (provider edge throttle)"}
        except Exception as e:
            if attempt < 3:
                continue
            return {"http": 0, "code": type(e).__name__, "detail": ""}
    return {"http": 0, "code": "unreachable", "detail": ""}


def compact_row(row: dict) -> dict:
    """The published row: every fact the report and the queue-expansion writer read, without the raw
    mapping entries and probe bodies (6,142 Hub rows × those would be several MB in public/interop).
    doors = {door: http status} where door is "(bare)" or a provider name; absent door = not tried."""
    doors = {}
    for k, v in (row.get("probe") or {}).items():
        if k == "_not_probed":
            doors["_not_probed"] = "budget"
        elif isinstance(v, dict):
            doors[k] = v.get("http") if v.get("http") else (v.get("code") or "error")
    out = {k: row[k] for k in ("model", "rank", "pipeline_tag", "in_queue", "source", "downloads", "gated",
                               "reachable", "reachable_via", "reachable_via_mill_suffixes", "status",
                               "measured_axes", "in_dead_slugs", "router_lists_it") if k in row}
    out["live_providers"] = row.get("mapping_live_providers") or []
    out["doors"] = doors
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--queue", default=QUEUE_URL, help="queue.jsonl path or URL (the public lock)")
    ap.add_argument("--frozen", default=str(ROOT / "harness/gspc-top100/frozen-top100.json"), help="frozen-top100.json (its ids are added to the population, marked)")
    ap.add_argument("--dead", default=str(ROOT / "harness/gspc-top100/dead_slugs.jsonl"))
    ap.add_argument("--out", default=str(ROOT / "public/interop/hf-coverage.json"))
    ap.add_argument("--probe-router", action="store_true", help="also send one max_tokens=1 chat request per (model, live provider) and per bare id")
    ap.add_argument("--hub-list", action="store_true", help="add every Hub text-generation model any provider maps (inference_provider=all) as expansion candidates")
    ap.add_argument("--concurrency", type=int, default=6)
    ap.add_argument("--probe-budget-minutes", type=float, default=0, help="stop SENDING router probes after this long; later models are reported 'not probed (budget)', never 'refused'")
    ap.add_argument("--limit", type=int, default=0, help="debug: only the first N candidates by rank")
    ap.add_argument("--tags", default=",".join(sorted(SERVABLE_TAGS)), help="pipeline tags that count as chat-servable")
    args = ap.parse_args()

    token = hf_token()
    if not token:
        print("no HF token (HF_TOKEN or ~/.cache/huggingface/token) — the mapping API is public but the router is not; refusing to publish a table that cannot probe", file=sys.stderr)
        return 2
    tags = {t.strip() for t in args.tags.split(",") if t.strip()}
    rows = load_queue(args.queue, token)
    by_id = {str(r.get("id") or ""): r for r in rows}
    cand = [r for r in rows if r.get("pipeline_tag") in tags]
    cand.sort(key=lambda r: int(r.get("rank") or 10**9))
    frozen_ids: list[str] = []
    fp = Path(args.frozen)
    if fp.is_file():
        try:
            frozen_ids = [str(m.get("model_id") or "") for m in json.loads(fp.read_text()).get("models", [])]
        except Exception:
            frozen_ids = []
    extra = [{"id": m, "rank": None, "pipeline_tag": "text-generation", "_source": "frozen-top100"} for m in frozen_ids if m and m not in by_id]
    # Hub list: every text-generation model any provider maps (inference_provider=all). Those not in the
    # queue are the EXPANSION candidates; their mapping comes with the row, so no per-model call.
    listed: dict[str, dict] = {}
    hub_extra: list[dict] = []
    if args.hub_list:
        for m in hub_list(token):
            mid = str(m.get("id") or "")
            if mid:
                listed[mid] = m
        seen = set(by_id) | {e["id"] for e in extra}
        for mid, m in listed.items():
            if mid in seen:
                continue
            hub_extra.append({"id": mid, "rank": None, "downloads": m.get("downloads"), "pipeline_tag": m.get("pipeline_tag") or "text-generation", "_source": "hub-list"})
        print(f"hub list: {len(listed)} mapped text-generation models; {len(hub_extra)} not in the queue", file=sys.stderr)
    population = cand + extra + hub_extra
    if args.limit:
        population = population[: args.limit]
    dead = load_dead_slugs(Path(args.dead)) if Path(args.dead).is_file() else set()

    print(f"queue rows={len(rows)} servable-tag candidates={len(cand)} frozen-only extras={len(extra)} hub-list extras={len(hub_extra)} population={len(population)}", file=sys.stderr)

    # 2. Hub mapping (read-only, no grade spent): from the list row when we have it, else one API call.
    maps: dict[str, dict] = {}
    need = []
    for r in population:
        mid = str(r["id"])
        if mid in listed:
            maps[mid] = mapping_from_listed(listed[mid])
        else:
            need.append(mid)
    with ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futs = {ex.submit(mapping_for, mid, token): mid for mid in need}
        for i, f in enumerate(as_completed(futs), 1):
            maps[futs[f]] = f.result()
            if i % 100 == 0:
                print(f"  mapping {i}/{len(futs)}", file=sys.stderr)

    # 3. What the router lists for this token.
    rm = router_models(token)
    router_seen_providers = set(rm["providers"])

    # 4. Optional: the real door, one request per (model, provider) pair + one bare.
    probes: dict[str, dict[str, dict]] = defaultdict(dict)
    if args.probe_router:
        import threading

        # Per-provider concurrency caps: featherless-ai throttles bursts at its edge (403 HTML), and
        # the mill's own comment records its per-user cap. Everything else gets a modest cap too.
        caps: dict[str, threading.Semaphore] = defaultdict(lambda: threading.Semaphore(4))
        caps["featherless-ai"] = threading.Semaphore(2)
        caps["(bare)"] = threading.Semaphore(4)
        deadline = time.time() + args.probe_budget_minutes * 60 if args.probe_budget_minutes else None

        def gated(target: str, gate: str) -> dict:
            with caps[gate]:
                return probe_router(target, token)

        def probe_model(mid: str, live: list[str]) -> dict[str, dict]:
            """Bare id first, then each live provider suffix until one answers 200. A model is
            reachable at the first open door; 'every door refused' is only said after every door.
            Past the budget nothing is sent and the model is reported as NOT PROBED, never as refused."""
            if deadline and time.time() > deadline:
                return {"_not_probed": {"http": 0, "code": "budget", "detail": "probe budget exhausted before this model"}}
            out: dict[str, dict] = {"(bare)": gated(mid, "(bare)")}
            if out["(bare)"]["http"] == 200:
                return out
            # Cheap doors first: featherless is the throttled one, so try the others before it.
            for p in sorted(live, key=lambda x: x == "featherless-ai"):
                out[p] = gated(f"{mid}:{p}", p)
                if out[p]["http"] == 200:
                    break
            return out
        todo = [(str(r["id"]), maps.get(str(r["id"]), {}).get("live") or []) for r in population]
        todo = [(m, l) for m, l in todo if l]
        print(f"router probes: {len(todo)} models, up to {sum(1 + len(l) for _, l in todo)} requests (max_tokens=1 each), short-circuit at first 200, budget {args.probe_budget_minutes or 'none'} min", file=sys.stderr)
        t0 = time.time()
        with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as ex:
            futs = {ex.submit(probe_model, mid, live): mid for mid, live in todo}
            for i, f in enumerate(as_completed(futs), 1):
                probes[futs[f]] = f.result()
                if i % 100 == 0:
                    print(f"  probed {i}/{len(futs)} models ({int(time.time() - t0)} s)", file=sys.stderr)

    # 5. Derive the table.
    table: list[dict] = []
    c_status: Counter = Counter()
    prov_live_models: dict[str, set[str]] = defaultdict(set)      # provider -> models it serves (mapping)
    prov_unlock_bare: dict[str, set[str]] = defaultdict(set)      # provider -> models NOT bare-reachable that it serves
    prov_unlock_locked: dict[str, set[str]] = defaultdict(set)    # provider -> models with NO working door that it serves
    outside_mill: list[str] = []
    false_dead: list[str] = []
    measured_cells_reachable = 0
    for r in population:
        mid = str(r["id"])
        m = maps.get(mid) or {}
        live = m.get("live") or []
        pr = probes.get(mid, {})
        ok_provs = sorted(p for p, v in pr.items() if p != "(bare)" and v.get("http") == 200)
        bare_ok = pr.get("(bare)", {}).get("http") == 200
        if m.get("http") == 404:
            status = "gone (HTTP 404 on the Hub)"
        elif m.get("error"):
            status = f"not probed ({m['error']})"
        elif not live:
            status = "no live inference provider"
        elif not args.probe_router:
            status = "mapped (router not probed)"
        elif "_not_probed" in pr or not pr:
            status = "mapped, router not probed (budget)"
        elif bare_ok or ok_provs:
            status = "reachable"
        elif any(v.get("http") == 429 or v.get("code") == "cf-block" for v in pr.values()):
            status = "rate-limited (not dead)"
        elif any(v.get("http") == 503 for v in pr.values()):
            # featherless-ai answers 503 capacity_exhausted for a model it maps but has not loaded;
            # measured 2026-09-05 on 17 of 23 "refused" queue models. Capacity, not absence.
            status = "provider capacity exhausted (503, not dead)"
        elif any(v.get("http") == 402 for v in pr.values()):
            status = "provider needs billing (402)"
        else:
            status = "mapped but every door refused (400/404)"
        c_status[status] += 1
        for p in live:
            prov_live_models[p].add(mid)
            if args.probe_router and not bare_ok:
                prov_unlock_bare[p].add(mid)
            if args.probe_router and status == "mapped but every door refused (400/404)":
                prov_unlock_locked[p].add(mid)
        via_mill = bare_ok or any(p in MILL_SUFFIX_PROVIDERS for p in ok_provs)
        if status == "reachable" and not via_mill:
            outside_mill.append(mid)
        if mid in dead and status == "reachable":
            false_dead.append(mid)
        ma = (r.get("measured_axes") or {}) if isinstance(r.get("measured_axes"), dict) else {}
        measured_axes = sorted(a for a, c in ma.items() if isinstance(c, dict) and str(c.get("status") or "").upper() == "MEASURED" and c.get("card_id"))
        if status == "reachable":
            measured_cells_reachable += sum(1 for a in measured_axes if a in ROTATION_AXES)
        table.append(compact_row({
            "model": mid,
            "rank": r.get("rank"),
            "pipeline_tag": r.get("pipeline_tag"),
            "in_queue": r.get("_source") is None,
            "source": r.get("_source") or "hub-queue",
            "downloads": r.get("downloads"),
            "gated": m.get("gated"),
            "mapping_live_providers": live,
            "mapping_all": m.get("all") or [],
            "router_lists_it": mid in rm["models"],
            "probe": pr,
            "reachable": status == "reachable",
            "reachable_via": (["(bare)"] if bare_ok else []) + ok_provs,
            "reachable_via_mill_suffixes": bool(status == "reachable" and via_mill),
            "status": status,
            "measured_axes": measured_axes,
            "in_dead_slugs": mid in dead,
        }))

    reachable = [t for t in table if t["reachable"]]
    n_reach = len(reachable)
    n_cells_possible = n_reach * len(ROTATION_AXES)
    n_cells_open = n_cells_possible - measured_cells_reachable
    provider_rank = sorted(
        (
            {
                "provider": p,
                "serves_queue_models": len(prov_live_models[p]),
                "models_not_bare_reachable_it_serves": len(prov_unlock_bare[p]),
                "models_with_no_working_door_it_serves": len(prov_unlock_locked[p]),
                "in_mill_suffix_tuple": p in MILL_SUFFIX_PROVIDERS,
                "router_lists_provider": p in router_seen_providers,
                "sample": sorted(prov_unlock_locked[p])[:5] or sorted(prov_unlock_bare[p])[:5],
            }
            for p in prov_live_models
        ),
        key=lambda x: (-x["models_with_no_working_door_it_serves"], -x["models_not_bare_reachable_it_serves"], -x["serves_queue_models"], x["provider"]),
    )
    out = {
        "kind": "csoai.hf-coverage/0.1",
        "as_of": now_iso(),
        "producer": "scripts/hf/hf-coverage.py",
        "honesty": {
            "derived": "Every count below is computed from the sources named in `sources` at as_of. Nothing is a card; nothing is MEASURED by this file.",
            "absent_is_not_zero": "A model is 'reachable' only if the router answered HTTP 200 to a max_tokens=1 chat request at as_of. 'not probed' and 'rate-limited' are not 'unreachable'.",
            "router_probed": bool(args.probe_router),
            "population": "hub-queue rows whose pipeline_tag is chat-servable (SERVABLE_TAGS) plus frozen-top100 ids not in the queue. image-text-to-text is out until a VL bank exists.",
        },
        "sources": {
            "queue": args.queue,
            "hub_api": HF_MODEL_API + "<id>?expand[]=inferenceProviderMapping",
            "router_models": ROUTER_MODELS,
            "router_chat": ROUTER_CHAT if args.probe_router else None,
            "frozen": args.frozen if fp.is_file() else None,
            "dead_slugs": args.dead if Path(args.dead).is_file() else None,
        },
        "counts": {
            "queue_rows": len(rows),
            "queue_servable_tag_rows": len(cand),
            "frozen_only_extras": len(extra),
            "hub_list_mapped_text_generation": len(listed) if args.hub_list else None,
            "hub_list_extras_not_in_queue": len(hub_extra) if args.hub_list else None,
            "expansion_reachable_not_in_queue": sum(1 for t in table if t["reachable"] and not t["in_queue"]),
            "population": len(population),
            "by_status": dict(c_status),
            "reachable_models": n_reach,
            "models_router_probed": sum(1 for t in table if t["status"] in ("reachable", "mapped but every door refused (400/404)", "rate-limited (not dead)", "provider capacity exhausted (503, not dead)", "provider needs billing (402)")),
            "models_not_probed_budget": c_status.get("mapped, router not probed (budget)", 0),
            "reachable_only_outside_mill_suffix_tuple": len(outside_mill),
            "in_dead_slugs_but_reachable": len(false_dead),
            "router_v1_models_listed": len(rm["models"]),
            "router_v1_models_http": rm["http"],
            "rotation_axes": len(ROTATION_AXES),
            "cells_possible_for_reachable": n_cells_possible,
            "cells_measured_for_reachable": measured_cells_reachable,
            "cells_open_for_reachable": n_cells_open,
            "measured_cells_in_queue_total": sum(
                1 for r in rows for a, c in ((r.get("measured_axes") or {}) if isinstance(r.get("measured_axes"), dict) else {}).items()
                if isinstance(c, dict) and str(c.get("status") or "").upper() == "MEASURED" and c.get("card_id")
            ),
        },
        "mill_suffix_tuple": list(HF_PROVIDER_SUFFIX),
        "router_providers_seen_for_this_token": sorted(router_seen_providers),
        "providers_ranked": provider_rank,
        "reachable_only_outside_mill_suffix_tuple": sorted(outside_mill),
        "in_dead_slugs_but_reachable": sorted(false_dead),
        "models": table,
    }
    op = Path(args.out)
    op.parent.mkdir(parents=True, exist_ok=True)
    op.write_text(json.dumps(out, indent=1, ensure_ascii=True) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in out["counts"].items()}, indent=1))
    print("providers_ranked (top 12):")
    for p in provider_rank[:12]:
        print(f"  {p['provider']:<16} serves={p['serves_queue_models']:<4} not-bare={p['models_not_bare_reachable_it_serves']:<4} no-door={p['models_with_no_working_door_it_serves']:<4} mill-tuple={p['in_mill_suffix_tuple']}")
    print(f"wrote {op}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
