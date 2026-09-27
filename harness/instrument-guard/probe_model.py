#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Run the contamination probe for one model against one or more private banks.

Canaries are read from a local copy of the private store (never from this repo); their commitment
is read from the PUBLIC signed record, so a canary set that was swapped or edited is UNCHECKABLE.

  python3 probe_model.py --record public/interop/instrument-guard/bank-commitments-2026-09-26.json \
      --canaries-dir <private-store>/instrument-guard/canaries --ollama http://127.0.0.1:11434 \
      --model llama3.1:8b --out-public probe.json --out-private <private-store>/probes/llama.json [--bank gspc-x]

Writes a public-safe record (states, indices, output digests) and, separately, the private log with
raw outputs. Only the public-safe record may leave the private store.
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import instrument_guard as ig  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--record", required=True)
    ap.add_argument("--canaries-dir", required=True)
    ap.add_argument("--model", required=True)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--ollama")
    g.add_argument("--openai-base")
    ap.add_argument("--api-key-env", default="")
    ap.add_argument("--bank", action="append")
    ap.add_argument("--out-public", required=True)
    ap.add_argument("--out-private", required=True)
    a = ap.parse_args()

    rec = json.load(open(a.record))
    if a.ollama:
        model = ig.ollama_model(a.ollama, a.model)
    else:
        model = ig.openai_compatible_model(a.openai_base, a.model, os.environ.get(a.api_key_env, "") if a.api_key_env else "")
    pub, priv = [], []
    for b in rec["banks"]:
        cs = b.get("canary_set")
        if not cs or (a.bank and b["bank_id"] not in a.bank):
            continue
        fn = os.path.join(a.canaries_dir, b["bank_id"] + ".jsonl")
        rows = ig.read_jsonl(open(fn, "rb").read()) if os.path.exists(fn) else []
        r = ig.run_probe(model, rows, expected_commitment=cs["commitment_sha256"], model_id=a.model, bank_id=b["bank_id"])
        priv.append(r)
        pub.append(ig.public_view(r))
        print(f"{b['bank_id']:36s} {r['state']:24s} {r.get('reason', '')[:90]}")
    summary = {"schema": ig.SCHEMA_PROBE, "model_id": a.model, "record_as_of": rec["as_of"], "results": pub}
    os.makedirs(os.path.dirname(os.path.abspath(a.out_private)), exist_ok=True)
    with open(a.out_private, "w") as f:
        json.dump(priv, f, indent=1)
    os.chmod(a.out_private, 0o600)
    blob = json.dumps(summary, indent=1)
    # belt and braces: the public record must not contain any canary token
    digests = set(d for b in rec["banks"] if b.get("canary_set") for d in b["canary_set"]["leakscan_digests"])
    if ig.scan_text_for_leaks(blob, digests):
        print("REFUSING to write public record: it contains a canary token", file=sys.stderr)
        return 3
    with open(a.out_public, "w") as f:
        f.write(blob + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
