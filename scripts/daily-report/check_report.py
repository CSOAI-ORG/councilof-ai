#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""check_report.py --dir OUT --date YYYY-MM-DD — the gate between a generated daily report and its publication.

PASS needs all of:
  holds      every axis named in holds.json is in the report with its figures withheld (n, accuracy, interval,
             leader, top three and notes all empty) and its reason printed; the governance limit is printed;
  text       no banned pattern (holds.json "banned": held scores, the double-counted claim figure, certification
             wording, prices, download figures) in the .md or in any string of the .json;
  signature  the .sig is an Ed25519 signature over the exact .json bytes under the public key it carries, and the
             .json names that .sig.
Writes OUT/report-check-DATE.json and exits 1 unless the result is PASS. publish.py refuses to publish without it.
"""
import argparse, base64, hashlib, json, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent


def strings(o, path="$"):
    if isinstance(o, str):
        yield path, o
    elif isinstance(o, dict):
        for k, v in o.items():
            yield from strings(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from strings(v, f"{path}[{i}]")


def signature_state(json_bytes, sig):
    if not sig.get("signature"):
        return "UNSIGNED", sig.get("note")
    try:
        from cryptography.hazmat.primitives.serialization import load_der_public_key
        if sig.get("signed_file_sha256") != hashlib.sha256(json_bytes).hexdigest():
            return "FAILS", "signed_file_sha256 is not the sha256 of the .json bytes"
        pub = load_der_public_key(base64.b64decode(sig["public_key_spki_b64"]))
        pub.verify(base64.b64decode(sig["signature"]), json_bytes)
        return "VERIFIES", "Ed25519 over the exact .json bytes under the SPKI in the .sig"
    except Exception as e:
        return "FAILS", f"{type(e).__name__}"


def check(out, date, holds):
    jp, mp, sp = (out / f"daily-report-{date}.{x}" for x in ("json", "md", "sig"))
    raw = jp.read_bytes()
    rep, md, sig = json.loads(raw), mp.read_text(), json.loads(sp.read_text())
    v = []
    axes = rep.get("axes") or {}
    entries = holds["entries"]
    for name, entry in holds["axes"].items():
        a = axes.get(name)
        if a is None:
            continue  # not on today's board: nothing of it can be restated
        filled = [k for k in ("n", "accuracy", "interval", "fleet_mean", "mean_harm", "leader", "separation_sentence", "api_note")
                  if a.get(k) not in (None, "", [], {})]
        if filled or a.get("top3"):
            v.append(f"held axis {name} ({entry}) carries figures: {filled + (['top3'] if a.get('top3') else [])}")
        if (a.get("withheld") or {}).get("entry") != entry:
            v.append(f"held axis {name} does not name its correction {entry}")
        sec = re.search(r"### \d+\. " + re.escape(name) + r" .*?(?=\n### |\n---|\Z)", md, flags=re.S)
        if not sec or entries[entry]["why"] not in sec.group(0):
            v.append(f"held axis {name}: the .md section does not print why it is withheld")
        if entries[entry].get("limit") and (not sec or entries[entry]["limit"] not in sec.group(0)):
            v.append(f"held axis {name}: the .md section does not print its limit")
    if holds.get("frontier_section") and (rep.get("frontier") or {}).get("state") != "WITHHELD":
        v.append("the frontier section is not withheld")
    for b in holds["banned"]:
        rx = re.compile(b["pattern"], flags=re.I)
        for m in rx.finditer(md):
            v.append(f"banned in .md ({b['why']}): ...{md[max(0, m.start() - 50):m.end() + 30]!r}")
        for path, s in strings(rep):
            m = rx.search(s)
            if m:
                v.append(f"banned in .json {path} ({b['why']}): ...{s[max(0, m.start() - 50):m.end() + 30]!r}")
    sig_state, sig_note = signature_state(raw, sig)
    if sig_state != "VERIFIES":
        v.append(f"signature {sig_state}: {sig_note}")
    if (rep.get("signature") or {}).get("signature_file") != sp.name:
        v.append("the .json does not name its .sig")
    spki = sig.get("public_key_spki_b64")
    return {"schema": "csoai.daily-report-check/0.1", "date": date, "result": "PASS" if not v else "FAIL",
            "report_json_sha256": hashlib.sha256(raw).hexdigest(), "signature": sig_state,
            "public_key_spki_sha256": hashlib.sha256(base64.b64decode(spki)).hexdigest() if spki else None,
            "holds_file_sha256": hashlib.sha256((HERE / "holds.json").read_bytes()).hexdigest(),
            "held_axes": sorted(holds["axes"]), "violations": v[:200], "n_violations": len(v)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--date", required=True)
    ap.add_argument("--holds", default=str(HERE / "holds.json"))
    a = ap.parse_args()
    out = pathlib.Path(a.dir)
    res = check(out, a.date, json.loads(pathlib.Path(a.holds).read_text()))
    (out / f"report-check-{a.date}.json").write_text(json.dumps(res, indent=1) + "\n")
    print(json.dumps({k: res[k] for k in ("date", "result", "signature", "n_violations")}))
    for x in res["violations"][:40]:
        print("  " + x)
    sys.exit(0 if res["result"] == "PASS" else 1)


if __name__ == "__main__":
    main()
