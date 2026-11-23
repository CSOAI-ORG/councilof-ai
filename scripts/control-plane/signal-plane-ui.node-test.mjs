// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const clientSource = readFileSync(new URL("../../public/interop/living-signal-plane.js", import.meta.url), "utf8");
const graph = JSON.parse(readFileSync(new URL("../../public/interop/governance-dependency-projection.json", import.meta.url)));
const dates = JSON.parse(readFileSync(new URL("../../public/interop/regulatory-window-research-20261122.json", import.meta.url)));
const researchPack = JSON.parse(readFileSync(new URL("../../public/working-groups/controlai.json", import.meta.url)));
class FrozenDate extends Date {
  constructor(...args) { super(...(args.length ? args : ["2026-11-23T00:00:00Z"])); }
  static now() { return Date.parse("2026-11-23T00:00:00Z"); }
}
const fixtures = {
  "/api/gspc": { totals: { axes: 34, measured_axes: 34, public_count: "34 axes · 34 measured", separation_public_count: "0 of 14 model-comparison axes separated a leader" } },
  "/interop/regulatory-inventory-latest.json": { schema: "csoai.regulatory-inventory-pointer/1", versioned_at: "2026-10-26T03:37:48.681Z", crosswalk_assets: 26 },
  "/working-groups/catalog.json": { documents: [{ status: "draft" }, { status: "draft" }], asOf: "2026-10-30" },
  "/interop/governance-dependency-projection.json": graph,
  "/interop/regulatory-window-research-20261122.json": dates,
  "/working-groups/controlai.json": researchPack,
};
function domNode() {
  return { textContent: "", children: [], className: "", listeners: {},
    appendChild(child) { this.children.push(child); return child; },
    replaceChildren() { this.children = []; },
    addEventListener(name,fn) { this.listeners[name] = fn; },
  };
}
async function render(overrides = {}) {
  const elements = new Map();
  const listeners = new Map();
  const requests = [];
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, domNode());
      return elements.get(id);
    },
    createElement() { return domNode(); },
    addEventListener(name, fn) { listeners.set(name, fn); },
  };
  const fetch = async (path) => {
    if (!path.startsWith("/")) throw new Error("unexpected network destination");
    requests.push(path);
    const value = Object.hasOwn(overrides, path) ? overrides[path] : fixtures[path];
    return {
      ok: value !== null && value !== undefined,
      status: value === null || value === undefined ? 503 : 200,
      async json() { return value; },
    };
  };
  runInNewContext(clientSource, { document, fetch, Date: FrozenDate, Promise }, { timeout: 1000 });
  assert.equal(typeof listeners.get("DOMContentLoaded"), "function");
  listeners.get("DOMContentLoaded")();
  await new Promise(resolve => setImmediate(resolve));
  return { elements, requests, get:(id) => elements.get(id)?.textContent ?? "" };
}
test("Signal Desk renders source-bound ontology and dated measurement state", async () => {
  const r = await render();
  assert.equal(r.get("graph"), graph.counts.total_nodes + " nodes · " + graph.counts.total_edges + " links");
  assert.match(r.get("graph-note"), /candidate mappings/i);
  assert.equal(r.get("gspc"), "34 axes · 34 measured");
  assert.equal(r.get("groups"), "2 draft proposals");
  const sourceDue = researchPack.reviewAfter <= "2026-11-23" ||
    researchPack.claims.some(c => ["source-reported", "observed"].includes(c.status) && c.reviewAfter <= "2026-11-23");
  assert.equal(r.get("research"), sourceDue ? "RECHECK REQUIRED" : "REVIEW WINDOW ACTIVE");
  assert.match(r.get("research-note"), /4 active claims require recheck/);
  assert.match(r.get("research-note"), /no human approval inferred/);
  assert.equal(r.elements.get("windows").children.length, dates.windows.length);
  assert(r.requests.includes("/interop/governance-dependency-projection.json"));
});
test("wrong graph count and forged human authority fail closed", async () => {
  const fake = structuredClone(graph);
  fake.controls.human_authority_conferred = true;
  const r = await render({ "/interop/governance-dependency-projection.json": fake });
  assert.equal(r.get("graph"), "UNVERIFIED");
  assert.match(r.get("graph-note"), /cannot be verified/);
  const tampered = structuredClone(graph);
  tampered.counts.total_edges += 1;
  const r2 = await render({ "/interop/governance-dependency-projection.json": tampered });
  assert.equal(r2.get("graph"), "UNVERIFIED");
});
test("reader failure stays UNVERIFIED without claiming origin outage", async () => {
  const r = await render({ "/interop/governance-dependency-projection.json": null });
  assert.equal(r.get("graph"), "UNVERIFIED");
  assert.equal(r.get("gspc"), "34 axes · 34 measured");
});

// The Corrections pane is a top-level CouncilOS destination, not a subheading.
test("Corrections workspace carries a semantic primary heading", () => {
  const source = readFileSync(new URL("../../client/src/components/gspc/CorrectionsPane.tsx", import.meta.url), "utf8");
  assert.match(source, /<h1\b[^>]*>Published corrections and changes<\/h1>/);
});

test("an expired review deadline stays visible even when current source data advances", async () => {
  const expired = structuredClone(researchPack);
  expired.reviewAfter = "2026-11-23";
  expired.claims.forEach(c => {if (c.status === "source-reported" || c.status === "observed") c.reviewAfter = "2026-11-23";});
  const r = await render({"/working-groups/controlai.json":expired});
  assert.equal(r.get("research"), "RECHECK REQUIRED");
  assert.match(r.get("research-note"), /4 of 4 active claims require recheck/);
});

test("working-group research only advances through explicit dated source review", async () => {
  const future=structuredClone(researchPack);
  future.reviewAfter="2026-12-01";
  future.claims.forEach(c=>{if(c.status==="source-reported"||c.status==="observed") c.reviewAfter="2026-12-01";});
  const r=await render({"/working-groups/controlai.json":future});
  assert.equal(r.get("research"),"REVIEW WINDOW ACTIVE");
  assert.match(r.get("research-note"), /no human approval inferred/);
  const forged=structuredClone(researchPack); forged.authorityGranted=true;
  const bad=await render({"/working-groups/controlai.json":forged});
  assert.equal(bad.get("research"),"UNVERIFIED");
});
test("missing working-group research is UNVERIFIED, never implicitly renewed", async () => {
  const r=await render({"/working-groups/controlai.json":null});
  assert.equal(r.get("research"),"UNVERIFIED");
  assert.match(r.get("research-note"), /no renewal assumed/);
});
