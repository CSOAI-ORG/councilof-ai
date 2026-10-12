import { describe, expect, it } from "vitest";
import { MEOK_ENQUIRY_URL, meokBrief } from "./ResultFollowUp";

const tool = (url: string | null, state = "UNCHECKABLE") => ({
  id: "read-1", name: "get_card", argsText: "{}", status: "done" as const,
  label: state, citation: { tool: "get_card", record_id: "native-record-1", url },
});

describe("manual result-to-MEOK enquiry", () => {
  it("retains the asked task and native record state without asserting verification", () => {
    const question = "Prepare an artifact from <literal text> & keep the limits.";
    const brief = meokBrief({ question, tools: [tool("https://councilof.ai/cards/record.json")] });
    expect(brief).toContain(question);
    expect(brief).toContain("Record: native-record-1");
    expect(brief).toContain("state: UNCHECKABLE");
    expect(brief).toContain("Published reference: https://councilof.ai/cards/record.json");
    expect(brief).toContain("not independently verified here");
    expect(brief).toContain("Please agree written scope, quote, delivery and acceptance terms before work starts.");
  });

  it("does not invent missing record identifiers, URLs or states", () => {
    const brief = meokBrief({ question: "Task", tools: [{ id: "t", name: "board_totals", argsText: "{}", status: "done" }] });
    expect(brief).toContain("state: not supplied");
    expect(brief).not.toContain("  Record:");
    expect(brief).not.toContain("  Published reference:");
  });

  it.each([
    "https://private.example/record",
    "https://councilof.ai:8443/record",
    "http://councilof.ai/record",
    "https://councilof.ai.evil.example/record",
    "https://user:password@councilof.ai/record",
    "javascript:alert(1)",
    "/relative-record",
  ])("does not put an unqualified URL in the brief: %s", (url) => {
    const brief = meokBrief({ question: "Task", tools: [tool(url)] });
    expect(brief).not.toContain("  Published reference:");
    expect(brief).toContain("Record: native-record-1");
  });

  it("keeps failure states and distinct native references separate", () => {
    const first = tool("https://councilof.ai/api/gspc", "UNREACHABLE");
    const second = { ...tool(null, "NOT_MEASURED"), id: "read-2", citation: { tool: "get_card", record_id: "native-record-2", url: null } };
    const brief = meokBrief({ question: "Task", tools: [first, second] });
    expect(brief).toContain("state: UNREACHABLE");
    expect(brief).toContain("state: NOT_MEASURED");
    expect(brief).toContain("Record: native-record-1");
    expect(brief).toContain("Record: native-record-2");
  });

  it("opens the existing enquiry without transmitting task or result data in the URL", () => {
    const url = new URL(MEOK_ENQUIRY_URL);
    expect(url.origin + url.pathname).toBe("https://meok.ai/request-job");
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
    expect(url.username).toBe("");
  });
});
