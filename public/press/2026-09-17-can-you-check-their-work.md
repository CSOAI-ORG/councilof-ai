# Can you check their work?

**Fifteen organisations publish AI evaluation results. Twelve of them keep a public record
of their own mistakes. Not one of them signs a result.**

17 September 2026 · Council of AI (CSOAI Ltd, UK) · nicholas@csoai.org

---

When a lab publishes a number about a model — a jailbreak rate, a task-completion score, an
Elo — a reader has to decide whether to believe it. Peer review does not apply. There is no
auditor. The number arrives as a web page.

So we asked the narrow, answerable version of the question. Not "is the number right?" — we
have no way to know that, and neither does anyone else. Instead: **what can a stranger check
without the publisher's cooperation?**

Five checks. Each one answerable by fetching public bytes.

1. **Signed** — is any published result cryptographically signed, with a key that resolves?
2. **Content-addressed** — is a result identified by a digest of its own bytes, cited by the publisher?
3. **Bank published** — can you read the questions behind a score?
4. **Corrections** — is there a public record of errors the organisation found in *its own* published results?
5. **Recomputable** — can a third party reproduce a published score from published artifacts?

We ran them on fifteen organisations on 17 September 2026, and on ourselves.

## What came back

The corrections column is the good news, and it is close to unanimous. Twelve of the fifteen
keep a public record of their own mistakes — two more keep a partial one, and for a thirteenth
we could not establish it either way. Several are unusually frank about it.
Epoch AI's FrontierMath v2 changelog records corrections to 123 problems in Tiers 1–3 and
addresses errors in 42% of problems overall, with v1 retained as a separate page so earlier
results stay meaningful. Hugging Face wrote "all the errors in the below should be attributed
to us" and removed a whole benchmark rather than keep publishing it. The UK AI Security
Institute footnoted a grading issue and updated a headline cyber result. LiveBench fixed a
scoring bug that had bound judgments to superseded answers and moved one model from 51.0 to
95.0. Vals AI published a correction that drops a model's score from 2.00% to 0.00%.

That is a field that takes accuracy seriously. It is worth saying plainly, because the rest
of this note is about a gap, and the gap is not carelessness.

**The gap is that none of it is bound to the bytes.**

Zero of twelve sign a result. Six of twelve never identify a result by a digest of its own
bytes. Where results *are* pinnable — a CSV in git, a commit in a dataset repo — it is almost
always the reader who has to supply the pin; the publisher does not cite one. Epoch AI says
so themselves: "In the future, we plan to pin each benchmark run to the exact git revision
for full auditability." LiveBench's result commits do carry a valid PGP signature, but the
key is GitHub's own web-flow key, which attests that a commit came through GitHub's web UI
and nothing about who measured what.

Hugging Face is the closest thing to an exception and shows why the distinction matters. Of
5,572 commits in the results dataset, 5,484 carry a signature. But the signing key returns
404 from both keys.openpgp.org and keyserver.ubuntu.com, so `git verify-commit` reports E —
key unavailable — never G. The commits are signed and still not third-party verifiable. The
88 unsigned commits, meanwhile, are where the correction-shaped ones cluster.

So a correction and the result it corrects float free of each other. You can read that a
number changed. You cannot prove which bytes you are holding, or that the copy you fetched
is the copy that was published.

## Why this is the thing to fix

Two organisations show that the rest of it can be done, and done fully. **SWE-bench** publishes
its results as files in git, pins each entry's artifact repository by commit — and ships an
official re-grader, `swebench submit verify`, which re-derives every verdict from the test
output in the submitter's own repository. Its README says it plainly: anyone can check your
submission, no Docker, no re-execution. **HELM** publishes the bank, the harness with the exact
configuration per leaderboard version, and every model output, all anonymously downloadable —
and where its questions are encrypted against crawlers, it publishes the key in the same
directory, so the bank is obfuscated rather than withheld.

Both of them are still NO in the signed column.

Every other column has a defensible reason to be closed. Banks are held back to stop
contamination — Epoch blocks its benchmark path in robots.txt "to avoid contaminating
training datasets"; Apollo publishes its insider-trading prompts in full but others cannot;
Vals AI holds out scored sets "to preserve the integrity and signal of our results." Those
are real trade-offs, argued in public, and we are not going to pretend they are failures.

Signing has no such trade-off. It reveals nothing. It costs one key and one line in a
publish step. It is simply not the custom.

That is the whole finding: the field is careful and unbound. SWE-bench and HELM prove the work
is not the obstacle — they do the hard columns, the expensive ones, in full. The care is real.
The binding is missing.

## Our own row

We put ourselves in the same table, with the same checks, and we did not grade ourselves
kindly.

We are the only YES in the signed column — our measurement cards verify under
`did:web:csoai.org#card-attestation-1`, and a deliberately tampered control was rejected, so
the check was shown capable of failing rather than merely passing. Card ids are the sha256 of
their own canonical body, recomputed and matched.

Against us: our correction register's own `signature_state` reads STALE, and correction
latency is computable for zero of its 58 entries. Our banks are readable, but our grader is
not publicly readable today, because our GitHub organisation returns 404 to logged-out
visitors under an account restriction we are still appealing. We publish that as PARTIAL, not
as YES.

## What we are not saying

This is not a ranking. There is no score, no league table, no ordering — five columns and a
state in each cell. It is not a certification; we measure and we do not certify. It is not a
judgement of research quality, and an organisation can do excellent evaluation work and score
NO in every column here. It is twelve organisations on one day.

And the limitations are the census's own. GitHub code search was unavailable for part of this
work, so a signature embedded inside a JSON field would not have been caught; filenames were
swept exhaustively, file contents were not. Artificial Analysis's changelog is infinite-scroll
and only about three weeks were read, so its corrections cell rests on dataset cards rather
than a complete read. NIST's site search is JavaScript-rendered and could not be queried from
a plain fetch, which is why CAISI's corrections cell is UNCHECKABLE and not NO — absence of
evidence is not evidence of absence, and we hold those apart on purpose. For ARC Prize, three
result-shaped path families we expected (`/results/<model>`, `/replay/<uuid>`,
`/scorecards/<uuid>`) are absent from its 72-entry sitemap; we could not establish that they
exist, so ARC's content-addressed NO is scoped to what the sitemap and repositories expose.

No organisation was contacted. Every cell is public bytes only. We would rather be corrected
than be right by default: if a cell is wrong, tell us and we will change it and record that
we changed it.

## The artifact

The full census — thirteen rows, five columns, every cell carrying its evidence and the UTC
time it was fetched — reads at:

`https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/public/interop/verifiability-census-2026-09-17-v0.2.json`

The first version, covering twelve organisations, is left exactly as it was published at
`…/verifiability-census-2026-09-17.json`. It is superseded, not edited, and v0.2 records what
changed and why.

It is not itself signed, and it says so in its own `unsigned_reason` field: our board signer
runs as OIDC inside GitHub Actions, which is disabled account-wide under a restriction on our
organisation account that we are appealing. The same restriction is why this file is being
served from our Hugging Face mirror rather than from councilof.ai, and why our grader is not
publicly readable today. Publishing an unsigned file about unsigned publishing, and labelling
it, is better than the alternative — and stating why it is unsigned is part of the point.

---

## What we are not the first to do

Two disclosures, because a claim of novelty is a claim like any other and ours did not survive
contact with the literature.

**The paired arm is not a new mechanism, and we are not its originators.** METR's HCAST
(arXiv:2503.17354) and Kwa et al. (arXiv:2503.14499, peer-reviewed at NeurIPS 2025) already run
humans and models on one task bank under identical environments and instructions. What our
artifact does is smaller and should be described as what it is: it reconciles two separately
published arms under a single grading rule, and it holds ungraded attempts apart from wrong
ones. That is the claim the bytes support, and it is the only one we make.

**On the census, the nearest concurrent work is "Evaluation Cards"** (EvalEval Coalition,
arXiv:2606.09809, June 2026, preprint), which audits 101,955 results from 30 organisations and
finds 96.5% missing a minimal reproducibility field. It measures whether a field is *present*.
It never recomputes a score, and it does not examine signing at all. BetterBench (NeurIPS 2024)
scores benchmarks rather than publishers and carries no cryptographic criterion; the Foundation
Model Transparency Index scores model developers, not evaluators, and contains no signature,
checksum or attestation indicator. We searched for someone who had already done this and did not
find them — but three of four literature sources were unavailable during that search, and the
honest statement is "we did not find it", never "it does not exist".

## What changed since this was first published

**17 September 2026, third revision — a correction against ourselves.** The first two versions
of this page said **thirteen of fifteen** organisations keep a public record of their own
mistakes. That was wrong. The census has sixteen rows: fifteen other organisations and our own.
Twelve of the fifteen others are YES on corrections; the thirteenth YES was **us**, counted into
a sentence that was explicitly about everyone else. One word — "organisations" — meant fifteen in
the subject and sixteen in the tally, which is the same defect this page exists to describe.
The same revision corrects "six named third-party models" to eight named model identifiers
across sixteen configurations, and adds the prior-art section above. The artifact's own bytes
were right throughout; the prose over-counted. No cell changed.

**17 September 2026, later the same day.** First published covering twelve organisations. Three
were then added — MLCommons AILuminate, Stanford CRFM HELM and SWE-bench — and two of them
changed the picture in the field's favour. The first version's account of the recomputable
column was drawn from twelve organisations and was harsher than fifteen support: HELM and
SWE-bench are both fully recomputable with no account required, and SWE-bench publishes an
official re-grader. SWE-bench is also the only organisation besides ourselves that is YES on
content-addressing *and* cites the pin itself.

One cell was corrected upward in specificity. ARC Prize's per-attempt model outputs **are**
published — 8,114 files on Hugging Face, which a GitHub-and-website sweep missed. The state
stays PARTIAL because no attempts are published for the semi-private sets the headline numbers
come from. And a new limit was found inside the published half: 16 of those 70 configurations
carry `correct: null` on every attempt. The attempts exist; the grades do not. Anyone treating
"not true" as "wrong" there will print 0.0% against eight named third-party model identifiers,
across sixteen configurations and 1,840 task files. We nearly did
— our own grader did exactly that, twice, before its controls caught it. That measurement is
published separately, with the failing controls, at
`…/public/interop/paired-arm-arc-agi-2-2026-09-17.json`.

The signed column did not move. It is still zero.

---

*Council of AI is CSOAI Ltd, registered in England and Wales, company 16939677, 3rd Floor
86-90 Paul Street, London EC2A 4NE. We measure; we do not certify. Verification is free.*
