/**
 * My results keeps what a lookup actually returned (tools audit, 6 Oct 2026). A server or record
 * lookup was saved before any answer, with no state; My results then searched the paid-request
 * queue for it and said nothing matched.
 */
import { describe, expect, it } from "vitest";
import { lookupAgainHref, lookupFromRun } from "./myResults";

describe("My results — lookups", () => {
  it("saves the first tool's own state word, the record it cited and the question asked", () => {
    const row = lookupFromRun("github.com", {
      question: "What is measured about github.com?",
      status: "done",
      tools: [{ label: "NOT_MEASURED", citation: { record_id: "2026-10-06T00:00:00Z" } }],
    });
    expect(row).toEqual({
      kind: "lookup",
      subject: "github.com",
      question: "What is measured about github.com?",
      state: "NOT_MEASURED",
      ref: "2026-10-06T00:00:00Z",
    });
  });

  it("a run that returned no tool is listed with no state, never a guessed one", () => {
    const row = lookupFromRun("github.com", { question: "What is measured about github.com?", status: "error", tools: [] });
    expect(row).toEqual({ kind: "lookup", subject: "github.com", question: "What is measured about github.com?" });
  });

  it("'Look up again' re-asks the original question, or refills Get results for a model", () => {
    expect(lookupAgainHref({ subject: "github.com", question: "What is measured about github.com?" })).toBe(
      "/dashboard?ask=What%20is%20measured%20about%20github.com%3F",
    );
    expect(lookupAgainHref({ subject: "qwen3:8b" })).toBe("/dashboard?lookup=qwen3%3A8b");
  });
});
