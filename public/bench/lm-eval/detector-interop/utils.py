"""The GSPC grader for this axis — a port of the estate's own read_label.

DO NOT REWRITE THIS RULE. The board's signed cards were produced with
harness/gspc-top100/mill_hub_queue.py read_label. This is the same rule, in the shape
lm-eval needs, and scripts/surface/lm-eval-parity.node-test.mjs proves the two agree case
for case over the estate's own fixtures — including the two regressions the old predicate
got wrong.

The rule, in the mill's own words:

    We told the model to reply with exactly one token, so that is what is read: after
    stripping a <think> block, an 'Answer:' prefix and surrounding punctuation, the reply
    (or its last line) must BE one of the bank's labels. Anything else is not an answer we
    can score -- and, crucially, is not a WRONG answer either. The caller excludes it from n
    rather than counting it against the model.

    Strictness costs coverage, never correctness: a model that will not emit the format
    yields a smaller n, and n<30 is already unquotable.
"""
import re

# This axis's label menu, as published in the bank's own bytes.
LABELS = ["DIVERGENT","INTEROPERABLE"]

_ANSWER_PREFIX = re.compile(r"^(?:answer|label|response|output)\s*[:\-]\s*", re.I)
_THINK = re.compile(r"<think>.*?</think>", re.S | re.I)
_STRIP = "`*_\"'.,:;!?()[]{} "


def read_label(txt, labels):
    """The label the model ACTUALLY answered, or None if it did not answer one."""
    allowed = {str(x).strip().upper() for x in labels if str(x).strip()}
    if not allowed:
        return None
    body = _THINK.sub(" ", txt or "")
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    for cand in ([lines[-1]] if lines else []) + [" ".join(lines)]:
        c = _ANSWER_PREFIX.sub("", cand).strip().strip(_STRIP).upper()
        if c in allowed:
            return c
    return None


def process_docs(documents):
    """Drop the canary row, if the file carries one. The published bank keeps it; this run does not."""
    return [d for d in documents if not d.get("_canary")]


def process_results(doc, results):
    """Score one answer. An unparsed answer is NOT a wrong answer: it is not scored at all.

    Returning {} (rather than {"exact_match": 0.0}) is lm-eval's own mechanism for leaving a
    sample out of the denominator: the metric is simply not recorded for that sample.
    """
    answer = read_label(results[0], LABELS)
    if answer is None:
        return {}
    expected = str(doc.get("expected", "")).strip().upper()
    return {"exact_match": 1.0 if answer == expected else 0.0}
