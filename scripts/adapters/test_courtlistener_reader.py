"""Tests for CourtListener/RECAP hallucination docket reader.

Run: python3 -m pytest scripts/adapters/test_courtlistener_reader.py -q
 or: python3 -m unittest discover -s scripts/adapters -p test_courtlistener_reader.py
"""
from __future__ import annotations

import json
import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from typing import Any

import courtlistener_reader as clr


# -- Fixtures ----------------------------------------------------------------

def _make_api_response(
    results: list[dict[str, Any]] | None = None,
    count: int = 0,
    document_count: int = 0,
    next_url: str | None = None,
) -> dict[str, Any]:
    """Build a mock CourtListener search API response."""
    return {
        "count": count,
        "document_count": document_count,
        "next": next_url,
        "previous": None,
        "results": results or [],
    }


def _make_result(
    case_name: str = "Doe v. Example Corp",
    docket_number: str = "1:26-cv-00001",
    court: str = "District Court, S.D. New York",
    court_id: str = "nysd",
    date_filed: str = "2026-09-01",
    pacer_case_id: str = "12345",
    docket_id: int = 99999,
    cause: str = "28:1331 Fed. Question",
    description: str = "Filing mentions hallucinated citations by AI.",
    pacer_doc_id: str = "67890",
    docket_absolute_url: str = "/docket/99999/doe-v-example-corp/",
    score: float = 42.0,
) -> dict[str, Any]:
    """Build a mock single search result."""
    return {
        "caseName": case_name,
        "docketNumber": docket_number,
        "court": court,
        "court_id": court_id,
        "dateFiled": date_filed,
        "cause": cause,
        "jurisdictionType": "Federal Question",
        "suitNature": "440 Civil Rights: Other",
        "assignedTo": "Jane Judge",
        "pacer_case_id": pacer_case_id,
        "docket_id": docket_id,
        "docket_absolute_url": docket_absolute_url,
        "recap_documents": [
            {
                "document_number": 1,
                "description": description,
                "entry_date_filed": date_filed,
                "pacer_doc_id": pacer_doc_id,
                "is_available": False,
                "absolute_url": f"/docket/{docket_id}/1/doe-v-example-corp/",
            }
        ],
        "meta": {"score": {"bm25": score}},
    }


def _bankruptcy_result() -> dict[str, Any]:
    return _make_result(
        court="United States Bankruptcy Court, S.D. New York",
        court_id="nysb",
    )


def _appeals_result() -> dict[str, Any]:
    return _make_result(
        court="Court of Appeals, Second Circuit",
        court_id="ca2",
    )


def _district_result_ny() -> dict[str, Any]:
    return _make_result(
        case_name="Smith v. AI Startup Inc.",
        docket_number="1:26-cv-00555",
        court="District Court, S.D. New York",
        court_id="nysd",
    )


def _district_result_cal() -> dict[str, Any]:
    return _make_result(
        case_name="Jones v. ChatGPT Maker",
        docket_number="3:26-cv-01234",
        court="District Court, N.D. California",
        court_id="cand",
    )


# -- Tests: filtering -------------------------------------------------------

class TestIsFederalDistrict(unittest.TestCase):
    """Federal district filter must accept district courts, reject others."""

    def test_district_court_accepted(self):
        self.assertTrue(clr._is_federal_district(_district_result_ny()))

    def test_district_court_nd_cal(self):
        self.assertTrue(clr._is_federal_district(_district_result_cal()))

    def test_bankruptcy_rejected(self):
        self.assertFalse(clr._is_federal_district(_bankruptcy_result()))

    def test_appeals_rejected(self):
        self.assertFalse(clr._is_federal_district(_appeals_result()))

    def test_empty_court_rejected(self):
        self.assertFalse(clr._is_federal_district({"court": ""}))

    def test_magistrate_rejected(self):
        result = _make_result(court="Magistrate Judge, District Court, D. Utah",
                              court_id="utd")
        self.assertFalse(clr._is_federal_district(result))


# -- Tests: card extraction --------------------------------------------------

class TestExtractCard(unittest.TestCase):
    """Card extraction must surface all required fields."""

    def test_card_has_required_fields(self):
        card = clr._extract_card(_district_result_ny())
        for key in ("case_name", "docket_number", "court", "court_id",
                     "date_filed", "pacer_case_id", "docket_id",
                     "docket_url", "recap_documents", "score"):
            self.assertIn(key, card, f"missing key: {key}")

    def test_card_preserves_case_name(self):
        card = clr._extract_card(_district_result_ny())
        self.assertEqual(card["case_name"], "Smith v. AI Startup Inc.")

    def test_card_url_absolute(self):
        card = clr._extract_card(_district_result_ny())
        self.assertTrue(card["docket_url"].startswith("https://"),
                        f"URL not absolute: {card['docket_url']}")

    def test_card_recap_documents_extracted(self):
        card = clr._extract_card(_make_result(description="AI hallucination cited"))
        self.assertEqual(len(card["recap_documents"]), 1)
        self.assertIn("hallucination", card["recap_documents"][0]["description"])

    def test_card_score_extracted(self):
        card = clr._extract_card(_make_result(score=37.5))
        self.assertEqual(card["score"], 37.5)

    def test_card_no_recap_documents(self):
        result = _make_result()
        result["recap_documents"] = None
        card = clr._extract_card(result)
        self.assertEqual(card["recap_documents"], [])


# -- Tests: query builder ----------------------------------------------------

class TestQueryBuilder(unittest.TestCase):
    def test_contains_all_base_terms(self):
        q = clr._build_query()
        self.assertIn("hallucination", q)
        self.assertIn("fabricat", q)
        self.assertIn('"generative AI"', q)
        self.assertIn("ChatGPT", q)
        self.assertIn('"artificial intelligence"', q)

    def test_extra_terms_appended(self):
        q = clr._build_query(extra_terms=["deepfake"])
        self.assertIn("deepfake", q)


# -- Tests: URL builder ------------------------------------------------------

class TestUrlBuilder(unittest.TestCase):
    def test_url_contains_required_params(self):
        url = clr._build_url("test query", "2026-09-01")
        self.assertIn("q=test+query", url)
        self.assertIn("type=r", url)
        self.assertIn("filed_after=2026-09-01", url)

    def test_url_with_cursor(self):
        url = clr._build_url("q", "2026-01-01", cursor="abc123")
        self.assertIn("cursor=abc123", url)


# -- Tests: API interaction (mocked) -----------------------------------------

class TestFetchPage(unittest.TestCase):
    """Test _fetch_page with mocked urllib."""

    @patch("courtlistener_reader.urllib.request.urlopen")
    def test_success(self, mock_urlopen):
        resp = MagicMock()
        resp.read.return_value = json.dumps({"count": 5, "results": []}).encode()
        resp.__enter__ = lambda s: s
        resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = resp

        data = clr._fetch_page("https://example.com/api")
        self.assertEqual(data["count"], 5)

    @patch("courtlistener_reader.urllib.request.urlopen")
    def test_http_error_fails_closed(self, mock_urlopen):
        import urllib.error
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="", code=429, msg="Rate Limited", hdrs=None, fp=None
        )
        with self.assertRaises(RuntimeError) as ctx:
            clr._fetch_page("https://example.com/api")
        self.assertIn("429", str(ctx.exception))

    @patch("courtlistener_reader.urllib.request.urlopen")
    def test_network_error_fails_closed(self, mock_urlopen):
        import urllib.error
        mock_urlopen.side_effect = urllib.error.URLError("Connection refused")
        with self.assertRaises(RuntimeError) as ctx:
            clr._fetch_page("https://example.com/api")
        self.assertIn("unreachable", str(ctx.exception))

    @patch("courtlistener_reader.urllib.request.urlopen")
    def test_malformed_json_fails_closed(self, mock_urlopen):
        resp = MagicMock()
        resp.read.return_value = b"not json"
        resp.__enter__ = lambda s: s
        resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = resp
        with self.assertRaises(RuntimeError) as ctx:
            clr._fetch_page("https://example.com/api")
        self.assertIn("invalid JSON", str(ctx.exception))


# -- Tests: search_hallucination_dockets (mocked) ----------------------------

class TestSearchHallucinationDockets(unittest.TestCase):
    """Integration-level tests with mocked API pages."""

    @patch("courtlistener_reader._fetch_page")
    def test_basic_search(self, mock_fetch):
        mock_fetch.return_value = _make_api_response(
            results=[_district_result_ny(), _district_result_cal()],
            count=100,
            document_count=150,
        )
        result = clr.search_hallucination_dockets(recent_weeks=1)
        self.assertEqual(result["total_hits"], 100)
        self.assertEqual(len(result["federal_district_cards"]), 2)
        self.assertEqual(result["pages_fetched"], 1)

    @patch("courtlistener_reader._fetch_page")
    def test_filters_non_district(self, mock_fetch):
        mock_fetch.return_value = _make_api_response(
            results=[
                _district_result_ny(),
                _bankruptcy_result(),
                _appeals_result(),
            ],
            count=3,
        )
        result = clr.search_hallucination_dockets(recent_weeks=1)
        self.assertEqual(len(result["federal_district_cards"]), 1)

    @patch("courtlistener_reader._fetch_page")
    def test_pagination_follows_cursor(self, mock_fetch):
        page1 = _make_api_response(
            results=[_district_result_ny()],
            count=50,
            next_url="https://www.courtlistener.com/api/rest/v4/search/?cursor=abc",
        )
        page2 = _make_api_response(
            results=[_district_result_cal()],
        )
        mock_fetch.side_effect = [page1, page2]

        result = clr.search_hallucination_dockets(recent_weeks=2, max_pages=2)
        self.assertEqual(len(result["federal_district_cards"]), 2)
        self.assertEqual(result["pages_fetched"], 2)
        self.assertEqual(mock_fetch.call_count, 2)

    @patch("courtlistener_reader._fetch_page")
    def test_pagination_stops_at_max_pages(self, mock_fetch):
        mock_fetch.return_value = _make_api_response(
            results=[_district_result_ny()],
            count=999,
            next_url="https://www.courtlistener.com/api/rest/v4/search/?cursor=xyz",
        )
        result = clr.search_hallucination_dockets(recent_weeks=1, max_pages=1)
        self.assertEqual(result["pages_fetched"], 1)
        self.assertEqual(mock_fetch.call_count, 1)

    @patch("courtlistener_reader._fetch_page")
    def test_api_error_propagates(self, mock_fetch):
        mock_fetch.side_effect = RuntimeError("HTTP 429: rate limited")
        with self.assertRaises(RuntimeError):
            clr.search_hallucination_dockets(recent_weeks=1)

    def test_invalid_recent_weeks(self):
        with self.assertRaises(ValueError):
            clr.search_hallucination_dockets(recent_weeks=0)

    def test_invalid_max_pages(self):
        with self.assertRaises(ValueError):
            clr.search_hallucination_dockets(recent_weeks=1, max_pages=0)

    @patch("courtlistener_reader._fetch_page")
    def test_empty_results(self, mock_fetch):
        mock_fetch.return_value = _make_api_response(count=0)
        result = clr.search_hallucination_dockets(recent_weeks=1)
        self.assertEqual(result["total_hits"], 0)
        self.assertEqual(result["federal_district_cards"], [])

    @patch("courtlistener_reader._fetch_page")
    def test_filed_after_date_format(self, mock_fetch):
        mock_fetch.return_value = _make_api_response()
        clr.search_hallucination_dockets(recent_weeks=4)
        call_url = mock_fetch.call_args[0][0]
        self.assertIn("filed_after=", call_url)
        # Verify it's a valid YYYY-MM-DD date.
        import urllib.parse
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(call_url).query)
        date_str = qs["filed_after"][0]
        datetime.strptime(date_str, "%Y-%m-%d")  # raises on bad format


if __name__ == "__main__":
    unittest.main()
