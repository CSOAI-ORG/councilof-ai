# Demand — who uses a benchmark-quality register, and which door serves them

Written from what the register actually contains, not from what a market might want. Each row
names the door that exists today; where no door exists it says so rather than inventing one.

| who | what they need from it | the door that serves them | does that door exist |
|---|---|---|---|
| **A procurement or assurance function evaluating a vendor's benchmark claim.** A supplier says "we score X on Y". The buyer has to decide how much that sentence is worth. | Not whether X is a good number — whether Y publishes an interval, an n, a separation rule and an item channel, so the number can be checked at all. That is exactly the `statistics` and `reproducibility` groups. | `GET /interop/benchmark-quality/2026-09-06/register.json`, filtered to the publisher named in the supplier's claim; the cell links to the URL and the hash. | **Yes**, today, free, no account. |
| **A regulator or standards body writing an evaluation requirement.** The EU AI Act's GPAI obligations, ISO/IEC evaluation work, and any procurement standard have to say what "an adequate evaluation" discloses. | A worked, published example of predicates that are answerable from public bytes, plus the empirical answer to "how many publishers meet each one today". The answer here is the interesting part: `statistics` is 0 of 5 for six of the eight, us included. | The register plus `predicate_catalogue`, which is the reusable half. Cite the group definitions, not our counts. | **Yes.** The catalogue is CC-BY-4.0 and designed to be lifted. |
| **A journalist or analyst writing about a leaderboard.** They quote a rank and need to know what the rank rests on. | One line per publisher with a URL behind it, and an explicit statement of what the register does not establish, so the story does not become "Council of AI rates X worst". | The page (`/benchmark-quality`) and the per-publisher card. The card's `not_a_ranking` field exists for this reader specifically. | **Page: not yet** — brief written, route not built. Cards and JSON: yes. |
| **The benchmark publishers themselves.** Seven of them are named. | To see which cell they disagree with, and to fix a page cheaply if the fix is real. Several of these failures are one line of HTML: an as-of date, a licence statement, a link to the item data. | The recompute command in the disclosure notice, and the corrections ledger. | **Yes** — `/api/corrections` and `/contact`. |
| **An agent choosing which leaderboard to ground an answer in.** | Machine-readable, licence-clear, with the provenance of each claim attached. | `/api/benchmark-quality?register=v1`, the A2A skill `benchmark-quality-register`, the `llms.txt` section, and the per-publisher card-v0 leaves. | **Yes.** |
| **A researcher building meta-evaluation.** | The fixtures, the patterns, and the false positives we found in our own instrument. | The HF dataset (`predicates-v1`, `cells-<date>`, `artifacts-<date>`) and the committed fixtures. | **Planned, not pushed.** See `HF-DATASET-PLAN.md`. |

## The honest demand assessment

Nobody has asked for this. There is no measured demand signal for this register — no request,
no inbound, no traffic, and the one number remains what it is. What there *is*, is a gap that
is checkable: none of the seven publishes a meta-evaluation of the others, and none of the
eight rows — ours included — publishes a minimum-n rule on its results surface. That is a
finding, not a market.

The strongest reason to ship it is not demand. It is that a body whose product is measurement
has to be willing to point the instrument at itself first, in public, on the same budget, and
publish the sixteen failures. Everything else this estate says about method is cheaper if that
row does not exist.

## Doors this does NOT justify

- **No paid door.** Verification is free forever, and a grade is never sold. This register is
  read-only, free, CC-BY-4.0, and must stay that way even if someone offers to pay for a row.
- **No "get your row improved" service.** Selling a fix to a publisher we grade would be the
  exact conflict `commercial_offering_disclosed` exists to record about other people.
- **No badge for a publisher that passes.** There is no badge, because there is no passing.
