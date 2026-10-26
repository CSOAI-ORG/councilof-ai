#!/usr/bin/env node
/**
 * build-axis-mcp-tools — generate one free MCP tool per GSPC board axis.
 *
 * WHY. A caller who wants the governance row should be able to see a tool named for it in
 * tools/list, not have to know that `get_axis` exists and what to pass it. One axis, one door.
 *
 * THE SOURCE OF TRUTH. functions/mcp/axis-aliases.json carries the board's axis ids and is
 * pinned: its 33 keys are the live board's 33 declared slots, in the board's own order
 * (functions/mcp/axis-aliases.test.ts holds that against the live board). This script reads
 * that table and never a second list, so the tool family cannot drift from the alias table.
 *
 * WHAT IT DOES NOT DO. It does not measure anything. Each generated tool is the axis by name
 * and returns exactly the live board row for that axis — the same payload get_axis returns,
 * with the axis fixed by the tool's own name. An unmeasured axis answers UNMEASURED, which is
 * a first-class answer, not an error and not a zero.
 *
 * It is idempotent: every axis_* tool is removed and regenerated on each run, so a re-run is
 * a no-op diff.
 *
 *   node scripts/build_axis_mcp_tools.mjs            # rewrite functions/mcp/gspc-tools.json
 *   node scripts/build_axis_mcp_tools.mjs --dry      # print what would change
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./capability-registry.mjs";

const ALIASES = join(REPO, "functions/mcp/axis-aliases.json");
const TOOLS = join(REPO, "functions/mcp/gspc-tools.json");
const DRY = process.argv.includes("--dry");

/** The prefix that marks a generated axis tool. Code identifier, so the axis/axes display
 *  ruling does not apply to it. */
const PREFIX = "axis_";

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));

/** One axis tool. The description is the axis's own name in prose, so a model that reads
 *  tools/list can pick the right tool without a lookup table. */
function axisTool(axis) {
  const title = `${axis} axis (live GSPC board)`;
  return {
    name: `${PREFIX}${axis}`,
    title,
    description:
      `The ${axis} axis of the live GSPC board at https://councilof.ai/api/gspc — this tool IS ` +
      `the axis, so it takes no argument: n, accuracy, interval, MEASURED or UNMEASURED status, ` +
      `family, kind, the bank or run-artifact URL behind the row, and dates. An unmeasured axis ` +
      `is a first-class answer — a declared slot with no run behind it, published so the gap is ` +
      `visible — never an error and never a zero. Never a certification.`,
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "LIVE, NOT_ON_BOARD or UNREACHABLE" },
        axis: { type: ["string", "null"] },
        status: { type: ["string", "null"] },
        measured: { type: "boolean" },
        family: {},
        n: {},
        accuracy: {},
        interval: {},
        leader: {},
        dataset: {},
        source: { type: "string" },
        not_a_certification: { type: "boolean" },
      },
      required: ["state"],
    },
    annotations: {
      title,
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  };
}

function main() {
  const table = readJSON(ALIASES).axes;
  const axes = Object.keys(table);
  if (!axes.length) throw new Error("axis-aliases.json carries no axes — refusing to empty the tool family");

  const doc = readJSON(TOOLS);
  const kept = doc.tools.filter((t) => !String(t.name).startsWith(PREFIX));
  const generated = axes.map(axisTool);

  const before = JSON.stringify(doc.tools.map((t) => t.name));
  doc.tools = [...kept, ...generated];
  const after = JSON.stringify(doc.tools.map((t) => t.name));

  if (DRY) {
    console.log(`would rewrite ${TOOLS}: ${kept.length} -> ${doc.tools.length} tools`);
    console.log(`added: ${generated.map((t) => t.name).join(", ")}`);
    return;
  }
  if (before === after) {
    console.log(`unchanged: ${doc.tools.length} tools`);
    return;
  }
  writeFileSync(TOOLS, JSON.stringify(doc, null, 2) + "\n");
  console.log(`wrote ${TOOLS}: ${kept.length} -> ${doc.tools.length} tools (+${generated.length} axis tools)`);
}

main();
