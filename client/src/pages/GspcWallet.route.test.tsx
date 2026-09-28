import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import GspcWallet from "./GspcWallet";

const root = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("GSPC wallet guard public route", () => {
  it("is wired into App, route metadata and client-only prerender handling", () => {
    expect(read("client/src/App.tsx")).toContain('const GspcWallet = lazy(() => import("./pages/GspcWallet"));');
    expect(read("client/src/App.tsx")).toContain('<Route path="/wallet" component={GspcWallet} />');
    expect(JSON.parse(read("client/src/data/seo-head.json")).routes["/wallet"]).toBeTruthy();
    expect(read("client/src/data/library-ia.ts")).toContain('"/wallet"');
    expect(read("scripts/prerender.mjs")).toContain('"/wallet"');
  });
  it("renders the wallet boundary without implying payment or GSPC signing", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <Router ssrPath="/wallet">
          <GspcWallet />
        </Router>
      </HelmetProvider>,
    );
    expect(html).toContain("Inspect before you sign.");
    expect(html).toContain("Connect MetaMask");
    expect(html).toContain("A wallet signature is not a GSPC measurement.");
    expect(html).toContain("Board signing keys never enter the browser wallet.");
    expect(html).toContain('href="/pay"');
    expect(html).toContain('href="/gspc-verify"');
  });
});
