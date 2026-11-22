// SPDX-License-Identifier: MIT
/**
 * Build the public, read-only Council working-group dependency projection.
 * Inputs are already-public registers in this repository. This neither
 * contacts external working groups nor confers review authority.
 *
 * --write: produce deterministic public derived JSON for a reviewed PR.
 * --check: fail if the committed snapshot differs from exact current inputs.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { projectGovernanceSpine } from "./governance-projection.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sourceGroups = resolve(repo, "council-os/working-groups.json");
const sourceCharters = resolve(repo, "packages/charter-federation/sources.json");
const output = resolve(repo, "public/interop/governance-dependency-projection.json");

export function buildPublicGovernanceProjection(groupsBytes, charterSourcesBytes) {
  const source = projectGovernanceSpine({ groupsBytes, charterSourcesBytes });
  return {
    ...source,
    publication: {
      mode: "READ_ONLY_SNAPSHOT",
      historical_bft_evidence_included: false,
      human_authority_binding: "NONE",
      source_review_required: true,
      note: "Links are candidate subject mappings. They are not adopted charters, current axis measurements, authenticated reviewer staffing or authority effects.",
    },
    counts: {
      total_nodes: source.nodes.length,
      total_edges: source.edges.length,
      working_groups: source.nodes.filter(n => n.kind === "COUNCIL_WORKING_GROUP").length,
      gspc_axis_references: source.nodes.filter(n => n.kind === "GSPC_AXIS_REFERENCE").length,
      external_source_references: source.nodes.filter(n => n.kind === "EXTERNAL_REFERENCE").length,
    },
  };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!["--check", "--write"].includes(mode) || process.argv.length !== 3)
    throw new Error("select exactly --check or --write; no implicit mutation");
  const projection = buildPublicGovernanceProjection(readFileSync(sourceGroups), readFileSync(sourceCharters));
  const expected = Buffer.from(JSON.stringify(projection, null, 2) + "\n", "utf8");
  if (mode === "--check") {
    let current;
    try { current = readFileSync(output); } catch { throw new Error("UNVERIFIED: missing governed snapshot"); }
    if (!expected.equals(current)) throw new Error("STALE: governance projection needs an exact-byte reviewed refresh");
    console.log("PASS: public governance dependency projection is source-aligned (" +
      projection.counts.total_nodes + " nodes, " + projection.counts.total_edges + " edges)");
    return;
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, expected);
  console.log("WROTE: reviewed candidate projection (" +
    projection.counts.total_nodes + " nodes, " + projection.counts.total_edges + " edges; no authority effects)");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(String(error.message ?? error)); process.exitCode = 1; }
}
