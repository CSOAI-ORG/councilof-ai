#!/usr/bin/env node

import "dotenv/config";
import { program } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import { Town } from "./town.js";
import type { SimulationResult, Scenario } from "./types.js";

program
  .name("sov-town")
  .description("SOV Town — governance by simulation")
  .version("0.1.0")
  .option("--scenario <path>", "Path to scenario JSON file")
  .option("--agents <n>", "Number of agents", "47")
  .option("--ticks <n>", "Simulation ticks", "24")
  .option("--format <format>", "Output format: summary, json, csv", "summary")
  .option("--out <path>", "Write output to file")
  .parse();

const options = program.opts();

let scenario: Scenario = {
  id: "default",
  name: "Default governance simulation",
  description: "A baseline run with mixed industry agents.",
  frameworks: ["EU AI Act", "DORA"],
  agentCount: parseInt(options.agents, 10),
  ticks: parseInt(options.ticks, 10),
  rules: [],
};

if (options.scenario) {
  const raw = readFileSync(options.scenario, "utf-8");
  const parsed = JSON.parse(raw) as Scenario;
  scenario = { ...scenario, ...parsed };
}

function toCsv(result: SimulationResult): string {
  const rows = result.agents.map((agent) => ({
    agentId: agent.id,
    name: agent.name,
    industry: agent.industry,
    role: agent.role,
    riskScore: agent.complianceProfile.riskScore,
    violations: agent.complianceProfile.violations.length,
  }));
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String((r as Record<string, unknown>)[h]).replace(/"/g, '""')}"`).join(","))];
  return lines.join("\n");
}

async function main() {
  const town = new Town(scenario);
  town.spawnAgents(scenario.agentCount);
  const result = await town.run();

  let output = "";
  if (options.format === "json") {
    output = JSON.stringify(result, null, 2);
  } else if (options.format === "csv") {
    output = toCsv(result);
  } else {
    output = JSON.stringify(result.summary, null, 2);
    output += `\n\nGenerated ${result.attestations.length} attestations.`;
    output += `\nTotal violations: ${result.violations.length}`;
  }

  if (options.out) {
    writeFileSync(options.out, output, "utf-8");
    console.log(`Output written to ${options.out}`);
  } else {
    console.log(output);
  }
}

main().catch((error) => {
  console.error("Simulation failed:", error);
  process.exit(1);
});
