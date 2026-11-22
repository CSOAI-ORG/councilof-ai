// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { AXES } from "./gspcAxes";
import { GSPC_BOARD_PAGE, gspcAxisApiUrl, gspcAxisDatasets, gspcAxisPageDataset, gspcAxisPageUrl } from "./datasetSchema";
import { useHeadJsonLd } from "./headJsonLd";
import { prerenderGspcRoutes, routeFor } from "../../../scripts/surface/axis-route-gate.mjs";

// The /gspc/<axis>/ pages the sitemap lists: the route map's model-comparison routes that the
// prerender snapshots (scripts/generate-sitemap.mjs derives the same set).
const routes = JSON.parse(readFileSync("public/interop/axis-routes.json", "utf8")).axes as { axis: string; kind: string; public_pages?: string }[];
const prerendered = prerenderGspcRoutes(readFileSync("scripts/prerender.mjs", "utf8"));
const listed = routes.map((r) => ({ axis: r.axis, route: routeFor(r) })).filter((r) => r.route?.startsWith("/gspc/") && prerendered.has(r.route));

describe("axis deep-dive Dataset node (/gspc/<axis>/)", () => {
  it("every sitemap-listed axis page has its own node that meets the Dataset search rules", () => {
    expect(listed.length).toBeGreaterThan(0);
    for (const { axis } of listed) {
      const n = gspcAxisPageDataset(axis) as Record<string, any>;
      expect(n, axis).not.toBeNull();
      expect(n["@type"]).toBe("Dataset");
      expect(n.name).toBeTruthy();
      expect(n.description.length).toBeGreaterThanOrEqual(50);
      expect(n.description.length).toBeLessThanOrEqual(5000);
      expect(n.creator?.name).toBeTruthy();
      expect(n.license).toMatch(/^https:\/\/creativecommons\.org\//);
      expect(n.url).toBe(gspcAxisPageUrl(axis));
      expect(n["@id"]).toBe(`${gspcAxisPageUrl(axis)}#dataset`);
      expect(n.isPartOf["@id"]).toBe(`${GSPC_BOARD_PAGE}#dataset`);
      expect(n.distribution).toEqual([expect.objectContaining({ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: gspcAxisApiUrl(axis) })]);
    }
  });

  it("is the same registry node the board's hasPart carries, re-pointed at the page", () => {
    const parts = gspcAxisDatasets();
    for (const { axis } of listed) {
      const n = gspcAxisPageDataset(axis) as Record<string, any>;
      const part = parts.find((p) => p.sameAs === n.sameAs) as Record<string, any>;
      expect(part, axis).toBeTruthy();
      for (const k of ["name", "license", "creator", "measurementTechnique", "variableMeasured", "isPartOf", "identifier"]) expect(n[k]).toEqual(part[k]);
      // The page description starts with the registry's task text and adds no number of its own.
      expect(n.description.startsWith(part.description)).toBe(true);
      const a = AXES.find((x) => x.axis === axis)!;
      const added = n.description.slice(part.description.length).split(a.bench).join("").split(a.dataset!).join("").split(axis).join("");
      expect(added).not.toMatch(/\d/);
    }
  });

  it("emits no node for an axis without a published bank, an unknown axis, or an owner-gated route", () => {
    for (const a of AXES.filter((x) => !x.dataset)) expect(gspcAxisPageDataset(a.axis)).toBeNull();
    expect(gspcAxisPageDataset("not-an-axis")).toBeNull();
    expect(routeFor({ axis: "governance", kind: "model-comparison", public_pages: "HIDDEN_PENDING_OWNER_GO" })).toBeNull();
    for (const r of routes.filter((x) => x.public_pages === "HIDDEN_PENDING_OWNER_GO")) expect(listed.some((l) => l.axis === r.axis)).toBe(false);
  });
});

describe("useHeadJsonLd", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const sel = 'head script[type="application/ld+json"][data-page-schema="dataset"]';
  const Probe = ({ n }: { n: object | null }) => { useHeadJsonLd("dataset", n); return null; };
  const mount = async (n: object | null) => {
    const root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => { root.render(createElement(Probe, { n })); });
    return {
      rerender: (m: object | null) => act(async () => { root.render(createElement(Probe, { n: m })); }),
      unmount: () => act(async () => root.unmount()),
    };
  };
  const urlInHead = () => JSON.parse(document.querySelector(sel)!.textContent!).url;

  it("puts one node in <head>, adopts an identical prerendered copy, and removes it on unmount", async () => {
    const node = gspcAxisPageDataset("governance")!;
    const pre = document.createElement("script");
    pre.type = "application/ld+json";
    pre.setAttribute("data-page-schema", "dataset");
    pre.text = JSON.stringify(node).replace(/</g, "\\u003c");
    document.head.appendChild(pre);
    const page = await mount(node);
    expect(document.querySelectorAll(sel)).toHaveLength(1);
    expect(document.querySelector(sel)).toBe(pre);
    expect(urlInHead()).toBe(gspcAxisPageUrl("governance"));
    await page.unmount();
    expect(document.querySelectorAll(sel)).toHaveLength(0);
  });

  it("replaces a different node of the same kind rather than doubling it, and does nothing for null", async () => {
    const page = await mount(gspcAxisPageDataset("care"));
    expect(urlInHead()).toBe(gspcAxisPageUrl("care"));
    await page.rerender(gspcAxisPageDataset("affect"));
    expect(document.querySelectorAll(sel)).toHaveLength(1);
    expect(urlInHead()).toBe(gspcAxisPageUrl("affect"));
    await page.rerender(null);
    expect(document.querySelectorAll(sel)).toHaveLength(0);
    await page.unmount();
  });
});
