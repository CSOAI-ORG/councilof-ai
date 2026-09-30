import { describe, expect, it } from "vitest";
import { applyPatch, newRun, reduceRun } from "./aguiTalk";

describe("aguiTalk — watch-mode events", () => {
  it("frontend tool calls become ui steps, never data tool cards", () => {
    let r = newRun("show me safety", "r1");
    r = reduceRun(r, { type: "TOOL_CALL_START", toolCallId: "ui_1", toolCallName: "openPanel" });
    r = reduceRun(r, { type: "TOOL_CALL_ARGS", toolCallId: "ui_1", delta: '{"id":"board","say":"Opening the live board.",' });
    r = reduceRun(r, { type: "TOOL_CALL_ARGS", toolCallId: "ui_1", delta: '"effect":"view","confirm":false}' });
    r = reduceRun(r, { type: "TOOL_CALL_END", toolCallId: "ui_1" });
    expect(r.tools).toHaveLength(0);
    expect(r.ui[0]).toMatchObject({ tool: "openPanel", args: { id: "board" }, say: "Opening the live board.", effect: "view", confirm: false, ended: true });
  });
  it("a pay step always needs Confirm, whatever the flag says", () => {
    let r = newRun("q", "r2");
    r = reduceRun(r, { type: "TOOL_CALL_START", toolCallId: "ui_1", toolCallName: "highlight" });
    r = reduceRun(r, { type: "TOOL_CALL_ARGS", toolCallId: "ui_1", delta: '{"selector":"x","effect":"pay","confirm":false}' });
    expect(r.ui[0].confirm).toBe(true);
  });
  it("STATE_SNAPSHOT replaces, STATE_DELTA patches", () => {
    let r = newRun("q", "r3");
    r = reduceRun(r, { type: "STATE_SNAPSHOT", snapshot: { watch: { status: "planned", steps: [{ id: "ui_1" }] } } });
    r = reduceRun(r, { type: "STATE_DELTA", delta: [{ op: "replace", path: "/watch/status", value: "handed_to_client" }] });
    expect(r.state).toEqual({ watch: { status: "handed_to_client", steps: [{ id: "ui_1" }] } });
  });
  it("consent_required is recorded, nothing moves", () => {
    const r = reduceRun(newRun("q", "r4"), { type: "CUSTOM", name: "consent_required", value: { intent: "open Connect", steps: 2 } });
    expect(r.consentRequired).toEqual({ intent: "open Connect", steps: 2 });
    expect(r.ui).toHaveLength(0);
  });
  it("applyPatch: add, remove, append, skip unknown paths", () => {
    const d = applyPatch({ a: { b: 1 }, l: [1] }, [
      { op: "add", path: "/a/c", value: 2 },
      { op: "remove", path: "/a/b" },
      { op: "add", path: "/l/-", value: 2 },
      { op: "replace", path: "/missing/x", value: 9 },
    ]);
    expect(d).toEqual({ a: { c: 2 }, l: [1, 2] });
  });
});
