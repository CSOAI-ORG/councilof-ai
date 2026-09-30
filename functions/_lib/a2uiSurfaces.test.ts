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
