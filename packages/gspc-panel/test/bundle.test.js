import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(pkg, "../..");

describe("published bundle", () => {
  it("public/panel/gspc-panel.js is the current build and the vendored verifier matches the site's", () => {
    execFileSync(process.execPath, [resolve(pkg, "scripts/build.mjs"), "--check"], { stdio: "pipe" });
  });
  it("is at most 60 KB gzipped, has no eval, and names no host but councilof.ai and the A2UI spec", () => {
    const b = readFileSync(resolve(repo, "public/panel/gspc-panel.js"));
    expect(gzipSync(b, { level: 9 }).length).toBeLessThanOrEqual(60 * 1024);
    const t = b.toString("utf8");
    expect(t).not.toMatch(/\beval\(|new Function|innerHTML/);
    const hosts = new Set((t.match(/https?:\/\/[a-z0-9.-]+/gi) ?? []).map((u) => new URL(u).host));
    // example.com is the RFC 2606 placeholder in the embed snippet; it is text, never fetched (sources.js locks the origin).
    for (const h of hosts) expect(["councilof.ai", "a2ui.org", "example.com"].includes(h) || h.endsWith(".councilof-ai.pages.dev")).toBe(true);
  });
});
