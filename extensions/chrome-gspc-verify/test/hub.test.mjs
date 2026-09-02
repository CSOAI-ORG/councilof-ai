/** hub.test.mjs — exact-match lookup in the public hub-cards index; absence is UNMEASURED. */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseJsonl, modelIdFromPath, lookup, badgeLabel, INDEX_FILES } from "../lib/hub.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const rows = parseJsonl(readFileSync(path.join(here, "../fixtures/hub-index.sample.jsonl"), "utf8"));

describe("hub index", () => {
  it("parses JSONL and skips bad lines", () => {
    expect(rows.length).toBeGreaterThan(2);
    expect(parseJsonl('{"a":1}\nnot json\n\n{"b":2}\n').length).toBe(2);
  });
  it("sources are the public dataset only", () => {
    for (const u of INDEX_FILES) expect(u.startsWith("https://huggingface.co/datasets/csoai/gspc-hub-cards/")).toBe(true);
  });
  it("model id from a Hub path; reserved first segments are not models", () => {
    expect(modelIdFromPath("/deepseek-ai/DeepSeek-R1")).toBe("deepseek-ai/DeepSeek-R1");
    expect(modelIdFromPath("/Qwen/Qwen3-4B-Instruct-2507/tree/main")).toBe("Qwen/Qwen3-4B-Instruct-2507");
    expect(modelIdFromPath("/datasets/csoai/gspc-hub-cards")).toBeNull();
    expect(modelIdFromPath("/spaces/x/y")).toBeNull();
    expect(modelIdFromPath("/")).toBeNull();
    expect(modelIdFromPath("/models")).toBeNull();
  });
  it("exact, case-insensitive match; a near-miss is absence", () => {
    expect(lookup(rows, "deepseek-ai/DeepSeek-R1").length).toBe(1);
    expect(lookup(rows, "DEEPSEEK-AI/deepseek-r1").length).toBe(1);
    expect(lookup(rows, "deepseek-ai/DeepSeek-R1-Distill").length).toBe(0);
    expect(lookup(rows, null).length).toBe(0);
  });
  it("absence prints UNMEASURED — no signed card; presence names state and axes only", () => {
    expect(badgeLabel([])).toBe("UNMEASURED — no signed card");
    const l = badgeLabel(lookup(rows, "deepseek-ai/DeepSeek-R1"));
    expect(l).toMatch(/^MEASURED — 1 signed card · governance$/);
    expect(l).not.toMatch(/\d\.\d/); // never a score in the badge
  });
});
