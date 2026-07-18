#!/bin/bash
# ⚠️  DEPRECATED — This test file references stale ports (8000/8001).
#    The current architecture uses: SOV3=3101, MEOK_API=3200, MEOK_MCP=3102,
#    Gateway=3400, Sovereign=8888, UI=3000.
#    Use the unified suite instead:
#      python ~/clawd/tests/e2e/unified_e2e_suite.py
#    Last verified broken: 2026-05-29
#
# MEOK E2E Integration Test Suite
# Tests all services: marketing, sovereign-api, temple-api, mcp-gateway

set -e

BASE_API="http://localhost:8001"
BASE_TEMPLE="http://localhost:8888"
BASE_MCP="http://localhost:8000"
BASE_MARKETING="http://localhost:3000"

PASS=0
FAIL=0

pass() { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); }

# ─── Phase 1: Service Health ──────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE 1: Service Health"
echo "═══════════════════════════════════════════════════════════════"

curl -s -o /dev/null -w "%{http_code}" "$BASE_MARKETING/" | grep -q 200 && pass "Marketing frontend (port 3000)" || fail "Marketing frontend"
curl -s "$BASE_API/api/health" | grep -q '"status":"ok"' && pass "Sovereign API (port 8001)" || fail "Sovereign API"
curl -s "$BASE_TEMPLE/api/health" | grep -q '"status":"operational"' && pass "Temple API (port 8888)" || fail "Temple API"
curl -s -o /dev/null -w "%{http_code}" "$BASE_MCP/servers" | grep -q 200 && pass "MCP Gateway (port 8000)" || fail "MCP Gateway"

# ─── Phase 2: Auth Flow ───────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE 2: Auth Flow"
echo "═══════════════════════════════════════════════════════════════"

REGISTER=$(curl -s -X POST "$BASE_API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test_'$(date +%s)'@meok.ai","password":"testpass123"}')

EMAIL=$(echo "$REGISTER" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
if [ -n "$EMAIL" ]; then
  pass "Register user ($EMAIL)"
else
  fail "Register user"
fi

LOGIN=$(curl -s -X POST "$BASE_API/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=testpass123")

TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  pass "Login and receive JWT"
else
  fail "Login"
fi

ME=$(curl -s "$BASE_API/api/auth/me" -H "Authorization: Bearer $TOKEN")
if echo "$ME" | grep -q '"email":"'$EMAIL'"'; then
  pass "Get current user profile"
else
  fail "Get current user profile"
fi

# ─── Phase 3: Waitlist ────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE 3: Waitlist"
echo "═══════════════════════════════════════════════════════════════"

WAITLIST=$(curl -s -X POST "$BASE_API/api/waitlist/join" \
  -H "Content-Type: application/json" \
  -d '{"email":"waitlist_'$(date +%s)'@meok.ai"}')

if echo "$WAITLIST" | grep -q '"status":"new"'; then
  pass "Join waitlist"
else
  fail "Join waitlist"
fi

# ─── Phase 4: Proxy to Temple API ─────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE 4: Proxy to Temple API"
echo "═══════════════════════════════════════════════════════════════"

CONSCIOUSNESS=$(curl -s "$BASE_API/api/proxy/consciousness")
if echo "$CONSCIOUSNESS" | grep -q '"status"'; then
  pass "Proxy consciousness"
else
  fail "Proxy consciousness"
fi

COUNCIL=$(curl -s "$BASE_API/api/proxy/council/status")
if echo "$COUNCIL" | grep -q '"node_count":36'; then
  pass "Proxy council status (36 nodes)"
else
  fail "Proxy council status"
fi

PROPOSAL=$(curl -s -X POST "$BASE_API/api/proxy/council/propose" \
  -H "Content-Type: application/json" \
  -d '{"proposal":"E2E test proposal","requester":"test-suite","priority":"low"}')

if echo "$PROPOSAL" | grep -q '"decision":"'; then
  pass "Submit council proposal (BFT vote)"
else
  fail "Submit council proposal"
fi

# ─── Phase 5: MCP Gateway ─────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE 5: MCP Gateway"
echo "═══════════════════════════════════════════════════════════════"

SERVERS=$(curl -s "$BASE_API/api/proxy/mcp/servers")
if echo "$SERVERS" | grep -q '"bundles"'; then
  pass "Proxy MCP servers list"
else
  fail "Proxy MCP servers list"
fi

# ─── Phase 6: Payments ────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE 6: Payments (Stripe)"
echo "═══════════════════════════════════════════════════════════════"

CHECKOUT=$(curl -s -X POST "$BASE_API/api/payments/checkout/session" \
  -H "Content-Type: application/json" \
  -d '{"price_id":"sovereign-pro","customer_email":"test_'$(date +%s)'@meok.ai"}')

CHECKOUT_URL=$(echo "$CHECKOUT" | grep -o '"checkout_url":"[^"]*"' | cut -d'"' -f4)
if [ -n "$CHECKOUT_URL" ] && echo "$CHECKOUT_URL" | grep -q "stripe.com"; then
  pass "Create Stripe checkout session"
else
  fail "Create Stripe checkout session"
fi

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  RESULTS"
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎉 ALL TESTS PASSED"
  exit 0
else
  echo "  ⚠️  SOME TESTS FAILED"
  exit 1
fi
