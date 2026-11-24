import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/globe3d.html", import.meta.url), "utf8");
const start = source.indexOf("  window.addEventListener('message', function(ev){");
const end = source.indexOf("\n  if(viewer && Array.isArray(window.__sovBuf))", start);
assert.ok(start >= 0 && end > start, "find current globe listener");
const code = source.slice(start, end);

function makeReceiver(viewer = {}) {
  const calls = [];
  const parent = {};
  const nested = {};
  const host = {
    location: { origin: "https://councilof.ai" },
    parent,
    addEventListener(name, cb) {
      assert.equal(name, "message");
      host.handler = cb;
    },
  };
  runInNewContext(code, { window: host, viewer, handleCmd: (cmd) => calls.push(cmd) });
  return { host, parent, nested, calls };
}

test("the globe accepts only same-origin parent or self navigation messages", () => {
  const x = makeReceiver();
  const cmd = { cmd: "flyTo", lng: -0.12, lat: 51.5 };
  x.host.handler({ origin: "https://evil.example", source: x.parent, data: cmd });
  x.host.handler({ origin: "https://councilof.ai.evil.example", source: x.parent, data: cmd });
  x.host.handler({ origin: "null", source: x.parent, data: cmd });
  x.host.handler({ origin: "https://councilof.ai", source: x.nested, data: cmd });
  x.host.handler({ origin: "https://councilof.ai", source: x.parent, data: { cmd: 42 } });
  assert.equal(x.calls.length, 0);
  x.host.handler({ origin: "https://councilof.ai", source: x.parent, data: cmd });
  x.host.handler({ origin: "https://councilof.ai", source: x.host, data: { cmd: "layer0", nodes: [] } });
  assert.deepEqual(x.calls.map((c) => c.cmd), ["flyTo", "layer0"]);
});

test("trusted early commands may be buffered, but attacker commands are never buffered", () => {
  const x = makeReceiver(null);
  x.host.handler({ origin: "https://evil.example", source: x.parent, data: { cmd: "layer0" } });
  assert.equal(x.host.__sovBuf, undefined);
  x.host.handler({ origin: "https://councilof.ai", source: x.parent, data: { cmd: "layer0", nodes: [] } });
  assert.equal(x.host.__sovBuf?.length, 1);
  assert.equal(x.calls.length, 0);
});
