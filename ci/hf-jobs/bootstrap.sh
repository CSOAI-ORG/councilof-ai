#!/usr/bin/env bash
# ci/hf-jobs/bootstrap.sh — provision the runner image.
#
# Runs as root on top of mcr.microsoft.com/playwright:<playwright version>-noble
# (Ubuntu 24.04, Node 22, Chromium + system deps already installed at the exact
# Playwright version package-lock.json pins — no browser download at job time).
#
# Used two ways:
#   1. `RUN bash bootstrap.sh` in ci/hf-jobs/Dockerfile → the csoai/ci-runner Space image.
#   2. At job start on the bare Playwright image when the Space image does not exist yet:
#        hf jobs run mcr.microsoft.com/playwright:v1.61.1-noble bash -lc \
#          'git clone … /w && bash /w/ci/hf-jobs/bootstrap.sh && …'
#
# Adds: git, GNU coreutils timeout, a CPython 3.11 venv at /opt/py311 (public-root.yml
# pins 3.11; noble ships 3.12) with cryptography + opentimestamps-client, wrangler 4,
# the hf CLI (for the mirror-dataset fallback), and a health page for the Space.
set -euo pipefail

UV_VERSION="${UV_VERSION:-0.8.0}"
WRANGLER_VERSION="${WRANGLER_VERSION:-4}"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq --no-install-recommends git ca-certificates curl coreutils jq >/dev/null
rm -rf /var/lib/apt/lists/*

# CPython 3.11 via uv's standalone builds (pinned installer, no PPA).
curl -LsSf "https://astral.sh/uv/${UV_VERSION}/install.sh" | env UV_INSTALL_DIR=/usr/local/bin INSTALLER_NO_MODIFY_PATH=1 sh
uv venv /opt/py311 --python 3.11 --quiet
uv pip install --python /opt/py311/bin/python --quiet cryptography opentimestamps-client huggingface_hub
ln -sf /opt/py311/bin/python /usr/local/bin/python3.11
ln -sf /opt/py311/bin/hf /usr/local/bin/hf

# wrangler: deploy.yml runs `npx wrangler` (unpinned latest). A global install pins the
# major so an npx resolve does not fetch at deploy time; `npx wrangler` in deploy.sh
# stays byte-identical to the workflow.
npm install -g --no-audit --no-fund "wrangler@${WRANGLER_VERSION}" >/dev/null

mkdir -p /opt/ci-runner/health
{
  echo "csoai ci-runner — Hugging Face Jobs second runner for councilof-ai"
  echo "built: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "node: $(node -v)"
  echo "npm: $(npm -v)"
  echo "python3.11: $(/opt/py311/bin/python --version 2>&1)"
  echo "wrangler: $(wrangler --version 2>&1 | tail -n1)"
  echo "git: $(git --version)"
  echo "playwright browsers: $(ls /ms-playwright 2>/dev/null | tr '\n' ' ')"
} > /opt/ci-runner/health/index.html
cat /opt/ci-runner/health/index.html
