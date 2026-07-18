#!/usr/bin/env bash
# Driver for mcpize.com batch submission.
# PREREQ:  npx mcpize login    (interactive Nick-only step)
# Then:    bash mcpize_batch.sh 2>&1 | tee mcpize_batch.log
#
# Per server we:
#   1) scaffold a thin wrapper that re-exports the PyPI MCP
#   2) deploy via `npx mcpize deploy --name <pkg>`
# If mcpize adds a JSON-based create endpoint later, prefer that.
set -euo pipefail
OUT=~/clawd/.local-tools/mcpize_wrappers && mkdir -p "$OUT" && cd "$OUT"

# === a2a-governance-bridge-mcp (lvp, £9/mo) ===
if [ ! -d "a2a-governance-bridge-mcp" ]; then
  npx -y mcpize init "a2a-governance-bridge-mcp" --description "A2A Governance Bridge — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_a2a-governance-bridge-mcp
fi
(cd "a2a-governance-bridge-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../a2a-governance-bridge-mcp.deploy.log) || echo FAIL_a2a-governance-bridge-mcp

# === accessibility-ai-mcp (lvp, £9/mo) ===
if [ ! -d "accessibility-ai-mcp" ]; then
  npx -y mcpize init "accessibility-ai-mcp" --description "Accessibility Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_accessibility-ai-mcp
fi
(cd "accessibility-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../accessibility-ai-mcp.deploy.log) || echo FAIL_accessibility-ai-mcp

# === accounting-ai-mcp (lvp, £9/mo) ===
if [ ! -d "accounting-ai-mcp" ]; then
  npx -y mcpize init "accounting-ai-mcp" --description "Accounting Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_accounting-ai-mcp
fi
(cd "accounting-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../accounting-ai-mcp.deploy.log) || echo FAIL_accounting-ai-mcp

# === ad-copy-ai-mcp (lvp, £9/mo) ===
if [ ! -d "ad-copy-ai-mcp" ]; then
  npx -y mcpize init "ad-copy-ai-mcp" --description "Ad Copy Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI A" || echo SKIP_INIT_ad-copy-ai-mcp
fi
(cd "ad-copy-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ad-copy-ai-mcp.deploy.log) || echo FAIL_ad-copy-ai-mcp

# === agent-audit-logger-mcp (hvp, £79/mo) ===
if [ ! -d "agent-audit-logger-mcp" ]; then
  npx -y mcpize init "agent-audit-logger-mcp" --description "Agent Audit Logger — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal." || echo SKIP_INIT_agent-audit-logger-mcp
fi
(cd "agent-audit-logger-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../agent-audit-logger-mcp.deploy.log) || echo FAIL_agent-audit-logger-mcp

# === agent-commerce-payments-mcp (mvp, £29/mo) ===
if [ ! -d "agent-commerce-payments-mcp" ]; then
  npx -y mcpize init "agent-commerce-payments-mcp" --description "Agent Commerce Payments — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: fi" || echo SKIP_INIT_agent-commerce-payments-mcp
fi
(cd "agent-commerce-payments-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-commerce-payments-mcp.deploy.log) || echo FAIL_agent-commerce-payments-mcp

# === agent-commerce-protocol-mcp (mvp, £29/mo) ===
if [ ! -d "agent-commerce-protocol-mcp" ]; then
  npx -y mcpize init "agent-commerce-protocol-mcp" --description "Agent Commerce Protocol — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: ge" || echo SKIP_INIT_agent-commerce-protocol-mcp
fi
(cd "agent-commerce-protocol-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-commerce-protocol-mcp.deploy.log) || echo FAIL_agent-commerce-protocol-mcp

# === agent-content-watermark-mcp (mvp, £29/mo) ===
if [ ! -d "agent-content-watermark-mcp" ]; then
  npx -y mcpize init "agent-content-watermark-mcp" --description "Agent Content Watermark — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: me" || echo SKIP_INIT_agent-content-watermark-mcp
fi
(cd "agent-content-watermark-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-content-watermark-mcp.deploy.log) || echo FAIL_agent-content-watermark-mcp

# === agent-cost-allocator-mcp (mvp, £29/mo) ===
if [ ! -d "agent-cost-allocator-mcp" ]; then
  npx -y mcpize init "agent-cost-allocator-mcp" --description "Agent Cost Allocator — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gener" || echo SKIP_INIT_agent-cost-allocator-mcp
fi
(cd "agent-cost-allocator-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-cost-allocator-mcp.deploy.log) || echo FAIL_agent-cost-allocator-mcp

# === agent-data-residency-mcp (mvp, £29/mo) ===
if [ ! -d "agent-data-residency-mcp" ]; then
  npx -y mcpize init "agent-data-residency-mcp" --description "Agent Data Residency — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gener" || echo SKIP_INIT_agent-data-residency-mcp
fi
(cd "agent-data-residency-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-data-residency-mcp.deploy.log) || echo FAIL_agent-data-residency-mcp

# === agent-delegation-mcp (mvp, £29/mo) ===
if [ ! -d "agent-delegation-mcp" ]; then
  npx -y mcpize init "agent-delegation-mcp" --description "Agent Delegation — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. " || echo SKIP_INIT_agent-delegation-mcp
fi
(cd "agent-delegation-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-delegation-mcp.deploy.log) || echo FAIL_agent-delegation-mcp

# === agent-handoff-certified-mcp (mvp, £29/mo) ===
if [ ! -d "agent-handoff-certified-mcp" ]; then
  npx -y mcpize init "agent-handoff-certified-mcp" --description "Agent Handoff Certified — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: ge" || echo SKIP_INIT_agent-handoff-certified-mcp
fi
(cd "agent-handoff-certified-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-handoff-certified-mcp.deploy.log) || echo FAIL_agent-handoff-certified-mcp

# === agent-identity-trust-mcp (mvp, £29/mo) ===
if [ ! -d "agent-identity-trust-mcp" ]; then
  npx -y mcpize init "agent-identity-trust-mcp" --description "Agent Identity Trust — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gener" || echo SKIP_INIT_agent-identity-trust-mcp
fi
(cd "agent-identity-trust-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-identity-trust-mcp.deploy.log) || echo FAIL_agent-identity-trust-mcp

# === agent-incident-relay-mcp (mvp, £29/mo) ===
if [ ! -d "agent-incident-relay-mcp" ]; then
  npx -y mcpize init "agent-incident-relay-mcp" --description "Agent Incident Relay — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gener" || echo SKIP_INIT_agent-incident-relay-mcp
fi
(cd "agent-incident-relay-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-incident-relay-mcp.deploy.log) || echo FAIL_agent-incident-relay-mcp

# === agent-incident-reporter-mcp (mvp, £29/mo) ===
if [ ! -d "agent-incident-reporter-mcp" ]; then
  npx -y mcpize init "agent-incident-reporter-mcp" --description "Agent Incident Reporter — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: ge" || echo SKIP_INIT_agent-incident-reporter-mcp
fi
(cd "agent-incident-reporter-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-incident-reporter-mcp.deploy.log) || echo FAIL_agent-incident-reporter-mcp

# === agent-mcp-router-mcp (mvp, £29/mo) ===
if [ ! -d "agent-mcp-router-mcp" ]; then
  npx -y mcpize init "agent-mcp-router-mcp" --description "Agent Router — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. EU A" || echo SKIP_INIT_agent-mcp-router-mcp
fi
(cd "agent-mcp-router-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-mcp-router-mcp.deploy.log) || echo FAIL_agent-mcp-router-mcp

# === agent-negotiation-mcp (mvp, £29/mo) ===
if [ ! -d "agent-negotiation-mcp" ]; then
  npx -y mcpize init "agent-negotiation-mcp" --description "Agent Negotiation — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general." || echo SKIP_INIT_agent-negotiation-mcp
fi
(cd "agent-negotiation-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-negotiation-mcp.deploy.log) || echo FAIL_agent-negotiation-mcp

# === agent-orchestrator-mcp (mvp, £29/mo) ===
if [ ! -d "agent-orchestrator-mcp" ]; then
  npx -y mcpize init "agent-orchestrator-mcp" --description "Agent Orchestrator — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general" || echo SKIP_INIT_agent-orchestrator-mcp
fi
(cd "agent-orchestrator-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-orchestrator-mcp.deploy.log) || echo FAIL_agent-orchestrator-mcp

# === agent-policy-enforcement-mcp (mvp, £29/mo) ===
if [ ! -d "agent-policy-enforcement-mcp" ]; then
  npx -y mcpize init "agent-policy-enforcement-mcp" --description "Agent Policy Enforcement — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: g" || echo SKIP_INIT_agent-policy-enforcement-mcp
fi
(cd "agent-policy-enforcement-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-policy-enforcement-mcp.deploy.log) || echo FAIL_agent-policy-enforcement-mcp

# === agent-prompt-injection-firewall-mcp (mvp, £29/mo) ===
if [ ! -d "agent-prompt-injection-firewall-mcp" ]; then
  npx -y mcpize init "agent-prompt-injection-firewall-mcp" --description "Agent Prompt Injection Firewall — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sec" || echo SKIP_INIT_agent-prompt-injection-firewall-mcp
fi
(cd "agent-prompt-injection-firewall-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-prompt-injection-firewall-mcp.deploy.log) || echo FAIL_agent-prompt-injection-firewall-mcp

# === agent-rate-limiter-mcp (mvp, £29/mo) ===
if [ ! -d "agent-rate-limiter-mcp" ]; then
  npx -y mcpize init "agent-rate-limiter-mcp" --description "Agent Rate Limiter — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general" || echo SKIP_INIT_agent-rate-limiter-mcp
fi
(cd "agent-rate-limiter-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-rate-limiter-mcp.deploy.log) || echo FAIL_agent-rate-limiter-mcp

# === agent-replay-debugger-mcp (mvp, £29/mo) ===
if [ ! -d "agent-replay-debugger-mcp" ]; then
  npx -y mcpize init "agent-replay-debugger-mcp" --description "Agent Replay Debugger — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gene" || echo SKIP_INIT_agent-replay-debugger-mcp
fi
(cd "agent-replay-debugger-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-replay-debugger-mcp.deploy.log) || echo FAIL_agent-replay-debugger-mcp

# === agent-token-budget-mcp (mvp, £29/mo) ===
if [ ! -d "agent-token-budget-mcp" ]; then
  npx -y mcpize init "agent-token-budget-mcp" --description "Agent Token Budget — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general" || echo SKIP_INIT_agent-token-budget-mcp
fi
(cd "agent-token-budget-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-token-budget-mcp.deploy.log) || echo FAIL_agent-token-budget-mcp

# === agent-x402-paywall-mcp (mvp, £29/mo) ===
if [ ! -d "agent-x402-paywall-mcp" ]; then
  npx -y mcpize init "agent-x402-paywall-mcp" --description "Agent X402 Paywall — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: finance" || echo SKIP_INIT_agent-x402-paywall-mcp
fi
(cd "agent-x402-paywall-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../agent-x402-paywall-mcp.deploy.log) || echo FAIL_agent-x402-paywall-mcp

# === agriculture-robotics-mcp (lvp, £9/mo) ===
if [ ! -d "agriculture-robotics-mcp" ]; then
  npx -y mcpize init "agriculture-robotics-mcp" --description "Agriculture Robotics — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_agriculture-robotics-mcp
fi
(cd "agriculture-robotics-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../agriculture-robotics-mcp.deploy.log) || echo FAIL_agriculture-robotics-mcp

# === ai-bom-mcp (lvp, £9/mo) ===
if [ ! -d "ai-bom-mcp" ]; then
  npx -y mcpize init "ai-bom-mcp" --description "Ai Bom — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act /" || echo SKIP_INIT_ai-bom-mcp
fi
(cd "ai-bom-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ai-bom-mcp.deploy.log) || echo FAIL_ai-bom-mcp

# === ai-gateway-mcp (lvp, £9/mo) ===
if [ ! -d "ai-gateway-mcp" ]; then
  npx -y mcpize init "ai-gateway-mcp" --description "Ai Gateway — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI A" || echo SKIP_INIT_ai-gateway-mcp
fi
(cd "ai-gateway-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ai-gateway-mcp.deploy.log) || echo FAIL_ai-gateway-mcp

# === ai-incident-reporting-mcp (lvp, £9/mo) ===
if [ ! -d "ai-incident-reporting-mcp" ]; then
  npx -y mcpize init "ai-incident-reporting-mcp" --description "Ai Incident Reporting — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_ai-incident-reporting-mcp
fi
(cd "ai-incident-reporting-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ai-incident-reporting-mcp.deploy.log) || echo FAIL_ai-incident-reporting-mcp

# === ai-ops-mcp (lvp, £9/mo) ===
if [ ! -d "ai-ops-mcp" ]; then
  npx -y mcpize init "ai-ops-mcp" --description "Ai Ops — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act /" || echo SKIP_INIT_ai-ops-mcp
fi
(cd "ai-ops-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ai-ops-mcp.deploy.log) || echo FAIL_ai-ops-mcp

# === ai-reflection-mcp (lvp, £9/mo) ===
if [ ! -d "ai-reflection-mcp" ]; then
  npx -y mcpize init "ai-reflection-mcp" --description "Ai Reflection — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_ai-reflection-mcp
fi
(cd "ai-reflection-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ai-reflection-mcp.deploy.log) || echo FAIL_ai-reflection-mcp

# === ai-self-audit-mcp (hvp, £79/mo) ===
if [ ! -d "ai-self-audit-mcp" ]; then
  npx -y mcpize init "ai-self-audit-mcp" --description "Ai Self Audit — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal. EU A" || echo SKIP_INIT_ai-self-audit-mcp
fi
(cd "ai-self-audit-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../ai-self-audit-mcp.deploy.log) || echo FAIL_ai-self-audit-mcp

# === airspace-monitor-mcp (lvp, £9/mo) ===
if [ ! -d "airspace-monitor-mcp" ]; then
  npx -y mcpize init "airspace-monitor-mcp" --description "Airspace Monitor — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_airspace-monitor-mcp
fi
(cd "airspace-monitor-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../airspace-monitor-mcp.deploy.log) || echo FAIL_airspace-monitor-mcp

# === aml-ai-mcp (lvp, £9/mo) ===
if [ ! -d "aml-ai-mcp" ]; then
  npx -y mcpize init "aml-ai-mcp" --description "Aml Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: finance. EU AI Act /" || echo SKIP_INIT_aml-ai-mcp
fi
(cd "aml-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../aml-ai-mcp.deploy.log) || echo FAIL_aml-ai-mcp

# === api-docs-generator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "api-docs-generator-ai-mcp" ]; then
  npx -y mcpize init "api-docs-generator-ai-mcp" --description "Api Docs Generator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_api-docs-generator-ai-mcp
fi
(cd "api-docs-generator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../api-docs-generator-ai-mcp.deploy.log) || echo FAIL_api-docs-generator-ai-mcp

# === api-tester-ai-mcp (mvp, £29/mo) ===
if [ ! -d "api-tester-ai-mcp" ]; then
  npx -y mcpize init "api-tester-ai-mcp" --description "Api Tester Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. EU " || echo SKIP_INIT_api-tester-ai-mcp
fi
(cd "api-tester-ai-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../api-tester-ai-mcp.deploy.log) || echo FAIL_api-tester-ai-mcp

# === ascii-art-ai-mcp (lvp, £9/mo) ===
if [ ! -d "ascii-art-ai-mcp" ]; then
  npx -y mcpize init "ascii-art-ai-mcp" --description "Ascii Art Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_ascii-art-ai-mcp
fi
(cd "ascii-art-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ascii-art-ai-mcp.deploy.log) || echo FAIL_ascii-art-ai-mcp

# === backup-ai-mcp (lvp, £9/mo) ===
if [ ! -d "backup-ai-mcp" ]; then
  npx -y mcpize init "backup-ai-mcp" --description "Backup Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Ac" || echo SKIP_INIT_backup-ai-mcp
fi
(cd "backup-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../backup-ai-mcp.deploy.log) || echo FAIL_backup-ai-mcp

# === basel-ai-overlay-mcp (lvp, £9/mo) ===
if [ ! -d "basel-ai-overlay-mcp" ]; then
  npx -y mcpize init "basel-ai-overlay-mcp" --description "Basel Ai Overlay — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_basel-ai-overlay-mcp
fi
(cd "basel-ai-overlay-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../basel-ai-overlay-mcp.deploy.log) || echo FAIL_basel-ai-overlay-mcp

# === bft-governance-mcp (lvp, £9/mo) ===
if [ ! -d "bft-governance-mcp" ]; then
  npx -y mcpize init "bft-governance-mcp" --description "Bft Governance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_bft-governance-mcp
fi
(cd "bft-governance-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../bft-governance-mcp.deploy.log) || echo FAIL_bft-governance-mcp

# === bft-progress-council-mcp (lvp, £9/mo) ===
if [ ! -d "bft-progress-council-mcp" ]; then
  npx -y mcpize init "bft-progress-council-mcp" --description "Bft Progress Council — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_bft-progress-council-mcp
fi
(cd "bft-progress-council-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../bft-progress-council-mcp.deploy.log) || echo FAIL_bft-progress-council-mcp

# === bias-detection-mcp (lvp, £9/mo) ===
if [ ! -d "bias-detection-mcp" ]; then
  npx -y mcpize init "bias-detection-mcp" --description "Bias Detection — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_bias-detection-mcp
fi
(cd "bias-detection-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../bias-detection-mcp.deploy.log) || echo FAIL_bias-detection-mcp

# === blockchain-ai-mcp (lvp, £9/mo) ===
if [ ! -d "blockchain-ai-mcp" ]; then
  npx -y mcpize init "blockchain-ai-mcp" --description "Blockchain Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_blockchain-ai-mcp
fi
(cd "blockchain-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../blockchain-ai-mcp.deploy.log) || echo FAIL_blockchain-ai-mcp

# === blockchain-verification-mcp (lvp, £9/mo) ===
if [ ! -d "blockchain-verification-mcp" ]; then
  npx -y mcpize init "blockchain-verification-mcp" --description "Blockchain Verification — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_blockchain-verification-mcp
fi
(cd "blockchain-verification-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../blockchain-verification-mcp.deploy.log) || echo FAIL_blockchain-verification-mcp

# === budget-planner-ai-mcp (lvp, £9/mo) ===
if [ ! -d "budget-planner-ai-mcp" ]; then
  npx -y mcpize init "budget-planner-ai-mcp" --description "Budget Planner Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_budget-planner-ai-mcp
fi
(cd "budget-planner-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../budget-planner-ai-mcp.deploy.log) || echo FAIL_budget-planner-ai-mcp

# === c2pa-watermark-mcp (lvp, £9/mo) ===
if [ ! -d "c2pa-watermark-mcp" ]; then
  npx -y mcpize init "c2pa-watermark-mcp" --description "C2Pa Watermark — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_c2pa-watermark-mcp
fi
(cd "c2pa-watermark-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../c2pa-watermark-mcp.deploy.log) || echo FAIL_c2pa-watermark-mcp

# === calendar-ai-mcp (lvp, £9/mo) ===
if [ ! -d "calendar-ai-mcp" ]; then
  npx -y mcpize init "calendar-ai-mcp" --description "Calendar Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_calendar-ai-mcp
fi
(cd "calendar-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../calendar-ai-mcp.deploy.log) || echo FAIL_calendar-ai-mcp

# === canada-aida-ai-mcp (lvp, £9/mo) ===
if [ ! -d "canada-aida-ai-mcp" ]; then
  npx -y mcpize init "canada-aida-ai-mcp" --description "Canada Aida Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_canada-aida-ai-mcp
fi
(cd "canada-aida-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../canada-aida-ai-mcp.deploy.log) || echo FAIL_canada-aida-ai-mcp

# === care-home-cqc-mcp (lvp, £9/mo) ===
if [ ! -d "care-home-cqc-mcp" ]; then
  npx -y mcpize init "care-home-cqc-mcp" --description "Care Home Cqc — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthcare. E" || echo SKIP_INIT_care-home-cqc-mcp
fi
(cd "care-home-cqc-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../care-home-cqc-mcp.deploy.log) || echo FAIL_care-home-cqc-mcp

# === care-home-scheduling-mcp (lvp, £9/mo) ===
if [ ! -d "care-home-scheduling-mcp" ]; then
  npx -y mcpize init "care-home-scheduling-mcp" --description "Care Home Scheduling — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: health" || echo SKIP_INIT_care-home-scheduling-mcp
fi
(cd "care-home-scheduling-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../care-home-scheduling-mcp.deploy.log) || echo FAIL_care-home-scheduling-mcp

# === care-membrane-mcp (lvp, £9/mo) ===
if [ ! -d "care-membrane-mcp" ]; then
  npx -y mcpize init "care-membrane-mcp" --description "Care Membrane — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthcare. E" || echo SKIP_INIT_care-membrane-mcp
fi
(cd "care-membrane-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../care-membrane-mcp.deploy.log) || echo FAIL_care-membrane-mcp

# === changelog-ai-mcp (lvp, £9/mo) ===
if [ ! -d "changelog-ai-mcp" ]; then
  npx -y mcpize init "changelog-ai-mcp" --description "Changelog Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_changelog-ai-mcp
fi
(cd "changelog-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../changelog-ai-mcp.deploy.log) || echo FAIL_changelog-ai-mcp

# === chas-elite-prep-mcp (lvp, £9/mo) ===
if [ ! -d "chas-elite-prep-mcp" ]; then
  npx -y mcpize init "chas-elite-prep-mcp" --description "Chas Elite Prep — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_chas-elite-prep-mcp
fi
(cd "chas-elite-prep-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../chas-elite-prep-mcp.deploy.log) || echo FAIL_chas-elite-prep-mcp

# === churn-predictor-ai-mcp (lvp, £9/mo) ===
if [ ! -d "churn-predictor-ai-mcp" ]; then
  npx -y mcpize init "churn-predictor-ai-mcp" --description "Churn Predictor Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_churn-predictor-ai-mcp
fi
(cd "churn-predictor-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../churn-predictor-ai-mcp.deploy.log) || echo FAIL_churn-predictor-ai-mcp

# === ci-cd-generator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "ci-cd-generator-ai-mcp" ]; then
  npx -y mcpize init "ci-cd-generator-ai-mcp" --description "Ci Cd Generator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_ci-cd-generator-ai-mcp
fi
(cd "ci-cd-generator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ci-cd-generator-ai-mcp.deploy.log) || echo FAIL_ci-cd-generator-ai-mcp

# === cisa-kev-mcp (lvp, £9/mo) ===
if [ ! -d "cisa-kev-mcp" ]; then
  npx -y mcpize init "cisa-kev-mcp" --description "Cisa Kev — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act" || echo SKIP_INIT_cisa-kev-mcp
fi
(cd "cisa-kev-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../cisa-kev-mcp.deploy.log) || echo FAIL_cisa-kev-mcp

# === citation-finder-ai-mcp (lvp, £9/mo) ===
if [ ! -d "citation-finder-ai-mcp" ]; then
  npx -y mcpize init "citation-finder-ai-mcp" --description "Citation Finder Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_citation-finder-ai-mcp
fi
(cd "citation-finder-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../citation-finder-ai-mcp.deploy.log) || echo FAIL_citation-finder-ai-mcp

# === cli-builder-ai-mcp (lvp, £9/mo) ===
if [ ! -d "cli-builder-ai-mcp" ]; then
  npx -y mcpize init "cli-builder-ai-mcp" --description "Cli Builder Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_cli-builder-ai-mcp
fi
(cd "cli-builder-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../cli-builder-ai-mcp.deploy.log) || echo FAIL_cli-builder-ai-mcp

# === clinical-trials-ai-mcp (lvp, £9/mo) ===
if [ ! -d "clinical-trials-ai-mcp" ]; then
  npx -y mcpize init "clinical-trials-ai-mcp" --description "Clinical Trials Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthca" || echo SKIP_INIT_clinical-trials-ai-mcp
fi
(cd "clinical-trials-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../clinical-trials-ai-mcp.deploy.log) || echo FAIL_clinical-trials-ai-mcp

# === clipboard-ai-mcp (lvp, £9/mo) ===
if [ ! -d "clipboard-ai-mcp" ]; then
  npx -y mcpize init "clipboard-ai-mcp" --description "Clipboard Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_clipboard-ai-mcp
fi
(cd "clipboard-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../clipboard-ai-mcp.deploy.log) || echo FAIL_clipboard-ai-mcp

# === cobol-bridge-mcp (lvp, £9/mo) ===
if [ ! -d "cobol-bridge-mcp" ]; then
  npx -y mcpize init "cobol-bridge-mcp" --description "Cobol Bridge — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_cobol-bridge-mcp
fi
(cd "cobol-bridge-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../cobol-bridge-mcp.deploy.log) || echo FAIL_cobol-bridge-mcp

# === code-executor-mcp (mvp, £29/mo) ===
if [ ! -d "code-executor-mcp" ]; then
  npx -y mcpize init "code-executor-mcp" --description "Code Executor — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. EU " || echo SKIP_INIT_code-executor-mcp
fi
(cd "code-executor-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../code-executor-mcp.deploy.log) || echo FAIL_code-executor-mcp

# === code-reviewer-ai-mcp (mvp, £29/mo) ===
if [ ! -d "code-reviewer-ai-mcp" ]; then
  npx -y mcpize init "code-reviewer-ai-mcp" --description "Code Reviewer Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. " || echo SKIP_INIT_code-reviewer-ai-mcp
fi
(cd "code-reviewer-ai-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../code-reviewer-ai-mcp.deploy.log) || echo FAIL_code-reviewer-ai-mcp

# === color-ai-mcp (lvp, £9/mo) ===
if [ ! -d "color-ai-mcp" ]; then
  npx -y mcpize init "color-ai-mcp" --description "Color Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act" || echo SKIP_INIT_color-ai-mcp
fi
(cd "color-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../color-ai-mcp.deploy.log) || echo FAIL_color-ai-mcp

# === commit-message-ai-mcp (lvp, £9/mo) ===
if [ ! -d "commit-message-ai-mcp" ]; then
  npx -y mcpize init "commit-message-ai-mcp" --description "Commit Message Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_commit-message-ai-mcp
fi
(cd "commit-message-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../commit-message-ai-mcp.deploy.log) || echo FAIL_commit-message-ai-mcp

# === competitor-monitor-ai-mcp (lvp, £9/mo) ===
if [ ! -d "competitor-monitor-ai-mcp" ]; then
  npx -y mcpize init "competitor-monitor-ai-mcp" --description "Competitor Monitor Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_competitor-monitor-ai-mcp
fi
(cd "competitor-monitor-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../competitor-monitor-ai-mcp.deploy.log) || echo FAIL_competitor-monitor-ai-mcp

# === compression-ai-mcp (lvp, £9/mo) ===
if [ ! -d "compression-ai-mcp" ]; then
  npx -y mcpize init "compression-ai-mcp" --description "Compression Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_compression-ai-mcp
fi
(cd "compression-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../compression-ai-mcp.deploy.log) || echo FAIL_compression-ai-mcp

# === concrete-pump-cpa-mcp (lvp, £9/mo) ===
if [ ! -d "concrete-pump-cpa-mcp" ]; then
  npx -y mcpize init "concrete-pump-cpa-mcp" --description "Concrete Pump Cpa — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_concrete-pump-cpa-mcp
fi
(cd "concrete-pump-cpa-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../concrete-pump-cpa-mcp.deploy.log) || echo FAIL_concrete-pump-cpa-mcp

# === config-validator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "config-validator-ai-mcp" ]; then
  npx -y mcpize init "config-validator-ai-mcp" --description "Config Validator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_config-validator-ai-mcp
fi
(cd "config-validator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../config-validator-ai-mcp.deploy.log) || echo FAIL_config-validator-ai-mcp

# === consciousness-engine-mcp (lvp, £9/mo) ===
if [ ! -d "consciousness-engine-mcp" ]; then
  npx -y mcpize init "consciousness-engine-mcp" --description "Consciousness Engine — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_consciousness-engine-mcp
fi
(cd "consciousness-engine-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../consciousness-engine-mcp.deploy.log) || echo FAIL_consciousness-engine-mcp

# === construction-iso-19650-mcp (hvp, £79/mo) ===
if [ ! -d "construction-iso-19650-mcp" ]; then
  npx -y mcpize init "construction-iso-19650-mcp" --description "Construction Iso 19650 — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: ge" || echo SKIP_INIT_construction-iso-19650-mcp
fi
(cd "construction-iso-19650-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../construction-iso-19650-mcp.deploy.log) || echo FAIL_construction-iso-19650-mcp

# === content-calendar-ai-mcp (lvp, £9/mo) ===
if [ ! -d "content-calendar-ai-mcp" ]; then
  npx -y mcpize init "content-calendar-ai-mcp" --description "Content Calendar Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: media. " || echo SKIP_INIT_content-calendar-ai-mcp
fi
(cd "content-calendar-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../content-calendar-ai-mcp.deploy.log) || echo FAIL_content-calendar-ai-mcp

# === content-registry-mcp (lvp, £9/mo) ===
if [ ! -d "content-registry-mcp" ]; then
  npx -y mcpize init "content-registry-mcp" --description "Content Registry — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: media. EU " || echo SKIP_INIT_content-registry-mcp
fi
(cd "content-registry-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../content-registry-mcp.deploy.log) || echo FAIL_content-registry-mcp

# === contract-review-ai-mcp (mvp, £29/mo) ===
if [ ! -d "contract-review-ai-mcp" ]; then
  npx -y mcpize init "contract-review-ai-mcp" --description "Contract Review Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: legal. " || echo SKIP_INIT_contract-review-ai-mcp
fi
(cd "contract-review-ai-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../contract-review-ai-mcp.deploy.log) || echo FAIL_contract-review-ai-mcp

# === coppa-ferpa-mcp (lvp, £9/mo) ===
if [ ! -d "coppa-ferpa-mcp" ]; then
  npx -y mcpize init "coppa-ferpa-mcp" --description "Coppa Ferpa — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_coppa-ferpa-mcp
fi
(cd "coppa-ferpa-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../coppa-ferpa-mcp.deploy.log) || echo FAIL_coppa-ferpa-mcp

# === cqc-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "cqc-compliance-mcp" ]; then
  npx -y mcpize init "cqc-compliance-mcp" --description "Cqc Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal. EU " || echo SKIP_INIT_cqc-compliance-mcp
fi
(cd "cqc-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../cqc-compliance-mcp.deploy.log) || echo FAIL_cqc-compliance-mcp

# === cra-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "cra-compliance-mcp" ]; then
  npx -y mcpize init "cra-compliance-mcp" --description "Cra Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal. EU " || echo SKIP_INIT_cra-compliance-mcp
fi
(cd "cra-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../cra-compliance-mcp.deploy.log) || echo FAIL_cra-compliance-mcp

# === crane-hire-cpcs-mcp (lvp, £9/mo) ===
if [ ! -d "crane-hire-cpcs-mcp" ]; then
  npx -y mcpize init "crane-hire-cpcs-mcp" --description "Crane Hire Cpcs — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_crane-hire-cpcs-mcp
fi
(cd "crane-hire-cpcs-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../crane-hire-cpcs-mcp.deploy.log) || echo FAIL_crane-hire-cpcs-mcp

# === creativity-engine-mcp (lvp, £9/mo) ===
if [ ! -d "creativity-engine-mcp" ]; then
  npx -y mcpize init "creativity-engine-mcp" --description "Creativity Engine — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_creativity-engine-mcp
fi
(cd "creativity-engine-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../creativity-engine-mcp.deploy.log) || echo FAIL_creativity-engine-mcp

# === crm-ai-mcp (lvp, £9/mo) ===
if [ ! -d "crm-ai-mcp" ]; then
  npx -y mcpize init "crm-ai-mcp" --description "Crm Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act /" || echo SKIP_INIT_crm-ai-mcp
fi
(cd "crm-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../crm-ai-mcp.deploy.log) || echo FAIL_crm-ai-mcp

# === cron-ai-mcp (lvp, £9/mo) ===
if [ ! -d "cron-ai-mcp" ]; then
  npx -y mcpize init "cron-ai-mcp" --description "Cron Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act " || echo SKIP_INIT_cron-ai-mcp
fi
(cd "cron-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../cron-ai-mcp.deploy.log) || echo FAIL_cron-ai-mcp

# === crypto-tracker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "crypto-tracker-ai-mcp" ]; then
  npx -y mcpize init "crypto-tracker-ai-mcp" --description "Crypto Tracker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_crypto-tracker-ai-mcp
fi
(cd "crypto-tracker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../crypto-tracker-ai-mcp.deploy.log) || echo FAIL_crypto-tracker-ai-mcp

# === csoai-governance-crosswalk-mcp (lvp, £9/mo) ===
if [ ! -d "csoai-governance-crosswalk-mcp" ]; then
  npx -y mcpize init "csoai-governance-crosswalk-mcp" --description "Csoai Governance Crosswalk — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: " || echo SKIP_INIT_csoai-governance-crosswalk-mcp
fi
(cd "csoai-governance-crosswalk-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../csoai-governance-crosswalk-mcp.deploy.log) || echo FAIL_csoai-governance-crosswalk-mcp

# === csrd-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "csrd-compliance-mcp" ]; then
  npx -y mcpize init "csrd-compliance-mcp" --description "Csrd Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: governmen" || echo SKIP_INIT_csrd-compliance-mcp
fi
(cd "csrd-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../csrd-compliance-mcp.deploy.log) || echo FAIL_csrd-compliance-mcp

# === csv-analytics-mcp (lvp, £9/mo) ===
if [ ! -d "csv-analytics-mcp" ]; then
  npx -y mcpize init "csv-analytics-mcp" --description "Csv Analytics — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_csv-analytics-mcp
fi
(cd "csv-analytics-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../csv-analytics-mcp.deploy.log) || echo FAIL_csv-analytics-mcp

# === csv-tools-ai-mcp (lvp, £9/mo) ===
if [ ! -d "csv-tools-ai-mcp" ]; then
  npx -y mcpize init "csv-tools-ai-mcp" --description "Csv Tools Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_csv-tools-ai-mcp
fi
(cd "csv-tools-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../csv-tools-ai-mcp.deploy.log) || echo FAIL_csv-tools-ai-mcp

# === currency-converter-ai-mcp (lvp, £9/mo) ===
if [ ! -d "currency-converter-ai-mcp" ]; then
  npx -y mcpize init "currency-converter-ai-mcp" --description "Currency Converter Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_currency-converter-ai-mcp
fi
(cd "currency-converter-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../currency-converter-ai-mcp.deploy.log) || echo FAIL_currency-converter-ai-mcp

# === customer-support-ai-mcp (lvp, £9/mo) ===
if [ ! -d "customer-support-ai-mcp" ]; then
  npx -y mcpize init "customer-support-ai-mcp" --description "Customer Support Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_customer-support-ai-mcp
fi
(cd "customer-support-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../customer-support-ai-mcp.deploy.log) || echo FAIL_customer-support-ai-mcp

# === cybersecurity-ai-mcp (hvp, £79/mo) ===
if [ ! -d "cybersecurity-ai-mcp" ]; then
  npx -y mcpize init "cybersecurity-ai-mcp" --description "Cybersecurity Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: general." || echo SKIP_INIT_cybersecurity-ai-mcp
fi
(cd "cybersecurity-ai-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../cybersecurity-ai-mcp.deploy.log) || echo FAIL_cybersecurity-ai-mcp

# === data-science-ai-mcp (lvp, £9/mo) ===
if [ ! -d "data-science-ai-mcp" ]; then
  npx -y mcpize init "data-science-ai-mcp" --description "Data Science Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_data-science-ai-mcp
fi
(cd "data-science-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../data-science-ai-mcp.deploy.log) || echo FAIL_data-science-ai-mcp

# === database-universal-mcp (lvp, £9/mo) ===
if [ ! -d "database-universal-mcp" ]; then
  npx -y mcpize init "database-universal-mcp" --description "Database Universal — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_database-universal-mcp
fi
(cd "database-universal-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../database-universal-mcp.deploy.log) || echo FAIL_database-universal-mcp

# === dataprivacy-ai-mcp (lvp, £9/mo) ===
if [ ! -d "dataprivacy-ai-mcp" ]; then
  npx -y mcpize init "dataprivacy-ai-mcp" --description "Dataprivacy Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_dataprivacy-ai-mcp
fi
(cd "dataprivacy-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../dataprivacy-ai-mcp.deploy.log) || echo FAIL_dataprivacy-ai-mcp

# === date-calculator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "date-calculator-ai-mcp" ]; then
  npx -y mcpize init "date-calculator-ai-mcp" --description "Date Calculator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_date-calculator-ai-mcp
fi
(cd "date-calculator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../date-calculator-ai-mcp.deploy.log) || echo FAIL_date-calculator-ai-mcp

# === deepfake-detector-mcp (lvp, £9/mo) ===
if [ ! -d "deepfake-detector-mcp" ]; then
  npx -y mcpize init "deepfake-detector-mcp" --description "Deepfake Detector — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_deepfake-detector-mcp
fi
(cd "deepfake-detector-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../deepfake-detector-mcp.deploy.log) || echo FAIL_deepfake-detector-mcp

# === dependency-updater-ai-mcp (lvp, £9/mo) ===
if [ ! -d "dependency-updater-ai-mcp" ]; then
  npx -y mcpize init "dependency-updater-ai-mcp" --description "Dependency Updater Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_dependency-updater-ai-mcp
fi
(cd "dependency-updater-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../dependency-updater-ai-mcp.deploy.log) || echo FAIL_dependency-updater-ai-mcp

# === devops-ai-mcp (lvp, £9/mo) ===
if [ ! -d "devops-ai-mcp" ]; then
  npx -y mcpize init "devops-ai-mcp" --description "Devops Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Ac" || echo SKIP_INIT_devops-ai-mcp
fi
(cd "devops-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../devops-ai-mcp.deploy.log) || echo FAIL_devops-ai-mcp

# === diff-ai-mcp (lvp, £9/mo) ===
if [ ! -d "diff-ai-mcp" ]; then
  npx -y mcpize init "diff-ai-mcp" --description "Diff Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act " || echo SKIP_INIT_diff-ai-mcp
fi
(cd "diff-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../diff-ai-mcp.deploy.log) || echo FAIL_diff-ai-mcp

# === dispense-record-mcp (lvp, £9/mo) ===
if [ ! -d "dispense-record-mcp" ]; then
  npx -y mcpize init "dispense-record-mcp" --description "Dispense Record — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_dispense-record-mcp
fi
(cd "dispense-record-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../dispense-record-mcp.deploy.log) || echo FAIL_dispense-record-mcp

# === docker-helper-ai-mcp (lvp, £9/mo) ===
if [ ! -d "docker-helper-ai-mcp" ]; then
  npx -y mcpize init "docker-helper-ai-mcp" --description "Docker Helper Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_docker-helper-ai-mcp
fi
(cd "docker-helper-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../docker-helper-ai-mcp.deploy.log) || echo FAIL_docker-helper-ai-mcp

# === dockerfile-generator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "dockerfile-generator-ai-mcp" ]; then
  npx -y mcpize init "dockerfile-generator-ai-mcp" --description "Dockerfile Generator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_dockerfile-generator-ai-mcp
fi
(cd "dockerfile-generator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../dockerfile-generator-ai-mcp.deploy.log) || echo FAIL_dockerfile-generator-ai-mcp

# === document-comparison-ai-mcp (hvp, £79/mo) ===
if [ ! -d "document-comparison-ai-mcp" ]; then
  npx -y mcpize init "document-comparison-ai-mcp" --description "Document Comparison Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: ge" || echo SKIP_INIT_document-comparison-ai-mcp
fi
(cd "document-comparison-ai-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../document-comparison-ai-mcp.deploy.log) || echo FAIL_document-comparison-ai-mcp

# === domiciliary-care-mcp (lvp, £9/mo) ===
if [ ! -d "domiciliary-care-mcp" ]; then
  npx -y mcpize init "domiciliary-care-mcp" --description "Domiciliary Care — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthcare" || echo SKIP_INIT_domiciliary-care-mcp
fi
(cd "domiciliary-care-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../domiciliary-care-mcp.deploy.log) || echo FAIL_domiciliary-care-mcp

# === dora-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "dora-compliance-mcp" ]; then
  npx -y mcpize init "dora-compliance-mcp" --description "Dora Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal. EU" || echo SKIP_INIT_dora-compliance-mcp
fi
(cd "dora-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../dora-compliance-mcp.deploy.log) || echo FAIL_dora-compliance-mcp

# === dora-nis2-crosswalk-mcp (hvp, £79/mo) ===
if [ ! -d "dora-nis2-crosswalk-mcp" ]; then
  npx -y mcpize init "dora-nis2-crosswalk-mcp" --description "Dora Nis2 Crosswalk — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: gener" || echo SKIP_INIT_dora-nis2-crosswalk-mcp
fi
(cd "dora-nis2-crosswalk-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../dora-nis2-crosswalk-mcp.deploy.log) || echo FAIL_dora-nis2-crosswalk-mcp

# === drone-airspace-governance-mcp (lvp, £9/mo) ===
if [ ! -d "drone-airspace-governance-mcp" ]; then
  npx -y mcpize init "drone-airspace-governance-mcp" --description "Drone Airspace Governance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: g" || echo SKIP_INIT_drone-airspace-governance-mcp
fi
(cd "drone-airspace-governance-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../drone-airspace-governance-mcp.deploy.log) || echo FAIL_drone-airspace-governance-mcp

# === ecommerce-ai-mcp (lvp, £9/mo) ===
if [ ! -d "ecommerce-ai-mcp" ]; then
  npx -y mcpize init "ecommerce-ai-mcp" --description "Ecommerce Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: retail. EU AI " || echo SKIP_INIT_ecommerce-ai-mcp
fi
(cd "ecommerce-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ecommerce-ai-mcp.deploy.log) || echo FAIL_ecommerce-ai-mcp

# === education-ai-mcp (lvp, £9/mo) ===
if [ ! -d "education-ai-mcp" ]; then
  npx -y mcpize init "education-ai-mcp" --description "Education Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: education. EU " || echo SKIP_INIT_education-ai-mcp
fi
(cd "education-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../education-ai-mcp.deploy.log) || echo FAIL_education-ai-mcp

# === email-automation-mcp (lvp, £9/mo) ===
if [ ! -d "email-automation-mcp" ]; then
  npx -y mcpize init "email-automation-mcp" --description "Email Automation — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_email-automation-mcp
fi
(cd "email-automation-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../email-automation-mcp.deploy.log) || echo FAIL_email-automation-mcp

# === email-validator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "email-validator-ai-mcp" ]; then
  npx -y mcpize init "email-validator-ai-mcp" --description "Email Validator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_email-validator-ai-mcp
fi
(cd "email-validator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../email-validator-ai-mcp.deploy.log) || echo FAIL_email-validator-ai-mcp

# === emoji-ai-mcp (lvp, £9/mo) ===
if [ ! -d "emoji-ai-mcp" ]; then
  npx -y mcpize init "emoji-ai-mcp" --description "Emoji Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act" || echo SKIP_INIT_emoji-ai-mcp
fi
(cd "emoji-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../emoji-ai-mcp.deploy.log) || echo FAIL_emoji-ai-mcp

# === encoder-ai-mcp (mvp, £29/mo) ===
if [ ! -d "encoder-ai-mcp" ]; then
  npx -y mcpize init "encoder-ai-mcp" --description "Encoder Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. EU AI " || echo SKIP_INIT_encoder-ai-mcp
fi
(cd "encoder-ai-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../encoder-ai-mcp.deploy.log) || echo FAIL_encoder-ai-mcp

# === env-manager-ai-mcp (lvp, £9/mo) ===
if [ ! -d "env-manager-ai-mcp" ]; then
  npx -y mcpize init "env-manager-ai-mcp" --description "Env Manager Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_env-manager-ai-mcp
fi
(cd "env-manager-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../env-manager-ai-mcp.deploy.log) || echo FAIL_env-manager-ai-mcp

# === eu-ai-act-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "eu-ai-act-compliance-mcp" ]; then
  npx -y mcpize init "eu-ai-act-compliance-mcp" --description "Eu Ai Act Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: gove" || echo SKIP_INIT_eu-ai-act-compliance-mcp
fi
(cd "eu-ai-act-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../eu-ai-act-compliance-mcp.deploy.log) || echo FAIL_eu-ai-act-compliance-mcp

# === eudi-wallet-mcp (lvp, £9/mo) ===
if [ ! -d "eudi-wallet-mcp" ]; then
  npx -y mcpize init "eudi-wallet-mcp" --description "Eudi Wallet — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_eudi-wallet-mcp
fi
(cd "eudi-wallet-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../eudi-wallet-mcp.deploy.log) || echo FAIL_eudi-wallet-mcp

# === event-planning-ai-mcp (lvp, £9/mo) ===
if [ ! -d "event-planning-ai-mcp" ]; then
  npx -y mcpize init "event-planning-ai-mcp" --description "Event Planning Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_event-planning-ai-mcp
fi
(cd "event-planning-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../event-planning-ai-mcp.deploy.log) || echo FAIL_event-planning-ai-mcp

# === expense-tracker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "expense-tracker-ai-mcp" ]; then
  npx -y mcpize init "expense-tracker-ai-mcp" --description "Expense Tracker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_expense-tracker-ai-mcp
fi
(cd "expense-tracker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../expense-tracker-ai-mcp.deploy.log) || echo FAIL_expense-tracker-ai-mcp

# === explainability-report-mcp (lvp, £9/mo) ===
if [ ! -d "explainability-report-mcp" ]; then
  npx -y mcpize init "explainability-report-mcp" --description "Explainability Report — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_explainability-report-mcp
fi
(cd "explainability-report-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../explainability-report-mcp.deploy.log) || echo FAIL_explainability-report-mcp

# === faker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "faker-ai-mcp" ]; then
  npx -y mcpize init "faker-ai-mcp" --description "Faker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act" || echo SKIP_INIT_faker-ai-mcp
fi
(cd "faker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../faker-ai-mcp.deploy.log) || echo FAIL_faker-ai-mcp

# === fda-samd-mcp (elite, £199/mo) ===
if [ ! -d "fda-samd-mcp" ]; then
  npx -y mcpize init "fda-samd-mcp" --description "Fda Samd — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: elite (£9/mo). Sectors: healthcare. EU AI Act / NIS" || echo SKIP_INIT_fda-samd-mcp
fi
(cd "fda-samd-mcp" && npx -y mcpize deploy --price-gbp 199 2>&1 | tee -a ../fda-samd-mcp.deploy.log) || echo FAIL_fda-samd-mcp

# === feedback-analyzer-ai-mcp (lvp, £9/mo) ===
if [ ! -d "feedback-analyzer-ai-mcp" ]; then
  npx -y mcpize init "feedback-analyzer-ai-mcp" --description "Feedback Analyzer Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_feedback-analyzer-ai-mcp
fi
(cd "feedback-analyzer-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../feedback-analyzer-ai-mcp.deploy.log) || echo FAIL_feedback-analyzer-ai-mcp

# === file-organizer-ai-mcp (lvp, £9/mo) ===
if [ ! -d "file-organizer-ai-mcp" ]; then
  npx -y mcpize init "file-organizer-ai-mcp" --description "File Organizer Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_file-organizer-ai-mcp
fi
(cd "file-organizer-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../file-organizer-ai-mcp.deploy.log) || echo FAIL_file-organizer-ai-mcp

# === firmware-attestation-mcp (mvp, £29/mo) ===
if [ ! -d "firmware-attestation-mcp" ]; then
  npx -y mcpize init "firmware-attestation-mcp" --description "Firmware Attestation — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gener" || echo SKIP_INIT_firmware-attestation-mcp
fi
(cd "firmware-attestation-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../firmware-attestation-mcp.deploy.log) || echo FAIL_firmware-attestation-mcp

# === fishkeeper-ai-mcp (lvp, £9/mo) ===
if [ ! -d "fishkeeper-ai-mcp" ]; then
  npx -y mcpize init "fishkeeper-ai-mcp" --description "Fishkeeper Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_fishkeeper-ai-mcp
fi
(cd "fishkeeper-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../fishkeeper-ai-mcp.deploy.log) || echo FAIL_fishkeeper-ai-mcp

# === fitness-ai-mcp (lvp, £9/mo) ===
if [ ! -d "fitness-ai-mcp" ]; then
  npx -y mcpize init "fitness-ai-mcp" --description "Fitness Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI A" || echo SKIP_INIT_fitness-ai-mcp
fi
(cd "fitness-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../fitness-ai-mcp.deploy.log) || echo FAIL_fitness-ai-mcp

# === flashcard-ai-mcp (lvp, £9/mo) ===
if [ ! -d "flashcard-ai-mcp" ]; then
  npx -y mcpize init "flashcard-ai-mcp" --description "Flashcard Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_flashcard-ai-mcp
fi
(cd "flashcard-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../flashcard-ai-mcp.deploy.log) || echo FAIL_flashcard-ai-mcp

# === flight-logger-mcp (lvp, £9/mo) ===
if [ ! -d "flight-logger-mcp" ]; then
  npx -y mcpize init "flight-logger-mcp" --description "Flight Logger — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_flight-logger-mcp
fi
(cd "flight-logger-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../flight-logger-mcp.deploy.log) || echo FAIL_flight-logger-mcp

# === focus-timer-ai-mcp (lvp, £9/mo) ===
if [ ! -d "focus-timer-ai-mcp" ]; then
  npx -y mcpize init "focus-timer-ai-mcp" --description "Focus Timer Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_focus-timer-ai-mcp
fi
(cd "focus-timer-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../focus-timer-ai-mcp.deploy.log) || echo FAIL_focus-timer-ai-mcp

# === fsa-food-safety-mcp (lvp, £9/mo) ===
if [ ! -d "fsa-food-safety-mcp" ]; then
  npx -y mcpize init "fsa-food-safety-mcp" --description "Fsa Food Safety — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_fsa-food-safety-mcp
fi
(cd "fsa-food-safety-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../fsa-food-safety-mcp.deploy.log) || echo FAIL_fsa-food-safety-mcp

# === gardening-ai-mcp (lvp, £9/mo) ===
if [ ! -d "gardening-ai-mcp" ]; then
  npx -y mcpize init "gardening-ai-mcp" --description "Gardening Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_gardening-ai-mcp
fi
(cd "gardening-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../gardening-ai-mcp.deploy.log) || echo FAIL_gardening-ai-mcp

# === gdpr-compliance-ai-mcp (hvp, £79/mo) ===
if [ ! -d "gdpr-compliance-ai-mcp" ]; then
  npx -y mcpize init "gdpr-compliance-ai-mcp" --description "Gdpr Compliance Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal." || echo SKIP_INIT_gdpr-compliance-ai-mcp
fi
(cd "gdpr-compliance-ai-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../gdpr-compliance-ai-mcp.deploy.log) || echo FAIL_gdpr-compliance-ai-mcp

# === geolocation-ai-mcp (lvp, £9/mo) ===
if [ ! -d "geolocation-ai-mcp" ]; then
  npx -y mcpize init "geolocation-ai-mcp" --description "Geolocation Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_geolocation-ai-mcp
fi
(cd "geolocation-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../geolocation-ai-mcp.deploy.log) || echo FAIL_geolocation-ai-mcp

# === git-helper-ai-mcp (lvp, £9/mo) ===
if [ ! -d "git-helper-ai-mcp" ]; then
  npx -y mcpize init "git-helper-ai-mcp" --description "Git Helper Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_git-helper-ai-mcp
fi
(cd "git-helper-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../git-helper-ai-mcp.deploy.log) || echo FAIL_git-helper-ai-mcp

# === gods-eye-geospatial-mcp (lvp, £9/mo) ===
if [ ! -d "gods-eye-geospatial-mcp" ]; then
  npx -y mcpize init "gods-eye-geospatial-mcp" --description "Gods Eye Geospatial — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_gods-eye-geospatial-mcp
fi
(cd "gods-eye-geospatial-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../gods-eye-geospatial-mcp.deploy.log) || echo FAIL_gods-eye-geospatial-mcp

# === gos-claim-validator-mcp (lvp, £9/mo) ===
if [ ! -d "gos-claim-validator-mcp" ]; then
  npx -y mcpize init "gos-claim-validator-mcp" --description "Gos Claim Validator — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_gos-claim-validator-mcp
fi
(cd "gos-claim-validator-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../gos-claim-validator-mcp.deploy.log) || echo FAIL_gos-claim-validator-mcp

# === grammar-fix-ai-mcp (lvp, £9/mo) ===
if [ ! -d "grammar-fix-ai-mcp" ]; then
  npx -y mcpize init "grammar-fix-ai-mcp" --description "Grammar Fix Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_grammar-fix-ai-mcp
fi
(cd "grammar-fix-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../grammar-fix-ai-mcp.deploy.log) || echo FAIL_grammar-fix-ai-mcp

# === habit-tracker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "habit-tracker-ai-mcp" ]; then
  npx -y mcpize init "habit-tracker-ai-mcp" --description "Habit Tracker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_habit-tracker-ai-mcp
fi
(cd "habit-tracker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../habit-tracker-ai-mcp.deploy.log) || echo FAIL_habit-tracker-ai-mcp

# === hash-utils-ai-mcp (lvp, £9/mo) ===
if [ ! -d "hash-utils-ai-mcp" ]; then
  npx -y mcpize init "hash-utils-ai-mcp" --description "Hash Utils Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_hash-utils-ai-mcp
fi
(cd "hash-utils-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../hash-utils-ai-mcp.deploy.log) || echo FAIL_hash-utils-ai-mcp

# === haulage-uk-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "haulage-uk-compliance-mcp" ]; then
  npx -y mcpize init "haulage-uk-compliance-mcp" --description "Haulage Uk Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: leg" || echo SKIP_INIT_haulage-uk-compliance-mcp
fi
(cd "haulage-uk-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../haulage-uk-compliance-mcp.deploy.log) || echo FAIL_haulage-uk-compliance-mcp

# === health-check-ai-mcp (lvp, £9/mo) ===
if [ ! -d "health-check-ai-mcp" ]; then
  npx -y mcpize init "health-check-ai-mcp" --description "Health Check Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthcare." || echo SKIP_INIT_health-check-ai-mcp
fi
(cd "health-check-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../health-check-ai-mcp.deploy.log) || echo FAIL_health-check-ai-mcp

# === healthcare-ai-governance-mcp (elite, £199/mo) ===
if [ ! -d "healthcare-ai-governance-mcp" ]; then
  npx -y mcpize init "healthcare-ai-governance-mcp" --description "Healthcare Ai Governance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: elite (£9/mo). Sectors: healthcare." || echo SKIP_INIT_healthcare-ai-governance-mcp
fi
(cd "healthcare-ai-governance-mcp" && npx -y mcpize deploy --price-gbp 199 2>&1 | tee -a ../healthcare-ai-governance-mcp.deploy.log) || echo FAIL_healthcare-ai-governance-mcp

# === healthcare-fhir-mcp (elite, £199/mo) ===
if [ ! -d "healthcare-fhir-mcp" ]; then
  npx -y mcpize init "healthcare-fhir-mcp" --description "Healthcare Fhir — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: elite (£9/mo). Sectors: healthcare. EU AI Ac" || echo SKIP_INIT_healthcare-fhir-mcp
fi
(cd "healthcare-fhir-mcp" && npx -y mcpize deploy --price-gbp 199 2>&1 | tee -a ../healthcare-fhir-mcp.deploy.log) || echo FAIL_healthcare-fhir-mcp

# === hipaa-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "hipaa-compliance-mcp" ]; then
  npx -y mcpize init "hipaa-compliance-mcp" --description "Hipaa Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: healthca" || echo SKIP_INIT_hipaa-compliance-mcp
fi
(cd "hipaa-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../hipaa-compliance-mcp.deploy.log) || echo FAIL_hipaa-compliance-mcp

# === hr-management-ai-mcp (lvp, £9/mo) ===
if [ ! -d "hr-management-ai-mcp" ]; then
  npx -y mcpize init "hr-management-ai-mcp" --description "Hr Management Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_hr-management-ai-mcp
fi
(cd "hr-management-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../hr-management-ai-mcp.deploy.log) || echo FAIL_hr-management-ai-mcp

# === html-parser-ai-mcp (lvp, £9/mo) ===
if [ ! -d "html-parser-ai-mcp" ]; then
  npx -y mcpize init "html-parser-ai-mcp" --description "Html Parser Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_html-parser-ai-mcp
fi
(cd "html-parser-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../html-parser-ai-mcp.deploy.log) || echo FAIL_html-parser-ai-mcp

# === hydration-reminder-ai-mcp (lvp, £9/mo) ===
if [ ! -d "hydration-reminder-ai-mcp" ]; then
  npx -y mcpize init "hydration-reminder-ai-mcp" --description "Hydration Reminder Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_hydration-reminder-ai-mcp
fi
(cd "hydration-reminder-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../hydration-reminder-ai-mcp.deploy.log) || echo FAIL_hydration-reminder-ai-mcp

# === icon-generator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "icon-generator-ai-mcp" ]; then
  npx -y mcpize init "icon-generator-ai-mcp" --description "Icon Generator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: governmen" || echo SKIP_INIT_icon-generator-ai-mcp
fi
(cd "icon-generator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../icon-generator-ai-mcp.deploy.log) || echo FAIL_icon-generator-ai-mcp

# === image-metadata-ai-mcp (lvp, £9/mo) ===
if [ ! -d "image-metadata-ai-mcp" ]; then
  npx -y mcpize init "image-metadata-ai-mcp" --description "Image Metadata Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_image-metadata-ai-mcp
fi
(cd "image-metadata-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../image-metadata-ai-mcp.deploy.log) || echo FAIL_image-metadata-ai-mcp

# === insurance-verification-mcp (lvp, £9/mo) ===
if [ ! -d "insurance-verification-mcp" ]; then
  npx -y mcpize init "insurance-verification-mcp" --description "Insurance Verification — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: insu" || echo SKIP_INIT_insurance-verification-mcp
fi
(cd "insurance-verification-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../insurance-verification-mcp.deploy.log) || echo FAIL_insurance-verification-mcp

# === inventory-management-ai-mcp (lvp, £9/mo) ===
if [ ! -d "inventory-management-ai-mcp" ]; then
  npx -y mcpize init "inventory-management-ai-mcp" --description "Inventory Management Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: ret" || echo SKIP_INIT_inventory-management-ai-mcp
fi
(cd "inventory-management-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../inventory-management-ai-mcp.deploy.log) || echo FAIL_inventory-management-ai-mcp

# === invoice-generator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "invoice-generator-ai-mcp" ]; then
  npx -y mcpize init "invoice-generator-ai-mcp" --description "Invoice Generator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_invoice-generator-ai-mcp
fi
(cd "invoice-generator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../invoice-generator-ai-mcp.deploy.log) || echo FAIL_invoice-generator-ai-mcp

# === ip-network-ai-mcp (lvp, £9/mo) ===
if [ ! -d "ip-network-ai-mcp" ]; then
  npx -y mcpize init "ip-network-ai-mcp" --description "Ip Network Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_ip-network-ai-mcp
fi
(cd "ip-network-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../ip-network-ai-mcp.deploy.log) || echo FAIL_ip-network-ai-mcp

# === iso-27001-ai-mcp (hvp, £79/mo) ===
if [ ! -d "iso-27001-ai-mcp" ]; then
  npx -y mcpize init "iso-27001-ai-mcp" --description "Iso 27001 Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: general. EU " || echo SKIP_INIT_iso-27001-ai-mcp
fi
(cd "iso-27001-ai-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../iso-27001-ai-mcp.deploy.log) || echo FAIL_iso-27001-ai-mcp

# === iso-42001-ai-mcp (hvp, £79/mo) ===
if [ ! -d "iso-42001-ai-mcp" ]; then
  npx -y mcpize init "iso-42001-ai-mcp" --description "Iso 42001 Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: general. EU " || echo SKIP_INIT_iso-42001-ai-mcp
fi
(cd "iso-42001-ai-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../iso-42001-ai-mcp.deploy.log) || echo FAIL_iso-42001-ai-mcp

# === iso-42005-impact-mcp (hvp, £79/mo) ===
if [ ! -d "iso-42005-impact-mcp" ]; then
  npx -y mcpize init "iso-42005-impact-mcp" --description "Iso 42005 Impact — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: general." || echo SKIP_INIT_iso-42005-impact-mcp
fi
(cd "iso-42005-impact-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../iso-42005-impact-mcp.deploy.log) || echo FAIL_iso-42005-impact-mcp

# === job-description-ai-mcp (lvp, £9/mo) ===
if [ ! -d "job-description-ai-mcp" ]; then
  npx -y mcpize init "job-description-ai-mcp" --description "Job Description Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_job-description-ai-mcp
fi
(cd "job-description-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../job-description-ai-mcp.deploy.log) || echo FAIL_job-description-ai-mcp

# === json-ai-mcp (lvp, £9/mo) ===
if [ ! -d "json-ai-mcp" ]; then
  npx -y mcpize init "json-ai-mcp" --description "Json Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act " || echo SKIP_INIT_json-ai-mcp
fi
(cd "json-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../json-ai-mcp.deploy.log) || echo FAIL_json-ai-mcp

# === jwt-ai-mcp (lvp, £9/mo) ===
if [ ! -d "jwt-ai-mcp" ]; then
  npx -y mcpize init "jwt-ai-mcp" --description "Jwt Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act /" || echo SKIP_INIT_jwt-ai-mcp
fi
(cd "jwt-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../jwt-ai-mcp.deploy.log) || echo FAIL_jwt-ai-mcp

# === keystone-catalogue-mcp (lvp, £9/mo) ===
if [ ! -d "keystone-catalogue-mcp" ]; then
  npx -y mcpize init "keystone-catalogue-mcp" --description "Keystone Catalogue — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_keystone-catalogue-mcp
fi
(cd "keystone-catalogue-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../keystone-catalogue-mcp.deploy.log) || echo FAIL_keystone-catalogue-mcp

# === keystone-verify-proxy-mcp (lvp, £9/mo) ===
if [ ! -d "keystone-verify-proxy-mcp" ]; then
  npx -y mcpize init "keystone-verify-proxy-mcp" --description "Keystone Verify Proxy — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_keystone-verify-proxy-mcp
fi
(cd "keystone-verify-proxy-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../keystone-verify-proxy-mcp.deploy.log) || echo FAIL_keystone-verify-proxy-mcp

# === keyword-extractor-ai-mcp (lvp, £9/mo) ===
if [ ! -d "keyword-extractor-ai-mcp" ]; then
  npx -y mcpize init "keyword-extractor-ai-mcp" --description "Keyword Extractor Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_keyword-extractor-ai-mcp
fi
(cd "keyword-extractor-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../keyword-extractor-ai-mcp.deploy.log) || echo FAIL_keyword-extractor-ai-mcp

# === korea-ai-basic-act-mcp (lvp, £9/mo) ===
if [ ! -d "korea-ai-basic-act-mcp" ]; then
  npx -y mcpize init "korea-ai-basic-act-mcp" --description "Korea Ai Basic Act — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_korea-ai-basic-act-mcp
fi
(cd "korea-ai-basic-act-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../korea-ai-basic-act-mcp.deploy.log) || echo FAIL_korea-ai-basic-act-mcp

# === landlaw-ai-mcp (lvp, £9/mo) ===
if [ ! -d "landlaw-ai-mcp" ]; then
  npx -y mcpize init "landlaw-ai-mcp" --description "Landlaw Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: legal. EU AI Act" || echo SKIP_INIT_landlaw-ai-mcp
fi
(cd "landlaw-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../landlaw-ai-mcp.deploy.log) || echo FAIL_landlaw-ai-mcp

# === lead-scoring-ai-mcp (lvp, £9/mo) ===
if [ ! -d "lead-scoring-ai-mcp" ]; then
  npx -y mcpize init "lead-scoring-ai-mcp" --description "Lead Scoring Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_lead-scoring-ai-mcp
fi
(cd "lead-scoring-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../lead-scoring-ai-mcp.deploy.log) || echo FAIL_lead-scoring-ai-mcp

# === legal-document-ai-mcp (elite, £199/mo) ===
if [ ! -d "legal-document-ai-mcp" ]; then
  npx -y mcpize init "legal-document-ai-mcp" --description "Legal Document Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: elite (£9/mo). Sectors: legal. EU AI Act /" || echo SKIP_INIT_legal-document-ai-mcp
fi
(cd "legal-document-ai-mcp" && npx -y mcpize deploy --price-gbp 199 2>&1 | tee -a ../legal-document-ai-mcp.deploy.log) || echo FAIL_legal-document-ai-mcp

# === license-checker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "license-checker-ai-mcp" ]; then
  npx -y mcpize init "license-checker-ai-mcp" --description "License Checker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_license-checker-ai-mcp
fi
(cd "license-checker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../license-checker-ai-mcp.deploy.log) || echo FAIL_license-checker-ai-mcp

# === linkedin-outreach-mcp (lvp, £9/mo) ===
if [ ! -d "linkedin-outreach-mcp" ]; then
  npx -y mcpize init "linkedin-outreach-mcp" --description "Linkedin Outreach — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_linkedin-outreach-mcp
fi
(cd "linkedin-outreach-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../linkedin-outreach-mcp.deploy.log) || echo FAIL_linkedin-outreach-mcp

# === llm-compliance-comparison-mcp (hvp, £79/mo) ===
if [ ! -d "llm-compliance-comparison-mcp" ]; then
  npx -y mcpize init "llm-compliance-comparison-mcp" --description "Llm Compliance Comparison — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors:" || echo SKIP_INIT_llm-compliance-comparison-mcp
fi
(cd "llm-compliance-comparison-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../llm-compliance-comparison-mcp.deploy.log) || echo FAIL_llm-compliance-comparison-mcp

# === logistics-ai-mcp (lvp, £9/mo) ===
if [ ! -d "logistics-ai-mcp" ]; then
  npx -y mcpize init "logistics-ai-mcp" --description "Logistics Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: manufacturing," || echo SKIP_INIT_logistics-ai-mcp
fi
(cd "logistics-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../logistics-ai-mcp.deploy.log) || echo FAIL_logistics-ai-mcp

# === lorem-ipsum-ai-mcp (lvp, £9/mo) ===
if [ ! -d "lorem-ipsum-ai-mcp" ]; then
  npx -y mcpize init "lorem-ipsum-ai-mcp" --description "Lorem Ipsum Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_lorem-ipsum-ai-mcp
fi
(cd "lorem-ipsum-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../lorem-ipsum-ai-mcp.deploy.log) || echo FAIL_lorem-ipsum-ai-mcp

# === markdown-ai-mcp (lvp, £9/mo) ===
if [ ! -d "markdown-ai-mcp" ]; then
  npx -y mcpize init "markdown-ai-mcp" --description "Markdown Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_markdown-ai-mcp
fi
(cd "markdown-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../markdown-ai-mcp.deploy.log) || echo FAIL_markdown-ai-mcp

# === marketing-analytics-ai-mcp (lvp, £9/mo) ===
if [ ! -d "marketing-analytics-ai-mcp" ]; then
  npx -y mcpize init "marketing-analytics-ai-mcp" --description "Marketing Analytics Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gene" || echo SKIP_INIT_marketing-analytics-ai-mcp
fi
(cd "marketing-analytics-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../marketing-analytics-ai-mcp.deploy.log) || echo FAIL_marketing-analytics-ai-mcp

# === math-solver-ai-mcp (lvp, £9/mo) ===
if [ ! -d "math-solver-ai-mcp" ]; then
  npx -y mcpize init "math-solver-ai-mcp" --description "Math Solver Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_math-solver-ai-mcp
fi
(cd "math-solver-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../math-solver-ai-mcp.deploy.log) || echo FAIL_math-solver-ai-mcp

# === mcp-scorecard-mcp (lvp, £9/mo) ===
if [ ! -d "mcp-scorecard-mcp" ]; then
  npx -y mcpize init "mcp-scorecard-mcp" --description "Mcp Scorecard — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_mcp-scorecard-mcp
fi
(cd "mcp-scorecard-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mcp-scorecard-mcp.deploy.log) || echo FAIL_mcp-scorecard-mcp

# === mcp-spec-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "mcp-spec-compliance-mcp" ]; then
  npx -y mcpize init "mcp-spec-compliance-mcp" --description "Mcp Spec Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal" || echo SKIP_INIT_mcp-spec-compliance-mcp
fi
(cd "mcp-spec-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../mcp-spec-compliance-mcp.deploy.log) || echo FAIL_mcp-spec-compliance-mcp

# === mdr-medical-device-mcp (lvp, £9/mo) ===
if [ ! -d "mdr-medical-device-mcp" ]; then
  npx -y mcpize init "mdr-medical-device-mcp" --description "Mdr Medical Device — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthca" || echo SKIP_INIT_mdr-medical-device-mcp
fi
(cd "mdr-medical-device-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mdr-medical-device-mcp.deploy.log) || echo FAIL_mdr-medical-device-mcp

# === meal-planner-ai-mcp (lvp, £9/mo) ===
if [ ! -d "meal-planner-ai-mcp" ]; then
  npx -y mcpize init "meal-planner-ai-mcp" --description "Meal Planner Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_meal-planner-ai-mcp
fi
(cd "meal-planner-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meal-planner-ai-mcp.deploy.log) || echo FAIL_meal-planner-ai-mcp

# === meditation-guide-ai-mcp (lvp, £9/mo) ===
if [ ! -d "meditation-guide-ai-mcp" ]; then
  npx -y mcpize init "meditation-guide-ai-mcp" --description "Meditation Guide Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_meditation-guide-ai-mcp
fi
(cd "meditation-guide-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meditation-guide-ai-mcp.deploy.log) || echo FAIL_meditation-guide-ai-mcp

# === meeting-summarizer-ai-mcp (lvp, £9/mo) ===
if [ ! -d "meeting-summarizer-ai-mcp" ]; then
  npx -y mcpize init "meeting-summarizer-ai-mcp" --description "Meeting Summarizer Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_meeting-summarizer-ai-mcp
fi
(cd "meeting-summarizer-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meeting-summarizer-ai-mcp.deploy.log) || echo FAIL_meeting-summarizer-ai-mcp

# === memory-search-mcp (lvp, £9/mo) ===
if [ ! -d "memory-search-mcp" ]; then
  npx -y mcpize init "memory-search-mcp" --description "Memory Search — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_memory-search-mcp
fi
(cd "memory-search-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../memory-search-mcp.deploy.log) || echo FAIL_memory-search-mcp

# === meok-aaif-agent-card-mcp (mvp, £29/mo) ===
if [ ! -d "meok-aaif-agent-card-mcp" ]; then
  npx -y mcpize init "meok-aaif-agent-card-mcp" --description "Meok Aaif Agent Card — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gener" || echo SKIP_INIT_meok-aaif-agent-card-mcp
fi
(cd "meok-aaif-agent-card-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../meok-aaif-agent-card-mcp.deploy.log) || echo FAIL_meok-aaif-agent-card-mcp

# === meok-abci-bridge-mcp (lvp, £9/mo) ===
if [ ! -d "meok-abci-bridge-mcp" ]; then
  npx -y mcpize init "meok-abci-bridge-mcp" --description "Meok Abci Bridge — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_meok-abci-bridge-mcp
fi
(cd "meok-abci-bridge-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-abci-bridge-mcp.deploy.log) || echo FAIL_meok-abci-bridge-mcp

# === meok-agents-md-lint-mcp (mvp, £29/mo) ===
if [ ! -d "meok-agents-md-lint-mcp" ]; then
  npx -y mcpize init "meok-agents-md-lint-mcp" --description "Meok Agents Md Lint — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: genera" || echo SKIP_INIT_meok-agents-md-lint-mcp
fi
(cd "meok-agents-md-lint-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../meok-agents-md-lint-mcp.deploy.log) || echo FAIL_meok-agents-md-lint-mcp

# === meok-ai-treaty-mcp (lvp, £9/mo) ===
if [ ! -d "meok-ai-treaty-mcp" ]; then
  npx -y mcpize init "meok-ai-treaty-mcp" --description "Meok Ai Treaty — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_meok-ai-treaty-mcp
fi
(cd "meok-ai-treaty-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-ai-treaty-mcp.deploy.log) || echo FAIL_meok-ai-treaty-mcp

# === meok-allmi-hiab-mcp (lvp, £9/mo) ===
if [ ! -d "meok-allmi-hiab-mcp" ]; then
  npx -y mcpize init "meok-allmi-hiab-mcp" --description "Meok Allmi Hiab — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_meok-allmi-hiab-mcp
fi
(cd "meok-allmi-hiab-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-allmi-hiab-mcp.deploy.log) || echo FAIL_meok-allmi-hiab-mcp

# === meok-ap2-mandate-mcp (lvp, £9/mo) ===
if [ ! -d "meok-ap2-mandate-mcp" ]; then
  npx -y mcpize init "meok-ap2-mandate-mcp" --description "Meok Ap2 Mandate — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: finance. E" || echo SKIP_INIT_meok-ap2-mandate-mcp
fi
(cd "meok-ap2-mandate-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-ap2-mandate-mcp.deploy.log) || echo FAIL_meok-ap2-mandate-mcp

# === meok-aquaponics-monitor-mcp (lvp, £9/mo) ===
if [ ! -d "meok-aquaponics-monitor-mcp" ]; then
  npx -y mcpize init "meok-aquaponics-monitor-mcp" --description "Meok Aquaponics Monitor — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_meok-aquaponics-monitor-mcp
fi
(cd "meok-aquaponics-monitor-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-aquaponics-monitor-mcp.deploy.log) || echo FAIL_meok-aquaponics-monitor-mcp

# === meok-article-50-kit-mcp (lvp, £9/mo) ===
if [ ! -d "meok-article-50-kit-mcp" ]; then
  npx -y mcpize init "meok-article-50-kit-mcp" --description "Meok Article 50 Kit — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_meok-article-50-kit-mcp
fi
(cd "meok-article-50-kit-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-article-50-kit-mcp.deploy.log) || echo FAIL_meok-article-50-kit-mcp

# === meok-asc-rspca-crosswalk-mcp (lvp, £9/mo) ===
if [ ! -d "meok-asc-rspca-crosswalk-mcp" ]; then
  npx -y mcpize init "meok-asc-rspca-crosswalk-mcp" --description "Meok Asc Rspca Crosswalk — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: ge" || echo SKIP_INIT_meok-asc-rspca-crosswalk-mcp
fi
(cd "meok-asc-rspca-crosswalk-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-asc-rspca-crosswalk-mcp.deploy.log) || echo FAIL_meok-asc-rspca-crosswalk-mcp

# === meok-bs7121-mcp (lvp, £9/mo) ===
if [ ! -d "meok-bs7121-mcp" ]; then
  npx -y mcpize init "meok-bs7121-mcp" --description "Meok Bs7121 — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_meok-bs7121-mcp
fi
(cd "meok-bs7121-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-bs7121-mcp.deploy.log) || echo FAIL_meok-bs7121-mcp

# === meok-c2pa-durable-mcp (lvp, £9/mo) ===
if [ ! -d "meok-c2pa-durable-mcp" ]; then
  npx -y mcpize init "meok-c2pa-durable-mcp" --description "Meok C2Pa Durable — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_meok-c2pa-durable-mcp
fi
(cd "meok-c2pa-durable-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-c2pa-durable-mcp.deploy.log) || echo FAIL_meok-c2pa-durable-mcp

# === meok-c2pa-watermark-mcp (lvp, £9/mo) ===
if [ ! -d "meok-c2pa-watermark-mcp" ]; then
  npx -y mcpize init "meok-c2pa-watermark-mcp" --description "Meok C2Pa Watermark — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_meok-c2pa-watermark-mcp
fi
(cd "meok-c2pa-watermark-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-c2pa-watermark-mcp.deploy.log) || echo FAIL_meok-c2pa-watermark-mcp

# === meok-coinbase-x402-receipt-mcp (lvp, £9/mo) ===
if [ ! -d "meok-coinbase-x402-receipt-mcp" ]; then
  npx -y mcpize init "meok-coinbase-x402-receipt-mcp" --description "Meok Coinbase X402 Receipt — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: " || echo SKIP_INIT_meok-coinbase-x402-receipt-mcp
fi
(cd "meok-coinbase-x402-receipt-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-coinbase-x402-receipt-mcp.deploy.log) || echo FAIL_meok-coinbase-x402-receipt-mcp

# === meok-cold-chain-pharma-mcp (elite, £199/mo) ===
if [ ! -d "meok-cold-chain-pharma-mcp" ]; then
  npx -y mcpize init "meok-cold-chain-pharma-mcp" --description "Meok Cold Chain Pharma — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: elite (£9/mo). Sectors: healthcare. E" || echo SKIP_INIT_meok-cold-chain-pharma-mcp
fi
(cd "meok-cold-chain-pharma-mcp" && npx -y mcpize deploy --price-gbp 199 2>&1 | tee -a ../meok-cold-chain-pharma-mcp.deploy.log) || echo FAIL_meok-cold-chain-pharma-mcp

# === meok-cpa-contract-lift-mcp (lvp, £9/mo) ===
if [ ! -d "meok-cpa-contract-lift-mcp" ]; then
  npx -y mcpize init "meok-cpa-contract-lift-mcp" --description "Meok Cpa Contract Lift — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: lega" || echo SKIP_INIT_meok-cpa-contract-lift-mcp
fi
(cd "meok-cpa-contract-lift-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-cpa-contract-lift-mcp.deploy.log) || echo FAIL_meok-cpa-contract-lift-mcp

# === meok-cra-annex-iv-classifier-mcp (lvp, £9/mo) ===
if [ ! -d "meok-cra-annex-iv-classifier-mcp" ]; then
  npx -y mcpize init "meok-cra-annex-iv-classifier-mcp" --description "Meok Cra Annex Iv Classifier — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors" || echo SKIP_INIT_meok-cra-annex-iv-classifier-mcp
fi
(cd "meok-cra-annex-iv-classifier-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-cra-annex-iv-classifier-mcp.deploy.log) || echo FAIL_meok-cra-annex-iv-classifier-mcp

# === meok-cra-art14-reporter-mcp (lvp, £9/mo) ===
if [ ! -d "meok-cra-art14-reporter-mcp" ]; then
  npx -y mcpize init "meok-cra-art14-reporter-mcp" --description "Meok Cra Art14 Reporter — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_meok-cra-art14-reporter-mcp
fi
(cd "meok-cra-art14-reporter-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-cra-art14-reporter-mcp.deploy.log) || echo FAIL_meok-cra-art14-reporter-mcp

# === meok-credential-manager-mcp (lvp, £9/mo) ===
if [ ! -d "meok-credential-manager-mcp" ]; then
  npx -y mcpize init "meok-credential-manager-mcp" --description "Meok Credential Manager — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_meok-credential-manager-mcp
fi
(cd "meok-credential-manager-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-credential-manager-mcp.deploy.log) || echo FAIL_meok-credential-manager-mcp

# === meok-dpia-edpb-template-mcp (lvp, £9/mo) ===
if [ ! -d "meok-dpia-edpb-template-mcp" ]; then
  npx -y mcpize init "meok-dpia-edpb-template-mcp" --description "Meok Dpia Edpb Template — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_meok-dpia-edpb-template-mcp
fi
(cd "meok-dpia-edpb-template-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-dpia-edpb-template-mcp.deploy.log) || echo FAIL_meok-dpia-edpb-template-mcp

# === meok-drcf-agent-crosswalk-mcp (mvp, £29/mo) ===
if [ ! -d "meok-drcf-agent-crosswalk-mcp" ]; then
  npx -y mcpize init "meok-drcf-agent-crosswalk-mcp" --description "Meok Drcf Agent Crosswalk — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: " || echo SKIP_INIT_meok-drcf-agent-crosswalk-mcp
fi
(cd "meok-drcf-agent-crosswalk-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../meok-drcf-agent-crosswalk-mcp.deploy.log) || echo FAIL_meok-drcf-agent-crosswalk-mcp

# === meok-dvsa-olicence-mcp (lvp, £9/mo) ===
if [ ! -d "meok-dvsa-olicence-mcp" ]; then
  npx -y mcpize init "meok-dvsa-olicence-mcp" --description "Meok Dvsa Olicence — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_meok-dvsa-olicence-mcp
fi
(cd "meok-dvsa-olicence-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-dvsa-olicence-mcp.deploy.log) || echo FAIL_meok-dvsa-olicence-mcp

# === meok-eu-ai-act-2-mcp (lvp, £9/mo) ===
if [ ! -d "meok-eu-ai-act-2-mcp" ]; then
  npx -y mcpize init "meok-eu-ai-act-2-mcp" --description "Meok Eu Ai Act 2 — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: government" || echo SKIP_INIT_meok-eu-ai-act-2-mcp
fi
(cd "meok-eu-ai-act-2-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-eu-ai-act-2-mcp.deploy.log) || echo FAIL_meok-eu-ai-act-2-mcp

# === meok-eu-ai-act-art-13-ifu-mcp (lvp, £9/mo) ===
if [ ! -d "meok-eu-ai-act-art-13-ifu-mcp" ]; then
  npx -y mcpize init "meok-eu-ai-act-art-13-ifu-mcp" --description "Meok Eu Ai Act Art 13 Ifu — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: g" || echo SKIP_INIT_meok-eu-ai-act-art-13-ifu-mcp
fi
(cd "meok-eu-ai-act-art-13-ifu-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-eu-ai-act-art-13-ifu-mcp.deploy.log) || echo FAIL_meok-eu-ai-act-art-13-ifu-mcp

# === meok-eu-ai-act-art-26-fria-mcp (lvp, £9/mo) ===
if [ ! -d "meok-eu-ai-act-art-26-fria-mcp" ]; then
  npx -y mcpize init "meok-eu-ai-act-art-26-fria-mcp" --description "Meok Eu Ai Act Art 26 Fria — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: " || echo SKIP_INIT_meok-eu-ai-act-art-26-fria-mcp
fi
(cd "meok-eu-ai-act-art-26-fria-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-eu-ai-act-art-26-fria-mcp.deploy.log) || echo FAIL_meok-eu-ai-act-art-26-fria-mcp

# === meok-eu-aia-art-9-rms-mcp (lvp, £9/mo) ===
if [ ! -d "meok-eu-aia-art-9-rms-mcp" ]; then
  npx -y mcpize init "meok-eu-aia-art-9-rms-mcp" --description "Meok Eu Aia Art 9 Rms — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_meok-eu-aia-art-9-rms-mcp
fi
(cd "meok-eu-aia-art-9-rms-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-eu-aia-art-9-rms-mcp.deploy.log) || echo FAIL_meok-eu-aia-art-9-rms-mcp

# === meok-eu-aigc-icon-mcp (lvp, £9/mo) ===
if [ ! -d "meok-eu-aigc-icon-mcp" ]; then
  npx -y mcpize init "meok-eu-aigc-icon-mcp" --description "Meok Eu Aigc Icon — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: governmen" || echo SKIP_INIT_meok-eu-aigc-icon-mcp
fi
(cd "meok-eu-aigc-icon-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-eu-aigc-icon-mcp.deploy.log) || echo FAIL_meok-eu-aigc-icon-mcp

# === meok-eu-mobility-package-mcp (lvp, £9/mo) ===
if [ ! -d "meok-eu-mobility-package-mcp" ]; then
  npx -y mcpize init "meok-eu-mobility-package-mcp" --description "Meok Eu Mobility Package — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: tr" || echo SKIP_INIT_meok-eu-mobility-package-mcp
fi
(cd "meok-eu-mobility-package-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-eu-mobility-package-mcp.deploy.log) || echo FAIL_meok-eu-mobility-package-mcp

# === meok-eu-platform-worker-mcp (lvp, £9/mo) ===
if [ ! -d "meok-eu-platform-worker-mcp" ]; then
  npx -y mcpize init "meok-eu-platform-worker-mcp" --description "Meok Eu Platform Worker — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_meok-eu-platform-worker-mcp
fi
(cd "meok-eu-platform-worker-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-eu-platform-worker-mcp.deploy.log) || echo FAIL_meok-eu-platform-worker-mcp

# === meok-ev-recall-transport-mcp (lvp, £9/mo) ===
if [ ! -d "meok-ev-recall-transport-mcp" ]; then
  npx -y mcpize init "meok-ev-recall-transport-mcp" --description "Meok Ev Recall Transport — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: ge" || echo SKIP_INIT_meok-ev-recall-transport-mcp
fi
(cd "meok-ev-recall-transport-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-ev-recall-transport-mcp.deploy.log) || echo FAIL_meok-ev-recall-transport-mcp

# === meok-fmcsa-hours-of-service-mcp (hvp, £79/mo) ===
if [ ! -d "meok-fmcsa-hours-of-service-mcp" ]; then
  npx -y mcpize init "meok-fmcsa-hours-of-service-mcp" --description "Meok Fmcsa Hours Of Service — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sector" || echo SKIP_INIT_meok-fmcsa-hours-of-service-mcp
fi
(cd "meok-fmcsa-hours-of-service-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../meok-fmcsa-hours-of-service-mcp.deploy.log) || echo FAIL_meok-fmcsa-hours-of-service-mcp

# === meok-fors-clocs-mcp (lvp, £9/mo) ===
if [ ! -d "meok-fors-clocs-mcp" ]; then
  npx -y mcpize init "meok-fors-clocs-mcp" --description "Meok Fors Clocs — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_meok-fors-clocs-mcp
fi
(cd "meok-fors-clocs-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-fors-clocs-mcp.deploy.log) || echo FAIL_meok-fors-clocs-mcp

# === meok-gaming-eve-mcp (lvp, £9/mo) ===
if [ ! -d "meok-gaming-eve-mcp" ]; then
  npx -y mcpize init "meok-gaming-eve-mcp" --description "Meok Gaming Eve — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_meok-gaming-eve-mcp
fi
(cd "meok-gaming-eve-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-gaming-eve-mcp.deploy.log) || echo FAIL_meok-gaming-eve-mcp

# === meok-gaming-ffxiv-mcp (lvp, £9/mo) ===
if [ ! -d "meok-gaming-ffxiv-mcp" ]; then
  npx -y mcpize init "meok-gaming-ffxiv-mcp" --description "Meok Gaming Ffxiv — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_meok-gaming-ffxiv-mcp
fi
(cd "meok-gaming-ffxiv-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-gaming-ffxiv-mcp.deploy.log) || echo FAIL_meok-gaming-ffxiv-mcp

# === meok-gaming-minecraft-mcp (lvp, £9/mo) ===
if [ ! -d "meok-gaming-minecraft-mcp" ]; then
  npx -y mcpize init "meok-gaming-minecraft-mcp" --description "Meok Gaming Minecraft — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_meok-gaming-minecraft-mcp
fi
(cd "meok-gaming-minecraft-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-gaming-minecraft-mcp.deploy.log) || echo FAIL_meok-gaming-minecraft-mcp

# === meok-gaming-osrs-mcp (lvp, £9/mo) ===
if [ ! -d "meok-gaming-osrs-mcp" ]; then
  npx -y mcpize init "meok-gaming-osrs-mcp" --description "Meok Gaming Osrs — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_meok-gaming-osrs-mcp
fi
(cd "meok-gaming-osrs-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-gaming-osrs-mcp.deploy.log) || echo FAIL_meok-gaming-osrs-mcp

# === meok-gaming-wow-mcp (lvp, £9/mo) ===
if [ ! -d "meok-gaming-wow-mcp" ]; then
  npx -y mcpize init "meok-gaming-wow-mcp" --description "Meok Gaming Wow — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_meok-gaming-wow-mcp
fi
(cd "meok-gaming-wow-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-gaming-wow-mcp.deploy.log) || echo FAIL_meok-gaming-wow-mcp

# === meok-governance-engine-mcp (lvp, £9/mo) ===
if [ ! -d "meok-governance-engine-mcp" ]; then
  npx -y mcpize init "meok-governance-engine-mcp" --description "Meok Governance Engine — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gene" || echo SKIP_INIT_meok-governance-engine-mcp
fi
(cd "meok-governance-engine-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-governance-engine-mcp.deploy.log) || echo FAIL_meok-governance-engine-mcp

# === meok-haulage-governance-bridge-mcp (lvp, £9/mo) ===
if [ ! -d "meok-haulage-governance-bridge-mcp" ]; then
  npx -y mcpize init "meok-haulage-governance-bridge-mcp" --description "Meok Haulage Governance Bridge — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Secto" || echo SKIP_INIT_meok-haulage-governance-bridge-mcp
fi
(cd "meok-haulage-governance-bridge-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-haulage-governance-bridge-mcp.deploy.log) || echo FAIL_meok-haulage-governance-bridge-mcp

# === meok-iata-dgr-air-cargo-mcp (lvp, £9/mo) ===
if [ ! -d "meok-iata-dgr-air-cargo-mcp" ]; then
  npx -y mcpize init "meok-iata-dgr-air-cargo-mcp" --description "Meok Iata Dgr Air Cargo — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_meok-iata-dgr-air-cargo-mcp
fi
(cd "meok-iata-dgr-air-cargo-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-iata-dgr-air-cargo-mcp.deploy.log) || echo FAIL_meok-iata-dgr-air-cargo-mcp

# === meok-imo-marpol-marine-mcp (lvp, £9/mo) ===
if [ ! -d "meok-imo-marpol-marine-mcp" ]; then
  npx -y mcpize init "meok-imo-marpol-marine-mcp" --description "Meok Imo Marpol Marine — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gene" || echo SKIP_INIT_meok-imo-marpol-marine-mcp
fi
(cd "meok-imo-marpol-marine-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-imo-marpol-marine-mcp.deploy.log) || echo FAIL_meok-imo-marpol-marine-mcp

# === meok-iru-tir-international-mcp (lvp, £9/mo) ===
if [ ! -d "meok-iru-tir-international-mcp" ]; then
  npx -y mcpize init "meok-iru-tir-international-mcp" --description "Meok Iru Tir International — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: " || echo SKIP_INIT_meok-iru-tir-international-mcp
fi
(cd "meok-iru-tir-international-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-iru-tir-international-mcp.deploy.log) || echo FAIL_meok-iru-tir-international-mcp

# === meok-koikeeper-ai-mcp (lvp, £9/mo) ===
if [ ! -d "meok-koikeeper-ai-mcp" ]; then
  npx -y mcpize init "meok-koikeeper-ai-mcp" --description "Meok Koikeeper Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_meok-koikeeper-ai-mcp
fi
(cd "meok-koikeeper-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-koikeeper-ai-mcp.deploy.log) || echo FAIL_meok-koikeeper-ai-mcp

# === meok-laia-aquatic-mcp (lvp, £9/mo) ===
if [ ! -d "meok-laia-aquatic-mcp" ]; then
  npx -y mcpize init "meok-laia-aquatic-mcp" --description "Meok Laia Aquatic — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_meok-laia-aquatic-mcp
fi
(cd "meok-laia-aquatic-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-laia-aquatic-mcp.deploy.log) || echo FAIL_meok-laia-aquatic-mcp

# === meok-law-mcp (lvp, £9/mo) ===
if [ ! -d "meok-law-mcp" ]; then
  npx -y mcpize init "meok-law-mcp" --description "Meok Law — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: legal. EU AI Act /" || echo SKIP_INIT_meok-law-mcp
fi
(cd "meok-law-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-law-mcp.deploy.log) || echo FAIL_meok-law-mcp

# === meok-libp2p-agent-mesh-mcp (mvp, £29/mo) ===
if [ ! -d "meok-libp2p-agent-mesh-mcp" ]; then
  npx -y mcpize init "meok-libp2p-agent-mesh-mcp" --description "Meok Libp2P Agent Mesh — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gen" || echo SKIP_INIT_meok-libp2p-agent-mesh-mcp
fi
(cd "meok-libp2p-agent-mesh-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../meok-libp2p-agent-mesh-mcp.deploy.log) || echo FAIL_meok-libp2p-agent-mesh-mcp

# === meok-livestock-welfare-transport-mcp (lvp, £9/mo) ===
if [ ! -d "meok-livestock-welfare-transport-mcp" ]; then
  npx -y mcpize init "meok-livestock-welfare-transport-mcp" --description "Meok Livestock Welfare Transport — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sec" || echo SKIP_INIT_meok-livestock-welfare-transport-mcp
fi
(cd "meok-livestock-welfare-transport-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-livestock-welfare-transport-mcp.deploy.log) || echo FAIL_meok-livestock-welfare-transport-mcp

# === meok-mcp-cardgen-mcp (lvp, £9/mo) ===
if [ ! -d "meok-mcp-cardgen-mcp" ]; then
  npx -y mcpize init "meok-mcp-cardgen-mcp" --description "Meok Cardgen — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_meok-mcp-cardgen-mcp
fi
(cd "meok-mcp-cardgen-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-mcp-cardgen-mcp.deploy.log) || echo FAIL_meok-mcp-cardgen-mcp

# === meok-mcp-hardening-mcp (lvp, £9/mo) ===
if [ ! -d "meok-mcp-hardening-mcp" ]; then
  npx -y mcpize init "meok-mcp-hardening-mcp" --description "Meok Hardening — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_meok-mcp-hardening-mcp
fi
(cd "meok-mcp-hardening-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-mcp-hardening-mcp.deploy.log) || echo FAIL_meok-mcp-hardening-mcp

# === meok-mcp-injection-scan-mcp (lvp, £9/mo) ===
if [ ! -d "meok-mcp-injection-scan-mcp" ]; then
  npx -y mcpize init "meok-mcp-injection-scan-mcp" --description "Meok Injection Scan — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_meok-mcp-injection-scan-mcp
fi
(cd "meok-mcp-injection-scan-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-mcp-injection-scan-mcp.deploy.log) || echo FAIL_meok-mcp-injection-scan-mcp

# === meok-mcp-test-mcp (mvp, £29/mo) ===
if [ ! -d "meok-mcp-test-mcp" ]; then
  npx -y mcpize init "meok-mcp-test-mcp" --description "Meok Test — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. EU AI A" || echo SKIP_INIT_meok-mcp-test-mcp
fi
(cd "meok-mcp-test-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../meok-mcp-test-mcp.deploy.log) || echo FAIL_meok-mcp-test-mcp

# === meok-nhvr-australia-mcp (lvp, £9/mo) ===
if [ ! -d "meok-nhvr-australia-mcp" ]; then
  npx -y mcpize init "meok-nhvr-australia-mcp" --description "Meok Nhvr Australia — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_meok-nhvr-australia-mcp
fi
(cd "meok-nhvr-australia-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-nhvr-australia-mcp.deploy.log) || echo FAIL_meok-nhvr-australia-mcp

# === meok-nis2-de-register-mcp (hvp, £79/mo) ===
if [ ! -d "meok-nis2-de-register-mcp" ]; then
  npx -y mcpize init "meok-nis2-de-register-mcp" --description "Meok Nis2 De Register — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: gen" || echo SKIP_INIT_meok-nis2-de-register-mcp
fi
(cd "meok-nis2-de-register-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../meok-nis2-de-register-mcp.deploy.log) || echo FAIL_meok-nis2-de-register-mcp

# === meok-omnibus-tracker-mcp (lvp, £9/mo) ===
if [ ! -d "meok-omnibus-tracker-mcp" ]; then
  npx -y mcpize init "meok-omnibus-tracker-mcp" --description "Meok Omnibus Tracker — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_meok-omnibus-tracker-mcp
fi
(cd "meok-omnibus-tracker-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-omnibus-tracker-mcp.deploy.log) || echo FAIL_meok-omnibus-tracker-mcp

# === meok-rail-freight-uk-mcp (lvp, £9/mo) ===
if [ ! -d "meok-rail-freight-uk-mcp" ]; then
  npx -y mcpize init "meok-rail-freight-uk-mcp" --description "Meok Rail Freight Uk — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: manufa" || echo SKIP_INIT_meok-rail-freight-uk-mcp
fi
(cd "meok-rail-freight-uk-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-rail-freight-uk-mcp.deploy.log) || echo FAIL_meok-rail-freight-uk-mcp

# === meok-rspca-aquaculture-mcp (lvp, £9/mo) ===
if [ ! -d "meok-rspca-aquaculture-mcp" ]; then
  npx -y mcpize init "meok-rspca-aquaculture-mcp" --description "Meok Rspca Aquaculture — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gene" || echo SKIP_INIT_meok-rspca-aquaculture-mcp
fi
(cd "meok-rspca-aquaculture-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-rspca-aquaculture-mcp.deploy.log) || echo FAIL_meok-rspca-aquaculture-mcp

# === meok-soil-assoc-organic-aqua-mcp (lvp, £9/mo) ===
if [ ! -d "meok-soil-assoc-organic-aqua-mcp" ]; then
  npx -y mcpize init "meok-soil-assoc-organic-aqua-mcp" --description "Meok Soil Assoc Organic Aqua — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors" || echo SKIP_INIT_meok-soil-assoc-organic-aqua-mcp
fi
(cd "meok-soil-assoc-organic-aqua-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-soil-assoc-organic-aqua-mcp.deploy.log) || echo FAIL_meok-soil-assoc-organic-aqua-mcp

# === meok-stripe-acp-checkout-mcp (lvp, £9/mo) ===
if [ ! -d "meok-stripe-acp-checkout-mcp" ]; then
  npx -y mcpize init "meok-stripe-acp-checkout-mcp" --description "Meok Stripe Acp Checkout — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: fi" || echo SKIP_INIT_meok-stripe-acp-checkout-mcp
fi
(cd "meok-stripe-acp-checkout-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-stripe-acp-checkout-mcp.deploy.log) || echo FAIL_meok-stripe-acp-checkout-mcp

# === meok-tacho-audit-mcp (hvp, £79/mo) ===
if [ ! -d "meok-tacho-audit-mcp" ]; then
  npx -y mcpize init "meok-tacho-audit-mcp" --description "Meok Tacho Audit — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal. E" || echo SKIP_INIT_meok-tacho-audit-mcp
fi
(cd "meok-tacho-audit-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../meok-tacho-audit-mcp.deploy.log) || echo FAIL_meok-tacho-audit-mcp

# === meok-transport-canada-hos-mcp (lvp, £9/mo) ===
if [ ! -d "meok-transport-canada-hos-mcp" ]; then
  npx -y mcpize init "meok-transport-canada-hos-mcp" --description "Meok Transport Canada Hos — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: g" || echo SKIP_INIT_meok-transport-canada-hos-mcp
fi
(cd "meok-transport-canada-hos-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-transport-canada-hos-mcp.deploy.log) || echo FAIL_meok-transport-canada-hos-mcp

# === meok-uae-rta-transport-mcp (lvp, £9/mo) ===
if [ ! -d "meok-uae-rta-transport-mcp" ]; then
  npx -y mcpize init "meok-uae-rta-transport-mcp" --description "Meok Uae Rta Transport — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gene" || echo SKIP_INIT_meok-uae-rta-transport-mcp
fi
(cd "meok-uae-rta-transport-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-uae-rta-transport-mcp.deploy.log) || echo FAIL_meok-uae-rta-transport-mcp

# === meok-uas-commercial-drone-mcp (lvp, £9/mo) ===
if [ ! -d "meok-uas-commercial-drone-mcp" ]; then
  npx -y mcpize init "meok-uas-commercial-drone-mcp" --description "Meok Uas Commercial Drone — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: g" || echo SKIP_INIT_meok-uas-commercial-drone-mcp
fi
(cd "meok-uas-commercial-drone-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-uas-commercial-drone-mcp.deploy.log) || echo FAIL_meok-uas-commercial-drone-mcp

# === meok-uk-adm-article22c-mcp (lvp, £9/mo) ===
if [ ! -d "meok-uk-adm-article22c-mcp" ]; then
  npx -y mcpize init "meok-uk-adm-article22c-mcp" --description "Meok Uk Adm Article22C — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gene" || echo SKIP_INIT_meok-uk-adm-article22c-mcp
fi
(cd "meok-uk-adm-article22c-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-uk-adm-article22c-mcp.deploy.log) || echo FAIL_meok-uk-adm-article22c-mcp

# === meok-uk-fhi-mcp (lvp, £9/mo) ===
if [ ! -d "meok-uk-fhi-mcp" ]; then
  npx -y mcpize init "meok-uk-fhi-mcp" --description "Meok Uk Fhi — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_meok-uk-fhi-mcp
fi
(cd "meok-uk-fhi-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-uk-fhi-mcp.deploy.log) || echo FAIL_meok-uk-fhi-mcp

# === meok-uk-phv-tfl-mcp (lvp, £9/mo) ===
if [ ! -d "meok-uk-phv-tfl-mcp" ]; then
  npx -y mcpize init "meok-uk-phv-tfl-mcp" --description "Meok Uk Phv Tfl — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_meok-uk-phv-tfl-mcp
fi
(cd "meok-uk-phv-tfl-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-uk-phv-tfl-mcp.deploy.log) || echo FAIL_meok-uk-phv-tfl-mcp

# === meok-vehicle-handover-mcp (lvp, £9/mo) ===
if [ ! -d "meok-vehicle-handover-mcp" ]; then
  npx -y mcpize init "meok-vehicle-handover-mcp" --description "Meok Vehicle Handover — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_meok-vehicle-handover-mcp
fi
(cd "meok-vehicle-handover-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-vehicle-handover-mcp.deploy.log) || echo FAIL_meok-vehicle-handover-mcp

# === meok-w3c-tdm-rights-mcp (lvp, £9/mo) ===
if [ ! -d "meok-w3c-tdm-rights-mcp" ]; then
  npx -y mcpize init "meok-w3c-tdm-rights-mcp" --description "Meok W3C Tdm Rights — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_meok-w3c-tdm-rights-mcp
fi
(cd "meok-w3c-tdm-rights-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-w3c-tdm-rights-mcp.deploy.log) || echo FAIL_meok-w3c-tdm-rights-mcp

# === meok-watermark-attest-mcp (mvp, £29/mo) ===
if [ ! -d "meok-watermark-attest-mcp" ]; then
  npx -y mcpize init "meok-watermark-attest-mcp" --description "Meok Watermark Attest — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gene" || echo SKIP_INIT_meok-watermark-attest-mcp
fi
(cd "meok-watermark-attest-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../meok-watermark-attest-mcp.deploy.log) || echo FAIL_meok-watermark-attest-mcp

# === meok-x402-wrap-mcp (lvp, £9/mo) ===
if [ ! -d "meok-x402-wrap-mcp" ]; then
  npx -y mcpize init "meok-x402-wrap-mcp" --description "Meok X402 Wrap — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: finance. EU " || echo SKIP_INIT_meok-x402-wrap-mcp
fi
(cd "meok-x402-wrap-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../meok-x402-wrap-mcp.deploy.log) || echo FAIL_meok-x402-wrap-mcp

# === mhra-samd-optometry-mcp (lvp, £9/mo) ===
if [ ! -d "mhra-samd-optometry-mcp" ]; then
  npx -y mcpize init "mhra-samd-optometry-mcp" --description "Mhra Samd Optometry — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthc" || echo SKIP_INIT_mhra-samd-optometry-mcp
fi
(cd "mhra-samd-optometry-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mhra-samd-optometry-mcp.deploy.log) || echo FAIL_mhra-samd-optometry-mcp

# === mica-crypto-mcp (lvp, £9/mo) ===
if [ ! -d "mica-crypto-mcp" ]; then
  npx -y mcpize init "mica-crypto-mcp" --description "Mica Crypto — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_mica-crypto-mcp
fi
(cd "mica-crypto-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mica-crypto-mcp.deploy.log) || echo FAIL_mica-crypto-mcp

# === mifid-ii-ai-mcp (lvp, £9/mo) ===
if [ ! -d "mifid-ii-ai-mcp" ]; then
  npx -y mcpize init "mifid-ii-ai-mcp" --description "Mifid Ii Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_mifid-ii-ai-mcp
fi
(cd "mifid-ii-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mifid-ii-ai-mcp.deploy.log) || echo FAIL_mifid-ii-ai-mcp

# === mitre-atlas-mcp (lvp, £9/mo) ===
if [ ! -d "mitre-atlas-mcp" ]; then
  npx -y mcpize init "mitre-atlas-mcp" --description "Mitre Atlas — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_mitre-atlas-mcp
fi
(cd "mitre-atlas-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mitre-atlas-mcp.deploy.log) || echo FAIL_mitre-atlas-mcp

# === mitre-attack-mcp (lvp, £9/mo) ===
if [ ! -d "mitre-attack-mcp" ]; then
  npx -y mcpize init "mitre-attack-mcp" --description "Mitre Attack — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_mitre-attack-mcp
fi
(cd "mitre-attack-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mitre-attack-mcp.deploy.log) || echo FAIL_mitre-attack-mcp

# === mock-server-ai-mcp (lvp, £9/mo) ===
if [ ! -d "mock-server-ai-mcp" ]; then
  npx -y mcpize init "mock-server-ai-mcp" --description "Mock Server Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_mock-server-ai-mcp
fi
(cd "mock-server-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mock-server-ai-mcp.deploy.log) || echo FAIL_mock-server-ai-mcp

# === mortgage-calculator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "mortgage-calculator-ai-mcp" ]; then
  npx -y mcpize init "mortgage-calculator-ai-mcp" --description "Mortgage Calculator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gene" || echo SKIP_INIT_mortgage-calculator-ai-mcp
fi
(cd "mortgage-calculator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../mortgage-calculator-ai-mcp.deploy.log) || echo FAIL_mortgage-calculator-ai-mcp

# === muckaway-ai-mcp (lvp, £9/mo) ===
if [ ! -d "muckaway-ai-mcp" ]; then
  npx -y mcpize init "muckaway-ai-mcp" --description "Muckaway Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_muckaway-ai-mcp
fi
(cd "muckaway-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../muckaway-ai-mcp.deploy.log) || echo FAIL_muckaway-ai-mcp

# === music-production-ai-mcp (lvp, £9/mo) ===
if [ ! -d "music-production-ai-mcp" ]; then
  npx -y mcpize init "music-production-ai-mcp" --description "Music Production Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_music-production-ai-mcp
fi
(cd "music-production-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../music-production-ai-mcp.deploy.log) || echo FAIL_music-production-ai-mcp

# === neural-health-monitor-mcp (lvp, £9/mo) ===
if [ ! -d "neural-health-monitor-mcp" ]; then
  npx -y mcpize init "neural-health-monitor-mcp" --description "Neural Health Monitor — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healt" || echo SKIP_INIT_neural-health-monitor-mcp
fi
(cd "neural-health-monitor-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../neural-health-monitor-mcp.deploy.log) || echo FAIL_neural-health-monitor-mcp

# === nhs-gos-claims-mcp (lvp, £9/mo) ===
if [ ! -d "nhs-gos-claims-mcp" ]; then
  npx -y mcpize init "nhs-gos-claims-mcp" --description "Nhs Gos Claims — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: insurance. E" || echo SKIP_INIT_nhs-gos-claims-mcp
fi
(cd "nhs-gos-claims-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../nhs-gos-claims-mcp.deploy.log) || echo FAIL_nhs-gos-claims-mcp

# === nis2-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "nis2-compliance-mcp" ]; then
  npx -y mcpize init "nis2-compliance-mcp" --description "Nis2 Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal. EU" || echo SKIP_INIT_nis2-compliance-mcp
fi
(cd "nis2-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../nis2-compliance-mcp.deploy.log) || echo FAIL_nis2-compliance-mcp

# === nist-rmf-ai-mcp (hvp, £79/mo) ===
if [ ! -d "nist-rmf-ai-mcp" ]; then
  npx -y mcpize init "nist-rmf-ai-mcp" --description "Nist Rmf Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: general. EU A" || echo SKIP_INIT_nist-rmf-ai-mcp
fi
(cd "nist-rmf-ai-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../nist-rmf-ai-mcp.deploy.log) || echo FAIL_nist-rmf-ai-mcp

# === note-taking-ai-mcp (lvp, £9/mo) ===
if [ ! -d "note-taking-ai-mcp" ]; then
  npx -y mcpize init "note-taking-ai-mcp" --description "Note Taking Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_note-taking-ai-mcp
fi
(cd "note-taking-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../note-taking-ai-mcp.deploy.log) || echo FAIL_note-taking-ai-mcp

# === notification-ai-mcp (lvp, £9/mo) ===
if [ ! -d "notification-ai-mcp" ]; then
  npx -y mcpize init "notification-ai-mcp" --description "Notification Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_notification-ai-mcp
fi
(cd "notification-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../notification-ai-mcp.deploy.log) || echo FAIL_notification-ai-mcp

# === nrswa-ai-mcp (lvp, £9/mo) ===
if [ ! -d "nrswa-ai-mcp" ]; then
  npx -y mcpize init "nrswa-ai-mcp" --description "Nrswa Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act" || echo SKIP_INIT_nrswa-ai-mcp
fi
(cd "nrswa-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../nrswa-ai-mcp.deploy.log) || echo FAIL_nrswa-ai-mcp

# === nutrition-tracker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "nutrition-tracker-ai-mcp" ]; then
  npx -y mcpize init "nutrition-tracker-ai-mcp" --description "Nutrition Tracker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_nutrition-tracker-ai-mcp
fi
(cd "nutrition-tracker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../nutrition-tracker-ai-mcp.deploy.log) || echo FAIL_nutrition-tracker-ai-mcp

# === oasf-agent-directory-mcp (mvp, £29/mo) ===
if [ ! -d "oasf-agent-directory-mcp" ]; then
  npx -y mcpize init "oasf-agent-directory-mcp" --description "Oasf Agent Directory — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: gener" || echo SKIP_INIT_oasf-agent-directory-mcp
fi
(cd "oasf-agent-directory-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../oasf-agent-directory-mcp.deploy.log) || echo FAIL_oasf-agent-directory-mcp

# === optical-care-home-bridge-mcp (lvp, £9/mo) ===
if [ ! -d "optical-care-home-bridge-mcp" ]; then
  npx -y mcpize init "optical-care-home-bridge-mcp" --description "Optical Care Home Bridge — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: he" || echo SKIP_INIT_optical-care-home-bridge-mcp
fi
(cd "optical-care-home-bridge-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../optical-care-home-bridge-mcp.deploy.log) || echo FAIL_optical-care-home-bridge-mcp

# === optometry-ai-safety-mcp (lvp, £9/mo) ===
if [ ! -d "optometry-ai-safety-mcp" ]; then
  npx -y mcpize init "optometry-ai-safety-mcp" --description "Optometry Ai Safety — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_optometry-ai-safety-mcp
fi
(cd "optometry-ai-safety-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../optometry-ai-safety-mcp.deploy.log) || echo FAIL_optometry-ai-safety-mcp

# === optometry-patient-mcp (lvp, £9/mo) ===
if [ ! -d "optometry-patient-mcp" ]; then
  npx -y mcpize init "optometry-patient-mcp" --description "Optometry Patient — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthcar" || echo SKIP_INIT_optometry-patient-mcp
fi
(cd "optometry-patient-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../optometry-patient-mcp.deploy.log) || echo FAIL_optometry-patient-mcp

# === otp-ai-mcp (lvp, £9/mo) ===
if [ ! -d "otp-ai-mcp" ]; then
  npx -y mcpize init "otp-ai-mcp" --description "Otp Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act /" || echo SKIP_INIT_otp-ai-mcp
fi
(cd "otp-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../otp-ai-mcp.deploy.log) || echo FAIL_otp-ai-mcp

# === owasp-agentic-mcp (mvp, £29/mo) ===
if [ ! -d "owasp-agentic-mcp" ]; then
  npx -y mcpize init "owasp-agentic-mcp" --description "Owasp Agentic — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. EU " || echo SKIP_INIT_owasp-agentic-mcp
fi
(cd "owasp-agentic-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../owasp-agentic-mcp.deploy.log) || echo FAIL_owasp-agentic-mcp

# === password-ai-mcp (lvp, £9/mo) ===
if [ ! -d "password-ai-mcp" ]; then
  npx -y mcpize init "password-ai-mcp" --description "Password Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_password-ai-mcp
fi
(cd "password-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../password-ai-mcp.deploy.log) || echo FAIL_password-ai-mcp

# === patient-safety-ai-mcp (lvp, £9/mo) ===
if [ ! -d "patient-safety-ai-mcp" ]; then
  npx -y mcpize init "patient-safety-ai-mcp" --description "Patient Safety Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthcar" || echo SKIP_INIT_patient-safety-ai-mcp
fi
(cd "patient-safety-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../patient-safety-ai-mcp.deploy.log) || echo FAIL_patient-safety-ai-mcp

# === pci-dss-mcp (hvp, £79/mo) ===
if [ ! -d "pci-dss-mcp" ]; then
  npx -y mcpize init "pci-dss-mcp" --description "Pci Dss — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: general. EU AI Ac" || echo SKIP_INIT_pci-dss-mcp
fi
(cd "pci-dss-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../pci-dss-mcp.deploy.log) || echo FAIL_pci-dss-mcp

# === pdf-document-mcp (lvp, £9/mo) ===
if [ ! -d "pdf-document-mcp" ]; then
  npx -y mcpize init "pdf-document-mcp" --description "Pdf Document — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_pdf-document-mcp
fi
(cd "pdf-document-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../pdf-document-mcp.deploy.log) || echo FAIL_pdf-document-mcp

# === pdf-merge-ai-mcp (lvp, £9/mo) ===
if [ ! -d "pdf-merge-ai-mcp" ]; then
  npx -y mcpize init "pdf-merge-ai-mcp" --description "Pdf Merge Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_pdf-merge-ai-mcp
fi
(cd "pdf-merge-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../pdf-merge-ai-mcp.deploy.log) || echo FAIL_pdf-merge-ai-mcp

# === pdf-tools-ai-mcp (lvp, £9/mo) ===
if [ ! -d "pdf-tools-ai-mcp" ]; then
  npx -y mcpize init "pdf-tools-ai-mcp" --description "Pdf Tools Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_pdf-tools-ai-mcp
fi
(cd "pdf-tools-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../pdf-tools-ai-mcp.deploy.log) || echo FAIL_pdf-tools-ai-mcp

# === performance-ai-mcp (lvp, £9/mo) ===
if [ ! -d "performance-ai-mcp" ]; then
  npx -y mcpize init "performance-ai-mcp" --description "Performance Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_performance-ai-mcp
fi
(cd "performance-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../performance-ai-mcp.deploy.log) || echo FAIL_performance-ai-mcp

# === personal-finance-ai-mcp (elite, £199/mo) ===
if [ ! -d "personal-finance-ai-mcp" ]; then
  npx -y mcpize init "personal-finance-ai-mcp" --description "Personal Finance Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: elite (£9/mo). Sectors: finance. EU AI A" || echo SKIP_INIT_personal-finance-ai-mcp
fi
(cd "personal-finance-ai-mcp" && npx -y mcpize deploy --price-gbp 199 2>&1 | tee -a ../personal-finance-ai-mcp.deploy.log) || echo FAIL_personal-finance-ai-mcp

# === pet-care-ai-mcp (lvp, £9/mo) ===
if [ ! -d "pet-care-ai-mcp" ]; then
  npx -y mcpize init "pet-care-ai-mcp" --description "Pet Care Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: healthcare. EU " || echo SKIP_INIT_pet-care-ai-mcp
fi
(cd "pet-care-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../pet-care-ai-mcp.deploy.log) || echo FAIL_pet-care-ai-mcp

# === photography-ai-mcp (lvp, £9/mo) ===
if [ ! -d "photography-ai-mcp" ]; then
  npx -y mcpize init "photography-ai-mcp" --description "Photography Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_photography-ai-mcp
fi
(cd "photography-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../photography-ai-mcp.deploy.log) || echo FAIL_photography-ai-mcp

# === plagiarism-checker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "plagiarism-checker-ai-mcp" ]; then
  npx -y mcpize init "plagiarism-checker-ai-mcp" --description "Plagiarism Checker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_plagiarism-checker-ai-mcp
fi
(cd "plagiarism-checker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../plagiarism-checker-ai-mcp.deploy.log) || echo FAIL_plagiarism-checker-ai-mcp

# === planthire-ai-mcp (lvp, £9/mo) ===
if [ ! -d "planthire-ai-mcp" ]; then
  npx -y mcpize init "planthire-ai-mcp" --description "Planthire Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_planthire-ai-mcp
fi
(cd "planthire-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../planthire-ai-mcp.deploy.log) || echo FAIL_planthire-ai-mcp

# === pomodoro-ai-mcp (lvp, £9/mo) ===
if [ ! -d "pomodoro-ai-mcp" ]; then
  npx -y mcpize init "pomodoro-ai-mcp" --description "Pomodoro Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_pomodoro-ai-mcp
fi
(cd "pomodoro-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../pomodoro-ai-mcp.deploy.log) || echo FAIL_pomodoro-ai-mcp

# === price-tracker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "price-tracker-ai-mcp" ]; then
  npx -y mcpize init "price-tracker-ai-mcp" --description "Price Tracker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_price-tracker-ai-mcp
fi
(cd "price-tracker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../price-tracker-ai-mcp.deploy.log) || echo FAIL_price-tracker-ai-mcp

# === project-management-ai-mcp (lvp, £9/mo) ===
if [ ! -d "project-management-ai-mcp" ]; then
  npx -y mcpize init "project-management-ai-mcp" --description "Project Management Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_project-management-ai-mcp
fi
(cd "project-management-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../project-management-ai-mcp.deploy.log) || echo FAIL_project-management-ai-mcp

# === proofof-ai-mcp (lvp, £9/mo) ===
if [ ! -d "proofof-ai-mcp" ]; then
  npx -y mcpize init "proofof-ai-mcp" --description "Proofof Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI A" || echo SKIP_INIT_proofof-ai-mcp
fi
(cd "proofof-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../proofof-ai-mcp.deploy.log) || echo FAIL_proofof-ai-mcp

# === qidi-printer-mcp (lvp, £9/mo) ===
if [ ! -d "qidi-printer-mcp" ]; then
  npx -y mcpize init "qidi-printer-mcp" --description "Qidi Printer — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_qidi-printer-mcp
fi
(cd "qidi-printer-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../qidi-printer-mcp.deploy.log) || echo FAIL_qidi-printer-mcp

# === qr-code-ai-mcp (mvp, £29/mo) ===
if [ ! -d "qr-code-ai-mcp" ]; then
  npx -y mcpize init "qr-code-ai-mcp" --description "Qr Code Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: general. EU AI " || echo SKIP_INIT_qr-code-ai-mcp
fi
(cd "qr-code-ai-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../qr-code-ai-mcp.deploy.log) || echo FAIL_qr-code-ai-mcp

# === quantum-scoring-mcp (lvp, £9/mo) ===
if [ ! -d "quantum-scoring-mcp" ]; then
  npx -y mcpize init "quantum-scoring-mcp" --description "Quantum Scoring — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_quantum-scoring-mcp
fi
(cd "quantum-scoring-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../quantum-scoring-mcp.deploy.log) || echo FAIL_quantum-scoring-mcp

# === quiz-generator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "quiz-generator-ai-mcp" ]; then
  npx -y mcpize init "quiz-generator-ai-mcp" --description "Quiz Generator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_quiz-generator-ai-mcp
fi
(cd "quiz-generator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../quiz-generator-ai-mcp.deploy.log) || echo FAIL_quiz-generator-ai-mcp

# === rag-knowledge-graph-mcp (lvp, £9/mo) ===
if [ ! -d "rag-knowledge-graph-mcp" ]; then
  npx -y mcpize init "rag-knowledge-graph-mcp" --description "Rag Knowledge Graph — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_rag-knowledge-graph-mcp
fi
(cd "rag-knowledge-graph-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../rag-knowledge-graph-mcp.deploy.log) || echo FAIL_rag-knowledge-graph-mcp

# === rag-knowledge-mcp (lvp, £9/mo) ===
if [ ! -d "rag-knowledge-mcp" ]; then
  npx -y mcpize init "rag-knowledge-mcp" --description "Rag Knowledge — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_rag-knowledge-mcp
fi
(cd "rag-knowledge-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../rag-knowledge-mcp.deploy.log) || echo FAIL_rag-knowledge-mcp

# === readme-generator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "readme-generator-ai-mcp" ]; then
  npx -y mcpize init "readme-generator-ai-mcp" --description "Readme Generator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_readme-generator-ai-mcp
fi
(cd "readme-generator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../readme-generator-ai-mcp.deploy.log) || echo FAIL_readme-generator-ai-mcp

# === real-estate-listing-mcp (lvp, £9/mo) ===
if [ ! -d "real-estate-listing-mcp" ]; then
  npx -y mcpize init "real-estate-listing-mcp" --description "Real Estate Listing — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_real-estate-listing-mcp
fi
(cd "real-estate-listing-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../real-estate-listing-mcp.deploy.log) || echo FAIL_real-estate-listing-mcp

# === recipe-finder-ai-mcp (lvp, £9/mo) ===
if [ ! -d "recipe-finder-ai-mcp" ]; then
  npx -y mcpize init "recipe-finder-ai-mcp" --description "Recipe Finder Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_recipe-finder-ai-mcp
fi
(cd "recipe-finder-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../recipe-finder-ai-mcp.deploy.log) || echo FAIL_recipe-finder-ai-mcp

# === recruitment-ai-mcp (lvp, £9/mo) ===
if [ ! -d "recruitment-ai-mcp" ]; then
  npx -y mcpize init "recruitment-ai-mcp" --description "Recruitment Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_recruitment-ai-mcp
fi
(cd "recruitment-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../recruitment-ai-mcp.deploy.log) || echo FAIL_recruitment-ai-mcp

# === regex-ai-mcp (lvp, £9/mo) ===
if [ ! -d "regex-ai-mcp" ]; then
  npx -y mcpize init "regex-ai-mcp" --description "Regex Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act" || echo SKIP_INIT_regex-ai-mcp
fi
(cd "regex-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../regex-ai-mcp.deploy.log) || echo FAIL_regex-ai-mcp

# === regulatory-webhook-mcp (lvp, £9/mo) ===
if [ ! -d "regulatory-webhook-mcp" ]; then
  npx -y mcpize init "regulatory-webhook-mcp" --description "Regulatory Webhook — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: governme" || echo SKIP_INIT_regulatory-webhook-mcp
fi
(cd "regulatory-webhook-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../regulatory-webhook-mcp.deploy.log) || echo FAIL_regulatory-webhook-mcp

# === restaurant-ai-mcp (lvp, £9/mo) ===
if [ ! -d "restaurant-ai-mcp" ]; then
  npx -y mcpize init "restaurant-ai-mcp" --description "Restaurant Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_restaurant-ai-mcp
fi
(cd "restaurant-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../restaurant-ai-mcp.deploy.log) || echo FAIL_restaurant-ai-mcp

# === resume-parser-ai-mcp (lvp, £9/mo) ===
if [ ! -d "resume-parser-ai-mcp" ]; then
  npx -y mcpize init "resume-parser-ai-mcp" --description "Resume Parser Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_resume-parser-ai-mcp
fi
(cd "resume-parser-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../resume-parser-ai-mcp.deploy.log) || echo FAIL_resume-parser-ai-mcp

# === risk-assessment-ai-mcp (lvp, £9/mo) ===
if [ ! -d "risk-assessment-ai-mcp" ]; then
  npx -y mcpize init "risk-assessment-ai-mcp" --description "Risk Assessment Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_risk-assessment-ai-mcp
fi
(cd "risk-assessment-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../risk-assessment-ai-mcp.deploy.log) || echo FAIL_risk-assessment-ai-mcp

# === robotics-control-mcp (lvp, £9/mo) ===
if [ ! -d "robotics-control-mcp" ]; then
  npx -y mcpize init "robotics-control-mcp" --description "Robotics Control — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_robotics-control-mcp
fi
(cd "robotics-control-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../robotics-control-mcp.deploy.log) || echo FAIL_robotics-control-mcp

# === sbom-cyclonedx-mcp (lvp, £9/mo) ===
if [ ! -d "sbom-cyclonedx-mcp" ]; then
  npx -y mcpize init "sbom-cyclonedx-mcp" --description "Sbom Cyclonedx — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_sbom-cyclonedx-mcp
fi
(cd "sbom-cyclonedx-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../sbom-cyclonedx-mcp.deploy.log) || echo FAIL_sbom-cyclonedx-mcp

# === scam-detector-mcp (lvp, £9/mo) ===
if [ ! -d "scam-detector-mcp" ]; then
  npx -y mcpize init "scam-detector-mcp" --description "Scam Detector — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_scam-detector-mcp
fi
(cd "scam-detector-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../scam-detector-mcp.deploy.log) || echo FAIL_scam-detector-mcp

# === schema-validator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "schema-validator-ai-mcp" ]; then
  npx -y mcpize init "schema-validator-ai-mcp" --description "Schema Validator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general" || echo SKIP_INIT_schema-validator-ai-mcp
fi
(cd "schema-validator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../schema-validator-ai-mcp.deploy.log) || echo FAIL_schema-validator-ai-mcp

# === security-scanner-ai-mcp (hvp, £79/mo) ===
if [ ! -d "security-scanner-ai-mcp" ]; then
  npx -y mcpize init "security-scanner-ai-mcp" --description "Security Scanner Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: gener" || echo SKIP_INIT_security-scanner-ai-mcp
fi
(cd "security-scanner-ai-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../security-scanner-ai-mcp.deploy.log) || echo FAIL_security-scanner-ai-mcp

# === self-healing-infrastructure-mcp (lvp, £9/mo) ===
if [ ! -d "self-healing-infrastructure-mcp" ]; then
  npx -y mcpize init "self-healing-infrastructure-mcp" --description "Self Healing Infrastructure — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors:" || echo SKIP_INIT_self-healing-infrastructure-mcp
fi
(cd "self-healing-infrastructure-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../self-healing-infrastructure-mcp.deploy.log) || echo FAIL_self-healing-infrastructure-mcp

# === sentiment-analysis-ai-mcp (lvp, £9/mo) ===
if [ ! -d "sentiment-analysis-ai-mcp" ]; then
  npx -y mcpize init "sentiment-analysis-ai-mcp" --description "Sentiment Analysis Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gener" || echo SKIP_INIT_sentiment-analysis-ai-mcp
fi
(cd "sentiment-analysis-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../sentiment-analysis-ai-mcp.deploy.log) || echo FAIL_sentiment-analysis-ai-mcp

# === seo-checker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "seo-checker-ai-mcp" ]; then
  npx -y mcpize init "seo-checker-ai-mcp" --description "Seo Checker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_seo-checker-ai-mcp
fi
(cd "seo-checker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../seo-checker-ai-mcp.deploy.log) || echo FAIL_seo-checker-ai-mcp

# === sigstore-cosign-mcp (lvp, £9/mo) ===
if [ ! -d "sigstore-cosign-mcp" ]; then
  npx -y mcpize init "sigstore-cosign-mcp" --description "Sigstore Cosign — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_sigstore-cosign-mcp
fi
(cd "sigstore-cosign-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../sigstore-cosign-mcp.deploy.log) || echo FAIL_sigstore-cosign-mcp

# === skip-hire-ai-mcp (lvp, £9/mo) ===
if [ ! -d "skip-hire-ai-mcp" ]; then
  npx -y mcpize init "skip-hire-ai-mcp" --description "Skip Hire Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_skip-hire-ai-mcp
fi
(cd "skip-hire-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../skip-hire-ai-mcp.deploy.log) || echo FAIL_skip-hire-ai-mcp

# === slack-enterprise-mcp (lvp, £9/mo) ===
if [ ! -d "slack-enterprise-mcp" ]; then
  npx -y mcpize init "slack-enterprise-mcp" --description "Slack Enterprise — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_slack-enterprise-mcp
fi
(cd "slack-enterprise-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../slack-enterprise-mcp.deploy.log) || echo FAIL_slack-enterprise-mcp

# === sleep-tracker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "sleep-tracker-ai-mcp" ]; then
  npx -y mcpize init "sleep-tracker-ai-mcp" --description "Sleep Tracker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_sleep-tracker-ai-mcp
fi
(cd "sleep-tracker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../sleep-tracker-ai-mcp.deploy.log) || echo FAIL_sleep-tracker-ai-mcp

# === slsa-supply-chain-mcp (lvp, £9/mo) ===
if [ ! -d "slsa-supply-chain-mcp" ]; then
  npx -y mcpize init "slsa-supply-chain-mcp" --description "Slsa Supply Chain — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: manufactu" || echo SKIP_INIT_slsa-supply-chain-mcp
fi
(cd "slsa-supply-chain-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../slsa-supply-chain-mcp.deploy.log) || echo FAIL_slsa-supply-chain-mcp

# === slugify-ai-mcp (lvp, £9/mo) ===
if [ ! -d "slugify-ai-mcp" ]; then
  npx -y mcpize init "slugify-ai-mcp" --description "Slugify Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI A" || echo SKIP_INIT_slugify-ai-mcp
fi
(cd "slugify-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../slugify-ai-mcp.deploy.log) || echo FAIL_slugify-ai-mcp

# === soc2-compliance-ai-mcp (hvp, £79/mo) ===
if [ ! -d "soc2-compliance-ai-mcp" ]; then
  npx -y mcpize init "soc2-compliance-ai-mcp" --description "Soc2 Compliance Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: legal." || echo SKIP_INIT_soc2-compliance-ai-mcp
fi
(cd "soc2-compliance-ai-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../soc2-compliance-ai-mcp.deploy.log) || echo FAIL_soc2-compliance-ai-mcp

# === social-media-ai-mcp (lvp, £9/mo) ===
if [ ! -d "social-media-ai-mcp" ]; then
  npx -y mcpize init "social-media-ai-mcp" --description "Social Media Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: media. EU A" || echo SKIP_INIT_social-media-ai-mcp
fi
(cd "social-media-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../social-media-ai-mcp.deploy.log) || echo FAIL_social-media-ai-mcp

# === sql-builder-ai-mcp (lvp, £9/mo) ===
if [ ! -d "sql-builder-ai-mcp" ]; then
  npx -y mcpize init "sql-builder-ai-mcp" --description "Sql Builder Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_sql-builder-ai-mcp
fi
(cd "sql-builder-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../sql-builder-ai-mcp.deploy.log) || echo FAIL_sql-builder-ai-mcp

# === stock-analyzer-ai-mcp (lvp, £9/mo) ===
if [ ! -d "stock-analyzer-ai-mcp" ]; then
  npx -y mcpize init "stock-analyzer-ai-mcp" --description "Stock Analyzer Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_stock-analyzer-ai-mcp
fi
(cd "stock-analyzer-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../stock-analyzer-ai-mcp.deploy.log) || echo FAIL_stock-analyzer-ai-mcp

# === string-utils-ai-mcp (lvp, £9/mo) ===
if [ ! -d "string-utils-ai-mcp" ]; then
  npx -y mcpize init "string-utils-ai-mcp" --description "String Utils Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_string-utils-ai-mcp
fi
(cd "string-utils-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../string-utils-ai-mcp.deploy.log) || echo FAIL_string-utils-ai-mcp

# === stripe-billing-mcp (lvp, £9/mo) ===
if [ ! -d "stripe-billing-mcp" ]; then
  npx -y mcpize init "stripe-billing-mcp" --description "Stripe Billing — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: finance. EU " || echo SKIP_INIT_stripe-billing-mcp
fi
(cd "stripe-billing-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../stripe-billing-mcp.deploy.log) || echo FAIL_stripe-billing-mcp

# === subscription-tracker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "subscription-tracker-ai-mcp" ]; then
  npx -y mcpize init "subscription-tracker-ai-mcp" --description "Subscription Tracker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gen" || echo SKIP_INIT_subscription-tracker-ai-mcp
fi
(cd "subscription-tracker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../subscription-tracker-ai-mcp.deploy.log) || echo FAIL_subscription-tracker-ai-mcp

# === summarizer-ai-mcp (lvp, £9/mo) ===
if [ ! -d "summarizer-ai-mcp" ]; then
  npx -y mcpize init "summarizer-ai-mcp" --description "Summarizer Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_summarizer-ai-mcp
fi
(cd "summarizer-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../summarizer-ai-mcp.deploy.log) || echo FAIL_summarizer-ai-mcp

# === supply-chain-mcp (lvp, £9/mo) ===
if [ ! -d "supply-chain-mcp" ]; then
  npx -y mcpize init "supply-chain-mcp" --description "Supply Chain — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: manufacturing." || echo SKIP_INIT_supply-chain-mcp
fi
(cd "supply-chain-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../supply-chain-mcp.deploy.log) || echo FAIL_supply-chain-mcp

# === survey-builder-ai-mcp (lvp, £9/mo) ===
if [ ! -d "survey-builder-ai-mcp" ]; then
  npx -y mcpize init "survey-builder-ai-mcp" --description "Survey Builder Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_survey-builder-ai-mcp
fi
(cd "survey-builder-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../survey-builder-ai-mcp.deploy.log) || echo FAIL_survey-builder-ai-mcp

# === tax-calculator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "tax-calculator-ai-mcp" ]; then
  npx -y mcpize init "tax-calculator-ai-mcp" --description "Tax Calculator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_tax-calculator-ai-mcp
fi
(cd "tax-calculator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../tax-calculator-ai-mcp.deploy.log) || echo FAIL_tax-calculator-ai-mcp

# === test-case-generator-ai-mcp (mvp, £29/mo) ===
if [ ! -d "test-case-generator-ai-mcp" ]; then
  npx -y mcpize init "test-case-generator-ai-mcp" --description "Test Case Generator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Mid-Value Pack (£29/mo). Sectors: leg" || echo SKIP_INIT_test-case-generator-ai-mcp
fi
(cd "test-case-generator-ai-mcp" && npx -y mcpize deploy --price-gbp 29 2>&1 | tee -a ../test-case-generator-ai-mcp.deploy.log) || echo FAIL_test-case-generator-ai-mcp

# === text-stats-ai-mcp (lvp, £9/mo) ===
if [ ! -d "text-stats-ai-mcp" ]; then
  npx -y mcpize init "text-stats-ai-mcp" --description "Text Stats Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU A" || echo SKIP_INIT_text-stats-ai-mcp
fi
(cd "text-stats-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../text-stats-ai-mcp.deploy.log) || echo FAIL_text-stats-ai-mcp

# === time-tracker-ai-mcp (lvp, £9/mo) ===
if [ ! -d "time-tracker-ai-mcp" ]; then
  npx -y mcpize init "time-tracker-ai-mcp" --description "Time Tracker Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU" || echo SKIP_INIT_time-tracker-ai-mcp
fi
(cd "time-tracker-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../time-tracker-ai-mcp.deploy.log) || echo FAIL_time-tracker-ai-mcp

# === tone-rewriter-ai-mcp (lvp, £9/mo) ===
if [ ! -d "tone-rewriter-ai-mcp" ]; then
  npx -y mcpize init "tone-rewriter-ai-mcp" --description "Tone Rewriter Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_tone-rewriter-ai-mcp
fi
(cd "tone-rewriter-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../tone-rewriter-ai-mcp.deploy.log) || echo FAIL_tone-rewriter-ai-mcp

# === translation-ai-mcp (lvp, £9/mo) ===
if [ ! -d "translation-ai-mcp" ]; then
  npx -y mcpize init "translation-ai-mcp" --description "Translation Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU " || echo SKIP_INIT_translation-ai-mcp
fi
(cd "translation-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../translation-ai-mcp.deploy.log) || echo FAIL_translation-ai-mcp

# === translator-pro-ai-mcp (lvp, £9/mo) ===
if [ ! -d "translator-pro-ai-mcp" ]; then
  npx -y mcpize init "translator-pro-ai-mcp" --description "Translator Pro Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_translator-pro-ai-mcp
fi
(cd "translator-pro-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../translator-pro-ai-mcp.deploy.log) || echo FAIL_translator-pro-ai-mcp

# === trust-chain-mcp (lvp, £9/mo) ===
if [ ! -d "trust-chain-mcp" ]; then
  npx -y mcpize init "trust-chain-mcp" --description "Trust Chain — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_trust-chain-mcp
fi
(cd "trust-chain-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../trust-chain-mcp.deploy.log) || echo FAIL_trust-chain-mcp

# === uk-ai-act-mcp (lvp, £9/mo) ===
if [ ! -d "uk-ai-act-mcp" ]; then
  npx -y mcpize init "uk-ai-act-mcp" --description "Uk Ai Act — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: government. EU AI" || echo SKIP_INIT_uk-ai-act-mcp
fi
(cd "uk-ai-act-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../uk-ai-act-mcp.deploy.log) || echo FAIL_uk-ai-act-mcp

# === uk-ai-bill-compliance-mcp (hvp, £79/mo) ===
if [ ! -d "uk-ai-bill-compliance-mcp" ]; then
  npx -y mcpize init "uk-ai-bill-compliance-mcp" --description "Uk Ai Bill Compliance — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: High-Value Pack (£99/mo). Sectors: leg" || echo SKIP_INIT_uk-ai-bill-compliance-mcp
fi
(cd "uk-ai-bill-compliance-mcp" && npx -y mcpize deploy --price-gbp 79 2>&1 | tee -a ../uk-ai-bill-compliance-mcp.deploy.log) || echo FAIL_uk-ai-bill-compliance-mcp

# === unit-converter-ai-mcp (lvp, £9/mo) ===
if [ ! -d "unit-converter-ai-mcp" ]; then
  npx -y mcpize init "unit-converter-ai-mcp" --description "Unit Converter Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. " || echo SKIP_INIT_unit-converter-ai-mcp
fi
(cd "unit-converter-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../unit-converter-ai-mcp.deploy.log) || echo FAIL_unit-converter-ai-mcp

# === url-ai-mcp (lvp, £9/mo) ===
if [ ! -d "url-ai-mcp" ]; then
  npx -y mcpize init "url-ai-mcp" --description "Url Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act /" || echo SKIP_INIT_url-ai-mcp
fi
(cd "url-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../url-ai-mcp.deploy.log) || echo FAIL_url-ai-mcp

# === uuid-ai-mcp (lvp, £9/mo) ===
if [ ! -d "uuid-ai-mcp" ]; then
  npx -y mcpize init "uuid-ai-mcp" --description "Uuid Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI Act " || echo SKIP_INIT_uuid-ai-mcp
fi
(cd "uuid-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../uuid-ai-mcp.deploy.log) || echo FAIL_uuid-ai-mcp

# === validator-ai-mcp (lvp, £9/mo) ===
if [ ! -d "validator-ai-mcp" ]; then
  npx -y mcpize init "validator-ai-mcp" --description "Validator Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_validator-ai-mcp
fi
(cd "validator-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../validator-ai-mcp.deploy.log) || echo FAIL_validator-ai-mcp

# === vector-knowledge-graph-mcp (lvp, £9/mo) ===
if [ ! -d "vector-knowledge-graph-mcp" ]; then
  npx -y mcpize init "vector-knowledge-graph-mcp" --description "Vector Knowledge Graph — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: gene" || echo SKIP_INIT_vector-knowledge-graph-mcp
fi
(cd "vector-knowledge-graph-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../vector-knowledge-graph-mcp.deploy.log) || echo FAIL_vector-knowledge-graph-mcp

# === video-editing-ai-mcp (lvp, £9/mo) ===
if [ ! -d "video-editing-ai-mcp" ]; then
  npx -y mcpize init "video-editing-ai-mcp" --description "Video Editing Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. E" || echo SKIP_INIT_video-editing-ai-mcp
fi
(cd "video-editing-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../video-editing-ai-mcp.deploy.log) || echo FAIL_video-editing-ai-mcp

# === voice-audio-mcp (lvp, £9/mo) ===
if [ ! -d "voice-audio-mcp" ]; then
  npx -y mcpize init "voice-audio-mcp" --description "Voice Audio — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI " || echo SKIP_INIT_voice-audio-mcp
fi
(cd "voice-audio-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../voice-audio-mcp.deploy.log) || echo FAIL_voice-audio-mcp

# === watermarking-authenticity-mcp (lvp, £9/mo) ===
if [ ! -d "watermarking-authenticity-mcp" ]; then
  npx -y mcpize init "watermarking-authenticity-mcp" --description "Watermarking Authenticity — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: g" || echo SKIP_INIT_watermarking-authenticity-mcp
fi
(cd "watermarking-authenticity-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../watermarking-authenticity-mcp.deploy.log) || echo FAIL_watermarking-authenticity-mcp

# === weather-ai-mcp (lvp, £9/mo) ===
if [ ! -d "weather-ai-mcp" ]; then
  npx -y mcpize init "weather-ai-mcp" --description "Weather Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI A" || echo SKIP_INIT_weather-ai-mcp
fi
(cd "weather-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../weather-ai-mcp.deploy.log) || echo FAIL_weather-ai-mcp

# === web-research-mcp (lvp, £9/mo) ===
if [ ! -d "web-research-mcp" ]; then
  npx -y mcpize init "web-research-mcp" --description "Web Research — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI" || echo SKIP_INIT_web-research-mcp
fi
(cd "web-research-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../web-research-mcp.deploy.log) || echo FAIL_web-research-mcp

# === webhook-ai-mcp (lvp, £9/mo) ===
if [ ! -d "webhook-ai-mcp" ]; then
  npx -y mcpize init "webhook-ai-mcp" --description "Webhook Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general. EU AI A" || echo SKIP_INIT_webhook-ai-mcp
fi
(cd "webhook-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../webhook-ai-mcp.deploy.log) || echo FAIL_webhook-ai-mcp

# === workout-planner-ai-mcp (lvp, £9/mo) ===
if [ ! -d "workout-planner-ai-mcp" ]; then
  npx -y mcpize init "workout-planner-ai-mcp" --description "Workout Planner Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: general." || echo SKIP_INIT_workout-planner-ai-mcp
fi
(cd "workout-planner-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../workout-planner-ai-mcp.deploy.log) || echo FAIL_workout-planner-ai-mcp

# === writing-assistant-ai-mcp (lvp, £9/mo) ===
if [ ! -d "writing-assistant-ai-mcp" ]; then
  npx -y mcpize init "writing-assistant-ai-mcp" --description "Writing Assistant Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: genera" || echo SKIP_INIT_writing-assistant-ai-mcp
fi
(cd "writing-assistant-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../writing-assistant-ai-mcp.deploy.log) || echo FAIL_writing-assistant-ai-mcp

# === yaml-ai-mcp (lvp, £9/mo) ===
if [ ! -d "yaml-ai-mcp" ]; then
  npx -y mcpize init "yaml-ai-mcp" --description "Yaml Ai — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. Tier: Low-Value Pack (£9/mo). Sectors: finance. EU AI Act " || echo SKIP_INIT_yaml-ai-mcp
fi
(cd "yaml-ai-mcp" && npx -y mcpize deploy --price-gbp 9 2>&1 | tee -a ../yaml-ai-mcp.deploy.log) || echo FAIL_yaml-ai-mcp
