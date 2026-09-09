import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const R = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const J = (path: string) => JSON.parse(R(path));
const DIR = "docs/press/submissions/docker-mcp-registry";

const free = J("functions/mcp/gspc-tools.json").tools.map((tool: { name: string }) => tool.name);
const paid = J("functions/mcp/paid-tools.json").tools.map((tool: { name: string }) => tool.name);

describe("Docker MCP submission draft", () => {
  it("stays an unsubmitted remote entry on the canonical public endpoint", () => {
    const server = R(`${DIR}/server.yaml`);
    expect(server).toContain("DRAFT — NOT SUBMITTED");
    expect(server).toMatch(/^type: remote$/m);
    expect(server).toMatch(/^  transport_type: streamable-http$/m);
    expect(server).toMatch(/^  url: https:\/\/councilof\.ai\/mcp$/m);
    expect(server).toMatch(/^  icon: https:\/\/councilof\.ai\/csoai-icon\.svg$/m);
    expect(server).toContain(`${free.length} free tools and ${paid.length} optional x402-metered evidence tools`);
    expect(server).toContain("Measurement, not certification");
  });

  it("leaves tools.json empty for remote dynamic discovery", () => {
    expect(J(`${DIR}/tools.json`)).toEqual([]);
  });

  it("names every canonical tool and carries the payment boundary", () => {
    const readme = R(`${DIR}/readme.md`);
    for (const name of [...free, ...paid]) {
      expect(readme, name).toContain(`\`${name}\``);
    }
    expect(readme).toContain("Eight free tools");
    expect(readme).toContain("Four optional x402-metered evidence tools");
    expect(readme).toContain("A schema-valid unpaid call returns\n`PAYMENT_REQUIRED`");
    expect(readme).toContain("it is not settlement, delivery or revenue");
    expect(readme).toContain("No tool determines legal compliance or supplies legal advice");
    expect(readme).not.toMatch(/Seven free|seven free|11 tools|eleven tools/);
  });
});
