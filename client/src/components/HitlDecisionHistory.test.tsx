// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HitlDecisionHistory from "./HitlDecisionHistory";
import HitlConsole from "./HitlConsole";

const entry = {
  schema: "csoai.hitl-oversight-receipt/0.1",
  at: "2026-10-29T04:00:00Z",
  operator: "fixture reviewer",
  axis: "governance",
  decision: "HOLD",
  note: "Review evidence",
  challenge: {
    id: "fixture-challenge",
    subject: "Fixture change",
    proposed_action: "Change an owned fixture",
  },
  signature: { value_hex: "abc", did: "did:example:fixture" },
};
const record = {
  schema: "csoai.hitl-record/0.1",
  store_bound: true,
  count: 1,
  receipts: [entry],
};
const state = {
  schema: "csoai.hitl-companion-state/0.1",
  decision_path: "open",
  store_bound: true,
  signing_key_configured: true,
  modules: [],
  decisions: ["APPROVED", "HOLD", "REJECTED"],
};
const queue = {
  schema: state.schema,
  challenges: [
    {
      ...entry.challenge,
      at: entry.at,
      axis: "governance",
      raised_by: "fixture",
      state: "PENDING",
    },
  ],
};
const response = (value: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => value,
  text: async () => JSON.stringify(value),
});
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function render(component: React.ReactNode) {
  await act(async () => root.render(component));
}
function button(text: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === text,
  )!;
}
function useFetch(fn?: (url: string, init?: RequestInit) => unknown) {
  const f = vi.fn(async (url: string, init?: RequestInit) =>
    fn ? fn(url, init) : response(record),
  );
  vi.stubGlobal("fetch", f);
  return f;
}

describe("decision history visitor behavior", () => {
  it("loads existing public records without a token or write and exposes the exact action", async () => {
    const f = useFetch();
    await render(<HitlDecisionHistory />);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe("/api/hitl/record");
    expect(f.mock.calls[0][1]?.method).toBeUndefined();
    expect(f.mock.calls[0][1]?.headers).toBeUndefined();
    expect(container.textContent).toContain("Change an owned fixture");
    expect(container.textContent).toContain("Present; not verified here");
    expect(container.textContent).toContain(
      "not independent identity verification",
    );
  });
  it("a failed read never turns into no decisions", async () => {
    useFetch(() => {
      throw new Error("network");
    });
    await render(<HitlDecisionHistory />);
    expect(container.textContent).toContain(
      "does not mean that no decisions exist",
    );
    expect(container.textContent).not.toContain("0 of 0");
    expect(button("Save decision record").disabled).toBe(true);
  });
  it("a malformed refresh removes the old downloadable snapshot", async () => {
    let bad = false;
    useFetch(() => response(bad ? { ...record, count: 2 } : record));
    await render(<HitlDecisionHistory />);
    expect(button("Save decision record").disabled).toBe(false);
    bad = true;
    await act(async () => button("Refresh record").click());
    expect(button("Save decision record").disabled).toBe(true);
    expect(container.textContent).not.toContain("Fixture change");
  });
  it("no bound store is not proof no decision was ever made", async () => {
    useFetch(() =>
      response({ ...record, store_bound: false, count: 0, receipts: [] }),
    );
    await render(<HitlDecisionHistory />);
    expect(container.textContent).toContain(
      "cannot establish that no decision was ever made",
    );
  });
  it("reopens a saved record locally, marks it unverified, and recovers after a bad file", async () => {
    const f = useFetch();
    await render(<HitlDecisionHistory />);
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    async function choose(text: string) {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [{ size: text.length, text: async () => text }],
      });
      await act(async () =>
        input.dispatchEvent(new Event("change", { bubbles: true })),
      );
    }
    await choose("broken");
    expect(container.textContent).toContain("was not accepted");
    expect(button("Save decision record").disabled).toBe(true);
    await choose(JSON.stringify(record));
    expect(container.textContent).toContain("Saved snapshot reopened locally");
    expect(container.textContent).toContain("grants no authority");
    expect(button("Save decision record").disabled).toBe(false);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("renders untrusted receipt text as text, not markup", async () => {
    useFetch(() =>
      response({
        ...record,
        receipts: [{ ...entry, note: '<img src=x onerror="alert(1)">' }],
      }),
    );
    await render(<HitlDecisionHistory />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x");
  });
});

describe("console uncertainty", () => {
  it("does not show open, unsigned or no-store while status is unknown", async () => {
    useFetch(() => new Promise(() => {}));
    await render(<HitlConsole />);
    expect(
      container.querySelector('[data-testid="hitl-gate-decision"]')
        ?.textContent,
    ).toContain("unknown");
    expect(
      container.querySelector('[data-testid="hitl-gate-signing"]')?.textContent,
    ).toContain("unknown");
    expect(
      container.querySelector('[data-testid="hitl-gate-store"]')?.textContent,
    ).toContain("unknown");
    expect(
      (
        container.querySelector(
          '[data-testid="hitl-decide-APPROVED"]',
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  it("failed state and queue reads do not assert an empty queue", async () => {
    useFetch(() => response({}, 503));
    await render(<HitlConsole />);
    expect(container.textContent).toContain(
      "review queue could not be checked",
    );
    expect(container.textContent).not.toContain(
      "Nothing is waiting for a human",
    );
    expect(button("Retry status read")).toBeTruthy();
  });
  it.each(["network", "server", "missing receipt"])(
    "an ambiguous %s response pauses decisions and refreshes the record without retrying the write",
    async (failure) => {
      const f = useFetch((url, init) => {
        if (init?.method === "POST") {
          if (failure === "server") return response({}, 503);
          if (failure === "missing receipt") return response({ ok: true });
          throw new Error("response lost after dispatch");
        }
        return response(
          url === "/api/hitl"
            ? state
            : url.endsWith("challenges")
              ? queue
              : record,
        );
      });
      await render(<HitlConsole />);
      const approve = container.querySelector(
        '[data-testid="hitl-decide-APPROVED"]',
      ) as HTMLButtonElement;
      await act(async () => approve.click());
      expect(container.textContent).toContain("decision outcome is unknown");
      expect(approve.disabled).toBe(true);
      await act(async () => approve.click());
      expect(f.mock.calls.filter((c) => c[1]?.method === "POST")).toHaveLength(
        1,
      );
      expect(
        f.mock.calls.filter((c) => c[0] === "/api/hitl/record"),
      ).toHaveLength(2);
    },
  );
});
