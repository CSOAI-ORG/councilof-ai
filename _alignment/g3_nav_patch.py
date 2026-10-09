#!/usr/bin/env python3
"""g3_nav_patch v2 — create branch first (refs API), then commit the HeaderNav Pricing link."""
import subprocess, json, base64

def gh(path, method="GET", body=None, raw=False):
    args = ["gh", "api", "-X", method, path]
    if body:
        for k, v in body.items():
            args += ["-f", f"{k}={v}"]
    out = subprocess.check_output(args, text=True)
    return out if raw else json.loads(out)

BR = "promo-band-20261007"
master = gh("repos/CSOAI-ORG/councilof-ai/git/ref/heads/master")
msha = master["object"]["sha"]

# create branch (idempotent)
try:
    gh("repos/CSOAI-ORG/councilof-ai/git/refs", "POST", {"ref": f"refs/heads/{BR}", "sha": msha})
    print("BRANCH CREATED", BR)
except Exception:
    print("branch exists or create failed — continuing")

nav = gh(f"repos/CSOAI-ORG/councilof-ai/contents/client/src/components/HeaderNav.tsx?ref={BR}")
src = base64.b64decode(nav["content"]).decode()
anchor = '{ name: "Services", href: "/services/" },'
if '{ name: "Pricing"' in src:
    print("ALREADY PATCHED")
else:
    new = src.replace(anchor, '{ name: "Pricing", href: "/pricing" },\n  ' + anchor, 1)
    assert new != src, "anchor missing"
    gh("repos/CSOAI-ORG/councilof-ai/contents/client/src/components/HeaderNav.tsx", "PUT", {
        "message": "nav: add Pricing to PRIMARY_LINKS (buyers had no path to the money pages from home)",
        "content": base64.b64encode(new.encode()).decode(),
        "branch": BR,
        "sha": nav["sha"],
    })
    print("NAV PATCHED ->", BR)

# PR (idempotent-ish: just open it)
try:
    pr = subprocess.check_output(
        ["gh", "pr", "create", "--repo", "CSOAI-ORG/councilof-ai", "--head", BR, "--base", "master",
         "--title", "nav: Pricing link (end-user findability fix)",
         "--body", "Persona-walk finding (2026-10-07, buyer persona): home exposes no path to /pay or /pricing — the money pages are unreachable from PRIMARY_LINKS. Adds {Pricing -> /pricing}. Promo band on /pay follows in a second commit once the pay route source is mapped."],
        text=True)
    print("PR:", pr.strip().splitlines()[-1])
except Exception as e:
    print("pr:", str(e)[:80])