import { describe, expect, it } from "vitest";
import { classifySubject, freeQuestion, matchModels, newestSignedRun, stateMeaning, statTiles, toolTitle, verifyHref } from "./resultCard";

describe("resultCard", () => {
  it("prints only fields the tool returned, at most four, as_of last", () => {
    const tiles = statTiles({
      state: "NOT_MEASURED",
      doctrine: "measurement, not endorsement",
      endpoint: "https://github.com/mcp",
      key: "9bd216a1ce7360312aa62926f2be25690ee0bddab306d4d0a0c38a1736cddb67",
      as_of: "2026-09-30T08:18:22Z",
      n_capsules: 0,
      capsules: [],
      note: "long prose that is never a tile",
    });
    expect(tiles.map((t) => t.label)).toEqual(["Published results", "Capsules", "As of"]);
    expect(tiles[0].value).toBe("0");
    expect(tiles[tiles.length - 1].value).toBe("2026-09-30");
  });

  it("returns no tiles for no output, and never invents one", () => {
    expect(statTiles(null)).toEqual([]);
    expect(statTiles({ state: "UNCHECKABLE", reason: "404" })).toEqual([]);
  });

  it("reads one level into counts when the top level is thin", () => {
    const t = statTiles({ state: "LIVE", separation: { separated: 0, ties: 7, untested: 7 } });
    expect(t.map((x) => `${x.label}=${x.value}`)).toEqual(["Separated=0", "Ties=7", "Untested=7"]);
  });

  it("classifies what a stranger types", () => {
    expect(classifySubject("")).toBe("empty");
    expect(classifySubject("a".repeat(64))).toBe("record");
    expect(classifySubject("https://example.com/mcp")).toBe("server");
    expect(classifySubject("github.com")).toBe("server");
    expect(classifySubject("qwen2.5:7b")).toBe("model");
    expect(classifySubject("llama-3.1-8b")).toBe("model");
    expect(classifySubject("deepseek-r1:8b")).toBe("model");
    expect(freeQuestion("server", "github.com")).toBe("What is measured about github.com?");
    expect(freeQuestion("record", "sha256:" + "b".repeat(64))).toBe("verify " + "b".repeat(64));
    expect(freeQuestion("model", "x")).toBeNull();
  });

  it("matches models exactly first, then by containment", () => {
    const rows = [{ id: "qwen3:8b" }, { id: "qwen3:8b-q4" }, { id: "llama3.1:8b" }];
    expect(matchModels(rows, "qwen3:8b").map((r) => r.id)).toEqual(["qwen3:8b", "qwen3:8b-q4"]);
    expect(matchModels(rows, "x")).toEqual([]);
  });

  it("names tools and states in plain words, and keeps verify links same-origin relative", () => {
    expect(toolTitle("server_evidence")).toBe("What is measured about this server");
    expect(toolTitle("some_new_tool")).toBe("Some new tool");
    expect(stateMeaning("NOT_MEASURED")).toMatch(/not a finding/);
    expect(verifyHref("https://councilof.ai/api/gspc")).toBe("/api/gspc");
    expect(verifyHref("javascript:alert(1)")).toBeNull();
    expect(verifyHref(null)).toBeNull();
  });

  it("dates a model answer from its newest MEASURED signed run, and never guesses one", () => {
    const rows = [
      { id: "a", subject: "qwen3:8b", status: "MEASURED", run_id: "20260922T141918.1Z-x", url: "/c/a.json" },
      { id: "b", subject: "qwen3:8b", status: "MEASURED", run_id: "20260930T010101.1Z-y", url: "/c/b.json" },
      { id: "c", subject: "qwen3:8b", status: "UNMEASURED", run_id: "20261005T000000.1Z-z", url: "/c/c.json" },
      { id: "d", subject: "qwen3:8b", status: "MEASURED", run_id: "not-a-date", url: "/c/d.json" },
      { id: "e", subject: "llama3.2:3b", status: "MEASURED", run_id: "20261006T000000.1Z-w", url: "/c/e.json" },
    ];
    expect(newestSignedRun(rows, "qwen3:8b")).toEqual({ date: "2026-09-30", url: "/c/b.json", id: "b" });
    expect(newestSignedRun(rows, "ollama:qwen3:8b")).toEqual({ date: "2026-09-30", url: "/c/b.json", id: "b" });
    expect(newestSignedRun(rows, "acme-llm-7b")).toBeNull();
    expect(newestSignedRun(null, "qwen3:8b")).toBeNull();
  });
});
