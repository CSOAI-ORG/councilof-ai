import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");
const html = readFileSync(resolve(root, "spaces/gspc-board/index.html"), "utf8");
const js = readFileSync(resolve(root, "spaces/gspc-board/table.js"), "utf8");
const readme = readFileSync(resolve(root, "spaces/gspc-board/README.md"), "utf8");
const blob = [html, js, readme].join("\n");

describe("gspc-board Space is the living table, not a 1.8KB printer", () => {
  it("hosts the whole living table with yesterday's n-sites desks", () => {
    expect(html).toContain("GSPC living table");
    expect(html).toContain('id="board"');
    expect(html).toContain('id="census"');
    expect(html).toContain('id="two-speed"');
    expect(html).toContain('id="hundred"');
    expect(html).toContain('id="health"');
    expect(html).toContain('id="empty"');
    expect(html).toContain('id="flags"');
    expect(html).toContain('id="watch"');
    expect(js).toContain("https://councilof.ai/api/gspc");
    expect(js).toContain("hub-queue");
    expect(js).toContain("living-catalog");
    expect(js).toContain("Speed 0");
    expect(js).toContain("Speed 1");
    expect(js).toContain("100 unique lineages");
    expect(js).toContain("huggingface");
    expect(js).toContain("openrouter");
    expect(js).toContain("ollama");
    expect(js).toContain("kaggle");
    expect(js).toContain("github");
    expect(js).toContain("reserve-attestation");
    expect(js).toContain("XRPL stays DEVNET");
    expect(readme).toContain("GSPC living table");
    expect(readme).not.toMatch(/board printer/i);
  });

  it("keeps millions as n-sites census and never invents a scored Hub", () => {
    expect(blob).toMatch(/Speed 0 census/);
    expect(blob).toMatch(/DISCOVERED/);
    expect(blob).toMatch(/A rank is never sold/);
    expect(blob).toMatch(/Do not say we scored two million|Claim we scored two million/);
    expect(blob).not.toMatch(/rank for sale|buy a grade|£79|£499|Byzantine|22\/22|dorado|cibola|sovos/i);
    expect(blob).not.toMatch(/hub-queue is MEASURED/);
    expect(js).toContain("Never. Millions are DISCOVERED by census");
    expect(js).toContain("status_all");
  });
});
