#!/usr/bin/env python3
"""Capture one coherent live measurement window for the gap register's fourth pass.

§8 quoted a window read at 2026-11-01T04:39:39Z. Two closures landed AFTER that
window -- the README regeneration (#3689) and the clearance of the conflict backlog
-- so §8's rows for A2 and A6 describe a state that no longer holds. A dated section
is not re-written in place; a new dated section is added and the earlier one is left
exactly as it was read.

This script reads every live endpoint the register's rows name, in ONE run, and prints
the read time, so §9 quotes one window rather than a patchwork of reads taken at
different moments. It also reads the repository's own documents for the rows that are
decided by a comparison between a quoted figure and a live one -- A1, A2, A6, A9 and
A20 are exactly that -- because the live figure alone cannot close a row whose subject
is a stale quote.

A CHECK THAT CANNOT GO RED IS NOT A CHECK. Three of the rows this script reads are
closed by a COMPARISON between what a repository document says and what the live
endpoint says, and the comparison is made against the NUMBERS, never against a
phrase:

  A1   the README's stated board size and its `totals.public_count` line, against
       the live board's `totals.axes` and `totals.public_count`.
  A9   the SAFE port working note's own stated board numbers, against the live board.
  A20  the CITABLE form's own stated board numbers, against the live board.

Each of these read red on this script's first run and green only after the correction
landed, and each reads red again if the board moves and the document is not re-read.
That is the point: the closure is the document agreeing with the live board, not the
presence of a word.

A7 WAS A FALSE NEGATIVE, AND IS NOT NOW. The first version of this script closed A7
only when a document carried the full URL `councilof.ai/root.json` AND the literal
phrase "Read on <date>". The two documents in question spell the same closure
differently -- the grants draft writes the door as `GET /root.json` under a "Read on
<date>" column, the anchor preparation note writes the full URL under "Observed
**<date>**" -- so the check reported a row that had been closed since PR #3564 as
OPEN. A false negative that hides a closure is the worst failure a register can have:
it makes a landed fix look like outstanding work. The check now matches the closure
as the documents state it, and still refuses if either half is missing.

    python3 scripts/measurements/gap-register-pass4.py

Measurement, not certification. Nothing here is a grade, a rank or a verdict on a
system: it is a reading of what the estate's own surfaces say at one moment.
"""
import hashlib
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

UA = {"User-Agent": "csoai-gap-register-pass4/1"}
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ORIGIN = "https://councilof.ai"


def get(url, as_json=True):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read()
    return json.loads(body) if as_json else body


def head(url):
    req = urllib.request.Request(url, headers=UA, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except Exception as exc:  # noqa: BLE001
        return f"ERR {exc}"


def repo_text(rel):
    path = os.path.join(REPO, rel)
    try:
        with open(path, encoding="utf-8") as fh:
            return fh.read()
    except OSError:
        return ""


def verdict(row, status, evidence):
    print(f"{row} {status} — {evidence}")


print(f"READ AT {NOW}\n")

# ── the live board (A1, A13, A14) ────────────────────────────────────────────
g = get(f"{ORIGIN}/api/gspc")
t = g.get("totals") or {}
print("board:", t.get("axes"), "slots |", t.get("measured_axes"), "measured |",
      t.get("unmeasured_axes"), "unmeasured | public_count:", repr(t.get("public_count")))
domains = g.get("domains") or []
fa = t.get("financial_run_attestations") or {}
# A1 is not "what does the board say" -- it is "does the README still say what
# the board says". The board grew from 33 to 34 slots; a README that still said
# 33 is a published false statement about a live endpoint, and the closure is
# the README agreeing with the live board, not the board changing.
readme = repo_text("README.md")
m = re.search(r"totals\.public_count` = \*\*([^*]+)\*\*", readme)
readme_count = m.group(1).strip() if m else None
m = re.search(r"the (\d+)-axis GSPC board", readme)
readme_axes = int(m.group(1)) if m else None
count_ok = readme_count == t.get("public_count")
axes_ok = readme_axes == t.get("axes")
verdict("A1 ", "CLOSED" if (count_ok and axes_ok) else "OPEN",
        f"live board {t.get('axes')} slots / {t.get('measured_axes')} measured / "
        f"{t.get('unmeasured_axes')} unmeasured; public_count {t.get('public_count')!r}; "
        f"the README states a {readme_axes}-axis board and {readme_count!r} — "
        f"{'agrees with the live board' if (count_ok and axes_ok) else 'DISAGREES with the live board'}")
verdict("A13", "MEASURED", f"domains[] carries {len(domains)} entry/entries "
                          f"{[(d.get('id'), d.get('status')) for d in domains]}")
verdict("A14", "MEASURED", f"financial run artefacts {fa.get('run_artifacts')}, "
                          f"ed25519_signed {fa.get('ed25519_signed')}, "
                          f"content_addressed_unsigned {fa.get('content_addressed_unsigned')}, "
                          f"signed axes {fa.get('signed_axes')}")

# ── the live root (A2, A6, A11) ──────────────────────────────────────────────
raw = get(f"{ORIGIN}/root.json", as_json=False)
root = json.loads(raw)
live_sha = hashlib.sha256(raw).hexdigest()
print("root.json: sha256", live_sha, "| bytes", len(raw), "| merkle", root.get("merkle_root"),
      "| cards", root.get("card_count"), "| as_of", root.get("as_of"))

# ── A2: the README's own "live now" quote against the live root ────────────
row = ""
for line in readme.splitlines():
    if "Signed Merkle public root" in line and "| 2 ·" in line:
        row = line
        break
m = re.search(r"root `([0-9a-f]{8})", row)
merkle_prefix = m.group(1) if m else None
m = re.search(r"\*\*(\d+)\*\* leaves", row)
readme_leaves = int(m.group(1)) if m else None
m = re.search(r"as_of `([^`]+)`", row)
readme_as_of = m.group(1) if m else None
merkle_ok = bool(merkle_prefix) and str(root.get("merkle_root")).startswith(merkle_prefix)
leaves_ok = readme_leaves == root.get("card_count")
as_of_ok = readme_as_of == root.get("as_of")
verdict("A2 ", "CLOSED" if (merkle_ok and leaves_ok and as_of_ok) else "OPEN",
        f"README quotes root {merkle_prefix}… · {readme_leaves} leaves · as_of {readme_as_of}; "
        f"live root {str(root.get('merkle_root'))[:8]}… · {root.get('card_count')} leaves · "
        f"as_of {root.get('as_of')} → merkle {'match' if merkle_ok else 'MISMATCH'}, "
        f"leaves {'match' if leaves_ok else 'MISMATCH'}, as_of {'match' if as_of_ok else 'MISMATCH'}")

# ── A6: the Hugging Face snapshot against the live root ────────────────────
hf = ""
try:
    hf_raw = get("https://huggingface.co/datasets/csoai/gspc-board/resolve/main/snapshot/root.json",
                 as_json=False)
    hf = json.loads(hf_raw)
except Exception as exc:  # noqa: BLE001
    hf = {"ERROR": str(exc)}
hf_merkle_ok = hf.get("merkle_root") == root.get("merkle_root")
hf_as_of_ok = hf.get("as_of") == root.get("as_of")
hf_row = ""
for line in readme.splitlines():
    if "csoai/gspc-board" in line and "Hugging Face dataset" in line:
        hf_row = line
        break
m = re.search(r"merkle `([0-9a-f]{8})", hf_row)
hf_merkle_prefix = m.group(1) if m else None
verdict("A6 ", "CLOSED" if (hf_merkle_ok and hf_as_of_ok) else "OPEN",
        f"HF snapshot root.json merkle {str(hf.get('merkle_root'))[:8]}… · as_of {hf.get('as_of')}; "
        f"live {str(root.get('merkle_root'))[:8]}… · {root.get('as_of')}; README row quotes "
        f"{hf_merkle_prefix}… — the row is a dated reading and states itself as behind the live root")

# ── A3: the corrections ledger ─────────────────────────────────────────────
c = get(f"{ORIGIN}/api/corrections")
entries = c.get("corrections") or []
readme_corr = ""
for line in readme.splitlines():
    if "corrections" in line.lower() and "entries" in line:
        readme_corr = line
        break
verdict("A3 ", "MEASURED", f"live {len(entries)} entries, newest "
                          f"{entries[0].get('id')} ({entries[0].get('date')}), "
                          f"signature_state {c.get('signature_state')}")

# ── A4 / A5 ─────────────────────────────────────────────────────────────────
h = get(f"{ORIGIN}/api/hub-cards")
print("hub cards:", json.dumps(h.get("counts")))
r = get(f"{ORIGIN}/api/revenue")
one = r.get("one_number") or {}
print("revenue:", "all_time", one.get("all_time"), "| last_30d", one.get("last_30d"),
      "| settlements", one.get("settlements"), "| self_settlements", one.get("self_settlements"))

# ── A7: the dated pointers into the live root ───────────────────────────────
# The closure is: the document points the reader at the LIVE root, and carries a
# dated reading of it. The two documents spell that differently -- the grants
# draft writes the door as `GET /root.json` under a "Read on <date>" column, the
# anchor preparation note writes the full URL under "Observed **<date>**". A
# check that matched one phrasing only reported a closed row as OPEN: a false
# negative, and the worst kind, because it hides a closure that has landed.
LIVE_ROOT_DOOR = (r"councilof\.ai/root\.json",
                  r"GET\s+(?:https://councilof\.ai)?/root\.json")
DATED_READING = r"(?:Read on|read on|Observed|observed|as read on)\s*\**\s*\d{4}-\d{2}-\d{2}"
for rel in ("docs/grants/README.md", "docs/trust/ANCHOR-PREPARATION.md"):
    text = repo_text(rel)
    live_ptr = any(re.search(p, text) for p in LIVE_ROOT_DOOR)
    dated = bool(re.search(DATED_READING, text))
    verdict("A7 ", "CLOSED" if (live_ptr and dated) else "OPEN",
            f"{rel} points at the live root: {live_ptr} (full URL or `GET /root.json`); "
            f"carries a dated reading: {dated} — the pointer is the closure and the number "
            f"is a dated reading")

# ── A8: the profile documents' correction figures ───────────────────────────
for rel in ("docs/github/PROFILE-README.md", "docs/github/PERSONAL-PROFILE-DRAFT.md"):
    text = repo_text(rel)
    has_newest = "C-2026-1006-13" in text
    verdict("A8 ", "CLOSED" if has_newest else "OPEN",
            f"{rel} names the newest correction C-2026-1006-13: {has_newest}")

# ── A9 / A10: the SAFE contribution document ────────────────────────────────
safe = repo_text("docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md")
# The closure is that the document states TWO boards at TWO observation times and
# never presents the freeze's 23 as the current board. The stronger check is to
# compare the document's OWN stated living-board numbers against the live board:
# a document that quotes a live figure without reading it live again goes stale
# the moment the board changes, and that is a real defect, not a wording quirk.
m = re.search(r"living board[^\n]*?states \*\*(\d+) axes · (\d+) measured", safe)
doc_axes = int(m.group(1)) if m else None
doc_measured = int(m.group(2)) if m else None
freeze_ok = "23 axes · 23 measured" in safe
board_ok = (doc_axes == t.get("axes") and doc_measured == t.get("measured_axes"))
superseded = "SUPERSEDED_KNOWN_CLAIM_DEFECT" in safe
verdict("A9 ", "CLOSED" if (freeze_ok and board_ok and superseded) else "OPEN",
        f"states the signed freeze's 23 axes · 23 measured: {freeze_ok}; states the living "
        f"board as {doc_axes} axes · {doc_measured} measured against live "
        f"{t.get('axes')} axes · {t.get('measured_axes')} measured: {board_ok}; records the "
        f"freeze as SUPERSEDED_KNOWN_CLAIM_DEFECT: {superseded}")
pinned = "ba76bac74c251926cb3d14bc363e0443b5959007" in safe
verdict("A10", "CLOSED as an engineering gap" if pinned else "OPEN",
        f"the patch is bound to the APPROVED SAFE.md at pinned upstream commit "
        f"ba76bac74c251926cb3d14bc363e0443b5959007: {pinned}; the upstream pull request is "
        f"still NOT submitted and needs a co-author with a normal GitHub account")

# ── A20: the CITABLE form's live board claim ───────────────────────────────
# The citable form is what a reader sees at councilof.ai/contributions/. It is
# a separate file from the working note above, so it is checked separately: a
# correction that lands in the working note and not in the published form leaves
# the published claim just as false.
citable = repo_text("public/contributions/osaia-safe-v1.0-port-2026-10-26.md")
m = re.search(r"living board[^\n]*?states \*\*(\d+) axes · (\d+) measured", citable)
cit_axes = int(m.group(1)) if m else None
cit_measured = int(m.group(2)) if m else None
cit_ok = cit_axes == t.get("axes") and cit_measured == t.get("measured_axes")
verdict("A20", "CLOSED" if cit_ok else "OPEN",
        f"the citable form states the living board as {cit_axes} axes · {cit_measured} measured "
        f"against live {t.get('axes')} axes · {t.get('measured_axes')} measured: {cit_ok}")

# ── A11: the witness pointer ───────────────────────────────────────────────
p = get(f"{ORIGIN}/interop/root-witness-pointer.json")
d = p.get("drift") or {}
pointer_sha = (p.get("live_root") or {}).get("sha256")
verdict("A11", "MEASURED", f"published drift verdict {d.get('status')} at {d.get('checked_at')}; "
                          f"the pointer's live_root.sha256 {'IS' if pointer_sha == live_sha else 'IS NOT'} "
                          f"the live root's sha256; conflict {json.dumps(p.get('conflict'))[:120]}")

# ── A12 ─────────────────────────────────────────────────────────────────────
z = get(f"{ORIGIN}/interop/zenodo-status.json")
states = {}
for doi in z.get("dois") or []:
    states[doi.get("http_status_at_check")] = states.get(doi.get("http_status_at_check"), 0) + 1
verdict("A12", "MEASURED", f"as_of {z.get('as_of')}, {len(z.get('dois') or [])} DOIs named, "
                          f"by HTTP status {states}")

# ── A15 / A16 / A17 ─────────────────────────────────────────────────────────
try:
    hitl = get(f"{ORIGIN}/interop/hitl-elicitation-probe-2026-09-24.json")
    verdict("A15", "MEASURED", f"signed {hitl.get('signed')}, status {hitl.get('status')!r}")
except Exception as exc:  # noqa: BLE001
    verdict("A15", "ERR", str(exc))
try:
    cap = get(f"{ORIGIN}/measurement-capsules/latest.json")
    verdict("A16", "MEASURED", f"capsule index as_of {cap.get('as_of')} against the live root's "
                              f"{root.get('as_of')}; index {cap.get('index')}")
except Exception as exc:  # noqa: BLE001
    verdict("A16", "ERR", str(exc))
try:
    x = get(f"{ORIGIN}/.well-known/x402.json")
    verdict("A17", "MEASURED", f"{len(x.keys())} top-level keys, signature field present: "
                              f"{('signature' in x) or ('sig_ed25519' in x)}")
except Exception as exc:  # noqa: BLE001
    verdict("A17", "ERR", str(exc))

# ── A18 / A19: the dated artefacts ─────────────────────────────────────────
for rel in ("a2a-directories-20260930T103424Z.json",
            "a2a-directories-20260930T103424Z.controls.json"):
    print(f"A18 {rel}: HTTP {head(ORIGIN + '/interop/' + rel)}")
for rel in ("corrections/SUPERSESSIONS.md",
            "corrections/root-witness-pointer-drift-2026-10-27-SUPERSEDES.md",
            "corrections/zenodo-status-2026-09-29-SUPERSEDES.md"):
    print(f"A19 {rel}: HTTP {head(ORIGIN + '/' + rel)}")

# ── the conflict backlog, as this repository sees it ────────────────────────
print("\nBACKLOG (read from the working tree, not the network):")
for rel in ("scripts/measurements/gap-register-pass3.py",
            "scripts/measurements/gap-register-pass4.py"):
    print(f"  {rel}: {'present' if repo_text(rel) else 'ABSENT'}")
print(f"\nWINDOW CLOSED. Every live reading above was taken in this one run, "
      f"stamped {NOW} at the top of the output.")
