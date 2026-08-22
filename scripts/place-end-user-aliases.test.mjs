import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, afterEach } from "vitest";
import { run, PERSONAS, VENDORS } from "./place-end-user-aliases.mjs";

const dirs = [];
afterEach(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
  dirs.length = 0;
});

describe("place-end-user-aliases", () => {
  it("writes pretty-URL html + index for verify, board, and a persona", () => {
    const root = mkdtempSync(join(tmpdir(), "aliases-"));
    dirs.push(root);
    const dist = join(root, "dist/client");
    mkdirSync(join(dist, "gspc-scoreboard"), { recursive: true });
    mkdirSync(join(dist, "gspc-verify"), { recursive: true });
    writeFileSync(join(dist, "index.html"), "<html>HOME</html>");
    writeFileSync(join(dist, "gspc-scoreboard/index.html"), "<html>BOARD</html>");
    writeFileSync(join(dist, "gspc-verify/index.html"), "<html>VERIFY</html>");

    run(dist);

    expect(existsSync(join(dist, "gspc.html"))).toBe(true);
    expect(existsSync(join(dist, "gspc-scoreboard.html"))).toBe(true);
    expect(existsSync(join(dist, "verify.html"))).toBe(true);
    expect(existsSync(join(dist, "gspc-verify.html"))).toBe(true);
    expect(existsSync(join(dist, "console.html"))).toBe(true);
    expect(existsSync(join(dist, "for/regulator.html"))).toBe(true);
    expect(existsSync(join(dist, "vs/vanta.html"))).toBe(true);
    expect(PERSONAS).toContain("regulator");
    expect(VENDORS).toContain("vanta");
  });
});
