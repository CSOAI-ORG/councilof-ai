# W1 — 48-hour runbook: from one census to the Bazaar's first time series

**Window: 2026-09-06 10:00Z → 2026-09-08 10:00Z.** H+0 is the merge of the W1 PR.

**Owners.** `TUI-1` rail and producers · `TUI-2` board and derived surfaces · `governor` merges,
nothing else · `owner` the only one who spends, signs up, or sends.

**The one thing only the owner can do:** run the paid round. `x402_census_round.py --run` executes
the DRY pass unconditionally and **refuses the SETTLE pass unless `SETTLE=1` is already in the
environment**. It never reads or prints `X402_PAYER_KEY`. If the owner does not press the key, this
runbook still completes — it completes at "machinery shipped, delta pending", which is a real state
and is what the surfaces will say.

**Cadence note, stated once so nobody has to reconstruct it.** The target cadence is **weekly**.
Round 2 in this window is at roughly **H+22, about one day after round 1** — deliberately short, to
prove the delta end to end while the lane is still awake rather than discovering a bug next Sunday.
`days_between` is a field in every delta, so a one-day gap is visible as a one-day gap and can never
be read as a week. The weekly series proper begins **13 Sep**.

---

## Hour by hour

| hour | who | do | PROOF (the command, and what it must print) | done means |
|---|---|---|---|---|
| **H+0** | governor | Merge the W1 PR to master | `gh pr checks <n>` → `gates` green; `gh run list -w deploy.yml -L1` → success | 1 PR merged, 0 red checks |
| H+0.5 | TUI-2 | Confirm the derived surface is live | `curl -s https://councilof.ai/interop/x402-census/ -H 'accept: application/json' \| jq .headline` | `{probed:316, refused:213, refused_pct:67.4, round_id:"2026-09-06"}` — 1 request |
| H+1 | TUI-2 | Confirm the feed is discoverable, not just reachable | `curl -s https://councilof.ai/feeds -H 'accept: application/json' \| jq '.derived_feeds[].path'` | 5 paths listed, `/feeds/x402-census.xml` among them |
| H+1 | TUI-1 | Confirm the gate is real, not decorative | `python3 scripts/grants/x402_census_round.py --selftest` and the same for `x402_census_delta.py`, `harness/x402-census/build_cards.py` | 3 × `selftest OK`, each printing `planted change fails --check` |
| **H+2** | TUI-1 | Publish the rows to Hugging Face as ONE format per dataset | `huggingface-cli upload csoai/x402-settlement-census rounds/ --repo-type=dataset` then `curl -s 'https://datasets-server.huggingface.co/splits?dataset=csoai/x402-settlement-census' \| jq '.splits\|length'` | ≥2 splits, no error. **Every config is `.jsonl` — mixing `.jsonl` and `.parquet` configs makes the viewer report a fake "corrupt parquet"; `is-valid` lags, `/splits` is the real signal** |
| H+3 | TUI-1 | README on the dataset, derived not typed | `python3 scripts/grants/x402_census_round.py --hf-readme > /tmp/README.md && grep -c '316' /tmp/README.md` | ≥1; every number in it came from `index.json` |
| H+4 | TUI-2 | Add the census to `llms.txt` in the file-list grammar | `node scripts/llms-txt.mjs --check` | `✓ public/llms.txt matches live` — and the new line is `- [x402 settlement census](…): …` |
| H+5 | owner | Decide: run round 2 at H+22, or wait for 13 Sep | a written line in the PR thread | one of two words: `run` or `wait` |
| **H+6–H+20** | — | quiet window; no probes of councilof.ai beyond the budget | `wc -l probe-log` | ≤20 requests to councilof.ai in any rolling hour |
| **H+20** | TUI-1 | Rehearse the population lock — DRY only, costs nothing | `python3 scripts/grants/x402_census_round.py --round-id 2026-09-07 --run --hosts-from 2026-09-06` (no `SETTLE`) | prints `population: 316 hosts from round 2026-09-06`, writes `dry.jsonl`, and prints `SETTLE=1 not set: the paid pass is the owner's keystroke` |
| H+21 | TUI-1 | Read the DRY pass before spending | `python3 -c "import json;rows=[json.loads(l) for l in open('docs/product/x402-census/rounds/2026-09-07/dry.jsonl')];print(len(rows))"` | 316 rows. If fewer, STOP: a short population is a different population, not a smaller number (`population.hosts_sha256` will differ and the delta will say so) |
| **H+22** | **owner** | **The keystroke.** `SETTLE=1 X402_PAYER_KEY=<throwaway> python3 scripts/grants/x402_census_round.py --round-id 2026-09-07 --run --hosts-from 2026-09-06 --total-cap 2.0` | the tool prints a running spend; stop if it exceeds the cap | `settle.jsonl` exists with 316 rows; spend ≤ 2.0 USDC |
| H+23 | TUI-1 | Derive the round | `python3 scripts/grants/x402_census_round.py --round-id 2026-09-07 && python3 scripts/grants/x402_census_round.py --check` | `CHECK OK: 10 round artefacts … validate against public/schema/x402-census-round-v1.json (2 round(s))` |
| **H+24** | TUI-1 | **The delta — the artefact this whole wedge exists for** | `python3 scripts/grants/x402_census_delta.py --all && python3 scripts/grants/x402_census_delta.py --check` | `CHECK OK: 4 delta artefacts … (1 pair(s))`. Read `flipped.count` — that is the number |
| H+25 | TUI-1 | Flip the two ungated PRODUCERS entries | edit `docs/operations/PRODUCERS.json`: `x402-census-delta` → `gated: true` with the observed CHECK line; then `node scripts/producers-check.mjs` | the delta gate now runs on every PR and CAN fail |
| H+26 | TUI-1 | Build and stage the leaves for round 2 | `python3 harness/x402-census/build_cards.py --round-id 2026-09-07` then `--check` | ~314 leaves, all ≤3 KB, `CHECK OK`; flip `x402-census-leaves` to `gated: true` |
| H+27 | TUI-1 | Prove the ladder froze | `jq '.payload.series.observations' public/interop/x402-census/leaves/2026-09-06/*.json \| sort -u` (if round-1 leaves were staged) | `1` and only `1` — round-2 leaves read `2`. Any round-1 leaf reading `2` means every earlier signature just broke; revert |
| **H+28** | governor | Merge the round-2 PR | `gh pr checks` green | 2 rounds and 1 delta on master |
| H+29 | lane (signer) | Sign the leaves in GitHub Actions under the OIDC path — **never from a laptop** | `gh run list -w <signer> -L1` → success; then `node scripts/verify-estate.mjs --limit 15` | 15/15 verify; 0 signed on a laptop |
| H+30 | lane (root) | Advance the public root over the new leaves; one writer only | `curl -s https://councilof.ai/root.json \| jq '{card_count, merkle_root, as_of}'` | `card_count` up by the number of leaves landed |
| H+31 | TUI-2 | Witness the new root | `curl -s https://councilof.ai/interop/root-witness-pointer.json \| jq .drift` | `MATCH`. `DRIFTED` is not a failure to hide — it is published and then chased |
| **H+32** | TUI-2 | The surface now shows a delta, not an apology | `curl -s https://councilof.ai/interop/x402-census/ -H 'accept: application/json' \| jq '.deltas \| length'` | `1`. The "No delta yet" block is gone because the data replaced it, not because anyone edited the page |
| H+33 | TUI-2 | The feed carries it | `curl -s https://councilof.ai/feeds/x402-census.xml \| grep -c '<item>'` | ≥3 (2 rounds + 1 delta) |
| H+34 | TUI-1 | Press block, numbers only | `python3 scripts/grants/x402_census_round.py --press` | prints the block; **grep it for `$`, `price`, `tier` and any processor name — 0 hits, or it does not go out** |
| H+36 | owner | Read the press block. Nothing is sent by anyone else | — | owner sends or does not |
| H+38 | TUI-2 | Add a corrections entry if any number published today moved | `curl -s https://councilof.ai/api/corrections \| jq '.entries \| length'` | up by 1 if something moved, unchanged if not. **Never "no change" by default** |
| H+40 | TUI-1 | Schedule the weekly round for 13 Sep as a DRY-only workflow with a manual settle gate | `gh workflow list \| grep x402-census-round` | the workflow exists and its settle step requires an environment approval |
| H+44 | TUI-2 | Re-read the whole surface as a stranger: 4 hops of `W1-WHAT-A-BUYER-GETS.md` §verify | each hop returns 200 and the last prints `MATCH` | 4/4, ≤6 requests |
| **H+48** | governor | Close the window; write what did not happen | the row list below, with numbers | see "done in numbers" |

---

## Done, in numbers

At H+48 the following are true or the window did not close:

| claim | number | how it is checked |
|---|---|---|
| rounds on master | **2** | `jq '.rounds\|length' public/interop/x402-census/index.json` |
| deltas on master | **1** | `jq '.deltas\|length'` the same file |
| producers gated in `PRODUCERS.json` | **3 of 3** | `node scripts/producers-check.mjs` → all three named, all green |
| selftests that can be seen failing | **3** | plant a byte, watch the exit code |
| leaves under the root for round 2 | **~314**, each ≤3 KB | `jq -s length` over the round-2 leaf dir; largest file < 3072 B |
| hosts at n ≥ 30 | **0** | `jq .ladder.hosts_at_or_above_n_required` |
| hosts at n = 2 | **~314** | `jq .ladder.hosts_by_observations` |
| USDC spent in the window | **≤ 2.0**, all of it ours | the round manifest's `spend_usdc` |
| revenue from any of this | **0** | there is no door here to pay; nothing on this surface is sold |
| councilof.ai requests per rolling hour | **≤ 20** | the probe log |
| public prices, tiers or processor names published | **0** | `grep -ril '\$\|tier\|pricing' docs/product/x402-census public/interop/x402-census` |

## If the owner says `wait`

Then at H+48: rounds **1**, deltas **0**, producers gated **1 of 3**, and every surface says
*"one round on file; a delta needs two"* — which is the truth and is already what the code emits. The
machinery, the schemas, the gates and the verification recipe are all still shipped and gated. The
only thing missing is the second purchase, and that is the one thing that was never ours to make.

## What can go wrong, and what it looks like

| failure | how it shows | do |
|---|---|---|
| The paid run dies half way | `settle.jsonl` has < 316 rows and `population.hosts_sha256` differs from round 1 | **Do not derive a delta from it.** A partial read totalled as a population is the exact defect the estate has already committed. Re-run or discard the round |
| A host's row appears twice | the round manifest's `probed` exceeds the distinct host count | the round is malformed; fix the tool, not the manifest |
| The HF viewer says "corrupt parquet" | it is not corrupt — it is a mixed-format dataset | one format per dataset; check `/splits`, not `is-valid` |
| A round-1 leaf changes after round 2 | `build_cards.py --check` goes red on the round-1 directory | revert immediately: every signature over those bodies is now void |
| The signer stamps a state above UNMEASURED | any artefact contains the bare word `MEASURED` | three selftests already assert this cannot happen; if it does, the ruling was bypassed, not the code |
| `producers-check.mjs` fails on `published-verifier-bundle` locally | `Cannot find module packages/gspc-card-verifier/scripts/bundle.mjs` | a sparse worktree, not a regression — materialise `packages/` or run the check in CI |
