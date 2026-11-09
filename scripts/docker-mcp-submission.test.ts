import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const R = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const J = (path: string) => JSON.parse(R(path));
const DIR = "docs/press/submissions/docker-mcp-registry";

const free = J("functions/mcp/gspc-tools.json").tools.map((tool: { name: string }) => tool.name);
const paid = J("functions/mcp/paid-tools.json").tools.map((tool: { name: string }) => tool.name);

// The readme spells its counts in words. Spell them FROM the canonical counts rather than
// typing them: a typed "Forty-seven free tools" in this test is a typed count, and it
// turns the next legitimate growth of the fleet into a red build — exactly the defect the
// estate repaired in canon.json. The derived word is the only one the readme may carry.
const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function spell(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const unit = n % 10;
  return unit ? `${tens}-${ONES[unit]}` : tens;
}
const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const freeWord = cap(spell(free.length));
const paidWord = cap(spell(paid.length));

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
    expect(readme).toContain(`${freeWord} free tools`);
    expect(readme).toContain(`${paidWord} optional x402-metered evidence tools`);
    expect(readme).toContain("A schema-valid unpaid call returns\n`PAYMENT_REQUIRED`");
    expect(readme).toContain("it is not settlement, delivery or revenue");
    expect(readme).toContain("No tool determines legal compliance or supplies legal advice");
    // The stale-word guard. A readme that still carries a RETIRED spelled count is a
    // published claim about a door that no longer exists, and the count it names is the
    // one a reader will quote. The guard is derived too: every other spelling in the
    // range the counts live in must be absent, so the guard keeps its teeth without
    // naming a number that a legitimate growth would have to edit.
    for (let n = 1; n <= 99; n += 1) {
      if (n === free.length) continue;
      expect(readme, `stale free-tool count ${cap(spell(n))}`).not.toContain(
        `${cap(spell(n))} free tools`,
      );
    }
    for (const stale of ["11 tools", "eleven tools", "10 tools", "ten tools"]) {
      expect(readme, `stale tool count ${stale}`).not.toContain(stale);
    }
  });
});
