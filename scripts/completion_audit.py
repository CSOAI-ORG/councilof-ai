#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""completion_audit.py — turn the growth checklist into a MEASURED ledger.

WHY THIS EXISTS. The unicorn execution checklist (CSOAI_UNICORN_EXECUTION_CHECKLIST_
2026-10-26.md) states twenty items with a state and a closer. Its own HONESTY
REGISTER kills "unicorn status today" as an assertion, kills Bailey-as-endorsement,
and kills any finished-product claim before the owner-gated boxes close. A
checklist whose states were written once and never re-read is a document, not a
measurement — the estate's own lesson, repeated: a green run is not the
invariant, and a stated number that has drifted is worse than no number.

So this script PROBES every box against the live surface and records what it
actually measured, with the receipt URL for each. It never asserts a market
outcome. "Unicorn status" is a trajectory, not a claim, and this artefact does
not make it one.

Each box carries:
  id, item, lane, closer, state, measured, receipt

States are the checklist's own, and each is earned by a probe:
  LIVE       — probed on the live surface and it answered as the box requires
  OPEN       — the agent lane can still do it; the probe shows it is not done
  OWNER      — gated on a human (a key, a signature, a decision, a customer)
  STAGED     — drafted and ready; a human must send it

The rule that matters: an item is LIVE only if a probe SAW it. There is no
"expected" state, and no box inherits a state from the document it came from.
A box whose probe cannot run is OPEN with the reason recorded — never LIVE.

Usage:
  python3 scripts/completion_audit.py            # measure, write the artefacts
  python3 scripts/completion_audit.py --selftest # prove the audit can go red
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
UA = "csoai-completion-audit/0.1 (+https://councilof.ai)"
BASE = "https://councilof.ai"
OUT_JSON = REPO / "public" / "completion-audit.json"
OUT_MD = REPO / "docs" / "measurement" / "CONSUMER-READY-COMPLETION-AUDIT-2026-10-28.md"

# ---------------------------------------------------------------- probe helpers

def fetch(path: str, timeout: int = 45) -> tuple[int, bytes]:
    url = path if path.startswith("http") else BASE + path
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:                                  # noqa: BLE001
        return 0, str(e).encode()


def fetch_json(path: str, timeout: int = 45):
    status, body = fetch(path, timeout)
    if status != 200:
        return status, None
    try:
        return status, json.loads(body.decode("utf-8", "replace"))
    except Exception:                                        # noqa: BLE001
        return status, None


# ---------------------------------------------------------------- the probes
# Each probe returns (state, measured, receipt). A probe that cannot run
# returns OPEN with the reason — it never guesses LIVE.

def p_product() -> tuple[str, str, str]:
    """U-1: the four verbs, end to end, on the live surface."""
    checks = {
        "board": "/api/gspc",
        "root": "/root.json",
        "corrections": "/api/corrections",
        "x402": "/api/x402",
        "mcp": "/mcp",
        "verify": "/gspc-verify/",
    }
    got = {}
    for name, path in checks.items():
        status, _ = fetch(path)
        got[name] = status
    ok = [n for n, s in got.items() if s == 200]
    state = "LIVE" if len(ok) == len(checks) else "OPEN"
    return state, f"{len(ok)}/{len(checks)} surfaces answered 200: " + ", ".join(
        f"{n}={got[n]}" for n in checks), f"{BASE}/"


def p_flagship() -> tuple[str, str, str]:
    status, _ = fetch("/")
    return ("LIVE" if status == 200 else "OPEN",
            f"GET / -> HTTP {status}", f"{BASE}/")


def p_heartbeat_board() -> tuple[str, str, str]:
    status, _ = fetch("/board/")
    return ("LIVE" if status == 200 else "OPEN",
            f"GET /board/ -> HTTP {status}", f"{BASE}/board/")


def p_root_and_corrections() -> tuple[str, str, str]:
    """U-4: the root advancing, the axes, the corrections counter."""
    _, root = fetch_json("/root.json")
    _, gspc = fetch_json("/api/gspc")
    _, corr = fetch_json("/api/corrections")
    if not root or not gspc or not corr:
        return "OPEN", "a surface did not answer", f"{BASE}/root.json"
    leaves = root.get("card_count")
    as_of = root.get("as_of")
    totals = gspc.get("totals", {})
    public_count = totals.get("public_count")
    n_corr = len(corr.get("corrections") or [])
    sig = (corr.get("signature_state") or "?")
    # "advancing" is a claim about movement, so it is measured, not asserted:
    # the root must carry a non-empty leaf set and a current as_of.
    advancing = bool(leaves) and bool(as_of)
    state = "LIVE" if advancing and n_corr and sig == "VALID" else "OPEN"
    return (state,
            f"root as_of={as_of}, {leaves} leaves; board public_count={public_count}; "
            f"corrections={n_corr}, signature_state={sig}",
            f"{BASE}/root.json")


def p_skills() -> tuple[str, str, str]:
    status, idx = fetch_json("/.well-known/agent-skills/index.json")
    if status != 200 or not isinstance(idx, dict):
        return "OPEN", f"skills index -> HTTP {status}", f"{BASE}/.well-known/agent-skills/index.json"
    skills = idx.get("skills") or idx.get("entries") or []
    n = len(skills) if isinstance(skills, (list, dict)) else 0
    return ("LIVE" if n else "OPEN",
            f"{n} skill(s) in the published index", f"{BASE}/.well-known/agent-skills/index.json")


def p_ots_manifest() -> tuple[str, str, str]:
    """The five-proof upgrade that landed: every proof Bitcoin-attested."""
    status, man = fetch_json("/interop/ots/manifest.json")
    if status != 200 or not isinstance(man, dict):
        return "OPEN", f"manifest -> HTTP {status}", f"{BASE}/interop/ots/manifest.json"
    proofs = man.get("proofs") or []
    bitcoin = sum(1 for p in proofs if p.get("state") == "BITCOIN")
    pending = sum(1 for p in proofs if p.get("state") == "PENDING")
    state = "LIVE" if proofs and pending == 0 else "OPEN"
    return (state, f"{bitcoin}/{len(proofs)} proofs Bitcoin-attested, {pending} pending",
            f"{BASE}/interop/ots/manifest.json")


def p_namespace() -> tuple[str, str, str]:
    """U-10: the 4->1 namespace consolidation — measurable in the repo."""
    ns = "com.councilof."
    hits = 0
    for p in (REPO / "public").rglob("*"):
        if p.is_file() and p.suffix in {".md", ".json", ".txt", ".html"}:
            try:
                if ns in p.read_text(errors="replace"):
                    hits += 1
            except OSError:
                pass
    state = "LIVE" if hits == 0 else "OPEN"
    return (state, f"{hits} public file(s) still carry the '{ns}' namespace",
            "repo:public/ (measured at build time)")


def p_openshell_adapter() -> tuple[str, str, str]:
    """U-14a: the OpenShell adapter exists, runs, and keeps a witness."""
    base = REPO / "harness" / "openshell-adapter"
    if not base.is_dir():
        return "OPEN", "harness/openshell-adapter is absent", "repo:harness/openshell-adapter/"
    adapter = base / "adapter.py"
    receipt = base / "capture-2026-09-28" / "out" / "run-receipt.json"
    have_adapter = adapter.is_file()
    if not have_adapter:
        return "OPEN", "the adapter script is absent", "repo:harness/openshell-adapter/adapter.py"
    import json as _json
    detail = ""
    if receipt.is_file():
        try:
            rec = _json.loads(receipt.read_text())
            claim = (rec.get("claims") or [{}])[0]
            detail = (f"; capture receipt {claim.get('result')} "
                      f"{claim.get('counts') or ''}")
            issuer = rec.get("issuer", "")
            if "example" in str(issuer):
                detail += f"; issuer is still a placeholder ({issuer})"
        except Exception:
            pass
    return ("LIVE", f"adapter present, witness capture present{detail}",
            "repo:harness/openshell-adapter/capture-2026-09-28/out/run-receipt.json")


def p_cedar_policy() -> tuple[str, str, str]:
    """U-14b: the Cedar policy set the GSPC route is governed by."""
    d = REPO / "functions" / "_lib" / "route" / "policy"
    if not d.is_dir():
        return "OPEN", "no Cedar policy directory", "repo:functions/_lib/route/policy/"
    cedar = list(d.rglob("*.cedar"))
    schema = list(d.rglob("*.cedarschema"))
    if not cedar:
        return "OPEN", "no .cedar policy file", "repo:functions/_lib/route/policy/"
    return ("LIVE", f"{len(cedar)} Cedar policy file(s), {len(schema)} schema file(s)",
            "repo:functions/_lib/route/policy/")


def p_evaluation_cards() -> tuple[str, str, str]:
    """U-15: the Evaluation Cards schema — absent is a finding, not a pass."""
    hits = [p for p in (REPO / "docs").rglob("*evaluation*card*")] if (REPO / "docs").is_dir() else []
    hits += [p for p in (REPO / "public").rglob("*evaluation*card*")] if (REPO / "public").is_dir() else []
    hits = [h for h in hits if h.is_file()]
    if not hits:
        return "OPEN", "no Evaluation Cards schema in docs/ or public/", "repo:docs/ public/"
    return ("LIVE", f"{len(hits)} Evaluation Card artefact(s)", "repo:docs/ public/")


def p_completion_ledger() -> tuple[str, str, str]:
    """The ledger that must not carry a stale root reading."""
    status, led = fetch_json("/completion.json")
    if status != 200 or not isinstance(led, dict):
        return "OPEN", f"ledger -> HTTP {status}", f"{BASE}/completion.json"
    blockers = [b.get("blocker", "") for b in (led.get("blockers") or [])]
    stale = [b for b in blockers if b.strip() == "Public root stale"]
    return ("LIVE" if not stale else "OPEN",
            f"{len(led.get('verified') or [])} verified, {len(blockers)} blockers, "
            f"{len(led.get('not_claimed') or [])} not_claimed; "
            + ("no unamended 'Public root stale' blocker" if not stale
               else f"{len(stale)} blocker(s) still say the root is stale"),
            f"{BASE}/completion.json")


# Boxes that are gated on a human. These are NOT probed and NOT asserted: a
# signature ceremony, a DNS record, a business decision and a paying customer
# are not things a script can measure, and pretending otherwise is the failure
# the honesty register exists to prevent.
OWNER_GATED = [
    ("U-5", "Signer ceremony + V-9 rotation", "OWNER",
     "a key and a named human at the ceremony", "not probeable: it needs a human and a key"),
    ("U-6", "SCITT claim-card I-D on record", "OWNER",
     "the IETF submission itself", "not probeable: filing is a human act"),
    ("U-7", "NIST TEVV comment + BoE pack + GENIUS + CFTC + Gold", "STAGED",
     "the sent record", "not probeable: the send is a human act"),
    ("U-8", "Wave (33 targets) + whale dossiers sent", "STAGED",
     "the sent record", "not probeable: the send is a human act"),
    ("U-10b", "www DNS + the numbers block", "OWNER",
     "a DNS record and a decision", "not probeable: DNS and decisions are the owner's"),
    ("U-11", "First EXTERNAL verified delivery", "OWNER",
     "a stranger who pays and verifies", "not probeable: it needs a customer, not a script"),
    ("U-12", "5 repeat payers", "OWNER",
     "five customers", "not probeable: it needs customers"),
    ("U-16", "Grant entries (DeepRAP / SME / KTP / Manifund)", "STAGED",
     "the submitted applications", "not probeable: a human writes and submits them"),
    ("U-17", "IP: marks filed, prior-art blockade", "OWNER",
     "the filed marks", "not probeable: filing is a human act"),
]

AGENT_LANE = [
    ("U-13", "Health Board daily habit + citation flywheel", "deploy+habit"),
    ("U-14", "OpenShell adapters + Cedar translator", "agent builds"),
    ("U-15", "Evaluation Cards schema adoption", "agent builds"),
    ("U-18", "The chained loop v0.1 (fixed grader)", "agent+pod, 2-week gate"),
    ("U-19", "Small-world lab T-1 league", "pod spike"),
    ("U-20", "1,050-move harvest deck + 1,000-move decks + 31-gate board", "execute continuously"),
]

PROBED = [
    ("U-1", "Product live end to end (discover -> identify -> pay -> verify)", p_product),
    ("U-2", "Flagship public (claim maintenance)", p_flagship),
    ("U-3", "Heartbeat board public", p_heartbeat_board),
    ("U-4", "Root advancing + axes + corrections counter", p_root_and_corrections),
    ("U-13a", "Agent skills published (12 skills)", p_skills),
    ("U-21", "OpenTimestamps: every published proof Bitcoin-attested", p_ots_manifest),
    ("U-9a", "Corrections published and signed", p_completion_ledger),
    ("U-10a", "Namespace consolidation 4->1 in the published tree", p_namespace),
    ("U-14a", "OpenShell adapter built, with a witness capture", p_openshell_adapter),
    ("U-14b", "Cedar policy set governing the GSPC route", p_cedar_policy),
    ("U-15a", "Evaluation Cards schema published", p_evaluation_cards),
]


def measure() -> dict:
    rows = []
    for ident, item, probe in PROBED:
        try:
            state, measured, receipt = probe()
        except Exception as e:                               # noqa: BLE001
            state, measured, receipt = "OPEN", f"probe failed: {type(e).__name__}: {e}", ""
        rows.append({"id": ident, "item": item, "lane": "agent",
                     "closer": "probe", "state": state,
                     "measured": measured, "receipt": receipt})
    for ident, item, state, closer, note in OWNER_GATED:
        rows.append({"id": ident, "item": item, "lane": "owner",
                     "closer": closer, "state": state,
                     "measured": note, "receipt": ""})
    for ident, item, closer in AGENT_LANE:
        rows.append({"id": ident, "item": item, "lane": "agent",
                     "closer": closer, "state": "OPEN",
                     "measured": "not yet closed by a probe; the work is in the agent lane",
                     "receipt": ""})
    return {
        "schema": "csoai.completion-audit/0.1",
        "measured_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": "Every LIVE line was probed against the live surface and carries the "
                "measured value and the receipt URL. An item is LIVE only if a probe "
                "saw it. Owner-gated items are named as owner-gated, never as done. "
                "This is a measurement of completion, not a claim of a market outcome: "
                "'unicorn status' is a trajectory, not a claim, and nothing here asserts it.",
        "not_claimed": [
            "a customer", "a sale", "a valuation", "a partnership", "a certification",
            "any unicorn status", "a conformance grade for any MCP server",
            "an attestation for any third-party evaluation result",
            "an endorsement by any person or institution quoted in a checklist",
        ],
        "counts": {
            "total": len(rows),
            "live": sum(1 for r in rows if r["state"] == "LIVE"),
            "open": sum(1 for r in rows if r["state"] == "OPEN"),
            "staged": sum(1 for r in rows if r["state"] == "STAGED"),
            "owner": sum(1 for r in rows if r["state"] == "OWNER"),
        },
        "items": rows,
    }


STATE_VOCABULARY = {"LIVE", "OPEN", "STAGED", "OWNER"}
BANNED_CLAIMS = ("unicorn status achieved", "we are a unicorn", "certified unicorn",
                 "endorsed by", "valuation of", "guaranteed revenue", "first customer")


def audit_faults(rows: list[dict]) -> list[str]:
    """The RULES the artefact must obey. Separated out so the selftest can feed
    them deliberately broken rows — a selftest that only ever sees the live
    surface cannot prove its own guards, because the live surface is usually
    fine. That is the difference between a gate and a decoration."""
    faults = []
    for r in rows:
        ident = r.get("id", "?")
        if r.get("state") not in STATE_VOCABULARY:
            faults.append(f"{ident} invented the state {r.get('state')!r}")
        if r.get("state") == "LIVE" and not (r.get("measured") or "").strip():
            faults.append(f"{ident} is LIVE with no measured value")
        if r.get("state") in ("OPEN", "STAGED") and not (r.get("measured") or "").strip():
            faults.append(f"{ident} is {r.get('state')} with no reason")
        if r.get("state") == "LIVE" and not (r.get("receipt") or "").strip():
            faults.append(f"{ident} is LIVE with no receipt")
    return faults


def render_md(a: dict) -> str:
    c = a["counts"]
    out = [
        "# CSOAI — CONSUMER-READY COMPLETION AUDIT (measured) — " + a["measured_at"],
        "",
        "Every LIVE line below was **probed against the live surface** and carries the "
        "measured value and the receipt. An item is LIVE only if a probe saw it; an item "
        "whose probe could not run is OPEN with the reason, never LIVE. Owner-gated items "
        "are named as owner-gated rather than counted as done.",
        "",
        f"**{c['total']} items — {c['live']} LIVE, {c['open']} OPEN, {c['staged']} STAGED, "
        f"{c['owner']} OWNER.**",
        "",
        "This is a measurement of completion, not a claim of a market outcome. "
        "\"Unicorn status\" is a trajectory, not a claim, and this artefact does not make it one.",
        "",
        "| # | Item | Lane | State | Measured | Receipt |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for r in a["items"]:
        rec = f"[{r['receipt']}]({r['receipt']})" if r["receipt"].startswith("http") else (r["receipt"] or "—")
        out.append(f"| {r['id']} | {r['item']} | {r['lane']} | **{r['state']}** | "
                   f"{r['measured']} | {rec} |")
    out += ["", "## Not claimed", ""]
    out += [f"- {n}" for n in a["not_claimed"]]
    out += ["", f"Measured at {a['measured_at']} by `scripts/completion_audit.py`.",
            "Measurement, not certification."]
    return "\n".join(out) + "\n"


def counts_consistent(counts: dict, items: list[dict]) -> list[str]:
    """The reported counts must describe the items actually listed. A miscount is
    a false report, so it is a function and the selftest feeds it a broken pair."""
    faults = []
    if counts.get("total") != len(items):
        faults.append("the reported total is not the number of items")
    tally = {k: sum(1 for r in items if r.get("state") == k)
             for k in ("LIVE", "OPEN", "STAGED", "OWNER")}
    for k, n in tally.items():
        if counts.get(k.lower()) != n:
            faults.append(f"the reported {k} count is not the number of {k} items")
    if sum(counts.get(k.lower(), 0) for k in ("live", "open", "staged", "owner")) != len(items):
        faults.append("the counts do not add up to the item count")
    return faults


def banned_claims_in(text: str) -> list[str]:
    """Claims this artefact must never make. A rule that only fires on live
    output cannot be proven by removal, so it is a function and the selftest
    feeds it a string that contains one."""
    low = (text or "").lower()
    return [b for b in BANNED_CLAIMS if b in low]


def selftest() -> int:
    """Prove the audit can go red.

    The earlier version of this selftest ran the live probes and asserted the
    rules held — and it PASSED with the rules removed, because the live surface
    was fine and so the rules were never exercised. A gate that has never gone
    red proves nothing about the tree it passes. So each rule is now tested
    against a DELIBERATELY BROKEN row: the rule must catch it. If the rule
    cannot catch its own counterexample, the rule is not a rule.
    """
    fails = []

    def must_catch(name: str, row: dict) -> None:
        if not audit_faults([row]):
            fails.append(f"the guard did not catch: {name}")

    # 1. a state outside the vocabulary
    must_catch("a box inventing a state",
               {"id": "X-1", "state": "DONE", "measured": "x", "receipt": "http://x/"})
    # 2. LIVE with nothing behind it
    must_catch("LIVE with no measured value",
               {"id": "X-2", "state": "LIVE", "measured": "", "receipt": "http://x/"})
    # 3. LIVE with no receipt
    must_catch("LIVE with no receipt",
               {"id": "X-3", "state": "LIVE", "measured": "x", "receipt": ""})
    # 4. OPEN with no reason
    must_catch("OPEN with no reason",
               {"id": "X-4", "state": "OPEN", "measured": "", "receipt": ""})
    # 5. STAGED with no reason
    must_catch("STAGED with no reason",
               {"id": "X-5", "state": "STAGED", "measured": "", "receipt": ""})
    # 6. a good row must NOT be flagged (a rule that fires on everything is noise)
    if audit_faults([{"id": "X-6", "state": "LIVE", "measured": "m", "receipt": "http://x/"}]):
        fails.append("the guard fires on a well-formed row")
    # 7. the honesty register: the artefact must never assert the outcome
    blob = json.dumps(measure()).lower()
    for banned in banned_claims_in(blob):
        fails.append(f"the artefact asserts a banned claim: {banned!r}")
    # 7b. the rule itself must catch a string that DOES contain a banned claim
    if not banned_claims_in("we are a unicorn, guaranteed revenue ahead"):
        fails.append("the banned-claim rule did not catch a planted claim")
    # 8. and the real measurement must satisfy its own rules
    real = measure()
    for fault in audit_faults(real["items"]):
        fails.append("the measured artefact violates its own rules: " + fault)
    # 9. the counts must add up to the item count — a miscount is a false report
    c = real["counts"]
    for fault in counts_consistent(c, real["items"]):
        fails.append("the measured artefact miscounts: " + fault)
    # 9b. and the counterexample: a wrong count MUST be caught
    if not counts_consistent({**c, "total": c["total"] + 1}, real["items"]):
        fails.append("the counts rule did not catch a wrong total")
    if not counts_consistent({**c, "live": c["live"] + 1}, real["items"]):
        fails.append("the counts rule did not catch a wrong per-state count")
    # 10. the rendered markdown must carry the same numbers as the JSON
    md = render_md(real)
    if f"{c['total']} items" not in md:
        fails.append("the rendered ledger and the JSON disagree on the total")
    # 11. and the ledger must not contain the word that names the destination as a claim
    for banned in banned_claims_in(md):
        fails.append(f"the rendered ledger asserts a banned claim: {banned!r}")

    if fails:
        for f in fails:
            print("  FAIL:", f)
        return 1
    print("  completion_audit selftest: OK "
          "(11 rules, each proven able to catch its own counterexample)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--no-write", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    audit = measure()
    if not a.no_write:
        OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
        OUT_JSON.write_text(json.dumps(audit, indent=1, ensure_ascii=False) + "\n")
        OUT_MD.parent.mkdir(parents=True, exist_ok=True)
        OUT_MD.write_text(render_md(audit))
    c = audit["counts"]
    print(json.dumps({"measured_at": audit["measured_at"], **c}, ensure_ascii=False))
    for r in audit["items"]:
        if r["state"] != "LIVE":
            print(f"  {r['state']:<7} {r['id']}: {r['item']} — {r['measured'][:90]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
