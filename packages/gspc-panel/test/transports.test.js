import { describe, expect, it } from "vitest";
import { buildModel } from "../src/model.js";
import { makeSources } from "../src/sources.js";
import { A2UI, fromA2ui, parseJsonl, toA2ui, toJsonl } from "../src/a2ui.js";
import { modelFromAgui, parseSse, toolResults } from "../src/agui.js";
import { verifyCard } from "../src/verify-card.vendored.js";
import { fx, replayFetch } from "./replay.js";

const CARD = "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1";
const direct = async (s) => buildModel(s, { sources: makeSources({ fetchFn: replayFetch().fetchFn }), verifyCard });

describe("A2UI v0.9.1 out", () => {
  it("is three messages on the basic catalog, every child id resolves, every binding is a JSON Pointer", async () => {
    const msgs = toA2ui(await direct("https://councilof.ai/mcp"));
    expect(msgs.map((m) => Object.keys(m).find((k) => k !== "version"))).toEqual(["createSurface", "updateComponents", "updateDataModel"]);
    expect(msgs.every((m) => m.version === "v0.9.1")).toBe(true);
    expect(msgs[0].createSurface.catalogId).toBe(A2UI.catalogId);
    const comps = msgs[1].updateComponents.components;
    const ids = new Set(comps.map((c) => c.id));
    expect(ids.size).toBe(comps.length);
    expect(ids.has("root")).toBe(true);
    for (const c of comps) {
      expect(["Card", "Column", "Text", "Divider"]).toContain(c.component);
      for (const ch of [c.child, ...(c.children ?? [])].filter(Boolean)) expect(ids.has(ch)).toBe(true);
      if (c.component === "Text") expect(c.text.path).toMatch(/^\//);
    }
    expect(msgs[2].updateDataModel.value.attribution_line).toContain("Evidence by GSPC · Council of AI");
  });

  it("round-trips through JSONL; the relayed copy says it was not re-checked here", async () => {
    const m = await direct("https://tandem.ac/mcp");
    const back = fromA2ui(toJsonl(toA2ui(m)));
    expect(back.state).toBe(m.state);
    expect(back.figures).toEqual(m.figures);
    expect(back.signature.state).toBe(m.signature.state);
    expect(back.signature.where).toContain("not re-checked here");
  });
});

describe("A2UI in", () => {
  it("accepts the verify surface councilof.ai itself serves (recorded /api/a2ui/verify)", () => {
    const m = fromA2ui(fx("a2ui-verify.jsonl"));
    expect(m.subject.input).toBe(CARD);
    expect(m.signature.state).toBe("VALID");
  });
  it("refuses a surface that carries no GSPC evidence", () => {
    const m = fromA2ui([
      { version: "v0.9.1", createSurface: { surfaceId: "promo", catalogId: A2UI.catalogId } },
      { version: "v0.9.1", updateDataModel: { surfaceId: "promo", path: "/", value: { headline: "Rated #1" } } },
    ]);
    expect(m.state).toBe("UNCHECKABLE");
    expect(JSON.stringify(m)).not.toContain("Rated #1");
  });
  it("refuses the v1.0 release candidate", () => {
    expect(fromA2ui([{ version: "v1.0", createSurface: { surfaceId: "gspc_panel", catalogId: "x" } }]).state_note).toContain("v1.0");
  });
  it("refuses malformed JSONL", () => expect(fromA2ui("{not json").state).toBe("UNCHECKABLE"));
});

describe("AG-UI in (recorded POST /api/agui/run streams)", () => {
  it("parses the event sequence", () => {
    const ev = parseSse(fx("agui-tandem.sse"));
    expect(ev[0].data.type).toBe("RUN_STARTED");
    expect(ev[ev.length - 1].data.type).toBe("RUN_FINISHED");
    expect(toolResults(ev).map((r) => r.tool)).toEqual(["server_evidence", "mcp_trust"]);
  });
  it("builds the same model from the stream as from the direct reads, without re-calling server_evidence", async () => {
    const r = replayFetch();
    const m = await modelFromAgui(fx("agui-tandem.sse"), { sources: makeSources({ fetchFn: r.fetchFn }), verifyCard });
    const d = await direct("https://tandem.ac/mcp");
    expect(m.state).toBe(d.state);
    expect(m.declared_vs_observed).toEqual(d.declared_vs_observed);
    expect(r.calls.filter((c) => c.method === "POST").length).toBe(1); // verify_capsule only
  });
  it("a card run from the stream still verifies the signature in-process", async () => {
    const m = await modelFromAgui(fx("agui-card.sse"), { sources: makeSources({ fetchFn: replayFetch().fetchFn }), verifyCard });
    expect(m.signature.state).toBe("VALID");
    expect(m.signature.where).toContain("in this browser");
  });
});

describe("sources", () => {
  it("refuses every origin but councilof.ai and its Pages previews", () => {
    expect(() => makeSources({ origin: "https://evil.example", fetchFn: fetch })).toThrow(/councilof.ai only/);
    expect(() => makeSources({ origin: "http://councilof.ai", fetchFn: fetch })).toThrow();
    expect(() => makeSources({ origin: "https://abc123.councilof-ai.pages.dev", fetchFn: fetch })).not.toThrow();
  });
  it("JSONL helper parses what it writes", () => {
    expect(parseJsonl(toJsonl([{ a: 1 }, { b: 2 }]))).toEqual([{ a: 1 }, { b: 2 }]);
  });
});
