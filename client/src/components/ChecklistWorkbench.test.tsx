// @vitest-environment jsdom
/**
 * ChecklistWorkbench — the in-browser fetch/tick/seal flow (U1, 2026-11-03).
 *
 * The invariants the tests hold:
 *   1. THE CHECKLIST COMES FROM THE DOOR — the component calls the same framework_readiness tool
 *      the MCP/A2A doors serve; the answer document is built from what the door returned.
 *   2. THE SEAL IS /api/sign's, described honestly — "saw exactly these bytes" language, never a
 *      compliance or certification claim, on the component face AND in the sealed state.
 *   3. THE ANSWER DOCUMENT carries the schema id, the answers array and not_a_certification.
 *   4. FAILURE SAYS SO — a door error or a failed seal renders words, never invented content.
 *
 * Rendered with createRoot + act, the house pattern (no testing-library dependency).
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChecklistWorkbench, { buildAnswerDocument } from "./ChecklistWorkbench";
import { RECEIPTS_KEY } from "@/lib/toolReceipts";

const doorChecklist = {
  state: "OK",
  framework: "dora",
  framework_label: "DORA (Regulation (EU) 2022/2554)",
  header: "a readiness checklist; it does not certify compliance",
  item_count: 2,
  items: [
    { id: "dora-1", provision: "Articles 5-6", requirement: "Documented ICT risk framework.", opens_question: "Who owns it?" },
    { id: "dora-2", provision: "Articles 17-23", requirement: "Classify and report incidents.", opens_question: "Could you report in hours?" },
  ],
  not_a_certification: true,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- vi.fn()'s overloaded mock type is not callable in TS; tests call it directly
let callTool: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same mock type, same reason
let sealArtifact: any;

vi.mock("@/lib/sovTools", () => ({
  callTool: (...a: unknown[]) => callTool(...a),
  sealArtifact: (...a: unknown[]) => sealArtifact(...a),
  READINESS_TOOL_NAMES: new Set(["framework_readiness"]),
}));

let root: Root;
let container: HTMLElement;
const $ = (id: string) => container.querySelector(`[data-testid="${id}"]`);

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  callTool = vi.fn();
  sealArtifact = vi.fn();
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  localStorage.clear();
  vi.clearAllMocks();
});

function mockDoor(ok: boolean) {
  callTool.mockImplementation(async () =>
    ok
      ? {
          ok: true,
          state: "runtime_observed",
          text: "checklist",
          raw: { result: { structuredContent: doorChecklist, content: [{ type: "text", text: "checklist" }] } },
        }
      : { ok: false, state: "unreachable", text: "door unreachable", raw: undefined },
  );
}

// jsdom has no fireEvent package here; dispatch events the plain way.
const fire = (el: EventTarget, type: string) => el.dispatchEvent(new Event(type, { bubbles: true }));

describe("ChecklistWorkbench", () => {
  it("fetches the checklist from the door, renders items, honest face copy present", async () => {
    mockDoor(true);
    await act(async () => root.render(<ChecklistWorkbench framework="dora" />));
    await act(async () => {
      fire($("cwb-load") as HTMLElement, "click");
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect($("cwb-header"), "the door's checklist is rendered").toBeTruthy();
    expect(container.textContent).toContain("2 items");
    expect(container.textContent).toContain("Articles 5-6");
    expect(container.textContent).toContain("measures nothing about your compliance and certifies nothing");
    expect(callTool).toHaveBeenCalledWith("framework_readiness", { framework: "dora" });
  });

  it("buildAnswerDocument: schema id, per-item answers, not_a_certification", () => {
    const items = doorChecklist.items;
    const doc = buildAnswerDocument("dora", items, new Set(["dora-1"]), "2026-11-03T00:00:00Z");
    expect(doc.schema).toBe("csoai.readiness-answers/1");
    expect(doc.not_a_certification).toBe(true);
    expect(doc.answered_count).toBe(1);
    expect((doc.answers as unknown[]).length).toBe(2);
    expect((doc.answers as Array<{ id: string; has_evidence: boolean }>)[0]).toEqual({
      id: "dora-1",
      provision: "Articles 5-6",
      has_evidence: true,
    });
  });

  it("a door failure renders words, never invented content", async () => {
    mockDoor(false);
    await act(async () => root.render(<ChecklistWorkbench framework="dora" />));
    await act(async () => {
      fire($("cwb-load") as HTMLElement, "click");
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect($("cwb-error"), "the failure is said in words").toBeTruthy();
    expect(container.textContent).toContain("Nothing invented in its place");
    expect($("cwb-seal")).toBeNull();
  });

  it("sealing posts the answer document and shows the seal with the boundary restated", async () => {
    mockDoor(true);
    sealArtifact.mockResolvedValue({
      ok: true,
      text: "COAI:abcd1234efgh5678\nsig AbCdEf1234567890 · Ed25519 · Layer 0",
    });
    await act(async () => root.render(<ChecklistWorkbench framework="dora" />));
    await act(async () => {
      fire($("cwb-load") as HTMLElement, "click");
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });
    // tick item 1 via its checkbox — native .click() so React's onChange sees a real activation
    const checkbox = ($("cwb-item-dora-1") as HTMLElement).querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => {
      checkbox.click();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).toContain("1 marked");
    await act(async () => {
      ($("cwb-seal") as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect($("cwb-sealed"), "the sealed state renders").toBeTruthy();
    expect(sealArtifact).toHaveBeenCalledTimes(1);
    const sealedMessage = JSON.parse(sealArtifact.mock.calls[0][0] as string);
    expect(sealedMessage.schema).toBe("csoai.readiness-answers/1");
    expect(sealedMessage.answers).toHaveLength(2);
    expect(sealedMessage.answers[0].has_evidence).toBe(true);
    expect(sealedMessage.answers[1].has_evidence).toBe(false);
    expect(container.textContent).toContain("not a measurement of your compliance");
    const receipts = JSON.parse(localStorage.getItem(RECEIPTS_KEY) ?? "[]");
    expect(
      receipts.some((r: { tool: string; outcome: string }) => r.tool.includes("/api/sign") && r.outcome === "SEALED"),
      "the seal lands in the local receipts log",
    ).toBe(true);
  });
});
