import { describe, expect, it } from "vitest";
import {
  A2UI_DEFAULT_VERSION,
  A2UI_SPECS,
  a2uiForTool,
  boardCardSurface,
  pickA2uiVersion,
  surfaceMessages,
  verifyResultSurface,
} from "./a2uiSurfaces";

type J = Record<string, any>;

// Shapes read from the official schemas on 2026-09-30:
// https://a2ui.org/specification/v0_9_1/server_to_client.json (version enum ["v0.9","v0.9.1"];
// createSurface {surfaceId, catalogId, theme?, sendDataModel?}, additionalProperties false) and the
// basic catalogs (v0.9.x Text variant h1..h5|caption|body; v1.0 Text variant caption|body).
const V091_TEXT = new Set(["h1", "h2", "h3", "h4", "h5", "caption", "body"]);
const V10_TEXT = new Set(["caption", "body"]);

function componentsOf(msgs: J[]): J[] {
  return msgs.flatMap((m) => m.updateComponents?.components ?? m.createSurface?.components ?? []);
}

function checkTree(components: J[]) {
  const ids = new Set(components.map((c) => c.id));
  expect(ids.has("root")).toBe(true);
  for (const c of components) {
    expect(typeof c.id).toBe("string");
    expect(typeof c.component).toBe("string");
    for (const child of c.children ?? []) expect(ids.has(child), `${c.id} → ${child}`).toBe(true);
    if (c.child) expect(ids.has(c.child)).toBe(true);
  }
}

const BOARD = {
  state: "LIVE",
  source: "https://councilof.ai/api/gspc",
  as_of: { board_measured_on: "behavioural axes 2026-08-12" },
  public_count: "23 axes · 23 measured",
  separation: { public_count: "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED" },
};
const VERIFY = {
  state: "VALID",
  id: "a".repeat(64),
  reason: null,
  checks: [
    { check: "Card id", ok: true, code: "id_match", detail: "sha256 reproduces" },
    { check: "Signature", ok: true, code: "signature_valid" },
  ],
  resolved_from: { url: "https://councilof.ai/signed/cards/x.json" },
};

describe("A2UI surfaces (board card, verify result)", () => {
  it("defaults to v0.9.1, the current production release, and labels v1.0 Candidate", () => {
    expect(A2UI_DEFAULT_VERSION).toBe("v0.9.1");
    expect(A2UI_SPECS["v0.9.1"].status).toBe("Current");
    expect(A2UI_SPECS["v1.0"].status).toBe("Candidate");
    expect(pickA2uiVersion("1.0")).toBe("v1.0");
    expect(pickA2uiVersion("v0.9.1")).toBe("v0.9.1");
    expect(pickA2uiVersion("banana")).toBe("v0.9.1");
  });

  it("v0.9.1: createSurface carries only surfaceId + catalogId; components and data follow", () => {
    const msgs = surfaceMessages(boardCardSurface(BOARD, "s1"), "v0.9.1");
    expect(msgs.map((m) => Object.keys(m).sort())).toEqual([
      ["createSurface", "version"],
      ["updateComponents", "version"],
      ["updateDataModel", "version"],
    ]);
    for (const m of msgs) expect(["v0.9", "v0.9.1"]).toContain(m.version);
    expect(Object.keys(msgs[0].createSurface).sort()).toEqual(["catalogId", "surfaceId"]);
    expect(msgs[2].updateDataModel.path).toBe("/");
    const comps = componentsOf(msgs);
    checkTree(comps);
    for (const c of comps) if (c.component === "Text" && c.variant) expect(V091_TEXT.has(c.variant)).toBe(true);
  });

  it("v1.0: one createSurface with inline components, Text variants caption|body only", () => {
    const msgs = surfaceMessages(verifyResultSurface(VERIFY, "s2"), "v1.0");
    expect(msgs).toHaveLength(1);
    expect(msgs[0].version).toBe("v1.0");
    const comps = componentsOf(msgs);
    checkTree(comps);
    for (const c of comps) if (c.component === "Text" && c.variant) expect(V10_TEXT.has(c.variant)).toBe(true);
  });

  it("the board card prints the payload's own count and separation line, never a typed one", () => {
    const b = boardCardSurface(BOARD, "s3");
    expect(b.dataModel.public_count).toBe(BOARD.public_count);
    expect(b.dataModel.separation).toBe(BOARD.separation.public_count);
    const empty = boardCardSurface({}, "s4");
    expect(empty.dataModel.public_count).toMatch(/not in the payload/);
    expect(empty.dataModel.state).toBe("PARTIAL");
  });

  // Tools audit, 6 Oct 2026: board_totals output has no axes array, and the surface sent
  // tie_axes: [] and untested_axes: [] beside "7 TIE · 7 UNTESTED".
  it("a payload without axes leaves the per-axis lists unknown (null), never empty", () => {
    const b = boardCardSurface(BOARD, "s7");
    expect(b.dataModel.tie_axes).toBeNull();
    expect(b.dataModel.untested_axes).toBeNull();
    expect(b.dataModel.separation).toMatch(/7 TIE · 7 UNTESTED/);
    const withAxes = boardCardSurface(
      {
        ...BOARD,
        axes: [
          { axis: "safety", kind: "model-comparison", separation: "TIE" },
          { axis: "jail", kind: "model-comparison", separation: "UNTESTED" },
          { axis: "effect-binding", kind: "deterministic-facts", separation: null },
        ],
      },
      "s8",
    );
    expect(withAxes.dataModel.tie_axes).toEqual(["safety"]);
    expect(withAxes.dataModel.untested_axes).toEqual(["jail"]);
  });

  it("a verify result keeps its state and every check; UNCHECKABLE is never upgraded", () => {
    const v = verifyResultSurface(VERIFY, "s5");
    expect(v.dataModel.state).toBe("VALID");
    expect(v.dataModel.checks_total).toBe(2);
    const u = verifyResultSurface({ state: "UNCHECKABLE", reason: "fetch failed" }, "s6");
    expect(u.dataModel.state).toBe("UNCHECKABLE");
    expect(String(u.dataModel.state_line)).not.toMatch(/VALID —/);
  });

  it("renders only board_totals and verify_card in the AG-UI stream, with no banned words", () => {
    expect(a2uiForTool("list_cards", {})).toBeNull();
    const a = a2uiForTool("board_totals", BOARD)!;
    expect(a.version).toBe("v0.9.1");
    expect(a.spec).toBe("https://a2ui.org/specification/v0.9.1-a2ui/");
    expect(JSON.stringify(a)).not.toMatch(/\b(best|safest|certified|leader board)\b/i);
  });
});

// ── Axis card (lane G4, 24 Nov 2026). Board rows below copy the shape of live GET /api/gspc axes. ──
import { axisCardSurface, NOT_PUBLISHED } from "./a2uiSurfaces";

const NOW = Date.parse("2026-11-24T06:00:00Z");
const ORIGIN = "https://councilof.ai";
const CARD = "c".repeat(64);
const AXES = [
  {
    axis: "governance", kind: "model-comparison", n: 237, accuracy: 0.5865, interval: [0.523, 0.647],
    separation: "TIE", separation_sentence: "No model separated from the next best on this axis.",
    measurement_time: { state: "DAY", observed_on: "2026-08-12" },
    leader_card_url: `/signed/cards/${CARD}.json`, leader_card_state: "CARD_RECORDS_A_DIFFERENT_MEASUREMENT",
    dataset_url: "https://huggingface.co/datasets/csoai/gspc-gov",
  },
  { axis: "swarm", kind: "model-comparison", n: 37, accuracy: 0.4444, separation: "UNTESTED", measurement_time: { state: "NOT_AFTER", not_after: "2026-08-19T09:24:39+00:00" } },
  { axis: "effect-binding", kind: "deterministic-facts", n: 261, accuracy: null, separation: null, facts_as_of: "2026-09-22T05:43:05Z", evidence_url: "/interop/x.signed.json" },
  { axis: "machinery-conformity", kind: "model-comparison", n: 33, accuracy: null, separation: "SEPARATED" },
];
const BOARD_AXES = { axes: AXES };
const card = (requested: string | null, board: unknown = BOARD_AXES, readError: string | null = null) =>
  axisCardSurface({ board, requested, origin: ORIGIN, nowMs: NOW, readError }, "ax");
const textOf = (b: ReturnType<typeof card>) => JSON.stringify(b.dataModel);

describe("axis card", () => {
  it("a measured axis shows name, kind, n, accuracy, the board's separation, date, age, address and a verifier button", () => {
    const b = card("governance");
    const m = b.dataModel as J;
    expect(m.name_line).toBe("governance · model-comparison");
    expect(m.result_line).toMatch(/n = 237/);
    expect(m.result_line).toMatch(/accuracy = 0\.5865/);
    expect(m.separation_line).toBe("Separation: TIE");
    expect(m.date_line).toMatch(/2026-08-12 \(day precision\) · age 104 days/);
    expect(m.record_line).toBe(`Record address: ${ORIGIN}/signed/cards/${CARD}.json`);
    expect(m.card_state_line).toMatch(/CARD_RECORDS_A_DIFFERENT_MEASUREMENT/);
    expect(m.source).toBe(`${ORIGIN}/api/gspc`);
    expect(m.as_of).toBe("2026-11-24T06:00:00.000Z");
    const button = b.components.find((c) => c.component === "Button") as J;
    expect(button.action.functionCall).toEqual({ call: "openUrl", args: { url: `${ORIGIN}/api/a2ui/verify?card=${CARD}` } });
    // the same address is also a text line, for a renderer that draws no Button
    expect(m.verifier_line).toBe(`Free verifier for this record: ${ORIGIN}/api/a2ui/verify?card=${CARD}`);
    checkTree(b.components);
    // catalogue only: nothing outside the basic catalogue is used
    for (const c of b.components) expect(["Card", "Column", "Text", "Divider", "Button"]).toContain(c.component);
  });

  it("renders in both versions with valid Text variants", () => {
    const v09 = componentsOf(surfaceMessages(card("governance"), "v0.9.1"));
    for (const c of v09) if (c.component === "Text" && c.variant) expect(V091_TEXT.has(c.variant)).toBe(true);
    const v10 = componentsOf(surfaceMessages(card("governance"), "v1.0"));
    for (const c of v10) if (c.component === "Text" && c.variant) expect(V10_TEXT.has(c.variant)).toBe(true);
  });

  it("an UNTESTED axis stays UNTESTED, an upper-bound date is labelled so, and fields the board lacks read 'not published'", () => {
    const m = card("swarm").dataModel as J;
    expect(m.separation_line).toBe("Separation: UNTESTED");
    expect(m.date_line).toMatch(/not later than this instant/);
    expect(m.record_line).toBe(`Record address: ${NOT_PUBLISHED}`);
    expect(m.data_line).toBe(`Data address: ${NOT_PUBLISHED}`);
    expect(m.verifier_line).toMatch(/not published/);
    expect(m.verify_url).toBeNull();
    expect(card("swarm").components.some((c) => c.component === "Button")).toBe(false);
  });

  it("a TIE is never turned into a win and a missing accuracy is never a zero", () => {
    expect((card("governance").dataModel as J).separation_line).not.toMatch(/SEPARATED/);
    expect(textOf(card("governance"))).not.toMatch(/winner|safest|certified|compliant/i);
    const fact = card("effect-binding").dataModel as J;
    expect(fact.result_line).toMatch(/accuracy = not published/);
    expect(fact.result_line).not.toMatch(/accuracy = 0\b/);
    expect(fact.separation_line).toMatch(/not published/);
    expect(fact.date_line).toMatch(/2026-09-22T05:43:05Z \(exact instant\) · age 63 days/);
    expect(fact.record_line).toBe(`Record address: ${ORIGIN}/interop/x.signed.json`);
    expect((card("machinery-conformity").dataModel as J).date_line).toBe(`Measured: ${NOT_PUBLISHED}`);
  });

  it("an unknown axis name says so and lists the real axes; nothing is invented", () => {
    const b = card("no-such-axis");
    const m = b.dataModel as J;
    expect(m.state).toBe("UNKNOWN_AXIS");
    expect(m.headline).toMatch(/No axis named "no-such-axis"/);
    expect(m.detail).toMatch(/governance, swarm, effect-binding, machinery-conformity/);
    expect(textOf(b)).not.toMatch(/accuracy|n = /);
    checkTree(b.components);
  });

  it("a failed read of the board draws no figure at all", () => {
    for (const b of [card("governance", null, "HTTP 503"), card("governance", { oops: true }), card("governance", "text")]) {
      const m = b.dataModel as J;
      expect(m.state).toBe("READ_FAILED");
      expect(m.headline).toMatch(/no figure is shown/);
      expect(textOf(b)).not.toMatch(/0\.5865|237|TIE/);
      checkTree(b.components);
    }
    expect((card("governance", null, "HTTP 503").dataModel as J).detail).toMatch(/HTTP 503/);
  });

  it("states that it is automated and unreviewed, and carries no banned word", () => {
    const s = JSON.stringify(card("governance"));
    expect(s).toMatch(/no named person has reviewed/);
    expect(s).not.toMatch(/\barena\b|\bunsafe\b|non-compliant/i);
  });
});
