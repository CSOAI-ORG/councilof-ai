// @vitest-environment jsdom
// The Council OS staff pane, mounted for real. No backend is contacted: fetch is stubbed and
// every assertion is about what the reader is shown and where the question is actually sent.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardStaffPane from "./DashboardStaffPane";
import { hasPane } from "./DashboardPane";

/** A REAL ed25519 did:key the estate already publishes (the MEOK HIM's Ora). */
const REAL_DID = "did:key:z6MksvqVuqPXddC3h1BEJ3WNXVfhMMnr3tpGMwoXikcPNqZb";

const REGISTRY = {
  schema: "csoai.pal/0.1",
  count: 6,
  model_configured: true,
  model_active: "meok-fluid-v1",
  staff: [
    {
      id: "measure-csoai",
      slug: "measure",
      name: "Measure",
      one_line: "Board, axes and runs",
      // The house staff have no keypair provisioned, so the registry publishes no DID and
      // says so. A DID-shaped string with no key behind it is a claim, not an identity.
      did: "",
      signed: false,
      status: "active",
    },
  ],
};

describe("the Council OS staff pane", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
    vi.restoreAllMocks();
  });

  async function mount() {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(<DashboardStaffPane />);
    });
    return container;
  }

  it("is registered as a dashboard pane", () => {
    expect(hasPane("staff")).toBe(true);
  });

  it("lists the staff from the registry and says which model is configured", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(REGISTRY), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const c = await mount();

    expect(c.querySelector('[data-testid="os-agent-measure"]')).not.toBeNull();
    // The reader is told a model is configured, and which one.
    expect(c.textContent).toContain("meok-fluid-v1");
  });

  it("says plainly that a staff member with no keypair cannot be signed for", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(REGISTRY), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const c = await mount();
    // The honest state, not a DID-shaped string with no key behind it.
    expect(c.textContent).toContain("No signing key yet");
    expect(c.textContent).not.toContain("did:key:z6Mkstub");
  });

  it("publishes the DID when a keypair HAS been provisioned", async () => {
    const signedRegistry = {
      ...REGISTRY,
      staff: [{ ...REGISTRY.staff[0], did: REAL_DID, signed: true }],
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(signedRegistry), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const c = await mount();
    // The staff member WITH a keypair shows its DID. The others have none provisioned and say
    // so, which is why the negative assertion is not made here.
    expect(c.textContent).toContain("did:key:z6MksvqVuqPXddC3");
  });

  it("says so plainly when no model is configured, rather than implying one is there", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ...REGISTRY, model_configured: false, model_active: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const c = await mount();
    expect(c.textContent).toContain("No language model is configured");
    expect(c.textContent).not.toContain("meok-fluid-v1");
  });

  it("sends the question to the PAL endpoint, not to the old chat, and shows the provenance", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      if (url.endsWith("/api/pals")) {
        return new Response(JSON.stringify(REGISTRY), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (url.endsWith("/api/pals/measure/chat")) {
        const body = JSON.parse(String(init?.body ?? "{}"));
        expect(body.message).toBe("how is governance measured");
        return new Response(
          JSON.stringify({
            answer: "Governance is measured with n 3 and the lead is tied.",
            state: "grounded",
            facts: 'Axis "governance": status MEASURED, n 3.',
            source: "GET /api/gspc → axes[] (governance)",
            model: null,
            guardrail: null,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const c = await mount();
    const ask = Array.from(c.querySelectorAll("button")).find((b) => b.textContent === "Ask Measure");
    expect(ask).toBeDefined();
    await act(async () => {
      ask!.click();
    });

    const input = c.querySelector<HTMLInputElement>('[data-testid="pal-ask-input"]')!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => {
      setValue.call(input, "how is governance measured");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      c.querySelector<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    // The old /api/chat path is dead for the staff: it has no model in it, so a reader asking
    // the Press desk a question was told what to ask instead.
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.endsWith("/api/pals/measure/chat"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/api/chat"))).toBe(false);

    // The reply is shown, and so is where it came from.
    expect(c.textContent).toContain("Governance is measured with n 3");
    expect(c.querySelector('[data-testid="pal-turn-state"]')?.textContent).toBe("grounded");
    expect(c.textContent).toContain("GET /api/gspc");
  });
});
