#!/usr/bin/env python3
"""Capture one coherent live measurement window for the gap register's third pass.

Every figure in the register's dated sections was read from the named endpoint at a
stated time. This script reads them all again in ONE run and prints them with the
read time, so the section can quote one window rather than a patchwork of reads taken
at different moments.
"""
import json
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone

UA = {"User-Agent": "csoai-gap-register-pass3/1"}
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


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


print(f"READ AT {NOW}\n")

# --- A1/A13/A14: the live board -------------------------------------------
g = get("https://councilof.ai/api/gspc")
t = g.get("totals") or {}
print("A1  board:", t.get("axes"), "slots |", t.get("measured_axes"), "measured |",
      t.get("unmeasured_axes"), "unmeasured | public_count:", repr(t.get("public_count")))
print("A13 domains[]:", len(g.get("domains") or []),
      [(d.get("id"), d.get("status")) for d in (g.get("domains") or [])])
fa = t.get("financial_run_attestations") or {}
print("A14 financial run artefacts:", fa.get("run_artifacts"), "| signed:", fa.get("ed25519_signed"),
      "| content-addressed only:", fa.get("content_addressed_unsigned"),
      "| signed axes:", fa.get("signed_axes"))

# --- A2/A6: the live root --------------------------------------------------
raw = get("https://councilof.ai/root.json", as_json=False)
import hashlib
root = json.loads(raw)
print("A2  root.json: sha256", hashlib.sha256(raw).hexdigest(), "| bytes", len(raw),
      "| merkle", root.get("merkle_root"), "| cards", root.get("card_count"),
      "| as_of", root.get("as_of"))

# --- A3: the corrections ledger -------------------------------------------
c = get("https://councilof.ai/api/corrections")
entries = c.get("corrections") or []
print("A3  corrections:", len(entries), "entries | newest", entries[0].get("id"),
      entries[0].get("date"), "| signature_state", c.get("signature_state"))

# --- A4: the hub cells -----------------------------------------------------
h = get("https://councilof.ai/api/hub-cards")
print("A4  hub cards:", json.dumps(h.get("counts")))

# --- A5: the publisher metric ---------------------------------------------
r = get("https://councilof.ai/api/revenue")
one = r.get("one_number") or {}
print("A5  revenue:", "all_time", one.get("all_time"), "| last_30d", one.get("last_30d"),
      "| settlements", one.get("settlements"), "| self_settlements", one.get("self_settlements"))

# --- A11: the witness pointer ---------------------------------------------
p = get("https://councilof.ai/interop/root-witness-pointer.json")
d = p.get("drift") or {}
print("A11 pointer drift:", d.get("status"), "| checked_at", d.get("checked_at"),
      "| match_sha256", d.get("match_sha256"), "| match_merkle_root", d.get("match_merkle_root"))
print("A11 pointer live_root:", json.dumps(p.get("live_root")))
print("A11 pointer witnessed sha256:", (p.get("live_root") or {}).get("sha256"))
print("A11 LIVE root sha256      :", hashlib.sha256(raw).hexdigest())
print("A11 equal:", (p.get("live_root") or {}).get("sha256") == hashlib.sha256(raw).hexdigest())
print("A11 conflict:", json.dumps(p.get("conflict"))[:200])

# --- A12: the Zenodo status ------------------------------------------------
z = get("https://councilof.ai/interop/zenodo-status.json")
states = {}
for doi in z.get("dois") or []:
    states[doi.get("http_status_at_check")] = states.get(doi.get("http_status_at_check"), 0) + 1
print("A12 zenodo as_of:", z.get("as_of"), "| dois named:", len(z.get("dois") or []),
      "| by http status:", states)

# --- A15: the HITL probe ---------------------------------------------------
try:
    hitl = get("https://councilof.ai/interop/hitl-elicitation-probe-2026-09-24.json")
    print("A15 hitl probe: signed", hitl.get("signed"), "| status", repr(hitl.get("status")))
except Exception as exc:  # noqa: BLE001
    print("A15 hitl probe: ERR", exc)

# --- A16: the capsule index ------------------------------------------------
try:
    cap = get("https://councilof.ai/measurement-capsules/latest.json")
    print("A16 capsule index as_of:", cap.get("as_of"), "| index:", cap.get("index"),
          "| versions:", cap.get("versions"))
except Exception as exc:  # noqa: BLE001
    print("A16 capsule index: ERR", exc)

# --- A17: the x402 manifest ------------------------------------------------
try:
    x = get("https://councilof.ai/.well-known/x402.json")
    print("A17 x402 manifest: top-level keys", len(x.keys()),
          "| signature field:", ("signature" in x) or ("sig_ed25519" in x))
except Exception as exc:  # noqa: BLE001
    print("A17 x402 manifest: ERR", exc)

# --- A18: the A2A census controls -----------------------------------------
for rel in ("a2a-directories-20260930T103424Z.json",
            "a2a-directories-20260930T103424Z.controls.json"):
    print(f"A18 {rel}: HTTP {head('https://councilof.ai/interop/' + rel)}")

# --- A7/A19: the dated notes -----------------------------------------------
for rel in ("corrections/SUPERSESSIONS.md",
            "corrections/root-witness-pointer-drift-2026-10-27-SUPERSEDES.md",
            "corrections/zenodo-status-2026-09-29-SUPERSEDES.md"):
    print(f"A19 {rel}: HTTP {head('https://councilof.ai/' + rel)}")
