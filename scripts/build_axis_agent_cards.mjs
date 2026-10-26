#!/usr/bin/env node
/**
 * build-axis-agent-cards — write the A2A agent card for every axis MCP tool.
 *
 * WHY. public/.well-known/agents/index.json is the card index: one card per tool the door
 * serves, and functions/mcp/tool-fleet.lock.test.ts holds that index against the fleet lock.
 * When the 33 axis tools joined the door, the index grew from 19 entries to 52 — but the 33
 * card FILES were never written. The link gate caught it on 2026-10-26:
 *
 *   link-gate: 33 NEW same-origin URL(s) published in a machine surface that we do not serve:
 *     /.well-known/agents/index.json -> agents[14].href
 *         https://councilof.ai/.well-known/agents/axis_governance.json
 *
 * A card index that names 33 documents nobody serves is a broken index, and the gate was right.
 *
 * WHAT IT DOES. For each `axis_*` tool in functions/mcp/gspc-tools.json, write the agent card
 * at public/.well-known/agents/<tool>.json, in the shape the 19 hand-written cards already use.
 * The card's prose is the TOOL'S OWN description, so a card cannot say anything the door does
 * not say. Nothing about an axis is typed here: the axis name comes from the tool's name.
 *
 * WHAT IT DOES NOT DO.
 *   - It does not touch the 19 hand-written cards. Those carry bespoke prose, and a generated
 *     file must never overwrite a hand-written one. This script only ever looks at `axis_*`
 *     tools, so the hand-written cards for the other tools are outside its reach entirely.
 *   - It does not touch the index. The index is hand-maintained and is held against the lock by
 *     the lock test; generating it here would put two producers on one file.
 *   - It measures nothing and certifies nothing. A card is a description of a door.
 *
 * SCOPE. The axis cards are ITS cards: the script is their producer, so it keeps them in step
 * with the tool they describe and `--check` fails when one drifts. The 19 cards it does not own
 * stay hand-written and are checked by nothing here — that is a real limit of this gate, and it
 * is why the index-to-card test in functions/mcp/tool-fleet.lock.test.ts checks every card in
 * the index, not only the generated ones.
 *
 * DETERMINISM. Offline, no clock, no randomness, no network. The bytes depend only on the
 * tool definitions, so a re-run on a clean tree changes nothing — which is what makes it
 * eligible for the rerun-and-diff producer mode in docs/operations/PRODUCERS.json.
 *
 *   node scripts/build_axis_agent_cards.mjs            # write the missing axis cards
 *   node scripts/build_axis_agent_cards.mjs --dry      # print what would change
 *   node scripts/build_axis_agent_cards.mjs --check    # exit non-zero if the committed cards differ
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./capability-registry.mjs";

const TOOLS = join(REPO, "functions/mcp/gspc-tools.json");
const CARDS = join(REPO, "public/.well-known/agents");
const DRY = process.argv.includes("--dry");
const CHECK = process.argv.includes("--check");

/** The prefix that marks a generated axis tool. Code identifier, so the axis/axes display
 *  ruling does not apply to it. */
const PREFIX = "axis_";

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));

/**
 * The published cards are ASCII-escaped JSON: every non-ASCII codepoint is written as \uXXXX.
 * The 19 hand-written cards are all like this, so the generated ones have to match them —
 * otherwise the same directory holds two conventions and a byte-diff of the directory is noise.
 */
const NONASCII_G = /[\u0080-\uffff]/g;
const asciiJson = (value) =>
  JSON.stringify(value, null, 2).replace(NONASCII_G, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")) + "\n";

/** One agent card, in the shape of the 19 hand-written ones. The description is the tool's own,
 *  so the card cannot drift from what the door serves. */
function agentCard(tool) {
  const description = tool.description;
  return {
    name: `Council of AI — ${tool.name}`,
    description,
    version: "1.0.0",
    provider: { organization: "CSOAI Ltd", url: "https://councilof.ai" },
    supportedInterfaces: [
      { url: "https://councilof.ai/api/a2a", protocolBinding: "JSONRPC", protocolVersion: "1.0" },
    ],
    documentationUrl: "https://councilof.ai/llms.txt",
    capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "application/json"],
    skills: [
      {
        id: tool.name,
        name: tool.name,
        description,
        tags: ["measurement", "mcp"],
        examples: [
          `SendMessage with Part.data {"skill":"${tool.name}","input":{}}`,
          "POST https://councilof.ai/mcp",
        ],
      },
    ],
    explicitly_not: ["certification", "accreditation", "conformity-assessment"],
    mcp_tool: tool.name,
    paid: false,
    did: `did:web:councilof.ai:agents:${tool.name}`,
  };
}

function main() {
  const doc = readJSON(TOOLS);
  const axes = doc.tools.filter((t) => String(t.name).startsWith(PREFIX));
  if (!axes.length) throw new Error(`${TOOLS} carries no ${PREFIX}* tools — refusing to write an empty card set`);

  const written = [];
  const skipped = [];
  const drifted = [];

  for (const tool of axes) {
    const path = join(CARDS, `${tool.name}.json`);
    const bytes = asciiJson(agentCard(tool));
    if (!existsSync(path)) {
      if (CHECK) {
        drifted.push(`${tool.name}.json is missing`);
        continue;
      }
      if (!DRY) writeFileSync(path, bytes);
      written.push(tool.name);
      continue;
    }
    // An existing card is a HAND-WRITTEN card and is left exactly as it is — except for the
    // cards this generator itself owns, which must match the tool they describe.
    const current = readFileSync(path, "utf8");
    if (current !== bytes) {
      if (CHECK) {
        drifted.push(`${tool.name}.json differs from the tool it describes`);
        continue;
      }
      if (!DRY) writeFileSync(path, bytes);
      written.push(`${tool.name} (rewritten)`);
      continue;
    }
    skipped.push(tool.name);
  }

  if (CHECK) {
    if (drifted.length) {
      console.error(`✖ axis agent cards: ${drifted.length} card(s) do not match the tools they describe:`);
      for (const d of drifted) console.error(`    ${d}`);
      console.error("  Run: node scripts/build_axis_agent_cards.mjs");
      process.exit(1);
    }
    console.log(`✓ axis agent cards: ${axes.length} card(s) match the tools they describe`);
    return;
  }

  if (DRY) {
    console.log(`would write ${written.length} card(s) into ${CARDS}`);
    console.log(`written: ${written.join(", ") || "(none)"}`);
    console.log(`left alone (already present): ${skipped.join(", ") || "(none)"}`);
    return;
  }
  console.log(
    `axis agent cards: wrote ${written.length}, left ${skipped.length} alone (already present)` +
      (written.length ? ` — ${written.join(", ")}` : ""),
  );
}

main();
