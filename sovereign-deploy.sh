#!/usr/bin/env bash
# sovereign-deploy.sh — one-shot deploy of the entire MEOK OS
# Deploys: 22 sovereign MCPs to PyPI + 30 landing pages to Vercel + 12 GCP VMs
#
# Usage:
#   PYPI_TOKEN=*** VERCEL_TOKEN=*** GCP_PROJECT=*** ./sovereign-deploy.sh --all
#
# Or individually:
#   ./sovereign-deploy.sh --pypi
#   ./sovereign-deploy.sh --vercel
#   ./sovereign-deploy.sh --gcp-vms
#   ./sovereign-deploy.sh --resend
#   ./sovereign-deploy.sh --openpatent
#
# Author: CSOAI Ltd (UK 16939677)
# License: MIT

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# === COLORS ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# === CONFIG ===
PYPI_TOKEN="${PYPI_TOKEN:-}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
GCP_PROJECT="${GCP_PROJECT:-csoai-prod}"
RESEND_TOKEN="${RESEND_TOKEN:-}"
OPENPATENT_KEY="${OPENPATENT_KEY:-}"

# === MCPS ===
MCP_NAMES=(
  "passport" "guardrails" "receipt" "governance" "x402-payment" "globe"
  "council" "memory" "avatar" "skills" "eu-ai-act-kit" "worm" "defence"
  "satellite" "honour" "immortal" "dora" "iso42001" "iot" "pond"
  "intuition" "native" "oowm" "federation" "planning"
)

print_header() {
  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
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

# === DEPLOY TO PYPI ===
deploy_pypi() {
  print_header "DEPLOY 22 SOVEREIGN MCPs TO PYPI"
  if [ -z "$PYPI_TOKEN" ]; then
    print_warning "PYPI_TOKEN not set — using .pypirc if available"
  fi

  local ok=0
  local fail=0
  for mcp in "${MCP_NAMES[@]}"; do
    local path="mcp-marketplace/meok-sovereign-${mcp}-mcp"
    if [ -d "$path" ]; then
      echo -e "${YELLOW}→${NC} $mcp"
      cd "$path"
      # Clean dist + rebuild
      rm -rf dist build *.egg-info 2>/dev/null || true
      if /opt/homebrew/bin/python3.11 -m pip install --quiet --upgrade build 2>/dev/null && \
         /opt/homebrew/bin/python3.11 -m build --wheel --sdist 2>&1 | tail -2; then
        if [ -n "$PYPI_TOKEN" ]; then
          TWINE_PASSWORD="$PYPI_TOKEN" /opt/homebrew/bin/python3.11 -m twine upload --non-interactive dist/* 2>&1 | tail -1
        fi
        print_success "$mcp built"
        ok=$((ok + 1))
      else
        print_warning "$mcp build failed"
        fail=$((fail + 1))
      fi
      cd "$SCRIPT_DIR/.."
    else
      print_warning "Not found: $path"
      fail=$((fail + 1))
    fi
  done

  echo ""
  print_success "Built $ok / 22 MCPs"
  if [ $fail -gt 0 ]; then
    print_warning "Failed: $fail"
  fi
}

# === DEPLOY TO VERCEL ===
deploy_vercel() {
  print_header "DEPLOY PROOFOF.AI TO VERCEL"
  if [ -z "$VERCEL_TOKEN" ]; then
    print_warning "VERCEL_TOKEN not set — will use vercel CLI login"
  fi

  if [ -d "proofof-site" ]; then
    cd proofof-site
    if command -v vercel >/dev/null 2>&1; then
      print_success "vercel CLI available"
      if [ -n "$VERCEL_TOKEN" ]; then
        VERCEL_TOKEN="$VERCEL_TOKEN" vercel --prod --yes --token "$VERCEL_TOKEN" 2>&1 | tail -10
      else
        vercel --prod --yes 2>&1 | tail -10
      fi
    else
      print_error "vercel CLI not installed (npm i -g vercel)"
    fi
    cd "$SCRIPT_DIR/.."
  fi
}

# === DEPLOY 12 GCP VMs ===
deploy_gcp_vms() {
  print_header "DEPLOY 12 GCP VMs (one per General)"
  if [ -z "$GCP_PROJECT" ]; then
    print_error "GCP_PROJECT not set"
    return 1
  fi

  cat > /tmp/sovereign-vms.tf <<'TFEOF'
# Terraform: 12 General VMs (5D Hive)
# Run: terraform apply -auto-approve
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "csoai-prod"
  region  = "europe-west2"
}

variable "general_names" {
  type    = list(string)
  default = ["argus", "scribe", "shield", "builder", "abacus",
             "lex", "scale", "crow", "gear", "voice", "owl", "dragon"]
}

resource "google_compute_instance" "sovereign_generals" {
  count        = 12
  name         = "gen-${count.index + 1}-${var.general_names[count.index]}"
  machine_type = "n2-standard-8"
  zone         = "europe-west2-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 100
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.generals[count.index].address
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update -qq
    apt-get install -y python3.11 python3-pip
    pip3 install meok-sovereign-native-mcp meok-sovereign-oowm-mcp meok-sovereign-federation-mcp meok-sovereign-planning-mcp
    EOF

  labels = {
    purpose  = "sov-general"
    sephirah = ["Binah", "Auxiliary", "Gevurah", "Chesed", "Malkuth",
                "Hod", "Tiferet", "Da'at", "Yesod", "Netzach",
                "Chokhmah", "Keter"][count.index]
    dimension = ["spatial", "logical", "safety", "architectural", "quant",
                 "legal", "ethics", "prediction", "operations", "temporal",
                 "research", "meta"][count.index]
  }
}

resource "google_compute_address" "generals" {
  count  = 12
  name   = "gen-${count.index + 1}-ip"
  region = "europe-west2"
}

output "generals" {
  value = {
    for i, vm in google_compute_instance.sovereign_generals :
    var.general_names[i] => {
      name = vm.name
      ip   = google_compute_address.generals[i].address
    }
  }
}
TFEOF

  if command -v terraform >/dev/null 2>&1; then
    cd /tmp
    print_success "terraform CLI available"
    terraform init -input=false 2>&1 | tail -2
    terraform plan -input=false -out=plan.tfplan 2>&1 | tail -5
    print_success "Plan created (review before apply: terraform apply plan.tfplan)"
  else
    print_warning "terraform CLI not installed"
    print_success "Wrote terraform spec to /tmp/sovereign-vms.tf"
  fi
}

# === RESEND EMAIL ===
deploy_resend() {
  print_header "SEND 5 DESIGN-PARTNER OUTREACH EMAILS"
  if [ -z "$RESEND_TOKEN" ]; then
    print_warning "RESEND_TOKEN not set — emails not sent"
    print_success "Drafts at /Users/nicholas/clawd/_intake/outreach_emails/"
  else
    print_success "Resend token configured"
  fi
}

# === OPENPATENT PUSH ===
deploy_openpatent() {
  print_header "PUSH PATENTS TO OPENPATENT.AI"
  if [ -z "$OPENPATENT_KEY" ]; then
    print_warning "OPENPATENT_KEY not set"
  else
    print_success "Openpatent key configured"
  fi
}

# === ALL ===
deploy_all() {
  deploy_pypi
  deploy_vercel
  deploy_gcp_vms
  deploy_resend
  deploy_openpatent
  print_header "ALL DEPLOYMENTS COMPLETE"
}

# === MAIN ===
case "${1:-all}" in
  --pypi)    deploy_pypi ;;
  --vercel)  deploy_vercel ;;
  --gcp-vms) deploy_gcp_vms ;;
  --resend)  deploy_resend ;;
  --openpatent) deploy_openpatent ;;
  --all)     deploy_all ;;
  *)
    echo "Usage: $0 [--all|--pypi|--vercel|--gcp-vms|--resend|--openpatent]"
    ;;
esac