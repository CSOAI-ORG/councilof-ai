#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""check_report.py --dir OUT --date YYYY-MM-DD — the gate between a generated daily report and its publication.

PASS needs all of:
  holds      every axis named in holds.json is in the report with its figures withheld (n, accuracy, interval,
             leader, top three and notes all empty) and its reason printed; the governance limit is printed;
  text       no banned pattern (holds.json "banned": held scores, the double-counted claim figure, certification
             wording, prices, download figures) in the .md or in any string of the .json;
  signature  the .sig (schema csoai.daily-report-sig/0.2) holds a board signature over a small pointer to the .json,
             and both of these hold:
               digest     the pointer has exactly the keys schema, report_date, file, sha256 and signed_at; it names
                          this date and this file; and its sha256 is the SHA-256 of the exact .json bytes;
               signature  the signer's payload_sha256 is the SHA-256 of the pointer's canonical bytes (JSON, keys
                          sorted, separators "," and ":", UTF-8: functions/_lib/cardSign.ts canonicalBytes), the
                          signer is did:web:csoai.org#board-attestation-1, and sig_ed25519 verifies over those bytes
                          under that key, pinned below.
             Anything else fails: an unsigned .sig, a .sig that carries its own public key (schema 0.1), another key
             or DID, a pointer field that is missing, extra or different. The .json must also name its .sig.
Writes OUT/report-check-DATE.json and exits 1 unless the result is PASS. publish.py refuses to publish without it, and
refuses a check made under any key but the pinned board key.

The pointer exists because the report is far larger than the board signer's 3 KB payload cap. It is the corrections
ledger's pattern (scripts/sign-corrections-ledger.mjs): the board signs a small object that carries the SHA-256 of the
large body, and a reader checks both the digest and the signature.

--test-public-key FILE checks the signature under a throwaway key instead (a raw Ed25519 public key, hex, in FILE).
A pull-request dry run uses it, because the board signer admits only this workflow on master. That check names the
throwaway key, and publish.py refuses it.
"""
import argparse, hashlib, json, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent

SIG_SCHEMA = "csoai.daily-report-sig/0.2"
POINTER_SCHEMA = "csoai.daily-report-pointer/0.1"
POINTER_KEYS = ("file", "report_date", "schema", "sha256", "signed_at")
SIGNED_AT_RE = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z")
HEX64_RE = re.compile(r"[0-9a-f]{64}")
HEX128_RE = re.compile(r"[0-9a-f]{128}")

BOARD_DID = "did:web:csoai.org#board-attestation-1"
# The raw Ed25519 key of BOARD_DID, pinned as packages/venturi-capsule/chain.py, scripts/measurement_capsule_page.py and
# functions/_lib/cardVerify.ts (PINNED_ANCHORS) pin it. It is the key https://csoai.org/.well-known/did.json publishes for
# BOARD_DID (read 2026-11-24). A rotation changes this line in a reviewed change; until then a report signed under any
# other key fails here.
BOARD_PUB_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170"
BOARD_KEY = {"did": BOARD_DID, "public_key_hex": BOARD_PUB_HEX,
             "source": "pinned in scripts/daily-report/check_report.py: the key https://csoai.org/.well-known/did.json "
                       "publishes for did:web:csoai.org#board-attestation-1"}
# What a throwaway-key signature names where a board signature names BOARD_DID. It is never a DID and never publishable.
TEST_DID = "test-key:pull-request-dry-run"


def test_key(public_key_hex):
    return {"did": TEST_DID, "public_key_hex": public_key_hex,
            "source": "a throwaway key made in a pull-request job (dry run): not the board key; publish.py refuses this check"}


def report_name(date):
    return f"daily-report-{date}.json"


def sha256_hex(b):
    return hashlib.sha256(b).hexdigest()


def canon(o):
    """The board signer's preimage: functions/_lib/cardSign.ts canonicalBytes, venturi_capsule.canon."""
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def pointer(date, json_bytes, signed_at):
    """The small object the board signs in place of the report."""
    return {"schema": POINTER_SCHEMA, "report_date": date, "file": report_name(date), "sha256": sha256_hex(json_bytes),
            "signed_at": signed_at}


def strings(o, path="$"):
    if isinstance(o, str):
        yield path, o
    elif isinstance(o, dict):
        for k, v in o.items():
            yield from strings(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from strings(v, f"{path}[{i}]")


def signature_state(date, json_bytes, sig, key):
    """(state, note): VERIFIES only when the digest and the signature both check under `key`; else UNSIGNED or FAILS."""
    if not isinstance(sig, dict) or sig.get("schema") != SIG_SCHEMA:
        got = sig.get("schema") if isinstance(sig, dict) else None
        return "FAILS", f"the .sig schema is {got!r}, not {SIG_SCHEMA} (a .sig that carries its own public key is not a board signature)"
    s = sig.get("signature")
    if not s:
        return "UNSIGNED", str(sig.get("note") or "no signature").removeprefix("UNSIGNED: ")
    p = sig.get("pointer")
    if not isinstance(p, dict) or sorted(p) != sorted(POINTER_KEYS):
        return "FAILS", f"the pointer does not have exactly the keys {', '.join(POINTER_KEYS)}"
    for k, want in (("schema", POINTER_SCHEMA), ("report_date", date), ("file", report_name(date))):
        if p[k] != want:
            return "FAILS", f"pointer.{k} is {p[k]!r}, not {want!r}"
    if p["sha256"] != sha256_hex(json_bytes):
        return "FAILS", "pointer.sha256 is not the SHA-256 of the .json bytes (the report changed after signing)"
    if not isinstance(p["signed_at"], str) or not SIGNED_AT_RE.fullmatch(p["signed_at"]):
        return "FAILS", "pointer.signed_at is not a UTC time of the form YYYY-MM-DDTHH:MM:SSZ"
    if not isinstance(s, dict):
        return "FAILS", "the signature block is not an object"
    if s.get("did") != key["did"]:
        return "FAILS", f"the signature names {s.get('did')!r}, not {key['did']}"
    c = canon(p)
    if s.get("payload_sha256") != sha256_hex(c):
        return "FAILS", "signature.payload_sha256 is not the SHA-256 of the canonical pointer (the pointer changed after signing)"
    sig_hex = s.get("sig_ed25519")
    if not isinstance(sig_hex, str) or not HEX128_RE.fullmatch(sig_hex):
        return "FAILS", "sig_ed25519 is not 64 bytes of hex"
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(key["public_key_hex"])).verify(bytes.fromhex(sig_hex), c)
    except Exception as e:
        return "FAILS", f"the Ed25519 signature does not verify over the canonical pointer under {key['did']} ({type(e).__name__})"
    return "VERIFIES", (f"Ed25519 over the canonical pointer under {key['did']} ({key['public_key_hex'][:16]}...); "
                        "the pointer pins the SHA-256 of the .json bytes")


def check(out, date, holds, key=None):
    key = key or BOARD_KEY
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
    sig_state, sig_note = signature_state(date, raw, sig, key)
    if sig_state != "VERIFIES":
        v.append(f"signature {sig_state}: {sig_note}")
    if (rep.get("signature") or {}).get("signature_file") != sp.name:
        v.append("the .json does not name its .sig")
    if rep.get("report_date") != date:
        v.append(f"the .json says report_date {rep.get('report_date')!r}, not {date}")
    p = sig.get("pointer") if isinstance(sig, dict) else None
    return {"schema": "csoai.daily-report-check/0.2", "date": date, "result": "PASS" if not v else "FAIL",
            "report_json_sha256": sha256_hex(raw), "signature": sig_state, "signature_note": sig_note,
            "key": dict(key), "pointer_sha256": sha256_hex(canon(p)) if isinstance(p, dict) else None,
            "holds_file_sha256": sha256_hex((HERE / "holds.json").read_bytes()),
            "held_axes": sorted(holds["axes"]), "violations": v[:200], "n_violations": len(v)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--date", required=True)
    ap.add_argument("--holds", default=str(HERE / "holds.json"))
    ap.add_argument("--test-public-key", default=None,
                    help="FILE holding a throwaway Ed25519 public key (hex): check under it instead of the board key "
                         "(pull-request dry runs only; publish.py refuses such a check)")
    a = ap.parse_args()
    key = BOARD_KEY
    if a.test_public_key:
        hx = pathlib.Path(a.test_public_key).read_text().strip()
        if not HEX64_RE.fullmatch(hx):
            sys.exit("--test-public-key: the file does not hold 32 bytes of hex")
        key = test_key(hx)
    out = pathlib.Path(a.dir)
    res = check(out, a.date, json.loads(pathlib.Path(a.holds).read_text()), key)
    (out / f"report-check-{a.date}.json").write_text(json.dumps(res, indent=1) + "\n")
    print(json.dumps({k: res[k] for k in ("date", "result", "signature", "n_violations")} | {"key": key["did"]}))
    for x in res["violations"][:40]:
        print("  " + x)
    sys.exit(0 if res["result"] == "PASS" else 1)


if __name__ == "__main__":
    main()
