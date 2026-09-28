import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { prerenderBrowserOptions } from "./prerender-browser.mjs";

test("default retains pinned Chromium", () => {
  assert.deepEqual(prerenderBrowserOptions({}), {});
  assert.deepEqual(prerenderBrowserOptions({ CSOAI_PRERENDER_CHANNEL: "" }), {});
});

for (const channel of ["chrome", "chrome-beta", "msedge", "msedge-beta"]) {
  test(`explicit channel ${channel}`, () => {
    assert.deepEqual(prerenderBrowserOptions({ CSOAI_PRERENDER_CHANNEL: channel }), { channel });
  });
}

for (const channel of ["unknown", "/tmp/browser", "chrome --no-sandbox", " chrome"]) {
  test(`rejects unsupported channel ${channel}`, () => {
    assert.throws(() => prerenderBrowserOptions({ CSOAI_PRERENDER_CHANNEL: channel }));
  });
}

test("both browser launches use the same explicit options", () => {
  const source = readFileSync(new URL("../prerender.mjs", import.meta.url), "utf8");
  assert.equal((source.match(/chromium\.launch\(prerenderBrowserOptions\(\)\)/g) || []).length, 2);
  assert.doesNotMatch(source, /chromium\.launch\(\)/);
});
