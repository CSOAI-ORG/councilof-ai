// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import registry from "@/data/mcpRegistry.json";
import MCPRegistry from "./MCPRegistry";
import MCPDetail from "./MCPDetail";

const route = vi.hoisted(() => ({ slug: "" }));
vi.mock("wouter", async (original) => ({
  ...(await original<typeof import("wouter")>()),
  useSearch: () => "",
  useRoute: () => [true, { slug: route.slug }],
}));

const declaredTotal = registry.total;
const entryCount = registry.servers.length;
let host: HTMLDivElement;
let root: Root | undefined;
let originalTitle: string;
async function mount(component: ReactNode) {
  root = createRoot(host);
  await act(async () => {
    root!.render(component);
  });
}
function discrepancy() {
  return host.querySelector('[data-testid="mcp-catalogue-count-discrepancy"]');
}
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  route.slug = registry.servers[0].slug;
  originalTitle = document.title;
  host = document.createElement("div");
  document.body.append(host);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Unexpected network request");
    }),
  );
});
afterEach(async () => {
  if (root)
    await act(async () => {
      root!.unmount();
    });
  root = undefined;
  host.remove();
  registry.total = declaredTotal;
  document.title = originalTitle;
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("MCP catalogue source count truth", () => {
  it("labels the published entries separately from discrepant metadata and uses the list count in the title and search", async () => {
    expect(declaredTotal).not.toBe(entryCount);
    await mount(<MCPRegistry />);
    expect(document.title).toBe(
      `MCP server catalogue — ${entryCount} entries | CSOAI`,
    );
    expect(host.textContent).toContain(
      `${entryCount}published catalogue entries`,
    );
    expect(discrepancy()!.textContent).toContain(
      `Declared registry metadata total: ${declaredTotal} entries`,
    );
    expect(discrepancy()!.textContent).toContain(
      "neither count demonstrates endpoint availability",
    );
    expect(
      host.querySelector<HTMLInputElement>(
        'input[aria-label="Search MCP tools"]',
      )!.placeholder,
    ).toBe(`Search ${entryCount} catalogue entries…`);
    expect(host.querySelectorAll('h3 a[href^="/mcps/"]')).toHaveLength(
      entryCount,
    );
    expect(host.textContent).toContain(
      "A catalogue row does not prove a server is reachable",
    );
  });

  it("keeps metadata and full-list observations stable when search filters the rendered rows", async () => {
    await mount(<MCPRegistry />);
    const search = host.querySelector("input")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(search, "no-mcp-has-this-unique-token");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(host.querySelectorAll('h3 a[href^="/mcps/"]')).toHaveLength(0);
    expect(host.textContent).toContain(`Showing 0 of ${entryCount} servers`);
    expect(discrepancy()!.textContent).toContain(
      `Declared registry metadata total: ${declaredTotal} entries`,
    );
    expect(host.textContent).toContain("No MCP servers match your filters.");
    expect(host.textContent).toContain(
      `${entryCount}published catalogue entries`,
    );
  });

  it("uses the full published list for detail navigation while retaining the separate metadata count", async () => {
    await mount(<MCPDetail />);
    expect(host.querySelector("h1")!.textContent).toBe(
      registry.servers[0].name,
    );
    const back = host.querySelector<HTMLAnchorElement>('a[href="/mcps"]')!;
    expect(back.textContent).toContain(`All ${entryCount} catalogue entries`);
    expect(discrepancy()!.textContent).toContain(
      `Declared registry metadata total: ${declaredTotal} entries`,
    );
    expect(discrepancy()!.textContent).toContain(
      "neither count demonstrates endpoint availability",
    );
    expect(host.querySelector('a[href="/gspc-verify/"]')).toBeTruthy();
  });

  it("does not announce a discrepancy when source metadata and the published list agree", async () => {
    registry.total = entryCount;
    await mount(<MCPRegistry />);
    expect(discrepancy()).toBeNull();
    expect(host.textContent).toContain(
      `${entryCount}published catalogue entries`,
    );
  });

  it("renders the real optional-metadata ClaimGuard record without inventing framework, language or install support", async () => {
    const entry = registry.servers.find(
      (server) => server.slug === "claimguard-mcp",
    )!;
    expect(entry).toBeTruthy();
    route.slug = entry.slug;
    await mount(<MCPDetail />);
    expect(host.querySelector("h1")!.textContent).toBe(entry.name);
    expect(host.textContent).toContain("Framework metadata not supplied");
    expect(host.textContent).toContain("Language not supplied");
    expect(host.textContent).toContain(
      "No installation command is confirmed here",
    );
    expect(host.textContent).not.toContain("pip install");
    expect(host.textContent).not.toContain("@smithery/cli");
    expect(host.textContent).not.toContain("Framework-mapped evidence");
    expect(host.querySelector('a[href="/gspc-verify/"]')).toBeTruthy();
    expect(discrepancy()!.textContent).toContain(
      `Declared registry metadata total: ${declaredTotal} entries`,
    );
  });

  it("does not mistake a Python language label and a slug for verified installation metadata", async () => {
    const entry = registry.servers.find(
      (server) => server.language === "Python",
    )!;
    route.slug = entry.slug;
    await mount(<MCPDetail />);
    expect(host.querySelector("h1")!.textContent).toBe(entry.name);
    expect(host.textContent).toContain("Python");
    expect(host.textContent).toContain(
      "Setup metadata has not been supplied for this catalogue entry",
    );
    expect(host.textContent).not.toContain("pip install");
    expect(host.textContent).not.toContain("@smithery/cli");
    expect(host.textContent).not.toContain("PyPI (local / stdio)");
    expect(host.querySelector('a[href="/gspc-verify/"]')).toBeTruthy();
  });

  it("offers every published category as a working filter with the actual matching entry count", async () => {
    await mount(<MCPRegistry />);
    for (const category of new Set(
      registry.servers.map((server) => server.category),
    )) {
      const expected = registry.servers.filter(
        (server) => server.category === category,
      );
      const control = [...host.querySelectorAll("button")].find(
        (node) => node.textContent === `${category} (${expected.length})`,
      );
      expect(
        control,
        `published category ${category} must be reachable`,
      ).toBeTruthy();
      await act(async () => {
        control!.click();
      });
      expect(
        [...host.querySelectorAll('h3 a[href^="/mcps/"]')].map((node) =>
          node.getAttribute("href"),
        ),
      ).toEqual(expected.map((server) => `/mcps/${server.slug}`));
      expect(host.textContent).toContain(
        `Showing ${expected.length} of ${entryCount} servers`,
      );
    }
    const all = [...host.querySelectorAll("button")].find(
      (node) => node.textContent === `All (${entryCount})`,
    )!;
    await act(async () => {
      all.click();
    });
    expect(host.querySelectorAll('h3 a[href^="/mcps/"]')).toHaveLength(
      entryCount,
    );
  });

  it("labels category metadata separately from published category observations, preserving absent counts", async () => {
    await mount(<MCPRegistry />);
    const publishedCategories = new Set(
      registry.servers.map((server) => server.category),
    );
    const note = host.querySelector(
      '[data-testid="mcp-category-count-discrepancy"]',
    )!;
    expect(note.textContent).toContain(
      `Published entry categories: ${publishedCategories.size}`,
    );
    expect(note.textContent).toContain(
      `Declared category metadata: ${registry.categories.length} categories`,
    );
    expect(host.textContent).toContain(
      `${publishedCategories.size}published categories`,
    );
    for (const declared of registry.categories) {
      const count = registry.servers.filter(
        (server) => server.category === declared.name,
      ).length;
      if (count !== declared.count) {
        expect(note.textContent).toContain(
          `${declared.name} — published entries: ${count}; declared metadata: ${declared.count}`,
        );
      }
    }
    const governance = [...note.querySelectorAll("li")].find((node) =>
      node.textContent?.startsWith("Governance —"),
    )!;
    expect(governance.textContent).toContain("declared metadata: not supplied");
    expect(governance.textContent).not.toContain("declared metadata: 0");
  });

  it("gives source-documentation guidance without implying catalogue-wide package or registry availability", async () => {
    await mount(<MCPRegistry />);
    const guidance = host.querySelector('[data-testid="mcp-setup-guidance"]')!;
    expect(guidance.textContent).toContain(
      "Verified setup metadata has not been supplied",
    );
    expect(guidance.textContent).toContain(
      "does not confirm a package or registry listing",
    );
    expect(guidance.textContent).toContain("inspect its source documentation");
    expect(guidance.textContent).toContain("where available");
    expect(guidance.textContent).toContain(
      "no installation command is confirmed here",
    );
    expect(host.textContent).not.toContain("pip install");
    expect(host.textContent).not.toContain("@smithery/cli");
    expect(host.querySelectorAll('h3 a[href^="/mcps/"]')).toHaveLength(
      entryCount,
    );
  });
});
