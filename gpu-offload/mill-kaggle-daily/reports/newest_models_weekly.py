#!/usr/bin/env python3
"""newest_models_weekly.py — the weekly NEWEST-MODELS report for the Kaggle daily mill (oracle-micro-2).

What it reads (all local, read-only, streamed; nothing is fetched, re-run, signed or published):
  receipts   ~/lanes/logs/mill-kaggle-daily.log            one line per mill-kaggle-daily run (run.sh receipt())
  slices     /evac-bulk/mill-kaggle-daily/out/<H>-<slug>/   gate/stage/verified-*/{verification.json,items.jsonl},
                                                            sign.log, pull/environment.json, base.txt
  cards      git objects in the mill clone: the slice commit's public/interop/mill-cards-signed/* and
             origin/master's public/interop/mill-evidence/runpod-admission-*.json (git show / ls-tree only;
             the working tree is never touched, so a concurrent run.sh is safe)
  pins       ~/lanes/mill-kaggle-daily/newest-models.json   the newest-class rotation entries
  inventory  ~/lanes/mill-kaggle-daily/reports/inventory-*.json   the latest release inventory + frontier prices

What it writes: <out-dir>/NEWEST-MODELS-REPORT-<date>.md and .json, and ONE receipt line in
~/lanes/logs/newest-models-weekly.log. Nothing else. It is NOT a publication step: the owner decides.

Standing rules it prints and enforces:
  * A result from a single hardware run is NOT ADMITTED to the GSPC board (owner rule 2026-09-26: an
    independent second runtime must reproduce every item's grade). Admission state comes from a
    runpod-admission record in master naming the card id; no record = NOT_ADMITTED.
  * TIE and UNTESTED are distinct. The separation verdict is the board's 2026-08-13 rule (exact McNemar on
    discordant items, leader vs runner-up, p < 0.05 = SEPARATED, else TIE; Wilson intervals are annotation
    only). An axis with fewer than two third-party models measured this week on the same bank is UNTESTED.
  * CSOAI's own models are excluded before any comparison (fail closed on the name prefixes below). No
    "best model" wording is emitted unless the verdict is SEPARATED, and even then it is a within-week,
    single-runtime observation, not a board determination.
  * Every n is the graded n (parse and transport errors excluded, and counted). Nothing is estimated.

Exit: 0 report written; 1 FAILED (reason in the receipt line and on stderr). Never a silent no-op.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import glob
import json
import math
import os
import re
import shutil
import subprocess
import sys
from math import comb
from pathlib import Path

HOME = Path.home()
OWN_PREFIXES = ("sov", "council", "meok", "clan-", "csoai")   # our own models never enter a comparison
FLOOR_BYTES = 2 * 1024**3

# ── the 2026-08-13 separation test body, verbatim from scripts/gspc_separation_from_rows.py ──
def wilson(k, n, z=1.959964):
    if n < 1:
        return (0, 1)
    p = k / n
    d = 1 + z * z / n
    c = p + z * z / (2 * n)
    m = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (max(0, (c - m) / d), min(1, (c + m) / d))


def mcnemar(b, c):
    # exact binomial on discordant pairs
    n = b + c
    if n == 0:
        return None
    k = min(b, c)
    p = 2 * sum(comb(n, i) for i in range(0, k + 1)) / (2 ** n)
    return min(1.0, p)
# ─────────────────────────────────────────────────────────────────────────────────────────────


class Failed(Exception):
    pass


def is_own(model: str) -> bool:
    bare = model.split("ollama:", 1)[-1].split("/")[-1].lower()
    return bare.startswith(OWN_PREFIXES)


def git(clone: Path, *args: str) -> str:
    r = subprocess.run(["git", "-C", str(clone), *args], capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}: {r.stderr.strip()[:300]}")
    return r.stdout


RECEIPT_RE = re.compile(r"^(\S+Z) (\S+) (\S+) state=(\S+) runs=(\S+) landed=(\S+) signed=(\S+) branch=(\S+) "
                        r"commit=(\S+) landed_to=(\S+) kernel_wall_s=(\S+) rc=(\S+) out=(\S+) reason=(.*)$")


def read_receipts(log: Path, start: dt.datetime, end: dt.datetime) -> list[dict]:
    if not log.is_file():
        raise Failed(f"receipt log absent: {log}")
    out = []
    with log.open() as fh:
        for line in fh:
            m = RECEIPT_RE.match(line.rstrip("\n"))
            if not m:
                continue
            at = dt.datetime.strptime(m.group(1), "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)
            if not (start <= at < end):
                continue
            k = ["at", "slice", "model", "state", "runs", "landed", "signed", "branch", "commit", "landed_to",
                 "kernel_wall_s", "rc", "out", "reason"]
            out.append(dict(zip(k, m.groups())))
    return out


def slice_axes(out_dir: Path) -> dict:
    """Per-axis counts from the slice's verified intake bundles (the same bytes the cards were signed from)."""
    axes = {}
    for vdir in sorted(glob.glob(str(out_dir / "gate/stage/verified-*"))):
        v = json.load(open(os.path.join(vdir, "verification.json")))
        grades, trunc, rows, pin, pout, pred = {}, 0, 0, 0, 0, None
        with open(os.path.join(vdir, "items.jsonl")) as fh:
            for line in fh:
                if not line.strip():
                    continue
                it = json.loads(line)
                rows += 1
                trunc += it.get("done_reason") == "length"
                pred = it.get("predicate") or pred
                om = it.get("ollama_metrics") or {}
                pin += int(om.get("prompt_eval_count") or 0)
                pout += int(om.get("eval_count") or 0)
                # graded n follows the intake: transport errors and unparsed exact-label answers are excluded from n
                if it.get("transport_ok") is False:
                    continue
                if it.get("predicate") == "EXACT_LABEL" and it.get("parsed_label") is None:
                    continue
                if it.get("grade") in (True, False):
                    grades[it["item_id"]] = bool(it["grade"])
        c = v.get("counts", {})
        k, n = sum(grades.values()), len(grades)
        consistent = (k == c.get("correct") and n == c.get("graded_n"))
        lo, hi = wilson(k, n)
        axes[v["axis"]] = {
            "axis": v["axis"], "subject": v.get("subject"), "bank_sha256": v.get("bank_sha256"),
            "intake_state": v.get("state"), "authority_admitted": (v.get("authority") or {}).get("admitted"),
            "k": k, "n": n, "accuracy": round(k / n, 4) if n else None,
            "wilson95": [round(lo, 4), round(hi, 4)] if n else None,
            "bank_items": c.get("bank_items"), "parse_errors_excluded": c.get("parse_errors_excluded"),
            "transport_errors_excluded": c.get("transport_errors_excluded"),
            "done_reason_length": trunc, "item_rows": rows, "predicate": pred,
            "counts_match_intake": consistent, "prompt_tokens": pin, "output_tokens": pout,
            "grades": grades, "run_id": v.get("run_id"),
        }
    return axes


def signed_cards(out_dir: Path, clone: Path, commit: str) -> dict:
    """axis -> signed card (id, file) for this slice, from sign.log + the slice commit's tree."""
    res = {}
    sl = out_dir / "sign.log"
    if not sl.is_file():
        return res
    names = [l.split()[1] for l in sl.read_text().splitlines() if l.startswith("SIGNED ")]
    for name in names:
        try:
            card = json.loads(git(clone, "show", f"{commit}:public/interop/mill-cards-signed/{name}"))
        except Exception as e:  # noqa: BLE001
            res.setdefault("_errors", []).append(f"{name}: {e}")
            continue
        body = card.get("body", {})
        res[body.get("axis")] = {"file": name, "id": card.get("id"), "status_in_body": body.get("status"),
                                 "did": card.get("did") or card.get("kid"), "n": body.get("n"),
                                 "accuracy": body.get("accuracy")}
    return res


def admission_index(clone: Path) -> dict:
    idx = {}
    listing = git(clone, "ls-tree", "--name-only", "origin/master", "public/interop/mill-evidence/").split()
    for path in listing:
        if not os.path.basename(path).startswith("runpod-admission-"):
            continue
        try:
            rec = json.loads(git(clone, "show", f"origin/master:{path}"))
        except Exception:  # noqa: BLE001
            continue
        cid = (rec.get("card") or {}).get("id")
        if cid:
            idx[cid] = {"state": rec.get("state"), "file": os.path.basename(path), "admitted_at": rec.get("admitted_at")}
    return idx


def separation(models_axis: dict) -> dict:
    """models_axis: model -> axis record (same bank). The 2026-08-13 rule, leader vs runner-up."""
    third = {m: a for m, a in models_axis.items() if not is_own(m) and a["n"] > 0}
    if len(third) < 2:
        return {"verdict": "UNTESTED", "why": f"{len(third)} third-party model(s) measured on this axis this week; "
                "a comparison needs two", "models": sorted(third)}
    rank = sorted(third.items(), key=lambda kv: -kv[1]["k"] / kv[1]["n"])
    (lm, la), (rm, ra) = rank[0], rank[1]
    b = sum(1 for i, g in la["grades"].items() if g and i in ra["grades"] and not ra["grades"][i])
    c = sum(1 for i, g in ra["grades"].items() if g and i in la["grades"] and not la["grades"][i])
    paired = sum(1 for i in la["grades"] if i in ra["grades"])
    p = mcnemar(b, c)
    return {"verdict": "SEPARATED" if (p is not None and p < 0.05) else "TIE",
            "leader": lm, "runner_up": rm, "paired_items": paired, "b10": b, "c01": c,
            "mcnemar_p": None if p is None else round(p, 4), "models": sorted(third),
            "comparator": "runner-up by accuracy (the 2026-08-13 rule compares against the best BASE model of the "
                          "August fleet; this weekly report has no fixed base fleet, so the next-ranked third-party model is used)",
            "note": "within-week, single-runtime (Kaggle 2xT4) observation under the board's 2026-08-13 rule; "
                    "not a board determination"}


def load_inventory(d: Path, end: dt.datetime) -> dict | None:
    files = sorted(glob.glob(str(d / "inventory-*.json")))
    if not files:
        return None
    inv = json.load(open(files[-1]))
    inv["_file"] = os.path.basename(files[-1])
    as_of = dt.datetime.strptime(inv["as_of"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)
    inv["_age_days"] = round((end - as_of).total_seconds() / 86400, 1)
    inv["_stale"] = inv["_age_days"] > 7
    return inv


def cost_table(inv: dict, token_basis: dict) -> list[dict]:
    a = inv.get("frontier_cost_assumptions", {})
    margin = float(a.get("tokenizer_margin", 1.3))
    rpi = int(a.get("reasoning_tokens_per_item_scenario", 1000))
    tin = token_basis["prompt_tokens"] * margin / 1e6
    tout = token_basis["output_tokens"] * margin / 1e6
    treason = token_basis["items"] * rpi / 1e6
    rows = []
    for f in inv.get("frontier_api", []):
        pi, po = f["price_in"], f["price_out"]
        floor = tin * pi + tout * po
        reason = floor + treason * po
        bf = f.get("batch_factor")
        rows.append({"model": f["model"], "id": f.get("id"), "announced": f["announced"], "source": f["source"],
                     "price_in_per_mtok": pi, "price_out_per_mtok": po, "access": f["access"],
                     "free_route": f.get("free_route"),
                     "usd_floor": round(floor, 3), "usd_with_reasoning": round(reason, 2),
                     "usd_floor_batch": round(floor * bf, 3) if bf else None,
                     "usd_with_reasoning_batch": round(reason * bf, 2) if bf else None})
    return rows


def fmt_ci(ci):
    return "—" if not ci else f"{ci[0]:.3f}–{ci[1]:.3f}"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--end", help="report end date YYYY-MM-DD (UTC, exclusive of the next day); default today")
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--log", default=str(HOME / "lanes/logs/mill-kaggle-daily.log"))
    ap.add_argument("--clone", default="/evac-bulk/mill-kaggle-daily/clone")
    ap.add_argument("--newest", default=str(HOME / "lanes/mill-kaggle-daily/newest-models.json"))
    ap.add_argument("--inventory-dir", default=str(HOME / "lanes/mill-kaggle-daily/reports"))
    ap.add_argument("--out-dir", default=str(HOME / "lanes/reports/newest-models"))
    ap.add_argument("--quota-cap-h", type=float, default=20.0)
    ap.add_argument("--receipt-log", default=str(HOME / "lanes/logs/newest-models-weekly.log"))
    args = ap.parse_args(argv)

    now = dt.datetime.now(dt.timezone.utc)
    end_day = dt.date.fromisoformat(args.end) if args.end else now.date()
    end = dt.datetime.combine(end_day + dt.timedelta(days=1), dt.time(), tzinfo=dt.timezone.utc)
    start = end - dt.timedelta(days=args.days)
    out_dir = Path(args.out_dir)
    tag = end_day.isoformat()

    def receipt(state, why):
        Path(args.receipt_log).parent.mkdir(parents=True, exist_ok=True)
        with open(args.receipt_log, "a") as fh:
            fh.write(f"{now.strftime('%Y-%m-%dT%H:%M:%SZ')} report={tag} state={state} {why}\n")

    try:
        out_dir.mkdir(parents=True, exist_ok=True)
        free = shutil.disk_usage(out_dir).free
        if free < FLOOR_BYTES:
            raise Failed(f"disk floor: {free // 2**20} MB free at {out_dir} < 2048 MB; nothing written")
        clone = Path(args.clone)
        if not (clone / ".git").exists():
            raise Failed(f"mill clone absent: {clone}")
        newest = json.load(open(args.newest))["models"]
        newest_tags = {m["tag"] for m in newest}
        receipts = read_receipts(Path(args.log), start, end)
        adm = admission_index(clone)

        slices, per_axis_models, tok = [], collections.defaultdict(dict), {"prompt_tokens": [], "output_tokens": [], "items": []}
        for r in receipts:
            s = {k: r[k] for k in ("at", "slice", "model", "state", "runs", "signed", "branch", "commit",
                                   "landed_to", "kernel_wall_s", "reason")}
            s["class"] = "newest" if r["model"] in newest_tags else "fleet"
            s["own_model"] = is_own(r["model"])
            if r["state"].startswith("OK"):
                od = Path(r["out"])
                if not od.is_dir():
                    s["error"] = f"slice dir gone: {od} (Oracle keeps the last 30 slices)"
                else:
                    axes = slice_axes(od)
                    cards = signed_cards(od, clone, r["commit"])
                    env = {}
                    try:
                        env = json.load(open(od / "pull/environment.json"))
                    except Exception:  # noqa: BLE001
                        pass
                    s["runtime"] = {"gpu": " / ".join(",".join(x.strip() for x in g.split(",")[:3])
                                                      for g in str(env.get("gpu") or "").splitlines() if g.strip()), "ollama": env.get("ollama_server_version"),
                                    "pin_source": (env.get("model") or {}).get("pin_source", "3090-intake-receipts"),
                                    "manifest_digest": (env.get("model") or {}).get("tags_digest"),
                                    "substrate": "Kaggle private kernel, 2x Tesla T4 (single runtime)"}
                    s["axes"] = []
                    for ax, a in sorted(axes.items()):
                        card = cards.get(ax) or {}
                        cid = card.get("id")
                        if cid and cid in adm and adm[cid]["state"] == "ADMITTED":
                            adm_state, adm_why = "ADMITTED", f"record {adm[cid]['file']}"
                        else:
                            adm_state = "NOT_ADMITTED"
                            adm_why = ("single hardware run (Kaggle 2xT4 only); no runpod-admission record names this "
                                       "card in master; the owner's rule needs an independent second runtime to "
                                       "reproduce every item's grade") if cid else "no signed card found for this axis"
                        row = {k: v for k, v in a.items() if k != "grades"}
                        row.update({"card_id": cid, "card_file": card.get("file"), "admission": adm_state,
                                    "admission_reason": adm_why, "board_status": "not on the board"})
                        s["axes"].append(row)
                        if not s["own_model"]:
                            per_axis_models[(ax, a["bank_sha256"])][r["model"]] = a
                    if cards.get("_errors"):
                        s["card_read_errors"] = cards["_errors"]
                    tp, to_, ti = (sum(a["prompt_tokens"] for a in axes.values()),
                                   sum(a["output_tokens"] for a in axes.values()),
                                   sum(a["item_rows"] for a in axes.values()))
                    if ti:
                        tok["prompt_tokens"].append(tp); tok["output_tokens"].append(to_); tok["items"].append(ti)
            slices.append(s)

        seps = []
        for (ax, bank), mods in sorted(per_axis_models.items()):
            sp = separation(mods)
            sp.update({"axis": ax, "bank_sha256": bank})
            seps.append(sp)

        # newest-class status: measured this week / failed / not run (UNMEASURED)
        newest_status = []
        for m in sorted(newest, key=lambda m: m["priority"]):
            mine = [s for s in slices if s["model"] == m["tag"]]
            ok = [s for s in mine if s["state"].startswith("OK")]
            st = ("MEASURED_THIS_WEEK" if ok else "FAILED_THIS_WEEK" if mine else "UNMEASURED (not run this week)")
            newest_status.append({"tag": m["tag"], "lab": m["lab"], "release_date": m["release_date"],
                                  "release_source": m["release_source"], "licence": m["licence"],
                                  "params": m["params"], "status": st, "slices": [s["slice"] for s in mine]})

        wall = sum(int(s["kernel_wall_s"]) for s in slices if str(s["kernel_wall_s"]).isdigit())
        inv = load_inventory(Path(args.inventory_dir), end)
        token_basis = None
        costs = []
        if tok["items"]:
            i = sorted(range(len(tok["items"])), key=lambda j: tok["output_tokens"][j])[len(tok["items"]) // 2]
            token_basis = {"prompt_tokens": tok["prompt_tokens"][i], "output_tokens": tok["output_tokens"][i],
                           "items": tok["items"][i], "from": "median-output slice of this week (Ollama token counts, "
                           "the measured model's own tokenizer)", "slices_available": len(tok["items"])}
            if inv:
                costs = cost_table(inv, token_basis)

        report = {
            "schema": "csoai.newest-models-weekly/0.1", "generated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "report_date": tag,
            "window": {"from": start.strftime("%Y-%m-%dT%H:%M:%SZ"), "to_exclusive": end.strftime("%Y-%m-%dT%H:%M:%SZ")},
            "publication": "NOT PUBLISHED. Internal report; the owner decides whether any of it is published.",
            "standing_rules": [
                "Measurement, not certification.",
                "Results from a single hardware run are NOT ADMITTED to the GSPC board (owner rule 2026-09-26: an "
                "independent second runtime must reproduce the same grade on every item). Every card below is held.",
                "TIE and UNTESTED are distinct: TIE = two or more third-party models measured on the same bank and the "
                "exact McNemar test (leader vs runner-up) gives p >= 0.05; UNTESTED = fewer than two measured, so no "
                "comparison was made.",
                "CSOAI's own models are excluded from every comparison; no ranking of our own models appears.",
                "No 'best model' claim unless the verdict is SEPARATED, and then only as a within-week single-runtime "
                "observation.",
                "UNMEASURED is first-class: a model not run this week is UNMEASURED, never estimated."],
            "quota": {"kernel_wall_s_this_window": wall, "cap_h": args.quota_cap_h,
                      "used_share": round(wall / (args.quota_cap_h * 3600), 3)},
            "slices": slices, "separation": seps, "newest_class": newest_status,
            "inventory": ({k: inv[k] for k in ("_file", "as_of", "_age_days", "_stale", "window", "open_weight",
                                                "outside_window_notable", "frontier_none_in_window", "kaggle_budget")}
                          if inv else None),
            "token_basis": token_basis, "frontier_cost": costs,
            "frontier_cost_assumptions": inv.get("frontier_cost_assumptions") if inv else None,
        }
        jpath = out_dir / f"NEWEST-MODELS-REPORT-{tag}.json"
        jpath.write_text(json.dumps(report, indent=1, sort_keys=False) + "\n")
        mpath = out_dir / f"NEWEST-MODELS-REPORT-{tag}.md"
        mpath.write_text(render_md(report))
        receipt("OK", f"slices={len(slices)} ok={sum(1 for s in slices if s['state'].startswith('OK'))} "
                      f"md={mpath} json={jpath}")
        print(mpath)
        print(jpath)
        return 0
    except (Failed, Exception) as e:  # noqa: BLE001
        why = f"{type(e).__name__}: {e}"
        receipt("FAILED", why)
        print(f"FAILED {why}", file=sys.stderr)
        return 1


def render_md(r: dict) -> str:
    L = []
    w = r["window"]
    L.append(f"# Newest models — weekly measurement report ({r['report_date']})\n")
    L.append(f"Window {w['from'][:16]}Z to {w['to_exclusive'][:16]}Z (UTC, 7 days, end exclusive). Generated {r['generated_at']} by "
             "`oracle-micro-2:~/lanes/mill-kaggle-daily/reports/newest_models_weekly.py`. "
             f"**{r['publication']}**\n")
    L.append("## Standing rules\n")
    for s in r["standing_rules"]:
        L.append(f"- {s}")
    q = r["quota"]
    L.append(f"\nKaggle kernel wall this window: {q['kernel_wall_s_this_window']} s "
             f"({q['used_share']*100:.1f}% of the {q['cap_h']:.0f} h weekly cap the job enforces).\n")

    L.append("## Newest-class models in the rotation\n")
    L.append("| model (Ollama tag) | lab | released (source) | licence | params | this week |")
    L.append("|---|---|---|---|---|---|")
    for m in r["newest_class"]:
        L.append(f"| `{m['tag']}` | {m['lab']} | {m['release_date']} ({m['release_source'].split(' ')[0]}) | "
                 f"{m['licence']} | {m['params']/1e9:.2f}B | {m['status']} |")

    L.append("\n## Slices run this week\n")
    L.append("| slice | model | class | state | axes signed | kernel s | branch@commit |")
    L.append("|---|---|---|---|---|---|---|")
    for s in r["slices"]:
        L.append(f"| {s['slice']} | `{s['model']}` | {s['class']} | {s['state']} | {s['signed']} | "
                 f"{s['kernel_wall_s']} | {s['branch']}@{s['commit']} |")
        if not s["state"].startswith("OK"):
            L.append(f"|  | reason: {s['reason'][:160]} |  |  |  |  |  |")

    for s in r["slices"]:
        if not s.get("axes"):
            continue
        rt = s.get("runtime") or {}
        L.append(f"\n### `{s['model']}` — slice {s['slice']}\n")
        L.append(f"Runtime: {rt.get('substrate')}; GPU `{rt.get('gpu')}`; Ollama {rt.get('ollama')}; manifest "
                 f"`{str(rt.get('manifest_digest'))[:16]}…` pinned via {rt.get('pin_source')}. "
                 "Every card: **NOT ADMITTED** unless the admission column says otherwise.\n")
        L.append("| axis | k/n | accuracy | Wilson 95% | excluded (parse/transport) | done=length | card | admission |")
        L.append("|---|---|---|---|---|---|---|---|")
        for a in s["axes"]:
            acc = "—" if a["accuracy"] is None else f"{a['accuracy']:.3f}"
            flag = "" if a["counts_match_intake"] else " ⚠ counts≠intake"
            L.append(f"| {a['axis']} | {a['k']}/{a['n']}{flag} | {acc} | {fmt_ci(a['wilson95'])} | "
                     f"{a['parse_errors_excluded']}/{a['transport_errors_excluded']} | {a['done_reason_length']}/"
                     f"{a['item_rows']} | `{str(a['card_id'])[:12]}` | {a['admission']} |")
        L.append("\nswarm is keyword-graded (KEYWORD_MATCH_ALL, 1,024-token budget); every other axis is exact-label "
                 "(128 tokens). Wilson intervals describe item sampling only; they do not cover cross-hardware "
                 "variation (measured 2.66% item grade flips 3090 vs Kaggle, CI 2.36–3.00).")

    L.append("\n## Separation this week (third-party models only)\n")
    if not r["separation"]:
        L.append("No axis had a measured third-party model this week: every axis is UNTESTED.")
    else:
        L.append("| axis | verdict | models measured | leader vs runner-up | paired | b10/c01 | McNemar p |")
        L.append("|---|---|---|---|---|---|---|")
        for sp in r["separation"]:
            if sp["verdict"] == "UNTESTED":
                L.append(f"| {sp['axis']} | UNTESTED | {len(sp['models'])} | — | — | — | — |")
            else:
                L.append(f"| {sp['axis']} | {sp['verdict']} | {len(sp['models'])} | `{sp['leader']}` vs "
                         f"`{sp['runner_up']}` | {sp['paired_items']} | {sp['b10']}/{sp['c01']} | {sp['mcnemar_p']} |")
        L.append("\nA TIE is not a win and is not reported as one. Model order in a TIE row is by raw accuracy and "
                 "carries no meaning.")

    inv = r.get("inventory")
    if inv:
        L.append(f"\n## Release inventory ({inv['_file']}, as of {inv['as_of']}"
                 f"{', STALE: older than 7 days' if inv['_stale'] else ''})\n")
        L.append("| model | lab | released | params | licence | fits Kaggle 2xT4 | note |")
        L.append("|---|---|---|---|---|---|---|")
        for m in inv["open_weight"]:
            L.append(f"| {m['name']} | {m['lab']} | {m['released']} | {m['params_b']}B | {m['licence']} | "
                     f"{m['fits_kaggle']} | {m.get('rotation') or m['why']} |")
    if r.get("frontier_cost"):
        tb = r["token_basis"]
        L.append(f"\n## Frontier API models — cost of one full 14-axis run (information only; nothing was spent)\n")
        L.append(f"Token basis: {tb['items']} items, {tb['prompt_tokens']:,} prompt + {tb['output_tokens']:,} output "
                 f"tokens ({tb['from']}), x{r['frontier_cost_assumptions']['tokenizer_margin']} tokenizer margin. "
                 f"'With reasoning' adds an ASSUMED {r['frontier_cost_assumptions']['reasoning_tokens_per_item_scenario']:,}"
                 " reasoning tokens per item billed as output.\n")
        L.append("| model | announced | $/MTok in/out | floor | with reasoning | batch (floor / reasoning) | access |")
        L.append("|---|---|---|---|---|---|---|")
        for c in r["frontier_cost"]:
            b = "—" if c["usd_floor_batch"] is None else f"${c['usd_floor_batch']} / ${c['usd_with_reasoning_batch']}"
            L.append(f"| {c['model']} | {c['announced']} | {c['price_in_per_mtok']}/{c['price_out_per_mtok']} | "
                     f"${c['usd_floor']} | ${c['usd_with_reasoning']} | {b} | {c['access']} |")
        L.append(f"\n{r['frontier_cost_assumptions']['note']}")
    L.append("")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    sys.exit(main())
