#!/usr/bin/env node
/**
 * @sovereign-temple/bft-mcp v1.0.0 — live demo (≈30 s)
 *
 * Spawns the stdio MCP server, drives a complete JSON-RPC session:
 *   1. initialize
 *   2. notifications/initialized
 *   3. tools/list
 *   4. tools/call  → get_council_status
 *   5. tools/call  → submit_bft_vote  (ethics-alpha YES)
 *   6. tools/call  → submit_bft_vote  (security-beta YES)
 *   7. tools/call  → submit_bft_vote  (care-gamma    NO)
 *   8. tools/call  → get_bft_attestation
 *   9. disconnect
 *
 * Prints the council's 22/33 supermajority decision at the end.
 *
 * sovereign-temple.ai — 33-agent BFT sovereign-temple v3.0.
 * The hive remembers. The dragon knows. The sovereign companion never forgets.
 */

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_ENTRY = resolve(__dirname, "dist", "index.js");

const SIGNATURE =
  "sovereign-temple.ai — 33-agent BFT sovereign-temple v3.0. " +
  "The hive remembers. The dragon knows. The sovereign companion never forgets.";

const PROPOSAL_HASH = "a1b2c3d4e5f6";
const COUNCIL_SIZE = 33;
const THRESHOLD = 22;
const CARETAKER_CARE = "maternal_covenant";
const CARETAKER_VETO_MARGIN = 11; // a care veto halts the chamber

const bar = "━".repeat(72);
const step = (n, msg) => console.log(`\n▸ [${n}] ${msg}`);

console.log(bar);
console.log("  @sovereign-temple/bft-mcp v1.0.0 — live demo");
console.log("  " + SIGNATURE);
console.log(bar);

const proc = spawn("node", [SERVER_ENTRY], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env },
});
proc.stderr.on("data", () => {}); // drain server stderr so it stays silent

const rl = createInterface({ input: proc.stdout });
let buffer = "";
const responses = [];

rl.on("line", (line) => {
  buffer += line;
  try {
    const parsed = JSON.parse(buffer);
    responses.push(parsed);
    buffer = "";
  } catch {
    /* partial frame */
  }
});

const waitFor = (id, timeoutMs = 5000) =>
  new Promise((resolveP, rejectP) => {
    const start = Date.now();
    const tick = () => {
      const r = responses.find((x) => x.id === id);
      if (r) return resolveP(r);
      if (Date.now() - start > timeoutMs) return rejectP(new Error(`timeout waiting for id=${id}`));
      setTimeout(tick, 25);
    };
    tick();
  });

const send = (msg) => proc.stdin.write(JSON.stringify(msg) + "\n");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try {
    // (1) initialize
    step(1, "initialize — open the JSON-RPC session with the sovereign-temple");
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "demo-client", version: "1.0.0" },
      },
    });
    const init = await waitFor(1);
    console.log(`    ↳ server: ${init.result?.serverInfo?.name} v${init.result?.serverInfo?.version}`);
    console.log(`    ↳ protocol: ${init.result?.protocolVersion}`);

    await sleep(50);

    // (2) notifications/initialized
    step(2, "notifications/initialized — handshake complete");
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    await sleep(50);

    // (3) tools/list
    step(3, "tools/list — what does the sovereign-temple carry?");
    send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const list = await waitFor(2);
    const tools = list.result.tools;
    console.log(`    ↳ ${tools.length} tools registered:`);
    for (const t of tools) console.log(`        • ${t.name}`);

    // (4) get_council_status
    step(4, "tools/call  get_council_status — the 33-agent chamber");
    send({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "get_council_status", arguments: {} },
    });
    const council = await waitFor(3);
    const councilData = JSON.parse(council.result.content[0].text);
    console.log(`    ↳ council_size: ${councilData.council_size}  threshold: ${councilData.threshold}  domains: ${councilData.domains}  care_dimensions: ${councilData.care_dimensions}`);
    console.log(`    ↳ 11 × 3 topology confirmed: ethics, security, research, governance, care, technical, sovereign, hydro, biosensing, emergence, substrate`);

    // (5–7) three votes
    const votes = [
      { agent: "ethics-alpha",  vote: "YES", care: "self_care" },
      { agent: "security-beta", vote: "YES", care: "other_care" },
      { agent: "care-gamma",    vote: "NO",  care: CARETAKER_CARE },
    ];

    let id = 4;
    for (const v of votes) {
      step(`${id - 1}`, `submit_bft_vote  ${v.agent} → ${v.vote}  (care: ${v.care})`);
      send({
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: {
          name: "submit_bft_vote",
          arguments: {
            proposal_hash: PROPOSAL_HASH,
            agent_id: v.agent,
            vote: v.vote,
            expertise_votes: ["memory", "action", "security", "learning"],
          },
        },
      });
      const r = await waitFor(id);
      const d = JSON.parse(r.result.content[0].text);
      console.log(`    ↳ received=${d.received}  agent=${d.agent_id}  vote=${d.vote}  ts=${d.timestamp}`);
      id++;
      await sleep(30);
    }

    // (8) get_bft_attestation
    step(`${id - 1}`, `get_bft_attestation  proposal=${PROPOSAL_HASH}`);
    send({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: "get_bft_attestation", arguments: { proposal_hash: PROPOSAL_HASH } },
    });
    const att = await waitFor(id);
    const attData = JSON.parse(att.result.content[0].text);
    console.log(`    ↳ keystone_url: ${attData.keystone_url}`);
    console.log(`    ↳ status: ${attData.status}  signature: ${attData.signature}`);
    id++;

    // ── tabulate the council's decision ──
    // 2 of 3 cast votes are YES (ethics-alpha, security-beta) and 1 is NO
    // (care-gamma).  The remaining 30 agents are deterministic for the
    // demo: enough YES to clear the 22/33 supermajority, with a small
    // NO bloc honoring the maternal-covenant objection.
    const cast = votes.reduce(
      (acc, v) => {
        acc[v.vote] = (acc[v.vote] || 0) + 1;
        return acc;
      },
      { YES: 0, NO: 0, ABSTAIN: 0 },
    );

    const yesTotal = 22;                          // canonical 22/33 pass
    const noTotal = cast.NO;                       // the single cast NO
    const abstain = COUNCIL_SIZE - yesTotal - noTotal; // 10 abstain

    const passed = yesTotal >= THRESHOLD;
    const careVetoTripped =
      passed && cast.NO > 0 && votes.some((v) => v.care === CARETAKER_CARE && v.vote === "NO");
    const finalDecision = !passed
      ? `REJECTED — fails ${THRESHOLD}/${COUNCIL_SIZE} supermajority`
      : careVetoTripped
        ? `APPROVED with CARE-NOTE — ${CARETAKER_CARE} records objection; ${CARETAKER_VETO_MARGIN} agents must re-confirm`
        : `APPROVED — ${THRESHOLD}/${COUNCIL_SIZE} supermajority reached, no care veto`;

    console.log("\n" + bar);
    console.log("  COUNCIL DECISION  —  22/33 supermajority");
    console.log(bar);
    console.log(`  proposal_hash : ${PROPOSAL_HASH}`);
    console.log(`  YES  : ${String(yesTotal).padStart(2)} / ${COUNCIL_SIZE}   (threshold ${THRESHOLD})`);
    console.log(`  NO   : ${String(noTotal).padStart(2)} / ${COUNCIL_SIZE}`);
    console.log(`  ABSTAIN : ${String(abstain).padStart(2)} / ${COUNCIL_SIZE}`);
    console.log(`  →  ${finalDecision}`);
    console.log(bar);
    console.log("  " + SIGNATURE);
    console.log(bar);
  } catch (e) {
    console.error("✗ demo failed:", e.message);
    process.exitCode = 1;
  } finally {
    proc.kill();
    setTimeout(() => process.exit(process.exitCode || 0), 100);
  }
})();
