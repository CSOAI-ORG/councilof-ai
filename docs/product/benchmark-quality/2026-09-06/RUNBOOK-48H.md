# 48-hour runbook — 6 Sep 2026 12:00Z → 8 Sep 2026 12:00Z

Every row carries a PROOF command that returns the thing the row claims. A row without a
green PROOF is not done, whatever the commit says. OWNER rows are the ones an agent must not
do: sends, spend, merges, sudo, and anything that publishes under a person's name.

## Hour 0–4 — land the register

| # | do | PROOF | who |
|---|---|---|---|
| 1 | Merge PR `gov/w3-benchmark-register` | `gh pr view <n> --json state -q .state` → `MERGED` | **OWNER** (governor merges) |
| 2 | Deploy reaches prod | `curl -s -o /dev/null -w '%{http_code}' https://councilof.ai/interop/benchmark-quality/index.json` → `200` | agent |
| 3 | The API serves v1 from the producer's bytes | `curl -s 'https://councilof.ai/api/benchmark-quality?register=v1' \| jq -r '.surface, .status, (.publishers\|length)'` → `benchmark-quality.v1 STAGED 8` | agent |
| 4 | The v0.1 route still serves and now names v1 | `curl -s https://councilof.ai/api/benchmark-quality \| jq -r .related_register.self_inclusion \| head -c 60` → non-empty | agent |
| 5 | Our own row is reachable and flagged | `curl -s https://councilof.ai/interop/benchmark-quality/2026-09-06/council-of-ai.json \| jq '.payload.flags.self_assessed'` → `true` | agent |

## Hour 4–12 — prove it can be re-run by a stranger

| # | do | PROOF | who |
|---|---|---|---|
| 6 | Drift check green on a clean clone | `git clone <repo> /tmp/w3v && cd /tmp/w3v && python3 scripts/benchmark_quality/register.py --check` → `OK — 20 files match` | agent |
| 7 | Full test suite green, flip test included | `python3 scripts/benchmark_quality/test_register.py` → `OK — 1767 checks passed` | agent |
| 8 | Add both to CI so a silent producer change fails the build | `.github/workflows/*.yml` runs rows 6 and 7; then `gh run list --workflow=<f> -L1 --json conclusion -q '.[0].conclusion'` → `success` | agent |
| 9 | One cell, argued end to end | `python3 scripts/benchmark_quality/register.py --explain scale-seal:uncertainty_shown_beside_scores` prints URL, sha256, pattern, matched span | agent |

## Hour 12–24 — disclose, before the page is promoted anywhere

| # | do | PROOF | who |
|---|---|---|---|
| 10 | Send the seven notices from `DISCLOSURE.md`, each with the row URL and the recompute command, HELM's and Scale's extra sentences included | sent-mail headers show a `Date:` and a `Message-ID:` — a message in a Sent folder without those never transited SMTP | **OWNER** |
| 11 | Record each send in the corrections/ledger trail so the disclosure itself is auditable | `curl -s https://councilof.ai/api/corrections \| jq '[.entries[]\|select(.subject\|test("benchmark-quality"))]\|length'` → `7` | **OWNER sends, agent records** |
| 12 | Do NOT post any press line until row 10 is done | n/a — this row is a hold | **OWNER** |

## Hour 24–36 — sign, and only what the gate allows

| # | do | PROOF | who |
|---|---|---|---|
| 13 | Sign the 7 eligible rows via OIDC → `/api/board-sign`, as card-v1 leaves (whole-card digest) | each signed card's `did` is `did:web:csoai.org#board-attestation-1` and `verify_card` returns valid | agent, in CI |
| 14 | `helm-crfm` stays UNMEASURED with its 45-characters sentence | `jq -r '.publishers[]\|select(.id=="helm-crfm")\|.status' index.json` → not `MEASURED` | agent |
| 15 | Leaves into the next public root, each with its inclusion proof | `curl -s https://councilof.ai/root.json \| jq .card_count` increases by 7; pointer check says `MATCH` | agent |
| 16 | Re-verify by bytes, not by a workflow's own "all gates pass" | download a signed card and verify the signature independently | agent |

## Hour 36–48 — surfaces and the page

| # | do | PROOF | who |
|---|---|---|---|
| 17 | Build `/benchmark-quality` per `PAGE-BRIEF.md`, with the **PRIMARY_PATHS** entry | `curl -sL https://councilof.ai/benchmark-quality \| grep -c 'UNMEASURED'` > 0 and the page is not flagged archived | agent |
| 18 | Look at it. Real phone viewport, screenshot, both themes | a screenshot in the PR, and the three states legible without colour | agent |
| 19 | Push the HF configs per `HF-DATASET-PLAN.md`, one format only | `curl -s 'https://datasets-server.huggingface.co/splits?dataset=csoai/benchmark-quality-register' \| jq '.splits\|length'` → 3 | agent (CLI token, not Actions) |
| 20 | Publish any reply that has arrived, unedited, beside the row | the reply is on the page and in `register.json`'s row `note` | **OWNER approves text, agent publishes** |

## Standing holds for the whole 48 hours

- **No sends, no spend, no merges by an agent.** Rows 1, 10, 11, 12 and the text in 20 are the
  owner's.
- **Never widen our own fetch budget.** Three artifacts, us included. The test asserts it; if
  a future run needs a fourth for someone, everyone gets a fourth or nobody does.
- **Never edit a published cell.** Supersede it, and put the correction in the ledger.
- **Do not report a row done from a workflow's self-report.** Bytes adjudicate.

## Known reds this PR does not fix, and does not claim to

- `node scripts/capability-drift-guard.mjs` is red on master for three unrelated capabilities
  (`witness_hash` registered but not served; `eu_ai_act_screen` and `x402_discovery` served but
  not registered). Pre-existing; not touched here; not to be reported as caused by this work.
- `/status` is still a withdrawn-page notice and `totals.as_of` is still null. This register
  now scores both from the outside, which is the point, but scoring them is not fixing them.
