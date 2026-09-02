/**
 * manifest.test.mjs — the extension is loadable and its copy is honest.
 * Every file the manifest names exists; no rendered string asserts certification,
 * compliance, the retracted council-size claim, or fault tolerance.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(EXT, "manifest.json"), "utf8"));

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe("manifest", () => {
  it("is Manifest V3 with a popup, a module service worker and a Hub content script", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.action.default_popup).toBe("popup.html");
    expect(manifest.background.type).toBe("module");
    expect(manifest.content_scripts[0].matches).toEqual(["https://huggingface.co/*"]);
  });
  it("names only files that exist", () => {
    const files = [manifest.action.default_popup, manifest.background.service_worker, ...manifest.content_scripts.flatMap((c) => c.js)];
    for (const f of files) expect(existsSync(path.join(EXT, f)), f).toBe(true);
    for (const f of ["lib/cardVerify.mjs", "lib/gspcVerify.mjs", "lib/board.mjs", "lib/hub.mjs", "popup.js", "popup.css", "README.md"]) {
      expect(existsSync(path.join(EXT, f)), f).toBe(true);
    }
  });
  it("asks for only the two hosts it reads and no broad permission", () => {
    expect(manifest.host_permissions.sort()).toEqual(["https://councilof.ai/*", "https://huggingface.co/*"]);
    expect(manifest.permissions).toEqual(["storage"]);
  });
});

describe("honest copy", () => {
  const forbidden = [
    /\bcertified\b/i,
    /\bcompliant\b/i,
    /\b33[\s-]?agent/i,
    /\bBFT\b/,
    /\bbyzantine\b/i,
    /fault[\s-]?toleran/i,
    /\bget certified\b/i,
    /\bwe certify\b/i,
  ];
  const surfaces = walk(EXT).filter((p) => /\.(html|js|mjs|json|md|css)$/.test(p) && !p.includes("/fixtures/") && !p.includes("/test/") && !p.endsWith("cardVerify.mjs"));
  it("no extension surface carries a forbidden claim", () => {
    for (const p of surfaces) {
      const text = readFileSync(p, "utf8");
      for (const re of forbidden) expect(text, `${path.relative(EXT, p)} matches ${re}`).not.toMatch(re);
    }
  });
  it("the popup and manifest say measurement, not certification, and that verify is free", () => {
    const popup = readFileSync(path.join(EXT, "popup.html"), "utf8");
    expect(popup).toMatch(/Measurement, not certification/);
    expect(popup).toMatch(/Verify is free/);
    expect(manifest.description).toMatch(/Measurement, not certification/);
  });
  it("no typed board count anywhere in the popup or content script", () => {
    for (const f of ["popup.html", "popup.js", "content/hf-badge.js"]) {
      const t = readFileSync(path.join(EXT, f), "utf8");
      expect(t, f).not.toMatch(/\b22 (?:axes|axis)\b/);
      expect(t, f).not.toMatch(/\b1[34] (?:measured|quotable)\b/);
    }
  });
});
