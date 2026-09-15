"""CourtListener/RECAP hallucination docket reader — G5.5 pilot.

Searches the CourtListener RECAP search API for federal docket entries
mentioning AI hallucination / fabrication terms. No authentication required
(the search endpoint is open). Uses only stdlib (urllib, json).

Honest limits (do not soften):
  * CourtListener's search API is open but rate-limited (default 5 req/min
    unauthenticated). This reader issues ONE search per invocation and
    paginates cursor-style — it does NOT loop through all pages unless
    --max-pages is raised.
  * Results are as fresh as CourtListener's RECAP archive. PACER filings
    may lag days to weeks behind actual court entries.
  * The search endpoint returns RECAP docket *search hits*, not raw PACER
    docket entries. Each hit carries recap_documents[] but not all entries
    on a docket — only those RECAP has ingested.
  * We filter for federal district courts by court_id prefix heuristics
    and string matching. CourtListener's taxonomy can change without notice.
  * We do NOT grade, score, or certify any case. This is a FACTUAL docket
    card, not a measurement.

Usage:
  python3 scripts/adapters/courtlistener_reader.py --recent-weeks 1
  python3 scripts/adapters/courtlistener_reader.py --recent-weeks 4 --json
  python3 scripts/adapters/courtlistener_reader.py --recent-weeks 2 --max-pages 3

Run tests:
  python3 -m pytest scripts/adapters/test_courtlistener_reader.py -q
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

# -- Constants ---------------------------------------------------------------

API_BASE = "https://www.courtlistener.com/api/rest/v4/search/"
COURTLISTENER_URL = "https://www.courtlistener.com"

# Search terms — OR-combined in a single query string.
# CourtListener's search engine uses Solr-style full-text; quoting multi-word
# phrases prevents token splitting.
SEARCH_TERMS = [
    "hallucination",
    "fabricat",
    '"generative AI"',
    "ChatGPT",
    '"artificial intelligence"',
]

# Federal district court IDs end in a 3-letter abbreviation. Bankruptcy
# courts end in 'b' suffix (e.g. 'ctb'). We include district, exclude
# bankruptcy and other court types by checking the court display string.
FEDERAL_DISTRICT_KEYWORDS = ("District Court",)

# Exclusion keywords in court display string.
EXCLUDE_COURT_KEYWORDS = ("Bankruptcy", "Tax Court", "Court of Appeals",
                           "Supreme Court", "Magistrate", "Panel",
                           "Judicial Panel", "Claims Court")

MAX_RESULTS_PER_PAGE = 20  # CourtListener default
REQUEST_TIMEOUT = 30        # seconds
USER_AGENT = "csoai-courtlistener-reader/0.1 (councilof.ai G5.5 pilot)"


# -- API interaction ---------------------------------------------------------

def _build_query(extra_terms: list[str] | None = None) -> str:
    """Build an OR-joined search query string."""
    terms = list(SEARCH_TERMS)
    if extra_terms:
        terms.extend(extra_terms)
    return " OR ".join(terms)


def _build_url(query: str, filed_after: str, cursor: str | None = None) -> str:
    """Build the CourtListener search API URL."""
    params: dict[str, str] = {
        "q": query,
        "type": "r",           # RECAP / docket results
        "filed_after": filed_after,
        "order_by": "score desc",
    }
    if cursor:
        params["cursor"] = cursor
    return f"{API_BASE}?{urllib.parse.urlencode(params)}"


def _fetch_page(url: str) -> dict[str, Any]:
    """Fetch a single page from the CourtListener API. Fails closed."""
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
    })
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            raw = resp.read()
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        body = ""
        try:
            body = exc.read().decode("utf-8", errors="replace")[:500]
        except Exception:
            pass
        raise RuntimeError(
            f"CourtListener API returned HTTP {exc.code}: {body}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"CourtListener API unreachable: {exc.reason}"
        ) from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"CourtListener API returned invalid JSON: {exc}"
        ) from exc


# -- Filtering ---------------------------------------------------------------

def _is_federal_district(result: dict[str, Any]) -> bool:
    """Return True if the result is from a federal district court."""
    court = str(result.get("court", ""))
    # Must contain district keyword
    if not any(kw in court for kw in FEDERAL_DISTRICT_KEYWORDS):
        return False
    # Must not contain exclusion keyword
    if any(kw in court for kw in EXCLUDE_COURT_KEYWORDS):
        return False
    return True


def _extract_card(result: dict[str, Any]) -> dict[str, Any]:
    """Extract a structured docket card from a search result."""
    docs = result.get("recap_documents") or []
    doc_entries = []
    for doc in docs:
        doc_entries.append({
            "document_number": doc.get("document_number"),
            "description": doc.get("description", ""),
            "entry_date_filed": doc.get("entry_date_filed"),
            "pacer_doc_id": doc.get("pacer_doc_id", ""),
            "is_available": doc.get("is_available", False),
            "absolute_url": doc.get("absolute_url", ""),
        })

    docket_url = result.get("docket_absolute_url", "")
    if docket_url and not docket_url.startswith("http"):
        docket_url = f"{COURTLISTENER_URL}{docket_url}"

    return {
        "case_name": result.get("caseName", ""),
        "docket_number": result.get("docketNumber", ""),
        "court": result.get("court", ""),
        "court_id": result.get("court_id", ""),
        "date_filed": result.get("dateFiled", ""),
        "cause": result.get("cause", ""),
        "jurisdiction_type": result.get("jurisdictionType", ""),
        "nature_of_suit": result.get("suitNature", ""),
        "assigned_to": result.get("assignedTo"),
        "pacer_case_id": result.get("pacer_case_id", ""),
        "docket_id": result.get("docket_id"),
        "docket_url": docket_url,
        "recap_documents": doc_entries,
        "score": (result.get("meta") or {}).get("score", {}).get("bm25"),
    }


# -- Public API --------------------------------------------------------------

def search_hallucination_dockets(
    recent_weeks: int = 1,
    max_pages: int = 1,
) -> dict[str, Any]:
    """Search CourtListener for hallucination-related federal dockets.

    Args:
        recent_weeks: Look back this many weeks (default 1).
        max_pages: Maximum number of paginated result pages to fetch (default 1).

    Returns:
        dict with keys: query, filed_after, total_hits, total_documents,
        cards (list of structured docket cards), pages_fetched.

    Raises:
        RuntimeError on API errors (fail-closed).
    """
    if recent_weeks < 1:
        raise ValueError("recent_weeks must be >= 1")
    if max_pages < 1:
        raise ValueError("max_pages must be >= 1")

    now = datetime.now(timezone.utc)
    filed_after = (now - timedelta(weeks=recent_weeks)).strftime("%Y-%m-%d")
    query = _build_query()

    all_cards: list[dict[str, Any]] = []
    total_hits = 0
    total_documents = 0
    cursor: str | None = None
    pages_fetched = 0

    for _ in range(max_pages):
        url = _build_url(query, filed_after, cursor)
        data = _fetch_page(url)
        pages_fetched += 1

        if pages_fetched == 1:
            total_hits = data.get("count", 0)
            total_documents = data.get("document_count", 0)

        results = data.get("results", [])
        for result in results:
            if _is_federal_district(result):
                all_cards.append(_extract_card(result))

        next_url = data.get("next")
        if not next_url:
            break
        # Extract cursor from the next URL.
        parsed = urllib.parse.urlparse(next_url)
        qs = urllib.parse.parse_qs(parsed.query)
        cursor = qs.get("cursor", [None])[0]
        if not cursor:
            break

    return {
        "query": query,
        "filed_after": filed_after,
        "total_hits": total_hits,
        "total_documents": total_documents,
        "federal_district_cards": all_cards,
        "pages_fetched": pages_fetched,
    }


# -- CLI ---------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="CourtListener/RECAP hallucination docket reader (G5.5 pilot)"
    )
    parser.add_argument(
        "--recent-weeks", type=int, default=1,
        help="Look back N weeks (default: 1)"
    )
    parser.add_argument(
        "--max-pages", type=int, default=1,
        help="Max paginated result pages to fetch (default: 1)"
    )
    parser.add_argument(
        "--json", action="store_true", dest="json_output",
        help="Output raw JSON instead of human-readable cards"
    )
    args = parser.parse_args()

    try:
        result = search_hallucination_dockets(
            recent_weeks=args.recent_weeks,
            max_pages=args.max_pages,
        )
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(2)

    if args.json_output:
        json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
        print()
        return

    # Human-readable output.
    print(f"CourtListener RECAP search: {result['query']}")
    print(f"Filed after: {result['filed_after']}")
    print(f"Total hits (all courts): {result['total_hits']}")
    print(f"Total documents: {result['total_documents']}")
    print(f"Federal district cards: {len(result['federal_district_cards'])}")
    print(f"Pages fetched: {result['pages_fetched']}")
    print()

    for i, card in enumerate(result["federal_district_cards"], 1):
        print(f"--- Card {i} ---")
        print(f"  Case:     {card['case_name']}")
        print(f"  Docket:   {card['docket_number']}")
        print(f"  Court:    {card['court']} ({card['court_id']})")
        print(f"  Filed:    {card['date_filed']}")
        print(f"  Cause:    {card['cause']}")
        print(f"  PACER ID: {card['pacer_case_id']}")
        print(f"  URL:      {card['docket_url']}")
        if card["recap_documents"]:
            for doc in card["recap_documents"]:
                desc = doc["description"][:200]
                print(f"  Doc #{doc['document_number']}: {desc}")
        print()


if __name__ == "__main__":
    main()
