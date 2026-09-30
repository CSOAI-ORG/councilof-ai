#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Sign one effect-binding server-probe run through POST /api/board-sign and write its companion.

    eb_sign_run.py <artifact.json> <raw_log.jsonl> <token_file> <out.signed.json> [--mirror-base URL]

Before signing, JWT-shaped strings in the raw log (a third party's page script can embed one; the 2026-09-30 run
logged a public Supabase anon key from one server's HTML) are replaced IN PLACE by "[REDACTED jwt-shaped
sha256:<hex>]" and the count goes into the signed payload, so the published log never republishes a token and
the redaction is visible and checkable against the original bytes by anyone who holds them.

The payload has the shape of the 2026-09-22 companion (public/interop/effect-binding-server-probe-2026-09-22.signed.json):
counts, tried, dropped, artifact and raw-log sha256, and the artifact's mirror URL. It is signed by
did:web:csoai.org#board-attestation-1 (the PKCS8 never leaves Cloudflare; the caller token is read from a file and never
printed). scripts/arena/board_sign.py verifies the returned signature against the DID document and proves the verifier
can fail (altered preimage) before anything is written. A signature proves these bytes were signed by the board key;
it does not make the run a grade, and it does not change the board: slot 23 rests on the signed parent run.
"""
import hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "arena"))
import board_sign as B  # noqa: E402

MIRROR = "https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/public/interop/"


def fsha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


JWT = re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")


def redact_log(log_path):
    t = open(log_path, encoding="utf-8").read()
    n = 0

    def sub(m):
        nonlocal n
        n += 1
        return "[REDACTED jwt-shaped sha256:" + hashlib.sha256(m.group(0).encode()).hexdigest() + "]"
    new = JWT.sub(sub, t)
    if n:
        with open(log_path, "w", encoding="utf-8") as fh:
            fh.write(new)
    return n


def payload_for(art_path, log_path, mirror=MIRROR, redactions=0):
    art = json.load(open(art_path))
    name = os.path.basename(art_path)
    tp = art["third_party"]["counts"]
    o = tp["outcomes"]
    return {
        "schema": "csoai.effect-binding-server-run/0.1",
        "axis": "effect-binding",
        "board_slot": 23,
        "ruling_ref": "council-os/ADR-002-axis-23-effect-binding.md",
        "kind": "deterministic-facts",
        "status": "RE-RUN",
        "board_effect": "none: slot 23 rests on the signed 2026-09-22 parent run; this dated re-run neither replaces nor re-flips it",
        "n": art["n"],
        "n_unit": art["n_unit"],
        "as_of": art["as_of"],
        "rerun_of_sha256": art["rerun_of"]["sha256"],
        "artifact": {"path": "/interop/" + name, "sha256": fsha(art_path), "mirror": mirror + name},
        "raw_log": {"path": f"public/interop/{os.path.basename(log_path)} (HF mirror only)", "sha256": fsha(log_path),
                    "redactions": {"jwt_shaped_strings": redactions, "rule": "replaced by [REDACTED jwt-shaped sha256:<hex of the original>]"}},
        "verdicts": {k: o[k] for k in ("BINDS", "PARTIAL", "DOES_NOT_BIND")},
        "tried": tp["tried"],
        "dropped": {k: o[k] for k in ("UNCHECKABLE", "UNREACHABLE", "NO_TOOLS", "NO_READONLY_TOOL")},
        "controls_passed": bool(art["controls"]["both_behaved"] and art["controls"]["grader_can_fail"]["changed_as_required"]),
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token; the PKCS8 never left Cloudflare)",
        "not_a_grade": "A signature proves these bytes were signed by the board key; it does not prove any claim inside the artifact beyond what its instrument measured (SCITT rule).",
    }


def main():
    a = sys.argv[1:]
    mirror = a[a.index("--mirror-base") + 1] if "--mirror-base" in a else MIRROR
    art_path, log_path, token_file, out = a[:4]
    red = redact_log(log_path)
    p = payload_for(art_path, log_path, mirror, red)
    if not p["controls_passed"]:
        raise SystemExit("REFUSED: the run's controls did not pass; nothing is signed")
    sig = B.sign_payload(p, token_file)
    doc = {"schema": "csoai.signed-run/0.1", "payload": B.norm(p), "signature": sig,
           "verify": "canonicalise payload as above, sha256 must equal signature.payload_sha256, verify sig_ed25519 (hex) "
                     "with the #board-attestation-1 key in https://csoai.org/.well-known/did.json"}
    with open(out, "w") as fh:
        json.dump(doc, fh, indent=2)
        fh.write("\n")
    print(json.dumps({"out": out, "payload_sha256": sig["payload_sha256"], "artifact_sha256": p["artifact"]["sha256"],
                      "n": p["n"], "verdicts": p["verdicts"], "signed_at": sig.get("signed_at")}))


if __name__ == "__main__":
    main()
