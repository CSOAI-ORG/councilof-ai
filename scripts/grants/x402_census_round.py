#!/usr/bin/env python3
"""One ROUND of the x402 settlement census, as a committed, recomputable artefact set (W1).

A round is one buyer's-eye purchase from every host in a fixed population at one moment. The
first round (2026-09-06) exists as loose files under docs/product/; this producer gives every
round the same shape so rounds can be diffed (x402_census_delta.py), turned into leaves
(harness/x402-census/build_cards.py) and published (public/interop/x402-census/).

Layout it writes, all under --rounds-dir (default docs/product/x402-census/rounds):

  <round_id>/dry.jsonl        DRY pass rows (challenge terms only; nothing signed or sent)
  <round_id>/settle.jsonl     SETTLE pass rows (a signed payment sent to every eligible host)
  <round_id>/round.json       the round manifest: population, caps, outcome counts, spend,
                              receipt counts, input sha256s — every number derived from the rows
  <round_id>/analysis.json    scripts/grants/x402_census_analysis.analyse() over the rows
  <round_id>/analysis.md      rendered from analysis.json, never typed

and under --public-dir (default public/interop/x402-census), the derived surface:

  rounds/<round_id>.json      round.json plus the URLs a stranger needs
  index.json                  every round + every delta on disk, newest first, with the ladder
                              (observations per host so far against the n>=30 rule)

Modes
  --import-settle/--import-dry   copy an existing pair of jsonl files into the round dir
                                 byte-for-byte (round 2026-09-06 came before this layout)
  --run                          run scripts/grants/x402-settlement-census.py: DRY first, always;
                                 the SETTLE pass only when SETTLE=1 is already in the environment.
                                 This script never reads or prints X402_PAYER_KEY; it passes the
                                 environment through untouched. The paid pass is the owner's keystroke.
  --hosts-from <round_id>        with --run: probe exactly the hosts of an earlier round (same
                                 population, so the pair is a time series, not two samples)
  --check                        recompute round.json, analysis.*, the public per-round file and
                                 index.json from the committed rows; exit 1 on any byte drift
  --press                        print the numbers-only press block for the round (and the newest
                                 delta if one exists) — facts, no adjectives, no prices of ours
  --hf-readme                    print the derived README body for csoai/x402-settlement-census
  --selftest                     prove determinism and that a planted byte change fails --check

Doctrine carried: measurement, not certification; REFUSED is not proof of bad faith; one purchase
per host at one moment; self excluded; MEASURED is never written here. stdlib only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter, OrderedDict
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
import x402_census_analysis as analysis  # noqa: E402

SCHEMA_ROUND = "csoai.x402-census.round/0.1"
SCHEMA_INDEX = "csoai.x402-census.index/0.1"
CENSUS_TOOL = HERE / "x402-settlement-census.py"
ROUNDS_REL = "docs/product/x402-census/rounds"
DELTAS_REL = "docs/product/x402-census/deltas"
PUBLIC_REL = "public/interop/x402-census"
LEAVES_REL = "public/interop/x402-census/leaves"
SITE = "https://councilof.ai"
HF_DATASET = "https://huggingface.co/datasets/csoai/x402-settlement-census"
PAID = ("DELIVERED", "REFUSED", "MISMATCH")   # a signed payment was sent; NO_CHALLENGE and DRY are not paid rows
N_REQUIRED = 30                               # 3 Sep ruling: the signer writes the higher state at n>=30, never below
UNITS = 1_000_000

CAVEATS = list(analysis.CAVEATS) + [
    "Self excluded: our own hosts are never in the population; paying ourselves would be a self-settlement.",
    "No host was contacted, ranked or recommended. A row says what happened; the chain says whether it happened.",
]
ELIGIBILITY = ("conformant AND eip155:8453 AND scheme exact AND amount a positive integer <= per_host_cap units "
               "AND not one of our own hosts")


# ----------------------------------------------------------------------------- io
def read_jsonl(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def sha256_file(path: Path) -> str:
    return analysis.sha256_file(str(path))


def dumps(obj) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def write_if_changed(path: Path, text: str) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    old = path.read_text(encoding="utf-8") if path.exists() else None
    if old == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def rel(path: Path, root: Path) -> str:
    return str(path.relative_to(root)).replace(os.sep, "/")


def hosts_sha256(rows: list[dict]) -> str:
    """Identity of a population: sha256 over the sorted, newline-joined host list."""
    return hashlib.sha256("\n".join(sorted({r["host"] for r in rows})).encode("utf-8")).hexdigest()


# ----------------------------------------------------------------------------- schema validation
# The two published JSON Schemas are the contract this surface offers. A schema nothing validates
# against is decoration, and this estate has shipped that before — so a deliberately small subset of
# JSON Schema is implemented here (required / type / const / enum / pattern / minItems / minimum,
# recursing through `properties`) and every --check runs it. stdlib only, and --selftest proves it
# can fail rather than assuming it.
SCHEMA_ROUND_FILE = "public/schema/x402-census-round-v1.json"
SCHEMA_DELTA_FILE = "public/schema/x402-census-delta-v1.json"

_JSON_TYPES = {"object": dict, "array": list, "string": str, "integer": int,
               "number": (int, float), "boolean": bool, "null": type(None)}


def _types_ok(value, spec) -> bool:
    names = spec if isinstance(spec, list) else [spec]
    if "integer" in names and isinstance(value, bool):
        return False
    return any(isinstance(value, _JSON_TYPES[n]) for n in names if n in _JSON_TYPES)


def validate(doc, schema: dict, where: str = "$") -> list[str]:
    bad: list[str] = []
    if "const" in schema and doc != schema["const"]:
        bad.append(f"{where}: expected const {schema['const']!r}, got {doc!r}")
    if "enum" in schema and doc not in schema["enum"]:
        bad.append(f"{where}: {doc!r} is not one of {schema['enum']}")
    if "type" in schema and not _types_ok(doc, schema["type"]):
        bad.append(f"{where}: expected type {schema['type']}, got {type(doc).__name__}")
        return bad
    if "pattern" in schema and isinstance(doc, str) and not re.search(schema["pattern"], doc):
        bad.append(f"{where}: {doc!r} does not match {schema['pattern']}")
    if "minimum" in schema and isinstance(doc, (int, float)) and doc < schema["minimum"]:
        bad.append(f"{where}: {doc} < minimum {schema['minimum']}")
    if "minItems" in schema and isinstance(doc, list) and len(doc) < schema["minItems"]:
        bad.append(f"{where}: {len(doc)} items < minItems {schema['minItems']}")
    if isinstance(doc, dict):
        for key in schema.get("required", []):
            if key not in doc:
                bad.append(f"{where}.{key}: required and absent")
        for key, sub in (schema.get("properties") or {}).items():
            if key in doc:
                bad += validate(doc[key], sub, f"{where}.{key}")
    if isinstance(doc, list) and isinstance(schema.get("items"), dict):
        for i, item in enumerate(doc):
            bad += validate(item, schema["items"], f"{where}[{i}]")
    return bad


def validate_file(doc, schema_rel: str, root: Path | None = None) -> list[str]:
    path = (root or ROOT) / schema_rel
    if not path.is_file():          # absence is a failure, never a silent pass
        return [f"{schema_rel}: schema file missing — nothing was validated"]
    return validate(doc, json.loads(path.read_text(encoding="utf-8")), "$")


# ----------------------------------------------------------------------------- round manifest
def round_manifest(round_id: str, settle_rows: list[dict], dry_rows: list[dict], settle_rel: str, dry_rel: str,
                   settle_sha: str, dry_sha: str, caps: dict | None = None) -> OrderedDict:
    by_status = Counter(r.get("status") for r in settle_rows)
    n = len(settle_rows)
    paid = [r for r in settle_rows if r.get("status") in PAID]
    receipts = Counter(analysis.settle_receipt_kind(r) for r in paid)
    tar = [r for r in settle_rows if r.get("status") == "REFUSED" and analysis.has_settle_hash(r)]
    payers = sorted({r.get("payer") for r in settle_rows if r.get("payer")})
    spent = max([r.get("spent_units_running") or 0 for r in settle_rows] or [0])
    dry_by_host = {r["host"]: r for r in dry_rows}
    units_changed = sum(1 for r in settle_rows if r.get("challenge_units") is not None
                        and r["host"] in dry_by_host and dry_by_host[r["host"]].get("challenge_units") is not None
                        and dry_by_host[r["host"]]["challenge_units"] != r["challenge_units"])
    pay_to = Counter(analysis.norm_addr(r.get("pay_to")) for r in settle_rows if r.get("pay_to"))
    observed = sorted(r.get("observed_at") for r in settle_rows if r.get("observed_at"))
    outcome = OrderedDict()
    for s in analysis.OUTCOMES:
        outcome[s] = OrderedDict(hosts=by_status.get(s, 0), pct=analysis.pct(by_status.get(s, 0), n))
    caps = caps or {}
    return OrderedDict(
        schema=SCHEMA_ROUND,
        round_id=round_id,
        mode="SETTLE" if settle_rows and settle_rows[0].get("mode") == "SETTLE" else (settle_rows[0].get("mode") if settle_rows else None),
        as_of=observed[-1] if observed else None,
        window=OrderedDict(first_observed=observed[0] if observed else None, last_observed=observed[-1] if observed else None),
        network=caps.get("network", "eip155:8453"),
        asset="USDC",
        population=OrderedDict(probed=n, dry_probed=len(dry_rows), eligibility=ELIGIBILITY, hosts_sha256=hosts_sha256(settle_rows)),
        caps=OrderedDict(per_host_units=caps.get("per_host_units", 50000), total_usdc=caps.get("total_usdc", 5.5)),
        payer=OrderedDict(addresses=payers, note="a throwaway wallet the estate controls; every unit here is a cost, never revenue"),
        rows=OrderedDict(settle=OrderedDict(path=settle_rel, sha256=settle_sha, n=n),
                         dry=OrderedDict(path=dry_rel, sha256=dry_sha, n=len(dry_rows))),
        outcome=outcome,
        paid_rows=len(paid),
        settlement_receipts=OrderedDict(tx_hash=receipts.get("tx_hash", 0), unparseable=receipts.get("unparseable", 0), none=receipts.get("none", 0)),
        take_and_refuse=OrderedDict(hosts=len(tar), usdc=analysis.usdc(sum(r.get("challenge_units") or 0 for r in tar)),
                                    definition="status REFUSED and settle_tx is a 0x-prefixed 32-byte hash reported in the host's own PAYMENT-RESPONSE"),
        spend_usdc=analysis.usdc(spent),
        pay_to=OrderedDict(distinct=len(pay_to), top1_hosts=(pay_to.most_common(1)[0][1] if pay_to else 0)),
        latency_s=OrderedDict(probe_median=analysis.percentile([r.get("probe_s") for r in settle_rows], 0.5),
                              paid_median=analysis.percentile([r.get("paid_s") for r in paid], 0.5)),
        x402_version=OrderedDict(sorted(((str(k), v) for k, v in Counter(r.get("x402_version") for r in settle_rows).items()), key=lambda kv: kv[0])),
        dry_vs_settle=OrderedDict(challenge_units_changed=units_changed,
                                  dropped=sorted(set(dry_by_host) - {r["host"] for r in settle_rows}),
                                  added=sorted({r["host"] for r in settle_rows} - set(dry_by_host))),
        caveats=CAVEATS,
        reproduce=("python3 scripts/grants/x402_census_round.py --round-id %s --run --hosts-from <previous round> "
                   "(DRY always; SETTLE=1 X402_PAYER_KEY=<throwaway> for the paid pass)" % round_id),
    )


def public_round(manifest: OrderedDict, deltas_touching: list[str], leaves_n: int | None) -> OrderedDict:
    rid = manifest["round_id"]
    out = OrderedDict(manifest)
    out["urls"] = OrderedDict(
        rows_settle=f"{HF_DATASET}/resolve/main/rounds/{rid}/settle.jsonl",
        rows_dry=f"{HF_DATASET}/resolve/main/rounds/{rid}/dry.jsonl",
        rows_in_repo=f"https://github.com/CSOAI-ORG/councilof-ai/blob/master/{ROUNDS_REL}/{rid}/settle.jsonl",
        analysis=f"https://github.com/CSOAI-ORG/councilof-ai/blob/master/{ROUNDS_REL}/{rid}/analysis.md",
        leaves=f"{SITE}/interop/x402-census/leaves/{rid}/",
        deltas=[f"{SITE}/interop/x402-census/deltas/{d}.json" for d in deltas_touching],
        root=f"{SITE}/root.json",
        witness_pointer=f"{SITE}/interop/root-witness-pointer.json",
    )
    out["leaves"] = OrderedDict(
        staged=leaves_n,
        note=("one unsigned public.notice leaf per paid row (DELIVERED/REFUSED/MISMATCH), staged for the "
              "public-root writer; a leaf is in the root only once root.json lists its sha256"),
    )
    return out


# ----------------------------------------------------------------------------- index
def list_rounds(rounds_dir: Path) -> list[str]:
    return sorted(p.name for p in rounds_dir.iterdir() if p.is_dir() and (p / "settle.jsonl").is_file()) if rounds_dir.is_dir() else []


def list_deltas(deltas_dir: Path) -> list[str]:
    return sorted(p.stem for p in deltas_dir.glob("*-vs-*.json")) if deltas_dir.is_dir() else []


def leaves_count(leaves_dir: Path, rid: str) -> int | None:
    d = leaves_dir / rid
    return len(list(d.glob("card-*-unsigned.json"))) if d.is_dir() else None


def observations(rounds_dir: Path, round_ids: list[str]) -> Counter:
    """How many rounds each host has a PAID row in. This is the ladder a buyer watches."""
    obs: Counter = Counter()
    for rid in round_ids:
        for r in read_jsonl(rounds_dir / rid / "settle.jsonl"):
            if r.get("status") in PAID:
                obs[r["host"]] += 1
    return obs


def build_index(root: Path, rounds_dir: Path, deltas_dir: Path, leaves_dir: Path) -> OrderedDict:
    rids = list_rounds(rounds_dir)
    manifests = {rid: json.loads((rounds_dir / rid / "round.json").read_text(encoding="utf-8")) for rid in rids if (rounds_dir / rid / "round.json").is_file()}
    deltas = list_deltas(deltas_dir)
    delta_docs = []
    for d in deltas:
        dj = json.loads((deltas_dir / f"{d}.json").read_text(encoding="utf-8"))
        delta_docs.append(OrderedDict(
            id=d, from_round=dj["from"]["round_id"], to_round=dj["to"]["round_id"], as_of=dj["to"]["as_of"],
            common_hosts=dj["hosts"]["common"], flipped=dj["flipped"]["count"],
            delivered_to_refused=len(dj["flipped"]["delivered_to_refused"]), refused_to_delivered=len(dj["flipped"]["refused_to_delivered"]),
            price_drift_hosts=dj["price_drift"]["hosts_changed"], pay_to_changed=len(dj["pay_to_changed"]),
            take_and_refuse_persisted=len(dj["take_and_refuse"]["persisted"]),
            dropped=len(dj["hosts"]["dropped"]), added=len(dj["hosts"]["added"]),
            url=f"{SITE}/interop/x402-census/deltas/{d}.json",
        ))
    obs = observations(rounds_dir, rids)
    ladder = Counter(obs.values())
    rounds_out = []
    for rid in reversed(rids):
        m = manifests.get(rid)
        if not m:
            continue
        rounds_out.append(OrderedDict(
            round_id=rid, as_of=m["as_of"], probed=m["population"]["probed"], paid_rows=m["paid_rows"],
            outcome={k: v["hosts"] for k, v in m["outcome"].items()},
            take_and_refuse=m["take_and_refuse"]["hosts"], spend_usdc=m["spend_usdc"],
            hosts_sha256=m["population"]["hosts_sha256"], leaves_staged=leaves_count(leaves_dir, rid),
            url=f"{SITE}/interop/x402-census/rounds/{rid}.json",
        ))
    newest = rounds_out[0]["as_of"] if rounds_out else None
    return OrderedDict(
        schema=SCHEMA_INDEX,
        as_of=newest,
        what_this_is=("Buyer's-eye x402 settlement census as a time series: the same population paid once per round, "
                      "the outcome recorded per host, the rounds diffed. Measurement, not certification."),
        rounds=rounds_out,
        deltas=list(reversed(delta_docs)),
        ladder=OrderedDict(
            rule=f"a host's series stays UNMEASURED until it has {N_REQUIRED} paid observations; one observation per round",
            n_required=N_REQUIRED,
            rounds_so_far=len(rids),
            hosts_observed=len(obs),
            hosts_by_observations=OrderedDict((str(k), v) for k, v in sorted(ladder.items())),
            hosts_at_or_above_n_required=sum(1 for v in obs.values() if v >= N_REQUIRED),
            weeks_to_n_required_at_weekly_cadence=max(0, N_REQUIRED - len(rids)),
            note=("At one round a week the first host reaches n=30 after ~30 weeks. Nothing on this surface "
                  "is a per-host verdict before then; the deltas are what a reader gets in the meantime."),
        ),
        cadence=OrderedDict(target="weekly", population_rule="each round probes the hosts of the previous round (--hosts-from), so added/dropped are real changes"),
        caveats=CAVEATS,
        feeds=OrderedDict(rss=f"{SITE}/feeds/x402-census.xml", hf=HF_DATASET, verify=f"{SITE}/signed/HOW-TO-VERIFY-ROOT.md"),
    )


# ----------------------------------------------------------------------------- render
def render_round(root: Path, rid: str, rounds_dir: Path, deltas_dir: Path, leaves_dir: Path, public_dir: Path,
                 caps: dict | None = None) -> dict[Path, str]:
    """Every artefact derived from the round's rows, as {path: text}. Pure; writes nothing."""
    rdir = rounds_dir / rid
    settle_p, dry_p = rdir / "settle.jsonl", rdir / "dry.jsonl"
    settle_rows, dry_rows = read_jsonl(settle_p), read_jsonl(dry_p)
    # The analysis module resolves the paths it is handed against its own repo root. Point it at
    # the root we were given, so --selftest can render a synthetic round in a temp tree and get
    # byte-identical behaviour to a real one. Restored below; never left pointing elsewhere.
    analysis_root, analysis.ROOT = analysis.ROOT, str(root)
    if caps is None and (rdir / "round.json").is_file():
        prev = json.loads((rdir / "round.json").read_text(encoding="utf-8"))
        caps = {"per_host_units": prev["caps"]["per_host_units"], "total_usdc": prev["caps"]["total_usdc"], "network": prev["network"]}
    manifest = round_manifest(rid, settle_rows, dry_rows, rel(settle_p, root), rel(dry_p, root),
                              sha256_file(settle_p), sha256_file(dry_p), caps)
    a = analysis.analyse(settle_rows, dry_rows, {"date": rid, "settle": rel(settle_p, root), "dry": rel(dry_p, root)})
    analysis.ROOT = analysis_root
    touching = [d for d in list_deltas(deltas_dir) if rid in d.split("-vs-")]
    out = {
        rdir / "round.json": dumps(manifest),
        rdir / "analysis.json": json.dumps(a, indent=2, ensure_ascii=False) + "\n",
        rdir / "analysis.md": analysis.render_md(a) + "\n",
        public_dir / "rounds" / f"{rid}.json": dumps(public_round(manifest, touching, leaves_count(leaves_dir, rid))),
    }
    return out


def render_index(root: Path, rounds_dir: Path, deltas_dir: Path, leaves_dir: Path, public_dir: Path) -> dict[Path, str]:
    return {public_dir / "index.json": dumps(build_index(root, rounds_dir, deltas_dir, leaves_dir))}


def write_all(files: dict[Path, str]) -> list[Path]:
    return [p for p, t in files.items() if write_if_changed(p, t)]


def check_all(files: dict[Path, str], root: Path) -> list[str]:
    bad = []
    for p, text in files.items():
        if not p.exists():
            bad.append(f"{rel(p, root)}: missing")
        elif p.read_text(encoding="utf-8") != text:
            bad.append(f"{rel(p, root)}: differs from recomputation")
    return bad


# ----------------------------------------------------------------------------- press + hf
def press_block(manifest: dict, delta: dict | None) -> str:
    o = manifest["outcome"]
    L = [f"x402 settlement census, round {manifest['round_id']} (as_of {manifest['as_of']})",
         f"- {manifest['population']['probed']} conformant hosts paid once each as a buyer; {manifest['paid_rows']} accepted a signed payment attempt",
         f"- DELIVERED {o['DELIVERED']['hosts']} ({o['DELIVERED']['pct']}%), REFUSED {o['REFUSED']['hosts']} ({o['REFUSED']['pct']}%), "
         f"MISMATCH {o['MISMATCH']['hosts']}, NO_CHALLENGE {o['NO_CHALLENGE']['hosts']}",
         f"- {manifest['take_and_refuse']['hosts']} hosts reported a settlement transaction and refused anyway ({manifest['take_and_refuse']['usdc']} USDC); each tx hash is in the rows",
         f"- settlement receipts on paid rows: tx hash {manifest['settlement_receipts']['tx_hash']}, unparseable {manifest['settlement_receipts']['unparseable']}, none {manifest['settlement_receipts']['none']}",
         f"- distinct payTo addresses {manifest['pay_to']['distinct']}; largest single payee collects for {manifest['pay_to']['top1_hosts']} hosts",
         f"- spend {manifest['spend_usdc']} USDC from a throwaway wallet; revenue 0",
         f"- rows sha256 {manifest['rows']['settle']['sha256']}"]
    if delta:
        h, f_ = delta["hosts"], delta["flipped"]
        L += [f"delta {delta['to']['round_id']} vs {delta['from']['round_id']} ({delta['days_between']} days)",
              f"- same population: {h['common']} in both, {len(h['dropped'])} dropped, {len(h['added'])} added",
              f"- flipped {f_['count']}: DELIVERED->REFUSED {len(f_['delivered_to_refused'])}, REFUSED->DELIVERED {len(f_['refused_to_delivered'])}, other {len(f_['other'])}",
              f"- price drift {delta['price_drift']['hosts_changed']} hosts; payTo changed {len(delta['pay_to_changed'])}",
              f"- take-and-refuse: persisted {len(delta['take_and_refuse']['persisted'])}, new {len(delta['take_and_refuse']['new'])}, cleared {len(delta['take_and_refuse']['cleared'])}"]
    L += ["caveats: " + " ".join(CAVEATS[:2]),
          f"verify: {SITE}/interop/x402-census/index.json ; {HF_DATASET}"]
    return "\n".join(L)


def hf_readme(index: dict) -> str:
    L = ["# x402 settlement census — a buyer's-eye time series", "",
         "The same population of conformant x402 hosts, paid once per round by a wallet we control, the outcome of each "
         "purchase recorded per host, and the rounds diffed. Nobody else pays every host and publishes what came back; "
         "the Bazaar indexes list who exists, this dataset records who delivers.", "",
         "Measurement, not certification. REFUSED is not proof of bad faith. One purchase per host at one moment; a host's "
         f"series stays UNMEASURED until it has {N_REQUIRED} paid observations (one per round), so at a weekly cadence the ladder "
         "is visible long before any per-host state changes. Our own hosts are excluded; every unit spent is a cost, never revenue.", "",
         "## Configs (one per round and one per delta, all JSONL — one file format so the viewer works)", "",
         "| config | file | rows | what it is |", "|---|---|---|---|"]
    for r in index["rounds"]:
        L.append(f"| `round-{r['round_id']}` | `rounds/{r['round_id']}/settle.jsonl` | {r['probed']} | one row per host: outcome, units asked, payTo, settle_tx, latency, bytes, content-type |")
        L.append(f"| `round-{r['round_id']}-dry` | `rounds/{r['round_id']}/dry.jsonl` | {r['probed']} | the DRY pass minutes earlier: challenge terms only, nothing sent |")
    for d in index["deltas"]:
        L.append(f"| `delta-{d['id']}` | `deltas/{d['id']}.jsonl` | {d['common_hosts']}+ | one row per host in either round: transition, units drift, payTo change, take-and-refuse persistence |")
    L += ["", "## Rounds", "", "| round | as_of | probed | DELIVERED | REFUSED | MISMATCH | NO_CHALLENGE | took-and-refused | spend USDC | rows sha256 |", "|---|---|---|---|---|---|---|---|---|---|"]
    for r in index["rounds"]:
        o = r["outcome"]
        L.append(f"| {r['round_id']} | {r['as_of']} | {r['probed']} | {o.get('DELIVERED', 0)} | {o.get('REFUSED', 0)} | {o.get('MISMATCH', 0)} | {o.get('NO_CHALLENGE', 0)} | {r['take_and_refuse']} | {r['spend_usdc']} | `{r['hosts_sha256'][:16]}` |")
    if index["deltas"]:
        L += ["", "## Deltas", "", "| delta | common | flipped | DELIVERED->REFUSED | REFUSED->DELIVERED | price drift | payTo changed | take-and-refuse persisted | dropped | added |", "|---|---|---|---|---|---|---|---|---|---|"]
        for d in index["deltas"]:
            L.append(f"| {d['id']} | {d['common_hosts']} | {d['flipped']} | {d['delivered_to_refused']} | {d['refused_to_delivered']} | {d['price_drift_hosts']} | {d['pay_to_changed']} | {d['take_and_refuse_persisted']} | {d['dropped']} | {d['added']} |")
    lad = index["ladder"]
    L += ["", "## The ladder", "",
          f"Rounds so far {lad['rounds_so_far']}; hosts observed {lad['hosts_observed']}; hosts at or above n={N_REQUIRED}: {lad['hosts_at_or_above_n_required']}. "
          f"Hosts by number of paid observations: " + ", ".join(f"n={k}: {v}" for k, v in lad["hosts_by_observations"].items()) + ".", "",
          "## Verify without trusting us", "",
          f"- Every paid row is also a card-v0 leaf under the public root: `{SITE}/interop/x402-census/leaves/<round>/`, signed in GitHub Actions under `did:web:csoai.org#board-attestation-1`, listed in `{SITE}/root.json`, witnessed in Rekor and OpenTimestamps (`{SITE}/interop/root-witness-pointer.json`).",
          f"- Every settle_tx is the host's own claim; check it on Base rather than take a row's word.",
          f"- Recompute every number: `python3 scripts/grants/x402_census_round.py --round-id <id> --check` and `python3 scripts/grants/x402_census_delta.py --check` in https://github.com/CSOAI-ORG/councilof-ai.",
          f"- Machine index: `{SITE}/interop/x402-census/index.json`; RSS: `{SITE}/feeds/x402-census.xml`.", "",
          "## What this is not", ""] + [f"- {c}" for c in CAVEATS]
    return "\n".join(L) + "\n"


# ----------------------------------------------------------------------------- run / import
def import_rows(rdir: Path, settle_src: Path, dry_src: Path) -> None:
    rdir.mkdir(parents=True, exist_ok=True)
    for src, name in ((settle_src, "settle.jsonl"), (dry_src, "dry.jsonl")):
        dst = rdir / name
        if dst.exists() and dst.read_bytes() == src.read_bytes():
            continue
        shutil.copyfile(src, dst)


def census_from_round(rounds_dir: Path, prev_rid: str, dest: Path) -> int:
    """A local census file naming exactly the hosts of an earlier round, in the shape the tool reads."""
    rows = read_jsonl(rounds_dir / prev_rid / "settle.jsonl")
    out = []
    for r in rows:
        out.append({"host": r["host"], "probe_url": r["url"], "conformant": True, "network": "eip155:8453",
                    "scheme": "exact", "amount": str(r.get("challenge_units") or r.get("advertised_units") or 0),
                    "indexes": r.get("indexes") or [], "from_round": prev_rid})
    dest.write_text("".join(json.dumps(o) + "\n" for o in out), encoding="utf-8")
    return len(out)


def run_round(rid: str, rounds_dir: Path, a: argparse.Namespace) -> int:
    rdir = rounds_dir / rid
    rdir.mkdir(parents=True, exist_ok=True)
    census = a.census
    if a.hosts_from:
        census = str(rdir / f"population-from-{a.hosts_from}.jsonl")
        n = census_from_round(rounds_dir, a.hosts_from, Path(census))
        print(f"population: {n} hosts from round {a.hosts_from} -> {census}", file=sys.stderr)
    base = [sys.executable, str(CENSUS_TOOL), "--max-hosts", str(a.max_hosts), "--per-host-cap", str(a.per_host_cap),
            "--total-cap", str(a.total_cap), "--network", a.network]
    if census:
        base += ["--census", census]
    env_dry = {k: v for k, v in os.environ.items() if k != "SETTLE"}   # DRY first, always
    dry_out = rdir / "dry.jsonl"
    if dry_out.exists():
        dry_out.unlink()
    rc = subprocess.call(base + ["--out", str(dry_out)], env=env_dry)
    if rc != 0:
        print(f"DRY pass exited {rc}; not running SETTLE", file=sys.stderr)
        return rc
    if os.environ.get("SETTLE") != "1":
        print("DRY pass written. SETTLE=1 not set: the paid pass is the owner's keystroke, not this script's.", file=sys.stderr)
        return 0
    settle_out = rdir / "settle.jsonl"
    if settle_out.exists():
        print(f"{settle_out} already exists; a round is paid once. Remove it deliberately to re-run.", file=sys.stderr)
        return 1
    return subprocess.call(base + ["--out", str(settle_out)])   # environment passed through untouched; never read here


# ----------------------------------------------------------------------------- selftest
def _synthetic_rows(rid: str, hosts: list[tuple[str, str, int, str]]) -> tuple[list[dict], list[dict]]:
    settle, dry = [], []
    for i, (host, status, units, tx) in enumerate(hosts):
        base = {"host": host, "url": f"https://{host}/api/x", "advertised_units": units, "indexes": ["cdp"],
                "observed_at": f"{rid}T06:00:{i:02d}Z", "challenge_units": units, "x402_version": 2,
                "pay_to": "0x" + ("ab" * 20), "mime": "application/json", "probe_s": 0.2}
        dry.append({**base, "mode": "DRY", "status": "DRY"})
        row = {**base, "mode": "SETTLE", "status": status, "payer": "0x" + ("cd" * 20)}
        if status == "NO_CHALLENGE":
            row = {k: v for k, v in row.items() if k not in ("challenge_units", "x402_version", "pay_to", "mime")}
            row.update(probe_status=404)
        else:
            row.update(paid_status=200 if status == "DELIVERED" else 402, paid_s=1.0, bytes=100, content_type="application/json",
                       body_json=True, settle_tx=tx, spent_units_running=units if (status == "DELIVERED" or tx) else 0)
        settle.append(row)
    return settle, dry


def selftest() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="w1-round-"))
    root = tmp
    rounds_dir, deltas_dir, leaves_dir, public_dir = tmp / ROUNDS_REL, tmp / DELTAS_REL, tmp / LEAVES_REL, tmp / PUBLIC_REL
    rid = "2026-09-06"
    settle, dry = _synthetic_rows(rid, [("a.example", "DELIVERED", 1000, "0x" + "11" * 32), ("b.example", "REFUSED", 2000, None),
                                        ("c.example", "REFUSED", 3000, "0x" + "22" * 32), ("d.example", "NO_CHALLENGE", 0, None)])
    rdir = rounds_dir / rid
    rdir.mkdir(parents=True)
    (rdir / "settle.jsonl").write_text("".join(json.dumps(r) + "\n" for r in settle), encoding="utf-8")
    (rdir / "dry.jsonl").write_text("".join(json.dumps(r) + "\n" for r in dry), encoding="utf-8")
    caps = {"per_host_units": 50000, "total_usdc": 5.5, "network": "eip155:8453"}
    # Two phases, always: the index is DERIVED from the round manifests, so it can only be
    # rendered after they exist on disk. Rendering both from one snapshot wrote an empty index
    # on the first run and a full one on the second, which read as non-determinism and was not.
    write_all(render_round(root, rid, rounds_dir, deltas_dir, leaves_dir, public_dir, caps))
    write_all(render_index(root, rounds_dir, deltas_dir, leaves_dir, public_dir))
    bad = 0
    again = render_round(root, rid, rounds_dir, deltas_dir, leaves_dir, public_dir)
    again.update(render_index(root, rounds_dir, deltas_dir, leaves_dir, public_dir))
    if check_all(again, root):
        print("FAIL: second render differs from first (non-deterministic)", file=sys.stderr); bad += 1
    m = json.loads((rdir / "round.json").read_text())
    if not (m["paid_rows"] == 3 and m["take_and_refuse"]["hosts"] == 1 and m["outcome"]["NO_CHALLENGE"]["hosts"] == 1 and m["as_of"] == f"{rid}T06:00:03Z"):
        print("FAIL: manifest counts wrong: %s" % json.dumps({k: m[k] for k in ("paid_rows", "take_and_refuse", "as_of")}), file=sys.stderr); bad += 1
    if "MEASURED" in (rdir / "round.json").read_text().replace("UNMEASURED", ""):
        print("FAIL: the bare word MEASURED appeared in a round artefact", file=sys.stderr); bad += 1
    # the published schema must actually bind: the real manifest validates, and a manifest with one
    # required field removed must not. A validator never seen failing is decoration.
    if validate_file(m, SCHEMA_ROUND_FILE):
        print("FAIL: a freshly produced round.json does not validate against its own schema", file=sys.stderr); bad += 1
    if not validate_file({k: v for k, v in m.items() if k != "spend_usdc"}, SCHEMA_ROUND_FILE):
        print("FAIL: schema validation passed a manifest with a required field removed", file=sys.stderr); bad += 1
    # plant one byte in the committed rows: every derived artefact must now fail --check
    p = rdir / "settle.jsonl"
    p.write_text(p.read_text().replace('"status": "DELIVERED"', '"status": "REFUSED"', 1), encoding="utf-8")
    tampered = render_round(root, rid, rounds_dir, deltas_dir, leaves_dir, public_dir)
    if not check_all(tampered, root):
        print("FAIL: a planted byte change in the rows passed --check", file=sys.stderr); bad += 1
    shutil.rmtree(tmp, ignore_errors=True)
    print("selftest %s: deterministic render, counts, no bare MEASURED, schema binds (and can fail), "
          "planted change fails --check" % ("FAILED" if bad else "OK"))
    return 1 if bad else 0


# ----------------------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--round-id", default=None, help="YYYY-MM-DD (UTC). Default: every round on disk for --check/--publish")
    ap.add_argument("--rounds-dir", default=str(ROOT / ROUNDS_REL))
    ap.add_argument("--deltas-dir", default=str(ROOT / DELTAS_REL))
    ap.add_argument("--leaves-dir", default=str(ROOT / LEAVES_REL))
    ap.add_argument("--public-dir", default=str(ROOT / PUBLIC_REL))
    ap.add_argument("--import-settle", default=None)
    ap.add_argument("--import-dry", default=None)
    ap.add_argument("--run", action="store_true")
    ap.add_argument("--hosts-from", default=None, metavar="ROUND_ID")
    ap.add_argument("--census", default=None, help="census jsonl (URL or path) passed to the tool; default = the tool's own")
    ap.add_argument("--max-hosts", type=int, default=316)
    ap.add_argument("--per-host-cap", type=int, default=50000)
    ap.add_argument("--total-cap", type=float, default=5.5)
    ap.add_argument("--network", default="eip155:8453")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--press", action="store_true")
    ap.add_argument("--hf-readme", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    rounds_dir, deltas_dir, leaves_dir, public_dir = Path(a.rounds_dir), Path(a.deltas_dir), Path(a.leaves_dir), Path(a.public_dir)
    root = ROOT
    caps = {"per_host_units": a.per_host_cap, "total_usdc": a.total_cap, "network": a.network}

    if a.import_settle or a.import_dry:
        if not (a.import_settle and a.import_dry and a.round_id):
            sys.exit("--import-settle, --import-dry and --round-id go together")
        import_rows(rounds_dir / a.round_id, Path(a.import_settle), Path(a.import_dry))
        print(f"imported rows into {rel(rounds_dir / a.round_id, root)}")
    if a.run:
        if not a.round_id:
            sys.exit("--run needs --round-id")
        rc = run_round(a.round_id, rounds_dir, a)
        if rc != 0 or not (rounds_dir / a.round_id / "settle.jsonl").is_file():
            return rc

    rids = [a.round_id] if a.round_id else list_rounds(rounds_dir)
    files: dict[Path, str] = {}
    for rid in rids:
        if not (rounds_dir / rid / "settle.jsonl").is_file():
            print(f"{rid}: no settle.jsonl on disk; nothing to derive (a DRY-only round is not a round)", file=sys.stderr)
            continue
        files.update(render_round(root, rid, rounds_dir, deltas_dir, leaves_dir, public_dir,
                                  caps if (a.import_settle or a.run) else None))

    if a.check:
        # The index reads the COMMITTED round manifests, which is exactly what a check wants:
        # if a manifest has drifted from its rows, the round file fails first and the index second.
        files.update(render_index(root, rounds_dir, deltas_dir, leaves_dir, public_dir))
        bad = check_all(files, root)
        for rid in rids:
            mp = rounds_dir / rid / "round.json"
            if mp.is_file():
                bad += [f"{rid}/round.json {e}" for e in
                        validate_file(json.loads(mp.read_text(encoding="utf-8")), SCHEMA_ROUND_FILE)]
        if bad:
            print("CHECK FAILED\n  " + "\n  ".join(bad), file=sys.stderr)
            return 1
        print(f"CHECK OK: {len(files)} round artefacts match the committed rows and validate against "
              f"{SCHEMA_ROUND_FILE} ({len(rids)} round(s))")
        return 0
    # Write the round manifests before deriving the index from them (see selftest).
    changed = write_all(files)
    changed += write_all(render_index(root, rounds_dir, deltas_dir, leaves_dir, public_dir))
    for p in changed:
        print(f"wrote {rel(p, root)}")
    if not changed:
        print("nothing changed")
    if a.press or a.hf_readme:
        index = build_index(root, rounds_dir, deltas_dir, leaves_dir)
        if a.press:
            rid = a.round_id or (index["rounds"][0]["round_id"] if index["rounds"] else None)
            m = json.loads((rounds_dir / rid / "round.json").read_text(encoding="utf-8"))
            d = None
            if index["deltas"]:
                d = json.loads((deltas_dir / f"{index['deltas'][0]['id']}.json").read_text(encoding="utf-8"))
            print(press_block(m, d))
        if a.hf_readme:
            print(hf_readme(index))
    return 0


if __name__ == "__main__":
    sys.exit(main())
