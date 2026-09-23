#!/usr/bin/env python3
"""emit_signals.py — per-axis SIGNED SIGNAL emitter.

Reads the axis register (GET /api/axis-register, or --register-file) and the per-axis Elo
reference (public/arena/elo_reference.json), derives ONE signal per register axis, signs it
and writes public/signals/<axis>.signed.json plus _index.json.

Two signing paths, chosen by flag:
  --key <pem>              the estate city key (a node that holds /root/.sovos/city_ed25519):
                           style B — Ed25519 over the content_id string, pubkey inline.
  --pod-token-file <file>  a pod without the key: POST /api/board-sign signs the canonical
                           signal bytes with did:web:csoai.org#board-attestation-1 (the PKCS8
                           never leaves Cloudflare). The signal records that signer and names
                           the signer it supersedes; it never claims the old key signed it.

Honest register (2026-09-22): the 24 Aug signals said status MEASURED with elo_leader null on
9 of 13 axes. A signal now says:
  MEASURED    axis MEASURED on the register AND a SEPARATED Elo leader (>=2 models ranked with
              n>=5 decided games each; leader's Wilson 95% win-rate CI lower bound above the
              runner-up's upper bound)
  TIE         ranked models exist but no separation
  UNMEASURED  not sufficient to rank (no model reaches n>=5 decided games on the axis), or the
              axis itself is not MEASURED on the register
elo_leader is named only when SEPARATED; elo_top is always the top ranked row (with n and CI)
so a reader sees who is ahead and how thin it is. Measurement, not certification.

0.3 (2026-09-23): the SEPARATED test moved off Elo order and onto the Wilson win-rate intervals
it was always described in terms of, and a leader must now clear every other ranked model rather
than only the runner-up. Elo is path-dependent -- a planted 17-7 corpus separated or tied
depending only on the order the rounds were recorded -- so a verdict resting on Elo order was
resting on bookkeeping. Field names are unchanged; the version moved because the meaning did.

Usage:
  python3 scripts/emit_signals.py --leaderboard public/arena/elo_reference.json \
      --out public/signals --pod-token-file /workspace/secrets/board-sign-pod-token
"""
import argparse, base64, hashlib, json, os, sys, time
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "arena"))
from board_sign import canonical, norm, sha256_hex, assert_ascii, BOARD_KID  # noqa: E402

REGISTER_URL = "https://councilof.ai/api/axis-register"
BOARD_URL = "https://councilof.ai/api/gspc"
MIN_GAMES = 5
SCHEMA = "csoai.axis-signal/0.4"


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 CSOAI-signal-emitter/1.1"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def fetch_register(url=REGISTER_URL):
    return fetch_json(url)


def board_rows_by_slug(board):
    """Join the BOARD to the register on the board's OWN bytes.

    Every model-comparison axis on GET /api/gspc carries dataset "csoai/gspc-<slug>", and
    <slug> is the register axis id. A typed crosswalk between two surfaces would only be a
    third place for them to disagree, so there is none: the slug is read off the board.
    """
    out = {}
    for a in board.get("axes", []):
        if a.get("kind") != "model-comparison":
            continue
        ds = a.get("dataset") or ""
        if "gspc-" in ds:
            out[ds.split("gspc-", 1)[1]] = a
    return out


def board_row_for(slug, by_slug):
    """Exact slug, else the ONE board slug that extends it ("jail" -> "jail-goldbank")."""
    if slug in by_slug:
        return by_slug[slug]
    ext = [v for k, v in by_slug.items() if k.startswith(slug + "-")]
    return ext[0] if len(ext) == 1 else None


def _row(r):
    return {k: r[k] for k in ("model", "elo", "games", "winrate", "ci") if k in r}


def derive_signal(axis_entry, rows, lb, generated, supersedes=None, board_entry=None):
    """axis_entry: one row of the register; rows: per_axis[axis] from elo_reference (ranked,
    sorted by elo desc, each with n>=MIN_GAMES). Pure function — tested with planted controls."""
    axis = axis_entry["axis"]
    axis_status = axis_entry.get("status", "UNMEASURED")
    ranked = [r for r in rows if r.get("games", 0) >= MIN_GAMES]
    meta = ((lb.get("axis_meta") or {}).get(axis)) or {}
    top = ranked[0] if ranked else None          # Elo order, for display; see below
    runner = ranked[1] if len(ranked) > 1 else None
    # The separation test is made on the quantity the rule is stated in: the Wilson 95%
    # win-rate interval. It is NOT made on Elo order.
    #
    # Two defects are being closed here, both found by planted controls on 2026-09-23:
    #  1. Elo is path-dependent. A planted 17-7 corpus separates when the rounds interleave
    #     and TIES when the same 17 wins are recorded before the same 7 losses, because
    #     sequential K=32 updating leaves the LOSER Elo-first. The verdict then compared the
    #     loser's lower bound against the winner's upper bound and reported TIE on evidence
    #     that plainly separates. An instrument whose answer depends on the order its own
    #     rounds were written down is not measuring the models.
    #  2. With more than two ranked models the old test consulted only ranked[0] and ranked[1],
    #     so a third model whose interval overlapped the leader could not prevent a SEPARATED
    #     verdict. A leader must clear EVERY other ranked model, not just the runner-up.
    # The leader is therefore the model whose Wilson lower bound exceeds every other ranked
    # model's Wilson upper bound. There can be at most one, the result does not depend on the
    # order of the corpus, and on two models with a consistent record it is exactly the rule
    # as previously published.
    by_winrate = sorted(ranked, key=lambda r: (-r["winrate"], r["model"]))
    sep_leader = None
    if len(ranked) > 1:
        cand = by_winrate[0]
        if all(cand["ci"][0] > other["ci"][1] for other in by_winrate[1:]):
            sep_leader = cand
    if not ranked:
        separation = "UNMEASURED"
    elif len(ranked) < 2:
        separation = "TIE"          # one ranked model is not a ranking
    elif sep_leader is not None:
        separation = "SEPARATED"
    else:
        separation = "TIE"
    # ── 0.4 (2026-09-23): THE AXIS'S SEPARATION VERDICT IS THE BOARD'S ─────────
    # Until now this file derived a top-level status from its OWN arena determination and
    # published it under the board's axis id, signed with the board's key. On swarm that
    # put two live board-signed answers to one question on the estate: GET /api/gspc said
    # UNTESTED with leader qwen2.5:7b, /signals/swarm.signed.json said SEPARATED with
    # leader nemotron-3-nano:30b. Neither file was wrong about its own bytes. They measure
    # different instruments — a frozen 37-item bank graded for per-item accuracy vs.
    # recorded pairwise arena rounds — over fleets that share no model on that axis. The
    # defect was two verdicts wearing one word, the same shape as the three card counts.
    #
    # Fixed at the cause: ONE surface stops claiming the axis's separation. The board is
    # the separation authority for a board axis, so status/register below report the
    # board's verdict verbatim, and this file's own determination stays in the elo_*
    # namespace scoped by separation_of / separation_authority / evidence_relation.
    # Nothing is collapsed: SEPARATED, TIE, UNTESTED and UNMEASURED all stay first-class
    # and the arena's leader is still named. A register axis with no board row is refused
    # in main() rather than signed with an unknown authority.
    board_sep = (board_entry or {}).get("separation")
    if axis_status != "MEASURED":
        register = "UNMEASURED"
    elif board_sep == "SEPARATED":
        register = "MEASURED"
    elif board_sep in ("TIE", "UNTESTED"):
        register = board_sep
    else:
        register = "UNMEASURED"
    # elo_leader is THIS instrument's finding and is named whenever the arena separates.
    # It is never the axis leader; separation_authority.board_leader is.
    leader = sep_leader if axis_status == "MEASURED" else None
    b = board_entry or {}
    board_leader_model = str(b.get("leader") or "").split(" ")[0] or None
    arena_models = [r["model"] for r in ranked]
    authority = {
        "surface": "GET /api/gspc",
        "board_axis": b.get("axis"),
        "board_separation": b.get("separation"),
        "board_leader": b.get("leader"),
        "board_bench": b.get("bench"),
        "board_n": b.get("n"),
        "note": "This axis's separation authority. status/register are ITS verdict. Where "
                "elo_separation differs, the board governs the AXIS separation; this file "
                "governs only the arena rounds.",
    }
    relation_note = (
        "Never add, reconcile or substitute the two (cf. corpus_relation "
        "SEPARATE_CORPORA). Board: per-item accuracy on a frozen bank. "
        f"Here: win-rate over recorded pairwise rounds. Board leader "
        f"{board_leader_model or 'none'} is "
        f"{'among' if board_leader_model in arena_models else 'NOT among'} the models "
        f"ranked here ({', '.join(arena_models) or 'none'}). Fleet overlap UNMEASURED: "
        "no per-axis fleet roster is published and none is invented."
    )
    drift = None
    bn, sn = b.get("n"), axis_entry.get("scored_items")
    if isinstance(bn, int) and isinstance(sn, int) and bn != sn:
        drift = {
            "fields": ["scored_items", "models"],
            "register_scored_items": sn,
            "board_n": bn,
            "state": "PUBLISHED_NOT_RECONCILED",
            "note": "scored_items/models above are register fields and do NOT describe the "
                    "bank the board now serves; board_n does. Published, not retyped: the row "
                    "also needs majority_baseline re-derived on the current bank, undone, and "
                    "a baseline is never invented to tidy a row.",
        }
    body = {
        "schema": SCHEMA,
        "axis": axis,
        "status": register,
        "register": register,
        "axis_status": axis_status,
        "scored_items": axis_entry.get("scored_items"),
        "models": axis_entry.get("models"),
        "majority_baseline": axis_entry.get("majority_baseline"),
        "elo_source": {"path": "/arena/elo_reference.json", "content_id": lb.get("content_id"),
                       "generated": lb.get("generated"), "schema": lb.get("schema")},
        "elo_decided_games": meta.get("decided_games"),
        "elo_ties": meta.get("ties"),
        "elo_ranked_models": len(ranked),
        "elo_top": _row(top) if top else None,
        "elo_runner_up": _row(runner) if runner else None,
        "elo_separation": separation,
        "elo_leader": leader["model"] if leader else None,
        "elo_leader_score": leader["elo"] if leader else None,
        "games_leader": leader["games"] if leader else None,
        "separation_of": "recorded pairwise arena rounds, NOT the axis's frozen bank; "
                         "never the axis's verdict.",
        "separation_authority": authority,
        "evidence_relation": "SEPARATE_EVIDENCE",
        "evidence_relation_note": relation_note,
        "rank_rule": f"arena rule: >=2 models with >={MIN_GAMES} decided games each and ONE model's "
                     "Wilson 95% win-rate CI lower bound above EVERY other ranked model's upper "
                     "bound; else TIE. UNMEASURED = not enough to rank. On win-rate intervals, "
                     "never path-dependent Elo order.",
        "not_a_certification": True,
        "note": "From the axis register + the per-axis Elo reference rebuilt from recorded rounds "
                "(deterministic grader on frozen banks). Thin-n axes say so. "
                "scored_items/models/majority_baseline are REGISTER fields about the axis's frozen "
                "bank, not these rounds. Measurement, not certification.",
        "generated": generated,
    }
    if drift:
        body["register_board_drift"] = drift
    if supersedes:
        body["supersedes"] = supersedes
    return norm(body)


def sign_city(body, key_path):
    from cryptography.hazmat.primitives.serialization import load_pem_private_key
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    sk = load_pem_private_key(open(key_path, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    cid = sha256_hex(canonical(body))
    sig = sk.sign(cid.encode())
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    body["signer"] = "city_ed25519 (estate key; pubkey inline)"
    return cid, {"alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
                 "pubkey": base64.b64encode(pub).decode(),
                 "note": "Ed25519 over canonical content_id. Verify: recompute, sha256=content_id, ed25519==sig with PUBKEY."}


def sign_board(body, token_file, did_doc=None):
    from board_sign import sign_payload
    body["signer"] = BOARD_KID
    cid = sha256_hex(assert_ascii(body, f"signal {body.get('axis')}"))
    sig = sign_payload(body, token_file, did_doc)
    assert sig["payload_sha256"] == cid
    sig["content_id"] = cid
    sig["preimage"] = "canonical(body minus content_id, signature)"
    return cid, sig


def previous_signal(out_dir, axis):
    p = os.path.join(out_dir, f"{axis}.signed.json")
    if not os.path.exists(p):
        return None
    try:
        old = json.load(open(p))
    except Exception:
        return None
    osig = old.get("signature") or {}
    if osig.get("did"):
        signer = osig["did"]
    elif osig.get("pubkey"):
        signer = f"city_ed25519 (pubkey {osig['pubkey'][:12]}...; not bound in did.json)"
    else:
        signer = "unsigned"
    return {"content_id": old.get("content_id"), "generated": old.get("generated"), "signer": signer,
            "status_then": old.get("status"), "elo_leader_then": old.get("elo_leader"),
            "note": "superseded, never edited; new bytes, new signature"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/signals")
    ap.add_argument("--leaderboard", default="public/arena/elo_reference.json")
    ap.add_argument("--register-url", default=REGISTER_URL)
    ap.add_argument("--register-file", default=None)
    ap.add_argument("--board-url", default=BOARD_URL)
    ap.add_argument("--board-file", default=None, help="a saved GET /api/gspc payload instead of fetching")
    ap.add_argument("--key", default=None, help="city_ed25519 PEM (style B)")
    ap.add_argument("--pod-token-file", default=None, help="board-sign caller token file (style B-DID)")
    ap.add_argument("--did-doc", default=None)
    ap.add_argument("--only", default=None, help="comma list of axes (default: all register axes)")
    args = ap.parse_args()
    if bool(args.key) == bool(args.pod_token_file):
        sys.exit("choose exactly one of --key / --pod-token-file")
    reg = json.load(open(args.register_file)) if args.register_file else fetch_register(args.register_url)
    axes = reg.get("axes", [])
    if args.only:
        keep = set(args.only.split(","))
        axes = [a for a in axes if a["axis"] in keep]
    lb = json.load(open(args.leaderboard))
    if not lb.get("per_axis"):
        sys.exit(f"GATE: {args.leaderboard} has no per_axis — refusing to emit signals from nothing")
    board = json.load(open(args.board_file)) if args.board_file else fetch_json(args.board_url)
    by_slug = board_rows_by_slug(board)
    if not by_slug:
        sys.exit("GATE: the board payload carries no model-comparison axes — refusing to emit "
                 "signals with no separation authority behind them")
    did_doc = json.load(open(args.did_doc)) if args.did_doc else None
    os.makedirs(args.out, exist_ok=True)
    generated = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    index = []
    for a in axes:
        axis = a["axis"]
        rows = (lb.get("per_axis") or {}).get(axis, [])
        b_entry = board_row_for(axis, by_slug)
        if b_entry is None:
            sys.exit(f"GATE: register axis {axis!r} has no board row — refusing to board-sign a "
                     "signal whose separation authority is unknown")
        body = derive_signal(a, rows, lb, generated, previous_signal(args.out, axis), b_entry)
        if args.key:
            cid, sig = sign_city(body, args.key)
        else:
            cid, sig = sign_board(body, args.pod_token_file, did_doc)
        body["content_id"] = cid
        body["signature"] = sig
        fp = os.path.join(args.out, f"{axis}.signed.json")
        open(fp, "w").write(json.dumps(body, indent=1, sort_keys=True, ensure_ascii=False) + "\n")
        index.append({"axis": axis, "status": body["status"], "elo_leader": body["elo_leader"],
                      "elo_top": body["elo_top"]["model"] if body["elo_top"] else None,
                      "elo_separation": body["elo_separation"],
                      "board_axis": body["separation_authority"]["board_axis"],
                      "board_separation": body["separation_authority"]["board_separation"],
                      "board_leader": body["separation_authority"]["board_leader"],
                      "content_id": cid[:16]})
        print(f"  signed {axis}.signed.json  cid={cid[:16]}  {body['status']:<10} top={index[-1]['elo_top']} leader={body['elo_leader']}")
    idx = {"schema": "csoai.signals-index/0.3", "signals": index, "generated": generated,
           "signer": BOARD_KID if args.pod_token_file else "city_ed25519",
           "elo_source_content_id": lb.get("content_id"),
           "board_source": args.board_file or args.board_url,
           "status_rule":
               "status is THE BOARD'S separation verdict for the axis, read from GET /api/gspc: "
               "MEASURED = the board separated a leader; TIE = ranked, not separated; UNTESTED = "
               "the board publishes no separation determination; UNMEASURED = the axis is not "
               "MEASURED on the register. elo_separation is a DIFFERENT instrument's verdict over "
               "recorded pairwise arena rounds and is never the axis's verdict; the two are "
               "SEPARATE_EVIDENCE and are never reconciled or substituted. Each signal carries "
               "separation_authority with the board row it defers to."}
    open(os.path.join(args.out, "_index.json"), "w").write(json.dumps(idx, indent=1, ensure_ascii=False) + "\n")
    print(f"SIGNED {len(axes)} per-axis signals -> {args.out}")


if __name__ == "__main__":
    main()
