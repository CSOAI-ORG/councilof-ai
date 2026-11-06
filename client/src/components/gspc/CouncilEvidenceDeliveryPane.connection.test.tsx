// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CouncilEvidenceDeliveryPane, {
  EVIDENCE_BRIDGE_TIMEOUT_MS,
} from "./CouncilEvidenceDeliveryPane";

const ORIGIN = "https://b5o4e267xnlai.kimi.page";
const PROTOCOL = "council-os.evidence-bridge/v1";
let root: Root | undefined;
let host: HTMLDivElement;
const frame = () => host.querySelector<HTMLIFrameElement>("iframe")!;
const state = () => host.querySelector("output")!.textContent;
const button = (text: string) =>
  [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (node) => node.textContent?.trim() === text,
  )!;
const handoff = () => ({
  schema: "council-os.a2a-evidence-handoff/1.1",
  handoff_state: "PREPARED_NOT_SUBMITTED",
  request: {
    jsonrpc: "2.0",
    id: "fixture-1",
    method: "SendMessage",
    params: {
      message: {
        messageId: "message-1",
        role: "ROLE_USER",
        parts: [
          {
            data: {
              skill: "evidence-delivery",
              input: { draft: { schema: "server-revalidates" } },
            },
          },
        ],
      },
    },
  },
});
async function mount() {
  root = createRoot(host);
  await act(async () => {
    root!.render(<CouncilEvidenceDeliveryPane />);
  });
}
async function message(
  type: string,
  payload?: unknown,
  source: MessageEventSource | null = frame().contentWindow,
  origin = ORIGIN,
) {
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent("message", {
        source,
        origin,
        data: { protocol: PROTOCOL, type, payload },
      }),
    );
  });
}
async function advance(ms = EVIDENCE_BRIDGE_TIMEOUT_MS) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Evidence Delivery bounded bridge connection", () => {
  it("waits for a real bridge message rather than treating iframe load as connected", async () => {
    await mount();
    expect(state()).toBe("CONNECTING");
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "does not confirm a connection",
    );
    await act(async () => {
      frame().dispatchEvent(new Event("load"));
    });
    expect(state()).toBe("CONNECTING");
    await advance(EVIDENCE_BRIDGE_TIMEOUT_MS - 1);
    expect(host.querySelector('[role="alert"]')).toBeNull();
    await advance(1);
    expect(state()).toBe("UNREACHABLE");
    expect(host.querySelector('[role="alert"]')!.textContent).toContain(
      "did not confirm a connection within 15 seconds",
    );
    expect(host.textContent).toContain("No draft submission is confirmed");
    expect(button("Retry module connection")).toBeTruthy();
    expect(host.querySelector('a[target="_blank"]')!.getAttribute("href")).toBe(
      ORIGIN,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("accepts only the pinned origin, current frame and declared protocol", async () => {
    await mount();
    await message(
      "ready",
      undefined,
      frame().contentWindow,
      "https://untrusted.example",
    );
    await message("ready", undefined, window);
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: ORIGIN,
          source: frame().contentWindow,
          data: null,
        }),
      );
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: ORIGIN,
          source: frame().contentWindow,
          data: { protocol: "other", type: "ready" },
        }),
      );
    });
    expect(state()).toBe("CONNECTING");
    await message("ready");
    expect(state()).toBe("READY");
    await advance();
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries using a new frame and ignores a late ready message from the retired attempt", async () => {
    await mount();
    const oldFrame = frame(),
      oldWindow = oldFrame.contentWindow;
    await advance();
    await act(async () => {
      button("Retry module connection").click();
    });
    expect(frame()).not.toBe(oldFrame);
    expect(state()).toBe("CONNECTING");
    await message("ready", undefined, oldWindow);
    expect(state()).toBe("CONNECTING");
    await message("ready");
    expect(state()).toBe("READY");
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("can recover when the current frame responds after a timeout", async () => {
    await mount();
    await advance();
    expect(state()).toBe("UNREACHABLE");
    await message("ready");
    expect(state()).toBe("READY");
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });

  it("reports an explicit browser error and does not later replace it with a timeout explanation", async () => {
    await mount();
    await act(async () => {
      frame().dispatchEvent(new Event("error"));
    });
    expect(state()).toBe("UNREACHABLE");
    expect(host.querySelector('[role="alert"]')!.textContent).toContain(
      "reported a connection problem",
    );
    await advance();
    expect(host.querySelector('[role="alert"]')!.textContent).not.toContain(
      "within 15 seconds",
    );
    await act(async () => {
      button("Retry module connection").click();
    });
    expect(state()).toBe("CONNECTING");
  });

  it("keeps prepared handoff and actual submission separate, preserving the unsigned boundary", async () => {
    await mount();
    await message("draft-ready", { receipt_id: "local-draft-1" });
    expect(state()).toBe("LOCAL_DRAFT_READY");
    expect(button("Submit unsigned draft to Council A2A")).toBeUndefined();
    await message("handoff-ready", handoff());
    expect(state()).toBe("PREPARED_NOT_SUBMITTED");
    expect(fetch).not.toHaveBeenCalled();
    expect(host.textContent).toContain(
      "does not measure, sign, anchor or durably store",
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        jsonrpc: "2.0",
        id: "fixture-1",
        result: {
          message: {
            messageId: "reply-1",
            role: "ROLE_AGENT",
            parts: [
              { text: "received" },
              { data: { receipt_id: "received-1", signed: false } },
            ],
          },
        },
      }),
    );
    await act(async () => {
      button("Submit unsigned draft to Council A2A").click();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/a2a");
    expect(state()).toBe("MESSAGE_RECEIVED_UNSIGNED");
    expect(host.textContent).toContain(
      "No GSPC measurement, certification, signature, anchor or durable storage was created",
    );
  });

  it("rejects malformed handoffs and exposes module error recovery without submitting", async () => {
    await mount();
    await message("handoff-ready", {});
    expect(state()).toBe("HOST_ACTION_REQUIRED");
    expect(host.querySelector('[role="alert"]')!.textContent).toContain(
      "Unsupported evidence handoff",
    );
    expect(button("Submit unsigned draft to Council A2A")).toBeUndefined();
    await message("error");
    expect(button("Retry module connection")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("clears the wait and listener when the pane unmounts", async () => {
    const remove = vi.spyOn(window, "removeEventListener");
    await mount();
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => {
      root!.unmount();
    });
    root = undefined;
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith("message", expect.any(Function));
  });
});
