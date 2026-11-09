#!/usr/bin/env python3
"""Re-verify the SAFE v1.0 port contribution against upstream, live.

WHY. The citable form at public/contributions/osaia-safe-v1.0-port-2026-10-26.md
makes dated factual claims about an upstream repository it does not control:
SAFE.md's size, the state of issue #32 and #72, the shape of PR #64, and the
content of the approved specification. Those claims were verified on 26 October
2026. A contribution that says "verified at source on <date>" and is never
re-checked is a document with a stale claim in it, and the estate's own rule
is that a wrong published sentence is corrected visibly.

This checks every one of those claims against github.com/OpenSecureAIAlliance/RFCs
as it stands now, and it checks the ONE thing that actually matters for the
contribution: that the patch still applies cleanly to the APPROVED SAFE.md, and
that all four hunks land.

It reports PASS/FAIL per check and never rewrites the document. It is the
evidence behind a correction, not the correction itself.
"""
import json
import os
import tempfile
import subprocess
import sys
import urllib.request

OWNER = "OpenSecureAIAlliance"
REPO = "RFCs"
API = "https://api.github.com/repos/%s/%s" % (OWNER, REPO)
UA = {"User-Agent": "csoai-safe-port-verifier"}
# The patch this contribution proposes, relative to the repository root so the
# verifier runs from a checkout without absolute paths.
HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)
LOCAL_PATCH = os.path.join(REPO_ROOT, "docs", "standards", "osaia-safe-reverification",
                           "SAFE-v1.0-port.patch")

# The claims the citable form makes, verbatim from its section 2 table.
CLAIMED = {
    "SAFE.md_bytes": 20094,
    "rfc-safe-proposal.md_bytes": 7773,
    "issue_32_open": True,
    "issue_32_comments": 2,
    "issue_72_open": True,
    "issue_72_comments": 2,
    "pr_64_open": True,
    "pr_64_draft": False,
    "pr_64_base": "main",
    "pr_64_commits": 3,
    "pr_64_added": 24,
    "pr_64_deleted": 0,
    "pr_64_files": ["rfc-safe-proposal.md"],
    # The finding that matters: the approved specification carries none of
    # these words.
    "approved_absent_terms": ["discriminat", "negative control", "insufficient_evidence",
                              "not_applicable", "claim maintenance"],
}


def api(path):
    req = urllib.request.Request(API + path, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def raw(path):
    url = "https://raw.githubusercontent.com/%s/%s/main/%s" % (OWNER, REPO, path)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def check(name, actual, expected):
    ok = actual == expected
    return {"check": name, "ok": ok, "actual": actual, "claimed": expected}


def main():
    results = []

    # --- the approved specification and its superseded sibling -------------
    safe_bytes = raw("SAFE.md")
    rfc_bytes = raw("rfc-safe-proposal.md")
    results.append(check("SAFE.md_bytes", len(safe_bytes), CLAIMED["SAFE.md_bytes"]))
    results.append(check("rfc-safe-proposal.md_bytes", len(rfc_bytes),
                         CLAIMED["rfc-safe-proposal.md_bytes"]))

    approved_text = safe_bytes.decode("utf-8", "replace")
    for term in CLAIMED["approved_absent_terms"]:
        results.append(check("approved_absent:%s" % term,
                             term.lower() in approved_text.lower(), False))

    # --- the three open items ----------------------------------------------
    for num, key in ((32, "issue_32"), (72, "issue_72")):
        issue = api("/issues/%d" % num)
        results.append(check("%s_open" % key, issue.get("state") == "open",
                             CLAIMED["%s_open" % key]))
        results.append(check("%s_comments" % key, issue.get("comments"),
                             CLAIMED["%s_comments" % key]))

    pr = api("/pulls/64")
    results.append(check("pr_64_open", pr.get("state") == "open", CLAIMED["pr_64_open"]))
    results.append(check("pr_64_draft", pr.get("draft"), CLAIMED["pr_64_draft"]))
    results.append(check("pr_64_base", pr.get("base", {}).get("ref"), CLAIMED["pr_64_base"]))
    results.append(check("pr_64_commits", pr.get("commits"), CLAIMED["pr_64_commits"]))
    results.append(check("pr_64_added", pr.get("additions"), CLAIMED["pr_64_added"]))
    results.append(check("pr_64_deleted", pr.get("deletions"), CLAIMED["pr_64_deleted"]))
    files = api("/pulls/64/files")
    results.append(check("pr_64_files", sorted(f["filename"] for f in files),
                         sorted(CLAIMED["pr_64_files"])))

    # --- the thing that actually matters: does the patch still bind? --------
    patch = open(LOCAL_PATCH, encoding="utf-8").read()
    hunks = patch.count("\n@@ ")
    if patch.startswith("@@"):
        hunks += 1
    results.append(check("patch_hunks", hunks, 4))

    # Apply it with git, in a throwaway directory outside every working tree.
    work = os.path.join(tempfile.gettempdir(), "safe-patch-check")
    subprocess.run(["mkdir", "-p", work], check=True)
    subprocess.run(["rm", "-f", work + "/SAFE.md", work + "/SAFE.md.orig"], check=False)
    with open(work + "/SAFE.md", "wb") as handle:
        handle.write(safe_bytes)
    with open(work + "/port.patch", "w", encoding="utf-8") as handle:
        handle.write(patch)
    proc = subprocess.run(
        ["git", "apply", "--check", "--verbose", "port.patch"],
        cwd=work, capture_output=True, text=True)
    results.append({"check": "patch_applies_cleanly", "ok": proc.returncode == 0,
                    "actual": proc.stdout.strip() or proc.stderr.strip(),
                    "claimed": "applies cleanly, all four hunks land"})

    # And the resulting size, which the document states: 20,094 -> 22,852.
    if proc.returncode == 0:
        proc2 = subprocess.run(["git", "apply", "port.patch"], cwd=work,
                               capture_output=True, text=True)
        if proc2.returncode == 0:
            after = len(open(work + "/SAFE.md", "rb").read())
            results.append(check("SAFE.md_bytes_after_patch", after, 22852))

    # --- report -------------------------------------------------------------
    failed = [r for r in results if not r["ok"]]
    for r in results:
        mark = "PASS" if r["ok"] else "FAIL"
        print("%-4s %-34s actual=%r claimed=%r" % (mark, r["check"], r["actual"], r["claimed"]))
    print()
    print("checked %d claims, %d failed" % (len(results), len(failed)))
    out = os.path.join(REPO_ROOT, "public", "interop",
                       "osaia-safe-port-verification-2026-10-28.json")
    try:
        json.dump(results, open(out, "w"), indent=1)
        print("wrote", out)
    except OSError as exc:
        print("could not write %s: %s" % (out, exc))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
