// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Council from "./Council";
import CouncilDetail from "./CouncilDetail";
import EarlyAccessLanding from "./EarlyAccessLanding";
import EI3 from "./EI3";
import DriftProduct from "./DriftProduct";
import MCPRegistry from "./MCPRegistry";
import MCPDetail from "./MCPDetail";
import About from "./About";

const mocks = vi.hoisted(() => ({ slug: "fixture-server" }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    council: {
      list: { useQuery: () => ({ data: undefined, isLoading: false }) },
      getSession: { useQuery: () => ({ data: undefined }) },
    },
  },
}));
vi.mock("wouter", async (original) => ({
  ...(await original<typeof import("wouter")>()),
  useSearch: () => "",
  useRoute: () => [true, { slug: mocks.slug }],
}));
vi.mock("@/data/mcpRegistry.json", () => ({
  default: {
    total: 1,
    categories: [{ name: "Fixture", count: 1 }],
    frameworkCounts: [],
    servers: [
      {
        slug: "fixture-server",
        name: "Fixture server",
        description: "A catalogue fixture",
        url: "https://example.org/source",
        category: "Fixture",
        frameworks: [],
        language: "Python",
        builtInHouse: false,
        updatedAt: null,
      },
    ],
  },
}));
beforeEach(() => {
  mocks.slug = "fixture-server";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Unexpected network request");
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function render(component: Parameters<typeof createElement>[0]) {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(createElement(component));
  return host;
}
function assertSingleNavigation(host: HTMLElement, href: string) {
  const anchors = [...host.querySelectorAll<HTMLAnchorElement>("a")].filter(
    (node) => node.getAttribute("href") === href,
  );
  expect(
    anchors.length,
    `destination ${href} remains available`,
  ).toBeGreaterThan(0);
  expect(
    anchors.some((node) => node.className.includes("inline-flex")),
    `destination ${href} retains its button styling`,
  ).toBe(true);
  for (const anchor of anchors)
    expect(anchor.querySelector("button,a,input,select,textarea")).toBeNull();
  expect(host.querySelector("a button,button a,a a,button button")).toBeNull();
}

describe("real routed navigation controls", () => {
  it.each([
    [
      "Council (the /byzantine-consensus redirect destination)",
      Council,
      "/interop/council-independence.json",
    ],
    ["Council detail", CouncilDetail, "/training"],
    ["Start with evidence", EarlyAccessLanding, "/gspc-verify"],
    ["EI3", EI3, "/board"],
    ["Drift audit", DriftProduct, "/contact?subject=drift-audit"],
    ["MCP catalogue", MCPRegistry, "/api-docs"],
    ["MCP detail", MCPDetail, "/gspc-verify/"],
    ["About", About, "/services/"],
  ] as const)(
    "renders %s navigation as a single anchor, with no nested interactive control",
    (_name, component, href) => {
      assertSingleNavigation(render(component), href);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("preserves download behavior, every drift artefact destination and external source attributes", () => {
    const drift = render(DriftProduct);
    for (const href of [
      "/corpus-watch/delta-report-2026-08-01.md",
      "/corpus-watch/delta-report-2026-08-01.md.sig",
      "/corpus-watch/corpus-watch-ed25519.pub",
    ]) {
      const link = [...drift.querySelectorAll("a")].find(
        (node) => node.getAttribute("href") === href,
      )!;
      expect(link.hasAttribute("download")).toBe(true);
      expect(link.querySelector("button")).toBeNull();
    }
    const detail = render(MCPDetail);
    const source = detail.querySelector<HTMLAnchorElement>(
      'a[href="https://example.org/source"]',
    )!;
    expect(source.target).toBe("_blank");
    expect(source.rel).toBe("noopener noreferrer");
    expect(source.textContent).toContain("View source");
    expect(source.querySelector("button")).toBeNull();
  });

  it("keeps the MCP missing-record recovery link usable without a nested button", () => {
    mocks.slug = "missing";
    const host = render(MCPDetail);
    expect(host.textContent).toContain("MCP not found");
    assertSingleNavigation(host, "/mcps");
  });
});

function meaningfulChildren(node: ts.JsxElement) {
  return node.children.filter((child) =>
    ts.isJsxText(child)
      ? Boolean(child.text.trim())
      : ts.isJsxExpression(child)
        ? Boolean(child.expression)
        : true,
  );
}
/** Resolve current Route mounts from App itself; dormant archive files do not become this gate's scope. */
function routedSourceFiles(): string[] {
  const appPath = resolve(__dirname, "../App.tsx");
  const app = ts.createSourceFile(
    appPath,
    readFileSync(appPath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const bindings = new Map<string, string>();
  for (const statement of app.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.importClause?.name &&
      ts.isStringLiteral(statement.moduleSpecifier)
    )
      bindings.set(
        statement.importClause.name.text,
        statement.moduleSpecifier.text,
      );
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations) {
        const imported = declaration.initializer
          ?.getText(app)
          .match(/import\(["'](.+?)["']\)/)?.[1];
        if (imported) bindings.set(declaration.name.getText(app), imported);
      }
  }
  const files = new Set<string>();
  const add = (name: string) => {
    const specifier = bindings.get(name);
    if (!specifier) return;
    const base = specifier.startsWith("@/")
      ? resolve(dirname(appPath), specifier.slice(2))
      : resolve(dirname(appPath), specifier);
    const file = [base, base + ".tsx", base + ".ts"].find((candidate) =>
      existsSync(candidate),
    );
    if (file) files.add(file);
  };
  const walk = (node: ts.Node) => {
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : null;
    if (opening?.tagName.getText(app) === "Route") {
      for (const attr of opening.attributes.properties)
        if (
          ts.isJsxAttribute(attr) &&
          attr.name.getText(app) === "component" &&
          attr.initializer &&
          ts.isJsxExpression(attr.initializer) &&
          attr.initializer.expression
        )
          add(attr.initializer.expression.getText(app));
      if (ts.isJsxElement(node)) {
        const inline = (child: ts.Node) => {
          if (ts.isJsxElement(child))
            add(child.openingElement.tagName.getText(app));
          if (ts.isJsxSelfClosingElement(child))
            add(child.tagName.getText(app));
          ts.forEachChild(child, inline);
        };
        node.children.forEach(inline);
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(app);
  return [...files];
}

it("forbids direct nested link/button controls throughout currently routed component sources", () => {
  const files = routedSourceFiles();
  expect(files.length).toBeGreaterThan(250);
  const violations: string[] = [];
  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const walk = (node: ts.Node) => {
      if (
        ts.isJsxElement(node) &&
        ["a", "Link"].includes(node.openingElement.tagName.getText(source))
      ) {
        const children = meaningfulChildren(node);
        if (
          children.length === 1 &&
          ts.isJsxElement(children[0]) &&
          children[0].openingElement.tagName.getText(source) === "Button"
        )
          violations.push(
            `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`,
          );
      }
      if (
        ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(source) === "Button"
      ) {
        const hasSlot = node.openingElement.attributes.properties.some(
          (attr) =>
            ts.isJsxAttribute(attr) && attr.name.getText(source) === "asChild",
        );
        const children = meaningfulChildren(node);
        if (
          !hasSlot &&
          children.length === 1 &&
          ts.isJsxElement(children[0]) &&
          ["a", "Link"].includes(
            children[0].openingElement.tagName.getText(source),
          )
        )
          violations.push(
            `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1} — missing asChild`,
          );
      }
      ts.forEachChild(node, walk);
    };
    walk(source);
  }
  expect(
    violations,
    "A destination must render one anchor: use Button asChild with Link/a inside",
  ).toEqual([]);
});
