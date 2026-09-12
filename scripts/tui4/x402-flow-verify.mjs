#!/usr/bin/env node
/**
 * TUI-4: x402 End-to-End Flow Verification
 *
 * Tests the full discovery→challenge→settlement→delivery→receipt flow.
 * Steps 1-3 are executed. Step 4 (payment) requires owner wallet key.
 *
 * Usage: node scripts/tui4/x402-flow-verify.mjs
 */

const MCP_URL = "https://councilof.ai/mcp";
const X402_DISCOVERY = "https://councilof.ai/.well-known/x402.json";
const X402_CATALOG = "https://councilof.ai/api/x402";
const FREE_DOOR = "https://councilof.ai/api/free-door";
const AGENT_CARD = "https://councilof.ai/.well-known/agent-card.json";
const REVENUE = "https://councilof.ai/api/revenue";
const RECEIPTS = "https://councilof.ai/api/receipts/latest";

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const results = {
    schema: "csoai.x402-flow-verification/1.0",
    generated_at: new Date().toISOString(),
    steps: [],
  };

  // Step 1: Discovery
  console.log("=== Step 1: Discovery ===");
  const discovery = await fetchJSON(X402_DISCOVERY);
  results.steps.push({
    step: 1,
    name: "Discovery",
    url: X402_DISCOVERY,
    status: discovery.status,
    ok: discovery.status === 200,
    data: {
      mode: discovery.body.mode,
      network: discovery.body.network,
      asset: discovery.body.asset,
      payTo: discovery.body.payTo,
      resources: discovery.body.resources?.length || 0,
    },
  });
  console.log(`  Status: ${discovery.status} | Mode: ${discovery.body.mode} | Resources: ${discovery.body.resources?.length}`);

  // Step 2: Free door (amount=0)
  console.log("\n=== Step 2: Free Door ===");
  const freeDoor = await fetchJSON(FREE_DOOR);
  results.steps.push({
    step: 2,
    name: "Free Door",
    url: FREE_DOOR,
    status: freeDoor.status,
    ok: freeDoor.status === 402,
    data: {
      amount: freeDoor.body.accepts?.[0]?.amount || freeDoor.body.accepts?.[0]?.maxAmountRequired,
      description: freeDoor.body.resource?.description?.slice(0, 80),
    },
  });
  console.log(`  Status: ${freeDoor.status} | Amount: ${freeDoor.body.accepts?.[0]?.amount}`);

  // Step 3: Paid resource challenge
  console.log("\n=== Step 3: Paid Resource Challenge ===");
  const PAID_RESOURCE = "https://councilof.ai/api/request-attestation?subject=test&axis=governance";
  const paidChallenge = await fetchJSON(PAID_RESOURCE);
  const accept = paidChallenge.body.accepts?.[0];
  results.steps.push({
    step: 3,
    name: "Paid Resource Challenge",
    url: PAID_RESOURCE,
    status: paidChallenge.status,
    ok: paidChallenge.status === 402,
    data: {
      amount: accept?.maxAmountRequired || accept?.amount,
      network: accept?.network,
      asset: accept?.asset,
      scheme: accept?.scheme,
      payTo: accept?.payTo,
    },
  });
  console.log(`  Status: ${paidChallenge.status} | Amount: ${accept?.maxAmountRequired} | Network: ${accept?.network}`);

  // Step 4: Payment (blocked — no wallet key)
  console.log("\n=== Step 4: Payment ===");
  results.steps.push({
    step: 4,
    name: "Payment",
    status: "BLOCKED",
    ok: false,
    blocker: "Self-wallet private key (0x4dB7...02B7) not available in this session. Requires owner action.",
  });
  console.log(`  Status: BLOCKED — no wallet key`);

  // Step 5: MCP tool discovery
  console.log("\n=== Step 5: MCP Tool Discovery ===");
  const mcpInit = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "verify", version: "1.0" } } }),
  });
  const mcpBody = await mcpInit.text();
  const mcpData = mcpBody.split("\n").find((l) => l.startsWith("data: "));
  const mcpInfo = mcpData ? JSON.parse(mcpData.slice(6)) : {};
  results.steps.push({
    step: 5,
    name: "MCP Discovery",
    url: MCP_URL,
    status: mcpInit.status,
    ok: mcpInit.status === 200,
    data: {
      server: mcpInfo.result?.serverInfo?.name,
      version: mcpInfo.result?.serverInfo?.version,
      protocol: mcpInfo.result?.protocolVersion,
    },
  });
  console.log(`  Server: ${mcpInfo.result?.serverInfo?.name} v${mcpInfo.result?.serverInfo?.version}`);

  // Step 6: Agent Card
  console.log("\n=== Step 6: Agent Card ===");
  const agentCard = await fetchJSON(AGENT_CARD);
  results.steps.push({
    step: 6,
    name: "Agent Card",
    url: AGENT_CARD,
    status: agentCard.status,
    ok: agentCard.status === 200,
    data: {
      name: agentCard.body.name,
      version: agentCard.body.version,
      extensions: agentCard.body.capabilities?.extensions?.length || 0,
    },
  });
  console.log(`  Name: ${agentCard.body.name} | Version: ${agentCard.body.version}`);

  // Step 7: Revenue state
  console.log("\n=== Step 7: Revenue State ===");
  const revenue = await fetchJSON(REVENUE);
  results.steps.push({
    step: 7,
    name: "Revenue State",
    url: REVENUE,
    status: revenue.status,
    ok: revenue.status === 200,
    data: {
      settled_usdc: revenue.body.settled_usdc?.count,
      payers: revenue.body.one_number?.all_time,
      self_settlements: revenue.body.one_number?.self_settlements,
    },
  });
  console.log(`  Settled: ${revenue.body.settled_usdc?.count} | Payers: ${revenue.body.one_number?.all_time}`);

  // Summary
  const executed = results.steps.filter((s) => s.ok).length;
  const blocked = results.steps.filter((s) => s.status === "BLOCKED").length;
  results.summary = {
    total_steps: results.steps.length,
    executed,
    blocked,
    success_condition: "outside agent can discover, pay, receive evidence, verify independently",
    current_state: `${executed}/${results.steps.length} steps executed, ${blocked} blocked on wallet key`,
  };

  console.log(`\n=== Summary: ${executed}/${results.steps.length} executed, ${blocked} blocked ===`);

  const fs = await import("fs");
  fs.writeFileSync("docs/tui4/X402-FLOW-VERIFICATION.json", JSON.stringify(results, null, 2));
  console.log("Written to docs/tui4/X402-FLOW-VERIFICATION.json");
}

main().catch(console.error);
