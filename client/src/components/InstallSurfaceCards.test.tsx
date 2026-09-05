import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import InstallSurfaceCards, { EXTENSION_SOURCE_URL } from "./InstallSurfaceCards";

const extensionManifest = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../../extensions/chrome-gspc-verify/manifest.json"),
    "utf8",
  ),
);
const legacySurfaceSources = [
  "../pages/McpFleet.tsx",
  "../pages/Products.tsx",
].map((path) => readFileSync(resolve(__dirname, path), "utf8"));

describe("install surfaces", () => {
  const html = renderToStaticMarkup(<InstallSurfaceCards />);

  it("keeps one coherent discovery block for the app, MCP and extension", () => {
    expect(html).toContain('id="install-surfaces"');
    expect(html).toContain('data-install-surface="web-app"');
    expect(html).toContain('data-install-surface="mcp"');
    expect(html).toContain('data-install-surface="browser-extension"');
    expect(html).toContain("/connect-gspc");
    expect(html).toContain(EXTENSION_SOURCE_URL);
  });

  it("states the two gated release statuses instead of implying publication", () => {
    expect(html).toMatch(/Browser-gated install/);
    expect(html).toMatch(/no native App Store package is published/i);
    expect(html).toMatch(/not published in the Chrome Web Store/i);
    expect(html).toMatch(/Hugging Face model pages/);
    expect(html).not.toMatch(/available in the Chrome Web Store/i);
  });

  it("matches the extension's actual content-script scope", () => {
    expect(extensionManifest.content_scripts).toHaveLength(1);
    expect(extensionManifest.content_scripts[0].matches).toEqual([
      "https://huggingface.co/*",
    ]);
    expect(html).not.toMatch(/overlay(?:s)? (?:on )?.*OpenRouter/i);
    expect(html).not.toMatch(/overlay(?:s)? (?:on )?.*Replicate/i);
  });

  it("retires the dead extension page and its unsupported multi-site claim", () => {
    for (const source of legacySurfaceSources) {
      expect(source).not.toContain('href="/extension/"');
      expect(source).not.toMatch(/overlay(?:s)? badge on Hugging Face, OpenRouter, Replicate/i);
      expect(source).toContain('/dashboard?tab=tools#install-surfaces');
    }
  });
});
