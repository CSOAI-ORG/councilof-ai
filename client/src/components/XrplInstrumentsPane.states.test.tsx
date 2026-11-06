// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import XrplInstrumentsPane from "./XrplInstrumentsPane";

let host: HTMLDivElement;
let root: Root | undefined;
async function mount() {
  root = createRoot(host);
  await act(async () => {
    root!.render(<XrplInstrumentsPane />);
  });
}
const heading = () => host.querySelector("h2")!.textContent;
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Unexpected network request");
    }),
  );
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
});

describe("XRPL pane accessible observation states", () => {
  it("names the workspace during loading without reporting invented catalogue counts", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise<Response>(() => {}));
    await mount();
    expect(heading()).toBe("XRPL instruments");
    expect(host.querySelector('[role="status"]')!.textContent).toBe(
      "Loading /api/xrpl…",
    );
    expect(host.querySelector("table")).toBeNull();
    expect(host.textContent).not.toContain("0 assets");
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/xrpl");
  });

  it("retains the workspace heading and honestly announces a JSON503 terminal state", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ state: "UNREACHABLE" }, { status: 503 }),
    );
    await mount();
    expect(heading()).toBe("XRPL instruments");
    expect(host.querySelector('[role="alert"]')!.textContent).toContain(
      "UNREACHABLE — Error: GET /api/xrpl HTTP 503",
    );
    expect(host.textContent).toContain("no cached table is shown");
    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(host.querySelector("table")).toBeNull();
    expect(host.textContent).not.toContain("0 assets");
  });

  it("keeps the same heading on successful reads and preserves unknown figure states", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        as_of: "fixture-observation",
        n: 1,
        assets: [
          {
            symbol: "FIXTURE",
            holders: null,
            holders_state: "UNMEASURED",
            supply: null,
            supply_state: "UNCHECKABLE",
            sig_ed25519: null,
          },
        ],
      }),
    );
    await mount();
    expect(heading()).toBe("XRPL instruments");
    expect(host.querySelector("tbody")!.textContent).toContain("UNMEASURED");
    expect(host.querySelector("tbody")!.textContent).toContain("UNCHECKABLE");
    expect(host.querySelector("tbody")!.textContent).toContain("unsigned");
    expect(host.textContent).toContain("Not a GSPC grade");
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });
});
