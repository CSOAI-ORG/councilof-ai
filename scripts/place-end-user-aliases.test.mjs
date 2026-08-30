import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, afterEach } from "vitest";
import { run, PERSONAS, VENDORS, LIBRARY_SECTORS } from "./place-end-user-aliases.mjs";

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

  it("does not overwrite a prerendered /for page with HOME", () => {
    const root = mkdtempSync(join(tmpdir(), "aliases-persona-"));
    dirs.push(root);
    const dist = join(root, "dist/client");
    mkdirSync(join(dist, "gspc-scoreboard"), { recursive: true });
    mkdirSync(join(dist, "for/startup"), { recursive: true });
    writeFileSync(join(dist, "index.html"), "<html>HOME</html>");
    writeFileSync(join(dist, "gspc-scoreboard/index.html"), "<html>BOARD</html>");
    writeFileSync(join(dist, "for/startup/index.html"), "<html>STARTUP</html>");

    run(dist);

    expect(readFileSync(join(dist, "for/startup/index.html"), "utf8")).toBe("<html>STARTUP</html>");
  });

  it("places dashboard, login, about, and library sector pretty-URLs", () => {
    const root = mkdtempSync(join(tmpdir(), "aliases-doors-"));
    dirs.push(root);
    const dist = join(root, "dist/client");
    mkdirSync(join(dist, "gspc-scoreboard"), { recursive: true });
    mkdirSync(join(dist, "dashboard"), { recursive: true });
    mkdirSync(join(dist, "login"), { recursive: true });
    mkdirSync(join(dist, "about"), { recursive: true });
    mkdirSync(join(dist, "library/regulation"), { recursive: true });
    writeFileSync(join(dist, "index.html"), "<html>HOME</html>");
    writeFileSync(join(dist, "gspc-scoreboard/index.html"), "<html>BOARD</html>");
    writeFileSync(join(dist, "dashboard/index.html"), "<html>DSH</html>");
    writeFileSync(join(dist, "login/index.html"), "<html>LOGIN</html>");
    writeFileSync(join(dist, "about/index.html"), "<html>ABOUT</html>");
    writeFileSync(join(dist, "library/regulation/index.html"), "<html>REG</html>");

    run(dist);

    expect(existsSync(join(dist, "dashboard.html"))).toBe(true);
    expect(existsSync(join(dist, "login.html"))).toBe(true);
    expect(existsSync(join(dist, "about.html"))).toBe(true);
    expect(existsSync(join(dist, "library/regulation.html"))).toBe(true);
    expect(LIBRARY_SECTORS).toContain("regulation");
  });
});
