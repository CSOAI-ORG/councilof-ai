// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return { motion: { div: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children) } };
});

import Contact from "./Contact";

const id = "4c6a4ca0-197b-423d-8341-1f77d6eb40ba";
let root: Root;
let host: HTMLDivElement;

function enter(testId: string, text: string) {
  const element = document.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
  expect(element).not.toBeNull();
  const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  expect(setter).toBeTypeOf("function");
  act(() => {
    setter!.call(element, text);
    element!.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function fill() {
  enter("contact-name-input", "Example Buyer");
  enter("contact-email-input", "buyer@example.org");
  enter("contact-subject-input", "Evidence review");
  enter("contact-message-input", "Please review this public artifact.");
}

function submit() {
  const form = document.querySelector('[data-testid="contact-form"]') as HTMLFormElement;
  expect(form).not.toBeNull();
  act(() => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
}

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root.render(<Contact />); });
  const storeButton = document.querySelector('[data-testid="contact-submit-button"]') as HTMLButtonElement;
  const emailLink = document.querySelector('[data-testid="contact-primary-email-link"]') as HTMLAnchorElement;
  expect(storeButton.textContent).toContain("Store a copy (no email sent)");
  expect(emailLink.getAttribute("href")).toMatch(/^mailto:contact@csoai\.org\?/);
  expect(emailLink.textContent).toContain("press Send in your email app");
  expect(emailLink.compareDocumentPosition(storeButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

afterEach(() => {
  act(() => { root.unmount(); });
  host.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("contact enquiry: real page state transitions", () => {
  it("does not present a receipt for later edits made while a stored request is in flight", async () => {
    let respond!: (result: any) => void;
    const fetchMock = vi.fn((_url: RequestInfo | URL, _init?: RequestInit) => new Promise((resolve) => { respond = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    fill();
    submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.message).toBe("Please review this public artifact.");
    enter("contact-message-input", "I changed this message before the receipt arrived.");

    await act(async () => {
      respond({ status: 202, json: async () => ({ stored: true, receipt_id: id }) });
      await Promise.resolve();
    });

    const status = document.querySelector('[data-testid="contact-submission-status"]');
    expect(status?.textContent).toContain("An earlier version");
    expect(status?.textContent).toContain("subsequent edits were not submitted");
    expect(status?.textContent).toContain(id);
    expect(status?.textContent).toContain("NOT been notified");
    expect((document.querySelector('[data-testid="contact-message-input"]') as HTMLTextAreaElement).value)
      .toBe("I changed this message before the receipt arrived.");
  });

  it("does not turn a transport loss into a false claim of non-storage", async () => {
    let reject!: (error: Error) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((_, fail) => { reject = fail; })));
    fill();
    submit();
    await act(async () => {
      reject(new Error("connection closed after possible write"));
      await Promise.resolve();
    });
    const status = document.querySelector('[data-testid="contact-submission-status"]')?.textContent || "";
    expect(status).toContain("storage are unconfirmed");
    expect(status).toContain("may have reached the server");
    expect(status).not.toContain("nothing was sent");
  });
});
