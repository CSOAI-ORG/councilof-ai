// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContentReviewNotice from "./ContentReviewNotice";

const route = vi.hoisted(() => ({ path: "/courses/1" }));
vi.mock("wouter", () => ({
  useLocation: () => [route.path, vi.fn()],
  Link: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe("working learning routes from withdrawn courses", () => {
  it.each(["/courses/1", "/courses/1/learn", "/my-courses", "/free-course/1"])("offers current reading and exercises from %s", async (path) => {
    route.path = path;
    await act(async () => root.render(<HelmetProvider><ContentReviewNotice /></HelmetProvider>));
    const section = host.querySelector('[data-testid="current-academy-learning"]')!;
    expect(section.textContent).toContain("Legacy course enrollment, payment and completion-record issuance remain closed");
    expect(Array.from(section.querySelectorAll("a"), (anchor) => anchor.getAttribute("href"))).toEqual([
      "/learn?track=board", "/academy/exercises/", "/dashboard?tab=evidence-learning",
    ]);
    expect(host.textContent).not.toContain("Enroll Now");
  });
  it("does not turn unrelated withdrawal notices into a course promotion", async () => {
    route.path = "/trust-center";
    await act(async () => root.render(<HelmetProvider><ContentReviewNotice /></HelmetProvider>));
    expect(host.querySelector('[data-testid="current-academy-learning"]')).toBeNull();
  });
});
