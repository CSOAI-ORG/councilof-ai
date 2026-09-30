import { describe, expect, it } from "vitest";
import { buildModel, enforceDoctrine } from "../src/model.js";
import { makeSources } from "../src/sources.js";
import { classifySubject } from "../src/subject.js";
import { verifyCard } from "../src/verify-card.vendored.js";
import { fx, replayFetch } from "./replay.js";

const CARD = "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1";
const run = async (s, opts) => {
  const r = replayFetch(opts);
  const m = await buildModel(s, { sources: makeSources({ fetchFn: r.fetchFn }), verifyCard });
  return { m, calls: r.calls };
};

describe("classifySubject", () => {
  it.each([
    ["https://councilof.ai/mcp", "mcp_server"],
    ["https://example.com/.well-known/agent-card.json", "agent_card"],
    [CARD, "card"],
    [CARD.toUpperCase(), "card"],
    ["claimreg-ondo-chainlink-2026-09-22-rev2", "claim"],
    ["llama3.2:3b", "model"],
    ["", "none"],
    ["a b <c>", "invalid"],
  ])("%s -> %s", (s, k) => expect(classifySubject(s).kind).toBe(k));
});

describe("MCP server subjects (recorded live 2026-09-30)", () => {
  it("our own server: MEASURED, 4 capsules, all CONSISTENT, signature VALID via verify_capsule", async () => {
    const { m, calls } = await run("https://councilof.ai/mcp");
    expect(m.state).toBe("MEASURED");
    expect(m.declared_vs_observed.rows).toHaveLength(4);
    expect(m.declared_vs_observed.rows.every((r) => r.observed === "CONSISTENT")).toBe(true);
    expect(m.declared_vs_observed.rows.map((r) => r.dimension)).toContain("AUTH");
    expect(m.signature.state).toBe("VALID");
    expect(m.signature.where).toContain("in this browser");
    expect(m.signature.key).toBe("did:web:csoai.org#board-attestation-1");
    expect(calls.some((c) => c.url.endsWith("/mcp/free"))).toBe(false); // the browser path never POSTs the MCP door
    expect(m.last_measured).toMatch(/^2026-/);
    expect(m.next_recheck).toBeNull();
    expect(m.citation).toContain("Evidence by GSPC · Council of AI");
    expect(calls.every((c) => c.url.startsWith("https://councilof.ai/"))).toBe(true);
  });

  it("a third-party server from the effect-binding probe: MEASURED", async () => {
    const { m } = await run("https://tandem.ac/mcp");
    expect(m.state).toBe("MEASURED");
    expect(m.figures).toEqual([{ label: "Published capsules", value: 1 }]);
  });

  it("an INCONSISTENT server shows the disagreement as observed, with no verdict", async () => {
    const { m } = await run("https://env.agentlookups.ai/mcp");
    expect(m.declared_vs_observed.rows.map((r) => r.observed)).toContain("INCONSISTENT");
    expect(m.declared_vs_observed.summary).toContain("not which one is true");
  });

  it("an endpoint with no capsule is UNMEASURED and has nothing to verify", async () => {
    const { m } = await run("https://councilof.ai/mcp/free");
    expect(m.state).toBe("UNMEASURED");
    expect(m.figures).toEqual([]);
    expect(m.signature.state).toBe("NOTHING_TO_VERIFY");
  });

  it("server_evidence unreachable -> UNCHECKABLE, never a cached number", async () => {
    const { m } = await run("https://councilof.ai/mcp", { overrides: { "GET /measurement-capsules/latest.json": () => new Response("upstream", { status: 502 }) } });
    expect(m.state).toBe("UNCHECKABLE");
    expect(m.figures).toEqual([]);
  });
});

describe("signed card subject", () => {
  it("verifies in-process with the vendored verify-card.mjs, and the board axis TIE is shown as TIE", async () => {
    const { m } = await run(CARD);
    expect(m.signature.state).toBe("VALID");
    expect(m.signature.where).toContain("in this browser");
    expect(m.state).toBe("TIE"); // gspc-governance -> board axis governance, separation TIE (recorded /api/gspc)
    expect(m.figures.find((f) => f.label === "Accuracy (as signed)").value).toBe(0.3684);
    expect(m.figures.find((f) => f.label === "n").value).toBe("not in the card");
  });

  it("a card altered after signing is INVALID and shows no figure", async () => {
    const card = JSON.parse(fx("card-llama.json"));
    card.body.accuracy = 0.99;
    const { m } = await run(CARD, { overrides: { [`GET /signed/cards/${CARD}.json`]: () => Response.json(card) } });
    expect(m.signature.state).toBe("INVALID");
    expect(m.state).toBe("UNCHECKABLE");
    expect(m.figures).toEqual([]);
  });
});

describe("model and claim subjects", () => {
  it("llama3.2:3b is MEASURED from the measured-models list; that list is labelled unsigned", async () => {
    const { m } = await run("llama3.2:3b");
    expect(m.state).toBe("MEASURED");
    expect(m.figures[0]).toEqual({ label: "Signed cards counted", value: 24 });
    expect(m.signature.state).toBe("UNSIGNED_INDEX");
  });

  it("a claim registry reads its next re-check from the claim-maintenance ledger", async () => {
    const { m } = await run("claimreg-hiring-platforms-2026-09-24-rev2");
    expect(m.next_recheck).toBe("2026-10-01");
    expect(m.state).toBe("UNMEASURED"); // no completed check yet for this registry in the recorded ledger
    expect(m.signature.state).toBe("VALID");
  });
});

describe("enforceDoctrine", () => {
  it("unknown state -> UNCHECKABLE", () => {
    expect(enforceDoctrine({ subject: { input: "x", kind: "model" }, state: "GREAT", figures: [], declared_vs_observed: {}, signature: {}, corrections: [] }).state).toBe("UNCHECKABLE");
  });
});
