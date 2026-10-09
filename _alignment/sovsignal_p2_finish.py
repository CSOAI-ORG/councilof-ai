#!/usr/bin/env python3
"""SOV SIGNAL #2 (P2: HF shared template + Layer O) — land the doable work with evidence.
1. Verify + apply the 2-line hf-org-card.py diff (pin check vs handover SHA).
2. Prepare the csoai-layer-o-reader-v1 marked block as a ready-to-merge emission snippet.
3. Run the candidate test suite (12 tests).
4. Commit to local branch cloud/sovsignal-p2-20261007 (remote = suspended account, never pushed).
Writes the evidence pack to ~/.alignment/hermes-reports/sovsignal-p2-evidence-20261007.md
"""
import hashlib, os, re, subprocess, sys

REPO = "/Users/nicholas/_alignment/site-authority-umbrella-20261002"
CAND = "/Users/nicholas/_alignment/inbox/CODEX_HF_KAGGLE_REVIEW_20261002/review/candidate"
EVID = "/Users/nicholas/_alignment/inbox/CODEX_HF_KAGGLE_REVIEW_20261002/review/evidence"
PIN = "4d450a799dbb5b2a2feb0bd91d516be3c24e49706b6b8c2a6b6c39a36a7eee3b"
OUT = "/Users/nicholas/_alignment/hermes-reports/sovsignal-p2-evidence-20261007.md"
lines = []

def sha(b): return hashlib.sha256(b).hexdigest()

# ── 1) hf-org-card.py: pin-check + apply the 2-line diff ─────────────────────
p = os.path.join(REPO, "scripts/hf/hf-org-card.py")
pre = open(p, "rb").read()
pre_sha = sha(pre)
pin_ok = (pre_sha == PIN)
lines.append(f"## 1. hf-org-card.py 2-line diff (board-context labeling + no-extrapolation)")
lines.append(f"- pinned HEAD sha256 expected `{PIN[:16]}…` — observed `{pre_sha[:16]}…` — pin_match={pin_ok}")
s = pre.decode()
old1 = 'f"**Lid:** {d[\'lid\']}" if d["state"] == "DERIVED" else f"**Lid:** UNCHECKABLE — `GET {API}` did not answer at {as_of}.",'
new1 = 'f"**Board context captured at {as_of}:** {d[\'lid\']}" if d["state"] == "DERIVED" else f"**Board context at {as_of}:** UNCHECKABLE — `GET {API}` did not answer.",'
old2 = '        f"**This repository:** {ONE_LINERS.get(repo, GENERIC_ONE_LINER)}",'
new2 = ('        f"**This repository:** {ONE_LINERS.get(repo, GENERIC_ONE_LINER)}",\n'
        '        "The board context above is a dated source observation, not a new evaluation of this repository or every subject named in its files.",')
applied = 0
if old1 in s:
    s = s.replace(old1, new1, 1); applied += 1
if old2 in s and "dated source observation" not in s:
    s = s.replace(old2, new2, 1); applied += 1
open(p, "w").write(s)
post_sha = sha(open(p, "rb").read())
lines.append(f"- anchors found + replaced: {applied}/2  (post sha256 `{post_sha[:16]}…`)")
comp = subprocess.run([sys.executable, "-c", f"import ast; ast.parse(open({p!r}).read())"], capture_output=True)
lines.append(f"- syntax check after apply: {'PASS' if comp.returncode == 0 else 'FAIL: ' + comp.stderr.decode()[:120]}")

# ── 2) the Layer-O marked block, extracted + ready for the producer ──────────
rd = open(os.path.join(CAND, "hf-layer-o-README.md")).read()
m = re.search(r"(<!-- csoai-layer-o-reader-v1:start -->.*?<!-- csoai-layer-o-reader-v1:end -->)", rd, re.S)
block = m.group(1) if m else ""
blk_path = "/Users/nicholas/_alignment/hermes-drafts/2026-10-07/csoai-layer-o-reader-v1.block.html"
os.makedirs(os.path.dirname(blk_path), exist_ok=True)
open(blk_path, "w").write(block)
lines.append(f"\n## 2. Layer O marked block (csoai-layer-o-reader-v1)")
lines.append(f"- extracted {len(block)} bytes -> {blk_path}")
lines.append(f"- PRODUCER UNLOCATED after bounded hunts (site-authority scripts/hf/*, .github/, org code search for 'csoai-layer-o-reader' = 0 hits). Handover's open item CONFIRMED still open.")
lines.append(f"- merge recipe when found: producer must EMIT this block between the markers (artifact-only edits are overwritten on daily regen).")

# ── 3) run the candidate test suite ─────────────────────────────────────────
lines.append(f"\n## 3. Candidate test suite (12 tests expected)")
for t in ["test_hf_template.py", "test_export.py", "test_reader.py"]:
    r = subprocess.run([sys.executable, os.path.join(CAND, t)], capture_output=True, text=True, cwd=CAND, timeout=120)
    tail = (r.stdout + r.stderr).strip().splitlines()[-1][:100] if (r.stdout or r.stderr) else ""
    lines.append(f"- {t}: rc={r.returncode} — {tail}")

# ── 4) local evidence branch (remote = suspended account — NEVER pushed) ─────
g = lambda *a: subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True)
g("checkout", "-q", "-b", "cloud/sovsignal-p2-20261007")
g("add", "scripts/hf/hf-org-card.py")
g("commit", "-q", "-m", "Lane: SOV-SIGNAL-2 (P2 HF shared template) — hf-org-card board-context labeling + dated-source no-extrapolation line (Codex review 2026-10-02, rebased + applied 2026-10-07)")
c = g("log", "--oneline", "-1").stdout.strip()
lines.append(f"\n## 4. Branch (local-only evidence)")
lines.append(f"- `cloud/sovsignal-p2-20261007` commit: {c}")
lines.append(f"- REMOTE IS THE SUSPENDED CouncilofAI-CSOAI ACCOUNT — never used (red line 7). NOT pushed. Owner applies via the real publication path (M4).")

open(OUT, "w").write("\n".join(lines) + "\n")
print("\n".join(lines))