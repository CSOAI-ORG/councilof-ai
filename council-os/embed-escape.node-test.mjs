import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "public", "embed.js"),
  "utf8",
);
const helpers = src.split("(function ()")[0];
const ctx = {};
vm.runInNewContext(
  helpers + "\nthis.escHtml = escHtml; this.escColor = escColor; this.safeHref = safeHref;",
  ctx,
);

describe("embed.js escapes (shipped public/embed.js)", () => {
  it("escapes HTML in partner strings", () => {
    assert.equal(ctx.escHtml('<img src=x onerror=alert(1)>'), "&lt;img src=x onerror=alert(1)&gt;");
  });
  it("rejects non-hex brand colours", () => {
    assert.equal(ctx.escColor("red;background:url(x)"), "#059669");
    assert.equal(ctx.escColor("#0B3D91"), "#0B3D91");
  });
  it("rejects javascript: verify URLs", () => {
    assert.equal(ctx.safeHref("javascript:alert(1)"), "https://councilof.ai/gspc-verify");
  });
  it("does not assign innerHTML in paint", () => {
    assert.equal(/innerHTML\s*=/.test(src), false);
  });
});
