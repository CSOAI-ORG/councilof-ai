# MEOK OS — End-to-End Test Suite
#
# Why so many moving parts?
# -------------------------
# * The Playwright Python wheel is pinned in /Users/nicholas/dmtcartransport-website/.venv
#   (already installed 2026-06-29 — chromium 1228 already on disk).
# * The default `python3` on PATH (3.11) does NOT have playwright or beautifulsoup4.
# * `make install` uses `python3 -m pip install --user` to drop the lighter deps
#   (httpx, bs4, lxml, pytest-html, pytest-xdist) into the user's site-packages.
#
# Targets
# -------
#   install  – install pip deps + verify Playwright is available
#   test     – run the entire suite
#   test-api – run only API/httpx tests (faster)
#   test-ui  – run only Playwright browser tests
#   test-smoke – only the smoke-tagged critical-path tests
#   report   – run + produce an HTML report under reports/
#   clean    – remove reports/ and __pycache__
#   open-report – open the last HTML report

PY        ?= python3
PYTEST    ?= $(PY) -m pytest
PORT_UI   ?= 8765
PORT_API  ?= 8000

.PHONY: help install test test-api test-ui test-smoke report clean open-report

help:
	@echo "MEOK E2E"
	@echo "  make install   – install runtime + test deps"
	@echo "  make test      – run everything"
	@echo "  make test-api  – only httpx tests"
	@echo "  make test-ui   – only Playwright tests"
	@echo "  make test-smoke – only critical-path @smoke tests"
	@echo "  make report    – run + write reports/report.html"
	@echo "  make open-report"
	@echo "  make clean"

install:
	@echo "↪ installing lightweight deps into user site-packages"
	$(PY) -m pip install --user --quiet -r requirements.txt
	@echo "↪ verifying Playwright"
	@$(PY) -c "import playwright; from playwright.sync_api import sync_playwright; print('  playwright:', playwright.__version__, '✓')" || \
	  (echo "✗ Playwright not found in $(PY). Using the dmtc venv py:" && \
	   /Users/nicholas/dmtcartransport-website/.venv/bin/python3 -c "import playwright; print('  fallback playwright:', playwright.__version__, '✓')")
	@echo "↪ verifying httpx, bs4, pytest"
	@$(PY) -c "import httpx, bs4, pytest; print('  httpx:', httpx.__version__, '/ bs4:', bs4.__version__, '/ pytest:', pytest.__version__, '✓')"

test:
	$(PYTEST)

test-api:
	$(PYTEST) -m api

test-ui:
	$(PYTEST) -m ui

test-smoke:
	$(PYTEST) -m smoke

report:
	mkdir -p reports
	$(PYTEST) --html=reports/report.html --self-contained-html -v

open-report:
	@open reports/report.html 2>/dev/null || $(PY) -m webbrowser reports/report.html || true

clean:
	rm -rf reports/ .pytest_cache/ **/__pycache__/
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
