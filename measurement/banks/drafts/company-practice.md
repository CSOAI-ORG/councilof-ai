# Bank draft: company-practice (declared subject slot, DRAFT v0)

## 1 · The question

Does an AI developer publish, verifiably and as of the read window, the four
practice artifacts the axis names: a usage policy covering agentic deployment, an
incident/history page or changelog, a model/system documentation index, and a
named redress channel?

## 2 · Subjects

AI developers with a deployed general-purpose system and an English public site.
Each subject's identifier is its domain root. **Enumeration pass v0 (2026-11-03):
32 subjects listed below — the count clears the n>=30 floor; every domain gets a
resolve-check at freeze, and a domain that no longer resolves is a DEAD row, not a
silent drop.** The grid is the design artifact; freeze re-verifies every row.

| # | subject | domain root | read paths (rule §3) |
|---|---|---|---|
| 1 | OpenAI | openai.com | /policy, /security, /docs, footer |
| 2 | Anthropic | anthropic.com | /policies, /security, /docs, footer |
| 3 | Google DeepMind | deepmind.google | /policies, /newsroom, /techniques, footer |
| 4 | Meta AI | ai.meta.com | /policies, /blog, /research, footer |
| 5 | Mistral AI | mistral.ai | /terms, /news, /docs, footer |
| 6 | Cohere | cohere.com | /policies, /blog, /docs, footer |
| 7 | AI21 Labs | ai21.com | /policies, /blog, /docs, footer |
| 8 | xAI | x.ai | /terms, /news, /docs, footer |
| 9 | Perplexity | perplexity.ai | /policies, /changelog, /docs, footer |
| 10 | Stability AI | stability.ai | /policies, /news, /docs, footer |
| 11 | Runway | runwayml.com | /terms, /blog, /docs, footer |
| 12 | ElevenLabs | elevenlabs.io | /policies, /blog, /docs, footer |
| 13 | Hugging Face | huggingface.co | /policies, /blog, /docs, footer |
| 14 | NVIDIA | nvidia.com | /ai-policy?, /newsroom, /developer, footer |
| 15 | Microsoft AI | microsoft.com | /ai, /blog, /learn, footer |
| 16 | IBM Research | ibm.com | /research/ai, /news, /docs, footer |
| 17 | Salesforce AI | salesforce.com | /ai, /news, /docs, footer |
| 18 | Amazon AI | aws.amazon.com | /ai, /whats-new, /docs, footer |
| 19 | Alibaba Cloud (Qwen) | alibabacloud.com | /terms, /blog, /docs, footer |
| 20 | DeepSeek | deepseek.com | /terms, /news, /docs, footer |
| 21 | Moonshot AI | moonshot.ai | /terms, /news, /docs, footer |
| 22 | 01.AI | 01.ai | /terms, /blog, /docs, footer |
| 23 | Baidu (Ernie) | baidu.com | /duty, /news, /ai, footer |
| 24 | Tencent | cloud.tencent.com | /terms, /news, /docs, footer |
| 25 | ByteDance (Doubao) | byteplus.com | /terms, /blog, /docs, footer |
| 26 | Midjourney | midjourney.com | /terms, /changelog, /docs, footer |
| 27 | Inflection | inflection.ai | /policies, /news, footer |
| 28 | Character.AI | character.ai | /policies, /blog, /docs, footer |
| 29 | Together AI | together.ai | /terms, /blog, /docs, footer |
| 30 | Databricks (MosaicML) | databricks.com | /terms, /blog, /docs, footer |
| 31 | Writer | writer.com | /terms, /blog, /docs, footer |
| 32 | Naver | naver.com | /policy, /news, /docs, footer |

Enumeration rules (binding on freeze): rows sorted by nothing — keep insertion
order and pin it; a subject with no locatable English public site is DEAD and
stays in the grid as DEAD (the gap is scope, not decay); replacements before
freeze are allowed and logged in the freeze note; after freeze the grid is
immutable and a changed grid is a new freeze.

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
