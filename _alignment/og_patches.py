#!/usr/bin/env python3
"""og_patches.py — agisafe-hive (main branch) + safetyofai (public/checkout.html) og:image fixes."""
import subprocess, json, base64

def gh(p, m="GET", b=None):
    a = ["gh", "api", "-X", m, p]
    if b:
        for k, v in b.items():
            a += ["-f", f"{k}={v}"]
    return json.loads(subprocess.check_output(a, text=True))

def patch_repo(repo, base, path, img, branch="og-image-20261007"):
    m = gh(f"repos/{repo}/git/ref/heads/{base}")["object"]["sha"]
    try:
        gh(f"repos/{repo}/git/refs", "POST", {"ref": f"refs/heads/{branch}", "sha": m})
        print(repo, "branch created")
    except Exception:
        print(repo, "branch exists")
    r = gh(f"repos/{repo}/contents/{path}?ref={branch}")
    s = base64.b64decode(r["content"]).decode()
    if 'og:image' in s:
        print(repo, ": og:image already present")
        return
    tag = f'<meta property="og:image" content="{img}">'
    anchor = "<head>" if "<head>" in s else "<HEAD>"
    s = s.replace(anchor, anchor + "\n  " + tag, 1)
    gh(f"repos/{repo}/contents/{path}", "PUT", {
        "message": f"og:image ({img} — gauntlet og_tags FAIL)",
        "content": base64.b64encode(s.encode()).decode(),
        "branch": branch, "sha": r["sha"]})
    print(repo, "OG PATCHED ->", branch)

patch_repo("CSOAI-ORG/agisafe-hive", "main", "index.html", "https://agisafe.ai/og-image.png")
try:
    patch_repo("CSOAI-ORG/safetyofai", "main", "public/checkout.html", "https://safetyof.ai/og-image.png")
except Exception as e:
    try:
        patch_repo("CSOAI-ORG/safetyofai", "master", "public/checkout.html", "https://safetyof.ai/og-image.png")
    except Exception as e2:
        print("safetyofai failed both bases:", str(e2)[:80])