#!/usr/bin/env python3
"""elo_reference.py — the producer of public/arena/elo_reference.json (per-axis Elo reference).

Lifted into the repo 2026-09-22 from /workspace/arena-24x7/elo_reference.py on the 3090 pod:
until then the artifact was committed without its producer (the file last regenerated
2026-08-24 from a feed that had stopped on 2026-08-19). A claim lives in the artifact AND
its producer; this is the producer.

Method (unchanged): Bradley-Terry Elo, K=32, base 1500, per-axis and overall; Wilson 95% CI
on win-rate; a model is ranked on an axis only with n>=5 DECIDED games there. Ties are not
games for Elo (they carry no information about who is better) and are counted separately.
A round carrying style_controlled_weight<1 is credited at that weight; none of the current
corpus does, and the output says so (style_weighted_rounds) instead of implying it.

Input rounds (one JSON object per line), either shape:
  {round, ts, axis, "<modelA>": {score, elo}, "<modelB>": {score, elo}, winner: <model>|"tie"}
  {ts, axis, model, grok_model, winner}
Provenance keys (bank_sha256, item, grader, prompt_sha256, ...) are ignored: a model key is a
key whose value is a dict carrying "score".

Signing: --pod-token-file signs a <=3 KB ENVELOPE {schema, content_id, generated, n_rounds,
sources} with did:web:csoai.org#board-attestation-1 via POST /api/board-sign (the body is far
over 3 KB). Verify: recompute content_id from the body, compare with envelope.content_id, then
verify sig_ed25519 over canonical(envelope). scripts/verify_signed.py does this.

Usage:
  python3 scripts/arena/elo_reference.py --rounds public/arena/rounds.jsonl \
      --out public/arena/elo_reference.json [--pod-token-file /workspace/secrets/board-sign-pod-token]
"""
import argparse, hashlib, json, math, os, sys, time
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board_sign import canonical, norm, sha256_hex, assert_ascii  # noqa: E402

K = 32.0
Z = 1.96
MIN_GAMES = 5
BASE = 1500.0
SCHEMA = "csoai.arena-elo-reference/0.2"


def load_rounds(paths):
    rounds, sources = [], []
    for p in paths:
        pf = Path(p)
        if not pf.exists():
            print(f"skip {p} (missing)", file=sys.stderr)
            continue
        raw = pf.read_bytes()
        n_ok = n_bad = 0
        for line in raw.decode("utf-8", "replace").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rounds.append(json.loads(line)); n_ok += 1
            except Exception:
                n_bad += 1
        sources.append({"path": str(p), "sha256": sha256_hex(raw), "rounds": n_ok, "unparsable_lines": n_bad})
    return rounds, sources


def model_keys(r):
    return [k for k, v in r.items() if isinstance(v, dict) and "score" in v]


def parse_round(r):
    """-> (a, b, wa, wb, axis, weight) for a decided round; "tie" for a tie; None if unusable."""
    winner = r.get("winner") or ""
    axis = r.get("axis") or "general"
    sw = float(r.get("style_controlled_weight") or 1.0)
    mk = model_keys(r)
    if len(mk) >= 2:
        a, b = mk[0], mk[1]
        if winner in ("tie", "TIE", "draw"):
            return "tie"
        if winner not in (a, b):
            return None
        wa = 1.0 if winner == a else 0.0
        return a, b, wa, 1.0 - wa, axis, sw
    a = r.get("model") or r.get("model_a") or r.get("a")
    b = r.get("grok_model") or r.get("model_b") or r.get("b")
    if not a or not b:
        return None
    if winner in ("TIE", "tie", "draw"):
        return "tie"
    if winner in ("UNMEASURED", "", "NONE", "None"):
        return None
    if winner in (a, "LOCAL", "A"):
        wa, wb = 1.0, 0.0
    elif winner in (b, "GROK", "B"):
        wa, wb = 0.0, 1.0
    else:
        return None
    return a, b, wa, wb, axis, sw


def wilson(wr, n):
    denom = 1 + Z * Z / n
    center = (wr + Z * Z / (2 * n)) / denom
    margin = Z * math.sqrt((wr * (1 - wr) / n) + (Z * Z / (4 * n * n))) / denom
    return [round(max(0.0, center - margin), 3), round(min(1.0, center + margin), 3)]


def compute_elo(rounds):
    ratings = defaultdict(lambda: BASE)
    axis_ratings = defaultdict(lambda: defaultdict(lambda: BASE))
    games = defaultdict(int); axis_games = defaultdict(lambda: defaultdict(int))
    wins = defaultdict(float); axis_wins = defaultdict(lambda: defaultdict(float))
    ties = defaultdict(int); axis_ties = defaultdict(int)
    stats = {"decided": 0, "ties": 0, "unusable": 0, "style_weighted_rounds": 0}
    for r in rounds:
        p = parse_round(r)
        if p is None:
            stats["unusable"] += 1; continue
        if p == "tie":
            stats["ties"] += 1
            axis_ties[r.get("axis") or "general"] += 1
            for m in model_keys(r):
                ties[m] += 1
            continue
        a, b, wa, wb, axis, sw = p
        stats["decided"] += 1
        if sw != 1.0:
            stats["style_weighted_rounds"] += 1
        ea = 1.0 / (1.0 + 10 ** ((ratings[b] - ratings[a]) / 400.0))
        ratings[a] += K * sw * (wa - ea)
        ratings[b] += K * sw * (wb - (1 - ea))
        games[a] += 1; games[b] += 1; wins[a] += wa; wins[b] += wb
        ea2 = 1.0 / (1.0 + 10 ** ((axis_ratings[axis][b] - axis_ratings[axis][a]) / 400.0))
        axis_ratings[axis][a] += K * sw * (wa - ea2)
        axis_ratings[axis][b] += K * sw * (wb - (1 - ea2))
        axis_games[axis][a] += 1; axis_games[axis][b] += 1
        axis_wins[axis][a] += wa; axis_wins[axis][b] += wb

    def finalize(rate, g, w):
        out = []
        for model, elo in rate.items():
            n = g[model]
            if n < MIN_GAMES:
                continue
            wr = w[model] / n
            out.append({"model": model, "elo": round(elo, 1), "games": n,
                        "winrate": round(wr, 3), "ci": wilson(wr, n)})
        out.sort(key=lambda x: (-x["elo"], x["model"]))
        return out

    overall = finalize(ratings, games, wins)
    per_axis = {}
    axis_meta = {}
    for axis in sorted(set(axis_ratings) | set(axis_ties)):
        rows = finalize(axis_ratings[axis], axis_games[axis], axis_wins[axis])
        for row in rows:
            row["axis"] = axis
        per_axis[axis] = rows
        axis_meta[axis] = {
            "decided_games": sum(axis_games[axis].values()) // 2,
            "ties": axis_ties[axis],
            "models_seen": len(axis_games[axis]),
            "models_ranked": len(rows),
            "models_below_min_games": len([m for m, n in axis_games[axis].items() if n < MIN_GAMES]),
        }
    return overall, per_axis, axis_meta, stats


def build(rounds, sources, generated=None):
    overall, per_axis, axis_meta, stats = compute_elo(rounds)
    body = {
        "schema": SCHEMA,
        "generated": generated or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "method": "Bradley-Terry Elo, K=32, base 1500, per-axis and overall; Wilson 95% CI on "
                  "win-rate; ranked only with n>=5 decided games; ties counted, not rated; "
                  "style_controlled_weight honoured when a round carries it.",
        "register": "MEASURED for a ranked row (n>=5 decided games, deterministic grader on the "
                    "recorded rounds); an axis with no ranked row is UNMEASURED: not sufficient "
                    "to rank. Measurement, not certification.",
        "rank_rule": "leader named on an axis only when >=2 ranked models and the top model's "
                     "Wilson 95% win-rate CI lower bound exceeds the runner-up's upper bound; "
                     "otherwise TIE (ranked, not separated).",
        "n_rounds": len(rounds),
        "rounds": stats,
        "sources": sources,
        "as_of": max((r.get("ts", "") for r in rounds), default="") or None,
        "models": len(overall),
        "axes": sorted(per_axis.keys()),
        "axis_meta": axis_meta,
        "leaderboard": overall,
        "per_axis": per_axis,
    }
    body = norm(body)
    body["content_id"] = sha256_hex(assert_ascii(body, "elo reference body"))
    return body


def sign_envelope(body, token_file, did_doc=None):
    from board_sign import sign_payload
    env = {
        "schema": "csoai.arena-elo-reference-attestation/0.1",
        "content_id": body["content_id"],
        "generated": body["generated"],
        "n_rounds": body["n_rounds"],
        "sources": [{"path": s["path"], "sha256": s["sha256"], "rounds": s["rounds"]} for s in body["sources"]],
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": "A signature proves these bytes were signed by the board key; it proves no "
                       "claim inside them beyond what the recorded rounds measured.",
    }
    sig = sign_payload(env, token_file, did_doc)
    sig["envelope"] = env
    sig["preimage"] = "canonical(envelope); envelope.content_id == sha256(canonical(body minus content_id, signature))"
    return sig


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rounds", action="append", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pod-token-file", default=None)
    ap.add_argument("--did-doc", default=None)
    ap.add_argument("--supersedes", default=None, help="path of the previous elo_reference.json (records its content_id + signer)")
    args = ap.parse_args()
    rounds, sources = load_rounds(args.rounds)
    body = build(rounds, sources)
    if args.supersedes and os.path.exists(args.supersedes):
        old = json.load(open(args.supersedes))
        osig = old.get("signature") or {}
        body["supersedes"] = {
            "content_id": old.get("content_id"), "generated": old.get("generated"),
            "signer": osig.get("did") or ("city_ed25519 pubkey " + osig.get("pubkey", "?") if "pubkey" in osig else "unsigned"),
            "note": "previous file superseded, never edited",
        }
        body.pop("content_id", None)
        body = norm(body)
        body["content_id"] = sha256_hex(assert_ascii(body, "elo reference body"))
    if args.pod_token_file:
        did_doc = json.load(open(args.did_doc)) if args.did_doc else None
        body["signature"] = sign_envelope(body, args.pod_token_file, did_doc)
    Path(args.out).write_text(json.dumps(body, indent=1, sort_keys=True, ensure_ascii=False) + "\n")
    print(f"ELO REFERENCE -> {args.out}")
    print(f"  rounds={len(rounds)} decided={body['rounds']['decided']} ties={body['rounds']['ties']} "
          f"unusable={body['rounds']['unusable']} models_ranked={body['models']} axes={len(body['axes'])}")
    print(f"  content_id={body['content_id'][:24]}  signed={'signature' in body}")
    for ax, rows in body["per_axis"].items():
        top = rows[0] if rows else None
        print(f"  [{ax}] ranked={len(rows)} decided={body['axis_meta'][ax]['decided_games']} ties={body['axis_meta'][ax]['ties']}"
              + (f"  top={top['model']} elo={top['elo']} n={top['games']} ci={top['ci']}" if top else "  UNMEASURED"))


if __name__ == "__main__":
    main()
