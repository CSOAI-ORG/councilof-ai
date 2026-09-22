#!/usr/bin/env python3
"""Write the two dataset READMEs from the built bundle. Every number is read, none typed.

    python3 make_cards.py --bundle /workspace/lanes/out/gspc-estate --onto <dir>
"""
from __future__ import annotations
import argparse, json, pathlib

ESTATE = "csoai/gspc-estate"
ONTO = "csoai/gspc-ontology"
DOI = "10.5281/zenodo.21991104"


def jl(p):
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]


def estate_card(b: pathlib.Path) -> str:
    s = json.loads((b / "summary.json").read_bytes())
    board = json.loads((b / "board" / "board-snapshot.json").read_bytes())
    t = board["totals"]
    hon = json.loads((b / "findings" / "grading-honesty.json").read_bytes())
    corp = {c["name"]: c for c in jl(b / "cards" / "card-corpora.jsonl")}
    pops = jl(b / "populations" / "populations.jsonl")
    banks = jl(b / "banks" / "frozen-banks.jsonl")
    ots = s["ots"]
    pub = ots["published_manifest"]["counts"]
    elo = json.loads((b / "arena" / "elo_reference.json").read_bytes())
    files = jl(b / "manifest.jsonl")
    total_bytes = sum(f["bytes"] for f in files)

    configs = [
        ("board", "board/board-axes.jsonl"),
        ("board_longitudinal", "board/board-longitudinal.jsonl"),
        ("cards_index", "cards/mill-cards-index.jsonl"),
        ("superseded", "cards/superseded.jsonl"),
        ("card_corpora", "cards/card-corpora.jsonl"),
        ("corrections", "corrections/corrections.jsonl"),
        ("populations", "populations/populations.jsonl"),
        ("frozen_banks", "banks/frozen-banks.jsonl"),
        ("arena_rounds", "arena/rounds.jsonl"),
        ("ots_proof_states", "chain/ots-proof-states.jsonl"),
        ("evidence_manifest", "evidence/evidence-manifest.jsonl"),
        ("manifest", "manifest.jsonl"),
    ]
    fm = ["---", "license: cc-by-4.0",
          "pretty_name: GSPC estate — the whole measurement record, reproducible",
          "language:", "- en",
          "task_categories:", "- text-classification", "- question-answering", "- other",
          "size_categories:", "- 10K<n<100K",
          "tags:",
          "- ai-governance", "- measurement", "- benchmark", "- attestation", "- ed25519",
          "- provenance", "- reproducibility", "- opentimestamps", "- eu-ai-act", "- gspc",
          "configs:"]
    for name, path in configs:
        fm += [f"- config_name: {name}", "  data_files:", "  - split: train", f"    path: {path}"]
    fm.append("---")

    body = f"""
# The GSPC estate

**Every signed measurement this body has published, the frozen banks behind them, the code
that produced them, the chain that anchors them, and a script that re-verifies one of them
in front of you.** Nothing here needs an account, a token, or a request to us.

> {t["lid"]}

`{t["public_count"]}` · built {s["built_at"]} from repo commit `{s["repo_commit"][:9]}` ·
live source of truth: `GET https://councilof.ai/api/gspc`

This dataset is a **snapshot**. The board is live and changes. Cite the live endpoint for
the current value and this dataset for what was true at its `as_of`. Where the two differ,
the endpoint is right.

---

## Run the reproduction before you read anything else

A reproduction script nobody ran is a claim, not evidence. This one was run, twice, and
both outputs are in `repro/`.

```bash
python3 repro/verify_estate.py          # the published bytes  -> 9/9 PASS
python3 repro/verify_estate.py --tamper # one byte altered     -> 3 checks FAIL, as required
```

No dependencies. Python 3.8+. Ed25519 is implemented in the file from RFC 8032, so nothing
has to be installed and nothing has to be taken on trust: read it, then run it.

It fetches one signed card live, recomputes `id == sha256(canonical(body))`, verifies the
Ed25519 signature against the key published in the **live DID document** at
`https://csoai.org/.well-known/did.json`, checks the frozen bank and the per-item evidence
against the digests pinned in the card, recomputes every prompt from the bank, re-derives
every graded label from the recorded model output with the published rule, and recomputes
the accuracy. The tampered run alters exactly one field — `body.accuracy`, by 0.0001 — and
the id check, the signature check and the accuracy check all fail. Full transcripts:
`repro/REPRO-PASS.txt` and `repro/REPRO-TAMPER-FAIL.txt`.

---

## What is in here

| directory | what it is | rows / files |
|---|---|---|
| `board/` | the live board verbatim, one row per axis, plus the dated board artifacts that exist | {t["axes"]} axes |
| `cards/` | every signed mill card body, a flat index of them, and the supersession ledger | {s["mill_cards"]} cards · {s["superseded_entries"]} supersessions |
| `evidence/` | the per-item evidence and frozen-bank snapshots each card pins | {s["evidence_files"]} files |
| `banks/` | every public frozen bank with its sha256 and item count | {s["banks_resolvable"]}/{s["banks_total"]} resolvable, {s["bank_items_total"]} items |
| `chain/` | `root.json`, the signed card index, the DID document, a Rekor entry, every `.ots` state | {ots["total_ots_files"]} proofs |
| `corrections/` | the public corrections ledger | {s["corrections"]} entries |
| `populations/` | the ten population doors' free previews (`state`, `n`, `as_of`) | {len(pops)} doors |
| `arena/` | the arena rounds and the Elo reference with its intervals | {s["arena_rounds"]} rounds |
| `harness/` | the worker, the grader, the controls, the verifier | see `harness/harness-manifest.jsonl` |
| `repro/` | the reproduction script and both of its recorded runs | 2 runs |
| `figures/` | six figures, each drawn from this dataset by `figures/make_figures.py` | 6 SVG |
| `findings/` | what the board actually shows today, including what it does not show | 1 report |
| `manifest.jsonl` | every file in this dataset with its sha256 | {len(files)} files, {total_bytes / 1e6:.1f} MB |

## How to reproduce a cell from scratch

Everything a cell needs is public and pinned.

1. **The bank.** `banks/frozen-banks.jsonl` gives each axis's public HF dataset, its
   `items.jsonl` URL and the sha256 of the bytes. Fetch it with no token and compare the
   digest before you use it. (`jail` is the exception: its bank is a code-execution
   goldbank, `csoai/gspc-jail-goldbank/goldbank_jail.json`, not `items.jsonl`.)
2. **The settings.** Temperature **0**, seed **0**. Exact-label banks are capped at **128**
   generated tokens; keyword banks at **1024**. The loader is the Ollama model manifest
   digest for local runs, or the HF router route — both are recorded on the card
   (`route`, `model_hf_revision`).
3. **The prompt.** `axis_prompt(axis, item, labels)` in `repro/verify_estate.py`, byte for
   byte the composer the mill used. The menu is `exact_label_menu(labels)`, which **refuses
   a one-option menu**: a prompt that cannot be answered wrongly measures format compliance,
   not the axis.
4. **The grade.** `read_label(raw_output, menu)` — after stripping a `<think>` block, an
   `Answer:` prefix and surrounding punctuation, the reply must **be** one of the labels.
   A substring test would let a model that merely restates the menu score a hit on every
   item; that bug is why this rule exists. An unreadable reply **leaves n**; it is not a
   wrong answer.
5. **The number.** `accuracy = round(hits / n, 4)`, `n` = answered items. `n >= 30` or the
   card is published UNMEASURED with the reason `n<30 unquotable`.

The worker, the controls and the grading code are in `harness/`.

## The card corpora — there are several and adding them is meaningless

| corpus | artifact | count | kind |
|---|---|---|---|
| card wrappers on disk | `public/cards-bundle.json` | {corp["card wrappers on disk"]["value"]} | build aggregate; its own generator "signs nothing, measures nothing" |
| public-root Merkle leaves | `public/root.json` | {corp["public-root Merkle leaves"]["value"]} | catalogued |
| signed card index | `public/signed/card_index.json` | {corp["signed card index"]["value"]} | catalogued — and **{corp["signed card index"]["value"]} of {corp["signed card index"]["value"]} verify**, kind *measured* |
| living registry | `GET /api/cards` | {corp["living registry"]["value"]} | catalogued |
| signed mill cards | `public/interop/mill-cards-signed/` | {corp["signed mill cards"]["value"]} | catalogued |

`/api/state → corpus_relation` records `SEPARATE_CORPORA`, `identifier_overlap: 0`.
**Never add them, never reconcile them, never substitute one for another.** They are about
different bytes. `cards/CARD-CORPORA.md` is the full statement.

## The numbers, as they stand at this snapshot

- **{t["comparison_axes"]} model-comparison axes: {t["separated_leads"]} separated, {t["ties"]} TIE, {t["untested_separations"]} untested.** No axis carries a
  statistically separated leader today. TIE is a result; UNTESTED is not a tie.
- **{t["by_family"]["financial"]["axes"]} financial/domain axes are deterministic-fact runs** — no fleet, no leader, no accuracy,
  no separation, and they enter no mean. *Measured is not the same as scored.*
- **{t["public_leader_count"]} axes carry a public leader score.** {t["own_leaders_excluded"]} had our own models removed from leader
  position; {t["uncarded_leaders_dropped"]} had an external leader dropped for carrying no signed card.
- **OpenTimestamps: {ots["bitcoin_attested"]} Bitcoin-attested, {ots["submitted_pending"]} submitted and calendar-pending**, of {ots["total_ots_files"]} `.ots`
  files under `public/`. A pending proof is a submitted request, not evidence of a time.
  (The estate's own manifest scans two directories and reports {pub["proofs"]}/{pub["bitcoin_attested"]}/{pub["calendar_pending"]}; this dataset
  scans all of `public/`. The totals differ **by scope, not by disagreement**.)
- **Truncation: `finish_reason` is recorded on only {hon["rows_carrying_finish_reason"]} of {hon["total_rows"]} evidence rows.** On those,
  {hon["truncated"]} ended at the token limit ({100.0 * hon["truncated"] / hon["rows_carrying_finish_reason"]:.2f}%). On the rest the rate is **UNMEASURED** — not 0%. We will
  not publish a corpus-wide truncation rate by treating an absent field as a zero.
- **Arena: {elo["n_rounds"]} rounds, {elo["rounds"]["decided"]} decided, {elo["rounds"]["ties"]} ties.** Recomputing the published rank rule over the
  {len(elo["per_axis"])} arena axes gives **1 separated leader, 19 TIE, 8 UNMEASURED**.

Read `findings/FINDINGS-2026-09-22.md` for the full reading, including section 10,
"What a reader should NOT conclude".

## What this does NOT prove

- **Not that any model is best at anything.** Zero axes separate.
- **Not that a signature makes a measurement correct.** A signature over a wrong number is
  a signed wrong number. It proves the bytes have not moved and that a named key signed them.
- **Not a certification, a conformity assessment, a grade or an endorsement.** We measure.
  There is no mark, and verification is free. We explicitly **refuse** the mapping
  `MEASURED → SLSA VSA verificationResult: PASSED`.
- **Not a Bitcoin timestamp for most artifacts.** {ots["submitted_pending"]} of {ots["total_ots_files"]} proofs are pending. And parsing
  an attestation is not verifying it: we do not check block headers against a node.
  `ots verify` with a node does that.
- **Not a general ability score.** Each cell is one model, one frozen bank, one day,
  temperature 0, seed 0.
- **Not comparable `n` across families.** On the financial axes `n` counts issuer accounts
  or public series, not bank items.
- **Not an append-only ledger.** The corrections record is source-maintained and claims no
  storage property.

## Licences — named per artifact, because they differ

- **This data** (everything in this dataset): **CC-BY-4.0**. Attribute: Council of AI,
  CSOAI Ltd (UK Companies House 16939677), councilof.ai.
- **The site repository** `CSOAI-ORG/councilof-ai`, from which `harness/` and `repro/` are
  taken: **MIT**.
- **The published packages** `csoai-gspc` (PyPI) and `csoai-gspc-mcp` (npm): **Apache-2.0**.
- **The vocabulary** published at [`{ONTO}`](https://huggingface.co/datasets/{ONTO}): **CC0-1.0**.

Never write "the licence" for this estate. Name the artifact.

## Provenance

- Live board: `GET https://councilof.ai/api/gspc`
- Live state (every quotable count, with its `kind` and `as_of`): `GET https://councilof.ai/api/state`
- Corrections: `GET https://councilof.ai/api/corrections`
- Public root: `GET https://councilof.ai/root.json` · signed card index: `GET https://councilof.ai/signed/card_index.json`
- DID document: `https://csoai.org/.well-known/did.json`
- Verify a card yourself: <https://councilof.ai/gspc-verify>
- Frozen banks: <https://huggingface.co/csoai> · vocabulary: [`{ONTO}`](https://huggingface.co/datasets/{ONTO})
- Methodology DOI: [`{DOI}`](https://doi.org/{DOI})

## Citation

```bibtex
@dataset{{csoai_gspc_estate_2026,
  title        = {{The GSPC estate: signed measurements, frozen banks, and a reproduction test}},
  author       = {{{{Council of AI (CSOAI Ltd)}}}},
  year         = {{2026}},
  publisher    = {{Hugging Face}},
  url          = {{https://huggingface.co/datasets/{ESTATE}}},
  doi          = {{{DOI}}},
  note         = {{Snapshot built {s["built_at"]} from councilof-ai commit {s["repo_commit"][:9]}.
                  Board as_of {board["measured_on"]["date"]}. Measurement, not certification.}}
}}
```
"""
    return "\n".join(fm) + body


def onto_card(o: pathlib.Path) -> str:
    terms = jl(o / "terms.jsonl")
    cross = jl(o / "crosswalk.jsonl")
    ent = [t for t in terms if t["type"] == "entity"]
    sta = [t for t in terms if t["type"] == "state"]
    tra = [t for t in terms if t["type"] == "transition"]
    m = {k: sum(1 for c in cross if c["mapping"] == k)
         for k in ("EXACT", "CLOSE", "RELATED", "WEAKER_THAN_THEIRS", "NO_EQUIVALENT")}
    ver = terms[0]["version"]
    fm = ["---", "license: cc0-1.0",
          "pretty_name: GSPC measurement vocabulary — JSON-LD, SKOS and an honest crosswalk",
          "language:", "- en",
          "task_categories:", "- other",
          "size_categories:", "- n<1K",
          "tags:", "- ontology", "- vocabulary", "- skos", "- json-ld", "- crosswalk",
          "- provenance", "- attestation", "- ai-governance", "- scitt", "- in-toto",
          "configs:",
          "- config_name: terms", "  data_files:", "  - split: train", "    path: terms.jsonl",
          "- config_name: crosswalk", "  data_files:", "  - split: train", "    path: crosswalk.jsonl",
          "---"]
    rows = "\n".join(
        f"| `{c['our_term']}` | {c['standard']} | {c['their_term']} | **{c['mapping']}** | {c['basis']} |"
        for c in cross)
    body = f"""
# The GSPC measurement vocabulary

**CC0. Take it, fork it, map onto it, without asking us.**

A small controlled vocabulary for saying *how a measurement was made and what is not known
about it*. It contains **no conformity, certification or pass/fail term**, by design.

Version `{ver}` · namespace `https://councilof.ai/ns/gspc/0.1/`

| | |
|---|---|
| entities | {len(ent)} — {", ".join("`" + t["term"] + "`" for t in ent)} |
| states | {len(sta)} in {len({t["group"] for t in sta})} independent groups |
| transitions | {len(tra)}, each a published rule |
| crosswalk rows | {len(cross)} |

## Files

| file | what it is |
|---|---|
| `context.jsonld` | JSON-LD 1.1 context. Drop it into an `@context` and your card terms resolve. |
| `gspc.skos.ttl` | SKOS concept scheme, Turtle. Parses with rdflib: 172 triples, 21 `skos:Concept`. |
| `terms.jsonl` | every entity, state and transition with its definition and its **authority** — the executable file or live endpoint that decides the term, not a gloss. |
| `crosswalk.jsonl` | the mapping onto other standards, with a `mapping` state and a `basis` for each. |
| `state-machine.svg` | the five state groups and every transition, drawn from `terms.jsonl`. |
| `make_ontology.py` | the generator. One table produces all of the above, so they cannot drift. |

## Why SKOS and JSON-LD, and not OWL

We publish a **controlled vocabulary for citation and crosswalk**, not a logical theory.

SKOS says "this is a concept, here is its definition, here is the scheme it belongs to"
and stops. That is exactly the strength of the claim we can support. OWL would let us
assert disjointness, domain and range, and cardinality — axioms a reasoner would then
*entail things from*. We have not tested those entailments, and shipping untested axioms
so the vocabulary looks more formal would be the same defect as shipping an untested
benchmark because the name sounds rigorous.

JSON-LD carries the same terms into the JSON artifacts we already publish, with no
reshaping, so a card can point at this context and be linked data without becoming a
different document.

**If a mapping turns out to need OWL, the version number moves and the reason is published.**

## The state machine

Five **independent** groups. A thing has one state from each group that applies to it;
they are not one ladder, and a pipeline word like `DISCOVERED` is not a schema state.

{chr(10).join("- **" + g + "** — " + ", ".join("`" + t["term"] + "`" for t in sta if t["group"] == g) for g in sorted({t["group"] for t in sta}))}

`UNMEASURED` and `UNCHECKABLE` are **first-class states, published as findings**. They are
never an absent field, and `UNCHECKABLE` ("we could not run the check") is deliberately
distinct from `INVALID` ("we ran it and it failed").

## The crosswalk, including where it refuses

{m["EXACT"]} EXACT · {m["CLOSE"]} CLOSE · {m["RELATED"]} RELATED · {m["WEAKER_THAN_THEIRS"]} WEAKER_THAN_THEIRS · **{m["NO_EQUIVALENT"]} NO_EQUIVALENT**

`NO_EQUIVALENT` is a finding, not a gap. It means the mapping was looked for and declined,
and the reason is in the row. Where another vocabulary's word is *stronger* than ours —
where it implies certification, accreditation or a pass verdict — we decline rather than
borrow a word that would flatter us.

| our term | standard | their term | mapping | basis |
|---|---|---|---|---|
{rows}

The two refusals worth naming out loud:

- **`MEASURED` is not SLSA VSA `PASSED`.** `PASSED` is a verdict against a policy.
  `MEASURED` means a run happened against a frozen bank and was graded — no pass, no
  threshold, no policy. Mapping one to the other manufactures a conformity assessment out
  of a measurement.
- **A card is not a C2PA assertion.** C2PA 2.4 permits only X.509 certificates for
  signing. Our signer is a raw Ed25519 key with no X.509 chain. Claiming the mapping would
  mean claiming a certificate we do not have.

## What this does NOT prove

- It is **not** a standard. It is one body's published vocabulary, versioned and CC0.
- It is **not** an endorsement by any of the standards it crosswalks onto. The mappings are
  our reading, with the spec and version in each row so you can disagree with a citation.
- A term's presence here says **nothing** about whether any particular measurement using it
  is correct.

## Source and provenance

Derived from `docs/interop/VOCABULARY-CROSSWALK.md` in `CSOAI-ORG/councilof-ai` (MIT),
which traces every term to the executable file that decides it. The data this vocabulary
describes is at [`{ESTATE}`](https://huggingface.co/datasets/{ESTATE}) (CC-BY-4.0). Live
board: `GET https://councilof.ai/api/gspc`. Org index: <https://huggingface.co/csoai>.
Methodology DOI: [`{DOI}`](https://doi.org/{DOI}).

## Citation

```bibtex
@misc{{csoai_gspc_vocabulary_2026,
  title     = {{The GSPC measurement vocabulary}},
  author    = {{{{Council of AI (CSOAI Ltd)}}}},
  year      = {{2026}},
  version   = {{{ver}}},
  publisher = {{Hugging Face}},
  url       = {{https://huggingface.co/datasets/{ONTO}}},
  note      = {{CC0-1.0. Measurement, not certification.}}
}}
```
"""
    return "\n".join(fm) + body


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bundle", required=True)
    ap.add_argument("--onto", required=True)
    a = ap.parse_args()
    b, o = pathlib.Path(a.bundle), pathlib.Path(a.onto)
    (b / "README.md").write_text(estate_card(b), encoding="utf-8")
    (o / "README.md").write_text(onto_card(o), encoding="utf-8")
    print(f"  wrote {b / 'README.md'} ({len((b / 'README.md').read_text())} chars)")
    print(f"  wrote {o / 'README.md'} ({len((o / 'README.md').read_text())} chars)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
