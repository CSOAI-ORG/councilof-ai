# Press drafts — the owner sends, nothing here has been sent

Every file in this directory is a DRAFT. Posting, emailing or submitting any of it is an owner
action. Nothing here has been sent to any list, journalist, registry or repository.

## Why only two of the four suggested announcements exist

An announcement is a claim with a date on it. Two of the four suggested subjects describe events
that **have not happened**, and the artifacts say so:

| subject | state | the command that shows it |
|---|---|---|
| 22 axes measured | **REAL** — drafted | `curl -s https://councilof.ai/api/gspc \| jq -r .totals.public_count` |
| A2A signed-receipts extension | **REAL** — drafted | `curl -sI -L https://councilof.ai/a2a/extensions/signed-receipts/v1/ \| head -1` |
| first settlement | **NOT HAPPENED** | `curl -s https://councilof.ai/api/revenue \| jq .` — every count is null until a receipt settles |
| N sites live | **NOT HAPPENED** | `jq '[.[]\|select(.status=="live")]\|length' scripts/badger/_spray-log-v2.json` → 0; the log holds 24 drafted + 3 queued, all owner-gated |

The two that have not happened are carried as `TRIGGER-*.md`: the announcement is written, and the
first line states the measurement that must be true before it may be sent. That is not caution —
a press release about a settlement that has not settled is a false statement with a date on it,
and this estate publishes its own corrections precisely so that does not happen twice.

`/api/press.json` carries the same refusal in machine-readable form under `not_announced`.
