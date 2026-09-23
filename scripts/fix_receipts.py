#!/usr/bin/env python3
"""fix_receipts.py — the fourth verb: prove a fix held.

Finding a fault, naming its class and naming a remedy are three different jobs, and the
ecosystem does all three. The fourth — measuring the same thing again afterwards and
publishing both readings — is the one nobody productises. We can do it because we already
run both halves daily: a signed measurement engine and a public corrections ledger.

A fix receipt is that pair of readings, chain-linked, with a verdict drawn from a closed
vocabulary and a pointer to the corrections entry. It is about OUR OWN faults only. We do
not fix anyone else and we sell no remedy; that is what makes our measurements worth
reading. Nothing here is a conformity statement about any organisation, ours included.

    fix_receipts.py --measure            re-take the after-measurements live, write them frozen
    fix_receipts.py --build              compose the chain from receipts + the frozen readings
    fix_receipts.py --verify             check chain links, digests, schema and verdict rules
    fix_receipts.py --selftest           prove the checker can fail (planted breaks must be caught)

DIGEST RULE (published, so a reader never has to trust us):

    state_digest = sha256( json.dumps(link_without_state_digest,
                                      sort_keys=True, separators=(',',':'),
                                      ensure_ascii=True).encode() ).hexdigest()

Each link's digest is recomputable from that line alone, and prev_hash carries the previous
link's digest. Editing a receipt breaks its own digest; removing or reordering one breaks the
next link's prev_hash. Both checks are in --verify and both are in the README.

WHAT A RECEIPT DOES NOT DO. It does not prove the remedy was good, that no other fault
exists, or that anything is safe. It records that a named quantity read one way before a
named change and another way after, and who took each reading. Everything else a reader
should get from the evidence each receipt points at.

CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT_DIR = os.path.join(REPO, "public", "interop", "fix-receipts")
CHAIN = os.path.join(OUT_DIR, "fix-receipt-chain.jsonl")
SCHEMA = os.path.join(OUT_DIR, "fix-receipt.schema.json")
FROZEN = os.path.join(OUT_DIR, "after-measurements-2026-09-23.json")

SCHEMA_ID = "csoai.fix-receipt/0.1"
CHAIN_ID = "csoai-fix-receipts-2026-09"
ZERO = "0" * 64
VERDICTS = ("VERIFIED_FIX", "FIX_FAILED", "PARTIAL", "UNVERIFIABLE")
MEAS_STATES = ("MEASURED", "UNMEASURED", "UNMEASURABLE")

# A plain standard-library client is refused by the origin (correction C-2026-0917-02, and
# receipt FR-2026-0923-03 re-measures exactly that). The probes below therefore say, per
# request, which client they used — because WHICH CLIENT is part of the reading.
BROWSER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/140.0 Safari/537.36")


def utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def digest_of(link: dict) -> str:
    body = {k: v for k, v in link.items() if k != "state_digest"}
    return hashlib.sha256(canonical(body)).hexdigest()


def fetch(url: str, ua: str | None) -> tuple[object, bytes]:
    """Return (status_or_error, body). ua None means a plain stdlib client, no UA override."""
    headers = {"User-Agent": ua} if ua else {}
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60)
        return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:  # noqa: BLE001 - the reading is "what happened", including this
        return "ERR:" + type(e).__name__, b""


# ─────────────────────────────────────────────────────────────────────────────────────────
# after-measurement probes. Each returns a `measurement` object as the schema defines it.
# Every probe states its own method well enough to be re-run by a stranger.
# ─────────────────────────────────────────────────────────────────────────────────────────

def probe_mill_jobs() -> dict:
    """FR-01 after: does the hourly measurement engine's slice get past the bank-digest gate?

    Read from the engine's own log and the bank file on the machine that runs it. This is an
    on-machine reading, not a public one: a reader outside the estate cannot take it, and the
    receipt says so in `by`.
    """
    log = "/workspace/lanes/logs/mill-hourly.log"
    bank = "/workspace/banks-all/gspc-jail.jsonl"
    out_root = "/workspace/lanes/out/mill-hourly"
    restore = "2026-09-23T04:21:52Z"

    rows = sha = None
    state = "MEASURED"
    if os.path.exists(bank):
        with open(bank, "rb") as fh:
            data = fh.read()
        sha = hashlib.sha256(data).hexdigest()
        rows = data.count(b"\n")
    else:
        state = "UNMEASURABLE"

    after_lines: list[str] = []
    if os.path.exists(log):
        with open(log, encoding="utf-8", errors="replace") as fh:
            for ln in fh:
                ln = ln.strip()
                # lines begin with an ISO stamp; string comparison is safe on a fixed format
                if ln[:20] > restore and ("HALT" in ln or " runs=" in ln):
                    after_lines.append(ln)
    else:
        state = "UNMEASURABLE"

    halted_on_bank = [ln for ln in after_lines if "is not the goldbank" in ln]
    # jobs generated per slice, read from each slice's own grade.log rather than inferred
    jobs = {}
    if os.path.isdir(out_root):
        for d in sorted(os.listdir(out_root)):
            if not d.startswith("20260923T0"):
                continue
            g = os.path.join(out_root, d, "grade.log")
            if os.path.exists(g):
                txt = open(g, encoding="utf-8", errors="replace").read()
                n = None
                for w in txt.split():
                    if w.isdigit():
                        n = int(w)
                        break
                jobs[d] = n
            else:
                jobs[d] = 0

    return {
        "at": utcnow(),
        "what": "hourly measurement-engine slices halted by the jail bank-digest gate since the "
                "restore, the digest of the bank file the gate reads, and jobs generated per slice",
        "value": {
            "bank_sha256": sha,
            "bank_rows": rows,
            "restore_at": restore,
            "slices_since_restore": len(after_lines),
            "slices_halted_on_bank_digest_since_restore": len(halted_on_bank),
            "jobs_generated_per_slice_today": jobs,
            "halt_lines_since_restore": after_lines,
        },
        "unit": "slices; sha256; rows; jobs",
        "method": "sha256 and line count of the bank file the gate pins; every line of the engine's "
                  "own hourly log stamped later than the restore, counting those naming the gate; "
                  "and the jobs-generated count read from each slice's own grade.log rather than "
                  "inferred. The halt lines are carried verbatim so a reader sees the reasons that "
                  "are NOT this fault as well as the one that is. Re-runnable on the machine that "
                  "runs the engine with: sha256sum /workspace/banks-all/gspc-jail.jsonl ; "
                  "grep 20260923T0 /workspace/lanes/logs/mill-hourly.log",
        "source": [bank, log, out_root],
        "state": state,
        "by": "this estate, on the machine that runs the engine (not independently observable)",
    }


def _ed25519_verifier(raw_key: bytes):
    """Return verify(msg, sig) -> bool, or None if this runtime cannot do Ed25519.

    Two libraries are tried because the answer must not depend on which machine asks. If
    neither is present the reading is UNMEASURABLE — it is never assumed either way.
    """
    try:
        import nacl.signing  # type: ignore
        vk = nacl.signing.VerifyKey(raw_key)

        def _v(msg: bytes, sig: bytes) -> bool:
            try:
                vk.verify(msg, sig)
                return True
            except Exception:  # noqa: BLE001
                return False
        return _v
    except ImportError:
        pass
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        pk = Ed25519PublicKey.from_public_bytes(raw_key)

        def _v2(msg: bytes, sig: bytes) -> bool:
            try:
                pk.verify(sig, msg)
                return True
            except Exception:  # noqa: BLE001
                return False
        return _v2
    except ImportError:
        return None


def probe_board_attestation() -> dict:
    """FR-02 after: does the live board's site_attestation verify from the bytes it serves?

    The whole point of the fault is that a RELYING PARTY could not do this. So the probe does
    what a relying party does: fetch the payload, fetch the key from the DID document, and
    verify under the payload's own published preimage rule. No estate-internal state is used.
    """
    at = utcnow()
    st, body = fetch("https://councilof.ai/api/gspc", BROWSER_UA)
    if st != 200 or not body:
        return {"at": at, "what": "GET /api/gspc site_attestation verifies from served bytes",
                "value": None, "unit": None,
                "method": "fetch failed: %s" % (st,), "source": ["https://councilof.ai/api/gspc"],
                "state": "UNMEASURABLE", "by": "this estate"}
    served_sha = hashlib.sha256(body).hexdigest()
    payload = json.loads(body)
    sa = payload.pop("site_attestation", None)
    st2, did_body = fetch("https://csoai.org/.well-known/did.json", BROWSER_UA)
    verified, tried, key_x = None, [], None
    if sa and st2 == 200 and did_body:
        did = json.loads(did_body)
        vm = [v for v in did.get("verificationMethod", [])
              if str(v.get("id", "")).endswith("#board-attestation-1")]
        key_x = vm[0]["publicKeyJwk"]["x"] if vm else None
        ed = _ed25519_verifier(base64.urlsafe_b64decode(key_x + "=" * (-len(key_x) % 4))) if key_x else None
        if ed is not None:
            for name, pre in (
                ("canonical(payload minus site_attestation), ensure_ascii=False",
                 json.dumps(payload, sort_keys=True, separators=(",", ":"),
                            ensure_ascii=False).encode("utf-8")),
                ("same, ensure_ascii=True (the wrong reading, kept as a control)",
                 json.dumps(payload, sort_keys=True, separators=(",", ":"),
                            ensure_ascii=True).encode()),
            ):
                tried.append({"preimage": name, "verifies": ed(pre, bytes.fromhex(sa["sig"]))})
            verified = any(t["verifies"] for t in tried)
    state = "MEASURED" if verified is not None else "UNMEASURABLE"
    return {
        "at": at,
        "what": "preimage variants of GET /api/gspc that verify its site_attestation under the "
                "published key, computed from the bytes the site served",
        "value": {
            "verifying_variants": (sum(1 for t in tried if t["verifies"]) if tried else None),
            "variants_tried": len(tried) or None,
            "variants": tried or None,
            "served_body_sha256": served_sha,
            "key_in_payload_matches_did_document": (key_x == sa.get("public_key_x")) if (sa and key_x) else None,
            "signer": (sa or {}).get("signer"),
        },
        "unit": "preimage variants that verify, of variants tried",
        "method": "GET the payload, remove site_attestation, canonicalise per the payload's own "
                  "sig_input rule (keys sorted, no whitespace, ensure_ascii=False), Ed25519-verify "
                  "the hex signature under the #board-attestation-1 key read from "
                  "https://csoai.org/.well-known/did.json. The ensure_ascii=True variant is kept as "
                  "a control: it must FAIL, or the check is not discriminating. Needs PyNaCl or "
                  "cryptography; with neither, the reading is UNMEASURABLE rather than assumed.",
        "source": ["https://councilof.ai/api/gspc", "https://csoai.org/.well-known/did.json"],
        "state": state,
        "by": "this estate, using only bytes any reader can fetch",
    }


MIRROR = "https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/"
ORIGIN_URLS = [
    "https://councilof.ai/robots.txt",
    "https://councilof.ai/llms.txt",
    "https://councilof.ai/.well-known/did.json",
    "https://councilof.ai/.well-known/agent-card.json",
    "https://councilof.ai/.well-known/x402.json",
    "https://councilof.ai/api/gspc",
    "https://councilof.ai/api/corrections",
    "https://councilof.ai/root.json",
    "https://csoai.org/.well-known/did.json",
]


def probe_machine_reachability() -> dict:
    """FR-03 after: can a plain standard-library client reach our evidence?

    Two denominators, never merged: the ORIGIN the fault is about, and the MIRROR that was the
    stated remedy. HTTP 402 counts as reachable — a payable door answering 402 is working —
    which is the rule the 2026-09-17 measurement used, kept identical so the two are comparable.
    """
    at = utcnow()
    origin = {}
    for u in ORIGIN_URLS:
        st, _ = fetch(u, None)
        origin[u] = st
    mirror_rows, manifest_as_of = {}, None
    st, mb = fetch(MIRROR + "MIRROR-MANIFEST.json", None)
    if st == 200 and mb:
        man = json.loads(mb)
        manifest_as_of = man.get("as_of")
        for f in man.get("files", []):
            name = f.get("mirror_name")
            if not name:
                mirror_rows[f.get("path")] = None
                continue
            s, _ = fetch(MIRROR + name, None)
            mirror_rows[f.get("path")] = s
    ok = lambda d: sum(1 for v in d.values() if v in (200, 402))  # noqa: E731
    return {
        "at": at,
        "what": "published artifacts reachable by a plain Python standard-library HTTP client, "
                "counted separately for the origin and for the mirror that was the stated remedy",
        "value": {
            "origin_reachable": ok(origin), "origin_of": len(origin),
            "origin_statuses": origin,
            "mirror_reachable": ok(mirror_rows), "mirror_of": len(mirror_rows),
            "mirror_manifest_as_of": manifest_as_of,
        },
        "unit": "URLs answering 200 or 402, of URLs requested",
        "method": "urllib.request with NO User-Agent override, one request per URL, 402 counted "
                  "as reachable. Same rule as /interop/machine-reachability-2026-09-17.json so the "
                  "two readings are comparable. The mirror list is the mirror's own manifest, not a "
                  "list chosen here.",
        "source": ORIGIN_URLS + [MIRROR + "MIRROR-MANIFEST.json"],
        "state": "MEASURED",
        "by": "this estate, using only bytes any reader can fetch",
    }


PROBES = {
    "FR-2026-0923-01": probe_mill_jobs,
    "FR-2026-0923-02": probe_board_attestation,
    "FR-2026-0923-03": probe_machine_reachability,
}


# ─────────────────────────────────────────────────────────────────────────────────────────
# The receipts. Before-measurements are quoted from artifacts that already existed; after-
# measurements come from the frozen probe file so the chain is stable between runs.
# ─────────────────────────────────────────────────────────────────────────────────────────

def receipts(after: dict) -> list[dict]:
    def a(rid):
        m = after.get(rid)
        if not m:
            return {"at": None, "what": "not yet measured", "value": None, "unit": None,
                    "method": "run fix_receipts.py --measure", "source": ["(none)"],
                    "state": "UNMEASURED", "by": None}
        return m

    return [
        {
            "receipt_id": "FR-2026-0923-01",
            "observed_at": "2026-09-23T05:35:00Z",
            "supersedes": None,
            "fault": {
                "ref": [
                    "https://councilof.ai/api/corrections#C-2026-0922-02",
                    "/workspace/lanes/logs/mill-hourly.log line 19 (2026-09-23T04:10:35Z)",
                    "/workspace/banks-all/gspc-jail.jsonl.reverted-20260923T042152Z",
                ],
                "summary":
                    "The frozen bank behind the jail axis reverted on the measurement machine to "
                    "the 41-row placeholder file (sha256 f0f31f9a556266ce6f06660440b5ff819a19ee0b"
                    "7801d72e78020a1ceda3a66e) that correction C-2026-0922-02 had ruled out the "
                    "day before. The digest gate that correction installed did its job and halted "
                    "the hourly slice 20260923T04 before a single job was generated, so the "
                    "measurement engine produced nothing.",
                "first_observed_at": "2026-09-23T04:10:35Z",
                "source": "this estate — the gate C-2026-0922-02 installed, in the engine's own log",
                "scope_note":
                    "Scoped to the digest gate: did the reverted bytes stop halting the slice. It "
                    "is NOT scoped to 'the engine resumed producing measurements' — see residual. "
                    "A receipt must not be read wider than the quantity it measured.",
            },
            "change": {
                "kind": "OPERATIONAL",
                "ref": [
                    "/workspace/banks-all/gspc-jail.jsonl.reverted-20260923T042152Z (the displaced file, kept)",
                    "/workspace/banks-all/gspc-jail-sandbox-escape-20260922.jsonl (the published bytes, same digest)",
                ],
                "at": "2026-09-23T04:21:52Z",
                "by": "this estate, on the measurement machine",
                "note":
                    "No commit and no deploy: a file on the machine that runs the engine was moved "
                    "aside under a dated name and the goldbank bytes put back, after checking their "
                    "sha256 against the digest the gate pins. Nothing was deleted and no signed byte "
                    "was edited. This is a change, not a fix — the two readings below are the fix.",
            },
            "before": {
                "at": "2026-09-23T04:10:35Z",
                "what": "hourly slices halted by the jail bank-digest gate, and the digest of the "
                        "bank file the gate reads",
                "value": {
                    "bank_sha256": "f0f31f9a556266ce6f06660440b5ff819a19ee0b7801d72e78020a1ceda3a66e",
                    "bank_rows": 41,
                    "slice_20260923T04_jobs_generated": 0,
                    "gate_reason": "is not the goldbank samples.jsonl "
                                   "(0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a); "
                                   "place the frozen bytes first",
                },
                "unit": "jobs generated; sha256; rows",
                "method": "the engine's own hourly log line for slice 20260923T04, and sha256 plus "
                          "line count of the displaced file it kept",
                "source": ["/workspace/lanes/logs/mill-hourly.log",
                           "/workspace/banks-all/gspc-jail.jsonl.reverted-20260923T042152Z"],
                "state": "MEASURED",
                "by": "this estate, on the machine that runs the engine",
            },
            "after": a("FR-2026-0923-01"),
            "expected_direction":
                "the gate's halt reason had to stop appearing and job generation had to go from 0 "
                "to the full slice of 14 pinned jobs",
            "verdict": "VERIFIED_FIX",
            "verdict_rule":
                "Before, slice 20260923T04 generated 0 jobs and the log names the bank-digest gate "
                "as the reason; after the restore the same slice generated 14 pinned jobs at "
                "04:57:48Z and slice 20260923T05 generated 14 more at 05:10:06Z, with the gate's "
                "reason absent from every line since, and the bank file now hashing to the digest "
                "the gate pins over 71 rows rather than 41. Two readings, opposite states, in the "
                "direction named before the second was taken.",
            "corrections_ref": {
                "state": "DRAFT_IN_APPROVE_QUEUE",
                "id": "D-FIX-2026-0923-01",
                "url": None,
                "note":
                    "The underlying fault is published as C-2026-0922-02. This is its recurrence the "
                    "next morning, which is a new fact about our own history and is drafted to the "
                    "owner's approve-queue at council-os/corrections-drafts/. Nothing is published "
                    "from this lane; only the owner promotes a draft.",
            },
            "residual": {
                "summary":
                    "The engine did NOT resume producing measurements. Both slices since the restore "
                    "halt for a different and unrelated reason — free space on the machine — and no "
                    "signed measurement card has been produced since 2026-09-23T03:24:19Z. Anyone "
                    "repeating the sentence 'the engine resumed' would be saying something this "
                    "receipt did not measure and that the log contradicts.",
                "evidence": [
                    "/workspace/lanes/logs/mill-hourly.log: 04:57:48Z 20260923T04 HALT low disk 7980908544",
                    "/workspace/lanes/logs/mill-hourly.log: 05:10:06Z 20260923T05 HALT low disk 7306743808",
                ],
            },
            "not_established": [
                "That the restored bank is correct. The digest matches the published goldbank; that "
                "is custody of bytes, not a statement that the bank measures what it claims.",
                "That the engine is working. It is not: see residual.",
                "That this cannot recur. The gate caught the reversion but nothing yet prevents it, "
                "and the cause of the reversion is not established here.",
            ],
        },

        {
            "receipt_id": "FR-2026-0923-02",
            "observed_at": "2026-09-23T05:35:00Z",
            "supersedes": None,
            "fault": {
                "ref": [
                    "https://councilof.ai/api/corrections#C-2026-0920-01",
                    "evidence/reconciliation-2026-09-20/reconciliation-report.json (RECON-2026-0920-01)",
                ],
                "summary":
                    "The site_attestation on GET /api/gspc did not verify under its own published "
                    "preimage rule. Two helper functions returned an own property set to undefined "
                    "on the eleven axes whose leader is withheld; the signer's canonicaliser emitted "
                    "that literally while the serializer dropped the key, so the signed bytes could "
                    "not be reconstructed from the served bytes by anybody. For a relying party that "
                    "is an unverifiable attestation, whatever the cause.",
                "first_observed_at": "2026-09-20T01:52:00Z",
                "source":
                    "an outside reconciliation session working only from served bytes — not from a "
                    "test of ours, which is the part worth saying out loud",
                "scope_note":
                    "Scoped to exactly what the fault was: can the attestation be verified from the "
                    "bytes the site serves, by someone with nothing but the payload and the DID "
                    "document. Not scoped to whether the board's numbers are right.",
            },
            "change": {
                "kind": "COMMIT",
                "ref": [
                    "1cf293748 fix(gspc): site_attestation unverifiable — leader:undefined breaks "
                    "signed preimage (RECON-2026-0920-01) (#2657)",
                    "05d3d2635 corrections: C-2026-0920-01 (#2658)",
                ],
                "at": "2026-09-20",
                "by": "this estate",
                "note":
                    "The withheld-leader key is omitted instead of set to undefined, so the served "
                    "bytes and the signed bytes are the same bytes. The commit landing is not the "
                    "fix; the deployed payload verifying is.",
            },
            "before": {
                "at": "2026-09-20T01:42:58Z",
                "what": "preimage variants of GET /api/gspc that verify its site_attestation under "
                        "the published key, computed from the bytes the site served",
                "value": {
                    "verifying_variants": 0,
                    "variants_tried": 11,
                    "independent_implementations": 2,
                    "control": "the same payload's living_stamp verified under the same key and the "
                               "same canonicaliser, so the instrument was able to return a pass",
                    "served_body_sha256_prefix": "9699081c",
                },
                "unit": "preimage variants that verify, of variants tried",
                "method":
                    "eleven preimage variants (payload minus the attestation; envelope-blanked; "
                    "living_stamp drop-sets; pretty-printed) across two independent implementations "
                    "— Node with the edge canonicaliser copied verbatim, and Python with "
                    "ensure_ascii both ways. Recorded in the evidence bundle, not in prose.",
                "source": ["evidence/reconciliation-2026-09-20/reconciliation-report.json"],
                "state": "MEASURED",
                "by": "an outside reconciliation session, from served bytes only",
            },
            "after": a("FR-2026-0923-02"),
            "expected_direction":
                "the count of verifying preimage variants had to go from 0 to at least 1, and it had "
                "to be the variant the published rule names — while the deliberately wrong variant "
                "kept failing, or the check would not be discriminating",
            "verdict": "VERIFIED_FIX",
            "verdict_rule":
                "Before: 0 of 11 preimage variants verified, agreed by two independent "
                "implementations. After: the variant the payload's own sig_input names verifies "
                "under the #board-attestation-1 key fetched from the DID document, and the "
                "ensure_ascii=True control still fails — so the check can distinguish a pass from a "
                "fail. Both readings were taken from bytes a stranger can fetch, which is the whole "
                "point of this particular fault.",
            "corrections_ref": {
                "state": "PUBLISHED",
                "id": "C-2026-0920-01",
                "url": "https://councilof.ai/api/corrections",
                "note":
                    "The entry's own closing line said the live payload stayed unverifiable until a "
                    "deploy served the change. This receipt is the reading that says a deploy did.",
            },
            "residual": {
                "summary":
                    "One key signs the board and the cards. A verifying signature proves custody of "
                    "those bytes by whoever holds that key; it is not independence, and it is not a "
                    "statement that the measurements underneath are right. Separately, the "
                    "attestation covers this snapshot as published — it is not a re-measurement, and "
                    "the payload says so itself.",
                "evidence": [
                    "https://councilof.ai/api/gspc -> site_attestation.attests",
                    "evidence/reconciliation-2026-09-20/reconciliation-report.json -> distinct_signing_keys: 1",
                ],
            },
            "not_established": [
                "That any number on the board is correct. This receipt is about bytes and a "
                "signature, not about measurement quality.",
                "That the attestation verified continuously between the deploy and this reading. It "
                "was read once, at the time stated.",
                "That the signing key is still authorised. A verifying signature says nothing about "
                "revocation; that is a separate published caveat (C-2026-0902-10).",
            ],
        },

        {
            "receipt_id": "FR-2026-0923-03",
            "observed_at": "2026-09-23T05:35:00Z",
            "supersedes": None,
            "fault": {
                "ref": [
                    "https://councilof.ai/api/corrections#C-2026-0917-02",
                    "https://councilof.ai/interop/machine-reachability-2026-09-17.json",
                ],
                "summary":
                    "Every public surface the estate serves answered HTTP 403 to a plain "
                    "standard-library HTTP client while answering a browser normally. Measured on "
                    "2026-09-17: 21 of 21 published URLs, including the DID document, the agent "
                    "card, the payment-rail descriptor, robots.txt and llms.txt — five files that "
                    "exist only for machines. We had told correspondents in writing that they could "
                    "fetch our evidence and check it without our help. For anyone using a standard "
                    "client that was not true.",
                "first_observed_at": "2026-09-17T04:50:00Z",
                "source":
                    "an external agent correspondent who tried the payable door and wrote to tell us",
                "scope_note":
                    "Two quantities are kept apart on purpose: whether the ORIGIN answers a plain "
                    "client (the fault), and whether the MIRROR does (the stated remedy). Merging "
                    "them would be the exact move that turns a partial fix into a claimed one.",
            },
            "change": {
                "kind": "PUBLICATION",
                "ref": [
                    "https://councilof.ai/interop/machine-reachability-2026-09-17.json",
                    "scripts/machine_reachability.py",
                    "https://huggingface.co/datasets/csoai/councilof-ai-mirror",
                ],
                "at": "2026-09-17",
                "by": "this estate",
                "note":
                    "The remedy was to publish the measurement and mirror the twelve artifacts a "
                    "stranger most needs to a host that does serve plain clients. The zone setting "
                    "that causes the refusal is a dashboard control no credential this lane holds "
                    "can reach, and the correction records it as the owner's action.",
            },
            "before": {
                "at": "2026-09-17T03:44:18Z",
                "what": "published artifacts reachable by a plain Python standard-library HTTP client",
                "value": {"origin_reachable": 0, "origin_of": 21,
                          "origin_state_published": "HUMAN_ONLY on 21 of 21",
                          "mirror_reachable": None, "mirror_of": None,
                          "mirror_note": "no mirror existed at this reading"},
                "unit": "URLs answering 200 or 402, of URLs requested",
                "method":
                    "two requests per URL from one network — a Python standard-library client with no "
                    "User-Agent override, and the same request carrying a browser User-Agent. 402 "
                    "counted as reachable. Published as a dated artifact with its own totals.",
                "source": ["https://councilof.ai/interop/machine-reachability-2026-09-17.json"],
                "state": "MEASURED",
                "by": "this estate, after an external report",
            },
            "after": a("FR-2026-0923-03"),
            "expected_direction":
                "for the remedy to have held, the mirror had to answer a plain client on all twelve "
                "artifacts its own manifest lists. Nothing was expected to change at the origin, "
                "because nothing in the remedy touched the origin.",
            "verdict": "PARTIAL",
            "verdict_rule":
                "The stated remedy is measurably working and the fault it addresses is measurably "
                "still present. Every artifact the mirror's own manifest lists answers a plain "
                "standard-library client, while the origin still refuses one on every URL tried, "
                "including the DID document on both apexes. A fix that routes around a fault has "
                "not closed it, and a single merged number would have hidden which of the two this "
                "is. PARTIAL is the whole reason the vocabulary has four words.",
            "corrections_ref": {
                "state": "PUBLISHED",
                "id": "C-2026-0917-02",
                "url": "https://councilof.ai/api/corrections",
                "note":
                    "The entry already names the zone control as the owner's action. This receipt "
                    "adds the thing the entry could not: a later reading showing which half moved.",
            },
            "residual": {
                "summary":
                    "The origin refuses plain clients today, six days after the fault was published. "
                    "The mirror is a copy and lags its source — its manifest is stamped hours behind "
                    "the live surfaces — and the mirror itself says the origin wins on any "
                    "disagreement. So a machine reader can reach our evidence, but not necessarily "
                    "the current bytes of it, and not at the address we publish.",
                "evidence": [
                    "the after-measurement's origin_statuses field, every entry 403",
                    "the after-measurement's mirror_manifest_as_of field",
                    "the mirror's MIRROR-MANIFEST.json 'authoritative' field",
                ],
            },
            "not_established": [
                "That the origin's refusal is unchanged in cause. Only the effect was re-measured.",
                "That the twelve mirrored artifacts are the right twelve, or enough. The list is the "
                "mirror's own; this receipt did not judge it.",
                "That the mirrored bytes match the live bytes. Reachability was measured; agreement "
                "was not.",
            ],
        },
    ]


GENESIS = {
    "schema": SCHEMA_ID,
    "chain_id": CHAIN_ID,
    "seq": 0,
    "kind": "GENESIS",
    "observed_at": "2026-09-23T05:35:00Z",
    "prev_hash": ZERO,
    "contents": {
        "what": "Fix receipts: a signed-measurement estate proving, in public, that its own "
                "fixes held — or that they did not.",
        "why": "Red-team tooling finds breaks and published taxonomies name their class; the step "
               "after, measuring the same thing again once a remedy lands, is the one that is "
               "rarely a product. This estate already runs both halves daily, so the receipt is a "
               "join of two things it already has rather than a new claim.",
        "scope": "OUR OWN faults only. No receipt here is about another organisation's system, no "
                 "remedy is sold, and nothing in this chain is a conformity mark or an endorsement "
                 "by anyone. No organisation has reviewed or approved it.",
        "vocabulary": list(VERDICTS),
        "unverifiable_is_first_class": "Most fixes cannot be measured. A receipt that says so is "
                                       "doing its job; one that hides it is the defect this "
                                       "artifact exists to avoid.",
        "digest_rule": "state_digest = sha256(json.dumps(link minus state_digest, sort_keys=True, "
                       "separators=(',',':'), ensure_ascii=True))",
        "license": "CC-BY-4.0",
        "publisher": "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
    },
}


def build(after: dict) -> list[dict]:
    links = [dict(GENESIS)]
    links[0]["state_digest"] = digest_of(links[0])
    for i, r in enumerate(receipts(after), start=1):
        link = {"schema": SCHEMA_ID, "chain_id": CHAIN_ID, "seq": i, "kind": "FIX_RECEIPT",
                "prev_hash": links[-1]["state_digest"]}
        link.update(r)
        link["state_digest"] = digest_of(link)
        links.append(link)
    return links


# ─────────────────────────────────────────────────────────────────────────────────────────
# verification
# ─────────────────────────────────────────────────────────────────────────────────────────

def verify(links: list[dict]) -> list[str]:
    """Return a list of failures. Empty list means every check passed."""
    bad: list[str] = []
    if not links:
        return ["empty chain"]
    schema = json.load(open(SCHEMA)) if os.path.exists(SCHEMA) else None
    required = set(schema["required"]) if schema else set()
    allowed = set(schema["properties"]) if schema else set()

    for i, e in enumerate(links):
        w = "seq %s (%s)" % (e.get("seq"), e.get("receipt_id", e.get("kind")))
        if e.get("schema") != SCHEMA_ID:
            bad.append("%s: wrong schema %r" % (w, e.get("schema")))
        if e.get("seq") != i:
            bad.append("%s: seq is not its position in the file" % w)
        want = ZERO if i == 0 else links[i - 1].get("state_digest")
        if e.get("prev_hash") != want:
            bad.append("%s: prev_hash does not carry the previous link's state_digest" % w)
        if e.get("state_digest") != digest_of(e):
            bad.append("%s: state_digest does not match this link's own bytes" % w)
        if allowed:
            for k in e:
                if k not in allowed:
                    bad.append("%s: field %r is not in the schema" % (w, k))
        if e.get("kind") == "GENESIS":
            continue
        for k in required:
            if k not in e:
                bad.append("%s: missing required field %r" % (w, k))
        v = e.get("verdict")
        if v not in VERDICTS:
            bad.append("%s: verdict %r is outside the closed vocabulary" % (w, v))
        for side in ("before", "after"):
            m = e.get(side) or {}
            if m.get("state") not in MEAS_STATES:
                bad.append("%s: %s.state %r is not a measurement state" % (w, side, m.get("state")))
            if m.get("state") != "MEASURED" and m.get("value") is not None:
                bad.append("%s: %s carries a value while not MEASURED" % (w, side))
        # The rule the whole artifact exists for.
        both = (e.get("before", {}).get("state") == "MEASURED"
                and e.get("after", {}).get("state") == "MEASURED")
        if v == "VERIFIED_FIX" and not both:
            bad.append("%s: VERIFIED_FIX without two MEASURED readings — a landed change is not a fix" % w)
        if v in ("VERIFIED_FIX", "FIX_FAILED", "PARTIAL") and not both:
            bad.append("%s: %s needs two MEASURED readings; use UNVERIFIABLE" % (w, v))
        if both and v == "UNVERIFIABLE":
            bad.append("%s: two MEASURED readings but verdict UNVERIFIABLE — say what they show" % w)
        if not (e.get("verdict_rule") or "").strip():
            bad.append("%s: no verdict_rule" % w)
        if not e.get("not_established"):
            bad.append("%s: not_established is empty" % w)
        cs = (e.get("corrections_ref") or {}).get("state")
        if cs not in ("PUBLISHED", "DRAFT_IN_APPROVE_QUEUE", "NONE"):
            bad.append("%s: corrections_ref.state %r is not one of the three" % (w, cs))
    return bad


def read_chain(path: str = CHAIN) -> list[dict]:
    with open(path, encoding="utf-8") as fh:
        return [json.loads(ln) for ln in fh if ln.strip()]


def selftest() -> int:
    """A checker that cannot fail is not a checker. Plant each break and require a catch."""
    base = build({rid: {"at": "2026-09-23T05:35:00Z", "what": "x", "value": 1, "unit": None,
                        "method": "m", "source": ["s"], "state": "MEASURED", "by": "t"}
                  for rid in PROBES})
    checks = []

    ok_empty = verify(base)
    checks.append(("a clean chain passes", ok_empty == [], ok_empty))

    t = [json.loads(json.dumps(e)) for e in base]
    t[2]["fault"]["summary"] = t[2]["fault"]["summary"] + " (silently edited)"
    checks.append(("an edited receipt breaks its own digest",
                   any("state_digest" in f for f in verify(t)), verify(t)))

    t = [json.loads(json.dumps(e)) for e in base]
    del t[2]
    for i, e in enumerate(t):
        e["seq"] = i
    checks.append(("a removed receipt breaks the next prev_hash",
                   any("prev_hash" in f for f in verify(t)), verify(t)))

    t = [json.loads(json.dumps(e)) for e in base]
    t[1], t[2] = t[2], t[1]
    t[1]["seq"], t[2]["seq"] = 1, 2
    checks.append(("reordered receipts are caught",
                   verify(t) != [], verify(t)))

    t = [json.loads(json.dumps(e)) for e in base]
    t[1]["after"] = {"at": None, "what": "x", "value": None, "unit": None, "method": "m",
                     "source": ["s"], "state": "UNMEASURED", "by": None}
    t[1]["state_digest"] = digest_of(t[1])
    t[2]["prev_hash"] = t[1]["state_digest"]
    t[2]["state_digest"] = digest_of(t[2])
    t[3]["prev_hash"] = t[2]["state_digest"]
    t[3]["state_digest"] = digest_of(t[3])
    checks.append(("VERIFIED_FIX with only one reading is refused",
                   any("VERIFIED_FIX without two MEASURED" in f for f in verify(t)), verify(t)))

    t = [json.loads(json.dumps(e)) for e in base]
    t[1]["verdict"] = "PASSED"
    t[1]["state_digest"] = digest_of(t[1])
    t[2]["prev_hash"] = t[1]["state_digest"]
    t[2]["state_digest"] = digest_of(t[2])
    t[3]["prev_hash"] = t[2]["state_digest"]
    t[3]["state_digest"] = digest_of(t[3])
    checks.append(("a verdict outside the vocabulary is refused",
                   any("closed vocabulary" in f for f in verify(t)), verify(t)))

    rc = 0
    for name, passed, detail in checks:
        print(("  PASS  " if passed else "  FAIL  ") + name)
        if not passed:
            rc = 1
            print("        " + json.dumps(detail)[:300])
    print("selftest: %d checks, %s" % (len(checks), "all passed" if rc == 0 else "FAILURES"))
    return rc


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--measure", action="store_true", help="re-take the after-measurements live")
    p.add_argument("--build", action="store_true", help="write the chain from the frozen readings")
    p.add_argument("--verify", action="store_true", help="check the published chain")
    p.add_argument("--selftest", action="store_true", help="prove the checker can fail")
    args = p.parse_args()
    if not any(vars(args).values()):
        p.print_help()
        return 0

    if args.selftest:
        return selftest()

    if args.measure:
        out = {"schema": "csoai.fix-receipt-measurements/0.1", "taken_at": utcnow(),
               "note": "After-measurements, frozen. Re-run scripts/fix_receipts.py --measure to "
                       "take them again; a later run is a NEW reading and supersedes nothing.",
               "license": "CC-BY-4.0", "measurements": {}}
        for rid, fn in PROBES.items():
            print("measuring %s ..." % rid, file=sys.stderr)
            out["measurements"][rid] = fn()
        os.makedirs(OUT_DIR, exist_ok=True)
        with open(FROZEN, "w", encoding="utf-8") as fh:
            json.dump(out, fh, indent=1, sort_keys=True, ensure_ascii=False)
            fh.write("\n")
        print("wrote %s" % FROZEN)

    if args.build:
        after = {}
        if os.path.exists(FROZEN):
            after = json.load(open(FROZEN, encoding="utf-8")).get("measurements", {})
        links = build(after)
        os.makedirs(OUT_DIR, exist_ok=True)
        with open(CHAIN, "w", encoding="utf-8") as fh:
            for e in links:
                fh.write(json.dumps(e, sort_keys=True, ensure_ascii=False) + "\n")
        print("wrote %s (%d links)" % (CHAIN, len(links)))

    if args.verify:
        links = read_chain()
        bad = verify(links)
        counts = {}
        for e in links:
            if e.get("verdict"):
                counts[e["verdict"]] = counts.get(e["verdict"], 0) + 1
        print("%d links, %d receipts, verdicts %s" %
              (len(links), len(links) - 1, json.dumps(counts, sort_keys=True)))
        if bad:
            for f in bad:
                print("  FAIL  " + f)
            return 1
        print("  PASS  every link's digest matches its own bytes and carries the previous one")
        print("  PASS  every receipt is inside the schema and the closed verdict vocabulary")
        print("  PASS  no VERIFIED_FIX rests on fewer than two measurements")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
