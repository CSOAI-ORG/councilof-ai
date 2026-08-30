import { afterEach, describe, expect, it, vi } from "vitest";
import { isOsOpen, isOsProductPath, OS_OPEN_ATTR, setOsOpen } from "./osChrome";

function stubDom() {
  const attrs = new Map<string, string>();
  const documentElement = {
    setAttribute: (k: string, v: string) => { attrs.set(k, v); },
    removeAttribute: (k: string) => { attrs.delete(k); },
    getAttribute: (k: string) => attrs.get(k) ?? null,
    hasAttribute: (k: string) => attrs.has(k),
  };
  vi.stubGlobal("document", { documentElement });
  vi.stubGlobal("window", { dispatchEvent: () => true });
  return documentElement;
}

describe("osChrome", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks the document when Council OS is open", () => {
    const el = stubDom();
    setOsOpen(true);
    expect(isOsOpen()).toBe(true);
    expect(el.getAttribute(OS_OPEN_ATTR)).toBe("1");
  });

  it("treats /os as the product frame, not a marketing page", () => {
    expect(isOsProductPath("/os")).toBe(true);
    expect(isOsProductPath("/os/")).toBe(true);
    expect(isOsProductPath("/os?lobby=assess")).toBe(true);
    expect(isOsProductPath("/")).toBe(false);
    expect(isOsProductPath("/for/startup")).toBe(false);
    expect(isOsProductPath("/gspc-verify")).toBe(false);
  });

  it("clears the mark when the OS closes or minimises", () => {
    const el = stubDom();
    setOsOpen(true);
    setOsOpen(false);
    expect(isOsOpen()).toBe(false);
    expect(el.hasAttribute(OS_OPEN_ATTR)).toBe(false);
  });
});
