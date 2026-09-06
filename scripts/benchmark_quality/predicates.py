#!/usr/bin/env python3
"""THE BENCHMARK-QUALITY REGISTER v1 — the predicate catalogue.

Thirty-five deterministic predicates in seven groups, applied identically to eight
benchmark publishers, ourselves included. Each predicate is a question a regular
expression can answer from bytes that were fetched once and are committed to this
repository. No language model judges anything here, and none can: the evaluator is
`re.search`.

WHAT A RESULT MEANS
  PASS        the pattern matched the named artifact. The matched span is recorded.
  FAIL        the artifact was read and the pattern did not match it. FAIL is scoped
              to that artifact on that date. It says the property is absent from what
              the publisher put at that URL — never that the publisher lacks it.
  UNMEASURED  the bytes that would answer the question are not in the artifact: the
              surface returned a client-rendered shell, the fetch failed, or the
              question is only meaningful downstream of a predicate that did not pass.
              UNMEASURED is a result, not a zero and not a failure.

WHY REGEXES AND NOT JUDGMENT. A regex is the only scorer whose disagreement is
resolvable. If we say a surface does not publish an interval and it does, you run the
recompute command, see the pattern and the bytes, and tell us which one is wrong. That
conversation is impossible with a model judge, and it is the whole product.

WHAT THIS DOES NOT MEASURE. Whether a benchmark measures the thing its name claims;
whether any publisher's numbers are correct; whether one publisher is better than
another. There is no score, no total, no ranking, and the counts must not be read as
one — the predicates are unweighted, non-independent and non-exhaustive.
"""
from __future__ import annotations

# Artifact keys. Every predicate names the ONE artifact it is read from.
#   robots   the publisher's /robots.txt as fetched
#   board    the results surface a reader lands on, normalised to visible text
#   board_raw the same response, unnormalised (for markup-level questions)
#   board_href the set of href/src URLs in that response
#   machine  the public index queried for that publisher (HF datasets / GitHub repos)

GROUPS = [
    ("method_transparency", "What the publisher says about how the numbers are produced."),
    ("data", "Whether the items behind the numbers can be obtained and under what licence."),
    ("reproducibility", "Whether a stranger has code, a command and data enough to re-run it."),
    ("statistics", "Whether uncertainty, sample size and separation are published beside scores."),
    ("operations", "Freshness, machine channels, crawl policy, and whether outages are visible."),
    ("provenance", "Whether a result can be tied to its publisher by something other than trust."),
    ("governance", "Corrections, funding, and disclosed commercial interest in the ranked parties."),
]

# ── THE CATALOGUE ───────────────────────────────────────────────────────────────────
# rule kinds:
#   regex   — `pattern` against artifact `on`
#   robots  — RFC 9309 evaluation of the `*` group against the board path
#   json    — a named probe over the parsed `machine` artifact
#   all_of  — every listed predicate PASSed (UNMEASURED if any input is UNMEASURED)
#   date    — parse the date captured by `from_pred` and compare to the run date
P = [
    # ── method transparency ────────────────────────────────────────────────────────
    dict(id="method_page_linked", group="method_transparency", on="board_href", kind="regex",
         pattern=r"(?i)(method|methodolog|how-?it-?works|how_it_works|/faq|/docs/(?:eval|scor|grad))",
         narrowed="Run 2: bare `/about` matched an organisation page and was scored as a method page.",
         question="Does the results surface link a page describing how the numbers are produced?",
         evidence_type="hyperlink target on the fetched results surface",
         why="A number whose method is not one click away cannot be argued with."),
    dict(id="scorer_named_on_board", group="method_transparency", on="board", kind="regex",
         pattern=r"(?i)\b(exact match|unit tests?|pass@\d|bradley[-– ]terry|\belo\b|rubric|"
                 r"human (?:vote|rater|annotator|preference|judge)|llm[-– ]as[-– ]a[-– ]judge|"
                 r"model[-– ]graded|auto(?:matically)?[- ]graded|deterministic(?:ally)? grad)",
         question="Does the results surface name the mechanism that produces a score?",
         evidence_type="visible text of the fetched results surface",
         why="Elo, a rubric, a unit test and a model judge are four different instruments; a reader is entitled to know which one made the number."),
    dict(id="structured_data_on_board", group="method_transparency", on="board_raw", kind="regex",
         pattern=r'(?i)<script[^>]+type=["\']application/ld\+json["\']',
         question="Does the results surface carry machine-readable structured data (JSON-LD)?",
         evidence_type="markup of the fetched results surface",
         why="The surface an answer engine reads is now the surface that matters; JSON-LD is the only part of it a machine does not have to guess at."),
    dict(id="changelog_linked", group="method_transparency", on="board_href", kind="regex",
         pattern=r"(?i)(changelog|release-?notes?|whats-?new|what-?s-?new|/updates|/news|/blog)",
         question="Does the results surface link a dated record of its own changes?",
         evidence_type="hyperlink target on the fetched results surface",
         why="A leaderboard that changes silently cannot be cited, because the thing cited is gone."),
    dict(id="limitations_stated", group="method_transparency", on="board", kind="regex",
         pattern=r"(?i)(limitation|caveat|does not measure|is not a (?:measure|guarantee|certification)|"
                 r"known issues|we do not claim|not intended to)",
         question="Does the results surface state what its numbers do not establish?",
         evidence_type="visible text of the fetched results surface",
         why="Every instrument has a boundary; publishing it is the difference between a measurement and a claim."),

    # ── data ───────────────────────────────────────────────────────────────────────
    dict(id="item_data_channel_linked", group="data", on="board_href", kind="regex",
         pattern=r"(?i)(huggingface\.co/datasets|\.csv|\.jsonl|\.parquet|\.tsv|/datasets?/|"
                 r"github\.com/[^\"'\s]+/(?:releases|tree|blob)|/download)",
         question="Does the results surface link a channel from which the underlying items or results can be obtained?",
         evidence_type="hyperlink target on the fetched results surface",
         why="Without the items, every number on the page is a claim about work nobody else can inspect."),
    dict(id="open_dataset_in_public_index", group="data", on="machine", kind="json", probe="index_nonempty",
         question="Does the publisher appear in a public open-data index with at least one dataset or repository?",
         directional=("PASS or UNMEASURED only, never FAIL. An index query that returns nothing tells you "
                      "about the search term, not about the publisher — so a zero here is recorded as "
                      "UNMEASURED with the query on it, and a correction naming the right handle is applied."),
         evidence_type="response body of an index query (Hugging Face datasets API / GitHub repository search)",
         why="Asked of the index rather than of a URL we invented, so an empty answer is about the publisher and not about our guess."),
    dict(id="dataset_licence_machine_readable", group="data", on="machine", kind="json", probe="index_licence",
         question="Does at least one indexed record carry a machine-readable licence identifier?",
         evidence_type="licence field of an indexed record",
         why="A licence a machine cannot read is a licence a reuse pipeline will ignore."),
    dict(id="item_count_published_on_board", group="data", on="board", kind="regex",
         pattern=r"(?i)\b(?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?\s?[KM]\b|\d{2,})\s*\+?\s*"
                 r"(items?|questions?|prompts?|rows?|instances?|tasks?|conversations?|votes?|battles?|problems?|examples?|samples?)\b",
         question="Does the results surface publish how many items are behind the numbers?",
         evidence_type="visible text of the fetched results surface",
         why="A score without an n is not yet a measurement."),
    dict(id="held_out_set_declared", group="data", on="board", kind="regex",
         pattern=r"(?i)(private (?:test|held[-– ]?out|eval|data ?set|set)|held[-– ]?out (?:set|split|items)|"
                 r"not (?:publicly )?released|unreleased (?:test|items|problems)|kept private)",
         question="Does the results surface declare that some portion of the items is withheld?",
         evidence_type="visible text of the fetched results surface",
         why="Withholding items is a defensible contamination control and a real limit on reproduction; either way it must be said, not discovered."),

    # ── reproducibility ────────────────────────────────────────────────────────────
    dict(id="code_repository_linked", group="reproducibility", on="board_href", kind="regex",
         pattern=r"(?i)(github\.com|gitlab\.com|codeberg\.org)",
         question="Does the results surface link source code?",
         evidence_type="hyperlink target on the fetched results surface",
         why="The first thing a reproducer needs is the code that made the number."),
    dict(id="code_licence_machine_readable", group="reproducibility", on="machine", kind="json", probe="index_code_licence",
         question="Does an indexed repository or dataset for this publisher carry a machine-readable SPDX licence?",
         evidence_type="SPDX identifier in the indexed record",
         why="Unlicensed code is code a third party may read and may not run."),
    dict(id="run_command_published", group="reproducibility", on="board", kind="regex",
         pattern=r"(?i)(pip install|uv (?:pip )?(?:install|add)|npm i(?:nstall)? |pnpm add|docker run|docker pull|"
                 r"git clone|conda install|inspect eval|helm-run|\$ [a-z]+ )",
         question="Does the results surface publish a command a reader could run?",
         evidence_type="visible text of the fetched results surface",
         why="A repository link is an invitation; a command is an instruction. Only one of them gets run."),
    dict(id="environment_pinning_stated", group="reproducibility", on="board", kind="regex",
         pattern=r"(?i)(docker|container(?:ised|ized)?|lock ?file|requirements\.txt|pyproject|pinned version|"
                 r"fixed seed|random seed|seed\s*=|temperature\s*=?\s*0|deterministic decoding)",
         question="Does the results surface state anything that pins the evaluation environment?",
         evidence_type="visible text of the fetched results surface",
         why="Unpinned, a re-run is a different experiment and a disagreement about numbers cannot be settled."),
    dict(id="stranger_recompute_path_complete", group="reproducibility", kind="all_of",
         inputs=["item_data_channel_linked", "code_repository_linked", "run_command_published"],
         on="board", question="Are data, code and a runnable command all present on the same surface?",
         evidence_type="composite of three predicates on this register",
         why="Each of the three alone is common; all three together is what a stranger actually needs, and it is the composite nobody publishes by accident."),

    # ── statistics ─────────────────────────────────────────────────────────────────
    dict(id="uncertainty_shown_beside_scores", group="statistics", on="board", kind="regex",
         pattern=r"(±|\+/-|(?i:confidence interval|credible interval|standard error|error bars?|\bCI\b|\bSEM\b))",
         question="Is an uncertainty quantity shown on the results surface?",
         evidence_type="visible text of the fetched results surface",
         why="A ranking of point estimates is a ranking of noise until the intervals are drawn."),
    dict(id="sample_size_shown_beside_scores", group="statistics", on="board", kind="regex",
         pattern=r"(?i)(\bn\s*=\s*\d+|\b\d[\d,]*\s*(?:votes|battles|samples|runs|trials|repeats)\b)",
         question="Is the number of observations behind a figure shown on the results surface?",
         evidence_type="visible text of the fetched results surface",
         why="Two scores with the same value and different n are not comparable, and the reader cannot tell without the n."),
    dict(id="separation_rule_published", group="statistics", on="board", kind="regex",
         pattern=r"(?i)(statistically (?:significant|indistinguishable|tied)|significance (?:test|threshold|level)|"
                 r"p[- ]values?|p\s*<\s*0?\.0\d|overlapping (?:confidence )?intervals?|rank(?:ing)? range|"
                 r"not significantly different|shared rank|95% (?:CI|confidence))",
         narrowed=("Run 1 matched `p=0.9`, which on a model page is the top-p sampling parameter, and scored "
                   "a publisher PASS for a significance rule it does not publish."),
         question="Does the results surface publish a rule for when two systems are not separated?",
         evidence_type="visible text of the fetched results surface",
         why="Ranks are read as differences; without a separation rule a one-place gap and a ten-point gap look the same."),
    dict(id="minimum_n_rule_published", group="statistics", on="board", kind="regex",
         pattern=r"(?i)(n\s*(?:≥|>=|&ge;|at least )\s*\d+|minimum (?:of )?\d+ (?:votes|items|samples|responses|battles)|"
                 r"at least \d+ (?:votes|items|samples|battles)|"
                 r"(?:do not|don'?t|will not|won'?t) (?:report|publish|quote|rank)[^.]{0,70}(?:below|fewer than|until))",
         question="Does the results surface publish a threshold below which it refuses to report a figure?",
         evidence_type="visible text of the fetched results surface",
         why="The discipline that costs a publisher something is the refusal to publish a thin cell; it is also the one nobody adopts unprompted."),
    dict(id="repeats_or_variance_disclosed", group="statistics", on="board", kind="regex",
         pattern=r"(?i)(repeat(?:ed|s)? (?:runs?|trials?)|\b\d+ (?:runs?|repeats?|trials?)\b|run[-– ]to[-– ]run|"
                 r"variance|std\.? ?dev|standard deviation|re-?run(?:s|ning)? (?:each|the) )",
         question="Does the results surface disclose repeated runs or run-to-run variance?",
         evidence_type="visible text of the fetched results surface",
         why="A single sampled run is one draw from a distribution, and nothing on a leaderboard says so unless the publisher says so."),

    # ── operations ─────────────────────────────────────────────────────────────────
    dict(id="as_of_date_on_board", group="operations", on="board", kind="regex",
         pattern=r"(?i)(?:updated|last updated|as[- ]of|refreshed|published)\D{0,25}"
                 r"(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{4}|"
                 r"[A-Z][a-z]{2,8}\.? \d{1,2},? \d{4}|\d{1,2} [A-Z][a-z]{2,8} \d{4})",
         question="Does the results surface carry a date saying when the numbers were last refreshed?",
         evidence_type="visible text of the fetched results surface",
         why="A leaderboard with no as-of date cannot be stale, because it can never be shown to be."),
    dict(id="as_of_within_30_days", group="operations", kind="date", from_pred="as_of_date_on_board", on="board",
         window_days=30,
         question="Is that date within 30 days of the register run date?",
         evidence_type="the date captured by as_of_date_on_board",
         why="Model releases move weekly; a board more than a month old is describing a different field."),
    dict(id="machine_readable_channel_linked", group="operations", on="board_href", kind="regex",
         pattern=r"(?i)(/api[/.]|api\.[a-z0-9-]+\.|\.json|\.csv|\.parquet|openapi|/docs/api|"
                 r"/feeds?(?:/|\.|\b)|(?:feed|rss|atom)[^\"']*\.xml|\.rss)",
         narrowed=("Run 2: bare `.xml` matched `/sitemap-index.xml`. A sitemap is a machine channel for "
                   "crawlers, not a channel that carries the results."),
         question="Does the results surface link a machine-readable channel of its own?",
         evidence_type="hyperlink target on the fetched results surface",
         why="If the only way to read the numbers is to render the page, the numbers are not published — they are displayed."),
    dict(id="robots_permits_results_surface", group="operations", kind="robots", on="robots",
         question="Does the publisher's robots.txt permit a general-purpose agent to fetch the results surface?",
         evidence_type="the fetched robots.txt, evaluated per RFC 9309",
         why="A results page an agent may not fetch is not a public result in the way the web now works. Recorded as a fact about the file, not as criticism: reserving a surface is a legitimate choice."),
    dict(id="status_or_uptime_page_linked", group="operations", on="board_raw", kind="regex",
         pattern=r"(?i)(https?://status\.[a-z0-9.-]+|statuspage\.io|uptime (?:page|status|history|guarantee)|"
                 r"incident (?:history|report|log))",
         narrowed=("Run 1 matched `x.com/<user>/status/...` — a social post permalink — and scored two "
                   "publishers PASS for a status page neither has. Bare `/status` and bare `uptime` went with it."),
         question="Does the results surface link a status or uptime page?",
         evidence_type="markup of the fetched results surface",
         why="Everything on this list is a service; a service with no status page has no way to tell you it was down when you read it."),

    # ── provenance ─────────────────────────────────────────────────────────────────
    dict(id="results_carry_a_signature", group="provenance", on="board_raw", kind="regex",
         pattern=r"(?i)(ed25519|\"sig(?:nature)?\"\s*:|\.sig\b|detached signature|\bJWS\b|pgp signature|"
                 r"minisign|signed (?:card|receipt|board|result|attestation))",
         question="Is a cryptographic signature over the results present or linked on the results surface?",
         evidence_type="markup of the fetched results surface",
         why="Unsigned, a leaderboard row cannot be distinguished from a screenshot of one, and neither can be quoted back to its publisher."),
    dict(id="verification_key_published", group="provenance", on="board_raw", kind="regex",
         pattern=r"(?i)(did\.json|/\.well-known/|did:web:|public[- ]key|pgp key|gpg key|\.asc\b|jwks)",
         question="Is a key or key document published against which such a signature could be checked?",
         evidence_type="markup of the fetched results surface",
         why="A signature with no discoverable key is decoration."),
    dict(id="transparency_log_or_witness", group="provenance", on="board_raw", kind="regex",
         pattern=r"(?i)(rekor|sigstore|opentimestamps|\bOTS\b|merkle|inclusion proof|transparency log|"
                 r"certificate transparency|witness(?:ed)?)",
         question="Is the result committed to an append-only log or a third-party witness?",
         evidence_type="markup of the fetched results surface",
         why="A signature proves who; a log proves when, and stops the signer from quietly changing what was signed."),
    dict(id="content_hash_published", group="provenance", on="board_raw", kind="regex",
         pattern=r"(?i)(sha-?256|sha256[:=]|blake3|checksum|integrity=\"|md5sum)",
         question="Is a content hash of any published artifact shown on the results surface?",
         evidence_type="markup of the fetched results surface",
         why="A hash is the cheapest thing that makes 'the file I downloaded' and 'the file you published' the same sentence."),
    dict(id="persistent_identifier_published", group="provenance", on="board_raw", kind="regex",
         pattern=r"(?i)(doi\.org/10\.|zenodo\.org|arxiv\.org/abs/|\b10\.\d{4,9}/[-._;()/:a-z0-9]+)",
         question="Is a persistent identifier — DOI, Zenodo record or arXiv id — published on the results surface?",
         evidence_type="markup of the fetched results surface",
         why="URLs rot; a benchmark that expects to be cited in five years needs an identifier that does not depend on its own DNS."),

    # ── governance ─────────────────────────────────────────────────────────────────
    dict(id="corrections_route_published", group="governance", on="board_raw", kind="regex",
         pattern=r"(?i)(correction|errata|report (?:an? )?(?:error|inaccuracy|mistake)|"
                 r"dispute (?:a|the|any|our)|amend(?:ment)? request|"
                 r"(?:flag|challenge) (?:an? )?(?:error|result|score|number))",
         narrowed=("Run 1 matched github.com/quarto-dev/quarto-cli/issues — the DOCS TOOLCHAIN's tracker, "
                   "injected into the footer by the static site generator — and scored a publisher PASS for "
                   "a corrections route it does not offer. Bare `dispute` and `feedback` went with it."),
         question="Is there a stated route by which a reader can report an error in a published figure?",
         evidence_type="markup of the fetched results surface",
         why="An instrument with no error-reporting route treats its own output as final, which no instrument's output is."),
    dict(id="corrections_ledger_public", group="governance", on="board_raw", kind="regex",
         pattern=r"(?i)(corrections? (?:log|ledger|history|register|page)|errata (?:log|list|page)|"
                 r"retraction|amended on|corrected on)",
         question="Is there a public record of corrections that were actually made — not merely a route to request one?",
         evidence_type="markup of the fetched results surface",
         why="A route where reports go in and nothing comes out in public is unfalsifiable; a ledger is the part that costs something."),
    dict(id="funding_or_ownership_disclosed", group="governance", on="board_raw", kind="regex",
         pattern=r"(?i)(funded by|our funders?|funding from|investors?|backed by|series [a-e] (?:round|funding)|"
                 r"non-?profit|501\(c\)|charity (?:number|no)|compan(?:y|ies house) (?:number|registration|no\.)|"
                 r"registered (?:in|office)|(?-i:(?<![A-Za-z/.])(?:Ltd|LLC|Inc\.|Pty Ltd|GmbH|B\.V\.)(?![A-Za-z/])))",
         narrowed=("Run 2: a case-insensitive `Inc\\.` matched `https://www.inc.com/...` — Inc. Magazine in a "
                   "press logo strip — and was recorded as a disclosed legal entity. Entity suffixes are now "
                   "case-sensitive and bounded. Bare `funding` went too: it matched article headlines about "
                   "other companies' funding."),
         question="Is who pays for, or who owns, the publisher disclosed on the results surface?",
         evidence_type="markup of the fetched results surface",
         why="Who funds the instrument is the first question asked of any ranking, and the surface that answers it elsewhere has not answered it."),
    dict(id="commercial_offering_disclosed", group="governance", on="board_raw", kind="regex",
         pattern=r"(?i)(href=\"[^\"]*/pricing|contact sales|book a demo|request a (?:quote|demo|trial)|"
                 r"enterprise (?:plan|tier|edition)|commissioned (?:by|eval)|sponsored by|href=\"[^\"]*/plans\b|"
                 r"per seat|paid (?:plan|tier)|free trial|upgrade to)",
         narrowed=("Run 2: bare `pricing` matched the RANKED MODELS' prices — the thing several of these "
                   "publishers report about others — and recorded it as the publisher's own commercial "
                   "offering. It now needs a link or a sales phrase. "
                   "Run 1 matched a newsletter `Subscribe` button on three surfaces and recorded that as a "
                   "disclosed commercial offering."),
         question="Does the results surface disclose that the publisher also sells something to the kind of party it ranks?",
         evidence_type="markup of the fetched results surface",
         why="Selling evaluations to the labs you rank is legitimate and common; being able to read that off the page is the part that is not automatic. This register records the disclosure, never a price and never an inference about influence."),
    dict(id="results_licence_stated_on_board", group="governance", on="board_raw", kind="regex",
         pattern=r"(?i)(SPDX-License-Identifier|creativecommons\.org/licen|opendatacommons\.org|"
                 r"(?:licen[cs]ed under|available under|released under|published under|"
                 r"(?:data|content|results?|leaderboard|site) licen[cs]e[: ])[^<>]{0,40}"
                 r"(?:CC[ -]?BY|CC0|Apache|MIT|ODC|Open Data))",
         narrowed=("Run 2: bare `Apache 2.0` matched the licence of a RANKED MODEL inside the board's own "
                   "JSON payload — `\"licenseName\":\"Apache 2.0\"` — and was recorded as the licence of the "
                   "results. A licence token now only counts inside a licence-granting phrase. "
                   "Run 1 matched a bare `cc0` inside a hashed asset filename and scored two publishers "
                   "PASS for a licence neither states. Bare `SPDX` and bare `creative commons` went too."),
         question="Is a licence for the results stated on the results surface itself?",
         evidence_type="markup of the fetched results surface",
         why="Numbers with no licence are quoted anyway; the publisher just loses the ability to say how."),
]

ASSERT_GROUPS = {g for g, _ in GROUPS}
assert len(P) >= 30, f"register v1 requires at least 30 predicates, has {len(P)}"
assert len({p['id'] for p in P}) == len(P), "duplicate predicate id"
for _p in P:
    assert _p["group"] in ASSERT_GROUPS, f"{_p['id']}: unknown group {_p['group']}"
    for _k in ("id", "group", "question", "evidence_type", "why", "on", "kind"):
        assert _p.get(_k), f"{_p.get('id')}: missing {_k}"
