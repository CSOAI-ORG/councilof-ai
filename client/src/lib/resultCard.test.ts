import { describe, expect, it } from "vitest";
import {
  READ_MEANING,
  answerSections,
  checkedLine,
  chipFor,
  classifySubject,
  firstSentence,
  freeQuestion,
  matchModels,
  newestSignedRun,
  modelAnchor,
  modelVerifyHref,
  plainAnswer,
  plainDuration,
  stateMeaning,
  statTiles,
  toolTitle,
  verifyHref,
  verifyLink,
  x402Counts,
} from "./resultCard";

const tiles = (tool: string, output: unknown) => statTiles(output, 4, tool).map((t) => `${t.label}=${t.value}${t.hint ? ` (${t.hint})` : ""}`);

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
    // A sentence is a question for the Answers panel, not a model name (tools audit retest).
    expect(classifySubject("Is gpt-4o safe?")).toBe("question");
    expect(classifySubject("which model is best")).toBe("question");
    expect(classifySubject("what does the board say right now")).toBe("question");
    expect(classifySubject("gpt-4o")).toBe("model");
    expect(classifySubject("qwen3 8b")).toBe("model");
    expect(freeQuestion("question", " Is gpt-4o safe? ")).toBe("Is gpt-4o safe?");
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

  it("gives each common tool plain tiles that carry the answer (shapes as the live tools return them, 6 Oct 2026)", () => {
    expect(
      tiles("get_axis", {
        state: "LIVE",
        axis: "safety",
        n: 36,
        accuracy: 0.9444,
        interval: [0.819, 0.985],
        separation: "TIE",
        leader: null,
        top_observed_not_separated: "gemma3:12b (base model)",
      }),
    ).toEqual(["Questions=36", "Best score=94% (range 81–99%)", "Clear winner?=No: a tie", "Highest observed=gemma3:12b (base model)"]);
    expect(tiles("get_axis", { n: 27, accuracy: 0.444, separation: "SEPARATED", leader: "mock-swarm:3b" })).toContain("Clear winner?=Yes");

    expect(
      tiles("board_totals", {
        state: "LIVE",
        counts: [
          { name: "axis_slots", value: 23, kind: "declared slot count" },
          { name: "measured", value: 23, kind: "measurement count" },
          { name: "unmeasured", value: 0, kind: "first-class" },
        ],
        separation: { comparison_axes: 14, separated_leads: 0, ties: 7, untested: 7 },
        as_of: { fetched_at: "2026-10-06T13:00:17.845Z" },
      }),
    ).toEqual(["Tests on the board=23", "With results=23", "Clear winners=0", "Ties=7"]);

    // Two corpora, two labels; a page of 5 rows is never called "newest".
    expect(
      tiles("list_cards", {
        state: "LIVE",
        index: { n_cards_declared: 335, rows_carried: 335, packaged_at: "2026-08-28T15:39:25+00:00" },
        card_store_count_endpoint: { count: 336 },
        rows: [{ card: "a".repeat(64), ts: "2026-08-19T09:24:39+00:00" }],
      }),
    ).toEqual(["Cards in index=335", "Store reports=336", "Index updated=2026-08-28"]);
    expect(
      tiles("list_cards", {
        index: { n_cards_declared: 2, rows_carried: 2 },
        rows: [{ ts: "2026-08-19T09:00:00Z" }, { ts: "2026-08-21T09:00:00Z" }],
      }),
    ).toContain("Newest=2026-08-21");

    expect(
      tiles("server_evidence", {
        state: "MEASURED",
        endpoint: "https://graded.sh/mcp",
        as_of: "2026-10-01T08:11:31Z",
        n_capsules: 2,
        capsules: [
          { measurement_state: "CONSISTENT", observed_at: "2026-09-25T07:33:52Z" },
          { measurement_state: "INCONSISTENT", observed_at: "2026-09-20T07:33:52Z" },
        ],
      }),
    ).toEqual(["Checks=2", "Consistent=1", "Last checked=2026-09-25"]);
    expect(tiles("server_evidence", { state: "NOT_MEASURED", n_capsules: 0, capsules: [], as_of: "2026-10-01T08:11:31Z" })).toEqual([
      "Checks=0",
      "Records as of=2026-10-01",
    ]);

    const checks = [
      { check: "Family", ok: true },
      { check: "Card id", ok: true },
      { check: "Trust anchor", ok: true },
      { check: "Live anchor cross-check", ok: true, advisory: true },
      { check: "Signature", ok: true },
      { check: "Framing", ok: null },
    ];
    expect(tiles("verify_card", { state: "VALID", checks, pinned_key: "did:web:csoai.org#card-attestation-1" })).toEqual([
      "Checks passed=5/5 (1 more noted, not pass or fail)",
      "Signed by=Council of AI (key card-attestation-1)",
    ]);
    // No signing date in the output: no "Signed on" tile, never a guessed one.
    expect(tiles("verify_card", { state: "VALID", checks, pinned_key: "did:web:csoai.org#card-attestation-1" }).join()).not.toContain("Signed on");
    expect(tiles("verify_card", { state: "VALID", checks, pinned_key: "did:web:csoai.org#k", created: "2026-08-19T09:24:39Z" })).toContain(
      "Signed on=2026-08-19",
    );
    // An INVALID card is never "Signed by Council of AI".
    expect(tiles("verify_card", { state: "INVALID", checks: [{ ok: false }], pinned_key: "did:web:csoai.org#k" })).toEqual(["Checks passed=0/1"]);

    expect(
      tiles("corrections_summary", {
        count: 90,
        recent: [{ date: "2026-09-30" }, { date: "2026-09-27" }],
        correction_latency: { exact: 1, median_seconds_exact: 4600 },
      }),
    ).toEqual(["Corrections=90", "Newest=2026-09-30", "Median fix time=1 h 17 min (over 1 timed correction)"]);

    // Corpus 2 is named as the root's leaves, never just "cards".
    expect(tiles("get_root", { state: "VALID", card_count: 319, merkle_root: "4".repeat(64), as_of: "2026-09-30T05:05:34Z" })).toEqual([
      "Cards under the root=319",
      "Root dated=2026-09-30",
    ]);
  });

  it("falls back to the generic picker for tools without a spec, and skips protocol fields", () => {
    expect(tiles("some_new_tool", { x402Version: 2, tool: "x", route: "/r", sku: "s", family: "f", total: 3 })).toEqual(["Total=3"]);
  });

  it("shows READ, not VALID, for tools that only fetched a file, and keeps the tool's own word", () => {
    expect(chipFor("get_root", "VALID")).toEqual({ chip: "READ", toolWord: "VALID" });
    expect(chipFor("x402_trust", "VALID")).toEqual({ chip: "READ", toolWord: "VALID" });
    expect(chipFor("mcp_trust", "VALID")).toEqual({ chip: "READ", toolWord: "VALID" });
    expect(chipFor("get_card", "INVALID")).toEqual({ chip: "INVALID", toolWord: null });
    expect(chipFor("verify_card", "VALID")).toEqual({ chip: "VALID", toolWord: null });
    expect(stateMeaning("READ")).toBe(`${READ_MEANING}.`);
    expect(READ_MEANING).toBe("Read from the published file; no signature was checked");
    expect(stateMeaning("READY_FOR_REVIEW")).not.toBe(`${READ_MEANING}.`);
    for (const w of ["RELEVANT_CARDS_FOUND", "EMPTY", "CONSISTENT", "PROBED", "SIGNED", "DELIVERED"])
      expect(stateMeaning(w), w).not.toBe("The state word the tool returned.");
  });

  it("names the endpoint server_evidence actually looked up", () => {
    expect(checkedLine("server_evidence", { endpoint: "https://github.com/mcp" })).toBe(
      "We checked our published records for https://github.com/mcp",
    );
    expect(checkedLine("get_axis", { endpoint: "x" })).toBeNull();
  });

  it("keeps one sentence on the face and splits the rest by tool", () => {
    const text =
      "**server_evidence** → NOT_MEASURED — No published capsule is keyed to this endpoint. NOT_MEASURED is not a finding.\n- n_capsules: 0\n\n" +
      "**mcp_trust** → VALID — MCP handshake census (partial round).\n- partial: true\n\n" +
      "_Every line above is a field of the named tool's output._";
    expect(firstSentence(text)).toBe("No published capsule is keyed to this endpoint.");
    expect(firstSentence("**get_axis** → MEASURED — axis \"safety\" (a real run stands behind this row).\n- n: 36")).toBe(
      'Axis "safety" (a real run stands behind this row).',
    );
    const { byTool, shared } = answerSections(text);
    expect(Object.keys(byTool)).toEqual(["server_evidence", "mcp_trust"]);
    expect(byTool.server_evidence).toContain("n_capsules: 0");
    expect(byTool.server_evidence).not.toContain("handshake");
    expect(shared).toContain("Every line above");
  });

  it("links a model to its first signed card, and its row on the list", () => {
    const id = "b".repeat(64);
    expect(modelVerifyHref({ first_signed_card: id })).toBe(`/dashboard?tab=verify&card=${id}`);
    expect(modelVerifyHref({ first_signed_card: null })).toBe("/dashboard?tab=verify");
    expect(modelVerifyHref({ first_signed_card: "not-a-hash" })).toBe("/dashboard?tab=verify");
    expect(modelAnchor("qwen3:8b")).toBe("model-qwen3-8b");
    expect(modelAnchor("Qwen/Qwen2.5-0.5B-Instruct")).toBe("model-qwen-qwen2-5-0-5b-instruct");
  });

  it("prints durations in plain units", () => {
    expect(plainDuration(4600)).toBe("1 h 17 min");
    expect(plainDuration(1714)).toBe("29 min");
    expect(plainDuration(7200)).toBe("2 h");
    expect(plainDuration(3 * 86400)).toBe("3 days");
  });

  // Tools audit retest, 6 Oct 2026 (#2841): the x402 card printed 15 in a tile and 16 in its text.
  it("derives the x402 tile and the x402 sentence from one source", () => {
    const out = {
      state: "VALID",
      as_of: "2026-10-06T06:41:19Z",
      counts: { challenge_402: 75, dead_404_or_unreachable: 15, other_error: 1, total: 100 },
      headline: "75 of 100 rows answer a correct 402 challenge; 16 rows are phantom or unreachable. Counts only by doctrine.",
    };
    const c = x402Counts(out);
    expect(c).toEqual({ tried: 100, askCorrectly: 75, goneOrNotAnswering: 16 });
    // The producer's own headline counts dead + other_error as "phantom or unreachable": same number.
    expect(out.headline).toContain(`${c.goneOrNotAnswering} rows are phantom or unreachable`);
    expect(tiles("x402_trust", out)).toEqual([
      "Paid doors tried=100",
      "Ask for payment correctly=75",
      "Gone or not answering=16",
      "Read on=2026-10-06",
    ]);
    expect(plainAnswer("x402_trust", out)).toBe("Of 100 paid doors we tried, 75 asked for payment correctly and 16 were gone or not answering.");
    // No other_error field: the tile is the dead count alone, never a guessed addition.
    expect(x402Counts({ counts: { dead_404_or_unreachable: 3, total: 100 } }).goneOrNotAnswering).toBe(3);
  });

  it("writes each plain sentence from the same fields its tiles show", () => {
    const axis = { axis: "safety", n: 36, accuracy: 0.944, interval: [0.81, 0.99], separation: "TIE", top_observed_not_separated: "gemma3:12b (base model)" };
    expect(plainAnswer("get_axis", axis)).toBe(
      "Safety: no model was clearly better (a tie). The highest score observed was 94%, by gemma3:12b (base model), over 36 questions.",
    );
    // UNTESTED is the comparison, not the axis: an UNTESTED axis can still carry n and a score.
    expect(plainAnswer("get_axis", { axis: "jail", separation: "UNTESTED" })).toBe("Jail: whether any model is clearly better has not been tested yet.");
    expect(plainAnswer("get_axis", { axis: "jail", n: 71, accuracy: 0.59, separation: "UNTESTED", leader: "qwen2.5:0.5b-instruct (base model)" })).toBe(
      "Jail: the highest score observed was 59%, by qwen2.5:0.5b-instruct (base model), over 71 questions. Whether any model is clearly better has not been tested yet.",
    );
    expect(
      plainAnswer("board_totals", {
        counts: [
          { name: "axis_slots", value: 23 },
          { name: "measured", value: 23 },
        ],
        separation: { separated_leads: 0, ties: 7 },
      }),
    ).toBe("23 of the 23 tests on the board have published results. No test has a clear winner yet; 7 are ties.");
    expect(plainAnswer("server_evidence", { endpoint: "https://github.com/mcp", n_capsules: 0, capsules: [] })).toBe(
      "We have no published checks for https://github.com/mcp yet.",
    );
    expect(plainAnswer("list_cards", { index: { n_cards_declared: 335 }, card_store_count_endpoint: { count: 336 } })).toBe(
      "The signed index lists 335 cards. The live card store counts 336; the two are counted separately and never added.",
    );
    // A tool without a sentence, or a missing field, gives null (the caller keeps the tool's own words).
    expect(plainAnswer("route", { decision: "x" })).toBeNull();
    expect(plainAnswer("x402_trust", { counts: {} })).toBeNull();
  });

  it("says READ for every fetch-only read, list_cards and corrections included", () => {
    expect(chipFor("list_cards", "LIVE")).toEqual({ chip: "READ", toolWord: "LIVE" });
    expect(chipFor("corrections_summary", "LIVE")).toEqual({ chip: "READ", toolWord: "LIVE" });
    expect(chipFor("board_totals", "MEASURED")).toEqual({ chip: "MEASURED", toolWord: null });
  });

  it("sends Verify yourself to a page that shows the same source, not a raw file, where one exists", () => {
    const id = "c".repeat(64);
    expect(verifyLink("verify_card", {}, id, "/signed/cards/x.json")).toBe(`/dashboard?tab=verify&card=${id}`);
    expect(verifyLink("get_axis", { axis: "safety" }, "axis:safety", "https://councilof.ai/api/gspc?axis=safety")).toBe("/axis/safety");
    expect(verifyLink("board_totals", {}, null, "https://councilof.ai/api/gspc")).toBe("/dashboard?tab=board");
    expect(verifyLink("list_cards", {}, null, "https://councilof.ai/signed/card_index.json")).toBe("/dashboard?tab=cards");
    expect(verifyLink("corrections_summary", {}, null, "https://councilof.ai/api/corrections")).toBe("/dashboard?tab=corrections");
    expect(verifyLink("mcp_trust", {}, null, "https://councilof.ai/interop/mcp-trust/latest.json")).toBe("/boards/mcp/");
    // No reader page renders the x402 snapshot: the cited file stays.
    expect(verifyLink("x402_trust", {}, null, "https://councilof.ai/interop/x402-trust/latest.json")).toBe("/interop/x402-trust/latest.json");
  });

  it("answers a model lookup in plain words, and links its row on the list", () => {
    const hit = { state: "MEASURED", model: "qwen3:8b", cards: 13, axes: 13, whose: "third party" };
    expect(tiles("model_lookup", hit)).toEqual(["Signed results=13", "Test areas=13", "Whose model=third party"]);
    expect(plainAnswer("model_lookup", hit)).toBe("qwen3:8b has 13 signed results on file, across 13 test areas. A count, not a score or a safety verdict.");
    expect(plainAnswer("model_lookup", { state: "NOT_MEASURED", model: "gpt-4o", cards: 0 })).toBe(
      "Nothing is published about gpt-4o yet. That is not a finding either way.",
    );
    expect(verifyLink("model_lookup", hit, null, "https://councilof.ai/interop/models-measured.json")).toBe("/models-measured/#model-qwen3-8b");
    // Not on the list: the list page itself, where a reader can see it is absent.
    expect(verifyLink("model_lookup", { state: "NOT_MEASURED", model: "gpt-4o" }, null, "https://councilof.ai/interop/models-measured.json")).toBe("/models-measured/");
  });
});
