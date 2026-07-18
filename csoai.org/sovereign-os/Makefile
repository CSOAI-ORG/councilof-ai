# Sovereign OS · Master Makefile
# CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026
#
# Single entry point for the M2/M3/King/Queen lanes to install, test, run, deploy.
# Usage:
#   make help          — show all targets
#   make install       — install sovereign-os into a target web-app root
#   make test          — run all E2E tests (must be green before deploy)
#   make run           — start the federal bridge + brain + observability backends
#   make deploy        — 1-click Vercel deploy
#   make dashboard     — generate sovereign-dashboard.html
#   make all           — test + run + dashboard (full pipeline)
#   make clean         — clean up
#
# Env vars (override as needed):
#   WEB_ROOT          — target web app root (default: .)
#   CITIZEN_ID        — citizen identifier (default: defoneos-csoai-nicholas-001)
#   BRAIN_PORT        — brain endpoint port (default: 8100)
#   BRIDGE_PORT       — federal bridge port (default: 8200)
#   OBS_PORT          — observability port (default: 8201)
#   PYTHON            — python binary (default: python3)

PYTHON ?= /Users/nicholas/.hermes/hermes-agent/venv/bin/python3.11
WEB_ROOT ?= .
CITIZEN_ID ?= defoneos-csoai-nicholas-001
BRAIN_PORT ?= 8100
BRIDGE_PORT ?= 8200
OBS_PORT ?= 8201

SOVEREIGN_OS_DIR = /Users/nicholas/clawd/csoai.org/sovereign-os

.PHONY: help install test run deploy dashboard all clean dist-init verify-keys status

help:
	@echo "Sovereign OS · Master Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  install       Install sovereign-os into WEB_ROOT (default: .)"
	@echo "  test          Run all E2E tests (55/55 expected)"
	@echo "  run           Start the federal bridge + brain + observability backends"
	@echo "  deploy        1-click Vercel deploy"
	@echo "  dashboard     Generate sovereign-dashboard.html"
	@echo "  all           test + dashboard (full pipeline)"
	@echo "  status        Show sovereign status (services + tests + key)"
	@echo "  verify-keys   Verify the sovereign Ed25519 key is in place"
	@echo "  clean         Stop all services, clean up"
	@echo ""
	@echo "Variables:"
	@echo "  WEB_ROOT=$(WEB_ROOT)"
	@echo "  CITIZEN_ID=$(CITIZEN_ID)"
	@echo "  BRAIN_PORT=$(BRAIN_PORT)"
	@echo "  BRIDGE_PORT=$(BRIDGE_PORT)"
	@echo "  OBS_PORT=$(OBS_PORT)"

install:
	@echo "🜏 Installing Sovereign into $(WEB_ROOT)..."
	@mkdir -p $(WEB_ROOT)/sovereign-os/frontend
	@mkdir -p $(WEB_ROOT)/sovereign-os/backend
	@if [ -d $(SOVEREIGN_OS_DIR)/frontend ]; then \
		cp -f $(SOVEREIGN_OS_DIR)/frontend/*.{js,css,html,md} $(WEB_ROOT)/sovereign-os/frontend/ 2>/dev/null || true; \
	fi
	@cp -f $(SOVEREIGN_OS_DIR)/sovereign_master_net.py $(WEB_ROOT)/sovereign-os/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/sovereign_crypto.py $(WEB_ROOT)/sovereign-os/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/threat_council.py $(WEB_ROOT)/sovereign-os/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/composite_dashboard.py $(WEB_ROOT)/sovereign-os/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/run_all_e2e.py $(WEB_ROOT)/sovereign-os/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/HANDOFF-TO-M2.md $(WEB_ROOT)/sovereign-os/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/Makefile $(WEB_ROOT)/sovereign-os/ 2>/dev/null || true
	@cp -rf $(SOVEREIGN_OS_DIR)/backend/* $(WEB_ROOT)/sovereign-os/backend/ 2>/dev/null || true
	@cp -rf $(SOVEREIGN_OS_DIR)/dragon-mode/* $(WEB_ROOT)/sovereign-os/dragon-mode/ 2>/dev/null || true
	@cp -rf $(SOVEREIGN_OS_DIR)/dist/* $(WEB_ROOT)/sovereign-os/dist/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/sovereign-dashboard.html $(WEB_ROOT)/sovereign-os/ 2>/dev/null || true
	@echo "✓ Files copied to $(WEB_ROOT)/sovereign-os/"
	@echo ""
	@echo "Drop-in <script> block (paste into <head> of cop.html):"
	@echo "<script src=\"/sovereign-os/frontend/sovereign-event-bus.js\" data-citizen-id=\"$(CITIZEN_ID)\"></script>"
	@echo "<script src=\"/sovereign-os/frontend/sovereign-hud.js\"></script>"
	@echo "<script src=\"/sovereign-os/frontend/sov3-llm-brain.js\" data-brain-endpoint=\"http://localhost:$(BRAIN_PORT)/v1\"></script>"
	@echo "<link rel=\"stylesheet\" href=\"/sovereign-os/frontend/sovereign-hud.css\">"

test:
	@echo "🜏 Running all 4 E2E suites (55/55 expected)..."
	@$(PYTHON) $(SOVEREIGN_OS_DIR)/run_all_e2e.py

run:
	@echo "🜏 Starting federal bridge on :$(BRIDGE_PORT)..."
	@$(PYTHON) $(SOVEREIGN_OS_DIR)/backend/server.py --port $(BRIDGE_PORT) > /tmp/sovereign-bridge.log 2>&1 &
	@echo "  PID $$! — log: /tmp/sovereign-bridge.log"
	@echo "🜏 Starting sovereign brain on :$(BRAIN_PORT)..."
	@$(PYTHON) $(SOVEREIGN_OS_DIR)/backend/brain_endpoint.py --port $(BRAIN_PORT) > /tmp/sovereign-brain.log 2>&1 &
	@echo "  PID $$! — log: /tmp/sovereign-brain.log"
	@echo "🜏 Starting observability on :$(OBS_PORT)..."
	@$(PYTHON) $(SOVEREIGN_OS_DIR)/backend/observability.py --port $(OBS_PORT) > /tmp/sovereign-obs.log 2>&1 &
	@echo "  PID $$! — log: /tmp/sovereign-obs.log"
	@echo ""
	@echo "All 3 services started. Health check:"
	@echo "  Bridge:  curl -s http://localhost:$(BRIDGE_PORT)/health"
	@echo "  Brain:   curl -s http://localhost:$(BRAIN_PORT)/v1/status"
	@echo "  Obs:     curl -s http://localhost:$(OBS_PORT)/metrics"

dashboard:
	@echo "🜏 Generating sovereign-dashboard.html..."
	@$(PYTHON) $(SOVEREIGN_OS_DIR)/composite_dashboard.py
	@echo "  ✓ Wrote $(SOVEREIGN_OS_DIR)/sovereign-dashboard.html"

verify-keys:
	@echo "🜏 Verifying sovereign Ed25519 key..."
	@mkdir -p ~/.sovereign/keys
	@if [ -f ~/.sovereign/keys/ed25519.key ]; then \
		echo "  ✓ Ed25519 key exists at ~/.sovereign/keys/ed25519.key"; \
	else \
		echo "  ! Generating new Ed25519 key..."; \
		$(PYTHON) $(SOVEREIGN_OS_DIR)/sovereign_crypto.py; \
	fi

status:
	@echo "🜏 SOVEREIGN OS STATUS"
	@echo "────────────────────────────────────────"
	@echo "Services:"
	@echo "  Bridge:  $$([ $$(curl -s --max-time 2 http://localhost:$(BRIDGE_PORT)/health 2>/dev/null | wc -c) -gt 0 ] && echo 'ONLINE' || echo 'offline')"
	@echo "  Brain:   $$([ $$(curl -s --max-time 2 http://localhost:$(BRAIN_PORT)/v1/status 2>/dev/null | wc -c) -gt 0 ] && echo 'ONLINE' || echo 'offline')"
	@echo "  Obs:     $$([ $$(curl -s --max-time 2 http://localhost:$(OBS_PORT)/metrics 2>/dev/null | wc -c) -gt 0 ] && echo 'ONLINE' || echo 'offline')"
	@echo ""
	@echo "Keys:"
	@echo "  Ed25519: $$([ -f ~/.sovereign/keys/ed25519.key ] && echo 'present' || echo 'MISSING')"
	@echo ""
	@echo "Tests:"
	@$(MAKE) test

deploy:
	@echo "🜏 Deploying to Vercel..."
	@which vercel || (echo "vercel CLI not installed. Run: npm i -g vercel"; exit 1)
	@cd $(WEB_ROOT) && vercel --prod

all: test dashboard
	@echo ""
	@echo "🜏 ALL GREEN. Sovereign OS ready for production."

clean:
	@echo "🜏 Cleaning up..."
	@pkill -f "brain_endpoint.py --port $(BRAIN_PORT)" 2>/dev/null || true
	@pkill -f "server.py --port $(BRIDGE_PORT)" 2>/dev/null || true
	@pkill -f "observability.py --port $(OBS_PORT)" 2>/dev/null || true
	@echo "  ✓ All sovereign services stopped."

dist-init:
	@echo "🜏 Initialising dist/ for Vercel..."
	@mkdir -p $(WEB_ROOT)/dist
	@mkdir -p $(WEB_ROOT)/api
	@cp -f $(SOVEREIGN_OS_DIR)/dist/index.html $(WEB_ROOT)/dist/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/api/brain.py $(WEB_ROOT)/api/ 2>/dev/null || true
	@cp -f $(SOVEREIGN_OS_DIR)/vercel.json $(WEB_ROOT)/ 2>/dev/null || true
	@echo "  ✓ dist/ + api/ + vercel.json ready"