// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AxisLink, { isStaticAxisHref } from "./AxisLink";
import BoardField from "./gspc/BoardField";
import type { AxisRow } from "@/data/axis-sets";

/**
 * The defect (2026-11-13, measured live at 390 and 1440 px): clicking an axis
 * row on /board/ rendered the app's "Page Not Found". The row was a router
 * <Link> to /axis/<axis>/, a static document the app has no route for, so the
 * router kept the click and never fetched the page. A plain anchor leaves the
 * navigation to the browser; in this test that shows as the router's location
 * NOT changing when the anchor is clicked.
 */

let container: HTMLDivElement;
let root: Root;
const swallow = (event: Event) => event.preventDefault(); // jsdom cannot navigate
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  document.addEventListener("click", swallow);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  document.removeEventListener("click", swallow);
  container.remove();
  vi.unstubAllGlobals();
});

function mount(node: React.ReactNode, path = "/board/") {
  const loc = memoryLocation({ path, record: true });
  act(() => root.render(<Router hook={loc.hook}>{node}</Router>));
  return loc;
}

describe("isStaticAxisHref", () => {
  it("names only the published axis documents", () => {
    expect(isStaticAxisHref("/axis/effect-binding/")).toBe(true);
    expect(isStaticAxisHref("/gspc/governance/")).toBe(false);
    expect(isStaticAxisHref(null)).toBe(false);
    expect(isStaticAxisHref(undefined)).toBe(false);
  });
});

describe("AxisLink", () => {
  it("leaves a static /axis/ page to the browser: the router location does not move", () => {
    const loc = mount(<AxisLink href="/axis/effect-binding/">effect-binding</AxisLink>);
    const a = container.querySelector<HTMLAnchorElement>("a")!;
    expect(a.getAttribute("href")).toBe("/axis/effect-binding/");
    act(() => a.click());
    expect(loc.history).toEqual(["/board/"]);
  });

  it("routes a /gspc/ deep-dive page inside the app", () => {
    const loc = mount(<AxisLink href="/gspc/governance/">governance</AxisLink>);
    const a = container.querySelector<HTMLAnchorElement>("a")!;
    expect(a.getAttribute("href")).toBe("/gspc/governance/");
    act(() => a.click());
    expect(loc.history).toEqual(["/board/", "/gspc/governance/"]);
  });

  it("renders no href for an axis that has no public page", () => {
    mount(<AxisLink href={null}>regulator-transparency</AxisLink>);
    const a = container.querySelector<HTMLAnchorElement>("a")!;
    expect(a.hasAttribute("href")).toBe(false);
  });
});

describe("BoardField axis rows", () => {
  const row = (id: string, separation: AxisRow["separation"]): AxisRow =>
    ({
      id,
      name: id,
      status: "MEASURED",
      what: `what ${id} asks`,
      family: null,
      n: 261,
      nUnit: "servers",
      headline: null,
      headlineLabel: "",
      headlineFormat: "pct",
      interval: null,
      measuredOn: null,
      separation,
      runAttestation: null,
    }) as unknown as AxisRow;

  it("a fact-axis row is a plain anchor to its static page, not a router link", () => {
    const loc = mount(<BoardField rows={[row("effect-binding", null), row("governance", "TIE")]} setId="e2e" />);
    const fact = container.querySelector<HTMLAnchorElement>('a[href="/axis/effect-binding/"]');
    expect(fact, "effect-binding row links to its published page").not.toBeNull();
    act(() => fact!.click());
    expect(loc.history).toEqual(["/board/"]);
    const model = container.querySelector<HTMLAnchorElement>('a[href="/gspc/governance/"]');
    expect(model, "governance row links to its in-app deep dive").not.toBeNull();
    act(() => model!.click());
    expect(loc.history).toEqual(["/board/", "/gspc/governance/"]);
  });
});
