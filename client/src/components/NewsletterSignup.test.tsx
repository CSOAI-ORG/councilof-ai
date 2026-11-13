// @vitest-environment jsdom
// Every request is mocked. These checks submit no real subscription.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NewsletterSignup from "./NewsletterSignup";

let root: Root | undefined;
let host: HTMLDivElement;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
});

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function mount(two = false) {
  root = createRoot(host);
  await act(async () => {
    root!.render(<><NewsletterSignup />{two ? <NewsletterSignup /> : null}</>);
  });
}

async function enterEmail(email = "reader@example.com") {
  const input = host.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, email);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit() {
  await act(async () => {
    host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("newsletter capture and recovery", () => {
  it("gives every visible label a unique, autofill-ready email input", async () => {
    await mount(true);
    const inputs = [...host.querySelectorAll("input")];
    expect(new Set(inputs.map((input) => input.id)).size).toBe(2);
    for (const input of inputs) {
      expect(host.querySelector(`label[for="${input.id}"]`)?.textContent).toBe("Email address");
      expect(input.name).toBe("email");
      expect(input.autocomplete).toBe("email");
    }
  });

  it("retains an uncertain network attempt and its recovery message beyond the old timeout", async () => {
    vi.useFakeTimers();
    const fetcher = vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("response lost"));
    await mount();
    await enterEmail();
    await submit();
    expect(fetcher).toHaveBeenCalledWith("/api/subscribe", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: "reader@example.com", source: "footer-newsletter" }),
    }));
    expect(host.querySelector("input")!.value).toBe("reader@example.com");
    expect(host.querySelector('[role="status"]')!.textContent).toContain("could not be confirmed");
    expect(host.textContent).not.toContain("nothing was sent");
    await act(async () => { vi.advanceTimersByTime(20_000); });
    expect(host.querySelector('[role="status"]')!.textContent).toContain("could not be confirmed");
    expect(host.querySelector("button")!.disabled).toBe(false);
  });

  it("keeps a confirmed store refusal distinct from success and retains the draft", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response({ ok: true, stored: false, reason: "service unavailable" }));
    await mount();
    await enterEmail();
    await submit();
    expect(host.textContent).toContain("NOT SUBSCRIBED");
    expect(host.querySelector("input")!.value).toBe("reader@example.com");
    await act(async () => { vi.advanceTimersByTime(20_000); });
    expect(host.textContent).toContain("NOT SUBSCRIBED");
  });

  it("does not infer storage from an incomplete successful HTTP response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response({ ok: true }));
    await mount();
    await enterEmail();
    await submit();
    expect(host.textContent).toContain("could not be confirmed");
    expect(host.textContent).not.toContain("NOT saved");
    expect(host.querySelector("input")!.value).toBe("reader@example.com");
  });

  it("does not infer storage from an unreadable 200 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not JSON", { status: 200 }));
    await mount();
    await enterEmail();
    await submit();
    expect(host.textContent).toContain("could not be confirmed");
    expect(host.querySelector("input")!.value).toBe("reader@example.com");
    expect(host.querySelector("button")!.disabled).toBe(false);
  });

  it("allows retry after HTTP failure and confirms only explicit storage", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response({ error: "Please try later" }, 503))
      .mockResolvedValueOnce(response({ ok: true, stored: true }));
    await mount();
    await enterEmail();
    await submit();
    expect(host.textContent).toContain("Please try later");
    expect(host.querySelector("input")!.value).toBe("reader@example.com");
    await submit();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("Stored. Your address is on the list");
    expect(host.querySelector("input")!.value).toBe("");
    expect(host.textContent).toContain("no confirmation email is sent");
  });
});
