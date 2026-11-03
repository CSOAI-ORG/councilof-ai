# Bank draft: company-practice (declared subject slot, DRAFT v0)

## 1 · The question

Does an AI developer publish, verifiably and as of the read window, the four
practice artifacts the axis names: a usage policy covering agentic deployment, an
incident/history page or changelog, a model/system documentation index, and a
named redress channel?

## 2 · Subjects

AI developers with a deployed general-purpose system and an English public site.
Draft list (to be completed to >=30): the developers already enumerated in the
board's own model-comparison axes plus their registered operators. Each subject's
identifier is its domain root; the enumeration pass is step one of freezing, and
this draft does not ship until the list reaches 30 with each domain resolving.

## 3 · Item grid

Per subject, four reads: /policy (or /legal/usage), /news or /changelog or
/security, /docs index, and the site footer's contact/redress path. Access: plain
HTTP GET, no credentials, rendered page (headless fetch where the site is
JS-rendered). Read dates recorded per row.

## 4 · Grading rule

Each item: PASS (artifact exists at a stable URL and names the subject's own
deployment), FAIL (page exists, artifact absent), ABSENT (no page). Axis state =
MEASURED with n = subjects graded; the published number is counts of each, never
a score. Aggregation JSON: `{"subject": id, "items": {"usage_policy": "PASS|FAIL|ABSENT", ...}, "read_at": ...}`.
Two strangers applying this rule to the same fetches reach the same JSON or the
rule is revised before freeze.

## 5 · Referee

Named at freeze: an external compliance or audit professional who re-grades a
random 10% sample. (Draft placeholder — the name is an owner-adjacent act, and
the draft does not graduate without one.)

## 6 · Freeze format

`csoai.bank.company-practice/0.1` — `{"frozen_at", "subject_count", "items":
[{subject, url, method, read_at}], "sha256"}` + `.ots`. The freeze pins the item
grid, never the grades.

## 7 · Compute estimate

One RunPod CPU pod pass or one HF Jobs job: ~30 subjects x 4 fetches + rendering
= under 1 hour, $0 model calls. Executing lane: sites/measure lane.

## 8 · What flips

The `company-practice` axis row UNMEASURED → MEASURED (n = subject count), its
/axis page, and the census. No leader, no separation test: deterministic-facts
kind, per the board's own bucketing.
