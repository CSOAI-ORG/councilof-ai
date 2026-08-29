import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(resolve(__dirname, "HomeVerify.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");

describe("homepage is verify, not a coliseum", () => {
  it("ships two sentences plus the verifier", () => {
    expect(home).toMatch(/Check an AI claim in your browser/);
    expect(home).toMatch(/Empty means we have not measured it/);
    expect(home).toContain("<RecordVerifyForm");
    expect(home).not.toContain("LobbyVerifyPane");
    expect(home).not.toMatch(/Emilia|XRPL|coliseum/i);
    expect(home).toContain("data-testid=\"home-verify\"");
    expect(home).not.toContain("OsShell");
    expect(home).not.toContain("/govbench");
    expect(home).not.toMatch(/coliseum|Open Council OS/i);
  });

  it("points builders at gspc in their tool", () => {
    expect(home).toContain("gspc");
    expect(home).toContain("https://councilof.ai/mcp");
    expect(home).toMatch(/Claude, Cursor, Kimi, or Grok/);
    expect(home).toContain("consent first");
    expect(home).not.toMatch(/--trust"/);
  });

  it("App mounts HomeVerify on / and keeps OS off /", () => {
    expect(app).toContain('component={HomeVerify}');
    expect(app).not.toMatch(/path === '\/' \|\| path === '\/os'/);
  });
});
