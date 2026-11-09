// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardArenaPane, {
  ARENA_SCOREBOARD_ENDPOINT,
  ARENA_SCOREBOARD_FALLBACK,
  DASHBOARD_ARENA_CONTRACT,
  defaultArenaAxis,
  PracticeArena,
  PRACTICE_SESSION_STORAGE_KEY,
  decodePracticeSnapshot,
  encodePracticeSnapshot,
  advancePracticeSnapshot,
  fetchArenaScoreboard,
  generatePracticeRounds,
  initialArenaPair,
  isPublicArenaModelId,
  parseArenaScoreboard,
  scorePracticeDecisions,
  simulatePracticeDecisions,
} from "./DashboardArenaPane";

const PAYLOAD = {
  schema: "csoai.signed-arena-leaderboard/0.1",
  as_of: "2026-08-29T05:45:52Z",
  n_rounds: 42,
  axis_pass_rates: {
    care: {
      n_rounds: 30,
      models: {
        "model-a:7b": { pass: 9, n: 10, rate: 0.9 },
        "model-b:7b": { pass: 4, n: 8, rate: 0.5 },
        "oowm-private:7b": { pass: 7, n: 10, rate: 0.7 },
      },
    },
    governance: {
      n_rounds: 12,
      models: {
        "model-a:7b": { pass: 5, n: 10, rate: 0.5 },
        "model-b:7b": { pass: 4, n: 10, rate: 0.4 },
      },
    },
  },
  signature: {
    content_id: "abc123",
    sig: "signed-bytes",
    kid: "did:web:csoai.org#card-attestation-1",
  },
};

describe("dashboard measured arena", () => {
  it("recovers the seeded practice mechanic without treating it as evidence", () => {
    const first = generatePracticeRounds(42, 8);
    const repeat = generatePracticeRounds(42, 8);
    const next = generatePracticeRounds(43, 8);

    expect(first).toEqual(repeat);
    expect(next).not.toEqual(first);
    expect(first).toHaveLength(8);
    expect(first.every((round) => typeof round.critical === "boolean")).toBe(
      true,
    );
  });

  it("scores the human and simulated opponent against the same ground truth", () => {
    const rounds = generatePracticeRounds(42, 8);
    const perfect = rounds.map((round) =>
      round.critical ? ("escalate" as const) : ("resolve" as const),
    );
    const opponent = simulatePracticeDecisions(rounds, 0.7, 42);

    expect(scorePracticeDecisions(perfect, rounds).f1).toBe(1);
    expect(opponent).toHaveLength(rounds.length);
    expect(simulatePracticeDecisions(rounds, 0.7, 42)).toEqual(opponent);
  });

  it("states the current replay, chat, AG-UI, A2UI and live-battle boundaries", () => {
    expect(DASHBOARD_ARENA_CONTRACT).toMatchObject({
      replay: {
        state: "SIGNED",
        endpoint: "/api/arena/scoreboard",
        scope: "HISTORICAL_REPLAY",
        taxonomy: "NONCANONICAL_15_AXIS",
      },
      chat: { state: "RUNTIME_OBSERVED", endpoint: "/api/chat" },
      livePromptBattle: { state: "UNCHECKABLE", endpoint: null },
      agui: { state: "RUNTIME_OBSERVED", endpoint: "/api/agui/gspc-state" },
      aguiWire: { state: "UNREACHABLE", endpoint: "/api/agui/health" },
      a2ui: { state: "UNCHECKABLE", endpoint: null },
    });
  });

  it("parses measured rows without exposing internal model markers or coercing bad cells", () => {
    const board = parseArenaScoreboard(PAYLOAD);
    expect(Object.keys(board.axes.care.models)).toEqual([
      "model-a:7b",
      "model-b:7b",
    ]);
    expect(board.signature?.keyId).toBe("did:web:csoai.org#card-attestation-1");
    expect(defaultArenaAxis(board)).toBe("care");
    expect(initialArenaPair(board.axes.care)).toEqual([
      "model-a:7b",
      "model-b:7b",
    ]);
    expect(isPublicArenaModelId("public-model:7b")).toBe(true);
    expect(isPublicArenaModelId("sov33-private")).toBe(false);
    expect(isPublicArenaModelId("vendor/oowm:latest")).toBe(false);
  });

  it("uses the signed static artefact when a local Vite route returns HTML", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === ARENA_SCOREBOARD_ENDPOINT)
        return new Response("<!doctype html>", { status: 200 });
      if (url === ARENA_SCOREBOARD_FALLBACK) return Response.json(PAYLOAD);
      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;
    const board = await fetchArenaScoreboard(fetchImpl);
    expect(board.source).toBe(ARENA_SCOREBOARD_FALLBACK);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("renders a selector over replay evidence while refusing to fake live inference", () => {
    const board = parseArenaScoreboard(PAYLOAD);
    const html = renderToStaticMarkup(
      <DashboardArenaPane initialData={board} />,
    );
    expect(html).toContain("Practice decisions, then inspect evidence");
    expect(html).toContain('href="/world/observatory/"');
    expect(html).toContain("dated, source-linked simulation observatory");
    expect(html).toContain("The Boss&#x27;s Chair");
    expect(html).toContain("Private practice · simulated opponent");
    expect(html).toContain("decisions remain in this browser");
    expect(html).toContain(
      "No model call, evidence admission, signing, or training reuse occurs",
    );
    expect(html).toContain("SIGNED HISTORICAL ARTEFACT");
    expect(html).toContain("legacy, noncanonical 15-axis arena taxonomy");
    expect(html).toContain("not the canonical GSPC board");
    expect(html).toContain("model-a:7b");
    expect(html).toContain("model-b:7b");
    // Tools audit, 6 Oct 2026: no empty "Live prompt battle" box while the contract publishes no
    // endpoint; the boundary stays recorded in DASHBOARD_ARENA_CONTRACT (UNCHECKABLE, null).
    expect(DASHBOARD_ARENA_CONTRACT.livePromptBattle.endpoint).toBeNull();
    expect(html).not.toContain("Live prompt battle");
    // The raw feeds are one click away, behind a labelled expander, not loose in the footer.
    expect(html).toContain("Raw data (for developers)");
    expect(html).toMatch(/<details[^>]*data-testid="arena-raw-links"[\s\S]*Round feed[\s\S]*Recompute content id[\s\S]*<\/details>/);
    expect(html).not.toContain("oowm-private:7b");
  });
});

describe("Boss's Chair private practice continuity", () => {
  const initial = () => ({ seed: 42, decisions: [] as ("resolve" | "escalate")[] });
  const saved = () => JSON.parse(encodePracticeSnapshot(initial())!);

  it("restores a partial attempt without storing a score or evidence claim", () => {
    const attempt = { seed: 42, decisions: ["resolve", "escalate"] as const };
    const raw = encodePracticeSnapshot({ seed: attempt.seed, decisions: [...attempt.decisions] });
    expect(decodePracticeSnapshot(raw)).toEqual(attempt);
    expect(Object.keys(JSON.parse(raw!)).sort()).toEqual(["decisions", "scenarioKey", "schema", "seed"]);
  });

  it("restores a completed attempt for the unchanged source cases", () => {
    const attempt = { seed: 43, decisions: generatePracticeRounds(43).map(() => "escalate" as const) };
    expect(decodePracticeSnapshot(encodePracticeSnapshot(attempt))).toEqual(attempt);
  });

  it.each([null, "", "{", "null", "[]", "x".repeat(16385)])(
    "refuses absent, malformed or oversized saves", (raw) => {
      expect(decodePracticeSnapshot(raw)).toBeNull();
    },
  );

  it.each([-1, 1.5, 4294967296, "42", null, true])(
    "refuses invalid cached seeds", (seed) => {
      expect(decodePracticeSnapshot(JSON.stringify({ ...saved(), seed }))).toBeNull();
    },
  );

  it.each([null, {}, ["approve"], ["resolve", null], Array(9).fill("resolve")].map(
    (decisions) => ({ decisions }),
  ))("refuses invalid or overlong answers", ({ decisions }) => {
    expect(decodePracticeSnapshot(JSON.stringify({ ...saved(), decisions }))).toBeNull();
  });

  it("refuses a changed seed, changed cases, wrong schema or cached authority claim", () => {
    const value = saved();
    for (const changed of [
      { ...value, seed: 43 },
      { ...value, scenarioKey: value.scenarioKey + "changed" },
      { ...value, schema: "future/2" },
      { ...value, outcome_verified: true },
    ]) expect(decodePracticeSnapshot(JSON.stringify(changed))).toBeNull();
  });

  it("accepts one answer, refuses its stale retry and then accepts the next round", () => {
    const start = initial();
    const one = advancePracticeSnapshot(start, 42, 0, "resolve");
    expect(one.decisions).toEqual(["resolve"]);
    expect(advancePracticeSnapshot(one, 42, 0, "escalate")).toBe(one);
    expect(advancePracticeSnapshot(one, 42, 1, "escalate").decisions).toEqual(["resolve", "escalate"]);
    expect(start.decisions).toEqual([]);
  });

  it("refuses an old-seed callback and answers after completion", () => {
    const next = { seed: 43, decisions: [] as ("resolve" | "escalate")[] };
    expect(advancePracticeSnapshot(next, 42, 0, "resolve")).toBe(next);
    const full = { seed: 42, decisions: generatePracticeRounds(42).map(() => "resolve" as const) };
    expect(advancePracticeSnapshot(full, 42, full.decisions.length, "resolve")).toBe(full);
  });

  it("refuses a skipped or invalid round number", () => {
    const value = initial();
    for (const index of [-1, 1, 0.5, Number.NaN]) {
      expect(advancePracticeSnapshot(value, 42, index, "resolve")).toBe(value);
    }
  });
});

describe("Boss's Chair mounted resume behavior", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  let previousActEnvironment: unknown;

  beforeEach(() => {
    previousActEnvironment = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
    window.sessionStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (root) await act(async () => { root!.unmount(); });
    root = null;
    container.remove();
    window.sessionStorage.clear();
    if (previousActEnvironment === undefined) {
      Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    } else {
      Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", previousActEnvironment);
    }
  });

  async function mount(strict = false) {
    root = createRoot(container);
    await act(async () => {
      root!.render(strict ? <StrictMode><PracticeArena /></StrictMode> : <PracticeArena />);
    });
  }

  async function leave() {
    await act(async () => { root!.unmount(); });
    root = null;
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(container.querySelectorAll("button"))
      .find((element) => element.textContent?.includes(label));
    expect(found).toBeDefined();
    return found!;
  }

  async function choose(label = "Resolve within scope") {
    await act(async () => {
      button(label).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }

  function snapshot() {
    return decodePracticeSnapshot(window.sessionStorage.getItem(PRACTICE_SESSION_STORAGE_KEY));
  }

  it("keeps the same next case after choosing twice, leaving and reopening the pane", async () => {
    await mount();
    await choose();
    await choose("Escalate to a person");
    expect(snapshot()).toEqual({ seed: 42, decisions: ["resolve", "escalate"] });
    await leave();
    await mount();
    expect(container.textContent).toContain("round 3/8");
    expect(container.textContent).toContain(generatePracticeRounds(42)[2].body);
    expect(container.textContent).toContain("Practice restored for this tab");
  });

  it("restores an existing completed attempt and derives its displayed outcome", async () => {
    const decisions = generatePracticeRounds(42).map((round) =>
      round.critical ? "escalate" as const : "resolve" as const);
    window.sessionStorage.setItem(PRACTICE_SESSION_STORAGE_KEY,
      encodePracticeSnapshot({ seed: 42, decisions })!);
    await mount();
    expect(container.textContent).toContain("Scenario complete");
    expect(container.textContent).toContain("100.0%");
    const result = container.querySelector("p.text-3xl")?.textContent;
    expect(["Human wins", "Tie"]).toContain(result);
    await leave();
    await mount();
    expect(container.querySelector("p.text-3xl")?.textContent).toBe(result);
    expect(snapshot()?.decisions).toEqual(decisions);
  });

  it("saves a new scenario without carrying completed answers into the new seed", async () => {
    const decisions = generatePracticeRounds(42).map(() => "resolve" as const);
    window.sessionStorage.setItem(PRACTICE_SESSION_STORAGE_KEY,
      encodePracticeSnapshot({ seed: 42, decisions })!);
    await mount();
    await choose("New seeded");
    expect(snapshot()).toEqual({ seed: 43, decisions: [] });
    await leave();
    await mount();
    expect(container.textContent).toContain("seed 43");
    expect(container.textContent).toContain("round 1/8");
    expect(container.textContent).not.toContain("Scenario complete");
  });

  it("remains playable with an explicit loss notice when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });
    await mount();
    await choose();
    expect(container.textContent).toContain("round 2/8");
    expect(container.textContent).toContain("Leaving this pane will lose this attempt");
  });

  it("does not overwrite a rejected save just by opening the pane", async () => {
    const rejected = '{"schema":"future/2","decisions":[]}';
    window.sessionStorage.setItem(PRACTICE_SESSION_STORAGE_KEY, rejected);
    const writes = vi.spyOn(Storage.prototype, "setItem");
    await mount();
    expect(container.textContent).toContain("does not match the current cases");
    expect(writes).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(rejected);
    await choose();
    expect(writes).toHaveBeenCalledTimes(1);
    expect(snapshot()).toEqual({ seed: 42, decisions: ["resolve"] });
  });

  it("retains the previous save and reports a new write failure honestly", async () => {
    const original = encodePracticeSnapshot({ seed: 42, decisions: ["resolve"] })!;
    window.sessionStorage.setItem(PRACTICE_SESSION_STORAGE_KEY, original);
    await mount();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });
    await choose("Escalate to a person");
    expect(container.textContent).toContain("round 3/8");
    expect(container.textContent).toContain("Leaving this pane will lose this attempt");
    expect(window.sessionStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(original);
  });

  it("accepts one answer from two callbacks batched against the same rendered round", async () => {
    await mount();
    const resolve = button("Resolve within scope");
    const escalate = button("Escalate to a person");
    await act(async () => {
      resolve.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      escalate.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(snapshot()).toEqual({ seed: 42, decisions: ["resolve"] });
    expect(container.textContent).toContain("round 2/8");
  });

  it("does not clobber a saved attempt during StrictMode effect replay", async () => {
    const original = encodePracticeSnapshot({ seed: 42, decisions: ["escalate"] })!;
    window.sessionStorage.setItem(PRACTICE_SESSION_STORAGE_KEY, original);
    const writes = vi.spyOn(Storage.prototype, "setItem");
    await mount(true);
    expect(container.textContent).toContain("round 2/8");
    expect(window.sessionStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(original);
    expect(writes).not.toHaveBeenCalled();
  });
});
