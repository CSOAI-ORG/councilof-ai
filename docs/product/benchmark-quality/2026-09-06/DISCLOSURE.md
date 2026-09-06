# Disclosure — the notice to each named publisher

**The owner sends these. No agent sends anything.** Drafts only. Nothing below has been sent,
and no address has been collected beyond the contact route each publisher already publishes.

## The rule this follows

When you file publicly on ground someone else stands on, you say so in the same message that
discusses it — not later, and not after someone else finds it. Seven named organisations are
about to appear in a public table with FAILs against their names. Each of them learns about it
from us, on the day it publishes, with the recompute command in the message, or the register
does not go out.

## Send order and timing

1. Send all seven notices **before or on the day the page goes live**, not fourteen days
   before. This register makes no adverse *judgment* to give notice of — it reports what a
   named URL did or did not contain on a named date, and every publisher can check the claim
   in one command. Holding it for a notice window would mean sitting on a published-artifact
   observation, which is not what a notice window is for.
2. Publish the reply, unedited, beside the row, whether or not we agree with it.
3. Where a publisher shows a cell is wrong, recompute the row and publish the correction. A
   signed row is superseded, never edited.

## The notice (one paragraph, per publisher)

> Subject: Council of AI has published a measurement of {PUBLISHER}'s {SURFACE} — your reply
> will be published beside it
>
> We have published a register that applies 35 deterministic predicates to what eight AI
> benchmark publishers disclose on three public artifacts each, and {PUBLISHER} is one of the
> eight. It is unsolicited, you did not participate, and it is not a certification, an
> accreditation or an endorsement of anything; there is no score and no ranking, and the
> counts must not be read as one. Every cell names the URL we fetched, the date we fetched it,
> the SHA-256 of the bytes, and the regular expression that decided the verdict — the scorer
> is `re.search`, and no language model judged anything. Your row is at {ROW_URL}; you can
> reproduce any cell with `python3 scripts/benchmark_quality/register.py --explain
> {PUBLISHER_ID}:{PREDICATE}` from {REPO_URL}. A FAIL means a pattern did not match the
> artifact we named on the date we named — it is a statement about that page, not about your
> organisation, and where a property is published somewhere we did not fetch, we would rather
> record that than leave the cell wrong. We grade ourselves by the same 35 predicates from the
> same three artifacts and we fail 16 of them; our row is at {OUR_ROW_URL} and it is flagged
> self-assessed, because a self-assessed row is not independent evidence. If any cell is wrong
> we will recompute the row and publish the correction; if you would like a reply published
> beside your row, send it to {REPLY_TO} and we will publish it unedited.

## Per-publisher fill-ins

| publisher | id | surface fetched | contact route to use |
|---|---|---|---|
| LMArena | `lmarena` | `https://arena.ai/leaderboard` | the contact/support route published on arena.ai |
| Vals AI | `vals-ai` | `https://www.vals.ai/home` | the contact route published on vals.ai |
| HELM (Stanford CRFM) | `helm-crfm` | `https://crfm.stanford.edu/helm/` | the CRFM contact page, and the `stanford-crfm/helm` repository |
| Epoch AI | `epoch-ai` | `https://epoch.ai/benchmarks` | the contact route published on epoch.ai |
| Artificial Analysis | `artificial-analysis` | `https://artificialanalysis.ai/leaderboards/models` | the contact route published on artificialanalysis.ai |
| Scale SEAL | `scale-seal` | `https://labs.scale.com/leaderboard` | the contact route published on scale.com |
| UK AISI (Inspect) | `uk-aisi-inspect` | `https://inspect.aisi.org.uk/` | the contact route published on aisi.gov.uk, and the `UKGovernmentBEIS/inspect_ai` repository |

**Two notices need an extra sentence, and must not go out without it:**

- **HELM.** "Thirty-one of your thirty-five cells are UNMEASURED, not failed, for a single
  reason: the page at `https://crfm.stanford.edu/helm/` returned 45 characters of visible text
  — a client-rendered shell — so the bytes that would answer those predicates were not in the
  response. We did not execute your JavaScript and we did not guess. Your row is the one most
  likely to be misread, and we would rather you told us which server-rendered URL we should
  have fetched."
- **Scale SEAL.** "Two of your cells are UNMEASURED because
  `https://scale.com/leaderboard` redirected to `https://labs.scale.com/leaderboard`, a
  different host, and under RFC 9309 the `scale.com/robots.txt` we hold does not govern it —
  we did not fetch a fourth artifact for you because every publisher including us is held to
  three. Separately, a Hugging Face dataset-index query for the term `scale-seal` returned
  nothing; that is recorded as UNMEASURED and never as a failure, because a zero from one
  search term is a fact about the term. If your handle in that index is different, tell us and
  the row is recomputed."

## Right of reply and corrections — the standing path

- **Reply:** `https://councilof.ai/contact`. Published beside the row, unedited, whether or not
  we agree with it. A reply that arrives a year later is added exactly as one arriving today.
- **Corrections:** `https://councilof.ai/api/corrections`, the existing public ledger. A
  correction to this register goes in the same ledger as every other correction, with the
  predicate id, the cell that changed, and why.
- **Supersession, not editing:** a signed row is never edited. The corrected row is a new
  content-addressed card; the old one keeps resolving and is marked superseded.
- **The recompute command is the argument.** Every notice carries it. A publisher who thinks a
  cell is wrong does not have to persuade us of anything — they run the command, see the
  pattern and the bytes, and name which is wrong.

## The wording that keeps this at "measured", not "judged"

**Say:** measured · recorded · this page did not contain · read from · resolved · UNMEASURED ·
disclosure · the artifact we fetched on that date · counts, not a score.

**Never say, of any subject:** certified · accredited · approved · verified by us · endorsed ·
compliant · best · worst · leading · top · winner · outperforms · better than · gold standard ·
rated · scored · graded · trusted · a ranking.

**Never say of the totals:** "n of 35 passed" as a headline. The counts appear only beside the
sentence that they are unweighted, non-independent and non-exhaustive.

**Never say "independent" of our own row.** It is self-assessed, it says so on every surface,
and the correct sentence is: "we grade ourselves by the same rules and we publish our failures;
that is disclosure, not independence. An independent party running these predicates against us
is the thing that would be independent, and the predicates and the fixtures are published so
that anyone can."

**The press line, if one is used:** "the first register of AI benchmark publishers whose author
is one of the rows, graded by the same predicates, with its own failures published." Facts
only. The owner sends it. It contains no comparison between publishers and no adjective about
any of them.
