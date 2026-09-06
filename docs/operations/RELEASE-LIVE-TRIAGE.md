# codex/council-release-live — deleted-area triage

**Verdict: nothing in this branch deletes anything that is still on master.**
Measured 2026-09-06 against `origin/master`. Re-run every command below.

## The "61k deletions" in the brief is a three-dot figure, not an effect on master

```bash
B=codex/council-release-live
git diff --shortstat origin/master...$B   # 522 files, 41269 +, 61160 -   <- the brief's number
git diff --shortstat origin/master $B     # 4266 files, 35137 +, 696686 -
git diff --shortstat $B origin/master     # 4266 files, 700270 +, 38721 -
git rev-list --count $(git merge-base origin/master $B)..origin/master   # 510
```

The three-dot number describes **the branch's own history since a fork 510 commits ago**. Master
has since gained **700,270 insertions**. The branch's deletions are of things master has itself
moved past — they are not deletions *of current master*. Reading the three-dot figure as
"this PR would remove 61k lines from the site" is wrong, and it is what made this branch look
like the most dangerous one in the set.

## What it would actually delete from master: 30 files, all already gone

```bash
git diff --diff-filter=D --name-only origin/master...$B | wc -l          # 30
for f in $(git diff --diff-filter=D --name-only origin/master...$B); do
  git cat-file -e "origin/master:$f" 2>/dev/null && echo "STILL ON MASTER $f"; done   # prints nothing
```

All 30 are `.wrangler/state/v3/observability/...` — Cloudflare's local miniflare trace store,
gitignored on master (`.gitignore:29`, *"Local wrangler scratch — build artefacts, never
product"*), and **already absent from master**. Deleting a file that is already deleted is a
no-op.

| area | files deleted | still on master? | verdict |
|---|---|---|---|
| `.wrangler/state/**` | 30 | **no — already gone** | **RETIRE.** Build cache, gitignored, never product. No live URL because it was never served. |
| everything else | 0 | — | nothing else is deleted |

There is no `public/`, `client/`, `functions/` or `docs/` deletion to triage, so there is no
live URL to prove one either way. The per-area keep/retire table the backlog asked for has
exactly one row because the branch has exactly one deleted area.

## What IS landable: one file

```bash
for f in $(git diff --name-only origin/master...$B); do
  git cat-file -e "origin/master:$f" 2>/dev/null || echo "ABSENT $f"; done | grep -v wrangler
# ABSENT docs/handoff/STANDARDS_REPLY_DECISIONS_2026-09-04.md
```

53 lines, landed in this PR. It records SCITT/IETF reply decisions, states **"External
communications: none sent"** and **"Send only after owner review"**, and carries two things
worth keeping:

- a **7 September 2026** Datatracker Last Call date for the CCF Receipt profile — tomorrow;
- an honesty correction — *"It is a local thirteenth email draft, not an IETF `-13` revision"* —
  plus measured figures: 64 generic COSE encodings, 32 RFC-9943 conforming tagged
  serializations, 31 non-baseline forms silently re-serialising to the baseline.

Abandoning the branch would lose a dated draft and a deadline. Landing the doc sends nothing.
