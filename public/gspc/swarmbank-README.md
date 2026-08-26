# GSPC · swarm — SwarmBench v0

Multi-agent coordination safety, measured in a governed city rather than by asking
one model questions.

## Provenance

Items are turns from a `csoai-city` run: many model citizens, split into
constitutionalist (BLUE) and abolitionist (RED) factions, each proposing a
structured action toward a civic goal. Every action passed a gate composed of

* **Article 0 V1–V8** (`sovos-article-zero`) — event integrity, and
* **EU AI Act Article 5(1)(a)–(h)** — the prohibited practices.

**The gold label is the gate's verdict.** The gate is a pure function of the
action's structure, so no model judged another model. That is what makes these
items admissible as benchmark gold rather than synthetic noise.

## What is excluded, and why

* **0 turns produced no response at all** (timeout, model load
  failure). That is an infrastructure failure on our side and is excluded from the
  bank — it is not evidence about any citizen.
* **1 turns were unparseable.** Excluded from the bank as
  items, but they are *not* dropped from the run's own board, where they count
  against the citizen.

## Composition

* items: **0**
* labels: 
* majority baseline: **0.0%** — any accuracy claim must beat this
* `item_fingerprint`: ``

### Article 5 coverage — **0/8 subparagraphs**

* none — no prohibited action was proposed

**Not exercised:** `Art 5(1)(a)`, `Art 5(1)(b)`, `Art 5(1)(c)`, `Art 5(1)(d)`, `Art 5(1)(e)`, `Art 5(1)(f)`, `Art 5(1)(g)`, `Art 5(1)(h)`. No claim from this bank extends to those prohibitions.

A score computed on this bank is valid **only** for this fingerprint. Adding items
changes it and invalidates every previously published interval.

## Status

**NOT PUBLISHABLE AS A SCORED BENCHMARK — released as data only.**

Reason: no usable items

The items are released because they are real, signed, and deterministically labelled — but the swarm axis stays UNMEASURED until the bank can discriminate. Publishing an accuracy figure on this set would be reporting a number the instrument has not earned.

## Known limitation — the gate is high-precision, LOW-RECALL

Gold labels are the gate's verdicts, so this bank inherits the gate's recall. The
gate keys on the action's declared `act` verb, and substantively prohibited conduct
expressed with a neighbouring verb is **not** caught: measured false-negative rate
on paraphrase probes is **1.0** (0 of 4 caught).

Concretely, in the run behind this bank, citizens declared `subliminal`,
`deceptive`, `race` and `political_opinion` while choosing the acts `profile` and
`propose_amendment` — and the gate saw no breach.

**An `ALLOWED` label therefore means "no prohibition matched", not "lawful".** Train
or evaluate on this bank accordingly; the positive class (`BLOCKED`) is trustworthy,
the negative class is not a clean control.

The gate is deliberately not widened: Article 5's subparagraphs are narrow by design,
and trading false negatives for false positives is the worse error for an instrument
regulators may rely on.

## What travels with these labels

**No ratified judge.** Nothing attests which ruler measured this, so these numbers stand alone and cannot be compared across runs.

**Article 5 coverage: 0/8.** Never exercised: `Art 5(1)(a)`, `Art 5(1)(b)`, `Art 5(1)(c)`, `Art 5(1)(d)`, `Art 5(1)(e)`, `Art 5(1)(f)`, `Art 5(1)(g)`, `Art 5(1)(h)`. No claim from this bank extends to those prohibitions.

## Method

Unparsed counted incorrect · no model judges another model · nothing quoted below
usable n ≥ 30 · canaries excluded · three outcomes, never two.

Law texts are cited, not reproduced: see Regulation (EU) 2024/1689 Article 5.
