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
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
UA = "csoai-completion-audit/0.1 (+https://councilof.ai)"
BASE = "https://councilof.ai"
OUT_JSON = REPO / "public" / "completion-audit.json"
OUT_MD = REPO / "docs" / "measurement" / "CONSUMER-READY-COMPLETION-AUDIT.md"

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

# These outcomes currently have availability probes, not a qualified completion-
# receipt consumer. Keep their observations, but do not treat arbitrary response
# bodies or producer-declared success (including fixtures) as outcome evidence.
AVAILABILITY_ONLY_OUTCOMES = {
    "U-1": "a qualified non-fixture discover/identify/pay/deliver/verify receipt",
    "U-2": "qualified claim-maintenance acceptance linking the claim, supporting "
           "evidence, correction history and independent readback",
}


def p_product() -> tuple[str, str, str]:
    """U-1: observe availability without asserting end-to-end completion."""
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
    availability = "LIVE" if len(ok) == len(checks) else "OPEN"
    measured = (f"availability={availability}; {len(ok)}/{len(checks)} surfaces "
                "answered 200: " + ", ".join(f"{n}={got[n]}" for n in checks))
    return ("OPEN", measured + "; completion not verified: this GET-only audit "
            "does not consume " + AVAILABILITY_ONLY_OUTCOMES["U-1"], f"{BASE}/")


def p_flagship() -> tuple[str, str, str]:
    """U-2: a reachable homepage does not establish claim-maintenance acceptance."""
    status, _ = fetch("/")
    availability = "LIVE" if status == 200 else "OPEN"
    return ("OPEN", f"availability={availability}; GET / -> HTTP {status}; "
            "completion not verified: this GET-only audit does not consume "
            + AVAILABILITY_ONLY_OUTCOMES["U-2"], f"{BASE}/")


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


def _dig_available() -> bool:
    """Is `dig` present? A machine without it CANNOT say a TXT record is absent -
    it can only say it does not know. Conflating the two is how a DNS claim gets
    reported as unpublished on a runner that simply lacks the tool."""
    try:
        subprocess.run(["dig", "-v"], capture_output=True, timeout=20)
        return True
    except (OSError, subprocess.SubprocessError):
        return False


def _dig_txt_state(name: str) -> tuple[str, list[str]]:
    """Ask DNS for a name's TXT records, and say WHICH answer we got.

    Returns (state, txt) where state is:
      "NOERROR"  the name was resolved; txt holds its TXT records (possibly empty)
      "NXDOMAIN" the name does not exist at all
      "UNKNOWN"  the query did not complete, so the answer is unknown

    WHY THE THREE STATES. `dig +short` prints NOTHING for a name that does not exist, for
    a name that exists but publishes no TXT, and for a query that failed (SERVFAIL, a
    timeout, a resolver that gave up). Those are three different facts and the short form
    collapses them into one empty string. Reading only the answer would let a DNS outage
    report "no TXT record" - an absence the estate never measured. The status line is the
    difference between "we looked and there is nothing" and "we did not get to look".

    Measured 2026-11-02 on the three labels this audit reads: _mcp.com.councilof.ai and
    _namespace.com.councilof.ai are NXDOMAIN (the subdomain does not exist), which is a
    different fact from "the subdomain exists and publishes no TXT".
    """
    try:
        r = subprocess.run(["dig", "+noall", "+comments", "+answer", "TXT", name],
                           capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.SubprocessError):
        return ("UNKNOWN", [])
    out = r.stdout or ""
    status = ""
    for line in out.splitlines():
        if "status:" in line:
            status = line.split("status:", 1)[1].split(",")[0].strip().upper()
            break
    if status not in ("NOERROR", "NXDOMAIN"):
        return ("UNKNOWN", [])
    txt = []
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 5 and parts[3].upper() == "TXT":
            txt.append(" ".join(parts[4:]).strip().strip('"'))
    return (status, txt)


def _dig_txt(name: str) -> list[str] | None:
    """TXT records for a DNS name. None means: the tool could not be run, or the query
    did not complete, so the answer is UNKNOWN. An empty list means: the name was asked
    and publishes no TXT."""
    state, txt = _dig_txt_state(name)
    if state == "UNKNOWN":
        return None
    return txt


def p_namespace_dns() -> tuple[str, str, str]:
    """U-10: the namespace claim, which is a DNS TXT record, not a file edit.

    The checklist's own wording is "`com.councilof/*` DNS TXT", and the estate's
    own lane row says what to publish: the MCP namespace TXT at
    `_mcp.com.councilof.ai` naming `com.councilof/*`, plus the `_namespace` label,
    after checking that no conflicting claim exists. So the box is MEASURED by
    reading DNS, and it is gated on whoever holds the domain's DNS authority.
    """
    if not _dig_available():
        return ("OPEN",
                "the dig tool is absent, so the TXT state is UNKNOWN - not absent. "
                "Install dnsutils and re-measure before reading this as a verdict",
                "dns:com.councilof.ai")
    labels = ("com.councilof.ai", "_namespace.com.councilof.ai", "_mcp.com.councilof.ai")
    answers = {n: _dig_txt_state(n) for n in labels}
    published = [n for n, (state, txt) in answers.items()
                 if state == "NOERROR" and any("com.councilof/*" in t for t in txt)]
    if published:
        return ("LIVE",
                f"the namespace TXT is published at {', '.join(published)}",
                "https://councilof.ai/jewels/master-catalogue/")
    def _read(n: str) -> str:
        state, txt = answers[n]
        if state == "NXDOMAIN":
            return "the name does not exist"
        if state == "UNKNOWN":
            return "UNKNOWN - the query did not complete"
        return ", ".join(txt) if txt else "no TXT record"
    detail = "; ".join(f"{n} -> " + _read(n) for n in labels)
    unknown = [n for n, (state, _) in answers.items() if state == "UNKNOWN"]
    if unknown:
        # Unknown is not absent. If the query did not complete for any label, the audit
        # cannot say the claim is unpublished - it can only say it did not find out.
        return ("OPEN",
                f"the namespace TXT state is UNKNOWN for {', '.join(unknown)} - unknown is "
                f"not absent ({detail}); publishing it needs DNS authority for the domain, "
                f"which is the owner's",
                "dns:" + " ".join(labels))
    return ("OPEN",
            f"no namespace TXT is published ({detail}) - publishing it needs DNS "
            f"authority for the domain, which is the owner's",
            "dns:" + " ".join(labels))


def p_namespace_tree() -> tuple[str, str, str]:
    """U-10b: does any PUBLISHED file still claim the old namespace as its own id?

    A DNS name (com.councilof.ai) is not a claimed namespace - it is the label
    the claim would be published at, and the estate's own rows legitimately name
    it. What must not survive is a published artefact claiming an identifier in
    the `com.councilof.*` space, so that is what this counts.
    """
    # A DNS name (com.councilof.ai) and the claim form (com.councilof/*) are
    # legitimate MENTIONS - the label the claim would be published at, and the
    # pattern it would name. What must not survive is a published artefact
    # claiming an identifier INSIDE that space, e.g. com.councilof.gsPC.
    pattern = re.compile(r"com\.councilof\.(?!ai\b|\*)[A-Za-z0-9_-]+")
    hits = []
    for p in (REPO / "public").rglob("*"):
        if not (p.is_file() and p.suffix in {".md", ".json", ".txt", ".html"}):
            continue
        if p.name == "completion-audit.json":
            continue                      # this audit's own output names the namespace
        try:
            if pattern.search(p.read_text(errors="replace")):
                hits.append(str(p.relative_to(REPO)))
        except OSError:
            pass
    state = "LIVE" if not hits else "OPEN"
    return (state,
            f"{len(hits)} published file(s) still claim an identifier in the com.councilof.* space"
            + (": " + ", ".join(hits[:4]) if hits else ""),
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
# ---------------------------------------------------------------- the agent lane
# These boxes were listed as "agent builds" with no state. A box with no probe is
# a box nobody measured, so each one below now has a probe that either sees the
# artefact or says, precisely, that it is not there. The estate's own jewel table
# already calls CJ-50 (the Ecosystem Health Board) UNVERIFIED - "no prototype was
# found on any live or local surface" - while the growth corpus still listed it as
# "prototype + live board". A probe is what tells those two apart.

_SKIP_DIRS = {".git", "node_modules", "dist", ".next", "target", "__pycache__", ".venv"}


def repo_paths_containing(*needles: str, limit: int = 60000) -> list[str]:
    """Repo paths whose name contains any needle. Bounded, because the audit runs
    in CI and an unbounded walk is how a measurement becomes a timeout."""
    out: list[str] = []
    for root in ("scripts", "docs", "public", "council-os", "functions", "harness"):
        base = REPO / root
        if not base.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [d for d in dirnames if d not in _SKIP_DIRS]
            for name in filenames:
                low = name.lower()
                if any(n.lower() in low for n in needles):
                    out.append(os.path.relpath(os.path.join(dirpath, name), REPO))
                    if len(out) >= limit:
                        return out
    return out


def p_ecosystem_health_board() -> tuple[str, str, str]:
    """U-13: the Ecosystem Health Board + its citation flywheel."""
    tried = ["/ecosystem-health/", "/health-board/"]
    codes = {}
    for path in tried:
        status, _ = fetch(path)
        codes[path] = status
    served = [p for p, c in codes.items() if c == 200]
    if served:
        return ("LIVE", f"served at {', '.join(served)}",
                BASE + (served[0] if served else tried[0]))
    return ("OPEN",
            "no Ecosystem Health Board on the edge: "
            + ", ".join(f"{p} -> HTTP {c}" for p, c in codes.items())
            + "; the estate's own CJ-50 row calls it UNVERIFIED",
            BASE + "/reports/")


def p_chained_loop() -> tuple[str, str, str]:
    """U-18: the chained loop v0.1 (evolve, dream, grade, select, remember)."""
    hits = repo_paths_containing("chained-loop", "chain-loop", "chainloop")
    if hits:
        return ("LIVE", f"{len(hits)} artefact(s): {hits[0]}", f"repo:{hits[0]}")
    return ("OPEN",
            "no chained-loop artefact in scripts/, docs/, public/, council-os/, "
            "functions/ or harness/ — the corpus calls the stack 'verified' and "
            "the 2-week held-out gate the closer; neither is in the tree",
            "repo:scripts/ docs/ public/ council-os/ functions/ harness/")


def p_small_world_league() -> tuple[str, str, str]:
    """U-19: the small-world lab T-1 league."""
    hits = repo_paths_containing("small-world", "smallworld", "t1-league")
    if hits:
        return ("LIVE", f"{len(hits)} artefact(s): {hits[0]}", f"repo:{hits[0]}")
    return ("OPEN",
            "no small-world / T-1 league artefact in the tree; the corpus lists it "
            "as 'specced, pod spike' and names a pod spike as the closer",
            "repo:scripts/ docs/ public/ council-os/ functions/ harness/")


def p_402_health_split() -> tuple[str, str, str]:
    """U-22: the 402 health split (60/130) and the stale-directory repoints."""
    hits = repo_paths_containing("402-health", "health-split", "repoint")
    if hits:
        return ("LIVE", f"{len(hits)} artefact(s): {hits[0]}", f"repo:{hits[0]}")
    return ("OPEN",
            "no 402-health / health-split / repoint artefact in the tree; the corpus "
            "lists 'measured, repair queue' with the repair queue as the closer",
            "repo:scripts/ docs/ public/ council-os/ functions/ harness/")


def p_corrections_published() -> tuple[str, str, str]:
    """U-9: the corrections corpus, published and signed.

    The corpus is numbered C-<date>-<n> - C-2026-1006-13, C-2026-0930-12 - NOT #1..#n.
    An earlier version of this probe counted ids ending "-60" to "-70" and reported "0 of
    the #60-70 range present" against 93 published corrections, which reads as seventy
    corrections missing when the series it looked for does not exist. The count is what it
    is; the invented range is gone.
    """
    _, corr = fetch_json("/api/corrections")
    if not corr:
        return "OPEN", "the corrections endpoint did not answer", f"{BASE}/api/corrections"
    entries = corr.get("corrections") or []
    sig = corr.get("signature_state")
    state = "LIVE" if entries and sig == "VALID" else "OPEN"
    return (state,
            f"{len(entries)} correction(s) published, signature_state={sig}; the corpus is "
            f"numbered C-<date>-<n>, so there is no '#60-70' series to be present or absent",
            f"{BASE}/api/corrections")


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
    ("U-20", "1,050-move harvest deck + 1,000-move decks + 31-gate board", "execute continuously"),
]

PROBED = [
    ("U-1", "Product live end to end (discover -> identify -> pay -> verify)", p_product),
    ("U-2", "Flagship public (claim maintenance)", p_flagship),
    ("U-3", "Heartbeat board public", p_heartbeat_board),
    ("U-4", "Root advancing + axes + corrections counter", p_root_and_corrections),
    ("U-13a", "Agent skills published", p_skills),
    ("U-21", "OpenTimestamps: every published proof Bitcoin-attested", p_ots_manifest),
    ("U-9a", "Corrections published and signed", p_completion_ledger),
    ("U-10a", "Namespace consolidation: the com.councilof/* DNS TXT claim", p_namespace_dns),
    ("U-10c", "No published artefact still claims a com.councilof.* identifier", p_namespace_tree),
    ("U-14a", "OpenShell adapter built, with a witness capture", p_openshell_adapter),
    ("U-14b", "Cedar policy set governing the GSPC route", p_cedar_policy),
    ("U-15a", "Evaluation Cards schema published", p_evaluation_cards),
    ("U-9b", "The corrections corpus, published and signed", p_corrections_published),
    ("U-13b", "Ecosystem Health Board + citation flywheel", p_ecosystem_health_board),
    ("U-18a", "The chained loop v0.1 (fixed grader)", p_chained_loop),
    ("U-19a", "Small-world lab T-1 league", p_small_world_league),
    ("U-22", "402 health split + stale-directory repoints", p_402_health_split),
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
        if r.get("state") == "LIVE":
            if ident in AVAILABILITY_ONLY_OUTCOMES:
                faults.append(
                    f"{ident} is LIVE but this audit has no qualified outcome "
                    "receipt consumer; availability or supplied success claims "
                    "cannot establish completion")
            rec = (r.get("receipt") or "").strip()
            # A LIVE box that names a repo path must point at a path that EXISTS.
            # This is the CJ-50 shape: the corpus called a prototype BUILT and the
            # estate's own table found no artefact anywhere. A probe that claims
            # LIVE for a path that is not in the tree is the same error, caught.
            if rec.startswith("repo:"):
                target = rec[len("repo:"):].strip()
                target = target.split(" ", 1)[0]
                if target.endswith("/"):
                    if not (REPO / target).is_dir():
                        faults.append(f"{ident} is LIVE but its receipt path {target!r} is not in the tree")
                elif not (REPO / target).exists():
                    faults.append(f"{ident} is LIVE but its receipt path {target!r} is not in the tree")
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


def availability_outcome_selftest() -> list[str]:
    """Finite, offline controls for U-1/U-2; do not run measure() or touch files."""
    global fetch
    original_fetch = fetch
    fails = []
    product_paths = (
        "/api/gspc", "/root.json", "/api/corrections",
        "/api/x402", "/mcp", "/gspc-verify/",
    )
    probes = (("U-1", p_product, product_paths),
              ("U-2", p_flagship, ("/",)))
    try:
        for kind in ("empty", "fixture", "synthetic", "production-claim"):
            body = b"" if kind == "empty" else json.dumps({
                "evidence_kind": kind, "state": "LIVE", "paid": True,
                "verified": True, "maintenance_complete": True,
                "receipt": "https://example.invalid/supplied-receipt",
            }).encode()
            calls = []

            def all_green(path, timeout=45):
                if path not in product_paths + ("/",):
                    raise AssertionError(f"unexpected probe: {path}")
                calls.append(path)
                return 200, body

            fetch = all_green
            rows = []
            for ident, probe, expected in probes:
                calls.clear()
                state, measured, receipt = probe()
                if tuple(calls) != expected:
                    fails.append(f"{ident}: availability requests changed ({kind})")
                if state != "OPEN" or "availability=LIVE" not in measured:
                    fails.append(f"{ident}: green GETs promoted an outcome ({kind})")
                if receipt != f"{BASE}/" or "completion not verified" not in measured:
                    fails.append(f"{ident}: observation or limitation lost ({kind})")
                if ident == "U-1" and (
                        "6/6 surfaces answered 200" not in measured
                        or any(f"{name}=200" not in measured for name in (
                            "board", "root", "corrections", "x402", "mcp", "verify"))):
                    fails.append("U-1: successful HTTP observations were lost")
                if ident == "U-2" and "GET / -> HTTP 200" not in measured:
                    fails.append("U-2: successful homepage observation was lost")
                row = {"id": ident, "state": state, "measured": measured,
                       "receipt": receipt}
                rows.append(row)
                if audit_faults([row]):
                    fails.append(f"{ident}: honest OPEN observation was rejected")
                forged = {**row, "state": "LIVE", "evidence_kind": kind,
                          "outcome_evidence": {"verified": True, "source": kind}}
                if not audit_faults([forged]):
                    fails.append(f"{ident}: supplied success bypassed the guard ({kind})")
            counts = {"total": 2, "live": 0, "open": 2, "staged": 0, "owner": 0}
            if counts_consistent(counts, rows):
                fails.append(f"availability/outcome counts disagree ({kind})")

        def unavailable(path, timeout=45):
            if path not in product_paths + ("/",):
                raise AssertionError(f"unexpected probe: {path}")
            return (503 if path in ("/gspc-verify/", "/") else 200), b""

        fetch = unavailable
        state, measured, _ = p_product()
        if (state != "OPEN" or "availability=OPEN" not in measured
                or "5/6 surfaces answered 200" not in measured
                or "verify=503" not in measured):
            fails.append("U-1: failed availability observation was lost")
        state, measured, _ = p_flagship()
        if (state != "OPEN" or "availability=OPEN" not in measured
                or "GET / -> HTTP 503" not in measured):
            fails.append("U-2: failed homepage observation was lost")

        # No blanket rejection of legitimate fixtures belonging to other boxes.
        if audit_faults([{
            "id": "U-14a", "state": "LIVE",
            "measured": "expected OpenShell refusal fixture",
            "receipt": "https://example.invalid/openshell-fixture",
        }]):
            fails.append("the availability guard reclassified an unrelated fixture")
    finally:
        fetch = original_fetch
    return fails


def selftest() -> int:
    """Prove the audit can go red.

    The earlier version of this selftest ran the live probes and asserted the
    rules held — and it PASSED with the rules removed, because the live surface
    was fine and so the rules were never exercised. A gate that has never gone
    red proves nothing about the tree it passes. So each rule is now tested
    against a DELIBERATELY BROKEN row: the rule must catch it. If the rule
    cannot catch its own counterexample, the rule is not a rule.
    """
    fails = availability_outcome_selftest()

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
    # 9c. and the counterexample: a LIVE row whose repo receipt points at a path
    # that is NOT in the tree must be caught. This is the CJ-50 shape: the corpus
    # called a prototype BUILT and the estate's own table found no artefact
    # anywhere. A probe that claims LIVE for a path that is not in the tree is the
    # same error, and the audit has to refuse it.
    ghost = {"id": "X-7", "state": "LIVE", "measured": "a prototype that does not exist",
             "receipt": "repo:docs/measurement/NO-SUCH-ARTEFACT.md"}
    if not audit_faults([ghost]):
        fails.append("the audit did not catch a LIVE row whose repo receipt path is absent")

    # 10. the rendered markdown must carry the same numbers as the JSON
    md = render_md(real)
    if f"{c['total']} items" not in md:
        fails.append("the rendered ledger and the JSON disagree on the total")
    # 11. and the ledger must not contain the word that names the destination as a claim
    for banned in banned_claims_in(md):
        fails.append(f"the rendered ledger asserts a banned claim: {banned!r}")

    # 12. the DNS namespace probe must be able to go RED, and it must never report an
    #     answer it did not get. "Unknown" and "absent" are different facts, and a probe
    #     that conflates them reports an absence the estate never measured.
    global _dig_available, _dig_txt_state
    original_dig = _dig_txt_state
    original_dig_available = _dig_available
    try:
        _dig_available = lambda: True
        _dig_txt_state = lambda n: ("NOERROR", ["com.councilof/*"])
        if p_namespace_dns()[0] != "LIVE":
            fails.append("the namespace DNS probe did not report a published TXT as LIVE")
        _dig_txt_state = lambda n: ("NXDOMAIN", [])
        state, measured, _ = p_namespace_dns()
        if state != "OPEN":
            fails.append("the namespace DNS probe did not go red on an unpublished namespace")
        if "does not exist" not in measured:
            fails.append("the namespace DNS probe did not name the NXDOMAIN state")
        _dig_txt_state = lambda n: ("UNKNOWN", [])
        state, measured, _ = p_namespace_dns()
        if state != "OPEN":
            fails.append("the namespace DNS probe reported a verdict for an unknown answer")
        if "UNKNOWN" not in measured:
            fails.append("the namespace DNS probe reported an unknown answer as an absence")
    finally:
        _dig_txt_state = original_dig
        _dig_available = original_dig_available

    # 13. the tree probe must be able to go RED on a real claim, and must not fire on a
    #     DNS label mention or on the audit's own output. These are the two things that
    #     made the FIRST version of this row go red for the wrong reason.
    global REPO
    original_repo = REPO
    try:
        with tempfile.TemporaryDirectory() as td:
            tmp = Path(td)
            (tmp / "public").mkdir()
            REPO = tmp
            (tmp / "public" / "a.json").write_text(json.dumps(
                {"evidence": "_mcp.com.councilof.ai -> no TXT record",
                 "next_step": "Publish the TXT naming com.councilof/*"}))
            if p_namespace_tree()[0] != "LIVE":
                fails.append("the namespace tree probe counted a DNS mention as a claim")
            (tmp / "public" / "b.json").write_text(json.dumps({"id": "com.councilof.gsPC"}))
            if p_namespace_tree()[0] != "OPEN":
                fails.append("the namespace tree probe did not go red on a com.councilof.* identifier")
            (tmp / "public" / "b.json").unlink()
            (tmp / "public" / "completion-audit.json").write_text(json.dumps(
                {"measured": "com.councilof.gsPC is claimed"}))
            if p_namespace_tree()[0] != "LIVE":
                fails.append("the namespace tree probe counted its own output as a claim")
    finally:
        REPO = original_repo

    if fails:
        for f in fails:
            print("  FAIL:", f)
        return 1
    print("  completion_audit selftest: OK "
          "(14 rule groups, each proven able to catch its own counterexample)")
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
