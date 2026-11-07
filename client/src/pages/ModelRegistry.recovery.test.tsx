// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ModelRegistry, {
  MODEL_REGISTRY_TIMEOUT_MS,
  parseModelRegistryResponse,
} from "./ModelRegistry";
const historicalBoard = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../../public/signed/gspc-board.signed.json"),
    "utf8",
  ),
);
let host: HTMLDivElement;
let root: Root | undefined;
async function mount() {
  root = createRoot(host);
  await act(async () => {
    root!.render(<ModelRegistry />);
  });
}
const failure = () =>
  host.querySelector('[data-testid="model-registry-unreachable"]');
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal("fetch", vi.fn());
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(async () => {
  if (root)
    await act(async () => {
      root!.unmount();
    });
  root = undefined;
  host.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("model registry degraded board recovery", () => {
  it("keeps the registry usable and labels its dated snapshot when the API answers JSON503", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { error: "offline_surface_check", state: "UNREACHABLE" },
        { status: 503 },
      ),
    );
    await mount();
    expect(host.querySelector("h1")!.textContent).toBe("Model Registry");
    expect(failure()!.textContent).toContain("UNREACHABLE");
    expect(failure()!.textContent).toContain("HTTP 503");
    expect(failure()!.textContent).toContain(
      "bundled snapshot (2026-08-12), not live",
    );
    expect(host.textContent).not.toContain("live · /api/gspc");
    expect(
      [...host.querySelectorAll("button")].find(
        (node) => node.textContent === "Retry board",
      ),
    ).toBeTruthy();
  });

  it.each([
    { label: "missing axes", body: { schema: "csoai.gspc-axes/0.5" } },
    {
      label: "unknown schema",
      body: { ...historicalBoard, schema: "unknown/1" },
    },
    { label: "null axis", body: { ...historicalBoard, axes: [null] } },
    {
      label: "missing observation date",
      body: { ...historicalBoard, measured_on: {} },
    },
    { label: "missing issuer", body: { ...historicalBoard, issuer: null } },
    {
      label: "unsafe number method",
      body: {
        ...historicalBoard,
        axes: [{ ...historicalBoard.axes[0], fleet_mean: "bad" }],
      },
    },
    {
      label: "unsafe interval",
      body: {
        ...historicalBoard,
        axes: [{ ...historicalBoard.axes[0], interval: ["bad", 1] }],
      },
    },
    {
      label: "bad limitations",
      body: { ...historicalBoard, limitations: [{}] },
    },
  ])(
    "rejects $label before unsafe rendering and keeps it out of the wire state",
    async ({ body }) => {
      vi.mocked(fetch).mockResolvedValue(Response.json(body));
      await mount();
      expect(failure()).toBeTruthy();
      expect(host.textContent).toContain("dated bundled snapshot");
      expect(host.textContent).not.toContain("live · /api/gspc");
    },
  );

  it("rejects an HTML200 fallback and network errors without losing the dated source label", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("<!doctype html><h1>SPA</h1>", {
        headers: { "content-type": "text/html" },
      }),
    );
    await mount();
    expect(failure()!.textContent).toContain("HTML instead of JSON");
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await act(async () => {
      [...host.querySelectorAll<HTMLButtonElement>("button")]
        .find((node) => node.textContent === "Retry board")!
        .click();
    });
    expect(failure()!.textContent).toContain("Failed to fetch");
    expect(host.textContent).toContain("not a current API response");
  });

  it("keeps failure feedback until a retry actually validates a board response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ error: "down" }, { status: 503 }),
    );
    await mount();
    let resolveRetry!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRetry = resolve;
        }),
    );
    await act(async () => {
      [...host.querySelectorAll<HTMLButtonElement>("button")]
        .find((node) => node.textContent === "Retry board")!
        .click();
    });
    expect(failure()!.textContent).toContain("HTTP 503");
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "Retrying",
    );
    expect(
      [...host.querySelectorAll<HTMLButtonElement>("button")].find(
        (node) => node.textContent === "Retrying board…",
      )!.disabled,
    ).toBe(true);
    await act(async () => {
      resolveRetry(Response.json(historicalBoard));
    });
    expect(failure()).toBeNull();
    expect(host.textContent).toContain("live · /api/gspc");
    const parsed = parseModelRegistryResponse(historicalBoard);
    expect(host.textContent).toContain(
      `${parsed.axes.filter((axis) => axis.kind === "model-comparison").length} model-comparison`,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("bounds a stalled request and ignores its result after a later retry succeeds", async () => {
    vi.useFakeTimers();
    let resolveOld!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    await mount();
    await act(async () => {
      vi.advanceTimersByTime(MODEL_REGISTRY_TIMEOUT_MS);
    });
    expect(failure()!.textContent).toContain("timed out");
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(historicalBoard));
    await act(async () => {
      [...host.querySelectorAll<HTMLButtonElement>("button")]
        .find((node) => node.textContent === "Retry board")!
        .click();
    });
    await act(async () => {
      resolveOld(Response.json({ error: "late" }, { status: 503 }));
    });
    expect(failure()).toBeNull();
    expect(host.textContent).toContain("live · /api/gspc");
  });

  it("derives an absent public count from every row status while preserving kind labels", async () => {
    const model = historicalBoard.axes.find(
      (axis: { kind: string }) => axis.kind === "model-comparison",
    );
    const fact = historicalBoard.axes.find(
      (axis: { kind: string }) => axis.kind === "deterministic-facts",
    );
    vi.mocked(fetch).mockResolvedValue(Response.json({
      ...historicalBoard,
      totals: { ...historicalBoard.totals, axes: 5, measured_axes: 4, unmeasured_axes: 1, public_count: "" },
      axes: [
        { ...model, axis: "fixture-model", status: "MEASURED" },
        { ...fact, axis: "fixture-fact", status: "MEASURED" },
        { ...model, axis: "fixture-subject", kind: "measured-subject", status: "MEASURED" },
        { ...model, axis: "fixture-unknown", kind: "future-kind", status: "MEASURED" },
        { ...model, axis: "fixture-unmeasured", kind: "measured-subject", status: "UNMEASURED", n: 0 },
      ],
    }));
    await mount();
    expect(failure()).toBeNull();
    const header = host.querySelector("header")!.textContent;
    expect(header).toContain("5 axis · 4 measured");
    expect(header).toContain("1 model-comparison + 1 deterministic-fact · 2 measured-subject · 1 unclassified");
  });

  it("keeps withheld leaders and deterministic facts outside the model-comparison leader display", async () => {
    const axis = historicalBoard.axes.find(
      (axis: { kind: string }) => axis.kind === "model-comparison",
    );
    const fact = historicalBoard.axes.find(
      (axis: { kind: string }) => axis.kind === "deterministic-facts",
    );
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        ...historicalBoard,
        axes: [
          {
            ...axis,
            public_leader_state: "EXCLUDED_OWN_MODEL",
            leader: "withheld-own-model",
            accuracy: 0.99,
          },
          { ...fact, leader: "fact-not-a-model", accuracy: null },
        ],
      }),
    );
    await mount();
    expect(host.textContent).toContain("Measured fleet; no public leader");
    expect(host.textContent).not.toContain("withheld-own-model");
    expect(host.textContent).not.toContain("fact-not-a-model");
    expect(host.textContent).toContain("1 deterministic-fact axes");
  });
});
