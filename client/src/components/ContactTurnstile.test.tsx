// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContactTurnstile from "./ContactTurnstile";

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllEnvs();
  delete (window as any).turnstile;
  vi.restoreAllMocks();
});

describe("optional human verification", () => {
  it("remains disabled and does not inject a widget when no sitekey is configured", () => {
    vi.stubEnv("VITE_CONTACT_TURNSTILE_SITE_KEY", "");
    const onToken = vi.fn();
    act(() => root.render(<ContactTurnstile onToken={onToken} resetRevision={0} />));
    expect(host.textContent).toContain("Optional storage is not configured.");
    expect(document.querySelector('script[src*="turnstile"]')).toBeNull();
    expect(onToken).not.toHaveBeenCalled();
  });

  it("uses the correct action and resets/invalidates a single-use token", () => {
    vi.stubEnv("VITE_CONTACT_TURNSTILE_SITE_KEY", "synthetic-public-sitekey");
    let config: any = null;
    const reset = vi.fn(), remove = vi.fn();
    const render = vi.fn((_element: HTMLElement, options: any) => {
      config = options;
      return "widget-1";
    });
    (window as any).turnstile = { render, reset, remove };
    const onToken = vi.fn();

    act(() => root.render(<ContactTurnstile onToken={onToken} resetRevision={0} />));
    expect(render).toHaveBeenCalledTimes(1);
    expect(config.sitekey).toBe("synthetic-public-sitekey");
    expect(config.action).toBe("contact_enquiry");
    act(() => config.callback("synthetic-token"));
    expect(onToken).toHaveBeenLastCalledWith("synthetic-token");

    act(() => root.render(<ContactTurnstile onToken={onToken} resetRevision={1} />));
    expect(reset).toHaveBeenCalledWith("widget-1");
    expect(onToken).toHaveBeenLastCalledWith("");
    act(() => config["expired-callback"]());
    expect(onToken).toHaveBeenLastCalledWith("");
    act(() => root.unmount());
    root = createRoot(host);
    expect(remove).toHaveBeenCalledWith("widget-1");
  });
});
