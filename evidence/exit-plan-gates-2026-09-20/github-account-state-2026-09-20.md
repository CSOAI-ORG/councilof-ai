# GitHub account-state evidence — 2026-09-20

Direct observations (timestamps ~2026-09-20T03:55Z, all recorded live):

| Observation | Result |
|---|---|
| Authenticated API `GET /repos/CSOAI-ORG/councilof-ai` (owner token) | **200** — `private: false`, `default_branch: master`, `pushed_at: 2026-09-20T02:33:17Z` |
| Anonymous API `GET /repos/CSOAI-ORG/councilof-ai` | **404** |
| Anonymous web `GET github.com/CSOAI-ORG/councilof-ai` | **404** |
| Authenticated `POST .../actions/workflows/.../dispatches` | **422 — "Actions has been disabled for this user."** |
| Actions runs (any trigger: push, schedule, dispatch) | none since 2026-09-15T08:06Z |
| Pushes/PR merges via authenticated API | succeed (PRs #2657, #2658 merged 2026-09-20) |

## What this establishes

- The organisation and repository **exist** and accept authenticated writes; git operations work.
- They are **invisible to anonymous access** while the API reports `private: false` — not
  ordinary privacy settings.
- Actions is disabled **at the account/user level**, not the repo level (repo reports
  `enabled: true`, all workflows `active`; even the every-3-hours cron is silent).

## What this does NOT establish

- The cause. "Flagged/restricted account" is consistent with the observations but is an
  interpretation, not a fact. Only an authenticated org-owner diagnosis and/or a GitHub
  Support outcome can establish the cause. Marked **UNKNOWN — owner action required**.
- That anything was deleted. The audit's rejection stands and is now backed by positive
  evidence: anonymous 404 coexists with authenticated 200 + `private: false`.

## Consequence for the exit plan

The plan's premise "GitHub is gone" is false in both directions: the account is neither
verifiably deleted nor verifiably healthy. Public mirrors (HF, PyPI, npm, Zenodo) are
reachable and readable anonymously (see recovery-inventory.json) — they are the current
public evidence surface while GitHub's public visibility and CI are impaired.
