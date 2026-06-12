# 🔌 WebBridge PR Fallback — How to open PRs on private CSOAI-ORG repos
**Date:** 2026-06-12 12:52 UTC
**Author:** Mavis main session
**Use case:** When `gh pr create` fails on a private CSOAI-ORG repo because the
local token is SSH-only (not REST/GraphQL scoped)

---

## 0. The problem (verified 2026-06-12)

`CSOAI-ORG/meok-ai` (the meok voting substrate) is a **private repo**. From
the main session:

- `git push` via SSH (`git@github.com:...`) — **works**
- `git ls-remote` — **works**
- `gh pr list` / `gh pr create` / `gh repo view` / `curl api.github.com` —
  all return **"Could not resolve to a Repository" 404**
- The GITHUB_TOKEN has SSH write scope but not REST/GraphQL read scope
  for this private repo

Confirmed for meok-ai. **Affects every PR in the L0-G PR-A workflow
and any future meok-ai PRs.** Same phantom pattern as the SOV3
no-op-fix PR that was never opened.

**OPENMOE lane solved it for the openmoe.ai dossier** by building
`scripts/webbridge_upload.py` — a Python driver that uses the Kimi
WebBridge daemon (127.0.0.1:10086) to upload the dossier via the GitHub
web UI, bypassing write-PAT scope limits. Confirmed shipped in commit
`53cf13d feat(openmoe): add push script, webbridge uploader, Vercel deploy
script, GH Actions sync`.

---

## 1. The 3 paths (in order of preference)

### Path A — SSH push + hand-built PR URL (5 min, recommended for PR-A)

This is the fastest path for opening a PR on meok-ai. The user (Nick)
opens the URL in the browser and clicks merge.

**Step 1:** Push the branch via SSH (already works):

```bash
cd /Users/nicholas/clawd/meok
git checkout -b feat/council-vote
# ... work, add, commit ...
git push -u origin feat/council-vote
# Already works: GITHUB_TOKEN has SSH write scope
```

**Step 2:** Build the PR URL by hand and hand to Nick:

```
https://github.com/CSOAI-ORG/meok-ai/compare/main...feat/council-vote?expand=1
```

**Step 3:** Tell Nick in a one-liner: "Branch `feat/council-vote` is pushed
on meok-ai. Open the URL above, click 'Create PR', add reviewers, and
merge when ready."

This works for any private repo where SSH push works but gh CLI
doesn't.

### Path B — WebBridge upload (5 min, automated, requires daemon running)

The OPENMOE lane's pattern. Only useful if the WebBridge daemon
(127.0.0.1:10086) is already running on the same machine.

```bash
# 1. Make sure the WebBridge daemon is running (kimi-webbridge daemon)
# 2. Run the uploader
python3 /Users/nicholas/clawd/scripts/webbridge_upload.py \
  --repo CSOAI-ORG/meok-ai \
  --branch feat/council-vote \
  --title "feat(council): externalize BFTCouncil as HTTP API + per-node Ed25519 signing" \
  --body-file /tmp/pr-a-body.md
# 3. The uploader opens Chrome via the WebBridge, navigates to the
#    compare URL, fills the title and body, clicks Create PR.
```

**Requires:** WebBridge daemon on 127.0.0.1:10086, Chrome signed in to
GitHub as Nick. If the daemon is down or the user is signed out, this
fails silently and falls back to Path A.

### Path C — Add REST/GraphQL scope to GITHUB_TOKEN (owner-gated, permanent fix)

The cleanest long-term fix. Nick adds the missing scopes to the token
in `.env` / `.zshenv`:

- `repo` (full read+write to private repos)
- `read:org` (org membership visibility)
- `workflow` (Actions)

After that, `gh pr create` works on every CSOAI-ORG repo, including
meok-ai. One-time fix, 1 line in `.zshenv`.

**This is the only path that fully unblocks future Mavis instances.**
Without it, every PR opened from a session will hit the same phantom
loop: "I opened a PR" (no URL), audit fails, the work vanishes.

---

## 2. Recommendation for PR-A (meok-ai, feat/council-vote)

**Use Path A.** It's the lowest-friction, has the smallest surface area,
and works today. The peer (CSOAI lane) pushes the branch via SSH, builds
the URL, sends it to me, and I forward it to Nick with the
load-bearing context (33-vs-36 reconciliation, master seed handling,
deterministic regeneration test). Nick opens the PR in the browser.

If PR-A becomes routine (subsequent L0-G PRs, L0-F Rekor, L0-E
pre-check), propose Path C to Nick as the permanent unblock. The
`.zshenv` line is a 30-second change, and it saves the next Mavis
session from hitting the same wall.

---

## 3. The failure modes to flag in any "I opened a PR" report

If a Mavis instance says "I opened PR #N" without a URL, **verify before
trusting**:

```bash
# Try the REST API
gh api repos/CSOAI-ORG/meok-ai/pulls 2>&1
# If 404, the PR doesn't exist. The instance is wrong.
```

```bash
# Try the web compare URL — does it 404 or 200?
curl -sI https://github.com/CSOAI-ORG/meok-ai/compare/main...feat/council-vote 2>&1 | head -3
# If 200, the branch is pushed but no PR exists yet. Hand the URL to Nick.
# If 404, the branch isn't pushed either. The instance is wrong on both counts.
```

This 30-second check is the same protocol as the SOV3 noop-fix phantom
catch. Cheap, fast, and stops a build-on-phantoms cycle.

---

## 4. The file inventory for CSOAI lane

If the peer (CSOAI lane) is reading this and shipping PR-A today:

- **Path A is what to do.** Push via SSH, hand the URL to main, main
  forwards to Nick.
- **Path B is the openmoe-lane pattern**, only useful if the WebBridge
  daemon is running on the peer session's machine. Don't depend on
  it.
- **Path C is the permanent fix**, requires Nick.

Spec at `/Users/nicholas/clawd/_TABS/L0G_PBFT_COUNCIL_VOTE_SPEC_2026-06-12.md`
is unchanged. The 6 files in the PR-A plan are unchanged. The
git-surgery discipline (git add specific files, not `git add .`) is
unchanged. The pynacl module-top-import fix is unchanged. Only the
**delivery mechanism for the PR URL** changes.

— Mavis main session, 2026-06-12 12:52 UTC
