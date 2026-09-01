import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DOORS, type DoorId } from "./doors";

const card = readFileSync(resolve(__dirname, "GspcStreamCard.tsx"), "utf8");
const doorsSrc = readFileSync(resolve(__dirname, "doors.ts"), "utf8");
const harness = readFileSync(resolve(__dirname, "OsDoors.tsx"), "utf8");

describe("AG-UI live GSPC stream leftover (1 Sep 2026)", () => {
  it("keeps exactly six DoorIds — no Cobol/Cobalt Bridge door", () => {
    const ids: DoorId[] = ["board", "verify", "cards", "harness", "space", "assess"];
    expect(Object.keys({ board: 1, verify: 1, cards: 1, harness: 1, space: 1, assess: 1 })).toHaveLength(6);
    expect(doorsSrc).toMatch(/six arms only/);
    expect(doorsSrc).toMatch(/Do not add Cobol\/Cobalt Bridge as a door/);
    expect(doorsSrc).not.toMatch(/id:\s*\"cobol\"|id:\s*\"cobalt\"|\"cobol\"\s*\|/);
    expect(DOORS.map((d) => d.id)).toEqual(["board", "verify", "space", "assess", "harness"]);
    expect(ids).toHaveLength(6);
  });

  it("stream card fetches live GSPC + root — never pasted scores", () => {
    expect(card).toContain('fetch("/api/gspc"');
    expect(card).toContain('fetch("/root.json"');
    expect(card).toContain("UNCHECKABLE");
    expect(card).not.toMatch(/22 axis · 15 measured/);
  });

  it("Harness AG-UI panel mounts live stream card + draft-only W3C CG cite", () => {
    expect(harness).toContain("<GspcStreamCard");
    expect(harness).toContain("w3c-agent-conformance-draft");
    expect(harness).toContain("www.w3.org/community/agent-conformance");
    expect(harness).toMatch(/Nick joins/);
    expect(harness).toMatch(/Draft opening only/);
    expect(harness).not.toMatch(/we conform|endorsed by W3C|W3C certified/i);
  });
});
