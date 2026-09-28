#!/usr/bin/env python3
"""gspc_separation_from_rows.py — the GSPC board's separation determinations, computed from the
PUBLISHED per-item rows with the separation rule fixed on 2026-08-13. Nothing here is typed.

WHAT IT READS
  The 13 frozen boards-v2-2026-08-12 per-item row files (15,580 rows, 19-model fleet), published
  byte-identical on Hugging Face as csoai/gspc-peritem-rows-2026-08-12 (CC-BY-4.0). Every file is
  checked against SHA256SUMS before a single row is read; one byte off and the run stops.

THE RULE (decided 2026-08-13, not reopened here)
  Rank the fleet by accuracy on the axis. The leader is SEPARATED only if an exact McNemar test on
  the discordant items, leader vs the best BASE model, gives p < 0.05. Otherwise TIE. Wilson 95%
  intervals are published beside the test as annotation; CI overlap or disjointness decides
  nothing. The test body below (wilson, mcnemar, ranking, best-base comparator, p<0.05) is copied
  from the 2026-08-13 harness (sha256 d73a4f0ffa73a14c...); no threshold is changed.

  ONE ADDITION, the board's own-model exclusion: a neutral measurement body does not rank its own
  models against the vendors it measures, so CSOAI's own fine-tunes (the sov6-*-v3-light rows,
  published on the board as council-*-v3-light "council specialists") are removed from the fleet
  BEFORE ranking. What remains is the 6-model base fleet. The full-fleet result (own models
  included) is also computed and published, labelled as an in-lane result that is not a public
  ranking.

  A CONTROL: labels are shuffled within each item (seed 20260927, 1000 permutations) and the same
  test re-run. The share of shuffles that come out SEPARATED must stay near the 5% the test
  promises; the observed rates are published beside the result.

MODES
  --rows DIR [--json OUT]           run the test on a local copy of the rows (stdlib only). This is
                                    what the published dataset's separation_test.py runs.
  --board REPO                      additionally write the board's generated module
                                    (functions/api/_gspc_rows_separation.ts) and the public record
                                    (public/interop/gspc-peritem-rows-2026-08-12.json) inside REPO,
                                    reading REPO/public/signed/card_index.json to decide which axes
                                    carry signed cards and whether the rows' leader has a signed
                                    per-model card of its own.
  --dataset-revision SHA            the Hugging Face commit the rows were read from (recorded).
  --power REPO                      (2026-09-28, board honesty) write ONLY the unsigned generated
                                    module functions/api/_gspc_rows_power.ts inside REPO: per axis
                                    distinct_items, paired_items, the observed discordance rate and
                                    the minimum detectable effect (MDE) of the board's own test at
                                    80% power, plus the fleet roster counted from the rows. It never
                                    writes the signed public record, so it can run without a re-sign.

POWER (added 2026-09-28; the test itself is unchanged)
  A TIE says the test did not separate two models. It does not say how large a difference the
  test could have seen. The MDE is the smallest accuracy difference (leader minus best base
  model) that the exact two-sided McNemar test at p<0.05 detects with 80% probability, given the
  axis's paired items and its observed discordance rate (the share of paired items on which
  exactly one of the two models is right). It is computed by exact binomial enumeration with the
  same mcnemar() body, not a normal approximation. When no difference up to the observed
  discordance reaches 80% power, the MDE is null with state NOT_REACHABLE — never a number.

WHAT IT DOES NOT DO
  It does not re-grade a row, re-run a model, or edit the frozen 2026-08-13 manifests (their
  peritem_sha256 is null, and they stay as signed). It binds the rows by hash in a NEW record.
  A TIE is not a win and is never published as one. UNTESTED is not a tie.
  --board refuses to rewrite the public record when a .signed.json beside it binds different
  bytes (pass --allow-signed-rewrite only when a re-sign follows in the same change).
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import math
import os
import random
import sys
from datetime import datetime, timezone
from math import comb

DATASET = "csoai/gspc-peritem-rows-2026-08-12"
RECORD_ID = "gspc-peritem-rows-2026-08-12"
SEED = 20260927
NPERM = int(os.environ.get("NPERM", "1000"))

# board axis id -> frozen row file (the 2026-08-13 short ids)
AXIS_FILE = {
    "governance": "peritem_gov.jsonl",
    "safety": "peritem_agi.jsonl",
    "continuity": "peritem_asi.jsonl",
    "provenance": "peritem_prv.jsonl",
    "cross-reality": "peritem_xr.jsonl",
    "detector-interop": "peritem_det.jsonl",
    "art5-safeguard": "peritem_art5.jsonl",
    "care": "peritem_care.jsonl",
    "conformance": "peritem_mcp.jsonl",
    "openness": "peritem_oss.jsonl",
    "machinery-conformity": "peritem_mach.jsonl",
    "swarm": "peritem_swarm.jsonl",
    "affect": "peritem_affect.jsonl",
}

# ── the 2026-08-13 test body, verbatim ───────────────────────────────────────
BASES = {"gemma3:12b", "llama3.2:3b", "qwen2.5:3b", "qwen2.5:0.5b-instruct", "mistral:7b", "deepseek-r1:8b"}


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
# ─────────────────────────────────────────────────────────────────────────────


def is_own(model: str) -> bool:
    """CSOAI's own fine-tunes: sov6-* in the frozen rows, council-* on the public board."""
    return model.startswith("sov6-") or model.lower().startswith("council")


def run(rows, keep):
    per = collections.defaultdict(lambda: [0, 0])
    peritem = collections.defaultdict(dict)
    for r in rows:
        if str(r.get("transport_error", "")).startswith("TRANSPORT"):
            continue
        m = r["model"]
        if not keep(m):
            continue
        ok = bool(r.get("correct"))
        per[m][1] += 1
        per[m][0] += ok
        peritem[r["item"]][m] = ok
    rank = sorted(per.items(), key=lambda kv: -kv[1][0] / max(1, kv[1][1]))
    lead, (wk, wn) = rank[0]
    wci = wilson(wk, wn)
    others = [(m, kn) for m, kn in rank if m != lead]
    bases = [(m, kn) for m, kn in others if m in BASES] or others[:1]
    bm, (bk, bn) = bases[0]
    bci = wilson(bk, bn)
    b10 = c01 = 0
    for res in peritem.values():
        if lead in res and bm in res:
            if res[lead] and not res[bm]:
                b10 += 1
            elif res[bm] and not res[lead]:
                c01 += 1
    p = mcnemar(b10, c01)
    return {
        "leader": {"model": lead, "k": wk, "n": wn, "accuracy": round(wk / wn, 4),
                   "interval": [round(wci[0], 3), round(wci[1], 3)]},
        "runner_up": {"model": bm, "k": bk, "n": bn, "accuracy": round(bk / bn, 4),
                      "interval": [round(bci[0], 3), round(bci[1], 3)]},
        "paired_items": sum(1 for r in peritem.values() if lead in r and bm in r),
        "b10": b10,
        "c01": c01,
        "mcnemar_p": None if p is None else round(p, 4),
        "ci_disjoint": wci[0] > bci[1] or bci[0] > wci[1],
        "verdict": "SEPARATED" if (p is not None and p < 0.05) else "TIE",
        "fleet": sorted(per),
    }


def shuffled(rows, rng, keep):
    by = collections.defaultdict(list)
    for r in rows:
        if keep(r["model"]):
            by[r["item"]].append(r)
    out = []
    for it, rs in by.items():
        vals = [bool(r.get("correct")) for r in rs]
        rng.shuffle(vals)
        for r, v in zip(rs, vals):
            out.append({"item": it, "model": r["model"], "correct": v, "transport_error": None})
    return out


def control(rows, ext, nperm):
    """Shuffle labels within items; count how often the test still says SEPARATED."""
    rng = random.Random(SEED)
    keep = lambda m: not is_own(m)  # noqa: E731
    sel = fixed = 0
    pair = (ext["leader"]["model"], ext["runner_up"]["model"])
    pr = [r for r in rows if r["model"] in pair]
    for _ in range(nperm):
        if run(shuffled(rows, rng, keep), lambda m: True)["verdict"] == "SEPARATED":
            sel += 1
        per = collections.defaultdict(dict)
        for r in shuffled(pr, rng, lambda m: True):
            per[r["item"]][r["model"]] = r["correct"]
        b = sum(1 for d in per.values() if len(d) == 2 and d[pair[0]] and not d[pair[1]])
        c = sum(1 for d in per.values() if len(d) == 2 and d[pair[1]] and not d[pair[0]])
        p = mcnemar(b, c)
        if p is not None and p < 0.05:
            fixed += 1
    return {"nperm": nperm, "seed": SEED,
            "shuffle_reselect_separated_rate": round(sel / nperm, 4) if nperm else None,
            "shuffle_fixed_pair_separated_rate": round(fixed / nperm, 4) if nperm else None}


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_sums(rows_dir):
    """SHA256SUMS sits beside rows/ (dataset layout) or inside the rows dir. Every file must match."""
    for cand in (os.path.join(rows_dir, "..", "SHA256SUMS"), os.path.join(rows_dir, "SHA256SUMS")):
        if os.path.exists(cand):
            sums_path = os.path.normpath(cand)
            break
    else:
        raise SystemExit("ABORT no SHA256SUMS beside the rows — an unhashed row is not a published row")
    base = os.path.dirname(sums_path)
    sums_bytes = open(sums_path, "rb").read()
    listed = {}
    for line in sums_bytes.decode("utf-8").splitlines():
        if not line.strip():
            continue
        digest, name = line.split(None, 1)
        listed[os.path.basename(name.strip().lstrip("*"))] = (digest, os.path.join(base, name.strip().lstrip("*")))
    missing = sorted(set(AXIS_FILE.values()) - set(listed))
    if missing:
        raise SystemExit(f"ABORT SHA256SUMS does not list {missing}")
    for fname, (digest, path) in sorted(listed.items()):
        got = sha256_file(path)
        if got != digest:
            raise SystemExit(f"ABORT {fname}: sha256 {got} != SHA256SUMS {digest}")
    return hashlib.sha256(sums_bytes).hexdigest(), {k: v[0] for k, v in listed.items()}


# ── power: what size of difference could the fixed test have seen? (2026-09-28) ─────────────
ALPHA = 0.05
POWER = 0.80


def _binom_pmf(k, n, p):
    if p <= 0.0:
        return 1.0 if k == 0 else 0.0
    if p >= 1.0:
        return 1.0 if k == n else 0.0
    return math.exp(math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)
                    + k * math.log(p) + (n - k) * math.log1p(-p))


def reject_kmax(n, alpha=ALPHA):
    """For every discordant count D in 0..n: the largest k such that mcnemar(k, D-k) < alpha, or -1
    when no split of D discordant items can reach it. Uses the SAME mcnemar() body as the test, so
    the rejection region is the board's, not an approximation of it."""
    table = []
    for d in range(n + 1):
        k = -1
        for i in range(d // 2 + 1):
            p = mcnemar(i, d - i)
            if p is not None and p < alpha:
                k = i
            else:
                break
        table.append(k)
    return table


def mcnemar_power(n, psi, delta, alpha=ALPHA, kmax=None):
    """Probability that the exact two-sided McNemar test at `alpha` rejects, for n paired items,
    discordance probability psi (P exactly one of the two is right) and accuracy difference delta
    (leader minus comparator; 0 <= delta <= psi). Exact enumeration over the discordant count."""
    if not (0.0 <= delta <= psi <= 1.0):
        raise ValueError(f"need 0 <= delta <= psi <= 1, got delta={delta} psi={psi}")
    if n < 1 or psi == 0.0:
        return 0.0
    kmax = kmax if kmax is not None else reject_kmax(n, alpha)
    pi = (psi + delta) / (2.0 * psi)  # P(leader-only-correct | discordant)
    total = 0.0
    for d in range(n + 1):
        k = kmax[d]
        if k < 0:
            continue
        pd = _binom_pmf(d, n, psi)
        if pd < 1e-15:
            continue
        rej = sum(_binom_pmf(b, d, pi) for b in range(0, k + 1))
        rej += sum(_binom_pmf(b, d, pi) for b in range(d - k, d + 1))
        total += pd * rej
    return min(1.0, total)


def mcnemar_mde(n, psi, alpha=ALPHA, power=POWER, tol=1e-5):
    """Smallest delta in [0, psi] with mcnemar_power >= power, rounded UP to 0.001 (conservative).
    Returns (mde, state): state is MEASURED, NOT_REACHABLE (even delta = psi, every discordant
    item favouring one model, stays under `power`) or UNDEFINED (no paired item, or no discordant
    one: psi == 0, so there is no difference the test could be asked to see)."""
    if n < 1 or psi <= 0.0:
        return None, "UNDEFINED"
    kmax = reject_kmax(n, alpha)
    if mcnemar_power(n, psi, psi, alpha, kmax) < power:
        return None, "NOT_REACHABLE"
    lo, hi = 0.0, psi
    while hi - lo > tol:
        mid = (lo + hi) / 2.0
        if mcnemar_power(n, psi, mid, alpha, kmax) >= power:
            hi = mid
        else:
            lo = mid
    return min(psi, math.ceil(hi * 1000 - 1e-9) / 1000), "MEASURED"


def fleet_roster(models):
    """Count the fleet from the model ids that actually appear in the rows. Names only for base
    models (third-party); our own fine-tunes are counted, never listed or ranked."""
    models = set(models)
    own = sorted(m for m in models if is_own(m))
    base = sorted(m for m in models if m in BASES)
    other = sorted(m for m in models if m not in BASES and not is_own(m))
    return {"models_in_rows": len(models), "base_count": len(base), "base_models": base,
            "own_count": len(own), "other_count": len(other), "other_models": other}


def axis_power(res_ext, distinct_items, alpha=ALPHA, power=POWER):
    """Power figures for one axis from its own-model-excluded test result (leader vs best base)."""
    paired = res_ext["paired_items"]
    disc = res_ext["b10"] + res_ext["c01"]
    psi = disc / paired if paired else 0.0
    mde, state = mcnemar_mde(paired, psi, alpha, power)
    return {
        "distinct_items": distinct_items,
        "paired_items": paired,
        "discordant_items": disc,
        "discordance_rate": round(psi, 4),
        "mde": mde,
        "mde_state": state,
    }


def power_rows(rows_dir):
    """The --power pass: verify the rows, then per axis the own-excluded test inputs and the MDE.
    No shuffle control (it decides nothing here), no card index, no signed record."""
    peritem_sha256, _sums = verify_sums(rows_dir)
    axes, models = {}, set()
    for axis, fname in AXIS_FILE.items():
        raw = open(os.path.join(rows_dir, fname), "rb").read()
        rows = [json.loads(line) for line in raw.decode("utf-8").splitlines() if line.strip()]
        models.update(r["model"] for r in rows)
        ext = run(rows, lambda m: not is_own(m))
        axes[axis] = {"file": fname, "sha256": hashlib.sha256(raw).hexdigest(),
                      "leader": ext["leader"]["model"], "next_best": ext["runner_up"]["model"],
                      "mcnemar_p": ext["mcnemar_p"], "verdict": ext["verdict"],
                      **axis_power(ext, len({r["item"] for r in rows}))}
    return peritem_sha256, fleet_roster(models), axes


def write_power_module(repo, rows_dir, revision):
    peritem_sha256, fleet, axes = power_rows(rows_dir)
    module = {
        "schema": "csoai.gspc-rows-power/0.1",
        "dataset": DATASET,
        "dataset_revision": revision,
        "peritem_sha256": peritem_sha256,
        "alpha": ALPHA,
        "power": POWER,
        "method": "Minimum detectable effect (MDE): the smallest accuracy difference between the leader and the "
                  "best base model that the board's exact two-sided McNemar test (p<0.05) detects with 80% "
                  "probability, given the axis's paired items and its observed discordance rate (the share of "
                  "paired items on which exactly one of the two models is right). Exact binomial enumeration "
                  "with the same test body, not a normal approximation; rounded up to 0.001. Our own models are "
                  "removed before ranking, as for separation. NOT_REACHABLE means no difference up to the "
                  "observed discordance reaches 80% power, so there is no MDE to state; UNDEFINED means no "
                  "paired item is discordant, so the test has nothing to count.",
        "fleet": {**fleet,
                  "rule": "Counted from the model ids present in the published rows. Base models are ranked; "
                          "CSOAI's own fine-tunes are excluded before ranking and never counted in a comparison."},
        "producer": "scripts/gspc_separation_from_rows.py --power",
        "signed": False,
        "signed_note": "Not a signed artifact. It adds power figures beside the signed rows record "
                       "(/interop/gspc-peritem-rows-2026-08-12.json) and changes none of that record's bytes.",
        "axes": axes,
    }
    ts = ("/** GENERATED by scripts/gspc_separation_from_rows.py --power from the published per-item rows\n"
          f" * ({DATASET}@{revision}). Do not edit by hand — re-run the producer.\n"
          " * Unsigned: it sits beside the signed rows record and changes none of its bytes. */\n"
          "export const ROWS_POWER = " + json.dumps(module, indent=2, ensure_ascii=False) + " as const;\n")
    out = os.path.join(repo, "functions/api/_gspc_rows_power.ts")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(ts)
    return module


def test_rows(rows_dir, nperm):
    peritem_sha256, sums = verify_sums(rows_dir)
    out = {}
    for axis, fname in AXIS_FILE.items():
        raw = open(os.path.join(rows_dir, fname), "rb").read()
        rows = [json.loads(line) for line in raw.decode("utf-8").splitlines() if line.strip()]
        ext = run(rows, lambda m: not is_own(m))
        full = run(rows, lambda m: True)
        out[axis] = {
            "file": fname,
            "sha256": hashlib.sha256(raw).hexdigest(),
            "rows": len(rows),
            "distinct_items": len({r["item"] for r in rows}),
            "transport_errors": sum(1 for r in rows if str(r.get("transport_error", "")).startswith("TRANSPORT")),
            "own_model_excluded": ext,
            "full_fleet_in_lane": {**full, "label": "in-lane result including our own models; not a public ranking"},
            "control": control(rows, ext, nperm),
        }
        assert out[axis]["sha256"] == sums[fname]
    return peritem_sha256, sums, out


# ── board mode ───────────────────────────────────────────────────────────────
# board axis id -> the card-index axis keys that can carry a per-model card for it. The keys are
# NOT the board ids and the crosswalk is irregular, so it is written out (see gspc.ts
# CARDED_MODEL_AXES). An axis with no key here carries no signed card at all.
CARD_KEYS = {
    "governance": ["gspc-governance", "gov"],
    "safety": ["gspc-safety"],
    "provenance": ["gspc-provenance"],
    "continuity": ["gspc-continuity"],
    "conformance": ["gspc-conformance"],
    "openness": ["gspc-openness"],
    "care": ["care"],
    "swarm": ["swarm-candidates"],
}
# The published swarm rows are the RETIRED 3-prompt PROTOCOL bank (40 rows per model over 3
# distinct items). The board's swarm row serves the wave-2b bank. Rows from one bank cannot
# decide a determination about another.
RETIRED_BANK = {
    "swarm": "The published swarm rows are the retired 3-prompt PROTOCOL bank (40 rows per model over 3 "
             "distinct items), not the wave-2b bank the board's swarm row serves; rows from one bank "
             "cannot decide a separation determination about another.",
}


def card_models(repo):
    idx = json.load(open(os.path.join(repo, "public/signed/card_index.json")))
    by = collections.defaultdict(list)
    for c in idx["cards"]:
        if not c.get("signed", True):
            continue
        body = json.load(open(os.path.join(repo, "public" + c["card_url"])))["body"]
        by[c["axis"]].append({"model": body.get("model"), "accuracy": body.get("accuracy"),
                              "card": c["card"], "card_url": c["card_url"]})
    return by


def determination(axis, res, cards):
    ext = res["own_model_excluded"]
    keys = [k for k in CARD_KEYS.get(axis, []) if cards.get(k)]
    if axis in RETIRED_BANK:
        return {"determination": "UNTESTED", "untested_reason_code": "ROWS_ARE_A_RETIRED_BANK",
                "untested_reason": RETIRED_BANK[axis]}
    if res["distinct_items"] < 30:
        return {"determination": "UNTESTED", "untested_reason_code": "TOO_FEW_DISTINCT_ITEMS",
                "untested_reason": f"{res['distinct_items']} distinct items; a paired test needs at least 30."}
    if not keys:
        return {"determination": "UNTESTED", "untested_reason_code": "NO_SIGNED_CARD_FOR_AXIS",
                "untested_reason":
                    f"The published rows give {ext['verdict']} (exact McNemar p={ext['mcnemar_p']}, "
                    f"n={ext['leader']['n']}), but this axis has no signed card of any model in the public "
                    "card index (/signed/card_index.json). The board publishes a separation determination "
                    "only on axes that carry signed cards, so this one stays UNTESTED rather than resting "
                    "on rows alone."}
    lead = ext["leader"]["model"]
    match = [c for k in keys for c in cards[k] if c["model"] == lead]
    if not match:
        card = {"state": "NO_SIGNED_PER_MODEL_CARD",
                "note": "leader shown from per-item rows; no signed per-model card yet"}
    else:
        same = [c for c in match if isinstance(c["accuracy"], (int, float))
                and abs(c["accuracy"] - ext["leader"]["accuracy"]) < 0.0005]
        if same:
            card = {"state": "SIGNED_PER_MODEL_CARD", "card": same[0]["card"], "card_url": same[0]["card_url"],
                    "note": "leader shown from per-item rows; the signed per-model card records the same accuracy"}
        else:
            c = match[0]
            card = {"state": "CARD_RECORDS_A_DIFFERENT_MEASUREMENT", "card": c["card"], "card_url": c["card_url"],
                    "card_accuracy": c["accuracy"],
                    "note": "leader shown from per-item rows; no signed per-model card yet for this run — the "
                            f"signed card for {lead} on this axis records a different measurement "
                            f"(accuracy {c['accuracy']}), so it does not back the number shown"}
    return {"determination": ext["verdict"], "card_keys": keys, "leader_card": card}


def sentence(ext):
    n = ext["leader"]["n"]
    if ext["verdict"] == "TIE":
        return (f"No model separated from the next best on this axis (exact McNemar, p≥0.05, n={n}; "
                f"p={ext['mcnemar_p']}).")
    return (f"The leading model separated from the next best on this axis (exact McNemar, p<0.05, n={n}; "
            f"p={ext['mcnemar_p']}).")


def board(repo, peritem_sha256, sums, results, revision, allow_signed_rewrite=False):
    cards = card_models(repo)
    axes = {}
    for axis, res in results.items():
        ext = res["own_model_excluded"]
        d = determination(axis, res, cards)
        entry = {
            "file": res["file"], "sha256": res["sha256"], "rows": res["rows"],
            "distinct_items": res["distinct_items"], **d,
            "test": {k: ext[k] for k in ("leader", "runner_up", "paired_items", "b10", "c01", "mcnemar_p", "ci_disjoint", "verdict")},
            "control": res["control"],
        }
        if d["determination"] != "UNTESTED":
            entry["sentence"] = sentence(ext)
        axes[axis] = entry
    record = {
        "schema": "csoai.gspc-peritem-rows/0.1",
        "record_id": RECORD_ID,
        "created_utc": os.environ.get("CREATED_UTC") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dataset": DATASET,
        "dataset_url": f"https://huggingface.co/datasets/{DATASET}",
        "dataset_revision": revision,
        "licence": "CC-BY-4.0",
        "peritem_sha256": peritem_sha256,
        "peritem_sha256_is": "sha256 of the dataset's SHA256SUMS file bytes — one line '<sha256>  rows/<file>' per "
                             "row file, sorted by file name. Recompute: sha256sum rows/*.jsonl > SHA256SUMS; "
                             "sha256sum SHA256SUMS.",
        "files": {f: sums[f] for f in sorted(sums)},
        "rows_total": sum(r["rows"] for r in results.values()),
        "frozen_manifests_note": "The signed 2026-08-13 board-freeze manifests carry peritem_sha256: null "
                                 "(the rows were not published then). They stay as signed; this record binds "
                                 "the rows by hash instead of editing them.",
        "rule": "Leader vs best base model; SEPARATED iff exact McNemar p<0.05 on discordant items, else TIE "
                "(decided 2026-08-13). Wilson 95% intervals are annotation only.",
        "own_model_exclusion": "CSOAI's own fine-tunes (sov6-*-v3-light in the rows; council-*-v3-light on "
                               "the board) are removed before ranking. Base fleet of 6.",
        "producer": "scripts/gspc_separation_from_rows.py",
        "publication_rule": "A determination is published only on an axis that carries signed cards in "
                            "/signed/card_index.json and whose rows are the bank the board row serves. "
                            "Elsewhere the axis stays UNTESTED with its reason.",
        "axes": axes,
        "objections": "https://councilof.ai/census/",
    }
    rec_path = os.path.join(repo, "public/interop/gspc-peritem-rows-2026-08-12.json")
    rec_bytes = (json.dumps(record, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    signed_path = rec_path[: -len(".json")] + ".signed.json"
    if os.path.exists(signed_path) and not allow_signed_rewrite:
        bound = json.load(open(signed_path, encoding="utf-8")).get("payload", {}).get("artifact", {}).get("sha256")
        got = hashlib.sha256(rec_bytes).hexdigest()
        if bound != got:
            raise SystemExit(f"ABORT {os.path.basename(signed_path)} binds sha256 {bound}; this run would write "
                             f"{got}. Refusing to change signed bytes. Set CREATED_UTC to the signed record's "
                             "created_utc to reproduce it, or pass --allow-signed-rewrite with a re-sign in the "
                             "same change.")
    with open(rec_path, "wb") as fh:
        fh.write(rec_bytes)
    ts = ("/** GENERATED by scripts/gspc_separation_from_rows.py from the published per-item rows\n"
          f" * ({DATASET}@{revision}). Do not edit by hand — re-run the producer. */\n"
          "export const ROWS_SEPARATION = " + json.dumps(record, indent=2, ensure_ascii=False) + " as const;\n")
    with open(os.path.join(repo, "functions/api/_gspc_rows_separation.ts"), "w", encoding="utf-8") as fh:
        fh.write(ts)
    return record


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rows", required=True, help="directory holding the 13 peritem_*.jsonl files")
    ap.add_argument("--json", help="write the full test result here")
    ap.add_argument("--board", help="councilof-ai repo root: write the board module + public record")
    ap.add_argument("--dataset-revision", default="UNRECORDED")
    ap.add_argument("--power", metavar="REPO",
                    help="write ONLY the unsigned functions/api/_gspc_rows_power.ts (distinct_items, MDE, fleet)")
    ap.add_argument("--allow-signed-rewrite", action="store_true",
                    help="with --board: rewrite the public record even when its .signed.json binds other bytes")
    a = ap.parse_args()
    if a.power:
        mod = write_power_module(a.power, a.rows, a.dataset_revision)
        f = mod["fleet"]
        print(f"fleet models_in_rows={f['models_in_rows']} base={f['base_count']} own={f['own_count']} "
              f"other={f['other_count']}")
        for axis, e in mod["axes"].items():
            print(f"  power {axis:21s} distinct={e['distinct_items']:4d} paired={e['paired_items']:4d} "
                  f"disc={e['discordant_items']:3d} psi={e['discordance_rate']:.4f} mde={e['mde']} {e['mde_state']}")
        if not (a.json or a.board):
            return 0
    peritem_sha256, sums, results = test_rows(a.rows, NPERM)
    for axis, r in results.items():
        e = r["own_model_excluded"]
        print(f"{axis:21s} {e['verdict']:9s} {e['leader']['model']:22s} {e['leader']['k']}/{e['leader']['n']} "
              f"vs {e['runner_up']['model']:22s} {e['runner_up']['k']}/{e['runner_up']['n']} p={e['mcnemar_p']} "
              f"ctrl={r['control']['shuffle_fixed_pair_separated_rate']}")
    print(f"peritem_sha256 {peritem_sha256}")
    if a.json:
        with open(a.json, "w", encoding="utf-8") as fh:
            json.dump({"dataset": DATASET, "peritem_sha256": peritem_sha256, "files": sums,
                       "rule": "SEPARATED iff exact McNemar p<0.05 vs best base model (2026-08-13)",
                       "axes": results}, fh, indent=1, sort_keys=True, ensure_ascii=False)
            fh.write("\n")
    if a.board:
        rec = board(a.board, peritem_sha256, sums, results, a.dataset_revision, a.allow_signed_rewrite)
        for axis, e in rec["axes"].items():
            print(f"  board {axis:21s} {e['determination']:9s} {e.get('untested_reason_code', '')} "
                  f"{e.get('leader_card', {}).get('state', '')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
