// FAIL-FIRST doctrine test. Written before the renderer; proof of its first red run is in
// test/FAIL-FIRST.md. Two promises, checked on every subject kind and on hostile input:
//   1. UNMEASURED (and UNCHECKABLE) never shows a number: no figures region, and no digit in the
//      state, figures or declared-vs-observed text, even when the model handed in carries figures.
//   2. The attribution "Evidence by GSPC · Council of AI" and an https verify link are always drawn.
import { describe, expect, it } from "vitest";
import { buildModel } from "../src/model.js";
import { makeSources } from "../src/sources.js";
import { viewTree, textOf, region } from "../src/view.js";
import { fromA2ui, toA2ui } from "../src/a2ui.js";
import { verifyCard } from "../src/verify-card.vendored.js";
import { replayFetch } from "./replay.js";

const ATTR = "Evidence by GSPC · Council of AI";

function attrs(node, out = []) {
  if (node && typeof node === "object") {
    out.push(node.attrs);
    node.children.forEach((c) => attrs(c, out));
  }
  return out;
}

function assertAttribution(tree) {
  const foot = region(tree, "attribution");
  expect(foot, "attribution region").toBeTruthy();
  expect(textOf(foot)).toContain(ATTR);
  const verify = attrs(foot).find((a) => "data-verify" in a);
  expect(verify?.href).toMatch(/^https:\/\/councilof\.ai\//);
}

function assertNoNumber(tree) {
  expect(region(tree, "figures")).toBeNull();
  for (const r of ["state", "dvo"]) {
    const node = region(tree, r);
    if (node) expect(textOf(node)).not.toMatch(/\d/);
  }
}

const hostile = (state) => ({
  schema: "csoai.gspc-panel-model/0.1",
  subject: { input: "https://example.org/mcp", kind: "mcp_server" },
  state,
  state_note: null,
  figures: [{ label: "accuracy", value: 0.93 }, { label: "n", value: 412 }],
  declared_vs_observed: { summary: "7 of 9 consistent", rows: [{ dimension: "AUTH", declared: "x", observed: "91%" }] },
  signature: { state: "NOT_CHECKED" },
  corrections: [],
  attribution: { text: "Powered by Acme", url: "https://acme.example/" },
  verify_url: "javascript:alert(1)",
  sources: [],
});

describe("UNMEASURED never shows a number", () => {
  for (const state of ["UNMEASURED", "UNCHECKABLE"]) {
    it(`hostile ${state} model: figures and counts are dropped`, () => {
      const tree = viewTree(hostile(state));
      assertNoNumber(tree);
      const all = textOf(tree);
      expect(all).not.toContain("0.93");
      expect(all).not.toContain("412");
      expect(all).not.toContain("91%");
    });
  }

  it("live NOT_MEASURED server (councilof.ai/mcp/free, recorded) renders no number", async () => {
    const { fetchFn } = replayFetch();
    const m = await buildModel("https://councilof.ai/mcp/free", { sources: makeSources({ fetchFn }), verifyCard });
    expect(m.state).toBe("UNMEASURED");
    assertNoNumber(viewTree(m));
  });

  it("an unknown model id renders UNMEASURED with no number", async () => {
    const { fetchFn } = replayFetch();
    const m = await buildModel("no-such-model:1b", { sources: makeSources({ fetchFn }), verifyCard });
    expect(m.state).toBe("UNMEASURED");
    assertNoNumber(viewTree(m));
  });

  it("a hostile UNMEASURED model relayed through A2UI still renders no number", () => {
    const msgs = toA2ui({ ...hostile("MEASURED") });
    msgs[2].updateDataModel.value.gspc_panel.state = "UNMEASURED";
    msgs[2].updateDataModel.value.gspc_panel.figures = [{ label: "accuracy", value: 0.93 }];
    assertNoNumber(viewTree(fromA2ui(msgs)));
  });
});

describe("attribution is always drawn", () => {
  const subjects = [
    "https://councilof.ai/mcp",
    "https://tandem.ac/mcp",
    "https://councilof.ai/mcp/free",
    "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1",
    "llama3.2:3b",
    "no-such-model:1b",
    "claimreg-hiring-platforms-2026-09-24-rev2",
    "",
    "not a subject <b>",
  ];
  for (const s of subjects)
    it(`subject ${JSON.stringify(s)}`, async () => {
      const { fetchFn } = replayFetch();
      const m = await buildModel(s, { sources: makeSources({ fetchFn }), verifyCard });
      assertAttribution(viewTree(m));
    });

  it("a host cannot rename or unlink the attribution", () => {
    const tree = viewTree(hostile("MEASURED"));
    assertAttribution(tree);
    expect(textOf(tree)).not.toContain("Powered by Acme");
  });

  it("a refused A2UI surface still carries the attribution", () => {
    assertAttribution(viewTree(fromA2ui([{ version: "v0.9.1", createSurface: { surfaceId: "shop", catalogId: "x" } }])));
  });
});

describe("no verdict vocabulary", () => {
  it("no rendered subject uses verdict, ranking or price words", async () => {
    const { fetchFn } = replayFetch();
    for (const s of ["https://councilof.ai/mcp", "https://env.agentlookups.ai/mcp", "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1", "llama3.2:3b", "claimreg-hiring-platforms-2026-09-24-rev2"]) {
      const text = textOf(viewTree(await buildModel(s, { sources: makeSources({ fetchFn }), verifyCard })));
      expect(text).not.toMatch(/\b(certified|compliant|non-compliant|best|leader|winner|ranked|top-rated|safe to use)\b|\$\s?\d/i);
    }
  });
});
