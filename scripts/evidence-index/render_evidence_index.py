#!/usr/bin/env python3
"""Render index.md (human) and README.md (Hugging Face dataset card) from index.json, index.signed.json,
index.ots.json and, when present, verify.log (the output of `python3 verify.py`). No figure is hand-typed.

    render_evidence_index.py --out DIR
"""
import argparse, collections, hashlib, json, pathlib


def short(h, n=12):
    return (h or "")[:n]


def sig_cell(i):
    s = i["signature"]; st = s["state"]
    if i["kind"] in ("dataset", "space", "model") and s.get("candidate_files"):
        r = s.get("results", {})
        st += " (%s)" % ", ".join("%s %d" % (k, v) for k, v in sorted(r.items()))
    elif s.get("key"):
        st += " `%s`" % s["key"].split("#")[1]
    if s.get("rows"):
        st += " (%s)" % s["rows"]["summary"]
    return st


def ots_cell(i):
    o = i["ots"]
    if i["kind"] in ("dataset", "space", "model") and o.get("proofs"):
        return "%s (%d proofs, %d checked)" % (o["state"], o["proofs"], o["checked"])
    return o["state"]


def package_rule_lines(e):
    """The package inclusion rule and every decision it made, rendered from index.json (nothing hand-typed)."""
    po = e["package_ownership"]
    L = ["\n## Package inclusion rule (rule v%s)\n" % po["rule_version"], po["why"] + "\n"]
    L += ["%s" % r for r in po["rule"]]
    L.append("\nEstate registry accounts: %s. Decisions: %s.\n" % (", ".join("%s `%s`" % kv for kv in sorted(po["estate_accounts"].items())),
                                                                 ", ".join("%s %d" % kv for kv in sorted(po["counts"].items()))))
    L.append("| registry | package | version | decision | reason | declared publisher |\n|---|---|---|---|---|---|")
    for d in po["decisions"]:
        dp = "; ".join("%s: %s" % (k, v if not isinstance(v, dict) else ", ".join("%s" % x for x in v.values() if x)) for k, v in d["declared_publisher"].items() if k != "home_page") or "(none declared)"
        L.append("| %s | `%s` | %s | %s | %s | %s |" % (d["registry"], d["name"], d.get("version", ""), d["decision"], d["reason"].replace("|", "/"), dp.replace("|", "/")))
    L.append("")
    return L


def render(out):
    out = pathlib.Path(out)
    raw = (out / "index.json").read_bytes(); idx = json.loads(raw)
    sig = json.loads((out / "index.signed.json").read_text())
    side = json.loads((out / "index.ots.json").read_text())
    vlog = (out / "verify.log").read_text() if (out / "verify.log").exists() else ""
    vres = [l for l in vlog.splitlines() if l.startswith("RESULT") or l.startswith("INDEX")]
    t = idx["totals"]; e = idx["enumeration"]
    isha = hashlib.sha256(raw).hexdigest()

    kinds = ["trust-anchor", "board", "surface", "signed-record", "dataset", "space", "model", "package"]
    L = []
    L.append("# CSOAI evidence index\n")
    L.append("Schema `%s` · as of **%s** · %d items · index.json sha256 `%s`\n" % (idx["schema"], idx["as_of"], t["items"], isha))
    L.append("Signed `%s` at %s (Ed25519, via POST /api/board-sign). Timestamp: %s from %d OpenTimestamps calendar(s) — a pending calendar commitment is **not** a Bitcoin attestation.\n"
             % (sig["signature"]["did"], sig["signature"]["signed_at"], side["state"], len(side["calendars_accepted"])))
    L.append(idx["what_this_is"] + "\n")
    L.append("## What this index does not show\n")
    L += ["- " + x for x in idx["what_this_does_not_show"]]
    L.append("\n## Verify it yourself\n")
    L.append("```bash\npip install cryptography opentimestamps   # opentimestamps is optional\npython3 verify.py            # in a directory holding index.json + index.signed.json\npython3 verify.py --deep     # also re-download every byte-checked file and re-verify every checked signature file\n```\n")
    L.append("verify.py first checks that sha256(index.json) is the value signed in index.signed.json and that the signature verifies under `did:web:csoai.org#board-attestation-1` pinned from %s. Then, per item: Hugging Face repos are re-listed at the pinned commit and their manifest sha256 recomputed; signed records are re-downloaded and their signatures re-verified; package files are re-downloaded and re-hashed; live surfaces are re-fetched and reported PASS only if the bytes are identical, DRIFTED otherwise (a live surface is expected to change).\n" % idx["trust_anchor"]["did_document"])
    if vres:
        L.append("Result of running it at build time:\n\n```\n" + "\n".join(vres) + "\n```\n")
    L.append("## Totals (counts of indexed objects — not measurements; never add them to any other CSOAI count)\n")
    L.append("| kind | items | signature state | OTS state |\n|---|---|---|---|")
    for k in kinds:
        if k in t["by_kind"]:
            L.append("| %s | %d | %s | %s |" % (k, t["by_kind"][k],
                     ", ".join("%s %d" % kv for kv in sorted(t["signature_state_by_kind"][k].items())),
                     ", ".join("%s %d" % kv for kv in sorted(t["ots_state_by_kind"][k].items()))))
    L.append("\nSigned records verified under `#board-attestation-1`: **%d** of %d. Artifact binding: %s.\n"
             % (t["signed_records_verified_under_board_attestation_1"], t["by_kind"].get("signed-record", 0),
                ", ".join("%s %d" % kv for kv in sorted(t["signed_records_artifact_binding"].items()))))
    L.append("Hugging Face files listed: %d; downloaded and re-hashed in this build: %d; hash mismatches: %d; fetch failures: %d.\n"
             % (t["hf_files_listed"], t["hf_files_byte_checked"], t["hf_oid_mismatches"], t["hf_fetch_failed"]))
    L.append("## Enumeration\n")
    L.append("- Hugging Face: %s — %d repos listed, %d indexed. %s." % (e["hugging_face"]["source"], e["hugging_face"]["repos_listed"], e["hugging_face"]["repos_indexed"], e["hugging_face"]["scope"]))
    L.append("- PyPI: %s — %d owned, %d name candidates, %d included by the ownership rule below. %s" % (e["pypi"]["source"], e["pypi"]["projects_owned"], len(e["pypi"]["candidates"]), len(e["pypi"]["included"]), e["pypi"]["scope_note"]))
    L.append("- npm: %s — %d name candidates, %d included by the ownership rule below." % (e["npm"]["source"], len(e["npm"]["candidates"]), len(e["npm"]["included"])))
    L.append("- Web surfaces: %s." % ", ".join(e["web_surfaces"]["urls"]))
    L.append("- Read state: **%s**%s." % (e["read_state"], "; errors: " + "; ".join("%s (%s)" % (x["source"], x["error"]) for x in e["errors"]) if e["errors"] else ""))
    L.append("\nNot enumerated:\n")
    L += ["- " + x for x in e["not_enumerated"]]
    L += package_rule_lines(e)
    L.append("\nState words: VERIFIED = an Ed25519 check against a key pinned from the DID document returned true and a one-byte tamper control was rejected where recorded; FAILED = the stated rule was applied and the check returned false; PRESENT_NOT_VERIFIED = a signature is present but its preimage rule could not be recovered from the bytes (not evidence the signature is bad); PRESENT_KEY_NOT_IN_DID = signed by a key the DID document does not publish; UNSIGNED = no CSOAI signature found; PARTIAL = a mix, or caps stopped the check before every candidate was seen. OTS: pending = calendar commitment only; bitcoin-attested = a BitcoinBlockHeaderAttestation whose message equals the block header merkle root as served by a public block explorer (not a local node).\n")
    for k in kinds:
        its = [i for i in idx["items"] if i["kind"] == k]
        if not its:
            continue
        L.append("## %s (%d)\n" % (k, len(its)))
        L.append("| item | sha256 | signature | OTS | licence | published |\n|---|---|---|---|---|---|")
        for i in its:
            L.append("| [%s](%s) | `%s` | %s | %s | %s | %s |" % (i["title"].replace("|", "/"), i["url"], short(i["content_sha256"]), sig_cell(i).replace("|", "/"),
                                                           ots_cell(i), str(i.get("licence")).replace("|", "/"), (i.get("published") or "")[:10]))
        L.append("")
    L.append("Every row's full record — pinned revision, what it does NOT show, the exact check — is in index.json.\n")
    (out / "index.md").write_text("\n".join(L) + "\n")

    R = ["---", "license: cc-by-4.0", "pretty_name: CSOAI evidence index", "language:", "- en",
         "tags:", "- provenance", "- evidence", "- ed25519", "- opentimestamps", "- measurement", "size_categories:", "- n<1K", "---", ""]
    R.append("# CSOAI evidence index\n")
    R.append("One signed, machine-readable list of every piece of evidence CSOAI (Council of AI, councilof.ai) has published on the sources below, so a person or an agent can discover it and verify it in one place. Built %s; **%d items**.\n" % (idx["as_of"], t["items"]))
    R.append("This is an index, not a measurement and not a certification. It proves which bytes were published and which of them carry a signature that verifies; it does not make any indexed claim true, and inclusion endorses nothing.\n")
    R.append("## Files\n")
    R.append("| file | what |\n|---|---|")
    R.append("| `index.json` | the index (schema `%s`), sha256 `%s` |" % (idx["schema"], isha))
    R.append("| `index.signed.json` | Ed25519 signature over a payload pinning index.json by sha256, `%s`, signed %s |" % (sig["signature"]["did"], sig["signature"]["signed_at"]))
    R.append("| `index.json.ots` / `index.ots.json` | OpenTimestamps proof over sha256(index.json): %s (%s) |" % (side["state"], ", ".join(side["calendars_accepted"])))
    R.append("| `index.md` | the same index for humans |")
    R.append("| `verify.py` | a stranger's one-command verifier (Apache-2.0) |")
    R.append("| `build_evidence_index.py`, `render_evidence_index.py` | the code that built this (Apache-2.0) |")
    R.append("| `manifests/` | the per-repo file manifests whose sha256 is each Hugging Face item's `content_sha256` |")
    R.append("| `checks/` | per-repo lists of the files downloaded and re-hashed and the signature files checked; each bound to index.json by `check.checks_sha256` |")
    R.append("| `enumeration/owners.json` | the PyPI / npm owner enumeration the package items were selected from |")
    R.append("| `verify.log` | the output of `python3 verify.py` at build time |")
    R.append("\n## Verify\n")
    R.append("```bash\npip install cryptography opentimestamps huggingface_hub\nhuggingface-cli download csoai/evidence-index --repo-type dataset --local-dir evidence-index\ncd evidence-index && python3 verify.py\n```\n")
    R.append("By hand, the signature: in `index.signed.json` serialise `payload` as JSON with keys sorted recursively, no whitespace, UTF-8 literal. Its sha256 must equal `signature.payload_sha256`; `payload.artifact.sha256` must equal sha256 of `index.json`; `signature.sig_ed25519` (hex) must verify over those bytes under the `#board-attestation-1` key (`publicKeyJwk.x`, base64url) in https://csoai.org/.well-known/did.json. Change one byte and it must fail.\n")
    R.append("The timestamp: `ots upgrade index.json.ots && ots verify index.json.ots`. At publication it was a **%s** — calendars promised Bitcoin inclusion; it is not a Bitcoin attestation until `ots verify` says so against the chain.\n" % side["state"].replace("_", " ").lower())
    if vres:
        R.append("verify.py at build time:\n\n```\n" + "\n".join(vres) + "\n```\n")
    R.append("## What it contains\n")
    R.append("| kind | items | signature state | OTS state |\n|---|---|---|---|")
    for k in kinds:
        if k in t["by_kind"]:
            R.append("| %s | %d | %s | %s |" % (k, t["by_kind"][k], ", ".join("%s %d" % kv for kv in sorted(t["signature_state_by_kind"][k].items())),
                                              ", ".join("%s %d" % kv for kv in sorted(t["ots_state_by_kind"][k].items()))))
    R.append("\nCounts of indexed objects, not measurements. Signed records verified under `#board-attestation-1`: %d of %d.\n" % (t["signed_records_verified_under_board_attestation_1"], t["by_kind"].get("signed-record", 0)))
    R.append("## What it does not show\n")
    R += ["- " + x for x in idx["what_this_does_not_show"]]
    R.append("\nNot enumerated in this version:\n")
    R += ["- " + x for x in e["not_enumerated"]]
    R += package_rule_lines(e)
    R.append("\nEvery item carries its own `does_not_show` list, its licence, its published date, and the exact check behind its signature and timestamp state.\n")
    R.append("## Licence\n")
    R.append("Index data CC-BY-4.0 (attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai). verify.py and the build scripts Apache-2.0. Each indexed item keeps its own licence, stated per item; this index relicenses nothing.\n")
    (out / "README.md").write_text("\n".join(R) + "\n")
    print("rendered index.md (%d lines) README.md (%d lines)" % (len(L), len(R)))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--out", required=True)
    render(ap.parse_args().out)
