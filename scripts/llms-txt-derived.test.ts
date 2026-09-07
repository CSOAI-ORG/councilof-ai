import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * scripts/llms-txt.mjs opens "llms.txt / llms-full.txt — DERIVED, never typed", and it was right
 * about seven values and wrong about five. The template typed "11 tools ... seven free readers plus
 * four x402-metered evidence tools", and llms.txt is what AI crawlers read first — so a stale count
 * there propagates further than anywhere else we publish.
 *
 * The door's tool set changed twice this month: witness_hash quarantined on HTTP, then dropped from
 * the packaged manifest. Each change silently aged this file and nothing objected.
 */
const ROOT = resolve(__dirname, "..");
const R = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const J = (p: string) => JSON.parse(R(p));

const free = J("functions/mcp/gspc-tools.json").tools.length;
const paid = J("functions/mcp/paid-tools.json").tools.length;

describe("llms.txt derives the tool counts it publishes", () => {
  it("the template holds placeholders, not numbers", () => {
    const t = R("scripts/llms/llms.txt.tmpl");
    expect(t).toMatch(/\{\{MCP_TOOLS\}\}/);
    expect(t).toMatch(/\{\{MCP_FREE_WORD\}\}/);
    expect(t, "a typed tool count is a number nothing retires")
      .not.toMatch(/—\s*\d+ tools:\s*\w+ free readers/);
  });

  it("the producer names the source of those counts", () => {
    const s = R("scripts/llms-txt.mjs");
    expect(s).toMatch(/functions\/mcp\/gspc-tools\.json/);
    expect(s).toMatch(/functions\/mcp\/paid-tools\.json/);
  });

  it("the published file agrees with the door's own definition files", () => {
    const out = R("public/llms.txt");
    const m = out.match(/POST https:\/\/councilof\.ai\/mcp — (\d+) tools/);
    expect(m, "llms.txt no longer states a door tool count").toBeTruthy();
    expect(Number(m![1]), `door serves ${free}+${paid}`).toBe(free + paid);
  });

  it("the free-tool count in the Smithery line matches too", () => {
    const out = R("public/llms.txt");
    const words = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
    expect(out).toMatch(new RegExp(`exactly the ${words[free]} free tools`));
  });

  it("points at the live catalog-trust snapshot and does not freeze its counts", () => {
    const tmpl = R("scripts/llms/llms.txt.tmpl");
    const out = R("public/llms.txt");
    const url = "https://councilof.ai/interop/x402-trust/latest.json";
    expect(tmpl).toContain(url);
    expect(out).toContain(url);
    expect(tmpl, "template must not freeze the census pair").not.toMatch(/74\/100/);
    expect(out, "published llms.txt must not freeze the census pair").not.toMatch(/74\/100/);
  });

  it("names the paid-step doors without freezing an amount", () => {
    const tmpl = R("scripts/llms/llms.txt.tmpl");
    const out = R("public/llms.txt");
    for (const f of [tmpl, out]) {
      expect(f).toContain("https://councilof.ai/api/eunomia-data?feed=1");
      expect(f).toContain("https://councilof.ai/api/request-attestation?subject=<id>");
      expect(f).toContain("commission_card");
      expect(f).toContain("https://councilof.ai/api/x402-trust-seller");
      expect(f, "amounts belong only in a 402 accepts[]").not.toMatch(/0\.02|\$\d/);
    }
  });

  it("registry version in llms.txt matches the shipped server.json, not a frozen 1.2.0", () => {
    const ver = J("mcp/gspc-server/server.json").version;
    expect(ver).toBe("1.4.0");
    const out = R("public/llms.txt");
    const tmpl = R("scripts/llms/llms.txt.tmpl");
    expect(out).toContain(`(server ${ver} → https://councilof.ai/mcp)`);
    expect(out).toContain(`server **${ver}**`);
    expect(tmpl).toContain(`(server ${ver} → https://councilof.ai/mcp)`);
    expect(tmpl).toContain(`server **${ver}**`);
  });

});
