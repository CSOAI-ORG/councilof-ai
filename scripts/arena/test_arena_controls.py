"""test_arena_controls.py — planted controls for the ARENA -> Elo -> SIGNAL chain.

A grader that has only ever printed a leader has not been tested. Each control plants a
known outcome and asserts the chain reports it — and, for the failure cases, that it
refuses to name a leader or refuses a forged signature.

Run:  python3 -m pytest -q scripts/arena/test_arena_controls.py
"""
import base64, hashlib, json, os, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
from elo_reference import build, parse_round, MIN_GAMES  # noqa: E402
from emit_signals import derive_signal  # noqa: E402
from board_sign import canonical, sha256_hex  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402
from cryptography.hazmat.primitives import serialization  # noqa: E402
from cryptography.exceptions import InvalidSignature  # noqa: E402

REG = {"axis": "gov", "status": "MEASURED", "scored_items": 237, "models": 19, "majority_baseline": 0.2911}


def rounds(axis, a, b, a_wins, b_wins, ties=0):
    out = []
    for i in range(a_wins):
        out.append({"round": len(out) + 1, "ts": "2026-09-22T00:00:00Z", "axis": axis,
                    a: {"score": 1.0, "elo": 0}, b: {"score": 0.0, "elo": 0}, "winner": a})
    for i in range(b_wins):
        out.append({"round": len(out) + 1, "ts": "2026-09-22T00:00:00Z", "axis": axis,
                    a: {"score": 0.0, "elo": 0}, b: {"score": 1.0, "elo": 0}, "winner": b})
    for i in range(ties):
        out.append({"round": len(out) + 1, "ts": "2026-09-22T00:00:00Z", "axis": axis,
                    a: {"score": 1.0, "elo": 0}, b: {"score": 1.0, "elo": 0}, "winner": "tie",
                    "bank_sha256": "deadbeef", "item": i, "grader": "axis_arena.score_first_label"})
    return out


def test_planted_winner_is_ranked_first_and_separated():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 20, 0), [])
    rows = body["per_axis"]["gov"]
    assert rows[0]["model"] == "alpha:7b" and rows[0]["games"] == 20 and rows[0]["winrate"] == 1.0
    assert rows[1]["model"] == "beta:7b" and rows[1]["winrate"] == 0.0
    sig = derive_signal(REG, rows, body, "2026-09-22T00:00:00Z")
    assert sig["elo_separation"] == "SEPARATED" and sig["elo_leader"] == "alpha:7b"
    assert sig["status"] == "MEASURED" and sig["register"] == "MEASURED"


def test_reversed_plant_flips_the_leader():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 0, 20), [])
    rows = body["per_axis"]["gov"]
    assert rows[0]["model"] == "beta:7b"
    sig = derive_signal(REG, rows, body, "t")
    assert sig["elo_leader"] == "beta:7b"


def test_even_split_is_a_tie_never_a_leader():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 10, 10), [])
    sig = derive_signal(REG, body["per_axis"]["gov"], body, "t")
    assert sig["elo_separation"] == "TIE" and sig["elo_leader"] is None
    assert sig["status"] == "TIE" and sig["elo_top"] is not None


def test_thin_n_is_unmeasured():
    body = build(rounds("gov", "alpha:7b", "beta:7b", MIN_GAMES - 1, 0), [])
    assert body["per_axis"]["gov"] == []
    sig = derive_signal(REG, body["per_axis"]["gov"], body, "t")
    assert sig["status"] == "UNMEASURED" and sig["elo_leader"] is None and sig["elo_top"] is None


def test_ties_carry_no_rating_but_are_counted():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 0, 0, ties=12), [])
    assert body["rounds"]["ties"] == 12 and body["rounds"]["decided"] == 0
    assert body["axis_meta"]["gov"]["ties"] == 12 and body["per_axis"]["gov"] == []
    # provenance keys on a round are never mistaken for a model
    assert body["axis_meta"]["gov"]["models_seen"] == 0


def test_provenance_keys_are_not_models():
    r = rounds("gov", "alpha:7b", "beta:7b", 1, 0)[0]
    r["bank_sha256"] = "abc"; r["answers"] = {"alpha:7b": "x"}; r["item"] = 3
    a, b, wa, wb, axis, sw = parse_round(r)
    assert {a, b} == {"alpha:7b", "beta:7b"} and axis == "gov"


def test_unmeasured_axis_on_register_never_measured_signal():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 20, 0), [])
    sig = derive_signal(dict(REG, status="UNMEASURED"), body["per_axis"]["gov"], body, "t")
    assert sig["status"] == "UNMEASURED" and sig["elo_leader"] is None


def test_content_id_commits_to_body_and_signature_can_fail():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 8, 2), [])
    cid = body.pop("content_id")
    assert cid == sha256_hex(canonical(body))
    sk = Ed25519PrivateKey.generate()
    sig = sk.sign(canonical(body))
    sk.public_key().verify(sig, canonical(body))
    altered = dict(body, generated="2099-01-01T00:00:00Z")
    try:
        sk.public_key().verify(sig, canonical(altered))
        assert False, "altered preimage verified — the verifier cannot fail"
    except InvalidSignature:
        pass


def test_verify_signed_accepts_board_style_and_rejects_forgery():
    """End to end through scripts/verify_signed.py with a pinned DID doc."""
    tmp = Path(tempfile.mkdtemp(prefix="arena-ctl-"))
    sk = Ed25519PrivateKey.generate()
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    x = base64.urlsafe_b64encode(pub).decode().rstrip("=")
    did = "did:web:example.test#board-attestation-1"
    (tmp / "did.json").write_text(json.dumps({"id": "did:web:example.test", "verificationMethod": [
        {"id": did, "type": "JsonWebKey2020", "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": x}}]}))
    body = build(rounds("gov", "alpha:7b", "beta:7b", 9, 1), [])
    sig_body = derive_signal(REG, body["per_axis"]["gov"], body, "2026-09-22T00:00:00Z")
    sig_body["signer"] = did
    cid = sha256_hex(canonical(sig_body))
    signed = dict(sig_body, content_id=cid, signature={
        "alg": "Ed25519", "did": did, "sig_ed25519": sk.sign(canonical(sig_body)).hex(),
        "payload_sha256": cid})
    (tmp / "ok.json").write_text(json.dumps(signed))
    forged = json.loads(json.dumps(signed)); forged["elo_leader"] = "beta:7b"
    (tmp / "forged.json").write_text(json.dumps(forged))
    ver = HERE.parent / "verify_signed.py"
    ok = subprocess.run([sys.executable, str(ver), str(tmp / "ok.json"), "--did-doc", str(tmp / "did.json")],
                        capture_output=True, text=True)
    bad = subprocess.run([sys.executable, str(ver), str(tmp / "forged.json"), "--did-doc", str(tmp / "did.json")],
                         capture_output=True, text=True)
    assert ok.returncode == 0 and "VALID" in ok.stdout, ok.stdout + ok.stderr
    assert bad.returncode == 1 and "INVALID" in bad.stdout, bad.stdout + bad.stderr


# ---------------------------------------------------------------------------------------------
# ROTATION CONTROLS (2026-09-23)
# The schedule decides where every GPU-hour of evidence goes. A schedule that has only ever
# printed an axis has not been tested either, and a schedule that could quietly prefer the cell
# where its favourite is winning would poison every number downstream. These plant the corpus
# and assert what the rule does with it — including the one property that matters most, that it
# cannot see a winner at all.
# ---------------------------------------------------------------------------------------------
import rotation as R  # noqa: E402
sys.path.insert(0, str(HERE.parent.parent / "harness" / "arena"))
from axis_arena import load_bank_file  # noqa: E402

FLEET = ["a:1b", "b:2b", "c:3b", "d:4b", "e:5b"]


def rrounds(axis, a, b, a_wins, b_wins, ties=0, ts="2026-09-23T01:00:00Z"):
    """rounds in the shape the arena records them, at or after the regime epoch."""
    out = []
    for _ in range(a_wins):
        out.append({"ts": ts, "axis": axis, a: {"score": 1.0, "elo": 0}, b: {"score": 0.0, "elo": 0}, "winner": a})
    for _ in range(b_wins):
        out.append({"ts": ts, "axis": axis, a: {"score": 0.0, "elo": 0}, b: {"score": 1.0, "elo": 0}, "winner": b})
    for _ in range(ties):
        out.append({"ts": ts, "axis": axis, a: {"score": 1.0, "elo": 0}, b: {"score": 1.0, "elo": 0}, "winner": "tie"})
    return out


def mirror(rounds):
    """The same corpus with every decided round's winner swapped for the loser. Same counts of
    rounds and of DECIDED rounds; every verdict reversed."""
    out = []
    for r in rounds:
        r = dict(r)
        mk = R.model_keys(r)
        if r.get("winner") in mk:
            r["winner"] = mk[1] if r["winner"] == mk[0] else mk[0]
            r[mk[0]], r[mk[1]] = dict(r[mk[1]]), dict(r[mk[0]])
        out.append(r)
    return out


def test_rotation_is_result_blind():
    """THE control. Flip every winner in the corpus and no scheduling decision may move.
    If the rule ever starts reading a win-rate, an Elo or a verdict, this fails."""
    corpus = []
    for i, ax in enumerate(R.AXES):
        for j, (x, y) in enumerate(R.pairs_of(FLEET)):
            # every pair is pushed past PROBE_ROUNDS so the ADJUDICATE branch — the one that
            # reads decided counts, and the only place a winner-aware rule could hide — is the
            # branch under test. A corpus that never leaves the probe phase would make this
            # control vacuous, so the phases actually taken are asserted below.
            corpus += rrounds(ax, x, y, a_wins=3 + (i + j) % 9, b_wins=1 + (i * j) % 5,
                              ties=R.PROBE_ROUNDS)
    flipped = mirror(corpus)
    assert flipped != corpus, "the mirrored corpus is identical — the control cannot fail"
    phases, moved = set(), []
    for h in range(500_000, 500_000 + 140):
        ax = R.axis_for_hour(h)
        a = R.pair_for_hour(ax, h, FLEET, corpus)
        b = R.pair_for_hour(ax, h, FLEET, flipped)
        phases.add(a[1])
        if (a[0], a[1]) != (b[0], b[1]):
            moved.append((h, ax, a[:2], b[:2]))
    assert "adjudicate" in phases, f"never reached the adjudicate branch: {phases}"
    assert not moved, f"the schedule moved when only the winners changed: {moved[:3]}"
    # and the decided counts really do vary across pairs, or argmax could not have been consulted
    t = R.tally(corpus, R.AXES[0], FLEET)
    assert len({c["decided"] for c in t.values()}) > 1, "all cells have the same decided count"


def test_rotation_covers_every_axis_in_one_cycle():
    h0 = 500_000
    seen = [R.axis_for_hour(h0 + i) for i in range(len(R.AXES))]
    assert sorted(seen) == sorted(R.AXES), seen
    assert len(set(seen)) == len(R.AXES)
    assert R.axis_for_hour(h0) == R.axis_for_hour(h0 + len(R.AXES))


def test_rotation_is_reproducible_from_the_hour_alone():
    corpus = rrounds("gov", "a:1b", "b:2b", 5, 5, ties=5)
    for h in (500_000, 500_013, 777_777):
        ax = R.axis_for_hour(h)
        first = R.pair_for_hour(ax, h, FLEET, corpus)[:2]
        again = R.pair_for_hour(ax, h, FLEET, list(corpus))[:2]
        assert first == again
    # and the tiebreak is genuinely hour-dependent, or "derivable from the hour" means nothing
    ax = R.axis_for_hour(500_000)
    picks = {R.pair_for_hour(ax, 500_000 + 14 * k, FLEET, [])[0] for k in range(10)}
    assert len(picks) > 1, "every hour picked the same pair — the hour is not an input"


def test_rotation_alternates_probe_and_adjudicate_and_covers_the_pair_space():
    """Walk one axis through many visits from an empty corpus and check both halves of the rule:
    the probe visits cover the pair space without ever repeating a pair, and the adjudicate
    visits return to the most-decided cell so that cells actually close. A rule that only
    probed, or only adjudicated, fails here."""
    corpus, probed, phases = [], [], []
    ax = R.axis_for_hour(500_000)
    h = 500_000
    npairs = len(R.pairs_of(FLEET))
    for _ in range(npairs * 3):
        pair, phase, _ = R.pair_for_hour(ax, h, FLEET, corpus)
        assert pair is not None
        phases.append(phase)
        if phase == "probe":
            assert pair not in probed, f"probe repeated a pair already sampled: {pair}"
            probed.append(pair)
        # a visit is one hour of games on that cell; decided games accrue on the cell played
        corpus += rrounds(ax, pair[0], pair[1], 4, 2, ties=R.PROBE_ROUNDS)
        h += len(R.AXES)
    assert set(phases) == {"probe", "adjudicate"}, set(phases)
    assert len(probed) == npairs, f"probe covered {len(probed)} of {npairs} pairs"
    # alternation is a function of the hour, not of the corpus
    assert phases[0] != phases[1], phases[:4]


def test_the_phase_for_an_hour_is_a_function_of_the_hour():
    """visit_index = h // len(AXES) decides the phase, so an odd visit adjudicates and an even
    visit probes on the very same corpus."""
    ax = "gov"
    corpus = []
    for x, y in R.pairs_of(FLEET):
        corpus += rrounds(ax, x, y, 3, 1, ties=R.PROBE_ROUNDS)   # every pair sampled AND decided
    # find two hours landing on this axis with opposite visit parity
    hours = [h for h in range(500_000, 500_000 + 2 * len(R.AXES)) if R.axis_for_hour(h) == ax]
    assert len(hours) == 2 and (hours[0] // len(R.AXES)) % 2 != (hours[1] // len(R.AXES)) % 2
    # every pair is probed and decided, so the pools differ only by phase preference
    corpus2 = list(corpus)
    for x, y in R.pairs_of(FLEET)[:1]:
        corpus2 += rrounds(ax, x, y, 6, 0)          # one clearly most-decided cell
    a = R.pair_for_hour(ax, hours[0], FLEET, corpus2)
    b = R.pair_for_hour(ax, hours[1], FLEET, corpus2)
    assert {a[1], b[1]} == {"probe", "adjudicate"} or a[1] == b[1] == "adjudicate", (a[1], b[1])
    adj = a if a[1] == "adjudicate" else b
    assert adj[0] == R.pairs_of(FLEET)[0], (adj[0], R.pairs_of(FLEET)[0])


def test_rotation_concentrates_on_the_pair_closest_to_adjudication():
    ax = "gov"
    pairs = R.pairs_of(FLEET)
    corpus = []
    for i, (x, y) in enumerate(pairs):
        corpus += rrounds(ax, x, y, a_wins=2 + i, b_wins=1, ties=R.PROBE_ROUNDS)
    want = pairs[-1]                      # the most decided games, still under target
    pair, phase, t = R.pair_for_hour(ax, 500_000, FLEET, corpus)
    assert phase == "adjudicate", phase
    assert pair == want, (pair, want, {p: t[p] for p in pairs})


def test_adjudicated_pair_is_retired_whether_it_separated_or_tied():
    ax = "gov"
    x, y = R.pairs_of(FLEET)[0]
    for a_wins, b_wins in ((R.TARGET_DECIDED, 0), (R.TARGET_DECIDED // 2, R.TARGET_DECIDED - R.TARGET_DECIDED // 2)):
        corpus = rrounds(ax, x, y, a_wins, b_wins)      # exactly TARGET_DECIDED decided games
        for p in R.pairs_of(FLEET)[1:]:
            corpus += rrounds(ax, p[0], p[1], 1, 0, ties=R.PROBE_ROUNDS)
        for h in range(500_000, 500_040):
            pair, _, _ = R.pair_for_hour(ax, h, FLEET, corpus)
            assert pair != (x, y), f"a pair at the target was played again ({a_wins}-{b_wins})"


def test_every_cell_the_schedule_abandons_is_a_cell_it_reports():
    """A pair that has been sampled and never produced a decided game is dropped from the
    schedule. The set the schedule stops playing must be exactly the set undecidable() names,
    or the receipt would read "undecidable=none" while an axis was quietly being abandoned.
    Both halves are asserted, so moving either threshold alone fails this."""
    ax = "gov"
    pairs = R.pairs_of(FLEET)
    dead = pairs[0]
    corpus = rrounds(ax, dead[0], dead[1], 0, 0, ties=R.PROBE_ROUNDS)       # sampled, 0 decided
    for p in pairs[1:]:
        corpus += rrounds(ax, p[0], p[1], 3, 1, ties=R.PROBE_ROUNDS)
    t = R.tally(corpus, ax, FLEET)
    reported = set(R.undecidable(t))
    assert reported == {dead}, reported
    played = {R.pair_for_hour(ax, h, FLEET, corpus)[0]
              for h in range(500_000, 500_000 + 40 * len(R.AXES))
              if R.axis_for_hour(h) == ax}
    assert dead not in played, "an abandoned cell was played again"
    abandoned = {p for p in pairs if p not in played}
    assert abandoned == reported, \
        f"the schedule stopped playing {abandoned} but reported {reported}"


def test_an_unsampled_pair_is_not_called_undecidable():
    """Silence is not a finding. A pair with too few rounds to read anything from is UNDECIDABLE
    about nothing; it is simply not yet sampled, and it must still be scheduled."""
    ax = "gov"
    pairs = R.pairs_of(FLEET)
    thin = pairs[0]
    corpus = rrounds(ax, thin[0], thin[1], 0, 0, ties=R.PROBE_ROUNDS - 1)
    for p in pairs[1:]:
        corpus += rrounds(ax, p[0], p[1], 3, 1, ties=R.PROBE_ROUNDS)
    t = R.tally(corpus, ax, FLEET)
    assert R.undecidable(t) == [], R.undecidable(t)
    played = {R.pair_for_hour(ax, h, FLEET, corpus)[0]
              for h in range(500_000, 500_000 + 40 * len(R.AXES))
              if R.axis_for_hour(h) == ax}
    assert thin in played, "an under-sampled pair was dropped instead of sampled"


def test_rotation_ignores_rounds_from_before_the_regime_epoch():
    ax = "gov"
    x, y = R.pairs_of(FLEET)[0]
    old = rrounds(ax, x, y, 50, 10, ties=50, ts="2026-09-01T00:00:00Z")
    t = R.tally(old, ax, FLEET)
    assert t[(x, y)] == {"rounds": 0, "decided": 0}, t[(x, y)]
    assert R.pair_for_hour(ax, 500_000, FLEET, old)[1] == "probe"


def test_games_to_separation_is_the_number_the_chain_actually_needs():
    """Ties the published figure to the real verdict: at the stated n the chain says SEPARATED,
    and at one game fewer it does not. If games_to_separation ever drifts from the rule that
    emit_signals applies, this fails."""
    for p in (0.90, 0.80, 0.75, 0.70, 0.65):
        n = R.games_to_separation(p)
        k = round(p * n)
        body = build(rounds("gov", "alpha:7b", "beta:7b", k, n - k), [])
        sig = derive_signal(REG, body["per_axis"]["gov"], body, "t")
        assert sig["elo_separation"] == "SEPARATED", (p, n, k, sig["elo_top"], sig["elo_runner_up"])
        n2 = n - 1
        k2 = round(p * n2)
        body2 = build(rounds("gov", "alpha:7b", "beta:7b", k2, n2 - k2), [])
        sig2 = derive_signal(REG, body2["per_axis"]["gov"], body2, "t")
        assert sig2["elo_separation"] != "SEPARATED", \
            f"p={p} separated at n={n2}, so {n} is not the smallest — the published number is wrong"


def test_a_coin_flip_pair_never_separates():
    """The cell this loop replayed for thirteen hours: 147 decided games at a 0.517 win share.
    More hours of it cannot help, and the chain must keep saying TIE."""
    assert R.games_to_separation(0.50) is None
    body = build(rounds("gov", "mistral:7b", "gemma3:12b", 76, 71), [])
    sig = derive_signal(REG, body["per_axis"]["gov"], body, "t")
    assert sig["elo_separation"] == "TIE" and sig["elo_leader"] is None


# ---------------------------------------------------------------------------------------------
# BANK LOADER CONTROLS — six of the fourteen published banks could not be played at all
# ---------------------------------------------------------------------------------------------
def _bank(tmp, rows):
    p = Path(tempfile.mkdtemp(prefix="arena-bank-")) / "items.jsonl"
    p.write_text("\n".join(json.dumps(r) for r in rows) + "\n")
    return p


def test_a_null_canary_field_is_not_a_canary():
    """The affect and jail banks carry "_canary": null on every row and a real marker on one.
    Presence of the key discarded all of them; truthiness keeps the items and drops the canary."""
    rows = [{"item": f"scenario {i}", "expected": "PROHIBITED", "_canary": None} for i in range(5)]
    rows.append({"item": "canary", "expected": "PROHIBITED", "_canary": "KINGFISHER"})
    items, canary, textless = load_bank_file(_bank(None, rows))
    assert len(items) == 5 and canary == 1 and textless == 0


def test_alternate_text_keys_load():
    """prv publishes 'operation', agi 'request', mach and det 'case'. None were in the old list,
    so every item loaded textless and the round could never be played."""
    for key in ("operation", "request", "case", "action", "item", "scenario", "tool", "prompt"):
        rows = [{key: f"the {key} body", "expected": "SURVIVES"} for _ in range(3)]
        items, _, textless = load_bank_file(_bank(None, rows))
        assert len(items) == 3 and textless == 0, key
        assert all(i["text"] == f"the {key} body" for i in items), key


def test_a_row_with_no_text_at_all_is_dropped_and_counted():
    rows = [{"expected": "SURVIVES", "note": "no body"} for _ in range(4)]
    rows.append({"text": "a real one", "expected": "SURVIVES"})
    items, _, textless = load_bank_file(_bank(None, rows))
    assert len(items) == 1 and textless == 4


def test_an_unplayable_bank_is_refused_not_looped():
    """--require-items makes an axis whose bank yields nothing a reported failure. Before this,
    axis_arena skipped textless items without consuming a game and ran until it was killed."""
    p = _bank(None, [{"expected": "SURVIVES"} for _ in range(10)])
    out = Path(tempfile.mkdtemp(prefix="arena-out-")) / "r.jsonl"
    r = subprocess.run([sys.executable, str(HERE.parent.parent / "harness" / "arena" / "axis_arena.py"),
                        "--games", "2", "--models", "x:1b,y:2b", "--bank", str(p),
                        "--axis", "prv", "--out", str(out), "--require-items", "2"],
                       capture_output=True, text=True, timeout=90)
    assert r.returncode == 2, (r.returncode, r.stdout[-400:], r.stderr[-400:])
    assert "GATE" in (r.stdout + r.stderr)


def test_a_bank_thinner_than_required_is_refused():
    """--require-items is not the same guard as "the bank has at least two items". A bank with
    three playable items and a floor of five must be refused by --require-items alone; without
    this case that flag could be deleted and every control would still pass."""
    p = _bank(None, [{"text": f"body {i}", "expected": "SURVIVES"} for i in range(3)])
    out = Path(tempfile.mkdtemp(prefix="arena-out-")) / "r.jsonl"
    r = subprocess.run([sys.executable, str(HERE.parent.parent / "harness" / "arena" / "axis_arena.py"),
                        "--games", "2", "--models", "x:1b,y:2b", "--bank", str(p),
                        "--axis", "prv", "--out", str(out), "--require-items", "5"],
                       capture_output=True, text=True, timeout=90)
    assert r.returncode == 2, (r.returncode, r.stdout[-400:], r.stderr[-400:])
    assert "GATE" in (r.stdout + r.stderr) and "3 playable items" in (r.stdout + r.stderr), r.stdout[-400:]


def _ordered_rounds(a, b, a_wins, b_wins, interleave):
    seq = [a] * a_wins + [b] * b_wins
    if interleave:
        import itertools
        seq = [x for x in itertools.chain(*itertools.zip_longest([a] * a_wins, [b] * b_wins)) if x]
    return [{"round": i, "ts": "2026-09-23T00:00:00Z", "axis": "gov",
             a: {"score": 1.0 if w == a else 0.0, "elo": 0},
             b: {"score": 1.0 if w == b else 0.0, "elo": 0}, "winner": w}
            for i, w in enumerate(seq)]


def test_separation_does_not_depend_on_the_order_rounds_were_recorded():
    """Same 17-7 evidence, two orderings. Sequential K=32 Elo leaves the LOSER Elo-first when
    the wins are recorded in a block, and the verdict used to flip to TIE on that alone. The
    answer must come from the evidence, not from the order it was written down."""
    verdicts, leaders, elo_orders = set(), set(), set()
    for interleave in (False, True):
        body = build(_ordered_rounds("alpha:7b", "beta:7b", 17, 7, interleave), [])
        rows = body["per_axis"]["gov"]
        elo_orders.add(tuple(r["model"] for r in rows))
        sig = derive_signal(REG, rows, body, "t")
        verdicts.add(sig["elo_separation"]); leaders.add(sig["elo_leader"])
    assert len(elo_orders) == 2, "both orderings gave the same Elo order — this control cannot fail"
    assert verdicts == {"SEPARATED"}, verdicts
    assert leaders == {"alpha:7b"}, leaders


def test_a_third_overlapping_model_prevents_separation():
    """A leader must clear EVERY ranked model, not just the runner-up.

    The planted rows are chosen so that the two rules DISAGREE, and the test asserts that
    disagreement before asserting the verdict — otherwise it would pass under either rule and
    prove nothing. alpha leads on win-rate; beta is the runner-up and its tight interval sits
    below alpha's lower bound, so a runner-up-only test would say SEPARATED; gamma has the
    LOWEST win-rate but only five games, so its interval is wide enough to reach over alpha's
    lower bound, and a leader that has not cleared gamma has not separated."""
    from elo_reference import wilson
    rows = [
        {"model": "alpha:7b", "elo": 1600.0, "games": 10, "winrate": 0.700,
         "ci": [round(x, 3) for x in wilson(0.7, 10)], "axis": "gov"},
        {"model": "beta:7b", "elo": 1500.0, "games": 200, "winrate": 0.300,
         "ci": [round(x, 3) for x in wilson(0.3, 200)], "axis": "gov"},
        {"model": "gamma:7b", "elo": 1400.0, "games": 5, "winrate": 0.200,
         "ci": [round(x, 3) for x in wilson(0.2, 5)], "axis": "gov"},
    ]
    by_wr = sorted(rows, key=lambda r: (-r["winrate"], r["model"]))
    assert [r["model"] for r in by_wr] == ["alpha:7b", "beta:7b", "gamma:7b"]
    assert by_wr[0]["ci"][0] > by_wr[1]["ci"][1], \
        "the runner-up-only rule would NOT have separated here — the control cannot fail"
    assert not all(by_wr[0]["ci"][0] > o["ci"][1] for o in by_wr[1:]), \
        "the all-others rule also separates here — the control cannot fail"
    lb = {"axis_meta": {"gov": {"decided_games": 107, "ties": 0, "models_seen": 3,
                               "models_ranked": 3, "models_below_min_games": 0}},
          "content_id": "planted", "generated": "t", "schema": "csoai.arena-elo-reference/0.2"}
    sig = derive_signal(REG, rows, lb, "t")
    assert sig["elo_separation"] == "TIE" and sig["elo_leader"] is None, \
        (sig["elo_separation"], sig["elo_leader"], [(r["model"], r["winrate"], r["ci"]) for r in rows])
    # and with gamma removed the very same alpha/beta evidence does separate
    sig2 = derive_signal(REG, rows[:2], lb, "t")
    assert sig2["elo_separation"] == "SEPARATED" and sig2["elo_leader"] == "alpha:7b"
