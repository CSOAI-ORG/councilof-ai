// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { exportColiseum } from "./build-coliseum-mirror.mjs";
let root: string, build: string, out: string;
const commit = "a".repeat(40);
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "coliseum-export-"));
  build = path.join(root, "served"); out = path.join(root, "mirror");
  await mkdir(path.join(build, ".vite"), { recursive: true });
  await mkdir(path.join(build, "assets"), { recursive: true });
  await writeFile(path.join(root, "LICENSE"), "MIT fixture notice");
  await writeFile(path.join(build, ".vite/manifest.json"), JSON.stringify({
    "hf-coliseum.html": { src: "hf-coliseum.html", isEntry: true, file: "assets/game.js", css: ["assets/game.css"], imports: ["shared"] },
    shared: { file: "assets/shared.js" },
    private: { file: "assets/private-evidence.json" },
  }));
  await writeFile(path.join(build, "hf-coliseum.html"), '<script type="module" src="/assets/game.js"></script><link rel="stylesheet" href="/assets/game.css">');
  await writeFile(path.join(build, "index.html"), "Council main");
  await writeFile(path.join(build, "assets/game.js"), "import './shared.js';");
  await writeFile(path.join(build, "assets/shared.js"), "export const game = 1;");
  await writeFile(path.join(build, "assets/game.css"), "body{color:white}");
  await writeFile(path.join(build, "assets/private-evidence.json"), "must never be exported");
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
const options = () => ({ buildDir: build, outputDir: out, licensePath: path.join(root, "LICENSE"), sourceCommit: commit });

describe("same-build Coliseum artifact", () => {
  it("exports only the complete dependency closure with identical bytes and hashes", async () => {
    const manifest = await exportColiseum(options());
    expect(manifest.source_commit).toBe(commit);
    for (const [file, hash] of Object.entries(manifest.files)) {
      const bytes = await readFile(path.join(out, file));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(hash);
      if (file.startsWith("assets/")) expect(bytes).toEqual(await readFile(path.join(build, file)));
    }
    expect(Object.keys(manifest.files)).not.toContain("assets/private-evidence.json");
    await expect(access(path.join(build, "hf-coliseum.html"))).rejects.toThrow();
    expect(await readFile(path.join(build, "index.html"), "utf8")).toBe("Council main");
    expect(await readFile(path.join(out, "README.md"), "utf8")).toContain(commit);
  });
  it("fails closed on an incomplete dependency and preserves an existing artifact", async () => {
    await mkdir(out); await writeFile(path.join(out, "retained.txt"), "retained");
    await rm(path.join(build, "assets/shared.js"));
    await expect(exportColiseum(options())).rejects.toThrow();
    expect(await readFile(path.join(out, "retained.txt"), "utf8")).toBe("retained");
    await access(path.join(build, "hf-coliseum.html"));
  });
  it("refuses traversal, unsafe destinations and unqualified source revisions", async () => {
    await expect(exportColiseum({ ...options(), outputDir: build })).rejects.toThrow();
    await expect(exportColiseum({ ...options(), sourceCommit: "master" })).rejects.toThrow();
    const p = path.join(build, ".vite/manifest.json");
    const manifest = JSON.parse(await readFile(p, "utf8"));
    manifest.shared.file = "../private.json"; await writeFile(p, JSON.stringify(manifest));
    await expect(exportColiseum(options())).rejects.toThrow("Unsafe");
  });
  it("requires bundled font assets rather than copying the public or private tree", async () => {
    await writeFile(path.join(build, "assets/game.css"), 'body{background:url("/private/report.json")}');
    await expect(exportColiseum(options())).rejects.toThrow("Unqualified");
  });
});
