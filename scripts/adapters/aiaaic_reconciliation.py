"""AIAAIC+OECD AIM reconciliation for CourtListener hallucination dockets.

Takes CourtListener search results and cross-references with the AIAAIC
incident database (aiaaic.org) to identify cases that may represent new
AI hallucination incidents not yet catalogued in AIAAIC.

Honest limits (do not soften):
  * AIAAIC does not provide a public API. This module does fuzzy keyword
    matching against AIAAIC's publicly browsable incident titles. It does
    NOT scrape aiaaic.org pages (that would violate their ToS). Instead,
    it flags CourtListener docket entries as "possibly new" based on the
    absence of strong keyword overlap with AIAAIC's known incident
    categories.
  * OECD AI Incidents Monitor (AIM) is referenced by category alignment
    only. We do NOT call any OECD API.
  * This is a CARD — facts and deltas, not grades. "New incident" means
    "no strong keyword match found in AIAAIC category taxonomy," which
    could mean genuinely new OR simply outside our fuzzy match window.
  * False negatives (incidents we miss because keyword matching is weak)
    are expected. False positives (flagged as "new" when AIAAIC has it)
    are also expected.
  * CourtListener docket entries are about court filings, not incident
    reports. Many will be boilerplate judicial notices about Rule 11 /
    AI-assisted research — not substantive AI hallucination lawsuits.

Usage:
  python3 scripts/adapters/aiaaic_reconciliation.py --recent-weeks 1
  python3 scripts/adapters/aiaaic_reconciliation.py --recent-weeks 4 --json

Run tests:
  python3 -m pytest scripts/adapters/aiaaic_reconciliation.py -q
  (inline tests at bottom)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any

# -- AIAAIC incident taxonomy (public, manually curated) --------------------
# Source: AIAAIC's publicly browsable incident categories and common tags.
# This is a snapshot, not a live feed. Updated periodically.
# https://www.aiaaic.org/aiaaic-repository

AIAAIC_CATEGORIES: dict[str, list[str]] = {
    "hallucination": [
        "hallucination", "fabricated citation", "fake case",
        "nonexistent authority", "made-up source", "fabricated reference",
        "phantom citation", "invented case", "legal hallucination",
    ],
    "chatgpt": [
        "chatgpt", "openai", "gpt-4", "gpt-3.5", "gpt-5",
        "large language model", "llm",
    ],
    "generative_ai": [
        "generative ai", "ai-generated", "ai generated",
        "machine generated", "synthetic text", "ai-assisted",
        "ai assisted",
    ],
    "misinformation": [
        "misinformation", "disinformation", "false information",
        "inaccurate output", "erroneous", "fabricat",
    ],
    "legal": [
        "legal", "court", "lawsuit", "litigation", "filing",
        "sanction", "rule 11", "attorney", "lawyer", "judge",
    ],
    "deepfake": [
        "deepfake", "synthetic media", "ai-generated image",
        "face swap", "voice clone",
    ],
    "bias_discrimination": [
        "bias", "discrimination", "fairness", "disparate impact",
        "protected class",
    ],
}

# OECD AIM incident dimensions — mapped loosely to AIAAIC categories.
OECD_AIM_DIMENSIONS = {
    "accuracy": ["hallucination", "misinformation"],
    "fairness": ["bias_discrimination"],
    "transparency": ["generative_ai", "chatgpt"],
    "safety": ["deepfake"],
}


# -- Keyword matching --------------------------------------------------------

def _normalize(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _score_against_aiaaic(
    text: str,
) -> dict[str, float]:
    """Score text against AIAAIC categories. Returns category -> match ratio."""
    norm = _normalize(text)
    if not norm:
        return {}
    scores: dict[str, float] = {}
    for category, keywords in AIAAIC_CATEGORIES.items():
        hits = sum(1 for kw in keywords if kw in norm)
        if hits > 0:
            scores[category] = hits / len(keywords)
    return scores


def _best_match_description(scores: dict[str, float]) -> str | None:
    """Return a human-readable best match description, or None."""
    if not scores:
        return None
    best_cat = max(scores, key=lambda k: scores[k])
    best_score = scores[best_cat]
    matched_oecd = []
    for dim, cats in OECD_AIM_DIMENSIONS.items():
        if best_cat in cats:
            matched_oecd.append(dim)
    oecd_note = f" (OECD AIM: {', '.join(matched_oecd)})" if matched_oecd else ""
    return f"{best_cat} ({best_score:.0%}){oecd_note}"


# -- Reconciliation ----------------------------------------------------------

_STRONG_MATCH_THRESHOLD = 0.25  # 25% of category keywords matched
_NOVELTY_MIN_KEYWORDS = 2       # Minimum unique keywords to flag as novel


def _classify_card(card: dict[str, Any]) -> dict[str, Any]:
    """Classify a single docket card against AIAAIC categories.

    Returns the card augmented with:
      - aiaaic_scores: dict of category -> match ratio
      - aiaaic_best_match: human-readable best match or None
      - novelty_flag: "existing" | "partial" | "possibly_new"
      - novelty_reason: explanation
    """
    # Combine all text from the card for matching.
    texts = [
        card.get("case_name", ""),
        card.get("cause", ""),
        card.get("nature_of_suit", ""),
    ]
    for doc in card.get("recap_documents", []):
        texts.append(doc.get("description", ""))

    combined = " ".join(texts)
    scores = _score_against_aiaaic(combined)

    best_match = _best_match_description(scores)
    max_score = max(scores.values()) if scores else 0.0

    # Also check for novelty signals — terms that appear in the docket
    # but aren't well-covered by AIAAIC categories.
    norm = _normalize(combined)
    novelty_signals: list[str] = []
    novelty_terms = [
        "cognitive hallucination", "psychological", "medical hallucination",
        "autonomous", "self-driving", "robot", "embodied",
        "copyright", "patent", "trademark",
        "election", "voting", "ballot",
        "weapon", "military", "warfare",
    ]
    for term in novelty_terms:
        if term in norm:
            novelty_signals.append(term)

    if max_score >= _STRONG_MATCH_THRESHOLD:
        flag = "existing"
        reason = f"Strong match: {best_match}"
    elif max_score > 0:
        flag = "partial"
        reason = f"Weak match: {best_match}"
    else:
        flag = "possibly_new"
        reason = "No AIAAIC category overlap found"

    if novelty_signals:
        reason += f" | novelty signals: {', '.join(novelty_signals)}"

    return {
        **card,
        "aiaaic_scores": scores,
        "aiaaic_best_match": best_match,
        "novelty_flag": flag,
        "novelty_reason": reason,
    }


def reconcile(
    courtlistener_result: dict[str, Any],
) -> dict[str, Any]:
    """Reconcile CourtListener results against AIAAIC taxonomy.

    Args:
        courtlistener_result: Output from courtlistener_reader.search_hallucination_dockets().

    Returns:
        dict with keys:
          - filed_after, total_hits, query (carried from input)
          - cards_classified: all cards with AIAAIC classification
          - delta: {
              possibly_new: cards flagged as possibly new,
              partial: cards with partial AIAAIC match,
              existing: cards with strong AIAAIC match,
            }
          - summary: human-readable delta summary
    """
    cards = courtlistener_result.get("federal_district_cards", [])
    classified = [_classify_card(card) for card in cards]

    possibly_new = [c for c in classified if c["novelty_flag"] == "possibly_new"]
    partial = [c for c in classified if c["novelty_flag"] == "partial"]
    existing = [c for c in classified if c["novelty_flag"] == "existing"]

    # Build OECD AIM dimension coverage.
    oecd_coverage: dict[str, int] = {}
    for card in classified:
        for dim in OECD_AIM_DIMENSIONS:
            for cat in OECD_AIM_DIMENSIONS[dim]:
                if card.get("aiaaic_scores", {}).get(cat, 0) > 0:
                    oecd_coverage[dim] = oecd_coverage.get(dim, 0) + 1
                    break

    summary_lines = [
        f"CourtListener query: {courtlistener_result.get('query', 'N/A')}",
        f"Filed after: {courtlistener_result.get('filed_after', 'N/A')}",
        f"Total CL hits (all courts): {courtlistener_result.get('total_hits', 0)}",
        f"Federal district cards: {len(classified)}",
        f"",
        f"Delta (AIAAIC reconciliation):",
        f"  Possibly new (no AIAAIC match): {len(possibly_new)}",
        f"  Partial match (weak):           {len(partial)}",
        f"  Existing (strong match):        {len(existing)}",
    ]
    if oecd_coverage:
        summary_lines.append(f"")
        summary_lines.append(f"OECD AIM dimension coverage:")
        for dim, count in sorted(oecd_coverage.items()):
            summary_lines.append(f"  {dim}: {count} card(s)")

    return {
        "filed_after": courtlistener_result.get("filed_after"),
        "total_hits": courtlistener_result.get("total_hits", 0),
        "query": courtlistener_result.get("query"),
        "cards_classified": classified,
        "delta": {
            "possibly_new": possibly_new,
            "partial": partial,
            "existing": existing,
        },
        "oecd_aim_coverage": oecd_coverage,
        "summary": "\n".join(summary_lines),
    }


# -- Inline smoke tests -----------------------------------------------------

def _selftest() -> None:
    """Run inline smoke tests. Called when run with --test."""
    # Test keyword matching
    scores = _score_against_aiaaic("This filing discusses ChatGPT hallucination in court.")
    assert "hallucination" in scores, f"Expected hallucination match, got {scores}"
    assert "chatgpt" in scores, f"Expected chatgpt match, got {scores}"
    assert "legal" in scores, f"Expected legal match, got {scores}"

    # Test no match
    scores = _score_against_aiaaic("The weather is nice today.")
    assert scores == {}, f"Expected no match, got {scores}"

    # Test classify card
    card = {
        "case_name": "Doe v. OpenAI",
        "cause": "28:1331 Fed. Question",
        "nature_of_suit": "",
        "recap_documents": [
            {"description": "Filing cites fabricated ChatGPT hallucination cases."}
        ],
    }
    classified = _classify_card(card)
    assert classified["novelty_flag"] in ("existing", "partial"), classified
    assert classified["aiaaic_best_match"] is not None

    # Test novelty
    card_novel = {
        "case_name": "Smith v. Autonomous Robot Corp",
        "cause": "28:1332 Tort",
        "nature_of_suit": "",
        "recap_documents": [
            {"description": "Autonomous robot caused injury through cognitive hallucination."}
        ],
    }
    classified_novel = _classify_card(card_novel)
    assert "cognitive hallucination" in classified_novel["novelty_reason"] or \
           "autonomous" in classified_novel["novelty_reason"], classified_novel

    # Test reconcile
    cl_result = {
        "query": "test",
        "filed_after": "2026-09-01",
        "total_hits": 2,
        "federal_district_cards": [card, card_novel],
    }
    result = reconcile(cl_result)
    assert len(result["cards_classified"]) == 2
    assert result["delta"]["possibly_new"] or result["delta"]["existing"] or result["delta"]["partial"]

    print("All inline tests passed.")


# -- CLI ---------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="AIAAIC reconciliation for CourtListener hallucination dockets"
    )
    parser.add_argument(
        "--recent-weeks", type=int, default=1,
        help="Look back N weeks (default: 1)"
    )
    parser.add_argument(
        "--max-pages", type=int, default=1,
        help="Max paginated result pages (default: 1)"
    )
    parser.add_argument(
        "--json", action="store_true", dest="json_output",
        help="Output raw JSON"
    )
    parser.add_argument(
        "--test", action="store_true",
        help="Run inline smoke tests and exit"
    )
    args = parser.parse_args()

    if args.test:
        _selftest()
        return

    # Lazy import to allow --test without network deps.
    from courtlistener_reader import search_hallucination_dockets

    try:
        cl_result = search_hallucination_dockets(
            recent_weeks=args.recent_weeks,
            max_pages=args.max_pages,
        )
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(2)

    result = reconcile(cl_result)

    if args.json_output:
        # Strip summary for JSON mode (it's a string, not structured).
        out = {k: v for k, v in result.items() if k != "summary"}
        json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
        print()
        return

    print(result["summary"])
    print()

    if result["delta"]["possibly_new"]:
        print("=== POSSIBLY NEW (no AIAAIC match) ===")
        for card in result["delta"]["possibly_new"]:
            print(f"  * {card['case_name']} ({card['docket_number']})")
            print(f"    Court: {card['court']}")
            print(f"    Filed: {card['date_filed']}")
            print(f"    Reason: {card['novelty_reason']}")
            print()

    if result["delta"]["partial"]:
        print("=== PARTIAL MATCH ===")
        for card in result["delta"]["partial"]:
            print(f"  * {card['case_name']} ({card['docket_number']})")
            print(f"    Match: {card['aiaaic_best_match']}")
            print()


if __name__ == "__main__":
    main()
