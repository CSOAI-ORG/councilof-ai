import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PRIMARY_PATHS } from "@/data/library-ia";
import GamesRuler from "./GamesRuler";

const REPO = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(REPO, p), "utf8");
// Any way a page could reach the network, including the quiet ones.
const NETWORK = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket|EventSource|\.postMessage\(|new\s+Image\s*\(|navigator\.sendBeacon|useGspcBoard|candidateEvidence|submitRulerAdmission/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/games/ruler — the no-network guarantee", () => {
  it("the page and its rules contain no network primitive and do not import the admission submitter", () => {
    for (const file of ["client/src/pages/GamesRuler.tsx", "client/src/lib/ruler.ts"]) {
      expect(read(file), file).not.toMatch(NETWORK);
    }
  });

  it("renders the standing notice and makes no request while rendering", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const html = renderToStaticMarkup(<GamesRuler />);
    expect(html).toContain(
      "Nothing you do here is sent anywhere. Human results are not collected until our data-protection review is complete.",
    );
    expect(html).toContain("Contribute this round (off)");
    expect(html).toMatch(/disabled=""[^>]*>Contribute this round \(off\)/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("says no model grades another, and never claims certification or a price", () => {
    const html = renderToStaticMarkup(<GamesRuler />);
    expect(html).toContain("no model grades another");
    expect(html).not.toMatch(/certif|£|\$\d|€/i);
  });
});

describe("/games/ruler — the four wirings", () => {
  it("is routed, primary, prerendered and has its own head", () => {
    expect(read("client/src/App.tsx")).toMatch(/<Route path="\/games\/ruler" component=\{GamesRuler\} \/>/);
    expect(PRIMARY_PATHS.has("/games/ruler")).toBe(true);
    expect(read("scripts/prerender.mjs")).toContain('"/games/ruler"');
    const head = JSON.parse(read("client/src/data/seo-head.json")).routes["/games/ruler"];
    expect(head.title.length).toBeLessThanOrEqual(60);
    expect(head.description.length).toBeGreaterThanOrEqual(110);
    expect(head.description.length).toBeLessThanOrEqual(160);
  });
});
