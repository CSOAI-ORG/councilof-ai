# care-membrane-mcp — Glama & wong2/mcp-list Push Report

**Date:** 2026-06-14
**Operator:** CSOAI-ORG (gh CLI authenticated, scopes include `repo`, `delete_repo`, `admin:org`)
**PyPI package:** `care-membrane-mcp` v1.0.11 (LIVE on PyPI)
**GitHub source repo:** https://github.com/CSOAI-ORG/care-membrane-mcp (public)
**Artifacts on disk:** `/Users/nicholas/clawd/mcp-marketplace/care-membrane-mcp/glama-ready.json`, `glama.json`, `llms.txt`

---

## TL;DR

**Both PR pushes BLOCKED — neither target accepts GitHub PRs.**

| Target | Status | Reason |
|---|---|---|
| `glama-ai/registry` | ❌ BLOCKED | Repo does NOT exist on GitHub (HTTP 404). Glama manages its MCP registry through their web UI at https://glama.ai/mcp/servers, not a public GitHub registry. No PR possible. |
| `wong2/mcp-list` | ❌ BLOCKED | Repo does NOT exist on GitHub (HTTP 404). The successor `wong2/awesome-mcp-servers` exists, but its README explicitly states: **"We do not accept PRs. Please submit your MCP on the website: https://mcpservers.org/submit"**. No PR possible. |

**No PRs were opened. No PR URLs to report. None are faked.**

---

## Step 1 — Verify Glama registry GitHub repo

### Commands run

```bash
gh repo view glama-ai/registry 2>&1
# → GraphQL: Could not resolve to a Repository with the name 'glama-ai/registry'. (repository)

gh api repos/glama-ai/registry
# → {"message":"Not Found","documentation_url":"...","status":"404"}

curl -sI https://github.com/glama-ai/registry
# → HTTP/2 404
```

### glama-ai organization facts (confirmed via `gh api users/glama-ai`)

- Type: Organization
- Public repos: 3 (total, all public)
- The 3 actual repos are: `tool-definition-quality-score`, `lightport`, `rjsf-validator-cfworker`
- **No `registry` repo exists.** The 3 existing repos are unrelated to the MCP registry.

### Conclusion — Glama

Glama does not publish its MCP registry on GitHub. Submission happens via the web UI at https://glama.ai/mcp/servers (the website resolves and serves content; we did not POST to it because the task is a GitHub PR task, not a web-form task, and the task brief explicitly says: *"If the repo does NOT exist or is private, skip and write a clear blocker — Glama may not accept GitHub PRs."*)

**Blocker written. No fork attempted, no PR attempted, no fake URL.**

### Recommended next step (out of scope for this PR task)

Manual submission via Glama's web UI: https://glama.ai/mcp/servers → "Submit Server" flow, pasting the contents of `glama-ready.json`. I did not execute this because:
1. It is a web-form action, not a GitHub PR.
2. The task brief only authorises the GitHub PR path.

---

## Step 2 — Verify wong2/mcp-list GitHub repo

### Commands run

```bash
gh repo view wong2/mcp-list 2>&1
# → GraphQL: Could not resolve to a Repository with the name 'wong2/mcp-list'. (repository)

gh api repos/wong2/mcp-list
# → {"message":"Not Found","documentation_url":"...","status":"404"}

curl -sI https://github.com/wong2/mcp-list
# → HTTP/2 404
```

### Investigation of the successor

A search for `mcp-list` and inspection of wong2's repos revealed the modern successor:

- `wong2/awesome-mcp-servers` — public, default branch `main`, 101 KB README.

Fetched the README (`gh api repos/wong2/awesome-mcp-servers/contents/README.md`) and decoded the base64 body. The first non-heading line of the README is:

> # Awesome MCP Servers
>
> > [!NOTE]
> > We do not accept PRs. Please submit your MCP on the website: https://mcpservers.org/submit

**This repo is explicitly PR-free.** The only submission path is the web form at https://mcpservers.org/submit, which is the same site that powers the mcp-list data.

### Conclusion — wong2/mcp-list (and its successor)

- The original `wong2/mcp-list` repo no longer exists.
- Its successor `wong2/awesome-mcp-servers` exists, but explicitly **does not accept GitHub PRs**.
- The intended `gh repo fork` + `gh pr create` flow is not just unsupported — it is explicitly closed by the maintainer.

**Blocker written. No fork attempted, no PR attempted, no fake URL.**

### Recommended next step (out of scope for this PR task)

Manual submission via the official web form: https://mcpservers.org/submit, with entry data from `glama-ready.json` / `llms.txt`.

---

## What WAS verified to be working

- `gh auth status` — active as `CSOAI-ORG` with full `repo`, `delete_repo`, `admin:org` scopes. Auth is fine; the block is not a permissions problem.
- `gh api repos/CSOAI-ORG/care-membrane-mcp` — repo exists and is public, ready to be linked from any submission.
- PyPI `care-membrane-mcp` v1.0.11 — referenced in artifacts; if it is not actually live, the web-form submissions will fail at the PyPI-verification step. (No fresh PyPI check was run in this session; relying on the task context that says "LIVE".)

---

## Files written

- `/Users/nicholas/clawd/CARE_MEMBRANE_GLAMA_WONG2_PUSH_2026-06-14.md` (this file)
- `/Users/nicholas/care-membrane-glama-wong2-result.json` (machine-readable result, see companion file)

---

## Honest summary

- **0 / 2** PRs opened.
- **2 / 2** targets are real, hard blockers — not permission issues, not auth issues, but upstream-policy and repo-existence issues.
- The git artifacts (`glama-ready.json`, `llms.txt`) are on disk and ready to be pasted into the two web forms above when the operator decides to do that work manually.
- **No fake PR URLs.** Reporting blockers honestly is the deliverable here.
