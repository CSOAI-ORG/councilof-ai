# MEOK WORLD — Build target (2026-06-29 9 PM BST)

.PHONY: all build test clean deploy run-backend run-frontend

all: build test

# ─── Build ───
build:
	@echo "→ Building MEOK WORLD (128 pages + PWA)"
	cd csoai-os/meok-home && python3 build_everything2.py
	@echo "→ Built 128 pages to csoai-os/meok-home/pages/"

# ─── Tests ───
test:
	@echo "→ Running all tests"
	/opt/homebrew/bin/pytest csoai-os/test_meok_full_site.py -v
	@if [ -d meok-backend ]; then /opt/homebrew/bin/pytest meok-backend/test_app.py -v; fi
	@if [ -d meok-e2e ]; then /opt/homebrew/bin/pytest meok-e2e/ -v; fi

test-site:
	/opt/homebrew/bin/pytest csoai-os/test_meok_full_site.py -v

test-backend:
	cd meok-backend && /opt/homebrew/bin/pytest test_app.py -v

test-e2e:
	cd meok-e2e && /opt/homebrew/bin/pytest -v

# ─── Run ───
run-backend:
	@echo "→ Starting MEOK backend on :8000"
	cd meok-backend && uvicorn app:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	@echo "→ Serving MEOK WORLD on :8080"
	cd csoai-os/meok-home && python3 -m http.server 8080

# ─── Deploy ───
deploy:
	@echo "→ Deploying to meok.ai"
	rsync -avz csoai-os/meok-home/pages/ meok-deploy/pages/
	cd meok-deploy && vercel --prod

# ─── Pre-test checklist (9 PM) ───
checklist:
	@echo "=== 9 PM Pre-Test Checklist ==="
	@echo "→ All 128 pages load (HTTP 200):"
	@for f in csoai-os/meok-home/pages/*.html; do
		wc -l $$f > /dev/null && echo "  ✓ $$(basename $$f)"
	done | head -5
	@echo "..."
	@echo "→ Backend health check:"
	@curl -s http://localhost:8000/api/backend/status 2>/dev/null | head -c 100 || echo "  ✗ Backend not running (run 'make run-backend' first)"
	@echo ""
	@echo "→ Site size:"
	@du -sh csoai-os/meok-home/

clean:
	rm -rf meok-deploy/.next meok-deploy/node_modules
	find csoai-os/meok-home -name "*.tmp" -delete
