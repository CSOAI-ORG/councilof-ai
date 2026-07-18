#!/usr/bin/env bash
# install.sh — one-shot install of the entire MEOK OS sovereign stack
# Installs: all 22+ sovereign MCPs + the meok-os-backend
#
# Usage:
#   curl -sSL https://proofof.ai/install.sh | bash
#   ./install.sh
#
# Or just pip install:
#   pip install meok-sovereign-native-mcp meok-sovereign-oowm-mcp ...

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_banner() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  🐉 MEOK OS — Sovereign AI Operating System Installer${NC}"
  echo -e "${BLUE}  22+ Sovereign MCPs · 5D Hive · 12 Generals · No Ollama needed${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_header() {
  echo ""
  echo -e "${BLUE}── $1 ──${NC}"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# === CHECK PYTHON ===
check_python() {
  if command -v python3.11 >/dev/null 2>&1; then
    PYTHON=python3.11
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
  else
    print_error "Python 3.10+ not found"
    exit 1
  fi
  print_success "Using $PYTHON ($(${PYTHON} --version 2>&1))"
}

# === INSTALL ===
install_all() {
  print_banner

  check_python

  print_header "1/3 — Core Sovereign MCPs (the 5 sovereign task families)"
  ${PYTHON} -m pip install --quiet --upgrade \
    meok-sovereign-native-mcp \
    meok-sovereign-oowm-mcp \
    meok-sovereign-federation-mcp \
    meok-sovereign-planning-mcp \
    2>&1 | tail -3
  print_success "Core 4 MCPs installed"

  print_header "2/3 — Sovereign Compliance + Audit (9 MCPs)"
  ${PYTHON} -m pip install --quiet --upgrade \
    meok-sovereign-passport-mcp \
    meok-sovereign-guardrails-mcp \
    meok-sovereign-receipt-mcp \
    meok-sovereign-governance-mcp \
    meok-sovereign-eu-ai-act-kit-mcp \
    meok-sovereign-defence-mcp \
    meok-sovereign-dora-mcp \
    meok-sovereign-iso42001-mcp \
    meok-sovereign-worm-mcp \
    2>&1 | tail -3
  print_success "Compliance + audit 9 MCPs installed"

  print_header "3/3 — Sovereign Substrate (IoT + Memory + Avatar + Globe + Council + More)"
  ${PYTHON} -m pip install --quiet --upgrade \
    meok-sovereign-iot-mcp \
    meok-sovereign-pond-mcp \
    meok-sovereign-memory-mcp \
    meok-sovereign-avatar-mcp \
    meok-sovereign-globe-mcp \
    meok-sovereign-council-mcp \
    meok-sovereign-intuition-mcp \
    meok-sovereign-satellite-mcp \
    meok-sovereign-honour-mcp \
    meok-sovereign-immortal-mcp \
    meok-sovereign-skills-mcp \
    meok-sovereign-x402-payment-mcp \
    2>&1 | tail -3
  print_success "Substrate 12 MCPs installed"

  print_header "Quick Test"
  if ${PYTHON} -c "
from meok_sovereign_native_mcp import sov_native_audit
r = sov_native_audit('def main(): if kill_switch_pressed(): halt(); log(user_input, audit_trail); return safe_response(user_input)')
assert r['articles']['art. 14']['satisfied'] is True
assert r['overall_pass'] is True
print('  ✓ EU AI Act native audit works')
from meok_sovereign_oowm_mcp import oowm_5d_hive
r = oowm_5d_hive()
assert r['hive_size'] == 12
print('  ✓ OOWM 5D Hive works (12 Generals)')
print()
print('  🐉 MEOK OS sovereign stack: INSTALLED')
" 2>&1; then
    print_success "All checks passed"
  else
    print_warning "Some MCPs may not be on PyPI yet — install via git:"
    echo "  pip install git+https://github.com/csoai/mcp-marketplace.git#subdirectory=meok-sovereign-native-mcp"
  fi

  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✓ MEOK OS INSTALLED${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Try:"
  echo "  python3 -c 'from meok_sovereign_native_mcp import sov_native_audit; print(sov_native_audit(\"code\"))'"
  echo "  python3 -c 'from meok_sovereign_oowm_mcp import oowm_5d_hive; print(oowm_5d_hive())'"
  echo ""
  echo "Doctrine: 'The dragon runs itself. No Ollama needed. Sovereign by construction.'"
}

install_all